import '@fontsource/anton/400.css';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {BODY, BRAND, Gift, GiftData, H, W, clamp, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "Mif yoki fakt": three common beliefs about Telegram gifts get stamped MIF on a printed poster,
// each answered by a fact card. Silent, fast, flat paper-and-ink look.
const ID = 'V20261116c';
const GIFT = 'jackinthebox-71197';
const POSTER = "'Anton', sans-serif";
// Palette from the gift's artwork: magenta lid (accent), slate speaker box (secondary), on warm paper with ink.
const PAPER = '#f1e7d6';
const PAPER_DEEP = '#e5d6bd';
const INK = '#1d1a24';
const MAGENTA = '#d9367f';
const SLATE = '#5f6f86';
const LEFT = 70;
const WIDTH = 800; // lower-half content stays between x = 70 and x = 870
const ROUND = 120;
const CTA = ROUND * 3;
const FRAMES = CTA + 112;

const useAnton = () => {
  const [handle] = useState(() => delayRender('anton'));
  useEffect(() => {
    document.fonts.load('400 10px Anton', 'MIF Oʻg‘ 1,5%').then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

/** Warm paper with fibre grain and a slate halftone corner. */
const Paper: React.FC<{tone?: string}> = ({tone = PAPER}) => {
  const frame = useCurrentFrame();
  const grain = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' seed='${Math.floor(frame / 3) % 4}'/><feColorMatrix values='0 0 0 0 .3  0 0 0 0 .25  0 0 0 0 .2  0 0 0 .22 0'/></filter><rect width='400' height='400' filter='url(%23n)'/></svg>")`;
  return (
    <AbsoluteFill style={{background: tone}}>
      <AbsoluteFill style={{backgroundImage: `radial-gradient(${SLATE} 2.6px, transparent 3px)`, backgroundSize: '22px 22px',
        opacity: 0.16, WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 100% 100%, #000 0%, transparent 70%)'}} />
      <AbsoluteFill style={{backgroundImage: `radial-gradient(${SLATE} 2.6px, transparent 3px)`, backgroundSize: '22px 22px',
        opacity: 0.12, WebkitMaskImage: 'radial-gradient(ellipse 60% 40% at 0% 0%, #000 0%, transparent 70%)'}} />
      <AbsoluteFill style={{backgroundImage: grain, opacity: 0.7}} />
    </AbsoluteFill>
  );
};

const Header: React.FC<{text: string; color?: string}> = ({text, color = INK}) => (
  <div style={{position: 'absolute', left: LEFT, top: 236, fontFamily: BODY, fontWeight: 800, fontSize: 32, letterSpacing: 8,
    textTransform: 'uppercase', color, display: 'flex', alignItems: 'center', gap: 18}}>
    <span style={{width: 18, height: 18, borderRadius: '50%', background: MAGENTA, display: 'inline-block'}} />{text}
  </div>
);

/** The rubber stamp: slams in from large, with ink bleed. */
const Stamp: React.FC<{at: number; x: number; y: number; word: string; color: string; rotate: number; size?: number}> =
  ({at, x, y, word, color, rotate, size = 250}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();
    if (frame < at) return null;
    const s = spring({frame: frame - at, fps, config: {damping: 14, stiffness: 420, mass: 0.6}});
    return (
      <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${interpolate(s, [0, 1], [2.6, 1])})`,
        opacity: Math.min(1, s * 2), border: `14px solid ${color}`, borderRadius: 26, padding: '0 46px',
        fontFamily: POSTER, fontSize: size, lineHeight: 1.08, color, letterSpacing: 6, mixBlendMode: 'multiply',
        WebkitMaskImage: `radial-gradient(circle at 30% 40%, #000 55%, rgba(0,0,0,.82) 75%), url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='s'><feTurbulence baseFrequency='.05' numOctaves='3' seed='4'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.9'/></filter><rect width='300' height='300' filter='url(%23s)'/></svg>")`,
        WebkitMaskComposite: 'source-in'}}>{word}</div>
    );
  };

type Visual = 'gift' | 'days' | 'rare';
type Round = {statement: string[]; fact: React.ReactNode; visual: Visual};

const ROUNDS: Round[] = [
  {statement: ['Noyob giftni', 'faqat sotib', 'olish', 'mumkin'], visual: 'gift',
    fact: <>Ijaraga ham olsa bo‘ladi. Gift <span style={{color: PAPER, textDecoration: 'underline'}}>profilingizda</span> turadi.</>},
  {statement: ['Ijara faqat', 'uzoq', 'muddatga'], visual: 'days',
    fact: <>3 kundan 30 kungacha: muddatni o‘zingiz tanlaysiz. 30 kunga −7% chegirma.</>},
  {statement: ['Noyob gift', 'doim', 'qimmat'], visual: 'rare',
    fact: <>Let’s Rock modeli giftlarning atigi 1,5 foizida bor. Ijarasi kuniga 750 so‘m.</>},
];

const DaysMeter: React.FC<{t: number; f: number}> = ({t, f}) => {
  const value = Math.round(interpolate(f, [60, 96], [3, 30], clamp));
  const knob = (value - 3) / 27;
  return (
    <div style={{position: 'absolute', left: LEFT, width: WIDTH, top: 560, opacity: Math.min(1, t * 1.5),
      transform: `translateY(${(1 - t) * 60}px)`}}>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 26}}>
        <span style={{fontFamily: POSTER, fontSize: 380, lineHeight: 0.9, color: INK}}>{value}</span>
        <span style={{fontFamily: POSTER, fontSize: 130, color: MAGENTA}}>kun</span>
      </div>
      <div style={{position: 'relative', height: 90, marginTop: 36}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 38, height: 14, borderRadius: 7, background: PAPER_DEEP,
          boxShadow: `inset 0 0 0 3px ${INK}`}} />
        <div style={{position: 'absolute', left: 0, width: `${knob * 100}%`, top: 38, height: 14, borderRadius: 7, background: MAGENTA}} />
        {[3, 7, 14, 30].map((d) => (
          <div key={d} style={{position: 'absolute', left: `${((d - 3) / 27) * 100}%`, top: 66, transform: 'translateX(-50%)',
            fontFamily: BODY, fontWeight: 800, fontSize: 30, color: d <= value ? INK : SLATE}}>{d}</div>
        ))}
        <div style={{position: 'absolute', left: `calc(${knob * 100}% - 32px)`, top: 13, width: 64, height: 64, borderRadius: '50%',
          background: PAPER, border: `8px solid ${INK}`}} />
      </div>
    </div>
  );
};

const RoundScene: React.FC<{round: Round; index: number; data: GiftData}> = ({round, index, data}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const f = frame;
  const stampAt = index === 0 ? 12 : 20;
  const move = spring({frame: f - 46, fps, config: {damping: 18, stiffness: 120}});
  const visual = spring({frame: f - 52, fps, config: {damping: 12, stiffness: 130, mass: 0.8}});
  const card = spring({frame: f - 62, fps, config: {damping: 16, stiffness: 140}});
  const shake = f >= stampAt && f < stampAt + 9 ? (random(`sh-${index}-${f}`) - 0.5) * 26 * (1 - (f - stampAt) / 9) : 0;
  const strike = interpolate(f, [stampAt + 3, stampAt + 11], [0, 1], clamp);

  // Statement: huge in the middle, then shrinks to the top once it has been stamped.
  const top = interpolate(move, [0, 1], [560, 300]);
  const scale = interpolate(move, [0, 1], [1, 0.4]);
  return (
    <AbsoluteFill style={{transform: `translate(${shake}px, ${shake * 0.6}px)`}}>
      <Header text={`Mif yoki fakt? · ${index + 1}/3`} />
      <div style={{position: 'absolute', left: LEFT, top, width: WIDTH, transformOrigin: 'top left', transform: `scale(${scale})`,
        opacity: interpolate(move, [0, 1], [1, 0.6])}}>
        {round.statement.map((line, i) => {
          const enter = index === 0 ? 1 : spring({frame: f - 2 - i * 4, fps, config: {damping: 13, stiffness: 200}});
          return (
            <div key={i} style={{position: 'relative', fontFamily: POSTER, fontSize: 150, lineHeight: 1.04, color: INK, whiteSpace: 'nowrap',
              width: 'fit-content', textTransform: 'uppercase', opacity: enter, transform: `translateY(${(1 - enter) * 50}px)`}}>
              {line}
              <div style={{position: 'absolute', left: -10, top: '52%', height: 22, width: `${strike * 106}%`, background: MAGENTA,
                transform: `rotate(${i % 2 ? 1.5 : -1.5}deg)`, opacity: 0.92}} />
            </div>
          );
        })}
      </div>
      <div style={{opacity: interpolate(move, [0, 0.6], [1, 0], clamp)}}>
        <Stamp at={stampAt} x={470} y={1340} word="MIF" color={MAGENTA} rotate={-8} />
      </div>

      {round.visual === 'gift' && (
        <Gift data={data} x={470} y={820} size={interpolate(visual, [0, 1], [300, 900])} opacity={Math.min(1, visual * 2)} glow={false} />
      )}
      {round.visual === 'rare' && (
        <>
          <Gift data={data} x={440} y={830} size={interpolate(visual, [0, 1], [300, 860])} opacity={Math.min(1, visual * 2)} glow={false} />
          <div style={{position: 'absolute', left: 640, top: 470, width: 250, height: 250, borderRadius: '50%', background: INK,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            transform: `scale(${spring({frame: f - 66, fps, config: {damping: 9, stiffness: 160}})}) rotate(${12 + Math.sin(f / 14) * 4}deg)`}}>
            <span style={{fontFamily: POSTER, fontSize: 104, lineHeight: 1, color: PAPER}}>1,5%</span>
            <span style={{fontFamily: BODY, fontWeight: 800, fontSize: 26, letterSpacing: 4, color: MAGENTA}}>NOYOBLIK</span>
          </div>
        </>
      )}
      {round.visual === 'days' && <DaysMeter t={visual} f={f} />}

      {/* Fact card */}
      <div style={{position: 'absolute', left: LEFT, width: WIDTH, top: 1170, padding: '34px 40px 40px', borderRadius: 30,
        background: MAGENTA, boxShadow: `14px 14px 0 ${INK}`, opacity: Math.min(1, card * 2),
        transform: `translateY(${(1 - card) * 300}px) rotate(${(1 - card) * -4}deg)`}}>
        <div style={{display: 'inline-block', fontFamily: POSTER, fontSize: 56, lineHeight: 1, color: MAGENTA, background: PAPER,
          padding: '10px 22px 8px', borderRadius: 12, letterSpacing: 3}}>FAKT</div>
        <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 50, lineHeight: 1.22, color: '#fff', marginTop: 22}}>{round.fact}</div>
      </div>
    </AbsoluteFill>
  );
};

/** A flat ink block that sweeps across between rounds. */
const Wipe: React.FC<{at: number; color: string}> = ({at, color}) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [at - 8, at + 8], [-1.3, 1.3], clamp);
  if (frame < at - 8 || frame > at + 8) return null;
  return <div style={{position: 'absolute', left: -400 + x * W, top: -200, width: W + 800, height: H + 400, background: color,
    transform: 'skewX(-14deg)'}} />;
};

const Closing: React.FC<{data: GiftData}> = ({data}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const at = (d: number) => spring({frame: frame - d, fps, config: {damping: 14, stiffness: 150}});
  const nudge = Math.sin(frame / 5) * 8;
  return (
    <AbsoluteFill>
      <Paper tone={MAGENTA} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 40% at 44% 36%, rgba(255,255,255,.22), transparent 70%)`}} />
      <Header text="Endi bilasiz" color={PAPER} />
      <Gift data={data} x={470} y={640} size={interpolate(at(2), [0, 1], [400, 940])} opacity={Math.min(1, at(2) * 2)} glow={false} />
      <div style={{position: 'absolute', left: LEFT, width: WIDTH, top: 1000}}>
        <div style={{fontFamily: POSTER, fontSize: 170, lineHeight: 1, color: PAPER, textTransform: 'uppercase',
          opacity: at(8), transform: `translateY(${(1 - at(8)) * 60}px)`}}>Ijaraga oling</div>
        <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 46, color: INK, marginTop: 14, opacity: at(14)}}>
          kuniga 750 so‘mdan · 3–30 kun
        </div>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 20, marginTop: 34, padding: '14px 40px 14px 14px',
          borderRadius: 999, background: INK, boxShadow: `10px 10px 0 rgba(29,26,36,.25)`,
          opacity: at(22), transform: `scale(${0.8 + at(22) * 0.2})`, transformOrigin: 'left center'}}>
          <Img src={staticFile('logo.png')} style={{width: 84, height: 84, borderRadius: '50%'}} />
          <span style={{fontFamily: BODY, fontWeight: 800, fontSize: 46, color: PAPER}}>{BRAND.bot}</span>
        </div>
        <div style={{fontFamily: POSTER, fontSize: 64, letterSpacing: 3, color: PAPER, marginTop: 30, opacity: at(32),
          transform: `translateY(${-nudge * at(32)}px)`}}>↑ HAVOLA PROFILDA</div>
      </div>
    </AbsoluteFill>
  );
};

const Video: React.FC = () => {
  useAnton();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  const data = gifts[0];
  return (
    <AbsoluteFill style={{background: PAPER}}>
      <Paper />
      {ROUNDS.map((round, i) => (
        <Sequence key={i} from={i * ROUND} durationInFrames={ROUND}>
          <RoundScene round={round} index={i} data={data} />
        </Sequence>
      ))}
      <Sequence from={CTA}><Closing data={data} /></Sequence>
      <Wipe at={ROUND} color={INK} />
      <Wipe at={ROUND * 2} color={INK} />
      <Wipe at={CTA} color={INK} />

      <Audio src={staticFile(`audio/bed_${ID}.wav`)} volume={(f) => interpolate(f, [0, 4, FRAMES - 24, FRAMES - 1], [0, 0.5, 0.5, 0], clamp)} />
      {ROUNDS.map((_, i) => (
        <React.Fragment key={i}>
          <Sequence from={i * ROUND + (i === 0 ? 12 : 20)}><Audio src={staticFile('audio/impact.wav')} volume={0.55} /></Sequence>
          <Sequence from={i * ROUND + 62}><Audio src={staticFile('audio/pop.wav')} volume={0.45} /></Sequence>
          {i > 0 && <Sequence from={i * ROUND - 8}><Audio src={staticFile('audio/whoosh.wav')} volume={0.35} /></Sequence>}
        </React.Fragment>
      ))}
      <Sequence from={CTA - 8}><Audio src={staticFile('audio/whoosh.wav')} volume={0.35} /></Sequence>
    </AbsoluteFill>
  );
};

const Cover: React.FC = () => {
  useAnton();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  return (
    <AbsoluteFill style={{background: PAPER}}>
      <Paper />
      <Header text="Mif yoki fakt?" />
      <div style={{position: 'absolute', left: LEFT, top: 300, width: WIDTH, fontFamily: POSTER, fontSize: 230, lineHeight: 1,
        color: INK, textTransform: 'uppercase', whiteSpace: 'nowrap'}}>
        3 ta <span style={{color: MAGENTA}}>mif</span>
        <div style={{fontSize: 96, lineHeight: 1.04, marginTop: 14}}>Telegram giftlar<br />haqida</div>
      </div>
      <Gift data={gifts[0]} x={470} y={1170} size={980} glow={false} />
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
