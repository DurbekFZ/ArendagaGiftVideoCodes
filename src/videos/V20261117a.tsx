import '@fontsource/chakra-petch/700.css';
import React, {useEffect, useMemo, useState} from 'react';
import {
  AbsoluteFill, Audio, Freeze, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random, spring,
  staticFile, useCurrentFrame, useVideoConfig, Easing,
} from 'remotion';
import {BODY, BRAND, Gift, GiftData, H, W, clamp, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "1000 tadan nechtasi?": a 1000-dot grid is the whole story. Frame one asks how many of 1000
// Chill Flames look like this one while all dots are lit and the counter is about to run down.
// The dots go dark until 30 remain (model 3%), relight, and fall again to 4 (symbol 0.4%). Silent.
const ID = 'V20261117a';
const GIFT = 'chillflame-164026'; // Candelabra model 3%, Sapphire backdrop 1.2%, Pawn symbol 0.4%; 750 so‘m a day
const TECH = "'Chakra Petch', sans-serif";
// Palette: the candelabra is teal-green with golden candles and a warm flame glow. Background family:
// candle-lit umber black (warm, low saturation); accent: candle gold; neutral: warm parchment;
// one extra hue: the candelabra's own teal, only for small labels. Gold and teal are split around the umber.
const UMBER = '#100b07';
const UMBER_LIGHT = '#24180e';
const GOLD = '#ffc95e';
const PARCH = '#f6ead2';
const TEAL = '#43c9a8';

const COLS = 50;
const ROWS = 20;
const PITCH = 16;
const GRID_X = 70;
const GRID_Y = 1205;
const COUNT_Y = 1062;

// Timeline (30 fps). Reading pace: 1.2 s + 0.4 s per word after each entrance.
const HOOK_END = 110; // 6 words, visible from frame 0 -> 3.7 s
const A = {start: 14, land: 92, to: 30}; // countdown 1000 -> 30 under the hook
const S1 = 110; // "Candelabra modeli / 30 tasi · 3%" (5 words) to 214
const S2 = 214; // "Belgisi-chi?" (1 word) to 272
const B = {relight: 214, start: 222, land: 268, to: 4};
const S3 = 272; // "Pawn belgisi / atigi 4 tasi · 0,4%" (6 words) to 388
const PRICE = 388; // "Ijarasi kuniga / 750 so‘m"
const BOT = 430;
const LINK = 466;
const FRAMES = 560; // 18.7 s

const useTech = () => {
  const [handle] = useState(() => delayRender('chakra'));
  useEffect(() => {
    document.fonts.load(`700 10px "Chakra Petch"`, 'NECHTASI 1000 so‘m O‘g‘').then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

const ease = Easing.bezier(0.2, 0.7, 0.25, 1);
/** How many dots are lit at frame f. */
const litCount = (f: number) => {
  if (f < B.relight) return Math.round(interpolate(f, [A.start, A.land], [1000, A.to], {...clamp, easing: ease}));
  if (f < B.start) return 1000;
  return Math.round(interpolate(f, [B.start, B.land], [1000, B.to], {...clamp, easing: ease}));
};

/** Candle-lit room: umber gradient, a warm pool of light behind the candles, embers drifting up. */
const Room: React.FC<{glow?: number}> = ({glow = 1}) => {
  const frame = useCurrentFrame();
  const flicker = 0.92 + 0.08 * Math.sin(frame / 3.1) * Math.sin(frame / 7.3);
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${UMBER} 0%, ${UMBER_LIGHT} 45%, ${UMBER} 100%)`}}>
      <AbsoluteFill style={{opacity: glow * flicker, background:
        `radial-gradient(ellipse 62% 30% at 44% 33%, rgba(255,186,84,.34), rgba(255,150,60,.08) 55%, transparent 75%)`}} />
      {Array.from({length: 30}, (_, i) => {
        const r = (k: string) => random(`ember-${i}-${k}`);
        const size = 3 + r('s') * 6;
        const y = H - ((r('y') * H + frame * (0.8 + r('v') * 1.6)) % (H + 40));
        const x = r('x') * W + Math.sin(frame / (24 + r('w') * 30) + i) * 24;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: '50%',
          background: GOLD, opacity: (0.12 + r('o') * 0.35) * (0.6 + 0.4 * Math.sin(frame / 6 + i)),
          boxShadow: `0 0 ${size * 2}px ${GOLD}`}} />;
      })}
    </AbsoluteFill>
  );
};

/** The 1000-dot grid. Each countdown switches dots off in its own random order. */
const Grid: React.FC<{frozen?: number; opacity?: number}> = ({frozen, opacity = 1}) => {
  const frame = useCurrentFrame();
  const ranks = useMemo(() => [0, 1].map((stage) => {
    const order = Array.from({length: 1000}, (_, i) => i).sort((a, b) => random(`r-${stage}-${a}`) - random(`r-${stage}-${b}`));
    const rank = new Array<number>(1000);
    order.forEach((dot, k) => { rank[dot] = k; });
    return rank;
  }), []);
  const count = frozen ?? litCount(frame);
  const stage = frozen !== undefined || frame >= B.relight ? 1 : 0;
  const sweep = frozen === undefined && frame >= B.relight && frame < B.start ? (frame - B.relight) / (B.start - B.relight) : 1;
  const final = frozen !== undefined || frame >= B.land;
  const pulse = final ? 1 + 0.18 * Math.sin((frame - B.land) / 4) : 1;
  return (
    <div style={{position: 'absolute', inset: 0, opacity}}>
      {Array.from({length: 1000}, (_, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        let on = ranks[stage][i] < count;
        if (sweep < 1) on = col / COLS < sweep;
        const rare = final && on;
        const size = rare ? 22 * pulse : 9;
        const cx = GRID_X + col * PITCH + PITCH / 2;
        const cy = GRID_Y + row * PITCH + PITCH / 2;
        return <div key={i} style={{position: 'absolute', left: cx - size / 2, top: cy - size / 2, width: size, height: size,
          borderRadius: '50%', zIndex: rare ? 2 : 1,
          background: on ? GOLD : 'rgba(246,234,210,.10)',
          boxShadow: rare ? `0 0 18px ${GOLD}, 0 0 44px rgba(255,201,94,.7)` : on ? '0 0 6px rgba(255,201,94,.55)' : 'none'}} />;
      })}
    </div>
  );
};

const Counter: React.FC<{value: string; opacity?: number; bump?: number}> = ({value, opacity = 1, bump = 0}) => (
  <div style={{position: 'absolute', left: GRID_X, top: COUNT_Y, display: 'flex', alignItems: 'baseline', gap: 18, opacity}}>
    <span style={{fontFamily: TECH, fontWeight: 700, fontSize: 132, lineHeight: 1, color: GOLD, fontVariantNumeric: 'tabular-nums',
      textShadow: '0 0 30px rgba(255,201,94,.35)', display: 'inline-block', transform: `scale(${1 + bump})`, transformOrigin: 'left bottom'}}>{value}</span>
    <span style={{fontFamily: TECH, fontWeight: 700, fontSize: 52, color: 'rgba(246,234,210,.55)'}}>/ 1000</span>
  </div>
);

/** A two-line headline block at the top. `*word*` is gold. Enters with a short slide, leaves with a fade. */
const Headline: React.FC<{lines: string[]; at: number; out?: number; size?: number; tag?: string}> =
  ({lines, at, out, size = 100, tag}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();
    if (frame < at || (out !== undefined && frame >= out + 6)) return null;
    const s = at === 0 ? 1 : spring({frame: frame - at, fps, config: {damping: 15, stiffness: 170}});
    const exit = out === undefined ? 0 : interpolate(frame, [out, out + 6], [0, 1], clamp);
    return (
      <div style={{position: 'absolute', left: 70, width: 820, top: 246, opacity: Math.min(1, s * 1.4) * (1 - exit),
        transform: `translateX(${(1 - s) * -60}px)`}}>
        {tag && <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 40, letterSpacing: 3, color: TEAL,
          textTransform: 'uppercase', marginBottom: 6}}>{tag}</div>}
        {lines.map((line, i) => (
          <div key={i} style={{fontFamily: TECH, fontWeight: 700, fontSize: size, lineHeight: 1.04, color: PARCH,
            textTransform: 'uppercase', textShadow: '0 8px 30px rgba(0,0,0,.6)', whiteSpace: 'nowrap'}}>
            {line.split(' ').map((raw, w) => (
              <span key={w} style={{color: raw.startsWith('*') ? GOLD : PARCH}}>{raw.replace(/\*/g, '')}{' '}</span>
            ))}
          </div>
        ))}
      </div>
    );
  };

/** The candelabra's own animation tilts it and blows the candles out, so hold its first, upright and lit pose. */
const Candles: React.FC<{data: GiftData; y: number; size: number}> = ({data, y, size}) => (
  <Freeze frame={0}><Gift data={data} x={470} y={y} size={size} /></Freeze>
);

const Video: React.FC = () => {
  useTech();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  const data = gifts[0];
  const count = litCount(frame);
  const landA = frame >= A.land ? Math.exp(-(frame - A.land) / 5) * 0.12 : 0;
  const landB = frame >= B.land ? Math.exp(-(frame - B.land) / 6) * 0.16 : 0;
  const outro = interpolate(frame, [PRICE - 6, PRICE + 8], [1, 0], clamp);
  const giftMove = spring({frame: frame - PRICE, fps, config: {damping: 16, stiffness: 100}});
  const giftY = interpolate(giftMove, [0, 1], [776, 800]);
  const giftSize = interpolate(giftMove, [0, 1], [780, 960]);
  const pill = spring({frame: frame - BOT, fps, config: {damping: 14, stiffness: 150}});
  const link = spring({frame: frame - LINK, fps, config: {damping: 14, stiffness: 150}});
  const glow = 1 + (frame >= B.land ? 0.35 : 0) + landB * 3;
  return (
    <AbsoluteFill>
      <Room glow={glow} />
      <Candles data={data} y={giftY} size={giftSize * (1 + landB * 0.4)} />

      <Headline at={0} out={HOOK_END} lines={['*1000* ta Chill', 'Flame’dan', 'nechtasi shunday?']} size={92} />
      <Headline at={S1} out={S2} tag="Candelabra modeli · 3%" lines={['*30* tasi']} size={128} />
      <Headline at={S2} out={S3} lines={['Belgisi-chi?']} size={128} />
      <Headline at={S3} out={PRICE - 6} tag="Pawn belgisi · 0,4%" lines={['atigi *4* tasi']} size={128} />
      <Headline at={PRICE} tag="Ijarasi kuniga" lines={['*750* so‘m']} size={150} />

      {frame < PRICE + 8 && <Grid opacity={outro} />}
      {frame < PRICE + 8 && <Counter value={String(count)} opacity={outro} bump={landA + landB} />}

      {frame >= BOT && (
        <div style={{position: 'absolute', left: 70, width: 800, top: 1240, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 20, padding: '14px 44px 14px 14px', borderRadius: 999,
            background: GOLD, boxShadow: '0 18px 60px rgba(255,170,60,.25), 0 18px 40px rgba(0,0,0,.5)',
            opacity: Math.min(1, pill * 1.5), transform: `scale(${0.7 + pill * 0.3})`}}>
            <Img src={staticFile('logo.png')} style={{width: 88, height: 88, borderRadius: '50%', background: BRAND.ink}} />
            <span style={{fontFamily: TECH, fontWeight: 700, fontSize: 50, color: UMBER}}>{BRAND.bot}</span>
          </div>
          {frame >= LINK && (
            <div style={{fontFamily: TECH, fontWeight: 700, fontSize: 54, color: PARCH, marginTop: 40, opacity: link,
              transform: `translateY(${(1 - link) * 30 - Math.sin(frame / 5) * 7 * link}px)`}}>↑ HAVOLA PROFILDA</div>
          )}
        </div>
      )}

      <Audio src={staticFile(`audio/bed_${ID}.wav`)} volume={(f) => interpolate(f, [0, 3, FRAMES - 24, FRAMES - 1], [0, 0.45, 0.45, 0], clamp)} />
      <Sequence from={A.start}><Audio src={staticFile('audio/ticks.wav')} volume={0.32} /></Sequence>
      <Sequence from={A.land}><Audio src={staticFile('audio/glass.wav')} volume={0.4} /></Sequence>
      <Sequence from={B.relight - 4}><Audio src={staticFile('audio/whoosh.wav')} volume={0.25} /></Sequence>
      <Sequence from={B.start}><Audio src={staticFile('audio/ticks.wav')} volume={0.32} /></Sequence>
      <Sequence from={B.land}><Audio src={staticFile('audio/bowl.wav')} volume={0.6} /></Sequence>
      <Sequence from={PRICE}><Audio src={staticFile('audio/impact.wav')} volume={0.22} /></Sequence>
      <Sequence from={BOT}><Audio src={staticFile('audio/pop.wav')} volume={0.35} /></Sequence>
    </AbsoluteFill>
  );
};

const Cover: React.FC = () => {
  useTech();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  return (
    <AbsoluteFill>
      <Room glow={1.2} />
      <Candles data={gifts[0]} y={820} size={800} />
      <Headline at={0} lines={['*1000* tadan', 'nechtasi', 'shunday?']} size={104} />
      <Grid frozen={4} />
      <Counter value="?" />
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
