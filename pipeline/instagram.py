"""Publish Reels and read their insights through Instagram's official API.

Two login kinds are supported (see config.IG_LOGIN):
- "instagram": Meta downloads the video from a public URL (`video_url`).
- "facebook": the file is uploaded directly with a resumable upload.
The access token is only ever sent in the Authorization header.
"""
import json
import pathlib
import time
import urllib.error
import urllib.parse
import urllib.request

from . import config

HOSTS = {"instagram": "https://graph.instagram.com", "facebook": "https://graph.facebook.com"}
METRICS = ["views", "reach", "likes", "comments", "shares", "saved", "total_interactions",
           "ig_reels_avg_watch_time", "ig_reels_video_view_total_time", "reels_skip_rate"]


class ApiError(RuntimeError):
    pass


def send(request: urllib.request.Request, timeout: int = 120) -> dict:
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", "replace")
        try:
            detail = json.loads(body).get("error", {})
            message = f"{detail.get('message', body[:300])} (code {detail.get('code')}, subcode {detail.get('error_subcode')})"
        except (ValueError, AttributeError):
            message = body[:300]
        raise ApiError(f"Instagram API {error.code}: {message}") from None


def call(method: str, path: str, params: dict | None = None) -> dict:
    url = f"{HOSTS[config.IG_LOGIN]}/{config.IG_API_VERSION}/{path}"
    data = None
    if method == "GET" and params:
        url += "?" + urllib.parse.urlencode(params)
    elif params is not None:
        data = urllib.parse.urlencode(params).encode()
    request = urllib.request.Request(url, data=data, method=method,
                                     headers={"Authorization": f"Bearer {config.IG_ACCESS_TOKEN}"})
    return send(request)


def wait_public(url: str, attempts: int = 40, pause: int = 15) -> None:
    """Wait until a freshly pushed file is reachable for Meta's downloader."""
    for _ in range(attempts):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, method="HEAD"), timeout=20) as response:
                if response.status == 200:
                    return
        except (urllib.error.URLError, TimeoutError):
            pass
        time.sleep(pause)
    raise ApiError(f"file never became public: {url}")


def container(caption: str, video_url: str | None, cover_url: str | None, thumb_offset_ms: int | None) -> dict:
    params = {"media_type": "REELS", "caption": caption, "share_to_feed": "true"}
    if cover_url:
        params["cover_url"] = cover_url
    elif thumb_offset_ms is not None:
        params["thumb_offset"] = str(thumb_offset_ms)
    if video_url:
        params["video_url"] = video_url
    else:
        params["upload_type"] = "resumable"
    return call("POST", f"{config.IG_ACCOUNT}/media", params)


def upload(uri: str, video: pathlib.Path) -> None:
    data = video.read_bytes()
    request = urllib.request.Request(uri, data=data, method="POST", headers={
        "Authorization": f"OAuth {config.IG_ACCESS_TOKEN}", "offset": "0", "file_size": str(len(data))})
    result = send(request, timeout=600)
    if not result.get("success"):
        raise ApiError(f"upload failed: {str(result)[:300]}")


def wait_ready(container_id: str, attempts: int = 60, pause: int = 10) -> None:
    for _ in range(attempts):
        status = call("GET", container_id, {"fields": "status_code,status"})
        if status.get("status_code") == "FINISHED":
            return
        if status.get("status_code") in ("ERROR", "EXPIRED"):
            raise ApiError(f"container {status.get('status_code')}: {status.get('status')}")
        time.sleep(pause)
    raise ApiError("container was not ready in time")


def discover_account() -> str:
    """With Facebook Login and no IG_USER_ID, find the Instagram account linked to the user's Page."""
    pages = call("GET", "me/accounts", {"fields": "name,instagram_business_account{id,username}"}).get("data", [])
    linked = [page["instagram_business_account"] for page in pages if page.get("instagram_business_account")]
    if not linked:
        raise ApiError("no Instagram professional account is linked to a Facebook Page this token can see")
    return linked[0]["id"]


def ensure_account() -> None:
    if not config.IG_ACCOUNT:
        config.IG_ACCOUNT = discover_account()


def account() -> dict:
    ensure_account()
    return call("GET", config.IG_ACCOUNT, {"fields": "username,followers_count,media_count"})


def comments(media_id: str) -> list[dict]:
    data = call("GET", f"{media_id}/comments", {"fields": "text,timestamp,like_count", "limit": "50"}).get("data", [])
    return [{"text": entry.get("text", ""), "likes": entry.get("like_count", 0)} for entry in data]


def prepare(video: pathlib.Path, caption: str, *, video_url: str | None = None, cover_url: str | None = None,
            thumb_offset_ms: int | None = None) -> str:
    """Create a container and wait until Instagram has processed the video. Nothing is posted yet."""
    ensure_account()
    if config.IG_LOGIN == "instagram" and not video_url:
        raise ApiError("Instagram Login needs a public video URL (set MEDIA_BASE_URL)")
    if video_url:
        wait_public(video_url)
    if cover_url:
        wait_public(cover_url)
    created = container(caption, video_url, cover_url, thumb_offset_ms)
    if not video_url:
        upload(created["uri"], video)
    wait_ready(created["id"])
    return created["id"]


def publish(video: pathlib.Path, caption: str, *, video_url: str | None = None, cover_url: str | None = None,
            thumb_offset_ms: int | None = None) -> dict:
    container_id = prepare(video, caption, video_url=video_url, cover_url=cover_url, thumb_offset_ms=thumb_offset_ms)
    media_id = call("POST", f"{config.IG_ACCOUNT}/media_publish", {"creation_id": container_id})["id"]
    link = call("GET", media_id, {"fields": "permalink"}).get("permalink")
    return {"media_id": media_id, "permalink": link}


def insights(media_id: str) -> dict:
    data = call("GET", f"{media_id}/insights", {"metric": ",".join(METRICS)}).get("data", [])
    return {entry["name"]: (entry.get("values") or [{}])[0].get("value", 0) for entry in data}


def basic_counts(media_id: str) -> dict:
    """Likes and comments only: readable without the insights permission."""
    data = call("GET", media_id, {"fields": "like_count,comments_count"})
    return {"likes": data.get("like_count", 0), "comments": data.get("comments_count", 0)}


def refreshed_token() -> str:
    """Extend a long-lived Instagram Login token (valid 60 days, refreshable after 24 hours)."""
    return call("GET", "refresh_access_token", {"grant_type": "ig_refresh_token"})["access_token"]
