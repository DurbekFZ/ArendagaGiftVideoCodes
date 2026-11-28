import '@fontsource/space-grotesk/700.css';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random, spring,
  staticFile, useCurrentFrame,
} from 'remotion';
import {clamp} from '../kit';
import type {CustomVideo} from './registry';

// "UCH OLAM" — third @TaqdimotKerakBot video. Frame one speaks to the viewer: "Ertaga taqdimotmi?" in very large
// type on a dark ink ground lit by three soft colour glows, a gold tag "Tayyor taqdimot — buyurtma qiling", and the
// covers of three real sample decks (quyosh, suv, marketing) fanned below and shuffling. Then each deck takes over
// the whole frame in turn: a circle wipes the screen into that deck's own world (night-blue space, light water blue,
// warm cream), its cover lands large at the top and a second slide of the same deck slides over it, with one short
// line below. The ending brings the three covers back as a small fan and writes @TaqdimotKerakBot in a large search
// field with "Telegramda qidiring".
const ID = 'V20261128b';
const HEAD = "'Space Grotesk', sans-serif";

// Hook and ending ground: near-black ink with three glows, one per deck (night blue, water blue, coral).
const INK = '#14161f';
const GOLD = '#ffc24b';
const WHITE = '#ffffff';

type World = {
  deck: string; slides: [string, string]; subject: string; lines: string[]; mark: number;
  bg: [string, string, string]; text: string; accent: string; chipBg: string; chipText: string; shadow: string;
};
// Each world's palette is taken from its deck: background family, the deck's own accent, its ink and white.
const WORLDS: World[] = [
  {deck: 'quyosh', slides: ['quyosh/01', 'quyosh/03'], subject: 'ASTRONOMIYA', lines: ['Slaydlar', 'matni bilan', 'tayyor'], mark: 2,
    bg: ['#22306e', '#121a45', '#080d27'], text: WHITE, accent: '#ffc24b', chipBg: 'rgba(255,194,75,.16)', chipText: '#ffc24b',
    shadow: 'rgba(2,4,20,.6)'},
  {deck: 'suv', slides: ['suv/01', 'suv/03'], subject: 'GEOGRAFIYA', lines: ['Bular —', 'haqiqiy', 'namunalar'], mark: 1,
    bg: ['#eef8ff', '#cfe9f8', '#a9d6f0'], text: '#0b3a5e', accent: '#0f86b8', chipBg: '#0b3a5e', chipText: '#ffffff',
    shadow: 'rgba(11,58,94,.3)'},
  {deck: 'marketing', slides: ['marketing/01', 'marketing/02'], subject: 'IQTISODIYOT', lines: ['Botga kiring,', 'narxlarni', 'ko‘ring'], mark: 1,
    bg: ['#fffaf2', '#f8ecdb', '#efdcc2'], text: '#231f1c', accent: '#e4572e', chipBg: '#e4572e', chipText: '#ffffff',
    shadow: 'rgba(60,35,20,.3)'},
];

// Timeline (30 fps).
const STARTS = [102, 228, 342];
const END = 468;
const FRAMES = 582; // 19.4 s
const PUSH = 48; // frames after a world starts when its second slide slides in
const WIPE = 18;

const COVERS = WORLDS.map((w) => w.slides[0]);
const ALL = WORLDS.flatMap((w) => w.slides);
const RATIO = 900 / 1600;
const HERO_W = 1000;
const HERO = {cx: 540, cy: 250 + (HERO_W * RATIO) / 2};

const Q: React.FC = () => <span style={{margin: '0 -0.04em 0 -0.02em'}}>‘</span>;
const withQ = (s: string) => {
  const parts = s.split('‘');
  return parts.map((p, i) => <React.Fragment key={i}>{i > 0 ? <Q /> : null}{p}</React.Fragment>);
};

const useAssets = () => {
  const [handle] = useState(() => delayRender('assets'));
  useEffect(() => {
    const images = ALL.map((s) => new Promise((resolve) => {
      const img = new Image(); img.onload = resolve; img.onerror = resolve; img.src = staticFile(`taqdimot/${s}.jpg`);
    }));
    Promise.all([document.fonts.load(`700 10px 'Space Grotesk'`, 'Ertaga taqdimotmi? ko‘ring @TaqdimotKerakBot'), ...images])
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

const ease = Easing.out(Easing.cubic);
const sp = (f: number, at: number, config = {damping: 16, stiffness: 120, mass: 0.8}) =>
  spring({frame: f - at, fps: 30, config});
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------- grounds ----------

const InkGround: React.FC<{f: number}> = ({f}) => {
  const g = (k: number, sx: number, sy: number) => ({x: sx + 10 * Math.sin(f / 70 + k * 2.1), y: sy + 6 * Math.cos(f / 55 + k * 1.7)});
  const a = g(0, 12, 16); const b = g(1, 92, 48); const c = g(2, 30, 86);
  return (
    <AbsoluteFill style={{background: INK}}>
      <AbsoluteFill style={{background: [
        `radial-gradient(circle 620px at ${a.x}% ${a.y}%, rgba(58,82,200,.55), transparent 70%)`,
        `radial-gradient(circle 560px at ${b.x}% ${b.y}%, rgba(64,170,228,.38), transparent 70%)`,
        `radial-gradient(circle 640px at ${c.x}% ${c.y}%, rgba(228,87,46,.36), transparent 70%)`,
      ].join(',')}} />
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(255,255,255,.07) 1.5px, transparent 1.6px)', backgroundSize: '36px 36px',
        backgroundPosition: `0px ${(-f * 0.4) % 36}px`}} />
    </AbsoluteFill>
  );
};

/** Space: night-blue field, twinkling stars, a warm sun with turning orbits in the lower right. */
const SpaceGround: React.FC<{f: number; w: World}> = ({f, w}) => {
  const stars = Array.from({length: 90}, (_, i) => {
    const x = random(`sx${i}`) * 1080; const y = random(`sy${i}`) * 1920;
    if (x < 900 && y > 860 && y < 1320) return null; // keep the text column clean
    const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(f / (8 + random(`st${i}`) * 14) + i));
    const r = 1 + random(`sr${i}`) * 2.4;
    return <div key={i} style={{position: 'absolute', left: x, top: y, width: r * 2, height: r * 2, borderRadius: r, background: '#fff', opacity: tw * 0.8}} />;
  });
  const cx = 930; const cy = 1650;
  const orbits = [220, 330, 450, 580];
  const planet = ['#7fb8ff', '#ffb36b', '#5ad0e6', '#c9a3ff'];
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 120% 70% at 30% 20%, ${w.bg[0]} 0%, ${w.bg[1]} 55%, ${w.bg[2]} 100%)`}}>
      {stars}
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <radialGradient id="sun"><stop offset="0%" stopColor="#ffe6a3" /><stop offset="55%" stopColor="#ffc24b" /><stop offset="100%" stopColor="#ffc24b" stopOpacity="0" /></radialGradient>
        </defs>
        <g transform={`translate(${cx} ${cy}) scale(1 0.42) rotate(-12)`}>
          {orbits.map((r, i) => {
            const a = f / (40 + i * 22) + i * 1.9;
            return (
              <g key={r}>
                <circle r={r} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={2.4} />
                <circle cx={r * Math.cos(a)} cy={r * Math.sin(a)} r={16 + i * 3} fill={planet[i]} />
              </g>
            );
          })}
        </g>
        <circle cx={cx} cy={cy} r={130} fill="url(#sun)" />
        <circle cx={cx} cy={cy} r={58} fill="#ffc24b" />
      </svg>
    </AbsoluteFill>
  );
};

/** Water: light sky blue, large soft circles, drops rising along the right edge, ripples in the lower right. */
const WaterGround: React.FC<{f: number; w: World}> = ({f, w}) => {
  const drops = Array.from({length: 9}, (_, i) => {
    const x = 900 + random(`dx${i}`) * 150;
    const speed = 1.4 + random(`dv${i}`) * 1.6;
    const y = 1950 - ((f * speed + random(`dy${i}`) * 1900) % 2100);
    const s = 22 + random(`ds${i}`) * 26;
    return (
      <svg key={i} width={s} height={s * 1.35} viewBox="0 0 20 27" style={{position: 'absolute', left: x, top: y, opacity: 0.75}}>
        <path d="M10 0 C10 0 0 12 0 17 a10 10 0 0 0 20 0 C20 12 10 0 10 0Z" fill={i % 2 ? '#7fd3f3' : '#3fa9dc'} />
      </svg>
    );
  });
  const rings = [0, 1, 2].map((k) => {
    const t = ((f + k * 30) % 90) / 90;
    return <div key={k} style={{position: 'absolute', left: 900 - 260 * t, top: 1700 - 90 * t, width: 520 * t, height: 180 * t, borderRadius: '50%',
      border: '4px solid rgba(15,134,184,.5)', opacity: 1 - t}} />;
  });
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${w.bg[0]} 0%, ${w.bg[1]} 55%, ${w.bg[2]} 100%)`}}>
      <div style={{position: 'absolute', left: 560, top: 1280, width: 900, height: 900, borderRadius: '50%', background: 'rgba(63,169,220,.16)',
        transform: `translateY(${10 * Math.sin(f / 40)}px)`}} />
      <div style={{position: 'absolute', left: -300, top: 40, width: 640, height: 640, borderRadius: '50%', background: 'rgba(255,255,255,.55)',
        transform: `translateY(${8 * Math.cos(f / 45)}px)`}} />
      {rings}
      {drops}
    </AbsoluteFill>
  );
};

/** Market: warm cream, the deck's rounded squares and circles (coral, charcoal, amber, teal) drifting at the edges. */
const MarketGround: React.FC<{f: number; w: World}> = ({f, w}) => {
  const shapes: [number, number, number, string, boolean, number][] = [
    [880, 1350, 170, '#e4572e', false, 0], [960, 1560, 120, '#231f1c', true, 1], [820, 1700, 150, '#f2a65a', true, 2],
    [-60, 1620, 190, '#1e8a7a', false, 3], [940, 150, 110, '#f2a65a', false, 4], [-40, 120, 130, '#e4572e', true, 5],
  ];
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 110% 70% at 35% 25%, ${w.bg[0]} 0%, ${w.bg[1]} 60%, ${w.bg[2]} 100%)`}}>
      {shapes.map(([x, y, s, c, round, k]) => (
        <div key={k} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: round ? '50%' : s * 0.24, background: c,
          transform: `translateY(${14 * Math.sin(f / 36 + k)}px) rotate(${round ? 0 : 6 * Math.sin(f / 50 + k)}deg)`}} />
      ))}
    </AbsoluteFill>
  );
};

const GROUNDS = [SpaceGround, WaterGround, MarketGround];

/** Circle wipe from the hero slide's centre into a new world. */
const Wipe: React.FC<{f: number; at: number; children: React.ReactNode}> = ({f, at, children}) => {
  if (f < at) return null;
  const r = interpolate(f, [at, at + WIPE], [0, 2300], {...clamp, easing: Easing.in(Easing.quad)});
  return <AbsoluteFill style={{clipPath: `circle(${r}px at ${HERO.cx}px ${HERO.cy}px)`}}>{children}</AbsoluteFill>;
};

// ---------- slides ----------

const Slide: React.FC<{src: string; width: number; cx: number; cy: number; rot?: number; shadow?: string; style?: React.CSSProperties}> =
  ({src, width, cx, cy, rot = 0, shadow = 'rgba(0,0,0,.45)', style}) => {
    const h = width * RATIO;
    return (
      <div style={{position: 'absolute', left: cx - width / 2, top: cy - h / 2, width, height: h, borderRadius: width * 0.022, overflow: 'hidden',
        background: WHITE, transform: `rotate(${rot}deg)`, boxShadow: `0 ${width * 0.035}px ${width * 0.07}px ${shadow}, 0 4px 12px rgba(0,0,0,.18)`, ...style}}>
        <Img src={staticFile(`taqdimot/${src}.jpg`)} style={{width: '100%', height: '100%', display: 'block'}} />
      </div>
    );
  };

// Hook fan: three slots; the covers shuffle one slot to the left at frames 34 and 68, quyosh ends in front.
type Slot = {cx: number; cy: number; rot: number; w: number; z: number};
const SLOTS: Slot[] = [
  {cx: 340, cy: 1150, rot: -8, w: 640, z: 1},
  {cx: 470, cy: 1240, rot: 0, w: 760, z: 3},
  {cx: 600, cy: 1140, rot: 8, w: 640, z: 2},
];
const SHUFFLE = [34, 68];
const fanSlot = (i: number, f: number): Slot => {
  // stage 0: quyosh left, suv centre, marketing right; each shuffle moves every card one slot to the left (2 → 1 → 0 → 2),
  // so the front goes suv → marketing → quyosh
  let slot = i;
  let cur = SLOTS[slot];
  for (const at of SHUFFLE) {
    const next = (slot + 2) % 3;
    const t = sp(f, at, {damping: 17, stiffness: 140, mass: 0.7});
    const a = cur; const b = SLOTS[next];
    const lift = next === 2 ? Math.sin(Math.min(1, t) * Math.PI) * 80 : 0; // the card going to the back dips down
    cur = {cx: lerp(a.cx, b.cx, t), cy: lerp(a.cy, b.cy, t) + lift, rot: lerp(a.rot, b.rot, t), w: lerp(a.w, b.w, t),
      z: t > 0.5 ? b.z : a.z};
    slot = next;
  }
  return cur;
};

const HookFan: React.FC<{f: number}> = ({f}) => {
  const zoom = sp(f, STARTS[0] - 4, {damping: 18, stiffness: 110, mass: 0.85});
  const enter = sp(f, -8, {damping: 14, stiffness: 120, mass: 0.7}); // already more than halfway on frame 0
  return (
    <>
      {COVERS.map((src, i) => {
        const s = fanSlot(i, f);
        if (i === 0) {
          // quyosh: from the front of the fan up to the hero position
          const cx = lerp(s.cx, HERO.cx, zoom); const cy = lerp(s.cy, HERO.cy, zoom);
          const w = lerp(s.w, HERO_W, zoom); const rot = lerp(s.rot, 0, zoom);
          if (f >= STARTS[0] + 20) return null; // the world's own stack takes over
          return <Slide key={src} src={src} width={w} cx={cx} cy={cy + (1 - enter) * 300} rot={rot} style={{zIndex: 10 + s.z}} />;
        }
        const away = sp(f, STARTS[0] - 4, {damping: 20, stiffness: 90, mass: 0.9});
        if (away > 0.99) return null;
        return <Slide key={src} src={src} width={s.w} cx={s.cx + (i === 1 ? -700 : 700) * away} cy={s.cy + 260 * away + (1 - enter) * 300}
          rot={s.rot + (i === 1 ? -20 : 20) * away} style={{zIndex: 10 + s.z}} />;
      })}
    </>
  );
};

/** The two slides of a world: cover lands, second slide pushes over it from the right, both leave to the left. */
const WorldStack: React.FC<{f: number; k: number}> = ({f, k}) => {
  const w = WORLDS[k];
  const s = STARTS[k];
  const e = k < 2 ? STARTS[k + 1] : END;
  if (f < s || f > e + 24) return null;
  const land = k === 0 ? 1 : sp(f, s + 2, {damping: 15, stiffness: 110, mass: 0.8});
  const push = sp(f, s + PUSH, {damping: 17, stiffness: 120, mass: 0.8});
  const leave = sp(f, e - 2, {damping: 20, stiffness: 110, mass: 0.8});
  const outX = -1250 * leave;
  const showA = k > 0 || f >= STARTS[0] + 20;
  return (
    <div style={{position: 'absolute', inset: 0, zIndex: 20}}>
      {showA ? (
        <Slide src={w.slides[0]} width={HERO_W * (1 - 0.1 * push)} cx={HERO.cx - 40 * push + outX * 0.85} cy={HERO.cy - 900 * (1 - land) - 30 * push}
          rot={-3 * push} shadow={w.shadow} style={{filter: `brightness(${1 - 0.18 * push})`}} />
      ) : null}
      {f >= s + PUSH - 1 ? (
        <Slide src={w.slides[1]} width={HERO_W} cx={HERO.cx + 1150 * (1 - push) + outX} cy={HERO.cy + 20 * (1 - push)} rot={4 * (1 - push)}
          shadow={w.shadow} />
      ) : null}
    </div>
  );
};

// ---------- type ----------

const big: React.CSSProperties = {fontFamily: HEAD, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2.5};

/** Text block: lines rise in over 10 frames (3-frame stagger) and sink away over 8 frames. */
const lineStyle = (f: number, from: number, to: number | undefined, i: number): React.CSSProperties => {
  const t = from <= 0 ? 1 : interpolate(f, [from + i * 3, from + i * 3 + 10], [0, 1], {...clamp, easing: ease});
  const o = to === undefined ? 1 : interpolate(f, [to, to + 8], [1, 0], clamp);
  const d = to === undefined ? 0 : interpolate(f, [to, to + 8], [0, 40], clamp);
  return {opacity: t * o, transform: `translateY(${(1 - t) * 50 + d}px)`};
};

/** Thick underline under the marked word, in the world's accent; it skips the descenders and fades in. */
const Mark: React.FC<{f: number; at: number; color: string; children: React.ReactNode}> = ({f, at, color, children}) => {
  const t = at <= 0 ? 1 : interpolate(f, [at + 8, at + 18], [0, 1], {...clamp, easing: ease});
  return (
    <span style={{color, textDecorationLine: 'underline', textDecorationThickness: 12, textUnderlineOffset: 14,
      textDecorationSkipInk: 'auto', textDecorationColor: `rgba(${hexRgb(color)},${t})`}}>{children}</span>
  );
};
const hexRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',');

const Hook: React.FC<{f: number}> = ({f}) => {
  const out = STARTS[0] - 10;
  if (f > out + 10) return null;
  return (
    <div style={{position: 'absolute', left: 70, top: 250, width: 940, zIndex: 30}}>
      <div style={{...big, fontSize: 150, color: WHITE, ...lineStyle(f, 0, out, 0)}}>Ertaga</div>
      <div style={{...big, fontSize: 150, color: WHITE, ...lineStyle(f, 0, out, 0)}}>taqdimotmi?</div>
      <div style={{display: 'inline-block', marginTop: 34, padding: '18px 30px 22px', borderRadius: 26, background: GOLD,
        boxShadow: '0 18px 40px rgba(0,0,0,.35)', transform: `rotate(-1.5deg)`, ...lineStyle(f, 0, out, 0)}}>
        <div style={{...big, fontSize: 66, color: INK, letterSpacing: -1.2, lineHeight: 1.1}}>Tayyor taqdimot —</div>
        <div style={{...big, fontSize: 66, color: INK, letterSpacing: -1.2, lineHeight: 1.1}}>buyurtma qiling</div>
      </div>
    </div>
  );
};

const WorldText: React.FC<{f: number; k: number}> = ({f, k}) => {
  const w = WORLDS[k];
  const from = STARTS[k] + 9;
  const to = (k < 2 ? STARTS[k + 1] : END) - 12;
  if (f < from || f > to + 8) return null;
  return (
    <div style={{position: 'absolute', left: 70, top: 880, width: 800, zIndex: 30}}>
      <div style={{display: 'inline-block', padding: '10px 22px 12px', borderRadius: 999, background: w.chipBg, color: w.chipText,
        fontFamily: HEAD, fontWeight: 700, fontSize: 38, letterSpacing: 4, marginBottom: 26, ...lineStyle(f, from, to, 0)}}>{w.subject}</div>
      {w.lines.map((line, i) => (
        <div key={i} style={{...big, fontSize: 112, color: w.text, marginTop: i ? 8 : 0, ...lineStyle(f, from, to, i + 1)}}>
          {i === w.mark ? <Mark f={f} at={from} color={w.accent}>{withQ(line)}</Mark> : withQ(line)}
        </div>
      ))}
    </div>
  );
};

const Magnifier: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    <circle cx={17} cy={17} r={11} fill="none" stroke={INK} strokeWidth={5} />
    <path d="M25 25 L35 35" stroke={INK} strokeWidth={6} strokeLinecap="round" />
  </svg>
);

const EndFan: React.FC<{f: number; still?: boolean}> = ({f, still}) => {
  const pos: [number, number, number][] = [[320, 470, -8], [760, 470, 8], [540, 440, 0]];
  const order = [0, 1, 2]; // quyosh left, suv right, marketing front
  const srcs = [COVERS[0], COVERS[1], COVERS[2]];
  return (
    <>
      {order.map((i) => {
        const t = still ? 1 : sp(f, END + 2 + i * 4, {damping: 15, stiffness: 110, mass: 0.8});
        const [cx, cy, rot] = pos[i];
        return <Slide key={srcs[i]} src={srcs[i]} width={540} cx={cx} cy={cy - (1 - t) * 700} rot={rot * t}
          style={{zIndex: 40 + i, opacity: Math.min(1, t * 1.5)}} />;
      })}
    </>
  );
};

const Ending: React.FC<{f: number; still?: boolean}> = ({f, still}) => {
  const t = still ? 1 : sp(f, END + 8, {damping: 13, stiffness: 130, mass: 0.7});
  const at = still ? 0 : END + 16;
  return (
    <>
      <div style={{position: 'absolute', left: 40, top: 712, width: 1000, height: 130, borderRadius: 65, background: WHITE, zIndex: 50,
        display: 'flex', alignItems: 'center', gap: 22, paddingLeft: 40, boxSizing: 'border-box',
        boxShadow: '0 24px 50px rgba(0,0,0,.45)', transform: `scale(${0.8 + 0.2 * t})`, opacity: Math.min(1, t * 1.4)}}>
        <Magnifier size={70} />
        <span style={{...big, fontSize: 80, letterSpacing: -1.5, color: INK}}>
          <span style={{color: '#e4572e'}}>@</span>TaqdimotKerakBot
        </span>
      </div>
      <div style={{position: 'absolute', left: 70, top: 920, width: 800, zIndex: 50}}>
        <div style={{...big, fontSize: 120, color: WHITE, ...lineStyle(f, at, undefined, 0)}}>Telegramda</div>
        <div style={{...big, fontSize: 120, color: WHITE, marginTop: 8, ...lineStyle(f, at, undefined, 1)}}>
          <Mark f={f} at={at} color={GOLD}>qidiring</Mark>
        </div>
      </div>
    </>
  );
};

const Video: React.FC = () => {
  useAssets();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: INK}}>
      <InkGround f={f} />
      {WORLDS.map((w, k) => {
        const G = GROUNDS[k];
        const e = k < 2 ? STARTS[k + 1] : END;
        if (f > e + WIPE) return null;
        return <Wipe key={k} f={f} at={STARTS[k]}><G f={f} w={w} /></Wipe>;
      })}
      <Wipe f={f} at={END}><InkGround f={f} /></Wipe>
      {f < STARTS[0] + 24 ? <HookFan f={f} /> : null}
      {WORLDS.map((_, k) => <WorldStack key={k} f={f} k={k} />)}
      <Hook f={f} />
      {WORLDS.map((_, k) => <WorldText key={k} f={f} k={k} />)}
      {f >= END ? <EndFan f={f} /> : null}
      {f >= END ? <Ending f={f} /> : null}
      <Audio src={staticFile(`audio/bed_${ID}.wav`)}
        volume={(fr) => interpolate(fr, [0, 10, FRAMES - 30, FRAMES], [0, 0.28, 0.28, 0], clamp)} />
      <Sequence from={STARTS[0] - 6}><Audio src={staticFile('audio/swipe.wav')} volume={0.16} /></Sequence>
      <Sequence from={END - 6}><Audio src={staticFile('audio/swipe.wav')} volume={0.12} /></Sequence>
    </AbsoluteFill>
  );
};

const Cover: React.FC = () => {
  useAssets();
  return (
    <AbsoluteFill style={{background: INK}}>
      <InkGround f={0} />
      <Slide src={COVERS[1]} width={600} cx={330} cy={1230} rot={-8} />
      <Slide src={COVERS[2]} width={600} cx={750} cy={1230} rot={8} />
      <Slide src={COVERS[0]} width={720} cx={540} cy={1290} />
      <div style={{position: 'absolute', left: 70, top: 330, width: 940}}>
        <div style={{...big, fontSize: 156, color: WHITE}}>Ertaga</div>
        <div style={{...big, fontSize: 156, color: WHITE}}>taqdimotmi?</div>
        <div style={{display: 'inline-block', marginTop: 34, padding: '18px 30px 22px', borderRadius: 26, background: GOLD, transform: 'rotate(-1.5deg)'}}>
          <div style={{...big, fontSize: 70, color: INK, letterSpacing: -1.2, lineHeight: 1.1}}>Tayyor taqdimot —</div>
          <div style={{...big, fontSize: 70, color: INK, letterSpacing: -1.2, lineHeight: 1.1}}>buyurtma qiling</div>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1560, textAlign: 'center', ...big, fontSize: 58, letterSpacing: -0.5, color: GOLD}}>
        @TaqdimotKerakBot
      </div>
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
