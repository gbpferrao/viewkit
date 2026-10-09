# phase plan: p03 timeline-editing-and-history

## outcome and boundaries

- observable outcome: clips can be moved, trimmed, split, selected, copied and undone.
- status: planned; user plan acceptance and plan security pass required before build.
- dependencies: p02.
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
| phase predecessors | dev/plans/PLAN.md | p02 |

## workstreams and requirement assignments

### timeline-place-move

- requirement-ref: timeline-place-move
- contribution: complete; Commit atomic body drags across time and lanes; preserve duration and permit all overlaps.
- owner and contracts: the capability named by docs/ARCHITECTURE.md; p01 boundary contracts apply.
- dependencies: p02; supporting contracts must be frozen before dependent edits.
- target paths: phase deliverables below; meaningful checks stay beside the corresponding app/src owner.
- verification and evidence: Move start/lane, clamp at zero, extend timeline, reject invalid lane, cancel drag, undo/redo without changing duration. Evidence: dev/plans/evidence/p03/.

### timeline-trim

- requirement-ref: timeline-trim
- contribution: complete; Drag start or end within source bounds on the frame grid; update source offset on start trim; allow overlaps; snap ends optionally.
- owner and contracts: the capability named by docs/ARCHITECTURE.md; p01 boundary contracts apply.
- dependencies: p02; supporting contracts must be frozen before dependent edits.
- target paths: phase deliverables below; meaningful checks stay beside the corresponding app/src owner.
- verification and evidence: Trim both ends, snap to other ends, disable snapping, preserve one-frame minimum, esc rollback, undo bounds and source offset. Evidence: dev/plans/evidence/p03/.

### timeline-split

- requirement-ref: timeline-split
- contribution: complete; Split selected or targeted clips strictly inside bounds; copy volume and transforms, assign new IDs, preserve source offsets.
- owner and contracts: the capability named by docs/ARCHITECTURE.md; p01 boundary contracts apply.
- dependencies: p02; supporting contracts must be frozen before dependent edits.
- target paths: phase deliverables below; meaningful checks stay beside the corresponding app/src owner.
- verification and evidence: Middle split yields contiguous pieces; edge/no-target is a hinted no-op; undo is one transaction. Evidence: dev/plans/evidence/p03/.

### timeline-delete

- requirement-ref: timeline-delete
- contribution: complete; Delete only selected clips and update selection; preserve source bin; integrate optional lane-local autofill.
- owner and contracts: the capability named by docs/ARCHITECTURE.md; p01 boundary contracts apply.
- dependencies: p02; supporting contracts must be frozen before dependent edits.
- target paths: phase deliverables below; meaningful checks stay beside the corresponding app/src owner.
- verification and evidence: Delete selected clips only; empty selection no-op; undo restores IDs, timing, transforms and volume. Evidence: dev/plans/evidence/p03/.

### timeline-snapping

- requirement-ref: timeline-snapping
- contribution: complete; Apply toggle and an 8 px threshold at current zoom to moving and trimmed clip edges, targeting playhead and other edges. Frame quantization remains mandatory.
- owner and contracts: the capability named by docs/ARCHITECTURE.md; p01 boundary contracts apply.
- dependencies: p02; supporting contracts must be frozen before dependent edits.
- target paths: phase deliverables below; meaningful checks stay beside the corresponding app/src owner.
- verification and evidence: On aligns ends to playhead/clip edges within threshold; off applies no magnetic alignment; visual indicator matches result at multiple zooms. Evidence: dev/plans/evidence/p03/.

### timeline-autofill

- requirement-ref: timeline-autofill
- contribution: complete; After deletion or leftward movement close affected same-lane gaps when enabled; preserve allowed overlaps and unrelated lanes.
- owner and contracts: the capability named by docs/ARCHITECTURE.md; p01 boundary contracts apply.
- dependencies: p02; supporting contracts must be frozen before dependent edits.
- target paths: phase deliverables below; meaningful checks stay beside the corresponding app/src owner.
- verification and evidence: Middle deletion closes gap on; same action leaves gap off; no-tail no-op; move case and undo restore every shifted clip. Evidence: dev/plans/evidence/p03/.

### timeline-multiselect

- requirement-ref: timeline-multiselect
- contribution: complete; Marquee intersects clip bounds; ctrl click toggles; empty click and esc clear; ctrl marquee preserves prior selection.
- owner and contracts: the capability named by docs/ARCHITECTURE.md; p01 boundary contracts apply.
- dependencies: p02; supporting contracts must be frozen before dependent edits.
- target paths: phase deliverables below; meaningful checks stay beside the corresponding app/src owner.
- verification and evidence: Select three with marquee then a fourth with ctrl; test empty marquee with/without ctrl and selection cleanup on deletion. Evidence: dev/plans/evidence/p03/.

### timeline-group-drag

- requirement-ref: timeline-group-drag
- contribution: complete; Use a common clamped time delta and lane delta; validate entire group before atomic commit. Overlap is valid.
- owner and contracts: the capability named by docs/ARCHITECTURE.md; p01 boundary contracts apply.
- dependencies: p02; supporting contracts must be frozen before dependent edits.
- target paths: phase deliverables below; meaningful checks stay beside the corresponding app/src owner.
- verification and evidence: Three clips preserve relative offsets; invalid target lane rejects all; zero clamp preserves offsets; esc and undo affect whole group. Evidence: dev/plans/evidence/p03/.

### timeline-zoom-scroll

- requirement-ref: timeline-zoom-scroll
- contribution: complete; Horizontal zoom 10–400 px/sec and compact-to-tall lane heights; clamp scroll and retain visible playhead where possible.
- owner and contracts: the capability named by docs/ARCHITECTURE.md; p01 boundary contracts apply.
- dependencies: p02; supporting contracts must be frozen before dependent edits.
- target paths: phase deliverables below; meaningful checks stay beside the corresponding app/src owner.
- verification and evidence: Zoom out fits sequence, zoom in supports frame placement; all lanes remain reachable; snap threshold stays screen-relative. Evidence: dev/plans/evidence/p03/.

### edit-copy-paste

- requirement-ref: edit-copy-paste
- contribution: complete; Copy selected clips into memory and paste fresh IDs at playhead while preserving relative timing, durations, offsets, gain and transforms. Existing overlap is allowed.
- owner and contracts: the capability named by docs/ARCHITECTURE.md; p01 boundary contracts apply.
- dependencies: p02; supporting contracts must be frozen before dependent edits.
- target paths: phase deliverables below; meaningful checks stay beside the corresponding app/src owner.
- verification and evidence: Two copied clips produce two fresh IDs; undo removes only pasted clips; empty buffer no-op; failed transaction preserves state. Evidence: dev/plans/evidence/p03/.

### edit-undo-redo

- requirement-ref: edit-undo-redo
- contribution: partial; Create a 50-entry history owner and transaction integration for all timeline mutations; redo clears after a new edit. Stage and gain integration finish in p04.
- owner and contracts: the capability named by docs/ARCHITECTURE.md; p01 boundary contracts apply.
- dependencies: p02; supporting contracts must be frozen before dependent edits.
- target paths: phase deliverables below; meaningful checks stay beside the corresponding app/src owner.
- verification and evidence: ctrl z/y move, split, trim, delete, autofill and paste; each drag is one entry; view changes excluded; empty-stack no-op. Evidence: dev/plans/evidence/p03/.


## concrete tasks

- Implement gesture drafts in views and validated transactions in workflow/model owners.
- Avoid model/history dependency cycles: workflow orchestrates commits; history stores and restores validated snapshots.
- Shortcuts act on editor focus and do not intercept text-field editing.
- Replace paste cascade and overlap rejection assumptions with accepted overlap behavior.

## deliverables

| path | purpose and owner | required or conditional | acceptance gate |
|---|---|---|---|
| app/src/timeline/edit-timeline.workflow.ts | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| app/src/timeline/history-clipboard.workflow.ts | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| app/src/timeline/timeline-lanes.view.vue | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| app/src/timeline/clip-block.view.vue | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |
| app/src/shared/shortcut-keys.adapter.ts | responsibility declared in topology or this phase | required; encoder assets conditional on p01 proof | phase checks below |

## failure, migration, and integration constraints

Preserve prior valid project state on rejected transactions. Never upload imported media. Media is untrusted; validate decode and finite metadata.

Draft gestures do not mutate committed state. Async work uses cancellation and project generations. Resource owners clean up on failure and clear.

No persisted data migration exists in v1. Revert an unsuccessful increment without erasing unrelated user work. Do not keep alternate authoritative implementations.

## verification and exit gate

- Exercise all assigned acceptance scenarios with repeated edits and interleaved undo/redo.
- Verify snapping versus frame quantization, overlap plus autofill, source-bound trimming, group atomicity and focus behavior.
- capture meaningful model/workflow checks and browser evidence for assigned acceptance conditions; planned checks are not executed evidence.
- place evidence in dev/plans/evidence/p03/ and link from dev/plans/phases/p03.tracker.md.
- exit requires all assigned contribution checks, integrated boundary review, security disposition, topology reconciliation, and receiving-owner acknowledgment.
- create tracker and handoff at phase execution using shared build templates; update PHASE-INDEX.md from evidence.

## deferred work and reconciliation

| receiving owner | allowed scope | prohibited expansion | gate |
|---|---|---|---|
| successors in PLAN.md | only outstanding contributions explicitly assigned there | no silent weakening of this phase acceptance | predecessor evidence and contract reconciliation |

Create or extend the listed deliverables; no source removals planned. Temporary p01 encoder proof stays under development evidence, outside production imports.

