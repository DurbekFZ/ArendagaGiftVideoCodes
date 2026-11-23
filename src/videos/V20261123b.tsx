// This package's exports map adds `.css` itself and ships no type declarations.
// @ts-ignore
import '@fontsource/bricolage-grotesque/800.css';
// @ts-ignore
import '@fontsource/big-shoulders-stencil-display/900';
import {Lottie} from '@remotion/lottie';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Freeze, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random,
  spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {BRAND, GiftData, H, W, clamp, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "MIF YOKI FAKT" — two myths about renting a Telegram gift are stamped down, each answered by a fact. The Liberty
// Figure (model Peridot: a little green crystal statue) stands under a spotlight on a deep forest-green stage; the
// text column sits above it. Frame one already reads "Telegram NFT sovg‘a ijarasi / Kuniga 750 so‘m" and at 0.3 s a
// green FAKT stamp slams beside the price: the room jolts, the crystal figure hops and throws off glints. Then:
// MIF "Sotib olish shart" (struck through) → FAKT "Ijara: 3–30 kun"; MIF "Ijaradagi gift ko‘rinmaydi" → FAKT
// "Profilingizda turadi"; finally the price again with the bot and the link. Silent, calm pad in B-flat major.
const ID = 'V20261123b';
const GIFT = 'libertyfigure-188694'; // Peridot model 3%, Amber backdrop 1.2%, Corn symbol 0.5%; 750 so‘m a day
const HEAD = "'Bricolage Grotesque', sans-serif";
const STENCIL = "'Big Shoulders Stencil Display', sans-serif";
const SANS = "'Manrope', sans-serif";

// Palette. The gift is a pale yellow-green crystal (peridot). Background family: deep forest green, analogous to the
// gift and much darker, so the crystal glows against it. Accent: coral red, the complement of the green, used only for
// MIF. Neutrals: warm cream type and green-black ink. FAKT and the glints reuse the gift's own peridot green.
const BG_1 = '#245a3c';
const BG_2 = '#133524';
const BG_3 = '#071a10';
const PERI = '#b4e86a';
const PERI_DEEP = '#6fae3a';
const CORAL = '#ff6a50';
const CREAM = '#fbf3e2';
const INK = '#0b1f14';

// Timeline (30 fps).
const STAMP0 = 9; // FAKT on the opening price
const R1 = 150; // myth 1
const F1 = 204; // fact 1
const R2 = 300; // myth 2
const F2 = 354; // fact 2
const END = 450; // price again
const CTA = 480; // bot and link
const FRAMES = 585; // 19.5 s
const OUT_LEN = 10; // a block leaves in the last 10 frames before the next one

// Gift geometry. The figure fills ~29–71% of its box across and ~19–81% down.
const GS = 1040;
const GX = 470;
const GY = 1200;

const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([`800 10px "Bricolage Grotesque"`, `900 10px "Big Shoulders Stencil Display"`, `800 10px "Manrope"`]
      .map((f) => document.fonts.load(f, 'KUNIGA 750 so‘m o‘g‘ – ↑ 3–30 “MIF” FAKT ✓ ✕')))
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

// Gift animation. Calm: the frontal, sparkling stretch 160 → 179 → 0 → 16 of the loop, played back and forth.
// At each MIF the figure plays its own 36 → 82 (it turns to look at its tablet, then faces us again).
const CALM_LEN = 36;
const calm = (n: number) => {
  const k = ((n % (2 * CALM_LEN)) + 2 * CALM_LEN) % (2 * CALM_LEN);
  return (160 + (k <= CALM_LEN ? k : 2 * CALM_LEN - k)) % 180;
};
const giftFrame = (f: number) => {
  for (const at of [R1, R2]) {
    if (f >= at && f < at + 46) return 36 + (f - at);
  }
  return calm(f + 10);
};

/** A hop of the figure when a FAKT stamp lands (translation only; the artwork is never squashed). */
const hop = (f: number, at: number) => {
  const t = f - at;
  if (t < 0 || t > 16) return 0;
  return -Math.sin((t / 16) * Math.PI) * 46;
};
const FAKTS = [STAMP0, F1, F2, END + 6];
const MIFS = [R1, R2];

/** Slow peridot shards drifting at the edges of the stage. */
const Shards: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill>
    {Array.from({length: 16}, (_, i) => {
      const r = (k: string) => random(`shard-${i}-${k}`);
      const side = i % 4;
      const x = side === 0 ? r('x') * 120 - 40 : side === 1 ? 900 + r('x') * 180 : 60 + r('x') * 960;
      const y0 = side < 2 ? 200 + r('y') * 1600 : 1560 + r('y') * 360;
      const y = y0 - f * (0.25 + r('v') * 0.4);
      const s = 40 + r('s') * 90;
      const rot = r('r') * 360 + f * (r('w') - 0.5) * 0.8;
      const o = 0.1 + r('o') * 0.16;
      return (
        <svg key={i} width={s} height={s * 1.3} viewBox="0 0 20 26" style={{position: 'absolute', left: x, top: y,
          transform: `rotate(${rot}deg)`, opacity: o}}>
          <path d="M10 0 L20 9 L13 26 L4 22 L0 8 Z" fill={PERI} />
          <path d="M10 0 L13 26 L4 22 L0 8 Z" fill={PERI_DEEP} />
        </svg>
      );
    })}
  </AbsoluteFill>
);

const Stage: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 55% at 47% 62%, ${BG_1} 0%, ${BG_2} 55%, ${BG_3} 100%)`}}>
    <Shards f={f} />
    {/* spotlight cone onto the figure */}
    <AbsoluteFill style={{opacity: 0.22 + 0.03 * Math.sin(f / 20),
      background: `linear-gradient(180deg, transparent 0%, ${PERI} 100%)`,
      clipPath: 'polygon(40% 34%, 47% 34%, 74% 80%, 13% 80%)', filter: 'blur(30px)'}} />
    {/* floor pool of light */}
    <div style={{position: 'absolute', left: GX - 360, top: 1470, width: 720, height: 150, borderRadius: '50%',
      background: `radial-gradient(ellipse, rgba(180,232,106,.42) 0%, rgba(180,232,106,0) 70%)`}} />
  </AbsoluteFill>
);

/** Peridot glints thrown off the crystal when a stamp lands. */
const Glints: React.FC<{f: number; at: number; seed: string}> = ({f, at, seed}) => {
  const t = f - at;
  if (t < 0 || t > 32) return null;
  return (
    <AbsoluteFill>
      {Array.from({length: 12}, (_, i) => {
        const r = (k: string) => random(`${seed}-${i}-${k}`);
        const a = (i / 12) * Math.PI * 2 + r('a') * 0.4;
        const d = 230 + r('d') * 140 + t * (3 + r('v') * 4);
        const x = GX + Math.cos(a) * d * 0.85;
        const y = GY - 20 + Math.sin(a) * d;
        const s = (30 + r('s') * 40) * interpolate(t, [0, 6, 32], [0.3, 1, 0.2], clamp);
        return <svg key={i} width={s} height={s} viewBox="0 0 20 20" style={{position: 'absolute', left: x - s / 2, top: y - s / 2,
          opacity: interpolate(t, [0, 4, 24, 32], [0, 1, 1, 0], clamp), filter: `drop-shadow(0 0 10px ${PERI})`}}>
          <path d="M10 0 Q11 9 20 10 Q11 11 10 20 Q9 11 0 10 Q9 9 10 0Z" fill={i % 3 ? CREAM : PERI} />
        </svg>;
      })}
    </AbsoluteFill>
  );
};

/** A rubber stamp: double border, stencil letters, slammed in from above. */
const Stamp: React.FC<{f: number; at: number; kind: 'mif' | 'fakt'; x: number; y: number; rot: number; still?: boolean; size?: number}> =
  ({f, at, kind, x, y, rot, still, size = 64}) => {
    const t = still ? 99 : f - at;
    if (t < 0) return null;
    const s = interpolate(t, [0, 5, 8, 11], [2.3, 0.94, 1.04, 1], {...clamp, easing: Easing.out(Easing.quad)});
    const o = interpolate(t, [0, 3], [0, 1], clamp);
    const color = kind === 'mif' ? CORAL : PERI;
    return (
      <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${s})`, transformOrigin: '50% 50%',
        opacity: o, border: `7px solid ${color}`, borderRadius: 18, padding: 6}}>
        <div style={{border: `3px solid ${color}`, borderRadius: 11, padding: '0px 26px 4px', fontFamily: STENCIL, fontWeight: 900,
          fontSize: size, lineHeight: 1.0, letterSpacing: size / 14, color, whiteSpace: 'nowrap'}}>
          {kind === 'mif' ? 'MIF ✕' : 'FAKT ✓'}
        </div>
      </div>
    );
  };

const Kicker: React.FC<{children: React.ReactNode; color?: string}> = ({children, color = PERI}) => (
  <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, letterSpacing: 4, color, textTransform: 'uppercase'}}>{children}</div>
);

/** A block's entrance and exit: rise in over 8 frames, slide out over OUT_LEN. */
const enter = (f: number, at: number, end: number, still?: boolean) => {
  if (still) return {opacity: 1, transform: 'none'};
  const a = interpolate(f, [at, at + 8], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const b = interpolate(f, [end - OUT_LEN, end], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  return {opacity: a * (1 - b), transform: `translate(${-b * 60}px, ${(1 - a) * 34}px)`};
};

/** Myth line, struck through by a coral rule once the stamp has landed. */
const Myth: React.FC<{f: number; at: number; lines: string[]}> = ({f, at, lines}) => {
  const strike = interpolate(f, [at + 30, at + 40], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return (
    <div>
      {lines.map((l, i) => (
        <div key={i} style={{position: 'relative', display: 'inline-block', fontFamily: HEAD, fontWeight: 800, fontSize: 72,
          lineHeight: 1.08, color: CREAM, opacity: 0.92, whiteSpace: 'nowrap'}}>
          {l}
          <div style={{position: 'absolute', left: -6, top: '56%', height: 8, borderRadius: 4, background: CORAL,
            width: `calc(${strike * 100}% + 12px)`, opacity: strike > 0 ? 0.95 : 0}} />
        </div>
      )).reduce<React.ReactNode[]>((acc, el, i) => (i ? [...acc, <br key={`b${i}`} />, el] : [el]), [])}
    </div>
  );
};

const Fact: React.FC<{lines: string[]}> = ({lines}) => (
  <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 92, lineHeight: 1.0, color: PERI, whiteSpace: 'nowrap', letterSpacing: -2}}>
    {lines.map((l, i) => <div key={i}>{l}</div>)}
  </div>
);

const Price: React.FC<{kicker: string}> = ({kicker}) => (
  <div>
    <Kicker>{kicker}</Kicker>
    <div style={{height: 16}} />
    <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 84, lineHeight: 1.0, color: CREAM}}>Kuniga</div>
    <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 196, lineHeight: 1.0, color: CREAM, letterSpacing: -6,
      whiteSpace: 'nowrap'}}>750 so‘m</div>
  </div>
);

const Scene: React.FC<{data: GiftData; frame: number; still?: boolean}> = ({data, frame, still}) => {
  const {fps} = useVideoConfig();
  const f = frame;
  // A short jolt of the whole stage when a stamp lands.
  const jolt = still ? 0 : [...FAKTS, ...MIFS].reduce((s, at) => {
    const t = f - at - 4;
    return t < 0 || t > 10 ? s : s + Math.sin(t * 2.2) * 9 * (1 - t / 10);
  }, 0);
  const lift = still ? 0 : FAKTS.reduce((s, at) => s + hop(f, at + 4), 0);
  const breathe = still ? 0 : Math.sin(f / 26) * 6;
  const cta = still ? 1 : spring({frame: f - CTA, fps, config: {damping: 14, stiffness: 160, mass: 0.7}});
  const nudge = still ? 0 : Math.abs(Math.sin((f - CTA) / 8)) * 6 * Math.min(1, Math.max(0, (f - CTA - 24) / 10));
  const pose = still ? 175 : giftFrame(f);
  const show = (a: number, b: number) => still ? a === 0 : f >= a && f < b;
  return (
    <AbsoluteFill style={{transform: `translateY(${jolt}px)`}}>
      <Stage f={f} />
      {/* contact shadow */}
      <div style={{position: 'absolute', left: GX - 210, top: 1492, width: 420, height: 60, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(3,12,7,.65) 0%, rgba(3,12,7,0) 70%)',
        transform: `scale(${1 + lift / 200})`}} />
      <div style={{position: 'absolute', left: GX - GS / 2, top: GY - GS / 2 + lift + breathe, width: GS, height: GS,
        filter: 'drop-shadow(0 0 40px rgba(180,232,106,.35)) drop-shadow(0 30px 30px rgba(3,12,7,.5))'}}>
        <Freeze frame={pose}>
          <Lottie animationData={data.gift} style={{width: GS, height: GS}} />
        </Freeze>
      </div>
      {!still && FAKTS.map((at, i) => <Glints key={at} f={f} at={at + 4} seed={`g${i}`} />)}

      {/* Text column: x 70–870, y 240–820. */}
      {show(0, R1) && (
        <div style={{position: 'absolute', left: 70, top: 250, ...enter(f, -20, R1, still)}}>
          <Price kicker="Telegram NFT sovg‘a ijarasi" />
        </div>
      )}
      {show(0, R1) && <div style={{...enter(f, -20, R1, still), position: 'absolute', inset: 0}}>
        <Stamp f={f} at={STAMP0} kind="fakt" x={400} y={304} rot={-3} still={still} size={54} />
      </div>}

      {[{at: R1, fa: F1, end: R2, myth: ['“Sotib olish', 'shart”'], fact: ['Ijara:', '3–30 kun']},
        {at: R2, fa: F2, end: END, myth: ['“Ijaradagi gift', 'ko‘rinmaydi”'], fact: ['Profilingizda', 'turadi']}]
        .map(({at, fa, end, myth, fact}) => !still && show(at, end) && (
          <div key={at} style={{position: 'absolute', inset: 0}}>
            <div style={{position: 'absolute', left: 70, top: 236, ...enter(f, at, end)}}>
              <Stamp f={f} at={at} kind="mif" x={0} y={0} rot={-5} />
              <div style={{position: 'absolute', left: 0, top: 120}}>
                <Myth f={f} at={at} lines={myth} />
              </div>
            </div>
            {f >= fa && (
              <div style={{position: 'absolute', left: 70, top: 552, ...enter(f, fa, end)}}>
                <Stamp f={f} at={fa} kind="fakt" x={0} y={0} rot={4} />
                <div style={{position: 'absolute', left: 0, top: 122}}>
                  <Fact lines={fact} />
                </div>
              </div>
            )}
          </div>
        ))}

      {!still && f >= END && (
        <div style={{position: 'absolute', inset: 0, ...enter(f, END, FRAMES + 20)}}>
          <div style={{position: 'absolute', left: 70, top: 236}}>
            <Price kicker="Liberty Figure · ijara" />
          </div>
          <Stamp f={f} at={END + 6} kind="fakt" x={400} y={290} rot={-3} size={54} />
          <div style={{position: 'absolute', left: 70, top: 600, display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
            gap: 18, opacity: Math.min(1, cta * 2), transform: `translateY(${(1 - cta) * 26}px)`}}>
            <div style={{display: 'inline-flex', alignItems: 'center', gap: 16, padding: '8px 30px 8px 8px', borderRadius: 999, background: CREAM}}>
              <Img src={staticFile('logo.png')} style={{width: 64, height: 64, borderRadius: '50%', background: BRAND.ink}} />
              <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 42, color: INK}}>{BRAND.bot}</span>
            </div>
            <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: INK, background: PERI, borderRadius: 999,
              padding: '6px 30px 10px', transform: `translateY(${-nudge}px)`}}>↑ Havola profilda</div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

const Video: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  return (
    <AbsoluteFill style={{background: BG_3}}>
      <Scene data={gifts[0]} frame={frame} />
      <Audio src={staticFile(`audio/bed_${ID}.wav`)}
        volume={(f) => interpolate(f, [0, 8, FRAMES - 30, FRAMES - 1], [0, 0.26, 0.26, 0], clamp)} />
      {[STAMP0, F1, F2, END + 6].map((at) => (
        <Sequence key={`f${at}`} from={at + 3}><Audio src={staticFile('audio/inkstamp.wav')} volume={0.45} /></Sequence>
      ))}
      {MIFS.map((at) => (
        <Sequence key={`m${at}`} from={at + 3}><Audio src={staticFile('audio/inkstamp.wav')} volume={0.32} /></Sequence>
      ))}
      {MIFS.map((at) => (
        <Sequence key={`s${at}`} from={at + 30}><Audio src={staticFile('audio/checkmark.wav')} volume={0.18} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};

const Cover: React.FC = () => {
  useFonts();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  return (
    <AbsoluteFill style={{background: BG_3}}>
      <Scene data={gifts[0]} frame={0} still />
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
