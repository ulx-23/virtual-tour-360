import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authorizeUser } from '@/server/rbac/guards';
import { BuildingService } from '@/server/services/building.service';

const createFloorSchema = z.object({
  name: z.string().min(1, 'Nama lantai wajib diisi'),
  levelNumber: z.number().int().default(1),
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
    const parsed = createFloorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const floor = await BuildingService.createFloor(id, parsed.data.name, parsed.data.levelNumber);
    return NextResponse.json({ success: true, data: floor }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Gagal membuat lantai' }, { status: 500 });
  }
}