import '@fontsource/fraunces/900.css';
import {Lottie} from '@remotion/lottie';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Freeze, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random,
  staticFile, useCurrentFrame,
} from 'remotion';
import {BODY, GiftData, W, clamp, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "VITRINA" — the Whip Cupcake #40503 (Wasteland model) in a patisserie display case.
// Frame one already reads "Telegram NFT sovg‘a ijarasi / Kuniga 750 so‘m" with the cupcake huge on a paper doily under
// a glass cake dome; the dome lifts off at 0.2 s, and at 1.5 s the cupcake's own animation throws off its bunker door,
// car and twigs, pipes its cream again and puts itself back together. Then three calm text blocks, each underlined by a
// piped apricot cream line: "Whip Cupcake / Rook belgisi — atigi 0,5%", "Profilingizda turadi / 3 kundan 30 kungacha"
// (the cupcake comes apart and back once more), then the price, the bot and the link.
const ID = 'V20261127c';
const GIFT = 'whipcupcake-40503'; // Wasteland 2.5%, Dark Green backdrop 1.2%, Rook symbol 0.5%; 750 so‘m a day
const HEAD = "'Fraunces', serif";

// Palette. Gift: a pale steel cup, apricot-orange cake and butter-yellow cream, small red car.
// Background family: slate blue (the steel cup, darkened). Accent: the cake's apricot (complementary to the slate).
// Neutral: warm cream and slate ink. No extra hue: the car's red stays inside the artwork.
const SL_1 = '#3a5062';
const SL_2 = '#263746';
const SL_3 = '#16222d';
const SL_L = '#4c6578';
const APR = '#ffaa4f';
const APR_D = '#d9772a';
const CREAM = '#fff3dc';
const INK = '#13202b';

// Timeline (30 fps).
const OPEN_OUT = 126;
const A_IN = 134;
const A_OUT = 262;
const B_IN = 272;
const B_OUT = 390;
const P_IN = 400;
const C_IN = 436;
const FRAMES = 560; // 18.7 s

// The gift's own 180-frame loop: whole 0–20; door, car and twigs fly off 20–48; bare cake 50–62; cream piped 64–96;
// pieces fly back 100–150; whole and settled 160–179.
const CYCLE_1 = 22;
const CYCLE_2 = 262; // the idle ping-pong reaches pose 179 at 261, so the second run starts seamlessly at 0

// Gift box: the cupcake fills ~22–74% across and ~20–80% down.
const GS = 1180;
const GX = 494;
const GY = 1150;
const DX = 470; // doily / stand centre
const DY = 1478;

const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([`900 10px Fraunces`, `800 10px Manrope`]
      .map((font) => document.fonts.load(font, 'Kuniga 750 so‘m o‘g‘ — ↑ 0,5% Whip Cupcake Profilingizda @ArendagaGiftBot')))
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

const idle = (f: number, from: number) => {
  const k = (f - from) % 30;
  return 164 + (k < 15 ? k : 30 - k);
};
/** Which frame of the gift's own animation to show. */
const giftFrame = (f: number) => {
  if (f < CYCLE_1) return 0;
  if (f < CYCLE_1 + 164) return f - CYCLE_1;
  if (f < CYCLE_2) return idle(f, CYCLE_1 + 164);
  if (f < CYCLE_2 + 164) return f - CYCLE_2;
  return idle(f, CYCLE_2 + 164);
};

/** Text enters by rising and settling (10 frames), leaves by fading upward (7 frames). */
const block = (f: number, from: number, to?: number) => {
  const t = interpolate(f, [from, from + 10], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const o = to === undefined ? 0 : interpolate(f, [to, to + 7], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  return {opacity: Math.min(1, t * 1.4) * (1 - o), transform: `translateY(${(1 - t) * 46 - o * 40}px)`};
};
const shown = (f: number, from: number, to?: number) => f >= from && (to === undefined || f < to + 7);

/** A piped cream line under a headline: a soft apricot wave that draws itself in from the left. */
const Piped: React.FC<{f: number; at: number; width: number}> = ({f, at, width}) => {
  const t = interpolate(f, [at + 4, at + 20], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});
  const waves = Math.round(width / 46);
  let d = 'M8 18';
  for (let i = 0; i < waves; i++) {
    const x0 = 8 + ((width - 16) / waves) * i;
    const w = (width - 16) / waves;
    d += ` Q${x0 + w / 4} 4 ${x0 + w / 2} 18 T${x0 + w} 18`;
  }
  return (
    <svg width={width} height={36} style={{display: 'block'}}>
      <path d={d} fill="none" stroke={APR_D} strokeWidth={14} strokeLinecap="round" pathLength={1}
        strokeDasharray="1 1" strokeDashoffset={1 - t} transform="translate(0 4)" opacity={0.5} />
      <path d={d} fill="none" stroke={APR} strokeWidth={14} strokeLinecap="round" pathLength={1}
        strokeDasharray="1 1" strokeDashoffset={1 - t} />
    </svg>
  );
};

/** The display case: slate wall with wide soft stripes, a warm light behind the cake, a counter edge below. */
const Case: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 85% 60% at 46% 58%, ${SL_1} 0%, ${SL_2} 58%, ${SL_3} 100%)`, overflow: 'hidden'}}>
    <AbsoluteFill style={{opacity: 0.18,
      background: `repeating-linear-gradient(90deg, ${SL_L} 0px, ${SL_L} 90px, rgba(0,0,0,0) 90px, rgba(0,0,0,0) 180px)`,
      backgroundPosition: `${f * 0.35}px 0px`}} />
    <div style={{position: 'absolute', left: DX - 520, top: 640, width: 1040, height: 1000, borderRadius: '50%',
      background: 'radial-gradient(ellipse, rgba(255,196,120,.30) 0%, rgba(255,196,120,.10) 45%, rgba(255,196,120,0) 70%)',
      opacity: 0.85 + Math.sin(f / 30) * 0.15}} />
    {/* counter */}
    <div style={{position: 'absolute', left: -20, right: -20, top: DY + 40, bottom: -20,
      background: `linear-gradient(180deg, ${SL_L} 0px, ${SL_2} 18px, ${SL_3} 100%)`, opacity: 0.9}} />
    <div style={{position: 'absolute', left: -20, right: -20, top: DY + 40, height: 6, background: APR, opacity: 0.55}} />
  </AbsoluteFill>
);

/** A paper doily on a low cream stand, seen in perspective; the lace ring turns slowly. */
const Doily: React.FC<{f: number}> = ({f}) => {
  const R = 330;
  const ry = 0.26;
  const scallops = 36;
  let d = '';
  for (let i = 0; i <= scallops * 6; i++) {
    const a = (i / (scallops * 6)) * Math.PI * 2;
    const r = R + Math.abs(Math.sin(a * scallops / 2)) * 18;
    d += `${i ? 'L' : 'M'}${DX + Math.cos(a) * r} ${DY + Math.sin(a) * r * ry} `;
  }
  const holes = Array.from({length: 30}, (_, i) => {
    const a = (i / 30) * Math.PI * 2 + f * 0.004;
    return {x: DX + Math.cos(a) * (R - 34), y: DY + Math.sin(a) * (R - 34) * ry, s: 0.55 + 0.45 * Math.abs(Math.sin(a))};
  });
  return (
    <svg width={W} height={1920} style={{position: 'absolute', inset: 0}}>
      <ellipse cx={DX} cy={DY + 52} rx={R - 40} ry={(R - 40) * ry} fill={INK} opacity={0.45} />
      <rect x={DX - 70} y={DY} width={140} height={56} fill={CREAM} opacity={0.9} />
      <ellipse cx={DX} cy={DY + 56} rx={150} ry={150 * ry} fill={CREAM} opacity={0.9} />
      <path d={d + 'Z'} fill={APR_D} transform="translate(0 10)" opacity={0.55} />
      <path d={d + 'Z'} fill={CREAM} />
      {holes.map((h, i) => (
        <ellipse key={i} cx={h.x} cy={h.y} rx={9} ry={9 * ry * 1.6 * h.s} fill={SL_2} opacity={0.35} />
      ))}
      <ellipse cx={DX} cy={DY} rx={R - 70} ry={(R - 70) * ry} fill="none" stroke={APR} strokeWidth={4}
        strokeDasharray="3 16" strokeLinecap="round" opacity={0.8} />
    </svg>
  );
};

/** The glass dome over the cake on frame one; it lifts straight up and out of the frame by frame 26. */
const Cloche: React.FC<{f: number}> = ({f}) => {
  const t = interpolate(f, [5, 26], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  if (t >= 1) return null;
  const lift = t * 1400;
  const w = 330;
  const top = DY - 820;
  return (
    <svg width={W} height={1920} style={{position: 'absolute', inset: 0, transform: `translateY(${-lift}px)`, opacity: 1 - t * 0.3}}>
      <defs>
        <linearGradient id="glass" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity={0.22} />
          <stop offset="0.3" stopColor="#ffffff" stopOpacity={0.04} />
          <stop offset="0.75" stopColor="#ffffff" stopOpacity={0.03} />
          <stop offset="1" stopColor="#ffffff" stopOpacity={0.18} />
        </linearGradient>
      </defs>
      <path d={`M${DX - w} ${DY} L${DX - w} ${top + 300} C${DX - w} ${top + 40} ${DX + w} ${top + 40} ${DX + w} ${top + 300} L${DX + w} ${DY} Z`}
        fill="url(#glass)" stroke={CREAM} strokeOpacity={0.55} strokeWidth={5} />
      <path d={`M${DX - w + 60} ${DY - 80} L${DX - w + 60} ${top + 320} C${DX - w + 60} ${top + 170} ${DX - 120} ${top + 110} ${DX - 60} ${top + 105}`}
        fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={14} strokeLinecap="round" />
      <ellipse cx={DX} cy={DY} rx={w} ry={w * 0.26} fill="none" stroke={CREAM} strokeOpacity={0.5} strokeWidth={5} />
      <circle cx={DX} cy={top + 108} r={34} fill={CREAM} opacity={0.9} />
      <circle cx={DX - 10} cy={top + 98} r={10} fill="#fff" />
    </svg>
  );
};

/** Sugar sprinkles drifting behind the cake; they fade out above y = 860, away from the text column. */
const Sprinkles: React.FC<{f: number}> = ({f}) => (
  <>
    {Array.from({length: 22}, (_, i) => {
      const r = (k: string) => random(`spr-${i}-${k}`);
      const life = 320 + r('l') * 220;
      const t = ((f + r('o') * life) % life) / life;
      const x = 30 + r('x') * 980 + Math.sin(f / 45 + i) * 20;
      const y = 1560 - t * 760;
      const rot = r('r') * 180 + f * (r('d') - 0.5) * 3;
      const fade = interpolate(y, [860, 980], [0, 1], clamp) * interpolate(t, [0, 0.1], [0, 1], clamp);
      const c = [APR, CREAM, '#9fb4c0'][i % 3];
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: 30, height: 9, borderRadius: 6,
        background: c, opacity: 0.7 * fade, transform: `rotate(${rot}deg)`}} />;
    })}
  </>
);

const Cake: React.FC<{data: GiftData; f: number; frame: number}> = ({data, f, frame}) => {
  const bob = Math.sin(f / 24) * 6;
  return (
    <div style={{position: 'absolute', left: GX - GS / 2, top: GY - GS / 2 + bob, width: GS, height: GS,
      filter: 'drop-shadow(0 24px 24px rgba(10,18,26,.5))'}}>
      <Freeze frame={frame}><Lottie animationData={data.gift} style={{width: GS, height: GS}} /></Freeze>
    </div>
  );
};

const Pill: React.FC<{text: string}> = ({text}) => (
  <div style={{display: 'inline-block', padding: '12px 26px', borderRadius: 999, background: APR,
    fontFamily: BODY, fontWeight: 800, fontSize: 36, letterSpacing: 1.5, color: INK}}>{text}</div>
);

const Price: React.FC<{f: number; at: number}> = ({f, at}) => (
  <>
    <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 64, color: CREAM, lineHeight: 1}}>Kuniga</div>
    <div style={{marginTop: 6, fontFamily: HEAD, fontWeight: 900, fontSize: 168, color: CREAM, lineHeight: 1.02,
      whiteSpace: 'nowrap'}}>750 <span style={{color: APR}}>so‘m</span></div>
    <div style={{marginTop: 4}}><Piped f={f} at={at} width={560} /></div>
  </>
);

const Video: React.FC = () => {
  useFonts();
  const gifts = useGifts([GIFT]);
  const f = useCurrentFrame();
  if (!gifts) return null;
  const [data] = gifts;

  return (
    <AbsoluteFill style={{background: SL_2, overflow: 'hidden'}}>
      <Case f={f} />
      <Sprinkles f={f} />
      <Doily f={f} />
      <Cake data={data} f={f} frame={giftFrame(f)} />
      <Cloche f={f} />

      {shown(f, 0, OPEN_OUT) && (
        <div style={{position: 'absolute', left: 70, top: 250, ...block(f, -10, OPEN_OUT)}}>
          <Pill text="TELEGRAM NFT SOVG‘A IJARASI" />
          <div style={{marginTop: 30}}><Price f={f} at={-30} /></div>
        </div>
      )}

      {shown(f, A_IN, A_OUT) && (
        <div style={{position: 'absolute', left: 70, top: 262, ...block(f, A_IN, A_OUT)}}>
          <div style={{fontFamily: HEAD, fontWeight: 900, fontSize: 120, color: CREAM, lineHeight: 1}}>Whip Cupcake</div>
          <Piped f={f} at={A_IN} width={640} />
          <div style={{marginTop: 26, fontFamily: BODY, fontWeight: 800, fontSize: 58, color: CREAM, lineHeight: 1.1}}>Rook belgisi —</div>
          <div style={{marginTop: 6, fontFamily: HEAD, fontWeight: 900, fontSize: 116, color: APR, lineHeight: 1}}>atigi 0,5%</div>
        </div>
      )}

      {shown(f, B_IN, B_OUT) && (
        <div style={{position: 'absolute', left: 70, top: 262, ...block(f, B_IN, B_OUT)}}>
          <div style={{fontFamily: HEAD, fontWeight: 900, fontSize: 112, color: CREAM, lineHeight: 1.04}}>
            Profilingizda<br />turadi
          </div>
          <Piped f={f} at={B_IN} width={500} />
          <div style={{marginTop: 24, display: 'inline-block', padding: '14px 30px', borderRadius: 999, background: APR,
            fontFamily: BODY, fontWeight: 800, fontSize: 54, color: INK}}>3 kundan 30 kungacha</div>
        </div>
      )}

      {shown(f, P_IN) && (
        <div style={{position: 'absolute', left: 70, top: 250, ...block(f, P_IN)}}><Price f={f} at={P_IN} /></div>
      )}
      {shown(f, C_IN) && (
        <div style={{position: 'absolute', left: 70, top: 560, ...block(f, C_IN)}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 18, padding: '14px 34px 14px 14px', borderRadius: 999,
            background: CREAM, boxShadow: `0 9px 0 ${APR_D}`}}>
            <Img src={staticFile('logo.png')} style={{width: 72, height: 72, borderRadius: '50%', background: INK}} />
            <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 56, color: INK, lineHeight: 1}}>@ArendagaGiftBot</div>
          </div>
          <div style={{marginTop: 30, fontFamily: BODY, fontWeight: 800, fontSize: 48, color: CREAM}}>↑ Havola profilda</div>
        </div>
      )}

      <Audio src={staticFile(`audio/bed_${ID}.wav`)}
        volume={(fr) => interpolate(fr, [0, 12, FRAMES - 30, FRAMES], [0, 0.3, 0.3, 0], clamp)} />
      <Sequence from={4}><Audio src={staticFile('audio/lift.wav')} volume={0.3} /></Sequence>
      <Sequence from={CYCLE_1 + 22}><Audio src={staticFile('audio/poof.wav')} volume={0.16} /></Sequence>
    </AbsoluteFill>
  );
};

const Cover: React.FC = () => {
  useFonts();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  const [data] = gifts;
  return (
    <AbsoluteFill style={{background: SL_2, overflow: 'hidden'}}>
      <Case f={0} />
      <Doily f={0} />
      <Cake data={data} f={0} frame={0} />
      <div style={{position: 'absolute', left: 70, top: 280}}>
        <Pill text="TELEGRAM NFT SOVG‘A IJARASI" />
        <div style={{marginTop: 30}}><Price f={60} at={0} /></div>
      </div>
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
