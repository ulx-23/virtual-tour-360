import { NextRequest, NextResponse } from 'next/server';
import { authorizeUser } from '@/server/rbac/guards';
import { MediaService } from '@/server/services/media.service';

export async function POST(req: NextRequest) {
  const auth = await authorizeUser('media.upload');
  if (!auth.authorized) return auth.response;

  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada file yang diunggah' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

    for (const file of files) {
      if (!allowedMimeTypes.includes(file.type)) {
        errors.push({
          filename: file.name,
          error: `Format ${file.type} tidak didukung. Harap gunakan JPG, PNG, atau WebP.`,
        });
        continue;
      }

      // Max file size 50MB
      if (file.size > 50 * 1024 * 1024) {
        errors.push({
          filename: file.name,
          error: 'Ukuran file melebihi batas maksimum 50MB.',
        });
        continue;
      }

      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const processed = await MediaService.processPanoramaUpload(
          buffer,
          file.name,
          file.type
        );
        results.push(processed);
      } catch (err: any) {
        errors.push({
          filename: file.name,
          error: err.message || 'Gagal memproses file gambar',
        });
      }
    }

    return NextResponse.json({
      success: results.length > 0,
      data: {
        uploaded: results,
        failed: errors,
      },
    });
  } catch (error: any) {
    console.error('Media upload route error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan internal saat mengunggah media' },
      { status: 500 }
    );
  }
}