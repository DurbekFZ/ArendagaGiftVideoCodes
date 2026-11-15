import {Lottie} from '@remotion/lottie';
import React from 'react';
import {AbsoluteFill, Audio, Freeze, Img, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BODY, BRAND, GiftData, H, W, clamp, useGifts} from '../kit';
import type {CustomVideo, VoiceLine} from './registry';

// "Makro": a jeweller's close-up of one gift, narrated, ending in a slow pull-back.
const GIFT = 'moonpendant-95850';
const ID = 'V20261116b';
const SERIF = "'Playfair Display', serif";
const NAVY = '#0a1330';
const SAPPHIRE = '#2f58b8';
const CREAM = '#f6ead2';
const GOLD = BRAND.gold;
const LEAD = 8;
const GAP = 6;
const TAIL = 30;
const LEFT = 76; // lower-half text stays between x = 76 and x = 870

const starts = (lines: VoiceLine[], fps: number) => {
  let cursor = LEAD;
  return lines.map((line) => {
    const at = cursor;
    cursor += Math.round(line.seconds * fps) + GAP;
    return at;
  });
};
const total = (lines: VoiceLine[]) => {
  if (!lines.length) return 300;
  const at = starts(lines, 30);
  return at[at.length - 1] + Math.round(lines[lines.length - 1].seconds * 30) + TAIL;
};

/** The pendant drawn at an exact moment of its own animation: a 180-frame loop whose frames 135-172 face the viewer. */
const Pendant: React.FC<{data: GiftData; pose: number; left: number; top: number; size: number; shadow?: boolean}> =
  ({data, pose, left, top, size, shadow = true}) => (
    <div style={{position: 'absolute', left, top, width: size, height: size,
      filter: shadow ? 'drop-shadow(0 40px 60px rgba(4,8,26,.55))' : undefined}}>
      <Freeze frame={pose}>
        <Lottie animationData={data.gift} loop style={{width: size, height: size}} />
      </Freeze>
    </div>
  );

const Sapphire: React.FC<{glowY?: number; glow?: number}> = ({glowY = 0.44, glow = 1}) => (
  <AbsoluteFill style={{background: NAVY}}>
    <AbsoluteFill style={{opacity: glow, background:
      `radial-gradient(ellipse 110% 60% at 50% ${glowY * 100}%, #6f9fe0 0%, ${SAPPHIRE} 36%, #16296a 68%, ${NAVY} 100%)`}} />
  </AbsoluteFill>
);

const Bokeh: React.FC<{count?: number; opacity?: number}> = ({count = 14, opacity = 1}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity}}>
      {Array.from({length: count}, (_, i) => {
        const r = (key: string) => random(`bokeh-${i}-${key}`);
        const size = 70 + r('s') * 190;
        const x = r('x') * W + Math.sin(frame / (50 + r('a') * 60) + i) * 60;
        const y = ((r('y') * H - frame * (0.4 + r('v') * 0.9)) % (H + 300) + H + 300) % (H + 300) - 150;
        return (
          <div key={i} style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size,
            borderRadius: '50%', filter: `blur(${10 + r('b') * 16}px)`, opacity: 0.1 + r('o') * 0.2,
            background: i % 3 === 0 ? CREAM : GOLD}} />
        );
      })}
    </AbsoluteFill>
  );
};

const Label: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 30, letterSpacing: 9, textTransform: 'uppercase', color: GOLD,
    display: 'flex', alignItems: 'center', gap: 20}}>
    <span style={{width: 64, height: 3, background: GOLD, display: 'inline-block'}} />{children}
  </div>
);

/** A caption block that rises in at `at` and fades before `until`. */
const Lines: React.FC<{at: number; until: number; top: number; label: string; children: React.ReactNode}> =
  ({at, until, top, label, children}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();
    const enter = spring({frame: frame - at - 4, fps, config: {damping: 18, stiffness: 90}});
    const exit = interpolate(frame, [until - 8, until - 1], [1, 0], clamp);
    if (frame < at || frame >= until) return null;
    return (
      <div style={{position: 'absolute', left: LEFT, width: 800, top, opacity: Math.min(1, enter * 1.4) * exit,
        transform: `translateY(${(1 - enter) * 44}px)`}}>
        <Label>{label}</Label>
        <div style={{fontFamily: SERIF, fontWeight: 700, fontStyle: 'italic', fontSize: 104, lineHeight: 1.08, color: CREAM,
          marginTop: 22, textShadow: '0 6px 34px rgba(4,8,26,.75)'}}>{children}</div>
      </div>
    );
  };

type Shot = {from: number; to: number; fx: number; fy: number; zoom: number; dx: number; dy: number};

const Video: React.FC<{lines: VoiceLine[]}> = ({lines}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const gifts = useGifts([GIFT]);
  if (!gifts || lines.length < 5) return null;
  const data = gifts[0];
  const at = starts(lines, fps);
  const end = total(lines);
  const pull = at[2] - 4; // "Uni sotib olish shart emas."
  const cta = at[3] - 4;
  const middle = at[1] + Math.round(lines[1].seconds * fps * 0.44);

  // Three close-ups: ruby crescent, ruby star, the gold ring and cord.
  const shots: Shot[] = [
    {from: 0, to: at[1] - 3, fx: 0.415, fy: 0.5, zoom: 3.5, dx: 0.5, dy: 0.35},
    {from: at[1] - 3, to: middle, fx: 0.62, fy: 0.535, zoom: 4.1, dx: -0.55, dy: -0.2},
    {from: middle, to: pull, fx: 0.5, fy: 0.42, zoom: 1.9, dx: 0, dy: 0.5},
  ];
  const shot = shots.find((candidate) => frame < candidate.to) ?? shots[2];
  const macroPose = 137 + Math.min(frame, pull) * 0.12; // slow turn inside the window that faces the viewer

  // Pull-back: from the last close-up to the whole pendant, then it lifts for the closing lines.
  const back = spring({frame: frame - pull, fps, config: {damping: 20, stiffness: 46, mass: 1.1}});
  const lift = spring({frame: frame - cta, fps, config: {damping: 18, stiffness: 70}});
  const last = shots[2];
  const local = Math.min(frame, pull) - last.from;
  const wholeSize = interpolate(lift, [0, 1], [820, 660]);
  const wholeX = W / 2;
  const wholeY = interpolate(lift, [0, 1], [760, 590]);

  let size: number, left: number, top: number;
  if (frame < pull) {
    const t = frame - shot.from;
    size = 900 * shot.zoom * (1 + t * 0.0009);
    left = W / 2 - shot.fx * size + shot.dx * t;
    top = (shot === last ? 640 : 860) - shot.fy * size + shot.dy * t;
  } else {
    const fromSize = 900 * last.zoom * (1 + local * 0.0009);
    const fromLeft = W / 2 - last.fx * fromSize + last.dx * local;
    const fromTop = 640 - last.fy * fromSize + last.dy * local;
    size = interpolate(back, [0, 1], [fromSize, wholeSize]);
    left = interpolate(back, [0, 1], [fromLeft, wholeX - wholeSize / 2]);
    top = interpolate(back, [0, 1], [fromTop, wholeY - wholeSize / 2 + Math.sin(frame / 20) * 8]);
  }
  // After the pull-back starts the pendant makes one full turn, then settles facing the viewer again.
  const turn = 317 - macroPose;
  const since = frame - pull;
  const pose = frame < pull ? macroPose : macroPose + Math.min(since * 1.7, turn) + Math.max(0, since - turn / 1.7) * 0.1;
  const cut = Math.min(...shots.slice(1).map((s) => Math.abs(frame - s.from)));

  const closing = (delay: number) => spring({frame: frame - cta - delay, fps, config: {damping: 16, stiffness: 90}});

  return (
    <AbsoluteFill style={{background: NAVY}}>
      <Sapphire glowY={frame < pull ? 0.44 : wholeY / H} />
      <Bokeh opacity={0.55} count={8} />
      <Pendant data={data} pose={pose} left={left} top={top} size={size} />
      <Bokeh opacity={frame < pull ? 1 : 1 - back * 0.5} />
      {/* Light sweeping across the metal */}
      <AbsoluteFill style={{mixBlendMode: 'soft-light', background:
        `linear-gradient(112deg, transparent ${(frame * 1.1) % 190 - 40}%, rgba(255,246,214,.5) ${(frame * 1.1) % 190 - 25}%, transparent ${(frame * 1.1) % 190 - 10}%)`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 90% 70% at 50% 45%, transparent 55%, rgba(4,8,26,.72) 100%)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(4,8,26,.5) 0%, transparent 16%, transparent 44%, rgba(4,8,26,.9) 74%)'}} />
      {/* Soft cut between close-ups */}
      <AbsoluteFill style={{background: CREAM, opacity: frame < pull ? interpolate(cut, [0, 5], [0.5, 0], clamp) : 0}} />

      <div style={{position: 'absolute', left: LEFT, top: 250, opacity: interpolate(frame, [4, 18, cta - 10, cta], [0, 1, 1, 0], clamp)}}>
        <Label>Moon Pendant · #{data.meta.number}</Label>
      </div>

      <Lines at={2} until={shots[0].to} top={1150} label="Yaqindan qarang">Bu shunchaki<br />bezak emas</Lines>
      <Lines at={shots[1].from} until={shots[1].to} top={1150} label="Model">Ruby Core:<br />yoqut yarim oy</Lines>
      <Lines at={shots[2].from} until={pull} top={1090} label="Noyoblik">
        <span style={{fontStyle: 'normal', fontSize: 230, color: GOLD, lineHeight: 0.92}}>3%</span>
        <div style={{fontSize: 72}}>giftdagina bor</div>
      </Lines>
      <Lines at={pull + 12} until={cta} top={1240} label="Xushxabar">Sotib olish<br />shart emas</Lines>

      {frame >= cta && (
        <div style={{position: 'absolute', left: LEFT, width: 800, top: 1010}}>
          <div style={{opacity: closing(4), transform: `translateY(${(1 - closing(4)) * 40}px)`}}><Label>Ijaraga oling</Label></div>
          <div style={{fontFamily: SERIF, fontWeight: 700, fontStyle: 'italic', fontSize: 80, color: CREAM, marginTop: 20,
            opacity: closing(10), transform: `translateY(${(1 - closing(10)) * 40}px)`}}>kuniga</div>
          <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 168, lineHeight: 1, color: GOLD, marginTop: -6,
            opacity: closing(16), transform: `translateY(${(1 - closing(16)) * 40}px)`}}>
            750 <span style={{fontSize: 84, fontStyle: 'italic'}}>so‘m</span>
          </div>
          <div style={{fontFamily: BODY, fontWeight: 500, fontSize: 40, color: 'rgba(246,234,210,.82)', marginTop: 14,
            opacity: closing(24)}}>3 kundan 30 kungacha</div>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 20, marginTop: 34, padding: '14px 38px 14px 16px',
            borderRadius: 999, border: `2px solid ${GOLD}`, background: 'rgba(10,19,48,.6)',
            opacity: closing(34), transform: `translateY(${(1 - closing(34)) * 30}px)`}}>
            <Img src={staticFile('logo.png')} style={{width: 78, height: 78, borderRadius: '50%', background: NAVY}} />
            <span style={{fontFamily: BODY, fontWeight: 800, fontSize: 44, color: CREAM}}>{BRAND.bot}</span>
          </div>
          <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 36, letterSpacing: 4, textTransform: 'uppercase', color: GOLD,
            marginTop: 26, opacity: closing(46)}}>↑ Havola profilda</div>
        </div>
      )}

      <Audio src={staticFile(`audio/bed_${ID}.wav`)} volume={(f) => interpolate(f, [0, 12, end - 30, end - 1], [0, 0.42, 0.42, 0], clamp)} />
      {lines.map((line, i) => (
        <Sequence key={line.file} from={at[i]}><Audio src={staticFile(line.file)} volume={1} /></Sequence>
      ))}
      {shots.slice(1).map((s) => (
        <Sequence key={s.from} from={Math.max(0, s.from - 6)}><Audio src={staticFile('audio/whoosh.wav')} volume={0.28} /></Sequence>
      ))}
      <Sequence from={Math.max(0, pull - 30)}><Audio src={staticFile('audio/riser.wav')} volume={0.22} /></Sequence>
    </AbsoluteFill>
  );
};

const Cover: React.FC = () => {
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  return (
    <AbsoluteFill style={{background: NAVY}}>
      <Sapphire glowY={0.36} />
      <Bokeh opacity={0.8} />
      <Pendant data={gifts[0]} pose={150} left={W / 2 - 470} top={220} size={940} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(4,8,26,.35) 0%, transparent 18%, transparent 52%, rgba(4,8,26,.86) 80%)'}} />
      <div style={{position: 'absolute', left: LEFT, width: 800, top: 1150}}>
        <Label>Moon Pendant</Label>
        <div style={{fontFamily: SERIF, fontWeight: 700, fontStyle: 'italic', fontSize: 118, lineHeight: 1.06, color: CREAM, marginTop: 22}}>
          Shunchaki<br />bezak <span style={{color: GOLD}}>emas</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: total, voice: ID, Video, Cover};
export default video;
