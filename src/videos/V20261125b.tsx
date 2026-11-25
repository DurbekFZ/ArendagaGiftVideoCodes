import '@fontsource/bodoni-moda/900.css';
import '@fontsource/bodoni-moda/900-italic.css';
import '@fontsource/manrope/800.css';
import {Lottie} from '@remotion/lottie';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Freeze, Img, Sequence, cancelRender, continueRender, delayRender, interpolate,
  staticFile, useCurrentFrame,
} from 'remotion';
import {GiftData, H, W, clamp, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "SUZANI" — the Chill Flame #55224 (a golden Bowl of Hygeia with a red flame) set on deep teal embroidered cloth.
// Behind it a suzani medallion of petals stitched in gold blooms open at every step; embroidered bands run along the
// top and bottom edges. Frame one already reads "Telegram NFT sovg‘a ijarasi / Kuniga 750 so‘m"; at 0.3 s the flame
// flares, the medallion blooms and the bowl hops. Every line of text is underlined by a gold running stitch that sews
// itself in. Then "Chill Flame / Flashlight belgisi — atigi 0,4%", "Profilingizda turadi / 3 kundan 30 kungacha",
// the price, the bot and the link.
const ID = 'V20261125b';
const GIFT = 'chillflame-55224'; // Bowl of Hygeia model 3%, Pacific Green backdrop 1.2%, Flashlight symbol 0.4%; 750 so‘m a day
const SERIF = "'Bodoni Moda', serif";
const SANS = "'Manrope', sans-serif";

// Palette. Gift: a gold bowl and cobra with a red-orange flame on a Pacific Green backdrop. Background family: deep
// teal (the backdrop's own green-teal, much darker). Accent: the bowl's gold (warm, opposite the teal). Neutral: ivory
// and teal ink. Extra hue: the flame's vermilion, only for embers and small dots.
const BG_1 = '#13695d';
const BG_2 = '#0b463e';
const BG_3 = '#052520';
const PETAL = '#126052';
const PETAL_DEEP = '#0a3f37';
const GOLD = '#f4c24e';
const GOLD_SOFT = 'rgba(244,194,78,';
const IVORY = '#fff4de';
const INK = '#06281f';
const FLAME = '#ff5a35';

// Timeline (30 fps).
const HOP = 9; // flame flare, bloom and first hop, 0.3 s
const A_IN = 138; // rare symbol
const A_OUT = 258;
const B_IN = 268; // what renting means
const B_OUT = 388;
const P_IN = 398; // price
const C_IN = 434; // bot and link, 1.2 s later
const FRAMES = 555; // 18.5 s
const HOPS = [HOP, A_IN + 2, B_IN + 2, P_IN + 2];

// Gift geometry. The bowl fills ~33–74% of its box across and ~18–81% down; the flame sits at about (0.52, 0.25).
const GS = 1060;
const GX = 470;
const GY = 1190;

// The bowl turns in its animation between cycle frames ~15 and ~115 (narrow there). Ping-pong only through the
// poses that face the viewer: 120 → 179 → 0 → 10 and back.
const POSES = [...Array.from({length: 60}, (_, i) => 120 + i), ...Array.from({length: 11}, (_, i) => i)];
const poseAt = (f: number) => {
  const n = POSES.length - 1;
  const p = f % (2 * n);
  return POSES[p <= n ? p : 2 * n - p];
};

const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([`900 10px "Bodoni Moda"`, `italic 900 10px "Bodoni Moda"`, `800 10px "Manrope"`]
      .map((font) => document.fonts.load(font, 'KUNIGA 750 so‘m o‘g‘ — ↑ 0,4% Chill Flame Profilingizda')))
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

const ease = Easing.out(Easing.cubic);
// A text block: rises in over 8 frames, fades out over 6. Never partly masked.
const block = (f: number, from: number, to?: number) => {
  const t = interpolate(f, [from, from + 8], [0, 1], {...clamp, easing: ease});
  const o = to === undefined ? 1 : interpolate(f, [to, to + 6], [1, 0], clamp);
  return {opacity: t * o, transform: `translateY(${(1 - t) * 26}px)`};
};
const shown = (f: number, from: number, to?: number) => f >= from && (to === undefined || f < to + 6);
const bloomAt = (f: number) => Math.max(...HOPS.map((h, i) => interpolate(f, [h, h + 5, h + 34], [0, i === 0 ? 1 : 0.7, 0], clamp)));

/** Deep teal cloth: a radial gradient with a faint woven lattice of small four-point stars. */
const Cloth: React.FC<{f: number}> = ({f}) => {
  const drift = (f * 0.25) % 96;
  return (
    <AbsoluteFill style={{background: BG_3}}>
      <AbsoluteFill style={{background:
        `radial-gradient(ellipse 90% 62% at ${GX / W * 100}% ${GY / H * 100 - 4}%, ${BG_1} 0%, ${BG_2} 50%, ${BG_3} 100%)`}} />
      <svg width={W + 192} height={H + 192} style={{position: 'absolute', left: -96, top: -96, transform: `translateY(${drift}px)`}}>
        <defs>
          <pattern id="lattice" width={96} height={96} patternUnits="userSpaceOnUse">
            <path d="M48 30 L53 43 L66 48 L53 53 L48 66 L43 53 L30 48 L43 43 Z" fill="rgba(255,244,222,.05)" />
            <circle cx={0} cy={0} r={3} fill="rgba(244,194,78,.08)" />
            <circle cx={96} cy={0} r={3} fill="rgba(244,194,78,.08)" />
            <circle cx={0} cy={96} r={3} fill="rgba(244,194,78,.08)" />
            <circle cx={96} cy={96} r={3} fill="rgba(244,194,78,.08)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lattice)" />
      </svg>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 65% at 45% 60%, rgba(2,18,15,0) 55%, rgba(2,18,15,.55) 100%)'}} />
    </AbsoluteFill>
  );
};

/** An embroidered band along an edge: a row of small medallions and vine scrolls, moving slowly sideways. */
const Band: React.FC<{f: number; y: number; dir: number}> = ({f, y, dir}) => {
  const step = 120;
  const shift = ((f * 0.6 * dir) % step + step) % step;
  return (
    <svg width={W} height={110} style={{position: 'absolute', left: 0, top: y}}>
      <rect width={W} height={110} fill={BG_3} opacity={0.65} />
      <line x1={0} y1={8} x2={W} y2={8} stroke={GOLD} strokeWidth={2} strokeDasharray="10 8" opacity={0.6} />
      <line x1={0} y1={102} x2={W} y2={102} stroke={GOLD} strokeWidth={2} strokeDasharray="10 8" opacity={0.6} />
      <g transform={`translate(${shift - step}, 55)`}>
        {Array.from({length: 12}, (_, i) => (
          <g key={i} transform={`translate(${i * step}, 0)`}>
            <path d="M 0 0 C 25 -34, 55 -34, 60 0 C 65 34, 95 34, 120 0" fill="none" stroke={PETAL} strokeWidth={5} />
            <circle r={24} fill={PETAL_DEEP} stroke={GOLD} strokeWidth={2.5} opacity={0.95} />
            {Array.from({length: 8}, (_, k) => (
              <ellipse key={k} cx={0} cy={-14} rx={5} ry={10} fill={GOLD} opacity={0.7} transform={`rotate(${k * 45})`} />
            ))}
            <circle r={6} fill={FLAME} />
            <circle cx={60} cy={0} r={5} fill={IVORY} opacity={0.55} />
          </g>
        ))}
      </g>
    </svg>
  );
};

/** The suzani medallion behind the bowl: outer rounded petals, inner pointed petals, a ring of dots. Blooms at hops. */
const Medallion: React.FC<{f: number; still?: boolean}> = ({f, still}) => {
  const bloom = still ? 0 : bloomAt(f);
  const open = still ? 1 : interpolate(f, [0, HOP, HOP + 18], [0.9, 0.9, 1], {...clamp, easing: ease});
  const outer = Array.from({length: 16}, (_, i) => i * 22.5);
  const inner = Array.from({length: 8}, (_, i) => i * 45 + 22.5);
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <radialGradient id="core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1f8a76" />
          <stop offset="100%" stopColor={PETAL_DEEP} />
        </radialGradient>
      </defs>
      <g transform={`translate(${GX} ${GY}) scale(${open * (1 + bloom * 0.05)})`}>
        <g transform={`rotate(${f * 0.08 + bloom * 6})`}>
          {outer.map((a) => (
            <g key={a} transform={`rotate(${a})`}>
              <path d="M 0 -250 C 70 -300, 80 -420, 0 -462 C -80 -420, -70 -300, 0 -250 Z" fill={PETAL}
                stroke={`${GOLD_SOFT}${0.45 + bloom * 0.4})`} strokeWidth={3} />
              <path d="M 0 -290 C 30 -320, 32 -390, 0 -418 C -32 -390, -30 -320, 0 -290 Z" fill="none"
                stroke={`${GOLD_SOFT}${0.35 + bloom * 0.3})`} strokeWidth={2} strokeDasharray="7 7" />
              <circle cx={0} cy={-478} r={7} fill={FLAME} opacity={0.75} />
            </g>
          ))}
        </g>
        <circle r={262} fill={PETAL_DEEP} stroke={`${GOLD_SOFT}.55)`} strokeWidth={3} />
        <g transform={`rotate(${-f * 0.12 - bloom * 8})`}>
          {inner.map((a) => (
            <g key={a} transform={`rotate(${a})`}>
              <path d="M 0 -120 C 46 -160, 40 -220, 0 -252 C -40 -220, -46 -160, 0 -120 Z" fill={PETAL}
                stroke={`${GOLD_SOFT}${0.5 + bloom * 0.4})`} strokeWidth={3} />
            </g>
          ))}
          {Array.from({length: 24}, (_, i) => (
            <circle key={i} cx={0} cy={-132} r={5} fill={IVORY} opacity={0.4} transform={`rotate(${i * 15})`} />
          ))}
        </g>
        <circle r={124} fill="url(#core)" stroke={`${GOLD_SOFT}.5)`} strokeWidth={2.5} strokeDasharray="9 7" />
      </g>
    </svg>
  );
};

/** Warm light of the flame: flickers, flares at the hops. */
const FlameGlow: React.FC<{f: number; x: number; y: number; still?: boolean}> = ({f, x, y, still}) => {
  const flare = still ? 0.4 : Math.max(...HOPS.map((h, i) => interpolate(f, [h, h + 3, h + 26], [0, i === 0 ? 1.2 : 0.7, 0], clamp)));
  const flicker = 0.82 + Math.sin(f / 2.9) * 0.08 + Math.sin(f / 1.6) * 0.05;
  const size = 420 + flare * 300;
  return (
    <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size,
      borderRadius: '50%', mixBlendMode: 'screen', opacity: (0.45 + flare * 0.5) * flicker,
      background: `radial-gradient(circle, ${GOLD}bb 0%, rgba(255,90,53,.35) 34%, rgba(255,90,53,0) 68%)`}} />
  );
};

/** Embers rising from the flame; they fade out before reaching the text column. */
const Embers: React.FC<{f: number; x: number; y: number}> = ({f, x, y}) => (
  <>
    {Array.from({length: 14}, (_, i) => {
      const period = 70 + (i * 37) % 40;
      const t = ((f + i * 23) % period) / period;
      const ex = x + Math.sin(i * 2.1 + t * 4) * (30 + (i % 4) * 22);
      const ey = y - t * 110;
      const size = 6 + (i % 3) * 3;
      return (
        <div key={i} style={{position: 'absolute', left: ex - size / 2, top: ey - size / 2, width: size, height: size,
          borderRadius: '50%', background: i % 3 ? GOLD : FLAME, opacity: Math.sin(Math.PI * t) * 0.85,
          boxShadow: `0 0 ${size * 2}px ${i % 3 ? GOLD : FLAME}`}} />
      );
    })}
  </>
);

/** A gold running stitch that sews itself in under a line of text. */
const Stitch: React.FC<{f: number; from: number; width: number; top?: number}> = ({f, from, width, top = 10}) => {
  const t = interpolate(f, [from + 6, from + 22], [0, 1], {...clamp, easing: ease});
  return (
    <svg width={width + 10} height={14} style={{display: 'block', marginTop: top}}>
      <line x1={4} y1={7} x2={4 + width * t} y2={7} stroke={GOLD} strokeWidth={6} strokeLinecap="round" strokeDasharray="22 12" />
    </svg>
  );
};

const Pill: React.FC<{text: string}> = ({text}) => (
  <div style={{display: 'inline-block', padding: '12px 26px', borderRadius: 999, background: IVORY,
    fontFamily: SANS, fontWeight: 800, fontSize: 36, letterSpacing: 1.5, color: INK}}>{text}</div>
);

const Price: React.FC<{f: number; from: number}> = ({f, from}) => (
  <>
    <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 62, color: IVORY, lineHeight: 1}}>Kuniga</div>
    <div style={{marginTop: 4, fontFamily: SERIF, fontWeight: 900, fontSize: 188, color: GOLD, lineHeight: 1.02,
      textShadow: `0 8px 0 ${INK}`}}>750 so‘m</div>
    <Stitch f={f} from={from} width={700} top={8} />
  </>
);

const Bowl: React.FC<{data: GiftData; f: number; pose: number; size: number; y: number; lift: number}> =
  ({data, f, pose, size, y, lift}) => (
    <>
      <div style={{position: 'absolute', left: GX - 200, top: y + 0.29 * size, width: 420, height: 64, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(2,18,15,.75) 0%, rgba(2,18,15,0) 70%)', transform: `scale(${1 + lift / 160})`}} />
      <div style={{position: 'absolute', left: GX - size / 2, top: y - size / 2 - lift + Math.sin(f / 19) * 7, width: size, height: size,
        filter: 'drop-shadow(0 0 40px rgba(244,194,78,.3)) drop-shadow(0 26px 28px rgba(2,18,15,.6))'}}>
        <Freeze frame={pose}><Lottie animationData={data.gift} style={{width: size, height: size}} /></Freeze>
      </div>
    </>
  );

const Video: React.FC = () => {
  useFonts();
  const gifts = useGifts([GIFT]);
  const f = useCurrentFrame();
  if (!gifts) return null;
  const [data] = gifts;
  const lift = Math.max(...HOPS.map((h, i) => {
    const t = f - h;
    if (t < 0 || t > 24) return 0;
    return Math.sin((t / 24) * Math.PI) * (i === 0 ? 56 : 36);
  }));
  const flameX = GX + (0.52 - 0.5) * GS;
  const flameY = GY + (0.25 - 0.5) * GS - lift;

  return (
    <AbsoluteFill style={{background: BG_3, overflow: 'hidden'}}>
      <Cloth f={f} />
      <Medallion f={f} />
      <Band f={f} y={0} dir={1} />
      <Band f={f} y={H - 110} dir={-1} />
      <FlameGlow f={f} x={flameX} y={flameY} />
      <Bowl data={data} f={f} pose={poseAt(f)} size={GS} y={GY} lift={lift} />
      <Embers f={f} x={flameX} y={flameY - 20} />

      {/* Opening: product and price, readable from frame one. */}
      {shown(f, 0, 126) && (
        <div style={{position: 'absolute', left: 70, top: 250, ...block(f, -8, 126)}}>
          <Pill text="TELEGRAM NFT SOVG‘A IJARASI" />
          <div style={{height: 34}} />
          <Price f={f} from={-20} />
        </div>
      )}

      {/* The rare symbol. */}
      {shown(f, A_IN, A_OUT) && (
        <div style={{position: 'absolute', left: 70, top: 250, ...block(f, A_IN, A_OUT)}}>
          <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 900, fontSize: 104, color: IVORY, lineHeight: 1.05}}>Chill Flame</div>
          <Stitch f={f} from={A_IN} width={560} top={6} />
          <div style={{marginTop: 26, fontFamily: SANS, fontWeight: 800, fontSize: 54, color: IVORY, lineHeight: 1.1}}>Flashlight belgisi —</div>
          <div style={{marginTop: 4, fontFamily: SERIF, fontWeight: 900, fontSize: 132, color: GOLD, lineHeight: 1.05,
            textShadow: `0 7px 0 ${INK}`}}>atigi 0,4%</div>
        </div>
      )}

      {/* What renting means. */}
      {shown(f, B_IN, B_OUT) && (
        <div style={{position: 'absolute', left: 70, top: 250, ...block(f, B_IN, B_OUT)}}>
          <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 112, color: IVORY, lineHeight: 1.04}}>Profilingizda<br />turadi</div>
          <Stitch f={f} from={B_IN} width={520} top={10} />
          <div style={{marginTop: 24, fontFamily: SANS, fontWeight: 800, fontSize: 56, color: GOLD, lineHeight: 1.1}}>3 kundan 30 kungacha</div>
        </div>
      )}

      {/* End: price, bot, link. */}
      {shown(f, P_IN) && (
        <div style={{position: 'absolute', left: 70, top: 250, ...block(f, P_IN)}}>
          <Price f={f} from={P_IN} />
        </div>
      )}
      {shown(f, C_IN) && (
        <div style={{position: 'absolute', left: 70, top: 600, ...block(f, C_IN)}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 18, padding: '14px 32px 14px 16px', borderRadius: 999,
            background: GOLD, boxShadow: `0 8px 0 ${INK}`}}>
            <Img src={staticFile('logo.png')} style={{width: 70, height: 70, borderRadius: '50%', background: INK}} />
            <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 56, color: INK, lineHeight: 1}}>@ArendagaGiftBot</div>
          </div>
          <div style={{marginTop: 26, fontFamily: SANS, fontWeight: 800, fontSize: 46, color: IVORY}}>↑ Havola profilda</div>
        </div>
      )}

      <Audio src={staticFile(`audio/bed_${ID}.wav`)}
        volume={(fr) => interpolate(fr, [0, 12, FRAMES - 30, FRAMES], [0, 0.3, 0.3, 0], clamp)} />
      <Sequence from={HOP}><Audio src={staticFile('audio/kindle.wav')} volume={0.35} /></Sequence>
      <Sequence from={A_IN + 2}><Audio src={staticFile('audio/silk.wav')} volume={0.3} /></Sequence>
      <Sequence from={B_IN + 2}><Audio src={staticFile('audio/silk.wav')} volume={0.3} /></Sequence>
      <Sequence from={P_IN + 2}><Audio src={staticFile('audio/silk.wav')} volume={0.25} /></Sequence>
    </AbsoluteFill>
  );
};

const Cover: React.FC = () => {
  useFonts();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  const [data] = gifts;
  return (
    <AbsoluteFill style={{background: BG_3, overflow: 'hidden'}}>
      <Cloth f={0} />
      <Medallion f={0} still />
      <Band f={0} y={0} dir={1} />
      <Band f={0} y={H - 110} dir={-1} />
      <FlameGlow f={0} x={GX + 0.02 * GS} y={GY - 0.25 * GS} still />
      <Bowl data={data} f={0} pose={150} size={GS} y={GY} lift={0} />
      <div style={{position: 'absolute', left: 70, top: 290}}>
        <Pill text="TELEGRAM NFT SOVG‘A IJARASI" />
        <div style={{height: 34}} />
        <Price f={100} from={0} />
      </div>
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
