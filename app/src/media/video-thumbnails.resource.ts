import type { MediaSource } from '../timeline/timeline.model';
import { ref } from 'vue';

/** One silent decoder, serialized seeks, and a bounded cache shared by visible timeline clips. */
export function createVideoThumbnails() {
  const video = document.createElement('video');
  video.muted = true; video.playsInline = true; video.preload = 'auto';
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 72;
  const context = canvas.getContext('2d');
  const cache = new Map<string, { sourceUrl: string; time: number; image: string }>();
  const revision = ref(0);
  let queue = Promise.resolve(), sourceUrl = '', disposed = false;
  let generation = 0;
  let cancelWait: (() => void) | null = null;
  function wait(event: 'loadeddata' | 'seeked', start: () => void) {
    return new Promise<void>((resolve, reject) => {
      const finish = (error?: Error) => {
        clearTimeout(timer); video.removeEventListener(event, ready); video.removeEventListener('error', failed);
        cancelWait = null; error ? reject(error) : resolve();
      };
      const ready = () => finish();
      const failed = () => finish(new Error('thumbnail decode failed'));
      const timer = setTimeout(failed, 8000);
      cancelWait = failed;
      video.addEventListener(event, ready, { once: true }); video.addEventListener('error', failed, { once: true });
      try { start(); } catch { failed(); }
    });
  }
  function request(source: MediaSource, time: number, current: () => boolean): Promise<string | null> {
    const epoch = generation;
    const valid = () => !disposed && epoch === generation && current();
    const timestamp = Math.max(0, Math.min(source.duration - 1 / 24, Math.round(time * 24) / 24));
    const key = source.url + ':' + timestamp;
    const cached = cache.get(key);
    if (cached) { cache.delete(key); cache.set(key, cached); return Promise.resolve(cached.image); }
    const job = queue.then(async () => {
      if (!valid() || !context) return null;
      const existing = cache.get(key); if (existing) return existing.image;
      try {
        if (sourceUrl !== source.url) {
          await wait('loadeddata', () => { sourceUrl = source.url; video.src = source.url; video.load(); });
        }
        if (!valid()) return null;
        if (Math.abs(video.currentTime - timestamp) > 1 / 48) await wait('seeked', () => { video.currentTime = timestamp; });
        if (!valid()) return null;
        context.fillStyle = '#111111'; context.fillRect(0, 0, 128, 72);
        const scale = Math.min(128 / video.videoWidth, 72 / video.videoHeight);
        const width = video.videoWidth * scale, height = video.videoHeight * scale;
        context.drawImage(video, (128 - width) / 2, (72 - height) / 2, width, height);
        const image = canvas.toDataURL('image/jpeg', .65);
        cache.set(key, { sourceUrl: source.url, time: timestamp, image });
        if (cache.size > 256) cache.delete(cache.keys().next().value!);
        revision.value++;
        return image;
      } catch { if (epoch === generation) sourceUrl = ''; return null; }
    });
    queue = job.then(() => undefined, () => undefined);
    return job;
  }
  /** Reuse the nearest available source frame immediately while a finer LOD is queued. */
  function peek(source: MediaSource, time: number) {
    void revision.value;
    let image: string | null = null, distance = Infinity;
    for (const entry of cache.values()) {
      if (entry.sourceUrl !== source.url) continue;
      const delta = Math.abs(entry.time - time);
      if (delta < distance) { distance = delta; image = entry.image; }
    }
    return image;
  }
  function reset() {
    generation++; cancelWait?.(); cache.clear(); revision.value++; sourceUrl = '';
    video.pause(); video.removeAttribute('src'); video.load();
  }
  function dispose() { disposed = true; reset(); canvas.width = canvas.height = 0; }
  return { request, peek, reset, dispose };
}
export type VideoThumbnails = ReturnType<typeof createVideoThumbnails>;
