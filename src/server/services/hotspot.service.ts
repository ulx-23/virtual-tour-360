import prisma from '@/lib/prisma';
import { HotspotType } from '@prisma/client';

export interface CreateHotspotInput {
  tourId: string;
  sourceSceneId: string;
  targetSceneId?: string | null;
  type?: HotspotType;
  yaw: number;
  pitch: number;
  targetYaw?: number | null;
  targetPitch?: number | null;
  label?: string | null;
  icon?: string | null;
  contentJson?: string | null;
  createReturnHotspot?: boolean;
}

export class HotspotService {
  static async create(input: CreateHotspotInput) {
    const hotspot = await prisma.hotspot.create({
      data: {
        tourId: input.tourId,
        sourceSceneId: input.sourceSceneId,
        targetSceneId: input.targetSceneId,
        type: input.type || 'NAVIGATION',
        yaw: input.yaw,
        pitch: input.pitch,
        targetYaw: input.targetYaw,
        targetPitch: input.targetPitch,
        label: input.label,
        icon: input.icon || 'arrow-up',
        contentJson: input.contentJson,
      },
      include: {
        targetScene: { select: { id: true, name: true } },
      },
    });

    let returnHotspot = null;

    // Bidirectional return hotspot creation
    if (input.createReturnHotspot && input.targetSceneId && input.type === 'NAVIGATION') {
      const sourceScene = await prisma.scene.findUnique({
        where: { id: input.sourceSceneId },
        select: { name: true },
      });
      // Calculate opposite yaw: (-PI to PI)
      let returnYaw = input.yaw + Math.PI;
      if (returnYaw > Math.PI) returnYaw -= 2 * Math.PI;

      returnHotspot = await prisma.hotspot.create({
        data: {
          tourId: input.tourId,
          sourceSceneId: input.targetSceneId,
          targetSceneId: input.sourceSceneId,
          type: 'NAVIGATION',
          yaw: returnYaw,
          pitch: 0.0,
          label: `Kembali ke ${sourceScene?.name || 'scene sebelumnya'}`,
          icon: 'arrow-down',
        },
      });
    }

    return { hotspot, returnHotspot };
  }

  static async update(
    id: string,
    data: {
      yaw?: number;
      pitch?: number;
      targetYaw?: number | null;
      targetPitch?: number | null;
      label?: string | null;
      icon?: string | null;
      contentJson?: string | null;
      targetSceneId?: string | null;
      type?: HotspotType;
      isActive?: boolean;
    }
  ) {
    return prisma.hotspot.update({
      where: { id },
      data,
      include: {
        targetScene: { select: { id: true, name: true } },
      },
    });
  }

  static async delete(id: string) {
    return prisma.hotspot.delete({ where: { id } });
  }
}
