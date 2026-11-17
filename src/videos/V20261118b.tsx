import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random, spring,
  staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BODY, DISPLAY, H, W, clamp} from '../kit';
import type {CustomVideo} from './registry';

// StarsXona trial ad, second version. The owner's brief: from the cover and the very first second a viewer
// must see that this is Telegram Stars and that the price is low. Every word and number is fully legible
// whenever it is on screen: nothing rolls, scrambles or is masked.
const ID = 'V20261118b';
const NIGHT = '#0a0f2e';
const ROYAL = '#2438a8';
const GOLD = '#ffc93c';
const GOLD_DEEP = '#ff9a1f';
const INK = '#1a1206';
const WHITE = '#ffffff';
const CX = 470; // lower-half content is centred here, clear of Instagram's buttons

const LIST = 80; // price list begins
const ROWS = [LIST + 6, LIST + 56, LIST + 106];
const PAY = 262;
const CTA = 362;
const FRAMES = 520;
const PRICES: [string, string][] = [['100', '19 500 so‘m'], ['500', '97 500 so‘m'], ['1 000', '195 000 so‘m']];

const useFonts = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all(['900 10px Unbounded', '700 10px Unbounded', '800 10px Manrope', '500 10px Manrope']
      .map((font) => document.fonts.load(font, 'Telegram Stars 195 so‘m @StarsXonaBot O‘zbekiston')))
      .then(() => { setReady(true); continueRender(handle); }).catch((error) => cancelRender(error));
  }, []);
  return ready;
};

/** A faceted gold star in the spirit of the Telegram Stars icon, drawn as vectors so it stays sharp at any size. */
const Star: React.FC<{size: number; id: string}> = ({size, id}) => {
  const points = Array.from({length: 10}, (_, i) => {
    const radius = i % 2 ? 19 : 44;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    return [50 + radius * Math.cos(angle), 52 + radius * Math.sin(angle)];
  });
  const outline = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ') + 'Z';
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{overflow: 'visible'}}>
      <defs>
        <linearGradient id={`${id}-body`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#fff2a8" /><stop offset="0.4" stopColor={GOLD} /><stop offset="1" stopColor={GOLD_DEEP} />
        </linearGradient>
      </defs>
      <path d={outline} fill={`url(#${id}-body)`} stroke={`url(#${id}-body)`} strokeWidth={9} strokeLinejoin="round" />
      {points.map(([x, y], i) => {
        const [nx, ny] = points[(i + 1) % 10];
        const light = [0.34, 0.12, 0, 0.1, 0, 0.16, 0, 0.14, 0.2, 0.42][i];
        const dark = [0, 0, 0.1, 0, 0.2, 0, 0.24, 0, 0, 0][i];
        return (
          <path key={i} d={`M50 52 L${x.toFixed(2)} ${y.toFixed(2)} L${nx.toFixed(2)} ${ny.toFixed(2)}Z`}
            fill={dark ? `rgba(170,84,0,${dark})` : `rgba(255,255,255,${light})`} />
        );
      })}
    </svg>
  );
};

const Sky: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: NIGHT}}>
      <AbsoluteFill style={{background:
        `radial-gradient(ellipse 120% 70% at 50% 34%, #3550d8 0%, ${ROYAL} 34%, #141d5c 66%, ${NIGHT} 100%)`}} />
      {Array.from({length: 46}, (_, i) => {
        const r = (key: string) => random(`sky-${i}-${key}`);
        const size = 5 + r('s') * 15;
        const y = ((r('y') * H - frame * (0.3 + r('v') * 0.9)) % H + H) % H;
        const twinkle = 0.25 + 0.75 * Math.abs(Math.sin(frame / (12 + r('t') * 18) + i));
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 20 20" style={{position: 'absolute', left: r('x') * W, top: y,
            opacity: twinkle * (0.3 + r('o') * 0.6)}}>
            <path d="M10 0 Q11 9 20 10 Q11 11 10 20 Q9 11 0 10 Q9 9 10 0Z" fill={i % 3 ? '#ffe9a6' : WHITE} />
          </svg>
        );
      })}
    </AbsoluteFill>
  );
};

const Headline: React.FC<{scale?: number; top: number}> = ({scale = 1, top}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top, textAlign: 'center', transform: `scale(${scale})`,
    transformOrigin: '50% 0%', lineHeight: 1.08}}>
    <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 104, color: WHITE, textShadow: '0 8px 30px rgba(0,0,0,.35)'}}>Telegram</div>
    <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 176, color: GOLD, textShadow: '0 10px 0 rgba(120,60,0,.55), 0 24px 50px rgba(0,0,0,.4)'}}>Stars</div>
  </div>
);

const PriceBadge: React.FC<{top: number; scale?: number; x?: number}> = ({top, scale = 1, x = CX}) => (
  <div style={{position: 'absolute', left: x - 400, width: 800, top, textAlign: 'center', transform: `scale(${scale})`}}>
    <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 38, letterSpacing: 8, color: WHITE, marginBottom: 16}}>ARZON NARXDA</div>
    <div style={{display: 'inline-block', padding: '22px 46px', borderRadius: 40, whiteSpace: 'nowrap',
      background: `linear-gradient(180deg, #ffe07a, ${GOLD} 45%, ${GOLD_DEEP})`,
      boxShadow: '0 10px 0 #a35a00, 0 30px 60px rgba(0,0,0,.4)', fontFamily: BODY, fontWeight: 800, fontSize: 76,
      color: INK, lineHeight: 1.15}}>1 Stars = 195 so‘m</div>
  </div>
);

const Video: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ready = useFonts();
  if (!ready) return null;
  const soft = {damping: 16, stiffness: 110};
  const intro = spring({frame: frame + 6, fps, config: {damping: 12, stiffness: 150}}); // nearly settled on frame one
  const toList = spring({frame: frame - LIST, fps, config: soft});
  const toPay = spring({frame: frame - PAY, fps, config: soft});
  const toCta = spring({frame: frame - CTA, fps, config: soft});
  const starSize = interpolate(toList, [0, 1], [520, 300]);
  const starY = interpolate(toList, [0, 1], [840, 420]);
  const starOpacity = 1 - interpolate(frame, [PAY - 2, PAY + 10], [0, 1], clamp);
  const bob = Math.sin(frame / 16) * 10;
  const listOut = 1 - interpolate(frame, [PAY - 10, PAY], [0, 1], clamp);
  const payOut = 1 - interpolate(frame, [CTA - 10, CTA], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <Sky />

      {/* Scene 1: what it is and what it costs, complete on the first frame */}
      <div style={{opacity: 1 - interpolate(frame, [LIST - 4, LIST + 8], [0, 1], clamp)}}>
        <Headline top={236} scale={0.92 + intro * 0.08} />
        <PriceBadge top={1130} scale={0.9 + intro * 0.1} />
        <div style={{position: 'absolute', left: CX - 400, width: 800, top: 1410, textAlign: 'center', fontFamily: DISPLAY,
          fontWeight: 700, fontSize: 56, color: WHITE, lineHeight: 1.2}}>@StarsXonaBot</div>
      </div>

      {/* The star: large at first, then it rises to head the price list */}
      <div style={{position: 'absolute', left: W / 2 - 520, top: starY - 520, width: 1040, height: 1040, opacity: starOpacity * 0.9,
        background: 'radial-gradient(circle, rgba(255,201,60,.42) 0%, rgba(255,201,60,0) 58%)'}} />
      <div style={{position: 'absolute', left: W / 2 - starSize / 2, top: starY - starSize / 2 + bob, opacity: starOpacity,
        transform: `scale(${0.86 + intro * 0.14}) rotate(${Math.sin(frame / 30) * 5}deg)`,
        filter: 'drop-shadow(0 30px 40px rgba(0,0,0,.4))'}}>
        <Star size={starSize} id="hero" />
      </div>

      {/* Scene 2: the price list */}
      {frame >= LIST && frame < PAY && (
        <div style={{opacity: listOut}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 620, textAlign: 'center', opacity: toList,
            fontFamily: DISPLAY, fontWeight: 700, fontSize: 64, color: WHITE, lineHeight: 1.2}}>
            Telegram <span style={{color: GOLD}}>Stars</span>
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 716, textAlign: 'center', opacity: toList,
            fontFamily: BODY, fontWeight: 800, fontSize: 46, color: 'rgba(255,255,255,.85)', lineHeight: 1.2}}>
            1 Stars = 195 so‘m
          </div>
          {PRICES.map(([count, price], i) => {
            const s = spring({frame: frame - ROWS[i], fps, config: {damping: 13, stiffness: 150}});
            return (
              <div key={count} style={{position: 'absolute', left: CX - 400, width: 800, top: 850 + i * 176, height: 148,
                borderRadius: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px',
                boxSizing: 'border-box', background: 'rgba(8,12,44,.62)', border: '3px solid rgba(255,201,60,.55)',
                boxShadow: '0 20px 40px rgba(0,0,0,.3)', opacity: Math.min(1, s * 1.5),
                transform: `translateY(${(1 - s) * 60}px) scale(${0.94 + s * 0.06})`}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 16, fontFamily: DISPLAY, fontWeight: 900, fontSize: 58,
                  color: WHITE, whiteSpace: 'nowrap', lineHeight: 1.2}}>
                  {count}<Star size={62} id={`row${i}`} />
                </div>
                <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 54, color: GOLD, whiteSpace: 'nowrap', lineHeight: 1.2}}>{price}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scene 3: how to pay */}
      {frame >= PAY && frame < CTA && (
        <div style={{opacity: payOut}}>
          <div style={{position: 'absolute', left: W / 2 - 330, top: 400, width: 660, height: 416, borderRadius: 44,
            background: 'linear-gradient(135deg, #3a55e6 0%, #1c2a8f 60%, #111a63 100%)', border: '3px solid rgba(255,255,255,.28)',
            boxShadow: '0 40px 80px rgba(0,0,0,.45)', transform: `translateY(${(1 - toPay) * 80}px) rotate(${-5 + toPay * 1}deg)`,
            opacity: Math.min(1, toPay * 1.5)}}>
            <div style={{position: 'absolute', left: 54, top: 110, width: 104, height: 78, borderRadius: 16,
              background: `linear-gradient(135deg, #ffe07a, ${GOLD_DEEP})`}} />
            <div style={{position: 'absolute', left: 54, top: 250, display: 'flex', gap: 26}}>
              {[0, 1, 2, 3].map((group) => (
                <div key={group} style={{display: 'flex', gap: 9}}>
                  {[0, 1, 2, 3].map((dot) => <div key={dot} style={{width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,.85)'}} />)}
                </div>
              ))}
            </div>
            <div style={{position: 'absolute', right: 46, top: 40}}><Star size={110} id="card" /></div>
          </div>
          <div style={{position: 'absolute', left: CX - 400, width: 800, top: 930, textAlign: 'center', opacity: toPay,
            transform: `translateY(${(1 - toPay) * 40}px)`}}>
            <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 40, letterSpacing: 8, color: GOLD, lineHeight: 1.3}}>TO‘LOV</div>
            <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 78, color: WHITE, lineHeight: 1.18, marginTop: 14}}>
              O‘zbekiston<br />bank kartasi<br />orqali
            </div>
          </div>
        </div>
      )}

      {/* Scene 4: where to get it */}
      {frame >= CTA && (
        <div style={{opacity: Math.min(1, toCta * 1.4)}}>
          <Img src={staticFile('stars/logo-gold.png')} style={{position: 'absolute', left: W / 2 - 170, top: 250, width: 340, height: 340,
            transform: `scale(${0.7 + toCta * 0.3})`, filter: 'drop-shadow(0 20px 40px rgba(0,0,0,.4))'}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 700,
            fontSize: 64, color: WHITE, lineHeight: 1.2}}>Telegram <span style={{color: GOLD}}>Stars</span></div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 736, textAlign: 'center', fontFamily: BODY, fontWeight: 800,
            fontSize: 48, color: 'rgba(255,255,255,.88)', lineHeight: 1.2}}>Telegram’da qidiring:</div>
          <div style={{position: 'absolute', left: CX - 400, width: 800, top: 880, textAlign: 'center',
            transform: `scale(${spring({frame: frame - CTA - 12, fps, config: {damping: 11, stiffness: 150}})})`}}>
            <div style={{display: 'inline-block', padding: '26px 48px', borderRadius: 999, background: WHITE, whiteSpace: 'nowrap',
              boxShadow: '0 10px 0 rgba(0,0,0,.25), 0 30px 60px rgba(0,0,0,.4)', fontFamily: DISPLAY, fontWeight: 700,
              fontSize: 68, color: '#16207a', lineHeight: 1.2}}>@StarsXonaBot</div>
          </div>
          <PriceBadge top={1110} scale={spring({frame: frame - CTA - 28, fps, config: {damping: 12, stiffness: 140}})} />
        </div>
      )}

      <Audio src={staticFile(`audio/bed_${ID}.wav`)} volume={(f) => interpolate(f, [0, 15, FRAMES - 40, FRAMES - 1], [0, 0.34, 0.34, 0], clamp)} />
      {[...ROWS, CTA + 12].map((at) => (
        <Sequence key={at} from={at}><Audio src={staticFile('audio/pop.wav')} volume={0.28} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};

const Cover: React.FC = () => {
  const ready = useFonts();
  if (!ready) return null;
  return (
    <AbsoluteFill>
      <Sky />
      <Headline top={236} />
      <div style={{position: 'absolute', left: W / 2 - 520, top: 280, width: 1040, height: 1040, opacity: 0.9,
        background: 'radial-gradient(circle, rgba(255,201,60,.42) 0%, rgba(255,201,60,0) 58%)'}} />
      <div style={{position: 'absolute', left: W / 2 - 260, top: 580, filter: 'drop-shadow(0 30px 40px rgba(0,0,0,.4))'}}>
        <Star size={520} id="cover" />
      </div>
      <PriceBadge top={1130} x={W / 2} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1400, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 700,
        fontSize: 60, color: WHITE, lineHeight: 1.2}}>@StarsXonaBot</div>
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
