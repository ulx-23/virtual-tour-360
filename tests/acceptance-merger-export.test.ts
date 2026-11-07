import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import http from 'http';
import AdmZip from 'adm-zip';
import sharp from 'sharp';
import prisma from '@/lib/prisma';
import { SceneMergerService } from '@/server/services/scene-merger.service';
import { GraphService } from '@/server/services/graph.service';
import { ExportService } from '@/server/services/export.service';
import { BackupService } from '@/server/services/backup.service';
import { storage } from '@/lib/storage';

describe('Acceptance Testing: Virtual Tour Merger & Export System', () => {
  let adminUserId: string;
  let testTourId: string;
  let panoramaAssetIds: string[] = [];
  const testExtractDir = path.join(process.cwd(), 'public', 'exports', 'test-extracted-acceptance');

  beforeAll(async () => {
    // 1. Ensure test admin user exists
    const user = await prisma.user.findFirst({
      where: { email: 'admin@virtualtour360.id' },
    });
    if (user) {
      adminUserId = user.id;
    } else {
      const newUser = await prisma.user.create({
        data: {
          name: 'Test Administrator',
          email: 'admin@virtualtour360.id',
          passwordHash: 'dummy',
        },
      });
      adminUserId = newUser.id;
    }

    // 2. Generate 10 real equirectangular 2:1 WebP panoramas
    const panoDefs = [
      { name: '01 Gerbang Utama Kampus', type: 'OUTDOOR', color: '#1e3a8a' },
      { name: '02 Plaza Lapangan Tengah', type: 'OUTDOOR', color: '#0369a1' },
      { name: '03 Boulevard Pepohonan', type: 'OUTDOOR', color: '#047857' },
      { name: '04 Pintu Masuk Rektorat', type: 'TRANSITION', color: '#b45309' },
      { name: '05 Koridor Timur', type: 'TRANSITION', color: '#c2410c' },
      { name: '06 Lobi Utama Lantai 1', type: 'INDOOR', color: '#334155' },
      { name: '07 Ruang Auditorium Utama', type: 'INDOOR', color: '#6d28d9' },
      { name: '08 Laboratorium Robotika', type: 'INDOOR', color: '#0e7490' },
      { name: '09 Perpustakaan Digital', type: 'INDOOR', color: '#7c2d12' },
      { name: '10 Rooftop Observatory', type: 'OUTDOOR', color: '#1e1b4b' },
    ];

    panoramaAssetIds = [];

    for (let i = 0; i < panoDefs.length; i++) {
      const p = panoDefs[i];
      const width = 1200;
      const height = 600;

      const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g${i}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="${p.color}"/>
              <stop offset="50%" stop-color="#ffffff" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="#111827"/>
            </linearGradient>
          </defs>
          <rect width="${width}" height="${height}" fill="url(#g${i})"/>
          <circle cx="${width / 2}" cy="${height / 2}" r="140" fill="#ffffff" fill-opacity="0.2"/>
          <text x="${width / 2}" y="${height / 2 - 20}" font-family="sans-serif" font-size="32" font-weight="bold" fill="#ffffff" text-anchor="middle">
            ${p.name}
          </text>
          <text x="${width / 2}" y="${height / 2 + 25}" font-family="sans-serif" font-size="20" fill="#f3f4f6" text-anchor="middle">
            360° Equirectangular Scene (${p.type})
          </text>
        </svg>
      `;

      const buffer = await sharp(Buffer.from(svg)).webp({ quality: 80 }).toBuffer();
      const filename = `test-scene-${i + 1}-${p.type.toLowerCase()}.webp`;
      const savedPano = await storage.save(buffer, filename, 'panoramas');

      const mediaAsset = await prisma.mediaAsset.create({
        data: {
          originalFilename: filename,
          mimeType: 'image/webp',
          fileSize: buffer.length,
          width,
          height,
          storageKey: savedPano.storageKey,
        },
      });

      const panoAsset = await prisma.panoramaAsset.create({
        data: {
          mediaAssetId: mediaAsset.id,
          projectionType: 'EQUIRECTANGULAR',
        },
      });

      panoramaAssetIds.push(panoAsset.id);
    }
  });

  afterAll(async () => {
    // Cleanup created test directory
    if (fs.existsSync(testExtractDir)) {
      await fsp.rm(testExtractDir, { recursive: true, force: true }).catch(() => {});
    }

    // Cleanup test tour
    if (testTourId) {
      await prisma.tour.delete({ where: { id: testTourId } }).catch(() => {});
    }
  });

  it('Step 1-3: Should create a tour and batch merge 10 panoramas into separate scenes', async () => {
    expect(panoramaAssetIds.length).toBe(10);

    const tour = await prisma.tour.create({
      data: {
        title: 'Grand Campus 360 Full Acceptance Tour',
        slug: `grand-campus-acceptance-${Date.now()}`,
        description: 'Tur pengujian komprehensif 10 panorama outdoor & indoor',
        ownerId: adminUserId,
        status: 'DRAFT',
      },
    });

    testTourId = tour.id;

    // Use SceneMergerService to batch create all 10 scenes
    const sceneItems = panoramaAssetIds.map((assetId, idx) => ({
      panoramaAssetId: assetId,
      name: `Scene ${idx + 1}`,
      sceneType: idx < 3 ? ('OUTDOOR' as const) : idx < 5 ? ('TRANSITION' as const) : ('INDOOR' as const),
    }));

    const result = await SceneMergerService.batchCreateScenes(tour.id, sceneItems);
    expect(result.createdCount).toBe(10);
    expect(result.scenes.length).toBe(10);

    // Verify scenes are created in MySQL
    const dbScenes = await prisma.scene.findMany({
      where: { tourId: tour.id },
      orderBy: { sortOrder: 'asc' },
    });

    expect(dbScenes.length).toBe(10);
    expect(dbScenes[0].sceneType).toBe('OUTDOOR');
    expect(dbScenes[3].sceneType).toBe('TRANSITION');
    expect(dbScenes[5].sceneType).toBe('INDOOR');
  });

  it('Step 4: Should connect outdoor and indoor panoramas via bidirectional navigation hotspots', async () => {
    const scenes = await prisma.scene.findMany({
      where: { tourId: testTourId },
      orderBy: { sortOrder: 'asc' },
    });

    // Create chain navigation: 0 <-> 1 <-> 2 <-> 3 <-> 4 <-> 5 <-> 6 <-> 7 <-> 8 <-> 9
    for (let i = 0; i < scenes.length - 1; i++) {
      const current = scenes[i];
      const next = scenes[i + 1];

      // Forward hotspot
      await prisma.hotspot.create({
        data: {
          tourId: testTourId,
          sourceSceneId: current.id,
          targetSceneId: next.id,
          type: 'NAVIGATION',
          yaw: 0.2,
          pitch: -0.1,
          targetYaw: 0.0,
          targetPitch: 0.0,
          label: `Menuju ${next.name}`,
        },
      });

      // Backward hotspot (bidirectional return link)
      await prisma.hotspot.create({
        data: {
          tourId: testTourId,
          sourceSceneId: next.id,
          targetSceneId: current.id,
          type: 'NAVIGATION',
          yaw: -3.1,
          pitch: -0.1,
          targetYaw: 0.0,
          targetPitch: 0.0,
          label: `Kembali ke ${current.name}`,
        },
      });
    }

    // Add info beacon hotspot in scene 5
    await prisma.hotspot.create({
      data: {
        tourId: testTourId,
        sourceSceneId: scenes[5].id,
        type: 'INFORMATION',
        yaw: 1.5,
        pitch: 0.0,
        label: 'Informasi Lobi Rektorat',
        contentJson: JSON.stringify({ text: 'Lobi utama pusat informasi kampus.' }),
      },
    });

    // Validate tour graph reachability
    const validation = await GraphService.validateTour(testTourId);
    expect(validation.isValid).toBe(true);
    expect(validation.totalScenes).toBe(10);
    expect(validation.reachableScenesCount).toBe(10);
    expect(validation.criticalErrors.length).toBe(0);
  });

  it('Step 5-6: Should export tour to standalone ZIP via ExportService', async () => {
    const job = await ExportService.createExportJob(testTourId, 'STANDALONE_ZIP');
    expect(job.status).toBe('QUEUED');

    // Wait for export processing to complete
    await ExportService.processExportJob(job.id);

    const completedJob = await prisma.exportJob.findUnique({
      where: { id: job.id },
    });

    if (completedJob?.status === 'FAILED') {
      console.error('EXPORT FAILED REASON:', completedJob.errorMessage);
    }

    expect(completedJob).not.toBeNull();
    expect(completedJob?.status).toBe('COMPLETED');
    expect(completedJob?.progress).toBe(100);
    expect(completedJob?.fileName).toBeDefined();
    expect(completedJob?.fileSize).toBeGreaterThan(1000);

    const zipFilePath = path.join(process.cwd(), 'public', 'exports', completedJob!.fileName!);
    expect(fs.existsSync(zipFilePath)).toBe(true);
  });

  it('Step 7-11: Should extract ZIP and verify all assets and standalone Marzipano viewer run locally', async () => {
    const job = await prisma.exportJob.findFirst({
      where: { tourId: testTourId, type: 'STANDALONE_ZIP', status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
    });

    const zipFilePath = path.join(process.cwd(), 'public', 'exports', job!.fileName!);
    const zip = new AdmZip(zipFilePath);

    // Extract all to testExtractDir
    await fsp.mkdir(testExtractDir, { recursive: true });
    zip.extractAllTo(testExtractDir, true);

    // Check required standalone files
    expect(fs.existsSync(path.join(testExtractDir, 'index.html'))).toBe(true);
    expect(fs.existsSync(path.join(testExtractDir, 'app.js'))).toBe(true);
    expect(fs.existsSync(path.join(testExtractDir, 'style.css'))).toBe(true);
    expect(fs.existsSync(path.join(testExtractDir, 'tour-data.js'))).toBe(true);
    expect(fs.existsSync(path.join(testExtractDir, 'README.txt'))).toBe(true);
    expect(fs.existsSync(path.join(testExtractDir, 'vendor', 'marzipano.js'))).toBe(true);

    // Verify index.html content
    const indexHtml = await fsp.readFile(path.join(testExtractDir, 'index.html'), 'utf-8');
    expect(indexHtml).toContain('<div id="pano">');
    expect(indexHtml).toContain('src="./vendor/marzipano.js"');
    expect(indexHtml).toContain('src="./tour-data.js"');
    expect(indexHtml).toContain('src="./app.js"');

    // Verify tour-data.js content
    const tourDataContent = await fsp.readFile(path.join(testExtractDir, 'tour-data.js'), 'utf-8');
    expect(tourDataContent).toContain('window.TOUR_DATA =');
    expect(tourDataContent).toContain('Grand Campus 360 Full Acceptance Tour');

    // Extract JSON from tour-data.js
    const jsonStr = tourDataContent.replace('// Manifest Konfigurasi Tur Mandiri (Virtual Tour 360°)\nwindow.TOUR_DATA = ', '').replace(/;\s*$/, '');
    const tourData = JSON.parse(jsonStr);

    expect(tourData.scenes.length).toBe(10);

    // Verify each panorama file exists locally on disk
    for (const sc of tourData.scenes) {
      expect(sc.panoramaUrl.startsWith('./panoramas/')).toBe(true);
      const cleanRelative = sc.panoramaUrl.replace('./', '');
      const panoDiskPath = path.join(testExtractDir, cleanRelative);
      expect(fs.existsSync(panoDiskPath)).toBe(true);
      const stat = fs.statSync(panoDiskPath);
      expect(stat.size).toBeGreaterThan(0);
    }

    // Step 8: Start lightweight local static HTTP web server on port 8089 WITHOUT MySQL
    const server = http.createServer((req, res) => {
      let reqPath = req.url?.split('?')[0] || '/';
      if (reqPath === '/') reqPath = '/index.html';

      const filePath = path.join(testExtractDir, reqPath.replace(/^\//, ''));

      if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }

      const ext = path.extname(filePath);
      const mimeMap: Record<string, string> = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.webp': 'image/webp',
        '.jpg': 'image/jpeg',
        '.txt': 'text/plain',
      };

      res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });

    await new Promise<void>((resolve) => server.listen(8089, '127.0.0.1', () => resolve()));

    try {
      // Test HTTP 200 GET requests from the standalone server
      const htmlRes = await fetch('http://127.0.0.1:8089/index.html');
      expect(htmlRes.status).toBe(200);
      const htmlText = await htmlRes.text();
      expect(htmlText).toContain('Virtual Tour 360°');

      const jsRes = await fetch('http://127.0.0.1:8089/app.js');
      expect(jsRes.status).toBe(200);

      const marzipanoRes = await fetch('http://127.0.0.1:8089/vendor/marzipano.js');
      expect(marzipanoRes.status).toBe(200);

      const dataRes = await fetch('http://127.0.0.1:8089/tour-data.js');
      expect(dataRes.status).toBe(200);

      const panoRes = await fetch(`http://127.0.0.1:8089/${tourData.scenes[0].panoramaUrl.replace('./', '')}`);
      expect(panoRes.status).toBe(200);
      expect(panoRes.headers.get('content-type')).toBe('image/webp');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('Step 12: Should test project backup export, zip security, and import into a new project', async () => {
    // 1. Export project backup
    const backupJob = await ExportService.createExportJob(testTourId, 'PROJECT_BACKUP');
    await ExportService.processExportJob(backupJob.id);

    const completedBackupJob = await prisma.exportJob.findUnique({
      where: { id: backupJob.id },
    });

    expect(completedBackupJob?.status).toBe('COMPLETED');
    expect(completedBackupJob?.fileName).toContain('.vtbackup.zip');

    const backupFilePath = path.join(process.cwd(), 'public', 'exports', completedBackupJob!.fileName!);
    const backupBuffer = await fsp.readFile(backupFilePath);

    // 2. Test Zip Slip Security Protection
    const validZip = new AdmZip(backupBuffer);
    const validEntries = BackupService.validateZipSecurity(validZip);
    expect(validEntries.length).toBeGreaterThan(0);

    // Test malicious zip entry rejection with directory traversal
    const mockMaliciousZip = {
      getEntries: () => [
        { entryName: '../../etc/passwd', header: { size: 100 } } as any,
      ],
    };
    expect(() => {
      BackupService.validateZipSecurity(mockMaliciousZip as any);
    }).toThrow(/Zip Slip/);

    // 3. Test Import backup
    const importResult = await BackupService.importBackup(backupBuffer, adminUserId);

    expect(importResult.tourId).toBeDefined();
    expect(importResult.tourId).not.toBe(testTourId); // New unique ID
    expect(importResult.scenesCount).toBe(10);
    expect(importResult.hotspotsCount).toBeGreaterThan(15);

    // Verify restored tour in database
    const restoredTour = await prisma.tour.findUnique({
      where: { id: importResult.tourId },
      include: {
        scenes: {
          include: { sourceHotspots: true, panoramaAsset: true },
        },
      },
    });

    expect(restoredTour).not.toBeNull();
    expect(restoredTour?.scenes.length).toBe(10);
    expect(restoredTour?.slug).toContain('-imported');

    // Clean up restored tour
    await prisma.tour.delete({ where: { id: importResult.tourId } }).catch(() => {});
  });
});
