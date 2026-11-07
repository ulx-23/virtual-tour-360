'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThemeToggle } from '@/components/theme/ThemeProvider';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();

      if (json.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(json.error || 'Login gagal, periksa email dan kata sandi Anda');
      }
    } catch {
      setError('Terjadi kesalahan jaringan atau server saat login');
    }
    setIsLoading(false);
  };

  const handleDemoFill = (role: 'super' | 'admin') => {
    if (role === 'super') {
      setEmail('superadmin@virtualtour.test');
      setPassword('Password123!');
    } else {
      setEmail('admin@virtualtour.test');
      setPassword('Password123!');
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50/60 dark:bg-[#070b14] flex flex-col justify-center items-center p-6 select-none transition-colors">
      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-violet-500/10 dark:bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Theme Toggle */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30">
            <span className="font-black text-sm tracking-tight">360°</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Virtual Tour 360° Studio
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Masuk ke panel kontrol manajemen virtual tour interaktif
          </p>
        </div>

        <div className="p-8 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium">
                {error}
              </div>
            )}

            <Input
              label="Alamat Email"
              type="email"
              placeholder="admin@virtualtour.test"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Kata Sandi"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="gradient"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              <span>Masuk ke Dashboard</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Quick Demo Login Fillers */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5 text-center flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Akses Cepat Akun Demo</span>
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoFill('super')}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-center transition cursor-pointer"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('admin')}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-center transition cursor-pointer"
              >
                Admin Kampus
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Sesi terenkripsi & RBAC terverifikasi server</span>
        </p>
      </div>
    </div>
  );
}