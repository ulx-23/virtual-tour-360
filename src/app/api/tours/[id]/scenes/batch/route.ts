import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authorizeUser } from '@/server/rbac/guards';
import { SceneMergerService } from '@/server/services/scene-merger.service';

const batchSchema = z.object({
  items: z.array(
    z.object({
      panoramaAssetId: z.string().min(1, 'ID panorama wajib ada'),
      name: z.string().optional(),
      sceneType: z.enum(['OUTDOOR', 'INDOOR', 'TRANSITION']).optional(),
      buildingId: z.string().nullable().optional(),
      floorId: z.string().nullable().optional(),
    })
  ).min(1, 'Pilih minimal satu panorama'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeUser('scenes.create');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = batchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Data batch tidak valid' },
        { status: 400 }
      );
    }

    const result = await SceneMergerService.batchCreateScenes(id, parsed.data.items);

    return NextResponse.json(
      {
        success: true,
        message: `${result.createdCount} scene berhasil ditambahkan ke tur`,
        data: result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memproses batch merger scene' },
      { status: 500 }
    );
  }
}

