import fs from 'fs';
import path from 'path';

export interface StandaloneAssetTour {
  scenes: Array<{
    name: string;
    panoramaAsset?: { mediaAsset?: { storageKey: string; thumbnailKey?: string | null } | null } | null;
  }>;
  buildings: Array<{
    floors: Array<{
      name: string;
      floorPlan?: { mediaAsset?: { storageKey: string } | null } | null;
    }>;
  }>;
}

/** Prevent a successful export from referring to a missing or unsafe local asset. */
export function assertStandaloneAssets(tour: StandaloneAssetTour, publicDir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), 'public')): void {
  const root = path.resolve(/*turbopackIgnore: true*/ publicDir);
  const requiredFile = (storageKey: string, label: string) => {
    const filePath = path.resolve(/*turbopackIgnore: true*/ root, storageKey);
    if (!filePath.startsWith(root + path.sep) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      throw new Error(`Ekspor gagal: file ${label} tidak ditemukan atau path tidak aman (${storageKey}).`);
    }
  };

  for (const scene of tour.scenes) {
    const key = scene.panoramaAsset?.mediaAsset?.storageKey;
    if (!key) throw new Error(`Ekspor gagal: panorama scene "${scene.name}" tidak tersedia.`);
    requiredFile(key, `panorama scene "${scene.name}"`);
    const thumbnail = scene.panoramaAsset?.mediaAsset?.thumbnailKey;
    if (thumbnail) requiredFile(thumbnail, `thumbnail scene "${scene.name}"`);
  }

  for (const building of tour.buildings) {
    for (const floor of building.floors) {
      const plan = floor.floorPlan;
      if (plan) {
        if (!plan.mediaAsset?.storageKey) throw new Error(`Ekspor gagal: file denah "${floor.name}" tidak tersedia.`);
        requiredFile(plan.mediaAsset.storageKey, `denah "${floor.name}"`);
      }
    }
  }
}
