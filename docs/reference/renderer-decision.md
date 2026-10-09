# browser renderer decision

date: 2026-10-08. scope: local Chrome/Edge preview and faster-than-real-time MP4 export.

## choice

use browser-native WebCodecs for decode/encode, a shared WebGPU compositor for video transforms, and a dedicated export worker. Mediabunny 1.61.3 supplies demuxing, bounded decode iterators, encoder backpressure, and MP4 muxing. keep Canvas 2D compositing when WebGPU is unavailable and the existing FFmpeg wasm encoder when the native route cannot process a project.

this is a performance-oriented architectural selection, not a measured claim that WebGPU beats every alternative on every GPU. no renderer benchmark or browser acceptance run was executed for this change. the executed check is the TypeScript/Vite build. previous FFmpeg verification does not certify this new path.

## evidence and alternatives

| option | assessment for this project |
|---|---|
| WebCodecs | exposes existing browser codecs and their possible hardware acceleration; avoids rebuilding codecs in wasm. selected for export |
| WebGPU | external video textures can be imported directly from video elements and decoded VideoFrames. selected for shared compositing; actual copies and speed depend on browser/driver |
| WebGL | viable GPU compositing alternative; WebCodecs VideoFrames can be texture sources. no benchmark establishes it as slower; not added as a second custom GPU backend |
| Canvas 2D | simple compositor and useful fallback; browser acceleration is implementation-dependent |
| C++/Emscripten/FFmpeg wasm | useful codec compatibility fallback. porting codec work to wasm does not itself expose browser hardware codecs; existing single-thread export is CPU-bound |
| multithread FFmpeg wasm | upstream reports possible improvement at increased CPU/memory cost. it still does not replace native codec acceleration, and adds cross-origin isolation requirements |
| native desktop FFmpeg | can expose platform hardware encoders, but requires a native service/app and changes the browser-only product boundary |

primary sources:

- [Chrome WebCodecs guide](https://developer.chrome.com/docs/web-platform/best-practices/webcodecs): native codecs, hardware availability, workers, canvas interoperability, and closing frames.
- [WebCodecs specification](https://www.w3.org/TR/webcodecs/): hardware preferences are hints, not proof of hardware execution.
- [Chrome WebGPU video integration](https://developer.chrome.com/blog/new-in-webgpu-116): external video textures and VideoFrame input.
- [Mediabunny media sinks](https://mediabunny.dev/guide/media-sinks): ordered iterators, efficient timestamp access, and resource cleanup.
- [Mediabunny media sources](https://mediabunny.dev/guide/media-sources): canvas input, sample sources, and encoder backpressure.
- [FFmpeg wasm FAQ](https://ffmpegwasm.netlify.app/docs/faq/): wasm performance and multithread tradeoffs.

## implemented boundaries

`stage/gpu-compositor.resource.ts` owns the device, shader pipeline, per-layer uniform buffers, external textures, and black-background compositing. it accepts borrowed video elements/VideoFrames and does not close them. callers own decode resources. source metadata rotation/flip and project transforms are separate. external textures and bind groups are recreated for each submission; uniform buffers are reused while their clip is active.

preview keeps native media elements and the existing playback/audio clock. video-frame callbacks and reactive stage drafts invalidate one animation frame. the GPU canvas is limited to displayed resolution, at most 2x device pixel density and native stage resolution. paused unchanged frames do not continuously redraw. unavailable/lost GPU falls back to existing DOM video layers; handles retain their current input behavior.

export takes a committed immutable snapshot and File references. the native worker reads blob ranges, decodes clips through monotonic iterators, draws at full stage resolution, mixes stereo 48 kHz audio in 2000-frame blocks, and writes 24 fps H.264/AAC MP4 with backpressure. independent active video decodes can proceed concurrently. ended clip cursors are released immediately. muted clips skip audio decode. silence and black gaps are explicit. the source bytes are not copied into a wasm filesystem on this route.

hardware-preferred H.264 is probed first; native no-preference encoding is the next option. quality mode prevents deliberate frame dropping. native codec errors, unsupported inputs, more than two audio channels, odd stage sizes, or GPU loss during export retry through the compatible FFmpeg path. lack of WebGPU alone uses Canvas 2D with native codecs. cancellation terminates the current worker and never starts a fallback. all partial output stays private; only finalized MP4 is downloaded. media never uploads.

the final compressed MP4 remains in memory until download; this matches the intended single short project. audio resampling uses linear interpolation within decoded blocks, so resampled output is not promised bit-identical to FFmpeg. color conversion and chroma subsampling may differ between browser codecs and FFmpeg. browser hardware preferences and high-performance adapter requests are hints.

## export optimization follow-up

the current browser-only choice remains WebCodecs with hardware preference, a worker, and WebGPU only where composition is required. no universal fastest configuration exists across browsers, codecs, GPUs, and workloads. compiling C++ with Emscripten does not grant access to native platform hardware encoders. [Emscripten pthreads](https://emscripten.org/docs/porting/pthreads.html) also require SharedArrayBuffer and cross-origin isolation; GitHub Pages does not provide project-controlled response headers for that configuration.

implemented improvements:

- filter unused source files before worker transfer and media probing.
- probe hardware-preferred video decoding with a no-preference fallback.
- pass eligible full-stage opaque H.264 decoded samples directly to the encoder, avoiding canvas composition and capture. exact coded/display size and unrotated, unflipped source metadata are required.
- retain shared GPU composition for transformed, overlapping, resized, and letterboxed video; Canvas2D handles absent WebGPU.
- calculate audio clip bounds once per PCM block, removing repeated timeline quantization from the sample loop.
- retain quality latency mode, 24 fps timestamps, awaited encoder backpressure, sample closure, clip cursor release, and worker termination on cancellation.

Mediabunny's installed 1.61.3 source confirms its encoder queue is bounded at four pending inputs. arbitrary unawaited frame submission would increase memory pressure rather than establish throughput. quality mode remains necessary to avoid deliberate frame dropping. hardware preference is a hint, not proof of execution or a guaranteed speed advantage.

compressed-packet remuxing can eliminate encoding for compatible unmodified cuts, but arbitrary trim points need keyframe and audio boundary handling. it is a future separate path, not enabled in this change. software wasm SIMD/pthreads remains a compatibility optimization, rather than the primary browser renderer.

verification: TypeScript/Vite build only. no export benchmark or decoded-output comparison has been run for this follow-up; no multiplier is claimed. next measurement should compare baseline and optimized revisions on identical 720p, 1080p, transformed, and overlap fixtures, measuring setup, decode, composition, encode/finalization, peak memory, and decoded output correctness.

## remaining evidence

before claiming a numeric speed gain, compare the same committed fixtures at the same resolution and frame rate: export elapsed time, output frame count/duration, transforms/order, offsets, stereo/mono gain, audio/video synchronization, memory, cancellation, and fallback. compare preview frame times during playback and transforms on actual hardware. these checks are pending, not passed evidence.
