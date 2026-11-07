import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSession } from '@/server/auth/session';
import { UserStatus } from '@prisma/client';

const updateUserSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().email('Format email tidak valid'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'VIEWER']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  newPassword: z.string().min(6, 'Password baru minimal 6 karakter').optional().or(z.literal('')),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
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
      status: user.status,
      roles: user.roles.map((r) => r.role.name),
      tourCount: user._count.tours,
      createdAt: user.createdAt,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Data tidak valid' },
        { status: 400 }
      );
    }

    const { name, email, role, status, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    // Check if new email is used by another account
    if (email.toLowerCase().trim() !== user.email.toLowerCase()) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase().trim(),
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

    // Role check: prevent demoting oneself if the user is the only SUPER_ADMIN
    if (user.id === session.userId && role !== 'SUPER_ADMIN') {
      const superAdminCount = await prisma.userRole.count({
        where: { role: { name: 'SUPER_ADMIN' } },
      });
      if (superAdminCount <= 1) {
        return NextResponse.json(
          { success: false, error: 'Tidak dapat menghapus peran SUPER_ADMIN terakhir pada akun Anda sendiri' },
          { status: 400 }
        );
      }
    }

    // Find role record
    const roleRecord = await prisma.role.findUnique({
      where: { name: role },
    });

    if (!roleRecord) {
      return NextResponse.json(
        { success: false, error: `Peran ${role} tidak valid` },
        { status: 400 }
      );
    }

    const updateData: { name: string; email: string; status: UserStatus; passwordHash?: string } = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      status: status as UserStatus,
    };

    if (newPassword && newPassword.trim().length >= 6) {
      updateData.passwordHash = await bcrypt.hash(newPassword.trim(), 10);
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update User details
      await tx.user.update({
        where: { id: user.id },
        data: updateData,
      });

      // 2. Update role mapping: delete existing roles for this user and assign the new role
      await tx.userRole.deleteMany({
        where: { userId: user.id },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: roleRecord.id,
        },
      });

      // 3. Log Audit
      await tx.auditLog.create({
        data: {
          actorId: session.userId,
          action: 'USER_UPDATED',
          entityType: 'User',
          entityId: user.id,
          metadataJson: JSON.stringify({
            updatedFields: Object.keys(updateData).filter((k) => k !== 'passwordHash'),
            newRole: role,
            passwordReset: !!newPassword,
          }),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Data pengguna ${name} berhasil diperbarui`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal memperbarui pengguna' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // 1. Prevent self-deletion
  if (id === session.userId) {
    return NextResponse.json(
      { success: false, error: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang masuk' },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      roles: {
        include: { role: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ success: false, error: 'Pengguna tidak ditemukan' }, { status: 404 });
  }

  // 2. Prevent deleting the last SUPER_ADMIN
  const isSuperAdmin = user.roles.some((r) => r.role.name === 'SUPER_ADMIN');
  if (isSuperAdmin) {
    const superAdminCount = await prisma.userRole.count({
      where: { role: { name: 'SUPER_ADMIN' } },
    });
    if (superAdminCount <= 1) {
      return NextResponse.json(
        { success: false, error: 'Tidak dapat menghapus akun SUPER_ADMIN terakhir dalam sistem' },
        { status: 400 }
      );
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId: id } });
      await tx.user.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          actorId: session.userId,
          action: 'USER_DELETED',
          entityType: 'User',
          entityId: id,
          metadataJson: JSON.stringify({ deletedEmail: user.email, deletedName: user.name }),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Akun ${user.name} (${user.email}) berhasil dihapus`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menghapus pengguna' },
      { status: 500 }
    );
  }
}

