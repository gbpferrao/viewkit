import type { ProjectStore } from '../timeline/project-timeline.state';
import type { MediaSource } from '../timeline/timeline.model';

const videoExtensions = new Set(['mp4', 'webm', 'mov']);
const audioExtensions = new Set(['mp3', 'wav', 'aac', 'm4a']);
export function createImporter(project: ProjectStore) {
  let queue = Promise.resolve();
  const pending = new Set<AbortController>();
  function cancel() { for (const controller of pending) controller.abort(); pending.clear(); }
  function importFiles(files: File[]) {
    const generation = project.generation;
    queue = queue.then(async () => {
      if (generation !== project.generation) return;
      project.importing = true;
      let imported = 0;
      const errors: string[] = [];
      for (const file of files) {
        if (generation !== project.generation) break;
        const controller = new AbortController(); pending.add(controller);
        try {
          const source = await probe(file, controller.signal);
          if (generation !== project.generation) { URL.revokeObjectURL(source.url); break; }
          project.addSource(source); imported++;
          if (file.size > 512 * 1024 * 1024) errors.push(file.name + ': large file; preview/export may use substantial memory');
        } catch (error) {
          if (!controller.signal.aborted) errors.push(file.name + ': ' + (error instanceof Error ? error.message : 'cannot decode'));
        } finally { pending.delete(controller); }
      }
      if (generation === project.generation) {
        project.importing = false;
        project.message = errors.length ? errors.join(' · ') : imported + ' source' + (imported === 1 ? '' : 's') + ' imported';
      }
    });
    return queue;
  }
  return { importFiles, cancel };
}

/** Probe one local source. The URL transfers to project ownership only after a valid decode. */
function probe(file: File, signal: AbortSignal): Promise<MediaSource> {
  const extension = file.name.split('.').at(-1)?.toLowerCase() ?? '';
  const kind = videoExtensions.has(extension) ? 'video' : audioExtensions.has(extension) ? 'audio' : null;
  if (!kind || !file.size) return Promise.reject(new Error('unsupported or empty media file'));
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const media = document.createElement(kind);
    media.preload = 'auto'; media.muted = true;
    let settled = false;
    const timeout = setTimeout(() => finish(new Error('decode timed out; try a supported codec')), 20000);
    const abort = () => finish(new DOMException('cancelled', 'AbortError'));
    function finish(error?: Error) {
      if (settled) return; settled = true;
      clearTimeout(timeout); signal.removeEventListener('abort', abort);
      const duration = media.duration;
      const width = kind === 'video' ? (media as HTMLVideoElement).videoWidth : 0;
      const height = kind === 'video' ? (media as HTMLVideoElement).videoHeight : 0;
      media.pause(); media.removeAttribute('src'); media.load();
      if (error) { URL.revokeObjectURL(url); reject(error); }
      else resolve({ id: crypto.randomUUID(), name: file.name, kind: kind!, file, url, duration, width, height });
    }
    media.onloadeddata = () => {
      if (!Number.isFinite(media.duration) || media.duration < 1 / 24) return finish(new Error('media must have a finite duration of at least one frame'));
      if (kind === 'video' && (!(media as HTMLVideoElement).videoWidth || !(media as HTMLVideoElement).videoHeight)) {
        return finish(new Error('video codec is not supported by this browser'));
      }
      finish();
    };
    media.onerror = () => finish(new Error('this browser cannot decode the file'));
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) { abort(); return; }
    media.src = url; media.load();
  });
}

