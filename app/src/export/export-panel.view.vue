<script setup lang="ts">
import ActionButton from '../interface/action-button.view.vue';
import InterfaceIcon from '../interface/interface-icon.view.vue';
import { useEditor } from '../app.composition';
const { exporter } = useEditor();
</script>
<template>
  <div v-if="exporter.state.busy" class="modal-backdrop">
    <section class="dialog export-dialog" role="dialog" aria-modal="true" aria-labelledby="export-title">
      <template v-if="exporter.state.phase === 'ad-ready'">
        <h2 id="export-title" class="export-dialog-heading">export your video</h2>
        <p class="export-dialog-status">watch a 5-second ad to export</p>
        <div class="export-ad-actions">
          <ActionButton variant="primary" class="full" @click="exporter.watchAd()"><InterfaceIcon name="play-fill"/>watch ad</ActionButton>
          <ActionButton variant="quiet" class="full" @click="exporter.cancel()">cancel</ActionButton>
        </div>
      </template>
      <template v-else-if="exporter.state.phase === 'ad-playing'">
        <h2 id="export-title" class="export-dialog-heading">watching ad</h2>
        <p class="export-dialog-status" role="status">your export starts when the ad ends</p>
        <div class="export-ad-placement" role="img" aria-label="advertisement"><InterfaceIcon name="play-btn"/><span>advertisement</span></div>
        <div class="export-progress" role="progressbar" aria-label="ad progress" :aria-valuenow="Math.round(exporter.state.progress * 100)" aria-valuemin="0" aria-valuemax="100"><span :style="{ width: exporter.state.progress * 100 + '%' }"></span></div>
        <div class="export-progress-label"><span class="export-frame-count">{{ exporter.state.adRemaining }} s remaining</span><strong>{{ Math.round(exporter.state.progress * 100) }}%</strong></div>
        <ActionButton variant="secondary" class="full" @click="exporter.cancel()">cancel</ActionButton>
      </template>
      <template v-else>
      <h2 id="export-title" class="export-dialog-heading">rendering your video</h2>
      <p class="export-dialog-status" role="status">{{ exporter.state.label }}</p>
      <div class="export-progress" role="progressbar" aria-label="video rendering progress" :aria-valuenow="Math.round(exporter.state.progress * 100)" aria-valuemin="0" aria-valuemax="100"><span :style="{ width: exporter.state.progress * 100 + '%' }"></span></div>
      <div class="export-progress-label"><span class="export-frame-count">{{ exporter.state.estimatedFrames ? '≈ ' : '' }}{{ exporter.state.currentFrame.toLocaleString() }} / {{ exporter.state.totalFrames.toLocaleString() }} frames</span><strong>{{ Math.round(exporter.state.progress * 100) }}%</strong></div>
      <ActionButton variant="secondary" size="regular" shape="rectangle" class="full" @click="exporter.cancel()">cancel export</ActionButton>
      </template>
    </section>
  </div>
</template>

