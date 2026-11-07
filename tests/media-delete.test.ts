import { describe, it, expect } from 'vitest';
import prisma from '../src/lib/prisma';
import { MediaService } from '../src/server/services/media.service';

describe('Media Asset Deletion & Cleanup System', () => {
  let createdMediaId: string;

  it('Step 1: Should create a dummy media asset record', async () => {
    const dummy = await prisma.mediaAsset.create({
      data: {
        originalFilename: 'test-delete-panorama.webp',
        mimeType: 'image/webp',
        fileSize: 1024,
        width: 2000,
        height: 1000,
        storageKey: 'uploads/panoramas/test-dummy.webp',
        thumbnailKey: 'uploads/thumbnails/test-dummy-thumb.webp',
        processingStatus: 'COMPLETED',
      },
    });

    createdMediaId = dummy.id;
    expect(dummy.id).toBeDefined();

    const pano = await prisma.panoramaAsset.create({
      data: {
        mediaAssetId: dummy.id,
        projectionType: 'EQUIRECTANGULAR',
      },
    });
    expect(pano.id).toBeDefined();
  });

  it('Step 2: Should delete media asset and cascade panorama asset', async () => {
    const result = await MediaService.deleteMedia(createdMediaId);
    expect(result.success).toBe(true);

    const check = await prisma.mediaAsset.findUnique({
      where: { id: createdMediaId },
    });
    expect(check).toBeNull();
  });
});

