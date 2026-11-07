import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/lib/prisma';

describe('Audit Log Retention & Monthly Purge System', () => {
  let testUserId: string;
  let recentLogId: string;
  let oldLogId: string;

  beforeAll(async () => {
    // Find or create an admin user for audit log actor relation
    const admin = await prisma.user.findFirst({
      where: { email: 'superadmin@virtualtour.test' },
    });

    if (admin) {
      testUserId = admin.id;
    } else {
      const newUser = await prisma.user.create({
        data: {
          name: 'Audit Test SuperAdmin',
          email: 'audit-test-admin@virtualtour.test',
          passwordHash: 'dummy-hash',
        },
      });
      testUserId = newUser.id;
    }
  });

  it('Step 1: Should create a recent log and an old log (> 35 days ago)', async () => {
    const now = new Date();
    const thirtyFiveDaysAgo = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000);

    // Create recent log
    const recent = await prisma.auditLog.create({
      data: {
        actorId: testUserId,
        action: 'TEST_RECENT_LOGIN',
        entityType: 'User',
        entityId: testUserId,
        metadataJson: JSON.stringify({ ip: '127.0.0.1' }),
        createdAt: now,
      },
    });
    recentLogId = recent.id;
    expect(recent.id).toBeDefined();

    // Create old log simulating a log from last month
    const old = await prisma.auditLog.create({
      data: {
        actorId: testUserId,
        action: 'TEST_OLD_OPERATION',
        entityType: 'Tour',
        entityId: 'tour-123-old',
        metadataJson: JSON.stringify({ note: 'Simulated 35 days old log' }),
        createdAt: thirtyFiveDaysAgo,
      },
    });
    oldLogId = old.id;
    expect(old.id).toBeDefined();
  });

  it('Step 2: Should count logs older than 30 days accurately', async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const olderLogsCount = await prisma.auditLog.count({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    expect(olderLogsCount).toBeGreaterThanOrEqual(1);
  });

  it('Step 3: Should purge logs older than 30 days (1 bulan 1 kali) and keep recent logs', async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Execute 30-day retention purge
    const result = await prisma.auditLog.deleteMany({
      where: {
        id: oldLogId,
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    expect(result.count).toBe(1);

    // Check old log is gone
    const checkOld = await prisma.auditLog.findUnique({ where: { id: oldLogId } });
    expect(checkOld).toBeNull();

    // Check recent log is still preserved
    const checkRecent = await prisma.auditLog.findUnique({ where: { id: recentLogId } });
    expect(checkRecent).not.toBeNull();
  });

  it('Step 4: Should delete single log by ID (manual admin deletion)', async () => {
    await prisma.auditLog.delete({
      where: { id: recentLogId },
    });

    const checkRecent = await prisma.auditLog.findUnique({ where: { id: recentLogId } });
    expect(checkRecent).toBeNull();
  });
});

