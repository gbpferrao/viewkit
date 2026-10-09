# phase plan: p05 mp4-export

## outcome and boundaries

- observable outcome: the edited sequence downloads as one full-resolution mp4 with mixed audio.
- status: planned; user plan acceptance and plan security pass required before build.
- dependencies: p01, p04.
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
| phase predecessors | dev/plans/PLAN.md | p01 and p04 |

## workstreams and requirement assignments

### export-mp4

- requirement-ref: export-mp4
- contribution: complete; Use the proven encoder pipeline with an immutable export snapshot and independent clock; one run, progress/cancel, full stage dimensions, 24 fps and mixed gains.
- owner and contracts: the capability named by docs/ARCHITECTURE.md; p01 boundary contracts apply.
- dependencies: p01, p04; supporting contracts must be frozen before dependent edits.
- target paths: phase deliverables below; meaningful checks stay beside the corresponding app/src owner.
- verification and evidence: Five-second two-clip mp4 plays on target browsers; check trims/offsets/transforms/overlap/gaps/audio; empty/busy blocked; cancel drops partial output; failure keeps project. Evidence: dev/plans/evidence/p05/.


## concrete tasks

- Require p01 successful feasibility evidence and reconciled stack before choosing encoder implementation.
- Read an immutable project snapshot; edits do not mutate an active render. Clear cancels render before releasing resources.
- Render full stage resolution, deterministic overlapping visual order and all active audio gains from the same contracts as preview.
- Stop streams, revoke output URLs and terminate workers on success/failure/cancel; serve codec/worker assets locally.

## deliverables

| path | purpose and owner | required or conditional | acceptance gate |
|---|---|---|---|
| app/src/export/export-mp4.workflow.ts | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| app/src/export/mp4-encode.adapter.ts | offline local encoder adapter selected by p01 proof | required | mp4 and cancellation checks |
| app/src/export/export-graph.model.ts | pure timeline-to-filter-graph translation | required | dimensions, offsets, overlap and gain checks |
| app/src/export/export-panel.view.vue | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| docs/operations/run-local.md | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |

## failure, migration, and integration constraints

Preserve prior valid project state on rejected transactions. Never upload imported media. Media is untrusted; validate decode and finite metadata.

Draft gestures do not mutate committed state. Async work uses cancellation and project generations. Resource owners clean up on failure and clear.

No persisted data migration exists in v1. Revert an unsuccessful increment without erasing unrelated user work. Do not keep alternate authoritative implementations.

## verification and exit gate

- Inspect resulting container/codecs, dimensions, 24 fps and audible/metered gain, with offset/overlap/gap fixtures.
- Cancel during render and transcode, provoke decode/encode failure and second-start rejection; verify cleanup and intact project.
- capture meaningful model/workflow checks and browser evidence for assigned acceptance conditions; planned checks are not executed evidence.
- place evidence in dev/plans/evidence/p05/ and link from dev/plans/phases/p05.tracker.md.
- exit requires all assigned contribution checks, integrated boundary review, security disposition, topology reconciliation, and receiving-owner acknowledgment.
- create tracker and handoff at phase execution using shared build templates; update PHASE-INDEX.md from evidence.

## deferred work and reconciliation

| receiving owner | allowed scope | prohibited expansion | gate |
|---|---|---|---|
| successors in PLAN.md | only outstanding contributions explicitly assigned there | no silent weakening of this phase acceptance | predecessor evidence and contract reconciliation |

Create or extend the listed deliverables; no source removals planned. Temporary p01 encoder proof stays under development evidence, outside production imports.
