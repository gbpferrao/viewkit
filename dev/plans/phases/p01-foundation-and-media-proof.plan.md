# phase plan: p01 foundation-and-media-proof

## outcome and boundaries

- observable outcome: a runnable empty editor and a measured mp4 feasibility result.
- status: planned; user plan acceptance and plan security pass required before build.
- dependencies: none.
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
| phase predecessors | dev/plans/PLAN.md | user acceptance and security gate |

## workstreams and requirement assignments

Foundation contributes shared contracts and encoder evidence; no product requirement is completed here.

## concrete tasks

- Establish the Vue/TypeScript/Pinia application and reproducible install, typecheck, build, and meaningful model checks using the selected stack as a hypothesis. Record compatible exact dependencies and licenses before install; do not silently upgrade the stack.
- Freeze contracts for clip identity, source offsets, 24 fps quantization, overlapping intervals, trim bounds, transaction snapshots, render order, volume, and cancellation. Models validate; project state stores accepted values; workflows coordinate mutations.
- Prove a five-second two-clip mp4 with audio, source offsets, transforms, overlap, black gaps, full stage dimensions, 24 fps, and cancellation on chrome and edge. CaptureStream and MediaRecorder are hypotheses; do not claim offline deterministic rendering without evidence.
- Document encoder memory, runtime asset origins, supported codecs, and local resource serving. If the proposed pipeline cannot satisfy export, return evidence to architecture and stack before p05.
- Fix the stage invalid-input contract against PRD acceptance: zero and nonnumeric input preserve prior size. Define other range handling consistently.
- Record deterministic compositing order and selectability for overlapping clips; no automatic push or rejection. Define best-effort large-file warnings and probe cancellation without inventing a hard product limit.

## deliverables

| path | purpose and owner | required or conditional | acceptance gate |
|---|---|---|---|
| app/package.json | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| app/package-lock.json | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| app/vite.config.ts | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| app/tsconfig.json | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| app/index.html | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| app/src/main.ts | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| app/src/app.composition.ts | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| app/src/shared/frame-math.contract.ts | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| docs/contracts/timeline-edit.contract.md | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| docs/contracts/stage-edit.contract.md | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| docs/contracts/playback.contract.md | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| docs/contracts/import-export.contract.md | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| docs/operations/run-local.md | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| dev/plans/evidence/p01/media-proof/ | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |

## failure, migration, and integration constraints

Preserve prior valid project state on rejected transactions. Never upload imported media. Media is untrusted; validate decode and finite metadata.

Draft gestures do not mutate committed state. Async work uses cancellation and project generations. Resource owners clean up on failure and clear.

No persisted data migration exists in v1. Revert an unsuccessful increment without erasing unrelated user work. Do not keep alternate authoritative implementations.

## verification and exit gate

- Empty editor boots with 1280x720 stage state and 24 fps quantization contracts.
- Install, typecheck, and build reproduce from lockfile; runtime assets can be served locally.
- Encoder proof records codecs, actual dimensions, frame rate, audio, cancellation cleanup, and target browser versions; failure blocks p05, not independent editor work.
- p01 may hand off foundation with a documented negative encoder result and explicit p05 blocker. Product export remains incomplete; architecture/stack reconciliation must precede p05.
- capture meaningful model/workflow checks and browser evidence for assigned acceptance conditions; planned checks are not executed evidence.
- place evidence in dev/plans/evidence/p01/ and link from dev/plans/phases/p01.tracker.md.
- exit requires all assigned contribution checks, integrated boundary review, security disposition, topology reconciliation, and receiving-owner acknowledgment.
- create tracker and handoff at phase execution using shared build templates; update PHASE-INDEX.md from evidence.

## deferred work and reconciliation

| receiving owner | allowed scope | prohibited expansion | gate |
|---|---|---|---|
| successors in PLAN.md | only outstanding contributions explicitly assigned there | no silent weakening of this phase acceptance | predecessor evidence and contract reconciliation |

Create or extend the listed deliverables; no source removals planned. Temporary p01 encoder proof stays under development evidence, outside production imports.
