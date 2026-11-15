"""Print a refreshed Instagram Login token on stdout, to be captured and stored as a secret.

Never run this where stdout is logged.
"""
from . import instagram

if __name__ == "__main__":
    print(instagram.refreshed_token(), end="")
