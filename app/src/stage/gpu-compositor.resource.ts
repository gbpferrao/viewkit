import type { StageSize, StageTransform } from './stage-size.model';
import { videoWorldSize } from './stage-size.model';

export interface RenderLayer {
  id: string; source: HTMLVideoElement | VideoFrame;
  width: number; height: number; transform: StageTransform;
  rotation?: number; flip?: boolean;
}
const shader = `
struct Params { axes: vec4f, center: vec4f, uvAxes: vec4f, uvOffset: vec4f }
@group(0) @binding(0) var video: texture_external;
@group(0) @binding(1) var videoSampler: sampler;
@group(0) @binding(2) var<uniform> params: Params;
struct Vertex { @builtin(position) position: vec4f, @location(0) uv: vec2f }
@vertex fn vertex(@builtin(vertex_index) index: u32) -> Vertex {
  let corners = array<vec2f, 6>(vec2f(0,0), vec2f(1,0), vec2f(0,1), vec2f(0,1), vec2f(1,0), vec2f(1,1));
  let uv = corners[index]; let p = uv - vec2f(0.5);
  var out: Vertex;
  out.position = vec4f(params.axes.xy * p.x + params.axes.zw * p.y + params.center.xy, 0, 1);
  out.uv = params.uvAxes.xy * uv.x + params.uvAxes.zw * uv.y + params.uvOffset.xy;
  return out;
}
@fragment fn fragment(in: Vertex) -> @location(0) vec4f {
  return textureSampleBaseClampToEdge(video, videoSampler, in.uv);
}`;

/** GPU-owned presentation only. Imported external video textures are recreated for each submission. */
export async function createGpuCompositor(canvas: HTMLCanvasElement | OffscreenCanvas) {
  if (!navigator.gpu) throw new Error('WebGPU unavailable');
  const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
  if (!adapter) throw new Error('GPU adapter unavailable');
  const device = await adapter.requestDevice();
  const context = canvas.getContext('webgpu') as GPUCanvasContext | null;
  if (!context) { device.destroy(); throw new Error('GPU canvas unavailable'); }
  try {
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode: 'opaque' });
  const module = device.createShaderModule({ code: shader });
  const pipeline = await device.createRenderPipelineAsync({ layout: 'auto',
    vertex: { module, entryPoint: 'vertex' },
    fragment: { module, entryPoint: 'fragment', targets: [{ format, blend: {
      color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
      alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' }
    } }] }, primitive: { topology: 'triangle-list' } });
  const sampler = device.createSampler({ minFilter: 'linear', magFilter: 'linear' });
  const bindLayout = pipeline.getBindGroupLayout(0);
  const buffers = new Map<string, GPUBuffer>();
  let lost = false;
  void device.lost.then(() => { lost = true; });
  device.addEventListener('uncapturederror', () => { lost = true; });
  function render(layers: RenderLayer[], stage: StageSize) {
    if (lost) throw new Error('GPU device lost');
    if (canvas.width > device.limits.maxTextureDimension2D || canvas.height > device.limits.maxTextureDimension2D) {
      throw new Error('stage exceeds GPU texture limits');
    }
    const active = new Set(layers.map(layer => layer.id));
    for (const [id, buffer] of buffers) if (!active.has(id)) { buffer.destroy(); buffers.delete(id); }
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({ colorAttachments: [{ view: context!.getCurrentTexture().createView(),
      clearValue: { r: 0, g: 0, b: 0, a: 1 }, loadOp: 'clear', storeOp: 'store' }] });
    pass.setPipeline(pipeline);
    for (const layer of layers) {
      const size = videoWorldSize(layer), t = layer.transform;
      const angle = t.rotation * Math.PI / 180, c = Math.cos(angle), s = Math.sin(angle);
      const w = size.width * t.scaleX, h = size.height * t.scaleY;
      const metadataAngle = (layer.rotation ?? 0) * Math.PI / 180;
      const uc = Math.round(Math.cos(metadataAngle)), us = Math.round(Math.sin(metadataAngle));
      // Inverse of the source metadata's clockwise rotation, then optional output flip.
      const flip = layer.flip ? -1 : 1;
      const ua = uc * flip, ub = -us * flip, vc = us, vd = uc;
      const data = new Float32Array([
        c*w*2/stage.width, -s*w*2/stage.height, -s*h*2/stage.width, -c*h*2/stage.height,
        t.x*2/stage.width, -t.y*2/stage.height, 0, 0,
        ua, ub, vc, vd, .5 - .5*(ua+vc), .5 - .5*(ub+vd), 0, 0
      ]);
      let buffer = buffers.get(layer.id);
      if (!buffer) { buffer = device.createBuffer({ size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }); buffers.set(layer.id, buffer); }
      device.queue.writeBuffer(buffer, 0, data);
      const texture = device.importExternalTexture({ source: layer.source });
      const bind = device.createBindGroup({ layout: bindLayout, entries: [
        { binding: 0, resource: texture }, { binding: 1, resource: sampler }, { binding: 2, resource: { buffer } }
      ] });
      pass.setBindGroup(0, bind); pass.draw(6);
    }
    pass.end(); device.queue.submit([encoder.finish()]);
  }
  return { render, dispose() { for (const buffer of buffers.values()) buffer.destroy(); buffers.clear(); context.unconfigure(); device.destroy(); } };
  } catch (error) { context.unconfigure(); device.destroy(); throw error; }
}
