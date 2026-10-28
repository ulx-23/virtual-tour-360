import { NextRequest, NextResponse } from 'next/server';
import { authorizeUser } from '@/server/rbac/guards';
import { TourService } from '@/server/services/tour.service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeUser('tours.view');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const tour = await TourService.getById(id);
    if (!tour) {
      return NextResponse.json({ success: false, error: 'Tour tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: tour });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Gagal memuat detail tur' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeUser('tours.update');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await TourService.update(id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Gagal memperbarui tur' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeUser('tours.delete');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    await TourService.delete(id);
    return NextResponse.json({ success: true, message: 'Tour berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Gagal menghapus tur' }, { status: 500 });
  }
}