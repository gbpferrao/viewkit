# playback contract v1

Executable authority: app/src/playback/playback-engine.resource.ts, audio-gain.adapter.ts and stage/preview-stage.state.ts.

One playhead quantizes to 24 fps. Seek clamps to [0,timeline end]. Frame steps move exactly 1/24 second.
An active interval is start-inclusive and end-exclusive. Gaps display black and produce silence. End pauses.
All active intervals render in the stage contract order and mix gain independently, including same-lane overlap.

Each media node follows source offset plus timeline-relative time. Decode/seek stalls pause clock advancement and show buffering.
After readiness returns, the clock resets its origin without jumping ahead. Isolated media failure shows feedback and retains project data.

Gain maps integer 0–100 to Web Audio gain 0–1. It affects audio and video clips; muted clips remain on the timeline.
Media nodes and gain connections are detached on interval exit, source teardown, clear or unmount.
Composition owns reset ordering. There is no persistence or shared mutable export clock.

