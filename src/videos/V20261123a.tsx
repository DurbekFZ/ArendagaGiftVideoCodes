// This package's exports map adds `.css` itself and ships no type declarations.
// @ts-ignore
import '@fontsource/bangers/400.css';
import {Lottie} from '@remotion/lottie';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Freeze, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random,
  spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {BRAND, GiftData, H, W, clamp, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "SYURPRIZ QUTI" — a pop-art comic panel built around the Jack-in-the-Box (model Let's Rock: a speaker box whose
// magenta lid springs open and a rock-hand pops out). The box itself "speaks": every time its lid springs open, a new
// comic speech bubble jumps out with it. Frame one already reads "Telegram NFT sovg‘a ijarasi / Kuniga 750 so‘m!";
// at 0.4 s the lid flies open, the hand pops out, a yellow comic burst explodes behind the box and speed lines flash.
// Then the lid shuts and springs open twice more: the model and its rarity, "3–30 kun profilingizda", and finally the
// price with the bot and the link. Print-inspired CMY palette on halftone dots. Silent, calm pad in C major.
const ID = 'V20261123a';
const GIFT = 'jackinthebox-71197'; // Let’s Rock model 1.5%, Persimmon backdrop 1.0%, Spider Web symbol 0.3%; 750 so‘m a day
const COMIC = "'Bangers', sans-serif";
const SANS = "'Manrope', sans-serif";

// Palette: the gift is a grey speaker box with a hot magenta lid, red panels and teal/violet music notes. The world is
// a comic page printed in the three process inks: cyan-teal background (complementary to the magenta-red of the box),
// magenta accent taken from the lid, and one extra hue, process yellow, only in the burst and caption boxes.
// Neutrals: paper cream and comic ink.
const TEAL_LIGHT = '#3fd0c4';
const TEAL = '#14a8a3';
const TEAL_DEEP = '#0a6f78';
const TEAL_EDGE = '#063f4a';
const MAGENTA = '#ff2e8c';
const YELLOW = '#ffd23f';
const CREAM = '#fff7e8';
const INK = '#1a1020';

// Timeline (30 fps).
const HAND0 = 12; // the hand pops out in the opening (gift frame 92)
const POPS = [165, 335, 470]; // later pops: model, 3–30 kun, price
const CTA = POPS[2] + 6; // bot and link arrive with the last bubble, as one block
const FRAMES = 594; // 19.8 s

// Gift geometry. Box 1000 px, centred at (470, 1190).
const GS = 1000;
const GX = 470;
const GY = 1190;
const TAIL = {x: 500, y: 830}; // where the bubble tail points (just above the hand)

const useFonts = () => {
  const [handle] = useState(() => delayRender('bangers'));
  useEffect(() => {
    Promise.all([`400 10px "Bangers"`, `800 10px "Manrope"`]
      .map((f) => document.fonts.load(f, 'KUNIGA 750 SO‘M O‘G‘ – ↑ 3–30 LET’S ROCK 1,5%')))
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

// Gift animation (180-frame loop): 14→35 the hand drops back and the lid shuts, 36→84 closed with notes floating,
// 86 the lid starts to open, 92 the hand appears, 100→179→0→20 the hand is out, rocking. Calm stretches ping-pong
// through 104–176 only (in 0–20 the box is turned and looks narrow). Each pop plays 14→35, then 80→99, so the hand appears exactly on the pop frame.
const CALM = Array.from({length: 73}, (_, i) => 104 + i); // 104–176: the box faces the viewer squarely
const calm = (n: number) => {
  const L = CALM.length - 1;
  const k = ((n % (2 * L)) + 2 * L) % (2 * L);
  return CALM[k <= L ? k : 2 * L - k];
};
const giftFrame = (f: number) => {
  if (f < 24) return 80 + f; // hand at f = 12
  for (const T of POPS) {
    const k = f - (T - 34);
    if (k >= 0 && k < 42) return k < 22 ? 14 + k : 80 + (k - 22);
  }
  const last = [24, ...POPS.map((T) => T + 8)].filter((s) => s <= f).pop()!;
  return calm(f - last);
};

/** All the moments the lid springs open. */
const ALL_POPS = [HAND0, ...POPS];
const sincePop = (f: number) => {
  const p = ALL_POPS.filter((at) => at <= f).pop();
  return p === undefined ? 999 : f - p;
};

/** Halftone dots, denser toward the edges of the page, drifting slowly. */
const Page: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 62% at 47% 60%, ${TEAL_LIGHT} 0%, ${TEAL} 42%, ${TEAL_DEEP} 80%, ${TEAL_EDGE} 100%)`}}>
    <AbsoluteFill style={{
      backgroundImage: `radial-gradient(circle, ${TEAL_EDGE} 0 7px, transparent 8px)`, backgroundSize: '30px 30px',
      backgroundPosition: `${f * 0.25}px ${f * 0.4}px`, opacity: 0.32,
      WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 47% 58%, transparent 25%, #000 85%)'}} />
    <AbsoluteFill style={{
      backgroundImage: `radial-gradient(circle, ${CREAM} 0 4px, transparent 5px)`, backgroundSize: '30px 30px',
      backgroundPosition: `${15 + f * 0.25}px ${15 + f * 0.4}px`, opacity: 0.13,
      WebkitMaskImage: 'radial-gradient(ellipse 50% 40% at 47% 60%, #000 10%, transparent 80%)'}} />
  </AbsoluteFill>
);

/** Comic speed lines radiating from the box, flashing at each pop. */
const Speed: React.FC<{f: number}> = ({f}) => {
  const t = sincePop(f);
  const o = interpolate(t, [0, 2, 20], [0, 0.42, 0], clamp);
  if (o <= 0) return null;
  const size = 2600;
  return (
    <div style={{position: 'absolute', left: GX - size / 2, top: GY - 120 - size / 2, width: size, height: size, opacity: o,
      transform: `rotate(${(ALL_POPS.indexOf(f - t) * 7) % 20}deg)`,
      background: `repeating-conic-gradient(from 0deg, ${INK} 0deg 1.6deg, transparent 1.6deg 9deg)`,
      WebkitMaskImage: 'radial-gradient(circle, transparent 20%, #000 34%, #000 100%)'}} />
  );
};

/** Jagged yellow comic burst behind the box: bursts big at each pop, then breathes. */
const Burst: React.FC<{f: number; still?: boolean}> = ({f, still}) => {
  const {fps} = useVideoConfig();
  const t = still ? 999 : sincePop(f);
  const s = still ? 1 : t > 200 ? 1 : 0.55 + 0.45 * spring({frame: t, fps, config: {damping: 9, stiffness: 160, mass: 0.6}});
  const firstIn = still ? 1 : interpolate(f, [0, HAND0, HAND0 + 1], [0.62, 0.66, 1], clamp);
  const n = 14;
  const pts = Array.from({length: n * 2}, (_, i) => {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? 1 : 0.68 + 0.08 * random(`burst-${i}`);
    return `${Math.cos(a) * r * 350},${Math.sin(a) * r * 350}`;
  }).join(' ');
  const breathe = still ? 0 : Math.sin(f / 14) * 1.5;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <g transform={`translate(${GX} ${GY - 70}) rotate(${-6 + breathe}) scale(${s * firstIn})`}>
        <polygon points={pts} fill={INK} transform="translate(14 16)" opacity={0.85} />
        <polygon points={pts} fill={YELLOW} stroke={INK} strokeWidth={10} strokeLinejoin="round" />
        <polygon points={pts} fill="none" stroke={CREAM} strokeWidth={4} transform="scale(0.86)" opacity={0.7} />
      </g>
    </svg>
  );
};

type Section = {caption?: string; top: string; big: string; topSize: number; bigSize: number};
const SECTIONS: Section[] = [
  {caption: 'Telegram NFT sovg‘a ijarasi', top: 'Kuniga', big: '750 so‘m!', topSize: 96, bigSize: 196},
  {caption: 'Bu — Jack-in-the-Box', top: '“Let’s Rock” modeli', big: 'atigi 1,5%', topSize: 92, bigSize: 196},
  {caption: 'Ijaraga oling', top: '3–30 kun', big: 'profilingizda', topSize: 150, bigSize: 128},
  {top: 'Kuniga', big: '750 so‘m', topSize: 86, bigSize: 176},
];
// Visible windows of each section: from its pop to 30 frames before the next pop.
const WINDOWS = [[0, POPS[0] - 30], [POPS[0], POPS[1] - 30], [POPS[1], POPS[2] - 30], [POPS[2], FRAMES + 10]];

/** Bubble geometry per section. */
const BUBBLE = [
  {x: 70, y: 330, w: 800, h: 400},
  {x: 70, y: 330, w: 800, h: 400},
  {x: 70, y: 330, w: 800, h: 400},
  {x: 70, y: 250, w: 800, h: 300},
];

const Bubble: React.FC<{k: number; f: number; still?: boolean}> = ({k, f, still}) => {
  const {fps} = useVideoConfig();
  const [from, to] = WINDOWS[k];
  const sec = SECTIONS[k];
  const b = BUBBLE[k];
  let s = 1;
  let jolt = 0;
  if (!still) {
    if (k > 0) s = spring({frame: f - from, fps, config: {damping: 10, stiffness: 170, mass: 0.6}});
    s *= interpolate(f, [to - 7, to], [1, 0], clamp);
    if (k === 0) jolt = Math.exp(-Math.max(0, f - HAND0) / 5) * Math.sin(Math.max(0, f - HAND0) / 1.6) * (f >= HAND0 ? 0.07 : 0);
  }
  if (s <= 0.001) return null;
  const ox = TAIL.x - b.x;
  const oy = TAIL.y - b.y;
  const capIn = still ? 1 : k === 0 ? 1 : spring({frame: f - from - 5, fps, config: {damping: 13, stiffness: 160, mass: 0.6}});
  const capOut = still ? 1 : interpolate(f, [to - 7, to], [1, 0], clamp);
  const tailBaseX = Math.min(b.w - 120, ox - 60);
  const tail = k < 3;
  return (
    <>
      <div style={{position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h,
        transformOrigin: `${ox}px ${oy}px`, transform: `scale(${s * (1 + jolt)}) rotate(${-1.2 + jolt * 20}deg)`}}>
        <svg width={b.w} height={TAIL.y - b.y + 20} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {/* hard magenta offset shadow, then the cream bubble with an ink outline */}
          <g transform="translate(16 18)">
            <rect x={0} y={0} width={b.w} height={b.h} rx={70} fill={MAGENTA} />
            {tail && <path d={`M ${tailBaseX} ${b.h - 10} L ${ox} ${oy - 8} L ${tailBaseX + 130} ${b.h - 10} Z`} fill={MAGENTA} />}
          </g>
          {tail && <path d={`M ${tailBaseX} ${b.h - 30} L ${ox} ${oy - 8} L ${tailBaseX + 130} ${b.h - 30}`} fill={CREAM}
            stroke={INK} strokeWidth={10} strokeLinejoin="round" />}
          <rect x={0} y={0} width={b.w} height={b.h} rx={70} fill={CREAM} stroke={INK} strokeWidth={10} />
          {tail && <rect x={tailBaseX + 6} y={b.h - 14} width={118} height={10} fill={CREAM} />}
          {/* a tiny halftone shading in the bubble's lower right corner */}
          <defs>
            <pattern id={`dots-${k}`} width={18} height={18} patternUnits="userSpaceOnUse">
              <circle cx={9} cy={9} r={4} fill={MAGENTA} opacity={0.22} />
            </pattern>
            <radialGradient id={`fade-${k}`} cx="1" cy="1" r="0.7">
              <stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#000" />
            </radialGradient>
            <mask id={`m-${k}`}><rect x={0} y={0} width={b.w} height={b.h} fill={`url(#fade-${k})`} /></mask>
          </defs>
          <rect x={12} y={12} width={b.w - 24} height={b.h - 24} rx={60} fill={`url(#dots-${k})`} mask={`url(#m-${k})`} />
        </svg>
        <div style={{position: 'absolute', left: 0, top: 0, width: b.w, height: b.h, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: COMIC, color: INK,
          textTransform: 'uppercase', letterSpacing: 2}}>
          <div style={{fontSize: sec.topSize, lineHeight: 0.95, whiteSpace: 'nowrap', color: k === 2 ? MAGENTA : INK}}>{sec.top}</div>
          <div style={{fontSize: sec.bigSize, lineHeight: 0.92, whiteSpace: 'nowrap', color: k === 2 ? INK : MAGENTA,
            WebkitTextStroke: `4px ${INK}`, paintOrder: 'stroke fill', textShadow: k === 2 ? 'none' : `7px 8px 0 ${INK}`}}>{sec.big}</div>
        </div>
      </div>
      {sec.caption && (
        <div style={{position: 'absolute', left: 70, top: 232, opacity: Math.min(1, capIn * 2) * capOut,
          transform: `translateX(${(1 - capIn) * -120}px) rotate(-2.5deg)`, transformOrigin: 'left center'}}>
          <div style={{display: 'inline-block', background: YELLOW, border: `7px solid ${INK}`, boxShadow: `9px 10px 0 ${INK}`,
            padding: '10px 26px 12px', fontFamily: SANS, fontWeight: 800, fontSize: 40, letterSpacing: 2, color: INK,
            textTransform: 'uppercase', whiteSpace: 'nowrap'}}>{sec.caption}</div>
        </div>
      )}
    </>
  );
};

/** Bot handle and link, under the last bubble. */
const Ending: React.FC<{f: number; still?: boolean}> = ({f, still}) => {
  const {fps} = useVideoConfig();
  if (!still && f < CTA) return null;
  const a = still ? 1 : spring({frame: f - CTA, fps, config: {damping: 12, stiffness: 160, mass: 0.6}});
  const b = still ? 1 : spring({frame: f - CTA - 8, fps, config: {damping: 12, stiffness: 160, mass: 0.6}});
  const nudge = still ? 0 : Math.abs(Math.sin((f - CTA) / 8)) * 7 * Math.min(1, Math.max(0, (f - CTA - 24) / 10));
  return (
    <>
      <div style={{position: 'absolute', left: 80, top: 596, opacity: Math.min(1, a * 2), transform: `scale(${0.6 + a * 0.4}) rotate(-1.5deg)`,
        transformOrigin: 'left center'}}>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 18, padding: '10px 34px 10px 10px', borderRadius: 999,
          background: INK, border: `6px solid ${CREAM}`, boxShadow: `9px 10px 0 ${MAGENTA}`}}>
          <Img src={staticFile('logo.png')} style={{width: 76, height: 76, borderRadius: '50%', background: BRAND.ink}} />
          <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 48, color: CREAM}}>{BRAND.bot}</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 470, top: 712, opacity: Math.min(1, b * 2),
        transform: `translateY(${(1 - b) * 30 - nudge}px) rotate(2deg)`}}>
        <div style={{display: 'inline-block', background: YELLOW, border: `6px solid ${INK}`, boxShadow: `8px 9px 0 ${INK}`,
          padding: '6px 24px 8px', fontFamily: SANS, fontWeight: 800, fontSize: 46, color: INK, whiteSpace: 'nowrap'}}>↑ Havola profilda</div>
      </div>
    </>
  );
};

const Scene: React.FC<{data: GiftData; frame: number; still?: boolean}> = ({data, frame, still}) => {
  const f = frame;
  const t = still ? 999 : sincePop(f);
  // A short comic shake of the whole panel at each pop.
  const shake = t < 10 ? (1 - t / 10) * 9 : 0;
  const sx = shake * Math.sin(t * 2.7);
  const sy = shake * Math.cos(t * 3.3);
  const bob = still ? 0 : Math.sin(f / 22) * 6;
  // The box squashes slightly as its lid springs open.
  const squash = still ? 0 : Math.exp(-Math.max(0, t) / 4) * Math.sin(t / 1.4) * (t < 30 ? 0.05 : 0);
  const at = still ? 112 : giftFrame(f);
  const k = still ? 0 : WINDOWS.findIndex(([a, b]) => f >= a && f < b);
  return (
    <AbsoluteFill style={{background: INK}}>
      <AbsoluteFill style={{transform: `translate(${sx}px ${sy}px)`}}>
        <Page f={f} />
        {!still && <Speed f={f} />}
        <Burst f={f} still={still} />
        {/* comic floor: a darker band with an ink horizon line, so the box stands on something */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 1440, bottom: 0,
          background: `linear-gradient(180deg, ${TEAL_DEEP} 0%, ${TEAL_EDGE} 100%)`, borderTop: `10px solid ${INK}`}}>
          <div style={{position: 'absolute', inset: 0, opacity: 0.35,
            backgroundImage: `radial-gradient(circle, ${YELLOW} 0 5px, transparent 6px)`, backgroundSize: '26px 26px',
            WebkitMaskImage: 'linear-gradient(180deg, #000 0%, transparent 70%)'}} />
        </div>
        {/* contact shadow */}
        <div style={{position: 'absolute', left: GX - 290, top: GY + 0.33 * GS - 50, width: 580, height: 90, borderRadius: '50%',
          background: `radial-gradient(ellipse, rgba(6,63,74,.75) 0%, rgba(6,63,74,0) 70%)`}} />
        <div style={{position: 'absolute', left: GX - GS / 2, top: GY - GS / 2 + bob, width: GS, height: GS,
          transformOrigin: '50% 80%', transform: `scale(${1 + squash}, ${1 - squash})`,
          filter: `drop-shadow(10px 12px 0 ${INK}) drop-shadow(0 30px 40px rgba(6,63,74,.5))`}}>
          <Freeze frame={at}>
            <Lottie animationData={data.gift} style={{width: GS, height: GS}} />
          </Freeze>
        </div>
        {still ? <Bubble k={0} f={0} still /> : k >= 0 && <Bubble k={k} f={f} />}
        {!still && <Ending f={f} />}
      </AbsoluteFill>
      {/* comic panel border */}
      <div style={{position: 'absolute', inset: 18, border: `12px solid ${INK}`, borderRadius: 10, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};

const Video: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  return (
    <AbsoluteFill>
      <Scene data={gifts[0]} frame={frame} />
      <Audio src={staticFile(`audio/bed_${ID}.wav`)}
        volume={(f) => interpolate(f, [0, 6, FRAMES - 30, FRAMES - 1], [0, 0.26, 0.26, 0], clamp)} />
      {ALL_POPS.map((at, i) => (
        <Sequence key={at} from={at - 4}><Audio src={staticFile('audio/springbox.wav')} volume={i === 0 ? 0.34 : 0.24} /></Sequence>
      ))}
      <Sequence from={CTA}><Audio src={staticFile('audio/cardflip.wav')} volume={0.12} /></Sequence>
    </AbsoluteFill>
  );
};

const Cover: React.FC = () => {
  useFonts();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  return <Scene data={gifts[0]} frame={0} still />;
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
