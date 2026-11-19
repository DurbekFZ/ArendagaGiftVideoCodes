// This package's exports map adds `.css` itself and ships no type declarations.
// @ts-ignore
import '@fontsource/space-grotesk/700';
import {Lottie} from '@remotion/lottie';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Freeze, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random,
  spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {BRAND, GiftData, H, W, clamp, mix, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "SEHRLI QOZON IJARADA" — cold to warm. The Hex Pot gift (model "Sangria") is a witch's cauldron whose own
// animation sets it on fire. Frame one is a cold, grey-slate world with the offer already written on it
// ("Telegram sovg‘asi · Sehrli qozon ijarada · kuniga 750 so‘m"); at 0.2 s the pot catches fire and its light
// warms the whole frame: the slate turns to ember, the headline lights up, sparks rise. Then a before/after:
// a grey profile card with empty gift slots, an arrow, and a warm profile card where the pot lands in the slot
// and catches fire again ("Gift profilingizda 3–30 kun turadi"). Ends on the price, the bot and the link.
// Silent, calm pad, one soft flame sound per ignition.
const ID = 'V20261119b';
const GIFT = 'hexpot-42707'; // Sangria model 2.5%, Silver Blue backdrop 1%, Scarecrow symbol 2%; 750 so‘m a day
const DISPLAY = "'Space Grotesk', sans-serif";
const SANS = "'Manrope', sans-serif";

// Palette. Background family: the gift's Silver Blue backdrop (#80a4b8 / #607c91 / #15374b), pushed down to a cold
// graphite slate. Accent: flame orange (complementary to the slate blue), the colour the pot itself turns.
// Neutrals: warm white and slate ink. One extra hue, used sparingly: the potion's magenta (glow and the arrow).
const SLATE_HI = '#33434e';
const SLATE = '#1a242b';
const SLATE_LO = '#0b1014';
const COLD_TEXT = '#c9d4db';
const FLAME = '#ff7a2f';
const FLAME_HI = '#ffb35c';
const EMBER = '#5a2414';
const MAGENTA = '#ff3d7f';
const WHITE = '#fbf3ea';
const INK = '#0d1317';

// Timeline (30 fps).
const GIFT_OFFSET = 10; // the pot catches fire at its own frame 16, i.e. video frame 6 (0.2 s)
const IGNITE = 6;
const A_OUT = 186; // 6.2 s
const B_TITLE = 200; // 6.7 s
const COLD_CARD = 196;
const WARM_CARD = 206;
const LAND = 226; // the pot settles in the warm card's slot
const RELIGHT_FROM = 8; // gift frame the pot restarts from after landing: fire at LAND + 8 (7.8 s)
const B_OUT = 378; // 12.6 s
const C_PRICE = 392; // 13.1 s
const C_CTA = 428; // 14.3 s
const FRAMES = 570; // 19.0 s

const useFonts = () => {
  const [handle] = useState(() => delayRender('space grotesk'));
  useEffect(() => {
    document.fonts.load(`700 10px "Space Grotesk"`, 'SEHRLI QOZON IJARADA 750 so‘m 3–30')
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

const ease = Easing.bezier(0.6, 0.02, 0.25, 1);
const out3 = Easing.out(Easing.cubic);
const popIn = (frame: number, fps: number, at: number) =>
  spring({frame: frame - at, fps, config: {damping: 14, stiffness: 170, mass: 0.7}});

/** Fire loop: run from 30 to 60 and back (all flame poses), for a pot that keeps burning. */
const burning = (f: number) => {
  if (f <= 60) return f;
  const k = (f - 60) % 60;
  return k < 30 ? 60 - k : 30 + (k - 30);
};

/** Which frame of the gift's own animation to show at a given video frame. */
const giftFrame = (frame: number) => {
  if (frame < A_OUT) {
    const f = frame + GIFT_OFFSET;
    return f < 148 ? f : 0; // ignition, flames, smoke, the eye's wander, then the calm bubbling pose
  }
  if (frame < LAND) return 0;
  const f = RELIGHT_FROM + frame - LAND;
  if (frame < B_OUT) return burning(f);
  // In the offer the fire is left to finish naturally (smoke, the eye, back to calm), then the calm pose holds.
  const atOut = burning(RELIGHT_FROM + B_OUT - LAND);
  const g = atOut + frame - B_OUT;
  return g < 148 ? g : 0;
};

/** How brightly the fire is burning (0..1) for the light it throws on the scene. */
const fireLevel = (g: number) => interpolate(g, [14, 22, 60, 76, 90], [0, 1, 1, 0.45, 0], clamp);

/** Cold slate that warms with the fire: ember glow from the pot, sparks rising, a soft flicker. */
const Background: React.FC<{warm: number; glow: number; gx: number; gy: number}> = ({warm, glow, gx, gy}) => {
  const frame = useCurrentFrame();
  const flicker = 0.88 + 0.12 * Math.sin(frame / 2.3) * Math.sin(frame / 3.7 + 1);
  const hi = mix(SLATE_HI, '#6a3322', warm);
  const mid = mix(SLATE, '#2a1510', warm);
  const lo = mix(SLATE_LO, '#120806', warm);
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 100% 70% at 46% 52%, ${hi} 0%, ${mid} 55%, ${lo} 100%)`}}>
      {/* the fire's own light */}
      <div style={{position: 'absolute', left: gx - 900, top: gy - 900, width: 1800, height: 1800, borderRadius: '50%',
        opacity: (0.25 + 0.75 * glow) * warm * flicker,
        background: `radial-gradient(circle, ${FLAME}cc 0%, ${MAGENTA}55 30%, rgba(0,0,0,0) 62%)`}} />
      {/* cold dust, fading as it warms */}
      {Array.from({length: 30}, (_, i) => {
        const r = (k: string) => random(`dust-${i}-${k}`);
        const s = 3 + r('s') * 5;
        const y = ((r('y') * H + frame * (0.25 + r('v') * 0.5)) % (H + 40)) - 20;
        const x = r('x') * W + Math.sin(frame / (40 + r('w') * 30) + i) * 24;
        return <div key={'d' + i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%',
          background: COLD_TEXT, opacity: (0.15 + r('o') * 0.3) * (1 - warm)}} />;
      })}
      {/* sparks, rising once it is warm */}
      {Array.from({length: 34}, (_, i) => {
        const r = (k: string) => random(`spark-${i}-${k}`);
        const s = 4 + r('s') * 7;
        const speed = 1.6 + r('v') * 2.6;
        const y = H - (((r('y') * H + frame * speed) % (H + 60)));
        const x = r('x') * W + Math.sin(frame / (14 + r('w') * 16) + i * 2) * 30;
        const tw = 0.5 + 0.5 * Math.abs(Math.sin(frame / (5 + r('t') * 6) + i));
        return <div key={'s' + i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%',
          background: r('c') > 0.7 ? FLAME_HI : FLAME, boxShadow: `0 0 ${s * 2}px ${FLAME}`,
          opacity: tw * (0.35 + r('o') * 0.55) * warm}} />;
      })}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0) 72%, rgba(0,0,0,.4) 100%)'}} />
    </AbsoluteFill>
  );
};

/** The pot with its own animation driven to a chosen frame. x, y = box centre. The artwork fills ~55% of the box. */
const Pot: React.FC<{data: GiftData; x: number; y: number; size: number; at: number}> = ({data, x, y, size, at}) => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 19) * size * 0.008;
  return (
    <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2 + bob, width: size, height: size,
      filter: 'drop-shadow(0 30px 40px rgba(0,0,0,.45))'}}>
      <Freeze frame={at}>
        <Lottie animationData={data.gift} style={{width: size, height: size}} />
      </Freeze>
    </div>
  );
};

/** Opening: what it is and what it costs, on frame one. The second line lights up with the fire. */
const Opening: React.FC<{warm: number; out: number}> = ({warm, out}) => {
  const lift = -out * 240;
  const text = mix(COLD_TEXT, WHITE, warm);
  const lit = mix(COLD_TEXT, FLAME, warm);
  return (
    <>
      <div style={{position: 'absolute', left: 70, top: 236 + lift, opacity: 1 - out, display: 'flex'}}>
        <div style={{border: `4px solid ${text}`, color: text, fontFamily: SANS, fontWeight: 800, fontSize: 36, letterSpacing: 4,
          padding: '8px 24px 10px', borderRadius: 999}}>TELEGRAM SOVG‘ASI</div>
      </div>
      <div style={{position: 'absolute', left: 64, top: 318 + lift, opacity: 1 - out, fontFamily: DISPLAY, fontWeight: 700,
        fontSize: 122, lineHeight: 1.0, letterSpacing: -3, color: text, whiteSpace: 'nowrap'}}>
        <div>SEHRLI QOZON</div>
        <div style={{color: lit, textShadow: `0 0 ${40 * warm}px ${FLAME}aa`}}>IJARADA</div>
      </div>
      <div style={{position: 'absolute', left: 70, top: 1362 + out * 240, opacity: 1 - out,
        transform: `rotate(${-3 * warm}deg)`, transformOrigin: 'left center'}}>
        <div style={{display: 'inline-block', background: mix('#46555f', WHITE, warm), borderRadius: 28, padding: '16px 34px 20px',
          boxShadow: `0 18px 40px rgba(0,0,0,.4)`}}>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: mix(COLD_TEXT, INK, warm), lineHeight: 1}}>kuniga</div>
          <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 104, letterSpacing: -2, lineHeight: 1.0,
            color: mix(WHITE, INK, warm), whiteSpace: 'nowrap'}}>
            750 <span style={{color: mix(WHITE, '#e2561a', warm)}}>so‘m</span></div>
        </div>
      </div>
    </>
  );
};

/** A generic profile card: avatar silhouette, two placeholder lines, and its gift row. No names, no logos. */
const Card: React.FC<{y: number; h: number; warm: boolean; enter: number; leave: number; children?: React.ReactNode}> =
  ({y, h, warm, enter, leave, children}) => {
    const shift = (1 - enter) * 900 + leave * 1100;
    const face = warm ? 'rgba(255,240,228,.10)' : 'rgba(201,212,219,.07)';
    const line = warm ? 'rgba(251,243,234,.55)' : 'rgba(201,212,219,.28)';
    const edge = warm ? `${FLAME}aa` : 'rgba(201,212,219,.25)';
    return (
      <div style={{position: 'absolute', left: 70, top: y + shift, width: 800, height: h, opacity: Math.min(1, enter * 2) * (1 - Math.min(1, leave * 2.5)),
        borderRadius: 40, background: face, border: `4px solid ${edge}`,
        boxShadow: warm ? `0 0 70px ${FLAME}44, 0 30px 60px rgba(0,0,0,.35)` : '0 30px 60px rgba(0,0,0,.3)'}}>
        <div style={{position: 'absolute', left: 36, top: 36, width: 112, height: 112, borderRadius: '50%', overflow: 'hidden',
          background: warm ? 'rgba(255,179,92,.35)' : 'rgba(201,212,219,.18)'}}>
          <div style={{position: 'absolute', left: 36, top: 20, width: 40, height: 40, borderRadius: '50%', background: line}} />
          <div style={{position: 'absolute', left: 16, top: 68, width: 80, height: 70, borderRadius: '40px 40px 0 0', background: line}} />
        </div>
        <div style={{position: 'absolute', left: 178, top: 58, width: 300, height: 26, borderRadius: 13, background: line}} />
        <div style={{position: 'absolute', left: 178, top: 102, width: 190, height: 20, borderRadius: 10, background: line, opacity: 0.6}} />
        {children}
      </div>
    );
  };

const EmptySlots: React.FC = () => (
  <>
    {[0, 1, 2, 3].map((i) => (
      <div key={i} style={{position: 'absolute', left: 36 + i * 186, top: 186, width: 160, height: 120, borderRadius: 24,
        border: '4px dashed rgba(201,212,219,.35)'}} />
    ))}
  </>
);

const Arrow: React.FC<{enter: number; y: number}> = ({enter, y}) => {
  const frame = useCurrentFrame();
  const nudge = Math.sin(frame / 8) * 6;
  return (
    <svg width={90} height={70} viewBox="0 0 90 70" style={{position: 'absolute', left: 470 - 45, top: y + nudge,
      opacity: enter}}>
      <path d="M45 6 L45 52 M22 32 L45 56 L68 32" stroke={FLAME} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
};

const Title: React.FC<{enter: number; leave: number}> = ({enter, leave}) => (
  <div style={{position: 'absolute', left: 70, top: 236 - leave * 300, opacity: Math.min(1, enter * 2) * (1 - leave),
    transform: `translateY(${(1 - enter) * 40}px)`, fontFamily: DISPLAY, fontWeight: 700, fontSize: 80, lineHeight: 1.08,
    letterSpacing: -2, color: WHITE, whiteSpace: 'nowrap'}}>
    <div>Gift profilingizda</div>
    <div><span style={{color: FLAME}}>3–30 kun</span> turadi</div>
  </div>
);

const Offer: React.FC<{price: number; cta: number}> = ({price, cta}) => {
  const frame = useCurrentFrame();
  return (
    <>
      <div style={{position: 'absolute', left: 70, top: 1010, opacity: Math.min(1, price * 2),
        transform: `translateY(${(1 - price) * 50}px)`}}>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 50, color: WHITE, lineHeight: 1}}>Ijara · kuniga</div>
        <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 168, letterSpacing: -5, lineHeight: 1.04, color: WHITE,
          whiteSpace: 'nowrap', textShadow: `0 0 50px ${FLAME}88`}}>
          750 <span style={{color: FLAME}}>so‘m</span></div>
      </div>
      {cta > 0 && (
        <div style={{position: 'absolute', left: 70, top: 1290, opacity: Math.min(1, cta * 2), transform: `translateY(${(1 - cta) * 40}px)`}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 18, padding: '12px 36px 12px 12px', borderRadius: 999,
            background: WHITE, boxShadow: '0 16px 40px rgba(0,0,0,.4)'}}>
            <Img src={staticFile('logo.png')} style={{width: 82, height: 82, borderRadius: '50%', background: BRAND.ink}} />
            <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 48, color: INK}}>{BRAND.bot}</span>
          </div>
          <div style={{marginTop: 18, fontFamily: SANS, fontWeight: 800, fontSize: 54, color: FLAME_HI,
            transform: `translateY(${-Math.abs(Math.sin(frame / 7)) * 8}px)`}}>↑ Havola profilda</div>
        </div>
      )}
    </>
  );
};

const Scene: React.FC<{data: GiftData; frame: number; cover?: boolean}> = ({data, frame, cover}) => {
  const {fps} = useVideoConfig();
  const s = (a: number, b: number, e = out3) => interpolate(frame, [a, b], [0, 1], {...clamp, easing: e});
  const at = cover ? 0 : giftFrame(frame);
  // Once lit, the scene stays warm; the glow follows the fire itself.
  const warm = cover ? 1 : s(IGNITE + 4, IGNITE + 20, Easing.inOut(Easing.quad));
  const glow = fireLevel(at);
  const outA = cover ? 0 : s(A_OUT, A_OUT + 14, ease);
  const toB = cover ? 0 : s(A_OUT, LAND, ease);
  const toC = cover ? 0 : s(B_OUT, B_OUT + 26, ease);
  const title = popIn(frame, fps, B_TITLE);
  const cold = popIn(frame, fps, COLD_CARD);
  const warmCard = popIn(frame, fps, WARM_CARD);
  const leaveB = s(B_OUT, B_OUT + 14);
  const price = popIn(frame, fps, C_PRICE);
  const cta = popIn(frame, fps, C_CTA);

  // Pot path: big in the opening -> the warm card's slot -> above the offer.
  const gx = 470;
  const gy = interpolate(toC, [0, 1], [interpolate(toB, [0, 1], [930, 1262]), 640]);
  const gs = interpolate(toC, [0, 1], [interpolate(toB, [0, 1], [1160, 800]), 900]);
  const inB = !cover && frame >= A_OUT && frame < B_OUT + 16;
  return (
    <AbsoluteFill>
      <Background warm={warm} glow={glow} gx={gx} gy={gy} />
      {inB && (
        <>
          <Card y={452} h={340} warm={false} enter={cold} leave={leaveB}><EmptySlots /></Card>
          <Arrow enter={cold * (1 - leaveB)} y={800} />
          <Card y={880} h={640} warm enter={warmCard} leave={leaveB}>
            <div style={{position: 'absolute', left: 400 - 300, top: 176, width: 600, height: 432, borderRadius: 36,
              background: `radial-gradient(circle at 50% 60%, ${FLAME}55 0%, ${EMBER}66 55%, rgba(0,0,0,0) 80%)`,
              border: `4px solid ${FLAME}66`}} />
          </Card>
        </>
      )}
      <Pot data={data} x={gx} y={gy} size={gs} at={at} />
      {outA < 1 && <Opening warm={warm} out={outA} />}
      {inB && frame >= B_TITLE && <Title enter={title} leave={leaveB} />}
      {!cover && frame >= C_PRICE && <Offer price={price} cta={cta} />}
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
      <Sequence from={IGNITE}><Audio src={staticFile('audio/ignite.wav')} volume={0.4} /></Sequence>
      <Sequence from={LAND + 6}><Audio src={staticFile('audio/ignite.wav')} volume={0.22} /></Sequence>
      {[A_OUT, B_OUT].map((t) => (
        <Sequence key={t} from={t}><Audio src={staticFile('audio/whoosh.wav')} volume={0.08} /></Sequence>
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
        <Scene data={gifts[0]} frame={0} cover />
      </Freeze>
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
