import '@fontsource/bungee/400.css';
import {Lottie} from '@remotion/lottie';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Freeze, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random,
  staticFile, useCurrentFrame,
} from 'remotion';
import {BODY, GiftData, W, clamp, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "QADOQ" — the Ice Cream #62286 (Choco Almond model) as the star of its own ice-cream wrapper.
// Frame one already reads "Telegram NFT sovg‘a ijarasi / Kuniga 750 so‘m" with the bar huge on a pistachio medallion;
// the torn wrapper around it flies apart in the first second and someone takes a bite at 1.3 s.
// Then label stickers, like on a packet: "Ice Cream / Cash belgisi — atigi 0,7%", "Profilingizda turadi /
// 3 kundan 30 kungacha" (the bar is eaten and comes back whole again), then the price, the bot and the link.
const ID = 'V20261127a';
const GIFT = 'icecream-62286'; // Choco Almond 3%, Shamrock Green backdrop 1.5%, Cash symbol 0.7%; 750 so‘m a day
const HEAD = "'Bungee', sans-serif";

// Palette. Gift: milk-chocolate bar with almond pieces and a pale wooden stick, on a Shamrock Green backdrop.
// Background family: vanilla cream (analogous to the almonds and the stick, light so the brown bar stands out).
// Accent: the backdrop's pistachio green (near-complementary to the chocolate's red-brown). Neutral: cocoa ink and
// cream. No extra hue: the almond tan only on the flakes.
const VAN_1 = '#fff7e8';
const VAN_2 = '#f6e4c4';
const VAN_3 = '#ecd2a6';
const PIST = '#8cc063';
const PIST_D = '#3f8a3a';
const PIST_L = '#c6e3a4';
const COCOA = '#3b1c0e';
const COCOA_2 = '#5a2d16';
const CREAM = '#fff7e8';
const ALMOND = '#e7b679';

// Timeline (30 fps).
const A_IN = 134;
const A_OUT = 262;
const B_IN = 272;
const B_OUT = 390;
const P_IN = 400;
const C_IN = 436;
const FRAMES = 560; // 18.7 s

// The gift's own loop: bites at ~16, 44, 80, only the stick ~100, turns and refills 112–145, whole 150–179.
const EAT_1 = 24;
const EAT_2 = 262;

// Gift box: the bar fills ~30–80% across and ~18–79% down, so the box is shifted to centre the bar on (470, 1168).
const GS = 1300;
const GX = 405;
const GY = 1148;
const MX = 470;
const MY = 1138;
const MR = 420;

const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([`400 10px "Bungee"`, `800 10px Manrope`]
      .map((font) => document.fonts.load(font, 'KUNIGA 750 SO‘M o‘g‘ — ↑ 0,7% Ice Cream Profilingizda @ArendagaGiftBot')))
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

const ease = Easing.out(Easing.back(1.4));
const block = (f: number, from: number, to?: number) => {
  const t = interpolate(f, [from, from + 10], [0, 1], {...clamp, easing: ease});
  const o = to === undefined ? 0 : interpolate(f, [to, to + 7], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  return {opacity: Math.min(1, t * 1.5) * (1 - o), transform: `translateX(${(1 - t) * -120 - o * 160}px)`};
};
const shown = (f: number, from: number, to?: number) => f >= from && (to === undefined || f < to + 7);

const idle = (f: number, from: number) => {
  const k = (f - from) % 58;
  return 150 + (k < 29 ? k : 58 - k);
};
/** Which frame of the gift's own animation to show. */
const giftFrame = (f: number) => {
  if (f < EAT_1) return 0;
  if (f < EAT_1 + 150) return f - EAT_1;
  if (f < EAT_2) return idle(f, EAT_1 + 150);
  if (f < EAT_2 + 150) return f - EAT_2;
  return idle(f, EAT_2 + 150);
};

/** Vanilla wrapper print: wide pistachio stripes sliding slowly, a chocolate drip along the top, a crimped edge below. */
const Wrapper: React.FC<{f: number}> = ({f}) => {
  const drips = Array.from({length: 11}, (_, i) => {
    const x = 40 + i * 100 + random(`dx-${i}`) * 40;
    const len = 40 + random(`dl-${i}`) * 90 + Math.sin(f / (40 + i * 3) + i) * 12 + Math.min(30, f * 0.05) * random(`dg-${i}`);
    const w = 34 + random(`dw-${i}`) * 26;
    return {x, len, w};
  });
  const base = 70;
  let d = `M0 0 L${W} 0 L${W} ${base}`;
  for (const dr of [...drips].reverse()) {
    d += ` L${dr.x + dr.w / 2 + 14} ${base} Q${dr.x + dr.w / 2} ${base} ${dr.x + dr.w / 2} ${base + 14}`;
    d += ` L${dr.x + dr.w / 2} ${base + dr.len} A${dr.w / 2} ${dr.w / 2} 0 0 1 ${dr.x - dr.w / 2} ${base + dr.len}`;
    d += ` L${dr.x - dr.w / 2} ${base + 14} Q${dr.x - dr.w / 2} ${base} ${dr.x - dr.w / 2 - 14} ${base}`;
  }
  d += ` L0 ${base} Z`;
  const teeth = 27;
  let z = `M0 1920 L0 1850`;
  for (let i = 0; i < teeth; i++) {
    const x0 = (W / teeth) * i;
    z += ` L${x0 + W / teeth / 2} 1818 L${x0 + W / teeth} 1850`;
  }
  z += ` L${W} 1920 Z`;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 70% at 44% 55%, ${VAN_1} 0%, ${VAN_2} 62%, ${VAN_3} 100%)`, overflow: 'hidden'}}>
      <AbsoluteFill style={{opacity: 0.32,
        background: `repeating-linear-gradient(-35deg, ${PIST_L} 0px, ${PIST_L} 70px, rgba(0,0,0,0) 70px, rgba(0,0,0,0) 230px)`,
        backgroundPosition: `${f * 0.9}px 0px`}} />
      <svg width={W} height={1920} style={{position: 'absolute', inset: 0}}>
        <path d={d} fill={COCOA_2} transform="translate(0 8)" opacity={0.35} />
        <path d={d} fill={COCOA} />
        {drips.map((dr, i) => (
          <ellipse key={i} cx={dr.x - dr.w / 6} cy={base + dr.len - 4} rx={dr.w / 7} ry={dr.w / 5} fill="#fff" opacity={0.18} />
        ))}
        <path d={z} fill={PIST} />
        <path d={z} fill="none" stroke={PIST_D} strokeWidth={6} transform="translate(0 22)" opacity={0.5} />
      </svg>
    </AbsoluteFill>
  );
};

/** The label medallion behind the bar: a scalloped pistachio seal with a dashed cream ring, turning slowly. */
const Medallion: React.FC<{f: number; s?: number}> = ({f, s = 1}) => {
  const bumps = 28;
  let d = '';
  for (let i = 0; i <= bumps * 4; i++) {
    const a = (i / (bumps * 4)) * Math.PI * 2;
    const r = MR + Math.cos(a * bumps) * 14;
    d += `${i ? 'L' : 'M'}${MX + Math.cos(a) * r} ${MY + Math.sin(a) * r} `;
  }
  return (
    <svg width={W} height={1920} style={{position: 'absolute', inset: 0, transform: `scale(${s})`, transformOrigin: `${MX}px ${MY}px`}}>
      <g transform={`rotate(${f * 0.12} ${MX} ${MY})`}>
        <path d={d + 'Z'} fill={PIST_D} transform="translate(0 14)" opacity={0.35} />
        <path d={d + 'Z'} fill={PIST} />
        <circle cx={MX} cy={MY} r={MR - 46} fill="none" stroke={CREAM} strokeWidth={7} strokeDasharray="4 20" strokeLinecap="round" />
      </g>
      <circle cx={MX} cy={MY} r={MR - 80} fill={PIST_L} opacity={0.55} />
    </svg>
  );
};

/** The torn wrapper around the bar on frame one: two pistachio halves with ragged edges that fly apart. */
const Torn: React.FC<{f: number}> = ({f}) => {
  const t = interpolate(f, [5, 26], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  if (t >= 1) return null;
  const half = (side: -1 | 1) => {
    let edge = '';
    const n = 14;
    for (let i = 0; i <= n; i++) {
      const y = -900 + (1800 / n) * i;
      const x = side * (250 + (i % 2 ? 26 : -10) + random(`tear-${side}-${i}`) * 20);
      edge += `L${x} ${y} `;
    }
    const outer = side * 1200;
    return `M${outer} -900 ${edge}L${outer} 900 Z`;
  };
  return (
    <svg width={W} height={1920} style={{position: 'absolute', inset: 0}}>
      <defs>
        <clipPath id="tornclip"><rect x={0} y={790} width={W} height={1130} /></clipPath>
        <pattern id="wrapstripe" width={60} height={60} patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
          <rect width={60} height={60} fill={PIST} />
          <rect width={22} height={60} fill={PIST_L} opacity={0.6} />
        </pattern>
      </defs>
      <g clipPath="url(#tornclip)">
        {([-1, 1] as const).map((side) => (
          <g key={side} transform={`translate(${MX + side * t * 700} ${MY + side * t * 260}) rotate(${35 + side * t * 25})`} opacity={1 - t * 0.4}>
            <path d={half(side)} fill={PIST_D} transform="translate(10 14)" opacity={0.4} />
            <path d={half(side)} fill="url(#wrapstripe)" stroke={CREAM} strokeWidth={8} />
          </g>
        ))}
      </g>
    </svg>
  );
};

/** Almond flakes drifting around the medallion; they fade out above y = 830, away from the text. */
const Flakes: React.FC<{f: number}> = ({f}) => (
  <>
    {Array.from({length: 18}, (_, i) => {
      const r = (k: string) => random(`alm-${i}-${k}`);
      const life = 300 + r('l') * 200;
      const t = ((f + r('o') * life) % life) / life;
      const x = 40 + r('x') * 860 + Math.sin(f / 40 + i) * 24;
      const y = 1820 - t * 1100;
      const rot = r('r') * 360 + f * (r('d') - 0.5) * 2;
      const fade = interpolate(y, [830, 960], [0, 1], clamp) * interpolate(t, [0, 0.1], [0, 1], clamp);
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: 34, height: 20, borderRadius: '50%',
        background: `linear-gradient(160deg, #f6d3a3, ${ALMOND})`, border: `2px solid #b97f45`,
        opacity: 0.8 * fade, transform: `rotate(${rot}deg)`}} />;
    })}
  </>
);

const Bar: React.FC<{data: GiftData; f: number; frame: number}> = ({data, f, frame}) => {
  const bob = Math.sin(f / 22) * 8;
  return (
    <>
      <div style={{position: 'absolute', left: MX - 230, top: MY + 350, width: 460, height: 60, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(59,28,14,.28) 0%, rgba(59,28,14,0) 70%)'}} />
      <div style={{position: 'absolute', left: GX - GS / 2, top: GY - GS / 2 + bob, width: GS, height: GS,
        filter: 'drop-shadow(0 22px 22px rgba(59,28,14,.35))'}}>
        <Freeze frame={frame}><Lottie animationData={data.gift} style={{width: GS, height: GS}} /></Freeze>
      </div>
    </>
  );
};

const Pill: React.FC<{text: string}> = ({text}) => (
  <div style={{display: 'inline-block', padding: '12px 26px', borderRadius: 999, background: PIST_D,
    fontFamily: BODY, fontWeight: 800, fontSize: 36, letterSpacing: 1.5, color: CREAM}}>{text}</div>
);

const Price: React.FC = () => (
  <>
    <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 66, color: COCOA, lineHeight: 1}}>Kuniga</div>
    <div style={{marginTop: 10, fontFamily: HEAD, fontSize: 150, color: COCOA, lineHeight: 1, whiteSpace: 'nowrap',
      textShadow: `0 9px 0 ${PIST}`}}>750 SO‘M</div>
  </>
);

const Video: React.FC = () => {
  useFonts();
  const gifts = useGifts([GIFT]);
  const f = useCurrentFrame();
  if (!gifts) return null;
  const [data] = gifts;
  const breathe = 1 + interpolate(f, [EAT_1 + 16, EAT_1 + 22, EAT_1 + 34], [0, 0.03, 0], clamp);

  return (
    <AbsoluteFill style={{background: VAN_2, overflow: 'hidden'}}>
      <Wrapper f={f} />
      <Medallion f={f} s={breathe} />
      <Flakes f={f} />
      <Bar data={data} f={f} frame={giftFrame(f)} />
      <Torn f={f} />

      {shown(f, 0, 126) && (
        <div style={{position: 'absolute', left: 70, top: 250, ...block(f, -10, 126)}}>
          <Pill text="TELEGRAM NFT SOVG‘A IJARASI" />
          <div style={{marginTop: 34}}><Price /></div>
        </div>
      )}

      {shown(f, A_IN, A_OUT) && (
        <div style={{position: 'absolute', left: 70, top: 260, ...block(f, A_IN, A_OUT)}}>
          <div style={{display: 'inline-block', padding: '34px 44px 40px', borderRadius: 36, background: COCOA,
            boxShadow: `0 12px 0 ${PIST}`}}>
            <div style={{fontFamily: HEAD, fontSize: 104, color: CREAM, lineHeight: 1}}>ICE CREAM</div>
            <div style={{marginTop: 26, fontFamily: BODY, fontWeight: 800, fontSize: 56, color: CREAM, lineHeight: 1.1}}>Cash belgisi —</div>
            <div style={{marginTop: 8, fontFamily: HEAD, fontSize: 112, color: PIST, lineHeight: 1}}>ATIGI 0,7%</div>
          </div>
        </div>
      )}

      {shown(f, B_IN, B_OUT) && (
        <div style={{position: 'absolute', left: 70, top: 260, ...block(f, B_IN, B_OUT)}}>
          <div style={{fontFamily: HEAD, fontSize: 92, color: COCOA, lineHeight: 1.08, textShadow: `0 7px 0 ${PIST}`}}>
            PROFILINGIZDA<br />TURADI
          </div>
          <div style={{marginTop: 36, display: 'inline-block', padding: '14px 30px', borderRadius: 999, background: COCOA,
            fontFamily: BODY, fontWeight: 800, fontSize: 54, color: CREAM}}>3 kundan 30 kungacha</div>
        </div>
      )}

      {shown(f, P_IN) && (
        <div style={{position: 'absolute', left: 70, top: 250, ...block(f, P_IN)}}><Price /></div>
      )}
      {shown(f, C_IN) && (
        <div style={{position: 'absolute', left: 70, top: 540, ...block(f, C_IN)}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 18, padding: '14px 34px 14px 14px', borderRadius: 999,
            background: COCOA, boxShadow: `0 9px 0 ${PIST}`}}>
            <Img src={staticFile('logo.png')} style={{width: 72, height: 72, borderRadius: '50%', background: CREAM}} />
            <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 56, color: CREAM, lineHeight: 1}}>@ArendagaGiftBot</div>
          </div>
          <div style={{marginTop: 30, fontFamily: BODY, fontWeight: 800, fontSize: 48, color: COCOA}}>↑ Havola profilda</div>
        </div>
      )}

      <Audio src={staticFile(`audio/bed_${ID}.wav`)}
        volume={(fr) => interpolate(fr, [0, 12, FRAMES - 30, FRAMES], [0, 0.3, 0.3, 0], clamp)} />
      <Sequence from={4}><Audio src={staticFile('audio/foil.wav')} volume={0.26} /></Sequence>
      <Sequence from={EAT_1 + 15}><Audio src={staticFile('audio/bite.wav')} volume={0.3} /></Sequence>
    </AbsoluteFill>
  );
};

const Cover: React.FC = () => {
  useFonts();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  const [data] = gifts;
  return (
    <AbsoluteFill style={{background: VAN_2, overflow: 'hidden'}}>
      <Wrapper f={0} />
      <Medallion f={0} />
      <Bar data={data} f={0} frame={0} />
      <div style={{position: 'absolute', left: 70, top: 280}}>
        <Pill text="TELEGRAM NFT SOVG‘A IJARASI" />
        <div style={{marginTop: 34}}><Price /></div>
      </div>
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
