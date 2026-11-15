import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BODY, Backdrop, Chip, Cta, DISPLAY, Flash, Gift, Rays, Ring, Slam, Sparkles, clamp, lighten, useGifts} from './kit';

export const SHOWCASE_FRAMES = 300;
const HIT = 46; // the reveal lands here
const END = 196; // details leave, call to action begins

/** Style A: blurred tease with a bold hook, hard reveal, rarity details, call to action. */
export const Showcase: React.FC<{id: string; hook: string[]}> = ({id, hook}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const gifts = useGifts([id]);
  if (!gifts) return null;
  const data = gifts[0];
  const {meta} = data;
  const tint = lighten(meta.colors.center, 0.55);

  const reveal = spring({frame: frame - HIT, fps, config: {damping: 9, stiffness: 120, mass: 0.8}});
  const outro = spring({frame: frame - END, fps, config: {damping: 16, stiffness: 90}});
  const blur = interpolate(frame, [0, HIT - 6, HIT + 2], [34, 26, 0], clamp);
  const teaseScale = interpolate(frame, [0, HIT], [1.75, 1.45], clamp);
  const scale = (frame < HIT ? teaseScale : interpolate(reveal, [0, 1], [1.45, 1])) * (1 - outro * 0.2)
    * (1 + Math.max(0, frame - HIT) * 0.00035);
  const giftY = interpolate(outro, [0, 1], [690, 560]);
  const dim = interpolate(frame, [0, HIT - 2, HIT + 4], [0.5, 0.45, 0], clamp);
  const title = spring({frame: frame - HIT - 10, fps, config: {damping: 14}}) * (1 - outro);
  const shake = frame >= HIT && frame < HIT + 10 ? Math.sin(frame * 2.4) * (HIT + 10 - frame) * 1.4 : 0;

  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: `translate(${shake}px, ${-shake * 0.6}px) scale(1.03)`}}>
        <Backdrop data={data} cy={giftY / 1920} dim={dim} />
        {frame >= HIT && <Rays y={giftY} opacity={0.55 * Math.min(1, reveal)} />}
        <Sparkles seed={id} opacity={frame >= HIT ? 1 : 0.3} color={tint} />
        <Ring at={HIT} y={giftY} />
        <Ring at={HIT + 5} y={giftY} color={tint} />
        <Gift data={data} y={giftY} size={800} scale={scale} blur={blur}
          rotate={frame < HIT ? interpolate(frame, [0, HIT], [-7, 0]) : 0} />
      </AbsoluteFill>

      <Slam lines={hook} at={2} stagger={5} size={100} y={1130} out={HIT - 5} />

      <div style={{position: 'absolute', left: 0, right: 0, top: 1085, textAlign: 'center', opacity: Math.min(1, title * 1.3),
        transform: `translateY(${(1 - title) * 50}px)`}}>
        <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 82, color: '#fff',
          textShadow: '0 6px 0 rgba(0,0,0,.25), 0 18px 44px rgba(0,0,0,.45)'}}>{meta.title}</div>
        <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 44, color: tint, marginTop: 4, letterSpacing: 2}}>
          #{meta.number}
        </div>
      </div>
      {frame < END + 12 && (
        <div style={{opacity: 1 - outro, transform: `translateY(${outro * 90}px)`}}>
          <Chip at={HIT + 34} y={1250} label="Model" value={meta.model.name} rarity={meta.model.rarity} tint={tint} />
          <Chip at={HIT + 50} y={1374} label="Fon" value={meta.backdrop.name} rarity={meta.backdrop.rarity} tint={tint} from={-1} />
          <Chip at={HIT + 66} y={1498} label="Naqsh" value={meta.symbol.name} rarity={meta.symbol.rarity} tint={tint} />
        </div>
      )}

      {frame >= END && <Cta at={END + 4} y={920} />}
      <Flash at={HIT} />

      <Audio src={staticFile('audio/bed_cinematic.wav')} volume={(f) => interpolate(f, [0, HIT, HIT + 6, 270, 299], [0.25, 0.3, 0.75, 0.75, 0], clamp)} />
      <Audio src={staticFile('audio/riser.wav')} volume={0.5} />
      <Sequence from={HIT - 1}><Audio src={staticFile('audio/impact.wav')} volume={0.95} /></Sequence>
      {[34, 50, 66].map((offset) => (
        <Sequence key={offset} from={HIT + offset}><Audio src={staticFile('audio/pop.wav')} volume={0.5} /></Sequence>
      ))}
      <Sequence from={END - 4}><Audio src={staticFile('audio/whoosh.wav')} volume={0.6} /></Sequence>
    </AbsoluteFill>
  );
};
