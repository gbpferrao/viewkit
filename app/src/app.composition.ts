import { inject, ref, type InjectionKey } from 'vue';
import { useProject } from './timeline/project-timeline.state';
import { createHistory } from './timeline/history-clipboard.workflow';
import { createTimelineEdits } from './timeline/edit-timeline.workflow';
import { createStageEdits } from './stage/stage-layout.workflow';
import { createImporter } from './media/import-files.adapter';
import { createPlayback } from './playback/playback-engine.resource';
import { createExporter } from './export/export-mp4.workflow';
import { createPreview } from './stage/preview-stage.state';
import { createProjectStorage } from './timeline/project-storage.resource';

export function createEditor() {
  const project = useProject();
  const mediaDrag = ref<string | null>(null);
  const storage = createProjectStorage(project);
  const history = createHistory(project);
  const timeline = createTimelineEdits(project, history);
  const stage = createStageEdits(project, history);
  const importer = createImporter(project);
  const playback = createPlayback(project);
  const exporter = createExporter(project, playback.pause);
  const preview = createPreview(project, playback);
  function clear() {
    mediaDrag.value = null;
    exporter.cancel(); exporter.release(); importer.cancel(); playback.reset(); history.clear(); project.reset();
  }
  function removeMedia(id: string) { playback.pause(); history.forgetSource(id); project.removeSource(id); }
  function dispose() { storage.dispose(); exporter.cancel(); exporter.release(); importer.cancel(); playback.dispose(); project.reset(); }
  return { project, mediaDrag, history, timeline, stage, importer, playback, exporter, preview, clear, removeMedia, dispose };
}
export type Editor = ReturnType<typeof createEditor>;
export const editorKey: InjectionKey<Editor> = Symbol('editor');
export function useEditor() { const editor = inject(editorKey); if (!editor) throw new Error('editor composition is missing'); return editor; }

