# runtime dependency notices

| dependency | pinned version | license | upstream source |
|---|---|---|---|
| vue | 3.5.43 | MIT | https://github.com/vuejs/core |
| pinia | 3.0.4 | MIT | https://github.com/vuejs/pinia |
| bootstrap icons (cdn font) | 1.13.1 | MIT | https://github.com/twbs/icons |
| mediabunny | 1.61.3 | MPL-2.0 | https://github.com/Vanilagy/mediabunny |
| @ffmpeg/ffmpeg | 0.12.15 | MIT | https://github.com/ffmpegwasm/ffmpeg.wasm |
| @ffmpeg/core | 0.12.10 | GPL-2.0-or-later | https://github.com/ffmpegwasm/ffmpeg.wasm |

The core includes compiled codecs, including libx264. Its license differs from the JavaScript wrapper.
Retain upstream notices and corresponding source when distributing codec binaries. This workspace has not been published.
Package metadata and installed license files provide exact notices. Development dependencies stay outside the runtime bundle.
Mediabunny is bundled into the native export worker. Retain its MPL-2.0 notice and upstream source availability when distributing it; this project does not modify its source. @webgpu/types 0.1.74 supplies development declarations only (BSD-3-Clause).

