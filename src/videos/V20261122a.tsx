// This package's exports map adds `.css` itself and ships no type declarations.
// @ts-ignore
import '@fontsource/rubik/800';
import {Lottie} from '@remotion/lottie';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Freeze, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random,
  spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {BRAND, GiftData, H, W, clamp, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "GRAFFITI" — one plain poster, designed from a side-by-side look at the first second of the best and worst posts.
// Frame one: a flat electric-violet field, the offer in three short lines ("Telegram NFT sovg‘a ijarasi / Kuniga /
// 850 so‘m") and the Surge Board (model Graffiti) as big as the frame allows, its own animation already moving.
// Within half a second a large white paint splat blooms behind the board and the board's own paint splashes burst,
// so the frame visibly changes before the first second ends. Then, each with a new splat: the gift's name and the
// model's rarity, "3–30 kun profilingizda", and the price with the bot and the link. No kicker pill, no price
// sticker: none of the layout furniture the last six posts shared. Silent, calm pad in D major.
const ID = 'V20261122a';
const GIFT = 'surgeboard-25384'; // Graffiti model 4%, Sapphire backdrop 1.2%, Tulip symbol 0.4%; 850 so‘m a day
const DISPLAY = "'Rubik', sans-serif";
const SANS = "'Manrope', sans-serif";

// Palette. The board itself carries every hue (cyan, pink, orange, lime, purple outline), so the frame around it is
// held to one family: electric violet (analogous to the board's purple outline and Sapphire backdrop). Accent: acid
// lime, taken from the board's lime splash and near-complementary to violet. Neutrals: paper white and violet ink.
const VIOLET_LIGHT = '#8b4dff';
const VIOLET = '#6a2cf0';
const VIOLET_DEEP = '#3f12b0';
const LIME = '#d6ff3f';
const WHITE = '#fbf8ff';
const INK = '#1b0750';

// Timeline (30 fps).
const B_IN = 150; // 5.0 s: name and rarity
const C_IN = 290; // 9.67 s: 3–30 kun profilingizda
const D_IN = 408; // 13.6 s: price
const D_CTA = 438; // 14.6 s: bot and link
const FRAMES = 555; // 18.5 s

// Gift geometry. The board fills ~36-51% of its 512 box across and ~50% down, centred a little left of the box.
const GX = 440;
const GY = 1085;
const GSIZE = 1480;

const useFonts = () => {
  const [handle] = useState(() => delayRender('rubik'));
  useEffect(() => {
    Promise.all([`800 10px "Rubik"`, `800 10px "Manrope"`].map((f) => document.fonts.load(f, 'KUNIGA 850 so‘m o‘g‘ – ↑')))
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

const out3 = Easing.out(Easing.cubic);
const popIn = (frame: number, fps: number, at: number) =>
  spring({frame: frame - at, fps, config: {damping: 14, stiffness: 170, mass: 0.7}});

// Calm, upright frames after the splash, played back and forth so the board keeps breathing without its flip.
const CALM_FROM = 140;
const CALM_TO = 179;
const calm = (n: number) => {
  const len = CALM_TO - CALM_FROM;
  const k = ((n % (2 * len)) + 2 * len) % (2 * len);
  return CALM_FROM + (k <= len ? len - k : k - len);
};
const SPLASH_FROM = 84; // replays of the splash start upright, close to the calm pose
const SPLASH_LEN = CALM_FROM - SPLASH_FROM;

/** Which frame of the gift's own animation to show. */
const giftFrame = (frame: number) => {
  if (frame < 179 - 60) return 60 + frame; // opening: the board lands and its paint bursts out
  for (const at of [C_IN, B_IN]) {
    if (frame >= at && frame < at + SPLASH_LEN) return SPLASH_FROM + (frame - at);
  }
  return calm(frame - 119);
};

/** A paint splat: a lumpy blob with spikes and a ring of droplets, deterministic per seed. */
const splatPath = (seed: string, r: number) => {
  const n = 26;
  const pts = Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const spike = random(`${seed}-s${i}`) > 0.72 ? 0.28 + random(`${seed}-k${i}`) * 0.3 : 0;
    const rr = r * (0.86 + random(`${seed}-r${i}`) * 0.16 + spike);
    return [Math.cos(a) * rr, Math.sin(a) * rr];
  });
  let d = '';
  for (let i = 0; i < n; i++) {
    const [x, y] = pts[i];
    const [nx, ny] = pts[(i + 1) % n];
    const mx = (x + nx) / 2;
    const my = (y + ny) / 2;
    if (i === 0) d += `M ${(pts[n - 1][0] + x) / 2} ${(pts[n - 1][1] + y) / 2} `;
    d += `Q ${x} ${y} ${mx} ${my} `;
  }
  return d + 'Z';
};

const Splat: React.FC<{seed: string; bloom: number; frame: number; color: string; r?: number}> =
  ({seed, bloom, frame, color, r = 370}) => {
    const drops = Array.from({length: 11}, (_, i) => {
      const a = (0.05 + random(`${seed}-da${i}`) * 0.95) * Math.PI; // below and beside the board, never up into the text
      const dist = r * (1.25 + random(`${seed}-dd${i}`) * 0.55);
      return {x: Math.cos(a) * dist, y: Math.sin(a) * dist * 1.1, s: 14 + random(`${seed}-ds${i}`) * 34};
    });
    const wobble = 1 + Math.sin(frame / 23) * 0.012;
    return (
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <g transform={`translate(${GX} ${GY - 10}) scale(${bloom * wobble} ${bloom * 1.12 * wobble}) rotate(${-18 + frame * 0.02})`}>
          <path d={splatPath(seed, r)} fill={INK} opacity={0.35} transform="translate(18 24)" />
          <path d={splatPath(seed, r)} fill={color} />
          {drops.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={p.s * Math.min(1, Math.max(0, bloom * 1.6 - 0.6))} fill={color} />
          ))}
        </g>
      </svg>
    );
  };

/** Flat violet field with two slow colour clouds and a faint dot screen. */
const Field: React.FC<{frame: number}> = ({frame}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 70% at 46% 52%, ${VIOLET_LIGHT} 0%, ${VIOLET} 48%, ${VIOLET_DEEP} 100%)`}}>
    <div style={{position: 'absolute', left: -300 + Math.sin(frame / 70) * 80, top: 1180 + Math.cos(frame / 60) * 60, width: 900, height: 900,
      borderRadius: '50%', background: 'radial-gradient(circle, rgba(214,80,255,.35) 0%, rgba(214,80,255,0) 70%)'}} />
    <div style={{position: 'absolute', left: 520 + Math.cos(frame / 80) * 70, top: -160 + Math.sin(frame / 66) * 60, width: 900, height: 900,
      borderRadius: '50%', background: 'radial-gradient(circle, rgba(120,170,255,.28) 0%, rgba(120,170,255,0) 70%)'}} />
    <AbsoluteFill style={{opacity: 0.12, backgroundImage: `radial-gradient(${INK} 3px, transparent 3.5px)`, backgroundSize: '30px 30px',
      WebkitMaskImage: 'linear-gradient(180deg, #000 0%, transparent 30%, transparent 70%, #000 100%)'}} />
  </AbsoluteFill>
);

/** The board with its own animation driven to a chosen frame. */
const Board: React.FC<{data: GiftData; at: number; scale: number; dy: number; rotate: number}> = ({data, at, scale, dy, rotate}) => (
  <div style={{position: 'absolute', left: GX - GSIZE / 2, top: GY - GSIZE / 2 + dy, width: GSIZE, height: GSIZE,
    transform: `scale(${scale}) rotate(${rotate}deg)`, transformOrigin: `${GSIZE * 0.48}px ${GSIZE * 0.51}px`,
    filter: 'drop-shadow(0 34px 30px rgba(27,7,80,.42))'}}>
    <Freeze frame={at}>
      <Lottie animationData={data.gift} style={{width: GSIZE, height: GSIZE}} />
    </Freeze>
  </div>
);

/** Three-line text block in the top band: small line, middle line, big accent line. */
const Block: React.FC<{small: string; mid?: string; big: string; enter: number; leave: number; bigSize?: number}> =
  ({small, mid, big, enter, leave, bigSize = 184}) => (
    <div style={{position: 'absolute', left: 66, top: 238, opacity: Math.min(1, enter * 2) * (1 - leave),
      transform: `translateY(${(1 - enter) * 46 - leave * 50}px)`}}>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 48, letterSpacing: 1, color: WHITE, lineHeight: 1.1,
        textShadow: `0 4px 0 ${INK}`}}>{small}</div>
      {mid && <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 84, color: WHITE, lineHeight: 1.05, marginTop: 10,
        textShadow: `5px 6px 0 ${INK}`}}>{mid}</div>}
      <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: bigSize, color: LIME, lineHeight: 0.98, whiteSpace: 'nowrap',
        letterSpacing: -4, WebkitTextStroke: `8px ${INK}`, paintOrder: 'stroke fill', textShadow: `9px 10px 0 ${INK}`}}>{big}</div>
    </div>
  );

const Scene: React.FC<{data: GiftData; frame: number; still?: boolean}> = ({data, frame, still}) => {
  const {fps} = useVideoConfig();
  const f = frame;
  const s = (a: number, b: number) => interpolate(f, [a, b], [0, 1], {...clamp, easing: out3});
  // Splat blooms: the first one within half a second, then one per section, each a new shape.
  const sections = [0, B_IN, C_IN, D_IN];
  const current = still ? 0 : sections.filter((at) => f >= at).length - 1;
  const at = sections[current];
  const bloom = still ? 1 : current === 0
    ? spring({frame: f - 4, fps, config: {damping: 11, stiffness: 120, mass: 0.8}})
    : 0.8 + 0.2 * spring({frame: f - at, fps, config: {damping: 10, stiffness: 140, mass: 0.7}});
  // The board: a small kick on every new section, a gentle sway, and a step up and back for the call to action.
  const kick = still || current === 0 ? 0 : Math.sin(Math.min(1, (f - at) / 14) * Math.PI) * 0.06;
  const settle = s(D_CTA - 6, D_CTA + 12);
  const scale = (1 + kick) * (1 - 0.2 * settle);
  const dy = -100 * settle + Math.sin(f / 19) * 8;
  const rotate = Math.sin(f / 31) * 1.5;
  const leave = (end: number) => s(end, end + 8);
  const bIn = popIn(f, fps, B_IN + 4);
  const cIn = popIn(f, fps, C_IN + 4);
  const dIn = popIn(f, fps, D_IN + 4);
  const cta = popIn(f, fps, D_CTA);
  const nudge = Math.abs(Math.sin(f / 7)) * 8;
  return (
    <AbsoluteFill>
      <Field frame={f} />
      <Splat seed={`splat-${current}`} bloom={bloom} frame={f} color={WHITE} />
      <Board data={data} at={still ? 0 : giftFrame(f)} scale={scale} dy={dy} rotate={rotate} />

      {f < B_IN + 8 && <Block small="Telegram NFT sovg‘a ijarasi" mid="Kuniga" big="850 so‘m" enter={1} leave={leave(B_IN - 4)} />}
      {!still && f >= B_IN && f < C_IN + 8 &&
        <Block small="Bu — Surge Board" big="Graffiti" mid={undefined} enter={bIn} leave={leave(C_IN - 4)} />}
      {!still && f >= B_IN && f < C_IN + 8 && (
        <div style={{position: 'absolute', left: 70, top: 500, opacity: Math.min(1, bIn * 2) * (1 - leave(C_IN - 4))}}>
          <div style={{display: 'inline-block', fontFamily: SANS, fontWeight: 800, fontSize: 52, color: INK, background: LIME,
            border: `5px solid ${INK}`, borderRadius: 18, padding: '4px 24px 8px', boxShadow: `7px 8px 0 ${INK}`}}>modeli · atigi 4%</div>
        </div>
      )}
      {!still && f >= C_IN && f < D_IN + 8 &&
        <Block small="Ijaraga oling —" mid="profilingizda" big="3–30 kun" enter={cIn} leave={leave(D_IN - 4)} />}
      {!still && f >= D_IN &&
        <Block small="Surge Board · ijara" mid="Kuniga" big="850 so‘m" enter={dIn} leave={0} />}

      {!still && f >= D_CTA && (
        <div style={{position: 'absolute', left: 70, top: 1330, opacity: Math.min(1, cta * 2), transform: `translateY(${(1 - cta) * 40}px)`}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 18, padding: '12px 36px 12px 12px', borderRadius: 999,
            background: INK, border: `5px solid ${WHITE}`}}>
            <Img src={staticFile('logo.png')} style={{width: 80, height: 80, borderRadius: '50%', background: BRAND.ink}} />
            <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 48, color: WHITE}}>{BRAND.bot}</span>
          </div>
          <div style={{marginTop: 16, display: 'flex'}}>
            <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 50, color: INK, background: LIME, border: `5px solid ${INK}`,
              borderRadius: 999, padding: '6px 30px 10px', transform: `translateY(${-nudge}px)`, boxShadow: `6px 7px 0 ${INK}`}}>
              ↑ Havola profilda</div>
          </div>
        </div>
      )}
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
        volume={(f) => interpolate(f, [0, 8, FRAMES - 30, FRAMES - 1], [0, 0.3, 0.3, 0], clamp)} />
      <Sequence from={4}><Audio src={staticFile('audio/splat.wav')} volume={0.32} /></Sequence>
      <Sequence from={B_IN}><Audio src={staticFile('audio/splat.wav')} volume={0.2} /></Sequence>
      <Sequence from={C_IN}><Audio src={staticFile('audio/splat.wav')} volume={0.2} /></Sequence>
      <Sequence from={D_IN - 2}><Audio src={staticFile('audio/whoosh.wav')} volume={0.07} /></Sequence>
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
