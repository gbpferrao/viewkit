<script setup lang="ts">
import { computed } from 'vue';
import type { Point } from './selection-bounds.model';
import { outlineSegments } from './selection-bounds.model';
import type { StageSize } from './stage-size.model';
const props = defineProps<{ stage: StageSize; scale: number; objects: { id: string; corners: Point[]; active: boolean }[]; layers: { id: string; corners: Point[] }[] }>();
const outlines = computed(() => props.objects.map(object => {
  const layer = props.layers.findIndex(item => item.id === object.id);
  const occluders = object.active && layer >= 0 ? props.layers.slice(layer + 1).map(item => item.corners) : [];
  return { ...object, segments: outlineSegments(object.corners, occluders) };
}));
const overall = computed(() => {
  if (props.objects.length < 2) return null;
  const points = props.objects.flatMap(object => object.corners);
  const left = Math.min(...points.map(point => point.x)), top = Math.min(...points.map(point => point.y));
  const padding = 6 / Math.max(.01, props.scale);
  return { x: left - padding, y: top - padding, width: Math.max(...points.map(point => point.x)) - left + 2 * padding, height: Math.max(...points.map(point => point.y)) - top + 2 * padding };
});
</script>
<template>
  <svg class="stage-selection-outlines" :viewBox="`0 0 ${stage.width} ${stage.height}`" aria-hidden="true">
    <g v-for="object in outlines" :key="object.id" :class="{ 'inactive-object': !object.active, 'individual-object': objects.length > 1 }">
      <line v-for="(segment, index) in object.segments" :key="index" :x1="segment.start.x" :y1="segment.start.y" :x2="segment.end.x" :y2="segment.end.y" :class="{ covered: segment.covered }" vector-effect="non-scaling-stroke"/>
    </g>
    <rect v-if="overall" class="stage-overall-bounds" :class="{ 'inactive-bounds': !objects.some(object => object.active) }" v-bind="overall" vector-effect="non-scaling-stroke"/>
  </svg>
</template>
