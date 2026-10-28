'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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
        setError(json.error || 'Login gagal, periksa email dan password Anda');
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center items-center p-6 select-none">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center mx-auto shadow-lg">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Virtual Tour 360° Studio
          </h1>
          <p className="text-xs text-zinc-500">
            Masuk ke panel kontrol manajemen virtual tour interaktif
          </p>
        </div>

        <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
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

            <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
              <span>Masuk ke Dashboard</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Quick Demo Login Fillers */}
          <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2.5 text-center">
              Akses Cepat Akun Demo (MySQL Seed)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoFill('super')}
                className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-center transition cursor-pointer"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('admin')}
                className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-center transition cursor-pointer"
              >
                Admin Kampus
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Sesi terenkripsi & RBAC terverifikasi server</span>
        </p>
      </div>
    </div>
  );
}