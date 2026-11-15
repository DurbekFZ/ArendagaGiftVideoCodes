"""Thompson sampling over video styles and hooks.

Every published video is an observation for its style and for its
style+hook pair. A video's reward is its percentile among recent videos
(0..1), so the scale adapts as the account grows. Older observations fade,
which lets the mix follow changing audience taste. Unseen arms start from a
flat prior, so new styles get tried.
"""
import random

HALF_LIFE_POSTS = 40
MIN_SCORED = 4  # below this there is nothing to rank against


def score(metrics: dict, seconds: float) -> float:
    """One number for "how well did this video do" from Instagram insights."""
    views = metrics.get("views", 0)
    watched = min(1.5, metrics.get("ig_reels_avg_watch_time", 0) / 1000 / max(seconds, 1))
    kept = 1 - min(1.0, metrics.get("reels_skip_rate", 0) / 100)
    spread = metrics.get("shares", 0) * 25 + metrics.get("saved", 0) * 15 + metrics.get("comments", 0) * 8
    return views * (0.4 + watched * 0.4 + kept * 0.2) + spread + metrics.get("likes", 0) * 2


def rewards(posts: list[dict]) -> list[tuple[dict, float]]:
    """Percentile reward for each scored post, oldest first."""
    scored = [post for post in posts if post.get("score") is not None]
    if len(scored) < MIN_SCORED:
        return []
    ordered = sorted(post["score"] for post in scored)
    return [(post, (sum(value < post["score"] for value in ordered)
                    + 0.5 * sum(value == post["score"] for value in ordered)) / len(ordered))
            for post in scored]


def posterior(posts: list[dict], key) -> dict[str, tuple[float, float]]:
    """Beta(a, b) per arm; `key` maps a post to its arm name."""
    table: dict[str, tuple[float, float]] = {}
    ranked = rewards(posts)
    for age, (post, reward) in enumerate(reversed(ranked)):
        weight = 0.5 ** (age / HALF_LIFE_POSTS)
        a, b = table.get(key(post), (1.0, 1.0))
        table[key(post)] = (a + reward * weight, b + (1 - reward) * weight)
    return table


def choose(arms: list[str], table: dict[str, tuple[float, float]], rng: random.Random) -> str:
    return max(arms, key=lambda arm: rng.betavariate(*table.get(arm, (1.0, 1.0))))
