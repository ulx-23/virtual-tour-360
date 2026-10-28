import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authorizeUser } from '@/server/rbac/guards';
import { HotspotService } from '@/server/services/hotspot.service';
import prisma from '@/lib/prisma';

const createHotspotSchema = z.object({
  tourId: z.string().min(1),
  targetSceneId: z.string().nullable().optional(),
  type: z.enum(['NAVIGATION', 'INFORMATION', 'IMAGE', 'VIDEO', 'EXTERNAL_LINK', 'FLOOR_NAVIGATION']).optional(),
  yaw: z.number(),
  pitch: z.number(),
  targetYaw: z.number().nullable().optional(),
  targetPitch: z.number().nullable().optional(),
  label: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  contentJson: z.string().nullable().optional(),
  createReturnHotspot: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeUser('tours.view');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const hotspots = await prisma.hotspot.findMany({
      where: { sourceSceneId: id },
      orderBy: { sortOrder: 'asc' },
      include: {
        targetScene: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, data: hotspots });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Gagal mengambil hotspot scene' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeUser('hotspots.manage');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = createHotspotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Input hotspot tidak valid' },
        { status: 400 }
      );
    }

    const result = await HotspotService.create({
      sourceSceneId: id,
      ...parsed.data,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Gagal menambahkan hotspot' }, { status: 500 });
  }
}