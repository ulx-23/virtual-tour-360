'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Topbar() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>('Administrator');
  const [userRole, setUserRole] = useState<string>('SUPER_ADMIN');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.user) {
          setUserName(data.data.user.name);
          setUserRole(data.data.user.roles[0] || 'ADMIN');
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1.5 transition"
        >
          <span>Buka Landing Page</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 font-bold text-xs">
            {userName.charAt(0)}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-zinc-900 dark:text-white leading-tight">{userName}</p>
            <p className="text-[10px] text-zinc-400 font-medium tracking-wide">{userRole}</p>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-zinc-500 hover:text-red-600">
          <LogOut className="w-4 h-4 mr-1.5" />
          <span>Keluar</span>
        </Button>
      </div>
    </header>
  );
}