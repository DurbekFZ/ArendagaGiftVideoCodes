import '@fontsource/fraunces/900.css';
import '@fontsource/fraunces/900-italic.css';
import {Lottie} from '@remotion/lottie';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Freeze, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random,
  spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {BRAND, GiftData, H, W, clamp, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "GIPNOZ" — the Moon Pendant as a hypnotist's pendulum. Frame one: "Telegram sovg‘a · ijara", "OY KULONI",
// "kuniga 750 so‘m" and the pendant already swinging on its chain over slow concentric hypnosis rings.
// 1.3 s "Kulonga qarang…"; 4.9 s "Uchgacha sanayman"; the digits 1, 2, 3 arrive one by one while the swing
// dies down; at 9.0 s a finger snap: the pendant stops facing the viewer, the rings flash gold.
// "Endi siz uni xohlaysiz." Then "3–30 kun profilingizda", the price, the bot and the link. Silent, calm pad.
const ID = 'V20261121a';
const GIFT = 'moonpendant-95850'; // Ruby Core model 3%, Sapphire backdrop 1.2%, Phoenix symbol 0.5%; 750 so‘m a day
const SERIF = "'Fraunces', serif";
const SANS = "'Manrope', sans-serif";

// Palette. Background family: the gift's Sapphire backdrop (#58a3c8 / #5379c2 / #0d45b6) shifted one step toward
// violet and darkened to a night indigo (analogous); accent: the pendant's own gold (split-complementary to the
// indigo); neutral: warm cream and a near-black indigo ink. Extra hue: the ruby of the moon, only in tiny glints.
const NIGHT = '#0d0b2e';
const INDIGO = '#1d1a5c';
const INDIGO_MID = '#2c2a86';
const INDIGO_LIGHT = '#4a4fc4';
const GOLD = '#ffc24a';
const GOLD_DEEP = '#e08a1e';
const CREAM = '#fff4de';
const INK = '#0b0a24';
const RUBY = '#ff4f6d';

// Timeline (30 fps).
const STICK1 = 39; // 1.3 s "Kulonga qarang…"
const OPEN_OUT = 136; // 4.5 s opening leaves
const COUNT_HEAD = 146; // 4.9 s "Uchgacha sanayman"
const DIGITS = [180, 213, 246]; // 6.0, 7.1, 8.2 s
const SNAP = 270; // 9.0 s
const HEAD2 = 282; // 9.4 s "Endi siz uni xohlaysiz."
const HEAD2_OUT = 370; // 12.3 s
const LINE3 = 378; // 12.6 s "3–30 kun profilingizda"
const LINE3_OUT = 452; // 15.1 s
const PRICE = 462; // 15.4 s
const CTA = 492; // 16.4 s
const FRAMES = 585; // 19.5 s

// Pendulum geometry. The pivot hangs just under the headline; lower-half content is centred on x = 470.
const PX = 470;
const PY = 604;
const SIZE = 1000; // Lottie box; the visible disc is ~49% of it
const BOX_DROP = 470; // pivot → box centre
const BAIL = 0.3 * SIZE; // box centre → top of the bail
const DISC_DY = 0.035 * SIZE; // box centre → disc centre
const CX = PX;
const CY = PY + BOX_DROP + DISC_DY; // disc centre at rest (rings are centred here)

const useFonts = () => {
  const [handle] = useState(() => delayRender('fraunces'));
  useEffect(() => {
    Promise.all(['900 10px Fraunces', 'italic 900 10px Fraunces']
      .map((f) => document.fonts.load(f, 'OY KULONI Kulonga qarang… 750 so‘m 1 2 3')))
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

const out3 = Easing.out(Easing.cubic);
const ease = Easing.bezier(0.6, 0.02, 0.25, 1);
const popIn = (frame: number, fps: number, at: number) =>
  spring({frame: frame - at, fps, config: {damping: 14, stiffness: 170, mass: 0.7}});

/** Swing angle in degrees: a steady hypnotist's swing that dies down after the last digit and stops at the snap. */
const swing = (f: number) => {
  const period = 2.0 * 30;
  const amp = 17 * interpolate(f, [DIGITS[2] - 6, SNAP], [1, 0], {...clamp, easing: Easing.inOut(Easing.quad)});
  const base = amp * Math.sin((2 * Math.PI * f) / period + 2.5);
  // after the snap: a short, small settling wobble, then a barely-there breath
  const settle = f >= SNAP ? 2.2 * Math.exp(-(f - SNAP) / 14) * Math.sin((f - SNAP) / 3.2) + 0.9 * Math.sin((f - SNAP) / 26) : 0;
  return base + settle;
};

/** Which frame of the gift's own 180-frame animation to show. The pendant spins in it (36–132, narrow mid-turn);
 * frames 136–212 (mod 180) face the viewer. Hold those, rocking back and forth so the shine keeps moving, and let the
 * spin play once, fast, right at the finger snap. */
const giftFrame = (f: number) => {
  const pp = (x: number) => { const k = x % 128; return k < 64 ? k : 128 - k; };
  if (f < SNAP) return (140 + pp(f)) % 180;
  if (f < SNAP + 25) return 36 + (f - SNAP) * 4;
  return (140 + pp(f - SNAP - 25)) % 180;
};

/** Night indigo with slow concentric hypnosis rings centred on the pendant. `gold` tints them after the snap. */
const Background: React.FC<{gold: number; still?: boolean}> = ({gold, still}) => {
  const frame = useCurrentFrame();
  const f = still ? 0 : frame;
  const rings = Array.from({length: 16}, (_, k) => {
    const r = (k * 120 + f * 1.6) % 1920;
    return {r, k};
  });
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at ${CX}px ${CY}px, ${INDIGO_MID} 0%, ${INDIGO} 38%, ${NIGHT} 78%)`}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {rings.map(({r, k}) => {
          const fadeIn = interpolate(r, [60, 320], [0, 1], clamp);
          const fadeOut = interpolate(r, [1100, 1900], [1, 0], clamp);
          const color = gold > 0 ? mixColor(INDIGO_LIGHT, GOLD, gold) : INDIGO_LIGHT;
          return <circle key={k} cx={CX} cy={CY} r={r} fill="none" stroke={color} strokeWidth={30 + r * 0.03}
            opacity={(0.16 + gold * 0.22) * fadeIn * fadeOut} />;
        })}
      </svg>
      <div style={{position: 'absolute', left: CX - 520, top: CY - 520, width: 1040, height: 1040, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(255,194,74,${0.24 + gold * 0.3}) 0%, rgba(255,194,74,.08) 40%, rgba(255,194,74,0) 68%)`}} />
      {Array.from({length: 26}, (_, i) => {
        const rnd = (k: string) => random(`dust-${i}-${k}`);
        const x = rnd('x') * W;
        const y = (rnd('y') * H - f * (0.25 + rnd('v') * 0.5) + H) % H;
        const s = 4 + rnd('s') * 7;
        const tw = 0.3 + 0.7 * Math.abs(Math.sin(f / (14 + rnd('t') * 20) + i));
        const c = i % 7 === 0 ? RUBY : i % 2 ? GOLD : CREAM;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%',
          background: c, opacity: tw * 0.55, boxShadow: `0 0 ${s * 2}px ${c}`}} />;
      })}
    </AbsoluteFill>
  );
};

const mixColor = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
};

/** Chain plus the pendant (the gift's own looping animation), rotated as one around the pivot. */
const Pendulum: React.FC<{data: GiftData; angle: number; scale: number; glow: number; pose: number}> =
  ({data, angle, scale, glow, pose}) => {
  const chainLen = BOX_DROP - BAIL + 8;
  return (
    <div style={{position: 'absolute', left: PX, top: PY, width: 0, height: 0, transform: `rotate(${-angle}deg)`,
      transformOrigin: '0 0'}}>
      <svg width={40} height={chainLen + 10} style={{position: 'absolute', left: -20, top: -6, overflow: 'visible'}}>
        <line x1={20} y1={6} x2={20} y2={chainLen} stroke={GOLD_DEEP} strokeWidth={12} strokeLinecap="round"
          strokeDasharray="10 9" />
        <line x1={20} y1={6} x2={20} y2={chainLen} stroke={GOLD} strokeWidth={6} strokeLinecap="round" strokeDasharray="10 9" />
      </svg>
      <div style={{position: 'absolute', left: -26, top: -26, width: 52, height: 52, borderRadius: '50%',
        border: `10px solid ${GOLD}`, boxShadow: `0 0 18px rgba(255,194,74,.6), inset 0 0 0 3px ${GOLD_DEEP}`, background: INK}} />
      <div style={{position: 'absolute', left: -SIZE / 2, top: BOX_DROP - SIZE / 2, width: SIZE, height: SIZE,
        transform: `scale(${scale})`, transformOrigin: `50% ${50 - (BAIL / SIZE) * 100}%`,
        filter: `drop-shadow(0 34px 44px rgba(5,4,20,.55)) drop-shadow(0 0 ${30 + glow * 60}px rgba(255,194,74,${0.25 + glow * 0.45}))`}}>
        <Freeze frame={pose}>
          <Lottie animationData={data.gift} style={{width: SIZE, height: SIZE}} />
        </Freeze>
      </div>
    </div>
  );
};

/** Cream sticker with a gold edge, for the lines in the lower area. */
const Sticker: React.FC<{children: React.ReactNode; top: number; enter: number; leave?: number; rotate?: number}> =
  ({children, top, enter, leave = 0, rotate = -2}) => (
    <div style={{position: 'absolute', left: 70, top, opacity: Math.min(1, enter * 2) * (1 - leave),
      transform: `translateY(${(1 - enter) * 40 + leave * 30}px) rotate(${rotate * enter}deg) scale(${0.86 + 0.14 * enter})`,
      transformOrigin: 'left center'}}>
      <div style={{background: CREAM, borderRadius: 26, padding: '14px 36px 20px', boxShadow: `0 10px 0 ${GOLD_DEEP}, 0 22px 40px rgba(5,4,20,.5)`}}>
        {children}
      </div>
    </div>
  );

const Chip: React.FC<{children: React.ReactNode; bg: string; color: string}> = ({children, bg, color}) => (
  <div style={{background: bg, color, fontFamily: SANS, fontWeight: 800, fontSize: 34, letterSpacing: 3,
    padding: '10px 26px 12px', borderRadius: 999, whiteSpace: 'nowrap'}}>{children}</div>
);

const Opening: React.FC<{out: number; frame: number; still?: boolean}> = ({out, frame, still}) => {
  const {fps} = useVideoConfig();
  const s1 = still ? 1 : popIn(frame, fps, STICK1);
  const lift = -out * 260;
  return (
    <>
      <div style={{position: 'absolute', left: 70, top: 232 + lift, opacity: 1 - out, display: 'flex', gap: 12}}>
        <Chip bg={CREAM} color={INK}>TELEGRAM SOVG‘A</Chip>
        <Chip bg={GOLD} color={INK}>IJARA</Chip>
      </div>
      <div style={{position: 'absolute', left: 62, top: 296 + lift, opacity: 1 - out, fontFamily: SERIF, fontWeight: 900,
        fontSize: 138, lineHeight: 1.05, color: CREAM, whiteSpace: 'nowrap', letterSpacing: -2,
        textShadow: '0 8px 24px rgba(5,4,20,.6)'}}>
        OY <span style={{color: GOLD, fontStyle: 'italic'}}>KULONI</span>
      </div>
      <div style={{position: 'absolute', left: 70, top: 452 + lift, opacity: 1 - out, display: 'inline-flex', alignItems: 'baseline',
        gap: 14, background: 'rgba(11,10,36,.62)', border: `3px solid ${GOLD}`, borderRadius: 22, padding: '8px 26px 12px'}}>
        <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 44, color: CREAM}}>kuniga</span>
        <span style={{fontFamily: SERIF, fontWeight: 900, fontSize: 60, color: GOLD, whiteSpace: 'nowrap'}}>750 so‘m</span>
      </div>
      {(still || frame >= STICK1) && (
        <Sticker top={1404} enter={s1} leave={out} rotate={-2.5}>
          <div style={{fontFamily: SERIF, fontWeight: 900, fontStyle: 'italic', fontSize: 84, color: INK, whiteSpace: 'nowrap'}}>
            Kulonga qarang…</div>
        </Sticker>
      )}
    </>
  );
};

const Count: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const head = popIn(frame, fps, COUNT_HEAD);
  const leave = interpolate(frame, [SNAP + 2, SNAP + 12], [0, 1], {...clamp, easing: ease});
  return (
    <>
      <div style={{position: 'absolute', left: 66, top: 250 - leave * 60, opacity: Math.min(1, head * 2) * (1 - leave),
        transform: `translateY(${(1 - head) * 40}px)`, fontFamily: SERIF, fontWeight: 900, fontSize: 112, lineHeight: 1.04,
        color: CREAM, whiteSpace: 'nowrap', textShadow: '0 8px 24px rgba(5,4,20,.6)'}}>
        <div>Uchgacha</div>
        <div style={{color: GOLD, fontStyle: 'italic'}}>sanayman</div>
      </div>
      <div style={{position: 'absolute', left: 70, top: 1372, display: 'flex', gap: 30, opacity: 1 - leave}}>
        {DIGITS.map((at, i) => {
          const s = popIn(frame, fps, at);
          if (frame < at) return <div key={i} style={{width: 150}} />;
          return (
            <div key={i} style={{width: 150, height: 170, borderRadius: 34, background: i === 2 ? GOLD : CREAM,
              boxShadow: `0 10px 0 ${GOLD_DEEP}, 0 22px 40px rgba(5,4,20,.5)`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', transform: `scale(${0.6 + 0.4 * s}) translateY(${(1 - s) * 30}px)`, opacity: Math.min(1, s * 2)}}>
              <span style={{fontFamily: SERIF, fontWeight: 900, fontSize: 140, lineHeight: 1, color: INK, marginTop: -10}}>{i + 1}</span>
            </div>
          );
        })}
      </div>
    </>
  );
};

const After: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const h = popIn(frame, fps, HEAD2);
  const hOut = interpolate(frame, [HEAD2_OUT, HEAD2_OUT + 10], [0, 1], {...clamp, easing: ease});
  const l = popIn(frame, fps, LINE3);
  const lOut = interpolate(frame, [LINE3_OUT, LINE3_OUT + 10], [0, 1], {...clamp, easing: ease});
  return (
    <>
      {frame >= HEAD2 && hOut < 1 && (
        <div style={{position: 'absolute', left: 66, top: 250 - hOut * 60, opacity: Math.min(1, h * 2) * (1 - hOut),
          transform: `translateY(${(1 - h) * 40}px)`, fontFamily: SERIF, fontWeight: 900, fontSize: 104, lineHeight: 1.06,
          color: CREAM, whiteSpace: 'nowrap', textShadow: '0 8px 24px rgba(5,4,20,.6)'}}>
          <div>Endi siz uni</div>
          <div style={{color: GOLD, fontStyle: 'italic'}}>xohlaysiz.</div>
        </div>
      )}
      {frame >= LINE3 && lOut < 1 && (
        <Sticker top={1384} enter={l} leave={lOut} rotate={-1.5}>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 54, lineHeight: 1.2, color: INK, whiteSpace: 'nowrap'}}>
            <span style={{fontFamily: SERIF, fontWeight: 900, fontSize: 64, color: GOLD_DEEP}}>3–30 kun</span><br />profilingizda
          </div>
        </Sticker>
      )}
    </>
  );
};

const Offer: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const p = popIn(frame, fps, PRICE);
  const c = popIn(frame, fps, CTA);
  return (
    <>
      <div style={{position: 'absolute', left: 70, top: 232, opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * -30}px)`,
        display: 'flex', gap: 12}}>
        <Chip bg={CREAM} color={INK}>MOON PENDANT</Chip>
        <Chip bg={GOLD} color={INK}>IJARA</Chip>
      </div>
      <div style={{position: 'absolute', left: 66, top: 300, opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * 40}px)`}}>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 50, color: CREAM, lineHeight: 1}}>kuniga atigi</div>
        <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 150, lineHeight: 1.04, color: GOLD, whiteSpace: 'nowrap',
          textShadow: '0 8px 24px rgba(5,4,20,.6)'}}>
          750 <span style={{color: CREAM, fontStyle: 'italic'}}>so‘m</span></div>
      </div>
      {frame >= CTA && (
        <div style={{position: 'absolute', left: 70, top: 1372, opacity: Math.min(1, c * 2), transform: `translateY(${(1 - c) * 40}px)`}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 18, padding: '12px 36px 12px 12px', borderRadius: 999,
            background: CREAM, boxShadow: `0 10px 0 ${GOLD_DEEP}, 0 22px 40px rgba(5,4,20,.5)`}}>
            <Img src={staticFile('logo.png')} style={{width: 80, height: 80, borderRadius: '50%', background: BRAND.ink}} />
            <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 48, color: INK}}>{BRAND.bot}</span>
          </div>
          <div style={{marginTop: 22, fontFamily: SANS, fontWeight: 800, fontSize: 52, color: CREAM,
            transform: `translateY(${-Math.abs(Math.sin(frame / 7)) * 8}px)`}}>↑ Havola profilda</div>
        </div>
      )}
    </>
  );
};

/** Gold flash ring bursting from the pendant at the snap. */
const Burst: React.FC<{frame: number}> = ({frame}) => {
  const t = frame - SNAP;
  if (t < 0 || t > 30) return null;
  return (
    <>
      {[0, 6, 12].map((d) => {
        const k = (t - d) / 22;
        if (k < 0 || k > 1) return null;
        const r = 260 + out3(k) * 900;
        return <div key={d} style={{position: 'absolute', left: CX - r, top: CY - r, width: r * 2, height: r * 2, borderRadius: '50%',
          border: `${14 * (1 - k) + 2}px solid ${GOLD}`, opacity: (1 - k) * 0.8}} />;
      })}
      <AbsoluteFill style={{background: CREAM, opacity: interpolate(t, [0, 2, 10], [0, 0.35, 0], clamp)}} />
    </>
  );
};

const Scene: React.FC<{data: GiftData; frame: number; still?: boolean}> = ({data, frame, still}) => {
  const outA = still ? 0 : interpolate(frame, [OPEN_OUT, OPEN_OUT + 12], [0, 1], {...clamp, easing: ease});
  const gold = still ? 0 : interpolate(frame, [SNAP, SNAP + 3, SNAP + 70], [0, 1, 0.25], clamp);
  const angle = still ? -7 : swing(frame);
  const scale = still ? 1 : 1 + 0.1 * interpolate(frame, [SNAP, SNAP + 8, SNAP + 30], [0, 1, 0.6], {...clamp, easing: out3});
  return (
    <AbsoluteFill>
      <Background gold={gold} still={still} />
      <Pendulum data={data} angle={angle} scale={scale} glow={gold} pose={still ? 0 : giftFrame(frame)} />
      {!still && <Burst frame={frame} />}
      {outA < 1 && <Opening out={outA} frame={frame} still={still} />}
      {!still && frame >= COUNT_HEAD && frame < SNAP + 14 && <Count frame={frame} />}
      {!still && frame >= HEAD2 && frame < PRICE && <After frame={frame} />}
      {!still && frame >= PRICE && <Offer frame={frame} />}
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
      <Sequence from={SNAP - 1}><Audio src={staticFile('audio/fingersnap.wav')} volume={0.32} /></Sequence>
      {[OPEN_OUT, HEAD2_OUT, LINE3_OUT].map((at) => (
        <Sequence key={at} from={at}><Audio src={staticFile('audio/whoosh.wav')} volume={0.07} /></Sequence>
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
      <Scene data={gifts[0]} frame={0} still />
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
