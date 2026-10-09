# phased plan

## plan status and scope

- status: accepted for implementation by the user's request to finish all phases; plan security gate signed in security-plan.report.md.
- owner: user accepts scope; receiving build owner owns execution and gate acknowledgment.
- last updated: 2026-10-08.
- specification revision: docs/PRD.md, ARCHITECTURE.md, TOPOLOGY.md and STACK.md, incorporating 1280x720 default, allowed overlaps and end trimming.
- authorized scope: planning the full local browser v1 slicer; implementation is a later workflow.
- existing behavior: application implemented under app/; phase trackers and build.report.md own verification status.
- exclusions: mobile, persistence, upload, collaboration, effects, transitions, keyframes and export format controls.
- blockers: encoder evidence blocks export implementation if p01 fails. Current stack versions are hypotheses requiring compatibility and security validation.

## phase order

| phase ID | plan path | outcome | prerequisites | status |
|---|---|---|---|---|
| p01 | phases/p01-foundation-and-media-proof.plan.md | a runnable empty editor and a measured mp4 feasibility result | none | planned |
| p02 | phases/p02-import-and-timeline.plan.md | local files appear in the bin and can be placed in ten scrollable lanes | p01 | planned |
| p03 | phases/p03-timeline-editing-and-history.plan.md | clips can be moved, trimmed, split, selected, copied and undone | p02 | planned |
| p04 | phases/p04-stage-playback-and-clear.plan.md | transformed overlapping clips preview with synchronized audio and a complete project reset | p03 | planned |
| p05 | phases/p05-mp4-export.plan.md | the edited sequence downloads as one full-resolution mp4 with mixed audio | p01, p04 | planned |
| p06 | phases/p06-integrated-acceptance.plan.md | both supported browsers pass the full editing and export journey | p05 | planned |

## dependency and integration strategy

p01 freezes shared mutation, render, playback and export contracts and proves the proposed encoder path. p02 establishes source/state/lane owners.

p03 adds transactional timeline gestures and history. p04 integrates stage mutations, all active overlapping media, audio and reset into those owners.

p05 implements export only after encoder proof and full rendering semantics. p06 completes cross-cutting checks and user acceptance.

All phases share contracts, the project state or composition. Execute sequentially; isolated capability files alone do not make parallel execution safe.

Models own meaning and validation; project state owns stored committed values. Workflows coordinate commits; views keep drafts; history stores snapshots.

History does not depend on views. Composition binds validated snapshot restoration to the models, avoiding a workflow/history cycle.

## dependency graph

All phase-order rows are graph nodes. Every prerequisite appears below.

| from phase | to phase | edge reason | contract or path |
|---|---|---|---|
| p01 | p02 | framework, source and transaction contracts | app/src/app.composition.ts, docs/contracts/ |
| p02 | p03 | decoded sources, stored clip identity and lane view | media/, timeline/ |
| p03 | p04 | history and editable clip intervals, overlap and trimming | timeline edit/history contracts |
| p01 | p05 | actual mp4/audio proof and selected encoder | import-export contract and p01 evidence |
| p04 | p05 | shared stage, gain, ordering and interval semantics | stage/, playback/, project state |
| p05 | p06 | complete editor/export integration | complete app and runtime assets |

## parallel sets and frontier

| parallel set | members | safety disposition |
|---|---|---|
| none | none | each phase has an explicit predecessor or shared mutable integration owner |

- starting frontier: p01; user implementation authorization and signed plan security pass were recorded before source creation.
- frontier move rule: a verified phase leaves the frontier; successors enter only after all prerequisites close and receiving owner accepts evidence.
- default worker: current agent; no delegation or model override requested.
- encoder failure may leave later editor work ready while p05 stays blocked; it never licenses an unproven export promise.

## requirement coverage

| requirement ID | contribution phases | completion phase | acceptance and evidence |
|---|---|---|---|
| project-import | p02 | p02 | phase assignments contain acceptance scenarios; evidence in dev/plans/evidence/ |
| timeline-lanes | p02 | p02 | phase assignments contain acceptance scenarios; evidence in dev/plans/evidence/ |
| timeline-place-move | p02, p03 | p03 | phase assignments contain acceptance scenarios; evidence in dev/plans/evidence/ |
| local-only | p02, p06 | p06 | phase assignments contain acceptance scenarios; evidence in dev/plans/evidence/ |
| timeline-trim | p03 | p03 | phase assignments contain acceptance scenarios; evidence in dev/plans/evidence/ |
| timeline-split | p03 | p03 | phase assignments contain acceptance scenarios; evidence in dev/plans/evidence/ |
| timeline-delete | p03 | p03 | phase assignments contain acceptance scenarios; evidence in dev/plans/evidence/ |
| timeline-snapping | p03 | p03 | phase assignments contain acceptance scenarios; evidence in dev/plans/evidence/ |
| timeline-autofill | p03 | p03 | phase assignments contain acceptance scenarios; evidence in dev/plans/evidence/ |
| timeline-multiselect | p03 | p03 | phase assignments contain acceptance scenarios; evidence in dev/plans/evidence/ |
| timeline-group-drag | p03 | p03 | phase assignments contain acceptance scenarios; evidence in dev/plans/evidence/ |
| timeline-zoom-scroll | p03 | p03 | phase assignments contain acceptance scenarios; evidence in dev/plans/evidence/ |
| edit-copy-paste | p03 | p03 | phase assignments contain acceptance scenarios; evidence in dev/plans/evidence/ |
| edit-undo-redo | p03, p04 | p04 | phase assignments contain acceptance scenarios; evidence in dev/plans/evidence/ |
| stage-define | p04 | p04 | phase assignments contain acceptance scenarios; evidence in dev/plans/evidence/ |
| stage-preview-lowres | p04 | p04 | phase assignments contain acceptance scenarios; evidence in dev/plans/evidence/ |
| stage-transform | p04 | p04 | phase assignments contain acceptance scenarios; evidence in dev/plans/evidence/ |
| timeline-volume | p04 | p04 | phase assignments contain acceptance scenarios; evidence in dev/plans/evidence/ |
| playback-24fps | p04 | p04 | phase assignments contain acceptance scenarios; evidence in dev/plans/evidence/ |
| project-clear | p04 | p04 | phase assignments contain acceptance scenarios; evidence in dev/plans/evidence/ |
| preview-perf | p04, p06 | p06 | phase assignments contain acceptance scenarios; evidence in dev/plans/evidence/ |
| export-mp4 | p05 | p05 | phase assignments contain acceptance scenarios; evidence in dev/plans/evidence/ |
| browser-support | p06 | p06 | phase assignments contain acceptance scenarios; evidence in dev/plans/evidence/ |

## phase records

All paths below are relative to project root unless marked shared.

| record | canonical path | owner | template |
|---|---|---|---|
| plan | dev/plans/PLAN.md | planning owner | shared coder/30-PLAN/templates/PLAN.template.md |
| phase plans | dev/plans/phases/<phase-id>-<outcome>.plan.md; exact list above | planning owner | shared coder/30-PLAN/templates/phase-plan.template.md |
| tracker | dev/plans/phases/<phase-id>.tracker.md | build owner at entry | shared coder/40-BUILD/templates/phase-tracker.template.md |
| handoff | dev/plans/phases/<phase-id>.handoff.md | build owner at exit | shared coder/40-BUILD/templates/phase-handoff.template.md |
| index | dev/plans/PHASE-INDEX.md | build handoff owner | created at first phase entry; reconcile from evidence |
| evidence | dev/plans/evidence/<phase-id>/ | executing owner | meaningful checks and browser artifacts |
| integrated planning review | dev/plans/planning.report.md | planning owner | shared two-pass report template |
| plan security review | dev/plans/security-plan.report.md | independent security review owner before build | shared security review template |

Shared templates live under ../super-agent/. Trackers and handoffs are created during execution, not fabricated during planning.

## cross-phase risks and decisions

| issue | affected scope | owner | resolution gate |
|---|---|---|---|
| mp4 capture does not establish deterministic offline video/audio encoding | p01, p05, export-mp4 | export owner | prove offsets, rate, gain, gaps, cancel and both browsers; reconcile pipeline if proof fails |
| overlapping active clips require deterministic ordering and simultaneous audio | p01–p05 | rendering and edit owners | freeze shared contract in p01; preview/export parity in p05 |
| decoder memory and large-file handling | p01, p02, p04–p06 | import/resource owners | measure resource behavior, warn without inventing hard limits, cancel failed probes |
| old version assumptions and ffmpeg dependency/runtime asset trust | p01, p05 | stack and security owners | verify supported dependency combination, licensing, lockfile and local asset origins before use |
| stale import/export completion after clear | p02, p04, p05 | composition and resource owners | cancellation plus generation guards; reset tests and repeated cycles |
| stage input range wording | p01, p04 | stage contract owner | preserve zero/non-numeric rejection required by acceptance; document remaining clamping rules |
| performance target lacks hardware and observation duration | p04, p06 | verification owner | record hardware, fixture, browser, duration and measurements before claiming a pass |

## integrated acceptance

- cut/export scenario: import, overlapping placement, end trim with snapping on/off, split, delete, volume, stage layout, preview, mp4.
- arrange scenario: marquee/ctrl selection, atomic group drag, zoom, gap fill, mixed undo/redo, copy/paste, clear/cancel/reload.
- architecture/topology reconciliation: compare actual owners and source paths; keep future paths distinguished from existing implementation.
- migrations: no persisted project migration; regression checks preserve imported sources and immutable export snapshots.
- acceptance owner: user, after reviewing this plan and later the executed phase evidence.
- coverage execution evidence: planning.report.md records exact current command and result.
- security gate: security-plan.report.md signed and acknowledged before p01; security-build.report.md owns the delivered build pass.
- no claim of security approval, application implementation or user acceptance is made by writing this plan.
