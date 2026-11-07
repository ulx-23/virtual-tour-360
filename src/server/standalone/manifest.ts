import { z } from 'zod';

const id = z.string().min(1).max(200);
const angle = z.number().finite();
export const hotspotContentSchema = z.object({
  buttonStyle: z.enum(['pill', 'card', 'chevron', 'beacon']).optional(),
  buttonSize: z.enum(['sm', 'md', 'lg']).optional(),
  colorTheme: z.enum(['indigo', 'emerald', 'amber', 'sky', 'rose', 'glass']).optional(),
  icon: z.string().optional(),
  alwaysShowLabel: z.boolean().optional(),
  pulseAnimation: z.boolean().optional(),
  subtitle: z.string().optional(),
  text: z.string().optional(),
  url: z.string().optional(),
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
}).strict();

export const standaloneManifestSchema = z.object({
  manifestVersion: z.literal('1.0.0').optional(),
  id: id.optional(), title: z.string(), slug: z.string().optional(),
  description: z.string().nullable().optional(),
  startSceneId: id,
  exportedAt: z.string().optional(),
  scenes: z.array(z.object({
    id, name: z.string(), description: z.string().nullable().optional(),
    sceneType: z.enum(['OUTDOOR', 'INDOOR', 'TRANSITION']).optional(),
    initialYaw: angle, initialPitch: angle,
    initialFov: z.number().positive().max(Math.PI),
    panoramaUrl: z.string(), thumbnailUrl: z.string().nullable().optional(),
    buildingId: id.nullable().optional(), floorId: id.nullable().optional(),
    hotspots: z.array(z.object({
      id, type: z.enum(['NAVIGATION', 'FLOOR_NAVIGATION', 'INFORMATION', 'IMAGE', 'VIDEO', 'EXTERNAL_LINK']),
      yaw: angle, pitch: angle,
      targetYaw: angle.nullable().optional(), targetPitch: angle.nullable().optional(),
      targetSceneId: id.nullable().optional(), targetSceneName: z.string().nullable().optional(),
      label: z.string().nullable().optional(), icon: z.string().nullable().optional(),
      contentJson: hotspotContentSchema.nullable().optional(),
    }).strict()),
  }).strict()).min(1),
  buildings: z.array(z.object({
    id, name: z.string(), description: z.string().nullable().optional(),
    floors: z.array(z.object({
      id, name: z.string(), levelNumber: z.number(),
      floorPlan: z.object({
        id, imageUrl: z.string(), width: z.number(), height: z.number(),
        markers: z.array(z.object({
          id, sceneId: id, sceneName: z.string().optional(),
          x: z.number().min(0).max(1), y: z.number().min(0).max(1),
        }).strict()),
      }).strict().nullable(),
    }).strict()),
  }).strict()).default([]),
}).strict();

export type StandaloneManifest = z.infer<typeof standaloneManifestSchema>;

/** Every automatic resource must stay within the package, without URL tricks. */
export function relativeAssetPath(url: string): string {
  if (!url.startsWith('./') || /[\\:%?#\x00-\x1f]/.test(url)) {
    throw new Error(`Path aset tidak relatif/aman: ${url}`);
  }
  const name = url.slice(2);
  if (!name || name.split('/').some((part) => !part || part === '.' || part === '..')) {
    throw new Error(`Path aset tidak aman: ${url}`);
  }
  return name;
}

export function parseTourDataScript(script: string): unknown {
  const match = script.match(/^(?:\s*\/\/[^\n]*\n)*\s*window\.TOUR_DATA\s*=\s*([\s\S]*);\s*$/);
  if (!match) throw new Error('Manifest TOUR_DATA tidak ditemukan atau bukan JSON murni.');
  return JSON.parse(match[1]);
}

export function validateManifest(input: unknown) {
  const manifest = standaloneManifestSchema.parse(input);
  const sceneIds = new Set(manifest.scenes.map((scene) => scene.id));
  if (sceneIds.size !== manifest.scenes.length) throw new Error('ID scene duplikat.');
  if (!sceneIds.has(manifest.startSceneId)) throw new Error('Scene awal tidak valid.');
  const assets = new Set<string>();
  const warnings: string[] = [];
  const hotspotIds = new Set<string>();
  const addAsset = (url: string) => assets.add(relativeAssetPath(url));
  for (const scene of manifest.scenes) {
    addAsset(scene.panoramaUrl);
    if (scene.thumbnailUrl) addAsset(scene.thumbnailUrl);
    for (const hotspot of scene.hotspots) {
      if (hotspotIds.has(hotspot.id)) throw new Error(`ID hotspot duplikat: ${hotspot.id}`);
      hotspotIds.add(hotspot.id);
      if (hotspot.type === 'NAVIGATION' || hotspot.type === 'FLOOR_NAVIGATION') {
        if (!hotspot.targetSceneId || !sceneIds.has(hotspot.targetSceneId)) {
          throw new Error(`Tujuan hotspot tidak valid: ${hotspot.label || hotspot.id}`);
        }
      }
      const content = hotspot.contentJson;
      if (hotspot.type === 'IMAGE' || hotspot.type === 'VIDEO') {
        const url = content?.url || content?.imageUrl || content?.videoUrl;
        if (!url) throw new Error(`Media hotspot tidak tersedia: ${hotspot.id}`);
        addAsset(url);
      }
      for (const key of ['url', 'imageUrl', 'videoUrl'] as const) {
        const url = content?.[key];
        if (url && hotspot.type !== 'EXTERNAL_LINK') addAsset(url);
      }
      if (hotspot.type === 'EXTERNAL_LINK') {
        const url = content?.url || hotspot.label || '';
        let parsed: URL;
        try { parsed = new URL(url); } catch { throw new Error(`URL eksternal tidak valid: ${hotspot.id}`); }
        if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password ||
            parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' ||
            parsed.hostname.endsWith('.supabase.co') || /token|secret|password|api.?key/i.test(parsed.search)) {
          throw new Error(`URL eksternal tidak aman: ${hotspot.id}`);
        }
        warnings.push(`Tautan "${hotspot.label || hotspot.id}" memerlukan internet saat dibuka.`);
      }
    }
  }
  for (const building of manifest.buildings) {
    for (const floor of building.floors) {
      if (!floor.floorPlan) continue;
      addAsset(floor.floorPlan.imageUrl);
      for (const marker of floor.floorPlan.markers) {
        if (!sceneIds.has(marker.sceneId)) throw new Error(`Marker denah menunjuk scene tidak aktif: ${marker.id}`);
      }
    }
  }
  return { manifest, assets: [...assets], warnings };
}
