// This package's exports map adds `.css` itself and ships no type declarations.
// @ts-ignore
import '@fontsource/lilita-one/400';
import {Lottie} from '@remotion/lottie';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Freeze, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random,
  spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {BRAND, GiftData, H, W, clamp, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "TUGAMAYDIGAN MUZQAYMOQ" — the never-ending ice cream. The Ice Cream gift (model "Cold Steel") is a steel-blue
// ice-cream bar whose own animation is someone eating it: three bites, only the stick is left, then it spins and
// fills up again. Frame one: a bold flat gold poster, "Telegram NFT sovg‘a", the headline, a "kuniga 750 so‘m" tag
// and the bar already being bitten. At 3 s "Tugadimi?" (finished?), at 5 s "Yana to‘la!" (full again).
// Then a comparison: an ordinary drawn ice cream melts into a puddle ("Oddiysi eriydi.") next to the gift, which
// stays on your profile for 3-30 days. Ends on the price, the bot and the link. Silent, calm pad.
const ID = 'V20261118f';
const GIFT = 'icecream-211816'; // Cold Steel model 3%, Old Gold backdrop 1.5%, Breeze symbol 0.4%; 750 so‘m a day
const DISPLAY = "'Lilita One', sans-serif";
const SANS = "'Manrope', sans-serif";
// Lilita One's ‘ is wide; tighten it so "so‘m" reads as one word.
const Q: React.FC = () => <span style={{margin: '0 -0.1em 0 -0.06em'}}>‘</span>;

// Palette. Background family: the gift's own Old Gold backdrop (#b58d38 / #946925), lifted to a sunny poster gold.
// Accent: the ice blue of the bar itself (complementary to the gold). Neutrals: cream and a warm ink.
const GOLD_LIGHT = '#f2c95c';
const GOLD = '#d7a23c';
const GOLD_DEEP = '#8a5d18';
const ICE = '#a9d3ff';
const ICE_DEEP = '#4f86cf';
const CREAM = '#fff4dc';
const INK = '#1d1407';

// Timeline (30 fps).
const GIFT_OFFSET = 6; // the gift's own animation runs 6 frames ahead, so the first bite lands at 0.3 s
const BITES = [10, 40, 72]; // video frames of the three bites (gift frames ~16, 46, 78)
const REGROW = 110; // the stick spins and fills up again
const ASK_IN = 84; // "Tugadimi?" — only the stick is left
const ASK_OUT = 142;
const FULL_IN = 146; // "Yana to‘la!"
const A_OUT = 228; // 7.6 s
const B_HEAD = 238;
const MELT = [252, 352] as const;
const B_LINE = 282; // 9.4 s
const B_OUT = 400; // 13.3 s
const C_PRICE = 410;
const C_CTA = 446; // 14.9 s
const FRAMES = 570; // 19.0 s

const useFonts = () => {
  const [handle] = useState(() => delayRender('lilita'));
  useEffect(() => {
    document.fonts.load(`400 10px "Lilita One"`, 'TUGAMAYDIGAN MUZQAYMOQ 750 so‘m Oddiysi eriydi.')
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

const ease = Easing.bezier(0.6, 0.02, 0.25, 1);
const out3 = Easing.out(Easing.cubic);
const popIn = (frame: number, fps: number, at: number) =>
  spring({frame: frame - at, fps, config: {damping: 13, stiffness: 190, mass: 0.7}});

/** Which frame of the gift's own animation to show: it plays once (bites, stick, refill) and then holds the full bar. */
const giftFrame = (frame: number) => {
  const f = frame + GIFT_OFFSET;
  return f >= 179 ? 0 : f;
};

/** Sunny flat-gold poster with slow rays, the gift's Breeze pattern and drifting frost flakes. */
const Background: React.FC<{data: GiftData}> = ({data}) => {
  const frame = useCurrentFrame();
  const size = 2100;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 62% at 45% 52%, ${GOLD_LIGHT} 0%, ${GOLD} 52%, ${GOLD_DEEP} 100%)`}}>
      <div style={{position: 'absolute', left: 440 - 1100, top: 1060 - 1100, width: 2200, height: 2200, opacity: 0.22,
        transform: `rotate(${frame * 0.18}deg)`,
        background: `repeating-conic-gradient(from 0deg, ${CREAM} 0deg 9deg, transparent 9deg 24deg)`,
        WebkitMaskImage: 'radial-gradient(circle, #000 10%, transparent 64%)'}} />
      <div style={{position: 'absolute', left: W / 2 - size / 2, top: 960 - size / 2, width: size, height: size, opacity: 0.12,
        transform: `rotate(${-frame * 0.03}deg)`, WebkitMaskImage: 'radial-gradient(circle, transparent 16%, #000 36%, transparent 68%)'}}>
        <Lottie animationData={data.pattern} playbackRate={0.0001} style={{width: size, height: size}} />
      </div>
      {Array.from({length: 26}, (_, i) => {
        const r = (k: string) => random(`frost-${i}-${k}`);
        const s = 10 + r('s') * 22;
        const y = ((r('y') * H + frame * (0.5 + r('v') * 1.1)) % (H + 60)) - 30;
        const x = r('x') * W + Math.sin(frame / (26 + r('w') * 30) + i) * 30;
        return (
          <svg key={i} width={s} height={s} viewBox="-10 -10 20 20"
            style={{position: 'absolute', left: x, top: y, opacity: 0.25 + r('o') * 0.45, transform: `rotate(${frame * (r('r') - 0.5) * 2}deg)`}}>
            {[0, 60, 120].map((a) => (
              <line key={a} x1={0} y1={-9} x2={0} y2={9} stroke={CREAM} strokeWidth={2.4} strokeLinecap="round" transform={`rotate(${a})`} />
            ))}
          </svg>
        );
      })}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(60,30,0,.28) 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0) 74%, rgba(60,30,0,.32) 100%)'}} />
    </AbsoluteFill>
  );
};

/** The gift with its own animation driven to a chosen frame. x, y = box centre. */
const Bar: React.FC<{data: GiftData; x: number; y: number; size: number; at: number}> = ({data, x, y, size, at}) => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 18) * 8;
  return (
    <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2 + bob, width: size, height: size,
      filter: 'drop-shadow(0 34px 40px rgba(70,40,0,.35))'}}>
      <Freeze frame={at}>
        <Lottie animationData={data.gift} style={{width: size, height: size}} />
      </Freeze>
    </div>
  );
};

/** A flat sticker: cream disc with a hard ink offset shadow, behind the gift. */
const Disc: React.FC<{x: number; y: number; r: number; opacity?: number}> = ({x, y, r, opacity = 1}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, opacity}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: INK, transform: 'translate(16px, 18px)'}} />
      <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: CREAM, border: `8px solid ${INK}`}} />
      <div style={{position: 'absolute', inset: 34, borderRadius: '50%', border: `5px dashed ${ICE_DEEP}`, opacity: 0.45,
        transform: `rotate(${frame * 0.4}deg)`}} />
    </div>
  );
};

const Sticker: React.FC<{children: React.ReactNode; style: React.CSSProperties; bg: string; rotate: number; enter: number;
  leave?: number}> = ({children, style, bg, rotate, enter, leave = 0}) => (
  <div style={{position: 'absolute', ...style, opacity: Math.min(1, enter * 2) * (1 - leave),
    transform: `rotate(${rotate}deg) scale(${(0.6 + 0.4 * enter) * (1 - leave * 0.3)})`}}>
    <div style={{position: 'relative', background: bg, border: `7px solid ${INK}`, borderRadius: 30, padding: '14px 30px 18px',
      boxShadow: `12px 14px 0 ${INK}`}}>{children}</div>
  </div>
);

/** Opening poster: kicker, headline, price tag and the two reaction stickers. */
const Opening: React.FC<{out: number; still?: boolean}> = ({out, still}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ask = still ? 0 : popIn(frame, fps, ASK_IN);
  const askOut = still ? 1 : interpolate(frame, [ASK_OUT, ASK_OUT + 6], [0, 1], clamp);
  const full = still ? 0 : popIn(frame, fps, FULL_IN);
  const lift = -out * 260;
  return (
    <>
      <div style={{position: 'absolute', left: 70, top: 232 + lift, opacity: 1 - out, display: 'flex'}}>
        <div style={{background: INK, color: CREAM, fontFamily: SANS, fontWeight: 800, fontSize: 38, letterSpacing: 3,
          padding: '10px 26px 12px', borderRadius: 999}}>TELEGRAM NFT SOVG‘A</div>
      </div>
      <div style={{position: 'absolute', left: 64, top: 318 + lift, opacity: 1 - out, fontFamily: DISPLAY, fontSize: 126,
        lineHeight: 1.0, color: INK, whiteSpace: 'nowrap'}}>
        <div>TUGAMAYDIGAN</div>
        <div style={{color: CREAM, WebkitTextStroke: `7px ${INK}`, paintOrder: 'stroke fill', textShadow: `8px 9px 0 ${INK}`}}>MUZQAYMOQ</div>
      </div>
      <Sticker bg={INK} rotate={-5} enter={1} leave={out}
        style={{left: 548, top: 1300 + out * 200}}>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: CREAM, lineHeight: 1}}>kuniga</div>
        <div style={{fontFamily: DISPLAY, fontSize: 84, color: ICE, lineHeight: 1.02, whiteSpace: 'nowrap'}}>750 so<Q />m</div>
      </Sticker>
      {!still && frame >= ASK_IN && frame < ASK_OUT + 6 && (
        <Sticker bg={ICE} rotate={-7} enter={ask} leave={askOut} style={{left: 74, top: 760}}>
          <div style={{fontFamily: DISPLAY, fontSize: 88, color: INK, lineHeight: 1, whiteSpace: 'nowrap'}}>Tugadimi?</div>
        </Sticker>
      )}
      {!still && frame >= FULL_IN && (
        <Sticker bg={CREAM} rotate={4} enter={full} leave={out} style={{left: 74, top: 760}}>
          <div style={{fontFamily: DISPLAY, fontSize: 88, color: INK, lineHeight: 1, whiteSpace: 'nowrap'}}>
            Yana <span style={{color: ICE_DEEP}}>to<Q />la!</span></div>
        </Sticker>
      )}
    </>
  );
};

/** An ordinary ice cream, drawn flat, melting into a puddle as t goes 0 -> 1. Local box 380 x 800. */
const Melting: React.FC<{t: number}> = ({t}) => {
  const frame = useCurrentFrame();
  const top = 150 + t * 330;
  const bottom = 520 + t * 30;
  const wobble = Math.sin(frame / 4) * 3 * t * (1 - t) * 4;
  const drips = [[118, 150], [186, 90], [252, 210]] as const;
  return (
    <svg width={380} height={800} viewBox="0 0 380 800" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <ellipse cx={190} cy={724} rx={40 + 150 * t} ry={10 + 30 * t} fill={CREAM} stroke={INK} strokeWidth={7} />
      <rect x={171} y={500} width={38} height={226} rx={16} fill="#e9c288" stroke={INK} strokeWidth={7} />
      {drips.map(([x, len], i) => {
        const grow = Math.min(1, Math.max(0, t * 1.8 - i * 0.15));
        const fadeDrip = interpolate(t, [0.62, 0.92], [1, 0], clamp);
        const l = Math.max(0, len * grow * fadeDrip);
        return l > 2 ? <rect key={i} x={x - 15} y={bottom - 30} width={30} height={30 + l} rx={15} fill={CREAM} stroke={INK} strokeWidth={7} /> : null;
      })}
      <path d={`M ${100 + wobble} ${bottom} L ${100 + wobble} ${top + 80} Q ${100 + wobble} ${top} 190 ${top} Q ${280 - wobble} ${top} ${280 - wobble} ${top + 80}
        L ${280 - wobble} ${bottom} Q 240 ${bottom + 22} 190 ${bottom} Q 140 ${bottom + 22} ${100 + wobble} ${bottom} Z`}
        fill={CREAM} stroke={INK} strokeWidth={7} strokeLinejoin="round" opacity={t > 0.97 ? 0 : 1} />
      <path d={`M ${130 + wobble} ${top + 50} Q ${132} ${top + 26} ${150} ${top + 20}`} stroke="#ffffff" strokeWidth={10} strokeLinecap="round" fill="none"
        opacity={1 - t} />
    </svg>
  );
};

const Sun: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <svg width={110} height={110} viewBox="-55 -55 110 110" style={{transform: `rotate(${frame * 0.8}deg)`}}>
      {Array.from({length: 8}, (_, i) => (
        <rect key={i} x={-6} y={-52} width={12} height={20} rx={6} fill={GOLD_LIGHT} stroke={INK} strokeWidth={4} transform={`rotate(${i * 45})`} />
      ))}
      <circle r={26} fill={GOLD_LIGHT} stroke={INK} strokeWidth={5} />
    </svg>
  );
};

const Flake: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <svg width={104} height={104} viewBox="-52 -52 104 104" style={{transform: `rotate(${frame * 0.5}deg)`}}>
      {[0, 60, 120].map((a) => (
        <g key={a} transform={`rotate(${a})`} stroke={ICE_DEEP} strokeWidth={8} strokeLinecap="round">
          <line x1={0} y1={-44} x2={0} y2={44} />
          <line x1={0} y1={-28} x2={-12} y2={-40} /><line x1={0} y1={-28} x2={12} y2={-40} />
          <line x1={0} y1={28} x2={-12} y2={40} /><line x1={0} y1={28} x2={12} y2={40} />
        </g>
      ))}
    </svg>
  );
};

/** Comparison panels: the melting ordinary ice cream (left) and the gift's frame (right). */
const Panels: React.FC<{enter: number; leave: number; melt: number}> = ({enter, leave, melt}) => {
  const y = 650;
  const h = 840;
  const shift = (1 - enter) * 1100 + leave * 1300;
  return (
    <>
      <div style={{position: 'absolute', left: 70, top: y + shift, width: 380, height: h}}>
        <div style={{position: 'absolute', inset: 0, borderRadius: 36, background: INK, transform: 'translate(14px, 16px)'}} />
        <div style={{position: 'absolute', inset: 0, borderRadius: 36, border: `7px solid ${INK}`, overflow: 'hidden',
          background: `linear-gradient(180deg, #f0a64a 0%, ${GOLD} 60%, #b97d26 100%)`}}>
          <div style={{position: 'absolute', left: 22, top: 22}}><Sun /></div>
          <div style={{position: 'absolute', left: -7, top: 40}}><Melting t={melt} /></div>
        </div>
      </div>
      <div style={{position: 'absolute', left: 490, top: y + shift * 1.12, width: 380, height: h}}>
        <div style={{position: 'absolute', inset: 0, borderRadius: 36, background: INK, transform: 'translate(14px, 16px)'}} />
        <div style={{position: 'absolute', inset: 0, borderRadius: 36, border: `7px solid ${INK}`, overflow: 'hidden',
          background: `radial-gradient(ellipse 80% 60% at 50% 55%, #ffffff 0%, ${CREAM} 55%, #f3dcb0 100%)`}}>
          <div style={{position: 'absolute', right: 24, top: 24}}><Flake /></div>
        </div>
      </div>
    </>
  );
};

const Compare: React.FC<{enter: number; line: number; leave: number}> = ({enter, line, leave}) => (
  <>
    <div style={{position: 'absolute', left: 66, top: 236 - leave * 300, opacity: Math.min(1, enter * 2) * (1 - leave),
      transform: `translateY(${(1 - enter) * 40}px)`, fontFamily: DISPLAY, fontSize: 112, lineHeight: 1, color: INK, whiteSpace: 'nowrap'}}>
      Oddiysi eriydi.</div>
    <div style={{position: 'absolute', left: 70, top: 380 - leave * 300, width: 840, opacity: Math.min(1, line * 2) * (1 - leave),
      transform: `translateY(${(1 - line) * 30}px)`, fontFamily: SANS, fontWeight: 800, fontSize: 60, lineHeight: 1.42, color: INK}}>
      Bunisi profilingizda<br />
      <span style={{background: ICE, padding: '0 14px', borderRadius: 14, border: `5px solid ${INK}`}}>3–30 kun</span> turadi
    </div>
  </>
);

const Offer: React.FC<{price: number; cta: number}> = ({price, cta}) => {
  const frame = useCurrentFrame();
  return (
    <>
      <div style={{position: 'absolute', left: 70, top: 1040, opacity: Math.min(1, price * 2),
        transform: `translateY(${(1 - price) * 50}px)`}}>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 52, color: INK, lineHeight: 1}}>Ijara · kuniga</div>
        <div style={{fontFamily: DISPLAY, fontSize: 176, lineHeight: 1.04, color: CREAM, whiteSpace: 'nowrap',
          WebkitTextStroke: `9px ${INK}`, paintOrder: 'stroke fill', textShadow: `10px 11px 0 ${INK}`}}>
          750 <span style={{color: ICE}}>so<Q />m</span></div>
      </div>
      {cta > 0 && (
        <div style={{position: 'absolute', left: 70, top: 1316, opacity: Math.min(1, cta * 2), transform: `translateY(${(1 - cta) * 40}px)`}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 18, padding: '12px 36px 12px 12px', borderRadius: 999,
            background: INK, boxShadow: `8px 10px 0 rgba(29,20,7,.35)`}}>
            <Img src={staticFile('logo.png')} style={{width: 82, height: 82, borderRadius: '50%', background: BRAND.ink}} />
            <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 48, color: CREAM}}>{BRAND.bot}</span>
          </div>
          <div style={{marginTop: 16, fontFamily: SANS, fontWeight: 800, fontSize: 54, color: INK,
            transform: `translateY(${-Math.abs(Math.sin(frame / 7)) * 8}px)`}}>↑ Havola profilda</div>
        </div>
      )}
    </>
  );
};

const Scene: React.FC<{data: GiftData; frame: number; still?: boolean}> = ({data, frame, still}) => {
  const {fps} = useVideoConfig();
  const s = (a: number, b: number, e = out3) => (still ? 0 : interpolate(frame, [a, b], [0, 1], {...clamp, easing: e}));
  const outA = s(A_OUT, A_OUT + 14, ease);
  const toB = s(A_OUT, A_OUT + 26, ease);
  const panelsIn = s(A_OUT + 6, A_OUT + 28);
  const toC = s(B_OUT, B_OUT + 24, ease);
  const melt = s(MELT[0], MELT[1], Easing.inOut(Easing.quad));
  const head = still ? 0 : popIn(frame, fps, B_HEAD);
  const line = still ? 0 : popIn(frame, fps, B_LINE);
  const leaveB = s(B_OUT, B_OUT + 12);
  const price = still ? 0 : popIn(frame, fps, C_PRICE);
  const cta = still ? 0 : popIn(frame, fps, C_CTA);

  // Gift path: centre of the poster -> right comparison panel -> top of the offer.
  const gx = interpolate(toC, [0, 1], [interpolate(toB, [0, 1], [430, 680]), 470]);
  const gy = interpolate(toC, [0, 1], [interpolate(toB, [0, 1], [1090, 1100]), 690]);
  const gs = interpolate(toC, [0, 1], [interpolate(toB, [0, 1], [1250, 740]), 900]);
  const discR = interpolate(toC, [0, 1], [interpolate(toB, [0, 1], [430, 0.001]), 310]);
  const discY = interpolate(toC, [0, 1], [1090, 680]);
  const discX = interpolate(toC, [0, 1], [440, 470]);
  return (
    <AbsoluteFill>
      <Background data={data} />
      {discR > 2 && <Disc x={discX} y={discY} r={discR} />}
      {toB > 0 && toC < 1 && <Panels enter={panelsIn} leave={leaveB} melt={melt} />}
      <Bar data={data} x={gx} y={gy} size={gs} at={still ? 0 : giftFrame(frame)} />
      {outA < 1 && <Opening out={outA} still={still} />}
      {!still && frame >= B_HEAD && frame < B_OUT + 14 && <Compare enter={head} line={line} leave={leaveB} />}
      {!still && frame >= C_PRICE && <Offer price={price} cta={cta} />}
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
      {BITES.map((at) => (
        <Sequence key={at} from={at}><Audio src={staticFile('audio/bite.wav')} volume={0.3} /></Sequence>
      ))}
      <Sequence from={REGROW}><Audio src={staticFile('audio/frost.wav')} volume={0.32} /></Sequence>
      {[A_OUT, B_OUT].map((at) => (
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
      <Freeze frame={0}>
        <Scene data={gifts[0]} frame={0} still />
      </Freeze>
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
