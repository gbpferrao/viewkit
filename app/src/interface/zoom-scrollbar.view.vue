<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue';
import type { ZoomScrollChange } from './zoom-scrollbar.contract';
const props = defineProps<{
  axis: 'horizontal' | 'vertical'; label: string; controls: string;
  contentSize: number; viewportSize: number; offset: number;
  zoom: number; minZoom: number; maxZoom: number;
}>();
const emit = defineEmits<{ scroll: [offset: number]; zoom: [change: ZoomScrollChange] }>();
const track = ref<HTMLElement>();
const dragging = ref(false);
const pointerFocus = ref(false);
const activeHandle = ref<'start' | 'end' | null>(null);
const maximum = computed(() => Math.max(0, props.contentSize - props.viewportSize));
const thumbPercent = computed(() => Math.min(100, props.viewportSize / Math.max(1, props.contentSize) * 100));
const positionPercent = computed(() => maximum.value ? Math.max(0, Math.min(1, props.offset / maximum.value)) * 100 : 0);
const thumbStyle = computed(() => props.axis === 'horizontal'
  ? { width: thumbPercent.value + '%', left: positionPercent.value + '%', transform: 'translateX(-' + positionPercent.value + '%)' }
  : { height: thumbPercent.value + '%', top: positionPercent.value + '%', transform: 'translateY(-' + positionPercent.value + '%)' });
type Drag = { mode: 'pan' | 'start' | 'end'; pointer: number; coordinate: number; offset: number; zoom: number; viewport: number; maximum: number; trackSize: number; thumbSize: number; target: HTMLElement };
let drag: Drag | null = null;
let frame = 0;
let pending: PointerEvent | null = null;
const coordinate = (event: PointerEvent) => props.axis === 'horizontal' ? event.clientX : event.clientY;
function begin(event: PointerEvent, mode: Drag['mode']) {
  if (event.button !== 0 || drag) return;
  const rect = track.value!.getBoundingClientRect();
  const trackSize = props.axis === 'horizontal' ? rect.width : rect.height;
  const thumb = track.value!.querySelector<HTMLElement>('.zoom-scroll-thumb')!.getBoundingClientRect();
  const target = event.currentTarget as HTMLElement;
  target.focus({ preventScroll: true });
  pointerFocus.value = true;
  target.setPointerCapture(event.pointerId);
  drag = { mode, pointer: event.pointerId, coordinate: coordinate(event), offset: props.offset, zoom: props.zoom,
    viewport: props.viewportSize, maximum: maximum.value, trackSize,
    thumbSize: props.axis === 'horizontal' ? thumb.width : thumb.height, target };
  dragging.value = true;
  activeHandle.value = mode === 'pan' ? null : mode;
}
// Snapshot geometry keeps pointer deltas stable while parent layout and scrollbar proportions update.
function apply(event: PointerEvent) {
  if (!drag || event.pointerId !== drag.pointer) return;
  const delta = coordinate(event) - drag.coordinate;
  if (drag.mode === 'pan') {
    const travel = Math.max(1, drag.trackSize - drag.thumbSize);
    emit('scroll', Math.max(0, Math.min(drag.maximum, drag.offset + delta / travel * drag.maximum)));
  } else {
    const span = Math.max(12, drag.thumbSize + (drag.mode === 'start' ? -delta : delta));
    const zoom = Math.max(props.minZoom, Math.min(props.maxZoom, drag.zoom * drag.thumbSize / span));
    const viewportAnchor = drag.mode === 'start' ? 1 : 0;
    emit('zoom', { zoom, initialZoom: drag.zoom, anchor: drag.offset + drag.viewport * viewportAnchor, viewportAnchor });
  }
}
function move(event: PointerEvent) {
  if (!drag || event.pointerId !== drag.pointer) return;
  pending = event;
  if (!frame) frame = requestAnimationFrame(() => { frame = 0; const latest = pending; pending = null; if (latest) apply(latest); });
}
function release() {
  cancelAnimationFrame(frame); frame = 0; pending = null;
  const previous = drag; drag = null; dragging.value = false; activeHandle.value = null;
  if (previous?.target.hasPointerCapture(previous.pointer)) previous.target.releasePointerCapture(previous.pointer);
}
function finish(event?: PointerEvent) {
  if (event && drag && event.pointerId !== drag.pointer) return;
  if (pending) apply(pending);
  release();
}
function cancel() {
  if (drag) {
    if (drag.mode === 'pan') emit('scroll', drag.offset);
    else emit('zoom', { zoom: drag.zoom, initialZoom: drag.zoom, anchor: drag.offset, viewportAnchor: 0 });
  }
  release();
}
function jump(event: PointerEvent) {
  if (event.button !== 0) return;
  const rect = track.value!.getBoundingClientRect();
  const start = props.axis === 'horizontal' ? rect.left : rect.top;
  const size = props.axis === 'horizontal' ? rect.width : rect.height;
  emit('scroll', Math.max(0, Math.min(maximum.value, (coordinate(event) - start) / Math.max(1, size) * props.contentSize - props.viewportSize / 2)));
}
function keys(event: KeyboardEvent, mode: 'pan' | 'start' | 'end') {
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancel(); return; }
  const backward = props.axis === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
  const forward = props.axis === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
  if (![backward, forward, 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault(); event.stopPropagation();
  const direction = event.key === backward || event.key === 'PageUp' ? -1 : 1;
  if (mode === 'pan') {
    const step = props.viewportSize * (event.key.startsWith('Page') ? .9 : .1);
    emit('scroll', event.key === 'Home' ? 0 : event.key === 'End' ? maximum.value : Math.max(0, Math.min(maximum.value, props.offset + step * direction)));
  } else {
    const viewportAnchor = mode === 'start' ? 1 : 0;
    const zoom = event.key === 'Home' ? props.minZoom : event.key === 'End' ? props.maxZoom
      : Math.max(props.minZoom, Math.min(props.maxZoom, props.zoom * (direction * (mode === 'start' ? 1 : -1) > 0 ? 1.1 : 1 / 1.1)));
    emit('zoom', { zoom, initialZoom: props.zoom, anchor: props.offset + props.viewportSize * viewportAnchor, viewportAnchor });
  }
}
onBeforeUnmount(release);
</script>

<template>
  <div ref="track" class="zoom-scrollbar" :class="[axis, { dragging, 'pointer-focus': pointerFocus }]" @keydown.capture="pointerFocus = false" @focusout="pointerFocus = false" @pointerdown.self.stop.prevent="jump" @pointermove="move" @pointerup="finish" @pointercancel="cancel" @lostpointercapture="finish">
    <div class="zoom-scroll-thumb" :style="thumbStyle" :title="label + ': drag to scroll; drag ends to zoom'">
      <div class="zoom-scroll-pan" role="scrollbar" tabindex="0" :aria-label="label" :aria-controls="controls" :aria-orientation="axis" :aria-valuemin="0" :aria-valuemax="Math.round(maximum)" :aria-valuenow="Math.round(Math.max(0, Math.min(maximum, offset)))" @pointerdown.stop.prevent="begin($event, 'pan')" @keydown="keys($event, 'pan')"></div>
      <button type="button" class="zoom-scroll-end start" :class="{ 'handle-dragging': activeHandle === 'start' }" role="slider" :aria-label="label + ' start zoom handle'" :aria-orientation="axis" :aria-valuemin="minZoom" :aria-valuemax="maxZoom" :aria-valuenow="Math.round(zoom)" @pointerdown.stop.prevent="begin($event, 'start')" @keydown.stop="keys($event, 'start')"></button>
      <button type="button" class="zoom-scroll-end end" :class="{ 'handle-dragging': activeHandle === 'end' }" role="slider" :aria-label="label + ' end zoom handle'" :aria-orientation="axis" :aria-valuemin="minZoom" :aria-valuemax="maxZoom" :aria-valuenow="Math.round(zoom)" @pointerdown.stop.prevent="begin($event, 'end')" @keydown.stop="keys($event, 'end')"></button>
    </div>
  </div>
</template>

<style scoped>
/* Overlay navigation stays independent of timeline content size. Handles resize the visible interval. */
.zoom-scrollbar { opacity: .12; touch-action: none; user-select: none; transition: opacity .18s ease; }
.zoom-scrollbar:hover, .zoom-scrollbar:has(:focus-visible), .zoom-scrollbar.dragging { opacity: 1; }
.zoom-scroll-thumb { position: absolute; background: #858585; border: 0; border-radius: 5px; box-shadow: 0 1px 5px #00000066; }
.zoom-scrollbar.horizontal .zoom-scroll-thumb { top: 2px; height: 10px; min-width: 48px; max-width: 100%; }
.zoom-scrollbar.vertical .zoom-scroll-thumb { left: 2px; width: 10px; min-height: 48px; max-height: 100%; }
.zoom-scroll-pan { position: absolute; cursor: grab; outline-offset: 2px; }
.zoom-scrollbar.horizontal .zoom-scroll-pan { inset: -2px 16px -10px; }
.zoom-scrollbar.vertical .zoom-scroll-pan { inset: 16px -12px 16px -2px; }
.zoom-scrollbar.dragging .zoom-scroll-pan { cursor: grabbing; }
button.zoom-scroll-end { position: absolute; z-index: 1; width: 22px; height: 22px; border: 0; padding: 0; min-width: 0; background: transparent; border-radius: 50%; }
.zoom-scroll-end::after { content: ''; position: absolute; width: 6px; height: 6px; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #b5b5b5; border-radius: 50%; pointer-events: none; }
.zoom-scrollbar.horizontal .zoom-scroll-end { top: -6px; cursor: ew-resize; }
.zoom-scrollbar.horizontal .zoom-scroll-end.start { left: -6px; }
.zoom-scrollbar.horizontal .zoom-scroll-end.end { right: -6px; }
.zoom-scrollbar.vertical .zoom-scroll-end { left: -6px; cursor: ns-resize; }
.zoom-scrollbar.vertical .zoom-scroll-end.start { top: -6px; }
.zoom-scrollbar.vertical .zoom-scroll-end.end { bottom: -6px; }
button.zoom-scroll-end::before { content: ''; position: absolute; top: 50%; left: 50%; width: 22px; height: 22px; transform: translate(-50%, -50%); border-radius: 50%; background: #ffffff25; opacity: 0; pointer-events: none; }
button.zoom-scroll-end:hover, button.zoom-scroll-end:active, button.zoom-scroll-end.handle-dragging { background: transparent; }
button.zoom-scroll-end:hover::before, button.zoom-scroll-end:active::before, button.zoom-scroll-end.handle-dragging::before { opacity: 1; }
.zoom-scrollbar .zoom-scroll-pan, .zoom-scrollbar button.zoom-scroll-end { outline: none; }
.zoom-scrollbar:not(.pointer-focus) .zoom-scroll-pan:focus-visible { background: #ffffff12; border-radius: 3px; }
.zoom-scrollbar:not(.pointer-focus) button.zoom-scroll-end:focus-visible::before { opacity: 1; }
.zoom-scrollbar.pointer-focus:not(:hover):not(.dragging) { opacity: .12; }
@media (hover: none) { .zoom-scrollbar { opacity: .8; } }
@media (prefers-reduced-motion: reduce) { .zoom-scrollbar { transition: none; } }
</style>
