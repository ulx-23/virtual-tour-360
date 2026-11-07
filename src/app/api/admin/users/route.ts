import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSession } from '@/server/auth/session';
import { UserStatus } from '@prisma/client';

const createUserSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'VIEWER']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const roleFilter = searchParams.get('role') || '';
  const statusFilter = searchParams.get('status') || '';

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }

  if (statusFilter && ['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(statusFilter)) {
    where.status = statusFilter as UserStatus;
  }

  if (roleFilter) {
    where.roles = {
      some: {
        role: {
          name: roleFilter,
        },
      },
    };
  }

  const users = await prisma.user.findMany({
    where,
    include: {
      roles: {
        include: { role: true },
      },
      _count: {
        select: { tours: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    success: true,
    data: {
      currentUserId: session.userId,
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        status: u.status,
        createdAt: u.createdAt,
        roles: u.roles.map((r) => r.role.name),
        tourCount: u._count.tours,
      })),
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Data tidak valid' },
        { status: 400 }
      );
    }

    const { name, email, password, role, status } = parsed.data;

    // Check email uniqueness
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Alamat email sudah terdaftar' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Find target role
    const roleRecord = await prisma.role.findUnique({
      where: { name: role },
    });

    if (!roleRecord) {
      return NextResponse.json(
        { success: false, error: `Peran ${role} tidak ditemukan dalam sistem` },
        { status: 400 }
      );
    }

    // Create user with transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          passwordHash,
          status: status as UserStatus,
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: roleRecord.id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: session.userId,
          action: 'USER_CREATED',
          entityType: 'User',
          entityId: user.id,
          metadataJson: JSON.stringify({ email: user.email, role }),
        },
      });

      return user;
    });

    return NextResponse.json({
      success: true,
      message: `Pengguna ${newUser.name} berhasil ditambahkan`,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        status: newUser.status,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menambahkan pengguna baru' },
      { status: 500 }
    );
  }
}

