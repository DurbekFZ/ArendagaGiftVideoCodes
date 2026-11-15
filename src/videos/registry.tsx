import React from 'react';
import {Composition, staticFile} from 'remotion';
import {FPS, H, W} from '../kit';

export type VoiceLine = {file: string; text: string; seconds: number};
/**
 * One hand-made video. Every file in this folder named V*.tsx default-exports one of these
 * and is registered automatically as compositions `<id>` and `<id>Cover`.
 * With `voice`, the lines recorded for that name are passed to Video as `lines`,
 * and `frames` may be a function of them.
 */
export type CustomVideo = {
  id: string;
  frames: number | ((lines: VoiceLine[]) => number);
  voice?: string;
  Video: React.FC<{lines: VoiceLine[]}>;
  Cover: React.FC;
};

declare const require: {context: (dir: string, deep: boolean, match: RegExp) => {keys(): string[]; (key: string): {default: CustomVideo}}};
const files = require.context('./', false, /^\.\/V[^/]*\.tsx$/);
export const customVideos: CustomVideo[] = files.keys().map((key) => files(key).default);

export const CustomCompositions: React.FC = () => (
  <>
    {customVideos.map((video) => (
      <React.Fragment key={video.id}>
        <Composition id={video.id} component={video.Video} width={W} height={H} fps={FPS}
          durationInFrames={typeof video.frames === 'number' ? video.frames : 300} defaultProps={{lines: [] as VoiceLine[]}}
          calculateMetadata={async () => {
            const lines: VoiceLine[] = video.voice
              ? await fetch(staticFile(`audio/voice/${video.voice}/lines.json`)).then((r) => r.json()) : [];
            return {props: {lines}, durationInFrames: typeof video.frames === 'number' ? video.frames : video.frames(lines)};
          }} />
        <Composition id={`${video.id}Cover`} component={video.Cover} width={W} height={H} fps={FPS} durationInFrames={1} />
      </React.Fragment>
    ))}
  </>
);
