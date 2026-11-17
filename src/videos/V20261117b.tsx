import '@fontsource/bricolage-grotesque/800.css';
import '@fontsource/bricolage-grotesque/600.css';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Freeze, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random,
  spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {BRAND, Gift, GiftData, H, W, clamp, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "Tashqarida +5°": a weather report that flips. Frame one is a cold, rainy November screen with a big
// "+5°" and the question "Profilingizda-chi?"; the Pool Float's own champagne pops at 1.1 s, the pool
// floods the frame from below and the thermometer runs up to +32°. Then rarity and price. Silent.
const ID = 'V20261117b';
const GIFT = 'poolfloat-125175'; // Disco model 2%, Old Gold backdrop 1.5%, Beanie symbol 0.5%; 750 so‘m a day
const FONT = "'Bricolage Grotesque', sans-serif";

// Palette: the float is ice-blue with iridescent tiles, the bottle green and gold. Background family:
// pool aqua (analogous to the float), with its own desaturated slate for the cold opening; accent: coral
// (complementary to aqua, echoing the float's pink sheen); neutral: foam white with a deep-teal ink.
const SLATE = '#2d3742';
const SLATE_DEEP = '#161d25';
const POOL_LIGHT = '#7fdde8';
const POOL = '#17a7be';
const POOL_DEEP = '#0a5d78';
const CORAL = '#ff6a55';
const FOAM = '#f4fbfb';
const INK = '#07303d';

// Timeline (30 fps). Reading pace: 1.2 s + 0.4 s per word after each entrance.
const GIFT_START = 60; // the gift's own animation from its upright pose; anticipation 84-90, cork at ~94
const POP = 34; // video frame of the cork
const FLOOD = {start: 36, end: 84}; // water rises over the frame
const TEMP = {start: 38, end: 84}; // +5 -> +32
const HOOK_END = 102; // "Tashqarida +5°. Profilingizda-chi?" 3 words, visible from frame 0 -> 3.4 s
const LABEL_SWAP = 66; // card label "Toshkent · noyabr" -> "Profilingizda"
const S1 = 108; // tag "Pool Float · Disco" + "Profilingizda yoz bo‘lsin" (6 words, 3.6 s) to 226
const S1_END = 226;
const ROW1 = 232; // "Disco modeli 2%" (3 words)
const ROW2 = 268; // "Beanie belgisi 0,5%" (3 words); both rest 3.6 s to 384
const S2_END = 382;
const PRICE = 388; // "3–30 kun ijara" + "Kuniga 750 so‘m"
const BOT = 426;
const LINK = 462;
const FRAMES = 570; // 19.0 s

const useFont = () => {
  const [handle] = useState(() => delayRender('bricolage'));
  useEffect(() => {
    Promise.all(['800 10px "Bricolage Grotesque"', '600 10px "Bricolage Grotesque"']
      .map((f) => document.fonts.load(f, 'Oʻg‘ +5° 750 so‘m')))
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

const ease = Easing.bezier(0.3, 0.6, 0.2, 1);
const waterLevel = (f: number) => interpolate(f, [FLOOD.start, FLOOD.end], [H + 80, -120], {...clamp, easing: ease});
const temperature = (f: number) => Math.round(interpolate(f, [TEMP.start, TEMP.end], [5, 32], {...clamp, easing: ease}));
const giftFrame = (f: number) => (f + GIFT_START <= 179 ? f + GIFT_START : 0);

/** Cold November: slate gradient, fog and diagonal rain. */
const Cold: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${SLATE_DEEP} 0%, ${SLATE} 48%, ${SLATE_DEEP} 100%)`}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 70% 40% at 45% 40%, rgba(170,190,205,.20), transparent 70%)'}} />
      {Array.from({length: 90}, (_, i) => {
        const r = (k: string) => random(`rain-${i}-${k}`);
        const len = 50 + r('l') * 90;
        const y = ((r('y') * (H + 200) + frame * (48 + r('v') * 30)) % (H + 200)) - 200;
        const x = r('x') * (W + 300) - 150 - (y * 0.18);
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: 3, height: len, borderRadius: 2,
          background: 'linear-gradient(180deg, rgba(210,225,235,0), rgba(210,225,235,.55))', opacity: 0.35 + r('o') * 0.5,
          transform: 'rotate(10deg)'}} />;
      })}
    </AbsoluteFill>
  );
};

/** The pool: aqua gradient, wobbling tile grid and moving caustic light. */
const Pool: React.FC = () => {
  const frame = useCurrentFrame();
  const f1 = 0.0055 + 0.0007 * Math.sin(frame / 23);
  const f2 = 0.009 + 0.0009 * Math.cos(frame / 29);
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${POOL_LIGHT} 0%, ${POOL} 42%, ${POOL_DEEP} 100%)`}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <pattern id="tiles" width={108} height={108} patternUnits="userSpaceOnUse">
            <rect x={0} y={0} width={108} height={108} fill="none" stroke="rgba(255,255,255,.20)" strokeWidth={5} />
          </pattern>
          <filter id="wobble" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency={`${f1} ${f2}`} numOctaves={2} seed={4} />
            <feDisplacementMap in="SourceGraphic" scale={46} />
          </filter>
          <filter id="caustic" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="turbulence" baseFrequency={`${0.011 + 0.0012 * Math.sin(frame / 19)} ${0.017 + 0.0012 * Math.cos(frame / 17)}`}
              numOctaves={1} seed={9} />
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -9 0 0 0 1.6" />
            <feGaussianBlur stdDeviation={2.2} />
          </filter>
        </defs>
        <rect x={-60} y={-60} width={W + 120} height={H + 120} fill="url(#tiles)" filter="url(#wobble)" />
        <rect x={0} y={0} width={W} height={H} filter="url(#caustic)" opacity={0.32} />
      </svg>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 34% at 70% 6%, rgba(255,246,220,.38), transparent 70%)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(7,48,61,.55) 0%, rgba(7,48,61,.25) 22%, rgba(7,48,61,0) 34%)'}} />
    </AbsoluteFill>
  );
};

/** The pool rises from below over the cold scene, with a foam line along its wavy surface. */
const Flood: React.FC<{level: number}> = ({level}) => {
  const frame = useCurrentFrame();
  if (level >= H + 60) return null;
  const points = Array.from({length: 25}, (_, i) => {
    const x = (i / 24) * W;
    return [x, level + Math.sin(i * 0.9 + frame / 4) * 26 + Math.sin(i * 0.37 - frame / 7) * 18];
  });
  const clip = `polygon(${points.map(([x, y]) => `${x}px ${y}px`).join(', ')}, ${W}px ${H}px, 0px ${H}px)`;
  const foam = 'M' + points.map(([x, y]) => `${x} ${y}`).join(' L');
  return (
    <>
      <AbsoluteFill style={{clipPath: clip}}><Pool /></AbsoluteFill>
      {level > -100 && (
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <path d={foam} stroke={FOAM} strokeWidth={14} fill="none" strokeLinecap="round" opacity={0.85} />
        </svg>
      )}
    </>
  );
};

/** Gift held at a chosen frame of its own animation; a gentle bob replaces the kit's float. */
const Float: React.FC<{data: GiftData; at: number; x: number; y: number; size: number; tilt?: number}> =
  ({data, at, x, y, size, tilt = 0}) => {
    const frame = useCurrentFrame();
    const bob = Math.sin(frame / 14) * 12;
    return (
      <div style={{position: 'absolute', inset: 0, transform: `translateY(${bob}px) rotate(${tilt + Math.sin(frame / 19) * 1.5}deg)`,
        transformOrigin: `${x}px ${y}px`}}>
        <Freeze frame={at}><Gift data={data} x={x} y={y} size={size} /></Freeze>
      </div>
    );
  };

/** The weather card: label, big temperature and a cloud that turns into a sun. */
const Weather: React.FC<{temp: number; label: string; warm: number; opacity?: number; y?: number}> =
  ({temp, label, warm, opacity = 1, y = 1190}) => {
    const frame = useCurrentFrame();
    return (
      <div style={{position: 'absolute', left: 70, width: 800, top: y, height: 300, borderRadius: 44, opacity,
        background: warm > 0.5 ? FOAM : 'rgba(18,26,34,.62)', border: `3px solid ${warm > 0.5 ? FOAM : 'rgba(235,242,247,.35)'}`,
        boxShadow: '0 30px 60px rgba(0,0,0,.28)', overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 48, top: 34, fontFamily: FONT, fontWeight: 600, fontSize: 40, letterSpacing: 2,
          textTransform: 'uppercase', color: warm > 0.5 ? POOL_DEEP : 'rgba(235,242,247,.8)'}}>{label}</div>
        <div style={{position: 'absolute', left: 40, top: 66, fontFamily: FONT, fontWeight: 800, fontSize: 210, lineHeight: 1,
          letterSpacing: -6, color: warm > 0.5 ? CORAL : FOAM, fontVariantNumeric: 'tabular-nums'}}>+{temp}°</div>
        <svg width={260} height={260} viewBox="0 0 260 260" style={{position: 'absolute', left: 520, top: 22}}>
          <g opacity={warm} transform={`rotate(${frame * 1.2} 130 130)`}>
            {Array.from({length: 12}, (_, i) => (
              <rect key={i} x={124} y={18} width={12} height={34} rx={6} fill={CORAL} transform={`rotate(${i * 30} 130 130)`} />
            ))}
            <circle cx={130} cy={130} r={62} fill={CORAL} />
          </g>
          <g opacity={1 - warm} transform={`translate(${Math.sin(frame / 9) * 6} 0)`}>
            <path d="M70 160 a42 42 0 0 1 10-82 a56 56 0 0 1 104 14 a36 36 0 0 1 6 72 z" fill="rgba(235,242,247,.85)" />
            {[0, 1, 2, 3].map((i) => {
              const dy = ((frame * 6 + i * 22) % 60);
              return <rect key={i} x={86 + i * 26} y={180 + dy} width={6} height={22} rx={3} fill="rgba(235,242,247,.8)"
                opacity={1 - dy / 60} transform={`rotate(12 ${89 + i * 26} ${190 + dy})`} />;
            })}
          </g>
        </svg>
      </div>
    );
  };

/** A headline that bobs up out of the water. `*word*` sits on a coral marker. */
const Headline: React.FC<{lines: string[]; at: number; out?: number; size?: number; tag?: string; top?: number}> =
  ({lines, at, out, size = 104, tag, top = 250}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();
    if (frame < at || (out !== undefined && frame >= out + 8)) return null;
    const s = at === 0 ? 1 : spring({frame: frame - at, fps, config: {damping: 9, stiffness: 120, mass: 0.8}});
    const exit = out === undefined ? 0 : interpolate(frame, [out, out + 8], [0, 1], clamp);
    return (
      <div style={{position: 'absolute', left: 70, right: 70, top, opacity: Math.min(1, s * 1.6) * (1 - exit),
        transform: `translateY(${(1 - s) * 90 + exit * 50}px)`}}>
        {tag && <div style={{display: 'inline-block', fontFamily: FONT, fontWeight: 600, fontSize: 40, letterSpacing: 2,
          textTransform: 'uppercase', color: INK, background: FOAM, padding: '8px 22px', borderRadius: 14, marginBottom: 18}}>{tag}</div>}
        {lines.map((line, i) => (
          <div key={i} style={{fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1.08, color: FOAM, letterSpacing: -2,
            textShadow: '0 6px 0 rgba(4,40,52,.35), 0 16px 40px rgba(4,40,52,.45)', whiteSpace: 'nowrap'}}>
            {line.split(' ').map((raw, w) => {
              const hot = raw.startsWith('*');
              const word = raw.replace(/\*/g, '');
              return (
                <React.Fragment key={w}>
                  {hot ? <span style={{background: CORAL, color: FOAM, padding: '0 16px', borderRadius: 18, textShadow: 'none',
                    boxDecorationBreak: 'clone'}}>{word}</span> : word}
                  {' '}
                </React.Fragment>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

/** A floating rarity row: name on the left, the share as a coral ring-buoy badge on the right. */
const Row: React.FC<{at: number; y: number; label: string; value: string; out: number}> = ({at, y, label, value, out}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < at || frame >= out + 8) return null;
  const s = spring({frame: frame - at, fps, config: {damping: 10, stiffness: 110, mass: 0.8}});
  const exit = interpolate(frame, [out, out + 8], [0, 1], clamp);
  const bob = Math.sin((frame - at) / 13 + y) * 6;
  return (
    <div style={{position: 'absolute', left: 70, width: 800, top: y + bob, height: 150, borderRadius: 75, background: FOAM,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 0 56px',
      boxShadow: '0 24px 50px rgba(4,40,52,.35)', opacity: Math.min(1, s * 1.6) * (1 - exit),
      transform: `translateX(${(1 - s) * -500}px) rotate(${(1 - s) * -4}deg)`}}>
      <span style={{fontFamily: FONT, fontWeight: 800, fontSize: 62, color: INK, letterSpacing: -1}}>{label}</span>
      <span style={{fontFamily: FONT, fontWeight: 800, fontSize: 64, color: FOAM, background: CORAL, borderRadius: 60,
        padding: '10px 34px', border: `8px solid ${FOAM}`, outline: `4px solid ${CORAL}`}}>{value}</span>
    </div>
  );
};

const Video: React.FC = () => {
  useFont();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  const data = gifts[0];
  const level = waterLevel(frame);
  const warm = interpolate(frame, [TEMP.start + 10, TEMP.end - 6], [0, 1], clamp);
  const cardOut = interpolate(frame, [HOOK_END, HOOK_END + 8], [1, 0], clamp);
  // The gift is the hero: large in the hook, larger still in the story, a little smaller next to the price.
  const grow = spring({frame: frame - HOOK_END, fps, config: {damping: 16, stiffness: 90}});
  const shrink = spring({frame: frame - PRICE, fps, config: {damping: 16, stiffness: 90}});
  const size = 1020 + grow * 220 - shrink * 200;
  const gy = 780 + grow * 40 - shrink * 30;
  const pill = spring({frame: frame - BOT, fps, config: {damping: 12, stiffness: 140}});
  const link = spring({frame: frame - LINK, fps, config: {damping: 14, stiffness: 150}});
  const priceIn = spring({frame: frame - PRICE, fps, config: {damping: 10, stiffness: 120, mass: 0.8}});
  return (
    <AbsoluteFill style={{background: SLATE_DEEP}}>
      {frame < FLOOD.end + 2 && <Cold />}
      <Flood level={level} />
      <Float data={data} at={giftFrame(frame)} x={540 - grow * 70} y={gy} size={size} />

      <Headline at={0} out={HOOK_END} lines={['Tashqarida +5°.', 'Profilingizda-chi?']} size={96} />
      {frame < HOOK_END + 8 && (
        <Weather temp={temperature(frame)} warm={warm} opacity={cardOut}
          label={frame < LABEL_SWAP ? 'Toshkent · noyabr' : 'Profilingizda'} />
      )}

      <Headline at={S1} out={S1_END} tag="Pool Float · Disco" lines={['Profilingizda', '*yoz* bo‘lsin']} size={116} />
      <Row at={ROW1} y={1190} label="Disco modeli" value="2%" out={S2_END} />
      <Row at={ROW2} y={1370} label="Beanie belgisi" value="0,5%" out={S2_END} />

      {frame >= PRICE && (
        <div style={{position: 'absolute', left: 70, width: 800, top: 1140, opacity: Math.min(1, priceIn * 1.6),
          transform: `translateY(${(1 - priceIn) * 90}px)`}}>
          <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 44, letterSpacing: 2, color: FOAM, textTransform: 'uppercase',
            textShadow: '0 4px 18px rgba(4,40,52,.5)'}}>3–30 kun ijara · kuniga</div>
          <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 150, lineHeight: 1.05, color: FOAM, letterSpacing: -4,
            textShadow: '0 8px 0 rgba(4,40,52,.3), 0 18px 44px rgba(4,40,52,.45)'}}>
            <span style={{background: CORAL, padding: '0 20px', borderRadius: 26, textShadow: 'none'}}>750</span> so‘m
          </div>
        </div>
      )}
      {frame >= BOT && (
        <div style={{position: 'absolute', left: 70, top: 1372, display: 'flex', alignItems: 'center', gap: 20,
          padding: '12px 40px 12px 12px', borderRadius: 999, background: FOAM, boxShadow: '0 18px 40px rgba(4,40,52,.4)',
          opacity: Math.min(1, pill * 1.5), transform: `scale(${0.7 + pill * 0.3})`, transformOrigin: 'left center'}}>
          <Img src={staticFile('logo.png')} style={{width: 84, height: 84, borderRadius: '50%', background: BRAND.ink}} />
          <span style={{fontFamily: FONT, fontWeight: 800, fontSize: 50, color: INK}}>{BRAND.bot}</span>
        </div>
      )}
      {frame >= LINK && (
        <div style={{position: 'absolute', left: 70, width: 800, top: 236, fontFamily: FONT, fontWeight: 800, fontSize: 60,
          color: INK, opacity: link, transform: `translateY(${(1 - link) * -30 - Math.sin(frame / 5) * 7 * link}px)`}}>
          <span style={{background: FOAM, padding: '10px 28px', borderRadius: 20}}>↑ Havola profilda</span>
        </div>
      )}

      <Audio src={staticFile(`audio/bed_${ID}.wav`)} volume={(f) => interpolate(f, [0, 3, FRAMES - 24, FRAMES - 1], [0, 0.42, 0.42, 0], clamp)} />
      <Audio src={staticFile('audio/rain.wav')} volume={(f) => interpolate(f, [0, 2, POP, FLOOD.end], [0, 0.5, 0.5, 0], clamp)} />
      <Sequence from={POP - 2}><Audio src={staticFile('audio/cork.wav')} volume={0.75} /></Sequence>
      <Sequence from={FLOOD.start + 4}><Audio src={staticFile('audio/splash.wav')} volume={0.55} /></Sequence>
      <Sequence from={TEMP.end - 2}><Audio src={staticFile('audio/sparkle.wav')} volume={0.3} /></Sequence>
      <Sequence from={ROW1}><Audio src={staticFile('audio/bubble.wav')} volume={0.4} /></Sequence>
      <Sequence from={ROW2}><Audio src={staticFile('audio/bubble.wav')} volume={0.4} /></Sequence>
      <Sequence from={PRICE}><Audio src={staticFile('audio/splash.wav')} volume={0.35} /></Sequence>
      <Sequence from={BOT}><Audio src={staticFile('audio/pop.wav')} volume={0.35} /></Sequence>
    </AbsoluteFill>
  );
};

const Cover: React.FC = () => {
  useFont();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  return (
    <AbsoluteFill>
      <Pool />
      <Float data={gifts[0]} at={0} x={540} y={830} size={1180} />
      <Headline at={0} lines={['Tashqarida +5°.', 'Profilingizda-chi?']} size={96} />
      <Weather temp={32} warm={1} label="Profilingizda" />
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
