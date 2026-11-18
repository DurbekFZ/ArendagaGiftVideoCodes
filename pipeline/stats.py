"""Refresh Instagram insights, comments and follower counts. Standard library only.

Runs on every hourly wake-up, whether or not a video is posted, so the creative
sessions always analyse fresh numbers.

Usage: python3 -m pipeline.stats
"""
import datetime
import json

from . import bandit, config, instagram

SCORE_AFTER = datetime.timedelta(hours=1)
SCORE_UNTIL = datetime.timedelta(days=14)


def refresh() -> None:
    now = datetime.datetime.now(datetime.timezone.utc)
    posts = json.loads(config.STATE.read_text()) if config.STATE.exists() else []
    updated = 0
    for post in posts:
        age = now - datetime.datetime.fromisoformat(post["published_at"])
        if post.get("deleted") or not SCORE_AFTER <= age <= SCORE_UNTIL:
            continue
        try:
            post["metrics"] = instagram.insights(post["media_id"])
        except instagram.ApiError as error:  # a deleted post must not block the others
            print(f"metrics skipped for {post['name']}: {error}")
            post["metrics_error"] = str(error)[:300]  # kept in the record so a session can see why numbers are missing
            if "does not exist" in str(error) and post.get("metrics"):
                # It was readable before and is gone now: the owner deleted it on Instagram. Stop asking.
                post["deleted"] = True
                post.pop("metrics_error", None)
                continue
            try:  # without the insights permission, likes and comments are still better than nothing
                post["metrics"] = instagram.basic_counts(post["media_id"])
            except instagram.ApiError:
                continue
        else:
            post.pop("metrics_error", None)
        post["score"] = round(bandit.score(post["metrics"], post["seconds"]), 2)
        post["measured_at"] = now.isoformat(timespec="seconds")
        try:
            post["comments"] = instagram.comments(post["media_id"])
        except instagram.ApiError as error:  # comment access is optional
            print(f"comments skipped for {post['name']}: {error}")
        updated += 1
    config.STATE.parent.mkdir(exist_ok=True)
    config.STATE.write_text(json.dumps(posts, ensure_ascii=False, indent=1) + "\n")
    try:
        profile = instagram.account()
        history = json.loads(config.ACCOUNT.read_text()) if config.ACCOUNT.exists() else []
        history.append({"at": now.isoformat(timespec="seconds"), "followers": profile.get("followers_count"),
                        "media": profile.get("media_count")})
        config.ACCOUNT.write_text(json.dumps(history[-400:], indent=1) + "\n")
    except instagram.ApiError as error:
        print(f"account snapshot skipped: {error}")
    print(f"metrics updated for {updated} posts")


def diagnose() -> None:
    """Print what the token can see: its permissions and the Instagram accounts behind its Pages. No secrets."""
    def attempt(label, path, params):
        try:
            return instagram.call("GET", path, params)
        except instagram.ApiError as error:
            print(f"{label}: FAILED - {error}")
            return None

    print(f"checked at: {datetime.datetime.now(datetime.timezone.utc):%Y-%m-%d %H:%M} UTC")
    print(f"token kind: {config.IG_LOGIN}; characters: {len(config.IG_ACCESS_TOKEN)}; IG_USER_ID set: {bool(config.IG_USER_ID)}")
    # The output is committed to a public repository: no personal names, only what the token can do.
    print(f"token valid: {attempt('me', 'me', {'fields': 'id'}) is not None}")
    granted = attempt("permissions", "me/permissions", None)
    if granted:
        for entry in granted.get("data", []):
            print(f"permission {entry.get('permission')}: {entry.get('status')}")
    pages = attempt("pages", "me/accounts", {"fields": "name,instagram_business_account{id,username}"})
    if pages is not None:
        if not pages.get("data"):
            print("pages: none visible to this token")
        for page in pages.get("data", []):
            linked = page.get("instagram_business_account")
            match = bool(linked) and linked.get("id") == config.IG_USER_ID
            print(f"page: instagram={'@' + linked.get('username', '?') if linked else 'not linked'}"
                  f"{' (matches IG_USER_ID)' if match else ''}")
        for page in pages.get("data", []):
            other = attempt("page connection", page["id"], {"fields": "connected_instagram_account{id,username}"})
            if other is not None:
                connected = other.get("connected_instagram_account")
                print(f"page: connected_instagram_account={'@' + connected.get('username', '?') if connected else 'none'}")
    # Which accounts each permission was actually granted for (chosen in the Facebook dialog).
    debug = attempt("token details", "debug_token", {"input_token": config.IG_ACCESS_TOKEN})
    if debug:
        info = debug.get("data", {})
        expires = info.get("expires_at")
        print("token expires: " + ("never" if expires == 0 else
              f"{datetime.datetime.fromtimestamp(expires, datetime.timezone.utc):%Y-%m-%d %H:%M} UTC" if expires else "unknown"))
        for scope in info.get("granular_scopes", []):
            targets = scope.get("target_ids")
            covers = "all accounts" if targets is None else f"{len(targets)} account(s)"
            mine = "" if targets is None or not config.IG_USER_ID else (
                " including IG_USER_ID" if config.IG_USER_ID in targets else " NOT including IG_USER_ID")
            print(f"scope {scope.get('scope')}: {covers}{mine}")
    businesses = attempt("businesses", "me/businesses", {"fields": "instagram_business_accounts{id,username}"})
    if businesses is not None:
        found = [account for business in businesses.get("data", [])
                 for account in (business.get("instagram_business_accounts") or {}).get("data", [])]
        print(f"business portfolios: {len(businesses.get('data', []))}; instagram accounts in them: "
              + (", ".join('@' + account.get('username', '?') for account in found) or "none"))
    if config.IG_USER_ID:
        attempt("account by IG_USER_ID", config.IG_USER_ID, {"fields": "username"})


if __name__ == "__main__":
    import sys
    diagnose() if sys.argv[1:] == ["diagnose"] else refresh()
