import React from 'react';
import prisma from '@/lib/prisma';
import { ShieldCheck, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default async function AuditLogsPage() {
  const logs = await prisma.auditLog.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: {
      actor: { select: { id: true, name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto select-none">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Security & Audit Logs
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Riwayat aktivitas autentikasi dan perubahan sistem administratif
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aktivitas Terakhir ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
            {logs.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-white">
                      {log.actor?.name || 'Sistem / Anonim'} — <span className="font-mono text-zinc-500">{log.action}</span>
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Entitas: {log.entityType} ({log.entityId || '-'})
                    </p>
                  </div>
                </div>

                <div className="text-right text-[11px] text-zinc-400">
                  {new Date(log.createdAt).toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}