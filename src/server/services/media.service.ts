import sharp from 'sharp';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { storage } from '@/lib/storage';

export interface ProcessedMedia {
  mediaAssetId: string;
  panoramaAssetId?: string;
  originalFilename: string;
  storageKey: string;
  thumbnailKey: string | null;
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
  isEquirectangular: boolean;
}

export class MediaService {
  static async processPanoramaUpload(
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string
  ): Promise<ProcessedMedia> {
    // 1. Calculate Checksum
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // 2. Extract Metadata using Sharp
    const image = sharp(fileBuffer);
    const metadata = await image.metadata();

    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (width === 0 || height === 0) {
      throw new Error('Dimensi gambar tidak dapat dibaca atau rusak');
    }

    // Ratio verification: Equirectangular 2:1 is standard 360° panorama
    const ratio = width / height;
    const isEquirectangular = ratio >= 1.85 && ratio <= 2.15;

    // 3. Save original panorama
    const ext = metadata.format || 'jpg';
    const cleanBaseName = originalFilename.substring(0, originalFilename.lastIndexOf('.')) || 'panorama';
    const originalSave = await storage.save(
      fileBuffer,
      `${cleanBaseName}.${ext}`,
      'panoramas'
    );

    // 4. Generate thumbnail (WebP 640px width)
    const thumbnailBuffer = await sharp(fileBuffer)
      .resize(640, 320, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    const thumbSave = await storage.save(
      thumbnailBuffer,
      `${cleanBaseName}-thumb.webp`,
      'thumbnails'
    );

    // 5. Store in Database
    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        originalFilename,
        mimeType,
        fileSize: fileBuffer.length,
        width,
        height,
        checksum,
        storageProvider: 'local',
        storageKey: originalSave.storageKey,
        thumbnailKey: thumbSave.storageKey,
        processingStatus: 'COMPLETED',
      },
    });

    let panoramaAssetId: string | undefined;

    // If it's a panorama, register panorama asset record
    if (isEquirectangular || width >= 2000) {
      const panoramaAsset = await prisma.panoramaAsset.create({
        data: {
          mediaAssetId: mediaAsset.id,
          projectionType: 'EQUIRECTANGULAR',
          processingStatus: 'COMPLETED',
        },
      });
      panoramaAssetId = panoramaAsset.id;
    }

    return {
      mediaAssetId: mediaAsset.id,
      panoramaAssetId,
      originalFilename,
      storageKey: originalSave.storageKey,
      thumbnailKey: thumbSave.storageKey,
      width,
      height,
      fileSize: fileBuffer.length,
      mimeType,
      isEquirectangular,
    };
  }

  static async listMedia(params: { page?: number; limit?: number; panoramaOnly?: boolean }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.panoramaOnly) {
      where.panoramaAsset = { isNot: null };
    }

    const [items, total] = await Promise.all([
      prisma.mediaAsset.findMany({
        where,
        include: {
          panoramaAsset: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.mediaAsset.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}