'use client';
import React, { useState, useEffect } from 'react';
import {
  Compass,
  Plus,
  Trash2,
  Save,
  Undo2,
  Redo2,
  CheckCircle,
  AlertTriangle,
  Send,
  ArrowRight,
  Eye,
  Info,
  MapPin,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { MarzipanoViewer, HotspotItem } from '@/components/viewer/MarzipanoViewer';

interface Scene {
  id: string;
  name: string;
  sceneType: string;
  initialYaw: number;
  initialPitch: number;
  initialFov: number;
  panoramaAsset: {
    mediaAsset: {
      storageKey: string;
    };
  };
  sourceHotspots: HotspotItem[];
}

interface HotspotStudioProps {
  tourId: string;
  initialTour: any;
}

export function HotspotStudio({ tourId, initialTour }: HotspotStudioProps) {
  const [tour, setTour] = useState<any>(initialTour);
  const [scenes, setScenes] = useState<Scene[]>(initialTour.scenes || []);
  const [activeSceneId, setActiveSceneId] = useState<string>(
    initialTour.startSceneId || initialTour.scenes?.[0]?.id || ''
  );
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotItem | null>(null);
  const [isEditorMode, setIsEditorMode] = useState<boolean>(true);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Hotspot Form state
  const [hotspotLabel, setHotspotLabel] = useState<string>('');
  const [hotspotType, setHotspotType] = useState<string>('NAVIGATION');
  const [targetSceneId, setTargetSceneId] = useState<string>('');
  const [createReturn, setCreateReturn] = useState<boolean>(true);

  // Undo/Redo history
  const [history, setHistory] = useState<Scene[][]>([]);
  const [redoStack, setRedoStack] = useState<Scene[][]>([]);

  const activeScene = scenes.find((s) => s.id === activeSceneId);

  // Refresh tour scenes
  const reloadScenes = async () => {
    try {
      const res = await fetch(`/api/tours/${tourId}/scenes`);
      const json = await res.json();
      if (json.success) {
        setScenes(json.data);
      }
    } catch {}
  };

  // Click on Panorama in Editor Mode -> create new hotspot coordinate
  const handleViewerClick = (coords: { yaw: number; pitch: number }) => {
    const newHotspot: HotspotItem = {
      id: `temp-${Date.now()}`,
      yaw: coords.yaw,
      pitch: coords.pitch,
      label: 'Navigasi ke...',
      type: 'NAVIGATION',
      targetSceneId: scenes.find((s) => s.id !== activeSceneId)?.id || '',
    };

    setSelectedHotspot(newHotspot);
    setHotspotLabel(newHotspot.label || '');
    setHotspotType(newHotspot.type || 'NAVIGATION');
    setTargetSceneId(newHotspot.targetSceneId || '');
  };

  // Hotspot clicked on viewer
  const handleHotspotClick = (h: HotspotItem) => {
    if (!isEditorMode) {
      // In preview mode: Navigate to target scene!
      if (h.targetSceneId) {
        setActiveSceneId(h.targetSceneId);
      }
    } else {
      setSelectedHotspot(h);
      setHotspotLabel(h.label || '');
      setHotspotType(h.type || 'NAVIGATION');
      setTargetSceneId(h.targetSceneId || '');
    }
  };

  // Save Hotspot to Database
  const handleSaveHotspot = async () => {
    if (!selectedHotspot || !activeSceneId) return;

    try {
      const isNew = selectedHotspot.id.startsWith('temp-');

      if (isNew) {
        const res = await fetch(`/api/scenes/${activeSceneId}/hotspots`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tourId,
            yaw: selectedHotspot.yaw,
            pitch: selectedHotspot.pitch,
            label: hotspotLabel,
            type: hotspotType,
            targetSceneId: targetSceneId || null,
            createReturnHotspot: createReturn && hotspotType === 'NAVIGATION',
          }),
        });
        const json = await res.json();
        if (json.success) {
          setStatusMessage('Hotspot berhasil disimpan!');
          await reloadScenes();
          setSelectedHotspot(null);
        }
      } else {
        const res = await fetch(`/api/hotspots/${selectedHotspot.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: hotspotLabel,
            type: hotspotType,
            targetSceneId: targetSceneId || null,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setStatusMessage('Hotspot berhasil diperbarui!');
          await reloadScenes();
          setSelectedHotspot(null);
        }
      }
    } catch {
      setStatusMessage('Gagal menyimpan hotspot');
    }
  };

  // Delete Hotspot
  const handleDeleteHotspot = async () => {
    if (!selectedHotspot) return;
    if (selectedHotspot.id.startsWith('temp-')) {
      setSelectedHotspot(null);
      return;
    }

    try {
      const res = await fetch(`/api/hotspots/${selectedHotspot.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setStatusMessage('Hotspot berhasil dihapus!');
        await reloadScenes();
        setSelectedHotspot(null);
      }
    } catch {
      setStatusMessage('Gagal menghapus hotspot');
    }
  };

  // Run Graph Validation
  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const res = await fetch(`/api/tours/${tourId}/validate`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setValidationResult(json.data);
      }
    } catch {}
    setIsValidating(false);
  };

  // Publish Tour
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const res = await fetch(`/api/tours/${tourId}/publish`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setStatusMessage('Virtual tour berhasil dipublikasikan!');
        setTour((prev: any) => ({ ...prev, status: 'PUBLISHED' }));
        await handleValidate();
      } else {
        setStatusMessage(json.error || 'Gagal mempublikasikan tur');
      }
    } catch {
      setStatusMessage('Gagal mempublikasikan tur');
    }
    setIsPublishing(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-zinc-950 text-white overflow-hidden select-none">
      {/* 3-Panel Studio Center */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Scene List */}
        <aside className="w-80 border-r border-zinc-800 bg-zinc-900/60 backdrop-blur-md flex flex-col shrink-0">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Daftar Scene 360°</h2>
              <p className="text-[11px] text-zinc-400">{scenes.length} scene terdaftar</p>
            </div>
            <a href={`/admin/tours/${tourId}/scenes`}>
              <Button size="sm" variant="secondary" className="text-xs">
                <Plus className="w-3.5 h-3.5" />
                <span>Scene</span>
              </Button>
            </a>
          </div>

          <div className="p-3 space-y-1.5 flex-1 overflow-y-auto">
            {scenes.map((s) => {
              const isActive = s.id === activeSceneId;
              const isStart = tour.startSceneId === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setActiveSceneId(s.id);
                    setSelectedHotspot(null);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    isActive
                      ? 'border-white bg-white/10 text-white shadow-md'
                      : 'border-zinc-800/80 hover:border-zinc-700 bg-zinc-900/40 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold truncate">{s.name}</p>
                    {isStart && (
                      <Badge variant="success" className="text-[9px] px-1.5 py-0">
                        Start
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                    <span className="uppercase">{s.sceneType}</span>
                    <span>•</span>
                    <span>{s.sourceHotspots?.length || 0} Hotspot</span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* CENTER PANEL: 360° Panorama Viewer */}
        <main className="flex-1 relative bg-black flex items-center justify-center">
          {activeScene ? (
            <MarzipanoViewer
              panoramaUrl={`/${activeScene.panoramaAsset.mediaAsset.storageKey}`}
              initialYaw={activeScene.initialYaw}
              initialPitch={activeScene.initialPitch}
              initialFov={activeScene.initialFov}
              hotspots={activeScene.sourceHotspots || []}
              onHotspotClick={handleHotspotClick}
              onViewerClick={handleViewerClick}
              isEditorMode={isEditorMode}
            />
          ) : (
            <div className="text-center p-8 text-zinc-500">
              <Compass className="w-12 h-12 mx-auto mb-3 opacity-30 animate-spin" />
              <p className="text-sm">Pilih atau buat scene untuk memulai penjelajahan 360°</p>
            </div>
          )}
        </main>

        {/* RIGHT PANEL: Hotspot Inspector */}
        <aside className="w-80 border-l border-zinc-800 bg-zinc-900/60 backdrop-blur-md p-5 flex flex-col shrink-0 overflow-y-auto">
          <div className="border-b border-zinc-800 pb-3 mb-4">
            <h3 className="text-sm font-semibold text-white">Inspektor Hotspot</h3>
            <p className="text-[11px] text-zinc-400">Properti navigasi & koordinat spherical</p>
          </div>

          {selectedHotspot ? (
            <div className="space-y-4">
              <Input
                label="Label / Teks Hotspot"
                value={hotspotLabel}
                onChange={(e) => setHotspotLabel(e.target.value)}
                placeholder="cth: Masuk ke Lobi Utama"
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-300">Tipe Hotspot</label>
                <select
                  value={hotspotType}
                  onChange={(e) => setHotspotType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white"
                >
                  <option value="NAVIGATION">Navigasi Antar Scene</option>
                  <option value="FLOOR_NAVIGATION">Pindah Lantai / Gedung</option>
                  <option value="INFORMATION">Kotak Informasi Teks</option>
                  <option value="IMAGE">Tampilkan Gambar</option>
                </select>
              </div>

              {(hotspotType === 'NAVIGATION' || hotspotType === 'FLOOR_NAVIGATION') && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-300">Scene Tujuan</label>
                  <select
                    value={targetSceneId}
                    onChange={(e) => setTargetSceneId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white"
                  >
                    <option value="">-- Pilih Scene Tujuan --</option>
                    {scenes
                      .filter((s) => s.id !== activeSceneId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.sceneType})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {hotspotType === 'NAVIGATION' && selectedHotspot.id.startsWith('temp-') && (
                <label className="flex items-center gap-2 p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createReturn}
                    onChange={(e) => setCreateReturn(e.target.checked)}
                    className="rounded text-white focus:ring-white"
                  />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-white">Buat Hotspot Balik Otomatis</p>
                    <p className="text-[10px] text-zinc-400">
                      Membuat tautan 2-arah dari scene tujuan kembali ke scene ini.
                    </p>
                  </div>
                </label>
              )}

              <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-400 space-y-1">
                <p>Yaw: {selectedHotspot.yaw.toFixed(3)} rad</p>
                <p>Pitch: {selectedHotspot.pitch.toFixed(3)} rad</p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button size="sm" onClick={handleSaveHotspot} className="flex-1">
                  <Save className="w-3.5 h-3.5 mr-1" />
                  <span>Simpan</span>
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDeleteHotspot}
                  className="px-3"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-zinc-500">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Klik di panorama untuk menempatkan titik hotspot baru</p>
            </div>
          )}

          {/* Graph Validation Report in Sidebar */}
          {validationResult && (
            <div className="mt-auto pt-4 border-t border-zinc-800 space-y-2">
              <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                Status Graf Tur
              </p>
              {validationResult.isValid ? (
                <div className="p-2.5 bg-emerald-950/40 border border-emerald-800 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Graf valid ({validationResult.reachableScenesCount} scene terjangkau)</span>
                </div>
              ) : (
                <div className="p-2.5 bg-red-950/40 border border-red-800 rounded-xl text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{validationResult.criticalErrors[0] || 'Terdapat error kritis'}</span>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* BOTTOM TOOLBAR */}
      <footer className="h-16 border-t border-zinc-800 bg-zinc-900 px-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsEditorMode(!isEditorMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              isEditorMode
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>{isEditorMode ? 'Mode Editor Aktif' : 'Mode Preview Pengunjung'}</span>
          </button>

          {statusMessage && (
            <span className="text-xs text-emerald-400 font-medium">{statusMessage}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleValidate}
            isLoading={isValidating}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Validasi Graf</span>
          </Button>

          <Button
            size="sm"
            onClick={handlePublish}
            isLoading={isPublishing}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Send className="w-3.5 h-3.5 mr-1" />
            <span>Publikasikan Tur</span>
          </Button>
        </div>
      </footer>
    </div>
  );
}