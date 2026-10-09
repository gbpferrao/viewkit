# export proof and design reconciliation

## evidence

The initial browser proof produced playable five-second 1280x720 mp4 in Chrome and Edge.
It combined a trimmed/offset interval at 50% gain with an overlapping, scaled and rotated interval muted at 0%.
Native ffprobe measured H.264, AAC, 24/1 frame rate and 120 video frames.

The final browser journey exercised import, overlap, numeric transform/gain, trimming, undo/redo, paste, preview, split, mp4 and clear.
Odd 321x241 stage output and an audio-only interval with one-second black/silent gap also decoded on both browsers.

## decision

Use a local single-thread ffmpeg wasm filter graph rather than recording a real-time canvas stream.
The encoder owns its clock and uses the same intervals, stage fitting, ordering and gain semantics as preview.
Even dimensions use H.264 yuv420p; odd dimensions use H.264 yuv444p. Both target browsers decoded the exact dimensions.
Explicit mono-to-stereo duplication avoids an unintended extra 3 dB reduction during export mixing.

The graph is pure domain-to-encoder translation in export-graph.model.ts. Worker/byte I/O belongs to mp4-encode.adapter.ts.
Evidence lives in dev/plans/evidence/p01/ and p06/.

## primary technical references

- ffmpeg wasm local core loading and worker API: https://ffmpegwasm.netlify.app/docs/getting-started/usage/
- filter semantics for trim, setpts, overlay, rotate, volume, pan, adelay and amix: https://ffmpeg.org/ffmpeg-filters.html
- package versions and licenses: installed app/node_modules package metadata, locked by app/package-lock.json.

References informed the implementation. Browser and output artifacts support the actual compatibility claim.

