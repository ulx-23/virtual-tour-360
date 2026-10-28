import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authorizeUser } from '@/server/rbac/guards';
import { BuildingService } from '@/server/services/building.service';

const createBuildingSchema = z.object({
  tourId: z.string().min(1),
  name: z.string().min(2, 'Nama gedung minimal 2 karakter'),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await authorizeUser('buildings.manage');
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const parsed = createBuildingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const building = await BuildingService.createBuilding(
      parsed.data.tourId,
      parsed.data.name,
      parsed.data.description
    );

    return NextResponse.json({ success: true, data: building }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Gagal membuat gedung' }, { status: 500 });
  }
}