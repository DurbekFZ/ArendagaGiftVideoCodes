# ArendagaGift Reels

Instagram Reels autopilot for the Telegram bot @ArendagaGiftBot (NFT gift rental,
Uzbek audience). Twice a day a Claude session designs one new, never-repeated
video; GitHub Actions renders and publishes it. The owner does not review videos
before they go out, so each session is the only quality gate.

## How the system fits together

- `queue/<id>.json` holds finished videos waiting to be posted. Pushing a queue
  entry posts it right away (the owner asked for that); the hourly schedule in
  `.github/workflows/reels.yml` is the safety net and the template fallback.
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
   conclusions; say so instead of over-fitting. A post with `metrics_error` has
   only likes and comments (the token lacks the insights permission): say so.
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
   runs 13 to 20 seconds.
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

## Opening and length

First insights (two posts, so weak evidence): viewers watched 2.6 seconds on
average and 69-86% left within the first three seconds. The video that opened on
large, clear text held more of them than the one with a slow, pretty entrance.

- Frame one must already carry the hook: a short question or bold claim in large
  type, with the gift visible. No slow fades, no logo, no scene-setting first.
- Give a reason to stay within the first two seconds (an open question, a number
  about to be revealed, something about to happen to the gift).
- Length stays 13 to 20 seconds. The owner rejected cutting videos to 8-12 seconds
  as too short; fix the opening instead of shortening the video.

## Say what it is at once

The owner rejected a video that teased ("1 000 Stars necha so‘m?" with digits
rolling, a cover reading "??? ???"): "from the cover and the first second a person
must know what this is and that it is cheap", and "numbers and words were eaten".

- The cover and frame one name the product and the offer in plain words (what it
  is, what it costs). A question hook is fine only next to that, never instead.
- Text is either fully legible or not on screen. No rolling, scrambling,
  slot-machine digits, partial masks or wipes that leave half a word visible for
  more than a few frames, and no placeholder "???" on a cover.
- Check wide strings at their final size: a number and its unit must not touch
  the next element.
- Music must be calm and pleasant, never grating. The owner rejected a synthwave
  track ("irritating") and then an acoustic one ("the ting-ting sound spoils it"):
  plucked, struck and bell-like sounds repeating through a video annoy them. Use
  the `calm` style (sustained pads only, no plucks, bells or drums) by default, at
  a low volume, and vary it by key, tempo and seed. Other styles only when a
  concept truly needs them, and never synthwave, acoustic, kalimba or musicbox
  without the owner asking. Keep sound effects sparse and soft too: no pops on
  every element.

## Ambition

**Scope: this section was written for the Telegram Stars advertisement.** For the
regular gift-rental videos the owner said afterwards: "do not make Arendaga Gift
as complicated as the Stars one; I liked the style we have been making all
along." So gift videos keep the established look of the posts from 16-17
November (bold 2D motion design built around the gift's own animation, clear
type, one strong idea): no 3D scenes, no dense layered effects. What follows
applies to gift videos only as "do not be dull", and in full only when the owner
asks for something special or for another product.

The owner's verdict on a correct but plain video: "it looks as if someone with
limited abilities made it; you are using one percent of what you can do; I am
letting you work freely and you move like a bird in a cage." Clear and legible is
the floor, not the goal. Every video should look like motion design someone would
stop for:

- Use the real thing. For a product with an official mark, find it and reproduce
  it faithfully (the Telegram Stars icon is traced in `src/three/starShape.ts`);
  never substitute a generic shape.
- Use depth and light. `src/three/Stars3D.tsx` renders real 3D (WebGL) through
  `@remotion/three`: a bevelled gold solid, image-based lighting, a swarm with
  parallax. Build new 3D scenes the same way when a concept calls for it, and set
  `"gl": "swangle"` in the queue entry (3D needs it; such a video renders in about
  nine minutes instead of two).
- Layer the frame: a living background (moving colour fields, dust, rays), a hero
  with weight and shadow, glass or card surfaces, stickers, one accent colour that
  pops against the palette. Empty flat areas read as unfinished.
- Research before designing: look at how the brand itself presents the product
  and at current motion-design practice, then make something of that calibre.
- Still obey the rules above: the offer is readable on frame one, nothing covers
  text, and the safe area is respected. Keep decoration out of the text column.

## Reading pace

The owner's feedback on the third video: it moved too fast to read. A viewer
must be able to read every line once, comfortably, at normal speed:

- each piece of text stays fully visible (after its entrance animation ends) for
  at least 1.2 seconds plus 0.4 seconds per word; a seven-word line needs 4 seconds;
- at most about seven words on screen at once, and never two new blocks of text
  arriving in the same second;
- the price and the call to action hold for at least 3 seconds at the end;
- fast cuts, stamps and transitions are fine, but the words must rest between them.
  If the idea needs more time than 20 seconds allows, cut text, not reading time.

When reviewing, read the video's text aloud against the timeline, not just the
contact sheet.

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
- **Sound:** every video gets music written for it, and it must not sound like the
  last few. The owner asked for this explicitly: never the same backing track, and
  make it beautiful. In the queue entry:
  `"music": {"name": "bed_<id>", "style", "bpm", "root", "scale", "seconds", "seed"}`.
  `style` is `calm` by default (see "Say what it is at once"); `pipeline/music.py` also has
  `lofi`, `ambient`, `cinematic`, `house`, `synthwave`, `acoustic`, `kalimba`; `root` is a MIDI note (48-62), `scale` is
  `major` or `minor`, and `seed` changes the progression and the melody. Change the key, tempo and seed every time so no two tracks match;
  fit the mood to the video (calm, playful, tense, festive). Play it in the video
  with `<Audio src={staticFile('audio/bed_<id>.wav')} />` at a volume that leaves
  room for voice and effects. The stock `bed_*.wav` files are for templates only.
  You may add a new style or instrument to `pipeline/music.py` when a concept needs
  one. Vary the effects too: not every reveal needs the same impact and whoosh.
- **Voice:** alternate `uz-UZ-MadinaNeural` and `uz-UZ-SardorNeural`, and vary
  delivery with `"rate"` (for example `"+0%"`, `"+15%"`) and `"pitch"`
  (for example `"-4Hz"`, `"+6Hz"`) in the voice entry.

Record in the journal which choices each video made, so the next session can
avoid them.

## Second product: @TaqdimotKerakBot (one video a day)

The same Instagram page also advertises the owner's Telegram bot **@TaqdimotKerakBot**:
the bot shows the prices; when a person presses the order button the order goes to the
owner, the person tells the owner (not the bot) the topic, and the finished presentation
(slides with the text already written) is made for them.
One video a day is about this bot; the gift videos continue as before.

- **What to show.** Real work: five sample presentations are in `public/taqdimot/`
  (`slides.json` lists every slide image, its deck, subject and title). Show the slides
  themselves, large and sharp, with `<Img src={staticFile('taqdimot/jahon/01.jpg')} />`:
  flipping through a deck, a fan or stack of slides, a slide building up, before
  (a blank or ugly slide you draw yourself) and after (a real one). The slides are the
  hero the way the gift is in gift videos. Never squeeze or crop them so text is cut;
  when one is on screen long enough to read, make it wide enough to read.
- **Say what it is at once.** Cover and frame one say in plain words that this is
  ready-made presentations to order ("Tayyor taqdimot kerakmi?", "Taqdimot buyurtma
  qiling") with a slide visible.
- **Call to action.** The bot's link is NOT in the profile. Every video ends with the
  handle written out large, `@TaqdimotKerakBot`, and "Telegramda qidiring" (or
  "Telegramda yozing"); it holds for at least 3 seconds. Never say "havola profilda"
  in these videos and never mention @ArendagaGiftBot in them.
- **True claims only.** Known facts: the service makes presentations to order; the
  slides come with the text written; the bot shows the prices; the samples are real.
  The topic is NOT typed into the bot (the owner said so after the first video, which
  wrongly had "Mavzuni botga yozing"): never write that; say "botga kiring", "narxlarni
  ko‘ring", "buyurtma bering" instead.
  Not known, so never state: any price, discount, delivery time, number of customers,
  guarantee of a grade, or how the slides are produced. No "bepul". When the owner
  gives prices or deadlines they will be added here.
- **The samples.** Names on the samples were replaced with "Ism Familiya"; never put a
  real person's name on screen. The `islom` deck quotes scripture: show its slides
  respectfully and unaltered, no jokes, stickers or effects over them. The `chatgpt`
  deck is about another company's product: it may appear as one sample among others,
  never as the opening slide or the cover, and nothing may suggest that company is
  involved; the `gemini` deck (added 26 Nov) is the same case and follows the same
  rule. The `pvid` deck (medicine, added 26 Nov) is neutral and has not been shown
  yet; its slide 02 rendered with one line too small, so do not use that slide, and
  slide 03 names historical people, so skip it too. Do not invent slides and present
  them as samples.
- **Audience and tone.** Students and teachers in Uzbekistan who need a presentation
  for a class or a defence. Formal "siz", short spoken Uzbek, no promises about marks.
- **Look.** The same bold 2D motion design as the gift videos: palette taken from the
  deck being shown, one accent, calm music by the same rules, safe area, reading pace,
  13 to 20 seconds. Vary deck, format and look from one video to the next as under
  Variety, comparing against earlier @TaqdimotKerakBot videos.
- **Files.** `src/videos/V<YYYYMMDD><letter>.tsx` as usual; `queue/<id>.json` with
  `"slugs": []` (no gifts) and `"product": "taqdimot"` inside `"concept"`. In the
  analysis compare these videos with each other, not with the gift videos.

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
