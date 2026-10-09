# timeline edit contract v1

lane names are project metadata, independent of clip editing history. default names are lane 1 through lane 10.
rename trims whitespace and control characters, limits names to 80 characters, and preserves the old name for empty input.
names persist in the existing browser project record; older records without names retain defaults. new project resets all names.
the frozen lane column displays plain names at its top left. double-click, enter, or F2 opens inline editing; enter/blur commits and escape cancels.
editing is available for every lane, including empty lanes. lane render caching includes its name, edit mode, and active name draft.

Executable authority: app/src/timeline/timeline.model.ts, edit-timeline.workflow.ts and shared/frame-math.contract.ts.

Time is seconds on an exact 24 fps grid. Lanes are 0–9. Clip duration is at least one frame; offset plus duration cannot exceed source duration.
Sources are immutable. Clip identifiers are unique. Same-lane and cross-lane overlaps are valid.

Placement and movement preserve duration. Group moves apply one time/lane delta, clamp the whole group at zero, and reject all members if any lane is invalid.
within the same lane, vertical dragging onto another overlap row reorders the selected clips before or after that row's nearest clip. highest clip order occupies the top available internal row and composites above lower order. nonoverlapping intervals may share a row. selected clips retain their relative stacking order; reorder and any concurrent time move commit together in one history entry. crossing a main lane boundary retains the existing lane move behavior. gesture hit testing uses starting lane geometry to avoid reorder feedback jitter; cancellation discards the draft. priorities persist in project snapshots and browser storage.
Start trimming changes offset and duration; end trimming changes duration. Bounds cannot exceed available source media.
Split copies gain and transform and produces a new right-hand identifier with adjusted offset.

Snap is magnetic alignment within eight display pixels to the playhead and clip ends. Moving either edge or trimming either end uses it.
Disabling snap preserves the mandatory frame grid. Snap does not prohibit overlap.

Autofill closes the union of newly vacated intervals on the affected lane, subtracting intervals still occupied by overlapping clips.
It leaves unrelated lanes and preexisting empty intervals unchanged.

Views own cancellable gesture drafts. Workflows commit a validated snapshot on release. History records one entry per gesture and at most 50 snapshots.
the timeline view derives its active shading boundary from the latest end in the displayed draft or committed clips.
its finite future padding and visual behavior are owned by docs/DESIGN-SYSTEM.md; they do not change project duration or mutation rules.
A new edit invalidates redo. Undo/redo selects changed or restored clips, not all unchanged clips.
Copy/paste preserves relative timing, gain, offsets and transforms; paste makes new identities and allows overlap.

