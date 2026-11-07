import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authorizeUser } from '@/server/rbac/guards';
import { ExportService } from '@/server/services/export.service';
import prisma from '@/lib/prisma';
import { ExportType } from '@prisma/client';

const exportSchema = z.object({
  type: z.enum(['STANDALONE_ZIP', 'PROJECT_BACKUP', 'ORIGINAL_PANORAMAS']).default('STANDALONE_ZIP'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeUser('tours.view');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;
    let body = {};
    try {
      body = await req.json();
    } catch {}

    const parsed = exportSchema.safeParse(body);
    const exportType: ExportType = parsed.success ? (parsed.data.type as ExportType) : 'STANDALONE_ZIP';

    const job = await ExportService.createExportJob(id, exportType);

    return NextResponse.json(
      {
        success: true,
        message: 'Proses ekspor dimulai dalam antrean (job)',
        data: job,
      },
      { status: 202 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memulai proses ekspor tur' },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeUser('tours.view');
  if (!auth.authorized) return auth.response;

  try {
    const { id } = await params;

    // Trigger cleanup of expired files in the background
    ExportService.cleanupExpiredExports().catch(() => {});

    const jobs = await prisma.exportJob.findMany({
      where: { tourId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const activeJob = jobs.find((j) => j.status === 'QUEUED' || j.status === 'PROCESSING') || null;

    return NextResponse.json({
      success: true,
      data: {
        activeJob,
        recentJobs: jobs,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Gagal memuat status job ekspor' },
      { status: 500 }
    );
  }
}

