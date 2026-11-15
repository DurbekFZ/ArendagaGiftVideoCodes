"""Command line entry point.

    python -m pipeline.run plan      choose the next video        -> out/plan.json
    python -m pipeline.run render    render it                    -> out/<name>.mp4, .jpg
    python -m pipeline.run publish   post it and record the post  -> state/posts.json
    python -m pipeline.run metrics   refresh insights and scores  -> state/posts.json
    python -m pipeline.run check     test the Instagram connection without posting

`publish` without Instagram credentials is a dry run: nothing is posted and
nothing is recorded, so the rendered video can be reviewed as a build artifact.
"""
import datetime
import json
import pathlib
import random
import subprocess
import sys

from . import bandit, config, feed, instagram, plan, render

PLAN = config.OUT / "plan.json"
SCORE_AFTER_HOURS = 3
SCORE_UNTIL_DAYS = 14


def now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)


def save_posts(posts: list[dict]) -> None:
    config.STATE.parent.mkdir(exist_ok=True)
    config.STATE.write_text(json.dumps(posts, ensure_ascii=False, indent=1) + "\n")


def do_plan() -> None:
    posts = plan.load_posts(config.STATE)
    catalog = feed.fetch()
    # A hand-made video from the queue comes first; the template library is the fallback.
    chosen = plan.from_queue(config.QUEUE, catalog, posts) or plan.make(catalog, posts, random.Random())
    local = now() + datetime.timedelta(hours=config.TIMEZONE_OFFSET_HOURS)
    chosen["name"] = f"{local:%Y%m%d-%H%M}-{chosen.get('queue_id') or chosen['style']}"
    chosen["slot_hour"] = local.hour
    config.OUT.mkdir(exist_ok=True)
    PLAN.write_text(json.dumps(chosen, ensure_ascii=False, indent=1))
    print(f"plan: {chosen['style']}/{chosen['hook']} gifts={chosen['gifts']}")


def do_render() -> None:
    chosen = json.loads(PLAN.read_text())
    try:
        chosen.update(render.render(chosen, chosen["name"]))
    except subprocess.CalledProcessError:
        if chosen["style"] != "custom":
            raise
        # A broken hand-made video must not leave the account silent: use a template instead.
        print(f"::warning::custom video {chosen['queue_id']} failed to render; falling back to a template")
        keep = {key: chosen[key] for key in ("name", "slot_hour")}
        chosen = plan.make(feed.fetch(), plan.load_posts(config.STATE), random.Random())
        chosen.update(keep)
        chosen["name"] = chosen["name"].rsplit("-", 1)[0] + "-" + chosen["style"]
        chosen.update(render.render(chosen, chosen["name"]))
    PLAN.write_text(json.dumps(chosen, ensure_ascii=False, indent=1))
    print(f"rendered: {chosen['video']} ({chosen['seconds']}s)")


def media_urls(chosen: dict) -> dict:
    base, video = config.MEDIA_BASE_URL, pathlib.Path(chosen["video"])
    return {"video_url": f"{base}/{video.name}" if base else None,
            "cover_url": f"{base}/{pathlib.Path(chosen['cover_file']).name}" if base else None,
            "thumb_offset_ms": chosen["hero_ms"]}


def do_check() -> None:
    """Prove the Instagram connection end to end without posting anything."""
    print(f"token kind: {config.IG_LOGIN} login, {len(config.IG_ACCESS_TOKEN)} characters; account id set: {bool(config.IG_USER_ID)}")
    profile = instagram.account()
    print(f"account: @{profile.get('username')} followers={profile.get('followers_count')} posts={profile.get('media_count')}")
    chosen = json.loads(PLAN.read_text())
    container_id = instagram.prepare(pathlib.Path(chosen["video"]), chosen["caption"], **media_urls(chosen))
    print(f"Instagram accepted and processed the video (container {container_id}); nothing was published")


def do_publish() -> None:
    chosen = json.loads(PLAN.read_text())
    if not config.IG_ACCESS_TOKEN:
        print("dry run: Instagram credentials are not set, nothing was published")
        return
    result = instagram.publish(pathlib.Path(chosen["video"]), chosen["caption"], **media_urls(chosen))
    posts = plan.load_posts(config.STATE)
    posts.append({"name": chosen["name"], "published_at": now().isoformat(timespec="seconds"),
                  "style": chosen["style"], "hook": chosen["hook"], "gifts": chosen["gifts"],
                  "slot_hour": chosen["slot_hour"], "seconds": chosen["seconds"],
                  "media_id": result["media_id"], "permalink": result["permalink"], "metrics": None, "score": None,
                  "comments": [], "queue_id": chosen.get("queue_id"), "concept": chosen.get("concept")})
    save_posts(posts)
    if chosen.get("queue_id"):
        (config.QUEUE / f"{chosen['queue_id']}.json").unlink(missing_ok=True)
    print(f"published: {result['permalink']}")


def do_metrics() -> None:
    posts = plan.load_posts(config.STATE)
    updated = 0
    for post in posts:
        age = now() - datetime.datetime.fromisoformat(post["published_at"])
        if not (datetime.timedelta(hours=SCORE_AFTER_HOURS) <= age <= datetime.timedelta(days=SCORE_UNTIL_DAYS)):
            continue
        try:
            post["metrics"] = instagram.insights(post["media_id"])
        except instagram.ApiError as error:  # a deleted post must not block the others
            print(f"metrics skipped for {post['name']}: {error}")
            continue
        post["score"] = round(bandit.score(post["metrics"], post["seconds"]), 2)
        try:
            post["comments"] = instagram.comments(post["media_id"])
        except instagram.ApiError as error:  # comment access is optional
            print(f"comments skipped for {post['name']}: {error}")
        updated += 1
    save_posts(posts)
    try:
        profile = instagram.account()
        history = json.loads(config.ACCOUNT.read_text()) if config.ACCOUNT.exists() else []
        history.append({"at": now().isoformat(timespec="seconds"), "followers": profile.get("followers_count"),
                        "media": profile.get("media_count")})
        config.ACCOUNT.write_text(json.dumps(history[-400:], indent=1) + "\n")
    except instagram.ApiError as error:
        print(f"account snapshot skipped: {error}")
    print(f"metrics updated for {updated} posts")


COMMANDS = {"plan": do_plan, "render": do_render, "publish": do_publish, "metrics": do_metrics, "check": do_check}

if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in COMMANDS:
        sys.exit(__doc__)
    COMMANDS[sys.argv[1]]()
