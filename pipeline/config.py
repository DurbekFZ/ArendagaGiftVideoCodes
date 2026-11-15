"""Settings read from the environment. Secrets never live in the repository."""
import os
import pathlib

def secret(name: str) -> str:
    """A pasted secret often carries a trailing newline, which breaks HTTP headers."""
    return os.environ.get(name, "").strip()


ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "out"
STATE = ROOT / "state" / "posts.json"

FEED_URL = os.environ.get("MARKETING_FEED_URL", "https://arendagagift.chest.uz/api/marketing/nfts")
FEED_TOKEN = secret("MARKETING_FEED_TOKEN")
FEED_FILE = os.environ.get("MARKETING_FEED_FILE", "")  # read a saved feed instead of the network

# "instagram": Instagram Login, video fetched by Meta from MEDIA_BASE_URL.
# "facebook": Facebook Login, video uploaded directly (resumable upload).
IG_LOGIN = os.environ.get("IG_LOGIN", "instagram")
IG_ACCESS_TOKEN = secret("IG_ACCESS_TOKEN")
IG_USER_ID = secret("IG_USER_ID")
IG_API_VERSION = os.environ.get("IG_API_VERSION", "v27.0")
# Public base URL under which rendered files are reachable, without trailing slash.
MEDIA_BASE_URL = os.environ.get("MEDIA_BASE_URL", "").rstrip("/")

BOT = "@ArendagaGiftBot"
TIMEZONE_OFFSET_HOURS = 5  # Tashkent
