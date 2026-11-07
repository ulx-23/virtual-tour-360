import prisma from '@/lib/prisma';
import { SceneType } from '@prisma/client';

export interface BatchSceneItem {
  panoramaAssetId: string;
  name?: string;
  sceneType?: SceneType;
  buildingId?: string | null;
  floorId?: string | null;
}

export interface BatchCreateResult {
  createdCount: number;
  scenes: any[];
}

export class SceneMergerService {
  /**
   * Batch creates multiple scenes for a tour from panorama assets
   */
  static async batchCreateScenes(
    tourId: string,
    items: BatchSceneItem[]
  ): Promise<BatchCreateResult> {
    if (!items || items.length === 0) {
      throw new Error('Tidak ada panorama yang dipilih untuk dibuatkan scene.');
    }

    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
      select: { id: true, startSceneId: true },
    });

    if (!tour) {
      throw new Error('Proyek tur tidak ditemukan.');
    }

    const currentSceneCount = await prisma.scene.count({ where: { tourId } });

    // Fetch panorama asset information to derive default scene names if needed
    const assetIds = items.map((i) => i.panoramaAssetId);
    const assets = await prisma.panoramaAsset.findMany({
      where: { id: { in: assetIds } },
      include: { mediaAsset: true },
    });

    const assetMap = new Map(assets.map((a) => [a.id, a]));

    const createdScenes: any[] = [];
    let startSceneToSet = tour.startSceneId;

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const asset = assetMap.get(item.panoramaAssetId);
      if (!asset) continue;

      const defaultName = asset.mediaAsset?.originalFilename
        ? asset.mediaAsset.originalFilename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
        : `Scene ${currentSceneCount + index + 1}`;

      const name = item.name && item.name.trim() !== '' ? item.name.trim() : defaultName;

      const scene = await prisma.scene.create({
        data: {
          tourId,
          panoramaAssetId: item.panoramaAssetId,
          name,
          sceneType: item.sceneType || 'OUTDOOR',
          buildingId: item.buildingId || null,
          floorId: item.floorId || null,
          sortOrder: currentSceneCount + index,
          initialYaw: 0.0,
          initialPitch: 0.0,
          initialFov: 1.05,
        },
        include: {
          panoramaAsset: { include: { mediaAsset: true } },
        },
      });

      if (!startSceneToSet) {
        startSceneToSet = scene.id;
      }

      createdScenes.push(scene);
    }

    // Set first scene as start scene if tour didn't have one
    if (startSceneToSet && startSceneToSet !== tour.startSceneId) {
      await prisma.tour.update({
        where: { id: tourId },
        data: { startSceneId: startSceneToSet },
      });
    }

    return {
      createdCount: createdScenes.length,
      scenes: createdScenes,
    };
  }
}

