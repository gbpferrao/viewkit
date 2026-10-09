<script setup lang="ts">
import ActionButton from '../interface/action-button.view.vue';
import InterfaceIcon from '../interface/interface-icon.view.vue';
import EditableText from '../interface/editable-text.view.vue';
import ZoomScrollbar from '../interface/zoom-scrollbar.view.vue';
import type { ZoomScrollChange } from '../interface/zoom-scrollbar.contract';
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useEditor } from '../app.composition';
import { LANE_COUNT, FPS, quantize, formatTime } from '../shared/frame-math.contract';
import { defaultTransform } from '../stage/stage-size.model';
import { clipEnd, timelineEnd, cloneClips, moveClips, trimClip, snapTime, packLaneClips, reorderLaneClips } from './timeline.model';
import type { Clip, ClipReorder } from './timeline.model';
import ClipBlock from './clip-block.view.vue';
import { createVideoThumbnails } from '../media/video-thumbnails.resource';
const { project, mediaDrag, playback, timeline } = useEditor();
const thumbnails = createVideoThumbnails();
watch(() => project.generation, () => { thumbnails.reset(); });
// Import/restore prepares source sheets; removal releases them. Clip geometry never initiates decoding.
watch(() => JSON.stringify(project.sources.map(source => source.url)), () => {
  thumbnails.synchronize(project.sources);
}, { immediate: true });
const RULER_HEIGHT = 44;
const DEFAULT_TIMELINE_SECONDS = 30;
const optionsRoot = ref<HTMLElement>();
const optionsOpen = ref(false);
const scroller = ref<HTMLElement>(), content = ref<HTMLElement>();
const zoom = ref(70), clipHeight = ref(38);
const draft = ref<Clip[] | null>(null), snapGuide = ref<number | null>(null);
const importGhost = ref<Clip | null>(null);
const GHOST_ID = '__media-placement-preview';
let importFrame = 0;
function clearImportGhost() { cancelAnimationFrame(importFrame); importFrame = 0; importGhost.value = null; }
watch(mediaDrag, id => { if (!id) clearImportGhost(); });
const marquee = ref<{ x: number; y: number; width: number; height: number } | null>(null);
const displayClips = computed(() => draft.value ?? project.clips);
const viewport = ref({ left: 0, top: 0, width: 1200, height: 300 });
const playheadX = computed(() => 86 + playback.time.value * zoom.value - viewport.value.left);
const splitTargets = computed(() => project.selection.length ? project.selected : project.clips);
const canSplit = computed(() => splitTargets.value.some(clip => playback.time.value > clip.start && playback.time.value < clipEnd(clip)));
const activeEnd = computed(() => timelineEnd(displayClips.value));
const activeWidth = computed(() => activeEnd.value * zoom.value);
// The view has a finite baseline duration even with no clips; active shading and export still follow real clips only.
const navigableEnd = computed(() => Math.max(DEFAULT_TIMELINE_SECONDS, project.end, activeEnd.value));
const minimumZoom = computed(() => Math.min(10, Math.max(1, viewport.value.width - 134) / navigableEnd.value));
watch(minimumZoom, minimum => { if (zoom.value < minimum) zoom.value = minimum; });
const rulerStep = computed(() => {
  const minimum = Math.max(1, 70 / zoom.value);
  const magnitude = 10 ** Math.floor(Math.log10(minimum));
  return [1, 2, 5, 10].find(step => step * magnitude >= minimum)! * magnitude;
});
const gridSpacing = computed(() => rulerStep.value * zoom.value);
// Future space follows the baseline/clip bounds and viewport size, never scroll position or previously generated ticks.
const contentWidth = computed(() => {
  const trackWidth = Math.max(0, viewport.value.width - 86);
  const futureSeconds = Math.max(2, Math.min(10, trackWidth / zoom.value * 0.6));
  // Retain the committed extent during inward drags to avoid collapsing the scroll position mid-gesture.
  const extent = navigableEnd.value;
  return Math.ceil(Math.max(trackWidth, (extent + futureSeconds) * zoom.value));
});
const sourceById = computed(() => new Map(project.sources.map(source => [source.id, source])));
const selectedIds = computed(() => new Set(project.selection));
let resizeObserver: ResizeObserver | null = null;
let scrollFrame = 0;
function measureViewport() {
  const element = scroller.value;
  if (element) viewport.value = { left: element.scrollLeft, top: element.scrollTop, width: element.clientWidth, height: element.clientHeight };
}
function queueViewport() {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; measureViewport(); });
}
onMounted(() => {
  measureViewport();
  resizeObserver = new ResizeObserver(measureViewport);
  resizeObserver.observe(scroller.value!);
});
onBeforeUnmount(() => { resizeObserver?.disconnect(); cancelAnimationFrame(scrollFrame); thumbnails.dispose(); clearImportGhost(); });
/** Pack intersecting clips into visible subrows so overlap never makes a clip unreachable. */
const lanes = computed(() => {
  let top = RULER_HEIGHT;
  return Array.from({ length: LANE_COUNT }, (_, lane) => {
    const laneClips = displayClips.value.filter(clip => clip.lane === lane);
    if (importGhost.value?.lane === lane) laneClips.push(importGhost.value);
    const { clips, rows, rowCount } = packLaneClips(laneClips);
    const visibleRowCount = draft.value && dragLanes ? Math.max(rowCount, dragLanes[lane].rowCount) : rowCount;
    const height = visibleRowCount * (clipHeight.value + 4) + 10;
    const result = { lane, clips, rows, rowCount, height, top }; top += height; return result;
  });
});
const lanesHeight = computed(() => lanes.value.reduce((height, lane) => height + lane.height, 0));
type Navigation = { left: number; top: number; zoom: number; anchor?: { time: number; pixel: number } };
let navigation: Navigation | null = null;
let navigationFrame = 0, navigationEpoch = 0, navigationTime = 0;
function stopNavigation() {
  cancelAnimationFrame(navigationFrame); navigationFrame = 0; navigation = null; navigationEpoch++;
}
function navigate(target: Navigation) {
  navigation = target;
  if (!navigationFrame) {
    navigationTime = performance.now();
    navigationFrame = requestAnimationFrame(animateNavigation);
  }
}
async function animateNavigation(now: number) {
  const target = navigation, element = scroller.value, epoch = navigationEpoch;
  if (!target || !element) { navigationFrame = 0; return; }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const blend = reduced ? 1 : 1 - Math.exp(-Math.min(64, now - navigationTime) / (panGesture ? 35 : 65));
  navigationTime = now;
  const nextZoom = Math.exp(Math.log(zoom.value) + (Math.log(target.zoom) - Math.log(zoom.value)) * blend);
  const zoomDone = Math.abs(nextZoom - target.zoom) < .01;
  zoom.value = zoomDone ? target.zoom : nextZoom;
  const left = target.anchor ? target.anchor.time * zoom.value - target.anchor.pixel
    : element.scrollLeft + (target.left - element.scrollLeft) * blend;
  const top = element.scrollTop + (target.top - element.scrollTop) * blend;
  const done = zoomDone && (target.anchor || Math.abs(left - target.left) < .5) && Math.abs(top - target.top) < .5;
  await nextTick();
  if (epoch !== navigationEpoch) return;
  element.scrollLeft = done ? target.left : left;
  element.scrollTop = done ? target.top : top;
  measureViewport();
  if (done && navigation === target) { navigation = null; navigationFrame = 0; }
  else navigationFrame = requestAnimationFrame(animateNavigation);
}
function smoothScroll(left: number, top: number) {
  const element = scroller.value;
  if (!element) return;
  navigate({ left: Math.max(0, Math.min(element.scrollWidth - element.clientWidth, left)),
    top: Math.max(0, Math.min(element.scrollHeight - element.clientHeight, top)), zoom: zoom.value });
}
function scrollHorizontal(offset: number) {
  stopNavigation();
  if (scroller.value) { scroller.value.scrollLeft = offset; measureViewport(); }
}
function scrollVertical(offset: number) {
  stopNavigation();
  if (scroller.value) { scroller.value.scrollTop = offset; measureViewport(); }
}
async function zoomHorizontal(change: ZoomScrollChange) {
  stopNavigation();
  zoom.value = change.zoom;
  await nextTick();
  scrollHorizontal(change.anchor / change.initialZoom * change.zoom - Math.max(0, viewport.value.width - 86) * change.viewportAnchor);
}
async function zoomVertical(change: ZoomScrollChange) {
  stopNavigation();
  // Anchor within a lane using its original height; lane padding stays fixed while its clip rows scale.
  let oldTop = 0, newTop = 0, anchor = 0;
  for (const lane of lanes.value) {
    const oldHeight = lane.rowCount * (change.initialZoom + 4) + 10;
    const newHeight = lane.rowCount * (change.zoom + 4) + 10;
    if (change.anchor <= oldTop + oldHeight) {
      anchor = newTop + Math.max(0, change.anchor - oldTop) / oldHeight * newHeight;
      break;
    }
    oldTop += oldHeight; newTop += newHeight; anchor = newTop;
  }
  clipHeight.value = change.zoom;
  await nextTick();
  scrollVertical(anchor - Math.max(0, viewport.value.height - RULER_HEIGHT) * change.viewportAnchor);
}
watch([contentWidth, lanesHeight], async () => { await nextTick(); measureViewport(); });
// Overscan keeps scrolling smooth while DOM work stays bounded by the viewport, not sequence duration.
const visibleLanes = computed(() => {
  const { left, top, width, height } = viewport.value;
  const start = Math.max(0, (left - 286) / zoom.value);
  const end = (left + width + 200) / zoom.value;
  return lanes.value.map(lane => ({ ...lane, clips: lane.clips.filter(clip => {
    const rowTop = lane.top + 5 + lane.rows[clip.id] * (clipHeight.value + 4);
    return clip.start <= end && clipEnd(clip) >= start && rowTop + clipHeight.value >= top - 100 && rowTop <= top + height + 100;
  }) }));
});
const ticks = computed(() => {
  const step = rulerStep.value;
  const first = Math.max(0, Math.floor((viewport.value.left - 286) / zoom.value / step));
  const last = Math.min(Math.ceil(contentWidth.value / zoom.value / step), Math.ceil((viewport.value.left + viewport.value.width + 200) / zoom.value / step));
  return Array.from({ length: Math.max(0, last - first) }, (_, index) => (first + index) * step);
});
type Gesture = { type: 'move' | 'trim' | 'marquee' | 'scrub'; x: number; y: number; original: Clip[]; ids: string[]; leader?: Clip; edge?: 'start' | 'end'; delta: number; laneDelta: number; trimTime: number; moved: boolean; baseSelection: string[] };
let gesture: Gesture | null = null;
let reorderDraft: ClipReorder | null = null;
let dragLanes: { lane: number; top: number; height: number; rowCount: number; rows: Record<string, number> }[] | null = null;
const panning = ref(false);
let panGesture: { pointer: number; x: number; y: number; left: number; top: number; target: HTMLElement } | null = null;
let panFrame = 0;
let pendingPan: PointerEvent | null = null;
let gestureFrame = 0;
let pendingPointer: PointerEvent | null = null;
function point(event: PointerEvent) {
  const rect = content.value!.getBoundingClientRect();
  return { x: event.clientX - rect.left - 86, y: event.clientY - rect.top };
}
function beginPan(event: PointerEvent) {
  if (event.button !== 1 || gesture || panGesture || !scroller.value) return;
  event.preventDefault(); event.stopPropagation(); closeOptions();
  stopNavigation();
  const target = event.currentTarget as HTMLElement;
  panGesture = { pointer: event.pointerId, x: event.clientX, y: event.clientY, left: scroller.value.scrollLeft, top: scroller.value.scrollTop, target };
  panning.value = true; target.setPointerCapture(event.pointerId);
}
function applyPan(event: PointerEvent) {
  if (!panGesture || event.pointerId !== panGesture.pointer || !scroller.value) return;
  smoothScroll(panGesture.left - (event.clientX - panGesture.x), panGesture.top - (event.clientY - panGesture.y));
}
function stopPan(restore = false) {
  cancelAnimationFrame(panFrame); panFrame = 0; pendingPan = null;
  const previous = panGesture; panGesture = null; panning.value = false;
  if (!previous) return;
  if (restore) { scrollHorizontal(previous.left); scrollVertical(previous.top); }
  if (previous.target.hasPointerCapture(previous.pointer)) previous.target.releasePointerCapture(previous.pointer);
}
function lostPanCapture(event: PointerEvent) { if (panGesture?.pointer === event.pointerId) stopPan(); }
function beginClip(event: PointerEvent, clip: Clip, edge: 'start' | 'end' | null) {
  if (event.button !== 0) return;
  stopNavigation();
  event.preventDefault(); playback.pause();
  if (event.ctrlKey || event.metaKey) project.select(project.selection.includes(clip.id) ? project.selection.filter(id => id !== clip.id) : [...project.selection, clip.id]);
  else if (!project.selection.includes(clip.id)) project.select([clip.id]);
  const current = point(event);
  dragLanes = lanes.value.map(({ lane, top, height, rowCount, rows }) => ({ lane, top, height, rowCount, rows: { ...rows } }));
  reorderDraft = null;
  gesture = { type: edge ? 'trim' : 'move', ...current, original: cloneClips(project.clips), ids: edge ? [clip.id] : [...project.selection], leader: { ...clip }, edge: edge ?? undefined, delta: 0, laneDelta: 0, trimTime: edge === 'start' ? clip.start : clipEnd(clip), moved: false, baseSelection: [] };
}
function beginScrub(event: PointerEvent) {
  if (event.button !== 0 || (event.target as HTMLElement).closest('button')) return;
  event.preventDefault(); stopNavigation(); playback.pause();
  const current = point(event);
  gesture = { type: 'scrub', ...current, original: [], ids: [], delta: 0, laneDelta: 0, trimTime: 0, moved: false, baseSelection: [] };
  playback.seek(Math.max(0, current.x / zoom.value));
}
function beginBackground(event: PointerEvent) {
  if (event.button !== 0 || (event.target as HTMLElement).closest('button,.lane-label,.clip')) return;
  stopNavigation();
  const current = point(event);
  if (current.x < 0) return;
  if ((event.target as HTMLElement).closest('.time-ruler')) { beginScrub(event); return; }
  if (current.y < RULER_HEIGHT) return;
  event.preventDefault(); playback.pause();
  gesture = { type: 'marquee', ...current, original: cloneClips(project.clips), ids: [], delta: 0, laneDelta: 0, trimTime: 0, moved: false, baseSelection: event.ctrlKey ? [...project.selection] : [] };
}
function move(event: PointerEvent) {
  if (panGesture) {
    if (event.pointerId !== panGesture.pointer) return;
    pendingPan = event;
    if (!panFrame) panFrame = requestAnimationFrame(() => { panFrame = 0; const latest = pendingPan; pendingPan = null; if (latest) applyPan(latest); });
    return;
  }
  if (!gesture) return;
  pendingPointer = event;
  if (gestureFrame) return;
  gestureFrame = requestAnimationFrame(() => {
    gestureFrame = 0;
    const latest = pendingPointer;
    pendingPointer = null;
    if (latest) updateGesture(latest);
  });
}
function updateGesture(event: PointerEvent) {
  if (!gesture) return;
  const current = point(event);
  if (gesture.type === 'scrub') { playback.seek(Math.max(0, current.x / zoom.value)); return; }
  gesture.moved ||= Math.abs(current.x - gesture.x) + Math.abs(current.y - gesture.y) > 4;
  if (!gesture.moved) return;
  if (gesture.type === 'marquee') {
    current.x = Math.max(0, current.x);
    current.y = Math.max(RULER_HEIGHT, current.y);
    const box = { x: Math.min(gesture.x, current.x), y: Math.min(gesture.y, current.y), width: Math.abs(current.x - gesture.x), height: Math.abs(current.y - gesture.y) };
    marquee.value = box;
    const ids = project.clips.filter(clip => {
      const lane = lanes.value[clip.lane], top = lane.top + 5 + lane.rows[clip.id] * (clipHeight.value + 4);
      return clip.start * zoom.value <= box.x + box.width && clipEnd(clip) * zoom.value >= box.x && top <= box.y + box.height && top + clipHeight.value >= box.y;
    }).map(clip => clip.id);
    project.select([...gesture.baseSelection, ...ids]); return;
  }
  const leader = gesture.leader!;
  const targets = [playback.time.value, ...gesture.original.filter(clip => !gesture!.ids.includes(clip.id)).flatMap(clip => [clip.start, clipEnd(clip)])];
  const delta = (current.x - gesture.x) / zoom.value;
  if (gesture.type === 'trim') {
    const raw = (gesture.edge === 'start' ? leader.start : clipEnd(leader)) + delta;
    const snapped = snapTime(raw, targets, zoom.value, project.snapping);
    gesture.trimTime = snapped.time; snapGuide.value = snapped.target;
    const source = project.sources.find(source => source.id === leader.sourceId)!;
    draft.value = gesture.original.map(clip => clip.id === leader.id ? trimClip(clip, gesture!.edge!, snapped.time, source.duration) : clip);
  } else {
    const start = snapTime(leader.start + delta, targets, zoom.value, project.snapping);
    const end = snapTime(clipEnd(leader) + delta, targets, zoom.value, project.snapping);
    let shift = quantize(delta);
    if (start.target !== null || end.target !== null) {
      const useStart = end.target === null || (start.target !== null && Math.abs(start.time - leader.start - delta) <= Math.abs(end.time - clipEnd(leader) - delta));
      shift = useStart ? start.time - leader.start : end.time - clipEnd(leader);
      snapGuide.value = useStart ? start.target : end.target;
    } else snapGuide.value = null;
    gesture.delta = shift;
    const targetLane = dragLanes?.find(lane => current.y >= lane.top && current.y < lane.top+lane.height)?.lane ?? -1;
    gesture.laneDelta = targetLane < 0 ? LANE_COUNT : targetLane - leader.lane;
    reorderDraft = null;
    const layout = dragLanes?.[leader.lane];
    if (gesture.laneDelta === 0 && layout) {
      const row = Math.max(0, Math.min(layout.rowCount-1, Math.floor((current.y-layout.top-5)/(clipHeight.value+4))));
      const originalRow = layout.rows[leader.id];
      if (row !== originalRow && Math.abs(current.y-gesture.y) > (clipHeight.value+4)/2) {
        const peers = gesture.original.filter(clip => clip.lane === leader.lane && !gesture!.ids.includes(clip.id) && layout.rows[clip.id] === row);
        peers.sort((a,b) => {
          const start = leader.start+shift, end = start+leader.duration;
          const distance = (clip: Clip) => Math.max(0, clip.start-end, start-clipEnd(clip));
          return distance(a)-distance(b) || b.order-a.order;
        });
        if (peers[0]) reorderDraft = { anchorId: peers[0].id, placement: row < originalRow ? 'before' : 'after' };
      }
    }
    try { draft.value = reorderLaneClips(moveClips(gesture.original, gesture.ids, gesture.delta, gesture.laneDelta), gesture.ids, reorderDraft); }
    catch { draft.value = null; }
  }
  if (scroller.value) {
    const rect = scroller.value.getBoundingClientRect();
    if (event.clientX > rect.right - 25) scroller.value.scrollLeft += 12;
    if (event.clientX < rect.left + 110) scroller.value.scrollLeft -= 12;
  }
}
function end(event?: PointerEvent) {
  if (panGesture) {
    if (event && event.pointerId !== panGesture.pointer) return;
    if (event) applyPan(event); else if (pendingPan) applyPan(pendingPan);
    stopPan(); return;
  }
  if (!gesture) return;
  // Apply the final queued pointer position before committing the atomic edit.
  if (gesture.type === 'scrub' && event) updateGesture(event);
  else if (event && gesture.type === 'move') updateGesture(event);
  else if (pendingPointer) updateGesture(pendingPointer);
  if (!gesture.moved && gesture.type === 'marquee') { project.select(gesture.baseSelection); playback.seek(Math.max(0, gesture.x / zoom.value)); }
  else if (gesture.moved && gesture.type === 'move') timeline.commitMove(gesture.ids, gesture.delta, gesture.laneDelta, reorderDraft);
  else if (gesture.moved && gesture.type === 'trim') timeline.commitTrim(gesture.leader!.id, gesture.edge!, gesture.trimTime);
  cancel();
}
function cancel() { stopNavigation(); stopPan(true); cancelAnimationFrame(gestureFrame); gestureFrame = 0; pendingPointer = null; gesture = null; reorderDraft = null; dragLanes = null; draft.value = null; snapGuide.value = null; marquee.value = null; }
function key(event: KeyboardEvent) { if (event.key === 'Escape') cancel(); }
async function openOptions() {
  optionsOpen.value = true;
  await nextTick();
  optionsRoot.value?.querySelector<HTMLElement>('[role^="menuitem"]:not(:disabled)')?.focus();
}
function closeOptions(restoreFocus = false) {
  optionsOpen.value = false;
  if (restoreFocus) optionsRoot.value?.querySelector<HTMLButtonElement>('.timeline-options-trigger')?.focus();
}
function toggleOptions() { if (optionsOpen.value) closeOptions(true); else void openOptions(); }
function outsideOptions(event: PointerEvent) {
  if (optionsOpen.value && !optionsRoot.value?.contains(event.target as Node)) closeOptions();
}
function optionKeys(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.preventDefault(); closeOptions(true); return; }
  if (event.key === 'Tab') { closeOptions(); return; }
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const items = [...optionsRoot.value!.querySelectorAll<HTMLButtonElement>('[role^="menuitem"]:not(:disabled)')];
  const current = items.indexOf(document.activeElement as HTMLButtonElement);
  const index = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
    : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
  items[index]?.focus();
}
async function zoomBy(factor: number) {
  const visibleWidth = Math.max(1, viewport.value.width - 86);
  const center = (viewport.value.left + visibleWidth / 2) / zoom.value;
  const targetZoom = Math.max(minimumZoom.value, Math.min(400, (navigation?.zoom ?? zoom.value) * factor));
  navigate({ left: Math.max(0, center * targetZoom - visibleWidth / 2), top: viewport.value.top,
    zoom: targetZoom, anchor: { time: center, pixel: visibleWidth / 2 } });
}
async function fitScope(scope: 'selection' | 'project') {
  stopNavigation();
  const clips = scope === 'selection' ? project.selected : project.clips;
  if (!clips.length) return;
  const start = scope === 'selection' ? Math.min(...clips.map(clip => clip.start)) : 0;
  const end = timelineEnd(clips);
  const width = Math.max(1, viewport.value.width - 86 - 48);
  zoom.value = Math.max(minimumZoom.value, Math.min(400, width / Math.max(1 / 24, end - start)));
  await nextTick();
  scrollHorizontal(Math.max(0, start * zoom.value - 24));
  if (scope === 'project') scrollVertical(0);
  else {
    const firstLane = Math.min(...clips.map(clip => clip.lane));
    scrollVertical(Math.max(0, lanes.value[firstLane].top - RULER_HEIGHT - 12));
  }
  closeOptions(true);
}
function updateImportGhost(event: DragEvent, lane: number) {
  const id = mediaDrag.value ?? event.dataTransfer?.getData('application/x-viewkit-source');
  const source = project.sources.find(source => source.id === id);
  if (!source || !content.value) { clearImportGhost(); return; }
  const rect = content.value!.getBoundingClientRect();
  const raw = Math.max(0, (event.clientX - rect.left - 86) / zoom.value);
  const snapped = snapTime(raw, [playback.time.value, ...project.clips.flatMap(clip => [clip.start, clipEnd(clip)])], zoom.value, project.snapping);
  importGhost.value = { id: GHOST_ID, sourceId: source.id, start: snapped.time, duration: Math.floor(source.duration * FPS) / FPS,
    offset: 0, lane, volume: 100, order: Math.max(0, ...project.clips.map(clip => clip.order)) + 1, transform: defaultTransform() };
}
function dragOver(event: DragEvent, lane: number) {
  if (!mediaDrag.value) { clearImportGhost(); return; }
  event.preventDefault(); event.stopPropagation();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  cancelAnimationFrame(importFrame);
  importFrame = requestAnimationFrame(() => { importFrame = 0; updateImportGhost(event, lane); });
}
function leaveImport(event: DragEvent) {
  if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) clearImportGhost();
}
function drop(event: DragEvent, lane: number) {
  event.preventDefault(); event.stopPropagation(); cancelAnimationFrame(importFrame); importFrame = 0;
  updateImportGhost(event, lane);
  const ghost = importGhost.value;
  clearImportGhost(); mediaDrag.value = null;
  if (ghost) timeline.place(ghost.sourceId, ghost.start, ghost.lane);
}
function wheel(event: WheelEvent) {
  event.preventDefault();
  if (!scroller.value || panGesture || gesture) return;
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scroller.value.clientHeight : 1;
  if (event.ctrlKey) {
    const element = scroller.value, rect = element.getBoundingClientRect();
    const pixel = Math.max(0, Math.min(element.clientWidth - 86, event.clientX - rect.left - 86));
    const time = (element.scrollLeft + pixel) / zoom.value;
    const factor = Math.exp(-Math.max(-500, Math.min(500, event.deltaY * unit)) * .0015);
    const targetZoom = Math.max(minimumZoom.value, Math.min(400, (navigation?.zoom ?? zoom.value) * factor));
    navigate({ left: Math.max(0, time * targetZoom - pixel), top: navigation?.top ?? element.scrollTop,
      zoom: targetZoom, anchor: { time, pixel } });
  } else {
    smoothScroll((navigation?.left ?? scroller.value.scrollLeft) + event.deltaX * unit,
      (navigation?.top ?? scroller.value.scrollTop) + event.deltaY * unit);
  }
}
watch(() => playback.time.value, time => {
  if (playback.playing.value && scroller.value) {
    const x = time * zoom.value + 86;
    if (x > scroller.value.scrollLeft + scroller.value.clientWidth - 80) scroller.value.scrollLeft = x - 150;
  }
});
window.addEventListener('pointermove', move); window.addEventListener('pointerup', end); window.addEventListener('keydown', key);
window.addEventListener('pointerdown', outsideOptions, true);
window.addEventListener('pointercancel', cancel); window.addEventListener('blur', cancel);
onBeforeUnmount(() => { cancel(); window.removeEventListener('pointercancel', cancel); window.removeEventListener('blur', cancel); window.removeEventListener('pointerdown', outsideOptions, true); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); window.removeEventListener('keydown', key); });
</script>
<template>
  <section class="timeline-panel" aria-label="timeline">
    <div class="timeline-viewport" :class="{ panning }" @pointerdown.capture="beginPan" @auxclick.middle.prevent @lostpointercapture="lostPanCapture" @wheel="wheel" @dragleave="leaveImport" @dragover="clearImportGhost" @drop="clearImportGhost">
    <div id="timeline-scroll-viewport" ref="scroller" class="timeline-scroll" @scroll.passive="queueViewport">
      <div ref="content" class="timeline-content" :style="{ width: contentWidth + 86 + 'px' }" @pointerdown="beginBackground">
        <div class="time-ruler" v-memo="[ticks, zoom, activeEnd]"><div class="ruler-corner">24 fps</div><div class="ruler-track"><div class="ruler-active-region" :style="{ width: activeWidth + 'px' }" aria-hidden="true"></div><span v-for="tick in ticks" :key="tick" class="ruler-tick" :class="{ 'future-tick': tick >= activeEnd }" :style="{ left: tick * zoom + 'px' }">{{ Math.floor(tick / 60) }}:{{ String(tick % 60).padStart(2, '0') }}</span><div v-if="activeEnd > 0" class="sequence-end-label" :style="{ left: activeWidth + 'px' }">end {{ formatTime(activeEnd) }}</div></div></div>
        <div v-for="lane in visibleLanes" :key="lane.lane" v-memo="[lane, sourceById, selectedIds, zoom, clipHeight, activeWidth, project.laneNames[lane.lane], project.generation]" class="timeline-lane" :style="{ height: lane.height + 'px' }" :data-lane="lane.lane" @dragover="dragOver($event, lane.lane)" @drop="drop($event, lane.lane)">
          <div class="lane-label" @pointerdown.stop>
            <EditableText class="lane-name" label="lane name" :model-value="project.laneNames[lane.lane]" :max-length="80" :reset-key="project.generation" @change="project.renameLane(lane.lane, $event)"/>
          </div>
          <div class="lane-track" :style="{ backgroundSize: gridSpacing + 'px 100%' }">
            <div class="lane-active-region" :style="{ width: activeWidth + 'px', backgroundSize: gridSpacing + 'px 100%' }" aria-hidden="true"></div>
            <ClipBlock v-for="clip in lane.clips" :key="clip.id" v-memo="[clip, sourceById.get(clip.sourceId), selectedIds.has(clip.id), zoom, lane.rows[clip.id], clipHeight, viewport.left, viewport.width]" :class="{ 'placement-ghost': clip.id === GHOST_ID }" :inert="clip.id === GHOST_ID || undefined" :aria-hidden="clip.id === GHOST_ID || undefined" :clip="clip" :source="sourceById.get(clip.sourceId)!" :selected="selectedIds.has(clip.id)" :pixels-per-second="zoom" :row="lane.rows[clip.id]" :clip-height="clipHeight" :visible-left="viewport.left" :visible-right="viewport.left + viewport.width - 86" :thumbnails="thumbnails" @gesture="beginClip"/>
          </div>
        </div>
        <div v-if="activeEnd > 0" class="sequence-end-line" :style="{ left: 86 + activeWidth + 'px' }" aria-hidden="true"></div>
        <div v-if="snapGuide !== null" class="snap-line" :style="{ left: 86 + snapGuide * zoom + 'px' }"></div>
        <div v-if="marquee" class="marquee" :style="{ left: marquee.x + 86 + 'px', top: marquee.y + 'px', width: marquee.width + 'px', height: marquee.height + 'px' }"></div>
      </div>
    </div>
      <div class="playhead-overlay">
      <div v-if="playheadX >= 86 && playheadX <= viewport.width" class="playhead-line" :style="{ left: playheadX - 86 + 'px' }" aria-hidden="true"></div>
      <div v-if="playheadX >= 86 && playheadX <= viewport.width" class="playhead-tip" :style="{ left: playheadX - 86 + 'px' }" @pointerdown.stop="beginScrub">
        <span class="playhead-cap" aria-hidden="true"></span>
      </div>
      <div v-if="playheadX >= 86 && playheadX <= viewport.width" class="playhead-bottom" :style="{ left: Math.max(130, Math.min(viewport.width - 44, playheadX)) - 86 + 'px' }" @pointerdown.stop>
        <ActionButton class="playhead-split" variant="primary" size="compact" title="split at playhead (S)" aria-label="split at playhead" :disabled="!canSplit" @click.stop="timeline.split(playback.time.value)"><InterfaceIcon name="scissors"/>split</ActionButton>
      </div>
      </div>
      <div ref="optionsRoot" class="timeline-options">
        <ActionButton class="timeline-options-trigger" variant="quiet" size="compact" shape="circle" aria-label="timeline options" title="timeline options" aria-haspopup="menu" :aria-expanded="optionsOpen" aria-controls="timeline-options-menu" @click="toggleOptions" @keydown.down.stop.prevent="openOptions"><InterfaceIcon name="three-dots"/></ActionButton>
        <div v-if="optionsOpen" id="timeline-options-menu" class="timeline-options-menu" role="menu" aria-label="timeline options" :style="{ maxHeight: Math.max(120, viewport.height - 42) + 'px' }" @keydown.stop="optionKeys">
          <ActionButton class="timeline-menu-item" variant="quiet" role="menuitemcheckbox" tabindex="-1" :aria-checked="project.snapping" @click="project.snapping = !project.snapping"><InterfaceIcon name="magnet"/><span class="menu-item-label">snap</span><span class="menu-switch" :class="{ on: project.snapping }" aria-hidden="true"></span></ActionButton>
          <ActionButton class="timeline-menu-item" variant="quiet" role="menuitemcheckbox" tabindex="-1" :aria-checked="project.autofill" @click="project.autofill = !project.autofill"><InterfaceIcon name="distribute-horizontal"/><span class="menu-item-label">autofill gaps</span><span class="menu-switch" :class="{ on: project.autofill }" aria-hidden="true"></span></ActionButton>
          <div class="menu-separator" role="separator"></div>
          <ActionButton class="timeline-menu-item" variant="quiet" role="menuitem" tabindex="-1" :disabled="zoom >= 400" @click="zoomBy(1.25)"><InterfaceIcon name="zoom-in"/><span class="menu-item-label">zoom +</span></ActionButton>
          <ActionButton class="timeline-menu-item" variant="quiet" role="menuitem" tabindex="-1" :disabled="zoom <= minimumZoom" @click="zoomBy(1 / 1.25)"><InterfaceIcon name="zoom-out"/><span class="menu-item-label">zoom −</span></ActionButton>
          <div class="menu-separator" role="separator"></div>
          <ActionButton class="timeline-menu-item" variant="quiet" role="menuitem" tabindex="-1" :disabled="!project.selection.length" @click="fitScope('selection')"><InterfaceIcon name="bounding-box"/><span class="menu-item-label">fit to selection</span></ActionButton>
          <ActionButton class="timeline-menu-item" variant="quiet" role="menuitem" tabindex="-1" :disabled="!project.clips.length" @click="fitScope('project')"><InterfaceIcon name="arrows-angle-expand"/><span class="menu-item-label">fit to project</span></ActionButton>
          <div class="menu-separator" role="separator"></div>
          <ActionButton class="timeline-menu-item" variant="quiet" role="menuitem" tabindex="-1" :disabled="!project.selection.length" @click="timeline.remove(); closeOptions(true)"><InterfaceIcon name="trash3"/><span class="menu-item-label">delete selection</span></ActionButton>
        </div>
      </div>
      <ZoomScrollbar class="timeline-scroll-horizontal" axis="horizontal" label="timeline horizontal scroll" controls="timeline-scroll-viewport" :content-size="contentWidth" :viewport-size="Math.max(0, viewport.width - 86)" :offset="viewport.left" :zoom="zoom" :min-zoom="minimumZoom" :max-zoom="400" @scroll="scrollHorizontal" @zoom="zoomHorizontal"/>
      <ZoomScrollbar class="timeline-scroll-vertical" axis="vertical" label="timeline vertical scroll" controls="timeline-scroll-viewport" :content-size="Math.max(lanesHeight, viewport.height - RULER_HEIGHT)" :viewport-size="Math.max(0, viewport.height - RULER_HEIGHT)" :offset="viewport.top" :zoom="clipHeight" :min-zoom="26" :max-zoom="70" @scroll="scrollVertical" @zoom="zoomVertical"/>
    </div>
  </section>
</template>

