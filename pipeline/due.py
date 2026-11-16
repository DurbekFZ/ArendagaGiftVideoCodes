"""Decide whether a post is due now. Standard library only, so it runs before anything is installed.

GitHub starts scheduled workflows late, sometimes by hours, so the workflow wakes
every hour and this decides by what has already been posted today rather than by
the hour it happened to wake at.

Usage: python3 -m pipeline.due   -> prints "true" or "false"
"""
import datetime
import json
import os
import pathlib

STATE = pathlib.Path(__file__).resolve().parent.parent / "state" / "posts.json"
OFFSET = datetime.timedelta(hours=5)  # Tashkent
# Local hours at which the day's posts should go out.
TARGETS = {2: [12.75, 21.6], 3: [8.4, 13.2, 21.6], 4: [8.4, 12.75, 18.2, 21.6]}
MIN_GAP = datetime.timedelta(hours=3)


def due(posts: list[dict], now: datetime.datetime, per_day: int) -> bool:
    local = now + OFFSET
    hour = local.hour + local.minute / 60
    passed = sum(target <= hour for target in TARGETS.get(per_day, TARGETS[2]))
    times = [datetime.datetime.fromisoformat(post["published_at"]) for post in posts]
    today = sum((time + OFFSET).date() == local.date() for time in times)
    recent = any(now - time < MIN_GAP for time in times)
    return passed > today and not recent


if __name__ == "__main__":
    posts = json.loads(STATE.read_text()) if STATE.exists() else []
    now = datetime.datetime.now(datetime.timezone.utc)
    print(str(due(posts, now, int(os.environ.get("POSTS_PER_DAY") or 2))).lower())
