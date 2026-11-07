'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Compass,
  Image as ImageIcon,
  Building2,
  Globe,
  Users,
  ShieldCheck,
  Plus,
  Sparkles,
  Layers,
  X,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminNav } from './AdminShell';

export function Sidebar() {
  const pathname = usePathname();
  const { isMobileSidebarOpen, closeMobileSidebar } = useAdminNav();

  const navGroups = [
    {
      group: 'UTAMA',
      items: [
        { label: 'Overview', href: '/admin', icon: LayoutDashboard },
        { label: 'Virtual Tours', href: '/admin/tours', icon: Compass, badge: 'Studio' },
        { label: 'Panorama Library', href: '/admin/media', icon: ImageIcon, badge: '360°' },
      ],
    },
    {
      group: 'KONTEN & RUANG',
      items: [
        { label: 'Gedung & Denah', href: '/admin/tours', icon: Building2 },
        { label: 'Website CMS', href: '/admin/cms', icon: Globe },
      ],
    },
    {
      group: 'SISTEM & AKSES',
      items: [
        { label: 'Profil Saya', href: '/admin/profile', icon: UserCheck },
        { label: 'Users & Roles', href: '/admin/users', icon: Users, badge: 'RBAC' },
        { label: 'Audit Logs', href: '/admin/audit', icon: ShieldCheck },
      ],
    },
  ];

  const renderContent = (isMobile: boolean) => (
    <>
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0">
        <Link
          href="/admin"
          onClick={isMobile ? closeMobileSidebar : undefined}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <span className="text-white font-black text-xs">360°</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm text-slate-900 dark:text-white leading-tight tracking-tight">
                Virtual Tour
              </h1>
              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-wider uppercase mt-0.5">
              Studio & Builder
            </p>
          </div>
        </Link>

        {/* Mobile Close Button */}
        {isMobile && (
          <button
            type="button"
            onClick={closeMobileSidebar}
            aria-label="Tutup navigasi"
            className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Quick Action Button */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <Link href="/admin/tours" onClick={isMobile ? closeMobileSidebar : undefined}>
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Proyek Tur</span>
          </button>
        </Link>
      </div>

      {/* Navigation Groups */}
      <nav className="p-3 space-y-4 flex-1 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.group} className="space-y-1">
            <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              {group.group}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={isMobile ? closeMobileSidebar : undefined}
                  className={cn(
                    'relative flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all select-none group',
                    isActive
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900/60'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-colors',
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={cn(
                        'text-[10px] font-semibold px-1.5 py-0.5 rounded-md border shrink-0',
                        isActive
                          ? 'bg-indigo-100/80 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-slate-700/60'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}

                  {isActive && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-600 dark:bg-indigo-400 rounded-r-full" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Engine & Environment Node Status */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 shrink-0">
        <div className="p-3 bg-slate-50/80 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Engine 360° Node
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>WebGL Marzipano Online</span>
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            <span>MySQL 8.0</span>
            <span>D: Drive Laragon</span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Drawer (Only mounted/active on mobile, completely out of normal flow) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 h-full flex flex-col bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-r border-slate-200/80 dark:border-slate-800/80 transition-transform duration-300 ease-in-out md:hidden shadow-2xl',
          isMobileSidebarOpen
            ? 'translate-x-0 pointer-events-auto'
            : '-translate-x-full pointer-events-none'
        )}
      >
        {renderContent(true)}
      </aside>

      {/* Desktop Persistent Sidebar (Only visible on md+ breakpoints in standard flex flow) */}
      <aside className="hidden md:flex md:flex-col md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-r border-slate-200/80 dark:border-slate-800/80 z-20">
        {renderContent(false)}
      </aside>
    </>
  );
}