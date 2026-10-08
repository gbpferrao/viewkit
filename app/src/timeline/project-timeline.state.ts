import { computed, ref, markRaw } from 'vue';
import { defineStore } from 'pinia';
import { defaultStage } from '../stage/stage-size.model';
import type { StageSize } from '../stage/stage-size.model';
import { cloneClips, timelineEnd } from './timeline.model';
import type { Clip, MediaSource } from './timeline.model';

export interface ProjectSnapshot { clips: Clip[]; stage: StageSize }
export const useProject = defineStore('project', () => {
  const name = ref('untitled project');
  const sources = ref<MediaSource[]>([]);
  const clips = ref<Clip[]>([]);
  const stage = ref(defaultStage());
  const selection = ref<string[]>([]);
  const snapping = ref(true), autofill = ref(false);
  const message = ref('everything stays on this device');
  const generation = ref(0), importing = ref(false);
  const end = computed(() => timelineEnd(clips.value));
  const selected = computed(() => clips.value.filter(clip => selection.value.includes(clip.id)));
  function snapshot(): ProjectSnapshot { return { clips: cloneClips(clips.value), stage: { ...stage.value } }; }
  function restore(next: ProjectSnapshot) {
    clips.value = cloneClips(next.clips); stage.value = { ...next.stage };
    selection.value = selection.value.filter(id => clips.value.some(clip => clip.id === id));
  }
  function addSource(source: MediaSource) { sources.value.push({ ...source, file: markRaw(source.file) }); }
  function renameSource(id: string, value: string) {
    const name = value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 120);
    if (!name) return;
    sources.value = sources.value.map(source => source.id === id ? { ...source, name } : source);
  }
  function removeSource(id: string) {
    const source = sources.value.find(item => item.id === id); if (!source) return;
    clips.value = clips.value.filter(clip => clip.sourceId !== id);
    selection.value = selection.value.filter(id => clips.value.some(clip => clip.id === id));
    sources.value = sources.value.filter(item => item.id !== id); URL.revokeObjectURL(source.url);
    message.value = 'media deleted';
  }
  function select(ids: string[]) { selection.value = [...new Set(ids)].filter(id => clips.value.some(clip => clip.id === id)); }
  function rename(value: string) { name.value = value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 80) || 'untitled project'; }
  function reset() {
    generation.value++;
    name.value = 'untitled project';
    for (const source of sources.value) URL.revokeObjectURL(source.url);
    sources.value = []; clips.value = []; stage.value = defaultStage(); selection.value = [];
    snapping.value = true; autofill.value = false; importing.value = false;
    message.value = 'fresh project. import something to begin.';
  }
  return { name, rename, sources, clips, stage, selection, selected, snapping, autofill, message, generation, importing, end, snapshot, restore, addSource, renameSource, removeSource, select, reset };
});
export type ProjectStore = ReturnType<typeof useProject>;

