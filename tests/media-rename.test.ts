import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { validateMediaFilename } from '@/server/services/media-filename';

vi.mock('@/server/rbac/guards', () => ({ authorizeUser: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  default: { mediaAsset: { findUnique: vi.fn(), update: vi.fn() } },
}));

import { authorizeUser } from '@/server/rbac/guards';
import prisma from '@/lib/prisma';
import { PATCH } from '@/app/api/media/[id]/route';

const request = (filename: string) => new NextRequest('http://localhost/api/media/media-1', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ filename }),
});
const params = { params: Promise.resolve({ id: 'media-1' }) };

describe('rename media filename', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authorizeUser).mockResolvedValue({ authorized: true, session: { userId: 'admin-1' } } as Awaited<ReturnType<typeof authorizeUser>>);
    vi.mocked(prisma.mediaAsset.findUnique).mockResolvedValue({ originalFilename: 'lobi.jpg' } as Awaited<ReturnType<typeof prisma.mediaAsset.findUnique>>);
  });

  it('keeps the extension while allowing a new display name', () => {
    expect(validateMediaFilename('lobi.jpg', 'Lobi Utama.jpg')).toBe('Lobi Utama.jpg');
    expect(() => validateMediaFilename('lobi.jpg', 'Lobi Utama.png')).toThrow(/Ekstensi/);
    expect(() => validateMediaFilename('lobi.jpg', '../Lobi.jpg')).toThrow(/karakter/);
  });

  it('rejects unauthorized writes before accessing the database', async () => {
    vi.mocked(authorizeUser).mockResolvedValue({ authorized: false, response: NextResponse.json({ success: false }, { status: 403 }) });
    const response = await PATCH(request('Lobi Baru.jpg'), params);
    expect(response.status).toBe(403);
    expect(prisma.mediaAsset.findUnique).not.toHaveBeenCalled();
  });

  it('changes only the stored display filename', async () => {
    vi.mocked(prisma.mediaAsset.update).mockResolvedValue({ id: 'media-1', originalFilename: 'Lobi Baru.jpg' } as Awaited<ReturnType<typeof prisma.mediaAsset.update>>);
    const response = await PATCH(request('Lobi Baru.jpg'), params);
    expect(response.status).toBe(200);
    expect(prisma.mediaAsset.update).toHaveBeenCalledWith({
      where: { id: 'media-1' },
      data: { originalFilename: 'Lobi Baru.jpg' },
      select: { id: true, originalFilename: true },
    });
    expect((await response.json()).data.originalFilename).toBe('Lobi Baru.jpg');
  });

  it('rejects a changed extension without writing', async () => {
    const response = await PATCH(request('Lobi Baru.png'), params);
    expect(response.status).toBe(400);
    expect(prisma.mediaAsset.update).not.toHaveBeenCalled();
  });
});
