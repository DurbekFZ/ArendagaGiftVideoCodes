import '@fontsource/chakra-petch/700.css';
import '@fontsource/space-mono/700.css';
import {Lottie} from '@remotion/lottie';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Freeze, Img, Sequence, cancelRender, continueRender, delayRender, interpolate,
  spring, staticFile, useCurrentFrame,
} from 'remotion';
import {GiftData, H, W, clamp, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "CHIZMA" — the Liberty Figure #45183 as the subject of a technical drawing. A deep blueprint-navy sheet with a
// fine grid, a drawing frame, construction circles, crosshairs and dimension lines around a huge aquamarine
// statuette. Frame one already reads "Telegram NFT sovg‘a ijarasi / Kuniga 850 so‘m"; at 0.3 s the torch flares
// amber, the construction lines light up and the figure hops. Then two drawing labels, each with a leader line
// that draws itself to the figure: "Liberty Figure / Fedora belgisi — atigi 0,2%" and "Profilingizda turadi / 3 kundan 30 kungacha"; then the price, the bot and the link.
const ID = 'V20261125a';
const GIFT = 'libertyfigure-45183'; // Aquamarine model 3%, Navy Blue backdrop 1.2%, Fedora symbol 0.2%; 850 so‘m a day
const HEAD = "'Chakra Petch', sans-serif";
const MONO = "'Space Mono', monospace";

// Palette. Gift: aquamarine glass figure with an amber torch on a Navy Blue backdrop. Background family: blueprint
// navy (the backdrop's own blue, darker). Accent: the torch's amber (complementary to the blue). Neutral: ice white
// lines and type, navy ink. Extra hue: the figure's aquamarine, only for small markers.
const BG_1 = '#2352a8';
const BG_2 = '#15327c';
const BG_3 = '#0a1a4c';
const AMBER = '#ffb547';
const AMBER_DEEP = '#e8871c';
const ICE = '#eef4ff';
const INK = '#0a1640';
const AQUA = '#62f2d2';
const LINE = 'rgba(226,236,255,';

// Timeline (30 fps).
const HOP = 9; // torch flare and first hop, 0.3 s
const A_IN = 138; // label 1
const A_OUT = 256;
const B_IN = 266; // label 2
const B_OUT = 384;
const P_IN = 396; // price
const C_IN = 432; // bot and link, 1.2 s later
const FRAMES = 570; // 19.0 s
const HOPS = [HOP, A_IN + 2, B_IN + 2, P_IN + 2];

// Gift geometry. The figure fills ~31–73% of its box across and ~19–81% down.
const GS = 1060;
const GX = 470;
const GY = 1180;
const at = (fx: number, fy: number) => [GX + (fx - 0.5) * GS, GY + (fy - 0.5) * GS];
const [TORCH_X, TORCH_Y] = at(0.33, 0.25);

// The figure turns away between frames ~95 and ~145 of its 180-frame cycle (narrow there). Ping-pong only through
// the poses that face the viewer: 150 → 179 → 0 → 60 and back.
const POSES = [...Array.from({length: 30}, (_, i) => 150 + i), ...Array.from({length: 61}, (_, i) => i)];
const poseAt = (f: number) => {
  const p = f % 180;
  return POSES[p <= 90 ? p : 180 - p];
};

const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([`700 10px "Chakra Petch"`, `700 10px "Space Mono"`]
      .map((font) => document.fonts.load(font, 'KUNIGA 850 so‘m o‘g‘ — ↑ 0,2% Liberty Figure Profilingizda')))
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

const ease = Easing.out(Easing.cubic);
// A text block: rises in over 8 frames, fades out over 6. Never partly masked.
const block = (f: number, from: number, to?: number) => {
  const t = interpolate(f, [from, from + 8], [0, 1], {...clamp, easing: ease});
  const o = to === undefined ? 1 : interpolate(f, [to, to + 6], [1, 0], clamp);
  return {opacity: t * o, transform: `translateY(${(1 - t) * 26}px)`};
};
const shown = (f: number, from: number, to?: number) => f >= from && (to === undefined || f < to + 6);

/** Blueprint sheet: navy gradient, a fine grid that drifts slowly, and the drawing frame. */
const Sheet: React.FC<{f: number}> = ({f}) => {
  const drift = (f * 0.35) % 180;
  return (
    <AbsoluteFill style={{background: BG_3}}>
      <AbsoluteFill style={{background:
        `radial-gradient(ellipse 85% 60% at ${GX / W * 100}% ${GY / H * 100 - 6}%, ${BG_1} 0%, ${BG_2} 52%, ${BG_3} 100%)`}} />
      <div style={{position: 'absolute', left: -180, top: -180, width: W + 360, height: H + 360,
        transform: `translate(${drift * 0.4}px, ${drift}px)`,
        backgroundImage: `linear-gradient(${LINE}.07) 1.5px, transparent 1.5px), linear-gradient(90deg, ${LINE}.07) 1.5px, transparent 1.5px),
          linear-gradient(${LINE}.15) 2px, transparent 2px), linear-gradient(90deg, ${LINE}.15) 2px, transparent 2px)`,
        backgroundSize: '36px 36px, 36px 36px, 180px 180px, 180px 180px'}} />
      {/* soft vignette keeps the edges deep */}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 62% at 50% 55%, rgba(5,12,40,0) 55%, rgba(5,12,40,.6) 100%)'}} />
      {/* drawing frame with tick marks */}
      <div style={{position: 'absolute', left: 30, top: 30, right: 30, bottom: 30, border: `3px solid ${LINE}.38)`}} />
      <div style={{position: 'absolute', left: 44, top: 44, right: 44, bottom: 44, border: `1.5px solid ${LINE}.2)`}} />
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        {Array.from({length: 11}, (_, i) => 120 + i * 84).map((x) => (
          <g key={x}><line x1={x} y1={30} x2={x} y2={44} stroke={`${LINE}.38)`} strokeWidth={2} />
            <line x1={x} y1={H - 44} x2={x} y2={H - 30} stroke={`${LINE}.38)`} strokeWidth={2} /></g>))}
        {Array.from({length: 21}, (_, i) => 120 + i * 84).map((y) => (
          <g key={y}><line x1={30} y1={y} x2={44} y2={y} stroke={`${LINE}.38)`} strokeWidth={2} />
            <line x1={W - 44} y1={y} x2={W - 30} y2={y} stroke={`${LINE}.38)`} strokeWidth={2} /></g>))}
      </svg>
    </AbsoluteFill>
  );
};

/** Construction geometry around the figure: circles, crosshairs and dimension lines. Lights up at each hop. */
const Construction: React.FC<{f: number; still?: boolean}> = ({f, still}) => {
  const flare = still ? 0.4 : Math.max(...HOPS.map((h) => interpolate(f, [h, h + 4, h + 30], [0, 1, 0], clamp)));
  const draw = still ? 1 : interpolate(f, [HOP, HOP + 14], [0.35, 1], {...clamp, easing: ease});
  const a = 0.22 + flare * 0.4;
  const top = GY - 0.31 * GS;
  const bottom = GY + 0.31 * GS;
  const left = GX - 0.19 * GS;
  const right = GX + 0.23 * GS;
  const arrow = (x: number, y: number, dir: number) =>
    <path d={`M ${x} ${y} l ${-10} ${dir * 22} l 20 0 Z`} fill={`${LINE}${a + 0.15})`} />;
  const arrowH = (x: number, y: number, dir: number) =>
    <path d={`M ${x} ${y} l ${dir * 22} -10 l 0 20 Z`} fill={`${LINE}${a + 0.15})`} />;
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
      <g transform={`rotate(${f * 0.12} ${GX} ${GY})`}>
        <circle cx={GX} cy={GY} r={470} fill="none" stroke={`${LINE}${a})`} strokeWidth={2.5}
          strokeDasharray="18 14" pathLength={1000} strokeDashoffset={1000 * (1 - draw)} />
      </g>
      <g transform={`rotate(${-f * 0.2} ${GX} ${GY})`}>
        <circle cx={GX} cy={GY} r={380} fill="none" stroke={`${LINE}${a * 0.8})`} strokeWidth={1.5} strokeDasharray="4 10" />
      </g>
      <line x1={GX} y1={GY - 560 * draw} x2={GX} y2={GY + 560 * draw} stroke={`${LINE}${a * 0.6})`} strokeWidth={1.5} strokeDasharray="30 10 6 10" />
      <line x1={GX - 560 * draw} y1={GY} x2={GX + 560 * draw} y2={GY} stroke={`${LINE}${a * 0.6})`} strokeWidth={1.5} strokeDasharray="30 10 6 10" />
      {/* height dimension to the right of the figure */}
      <line x1={right + 70} y1={top} x2={right + 70} y2={bottom} stroke={`${LINE}${a + 0.1})`} strokeWidth={2.5} />
      <line x1={right + 20} y1={top} x2={right + 100} y2={top} stroke={`${LINE}${a})`} strokeWidth={1.5} />
      <line x1={right + 20} y1={bottom} x2={right + 100} y2={bottom} stroke={`${LINE}${a})`} strokeWidth={1.5} />
      {arrow(right + 70, top, 1)}
      {arrow(right + 70, bottom, -1)}
      {/* width dimension under the pedestal */}
      <line x1={left} y1={bottom + 60} x2={right} y2={bottom + 60} stroke={`${LINE}${a + 0.1})`} strokeWidth={2.5} />
      <line x1={left} y1={bottom + 20} x2={left} y2={bottom + 90} stroke={`${LINE}${a})`} strokeWidth={1.5} />
      <line x1={right} y1={bottom + 20} x2={right} y2={bottom + 90} stroke={`${LINE}${a})`} strokeWidth={1.5} />
      {arrowH(left, bottom + 60, 1)}
      {arrowH(right, bottom + 60, -1)}
    </svg>
  );
};

/** Amber light of the torch: flickers, flares at the hops. */
const TorchGlow: React.FC<{f: number; y: number; still?: boolean}> = ({f, y, still}) => {
  const flare = still ? 0.5 : Math.max(...HOPS.map((h, i) => interpolate(f, [h, h + 3, h + 24], [0, i === 0 ? 1.2 : 0.7, 0], clamp)));
  const flicker = 0.8 + Math.sin(f / 3.1) * 0.08 + Math.sin(f / 1.7) * 0.06;
  const size = 360 + flare * 260;
  return (
    <div style={{position: 'absolute', left: TORCH_X - size / 2, top: y - size / 2, width: size, height: size,
      borderRadius: '50%', mixBlendMode: 'screen', opacity: (0.5 + flare * 0.5) * flicker,
      background: `radial-gradient(circle, ${AMBER}cc 0%, ${AMBER_DEEP}55 32%, rgba(232,135,28,0) 68%)`}} />
  );
};

/** A leader line from a label to a point on the figure, drawn in 10 frames, ending in a pulsing aqua marker. */
const Leader: React.FC<{f: number; from: number; to: number; points: number[][]}> = ({f, from, to, points}) => {
  if (!shown(f, from, to)) return null;
  const draw = interpolate(f, [from + 4, from + 14], [0, 1], {...clamp, easing: ease});
  const o = interpolate(f, [to, to + 6], [1, 0], clamp);
  const d = points.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ');
  const [ex, ey] = points[points.length - 1];
  const dot = interpolate(f, [from + 13, from + 18], [0, 1], clamp);
  const pulse = 1 + ((f - from) % 40) / 40;
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, opacity: o}}>
      <path d={d} fill="none" stroke={ICE} strokeWidth={4} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw}
        strokeLinejoin="round" />
      <circle cx={points[0][0]} cy={points[0][1]} r={8} fill={ICE} />
      <circle cx={ex} cy={ey} r={16 * dot} fill={AQUA} stroke={INK} strokeWidth={4} />
      <circle cx={ex} cy={ey} r={16 * pulse * dot} fill="none" stroke={AQUA} strokeWidth={3} opacity={(2 - pulse) * dot} />
    </svg>
  );
};

/** Drawing label: a ruled box with corner ticks. */
const Label: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{position: 'absolute', left: 70, top: 250, padding: '30px 40px 34px 40px', background: 'rgba(10,26,76,.72)',
    border: `3px solid ${ICE}`, boxShadow: `10px 10px 0 ${AMBER}`, ...style}}>
    {[[-12, -12], [null, -12], [-12, null], [null, null]].map(([l, t], i) => (
      <div key={i} style={{position: 'absolute', width: 20, height: 20, background: AMBER, border: `3px solid ${INK}`,
        left: l ?? undefined, right: l === null ? -12 : undefined, top: t ?? undefined, bottom: t === null ? -12 : undefined}} />
    ))}
    {children}
  </div>
);

const Pill: React.FC<{text: string}> = ({text}) => (
  <div style={{display: 'inline-block', padding: '10px 22px', border: `3px solid ${ICE}`, background: 'rgba(10,26,76,.6)',
    fontFamily: MONO, fontWeight: 700, fontSize: 38, letterSpacing: 1, color: ICE}}>{text}</div>
);

const Figure: React.FC<{data: GiftData; f: number; pose: number; size: number; y: number; lift: number}> =
  ({data, f, pose, size, y, lift}) => (
    <>
      <div style={{position: 'absolute', left: GX - 190, top: y + 0.29 * size, width: 400, height: 60, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(3,8,30,.7) 0%, rgba(3,8,30,0) 70%)', transform: `scale(${1 + lift / 160})`}} />
      <div style={{position: 'absolute', left: GX - size / 2, top: y - size / 2 - lift + Math.sin(f / 19) * 7, width: size, height: size,
        filter: 'drop-shadow(0 0 46px rgba(98,242,210,.28)) drop-shadow(0 26px 28px rgba(3,8,30,.55))'}}>
        <Freeze frame={pose}><Lottie animationData={data.gift} style={{width: size, height: size}} /></Freeze>
      </div>
    </>
  );

const Video: React.FC = () => {
  useFonts();
  const gifts = useGifts([GIFT]);
  const f = useCurrentFrame();
  if (!gifts) return null;
  const [data] = gifts;
  const lift = Math.max(...HOPS.map((h, i) => {
    const t = f - h;
    if (t < 0 || t > 24) return 0;
    return Math.sin((t / 24) * Math.PI) * (i === 0 ? 52 : 34);
  }));
  // At the end the figure steps down a little to leave room for the bot and the link.
  const end = interpolate(f, [P_IN - 6, P_IN + 14], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const size = GS - end * 120;
  const y = GY + end * 70;
  const torchY = y + (0.25 - 0.5) * size - lift;

  return (
    <AbsoluteFill style={{background: BG_3, overflow: 'hidden'}}>
      <Sheet f={f} />
      <Construction f={f} />
      <TorchGlow f={f} y={torchY} />
      <Figure data={data} f={f} pose={poseAt(f)} size={size} y={y} lift={lift} />

      {/* Opening: product and price, readable from frame one. */}
      {shown(f, 0, 126) && (
        <div style={{position: 'absolute', left: 70, top: 250, ...block(f, -8, 126)}}>
          <Pill text="TELEGRAM NFT SOVG‘A IJARASI" />
          <div style={{marginTop: 40, fontFamily: MONO, fontWeight: 700, fontSize: 64, color: ICE, lineHeight: 1}}>Kuniga</div>
          <div style={{marginTop: 6, fontFamily: HEAD, fontWeight: 700, fontSize: 178, color: AMBER, lineHeight: 1,
            textShadow: `8px 8px 0 ${INK}`}}>850 so‘m</div>
        </div>
      )}

      {/* Label 1: name and the rare symbol. */}
      <Leader f={f} from={A_IN} to={A_OUT} points={[[130, 690], [130, 1150], [345, 1150]]} />
      {shown(f, A_IN, A_OUT) && (
        <Label style={block(f, A_IN, A_OUT)}>
          <div style={{fontFamily: HEAD, fontWeight: 700, fontSize: 92, color: ICE, lineHeight: 1}}>Liberty Figure</div>
          <div style={{marginTop: 26, fontFamily: MONO, fontWeight: 700, fontSize: 54, color: ICE, lineHeight: 1.1}}>Fedora belgisi —</div>
          <div style={{marginTop: 6, fontFamily: HEAD, fontWeight: 700, fontSize: 118, color: AMBER, lineHeight: 1}}>atigi 0,2%</div>
        </Label>
      )}

      {/* Label 2: what renting means. */}
      <Leader f={f} from={B_IN} to={B_OUT} points={[[130, 700], [130, 1480], [395, 1480]]} />
      {shown(f, B_IN, B_OUT) && (
        <Label style={block(f, B_IN, B_OUT)}>
          <div style={{fontFamily: HEAD, fontWeight: 700, fontSize: 96, color: ICE, lineHeight: 1.02}}>Profilingizda<br />turadi</div>
          <div style={{marginTop: 22, fontFamily: MONO, fontWeight: 700, fontSize: 50, color: AMBER, lineHeight: 1.1}}>3 kundan 30 kungacha</div>
        </Label>
      )}

      {/* End: price, bot, link. */}
      {shown(f, P_IN) && (
        <div style={{position: 'absolute', left: 70, top: 250, ...block(f, P_IN)}}>
          <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 64, color: ICE, lineHeight: 1}}>Kuniga</div>
          <div style={{marginTop: 6, fontFamily: HEAD, fontWeight: 700, fontSize: 178, color: AMBER, lineHeight: 1,
            textShadow: `8px 8px 0 ${INK}`}}>850 so‘m</div>
        </div>
      )}
      {shown(f, C_IN) && (
        <div style={{position: 'absolute', left: 70, top: 540, ...block(f, C_IN)}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 18, padding: '16px 30px 16px 18px', background: AMBER,
            border: `3px solid ${INK}`, boxShadow: `8px 8px 0 ${INK}`}}>
            <Img src={staticFile('logo.png')} style={{width: 66, height: 66, borderRadius: '50%', background: INK}} />
            <div style={{fontFamily: HEAD, fontWeight: 700, fontSize: 60, color: INK, lineHeight: 1}}>@ArendagaGiftBot</div>
          </div>
          <div style={{marginTop: 26, fontFamily: MONO, fontWeight: 700, fontSize: 46, color: ICE}}>↑ Havola profilda</div>
        </div>
      )}

      <Audio src={staticFile(`audio/bed_${ID}.wav`)}
        volume={(fr) => interpolate(fr, [0, 12, FRAMES - 30, FRAMES], [0, 0.32, 0.32, 0], clamp)} />
      <Sequence from={HOP}><Audio src={staticFile('audio/draft.wav')} volume={0.4} /></Sequence>
      <Sequence from={A_IN + 4}><Audio src={staticFile('audio/draft.wav')} volume={0.3} /></Sequence>
      <Sequence from={B_IN + 4}><Audio src={staticFile('audio/draft.wav')} volume={0.3} /></Sequence>
      <Sequence from={P_IN}><Audio src={staticFile('audio/feltdrop.wav')} volume={0.3} /></Sequence>
    </AbsoluteFill>
  );
};

const Cover: React.FC = () => {
  useFonts();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  const [data] = gifts;
  const size = 1040;
  const y = 1200;
  return (
    <AbsoluteFill style={{background: BG_3, overflow: 'hidden'}}>
      <Sheet f={0} />
      <Construction f={60} still />
      <TorchGlow f={0} y={y + (0.25 - 0.5) * size} still />
      <Figure data={data} f={0} pose={165} size={size} y={y} lift={0} />
      <div style={{position: 'absolute', left: 70, top: 300}}>
        <Pill text="TELEGRAM NFT SOVG‘A IJARASI" />
        <div style={{marginTop: 36, fontFamily: MONO, fontWeight: 700, fontSize: 64, color: ICE, lineHeight: 1}}>Kuniga</div>
        <div style={{marginTop: 6, fontFamily: HEAD, fontWeight: 700, fontSize: 178, color: AMBER, lineHeight: 1,
          textShadow: `8px 8px 0 ${INK}`}}>850 so‘m</div>
      </div>
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
