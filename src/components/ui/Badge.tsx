import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'info' | 'danger' | 'indigo' | 'purple';
  hasDot?: boolean;
}

export function Badge({
  className,
  variant = 'default',
  hasDot = false,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default:
      'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-700',
    success:
      'bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
    warning:
      'bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60',
    info: 'bg-sky-50 text-sky-700 border-sky-200/70 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/60',
    danger:
      'bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60',
    indigo:
      'bg-indigo-50 text-indigo-700 border-indigo-200/70 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/60',
    purple:
      'bg-purple-50 text-purple-700 border-purple-200/70 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/60',
  };

  const dotColors = {
    default: 'bg-slate-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    info: 'bg-sky-500',
    danger: 'bg-rose-500',
    indigo: 'bg-indigo-500',
    purple: 'bg-purple-500',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border select-none transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {hasDot && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />
      )}
      {children}
    </span>
  );
}