import { NextRequest, NextResponse } from 'next/server';
import { authorizeUser } from '@/server/rbac/guards';
import { PublishingService } from '@/server/services/publishing.service';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeUser('tours.publish');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const result = await PublishingService.publishTour(id, auth.session.userId);
    return NextResponse.json({
      success: true,
      message: 'Virtual tour berhasil dipublikasikan!',
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mempublikasikan tur' },
      { status: 400 }
    );
  }
}