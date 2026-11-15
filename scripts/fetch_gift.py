"""Fetch one Telegram NFT gift by slug and prepare render assets.

Usage: python3 -I scripts/fetch_gift.py MoonPendant-95850 [more slugs...]
Writes public/gifts/<id>/{gift.json,pattern.json,meta.json}.
Everything is derived from public Telegram/Fragment pages; no credentials.
"""
import copy
import html
import json
import pathlib
import re
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent / "public" / "gifts"
SLUG = re.compile(r"[A-Za-z][A-Za-z0-9]*-[1-9][0-9]{0,12}")
UA = {"User-Agent": "Mozilla/5.0 (compatible; reels-renderer)"}


def get(url: str, limit: int = 8 * 1024 * 1024) -> bytes:
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as response:
        data = response.read(limit + 1)
    if len(data) > limit:
        raise ValueError(f"response too large: {url}")
    return data


def attribute(page: str, name: str):
    match = re.search(rf"<th>{name}</th><td>(.*?)</td>", page, re.S)
    if not match:
        return None
    cell = match.group(1)
    rarity = re.search(r"<mark>([\d.]+)%</mark>", cell)
    label = html.unescape(re.sub(r"<[^>]+>", "", cell.split("<mark>")[0])).strip()
    return {"name": label, "rarity": float(rarity.group(1)) if rarity else None}


def prepare(slug: str) -> dict:
    if not SLUG.fullmatch(slug):
        raise ValueError(f"bad slug: {slug}")
    gift_id = slug.lower()
    page = get(f"https://t.me/nft/{slug}").decode("utf-8", "replace")
    animation = json.loads(get(f"https://nft.fragment.com/gift/{gift_id}.lottie.json"))

    title = re.search(r'<meta property="og:title" content="([^"]*)"', page)
    stops = re.findall(r'<stop stop-color="(#[0-9a-fA-F]{6})"', page)
    pattern_color = re.search(r'flood-color="(#[0-9a-fA-F]{6})"', page)
    if not title or len(stops) < 2:
        raise ValueError(f"unexpected gift page: {slug}")
    name, _, number = html.unescape(title.group(1)).rpartition(" #")

    layers = {layer.get("nm"): layer for layer in animation["layers"]}
    if "Gift" not in layers:
        raise ValueError(f"unexpected animation layout: {slug}")
    gift = copy.deepcopy(animation)
    gift["layers"] = [layers["Gift"]]
    pattern = copy.deepcopy(animation)
    pattern["layers"] = [layers[n] for n in ("Pattern", "Color Icon") if n in layers]

    meta = {
        "id": gift_id, "slug": slug, "title": name, "number": int(number),
        "url": f"https://t.me/nft/{slug}",
        "model": attribute(page, "Model"), "backdrop": attribute(page, "Backdrop"),
        "symbol": attribute(page, "Symbol"),
        "colors": {"center": stops[0], "edge": stops[1],
                   "pattern": pattern_color.group(1) if pattern_color else stops[1]},
        "fps": animation.get("fr", 60),
        "inPoint": animation.get("ip", 0), "outPoint": animation.get("op", 180),
    }
    target = ROOT / gift_id
    target.mkdir(parents=True, exist_ok=True)
    (target / "gift.json").write_text(json.dumps(gift, separators=(",", ":")))
    (target / "pattern.json").write_text(json.dumps(pattern, separators=(",", ":")))
    (target / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2))
    return meta


if __name__ == "__main__":
    for item in sys.argv[1:]:
        result = prepare(item)
        print(result["id"], result["title"], result["model"], result["colors"])
