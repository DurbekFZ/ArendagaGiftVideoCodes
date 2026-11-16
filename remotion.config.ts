import {Config} from '@remotion/cli/config';

// Lossless frames into the encoder: nothing is compressed twice before Instagram re-encodes.
Config.setVideoImageFormat('png');
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
// HD colour as players expect it; the default tagged files as BT.601, which shifts colours.
Config.setColorSpace('bt709');
Config.setX264Preset('slow');
Config.setAudioBitrate('320k');
Config.setChromiumOpenGlRenderer('angle');
Config.setConcurrency(4);
if (process.env.CHROME_PATH) {
  Config.setBrowserExecutable(process.env.CHROME_PATH);
}
