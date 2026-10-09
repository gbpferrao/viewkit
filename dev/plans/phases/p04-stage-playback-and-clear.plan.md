# phase plan: p04 stage-playback-and-clear

## outcome and boundaries

- observable outcome: transformed overlapping clips preview with synchronized audio and a complete project reset.
- status: planned; user plan acceptance and plan security pass required before build.
- dependencies: p03.
- parallel group: none; shared state, contracts and integration paths require sequential ownership.
- in scope: assigned contributions and tasks below.
- out of scope: persistence, cloud, effects, transitions, keyframes and mobile; no receiving phase in v1.

## parallel execution

- worktree: use the project checkout with a clean ownership check before editing; no concurrent phase writes.
- merge target and owner: project integration checkout; receiving build owner verifies the merged increment.
- shared contracts frozen: p01 timeline/stage/playback/import-export agreements; changes require reconciliation of successors.
- worker override: none; no delegation requested.

## preconditions and inherited constraints

| input | owner and evidence | gate |
|---|---|---|
| product scope | docs/PRD.md, revision 2026-10-08 | preserve all acceptance and failure paths |
| boundaries and stack | docs/ARCHITECTURE.md, docs/STACK.md | changes need evidence before dependent work |
| topology | docs/TOPOLOGY.md | paths relative to viewkit/; agent instructions remain at workspace level |
| phase predecessors | dev/plans/PLAN.md | p03 |

## workstreams and requirement assignments

### stage-define

- requirement-ref: stage-define
- contribution: complete; Initialize 1280x720; edit integer dimensions in specified ranges, retain clip transforms, letterbox preview, and integrate undo.
- owner and contracts: the capability named by docs/ARCHITECTURE.md; p01 boundary contracts apply.
- dependencies: p03; supporting contracts must be frozen before dependent edits.
- target paths: phase deliverables below; meaningful checks stay beside the corresponding app/src owner.
- verification and evidence: Set 1280x720 and other valid sizes; zero/nonnumeric preserves prior size with feedback; undo restores size. Evidence: dev/plans/evidence/p04/.

### stage-preview-lowres

- requirement-ref: stage-preview-lowres
- contribution: complete; Scale the DOM preview to viewport without mutating authoritative stage pixels or transforms; render overlapping clips in the frozen order.
- owner and contracts: the capability named by docs/ARCHITECTURE.md; p01 boundary contracts apply.
- dependencies: p03; supporting contracts must be frozen before dependent edits.
- target paths: phase deliverables below; meaningful checks stay beside the corresponding app/src owner.
- verification and evidence: Small viewport preserves full stage dimensions; two HD clips preview; visual failure retains last frame/badge without unrelated edits. Evidence: dev/plans/evidence/p04/.

### stage-transform

- requirement-ref: stage-transform
- contribution: complete; Video clips expose body, scale, rotate and numeric controls; position may extend off stage, scale is 0.05–10, rotation wraps −180–180.
- owner and contracts: the capability named by docs/ARCHITECTURE.md; p01 boundary contracts apply.
- dependencies: p03; supporting contracts must be frozen before dependent edits.
- target paths: phase deliverables below; meaningful checks stay beside the corresponding app/src owner.
- verification and evidence: Drag stores x/y, scale 2 doubles size, rotation 90 turns image; audio panel disabled; esc restores draft; undo one gesture. Evidence: dev/plans/evidence/p04/.

### timeline-volume

- requirement-ref: timeline-volume
- contribution: complete; Validate integer gain 0–100; apply per-clip audio/video gain without losing silent clips; history includes gain.
- owner and contracts: the capability named by docs/ARCHITECTURE.md; p01 boundary contracts apply.
- dependencies: p03; supporting contracts must be frozen before dependent edits.
- target paths: phase deliverables below; meaningful checks stay beside the corresponding app/src owner.
- verification and evidence: 0 mutes only selected clip, 50 halves gain relative to 100; invalid numeric rejected; meter or measurable audio evidence; undo restores. Evidence: dev/plans/evidence/p04/.

### playback-24fps

- requirement-ref: playback-24fps
- contribution: complete; Own one quantized timeline playhead and synchronize all active media, including overlapping same-lane clips. Frame step is exactly 1/24.
- owner and contracts: the capability named by docs/ARCHITECTURE.md; p01 boundary contracts apply.
- dependencies: p03; supporting contracts must be frozen before dependent edits.
- target paths: phase deliverables below; meaningful checks stay beside the corresponding app/src owner.
- verification and evidence: 24 timeline frames/sec, ±one-frame step, seeks clamp, gaps black/silent, end stops; decode stall pauses with spinner and resumes within two frames. Evidence: dev/plans/evidence/p04/.

### project-clear

- requirement-ref: project-clear
- contribution: complete; Confirmed reset cancels playback/export/import work, revokes sources, clears clips/history/clipboard/selection and resets stage to 1280x720. Cancel preserves project.
- owner and contracts: the capability named by docs/ARCHITECTURE.md; p01 boundary contracts apply.
- dependencies: p03; supporting contracts must be frozen before dependent edits.
- target paths: phase deliverables below; meaningful checks stay beside the corresponding app/src owner.
- verification and evidence: Clear after edits empties bin/timeline/history; cancel retains state; empty clear safe; pending operations cannot repopulate reset project. Evidence: dev/plans/evidence/p04/.

### edit-undo-redo

- requirement-ref: edit-undo-redo
- contribution: complete; Integrate stage size/transform and volume into the existing transaction history; clear remains nonundoable.
- owner and contracts: the capability named by docs/ARCHITECTURE.md; p01 boundary contracts apply.
- dependencies: p03; supporting contracts must be frozen before dependent edits.
- target paths: phase deliverables below; meaningful checks stay beside the corresponding app/src owner.
- verification and evidence: Undo/redo every editable action, including mixed stage/timeline/gain sequence; depth 50; failed restore keeps current state. Evidence: dev/plans/evidence/p04/.

### preview-perf

- requirement-ref: preview-perf
- contribution: partial; Measure two 1080p clips, overlap rendering, viewport scaling, and drag latency; final release run completes in p06.
- owner and contracts: the capability named by docs/ARCHITECTURE.md; p01 boundary contracts apply.
- dependencies: p03; supporting contracts must be frozen before dependent edits.
- target paths: phase deliverables below; meaningful checks stay beside the corresponding app/src owner.
- verification and evidence: Record hardware, media fixtures, frame drops/sync and gesture timings; investigate sustained drift beyond two frames or drag beyond 50 ms. Evidence: dev/plans/evidence/p04/.


## concrete tasks

- Keep stage workflow as stage mutation entry; composition binds shared history without making views authoritative.
- Distinguish isolated rendering failure from decoder stall: retain frame/badge for the former, pause clock for the latter.
- Implement URL/tag/audio node cleanup on clip disappearance, clear, completion and unmount.
- Make playback and export consume identical interval, transform, layering and gain semantics.

## deliverables

| path | purpose and owner | required or conditional | acceptance gate |
|---|---|---|---|
| app/src/stage/stage-size.model.ts | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| app/src/stage/stage-layout.workflow.ts | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| app/src/stage/preview-stage.state.ts | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| app/src/stage/stage-frame.view.vue | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| app/src/stage/stage-handles.view.vue | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| app/src/stage/stage-inspector.view.vue | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| app/src/playback/playback-engine.resource.ts | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| app/src/playback/audio-gain.adapter.ts | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| app/src/app.composition.ts | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |

## failure, migration, and integration constraints

Preserve prior valid project state on rejected transactions. Never upload imported media. Media is untrusted; validate decode and finite metadata.

Draft gestures do not mutate committed state. Async work uses cancellation and project generations. Resource owners clean up on failure and clear.

No persisted data migration exists in v1. Revert an unsuccessful increment without erasing unrelated user work. Do not keep alternate authoritative implementations.

## verification and exit gate

- Exercise stage, playback, audio, history and clear scenarios together.
- Check repeated clear/import cycles for stale media, handlers and resources; test overlapping audio/video and black gaps.
- capture meaningful model/workflow checks and browser evidence for assigned acceptance conditions; planned checks are not executed evidence.
- place evidence in dev/plans/evidence/p04/ and link from dev/plans/phases/p04.tracker.md.
- exit requires all assigned contribution checks, integrated boundary review, security disposition, topology reconciliation, and receiving-owner acknowledgment.
- create tracker and handoff at phase execution using shared build templates; update PHASE-INDEX.md from evidence.

## deferred work and reconciliation

| receiving owner | allowed scope | prohibited expansion | gate |
|---|---|---|---|
| successors in PLAN.md | only outstanding contributions explicitly assigned there | no silent weakening of this phase acceptance | predecessor evidence and contract reconciliation |

Create or extend the listed deliverables; no source removals planned. Temporary p01 encoder proof stays under development evidence, outside production imports.

