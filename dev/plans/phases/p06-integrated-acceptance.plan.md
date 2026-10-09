# phase plan: p06 integrated-acceptance

## outcome and boundaries

- observable outcome: both supported browsers pass the full editing and export journey.
- status: planned; user plan acceptance and plan security pass required before build.
- dependencies: p05.
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
| phase predecessors | dev/plans/PLAN.md | p05 |

## workstreams and requirement assignments

### preview-perf

- requirement-ref: preview-perf
- contribution: complete; Repeat performance acceptance on the integrated application using recorded hardware and fixture revisions.
- owner and contracts: the capability named by docs/ARCHITECTURE.md; p01 boundary contracts apply.
- dependencies: p05; supporting contracts must be frozen before dependent edits.
- target paths: phase deliverables below; meaningful checks stay beside the corresponding app/src owner.
- verification and evidence: Two 1080p clips have no sustained drop beyond two frames; drag latency under 50 ms per frame; record observation duration and traces. Evidence: dev/plans/evidence/p06/.

### browser-support

- requirement-ref: browser-support
- contribution: complete; Run full journey on current chrome and edge for windows and capture exact browser versions; verify unsupported codec messaging.
- owner and contracts: the capability named by docs/ARCHITECTURE.md; p01 boundary contracts apply.
- dependencies: p05; supporting contracts must be frozen before dependent edits.
- target paths: phase deliverables below; meaningful checks stay beside the corresponding app/src owner.
- verification and evidence: Import/edit/trim/transform/preview/export passes on both; unsupported decode explains failure and preserves project. Evidence: dev/plans/evidence/p06/.

### local-only

- requirement-ref: local-only
- contribution: complete; Inspect final runtime code and network behavior through import, preview, encoder initialization and export.
- owner and contracts: the capability named by docs/ARCHITECTURE.md; p01 boundary contracts apply.
- dependencies: p05; supporting contracts must be frozen before dependent edits.
- target paths: phase deliverables below; meaningful checks stay beside the corresponding app/src owner.
- verification and evidence: No imported bytes, file names or project data uploaded; no disk media persistence; self-hosted worker assets and URL lifecycle verified. Evidence: dev/plans/evidence/p06/.


## concrete tasks

- Run the complete cut/arrange/export journey and every prior phase's unresolved integration scenario.
- Perform the build security gate independently and reconcile requirement/architecture/topology/stack records against actual files.
- Document local startup/build/run, supported codec failure messages, reset/reload behavior and known evidence limits.
- Obtain user acceptance of delivered behavior; do not label unexecuted checks passed.

## deliverables

| path | purpose and owner | required or conditional | acceptance gate |
|---|---|---|---|
| docs/operations/run-local.md | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| dev/plans/evidence/p06/ | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| dev/plans/PHASE-INDEX.md | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |

## failure, migration, and integration constraints

Preserve prior valid project state on rejected transactions. Never upload imported media. Media is untrusted; validate decode and finite metadata.

Draft gestures do not mutate committed state. Async work uses cancellation and project generations. Resource owners clean up on failure and clear.

No persisted data migration exists in v1. Revert an unsuccessful increment without erasing unrelated user work. Do not keep alternate authoritative implementations.

## verification and exit gate

- Fresh install and build; import media, overlap, trim with snap on/off, multi-select/group move, split/delete/autofill, transform/gain, undo/redo, export and confirmed/cancelled clear.
- Record both browsers, no-upload inspection, malformed-input handling, repeated-resource cleanup and final security gate acknowledgment.
- capture meaningful model/workflow checks and browser evidence for assigned acceptance conditions; planned checks are not executed evidence.
- place evidence in dev/plans/evidence/p06/ and link from dev/plans/phases/p06.tracker.md.
- exit requires all assigned contribution checks, integrated boundary review, security disposition, topology reconciliation, and receiving-owner acknowledgment.
- create tracker and handoff at phase execution using shared build templates; update PHASE-INDEX.md from evidence.

## deferred work and reconciliation

| receiving owner | allowed scope | prohibited expansion | gate |
|---|---|---|---|
| successors in PLAN.md | only outstanding contributions explicitly assigned there | no silent weakening of this phase acceptance | predecessor evidence and contract reconciliation |

Create or extend the listed deliverables; no source removals planned. Temporary p01 encoder proof stays under development evidence, outside production imports.

