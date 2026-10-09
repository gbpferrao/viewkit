<script setup lang="ts">
import type { Clip, MediaSource } from '../timeline/timeline.model';
import type { StageSize, StageTransform } from './stage-size.model';
import { videoWorldSize } from './stage-size.model';
import { computed } from 'vue';
const props = defineProps<{ clip: Clip; source: MediaSource; stage: StageSize; transform: StageTransform; previewScale: number }>();
const emit = defineEmits<{ begin: [event: PointerEvent, action: 'move' | 'scale' | 'rotate'] }>();
const style = computed(() => {
  const size = videoWorldSize(props.source), transform = props.transform;
  return { left: (props.stage.width / 2 + transform.x) * props.previewScale + 'px', top: (props.stage.height / 2 + transform.y) * props.previewScale + 'px',
    width: size.width * transform.scaleX * props.previewScale + 'px', height: size.height * transform.scaleY * props.previewScale + 'px',
    transform: 'translate(-50%, -50%) rotate(' + transform.rotation + 'deg)' };
});
</script>
<template>
  <div class="stage-selection" :style="style" @pointerdown.stop="emit('begin', $event, 'move')">
    <button class="stage-scale corner-top-left" aria-label="scale clip" @pointerdown.stop="emit('begin', $event, 'scale')"></button>
    <button class="stage-scale corner-top-right" aria-label="scale clip" @pointerdown.stop="emit('begin', $event, 'scale')"></button>
    <button class="stage-scale corner-bottom-left" aria-label="scale clip" @pointerdown.stop="emit('begin', $event, 'scale')"></button>
    <button class="stage-scale corner-bottom-right" aria-label="scale clip" @pointerdown.stop="emit('begin', $event, 'scale')"></button>
    <span class="rotate-stem"></span><button type="button" class="stage-rotate" aria-label="rotate clip" @pointerdown.stop="emit('begin', $event, 'rotate')"></button>
  </div>
</template>

