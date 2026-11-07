import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  children?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  children,
}: EmptyStateProps) {
  return (
    <div className="p-8 sm:p-12 text-center rounded-3xl border border-dashed border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-white/60 to-slate-50/60 dark:from-slate-900/40 dark:to-slate-950/40 backdrop-blur-sm max-w-lg mx-auto my-6">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500/10 via-purple-500/15 to-violet-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 shadow-sm">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actionLabel && onAction && (
            <Button onClick={onAction} variant="gradient" size="sm">
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button onClick={onSecondaryAction} variant="outline" size="sm">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
              <span>{secondaryActionLabel}</span>
            </Button>
          )}
        </div>
      )}

      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}