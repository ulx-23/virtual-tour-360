import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSession, createSession, fetchFullUserSession } from '@/server/auth/session';

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().email('Format email tidak valid'),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Password baru minimal 6 karakter').optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      roles: {
        include: { role: true },
      },
      _count: {
        select: { tours: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ success: false, error: 'Pengguna tidak ditemukan' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      status: user.status,
      createdAt: user.createdAt,
      roles: user.roles.map((r) => r.role.name),
      tourCount: user._count.tours,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Data tidak valid' },
        { status: 400 }
      );
    }

    const { name, email, currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    // Check if new email is used by another account
    if (email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          id: { not: user.id },
        },
      });

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Alamat email sudah digunakan oleh akun lain' },
          { status: 400 }
        );
      }
    }

    const updateData: { name: string; email: string; passwordHash?: string } = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
    };

    // If changing password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: 'Kata sandi saat ini harus diisi untuk mengubah kata sandi' },
          { status: 400 }
        );
      }

      const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentValid) {
        return NextResponse.json(
          { success: false, error: 'Kata sandi saat ini tidak sesuai' },
          { status: 400 }
        );
      }

      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    // Refresh JWT session with updated name and email
    const fullSession = await fetchFullUserSession(updatedUser.id);
    if (fullSession) {
      await createSession(fullSession);
    }

    // Log in audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'USER_PROFILE_UPDATED',
        entityType: 'User',
        entityId: user.id,
        metadataJson: JSON.stringify({
          updatedFields: Object.keys(updateData).filter((k) => k !== 'passwordHash'),
          passwordChanged: !!newPassword,
        }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        roles: updatedUser.roles.map((r) => r.role.name),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal memperbarui profil' },
      { status: 500 }
    );
  }
}

