import '@fontsource/unbounded/700.css';
import '@fontsource/unbounded/900.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/800.css';
import '@fontsource/playfair-display/700.css';
import '@fontsource/playfair-display/700-italic.css';
import React from 'react';
import {AbsoluteFill, Composition, Img, staticFile} from 'remotion';
import {BODY, BRAND, Backdrop, DISPLAY, FPS, Gift, H, Rays, Sparkles, W, lighten, useGifts} from './kit';
import {Chat, chatFrames, chatScript} from './Chat';
import {LUXE_FRAMES, Luxe} from './Luxe';
import {Profile, VoiceLine, profileFrames} from './Profile';
import {SHOWCASE_FRAMES, Showcase} from './Showcase';
import {STEPS_FRAMES, Steps} from './Steps';
import {TOP3_FRAMES, Top3} from './Top3';

/** Still cover: big readable headline, the gift, brand mark. */
const Cover: React.FC<{id: string; headline: string[]; badge?: string}> = ({id, headline, badge}) => {
  const gifts = useGifts([id]);
  if (!gifts) return null;
  const data = gifts[0];
  const tint = lighten(data.meta.colors.center, 0.55);
  return (
    <AbsoluteFill>
      <Backdrop data={data} cy={0.4} />
      <Rays y={H * 0.4} opacity={0.5} />
      <Sparkles seed={'cover' + id} color={tint} />
      <Gift data={data} y={H * 0.4} size={860} />
      {badge && (
        <div style={{position: 'absolute', left: 90, top: 300, fontFamily: DISPLAY, fontWeight: 900, fontSize: 56, color: BRAND.ink,
          background: BRAND.gold, padding: '12px 30px', borderRadius: 26, transform: 'rotate(-5deg)',
          boxShadow: '0 16px 40px rgba(0,0,0,.35)'}}>{badge}</div>
      )}
      <div style={{position: 'absolute', left: 60, right: 60, top: 1200, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 900,
        fontSize: 94, lineHeight: 1.14, textTransform: 'uppercase', color: '#fff',
        textShadow: '0 8px 0 rgba(0,0,0,.3), 0 20px 50px rgba(0,0,0,.55)'}}>
        {headline.map((line, i) => (
          <div key={i}>{line.split(' ').map((word, w) => (
            <span key={w} style={{margin: '0 0.12em', color: word.startsWith('*') ? BRAND.gold : '#fff'}}>{word.replace(/\*/g, '')}</span>
          ))}</div>
        ))}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1560, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18}}>
        <Img src={staticFile('logo.png')} style={{width: 76, height: 76, borderRadius: '50%', background: BRAND.ink}} />
        <div style={{fontFamily: BODY, fontWeight: 800, fontSize: 42, color: '#fff', textShadow: '0 4px 18px rgba(0,0,0,.5)'}}>{BRAND.bot}</div>
      </div>
    </AbsoluteFill>
  );
};

export const Root: React.FC = () => (
  <>
    <Composition id="Showcase" component={Showcase} width={W} height={H} fps={FPS} durationInFrames={SHOWCASE_FRAMES}
      defaultProps={{id: 'moonpendant-95850', hook: ['Bu giftni', '*sotib* *olish*', 'shart emas']}} />
    <Composition id="Profile" component={Profile} width={W} height={H} fps={FPS} durationInFrames={300}
      defaultProps={{id: 'jinglebells-64028', lines: [] as VoiceLine[]}}
      calculateMetadata={async ({props}) => {
        const lines: VoiceLine[] = props.lines.length ? props.lines
          : await fetch(staticFile('audio/voice/profile/lines.json')).then((r) => r.json());
        return {props: {...props, lines}, durationInFrames: profileFrames(lines, FPS)};
      }} />
    <Composition id="Top3" component={Top3} width={W} height={H} fps={FPS} durationInFrames={TOP3_FRAMES}
      defaultProps={{ids: ['libertyfigure-188694', 'vicecream-48461', 'jinglebells-64028'], headline: ['Eng noyob', '*3* *ta* gift'], prices: undefined as number[] | undefined}} />
    <Composition id="Luxe" component={Luxe} width={W} height={H} fps={FPS} durationInFrames={LUXE_FRAMES}
      defaultProps={{id: 'candycane-194062', price: 750, discount: 7 as number | undefined}} />
    <Composition id="Chat" component={Chat} width={W} height={H} fps={FPS} durationInFrames={chatFrames(chatScript(0))}
      defaultProps={{id: 'chillflame-164026', price: 750}} />
    <Composition id="Steps" component={Steps} width={W} height={H} fps={FPS} durationInFrames={STEPS_FRAMES}
      defaultProps={{id: 'vicecream-48461', steps: ['Botni oching', 'Giftni tanlang', 'Profilingizda!']}} />
    <Composition id="Cover" component={Cover} width={W} height={H} fps={FPS} durationInFrames={1}
      defaultProps={{id: 'moonpendant-95850', headline: ['Sotib olish', '*shart emas*'], badge: undefined as string | undefined}} />
  </>
);
