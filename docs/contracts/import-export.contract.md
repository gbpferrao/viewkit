# import and export contract v1

Imported media has a per-source options menu with add to timeline, rename, and delete media. Add to timeline and double-clicking the source preview place a clip at the current playhead in lane 1. Dragging onto a lane previews a transient ghost using the same snapping and duration as final placement; dropping commits once, while leaving or ending the drag clears it. Ghosts never enter committed state, browser storage, export, or history. Double-clicking the displayed name edits it inline without placing a clip; enter or blur commits a nonempty trimmed name up to 120 characters, and escape cancels. Display names propagate to timeline labels and persist in browser storage; original File names remain authoritative for codec filenames. Deleting a source removes its clips and selection references, revokes its URL, and removes it from stored media. It is not undoable; history and clipboard discard only references to the deleted source, retaining other editing history.

The rendering dialog shows overall encoder progress, a percentage, and current/total frames from the immutable export snapshot at 24 fps. Native export reports completed loop frames; compatible export uses reported encoder frame counts when available, otherwise timestamp-derived estimates marked with ≈. Frame count is independent of setup/finalization progress and stays within the snapshot total. Retrying with the compatible encoder resets progress and frames. Aborted or superseded jobs cannot update the dialog.

Executable authority: app/src/media/import-files.adapter.ts, export/export-mp4.workflow.ts, mp4-encode.adapter.ts, native-mp4.adapter.ts, native-render.worker.ts, and export-graph.model.ts. native-render.contract.ts owns worker message shapes; stage/gpu-compositor.resource.ts owns shared GPU compositing.

Import supports mp4/webm/mov and mp3/wav/aac/m4a when the browser can decode them.
files selected through the media header + button queue in order. every successful duplicate is a separate source.
the header + and local file drops inside the media panel share the import queue, validation, cancellation, and storage behavior. file drops elsewhere do not import. internal source drags do not trigger reimport; dragging existing sources onto timeline lanes remains supported.
Metadata must have finite duration at least one frame, and video must have positive dimensions.
Malformed media is rejected with a reason; failed probes revoke their URL and preserve prior project state.
A generation token rejects stale completion after clear. Probe cancellation releases temporary resources.
Files over 512 MiB receive a warning, not a rejection or new product limit.

Export takes an immutable snapshot and retains source File references for the run.
native export transfers and opens only media referenced by snapshot clips. it probes hardware-preferred video decoding and falls back to no-preference when unsupported.
a lone opaque H.264 sample bypasses canvas composition when coded/display dimensions match output, its world rectangle fills the stage, and rotation/flip/translation are absent.
direct samples receive timeline timestamps and duration before encoding. overlaps, letterboxing, resizing, rotations, other codecs, and gaps retain full composition.
audio clip bounds are calculated once per output block instead of once per PCM sample. encoder quality mode and bounded backpressure remain unchanged.
The export entry first requires a five-second ad with final-app user-facing wording. Watch ad opens the advertisement placeholder and starts the countdown; completion automatically takes the committed snapshot and starts encoding. Every export repeats this local-only simulated gate. Cancel, escape, new project, or unmount clears its timer; no ad service or network request is integrated.
The first path is a private native codec worker: blob demuxing, sequential WebCodecs decode, WebGPU composition (Canvas 2D when unavailable), block-based stereo audio mixing, H.264/AAC encoding, and MP4 muxing. Frame timestamps follow the 24 fps grid without a live clock. Clip offsets, gain, transforms, ordering, silence and black gaps use the committed snapshot. The native encoder probes hardware preference before no-preference; neither proves hardware execution.
Unsupported native codecs, multichannel audio, odd dimensions, or native-render failure fall back to one local wasm worker with an isolated filesystem. Inputs use generated internal names, never user-provided paths or shell commands. This fallback uses the existing offline filter graph. Even dimensions use yuv420p; odd dimensions use yuv444p to preserve exact pixel dimensions.
Active decode cursors and samples are bounded and explicitly released. Each encoder add is awaited for backpressure. Cancellation terminates the worker and does not trigger fallback. See docs/reference/renderer-decision.md for limitations and pending acceptance evidence.
The wasm core and worker assets are served locally. Imported media never uploads. IndexedDB keeps a browser-local copy of each source file for the single active project; new project removes those copies.

Empty export is rejected with feedback; a second concurrent run is ignored by the busy guard.
Cancel or clear terminates the worker and discards partial output. Failure preserves the project and displays a reason.
Successful export downloads one mp4. The output URL is revoked before the next export, clear or unmount.
