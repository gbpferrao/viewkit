/// <reference lib="webworker" />
import { Input, BlobSource, ALL_FORMATS, VideoSampleSink, AudioSampleSink, AudioSample,
  Output, Mp4OutputFormat, BufferTarget, CanvasSource, AudioSampleSource, canEncodeVideo, canEncodeAudio } from 'mediabunny';
import type { VideoSample } from 'mediabunny';
import type { RenderRequest, RenderReply } from './native-render.contract';
import type { Clip } from '../timeline/timeline.model';
import { renderOrder, timelineEnd, isActive, validateClips } from '../timeline/timeline.model';
import { validateStage, validateTransform, videoWorldSize } from '../stage/stage-size.model';
import { createGpuCompositor } from '../stage/gpu-compositor.resource';
import type { RenderLayer } from '../stage/gpu-compositor.resource';
import { FPS } from '../shared/frame-math.contract';
const scope = self as unknown as DedicatedWorkerGlobalScope;
const report = (reply: RenderReply) => scope.postMessage(reply);
const RATE = 48000, AUDIO_FRAMES = RATE / FPS;

/** One streaming decoder cursor per active clip; source bytes remain browser-owned blobs. */
class AudioCursor {
  private sample: AudioSample | null = null;
  private planes: Float32Array[] = [];
  private done = false;
  constructor(private iterator: AsyncGenerator<AudioSample, void, unknown>) {}
  async mix(clip: Clip, time: number, output: Float32Array) {
    const gain = clip.volume / 100;
    if (!gain) return;
    for (let index = 0; index < AUDIO_FRAMES; index++) {
      const timelineTime = time + index / RATE;
      if (!isActive(clip, timelineTime)) continue;
      const sourceTime = clip.offset + timelineTime - clip.start;
      while (!this.done && (!this.sample || sourceTime >= this.sample.timestamp + this.sample.duration - 1e-9)) {
        this.sample?.close(); this.sample = null;
        const next = await this.iterator.next();
        if (next.done) { this.done = true; this.planes = []; break; }
        this.sample = next.value;
        this.planes = Array.from({ length: Math.min(2, this.sample.numberOfChannels) }, (_, planeIndex) => {
          const plane = new Float32Array(this.sample!.numberOfFrames);
          this.sample!.copyTo(plane, { format: 'f32-planar', planeIndex }); return plane;
        });
      }
      if (!this.sample || sourceTime < this.sample.timestamp) continue;
      const position = (sourceTime - this.sample.timestamp) * this.sample.sampleRate;
      const first = Math.max(0, Math.min(this.sample.numberOfFrames - 1, Math.floor(position)));
      const second = Math.min(first + 1, this.sample.numberOfFrames - 1), fraction = position - Math.floor(position);
      for (let channel = 0; channel < 2; channel++) {
        const plane = this.planes[Math.min(channel, this.planes.length - 1)];
        output[index*2+channel] += (plane[first] + (plane[second] - plane[first]) * fraction) * gain;
      }
    }
  }
  async dispose() { this.sample?.close(); this.sample = null; await this.iterator.return(); }
}

async function render(request: RenderRequest) {
  const { snapshot, sources } = request;
  validateStage(snapshot.stage);
  validateClips(snapshot.clips, sources.map(source => ({ ...source, url: '' })));
  for (const clip of snapshot.clips) validateTransform(clip.transform);
  const duration = timelineEnd(snapshot.clips), { width, height } = snapshot.stage;
  if (!duration || width % 2 || height % 2 || typeof VideoEncoder === 'undefined' || typeof AudioEncoder === 'undefined') {
    throw new Error('native encoder cannot handle this stage');
  }
  const bitrate = Math.max(2_000_000, Math.min(24_000_000, width * height * FPS * .22));
  const hardwareAcceleration = await canEncodeVideo('avc', { width, height, frameRate: FPS, bitrate, hardwareAcceleration: 'prefer-hardware' })
    ? 'prefer-hardware' : 'no-preference';
  if (!await canEncodeVideo('avc', { width, height, frameRate: FPS, bitrate, hardwareAcceleration }) ||
      !await canEncodeAudio('aac', { sampleRate: RATE, numberOfChannels: 2, bitrate: 192000 })) {
    throw new Error('native MP4 codecs unavailable');
  }
  const inputs: Input[] = [];
  const videos = new Map<string, VideoSampleSink>();
  const audios = new Map<string, AudioSampleSink>();
  const videoCursors = new Map<string, AsyncGenerator<VideoSample | null, void, unknown>>();
  const audioCursors = new Map<string, AudioCursor>();
  const ordered = renderOrder(snapshot.clips);
  const sourceById = new Map(sources.map(source => [source.id, source]));
  let gpu: Awaited<ReturnType<typeof createGpuCompositor>> | null = null;
  let output: Output<Mp4OutputFormat, BufferTarget> | null = null;
  try {
    report({ type: 'progress', progress: .01, label: 'preparing local media' });
    for (const source of sources) {
      const input = new Input({ source: new BlobSource(source.file), formats: ALL_FORMATS }); inputs.push(input);
      const [video, audio] = await Promise.all([input.getPrimaryVideoTrack(), input.getPrimaryAudioTrack()]);
      if (source.kind === 'video') {
        if (!video || !await video.canDecode()) throw new Error('native video decoder unavailable');
        videos.set(source.id, new VideoSampleSink(video));
      }
      if (audio) {
        if (!await audio.canDecode() || await audio.getNumberOfChannels() > 2) throw new Error('native audio decoder unavailable');
        audios.set(source.id, new AudioSampleSink(audio));
      } else if (source.kind === 'audio') throw new Error('audio track unavailable');
    }
    let canvas = new OffscreenCanvas(width, height);
    let context: OffscreenCanvasRenderingContext2D | null = null;
    try { gpu = await createGpuCompositor(canvas); }
    catch { canvas = new OffscreenCanvas(width, height); context = canvas.getContext('2d', { alpha: false }); }
    if (!gpu && !context) throw new Error('canvas renderer unavailable');
    output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });
    const videoOutput = new CanvasSource(canvas, { codec: 'avc', bitrate, hardwareAcceleration, latencyMode: 'quality', keyFrameInterval: 2 });
    const audioOutput = new AudioSampleSource({ codec: 'aac', bitrate: 192000 });
    output.addVideoTrack(videoOutput, { frameRate: FPS }); output.addAudioTrack(audioOutput);
    await output.start();
    const frames = Math.round(duration * FPS);
    let progressStamp = 0;
    for (let frameIndex = 0; frameIndex < frames; frameIndex++) {
      const time = frameIndex / FPS;
      const active = ordered.filter(clip => isActive(clip, time));
      const samples: VideoSample[] = [], gpuFrames: VideoFrame[] = [], layers: RenderLayer[] = [];
      try {
        if (context) { context.resetTransform(); context.fillStyle = '#000'; context.fillRect(0, 0, width, height); }
        // Decode independent active clips concurrently, retaining a bounded predecode pipeline for each.
        const results = await Promise.allSettled(active.filter(clip => videos.has(clip.sourceId)).map(async clip => {
          let cursor = videoCursors.get(clip.id);
          if (!cursor) {
            function* timestamps() {
              const first = Math.round(clip.start * FPS), count = Math.round(clip.duration * FPS);
              for (let index = 0; index < count; index++) yield clip.offset + (first + index) / FPS - clip.start;
            }
            cursor = videos.get(clip.sourceId)!.samplesAtTimestamps(timestamps()); videoCursors.set(clip.id, cursor);
          }
          const result = await cursor.next();
          const sample = result.done ? null : result.value;
          if (sample) samples.push(sample);
          return { clip, sample };
        }));
        for (const result of results) {
          if (result.status === 'rejected') throw result.reason;
          const { clip, sample } = result.value;
          if (!sample) continue;
          const source = sourceById.get(clip.sourceId)!, size = videoWorldSize(source), t = clip.transform;
          if (gpu) {
            const videoFrame = sample.toVideoFrame(); gpuFrames.push(videoFrame);
            layers.push({ id: clip.id, source: videoFrame, width: source.width, height: source.height,
              transform: t, rotation: sample.rotation, flip: sample.flip });
          } else {
            context!.save(); context!.translate(width/2+t.x, height/2+t.y);
            context!.rotate(t.rotation*Math.PI/180); context!.scale(t.scaleX, t.scaleY);
            sample.draw(context!, -size.width/2, -size.height/2, size.width, size.height); context!.restore();
          }
        }
        if (gpu) gpu.render(layers, snapshot.stage);
        await videoOutput.add(time, 1/FPS);
      } finally { for (const sample of samples) sample.close(); for (const frame of gpuFrames) frame.close(); }
      const mix = new Float32Array(AUDIO_FRAMES*2);
      for (const clip of active) {
        const sink = audios.get(clip.sourceId);
        if (!sink || !clip.volume) continue;
        let cursor = audioCursors.get(clip.id);
        if (!cursor) {
          cursor = new AudioCursor(sink.samples(clip.offset, clip.offset+clip.duration)); audioCursors.set(clip.id, cursor);
        }
        await cursor.mix(clip, time, mix);
      }
      for (let index = 0; index < mix.length; index++) mix[index] = Math.max(-1, Math.min(1, mix[index]));
      const audioSample = new AudioSample({ data: mix, format: 'f32', numberOfChannels: 2, sampleRate: RATE, timestamp: time });
      try { await audioOutput.add(audioSample); } finally { audioSample.close(); }
      // Release decoders at the end of a clip rather than holding every past clip until export ends.
      for (const clip of active) if (time+1/FPS >= clip.start+clip.duration-1e-8) {
        await videoCursors.get(clip.id)?.return(); videoCursors.delete(clip.id);
        await audioCursors.get(clip.id)?.dispose(); audioCursors.delete(clip.id);
      }
      const stamp = performance.now();
      if (stamp-progressStamp >= 100) { progressStamp = stamp; report({ type: 'progress', progress: .05+.9*(frameIndex+1)/frames, label: 'rendering your sequence', currentFrame: frameIndex + 1 }); }
    }
    videoOutput.close(); audioOutput.close();
    report({ type: 'progress', progress: .97, label: 'finishing your mp4', currentFrame: frames });
    await output.finalize();
    const buffer = output.target.buffer;
    if (!buffer?.byteLength) throw new Error('native encoder returned an empty file');
    scope.postMessage({ type: 'complete', buffer, compositor: gpu ? 'webgpu' : 'canvas2d' } satisfies RenderReply, [buffer]);
  } finally {
    await Promise.allSettled([...videoCursors.values()].map(cursor => cursor.return()));
    await Promise.allSettled([...audioCursors.values()].map(cursor => cursor.dispose()));
    if (output && output.state !== 'finalized') await output.cancel().catch(() => {});
    gpu?.dispose(); for (const input of inputs) input.dispose();
  }
}
scope.onmessage = event => { void render(event.data as RenderRequest).catch(error => report({ type: 'error', message: error instanceof Error ? error.message : 'native render failed' })); };
