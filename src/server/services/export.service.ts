import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { ZipArchive } from 'archiver';
import prisma from '@/lib/prisma';
import { GraphService } from '@/server/services/graph.service';
import { bundleStandaloneTour } from '@/server/standalone/bundle';
import { ExportStatus, ExportType } from '@prisma/client';

export class ExportService {
  private static exportDir = path.join(process.cwd(), 'public', 'exports');

  /**
   * Ensure export directory exists on D: drive project folder
   */
  private static async ensureExportDir() {
    await fsp.mkdir(this.exportDir, { recursive: true });
  }

  private static createZip(options: any = { zlib: { level: 9 } }) {
    return new ZipArchive(options);
  }

  /**
   * Cleans up expired exports (older than 24 hours)
   */
  static async cleanupExpiredExports() {
    try {
      await this.ensureExportDir();
      const now = new Date();
      const expiredJobs = await prisma.exportJob.findMany({
        where: {
          expiresAt: { lt: now },
          status: 'COMPLETED',
        },
      });

      for (const job of expiredJobs) {
        if (job.fileName) {
          const filePath = path.join(this.exportDir, job.fileName);
          if (fs.existsSync(filePath)) {
            await fsp.unlink(filePath).catch(() => {});
          }
        }
      }
    } catch (e) {
      console.warn('Cleanup expired exports warning:', e);
    }
  }

  /**
   * Create a new Export Job in QUEUED status
   */
  static async createExportJob(tourId: string, type: ExportType = 'STANDALONE_ZIP') {
    await this.ensureExportDir();

    // Verify tour exists
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
      select: { id: true, title: true, slug: true, startSceneId: true },
    });

    if (!tour) {
      throw new Error('Proyek tur tidak ditemukan.');
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours TTL

    const job = await prisma.exportJob.create({
      data: {
        tourId,
        type,
        status: 'QUEUED',
        progress: 0,
        expiresAt,
      },
    });

    // Start background processing without blocking request
    setImmediate(() => {
      this.processExportJob(job.id).catch((err) => {
        console.error(`Export job ${job.id} failed:`, err);
      });
    });

    return job;
  }

  /**
   * Process export job asynchronously
   */
  static async processExportJob(jobId: string) {
    const job = await prisma.exportJob.findUnique({
      where: { id: jobId },
      include: {
        tour: {
          include: {
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
                        markers: { include: { scene: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!job || !job.tour) return;

    try {
      // Step 1: Update status to PROCESSING (10%)
      await prisma.exportJob.update({
        where: { id: jobId },
        data: { status: 'PROCESSING', progress: 10 },
      });

      const tour = job.tour;

      if (job.type === 'STANDALONE_ZIP') {
        await this.generateStandaloneZip(jobId, tour);
      } else if (job.type === 'PROJECT_BACKUP') {
        await this.generateProjectBackupZip(jobId, tour);
      } else if (job.type === 'ORIGINAL_PANORAMAS') {
        await this.generateOriginalPanoramasZip(jobId, tour);
      }
    } catch (err: any) {
      await prisma.exportJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          progress: 0,
          errorMessage: err.message || 'Terjadi kesalahan saat mengekspor proyek.',
        },
      });
    }
  }

  /**
   * Generates public standalone Marzipano web tour ZIP
   */
  private static async generateStandaloneZip(jobId: string, tour: any) {
    // 1. Validation check
    const validation = await GraphService.validateTour(tour.id);
    if (!validation.isValid) {
      throw new Error(
        `Validasi gagal: ${validation.criticalErrors.join('; ')}`
      );
    }

    const safeSlug = tour.slug.replace(/[^a-zA-Z0-9_-]/g, '_');
    const zipFileName = `tour-${safeSlug}-standalone-${jobId}.zip`;
    const zipFilePath = path.join(this.exportDir, zipFileName);
    await this.ensureExportDir();
    const { fileSize } = await bundleStandaloneTour(tour, zipFilePath, {
      onProgress: async (progress) => {
        await prisma.exportJob.update({ where: { id: jobId }, data: { progress } });
      },
    });
    await prisma.exportJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED', progress: 100,
        fileName: zipFileName, fileSize,
        downloadUrl: `/api/tours/${tour.id}/export/download/${jobId}`,
      },
    });
  }

  /**
   * Generates editable full project backup (.vtbackup.zip)
   */
  private static async generateProjectBackupZip(jobId: string, tour: any) {
    await prisma.exportJob.update({
      where: { id: jobId },
      data: { progress: 30 },
    });

    const timestamp = Date.now();
    const safeSlug = tour.slug.replace(/[^a-zA-Z0-9_-]/g, '_');
    const zipFileName = `backup-${safeSlug}-${timestamp}.vtbackup.zip`;
    const zipFilePath = path.join(this.exportDir, zipFileName);

    const output = fs.createWriteStream(zipFilePath);
    const archive = this.createZip({ zlib: { level: 9 } });

    const archivePromise = new Promise<{ fileSize: number }>((resolve, reject) => {
      output.on('close', () => resolve({ fileSize: archive.pointer() }));
      archive.on('error', (err: any) => reject(err));
    });

    archive.pipe(output);

    // Package original media files & build backup manifest
    const backupScenes = [];
    for (const scene of tour.scenes) {
      const storageKey = scene.panoramaAsset?.mediaAsset?.storageKey;
      let panoramaFilename = null;

      if (storageKey) {
        const diskPath = path.join(process.cwd(), 'public', storageKey);
        const originalName = scene.panoramaAsset.mediaAsset.originalFilename || `panorama-${scene.id}.jpg`;
        const entryName = `panoramas/${scene.id}_${originalName}`;

        if (fs.existsSync(diskPath)) {
          archive.file(diskPath, { name: entryName });
          panoramaFilename = entryName;
        }
      }

      backupScenes.push({
        id: scene.id,
        name: scene.name,
        description: scene.description,
        sceneType: scene.sceneType,
        initialYaw: scene.initialYaw,
        initialPitch: scene.initialPitch,
        initialFov: scene.initialFov,
        sortOrder: scene.sortOrder,
        buildingId: scene.buildingId,
        floorId: scene.floorId,
        panoramaAssetId: scene.panoramaAssetId,
        panoramaFilename,
        mediaAsset: scene.panoramaAsset?.mediaAsset
          ? {
              originalFilename: scene.panoramaAsset.mediaAsset.originalFilename,
              mimeType: scene.panoramaAsset.mediaAsset.mimeType,
              width: scene.panoramaAsset.mediaAsset.width,
              height: scene.panoramaAsset.mediaAsset.height,
            }
          : null,
        hotspots: scene.sourceHotspots.map((h: any) => ({
          id: h.id,
          type: h.type,
          yaw: h.yaw,
          pitch: h.pitch,
          targetYaw: h.targetYaw,
          targetPitch: h.targetPitch,
          targetSceneId: h.targetSceneId,
          targetSceneName: h.targetSceneId
            ? tour.scenes.find((target: any) => target.id === h.targetSceneId)?.name || null
            : null,
          label: h.label,
          icon: h.icon,
          contentJson: h.contentJson,
          sortOrder: h.sortOrder,
        })),
      });
    }

    const backupBuildings = [];
    for (const building of tour.buildings) {
      const backupFloors = [];
      for (const floor of building.floors) {
        let floorPlanData = null;
        if (floor.floorPlan && floor.floorPlan.mediaAsset) {
          const planKey = floor.floorPlan.mediaAsset.storageKey;
          const diskPath = path.join(process.cwd(), 'public', planKey);
          const originalName = floor.floorPlan.mediaAsset.originalFilename || `plan-${floor.floorPlan.id}.png`;
          const entryName = `floor-plans/${floor.floorPlan.id}_${originalName}`;

          if (fs.existsSync(diskPath)) {
            archive.file(diskPath, { name: entryName });
          }

          floorPlanData = {
            id: floor.floorPlan.id,
            planFilename: entryName,
            width: floor.floorPlan.width,
            height: floor.floorPlan.height,
            markers: floor.floorPlan.markers.map((m: any) => ({
              id: m.id,
              sceneId: m.sceneId,
              x: m.x,
              y: m.y,
            })),
          };
        }

        backupFloors.push({
          id: floor.id,
          name: floor.name,
          levelNumber: floor.levelNumber,
          sortOrder: floor.sortOrder,
          floorPlan: floorPlanData,
        });
      }

      backupBuildings.push({
        id: building.id,
        name: building.name,
        description: building.description,
        sortOrder: building.sortOrder,
        floors: backupFloors,
      });
    }

    const backupManifest = {
      backupVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      tour: {
        id: tour.id,
        title: tour.title,
        slug: tour.slug,
        description: tour.description,
        status: tour.status,
        visibility: tour.visibility,
        startSceneId: tour.startSceneId,
      },
      scenes: backupScenes,
      buildings: backupBuildings,
    };

    archive.append(JSON.stringify(backupManifest, null, 2), { name: 'backup-manifest.json' });

    await prisma.exportJob.update({
      where: { id: jobId },
      data: { progress: 80 },
    });

    await archive.finalize();
    const result = await archivePromise;

    await prisma.exportJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        progress: 100,
        fileName: zipFileName,
        fileSize: result.fileSize,
        downloadUrl: `/api/tours/${tour.id}/export/download/${jobId}`,
      },
    });
  }

  /**
   * Generates a ZIP containing only the raw original 360 panorama files
   */
  private static async generateOriginalPanoramasZip(jobId: string, tour: any) {
    await prisma.exportJob.update({
      where: { id: jobId },
      data: { progress: 30 },
    });

    const timestamp = Date.now();
    const safeSlug = tour.slug.replace(/[^a-zA-Z0-9_-]/g, '_');
    const zipFileName = `panoramas-${safeSlug}-${timestamp}.zip`;
    const zipFilePath = path.join(this.exportDir, zipFileName);

    const output = fs.createWriteStream(zipFilePath);
    const archive = this.createZip({ zlib: { level: 9 } });

    const archivePromise = new Promise<{ fileSize: number }>((resolve, reject) => {
      output.on('close', () => resolve({ fileSize: archive.pointer() }));
      archive.on('error', (err: any) => reject(err));
    });

    archive.pipe(output);

    let count = 0;
    for (const scene of tour.scenes) {
      const storageKey = scene.panoramaAsset?.mediaAsset?.storageKey;
      if (storageKey) {
        const diskPath = path.join(process.cwd(), 'public', storageKey);
        if (fs.existsSync(diskPath)) {
          const originalName = scene.panoramaAsset.mediaAsset.originalFilename || `scene-${count + 1}.jpg`;
          const cleanName = `${count + 1}_${scene.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${originalName}`;
          archive.file(diskPath, { name: cleanName });
          count++;
        }
      }
    }

    await prisma.exportJob.update({
      where: { id: jobId },
      data: { progress: 75 },
    });

    await archive.finalize();
    const result = await archivePromise;

    await prisma.exportJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        progress: 100,
        fileName: zipFileName,
        fileSize: result.fileSize,
        downloadUrl: `/api/tours/${tour.id}/export/download/${jobId}`,
      },
    });
  }
}
