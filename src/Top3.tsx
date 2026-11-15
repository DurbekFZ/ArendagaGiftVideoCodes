import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BODY, BRAND, Backdrop, Cta, DISPLAY, Flash, Gift, GiftData, H, Rays, Slam, Sparkles, W, clamp, lighten, useGifts} from './kit';

const INTRO = 50;
const EACH = 78;
const OUTRO = 100;
export const TOP3_FRAMES = INTRO + EACH * 3 + OUTRO;

const Rank: React.FC<{data: GiftData; rank: number}> = ({data, rank}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {meta} = data;
  const tint = lighten(meta.colors.center, 0.55);
  const enter = spring({frame, fps, config: {damping: 13, stiffness: 130, mass: 0.7}});
  const text = spring({frame: frame - 10, fps, config: {damping: 13}});
  const rarity = meta.model.rarity ?? 0;
  const shown = interpolate(frame, [14, 38], [Math.min(100, rarity * 8), rarity], clamp);
  // Whip in from the right over the previous scene, with a touch of motion blur.
  const x = (1 - enter) * W;
  const smear = (1 - Math.min(1, enter)) * 26;
  return (
    <AbsoluteFill style={{transform: `translateX(${x}px)`, filter: smear > 0.5 ? `blur(${smear}px)` : undefined}}>
      <Backdrop data={data} cy={0.4} />
      <Rays y={H * 0.4} opacity={0.45} />
      <Sparkles seed={meta.id} color={tint} count={24} />
      <div style={{position: 'absolute', left: -20, top: 150, fontFamily: DISPLAY, fontWeight: 900, fontSize: 760, lineHeight: 1,
        color: 'transparent', WebkitTextStroke: '10px rgba(255,255,255,.3)',
        transform: `translateX(${(1 - enter) * -300}px) rotate(-6deg)`}}>{rank}</div>
      <Gift data={data} y={H * 0.4} size={760} scale={0.75 + enter * 0.25 + frame * 0.0006} />
      <div style={{position: 'absolute', left: 80, top: 250, fontFamily: DISPLAY, fontWeight: 900, fontSize: 64, color: BRAND.ink,
        background: BRAND.gold, padding: '10px 30px', borderRadius: 26, transform: `scale(${enter}) rotate(-4deg)`,
        boxShadow: '0 16px 40px rgba(0,0,0,.35)'}}>{rank}-o‘rin</div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1190, textAlign: 'center', opacity: Math.min(1, text * 1.3),
        transform: `translateY(${(1 - text) * 60}px)`}}>
        <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 84, color: '#fff',
          textShadow: '0 6px 0 rgba(0,0,0,.25), 0 18px 44px rgba(0,0,0,.45)'}}>{meta.title}</div>
        <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 46, color: 'rgba(255,255,255,.88)', marginTop: 12}}>
          Model: {meta.model.name}
        </div>
        <div style={{display: 'inline-flex', alignItems: 'baseline', gap: 18, marginTop: 30, padding: '14px 40px', borderRadius: 34,
          background: 'rgba(12,14,18,.5)', border: '2px solid rgba(255,255,255,.22)'}}>
          <span style={{fontFamily: BODY, fontWeight: 800, fontSize: 40, color: 'rgba(255,255,255,.75)'}}>faqat</span>
          <span style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 96, color: tint}}>{shown.toFixed(1)}%</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Style C: fast countdown of three gifts (ids ordered third, second, first place). */
export const Top3: React.FC<{ids: string[]; headline: string[]}> = ({ids, headline}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const gifts = useGifts(ids);
  if (!gifts) return null;
  const outro = INTRO + EACH * 3;
  const first = gifts[2];
  const fan = spring({frame: frame - outro - 4, fps, config: {damping: 12, stiffness: 110}});

  return (
    <AbsoluteFill style={{background: BRAND.ink}}>
      {/* Intro: all three teased behind the headline */}
      <Sequence durationInFrames={INTRO + 8}>
        <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, #3a2f1b 0%, ${BRAND.ink} 70%)`}} />
        <Sparkles seed="intro" color={BRAND.gold} />
        {gifts.map((data, i) => {
          const s = spring({frame: frame - 4 - i * 5, fps, config: {damping: 11, stiffness: 140}});
          return <Gift key={data.meta.id} data={data} x={W / 2 + (i - 1) * 330} y={620 + Math.abs(i - 1) * 60}
            size={i === 1 ? 470 : 380} scale={s} rotate={(i - 1) * 9} />;
        })}
        <Slam lines={headline} at={6} stagger={4} size={112} y={980} out={INTRO - 4} />
      </Sequence>

      {gifts.map((data, i) => (
        <Sequence key={data.meta.id} from={INTRO + i * EACH} durationInFrames={EACH + (i === 2 ? 0 : 14)}>
          <Rank data={data} rank={3 - i} />
        </Sequence>
      ))}

      <Sequence from={outro}>
        <Backdrop data={first} cy={0.3} />
        <Sparkles seed="outro" color={BRAND.gold} />
        {gifts.map((data, i) => (
          <Gift key={data.meta.id} data={data} x={W / 2 + (i - 1) * 320 * fan} y={600 - (i === 2 ? 0 : 0) + Math.abs(i - 1) * 50}
            size={i === 1 ? 460 : 370} scale={fan} rotate={(i - 1) * 9 * fan} />
        ))}
        <Cta at={8} y={960} headline={['Hammasi', '*ijarada*']} />
      </Sequence>
      {[INTRO, INTRO + EACH, INTRO + EACH * 2, outro].map((at) => <Flash key={at} at={at} length={7} />)}

      <Audio src={staticFile('audio/bed_drive.wav')} volume={(f) => interpolate(f, [0, 6, TOP3_FRAMES - 30, TOP3_FRAMES - 1], [0, 0.7, 0.7, 0], clamp)} />
      {[INTRO, INTRO + EACH, INTRO + EACH * 2, outro].map((at) => (
        <React.Fragment key={at}>
          <Sequence from={at - 7}><Audio src={staticFile('audio/whoosh.wav')} volume={0.6} /></Sequence>
          <Sequence from={at}><Audio src={staticFile('audio/impact.wav')} volume={0.5} /></Sequence>
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};
