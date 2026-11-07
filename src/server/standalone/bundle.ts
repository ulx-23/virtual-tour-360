import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { ZipArchive } from 'archiver';
import { hotspotContentSchema, validateManifest, type StandaloneManifest } from './manifest';
import { validateStandaloneZip, type ArchiveFile } from './validate-zip';

type Scene = StandaloneManifest['scenes'][number];
type Building = StandaloneManifest['buildings'][number];
type Floor = Building['floors'][number];
type Plan = NonNullable<Floor['floorPlan']>;
interface Media { storageKey: string; thumbnailKey?: string | null }
export interface SourceTour {
  id: string; title: string; slug: string; description?: string | null; startSceneId: string | null;
  scenes: Array<Pick<Scene, 'id' | 'name' | 'description' | 'sceneType' | 'initialYaw' | 'initialPitch' | 'initialFov' | 'buildingId' | 'floorId'> & {
    panoramaAsset: { mediaAsset: Media };
    sourceHotspots: Array<Omit<Scene['hotspots'][number], 'contentJson'> & { contentJson?: string | null }>;
  }>;
  buildings: Array<Pick<Building, 'id' | 'name' | 'description'> & {
    floors: Array<Pick<Floor, 'id' | 'name' | 'levelNumber'> & {
      floorPlan: null | Omit<Plan, 'imageUrl' | 'markers'> & {
        mediaAsset: Media;
        markers: Array<Plan['markers'][number] & { scene?: { name: string } | null }>;
      };
    }>;
  }>;
}

/** No database or Next.js dependency: bundle one explicit snapshot and local assets. */
export async function bundleStandaloneTour(tour: SourceTour, outputPath: string, options: {
  publicDir?: string; templateDir?: string; onProgress?: (percent: number) => Promise<void>;
} = {}) {
  const publicDir = await fsp.realpath(/*turbopackIgnore: true*/ options.publicDir || path.join(process.cwd(), 'public'));
  const templateDir = options.templateDir || path.join(process.cwd(), 'src/server/templates/standalone');
  const pending = new Map<string, string | Buffer>();
  const localAsset = async (key: string, prefix: string) => {
    if (!key || /[:\\?#\x00-\x1f]/.test(key)) throw new Error(`Path media tidak aman: ${key}`);
    const absolute = await fsp.realpath(path.resolve(publicDir, key.replace(/^\//, '')));
    if (!absolute.startsWith(publicDir + path.sep) || !(await fsp.stat(absolute)).isFile()) throw new Error(`Media di luar storage: ${key}`);
    const ext = path.extname(absolute).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm', '.ogv'].includes(ext)) throw new Error(`Format media offline belum didukung: ${ext}`);
    const name = `${prefix}-${createHash('sha256').update(key).digest('hex').slice(0, 16)}${ext}`;
    pending.set(name, absolute);
    return `./${name}`;
  };

  const scenes: Scene[] = [];
  for (const scene of tour.scenes) {
    const media = scene.panoramaAsset?.mediaAsset;
    if (!media) throw new Error(`Panorama tidak tersedia: ${scene.name}`);
    const panoramaUrl = await localAsset(media.storageKey, 'panoramas/scene');
    const hotspots: Scene['hotspots'] = [];
    for (const h of scene.sourceHotspots) {
      const content = h.contentJson ? hotspotContentSchema.parse(JSON.parse(h.contentJson)) : null;
      if (content && h.type !== 'EXTERNAL_LINK') {
        for (const key of ['url', 'imageUrl', 'videoUrl'] as const) {
          if (content[key]) content[key] = await localAsset(content[key], 'media/hotspot');
        }
      }
      hotspots.push({
        id: h.id, type: h.type, yaw: h.yaw, pitch: h.pitch,
        targetYaw: h.targetYaw, targetPitch: h.targetPitch, targetSceneId: h.targetSceneId,
        targetSceneName: tour.scenes.find((target) => target.id === h.targetSceneId)?.name || null,
        label: h.label, icon: h.icon, contentJson: content,
      });
    }
    scenes.push({
      id: scene.id, name: scene.name, description: scene.description, sceneType: scene.sceneType,
      initialYaw: scene.initialYaw, initialPitch: scene.initialPitch, initialFov: scene.initialFov,
      buildingId: scene.buildingId, floorId: scene.floorId,
      panoramaUrl, thumbnailUrl: media.thumbnailKey ? await localAsset(media.thumbnailKey, 'thumbnails/scene') : panoramaUrl,
      hotspots,
    });
  }
  const buildings: Building[] = [];
  for (const building of tour.buildings) {
    const floors: Floor[] = [];
    for (const floor of building.floors) {
      const plan = floor.floorPlan;
      floors.push({
        id: floor.id, name: floor.name, levelNumber: floor.levelNumber,
        floorPlan: plan ? {
          id: plan.id, width: plan.width, height: plan.height,
          imageUrl: await localAsset(plan.mediaAsset.storageKey, 'floor-plans/plan'),
          markers: plan.markers.map((m) => ({ id: m.id, sceneId: m.sceneId, sceneName: m.scene?.name, x: m.x, y: m.y })),
        } : null,
      });
    }
    buildings.push({ id: building.id, name: building.name, description: building.description, floors });
  }
  const { manifest } = validateManifest({
    manifestVersion: '1.0.0', id: tour.id, title: tour.title, slug: tour.slug,
    description: tour.description, startSceneId: tour.startSceneId,
    exportedAt: new Date().toISOString(), scenes, buildings,
  });
  const serialized = JSON.stringify(manifest, null, 2);
  pending.set('tour.json', Buffer.from(serialized));
  pending.set('tour-data.js', Buffer.from(`window.TOUR_DATA = ${serialized};\n`));
  for (const name of ['index.html', 'style.css', 'app.js', 'README.txt', 'vendor/marzipano.js', 'serve.cjs', 'Start tour.cmd']) {
    pending.set(name, path.join(/*turbopackIgnore: true*/ templateDir, name));
  }
  await options.onProgress?.(50);
  const integrity: Record<string, ArchiveFile> = {};
  for (const [name, source] of pending) {
    const hash = createHash('sha256');
    let bytes = 0;
    if (Buffer.isBuffer(source)) { hash.update(source); bytes = source.length; }
    else {
      for await (const chunk of fs.createReadStream(source)) { hash.update(chunk); bytes += chunk.length; }
    }
    if (!bytes) throw new Error(`File kosong: ${name}`);
    integrity[name] = { bytes, sha256: hash.digest('hex') };
  }
  pending.set('integrity.json', Buffer.from(JSON.stringify({ version: '1.0.0', files: integrity }, null, 2)));
  const partialPath = `${outputPath}.part`;
  const output = fs.createWriteStream(partialPath, { flags: 'wx' });
  let ownsPartial = false;
  output.once('open', () => { ownsPartial = true; });
  const archive = new ZipArchive({ zlib: { level: 6 } });
  try {
    await new Promise<void>((resolve, reject) => {
      output.on('error', reject);
      output.on('close', resolve);
      archive.on('error', reject);
      archive.on('warning', reject);
      archive.pipe(output);
      for (const [name, source] of pending) {
        if (Buffer.isBuffer(source)) archive.append(source, { name });
        else archive.file(source, { name });
      }
      archive.finalize().catch(reject);
    });
    await options.onProgress?.(90);
    const report = await validateStandaloneZip(partialPath);
    // Atomic no-overwrite publication; a failed check never produces a completed ZIP.
    await fsp.link(partialPath, outputPath);
    await fsp.unlink(partialPath);
    return { report, fileSize: (await fsp.stat(outputPath)).size };
  } catch (error) {
    archive.abort();
    output.destroy();
    // Only our exclusive temporary file may be removed, never a pre-existing archive.
    if (ownsPartial) await fsp.unlink(partialPath).catch(() => {});
    throw error;
  }
}
