'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Layers,
  Sparkles,
  Trash2,
  ExternalLink,
  Check,
  Download,
  Upload,
  Archive,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  FileImage,
  RefreshCw,
  Loader2,
  Clock,
  HardDriveDownload,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';

export default function TourDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [tour, setTour] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validation State
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);

  // Export State
  const [activeJob, setActiveJob] = useState<any>(null);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [isStartingExport, setIsStartingExport] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<any>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadTour = async () => {
    try {
      const res = await fetch(`/api/tours/${id}`);
      const json = await res.json();
      if (json.success && json.data) {
        const t = json.data;
        setTour(t);
        setTitle(t.title);
        setDescription(t.description || '');
        setStatus(t.status);
        setVisibility(t.visibility);
      }
    } catch {}
  };

  const loadExportJobs = async () => {
    try {
      const res = await fetch(`/api/tours/${id}/export`);
      const json = await res.json();
      if (json.success && json.data) {
        setActiveJob(json.data.activeJob);
        setRecentJobs(json.data.recentJobs || []);
      }
    } catch {}
  };

  useEffect(() => {
    loadTour();
    loadExportJobs();
  }, [id]);

  // Polling export job status when active
  useEffect(() => {
    if (activeJob && (activeJob.status === 'QUEUED' || activeJob.status === 'PROCESSING')) {
      pollIntervalRef.current = setInterval(() => {
        loadExportJobs();
      }, 1500);
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [activeJob?.status]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(false);
    try {
      const res = await fetch(`/api/tours/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, status, visibility }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {}
    setIsSaving(false);
  };

  const handleValidateTour = async () => {
    setIsValidating(true);
    try {
      const res = await fetch(`/api/tours/${id}/validate`);
      const json = await res.json();
      if (json.success) {
        setValidationResult(json.data);
        setIsValidationModalOpen(true);
      }
    } catch {}
    setIsValidating(false);
  };

  const handleStartExport = async (type: 'STANDALONE_ZIP' | 'PROJECT_BACKUP' | 'ORIGINAL_PANORAMAS') => {
    setIsStartingExport(true);
    setExportError(null);
    try {
      const res = await fetch(`/api/tours/${id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const json = await res.json();
      if (json.success) {
        setActiveJob(json.data);
        loadExportJobs();
      } else {
        setExportError(json.error || 'Gagal memulai ekspor');
      }
    } catch (e: any) {
      setExportError(e.message || 'Kesalahan jaringan saat memulai ekspor');
    }
    setIsStartingExport(false);
  };

  const handleImportBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);

    const formData = new FormData();
    formData.append('backup', importFile);

    try {
      const res = await fetch(`/api/tours/import`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        setImportSuccess(json.data);
        setTimeout(() => {
          router.push(`/admin/tours/${json.data.tourId}`);
        }, 1800);
      } else {
        setImportError(json.error || 'Gagal merestore backup');
      }
    } catch (e: any) {
      setImportError(e.message || 'Kesalahan saat mengunggah berkas backup');
    }
    setIsImporting(false);
  };

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus tur ini secara permanen?')) return;
    try {
      await fetch(`/api/tours/${id}`, { method: 'DELETE' });
      router.push('/admin/tours');
    } catch {}
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let b = bytes;
    while (b >= 1024 && i < units.length - 1) {
      b /= 1024;
      i++;
    }
    return `${b.toFixed(1)} ${units[i]}`;
  };

  if (!tour) return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto select-none pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin/tours">
            <Button variant="ghost" size="sm" className="p-2 shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white truncate">
              {tour.title}
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5 truncate">
              Slug: <span className="font-mono text-zinc-700 dark:text-zinc-300">/{tour.slug}</span> • ID: <span className="font-mono">{tour.id.slice(0, 8)}...</span>
            </p>
          </div>
        </div>

        {/* Action Buttons (2x2 grid on mobile, flex on sm+) */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          {/* Preview Tour */}
          <Link href={`/tour/${tour.slug}`} target="_blank" className="w-full sm:w-auto">
            <Button size="sm" variant="outline" className="w-full sm:w-auto border-zinc-300 dark:border-zinc-700 text-xs">
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              <span>Preview</span>
            </Button>
          </Link>

          {/* Validate Tour */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleValidateTour}
            isLoading={isValidating}
            className="w-full sm:w-auto border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            <span>Validate</span>
          </Button>

          {/* Scenes Manager */}
          <Link href={`/admin/tours/${id}/scenes`} className="w-full sm:w-auto">
            <Button size="sm" variant="outline" className="w-full sm:w-auto text-xs">
              <Layers className="w-3.5 h-3.5 mr-1" />
              <span>Scenes ({tour.scenes?.length || 0})</span>
            </Button>
          </Link>

          {/* 360 Studio */}
          <Link href={`/admin/tours/${id}/editor`} className="w-full sm:w-auto">
            <Button size="sm" className="w-full sm:w-auto text-xs bg-indigo-600 hover:bg-indigo-700">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              <span>Studio 360°</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* EXPORT & VIRTUAL TOUR HUB CARD */}
      <Card className="border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/40 via-transparent to-purple-50/20 dark:from-indigo-950/20 dark:to-transparent shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Archive className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base text-zinc-900 dark:text-white leading-tight">
                  Virtual Tour Exporter & Backup Center
                </CardTitle>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Ekspor paket web mandiri (offline) atau buat salinan cadangan proyek.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsImportModalOpen(true)}
                className="text-xs"
              >
                <Upload className="w-3.5 h-3.5 mr-1" />
                <span>Import Backup</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Active Job Progress Feedback */}
          {activeJob && (
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  Sedang memproses ekspor ({activeJob.type === 'STANDALONE_ZIP' ? 'Paket Web Standalone' : activeJob.type === 'PROJECT_BACKUP' ? 'Project Backup' : 'Panorama Asli'})...
                </span>
                <span className="font-mono font-bold text-indigo-600">{activeJob.progress}%</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${activeJob.progress}%` }}
                />
              </div>
              <p className="text-[11px] text-zinc-500">
                Pemrosesan berjalan di latar belakang (Job queue). Halaman aman untuk ditinggalkan.
              </p>
            </div>
          )}

          {exportError && (
            <div className="p-3 text-xs rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{exportError}</span>
            </div>
          )}

          {/* Export Action Triggers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Standalone Virtual Tour ZIP */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-indigo-400 dark:hover:border-indigo-700 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <Download className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Export Virtual Tour</h3>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                  Paket lengkap dengan viewer Marzipano mandiri (index.html, JS/CSS, panoramas). Berjalan offline tanpa server atau database.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleStartExport('STANDALONE_ZIP')}
                disabled={activeJob?.status === 'QUEUED' || activeJob?.status === 'PROCESSING'}
                className="w-full"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                <span>Export Tour (ZIP)</span>
              </Button>
            </div>

            {/* 2. Project Backup (.vtbackup.zip) */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-emerald-400 dark:hover:border-emerald-700 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <Archive className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Export Project Backup</h3>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                  Salinan proyek lengkap (.vtbackup.zip) mencakup metadata, scene, denah, dan relasi hotspot untuk diedit kembali.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStartExport('PROJECT_BACKUP')}
                disabled={activeJob?.status === 'QUEUED' || activeJob?.status === 'PROCESSING'}
                className="w-full border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                <Archive className="w-3.5 h-3.5 mr-1.5" />
                <span>Export Backup (.zip)</span>
              </Button>
            </div>

            {/* 3. Original Panoramas Only */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-violet-400 dark:hover:border-violet-700 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
                    <FileImage className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Download Panoramas</h3>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                  Unduh seluruh berkas foto 360° panorama asli beresolusi penuh yang digunakan dalam tur ini dalam 1 arsip ZIP.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStartExport('ORIGINAL_PANORAMAS')}
                disabled={activeJob?.status === 'QUEUED' || activeJob?.status === 'PROCESSING'}
                className="w-full border-violet-300 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-950/30"
              >
                <HardDriveDownload className="w-3.5 h-3.5 mr-1.5" />
                <span>Download Panoramas</span>
              </Button>
            </div>
          </div>

          {/* Recent Exports / Downloads Table */}
          {recentJobs.length > 0 && (
            <div className="pt-2">
              <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Riwayat Berkas Ekspor Tersedia:</span>
              </h4>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900/60">
                {recentJobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="p-3 flex items-center justify-between text-xs gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 dark:text-white truncate">
                        {job.fileName || `${job.type} (Job #${job.id.slice(0, 6)})`}
                      </p>
                      <p className="text-[11px] text-zinc-500 flex items-center gap-2 mt-0.5">
                        <span>Ukuran: {formatFileSize(job.fileSize)}</span>
                        <span>•</span>
                        <span>Dibuat: {new Date(job.createdAt).toLocaleTimeString()}</span>
                        <span>•</span>
                        <Badge
                          variant={job.status === 'COMPLETED' ? 'success' : job.status === 'FAILED' ? 'danger' : 'warning'}
                          className="text-[10px] py-0 px-1.5"
                        >
                          {job.status}
                        </Badge>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {job.status === 'COMPLETED' && job.downloadUrl ? (
                        <>
                        <a href={job.downloadUrl} download>
                          <Button size="sm" variant="outline" className="text-xs h-7 px-2.5">
                            <Download className="w-3 h-3 mr-1" />
                            <span>Download ZIP</span>
                          </Button>
                        </a>
                        {job.type === 'STANDALONE_ZIP' && (
                          <a href={`/api/tours/${id}/export/download/${job.id}/html`} download>
                            <Button size="sm" variant="outline" className="text-xs h-7 px-2.5">
                              <Download className="w-3 h-3 mr-1" />
                              <span>Single HTML</span>
                            </Button>
                          </a>
                        )}
                        </>
                      ) : job.status === 'FAILED' ? (
                        <span className="text-[11px] text-red-500 font-medium">
                          {job.errorMessage || 'Gagal'}
                        </span>
                      ) : (
                        <span className="text-[11px] text-indigo-500 font-medium flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Memproses ({job.progress}%)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tour Metadata Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Proyek Tur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Judul Proyek"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Deskripsi
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-xs"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Status Tur
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-xs"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="READY">READY</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Visibilitas
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-xs"
                >
                  <option value="PUBLIC">PUBLIC</option>
                  <option value="UNLISTED">UNLISTED</option>
                  <option value="PRIVATE">PRIVATE</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          {success && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Perubahan berhasil disimpan!
            </span>
          )}
          <div className="ml-auto">
            <Button type="submit" isLoading={isSaving} size="md">
              <Save className="w-4 h-4 mr-1.5" />
              <span>Simpan Perubahan</span>
            </Button>
          </div>
        </div>
      </form>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-950/60 bg-red-50/20">
        <CardHeader>
          <CardTitle className="text-base text-red-600">Zona Berbahaya</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            Menghapus proyek tur akan menghapus seluruh scene, relasi hotspot, dan denah terkait.
          </p>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            <span>Hapus Proyek Tur</span>
          </Button>
        </CardContent>
      </Card>

      {/* VALIDATE TOUR MODAL */}
      <Modal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        title="Laporan Validasi Relasi & Graf Tur"
      >
        {validationResult && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800">
                {validationResult.isValid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div>
                <p className="font-semibold text-zinc-900 dark:text-white">
                  {validationResult.isValid ? 'Semua Hubungan Scene Valid!' : 'Ditemukan Kendala Hubungan Scene'}
                </p>
                <p className="text-zinc-500">
                  Total Scene: {validationResult.totalScenes} • Scene Terjangkau (BFS): {validationResult.reachableScenesCount}
                </p>
              </div>
            </div>

            {/* Critical Errors */}
            {validationResult.criticalErrors?.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-semibold text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Kesalahan Kritis ({validationResult.criticalErrors.length}):
                </span>
                <ul className="list-disc pl-5 space-y-1 text-red-600 dark:text-red-400">
                  {validationResult.criticalErrors.map((err: string, i: number) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {validationResult.warnings?.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-semibold text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Peringatan Navigasi ({validationResult.warnings.length}):
                </span>
                <ul className="list-disc pl-5 space-y-1 text-amber-600 dark:text-amber-400">
                  {validationResult.warnings.map((w: string, i: number) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {validationResult.isValid && (
              <p className="text-emerald-600 font-medium">
                Proyek tur siap diekspor menjadi paket mandiri atau dipublikasikan.
              </p>
            )}

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setIsValidationModalOpen(false)}>
                Tutup Laporan
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* IMPORT BACKUP MODAL */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Salinan Proyek (.vtbackup.zip)"
      >
        <form onSubmit={handleImportBackup} className="space-y-4">
          <p className="text-xs text-zinc-500">
            Pilih berkas arsip backup Virtual Tour (.vtbackup.zip). Sistem akan memverifikasi integritas, mencegah zip traversal, memulihkan seluruh panorama, scene, denah, dan relasi hotspot.
          </p>

          <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-6 text-center hover:border-indigo-500 transition-colors">
            <input
              type="file"
              accept=".zip,.vtbackup"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="hidden"
              id="backupFileInput"
            />
            <label htmlFor="backupFileInput" className="cursor-pointer space-y-2 block">
              <Archive className="w-8 h-8 text-zinc-400 mx-auto" />
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {importFile ? importFile.name : 'Klik untuk memilih berkas backup ZIP'}
              </p>
              {importFile && (
                <p className="text-[11px] text-zinc-400">
                  Ukuran: {formatFileSize(importFile.size)}
                </p>
              )}
            </label>
          </div>

          {importError && (
            <div className="p-3 text-xs rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300">
              {importError}
            </div>
          )}

          {importSuccess && (
            <div className="p-3 text-xs rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300">
              Proyek berhasil dipulihkan! Mengalihkan ke proyek baru...
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsImportModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!importFile}
              isLoading={isImporting}
            >
              <Upload className="w-3.5 h-3.5 mr-1" />
              <span>Mulai Restore</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
