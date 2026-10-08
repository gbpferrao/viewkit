import { spawnSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const evidence = new URL('../../dev/plans/evidence/p06/', import.meta.url);
function probe(name) {
  const command = spawnSync('ffprobe', ['-v','error','-show_entries','stream=codec_name,width,height,r_frame_rate,nb_frames:format=duration','-of','json',fileURLToPath(new URL(name,evidence))], {encoding:'utf8'});
  if (command.status !== 0) throw new Error(command.stderr);
  return JSON.parse(command.stdout);
}
function level(name, start, duration) {
  const command = spawnSync('ffmpeg', ['-hide_banner','-ss',String(start),'-t',String(duration),'-i',fileURLToPath(new URL(name,evidence)),'-vn','-af','volumedetect','-f','null','-'], {encoding:'utf8'});
  if (command.status !== 0) throw new Error(command.stderr);
  return Number(/mean_volume: (-?[\d.]+) dB/.exec(command.stderr)?.[1]);
}
for (const browser of ['chrome','edge']) {
  const output = probe(browser + '-export.mp4'), odd = probe(browser + '-odd-audio.mp4');
  const referenceDb = level('audio.wav',1.1,0.7), actualDb = level(browser + '-odd-audio.mp4',1.1,0.7), gapDb = level(browser + '-odd-audio.mp4',0.1,0.7);
  if (Math.abs(actualDb - referenceDb + 6.02) > 0.3 || gapDb > -80) throw new Error('audio gain or silent gap does not match: ' + JSON.stringify({referenceDb,actualDb,gapDb}));
  const video = output.streams.find(stream => stream.codec_name === 'h264');
  if (video.width !== 1280 || video.height !== 720 || video.r_frame_rate !== '24/1') throw new Error('output video metadata mismatch');
  const report = { output, odd, referenceDb, actualDb, differenceDb: actualDb - referenceDb, gapDb };
  await writeFile(new URL(browser + '-output-inspection.json', evidence), JSON.stringify(report,null,2));
  console.log(browser, 'metadata, 50% gain and silent gap passed');
}
