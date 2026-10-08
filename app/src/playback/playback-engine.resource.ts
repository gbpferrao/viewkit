import { computed, ref, watch, nextTick } from 'vue';
import type { ProjectStore } from '../timeline/project-timeline.state';
import { isActive } from '../timeline/timeline.model';
import { FPS, quantize } from '../shared/frame-math.contract';
import { createAudioGain } from './audio-gain.adapter';

export function createPlayback(project: ProjectStore) {
  const time = ref(0), playing = ref(false), busy = ref(false), level = ref(0), error = ref('');
  const media = new Map<string, HTMLMediaElement>();
  const clipById = computed(() => new Map(project.clips.map(clip => [clip.id, clip])));
  const audio = createAudioGain();
  let animation = 0, origin = 0;
  const failed = new Set<string>();
  const gainDraft = new Map<string, number>();
  function pause() {
    playing.value = false; busy.value = false; cancelAnimationFrame(animation);
    for (const element of media.values()) element.pause();
    level.value = 0;
  }
  function sync() {
    let stalled = false;
    for (const [id, element] of media) {
      const clip = clipById.value.get(id);
      if (!clip || !isActive(clip, time.value) || failed.has(id)) { element.pause(); continue; }
      const desired = Math.min(clip.offset + time.value - clip.start, clip.offset + clip.duration - 0.001);
      audio.set(element, gainDraft.get(id) ?? clip.volume);
      if (!element.seeking && element.readyState >= 1 && Math.abs(element.currentTime - desired) > (playing.value ? 2 / FPS : 0.001)) {
        element.currentTime = Math.max(0, desired);
      }
      if (element.seeking || element.readyState < 3) {
        stalled = true; element.pause();
      } else if (playing.value && element.paused) {
        void element.play().catch(reason => { failed.add(id); error.value = 'preview could not play this clip: ' + reason.message; project.message = error.value; });
      } else if (!playing.value) element.pause();
    }
    return stalled;
  }
  function tick(stamp: number) {
    if (!playing.value) return;
    const stalled = sync();
    busy.value = stalled;
    if (stalled) origin = stamp - time.value * 1000;
    else {
      const next = quantize((stamp - origin) / 1000);
      if (next >= project.end) { time.value = project.end; pause(); return; }
      time.value = Math.max(0, next); level.value = audio.level();
    }
    animation = requestAnimationFrame(tick);
  }
  async function play() {
    if (!project.clips.length) { project.message = 'add media to the timeline to play'; return; }
    if (time.value >= project.end) time.value = 0;
    playing.value = true; await nextTick(); sync(); await audio.resume();
    origin = performance.now() - time.value * 1000;
    animation = requestAnimationFrame(tick);
  }
  function seek(value: number) {
    time.value = Math.max(0, Math.min(project.end, quantize(value)));
    origin = performance.now() - time.value * 1000;
    void nextTick(sync);
  }
  function register(id: string, element: HTMLMediaElement | null) {
    const previous = media.get(id);
    if (previous === element) return;
    if (previous) { previous.pause(); previous.onerror = null; previous.onloadeddata = null; previous.onseeked = null; audio.detach(previous); media.delete(id); }
    if (element) {
      media.set(id, element);
      element.onerror = () => { failed.add(id); error.value = 'preview decode failed; the project is unchanged'; project.message = error.value; };
      element.onloadeddata = () => { sync(); if (playing.value) void audio.resume(); };
      element.onseeked = () => sync();
      void nextTick(sync);
    }
  }
  const stopWatch = watch(() => [project.clips, project.stage], () => { if (time.value > project.end) seek(project.end); void nextTick(sync); }, { deep: true });
  return { time, playing, busy, level, error, register, seek, play, pause,
    previewVolume: (ids: string[], volume: number) => { for (const id of ids) gainDraft.set(id, volume); sync(); },
    clearVolumePreview: () => { gainDraft.clear(); sync(); },
    toggle: () => playing.value ? pause() : void play(),
    step: (delta: number) => { pause(); seek(time.value + delta / FPS); },
    reset: () => { pause(); time.value = 0; failed.clear(); gainDraft.clear(); error.value = ''; },
    dispose: () => { pause(); stopWatch(); for (const element of media.values()) { element.pause(); element.removeAttribute('src'); element.load(); } media.clear(); audio.dispose(); }
  };
}
