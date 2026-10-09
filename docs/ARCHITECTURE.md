# architecture

## floating playback controls, 2026-10-08

stage playback buttons, timecode and scrubber share a compact overlay at the bottom of the stage viewport.
the viewport uses the height previously reserved for the transport row and scrubber.
controls appear within 24 pixels of the actual bar rectangle and fade beyond 36 pixels or when the pointer leaves the viewport.
keyboard focus and active control interaction retain visibility; touch devices show controls, and reduced-motion preferences disable transitions.

## rendering performance update, 2026-10-08

timeline views render viewport clips and ruler ticks with overscan, retaining full lane geometry for scrolling and editing.
scroll and pointer updates run at most once per animation frame; pointer release applies the final queued position before committing.
memoized lane and media subtrees avoid rebuilding unchanged clip layers on playhead ticks.
preview order and source/clip indexes are cached until their project inputs change; audio metering reuses its sample buffer.
export seeks each input to its clip offset and limits input duration before decoding.
the graph applies frame conversion before timeline displacement and omits identity scale and rotation filters.
export now attempts a dedicated native WebCodecs worker with the shared WebGPU compositor and MP4 demux/mux from Mediabunny. Canvas 2D composition and the existing single-thread FFmpeg wasm encoder provide compatibility fallbacks. stage preview uses native video decode/audio with a resolution-capped WebGPU canvas and DOM fallback. no measured speedup or guaranteed hardware acceleration is claimed.
historical performance and export acceptance evidence predates these changes and requires renewed verification before reuse.

## document status and design basis

- status: implemented; evidence in dev/plans/build.report.md
- owner: user
- last updated: 2026-10-08
- requirement scope: all v1 ids in docs/PRD.md, 24 fps hardcoded, 10 lanes, mp4 only
- constraints and accepted decisions:
  - vue 3 plus vite, one browser-local IndexedDB project, new project clears saved media and metadata
  - stage is the canvas, default 1280x720, low res preview, full res export truth
  - WebGPU preview with native media decode/audio and DOM fallback; offline native WebCodecs export with FFmpeg wasm fallback. prior browser evidence covers the older FFmpeg path, not the new native path
  - per clip volume as simple gain, no keyframes
- open architectural decisions:
  - no unresolved encoder or compositing choice: see docs/contracts/stage-edit.contract.md and import-export.contract.md

## system boundary and responsibilities

| subsystem | purpose and exclusions | owner | requirement IDs | entry points |
|---|---|---|---|---|
| project timeline model | own clips, lanes, time math at 24 fps, no rendering | timeline model | timeline-lanes, timeline-place-move, timeline-split | edit workflow, playback engine |
| stage model | own stage size plus per video transform, no dom | stage model | stage-define, stage-transform | stage view, export workflow |
| project state | own sources, clips, selection refs, view toggles, single project truth | project state | project-import, project-clear, timeline-multiselect | all views and workflows |
| edit workflow | coordinate split, delete, move, group drag, autofill, snapping use | edit workflow | timeline-split, timeline-delete, timeline-snapping, timeline-autofill, timeline-group-drag | timeline view, keyboard adapter |
| history workflow | own undo redo copy paste stacks, no domain rules | history workflow | edit-undo-redo, edit-copy-paste | keyboard adapter, edit workflow |
| playback engine | own playhead, 24 fps ticker, av sync, no edit rules | playback engine | playback-24fps | timeline view, stage compositor |
| stage compositor | own shared WebGPU transforms, low res preview and DOM fallback, no edit rules | stage/gpu-compositor.resource.ts | stage-preview-lowres | stage view, native export worker |
| audio engine | own per clip gain mapping to video and audio tags, no timeline rules | audio engine | timeline-volume | playback engine, export workflow |
| export workflow | own offline render to one mp4 with progress and cancel | export workflow | export-mp4 | export view, timeline model, stage model |
| timeline view | render lanes, clips, marquee, zoom, scroll, drag intents | timeline view | timeline-zoom-scroll, timeline-multiselect | editor |
| stage view | render stage frame, handles for move scale rotate, numeric fields | stage view | stage-transform, stage-define | editor |
| import adapter | validate files, create object urls, probe duration | import adapter | project-import | media bin view |
| export adapter | render timeline filter graph locally in ffmpeg wasm | export adapter | export-mp4 | export workflow |

## authority and state ownership

| state or rule | authoritative owner | permitted writers | invariant and enforcement | persistence |
|---|---|---|---|---|
| clip list with start, duration, offset, lane, volume | timeline model | edit workflow only | start on 24 fps grid, duration > 0, lane 0-9, enforced on commit | IndexedDB, current project |
| stage width height | stage model | stage view via stage-layout workflow | 320-3840 x 240-2160 ints, invalid input rejected | IndexedDB, current project |
| clip x y scale rotation | stage model | stage view via stage-layout workflow | scale 0.05-10, rotation wrap -180-180 | IndexedDB, current project |
| source files plus object urls | project state | import adapter, clear action | revoked on remove or clear, enforced in clear | IndexedDB, current project |
| selection set | project state selection slice | timeline view, stage view, history restore | transient ids only, cleared on delete and clear | none |
| snapping on off, autofill on off | project state view slice | timeline menu | booleans, default on for snap, off for autofill | IndexedDB |
| playhead time | playback engine | playback controls, timeline seek | >=0, frame quantised, enforced on seek | none |
| undo redo stacks | history workflow | edit workflow commits | max 50, coalesce drags, clear not pushed | none |
| copy buffer | history workflow | copy action | holds serialised clips, cleared on clear | none |
| zoom and scroll | timeline view local plus project view slice | timeline view | h 10-400 px per sec, v compact to tall | none |

caches and mirrors:
- preview layout is a derived projection of timeline model plus stage model plus playhead. source is models. update is on commit or tick. invalidation is immediate. lifetime is frame. recovery is last frame on stall.
- export render uses same source models but renders at full stage size offline. no shared mutable cache with preview.

## dependency direction

| caller | permitted dependency | prohibited dependency | contract or rationale |
|---|---|---|---|
| timeline view | edit workflow, project state reads, playback seek | timeline model writes direct | all mutations via workflow keeps grid and history correct |
| stage view | stage-layout workflow, project state reads | stage model writes direct | shared history and stage validation |
| edit workflow | timeline model, stage model, history workflow | dom, video tags | testable without browser media |
| playback engine | timeline model read, project state read | edit workflow | playback never edits |
| stage compositor | stage model read, timeline model read, playhead | edit workflow | render only |
| audio engine | project state read | timeline model writes | gain follows model |
| export workflow | timeline model read, stage model read, export adapter | playback engine tick | offline render owns its clock |
| import adapter | project state via add source | timeline model direct | sources first, placement separate |
| history workflow | serialised clips only | views | no ui coupling |
| composition | all concrete owners | none reversed | wires pinia, routerless single page |

## boundary contracts

| boundary | owner | operations and data | validation | errors and compatibility | side effects |
|---|---|---|---|---|---|
| timeline edit | timeline model | place clip, move clips, split clip at frame, delete ids, set volume | frame quant, lane range, duration > 0 | invalid returns typed reject with reason, no partial write | emits commit for history |
| stage edit | stage model | set size w h, set transform clip id x y sx sy rot | range checks per PRD | invalid keeps prior plus message | emits commit |
| history | history workflow | push commit, undo, redo, copy ids, paste at time | stack depth, buffer non empty | empty undo redo is noop | restores model snapshots |
| playback | playback engine | play, pause, seek to frame, step plus minus 1 | clamp 0 to end | stall emits busy, keeps time | drives compositor |
| import | import adapter | add files File[], remove source id, clear all | mime allowlist, decode probe | unsupported returns reject list | creates and revokes object urls |
| export | export workflow | start export, cancel export, progress 0-1 | non empty timeline, single run | busy rejects second start, failure returns reason | downloads one mp4 |

units:
- time stored in seconds float, displayed as frames at 24 fps, math quantised to 1/24.
- stage in pixels, transform x y in stage pixels relative to center, scale factor, rotation degrees.
- volume 0-100 int mapped to gain 0.0-1.0.
- all contracts versioned as v1 in code, breaking change needs new id.

## execution and state transitions

| requirement ID | path and owners | transition and output | alternate and failure path | recovery |
|---|---|---|---|---|
| project-import | bin view -> import adapter -> project state | sources added, bin lists them | bad file rejected list, no write | remove partial, show reason |
| project-clear | header main menu new project -> project state plus history plus playback | all cleared, name reset, urls revoked, playhead 0 | cancel keeps all | none, confirm guards |
| stage-define | stage view -> edit workflow -> stage model | size commits, preview letterboxes | invalid keeps prior plus hint | re edit |
| stage-preview-lowres | playback tick -> stage compositor -> stage view | scaled dom stack updates | stall shows badge plus last frame | auto resume |
| stage-transform | stage view -> edit workflow -> stage model plus history | transform commits on release, live draft on drag | esc restores start, audio shows disabled | undo |
| timeline-place-move | timeline view -> edit workflow -> timeline model plus history | clip start lane commits; same-lane overlap allowed | invalid lane rejects with feedback | undo |
| timeline-split | toolbar plus shortcut -> edit workflow -> timeline model | one to two clips, history one entry | edge noop plus hint | undo |
| timeline-delete | key plus button -> edit workflow -> timeline model | ids removed, autofill shifts when on | empty selection noop | undo |
| timeline-snapping | toolbar toggle stored -> edit workflow use on drag | snap target applied with guide | none in range free move | toggle off |
| timeline-autofill | toggle stored -> edit workflow after delete move | same lane tail shifts left | no tail noop | undo |
| timeline-volume | inspector -> edit workflow -> timeline model -> audio engine | gain updates live | invalid rejected | undo |
| timeline-multiselect | timeline view -> project state selection | set updates, inspector shows count | empty marquee clears | esc |
| timeline-group-drag | timeline view -> edit workflow | atomic multi move | one invalid rejects all | stays put |
| timeline-zoom-scroll | timeline view local | px per sec plus lane height update | clamp ranges | none |
| playback-24fps | controls -> playback engine -> compositor plus audio | ticker 24 Hz, frame exact | stall pauses spinner | resync within 2 frames |
| edit-undo-redo | ctrl z y -> history workflow -> models | snapshot restore | empty noop, clear not in stack | none |
| edit-copy-paste | ctrl c v -> history workflow -> edit workflow | new ids at playhead; overlaps allowed | empty buffer noop; failure preserves timeline | undo paste |
| export-mp4 | export view -> export workflow -> export adapter | offline ffmpeg graph at 24 fps, mp4 download | empty blocked, busy blocked, fail shows reason | cancel discards file |

drag atomicity:
- drag writes drafts to view only, commit on pointer up as one history entry. cancel restores start snapshot.

## resources and lifecycle

| resource or subsystem | creator and owner | lifetime | cleanup and shutdown | failure behavior |
|---|---|---|---|---|
| object urls for sources | import adapter, tracked by project state | until source removed or clear or page unload | revoke on remove, clear, beforeunload | leak guard lists live urls in dev |
| video tag pool | stage compositor | per visible clip at playhead, reused | pause and detach on lane empty | decode error marks clip bad with badge |
| audio context gains | audio engine | active media node lifetime | disconnect on interval exit or teardown; pause retains nodes for resume | failure feedback preserves project |
| export snapshot plus worker filesystem | export workflow and adapter | per export run | terminate worker and discard partial output | cancel frees all |
| ffmpeg worker | export adapter | per export | terminate after success, cancellation or failure | error preserves project and shows reason |

startup order:
- composition creates pinia stores, then models, then adapters, then views mount, then playback idle at 0. readiness is empty project with 10 lanes.

## trust, security, and quality constraints

| constraint | threat or measurable target | enforcement owner and point | requirement IDs | verification |
|---|---|---|---|---|
| local only, no upload | file leak to network | import adapter plus no fetch of blobs, review no uploader | local-only | network off test, no post of media |
| large file stall | browser oom | import adapter guard plus user warning | project-import | 2 gb file warns and still responds |
| preview perf | dropped frames | stage compositor dom stack plus low res, no per frame alloc | preview-perf | two 1080p clips manual check |
| accessibility basics | keyboard trap | timeline view focus plus shortcuts plus visible focus | playback-24fps, edit-undo-redo | tab through controls, esc clears |
| compatible browsers | decode variance | import probe plus support message | browser-support | chrome edge smoke |

inapplicable:
- auth and multi user omitted, single local user by scope.

## decisions and tradeoffs

| decision | evidence and rationale | alternatives | affected boundaries | validation |
|---|---|---|---|---|
| dom video stack for preview | uses hardware decode, least code, stable sync for few clips, matches most performant ask | single canvas composite each frame | compositor, playback | manual two clip perf check |
| offline ffmpeg filter graph | exact trims, transforms, overlap and audio render independently of preview clock | live capture plus transcode | export workflow | 5 sec H.264/AAC proof played on chrome and edge |
| mp4 H.264/AAC with yuv444p for odd dimensions | retains integer stage dimensions and mp4-only output | rounding odd stage dimensions | export adapter | 321x241 audio-only/gap export decoded on chrome and edge |
| pinia for project state | fits vue, simple single truth, time travel snapshots easy | vuex, signals only | state, history | unit snapshot test |
| custom timeline dom | full control of marquee, zoom, group drag, no lib lock | dhtmlx gantt, vis timeline | timeline view | drag and zoom checks |

## verification and open work

| boundary or invariant | verification method | evidence required | status and owner |
|---|---|---|---|
| 24 fps grid math | unit test frame quant | quant 1/24, split exact | open, timeline model |
| split delete move undo | unit plus manual drag | one entry per gesture | open, edit workflow |
| stage transform ranges | unit plus handle drag | clamp and wrap | open, stage model |
| mp4 export plays | manual export plus probe | mp4 h264 aac, av sync | open, export workflow |
| no upload | code review plus network log | zero media posts | open, import adapter |

open work:
- overlapping clips remain independently addressable; no automatic push or overlap rejection. define stable visual order and mix all active audio consistently.
- timeline edit owns end trimming, source offsets, frame-grid bounds, optional end snapping, cancellation, and atomic history commits.
- initialize and reset the stage to the accepted 1280x720 default.
- mp4 path proven in dev/plans/evidence/p01/; final UI journey evidence lives in dev/plans/evidence/p06/.
- set file size guard numbers after spike.
