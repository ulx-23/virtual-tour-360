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
  CheckSquare,
  Square,
  Combine,
  Check,
  Pencil,
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

  // Single Scene Form
  const [sceneName, setSceneName] = useState('');
  const [sceneType, setSceneType] = useState('OUTDOOR');
  const [selectedPanoramaId, setSelectedPanoramaId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingScene, setEditingScene] = useState<any | null>(null);
  const [editingSceneName, setEditingSceneName] = useState('');
  const [isUpdatingScene, setIsUpdatingScene] = useState(false);

  // Batch Multi-Panorama Merger Form
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchSelectedIds, setBatchSelectedIds] = useState<string[]>([]);
  const [batchDefaultType, setBatchDefaultType] = useState('OUTDOOR');
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState<string | null>(null);

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

  const handleBatchCreateScenes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (batchSelectedIds.length === 0) return;

    setIsBatchSubmitting(true);
    setBatchSuccessMsg(null);
    try {
      const items = batchSelectedIds.map((id) => ({
        panoramaAssetId: id,
        sceneType: batchDefaultType,
      }));

      const res = await fetch(`/api/tours/${tourId}/scenes/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const json = await res.json();
      if (json.success) {
        setBatchSuccessMsg(json.message);
        setTimeout(() => {
          setIsBatchModalOpen(false);
          setBatchSelectedIds([]);
          setBatchSuccessMsg(null);
          loadData();
        }, 1200);
      }
    } catch {}
    setIsBatchSubmitting(false);
  };

  const toggleBatchSelect = (panoAssetId: string) => {
    setBatchSelectedIds((prev) =>
      prev.includes(panoAssetId)
        ? prev.filter((id) => id !== panoAssetId)
        : [...prev, panoAssetId]
    );
  };

  const selectAllPanoramas = () => {
    const allIds = panoramas
      .map((p) => p.panoramaAsset?.id)
      .filter((id): id is string => Boolean(id));
    setBatchSelectedIds(allIds);
  };

  const deselectAllPanoramas = () => {
    setBatchSelectedIds([]);
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

  const openEditScene = (scene: any) => {
    setEditingScene(scene);
    setEditingSceneName(scene.name || '');
  };

  const handleUpdateScene = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingScene || editingSceneName.trim().length < 2) return;
    setIsUpdatingScene(true);
    try {
      const response = await fetch(`/api/scenes/${editingScene.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingSceneName.trim() }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setEditingScene(null);
        await loadData();
      }
    } finally {
      setIsUpdatingScene(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/admin/tours/${tourId}`}>
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
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/admin/tours/${tourId}/editor`}>
            <Button size="sm" variant="outline">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              <span>Buka Studio 360°</span>
            </Button>
          </Link>

          {/* Multi-Panorama Batch Merger */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsBatchModalOpen(true)}
            className="border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
          >
            <Combine className="w-3.5 h-3.5 mr-1" />
            <span>Multi-Panorama Merger</span>
          </Button>

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
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetStartScene(scene.id)}
                      className="text-xs h-8 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    >
                      <Compass className="w-3.5 h-3.5 mr-1" />
                      Set Jadi Awal
                    </Button>
                  ) : (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold pl-2">
                      <CheckCircle className="w-3.5 h-3.5" /> Scene Awal
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    <Link href={`/admin/tours/${tourId}/editor`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Edit di 360 Studio">
                        <Sparkles className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditScene(scene)}
                      className="h-8 w-8 p-0 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                      title="Edit nama scene"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteScene(scene.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                      title="Hapus Scene"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Layers}
          title="Belum ada scene di tur ini"
          description="Gunakan fitur 'Multi-Panorama Merger' untuk menambahkan beberapa panorama sekaligus atau buat scene satu per satu."
          actionLabel="Gunakan Multi-Panorama Merger"
          onAction={() => setIsBatchModalOpen(true)}
        />
      )}

      {/* SINGLE SCENE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Scene Baru"
      >
        <form onSubmit={handleCreateScene} className="space-y-4">
          <Input
            label="Nama Scene"
            placeholder="Contoh: Lobi Gedung Utama / Lapangan"
            value={sceneName}
            onChange={(e) => setSceneName(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Tipe Area Scene
            </label>
            <select
              value={sceneType}
              onChange={(e) => setSceneType(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
            >
              <option value="OUTDOOR">OUTDOOR (Area Luar)</option>
              <option value="TRANSITION">TRANSITION (Pintu Masuk / Koridor)</option>
              <option value="INDOOR">INDOOR (Ruangan Dalam)</option>
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
                          ? 'border-indigo-600 ring-2 ring-indigo-600'
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

      <Modal
        isOpen={Boolean(editingScene)}
        onClose={() => setEditingScene(null)}
        title="Edit Nama Scene"
      >
        <form onSubmit={handleUpdateScene} className="space-y-4">
          <Input
            label="Nama scene"
            value={editingSceneName}
            onChange={(event) => setEditingSceneName(event.target.value)}
            placeholder="Contoh: Lobby Utama"
            minLength={2}
            required
          />
          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditingScene(null)}>
              Batal
            </Button>
            <Button type="submit" size="sm" isLoading={isUpdatingScene} disabled={editingSceneName.trim().length < 2}>
              Simpan Nama
            </Button>
          </div>
        </form>
      </Modal>

      {/* MULTI-PANORAMA MERGER (BATCH SCENE CREATOR) MODAL */}
      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title="Multi-Panorama Merger (Batch Scene Creator)"
      >
        <form onSubmit={handleBatchCreateScenes} className="space-y-4">
          <p className="text-xs text-zinc-500">
            Pilih sejumlah foto panorama 360° untuk langsung digabungkan menjadi scene-scene terpisah dalam proyek tur ini. Anda dapat menghubungkan navigasinya di Visual Hotspot Studio.
          </p>

          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAllPanoramas}
                className="text-xs h-7 px-2"
              >
                Pilih Semua
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={deselectAllPanoramas}
                className="text-xs h-7 px-2"
              >
                Batalkan Pilihan
              </Button>
            </div>
            <span className="text-xs font-semibold text-indigo-600">
              {batchSelectedIds.length} panorama dipilih
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Tipe Area Bawaan
            </label>
            <select
              value={batchDefaultType}
              onChange={(e) => setBatchDefaultType(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
            >
              <option value="OUTDOOR">OUTDOOR (Area Luar)</option>
              <option value="TRANSITION">TRANSITION (Pintu Masuk / Koridor)</option>
              <option value="INDOOR">INDOOR (Ruangan Dalam)</option>
            </select>
          </div>

          {/* Panorama Grid with Checkboxes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/40">
            {panoramas.map((item) => {
              const assetId = item.panoramaAsset?.id;
              if (!assetId) return null;
              const isChecked = batchSelectedIds.includes(assetId);

              return (
                <div
                  key={item.id}
                  onClick={() => toggleBatchSelect(assetId)}
                  className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition select-none flex flex-col ${
                    isChecked
                      ? 'border-indigo-600 bg-indigo-50/20 shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="relative aspect-16/9 bg-zinc-900">
                    <img
                      src={`/${item.thumbnailKey || item.storageKey}`}
                      alt={item.originalFilename}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 text-white">
                      {isChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-zinc-400" />
                      )}
                    </div>
                  </div>
                  <div className="p-1.5 text-[11px] font-medium truncate text-zinc-700 dark:text-zinc-300">
                    {item.originalFilename}
                  </div>
                </div>
              );
            })}
          </div>

          {batchSuccessMsg && (
            <div className="p-2.5 text-xs rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 font-medium">
              {batchSuccessMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsBatchModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isBatchSubmitting}
              disabled={batchSelectedIds.length === 0}
            >
              <Combine className="w-3.5 h-3.5 mr-1" />
              <span>Gabungkan {batchSelectedIds.length} Scene</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
