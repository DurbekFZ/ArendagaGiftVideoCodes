import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BODY, BRAND, Backdrop, Cta, DISPLAY, Gift, Rays, Sparkles, W, clamp, darken, lighten, useGifts} from './kit';

export const STEPS_FRAMES = 300;
const STARTS = [34, 78, 122];
const BURST = 184;
const PAPER = '#f4efe6';

/** Style F: light and editorial. Three steps, then the gift's colour takes over the screen. */
export const Steps: React.FC<{id: string; steps: string[]}> = ({id, steps}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const gifts = useGifts([id]);
  if (!gifts) return null;
  const data = gifts[0];
  const {center, edge} = data.meta.colors;
  const tint = lighten(center, 0.55);
  const head = spring({frame: frame - 2, fps, config: {damping: 11, stiffness: 170}});
  const blob = spring({frame: frame - 6, fps, config: {damping: 12, stiffness: 110}});
  const burst = spring({frame: frame - BURST, fps, config: {damping: 18, stiffness: 80}});
  const active = STARTS.filter((start) => frame >= start).length - 1;
  const wobble = Math.sin(frame / 22) * 14;

  return (
    <AbsoluteFill style={{background: PAPER}}>
      {/* Paper grid */}
      <AbsoluteFill style={{opacity: 0.5, backgroundImage:
        'linear-gradient(rgba(18,20,22,.06) 2px, transparent 2px), linear-gradient(90deg, rgba(18,20,22,.06) 2px, transparent 2px)',
        backgroundSize: '90px 90px'}} />
      <div style={{position: 'absolute', left: 70, top: 230, fontFamily: DISPLAY, fontWeight: 900, fontSize: 110, lineHeight: 1.02,
        color: BRAND.ink, transform: `translateX(${(1 - head) * -500}px)`}}>
        3 QADAMDA
        <div style={{fontSize: 56, fontWeight: 700, color: darken(edge, 0.15), marginTop: 12}}>NFT gift ijarasi</div>
      </div>
      {/* Gift on a coloured blob with an offset outline */}
      <div style={{position: 'absolute', left: W / 2 - 300 + 150, top: 520, width: 600, height: 600, borderRadius: '50%',
        border: `6px solid ${BRAND.ink}`, transform: `translate(${22 + wobble * 0.4}px, ${22}px) scale(${blob})`}} />
      <div style={{position: 'absolute', left: W / 2 - 300 + 150, top: 520, width: 600, height: 600, borderRadius: '50%',
        background: `radial-gradient(circle at 40% 35%, ${lighten(center, 0.2)}, ${edge})`, transform: `scale(${blob})`}} />
      <Gift data={data} x={W / 2 + 150} y={820} size={520} scale={blob} rotate={wobble * 0.3} />

      {steps.map((text, i) => {
        const s = spring({frame: frame - STARTS[i], fps, config: {damping: 12, stiffness: 170, mass: 0.7}});
        const on = i === active;
        return (
          <div key={i} style={{position: 'absolute', left: 70, right: 70, top: 1190 + i * 142, height: 120, display: 'flex',
            alignItems: 'center', gap: 28, padding: '0 28px', borderRadius: 34, opacity: Math.min(1, s * 1.5),
            transform: `translateX(${(1 - s) * -360}px) scale(${on ? 1.03 : 0.97})`,
            background: on ? BRAND.ink : 'rgba(18,20,22,.07)', border: `4px solid ${BRAND.ink}`,
            boxShadow: on ? `12px 12px 0 ${edge}` : 'none'}}>
            <div style={{width: 76, height: 76, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontFamily: DISPLAY, fontWeight: 900, fontSize: 40,
              background: on ? BRAND.gold : BRAND.ink, color: on ? BRAND.ink : PAPER}}>{i + 1}</div>
            <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 52, color: on ? PAPER : BRAND.ink}}>{text}</div>
          </div>
        );
      })}

      {/* The gift's colour floods the page for the closing scene */}
      {frame >= BURST && (
        <AbsoluteFill style={{clipPath: `circle(${burst * 135}% at 64% 43%)`}}>
          <Backdrop data={data} cy={0.3} />
          <Rays y={580} opacity={0.45} />
          <Sparkles seed={'steps' + id} color={tint} count={26} />
          <Gift data={data} y={580} size={640} scale={0.8 + burst * 0.2} />
          <Cta at={BURST + 10} y={960} />
        </AbsoluteFill>
      )}

      <Audio src={staticFile('audio/bed_bright.wav')} volume={(f) => interpolate(f, [0, 8, STEPS_FRAMES - 30, STEPS_FRAMES - 1], [0, 0.6, 0.6, 0], clamp)} />
      {STARTS.map((start) => (
        <Sequence key={start} from={start}><Audio src={staticFile('audio/pop.wav')} volume={0.7} /></Sequence>
      ))}
      <Sequence from={BURST - 5}><Audio src={staticFile('audio/whoosh.wav')} volume={0.6} /></Sequence>
      <Sequence from={BURST + 2}><Audio src={staticFile('audio/impact.wav')} volume={0.5} /></Sequence>
    </AbsoluteFill>
  );
};
