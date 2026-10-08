# viewkit

A local video and audio slicer. Import files, arrange ten lanes, trim or split, transform video on the stage, and export one mp4.

## run

From this project directory:

```powershell
cd app
npm ci
npm run dev
```

Open http://127.0.0.1:5173. The default stage is 1280x720 and the timeline runs at 24 fps.

## edit

- drag media to a lane or double-click to place it at the playhead.
- move clips freely; overlaps are allowed. Drag either end to trim.
- enable snap to align ends to other ends or the playhead.
- marquee-select, ctrl-click to add, and drag a selection together.
- use the inspector or stage handles for transform and volume.
- space plays; arrows step frames; S splits; delete removes.
- ctrl Z/Y undo/redo; ctrl C/V copy/paste.
- new project resets the project and its saved media after confirmation. Reload restores the single project from browser-local IndexedDB.

## build and checks

```powershell
npm run build
npm run test
```

Serve app/dist/ locally for production, including its codec/ directory.

Browser tests use installed Windows Chrome/Edge and a running local server.
Generate fixtures with ffmpeg using `node scripts/prepare-fixtures.mjs`, then run `npm run test:browser`.
The five-second source fixture is described in docs/operations/run-local.md.

Evidence and phase records: dev/plans/. No AGENTS.md belongs inside this project.

