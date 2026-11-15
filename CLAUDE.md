# ArendagaGift Reels

Instagram Reels autopilot for the Telegram bot @ArendagaGiftBot (NFT gift rental,
Uzbek audience). Twice a day a Claude session designs one new, never-repeated
video; GitHub Actions renders and publishes it. The owner does not review videos
before they go out, so each session is the only quality gate.

## How the system fits together

- `queue/<id>.json` holds finished videos waiting to be posted. At each slot
  `.github/workflows/reels.yml` posts the oldest one whose gifts are free to rent.
  With an empty queue it falls back to the template library in `pipeline/styles.py`.
- `src/videos/V*.tsx` are the hand-made videos (auto-registered, see `registry.tsx`).
- `state/posts.json` is the record of every post with Instagram insights, comments
  and the concept behind it. `state/account.json` tracks followers over time.
- `docs/journal.md` is the running creative log: what was learned, what was made.
- Instagram credentials exist only in GitHub Actions. Sessions never publish.

## Making the next video (scheduled session)

1. **Sync.** Pull the default branch. Read `docs/journal.md`, `state/posts.json`,
   `state/account.json` and the files in `queue/`. If the queue already holds
   three or more videos, add a journal note and stop.
2. **Analyse.** Rank posts by views, average watch time against length, skip rate,
   shares, saves and follower change. Read the comments. Write down what the best
   and worst posts have in common: hook wording, first frame, pacing, voice or
   silent, price shown or not, gift, posting slot. Few data points mean weak
   conclusions; say so instead of over-fitting.
3. **Read the catalogue.** `python -c "from pipeline import feed; print(feed.fetch())"`
   (needs `MARKETING_FEED_TOKEN`). Use only gifts with status `available`, real
   prices and discounts from the feed, and real attributes from
   `python -m pipeline.gifts <Slug>`. Prefer gifts not featured recently.
4. **Invent.** One concept that differs from every earlier post in at least two of:
   format, visual world, hook, pacing, sound. Lean toward what the analysis
   supports, and keep roughly one video in four as a deliberate experiment.
   The first 1.5 seconds must make someone stop scrolling.
5. **Build.** Write `src/videos/V<YYYYMMDD><a|b>.tsx` exporting a `CustomVideo`
   with its own `Video` and its own `Cover`. Reuse `src/kit.tsx` for gift
   rendering, fonts and audio, but design the scenes from scratch; do not copy
   the layout of an existing video. Write `queue/<id>.json`:
   `{"id", "slugs", "caption", "hero_ms", "voice"?, "concept": {"title", "hook",
   "format", "why", "differs"}}`. Voice is optional: `{"name": <id>, "voice":
   "uz-UZ-MadinaNeural" | "uz-UZ-SardorNeural", "lines": [...]}`.
6. **Review.** `python -m pipeline.preview <id>`, then look at the contact sheet
   and the cover. Fix and re-render until: no text is clipped or overlapping, the
   opening frame is striking, nothing important sits in the top 220 px or bottom
   380 px (Instagram's interface covers them), the cover reads at thumbnail size,
   and the video runs 7 to 20 seconds.
7. **Ship.** Run `npx tsc` and `python -m pytest -q tests`. Append to
   `docs/journal.md` (date, findings, concept, what to watch for). Commit and
   push to the default branch.

## Rules for content

- Uzbek, Latin script, with `‘` in o‘ and g‘. Short, spoken, no officialese.
- Only true claims: real prices, real rarity percentages, rental from 3 to 30
  days, nothing about ownership, investment or earnings. The gift is displayed on
  the renter's profile; it is not transferred to them.
- Every video ends by sending people to the link in the profile and names
  @ArendagaGiftBot. Captions are plain text with a few relevant hashtags.
- No copyrighted music, no other brands' logos or characters, no real people's
  names or faces. Sound comes from `pipeline/audio.py` or new synthesis added there.
- Never put a secret in the repository, a log line or a commit message.

## Commands

~~~bash
npm ci && pip install -r requirements.txt pytest
python -m pipeline.gifts MoonPendant-95850      # fetch one gift's assets
python -m pipeline.preview V20261116a           # render + contact sheet
npx tsc && python -m pytest -q tests
~~~

Set `CHROME_PATH` to an installed Chromium headless shell when one exists
(for example under `/opt/pw-browsers`); otherwise `npx remotion browser ensure`.
