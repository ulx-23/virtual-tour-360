import prisma from '@/lib/prisma';

export class BuildingService {
  static async createBuilding(tourId: string, name: string, description?: string) {
    const count = await prisma.building.count({ where: { tourId } });
    return prisma.building.create({
      data: {
        tourId,
        name,
        description,
        sortOrder: count,
      },
    });
  }

  static async createFloor(buildingId: string, name: string, levelNumber = 1) {
    const count = await prisma.floor.count({ where: { buildingId } });
    return prisma.floor.create({
      data: {
        buildingId,
        name,
        levelNumber,
        sortOrder: count,
      },
    });
  }

  static async linkFloorPlan(floorId: string, mediaAssetId: string, width: number, height: number) {
    return prisma.floorPlan.upsert({
      where: { floorId },
      update: { mediaAssetId, width, height },
      create: { floorId, mediaAssetId, width, height },
    });
  }

  static async setFloorPlanMarker(floorPlanId: string, sceneId: string, x: number, y: number) {
    // Normalization check: coordinates must be between 0.0 and 1.0
    const clampedX = Math.max(0, Math.min(1, x));
    const clampedY = Math.max(0, Math.min(1, y));

    const existing = await prisma.floorPlanMarker.findFirst({
      where: { floorPlanId, sceneId },
    });

    if (existing) {
      return prisma.floorPlanMarker.update({
        where: { id: existing.id },
        data: { x: clampedX, y: clampedY },
      });
    }

    return prisma.floorPlanMarker.create({
      data: {
        floorPlanId,
        sceneId,
        x: clampedX,
        y: clampedY,
      },
    });
  }
}