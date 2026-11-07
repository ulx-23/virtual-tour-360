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

  static async deleteMedia(mediaId: string, force = false): Promise<{ success: boolean; message?: string; error?: string }> {
    const media = await prisma.mediaAsset.findUnique({
      where: { id: mediaId },
      include: {
        panoramaAsset: {
          include: {
            scenes: {
              select: {
                id: true,
                name: true,
                tour: { select: { title: true } },
              },
            },
          },
        },
      },
    });

    if (!media) {
      return { success: false, error: 'Berkas media tidak ditemukan' };
    }

    const linkedScenes = media.panoramaAsset?.scenes || [];
    if (linkedScenes.length > 0 && !force) {
      const scene = linkedScenes[0];
      return {
        success: false,
        error: `Media ini sedang digunakan oleh scene "${scene.name}" pada tur "${scene.tour.title}". Harap hapus atau ganti scene tersebut terlebih dahulu jika ingin menghapus foto panorama ini.`,
      };
    }

    // If force is true, delete linked scenes
    if (linkedScenes.length > 0 && force) {
      for (const sc of linkedScenes) {
        await prisma.scene.delete({ where: { id: sc.id } });
      }
    }

    // Unset any tour cover references
    await prisma.tour.updateMany({
      where: { coverMediaId: mediaId },
      data: { coverMediaId: null },
    });

    // Delete files from storage
    if (media.storageKey) {
      await storage.delete(media.storageKey);
    }
    if (media.thumbnailKey) {
      await storage.delete(media.thumbnailKey);
    }

    // Delete database records
    if (media.panoramaAsset) {
      await prisma.panoramaAsset.delete({ where: { id: media.panoramaAsset.id } });
    }
    await prisma.mediaAsset.delete({ where: { id: mediaId } });

    return { success: true, message: 'Berkas media berhasil dihapus secara permanen' };
  }

  static async cleanupUnusedMedia(): Promise<{ success: boolean; deletedCount: number; message: string }> {
    // Find all media assets not linked to any active scene
    const unusedMedia = await prisma.mediaAsset.findMany({
      where: {
        OR: [
          { panoramaAsset: null },
          {
            panoramaAsset: {
              scenes: {
                none: {},
              },
            },
          },
        ],
      },
      select: {
        id: true,
        storageKey: true,
        thumbnailKey: true,
        panoramaAsset: {
          select: { id: true },
        },
      },
      take: 200,
    });

    let deletedCount = 0;
    for (const item of unusedMedia) {
      try {
        if (item.storageKey) await storage.delete(item.storageKey);
        if (item.thumbnailKey) await storage.delete(item.thumbnailKey);

        if (item.panoramaAsset) {
          await prisma.panoramaAsset.delete({ where: { id: item.panoramaAsset.id } });
        }
        await prisma.mediaAsset.delete({ where: { id: item.id } });
        deletedCount++;
      } catch {}
    }

    return {
      success: true,
      deletedCount,
      message: `Berhasil membersihkan ${deletedCount} file media yang tidak digunakan`,
    };
  }
}