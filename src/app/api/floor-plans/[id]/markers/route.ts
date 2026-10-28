import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authorizeUser } from '@/server/rbac/guards';
import { BuildingService } from '@/server/services/building.service';

const markerSchema = z.object({
  sceneId: z.string().min(1),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeUser('buildings.manage');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = markerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const marker = await BuildingService.setFloorPlanMarker(
      id,
      parsed.data.sceneId,
      parsed.data.x,
      parsed.data.y
    );

    return NextResponse.json({ success: true, data: marker });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Gagal menyimpan marker denah' }, { status: 500 });
  }
}