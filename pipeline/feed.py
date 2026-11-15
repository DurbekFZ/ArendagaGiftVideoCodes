"""Read the rentable catalogue from the ArendagaGift marketing feed."""
import json
import pathlib
import urllib.request

from . import config

FIELDS = {"id", "slug", "title", "number", "dailyPrice", "discounts", "status"}


def parse(payload: dict) -> list[dict]:
    items = []
    for item in payload.get("items", []):
        if not FIELDS <= item.keys() or item["status"] not in ("available", "rented"):
            raise ValueError("unexpected feed item")
        items.append({key: item[key] for key in FIELDS})
    return items


def fetch() -> list[dict]:
    if config.FEED_FILE:  # local development and tests
        return parse(json.loads(pathlib.Path(config.FEED_FILE).read_text()))
    if not config.FEED_TOKEN:
        raise RuntimeError("MARKETING_FEED_TOKEN is not set")
    request = urllib.request.Request(config.FEED_URL, headers={
        "Authorization": f"Bearer {config.FEED_TOKEN}", "User-Agent": "arendagagift-reels"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return parse(json.load(response))


def month_discount(item: dict) -> int:
    """Percent off for a 30-day rental (last of the four discount bands)."""
    return int(item["discounts"][3])
