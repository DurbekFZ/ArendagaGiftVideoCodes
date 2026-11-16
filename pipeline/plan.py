"""Decide what the next video is: style, hook, gifts, caption."""
import json
import random

from . import bandit, gifts as gift_pages, styles

RECENT_GIFTS = 6  # avoid featuring a gift again within this many posts


def load_posts(path) -> list[dict]:
    return json.loads(path.read_text()) if path.exists() else []


def pick_style(posts: list[dict], available: int, rng: random.Random) -> tuple[str, str]:
    last = posts[-1]["style"] if posts else None
    arms = [name for name, style in styles.STYLES.items() if style["count"] <= available and name != last]
    if not arms:
        raise RuntimeError("no style fits the available gifts")
    style = bandit.choose(arms, bandit.posterior(posts, lambda post: post["style"]), rng)
    hooks = [f"{style}:{hook}" for hook in styles.STYLES[style]["hooks"]]
    table = bandit.posterior(posts, lambda post: f"{post['style']}:{post['hook']}")
    return style, bandit.choose(hooks, table, rng).split(":", 1)[1]


def freshness(posts: list[dict]) -> dict[str, int]:
    """Posts since each gift was last featured (missing = never)."""
    seen: dict[str, int] = {}
    for age, post in enumerate(reversed(posts)):
        for gift_id in post.get("gifts", []):
            seen.setdefault(gift_id, age)
    return seen


def pick_gifts(style: str, hook: str, catalog: list[dict], posts: list[dict], rng: random.Random,
               describe=gift_pages.describe) -> list[dict]:
    available = [item for item in catalog if item["status"] == "available"]
    count = styles.STYLES[style]["count"]
    if len(available) < count:
        raise RuntimeError("not enough available gifts")
    seen = freshness(posts)
    if style == "top3":
        if hook == "cheapest":
            ranked = sorted(available, key=lambda item: (item["dailyPrice"], item["id"]))[:3]
            chosen = [dict(item, **describe(item["slug"])) for item in ranked]
            return chosen[::-1]  # third, second, first place
        described = [dict(item, **describe(item["slug"])) for item in available]
        described.sort(key=lambda item: (item["model"]["rarity"] if item["model"] and item["model"]["rarity"] is not None
                                         else 100, item["id"]))
        return described[:3][::-1]
    fresh = [item for item in available if seen.get(item["id"], RECENT_GIFTS) >= RECENT_GIFTS] or available
    oldest = max(seen.get(item["id"], 10**6) for item in fresh)
    pool = [item for item in fresh if seen.get(item["id"], 10**6) == oldest]
    item = rng.choice(sorted(pool, key=lambda entry: entry["id"]))
    return [dict(item, **describe(item["slug"]))]


def from_queue(queue_dir, catalog: list[dict], posts: list[dict]) -> dict | None:
    """The oldest hand-made video that is not posted yet, not on hold, and whose gifts are all free to rent."""
    posted = {post.get("queue_id") for post in posts}
    available = {item["id"] for item in catalog if item["status"] == "available"}
    items = [json.loads(path.read_text()) for path in sorted(queue_dir.glob("*.json"))]
    # The owner can move a video to the front with "priority"; otherwise oldest id first.
    for item in sorted(items, key=lambda entry: (-entry.get("priority", 0), entry["id"])):
        gift_ids = [slug.lower() for slug in item["slugs"]]
        if item.get("hold") or item["id"] in posted or not set(gift_ids) <= available:
            continue
        return {"style": "custom", "hook": item["id"], "queue_id": item["id"], "gifts": gift_ids,
                "slugs": item["slugs"], "caption": item["caption"], "composition": item["id"], "props": {},
                "cover_composition": f"{item['id']}Cover", "cover": {}, "hero_ms": item["hero_ms"],
                "voice": item.get("voice"), "music": item.get("music"), "concept": item.get("concept")}
    return None


def make(catalog: list[dict], posts: list[dict], rng: random.Random, describe=gift_pages.describe) -> dict:
    available = sum(item["status"] == "available" for item in catalog)
    style, hook = pick_style(posts, available, rng)
    chosen = pick_gifts(style, hook, catalog, posts, rng, describe)
    built = styles.STYLES[style]["build"](chosen, hook, rng)
    return {"style": style, "hook": hook, "gifts": [gift["id"] for gift in chosen],
            "slugs": [gift["slug"] for gift in chosen], "caption": styles.caption(style, chosen, rng), **built}
