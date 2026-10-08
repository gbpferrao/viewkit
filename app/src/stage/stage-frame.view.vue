<script setup lang="ts">
import ActionButton from '../interface/action-button.view.vue';
import InterfaceIcon from '../interface/interface-icon.view.vue';
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useEditor } from '../app.composition';
import { formatTime } from '../shared/frame-math.contract';
import { videoWorldSize } from './stage-size.model';
import type { StageTransform } from './stage-size.model';
import type { Clip } from '../timeline/timeline.model';
import StageHandles from './stage-handles.view.vue';
import StageSelection from './stage-selection.view.vue';
import { objectCorners } from './selection-bounds.model';
import { createGpuCompositor } from './gpu-compositor.resource';
import type { RenderLayer } from './gpu-compositor.resource';
const { project, stage, playback, preview } = useEditor();
const viewport = ref<HTMLElement>();
const previewCanvas = ref<HTMLCanvasElement>();
const gpuPreview = ref(false);
let compositor: Awaited<ReturnType<typeof createGpuCompositor>> | null = null;
let previewFrame = 0, disposed = false;
const sceneVideos = new Map<string, HTMLVideoElement>();
const videoCallbacks = new Map<string, number>();
function queuePreview() {
  if (!compositor || previewFrame || disposed) return;
  previewFrame = requestAnimationFrame(drawPreview);
}
function drawPreview() {
  previewFrame = 0;
  if (!compositor || !previewCanvas.value || disposed) return;
  try {
    const canvas = previewCanvas.value, pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.min(project.stage.width, Math.round(project.stage.width * scale.value * pixelRatio)));
    const height = Math.max(1, Math.round(width * project.stage.height / project.stage.width));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    const layers: RenderLayer[] = [];
    for (const clip of preview.value) {
      const video = sceneVideos.get(clip.id), source = sourceFor(clip);
      if (source.kind !== 'video' || !video || video.readyState < 2 || video.seeking) continue;
      layers.push({ id: clip.id, source: video, width: source.width, height: source.height, transform: transformFor(clip) });
    }
    compositor.render(layers, project.stage); gpuPreview.value = true;
  } catch {
    gpuPreview.value = false; compositor.dispose(); compositor = null;
  }
}
function observeVideo(id: string, video: HTMLVideoElement) {
  if (typeof video.requestVideoFrameCallback !== 'function') return;
  const token = video.requestVideoFrameCallback(() => {
    videoCallbacks.delete(id);
    if (disposed || sceneVideos.get(id) !== video) return;
    queuePreview(); observeVideo(id, video);
  });
  videoCallbacks.set(id, token);
}
function registerVideo(id: string, element: HTMLVideoElement | null) {
  const previous = sceneVideos.get(id);
  if (previous === element) return;
  if (previous) {
    const token = videoCallbacks.get(id); if (token !== undefined) previous.cancelVideoFrameCallback(token);
    previous.removeEventListener('loadeddata', queuePreview); previous.removeEventListener('seeked', queuePreview);
    sceneVideos.delete(id); videoCallbacks.delete(id);
  }
  playback.register(id, element);
  if (element) {
    sceneVideos.set(id, element); element.addEventListener('loadeddata', queuePreview); element.addEventListener('seeked', queuePreview);
    observeVideo(id, element);
  }
  queuePreview();
}
const controls = ref<HTMLElement>();
const controlsNearby = ref(false);
const controlsInteracting = ref(false);
let proximityFrame = 0;
let pointerPosition: { x: number; y: number } | null = null;
function updateControlsProximity() {
  proximityFrame = 0;
  if (!controls.value || !viewport.value || !pointerPosition || gesture) { controlsNearby.value = false; return; }
  const { x, y } = pointerPosition;
  const stageRect = viewport.value.getBoundingClientRect();
  if (x < stageRect.left || x > stageRect.right || y < stageRect.top || y > stageRect.bottom) { controlsNearby.value = false; return; }
  const rect = controls.value.getBoundingClientRect();
  const distance = Math.hypot(Math.max(rect.left - x, 0, x - rect.right), Math.max(rect.top - y, 0, y - rect.bottom));
  controlsNearby.value = distance <= (controlsNearby.value ? 36 : 24);
}
function revealControls(event: PointerEvent) {
  pointerPosition = { x: event.clientX, y: event.clientY };
  if (!proximityFrame) proximityFrame = requestAnimationFrame(updateControlsProximity);
}
function leaveControlsArea() { pointerPosition = null; controlsNearby.value = false; }
function finishControls(event: PointerEvent) {
  if (!controlsInteracting.value) return;
  controlsInteracting.value = false;
  revealControls(event);
}
function blurControls() { controlsInteracting.value = false; leaveControlsArea(); }
const available = ref({ width: 700, height: 390 });
const scale = computed(() => Math.min((available.value.width - 80) / project.stage.width, (available.value.height - 80) / project.stage.height));
const selected = computed(() => project.selection.length === 1 ? preview.value.find(clip => project.selection.includes(clip.id) && sourceFor(clip).kind === 'video') : undefined);
const draft = ref<StageTransform | null>(null);
const draftClipId = ref<string | null>(null);
const time = playback.time, playing = playback.playing, busy = playback.busy;
let observer: ResizeObserver | null = null;
let gesture: { action: 'move' | 'scale' | 'rotate'; id: string; pointer: number; target: HTMLElement; x: number; y: number; centerX: number; centerY: number; start: StageTransform; distance: number; angle: number } | null = null;
let transformFrame = 0;
let pendingTransform: PointerEvent | null = null;
const sourceById = computed(() => new Map(project.sources.map(source => [source.id, source])));
function sourceFor(clip: Clip) { return sourceById.value.get(clip.sourceId)!; }
function transformFor(clip: Clip) { return draftClipId.value === clip.id && draft.value ? draft.value : clip.transform; }
const activeClipIds = computed(() => new Set(preview.value.map(clip => clip.id)));
const selectionObjects = computed(() => project.selected.filter(clip => sourceFor(clip).kind === 'video').map(clip => ({
  id: clip.id, active: activeClipIds.value.has(clip.id), corners: objectCorners(sourceFor(clip), project.stage, transformFor(clip))
})));
const selectionLayers = computed(() => preview.value.filter(clip => sourceFor(clip).kind === 'video').map(clip => ({
  id: clip.id, corners: objectCorners(sourceFor(clip), project.stage, transformFor(clip))
})));
const inactiveSelectionCount = computed(() => project.selected.filter(clip => !activeClipIds.value.has(clip.id)).length);
const audioSelectionCount = computed(() => project.selected.filter(clip => sourceFor(clip).kind === 'audio').length);
watch(() => [preview.value, project.stage, draftClipId.value, draft.value, available.value, playback.time.value], queuePreview);
function videoStyle(clip: Clip) {
  const size = videoWorldSize(sourceFor(clip)), transform = transformFor(clip);
  return { width: size.width + 'px', height: size.height + 'px',
    transform: 'translate(-50%, -50%) translate(' + transform.x + 'px,' + transform.y + 'px) rotate(' + transform.rotation + 'deg) scale(' + transform.scaleX + ',' + transform.scaleY + ')' };
}
function begin(event: PointerEvent, action: 'move' | 'scale' | 'rotate') {
  if (event.button !== 0 || !selected.value || gesture) return;
  event.preventDefault(); playback.pause();
  const clip = selected.value, rect = viewport.value!.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2 + clip.transform.x * scale.value;
  const centerY = rect.top + rect.height / 2 + clip.transform.y * scale.value;
  const target = event.currentTarget as HTMLElement;
  gesture = { action, id: clip.id, pointer: event.pointerId, target, x: event.clientX, y: event.clientY, centerX, centerY, start: { ...clip.transform },
    distance: Math.max(1, Math.hypot(event.clientX - centerX, event.clientY - centerY)), angle: Math.atan2(event.clientY - centerY, event.clientX - centerX) };
  draftClipId.value = clip.id; draft.value = { ...clip.transform };
  target.setPointerCapture(event.pointerId);
}
function move(event: PointerEvent) {
  if (!gesture || event.pointerId !== gesture.pointer) return;
  pendingTransform = event;
  if (!transformFrame) transformFrame = requestAnimationFrame(() => {
    transformFrame = 0;
    const latest = pendingTransform; pendingTransform = null;
    if (latest) updateTransform(latest);
  });
}
function updateTransform(event: PointerEvent) {
  if (!gesture || event.pointerId !== gesture.pointer) return;
  const next = { ...gesture.start };
  if (gesture.action === 'move') { next.x += (event.clientX - gesture.x) / scale.value; next.y += (event.clientY - gesture.y) / scale.value; }
  else if (gesture.action === 'scale') {
    const ratio = Math.hypot(event.clientX - gesture.centerX, event.clientY - gesture.centerY) / gesture.distance;
    next.scaleX = Math.max(0.05, Math.min(10, next.scaleX * ratio)); next.scaleY = Math.max(0.05, Math.min(10, next.scaleY * ratio));
  } else next.rotation += (Math.atan2(event.clientY - gesture.centerY, event.clientX - gesture.centerX) - gesture.angle) * 180 / Math.PI;
  draft.value = next;
}
function end(event: PointerEvent) {
  if (!gesture || event.pointerId !== gesture.pointer) return;
  updateTransform(event);
  if (draft.value) stage.setTransform(gesture.id, draft.value);
  cancel();
}
function cancel() {
  cancelAnimationFrame(transformFrame); transformFrame = 0; pendingTransform = null;
  const previous = gesture; gesture = null; draftClipId.value = null; draft.value = null;
  if (previous?.target.hasPointerCapture(previous.pointer)) previous.target.releasePointerCapture(previous.pointer);
}
function cancelPointer(event: PointerEvent) { if (event.pointerId === gesture?.pointer) cancel(); }
watch(() => [project.generation, project.selection.join('|'), playback.time.value], cancel);
function key(event: KeyboardEvent) { if (event.key === 'Escape') cancel(); }
onMounted(() => {
  observer = new ResizeObserver(entries => { const rect = entries[0].contentRect; available.value = { width: rect.width, height: rect.height }; });
  observer.observe(viewport.value!);
  void createGpuCompositor(previewCanvas.value!).then(renderer => {
    if (disposed) { renderer.dispose(); return; }
    compositor = renderer; queuePreview();
  }).catch(() => { gpuPreview.value = false; });
});
window.addEventListener('pointermove', move); window.addEventListener('pointerup', end); window.addEventListener('keydown', key);
window.addEventListener('pointercancel', cancelPointer); window.addEventListener('blur', cancel);
window.addEventListener('pointerup', finishControls); window.addEventListener('pointercancel', finishControls); window.addEventListener('blur', blurControls);
onBeforeUnmount(() => {
  disposed = true; cancelAnimationFrame(previewFrame); compositor?.dispose(); compositor = null;
  for (const [id, video] of sceneVideos) {
    const token = videoCallbacks.get(id); if (token !== undefined) video.cancelVideoFrameCallback(token);
    video.removeEventListener('loadeddata', queuePreview); video.removeEventListener('seeked', queuePreview);
  }
  sceneVideos.clear(); videoCallbacks.clear();
  cancel(); cancelAnimationFrame(proximityFrame); observer?.disconnect(); window.removeEventListener('pointercancel', cancelPointer); window.removeEventListener('blur', cancel); window.removeEventListener('pointerup', finishControls); window.removeEventListener('pointercancel', finishControls); window.removeEventListener('blur', blurControls); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); window.removeEventListener('keydown', key);
});
</script>
<template>
  <section class="stage-panel">
    <div ref="viewport" class="stage-viewport" @pointermove="revealControls" @pointerleave="leaveControlsArea">
      <div class="stage-screen" :style="{ width: project.stage.width * scale + 'px', height: project.stage.height * scale + 'px' }">
        <div class="stage-canvas" :style="{ width: project.stage.width + 'px', height: project.stage.height + 'px', transform: 'scale(' + scale + ')' }">
          <template v-for="clip in preview" :key="clip.id" v-memo="[clip, transformFor(clip), project.stage.width, project.stage.height, sourceFor(clip)]">
            <video v-if="sourceFor(clip).kind === 'video'" :ref="element => registerVideo(clip.id, element as HTMLVideoElement | null)" class="stage-video" :src="sourceFor(clip).url" :style="videoStyle(clip)" preload="auto" playsinline @pointerdown="project.select([clip.id])"/>
            <audio v-else :ref="element => playback.register(clip.id, element as HTMLAudioElement | null)" :src="sourceFor(clip).url" preload="auto"/>
          </template>
        </div>
        <canvas ref="previewCanvas" class="stage-gpu-preview" :class="{ ready: gpuPreview }" aria-hidden="true"></canvas>
        <span v-if="!project.clips.length" class="stage-placeholder"><span class="stage-placeholder-mark"><InterfaceIcon name="play-btn"/></span>make room for your next cut</span>
      </div>
      <div class="stage-handle-layer" :style="{ width: project.stage.width * scale + 'px', height: project.stage.height * scale + 'px' }">
        <StageSelection :stage="project.stage" :scale="scale" :objects="selectionObjects" :layers="selectionLayers"/>
        <StageHandles v-if="selected" :clip="selected" :source="sourceFor(selected)" :stage="project.stage" :transform="transformFor(selected)" :preview-scale="scale" @begin="begin"/>
      </div>
      <span v-if="inactiveSelectionCount || audioSelectionCount" class="stage-selection-status" role="status"><span v-if="inactiveSelectionCount"><InterfaceIcon name="clock"/>{{ inactiveSelectionCount }} selected outside playhead time</span><span v-if="audioSelectionCount"><InterfaceIcon name="music-note-beamed"/>{{ audioSelectionCount }} audio selected</span></span>
      <span v-if="busy" class="decode-badge" role="status">buffering preview…</span>
      <span v-else-if="playback.error.value" class="decode-badge" role="status">{{ playback.error.value }}</span>
      <div ref="controls" class="stage-controls" :class="{ visible: controlsNearby || controlsInteracting }" role="group" aria-label="playback controls" @pointerdown="controlsInteracting = true">
    <div class="transport">
      <span class="timecode">{{ formatTime(time) }}</span>
      <div class="transport-buttons"><ActionButton variant="quiet" size="compact" shape="circle" class="icon-button" title="go to start" aria-label="go to start" @click="playback.pause(); playback.seek(0)"><InterfaceIcon name="skip-start-fill"/></ActionButton><ActionButton variant="quiet" size="compact" shape="circle" class="icon-button" title="previous frame" aria-label="previous frame" @click="playback.step(-1)"><InterfaceIcon name="caret-left-fill"/></ActionButton><ActionButton variant="primary" size="regular" shape="circle" class="play-button" :aria-label="playing ? 'pause' : 'play'" @click="playback.toggle()"><InterfaceIcon :name="playing ? 'pause-fill' : 'play-fill'"/></ActionButton><ActionButton variant="quiet" size="compact" shape="circle" class="icon-button" title="next frame" aria-label="next frame" @click="playback.step(1)"><InterfaceIcon name="caret-right-fill"/></ActionButton><ActionButton variant="quiet" size="compact" shape="circle" class="icon-button" title="go to end" aria-label="go to end" @click="playback.pause(); playback.seek(project.end)"><InterfaceIcon name="skip-end-fill"/></ActionButton></div>
    </div>
    <input class="scrub-range" aria-label="playhead" type="range" min="0" :max="project.end || 1" :step="1/24" :value="time" @input="playback.seek(Number(($event.target as HTMLInputElement).value))"/>
      </div>
    </div>
  </section>
</template>
