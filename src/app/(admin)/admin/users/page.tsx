'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  UserCheck,
  UserX,
  ShieldAlert,
  Sparkles,
  Lock,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface UserItem {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  roles: string[];
  tourCount: number;
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Notification Toast / Message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal: Create User
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'VIEWER'>('ADMIN');
  const [createStatus, setCreateStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Modal: Edit User
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'VIEWER'>('ADMIN');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Modal: Delete User
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.users);
        setCurrentUserId(json.data.currentUserId);
      }
    } catch {
      setFeedback({ type: 'error', text: 'Gagal memuat daftar pengguna' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  // Create User Handler
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCreate(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName,
          email: createEmail,
          password: createPassword,
          role: createRole,
          status: createStatus,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setFeedback({ type: 'success', text: json.message || 'Pengguna baru berhasil ditambahkan' });
        setIsCreateOpen(false);
        setCreateName('');
        setCreateEmail('');
        setCreatePassword('');
        setCreateRole('ADMIN');
        setCreateStatus('ACTIVE');
        fetchUsers();
      } else {
        setFeedback({ type: 'error', text: json.error || 'Gagal menambahkan pengguna' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Kesalahan jaringan saat membuat pengguna' });
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Open Edit Modal with Prepopulated Values
  const openEditModal = (u: UserItem) => {
    setEditingUserId(u.id);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole((u.roles[0] as any) || 'ADMIN');
    setEditStatus(u.status);
    setEditNewPassword('');
    setIsEditOpen(true);
  };

  // Edit User Handler
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    setIsSubmittingEdit(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/users/${editingUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          role: editRole,
          status: editStatus,
          newPassword: editNewPassword || undefined,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setFeedback({ type: 'success', text: json.message || 'Data pengguna berhasil diperbarui' });
        setIsEditOpen(false);
        setEditingUserId(null);
        fetchUsers();
      } else {
        setFeedback({ type: 'error', text: json.error || 'Gagal memperbarui pengguna' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Kesalahan server saat memperbarui pengguna' });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Open Delete Confirmation
  const openDeleteModal = (u: UserItem) => {
    setDeletingUser(u);
    setIsDeleteOpen(true);
  };

  // Delete User Handler
  const handleDeleteSubmit = async () => {
    if (!deletingUser) return;
    setIsSubmittingDelete(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();

      if (json.success) {
        setFeedback({ type: 'success', text: json.message || 'Akun berhasil dihapus' });
        setIsDeleteOpen(false);
        setDeletingUser(null);
        fetchUsers();
      } else {
        setFeedback({ type: 'error', text: json.error || 'Gagal menghapus akun pengguna' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Kesalahan saat menghapus akun' });
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  // Compute Statistics
  const totalCount = users.length;
  const superAdminCount = users.filter((u) => u.roles.includes('SUPER_ADMIN')).length;
  const adminEditorCount = users.filter((u) => u.roles.includes('ADMIN') || u.roles.includes('EDITOR')).length;
  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
      case 'ADMIN':
        return 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'EDITOR':
        return 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      default:
        return 'bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'SUSPENDED':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto select-none pb-12">
      {/* 1. Header with Add User Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Pengguna & Peran (RBAC)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manajemen akun pengguna dan hak akses peran (SUPER_ADMIN, ADMIN, EDITOR, VIEWER)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/profile">
            <Button variant="outline" size="sm" className="text-xs">
              <Mail className="w-3.5 h-3.5 mr-1 text-indigo-500" />
              <span>Profil Saya</span>
            </Button>
          </Link>
          <Button
            onClick={() => setIsCreateOpen(true)}
            variant="gradient"
            size="sm"
            className="text-xs shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Tambah Pengguna</span>
          </Button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            )}
            <span className="font-medium">{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Metric / Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Akun</p>
            <p className="text-xl font-black text-slate-900 dark:text-white leading-tight">{totalCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Super Admin</p>
            <p className="text-xl font-black text-slate-900 dark:text-white leading-tight">{superAdminCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Admin & Editor</p>
            <p className="text-xl font-black text-slate-900 dark:text-white leading-tight">{adminEditorCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Akun Aktif</p>
            <p className="text-xl font-black text-slate-900 dark:text-white leading-tight">{activeCount}</p>
          </div>
        </div>
      </div>

      {/* 3. Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama atau alamat email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-white shadow-xs"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-36 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-xs cursor-pointer"
          >
            <option value="">Semua Peran</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="ADMIN">ADMIN</option>
            <option value="EDITOR">EDITOR</option>
            <option value="VIEWER">VIEWER</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-36 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-xs cursor-pointer"
          >
            <option value="">Semua Status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>
      </div>

      {/* 4. Users List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <span>Daftar Akun Pengguna</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                {users.length}
              </span>
            </CardTitle>
            <button
              onClick={fetchUsers}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Segarkan</span>
            </button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
              <span>Memuat data pengguna...</span>
            </div>
          ) : users.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {users.map((u) => {
                const isSelf = u.id === currentUserId;
                const primaryRole = u.roles[0] || 'VIEWER';

                return (
                  <div
                    key={u.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 -mx-4 px-4 sm:-mx-6 sm:px-6 transition"
                  >
                    {/* Left: User Info & Avatar */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative shrink-0">
                        {u.avatar ? (
                          <img
                            src={`/${u.avatar}`}
                            alt={u.name}
                            className="w-11 h-11 rounded-2xl object-cover shadow-md shadow-indigo-600/20 ring-1 ring-slate-200 dark:ring-slate-800 shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-600/20 shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {u.status === 'ACTIVE' && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                            {u.name}
                          </p>
                          {isSelf && (
                            <span className="text-[10px] font-semibold px-2 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                              Anda
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-mono text-xs truncate">
                          {u.email}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Bergabung: {new Date(u.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* Right: Badges & CRUD Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        {/* Role Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getRoleBadgeVariant(primaryRole)}`}
                        >
                          {primaryRole}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${getStatusBadgeVariant(u.status)}`}
                        >
                          {u.status}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 pl-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(u)}
                          className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-200/80 dark:border-slate-800 transition"
                          title="Edit Pengguna"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openDeleteModal(u)}
                          disabled={isSelf}
                          className={`p-2 rounded-xl transition border ${
                            isSelf
                              ? 'text-slate-300 dark:text-slate-700 border-transparent cursor-not-allowed'
                              : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 border-slate-200/80 dark:border-slate-800'
                          }`}
                          title={isSelf ? 'Tidak dapat menghapus akun sendiri' : 'Hapus Pengguna'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tidak ada pengguna yang cocok</p>
              <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau filter peran Anda.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL 1: Tambah Pengguna Baru */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="➕ Tambah Pengguna Baru"
        description="Buat akun baru dengan otorisasi peran RBAC yang ditentukan."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Nama Lengkap"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="cth: Budi Santoso"
            required
            autoFocus
          />

          <Input
            label="Alamat Email"
            type="email"
            value={createEmail}
            onChange={(e) => setCreateEmail(e.target.value)}
            placeholder="cth: budi@kampus.ac.id"
            required
          />

          <Input
            label="Kata Sandi Akun"
            type="password"
            value={createPassword}
            onChange={(e) => setCreatePassword(e.target.value)}
            placeholder="Minimal 6 karakter"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Peran Pengguna (Role)
              </label>
              <select
                value={createRole}
                onChange={(e) => setCreateRole(e.target.value as any)}
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="SUPER_ADMIN">SUPER_ADMIN (Akses Penuh)</option>
                <option value="ADMIN">ADMIN (Manajemen Tur & Konten)</option>
                <option value="EDITOR">EDITOR (Penyunting Hotspot)</option>
                <option value="VIEWER">VIEWER (Akses Lihat Saja)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Status Akun
              </label>
              <select
                value={createStatus}
                onChange={(e) => setCreateStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="ACTIVE">ACTIVE (Dapat Masuk)</option>
                <option value="INACTIVE">INACTIVE (Nonaktif)</option>
                <option value="SUSPENDED">SUSPENDED (Ditangguhkan)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="gradient"
              size="sm"
              isLoading={isSubmittingCreate}
            >
              Simpan Pengguna
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Edit Data Pengguna */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="✏️ Edit Data Pengguna"
        description="Perbarui informasi profil, peran akses, atau reset kata sandi akun."
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Nama Lengkap"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Alamat Email"
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Peran Pengguna (Role)
              </label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as any)}
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="SUPER_ADMIN">SUPER_ADMIN (Akses Penuh)</option>
                <option value="ADMIN">ADMIN (Manajemen Tur & Konten)</option>
                <option value="EDITOR">EDITOR (Penyunting Hotspot)</option>
                <option value="VIEWER">VIEWER (Akses Lihat Saja)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Status Akun
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="ACTIVE">ACTIVE (Dapat Masuk)</option>
                <option value="INACTIVE">INACTIVE (Nonaktif)</option>
                <option value="SUSPENDED">SUSPENDED (Ditangguhkan)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Kata Sandi (Opsional)</span>
            </label>
            <Input
              type="password"
              value={editNewPassword}
              onChange={(e) => setEditNewPassword(e.target.value)}
              placeholder="Kosongkan jika tidak ingin mengubah kata sandi"
            />
            <p className="text-[11px] text-slate-400">
              Isi kata sandi baru hanya jika Anda ingin mereset kredensial masuk pengguna ini.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="gradient"
              size="sm"
              isLoading={isSubmittingEdit}
            >
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Konfirmasi Hapus Pengguna */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="⚠️ Konfirmasi Hapus Akun"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl text-xs text-rose-800 dark:text-rose-200 leading-relaxed">
            Apakah Anda yakin ingin menghapus akun pengguna{' '}
            <span className="font-bold">{deletingUser?.name}</span> ({deletingUser?.email})? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDeleteSubmit}
              isLoading={isSubmittingDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              <span>Hapus Akun Sekarang</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
