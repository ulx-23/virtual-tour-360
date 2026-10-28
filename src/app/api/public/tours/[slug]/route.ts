import { NextRequest, NextResponse } from 'next/server';
import { PublishingService } from '@/server/services/publishing.service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const manifest = await PublishingService.getPublicTour(slug);

    if (!manifest) {
      return NextResponse.json(
        { success: false, error: 'Virtual tour tidak ditemukan atau belum dipublikasikan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: manifest });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Gagal memuat tur publik' }, { status: 500 });
  }
}