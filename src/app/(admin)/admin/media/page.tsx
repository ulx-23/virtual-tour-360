'use client';
import React, { useEffect, useState } from 'react';
import { ImageIcon, Trash2, Copy, Check, Eye } from 'lucide-react';
import { UploadDropzone } from '@/components/media/UploadDropzone';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatBytes } from '@/lib/utils';

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/media?limit=50');
      const json = await res.json();
      if (json.success) setMedia(json.data.items);
    } catch {}
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto select-none">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Panorama & Media Library
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Pusat pengelolaan file panorama 360°, denah lantai, dan gambar aset
        </p>
      </div>

      {/* Upload Dropzone */}
      <UploadDropzone onUploadSuccess={fetchMedia} />

      {/* Media Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Semua Media ({media.length})
          </h2>
          <Button size="sm" variant="ghost" onClick={fetchMedia}>
            Segarkan
          </Button>
        </div>

        {media.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {media.map((item) => {
              const isPanorama = !!item.panoramaAsset;
              return (
                <Card key={item.id} className="overflow-hidden flex flex-col group">
                  <div className="relative aspect-16/9 bg-zinc-900 overflow-hidden">
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
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate" title={item.originalFilename}>
                      {item.originalFilename}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span>{item.width} × {item.height}px</span>
                      <span>{formatBytes(item.fileSize)}</span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
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
                      <a href={`/${item.storageKey}`} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center border border-dashed rounded-2xl text-xs text-zinc-500">
            Belum ada media tersimpan. Silakan unggah foto menggunakan area dropzone di atas.
          </div>
        )}
      </div>
    </div>
  );
}