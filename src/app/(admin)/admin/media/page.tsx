'use client';
import React, { useEffect, useState } from 'react';
import {
  ImageIcon,
  Trash2,
  Copy,
  Check,
  Eye,
  Loader2,
  Sparkles,
  Search,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  Pencil,
} from 'lucide-react';
import { UploadDropzone } from '@/components/media/UploadDropzone';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatBytes } from '@/lib/utils';

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isCleaningUnused, setIsCleaningUnused] = useState(false);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingMedia, setEditingMedia] = useState<any | null>(null);
  const [filenameInput, setFilenameInput] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/media?limit=100');
      const json = await res.json();
      if (json.success) setMedia(json.data.items);
    } catch {
      setFeedback({ type: 'error', text: 'Gagal memuat daftar media' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleCopy = (id: string, path: string) => {
    navigator.clipboard.writeText(window.location.origin + '/' + path);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openRename = (item: any) => {
    setEditingMedia(item);
    setFilenameInput(item.originalFilename);
    setRenameError(null);
  };

  const handleRename = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingMedia) return;

    setIsRenaming(true);
    setRenameError(null);
    try {
      const response = await fetch(`/api/media/${editingMedia.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: filenameInput }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setRenameError(result.error || 'Gagal mengubah nama file.');
        return;
      }

      setMedia((items) => items.map((item) =>
        item.id === editingMedia.id ? { ...item, originalFilename: result.data.originalFilename } : item
      ));
      setFeedback({ type: 'success', text: `Nama file diubah menjadi "${result.data.originalFilename}".` });
      setEditingMedia(null);
    } catch {
      setRenameError('Koneksi gagal saat menyimpan nama file.');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteMedia = async (item: any) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus foto "${item.originalFilename}" dari library dan penyimpanan disk?`)) {
      return;
    }

    setDeletingId(item.id);
    setFeedback(null);

    try {
      const res = await fetch(`/api/media/${item.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();

      if (json.success) {
        setMedia((prev) => prev.filter((m) => m.id !== item.id));
        setFeedback({
          type: 'success',
          text: `Foto "${item.originalFilename}" berhasil dihapus secara permanen.`,
        });
      } else {
        setFeedback({
          type: 'error',
          text: json.error || 'Gagal menghapus file media',
        });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Kesalahan jaringan saat menghapus file' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCleanupUnused = async () => {
    if (
      !confirm(
        'Apakah Anda yakin ingin membersihkan semua foto/panorama yang tidak terhubung ke scene tur mana pun? File yang tidak terpakai akan dihapus dari disk untuk menghemat ruang.'
      )
    ) {
      return;
    }

    setIsCleaningUnused(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/media', {
        method: 'DELETE',
      });
      const json = await res.json();

      if (json.success) {
        setFeedback({
          type: 'success',
          text: json.message || 'Pembersihan media tidak terpakai berhasil dilakukan!',
        });
        await fetchMedia();
      } else {
        setFeedback({
          type: 'error',
          text: json.error || 'Gagal membersihkan media yang tidak terpakai',
        });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Kesalahan jaringan saat membersihkan media' });
    } finally {
      setIsCleaningUnused(false);
    }
  };

  // Filter media based on search query
  const filteredMedia = media.filter((m) =>
    m.originalFilename?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto select-none pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Panorama &amp; Media Library
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pusat pengelolaan file panorama 360°, denah lantai, dan berkas aset visual
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchMedia}
            isLoading={loading}
            className="text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            <span>Segarkan</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCleanupUnused}
            isLoading={isCleaningUnused}
            className="text-xs border-amber-300 dark:border-amber-900 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
            title="Bersihkan foto panorama yang tidak terhubung ke scene manapun"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            <span>Bersihkan Media Tak Terpakai</span>
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
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Upload Dropzone */}
      <UploadDropzone onUploadSuccess={fetchMedia} />

      {/* Media Grid Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Semua Media ({filteredMedia.length})
            </h2>
            {search && (
              <span className="text-xs text-slate-400">
                (difilter dari {media.length} total)
              </span>
            )}
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama file foto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-900 dark:text-white shadow-xs"
            />
          </div>
        </div>

        {filteredMedia.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMedia.map((item) => {
              const isPanorama = !!item.panoramaAsset;
              const isDeletingThis = deletingId === item.id;

              return (
                <Card key={item.id} className="overflow-hidden flex flex-col group border-slate-200/80 dark:border-slate-800 hover:shadow-md transition">
                  <div className="relative aspect-16/9 bg-slate-950 overflow-hidden">
                    <img
                      src={`/${item.thumbnailKey || item.storageKey}`}
                      alt={item.originalFilename}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge variant={isPanorama ? 'success' : 'default'} className="text-[9px]">
                        {isPanorama ? '360° PANORAMA' : 'GAMBAR'}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-3.5 space-y-2 mt-auto">
                    <p
                      className="text-xs font-bold text-slate-900 dark:text-white truncate"
                      title={item.originalFilename}
                    >
                      {item.originalFilename}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{item.width} × {item.height}px</span>
                      <span>{formatBytes(item.fileSize)}</span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {/* 1. Salin URL */}
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1 text-[11px] h-7 gap-1"
                        onClick={() => handleCopy(item.id, item.storageKey)}
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Salin URL</span>
                          </>
                        )}
                      </Button>

                      {/* 2. Lihat Foto */}
                      <a href={`/${item.storageKey}`} target="_blank" rel="noreferrer" title="Buka foto ukuran penuh">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-white">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </a>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openRename(item)}
                        className="h-7 w-7 p-0 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                        title="Ubah nama file"
                        aria-label={`Ubah nama file ${item.originalFilename}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>

                      {/* 3. Hapus Foto (User Request: Cara hapus media yang habis diupload) */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteMedia(item)}
                        disabled={isDeletingThis}
                        className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="Hapus foto ini dari library dan disk"
                      >
                        {isDeletingThis ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-500 space-y-1">
            <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              {search ? 'Tidak ada media yang cocok dengan pencarian' : 'Belum ada media tersimpan'}
            </p>
            <p className="text-[11px]">
              {search ? 'Coba ubah kata kunci pencarian Anda.' : 'Silakan unggah foto panorama menggunakan area dropzone di atas.'}
            </p>
          </div>
        )}
      </div>
      <Modal
        isOpen={editingMedia !== null}
        onClose={() => { if (!isRenaming) setEditingMedia(null); }}
        title="Ubah nama file"
        description="Nama tampilan berubah tanpa mengubah URL atau file fisik."
        maxWidth="sm"
      >
        <form onSubmit={handleRename} className="space-y-4">
          <div>
            <label htmlFor="media-filename" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Nama file
            </label>
            <input
              id="media-filename"
              autoFocus
              required
              maxLength={180}
              value={filenameInput}
              onChange={(event) => setFilenameInput(event.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1.5 text-[11px] text-slate-500">Pertahankan ekstensi file, misalnya .jpg atau .webp.</p>
          </div>
          {renameError && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{renameError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditingMedia(null)} disabled={isRenaming}>Batal</Button>
            <Button type="submit" isLoading={isRenaming} disabled={filenameInput.trim() === editingMedia?.originalFilename}>
              Simpan Nama
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
