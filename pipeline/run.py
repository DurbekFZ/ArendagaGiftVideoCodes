"""Command line entry point.

    python -m pipeline.run plan      choose the next video        -> out/plan.json
    python -m pipeline.run render    render it                    -> out/<name>.mp4, .jpg
    python -m pipeline.run publish   post it and record the post  -> state/posts.json
    python -m pipeline.run metrics   refresh insights and scores  -> state/posts.json

`publish` without Instagram credentials is a dry run: nothing is posted and
nothing is recorded, so the rendered video can be reviewed as a build artifact.
"""
import datetime
import json
import pathlib
import random
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
    chosen = plan.make(feed.fetch(), posts, random.Random())
    local = now() + datetime.timedelta(hours=config.TIMEZONE_OFFSET_HOURS)
    chosen["name"] = f"{local:%Y%m%d-%H%M}-{chosen['style']}"
    chosen["slot_hour"] = local.hour
    config.OUT.mkdir(exist_ok=True)
    PLAN.write_text(json.dumps(chosen, ensure_ascii=False, indent=1))
    print(f"plan: {chosen['style']}/{chosen['hook']} gifts={chosen['gifts']}")


def do_render() -> None:
    chosen = json.loads(PLAN.read_text())
    chosen.update(render.render(chosen, chosen["name"]))
    PLAN.write_text(json.dumps(chosen, ensure_ascii=False, indent=1))
    print(f"rendered: {chosen['video']} ({chosen['seconds']}s)")


def do_publish() -> None:
    chosen = json.loads(PLAN.read_text())
    if not (config.IG_ACCESS_TOKEN and config.IG_USER_ID):
        print("dry run: Instagram credentials are not set, nothing was published")
        return
    video = pathlib.Path(chosen["video"])
    base = config.MEDIA_BASE_URL
    result = instagram.publish(
        video, chosen["caption"],
        video_url=f"{base}/{video.name}" if base and config.IG_LOGIN == "instagram" else None,
        cover_url=f"{base}/{pathlib.Path(chosen['cover_file']).name}" if base else None,
        thumb_offset_ms=chosen["hero_ms"])
    posts = plan.load_posts(config.STATE)
    posts.append({"name": chosen["name"], "published_at": now().isoformat(timespec="seconds"),
                  "style": chosen["style"], "hook": chosen["hook"], "gifts": chosen["gifts"],
                  "slot_hour": chosen["slot_hour"], "seconds": chosen["seconds"],
                  "media_id": result["media_id"], "permalink": result["permalink"], "metrics": None, "score": None})
    save_posts(posts)
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
        updated += 1
    save_posts(posts)
    print(f"metrics updated for {updated} posts")


COMMANDS = {"plan": do_plan, "render": do_render, "publish": do_publish, "metrics": do_metrics}

if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in COMMANDS:
        sys.exit(__doc__)
    COMMANDS[sys.argv[1]]()
