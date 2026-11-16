import '@fontsource/fraunces/900.css';
import '@fontsource/fraunces/900-italic.css';
import '@fontsource/fraunces/600-italic.css';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {BODY, BRAND, Gift, GiftData, H, W, clamp, useGifts} from '../kit';
import type {CustomVideo, VoiceLine} from './registry';

// "Noyob profil retsepti": renting a gift told as a potion recipe. Ingredients (one rare gift, a rental
// period), "stir", and the result: the gift on your profile. Voiced (Madina), a night-time witchy kitchen.
const ID = 'V20261116d';
const GIFT = 'hexpot-42707';
const SERIF = "'Fraunces', serif";
// Palette built from the Hex Pot artwork: teal cauldron (accent), magenta bubbles (the one extra hue),
// on a deep aubergine night (background family, complementary to the teal), lilac-white neutral.
const NIGHT = '#150b22';
const PLUM = '#2c1747';
const TEAL = '#3fe0c8';
const MAGENTA = '#ff5fa8';
const MILK = '#f3ecff';
const LEFT = 70;
const WIDTH = 800;

const useFraunces = () => {
  const [handle] = useState(() => delayRender('fraunces'));
  useEffect(() => {
    Promise.all(['900 10px Fraunces', 'italic 900 10px Fraunces', 'italic 600 10px Fraunces']
      .map((f) => document.fonts.load(f, 'Noyob o‘ 750 –')))
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

/** Night sky with a teal glow where the cauldron stands, faint stars and rising bubbles. */
const Night: React.FC<{glowY: number; glow?: number}> = ({glowY, glow = 1}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 120% 80% at 50% 40%, ${PLUM} 0%, ${NIGHT} 70%)`}}>
      <AbsoluteFill style={{opacity: 0.55 * glow,
        background: `radial-gradient(ellipse 60% 26% at 44% ${glowY / H * 100}%, rgba(63,224,200,.45), transparent 70%)`}} />
      {Array.from({length: 46}, (_, i) => {
        const r = (k: string) => random(`star-${i}-${k}`);
        const tw = 0.25 + 0.75 * Math.abs(Math.sin(frame / (14 + r('t') * 20) + i));
        return <div key={i} style={{position: 'absolute', left: r('x') * W, top: r('y') * H * 0.9, width: 3 + r('s') * 4,
          height: 3 + r('s') * 4, borderRadius: '50%', background: MILK, opacity: tw * 0.45}} />;
      })}
      {Array.from({length: 22}, (_, i) => {
        const r = (k: string) => random(`bub-${i}-${k}`);
        const speed = 1.4 + r('v') * 2.6;
        const y = ((r('y') * H - frame * speed) % H + H) % H;
        const x = r('x') * W + Math.sin(frame / (18 + r('w') * 20) + i) * 30;
        const size = 14 + r('z') * 46;
        const color = r('c') > 0.65 ? MAGENTA : TEAL;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: '50%',
          border: `3px solid ${color}`, opacity: 0.22 + r('o') * 0.25,
          background: `radial-gradient(circle at 32% 30%, rgba(255,255,255,.55) 0 12%, transparent 16%)`}} />;
      })}
    </AbsoluteFill>
  );
};

const enter = (frame: number, fps: number, at: number) =>
  spring({frame: frame - at, fps, config: {damping: 15, stiffness: 120, mass: 0.8}});

/** Small handwritten-style label above a block, e.g. "Ingrediyent 1". */
const Label: React.FC<{text: string; color?: string}> = ({text, color = TEAL}) => (
  <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 600, fontSize: 52, color, marginBottom: 6}}>{text}</div>
);

/** One recipe step: label + big line, and a tag that arrives a second later. */
const Step: React.FC<{label: string; big: React.ReactNode; tag: React.ReactNode; tagAt: number; length: number; num: string}> =
  ({label, big, tag, tagAt, length, num}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();
    const a = enter(frame, fps, 0);
    const b = enter(frame, fps, tagAt);
    const out = interpolate(frame, [length - 7, length], [0, 1], clamp);
    return (
      <div style={{position: 'absolute', left: LEFT, width: WIDTH, top: 1110, opacity: Math.min(1, a * 1.5) * (1 - out),
        transform: `translateY(${(1 - a) * 70 - out * 40}px)`}}>
        <div style={{display: 'flex', alignItems: 'flex-start', gap: 30}}>
          <div style={{flex: 'none', width: 118, height: 118, borderRadius: '50%', border: `5px solid ${TEAL}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 900, fontSize: 70,
            color: TEAL, marginTop: 16, boxShadow: `0 0 40px rgba(63,224,200,.35)`}}>{num}</div>
          <div>
            <Label text={label} />
            <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 96, lineHeight: 1.02, color: MILK}}>{big}</div>
            <div style={{display: 'inline-block', marginTop: 26, padding: '12px 28px', borderRadius: 999, background: MAGENTA,
              fontFamily: BODY, fontWeight: 800, fontSize: 44, color: NIGHT, opacity: Math.min(1, b * 1.5),
              transform: `scale(${0.7 + b * 0.3})`, transformOrigin: 'left center'}}>{tag}</div>
          </div>
        </div>
      </div>
    );
  };

/** A burst of bubbles from the cauldron mouth, used as the cut between steps. */
const Burst: React.FC<{at: number; x: number; y: number}> = ({at, x, y}) => {
  const frame = useCurrentFrame();
  const t = (frame - at) / 22;
  if (t < 0 || t > 1) return null;
  return (
    <>
      {Array.from({length: 16}, (_, i) => {
        const r = (k: string) => random(`burst-${at}-${i}-${k}`);
        const angle = -Math.PI / 2 + (r('a') - 0.5) * 2.2;
        const dist = (160 + r('d') * 420) * Math.sqrt(t);
        const size = (24 + r('s') * 60) * (1 - t * 0.5);
        return <div key={i} style={{position: 'absolute', left: x + Math.cos(angle) * dist - size / 2,
          top: y + Math.sin(angle) * dist - size / 2, width: size, height: size, borderRadius: '50%',
          background: i % 3 ? TEAL : MAGENTA, opacity: (1 - t) * 0.9,
          boxShadow: `inset -6px -8px 0 rgba(0,0,0,.18), inset 6px 6px 0 rgba(255,255,255,.35)`}} />;
      })}
    </>
  );
};

type Plan = {hook: number; s1: number; s2: number; s3: number; cta: number; frames: number};
// Scene lengths: each long enough for its voice line and for reading (1.2 s + 0.4 s per word).
const plan = (lines: VoiceLine[]): Plan => {
  const len = (i: number, min: number) => Math.max(min, Math.ceil(((lines[i]?.seconds ?? 0) + 0.45) * 30));
  const hook = 0;
  const s1 = hook + len(0, 84);
  const s2 = s1 + len(1, 130);
  const s3 = s2 + len(2, 117);
  const cta = s3 + len(3, 105);
  return {hook, s1, s2, s3, cta, frames: cta + len(4, 132)};
};

/** Where the cauldron stands in each scene: big and low in the hook, top-centre in the recipe, centre at the end. */
const cauldron = (frame: number, p: Plan) => {
  const keys = [0, p.s1 - 8, p.s1 + 6, p.cta - 8, p.cta + 8];
  return {
    y: interpolate(frame, keys, [1130, 1130, 670, 670, 590], clamp),
    size: interpolate(frame, keys, [1300, 1300, 1060, 1060, 1000], clamp),
  };
};

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const a = enter(frame, fps, -8);
  const b = enter(frame, fps, -3);
  return (
    <div style={{position: 'absolute', left: LEFT, top: 250, width: 940}}>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 900, fontSize: 150, lineHeight: 0.98, color: MILK,
        opacity: a, transform: `translateY(${(1 - a) * 60}px)`}}>Noyob<br />profil</div>
      <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 900, fontSize: 150, lineHeight: 1.05, color: TEAL,
        opacity: b, transform: `translateY(${(1 - b) * 60}px)`, textShadow: '0 0 50px rgba(63,224,200,.45)'}}>retsepti</div>
    </div>
  );
};

const Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const a = enter(frame, fps, 2);
  const b = enter(frame, fps, 32);
  const nudge = Math.sin(frame / 5) * 8;
  return (
    <div style={{position: 'absolute', left: LEFT, width: WIDTH, top: 1010}}>
      <div style={{opacity: a, transform: `translateY(${(1 - a) * 60}px)`}}>
        <Label text="Natija · kuniga" />
        <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 150, lineHeight: 1, color: TEAL,
          textShadow: '0 0 50px rgba(63,224,200,.4)'}}>750 so‘m</div>
      </div>
      <div style={{opacity: Math.min(1, b * 1.5), transform: `translateY(${(1 - b) * 40}px)`}}>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 20, marginTop: 34, padding: '14px 40px 14px 14px',
          borderRadius: 999, background: MILK, boxShadow: `0 0 0 4px ${TEAL}, 0 20px 50px rgba(0,0,0,.4)`}}>
          <Img src={staticFile('logo.png')} style={{width: 84, height: 84, borderRadius: '50%'}} />
          <span style={{fontFamily: BODY, fontWeight: 800, fontSize: 46, color: NIGHT}}>{BRAND.bot}</span>
        </div>
        <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 50, color: MILK, marginTop: 30,
          transform: `translateY(${-nudge}px)`}}>↑ Havola profilda</div>
      </div>
    </div>
  );
};

const Video: React.FC<{lines: VoiceLine[]}> = ({lines}) => {
  useFraunces();
  const gifts = useGifts([GIFT]);
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (!gifts) return null;
  const data: GiftData = gifts[0];
  const p = plan(lines);
  const pos = cauldron(frame, p);
  const rise = spring({frame: frame + 5, fps, config: {damping: 11, stiffness: 160, mass: 0.7}});
  const cuts = [p.s1, p.s2, p.s3, p.cta];
  const starts = [p.hook, p.s1, p.s2, p.s3, p.cta];
  return (
    <AbsoluteFill style={{background: NIGHT}}>
      <Night glowY={pos.y + pos.size * 0.2} />
      <Gift data={data} x={470} y={pos.y} size={pos.size * interpolate(rise, [0, 1], [0.5, 1])} opacity={Math.min(1, rise * 2)} glow={false} />
      {cuts.map((at) => <Burst key={at} at={at - 6} x={470} y={pos.y - pos.size * 0.12} />)}

      <Sequence from={0} durationInFrames={p.s1}><Hook /></Sequence>
      <Sequence from={p.s1} durationInFrames={p.s2 - p.s1}>
        <Step num="1" label="Ingrediyent" big={<>Bitta noyob gift</>} tagAt={30} length={p.s2 - p.s1}
          tag={<>Hex Pot · atigi 2,5%</>} />
      </Sequence>
      <Sequence from={p.s2} durationInFrames={p.s3 - p.s2}>
        <Step num="2" label="Muddat" big={<>3–30 kun</>} tagAt={30} length={p.s3 - p.s2} tag={<>30 kunga −7%</>} />
      </Sequence>
      <Sequence from={p.s3} durationInFrames={p.cta - p.s3}>
        <Step num="3" label="Aralashtiring" big={<>Gift <span style={{color: TEAL}}>profilingizda</span></>}
          tagAt={30} length={p.cta - p.s3} tag={<>ko‘rinib turadi</>} />
      </Sequence>
      <Sequence from={p.cta}><Closing /></Sequence>

      <Audio src={staticFile(`audio/bed_${ID}.wav`)}
        volume={(f) => interpolate(f, [0, 6, p.frames - 24, p.frames - 1], [0, 0.22, 0.22, 0], clamp)} />
      {lines.map((line, i) => (
        <Sequence key={line.file} from={starts[i] + (i === 0 ? 6 : 4)}><Audio src={staticFile(line.file)} volume={1} /></Sequence>
      ))}
      <Sequence from={0}><Audio src={staticFile('audio/bubble.wav')} volume={0.4} /></Sequence>
      {cuts.map((at) => <Sequence key={at} from={at - 6}><Audio src={staticFile('audio/bubble.wav')} volume={0.3} /></Sequence>)}
    </AbsoluteFill>
  );
};

const Cover: React.FC = () => {
  useFraunces();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  return (
    <AbsoluteFill style={{background: NIGHT}}>
      <Night glowY={1250} />
      <div style={{position: 'absolute', left: LEFT, top: 250, width: 940, fontFamily: SERIF, fontStyle: 'italic', fontWeight: 900,
        fontSize: 170, lineHeight: 0.98, color: MILK}}>
        Noyob<br />profil<br /><span style={{color: TEAL, textShadow: '0 0 50px rgba(63,224,200,.45)'}}>retsepti</span>
      </div>
      <Gift data={gifts[0]} x={470} y={1200} size={1250} glow={false} />
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: (lines) => plan(lines).frames, voice: ID, Video, Cover};
export default video;
