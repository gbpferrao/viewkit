import { computed } from 'vue';
import type { ProjectStore } from '../timeline/project-timeline.state';
import type { createPlayback } from '../playback/playback-engine.resource';
import { isActive, renderOrder } from '../timeline/timeline.model';
export function createPreview(project: ProjectStore, playback: ReturnType<typeof createPlayback>) {
  const ordered = computed(() => renderOrder(project.clips));
  // Preserve the array identity between clip boundaries so frame ticks do not rerender stage layers.
  return computed<ReturnType<typeof renderOrder>>((previous) => {
    const active = ordered.value.filter(clip => isActive(clip, playback.time.value));
    if (previous && previous.length === active.length && active.every((clip, index) => clip === previous[index])) return previous;
    return active;
  });
}

