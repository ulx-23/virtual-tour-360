import fsp from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import type { SourceTour } from '../../src/server/standalone/bundle';

/** Isolated fixtures; never connects to the application database or upload storage. */
export async function createExportFixture(root: string, count = 10): Promise<SourceTour> {
  await fsp.mkdir(root, { recursive: true });
  const scenes: SourceTour['scenes'] = [];
  for (let index = 0; index < count; index++) {
    const key = `pano-${index}.webp`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="512"><rect width="1024" height="512" fill="hsl(${index * 33},65%,35%)"/><circle cx="512" cy="256" r="100" fill="white"/><path d="M0 100L1024 400M0 400L1024 100" stroke="#fbbf24" stroke-width="20"/></svg>`;
    await sharp(Buffer.from(svg)).webp().toFile(path.join(root, key));
    scenes.push({
      id: `scene-${index}`, name: `Ruang ${index + 1}`, sceneType: index ? 'INDOOR' : 'OUTDOOR',
      initialYaw: 0, initialPitch: 0, initialFov: 1.05, buildingId: 'building', floorId: 'floor',
      panoramaAsset: { mediaAsset: { storageKey: key, thumbnailKey: key } },
      sourceHotspots: [{
        id: `nav-${index}`, type: 'NAVIGATION', yaw: 0, pitch: 0,
        targetSceneId: `scene-${(index + 1) % count}`, targetYaw: 0, targetPitch: 0,
        label: `Lanjut ${index + 1}`, contentJson: JSON.stringify({ buttonStyle: 'pill', colorTheme: 'indigo' }),
      }],
    });
  }
  await sharp({ create: { width: 400, height: 300, channels: 3, background: '#ddd' } }).png().toFile(path.join(root, 'plan.png'));
  scenes[0].sourceHotspots.push({ id: 'info', type: 'INFORMATION', yaw: 0.35, pitch: 0.15, label: 'Informasi lokal', contentJson: JSON.stringify({ text: 'Konten informasi offline.' }) });
  scenes[0].sourceHotspots.push({ id: 'image', type: 'IMAGE', yaw: -0.35, pitch: 0.15, label: 'Gambar lokal', contentJson: JSON.stringify({ url: '/plan.png' }) });
  return {
    id: 'isolated-offline-qa', title: 'Tur QA Offline', slug: 'isolated-offline-qa', startSceneId: scenes[0].id, scenes,
    buildings: [{ id: 'building', name: 'Gedung QA', floors: [{
      id: 'floor', name: 'Lantai 1', levelNumber: 1,
      floorPlan: { id: 'plan', width: 400, height: 300, mediaAsset: { storageKey: 'plan.png' }, markers: scenes.map((s, i) => ({ id: `marker-${i}`, sceneId: s.id, x: (i + 1) / (count + 1), y: 0.5 })) },
    }] }],
  };
}
