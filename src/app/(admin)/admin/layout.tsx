import React from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { getSession } from '@/server/auth/session';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  return <AdminShell>{children}</AdminShell>;
}
