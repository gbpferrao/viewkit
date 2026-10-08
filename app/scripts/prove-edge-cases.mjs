import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
const evidence = new URL('../../dev/plans/evidence/p06/', import.meta.url);
const fixture = await readFile(new URL('audio.wav', evidence));
for (const [name, executablePath] of [
  ['chrome', 'C:/Program Files/Google/Chrome/Application/chrome.exe'],
  ['edge', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']
]) {
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage();
  await page.route('**/fixture.wav', route => route.fulfill({ contentType: 'audio/wav', body: fixture }));
  await page.goto('http://127.0.0.1:5173');
  const result = await page.evaluate(async () => {
    const { encodeMp4 } = await import('/src/export/mp4-encode.adapter.ts');
    const file = new File([await (await fetch('/fixture.wav')).arrayBuffer()], 'fixture.wav');
    const source = { id: 'audio', name: 'fixture.wav', kind: 'audio', file, url: '', duration: 5, width: 0, height: 0 };
    const snapshot = { stage: { width: 321, height: 241 }, clips: [{ id: 'one', sourceId: 'audio', start: 1, duration: 1, offset: 1, lane: 0, volume: 50, order: 1, transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 } }] };
    const blob = await encodeMp4(snapshot, [source], new AbortController().signal, () => {});
    const video = document.createElement('video'); video.src = URL.createObjectURL(blob);
    await new Promise((resolve, reject) => { video.onloadeddata = resolve; video.onerror = () => reject(new Error('odd-dimension mp4 did not decode')); });
    const metadata = { width: video.videoWidth, height: video.videoHeight, duration: video.duration };
    if (metadata.width !== 321 || metadata.height !== 241) throw new Error('stage dimensions changed during export: ' + JSON.stringify(metadata));
    const encoded = await new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(blob); });
    URL.revokeObjectURL(video.src);
    return { encoded, metadata };
  });
  await writeFile(new URL(name + '-odd-audio.mp4', evidence), Buffer.from(result.encoded.split(',')[1], 'base64'));
  await writeFile(new URL(name + '-odd-audio.json', evidence), JSON.stringify({ browser: browser.version(), ...result.metadata }, null, 2));
  console.log(name, result.metadata); await browser.close();
}
