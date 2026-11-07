import { NextRequest, NextResponse } from 'next/server';
import { authorizeUser } from '@/server/rbac/guards';
import { MediaService } from '@/server/services/media.service';

export async function GET(req: NextRequest) {
  const auth = await authorizeUser('tours.view');
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const panoramaOnly = searchParams.get('panoramaOnly') === 'true';

    const result = await MediaService.listMedia({ page, limit, panoramaOnly });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data media' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await authorizeUser('media.delete');
  if (!auth.authorized) return auth.response;

  try {
    const result = await MediaService.cleanupUnusedMedia();
    return NextResponse.json({
      success: true,
      message: result.message,
      data: { deletedCount: result.deletedCount },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal membersihkan media yang tidak terpakai' },
      { status: 500 }
    );
  }
}
