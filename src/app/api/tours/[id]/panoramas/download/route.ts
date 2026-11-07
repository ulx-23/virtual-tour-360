import { NextRequest, NextResponse } from 'next/server';
import { authorizeUser } from '@/server/rbac/guards';
import { ExportService } from '@/server/services/export.service';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeUser('tours.view');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const job = await ExportService.createExportJob(id, 'ORIGINAL_PANORAMAS');

    return NextResponse.json(
      {
        success: true,
        message: 'Pengunduhan panorama asli sedang dipersiapkan',
        data: job,
      },
      { status: 202 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyiapkan pengunduhan panorama asli' },
      { status: 500 }
    );
  }
}

