<script setup lang="ts">
import ActionButton from './interface/action-button.view.vue';
import InterfaceIcon from './interface/interface-icon.view.vue';
import EditableText from './interface/editable-text.view.vue';
import { computed, provide, onBeforeUnmount, ref, watch, nextTick } from 'vue';
import { createEditor, editorKey } from './app.composition';
import { bindShortcuts } from './shared/shortcut-keys.adapter';
import { formatTime } from './shared/frame-math.contract';
import MediaBin from './media/media-bin.view.vue';
import TimelineLanes from './timeline/timeline-lanes.view.vue';
import StageFrame from './stage/stage-frame.view.vue';
import StageInspector from './stage/stage-inspector.view.vue';
import ExportPanel from './export/export-panel.view.vue';
const editor = createEditor();
provide(editorKey, editor);
const windowHeight = ref(window.innerHeight);
const timelineHeight = ref<number | null>(null);
const timelineLimits = computed(() => {
  const available = Math.max(0, windowHeight.value - 92);
  const maximum = Math.max(0, Math.min(600, available - Math.min(260, available * .55)));
  return { minimum: Math.min(180, maximum), maximum };
});
const visibleTimelineHeight = computed(() => Math.max(timelineLimits.value.minimum,
  Math.min(timelineLimits.value.maximum, timelineHeight.value ?? windowHeight.value * .36)));
const resizingTimeline = ref(false);
let timelineResize: { pointer: number; y: number; height: number; original: number | null; target: HTMLElement } | null = null;
let resizeFrame = 0, resizeY = 0;
function setTimelineHeight(value: number) {
  timelineHeight.value = Math.max(timelineLimits.value.minimum, Math.min(timelineLimits.value.maximum, value));
}
function beginTimelineResize(event: PointerEvent) {
  if (event.button !== 0 || timelineResize) return;
  event.preventDefault();
  const target = event.currentTarget as HTMLElement;
  target.focus({ preventScroll: true });
  timelineResize = { pointer: event.pointerId, y: event.clientY, height: visibleTimelineHeight.value, original: timelineHeight.value, target };
  resizingTimeline.value = true; target.setPointerCapture(event.pointerId);
}
function applyTimelineResize(y: number) {
  if (timelineResize) setTimelineHeight(timelineResize.height + timelineResize.y - y);
}
function moveTimelineResize(event: PointerEvent) {
  if (!timelineResize || event.pointerId !== timelineResize.pointer) return;
  resizeY = event.clientY;
  if (!resizeFrame) resizeFrame = requestAnimationFrame(() => { resizeFrame = 0; applyTimelineResize(resizeY); });
}
function endTimelineResize(event?: PointerEvent, restore = false) {
  if (!timelineResize || (event && event.pointerId !== timelineResize.pointer)) return;
  cancelAnimationFrame(resizeFrame); resizeFrame = 0;
  if (restore) timelineHeight.value = timelineResize.original;
  else if (event) applyTimelineResize(event.clientY);
  const previous = timelineResize; timelineResize = null; resizingTimeline.value = false;
  if (previous.target.hasPointerCapture(previous.pointer)) previous.target.releasePointerCapture(previous.pointer);
}
function resizeKeys(event: KeyboardEvent) {
  if (event.key === 'Escape') { endTimelineResize(undefined, true); return; }
  if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  setTimelineHeight(event.key === 'Home' ? timelineLimits.value.minimum : event.key === 'End' ? timelineLimits.value.maximum
    : visibleTimelineHeight.value + (event.key === 'ArrowUp' ? 1 : -1) * (event.shiftKey ? 40 : 10));
}
function resizeWindow() { windowHeight.value = window.innerHeight; }
function cancelTimelineResize() { endTimelineResize(undefined, true); }
window.addEventListener('resize', resizeWindow);
window.addEventListener('blur', cancelTimelineResize);
const confirmClear = ref(false), showHelp = ref(false);
const mainMenuOpen = ref(false), mainMenuRoot = ref<HTMLElement>();
const hoverTip = ref(''), focusTip = ref(''), recentNotice = ref('');
let noticeTimer = 0;
watch(() => editor.project.message, message => {
  recentNotice.value = message;
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => { recentNotice.value = ''; }, 6000);
});
function tipFor(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return '';
  if (target.closest('.transform-fields:disabled')) return 'select only video objects to edit transforms.';
  const hints: [string, string][] = [
    ['.timeline-divider', 'drag to resize the timeline; arrow keys adjust its height.'],
    ['.clip-trim', 'drag this end to trim; nearby clip edges snap when enabled.'],
    ['.stage-scale', 'drag a corner to scale the selected video.'],
    ['.stage-rotate', 'drag to rotate the selected video; rotation snaps to top-facing quarter turns, and ctrl or shift temporarily enables free rotation.'],
    ['.stage-selection', 'drag to reposition the selected video.'],
    ['.zoom-scroll-end', 'drag this endpoint to zoom while keeping the opposite edge anchored.'],
    ['.zoom-scroll-pan', 'drag this bar to scroll the timeline.'],
    ['.source-card', 'drag onto a lane, or double-click to add at the playhead.'],
    ['.clip', 'drag to move selected clips; ctrl click adds to the selection; esc cancels.'],
    ['.volume-range, .volume-numeric', 'volume changes apply to every selected object.'],
    ['.transform-fields', 'this field changes the same property across selected video objects.'],
    ['.playhead-tip', 'split at the playhead; S does the same.'],
    ['.timeline-options', 'timeline options: snap, autofill, zoom, and fit.'],
    ['.project-name', 'rename your project; enter saves, esc cancels.'],
    ['.main-menu', 'new project starts fresh after confirmation.'],
    ['.header-history', 'undo or redo your edits; ctrl Z / ctrl Y.'],
    ['.help-button', 'open editing help and keyboard shortcuts.'],
    ['.media-panel .panel-heading button', 'import local video or audio using +.'],
    ['.transport', 'space plays or pauses; arrow keys step one frame.'],
    ['.timeline-viewport', 'middle drag pans; ctrl + wheel zooms at the pointer; wheel scrolls vertically.']
  ];
  return hints.find(([selector]) => target.closest(selector))?.[1] ?? '';
}
const footerTip = computed(() => {
  if (editor.exporter.state.busy) return editor.exporter.state.label || 'preparing your mp4…';
  if (editor.project.importing) return 'importing media…';
  if (editor.playback.error.value) return editor.playback.error.value;
  if (editor.playback.busy.value) return 'buffering preview…';
  if (recentNotice.value) return recentNotice.value;
  if (hoverTip.value || focusTip.value) return hoverTip.value || focusTip.value;
  if (!editor.project.sources.length) return 'use + in media to import your first file.';
  if (!editor.project.clips.length) return 'drag media onto a lane to start your sequence.';
  if (editor.playback.playing.value) return 'space pauses playback.';
  if (editor.project.selection.length > 1) return 'drag to move the selection together; shared properties update every object.';
  if (editor.project.selection.length === 1) return 'drag ends to trim, or edit properties in objects.';
  return 'select a clip to edit it, or drag across the timeline to select several.';
});
async function openMainMenu() {
  mainMenuOpen.value = true;
  await nextTick(); mainMenuRoot.value?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
}
function closeMainMenu(restoreFocus = false) {
  mainMenuOpen.value = false;
  if (restoreFocus) mainMenuRoot.value?.querySelector<HTMLButtonElement>('#main-menu-trigger')?.focus();
}
function toggleMainMenu() { if (mainMenuOpen.value) closeMainMenu(true); else void openMainMenu(); }
function outsideMainMenu(event: PointerEvent) { if (mainMenuOpen.value && !mainMenuRoot.value?.contains(event.target as Node)) closeMainMenu(); }
function mainMenuKeys(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.preventDefault(); closeMainMenu(true); }
  else if (event.key === 'Tab') closeMainMenu();
  else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault(); mainMenuRoot.value?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
  }
}
function requestNewProject() { closeMainMenu(true); confirmClear.value = true; }
const unbind = bindShortcuts(editor);
let priorFocus: HTMLElement | null = null;
watch(() => confirmClear.value || showHelp.value || editor.exporter.state.busy, async open => {
  if (open) {
    priorFocus = document.activeElement as HTMLElement;
    await nextTick(); document.querySelector<HTMLButtonElement>('.dialog button')?.focus();
  } else priorFocus?.focus();
});
function modalKeys(event: KeyboardEvent) {
  if (!confirmClear.value && !showHelp.value && !editor.exporter.state.busy) return;
  event.stopImmediatePropagation();
  if (event.key === 'Escape') { confirmClear.value = false; showHelp.value = false; editor.exporter.cancel(); }
  if (event.key !== 'Tab') return;
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('.dialog button:not(:disabled)')];
  const first = buttons[0], last = buttons.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
}
watch(() => editor.exporter.state.phase, async () => {
  if (!editor.exporter.state.busy) return;
  await nextTick(); document.querySelector<HTMLButtonElement>('.export-dialog button:not(:disabled)')?.focus();
});
window.addEventListener('keydown', modalKeys, true);
window.addEventListener('pointerdown', outsideMainMenu, true);
onBeforeUnmount(() => { cancelTimelineResize(); window.removeEventListener('resize', resizeWindow); window.removeEventListener('blur', cancelTimelineResize); unbind(); window.clearTimeout(noticeTimer); window.removeEventListener('keydown', modalKeys, true); window.removeEventListener('pointerdown', outsideMainMenu, true); editor.dispose(); });
</script>

<template>
  <main class="editor" :class="{ 'resizing-timeline': resizingTimeline }" :style="{ '--timeline-height': visibleTimelineHeight + 'px' }" @dragover.prevent @drop.prevent @pointerover="hoverTip = tipFor($event.target)" @pointerleave="hoverTip = ''" @focusin="focusTip = tipFor($event.target)" @focusout="focusTip = ''">
    <header class="app-header">
      <div class="header-brand">
        <div ref="mainMenuRoot" class="main-menu">
          <ActionButton id="main-menu-trigger" variant="quiet" shape="square" aria-label="main menu" title="main menu" aria-haspopup="menu" :aria-expanded="mainMenuOpen" aria-controls="main-menu-options" @click="toggleMainMenu" @keydown.down.stop.prevent="openMainMenu"><InterfaceIcon name="list"/></ActionButton>
          <div v-if="mainMenuOpen" id="main-menu-options" class="main-menu-options" role="menu" aria-label="main menu" @keydown.stop="mainMenuKeys">
            <ActionButton class="main-menu-item" variant="quiet" role="menuitem" tabindex="-1" @click="requestNewProject"><InterfaceIcon name="file-earmark-plus"/>new project</ActionButton>
          </div>
        </div>
        <!-- Replace this text with a wordmark.webp image when the brand asset is available. -->
        <span class="brand-wordmark" role="img" aria-label="viewkit">viewkit</span>
      </div>
      <EditableText class="project-name" label="project name" :model-value="editor.project.name" :max-length="80" :reset-key="editor.project.generation" @change="editor.project.rename"/>
      <div class="header-actions">
        <div class="header-history" role="group" aria-label="edit history">
          <ActionButton variant="quiet" size="regular" shape="square" title="undo (ctrl Z)" aria-label="undo" :disabled="!editor.history.past.value.length" @click="editor.history.undo()"><InterfaceIcon name="arrow-counterclockwise"/></ActionButton>
          <ActionButton variant="quiet" size="regular" shape="square" title="redo (ctrl Y)" aria-label="redo" :disabled="!editor.history.future.value.length" @click="editor.history.redo()"><InterfaceIcon name="arrow-clockwise"/></ActionButton>
        </div>
        <ActionButton variant="primary" size="regular" shape="rectangle" class="primary" :disabled="editor.exporter.state.busy" @click="editor.exporter.start()">export <InterfaceIcon name="box-arrow-up-right"/></ActionButton>
        <ActionButton variant="quiet" size="regular" shape="circle" class="help-button" aria-label="help" title="editing help" @click="showHelp = !showHelp">?</ActionButton>
      </div>
    </header>
    <div class="workspace">
      <MediaBin/>
      <StageFrame/>
      <StageInspector/>
    </div>
    <div class="timeline-region">
      <div class="timeline-divider" role="separator" tabindex="0" aria-label="timeline height" aria-orientation="horizontal" :aria-valuemin="Math.round(timelineLimits.minimum)" :aria-valuemax="Math.round(timelineLimits.maximum)" :aria-valuenow="Math.round(visibleTimelineHeight)" :aria-valuetext="Math.round(visibleTimelineHeight) + ' pixels'" title="drag to resize timeline" @pointerdown.stop="beginTimelineResize" @pointermove="moveTimelineResize" @pointerup="endTimelineResize($event)" @pointercancel="endTimelineResize($event, true)" @lostpointercapture="endTimelineResize()" @keydown.stop="resizeKeys" @dblclick="timelineHeight = null"></div>
      <TimelineLanes/>
    </div>
    <footer class="app-footer">
      <span class="footer-message" role="status" :title="footerTip">{{ footerTip }}</span>
      <span class="footer-metrics" aria-label="project status"><span v-if="editor.project.selection.length">{{ editor.project.selection.length }} selected <i>·</i> </span>{{ editor.project.clips.length }} clips <i>·</i> <span title="project duration">{{ formatTime(editor.project.end) }}</span> <i>·</i> {{ editor.project.stage.width }}×{{ editor.project.stage.height }}</span>
    </footer>
    <ExportPanel/>
    <div v-if="confirmClear" class="modal-backdrop" @click.self="confirmClear = false">
      <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="clear-title">
        <span class="eyebrow">start fresh</span><h2 id="clear-title">new project?</h2>
        <p>your imported media, timeline, and edit history will be removed. this cannot be undone.</p>
        <div class="dialog-actions"><ActionButton variant="secondary" size="regular" shape="rectangle" autofocus @click="confirmClear = false">keep editing</ActionButton><ActionButton variant="danger" size="regular" shape="rectangle" class="danger" @click="editor.clear(); confirmClear = false">new project</ActionButton></div>
      </section>
    </div>
    <div v-if="showHelp" class="modal-backdrop" @click.self="showHelp = false">
      <section class="dialog help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <h2 id="help-title">editing help</h2>
        <div class="help-content">
        <section class="help-section"><h3>media</h3><dl class="help-guide"><dt>import</dt><dd>use + in the media header or drop local video and audio files into the media panel.</dd><dt>place</dt><dd>drag media onto a lane; a ghost previews placement. double-click its preview or choose add to timeline from … to add at the playhead in lane 1.</dd><dt>manage</dt><dd>double-click the name to rename, or use … for rename and delete. deleting media also removes its timeline clips.</dd></dl></section>
        <section class="help-section"><h3>timeline</h3><dl class="help-guide"><dt>edit</dt><dd>drag clips to move; drag their ends to trim. drag up or down within a lane to reorder overlaps.</dd><dt>select / scrub</dt><dd>drag empty lane space to select several clips. drag the ruler or playhead head to scrub.</dd><dt>navigate</dt><dd>middle-drag to pan; wheel to scroll; ctrl + wheel to zoom at the pointer. scrollbar ends change zoom.</dd><dt>options</dt><dd>use … for snap, autofill, zoom, and fit. drag the top divider stroke to resize the timeline.</dd><dt>split</dt><dd>hover the bottom of the playhead line to reveal split.</dd></dl></section>
        <section class="help-section"><h3>stage &amp; project</h3><dl class="help-guide"><dt>transform</dt><dd>select a video, then drag its stage box, corners, or rotation handle. rotation snaps to top-facing quarter turns; hold ctrl or shift for free rotation. use objects for shared selection properties.</dd><dt>stage</dt><dd>set dimensions or choose a preset in the stage tab. resizing changes the crop, preserving video size.</dd><dt>selection cues</dt><dd>dashed edges are covered by another video; dotted boxes are outside playhead time.</dd><dt>save / export</dt><dd>your project saves in this browser. watch a 5-second ad to export, then download your mp4.</dd><dt>start fresh</dt><dd>choose new project from the header menu to clear the saved project and media.</dd></dl></section>
        <section class="help-section"><h3>keyboard shortcuts</h3>
        <dl class="shortcuts"><dt>play / pause</dt><dd><kbd>space</kbd></dd><dt>step one frame</dt><dd><kbd>←</kbd> <kbd>→</kbd></dd><dt>split at playhead</dt><dd><kbd>S</kbd></dd><dt>delete selection</dt><dd><kbd>delete</kbd></dd><dt>undo / redo</dt><dd><kbd>ctrl Z</kbd> <kbd>ctrl Y</kbd></dd><dt>copy / paste</dt><dd><kbd>ctrl C</kbd> <kbd>ctrl V</kbd></dd><dt>add to selection</dt><dd><kbd>ctrl click</kbd></dd><dt>cancel drag / clear selection</dt><dd><kbd>esc</kbd></dd></dl>
        </section>
        </div>
        <ActionButton variant="primary" size="regular" shape="rectangle" class="primary full" @click="showHelp = false">back to editing</ActionButton>
      </section>
    </div>
  </main>
</template>
