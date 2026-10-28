import { NextRequest, NextResponse } from 'next/server';
import { authorizeUser } from '@/server/rbac/guards';
import { SceneService } from '@/server/services/scene.service';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeUser('scenes.update');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await SceneService.update(id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Gagal memperbarui scene' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeUser('scenes.delete');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    await SceneService.delete(id);
    return NextResponse.json({ success: true, message: 'Scene berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Gagal menghapus scene' }, { status: 500 });
  }
}