import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {H, W, clamp} from '../kit';
import type {CustomVideo} from './registry';

// "1 000 Stars necha so‘m?" — the trial ad for @StarsXonaBot (Telegram Stars for so‘m). No gift.
// Frame one asks the question over a big gold star while a slot readout is already rolling; the digits
// stop one by one on 195 000 so‘m. Then the rule behind it (1 Stars = 195 so‘m, the star stamped "1"),
// how you pay (an Uzbek bank card, the star becomes its emblem), and the call to action: the StarsXona
// logo and a Telegram search field that types @StarsXonaBot. Silent; synthwave bed of its own.
const ID = 'V20261118a';
const DISPLAY = "'Unbounded', sans-serif";
const BODY = "'Manrope', sans-serif";

// Palette, built from Telegram-Stars gold (hue ~42°): background family is its complement, a deep
// night indigo (hue ~234°, low lightness); accent: star gold with a light and a deep tone taken from
// the StarsXona logo; neutral: warm ivory. No extra hue: secondary text is ivory mixed into the night.
const NIGHT_DEEP = '#060920';
const NIGHT = '#121848';
const NIGHT_GLOW = '#283078';
const GOLD = '#ffc23a';
const GOLD_LIGHT = '#ffe48a';
const GOLD_DEEP = '#d9820f';
const GOLD_SHADOW = '#9c5306';
const IVORY = '#fff5df';
const IVORY_SOFT = 'rgba(255,245,223,.72)';

// Timeline at 30 fps. Reading pace: each text rests 1.2 s + 0.4 s per word once its entrance ends.
const STOPS = [44, 50, 56, 64, 70, 76]; // the six digits of 195 000 stop here
const HOOK_OUT = 132; // hook "1 000 Stars necha so‘m?" (4 words, 2.8 s) visible from frame 0 -> 4.4 s
const B = 160; // "Narxi oddiy: 1 Stars = 195 so‘m" (6 words, 3.6 s): in by ~185, out at 300
const C = 300; // "To‘lov / O‘zbekiston bank kartasi bilan" (5 words, 3.2 s): in by ~322, out at 430
const D = 430; // logo, "Telegram’da qidiring:", search field
const TYPE = 448; // typing @StarsXonaBot, 13 characters, done at ~481
const PRICE = 486; // "1 Stars — 195 so‘m" (5 words, 3.2 s) in by ~496
const FRAMES = 590; // 19.7 s

const HANDLE = '@StarsXonaBot';
const TYPE_END = TYPE + HANDLE.length * 2.5;

const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all(['900 10px Unbounded', '700 10px Unbounded', '800 10px Manrope', '500 10px Manrope']
      .map((font) => document.fonts.load(font, 'O‘g‘ 195 000 so‘m @StarsXonaBot')))
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

const ease = Easing.bezier(0.16, 0.8, 0.24, 1);
const pop = (frame: number, fps: number, at: number, damping = 13) =>
  spring({frame: frame - at, fps, config: {damping, stiffness: 150, mass: 0.7}});

/** Night sky: indigo gradient, a soft glow behind the subject, fixed twinkling stars and rising gold dust. */
const Sky: React.FC<{glowY?: number; warm?: number}> = ({glowY = 760, warm = 1}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${NIGHT_DEEP} 0%, ${NIGHT} 46%, ${NIGHT_DEEP} 100%)`}}>
      <AbsoluteFill style={{background:
        `radial-gradient(ellipse 70% 34% at 50% ${glowY / H * 100}%, ${NIGHT_GLOW} 0%, rgba(40,48,120,0) 70%)`}} />
      <AbsoluteFill style={{opacity: warm, background:
        `radial-gradient(circle 420px at 50% ${glowY / H * 100}%, rgba(255,194,58,.20), rgba(255,194,58,0) 100%)`}} />
      {Array.from({length: 110}, (_, i) => {
        const r = (k: string) => random(`sky-${i}-${k}`);
        const size = 2 + r('s') * 4;
        const tw = 0.25 + 0.75 * Math.abs(Math.sin(frame / (14 + r('t') * 26) + i * 2.1));
        return <div key={i} style={{position: 'absolute', left: r('x') * W, top: r('y') * H - frame * 0.08 * r('p'),
          width: size, height: size, borderRadius: '50%', background: IVORY, opacity: (0.2 + r('o') * 0.6) * tw,
          boxShadow: size > 4.4 ? `0 0 ${size * 3}px ${IVORY}` : undefined}} />;
      })}
      {Array.from({length: 26}, (_, i) => {
        const r = (k: string) => random(`dust-${i}-${k}`);
        const size = 4 + r('s') * 7;
        const y = H - ((r('y') * H + frame * (0.7 + r('v') * 1.4)) % (H + 40));
        const x = r('x') * W + Math.sin(frame / (26 + r('w') * 30) + i) * 22;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: '50%',
          background: GOLD, opacity: 0.12 + r('o') * 0.3, boxShadow: `0 0 ${size * 2.4}px ${GOLD}`}} />;
      })}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 90% 70% at 50% 50%, transparent 55%, rgba(0,0,0,.45) 100%)'}} />
    </AbsoluteFill>
  );
};

const starPoints = (cx: number, cy: number, R: number, r: number) =>
  Array.from({length: 10}, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r : R;
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad];
  });

/** A faceted, rounded gold star drawn in SVG (sharp at any size). Rotates only in its own plane. */
const GoldStar: React.FC<{x: number; y: number; size: number; rotate?: number; shine?: number; label?: string;
  labelOpacity?: number; uid: string}> = ({x, y, size, rotate = 0, shine = -1, label, labelOpacity = 1, uid}) => {
  const pts = starPoints(100, 104, 84, 44);
  const path = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(2)} ${py.toFixed(2)}`).join(' ') + 'Z';
  const depth = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(2)} ${(py + 7).toFixed(2)}`).join(' ') + 'Z';
  const c = [100, 104];
  const facets = Array.from({length: 5}, (_, k) => {
    const o = pts[k * 2];
    const right = pts[(k * 2 + 1) % 10];
    const left = pts[(k * 2 + 9) % 10];
    return {light: [c, o, right], dark: [c, o, left]};
  });
  const poly = (p: number[][]) => p.map(([a, b]) => `${a.toFixed(2)},${b.toFixed(2)}`).join(' ');
  const sx = interpolate(shine, [0, 1], [-60, 260]);
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{position: 'absolute', left: x - size / 2,
      top: y - size / 2, overflow: 'visible', transform: `rotate(${rotate}deg)`,
      filter: `drop-shadow(0 ${size * 0.05}px ${size * 0.09}px rgba(255,170,40,.45)) drop-shadow(0 ${size * 0.04}px ${size * 0.03}px rgba(0,0,0,.4))`}}>
      <defs>
        <linearGradient id={`body-${uid}`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor={GOLD_LIGHT} />
          <stop offset="0.5" stopColor={GOLD} />
          <stop offset="1" stopColor={GOLD_DEEP} />
        </linearGradient>
        <clipPath id={`clip-${uid}`}><path d={path} stroke="#000" strokeWidth={22} strokeLinejoin="round" /></clipPath>
        <linearGradient id={`shine-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={depth} fill={GOLD_SHADOW} stroke={GOLD_SHADOW} strokeWidth={22} strokeLinejoin="round" />
      <path d={path} fill={`url(#body-${uid})`} stroke={`url(#body-${uid})`} strokeWidth={22} strokeLinejoin="round" />
      {facets.map((f, k) => (
        <React.Fragment key={k}>
          <polygon points={poly(f.light)} fill={GOLD_LIGHT} opacity={0.55} />
          <polygon points={poly(f.dark)} fill={GOLD_DEEP} opacity={0.42} />
        </React.Fragment>
      ))}
      <path d={path} fill="none" stroke={GOLD_LIGHT} strokeWidth={2.4} strokeLinejoin="round" opacity={0.7} />
      {shine >= 0 && shine <= 1 && (
        <g clipPath={`url(#clip-${uid})`}>
          <rect x={sx - 30} y={-20} width={60} height={260} fill={`url(#shine-${uid})`} transform={`rotate(24 ${sx} 100)`} />
        </g>
      )}
      {label && (
        <text x={100} y={122} textAnchor="middle" fontFamily="Unbounded" fontWeight={900} fontSize={58}
          fill={GOLD_SHADOW} opacity={labelOpacity} style={{paintOrder: 'stroke'}} stroke={GOLD_LIGHT} strokeWidth={1.6}>
          {label}
        </text>
      )}
    </svg>
  );
};

/** A thin gold orbit around the star (the logo's ring), with a spark travelling along it. */
const Orbit: React.FC<{x: number; y: number; rx: number; opacity: number}> = ({x, y, rx, opacity}) => {
  const frame = useCurrentFrame();
  const ry = rx * 0.34;
  const a = frame / 22;
  const px = x + Math.cos(a) * rx;
  const py = y + Math.sin(a) * ry;
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity}}>
      <g transform={`rotate(-14 ${x} ${y})`}>
        <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="none" stroke={GOLD} strokeWidth={3} opacity={0.55} />
        <circle cx={px} cy={py} r={9} fill={GOLD_LIGHT} style={{filter: `drop-shadow(0 0 12px ${GOLD})`}} />
      </g>
    </svg>
  );
};

/** One digit column of the slot readout, rolling and stopping on its target. */
const Digit: React.FC<{target: number; stop: number; index: number; frozen?: string}> = ({target, stop, index, frozen}) => {
  const frame = useCurrentFrame();
  const h = 168;
  if (frozen) {
    return <div style={{width: 112, height: h, textAlign: 'center', lineHeight: `${h}px`, color: GOLD_LIGHT}}>{frozen}</div>;
  }
  const start = 3.45 + index * 1.7;
  const total = target + 10 * (5 + index);
  const t = interpolate(frame, [0, stop], [0, 1], clamp);
  const p = start + (total - start) * ease(t);
  const speed = frame >= stop ? 0 : (total - start) * (ease(Math.min(1, t + 1 / stop)) - ease(t));
  const land = frame >= stop ? interpolate(frame, [stop, stop + 6, stop + 12], [0, 1, 0], clamp) : 0;
  return (
    <div style={{width: 112, height: h, overflow: 'hidden', position: 'relative'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: -(p % 10) * h, filter: `blur(${Math.min(7, speed * 5)}px)`}}>
        {Array.from({length: 11}, (_, d) => (
          <div key={d} style={{height: h, lineHeight: `${h}px`, textAlign: 'center',
            color: frame >= stop ? GOLD_LIGHT : IVORY, textShadow: land ? `0 0 ${30 * land}px ${GOLD}` : undefined}}>{d % 10}</div>
        ))}
      </div>
    </div>
  );
};

/** The glass slot readout under the hook: six digits and "so‘m". */
const Readout: React.FC<{opacity: number; frozen?: boolean}> = ({opacity, frozen}) => {
  const digits = [1, 9, 5, 0, 0, 0];
  return (
    <div style={{position: 'absolute', left: 70, width: 800, top: 1108, opacity}}>
      <div style={{position: 'relative', height: 200, borderRadius: 40, background: 'linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,.03))',
        border: `3px solid rgba(255,194,58,.55)`, boxShadow: `0 24px 60px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.2)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        fontFamily: DISPLAY, fontWeight: 900, fontSize: 138}}>
        {digits.map((d, i) => (
          <React.Fragment key={i}>
            {i === 3 && <div style={{width: 40}} />}
            <Digit target={d} stop={STOPS[i]} index={i} frozen={frozen ? '?' : undefined} />
          </React.Fragment>
        ))}
        <AbsoluteFill style={{background: `linear-gradient(180deg, ${NIGHT_DEEP} 0%, transparent 22%, transparent 78%, ${NIGHT_DEEP} 100%)`,
          opacity: 0.75, pointerEvents: 'none'}} />
      </div>
      <div style={{marginTop: 14, textAlign: 'center', fontFamily: BODY, fontWeight: 800, fontSize: 60, color: GOLD,
        letterSpacing: 1}}>so‘m</div>
    </div>
  );
};

const Hook: React.FC<{exit?: number}> = ({exit = 0}) => (
  <div style={{position: 'absolute', left: 40, right: 40, top: 238, textAlign: 'center', opacity: 1 - exit,
    transform: `translateY(${-exit * 50}px)`}}>
    <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 124, lineHeight: 1.04, color: GOLD,
      textShadow: `0 8px 0 ${GOLD_SHADOW}, 0 20px 50px rgba(0,0,0,.5)`}}>1 000 Stars</div>
    <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 92, lineHeight: 1.2, color: IVORY, marginTop: 8,
      textShadow: '0 10px 36px rgba(0,0,0,.5)'}}>necha so‘m?</div>
  </div>
);

/** A generic bank card (no network or bank marks): night-glass body, gold chip, the star as emblem. */
const Card: React.FC<{x: number; y: number; rotate: number; opacity: number}> = ({x, y, rotate, opacity}) => (
  <div style={{position: 'absolute', left: x - 380, top: y - 240, width: 760, height: 480, borderRadius: 44, opacity,
    transform: `rotate(${rotate}deg)`, background: `linear-gradient(135deg, ${NIGHT_GLOW} 0%, ${NIGHT} 55%, ${NIGHT_DEEP} 100%)`,
    border: '3px solid rgba(255,194,58,.6)', boxShadow: '0 40px 90px rgba(0,0,0,.55), inset 0 2px 0 rgba(255,255,255,.18)',
    overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: -200, top: -260, width: 700, height: 700, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(255,228,138,.16), transparent 65%)'}} />
    <div style={{position: 'absolute', left: 64, top: 150, width: 120, height: 92, borderRadius: 16,
      background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD_DEEP})`, boxShadow: 'inset 0 0 0 2px rgba(156,83,6,.5)'}}>
      {[30, 61].map((top) => <div key={top} style={{position: 'absolute', left: 0, right: 0, top, height: 2, background: 'rgba(156,83,6,.55)'}} />)}
      <div style={{position: 'absolute', left: 58, top: 0, bottom: 0, width: 2, background: 'rgba(156,83,6,.55)'}} />
    </div>
    <svg width={70} height={92} viewBox="0 0 70 92" style={{position: 'absolute', left: 210, top: 150}}>
      {[14, 30, 46].map((r, i) => (
        <path key={i} d={`M${10 + i * 14} ${46 - r} A ${r} ${r} 0 0 1 ${10 + i * 14} ${46 + r}`} fill="none"
          stroke={IVORY_SOFT} strokeWidth={6} strokeLinecap="round" />
      ))}
    </svg>
    <div style={{position: 'absolute', left: 64, top: 300, fontFamily: DISPLAY, fontWeight: 700, fontSize: 46, letterSpacing: 6,
      color: IVORY}}>•••• •••• •••• 0195</div>
    <div style={{position: 'absolute', left: 64, top: 384, fontFamily: BODY, fontWeight: 800, fontSize: 30, letterSpacing: 4,
      color: IVORY_SOFT}}>O‘ZBEKISTON · SO‘M</div>
  </div>
);

const Video: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Star: big hero in the hook, moves up and is stamped "1" in scene B, becomes the card emblem in C.
  const toB = pop(frame, fps, B - 4, 16);
  const toC = pop(frame, fps, C - 2, 16);
  const starOut = interpolate(frame, [D - 6, D + 6], [1, 0], clamp);
  const sway = Math.sin(frame / 24) * 4;
  const cardIn = pop(frame, fps, C - 4, 15);
  const cardOut = interpolate(frame, [D - 10, D + 4], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const cardX = interpolate(cardIn, [0, 1], [1500, 540]) - cardOut * 1400;
  const cardY = 600;
  const cardRot = interpolate(cardIn, [0, 1], [18, -6]) - cardOut * 20;
  // the emblem position on the card (top-right corner), following the card's rotation
  const emb = (() => {
    const a = (cardRot * Math.PI) / 180;
    const dx = 380 - 110;
    const dy = -240 + 110;
    return {x: cardX + dx * Math.cos(a) - dy * Math.sin(a), y: cardY + dx * Math.sin(a) + dy * Math.cos(a)};
  })();
  const starX = interpolate(toC, [0, 1], [540, emb.x]);
  const starY = interpolate(toC, [0, 1], [interpolate(toB, [0, 1], [770, 560]), emb.y]);
  const starSize = interpolate(toC, [0, 1], [interpolate(toB, [0, 1], [600, 470]), 150]);
  const starRot = sway * (1 - toC) + cardRot * toC + interpolate(toB, [0, 0.5, 1], [0, 72, 0]) * (1 - toC);
  const shine = frame < B ? interpolate(frame, [STOPS[5] + 2, STOPS[5] + 26], [0, 1], clamp)
    : interpolate(frame, [B + 22, B + 46], [0, 1], clamp);
  const stamp = pop(frame, fps, B + 18, 10);

  const hookExit = interpolate(frame, [HOOK_OUT, HOOK_OUT + 9], [0, 1], clamp);
  const readoutOpacity = interpolate(frame, [B - 8, B], [1, 0], clamp);
  const land = interpolate(frame, [STOPS[5], STOPS[5] + 20], [0, 1], clamp);

  // Scene B text
  const bLabel = pop(frame, fps, B + 2);
  const bOne = pop(frame, fps, B + 8);
  const bEq = pop(frame, fps, B + 14);
  const bOut = interpolate(frame, [C - 8, C], [0, 1], clamp);
  // Scene C text
  const cLabel = pop(frame, fps, C + 6);
  const cLine = pop(frame, fps, C + 12);
  const cOut = interpolate(frame, [D - 8, D], [0, 1], clamp);
  // Scene D
  const logo = pop(frame, fps, D, 11);
  const ask = pop(frame, fps, D + 6);
  const bar = pop(frame, fps, D + 12);
  const typed = Math.max(0, Math.min(HANDLE.length, Math.floor((frame - TYPE) / 2.5) + 1));
  const done = frame >= TYPE_END;
  const caret = done ? (Math.floor(frame / 15) % 2 ? 0 : 1) : 1;
  const price = pop(frame, fps, PRICE);
  const glow = done ? interpolate(frame, [TYPE_END, TYPE_END + 10, TYPE_END + 30], [0, 1, 0.45], clamp) : 0;

  return (
    <AbsoluteFill style={{background: NIGHT_DEEP, overflow: 'hidden'}}>
      <Sky glowY={frame < D ? starY : 580} />

      {/* Burst of tiny stars when the last digit lands. */}
      {frame >= STOPS[5] && frame < STOPS[5] + 40 && Array.from({length: 18}, (_, i) => {
        const a = (i / 18) * Math.PI * 2 + random(`b-${i}`) * 0.3;
        const dist = 120 + land * (300 + random(`d-${i}`) * 200);
        const s = 26 * (1 - land) + 6;
        return <svg key={i} width={s} height={s} viewBox="0 0 20 20" style={{position: 'absolute',
          left: 470 + Math.cos(a) * dist - s / 2, top: 1208 + Math.sin(a) * dist * 0.6 - s / 2, opacity: 1 - land}}>
          <path d="M10 0 Q11 9 20 10 Q11 11 10 20 Q9 11 0 10 Q9 9 10 0Z" fill={GOLD_LIGHT} />
        </svg>;
      })}

      {frame < D + 6 && <Orbit x={540} y={starY + 10} rx={starSize * 0.62} opacity={(1 - toC) * 0.9} />}

      {frame >= C - 6 && frame < D + 6 && <Card x={cardX} y={cardY} rotate={cardRot} opacity={1} />}

      {frame < D + 6 && (
        <div style={{opacity: starOut}}>
          <GoldStar uid="hero" x={starX} y={starY} size={starSize} rotate={starRot} shine={shine}
            label={frame >= B + 18 ? '1' : undefined} labelOpacity={Math.min(1, stamp * 1.5)} />
        </div>
      )}

      {frame < HOOK_OUT + 10 && <Hook exit={hookExit} />}
      {frame < B && <Readout opacity={readoutOpacity} />}

      {/* Scene B: the rule. */}
      {frame >= B && frame < C + 2 && (
        <div style={{position: 'absolute', left: 70, top: 930, width: 800, opacity: 1 - bOut,
          transform: `translateY(${-bOut * 40}px)`}}>
          <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 54, color: IVORY_SOFT, opacity: bLabel,
            transform: `translateX(${(1 - bLabel) * -40}px)`}}>Narxi oddiy:</div>
          <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 124, lineHeight: 1.12, color: GOLD, marginTop: 12,
            opacity: Math.min(1, bOne * 1.4), transform: `scale(${0.8 + bOne * 0.2})`, transformOrigin: 'left center',
            textShadow: `0 7px 0 ${GOLD_SHADOW}, 0 18px 44px rgba(0,0,0,.5)`}}>1 Stars</div>
          <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 112, lineHeight: 1.12, color: IVORY,
            opacity: Math.min(1, bEq * 1.4), transform: `translateX(${(1 - bEq) * 80}px)`, whiteSpace: 'nowrap',
            textShadow: '0 14px 40px rgba(0,0,0,.5)'}}>= 195 so‘m</div>
        </div>
      )}

      {/* Scene C: how to pay. */}
      {frame >= C && frame < D + 2 && (
        <div style={{position: 'absolute', left: 70, top: 1010, width: 800, opacity: 1 - cOut,
          transform: `translateY(${-cOut * 40}px)`}}>
          <div style={{display: 'inline-block', fontFamily: BODY, fontWeight: 800, fontSize: 46, color: NIGHT_DEEP,
            background: GOLD, padding: '10px 30px', borderRadius: 999, opacity: cLabel,
            transform: `translateX(${(1 - cLabel) * -40}px)`}}>To‘lov</div>
          <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 88, lineHeight: 1.08, color: IVORY, marginTop: 26,
            opacity: Math.min(1, cLine * 1.4), transform: `translateY(${(1 - cLine) * 50}px)`,
            textShadow: '0 12px 36px rgba(0,0,0,.5)'}}>
            O‘zbekiston<br />bank kartasi<br /><span style={{color: GOLD}}>bilan</span>
          </div>
        </div>
      )}

      {/* Scene D: logo and Telegram search. */}
      {frame >= D - 2 && (
        <>
          <div style={{position: 'absolute', left: 540 - 450, top: 560 - 450, width: 900, height: 900, opacity: logo * 0.55,
            transform: `rotate(${frame * 0.3}deg)`, mixBlendMode: 'screen',
            background: `repeating-conic-gradient(from 0deg, rgba(255,194,58,.5) 0deg 6deg, transparent 6deg 18deg)`,
            WebkitMaskImage: 'radial-gradient(circle, #000 10%, transparent 64%)'}} />
          <Img src={staticFile('stars/logo-gold.png')} style={{position: 'absolute', left: 540 - 270, top: 560 - 270,
            width: 540, height: 540, opacity: Math.min(1, logo * 1.4),
            transform: `scale(${0.6 + logo * 0.4}) rotate(${(1 - logo) * -30 + Math.sin(frame / 26) * 3}deg)`,
            filter: 'drop-shadow(0 30px 60px rgba(0,0,0,.45))'}} />
          <div style={{position: 'absolute', left: 70, top: 930, fontFamily: BODY, fontWeight: 800, fontSize: 60, color: IVORY,
            opacity: ask, transform: `translateX(${(1 - ask) * -40}px)`}}>Telegram’da qidiring:</div>
          <div style={{position: 'absolute', left: 70, top: 1025, width: 800, height: 136, borderRadius: 999,
            background: IVORY, display: 'flex', alignItems: 'center', gap: 22, padding: '0 40px', boxSizing: 'border-box',
            opacity: Math.min(1, bar * 1.4), transform: `scale(${0.85 + bar * 0.15})`, transformOrigin: 'left center',
            boxShadow: `0 24px 60px rgba(0,0,0,.45), 0 0 ${70 * glow}px rgba(255,194,58,${0.9 * glow})`,
            border: `4px solid ${done ? GOLD : 'rgba(255,194,58,0)'}`}}>
            <svg width={56} height={56} viewBox="0 0 24 24">
              <circle cx={10} cy={10} r={6.5} fill="none" stroke={NIGHT} strokeWidth={2.6} />
              <path d="M15 15 L21 21" stroke={NIGHT} strokeWidth={2.8} strokeLinecap="round" />
            </svg>
            <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 58, color: NIGHT_DEEP, whiteSpace: 'nowrap'}}>
              {frame >= TYPE ? HANDLE.slice(0, typed) : ''}
              <span style={{display: 'inline-block', width: 5, height: 64, marginLeft: 6, verticalAlign: 'middle',
                background: GOLD_DEEP, opacity: caret}} />
            </div>
          </div>
          <div style={{position: 'absolute', left: 70, top: 1236, display: 'flex', alignItems: 'center', gap: 22,
            opacity: Math.min(1, price * 1.4), transform: `translateY(${(1 - price) * 40}px)`}}>
            <GoldStarInline />
            <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 64, color: GOLD,
              textShadow: `0 5px 0 ${GOLD_SHADOW}, 0 14px 34px rgba(0,0,0,.5)`}}>
              1 Stars <span style={{color: IVORY}}>—</span> 195 so‘m
            </div>
          </div>
        </>
      )}

      <Audio src={staticFile(`audio/bed_${ID}.wav`)}
        volume={(f) => interpolate(f, [0, 2, FRAMES - 24, FRAMES - 1], [0, 0.42, 0.42, 0], clamp)} />
      <Audio src={staticFile('audio/riser.wav')} volume={0.22} />
      {STOPS.slice(0, 5).map((at, i) => (
        <Sequence key={i} from={at}><Audio src={staticFile('audio/glass.wav')} volume={0.16 + i * 0.02} /></Sequence>
      ))}
      <Sequence from={STOPS[5]}><Audio src={staticFile('audio/coin.wav')} volume={0.5} /></Sequence>
      <Sequence from={STOPS[5] + 2}><Audio src={staticFile('audio/sparkle.wav')} volume={0.3} /></Sequence>
      <Sequence from={B - 4}><Audio src={staticFile('audio/whoosh.wav')} volume={0.3} /></Sequence>
      <Sequence from={B + 18}><Audio src={staticFile('audio/impact.wav')} volume={0.28} /></Sequence>
      <Sequence from={C - 4}><Audio src={staticFile('audio/whoosh.wav')} volume={0.28} /></Sequence>
      <Sequence from={C + 14}><Audio src={staticFile('audio/glass.wav')} volume={0.3} /></Sequence>
      <Sequence from={D}><Audio src={staticFile('audio/chime.wav')} volume={0.35} /></Sequence>
      <Sequence from={TYPE}><Audio src={staticFile('audio/keys.wav')} volume={0.5} /></Sequence>
      <Sequence from={PRICE}><Audio src={staticFile('audio/coin.wav')} volume={0.35} /></Sequence>
    </AbsoluteFill>
  );
};

const GoldStarInline: React.FC = () => (
  <svg width={78} height={78} viewBox="0 0 200 200" style={{position: 'relative', overflow: 'visible'}}>
    <path d={starPoints(100, 104, 84, 44).map(([a, b], i) => `${i ? 'L' : 'M'}${a} ${b}`).join(' ') + 'Z'}
      fill={GOLD} stroke={GOLD} strokeWidth={22} strokeLinejoin="round" />
  </svg>
);

/** Cover: the question, the star and the slot still showing question marks, with the bot's name. */
const Cover: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{background: NIGHT_DEEP, overflow: 'hidden'}}>
      <Sky glowY={770} />
      <Orbit x={540} y={780} rx={372} opacity={0.9} />
      <GoldStar uid="cover" x={540} y={770} size={600} rotate={-3} shine={0.4} />
      <Hook />
      <Readout opacity={1} frozen />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1452, display: 'flex', justifyContent: 'center'}}>
        <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 54, color: NIGHT_DEEP, background: GOLD,
          padding: '18px 44px', borderRadius: 999, boxShadow: '0 20px 50px rgba(0,0,0,.45)'}}>{HANDLE}</div>
      </div>
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
