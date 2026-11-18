import {Config} from '@remotion/cli/config';

// Near-lossless frames into the encoder. PNG frames looked the same and made a render on GitHub
// take close to half an hour, right at the job's time limit.
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(100);
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
// HD colour as players expect it; the default tagged files as BT.601, which shifts colours.
Config.setColorSpace('bt709');
Config.setX264Preset('medium');
Config.setAudioBitrate('320k');
Config.setChromiumOpenGlRenderer('angle');
Config.setConcurrency(4);
if (process.env.CHROME_PATH) {
  Config.setBrowserExecutable(process.env.CHROME_PATH);
}
