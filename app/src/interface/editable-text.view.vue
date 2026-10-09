<script setup lang="ts">
import { ref, nextTick, watch, onBeforeUnmount } from 'vue';
const props = defineProps<{ modelValue: string; label: string; maxLength: number; resetKey?: number }>();
const emit = defineEmits<{ change: [value: string] }>();
const input = ref<HTMLInputElement>(), editing = ref(false), draft = ref('');
async function begin() {
  if (editing.value) return;
  draft.value = props.modelValue; editing.value = true;
  await nextTick(); input.value?.focus(); input.value?.select();
}
function commit() {
  if (!editing.value) return;
  editing.value = false;
  const value = draft.value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, props.maxLength);
  if (value && value !== props.modelValue) emit('change', value);
}
function cancel() { editing.value = false; }
function outside(event: PointerEvent) { if (editing.value && !input.value?.contains(event.target as Node)) commit(); }
watch(() => props.resetKey, cancel);
window.addEventListener('pointerdown', outside, true);
onBeforeUnmount(() => window.removeEventListener('pointerdown', outside, true));
defineExpose({ begin });
</script>

<template>
  <span class="editable-text" @pointerdown.stop @dblclick.stop @dragstart.stop.prevent>
    <input v-if="editing" ref="input" v-model="draft" :aria-label="label" :maxlength="maxLength" spellcheck="false" @keydown.stop @keydown.enter.prevent="commit" @keydown.esc.prevent="cancel" @blur="commit"/>
    <button v-else type="button" :title="modelValue" :aria-label="'rename ' + label" @dblclick.stop="begin" @keydown.enter.stop.prevent="begin" @keydown.f2.stop.prevent="begin">{{ modelValue }}</button>
  </span>
</template>

<style scoped>
.editable-text { display: block; min-width: 0; }
.editable-text > button, .editable-text > input { display: block; width: 100%; min-width: 0; height: 100%; margin: 0; padding: 2px 0; border: 0; border-radius: 0; background: transparent; color: #d7d7d7; font: inherit; line-height: inherit; text-align: left; }
.editable-text > button { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.editable-text > button:hover, .editable-text > button:focus-visible { background: transparent; color: #ffffff; }
.editable-text > input { background: #101010; color: #ffffff; }
</style>
