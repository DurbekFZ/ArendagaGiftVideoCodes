// This package's exports map adds `.css` itself and ships no type declarations.
// @ts-ignore
import '@fontsource/bungee/400';
import {Lottie} from '@remotion/lottie';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Freeze, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random,
  spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {BRAND, GiftData, H, W, clamp, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "MUZQAYMOQ AVTOMATI" — a flat 2D vending machine. The Vice Cream gift (model "Vanilla") is a blue snack packet
// whose own animation tears it open and reveals a glowing waffle cone. Frame one: the whole machine, its marquee
// already reads "Telegram NFT sovg‘a · Ijara · kuniga 750 so‘m", a coin drops in and the packet in the glass
// shakes; at 0.9 s it bursts open ("Ichida — muzqaymoq!"). Then the slot labels list its rarity (model 2%,
// backdrop 1.5%, symbol 0.4%), then "3–30 kunga ijara · profilingizda turadi", the bot and the link. Silent, calm pad.
const ID = 'V20261119a';
const GIFT = 'vicecream-405492'; // Vanilla model 2%, Strawberry backdrop 1.5%, Bamboo symbol 0.4%; 750 so‘m a day
const SIGN = "'Bungee', sans-serif";
const SANS = "'Manrope', sans-serif";
// Bungee's ‘ sits wide; pull it in so "SO‘M" reads as one word.
const Q: React.FC = () => <span style={{margin: '0 -0.08em 0 -0.04em'}}>‘</span>;

// Palette. Background family: the gift's own Strawberry backdrop (#dd8e6f / #b75a60 / #a90c0c), as a strawberry
// machine in a dark berry room. Accent: the packet's own blue (split-complementary to the strawberry red).
// Neutrals: vanilla cream (the ice cream itself) and a berry ink. Extra hue, used sparingly: the waffle-cone amber.
const ROOM_HI = '#5a1830';
const ROOM = '#2c0b18';
const ROOM_LO = '#16040b';
const BODY_HI = '#ec6f86';
const BODY = '#d24a66';
const BODY_LO = '#a4304c';
const BLUE = '#3f7cf2';
const BLUE_DEEP = '#1f4fc4';
const CREAM = '#fff1e2';
const INK = '#2b0a15';
const AMBER = '#f6ad4a';

// Machine geometry.
const MX = 40;
const MY = 110;
const MW = 1000;
const MH = 1760;
const GLASS = {x: 80, y: 600, w: 760, h: 960};
const PANEL = {x: 862, y: 600, w: 138, h: 960};

// Timeline (30 fps).
const GIFT_OFFSET = 36; // the packet bursts at gift frame ~62, i.e. video frame ~26 (0.9 s)
const HOLD_FROM = 78; // gift frame 114: upright cone facing the viewer, then a slow sway between 104 and 124
const COIN = 2;
const FOIL = 17;
const INSIDE_IN = 54; // "Ichida — muzqaymoq!"
const A_OUT = 180; // 6.0 s
const ROWS = [192, 234, 276]; // 6.4, 7.8, 9.2 s
const B_OUT = 375; // 12.5 s
const C_TERM = 386; // "3–30 kunga ijara · profilingizda turadi"
const C_CTA = 424; // 14.1 s
const FRAMES = 570; // 19.0 s

const useFonts = () => {
  const [handle] = useState(() => delayRender('bungee'));
  useEffect(() => {
    document.fonts.load(`400 10px "Bungee"`, '750 SO‘M ICHIDA MUZQAYMOQ 3–30 KUNGA IJARA 2% 1,5% 0,4%')
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

const ease = Easing.bezier(0.6, 0.02, 0.25, 1);
const out3 = Easing.out(Easing.cubic);
const popIn = (frame: number, fps: number, at: number) =>
  spring({frame: frame - at, fps, config: {damping: 14, stiffness: 180, mass: 0.7}});

/** Which frame of the gift's own animation to show: shake, burst, then a gentle sway on the front-facing cone. */
const giftFrame = (frame: number) => {
  if (frame < HOLD_FROM) return frame + GIFT_OFFSET;
  const t = (frame - HOLD_FROM) / 70;
  return Math.round(114 + Math.sin(t * Math.PI) * 10);
};

/** Dark berry room: soft light behind the machine, the gift's pattern faintly on the wall. */
const Room: React.FC<{data: GiftData}> = ({data}) => {
  const frame = useCurrentFrame();
  const size = 2200;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 60% at 50% 42%, ${ROOM_HI} 0%, ${ROOM} 55%, ${ROOM_LO} 100%)`}}>
      <div style={{position: 'absolute', left: W / 2 - size / 2, top: 900 - size / 2, width: size, height: size, opacity: 0.1,
        transform: `rotate(${frame * 0.03}deg)`, WebkitMaskImage: 'radial-gradient(circle, #000 20%, transparent 70%)'}}>
        <Lottie animationData={data.pattern} playbackRate={0.0001} style={{width: size, height: size}} />
      </div>
    </AbsoluteFill>
  );
};

/** Chasing marquee bulbs around a rectangle. */
const Bulbs: React.FC<{x: number; y: number; w: number; h: number}> = ({x, y, w, h}) => {
  const frame = useCurrentFrame();
  const step = 46;
  const points: [number, number][] = [];
  for (let i = 0; i <= Math.round(w / step); i++) points.push([x + (i * w) / Math.round(w / step), y]);
  for (let i = 1; i <= Math.round(h / step); i++) points.push([x + w, y + (i * h) / Math.round(h / step)]);
  for (let i = Math.round(w / step) - 1; i >= 0; i--) points.push([x + (i * w) / Math.round(w / step), y + h]);
  for (let i = Math.round(h / step) - 1; i >= 1; i--) points.push([x, y + (i * h) / Math.round(h / step)]);
  const phase = Math.floor(frame / 5);
  return (
    <>
      {points.map(([px, py], i) => {
        const on = (i + phase) % 3 === 0;
        return (
          <div key={i} style={{position: 'absolute', left: px - 9, top: py - 9, width: 18, height: 18, borderRadius: '50%',
            background: on ? '#fff6d8' : '#e8a24e', opacity: on ? 1 : 0.55,
            boxShadow: on ? `0 0 16px 5px rgba(246,173,74,.75)` : 'none'}} />
        );
      })}
    </>
  );
};

/** A spiral coil on a shelf, drawn flat. */
const Coil: React.FC<{x: number; y: number; w: number}> = ({x, y, w}) => {
  const turns = 9;
  const d = Array.from({length: turns * 16 + 1}, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return `${i === 0 ? 'M' : 'L'} ${x + (i / (turns * 16)) * w} ${y + Math.sin(a) * 22}`;
  }).join(' ');
  return <path d={d} stroke="#c9a2ad" strokeWidth={6} fill="none" opacity={0.55} strokeLinecap="round" />;
};

/** The machine: strawberry body, cream marquee panel with bulbs, glass window, keypad column and pickup tray. */
const Machine: React.FC<{lower: number}> = ({lower}) => {
  const frame = useCurrentFrame();
  const coinY = interpolate(frame, [COIN, COIN + 10], [-40, 70], {...clamp, easing: Easing.in(Easing.quad)});
  const coinGone = frame > COIN + 10;
  return (
    <>
      <div style={{position: 'absolute', left: MX + 30, top: MY + MH - 30, width: MW - 60, height: 80, borderRadius: '50%',
        background: 'rgba(0,0,0,.45)', filter: 'blur(24px)'}} />
      <div style={{position: 'absolute', left: MX, top: MY, width: MW, height: MH, borderRadius: 64,
        background: `linear-gradient(90deg, ${BODY_LO} 0%, ${BODY} 9%, ${BODY_HI} 50%, ${BODY} 91%, ${BODY_LO} 100%)`,
        boxShadow: `inset 0 10px 0 rgba(255,255,255,.18), inset 0 -14px 0 rgba(0,0,0,.18)`}} />
      {/* marquee panel */}
      <div style={{position: 'absolute', left: 80, top: 190, width: 920, height: 370, borderRadius: 40, background: CREAM,
        boxShadow: `inset 0 -8px 0 rgba(43,10,21,.12)`}} />
      <Bulbs x={80} y={190} w={920} h={370} />
      {/* glass */}
      <div style={{position: 'absolute', left: GLASS.x - 10, top: GLASS.y - 10, width: GLASS.w + 20, height: GLASS.h + 20, borderRadius: 40,
        background: BODY_LO}} />
      <div style={{position: 'absolute', left: GLASS.x, top: GLASS.y, width: GLASS.w, height: GLASS.h, borderRadius: 32, overflow: 'hidden',
        background: `linear-gradient(180deg, #4a1428 0%, #2a0915 100%)`}}>
        <svg width={GLASS.w} height={GLASS.h} style={{position: 'absolute', left: 0, top: 0}}>
          {[300, 640, 940].map((y) => (
            <g key={y} opacity={y > 400 ? lower : 1}>
              <rect x={0} y={y + 24} width={GLASS.w} height={14} fill="#1a050c" opacity={0.7} />
              <Coil x={40} y={y} w={GLASS.w - 80} />
            </g>
          ))}
        </svg>
      </div>
      {/* keypad column (decoration) */}
      <div style={{position: 'absolute', left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h, borderRadius: 28,
        background: BODY_LO, boxShadow: 'inset 0 6px 0 rgba(0,0,0,.15)'}} />
      <div style={{position: 'absolute', left: PANEL.x + 20, top: PANEL.y + 30, width: PANEL.w - 40, height: 70, borderRadius: 12,
        background: '#14203d', boxShadow: `inset 0 0 14px rgba(63,124,242,.6)`}} />
      {Array.from({length: 9}, (_, i) => (
        <div key={i} style={{position: 'absolute', left: PANEL.x + 22 + (i % 3) * 32, top: PANEL.y + 132 + Math.floor(i / 3) * 34,
          width: 24, height: 24, borderRadius: 7, background: CREAM, opacity: 0.85}} />
      ))}
      <div style={{position: 'absolute', left: PANEL.x + 52, top: PANEL.y + 290, width: 34, height: 110, borderRadius: 17,
        background: INK, overflow: 'hidden'}}>
        {!coinGone && <div style={{position: 'absolute', left: 3, top: coinY, width: 28, height: 28, borderRadius: '50%', background: AMBER}} />}
      </div>
      {/* pickup tray */}
      <div style={{position: 'absolute', left: 80, top: 1612, width: 760, height: 190, borderRadius: 30, background: BODY_LO}} />
      <div style={{position: 'absolute', left: 110, top: 1640, width: 700, height: 130, borderRadius: 20, background: '#1a050c'}} />
      {/* coin about to drop, above the slot */}
      {frame < COIN + 10 && (
        <div style={{position: 'absolute', left: PANEL.x + 55, top: PANEL.y + 290 + Math.min(coinY, 0) - 10, width: 28, height: 28,
          borderRadius: '50%', background: AMBER, opacity: coinY < 0 ? 1 : 0, boxShadow: '0 4px 0 #b9741f'}} />
      )}
    </>
  );
};

/** Glass reflections drawn over everything inside the window. */
const Shine: React.FC = () => {
  const frame = useCurrentFrame();
  const sweep = ((frame * 6) % 2400) - 600;
  return (
    <div style={{position: 'absolute', left: GLASS.x, top: GLASS.y, width: GLASS.w, height: GLASS.h, borderRadius: 32, overflow: 'hidden',
      pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: -200, top: -100, width: 260, height: 1400, transform: 'rotate(24deg)',
        background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.07), rgba(255,255,255,0))'}} />
      <div style={{position: 'absolute', left: sweep, top: -300, width: 120, height: 1700, transform: 'rotate(24deg)',
        background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.06), rgba(255,255,255,0))'}} />
    </div>
  );
};

/** The marquee text: what it is and what it costs. Constant through the whole video. */
const Marquee: React.FC = () => (
  <>
    <div style={{position: 'absolute', left: 130, top: 238, display: 'flex', alignItems: 'center', gap: 18}}>
      <div style={{background: INK, color: CREAM, fontFamily: SANS, fontWeight: 800, fontSize: 34, letterSpacing: 3,
        padding: '9px 24px 11px', borderRadius: 999}}>TELEGRAM NFT SOVG‘A</div>
    </div>
    <div style={{position: 'absolute', left: 132, top: 318, fontFamily: SANS, fontWeight: 800, fontSize: 52, color: BODY_LO, lineHeight: 1}}>
      Ijara · kuniga</div>
    <div style={{position: 'absolute', left: 122, top: 374, fontFamily: SIGN, fontSize: 166, color: INK, lineHeight: 1, whiteSpace: 'nowrap',
      letterSpacing: -2}}>
      750 <span style={{color: BLUE_DEEP}}>SO<Q />M</span></div>
  </>
);

/** The gift with its own animation driven to a chosen frame. x, y = box centre. */
const Packet: React.FC<{data: GiftData; x: number; y: number; size: number; at: number; shake: number}> =
  ({data, x, y, size, at, shake}) => {
    const frame = useCurrentFrame();
    const jitter = Math.sin(frame * 2.1) * 7 * shake;
    const bob = Math.sin(frame / 20) * 6 * (1 - shake);
    return (
      <div style={{position: 'absolute', left: x - size / 2 + jitter, top: y - size / 2 + bob, width: size, height: size,
        filter: 'drop-shadow(0 30px 34px rgba(10,0,4,.55))'}}>
        <Freeze frame={at}>
          <Lottie animationData={data.gift} style={{width: size, height: size}} />
        </Freeze>
      </div>
    );
  };

/** A soft burst of light and a few cream, blue and amber flakes when the packet tears open. */
const Burst: React.FC<{x: number; y: number}> = ({x, y}) => {
  const frame = useCurrentFrame();
  const at = 26;
  const t = (frame - at) / 26;
  if (t < 0 || t > 1.6) return null;
  const glow = interpolate(t, [0, 0.15, 1.6], [0, 0.85, 0], clamp);
  return (
    <>
      <div style={{position: 'absolute', left: x - 420, top: y - 420, width: 840, height: 840, borderRadius: '50%', opacity: glow,
        background: 'radial-gradient(circle, rgba(255,236,190,.9) 0%, rgba(246,173,74,.35) 35%, rgba(246,173,74,0) 70%)'}} />
      {Array.from({length: 16}, (_, i) => {
        const r = (k: string) => random(`flake-${i}-${k}`);
        const a = r('a') * Math.PI * 2;
        const dist = (150 + r('d') * 260) * out3(Math.min(1, t));
        const s = 14 + r('s') * 16;
        const color = [CREAM, BLUE, AMBER][i % 3];
        return (
          <div key={i} style={{position: 'absolute', left: x + Math.cos(a) * dist - s / 2, top: y + Math.sin(a) * dist + t * t * 90 - s / 2,
            width: s, height: s * 0.6, borderRadius: 4, background: color, opacity: interpolate(t, [0, 0.1, 1.1, 1.6], [0, 1, 1, 0], clamp),
            transform: `rotate(${r('r') * 360 + frame * 9}deg)`}} />
        );
      })}
    </>
  );
};

const Sticker: React.FC<{enter: number; leave: number}> = ({enter, leave}) => (
  <div style={{position: 'absolute', left: 112, top: 636, opacity: Math.min(1, enter * 2) * (1 - leave),
    transform: `rotate(-4deg) scale(${(0.6 + 0.4 * enter) * (1 - leave * 0.2)})`, transformOrigin: '20% 50%'}}>
    <div style={{background: CREAM, borderRadius: 26, padding: '16px 30px 18px', boxShadow: `0 10px 0 ${BLUE_DEEP}`}}>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 44, color: BODY_LO, lineHeight: 1}}>Ichida —</div>
      <div style={{fontFamily: SIGN, fontSize: 70, color: INK, lineHeight: 1.08, whiteSpace: 'nowrap'}}>MUZQAYMOQ!</div>
    </div>
  </div>
);

/** Slot labels: code tag, attribute, rarity. */
const Row: React.FC<{y: number; code: string; label: string; value: string; enter: number; leave: number}> =
  ({y, code, label, value, enter, leave}) => (
    <div style={{position: 'absolute', left: 110, top: y, width: 700, height: 112, opacity: Math.min(1, enter * 2) * (1 - leave),
      transform: `translateX(${(1 - enter) * -80 + leave * -120}px)`, display: 'flex', alignItems: 'center', borderRadius: 22,
      background: CREAM, boxShadow: `0 8px 0 rgba(0,0,0,.35)`}}>
      <div style={{width: 112, height: 112, borderRadius: '22px 0 0 22px', background: BLUE, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontFamily: SIGN, fontSize: 44, color: CREAM}}>{code}</div>
      <div style={{flex: 1, paddingLeft: 26, fontFamily: SANS, fontWeight: 800, fontSize: 46, color: INK, whiteSpace: 'nowrap'}}>{label}</div>
      <div style={{paddingRight: 28, fontFamily: SIGN, fontSize: 56, color: BODY_LO, whiteSpace: 'nowrap'}}>{value}</div>
    </div>
  );

const Terms: React.FC<{term: number; cta: number}> = ({term, cta}) => {
  const frame = useCurrentFrame();
  return (
    <>
      <div style={{position: 'absolute', left: 110, top: 1050, opacity: Math.min(1, term * 2), transform: `translateY(${(1 - term) * 40}px)`}}>
        <div style={{fontFamily: SIGN, fontSize: 74, color: CREAM, lineHeight: 1, whiteSpace: 'nowrap'}}>
          3–30 <span style={{color: AMBER}}>KUNGA</span> IJARA</div>
        <div style={{marginTop: 18, fontFamily: SANS, fontWeight: 800, fontSize: 50, color: CREAM, opacity: 0.9}}>profilingizda turadi</div>
      </div>
      {cta > 0 && (
        <div style={{position: 'absolute', left: 110, top: 1268, opacity: Math.min(1, cta * 2), transform: `translateY(${(1 - cta) * 40}px)`}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 18, padding: '12px 36px 12px 12px', borderRadius: 999,
            background: BLUE, boxShadow: `0 8px 0 ${BLUE_DEEP}`}}>
            <Img src={staticFile('logo.png')} style={{width: 80, height: 80, borderRadius: '50%', background: BRAND.ink}} />
            <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 46, color: '#ffffff'}}>{BRAND.bot}</span>
          </div>
          <div style={{marginTop: 22, fontFamily: SANS, fontWeight: 800, fontSize: 52, color: CREAM,
            transform: `translateY(${-Math.abs(Math.sin(frame / 7)) * 8}px)`}}>↑ Havola profilda</div>
        </div>
      )}
    </>
  );
};

const Scene: React.FC<{data: GiftData; frame: number; still?: boolean}> = ({data, frame, still}) => {
  const {fps} = useVideoConfig();
  const s = (a: number, b: number, e = out3) => (still ? 0 : interpolate(frame, [a, b], [0, 1], {...clamp, easing: e}));
  const toB = s(A_OUT, A_OUT + 22, ease);
  const inside = still ? 0 : popIn(frame, fps, INSIDE_IN);
  const insideOut = s(A_OUT - 4, A_OUT + 6);
  const rows = ROWS.map((at) => (still ? 0 : popIn(frame, fps, at)));
  const rowsOut = s(B_OUT, B_OUT + 12);
  const term = still ? 0 : popIn(frame, fps, C_TERM);
  const cta = still ? 0 : popIn(frame, fps, C_CTA);
  const shake = still ? 0 : interpolate(frame, [0, 4, 22, 28], [0.4, 1, 1, 0], clamp);

  // Gift: big in the middle of the glass, then up to the top shelf to make room for the labels.
  const gx = 460;
  const gy = interpolate(toB, [0, 1], [1110, 836]);
  const gs = interpolate(toB, [0, 1], [1080, 820]);
  return (
    <AbsoluteFill>
      <Room data={data} />
      <Machine lower={1 - toB} />
      <Packet data={data} x={gx} y={gy} size={gs} at={still ? GIFT_OFFSET : giftFrame(frame)} shake={shake} />
      {!still && <Burst x={gx} y={gy} />}
      <Shine />
      <Marquee />
      {!still && frame >= INSIDE_IN && frame < A_OUT + 8 && <Sticker enter={inside} leave={insideOut} />}
      {!still && frame >= ROWS[0] && frame < B_OUT + 14 && (
        <>
          <Row y={1078} code="A1" label="Vanilla modeli" value="2%" enter={rows[0]} leave={rowsOut} />
          <Row y={1226} code="B2" label="Strawberry fon" value="1,5%" enter={rows[1]} leave={rowsOut} />
          <Row y={1374} code="C3" label="Bamboo belgisi" value="0,4%" enter={rows[2]} leave={rowsOut} />
        </>
      )}
      {!still && frame >= C_TERM && <Terms term={term} cta={cta} />}
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
      <Audio src={staticFile(`audio/bed_${ID}.wav`)} volume={(f) => interpolate(f, [0, 6, FRAMES - 30, FRAMES - 1], [0, 0.3, 0.3, 0], clamp)} />
      <Sequence from={COIN + 9}><Audio src={staticFile('audio/thunk.wav')} volume={0.22} /></Sequence>
      <Sequence from={FOIL}><Audio src={staticFile('audio/foil.wav')} volume={0.3} /></Sequence>
      {[A_OUT, B_OUT].map((at) => (
        <Sequence key={at} from={at}><Audio src={staticFile('audio/whoosh.wav')} volume={0.08} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};

const Cover: React.FC = () => {
  useFonts();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  return (
    <AbsoluteFill>
      <Freeze frame={0}>
        <Scene data={gifts[0]} frame={0} still />
      </Freeze>
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
