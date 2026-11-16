import '@fontsource/jetbrains-mono/800.css';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Freeze, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {BODY, BRAND, Gift, GiftData, H, W, clamp, useGifts} from '../kit';

/** The bells' own animation turns them sideways and shrinks them, so hold its first, front-facing pose. */
const Bells: React.FC<{data: GiftData; y: number; size: number; rotate?: number; scale?: number}> = ({data, y, size, rotate = 0, scale = 1}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translateY(${Math.sin(frame / 17) * 10}px)`}}>
      <div style={{position: 'absolute', inset: 0, transformOrigin: `470px ${y - size * 0.25}px`, transform: `rotate(${rotate}deg) scale(${scale})`}}>
        <Freeze frame={0}><Gift data={data} x={470} y={y} size={size} glow={false} /></Freeze>
      </div>
    </div>
  );
};
import type {CustomVideo} from './registry';

// "Tablo": a split-flap departure board answers one question at a time. Frame one already asks
// "KUNIGA QANCHA?" while the price row clatters; it lands on the real price at 2 s. Silent, own music.
const ID = 'V20261116e';
const GIFT = 'jinglebells-64028'; // Blue Sapphire model, 0.3%; 1 000 so‘m a day
const MONO = "'JetBrains Mono', monospace";
// Palette: the gift is electric blue and silver. Background family: midnight navy (analogous to the gift);
// accent: amber, its complement, as the board's letters; neutral: ice white. Tiles are a darker navy-graphite.
const NAVY = '#0b1526';
const NAVY_LIGHT = '#16294a';
const TILE = '#1a2232';
const TILE_TOP = '#212b3d';
const AMBER = '#ffb43c';
const ICE = '#e9f1fa';
const BLUE = '#2f9bff';

const COLS = 10;
const ROWS = 3;
const PITCH = 94; // cell pitch; tiles are 86 x 128
const ROW_PITCH = 142;
const BOARD_X = 70;
const BOARD_Y = 300;
const CHARS = 'ABDEGIKLMNOPQRSTUVXYZ0123456789?';
const DIGITS = '0123456789';

type Message = {at: number; rows: [string, string, string]};
// Reading pace: each message rests fully visible >= 1.2 s + 0.4 s per word after its flaps settle (~27 frames).
const MESSAGES: Message[] = [
  {at: 0, rows: ['KUNIGA', 'QANCHA?', '1 000 SO‘M']}, // question visible from frame 0, price lands ~frame 64
  {at: 150, rows: ['SOTIB', 'OLISH', 'SHART EMAS']}, // settled ~177, holds to 264 (2.9 s, 4 words)
  {at: 264, rows: ['3–30 KUN', 'PROFILDA', 'TURADI']}, // settled ~291, holds to 378 (2.9 s, 4 words)
  {at: 378, rows: ['IJARA', 'KUNIGA', '1 000 SO‘M']}, // settled ~405, holds to the end (4.1 s)
];
const PRICE_AT = 52; // the price row keeps spinning until here in the opening
const CTA = 378;
const FRAMES = 528; // 17.6 s

const useMono = () => {
  const [handle] = useState(() => delayRender('mono'));
  useEffect(() => {
    document.fonts.load('800 10px "JetBrains Mono"', 'KUNIGA 1 000 SO‘M 3–30?').then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

const cellChar = (text: string, c: number) => (text.padEnd(COLS, ' ')[c] ?? ' ');

/** What one cell shows at frame f: settled character, or a spinning one with a flap phase. */
const cellState = (f: number, r: number, c: number) => {
  let index = 0;
  for (let i = 0; i < MESSAGES.length; i++) if (f >= MESSAGES[i].at) index = i;
  const msg = MESSAGES[index];
  const target = cellChar(msg.rows[r], c);
  const prev = index > 0 ? cellChar(MESSAGES[index - 1].rows[r], c) : ' ';
  let start = msg.at + r * 2 + c;
  let spin = 8 + Math.floor(random(`spin-${index}-${r}-${c}`) * 7);
  if (index === 0) { // opening: rows 1-2 are already set on frame 0; the price row spins
    if (r < 2 || c >= 5) return {ch: target, spinning: false, phase: 0}; // "SO‘M" is set from frame 0
    start = 0;
    spin = PRICE_AT + c * 1.4 - start;
  }
  if (target === prev && target === ' ' && index > 0) return {ch: ' ', spinning: false, phase: 0};
  if (f < start) return {ch: prev, spinning: false, phase: 0};
  if (f >= start + spin) return {ch: target, spinning: false, phase: 0, landed: f - (start + spin)};
  const pool = index === 0 ? DIGITS : CHARS; // the opening price row spins through digits only
  const ch = pool[Math.floor(random(`ch-${r}-${c}-${Math.floor(f / 2)}`) * pool.length)];
  return {ch, spinning: true, phase: f % 2};
};

const Tile: React.FC<{x: number; y: number; r: number; c: number; frozen?: string}> = ({x, y, r, c, frozen}) => {
  const frame = useCurrentFrame();
  const state = frozen === undefined ? cellState(frame, r, c) : {ch: frozen, spinning: false, phase: 0};
  const landed = 'landed' in state && state.landed !== undefined ? state.landed : 99;
  const bump = landed < 6 ? Math.sin((landed / 6) * Math.PI) * 5 : 0;
  const glyph = (
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: MONO, fontWeight: 800, fontSize: 108, lineHeight: 1, color: AMBER,
      textShadow: `0 0 18px rgba(255,180,60,.35)`, transform: `translateY(${bump}px)`}}>{state.ch}</div>
  );
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 86, height: 128, borderRadius: 10, overflow: 'hidden',
      background: `linear-gradient(180deg, ${TILE_TOP} 0%, ${TILE_TOP} 50%, ${TILE} 50%, ${TILE} 100%)`,
      boxShadow: 'inset 0 2px 0 rgba(255,255,255,.07), 0 6px 0 #070c15'}}>
      {glyph}
      {/* the flap falling over the top half while the cell spins */}
      {state.spinning && (
        <div style={{position: 'absolute', left: 0, right: 0, top: state.phase ? 0 : 64, height: 64,
          background: state.phase ? 'rgba(10,16,26,.55)' : 'rgba(255,255,255,.06)'}} />
      )}
      <div style={{position: 'absolute', left: 0, right: 0, top: 63, height: 3, background: '#05080e'}} />
      <div style={{position: 'absolute', left: -2, top: 56, width: 6, height: 16, borderRadius: 3, background: '#3a4458'}} />
      <div style={{position: 'absolute', right: -2, top: 56, width: 6, height: 16, borderRadius: 3, background: '#3a4458'}} />
    </div>
  );
};

const Board: React.FC<{frozen?: [string, string, string]}> = ({frozen}) => (
  <>
    <div style={{position: 'absolute', left: BOARD_X - 26, top: BOARD_Y - 26, width: COLS * PITCH - 8 + 52,
      height: ROWS * ROW_PITCH - 14 + 52, borderRadius: 28, background: '#070d18',
      boxShadow: `0 30px 80px rgba(0,0,0,.55), inset 0 0 0 3px #1f2b40`}} />
    {Array.from({length: ROWS}, (_, r) => Array.from({length: COLS}, (_, c) => (
      <Tile key={`${r}-${c}`} x={BOARD_X + c * PITCH} y={BOARD_Y + r * ROW_PITCH} r={r} c={c}
        frozen={frozen ? cellChar(frozen[r], c) : undefined} />
    )))}
  </>
);

/** Midnight station: navy gradient, a soft blue pool of light under the gift, slow falling snow. */
const Night: React.FC<{glowY: number}> = ({glowY}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_LIGHT} 62%, ${NAVY} 100%)`}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 48% 22% at 44% ${glowY / H * 100}%, rgba(47,155,255,.42), transparent 72%)`}} />
      {Array.from({length: 46}, (_, i) => {
        const rr = (k: string) => random(`snow-${i}-${k}`);
        const size = 4 + rr('s') * 9;
        const y = ((rr('y') * H + frame * (1.2 + rr('v') * 2.4)) % (H + 40)) - 20;
        const x = rr('x') * W + Math.sin(frame / (30 + rr('w') * 40) + i) * 30;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: '50%',
          background: ICE, opacity: 0.18 + rr('o') * 0.35}} />;
      })}
    </AbsoluteFill>
  );
};

const Header: React.FC = () => (
  <div style={{position: 'absolute', left: BOARD_X, top: 228, fontFamily: BODY, fontWeight: 800, fontSize: 32, letterSpacing: 5,
    textTransform: 'uppercase', color: ICE, display: 'flex', alignItems: 'center', gap: 16}}>
    <span style={{width: 16, height: 16, borderRadius: '50%', background: AMBER, boxShadow: `0 0 14px ${AMBER}`}} />
    Jingle Bells · <span style={{color: AMBER}}>0,3%</span> noyob model
  </div>
);

const Video: React.FC = () => {
  useMono();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  const data: GiftData = gifts[0];
  // The bells ring (a short swing) each time a message lands.
  const lands = [PRICE_AT + 12, 177, 291, 405];
  const ring = lands.reduce((sum, at) => sum + (frame >= at ? Math.sin((frame - at) / 2.2) * 9 * Math.exp(-(frame - at) / 9) : 0), 0);
  const move = spring({frame: frame - CTA, fps, config: {damping: 16, stiffness: 110}});
  const giftY = interpolate(move, [0, 1], [1160, 1010]);
  const giftSize = interpolate(move, [0, 1], [1100, 760]);
  const punch = lands.reduce((sum, at) => sum + (frame >= at ? 0.06 * Math.exp(-(frame - at) / 5) : 0), 0);
  const pill = spring({frame: frame - (CTA + 30), fps, config: {damping: 14, stiffness: 150}});
  const link = spring({frame: frame - (CTA + 42), fps, config: {damping: 14, stiffness: 150}});
  const priceFlash = interpolate(frame, [PRICE_AT + 12, PRICE_AT + 14, PRICE_AT + 30], [0, 0.5, 0], clamp);
  return (
    <AbsoluteFill>
      <Night glowY={giftY + giftSize * 0.2} />
      <Header />
      <Board />
      <div style={{position: 'absolute', left: BOARD_X - 26, top: BOARD_Y + 2 * ROW_PITCH - 10, width: COLS * PITCH + 44, height: 148,
        borderRadius: 18, background: AMBER, opacity: priceFlash, mixBlendMode: 'screen'}} />
      <Bells data={data} y={giftY} size={giftSize} rotate={ring} scale={1 + punch} />

      {frame >= CTA + 20 && (
        <div style={{position: 'absolute', left: 70, width: 800, top: 1300, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 20, padding: '14px 42px 14px 14px', borderRadius: 999,
            background: AMBER, boxShadow: '0 18px 50px rgba(0,0,0,.45)', opacity: Math.min(1, pill * 1.5),
            transform: `scale(${0.7 + pill * 0.3})`}}>
            <Img src={staticFile('logo.png')} style={{width: 84, height: 84, borderRadius: '50%', background: BRAND.ink}} />
            <span style={{fontFamily: BODY, fontWeight: 800, fontSize: 46, color: NAVY}}>{BRAND.bot}</span>
          </div>
          <div style={{fontFamily: MONO, fontWeight: 800, fontSize: 50, color: ICE, marginTop: 34, opacity: link,
            transform: `translateY(${(1 - link) * 30 - Math.sin(frame / 5) * 7 * link}px)`}}>↑ HAVOLA PROFILDA</div>
        </div>
      )}

      <Audio src={staticFile(`audio/bed_${ID}.wav`)} volume={(f) => interpolate(f, [0, 3, FRAMES - 24, FRAMES - 1], [0, 0.42, 0.42, 0], clamp)} />
      <Audio src={staticFile('audio/flaps.wav')} volume={0.55} />
      <Sequence from={PRICE_AT + 12}><Audio src={staticFile('audio/chime.wav')} volume={0.5} /></Sequence>
      {MESSAGES.slice(1).map((m) => (
        <Sequence key={m.at} from={m.at}><Audio src={staticFile('audio/flaps.wav')} volume={0.5} /></Sequence>
      ))}
      <Sequence from={405}><Audio src={staticFile('audio/chime.wav')} volume={0.4} /></Sequence>
      <Sequence from={CTA + 30}><Audio src={staticFile('audio/pop.wav')} volume={0.4} /></Sequence>
    </AbsoluteFill>
  );
};

const Cover: React.FC = () => {
  useMono();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  return (
    <AbsoluteFill>
      <Night glowY={1380} />
      <Header />
      <Board frozen={['KUNIGA', 'QANCHA?', '? ??? SO‘M']} />
      <Bells data={gifts[0]} y={1160} size={1100} />
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
