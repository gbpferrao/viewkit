<script setup lang="ts">
import ActionButton from '../interface/action-button.view.vue';
import InterfaceIcon from '../interface/interface-icon.view.vue';
import { ref, nextTick, watch, onBeforeUnmount } from 'vue';
import { useEditor } from '../app.composition';
import { formatTime } from '../shared/frame-math.contract';
const { project, mediaDrag, importer, timeline, playback, removeMedia } = useEditor();
const picker = ref<HTMLInputElement>();
const panel = ref<HTMLElement>();
const fileDropActive = ref(false);
let fileDragDepth = 0;
function hasFiles(event: DragEvent) { return !mediaDrag.value && !!event.dataTransfer?.types.includes('Files'); }
function clearFileDrop() { fileDragDepth = 0; fileDropActive.value = false; }
function enterFiles(event: DragEvent) {
  if (!hasFiles(event)) return;
  event.preventDefault(); event.stopPropagation(); fileDragDepth++; fileDropActive.value = true;
}
function overFiles(event: DragEvent) {
  if (!hasFiles(event)) return;
  event.preventDefault(); event.stopPropagation(); fileDropActive.value = true;
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
}
function leaveFiles(event: DragEvent) {
  if (!fileDropActive.value) return;
  event.stopPropagation(); fileDragDepth = Math.max(0, fileDragDepth - 1);
  if (!fileDragDepth) fileDropActive.value = false;
}
function dropFiles(event: DragEvent) {
  clearFileDrop();
  if (!hasFiles(event)) return;
  event.preventDefault(); event.stopPropagation(); closeMenu();
  const files = [...(event.dataTransfer?.files ?? [])];
  if (files.length) void importer.importFiles(files);
}
window.addEventListener('drop', clearFileDrop);
window.addEventListener('dragend', clearFileDrop);
window.addEventListener('blur', clearFileDrop);
const menuId = ref<string | null>(null), editingId = ref<string | null>(null), nameDraft = ref('');
function card(id: string) { return panel.value?.querySelector<HTMLElement>(`[data-source-id="${id}"]`); }
async function toggleMenu(id: string) {
  menuId.value = menuId.value === id ? null : id;
  if (menuId.value) { await nextTick(); card(id)?.querySelector<HTMLButtonElement>('[role=menuitem]')?.focus(); }
}
function closeMenu(focus = false) { const id = menuId.value; menuId.value = null; if (focus && id) card(id)?.querySelector<HTMLButtonElement>('.source-options-trigger')?.focus(); }
async function rename(id: string) {
  const source = project.sources.find(item => item.id === id); if (!source) return;
  closeMenu(); editingId.value = id; nameDraft.value = source.name;
  await nextTick(); const input = card(id)?.querySelector<HTMLInputElement>('.source-name-input'); input?.focus(); input?.select();
}
function commitName() { if (!editingId.value) return; project.renameSource(editingId.value, nameDraft.value); editingId.value = null; }
function nameKey(event: KeyboardEvent) { if (event.key === 'Enter') { event.preventDefault(); commitName(); } else if (event.key === 'Escape') { event.preventDefault(); editingId.value = null; } }
function menuKey(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.preventDefault(); closeMenu(true); }
  else if (event.key === 'Tab') closeMenu();
  else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault(); const buttons = [...(card(menuId.value!)?.querySelectorAll<HTMLButtonElement>('[role=menuitem]') ?? [])];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    buttons[event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowUp' ? -1 : 1) + buttons.length) % buttons.length]?.focus();
  }
}
function outside(event: PointerEvent) { if (!(event.target as HTMLElement).closest('.source-options')) closeMenu(); }
function deleteMedia(id: string) { closeMenu(); if (editingId.value === id) editingId.value = null; removeMedia(id); }
function addMedia(id: string) { closeMenu(); timeline.place(id, playback.time.value, 0); }
watch(() => project.generation, () => { closeMenu(); editingId.value = null; });
window.addEventListener('pointerdown', outside);
onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', outside); mediaDrag.value = null;
  window.removeEventListener('drop', clearFileDrop); window.removeEventListener('dragend', clearFileDrop); window.removeEventListener('blur', clearFileDrop);
});
function pick(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files) void importer.importFiles([...input.files]);
  input.value = '';
}
function drag(event: DragEvent, id: string) { if (editingId.value || (event.target as HTMLElement).closest('button,input')) { event.preventDefault(); return; } closeMenu(); mediaDrag.value = id; event.dataTransfer?.setData('application/x-viewkit-source', id); if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy'; }
</script>
<template>
  <aside ref="panel" class="media-panel" :class="{ 'file-drop-active': fileDropActive }" @dragenter="enterFiles" @dragover="overFiles" @dragleave="leaveFiles" @drop="dropFiles">
    <span v-if="fileDropActive" class="media-drop-label" aria-hidden="true">drop to import</span>
    <div class="panel-heading"><h2>media</h2><span class="count">{{ project.sources.length }}</span><ActionButton variant="quiet" size="compact" shape="square" class="icon-button" :title="project.importing ? 'importing media…' : 'import media'" aria-label="import media" :disabled="project.importing" @click="picker?.click()"><InterfaceIcon name="plus-lg"/></ActionButton></div>
    <input ref="picker" data-testid="media-input" type="file" hidden multiple accept=".mp4,.webm,.mov,.mp3,.wav,.aac,.m4a" @change="pick"/>
    <div class="media-list" :class="{ 'media-list-empty': !project.sources.length }">
      <p v-if="!project.sources.length" class="media-empty-label">no media yet</p>
      <article v-for="source in project.sources" :key="source.id" class="source-card" draggable="true" @dragstart="drag($event, source.id)" @dragend="mediaDrag = null" @dblclick="timeline.place(source.id, playback.time.value, 0)" :data-source-id="source.id">
        <div class="source-preview">
          <video v-if="source.kind === 'video'" :src="source.url" muted preload="metadata" tabindex="-1"/>
          <div v-else class="audio-art"><InterfaceIcon name="soundwave"/></div>
          <span class="source-duration">{{ formatTime(source.duration) }}</span>
        </div>
        <div class="source-description">
          <div class="source-name-row">
            <input v-if="editingId === source.id" v-model="nameDraft" class="source-name-input" aria-label="media name" maxlength="120" @pointerdown.stop @dblclick.stop @keydown.stop="nameKey" @blur="commitName"/>
            <span v-else class="source-name" :title="source.name" @dblclick.stop="rename(source.id)">{{ source.name }}</span>
            <div class="source-options" @pointerdown.stop @dblclick.stop>
              <ActionButton class="source-options-trigger" variant="quiet" size="compact" shape="circle" aria-label="media options" aria-haspopup="menu" :aria-expanded="menuId === source.id" @click="toggleMenu(source.id)" @keydown.down.stop.prevent="toggleMenu(source.id)"><InterfaceIcon name="three-dots"/></ActionButton>
              <div v-if="menuId === source.id" class="source-options-menu" role="menu" aria-label="media options" @keydown.stop="menuKey">
                <ActionButton variant="quiet" role="menuitem" @click="addMedia(source.id)"><InterfaceIcon name="film"/>add to timeline</ActionButton>
                <ActionButton variant="quiet" role="menuitem" @click="rename(source.id)"><InterfaceIcon name="pencil"/>rename</ActionButton>
                <ActionButton variant="quiet" role="menuitem" title="delete media and its timeline clips" @click="deleteMedia(source.id)"><InterfaceIcon name="trash"/>delete media</ActionButton>
              </div>
            </div>
          </div>
          <small>{{ source.kind === 'video' ? source.width + ' × ' + source.height : 'audio' }}</small>
        </div>
      </article>
    </div>
  </aside>
</template>

