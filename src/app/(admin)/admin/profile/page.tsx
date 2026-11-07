'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Mail,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Save,
  Compass,
  Sparkles,
  ArrowLeft,
  Calendar,
  LogOut,
  Camera,
  UploadCloud,
  Trash2,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Avatar Management
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [avatarSuccessMsg, setAvatarSuccessMsg] = useState<string | null>(null);
  const [avatarErrorMsg, setAvatarErrorMsg] = useState<string | null>(null);

  // Profile Info Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/profile');
      const json = await res.json();
      if (json.success) {
        setProfile(json.data);
        setName(json.data.name);
        setEmail(json.data.email);
      }
    } catch {
      setProfileErrorMsg('Gagal memuat profil pengguna');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Avatar Upload Handler
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarSuccessMsg(null);
    setAvatarErrorMsg(null);

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setAvatarErrorMsg('Format file tidak didukung. Harap pilih gambar berekstensi JPG, PNG, atau WebP.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setAvatarErrorMsg('Ukuran foto terlalu besar. Maksimal ukuran foto adalah 10MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await fetch('/api/auth/profile/avatar', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (json.success) {
        setAvatarSuccessMsg('Foto profil Anda berhasil diunggah dan diperbarui!');
        await loadProfile();
        setTimeout(() => setAvatarSuccessMsg(null), 4000);
      } else {
        setAvatarErrorMsg(json.error || 'Gagal mengunggah foto profil');
      }
    } catch {
      setAvatarErrorMsg('Terjadi kesalahan jaringan saat mengunggah foto profil');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Avatar Delete Handler
  const handleAvatarDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus foto profil Anda?')) return;

    setIsDeletingAvatar(true);
    setAvatarSuccessMsg(null);
    setAvatarErrorMsg(null);

    try {
      const res = await fetch('/api/auth/profile/avatar', {
        method: 'DELETE',
      });
      const json = await res.json();

      if (json.success) {
        setAvatarSuccessMsg('Foto profil berhasil dihapus');
        await loadProfile();
        setTimeout(() => setAvatarSuccessMsg(null), 4000);
      } else {
        setAvatarErrorMsg(json.error || 'Gagal menghapus foto profil');
      }
    } catch {
      setAvatarErrorMsg('Terjadi kesalahan saat menghapus foto profil');
    } finally {
      setIsDeletingAvatar(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);
    setIsSavingProfile(true);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const json = await res.json();

      if (json.success) {
        setProfileSuccessMsg('Profil Anda berhasil diperbarui!');
        loadProfile();
        setTimeout(() => setProfileSuccessMsg(null), 4000);
      } else {
        setProfileErrorMsg(json.error || 'Gagal memperbarui profil');
      }
    } catch {
      setProfileErrorMsg('Kesalahan server saat memperbarui profil');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg(null);
    setPasswordErrorMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('Konfirmasi kata sandi baru tidak cocok');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordErrorMsg('Kata sandi baru minimal 6 karakter');
      return;
    }

    setIsSavingPassword(true);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          currentPassword,
          newPassword,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setPasswordSuccessMsg('Kata sandi berhasil diubah! Gunakan kata sandi baru saat login berikutnya.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccessMsg(null), 4000);
      } else {
        setPasswordErrorMsg(json.error || 'Gagal mengubah kata sandi');
      }
    } catch {
      setPasswordErrorMsg('Kesalahan server saat mengubah kata sandi');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-slate-500">
        <Compass className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
        <p className="text-xs">Memuat data profil pengguna...</p>
      </div>
    );
  }

  const primaryRole = profile?.roles?.[0] || 'ADMIN';

  return (
    <div className="space-y-6 max-w-4xl mx-auto select-none pb-12">
      {/* Hidden File Input for Avatar */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Profil Pengguna
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola informasi akun pribadi, foto profil, kredensial, dan preferensi akses Anda
            </p>
          </div>
        </div>

        <Link href="/admin/users">
          <Button variant="outline" size="sm" className="text-xs">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-indigo-500" />
            <span>Kelola Semua Pengguna (RBAC)</span>
          </Button>
        </Link>
      </div>

      {/* Global Avatar Notification */}
      {avatarSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span className="font-medium">{avatarSuccessMsg}</span>
        </div>
      )}

      {avatarErrorMsg && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span className="font-medium">{avatarErrorMsg}</span>
        </div>
      )}

      {/* User Summary Hero Card with Avatar Photo Preview */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar Photo with Camera Badge Button */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-600/30 ring-4 ring-white/10 bg-slate-800 flex items-center justify-center">
              {profile?.avatar ? (
                <img
                  src={`/${profile.avatar}`}
                  alt={profile?.name || 'Foto Profil'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-3xl">
                  {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>

            {/* Camera Overlay Trigger Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              aria-label="Ubah foto profil"
              className="absolute -bottom-1 -right-1 p-2 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg ring-2 ring-slate-900 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              title="Klik untuk memilih foto baru"
            >
              {isUploadingAvatar ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-white truncate max-w-sm">{profile?.name}</h2>
              <Badge variant="default" className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30 text-xs">
                {primaryRole}
              </Badge>
              <Badge variant="success" className="text-xs">
                {profile?.status}
              </Badge>
            </div>

            <p className="text-xs text-slate-300 font-mono flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>{profile?.email}</span>
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Terdaftar: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-slate-500" />
                <span>{profile?.tourCount || 0} Proyek Tur Virtual</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: MANAJEMEN FOTO PROFIL (User Request: di edit profil harus ada foto) */}
      <Card className="border-indigo-100 dark:border-indigo-950/80">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base">Foto Profil Pengguna</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Perbarui avatar dan foto profil akun yang ditampilkan pada seluruh platform tur
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
            {/* Foto Square Preview */}
            <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-lg border-2 border-indigo-200 dark:border-indigo-900 bg-slate-800 flex items-center justify-center shrink-0">
              {profile?.avatar ? (
                <img
                  src={`/${profile.avatar}`}
                  alt={profile?.name || 'Avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-3xl">
                  {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>

            {/* Upload & Action Controls */}
            <div className="space-y-3 flex-1 text-center sm:text-left min-w-0">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {profile?.avatar ? 'Foto Profil Aktif' : 'Belum Ada Foto Khusus'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Format didukung: <span className="font-semibold text-slate-700 dark:text-slate-300">JPG, PNG, atau WebP</span> (maks. 10MB).
                  Foto akan secara otomatis di-crop persegi 1:1 dan dikompresi ke format WebP untuk loading kilat.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="gradient"
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={isUploadingAvatar}
                  className="text-xs"
                >
                  <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                  <span>{profile?.avatar ? 'Ganti Foto Baru' : 'Unggah Foto'}</span>
                </Button>

                {profile?.avatar && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAvatarDelete}
                    isLoading={isDeletingAvatar}
                    className="text-xs border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    <span>Hapus Foto</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* FORM 1: Informasi Profil */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <UserIcon className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base">Informasi Akun</CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ubah nama lengkap dan alamat email Anda</p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {profileSuccessMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              {profileErrorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{profileErrorMsg}</span>
                </div>
              )}

              <Input
                label="Nama Lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth: Super Administrator"
                required
              />

              <Input
                label="Alamat Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cth: admin@kampus.ac.id"
                required
              />

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  variant="gradient"
                  isLoading={isSavingProfile}
                  className="w-full sm:w-auto"
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  <span>Simpan Perubahan</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* FORM 2: Ubah Kata Sandi */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base">Ganti Kata Sandi</CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400">Tingkatkan keamanan akun Anda secara berkala</p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {passwordSuccessMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{passwordSuccessMsg}</span>
                </div>
              )}

              {passwordErrorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordErrorMsg}</span>
                </div>
              )}

              <Input
                label="Kata Sandi Saat Ini"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              <Input
                label="Kata Sandi Baru"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
              />

              <Input
                label="Konfirmasi Kata Sandi Baru"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru"
                required
              />

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  isLoading={isSavingPassword}
                  className="w-full sm:w-auto border-violet-300 dark:border-violet-800 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40"
                >
                  <Lock className="w-3.5 h-3.5 mr-1.5" />
                  <span>Perbarui Kata Sandi</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 3: Sesi & Keluar dari Akun (Logout di Bawah Edit Profil) */}
      <Card className="border-rose-200/70 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Keluar dari Akun Ini
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Akhiri sesi aktif Anda di browser ini secara aman. Anda dapat masuk kembali kapan saja.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLogout}
            isLoading={isLoggingOut}
            className="w-full sm:w-auto border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 shrink-0 text-xs"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            <span>Keluar dari Akun</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
