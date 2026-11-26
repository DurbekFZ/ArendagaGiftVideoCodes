import '@fontsource/rubik/800.css';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, spring,
  staticFile, useCurrentFrame,
} from 'remotion';
import {BODY, W, clamp, mix} from '../kit';
import type {CustomVideo} from './registry';

// "UCH QADAM" — first @TaqdimotKerakBot video. A real deck lies large across the top of a light, cool desk;
// the text column below explains the service in three numbered steps while the deck is dealt card by card.
// Frame one: "Tayyor taqdimot kerakmi? / Buyurtma qiling" with the title slide of "O‘zbekiston va jahon
// hamjamiyati" big and readable, two more slides fanning out behind it. Then: 1 "Mavzuni botga yozing"
// (the jahon deck is dealt), 2 "Narxini bot ko‘rsatadi" (the islom deck arrives, the desk turns mint),
// 3 "Slaydlar matni bilan tayyor" (the islom title slide big and still), and the ending: a fan of slides from
// both decks over "@TaqdimotKerakBot / Telegramda qidiring".
const ID = 'V20261126b';
const HEAD = "'Rubik', sans-serif";

// Palette. Decks: jahon = navy + teal with white cards; islom = deep green + gold with white cards.
// Background family: light cool paper (ice blue, turning mint for the islom deck) so the dark title slides
// stand out. Accent: warm amber (the islom gold, warmed; complementary to the navy). Neutral: navy ink + white.
// Extra hue: the jahon teal, only in small dots.
const ICE_1 = '#f3f7fb';
const ICE_2 = '#dbe5f0';
const MINT_1 = '#f2f8f3';
const MINT_2 = '#d6e8dc';
const INK = '#0d1f3c';
const AMBER = '#f5b83d';
const WHITE = '#ffffff';
const TEAL = '#1aa3b8';

// Timeline (30 fps).
const S1 = 126; // step 1
const S2 = 219; // step 2
const S3 = 312; // step 3
const CTA = 414;
const FRAMES = 561; // 18.7 s

// The deck, dealt in order; each switch time sends the front card off to the left.
const DECK = ['jahon/01', 'jahon/04', 'jahon/09', 'islom/09', 'islom/02', 'islom/01', 'jahon/10'];
const SWITCH = [S1, 174, S2, 264, S3];
// Fan at the end: [slide, x offset, rotation].
const FAN: [string, number, number][] = [
  ['jahon/03', -300, -13], ['islom/09', -150, -6.5], ['jahon/07', 150, 6.5], ['islom/02', 300, 13], ['jahon/01', 0, 0],
];

const SLIDE_W = 1000;
const SLIDE_H = SLIDE_W * 901 / 1600;
const CX = 540;
const CY = 560;

const Q: React.FC = () => <span style={{margin: '0 -0.08em 0 -0.04em'}}>‘</span>;

const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const images = [...DECK, ...FAN.map((x) => x[0])].map((s) => new Promise((resolve) => {
      const img = new Image(); img.onload = resolve; img.onerror = resolve; img.src = staticFile(`taqdimot/${s}.jpg`);
    }));
    Promise.all([...[`800 10px Rubik`, `800 10px Manrope`]
      .map((font) => document.fonts.load(font, 'Tayyor taqdimot ko‘rsatadi @TaqdimotKerakBot 123')), ...images])
      .then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

const ease = Easing.out(Easing.cubic);
const block = (f: number, from: number, to?: number) => {
  const t = from <= 0 ? 1 : interpolate(f, [from, from + 9], [0, 1], {...clamp, easing: ease});
  const o = to === undefined ? 1 : interpolate(f, [to, to + 6], [1, 0], clamp);
  return {opacity: t * o, transform: `translateY(${(1 - t) * 30}px)`};
};
const shown = (f: number, from: number, to?: number) => f >= from && (to === undefined || f < to + 6);
const sp = (f: number, at: number, config = {damping: 16, stiffness: 120, mass: 0.8}) =>
  spring({frame: f - at, fps: 30, config});

const islomMix = (f: number) => interpolate(f, [S2 - 4, S2 + 20], [0, 1], clamp);

/** Light desk: cool paper with two slow drifting colour fields and a fine dot grid. */
const Desk: React.FC<{f: number}> = ({f}) => {
  const m = islomMix(f);
  const c1 = mix(ICE_1, MINT_1, m);
  const c2 = mix(ICE_2, MINT_2, m);
  const gx = 30 + 12 * Math.sin(f / 70);
  const gy = 28 + 6 * Math.cos(f / 55);
  return (
    <AbsoluteFill style={{background: c2}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 85% 50% at ${gx}% ${gy}%, ${c1} 0%, ${c2} 100%)`}} />
      <AbsoluteFill style={{background: `radial-gradient(circle 520px at ${80 - gx / 3}% ${78 + gy / 6}%, ${mix(AMBER, c2, 0.72)} 0%, rgba(255,255,255,0) 100%)`, opacity: 0.55}} />
      <AbsoluteFill style={{backgroundImage: `radial-gradient(${mix(INK, c2, 0.8)} 2.2px, transparent 2.6px)`,
        backgroundSize: '44px 44px', backgroundPosition: `${(f * 0.25) % 44}px ${(f * 0.4) % 44}px`, opacity: 0.55}} />
    </AbsoluteFill>
  );
};

const Slide: React.FC<{src: string; style: React.CSSProperties; width?: number}> = ({src, style, width = SLIDE_W}) => (
  <div style={{position: 'absolute', width, height: width * 901 / 1600, borderRadius: 16, overflow: 'hidden',
    boxShadow: '0 26px 50px rgba(13,31,60,.28), 0 4px 10px rgba(13,31,60,.18)', background: WHITE, ...style}}>
    <Img src={staticFile(`taqdimot/${src}.jpg`)} style={{width: '100%', height: '100%', display: 'block'}} />
  </div>
);

/** The dealt deck. Position of card i relative to the front: p = i - dealt. p < 0 flew off, p >= 0 waits behind. */
const Deck: React.FC<{f: number; still?: boolean}> = ({f, still}) => {
  const open = still ? 1 : sp(f, 4, {damping: 14, stiffness: 90, mass: 0.9});
  const dealt = SWITCH.reduce((s, at) => s + sp(f, at, {damping: 18, stiffness: 110, mass: 0.8}), 0);
  const out = interpolate(f, [CTA, CTA + 14], [1, 0], {...clamp, easing: Easing.in(Easing.cubic)});
  return (
    <>
      {DECK.map((src, i) => {
        const p = i - dealt;
        if (p < -1.05 || p > 3) return null;
        let x = 0; let y = 0; let r = 0; let s = 1; let o = 1;
        if (p < 0) {
          const q = -p;
          x = -1250 * Math.pow(q, 1.3); y = 60 * q; r = -14 * q;
        } else {
          const side = i % 2 === 0 ? 1 : -1;
          const k = Math.min(p, 2);
          s = 1 - 0.07 * k;
          y = -46 * k;
          r = side * 5.5 * Math.min(p, 1) * open + (p > 1 ? side * 2 * (p - 1) : 0);
          x = side * 26 * Math.min(p, 1) * open;
          o = p > 2 ? Math.max(0, 3 - p) : 1;
        }
        return (
          <Slide key={src} src={src} style={{left: CX - SLIDE_W / 2, top: CY - SLIDE_H / 2, zIndex: 100 - i, opacity: o * out,
            transform: `translate(${x}px, ${y + (1 - out) * -40}px) rotate(${r}deg) scale(${s * (0.9 + 0.1 * out)})`}} />
        );
      })}
    </>
  );
};

/** End fan of five slides from both decks, springing up from below. */
const Fan: React.FC<{f: number; still?: boolean}> = ({f, still}) => (
  <>
    {FAN.map(([src, dx, rot], i) => {
      const t = still ? 1 : sp(f, CTA + 4 + i * 3, {damping: 15, stiffness: 100, mass: 0.8});
      const w = 680;
      return (
        <Slide key={src} src={src} width={w} style={{left: CX - w / 2, top: 520 - w * 901 / 3200, zIndex: i,
          opacity: Math.min(1, t * 1.5), transformOrigin: '50% 160%',
          transform: `translateY(${(1 - t) * 500}px) translateX(${dx * t}px) rotate(${rot * t}deg)`}} />
      );
    })}
  </>
);

const Marker: React.FC<{children: React.ReactNode; at: number; f: number}> = ({children, at, f}) => {
  const t = at <= 0 ? interpolate(f, [2, 12], [0, 1], {...clamp, easing: ease}) : interpolate(f, [at + 6, at + 16], [0, 1], {...clamp, easing: ease});
  return (
    <span style={{position: 'relative', display: 'inline-block'}}>
      <span style={{position: 'absolute', left: -10, right: -10, top: '18%', bottom: '4%', background: AMBER, borderRadius: 10,
        transformOrigin: '0 50%', transform: `scaleX(${t})`}} />
      <span style={{position: 'relative'}}>{children}</span>
    </span>
  );
};

const Step: React.FC<{n: number; at: number; to: number; f: number; children: React.ReactNode}> = ({n, at, to, f, children}) => {
  const b = sp(f, at, {damping: 11, stiffness: 160, mass: 0.6});
  return shown(f, at, to) ? (
    <div style={{position: 'absolute', left: 70, top: 960, width: 800, ...block(f, at, to)}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
        <div style={{width: 104, height: 104, borderRadius: '50%', background: INK, display: 'flex', alignItems: 'center',
          justifyContent: 'center', transform: `scale(${b})`, boxShadow: `0 0 0 8px ${AMBER}`}}>
          <span style={{fontFamily: HEAD, fontWeight: 800, fontSize: 64, color: WHITE, lineHeight: 1}}>{n}</span>
        </div>
        <div style={{display: 'flex', gap: 10}}>
          {[1, 2, 3].map((k) => (
            <div key={k} style={{width: k === n ? 54 : 18, height: 18, borderRadius: 9, background: k <= n ? INK : 'rgba(13,31,60,.2)'}} />
          ))}
        </div>
      </div>
      <div style={{marginTop: 40, fontFamily: HEAD, fontWeight: 800, fontSize: 112, color: INK, lineHeight: 1.06, letterSpacing: -1}}>
        {children}
      </div>
    </div>
  ) : null;
};

const Hook: React.FC<{f: number; still?: boolean}> = ({f, still}) => (
  <>
    <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 124, color: INK, lineHeight: 1.04, letterSpacing: -1.5}}>
      Tayyor<br />taqdimot<br /><Marker at={still ? -1 : 0} f={still ? 30 : f}>kerakmi?</Marker>
    </div>
    <div style={{marginTop: 40, display: 'inline-flex', alignItems: 'center', gap: 16, padding: '16px 34px 16px 22px',
      borderRadius: 999, background: INK}}>
      <div style={{width: 20, height: 20, borderRadius: '50%', background: TEAL, boxShadow: `0 0 0 6px rgba(26,163,184,.3)`}} />
      <span style={{fontFamily: BODY, fontWeight: 800, fontSize: 54, color: WHITE}}>Buyurtma qiling</span>
    </div>
  </>
);

const Handle: React.FC = () => (
  <div style={{display: 'inline-block', padding: '20px 30px', borderRadius: 26, background: INK,
    boxShadow: `0 16px 34px rgba(13,31,60,.3)`}}>
    <span style={{fontFamily: HEAD, fontWeight: 800, fontSize: 82, color: WHITE, letterSpacing: -1}}>
      <span style={{color: AMBER}}>@</span>TaqdimotKerakBot
    </span>
  </div>
);

const Video: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Desk f={f} />
      <Deck f={f} />
      {f >= CTA && <Fan f={f} />}

      {shown(f, 0, S1 - 8) && (
        <div style={{position: 'absolute', left: 70, top: 950, ...block(f, 0, S1 - 8)}}><Hook f={f} /></div>
      )}
      <Step n={1} at={S1} to={S2 - 8} f={f}>Mavzuni<br />botga yozing</Step>
      <Step n={2} at={S2} to={S3 - 8} f={f}>Narxini bot<br />ko<Q />rsatadi</Step>
      <Step n={3} at={S3} to={CTA - 8} f={f}>Slaydlar<br />matni bilan<br />tayyor</Step>

      {shown(f, CTA) && (
        <div style={{position: 'absolute', left: 50, top: 900, width: 980, ...block(f, CTA + 6)}}><Handle /></div>
      )}
      {shown(f, CTA + 24) && (
        <div style={{position: 'absolute', left: 70, top: 1090, ...block(f, CTA + 24)}}>
          <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 104, color: INK, lineHeight: 1.05, letterSpacing: -1}}>
            Telegramda<br /><Marker at={CTA + 24} f={f}>qidiring</Marker>
          </div>
        </div>
      )}

      <Audio src={staticFile(`audio/bed_${ID}.wav`)}
        volume={(fr) => interpolate(fr, [0, 10, FRAMES - 30, FRAMES], [0, 0.3, 0.3, 0], clamp)} />
      {[S1, S2, S3].map((at) => (
        <Sequence key={at} from={at - 2}>
          <Audio src={staticFile('audio/pageturn.wav')} volume={0.32} />
        </Sequence>
      ))}
      <Sequence from={CTA + 2}><Audio src={staticFile('audio/cardflip.wav')} volume={0.3} /></Sequence>
    </AbsoluteFill>
  );
};

const Cover: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Desk f={0} />
      <Slide src="islom/01" width={760} style={{left: 250, top: 300, transform: 'rotate(6deg)', zIndex: 1}} />
      <Slide src="jahon/01" width={880} style={{left: 70, top: 470, transform: 'rotate(-4deg)', zIndex: 2}} />
      <div style={{position: 'absolute', left: 70, top: 1010}}><Hook f={30} still /></div>
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
