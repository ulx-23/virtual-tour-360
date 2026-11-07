import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import prisma from '@/lib/prisma';
import { getSession, createSession, fetchFullUserSession } from '@/server/auth/session';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = (formData.get('avatar') || formData.get('file')) as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada berkas foto yang dipilih' },
        { status: 400 }
      );
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Format tidak didukung. Harap unggah foto berekstensi JPG, PNG, atau WebP.' },
        { status: 400 }
      );
    }

    // 10MB maximum size
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Ukuran foto maksimal 10MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const inputBuffer = Buffer.from(bytes);

    // Crop to square 400x400 and convert to optimized WebP
    const outputBuffer = await sharp(inputBuffer)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 85 })
      .toBuffer();

    // Ensure directory exists in public/uploads/avatars
    const avatarsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }

    const filename = `avatar-${session.userId}-${Date.now()}.webp`;
    const fullPath = path.join(avatarsDir, filename);
    const storageKey = `uploads/avatars/${filename}`;

    // Write file to disk
    fs.writeFileSync(fullPath, outputBuffer);

    // Delete old avatar file if existed
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { avatar: true },
    });

    if (user?.avatar) {
      const oldFullPath = path.join(process.cwd(), 'public', user.avatar);
      if (fs.existsSync(oldFullPath)) {
        try {
          fs.unlinkSync(oldFullPath);
        } catch {}
      }
    }

    // Update database
    await prisma.user.update({
      where: { id: session.userId },
      data: { avatar: storageKey },
    });

    // Refresh JWT session cookie
    const updatedSession = await fetchFullUserSession(session.userId);
    if (updatedSession) {
      await createSession(updatedSession);
    }

    return NextResponse.json({
      success: true,
      message: 'Foto profil berhasil diperbarui',
      data: {
        avatar: storageKey,
        avatarUrl: `/${storageKey}`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal memproses unggahan foto profil' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { avatar: true },
    });

    if (user?.avatar) {
      const oldFullPath = path.join(process.cwd(), 'public', user.avatar);
      if (fs.existsSync(oldFullPath)) {
        try {
          fs.unlinkSync(oldFullPath);
        } catch {}
      }
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: { avatar: null },
    });

    // Refresh session
    const updatedSession = await fetchFullUserSession(session.userId);
    if (updatedSession) {
      await createSession(updatedSession);
    }

    return NextResponse.json({
      success: true,
      message: 'Foto profil berhasil dihapus',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menghapus foto profil' },
      { status: 500 }
    );
  }
}

