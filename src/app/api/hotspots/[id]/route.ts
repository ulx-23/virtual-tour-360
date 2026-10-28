import { NextRequest, NextResponse } from 'next/server';
import { authorizeUser } from '@/server/rbac/guards';
import { HotspotService } from '@/server/services/hotspot.service';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeUser('hotspots.manage');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await HotspotService.update(id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Gagal memperbarui hotspot' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeUser('hotspots.manage');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    await HotspotService.delete(id);
    return NextResponse.json({ success: true, message: 'Hotspot berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Gagal menghapus hotspot' }, { status: 500 });
  }
}