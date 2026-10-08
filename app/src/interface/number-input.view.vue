<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import InterfaceIcon from './interface-icon.view.vue';
const props = withDefaults(defineProps<{
  modelValue: number | ''; label: string; step?: number; min?: number; max?: number;
  decimals?: number; placeholder?: string; disabled?: boolean;
}>(), { step: 1, decimals: 2, placeholder: '' });
const emit = defineEmits<{ 'update:modelValue': [value: number]; change: [value: number] }>();
const input = ref<HTMLInputElement>();
const text = ref(String(props.modelValue));
watch(() => props.modelValue, value => { text.value = String(value); });
const round = (value: number) => Number(value.toFixed(props.decimals));
function unavailable() { return props.disabled || input.value?.matches(':disabled'); }
async function publish(value: number) {
  if (unavailable() || !Number.isFinite(value)) return;
  value = round(value);
  text.value = String(value);
  if (value !== props.modelValue) { emit('update:modelValue', value); emit('change', value); }
  await nextTick();
  // The feature owner can reject a value; restore its authoritative display.
  text.value = String(props.modelValue);
}
function commit() {
  const value = input.value?.valueAsNumber;
  if (value === undefined || !Number.isFinite(value)) { text.value = String(props.modelValue); return; }
  void publish(value);
}
function stepBy(direction: number) {
  if (unavailable()) return;
  const typed = input.value?.valueAsNumber;
  const base = typed !== undefined && Number.isFinite(typed) ? typed
    : props.modelValue === '' ? Math.max(props.min ?? 0, Math.min(props.max ?? 0, 0)) : props.modelValue;
  const value = Math.max(props.min ?? -Infinity, Math.min(props.max ?? Infinity, round(base + direction * props.step)));
  void publish(value);
}
function keys(event: KeyboardEvent) {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault(); event.stopPropagation(); stepBy(event.key === 'ArrowUp' ? 1 : -1);
  } else if (event.key === 'Enter') { event.preventDefault(); commit(); }
  else if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); text.value = String(props.modelValue); input.value?.blur(); }
}
</script>
<template>
  <div class="ui-number-input" :class="{ disabled }">
    <input ref="input" type="number" step="any" :min="min" :max="max" :disabled="disabled" :aria-label="label" :placeholder="placeholder" :value="text" @input="text = ($event.target as HTMLInputElement).value" @blur="commit" @keydown="keys"/>
    <span class="ui-number-steps">
      <button type="button" tabindex="-1" :disabled="disabled || (modelValue !== '' && max !== undefined && modelValue >= max)" :aria-label="'increase ' + label" title="increase" @pointerdown.prevent @click="stepBy(1)"><InterfaceIcon name="chevron-up"/></button>
      <button type="button" tabindex="-1" :disabled="disabled || (modelValue !== '' && min !== undefined && modelValue <= min)" :aria-label="'decrease ' + label" title="decrease" @pointerdown.prevent @click="stepBy(-1)"><InterfaceIcon name="chevron-down"/></button>
    </span>
  </div>
</template>
