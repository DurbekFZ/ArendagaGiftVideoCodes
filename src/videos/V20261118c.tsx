import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random, spring,
  staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BODY, DISPLAY, clamp} from '../kit';
import {H, Pose, Stars3D, W} from '../three/Stars3D';
import {starPath} from '../three/starShape';
import type {CustomVideo} from './registry';

// StarsXona ad, third version: the real Telegram Stars icon as a glossy 3D object flying through a swarm of
// small stars, with the product and the price readable from the first frame.
const ID = 'V20261118c';
const GOLD = '#ffc61a';
const ORANGE = '#f07a00';
const PINK = '#ff3d77';
const WHITE = '#ffffff';
const INK = '#1b0b3f';
const CX = 470; // lower-half content is centred here, clear of Instagram's buttons

const LIST = 84;
const ROWS = [LIST + 10, LIST + 60, LIST + 110];
const PAY = 266;
const CTA = 366;
const FRAMES = 540;
const PRICES: [string, string][] = [['100', '19 500 so‘m'], ['500', '97 500 so‘m'], ['1 000', '195 000 so‘m']];
const HANDLE = '@StarsXonaBot';

const useFonts = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all(['900 10px Unbounded', '700 10px Unbounded', '800 10px Manrope', '500 10px Manrope']
      .map((font) => document.fonts.load(font, 'TELEGRAM STARS 195 so‘m @StarsXonaBot O‘zbekiston')))
      .then(() => { setReady(true); continueRender(handle); }).catch((error) => cancelRender(error));
  }, []);
  return ready;
};

/** Flat version of the Telegram Stars icon for use inside text and cards. */
const StarIcon: React.FC<{size: number; id: string}> = ({size, id}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{flexShrink: 0, overflow: 'visible',
    filter: 'drop-shadow(0 4px 6px rgba(120,50,0,.45))'}}>
    <defs>
      <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#ffd83a" /><stop offset="1" stopColor={ORANGE} />
      </linearGradient>
    </defs>
    <path d={starPath(100)} fill={`url(#${id})`} stroke="#ffe680" strokeWidth={2.2} strokeLinejoin="round" />
  </svg>
);

const Cosmos: React.FC = () => {
  const frame = useCurrentFrame();
  const blob = (x: number, y: number, size: number, colour: string, opacity: number) => (
    <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle, ${colour} 0%, transparent 66%)`, opacity}} />
  );
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #120737 0%, #2a1185 38%, #5d1fa6 70%, #9c2c9d 100%)', overflow: 'hidden'}}>
      {blob(250 + Math.sin(frame / 50) * 120, 520 + Math.cos(frame / 64) * 90, 1300, '#3f6bff', 0.5)}
      {blob(860 + Math.cos(frame / 44) * 110, 1150 + Math.sin(frame / 58) * 120, 1200, '#ff3fa4', 0.36)}
      {blob(540, 760, 1100, '#ffb300', 0.2)}
      {Array.from({length: 60}, (_, i) => {
        const r = (key: string) => random(`dust-${i}-${key}`);
        const size = 4 + r('s') * 12;
        const twinkle = 0.2 + 0.8 * Math.abs(Math.sin(frame / (10 + r('t') * 20) + i));
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 20 20" style={{position: 'absolute', left: r('x') * W,
            top: ((r('y') * H + frame * (0.2 + r('v') * 0.8)) % H), opacity: twinkle * (0.3 + r('o') * 0.6)}}>
            <path d="M10 0 Q11 9 20 10 Q11 11 10 20 Q9 11 0 10 Q9 9 10 0Z" fill={i % 4 ? WHITE : '#ffe28a'} />
          </svg>
        );
      })}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 100% 75% at 50% 45%, transparent 55%, rgba(8,2,30,.6) 100%)'}} />
    </AbsoluteFill>
  );
};

const Rays: React.FC<{x: number; y: number; opacity: number}> = ({x, y, opacity}) => {
  const frame = useCurrentFrame();
  const size = 1700;
  return (
    <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, opacity,
      transform: `rotate(${frame * 0.35}deg)`, background: 'repeating-conic-gradient(from 0deg, rgba(255,214,90,.55) 0deg 6deg, transparent 6deg 18deg)',
      WebkitMaskImage: 'radial-gradient(circle, #000 10%, transparent 60%)'}} />
  );
};

const goldText: React.CSSProperties = {
  backgroundImage: `linear-gradient(180deg, #fff3b0 0%, ${GOLD} 42%, ${ORANGE} 100%)`,
  WebkitBackgroundClip: 'text', color: 'transparent',
};

const Headline: React.FC<{scale?: number}> = ({scale = 1}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: 232, textAlign: 'center', transform: `scale(${scale})`, transformOrigin: '50% 30%'}}>
    <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 96, letterSpacing: 6, color: WHITE, lineHeight: 1.1,
      textShadow: '0 6px 0 rgba(0,0,0,.25), 0 16px 40px rgba(0,0,0,.45)'}}>TELEGRAM</div>
    <div style={{position: 'relative', height: 190}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, fontFamily: DISPLAY, fontWeight: 900, fontSize: 172,
        lineHeight: 1.1, color: '#8a3a00', transform: 'translateY(10px)', filter: 'blur(1px)'}}>STARS</div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, fontFamily: DISPLAY, fontWeight: 900, fontSize: 172,
        lineHeight: 1.1, ...goldText}}>STARS</div>
    </div>
  </div>
);

/** "1 star = 195 so‘m" on a dark glass card with a gold edge. */
const PriceCard: React.FC<{top: number; scale?: number; x?: number; id: string}> = ({top, scale = 1, x = CX, id}) => (
  <div style={{position: 'absolute', left: x - 400, width: 800, top, display: 'flex', justifyContent: 'center', transform: `scale(${scale})`}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 20, padding: '24px 44px', borderRadius: 44, whiteSpace: 'nowrap',
      background: 'linear-gradient(180deg, rgba(34,14,92,.92), rgba(16,6,54,.92))', border: `4px solid ${GOLD}`,
      boxShadow: '0 0 60px rgba(255,190,40,.45), 0 24px 50px rgba(0,0,0,.45)', fontFamily: DISPLAY, fontWeight: 900,
      fontSize: 74, lineHeight: 1.2, color: WHITE}}>
      1 <StarIcon size={88} id={`${id}-icon`} /> = <span style={goldText}>195 so‘m</span>
    </div>
  </div>
);

const Sticker: React.FC<{x: number; y: number; scale: number; size?: number}> = ({x, y, scale, size = 62}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(${-11 + Math.sin(frame / 9) * 3}deg) scale(${scale})`,
      padding: '14px 34px', borderRadius: 26, background: `linear-gradient(180deg, #ff6a95, ${PINK})`, border: '5px solid #fff',
      boxShadow: '0 12px 0 rgba(120,0,40,.55), 0 26px 40px rgba(0,0,0,.4)', fontFamily: DISPLAY, fontWeight: 900, fontSize: size,
      lineHeight: 1.15, color: WHITE, whiteSpace: 'nowrap'}}>ARZON!</div>
  );
};

const Video: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ready = useFonts();
  if (!ready) return null;
  const soft = {damping: 17, stiffness: 90};
  const intro = spring({frame: frame + 8, fps, config: {damping: 11, stiffness: 140}}); // almost settled on frame one
  const toList = spring({frame: frame - LIST, fps, config: soft});
  const toPay = spring({frame: frame - PAY, fps, config: soft});
  const toCta = spring({frame: frame - CTA, fps, config: soft});

  // The hero star: big in the middle, then up to head the list, smaller during payment, back for the finale.
  const mix = (a: number, b: number, c: number, d: number) =>
    a + (b - a) * toList + (c - b) * toPay + (d - c) * toCta;
  const hero: Pose = {
    x: 540, y: mix(800, 400, 330, 470) + Math.sin(frame / 18) * 10, size: mix(600, 310, 230, 470) * (0.9 + intro * 0.1),
    rotY: 0.3 + Math.sin(frame / 24) * 0.3 + (toList + toPay + toCta) * Math.PI * 2,
    rotX: -0.14 + Math.sin(frame / 31) * 0.08, rotZ: Math.sin(frame / 40) * 0.06,
  };
  const scene = frame < LIST ? 0 : frame < PAY ? 1 : frame < CTA ? 2 : 3;
  const out = (at: number) => 1 - interpolate(frame, [at - 9, at], [0, 1], clamp);
  const typed = Math.round(interpolate(frame, [CTA + 16, CTA + 42], [0, HANDLE.length], clamp));

  return (
    <AbsoluteFill>
      <Cosmos />
      <Rays x={hero.x} y={hero.y} opacity={scene === 0 || scene === 3 ? 0.5 : 0.22} />

      {/* Scene 1: what it is and what it costs, complete on the first frame */}
      {frame < LIST && (
        <div style={{opacity: out(LIST)}}>
          <Headline scale={0.94 + intro * 0.06} />
        </div>
      )}

      <Stars3D frame={frame} hero={hero} flow={scene === 0 ? 1.7 : scene === 3 ? 1.3 : 0.8}
        swarm={scene === 0 || scene === 3 ? 1 : 0.55} seed={ID} />

      {frame < LIST && (
        <div style={{opacity: out(LIST)}}>
          <Sticker x={800} y={610} scale={spring({frame: frame + 4, fps, config: {damping: 8, stiffness: 170}})} />
          <PriceCard top={1140} scale={0.9 + intro * 0.1} id="s1" />
          <div style={{position: 'absolute', left: CX - 400, width: 800, top: 1340, textAlign: 'center', fontFamily: BODY,
            fontWeight: 800, fontSize: 46, lineHeight: 1.2, color: 'rgba(255,255,255,.9)'}}>O‘zbekiston kartasi orqali</div>
        </div>
      )}

      {/* Scene 2: the price list */}
      {scene === 1 && (
        <div style={{opacity: out(PAY)}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 596, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 900,
            fontSize: 76, lineHeight: 1.2, color: WHITE, opacity: toList, textShadow: '0 10px 30px rgba(0,0,0,.4)'}}>
            Telegram <span style={goldText}>Stars</span>
          </div>
          {PRICES.map(([count, price], i) => {
            const s = spring({frame: frame - ROWS[i], fps, config: {damping: 12, stiffness: 150, mass: 0.8}});
            return (
              <div key={count} style={{position: 'absolute', left: 60, width: 780, top: 760 + i * 196, height: 164, borderRadius: 44,
                boxSizing: 'border-box', padding: '0 38px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'linear-gradient(120deg, rgba(44,20,120,.94), rgba(22,9,70,.94))', border: '3px solid rgba(255,255,255,.4)',
                boxShadow: `0 24px 50px rgba(0,0,0,.35), inset 8px 0 0 ${GOLD}`, opacity: Math.min(1, s * 1.6),
                transform: `perspective(1400px) translateX(${(1 - s) * (i % 2 ? 500 : -500)}px) rotateY(${(1 - s) * (i % 2 ? -50 : 50)}deg) rotateZ(${(i - 1) * -1.2}deg)`}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: DISPLAY, fontWeight: 900, fontSize: 58,
                  lineHeight: 1.2, color: WHITE, whiteSpace: 'nowrap'}}>
                  {count}<StarIcon size={70} id={`row-${i}`} />
                </div>
                <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 54, lineHeight: 1.2, whiteSpace: 'nowrap', ...goldText}}>{price}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scene 3: how to pay */}
      {scene === 2 && (
        <div style={{opacity: out(CTA)}}>
          <div style={{position: 'absolute', left: W / 2 - 310, top: 480, width: 620, height: 390, borderRadius: 42,
            background: 'linear-gradient(125deg, #6a4dff 0%, #3a1fb8 55%, #24107e 100%)', border: '3px solid rgba(255,255,255,.4)',
            boxShadow: '0 40px 80px rgba(0,0,0,.5)', overflow: 'hidden', opacity: Math.min(1, toPay * 1.6),
            transform: `perspective(1400px) rotateY(${(1 - toPay) * 80 - 14 + Math.sin(frame / 20) * 6}deg) rotateX(8deg) rotateZ(-4deg)`}}>
            <div style={{position: 'absolute', left: 50, top: 96, width: 100, height: 76, borderRadius: 16,
              background: `linear-gradient(135deg, #ffe58a, ${ORANGE})`}} />
            <div style={{position: 'absolute', left: 50, top: 236, display: 'flex', gap: 24}}>
              {[0, 1, 2, 3].map((group) => (
                <div key={group} style={{display: 'flex', gap: 8}}>
                  {[0, 1, 2, 3].map((dot) => <div key={dot} style={{width: 17, height: 17, borderRadius: '50%', background: 'rgba(255,255,255,.9)'}} />)}
                </div>
              ))}
            </div>
            <div style={{position: 'absolute', right: 40, top: 34}}><StarIcon size={104} id="card" /></div>
            <div style={{position: 'absolute', inset: 0, background:
              `linear-gradient(110deg, transparent ${((frame - PAY) * 3) % 220 - 60}%, rgba(255,255,255,.35) ${((frame - PAY) * 3) % 220 - 40}%, transparent ${((frame - PAY) * 3) % 220 - 20}%)`}} />
          </div>
          <div style={{position: 'absolute', left: CX - 400, width: 800, top: 950, textAlign: 'center', opacity: toPay,
            transform: `translateY(${(1 - toPay) * 50}px)`}}>
            <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 42, letterSpacing: 10, lineHeight: 1.3, color: GOLD}}>TO‘LOV</div>
            <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 80, lineHeight: 1.16, color: WHITE, marginTop: 12,
              textShadow: '0 10px 30px rgba(0,0,0,.45)'}}>O‘zbekiston<br />bank kartasi<br />orqali</div>
          </div>
        </div>
      )}

      {/* Scene 4: where to get it */}
      {scene === 3 && (
        <div style={{opacity: Math.min(1, toCta * 1.5)}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 724, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 900,
            fontSize: 84, lineHeight: 1.2, color: WHITE, textShadow: '0 10px 30px rgba(0,0,0,.4)'}}>
            Telegram <span style={goldText}>Stars</span>
          </div>
          <div style={{position: 'absolute', left: CX - 400, width: 800, top: 866, textAlign: 'center', fontFamily: BODY, fontWeight: 800,
            fontSize: 46, lineHeight: 1.2, color: 'rgba(255,255,255,.92)'}}>Telegram’da qidiring:</div>
          <div style={{position: 'absolute', left: CX - 400, width: 800, top: 946, display: 'flex', justifyContent: 'center',
            transform: `scale(${spring({frame: frame - CTA - 8, fps, config: {damping: 11, stiffness: 150}})})`}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 18, padding: '18px 44px 18px 18px', borderRadius: 999, background: WHITE,
              boxShadow: '0 12px 0 rgba(0,0,0,.28), 0 30px 60px rgba(0,0,0,.45)', minWidth: 700, boxSizing: 'border-box'}}>
              <Img src={staticFile('stars/logo-gold.png')} style={{width: 100, height: 100, borderRadius: '50%', background: INK}} />
              <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 60, lineHeight: 1.2, color: INK, whiteSpace: 'nowrap'}}>
                {HANDLE.slice(0, typed)}
                <span style={{opacity: typed < HANDLE.length || Math.floor(frame / 12) % 2 ? 1 : 0, color: PINK}}>|</span>
              </div>
            </div>
          </div>
          <PriceCard top={1140} scale={spring({frame: frame - CTA - 44, fps, config: {damping: 11, stiffness: 150}})} id="s4" />
          <Sticker x={770} y={1092} size={42} scale={spring({frame: frame - CTA - 58, fps, config: {damping: 8, stiffness: 170}})} />
          <div style={{position: 'absolute', left: CX - 400, width: 800, top: 1340, textAlign: 'center', fontFamily: BODY,
            fontWeight: 800, fontSize: 46, lineHeight: 1.2, color: 'rgba(255,255,255,.9)',
            opacity: spring({frame: frame - CTA - 66, fps, config: soft})}}>O‘zbekiston kartasi orqali</div>
        </div>
      )}

      <Audio src={staticFile(`audio/bed_${ID}.wav`)} volume={(f) => interpolate(f, [0, 20, FRAMES - 45, FRAMES - 1], [0, 0.3, 0.3, 0], clamp)} />
      {[LIST, PAY, CTA].map((at) => (
        <Sequence key={at} from={at - 6}><Audio src={staticFile('audio/whoosh.wav')} volume={0.14} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};

const Cover: React.FC = () => {
  const ready = useFonts();
  if (!ready) return null;
  return (
    <AbsoluteFill>
      <Cosmos />
      <Rays x={540} y={800} opacity={0.5} />
      <Headline />
      <Stars3D frame={40} hero={{x: 540, y: 800, size: 600, rotY: 0.38, rotX: -0.14, rotZ: 0.04}} seed={ID} />
      <Sticker x={800} y={610} scale={1} />
      <PriceCard top={1140} x={W / 2} id="cover" />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1350, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 700,
        fontSize: 60, lineHeight: 1.2, color: WHITE}}>{HANDLE}</div>
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
