"""Planning, learning and publishing logic, without network access."""
import json
import pathlib
import random

import pytest

from pipeline import bandit, feed, instagram, plan, styles

CATALOG = feed.parse(json.loads((pathlib.Path(__file__).parent / "sample_feed.json").read_text()))
RARITY = {"ChillFlame-164026": 3.0, "MoonPendant-95850": 3.0, "JingleBells-64028": 0.3, "ViceCream-48461": 1.5}


def describe(slug):
    return {"id": slug.lower(), "slug": slug, "model": {"name": "Model", "rarity": RARITY[slug]}}


def post(style, hook, score, gifts=("x-1",)):
    return {"style": style, "hook": hook, "gifts": list(gifts), "score": score}


def test_feed_rejects_unexpected_items():
    with pytest.raises(ValueError):
        feed.parse({"items": [{"id": "a-1"}]})


def test_every_style_builds_a_complete_plan():
    for style, spec in styles.STYLES.items():
        for hook in spec["hooks"]:
            rng = random.Random(1)
            chosen = plan.pick_gifts(style, hook, CATALOG, [], rng, describe)
            built = spec["build"](chosen, hook, rng)
            assert len(chosen) == spec["count"]
            assert built["composition"] and built["props"] and built["cover"]["headline"]
            assert "@ArendagaGiftBot" in styles.caption(style, chosen, rng)


def test_rented_gifts_are_never_advertised():
    for seed in range(40):
        made = plan.make(CATALOG, [], random.Random(seed), describe)
        assert "candycane-194062" not in made["gifts"]


def test_style_is_not_repeated_back_to_back():
    for seed in range(40):
        style, _ = plan.pick_style([post("luxe", "ask", None)], 4, random.Random(seed))
        assert style != "luxe"


def test_top3_orders_third_second_first():
    rarest = plan.pick_gifts("top3", "rarest", CATALOG, [], random.Random(0), describe)
    assert [gift["id"] for gift in rarest][-1] == "jinglebells-64028"
    cheapest = plan.pick_gifts("top3", "cheapest", CATALOG, [], random.Random(0), describe)
    assert [gift["dailyPrice"] for gift in cheapest] == [1200, 900, 750]


def test_recently_featured_gift_waits_its_turn():
    posts = [post("luxe", "ask", None, ["chillflame-164026"]), post("chat", "friend", None, ["moonpendant-95850"]),
             post("steps", "open", None, ["vicecream-48461"])]
    for seed in range(20):
        chosen = plan.pick_gifts("showcase", "no_buy", CATALOG, posts, random.Random(seed), describe)
        assert chosen[0]["id"] == "jinglebells-64028"


def test_bandit_prefers_the_style_that_performs():
    posts = [post("luxe", "ask", 900 + i) for i in range(12)] + [post("steps", "open", 10 + i) for i in range(12)]
    table = bandit.posterior(posts, lambda entry: entry["style"])
    rng = random.Random(3)
    wins = sum(bandit.choose(["luxe", "steps"], table, rng) == "luxe" for _ in range(200))
    assert wins > 180


def test_bandit_still_tries_unseen_styles():
    posts = [post("luxe", "ask", 100 + i) for i in range(10)]
    table = bandit.posterior(posts, lambda entry: entry["style"])
    rng = random.Random(5)
    assert any(bandit.choose(["luxe", "chat"], table, rng) == "chat" for _ in range(50))


def test_score_rewards_watch_time_and_sharing():
    base = {"views": 1000, "ig_reels_avg_watch_time": 3000, "reels_skip_rate": 60}
    watched = dict(base, ig_reels_avg_watch_time=9000, reels_skip_rate=20)
    assert bandit.score(watched, 10) > bandit.score(base, 10)
    assert bandit.score(dict(base, shares=10), 10) > bandit.score(base, 10)


def test_publish_with_hosted_video(monkeypatch):
    calls = []
    monkeypatch.setattr(instagram.config, "IG_LOGIN", "instagram")
    monkeypatch.setattr(instagram.config, "IG_ACCOUNT", "42")
    monkeypatch.setattr(instagram, "wait_public", lambda url: calls.append(("public", url)))
    def fake(method, path, params=None):
        calls.append((method, path, params))
        if path == "42/media":
            return {"id": "c1"}
        if path == "c1":
            return {"status_code": "FINISHED"}
        if path == "42/media_publish":
            return {"id": "m1"}
        return {"permalink": "https://www.instagram.com/reel/x/"}
    monkeypatch.setattr(instagram, "call", fake)
    result = instagram.publish(pathlib.Path("v.mp4"), "matn", video_url="https://h/v.mp4", cover_url="https://h/v.jpg",
                               thumb_offset_ms=3000)
    assert result == {"media_id": "m1", "permalink": "https://www.instagram.com/reel/x/"}
    created = calls[2][2]
    assert created["media_type"] == "REELS" and created["video_url"] == "https://h/v.mp4"
    assert created["cover_url"] == "https://h/v.jpg" and "thumb_offset" not in created and "upload_type" not in created


def test_publish_with_direct_upload_uses_thumbnail_offset(monkeypatch, tmp_path):
    created, uploaded = {}, []
    monkeypatch.setattr(instagram.config, "IG_LOGIN", "facebook")
    monkeypatch.setattr(instagram.config, "IG_ACCOUNT", "42")
    monkeypatch.setattr(instagram, "upload", lambda uri, video: uploaded.append(uri))
    def fake(method, path, params=None):
        if path == "42/media":
            created.update(params)
            return {"id": "c1", "uri": "https://rupload.facebook.com/ig-api-upload/v27.0/c1"}
        return {"status_code": "FINISHED", "id": "m1", "permalink": "p"}
    monkeypatch.setattr(instagram, "call", fake)
    instagram.publish(tmp_path / "v.mp4", "matn", thumb_offset_ms=3000)
    assert created["upload_type"] == "resumable" and created["thumb_offset"] == "3000"
    assert uploaded == ["https://rupload.facebook.com/ig-api-upload/v27.0/c1"]


def test_instagram_login_requires_a_public_video(monkeypatch):
    monkeypatch.setattr(instagram.config, "IG_LOGIN", "instagram")
    with pytest.raises(instagram.ApiError):
        instagram.publish(pathlib.Path("v.mp4"), "matn")


def queue_item(tmp_path, name, slugs):
    (tmp_path / f"{name}.json").write_text(json.dumps(
        {"id": name, "slugs": slugs, "caption": "matn", "hero_ms": 2000, "concept": {"title": "g'oya"}}))


def test_queue_item_comes_first_and_only_once(tmp_path):
    queue_item(tmp_path, "V20261116a", ["MoonPendant-95850"])
    chosen = plan.from_queue(tmp_path, CATALOG, [])
    assert chosen["composition"] == "V20261116a" and chosen["cover_composition"] == "V20261116aCover"
    assert chosen["style"] == "custom" and chosen["gifts"] == ["moonpendant-95850"]
    assert plan.from_queue(tmp_path, CATALOG, [{"queue_id": "V20261116a"}]) is None


def test_queue_item_waits_while_its_gift_is_rented(tmp_path):
    queue_item(tmp_path, "V20261116a", ["CandyCane-194062"])
    queue_item(tmp_path, "V20261116b", ["ViceCream-48461"])
    assert plan.from_queue(tmp_path, CATALOG, [])["queue_id"] == "V20261116b"
