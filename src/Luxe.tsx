import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BODY, BRAND, Cta, DISPLAY, Flash, Gift, H, Sparkles, W, clamp, useGifts} from './kit';

export const LUXE_FRAMES = 290;
const ON = 46; // the lights come on
const END = 192;
const SERIF = "'Playfair Display', serif";
const GOLD = `linear-gradient(180deg, #fff3cf 0%, ${BRAND.gold} 45%, #a8843e 100%)`;
export const money = (value: number) => Math.round(value).toString().replace(/\B(?=(\d{3})+$)/g, ' ');

/** Style D: black and gold. A silhouette, a "how much per day?" question, then the price counts up. */
export const Luxe: React.FC<{id: string; price: number; discount?: number}> = ({id, price, discount}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const gifts = useGifts([id]);
  if (!gifts) return null;
  const data = gifts[0];
  const {meta} = data;

  const on = spring({frame: frame - ON, fps, config: {damping: 10, stiffness: 120}});
  const lit = interpolate(frame, [ON - 1, ON + 3], [0, 1], clamp);
  const outro = spring({frame: frame - END, fps, config: {damping: 16, stiffness: 90}});
  const giftY = interpolate(outro, [0, 1], [700, 560]);
  const count = interpolate(frame, [ON + 22, ON + 58], [0, price], {...clamp, easing: Easing.out(Easing.cubic)});
  const priceIn = spring({frame: frame - ON - 20, fps, config: {damping: 12, stiffness: 150}});
  const tick = frame >= ON + 58 ? spring({frame: frame - ON - 58, fps, config: {damping: 6, stiffness: 240}}) : 0;
  const name = spring({frame: frame - ON - 8, fps, config: {damping: 14}});
  const badge = spring({frame: frame - ON - 84, fps, config: {damping: 10, stiffness: 160}});
  const sweep = interpolate(frame % 120, [0, 120], [-60, 160]);
  const ask = interpolate(frame, [ON - 6, ON], [1, 0], clamp);
  const pulse = 1 + Math.sin(frame / 4) * 0.02 * (1 - lit);

  return (
    <AbsoluteFill style={{background: '#0a0907'}}>
      <AbsoluteFill style={{opacity: 0.25 + lit * 0.75, background:
        `radial-gradient(ellipse 80% 42% at 50% ${(giftY / H) * 100}%, rgba(237,206,144,.42) 0%, rgba(120,90,40,.16) 45%, transparent 75%)`}} />
      <AbsoluteFill style={{background:
        `linear-gradient(115deg, transparent ${sweep - 14}%, rgba(255,240,200,.09) ${sweep}%, transparent ${sweep + 14}%)`}} />
      <Sparkles seed={'luxe' + id} color={BRAND.gold} count={22} opacity={0.3 + lit * 0.7} />
      {/* Thin gold frame */}
      <div style={{position: 'absolute', left: 44, top: 44, right: 44, bottom: 44, borderRadius: 46,
        border: '2px solid rgba(237,206,144,.38)'}} />
      <div style={{position: 'absolute', left: 60, top: 60, right: 60, bottom: 60, borderRadius: 34,
        border: '1px solid rgba(237,206,144,.16)'}} />
      {/* Pedestal glow */}
      <div style={{position: 'absolute', left: W / 2 - 330, top: giftY + 300, width: 660, height: 90, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(237,206,144,.7) 0%, transparent 70%)', opacity: lit * (1 - outro), filter: 'blur(14px)'}} />

      {/* Silhouette before the reveal, the real gift after */}
      <div style={{filter: lit < 1 ? `brightness(${lit}) drop-shadow(0 0 ${22 * (1 - lit)}px rgba(237,206,144,.9))` : undefined}}>
        <Gift data={data} y={giftY} size={760} glow={false}
          scale={(frame < ON ? 0.9 * pulse : 0.9 + on * 0.1) * (1 - outro * 0.22)} />
      </div>

      {/* The question */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 1150, textAlign: 'center', opacity: ask}}>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 78, color: BRAND.gold,
          opacity: interpolate(frame, [2, 10], [0, 1], clamp), transform: `translateY(${interpolate(frame, [2, 12], [30, 0], clamp)}px)`}}>
          Bu gift kuniga
        </div>
        <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 150, color: '#fff', lineHeight: 1.1,
          transform: `scale(${spring({frame: frame - 12, fps, config: {damping: 9, stiffness: 190}})})`}}>
          QANCHA?
        </div>
      </div>

      {/* The answer */}
      {frame >= ON && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1090, textAlign: 'center', opacity: 1 - outro,
          transform: `translateY(${outro * 80}px)`}}>
          <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 74, color: '#fff', opacity: name,
            transform: `translateY(${(1 - name) * 30}px)`}}>
            {meta.title} <span style={{color: 'rgba(237,206,144,.75)', fontSize: 48}}>#{meta.number}</span>
          </div>
          <div style={{marginTop: 26, opacity: Math.min(1, priceIn * 1.4), transform: `scale(${0.7 + priceIn * 0.3 + tick * 0.04})`}}>
            <span style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 196, lineHeight: 1, backgroundImage: GOLD,
              WebkitBackgroundClip: 'text', color: 'transparent'}}>{money(count)}</span>
            <span style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 64, color: BRAND.gold, marginLeft: 18}}>so‘m</span>
          </div>
          <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 48, letterSpacing: 10, textTransform: 'uppercase',
            color: 'rgba(255,255,255,.8)', marginTop: 8, opacity: priceIn}}>kuniga</div>
          {discount ? (
            <div style={{display: 'inline-block', marginTop: 44, padding: '16px 40px', borderRadius: 999, fontFamily: BODY,
              fontWeight: 800, fontSize: 44, color: BRAND.ink, backgroundImage: GOLD, opacity: Math.min(1, badge * 1.4),
              transform: `scale(${badge}) rotate(${(1 - badge) * -8}deg)`}}>
              30 kunga −{discount}% chegirma
            </div>
          ) : null}
        </div>
      )}

      {frame >= END && <Cta at={END + 4} y={920} />}
      <Flash at={ON} color="#fff1c9" length={14} />

      <Audio src={staticFile('audio/bed_cinematic.wav')} volume={(f) => interpolate(f, [0, ON, ON + 6, 260, 289], [0.2, 0.25, 0.75, 0.75, 0], clamp)} />
      <Audio src={staticFile('audio/riser.wav')} volume={0.45} />
      <Sequence from={ON - 1}><Audio src={staticFile('audio/impact.wav')} volume={0.9} /></Sequence>
      <Sequence from={ON + 58}><Audio src={staticFile('audio/pop.wav')} volume={0.7} /></Sequence>
      {discount ? <Sequence from={ON + 84}><Audio src={staticFile('audio/pop.wav')} volume={0.5} /></Sequence> : null}
      <Sequence from={END - 4}><Audio src={staticFile('audio/whoosh.wav')} volume={0.55} /></Sequence>
    </AbsoluteFill>
  );
};
