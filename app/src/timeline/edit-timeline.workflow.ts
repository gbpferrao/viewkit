import { cloneClips, closeVacatedGaps, moveClips, splitClip, trimClip, reorderLaneClips } from './timeline.model';
import type { Clip, ClipReorder } from './timeline.model';
import type { ProjectStore } from './project-timeline.state';
import type { History } from './history-clipboard.workflow';
import { defaultTransform } from '../stage/stage-size.model';
import { quantize, FPS } from '../shared/frame-math.contract';

export function createTimelineEdits(project: ProjectStore, history: History) {
  const id = () => crypto.randomUUID();
  function apply(clips: Clip[]) { history.commit({ clips, stage: { ...project.stage } }); }
  function safely(action: () => void) {
    try { action(); } catch (error) { project.message = error instanceof Error ? error.message : 'edit failed'; }
  }
  return {
    apply,
    place(sourceId: string, start: number, lane: number) {
      safely(() => {
        const source = project.sources.find(item => item.id === sourceId);
        if (!source) throw new Error('source is no longer available');
        const duration = Math.floor(source.duration * FPS) / FPS;
        const clip: Clip = { id: id(), sourceId, start: Math.max(0, quantize(start)), duration, offset: 0, lane, volume: 100,
          order: Math.max(0, ...project.clips.map(item => item.order)) + 1, transform: defaultTransform() };
        apply([...cloneClips(project.clips), clip]); project.select([clip.id]);
      });
    },
    commitMove(ids: string[], delta: number, laneDelta: number, reorder: ClipReorder | null = null) {
      safely(() => {
        const before = cloneClips(project.clips);
        let next = moveClips(before, ids, delta, laneDelta);
        if (project.autofill && delta < 0) next = closeVacatedGaps(before, next, before.filter(clip => ids.includes(clip.id)));
        next = reorderLaneClips(next, ids, reorder);
        apply(next);
      });
    },
    commitTrim(clipId: string, edge: 'start' | 'end', time: number) {
      safely(() => apply(project.clips.map(clip => clip.id === clipId
        ? trimClip(clip, edge, time, project.sources.find(source => source.id === clip.sourceId)!.duration) : clip)));
    },
    split(time: number) {
      safely(() => {
        const targets = project.selection.length ? project.selection : project.clips.filter(clip => time > clip.start && time < clip.start + clip.duration).map(clip => clip.id);
        const affected: string[] = [];
        const next = project.clips.flatMap(clip => {
          if (!targets.includes(clip.id)) return [clip];
          const parts = splitClip(clip, time, id); affected.push(...parts.map(part => part.id)); return parts;
        });
        if (next.length === project.clips.length) project.message = 'place the playhead inside a clip to split';
        apply(next); project.select(affected);
      });
    },
    remove() {
      safely(() => {
        const removed = project.selected;
        let next = project.clips.filter(clip => !project.selection.includes(clip.id));
        if (project.autofill) next = closeVacatedGaps(project.clips, next, removed);
        apply(next); project.select([]);
      });
    },
    setVolume(value: number) {
      safely(() => apply(project.clips.map(clip => project.selection.includes(clip.id) ? { ...clip, volume: value } : clip)));
    },
    paste(time: number) {
      safely(() => {
        const copied = history.clipboard();
        if (!copied.length) { project.message = 'copy clips before pasting'; return; }
        const origin = Math.min(...copied.map(clip => clip.start));
        let order = Math.max(0, ...project.clips.map(clip => clip.order));
        const pasted = copied.map(clip => ({ ...clip, id: id(), start: quantize(Math.max(0, time) + clip.start - origin), order: ++order }));
        apply([...project.clips, ...pasted]); project.select(pasted.map(clip => clip.id));
      });
    }
  };
}
