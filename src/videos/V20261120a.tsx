// This package's exports map adds `.css` itself and ships no type declarations.
// @ts-ignore
import '@fontsource/paytone-one/400';
import {Lottie} from '@remotion/lottie';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Freeze, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random,
  spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {BRAND, GiftData, H, W, clamp, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "SINMAYDIGAN KONFET" — the candy cane that does not break. A paper-cut winter scene in the gift's own greens.
// Frame one: "Telegram sovg‘a · ijara", the headline, "kuniga 750 so‘m" and the Candy Cane already falling into
// the snow. It lands at 0.3 s and bounces, turning in its own animation: "Sinmadi!". It is dropped once more
// ("Yana bir bor?") and lands whole again ("Hamon butun!"). Then an ordinary drawn candy cane falls onto a snowy
// ledge above it and snaps in three ("Oddiysi sinadi."), while the gift stands below: it stays on your profile
// for 3–30 days. Ends on the price, the bot and the link. Silent, calm pad.
const ID = 'V20261120a';
const GIFT = 'candycane-194062'; // Amber Glitter model 2.6%, Gunship Green backdrop 1.5%, Candle symbol 1.6%; 750 so‘m a day
const DISPLAY = "'Paytone One', sans-serif";
const SANS = "'Manrope', sans-serif";

// Palette. Background family: the gift's Gunship Green backdrop (#558a65 / #3d6657) lifted to pale frosted mint
// paper; accent: the cane's own red (complementary to the green); neutrals: snow white and a deep pine ink taken
// from the gift's pattern colour (#07261d). Amber (the "Amber Glitter" model) only for a few tiny glints.
const MINT_TOP = '#eef6ec';
const MINT = '#d6e9d7';
const MINT_DEEP = '#a8ccb2';
const FIR = '#2f6a4f';
const FIR_DEEP = '#1f5440';
const PINE = '#0f3326';
const SNOW = '#ffffff';
const RED = '#e0303a';
const RED_DEEP = '#a3141f';
const AMBER = '#f2b54a';
const PAPER_SHADOW = 'rgba(15,51,38,.22)';

// Timeline (30 fps).
const LAND1 = 8; // 0.27 s: first landing
const LAND1B = 36; // small second bounce
const ASK1 = 30; // "Sinmadi!"
const ASK1_OUT = 104;
const ASK2 = 110; // "Yana bir bor?"
const ASK2_OUT = 190;
const LIFT = [138, 176] as const; // lifted for the second drop
const LAND2 = 186; // 6.2 s
const ASK3 = 196; // "Hamon butun!"
const A_OUT = 262; // 8.7 s
const DROP = [282, 294] as const; // the ordinary cane falls and snaps at 294
const B_HEAD = 300; // "Oddiysi sinadi."
const B_LINE = 324; // "Bunisi profilingizda 3–30 kun turadi"
const B_OUT = 424; // 14.1 s
const C_PRICE = 432;
const C_CTA = 462; // 15.4 s
const FRAMES = 570; // 19.0 s
const FLOOR = 1392; // snow surface under the gift
const GX = 470; // lower-half content is centred on x = 470 (clear of the like/comment column)

const useFonts = () => {
  const [handle] = useState(() => delayRender('paytone'));
  useEffect(() => {
    document.fonts.load(`400 10px "Paytone One"`, 'SINMAYDIGAN KONFET 750 so‘m Hamon butun!')
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

const ease = Easing.bezier(0.6, 0.02, 0.25, 1);
const out3 = Easing.out(Easing.cubic);
const popIn = (frame: number, fps: number, at: number) =>
  spring({frame: frame - at, fps, config: {damping: 13, stiffness: 180, mass: 0.7}});

/** Which frame of the gift's own 180-frame animation to show. Its turn (84–150) plays during each bounce;
 * otherwise it stays in the full, front-facing poses where only the bow flutters. */
const giftFrame = (f: number) => {
  if (f < 100) return 80 + f; // turn during the first bounce, then full
  if (f < 184) return f - 100; // flutter (0–83)
  if (f < 250) return 84 + (f - 184); // turn during the second bounce
  return (150 + ((f - 250) % 110)) % 180; // full poses only
};

/** Paper snowflake: six cut arms. */
const Flake: React.FC<{size: number; color?: string}> = ({size, color = SNOW}) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100">
    {[0, 60, 120].map((a) => (
      <g key={a} transform={`rotate(${a})`} stroke={color} strokeWidth={9} strokeLinecap="round">
        <line x1={0} y1={-44} x2={0} y2={44} />
        <line x1={0} y1={-26} x2={-13} y2={-38} /><line x1={0} y1={-26} x2={13} y2={-38} />
        <line x1={0} y1={26} x2={-13} y2={38} /><line x1={0} y1={26} x2={13} y2={38} />
      </g>
    ))}
  </svg>
);

/** A row of paper-cut fir trees. */
const Firs: React.FC<{y: number; color: string; seed: string; scale: number; drift: number; opacity: number}> =
  ({y, color, seed, scale, drift, opacity}) => (
  <div style={{position: 'absolute', left: -120 + drift, top: y, opacity, width: W + 240, height: 400,
    filter: `drop-shadow(0 8px 10px ${PAPER_SHADOW})`}}>
    {Array.from({length: 9}, (_, i) => {
      const r = (k: string) => random(`${seed}-${i}-${k}`);
      const h = (170 + r('h') * 140) * scale;
      const w = h * 0.62;
      const x = i * 160 + r('x') * 70;
      return (
        <svg key={i} width={w} height={h} viewBox="0 0 62 100" preserveAspectRatio="none"
          style={{position: 'absolute', left: x, top: 400 - h}}>
          <path d="M31 0 L46 26 L39 26 L54 52 L45 52 L62 82 L35 82 L35 100 L27 100 L27 82 L0 82 L17 52 L8 52 L23 26 L16 26 Z" fill={color} />
        </svg>
      );
    })}
  </div>
);

/** Paper-cut winter: mint sky, a pale winter sun, two rows of firs, layered snow hills, falling paper flakes. */
const Background: React.FC<{offer: number}> = ({offer}) => {
  const frame = useCurrentFrame();
  const sink = offer * 140;
  const trees = 1 - offer;
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${MINT_TOP} 0%, ${MINT} 58%, ${MINT_DEEP} 100%)`}}>
      <div style={{position: 'absolute', left: GX - 430, top: 700, width: 860, height: 860, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(255,255,255,.9) 0%, rgba(255,255,255,.55) 45%, rgba(255,255,255,0) 70%)`}} />
      {trees > 0 && <Firs y={940 + sink} color={MINT_DEEP} seed="far" scale={0.8} drift={-frame * 0.12} opacity={trees} />}
      {trees > 0 && <Firs y={1010 + sink} color={FIR} seed="near" scale={1} drift={-60 + frame * 0.18} opacity={trees} />}
      <svg width={W} height={700} viewBox={`0 0 ${W} 700`} style={{position: 'absolute', left: 0, top: FLOOR - 70 + sink,
        filter: `drop-shadow(0 -6px 12px ${PAPER_SHADOW})`}}>
        <path d={`M0 90 C 200 30, 380 70, 560 50 S 900 10, ${W} 60 L ${W} 700 L 0 700 Z`} fill="#e9f3ea" />
      </svg>
      <svg width={W} height={600} viewBox={`0 0 ${W} 600`} style={{position: 'absolute', left: 0, top: FLOOR + 10 + sink,
        filter: `drop-shadow(0 -8px 14px ${PAPER_SHADOW})`}}>
        <path d={`M0 40 C 260 0, 520 30, 760 14 S 1000 20, ${W} 0 L ${W} 600 L 0 600 Z`} fill={SNOW} />
      </svg>
      {Array.from({length: 24}, (_, i) => {
        const r = (k: string) => random(`flake-${i}-${k}`);
        const s = 18 + r('s') * 34;
        const y = ((r('y') * H + frame * (0.7 + r('v') * 1.3)) % (H + 80)) - 40;
        const x = r('x') * W + Math.sin(frame / (30 + r('w') * 30) + i) * 34;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, opacity: 0.55 + r('o') * 0.4,
            transform: `rotate(${frame * (r('r') - 0.5) * 1.6}deg)`, filter: `drop-shadow(0 3px 3px ${PAPER_SHADOW})`}}>
            <Flake size={s} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** The gift with its own animation driven to a chosen frame. x, y = box centre. */
const Cane: React.FC<{data: GiftData; x: number; y: number; size: number; at: number; rotate: number}> =
  ({data, x, y, size, at, rotate}) => (
    <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size,
      transform: `rotate(${rotate}deg)`, filter: 'drop-shadow(0 26px 30px rgba(15,51,38,.30))'}}>
      <Freeze frame={at}>
        <Lottie animationData={data.gift} style={{width: size, height: size}} />
      </Freeze>
    </div>
  );

/** Snow kicked up where something lands. */
const Puff: React.FC<{at: number; x: number; y: number; strength?: number}> = ({at, x, y, strength = 1}) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > 30) return null;
  return (
    <>
      {Array.from({length: 16}, (_, i) => {
        const r = (k: string) => random(`puff-${at}-${i}-${k}`);
        const dir = (r('d') - 0.5) * 2;
        const vx = dir * (6 + r('v') * 10) * strength;
        const vy = -(5 + r('u') * 9) * strength;
        const px = x + dir * 160 + vx * t;
        const py = y + vy * t + 0.45 * t * t;
        const s = 14 + r('s') * 26;
        return <div key={i} style={{position: 'absolute', left: px - s / 2, top: py - s / 2, width: s, height: s,
          borderRadius: '50%', background: SNOW, opacity: 1 - t / 30, boxShadow: `0 4px 6px ${PAPER_SHADOW}`}} />;
      })}
    </>
  );
};

/** Paper label with a candy-stripe edge (reaction lines and the price strip). */
const Label: React.FC<{children: React.ReactNode; left: number; top: number; enter: number; leave?: number; rotate?: number;
  bg?: string}> = ({children, left, top, enter, leave = 0, rotate = -2, bg = SNOW}) => (
  <div style={{position: 'absolute', left, top, opacity: Math.min(1, enter * 2) * (1 - leave),
    transform: `translateY(${(1 - enter) * 40 + leave * 30}px) rotate(${rotate * enter}deg) scale(${0.85 + 0.15 * enter})`,
    transformOrigin: 'left center'}}>
    <div style={{display: 'flex', alignItems: 'stretch', background: bg, borderRadius: 22, overflow: 'hidden',
      boxShadow: `0 14px 26px ${PAPER_SHADOW}, 0 2px 0 rgba(15,51,38,.08)`}}>
      <div style={{width: 26, background: `repeating-linear-gradient(135deg, ${RED} 0 14px, ${SNOW} 14px 26px)`}} />
      <div style={{padding: '12px 32px 16px 26px'}}>{children}</div>
    </div>
  </div>
);

const Opening: React.FC<{out: number; still?: boolean}> = ({out, still}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s1 = still ? 0 : popIn(frame, fps, ASK1);
  const s1o = still ? 1 : interpolate(frame, [ASK1_OUT, ASK1_OUT + 6], [0, 1], clamp);
  const s2 = still ? 0 : popIn(frame, fps, ASK2);
  const s2o = still ? 1 : interpolate(frame, [ASK2_OUT, ASK2_OUT + 6], [0, 1], clamp);
  const s3 = still ? 0 : popIn(frame, fps, ASK3);
  const lift = -out * 280;
  const big = {fontFamily: DISPLAY, fontSize: 84, lineHeight: 1.05, color: PINE, whiteSpace: 'nowrap'} as const;
  return (
    <>
      <div style={{position: 'absolute', left: 70, top: 234 + lift, opacity: 1 - out, display: 'flex', gap: 14}}>
        <div style={{background: PINE, color: SNOW, fontFamily: SANS, fontWeight: 800, fontSize: 36, letterSpacing: 3,
          padding: '10px 26px 12px', borderRadius: 999}}>TELEGRAM SOVG‘A</div>
        <div style={{background: RED, color: SNOW, fontFamily: SANS, fontWeight: 800, fontSize: 36, letterSpacing: 3,
          padding: '10px 26px 12px', borderRadius: 999}}>IJARA</div>
      </div>
      <div style={{position: 'absolute', left: 64, top: 312 + lift, opacity: 1 - out, fontFamily: DISPLAY, fontSize: 124,
        lineHeight: 1.02, color: PINE, whiteSpace: 'nowrap', textShadow: `0 6px 0 rgba(255,255,255,.7)`}}>
        <div>SINMAYDIGAN</div>
        <div style={{color: RED, textShadow: `0 7px 0 ${RED_DEEP}33, 0 6px 0 rgba(255,255,255,.7)`}}>KONFET</div>
      </div>
      <Label left={70} top={598 + lift} enter={1} leave={out} rotate={-2}>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 50, color: PINE, whiteSpace: 'nowrap'}}>
          kuniga <span style={{fontFamily: DISPLAY, fontWeight: 400, fontSize: 58, color: RED}}>750 so‘m</span></div>
      </Label>
      {!still && frame >= ASK1 && frame < ASK1_OUT + 6 && (
        <Label left={70} top={1418} enter={s1} leave={s1o} rotate={-3}><div style={big}>Sinmadi!</div></Label>
      )}
      {!still && frame >= ASK2 && frame < ASK2_OUT + 6 && (
        <Label left={70} top={1418} enter={s2} leave={s2o} rotate={2}><div style={big}>Yana bir bor?</div></Label>
      )}
      {!still && frame >= ASK3 && (
        <Label left={70} top={1418} enter={s3} leave={out} rotate={-2}>
          <div style={big}>Hamon <span style={{color: RED}}>butun!</span></div></Label>
      )}
    </>
  );
};

/** An ordinary candy cane drawn flat: white with red bands. Three pieces so it can snap. Local origin = stem bottom. */
const PIECES = [
  {d: 'M0 0 L0 -110', cx: 0, cy: -55},
  {d: 'M0 -110 L0 -230', cx: 0, cy: -170},
  {d: 'M0 -230 L0 -300 C0 -380 110 -380 110 -300 L110 -276', cx: 50, cy: -320},
];
const CaneDrawn: React.FC<{snap: number; still: boolean}> = ({snap}) => (
  <svg width={600} height={700} viewBox="-300 -500 600 700" style={{position: 'absolute', left: -300, top: -500, overflow: 'visible'}}>
    {PIECES.map((p, i) => {
      const r = (k: string) => random(`piece-${i}-${k}`);
      const fly = Math.sin(Math.min(1, snap) * Math.PI);
      const dx = [-230, -10, 190][i] * snap;
      const dy = -fly * (80 + r('y') * 60) + snap * [30, 150, 290][i];
      const rot = [-90, 85, 25][i] * snap;
      return (
        <g key={i} transform={`translate(${dx} ${dy}) rotate(${rot} ${p.cx} ${p.cy})`}>
          <path d={p.d} stroke={PINE} strokeWidth={60} strokeLinecap="round" fill="none" />
          <path d={p.d} stroke={SNOW} strokeWidth={46} strokeLinecap="round" fill="none" />
          <path d={p.d} stroke={RED} strokeWidth={46} strokeDasharray="18 22" fill="none" />
          <path d={p.d} stroke="rgba(255,255,255,.55)" strokeWidth={10} strokeLinecap="round" fill="none"
            transform="translate(-10 0)" />
        </g>
      );
    })}
  </svg>
);

/** Comparison: a snowy paper ledge high up; the ordinary cane falls onto it and snaps. */
const Compare: React.FC<{enter: number; leave: number; still?: boolean}> = ({enter, leave, still = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const fall = interpolate(frame, [DROP[0], DROP[1]], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
  const snap = interpolate(frame, [DROP[1], DROP[1] + 22], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});
  const head = popIn(frame, fps, B_HEAD);
  const line = popIn(frame, fps, B_LINE);
  const ledgeY = 610;
  const cy = interpolate(fall, [0, 1], [330, ledgeY - 18]);
  const shift = (1 - enter) * -900 - leave * 900;
  return (
    <>
      <div style={{position: 'absolute', left: 0, top: shift, width: W, height: 900}}>
        <svg width={760} height={120} viewBox="0 0 760 120" style={{position: 'absolute', left: 200, top: ledgeY - 30,
          filter: `drop-shadow(0 12px 14px ${PAPER_SHADOW})`}}>
          <path d="M0 40 C 120 0, 260 20, 380 10 S 640 0, 760 36 L 740 120 L 20 120 Z" fill={SNOW} />
          <path d="M20 120 L 740 120 L 760 36 C 700 70, 600 60, 520 74 S 200 80, 0 40 Z" fill="#e5f0e6" />
        </svg>
        <div style={{position: 'absolute', left: 600, top: cy, transform: `rotate(${interpolate(fall, [0, 1], [-14, 0])}deg)`}}>
          <div style={{transform: 'scale(1.25)', transformOrigin: '0 0'}}><CaneDrawn snap={snap} still={still} /></div>
        </div>
        <Puff at={DROP[1]} x={600} y={ledgeY - 20} strength={0.6} />
      </div>
      <div style={{position: 'absolute', left: 66, top: 236 - leave * 300, opacity: Math.min(1, head * 2) * (1 - leave),
        transform: `translateY(${(1 - head) * 40}px)`, fontFamily: DISPLAY, fontSize: 108, lineHeight: 1, color: PINE,
        whiteSpace: 'nowrap', display: frame >= B_HEAD ? 'block' : 'none'}}>
        Oddiysi <span style={{color: RED}}>sinadi.</span></div>
      {frame >= B_LINE && (
        <Label left={70} top={1404} enter={line} leave={leave} rotate={-1.5}>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 52, lineHeight: 1.22, color: PINE, whiteSpace: 'nowrap'}}>
            Bunisi profilingizda<br /><span style={{color: RED}}>3–30 kun</span> turadi</div>
        </Label>
      )}
    </>
  );
};

const Offer: React.FC<{price: number; cta: number}> = ({price, cta}) => {
  const frame = useCurrentFrame();
  return (
    <>
      <div style={{position: 'absolute', left: 70, top: 236, opacity: Math.min(1, price * 2), display: 'flex', gap: 14,
        transform: `translateY(${(1 - price) * -30}px)`}}>
        <div style={{background: PINE, color: SNOW, fontFamily: SANS, fontWeight: 800, fontSize: 36, letterSpacing: 3,
          padding: '10px 26px 12px', borderRadius: 999}}>CANDY CANE</div>
      </div>
      <div style={{position: 'absolute', left: 70, top: 1010, opacity: Math.min(1, price * 2),
        transform: `translateY(${(1 - price) * 50}px)`}}>
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 52, color: PINE, lineHeight: 1}}>Ijara · kuniga</div>
        <div style={{fontFamily: DISPLAY, fontSize: 170, lineHeight: 1.08, color: RED, whiteSpace: 'nowrap',
          textShadow: `0 8px 0 ${RED_DEEP}40`}}>
          750 <span style={{color: PINE}}>so‘m</span></div>
      </div>
      {cta > 0 && (
        <div style={{position: 'absolute', left: 70, top: 1270, opacity: Math.min(1, cta * 2), transform: `translateY(${(1 - cta) * 40}px)`}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 18, padding: '12px 36px 12px 12px', borderRadius: 999,
            background: PINE, boxShadow: `0 14px 26px ${PAPER_SHADOW}`}}>
            <Img src={staticFile('logo.png')} style={{width: 82, height: 82, borderRadius: '50%', background: BRAND.ink}} />
            <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 48, color: SNOW}}>{BRAND.bot}</span>
          </div>
          <div style={{marginTop: 18, fontFamily: SANS, fontWeight: 800, fontSize: 54, color: PINE,
            transform: `translateY(${-Math.abs(Math.sin(frame / 7)) * 8}px)`}}>↑ Havola profilda</div>
        </div>
      )}
    </>
  );
};

/** A few amber glints around the gift (its "Amber Glitter" model). */
const Glints: React.FC<{x: number; y: number}> = ({x, y}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({length: 7}, (_, i) => {
        const r = (k: string) => random(`glint-${i}-${k}`);
        const a = r('a') * Math.PI * 2;
        const d = 250 + r('d') * 120;
        const tw = Math.max(0, Math.sin(frame / (8 + r('t') * 8) + i * 2));
        const s = 20 + r('s') * 22;
        return (
          <svg key={i} width={s} height={s} viewBox="0 0 20 20" style={{position: 'absolute', left: x + Math.cos(a) * d - s / 2,
            top: y + Math.sin(a) * d * 0.8 - s / 2, opacity: tw}}>
            <path d="M10 0 Q11 9 20 10 Q11 11 10 20 Q9 11 0 10 Q9 9 10 0Z" fill={AMBER} />
          </svg>
        );
      })}
    </>
  );
};

const Scene: React.FC<{data: GiftData; frame: number; still?: boolean}> = ({data, frame, still}) => {
  const s = (a: number, b: number, e = out3) => (still ? 0 : interpolate(frame, [a, b], [0, 1], {...clamp, easing: e}));
  const outA = s(A_OUT, A_OUT + 14, ease);
  const toB = s(A_OUT + 4, A_OUT + 26, ease);
  const leaveB = s(B_OUT, B_OUT + 14, ease);
  const toC = s(B_OUT, B_OUT + 26, ease);
  const {fps} = useVideoConfig();
  const price = still ? 0 : popIn(frame, fps, C_PRICE);
  const cta = still ? 0 : popIn(frame, fps, C_CTA);

  // Act A: falling and bouncing. y is the box centre; the visible cane's foot sits about 0.24 * size below it.
  const size = interpolate(toC, [0, 1], [1120, 860]);
  const rest = FLOOR - 0.3 * 1120;
  let y = rest;
  let rot = 0;
  if (!still) {
    if (frame < LAND1) {
      const k = Easing.in(Easing.quad)(frame / LAND1);
      y = interpolate(k, [0, 1], [rest - 60, rest]);
      rot = interpolate(k, [0, 1], [-10, 0]);
    } else if (frame < LAND1B) {
      const k = (frame - LAND1) / (LAND1B - LAND1);
      y = rest - Math.sin(k * Math.PI) * 60;
      rot = Math.sin(k * Math.PI) * 4;
    } else if (frame < LIFT[0]) {
      y = rest;
    } else if (frame < LAND2) {
      const up = interpolate(frame, [LIFT[0], LIFT[1]], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
      const down = interpolate(frame, [LIFT[1], LAND2], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
      y = rest - 60 * up + 60 * down;
      rot = -8 * up + 8 * down;
    } else if (frame < LAND2 + 26) {
      const k = (frame - LAND2) / 26;
      y = rest - Math.sin(k * Math.PI) * 55;
      rot = -Math.sin(k * Math.PI) * 3;
    }
    y += Math.sin(Math.max(0, frame - 240) / 16) * (frame > 240 ? 6 : 0);
  }
  const gy = interpolate(toC, [0, 1], [y, 700]);
  const shadowW = 300 * (1 - (rest - y) / 400);
  const at = still ? 0 : giftFrame(frame);
  return (
    <AbsoluteFill>
      <Background offer={toC} />
      {toC < 1 && <div style={{position: 'absolute', left: GX - shadowW / 2, top: FLOOR - 20, width: shadowW, height: 44,
        borderRadius: '50%', background: 'rgba(15,51,38,.18)', filter: 'blur(8px)', opacity: 1 - toC}} />}
      {toB > 0 && toC < 1 && <Compare enter={toB} leave={leaveB} />}
      {frame > 240 && <Glints x={GX} y={gy} />}
      <Cane data={data} x={GX} y={gy} size={size} at={at} rotate={rot} />
      {!still && <Puff at={LAND1} x={GX} y={FLOOR - 10} />}
      {!still && <Puff at={LAND2} x={GX} y={FLOOR - 10} strength={0.8} />}
      {outA < 1 && <Opening out={outA} still={still} />}
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
      <Audio src={staticFile(`audio/bed_${ID}.wav`)} volume={(f) => interpolate(f, [0, 6, FRAMES - 30, FRAMES - 1], [0, 0.28, 0.28, 0], clamp)} />
      <Sequence from={LAND1 - 1}><Audio src={staticFile('audio/snowthud.wav')} volume={0.34} /></Sequence>
      <Sequence from={LAND2 - 1}><Audio src={staticFile('audio/snowthud.wav')} volume={0.3} /></Sequence>
      <Sequence from={DROP[1] - 1}><Audio src={staticFile('audio/snap.wav')} volume={0.24} /></Sequence>
      {[LIFT[0], A_OUT, B_OUT].map((at) => (
        <Sequence key={at} from={at}><Audio src={staticFile('audio/whoosh.wav')} volume={0.08} /></Sequence>
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
