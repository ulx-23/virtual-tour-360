import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/server/auth/session';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const isSuperOrAdmin =
    session.roles.includes('SUPER_ADMIN') || session.roles.includes('ADMIN');
  if (!isSuperOrAdmin) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Hanya Admin yang dapat menghapus log audit' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;

    const existingLog = await prisma.auditLog.findUnique({
      where: { id },
    });

    if (!existingLog) {
      return NextResponse.json(
        { success: false, error: 'Log audit tidak ditemukan' },
        { status: 404 }
      );
    }

    await prisma.auditLog.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Log audit berhasil dihapus',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus log audit' },
      { status: 500 }
    );
  }
}

