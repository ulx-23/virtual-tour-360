import prisma from '@/lib/prisma';

export interface GraphValidationResult {
  isValid: boolean;
  canPublish: boolean;
  totalScenes: number;
  reachableScenesCount: number;
  criticalErrors: string[];
  warnings: string[];
  unreachableScenes: Array<{ id: string; name: string }>;
  brokenHotspots: Array<{ id: string; label: string | null; sourceSceneName: string }>;
}

export class GraphService {
  static async validateTour(tourId: string): Promise<GraphValidationResult> {
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
      include: {
        scenes: {
          where: { isActive: true },
          include: {
            panoramaAsset: true,
            sourceHotspots: { where: { isActive: true } },
          },
        },
      },
    });

    if (!tour) {
      throw new Error('Tour tidak ditemukan');
    }

    const criticalErrors: string[] = [];
    const warnings: string[] = [];
    const brokenHotspots: Array<{ id: string; label: string | null; sourceSceneName: string }> = [];

    const scenes = tour.scenes;
    const sceneMap = new Map(scenes.map((s) => [s.id, s]));

    if (scenes.length === 0) {
      criticalErrors.push('Virtual tour belum memiliki scene aktif.');
      return {
        isValid: false,
        canPublish: false,
        totalScenes: 0,
        reachableScenesCount: 0,
        criticalErrors,
        warnings,
        unreachableScenes: [],
        brokenHotspots: [],
      };
    }

    if (!tour.startSceneId || !sceneMap.has(tour.startSceneId)) {
      criticalErrors.push('Scene awal (Start Scene) belum ditentukan atau tidak aktif.');
    }

    // Check scenes with missing panorama assets
    for (const scene of scenes) {
      if (!scene.panoramaAsset) {
        criticalErrors.push(`Scene "${scene.name}" tidak memiliki file aset panorama 360°.`);
      }
    }

    // Check broken hotspots
    for (const scene of scenes) {
      for (const h of scene.sourceHotspots) {
        if (h.type === 'NAVIGATION' || h.type === 'FLOOR_NAVIGATION') {
          if (!h.targetSceneId || !sceneMap.has(h.targetSceneId)) {
            criticalErrors.push(`Hotspot "${h.label || 'Navigasi'}" di scene "${scene.name}" mengarah ke tujuan yang tidak valid/dihapus.`);
            brokenHotspots.push({
              id: h.id,
              label: h.label,
              sourceSceneName: scene.name,
            });
          }
        }
      }
    }

    // Check reachability from startSceneId using BFS
    const visited = new Set<string>();
    if (tour.startSceneId && sceneMap.has(tour.startSceneId)) {
      const queue: string[] = [tour.startSceneId];
      visited.add(tour.startSceneId);

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        const currentScene = sceneMap.get(currentId);
        if (!currentScene) continue;

        for (const h of currentScene.sourceHotspots) {
          if (
            (h.type === 'NAVIGATION' || h.type === 'FLOOR_NAVIGATION') &&
            h.targetSceneId &&
            sceneMap.has(h.targetSceneId)
          ) {
            if (!visited.has(h.targetSceneId)) {
              visited.add(h.targetSceneId);
              queue.push(h.targetSceneId);
            }
          }
        }
      }
    }

    const unreachableScenes: Array<{ id: string; name: string }> = [];
    for (const scene of scenes) {
      if (!visited.has(scene.id)) {
        unreachableScenes.push({ id: scene.id, name: scene.name });
      }
    }

    if (unreachableScenes.length > 0) {
      warnings.push(
        `${unreachableScenes.length} scene tidak dapat dijangkau dari scene awal: ` +
          unreachableScenes.map((s) => `"${s.name}"`).slice(0, 3).join(', ') +
          (unreachableScenes.length > 3 ? '...' : '')
      );
    }

    // Check return hotspots (Bidirectional check)
    for (const scene of scenes) {
      for (const h of scene.sourceHotspots) {
        if (h.type === 'NAVIGATION' && h.targetSceneId && sceneMap.has(h.targetSceneId)) {
          const targetScene = sceneMap.get(h.targetSceneId)!;
          const hasReturn = targetScene.sourceHotspots.some(
            (th) => th.type === 'NAVIGATION' && th.targetSceneId === scene.id
          );
          if (!hasReturn) {
            warnings.push(`Scene "${targetScene.name}" belum memiliki hotspot navigasi balik menuju "${scene.name}".`);
          }
        }
      }
    }

    const isValid = criticalErrors.length === 0;
    const canPublish = isValid && scenes.length > 0;

    return {
      isValid,
      canPublish,
      totalScenes: scenes.length,
      reachableScenesCount: visited.size,
      criticalErrors,
      warnings: Array.from(new Set(warnings)),
      unreachableScenes,
      brokenHotspots,
    };
  }
}