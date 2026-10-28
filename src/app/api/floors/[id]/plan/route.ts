import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authorizeUser } from '@/server/rbac/guards';
import { BuildingService } from '@/server/services/building.service';

const floorPlanSchema = z.object({
  mediaAssetId: z.string().min(1),
  width: z.number().int(),
  height: z.number().int(),
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
    const parsed = floorPlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const plan = await BuildingService.linkFloorPlan(
      id,
      parsed.data.mediaAssetId,
      parsed.data.width,
      parsed.data.height
    );

    return NextResponse.json({ success: true, data: plan });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Gagal menghubungkan denah lantai' }, { status: 500 });
  }
}