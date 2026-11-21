// This package's exports map adds `.css` itself and ships no type declarations.
// @ts-ignore
import '@fontsource/fredoka/700';
import {Lottie} from '@remotion/lottie';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Freeze, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random,
  spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {BRAND, GiftData, H, W, clamp, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "TILAK QILING" — make a wish and blow. The Chill Flame gift (model Candelabra) is a teal candelabra with three
// candles whose own animation sways as if blown, the flames go out in a curl of smoke, then a spark relights them.
// Frame one: a warm terracotta wall with a cream-outlined arch niche (ravoq), the candles catching fire with sparks,
// "Telegram sovg‘a · ijara", "TILAK QILING!" and a "Shamdon · kuniga 750 so‘m" sticker. At 5.2 s "Endi puflang!",
// a gust of wind lines sweeps across and the gift's own animation blows the flames out; the room goes dark.
// At 9.3 s the candles relight by themselves: "Tilagingiz ushaldi!" — "Shamdon 3–30 kun profilingizda".
// Ends on the price, the bot and the link. Silent, calm warm pad.
const ID = 'V20261121b';
const GIFT = 'chillflame-164026'; // Candelabra model 3%, Sapphire backdrop 1.2%, Pawn symbol 0.4%; 750 so‘m a day
const ROUND = "'Fredoka', sans-serif";
const SANS = "'Manrope', sans-serif";

// Palette. Background family: terracotta, the complement of the candelabra's teal (and a warm Uzbek brick wall).
// Accent: the candelabra's teal, lifted. Neutrals: cream and a warm brown ink. Extra hue: the candle flame gold.
const TERRA_LIGHT = '#f2915f';
const TERRA = '#d4623c';
const TERRA_DEEP = '#8e3020';
const WINE = '#3c120d';
const CREAM = '#fff1dc';
const INK = '#2b0f0a';
const TEAL = '#5fe3c3';
const TEAL_DEEP = '#0f6e5e';
const FLAME = '#ffd36b';

// Timeline (30 fps).
const A_OUT = 150; // 5.0 s
const B_IN = 156; // "Endi puflang!"
const GUST = 180; // 6.0 s: the gift's own sway and blow-out (gift frames 40 -> 126)
const OUT_POSE = 126;
const B_OUT = 268;
const RELIGHT = 278; // 9.27 s: candles relight (gift frames 126 -> 179), "Tilagingiz ushaldi!"
const C_SUB = 308; // 10.27 s
const C_OUT = 432; // 14.4 s
const D_PRICE = 440;
const D_CTA = 470;
const FRAMES = 588; // 19.6 s

// Gift geometry. The candelabra fills about 40% x 55% of its 512 box, a little above centre.
const GX = 470;
const GY = 1100;
const GSIZE = 1320;

const useFonts = () => {
  const [handle] = useState(() => delayRender('fredoka'));
  useEffect(() => {
    document.fonts.load(`700 10px "Fredoka"`, 'TILAK QILING! Endi puflang 750 so‘m o‘g‘')
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

const out3 = Easing.out(Easing.cubic);
const popIn = (frame: number, fps: number, at: number) =>
  spring({frame: frame - at, fps, config: {damping: 13, stiffness: 180, mass: 0.7}});

// Upright, lit frames of the gift's animation, played back and forth so the flames flicker without the sway.
const LIT = [...Array.from({length: 30}, (_, i) => 150 + i), ...Array.from({length: 37}, (_, i) => i)];
const lit = (n: number) => {
  const period = LIT.length * 2 - 2;
  const k = ((n % period) + period) % period;
  return LIT[k < LIT.length ? k : period - k];
};

/** Which frame of the gift's own animation to show. */
const giftFrame = (frame: number) => {
  if (frame < 40) return 140 + frame; // opening: the candles catch fire with sparks
  if (frame < GUST) return lit(frame - 40 + 29); // continue from 179 into the lit loop
  if (frame < GUST + (OUT_POSE - 40)) return 40 + (frame - GUST); // sway, flames go out, smoke
  if (frame < RELIGHT) return OUT_POSE;
  if (frame < RELIGHT + (179 - OUT_POSE)) return OUT_POSE + (frame - RELIGHT);
  return lit(frame - RELIGHT - (179 - OUT_POSE) + 29);
};

/** How lit the room is: 1 while the candles burn, 0 after they are blown out. */
const light = (frame: number) => {
  if (frame < GUST + 40) return 1;
  if (frame < RELIGHT) return interpolate(frame, [GUST + 40, GUST + 80], [1, 0], {...clamp, easing: Easing.inOut(Easing.quad)});
  return interpolate(frame, [RELIGHT + 4, RELIGHT + 30], [0, 1], {...clamp, easing: out3});
};

/** Terracotta wall with soft brick courses, a warm pool of candle light and the arch niche. */
const Room: React.FC<{lightness: number; frame: number}> = ({lightness, frame}) => {
  const flicker = 1 + Math.sin(frame / 3.1) * 0.02 + Math.sin(frame / 5.3) * 0.015;
  const glow = lightness * flicker;
  const archL = GX - 330;
  const archW = 660;
  const archTop = 680;
  const archBottom = 1520;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 85% 60% at 44% 52%, ${TERRA_LIGHT} 0%, ${TERRA} 50%, ${TERRA_DEEP} 100%)`}}>
      {/* brick courses */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: 0.16}}>
        {Array.from({length: 24}, (_, r) => (
          <g key={r}>
            <line x1={0} x2={W} y1={r * 84} y2={r * 84} stroke={INK} strokeWidth={4} />
            {Array.from({length: 6}, (_, c) => {
              const x = c * 220 + (r % 2 ? 110 : 0);
              return <line key={c} x1={x} x2={x} y1={r * 84} y2={r * 84 + 84} stroke={INK} strokeWidth={4} />;
            })}
          </g>
        ))}
      </svg>
      {/* the room darkens when the candles go out */}
      <AbsoluteFill style={{background: WINE, opacity: (1 - lightness) * 0.62}} />
      {/* warm pool of light around the flames */}
      <div style={{position: 'absolute', left: GX - 700, top: 880 - 700, width: 1400, height: 1400, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(255,214,120,${0.55 * glow}) 0%, rgba(255,170,90,${0.25 * glow}) 35%, rgba(255,150,80,0) 70%)`}} />
      {/* arch niche: dark inside so the gold flames and teal candelabra stand out */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="niche" cx="50%" cy="35%" r="70%">
            <stop offset="0%" stopColor={lightness > 0 ? '#9a3a22' : WINE} stopOpacity={1} />
            <stop offset="100%" stopColor={WINE} />
          </radialGradient>
        </defs>
        <path d={`M ${archL + 16} ${archBottom + 18} L ${archL + 16} ${archTop + archW / 2 + 18} A ${archW / 2} ${archW / 2} 0 0 1 ${archL + archW + 16} ${archTop + archW / 2 + 18} L ${archL + archW + 16} ${archBottom + 18} Z`}
          fill={INK} opacity={0.5} />
        <path d={`M ${archL} ${archBottom} L ${archL} ${archTop + archW / 2} A ${archW / 2} ${archW / 2} 0 0 1 ${archL + archW} ${archTop + archW / 2} L ${archL + archW} ${archBottom} Z`}
          fill="url(#niche)" stroke={CREAM} strokeWidth={14} />
        <path d={`M ${archL + 34} ${archBottom - 20} L ${archL + 34} ${archTop + archW / 2} A ${archW / 2 - 34} ${archW / 2 - 34} 0 0 1 ${archL + archW - 34} ${archTop + archW / 2} L ${archL + archW - 34} ${archBottom - 20}`}
          fill="none" stroke={TEAL} strokeWidth={6} strokeDasharray="2 22" strokeLinecap="round" opacity={0.55 + 0.35 * lightness} />
        {/* small eight-point stars on the wall beside the arch (clear of text and of Instagram's buttons) */}
        {[[96, 760], [846, 720]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${frame * (i ? -0.3 : 0.3)})`}>
            <rect x={-22} y={-22} width={44} height={44} fill={TEAL} stroke={INK} strokeWidth={5} />
            <rect x={-22} y={-22} width={44} height={44} fill={TEAL} stroke={INK} strokeWidth={5} transform="rotate(45)" />
            <circle r={9} fill={CREAM} stroke={INK} strokeWidth={4} />
          </g>
        ))}
        {/* shelf the candelabra stands on */}
        <rect x={archL - 30} y={archBottom - 6} width={archW + 60} height={34} rx={10} fill={CREAM} stroke={INK} strokeWidth={6} />
      </svg>
      {/* inner glow of the niche */}
      <div style={{position: 'absolute', left: GX - 330, top: 680, width: 660, height: 840, overflow: 'hidden',
        borderRadius: '330px 330px 0 0', pointerEvents: 'none'}}>
        <div style={{position: 'absolute', left: 330 - 420, top: 230 - 420, width: 840, height: 840, borderRadius: '50%',
          background: `radial-gradient(circle, rgba(255,205,110,${0.42 * glow}) 0%, rgba(255,160,80,${0.16 * glow}) 45%, rgba(0,0,0,0) 70%)`}} />
      </div>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(43,15,10,.30) 0%, rgba(0,0,0,0) 16%, rgba(0,0,0,0) 80%, rgba(43,15,10,.36) 100%)'}} />
    </AbsoluteFill>
  );
};

/** Embers rising from the flames while they burn. */
const Embers: React.FC<{lightness: number; frame: number}> = ({lightness, frame}) => (
  <AbsoluteFill style={{opacity: lightness, pointerEvents: 'none'}}>
    {Array.from({length: 22}, (_, i) => {
      const r = (k: string) => random(`ember-${i}-${k}`);
      const life = 70 + r('l') * 60;
      const t = ((frame + r('p') * life) % life) / life;
      const x = GX - 200 + r('x') * 400 + Math.sin(frame / (12 + r('w') * 10) + i) * 22;
      const y = 820 - t * 520;
      const s = 5 + r('s') * 8;
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%',
        background: FLAME, boxShadow: `0 0 ${s * 2}px ${FLAME}`, opacity: Math.sin(t * Math.PI) * 0.9}} />;
    })}
  </AbsoluteFill>
);

/** The gift with its own animation driven to a chosen frame. */
const Candelabra: React.FC<{data: GiftData; at: number}> = ({data, at}) => (
  <div style={{position: 'absolute', left: GX - GSIZE / 2, top: GY - GSIZE / 2, width: GSIZE, height: GSIZE,
    filter: 'drop-shadow(0 30px 34px rgba(43,15,10,.45))'}}>
    <Freeze frame={at}>
      <Lottie animationData={data.gift} style={{width: GSIZE, height: GSIZE}} />
    </Freeze>
  </div>
);

/** A gust of wind: rounded cream strokes with curls sweeping from left to right across the candles. */
const Gust: React.FC<{frame: number}> = ({frame}) => {
  const lines = [
    {y: 760, d: 0, len: 760, curl: 1},
    {y: 860, d: 4, len: 900, curl: -1},
    {y: 960, d: 2, len: 680, curl: 1},
    {y: 1060, d: 7, len: 820, curl: -1},
    {y: 700, d: 10, len: 520, curl: -1},
  ];
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {lines.map((l, i) => {
        const t = interpolate(frame, [GUST - 6 + l.d, GUST + 34 + l.d], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
        if (t <= 0 || t >= 1) return null;
        const head = -300 + t * (W + 900);
        const tail = head - l.len;
        const c = l.curl * 46;
        const path = `M ${tail} ${l.y} C ${tail + l.len * 0.35} ${l.y - c} ${tail + l.len * 0.65} ${l.y + c} ${head - 120} ${l.y}
          a 60 60 0 1 ${l.curl > 0 ? 0 : 1} 0 ${-l.curl * 90}`;
        return <path key={i} d={path} fill="none" stroke={CREAM} strokeWidth={14} strokeLinecap="round"
          opacity={Math.sin(t * Math.PI) * 0.85} />;
      })}
    </svg>
  );
};

const Kicker: React.FC<{text: string; style?: React.CSSProperties}> = ({text, style}) => (
  <div style={{position: 'absolute', left: 70, top: 236, display: 'flex', ...style}}>
    <div style={{background: INK, color: CREAM, fontFamily: SANS, fontWeight: 800, fontSize: 36, letterSpacing: 3,
      padding: '10px 26px 12px', borderRadius: 999}}>{text}</div>
  </div>
);

/** Big two-line headline, cream with a hard ink shadow; the second line takes the accent colour. */
const Headline: React.FC<{lines: [string, string]; enter: number; leave: number; size?: number; accent?: string}> =
  ({lines, enter, leave, size = 168, accent = TEAL}) => (
    <div style={{position: 'absolute', left: 64, top: 312, fontFamily: ROUND, fontWeight: 700, fontSize: size, lineHeight: 0.98,
      whiteSpace: 'nowrap', opacity: Math.min(1, enter * 2) * (1 - leave),
      transform: `translateY(${(1 - enter) * 50 - leave * 60}px) scale(${0.86 + 0.14 * enter})`, transformOrigin: '0 50%'}}>
      <div style={{color: CREAM, textShadow: `8px 10px 0 ${INK}`}}>{lines[0]}</div>
      <div style={{color: accent, WebkitTextStroke: `8px ${INK}`, paintOrder: 'stroke fill', textShadow: `8px 10px 0 ${INK}`}}>{lines[1]}</div>
    </div>
  );

/** A flat sticker card in the lower-left, clear of the gift's flames and of Instagram's buttons. */
const Sticker: React.FC<{children: React.ReactNode; enter: number; leave: number; rotate: number; bg: string; top?: number}> =
  ({children, enter, leave, rotate, bg, top = 1330}) => (
    <div style={{position: 'absolute', left: 70, top: top + leave * 80, opacity: Math.min(1, enter * 2) * (1 - leave),
      transform: `rotate(${rotate}deg) scale(${(0.6 + 0.4 * enter) * (1 - leave * 0.2)})`, transformOrigin: '0 50%'}}>
      <div style={{background: bg, border: `7px solid ${INK}`, borderRadius: 30, padding: '14px 32px 18px', boxShadow: `12px 14px 0 ${INK}`}}>
        {children}
      </div>
    </div>
  );

const Scene: React.FC<{data: GiftData; frame: number; still?: boolean}> = ({data, frame, still}) => {
  const {fps} = useVideoConfig();
  const f = still ? 30 : frame;
  const s = (a: number, b: number) => interpolate(f, [a, b], [0, 1], {...clamp, easing: out3});
  const lightness = still ? 1 : light(f);
  const aLeave = s(A_OUT, A_OUT + 8);
  const bIn = popIn(f, fps, B_IN);
  const bLeave = s(B_OUT, B_OUT + 8);
  const cIn = popIn(f, fps, RELIGHT);
  const cSub = popIn(f, fps, C_SUB);
  const cLeave = s(C_OUT, C_OUT + 8);
  const price = popIn(f, fps, D_PRICE);
  const cta = popIn(f, fps, D_CTA);
  const stickerLeave = s(B_OUT, B_OUT + 8);
  const nudge = Math.abs(Math.sin(f / 7)) * 8;
  return (
    <AbsoluteFill>
      <Room lightness={lightness} frame={f} />
      <Embers lightness={lightness} frame={f} />
      <Candelabra data={data} at={still ? 0 : giftFrame(f)} />
      {!still && f >= GUST - 8 && f < GUST + 50 && <Gust frame={f} />}

      {/* kicker: stays until the offer, then names the gift */}
      {f < C_OUT + 8 && <Kicker text="TELEGRAM SOVG‘A · IJARA" style={{opacity: 1 - cLeave}} />}
      {f >= D_PRICE && <Kicker text="CHILL FLAME · SHAMDON" style={{opacity: Math.min(1, price * 2)}} />}

      {f < A_OUT + 8 && <Headline lines={['TILAK', 'QILING!']} enter={1} leave={aLeave} />}
      {!still && f >= B_IN && f < B_OUT + 8 && <Headline lines={['ENDI', 'PUFLANG!']} enter={bIn} leave={bLeave} accent={FLAME} />}
      {!still && f >= RELIGHT && f < C_OUT + 8 &&
        <Headline lines={['TILAGINGIZ', 'USHALDI!']} enter={cIn} leave={cLeave} size={150} />}

      {/* price sticker on the opening, through the blowing */}
      {f < B_OUT + 8 && (
        <Sticker bg={INK} rotate={-4} enter={1} leave={stickerLeave}>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: CREAM, lineHeight: 1.05}}>Shamdon · kuniga</div>
          <div style={{fontFamily: ROUND, fontWeight: 700, fontSize: 96, color: FLAME, lineHeight: 1.0, whiteSpace: 'nowrap'}}>750 so‘m</div>
        </Sticker>
      )}
      {!still && f >= C_SUB && f < C_OUT + 8 && (
        <Sticker bg={CREAM} rotate={3} enter={cSub} leave={cLeave}>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 48, color: INK, lineHeight: 1.25}}>
            Shamdon <span style={{background: TEAL, padding: '0 12px', borderRadius: 12, border: `4px solid ${INK}`}}>3–30 kun</span>
            <br />profilingizda
          </div>
        </Sticker>
      )}

      {/* offer */}
      {!still && f >= D_PRICE && (
        <div style={{position: 'absolute', left: 64, top: 316, opacity: Math.min(1, price * 2), transform: `translateY(${(1 - price) * 50}px)`}}>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 52, color: CREAM, lineHeight: 1, textShadow: `4px 5px 0 ${INK}`}}>
            Ijara · kuniga</div>
          <div style={{fontFamily: ROUND, fontWeight: 700, fontSize: 196, lineHeight: 1.0, color: FLAME, whiteSpace: 'nowrap',
            WebkitTextStroke: `9px ${INK}`, paintOrder: 'stroke fill', textShadow: `10px 11px 0 ${INK}`}}>750 so‘m</div>
        </div>
      )}
      {!still && f >= D_CTA && (
        <div style={{position: 'absolute', left: 70, top: 1290, opacity: Math.min(1, cta * 2), transform: `translateY(${(1 - cta) * 40}px)`}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 18, padding: '12px 36px 12px 12px', borderRadius: 999,
            background: INK, border: `5px solid ${CREAM}`}}>
            <Img src={staticFile('logo.png')} style={{width: 82, height: 82, borderRadius: '50%', background: BRAND.ink}} />
            <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 48, color: CREAM}}>{BRAND.bot}</span>
          </div>
          <div style={{marginTop: 14, display: 'flex'}}>
            <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 50, color: INK, background: TEAL, border: `5px solid ${INK}`,
              borderRadius: 999, padding: '6px 30px 10px', transform: `translateY(${-nudge}px)`}}>↑ Havola profilda</div>
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
    <AbsoluteFill>
      <Scene data={gifts[0]} frame={frame} />
      <Audio src={staticFile(`audio/bed_${ID}.wav`)}
        volume={(f) => interpolate(f, [0, 8, GUST, GUST + 30, RELIGHT, RELIGHT + 20, FRAMES - 30, FRAMES - 1],
          [0, 0.3, 0.3, 0.18, 0.18, 0.3, 0.3, 0], clamp)} />
      <Audio src={staticFile('audio/kindle.wav')} volume={0.14} />
      <Sequence from={GUST - 4}><Audio src={staticFile('audio/blow.wav')} volume={0.34} /></Sequence>
      <Sequence from={RELIGHT}><Audio src={staticFile('audio/kindle.wav')} volume={0.26} /></Sequence>
      <Sequence from={C_OUT}><Audio src={staticFile('audio/whoosh.wav')} volume={0.08} /></Sequence>
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
