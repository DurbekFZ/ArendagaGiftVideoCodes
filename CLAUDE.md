# ArendagaGift Reels

Instagram Reels autopilot for the Telegram bot @ArendagaGiftBot (NFT gift rental,
Uzbek audience). Twice a day a Claude session designs one new, never-repeated
video; GitHub Actions renders and publishes it. The owner does not review videos
before they go out, so each session is the only quality gate.

## How the system fits together

- `queue/<id>.json` holds finished videos waiting to be posted. At each slot
  `.github/workflows/reels.yml` posts the oldest one whose gifts are free to rent.
  With an empty queue it falls back to the template library in `pipeline/styles.py`.
  An entry with `"hold": true` waits for the owner's approval and is never posted;
  `"priority": 1` posts before the others. Both are the owner's decisions:
  scheduled sessions do not set, change or clear them.
- `src/videos/V*.tsx` are the hand-made videos (auto-registered, see `registry.tsx`).
- `state/posts.json` is the record of every post with Instagram insights, comments
  and the concept behind it. `state/account.json` tracks followers over time.
- `docs/journal.md` is the running creative log: what was learned, what was made.
- Instagram credentials exist only in GitHub Actions. Sessions never publish.
- `docs/session-prompt.md` is the brief each creative session is started with. A
  dispatcher session starts them twice a day with the repository attached, because
  a session started without it cannot push.

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
   "uz-UZ-MadinaNeural" | "uz-UZ-SardorNeural", "lines": [...], "rate"?, "pitch"?}`.
   Own music is optional too; see Variety.
6. **Review.** `python -m pipeline.preview <id>`, then look at the contact sheet
   and the cover. Fix and re-render until: no text is clipped or overlapping, the
   opening frame is striking, everything important is inside the safe area below,
   the palette is harmonious, the cover reads at thumbnail size, and the video
   runs 7 to 20 seconds.
7. **Ship.** Run `npx tsc` and `python -m pytest -q tests`. Append to
   `docs/journal.md` (date, findings, concept, what to watch for). Commit and
   push to the default branch.

## Safe area (1080 x 1920)

Instagram draws its interface over the video. Keep text, prices, the gift and
the call to action out of:

- the top 220 px (account bar);
- the bottom 380 px (caption and audio line);
- the right 200 px between y = 850 and y = 1560 (like, comment, share, repost
  and the three-dot menu). Lay lower-half content out between x = 70 and x = 870,
  left-aligned or centred on x = 470 rather than on the frame centre.

Backgrounds and decoration may fill the whole frame.

## Colour

The owner's feedback on the first video: good colours, but not in harmony with
each other. Build each palette deliberately:

- start from the gift's own colours (`meta.colors` and the artwork itself), then
  choose one background family, one accent and one neutral; at most one extra hue;
- derive the others by a rule (analogous, complementary or split-complementary to
  the gift), and keep saturation and lightness consistent across the set;
- check that the gift does not vanish into the background or clash with it, and
  that text contrast is strong; confetti, badges and buttons reuse palette colours.

## Showing the gift

The owner's feedback on the second video:

- Never show the gift distorted or squeezed. Some gifts turn in their own
  animation and look narrow mid-turn; when a scene holds on the gift, hold a pose
  that faces the viewer squarely (render a few poses first and pick one).
- Make the gift large. The artwork fills only about half of its 512 px box, so
  size the box by what is visible, and avoid big empty areas around it.
- Voice-over is optional, not a default: mix silent and voiced videos.

## Variety

Consecutive videos must not look or sound alike. Before building, list the last
five posts' format, palette, typography, pacing, music and voice from the journal,
and choose something different on most of those axes:

- **Format:** quiz, story, comparison, myth and fact, countdown, tutorial,
  point-of-view, reveal, list, question to the viewer, and new ones you invent.
- **Look:** change the visual world (dark luxury, paper, neon, flat blocks,
  gradient glass, monochrome with one accent, ...), layout and motion language.
- **Type:** Unbounded, Manrope and Playfair Display are bundled; add another
  `@fontsource/*` family when a concept calls for it.
- **Sound:** do not reuse the stock beds twice in a row. Give the video its own
  music with `"music": {"name": "bed_<id>", "bpm", "chords", "seconds", "energy", "drums"?}`
  in the queue entry (chords are lists of MIDI notes; see `pipeline/audio.py`),
  or add new synthesis there (other drums, bass lines, instruments, effects).
  Some videos silent-with-music, some voiced.
- **Voice:** alternate `uz-UZ-MadinaNeural` and `uz-UZ-SardorNeural`, and vary
  delivery with `"rate"` (for example `"+0%"`, `"+15%"`) and `"pitch"`
  (for example `"-4Hz"`, `"+6Hz"`) in the voice entry.

Record in the journal which choices each video made, so the next session can
avoid them.

## Rules for content

- Uzbek, Latin script, with `‘` in o‘ and g‘. Short, spoken, no officialese.
- Address the viewer formally, always "siz": oling, profilingizda, xohlaysizmi.
  Never "sen" forms (ol, profilingda, xohlaysanmi), in video text, voice, covers
  and captions alike.
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
