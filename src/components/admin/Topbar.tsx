'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LogOut,
  User as UserIcon,
  ExternalLink,
  Search,
  ChevronRight,
  ShieldCheck,
  Compass,
  Menu,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/theme/ThemeProvider';
import { useAdminNav } from './AdminShell';

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { toggleMobileSidebar } = useAdminNav();
  const [userName, setUserName] = useState<string>('Administrator');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('SUPER_ADMIN');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.user) {
          setUserName(data.data.user.name);
          setUserEmail(data.data.user.email);
          setUserRole(data.data.user.roles[0] || 'ADMIN');
          if (data.data.user.avatar) {
            setUserAvatar(data.data.user.avatar);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Close dropdown on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDropdownOpen(false);
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isDropdownOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  // Compute breadcrumb title
  const getPageTitle = () => {
    if (pathname === '/admin') return 'Dashboard Ikhtisar';
    if (pathname.startsWith('/admin/profile')) return 'Profil Pengguna';
    if (pathname.startsWith('/admin/tours')) return 'Manajemen Proyek Virtual Tour';
    if (pathname.startsWith('/admin/media')) return 'Panorama 360° Library';
    if (pathname.startsWith('/admin/cms')) return 'Website & CMS Settings';
    if (pathname.startsWith('/admin/users')) return 'Users & Role Permissions';
    if (pathname.startsWith('/admin/audit')) return 'Security Audit Trail';
    return 'Studio Admin';
  };

  return (
    <header className="h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left: Mobile Hamburger & Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs min-w-0">
        {/* Hamburger Menu Button */}
        <button
          type="button"
          onClick={toggleMobileSidebar}
          aria-label="Buka menu navigasi"
          className="md:hidden p-2 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition active:scale-95"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link
          href="/admin"
          className="font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Compass className="w-3.5 h-3.5 text-indigo-500" />
          <span className="hidden xs:inline">Admin</span>
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-600 shrink-0" />
        <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-xs md:max-w-md">
          {getPageTitle()}
        </span>
      </div>

      {/* Right: Actions, Theme Switcher, Profile */}
      <div className="flex items-center gap-3">
        {/* Public Landing Link */}
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100/80 dark:hover:bg-slate-900 border border-slate-200/60 dark:border-slate-800 transition"
        >
          <span>Landing Page</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {/* Dark / Light Mode Toggle */}
        <ThemeToggle />

        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* User Profile Button with Dropdown (Logout placed below Edit Profile) */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
            className="flex items-center gap-2 p-1.5 -m-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200/80 dark:hover:border-slate-800 transition group cursor-pointer focus:outline-none"
            title="Klik untuk membuka menu profil & akun"
          >
            <div className="relative">
              {userAvatar ? (
                <img
                  src={`/${userAvatar}`}
                  alt={userName}
                  onError={() => setUserAvatar(null)}
                  className="w-8 h-8 rounded-xl object-cover shadow-xs group-hover:scale-105 transition-transform ring-1 ring-slate-200/80 dark:ring-slate-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full" />
            </div>

            <div className="text-left hidden md:block">
              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {userName}
              </p>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold tracking-wide">
                {userRole}
              </p>
            </div>

            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
              }`}
            />
          </button>

          {/* Floating Dropdown Menu Card */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Profile Card Header */}
              <div className="px-3 py-2.5 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-slate-800/80 mb-1">
                <div className="flex items-center gap-2.5">
                  {userAvatar ? (
                    <img
                      src={`/${userAvatar}`}
                      alt={userName}
                      onError={() => setUserAvatar(null)}
                      className="w-10 h-10 rounded-xl object-cover shadow-xs shrink-0 ring-1 ring-slate-200/80 dark:ring-slate-700"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {userName}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">
                      {userEmail || 'admin@virtualtour.test'}
                    </p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider">Peran</span>
                  <span className="font-bold px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                    {userRole}
                  </span>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="space-y-0.5">
                {/* 1. Edit Profil */}
                <Link
                  href="/admin/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition group"
                >
                  <UserIcon className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                  <div className="flex-1 text-left">
                    <p className="leading-tight">Edit Profil</p>
                    <p className="text-[10px] text-slate-400 font-normal">Nama, email & kata sandi</p>
                  </div>
                </Link>

                {/* 2. Kelola Pengguna RBAC */}
                <Link
                  href="/admin/users"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition group"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                  <div className="flex-1 text-left">
                    <p className="leading-tight">Users & Role Permissions</p>
                    <p className="text-[10px] text-slate-400 font-normal">Manajemen akun pengguna</p>
                  </div>
                </Link>
              </div>

              {/* Divider */}
              <div className="my-1.5 h-[1px] bg-slate-100 dark:bg-slate-800" />

              {/* 3. Logout (Directly underneath Edit Profile) */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition group cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                <div className="flex-1 text-left">
                  <p className="leading-tight">Keluar dari Akun</p>
                  <p className="text-[10px] text-rose-400/80 font-normal">Akhiri sesi login aman Anda</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}