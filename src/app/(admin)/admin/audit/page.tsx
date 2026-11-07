'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  User,
  Trash2,
  RefreshCw,
  Search,
  Calendar,
  Filter,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  Database,
  ArrowRight,
  FileText,
  AlertCircle,
  Activity,
  Layers,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface Actor {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

interface AuditLogItem {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadataJson: string | null;
  createdAt: string;
  actor?: Actor | null;
}

interface AuditStats {
  totalLogs: number;
  logsPast30Days: number;
  logsOlderThan30Days: number;
  logsToday: number;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [stats, setStats] = useState<AuditStats>({
    totalLogs: 0,
    logsPast30Days: 0,
    logsOlderThan30Days: 0,
    logsToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isSuperOrAdmin, setIsSuperOrAdmin] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [daysFilter, setDaysFilter] = useState('all');

  // Feedback Toast
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal: Purge / Bersihkan Log Massal
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [purgeOption, setPurgeOption] = useState<'30' | '60' | '90' | 'all'>('30');
  const [isSubmittingPurge, setIsSubmittingPurge] = useState(false);

  // Modal: Inspect Metadata
  const [inspectLog, setInspectLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = async (autoPrune = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (actionFilter) params.set('action', actionFilter);
      if (daysFilter) params.set('days', daysFilter);
      if (autoPrune) params.set('autoPrune', 'true');

      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setLogs(json.data.logs);
        setStats(json.data.stats);
        setIsSuperOrAdmin(json.data.isSuperOrAdmin);

        if (json.data.prunedCount > 0) {
          setFeedback({
            type: 'success',
            text: `Siklus bulanan aktif: ${json.data.prunedCount} log usang (> 30 hari) berhasil dibersihkan otomatis.`,
          });
        }
      } else {
        setFeedback({ type: 'error', text: json.error || 'Gagal memuat log audit' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Kesalahan jaringan saat memuat data audit' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, daysFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  // 1-Click Monthly Quick Prune (Log > 30 hari / 1 bulan)
  const handleQuickMonthlyPrune = async () => {
    if (stats.logsOlderThan30Days === 0) {
      setFeedback({
        type: 'success',
        text: 'Tidak ada log yang lebih lama dari 30 hari (1 bulan). Database Anda sudah bersih!',
      });
      return;
    }

    if (
      !confirm(
        `Apakah Anda yakin ingin membersihkan ${stats.logsOlderThan30Days} log audit yang berumur lebih dari 30 hari (1 bulan)?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/admin/audit', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ olderThanDays: 30 }),
      });
      const json = await res.json();

      if (json.success) {
        setFeedback({
          type: 'success',
          text: json.message || 'Pembersihan log bulanan berhasil dijalankan!',
        });
        await fetchLogs();
      } else {
        setFeedback({ type: 'error', text: json.error || 'Gagal membersihkan log audit' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Kesalahan jaringan saat membersihkan log' });
    } finally {
      setLoading(false);
    }
  };

  // Purge Modal Submit
  const handleExecutePurge = async () => {
    setIsSubmittingPurge(true);
    setFeedback(null);

    const olderThanDays = purgeOption === 'all' ? 0 : parseInt(purgeOption, 10);

    try {
      const res = await fetch('/api/admin/audit', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          all: purgeOption === 'all',
          olderThanDays,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setIsPurgeModalOpen(false);
        setFeedback({
          type: 'success',
          text: json.message || 'Log audit berhasil dibersihkan!',
        });
        await fetchLogs();
      } else {
        setFeedback({ type: 'error', text: json.error || 'Gagal membersihkan log audit' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Kesalahan saat mengeksekusi pembersihan log' });
    } finally {
      setIsSubmittingPurge(false);
    }
  };

  // Delete Single Log
  const handleDeleteSingleLog = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus baris log audit ini?')) return;

    try {
      const res = await fetch(`/api/admin/audit/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();

      if (json.success) {
        setLogs((prev) => prev.filter((item) => item.id !== id));
        setStats((prev) => ({
          ...prev,
          totalLogs: Math.max(0, prev.totalLogs - 1),
        }));
        setFeedback({ type: 'success', text: 'Satu baris log berhasil dihapus' });
      } else {
        setFeedback({ type: 'error', text: json.error || 'Gagal menghapus log' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Kesalahan saat menghapus baris log' });
    }
  };

  // Action badge visual color resolver
  const getActionBadgeVariant = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('LOGIN') || act.includes('CREATE')) {
      return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
    if (act.includes('UPDATE')) {
      return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
    if (act.includes('DELETE') || act.includes('PURGE')) {
      return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    }
    if (act.includes('PUBLISH')) {
      return 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    }
    return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 30) return `${diffDays} hari lalu`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} bulan lalu`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto select-none pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Security & Audit Trail
            </h1>
            <Badge variant="indigo" className="text-[10px] font-bold">
              AUDIT LOGS
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Riwayat lengkap autentikasi, modifikasi akun pengguna, dan tata kelola keamanan platform
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchLogs()}
            isLoading={loading}
            className="text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            <span>Segarkan</span>
          </Button>

          {isSuperOrAdmin && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsPurgeModalOpen(true)}
              className="text-xs border-rose-300 dark:border-rose-900/80 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              <span>Kelola Retensi Log</span>
            </Button>
          )}
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

      {/* 1. Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Logs */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Riwayat Log</p>
            <p className="text-xl font-black text-slate-900 dark:text-white leading-tight">{stats.totalLogs}</p>
          </div>
        </div>

        {/* Logs Past 30 Days */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Log 30 Hari Terakhir</p>
            <p className="text-xl font-black text-slate-900 dark:text-white leading-tight">{stats.logsPast30Days}</p>
          </div>
        </div>

        {/* Logs Older Than 30 Days (Ready for Monthly Refresh) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Log Usang &gt; 30 Hari</p>
            <p className="text-xl font-black text-slate-900 dark:text-white leading-tight">{stats.logsOlderThan30Days}</p>
          </div>
        </div>

        {/* Logs Today */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Aktivitas Hari Ini</p>
            <p className="text-xl font-black text-slate-900 dark:text-white leading-tight">{stats.logsToday}</p>
          </div>
        </div>
      </div>

      {/* 2. Monthly Retention Callout Banner (User Request: Refresh audit log 1 bulan 1 kali) */}
      <div className="p-5 rounded-3xl border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 dark:from-indigo-950/30 dark:via-slate-900/50 dark:to-purple-950/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/25 shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Siklus Pembersihan &amp; Retensi Bulanan (1 Bulan 1 Kali)
              </h3>
              <Badge variant="default" className="text-[10px] bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-400/30">
                Otomatis / Manual
              </Badge>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              Log aktivitas disarankan dibersihkan secara berkala setiap 30 hari sekali untuk menghemat ruang penyimpanan MySQL.
              Saat ini terdapat <span className="font-bold text-indigo-600 dark:text-indigo-400">{stats.logsOlderThan30Days} baris log usang</span> yang berumur lebih dari 30 hari.
            </p>
          </div>
        </div>

        {isSuperOrAdmin && (
          <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
            <Button
              type="button"
              size="sm"
              variant="gradient"
              onClick={handleQuickMonthlyPrune}
              disabled={stats.logsOlderThan30Days === 0}
              className="text-xs shadow-md"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              <span>Bersihkan Log &gt; 30 Hari ({stats.logsOlderThan30Days})</span>
            </Button>
          </div>
        )}
      </div>

      {/* 3. Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan aksi, nama pengguna, email, atau entitas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-white shadow-xs"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-xs cursor-pointer"
          >
            <option value="">Semua Jenis Aksi</option>
            <option value="auth.login">auth.login</option>
            <option value="USER_CREATED">USER_CREATED</option>
            <option value="USER_UPDATED">USER_UPDATED</option>
            <option value="USER_DELETED">USER_DELETED</option>
            <option value="USER_PROFILE_UPDATED">USER_PROFILE_UPDATED</option>
            <option value="PURGE_AUDIT_LOGS">PURGE_AUDIT_LOGS</option>
            <option value="AUTO_PURGE_AUDIT_LOGS_MONTHLY">AUTO_PURGE_BULANAN</option>
          </select>

          {/* Time Filter */}
          <select
            value={daysFilter}
            onChange={(e) => setDaysFilter(e.target.value)}
            className="w-full sm:w-40 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-xs cursor-pointer"
          >
            <option value="all">Semua Waktu</option>
            <option value="7">7 Hari Terakhir</option>
            <option value="30">30 Hari Terakhir</option>
            <option value="90">90 Hari Terakhir</option>
          </select>
        </div>
      </div>

      {/* 4. Audit Log List Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <span>Riwayat Aktivitas Tercatat</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                {logs.length} data
              </span>
            </CardTitle>

            <span className="text-xs text-slate-400 font-medium">
              Menampilkan {logs.length} entri terbaru
            </span>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
              <span>Memuat data audit log...</span>
            </div>
          ) : logs.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {logs.map((log) => {
                const actionBadgeClass = getActionBadgeVariant(log.action);
                const hasMetadata = Boolean(log.metadataJson);

                return (
                  <div
                    key={log.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 -mx-4 px-4 sm:-mx-6 sm:px-6 transition"
                  >
                    {/* Left: Actor Info & Action Details */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {log.actor?.avatar ? (
                          <img
                            src={`/${log.actor.avatar}`}
                            alt={log.actor?.name || 'Aktor'}
                            className="w-10 h-10 rounded-2xl object-cover shadow-xs ring-1 ring-slate-200 dark:ring-slate-800"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                            {log.actor?.name ? log.actor.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                            {log.actor?.name || 'Sistem Otomatis / Anonim'}
                          </p>
                          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-semibold ${actionBadgeClass}`}>
                            {log.action}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                          {log.actor?.email && (
                            <span className="font-mono text-[11px] text-slate-400 truncate">
                              {log.actor.email}
                            </span>
                          )}
                          <span>•</span>
                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                            Entitas: {log.entityType}
                          </span>
                          {log.entityId && (
                            <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                              ID: {log.entityId.slice(0, 8)}...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Timestamp & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      <div className="text-left sm:text-right">
                        <p className="font-semibold text-slate-700 dark:text-slate-200 text-xs">
                          {formatRelativeTime(log.createdAt)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.createdAt).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Inspect Metadata Button */}
                        {hasMetadata && (
                          <button
                            type="button"
                            onClick={() => setInspectLog(log)}
                            aria-label="Lihat metadata JSON"
                            className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Lihat detail metadata JSON"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Single Log Button */}
                        {isSuperOrAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSingleLog(log.id)}
                            aria-label="Hapus baris log ini"
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Hapus baris log ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Tidak Ada Riwayat Log Ditemukan
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {search || actionFilter || daysFilter !== 'all'
                  ? 'Coba sesuaikan kata kunci pencarian atau reset filter di atas.'
                  : 'Belum ada aktivitas audit log yang tercatat dalam sistem.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL 1: Purge & Retensi Log Massal */}
      <Modal
        isOpen={isPurgeModalOpen}
        onClose={() => setIsPurgeModalOpen(false)}
        title="Kelola Retensi & Pembersihan Audit Log"
        description="Bersihkan log usang secara berkala untuk menjaga kebersihan dan performa database"
      >
        <div className="space-y-4 pt-2">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold">Tindakan Permanen</p>
              <p className="mt-0.5 text-amber-700 dark:text-amber-300">
                Data audit log yang dihapus tidak dapat dipulihkan kembali. Tindakan pembersihan ini akan dicatat dalam log keamanan baru.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Pilih Kebijakan Rentang Pembersihan:
            </label>

            <div className="space-y-2">
              {/* Option 30 Days (Recommended) */}
              <label
                className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                  purgeOption === '30'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <input
                  type="radio"
                  name="purgeOption"
                  value="30"
                  checked={purgeOption === '30'}
                  onChange={() => setPurgeOption('30')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-xs min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      Hapus Log Lebih Lama dari 1 Bulan (&gt; 30 Hari)
                    </span>
                    <Badge variant="default" className="text-[9px] bg-indigo-600 text-white">
                      Rekomendasi
                    </Badge>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    Menghapus {stats.logsOlderThan30Days} log usang dan mempertahankan riwayat aktivitas 30 hari terakhir.
                  </p>
                </div>
              </label>

              {/* Option 60 Days */}
              <label
                className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                  purgeOption === '60'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <input
                  type="radio"
                  name="purgeOption"
                  value="60"
                  checked={purgeOption === '60'}
                  onChange={() => setPurgeOption('60')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-xs min-w-0">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Hapus Log Lebih Lama dari 2 Bulan (&gt; 60 Hari)
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    Mempertahankan log dua bulan terakhir untuk keperluan investigasi keamanan mendalam.
                  </p>
                </div>
              </label>

              {/* Option 90 Days */}
              <label
                className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                  purgeOption === '90'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <input
                  type="radio"
                  name="purgeOption"
                  value="90"
                  checked={purgeOption === '90'}
                  onChange={() => setPurgeOption('90')}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-xs min-w-0">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Hapus Log Lebih Lama dari 3 Bulan (&gt; 90 Hari)
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    Retensi standar triwulan (quarterly retention policy).
                  </p>
                </div>
              </label>

              {/* Option All */}
              <label
                className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                  purgeOption === 'all'
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <input
                  type="radio"
                  name="purgeOption"
                  value="all"
                  checked={purgeOption === 'all'}
                  onChange={() => setPurgeOption('all')}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div className="text-xs min-w-0">
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    Hapus Seluruh Riwayat Log (Reset Bersih Total)
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    Menghapus seluruh {stats.totalLogs} log yang ada di sistem tanpa pengecualian.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPurgeModalOpen(false)}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleExecutePurge}
              isLoading={isSubmittingPurge}
              className="text-xs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              <span>Eksekusi Pembersihan</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Inspect Metadata JSON */}
      <Modal
        isOpen={Boolean(inspectLog)}
        onClose={() => setInspectLog(null)}
        title="Detail Metadata Audit Log"
        description={`Aksi: ${inspectLog?.action || ''} • Entitas: ${inspectLog?.entityType || ''}`}
        maxWidth="lg"
      >
        {inspectLog && (
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs space-y-1">
              <p>
                <span className="font-semibold text-slate-500">ID Log:</span>{' '}
                <span className="font-mono text-slate-800 dark:text-slate-200">{inspectLog.id}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-500">Waktu:</span>{' '}
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {new Date(inspectLog.createdAt).toLocaleString('id-ID')}
                </span>
              </p>
              <p>
                <span className="font-semibold text-slate-500">Aktor:</span>{' '}
                <span>{inspectLog.actor?.name || 'Sistem Otomatis'} ({inspectLog.actor?.email || '-'})</span>
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Payload Metadata (JSON):
              </p>
              <pre className="p-3.5 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-64 border border-slate-800">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(inspectLog.metadataJson || '{}'), null, 2);
                  } catch {
                    return inspectLog.metadataJson || '{}';
                  }
                })()}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInspectLog(null)}
                className="text-xs"
              >
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
