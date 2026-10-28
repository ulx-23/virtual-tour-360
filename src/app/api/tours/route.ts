import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authorizeUser } from '@/server/rbac/guards';
import { TourService } from '@/server/services/tour.service';

const createTourSchema = z.object({
  title: z.string().min(3, 'Judul tur minimal 3 karakter'),
  slug: z.string().optional(),
  description: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'UNLISTED', 'PRIVATE']).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await authorizeUser('tours.view');
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') as any || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);

    const result = await TourService.list({ search, status, page, limit });
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Gagal mengambil daftar tur' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authorizeUser('tours.create');
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const parsed = createTourSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Input tidak valid' },
        { status: 400 }
      );
    }

    const tour = await TourService.create({
      ...parsed.data,
      ownerId: auth.session.userId,
    });

    return NextResponse.json({ success: true, data: tour }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Gagal membuat proyek tur' }, { status: 500 });
  }
}