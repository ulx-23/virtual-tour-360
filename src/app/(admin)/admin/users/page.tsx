import React from 'react';
import prisma from '@/lib/prisma';
import { Users, Shield, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto select-none">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Pengguna & Peran (RBAC)
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Manajemen otorisasi pengguna berbasis peran (SUPER_ADMIN, ADMIN, EDITOR, VIEWER)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Akun Pengguna ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
            {users.map((u) => (
              <div key={u.id} className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-white text-sm">{u.name}</p>
                    <p className="text-zinc-500">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {u.roles.map((r) => (
                      <Badge key={r.roleId} variant="default" className="font-semibold">
                        {r.role.name}
                      </Badge>
                    ))}
                  </div>
                  <Badge variant="success">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    <span>{u.status}</span>
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}