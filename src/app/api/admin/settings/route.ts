import { NextRequest, NextResponse } from 'next/server';
import { authorizeUser } from '@/server/rbac/guards';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.siteSetting.findMany();
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.settingKey] = s.settingValue;
    }
    return NextResponse.json({ success: true, data: settingsMap });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Gagal memuat pengaturan' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await authorizeUser('settings.manage');
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') {
        await prisma.siteSetting.upsert({
          where: { settingKey: key },
          update: { settingValue: value },
          create: { settingKey: key, settingValue: value },
        });
      }
    }
    return NextResponse.json({ success: true, message: 'Pengaturan berhasil diperbarui' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Gagal menyimpan pengaturan' }, { status: 500 });
  }
}