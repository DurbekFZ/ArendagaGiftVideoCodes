"""Settings read from the environment. Secrets never live in the repository."""
import os
import pathlib

def secret(name: str) -> str:
    """A pasted secret often carries a trailing newline, which breaks HTTP headers."""
    return os.environ.get(name, "").strip()


ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "out"
STATE = ROOT / "state" / "posts.json"
ACCOUNT = ROOT / "state" / "account.json"
QUEUE = ROOT / "queue"

FEED_URL = os.environ.get("MARKETING_FEED_URL", "https://arendagagift.chest.uz/api/marketing/nfts")
FEED_TOKEN = secret("MARKETING_FEED_TOKEN")
FEED_FILE = os.environ.get("MARKETING_FEED_FILE", "")  # read a saved feed instead of the network

IG_ACCESS_TOKEN = secret("IG_ACCESS_TOKEN")
IG_USER_ID = secret("IG_USER_ID")
IG_API_VERSION = os.environ.get("IG_API_VERSION", "v27.0")


def login_kind(token: str, configured: str) -> str:
    """Which API a token belongs to. Facebook Login tokens start with "EAA", Instagram Login ones with "IG"."""
    if configured in ("instagram", "facebook"):
        return configured
    return "facebook" if token.startswith("EAA") else "instagram"


# "instagram": Instagram Login, video fetched by Meta from MEDIA_BASE_URL.
# "facebook": Facebook Login (Instagram account linked to a Page), needs IG_USER_ID.
# Anything else: detect from the token.
IG_LOGIN = login_kind(IG_ACCESS_TOKEN, os.environ.get("IG_LOGIN", "auto").strip())
# With Instagram Login the token itself identifies the account.
IG_ACCOUNT = "me" if IG_LOGIN == "instagram" else IG_USER_ID
# Public base URL under which rendered files are reachable, without trailing slash.
MEDIA_BASE_URL = os.environ.get("MEDIA_BASE_URL", "").rstrip("/")

BOT = "@ArendagaGiftBot"
TIMEZONE_OFFSET_HOURS = 5  # Tashkent
