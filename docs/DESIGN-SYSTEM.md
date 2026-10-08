# viewkit design system

## purpose and ownership

this document defines reusable interface controls, their visual geometry, and their interaction rules.
the design favors a compact desktop editor with stable layouts, aligned icons, and clear action hierarchy.

implementation owners:

- `app/src/interface/action-button.view.vue`: native button wrapper, variants, sizes, shapes, and attribute forwarding.
- `app/src/interface/interface-icon.view.vue`: decorative icon wrapper and consistent icon geometry.
- `app/src/interface/design-system.css`: shared tokens, alignment, button states, and playback composition.
- feature views: action callbacks, labels, disabled conditions, selection state, and placement.
- `app/src/editor.css`: editor surfaces, layout, and feature-specific geometry.

shared styles load after editor styles. button geometry belongs to the design system; feature styles should not redefine its padding or alignment.
these components are implemented across the header, media bin, timeline, inspector, dialogs, and stage controls.
clip scale handles remain native gesture targets with their existing geometry.
visual acceptance has not been checked in a browser for this revision.

## grayscale palette and header

all interface surfaces, borders, icons, states, and clip decorations use neutral grayscale values. media content retains its source colors.
the base background is #0b0b0b, header #0e0e0e, and button surface #181818.
the stage surround is solid #0c0c0c, slightly darker than the #111111 side panels and #101010 timeline.
primary accents are #ffffff; primary labels are #131313. general text is #d7d7d7.
selected clips, stage handles, and playhead use white highlights. controls do not draw interaction focus outlines; keyboard focus uses subtle gray borders or existing fills. the custom timeline clip selection outline remains. unavailable controls retain reduced opacity.
timeline clips retain a 1 px layout border in every selection state. the thicker selected edge uses an inset shadow and outer glow, so names, icons, timestamps, textures, and trim targets never shift when selection changes.
destructive actions use an explicit label and confirmation rather than a color cue.

header order: hamburger, wordmark placeholder, editable project name, undo, redo, export, and question-mark help.
the plain viewkit wordmark reserves a slot for a future wordmark.webp image; no missing image is requested by the browser.
the hamburger opens a main menu containing only new project. outside input and escape close it, and keyboard navigation focuses its action.
new project opens the existing irreversible-clear confirmation; accepting resets the project and its name.
the editable name commits on blur or enter; escape restores the existing name. blank names become untitled project.
names are trimmed, limited to 80 characters, and saved in browser storage independently of clip/stage history.
the help button uses a literal question mark with an accessible help label and opens the shortcuts dialog.

## reusable components

| component | purpose | agreement |
|---|---|---|
| action button | perform one action | native `button`, default `type="button"`, slot content, forwarded events and attributes |
| interface icon | present a recognizable symbol | `name` selects a bootstrap icon; wrapper fixes geometry; decorative content is hidden from assistive technology |
| toggle button | enable a persistent option | action button with `variant="toggle"` and `aria-pressed`; state belongs to the feature |
| playback button | play, pause, step, or jump | action button with `shape="circle"`; play/pause uses the large size |
| button group | arrange related actions | feature composition with equal alignment and consistent gaps; does not own application state |
| floating transport | expose playback over video | centered control group, independent side columns, scrubber, visibility rules, and accessible focus |

toggle, playback, group, and transport are compositions of the two shared components.
they do not introduce additional stores or copies of playback state.

### action button variants

| variant | use | appearance |
|---|---|---|
| primary | export or the main dialog action | white surface, dark label, weight 600 |
| secondary | apply, cancel, or ordinary actions | dark surface, subtle border, light label, weight 500 |
| quiet | utility actions and playback stepping | transparent surface; background appears on hover |
| danger | confirmed destructive action | stronger neutral border and explicit action label |
| toggle | snap and autofill | quiet when off; white border and subtle white fill when on |

use one visually dominant primary action per local group.
reserve danger styling for the action that executes removal. opening a confirmation can remain quiet.
show labels for actions whose meaning is difficult to infer from an icon.

### dimensions and spacing

| token or geometry | value | use |
|---|---|---|
| compact height | 28 px | timeline actions, add buttons |
| regular height | 32 px | header, inspector, dialogs, play/pause |
| large height | 40 px | stage rotation |
| touch height | at least 44 px | coarse pointer devices |
| rectangle radius | 6 px | text actions |
| circle radius | 50% | playback and rotation |
| rectangle horizontal padding | 12 px; compact 8 px | space around content |
| icon and text gap | 8 px | both leading and trailing icons |
| standard icon | 16 px | text buttons and small icon buttons |
| prominent icon | 22 px | play/pause and rotation |
| playback group gap | 6 px | spacing between circular controls |
| keyboard focus | subtle gray border or existing fill; no outline | focused controls |

square and circular buttons have equal width and height, zero padding, and no internal gap.
text buttons center their entire content group, including the icon and label.
button labels stay on one line.
use the same size for neighboring actions unless one action deserves stronger emphasis.

## icons and alignment

icons use bootstrap icons 1.13.1, loaded from the pinned jsdelivr stylesheet in `app/index.html`.
the stylesheet and font require network access on first load. media remains local.

alignment rules:

1. buttons use `inline-flex`, `align-items: center`, and `justify-content: center`.
2. icon wrappers have equal width and height, a line height of 1, and no shrinking.
3. the font glyph uses a block box with no baseline offset, margin, or padding.
4. button content uses `gap`; individual icons do not supply spacing through margins.
5. text, leading icons, trailing icons, and keyboard hints share one vertical centerline.
6. preserve each symbol's aspect ratio and original stroke or fill treatment.

avoid text symbols as replacements for action icons.
use outline icons for general utilities and filled icons for transport controls.
font weight affects labels; it must not be used to artificially thicken icon glyphs.

### visual centering of play and pause

play and pause occupy the same 32 px circular button and use the same 18 px icon box.
the play triangle receives a 1 px shift to the right to balance its visual mass.
pause receives no shift because its bars are symmetric.
change the icon and accessible label together without changing the button's size or position.
frame and jump controls remain geometrically centered in 28 px circles.

### icon meanings

| action | icon name |
|---|---|
| play / pause | `play-fill` / `pause-fill` |
| jump to start / end | `skip-start-fill` / `skip-end-fill` |
| previous / next frame | `caret-left-fill` / `caret-right-fill` |
| import / add | `plus-lg` |
| undo / redo | `arrow-counterclockwise` / `arrow-clockwise` |
| split | `scissors` |
| delete / clear | `trash3` |
| snap | `magnet` |
| autofill gaps | `distribute-horizontal` |
| export | `box-arrow-up-right` |
| keyboard shortcuts | `keyboard` |
| rotate | `arrow-clockwise` |

## property inspector tabs

### reusable number input

`app/src/interface/number-input.view.vue` owns every stage and object numeric field. native browser spinner decorations are suppressed; the editable numeric input retains its accessible label and native number semantics.

- dark surface, 1 px neutral border, 6 px radius, and 32 px desktop height.
- custom up/down chevrons sit vertically centered in two equal buttons in an 18 px trailing column. icons use the shared CDN icon component at 9 px.
- hover gives the active arrow a subtle white fill and brighter icon. keyboard focus changes the whole numeric control's existing border to gray without an outline.
- arrows and keyboard up/down use the field's configured step, clamp at its bounds, and commit one change. typing commits on blur or enter; escape restores the current value. incomplete numbers reset on blur.
- object transforms use at most two decimals; stage dimensions and volume use whole numbers. feature workflows retain validation authority and can reject typed values.
- mixed fields remain blank with a mixed placeholder. stepping uses a zero starting value constrained to the field's bounds.
- disabled fields and their buttons inherit native fieldset disabling. they cannot emit changes; parent rows own fading.
- buttons have increase/decrease labels; the input is the normal tab stop and supports arrow-key stepping. touch controls use a 44 px height and wider 28 px arrow column.

the component emits numeric values and owns presentation and stepping; it does not edit project state directly.

### tabs and availability

the right panel has stage and objects tabs with selected styling and keyboard focus using a subtle gray border.
arrow keys switch tabs; home and end select the first and last tab. panels are associated through aria-controls and aria-labelledby.
selecting objects opens their tab; clearing the selection returns to stage. either tab remains manually accessible.

the stage tab contains one compact row: width, ×, height, swap, ratio lock, and presets. icon buttons are 24 px and centered with the inputs. the lock uses the shared pressed toggle style; unavailable swaps fade. number changes commit on blur/enter or stepping. a locked edit resizes both dimensions within output limits. presets and swaps commit one undo entry and update the locked ratio. presets cover 16:9, 9:16, 1:1, 4:5, 4:3, 3:2, and 21:9. the dropdown uses radio menu items, current-size highlighting, arrow/home/end navigation, and escape/outside dismissal.
objects order: shared volume, then video position, scale, and rotation. no selection identity, type counts, selection summary, or tab count repeats the selection already visible in the timeline and stage.
the volume slider previews gain across the selection; release commits one edit. selection changes cancel pending gain previews.
the numeric volume field applies the same absolute percentage to every selected object.

| selected types | volume | video transforms |
|---|---|---|
| no objects | visible, faded, disabled | visible, faded, disabled |
| audio only | editable across all selected objects | visible, faded, disabled |
| video only | editable across all selected objects | editable across all selected objects |
| video and audio | editable across all selected objects | visible, faded, disabled |

capability sharing determines availability; differing values do not disable a shared property.
faded, disabled controls communicate unavailable properties without warning paragraphs.
all object tweaks remain mounted in their fixed sequence. each compact row aligns a 16 px icon with its controls: volume slider and numeric percentage, position x/y numbers, scale x/y numbers, then rotation degrees. icon tooltips and explicit input labels identify the controls. unavailable rows fade and use native disabled fields; they do not disappear or accept edits.
fields with differing values show a mixed placeholder. changing one field updates that property only, preserving each object's other values.
position, scale, and rotation fields display at most two decimals without trailing zero padding. manually entered values round to two decimals on commit; stage gestures retain internal precision. volume percentages and stage dimensions remain whole numbers.
stage move, scale, and rotation gestures preview the video and handles live through a reactive draft, updating once per animation frame. release commits one undo step; escape, canceled pointer input, or blur restores the committed appearance. uncommitted drafts are not autosaved.
the mixed volume slider uses the selection average as its initial thumb position and explicitly labels the state mixed.
disabled transform fields use a native disabled fieldset and reduced opacity; reset is also disabled.
batch transforms and reset produce a single undo step. unsupported selections are rejected at the workflow boundary as well.

## empty media panel

each media card aligns its truncating name with a compact circular … menu. the menu contains add to timeline, rename, and delete media, supports arrow keys, home/end, escape, and outside dismissal. add to timeline uses a film icon and inserts at the current playhead in lane 1; the preview has no separate add button. double-clicking the preview also places media; double-clicking the name opens an inline input in the same row, with enter/blur to commit and escape to cancel. deleting removes the source and its timeline clips. the name is display metadata, independent of the underlying file name.

dragging imported media over a timeline lane shows a 55% opacity clip ghost with a dashed outline, source label, duration, and ordinary video frame previews. it follows the snapped start and resulting overlap row. the ghost ignores pointer input, is hidden from accessibility navigation, and never enters selection, history, storage, stage playback, or project bounds. drop recomputes the final position and commits one placement; leaving the timeline or ending the drag removes the preview.

an empty media panel contains one muted, noninteractive state label: "no media yet".
it has no promotional heading, illustration, card border, file-type list, or additional import button.
the header + opens file import and is disabled while importing. external local files can also be dropped anywhere in the media panel through the same import queue and validation. while files hover over the panel, a restrained dashed boundary and drop to import label indicate the target; neither intercepts pointer input. the highlight clears on exit, drop, drag end, or window blur. existing media drags are not reimported, and file drops elsewhere do not import. existing sources can still be dragged onto timeline lanes or added through their options menu.
the media panel has no instructional footnote. import and placement guidance lives in the header ? help dialog, alongside timeline navigation, selection, trimming, reordering, split, stage controls, browser saving, export, new project, and keyboard shortcuts. help uses compact topic sections and action/description rows in a scrollable body, with its close action always visible.

## timeline overlay scroll and zoom

overlapping clips occupy internal rows in compositing order: upper rows take priority. dragging vertically inside a main lane moves the selection above or below another row's clip, with live row preview. disjoint clips may share a row. moving across the main lane boundary changes lanes as before. reorder preserves relative selection order and commits one undo step on release; escape restores the previous arrangement.

scrollbar controls never draw a focus outline. keyboard focus uses a subtle fill and full bar opacity; pointer dragging retains only the existing thumb and round endpoint highlights.

the timeline's top divider resizes only from the first 48 px of its 1 px separation stroke at the far-left corner. the remainder is decorative and does not intercept input; no expanded hit area overlaps the ruler or top scrollbar. drag upward to grow the timeline, downward to shrink it. height is 180–600 px while reserving 260 px for the stage row; small windows reduce both limits to fit available space. arrow up/down adjust by 10 px (shift: 40 px); home/end reach the bounds; double-click restores the 36% default. escape or canceled dragging restores the previous height. pointer moves are coalesced per frame, and window resizing clamps the visible height. this layout preference is session-only.

clicking or dragging the time ruler scrubs the playhead without changing selection. the playhead head supports the same drag. marquee selection starts only in the lane area and stays below the ruler when dragged upward; ruler scrollbar and menu controls retain their own gestures.

timeline navigation uses one reusable zoom-scrollbar view for both axes, leaving native wheel and trackpad scrolling available.
middle-button dragging pans horizontally and vertically without changing clips, selection, playback position, or history.
normal wheel input scrolls vertically; horizontal trackpad deltas also pan horizontally.
ctrl + wheel changes horizontal zoom around the pointer's time position, keeping it fixed under the cursor subject to scroll bounds.
wheel scroll, middle-button pan, and menu zoom ease toward accumulated targets on animation frames rather than jumping per input event. smoothing uses elapsed time, with a short 35 ms response while dragging and 65 ms otherwise. zoom interpolates proportionally and retains its pointer anchor through each frame. repeated wheel input adds to the pending target; finite scroll and zoom limits still apply. editing, scrollbar gestures, escape, blur, and teardown stop pending navigation. reduced-motion preferences apply targets immediately.
wheel deltas normalize pixel, line, and page units; zoom and middle-drag updates are coalesced per animation frame.
pointer capture keeps middle dragging active outside the timeline. escape, pointer cancellation, or window blur restores its starting view.
the vertical bar overlays the far left of lane labels. the horizontal bar overlays the upper part of the time ruler, above timestamps.
lane headers and the ruler corner own opaque bottom strokes across their full height. timeline tracks own separate separators; parent rows do not reserve a transparent border gap beneath sticky headers. timeline body guides cannot show through header separators.
native timeline scrollbars are hidden so they consume no extra row or column.
custom scrollbars draw only a 10 px bar, with no visible rail, positioned 2 px from the timeline's top or left edge. each endpoint is a slightly brighter 6 px circle centered 5 px from the bar end, leaving an even 2 px inset around it. handles have no separating lines. circular 22 px hit targets retain translucent white interaction highlights.
the dragged endpoint retains its highlight until release or cancellation, including when the pointer leaves its hit target.

drag the middle of a thumb to pan; click its track to center that location in the viewport.
drag either endpoint to resize the visible interval and change scale.
the opposite viewport edge stays anchored, subject to content bounds; vertical zoom preserves the anchored lane position as row heights change.
horizontal zoom is capped at 400 pixels per second; its minimum is at most 10 and decreases enough to frame the full project.
vertical zoom remains 26–70 pixels per clip row.
these controls change presentation only, leaving clip timing, selection, and edit history unchanged.

bars fade to 12% opacity away from their hit regions and show fully on hover, keyboard focus, or an active drag.
touch devices keep them visible at 80%; reduced-motion preferences disable the fade transition.
thumb bodies support arrows, page keys, home, and end for scrolling; endpoint controls support axis arrows for zooming.
escape or pointer cancellation restores the gesture's starting view. pointer capture retains dragging outside the bar.
pointer updates are coalesced to one animation frame, and release applies the final queued position.
the finite future-area calculation remains independent of scroll position.

## timeline options menu

a floating circular ellipsis button sits at the visible ruler's upper right, remaining anchored while the timeline scrolls.
the horizontal overlay scrollbar stops before its hit area.
the timeline has no header row; its ruler and lanes fill the panel. toggles, zoom, fit, and delete selection live in the ruler menu. undo and redo live in the app header; split lives at the bottom of the playhead line. the timeline section retains an accessible name.

menu order: snap, autofill gaps, separator, zoom +, zoom −, separator, fit to selection, fit to project.
snap and autofill use menuitemcheckbox buttons with aria-checked and visible switch indicators. toggles keep the menu open.
zoom actions change horizontal scale by a factor of 1.25 around the visible time center and remain open for repeated use.
fit to selection frames the earliest start through the latest end of selected clips, with horizontal padding, and reveals the first selected lane.
fit to project frames zero through the latest clip end and returns to the first lane.
fit actions close the menu; selection fit is disabled without selection, and project fit is disabled without clips.
both fit actions preserve clip geometry and the current vertical scale.

the menu closes on outside pointer input or escape. escape restores trigger focus; arrow keys, home, and end navigate available items.
the menu height is bounded by the timeline viewport and scrolls internally on shorter windows.
ruler steps follow a 1/2/5 sequence sized for roughly 70 px spacing, preserving readable labels and bounded DOM work at distant zoom levels.

## timeline active and future regions

the active region extends from zero through the latest clip end across every lane, including gaps within that duration.
it uses the normal timestamp contrast, a subtle white tint, and stronger vertical grid lines.
the exact end has a dashed vertical boundary and a timestamp label, separate from the playhead.
the future region continues the same grid rhythm and timestamps at lower contrast; it remains available for placement and dragging.
empty projects have no active region or end marker.
the navigable timeline has a 30-second baseline even when empty, giving the horizontal scrollbar a finite interval to pan and resize.
short projects retain that baseline; longer clips or live drafts extend it. it is presentation space, not exported silence or project duration.

the boundary follows the displayed move or trim draft once per animation frame, then follows committed state after release.
cancel restores the committed boundary. deletion, undo, redo, paste, import placement, and zoom derive it from current clips.
the active display boundary does not change export duration or commit a draft to the project.

future padding is 60% of the visible track duration, clamped to 2–10 seconds.
content width is the larger of the viewport track width and the greater of 30 seconds or clip extent plus future padding, rounded to pixels.
inward drags retain the committed scroll extent until release; their active boundary still shrinks immediately.
scroll position, ruler ticks, and the previous content width never determine the horizon, preventing scrolling from generating endless space.
long real clips can produce long timelines; only visible clips and timestamps render, with overscan.

## app status bar

one footer spans the entire editor beneath the timeline.
the left side shows exactly one tip based on hovered or focused controls, selection, playback, or project readiness.
import/export progress and decoder failures take precedence; recent project feedback temporarily replaces the tip for six seconds.
the right side shows selected count when applicable, clip count, duration, stage dimensions, and frame rate.
fixed lane count and memory labels are omitted. tips truncate with full text available through their title; metrics remain stable at the right.
the timeline has no separate status row, leaving more height for lanes.

## floating playback bar

the bar floats 12 px above the stage's bottom edge and occupies no layout row.
its width is capped at 440 px, with at least 12 px space from each stage edge.
the surface uses the app's dark fill, neutral border, 6 px radius, 6 px vertical padding, and restrained shadow. the desktop bar is about 52 px tall, with 32 px play/pause, 28 px stepping buttons, and a 2 px scrubber.

the transport row has three columns: flexible left, fixed center, and equally flexible right.
timecode sits left; playback controls sit center; the right column stays empty.
equal side columns keep play/pause centered independently of the timecode width.
the scrubber spans the bar below the transport row.
on coarse pointer devices, playback controls occupy their own row above timecode to preserve larger touch targets.
timecode uses tabular monospace digits so changing values do not move neighboring controls.

the bar appears within 24 px of its actual rectangle, using distance in both axes rather than a full-width stage strip. it fades beyond 36 px or when the pointer leaves the stage. the small difference between thresholds prevents flicker; opacity changes do not move its hit geometry. distance reads are coalesced per animation frame.
keyboard focus and active interaction preserve visibility, including dragging the scrubber outside the bar.
touch devices keep the bar visible. reduced-motion preferences disable its transition.
hidden controls ignore pointer input; keyboard focus reveals them.

## states and accessibility

export phases share one compact hierarchy: a 20 px heading, one muted status line, progress and metrics when running, then actions. the initial heading is export your video with one line stating the five-second ad requirement, a primary watch ad action, and quiet cancel. while playing, watching ad is the heading; one status line explains that export starts when the ad ends. a neutral 16:9 advertisement placeholder reserves the future ad placement, followed by progress, remaining seconds, percentage, and secondary cancel. user-facing copy uses final-app wording and does not label the simulation. no eyebrow or repeated explanatory paragraph appears. escape or cancel stops the ad or rendering; the current implementation remains a local timer with no third-party ad requests. the gate repeats for each export and is not saved with the project.

| state | behavior |
|---|---|
| default | steady geometry and readable label |
| hover | surface or border changes; no movement or resizing |
| pressed | darker or more saturated surface while activated |
| selected toggle | persistent tint and border, expressed through `aria-pressed` |
| keyboard focus | subtle gray border or fill; floating controls remain visible; no outline |
| disabled | native `disabled`, reduced opacity, no action |
| busy | feature prevents duplicate execution and reports progress through its existing status UI |

every icon-only action requires an `aria-label`. a tooltip alone is insufficient.
decorative icons use `aria-hidden`; the button supplies the action's meaning.
native buttons preserve keyboard activation through enter and space.
pass state through attributes rather than replacing buttons with clickable generic elements.
tooltips may show keyboard shortcuts but must not be the only way to discover an action.

## usage

```vue
<ActionButton variant="primary" @click="exportSequence">
  export mp4
  <InterfaceIcon name="box-arrow-up-right"/>
</ActionButton>

<ActionButton variant="quiet" shape="circle" size="large"
  :aria-label="playing ? 'pause' : 'play'" @click="togglePlayback">
  <InterfaceIcon :name="playing ? 'pause-fill' : 'play-fill'"/>
</ActionButton>

<ActionButton variant="toggle" size="compact"
  :aria-pressed="snapping" @click="toggleSnapping">
  <InterfaceIcon name="magnet"/>
  snap
</ActionButton>
```

the play/pause example receives the `play-button` feature class when placed in the transport.
that class applies the prominent surface and optical triangle adjustment.
feature views provide callbacks; reusable components never invoke timeline or export workflows directly.

## export rendering indicator

the export dialog uses the heading rendering your video, the current renderer phase, a progress bar, percentage, and current/total frame counts. counts use tabular numerals and come from the export snapshot; compatibility estimates use an ≈ prefix. overall percentage includes preparation and finalization, so completed frames may reach the total before the file is ready. progress transitions stop for reduced-motion preferences. progress has native progressbar semantics and phase text is a status announcement.

## stage selection bounds

video dimensions use a fixed 1280 by 720 reference fit in world coordinates; output stage resizing does not refit videos. the stage's preview fit scales only presentation. transform handles are positioned in display coordinates with fixed 18 px corner targets, a 40 px rotation button, and a 36 px stem, independent of stage dimensions and preview scale. outline strokes and shared-box padding also remain constant in display pixels.

single selected video outlines use a 1.5 px white stroke. multiselection uses quieter 1 px individual boxes and a bright 1.5 px shared axis-aligned box, padded by 6 display pixels to keep individual edges readable. individual boxes retain their rotation; stroke thickness stays constant as the stage preview scales.

covered edge segments use 5 px dashes and 4 px gaps at reduced opacity, calculated against higher active video rectangles. exposed segments stay solid. clips outside playhead time use faint 2 px dots with 5 px gaps, plus a small clock status cue; audio selections have a music cue and no spatial bounds. shared bounds include inactive selected videos and become dotted when none are active. geometry uses media rectangles, including any transparent pixels within them.

only a single active selected video exposes transform handles. shared bounds and individual multiselection boxes are decorative; batch transforms remain in the inspector. the isolated stage stack puts media below selection overlays, status cues above them, and transport above both. cues occupy opposite top corners so selection status and decoder status do not overlap.

## timeline video thumbnails

video clips show a linear frame strip behind their name and duration: 64 px thumbnails with 4 px gaps, sampled from the clip's source offset plus each tile's timeline position. images retain their aspect ratio inside a dark tile; a dark label background preserves readability. only visible tiles decode, using one silent decoder and a bounded 256-image cache. trimming and zooming update sample times; audio clips retain their waveform texture. thumbnails are decorative and cannot intercept editing gestures.

## playhead split action

the playhead's tip stays aligned with its time position in the ruler, including when lanes scroll vertically.
lane labels and the ruler corner cover the snap guide and marquee. the playhead line, head, and split overlay are clipped to the time area, starting after the 86 px label column; the line starts at the circular head's center, aligned to the same time coordinate, and continues to the timeline bottom without a gap. it cannot cross the label column, including gaps between virtualized lanes. split shifts inward near that boundary so its button stays readable without covering labels.
the tip is a 16 px white circle used for scrubbing. the split action sits at the bottom of the playhead line, 6 px above the timeline edge. hovering its 88 by 40 px bottom region reveals a white pill with black text and icon centered on the playhead; near the viewport edge the button shifts just enough to remain visible.
keyboard focus also reveals the action; touch devices show it without hovering.
the button is disabled unless the playhead lies strictly inside an eligible selected clip, or any clip when nothing is selected.
it uses the existing split workflow, keeping snap, selection, and undo behavior consistent with the S shortcut.
undo and redo are grouped in the main header.

## review criteria

- icon and text centers align in every variant, including trailing export icons.
- play and pause stay visually centered without a jump when switching state.
- playback buttons are circular and the central action aligns with the stage center.
- hover, focus, pressed, toggle, and disabled states retain their dimensions.
- header, timeline, and floating bar fit the supported desktop layout without growing the page width.
- keyboard users can reveal and activate floating controls.
- touch targets enlarge without overlapping neighboring controls.
- missing cdn icons do not remove text labels or accessible action names.
- stage transform handles retain their gesture geometry.

these criteria define future visual acceptance; they are not a record of executed checks.
