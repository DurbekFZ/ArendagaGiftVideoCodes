import '@fontsource/caveat/700.css';
import '@fontsource/rubik/800.css';
import '@fontsource/rubik/600.css';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Freeze, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random,
  spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {BRAND, Gift, GiftData, H, W, clamp, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "Yangi yil ro‘yxati": a New Year to-do list written by hand. Frame one asks "Yangi yilga tayyormisiz?"
// over a notepad and the Vice Cream (a Christmas-tree ice cream). Archa, mandarin and presents are ticked
// one by one; the last line, "Profilingizda archa", waits until the gift itself hops and ticks it. Then the
// viewer is asked to send the list to a friend, and the price and the bot close it. Silent, music box bed.
const ID = 'V20261117c';
const GIFT = 'vicecream-405488'; // Pine Cone model 3%, Rosewood backdrop 1.5%, Kudu Totem symbol 0.4%; 750 so‘m a day
const HEAD = "'Rubik', sans-serif";
const HAND = "'Caveat', cursive";

// Palette: the gift is a green swirl in a red-and-white striped cone. Background family: rosewood, the
// gift's own backdrop, darkened (keeps the red of the cone at home without clashing). Accent: mint, the
// complement of rosewood and the hue of the tree. Neutral: snow cream with a rosewood-black ink.
// Ticks on paper use the same mint hue, deepened for contrast.
const ROSE_DEEP = '#22100f';
const ROSE = '#4a2228';
const ROSE_GLOW = '#7e434c';
const MINT = '#8fe3b4';
const PINE = '#1f8a58';
const CREAM = '#fbf1ea';
const INK = '#2a1418';

// Timeline (30 fps). Reading pace: 1.2 s + 0.4 s per word after each entrance; new blocks >= 1.2 s apart.
const ROWS = [
  {text: 'Archa', at: 18},
  {text: 'Mandarin', at: 54},
  {text: 'Sovg‘alar', at: 90},
  {text: 'Profilingizda archa', at: 126},
];
const WRITE = 16; // frames to write one row
const TICK_DELAY = 22; // rows 1-3 are ticked this long after they start
const HOOK_END = 150; // "Yangi yilga tayyormisiz?" (3 words) from frame 0 -> 5.0 s
const LAST = 164; // "Oxirgisi-chi?" (1 word) -> 2.4 s
const HOP = 196; // the gift hops; the last box is ticked
const SHARE = 244; // "Ro‘yxatni do‘stingizga yuboring" (3 words) -> 3.4 s
const SHARE_END = 346;
const END = 352; // notepad leaves, the gift moves to the centre
const PRICE = 366; // "Kuniga · 3–30 kun" + "750 so‘m"
const BOT = 404;
const LINK = 442;
const FRAMES = 570; // 19.0 s

const useFonts = () => {
  const [handle] = useState(() => delayRender('caveat+rubik'));
  useEffect(() => {
    Promise.all(['700 10px Caveat', '800 10px Rubik', '600 10px Rubik']
      .map((f) => document.fonts.load(f, 'Oʻg‘ 750 so‘m – ↑')))
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

const ease = Easing.bezier(0.3, 0.6, 0.2, 1);
const pop = (frame: number, fps: number, at: number) =>
  spring({frame: frame - at, fps, config: {damping: 13, stiffness: 160, mass: 0.7}});

/** Rosewood night: deep gradient, a soft glow behind the gift and slow snowfall. */
const Night: React.FC<{glowX: number; glowY: number}> = ({glowX, glowY}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${ROSE_DEEP} 0%, ${ROSE} 52%, ${ROSE_DEEP} 100%)`}}>
      <AbsoluteFill style={{background:
        `radial-gradient(circle 560px at ${glowX}px ${glowY}px, ${ROSE_GLOW} 0%, rgba(126,67,76,.35) 45%, transparent 75%)`}} />
      {Array.from({length: 70}, (_, i) => {
        const r = (k: string) => random(`snow-${i}-${k}`);
        const size = 5 + r('s') * 13;
        const speed = 1.2 + r('v') * 2.4;
        const y = ((r('y') * (H + 60) + frame * speed) % (H + 60)) - 30;
        const x = r('x') * W + Math.sin(frame / (26 + r('w') * 24) + i) * 30;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: '50%',
          background: CREAM, opacity: 0.18 + r('o') * 0.45, filter: size > 13 ? 'blur(2px)' : undefined}} />;
      })}
    </AbsoluteFill>
  );
};

/** A hand-drawn tick, drawn stroke by stroke. */
const Tick: React.FC<{at: number; color: string; size?: number; now?: number}> = ({at, color, size = 64, now}) => {
  const current = useCurrentFrame();
  const frame = now ?? current;
  const t = interpolate(frame, [at, at + 8], [0, 1], {...clamp, easing: ease});
  if (t <= 0) return null;
  const length = 150;
  return (
    <svg width={size * 1.5} height={size * 1.5} viewBox="0 0 96 96"
      style={{position: 'absolute', left: -size * 0.12, top: -size * 0.42, overflow: 'visible'}}>
      <path d="M14 52 L38 76 L88 10" fill="none" stroke={color} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={length} strokeDashoffset={length * (1 - t)} />
    </svg>
  );
};

const ROW_Y = (i: number) => 1108 + i * 108; // top of each row inside the frame
const PAD = {left: 70, top: 1052, width: 800, height: 508};

/** The notepad: cream lined paper with spiral rings; rows are written on and ticked. */
const Notepad: React.FC<{dimDone: number; lastTick: number; now?: number}> = ({dimDone, lastTick, now}) => {
  const current = useCurrentFrame();
  const frame = now ?? current;
  return (
    <>
      <div style={{position: 'absolute', left: PAD.left, top: PAD.top, width: PAD.width, height: PAD.height, borderRadius: 26,
        background: CREAM, boxShadow: '0 40px 80px rgba(0,0,0,.45), 0 4px 0 rgba(0,0,0,.12)',
        backgroundImage: `repeating-linear-gradient(180deg, transparent 0px, transparent 105px, rgba(74,34,40,.16) 105px, rgba(74,34,40,.16) 108px)`,
        backgroundPosition: '0 30px'}}>
        {Array.from({length: 9}, (_, i) => (
          <div key={i} style={{position: 'absolute', left: 52 + i * 86, top: -22, width: 26, height: 50, borderRadius: 13,
            background: `linear-gradient(90deg, #5b4a4c, #c9bcb8 50%, #5b4a4c)`, boxShadow: '0 4px 6px rgba(0,0,0,.35)'}} />
        ))}
      </div>
      {ROWS.map((row, i) => {
        const y = ROW_Y(i);
        const written = interpolate(frame, [row.at, row.at + WRITE], [0, 100], clamp);
        const isLast = i === ROWS.length - 1;
        const done = isLast ? 0 : dimDone;
        const boxPulse = isLast && frame > row.at + WRITE && frame < HOP
          ? 1 + Math.max(0, Math.sin((frame - row.at - WRITE) / 5)) * 0.08 : 1;
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: PAD.left + 40, top: y + 14, width: 64, height: 64, borderRadius: 14,
              border: `6px solid ${isLast && frame < HOP ? PINE : INK}`, boxSizing: 'border-box', opacity: 1 - done * 0.55,
              transform: `scale(${boxPulse})`}}>
              <Tick at={isLast ? lastTick : row.at + TICK_DELAY} color={PINE} now={now} />
            </div>
            <div style={{position: 'absolute', left: PAD.left + 140, top: y - 6, fontFamily: HAND, fontWeight: 700, fontSize: 86,
              lineHeight: 1.1, color: INK, whiteSpace: 'nowrap', clipPath: `inset(-20px ${100 - written}% -20px -10px)`,
              opacity: 1 - done * 0.62}}>
              {row.text}
              {!isLast && (
                <div style={{position: 'absolute', left: -6, right: -6, top: 54, height: 6, borderRadius: 3, background: INK,
                  transformOrigin: 'left', transform: `scaleX(${done})`, opacity: 0.7}} />
              )}
              {isLast && (
                <svg width={640} height={40} viewBox="0 0 640 40" style={{position: 'absolute', left: -8, top: 92}}>
                  <path d="M4 22 C 160 6, 330 34, 470 16 S 610 12, 632 20" fill="none" stroke={PINE} strokeWidth={9}
                    strokeLinecap="round" strokeDasharray={700}
                    strokeDashoffset={700 * (1 - interpolate(frame, [HOP + 8, HOP + 22], [0, 1], {...clamp, easing: ease}))} />
                </svg>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
};

/** A big headline that pops in and fades out. `*word*` marks the accent words. */
const Headline: React.FC<{lines: string[]; from: number; to: number; size?: number}> = ({lines, from, to, size = 116}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < from || frame > to + 10) return null;
  const s = from === 0 ? 1 : pop(frame, fps, from);
  const out = interpolate(frame, [to, to + 8], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', left: 70, top: 236, fontFamily: HEAD, fontWeight: 800, fontSize: size,
      lineHeight: 1.04, letterSpacing: -2, color: CREAM, opacity: Math.min(1, s * 1.5) * (1 - out),
      transform: `translateY(${(1 - s) * 40 - out * 30}px)`, textShadow: '0 8px 30px rgba(0,0,0,.45)'}}>
      {lines.map((line, i) => (
        <div key={i}>{line.split(' ').map((raw, w) => {
          const hot = raw.startsWith('*');
          return <span key={w} style={{color: hot ? MINT : CREAM}}>{(w ? ' ' : '') + raw.replace(/\*/g, '')}</span>;
        })}</div>
      ))}
    </div>
  );
};

/** Star-shaped burst for the final tick. */
const Burst: React.FC<{at: number; x: number; y: number}> = ({at, x, y}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + 24], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  if (frame < at || t >= 1) return null;
  return (
    <>
      {Array.from({length: 14}, (_, i) => {
        const angle = (i / 14) * Math.PI * 2 + random(`b${i}`) * 0.3;
        const dist = 80 + t * (160 + random(`d${i}`) * 120);
        const size = 22 + random(`s${i}`) * 18;
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 20 20" style={{position: 'absolute',
            left: x + Math.cos(angle) * dist - size / 2, top: y + Math.sin(angle) * dist - size / 2, opacity: 1 - t,
            transform: `rotate(${t * 180}deg)`}}>
            <path d="M10 0 Q11 9 20 10 Q11 11 10 20 Q9 11 0 10 Q9 9 10 0Z" fill={i % 3 ? MINT : CREAM} />
          </svg>
        );
      })}
    </>
  );
};

/** Hand-drawn arrow from the last row up to the gift. */
const Arrow: React.FC<{at: number; opacity: number}> = ({at, opacity}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + 14], [0, 1], {...clamp, easing: ease});
  const head = interpolate(frame, [at + 12, at + 18], [0, 1], clamp);
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity}}>
      <path d="M 712 1420 C 706 1290, 650 1180, 720 1046" fill="none" stroke={MINT} strokeWidth={11} strokeLinecap="round"
        strokeDasharray={420} strokeDashoffset={420 * (1 - t)} />
      <path d="M 682 1078 L 720 1040 L 754 1082" fill="none" stroke={MINT} strokeWidth={11} strokeLinecap="round"
        strokeLinejoin="round" opacity={head} />
    </svg>
  );
};

const Video: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  const data: GiftData = gifts[0];

  // Gift: right of the headline at first, then centred above the price.
  const move = interpolate(frame, [END, END + 26], [0, 1], {...clamp, easing: ease});
  const hop = frame >= HOP ? spring({frame: frame - HOP, fps, config: {damping: 8, stiffness: 180, mass: 0.6}}) : 0;
  const hopY = frame >= HOP && frame < HOP + 30 ? -Math.sin(Math.min(1, (frame - HOP) / 14) * Math.PI) * 70 : 0;
  const gx = interpolate(move, [0, 1], [735, 540]);
  const gy = interpolate(move, [0, 1], [762, 630]) + hopY;
  const gsize = interpolate(move, [0, 1], [900, 1120]);
  const squash = frame >= HOP && frame < HOP + 30 ? 1 + (1 - hop) * 0.06 : 1;

  const dimDone = interpolate(frame, [HOP + 20, HOP + 40], [0, 1], clamp);
  const padOut = interpolate(frame, [END - 4, END + 18], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const labelIn = pop(frame, fps, HOP + 6);

  const price = pop(frame, fps, PRICE);
  const bot = pop(frame, fps, BOT);
  const link = pop(frame, fps, LINK);
  const nudge = Math.sin((frame - LINK) / 5) * 8;

  return (
    <AbsoluteFill style={{background: ROSE_DEEP, overflow: 'hidden'}}>
      <Night glowX={gx} glowY={gy} />

      <Headline lines={['Yangi yilga', '*tayyormisiz?*']} from={0} to={HOOK_END} />
      <Headline lines={['Oxirgisi-chi?']} from={LAST} to={HOP + 34} />
      <Headline lines={['Ro‘yxatni', '*do‘stingizga*', 'yuboring']} from={SHARE} to={SHARE_END} size={104} />

      <div style={{position: 'absolute', inset: 0, transform: `translateY(${padOut * 900}px) rotate(${padOut * 6}deg)`,
        transformOrigin: '470px 1270px', opacity: 1 - padOut}}>
        <Notepad dimDone={dimDone} lastTick={HOP + 2} />
        <Arrow at={HOP - 4} opacity={1 - dimDone * 0.6} />
        <Burst at={HOP + 4} x={PAD.left + 72} y={ROW_Y(3) + 46} />
      </div>

      <div style={{position: 'absolute', inset: 0, transform: `scale(1, ${squash})`, transformOrigin: `${gx}px ${gy + gsize * 0.3}px`}}>
        <Freeze frame={0}><Gift data={data} x={gx} y={gy} size={gsize} /></Freeze>
      </div>

      {/* Name tag next to the gift after the hop. */}
      <div style={{position: 'absolute', left: 70, top: 640, opacity: Math.min(1, labelIn * 1.4) * (1 - move),
        transform: `translateX(${(1 - labelIn) * -40}px) rotate(-4deg)`, fontFamily: HAND, fontWeight: 700, fontSize: 84,
        color: MINT, display: frame >= HOP && move < 1 ? 'block' : 'none'}}>
        Vice Cream
        <div style={{fontFamily: HEAD, fontWeight: 600, fontSize: 40, color: CREAM, opacity: 0.8, marginTop: -6}}>#405488</div>
      </div>

      {/* Closing: price, bot, link. */}
      {frame >= PRICE - 2 && (
        <>
          <div style={{position: 'absolute', left: 70, top: 980, display: 'flex', alignItems: 'center', gap: 22,
            opacity: Math.min(1, price * 1.5), transform: `translateY(${(1 - price) * 40}px)`}}>
            <div style={{fontFamily: HEAD, fontWeight: 600, fontSize: 52, color: CREAM}}>Kuniga</div>
            <div style={{fontFamily: HEAD, fontWeight: 600, fontSize: 38, color: INK, background: MINT, borderRadius: 999,
              padding: '8px 24px'}}>3–30 kun</div>
          </div>
          <div style={{position: 'absolute', left: 62, top: 1040, fontFamily: HEAD, fontWeight: 800, fontSize: 168,
            letterSpacing: -5, color: MINT, opacity: Math.min(1, price * 1.5),
            transform: `scale(${0.85 + price * 0.15})`, transformOrigin: 'left center', textShadow: '0 10px 40px rgba(0,0,0,.4)'}}>
            750 so‘m
          </div>
          <div style={{position: 'absolute', left: 70, top: 1262, display: 'flex', alignItems: 'center', gap: 20,
            padding: '16px 38px 16px 16px', borderRadius: 999, background: CREAM, opacity: Math.min(1, bot * 1.5),
            transform: `scale(${0.8 + bot * 0.2})`, transformOrigin: 'left center', boxShadow: '0 20px 50px rgba(0,0,0,.4)'}}>
            <Img src={staticFile('logo.png')} style={{width: 92, height: 92, borderRadius: '50%', background: BRAND.ink}} />
            <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 50, color: INK}}>{BRAND.bot}</div>
          </div>
          <div style={{position: 'absolute', left: 70, top: 1430, fontFamily: HAND, fontWeight: 700, fontSize: 78, color: CREAM,
            opacity: Math.min(1, link * 1.5), transform: `translateY(${-Math.max(0, nudge) * link}px)`}}>
            ↑ Havola profilda
          </div>
        </>
      )}

      <Audio src={staticFile(`audio/bed_${ID}.wav`)} volume={(f) => interpolate(f, [0, 3, FRAMES - 24, FRAMES - 1], [0, 0.5, 0.5, 0], clamp)} />
      {ROWS.map((row, i) => (
        <Sequence key={i} from={row.at}><Audio src={staticFile('audio/scribble.wav')} volume={0.28} /></Sequence>
      ))}
      {ROWS.slice(0, 3).map((row, i) => (
        <Sequence key={i} from={row.at + TICK_DELAY}><Audio src={staticFile('audio/checkmark.wav')} volume={0.4} /></Sequence>
      ))}
      <Sequence from={HOP - 2}><Audio src={staticFile('audio/jingle.wav')} volume={0.55} /></Sequence>
      <Sequence from={HOP + 2}><Audio src={staticFile('audio/checkmark.wav')} volume={0.45} /></Sequence>
      <Sequence from={SHARE}><Audio src={staticFile('audio/glass.wav')} volume={0.3} /></Sequence>
      <Sequence from={END - 4}><Audio src={staticFile('audio/whoosh.wav')} volume={0.3} /></Sequence>
      <Sequence from={PRICE}><Audio src={staticFile('audio/chime.wav')} volume={0.35} /></Sequence>
      <Sequence from={BOT}><Audio src={staticFile('audio/pop.wav')} volume={0.3} /></Sequence>
    </AbsoluteFill>
  );
};

/** Cover: the finished list with the last line ticked, the gift and the title. */
const Cover: React.FC = () => {
  useFonts();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  return (
    <AbsoluteFill style={{background: ROSE_DEEP, overflow: 'hidden'}}>
      <Night glowX={735} glowY={762} />
      <div style={{position: 'absolute', left: 70, top: 236, fontFamily: HEAD, fontWeight: 800, fontSize: 124, lineHeight: 1.02,
        letterSpacing: -2, color: CREAM, textShadow: '0 8px 30px rgba(0,0,0,.45)'}}>
        Yangi yil<br /><span style={{color: MINT}}>ro‘yxati</span>
      </div>
      <Notepad dimDone={0} lastTick={HOP + 2} now={HOP + 40} />
      <Freeze frame={0}><Gift data={gifts[0]} x={735} y={762} size={900} /></Freeze>
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
