import { NextRequest, NextResponse } from 'next/server';
import { authorizeUser } from '@/server/rbac/guards';
import { BackupService } from '@/server/services/backup.service';

export async function POST(req: NextRequest) {
  const auth = await authorizeUser('tours.create');
  if (!auth.authorized) return auth.response;

  try {
    const formData = await req.formData();
    const file = (formData.get('file') || formData.get('backup')) as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Berkas arsip (.vtbackup.zip) wajib diunggah' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.zip') && !file.name.endsWith('.vtbackup')) {
      return NextResponse.json(
        { success: false, error: 'Format berkas tidak valid. Harap unggah berkas .zip atau .vtbackup.zip' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await BackupService.importBackup(buffer, auth.session.userId);

    return NextResponse.json(
      {
        success: true,
        message: `Proyek tur "${result.title}" berhasil dipulihkan (${result.scenesCount} scene, ${result.hotspotsCount} hotspot)`,
        data: result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memulihkan proyek dari backup' },
      { status: 400 }
    );
  }
}

