import prisma from '@/lib/prisma';
import { GraphService } from '@/server/services/graph.service';

export class PublishingService {
  static async publishTour(tourId: string, publishedByUserId: string) {
    // 1. Run Graph Reachability Validation
    const validation = await GraphService.validateTour(tourId);

    if (!validation.canPublish) {
      throw new Error(
        `Publikasi ditolak: Terdapat ${validation.criticalErrors.length} kesalahan kritis pada tur: \n` +
          validation.criticalErrors.join('\n')
      );
    }

    // 2. Fetch full tour data for snapshot
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
      include: {
        coverMedia: true,
        scenes: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            panoramaAsset: { include: { mediaAsset: true } },
            building: true,
            floor: true,
            sourceHotspots: { where: { isActive: true } },
          },
        },
        buildings: {
          orderBy: { sortOrder: 'asc' },
          include: {
            floors: {
              orderBy: { levelNumber: 'asc' },
              include: {
                floorPlan: {
                  include: {
                    mediaAsset: true,
                    markers: { include: { scene: { select: { id: true, name: true } } } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!tour) throw new Error('Tour tidak ditemukan');

    // 3. Serialize Snapshot Manifest
    const snapshot = {
      id: tour.id,
      title: tour.title,
      slug: tour.slug,
      description: tour.description,
      coverUrl: tour.coverMedia ? `/${tour.coverMedia.storageKey}` : null,
      startSceneId: tour.startSceneId,
      publishedAt: new Date().toISOString(),
      scenes: tour.scenes.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        sceneType: s.sceneType,
        initialYaw: s.initialYaw,
        initialPitch: s.initialPitch,
        initialFov: s.initialFov,
        panoramaUrl: `/${s.panoramaAsset.mediaAsset.storageKey}`,
        thumbnailUrl: s.panoramaAsset.mediaAsset.thumbnailKey
          ? `/${s.panoramaAsset.mediaAsset.thumbnailKey}`
          : null,
        buildingId: s.buildingId,
        floorId: s.floorId,
        hotspots: s.sourceHotspots.map((h) => ({
          id: h.id,
          type: h.type,
          yaw: h.yaw,
          pitch: h.pitch,
          targetYaw: h.targetYaw,
          targetPitch: h.targetPitch,
          targetSceneId: h.targetSceneId,
          targetSceneName: h.targetSceneId
            ? tour.scenes.find((target) => target.id === h.targetSceneId)?.name || null
            : null,
          label: h.label,
          icon: h.icon,
          contentJson: h.contentJson ? JSON.parse(h.contentJson) : null,
        })),
      })),
      buildings: tour.buildings.map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        floors: b.floors.map((f) => ({
          id: f.id,
          name: f.name,
          levelNumber: f.levelNumber,
          floorPlan: f.floorPlan
            ? {
                id: f.floorPlan.id,
                imageUrl: `/${f.floorPlan.mediaAsset.storageKey}`,
                width: f.floorPlan.width,
                height: f.floorPlan.height,
                markers: f.floorPlan.markers.map((m) => ({
                  id: m.id,
                  sceneId: m.sceneId,
                  sceneName: m.scene.name,
                  x: m.x,
                  y: m.y,
                })),
              }
            : null,
        })),
      })),
    };

    // 4. Determine next version number
    const lastPub = await prisma.tourPublication.findFirst({
      where: { tourId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const nextVersion = (lastPub?.version || 0) + 1;

    // 5. Store snapshot in database and update tour
    const [publication] = await prisma.$transaction([
      prisma.tourPublication.create({
        data: {
          tourId,
          version: nextVersion,
          snapshotJson: JSON.stringify(snapshot),
          publishedBy: publishedByUserId,
        },
      }),
      prisma.tour.update({
        where: { id: tourId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      }),
    ]);

    return { publication, validation, version: nextVersion };
  }

  static async getPublicTour(slug: string) {
    const tour = await prisma.tour.findUnique({
      where: { slug },
      include: {
        publications: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!tour || tour.status !== 'PUBLISHED' || tour.publications.length === 0) {
      return null;
    }

    const latestPublication = tour.publications[0];
    return JSON.parse(latestPublication.snapshotJson);
  }
}
