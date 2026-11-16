import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import {Lottie} from '@remotion/lottie';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Freeze, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random,
  staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {BODY, BRAND, GiftData, clamp, pop, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "Qaysi biri eng nodir?": three ice-cream gifts on frosted glass cards, each with a hidden "?%".
// Frame one already asks the question; the rarity of each is revealed in turn, the rarest last.
// Rarity is the model's (all three share a 1.5% backdrop); Sub-Zero is also rarest by symbol (0.3%).
const ID = 'V20261116f';
const GIFTS = ['vicecream-405489', 'icecream-192500', 'vicecream-48461'];
const ROUND = "'Fredoka', sans-serif";

// Palette, from the gifts: two warm pinks (Circus swirl, Trio Scoop) and one icy cyan (Sub-Zero).
// Background family: pastel lilac -> blush -> peach (analogous, light, low saturation) so all three read.
// Accent: strawberry, taken from the pink swirl. Neutral: deep plum ink and frosted white.
// Extra hue: icy cyan, from Sub-Zero, used only for the rarest reveal.
const PLUM = '#2b1a3f';
const STRAW = '#e2426f';
const ICE = '#1ea3dc';
const LILAC = '#e6dbf8';
const BLUSH = '#f6e1ef';
const PEACH = '#fde4da';

type Item = {name: string; rarity: string; tint: string};
const ITEMS: Item[] = [
  {name: 'Circus', rarity: '3%', tint: '#f6a3c0'},
  {name: 'Trio Scoop', rarity: '3%', tint: '#ffc6ae'},
  {name: 'Sub-Zero', rarity: '1,5%', tint: '#8fd8f5'},
];

// Timeline (30 fps). Reading pace: every block rests >= 1.2 s + 0.4 s per word once settled.
const HOOK_END = 90; // "Qaysi biri eng nodir?" visible from frame 0 to 90 (4 words need 84)
const SPOTS = [[90, 182], [182, 274], [274, 378]]; // name + "model" + % rest ~74 frames (3 words need 72)
const STAMP = 310; // "ENG NODIRI" (2 words) rests 316..378
const ALL = 378; // "Uchalasi ham ijarada" rests 384..464 (3 words need 72)
const PRICE = 464; // "Kuniga 750 so‘m" rests 470..594
const CTA = 496; // bot + link rest 504..594 (3.0 s)
const FRAMES = 594; // 19.8 s

// Row of glass cards (lower half stays between x = 70 and 870).
const CARD_W = 250;
const CARD_H = 420;
const CARD_TOP = 720;
const cardLeft = (i: number) => 70 + i * (CARD_W + 25);

const useFredoka = () => {
  const [handle] = useState(() => delayRender('fredoka'));
  useEffect(() => {
    Promise.all(['700 10px Fredoka', '600 10px Fredoka'].map((f) => document.fonts.load(f, 'Qaysi biri so‘m 1,5%')))
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

/** The gift held in its frame-0 pose: every frame of these three faces the viewer, frame 0 is the cleanest. */
const Pose: React.FC<{data: GiftData; cx: number; cy: number; size: number; shadow?: string}> =
  ({data, cx, cy, size, shadow = 'rgba(70,30,90,.28)'}) => (
    <div style={{position: 'absolute', left: cx - size / 2, top: cy - size / 2, width: size, height: size,
      filter: `drop-shadow(0 ${size * 0.05}px ${size * 0.06}px ${shadow})`}}>
      <Freeze frame={0}><Lottie animationData={data.gift} style={{width: size, height: size}} /></Freeze>
    </div>
  );

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const blob = (x: number, y: number, r: number, color: string, k: number) => (
    <div style={{position: 'absolute', left: x - r + Math.sin(frame / 70 + k) * 60, top: y - r + Math.cos(frame / 85 + k) * 50,
      width: r * 2, height: r * 2, borderRadius: '50%', background: color, filter: 'blur(110px)'}} />
  );
  return (
    <AbsoluteFill style={{background: `linear-gradient(172deg, ${LILAC} 0%, ${BLUSH} 52%, ${PEACH} 100%)`, overflow: 'hidden'}}>
      {blob(180, 420, 330, 'rgba(226,66,111,.20)', 0)}
      {blob(930, 980, 380, 'rgba(30,163,220,.16)', 2)}
      {blob(300, 1620, 420, 'rgba(176,150,240,.32)', 4)}
      {Array.from({length: 26}, (_, i) => { // sprinkles drifting down
        const r = (k: string) => random(`sprinkle-${i}-${k}`);
        const y = ((r('y') * 2100 + frame * (0.8 + r('s') * 1.2)) % 2100) - 90;
        const x = r('x') * 1080 + Math.sin(frame / 40 + i) * 14;
        const color = [STRAW, ICE, '#ffffff', '#b8a2ee'][i % 4];
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: 10, height: 34, borderRadius: 6,
          background: color, opacity: 0.55, transform: `rotate(${r('a') * 180 + frame * (r('r') - 0.5) * 2}deg)`}} />;
      })}
    </AbsoluteFill>
  );
};

const glassStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,.46)', border: '3px solid rgba(255,255,255,.85)',
  boxShadow: '0 30px 60px rgba(90,50,120,.16), inset 0 2px 0 rgba(255,255,255,.9)', backdropFilter: 'blur(18px)',
};

/** The row of three numbered cards. `reveal` shows the real rarity in the pills; `pills` fades them. */
const Row: React.FC<{gifts: GiftData[]; enter: number; exit: number; reveal: boolean; pills: number}> =
  ({gifts, enter, exit, reveal, pills}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();
    return (
      <>
        {gifts.map((g, i) => {
          const s = enter <= 0 ? 1 : pop(frame, fps, enter + i * 6, {damping: 13, stiffness: 150, mass: 0.7});
          const out = interpolate(frame, [exit + i * 3, exit + i * 3 + 9], [0, 1], clamp);
          const bob = Math.sin(frame / 16 + i * 2.1) * 8;
          const rare = reveal && i === 2;
          const left = cardLeft(i);
          return (
            <div key={i} style={{position: 'absolute', left, top: CARD_TOP + bob, width: CARD_W, height: CARD_H + 110,
              opacity: Math.min(1, s * 1.4) * (1 - out), transform: `translateY(${(1 - s) * 140 + out * 60}px) scale(${0.85 + 0.15 * s - out * 0.1})`}}>
              <div style={{position: 'absolute', inset: `0 0 110px 0`, borderRadius: 52, ...glassStyle,
                ...(rare ? {border: `4px solid ${ICE}`, boxShadow: `0 0 60px rgba(30,163,220,.45), 0 30px 60px rgba(90,50,120,.16)`} : {})}} />
              <Pose data={g} cx={CARD_W / 2} cy={CARD_H / 2 + 10} size={500} />
              <div style={{position: 'absolute', left: 18, top: 18, width: 66, height: 66, borderRadius: '50%', background: PLUM,
                color: '#fff', fontFamily: ROUND, fontWeight: 700, fontSize: 40, display: 'flex', alignItems: 'center',
                justifyContent: 'center'}}>{i + 1}</div>
              <div style={{position: 'absolute', left: 0, right: 0, top: CARD_H + 26, display: 'flex', justifyContent: 'center',
                opacity: pills}}>
                <div style={{minWidth: 150, padding: '6px 26px', borderRadius: 999, textAlign: 'center', fontFamily: ROUND,
                  fontWeight: 700, fontSize: 52, color: '#fff', background: rare ? ICE : reveal ? STRAW : PLUM,
                  transform: reveal ? 'none' : `scale(${1 + Math.max(0, Math.sin(frame / 7 + i * 1.3)) * 0.06})`}}>
                  {reveal ? ITEMS[i].rarity : '?%'}
                </div>
              </div>
            </div>
          );
        })}
      </>
    );
  };

/** A two-line headline in the top band; the second line is the accent. Settles in 6 frames, or is there from frame 0. */
const Title: React.FC<{lines: [string, string]; at: number; until: number; size?: number}> = ({lines, at, until, size = 136}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = at <= 0 ? 1 : pop(frame, fps, at, {damping: 14, stiffness: 220, mass: 0.6});
  const out = interpolate(frame, [until - 6, until], [0, 1], clamp);
  if (frame < at || frame >= until) return null;
  return (
    <div style={{position: 'absolute', left: 70, top: 262, width: 940, fontFamily: ROUND, fontWeight: 700, fontSize: size,
      lineHeight: 1.02, letterSpacing: -1, opacity: Math.min(1, s * 1.5) * (1 - out),
      transform: `translateY(${(1 - s) * 40 - out * 30}px)`}}>
      <div style={{color: PLUM}}>{lines[0]}</div>
      <div style={{color: STRAW}}>{lines[1]}</div>
    </div>
  );
};

/** One gift in close-up, with its name and the model's rarity. */
const Spot: React.FC<{data: GiftData; item: Item; index: number; from: number; to: number}> = ({data, item, index, from, to}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < from - 2 || frame >= to) return null;
  const s = pop(frame, fps, from, {damping: 12, stiffness: 120, mass: 0.8});
  const text = pop(frame, fps, from + 4, {damping: 14, stiffness: 200, mass: 0.6});
  const out = interpolate(frame, [to - 7, to], [0, 1], clamp);
  const sway = Math.sin((frame - from) / 18) * 2.5;
  const cy = 800 + Math.sin(frame / 20) * 10;
  const rare = index === 2;
  return (
    <>
      <div style={{position: 'absolute', left: 470 - 380, top: cy - 380, width: 760, height: 760, borderRadius: '50%',
        background: `radial-gradient(circle, ${item.tint} 0%, rgba(255,255,255,0) 68%)`, opacity: s * (1 - out),
        transform: `scale(${0.6 + 0.4 * s})`}} />
      <div style={{position: 'absolute', inset: 0, opacity: Math.min(1, s * 1.5) * (1 - out),
        transform: `translateX(${-out * 160}px) rotate(${(1 - s) * -10 + sway}deg)`, transformOrigin: '470px 800px'}}>
        <Pose data={data} cx={470} cy={cy} size={Math.round(980 * (0.7 + 0.3 * s))} shadow="rgba(70,30,90,.32)" />
      </div>
      <div style={{position: 'absolute', left: 70, top: 1190, width: 800, opacity: Math.min(1, text * 1.5) * (1 - out),
        transform: `translateY(${(1 - text) * 50}px)`}}>
        <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 40, letterSpacing: 6, color: 'rgba(43,26,63,.6)'}}>
          {index + 1} · MODEL
        </div>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 30, marginTop: 4}}>
          <div style={{fontFamily: ROUND, fontWeight: 700, fontSize: 118, color: PLUM, lineHeight: 1.05}}>{item.name}</div>
        </div>
        <div style={{display: 'inline-block', marginTop: 18, padding: '6px 34px', borderRadius: 999, fontFamily: ROUND,
          fontWeight: 700, fontSize: 92, color: '#fff', background: rare ? ICE : STRAW,
          boxShadow: `0 18px 40px ${rare ? 'rgba(30,163,220,.35)' : 'rgba(226,66,111,.3)'}`}}>{item.rarity}</div>
      </div>
    </>
  );
};

/** "ENG NODIRI" stamp over Sub-Zero, top right of the gift (upper half: free of Instagram's buttons). */
const Stamp: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < STAMP || frame >= SPOTS[2][1]) return null;
  const s = pop(frame, fps, STAMP, {damping: 9, stiffness: 180, mass: 0.6});
  const out = interpolate(frame, [SPOTS[2][1] - 7, SPOTS[2][1]], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', left: 470, top: 300, padding: '18px 34px', borderRadius: 26, background: ICE,
      color: '#fff', fontFamily: ROUND, fontWeight: 700, fontSize: 76, lineHeight: 1, opacity: Math.min(1, s * 2) * (1 - out),
      transform: `rotate(-7deg) scale(${interpolate(s, [0, 1], [2.2, 1])})`, boxShadow: '0 24px 50px rgba(30,163,220,.4)',
      border: '4px solid rgba(255,255,255,.9)'}}>
      ENG NODIRI
    </div>
  );
};

/** Progress dots 1-2-3 in the top band during the close-ups. */
const Dots: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < HOOK_END || frame >= ALL) return null;
  const current = SPOTS.findIndex(([a, b]) => frame >= a && frame < b);
  const show = interpolate(frame, [HOOK_END, HOOK_END + 8, ALL - 6, ALL], [0, 1, 1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: 70, top: 262, display: 'flex', gap: 18, opacity: show}}>
      {SPOTS.map((_, i) => (
        <div key={i} style={{width: i === current ? 120 : 64, height: 64, borderRadius: 999, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontFamily: ROUND, fontWeight: 700, fontSize: 36,
          background: i === current ? (i === 2 ? ICE : STRAW) : i < current ? PLUM : 'rgba(255,255,255,.6)',
          color: i <= current ? '#fff' : 'rgba(43,26,63,.45)', border: '3px solid rgba(255,255,255,.85)'}}>{i + 1}</div>
      ))}
    </div>
  );
};

const Price: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < PRICE) return null;
  const a = pop(frame, fps, PRICE, {damping: 12, stiffness: 180, mass: 0.6});
  const b = pop(frame, fps, CTA, {damping: 13, stiffness: 170, mass: 0.6});
  const nudge = Math.max(0, Math.sin((frame - CTA) / 6)) * 10;
  return (
    <>
      <div style={{position: 'absolute', left: 70, top: 262, opacity: Math.min(1, a * 1.5), transform: `translateY(${(1 - a) * 40}px)`}}>
        <div style={{fontFamily: ROUND, fontWeight: 600, fontSize: 72, color: PLUM, lineHeight: 1}}>Kuniga</div>
        <div style={{fontFamily: ROUND, fontWeight: 700, fontSize: 176, color: STRAW, lineHeight: 1.05, letterSpacing: -2}}>750 so‘m</div>
      </div>
      <div style={{position: 'absolute', left: 70, top: 1270, opacity: Math.min(1, b * 1.5), transform: `translateY(${(1 - b) * 50}px)`}}>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 22, padding: '16px 40px 16px 16px', borderRadius: 999, ...glassStyle,
          background: 'rgba(255,255,255,.72)'}}>
          <Img src={staticFile('logo.png')} style={{width: 92, height: 92, borderRadius: '50%', background: BRAND.ink}} />
          <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 52, color: PLUM}}>{BRAND.bot}</div>
        </div>
        <div style={{marginTop: 30, marginLeft: 12, fontFamily: ROUND, fontWeight: 700, fontSize: 64, color: STRAW,
          transform: `translateY(${-nudge}px)`}}>↑ Havola profilda</div>
      </div>
    </>
  );
};

const Scene: React.FC<{gifts: GiftData[]}> = ({gifts}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background />
      {frame < HOOK_END + 14 && <Row gifts={gifts} enter={0} exit={HOOK_END - 6} reveal={false} pills={1} />}
      <Title lines={['Qaysi biri', 'eng nodir?']} at={0} until={HOOK_END} />
      {SPOTS.map(([from, to], i) => <Spot key={i} data={gifts[i]} item={ITEMS[i]} index={i} from={from} to={to} />)}
      <Stamp />
      <Dots />
      {frame >= ALL && <Row gifts={gifts} enter={ALL} exit={100000} reveal
        pills={interpolate(frame, [PRICE - 6, PRICE], [1, 0], clamp)} />}
      <Title lines={['Uchalasi ham', 'ijarada']} at={ALL + 2} until={PRICE} size={124} />
      <Price />
    </AbsoluteFill>
  );
};

const Video: React.FC = () => {
  useFredoka();
  const gifts = useGifts(GIFTS);
  if (!gifts) return null;
  return (
    <AbsoluteFill>
      <Scene gifts={gifts} />
      <Audio src={staticFile(`audio/bed_${ID}.wav`)}
        volume={(f) => interpolate(f, [0, 2, FRAMES - 24, FRAMES - 1], [0, 0.5, 0.5, 0], clamp)} />
      <Audio src={staticFile('audio/glass.wav')} volume={0.35} />
      {SPOTS.map(([from], i) => (
        <Sequence key={i} from={from}><Audio src={staticFile('audio/glass.wav')} volume={0.45} /></Sequence>
      ))}
      <Sequence from={STAMP}><Audio src={staticFile('audio/sparkle.wav')} volume={0.5} /></Sequence>
      {[0, 6, 12].map((d) => (
        <Sequence key={d} from={ALL + d}><Audio src={staticFile('audio/glass.wav')} volume={0.3} /></Sequence>
      ))}
      <Sequence from={PRICE}><Audio src={staticFile('audio/pop.wav')} volume={0.35} /></Sequence>
      <Sequence from={CTA}><Audio src={staticFile('audio/glass.wav')} volume={0.4} /></Sequence>
    </AbsoluteFill>
  );
};

/** Cover: the question and the three cards with hidden percentages, sized to read as a thumbnail. */
const Cover: React.FC = () => {
  useFredoka();
  const gifts = useGifts(GIFTS);
  if (!gifts) return null;
  return (
    <AbsoluteFill>
      <Background />
      <Row gifts={gifts} enter={0} exit={100000} reveal={false} pills={1} />
      <div style={{position: 'absolute', left: 70, top: 250, fontFamily: ROUND, fontWeight: 700, fontSize: 150, lineHeight: 1,
        letterSpacing: -2}}>
        <div style={{color: PLUM}}>Qaysi biri</div>
        <div style={{color: STRAW}}>eng nodir?</div>
      </div>
      <div style={{position: 'absolute', left: 70, top: 1290, fontFamily: ROUND, fontWeight: 600, fontSize: 60, color: PLUM}}>
        Javob videoda
      </div>
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
