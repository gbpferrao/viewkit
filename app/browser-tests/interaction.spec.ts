import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
const fixture = resolve('../dev/plans/evidence/p01/source-a.mp4');

test('marquee, group moves, cancellation, snapping and lane scrolling', async ({ page }) => {
  await page.goto('/'); await page.getByTestId('media-input').setInputFiles(fixture);
  await expect(page.locator('[data-source-id]')).toHaveCount(1);
  for (let index = 0; index < 3; index++) await page.getByTitle('add to timeline at playhead').click();
  const first = page.locator('[data-clip-id]').first(), second = page.locator('[data-clip-id]').nth(1);
  let firstBox = (await first.boundingBox())!, secondBox = (await second.boundingBox())!;
  // Start the marquee in empty track space and extend across all overlapping subrows.
  await page.mouse.move(firstBox.x + firstBox.width + 40, firstBox.y + 5); await page.mouse.down();
  await page.mouse.move(firstBox.x + 20, secondBox.y + 95, { steps: 8 }); await page.mouse.up();
  await expect(page.locator('.clip.selected')).toHaveCount(3);
  const positions = await page.locator('[data-clip-id]').evaluateAll(elements => elements.map(element => parseFloat((element as HTMLElement).style.left)));
  firstBox = (await first.boundingBox())!;
  await page.mouse.move(firstBox.x + 70, firstBox.y + 15); await page.mouse.down();
  await page.mouse.move(firstBox.x + 140, firstBox.y + 15, { steps: 8 }); await page.mouse.up();
  const moved = await page.locator('[data-clip-id]').evaluateAll(elements => elements.map(element => parseFloat((element as HTMLElement).style.left)));
  expect(moved.map((value, index) => Math.round(value - positions[index]))).toEqual([70, 70, 70]);
  await page.keyboard.press('Control+z');
  firstBox = (await first.boundingBox())!;
  await page.mouse.move(firstBox.x + 60, firstBox.y + 15); await page.mouse.down();
  await page.mouse.move(firstBox.x + 130, firstBox.y + 15, { steps: 6 }); await page.keyboard.press('Escape'); await page.mouse.up();
  const cancelled = await page.locator('[data-clip-id]').evaluateAll(elements => elements.map(element => parseFloat((element as HTMLElement).style.left)));
  expect(cancelled).toEqual(positions);
  const snap = page.getByRole('button', { name: 'snap', exact: false });
  await snap.click(); await expect(snap).toHaveAttribute('aria-pressed', 'false');
  await snap.click(); await expect(snap).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('horizontal zoom').fill('300');
  await page.getByLabel('vertical zoom').fill('65');
  await page.locator('.timeline-scroll').evaluate(element => element.scrollTop = element.scrollHeight);
  await expect(page.locator('[data-lane="9"]')).toBeInViewport();
  await page.reload(); await expect(page.locator('[data-source-id]')).toHaveCount(0);
});

test('audio-only preview, unsupported decode, and export cancellation preserve the project', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByTestId('media-input').setInputFiles({ name: 'broken.mp4', mimeType: 'video/mp4', buffer: Buffer.from('malformed media') });
  await expect(page.getByRole('status').first()).toContainText('cannot decode');
  await page.getByTestId('media-input').setInputFiles(resolve('../dev/plans/evidence/p06/audio.wav'));
  await expect(page.locator('[data-source-id]')).toHaveCount(1);
  await page.getByTitle('add to timeline at playhead').click();
  await expect(page.locator('.inspector-panel')).toContainText('audio clips have no stage transform');
  await page.getByLabel('volume value', { exact: true }).fill('0'); await page.getByLabel('volume value', { exact: true }).press('Enter');
  await page.getByRole('button', { name: 'play', exact: true }).click(); await page.waitForTimeout(350);
  await page.getByRole('button', { name: 'pause', exact: true }).click();
  await page.getByRole('button', { name: 'export mp4' }).click();
  await page.getByRole('button', { name: 'cancel export' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0); await expect(page.locator('[data-clip-id]')).toHaveCount(1);
  await page.getByRole('button', { name: 'export mp4' }).click();
  await page.getByRole('button', { name: 'cancel export' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('two HD clips remain synchronized and timeline gestures stay responsive', async ({ page }, info) => {
  await page.goto('/'); await page.getByTestId('media-input').setInputFiles(resolve('../dev/plans/evidence/p06/hd.mp4'));
  await expect(page.locator('[data-source-id]')).toHaveCount(1);
  await page.getByTitle('add to timeline at playhead').click(); await page.getByTitle('add to timeline at playhead').click();
  await page.getByRole('button', { name: 'play', exact: true }).click();
  await page.waitForTimeout(500);
  const measurements = await page.evaluate(async () => {
    const drift: number[] = [], frames: { dropped: number; total: number }[] = [];
    const started = performance.now();
    await new Promise<void>(resolve => {
      function sample() {
        const parts = document.querySelector('.timecode')!.textContent!.split(':').map(Number);
        const time = parts[0] * 3600 + parts[1] * 60 + parts[2] + parts[3] / 24;
        for (const video of document.querySelectorAll<HTMLVideoElement>('.stage-video')) drift.push(Math.abs(video.currentTime - time) * 24);
        if (performance.now() - started < 3000) requestAnimationFrame(sample); else resolve();
      }
      requestAnimationFrame(sample);
    });
    for (const video of document.querySelectorAll<HTMLVideoElement>('.stage-video')) {
      const quality = video.getVideoPlaybackQuality(); frames.push({ dropped: quality.droppedVideoFrames, total: quality.totalVideoFrames });
    }
    return { samples: drift.length, maxDriftFrames: Math.max(...drift), overTwoFrames: drift.filter(value => value > 2).length, frames };
  });
  await page.getByRole('button', { name: 'pause', exact: true }).click();
  const first = page.locator('[data-clip-id]').first(), box = (await first.boundingBox())!;
  await page.evaluate(() => {
    (window as any).__latencies = [];
    document.addEventListener('pointermove', () => { const start = performance.now(); requestAnimationFrame(() => (window as any).__latencies.push(performance.now() - start)); });
  });
  await page.mouse.move(box.x + 80, box.y + 15); await page.mouse.down();
  await page.mouse.move(box.x + 200, box.y + 15, { steps: 20 }); await page.mouse.up();
  await page.waitForTimeout(60);
  const latency = await page.evaluate(() => Math.max(...(window as any).__latencies));
  await writeFile(resolve('../dev/plans/evidence/p06/' + info.project.name + '-performance.json'), JSON.stringify({ browser: info.project.name, logicalCores: await page.evaluate(() => navigator.hardwareConcurrency), fixture: 'two 1920x1080 24fps clips', observedSeconds: 3, ...measurements, maxGestureFrameMs: latency }, null, 2));
  expect(measurements.samples).toBeGreaterThan(30); expect(measurements.overTwoFrames / measurements.samples).toBeLessThan(0.05); expect(latency).toBeLessThan(50);
});
