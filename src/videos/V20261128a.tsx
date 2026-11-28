import '@fontsource/anton/400.css';
import {Lottie} from '@remotion/lottie';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random,
  staticFile, useCurrentFrame,
} from 'remotion';
import {BODY, GiftData, W, clamp, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "MUZ" — Vice Cream #48461 (Sub-Zero model) frozen inside a block of ice.
// Frame one already reads "Telegram NFT sovg‘a ijarasi / Kuniga 750 so‘m" under a huge ice cup locked in a clear
// ice block; at 0.4 s cracks run across the block and at 0.9 s it breaks into shards that fly out, a cold mist puffs
// and the cup is free. Then three calm blocks in the lower text column: "Vice Cream / Bunny belgisi — atigi 0,3%",
// "Profilingizda turadi / 3 kundan 30 kungacha", then the price, the bot and the link.
// Layout differs from the recent videos: the gift sits high and centred, the words live below it.
const ID = 'V20261128a';
const GIFT = 'vicecream-48461'; // Sub-Zero 1.5%, Tactical Pine backdrop 1.5%, Bunny symbol 0.3%; 750 so‘m a day
const HEAD = "'Anton', sans-serif";

// Palette. Gift: pale ice blue cup and white frost. Background family: pine green (the gift's own Tactical Pine
// backdrop, #44826b / #2f6369, deepened). Accent: ice cyan taken from the cup (analogous: green → teal → blue).
// Neutral: frost white and pine ink. No extra hue.
const PN_1 = '#2c6a5c';
const PN_2 = '#1b4842';
const PN_3 = '#0b2624';
const ICE = '#9fe6ff';
const ICE_D = '#4fb5dc';
const FROST = '#effbff';
const INK = '#06201e';

// Timeline (30 fps).
const CRACK = 10; // cracks start running
const BREAK = 27; // the block shatters
const OPEN_OUT = 126;
const A_IN = 136;
const A_OUT = 262;
const B_IN = 274;
const B_OUT = 396;
const P_IN = 406;
const C_IN = 444;
const FRAMES = 560; // 18.7 s

// Gift box: the cup fills ~29–70% across and ~19–80% down, so a 1150 px box shows a cup ~470 x 700 px.
const GS = 1150;
const GX = 540;
const GY = 610;
// The ice block around it.
const BX0 = 262;
const BX1 = 818;
const BY0 = 232;
const BY1 = 1000;
const IMPACT = {x: 610, y: 520};

const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([`400 10px Anton`, `800 10px Manrope`]
      .map((font) => document.fonts.load(font, 'KUNIGA 750 SO‘M o‘g‘ — ↑ 0,3% VICE CREAM Profilingizda @ArendagaGiftBot')))
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

/** Text "freezes in": it sharpens from a light blur and settles from 106% (10 frames); it leaves by blurring away (7 frames). */
const block = (f: number, from: number, to?: number) => {
  const t = interpolate(f, [from, from + 10], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const o = to === undefined ? 0 : interpolate(f, [to, to + 7], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  return {opacity: Math.min(1, t * 1.3) * (1 - o), filter: `blur(${(1 - t) * 10 + o * 12}px)`,
    transform: `scale(${1 + (1 - t) * 0.06 + o * 0.03})`, transformOrigin: '0% 50%'};
};
const shown = (f: number, from: number, to?: number) => f >= from && (to === undefined || f < to + 7);

/** Pine-green backdrop with a cold glow behind the cup and slow diagonal light bands. */
const Pine: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 62% at 50% 34%, ${PN_1} 0%, ${PN_2} 55%, ${PN_3} 100%)`, overflow: 'hidden'}}>
    <AbsoluteFill style={{opacity: 0.07,
      background: `repeating-linear-gradient(115deg, ${FROST} 0px, ${FROST} 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 140px)`,
      backgroundPosition: `${f * 0.6}px 0px`}} />
    <div style={{position: 'absolute', left: GX - 520, top: GY - 520, width: 1040, height: 1040, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(170,235,255,.28) 0%, rgba(170,235,255,.08) 45%, rgba(170,235,255,0) 70%)',
      opacity: 0.85 + Math.sin(f / 28) * 0.15}} />
  </AbsoluteFill>
);

/** Frost ferns growing in the right-hand corners and the bottom-left corner, away from the text column. */
const Fern: React.FC<{x: number; y: number; angle: number; f: number; at: number; scale?: number; seed: string}> =
  ({x, y, angle, f, at, scale = 1, seed}) => {
    const grow = interpolate(f, [at, at + 50], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});
    const paths: string[] = [];
    const branch = (x0: number, y0: number, a: number, len: number, depth: number, key: string) => {
      const x1 = x0 + Math.cos(a) * len;
      const y1 = y0 + Math.sin(a) * len;
      paths.push(`M${x0.toFixed(1)} ${y0.toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)}`);
      if (depth === 0) return;
      const n = 3;
      for (let i = 1; i <= n; i++) {
        const k = i / (n + 1);
        const bx = x0 + (x1 - x0) * k;
        const by = y0 + (y1 - y0) * k;
        const j = random(`${seed}-${key}-${i}`) * 0.3;
        branch(bx, by, a - 0.9 - j, len * 0.42, depth - 1, `${key}${i}l`);
        branch(bx, by, a + 0.9 + j, len * 0.42, depth - 1, `${key}${i}r`);
      }
    };
    for (let i = 0; i < 4; i++) branch(0, 0, (i - 1.5) * 0.42, 300, 2, `s${i}`);
    return (
      <svg width={W} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
          {paths.map((d, i) => (
            <path key={i} d={d} stroke={FROST} strokeOpacity={0.34} strokeWidth={i % 13 === 0 ? 4 : 2.5} strokeLinecap="round"
              fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - grow} />
          ))}
        </g>
      </svg>
    );
  };

/** Fine snow drifting down; it stays out of the lower text column (x < 880, 1000 < y < 1580). */
const Snow: React.FC<{f: number}> = ({f}) => (
  <>
    {Array.from({length: 42}, (_, i) => {
      const r = (k: string) => random(`snow-${i}-${k}`);
      const life = 300 + r('l') * 260;
      const t = ((f + r('o') * life) % life) / life;
      const x = r('x') * W + Math.sin(f / 40 + i) * 18;
      const y = -40 + t * 2000;
      const inColumn = x < 900 && y > 980 && y < 1600;
      const s = 5 + r('s') * 9;
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%',
        background: FROST, opacity: inColumn ? 0 : 0.25 + r('a') * 0.45, filter: s > 11 ? 'blur(1.5px)' : undefined}} />;
    })}
  </>
);

// The block cut into jittered cells, each split into two triangles: these are the shards that fly out at BREAK.
const COLS = 4;
const ROWS = 5;
const vtx = (c: number, r: number) => {
  const edgeX = c === 0 || c === COLS;
  const edgeY = r === 0 || r === ROWS;
  const jx = edgeX ? 0 : (random(`vx-${c}-${r}`) - 0.5) * 80;
  const jy = edgeY ? 0 : (random(`vy-${c}-${r}`) - 0.5) * 80;
  return {x: BX0 + ((BX1 - BX0) / COLS) * c + jx, y: BY0 + ((BY1 - BY0) / ROWS) * r + jy};
};
const SHARDS = (() => {
  const out: {pts: {x: number; y: number}[]; cx: number; cy: number; vx: number; vy: number; spin: number}[] = [];
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const a = vtx(c, r), b = vtx(c + 1, r), d = vtx(c + 1, r + 1), e = vtx(c, r + 1);
      const flip = random(`fl-${c}-${r}`) > 0.5;
      const tris = flip ? [[a, b, d], [a, d, e]] : [[a, b, e], [b, d, e]];
      tris.forEach((pts, k) => {
        const cx = (pts[0].x + pts[1].x + pts[2].x) / 3;
        const cy = (pts[0].y + pts[1].y + pts[2].y) / 3;
        const dx = cx - GX;
        const dy = cy - (GY - 40);
        const len = Math.hypot(dx, dy) || 1;
        const sp = 26 + random(`sp-${c}-${r}-${k}`) * 22;
        out.push({pts, cx, cy, vx: (dx / len) * sp, vy: (dy / len) * sp - 10, spin: (random(`rt-${c}-${r}-${k}`) - 0.5) * 22});
      });
    }
  }
  return out;
})();

const ICE_FILL = 'rgba(205,244,255,0.22)';

/** The intact ice block: clear face, frosted rim, highlight streaks, and cracks running from the impact point. */
const Block: React.FC<{f: number}> = ({f}) => {
  if (f >= BREAK) return null;
  const crack = interpolate(f, [CRACK, BREAK - 2], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});
  const shake = f >= CRACK ? Math.sin(f * 2.1) * 3 * crack : 0;
  const cracks = Array.from({length: 7}, (_, i) => {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    let x = IMPACT.x;
    let y = IMPACT.y;
    let d = `M${x} ${y}`;
    for (let s = 0; s < 6; s++) {
      const aa = a + (random(`ck-${i}-${s}`) - 0.5) * 0.9;
      x = Math.min(BX1, Math.max(BX0, x + Math.cos(aa) * 80));
      y = Math.min(BY1, Math.max(BY0, y + Math.sin(aa) * 80));
      d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  });
  return (
    <svg width={W} height={1920} style={{position: 'absolute', inset: 0, transform: `translateX(${shake}px)`}}>
      <defs>
        <linearGradient id="iceface" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity={0.34} />
          <stop offset="0.35" stopColor="#d6f6ff" stopOpacity={0.12} />
          <stop offset="0.7" stopColor="#bdefff" stopOpacity={0.1} />
          <stop offset="1" stopColor="#ffffff" stopOpacity={0.26} />
        </linearGradient>
      </defs>
      <rect x={BX0} y={BY0} width={BX1 - BX0} height={BY1 - BY0} rx={48} fill="url(#iceface)"
        stroke={FROST} strokeOpacity={0.75} strokeWidth={6} />
      <rect x={BX0 + 18} y={BY0 + 18} width={BX1 - BX0 - 36} height={BY1 - BY0 - 36} rx={34} fill="none"
        stroke={FROST} strokeOpacity={0.25} strokeWidth={14} />
      <path d={`M${BX0 + 60} ${BY0 + 120} L${BX0 + 60} ${BY1 - 200}`} stroke="#fff" strokeOpacity={0.55} strokeWidth={16} strokeLinecap="round" />
      <path d={`M${BX0 + 100} ${BY0 + 80} L${BX0 + 220} ${BY0 + 80}`} stroke="#fff" strokeOpacity={0.5} strokeWidth={12} strokeLinecap="round" />
      <path d={`M${BX1 - 60} ${BY1 - 260} L${BX1 - 60} ${BY1 - 120}`} stroke="#fff" strokeOpacity={0.35} strokeWidth={10} strokeLinecap="round" />
      {cracks.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#fff" strokeOpacity={0.95} strokeWidth={5} strokeLinejoin="round"
          pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - crack} />
      ))}
      {f >= CRACK && <circle cx={IMPACT.x} cy={IMPACT.y} r={10 + crack * 16} fill="#fff" opacity={0.85 * (1 - crack * 0.4)} />}
    </svg>
  );
};

/** The shards after BREAK: they fly out from the cup, spin, fall and melt away within ~0.8 s (never into the text column). */
const Shards: React.FC<{f: number}> = ({f}) => {
  if (f < BREAK || f > BREAK + 30) return null;
  const k = f - BREAK;
  return (
    <svg width={W} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      {SHARDS.map((s, i) => {
        const tx = s.vx * k;
        const ty = s.vy * k + 1.4 * k * k;
        const y = s.cy + ty;
        const fade = interpolate(k, [10, 28], [1, 0], clamp) * interpolate(y, [880, 980], [1, 0], clamp);
        if (fade <= 0) return null;
        const d = `M${s.pts.map((p) => `${(p.x - s.cx).toFixed(1)} ${(p.y - s.cy).toFixed(1)}`).join(' L')} Z`;
        return (
          <g key={i} transform={`translate(${s.cx + tx} ${y}) rotate(${s.spin * k})`} opacity={fade}>
            <path d={d} fill={ICE_FILL} stroke={FROST} strokeOpacity={0.85} strokeWidth={4} strokeLinejoin="round" />
            <path d={d} fill="#fff" opacity={0.12} transform="scale(.55)" />
          </g>
        );
      })}
    </svg>
  );
};

/** Cold mist puffing out of the broken block, behind and around the cup. */
const Mist: React.FC<{f: number; at: number; strength?: number}> = ({f, at, strength = 1}) => {
  const k = f - at;
  if (k < 0 || k > 50) return null;
  const t = k / 50;
  return (
    <div style={{position: 'absolute', left: GX - 600 * (0.6 + t), top: GY - 420 * (0.6 + t), width: 1200 * (0.6 + t),
      height: 840 * (0.6 + t), borderRadius: '50%',
      background: 'radial-gradient(ellipse, rgba(235,250,255,.55) 0%, rgba(235,250,255,.18) 45%, rgba(235,250,255,0) 70%)',
      opacity: strength * Math.sin(Math.PI * Math.min(1, t * 1.6 + 0.05)) * (1 - t * 0.4)}} />
  );
};

/** A frost ring that expands behind the cup at each new block. */
const Halo: React.FC<{f: number; at: number}> = ({f, at}) => {
  const k = f - at;
  if (k < 0 || k > 40) return null;
  const t = Easing.out(Easing.cubic)(k / 40);
  const r = 260 + t * 170; // stays above the text column (bottom edge < 1000)
  return <div style={{position: 'absolute', left: GX - r, top: GY - 30 - r, width: r * 2, height: r * 2, borderRadius: '50%',
    border: `6px solid ${ICE}`, opacity: 0.55 * (1 - k / 40)}} />;
};

/** The cup itself. It is frozen in the block until BREAK, then pops free and floats. */
const Cup: React.FC<{data: GiftData; f: number}> = ({data, f}) => {
  const pop = f < BREAK ? 1 : 1 + 0.06 * Math.sin(Math.min(1, (f - BREAK) / 14) * Math.PI) * Math.exp(-(f - BREAK) / 30);
  const hop = f >= P_IN && f < P_IN + 24 ? -Math.sin(((f - P_IN) / 24) * Math.PI) * 40 : 0;
  const bob = f < BREAK ? 0 : Math.sin((f - BREAK) / 22) * 9;
  return (
    <div style={{position: 'absolute', left: GX - GS / 2, top: GY - GS / 2 + bob + hop, width: GS, height: GS,
      transform: `scale(${pop})`, filter: 'drop-shadow(0 30px 34px rgba(3,24,22,.55))'}}>
      <Lottie animationData={data.gift} loop style={{width: GS, height: GS}} />
    </div>
  );
};

const Pill: React.FC<{text: string}> = ({text}) => (
  <div style={{display: 'inline-block', padding: '12px 26px', borderRadius: 999, background: ICE,
    fontFamily: BODY, fontWeight: 800, fontSize: 36, letterSpacing: 1.5, color: INK}}>{text}</div>
);

const Price: React.FC = () => (
  <>
    <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 62, color: FROST, lineHeight: 1}}>Kuniga</div>
    <div style={{marginTop: 4, fontFamily: HEAD, fontSize: 214, color: FROST, lineHeight: 1.02, whiteSpace: 'nowrap',
      letterSpacing: 2, textShadow: `0 8px 0 ${INK}`}}>750 <span style={{color: ICE}}>SO‘M</span></div>
  </>
);

const Video: React.FC = () => {
  useFonts();
  const gifts = useGifts([GIFT]);
  const f = useCurrentFrame();
  if (!gifts) return null;
  const [data] = gifts;

  return (
    <AbsoluteFill style={{background: PN_2, overflow: 'hidden'}}>
      <Pine f={f} />
      <Fern x={W + 20} y={-30} angle={130} f={f} at={BREAK} seed="tr" />
      <Fern x={W + 30} y={1940} angle={-130} f={f} at={B_IN - 20} scale={1.1} seed="br" />
      <Fern x={-30} y={1950} angle={-50} f={f} at={A_IN - 20} scale={0.9} seed="bl" />
      <Snow f={f} />
      <Mist f={f} at={BREAK - 2} />
      <Halo f={f} at={A_IN} />
      <Halo f={f} at={B_IN} />
      <Halo f={f} at={P_IN} />
      <Cup data={data} f={f} />
      <Block f={f} />
      <Shards f={f} />

      {shown(f, 0, OPEN_OUT) && (
        <div style={{position: 'absolute', left: 70, top: 1040, ...block(f, -10, OPEN_OUT)}}>
          <Pill text="TELEGRAM NFT SOVG‘A IJARASI" />
          <div style={{marginTop: 26}}><Price /></div>
        </div>
      )}

      {shown(f, A_IN, A_OUT) && (
        <div style={{position: 'absolute', left: 70, top: 1060, ...block(f, A_IN, A_OUT)}}>
          <div style={{fontFamily: HEAD, fontSize: 150, color: FROST, lineHeight: 1, letterSpacing: 2}}>VICE CREAM</div>
          <div style={{marginTop: 26, fontFamily: BODY, fontWeight: 800, fontSize: 58, color: FROST, lineHeight: 1.1}}>Bunny belgisi —</div>
          <div style={{marginTop: 10, fontFamily: HEAD, fontSize: 140, color: ICE, lineHeight: 1, letterSpacing: 2}}>ATIGI 0,3%</div>
        </div>
      )}

      {shown(f, B_IN, B_OUT) && (
        <div style={{position: 'absolute', left: 70, top: 1060, ...block(f, B_IN, B_OUT)}}>
          <div style={{fontFamily: HEAD, fontSize: 132, color: FROST, lineHeight: 1.02, letterSpacing: 2}}>
            PROFILINGIZDA<br />TURADI
          </div>
          <div style={{marginTop: 30, display: 'inline-block', padding: '14px 30px', borderRadius: 999, background: ICE,
            fontFamily: BODY, fontWeight: 800, fontSize: 54, color: INK}}>3 kundan 30 kungacha</div>
        </div>
      )}

      {shown(f, P_IN) && (
        <div style={{position: 'absolute', left: 70, top: 1010, ...block(f, P_IN)}}><Price /></div>
      )}
      {shown(f, C_IN) && (
        <div style={{position: 'absolute', left: 70, top: 1350, ...block(f, C_IN)}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 18, padding: '12px 32px 12px 12px', borderRadius: 999,
            background: FROST, boxShadow: `0 8px 0 ${ICE_D}`}}>
            <Img src={staticFile('logo.png')} style={{width: 68, height: 68, borderRadius: '50%', background: INK}} />
            <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 52, color: INK, lineHeight: 1}}>@ArendagaGiftBot</div>
          </div>
          <div style={{marginTop: 24, fontFamily: BODY, fontWeight: 800, fontSize: 46, color: FROST}}>↑ Havola profilda</div>
        </div>
      )}

      <Audio src={staticFile(`audio/bed_${ID}.wav`)}
        volume={(fr) => interpolate(fr, [0, 12, FRAMES - 30, FRAMES], [0, 0.3, 0.3, 0], clamp)} />
      <Sequence from={CRACK - 4}><Audio src={staticFile('audio/icecrack.wav')} volume={0.34} /></Sequence>
      <Sequence from={BREAK + 2}><Audio src={staticFile('audio/frost.wav')} volume={0.12} /></Sequence>
    </AbsoluteFill>
  );
};

const Cover: React.FC = () => {
  useFonts();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  const [data] = gifts;
  return (
    <AbsoluteFill style={{background: PN_2, overflow: 'hidden'}}>
      <Pine f={0} />
      <Fern x={W + 20} y={-30} angle={130} f={200} at={0} seed="tr" />
      <Fern x={-30} y={1950} angle={-50} f={200} at={0} scale={0.9} seed="bl" />
      <Mist f={BREAK + 14} at={BREAK} strength={0.7} />
      <Cup data={data} f={0} />
      <div style={{position: 'absolute', left: 70, top: 1040}}>
        <Pill text="TELEGRAM NFT SOVG‘A IJARASI" />
        <div style={{marginTop: 26}}><Price /></div>
      </div>
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
