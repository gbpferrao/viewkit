<script setup lang="ts">
import InterfaceIcon from '../interface/interface-icon.view.vue';
import type { Clip, MediaSource } from './timeline.model';
import { formatTime } from '../shared/frame-math.contract';
import { computed } from 'vue';
import type { VideoThumbnails } from '../media/video-thumbnails.resource';
const props = defineProps<{ clip: Clip; source: MediaSource; selected: boolean; pixelsPerSecond: number; row: number; clipHeight: number; visibleLeft: number; visibleRight: number; thumbnails: VideoThumbnails }>();
const cells = computed(() => {
  if (props.source.kind !== 'video') return [];
  const width = props.clip.duration * props.pixelsPerSecond;
  const origin = props.clip.start * props.pixelsPerSecond;
  const first = Math.max(0, Math.floor((props.visibleLeft - origin) / 68));
  const last = Math.min(Math.ceil(width / 68), Math.ceil((props.visibleRight - origin) / 68));
  return Array.from({ length: Math.max(0, last - first) }, (_, index) => {
    const slot = first + index, left = slot * 68;
    const sourceTime = props.clip.offset + Math.min(props.clip.duration - 1 / 24, (left + 32) / props.pixelsPerSecond);
    return { slot, left, time: sourceTime };
  });
});
const displayedCells = computed(() => {
  return cells.value.map(cell => ({ ...cell, image: props.thumbnails.peek(props.source, cell.time, 68 / props.pixelsPerSecond) }));
});
const emit = defineEmits<{ gesture: [event: PointerEvent, clip: Clip, edge: 'start' | 'end' | null] }>();
</script>
<template>
  <div class="clip" :class="{ selected, 'audio-clip': source.kind === 'audio' }"
    :style="{ left: clip.start * pixelsPerSecond + 'px', width: Math.max(4, clip.duration * pixelsPerSecond) + 'px', top: row * (clipHeight + 4) + 5 + 'px', height: clipHeight + 'px' }"
    :data-clip-id="clip.id" tabindex="0" role="button" :aria-label="source.name + ', lane ' + (clip.lane + 1) + ', ' + formatTime(clip.start)"
    @pointerdown.stop="emit('gesture', $event, clip, null)">
    <div class="clip-trim left" title="trim start" @pointerdown.stop="emit('gesture', $event, clip, 'start')"></div>
    <div class="clip-content"><InterfaceIcon class="clip-kind" :name="source.kind === 'video' ? 'camera-video' : 'music-note-beamed'"/><span class="clip-name">{{ source.name }}</span><small>{{ formatTime(clip.duration) }}</small></div>
    <div v-if="source.kind === 'video'" class="clip-thumbnails" aria-hidden="true"><template v-for="cell in displayedCells" :key="cell.slot"><img v-if="cell.image" :src="cell.image" :style="{ left: cell.left + 'px' }" alt="" draggable="false"/></template></div>
    <div v-else class="clip-texture audio-texture"></div>
    <div class="clip-trim right" title="trim end" @pointerdown.stop="emit('gesture', $event, clip, 'end')"></div>
  </div>
</template>

