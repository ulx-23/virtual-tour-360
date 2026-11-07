import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

describe('User CRUD & Profile Management', () => {
  const testEmail = `testuser-${Date.now()}@virtualtour.test`;
  let testUserId: string;
  let adminRoleId: string;
  let editorRoleId: string;

  beforeAll(async () => {
    // Get roles
    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    const editorRole = await prisma.role.findUnique({ where: { name: 'EDITOR' } });
    adminRoleId = adminRole!.id;
    editorRoleId = editorRole!.id;
  });

  afterAll(async () => {
    // Cleanup created test user
    if (testUserId) {
      await prisma.userRole.deleteMany({ where: { userId: testUserId } }).catch(() => {});
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
  });

  it('Step 1: Should create a new user with ADMIN role and hash password', async () => {
    const passwordHash = await bcrypt.hash('SecurePass123!', 10);
    const user = await prisma.user.create({
      data: {
        name: 'Budi Test Engineer',
        email: testEmail,
        passwordHash,
        status: 'ACTIVE',
      },
    });

    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: adminRoleId,
      },
    });

    testUserId = user.id;

    expect(user.id).toBeDefined();
    expect(user.name).toBe('Budi Test Engineer');
    expect(user.email).toBe(testEmail);
    expect(user.status).toBe('ACTIVE');

    // Verify password hash
    const isMatch = await bcrypt.compare('SecurePass123!', user.passwordHash);
    expect(isMatch).toBe(true);
  });

  it('Step 2: Should retrieve user with associated roles and count', async () => {
    const user = await prisma.user.findUnique({
      where: { id: testUserId },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    expect(user).not.toBeNull();
    expect(user!.roles.length).toBe(1);
    expect(user!.roles[0].role.name).toBe('ADMIN');
  });

  it('Step 3: Should prevent duplicate email creation', async () => {
    let duplicateError = false;
    try {
      await prisma.user.create({
        data: {
          name: 'Clone User',
          email: testEmail,
          passwordHash: 'dummyhash',
        },
      });
    } catch {
      duplicateError = true;
    }

    expect(duplicateError).toBe(true);
  });

  it('Step 4: Should update user profile information and role to EDITOR', async () => {
    // Update user name and status
    const updatedUser = await prisma.user.update({
      where: { id: testUserId },
      data: {
        name: 'Budi Test Updated',
        status: 'INACTIVE',
      },
    });

    expect(updatedUser.name).toBe('Budi Test Updated');
    expect(updatedUser.status).toBe('INACTIVE');

    // Change role from ADMIN to EDITOR
    await prisma.userRole.deleteMany({ where: { userId: testUserId } });
    await prisma.userRole.create({
      data: {
        userId: testUserId,
        roleId: editorRoleId,
      },
    });

    const userWithNewRole = await prisma.user.findUnique({
      where: { id: testUserId },
      include: { roles: { include: { role: true } } },
    });

    expect(userWithNewRole!.roles[0].role.name).toBe('EDITOR');
  });

  it('Step 5: Should update password and verify new credentials', async () => {
    const newPasswordHash = await bcrypt.hash('NewStrongPass456!', 10);
    const updated = await prisma.user.update({
      where: { id: testUserId },
      data: { passwordHash: newPasswordHash },
    });

    const oldMatch = await bcrypt.compare('SecurePass123!', updated.passwordHash);
    const newMatch = await bcrypt.compare('NewStrongPass456!', updated.passwordHash);

    expect(oldMatch).toBe(false);
    expect(newMatch).toBe(true);
  });

  it('Step 6: Should update avatar image path and remove avatar', async () => {
    const avatarPath = 'uploads/avatars/test-avatar-123.webp';
    const userWithAvatar = await prisma.user.update({
      where: { id: testUserId },
      data: { avatar: avatarPath },
    });

    expect(userWithAvatar.avatar).toBe(avatarPath);

    const userRemovedAvatar = await prisma.user.update({
      where: { id: testUserId },
      data: { avatar: null },
    });

    expect(userRemovedAvatar.avatar).toBeNull();
  });

  it('Step 7: Should delete user and cascade user roles', async () => {
    await prisma.userRole.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });

    const deleted = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(deleted).toBeNull();

    testUserId = ''; // Mark cleaned up
  });
});

