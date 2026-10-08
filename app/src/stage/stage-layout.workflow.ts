import type { ProjectStore } from '../timeline/project-timeline.state';
import type { History } from '../timeline/history-clipboard.workflow';
import { validateStage, validateTransform } from './stage-size.model';
import type { StageTransform } from './stage-size.model';
export function createStageEdits(project: ProjectStore, history: History) {
  function safely(action: () => void) { try { action(); } catch (error) { project.message = error instanceof Error ? error.message : 'stage edit failed'; } }
  return {
    setSize(width: number, height: number) {
      safely(() => { const stage = { width, height }; validateStage(stage); history.commit({ ...project.snapshot(), stage }); });
    },
    setTransform(id: string, transform: StageTransform) {
      safely(() => {
        const valid = validateTransform(transform);
        history.commit({ clips: project.clips.map(clip => clip.id === id ? { ...clip, transform: valid } : clip), stage: { ...project.stage } });
      });
    },
    setSelectedTransform(patch: Partial<StageTransform>) {
      safely(() => {
        const selected = project.selected;
        if (!selected.length) throw new Error('select a video clip to edit its transform');
        const sources = new Map(project.sources.map(source => [source.id, source]));
        if (selected.some(clip => sources.get(clip.sourceId)?.kind !== 'video')) {
          throw new Error('transforms require a selection containing only video clips');
        }
        const ids = new Set(selected.map(clip => clip.id));
        const clips = project.clips.map(clip => ids.has(clip.id)
          ? { ...clip, transform: validateTransform({ ...clip.transform, ...patch }) } : clip);
        history.commit({ clips, stage: { ...project.stage } });
      });
    }
  };
}

