import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: LucideIcon;
}

export function StatsCard({ title, value, description, icon: Icon }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div className="space-y-1">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">{value}</p>
          {description && <p className="text-[11px] text-zinc-400">{description}</p>}
        </div>
        <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-zinc-700 dark:text-zinc-300">
          <Icon className="w-5 h-5" />
        </div>
      </CardContent>
    </Card>
  );
}