import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authorizeUser } from '@/server/rbac/guards';
import { SceneService } from '@/server/services/scene.service';
import prisma from '@/lib/prisma';

const createSceneSchema = z.object({
  panoramaAssetId: z.string().min(1, 'Panorama wajib dipilih'),
  name: z.string().min(2, 'Nama scene minimal 2 karakter'),
  description: z.string().optional(),
  sceneType: z.enum(['OUTDOOR', 'INDOOR', 'TRANSITION']).optional(),
  buildingId: z.string().nullable().optional(),
  floorId: z.string().nullable().optional(),
  initialYaw: z.number().optional(),
  initialPitch: z.number().optional(),
  initialFov: z.number().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeUser('tours.view');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const scenes = await prisma.scene.findMany({
      where: { tourId: id },
      orderBy: { sortOrder: 'asc' },
      include: {
        panoramaAsset: { include: { mediaAsset: true } },
        building: true,
        floor: true,
        sourceHotspots: {
          include: {
            targetScene: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: scenes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Gagal memuat daftar scene' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeUser('scenes.create');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = createSceneSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Input scene tidak valid' },
        { status: 400 }
      );
    }

    const scene = await SceneService.create({
      tourId: id,
      ...parsed.data,
    });

    return NextResponse.json({ success: true, data: scene }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Gagal menambahkan scene' }, { status: 500 });
  }
}