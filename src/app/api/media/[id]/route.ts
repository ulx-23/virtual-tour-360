import { NextRequest, NextResponse } from 'next/server';
import { authorizeUser } from '@/server/rbac/guards';
import { MediaService } from '@/server/services/media.service';
import { validateMediaFilename } from '@/server/services/media-filename';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const renameSchema = z.object({ filename: z.string().min(1).max(180) });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeUser('media.upload');
  if (!auth.authorized) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Data nama file tidak valid.' }, { status: 400 });
  }

  const parsed = renameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Nama file harus berisi 1–180 karakter.' }, { status: 400 });
  }

  try {
    const { id } = await params;
    const media = await prisma.mediaAsset.findUnique({ where: { id }, select: { originalFilename: true } });
    if (!media) {
      return NextResponse.json({ success: false, error: 'File media tidak ditemukan.' }, { status: 404 });
    }

    let filename: string;
    try {
      filename = validateMediaFilename(media.originalFilename, parsed.data.filename);
    } catch (error) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }

    const updated = await prisma.mediaAsset.update({
      where: { id },
      data: { originalFilename: filename },
      select: { id: true, originalFilename: true },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Rename media error:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengubah nama file.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeUser('media.delete');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === 'true';

    const result = await MediaService.deleteMedia(id, force);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus file media' },
      { status: 500 }
    );
  }
}

