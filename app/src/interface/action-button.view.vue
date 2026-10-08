<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'secondary' | 'primary' | 'quiet' | 'danger' | 'toggle';
  size?: 'compact' | 'regular' | 'large';
  shape?: 'rectangle' | 'square' | 'circle';
}>(), { variant: 'secondary', size: 'regular', shape: 'rectangle' });
</script>

<template>
  <button type="button" class="ui-button" :class="['ui-button--' + variant, 'ui-button--' + size, 'ui-button--' + shape]">
    <slot/>
  </button>
</template>
