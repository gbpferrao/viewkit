import { mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const directory = new URL('../../dev/plans/evidence/p06/', import.meta.url);
await mkdir(directory, { recursive: true });
for (const [name, inputs, output] of [
  ['hd.mp4', ['-f','lavfi','-i','testsrc2=size=1920x1080:rate=24','-f','lavfi','-i','sine=frequency=440:sample_rate=48000'], ['-t','8','-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p','-c:a','aac']],
  ['audio.wav', ['-f','lavfi','-i','sine=frequency=880:sample_rate=48000'], ['-t','5','-c:a','pcm_s16le']]
]) {
  const result = spawnSync('ffmpeg', ['-hide_banner','-loglevel','error','-y', ...inputs, ...output, fileURLToPath(new URL(name, directory))], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || 'ffmpeg fixture creation failed');
  console.log('prepared', name);
}
