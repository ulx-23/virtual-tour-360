import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json().catch(() => ({}));
    const tour = await prisma.tour.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!tour) {
      return NextResponse.json({ success: false, error: 'Tour tidak ditemukan' }, { status: 404 });
    }

    await prisma.tourView.create({
      data: {
        tourId: tour.id,
        sceneId: body.sceneId || null,
        visitorSessionId: body.sessionId || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}