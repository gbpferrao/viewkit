import { reactive } from 'vue';
import type { ProjectStore } from '../timeline/project-timeline.state';
import { encodeMp4 } from './mp4-encode.adapter';
import { timelineEnd } from '../timeline/timeline.model';
import { FPS } from '../shared/frame-math.contract';

export function createExporter(project: ProjectStore, pause: () => void) {
  const state = reactive({ busy: false, phase: 'idle' as 'idle' | 'ad-ready' | 'ad-playing' | 'rendering', adRemaining: 5, progress: 0, currentFrame: 0, totalFrames: 0, estimatedFrames: false, label: '', error: '' });
  let controller: AbortController | null = null;
  let outputUrl: string | null = null;
  let adTimer = 0;
  function cancel() {
    window.clearTimeout(adTimer); adTimer = 0; controller?.abort();
    if (state.phase !== 'rendering') { state.busy = false; state.phase = 'idle'; controller = null; }
  }
  function release() { if (outputUrl) URL.revokeObjectURL(outputUrl); outputUrl = null; }
  function start() {
    if (state.busy) return;
    if (!project.clips.length) { project.message = 'add a clip before exporting'; return; }
    pause();
    controller = new AbortController();
    state.busy = true; state.phase = 'ad-ready'; state.adRemaining = 5;
    state.progress = 0; state.error = ''; state.label = 'watch an ad to export your project';
  }
  function watchAd() {
    if (state.phase !== 'ad-ready' || !controller || controller.signal.aborted) return;
    state.phase = 'ad-playing'; state.label = 'watching ad';
    const started = performance.now();
    function tick() {
      if (state.phase !== 'ad-playing' || !controller || controller.signal.aborted) return;
      const elapsed = performance.now() - started;
      state.adRemaining = Math.max(0, Math.ceil((5000-elapsed)/1000));
      state.progress = Math.min(1, elapsed/5000);
      if (elapsed >= 5000) { adTimer = 0; void render(); }
      else adTimer = window.setTimeout(tick, 100);
    }
    tick();
  }
  async function render() {
    if (!controller || controller.signal.aborted || state.phase !== 'ad-playing') return;
    const activeController = controller;
    release();
    const signal = controller.signal, generation = project.generation;
    const snapshot = project.snapshot();
    const sources = project.sources.filter(source => snapshot.clips.some(clip => clip.sourceId === source.id));
    state.phase = 'rendering'; state.progress = 0; state.currentFrame = 0; state.totalFrames = Math.round(timelineEnd(snapshot.clips) * FPS); state.estimatedFrames = false; state.label = 'preparing your mp4';
    try {
      const blob = await encodeMp4(snapshot, sources, signal, (progress, label, currentFrame = 0, estimated = false) => {
        if (signal.aborted || controller !== activeController) return;
        state.progress = Math.max(0, Math.min(1, progress)); state.label = label;
        state.currentFrame = Math.max(0, Math.min(state.totalFrames, Math.round(currentFrame))); state.estimatedFrames = estimated;
      });
      if (signal.aborted || generation !== project.generation) return;
      outputUrl = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = outputUrl; link.download = 'viewkit-' + new Date().toISOString().replace(/[:.]/g, '-') + '.mp4';
      link.click(); project.message = 'mp4 exported. your project is still here.';
    } catch (error) {
      if (signal.aborted) state.label = 'export cancelled';
      else { state.error = error instanceof Error ? error.message : 'export failed'; project.message = state.error; }
    } finally { if (controller === activeController) { state.busy = false; state.phase = 'idle'; controller = null; } }
  }
  return { state, start, watchAd, cancel, release };
}
