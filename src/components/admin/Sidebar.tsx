'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Compass,
  Image as ImageIcon,
  Layers,
  Building2,
  MapPin,
  Globe,
  BarChart3,
  Users,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Virtual Tours', href: '/admin/tours', icon: Compass },
    { label: 'Panorama Library', href: '/admin/media', icon: ImageIcon },
    { label: 'Buildings & Floors', href: '/admin/tours', icon: Building2 },
    { label: 'Website CMS', href: '/admin/cms', icon: Globe },
    { label: 'Analytics', href: '/admin', icon: BarChart3 },
    { label: 'Users & Roles', href: '/admin/users', icon: Users },
    { label: 'Audit Logs', href: '/admin/audit', icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col shrink-0 min-h-screen">
      <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-sm">
          360°
        </div>
        <div>
          <h1 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight">Virtual Tour</h1>
          <p className="text-[10px] text-zinc-500 font-medium">STUDIO & BUILDER</p>
        </div>
      </div>

      <nav className="p-3 space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all select-none',
                isActive
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
        <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200/50 dark:border-zinc-800">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Status Node</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">MySQL & Storage Ready</span>
          </div>
        </div>
      </div>
    </aside>
  );
}