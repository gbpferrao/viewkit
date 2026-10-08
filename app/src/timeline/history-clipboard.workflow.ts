import { ref } from 'vue';
import type { ProjectSnapshot, ProjectStore } from './project-timeline.state';
import { cloneClips, validateClips } from './timeline.model';
import type { Clip } from './timeline.model';
import { validateStage, validateTransform } from '../stage/stage-size.model';

export function createHistory(project: ProjectStore) {
  const past = ref<ProjectSnapshot[]>([]), future = ref<ProjectSnapshot[]>([]);
  let clipboard: Clip[] = [];
  function commit(next: ProjectSnapshot) {
    validateStage(next.stage); validateClips(next.clips, project.sources);
    for (const clip of next.clips) validateTransform(clip.transform);
    const before = project.snapshot();
    if (JSON.stringify(before) === JSON.stringify(next)) return;
    past.value.push(before);
    if (past.value.length > 50) past.value.shift();
    future.value = []; project.restore(next);
  }
  function restore(from: typeof past, to: typeof future) {
    const next = from.value.at(-1);
    if (!next) return;
    validateClips(next.clips, project.sources); validateStage(next.stage);
    const current = project.snapshot();
    const affected = next.clips.filter(clip => {
      const previous = current.clips.find(item => item.id === clip.id);
      return !previous || JSON.stringify(previous) !== JSON.stringify(clip);
    });
    to.value.push(current); from.value.pop(); project.restore(next);
    if (affected.length) project.select(affected.map(clip => clip.id));
  }
  return {
    past, future, commit,
    undo: () => restore(past, future),
    redo: () => restore(future, past),
    copy: () => { clipboard = cloneClips(project.selected); project.message = clipboard.length ? 'selection copied' : 'select clips to copy'; },
    clipboard: () => cloneClips(clipboard),
    forgetSource: (id: string) => {
      for (const stack of [past, future]) stack.value = stack.value.map(snapshot => ({ ...snapshot, clips: snapshot.clips.filter(clip => clip.sourceId !== id) }));
      clipboard = clipboard.filter(clip => clip.sourceId !== id);
    },
    clear: () => { past.value = []; future.value = []; clipboard = []; }
  };
}
export type History = ReturnType<typeof createHistory>;
