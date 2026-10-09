# stack

## document status and constraints

- status: implemented; exact package versions and lockfile retained
- owner: user
- last updated: 2026-10-08
- supported products and platforms: videokit v1 slicer, desktop chrome edge windows, local only
- compatibility, licensing, security, and operational constraints:
  - no backend, no upload, mit friendly libs preferred
  - 24 fps hardcoded, 10 lanes, mp4 only export
  - low res preview, full res export truth

## technology choices

| area | technology and supported version | owner or responsibility | requirement and architecture references | rationale and tradeoffs | validation |
|---|---|---|---|---|---|
| language and runtime | typescript 5 plus browser evergreen | all models and workflows | all ids, frame math | types catch time and lane errors, no extra runtime | vue-tsc clean |
| framework | vue 3.5.43 plus vite 6.4.4, spa no router | views and composition | timeline-zoom-scroll, stage-preview-lowres | compatible exact versions with installed node 22.4.1 | build and browser checks |
| state | pinia 3.0.4 | project state, selection, toggles | project-import, timeline-multiselect | single stored truth and validated snapshots | transaction tests |
| icons | bootstrap icons 1.13.1 font stylesheet from jsdelivr | editor views | user requested cdn icons | pinned stylesheet and font; requires network for first load | implementation only |
| drag and gestures | native pointer events | timeline and stage views | timeline-place-move, stage-transform, timeline-group-drag | no extra gesture library; drafts and release commits | browser gesture checks |
| stage handles | plain dom handles | stage view | stage-transform | native video layer with separate gesture overlay | browser transform checks |
| timeline render | plain vue dom, clipped scroll viewport and overlap subrows | timeline view | timeline-lanes, timeline-zoom-scroll | every overlapping clip remains reachable | scroll, marquee and group checks |
| media decode | native video audio tags plus object urls | import adapter, playback | project-import, playback-24fps | hardware decode free, least code | import probe |
| audio gain | web audio per-clip gain/analyser nodes | audio engine | timeline-volume | exact linear gain and preview meter; draft slider gain is transient | mute and mixed audio checks |
| compositor | native WebGPU; @webgpu/types 0.1.74 development declarations | shared stage GPU resource | stage-preview-lowres, export-mp4 | external video textures, shared transforms, Canvas 2D export and DOM preview fallbacks | build only; benchmark pending |
| native export | mediabunny 1.61.3 plus browser WebCodecs, dedicated worker | native renderer | export-mp4 | browser codecs, blob demux, sequential decode and awaited encoder backpressure | build only; browser acceptance pending |
| compatible export | @ffmpeg/ffmpeg 0.12.15 and @ffmpeg/core 0.12.10, single-thread wasm | export adapter | export-mp4 | full filter graph for unsupported native inputs without a live clock | historical chrome/edge proof predates renderer change |
| mp4 mux | Mediabunny H.264/AAC native path; libx264/AAC fallback | export adapter | export-mp4 | exact stage dimensions; odd dimensions use the existing yuv444p fallback | native build only; prior odd-size evidence covers fallback |
| clip ids | native crypto.randomUUID | models | edit-copy-paste | no identifier dependency | fresh identity tests |
| verification | vitest 4.1.11, playwright 1.64.0, vue-tsc 3.1.8 | model/workflow and browser boundaries | all ready checks | meaningful regression and local browser scenarios | test reports |

## supported environments

| environment | supported versions or constraints | verification route |
|---|---|---|
| chrome windows 64 | latest stable, hardware accel on | manual import drag export |
| edge windows 64 | latest stable | manual import drag export |
| node for build | verified node 22.4.1; npm 10 used for dependency graph repair | npm run build |
| safari firefox | best effort, show decode message | probe message only, no v1 gate |

## reproducibility and delivery

- dependency and tool version policy: exact compatible versions in app/package.json; app/package-lock.json owns resolution. no git repository exists for commits.
- lockfiles or equivalent: app/package-lock.json generated and retained.
- generation and build commands: npm install, npm run dev, npm run typecheck, npm run build, npm run test.
- packaging and deployment: static dist/ served locally or any static host, no server code, no secrets.
- configuration and secrets boundaries: no secrets, no env keys, media never leaves browser.
- update and rollback: static bundle hash, rollback is prior dist/, project state needs no migrate in v1.

## rejected or unresolved choices

| choice | status | reason or missing evidence | owner and next action |
|---|---|---|---|
| vue-konva for video stage | rejected | adds canvas texture path for video, more breakage for little gain in v1 | stage; use svg handles |
| vis-timeline or gantt lib | rejected | weak marquee plus group drag plus zoom control, lock in | timeline; use custom dom |
| webm only export | rejected | user requires mp4 only | export; keep mp4 path |
| custom mp4-muxer plus WebCodecs plumbing | replaced | Mediabunny supplies native decode/encode and MP4 demux/mux; the project owns composition and audio mixing | export; see renderer-decision.md |
| indexeddb persist | implemented | user requested one browser-saved project and accepted local media copies | project-storage.resource.ts |
