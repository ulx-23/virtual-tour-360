import { NextRequest, NextResponse } from 'next/server';
import { authorizeUser } from '@/server/rbac/guards';
import { GraphService } from '@/server/services/graph.service';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeUser('tours.view');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const validation = await GraphService.validateTour(id);
    return NextResponse.json({ success: true, data: validation });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memvalidasi struktur tur' },
      { status: 500 }
    );
  }
}