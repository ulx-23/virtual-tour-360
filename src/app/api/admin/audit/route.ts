import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/server/auth/session';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const isSuperOrAdmin =
    session.roles.includes('SUPER_ADMIN') || session.roles.includes('ADMIN');
  if (!isSuperOrAdmin && !session.permissions.includes('audit.view')) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Anda tidak memiliki akses ke audit log' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const actionFilter = searchParams.get('action') || '';
  const entityFilter = searchParams.get('entity') || '';
  const daysFilter = searchParams.get('days') || 'all';
  const autoPrune = searchParams.get('autoPrune') === 'true';

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let prunedCount = 0;
  // If autoPrune is requested, delete logs older than 30 days (1 bulan 1 kali)
  if (autoPrune && isSuperOrAdmin) {
    const pruneResult = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });
    prunedCount = pruneResult.count;

    if (prunedCount > 0) {
      await prisma.auditLog.create({
        data: {
          actorId: session.userId,
          action: 'AUTO_PURGE_AUDIT_LOGS_MONTHLY',
          entityType: 'AuditLog',
          entityId: 'SYSTEM',
          metadataJson: JSON.stringify({
            deletedCount: prunedCount,
            reason: 'Siklus Pembersihan Otomatis Bulanan (> 30 Hari)',
            timestamp: now.toISOString(),
          }),
        },
      });
    }
  }

  // Calculate statistics
  const [totalLogs, logsPast30Days, logsOlderThan30Days, logsToday] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.auditLog.count({ where: { createdAt: { lt: thirtyDaysAgo } } }),
    prisma.auditLog.count({ where: { createdAt: { gte: startOfToday } } }),
  ]);

  // Build query where clause
  const where: any = {};

  if (search) {
    where.OR = [
      { action: { contains: search } },
      { entityType: { contains: search } },
      { entityId: { contains: search } },
      {
        actor: {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        },
      },
    ];
  }

  if (actionFilter) {
    where.action = actionFilter;
  }

  if (entityFilter) {
    where.entityType = entityFilter;
  }

  if (daysFilter !== 'all') {
    const daysNum = parseInt(daysFilter, 10);
    if (!isNaN(daysNum) && daysNum > 0) {
      const filterDate = new Date(now.getTime() - daysNum * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: filterDate };
    }
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      logs,
      stats: {
        totalLogs,
        logsPast30Days,
        logsOlderThan30Days,
        logsToday,
      },
      prunedCount,
      userRole: session.roles[0] || 'VIEWER',
      isSuperOrAdmin,
    },
  });
}

// Bulk delete / retention purge endpoint
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const isSuperOrAdmin =
    session.roles.includes('SUPER_ADMIN') || session.roles.includes('ADMIN');
  if (!isSuperOrAdmin) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Hanya Admin yang dapat menghapus riwayat audit log' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { olderThanDays, all } = body;

    const now = new Date();
    let whereCondition: any = {};
    let description = 'Seluruh riwayat log';

    if (all === true || olderThanDays === 0) {
      whereCondition = {};
      description = 'Seluruh riwayat audit log';
    } else {
      const days = typeof olderThanDays === 'number' ? olderThanDays : 30;
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      whereCondition = {
        createdAt: {
          lt: cutoffDate,
        },
      };
      description = `Log yang berumur lebih dari ${days} hari (Pembersihan Bulanan)`;
    }

    const deleteResult = await prisma.auditLog.deleteMany({
      where: whereCondition,
    });

    // Record the audit purge event
    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        action: 'PURGE_AUDIT_LOGS',
        entityType: 'AuditLog',
        entityId: 'BATCH',
        metadataJson: JSON.stringify({
          deletedCount: deleteResult.count,
          scope: description,
          purgedBy: session.name,
          timestamp: now.toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${deleteResult.count} riwayat audit log (${description}).`,
      deletedCount: deleteResult.count,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus audit log' },
      { status: 500 }
    );
  }
}

