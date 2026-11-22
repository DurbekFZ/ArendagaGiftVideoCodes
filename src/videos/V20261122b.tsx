// This package's exports map adds `.css` itself and ships no type declarations.
// @ts-ignore
import '@fontsource/playfair-display/900.css';
// @ts-ignore
import '@fontsource/playfair-display/900-italic.css';
import {Lottie} from '@remotion/lottie';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Freeze, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random,
  spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {BRAND, GiftData, H, W, clamp, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "NARX YORLIG‘I" — a boutique price tag tied to the gift. The Pool Float (model Disco: a mirror-ball swim ring with a
// champagne bottle) floats in a warm champagne-gold room lit by slow mirror-ball reflections; a big cream swing tag
// hangs from it on a twine string, and the tag is the only place text lives. Frame one: the tag already reads
// "Telegram NFT sovg‘a ijarasi / Kuniga / 750 so‘m". At 0.45 s the bottle's cork pops in the gift's own animation,
// champagne bursts upward and the tag swings on its string. The tag then flips over, like a real tag turned in the
// hand, three times: model and rarity, "3–30 kun profilingizda turadi", and the price with the bot and the link,
// where the cork pops once more. No headline band, no pill kicker, no sticker. Silent, calm pad in F major.
const ID = 'V20261122b';
const GIFT = 'poolfloat-125175'; // Disco model 2%, Old Gold backdrop 1.5%, Beanie symbol 0.5%; 750 so‘m a day
const SERIF = "'Playfair Display', serif";
const SANS = "'Manrope', sans-serif";

// Palette. The gift is silver mirror tiles, a green bottle and gold foil on an Old Gold backdrop. Background family:
// champagne gold (analogous to the backdrop and the foil). Accent: the bottle's emerald, roughly complementary to the
// warm gold. Neutrals: tag cream and espresso ink. One extra hue, iridescent pink from the mirror tiles, only in light.
const GOLD_LIGHT = '#f4c862';
const GOLD = '#cf9a34';
const GOLD_DEEP = '#7a5214';
const GOLD_EDGE = '#3e2707';
const EMERALD = '#0f7a4c';
const CREAM = '#fff5de';
const INK = '#2a1806';
const PINK = '#ffb6d3';
const ICE = '#d4f0ff';

// Timeline (30 fps).
const POP = 14; // the cork leaves the bottle (gift frame ~92)
const FLIPS = [150, 300, 428]; // tag turned over: rarity, 3–30 kun, price
const FLIP_LEN = 12;
const CTA = 470; // bot and link on the tag, the cork pops again
const FRAMES = 566; // 18.9 s

// Gift geometry. The artwork fills ~30–73% of its box across and ~29–78% down (the champagne reaches ~12% when it gushes).
const GS = 1300;
const GX = 500;
const GY = 585;
const NECK = {x: GX + 0.05 * GS, y: GY - 0.29 * GS}; // bottle mouth at the moment of the pop

// The tag. Pivot (eyelet) at (470, 1050); tag spans x 80–860, y 1000–1530.
const TAG = {x: 80, y: 1000, w: 780, h: 530};
const EYE = {x: 390, y: 52};

const useFonts = () => {
  const [handle] = useState(() => delayRender('playfair'));
  useEffect(() => {
    Promise.all([`900 10px "Playfair Display"`, `italic 900 10px "Playfair Display"`, `800 10px "Manrope"`]
      .map((f) => document.fonts.load(f, 'KUNIGA 750 so‘m o‘g‘ – ↑ 3–30 Disco')))
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

const io = Easing.inOut(Easing.cubic);

// Gift animation: the opening plays 78 → 150 (sink, pop, gush, settle); afterwards an upright, sparkling stretch
// (150 → 179 → 0 → 56 of the loop) is played back and forth. At the call to action the pop replays from 60.
const CALM_A = 150;
const CALM_LEN = 86;
const calm = (n: number) => {
  const k = ((n % (2 * CALM_LEN)) + 2 * CALM_LEN) % (2 * CALM_LEN);
  return (CALM_A + (k <= CALM_LEN ? k : 2 * CALM_LEN - k)) % 180;
};
const giftFrame = (f: number) => {
  if (f < 72) return 78 + f;
  if (f >= CTA - 32 && f < CTA - 32 + 90) return 60 + (f - (CTA - 32)); // pop at gift 92 → video frame CTA
  if (f >= CTA - 32 + 90) return calm(f - (CTA - 32 + 90));
  return calm(f - 72);
};

/** Mirror-ball reflections: soft round light spots drifting slowly around the gift. */
const Lights: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{mixBlendMode: 'screen'}}>
    {Array.from({length: 18}, (_, i) => {
      const r = (k: string) => random(`light-${i}-${k}`);
      const a = r('a') * Math.PI * 2 + f * (0.004 + r('s') * 0.003);
      const d = 260 + r('d') * 700;
      const x = 540 + Math.cos(a) * d;
      const y = 760 + Math.sin(a) * d * 1.25;
      const size = 70 + r('z') * 150;
      const color = [CREAM, PINK, ICE][i % 3];
      const o = (0.16 + r('o') * 0.2) * (0.75 + 0.25 * Math.sin(f / 13 + i));
      return <div key={i} style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size,
        borderRadius: '50%', opacity: o, background: `radial-gradient(circle, ${color} 0%, ${color} 35%, transparent 70%)`}} />;
    })}
  </AbsoluteFill>
);

/** Champagne bubbles rising slowly through the room. */
const Bubbles: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill>
    {Array.from({length: 26}, (_, i) => {
      const r = (k: string) => random(`bub-${i}-${k}`);
      const speed = 1.2 + r('v') * 2.2;
      const y = ((r('y') * (H + 200) - f * speed) % (H + 200) + H + 200) % (H + 200) - 100;
      const x = r('x') * W + Math.sin(f / (18 + r('w') * 20) + i) * 14;
      const s = 10 + r('s') * 26;
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%',
        border: `3px solid ${CREAM}`, opacity: 0.18 + r('o') * 0.22}} />;
    })}
  </AbsoluteFill>
);

const Room: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 85% 60% at 50% 38%, ${GOLD_LIGHT} 0%, ${GOLD} 45%, ${GOLD_DEEP} 82%, ${GOLD_EDGE} 100%)`}}>
    <Lights f={f} />
    <Bubbles f={f} />
    {/* a faint diagonal sheen sweeping slowly, like light on satin */}
    <AbsoluteFill style={{opacity: 0.16, background: `linear-gradient(115deg, transparent ${20 + (f % 240) / 4}%, ${CREAM} ${30 + (f % 240) / 4}%, transparent ${40 + (f % 240) / 4}%)`}} />
  </AbsoluteFill>
);

/** Champagne spray from the bottle mouth at a pop. */
const Spray: React.FC<{f: number; at: number; seed: string; scale?: number}> = ({f, at, seed, scale = 1}) => {
  const t = f - at;
  if (t < 0 || t > 50) return null;
  return (
    <AbsoluteFill>
      {Array.from({length: 26}, (_, i) => {
        const r = (k: string) => random(`${seed}-${i}-${k}`);
        const a = (-155 + r('a') * 130) * Math.PI / 180;
        const v = (7 + r('v') * 11) * scale;
        const x = NECK.x + Math.cos(a) * v * t;
        const y = NECK.y + Math.sin(a) * v * t + 0.32 * t * t;
        const s = (8 + r('s') * 18) * (1 - t / 60);
        const color = [CREAM, GOLD_LIGHT, PINK, ICE][i % 4];
        return <div key={i} style={{position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: '50%',
          background: color, opacity: interpolate(t, [0, 4, 36, 50], [0, 1, 1, 0], clamp), boxShadow: `0 0 ${s}px ${color}`}} />;
      })}
    </AbsoluteFill>
  );
};

/** Little four-point glints on the mirror tiles of the ring. */
const Glints: React.FC<{f: number; bob: number}> = ({f, bob}) => (
  <AbsoluteFill>
    {[[0.34, 0.66], [0.47, 0.75], [0.62, 0.72], [0.70, 0.62], [0.40, 0.58]].map(([u, v], i) => {
      const flare = Math.max(0, ...FLIPS.map((at) => 1 - Math.abs(f - at - 6 - i * 2) / 10));
      const tw = Math.max(0, Math.sin(f / 9 + i * 2.1)) ** 6;
      const s = 34 + 56 * Math.max(tw, flare);
      const x = GX - GS / 2 + u * GS;
      const y = GY - GS / 2 + v * GS + bob;
      return <svg key={i} width={s} height={s} viewBox="0 0 20 20" style={{position: 'absolute', left: x - s / 2, top: y - s / 2,
        opacity: Math.max(tw, flare), filter: `drop-shadow(0 0 8px ${CREAM})`}}>
        <path d="M10 0 Q11 9 20 10 Q11 11 10 20 Q9 11 0 10 Q9 9 10 0Z" fill="#fff" />
      </svg>;
    })}
  </AbsoluteFill>
);

const Small: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 31, letterSpacing: 3, color: GOLD_DEEP, textTransform: 'uppercase'}}>{children}</div>
);
const Big: React.FC<{children: React.ReactNode; size?: number; italic?: boolean; color?: string}> =
  ({children, size = 150, italic, color = EMERALD}) => (
    <div style={{fontFamily: SERIF, fontWeight: 900, fontStyle: italic ? 'italic' : 'normal', fontSize: size, lineHeight: 1.0,
      color, letterSpacing: -2, whiteSpace: 'nowrap'}}>{children}</div>
  );
const Line: React.FC<{children: React.ReactNode; size?: number}> = ({children, size = 64}) => (
  <div style={{fontFamily: SERIF, fontWeight: 900, fontStyle: 'italic', fontSize: size, lineHeight: 1.05, color: INK, whiteSpace: 'nowrap'}}>{children}</div>
);

/** What is written on each side of the tag. */
const Side: React.FC<{k: number; f: number; still?: boolean}> = ({k, f, still}) => {
  const {fps} = useVideoConfig();
  if (k === 0) return (<>
    <Small>Telegram NFT sovg‘a ijarasi</Small>
    <div style={{height: 18}} />
    <Line size={74}>Kuniga</Line>
    <Big size={150}>750 so‘m</Big>
  </>);
  if (k === 1) return (<>
    <Small>Bu — Pool Float</Small>
    <div style={{height: 6}} />
    <Big size={170} italic>Disco</Big>
    <Line size={62}>modeli</Line>
    <div style={{marginTop: 22, fontFamily: SANS, fontWeight: 800, fontSize: 44, color: CREAM, background: EMERALD,
      borderRadius: 999, padding: '8px 34px 12px'}}>noyoblik atigi 2%</div>
  </>);
  if (k === 2) return (<>
    <Small>Ijaraga oling</Small>
    <div style={{height: 14}} />
    <Big size={160}>3–30 kun</Big>
    <div style={{height: 10}} />
    <Line size={64}>profilingizda turadi</Line>
  </>);
  const cta = still ? 1 : spring({frame: f - CTA, fps, config: {damping: 14, stiffness: 160, mass: 0.7}});
  const nudge = still ? 0 : Math.abs(Math.sin((f - CTA) / 8)) * 6 * Math.min(1, Math.max(0, (f - CTA - 20) / 10));
  return (<>
    <Small>Pool Float · kuniga</Small>
    <div style={{height: 4}} />
    <Big size={146}>750 so‘m</Big>
    <div style={{opacity: Math.min(1, cta * 2), transform: `translateY(${(1 - cta) * 26}px)`, display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 16, marginTop: 22}}>
      <div style={{display: 'inline-flex', alignItems: 'center', gap: 16, padding: '8px 30px 8px 8px', borderRadius: 999, background: INK}}>
        <Img src={staticFile('logo.png')} style={{width: 64, height: 64, borderRadius: '50%', background: BRAND.ink}} />
        <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: CREAM}}>{BRAND.bot}</span>
      </div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: CREAM, background: EMERALD, borderRadius: 999,
        padding: '6px 30px 10px', transform: `translateY(${-nudge}px)`}}>↑ Havola profilda</div>
    </div>
  </>);
};

const TagShape: React.FC = () => {
  const {w, h} = TAG;
  const c = 92; // chamfer of the top corners
  const d = `M ${c} 0 L ${w - c} 0 L ${w} ${c} L ${w} ${h - 34} Q ${w} ${h} ${w - 34} ${h} L 34 ${h} Q 0 ${h} 0 ${h - 34} L 0 ${c} Z`;
  const inner = `M ${c + 6} 18 L ${w - c - 6} 18 L ${w - 18} ${c + 6} L ${w - 18} ${h - 40} Q ${w - 18} ${h - 18} ${w - 40} ${h - 18} L 40 ${h - 18} Q 18 ${h - 18} 18 ${h - 40} L 18 ${c + 6} Z`;
  return (
    <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <linearGradient id="paper" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#fffaf0" /><stop offset="1" stopColor="#f6e7c6" />
        </linearGradient>
        <radialGradient id="eyelet">
          <stop offset="0.45" stopColor={GOLD_DEEP} /><stop offset="0.55" stopColor={GOLD_LIGHT} /><stop offset="1" stopColor={GOLD} />
        </radialGradient>
      </defs>
      <path d={d} fill="url(#paper)" />
      <path d={inner} fill="none" stroke={GOLD} strokeWidth={3} strokeDasharray="14 10" opacity={0.7} />
      <circle cx={EYE.x} cy={EYE.y} r={25} fill="url(#eyelet)" />
      <circle cx={EYE.x} cy={EYE.y} r={11} fill={GOLD_EDGE} />
    </svg>
  );
};

const Scene: React.FC<{data: GiftData; frame: number; still?: boolean}> = ({data, frame, still}) => {
  const f = frame;
  const bob = still ? 0 : Math.sin(f / 24) * 8;
  // Swing of the tag on its string: kicked by each pop, a little by each flip, damped quickly so text stays readable.
  const kick = (at: number, amp: number) => (f < at ? 0 : amp * Math.exp(-(f - at) / 16) * Math.sin((f - at) / 4.5));
  const swing = still ? 0 : kick(POP + 2, 5) + kick(CTA + 2, 3) + FLIPS.reduce((s, at) => s + kick(at + FLIP_LEN, 1.6), 0)
    + Math.sin(f / 37) * 0.6;
  // Flip state.
  let side = 0;
  let angle = 0;
  if (!still) {
    for (let i = 0; i < FLIPS.length; i++) {
      const at = FLIPS[i];
      if (f >= at + FLIP_LEN / 2) side = i + 1;
      if (f >= at && f < at + FLIP_LEN) {
        const a = io((f - at) / FLIP_LEN) * 180;
        angle = a <= 90 ? a : a - 180;
      }
    }
  }
  const at = still ? 160 : giftFrame(f);
  return (
    <AbsoluteFill>
      <Room f={f} />
      {/* soft contact shadow under the ring */}
      <div style={{position: 'absolute', left: GX - 300, top: GY + 0.27 * GS - 40 + bob * 0.3, width: 600, height: 110, borderRadius: '50%',
        background: `radial-gradient(ellipse, rgba(62,39,7,.45) 0%, rgba(62,39,7,0) 70%)`}} />
      {/* twine from the ring down to the eyelet */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(0 ${bob})`}>
          <path d={`M ${TAG.x + EYE.x} ${TAG.y + EYE.y} L 440 905 M ${TAG.x + EYE.x} ${TAG.y + EYE.y} L 506 905`}
            stroke={GOLD_EDGE} strokeWidth={9} strokeLinecap="round" opacity={0.35} transform="translate(3 4)" />
          <path d={`M ${TAG.x + EYE.x} ${TAG.y + EYE.y} L 440 905 M ${TAG.x + EYE.x} ${TAG.y + EYE.y} L 506 905`}
            stroke={CREAM} strokeWidth={7} strokeLinecap="round" />
        </g>
      </svg>
      <div style={{position: 'absolute', left: GX - GS / 2, top: GY - GS / 2 + bob, width: GS, height: GS,
        filter: 'drop-shadow(0 26px 30px rgba(62,39,7,.4))'}}>
        <Freeze frame={at}>
          <Lottie animationData={data.gift} style={{width: GS, height: GS}} />
        </Freeze>
      </div>
      {!still && <Glints f={f} bob={bob} />}
      {!still && <Spray f={f} at={POP + 4} seed="pop1" />}
      {!still && <Spray f={f} at={CTA + 4} seed="pop2" scale={0.8} />}

      {/* the tag */}
      <div style={{position: 'absolute', left: TAG.x, top: TAG.y + bob, width: TAG.w, height: TAG.h, perspective: 1800,
        transformOrigin: `${EYE.x}px ${EYE.y}px`, transform: `rotate(${swing}deg)`}}>
        <div style={{position: 'absolute', inset: 0, transform: `rotateY(${angle}deg)`, transformOrigin: `${EYE.x}px 50%`,
          filter: 'drop-shadow(0 22px 26px rgba(42,24,6,.45))'}}>
          <TagShape />
          <div style={{position: 'absolute', left: 0, right: 0, top: 96, bottom: 30, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
            <Side k={side} f={f} still={still} />
          </div>
        </div>
      </div>
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
        volume={(f) => interpolate(f, [0, 8, FRAMES - 30, FRAMES - 1], [0, 0.28, 0.28, 0], clamp)} />
      <Sequence from={POP - 3}><Audio src={staticFile('audio/cork.wav')} volume={0.3} /></Sequence>
      {FLIPS.map((at) => (
        <Sequence key={at} from={at}><Audio src={staticFile('audio/cardflip.wav')} volume={0.22} /></Sequence>
      ))}
      <Sequence from={CTA - 3}><Audio src={staticFile('audio/cork.wav')} volume={0.2} /></Sequence>
    </AbsoluteFill>
  );
};

const Cover: React.FC = () => {
  useFonts();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  return (
    <AbsoluteFill>
      <Scene data={gifts[0]} frame={0} still />
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
