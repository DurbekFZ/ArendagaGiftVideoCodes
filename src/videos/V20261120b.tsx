// This package's exports map adds `.css` itself and ships no type declarations.
// @ts-ignore
import '@fontsource/anton/400';
import {Lottie} from '@remotion/lottie';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Freeze, Img, Sequence, cancelRender, continueRender, delayRender, interpolate,
  spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {BRAND, GiftData, W, clamp, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "1 YOKI 2?" — a vote between two ice creams. A bold sports-poster split screen: two blue fields meet on a
// slanted seam with a yellow "YOKI" badge, a huge numeral behind each gift. Frame one already names the product
// (Telegram NFT sovg‘a) and the price (kuniga 750 so‘m); each gift takes its first bite (its own animation) at 0.3
// and 0.75 s. Then each side takes the whole frame in turn: 1 — Shokoladli (Choco Almond), 2 — Uch sharli
// (Trio Scoop). Both come back side by side: "Izohda: 1 yoki 2", the price, 3–30 days, the bot and the link.
// Silent, calm pad.
const ID = 'V20261120b';
const ONE = 'icecream-62286'; // Choco Almond model 3%, Shamrock Green backdrop 1.5%, Cash symbol 0.7%; 750 so‘m a day
const TWO = 'icecream-192500'; // Trio Scoop model 3%, Dark Green backdrop 1.5%, Beanie symbol 0.5%; 750 so‘m a day
const HEAD = "'Anton', sans-serif";
const SANS = "'Manrope', sans-serif";

// Palette. Background family: blue (a light sky field and a deeper cornflower field), chosen because both gifts are
// warm (chocolate brown, strawberry pink, lemon) and read strongly against it. Accent: lemon yellow, taken from the
// gifts' stick and middle scoop. Neutrals: navy ink and white. No extra hue: the pink lives only in the gift.
const SKY = '#c4e2ff';
const SKY_DEEP = '#a9d2fb';
const CORN = '#6d98f7';
const CORN_DEEP = '#5a86ec';
const LEMON = '#ffd43b';
const INK = '#0e1a3d';
const WHITE = '#ffffff';

// Timeline (30 fps).
const S1 = 132; // 4.4 s: field 1 takes the frame
const S1_TEXT = 146;
const S2 = 252; // 8.4 s: field 2 sweeps over
const S2_TEXT = 266;
const FIN = 372; // 12.4 s: both side by side again
const FIN_HEAD = 384; // "Izohda: 1 yoki 2"
const FIN_PRICE = 414; // 13.8 s
const FIN_DAYS = 444; // 14.8 s
const FIN_CTA = 474; // 15.8 s
const FRAMES = 570; // 19.0 s
const MOVE = 22;

const useFonts = () => {
  const [handle] = useState(() => delayRender('anton'));
  useEffect(() => {
    document.fonts.load(`400 10px "Anton"`, '1 YOKI 2? SHOKOLADLI 750 so‘m')
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

const ease = Easing.bezier(0.65, 0, 0.25, 1);
const popIn = (frame: number, fps: number, at: number) =>
  spring({frame: frame - at, fps, config: {damping: 14, stiffness: 180, mass: 0.7}});

/** Which frame of each gift's own animation to show. One bite at the start, then the bitten pose is held; when the
 * gift takes the whole frame it plays its own spin and comes back whole, and stays whole. */
const poseOne = (f: number) => {
  if (f < S1) return Math.min(f + 7, 38);
  if (f < S1 + 20) return 112 + Math.round((f - S1) * 1.4);
  return 150;
};
const poseTwo = (f: number) => {
  if (f < S2) return Math.min(Math.max(0, f - 5), 36);
  if (f < S2 + 20) return 112 + Math.round((f - S2) * 1.4);
  return 150;
};

/** Gift placement for the four layouts: opening, spotlight 1, spotlight 2, finale. */
type Place = {x: number; y: number; s: number};
const LAYOUT: Record<'one' | 'two', Place[]> = {
  one: [{x: 285, y: 790, s: 820}, {x: 470, y: 960, s: 1320}, {x: -560, y: 960, s: 1320}, {x: 285, y: 690, s: 770}],
  two: [{x: 765, y: 790, s: 820}, {x: 1500, y: 820, s: 820}, {x: 470, y: 960, s: 1320}, {x: 745, y: 690, s: 770}],
};
/** Seam position (x where the slanted seam crosses y = 960) for the same four layouts. */
const SEAM = [540, 1400, -320, 520];

const progress = (frame: number) => {
  const p = (at: number) => interpolate(frame, [at, at + MOVE], [0, 1], {...clamp, easing: ease});
  return [p(S1), p(S2), p(FIN)];
};
const blend = <T extends number>(values: T[], [a, b, c]: number[]) => {
  let v = values[0] + (values[1] - values[0]) * a;
  v += (values[2] - values[1]) * b;
  v += (values[3] - values[2]) * c;
  return v;
};
const place = (who: 'one' | 'two', pr: number[]): Place => {
  const L = LAYOUT[who];
  return {x: blend(L.map((p) => p.x), pr), y: blend(L.map((p) => p.y), pr), s: blend(L.map((p) => p.s), pr)};
};

/** Halftone dots, fading toward the seam. */
const Dots: React.FC<{color: string; angle: number}> = ({color, angle}) => (
  <AbsoluteFill style={{backgroundImage: `radial-gradient(${color} 3.2px, transparent 3.6px)`, backgroundSize: '30px 30px',
    WebkitMaskImage: `linear-gradient(${angle}deg, rgba(0,0,0,.9) 0%, rgba(0,0,0,0) 55%)`}} />
);

/** The two fields, each with its own giant numeral behind its gift, split by a slanted seam. */
const Fields: React.FC<{seam: number; one: Place; two: Place}> = ({seam, one, two}) => {
  const frame = useCurrentFrame();
  const tilt = 150; // seam leans: further right at the top
  const top = seam + tilt;
  const bottom = seam - tilt;
  const left = `polygon(0 0, ${top}px 0, ${bottom}px 1920px, 0 1920px)`;
  const right = `polygon(${top}px 0, ${W}px 0, ${W}px 1920px, ${bottom}px 1920px)`;
  const numeral = (p: Place, n: string, color: string) => (
    <div style={{position: 'absolute', left: p.x - p.s, top: p.y - p.s * 0.78, width: p.s * 2, textAlign: 'center',
      fontFamily: HEAD, fontSize: p.s * 1.25, lineHeight: 1, color, transform: `rotate(-4deg)`}}>{n}</div>
  );
  const drift = Math.sin(frame / 40) * 12;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `linear-gradient(160deg, #d6ecff 0%, ${SKY} 45%, ${SKY_DEEP} 100%)`, clipPath: left}}>
        <Dots color={SKY_DEEP} angle={200} />
        <div style={{transform: `translateY(${drift}px)`}}>{numeral(one, '1', SKY_DEEP)}</div>
      </AbsoluteFill>
      <AbsoluteFill style={{background: `linear-gradient(160deg, #7ea5fa 0%, ${CORN} 50%, ${CORN_DEEP} 100%)`, clipPath: right}}>
        <Dots color={CORN_DEEP} angle={20} />
        <div style={{transform: `translateY(${-drift}px)`}}>{numeral(two, '2', CORN_DEEP)}</div>
      </AbsoluteFill>
      {/* the seam itself: a lemon band with a navy edge, only between the headline and the price so it never crosses text */}
      <svg width={W} height={1920} style={{position: 'absolute', left: 0, top: 0,
        WebkitMaskImage: 'linear-gradient(180deg, transparent 0px, transparent 500px, #000 560px, #000 1010px, transparent 1060px)'}}>
        <line x1={top} y1={0} x2={bottom} y2={1920} stroke={INK} strokeWidth={30} />
        <line x1={top} y1={0} x2={bottom} y2={1920} stroke={LEMON} strokeWidth={16} />
      </svg>
    </AbsoluteFill>
  );
};

/** One gift, its own animation held at a chosen frame. x, y = box centre. */
const Cone: React.FC<{data: GiftData; p: Place; at: number; phase: number}> = ({data, p, at, phase}) => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 16 + phase) * 9;
  return (
    <div style={{position: 'absolute', left: p.x - p.s / 2, top: p.y - p.s / 2 + bob, width: p.s, height: p.s,
      filter: 'drop-shadow(0 28px 34px rgba(14,26,61,.32))'}}>
      <Freeze frame={at}>
        <Lottie animationData={data.gift} style={{width: p.s, height: p.s}} />
      </Freeze>
    </div>
  );
};

const Badge: React.FC<{x: number; y: number; r: number; children: React.ReactNode; rotate?: number; scale?: number}> =
  ({x, y, r, children, rotate = -8, scale = 1}) => (
    <div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', background: LEMON,
      border: `8px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      transform: `rotate(${rotate}deg) scale(${scale})`, boxShadow: '0 14px 30px rgba(14,26,61,.25)'}}>
      {children}
    </div>
  );

const Kicker: React.FC<{text: string}> = ({text}) => (
  <div style={{display: 'inline-block', background: INK, color: WHITE, fontFamily: SANS, fontWeight: 800, fontSize: 38,
    letterSpacing: 3, padding: '10px 26px 12px', borderRadius: 12}}>{text}</div>
);

/** Price: "kuniga" over a big "750 so‘m" on a lemon tag. */
const Price: React.FC<{size: number; label: string}> = ({size, label}) => (
  <div>
    <div style={{fontFamily: SANS, fontWeight: 800, fontSize: size * 0.34, color: INK, lineHeight: 1.1}}>{label}</div>
    <div style={{display: 'inline-block', marginTop: 8, background: LEMON, border: `7px solid ${INK}`, borderRadius: 22,
      padding: `${size * 0.02}px ${size * 0.16}px ${size * 0.06}px`, transform: 'rotate(-2deg)', boxShadow: `10px 12px 0 ${INK}`}}>
      <span style={{fontFamily: HEAD, fontSize: size, lineHeight: 1.05, color: INK, whiteSpace: 'nowrap', letterSpacing: 1}}>
        750 SO‘M</span>
    </div>
  </div>
);

/** Opening text: kicker, the question, the price; all on screen from frame one. */
const Opening: React.FC<{out: number}> = ({out}) => {
  const frame = useCurrentFrame();
  const wobble = Math.sin(frame / 9) * 4;
  return (
    <AbsoluteFill style={{opacity: 1 - out}}>
      <div style={{position: 'absolute', left: 70, top: 232 - out * 200}}><Kicker text="TELEGRAM NFT SOVG‘A · IJARA" /></div>
      <div style={{position: 'absolute', left: 64, top: 300 - out * 200, fontFamily: HEAD, fontSize: 196, lineHeight: 1.05,
        color: INK, whiteSpace: 'nowrap', letterSpacing: 2}}>
        1 <span style={{color: WHITE, WebkitTextStroke: `10px ${INK}`, paintOrder: 'stroke fill'}}>YOKI</span> 2?
      </div>
      <Badge x={540} y={1150} r={76} rotate={-10 + wobble} scale={1 - out}>
        <span style={{fontFamily: HEAD, fontSize: 58, color: INK, lineHeight: 1}}>YOKI</span>
      </Badge>
      <div style={{position: 'absolute', left: 70, top: 1250 + out * 300}}><Price size={124} label="har biri · kuniga" /></div>
    </AbsoluteFill>
  );
};

/** Spotlight text: number badge, flavour in Uzbek, model name and number. */
const Spot: React.FC<{n: string; title: string; sub: string; enter: number; leave: number}> = ({n, title, sub, enter, leave}) => (
  <AbsoluteFill style={{opacity: Math.min(1, enter * 2) * (1 - leave)}}>
    <div style={{position: 'absolute', left: 70, top: 236 + (1 - enter) * 50 - leave * 120, display: 'flex', alignItems: 'center', gap: 26}}>
      <div style={{width: 128, height: 128, borderRadius: '50%', background: LEMON, border: `8px solid ${INK}`, display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontFamily: HEAD, fontSize: 86, color: INK, lineHeight: 1,
        transform: `scale(${0.6 + 0.4 * enter}) rotate(-8deg)`}}>{n}</div>
      <div style={{fontFamily: HEAD, fontSize: 150, lineHeight: 1.05, color: INK, whiteSpace: 'nowrap', letterSpacing: 1}}>{title}</div>
    </div>
    <div style={{position: 'absolute', left: 74, top: 432 + (1 - enter) * 40 - leave * 120}}><Kicker text={sub} /></div>
  </AbsoluteFill>
);

const Finale: React.FC<{head: number; price: number; days: number; cta: number}> = ({head, price, days, cta}) => {
  const frame = useCurrentFrame();
  const rise = (v: number, d = 40) => ({opacity: Math.min(1, v * 2), transform: `translateY(${(1 - v) * d}px)`});
  return (
    <>
      <div style={{position: 'absolute', left: 70, top: 236, ...rise(head)}}>
        <div style={{fontFamily: HEAD, fontSize: 128, lineHeight: 1.05, color: INK, whiteSpace: 'nowrap', letterSpacing: 1}}>
          IZOHDA: <span style={{background: LEMON, padding: '0 18px', borderRadius: 18, border: `7px solid ${INK}`}}>1 YOKI 2</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 70, top: 994, ...rise(price, 60)}}><Price size={118} label="har biri · kuniga" /></div>
      <div style={{position: 'absolute', left: 70, top: 1226, ...rise(days), fontFamily: SANS, fontWeight: 800, fontSize: 52,
        color: INK, whiteSpace: 'nowrap'}}>
        <span style={{background: WHITE, padding: '2px 16px', borderRadius: 12, border: `5px solid ${INK}`}}>3–30 kun</span> profilingizda
      </div>
      {cta > 0 && (
        <div style={{position: 'absolute', left: 70, top: 1318, ...rise(cta)}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 18, padding: '10px 34px 10px 10px', borderRadius: 999,
            background: INK}}>
            <Img src={staticFile('logo.png')} style={{width: 76, height: 76, borderRadius: '50%', background: BRAND.ink}} />
            <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 46, color: WHITE}}>{BRAND.bot}</span>
          </div>
          <div style={{marginTop: 14, fontFamily: SANS, fontWeight: 800, fontSize: 52, color: INK,
            transform: `translateY(${-Math.abs(Math.sin(frame / 7)) * 8}px)`}}>↑ Havola profilda</div>
        </div>
      )}
    </>
  );
};

const Scene: React.FC<{one: GiftData; two: GiftData; frame: number; still?: boolean}> = ({one, two, frame, still}) => {
  const {fps} = useVideoConfig();
  const pr = still ? [0, 0, 0] : progress(frame);
  const p1 = place('one', pr);
  const p2 = place('two', pr);
  const seam = blend(SEAM, pr);
  const s = (a: number, b: number) => (still ? 0 : interpolate(frame, [a, b], [0, 1], clamp));
  const outOpen = s(S1, S1 + 12);
  const t1 = still ? 0 : popIn(frame, fps, S1_TEXT);
  const l1 = s(S2, S2 + 10);
  const t2 = still ? 0 : popIn(frame, fps, S2_TEXT);
  const l2 = s(FIN, FIN + 10);
  const pop = (at: number) => (still ? 0 : popIn(frame, fps, at));
  return (
    <AbsoluteFill style={{background: SKY}}>
      <Fields seam={seam} one={p1} two={p2} />
      <Cone data={two} p={p2} at={still ? 0 : poseTwo(frame)} phase={2} />
      <Cone data={one} p={p1} at={still ? 0 : poseOne(frame)} phase={0} />
      {outOpen < 1 && <Opening out={outOpen} />}
      {!still && frame >= S1_TEXT && frame < S2 + 10 && (
        <Spot n="1" title="SHOKOLADLI" sub="CHOCO ALMOND · #62286" enter={t1} leave={l1} />)}
      {!still && frame >= S2_TEXT && frame < FIN + 10 && (
        <Spot n="2" title="UCH SHARLI" sub="TRIO SCOOP · #192500" enter={t2} leave={l2} />)}
      {!still && frame >= FIN_HEAD && (
        <Finale head={pop(FIN_HEAD)} price={pop(FIN_PRICE)} days={pop(FIN_DAYS)} cta={frame >= FIN_CTA ? pop(FIN_CTA) : 0} />)}
    </AbsoluteFill>
  );
};

const Video: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const gifts = useGifts([ONE, TWO]);
  if (!gifts) return null;
  return (
    <AbsoluteFill>
      <Scene one={gifts[0]} two={gifts[1]} frame={frame} />
      <Audio src={staticFile(`audio/bed_${ID}.wav`)} volume={(f) => interpolate(f, [0, 6, FRAMES - 30, FRAMES - 1], [0, 0.28, 0.28, 0], clamp)} />
      <Sequence from={9}><Audio src={staticFile('audio/bite.wav')} volume={0.26} /></Sequence>
      <Sequence from={22}><Audio src={staticFile('audio/bite.wav')} volume={0.2} /></Sequence>
      {[S1, S2, FIN].map((at) => (
        <Sequence key={at} from={at}><Audio src={staticFile('audio/swipe.wav')} volume={0.16} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};

const Cover: React.FC = () => {
  useFonts();
  const gifts = useGifts([ONE, TWO]);
  if (!gifts) return null;
  return (
    <AbsoluteFill>
      <Freeze frame={0}>
        <Scene one={gifts[0]} two={gifts[1]} frame={0} still />
      </Freeze>
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
