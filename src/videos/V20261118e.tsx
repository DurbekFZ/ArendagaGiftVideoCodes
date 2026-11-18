// This package's exports map adds `.css` itself and ships no type declarations.
// @ts-ignore
import '@fontsource/big-shoulders-stencil-display/700';
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

// "BUNKER" — a countdown to a hatch opening. The Whip Cupcake (model "Wasteland") is a little steel bunker with
// a vault door; frame one shows it shut on a dark olive bunker wall with the stencilled name, "NFT sovg‘a · ijara"
// and a tag "kuniga 750 so‘m", while a hazard badge counts 3, 2, 1. At 2.5 s the gift's own animation opens the
// door with a warm glow. Then a steel plate is stamped with its rarity (model 2.5%, backdrop 1.2%, symbol 0.5%),
// says it stays on your profile for 3-30 days, and ends on the price, the bot and the link. Silent, calm pad.
const ID = 'V20261118e';
const GIFT = 'whipcupcake-40503'; // Wasteland model 2.5%, Dark Green backdrop 1.2%, Rook symbol 0.5%; 750 so‘m a day
const STENCIL = "'Big Shoulders Stencil Display', sans-serif";
const SANS = "'Manrope', sans-serif";

// Palette from the gift. Background family: its Dark Green backdrop (#516341 / #2b452f) taken darker, olive.
// Accent: the orange of the gift's whipped cream (warm against the cool olive). Neutral: bone. The one extra
// hue is the steel blue-grey of the gift's own cup, used only for the plate edge and rivets.
const OLIVE = '#3c4e31';
const OLIVE_DARK = '#18221a';
const OLIVE_DEEP = '#0c120d';
const ORANGE = '#ff8f2e';
const ORANGE_DEEP = '#e0701a';
const BONE = '#f1e8d6';
const STEEL = '#9db0b6';
const PLATE = '#1d2a1f';

// Timeline (30 fps).
const OPEN = 75; // countdown 3 (0), 2 (25), 1 (50); the door opens at 2.5 s
const A_OUT = 138; // opening layout leaves at 4.6 s
const ROWS = [152, 194, 236]; // rarity rows stamped at 5.1, 6.5, 7.9 s
const B_OUT = 312; // 10.4 s
const C_IN = 318;
const C_OUT = 438; // 14.6 s
const D_IN = 444;
const LINK = 466;
const FRAMES = 570; // 19.0 s

const useFonts = () => {
  const [handle] = useState(() => delayRender('stencil'));
  useEffect(() => {
    Promise.all([
      document.fonts.load(`900 10px "Big Shoulders Stencil Display"`, 'WHIP CUPCAKE 750 so‘m 3–30 2,5%'),
      document.fonts.load(`700 10px "Big Shoulders Stencil Display"`, 'NOYOBLIK'),
    ]).then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

const ease = Easing.bezier(0.6, 0.02, 0.25, 1);
const stampIn = (frame: number, fps: number, at: number) =>
  spring({frame: frame - at, fps, config: {damping: 14, stiffness: 260, mass: 0.6}});

/** Which frame of the gift's own animation to show: shut until OPEN, then the door swings open and the gift holds
 * that pose (after frame ~30 its own animation collapses the gift into loose parts, which must not be shown). */
const OPEN_POSE = 22;
const giftFrame = (frame: number) => Math.min(Math.max(0, frame - OPEN), OPEN_POSE);

const Hazard: React.FC<{style: React.CSSProperties; size?: number; shift?: number}> = ({style, size = 34, shift = 0}) => (
  <div style={{position: 'absolute', ...style,
    background: `repeating-linear-gradient(-45deg, ${ORANGE} ${shift}px ${shift + size}px, ${OLIVE_DEEP} ${shift + size}px ${shift + size * 2}px)`}} />
);

/** The bunker wall: dark olive steel panels with seams and rivets, a slow searchlight, the gift's rook pattern, dust. */
const Wall: React.FC<{data: GiftData; glow: number}> = ({data, glow}) => {
  const frame = useCurrentFrame();
  const size = 2100;
  const beam = -28 + Math.sin(frame / 70) * 16;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 85% 60% at 48% 40%, ${OLIVE} 0%, ${OLIVE_DARK} 55%, ${OLIVE_DEEP} 100%)`}}>
      <AbsoluteFill style={{background: 'repeating-linear-gradient(180deg, rgba(0,0,0,0) 0px 318px, rgba(0,0,0,.35) 318px 321px, rgba(255,255,255,.05) 321px 323px)'}} />
      <AbsoluteFill style={{background: 'repeating-linear-gradient(90deg, rgba(0,0,0,0) 0px 538px, rgba(0,0,0,.3) 538px 541px, rgba(255,255,255,.04) 541px 543px)'}} />
      {Array.from({length: 6}, (_, row) => Array.from({length: 5}, (__, col) => (
        <div key={`${row}-${col}`} style={{position: 'absolute', left: col * 270 - 9 + 30, top: row * 320 + 300, width: 18, height: 18,
          borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, ${STEEL}, #3a4a44 70%)`, opacity: 0.28}} />
      )))}
      <div style={{position: 'absolute', left: W / 2 - size / 2 - 40, top: 840 - size / 2, width: size, height: size, opacity: 0.16,
        transform: `rotate(${frame * 0.03}deg)`, filter: 'brightness(3.2) sepia(1) hue-rotate(40deg)',
        WebkitMaskImage: 'radial-gradient(circle, transparent 14%, #000 34%, transparent 66%)'}}>
        <Lottie animationData={data.pattern} playbackRate={0.0001} style={{width: size, height: size}} />
      </div>
      <div style={{position: 'absolute', left: -600, top: -900, width: 2400, height: 2400, transformOrigin: '50% 0%',
        transform: `rotate(${beam}deg)`, opacity: 0.22, mixBlendMode: 'screen',
        background: 'conic-gradient(from 168deg at 50% 0%, rgba(255,214,160,0) 0deg, rgba(255,214,160,.55) 12deg, rgba(255,214,160,0) 24deg)'}} />
      <div style={{position: 'absolute', left: 500 - 600, top: 820 - 600, width: 1200, height: 1200, borderRadius: '50%', opacity: glow,
        background: `radial-gradient(circle, rgba(255,143,46,.55) 0%, rgba(255,143,46,.18) 35%, rgba(255,143,46,0) 65%)`}} />
      {Array.from({length: 30}, (_, i) => {
        const r = (k: string) => random(`bunker-dust-${i}-${k}`);
        const s = 2 + r('s') * 5;
        const y = ((r('y') * H - frame * (0.2 + r('v') * 0.6)) % H + H) % H;
        const x = r('x') * W + Math.sin(frame / (28 + r('w') * 40) + i) * 34;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%',
          background: '#ffd9a8', opacity: (0.08 + r('o') * 0.35) * (0.6 + 0.4 * Math.sin(frame / 11 + i)),
          filter: s > 5 ? 'blur(1.5px)' : undefined}} />;
      })}
      <Hazard style={{left: 0, right: 0, top: 0, height: 26}} shift={-frame * 0.6} size={30} />
      <Hazard style={{left: 0, right: 0, bottom: 0, height: 26}} shift={frame * 0.6} size={30} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 70%, rgba(0,0,0,.45) 100%)'}} />
    </AbsoluteFill>
  );
};

/** The gift, its own animation driven to a chosen frame. x, y = box centre. */
const Bunker: React.FC<{data: GiftData; x: number; y: number; size: number; at: number}> = ({data, x, y, size, at}) => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 20) * 6;
  return (
    <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2 + bob, width: size, height: size,
      filter: 'drop-shadow(0 40px 50px rgba(0,0,0,.5))'}}>
      <Freeze frame={at}>
        <Lottie animationData={data.gift} style={{width: size, height: size}} />
      </Freeze>
    </div>
  );
};

/** Hazard-ringed countdown badge: 3, 2, 1, each stamped in whole. */
const Countdown: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame >= OPEN + 10) return null;
  const n = frame < 25 ? 3 : frame < 50 ? 2 : 1;
  const s = n === 3 ? 1 : stampIn(frame, fps, (3 - n) * 25);
  const leave = interpolate(frame, [OPEN, OPEN + 10], [0, 1], clamp);
  const R = 100;
  return (
    <div style={{position: 'absolute', left: 900 - R, top: 660 - R, width: R * 2, height: R * 2, borderRadius: '50%',
      opacity: 1 - leave, transform: `scale(${1 + leave * 0.4}) rotate(${-8 + leave * 10}deg)`,
      background: `repeating-conic-gradient(from ${frame * 2}deg, ${ORANGE} 0deg 15deg, ${OLIVE_DEEP} 15deg 30deg)`,
      boxShadow: '0 20px 50px rgba(0,0,0,.5)'}}>
      <div style={{position: 'absolute', inset: 22, borderRadius: '50%', background: OLIVE_DEEP, display: 'flex',
        alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 6px 20px rgba(0,0,0,.6)'}}>
        <div style={{fontFamily: STENCIL, fontWeight: 900, fontSize: 144, lineHeight: 1, color: BONE, marginTop: 6,
          transform: `scale(${interpolate(s, [0, 1], [1.5, 1])})`, opacity: Math.min(1, s * 2)}}>{n}</div>
      </div>
    </div>
  );
};

/** Frame one: name, what it is and the price, around the shut bunker. */
const Opening: React.FC<{out: number}> = ({out}) => (
  <>
    <div style={{position: 'absolute', left: 70, top: 246, display: 'flex', alignItems: 'center', gap: 0,
      opacity: 1 - out, transform: `translateY(${-out * 80}px)`}}>
      <div style={{width: 64, height: 58, position: 'relative', overflow: 'hidden'}}>
        <Hazard style={{inset: 0}} size={12} />
      </div>
      <div style={{background: BONE, color: OLIVE_DEEP, height: 58, display: 'flex', alignItems: 'center', padding: '0 22px',
        fontFamily: SANS, fontWeight: 800, fontSize: 32, letterSpacing: 4, whiteSpace: 'nowrap'}}>NFT SOVG‘A · IJARA</div>
    </div>
    <div style={{position: 'absolute', left: 64, top: 322, fontFamily: STENCIL, fontWeight: 900, fontSize: 154, lineHeight: 1,
      color: BONE, whiteSpace: 'nowrap', letterSpacing: 1, textShadow: '0 8px 0 rgba(0,0,0,.35), 0 20px 50px rgba(0,0,0,.5)',
      opacity: 1 - out, transform: `translateY(${-out * 120}px)`}}>
      WHIP <span style={{color: ORANGE}}>CUPCAKE</span>
    </div>
    <div style={{position: 'absolute', left: 70, top: 1296, opacity: 1 - out, transform: `translateX(${-out * 700}px) rotate(-3deg)`,
      display: 'flex', alignItems: 'center', background: BONE, borderRadius: '18px 60px 60px 18px', padding: '18px 54px 18px 30px',
      boxShadow: '0 22px 50px rgba(0,0,0,.5)', gap: 26}}>
      <div style={{width: 34, height: 34, borderRadius: '50%', background: OLIVE_DEEP, boxShadow: `inset 0 0 0 7px ${STEEL}`}} />
      <div>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, color: OLIVE, letterSpacing: 3}}>KUNIGA</div>
        <div style={{fontFamily: STENCIL, fontWeight: 900, fontSize: 136, lineHeight: 0.95, color: OLIVE_DEEP, whiteSpace: 'nowrap'}}>
          750 <span style={{color: ORANGE_DEEP}}>so‘m</span></div>
      </div>
    </div>
  </>
);

/** The steel plate in the lower half that the later scenes are stamped onto. */
const PLATE_X = 70;
const PLATE_Y = 968;
const PLATE_W = 800;
const PLATE_H = 556;

const Plate: React.FC<{enter: number; children: React.ReactNode}> = ({enter, children}) => (
  <div style={{position: 'absolute', left: PLATE_X, top: PLATE_Y, width: PLATE_W, height: PLATE_H,
    transform: `translateY(${(1 - enter) * 900}px)`, borderRadius: 26, background: `linear-gradient(170deg, #26362a 0%, ${PLATE} 60%, #141d16 100%)`,
    border: `3px solid rgba(157,176,182,.55)`, boxShadow: '0 30px 70px rgba(0,0,0,.55), inset 0 2px 0 rgba(255,255,255,.08)', overflow: 'hidden'}}>
    {[[22, 22], [PLATE_W - 44, 22], [22, PLATE_H - 44], [PLATE_W - 44, PLATE_H - 44]].map(([x, y], i) => (
      <div key={i} style={{position: 'absolute', left: x, top: y, width: 20, height: 20, borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, ${STEEL}, #3a4a44 75%)`}} />
    ))}
    {children}
  </div>
);

const Slide: React.FC<{show: number; hide: number; children: React.ReactNode}> = ({show, hide, children}) => (
  <div style={{position: 'absolute', inset: 0, opacity: Math.min(1, show * 1.4) * (1 - hide),
    transform: `translateX(${(1 - show) * 260 - hide * 260}px)`}}>{children}</div>
);

const Row: React.FC<{y: number; label: string; value: string; s: number}> = ({y, label, value, s}) => (
  <div style={{position: 'absolute', left: 56, right: 56, top: y, height: 116, display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', borderBottom: '2px dashed rgba(241,232,214,.22)',
    opacity: Math.min(1, s * 2), transform: `scale(${interpolate(s, [0, 1], [1.25, 1])})`, transformOrigin: '30% 50%'}}>
    <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 58, color: BONE}}>{label}</div>
    <div style={{fontFamily: STENCIL, fontWeight: 900, fontSize: 116, color: ORANGE, lineHeight: 1}}>{value}</div>
  </div>
);

const Rarity: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rows: [string, string][] = [['Model', '2,5%'], ['Fon', '1,2%'], ['Belgi', '0,5%']];
  return (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 120, background: ORANGE, display: 'flex',
        alignItems: 'center', paddingLeft: 56}}>
        <div style={{fontFamily: STENCIL, fontWeight: 900, fontSize: 84, color: OLIVE_DEEP, letterSpacing: 4}}>NOYOBLIK</div>
      </div>
      {rows.map(([label, value], i) => (
        <Row key={label} y={150 + i * 128} label={label} value={value} s={stampIn(frame, fps, ROWS[i])} />
      ))}
    </>
  );
};

const Days: React.FC = () => (
  <>
    <div style={{position: 'absolute', left: 56, top: 56, fontFamily: STENCIL, fontWeight: 900, fontSize: 172, lineHeight: 1,
      color: ORANGE, whiteSpace: 'nowrap'}}>3–30 <span style={{color: BONE}}>KUN</span></div>
    <div style={{position: 'absolute', left: 60, top: 290, width: 680, fontFamily: SANS, fontWeight: 800, fontSize: 66,
      lineHeight: 1.12, color: BONE}}>profilingizda turadi</div>
  </>
);

const Offer: React.FC<{link: number}> = ({link}) => {
  const frame = useCurrentFrame();
  return (
    <>
      <div style={{position: 'absolute', left: 60, top: 44, fontFamily: SANS, fontWeight: 800, fontSize: 48, color: BONE,
        letterSpacing: 2}}>kuniga</div>
      <div style={{position: 'absolute', left: 54, top: 100, fontFamily: STENCIL, fontWeight: 900, fontSize: 168, lineHeight: 1,
        color: ORANGE, whiteSpace: 'nowrap'}}>750 <span style={{color: BONE}}>so‘m</span></div>
      <div style={{position: 'absolute', left: 56, top: 318, display: 'flex', alignItems: 'center', gap: 18,
        padding: '12px 36px 12px 12px', borderRadius: 999, background: ORANGE, boxShadow: '0 16px 40px rgba(0,0,0,.4)'}}>
        <Img src={staticFile('logo.png')} style={{width: 80, height: 80, borderRadius: '50%', background: BRAND.ink}} />
        <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 46, color: OLIVE_DEEP}}>{BRAND.bot}</span>
      </div>
      {link > 0 && (
        <div style={{position: 'absolute', left: 60, top: 444, fontFamily: SANS, fontWeight: 800, fontSize: 52, color: BONE,
          opacity: Math.min(1, link * 1.5), transform: `translateY(${(1 - link) * 24 - Math.sin(frame / 5) * 6 * link}px)`}}>
          ↑ Havola profilda</div>
      )}
    </>
  );
};

const Scene: React.FC<{data: GiftData; frame: number; still?: boolean}> = ({data, frame, still}) => {
  const out = still ? 0 : interpolate(frame, [A_OUT, A_OUT + 16], [0, 1], {...clamp, easing: ease});
  const move = still ? 0 : interpolate(frame, [A_OUT, A_OUT + 22], [0, 1], {...clamp, easing: ease});
  const plate = still ? 0 : interpolate(frame, [A_OUT + 4, A_OUT + 24], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const glow = still ? 0.8 : interpolate(frame, [OPEN, OPEN + 6, OPEN + 40], [0, 1.2, 0.8], clamp);
  const giftY = interpolate(move, [0, 1], [870, 610]);
  const giftSize = interpolate(move, [0, 1], [1260, 1100]);
  const giftX = interpolate(move, [0, 1], [490, 480]);
  const slide = (a: number, b: number) => interpolate(frame, [a, b], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const hideB = slide(B_OUT, B_OUT + 10);
  const showC = slide(C_IN, C_IN + 14);
  const hideC = slide(C_OUT, C_OUT + 10);
  const showD = slide(D_IN, D_IN + 14);
  const link = slide(LINK, LINK + 12);
  const burst = interpolate(frame, [OPEN, OPEN + 22], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Wall data={data} glow={glow} />
      {!still && frame >= OPEN && frame < OPEN + 24 && (
        <div style={{position: 'absolute', left: 560 - (150 + burst * 900) / 2, top: 820 - (150 + burst * 900) / 2,
          width: 150 + burst * 900, height: 150 + burst * 900, borderRadius: '50%', border: `${14 * (1 - burst)}px solid ${ORANGE}`,
          opacity: 1 - burst}} />
      )}
      <Bunker data={data} x={giftX} y={giftY} size={giftSize} at={still ? 0 : giftFrame(frame)} />
      {out < 1 && <Opening out={out} />}
      {!still && <Countdown />}
      {plate > 0 && (
        <Plate enter={plate}>
          {frame < B_OUT + 10 && <Slide show={1} hide={hideB}><Rarity /></Slide>}
          {frame >= C_IN && frame < C_OUT + 10 && <Slide show={showC} hide={hideC}><Days /></Slide>}
          {frame >= D_IN && <Slide show={showD} hide={0}><Offer link={link} /></Slide>}
        </Plate>
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
    <AbsoluteFill>
      <Scene data={gifts[0]} frame={frame} />
      <Audio src={staticFile(`audio/bed_${ID}.wav`)} volume={(f) => interpolate(f, [0, 6, FRAMES - 30, FRAMES - 1], [0, 0.3, 0.3, 0], clamp)} />
      <Sequence from={OPEN - 2}><Audio src={staticFile('audio/hatch.wav')} volume={0.55} /></Sequence>
      {ROWS.map((at) => (
        <Sequence key={at} from={at}><Audio src={staticFile('audio/stamp.wav')} volume={0.28} /></Sequence>
      ))}
      {[A_OUT, B_OUT, C_OUT].map((at) => (
        <Sequence key={at} from={at}><Audio src={staticFile('audio/whoosh.wav')} volume={0.1} /></Sequence>
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
      <Freeze frame={40}>
        <Scene data={gifts[0]} frame={40} still />
      </Freeze>
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
