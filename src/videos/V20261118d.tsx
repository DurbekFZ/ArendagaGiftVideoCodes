import '@fontsource/bodoni-moda/700-italic.css';
import '@fontsource/bodoni-moda/900.css';
import {Lottie} from '@remotion/lottie';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, Easing, Freeze, Img, Sequence, cancelRender, continueRender, delayRender, interpolate, random,
  staticFile, useCurrentFrame,
} from 'remotion';
import {BRAND, GiftData, H, W, clamp, useGifts} from '../kit';
import type {CustomVideo} from './registry';

// "SURGE" — a flat 2D magazine about one gift on a dark studio background. Frame one is its cover:
// the shark Surge Board breaking out of the page, "NFT sovg‘a ijarasi" and a red price sticker
// "kuniga 850 so‘m"; a tab promises "Ichkarida: 0,4%". Then the pages slide away: the model page (4%),
// the symbol page (eagle, 0.4%) and the back cover with the price, the bot and the link. Silent, calm pad.
const ID = 'V20261118d';
const GIFT = 'surgeboard-19409'; // Blåhaj model 4%, Silver Blue backdrop 1%, Eagle symbol 0.4%; 850 so‘m a day
const SERIF = "'Bodoni Moda', serif";
const SANS = "'Manrope', sans-serif";

// Palette from the gift: its Silver Blue backdrop (#80a4b8 / #607c91) and deep pattern navy (#15374b) are the
// background family; the accent is the shark's mouth red, the complement of the blue; neutral is cool paper.
const NAVY = '#0d2433';
const NAVY_DEEP = '#07141d';
const SILVER = '#80a4b8';
const SILVER_EDGE = '#607c91';
const RED = '#e5383b';
const PAPER = '#f3f1ec';
const INK = '#15374b';

// Magazine page in video pixels. Text and the gift stay inside x 100..860 and y 240..1520.
const PX = 60;
const PY = 205;
const PW = 880;
const PH = 1390;

// Timeline (30 fps). Each turn takes TURN frames; a page's text is readable once the turn ends.
const TURN = 22;
const T1 = 140; // cover -> model page
const T2 = 290; // model page -> symbol page
const T3 = 440; // symbol page -> back cover
const TAB = 38; // "Ichkarida: 0,4%" tab slides out on the cover
const LINK = 492;
const FRAMES = 596; // 19.9 s

const useFonts = () => {
  const [handle] = useState(() => delayRender('bodoni'));
  useEffect(() => {
    Promise.all([
      document.fonts.load(`900 10px "Bodoni Moda"`, 'SURGE 850 so‘m 0,4%'),
      document.fonts.load(`italic 700 10px "Bodoni Moda"`, 'NFT sovg‘a ijarasi'),
    ]).then(() => continueRender(handle)).catch(cancelRender);
  }, []);
};

const ease = Easing.bezier(0.55, 0.05, 0.3, 1);
/** How far a page that starts leaving at `at` has gone: 0 in place, 1 off the frame to the left. */
const turnAngle = (frame: number, at: number) => interpolate(frame, [at, at + TURN], [0, 1], {...clamp, easing: ease});

/** Dark studio: navy gradient, a cone of cool light from the top left, the gift's eagle pattern drifting, dust. */
const Studio: React.FC<{data: GiftData}> = ({data}) => {
  const frame = useCurrentFrame();
  const size = 2300;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 70% at 40% 42%, #1c4258 0%, ${NAVY} 50%, ${NAVY_DEEP} 100%)`}}>
      <div style={{position: 'absolute', left: W / 2 - size / 2, top: H * 0.45 - size / 2, width: size, height: size, opacity: 0.55,
        transform: `rotate(${-frame * 0.03}deg)`, filter: 'brightness(1.6)',
        WebkitMaskImage: 'radial-gradient(circle, transparent 18%, #000 40%, transparent 70%)'}}>
        <Lottie animationData={data.pattern} playbackRate={0.0001} style={{width: size, height: size}} />
      </div>
      {Array.from({length: 26}, (_, i) => {
        const r = (k: string) => random(`dust-${i}-${k}`);
        const s = 2 + r('s') * 5;
        const y = ((r('y') * H - frame * (0.25 + r('v') * 0.7)) % H + H) % H;
        const x = r('x') * W + Math.sin(frame / (30 + r('w') * 40) + i) * 30;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%',
          background: '#cfe6f2', opacity: (0.1 + r('o') * 0.4) * (0.6 + 0.4 * Math.sin(frame / 9 + i)),
          filter: s > 5 ? 'blur(1.5px)' : undefined}} />;
      })}
    </AbsoluteFill>
  );
};

/** The spine edge of a page: a thin shade on the left, as on a printed page. */
const Gloss: React.FC = () => (
  <div style={{position: 'absolute', inset: 0, pointerEvents: 'none',
    background: 'linear-gradient(90deg, rgba(0,0,0,.18) 0%, rgba(0,0,0,0) 3%)'}} />
);

/** The gift as printed art: its own animation, no float, placed in page coordinates (x, y = box centre). */
const Art: React.FC<{data: GiftData; x: number; y: number; size: number; rotate?: number; shadow?: string}> =
  ({data, x, y, size, rotate = 0, shadow = 'drop-shadow(0 40px 46px rgba(5,20,30,.45))'}) => (
    <div style={{position: 'absolute', left: x - PX - size / 2, top: y - PY - size / 2, width: size, height: size,
      transform: `rotate(${rotate}deg)`, filter: shadow}}>
      <Lottie animationData={data.gift} loop style={{width: size, height: size}} />
    </div>
  );

/** Absolute text placed in video coordinates inside a page. */
const At: React.FC<{x: number; y: number; w?: number; style?: React.CSSProperties; children: React.ReactNode}> =
  ({x, y, w, style, children}) => (
    <div style={{position: 'absolute', left: x - PX, top: y - PY, width: w, ...style}}>{children}</div>
  );

const Kicker: React.FC<{y: number; color: string; children: React.ReactNode; rule?: string}> = ({y, color, children, rule}) => (
  <At x={100} y={y} w={760} style={{fontFamily: SANS, fontWeight: 800, fontSize: 28, letterSpacing: 6, color,
    textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 18}}>
    <span style={{whiteSpace: 'nowrap'}}>{children}</span>
    {rule && <span style={{flex: 1, height: 2, background: rule}} />}
  </At>
);

const silverCover = `radial-gradient(ellipse 80% 55% at 45% 48%, #a7c3d2 0%, ${SILVER} 38%, ${SILVER_EDGE} 72%, #3f5a6c 100%)`;

const CoverPage: React.FC<{data: GiftData; tab: number}> = ({data, tab}) => (
  <div style={{position: 'absolute', inset: 0, background: silverCover, overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: -200, top: 120, width: 1300, height: 1300, opacity: 0.35}}>
      <Lottie animationData={data.pattern} playbackRate={0.0001} style={{width: 1300, height: 1300}} />
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 560,
      background: 'linear-gradient(180deg, rgba(13,36,51,0) 0%, rgba(13,36,51,.55) 45%, rgba(13,36,51,.85) 100%)'}} />
    <Kicker y={246} color="rgba(255,255,255,.85)">Telegram NFT sovg‘alari · №19409</Kicker>
    <At x={92} y={262} w={780} style={{fontFamily: SERIF, fontWeight: 900, fontSize: 212, lineHeight: 1.1, color: '#fff',
      letterSpacing: -3, textShadow: '0 10px 40px rgba(13,36,51,.35)'}}>SURGE</At>
    <At x={100} y={530} w={760} style={{fontFamily: SANS, fontWeight: 800, fontSize: 40, letterSpacing: 30, color: '#fff',
      textAlign: 'right'}}>BOARD</At>
    <Art data={data} x={460} y={905} size={1120} />
    <At x={100} y={1268} w={520} style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 96, lineHeight: 1.04,
      color: '#fff', textShadow: '0 6px 30px rgba(0,0,0,.35)'}}>NFT sovg‘a<br />ijarasi</At>
    <At x={612} y={1222} style={{width: 250, height: 250, borderRadius: '50%', background: RED, color: '#fff',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-10deg)',
      boxShadow: '0 18px 40px rgba(60,0,0,.4), inset 0 3px 0 rgba(255,255,255,.35)'}}>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, letterSpacing: 2}}>kuniga</div>
      <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 96, lineHeight: 0.95}}>850</div>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 38}}>so‘m</div>
    </At>
    {tab > 0 && (
      <At x={540} y={612} style={{width: 420, height: 92, background: PAPER, borderRadius: '46px 0 0 46px',
        display: 'flex', alignItems: 'center', paddingLeft: 36, gap: 14, transform: `translateX(${(1 - tab) * 440}px)`,
        boxShadow: '0 14px 30px rgba(7,20,29,.35)'}}>
        <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 34, color: INK}}>Ichkarida:</span>
        <span style={{fontFamily: SERIF, fontWeight: 900, fontSize: 52, color: RED}}>0,4%</span>
      </At>
    )}
    <Gloss />
  </div>
);

const ModelPage: React.FC<{data: GiftData; local: number}> = ({data, local}) => {
  const zoom = 1 + Math.max(0, local) * 0.0009;
  return (
    <div style={{position: 'absolute', inset: 0, background: PAPER, overflow: 'hidden'}}>
      <Kicker y={246} color={INK} rule="rgba(21,55,75,.35)">02 · Model</Kicker>
      <At x={100} y={300} style={{width: 760, height: 560, borderRadius: 8, overflow: 'hidden', background: silverCover}}>
        <div style={{position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: '40% 40%'}}>
          {/* A close-up of the shark's mouth with the fish, held on frame 60 of the gift's own animation. */}
          <Freeze frame={60}>
            <div style={{position: 'absolute', left: -266, top: -468, width: 1700, height: 1700,
              filter: 'drop-shadow(0 30px 40px rgba(5,20,30,.4))'}}>
              <Lottie animationData={data.gift} style={{width: 1700, height: 1700}} />
            </div>
          </Freeze>
        </div>
      </At>
      <At x={100} y={880} style={{fontFamily: SANS, fontWeight: 800, fontSize: 24, letterSpacing: 4, color: 'rgba(21,55,75,.6)'}}>
        SURGE BOARD №19409</At>
      <At x={92} y={930} style={{fontFamily: SERIF, fontWeight: 900, fontSize: 300, lineHeight: 1, color: RED, letterSpacing: -6}}>4%</At>
      <At x={100} y={1250} w={760} style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 96, lineHeight: 1,
        color: INK}}>Akula modeli</At>
      <At x={100} y={1380} w={760} style={{fontFamily: SANS, fontWeight: 800, fontSize: 50, color: INK}}>
        Har 100 tadan <span style={{color: RED}}>4 tasi</span></At>
      <Gloss />
    </div>
  );
};

/** One eagle cut from the gift's own symbol pattern (the pattern holds a ring of them). */
const Eagle: React.FC<{data: GiftData; size: number}> = ({data, size}) => {
  // In a 1080 px pattern the large eagle on the left sits at about (175, 525) and is ~105 px wide.
  const scale = size / 105;
  const box = 1080 * scale;
  return (
    <div style={{position: 'relative', width: size, height: size, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: size / 2 - 175 * scale, top: size / 2 - 525 * scale, width: box, height: box,
        filter: 'brightness(0) invert(1) drop-shadow(0 0 30px rgba(128,164,184,.5))', opacity: 0.95}}>
        <Lottie animationData={data.pattern} playbackRate={0.0001} style={{width: box, height: box}} />
      </div>
    </div>
  );
};

const SymbolPage: React.FC<{data: GiftData}> = ({data}) => (
  <div style={{position: 'absolute', inset: 0, background: `linear-gradient(170deg, #1b4560 0%, ${INK} 45%, ${NAVY} 100%)`,
    overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: 30, top: 120, width: 820, height: 820, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(128,164,184,.35), rgba(128,164,184,0) 65%)'}} />
    <Kicker y={246} color={SILVER} rule="rgba(128,164,184,.4)">03 · Belgi</Kicker>
    <At x={250} y={330} style={{width: 440, height: 440}}><Eagle data={data} size={440} /></At>
    <At x={92} y={850} style={{fontFamily: SERIF, fontWeight: 900, fontSize: 290, lineHeight: 1, color: '#ff5a52', letterSpacing: -6}}>
      0,4%</At>
    <At x={100} y={1170} w={760} style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 96, lineHeight: 1,
      color: '#fff'}}>Burgut belgisi</At>
    <At x={100} y={1300} w={760} style={{fontFamily: SANS, fontWeight: 800, fontSize: 50, color: '#dbe8ef'}}>
      1000 tadan <span style={{color: '#ff5a52'}}>4 tasi</span></At>
    <Gloss />
  </div>
);

const BackPage: React.FC<{data: GiftData; link: number}> = ({data, link}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', inset: 0, background: silverCover, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 900,
        background: 'linear-gradient(180deg, rgba(13,36,51,0) 0%, rgba(13,36,51,.7) 40%, rgba(13,36,51,.92) 100%)'}} />
      <Kicker y={246} color="#fff" rule="rgba(255,255,255,.5)">3–30 kunga ijara</Kicker>
      <Art data={data} x={470} y={600} size={900} />
      <At x={100} y={950} w={760} style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 84, lineHeight: 1,
        color: '#fff'}}>kuniga</At>
      <At x={92} y={1040} w={800} style={{fontFamily: SERIF, fontWeight: 900, fontSize: 176, lineHeight: 1, color: '#fff',
        letterSpacing: -3, whiteSpace: 'nowrap'}}>850 <span style={{color: '#ffb4ae'}}>so‘m</span></At>
      <At x={100} y={1270} style={{display: 'flex', alignItems: 'center', gap: 18, padding: '12px 36px 12px 12px', borderRadius: 999,
        background: RED, boxShadow: '0 16px 40px rgba(60,0,0,.35)'}}>
        <Img src={staticFile('logo.png')} style={{width: 80, height: 80, borderRadius: '50%', background: BRAND.ink}} />
        <span style={{fontFamily: SANS, fontWeight: 800, fontSize: 46, color: '#fff'}}>{BRAND.bot}</span>
      </At>
      {link > 0 && (
        <At x={100} y={1418} style={{fontFamily: SANS, fontWeight: 800, fontSize: 52, color: '#fff', opacity: Math.min(1, link * 1.5),
          transform: `translateY(${(1 - link) * 24 - Math.sin(frame / 5) * 6 * link}px)`}}>↑ Havola profilda</At>
      )}
      <Gloss />
    </div>
  );
};

/** One leaf of the magazine. When it leaves it slides off to the left with a slight tilt, like a card. */
const Leaf: React.FC<{z: number; angle?: number; children: React.ReactNode}> = ({z, angle = 0, children}) => {
  if (angle >= 1) return null;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: PW, height: PH, zIndex: z, transformOrigin: '0% 100%',
      transform: `translateX(${-angle * (PW + PX + 120)}px) rotate(${-angle * 8}deg)`, borderRadius: '2px 10px 10px 2px',
      overflow: 'hidden', boxShadow: angle > 0 ? `30px 20px 70px rgba(0,0,0,${0.55 * Math.min(1, angle * 4)})` : 'none'}}>
      {children}
    </div>
  );
};

const Magazine: React.FC<{data: GiftData; frame: number; still?: boolean}> = ({data, frame, still}) => {
  const a1 = still ? 0 : turnAngle(frame, T1);
  const a2 = still ? 0 : turnAngle(frame, T2);
  const a3 = still ? 0 : turnAngle(frame, T3);
  const tab = still ? 1 : interpolate(frame, [TAB, TAB + 14], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.4))});
  const link = still ? 0 : interpolate(frame, [LINK, LINK + 12], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: PX + 24, top: PY + 40, width: PW, height: PH, borderRadius: 24,
        background: 'rgba(0,6,12,.55)', filter: 'blur(40px)'}} />
      <div style={{position: 'absolute', left: PX, top: PY, width: PW, height: PH}}>
        <Leaf z={0}><BackPage data={data} link={link} /></Leaf>
        <Leaf z={1} angle={a3}><SymbolPage data={data} /></Leaf>
        <Leaf z={2} angle={a2}><ModelPage data={data} local={frame - T1} /></Leaf>
        <Leaf z={3} angle={a1}><CoverPage data={data} tab={tab} /></Leaf>
      </div>
    </AbsoluteFill>
  );
};

const Video: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  const data = gifts[0];
  return (
    <AbsoluteFill>
      <Studio data={data} />
      <Magazine data={data} frame={frame} />
      <Audio src={staticFile(`audio/bed_${ID}.wav`)} volume={(f) => interpolate(f, [0, 6, FRAMES - 30, FRAMES - 1], [0, 0.32, 0.32, 0], clamp)} />
      {[T1, T2, T3].map((at) => (
        <Sequence key={at} from={at - 4}><Audio src={staticFile('audio/pageturn.wav')} volume={0.4} /></Sequence>
      ))}
      <Sequence from={TAB}><Audio src={staticFile('audio/whoosh.wav')} volume={0.12} /></Sequence>
    </AbsoluteFill>
  );
};

const Cover: React.FC = () => {
  useFonts();
  const gifts = useGifts([GIFT]);
  if (!gifts) return null;
  return (
    <AbsoluteFill>
      <Freeze frame={60}>
        <Studio data={gifts[0]} />
        <Magazine data={gifts[0]} frame={60} still />
      </Freeze>
    </AbsoluteFill>
  );
};

const video: CustomVideo = {id: ID, frames: FRAMES, Video, Cover};
export default video;
