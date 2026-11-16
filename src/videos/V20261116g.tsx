import '@fontsource/space-grotesk/700.css';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';
import {Lottie} from '@remotion/lottie';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Freeze, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random,
  spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {BRAND, GiftData, clamp, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "Ijara cheki": a thermal receipt prints the bill for keeping Candy Cane #194062 on your profile for 30 days,
// one line at a time, and the total is rung up and torn off. Frame one: "30 kun profilingizda. Hisobi qancha?"
// with the gift and a receipt stub whose total is still spinning.
// Arithmetic from the live catalogue: 750 so‘m/day x 30 = 22 500; 30-day discount 7% = 1 575; total 20 925.
const ID = 'V20261116g';
const SLUG = 'candycane-194062';
const GROTESK = "'Space Grotesk', sans-serif";
const MONO = "'Space Mono', monospace";

// Palette, from the gift: candy red (the cane) on the gift's own green backdrop family (complementary pair).
// Background: deep pine greens, muted. Accent: candy red, the only saturated hue. Neutral: thermal paper and ink.
const PINE = '#0d2620';
const PINE_2 = '#18402f';
const PINE_LINE = '#2c5c4a';
const RED = '#e23a3f';
const PAPER = '#f4efe4';
const INK = '#1f2421';
const INK_SOFT = '#7b7f78';

// Timeline (30 fps). Reading pace: each line rests >= 1.2 s + 0.4 s per word after its 8-frame print.
const HOOK_OUT = 104; // hook (5 words + "JAMI") from frame 0; needs 96 frames, gets 104
// Each row feeds for 8 frames, prints in 6, then rests 72 frames (3 words) before the next feed.
const PRINTS = [122, 208, 294, 380]; // gift / kuniga / x 30 kun / chegirma
const TOTAL = 466; // feed 466..474, then JAMI 20 925 so‘m prints and rests 480..600 (4.0 s)
const TEAR = 492;
const CTA = 508; // bot + "Havola profilda" rest 516..600 (2.8 s after settling, 3.1 s from entry)
const FRAMES = 600; // 20.0 s

// Geometry. Lower-half content lives in x 110..830 (centred on x = 470), clear of the right-hand buttons.
const CX = 470;
const PAPER_L = 110;
const PAPER_W = 720;
const SLOT_Y = 1452; // printer mouth: the paper comes out of here, upwards
const PAPER_TOP_HOOK = 1170;
const PAPER_TOP = 690;
const HEAD = 1196; // where a freshly printed line sits (top of its row)
const STEP = 182;
const TOTAL_Y = 1176; // dashed rule above the total, as printed
const TEAR_SHIFT = 300; // the strip feeds up this far when it is torn off
const CTA_Y = 1226;

type Row = {label: string; value: string; at: number};
const ROWS: Row[] = [
  {label: 'Gift', value: 'Candy Cane', at: PRINTS[0]},
  {label: 'Kuniga', value: '750 so‘m', at: PRINTS[1]},
  {label: '× 30 kun', value: '22 500', at: PRINTS[2]},
  {label: '−7% chegirma', value: '−1 575', at: PRINTS[3]},
];

const useFonts = () => {
  const [handle] = useState(() => delayRender('space fonts'));
  useEffect(() => {
    Promise.all(['700 10px "Space Grotesk"', '700 10px "Space Mono"', '400 10px "Space Mono"']
      .map((f) => document.fonts.load(f, 'Hisobi qancha? so‘m −7% × 20 925 ↑')))
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

/** Stepper-motor motion: progress that advances in four jerks, like paper fed by a thermal printer. */
const stepped = (frame: number, at: number, length = 8) => {
  const p = interpolate(frame, [at, at + length], [0, 1], clamp);
  return Math.floor(p * 4) / 4;
};

/** How many lines the paper has been fed past a row printed at `at` (continuous, in rows). */
const fedSince = (frame: number, at: number) =>
  [...PRINTS, TOTAL].filter((p) => p > at).reduce((sum, p) => sum + stepped(frame, p) * (p === TOTAL ? 1.25 : 1), 0);

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: `linear-gradient(170deg, ${PINE_2} 0%, ${PINE} 70%)`, overflow: 'hidden'}}>
      {/* broad candy stripes, tone on tone, drifting slowly */}
      <div style={{position: 'absolute', inset: -600, transform: `rotate(-32deg) translateX(${(frame * 0.9) % 240}px)`,
        background: `repeating-linear-gradient(90deg, rgba(255,255,255,.035) 0 90px, transparent 90px 240px)`}} />
      <div style={{position: 'absolute', left: CX - 520, top: 120, width: 1040, height: 1040, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(244,239,228,.16) 0%, rgba(244,239,228,0) 62%)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 90% 70% at 45% 45%, transparent 55%, rgba(0,0,0,.45) 100%)'}} />
    </AbsoluteFill>
  );
};

/** The candy cane held in its frame-0 pose: mid-loop it turns and looks narrow, frame 0 faces the viewer. */
const Cane: React.FC<{data: GiftData; cy: number; size: number; sway?: number}> = ({data, cy, size, sway = 0}) => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 18) * 10;
  return (
    <div style={{position: 'absolute', left: CX - size / 2, top: cy - size / 2 + bob, width: size, height: size,
      transform: `rotate(${sway}deg)`, filter: `drop-shadow(0 ${size * 0.04}px ${size * 0.05}px rgba(0,0,0,.45))`}}>
      <Freeze frame={0}><Lottie animationData={data.gift} style={{width: size, height: size}} /></Freeze>
    </div>
  );
};

/** Zigzag edge of torn or cut paper, drawn as a strip of triangles. */
const Zigzag: React.FC<{top: number; flip?: boolean}> = ({top, flip}) => (
  <svg width={PAPER_W} height={18} style={{position: 'absolute', left: 0, top, transform: flip ? 'scaleY(-1)' : undefined}}>
    <path d={`M0 0 ${Array.from({length: 37}, (_, i) => `L${i * 20 + 10} 18 L${i * 20 + 20} 0`).join(' ')} Z`} fill={PAPER} />
  </svg>
);

const Dashes: React.FC<{top: number; opacity?: number}> = ({top, opacity = 1}) => (
  <div style={{position: 'absolute', left: 44, right: 44, top, height: 0, opacity,
    borderTop: `4px dashed ${INK_SOFT}`}} />
);

/** One printed row: label left, value right, revealed top-to-bottom as the head passes. */
const PrintedRow: React.FC<{row: Row; top: number; shift: number; gone: number}> = ({row, top, shift, gone}) => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [row.at + 8, row.at + 14], [0, 100], clamp);
  const fed = fedSince(frame, row.at);
  const opacity = frame < row.at + 8 ? 0 : interpolate(fed, [0, 1, 1.7], [1, 0.3, 0], clamp) * (1 - gone);
  return (
    <div style={{position: 'absolute', left: 44, right: 44, top: top - fed * STEP - shift, height: 170, fontFamily: MONO, fontWeight: 700,
      opacity, clipPath: `inset(0 0 ${100 - reveal}% 0)`}}>
      <div style={{fontSize: 44, color: INK_SOFT, lineHeight: 1}}>{row.label}</div>
      <div style={{fontSize: 92, color: INK, lineHeight: 1.2, marginTop: 10, whiteSpace: 'nowrap'}}>{row.value}</div>
    </div>
  );
};

/** Spinning digits for the unknown total, settling nowhere until the reveal. */
const Spinner: React.FC = () => {
  const frame = useCurrentFrame();
  const d = (k: number) => Math.floor(random(`spin-${Math.floor(frame / 2)}-${k}`) * 10);
  return <>{`${d(1)}${d(2)} ${d(3)}${d(4)}${d(5)}`}</>;
};

const Video: React.FC = () => {
  useFonts();
  const gifts = useGifts([SLUG]);
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (!gifts) return null;
  const [cane] = gifts;

  // Hook -> receipt: the headline leaves, the gift rises, the paper feeds up to its full height.
  const lift = spring({frame: frame - HOOK_OUT, fps, config: {damping: 16, stiffness: 110, mass: 0.8}});
  const hookOut = interpolate(frame, [HOOK_OUT, HOOK_OUT + 10], [0, 1], clamp);
  const feed = stepped(frame, HOOK_OUT + 4, 16);
  const tear = spring({frame: frame - TEAR, fps, config: {damping: 14, stiffness: 120, mass: 0.8}});
  const paperTop = interpolate(feed, [0, 1], [PAPER_TOP_HOOK, PAPER_TOP]) + tear * 150; // torn strip is shorter
  const caneY = interpolate(lift, [0, 1], [985, 452]);
  const caneSize = interpolate(lift, [0, 1], [820, 740]);
  const nudge = PRINTS.concat(TOTAL).reduce((s, p) => s + Math.max(0, Math.sin(Math.min(Math.PI, (frame - p) / 4))) *
    (frame >= p ? 1 : 0), 0);

  // Total and tear.
  const total = spring({frame: frame - TOTAL - 8, fps, config: {damping: 11, stiffness: 170, mass: 0.6}});
  const printerOut = interpolate(frame, [TEAR + 2, TEAR + 16], [0, 1], clamp);
  const cta = spring({frame: frame - CTA, fps, config: {damping: 13, stiffness: 150, mass: 0.7}});
  const link = spring({frame: frame - CTA - 8, fps, config: {damping: 13, stiffness: 150, mass: 0.7}});
  const ctaBob = Math.sin((frame - CTA) / 6) * 6;

  // After the tear the printed lines feed up under the header and the strip ends just below the total.
  const shift = tear * TEAR_SHIFT;
  const paperBottom = SLOT_Y - tear * TEAR_SHIFT + 4;
  const totalTop = TOTAL_Y - shift;

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Background />

      <Cane data={cane} cy={caneY} size={caneSize} sway={Math.sin(frame / 26) * 2.5 - nudge * 1.5} />

      {/* the receipt strip */}
      <div style={{position: 'absolute', left: PAPER_L, top: paperTop, width: PAPER_W,
        height: paperBottom - paperTop, transformOrigin: '50% 100%', transform: `rotate(${-tear * 1.5}deg)`,
        filter: 'drop-shadow(0 26px 40px rgba(0,0,0,.4))'}}>
        <div style={{position: 'absolute', inset: 0, top: 16, background: PAPER, overflow: 'hidden'}}>
          {/* faint thermal-paper grain */}
          <AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,.018) 0 2px, transparent 2px 6px)'}} />
          {/* hook stub: the total, still spinning */}
          <div style={{position: 'absolute', left: 44, right: 44, top: 52, display: 'flex', justifyContent: 'space-between',
            alignItems: 'baseline', fontFamily: MONO, fontWeight: 700, color: INK, opacity: 1 - hookOut}}>
            <span style={{fontSize: 60}}>JAMI</span>
            <span style={{fontSize: 92, color: RED}}><Spinner /></span>
          </div>
          {/* receipt body, positioned in frame coordinates relative to the paper's top */}
          <div style={{position: 'absolute', left: 0, right: 0, top: -(paperTop + 16), height: H_FRAME}}>
            <div style={{position: 'absolute', left: 0, right: 0, top: PAPER_TOP + 40 - shift, textAlign: 'center', fontFamily: MONO,
              fontWeight: 700, fontSize: 42, letterSpacing: 10, color: INK, opacity: interpolate(feed, [0.75, 1], [0, 1], clamp)}}>
              IJARA CHEKI
            </div>
            <Dashes top={PAPER_TOP + 120 - shift} opacity={interpolate(feed, [0.75, 1], [0, 1], clamp)} />
            {ROWS.map((row, i) => <PrintedRow key={i} row={row} top={HEAD} shift={shift} gone={tear} />)}
            {/* the total */}
            <div style={{position: 'absolute', left: 0, right: 0, top: totalTop, height: 230,
              opacity: frame < TOTAL + 8 ? 0 : 1, clipPath: `inset(0 0 ${100 - interpolate(frame, [TOTAL + 8, TOTAL + 14], [0, 100], clamp)}% 0)`}}>
              <Dashes top={0} />
              <div style={{position: 'absolute', left: 44, top: 30, fontFamily: MONO, fontWeight: 700, fontSize: 48,
                color: INK, lineHeight: 1}}>JAMI · 30 kun</div>
              <div style={{position: 'absolute', left: 44, top: 88, display: 'flex', alignItems: 'baseline', gap: 22,
                fontFamily: MONO, fontWeight: 700, whiteSpace: 'nowrap', transformOrigin: '0% 70%',
                transform: `scale(${interpolate(total, [0, 1], [1.25, 1])})`}}>
                <span style={{fontSize: 118, color: RED, lineHeight: 1}}>20 925</span>
                <span style={{fontSize: 52, color: INK}}>so‘m</span>
              </div>
            </div>
          </div>
        </div>
        <Zigzag top={0} flip />
        {/* torn bottom edge appears with the tear */}
        <div style={{position: 'absolute', left: 0, bottom: -16, opacity: tear > 0.02 ? 1 : 0}}><Zigzag top={0} /></div>
      </div>

      {/* the printer the paper comes out of */}
      <div style={{position: 'absolute', left: 70, top: SLOT_Y - 8 + printerOut * 560, width: 800, height: 150,
        borderRadius: 34, background: `linear-gradient(180deg, #0a1d18, #06130f)`,
        border: `3px solid ${PINE_LINE}`, boxShadow: '0 -10px 40px rgba(0,0,0,.35)'}}>
        <div style={{position: 'absolute', left: 30, right: 30, top: 16, height: 14, borderRadius: 7, background: '#020806'}} />
        <div style={{position: 'absolute', left: 36, top: 60, width: 18, height: 18, borderRadius: '50%',
          background: frame % 30 < 18 || frame > TOTAL ? RED : '#4a1416', boxShadow: `0 0 18px ${RED}`}} />
        <div style={{position: 'absolute', left: 72, top: 52, fontFamily: MONO, fontWeight: 400, fontSize: 30,
          letterSpacing: 4, color: 'rgba(244,239,228,.45)'}}>{frame < HOOK_OUT ? 'HISOBLANMOQDA…' : 'CHOP ETILMOQDA…'}</div>
      </div>

      {/* hook headline, there from frame 0 */}
      <div style={{position: 'absolute', left: 70, top: 236, opacity: 1 - hookOut,
        transform: `translateY(${-hookOut * 80}px)`}}>
        <div style={{fontFamily: GROTESK, fontWeight: 700, fontSize: 196, lineHeight: 0.92, color: PAPER,
          letterSpacing: -6}}>30 kun</div>
        <div style={{fontFamily: GROTESK, fontWeight: 700, fontSize: 104, lineHeight: 1.05, color: PAPER,
          letterSpacing: -2, marginTop: 6}}>profilingizda.</div>
        <div style={{display: 'inline-block', marginTop: 18, padding: '6px 26px 12px', borderRadius: 18, background: RED,
          fontFamily: GROTESK, fontWeight: 700, fontSize: 104, lineHeight: 1.05, color: PAPER, letterSpacing: -2,
          transform: `rotate(-2deg) scale(${1 + Math.max(0, Math.sin(frame / 6)) * 0.025})`}}>Hisobi qancha?</div>
      </div>

      {/* call to action, where the printer was */}
      <div style={{position: 'absolute', left: 0, width: CX * 2, top: CTA_Y, display: 'flex', justifyContent: 'center',
        opacity: Math.min(1, cta * 1.4), transform: `scale(${0.7 + cta * 0.3})`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 20, padding: '14px 38px 14px 16px', borderRadius: 999,
          background: RED, boxShadow: '0 20px 50px rgba(0,0,0,.4)'}}>
          <Img src={staticFile('logo.png')} style={{width: 78, height: 78, borderRadius: '50%', background: BRAND.ink}} />
          <div style={{fontFamily: GROTESK, fontWeight: 700, fontSize: 50, color: PAPER}}>{BRAND.bot}</div>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, width: CX * 2, top: CTA_Y + 124, textAlign: 'center', fontFamily: GROTESK,
        fontWeight: 700, fontSize: 46, color: PAPER, opacity: link, transform: `translateY(${-ctaBob * link}px)`}}>
        ↑ Havola profilda
      </div>

      <Audio src={staticFile(`audio/bed_${ID}.wav`)}
        volume={(f) => interpolate(f, [0, 8, FRAMES - 24, FRAMES], [0.5, 0.42, 0.42, 0], clamp)} />
      <Audio src={staticFile('audio/printer.wav')} volume={0.25} />
      <Sequence from={HOOK_OUT + 4}><Audio src={staticFile('audio/printer.wav')} volume={0.5} /></Sequence>
      {PRINTS.map((p) => (
        <Sequence key={p} from={p}><Audio src={staticFile('audio/printer.wav')} volume={0.55} /></Sequence>
      ))}
      <Sequence from={TOTAL}><Audio src={staticFile('audio/printer.wav')} volume={0.55} /></Sequence>
      <Sequence from={TOTAL + 12}><Audio src={staticFile('audio/till.wav')} volume={0.5} /></Sequence>
      <Sequence from={TEAR}><Audio src={staticFile('audio/tear.wav')} volume={0.6} /></Sequence>
      <Sequence from={CTA}><Audio src={staticFile('audio/pop.wav')} volume={0.3} /></Sequence>
    </AbsoluteFill>
  );
};
const H_FRAME = 1920;

/** Cover: the hook as a still: the question, the gift, and the receipt stub with the total hidden. */
const Cover: React.FC = () => {
  useFonts();
  const gifts = useGifts([SLUG]);
  if (!gifts) return null;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Background />
      <Cane data={gifts[0]} cy={985} size={820} />
      <div style={{position: 'absolute', left: PAPER_L, top: PAPER_TOP_HOOK, width: PAPER_W, height: SLOT_Y - PAPER_TOP_HOOK,
        filter: 'drop-shadow(0 26px 40px rgba(0,0,0,.4))'}}>
        <div style={{position: 'absolute', inset: 0, top: 16, background: PAPER}}>
          <div style={{position: 'absolute', left: 44, right: 44, top: 52, display: 'flex', justifyContent: 'space-between',
            alignItems: 'baseline', fontFamily: MONO, fontWeight: 700, color: INK}}>
            <span style={{fontSize: 60}}>JAMI</span>
            <span style={{fontSize: 92, color: RED}}>?? ???</span>
          </div>
        </div>
        <Zigzag top={0} flip />
      </div>
      <div style={{position: 'absolute', left: 70, top: SLOT_Y - 8, width: 800, height: 150, borderRadius: 34,
        background: 'linear-gradient(180deg, #0a1d18, #06130f)', border: `3px solid ${PINE_LINE}`}}>
        <div style={{position: 'absolute', left: 30, right: 30, top: 16, height: 14, borderRadius: 7, background: '#020806'}} />
      </div>
      <div style={{position: 'absolute', left: 70, top: 236}}>
        <div style={{fontFamily: GROTESK, fontWeight: 700, fontSize: 196, lineHeight: 0.92, color: PAPER, letterSpacing: -6}}>30 kun</div>
        <div style={{fontFamily: GROTESK, fontWeight: 700, fontSize: 104, lineHeight: 1.05, color: PAPER, letterSpacing: -2,
          marginTop: 6}}>profilingizda.</div>
        <div style={{display: 'inline-block', marginTop: 18, padding: '6px 26px 12px', borderRadius: 18, background: RED,
          fontFamily: GROTESK, fontWeight: 700, fontSize: 104, lineHeight: 1.05, color: PAPER, letterSpacing: -2,
          transform: 'rotate(-2deg)'}}>Hisobi qancha?</div>
      </div>
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
