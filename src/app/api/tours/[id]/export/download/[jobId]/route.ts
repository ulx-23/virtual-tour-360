import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';
import { authorizeUser } from '@/server/rbac/guards';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; jobId: string }> }
) {
  const auth = await authorizeUser('tours.view');
  if (!auth.authorized) return auth.response;

  try {
    const { id, jobId } = await params;

    const job = await prisma.exportJob.findFirst({
      where: {
        id: jobId,
        tourId: id,
      },
      include: {
        tour: { select: { title: true, slug: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job ekspor tidak ditemukan' }, { status: 404 });
    }

    if (job.status !== 'COMPLETED' || !job.fileName) {
      return NextResponse.json(
        {
          success: false,
          error: `Berkas belum siap. Status saat ini: ${job.status}`,
          status: job.status,
          progress: job.progress,
        },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), 'public', 'exports', job.fileName);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'Berkas arsip ekspor telah kedaluwarsa atau dihapus' },
        { status: 410 }
      );
    }

    const stat = fs.statSync(filePath);
    const fileStream = fs.createReadStream(filePath);

    // ReadableStream adapter for Next.js App Router
    const webStream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => controller.enqueue(chunk));
        fileStream.on('end', () => controller.close());
        fileStream.on('error', (err) => controller.error(err));
      },
    });

    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Length', stat.size.toString());
    headers.set('Content-Disposition', `attachment; filename="${job.fileName}"`);
    headers.set('Cache-Control', 'no-store');

    return new NextResponse(webStream, { headers });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengunduh berkas ekspor' },
      { status: 500 }
    );
  }
}

