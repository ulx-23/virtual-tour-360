import { NextResponse } from 'next/server';
import { getSession } from '@/server/auth/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Belum login' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      user: session,
    },
  });
}