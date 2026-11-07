import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { LucideIcon, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AccentColor = 'indigo' | 'emerald' | 'amber' | 'sky' | 'violet' | 'rose';

interface StatsCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: LucideIcon;
  accent?: AccentColor;
  trend?: string;
}

const accentMap: Record<
  AccentColor,
  {
    bg: string;
    text: string;
    border: string;
    badge: string;
    glow: string;
  }
> = {
  indigo: {
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/20',
    badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
    glow: 'hover:border-indigo-400/40 dark:hover:border-indigo-600/40',
  },
  emerald: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    glow: 'hover:border-emerald-400/40 dark:hover:border-emerald-600/40',
  },
  amber: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    glow: 'hover:border-amber-400/40 dark:hover:border-amber-600/40',
  },
  sky: {
    bg: 'bg-sky-500/10 dark:bg-sky-500/15',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-500/20',
    badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
    glow: 'hover:border-sky-400/40 dark:hover:border-sky-600/40',
  },
  violet: {
    bg: 'bg-violet-500/10 dark:bg-violet-500/15',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-500/20',
    badge: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
    glow: 'hover:border-violet-400/40 dark:hover:border-violet-600/40',
  },
  rose: {
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/20',
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
    glow: 'hover:border-rose-400/40 dark:hover:border-rose-600/40',
  },
};

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  accent = 'indigo',
  trend,
}: StatsCardProps) {
  const styles = accentMap[accent] || accentMap.indigo;

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-default',
        styles.glow
      )}
    >
      <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight">
            {title}
          </p>
          <div
            className={cn(
              'p-2.5 rounded-xl border transition-transform duration-300 group-hover:scale-110',
              styles.bg,
              styles.text,
              styles.border
            )}
          >
            <Icon className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {value}
            </span>
            {trend && (
              <span
                className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5',
                  styles.badge
                )}
              >
                <span>{trend}</span>
              </span>
            )}
          </div>
          {description && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-1">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}