'use client';
import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, RefreshCw, X, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn, formatBytes } from '@/lib/utils';

interface UploadItem {
  id: string;
  file: File;
  status: 'queued' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
  previewUrl: string;
}

interface UploadDropzoneProps {
  onUploadSuccess?: () => void;
}

export function UploadDropzone({ onUploadSuccess }: UploadDropzoneProps) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newItems: UploadItem[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      status: 'queued',
      progress: 0,
      previewUrl: URL.createObjectURL(file),
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const startUpload = async () => {
    const queuedItems = items.filter((i) => i.status === 'queued' || i.status === 'failed');
    if (queuedItems.length === 0) return;

    setIsUploading(true);

    for (const item of queuedItems) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading', progress: 20 } : i))
      );

      const formData = new FormData();
      formData.append('files', item.file);

      try {
        const res = await fetch('/api/media/uploads', {
          method: 'POST',
          body: formData,
        });
        const json = await res.json();

        if (json.success && json.data?.uploaded?.length > 0) {
          setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, status: 'completed', progress: 100 } : i))
          );
        } else {
          const errMsg = json.data?.failed?.[0]?.error || json.error || 'Upload gagal';
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, status: 'failed', progress: 0, error: errMsg } : i
            )
          );
        }
      } catch (err: any) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'failed', progress: 0, error: err.message } : i
          )
        );
      }
    }

    setIsUploading(false);
    onUploadSuccess?.();
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all',
          isDragging
            ? 'border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-900'
            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center mx-auto mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-zinc-900 dark:text-white">
          Tarik & Lepas Foto Panorama 360° di sini
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          Mendukung banyak file format JPG, PNG, atau WebP (Rasio 2:1 disarankan untuk equirectangular)
        </p>
      </div>

      {items.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Antrean Unggahan ({items.length})
            </span>
            <Button
              size="sm"
              onClick={startUpload}
              isLoading={isUploading}
              disabled={isUploading || items.every((i) => i.status === 'completed')}
            >
              Mulai Unggah Semua
            </Button>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 overflow-hidden max-h-72 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="w-10 h-10 object-cover rounded-lg border border-zinc-200 dark:border-zinc-800 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900 dark:text-white truncate">
                      {item.file.name}
                    </p>
                    <p className="text-[10px] text-zinc-400">{formatBytes(item.file.size)}</p>
                    {item.error && <p className="text-[10px] text-red-500 mt-0.5">{item.error}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.status === 'completed' && (
                    <span className="flex items-center gap-1 text-emerald-600 font-medium text-[11px]">
                      <CheckCircle2 className="w-4 h-4" /> Berhasil
                    </span>
                  )}
                  {item.status === 'failed' && (
                    <span className="flex items-center gap-1 text-red-600 font-medium text-[11px]">
                      <AlertCircle className="w-4 h-4" /> Gagal
                    </span>
                  )}
                  {item.status === 'uploading' && (
                    <span className="flex items-center gap-1 text-zinc-500 font-medium text-[11px]">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Memproses...
                    </span>
                  )}
                  {item.status !== 'uploading' && (
                    <button
                      onClick={() => removeFile(item.id)}
                      className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}