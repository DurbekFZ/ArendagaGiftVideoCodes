import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BODY, BRAND, DISPLAY, Gift, H, W, clamp, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "Narxini top": a three-option quiz about a gift's daily rental price.
const GIFT = 'surgeboard-3194';
const OPTIONS = ['8 500 so‘m', '850 so‘m', '3 000 so‘m'];
const ANSWER = 1;
const VIOLET = '#5527d9';
const LIME = '#c8ff3d';
const INK = '#14101f';

const ASK = 24; // options start arriving
const COUNT = 78; // countdown starts
const REVEAL = 168;
const OUTRO = 222;
const FRAMES = 345;

const Stage: React.FC<{children?: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: VIOLET, overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: -400, transform: `rotate(-18deg) translateX(${(frame * 3) % 240}px)`,
        backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,.07) 0 120px, transparent 120px 240px)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 34%, rgba(255,255,255,.22) 0%, transparent 52%)'}} />
      {children}
    </AbsoluteFill>
  );
};

const Title: React.FC<{scale?: number}> = ({scale = 1}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: 236, textAlign: 'center', transform: `scale(${scale}) rotate(-3deg)`}}>
    <span style={{display: 'inline-block', fontFamily: DISPLAY, fontWeight: 900, fontSize: 98, lineHeight: 1, color: INK,
      background: LIME, padding: '22px 44px 26px', borderRadius: 34, boxShadow: `14px 14px 0 ${INK}`}}>NARXINI TOP!</span>
  </div>
);

const Video: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  const data = gifts[0];

  const drop = spring({frame, fps, config: {damping: 9, stiffness: 130, mass: 0.9}});
  const title = spring({frame: frame - 3, fps, config: {damping: 8, stiffness: 190}});
  const question = spring({frame: frame - ASK + 8, fps, config: {damping: 13}});
  const outro = spring({frame: frame - OUTRO, fps, config: {damping: 15, stiffness: 100}});
  const counting = frame >= COUNT && frame < REVEAL;
  const number = 3 - Math.floor((frame - COUNT) / 30);
  const beat = (frame - COUNT) % 30;
  const ring = interpolate(frame, [COUNT, REVEAL], [0, 1], clamp);
  const hit = spring({frame: frame - REVEAL, fps, config: {damping: 8, stiffness: 200}});
  const giftY = interpolate(outro, [0, 1], [690, 640]);

  return (
    <Stage>
      <div style={{opacity: 1 - outro, transform: `translateY(${-outro * 200}px)`}}><Title scale={title} /></div>

      {/* Countdown ring around the gift */}
      <svg width={W} height={H} style={{position: 'absolute', opacity: counting ? 1 : 0}}>
        <circle cx={W / 2} cy={giftY} r={300} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth={22} />
        <circle cx={W / 2} cy={giftY} r={300} fill="none" stroke={LIME} strokeWidth={22} strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 300} strokeDashoffset={2 * Math.PI * 300 * ring}
          transform={`rotate(-90 ${W / 2} ${giftY})`} />
      </svg>
      <div style={{position: 'absolute', left: W / 2 - 300, top: giftY - 300, width: 600, height: 600, borderRadius: '50%',
        background: 'rgba(20,16,31,.28)', transform: `scale(${drop})`}} />
      <Gift data={data} y={interpolate(drop, [0, 1], [-400, giftY])} size={520} scale={1 + (counting ? Math.max(0, 6 - beat) * 0.012 : 0) + outro * 0.12}
        rotate={(1 - drop) * 30} />
      {counting && (
        <div style={{position: 'absolute', left: W / 2 + 190, top: giftY - 330, width: 170, height: 170, borderRadius: '50%',
          background: LIME, color: INK, fontFamily: DISPLAY, fontWeight: 900, fontSize: 104, display: 'flex',
          alignItems: 'center', justifyContent: 'center', boxShadow: `8px 8px 0 ${INK}`,
          transform: `scale(${interpolate(beat, [0, 5, 30], [1.5, 1, 0.94], clamp)})`}}>{number}</div>
      )}

      {/* Question and options */}
      <div style={{opacity: 1 - outro, transform: `translateY(${outro * 260}px)`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1030, textAlign: 'center', fontFamily: BODY, fontWeight: 800,
          fontSize: 58, color: '#fff', opacity: question, transform: `translateY(${(1 - question) * 30}px)`}}>
          {data.meta.title} — kunlik ijarasi qancha?
        </div>
        {OPTIONS.map((label, i) => {
          const enter = spring({frame: frame - ASK - i * 9, fps, config: {damping: 12, stiffness: 170, mass: 0.7}});
          const right = i === ANSWER;
          const revealed = frame >= REVEAL;
          const wrongShake = revealed && !right ? Math.sin((frame - REVEAL) * 1.6) * Math.max(0, 10 - (frame - REVEAL)) : 0;
          const wiggle = counting ? Math.sin(frame / 3 + i * 2) * 2.5 : 0;
          return (
            <div key={label} style={{position: 'absolute', left: 90, right: 90, top: 1128 + i * 140, height: 118, borderRadius: 34,
              display: 'flex', alignItems: 'center', padding: '0 28px', gap: 26, opacity: Math.min(1, enter * 1.5) * (revealed && !right ? 0.42 : 1),
              transform: `translateX(${(1 - enter) * (i % 2 ? 500 : -500) + wrongShake}px) rotate(${wiggle * 0.25}deg) scale(${revealed && right ? 1 + hit * 0.07 : 1})`,
              background: revealed && right ? LIME : '#fff', boxShadow: `10px 10px 0 ${INK}`, border: `5px solid ${INK}`}}>
              <div style={{width: 74, height: 74, borderRadius: 22, background: INK, color: '#fff', fontFamily: DISPLAY, fontWeight: 900,
                fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{'ABC'[i]}</div>
              <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 54, color: INK, flex: 1}}>{label}</div>
              {revealed && right && (
                <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 60, color: INK, transform: `scale(${hit})`}}>✓</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confetti on the reveal */}
      {frame >= REVEAL && frame < REVEAL + 70 && Array.from({length: 46}, (_, i) => {
        const t = (frame - REVEAL) / 30;
        const angle = random(`a${i}`) * Math.PI * 2;
        const speed = 500 + random(`s${i}`) * 900;
        const x = W / 2 + Math.cos(angle) * speed * t;
        const y = 1200 + Math.sin(angle) * speed * t + 900 * t * t;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, width: 22, height: 34, borderRadius: 6,
            background: [LIME, '#fff', '#ff5fa2', BRAND.gold][i % 4], opacity: interpolate(t, [1.4, 2.3], [1, 0], clamp),
            transform: `rotate(${frame * (8 + i % 7) + i * 40}deg)`}} />
        );
      })}

      {/* Closing scene */}
      {frame >= OUTRO && (
        <>
          <div style={{position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center', fontFamily: BODY, fontWeight: 800,
            fontSize: 56, color: '#fff', opacity: outro}}>Ha, kuniga atigi</div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 980, textAlign: 'center', transform: `scale(${outro}) rotate(-2deg)`}}>
            <span style={{display: 'inline-block', fontFamily: DISPLAY, fontWeight: 900, fontSize: 150, lineHeight: 1, color: INK,
              background: LIME, padding: '20px 46px 26px', borderRadius: 36, boxShadow: `14px 14px 0 ${INK}`}}>850 so‘m</span>
          </div>
          {[['Ijaraga oling', 0], ['3 kundan 30 kungacha', 1]].map(([text, i]) => {
            const s = spring({frame: frame - OUTRO - 14 - (i as number) * 8, fps, config: {damping: 13}});
            return (
              <div key={text} style={{position: 'absolute', left: 0, right: 0, top: 1200 + (i as number) * 86, textAlign: 'center',
                fontFamily: i ? BODY : DISPLAY, fontWeight: i ? 800 : 900, fontSize: i ? 48 : 70, color: '#fff', opacity: s,
                transform: `translateY(${(1 - s) * 30}px)`}}>{text}</div>
            );
          })}
          <div style={{position: 'absolute', left: 0, right: 0, top: 1352, display: 'flex', justifyContent: 'center',
            transform: `scale(${spring({frame: frame - OUTRO - 30, fps, config: {damping: 11, stiffness: 160}})})`}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 20, padding: '16px 40px 16px 18px', borderRadius: 999,
              background: '#fff', border: `5px solid ${INK}`, boxShadow: `8px 8px 0 ${INK}`}}>
              <Img src={staticFile('logo.png')} style={{width: 88, height: 88, borderRadius: '50%', background: INK}} />
              <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 44, color: INK}}>{BRAND.bot}</div>
            </div>
          </div>
        </>
      )}
      {frame >= OUTRO + 44 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1490, textAlign: 'center', fontFamily: BODY, fontWeight: 800,
          fontSize: 44, color: LIME, transform: `translateY(${Math.sin(frame / 5) * 8}px)`}}>↑ Havola profilda</div>
      )}
      <AbsoluteFill style={{background: '#fff', opacity: interpolate(frame, [REVEAL - 1, REVEAL, REVEAL + 9], [0, 0.85, 0], clamp)}} />

      <Audio src={staticFile('audio/bed_drive.wav')} volume={(f) => interpolate(f, [0, 6, FRAMES - 30, FRAMES - 1], [0, 0.6, 0.6, 0], clamp)} />
      {[0, 9, 18].map((offset) => (
        <Sequence key={offset} from={ASK + offset}><Audio src={staticFile('audio/pop.wav')} volume={0.7} /></Sequence>
      ))}
      {[0, 30, 60].map((offset) => (
        <Sequence key={offset} from={COUNT + offset}><Audio src={staticFile('audio/pop.wav')} volume={0.9} playbackRate={0.6} /></Sequence>
      ))}
      <Sequence from={REVEAL - 40}><Audio src={staticFile('audio/riser.wav')} volume={0.4} /></Sequence>
      <Sequence from={REVEAL}><Audio src={staticFile('audio/impact.wav')} volume={0.8} /></Sequence>
      <Sequence from={OUTRO - 5}><Audio src={staticFile('audio/whoosh.wav')} volume={0.6} /></Sequence>
    </Stage>
  );
};

const Cover: React.FC = () => {
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  return (
    <Stage>
      <Title />
      <div style={{position: 'absolute', left: W / 2 - 310, top: 470, width: 620, height: 620, borderRadius: '50%', background: 'rgba(20,16,31,.28)'}} />
      <Gift data={gifts[0]} y={780} size={580} />
      {['8 500 so‘m', '??? so‘m', '3 000 so‘m'].map((label, i) => (
        <div key={label} style={{position: 'absolute', left: 150, right: 150, top: 1170 + i * 128, height: 106, borderRadius: 30,
          display: 'flex', alignItems: 'center', padding: '0 24px', gap: 22, background: i === 1 ? LIME : '#fff',
          border: `5px solid ${INK}`, boxShadow: `9px 9px 0 ${INK}`, transform: `rotate(${(i - 1) * 1.5}deg)`}}>
          <div style={{width: 66, height: 66, borderRadius: 20, background: INK, color: '#fff', fontFamily: DISPLAY, fontWeight: 900,
            fontSize: 36, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{'ABC'[i]}</div>
          <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 50, color: INK}}>{label}</div>
        </div>
      ))}
    </Stage>
  );
};

const video: CustomVideo = {id: 'V20261116a', frames: FRAMES, Video, Cover};
export default video;
