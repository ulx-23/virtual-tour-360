import { beforeAll, describe, expect, it } from 'vitest';
import fsp from 'node:fs/promises';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { createExportFixture } from './helpers/export-fixture';
import { bundleStandaloneTour } from '../src/server/standalone/bundle';
import { validateStandaloneZip } from '../src/server/standalone/validate-zip';
import { convertStandaloneZipToHtml } from '../src/server/standalone/single-html';
import type { StandaloneManifest } from '../src/server/standalone/manifest';

let root: string, buffer: Buffer;
beforeAll(async () => {
  await fsp.mkdir('public/exports', { recursive: true });
  root = await fsp.mkdtemp(path.resolve('public/exports/qa-package-'));
  const tour = await createExportFixture(path.join(root, 'storage'));
  const result = await bundleStandaloneTour(tour, path.join(root, 'tour.zip'), { publicDir: path.join(root, 'storage') });
  expect(result.report.sceneCount).toBe(10);
  buffer = await fsp.readFile(path.join(root, 'tour.zip'));
});

function changeManifest(zip: AdmZip, update: (manifest: StandaloneManifest & Record<string, unknown>) => void) {
  const manifest = JSON.parse(zip.readAsText('tour.json'));
  update(manifest);
  zip.updateFile('tour.json', Buffer.from(JSON.stringify(manifest)));
  zip.updateFile('tour-data.js', Buffer.from(`window.TOUR_DATA = ${JSON.stringify(manifest)};`));
}

describe('real standalone package without a database', () => {
  it('bundles ten panoramas, floor plan, image hotspot and verifies all checksums', async () => {
    const report = await validateStandaloneZip(buffer);
    expect(report.valid).toBe(true);
    expect(report.sceneCount).toBe(10);
    expect(report.assetCount).toBe(22);
    expect(report.files['serve.cjs'].bytes).toBeGreaterThan(0);
  });
  it('converts the complete package to HTML with embedded media', () => {
    const html = convertStandaloneZipToHtml(buffer);
    expect(html).toContain('data:image/png;base64,');
    expect(html).toContain('data:image/webp;base64,');
    expect(html).not.toMatch(/(?:src|href)="\.\//);
  });
  it('rejects missing assets after finalization', async () => {
    const zip = new AdmZip(buffer);
    zip.deleteFile(zip.getEntries().find((e) => e.entryName.startsWith('panoramas/'))!.entryName);
    await expect(validateStandaloneZip(zip.toBuffer())).rejects.toThrow('Arsip tidak lengkap');
  });
  it('rejects damaged media even when the ZIP CRC has been recomputed', async () => {
    const zip = new AdmZip(buffer);
    zip.updateFile(zip.getEntries().find((e) => e.entryName.startsWith('panoramas/'))!.entryName, Buffer.from('corrupted'));
    await expect(validateStandaloneZip(zip.toBuffer())).rejects.toThrow('Checksum');
    expect(() => convertStandaloneZipToHtml(zip.toBuffer())).toThrow('Checksum');
  });
  it('rejects a navigation target removed from the manifest', async () => {
    const zip = new AdmZip(buffer);
    changeManifest(zip, (m) => { m.scenes[0].hotspots[0].targetSceneId = 'missing'; });
    await expect(validateStandaloneZip(zip.toBuffer())).rejects.toThrow('Tujuan hotspot');
  });
  it.each(['https://project.supabase.co/file.webp', './%2e%2e/secret.webp', './a/../secret.webp', './file.webp?token=private'])('rejects unsafe/cloud assets %s', async (url) => {
    const zip = new AdmZip(buffer);
    changeManifest(zip, (m) => { m.scenes[0].panoramaUrl = url; });
    await expect(validateStandaloneZip(zip.toBuffer())).rejects.toThrow(/Path aset/);
  });
  it('rejects private configuration files', async () => {
    const zip = new AdmZip(buffer);
    zip.addFile('.env', Buffer.from('PRIVATE=value'));
    await expect(validateStandaloneZip(zip.toBuffer())).rejects.toThrow('File privat');
  });
  it('rejects credentials embedded as manifest fields', async () => {
    const zip = new AdmZip(buffer);
    changeManifest(zip, (m) => { m.authToken = 'private'; });
    await expect(validateStandaloneZip(zip.toBuffer())).rejects.toThrow();
  });
  it('never overwrites an existing ZIP', async () => {
    const tour = await createExportFixture(path.join(root, 'storage-2'), 1);
    await expect(bundleStandaloneTour(tour, path.join(root, 'tour.zip'), { publicDir: path.join(root, 'storage-2') })).rejects.toThrow();
    expect(await fsp.readFile(path.join(root, 'tour.zip'))).toEqual(buffer);
  });
});
