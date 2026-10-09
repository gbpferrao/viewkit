# local operations

## environment

Verified on Windows with node 22.4.1, npm 10 for dependency installation, Chrome 154.0.8037.98 and Edge 154.0.4258.62.
Machine: Intel Core i5-8250U, eight logical cores, 8 GiB RAM. This is verification context, not a minimum hardware guarantee.

## install and run

From viewkit/app/, run `npm ci` and `npm run dev`. Use http://127.0.0.1:5173.
Installation runs scripts/prepare-codec.mjs, copying pinned ffmpeg core assets from node_modules to public/codec/.
The editor serves only on loopback by default. It requires no backend, account, environment key or network media service.

## production

Run `npm run build`. Typechecking runs before Vite.
app/dist/ owns the resulting bundle, worker and local codec assets. Keep codec/ alongside index.html.
Run `npx vite preview --host 127.0.0.1 --port 5174 --strictPort` for local production preview.
Serve at the root of the local origin. No build/ mirror is required.

## verification

- `npm run test`: timeline invariants, group atomicity, trimming, splitting, snapping, autofill, history and paste regressions.
- `npm run test:browser`: installed Chrome and Edge; default server URL 5173.
- set VIEWKIT_TEST_URL to http://127.0.0.1:5174 to exercise the built bundle.
- `npm audit`: all installed dependency advisories.
- `node scripts/prove-export.mjs`: initial wasm export proof.
- `node scripts/prove-edge-cases.mjs`: exact odd dimensions, audio-only output and silent gap.
- `node scripts/inspect-output.mjs`: native ffprobe metadata and measured gain/silence checks.

Generate fixtures with local ffmpeg. First create dev/plans/evidence/p01/ and run this from the project root:

```text
ffmpeg -hide_banner -y -f lavfi -i testsrc2=size=640x360:rate=24 -f lavfi -i sine=frequency=440:sample_rate=48000 -t 5 -c:v libx264 -pix_fmt yuv420p -c:a aac dev/plans/evidence/p01/source-a.mp4
```

Then run scripts/prepare-fixtures.mjs from app/ for HD and audio sources.
Verification scripts generate their own reports under dev/plans/evidence/. ffmpeg is a verification tool, not an application runtime dependency.

## privacy, resources and failure recovery

Imported files have browser-local IndexedDB copies and session object URLs. The current project restores after reload at the same origin. New project clears saved media and metadata. No uploads or telemetry exist. Browser site-data clearing removes the saved project; quota or storage failures show a footer message. Selection, playback, undo history, and navigation remain session-only.
icons load a pinned bootstrap icons stylesheet and font from cdn.jsdelivr.net, as requested by the user.
these requests contain no project media. first-load icons require network access; editing and encoding remain local.
prior zero-outbound-request evidence predates this icon change; future network checks must allow these static icon assets.
New project cancels pending probes/rendering, terminates workers, resets state/history, clears saved media and revokes URLs. Reload restores the saved project.
Unsupported codecs show a reason; use a format your browser decodes. Decoder or export failure preserves committed edits.
Large files are best effort and may exhaust available memory. The 512 MiB warning does not reject files.
Export first attempts native WebCodecs in a worker, with WebGPU composition and Canvas 2D fallback. Native input bytes remain blobs. Unsupported projects retry through FFmpeg wasm, which copies media into its worker filesystem and can take longer than the sequence duration. Cancel discards incomplete output. WebGPU requires a secure context (localhost qualifies); hardware codecs depend on browser, driver, and device. No speed multiplier is verified for this implementation.

## dependencies

Exact versions are in app/package.json and app/package-lock.json. Do not replace local codec assets with CDN URLs.
See third-party-notices.md for runtime licenses and upstream source.

