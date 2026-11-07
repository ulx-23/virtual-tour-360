import assert from 'node:assert/strict';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import type { Server } from 'node:http';
import { chromium, type Browser, type Page } from 'playwright-core';
import AdmZip from 'adm-zip';
import { createExportFixture } from '../tests/helpers/export-fixture';
import { bundleStandaloneTour } from '../src/server/standalone/bundle';
import { convertStandaloneZipToHtml } from '../src/server/standalone/single-html';

const require = createRequire(import.meta.url);
const { createTourServer } = require('../src/server/templates/standalone/serve.cjs') as { createTourServer: (root: string) => Server };

async function run() {
  await fsp.mkdir('public/exports', { recursive: true });
  const root = await fsp.mkdtemp(path.resolve('public/exports/qa-offline-'));
  // Keep browser profiles and temporary files off the nearly-full C: drive.
  process.env.TEMP = root;
  process.env.TMP = root;
  const storage = path.join(root, 'storage');
  const tour = await createExportFixture(storage);
  const results: Array<Record<string, unknown>> = [];
  let server: Server | undefined;
  let browser: Browser | undefined;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
    const recorder = await browser.newPage();
    const video = await recorder.evaluate(async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 160; canvas.height = 90;
      document.body.appendChild(canvas);
      const context = canvas.getContext('2d')!;
      context.fillStyle = '#10b981'; context.fillRect(0, 0, 160, 90);
      const stream = canvas.captureStream(10);
      const media = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' });
      const chunks: Blob[] = [];
      media.ondataavailable = (event) => chunks.push(event.data);
      const complete = new Promise<number[]>((resolve) => {
        media.onstop = async () => resolve(Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer())));
      });
      media.start(100);
      for (let frame = 0; frame < 12; frame++) {
        context.fillStyle = frame % 2 ? '#4f46e5' : '#10b981'; context.fillRect(0, 0, 160, 90);
        await new Promise(requestAnimationFrame);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      media.stop();
      const bytes = await complete;
      stream.getTracks().forEach((track) => track.stop());
      return bytes;
    });
    assert.ok(video.length > 200, 'Fixture video tidak berisi frame');
    await fsp.writeFile(path.join(storage, 'clip.webm'), Buffer.from(video));
    await browser.close(); browser = undefined;
    tour.scenes[0].sourceHotspots.push({ id: 'video', type: 'VIDEO', yaw: 0, pitch: -0.3, label: 'Video lokal', contentJson: JSON.stringify({ url: '/clip.webm' }) });
    const zipPath = path.join(root, 'tour.zip');
    const { report } = await bundleStandaloneTour(tour, zipPath, { publicDir: storage });
    const buffer = await fsp.readFile(zipPath);
    const htmlPath = path.join(root, 'virtual-tour.html');
    await fsp.writeFile(htmlPath, convertStandaloneZipToHtml(buffer), { flag: 'wx' });
    const extracted = path.join(root, 'web');
    new AdmZip(buffer).extractAllTo(extracted, false);
    server = createTourServer(extracted);
    await new Promise<void>((resolve) => server!.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Server QA gagal');
    const origin = `http://127.0.0.1:${address.port}`;

    const exercise = async (page: Page) => {
      await page.waitForFunction(() => document.getElementById('sceneTitle')?.textContent === 'Ruang 1');
      await page.waitForFunction(() => {
        const canvas = document.querySelector<HTMLCanvasElement>('#pano canvas');
        return canvas && canvas.width > 0 && canvas.height > 0;
      });
      await page.locator('[data-hotspot-id="image"]').click();
      await page.waitForFunction(() => (document.querySelector('#infoModalMedia img') as HTMLImageElement)?.naturalWidth > 0);
      await page.locator('#infoModalClose').click();
      await page.locator('[data-hotspot-id="video"]').click();
      await page.waitForFunction(() => (document.querySelector('#infoModalMedia video') as HTMLVideoElement)?.readyState >= 1);
      await page.locator('#infoModalMedia video').evaluate((element) => (element as HTMLVideoElement).play());
      await page.waitForFunction(() => (document.querySelector('#infoModalMedia video') as HTMLVideoElement)?.currentTime > 0);
      await page.locator('#infoModalClose').click();
      await page.locator('[data-hotspot-id="info"]').click();
      assert.equal(await page.locator('#infoModalText').textContent(), 'Konten informasi offline.');
      await page.locator('#infoModalClose').click();
      await page.locator('#btnToggleMinimap').click();
      await page.waitForFunction(() => (document.querySelector('#minimapImg') as HTMLImageElement)?.naturalWidth > 0);
      assert.equal(await page.locator('.minimap-dot').count(), 10);
      await page.locator('#closeMinimapBtn').click();
      for (let index = 0; index < 10; index++) {
        await page.locator(`[data-hotspot-id="nav-${index}"]`).click();
        await page.waitForFunction((name) => document.getElementById('sceneTitle')?.textContent === name, `Ruang ${(index + 1) % 10 + 1}`);
      }
      await page.locator('#btnToggleDrawer').click();
      assert.equal(await page.locator('.scene-thumb-card').count(), 10);
      await page.locator('#btnToggleDrawer').click();
    };
    for (const channel of ['chrome', 'msedge']) {
      browser = await chromium.launch({ channel, headless: true, args: ['--enable-unsafe-swiftshader'] });
      for (const format of ['zip', 'html']) {
        console.log(`QA ${channel}: ${format}`);
        const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, serviceWorkers: 'block' });
        const blocked: string[] = [], errors: string[] = [];
        await context.route('**/*', async (route) => {
          const url = new URL(route.request().url());
          if (url.protocol === 'file:' || (format === 'zip' && url.origin === origin)) await route.continue();
          else { blocked.push(url.href); await route.abort(); }
        });
        if (format === 'html') await context.setOffline(true);
        const page = await context.newPage();
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
        await page.goto(format === 'zip' ? origin : pathToFileURL(htmlPath).href);
        try { await exercise(page); } catch (error) {
          console.error(await page.locator('#infoModalMedia').evaluate((element) => {
            const video = element.querySelector('video');
            return { html: element.innerHTML.slice(0, 250), videoError: video?.error?.message, readyState: video?.readyState, networkState: video?.networkState };
          }), { blocked, errors });
          throw error;
        }
        await page.screenshot({ path: path.join(root, `${channel}-${format}-desktop.png`) });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: path.join(root, `${channel}-${format}-mobile.png`) });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Overflow mobile');
        assert.deepEqual(blocked, [], 'Paket mencoba mengakses jaringan eksternal');
        assert.deepEqual(errors, [], 'Error runtime/resource');
        results.push({ channel, version: browser.version(), format, passed: true, scenes: 10, image: true, video: true, floorPlan: true, blockedExternalRequests: blocked.length, runtimeErrors: errors.length });
        await context.close();
      }
      await browser.close(); browser = undefined;
    }
    await fsp.writeFile(path.join(root, 'report.json'), JSON.stringify({ generatedAt: new Date().toISOString(), package: report, browserChecks: results }, null, 2));
    console.log(JSON.stringify({ report: path.join(root, 'report.json'), results }, null, 2));
  } finally {
    await browser?.close();
    if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
  }
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
