import { describe, it, expect } from 'vitest';

// Simulate BFS reachability algorithm used in GraphService
function validateGraphReachability(
  startSceneId: string | null,
  scenes: Array<{ id: string; name: string }>,
  hotspots: Array<{ sourceSceneId: string; targetSceneId: string | null }>
) {
  const sceneMap = new Map(scenes.map((s) => [s.id, s]));
  const criticalErrors: string[] = [];

  if (!startSceneId || !sceneMap.has(startSceneId)) {
    criticalErrors.push('Start scene is not defined or does not exist');
  }

  // Check broken hotspots
  for (const h of hotspots) {
    if (!h.targetSceneId || !sceneMap.has(h.targetSceneId)) {
      criticalErrors.push(`Hotspot from ${h.sourceSceneId} targets non-existent scene`);
    }
  }

  // BFS Reachability
  const visited = new Set<string>();
  if (startSceneId && sceneMap.has(startSceneId)) {
    const queue: string[] = [startSceneId];
    visited.add(startSceneId);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      for (const h of hotspots) {
        if (h.sourceSceneId === currentId && h.targetSceneId && sceneMap.has(h.targetSceneId)) {
          if (!visited.has(h.targetSceneId)) {
            visited.add(h.targetSceneId);
            queue.push(h.targetSceneId);
          }
        }
      }
    }
  }

  const unreachable = scenes.filter((s) => !visited.has(s.id));
  return {
    isValid: criticalErrors.length === 0,
    criticalErrors,
    reachableCount: visited.size,
    unreachableCount: unreachable.length,
  };
}

describe('Graph Engine Validation', () => {
  it('validates a continuous reachable graph: Gate -> Yard -> Lobby -> Hallway', () => {
    const scenes = [
      { id: '1', name: 'Gerbang' },
      { id: '2', name: 'Halaman' },
      { id: '3', name: 'Lobi' },
      { id: '4', name: 'Koridor' },
    ];
    const hotspots = [
      { sourceSceneId: '1', targetSceneId: '2' },
      { sourceSceneId: '2', targetSceneId: '3' },
      { sourceSceneId: '3', targetSceneId: '4' },
    ];

    const result = validateGraphReachability('1', scenes, hotspots);
    expect(result.isValid).toBe(true);
    expect(result.reachableCount).toBe(4);
    expect(result.unreachableCount).toBe(0);
  });

  it('detects unreachable isolated scenes', () => {
    const scenes = [
      { id: '1', name: 'Gerbang' },
      { id: '2', name: 'Halaman' },
      { id: '3', name: 'Laboratorium Terisolasi' },
    ];
    const hotspots = [{ sourceSceneId: '1', targetSceneId: '2' }];

    const result = validateGraphReachability('1', scenes, hotspots);
    expect(result.reachableCount).toBe(2);
    expect(result.unreachableCount).toBe(1);
  });

  it('detects broken hotspots targeting non-existent scenes', () => {
    const scenes = [{ id: '1', name: 'Gerbang' }];
    const hotspots = [{ sourceSceneId: '1', targetSceneId: '999-deleted' }];

    const result = validateGraphReachability('1', scenes, hotspots);
    expect(result.isValid).toBe(false);
    expect(result.criticalErrors.length).toBeGreaterThan(0);
  });
});