import fs from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeUser } from '@/server/rbac/guards';
import { convertStandaloneZipToHtml, MAX_SINGLE_HTML_SOURCE_BYTES } from '@/server/standalone/single-html';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; jobId: string }> }
) {
  const auth = await authorizeUser('tours.view');
  if (!auth.authorized) return auth.response;

  const { id, jobId } = await params;
  const job = await prisma.exportJob.findFirst({
    where: { id: jobId, tourId: id, type: 'STANDALONE_ZIP', status: 'COMPLETED' },
    select: { fileName: true, tour: { select: { slug: true } } },
  });
  if (!job?.fileName || path.basename(job.fileName) !== job.fileName) {
    return NextResponse.json({ success: false, error: 'Paket ZIP standalone tidak tersedia.' }, { status: 404 });
  }

  try {
    const zipPath = path.join(process.cwd(), 'public', 'exports', job.fileName);
    const zipStat = await fs.stat(zipPath);
    if (zipStat.size > MAX_SINGLE_HTML_SOURCE_BYTES + 2 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'Paket terlalu besar untuk konversi server. Unduh ZIP dan konversi secara lokal.' }, { status: 413 });
    }
    const zip = await fs.readFile(zipPath);
    const html = convertStandaloneZipToHtml(zip);
    // Keep HTTP downloads small; larger tours can use the local CLI converter.
    if (Buffer.byteLength(html) > 2 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'Single HTML terlalu besar untuk unduhan langsung. Unduh ZIP dan konversi secara lokal.' }, { status: 413 });
    }
    const filename = `${job.tour.slug.replace(/[^a-zA-Z0-9_-]/g, '_')}.html`;
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Konversi Single HTML gagal.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
