# product requirements

## document status

- status: draft
- scope: videokit v1 slicer in vue, 24 fps hardcoded, single local project
- owner: user
- last updated: 2026-10-08
- source intent and accepted decisions:
  - vue web app called videokit, slicer only for v1
  - 24 fps hardcoded
  - stage is the name for the canvas, user definable size with default, low res preview viewport
  - 10 lanes hardcoded, vertical scroll, h and v zoom
  - move, scale, rotate clips on stage, move clips on timeline, split at playhead, delete
  - snapping toggle, auto fill gaps toggle, per clip volume
  - marquee plus ctrl click multi select, group drag
  - ctrl z, ctrl y, ctrl c, ctrl v
  - one browser-local saved project, including media copies; new project clears it
  - export defaults to mp4, no other options
  - most performant and stable preview approach
- resolved defaults and technical evidence:
  - stage default size: 1280x720, accepted 2026-10-08
  - max import size and count, proposed best effort with warning
  - mp4 encoder detail: native WebCodecs worker with shared WebGPU composition, Canvas 2D and FFmpeg wasm fallbacks. historical chrome/edge evidence covers the earlier FFmpeg path; native browser acceptance remains pending

## product outcome

videokit v1 lets one user cut local video and audio into a timed sequence and export one mp4. success means import, arrange on stage and timeline, split, drag clip ends to trim, delete, mix volume, preview at 24 fps, export mp4.

## users and operating context

| user or external system | goals | environment and constraints |
|---|---|---|
| editor | cut and arrange clips fast with stable preview | desktop chrome or edge, local files only, no upload |
| browser | decode video, render stage, encode mp4 | memory bound, no cloud, no backend |

## scope

### included

- local video and audio import to memory
- single browser-saved project with new project reset
- user defined stage size with 1280x720 default, low res preview
- stage move, scale, rotate per video clip
- timeline with 10 lanes, move, split, delete, volume
- snapping toggle, auto fill gaps toggle
- marquee and ctrl click multi select, group drag
- timeline h and v zoom, vertical scroll
- 24 fps playback, playhead seek
- undo, redo, copy, paste
- mp4 export only

### excluded

- text, effects, transitions, keyframes
- cloud save, multi project management, collaboration
- audio waveform editing beyond volume
- other export formats, quality settings ui
- mobile support

## journeys

### cut a local clip and export

- actor and trigger: editor imports files and starts cutting
- preconditions: browser supports video decode and object urls
- successful outcome: clips on timeline, stage layout set, mp4 saved
- alternate and failure outcomes: bad file rejected, export failure keeps project, clear resets all
- related requirement IDs: project-import, project-clear, stage-define, timeline-split, export-mp4

### arrange multi lane sequence

- actor and trigger: editor drags clips across lanes and time
- preconditions: at least two clips imported
- successful outcome: positions, volumes, stage transforms persist in browser storage across reloads until new project
- alternate and failure outcomes: overlaps allowed within and across lanes; optional snapping aligns clip ends during movement and end dragging
- related requirement IDs: timeline-place-move, timeline-lanes, timeline-snapping, timeline-autofill, timeline-volume, timeline-multiselect, timeline-group-drag

## requirements

### project import to memory

- requirement-id: project-import
- obligation: the software must import local video and audio files into one browser-saved project without upload.
- actor and trigger: editor opens the file picker through the + button in the media panel header, the sole import entry.
- preconditions and input: video mp4/webm/mov, audio mp3/wav/aac/m4a, each file readable by browser.
- successful output and state change: each file becomes a source with object url, duration, type, and appears in media bin.
- limits and boundary cases: large files load best effort, unsupported files rejected with reason, duplicate files create separate sources.
- invalid, unauthorized, or conflicting input: non media files rejected, empty pick does nothing.
- failure, cancellation, and recovery: failed decode removes partial source and keeps prior project intact.
- persistence, restart, and concurrency, when applicable: IndexedDB stores the active project and local media copies; reload restores them. concurrent imports queue in order.
- dependencies: none.
- acceptance conditions:
  - import valid mp4 shows source with duration.
  - import txt shows rejection and no state change.
  - reload restores sources from browser storage.

### single project state and clear

- requirement-id: project-clear
- obligation: the software must hold one active project, autosave it locally in browser storage, and clear its saved data on new project.
- actor and trigger: editor chooses new project from the header hamburger menu, with confirmation.
- project name: editable header text, default untitled project, trimmed to 80 characters, saved in browser storage and reset by new project.
- preconditions and input: any project state, confirmed clear.
- successful output and state change: timeline, stage, sources, history, selection empty, object urls revoked.
- limits and boundary cases: clear on empty project does nothing harmful.
- invalid, unauthorized, or conflicting input: cancelled confirm keeps state.
- failure, cancellation, and recovery: clear is instant and not undoable by design, confirm guards it.
- persistence, restart, and concurrency, when applicable: one IndexedDB project; media blobs and metadata saved atomically. browser quota failures report a save failure while editing continues.
- dependencies: project-import.
- acceptance conditions:
  - clear after edits empties timeline and bin.
  - cancel keeps timeline intact.

### stage size define

- requirement-id: stage-define
- obligation: the software must let the editor set stage width and height in pixels, with 1280x720 default.
- actor and trigger: editor edits width or height in stage panel.
- preconditions and input: width 320 to 3840, height 240 to 2160, integers.
- successful output and state change: stage size updates, preview letterboxes, clip transforms keep values and clamp visually.
- limits and boundary cases: out of range rejects with feedback and keeps prior size; aspect not locked in v1.
- invalid, unauthorized, or conflicting input: non numeric input rejected, prior size kept.
- failure, cancellation, and recovery: invalid edit shows message and keeps prior size.
- persistence, restart, and concurrency, when applicable: browser-saved committed state; undo history itself remains transient.
- dependencies: none.
- acceptance conditions:
  - set 1280x720 updates preview frame.
  - set 0 keeps prior size with feedback.

### stage low res preview

- requirement-id: stage-preview-lowres
- obligation: the software must render stage preview at reduced resolution for speed while keeping full stage size as export truth.
- actor and trigger: system on every preview frame.
- preconditions and input: stage size set, clips placed.
- successful output and state change: viewport shows scaled preview, no change to stored transforms or export size.
- limits and boundary cases: preview scale follows viewport size, min legible, no manual quality switch in v1.
- invalid, unauthorized, or conflicting input: not applicable.
- failure, cancellation, and recovery: render failure shows last frame plus badge, playback continues.
- persistence, restart, and concurrency, when applicable: none.
- dependencies: stage-define.
- acceptance conditions:
  - 1920x1080 stage previews smooth on desktop chrome with two hd clips.
  - stored size stays 1920x1080 when viewport is small.

### stage transform move scale rotate

- requirement-id: stage-transform
- obligation: the software must let the editor move, scale, and rotate each video clip on the stage.
- actor and trigger: editor drags clip body, drags scale handle, drags rotate handle, or edits numeric fields.
- preconditions and input: video clip selected, stage size set.
- successful output and state change: clip stores x, y, scale x/y or uniform, rotation degrees, preview updates live.
- limits and boundary cases: position free including partly off stage, scale 0.05 to 10, rotation -180 to 180 with wrap.
- invalid, unauthorized, or conflicting input: audio clips have no stage transform and show disabled panel.
- failure, cancellation, and recovery: drag cancel with esc restores start values.
- persistence, restart, and concurrency, when applicable: browser-saved committed state, undoable in the current session.
- dependencies: stage-define.
- acceptance conditions:
  - drag moves preview and stores x/y.
  - scale 2 doubles visual size.
  - rotate 90 turns clip upright to sideways.

### timeline lanes fixed

- requirement-id: timeline-lanes
- obligation: the software must provide 10 fixed horizontal lanes with vertical scroll.
- actor and trigger: system on project load.
- preconditions and input: none.
- successful output and state change: 10 empty lanes render, lane index 0 to 9 stable.
- limits and boundary cases: no add or remove lane in v1, empty lanes allowed.
- invalid, unauthorized, or conflicting input: not applicable.
- failure, cancellation, and recovery: none.
- persistence, restart, and concurrency, when applicable: lane count constant, clip placement undoable.
- dependencies: none.
- acceptance conditions:
  - fresh project shows 10 lanes.
  - vertical scroll reaches lane 9.

### timeline place and move

- requirement-id: timeline-place-move
- obligation: the software must let the editor place sources onto the timeline and move clips in time and across lanes.
- actor and trigger: editor drags source to lane or drags clip body.
- preconditions and input: source decoded, target lane 0 to 9, start time >= 0.
- successful output and state change: clip start and lane update, duration unchanged, overlaps allowed within and across lanes without automatic push or rejection.
- limits and boundary cases: start snaps to frame at 24 fps, negative start clamps to 0, drop beyond end extends timeline.
- invalid, unauthorized, or conflicting input: drop outside lanes rejected.
- failure, cancellation, and recovery: failed drop keeps source position.
- persistence, restart, and concurrency, when applicable: committed edits browser-saved, undoable in the session; drag is atomic on release.
- dependencies: project-import, timeline-lanes.
- acceptance conditions:
  - drag source creates clip at drop time.
  - drag clip changes start and lane.

### timeline split at playhead

- requirement-id: timeline-split
- obligation: the software must split selected clips or targeted clips at the playhead into two clips.
- actor and trigger: editor invokes split with playhead inside clip bounds.
- preconditions and input: playhead time strictly inside clip, clip duration > 1 frame.
- successful output and state change: one clip becomes left and right clips with shared source offset split, transforms and volume copied.
- limits and boundary cases: playhead on edge does nothing with hint, frame exact split at 24 fps grid.
- invalid, unauthorized, or conflicting input: no selection and no clip under playhead does nothing.
- failure, cancellation, and recovery: failed split keeps original clip.
- persistence, restart, and concurrency, when applicable: undoable as one action.
- dependencies: timeline-place-move.
- acceptance conditions:
  - split mid clip yields two contiguous clips.
  - split at edge yields no change plus hint.

### timeline delete

- requirement-id: timeline-delete
- obligation: the software must delete selected clips on request.
- actor and trigger: editor presses delete or invokes remove.
- preconditions and input: one or more clips selected.
- successful output and state change: clips removed, selection cleared, gap remains unless autofill on.
- limits and boundary cases: delete with empty selection does nothing.
- invalid, unauthorized, or conflicting input: not applicable.
- failure, cancellation, and recovery: undo restores deleted clips with lane and time.
- persistence, restart, and concurrency, when applicable: undoable.
- dependencies: timeline-multiselect.
- acceptance conditions:
  - delete selected removes only those clips.
  - undo brings them back intact.

### timeline snapping toggle

- requirement-id: timeline-snapping
- obligation: the software must snap clip edges to playhead and nearby clip edges when snapping is on, and disable all snap when off.
- actor and trigger: editor toggles snap, then moves clips or drags their ends.
- preconditions and input: snap on or off, threshold 8 px at current zoom.
- successful output and state change: dragged edge aligns to nearest target within threshold, indicator shows.
- limits and boundary cases: no target in range means free move, disabled means never snap.
- invalid, unauthorized, or conflicting input: not applicable.
- failure, cancellation, and recovery: none.
- persistence, restart, and concurrency, when applicable: toggle state browser-saved, not undoable.
- dependencies: timeline-place-move.
- acceptance conditions:
  - snap on aligns to playhead within threshold.
  - snap off never aligns.

### timeline clip end trimming

- requirement-id: timeline-trim
- obligation: the software must let the editor drag either clip end, with optional snapping to other clip ends.
- successful output and state change: trimming changes timeline bounds and source offset without modifying the source file.
- limits and boundary cases: bounds stay on the 24 fps grid, inside source duration, with at least one frame remaining; overlaps remain allowed.
- failure, cancellation, and recovery: esc cancels the gesture; each committed gesture is one undoable action.
- dependencies: timeline-place-move, timeline-snapping.
- acceptance conditions: drag either end to shorten a clip; snap its end to another clip end when enabled; disable snapping for free frame-grid trimming; undo restores bounds and source offset.

### timeline autofill gaps toggle

- requirement-id: timeline-autofill
- obligation: the software must shift later clips left to close gaps when autofill is on after delete or move.
- actor and trigger: editor toggles autofill, then deletes or moves a clip left.
- preconditions and input: autofill on or off, gaps on same lane.
- successful output and state change: when on, clips after the gap on that lane shift left by gap size, no cross lane shift.
- limits and boundary cases: no later clips means no shift, overlapping rules still hold.
- invalid, unauthorized, or conflicting input: not applicable.
- failure, cancellation, and recovery: undo restores pre shift positions.
- persistence, restart, and concurrency, when applicable: toggle browser-saved, shift undoable.
- dependencies: timeline-delete, timeline-place-move.
- acceptance conditions:
  - delete middle clip with autofill on closes gap.
  - same delete with autofill off leaves gap.

### timeline volume per clip

- requirement-id: timeline-volume
- obligation: the software must let the editor set volume 0 to 100 per clip for video and audio clips.
- actor and trigger: editor drags volume slider or edits value.
- preconditions and input: clip selected, 0 mute to 100 full.
- successful output and state change: clip gain updates, preview and export use it.
- limits and boundary cases: 0 is silent but clip stays, >100 not allowed in v1.
- invalid, unauthorized, or conflicting input: non numeric rejected.
- failure, cancellation, and recovery: none.
- persistence, restart, and concurrency, when applicable: undoable in the current session; committed state is browser-saved.
- dependencies: none.
- acceptance conditions:
  - set 0 mutes that clip in preview.
  - set 50 halves level versus 100 by ear and meter.

### timeline multi select

- requirement-id: timeline-multiselect
- obligation: the software must support marquee drag select plus ctrl click add to selection on the timeline.
- actor and trigger: editor drags empty timeline area or ctrl clicks clips.
- preconditions and input: timeline focused, clips present.
- successful output and state change: marquee selects intersecting clips, ctrl click toggles membership, esc clears.
- limits and boundary cases: marquee with no intersect clears unless ctrl held, click empty clears.
- invalid, unauthorized, or conflicting input: not applicable.
- failure, cancellation, and recovery: none.
- persistence, restart, and concurrency, when applicable: selection is transient, not undoable.
- dependencies: timeline-lanes.
- acceptance conditions:
  - drag box selects three clips at once.
  - ctrl click adds a fourth without losing three.

### timeline group drag

- requirement-id: timeline-group-drag
- obligation: the software must move all selected clips together while keeping relative offsets when any member is dragged.
- actor and trigger: editor drags one clip in a multi selection.
- preconditions and input: two or more clips selected, valid drop targets.
- successful output and state change: all members shift by same delta time, lane changes apply only if all targets valid, else whole move rejected with feedback.
- limits and boundary cases: clamp at 0, same lane overlap rule applies to each member.
- invalid, unauthorized, or conflicting input: invalid target rejects whole group move.
- failure, cancellation, and recovery: failed move keeps all positions.
- persistence, restart, and concurrency, when applicable: one undoable action.
- dependencies: timeline-multiselect, timeline-place-move.
- acceptance conditions:
  - drag one of three selected moves all three by same delta.
  - blocked lane rejects whole move.

### timeline zoom and scroll

- requirement-id: timeline-zoom-scroll
- obligation: the software must provide horizontal time zoom, vertical lane height zoom, and vertical scroll.
- actor and trigger: editor uses zoom slider, buttons, or wheel.
- preconditions and input: timeline with 0 or more clips.
- successful output and state change: px per second and lane height update, scroll positions stay valid, playhead stays visible when possible.
- limits and boundary cases: h zoom 10 px per sec to 400 px per sec, v zoom compact to tall, scroll clamps.
- invalid, unauthorized, or conflicting input: not applicable.
- failure, cancellation, and recovery: none.
- persistence, restart, and concurrency, when applicable: view only, not undoable.
- dependencies: timeline-lanes.
- acceptance conditions:
  - zoom out shows full sequence.
  - zoom in allows frame exact placement.

### playback at 24 fps

- requirement-id: playback-24fps
- obligation: the software must play and seek the timeline at hardcoded 24 fps with one playhead.
- actor and trigger: editor presses play, pause, or seeks.
- preconditions and input: clips on timeline, playhead time >= 0.
- successful output and state change: stage preview and audio follow timeline time, frame step moves 1/24 sec.
- limits and boundary cases: gaps show black and silence, end stops playback.
- invalid, unauthorized, or conflicting input: seek beyond end clamps to end.
- failure, cancellation, and recovery: decode stall pauses with spinner and resumes without losing sync beyond 2 frames.
- persistence, restart, and concurrency, when applicable: none.
- dependencies: timeline-place-move, stage-preview-lowres.
- acceptance conditions:
  - play advances 24 frames per second of timeline time.
  - frame step moves exactly one frame.

### edit undo redo

- requirement-id: edit-undo-redo
- obligation: the software must undo with ctrl z and redo with ctrl y across timeline and stage edits.
- actor and trigger: editor presses ctrl z or ctrl y.
- preconditions and input: history stack with entries.
- successful output and state change: last edit reversed or reapplied, selection adjusted to affected clips.
- limits and boundary cases: depth 50, view only changes excluded, clear not undoable.
- invalid, unauthorized, or conflicting input: empty stack does nothing.
- failure, cancellation, and recovery: history failure keeps current state and logs.
- persistence, restart, and concurrency, when applicable: memory only.
- dependencies: all editable requirements.
- acceptance conditions:
  - ctrl z after move restores prior position.
  - ctrl y reapplies it.

### edit copy paste

- requirement-id: edit-copy-paste
- obligation: the software must copy with ctrl c and paste with ctrl v selected clips.
- actor and trigger: editor presses ctrl c then ctrl v.
- preconditions and input: one or more clips selected for copy, playhead or lane target for paste.
- successful output and state change: paste creates new clips with same duration, offset, volume, transform and relative timing at the playhead; occupied positions may overlap.
- limits and boundary cases: copy with no selection does nothing, paste with empty buffer does nothing.
- invalid, unauthorized, or conflicting input: not applicable.
- failure, cancellation, and recovery: failed paste keeps timeline unchanged.
- persistence, restart, and concurrency, when applicable: paste undoable as one action.
- dependencies: timeline-multiselect.
- acceptance conditions:
  - copy two clips and paste yields two new clips at playhead.
  - undo removes pasted clips only.

### export mp4 only

- requirement-id: export-mp4
- obligation: the software must export the timeline as one mp4 file, no format picker in v1.
- actor and trigger: editor invokes export.
- preconditions and input: at least one clip, stage size set, 24 fps.
- successful output and state change: one mp4 file downloads with stage size, 24 fps, mixed audio with per clip volume.
- limits and boundary cases: gaps render black plus silence, export runs async with progress and cancel.
- invalid, unauthorized, or conflicting input: export with empty timeline blocked with hint.
- failure, cancellation, and recovery: failure keeps project and shows reason, cancel discards partial file.
- persistence, restart, and concurrency, when applicable: no persistence, one export at a time.
- dependencies: playback-24fps, stage-define, timeline-volume.
- acceptance conditions:
  - 5 sec two clip timeline exports playable mp4.
  - empty timeline blocks export.

## cross-cutting requirements

### preview performance

- requirement-id: preview-perf
- obligation: the software must meet the preview and drag performance targets in the table below.
- acceptance conditions: two 1080p clips preview without sustained drop beyond 2 frames; timeline drag stays under 50 ms per frame.
- dependencies: stage-preview-lowres, playback-24fps, timeline-place-move.

### browser compatibility

- requirement-id: browser-support
- obligation: the software must support chrome and edge on windows and explain unsupported decode failures.
- acceptance conditions: the full import, edit, preview, and export journey works on both target browsers; unsupported decode shows a message.
- dependencies: project-import, playback-24fps, export-mp4.

### local media boundary

- requirement-id: local-only
- obligation: the software must keep imported media in browser memory without network upload.
- acceptance conditions: network inspection shows no media upload during import, preview, or export; sources use memory object urls.
- dependencies: project-import, export-mp4.

| concern | requirement ID | affected scope | acceptance |
|---|---|---|---|
| performance | preview-perf | stage and timeline | two 1080p clips preview without sustained drop beyond 2 frames, timeline drag stays under 50 ms per frame |
| compatibility | browser-support | full app | works on latest chrome and edge on windows, degrades with message on unsupported decode |
| operations | local-only | full app | no network upload; files copied into local IndexedDB and exposed through session object URLs |

## assumptions and unresolved decisions

| decision | status: accepted / assumption / unresolved | owner | affected IDs | consequence if unresolved |
|---|---|---|---|---|
| stage default 1280x720 | accepted 2026-10-08 | user | stage-define | initialize and reset to these dimensions |
| overlap allowed, optional end snapping | accepted 2026-10-08 | user | timeline-place-move, timeline-snapping, timeline-trim | no automatic push or overlap rejection |
| mp4 via native codec worker with wasm fallback | implemented, build checked; native browser evidence pending | export owner | export-mp4 | full-stage offline rendering with local mixed audio; see renderer-decision.md |
| max file guard best effort | unresolved | user | project-import | huge files can stall browser |
| volume model simple gain only | accepted | user | timeline-volume | no keyframes in v1 by design |

## traceability

| requirement ID | journey | architecture owner | planned verification | readiness |
|---|---|---|---|---|
| project-import | cut and export | import adapter plus project state | import mp4, reject txt, reload restores | ready |
| project-clear | cut and export | project state | clear empties, cancel keeps | ready |
| stage-define | cut and export | stage model plus stage view | set size updates frame | ready |
| stage-preview-lowres | cut and export | stage compositor | stored size stays full | ready |
| stage-transform | arrange sequence | stage model plus stage view | drag, scale, rotate | ready |
| timeline-lanes | arrange sequence | timeline model | 10 lanes scroll | ready |
| timeline-place-move | arrange sequence | timeline model | drag source and clip | ready |
| timeline-split | cut and export | edit workflow | mid split, edge noop | ready |
| timeline-delete | arrange sequence | edit workflow | delete plus undo | ready |
| timeline-snapping | arrange sequence | timeline view plus edit workflow | on snaps, off free | ready |
| timeline-trim | arrange sequence | timeline model plus edit workflow | both ends, offsets, source bounds, snapping and undo | ready |
| timeline-autofill | arrange sequence | edit workflow | delete closes gap when on | ready |
| timeline-volume | arrange sequence | audio engine | mute and half level | ready |
| timeline-multiselect | arrange sequence | selection state plus timeline view | marquee and ctrl click | ready |
| timeline-group-drag | arrange sequence | edit workflow | group moves together | ready |
| timeline-zoom-scroll | arrange sequence | timeline view | zoom out and in | ready |
| playback-24fps | cut and export | playback engine | 24 fps advance, frame step | ready |
| edit-undo-redo | arrange sequence | history workflow | undo move, redo move | ready |
| edit-copy-paste | arrange sequence | history workflow | copy paste two clips | ready |
| export-mp4 | cut and export | export workflow | mp4 plays, empty blocks | ready, pending encoder proof |
