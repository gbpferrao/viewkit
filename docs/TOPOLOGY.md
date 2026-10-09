# topology

## document status

- status: implemented structure; verification evidence in dev/plans/evidence/
- owner: user
- last updated: 2026-10-08
- target scope and platforms: videokit v1 slicer, desktop chrome edge on windows, vue spa local only
- architecture and stack versions or revisions: architecture proposed 2026-10-08, stack vue 3 plus vite 5

The implementation reconciliation below records actual paths. Remaining proposed records are labeled in the tree.

## intended target tree

```text
viewkit/
  docs/
    PRD.md # existing, spec truth
    ARCHITECTURE.md # existing, spec truth
    TOPOLOGY.md # this file
    STACK.md # existing, implemented versions
    contracts/
      timeline-edit.contract.md # proposed, edit boundary shapes
      stage-edit.contract.md # proposed
      playback.contract.md # proposed
      import-export.contract.md # proposed
    operations/
      run-local.md # proposed, dev run and build
    reference/
      spec-answers.md # proposed, user answers 2026-10-08
  app/ # proposed, vue vite root, use app per vite vue convention
    index.html # proposed
    package.json # proposed
    vite.config.ts # proposed
    tsconfig.json # proposed
    public/
      favicon.svg # proposed
    src/
      main.ts # proposed, app composition entry
      app.composition.ts # proposed, pinia wiring
      timeline/
        timeline.model.ts # proposed, clips lanes time math
        edit-timeline.workflow.ts # proposed, split delete move autofill snap
        history-clipboard.workflow.ts # proposed, undo redo copy paste
        project-timeline.state.ts # proposed, sources clips selection toggles
        timeline-lanes.view.vue # proposed, 10 lanes zoom scroll marquee
        clip-block.view.vue # proposed, clip visuals drag handles
      stage/
        stage-size.model.ts # proposed, width height plus transform types
        stage-layout.workflow.ts # proposed, size set plus transform commit
        preview-stage.state.ts # proposed, derived layout plus playhead refs
        stage-frame.view.vue # proposed, dom video stack low res
        stage-handles.view.vue # proposed, move scale rotate handles
        stage-inspector.view.vue # proposed, numeric fields plus volume
      playback/
        playback-engine.resource.ts # proposed, 24 fps ticker plus tags
        audio-gain.adapter.ts # proposed, per clip gain
      media/
        import-files.adapter.ts # proposed, picker drop probe urls
        media-bin.view.vue # proposed, sources plus clear
      export/
        export-mp4.workflow.ts # proposed, offline render orchestration
        mp4-encode.adapter.ts # existing, local wasm encoder
        export-graph.model.ts # existing, immutable timeline to offline filter graph
        export-panel.view.vue # proposed, progress cancel download
      shared/
        frame-math.contract.ts # proposed, 24 fps quant helpers
        shortcut-keys.adapter.ts # proposed, ctrl z y c v delete space
  dev/
    plans/
      PLAN.md # existing, dependency graph and record map
      planning.report.md # existing, coverage and two-pass planning review
      phases/ # existing, six phase plans; trackers/handoffs created at execution
      evidence/ # existing, phase verification artifacts
      PHASE-INDEX.md # existing, phase status summary
```

## current structure

inspected 2026-10-08 via directory read:

```text
workspace/ # C:/Users/gbpfe/Desktop/videokit
  AGENTS.md # workspace router
  super-agent/ # shared guides
  viewkit/ # project root
    README.md
    app/
      package.json
      package-lock.json
      vite.config.ts
      tsconfig.json
      playwright.config.ts
      src/ # 27 source/view/style/model-test files, grouped by owner
      scripts/ # codec preparation and reproducible verification tools
      browser-tests/ # editing, resource and performance scenarios
      public/codec/ # generated pinned core assets
      dist/ # generated production bundle and codec assets
    docs/
      PRD.md
      ARCHITECTURE.md
      TOPOLOGY.md
      STACK.md
      contracts/ # four maintained agreements
      operations/ # local run and third-party notices
      reference/ # sourced encoder design evidence
    dev/
      plans/
        PLAN.md
        planning.report.md
        phases/ # six phase plans and execution tracker/handoff pairs
        evidence/ # browser screenshots, performance and output measurements
        PHASE-INDEX.md
```

differences to target:
- app/ exists with Vue sources, build configuration, tests, local codec assets and generated dist/.
- docs/contracts/ and docs/operations/ own implemented agreements and local run instructions.
- phase execution records and browser/model evidence live under dev/plans/.
- no root build/ mirror exists; app/dist/ is the single generated bundle owner.

## responsibility and placement map

### project record map

| record | authoritative path |
|---|---|
| requirements | docs/PRD.md |
| architecture | docs/ARCHITECTURE.md |
| topology | docs/TOPOLOGY.md |
| stack | docs/STACK.md |
| reusable interface components and visual rules | docs/DESIGN-SYSTEM.md |
| monetization, demand, and distribution research hypothesis | docs/reference/monetization-distribution.report.md |
| phase graph, assignments and execution record patterns | dev/plans/PLAN.md |
| integrated planning review and coverage evidence | dev/plans/planning.report.md |
| integrated implementation review | dev/plans/build.report.md |
| build security gate | dev/plans/security-build.report.md |

All paths are relative to viewkit/. Workspace AGENTS.md owns agent instructions; no project AGENTS.md is permitted.

Path creation owners: p01 composition/configuration/frame contract and docs/contracts; p02 media/state/models/lane views;
p02 also creates the validated placement workflow entry; p03 extends timeline edit and creates history/shortcuts;
p04 stage/playback/audio; p05 export; p06 integrated evidence and operations reconciliation.
Later phases extend existing owners through the graph in PLAN.md. No source migration or removal is currently planned.

| path or bounded family | purpose | owner and role | callers and dependencies | build target | package and runtime placement | status and verification |
|---|---|---|---|---|---|---|
| app/src/timeline/timeline.model.ts | clips lanes 24 fps math | timeline; .model | edit workflow, playback read | vite app | browser memory | proposed; unit frame quant |
| app/src/timeline/edit-timeline.workflow.ts | split delete move group snap autofill | edit; .workflow | timeline model, stage model, history | vite app | browser | proposed; gesture tests |
| app/src/timeline/history-clipboard.workflow.ts | undo redo copy paste | history; .workflow | models via snapshots | vite app | browser | proposed; stack depth test |
| app/src/timeline/project-timeline.state.ts | single project truth | project; .state | views, workflows | vite app | pinia memory | proposed; clear test |
| app/src/timeline/timeline-lanes.view.vue | lanes zoom scroll marquee | timeline; .view | edit workflow, state | vite app | dom | proposed; manual drag |
| app/src/stage/stage-size.model.ts | size plus transforms | stage; .model | layout workflow | vite app | memory | proposed; range test |
| app/src/stage/preview-stage.state.ts | derived preview layout | preview; .state | models plus playhead | vite app | memory | proposed; stale check |
| app/src/stage/stage-frame.view.vue | dom stack low res | stage; .view | compositor logic inline | vite app | dom video tags | proposed; perf check |
| app/src/playback/playback-engine.resource.ts | 24 fps ticker sync | playback; .resource | models read | vite app | raf plus tags | proposed; sync check |
| app/src/media/import-files.adapter.ts | files to sources | import; .adapter | project state | vite app | object urls | proposed; reject test |
| app/src/export/export-mp4.workflow.ts | mp4 orchestration | export; .workflow | models, encode adapter | vite app plus worker | browser plus ffmpeg worker | implemented; browser export plays |
| app/src/shared/shortcut-keys.adapter.ts | ctrl z y c v etc | shortcuts; .adapter | history, edit | vite app | dom listeners | proposed; key test |
| docs/contracts/ | human contract detail | docs; contracts | executable owners referenced in each contract | none | docs | implemented; integrated review |
| app/src/shared/frame-math.contract.ts | executable time math | timeline timing; .contract | models | vite app | bundled | implemented; unit |

The original path-family rows retain creation hypotheses. All named runtime sources now exist; actual delivered ownership follows their source and contracts.
Additional delivered owners: app/src/editor.view.vue and editor.css own the editor shell and styles;
app/src/stage/selection-bounds.model.ts owns transformed rectangle corners and exact outline-segment occlusion geometry. stage-selection.view.vue owns individual and shared selection SVGs; stage-frame supplies current compositing layers and selection state, owns temporal status cues, and coordinates the isolated stage stack.
app/src/media/video-thumbnails.resource.ts owns the timeline's shared silent decoder, serialized frame sampling, bounded image cache, and cleanup. timeline-lanes owns its lifecycle; clip-block requests only visible tiles and maps clip offsets to sample times.
app/src/interface/ owns reusable action-button, interface-icon, number-input and zoom-scrollbar views, their zoom-scrollbar contract, and design-system.css. number-input owns custom numeric steppers and formatting; feature workflows own committed validation and project changes.
design-system.css is imported after editor.css. zoom-scrollbar emits presentation scroll offsets and anchored scale changes to the timeline view.
docs/DESIGN-SYSTEM.md owns their visual geometry and interaction rules. feature views retain action and placement ownership.
app/src/export/export-graph.model.ts owns pure encoder graph translation. app/dist/ is generated, including its local codec/ directory.
app/src/stage/gpu-compositor.resource.ts owns the shared WebGPU video compositor used by stage preview and native export. app/src/export/native-render.contract.ts owns worker message shapes; native-render.worker.ts owns offline native decode, compositing, audio mixing, encoding, and muxing; native-mp4.adapter.ts owns worker lifetime. mp4-encode.adapter.ts selects native first and retains the FFmpeg compatibility path. docs/reference/renderer-decision.md records alternatives, sources, limitations, and missing performance evidence.
app/src/timeline/project-storage.resource.ts owns the single active project's IndexedDB metadata and media blobs, validated startup restoration, coalesced atomic saves, quota error reporting, and storage cleanup on new project. main.ts restores before mounting; app.composition.ts owns the storage subscription lifecycle. session object URLs are recreated from saved files; selection, history, playback position, and navigation are transient.

## interfaces and dependency rules

| boundary | public path | allowed imports or includes | prohibited dependency | owner |
|---|---|---|---|---|
| timeline model | app/src/timeline/timeline.model.ts | edit workflow, history, playback read | views direct writes | timeline |
| stage model | app/src/stage/stage-size.model.ts | layout workflow, preview read, export read | views direct writes | stage |
| project state | app/src/timeline/project-timeline.state.ts | views read, workflows write | adapters direct clip edits | project |
| edit entry | app/src/timeline/edit-timeline.workflow.ts | views | dom video tags | edit |
| playback tick | app/src/playback/playback-engine.resource.ts | views subscribe | edit calls | playback |
| import entry | app/src/media/import-files.adapter.ts | bin view | timeline model | import |
| export entry | app/src/export/export-mp4.workflow.ts | export panel | live playback clock | export |

## build and code generation

| target | entry point | inputs | producer or command | output paths | dependency order |
|---|---|---|---|---|---|
| dev serve | app/index.html | app/src/main.ts | npm run dev via vite | memory serve | install then serve |
| prod bundle | app/index.html | app/src/** and app/public/codec/ | npm run build via vite | app/dist/ | typecheck then build |
| typecheck | app/tsconfig.json | app/src/**/*.ts vue | npm run typecheck via vue-tsc | console | before build |
| offline export | ffmpeg worker | immutable timeline and source files | @ffmpeg/ffmpeg local filter graph | mp4 blob | load local core, probe streams, encode, terminate worker |

## package and runtime

| artifact or data | produced by | included or installed at | loaded or owned by | lifetime and update rule |
|---|---|---|---|---|
| spa bundle js css | vite build | app/dist/ | browser | per release, cache bust hash |
| object url media | import adapter | memory blob urls | video tags | until remove clear unload |
| exported mp4 | export workflow | user download | user files | per export, no auto save |
| pinia state | composition | memory | project state | until clear or reload |

## transitions, assumptions, and validation

| path change or assumption | reason | affected interfaces or phases | migration or removal condition | verification |
|---|---|---|---|---|
| use app/ at project root | proposed web application root inside viewkit/ | all imports, build entry | confirm in plan | vite serve plus build |
| viewkit/ and super-agent/ are workspace siblings | user corrected the workspace layout; viewkit/ owns project work | project records live in viewkit/; agent instructions remain at workspace level | established 2026-10-08; replaces the previous nested-guide deviation | directory read |
| docs as spec truth, dev for plans | layout protocol default | plan stage reads docs | keep | plan coverage check |
| DOM preview and offline ffmpeg export | target-browser proof established transforms, overlap and audio without real-time capture | compositor, export | implemented; retain shared ordering and gain contracts | browser journey and output inspection |
