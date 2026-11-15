import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BODY, BRAND, Backdrop, Cta, DISPLAY, Flash, Gift, Rays, Sparkles, W, clamp, lighten, useGifts} from './kit';

export type VoiceLine = {file: string; text: string; seconds: number};
const LEAD = 10; // frames before the first spoken line
const GAP = 7; // frames of breath between lines
const TAIL = 40;
const DROP = 10; // the gift lands on the profile here

export const lineStarts = (lines: VoiceLine[], fps: number) => {
  let cursor = LEAD;
  return lines.map((line) => {
    const start = cursor;
    cursor += Math.round(line.seconds * fps) + GAP;
    return start;
  });
};
export const profileFrames = (lines: VoiceLine[], fps: number) => {
  const starts = lineStarts(lines, fps);
  const last = lines.length - 1;
  return starts[last] + Math.round(lines[last].seconds * fps) + TAIL;
};

const Caption: React.FC<{line: VoiceLine; frames: number; y: number}> = ({line, frames, y}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const words = line.text.split(' ');
  const total = words.reduce((sum, word) => sum + word.length + 1, 0);
  let seen = 0;
  const leave = interpolate(frame, [frames, frames + 6], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: y, textAlign: 'center', fontFamily: BODY,
      fontWeight: 800, fontSize: 68, lineHeight: 1.22, opacity: leave}}>
      {words.map((word, i) => {
        const at = (seen / total) * frames * 0.92;
        seen += word.length + 1;
        const s = spring({frame: frame - at, fps, config: {damping: 13, stiffness: 200, mass: 0.5}});
        const active = frame >= at && frame < ((seen / total) * frames * 0.92);
        return (
          <span key={i} style={{display: 'inline-block', margin: '0 0.13em', opacity: 0.25 + Math.min(1, s) * 0.75,
            transform: `translateY(${(1 - s) * 18}px) scale(${active ? 1.08 : 1})`,
            color: active ? BRAND.gold : '#fff', textShadow: '0 4px 0 rgba(0,0,0,.35), 0 12px 30px rgba(0,0,0,.6)'}}>
            {word}
          </span>
        );
      })}
    </div>
  );
};

const Row: React.FC<{y: number; width: number; tone: string}> = ({y, width, tone}) => (
  <div style={{position: 'absolute', left: 70, right: 70, top: y, height: 104, borderRadius: 28, background: tone,
    display: 'flex', alignItems: 'center', padding: '0 30px', gap: 24}}>
    <div style={{width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,.16)'}} />
    <div style={{width, height: 22, borderRadius: 11, background: 'rgba(255,255,255,.2)'}} />
  </div>
);

/** Style B (voiced): a plain profile turns into a collector's profile when the gift lands. */
export const Profile: React.FC<{id: string; lines: VoiceLine[]}> = ({id, lines}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const gifts = useGifts([id]);
  if (!gifts) return null;
  const data = gifts[0];
  const tint = lighten(data.meta.colors.center, 0.55);
  const starts = lineStarts(lines, fps);
  const cta = starts[lines.length - 1];

  const land = spring({frame: frame - DROP, fps, config: {damping: 10, stiffness: 110, mass: 0.9}});
  const flood = interpolate(frame, [DROP + 2, DROP + 22], [0, 150], clamp);
  const giftY = interpolate(land, [0, 1], [-420, 470]);
  const end = spring({frame: frame - cta, fps, config: {damping: 16, stiffness: 90}});
  const strike = interpolate(frame, [starts[1] + 14, starts[1] + 30], [0, 1], clamp);
  const cardTone = 'rgba(14,16,20,.44)';

  return (
    <AbsoluteFill style={{background: '#16181c'}}>
      {/* Before: a plain, grey profile */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, #2a2e35 0%, #16181c 55%)'}} />
      {/* After: the gift's colours flood the profile from where it landed */}
      <AbsoluteFill style={{clipPath: `circle(${flood}% at 50% 25%)`}}>
        <Backdrop data={data} cy={0.26} />
        <Rays y={470} opacity={0.42} />
        <Sparkles seed={id} color={tint} count={26} />
      </AbsoluteFill>

      <div style={{opacity: 1 - end, transform: `translateY(${-end * 120}px) scale(${1 - end * 0.06})`}}>
        <Gift data={data} y={giftY} size={620} scale={0.6 + land * 0.4} rotate={(1 - land) * -24} />
        {/* Avatar and name */}
        <div style={{position: 'absolute', left: W / 2 - 105, top: 800, width: 210, height: 210, borderRadius: '50%',
          background: 'linear-gradient(160deg, #8d96a3, #596270)', overflow: 'hidden',
          boxShadow: `0 0 0 ${8 * land}px ${tint}, 0 20px 50px rgba(0,0,0,.4)`}}>
          <div style={{position: 'absolute', left: 65, top: 40, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.75)'}} />
          <div style={{position: 'absolute', left: 25, top: 135, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,.75)'}} />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1036, textAlign: 'center', fontFamily: DISPLAY,
          fontWeight: 700, fontSize: 54, color: '#fff', textShadow: '0 4px 20px rgba(0,0,0,.4)'}}>Sizning profilingiz</div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1112, textAlign: 'center', fontFamily: BODY,
          fontWeight: 500, fontSize: 36, color: 'rgba(255,255,255,.7)'}}>online</div>
        <Row y={1620} width={420} tone={cardTone} />
        <Row y={1744} width={300} tone={cardTone} />
      </div>

      {/* Line 2: buying is crossed out, renting is the answer */}
      {frame >= starts[1] && frame < starts[2] && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1196, display: 'flex', justifyContent: 'center', gap: 26,
          opacity: interpolate(frame, [starts[1], starts[1] + 6, starts[2] - 6, starts[2]], [0, 1, 1, 0], clamp)}}>
          <div style={{position: 'relative', fontFamily: DISPLAY, fontWeight: 700, fontSize: 40, color: 'rgba(255,255,255,.75)',
            padding: '16px 30px', borderRadius: 24, background: cardTone}}>
            Sotib olish
            <div style={{position: 'absolute', left: 14, top: '50%', height: 7, borderRadius: 4, background: '#ff5b5b',
              width: `calc(${strike * 100}% - 28px)`, transform: 'rotate(-6deg)'}} />
          </div>
          <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 40, color: BRAND.ink, padding: '16px 30px',
            borderRadius: 24, background: BRAND.gold, transform: `scale(${0.8 + strike * 0.24})`, opacity: 0.3 + strike * 0.7}}>
            Ijara ✓
          </div>
        </div>
      )}
      {/* Line 3: rental lengths */}
      {frame >= starts[2] && frame < cta && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1196, display: 'flex', justifyContent: 'center', gap: 22}}>
          {['3 kun', '7 kun', '14 kun', '30 kun'].map((label, i) => {
            const s = spring({frame: frame - starts[2] - 30 - i * 9, fps, config: {damping: 11, stiffness: 170}});
            return (
              <div key={label} style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 36, padding: '16px 24px', borderRadius: 24,
                color: i === 3 ? BRAND.ink : '#fff', background: i === 3 ? BRAND.gold : cardTone,
                border: '2px solid rgba(255,255,255,.22)', opacity: Math.min(1, s * 1.4), transform: `scale(${s})`}}>{label}</div>
            );
          })}
        </div>
      )}

      {lines.slice(0, -1).map((line, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={Math.round(line.seconds * fps) + GAP} layout="none">
          <Caption line={line} frames={Math.round(line.seconds * fps)} y={1320} />
        </Sequence>
      ))}
      <Sequence from={cta} layout="none">
        <Gift data={data} y={560} size={600} scale={end} />
        <Cta at={2} y={980} />
      </Sequence>
      <Flash at={DROP + 6} length={10} color={tint} />

      <Audio src={staticFile('audio/bed_bright.wav')} volume={(f) => interpolate(f, [0, 10, cta + 30, cta + 80], [0, 0.2, 0.2, 0.5], clamp)} />
      <Sequence from={DROP - 8}><Audio src={staticFile('audio/whoosh.wav')} volume={0.5} /></Sequence>
      <Sequence from={DROP + 5}><Audio src={staticFile('audio/impact.wav')} volume={0.55} /></Sequence>
      {lines.map((line, i) => (
        <Sequence key={line.file} from={starts[i]}><Audio src={staticFile(line.file)} volume={1} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
