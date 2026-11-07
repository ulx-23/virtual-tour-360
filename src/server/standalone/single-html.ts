import AdmZip from 'adm-zip';
import path from 'path';
import { createHash } from 'node:crypto';
import { parseTourDataScript, relativeAssetPath, validateManifest } from './manifest';

// Keep the generated HTML practical for direct opening in a desktop browser.
export const MAX_SINGLE_HTML_SOURCE_BYTES = 16 * 1024 * 1024;

const MIME_BY_EXTENSION: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogv': 'video/ogg',
};

/** Convert a complete standalone web ZIP into one file that can open via file://. */
export function convertStandaloneZipToHtml(zipBuffer: Buffer): string {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  let sourceBytes = 0;
  const names = new Set<string>();
  for (const entry of entries) {
    const name = relativeAssetPath(`./${entry.entryName.replace(/\/$/, '')}`);
    if (names.has(name.toLowerCase())) throw new Error(`Path ZIP duplikat: ${name}`);
    names.add(name.toLowerCase());
    sourceBytes += entry.header.size;
    if (sourceBytes > MAX_SINGLE_HTML_SOURCE_BYTES) {
      throw new Error('Single HTML dibatasi untuk paket sumber maksimal 16 MiB. Gunakan ekspor ZIP untuk tur yang lebih besar.');
    }
  }

  const readEntry = (name: string): Buffer => {
    const entry = zip.getEntry(name);
    if (!entry || entry.isDirectory) throw new Error(`Arsip tidak lengkap: ${name}`);
    return entry.getData();
  };
  const readText = (name: string) => readEntry(name).toString('utf8');

  const dataScript = readText('tour-data.js');
  const { manifest, assets } = validateManifest(parseTourDataScript(dataScript));
  for (const name of assets) readEntry(name);
  if (manifest.manifestVersion) {
    if (JSON.stringify(JSON.parse(readText('tour.json'))) !== JSON.stringify(parseTourDataScript(dataScript))) throw new Error('Manifest ZIP tidak cocok.');
    const integrity = JSON.parse(readText('integrity.json')) as { files: Record<string, { bytes: number; sha256: string }> };
    for (const entry of entries) {
      if (entry.isDirectory || entry.entryName === 'integrity.json') continue;
      const buffer = entry.getData();
      const expected = integrity.files?.[entry.entryName];
      if (expected?.bytes !== buffer.length || expected.sha256 !== createHash('sha256').update(buffer).digest('hex')) throw new Error(`Checksum aset tidak cocok: ${entry.entryName}`);
    }
  }

  const inlineAsset = (url: string): string => {
    const entryName = relativeAssetPath(url);
    const mime = MIME_BY_EXTENSION[path.extname(entryName).toLowerCase()];
    if (!mime) throw new Error(`Format aset Single HTML tidak didukung: ${entryName}`);
    return `data:${mime};base64,${readEntry(entryName).toString('base64')}`;
  };

  for (const scene of manifest.scenes) {
    if (typeof scene.panoramaUrl !== 'string') throw new Error('URL panorama tidak valid.');
    const panoramaUrl = scene.panoramaUrl;
    scene.panoramaUrl = inlineAsset(panoramaUrl);
    scene.thumbnailUrl = typeof scene.thumbnailUrl === 'string' && scene.thumbnailUrl !== panoramaUrl
      ? inlineAsset(scene.thumbnailUrl)
      : scene.panoramaUrl;
    if (scene.hotspots) for (const hotspot of scene.hotspots) {
      if (hotspot.type === 'EXTERNAL_LINK' || !hotspot.contentJson) continue;
      for (const key of ['url', 'imageUrl', 'videoUrl'] as const) {
        if (hotspot.contentJson[key]) hotspot.contentJson[key] = inlineAsset(hotspot.contentJson[key]);
      }
    }
  }
  for (const building of manifest.buildings || []) {
    for (const floor of building.floors || []) {
      if (floor.floorPlan?.imageUrl) floor.floorPlan.imageUrl = inlineAsset(floor.floorPlan.imageUrl);
    }
  }

  let html = readText('index.html');
  const replacements: Array<[string, string]> = [
    ['<link rel="stylesheet" href="./style.css">', `<style>${readText('style.css')}</style>`],
    ['<script src="./vendor/marzipano.js"></script>', `<script>${readText('vendor/marzipano.js')}</script>`],
    ['<script src="./tour-data.js"></script>', `<script>window.TOUR_DATA = ${JSON.stringify(manifest).replace(/</g, '\\u003c')};</script>`],
    ['<script src="./app.js"></script>', `<script>${readText('app.js')}</script>`],
  ];
  for (const [needle, replacement] of replacements) {
    if (!html.includes(needle)) throw new Error(`Template standalone tidak kompatibel: ${needle}`);
    html = html.replace(needle, () => replacement);
  }
  return html;
}
