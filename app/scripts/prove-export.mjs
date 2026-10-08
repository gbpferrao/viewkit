import { chromium } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const evidence = new URL('../../dev/plans/evidence/p01/', import.meta.url);
await mkdir(evidence, { recursive: true });
const fixture = await readFile(new URL('source-a.mp4', evidence));
for (const [name, executablePath] of [
  ['chrome', 'C:/Program Files/Google/Chrome/Application/chrome.exe'],
  ['edge', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']
]) {
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage();
  await page.route('**/src/main.ts', route => route.fulfill({ body: '' }));
  await page.route('**/fixture.mp4', route => route.fulfill({ contentType: 'video/mp4', body: fixture }));
  await page.goto('http://127.0.0.1:5173');
  const result = await page.evaluate(async () => {
    const { encodeMp4 } = await import('/src/export/mp4-encode.adapter.ts');
    const bytes = await (await fetch('/fixture.mp4')).arrayBuffer();
    const source = { id: 'fixture', name: 'fixture.mp4', kind: 'video', file: new File([bytes], 'fixture.mp4'), url: '', duration: 5, width: 640, height: 360 };
    const transform = { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 };
    const snapshot = { stage: { width: 1280, height: 720 }, clips: [
      { id: 'left', sourceId: 'fixture', start: 0, duration: 2, offset: 1, lane: 1, volume: 50, order: 1, transform },
      { id: 'right', sourceId: 'fixture', start: 1, duration: 4, offset: 0, lane: 0, volume: 0, order: 2, transform: { ...transform, x: 160, scaleX: 0.5, scaleY: 0.5, rotation: 30 } }
    ] };
    const blob = await encodeMp4(snapshot, [source], new AbortController().signal, () => {});
    const encoded = await new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(blob); });
    const media = document.createElement('video'); media.src = URL.createObjectURL(blob);
    await new Promise((resolve, reject) => { media.onloadeddata = resolve; media.onerror = () => reject(new Error('browser could not decode exported mp4')); });
    const metadata = { duration: media.duration, width: media.videoWidth, height: media.videoHeight };
    URL.revokeObjectURL(media.src);
    return { encoded, metadata };
  });
  await writeFile(new URL(name + '-proof.mp4', evidence), Buffer.from(result.encoded.split(',')[1], 'base64'));
  await writeFile(new URL(name + '-proof.json', evidence), JSON.stringify({ browser: browser.version(), ...result.metadata }, null, 2));
  console.log(name, result.metadata);
  await browser.close();
}
