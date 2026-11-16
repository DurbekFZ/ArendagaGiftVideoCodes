"""Decide whether a post is due now. Standard library only, so it runs before anything is installed.

GitHub starts scheduled workflows late, sometimes by hours, so the workflow wakes
every hour and this decides by what has already been posted today rather than by
the hour it happened to wake at.

Usage: python3 -m pipeline.due            is a scheduled post due?   -> "true" or "false"
       python3 -m pipeline.due arrival    post a just-pushed queue entry now?
"""
import datetime
import json
import os
import pathlib
import sys

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


def on_arrival(posts: list[dict], now: datetime.datetime, per_day: int, queue: list[dict]) -> bool:
    """A queue entry was just pushed: post it now unless today's quota is already used."""
    local = now + OFFSET
    today = sum((datetime.datetime.fromisoformat(post["published_at"]) + OFFSET).date() == local.date() for post in posts)
    return today < per_day and any(not item.get("hold") for item in queue)


if __name__ == "__main__":
    posts = json.loads(STATE.read_text()) if STATE.exists() else []
    now = datetime.datetime.now(datetime.timezone.utc)
    per_day = int(os.environ.get("POSTS_PER_DAY") or 2)
    if sys.argv[1:] == ["arrival"]:
        queue = [json.loads(path.read_text()) for path in (STATE.parent.parent / "queue").glob("*.json")]
        print(str(on_arrival(posts, now, per_day, queue)).lower())
    else:
        print(str(due(posts, now, per_day)).lower())
