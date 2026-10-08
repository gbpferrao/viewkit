import { FFmpeg } from '@ffmpeg/ffmpeg';
import type { ProjectSnapshot } from '../timeline/project-timeline.state';
import type { MediaSource } from '../timeline/timeline.model';
import { timelineEnd } from '../timeline/timeline.model';
import { buildExportCommand } from './export-graph.model';
import { encodeNativeMp4 } from './native-mp4.adapter';
import type { RenderProgress } from './native-render.contract';
import { FPS } from '../shared/frame-math.contract';

/** Encode one immutable timeline in a private worker filesystem. Termination frees it on every exit path. */
export async function encodeMp4(snapshot: ProjectSnapshot, sources: MediaSource[], signal: AbortSignal,
  onProgress: RenderProgress): Promise<Blob> {
  signal.throwIfAborted();
  try { return await encodeNativeMp4(snapshot, sources, signal, onProgress); }
  catch { signal.throwIfAborted(); onProgress(0, 'preparing the compatible encoder'); }
  return encodeCompatibleMp4(snapshot, sources, signal, onProgress);
}

async function encodeCompatibleMp4(snapshot: ProjectSnapshot, sources: MediaSource[], signal: AbortSignal,
  onProgress: RenderProgress): Promise<Blob> {
  const encoder = new FFmpeg();
  const abort = () => encoder.terminate();
  signal.addEventListener('abort', abort, { once: true });
  const logs: string[] = [];
  const duration = timelineEnd(snapshot.clips);
  const totalFrames = Math.round(duration * FPS);
  let encodedFrame: number | undefined;
  let lastProgressStamp = 0;
  encoder.on('log', ({ message }) => {
    logs.push(message); if (logs.length > 60) logs.shift();
    const frame = message.match(/\bframe=\s*(\d+)/); if (frame) encodedFrame = Number(frame[1]);
  });
  encoder.on('progress', ({ time }) => {
    const stamp = performance.now();
    if (stamp - lastProgressStamp < 100) return;
    lastProgressStamp = stamp;
    onProgress(Math.min(0.97, 0.15 + time / 1000000 / duration * 0.8), 'rendering your sequence',
      Math.max(0, Math.min(totalFrames, encodedFrame ?? Math.floor(time / 1000000 * FPS))), encodedFrame === undefined);
  });
  try {
    signal.throwIfAborted();
    onProgress(0.01, 'starting the local encoder');
    await encoder.load({ coreURL: new URL(import.meta.env.BASE_URL + 'codec/ffmpeg-core.js', document.baseURI).href,
      wasmURL: new URL(import.meta.env.BASE_URL + 'codec/ffmpeg-core.wasm', document.baseURI).href });
    const audioSources = new Map<string, number>();
    for (const [index, source] of sources.entries()) {
      signal.throwIfAborted();
      const extension = source.file.name.split('.').at(-1)?.toLowerCase();
      const name = 'source-' + index + '.' + extension;
      await encoder.writeFile(name, new Uint8Array(await source.file.arrayBuffer()));
      logs.length = 0;
      // An input-only command deliberately exits without an output after printing stream metadata.
      await encoder.exec(['-hide_banner', '-i', name]);
      const audioStream = logs.find(line => /Stream.*Audio:/.test(line));
      if (audioStream) audioSources.set(source.id, /\bmono\b/.test(audioStream) ? 1 : 2);
      onProgress(0.05 + (index + 1) / sources.length * 0.1, 'preparing local media');
    }
    logs.length = 0;
    const status = await encoder.exec(buildExportCommand(snapshot, sources, audioSources));
    signal.throwIfAborted();
    if (status !== 0) throw new Error('encoder could not render this sequence: ' + logs.slice(-5).join(' '));
    const output = await encoder.readFile('output.mp4');
    if (!(output instanceof Uint8Array) || output.length === 0) throw new Error('encoder returned an empty file');
    onProgress(1, 'export complete', totalFrames);
    return new Blob([new Uint8Array(output)], { type: 'video/mp4' });
  } catch (error) {
    if (signal.aborted) throw error;
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(reason + (logs.length ? ' · ' + logs.slice(-8).join(' ') : ''));
  } finally { signal.removeEventListener('abort', abort); encoder.terminate(); }
}
