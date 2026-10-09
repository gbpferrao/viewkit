# phase plan: p02 import-and-timeline

## outcome and boundaries

- observable outcome: local files appear in the bin and can be placed in ten scrollable lanes.
- status: planned; user plan acceptance and plan security pass required before build.
- dependencies: p01.
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
| phase predecessors | dev/plans/PLAN.md | p01 |

## workstreams and requirement assignments

### project-import

- requirement-ref: project-import
- contribution: complete; Import picker/drop mp4/webm/mov and mp3/wav/aac/m4a through browser decode probes; duplicates remain separate sources. Queue imports, reject unsupported files with reasons, roll back failed probes, and preserve existing project.
- owner and contracts: the capability named by docs/ARCHITECTURE.md; p01 boundary contracts apply.
- dependencies: p01; supporting contracts must be frozen before dependent edits.
- target paths: phase deliverables below; meaningful checks stay beside the corresponding app/src owner.
- verification and evidence: Import valid mp4 with duration; reject txt without state mutation; duplicates produce separate source IDs; reload removes media; ordered concurrent imports and clear-during-probe leave no late sources. Evidence: dev/plans/evidence/p02/.

### timeline-lanes

- requirement-ref: timeline-lanes
- contribution: complete; Render exactly ten stable lanes indexed 0–9, with no add/remove control.
- owner and contracts: the capability named by docs/ARCHITECTURE.md; p01 boundary contracts apply.
- dependencies: p01; supporting contracts must be frozen before dependent edits.
- target paths: phase deliverables below; meaningful checks stay beside the corresponding app/src owner.
- verification and evidence: Fresh editor shows ten lanes and scrolling reaches lane 9. Evidence: dev/plans/evidence/p02/.

### timeline-place-move

- requirement-ref: timeline-place-move
- contribution: partial; Place sources on frame-grid time, clamp negative time to zero, allow overlap, and extend sequence duration. Moving and complete undo integration finish in p03.
- owner and contracts: the capability named by docs/ARCHITECTURE.md; p01 boundary contracts apply.
- dependencies: p01; supporting contracts must be frozen before dependent edits.
- target paths: phase deliverables below; meaningful checks stay beside the corresponding app/src owner.
- verification and evidence: Drop creates a clip with correct source offset, duration and lane; invalid lane preserves state; overlapping placement succeeds. Evidence: dev/plans/evidence/p02/.

### local-only

- requirement-ref: local-only
- contribution: partial; Keep File references and object URLs in memory; render file names as text; no uploader or persistent media store. Final network checks complete in p06.
- owner and contracts: the capability named by docs/ARCHITECTURE.md; p01 boundary contracts apply.
- dependencies: p01; supporting contracts must be frozen before dependent edits.
- target paths: phase deliverables below; meaningful checks stay beside the corresponding app/src owner.
- verification and evidence: Inspect import requests and memory ownership; unsupported names cannot inject markup; URLs revoke on rollback and shutdown. Evidence: dev/plans/evidence/p02/.


## concrete tasks

- Implement source probe lifetimes with a project generation token; clear and teardown cancel stale probes.
- Keep source insertion behind the project state capability and clip placement behind the edit workflow.
- Implement basic lane scrolling and frame-grid placement without hiding same-lane overlaps.
- Create the placement entry in edit-timeline.workflow.ts now; p03 extends this same owner for movement and other edits. Never place clips through direct view writes.
- Initialize clip transform and gain data from frozen contracts so split/copy can preserve them before p04 exposes controls.

## deliverables

| path | purpose and owner | required or conditional | acceptance gate |
|---|---|---|---|
| app/src/media/import-files.adapter.ts | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| app/src/media/media-bin.view.vue | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| app/src/timeline/timeline.model.ts | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| app/src/timeline/edit-timeline.workflow.ts | placement workflow entry, extended by p03 | required | validated placement without direct view mutation |
| app/src/timeline/project-timeline.state.ts | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| app/src/timeline/timeline-lanes.view.vue | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| app/src/timeline/clip-block.view.vue | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |

## failure, migration, and integration constraints

Preserve prior valid project state on rejected transactions. Never upload imported media. Media is untrusted; validate decode and finite metadata.

Draft gestures do not mutate committed state. Async work uses cancellation and project generations. Resource owners clean up on failure and clear.

No persisted data migration exists in v1. Revert an unsuccessful increment without erasing unrelated user work. Do not keep alternate authoritative implementations.

## verification and exit gate

- Run the assigned import, rejection, queue, placement, overlap, and lane scenarios.
- Observe resource cleanup and safe file-name display with malformed files.
- capture meaningful model/workflow checks and browser evidence for assigned acceptance conditions; planned checks are not executed evidence.
- place evidence in dev/plans/evidence/p02/ and link from dev/plans/phases/p02.tracker.md.
- exit requires all assigned contribution checks, integrated boundary review, security disposition, topology reconciliation, and receiving-owner acknowledgment.
- create tracker and handoff at phase execution using shared build templates; update PHASE-INDEX.md from evidence.

## deferred work and reconciliation

| receiving owner | allowed scope | prohibited expansion | gate |
|---|---|---|---|
| successors in PLAN.md | only outstanding contributions explicitly assigned there | no silent weakening of this phase acceptance | predecessor evidence and contract reconciliation |

Create or extend the listed deliverables; no source removals planned. Temporary p01 encoder proof stays under development evidence, outside production imports.
