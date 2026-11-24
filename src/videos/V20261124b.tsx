// @ts-ignore
import '@fontsource/paytone-one/400';
import {Lottie} from '@remotion/lottie';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Freeze, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random,
  spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {BRAND, GiftData, H, W, clamp, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "SEHRLI SHIRA" — the Hex Pot is the star. A huge neon cauldron (aqua pot, pink potion, one eye) stands on a deep
// violet stage full of slow lava-lamp blobs and rising bubbles. Frame one already reads "Telegram NFT sovg‘a
// ijarasi / Kuniga 750 so‘m"; at 0.27 s the pot bursts into its own flame and hops. The pot's own 5-second cycle
// drives the edit: every time it flares again, a thick pink syrup curtain pours down behind it (the pot stays in
// front), covers the old line and pulls back up with the next one. Three lines: "Profilingizda turadi / 3 kundan
// 30 kungacha", "Hex Pot / Silver Blue fon — atigi 1%", and the price with the bot and the link. Silent, calm pad.
const ID = 'V20261124b';
const GIFT = 'hexpot-42707'; // Silver Blue backdrop 1%, Scarecrow symbol 2%; 750 so‘m a day
const HEAD = "'Paytone One', sans-serif";
const SANS = "'Manrope', sans-serif";

// Palette. The pot is aqua glass with a hot-pink potion and violet drips. Background family: deep violet (between
// the pink and the blue of the gift, much darker, so both glow against it). Accent: the potion's hot pink (price,
// syrup). Neutral: pink-white cream and violet-black ink. Extra hue: the pot's own aqua, for the pill and small marks.
const BG_1 = '#53208a';
const BG_2 = '#2a0b4a';
const BG_3 = '#0f0322';
const PINK = '#ff4694';
const PINK_DEEP = '#c4176e';
const PINK_HI = '#ff9cc6';
const AQUA = '#45f0d6';
const CREAM = '#fff3fa';
const INK = '#170722';

// Timeline (30 fps). The pot's animation is 150 frames; it is shown 8 frames ahead, so it flares at 8, 158, 308, 458.
const LEAD = 8;
const CYCLE = 150;
const FLARES = [8, 158, 308, 458];
const S1 = 158; // syrup covers: line 2
const S2 = 308; // line 3
const S3 = 458; // price, bot and link
const IN = 14; // a new line arrives this long after the syrup has covered
const SUB = 30; // its second part one second later
const FRAMES = 594; // 19.8 s

// Gift geometry. The pot fills ~20–80% of its box across and ~18–82% down.
const GS = 1120;
const GX = 470;
const GY = 1170;
const GS_END = 980; // a little smaller at the end, to leave room for the bot and the link
const GY_END = 1222;

const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([`400 10px "Paytone One"`, `800 10px "Manrope"`]
      .map((f) => document.fonts.load(f, 'KUNIGA 750 so‘m o‘g‘ — ↑ 1% Hex Pot Profilingizda')))
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

const popIn = (frame: number, fps: number, at: number) =>
  spring({frame: frame - at, fps, config: {damping: 14, stiffness: 170, mass: 0.7}});

/** Deep violet stage with drifting lava-lamp blobs, rising bubbles and a pink glow under the pot. */
const Stage: React.FC<{frame: number; glow: number}> = ({frame, glow}) => {
  const blobs = [
    {x: 180, y: 520, r: 380, c: PINK, s: 0.8},
    {x: 940, y: 380, r: 320, c: AQUA, s: 1.1},
    {x: 860, y: 1260, r: 420, c: '#8a3dff', s: 0.7},
    {x: 120, y: 1480, r: 340, c: AQUA, s: 0.9},
    {x: 560, y: 1820, r: 460, c: PINK, s: 0.6},
  ];
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 60% at 46% 58%, ${BG_1} 0%, ${BG_2} 52%, ${BG_3} 100%)`}}>
      {blobs.map((b, i) => {
        const x = b.x + Math.sin(frame / (70 / b.s) + i * 1.7) * 70;
        const y = b.y + Math.cos(frame / (90 / b.s) + i) * 60;
        const r = b.r * (1 + 0.08 * Math.sin(frame / 40 + i));
        return <div key={i} style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2,
          borderRadius: '50%', background: `radial-gradient(circle, ${b.c} 0%, transparent 68%)`, opacity: 0.26,
          mixBlendMode: 'screen'}} />;
      })}
      {Array.from({length: 22}, (_, i) => {
        const r = (k: string) => random(`hexbub-${i}-${k}`);
        const speed = 1.2 + r('s') * 2.4;
        const y = ((r('y') * (H + 200) - frame * speed) % (H + 200) + H + 200) % (H + 200) - 100;
        const x = r('x') * W + Math.sin(frame / (18 + r('w') * 20) + i) * 20;
        const s = 14 + r('z') * 36;
        return <div key={'b' + i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%',
          border: `3px solid ${r('c') > 0.5 ? AQUA : PINK_HI}`, opacity: 0.22 + r('o') * 0.3,
          boxShadow: `inset -4px -4px 0 rgba(255,255,255,.18)`}} />;
      })}
      <div style={{position: 'absolute', left: GX - 520, top: 1290, width: 1040, height: 440, borderRadius: '50%',
        background: `radial-gradient(ellipse, ${PINK} 0%, rgba(255,70,148,0) 66%)`, opacity: 0.32 + glow * 0.45}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,2,24,.45) 0%, rgba(10,2,24,0) 16%, rgba(10,2,24,0) 78%, rgba(10,2,24,.55) 100%)'}} />
    </AbsoluteFill>
  );
};

/** How bright the pot's own fire is around a flare (0..1), for the floor glow. */
const fire = (frame: number) => Math.max(...FLARES.map((s) =>
  interpolate(frame, [s, s + 6, s + 40, s + 60], [0, 1, 0.8, 0], clamp)));

/** The pot with its own animation, hopping on each flare (moves only, never squashed). */
const Pot: React.FC<{data: GiftData; frame: number; at: number; size: number; y: number}> = ({data, frame, at, size, y}) => {
  const hop = Math.max(...FLARES.map((s) => {
    const d = frame - s;
    return d < 0 || d > 22 ? 0 : Math.sin((Math.PI * d) / 22) * (1 - d / 30) * 70;
  }));
  const bob = Math.sin(frame / 19) * 8;
  return (
    <div style={{position: 'absolute', left: GX - size / 2, top: y - size / 2 + bob - hop, width: size, height: size,
      filter: 'drop-shadow(0 34px 40px rgba(8,0,20,.55))'}}>
      <Freeze frame={at}>
        <Lottie animationData={data.gift} style={{width: size, height: size}} />
      </Freeze>
    </div>
  );
};

/** Thick pink syrup hanging from the top edge. `edge` is where its body ends; drips hang below it. */
const Syrup: React.FC<{edge: number; stretch: number; frame: number}> = ({edge, stretch, frame}) => {
  const drips = [
    {x: 40, w: 90, l: 70}, {x: 170, w: 120, l: 150}, {x: 330, w: 80, l: 60}, {x: 450, w: 130, l: 190},
    {x: 620, w: 90, l: 90}, {x: 740, w: 110, l: 140}, {x: 900, w: 80, l: 70}, {x: 990, w: 100, l: 120},
  ];
  const fill = `linear-gradient(180deg, ${PINK_DEEP} 0%, ${PINK} 70%, ${PINK_HI} 100%)`;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', filter: 'drop-shadow(0 18px 26px rgba(10,0,25,.45))'}}>
      <div style={{position: 'absolute', left: -20, right: -20, top: -40, height: edge + 40, background: fill}} />
      {drips.map((d, i) => {
        const l = d.l * (0.75 + 0.25 * Math.sin(frame / 23 + i * 1.3)) * stretch;
        return (
          <div key={i} style={{position: 'absolute', left: d.x - d.w / 2, top: edge - 10, width: d.w, height: l + d.w / 2,
            borderRadius: `0 0 ${d.w / 2}px ${d.w / 2}px`, background: fill}} />
        );
      })}
      <div style={{position: 'absolute', left: 60, right: 60, top: Math.max(10, edge - 46), height: 14, borderRadius: 7,
        background: 'rgba(255,255,255,.32)'}} />
    </AbsoluteFill>
  );
};

/** Syrup body edge over time: rests in the top band, pours down to cover each line, pulls back up. */
const syrupEdge = (frame: number) => {
  const rest = 40;
  let edge = rest;
  let stretch = 0.55;
  for (const s of [S1, S2, S3]) {
    if (frame >= s - 9 && frame < s + IN) {
      const down = interpolate(frame, [s - 9, s], [rest, 1010], {...clamp, easing: Easing.in(Easing.quad)});
      const up = interpolate(frame, [s + 3, s + IN - 1], [1010, rest], {...clamp, easing: Easing.inOut(Easing.cubic)});
      edge = frame < s + 3 ? down : up;
      stretch = interpolate(frame, [s - 9, s, s + IN], [0.55, 2.2, 0.55], clamp);
    }
  }
  return {edge, stretch};
};

const Pill: React.FC<{text: string; y: number; o: number}> = ({text, y, o}) => (
  <div style={{position: 'absolute', left: 70, top: y, padding: '12px 26px', borderRadius: 999, background: AQUA,
    fontFamily: SANS, fontWeight: 800, fontSize: 34, letterSpacing: 2, color: INK, opacity: o,
    boxShadow: `0 10px 0 ${INK}`}}>{text}</div>
);

const shadow = `0 8px 0 ${INK}, 0 20px 40px rgba(10,0,25,.55)`;

/** "Kuniga / 750 so‘m" — the offer, used on frame one and at the end. */
const Price: React.FC<{y: number; s: number}> = ({y, s}) => (
  <div style={{position: 'absolute', left: 70, top: y, opacity: Math.min(1, s * 1.5),
    transform: `translateY(${(1 - s) * 50}px)`, transformOrigin: 'left center'}}>
    <div style={{fontFamily: HEAD, fontSize: 84, lineHeight: 1, color: CREAM, textShadow: shadow}}>Kuniga</div>
    <div style={{fontFamily: HEAD, fontSize: 176, lineHeight: 1.08, color: PINK, textShadow: shadow, whiteSpace: 'nowrap'}}>
      750 so‘m
    </div>
  </div>
);

const Line: React.FC<{big: string[]; small: string; y: number; s: number; s2: number; bigSize?: number; bigColor?: string}> =
  ({big, small, y, s, s2, bigSize = 116, bigColor = CREAM}) => (
    <div style={{position: 'absolute', left: 70, right: 70, top: y}}>
      <div style={{opacity: Math.min(1, s * 1.5), transform: `translateY(${(1 - s) * 50}px)`}}>
        {big.map((b) => <div key={b} style={{fontFamily: HEAD, fontSize: bigSize, lineHeight: 1.06, color: bigColor,
          textShadow: shadow, whiteSpace: 'nowrap'}}>{b}</div>)}
      </div>
      <div style={{marginTop: 26, display: 'inline-block', padding: '14px 28px', borderRadius: 24, background: 'rgba(23,7,34,.62)',
        border: `3px solid ${AQUA}`, fontFamily: SANS, fontWeight: 800, fontSize: 52, color: CREAM, whiteSpace: 'nowrap',
        opacity: Math.min(1, s2 * 1.5), transform: `translateY(${(1 - s2) * 30}px)`}}>{small}</div>
    </div>
  );

const Scene: React.FC<{data: GiftData; frame: number}> = ({data, frame}) => {
  const {fps} = useVideoConfig();
  const {edge, stretch} = syrupEdge(frame);
  const end = frame >= S3;
  const potSize = end ? GS_END : GS;
  const potY = end ? GY_END : GY;
  const b = popIn(frame, fps, S1 + IN);
  const b2 = popIn(frame, fps, S1 + IN + SUB);
  const c = popIn(frame, fps, S2 + IN);
  const c2 = popIn(frame, fps, S2 + IN + SUB);
  const d = popIn(frame, fps, S3 + IN);
  const d2 = popIn(frame, fps, S3 + IN + SUB);
  // The old line fades out just before the syrup reaches it, so no word is left half-covered.
  const leave = Math.min(...[S1, S2, S3].map((s) => (frame >= s - 8 && frame < s ? interpolate(frame, [s - 8, s - 5], [1, 0], clamp) : 1)));
  return (
    <AbsoluteFill>
      <Stage frame={frame} glow={fire(frame)} />
      <AbsoluteFill style={{opacity: leave}}>
      {frame < S1 && (
        <>
          <Pill text="TELEGRAM NFT SOVG‘A IJARASI" y={250} o={1} />
          <Price y={360} s={1} />
        </>
      )}
      {frame >= S1 && frame < S2 && (
        <Line big={['Profilingizda', 'turadi']} small="3 kundan 30 kungacha" y={270} s={b} s2={b2} />
      )}
      {frame >= S2 && frame < S3 && (
        <Line big={['Hex Pot']} small="Silver Blue fon — atigi 1%" y={290} s={c} s2={c2} bigSize={170} bigColor={PINK} />
      )}
      {end && (
        <>
          <Price y={236} s={d} />
          <div style={{position: 'absolute', left: 70, top: 560, display: 'flex', flexDirection: 'column', gap: 22,
            alignItems: 'flex-start', opacity: Math.min(1, d2 * 1.5), transform: `translateY(${(1 - d2) * 30}px)`}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 18, padding: '12px 34px 12px 12px', borderRadius: 999,
              background: AQUA, boxShadow: `0 10px 0 ${INK}`}}>
              <Img src={staticFile('logo.png')} style={{width: 88, height: 88, borderRadius: '50%', background: BRAND.ink}} />
              <div style={{fontFamily: HEAD, fontSize: 60, color: INK}}>{BRAND.bot}</div>
            </div>
            <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 58, color: CREAM, textShadow: shadow,
              transform: `translateY(${-Math.abs(Math.sin((frame - S3) / 7)) * 8}px)`}}>↑ Havola profilda</div>
          </div>
        </>
      )}
      </AbsoluteFill>
      <Syrup edge={edge} stretch={stretch} frame={frame} />
      <Pot data={data} frame={frame} at={(frame + LEAD) % CYCLE} size={potSize} y={potY} />
    </AbsoluteFill>
  );
};

const Video: React.FC = () => {
  useFonts();
  const gifts = useGifts([GIFT]);
  const frame = useCurrentFrame();
  if (!gifts) return null;
  return (
    <AbsoluteFill style={{background: BG_3}}>
      <Scene data={gifts[0]} frame={frame} />
      <Audio src={staticFile(`audio/bed_${ID}.wav`)}
        volume={(f) => interpolate(f, [0, 6, FRAMES - 30, FRAMES - 1], [0, 0.26, 0.26, 0], clamp)} />
      <Sequence from={FLARES[0]}><Audio src={staticFile('audio/ignite.wav')} volume={0.32} /></Sequence>
      {[S1, S2, S3].map((s) => (
        <Sequence key={s} from={s - 9}><Audio src={staticFile('audio/syrup.wav')} volume={0.45} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};

/** Cover: what it is and what it costs, the pot huge and upright, the syrup band dripping from the top. */
const Cover: React.FC = () => {
  useFonts();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  return (
    <AbsoluteFill style={{background: BG_3}}>
      <Freeze frame={0}>
        <Stage frame={0} glow={0.5} />
        <Pill text="TELEGRAM NFT SOVG‘A IJARASI" y={250} o={1} />
        <Price y={360} s={1} />
        <Syrup edge={40} stretch={0.55} frame={20} />
        <Pot data={gifts[0]} frame={0} at={4} size={GS} y={GY} />
      </Freeze>
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
