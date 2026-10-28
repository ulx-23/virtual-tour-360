import { PrismaClient, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seeding ---');

  // 1. Permissions list
  const permissionsData = [
    { key: 'tours.view', description: 'View tour list and tour details' },
    { key: 'tours.create', description: 'Create new virtual tour' },
    { key: 'tours.update', description: 'Update virtual tour details' },
    { key: 'tours.delete', description: 'Delete virtual tour' },
    { key: 'tours.publish', description: 'Publish or unpublish virtual tour' },
    { key: 'scenes.create', description: 'Create new scene from panorama' },
    { key: 'scenes.update', description: 'Update scene metadata and orientation' },
    { key: 'scenes.delete', description: 'Delete scene' },
    { key: 'hotspots.manage', description: 'Create, update, or remove hotspots' },
    { key: 'media.upload', description: 'Upload panoramas and floor plans' },
    { key: 'media.delete', description: 'Delete media assets' },
    { key: 'buildings.manage', description: 'Manage buildings, floors, and floor plans' },
    { key: 'cms.manage', description: 'Manage landing page and site settings' },
    { key: 'users.manage', description: 'Manage system users and access' },
    { key: 'roles.manage', description: 'Manage roles and permissions' },
    { key: 'settings.manage', description: 'Manage general site configurations' },
    { key: 'analytics.view', description: 'View analytics and statistics' },
    { key: 'audit.view', description: 'View security audit logs' },
  ];

  const permissionsMap = new Map<string, string>();
  for (const p of permissionsData) {
    const record = await prisma.permission.upsert({
      where: { key: p.key },
      update: { description: p.description },
      create: p,
    });
    permissionsMap.set(p.key, record.id);
  }
  console.log(`[OK] Seeded ${permissionsMap.size} permissions`);

  // 2. Roles list
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: { description: 'Full system privileges and configuration access' },
    create: {
      name: 'SUPER_ADMIN',
      description: 'Full system privileges and configuration access',
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: { description: 'Virtual tour creator, editor, and publisher' },
    create: {
      name: 'ADMIN',
      description: 'Virtual tour creator, editor, and publisher',
    },
  });

  const editorRole = await prisma.role.upsert({
    where: { name: 'EDITOR' },
    update: { description: 'Virtual tour content editor' },
    create: {
      name: 'EDITOR',
      description: 'Virtual tour content editor',
    },
  });

  const viewerRole = await prisma.role.upsert({
    where: { name: 'VIEWER' },
    update: { description: 'Public viewer role' },
    create: {
      name: 'VIEWER',
      description: 'Public viewer role',
    },
  });

  // Assign all permissions to SUPER_ADMIN
  for (const permId of permissionsMap.values()) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permId,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permId,
      },
    });
  }

  // Assign Admin permissions
  const adminPermKeys = [
    'tours.view', 'tours.create', 'tours.update', 'tours.delete', 'tours.publish',
    'scenes.create', 'scenes.update', 'scenes.delete',
    'hotspots.manage',
    'media.upload', 'media.delete',
    'buildings.manage',
    'cms.manage',
    'analytics.view',
  ];
  for (const key of adminPermKeys) {
    const permId = permissionsMap.get(key);
    if (permId) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permId,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permId,
        },
      });
    }
  }

  // Assign Editor permissions
  const editorPermKeys = [
    'tours.view', 'tours.update',
    'scenes.create', 'scenes.update',
    'hotspots.manage',
    'media.upload',
  ];
  for (const key of editorPermKeys) {
    const permId = permissionsMap.get(key);
    if (permId) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: editorRole.id,
            permissionId: permId,
          },
        },
        update: {},
        create: {
          roleId: editorRole.id,
          permissionId: permId,
        },
      });
    }
  }
  console.log('[OK] Seeded roles and role permissions');

  // 3. Initial Users
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const superAdminUser = await prisma.user.upsert({
    where: { email: 'superadmin@virtualtour.test' },
    update: { status: UserStatus.ACTIVE },
    create: {
      name: 'Super Administrator',
      email: 'superadmin@virtualtour.test',
      passwordHash,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdminUser.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: superAdminUser.id,
      roleId: superAdminRole.id,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@virtualtour.test' },
    update: { status: UserStatus.ACTIVE },
    create: {
      name: 'Campus Administrator',
      email: 'admin@virtualtour.test',
      passwordHash,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });
  console.log('[OK] Seeded users (superadmin@virtualtour.test, admin@virtualtour.test) [Pass: Password123!]');

  // 4. Default Site Settings
  const siteSettings = [
    { key: 'site_name', value: 'Virtual Tour 360' },
    { key: 'site_tagline', value: 'Indoor & Outdoor Interactive 360 Tour Builder' },
    { key: 'hero_title', value: 'Jelajahi Setiap Sudut Ruang dengan Pengalaman 360 Interaktif' },
    { key: 'hero_subtitle', value: 'Platform terpadu untuk merancang, menghubungkan panorama indoor & outdoor, dan mempublikasikan virtual tour berstandar Google Street View.' },
    { key: 'hero_cta_label', value: 'Mulai Jelajah Sekarang' },
    { key: 'hero_cta_url', value: '#featured-tours' },
    { key: 'footer_text', value: 'Copyright 2026 Virtual Tour 360. Seluruh Hak Cipta Dilindungi.' },
  ];

  for (const s of siteSettings) {
    await prisma.siteSetting.upsert({
      where: { settingKey: s.key },
      update: { settingValue: s.value },
      create: { settingKey: s.key, settingValue: s.value },
    });
  }
  console.log('[OK] Seeded default site settings');

  console.log('--- Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });