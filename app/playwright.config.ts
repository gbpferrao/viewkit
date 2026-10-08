import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './browser-tests', timeout: 180000, expect: { timeout: 10000 }, workers: 1,
  outputDir: '../dev/plans/evidence/p06/test-results',
  reporter: [['list'], ['json', { outputFile: '../dev/plans/evidence/p06/browser-results.json' }]],
  use: { baseURL: process.env.VIEWKIT_TEST_URL || 'http://127.0.0.1:5173', headless: true, viewport: { width: 1440, height: 960 }, trace: 'retain-on-failure' },
  projects: [
    { name: 'chrome', use: { launchOptions: { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' } } },
    { name: 'edge', use: { launchOptions: { executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' } } }
  ]
});
