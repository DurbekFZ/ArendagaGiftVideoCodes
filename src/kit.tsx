import {Lottie} from '@remotion/lottie';
import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Img, cancelRender, continueRender, delayRender, interpolate, random,
  spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const BRAND = {gold: '#edce90', goldDeep: '#d5b578', ink: '#121416', text: '#f5f3ed', bot: '@ArendagaGiftBot'};
export const DISPLAY = "'Unbounded', sans-serif";
export const BODY = "'Manrope', sans-serif";

export type Attribute = {name: string; rarity: number | null};
export type GiftMeta = {
  id: string; slug: string; title: string; number: number; url: string;
  model: Attribute; backdrop: Attribute; symbol: Attribute;
  colors: {center: string; edge: string; pattern: string};
};
export type GiftData = {meta: GiftMeta; gift: any; pattern: any};

const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
export const mix = (a: string, b: string, t: number) => {
  const [x, y] = [parse(a), parse(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
};
export const darken = (hex: string, t: number) => mix(hex, '#000000', t);
export const lighten = (hex: string, t: number) => mix(hex, '#ffffff', t);
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Loads fonts and the prepared assets of each gift before any frame is rendered. */
export const useGifts = (ids: string[]): GiftData[] | null => {
  const [data, setData] = useState<GiftData[] | null>(null);
  const [handle] = useState(() => delayRender('gifts ' + ids.join(',')));
  useEffect(() => {
    const load = (id: string) => Promise.all(['meta', 'gift', 'pattern'].map((name) =>
      fetch(staticFile(`gifts/${id}/${name}.json`)).then((r) => r.json())))
      .then(([meta, gift, pattern]) => ({meta, gift, pattern}));
    const fonts = ['900 10px Unbounded', '700 10px Unbounded', '800 10px Manrope', '500 10px Manrope',
      '700 10px "Playfair Display"', 'italic 700 10px "Playfair Display"']
      .map((font) => document.fonts.load(font, 'Oʻg‘ 123'));
    Promise.all([Promise.all(ids.map(load)), ...fonts])
      .then(([loaded]) => { setData(loaded as GiftData[]); continueRender(handle); })
      .catch((error) => cancelRender(error));
  }, [ids.join(',')]);
  return data;
};

export const pop = (frame: number, fps: number, at: number, config = {damping: 12, stiffness: 140, mass: 0.7}) =>
  spring({frame: frame - at, fps, config});

/** Gift backdrop: the gift's own gradient and symbol pattern, with slow drift. */
export const Backdrop: React.FC<{data: GiftData; cy?: number; dim?: number; patternOpacity?: number}> =
  ({data, cy = 0.42, dim = 0, patternOpacity = 1}) => {
    const frame = useCurrentFrame();
    const {center, edge} = data.meta.colors;
    const size = 1780;
    return (
      <AbsoluteFill style={{background: darken(edge, 0.62)}}>
        <AbsoluteFill style={{background:
          `radial-gradient(ellipse 95% 62% at 50% ${cy * 100}%, ${lighten(center, 0.1)} 0%, ${edge} 48%, ${darken(edge, 0.62)} 100%)`}} />
        <div style={{position: 'absolute', left: W / 2 - size / 2, top: H * cy - size / 2, width: size, height: size,
          opacity: patternOpacity, transform: `rotate(${frame * 0.035}deg) scale(${1 + frame * 0.00035})`,
          WebkitMaskImage: 'radial-gradient(circle, #000 30%, transparent 68%)'}}>
          <Lottie animationData={data.pattern} playbackRate={0.0001} style={{width: size, height: size}} />
        </div>
        <AbsoluteFill style={{background:
          'linear-gradient(180deg, rgba(0,0,0,.42) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 62%, rgba(0,0,0,.55) 100%)'}} />
        <AbsoluteFill style={{background: '#000', opacity: dim}} />
      </AbsoluteFill>
    );
  };

export const Rays: React.FC<{x?: number; y: number; size?: number; opacity?: number; color?: string}> =
  ({x = W / 2, y, size = 1900, opacity = 0.5, color = '#ffffff'}) => {
    const frame = useCurrentFrame();
    return (
      <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, opacity,
        transform: `rotate(${frame * 0.4}deg)`, mixBlendMode: 'soft-light',
        background: `repeating-conic-gradient(from 0deg, ${color} 0deg 7deg, transparent 7deg 20deg)`,
        WebkitMaskImage: 'radial-gradient(circle, #000 8%, transparent 62%)'}} />
    );
  };

export const Sparkles: React.FC<{seed: string; count?: number; color?: string; opacity?: number}> =
  ({seed, count = 34, color = '#ffffff', opacity = 1}) => {
    const frame = useCurrentFrame();
    return (
      <AbsoluteFill style={{opacity}}>
        {Array.from({length: count}, (_, i) => {
          const r = (k: string) => random(`${seed}-${i}-${k}`);
          const speed = 0.8 + r('s') * 2.2;
          const y = ((r('y') * H - frame * speed) % H + H) % H;
          const x = r('x') * W + Math.sin(frame / (22 + r('w') * 30) + i) * 26;
          const size = 6 + r('z') * 20;
          const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(frame / (9 + r('t') * 14) + i * 1.7));
          return (
            <svg key={i} width={size} height={size} viewBox="0 0 20 20"
              style={{position: 'absolute', left: x, top: y, opacity: twinkle * (0.35 + r('o') * 0.6),
                filter: `drop-shadow(0 0 ${size / 2}px ${color})`}}>
              <path d="M10 0 Q11 9 20 10 Q11 11 10 20 Q9 11 0 10 Q9 9 10 0Z" fill={color} />
            </svg>
          );
        })}
      </AbsoluteFill>
    );
  };

/** The animated gift itself (transparent background), centred on x/y. */
export const Gift: React.FC<{data: GiftData; x?: number; y: number; size: number; scale?: number;
  rotate?: number; blur?: number; opacity?: number; glow?: boolean}> =
  ({data, x = W / 2, y, size, scale = 1, rotate = 0, blur = 0, opacity = 1, glow = true}) => {
    const frame = useCurrentFrame();
    const float = Math.sin(frame / 17) * 10;
    return (
      <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2 + float, width: size, height: size,
        opacity, transform: `scale(${scale}) rotate(${rotate}deg)`,
        filter: `${blur ? `blur(${blur}px) ` : ''}${glow ? 'drop-shadow(0 30px 50px rgba(0,0,0,.35))' : ''}`}}>
        <Lottie animationData={data.gift} loop style={{width: size, height: size}} />
      </div>
    );
  };

/** Headline whose words slam in one after another. `*word*` marks an accent word. */
export const Slam: React.FC<{lines: string[]; at?: number; stagger?: number; size?: number; y: number;
  out?: number; accent?: string; align?: 'center' | 'left'; lineHeight?: number}> =
  ({lines, at = 0, stagger = 4, size = 104, y, out, accent = BRAND.gold, lineHeight = 1.12}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();
    const exit = out === undefined ? 0 : interpolate(frame, [out, out + 8], [0, 1], clamp);
    let index = 0;
    return (
      <div style={{position: 'absolute', left: 60, right: 60, top: y, textAlign: 'center', fontFamily: DISPLAY,
        fontWeight: 900, fontSize: size, lineHeight, color: '#fff', textTransform: 'uppercase',
        opacity: 1 - exit, transform: `translateY(${-exit * 60}px) scale(${1 - exit * 0.08})`}}>
        {lines.map((line, l) => (
          <div key={l}>
            {line.split(' ').map((raw, w) => {
              const hot = raw.startsWith('*');
              const word = raw.replace(/\*/g, '');
              const s = pop(frame, fps, at + index++ * stagger, {damping: 11, stiffness: 190, mass: 0.6});
              return (
                <span key={w} style={{display: 'inline-block', margin: '0 0.2em', opacity: Math.min(1, s * 1.6),
                  transform: `scale(${interpolate(s, [0, 1], [1.9, 1])}) translateY(${(1 - s) * 30}px)`,
                  filter: `blur(${(1 - Math.min(1, s)) * 14}px)`, color: hot ? accent : '#fff',
                  textShadow: '0 6px 0 rgba(0,0,0,.28), 0 18px 44px rgba(0,0,0,.5)'}}>{word}</span>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

export const Flash: React.FC<{at: number; length?: number; color?: string}> = ({at, length = 12, color = '#fff'}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [at - 1, at, at + length], [0, 0.95, 0], clamp);
  return <AbsoluteFill style={{background: color, opacity, pointerEvents: 'none'}} />;
};

export const Ring: React.FC<{at: number; y: number; x?: number; color?: string}> = ({at, y, x = W / 2, color = '#fff'}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + 26], [0, 1], clamp);
  const size = 200 + t * 1500;
  return (
    <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size,
      borderRadius: '50%', border: `${12 * (1 - t)}px solid ${color}`, opacity: frame < at ? 0 : 1 - t}} />
  );
};

export const Chip: React.FC<{at: number; y: number; label: string; value: string; rarity: number | null;
  tint: string; from?: -1 | 1}> = ({at, y, label, value, rarity, tint, from = 1}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();
    const s = pop(frame, fps, at);
    const shown = rarity === null ? null
      : interpolate(frame, [at + 4, at + 22], [Math.min(100, rarity * 6), rarity], clamp);
    return (
      <div style={{position: 'absolute', left: 90, right: 90, top: y, height: 112, borderRadius: 34,
        display: 'flex', alignItems: 'center', padding: '0 34px', gap: 22, opacity: Math.min(1, s * 1.5),
        transform: `translateX(${(1 - s) * 420 * from}px) scale(${0.9 + s * 0.1})`,
        background: 'rgba(12,14,18,.46)', border: '2px solid rgba(255,255,255,.2)',
        boxShadow: '0 18px 40px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.18)', backdropFilter: 'blur(18px)'}}>
        <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 30, letterSpacing: 2, textTransform: 'uppercase',
          color: 'rgba(255,255,255,.62)', width: 150}}>{label}</div>
        <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 46, color: '#fff', flex: 1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{value}</div>
        {shown !== null && (
          <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 34, color: BRAND.ink, background: tint,
            padding: '12px 22px', borderRadius: 22, minWidth: 128, textAlign: 'center'}}>
            {shown.toFixed(rarity! < 10 && rarity! % 1 ? 1 : 0)}%
          </div>
        )}
      </div>
    );
  };

/** Closing call to action: brand mark, bot handle and where the link lives. */
export const Cta: React.FC<{at: number; y: number; headline?: string[]; sub?: string}> =
  ({at, y, headline = ['*Ijaraga*', 'oling'], sub = '3 kundan 30 kungacha'}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();
    const a = pop(frame, fps, at + 10);
    const b = pop(frame, fps, at + 20);
    const c = pop(frame, fps, at + 30);
    const nudge = Math.sin((frame - at) / 5) * 10;
    return (
      <>
        <Slam lines={headline} at={at} y={y} size={110} />
        <div style={{position: 'absolute', left: 0, right: 0, top: y + 150 * headline.length, textAlign: 'center',
          fontFamily: BODY, fontWeight: 800, fontSize: 52, color: 'rgba(255,255,255,.92)', opacity: a,
          transform: `translateY(${(1 - a) * 30}px)`, textShadow: '0 6px 24px rgba(0,0,0,.45)'}}>{sub}</div>
        <div style={{position: 'absolute', left: 0, right: 0, top: y + 150 * headline.length + 110, display: 'flex',
          justifyContent: 'center', opacity: Math.min(1, b * 1.4), transform: `scale(${0.7 + b * 0.3})`}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 22, padding: '20px 44px 20px 22px', borderRadius: 999,
            background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDeep})`,
            boxShadow: '0 24px 60px rgba(0,0,0,.4), inset 0 2px 0 rgba(255,255,255,.5)'}}>
            <Img src={staticFile('logo.png')} style={{width: 96, height: 96, borderRadius: '50%', background: BRAND.ink}} />
            <div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 46, color: BRAND.ink}}>{BRAND.bot}</div>
          </div>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: y + 150 * headline.length + 290, textAlign: 'center',
          fontFamily: BODY, fontWeight: 800, fontSize: 44, color: '#fff', opacity: c,
          transform: `translateY(${-nudge * c}px)`, textShadow: '0 6px 24px rgba(0,0,0,.5)'}}>
          ↑ Havola profilda
        </div>
      </>
    );
  };
