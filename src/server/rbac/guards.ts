import { NextResponse } from 'next/server';
import { getSession, SessionPayload } from '@/server/auth/session';

export type PermissionKey =
  | 'tours.view'
  | 'tours.create'
  | 'tours.update'
  | 'tours.delete'
  | 'tours.publish'
  | 'scenes.create'
  | 'scenes.update'
  | 'scenes.delete'
  | 'hotspots.manage'
  | 'media.upload'
  | 'media.delete'
  | 'buildings.manage'
  | 'cms.manage'
  | 'users.manage'
  | 'roles.manage'
  | 'settings.manage'
  | 'analytics.view'
  | 'audit.view';

export async function authorizeUser(requiredPermission?: PermissionKey): Promise<
  | { authorized: true; session: SessionPayload }
  | { authorized: false; response: NextResponse }
> {
  const session = await getSession();

  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized: Sesi tidak ditemukan atau kedaluwarsa' },
        { status: 401 }
      ),
    };
  }

  // SUPER_ADMIN has unconditional bypass
  if (session.roles.includes('SUPER_ADMIN')) {
    return { authorized: true, session };
  }

  if (requiredPermission && !session.permissions.includes(requiredPermission)) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: `Forbidden: Anda tidak memiliki izin (${requiredPermission}) untuk tindakan ini`,
        },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, session };
}