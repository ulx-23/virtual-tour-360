import prisma from '@/lib/prisma';
import { SceneType } from '@prisma/client';

export interface CreateSceneInput {
  tourId: string;
  panoramaAssetId: string;
  name: string;
  description?: string;
  sceneType?: SceneType;
  buildingId?: string | null;
  floorId?: string | null;
  initialYaw?: number;
  initialPitch?: number;
  initialFov?: number;
}

export class SceneService {
  static async create(input: CreateSceneInput) {
    const count = await prisma.scene.count({ where: { tourId: input.tourId } });

    const scene = await prisma.scene.create({
      data: {
        tourId: input.tourId,
        panoramaAssetId: input.panoramaAssetId,
        name: input.name,
        description: input.description,
        sceneType: input.sceneType || 'OUTDOOR',
        buildingId: input.buildingId,
        floorId: input.floorId,
        initialYaw: input.initialYaw ?? 0.0,
        initialPitch: input.initialPitch ?? 0.0,
        initialFov: input.initialFov ?? 1.05,
        sortOrder: count,
      },
      include: {
        panoramaAsset: { include: { mediaAsset: true } },
      },
    });

    // If tour has no start_scene_id, set this first scene as start scene
    const tour = await prisma.tour.findUnique({
      where: { id: input.tourId },
      select: { startSceneId: true },
    });

    if (tour && !tour.startSceneId) {
      await prisma.tour.update({
        where: { id: input.tourId },
        data: { startSceneId: scene.id },
      });
    }

    return scene;
  }

  static async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      sceneType?: SceneType;
      buildingId?: string | null;
      floorId?: string | null;
      initialYaw?: number;
      initialPitch?: number;
      initialFov?: number;
      sortOrder?: number;
      isActive?: boolean;
    }
  ) {
    return prisma.scene.update({
      where: { id },
      data,
      include: {
        panoramaAsset: { include: { mediaAsset: true } },
        building: true,
        floor: true,
      },
    });
  }

  static async delete(id: string) {
    // Check if this is the start scene of any tour
    await prisma.tour.updateMany({
      where: { startSceneId: id },
      data: { startSceneId: null },
    });

    return prisma.scene.delete({ where: { id } });
  }
}