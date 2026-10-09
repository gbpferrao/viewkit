# stage edit contract v1

Executable authority: app/src/stage/stage-size.model.ts and stage-layout.workflow.ts.

Initial and reset dimensions are 1280x720. Dimensions are integers within width 320–3840 and height 240–2160.
the stage row offers width/height swapping and a session aspect ratio lock. swapping is disabled when reversed dimensions exceed limits.
locking captures the current ratio. editing either dimension resizes both, bounded to valid dimensions before whole-pixel rounding.
presets and swapping establish a new locked ratio. new project clears the lock; undo restores dimensions without changing this session preference.
presets cover 16:9, 9:16, 1:1, 4:5, 4:3, 3:2, and 21:9 at named output sizes.
lower-resolution landscape presets include 360p (640×360) and 480p (854×480, rounded to an even width for video encoding).
Invalid or out-of-range input preserves the prior stage and shows feedback. No silent clamping changes invalid committed input.

Video world dimensions retain source aspect ratio using a fixed 1280x720 reference fit. Changing output stage dimensions changes the crop and presentation fit, not the video's world dimensions or transform scale. Transform positions remain pixel offsets from stage center. DOM preview, GPU preview, selection geometry, and both export paths use the same stable world-size calculation.
Scale x/y range is 0.05–10. Rotation is degrees wrapped to [-180,180). Position may extend outside stage.
The viewport only scales presentation; source dimensions, stage dimensions and transforms stay authoritative for export. Transform handles are laid out directly in display coordinates: corner squares remain 18 px, rotation controls 40 px, and rotation stems 36 px regardless of preview scale. Selection strokes remain constant display-pixel widths.

Lower lane indices composite above higher indices. Higher clip order composites above lower clip order within a lane; new clips initially receive the highest order, and vertical overlap-row dragging can reorder them.
All overlapping clips remain independently selectable in timeline subrows.

Stage selection outlines include every selected video, including clips outside the current time. Each outline follows its fitted dimensions, scales, rotation, and live transform draft. Active individual edges are solid where exposed and dashed only where covered by an active video higher in the compositing order; intersection calculations use transformed rectangles, not pixel alpha. Inactive video boxes are faint and dotted, and a stage status cue counts selected clips outside playhead time. Audio has no spatial box and is identified by a status cue.

Two or more selected videos also show an axis-aligned shared bounds box around all selected video corners, with 6 display pixels of padding so it does not hide individual edges. Shared bounds are brighter than individual outlines; if all selected videos are inactive, the shared box is dotted and faint. Single active video selections retain move, scale, and rotation handles. Multiselection outlines are informational; existing batch inspector edits remain available, and no first-object transform handles appear for a group.

The stage viewport isolates stacking: rendered media at 0 (GPU overlay and empty placeholder local to its screen), selection outlines and handles at 2, status cues at 3, transport at 12. Selection SVG strokes retain display-pixel thickness and never intercept pointers. Outline geometry is recomputed on selected transforms, stage dimensions, or active layer membership, rather than decoding video pixels for each playback frame.

Stage transform drafts update both video and handles during a gesture through a reactive draft clip identity and transform. Pointer moves are coalesced per animation frame; release applies the final position before one validated history commit. Pointer capture retains the drag outside its initial handle. Escape, pointer cancellation, blur, selection changes, project reset, or playhead changes discard the draft. Autosave and export read committed transforms only.
Audio-only clips show faded disabled transform fields. Numeric edits use the same stage workflow.

the inspector separates the stage dimensions row from selected object properties through stage and objects tabs. changing width or height commits directly; size presets set both dimensions in one history entry. the stage tab has no output summary or apply button.
volume is shared by video and audio clips; an edit sets it across the whole selection.
video transform fields are editable only when every selected object is video.
mixed video/audio and audio-only selections show video transforms faded and natively disabled.
bulk transform edits patch only the changed property, validate every resulting transform, and commit one history entry atomically.
reset applies the default transform to all selected videos in one commit. differing shared values display as mixed.

