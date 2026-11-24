import {Lottie} from '@remotion/lottie';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Freeze, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random,
  spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {BRAND, GiftData, clamp, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "NEGA AYNAN IJARA?" — an answer to the question a real viewer asked under the previous video: why rent a gift at
// all? Cream paper explainer with navy ink. Frame one already reads "Telegram NFT sovg‘a ijarasi / Kuniga 1 000 so‘m"
// above a big pair of sapphire Jingle Bells swinging in front of a navy disc. Then the question itself arrives as a
// comment bubble ("Nega aynan ijara?"), and the answer is shown rather than told: a profile card slides up, the bells
// drop into it ("Sotib olmaysiz — profilingizda turadi"), a bar fills from 3 to 30 days ("3 kundan 30 kungacha"),
// and the price comes back with the bot and the link. Silent, calm pad in E major.
const ID = 'V20261124a';
const GIFT = 'jinglebells-64028'; // Blue Sapphire model 0.3%, Purple backdrop 2.1%, Gingerbread symbol 1.9%; 1 000 so‘m a day
const HEAD = "'Unbounded', sans-serif";
const SANS = "'Manrope', sans-serif";

// Palette. The gift is silver with a vivid sapphire-blue ribbon and bell mouths. Background family: warm cream paper
// (light, so this video reads unlike the dark stages of the last week). Ink and the disc behind the bells: deep navy,
// analogous to the gift's blue, so silver and blue both pop. Accent: the gift's own sapphire, for the key words.
// One extra hue: apricot, the complement of the blue, only for small highlights (pill, bar fill, sparks).
const PAPER = '#f6efe3';
const PAPER_EDGE = '#e7dac4';
const NAVY = '#13234a';
const NAVY_SOFT = '#24386b';
const SAPPHIRE = '#1f7fe8';
const SKY = '#cfe2fb';
const APRICOT = '#ff9a52';
const CARD = '#fffaf3';

// Timeline (30 fps).
const Q = 138; // the viewer's question
const ANS = 234; // answer 1: the card, the bells drop into it
const DAYS = 354; // answer 2: 3 to 30 days
const END = 462; // price, bot, link
const CTA = 480;
const FRAMES = 585; // 19.5 s
const OUT_LEN = 10;

// Gift geometry. The artwork fills ~19–81% of its box across and ~21–78% down. Only pose 0 is used (see Scene).
const BIG = {s: 1060, x: 470, y: 1110};
const SMALL = {s: 840, x: 470, y: 1240};
// Profile card (decoration for the answer), inside x 70–870 and above y 1545.
const CARD_BOX = {x: 70, y: 800, w: 800, h: 700};

const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([`900 10px "Unbounded"`, `700 10px "Unbounded"`, `800 10px "Manrope"`]
      .map((f) => document.fonts.load(f, 'KUNIGA 1 000 so‘m o‘g‘ – ↑ 3–30 Nega aynan ijara?')))
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

/** Moments the bells get struck: they swing from a pivot at the bow, ringing out and settling (rotation only). */
const STRIKES = [-14, Q + 4, ANS + 30, DAYS + 6, END + 4];
const swing = (f: number) => STRIKES.reduce((a, at) => {
  const t = f - at;
  if (t < 0 || t > 70) return a;
  return a + Math.sin(t / 3.1) * 11 * Math.exp(-t / 22);
}, 0);

/** Sound arcs either side of the bells while they swing. */
const Arcs: React.FC<{f: number; x: number; y: number; r: number; still?: boolean}> = ({f, x, y, r, still}) => {
  const strength = still ? 0.9 : STRIKES.reduce((a, at) => {
    const t = f - at;
    return t < 0 || t > 40 ? a : Math.max(a, interpolate(t, [0, 4, 40], [0, 1, 0], clamp));
  }, 0);
  if (strength <= 0) return null;
  const grow = still ? 0.5 : ((f % 40) / 40);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      {[0, 1, 2].map((i) => {
        const rr = r + i * 46 + grow * 30;
        const o = strength * (1 - i * 0.28);
        return (
          <g key={i} opacity={o} fill="none" stroke={i === 0 ? SAPPHIRE : NAVY} strokeWidth={11 - i * 2} strokeLinecap="round">
            <path d={`M ${x - rr * Math.cos(0.5)} ${y - rr * Math.sin(0.5)} A ${rr} ${rr} 0 0 0 ${x - rr * Math.cos(0.5)} ${y + rr * Math.sin(0.5)}`} />
            <path d={`M ${x + rr * Math.cos(0.5)} ${y - rr * Math.sin(0.5)} A ${rr} ${rr} 0 0 1 ${x + rr * Math.cos(0.5)} ${y + rr * Math.sin(0.5)}`} />
          </g>
        );
      })}
    </svg>
  );
};

/** Paper background: faint navy dot grid and slow sky-blue blobs drifting across. */
const Paper: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 85% 70% at 45% 55%, ${PAPER} 55%, ${PAPER_EDGE} 100%)`}}>
    {[0, 1, 2].map((i) => {
      const r = (k: string) => random(`blob-${i}-${k}`);
      const x = -200 + r('x') * 1200 + Math.sin(f / (70 + i * 20) + i) * 80;
      const y = 200 + r('y') * 1500 + Math.cos(f / (90 + i * 15) + i) * 60;
      const s = 520 + r('s') * 300;
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%',
        background: i === 1 ? '#ffd9bc' : SKY, opacity: 0.45, filter: 'blur(60px)'}} />;
    })}
    <AbsoluteFill style={{opacity: 0.09, backgroundImage: `radial-gradient(${NAVY} 2.6px, transparent 3px)`,
      backgroundSize: '44px 44px', backgroundPosition: `${(f * 0.4) % 44}px 0px`}} />
  </AbsoluteFill>
);

/** Little apricot and blue sparks thrown off when the bells are struck. */
const Sparks: React.FC<{f: number; at: number; x: number; y: number; seed: string}> = ({f, at, x, y, seed}) => {
  const t = f - at;
  if (t < 0 || t > 30) return null;
  return (
    <AbsoluteFill>
      {Array.from({length: 10}, (_, i) => {
        const r = (k: string) => random(`${seed}-${i}-${k}`);
        const a = -Math.PI / 2 + (i / 9 - 0.5) * Math.PI * 1.5 + r('a') * 0.3;
        const d = 260 + r('d') * 80 + t * (4 + r('v') * 4);
        const s = (22 + r('s') * 26) * interpolate(t, [0, 6, 30], [0.4, 1, 0.3], clamp);
        return <svg key={i} width={s} height={s} viewBox="0 0 20 20" style={{position: 'absolute', left: x + Math.cos(a) * d - s / 2,
          top: y + Math.sin(a) * d * 0.8 - s / 2, opacity: interpolate(t, [0, 3, 22, 30], [0, 1, 1, 0], clamp)}}>
          <path d="M10 0 Q11 9 20 10 Q11 11 10 20 Q9 11 0 10 Q9 9 10 0Z" fill={i % 2 ? APRICOT : SAPPHIRE} />
        </svg>;
      })}
    </AbsoluteFill>
  );
};

/** A block's entrance and exit: rise in over 8 frames, slide out over OUT_LEN. */
const enter = (f: number, at: number, end: number, still?: boolean) => {
  if (still) return {opacity: 1, transform: 'none'};
  const a = interpolate(f, [at, at + 8], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const b = interpolate(f, [end - OUT_LEN, end], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  return {opacity: a * (1 - b), transform: `translate(${-b * 60}px, ${(1 - a) * 34}px)`};
};

const Pill: React.FC<{children: React.ReactNode; bg?: string; color?: string}> = ({children, bg = NAVY, color = CARD}) => (
  <div style={{display: 'inline-block', fontFamily: SANS, fontWeight: 800, fontSize: 32, letterSpacing: 3, color, background: bg,
    borderRadius: 999, padding: '10px 28px 12px', textTransform: 'uppercase', whiteSpace: 'nowrap'}}>{children}</div>
);

const Price: React.FC = () => (
  <div>
    <div style={{fontFamily: HEAD, fontWeight: 700, fontSize: 68, lineHeight: 1.0, color: NAVY}}>Kuniga</div>
    <div style={{height: 10}} />
    <div style={{fontFamily: HEAD, fontWeight: 900, fontSize: 124, lineHeight: 1.0, color: SAPPHIRE, letterSpacing: -5,
      whiteSpace: 'nowrap'}}>1<span style={{marginLeft: 34}}>000</span><span style={{marginLeft: 40}}>so‘m</span></div>
  </div>
);

/** The viewer's question as a comment bubble: a plain avatar circle (no face) and the words. */
const Bubble: React.FC = () => (
  <div style={{position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 26, background: CARD, borderRadius: 44,
    padding: '34px 46px 38px 30px', boxShadow: `0 18px 0 ${NAVY}`, border: `5px solid ${NAVY}`}}>
    <div style={{width: 96, height: 96, borderRadius: '50%', background: SKY, border: `5px solid ${NAVY}`, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HEAD, fontWeight: 900, fontSize: 54, color: NAVY}}>?</div>
    <div style={{fontFamily: HEAD, fontWeight: 900, fontSize: 70, lineHeight: 1.08, color: NAVY, letterSpacing: -2}}>
      Nega aynan<br />ijara?
    </div>
    {/* tail */}
    <svg width={70} height={60} style={{position: 'absolute', left: 120, bottom: -56}}>
      <path d="M0 0 L58 0 L14 54 Z" fill={NAVY} />
      <path d="M8 -6 L50 -6 L18 34 Z" fill={CARD} />
    </svg>
  </div>
);

/** Skeleton profile card: avatar circle, two placeholder name bars, a slot for gifts. No real UI, logo or text. */
const ProfileCard: React.FC<{f: number; still?: boolean}> = ({f, still}) => {
  const {fps} = useVideoConfig();
  const p = still ? 1 : spring({frame: f - ANS, fps, config: {damping: 16, stiffness: 120, mass: 0.8}});
  if (p <= 0.001) return null;
  const {x, y, w, h} = CARD_BOX;
  return (
    <div style={{position: 'absolute', left: x, top: y + (1 - p) * 760, width: w, height: h, borderRadius: 56, background: CARD,
      border: `6px solid ${NAVY}`, boxShadow: `0 22px 0 ${NAVY}`, opacity: Math.min(1, p * 3)}}>
      <div style={{position: 'absolute', left: 44, top: 40, width: 120, height: 120, borderRadius: '50%',
        background: `linear-gradient(140deg, ${SKY}, ${SAPPHIRE})`, border: `5px solid ${NAVY}`}} />
      <div style={{position: 'absolute', left: 196, top: 62, width: 330, height: 30, borderRadius: 15, background: NAVY}} />
      <div style={{position: 'absolute', left: 196, top: 112, width: 220, height: 24, borderRadius: 12, background: PAPER_EDGE}} />
      {/* gift shelf */}
      <div style={{position: 'absolute', left: 40, right: 40, top: 196, bottom: 40, borderRadius: 40,
        background: `radial-gradient(ellipse 70% 70% at 50% 55%, ${NAVY_SOFT} 0%, ${NAVY} 100%)`}} />
    </div>
  );
};

/** Day bar: 30 cells, filled from day 3 to day 30. Labels "3" and "30" only; no counting digits. */
const DayBar: React.FC<{f: number; still?: boolean}> = ({f, still}) => {
  const fill = still ? 1 : interpolate(f, [DAYS + 10, DAYS + 46], [3 / 30, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return (
    <div style={{position: 'relative', width: 760}}>
      <div style={{display: 'flex', gap: 5}}>
        {Array.from({length: 30}, (_, i) => (
          <div key={i} style={{flex: 1, height: 44, borderRadius: 8, border: `3px solid ${NAVY}`,
            background: (i + 1) / 30 <= fill + 1e-6 ? (i < 3 ? SAPPHIRE : APRICOT) : CARD}} />
        ))}
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: SANS, fontWeight: 800, fontSize: 34,
        color: NAVY}}>
        <span style={{marginLeft: 50}}>3</span><span>30</span>
      </div>
    </div>
  );
};

const Scene: React.FC<{data: GiftData; frame: number; still?: boolean}> = ({data, frame, still}) => {
  const {fps} = useVideoConfig();
  const f = frame;
  // The bells travel from the big stage into the card's shelf; translation and uniform scale only.
  const m = still ? 0 : interpolate(f, [ANS + 6, ANS + 30], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const land = still ? 0 : interpolate(f, [ANS + 30, ANS + 36, ANS + 44], [0, 1, 0], clamp);
  const gs = BIG.s + (SMALL.s - BIG.s) * m;
  const gx = BIG.x;
  const gy = BIG.y + (SMALL.y - BIG.y) * m - Math.sin(m * Math.PI) * 120 + land * 14;
  const ang = still ? -6 : swing(f);
  const breathe = still ? 0 : Math.sin(f / 24) * 6;
  const discP = still ? 1 : 1 - interpolate(f, [ANS, ANS + 16], [0, 1], clamp);
  const cta = still ? 1 : spring({frame: f - CTA, fps, config: {damping: 14, stiffness: 160, mass: 0.7}});
  const nudge = still ? 0 : Math.abs(Math.sin((f - CTA) / 8)) * 6 * Math.min(1, Math.max(0, (f - CTA - 24) / 10));
  const show = (a: number, b: number) => (still ? a === 0 : f >= a && f < b);
  const pose = 0; // frontal; the loop turns the bells side-on and narrow, so it is never played

  return (
    <AbsoluteFill>
      <Paper f={f} />
      {/* navy disc behind the bells (opening and question) */}
      {discP > 0 && (
        <div style={{position: 'absolute', left: BIG.x - 430, top: BIG.y - 430, width: 860, height: 860, borderRadius: '50%',
          background: `radial-gradient(circle at 45% 40%, ${NAVY_SOFT} 0%, ${NAVY} 70%)`, transform: `scale(${0.6 + 0.4 * discP})`,
          opacity: discP, boxShadow: `0 0 0 14px ${PAPER}, 0 0 0 20px ${NAVY}`}} />
      )}
      <ProfileCard f={f} />
      <Arcs f={f} x={gx} y={gy - gs * 0.04} r={gs * 0.36} still={still} />
      <div style={{position: 'absolute', left: gx - gs / 2, top: gy - gs / 2 + breathe, width: gs, height: gs,
        transform: `rotate(${ang}deg)`, transformOrigin: '50% 24%',
        filter: 'drop-shadow(0 26px 22px rgba(10,20,50,.35))'}}>
        <Freeze frame={pose}>
          <Lottie animationData={data.gift} style={{width: gs, height: gs}} />
        </Freeze>
      </div>
      {!still && STRIKES.slice(1).map((at, i) => <Sparks key={at} f={f} at={at} x={gx} y={gy - gs * 0.1} seed={`s${i}`} />)}

      {/* Text column: x 70–870, y 240–820. */}
      {show(0, Q) && (
        <div style={{position: 'absolute', left: 70, top: 250, ...enter(f, -20, Q, still)}}>
          <Pill>Telegram NFT sovg‘a ijarasi</Pill>
          <div style={{height: 34}} />
          <Price />
        </div>
      )}
      {show(Q, ANS) && (
        <div style={{position: 'absolute', left: 70, top: 300, ...enter(f, Q, ANS)}}>
          <Bubble />
        </div>
      )}
      {show(ANS, DAYS) && (
        <div style={{position: 'absolute', left: 70, top: 250, ...enter(f, ANS, DAYS)}}>
          <Pill bg={APRICOT} color={NAVY}>Javob</Pill>
          <div style={{height: 28}} />
          <div style={{fontFamily: HEAD, fontWeight: 900, fontSize: 70, lineHeight: 1.1, color: NAVY, letterSpacing: -2}}>
            Sotib olmaysiz —<br /><span style={{color: SAPPHIRE}}>profilingizda</span><br />turadi
          </div>
        </div>
      )}
      {show(DAYS, END) && (
        <div style={{position: 'absolute', left: 70, top: 270, ...enter(f, DAYS, END)}}>
          <div style={{fontFamily: HEAD, fontWeight: 900, fontSize: 84, lineHeight: 1.06, color: NAVY, letterSpacing: -3}}>
            <span style={{color: SAPPHIRE}}>3</span> kundan<br /><span style={{color: SAPPHIRE}}>30</span> kungacha
          </div>
          <div style={{height: 40}} />
          <DayBar f={f} />
        </div>
      )}
      {!still && f >= END && (
        <div style={{position: 'absolute', left: 70, top: 240, ...enter(f, END, FRAMES + 20)}}>
          <Price />
          <div style={{marginTop: 36, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 18,
            opacity: Math.min(1, cta * 2), transform: `translateY(${(1 - cta) * 26}px)`}}>
            <div style={{display: 'inline-flex', alignItems: 'center', gap: 16, padding: '8px 30px 8px 8px', borderRadius: 999,
              background: NAVY}}>
              <Img src={staticFile('logo.png')} style={{width: 64, height: 64, borderRadius: '50%', background: BRAND.ink}} />
              <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 42, color: CARD}}>{BRAND.bot}</span>
            </div>
            <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, color: NAVY, background: APRICOT, borderRadius: 999,
              padding: '6px 30px 10px', transform: `translateY(${-nudge}px)`}}>↑ Havola profilda</div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

const Video: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  return (
    <AbsoluteFill style={{background: PAPER}}>
      <Scene data={gifts[0]} frame={frame} />
      <Audio src={staticFile(`audio/bed_${ID}.wav`)}
        volume={(f) => interpolate(f, [0, 8, FRAMES - 30, FRAMES - 1], [0, 0.26, 0.26, 0], clamp)} />
      <Sequence from={Q - 4}><Audio src={staticFile('audio/whoosh.wav')} volume={0.12} /></Sequence>
      <Sequence from={ANS}><Audio src={staticFile('audio/whoosh.wav')} volume={0.12} /></Sequence>
      <Sequence from={ANS + 29}><Audio src={staticFile('audio/feltdrop.wav')} volume={0.5} /></Sequence>
      <Sequence from={END + 2}><Audio src={staticFile('audio/feltdrop.wav')} volume={0.3} /></Sequence>
    </AbsoluteFill>
  );
};

const Cover: React.FC = () => {
  useFonts();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  return (
    <AbsoluteFill style={{background: PAPER}}>
      <Scene data={gifts[0]} frame={0} still />
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
