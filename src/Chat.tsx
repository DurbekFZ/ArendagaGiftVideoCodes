import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BODY, BRAND, Backdrop, Cta, DISPLAY, Flash, Gift, GiftData, Rays, Sparkles, W, clamp, lighten, useGifts} from './kit';
import {money} from './Luxe';

export type ChatMessage = {from: 'them' | 'me'; text?: string; card?: boolean; at: number};
const END_PAD = 55; // frames the finished chat stays on screen
const OUTRO = 105;
const TOP = 360;
const SIZE = 50;
const LINE = SIZE * 1.3;
const PER_LINE = 25; // rough characters per bubble line

export const chatScript = (price: number): ChatMessage[] => [
  {from: 'them', text: 'Profilingizdagi gift zo‘r-ku! Qayerdan?', at: 6},
  {from: 'me', text: 'Ijaraga oldim', at: 50},
  {from: 'them', text: 'Ijaraga?! Qimmatdir...', at: 88},
  {from: 'me', text: `Kuniga atigi ${money(price)} so‘m`, at: 130},
  {from: 'me', card: true, at: 168},
  {from: 'them', text: 'Menga ham kerak!', at: 212},
];
export const chatFrames = (script: ChatMessage[]) => script[script.length - 1].at + END_PAD + OUTRO;

const height = (message: ChatMessage) =>
  message.card ? 560 : Math.ceil((message.text ?? '').length / PER_LINE) * LINE + 56;

const Card: React.FC<{data: GiftData}> = ({data}) => (
  <div style={{width: 500, height: 520, borderRadius: 36, overflow: 'hidden', position: 'relative',
    background: `radial-gradient(circle at 50% 42%, ${lighten(data.meta.colors.center, 0.12)}, ${data.meta.colors.edge})`}}>
    <Gift data={data} x={250} y={220} size={380} glow={false} />
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, padding: '18px 26px', background: 'rgba(0,0,0,.32)'}}>
      <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 36, color: '#fff'}}>{data.meta.title}</div>
      <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 30, color: 'rgba(255,255,255,.8)'}}>{BRAND.bot}</div>
    </div>
  </div>
);

const Typing: React.FC<{side: 'them' | 'me'; y: number}> = ({side, y}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', top: y, [side === 'me' ? 'right' : 'left']: 50, display: 'flex', gap: 12,
      padding: '30px 34px', borderRadius: 40, background: side === 'me' ? 'rgba(237,206,144,.25)' : '#232a36'}}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,.7)',
          transform: `translateY(${Math.sin(frame / 2.4 - i) * 7}px)`}} />
      ))}
    </div>
  );
};

/** Style E: a messenger conversation tells the story; the gift arrives as a message. */
export const Chat: React.FC<{id: string; price: number}> = ({id, price}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const gifts = useGifts([id]);
  if (!gifts) return null;
  const data = gifts[0];
  const script = chatScript(price);
  const outroAt = script[script.length - 1].at + END_PAD;
  const tint = lighten(data.meta.colors.center, 0.55);

  // Stack bubbles; once they pass the safe area the whole thread scrolls up.
  const tops: number[] = [];
  script.reduce((y, message, i) => { tops[i] = y; return y + height(message) + 22; }, TOP);
  const visibleBottom = script.reduce((bottom, message, i) =>
    frame >= message.at ? tops[i] + height(message) : bottom, TOP);
  const target = Math.max(0, visibleBottom - 1500);
  const scrollAt = script.find((message, i) => tops[i] + height(message) > 1500)?.at ?? 0;
  const scroll = target * spring({frame: frame - scrollAt, fps, config: {damping: 18, stiffness: 120}});
  const next = script.find((message) => frame < message.at && frame >= message.at - 16);
  const zoom = spring({frame: frame - outroAt, fps, config: {damping: 15, stiffness: 100}});

  return (
    <AbsoluteFill style={{background: '#0f141c'}}>
      <AbsoluteFill style={{background: 'radial-gradient(circle at 20% 10%, #1b2636 0%, transparent 55%), radial-gradient(circle at 90% 90%, #241d2f 0%, transparent 50%)'}} />
      <div style={{position: 'absolute', inset: 0, transform: `translateY(${-scroll}px)`}}>
        {script.map((message, i) => {
          if (frame < message.at) return null;
          const s = spring({frame: frame - message.at, fps, config: {damping: 12, stiffness: 190, mass: 0.6}});
          const mine = message.from === 'me';
          return (
            <div key={i} style={{position: 'absolute', top: tops[i], [mine ? 'right' : 'left']: 50, maxWidth: 780,
              transformOrigin: mine ? '100% 100%' : '0% 100%', transform: `scale(${0.5 + s * 0.5}) translateY(${(1 - s) * 40}px)`,
              opacity: Math.min(1, s * 1.6)}}>
              {message.card ? <Card data={data} /> : (
                <div style={{padding: '26px 36px', borderRadius: 42, fontFamily: BODY, fontWeight: 500, fontSize: SIZE,
                  lineHeight: 1.3, color: mine ? BRAND.ink : '#fff', boxShadow: '0 10px 30px rgba(0,0,0,.25)',
                  background: mine ? `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDeep})` : '#232a36',
                  borderBottomRightRadius: mine ? 12 : 42, borderBottomLeftRadius: mine ? 42 : 12}}>{message.text}</div>
              )}
            </div>
          );
        })}
        {next && <Typing side={next.from} y={tops[script.indexOf(next)]} />}
      </div>
      {/* Chat header */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 350, background: 'linear-gradient(180deg, #0f141c 88%, rgba(15,20,28,0))'}} />
      <div style={{position: 'absolute', left: 50, top: 170, display: 'flex', alignItems: 'center', gap: 26}}>
        <div style={{width: 104, height: 104, borderRadius: '50%', background: 'linear-gradient(160deg, #6f8fd8, #4a5fb0)',
          fontFamily: DISPLAY, fontWeight: 700, fontSize: 46, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>D</div>
        <div>
          <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 48, color: '#fff'}}>Do‘stim</div>
          <div style={{fontFamily: BODY, fontWeight: 500, fontSize: 34, color: '#7fd08a'}}>online</div>
        </div>
      </div>

      {/* The gift card grows into the closing scene */}
      {frame >= outroAt && (
        <AbsoluteFill style={{clipPath: `circle(${zoom * 130}% at 70% 60%)`}}>
          <Backdrop data={data} cy={0.3} />
          <Rays y={580} opacity={0.45} />
          <Sparkles seed={'chat' + id} color={tint} count={26} />
          <Gift data={data} y={580} size={640} scale={0.6 + zoom * 0.4} />
          <Cta at={outroAt + 8} y={960} sub={`kuniga ${money(price)} so‘mdan`} />
        </AbsoluteFill>
      )}
      <Flash at={outroAt + 2} length={8} color={tint} />

      <Audio src={staticFile('audio/bed_bright.wav')} volume={(f) => interpolate(f, [0, 10, outroAt, outroAt + 12, outroAt + OUTRO - 25, outroAt + OUTRO - 1], [0, 0.18, 0.18, 0.6, 0.6, 0], clamp)} />
      {script.map((message) => (
        <Sequence key={message.at} from={message.at}><Audio src={staticFile('audio/pop.wav')} volume={0.75} /></Sequence>
      ))}
      <Sequence from={outroAt - 5}><Audio src={staticFile('audio/whoosh.wav')} volume={0.6} /></Sequence>
      <Sequence from={outroAt + 2}><Audio src={staticFile('audio/impact.wav')} volume={0.55} /></Sequence>
    </AbsoluteFill>
  );
};
