import type { ProjectSnapshot } from '../timeline/project-timeline.state';
import type { MediaSource } from '../timeline/timeline.model';
import type { RenderRequest, RenderReply, RenderProgress } from './native-render.contract';

/** A disposable worker contains GPU, codec queues, demuxers, and output bytes. Abort terminates all of them. */
export function encodeNativeMp4(snapshot: ProjectSnapshot, sources: MediaSource[], signal: AbortSignal,
  onProgress: RenderProgress): Promise<Blob> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const worker = new Worker(new URL('./native-render.worker.ts', import.meta.url), { type: 'module' });
    let settled = false;
    function finish(error?: Error, blob?: Blob) {
      if (settled) return; settled = true;
      signal.removeEventListener('abort', abort); worker.terminate();
      if (error) reject(error); else resolve(blob!);
    }
    const abort = () => finish(new DOMException('export cancelled', 'AbortError'));
    signal.addEventListener('abort', abort, { once: true });
    worker.onerror = () => finish(new Error('native rendering worker failed'));
    worker.onmessageerror = () => finish(new Error('native rendering message failed'));
    worker.onmessage = (event: MessageEvent<RenderReply>) => {
      const reply = event.data;
      if (reply.type === 'progress') onProgress(reply.progress, reply.label, reply.currentFrame);
      else if (reply.type === 'error') finish(new Error(reply.message));
      else finish(undefined, new Blob([reply.buffer], { type: 'video/mp4' }));
    };
    const used = new Set(snapshot.clips.map(clip => clip.sourceId));
    const request: RenderRequest = { snapshot, sources: sources.filter(source => used.has(source.id)).map(({ url: _url, ...source }) => source) };
    try { worker.postMessage(request); } catch (error) { finish(error instanceof Error ? error : new Error('could not start renderer')); }
  });
}
