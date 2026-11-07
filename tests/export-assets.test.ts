import { describe, expect, it } from 'vitest';
import { assertStandaloneAssets, type StandaloneAssetTour } from '@/server/services/export-assets';

const baseTour = (): StandaloneAssetTour => ({
  scenes: [{ name: 'Lobi', panoramaAsset: { mediaAsset: { storageKey: 'file.svg' } } }],
  buildings: [],
});

describe('standalone export asset preflight', () => {
  it('accepts a tour whose referenced files exist', () => {
    expect(() => assertStandaloneAssets(baseTour())).not.toThrow();
  });

  it('rejects a missing panorama instead of producing a broken offline tour', () => {
    const tour = baseTour();
    tour.scenes[0].panoramaAsset!.mediaAsset!.storageKey = 'uploads/missing-panorama.jpg';
    expect(() => assertStandaloneAssets(tour)).toThrow(/panorama scene/);
  });

  it('rejects missing floor plans and traversal outside public', () => {
    const tour = baseTour();
    tour.buildings.push({ floors: [{ name: 'Lantai 1', floorPlan: { mediaAsset: { storageKey: 'missing-plan.png' } } }] });
    expect(() => assertStandaloneAssets(tour)).toThrow(/denah/);
    tour.buildings = [];
    tour.scenes[0].panoramaAsset!.mediaAsset!.storageKey = '../package.json';
    expect(() => assertStandaloneAssets(tour)).toThrow(/path tidak aman/);
  });
});
