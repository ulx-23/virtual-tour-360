'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  Plus,
  Search,
  ExternalLink,
  Layers,
  Eye,
  Trash2,
  Edit,
  Sparkles,
  Building2,
  Upload,
  Archive,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/admin/EmptyState';

export default function ToursListPage() {
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Tour Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const fetchTours = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (statusFilter) query.set('status', statusFilter);
      const res = await fetch(`/api/tours?${query.toString()}`);
      const json = await res.json();
      if (json.success) setTours(json.data.items);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchTours();
  }, [statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, visibility }),
      });
      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        setTitle('');
        setDescription('');
        fetchTours();
      }
    } catch {}
    setIsSubmitting(false);
  };

  const handleImportBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;

    setIsImporting(true);
    setImportError(null);

    const formData = new FormData();
    formData.append('backup', importFile);

    try {
      const res = await fetch(`/api/tours/import`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        setIsImportModalOpen(false);
        setImportFile(null);
        fetchTours();
      } else {
        setImportError(json.error || 'Gagal merestore backup');
      }
    } catch (e: any) {
      setImportError(e.message || 'Kesalahan saat mengunggah berkas backup');
    }
    setIsImporting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus proyek tur ini beserta seluruh scenenya?'))
      return;
    try {
      await fetch(`/api/tours/${id}`, { method: 'DELETE' });
      fetchTours();
    } catch {}
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Virtual Tour Projects
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Daftar virtual tour 360° interaktif kampus, fasilitas publik, dan gedung
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsImportModalOpen(true)}
            variant="outline"
            size="sm"
            className="border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex-1 sm:flex-initial text-xs"
          >
            <Upload className="w-4 h-4 mr-1" />
            <span>Import Backup</span>
          </Button>
          <Button onClick={() => setIsModalOpen(true)} variant="gradient" size="sm" className="flex-1 sm:flex-initial text-xs">
            <Plus className="w-4 h-4 mr-1" />
            <span>Buat Proyek Baru</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan judul atau deskripsi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchTours()}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-xs text-slate-900 dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-44 px-3 py-2 text-xs bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-xs cursor-pointer"
        >
          <option value="">Semua Status</option>
          <option value="DRAFT">DRAFT</option>
          <option value="READY">READY</option>
          <option value="PUBLISHED">PUBLISHED</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </select>
      </div>

      {/* Grid of Tours */}
      {tours.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.map((tour) => (
            <Card
              key={tour.id}
              className="flex flex-col overflow-hidden group hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative aspect-16/9 bg-slate-900 overflow-hidden">
                {tour.coverMedia ? (
                  <img
                    src={`/${tour.coverMedia.storageKey}`}
                    alt={tour.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900">
                    <Compass className="w-10 h-10 opacity-30 mb-2" />
                    <span className="text-[11px] font-medium text-slate-400">Sampul Panorama 360°</span>
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge
                    hasDot
                    variant={
                      tour.status === 'PUBLISHED'
                        ? 'success'
                        : tour.status === 'READY'
                        ? 'info'
                        : 'default'
                    }
                  >
                    {tour.status}
                  </Badge>
                </div>
              </div>

              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-base font-bold truncate">{tour.title}</CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                  {tour.description || 'Tidak ada deskripsi tambahan.'}
                </p>
              </CardHeader>

              <CardContent className="mt-auto pt-0 p-5">
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-slate-800 text-center text-xs">
                  <div>
                    <p className="font-extrabold text-slate-900 dark:text-white">
                      {tour._count?.scenes || 0}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">Scene 360°</p>
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 dark:text-white">
                      {tour._count?.buildings || 0}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">Gedung</p>
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 dark:text-white">
                      {tour._count?.views || 0}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">Kunjungan</p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="gap-2 p-5 pt-0 border-none mt-0">
                <Link href={`/admin/tours/${tour.id}/editor`} className="flex-1">
                  <Button size="sm" variant="gradient" className="w-full text-xs">
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    <span>Studio 360°</span>
                  </Button>
                </Link>
                <Link href={`/admin/tours/${tour.id}/scenes`}>
                  <Button size="sm" variant="outline" className="text-xs" title="Kelola Scene">
                    <Layers className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                {tour.status === 'PUBLISHED' && (
                  <a href={`/tour/${tour.slug}`} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="text-xs" title="Buka Tur Publik">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(tour.id)}
                  className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  title="Hapus Tur"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Compass}
          title="Tidak Ada Virtual Tour"
          description="Belum ada proyek tur yang dibuat atau cocok dengan pencarian Anda."
          actionLabel="Buat Proyek Tur Baru"
          onAction={() => setIsModalOpen(true)}
        />
      )}

      {/* Create Tour Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Proyek Virtual Tour Baru"
        description="Isi informasi dasar proyek tur interaktif Anda"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Judul Virtual Tour"
            placeholder="cth: Tur Interaktif Kampus Utama"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Deskripsi Singkat
            </label>
            <textarea
              rows={3}
              placeholder="Jelaskan gambaran umum lokasi yang dapat dijelajahi pengunjung..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Visibilitas
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-xs cursor-pointer"
            >
              <option value="PUBLIC">Publik (Terlihat di Landing Page & Pencarian)</option>
              <option value="UNLISTED">Unlisted (Hanya yang memiliki tautan)</option>
              <option value="PRIVATE">Privat (Hanya Administrator)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="gradient" size="sm" isLoading={isSubmitting}>
              Simpan & Lanjutkan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Import Backup Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Salinan Proyek (.vtbackup.zip)"
      >
        <form onSubmit={handleImportBackup} className="space-y-4">
          <p className="text-xs text-zinc-500">
            Unggah berkas arsip (.vtbackup.zip). Sistem akan memulihkan seluruh panorama, scene, denah, dan relasi hotspot ke dalam proyek baru.
          </p>

          <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-6 text-center hover:border-indigo-500 transition-colors">
            <input
              type="file"
              accept=".zip,.vtbackup"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="hidden"
              id="backupListFileInput"
            />
            <label htmlFor="backupListFileInput" className="cursor-pointer space-y-2 block">
              <Archive className="w-8 h-8 text-zinc-400 mx-auto" />
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {importFile ? importFile.name : 'Klik untuk memilih berkas backup ZIP'}
              </p>
            </label>
          </div>

          {importError && (
            <div className="p-3 text-xs rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700">
              {importError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
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
              <span>Restore Proyek</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}