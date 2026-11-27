import '@fontsource/bricolage-grotesque/800.css';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, spring,
  staticFile, useCurrentFrame,
} from 'remotion';
import {BODY, clamp} from '../kit';
import type {CustomVideo} from './registry';

// "VARAQLASH" — second @TaqdimotKerakBot video. The medicine deck "Sifatni oshirish sikli" (pvid) is flipped
// through like a stack of cards on a saturated teal-green ground taken from the deck's own wheel.
// Frame one: the pvid title slide upright and almost full width, with "Tayyor taqdimot / buyurtma qiling"
// below; from 1 s the slide flips over to the PVID wheel slides, one every ~1.4 s. Then the stack grows to the
// full frame width ("Slaydlar matni bilan tayyor"), opens into a fan with two other real samples ("Botga kiring,
// narxlarni ko‘ring"), and the ending writes @TaqdimotKerakBot large with "Telegramda qidiring".
// A big four-arc ring (the deck's cycle motif, in tonal teals with one amber arc) turns in the lower right.
const ID = 'V20261127b';
const HEAD = "'Bricolage Grotesque', sans-serif";

// Palette. Deck: deep ink teal #0e343f slides, wheel arcs teal #0e8b79, amber #c67813, red, blue, white cards.
// Background family: the wheel's teal-green, saturated (so the dark title slide stands out from it).
// Accent: amber (the wheel's own amber, brightened; near-complementary to the teal). Neutral: the deck's ink
// teal and white. No extra hue.
const BG_1 = '#13a48c';
const BG_2 = '#0b7a69';
const BG_3 = '#075a4f';
const INK = '#0e343f';
const AMBER = '#f4a93a';
const WHITE = '#ffffff';
const MINT = '#bff0e3';

// Timeline (30 fps).
const B1 = 138; // "Slaydlar matni bilan tayyor"
const B2 = 264; // "Botga kiring, narxlarni ko‘ring"
const CTA = 396;
const FRAMES = 561; // 18.7 s

// The flipped stack: [slide, frame at which it becomes the front].
const STACK: [string, number][] = [
  ['pvid/01', 0], ['pvid/06', 30], ['pvid/10', 72], ['pvid/11', 112], ['pvid/12', 150], ['pvid/14', 206],
];
const FLIP = 12; // frames per flip
// The fan in block 2 and the ending: [slide, x offset, rotation].
const FAN: [string, number, number][] = [
  ['islom/01', -170, -7], ['jahon/01', 170, 7], ['pvid/15', 0, 0],
];
const ALL = [...STACK.map((s) => s[0]), ...FAN.map((s) => s[0])];

const RATIO = 899 / 1600;
const Q: React.FC = () => <span style={{margin: '0 -0.06em 0 -0.03em'}}>‘</span>;

const useAssets = () => {
  const [handle] = useState(() => delayRender('assets'));
  useEffect(() => {
    const images = ALL.map((s) => new Promise((resolve) => {
      const img = new Image(); img.onload = resolve; img.onerror = resolve; img.src = staticFile(`taqdimot/${s}.jpg`);
    }));
    Promise.all([...[`800 10px 'Bricolage Grotesque'`, `800 10px Manrope`]
      .map((font) => document.fonts.load(font, 'Tayyor taqdimot ko‘ring @TaqdimotKerakBot')), ...images])
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

const ease = Easing.out(Easing.cubic);
const sp = (f: number, at: number, config = {damping: 16, stiffness: 120, mass: 0.8}) =>
  spring({frame: f - at, fps: 30, config});
/** Text block: slides in from the left over 9 frames, fades out over 6. */
const block = (f: number, from: number, to?: number) => {
  const t = from <= 0 ? 1 : interpolate(f, [from, from + 9], [0, 1], {...clamp, easing: ease});
  const o = to === undefined ? 1 : interpolate(f, [to, to + 6], [1, 0], clamp);
  return {opacity: t * o, transform: `translateX(${(1 - t) * -60}px)`};
};
const shown = (f: number, from: number, to?: number) => f >= from && (to === undefined || f < to + 6);

/** Saturated teal ground with a slow light field and fine diagonal lines. */
const Ground: React.FC<{f: number}> = ({f}) => {
  const gx = 30 + 14 * Math.sin(f / 80);
  const gy = 22 + 8 * Math.cos(f / 64);
  return (
    <AbsoluteFill style={{background: BG_2}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 55% at ${gx}% ${gy}%, ${BG_1} 0%, ${BG_2} 62%, ${BG_3} 100%)`}} />
      <AbsoluteFill style={{backgroundImage: `repeating-linear-gradient(135deg, rgba(255,255,255,.045) 0 2px, transparent 2px 38px)`,
        backgroundPosition: `${(f * 0.6) % 54}px 0px`}} />
    </AbsoluteFill>
  );
};

/** The deck's cycle motif: four thick arcs with arrow tips, tonal teal with one amber arc, turning slowly. */
const Cycle: React.FC<{cx: number; cy: number; r: number; f: number; speed?: number; opacity?: number}> =
  ({cx, cy, r, f, speed = 0.35, opacity = 1}) => {
    const w = r * 0.36;
    const colors = [AMBER, '#2cc3a6', '#0a6a5c', MINT];
    const arcs = [0, 1, 2, 3].map((k) => {
      const a0 = (k * 90 + 6) * Math.PI / 180;
      const a1 = (k * 90 + 78) * Math.PI / 180;
      const ro = r; const ri = r - w; const rm = r - w / 2;
      const tip = (k * 90 + 88) * Math.PI / 180;
      const p = (rad: number, a: number) => `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`;
      return (
        <path key={k} fill={colors[k]}
          d={`M${p(ro, a0)} A${ro},${ro} 0 0 1 ${p(ro + w * 0.18, a1)} L${p(rm, tip)} L${p(ri - w * 0.18, a1)} A${ri},${ri} 0 0 0 ${p(ri, a0)} Z`} />
      );
    });
    return (
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity}}>
        <g transform={`rotate(${f * speed} ${cx} ${cy})`}>{arcs}</g>
      </svg>
    );
  };

const Slide: React.FC<{src: string; width: number; style?: React.CSSProperties}> = ({src, width, style}) => (
  <div style={{position: 'absolute', width, height: width * RATIO, borderRadius: 18, overflow: 'hidden', background: WHITE,
    boxShadow: '0 30px 60px rgba(4,40,35,.45), 0 6px 14px rgba(4,40,35,.3)', ...style}}>
    <Img src={staticFile(`taqdimot/${src}.jpg`)} style={{width: '100%', height: '100%', display: 'block'}} />
  </div>
);

/** Geometry of the front slide over time: 940 wide at the top, full width in block 1, back for block 2. */
const frontBox = (f: number) => {
  const grow = sp(f, B1 - 2, {damping: 18, stiffness: 90, mass: 0.9}) - sp(f, B2 - 4, {damping: 18, stiffness: 100, mass: 0.9});
  const w = 940 + (1080 - 940) * grow;
  const x = 540 - w / 2;
  const y = 250 + 20 * grow;
  return {w, x, y, grow};
};

/** The flip stack. Each card turns over around its horizontal centre line and reveals the next one. */
const Stack: React.FC<{f: number}> = ({f}) => {
  const {w, x, y, grow} = frontBox(f);
  const h = w * RATIO;
  // Which card is in front, and how far the current flip has gone.
  let idx = 0;
  STACK.forEach(([, at], i) => { if (f >= at) idx = i; });
  const next = STACK[idx + 1];
  const flipT = next ? interpolate(f, [next[1] - FLIP, next[1]], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)}) : 0;
  const leave = interpolate(f, [B2 - 8, B2 + 1], [1, 0], clamp);
  if (leave <= 0) return null;
  const peek = 1 - grow; // cards peeking behind the front, hidden while full width
  const open = sp(f, 0, {damping: 14, stiffness: 110, mass: 0.7});
  const front = STACK[idx][0];
  const under = next ? next[0] : null;
  const behind = STACK.slice(idx + (next ? 2 : 1), idx + 4).map((s) => s[0]);
  // First half of a flip: front card folds away (rotateX 0 → 90). Second half: next card unfolds (−90 → 0).
  const a = flipT < 0.5 ? flipT * 2 * 90 : 90;
  const b = flipT < 0.5 ? -90 : (1 - (flipT - 0.5) * 2) * 90;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, opacity: leave, perspective: 2200}}>
      {behind.map((src, k) => {
        const side = k % 2 === 0 ? 1 : -1;
        return (
          <Slide key={src} src={src} width={w} style={{left: x, top: y, zIndex: 1 - k, opacity: peek,
            transform: `translate(${side * 24 * open}px, ${-18 * (k + 1) * open}px) rotate(${side * (3.5 + 2 * k) * open}deg) scale(${1 - 0.05 * (k + 1)})`}} />
        );
      })}
      {under && flipT >= 0.5 ? (
        <Slide key={under} src={under} width={w} style={{left: x, top: y, zIndex: 5, transformOrigin: '50% 50%',
          transform: `rotateX(${-b}deg)`}} />
      ) : null}
      {flipT < 0.5 ? (
        <Slide key={front} src={front} width={w} style={{left: x, top: y, zIndex: 6, transformOrigin: '50% 50%',
          transform: `rotateX(${a}deg)`}} />
      ) : null}
      {/* shine sweeping across the card while it turns */}
      {flipT > 0 && flipT < 1 ? (
        <div style={{position: 'absolute', left: x, top: y, width: w, height: h, zIndex: 7, borderRadius: 18, pointerEvents: 'none',
          background: `linear-gradient(180deg, rgba(255,255,255,0) ${flipT * 100 - 30}%, rgba(255,255,255,.18) ${flipT * 100}%, rgba(255,255,255,0) ${flipT * 100 + 30}%)`}} />
      ) : null}
    </div>
  );
};

/** Three real samples fanned out: islom and jahon title slides behind, the pvid closing slide in front. */
const Fan: React.FC<{f: number; at: number; y: number; width: number; still?: boolean}> = ({f, at, y, width, still}) => (
  <>
    {FAN.map(([src, dx, rot], i) => {
      const t = still ? 1 : sp(f, at + i * 4, {damping: 15, stiffness: 100, mass: 0.8});
      return (
        <Slide key={src} src={src} width={width} style={{left: 540 - width / 2, top: y, zIndex: i, opacity: Math.min(1, t * 1.6),
          transformOrigin: '50% 150%',
          transform: `translateY(${(1 - t) * 160}px) translateX(${dx * t}px) rotate(${rot * t}deg)`}} />
      );
    })}
  </>
);

const Hl: React.FC<{children: React.ReactNode; f: number; at: number}> = ({children, f, at}) => {
  const t = at <= 0 ? 1 : interpolate(f, [at + 4, at + 14], [0, 1], {...clamp, easing: ease});
  return (
    <span style={{position: 'relative', display: 'inline-block', color: INK}}>
      <span style={{position: 'absolute', left: -14, right: -14, top: '8%', bottom: '-2%', background: AMBER, borderRadius: 14,
        transformOrigin: '0 50%', transform: `scaleX(${t})`}} />
      <span style={{position: 'relative'}}>{children}</span>
    </span>
  );
};

const big: React.CSSProperties = {fontFamily: HEAD, fontWeight: 800, color: WHITE, lineHeight: 1.08, letterSpacing: -1.5};

const Opening: React.FC<{f: number}> = ({f}) => (
  <div style={{position: 'absolute', left: 70, top: 880, width: 800, ...block(f, 0, B1 - 12)}}>
    <div style={{...big, fontSize: 124}}>Tayyor</div>
    <div style={{...big, fontSize: 124}}>taqdimot</div>
    <div style={{...big, fontSize: 88, marginTop: 18}}><Hl f={f} at={0}>buyurtma qiling</Hl></div>
  </div>
);

const Block1: React.FC<{f: number}> = ({f}) => shown(f, B1, B2 - 12) ? (
  <div style={{position: 'absolute', left: 70, top: 960, width: 800, ...block(f, B1, B2 - 12)}}>
    <div style={{...big, fontSize: 112}}>Slaydlar</div>
    <div style={{...big, fontSize: 112}}>matni bilan</div>
    <div style={{...big, fontSize: 112, marginTop: 10}}><Hl f={f} at={B1}>tayyor</Hl></div>
  </div>
) : null;

const Block2: React.FC<{f: number}> = ({f}) => shown(f, B2, CTA - 12) ? (
  <div style={{position: 'absolute', left: 70, top: 960, width: 800, ...block(f, B2, CTA - 12)}}>
    <div style={{...big, fontSize: 112}}>Botga kiring,</div>
    <div style={{...big, fontSize: 112, marginTop: 10}}><Hl f={f} at={B2}>narxlarni</Hl></div>
    <div style={{...big, fontSize: 112, marginTop: 10}}>ko<Q />ring</div>
  </div>
) : null;

const Ending: React.FC<{f: number; still?: boolean}> = ({f, still}) => {
  const t = still ? 1 : sp(f, CTA, {damping: 13, stiffness: 130, mass: 0.7});
  const s = still ? {} : block(f, CTA + 10);
  return (
    <>
      <div style={{position: 'absolute', left: 70, top: 700, width: 940, height: 150, borderRadius: 30, background: INK,
        display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.85 + 0.15 * t})`, opacity: Math.min(1, t * 1.4),
        boxShadow: '0 24px 50px rgba(4,40,35,.45)'}}>
        <span style={{fontFamily: HEAD, fontWeight: 800, fontSize: 84, color: WHITE, letterSpacing: -1.5}}>
          <span style={{color: AMBER}}>@</span>TaqdimotKerakBot
        </span>
      </div>
      <div style={{position: 'absolute', left: 70, top: 900, width: 800, ...s}}>
        <div style={{...big, fontSize: 104}}>Telegramda</div>
        <div style={{...big, fontSize: 104, marginTop: 12}}><Hl f={f} at={still ? 0 : CTA + 10}>qidiring</Hl></div>
      </div>
    </>
  );
};

const Video: React.FC = () => {
  useAssets();
  const f = useCurrentFrame();
  const fanIn = f >= B2 - 2;
  const fanOut = interpolate(f, [CTA - 4, CTA + 10], [0, 1], {...clamp, easing: ease});
  return (
    <AbsoluteFill>
      <Ground f={f} />
      <Cycle cx={900} cy={1640} r={300} f={f} />
      <Stack f={f} />
      {fanIn ? (
        <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920,
          transform: `scale(${1 - 0.15 * fanOut})`, transformOrigin: '50% 0%'}}>
          <Fan f={f} at={B2 - 2} y={300} width={720} />
        </div>
      ) : null}
      <Opening f={f} />
      <Block1 f={f} />
      <Block2 f={f} />
      {f >= CTA ? <Ending f={f} /> : null}
      <Audio src={staticFile(`audio/bed_${ID}.wav`)}
        volume={(fr) => interpolate(fr, [0, 12, FRAMES - 30, FRAMES], [0, 0.3, 0.3, 0], clamp)} />
      <Sequence from={30 - FLIP}><Audio src={staticFile('audio/pageturn.wav')} volume={0.26} /></Sequence>
      <Sequence from={B2 - 6}><Audio src={staticFile('audio/swipe.wav')} volume={0.22} /></Sequence>
    </AbsoluteFill>
  );
};

const Cover: React.FC = () => {
  useAssets();
  return (
    <AbsoluteFill>
      <Ground f={0} />
      <Cycle cx={900} cy={1680} r={260} f={0} />
      <Slide src="pvid/06" width={860} style={{left: 110, top: 300, transform: 'rotate(5deg) translate(20px,-24px) scale(.95)'}} />
      <Slide src="pvid/01" width={940} style={{left: 70, top: 330}} />
      <div style={{position: 'absolute', left: 70, top: 930, width: 940}}>
        <div style={{...big, fontSize: 150}}>Tayyor</div>
        <div style={{...big, fontSize: 150}}>taqdimot</div>
        <div style={{...big, fontSize: 112, marginTop: 20}}><Hl f={0} at={0}>buyurtma qiling</Hl></div>
        <div style={{marginTop: 46, fontFamily: BODY, fontWeight: 800, fontSize: 54, color: MINT}}>@TaqdimotKerakBot</div>
      </div>
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
