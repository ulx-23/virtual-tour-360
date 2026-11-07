import { PrismaClient, HotspotType, SceneType } from '@prisma/client';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function ensureSamplePanorama(
  filename: string,
  title: string,
  subtitle: string,
  theme: 'outdoor' | 'lobby' | 'library'
) {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'panoramas');
  const thumbDir = path.join(process.cwd(), 'public', 'uploads', 'thumbnails');
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.mkdirSync(thumbDir, { recursive: true });

  const filePath = path.join(uploadDir, filename);
  const thumbFilename = filename.replace('.jpg', '.webp');
  const thumbPath = path.join(thumbDir, thumbFilename);

  if (!fs.existsSync(filePath)) {
    const width = 2000;
    const height = 1000;

    const gradients = {
      outdoor: {
        skyTop: '#1e3a8a',
        skyMid: '#38bdf8',
        horizon: '#bae6fd',
        ground: '#15803d',
        groundBottom: '#14532d',
      },
      lobby: {
        skyTop: '#0f172a',
        skyMid: '#334155',
        horizon: '#e2e8f0',
        ground: '#cbd5e1',
        groundBottom: '#475569',
      },
      library: {
        skyTop: '#311042',
        skyMid: '#6b21a8',
        horizon: '#d8b4fe',
        ground: '#78350f',
        groundBottom: '#451a03',
      },
    };

    const g = gradients[theme];

    const svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${g.skyTop}"/>
            <stop offset="65%" stop-color="${g.skyMid}"/>
            <stop offset="100%" stop-color="${g.horizon}"/>
          </linearGradient>
          <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${g.ground}"/>
            <stop offset="100%" stop-color="${g.groundBottom}"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${width}" height="${height / 2}" fill="url(#skyGrad)" />
        <line x1="0" y1="${height / 2}" x2="${width}" y2="${height / 2}" stroke="rgba(255,255,255,0.4)" stroke-width="2" stroke-dasharray="8 8" />
        <rect x="0" y="${height / 2}" width="${width}" height="${height / 2}" fill="url(#groundGrad)" />
        <line x1="${width * 0.25}" y1="0" x2="${width * 0.25}" y2="${height}" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
        <line x1="${width * 0.5}" y1="0" x2="${width * 0.5}" y2="${height}" stroke="rgba(255,255,255,0.25)" stroke-width="2" />
        <line x1="${width * 0.75}" y1="0" x2="${width * 0.75}" y2="${height}" stroke="rgba(255,255,255,0.15)" stroke-width="1" />

        <rect x="${width * 0.5 - 280}" y="${height * 0.5 - 120}" width="560" height="180" rx="24" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(255, 255, 255, 0.3)" stroke-width="3" />
        <text x="${width * 0.5}" y="${height * 0.5 - 50}" font-family="sans-serif" font-size="34" font-weight="bold" fill="#ffffff" text-anchor="middle">${title.replace(/&/g, '&amp;')}</text>
        <text x="${width * 0.5}" y="${height * 0.5 - 10}" font-family="sans-serif" font-size="20" fill="#93c5fd" text-anchor="middle">${subtitle.replace(/&/g, '&amp;')}</text>
        <text x="${width * 0.5}" y="${height * 0.5 + 35}" font-family="sans-serif" font-size="16" fill="#cbd5e1" text-anchor="middle">360° Equirectangular Scene (2:1 Ratio)</text>

        <text x="${width * 0.5}" y="80" font-family="sans-serif" font-size="28" font-weight="bold" fill="rgba(255,255,255,0.7)" text-anchor="middle">NORTH (0°)</text>
        <text x="${width * 0.75}" y="80" font-family="sans-serif" font-size="28" font-weight="bold" fill="rgba(255,255,255,0.7)" text-anchor="middle">EAST (90°)</text>
        <text x="${width * 0.25}" y="80" font-family="sans-serif" font-size="28" font-weight="bold" fill="rgba(255,255,255,0.7)" text-anchor="middle">WEST (270°)</text>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .jpeg({ quality: 90 })
      .toFile(filePath);

    await sharp(filePath)
      .resize(400, 200)
      .webp({ quality: 80 })
      .toFile(thumbPath);
  }

  const stat = fs.statSync(filePath);
  return {
    storageKey: `uploads/panoramas/${filename}`,
    thumbnailKey: `uploads/thumbnails/${thumbFilename}`,
    mimeType: 'image/jpeg',
    fileSize: stat.size,
    width: 2000,
    height: 1000,
  };
}

async function main() {
  console.log('--- Generating Demo Campus Tour ---');
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@virtualtour.test' },
  });

  if (!adminUser) {
    throw new Error('Admin user not found, run npm run seed first');
  }

  const userId = adminUser.id;

  // Clean up any existing demo tour to avoid partial collision
  await prisma.tour.deleteMany({
    where: { slug: 'kampus-virtual-tour-360-demo' },
  });

  // 1. Generate 3 sample panoramas
  const pano1 = await ensureSamplePanorama(
    'demo_campus_plaza.jpg',
    'Gerbang & Plaza Utama Kampus',
    'Area Outdoor • Titik Awal Tur Virtual',
    'outdoor'
  );
  const pano2 = await ensureSamplePanorama(
    'demo_rektorat_lobby.jpg',
    'Lobi Utama Gedung Rektorat',
    'Area Transisi Indoor & Pusat Layanan',
    'lobby'
  );
  const pano3 = await ensureSamplePanorama(
    'demo_digital_library.jpg',
    'Perpustakaan Digital Terpadu',
    'Area Indoor • Ruang Baca & Riset Mahasiswa',
    'library'
  );

  // 2. Save Media Assets & Panorama Assets
  const media1 = await prisma.mediaAsset.create({
    data: {
      originalFilename: 'demo_campus_plaza.jpg',
      storageKey: pano1.storageKey,
      thumbnailKey: pano1.thumbnailKey,
      mimeType: pano1.mimeType,
      fileSize: pano1.fileSize,
      width: pano1.width,
      height: pano1.height,
    },
  });

  const media2 = await prisma.mediaAsset.create({
    data: {
      originalFilename: 'demo_rektorat_lobby.jpg',
      storageKey: pano2.storageKey,
      thumbnailKey: pano2.thumbnailKey,
      mimeType: pano2.mimeType,
      fileSize: pano2.fileSize,
      width: pano2.width,
      height: pano2.height,
    },
  });

  const media3 = await prisma.mediaAsset.create({
    data: {
      originalFilename: 'demo_digital_library.jpg',
      storageKey: pano3.storageKey,
      thumbnailKey: pano3.thumbnailKey,
      mimeType: pano3.mimeType,
      fileSize: pano3.fileSize,
      width: pano3.width,
      height: pano3.height,
    },
  });

  const pa1 = await prisma.panoramaAsset.create({
    data: { mediaAssetId: media1.id, projectionType: 'EQUIRECTANGULAR' },
  });
  const pa2 = await prisma.panoramaAsset.create({
    data: { mediaAssetId: media2.id, projectionType: 'EQUIRECTANGULAR' },
  });
  const pa3 = await prisma.panoramaAsset.create({
    data: { mediaAssetId: media3.id, projectionType: 'EQUIRECTANGULAR' },
  });

  // 3. Create Tour
  const tour = await prisma.tour.create({
    data: {
      title: 'Virtual Campus 360° — Eksplorasi Interaktif',
      slug: 'kampus-virtual-tour-360-demo',
      description:
        'Tur kampus terpadu menghubungkan Gerbang Plaza Utama, Lobi Rektorat Modern, dan Perpustakaan Digital 24/7 dengan navigasi dua arah interaktif.',
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
      ownerId: userId,
      coverMediaId: media1.id,
      publishedAt: new Date(),
    },
  });

  // 4. Create Building & Floor
  const building = await prisma.building.create({
    data: {
      tourId: tour.id,
      name: 'Gedung Rektorat & Pusat Inovasi',
      description: 'Gedung utama administrasi, rektorat, dan fasilitas pembelajaran modern',
      sortOrder: 1,
    },
  });

  const floor = await prisma.floor.create({
    data: {
      buildingId: building.id,
      name: 'Lantai 1 - Lobi & Layanan Terpadu',
      levelNumber: 1,
    },
  });

  // 5. Create 3 Scenes
  const scene1 = await prisma.scene.create({
    data: {
      tourId: tour.id,
      name: 'Gerbang & Plaza Kampus',
      description: 'Titik masuk utama dan taman selamat datang mahasiswa',
      sceneType: SceneType.OUTDOOR,
      panoramaAssetId: pa1.id,
      initialYaw: 0,
      initialPitch: 0,
      sortOrder: 1,
    },
  });

  const scene2 = await prisma.scene.create({
    data: {
      tourId: tour.id,
      name: 'Lobi Utama Rektorat',
      description: 'Area administrasi dan ruang temu publik berpendingin udara',
      sceneType: SceneType.TRANSITION,
      panoramaAssetId: pa2.id,
      buildingId: building.id,
      floorId: floor.id,
      initialYaw: 0,
      initialPitch: 0,
      sortOrder: 2,
    },
  });

  const scene3 = await prisma.scene.create({
    data: {
      tourId: tour.id,
      name: 'Perpustakaan Digital Modern',
      description: 'Pusat riset, koleksi jurnal internasional, dan area belajar kolaboratif',
      sceneType: SceneType.INDOOR,
      panoramaAssetId: pa3.id,
      buildingId: building.id,
      floorId: floor.id,
      initialYaw: 0,
      initialPitch: 0,
      sortOrder: 3,
    },
  });

  // Update startSceneId
  await prisma.tour.update({
    where: { id: tour.id },
    data: { startSceneId: scene1.id },
  });

  // 6. Connect Scenes with Bidirectional Hotspots
  await prisma.hotspot.create({
    data: {
      tourId: tour.id,
      sourceSceneId: scene1.id,
      type: HotspotType.NAVIGATION,
      yaw: 0.15,
      pitch: -0.05,
      label: 'Masuk ke Lobi Utama Rektorat',
      targetSceneId: scene2.id,
      targetYaw: 0,
      targetPitch: 0,
    },
  });

  await prisma.hotspot.create({
    data: {
      tourId: tour.id,
      sourceSceneId: scene2.id,
      type: HotspotType.NAVIGATION,
      yaw: 3.14,
      pitch: -0.05,
      label: 'Keluar ke Plaza Kampus',
      targetSceneId: scene1.id,
      targetYaw: 3.14,
      targetPitch: 0,
    },
  });

  await prisma.hotspot.create({
    data: {
      tourId: tour.id,
      sourceSceneId: scene2.id,
      type: HotspotType.NAVIGATION,
      yaw: 1.25,
      pitch: 0,
      label: 'Menuju Perpustakaan Digital',
      targetSceneId: scene3.id,
      targetYaw: 0,
      targetPitch: 0,
    },
  });

  await prisma.hotspot.create({
    data: {
      tourId: tour.id,
      sourceSceneId: scene3.id,
      type: HotspotType.NAVIGATION,
      yaw: -2.8,
      pitch: 0,
      label: 'Kembali ke Lobi Rektorat',
      targetSceneId: scene2.id,
      targetYaw: -1.25,
      targetPitch: 0,
    },
  });

  await prisma.hotspot.create({
    data: {
      tourId: tour.id,
      sourceSceneId: scene3.id,
      type: HotspotType.INFORMATION,
      yaw: 0.45,
      pitch: 0.1,
      label: 'Fasilitas Smart E-Library',
      contentJson: JSON.stringify({
        title: 'Perpustakaan Digital 24/7',
        body: 'Dilengkapi 50.000+ e-books, high-speed WiFi 6, dan pod belajar hening.',
      }),
    },
  });

  // 7. Tour Publication Snapshot
  const snapshotManifest = {
    id: tour.id,
    title: tour.title,
    slug: tour.slug,
    description: tour.description,
    coverUrl: `/${pano1.storageKey}`,
    startSceneId: scene1.id,
    publishedAt: new Date().toISOString(),
    scenes: [
      {
        id: scene1.id,
        name: scene1.name,
        sceneType: scene1.sceneType,
        panoramaUrl: `/${pano1.storageKey}`,
        hotspots: [
          {
            id: 'hs-1-2',
            type: 'NAVIGATION',
            yaw: 0.15,
            pitch: -0.05,
            label: 'Masuk ke Lobi Utama Rektorat',
            targetSceneId: scene2.id,
          },
        ],
      },
      {
        id: scene2.id,
        name: scene2.name,
        sceneType: scene2.sceneType,
        panoramaUrl: `/${pano2.storageKey}`,
        hotspots: [
          {
            id: 'hs-2-1',
            type: 'NAVIGATION',
            yaw: 3.14,
            pitch: -0.05,
            label: 'Keluar ke Plaza Kampus',
            targetSceneId: scene1.id,
          },
          {
            id: 'hs-2-3',
            type: 'NAVIGATION',
            yaw: 1.25,
            pitch: 0,
            label: 'Menuju Perpustakaan Digital',
            targetSceneId: scene3.id,
          },
        ],
      },
      {
        id: scene3.id,
        name: scene3.name,
        sceneType: scene3.sceneType,
        panoramaUrl: `/${pano3.storageKey}`,
        hotspots: [
          {
            id: 'hs-3-2',
            type: 'NAVIGATION',
            yaw: -2.8,
            pitch: 0,
            label: 'Kembali ke Lobi Rektorat',
            targetSceneId: scene2.id,
          },
          {
            id: 'hs-3-info',
            type: 'INFORMATION',
            yaw: 0.45,
            pitch: 0.1,
            label: 'Fasilitas Smart E-Library',
            contentJson: {
              title: 'Perpustakaan Digital 24/7',
              body: 'Dilengkapi 50.000+ e-books, high-speed WiFi 6, dan pod belajar hening.',
            },
          },
        ],
      },
    ],
  };

  await prisma.tourPublication.create({
    data: {
      tourId: tour.id,
      version: 1,
      publishedBy: userId,
      snapshotJson: JSON.stringify(snapshotManifest),
    },
  });

  // Add dummy views
  await prisma.tourView.createMany({
    data: [
      { tourId: tour.id, sceneId: scene1.id, visitorSessionId: 'demo-session-1' },
      { tourId: tour.id, sceneId: scene1.id, visitorSessionId: 'demo-session-2' },
      { tourId: tour.id, sceneId: scene2.id, visitorSessionId: 'demo-session-3' },
      { tourId: tour.id, sceneId: scene3.id, visitorSessionId: 'demo-session-4' },
    ],
  });

  console.log('[OK] Demo tour seeded successfully! ID:', tour.id);
}

main()
  .catch((e) => {
    console.error('Error seeding demo:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
