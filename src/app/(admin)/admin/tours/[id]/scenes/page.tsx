'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Layers,
  Plus,
  Trash2,
  Sparkles,
  ArrowLeft,
  CheckCircle,
  Eye,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/admin/EmptyState';

export default function TourScenesPage() {
  const params = useParams();
  const router = useRouter();
  const tourId = params.id as string;

  const [tour, setTour] = useState<any>(null);
  const [scenes, setScenes] = useState<any[]>([]);
  const [panoramas, setPanoramas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [sceneName, setSceneName] = useState('');
  const [sceneType, setSceneType] = useState('OUTDOOR');
  const [selectedPanoramaId, setSelectedPanoramaId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tourRes, scenesRes, mediaRes] = await Promise.all([
        fetch(`/api/tours/${tourId}`),
        fetch(`/api/tours/${tourId}/scenes`),
        fetch(`/api/media?panoramaOnly=true&limit=100`),
      ]);
      const [tourJson, scenesJson, mediaJson] = await Promise.all([
        tourRes.json(),
        scenesRes.json(),
        mediaRes.json(),
      ]);

      if (tourJson.success) setTour(tourJson.data);
      if (scenesJson.success) setScenes(scenesJson.data);
      if (mediaJson.success) setPanoramas(mediaJson.data.items);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [tourId]);

  const handleCreateScene = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tours/${tourId}/scenes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sceneName,
          sceneType,
          panoramaAssetId: selectedPanoramaId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        setSceneName('');
        setSelectedPanoramaId('');
        loadData();
      }
    } catch {}
    setIsSubmitting(false);
  };

  const handleSetStartScene = async (sceneId: string) => {
    try {
      await fetch(`/api/tours/${tourId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startSceneId: sceneId }),
      });
      loadData();
    } catch {}
  };

  const handleDeleteScene = async (sceneId: string) => {
    if (!confirm('Hapus scene ini beserta seluruh hotspot di dalamnya?')) return;
    try {
      await fetch(`/api/scenes/${sceneId}`, { method: 'DELETE' });
      loadData();
    } catch {}
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      <div className="flex items-center gap-3">
        <Link href={`/admin/tours`}>
          <Button variant="ghost" size="sm" className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Kelola Scene — {tour?.title || 'Tour'}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Daftar scene 360° outdoor, transition, dan indoor untuk virtual tour ini
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Link href={`/admin/tours/${tourId}/editor`}>
            <Button size="sm" variant="outline">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              <span>Buka Studio 360°</span>
            </Button>
          </Link>
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            <span>Tambah Scene Baru</span>
          </Button>
        </div>
      </div>

      {scenes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenes.map((scene) => {
            const isStart = tour?.startSceneId === scene.id;
            return (
              <Card key={scene.id} className="overflow-hidden flex flex-col group">
                <div className="relative aspect-16/9 bg-zinc-900">
                  <img
                    src={`/${scene.panoramaAsset?.mediaAsset?.storageKey}`}
                    alt={scene.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant="default" className="text-[10px] uppercase font-semibold">
                      {scene.sceneType}
                    </Badge>
                  </div>
                  {isStart && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="success" className="text-[10px] font-bold">
                        START SCENE
                      </Badge>
                    </div>
                  )}
                </div>

                <CardHeader>
                  <CardTitle className="text-base truncate">{scene.name}</CardTitle>
                  <p className="text-xs text-zinc-400">
                    {scene.sourceHotspots?.length || 0} Hotspot Navigasi
                  </p>
                </CardHeader>

                <CardContent className="mt-auto pt-0 flex items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800 py-3">
                  {!isStart ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-zinc-500 hover:text-emerald-600"
                      onClick={() => handleSetStartScene(scene.id)}
                    >
                      Jadikan Start Scene
                    </Button>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Scene Awal
                    </span>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteScene(scene.id)}
                    className="text-zinc-400 hover:text-red-600 p-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Layers}
          title="Belum Ada Scene Terdaftar"
          description="Tambahkan scene panorama 360° agar pengunjung dapat menjelajahi virtual tour ini."
          actionLabel="Tambah Scene Sekarang"
          onAction={() => setIsModalOpen(true)}
        />
      )}

      {/* Modal Add Scene */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Scene 360° Baru"
        description="Pilih foto panorama dari pustaka media dan beri nama scene"
      >
        <form onSubmit={handleCreateScene} className="space-y-4">
          <Input
            label="Nama Scene"
            placeholder="cth: Gerbang Utama / Ruang Lab Komputer"
            value={sceneName}
            onChange={(e) => setSceneName(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Kategori Scene
            </label>
            <select
              value={sceneType}
              onChange={(e) => setSceneType(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-xs"
            >
              <option value="OUTDOOR">OUTDOOR (Halaman, Gerbang, Parkir, Lapangan)</option>
              <option value="TRANSITION">TRANSITION (Pintu Masuk, Tangga, Koridor Penghubung)</option>
              <option value="INDOOR">INDOOR (Ruang Kelas, Lobi, Laboratorium, Perpustakaan)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Pilih Foto Panorama 360°
            </label>
            {panoramas.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                {panoramas.map((item) => {
                  const isSelected = selectedPanoramaId === item.panoramaAsset?.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedPanoramaId(item.panoramaAsset?.id)}
                      className={`relative aspect-16/9 rounded-lg overflow-hidden border-2 cursor-pointer transition ${
                        isSelected
                          ? 'border-zinc-900 ring-2 ring-zinc-900'
                          : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={`/${item.thumbnailKey || item.storageKey}`}
                        alt={item.originalFilename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center border border-dashed rounded-xl text-xs text-zinc-500">
                Belum ada foto panorama. Silakan unggah foto di menu Panorama Library terlebih dahulu.
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isSubmitting}
              disabled={!selectedPanoramaId}
            >
              Simpan Scene
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}