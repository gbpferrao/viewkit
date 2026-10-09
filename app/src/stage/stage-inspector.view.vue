<script setup lang="ts">
import ActionButton from '../interface/action-button.view.vue';
import InterfaceIcon from '../interface/interface-icon.view.vue';
import NumberInput from '../interface/number-input.view.vue';
import { computed, ref, watch, onBeforeUnmount, nextTick } from 'vue';
import { useEditor } from '../app.composition';
import { defaultTransform, resizeStageDimension } from './stage-size.model';
import type { StageTransform } from './stage-size.model';
const { project, stage, timeline, playback } = useEditor();
const tab = ref<'stage' | 'objects'>('stage');
const presetsOpen = ref(false), presetsRoot = ref<HTMLElement>();
const lockedRatio = ref<number | null>(null);
const canSwap = computed(() => project.stage.height >= 320 && project.stage.width <= 2160);
const stagePresets = [
  { label: '16:9 · 360p', width: 640, height: 360 },
  { label: '16:9 · 480p', width: 854, height: 480 },
  { label: '16:9 · 720p', width: 1280, height: 720 },
  { label: '16:9 · 1080p', width: 1920, height: 1080 },
  { label: 'portrait 9:16', width: 720, height: 1280 },
  { label: 'portrait 9:16 · HD', width: 1080, height: 1920 },
  { label: 'square 1:1', width: 1080, height: 1080 },
  { label: 'portrait 4:5', width: 1080, height: 1350 },
  { label: 'landscape 4:3', width: 1440, height: 1080 },
  { label: 'landscape 3:2', width: 1620, height: 1080 },
  { label: 'cinema 21:9', width: 2520, height: 1080 },
  { label: '16:9 · 4K', width: 3840, height: 2160 }
];
function setDimension(key: 'width' | 'height', value: number) {
  const size = resizeStageDimension(project.stage, key, value, lockedRatio.value);
  stage.setSize(size.width, size.height);
}
function toggleRatio() { lockedRatio.value = lockedRatio.value === null ? project.stage.width / project.stage.height : null; }
function chooseSize(width: number, height: number) {
  stage.setSize(width, height);
  if (lockedRatio.value !== null) lockedRatio.value = project.stage.width / project.stage.height;
}
watch(() => project.generation, () => { lockedRatio.value = null; });
async function openPresets() {
  presetsOpen.value = true;
  await nextTick(); presetsRoot.value?.querySelector<HTMLElement>('[role="menuitemradio"]')?.focus();
}
function closePresets(focus = false) {
  presetsOpen.value = false;
  if (focus) presetsRoot.value?.querySelector<HTMLButtonElement>('.stage-presets-trigger')?.focus();
}
function outsidePresets(event: PointerEvent) {
  if (!presetsRoot.value?.contains(event.target as Node)) closePresets();
}
function presetKeys(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.preventDefault(); closePresets(true); return; }
  if (event.key === 'Tab') { closePresets(); return; }
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const items = [...presetsRoot.value!.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')];
  const current = items.indexOf(document.activeElement as HTMLButtonElement);
  const index = event.key === 'Home' ? 0 : event.key === 'End' ? items.length-1
    : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
  items[index]?.focus();
}
window.addEventListener('pointerdown', outsidePresets, true);
onBeforeUnmount(() => window.removeEventListener('pointerdown', outsidePresets, true));
const volumeDraft = ref<number | null>(null);
const sourceById = computed(() => new Map(project.sources.map(source => [source.id, source])));
const selected = computed(() => project.selected);
const selectionIds = computed(() => project.selection.join('|'));
const videoCount = computed(() => selected.value.filter(clip => sourceById.value.get(clip.sourceId)?.kind === 'video').length);
const canTransform = computed(() => selected.value.length > 0 && videoCount.value === selected.value.length);
const sharedVolume = computed(() => {
  const first = selected.value[0]?.volume;
  return first !== undefined && selected.value.every(clip => clip.volume === first) ? first : null;
});
const displayedVolume = computed(() => volumeDraft.value ?? sharedVolume.value);
const sliderVolume = computed(() => displayedVolume.value ?? Math.round(selected.value.reduce((sum, clip) => sum + clip.volume, 0) / Math.max(1, selected.value.length)));
const transformGroups: { title: string; icon: string; fields: { key: keyof StageTransform; label: string; ariaLabel: string; step: number; min?: number; max?: number }[] }[] = [
  { title: 'position', icon: 'arrows-move', fields: [{ key: 'x', label: 'x', ariaLabel: 'clip x', step: 1 }, { key: 'y', label: 'y', ariaLabel: 'clip y', step: 1 }] },
  { title: 'scale', icon: 'arrows-angle-expand', fields: [{ key: 'scaleX', label: 'x', ariaLabel: 'scale x', step: .05, min: .05, max: 10 }, { key: 'scaleY', label: 'y', ariaLabel: 'scale y', step: .05, min: .05, max: 10 }] },
  { title: 'rotation', icon: 'arrow-clockwise', fields: [{ key: 'rotation', label: '°', ariaLabel: 'rotation', step: 1 }] }
];
function clearVolumeDraft() { volumeDraft.value = null; playback.clearVolumePreview(); }
watch(selectionIds, () => { clearVolumeDraft(); tab.value = project.selection.length ? 'objects' : 'stage'; }, { flush: 'sync' });
watch(tab, () => { clearVolumeDraft(); closePresets(); });
onBeforeUnmount(clearVolumeDraft);
function commonTransform(key: keyof StageTransform) {
  if (!canTransform.value) return '';
  const first = selected.value[0].transform[key];
  return selected.value.every(clip => clip.transform[key] === first) ? Number(first.toFixed(2)) : '';
}
function transform(key: keyof StageTransform, value: number) {
  if (!canTransform.value) return;
  if (Number.isFinite(value)) stage.setSelectedTransform({ [key]: Number(value.toFixed(2)) });
}
function previewVolume(event: Event) {
  if (!selected.value.length) return;
  volumeDraft.value = (event.target as HTMLInputElement).valueAsNumber;
  playback.previewVolume(project.selection, volumeDraft.value);
}
function commitVolume() {
  if (volumeDraft.value !== null && selected.value.length) timeline.setVolume(volumeDraft.value);
  clearVolumeDraft();
}
function tabKeys(event: KeyboardEvent) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault(); event.stopPropagation();
  tab.value = event.key === 'Home' ? 'stage' : event.key === 'End' ? 'objects' : tab.value === 'stage' ? 'objects' : 'stage';
  document.getElementById('inspector-tab-' + tab.value)?.focus();
}
</script>

<template>
  <aside class="inspector-panel">
    <div class="inspector-tabs" role="tablist" aria-label="properties" @keydown="tabKeys">
      <ActionButton id="inspector-tab-stage" class="inspector-tab" variant="quiet" role="tab" :aria-selected="tab === 'stage'" aria-controls="inspector-stage" :tabindex="tab === 'stage' ? 0 : -1" @click="tab = 'stage'"><InterfaceIcon name="aspect-ratio"/>stage</ActionButton>
      <ActionButton id="inspector-tab-objects" class="inspector-tab" variant="quiet" role="tab" :aria-selected="tab === 'objects'" aria-controls="inspector-objects" :tabindex="tab === 'objects' ? 0 : -1" @click="tab = 'objects'"><InterfaceIcon name="bounding-box"/>objects</ActionButton>
    </div>
    <div class="inspector-scroll">
      <div v-show="tab === 'stage'" id="inspector-stage" role="tabpanel" aria-labelledby="inspector-tab-stage">
        <section class="inspector-section stage-dimensions-section">
          <div class="property-row stage-dimensions-row">
            <div class="property-controls">
              <NumberInput label="stage width" :min="320" :max="3840" :decimals="0" :model-value="project.stage.width" @change="setDimension('width', $event)"/>
              <span class="dimension-separator" aria-hidden="true">×</span>
              <NumberInput label="stage height" :min="240" :max="2160" :decimals="0" :model-value="project.stage.height" @change="setDimension('height', $event)"/>
            </div>
            <ActionButton class="stage-dimension-action" variant="quiet" size="compact" shape="square" aria-label="swap width and height" :title="canSwap ? 'swap width and height' : 'swapped size exceeds stage limits'" :disabled="!canSwap" @click="chooseSize(project.stage.height, project.stage.width)"><InterfaceIcon name="arrow-left-right"/></ActionButton>
            <ActionButton class="stage-dimension-action" variant="toggle" size="compact" shape="square" aria-label="lock aspect ratio" title="lock aspect ratio" :aria-pressed="lockedRatio !== null" @click="toggleRatio"><InterfaceIcon :name="lockedRatio !== null ? 'lock' : 'unlock'"/></ActionButton>
            <div ref="presetsRoot" class="stage-presets">
              <ActionButton class="stage-presets-trigger" variant="quiet" size="compact" shape="square" aria-label="stage size presets" title="stage size presets" aria-haspopup="menu" aria-controls="stage-presets-menu" :aria-expanded="presetsOpen" @click="presetsOpen ? closePresets(true) : openPresets()" @keydown.down.stop.prevent="openPresets"><InterfaceIcon name="chevron-down"/></ActionButton>
              <div v-if="presetsOpen" id="stage-presets-menu" class="stage-presets-menu" role="menu" aria-label="stage size presets" @keydown.stop="presetKeys">
                <ActionButton v-for="preset in stagePresets" :key="preset.label" class="stage-preset-item" variant="quiet" role="menuitemradio" tabindex="-1" :aria-checked="project.stage.width === preset.width && project.stage.height === preset.height" @click="chooseSize(preset.width, preset.height); closePresets(true)"><span>{{ preset.label }}</span><small>{{ preset.width }}×{{ preset.height }}</small></ActionButton>
              </div>
            </div>
          </div>
        </section>
      </div>
      <div v-show="tab === 'objects'" id="inspector-objects" role="tabpanel" aria-labelledby="inspector-tab-objects">
          <section class="inspector-section">
            <fieldset class="property-fields" :disabled="!selected.length">
              <div class="property-row volume-property" title="volume (%)">
                <span class="property-icon"><InterfaceIcon name="volume-up"/></span>
                <input aria-label="clip volume" :aria-valuetext="!selected.length ? 'unavailable' : displayedVolume === null ? 'mixed values; choose a volume for all selected objects' : displayedVolume + '%'" class="volume-range" type="range" min="0" max="100" step="1" :value="sliderVolume" @input="previewVolume" @change="commitVolume" @keydown.esc.prevent="clearVolumeDraft" @pointercancel="clearVolumeDraft" @blur="clearVolumeDraft"/>
                <NumberInput label="volume value (%)" :min="0" :max="100" :decimals="0" :model-value="displayedVolume ?? ''" :placeholder="selected.length ? 'mixed' : '—'" @change="timeline.setVolume"/>
              </div>
            </fieldset>
          </section>
          <section class="inspector-section">
            <div class="section-title"><h3>video transform</h3><ActionButton variant="quiet" size="compact" class="reset-transform" :disabled="!canTransform" @click="stage.setSelectedTransform(defaultTransform())">reset</ActionButton></div>
            <fieldset class="transform-fields" :disabled="!canTransform">
              <div v-for="group in transformGroups" :key="group.title" class="property-row" :title="group.title + (group.title === 'position' ? ' (px)' : '')">
                <span class="property-icon"><InterfaceIcon :name="group.icon"/></span>
                <div class="property-controls">
                  <label v-for="field in group.fields" :key="field.key" class="property-number"><span>{{ field.label }}</span><NumberInput :label="field.ariaLabel" :step="field.step" :min="field.min" :max="field.max" :model-value="commonTransform(field.key)" :placeholder="canTransform ? 'mixed' : '—'" @change="transform(field.key, $event)"/></label>
                </div>
              </div>
            </fieldset>
          </section>
      </div>
    </div>
  </aside>
</template>
