import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

const COOKIE_NAME = 'vt_session';
const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'virtual-tour-360-jwt-secret-secure-key-2026-antigravity'
);

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  avatar?: string | null;
  roles: string[];
  permissions: string[];
}

export async function createSession(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return token;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function fetchFullUserSession(userId: string): Promise<SessionPayload | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user || user.status !== 'ACTIVE') return null;

  const roles = user.roles.map((r) => r.role.name);
  const permissionsSet = new Set<string>();

  for (const r of user.roles) {
    for (const p of r.role.permissions) {
      permissionsSet.add(p.permission.key);
    }
  }

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar || null,
    roles,
    permissions: Array.from(permissionsSet),
  };
}