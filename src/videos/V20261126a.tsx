import '@fontsource/lilita-one/400.css';
import {Lottie} from '@remotion/lottie';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random,
  spring, staticFile, useCurrentFrame,
} from 'remotion';
import {BODY, GiftData, W, clamp, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "LEVITATSIYA" — the Surge Board #3194 (Rune Nova) hovering over a magnetic pad on a light sage studio floor.
// Frame one already reads "Telegram NFT sovg‘a ijarasi / Kuniga 850 so‘m" with the board huge and floating.
// At 0.3 s the pad fires: violet and cyan field rings spread over the floor and the board lifts a step.
// Every new line charges the pad again and the board rises one step higher (three steps), sparks drifting up
// from the pad: "Surge Board / Fried Egg belgisi — atigi 0,5%", "Profilingizda turadi / 3 kundan 30 kungacha",
// then the price, the bot and the link.
const ID = 'V20261126a';
const GIFT = 'surgeboard-3194'; // Rune Nova model 2%, Shamrock Green backdrop 1.5%, Fried Egg symbol 0.5%; 850 so‘m a day
const HEAD = "'Lilita One', sans-serif";

// Palette. Gift: silver-sage board with a violet gem, gold rims and cyan light strips, on a Shamrock Green
// backdrop. Background family: light sage (the backdrop's green, lightened). Accent: the gem's violet
// (complementary to the green). Neutral: forest ink and warm white. Extra hue: the board's cyan, only in rings.
const SAGE_1 = '#eef4e4';
const SAGE_2 = '#d5e5c3';
const SAGE_3 = '#a9c98f';
const FLOOR_1 = '#c4dbad';
const FLOOR_2 = '#8fb672';
const VIOLET = '#6a2fd0';
const VIOLET_DEEP = '#3d1585';
const INK = '#17331c';
const WHITE = '#fbfdf5';
const CYAN = '#34cfdc';

// Timeline (30 fps).
const KICK = 9; // first charge, 0.3 s
const A_IN = 134;
const A_OUT = 262;
const B_IN = 272;
const B_OUT = 384;
const P_IN = 394;
const C_IN = 430;
const FRAMES = 560; // 18.7 s
const CHARGES = [KICK, A_IN, B_IN, P_IN];

// Gift geometry. The board lies diagonally and fills ~22–78% of its box across and ~25–76% down.
const GS = 1250;
const GX = 470;
const GY = 1170;
const HORIZON = 1360;
const PAD_Y = 1590;

const Q: React.FC = () => <span style={{margin: '0 -0.1em 0 -0.06em'}}>‘</span>;

const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([`400 10px "Lilita One"`, `800 10px Manrope`]
      .map((font) => document.fonts.load(font, 'KUNIGA 850 so‘m o‘g‘ — ↑ 0,5% Surge Board Profilingizda')))
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

const ease = Easing.out(Easing.cubic);
const block = (f: number, from: number, to?: number) => {
  const t = interpolate(f, [from, from + 8], [0, 1], {...clamp, easing: ease});
  const o = to === undefined ? 1 : interpolate(f, [to, to + 6], [1, 0], clamp);
  return {opacity: t * o, transform: `translateY(${(1 - t) * 26}px)`};
};
const shown = (f: number, from: number, to?: number) => f >= from && (to === undefined || f < to + 6);

// How many charges have fired by frame f, eased: the board climbs one step per charge.
const level = (f: number) => CHARGES.reduce((sum, c) =>
  sum + spring({frame: f - c, fps: 30, config: {damping: 13, stiffness: 90, mass: 0.9}}), 0);

/** Studio: light sage wall, a floor in perspective with a fine grid, and a soft vignette. */
const Studio: React.FC<{f: number}> = ({f}) => {
  const rows = Array.from({length: 14}, (_, i) => i);
  const scroll = (f * 0.012) % 1;
  return (
    <AbsoluteFill style={{background: SAGE_2}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 55% at ${GX / W * 100}% 52%, ${SAGE_1} 0%, ${SAGE_2} 55%, ${SAGE_3} 100%)`}} />
      {/* floor */}
      <div style={{position: 'absolute', left: 0, right: 0, top: HORIZON, bottom: 0,
        background: `linear-gradient(180deg, ${FLOOR_1} 0%, ${FLOOR_2} 100%)`}} />
      <svg width={W} height={1920 - HORIZON} style={{position: 'absolute', left: 0, top: HORIZON}}>
        {rows.map((i) => {
          const t = (i + scroll) / rows.length;
          const y = Math.pow(t, 2.2) * (1920 - HORIZON);
          return <line key={i} x1={0} x2={W} y1={y} y2={y} stroke={WHITE} strokeOpacity={0.18 + t * 0.25} strokeWidth={1.5 + t * 2} />;
        })}
        {Array.from({length: 17}, (_, i) => {
          const x = GX + (i - 8) * 70;
          return <line key={i} x1={x} y1={0} x2={GX + (i - 8) * 420} y2={1920 - HORIZON} stroke={WHITE} strokeOpacity={0.28} strokeWidth={2} />;
        })}
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: HORIZON - 2, height: 4, background: WHITE, opacity: 0.6}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 70% at 45% 50%, rgba(23,51,28,0) 60%, rgba(23,51,28,.22) 100%)'}} />
    </AbsoluteFill>
  );
};

/** The magnetic pad on the floor and the field rings it sends out on each charge. */
const Pad: React.FC<{f: number; still?: boolean}> = ({f, still}) => {
  const glow = still ? 0.6 : 0.45 + 0.15 * Math.sin(f / 9);
  return (
    <svg width={W} height={500} style={{position: 'absolute', left: 0, top: PAD_Y - 250, overflow: 'visible'}}>
      <defs>
        <radialGradient id="padglow">
          <stop offset="0%" stopColor={CYAN} stopOpacity={0.75} />
          <stop offset="55%" stopColor={VIOLET} stopOpacity={0.25} />
          <stop offset="100%" stopColor={VIOLET} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={GX} cy={250} rx={420} ry={110} fill="url(#padglow)" opacity={glow} />
      <ellipse cx={GX} cy={250} rx={270} ry={62} fill="none" stroke={VIOLET} strokeWidth={10} />
      <ellipse cx={GX} cy={250} rx={200} ry={44} fill="none" stroke={WHITE} strokeWidth={4} strokeDasharray="18 14"
        strokeDashoffset={-f * 2} />
      <ellipse cx={GX} cy={250} rx={120} ry={24} fill={VIOLET_DEEP} opacity={0.85} />
      {!still && CHARGES.flatMap((c) => [0, 7, 14].map((d, k) => {
        const t = interpolate(f, [c + d, c + d + 34], [0, 1], clamp);
        if (f < c + d || t >= 1) return null;
        const r = 270 + t * 520;
        return <ellipse key={`${c}-${k}`} cx={GX} cy={250} rx={r} ry={r * 0.23} fill="none"
          stroke={k === 1 ? CYAN : VIOLET} strokeWidth={10 * (1 - t) + 1} opacity={(1 - t) * 0.9} />;
      }))}
    </svg>
  );
};

/** Little violet and cyan motes drifting up from the pad (they stop well below the text). */
const Motes: React.FC<{f: number}> = ({f}) => (
  <>
    {Array.from({length: 22}, (_, i) => {
      const r = (k: string) => random(`mote-${i}-${k}`);
      const life = 70 + r('l') * 50;
      const t = ((f + r('o') * life) % life) / life;
      const x = GX + (r('x') - 0.5) * 520 + Math.sin(f / 14 + i) * 14;
      const y = PAD_Y - 20 - t * 520;
      const size = 7 + r('s') * 10;
      return <div key={i} style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size,
        borderRadius: '50%', background: i % 3 === 0 ? CYAN : VIOLET, opacity: Math.sin(Math.PI * t) * 0.7}} />;
    })}
  </>
);

const Board: React.FC<{data: GiftData; f: number; rise: number; size: number; still?: boolean}> = ({data, f, rise, size, still}) => {
  const bob = still ? 0 : Math.sin(f / 16) * 9;
  const roll = still ? 0 : Math.sin(f / 23) * 1.6;
  const y = GY - rise + bob;
  // shadow on the floor shrinks and fades as the board climbs
  const k = 1 - Math.min(1, (rise + bob) / 260) * 0.45;
  return (
    <>
      <div style={{position: 'absolute', left: GX - 300 * k, top: PAD_Y - 40, width: 600 * k, height: 80, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(23,51,28,.45) 0%, rgba(23,51,28,0) 70%)', opacity: k}} />
      <div style={{position: 'absolute', left: GX - size / 2, top: y - size / 2, width: size, height: size,
        transform: `rotate(${roll}deg)`,
        filter: `drop-shadow(0 0 36px rgba(106,47,208,.35)) drop-shadow(0 24px 26px rgba(23,51,28,.35))`}}>
        <Lottie animationData={data.gift} loop style={{width: size, height: size}} />
      </div>
    </>
  );
};

const Pill: React.FC<{text: string}> = ({text}) => (
  <div style={{display: 'inline-block', padding: '12px 26px', borderRadius: 999, background: VIOLET,
    fontFamily: BODY, fontWeight: 800, fontSize: 36, letterSpacing: 1.5, color: WHITE}}>{text}</div>
);

const Price: React.FC = () => (
  <>
    <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 64, color: INK, lineHeight: 1}}>Kuniga</div>
    <div style={{marginTop: 4, fontFamily: HEAD, fontSize: 190, color: VIOLET, lineHeight: 1, whiteSpace: 'nowrap',
      textShadow: `0 6px 0 ${WHITE}`}}>850 so<Q />m</div>
  </>
);

const Video: React.FC = () => {
  useFonts();
  const gifts = useGifts([GIFT]);
  const f = useCurrentFrame();
  if (!gifts) return null;
  const [data] = gifts;
  const rise = 10 + level(f) * 14;

  return (
    <AbsoluteFill style={{background: SAGE_2, overflow: 'hidden'}}>
      <Studio f={f} />
      <Pad f={f} />
      <Motes f={f} />
      <Board data={data} f={f} rise={rise} size={GS} />

      {shown(f, 0, 126) && (
        <div style={{position: 'absolute', left: 70, top: 250, ...block(f, -8, 126)}}>
          <Pill text="TELEGRAM NFT SOVG‘A IJARASI" />
          <div style={{marginTop: 36}}><Price /></div>
        </div>
      )}

      {shown(f, A_IN, A_OUT) && (
        <div style={{position: 'absolute', left: 70, top: 270, ...block(f, A_IN, A_OUT)}}>
          <div style={{fontFamily: HEAD, fontSize: 120, color: INK, lineHeight: 1}}>Surge Board</div>
          <div style={{marginTop: 26, fontFamily: BODY, fontWeight: 800, fontSize: 56, color: INK, lineHeight: 1.1}}>Fried Egg belgisi —</div>
          <div style={{marginTop: 4, fontFamily: HEAD, fontSize: 132, color: VIOLET, lineHeight: 1}}>atigi 0,5%</div>
        </div>
      )}

      {shown(f, B_IN, B_OUT) && (
        <div style={{position: 'absolute', left: 70, top: 270, ...block(f, B_IN, B_OUT)}}>
          <div style={{fontFamily: HEAD, fontSize: 116, color: INK, lineHeight: 1.02}}>Profilingizda<br />turadi</div>
          <div style={{marginTop: 26, display: 'inline-block', padding: '12px 26px', borderRadius: 999, background: VIOLET,
            fontFamily: BODY, fontWeight: 800, fontSize: 52, color: WHITE}}>3 kundan 30 kungacha</div>
        </div>
      )}

      {shown(f, P_IN) && (
        <div style={{position: 'absolute', left: 70, top: 250, ...block(f, P_IN)}}><Price /></div>
      )}
      {shown(f, C_IN) && (
        <div style={{position: 'absolute', left: 70, top: 520, ...block(f, C_IN)}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 18, padding: '14px 32px 14px 14px', borderRadius: 999,
            background: VIOLET, boxShadow: `0 14px 30px rgba(61,21,133,.3)`}}>
            <Img src={staticFile('logo.png')} style={{width: 72, height: 72, borderRadius: '50%', background: INK}} />
            <div style={{fontFamily: HEAD, fontSize: 60, color: WHITE, lineHeight: 1}}>@ArendagaGiftBot</div>
          </div>
          <div style={{marginTop: 24, fontFamily: BODY, fontWeight: 800, fontSize: 48, color: INK}}>↑ Havola profilda</div>
        </div>
      )}

      <Audio src={staticFile(`audio/bed_${ID}.wav`)}
        volume={(fr) => interpolate(fr, [0, 12, FRAMES - 30, FRAMES], [0, 0.3, 0.3, 0], clamp)} />
      {CHARGES.map((c, i) => (
        <Sequence key={c} from={Math.max(0, c - 4)}>
          <Audio src={staticFile('audio/hover.wav')} volume={i === 0 ? 0.42 : 0.3} />
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
    <AbsoluteFill style={{background: SAGE_2, overflow: 'hidden'}}>
      <Studio f={0} />
      <Pad f={0} still />
      <Board data={data} f={0} rise={40} size={GS} still />
      <div style={{position: 'absolute', left: 70, top: 280}}>
        <Pill text="TELEGRAM NFT SOVG‘A IJARASI" />
        <div style={{marginTop: 36}}><Price /></div>
      </div>
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
