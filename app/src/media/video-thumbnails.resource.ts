import type { MediaSource } from '../timeline/timeline.model';
import { ref } from 'vue';

interface ThumbnailSheet { duration: number; images: string[] }
/** Source sheets are prepared at import/restore; navigation only reads their nested LOD samples. */
export function createVideoThumbnails() {
  const video = document.createElement('video');
  video.muted = true; video.playsInline = true; video.preload = 'auto';
  const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 72;
  const context = canvas.getContext('2d');
  const sheets = new Map<string, ThumbnailSheet>(), revision = ref(0);
  let generation = 0, disposed = false, queue = Promise.resolve();
  let cancelWait: (() => void) | null = null;
  function wait(event: 'loadeddata' | 'seeked', start: () => void) {
    return new Promise<void>((resolve, reject) => {
      const finish = (error?: Error) => {
        clearTimeout(timer); video.removeEventListener(event, ready); video.removeEventListener('error', failed);
        cancelWait = null; error ? reject(error) : resolve();
      };
      const ready = () => finish(), failed = () => finish(new Error('thumbnail decode failed'));
      const timer = setTimeout(failed, 8000); cancelWait = failed;
      video.addEventListener(event, ready, { once: true }); video.addEventListener('error', failed, { once: true });
      try { start(); } catch { failed(); }
    });
  }
  function releaseDecoder() { video.pause(); video.removeAttribute('src'); video.load(); }
  function synchronize(sources: MediaSource[]) {
    const epoch = ++generation; cancelWait?.();
    const videos = sources.filter(source => source.kind === 'video').slice(0, 256);
    const urls = new Set(videos.map(source => source.url));
    for (const url of sheets.keys()) if (!urls.has(url)) sheets.delete(url);
    // At most 256 samples total; each JPEG data URL is bounded to 32 KiB.
    const budget = Math.max(1, Math.floor(256 / Math.max(1, videos.length)));
    const count = budget === 1 ? 1 : Math.min(33, 2 ** Math.floor(Math.log2(budget - 1)) + 1);
    for (const [url, sheet] of sheets) {
      if (sheet.images.length <= count) continue;
      const images = Array.from({ length: count }, (_, index) =>
        sheet.images[Math.round(index * (sheet.images.length - 1) / Math.max(1, count - 1))]);
      sheets.set(url, { ...sheet, images });
    }
    revision.value++;
    const valid = () => !disposed && epoch === generation;
    queue = queue.then(async () => {
      if (!valid() || !context) return;
      for (const source of videos) {
        if (!valid()) return;
        if (sheets.has(source.url)) continue;
        const images: string[] = [];
        try {
          await wait('loadeddata', () => { video.src = source.url; video.load(); });
          for (let index = 0; index < count; index++) {
            if (!valid()) return;
            const time = Math.max(0, source.duration - 1 / 24) * index / Math.max(1, count - 1);
            if (Math.abs(video.currentTime - time) > 1 / 48) await wait('seeked', () => { video.currentTime = time; });
            if (!valid()) return;
            context.fillStyle = '#111111'; context.fillRect(0, 0, 128, 72);
            const scale = Math.min(128 / video.videoWidth, 72 / video.videoHeight);
            const width = video.videoWidth * scale, height = video.videoHeight * scale;
            context.drawImage(video, (128 - width) / 2, (72 - height) / 2, width, height);
            const image = canvas.toDataURL('image/jpeg', .55);
            if (image.length > 32768) throw new Error('thumbnail exceeds memory budget');
            images.push(image);
          }
          if (!valid()) return;
          // Publish a completed sheet atomically; zoom never initiates decoding.
          sheets.set(source.url, { duration: source.duration, images }); revision.value++;
        } catch { if (!valid()) return; }
      }
      if (valid()) releaseDecoder();
    });
  }
  function peek(source: MediaSource, time: number, detailSeconds: number) {
    void revision.value;
    const sheet = sheets.get(source.url); if (!sheet) return null;
    const intervals = sheet.images.length - 1;
    if (!intervals) return sheet.images[0];
    const duration = Math.max(1 / 24, sheet.duration - 1 / 24), spacing = duration / intervals;
    const stride = Math.min(intervals, 2 ** Math.max(0, Math.round(Math.log2(Math.max(1, detailSeconds / spacing)))));
    const index = Math.max(0, Math.min(intervals, Math.round(time / spacing / stride) * stride));
    return sheet.images[index];
  }
  function reset() { generation++; cancelWait?.(); sheets.clear(); revision.value++; releaseDecoder(); }
  function dispose() { disposed = true; reset(); canvas.width = canvas.height = 0; }
  return { synchronize, peek, reset, dispose };
}
export type VideoThumbnails = ReturnType<typeof createVideoThumbnails>;
