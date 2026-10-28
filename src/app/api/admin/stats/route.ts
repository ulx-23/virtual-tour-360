import { NextResponse } from 'next/server';
import { authorizeUser } from '@/server/rbac/guards';
import prisma from '@/lib/prisma';

export async function GET() {
  const auth = await authorizeUser('analytics.view');
  if (!auth.authorized) return auth.response;

  try {
    const [totalTours, publishedTours, draftTours, totalScenes, totalPanoramas, totalViews, recentTours] =
      await Promise.all([
        prisma.tour.count(),
        prisma.tour.count({ where: { status: 'PUBLISHED' } }),
        prisma.tour.count({ where: { status: 'DRAFT' } }),
        prisma.scene.count({ where: { isActive: true } }),
        prisma.panoramaAsset.count(),
        prisma.tourView.count(),
        prisma.tour.findMany({
          take: 5,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            updatedAt: true,
            _count: { select: { scenes: true, views: true } },
          },
        }),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalTours,
          publishedTours,
          draftTours,
          totalScenes,
          totalPanoramas,
          totalViews,
        },
        recentTours,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Gagal mengambil statistik' }, { status: 500 });
  }
}