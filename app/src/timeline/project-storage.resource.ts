import { watch } from 'vue';
import type { ProjectStore } from './project-timeline.state';
import { validateClips } from './timeline.model';
import type { MediaSource } from './timeline.model';
import { validateStage, validateTransform } from '../stage/stage-size.model';

// One current project, with media stored separately so ordinary edits never copy blobs again.
let database: Promise<IDBDatabase> | undefined;
function openDatabase() {
  return database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('viewkit-project', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('project');
      request.result.createObjectStore('media', { keyPath: 'id' });
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => { request.result.close(); database = undefined; };
      resolve(request.result);
    };
    request.onerror = () => { database = undefined; reject(request.error); };
    request.onblocked = () => { database = undefined; reject(new Error('browser storage is busy')); };
  });
}
function completed(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error('save interrupted'));
    transaction.onerror = () => reject(transaction.error);
  });
}
function read<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function restoreStoredProject(project: ProjectStore) {
  const urls: string[] = [];
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['project', 'media'], 'readonly');
    const [record, stored] = await Promise.all([
      read(transaction.objectStore('project').get('current')),
      read(transaction.objectStore('media').getAll())
    ]);
    if (!record) return;
    if (record.version !== 1 || typeof record.name !== 'string' ||
        typeof record.snapping !== 'boolean' || typeof record.autofill !== 'boolean' ||
        !Array.isArray(record.clips)) throw new Error('invalid saved project');
    validateStage(record.stage);
    const ids = new Set<string>();
    const sources: MediaSource[] = stored.map(item => {
      if (typeof item.id !== 'string' || ids.has(item.id) || typeof item.name !== 'string' ||
          !['audio', 'video'].includes(item.kind) || !(item.file instanceof Blob) || !item.file.size ||
          !Number.isFinite(item.duration) || item.duration < 1 / 24 ||
          !Number.isFinite(item.width) || !Number.isFinite(item.height) ||
          (item.kind === 'video' && (item.width <= 0 || item.height <= 0))) throw new Error('invalid saved media');
      ids.add(item.id);
      const file = item.file instanceof File ? item.file : new File([item.file], item.name, { type: item.file.type });
      const url = URL.createObjectURL(file); urls.push(url);
      return { id: item.id, name: item.name, kind: item.kind, duration: item.duration,
        width: item.width, height: item.height, file, url };
    });
    for (const clip of record.clips) {
      if (typeof clip.id !== 'string' || typeof clip.sourceId !== 'string' ||
          !clip.transform || !['x', 'y', 'scaleX', 'scaleY', 'rotation'].every(key => Number.isFinite(clip.transform[key]))) {
        throw new Error('invalid saved clip');
      }
      validateTransform(clip.transform);
    }
    validateClips(record.clips, sources);
    project.rename(record.name);
    for (const source of sources) project.addSource(source);
    project.restore({ clips: record.clips, stage: record.stage });
    project.snapping = record.snapping; project.autofill = record.autofill;
    project.message = 'saved project restored';
  } catch {
    for (const url of urls) URL.revokeObjectURL(url);
    project.message = 'could not restore browser storage. start a new project or try reloading.';
  }
}

export function createProjectStorage(project: ProjectStore) {
  let timer = 0;
  let queue = Promise.resolve();
  let storedIds: Set<string> | null = null;
  let storedNames = new Map<string, string>();
  function save() {
    window.clearTimeout(timer); timer = 0;
    const generation = project.generation;
    const snapshot = project.snapshot();
    const record = { version: 1, name: project.name, ...snapshot, snapping: project.snapping, autofill: project.autofill };
    const sources = project.sources.map(({ id, name, kind, duration, width, height, file }) =>
      ({ id, name, kind, duration, width, height, file }));
    queue = queue.then(async () => {
      const db = await openDatabase();
      const transaction = db.transaction(['project', 'media'], 'readwrite');
      const done = completed(transaction);
      // Attach the rejection handler immediately, including failures during key discovery.
      void done.catch(() => {});
      const media = transaction.objectStore('media');
      if (!storedIds) storedIds = new Set((await read(media.getAllKeys())).map(String));
      const nextIds = new Set(sources.map(source => source.id));
      // Empty projects clear every stored blob, including any unreadable prior record.
      if (!sources.length) media.clear();
      else {
        for (const id of storedIds) if (!nextIds.has(id)) media.delete(id);
        for (const source of sources) if (!storedIds.has(source.id) || storedNames.get(source.id) !== source.name) media.put(source);
      }
      transaction.objectStore('project').put(record, 'current');
      await done;
      storedIds = nextIds;
      storedNames = new Map(sources.map(source => [source.id, source.name]));
    }).catch(() => {
      if (generation === project.generation) project.message = 'browser save failed. free some storage; this project is still open.';
    });
  }
  const stop = watch(() => [project.name, project.clips, project.stage, project.snapping, project.autofill,
    project.sources.map(source => [source.id, source.name])], () => {
    window.clearTimeout(timer); timer = window.setTimeout(save, 150);
  }, { deep: true });
  const stopReset = watch(() => project.generation, save, { flush: 'post' });
  const flush = () => { if (timer) save(); };
  const visibility = () => { if (document.visibilityState === 'hidden') flush(); };
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', visibility);
  function dispose() {
    save(); stop(); stopReset();
    window.removeEventListener('pagehide', flush);
    document.removeEventListener('visibilitychange', visibility);
  }
  return { save, dispose };
}
