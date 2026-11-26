import '@fontsource/fredoka/700.css';
import {Lottie} from '@remotion/lottie';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Freeze, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random,
  staticFile, useCurrentFrame,
} from 'remotion';
import {BODY, GiftData, W, clamp, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "FOKUS" — the Vice Cream #405489 (Circus model) on a circus drum under a spotlight, inside a marine-blue big top.
// Frame one already reads "Telegram NFT sovg‘a ijarasi / Kuniga 750 so‘m" with the cup huge and lit.
// The gift's own animation is the trick: at 1.2 s the ice cream vanishes in a puff, the cup stands empty, and
// the swirl grows back. The trick repeats on each change of text: "Vice Cream / Police Hat belgisi — atigi 0,4%",
// "Profilingizda turadi / 3 kundan 30 kungacha", then the price, the bot and the link.
const ID = 'V20261126c';
const GIFT = 'vicecream-405489'; // Circus model 3%, Marine Blue backdrop 1.5%, Police Hat symbol 0.4%; 750 so‘m a day
const HEAD = "'Fredoka', sans-serif";

// Palette. Gift: red-and-white striped cup, strawberry-pink swirl, chocolate, on a Marine Blue backdrop.
// Background family: marine blue (the backdrop, deepened). Accent: the swirl's strawberry pink (warm against
// the blue). Neutral: cream and deep navy ink. Extra hue: the cup's red, only on the drum, the pill and flags.
const NAVY_1 = '#3a5592';
const NAVY_2 = '#2a3f73';
const NAVY_3 = '#18264c';
const INK = '#0f1a38';
const PINK = '#ff9cc4';
const CREAM = '#fff3e3';
const RED = '#e5452f';
const CHOC = '#7a3b22';

// Timeline (30 fps).
const A_IN = 134;
const A_OUT = 262;
const B_IN = 272;
const B_OUT = 388;
const P_IN = 398;
const C_IN = 434;
const FRAMES = 560; // 18.7 s
// Each trick plays the gift's own frames 0–119: the swirl vanishes around 35–60 and is back by ~115.
const TRICKS = [0, 224, 350];
const VANISH = 38;

// Gift geometry. The cup fills ~30–75% of its box across and ~22–80% down; the drum top sits at DRUM_Y.
const GS = 1200;
const GX = 470;
const DRUM_Y = 1500;
const GY = DRUM_Y - GS * 0.795 + GS / 2;

const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([`700 10px "Fredoka"`, `800 10px Manrope`]
      .map((font) => document.fonts.load(font, 'KUNIGA 750 so‘m o‘g‘ — ↑ 0,4% Vice Cream Profilingizda @ArendagaGiftBot')))
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

const ease = Easing.out(Easing.cubic);
const block = (f: number, from: number, to?: number) => {
  const t = interpolate(f, [from, from + 8], [0, 1], {...clamp, easing: ease});
  const o = to === undefined ? 1 : interpolate(f, [to, to + 6], [1, 0], clamp);
  return {opacity: t * o, transform: `scale(${0.94 + 0.06 * t})`, transformOrigin: 'left center'};
};
const shown = (f: number, from: number, to?: number) => f >= from && (to === undefined || f < to + 6);

/** Which frame of the gift's own animation to show: a trick, or an idle sway between full poses 120 and 179. */
const giftFrame = (f: number) => {
  for (const s of [...TRICKS].reverse()) {
    if (f >= s && f < s + 120) return f - s;
    if (f >= s + 120) {
      const k = (f - s - 120) % 118;
      return 120 + (k < 59 ? k : 118 - k);
    }
  }
  return 0;
};

/** The big top: marine stripes fanning out from above, a slow sway, a dark rim and a row of pennants. */
const Tent: React.FC<{f: number}> = ({f}) => {
  const sway = Math.sin(f / 45) * 1.6;
  const n = 18;
  return (
    <AbsoluteFill style={{background: NAVY_2, overflow: 'hidden'}}>
      <svg width={W} height={1920} style={{position: 'absolute', inset: 0}}>
        <g transform={`rotate(${sway} 540 -260)`}>
          {Array.from({length: n}, (_, i) => {
            const a0 = (-80 + (160 / n) * i) * Math.PI / 180;
            const a1 = (-80 + (160 / n) * (i + 1)) * Math.PI / 180;
            const R = 2600;
            return <path key={i} d={`M540 -260 L${540 + R * Math.sin(a0)} ${-260 + R * Math.cos(a0)} L${540 + R * Math.sin(a1)} ${-260 + R * Math.cos(a1)} Z`}
              fill={i % 2 ? NAVY_1 : NAVY_2} />;
          })}
        </g>
      </svg>
      {/* spotlight cone from above onto the drum */}
      <svg width={W} height={1920} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}}>
        <defs>
          <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CREAM} stopOpacity={0.04} />
            <stop offset="75%" stopColor={CREAM} stopOpacity={0.26} />
            <stop offset="100%" stopColor={CREAM} stopOpacity={0} />
          </linearGradient>
          <radialGradient id="pool">
            <stop offset="0%" stopColor={CREAM} stopOpacity={0.55} />
            <stop offset="100%" stopColor={CREAM} stopOpacity={0} />
          </radialGradient>
        </defs>
        <path d={`M${GX - 70} 0 L${GX + 70} 0 L${GX + 330} ${DRUM_Y + 40} L${GX - 330} ${DRUM_Y + 40} Z`} fill="url(#cone)"
          opacity={0.75 + 0.08 * Math.sin(f / 11)} />
        <ellipse cx={GX} cy={DRUM_Y - 300} rx={460} ry={520} fill="url(#pool)" opacity={0.5} />
      </svg>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 85% 70% at ${GX / W * 100}% 62%, rgba(24,38,76,0) 45%, ${NAVY_3} 100%)`}} />
      {/* pennant string across the top */}
      <svg width={W} height={220} style={{position: 'absolute', left: 0, top: 0}}>
        <path d={`M-20 40 Q540 ${150 + Math.sin(f / 30) * 6} 1100 40`} stroke={CREAM} strokeWidth={4} fill="none" opacity={0.8} />
        {Array.from({length: 13}, (_, i) => {
          const x = -10 + i * 90;
          const u = (x + 20) / 1120;
          const y = 40 + (1 - (2 * u - 1) ** 2) * (55 + Math.sin(f / 30) * 3) - 4;
          const swing = Math.sin(f / 18 + i) * 5;
          return <path key={i} transform={`rotate(${swing} ${x + 35} ${y})`}
            d={`M${x} ${y} L${x + 70} ${y} L${x + 35} ${y + 70} Z`} fill={[RED, CREAM, PINK][i % 3]} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** The circus drum the cup stands on: cream-and-red striped side, navy top with a cream rim. */
const Drum: React.FC = () => {
  const rx = 330;
  const ry = 62;
  const side = 300;
  const stripes = 12;
  return (
    <svg width={W} height={1920} style={{position: 'absolute', inset: 0}}>
      <defs>
        <clipPath id="drumside">
          <path d={`M${GX - rx} ${DRUM_Y} L${GX - rx} ${DRUM_Y + side} A${rx} ${ry} 0 0 0 ${GX + rx} ${DRUM_Y + side} L${GX + rx} ${DRUM_Y} Z`} />
        </clipPath>
        <linearGradient id="drumshade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={INK} stopOpacity={0.45} />
          <stop offset="35%" stopColor={INK} stopOpacity={0} />
          <stop offset="70%" stopColor={INK} stopOpacity={0.05} />
          <stop offset="100%" stopColor={INK} stopOpacity={0.5} />
        </linearGradient>
      </defs>
      <g clipPath="url(#drumside)">
        {Array.from({length: stripes}, (_, i) => {
          const a0 = Math.PI * i / stripes;
          const a1 = Math.PI * (i + 1) / stripes;
          const x0 = GX - rx * Math.cos(a0);
          const x1 = GX - rx * Math.cos(a1);
          return <rect key={i} x={x0} y={DRUM_Y} width={x1 - x0 + 0.5} height={side + ry} fill={i % 2 ? CREAM : RED} />;
        })}
        <rect x={GX - rx} y={DRUM_Y} width={rx * 2} height={side + ry} fill="url(#drumshade)" />
      </g>
      <ellipse cx={GX} cy={DRUM_Y} rx={rx} ry={ry} fill={NAVY_1} stroke={CREAM} strokeWidth={14} />
      <ellipse cx={GX} cy={DRUM_Y} rx={rx - 60} ry={ry - 14} fill={NAVY_2} opacity={0.6} />
    </svg>
  );
};

/** Sprinkles drifting down slowly through the tent (pink, cream, chocolate); they fade out above y = 960, away from the text. */
const Sprinkles: React.FC<{f: number}> = ({f}) => (
  <>
    {Array.from({length: 26}, (_, i) => {
      const r = (k: string) => random(`spr-${i}-${k}`);
      const life = 260 + r('l') * 200;
      const t = ((f + r('o') * life) % life) / life;
      const x = r('x') * W + Math.sin(f / 30 + i) * 20;
      const y = -40 + t * 2000;
      const rot = r('r') * 360 + f * (r('d') - 0.5) * 4;
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: 30, height: 10, borderRadius: 5,
        background: [PINK, CREAM, CHOC][i % 3], opacity: 0.55 * interpolate(y, [820, 960], [0, 1], clamp), transform: `rotate(${rot}deg)`}} />;
    })}
  </>
);

/** The puff of smoke when the swirl vanishes: cream clouds bloom around the cup and thin out. */
const Puff: React.FC<{f: number}> = ({f}) => (
  <>
    {TRICKS.map((s) => {
      const at = s + VANISH - 4;
      const t = interpolate(f, [at, at + 30], [0, 1], clamp);
      if (f < at || t >= 1) return null;
      return Array.from({length: 9}, (_, k) => {
        const a = (k / 9) * Math.PI * 2 + random(`puff-${s}-${k}`) * 0.6;
        const d = 60 + t * 230;
        const size = 90 + t * 120 + random(`puffs-${s}-${k}`) * 50;
        const cx = GX + Math.cos(a) * d * 1.1;
        const cy = DRUM_Y - 330 + Math.sin(a) * d * 0.75;
        return <div key={`${s}-${k}`} style={{position: 'absolute', left: cx - size / 2, top: cy - size / 2, width: size, height: size,
          borderRadius: '50%', background: `radial-gradient(circle, ${CREAM} 0%, rgba(255,243,227,0) 70%)`,
          opacity: (1 - t) * 0.85}} />;
      });
    })}
  </>
);

const Cup: React.FC<{data: GiftData; f: number; frame: number; size?: number}> = ({data, f, frame, size = GS}) => {
  // a small hop the moment the swirl is back
  const hop = TRICKS.reduce((h, s) => {
    const t = f - (s + 112);
    return t >= 0 && t < 14 ? h + Math.sin((t / 14) * Math.PI) * 16 : h;
  }, 0);
  return (
    <>
      <div style={{position: 'absolute', left: GX - 250, top: DRUM_Y - 34, width: 500, height: 68, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(15,26,56,.55) 0%, rgba(15,26,56,0) 70%)'}} />
      <div style={{position: 'absolute', left: GX - size / 2, top: GY - size / 2 - hop, width: size, height: size,
        filter: 'drop-shadow(0 0 40px rgba(255,156,196,.28)) drop-shadow(0 18px 20px rgba(15,26,56,.4))'}}>
        <Freeze frame={frame}><Lottie animationData={data.gift} style={{width: size, height: size}} /></Freeze>
      </div>
    </>
  );
};

const Pill: React.FC<{text: string}> = ({text}) => (
  <div style={{display: 'inline-block', padding: '12px 26px', borderRadius: 999, background: RED,
    fontFamily: BODY, fontWeight: 800, fontSize: 36, letterSpacing: 1.5, color: CREAM}}>{text}</div>
);

const Price: React.FC = () => (
  <>
    <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 66, color: CREAM, lineHeight: 1}}>Kuniga</div>
    <div style={{marginTop: 2, fontFamily: HEAD, fontWeight: 700, fontSize: 200, color: PINK, lineHeight: 1, whiteSpace: 'nowrap',
      textShadow: `0 8px 0 ${INK}`}}>750 so‘m</div>
  </>
);

const Video: React.FC = () => {
  useFonts();
  const gifts = useGifts([GIFT]);
  const f = useCurrentFrame();
  if (!gifts) return null;
  const [data] = gifts;

  return (
    <AbsoluteFill style={{background: NAVY_2, overflow: 'hidden'}}>
      <Tent f={f} />
      <Sprinkles f={f} />
      <Drum />
      <Cup data={data} f={f} frame={giftFrame(f)} />
      <Puff f={f} />

      {shown(f, 0, 126) && (
        <div style={{position: 'absolute', left: 70, top: 250, ...block(f, -8, 126)}}>
          <Pill text="TELEGRAM NFT SOVG‘A IJARASI" />
          <div style={{marginTop: 34}}><Price /></div>
        </div>
      )}

      {shown(f, A_IN, A_OUT) && (
        <div style={{position: 'absolute', left: 70, top: 260, ...block(f, A_IN, A_OUT)}}>
          <div style={{fontFamily: HEAD, fontWeight: 700, fontSize: 128, color: CREAM, lineHeight: 1}}>Vice Cream</div>
          <div style={{marginTop: 28, fontFamily: BODY, fontWeight: 800, fontSize: 58, color: CREAM, lineHeight: 1.1}}>Police Hat belgisi —</div>
          <div style={{marginTop: 6, fontFamily: HEAD, fontWeight: 700, fontSize: 140, color: PINK, lineHeight: 1,
            textShadow: `0 7px 0 ${INK}`}}>atigi 0,4%</div>
        </div>
      )}

      {shown(f, B_IN, B_OUT) && (
        <div style={{position: 'absolute', left: 70, top: 260, ...block(f, B_IN, B_OUT)}}>
          <div style={{fontFamily: HEAD, fontWeight: 700, fontSize: 124, color: CREAM, lineHeight: 1.02}}>Profilingizda<br />turadi</div>
          <div style={{marginTop: 30, display: 'inline-block', padding: '12px 28px', borderRadius: 999, background: PINK,
            fontFamily: BODY, fontWeight: 800, fontSize: 54, color: INK}}>3 kundan 30 kungacha</div>
        </div>
      )}

      {shown(f, P_IN) && (
        <div style={{position: 'absolute', left: 70, top: 250, ...block(f, P_IN)}}><Price /></div>
      )}
      {shown(f, C_IN) && (
        <div style={{position: 'absolute', left: 70, top: 545, ...block(f, C_IN)}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 18, padding: '14px 34px 14px 14px', borderRadius: 999,
            background: RED, boxShadow: `0 10px 0 ${INK}`}}>
            <Img src={staticFile('logo.png')} style={{width: 72, height: 72, borderRadius: '50%', background: INK}} />
            <div style={{fontFamily: HEAD, fontWeight: 700, fontSize: 62, color: CREAM, lineHeight: 1}}>@ArendagaGiftBot</div>
          </div>
          <div style={{marginTop: 26, fontFamily: BODY, fontWeight: 800, fontSize: 48, color: CREAM}}>↑ Havola profilda</div>
        </div>
      )}

      <Audio src={staticFile(`audio/bed_${ID}.wav`)}
        volume={(fr) => interpolate(fr, [0, 12, FRAMES - 30, FRAMES], [0, 0.3, 0.3, 0], clamp)} />
      {TRICKS.map((s, i) => (
        <Sequence key={s} from={s + VANISH - 6}>
          <Audio src={staticFile('audio/poof.wav')} volume={i === 0 ? 0.4 : 0.28} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const Cover: React.FC = () => {
  useFonts();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  const [data] = gifts;
  return (
    <AbsoluteFill style={{background: NAVY_2, overflow: 'hidden'}}>
      <Tent f={0} />
      <Drum />
      <Cup data={data} f={-100} frame={170} />
      <div style={{position: 'absolute', left: 70, top: 280}}>
        <Pill text="TELEGRAM NFT SOVG‘A IJARASI" />
        <div style={{marginTop: 34}}><Price /></div>
      </div>
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
