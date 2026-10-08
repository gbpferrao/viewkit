<script setup lang="ts">
defineProps<{ name: string }>();
</script>

<template>
  <span class="ui-icon" aria-hidden="true"><span class="bi" :class="'bi-' + name"></span></span>
</template>
