import AdmZip from 'adm-zip';
import path from 'path';
import sharp from 'sharp';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { storage } from '@/lib/storage';
import { slugify } from '@/lib/utils';

export interface ImportBackupResult {
  tourId: string;
  title: string;
  slug: string;
  scenesCount: number;
  hotspotsCount: number;
}

export class BackupService {
  /**
   * Maximum allowed uncompressed size (250 MB) to prevent zip bombs
   */
  private static MAX_TOTAL_UNCOMPRESSED_SIZE = 250 * 1024 * 1024;

  /**
   * Inspects and validates a ZIP archive for Zip Slip vulnerabilities
   */
  static validateZipSecurity(zip: AdmZip) {
    const entries = zip.getEntries();
    let totalSize = 0;

    for (const entry of entries) {
      const entryName = entry.entryName;

      // Check for Zip Slip / Directory Traversal attacks
      if (
        entryName.includes('..') ||
        entryName.startsWith('/') ||
        entryName.startsWith('\\') ||
        path.isAbsolute(entryName)
      ) {
        throw new Error(
          `Keamanan ditolak: Terdeteksi upaya directory traversal (Zip Slip) pada berkas "${entryName}".`
        );
      }

      totalSize += entry.header.size;
      if (totalSize > this.MAX_TOTAL_UNCOMPRESSED_SIZE) {
        throw new Error(
          'Keamanan ditolak: Ukuran arsip backup melebihi batas maksimum yang diizinkan (250 MB).'
        );
      }
    }

    return entries;
  }

  /**
   * Imports a .vtbackup.zip file and restores the tour with new UUIDs and collision-free slug
   */
  static async importBackup(zipBuffer: Buffer, ownerId: string): Promise<ImportBackupResult> {
    const zip = new AdmZip(zipBuffer);

    // 1. Security check
    const entries = this.validateZipSecurity(zip);

    // 2. Locate backup manifest
    const manifestEntry = entries.find((e) => e.entryName === 'backup-manifest.json');
    if (!manifestEntry) {
      throw new Error('Format backup tidak valid: berkas "backup-manifest.json" tidak ditemukan.');
    }

    let manifest: any;
    try {
      const manifestText = manifestEntry.getData().toString('utf-8');
      manifest = JSON.parse(manifestText);
    } catch {
      throw new Error('Format "backup-manifest.json" rusak atau bukan JSON yang valid.');
    }

    // 3. Version validation
    if (manifest.backupVersion !== '1.0.0') {
      throw new Error(
        `Versi backup "${manifest.backupVersion || 'tidak dikenal'}" tidak didukung. Format yang didukung: 1.0.0.`
      );
    }

    if (!manifest.tour || !Array.isArray(manifest.scenes)) {
      throw new Error('Struktur manifest backup tidak lengkap.');
    }

    // 4. Handle Tour Slug Collision
    const baseSlug = slugify(manifest.tour.slug || manifest.tour.title || 'imported-tour');
    let targetSlug = `${baseSlug}-imported`;
    let slugCounter = 1;

    while (await prisma.tour.findUnique({ where: { slug: targetSlug } })) {
      targetSlug = `${baseSlug}-imported-${slugCounter++}`;
    }

    // 5. ID Mapping Dictionaries
    const sceneIdMap = new Map<string, string>();
    const buildingIdMap = new Map<string, string>();
    const floorIdMap = new Map<string, string>();

    // 6. Restore Media & Panorama Assets for each scene
    const sceneToPanoramaAssetMap = new Map<string, string>();

    for (const sceneData of manifest.scenes) {
      let panoramaAssetId = '';

      if (sceneData.panoramaFilename) {
        const fileEntry = entries.find((e) => e.entryName === sceneData.panoramaFilename);
        if (fileEntry && !fileEntry.isDirectory) {
          const fileBuffer = fileEntry.getData();
          const origName =
            sceneData.mediaAsset?.originalFilename || path.basename(sceneData.panoramaFilename);
          const mimeType = sceneData.mediaAsset?.mimeType || 'image/jpeg';

          // Extract metadata & generate thumbnail
          const image = sharp(fileBuffer);
          const metadata = await image.metadata();
          const width = metadata.width || 4000;
          const height = metadata.height || 2000;

          const savedPano = await storage.save(fileBuffer, origName, 'panoramas');

          let thumbKey: string | null = null;
          try {
            const thumbBuffer = await sharp(fileBuffer)
              .resize(640, 320, { fit: 'cover' })
              .webp({ quality: 80 })
              .toBuffer();
            const savedThumb = await storage.save(thumbBuffer, `${origName}-thumb.webp`, 'thumbnails');
            thumbKey = savedThumb.storageKey;
          } catch {}

          const mediaAsset = await prisma.mediaAsset.create({
            data: {
              originalFilename: origName,
              mimeType,
              fileSize: fileBuffer.length,
              width,
              height,
              storageKey: savedPano.storageKey,
              thumbnailKey: thumbKey,
            },
          });

          const panoAsset = await prisma.panoramaAsset.create({
            data: {
              mediaAssetId: mediaAsset.id,
              projectionType: 'EQUIRECTANGULAR',
            },
          });

          panoramaAssetId = panoAsset.id;
        }
      }

      if (!panoramaAssetId) {
        // Fallback: If tour had existing panoramaAssetId that still exists in database
        if (sceneData.panoramaAssetId) {
          const existing = await prisma.panoramaAsset.findUnique({
            where: { id: sceneData.panoramaAssetId },
          });
          if (existing) panoramaAssetId = existing.id;
        }
      }

      if (!panoramaAssetId) {
        throw new Error(
          `Gagal merestore aset panorama untuk scene "${sceneData.name}". Berkas gambar tidak ditemukan dalam arsip backup.`
        );
      }

      sceneToPanoramaAssetMap.set(sceneData.id, panoramaAssetId);
    }

    // 7. Create Tour & Entities inside a transaction
    const newTour = await prisma.tour.create({
      data: {
        title: `${manifest.tour.title} (Restored)`,
        slug: targetSlug,
        description: manifest.tour.description,
        visibility: manifest.tour.visibility || 'PUBLIC',
        status: 'DRAFT',
        ownerId,
      },
    });

    // 8. Restore Buildings and Floors
    if (Array.isArray(manifest.buildings)) {
      for (const bData of manifest.buildings) {
        const newBuilding = await prisma.building.create({
          data: {
            tourId: newTour.id,
            name: bData.name,
            description: bData.description,
            sortOrder: bData.sortOrder || 0,
          },
        });
        buildingIdMap.set(bData.id, newBuilding.id);

        if (Array.isArray(bData.floors)) {
          for (const fData of bData.floors) {
            const newFloor = await prisma.floor.create({
              data: {
                buildingId: newBuilding.id,
                name: fData.name,
                levelNumber: fData.levelNumber || 1,
                sortOrder: fData.sortOrder || 0,
              },
            });
            floorIdMap.set(fData.id, newFloor.id);
          }
        }
      }
    }

    // 9. Restore Scenes with new UUIDs
    let newStartSceneId: string | null = null;

    for (const sData of manifest.scenes) {
      const mappedBuildingId = sData.buildingId ? buildingIdMap.get(sData.buildingId) || null : null;
      const mappedFloorId = sData.floorId ? floorIdMap.get(sData.floorId) || null : null;
      const panoramaAssetId = sceneToPanoramaAssetMap.get(sData.id)!;

      const newScene = await prisma.scene.create({
        data: {
          tourId: newTour.id,
          panoramaAssetId,
          name: sData.name,
          description: sData.description,
          sceneType: sData.sceneType || 'OUTDOOR',
          initialYaw: sData.initialYaw ?? 0.0,
          initialPitch: sData.initialPitch ?? 0.0,
          initialFov: sData.initialFov ?? 1.05,
          sortOrder: sData.sortOrder || 0,
          buildingId: mappedBuildingId,
          floorId: mappedFloorId,
        },
      });

      sceneIdMap.set(sData.id, newScene.id);

      if (manifest.tour.startSceneId === sData.id || !newStartSceneId) {
        newStartSceneId = newScene.id;
      }
    }

    // Update tour start scene
    if (newStartSceneId) {
      await prisma.tour.update({
        where: { id: newTour.id },
        data: { startSceneId: newStartSceneId },
      });
    }

    // 10. Restore Hotspots with remapped targetSceneId
    let totalHotspots = 0;
    for (const sData of manifest.scenes) {
      const newSourceSceneId = sceneIdMap.get(sData.id);
      if (!newSourceSceneId) continue;

      if (Array.isArray(sData.hotspots)) {
        for (const hData of sData.hotspots) {
          const newTargetSceneId = hData.targetSceneId
            ? sceneIdMap.get(hData.targetSceneId) || null
            : null;

          await prisma.hotspot.create({
            data: {
              tourId: newTour.id,
              sourceSceneId: newSourceSceneId,
              targetSceneId: newTargetSceneId,
              type: hData.type || 'NAVIGATION',
              yaw: hData.yaw,
              pitch: hData.pitch,
              targetYaw: hData.targetYaw,
              targetPitch: hData.targetPitch,
              label: hData.label,
              icon: hData.icon,
              contentJson: hData.contentJson,
              sortOrder: hData.sortOrder || 0,
            },
          });
          totalHotspots++;
        }
      }
    }

    return {
      tourId: newTour.id,
      title: newTour.title,
      slug: newTour.slug,
      scenesCount: manifest.scenes.length,
      hotspotsCount: totalHotspots,
    };
  }
}
