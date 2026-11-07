'use client';
import React, { useState, useEffect, useRef } from 'react';
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
  Crosshair,
  Sliders,
  DoorOpen,
  Footprints,
  Move,
  Check,
  RotateCcw,
  Palette,
  Settings2,
  ExternalLink,
  Milestone,
  X,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import type { HotspotItem } from '@/components/viewer/MarzipanoViewer';

const MarzipanoViewer = dynamic(
  () => import('@/components/viewer/MarzipanoViewer').then((mod) => mod.MarzipanoViewer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-black flex items-center justify-center text-zinc-500 font-mono text-xs">
        Memuat Studio 360°...
      </div>
    ),
  }
);

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
  initialSceneId?: string;
}

export function HotspotStudio({ tourId, initialTour, initialSceneId }: HotspotStudioProps) {
  const [tour, setTour] = useState<any>(initialTour);
  const [scenes, setScenes] = useState<Scene[]>(initialTour.scenes || []);
  const [activeSceneId, setActiveSceneId] = useState<string>(
    initialSceneId || initialTour.startSceneId || initialTour.scenes?.[0]?.id || ''
  );
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotItem | null>(null);
  const [isEditorMode, setIsEditorMode] = useState<boolean>(true);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSavingHotspot, setIsSavingHotspot] = useState(false);
  const [isDeletingHotspot, setIsDeletingHotspot] = useState(false);
  const [isPositionEditMode, setIsPositionEditMode] = useState(false);
  const [savedAlert, setSavedAlert] = useState(false);

  // Mobile Panel View ('viewer' | 'scenes' | 'inspector')
  const [mobileView, setMobileView] = useState<'viewer' | 'scenes' | 'inspector'>('viewer');

  // Inspector Tab
  const [activeTab, setActiveTab] = useState<'nav' | 'style' | 'position'>('nav');

  // Hotspot Form state
  const [hotspotLabel, setHotspotLabel] = useState<string>('');
  const [hotspotType, setHotspotType] = useState<string>('NAVIGATION');
  const [targetSceneId, setTargetSceneId] = useState<string>('');
  const [createReturn, setCreateReturn] = useState<boolean>(true);

  // Button Design Customization States
  const [buttonStyle, setButtonStyle] = useState<'pill' | 'beacon' | 'chevron' | 'card'>('pill');
  const [buttonSize, setButtonSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [colorTheme, setColorTheme] = useState<'indigo' | 'emerald' | 'amber' | 'sky' | 'rose' | 'glass'>('indigo');
  const [buttonIcon, setButtonIcon] = useState<string>('arrow-right');
  const [alwaysShowLabel, setAlwaysShowLabel] = useState<boolean>(true);
  const [pulseAnimation, setPulseAnimation] = useState<boolean>(true);
  const [buttonSubtitle, setButtonSubtitle] = useState<string>('');

  // Coordinate Positioning & Live Camera
  const [hotspotYaw, setHotspotYaw] = useState<number>(0);
  const [hotspotPitch, setHotspotPitch] = useState<number>(0);
  const cameraViewRef = useRef<{ yaw: number; pitch: number }>({ yaw: 0, pitch: 0 });

  // Undo/Redo history
  const [history, setHistory] = useState<Scene[][]>([]);
  const [redoStack, setRedoStack] = useState<Scene[][]>([]);

  const activeScene = scenes.find((s) => s.id === activeSceneId);
  const isSceneLink = hotspotType === 'NAVIGATION' || hotspotType === 'FLOOR_NAVIGATION';
  const labelForScene = (sceneId: string) => {
    const scene = scenes.find((item) => item.id === sceneId);
    return scene ? `Masuk ke ${scene.name}` : '';
  };

  // Refresh tour scenes
  const reloadScenes = async () => {
    const res = await fetch(`/api/tours/${tourId}/scenes`, { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Gagal memuat ulang scene');
    setScenes(json.data);
  };

  // Click on Panorama in Editor Mode -> create or move hotspot directly on photo
  const handleViewerClick = (coords: { yaw: number; pitch: number }) => {
    // If a hotspot is currently selected, clicking on the photo moves it to that exact spot!
    if (selectedHotspot) {
      if (selectedHotspot.id.startsWith('temp-') || isPositionEditMode) {
        updatePosition(coords.yaw, coords.pitch);
        setStatusMessage('Posisi tombol dipindahkan ke titik yang Anda klik di foto.');
      } else {
        setStatusMessage('Tombol tersimpan terkunci. Aktifkan Edit Posisi untuk memindahkannya.');
      }
      return;
    }

    const nextScene = scenes.find((s) => s.id !== activeSceneId);
    const newHotspot: HotspotItem = {
      id: `temp-${Date.now()}`,
      yaw: coords.yaw,
      pitch: coords.pitch,
      label: nextScene ? labelForScene(nextScene.id) : '',
      type: 'NAVIGATION',
      targetSceneId: nextScene?.id || '',
      contentJson: JSON.stringify({
        buttonStyle: 'pill',
        buttonSize: 'md',
        colorTheme: 'emerald',
        icon: 'door',
        alwaysShowLabel: true,
        pulseAnimation: true,
        subtitle: '',
      }),
    };

    // Immediately display the new hotspot on screen!
    setScenes((prev) =>
      prev.map((s) => {
        if (s.id !== activeSceneId) return s;
        const cleanList = s.sourceHotspots.filter((item) => !item.id.startsWith('temp-'));
        return {
          ...s,
          sourceHotspots: [...cleanList, newHotspot],
        };
      })
    );

    setSelectedHotspot(newHotspot);
    setIsPositionEditMode(true);
    setHotspotLabel(newHotspot.label || '');
    setHotspotType('NAVIGATION');
    setTargetSceneId(newHotspot.targetSceneId || '');
    setHotspotYaw(coords.yaw);
    setHotspotPitch(coords.pitch);
    setButtonStyle('pill');
    setButtonSize('md');
    setColorTheme('emerald');
    setButtonIcon('door');
    setAlwaysShowLabel(true);
    setPulseAnimation(true);
    setButtonSubtitle('');
    setActiveTab('nav');
    setStatusMessage('Tombol ditempatkan di foto. Ketik nama gedung atau pilih scene tujuan pada panel kanan.');
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileView('inspector');
    }
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
      setIsPositionEditMode(h.id.startsWith('temp-'));
      if (!h.id.startsWith('temp-')) {
        setStatusMessage('Ikon tersimpan dipilih. Posisi tetap terkunci; Anda dapat menghapusnya dari panel kanan.');
      }
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setMobileView('inspector');
      }
      setHotspotLabel((h.type === 'NAVIGATION' || h.type === 'FLOOR_NAVIGATION') && h.targetSceneId
        ? labelForScene(h.targetSceneId) || h.label || ''
        : h.label || '');
      setHotspotType(h.type || 'NAVIGATION');
      setTargetSceneId(h.targetSceneId || '');
      setHotspotYaw(h.yaw);
      setHotspotPitch(h.pitch);

      let parsedConfig: any = {};
      if (h.contentJson) {
        try {
          parsedConfig = typeof h.contentJson === 'string' ? JSON.parse(h.contentJson) : h.contentJson;
        } catch {}
      }
      setButtonStyle(parsedConfig.buttonStyle || (h.type === 'NAVIGATION' ? 'pill' : 'beacon'));
      setButtonSize(parsedConfig.buttonSize || 'md');
      setColorTheme(parsedConfig.colorTheme || 'indigo');
      setButtonIcon(parsedConfig.icon || h.icon || 'arrow-right');
      setAlwaysShowLabel(parsedConfig.alwaysShowLabel !== undefined ? parsedConfig.alwaysShowLabel : true);
      setPulseAnimation(parsedConfig.pulseAnimation !== undefined ? parsedConfig.pulseAnimation : true);
      setButtonSubtitle(parsedConfig.subtitle || '');
    }
  };

  // Position fine-tuning updater
  const updatePosition = (newYaw: number, newPitch: number) => {
    if (!selectedHotspot || (!selectedHotspot.id.startsWith('temp-') && !isPositionEditMode)) return;
    if (!Number.isFinite(newYaw) || !Number.isFinite(newPitch)) return;
    let normalizedYaw = newYaw;
    while (normalizedYaw > Math.PI) normalizedYaw -= 2 * Math.PI;
    while (normalizedYaw < -Math.PI) normalizedYaw += 2 * Math.PI;

    const clampedPitch = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, newPitch));

    setHotspotYaw(normalizedYaw);
    setHotspotPitch(clampedPitch);

    if (selectedHotspot) {
      const updated = { ...selectedHotspot, yaw: normalizedYaw, pitch: clampedPitch };
      setSelectedHotspot(updated);
      setScenes((prev) =>
        prev.map((s) =>
          s.id === activeSceneId
            ? {
                ...s,
                sourceHotspots: s.sourceHotspots.map((item) =>
                  item.id === selectedHotspot.id ? updated : item
                ),
              }
            : s
        )
      );
    }
  };

  const handleSnapToCamera = () => {
    updatePosition(cameraViewRef.current.yaw, cameraViewRef.current.pitch);
    setStatusMessage('Posisi tombol disesuaikan tepat di tengah arah pandang kamera!');
  };

  const handleCreateAtCamera = () => {
    handleViewerClick(cameraViewRef.current);
    setStatusMessage('Tombol baru ditempatkan di tengah pandangan kamera!');
  };

  // Update style with real-time preview in 360 viewer
  const updateStyleSetting = (updates: {
    buttonStyle?: 'pill' | 'beacon' | 'chevron' | 'card';
    buttonSize?: 'sm' | 'md' | 'lg';
    colorTheme?: 'indigo' | 'emerald' | 'amber' | 'sky' | 'rose' | 'glass';
    icon?: string;
    alwaysShowLabel?: boolean;
    pulseAnimation?: boolean;
    subtitle?: string;
    label?: string;
  }) => {
    const nextStyle = updates.buttonStyle !== undefined ? updates.buttonStyle : buttonStyle;
    const nextSize = updates.buttonSize !== undefined ? updates.buttonSize : buttonSize;
    const nextTheme = updates.colorTheme !== undefined ? updates.colorTheme : colorTheme;
    const nextIcon = updates.icon !== undefined ? updates.icon : buttonIcon;
    const nextAlwaysLabel = updates.alwaysShowLabel !== undefined ? updates.alwaysShowLabel : alwaysShowLabel;
    const nextPulse = updates.pulseAnimation !== undefined ? updates.pulseAnimation : pulseAnimation;
    const nextSubtitle = updates.subtitle !== undefined ? updates.subtitle : buttonSubtitle;
    const nextLabel = updates.label !== undefined ? updates.label : hotspotLabel;

    if (updates.buttonStyle) setButtonStyle(updates.buttonStyle);
    if (updates.buttonSize) setButtonSize(updates.buttonSize);
    if (updates.colorTheme) setColorTheme(updates.colorTheme);
    if (updates.icon) setButtonIcon(updates.icon);
    if (updates.alwaysShowLabel !== undefined) setAlwaysShowLabel(updates.alwaysShowLabel);
    if (updates.pulseAnimation !== undefined) setPulseAnimation(updates.pulseAnimation);
    if (updates.subtitle !== undefined) setButtonSubtitle(updates.subtitle);
    if (updates.label !== undefined) setHotspotLabel(updates.label);

    const jsonStr = JSON.stringify({
      buttonStyle: nextStyle,
      buttonSize: nextSize,
      colorTheme: nextTheme,
      icon: nextIcon,
      alwaysShowLabel: nextAlwaysLabel,
      pulseAnimation: nextPulse,
      subtitle: nextSubtitle,
    });

    if (selectedHotspot) {
      const updated = {
        ...selectedHotspot,
        label: nextLabel,
        icon: nextIcon,
        contentJson: jsonStr,
      };
      setSelectedHotspot(updated);
      setScenes((prev) =>
        prev.map((s) =>
          s.id === activeSceneId
            ? {
                ...s,
                sourceHotspots: s.sourceHotspots.map((item) =>
                  item.id === selectedHotspot.id ? updated : item
                ),
              }
            : s
        )
      );
    }
  };

  const handleTargetSceneChange = (sceneId: string) => {
    setTargetSceneId(sceneId);
    const label = labelForScene(sceneId);
    if (isSceneLink) updateStyleSetting({ label });
    setSelectedHotspot((current) => current ? { ...current, targetSceneId: sceneId || null } : current);
    setScenes((current) => current.map((scene) => scene.id === activeSceneId ? {
      ...scene,
      sourceHotspots: scene.sourceHotspots.map((item) => item.id === selectedHotspot?.id
        ? { ...item, targetSceneId: sceneId || null, ...(isSceneLink ? { label } : {}) }
        : item),
    } : scene));
  };

  // Save Hotspot to Database
  const handleSaveHotspot = async () => {
    if (!selectedHotspot || !activeSceneId || isSavingHotspot) return;
    if (isSceneLink && (!targetSceneId || targetSceneId === activeSceneId || !labelForScene(targetSceneId))) {
      setStatusMessage('Pilih scene tujuan yang valid sebelum menyimpan tombol.');
      setActiveTab('nav');
      return;
    }

    setIsSavingHotspot(true);
    try {
      const label = isSceneLink ? labelForScene(targetSceneId) : hotspotLabel.trim();
      const contentJson = JSON.stringify({
        buttonStyle,
        buttonSize,
        colorTheme,
        icon: buttonIcon,
        alwaysShowLabel,
        pulseAnimation,
        subtitle: buttonSubtitle,
      });

      const isNew = selectedHotspot.id.startsWith('temp-');

      if (isNew) {
        const res = await fetch(`/api/scenes/${activeSceneId}/hotspots`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tourId,
            yaw: hotspotYaw,
            pitch: hotspotPitch,
            label,
            type: hotspotType,
            targetSceneId: targetSceneId || null,
            icon: buttonIcon,
            contentJson,
            createReturnHotspot: createReturn && hotspotType === 'NAVIGATION',
          }),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setStatusMessage('Tombol navigasi berhasil disimpan!');
          setSavedAlert(true);
          window.setTimeout(() => setSavedAlert(false), 2200);
          setSelectedHotspot(null);
          setIsPositionEditMode(false);
          setMobileView('viewer');
          await reloadScenes();
        } else throw new Error(json.error || 'Gagal menyimpan tombol navigasi');
      } else {
        const res = await fetch(`/api/hotspots/${selectedHotspot.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            yaw: hotspotYaw,
            pitch: hotspotPitch,
            label,
            type: hotspotType,
            targetSceneId: targetSceneId || null,
            icon: buttonIcon,
            contentJson,
          }),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setStatusMessage('Pengaturan tombol berhasil diperbarui!');
          setSelectedHotspot(null);
          setIsPositionEditMode(false);
          setMobileView('viewer');
          await reloadScenes();
        } else throw new Error(json.error || 'Gagal memperbarui tombol');
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Gagal menyimpan tombol navigasi');
    } finally {
      setIsSavingHotspot(false);
    }
  };

  // Delete Hotspot
  const handleDeleteHotspot = async () => {
    if (!selectedHotspot || isDeletingHotspot) return;
    if (!window.confirm('Hapus ikon/tombol ini dari panorama? Tindakan ini tidak dapat dibatalkan.')) return;
    if (selectedHotspot.id.startsWith('temp-')) {
      const tempId = selectedHotspot.id;
      setScenes((prev) => prev.map((scene) => ({
        ...scene,
        sourceHotspots: scene.sourceHotspots.filter((item) => item.id !== tempId),
      })));
      setSelectedHotspot(null);
      setIsPositionEditMode(false);
      setMobileView('viewer');
      setStatusMessage('Tombol baru dibatalkan.');
      return;
    }

    setIsDeletingHotspot(true);
    try {
      const res = await fetch(`/api/hotspots/${selectedHotspot.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && json.success) {
        setStatusMessage('Hotspot berhasil dihapus!');
        setSelectedHotspot(null);
        setIsPositionEditMode(false);
        setMobileView('viewer');
        await reloadScenes();
      } else throw new Error(json.error || 'Gagal menghapus hotspot');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Gagal menghapus hotspot');
    } finally {
      setIsDeletingHotspot(false);
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
      {/* Mobile Segmented Panel Switcher Bar (< lg) */}
      <div className="lg:hidden flex items-center justify-between bg-zinc-900 border-b border-zinc-800 p-2 gap-1.5 shrink-0 z-20">
        <button
          type="button"
          onClick={() => setMobileView('scenes')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition ${
            mobileView === 'scenes'
              ? 'bg-zinc-800 text-white border border-zinc-700 shadow-xs'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Scene ({scenes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileView('viewer')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition ${
            mobileView === 'viewer'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>360° Studio</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileView('inspector')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition relative ${
            mobileView === 'inspector'
              ? 'bg-zinc-800 text-white border border-zinc-700 shadow-xs'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Atur Tombol</span>
          {selectedHotspot && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* 3-Panel Studio Center */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT PANEL: Scene List */}
        <aside
          className={`w-full lg:w-80 border-r border-zinc-800 bg-zinc-900/95 backdrop-blur-md flex flex-col shrink-0 z-30 transition-all ${
            mobileView === 'scenes' ? 'absolute inset-0 flex' : 'hidden lg:flex'
          }`}
        >
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Daftar Scene 360°</h2>
              <p className="text-[11px] text-zinc-400">{scenes.length} scene terdaftar</p>
            </div>
            <div className="flex items-center gap-2">
              <a href={`/admin/tours/${tourId}/scenes`}>
                <Button size="sm" variant="secondary" className="text-xs">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Scene</span>
                </Button>
              </a>
              <button
                type="button"
                onClick={() => setMobileView('viewer')}
                className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-800"
                title="Tutup Scene List"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
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
                    setMobileView('viewer');
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
          {/* Direct Photo Tagging Instruction Banner */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center gap-2.5 px-4 sm:px-5 py-2 bg-black/80 backdrop-blur-md rounded-full border border-emerald-500/60 text-white shadow-2xl text-[11px] sm:text-xs max-w-[90vw] text-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="font-medium truncate sm:whitespace-normal">
              {selectedHotspot
                ? 'Klik titik lain pada foto bangunan/pintu untuk memindahkan posisi tombol ini'
                : 'Klik langsung pada bangunan, pintu, atau jalan di foto untuk memasang tombol'}
            </span>
          </div>

          {activeScene ? (
            <MarzipanoViewer
              panoramaUrl={`/${activeScene.panoramaAsset.mediaAsset.storageKey}`}
              initialYaw={activeScene.initialYaw}
              initialPitch={activeScene.initialPitch}
              initialFov={activeScene.initialFov}
              hotspots={activeScene.sourceHotspots || []}
              onHotspotClick={handleHotspotClick}
              onViewerClick={handleViewerClick}
              onViewChange={(c) => {
                cameraViewRef.current = { yaw: c.yaw, pitch: c.pitch };
              }}
              isEditorMode={isEditorMode}
            />
          ) : (
            <div className="text-center p-8 text-zinc-500">
              <Compass className="w-12 h-12 mx-auto mb-3 opacity-30 animate-spin" />
              <p className="text-sm">Pilih atau buat scene untuk memulai penjelajahan 360°</p>
            </div>
          )}
        </main>

        {/* RIGHT PANEL: Hotspot & Navigation Button Inspector */}
        <aside
          className={`w-full lg:w-96 border-l border-zinc-800 bg-zinc-900/95 backdrop-blur-md p-4 sm:p-5 flex flex-col shrink-0 overflow-y-auto z-30 transition-all ${
            mobileView === 'inspector' ? 'absolute inset-0 flex' : 'hidden lg:flex'
          }`}
        >
          <div className="border-b border-zinc-800 pb-3 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-indigo-400" />
                <span>Pengaturan Tombol Navigasi</span>
              </h3>
              <p className="text-[11px] text-zinc-400">Atur letak posisi & tombol link halaman berikutnya</p>
            </div>
            <div className="flex items-center gap-2">
              {selectedHotspot && (
                <Badge variant={selectedHotspot.id.startsWith('temp-') ? 'warning' : 'success'} className="text-[9px]">
                  {selectedHotspot.id.startsWith('temp-') ? 'Baru' : 'Tersimpan'}
                </Badge>
              )}
              <button
                type="button"
                onClick={() => setMobileView('viewer')}
                className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-800"
                title="Kembali ke 360°"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {selectedHotspot ? (
            <div className="space-y-4 flex-1 flex flex-col">
              {!selectedHotspot.id.startsWith('temp-') && (
                <div className={`rounded-xl border p-3 ${isPositionEditMode ? 'border-amber-500/50 bg-amber-500/10' : 'border-emerald-500/30 bg-emerald-500/5'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {isPositionEditMode ? 'Mode edit posisi aktif' : 'Ikon tersimpan dan terkunci'}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                        {isPositionEditMode
                          ? 'Klik foto atau gunakan kontrol koordinat untuk memindahkan ikon, lalu simpan.'
                          : 'Ikon tidak akan bergeser saat foto diklik. Aktifkan edit posisi jika ingin memindahkannya.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPositionEditMode((current) => !current)}
                      className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-bold ${isPositionEditMode ? 'bg-amber-500 text-black' : 'bg-indigo-600 text-white'}`}
                    >
                      {isPositionEditMode ? 'Kunci Posisi' : 'Edit Posisi'}
                    </button>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  if (selectedHotspot?.id.startsWith('temp-')) {
                    const tempId = selectedHotspot.id;
                    setScenes((current) => current.map((scene) => ({
                      ...scene,
                      sourceHotspots: scene.sourceHotspots.filter((item) => item.id !== tempId),
                    })));
                  }
                  setSelectedHotspot(null);
                  setIsPositionEditMode(false);
                  setStatusMessage('Silakan klik langsung pada bangunan/pintu di foto untuk memasang tombol baru.');
                }}
                className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 flex items-center justify-center gap-1.5 transition border border-zinc-700 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pasang Tombol Baru di Titik Lain</span>
              </button>

              {/* Tab Navigation */}
              <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('nav')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                    activeTab === 'nav'
                      ? 'bg-zinc-800 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Tujuan & Teks
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('style')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                    activeTab === 'style'
                      ? 'bg-zinc-800 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Desain Tombol
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('position')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                    activeTab === 'position'
                      ? 'bg-zinc-800 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Atur Letak
                </button>
              </div>

              {/* TAB 1: TUJUAN & TEKS */}
              {activeTab === 'nav' && (
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Teks / Label Tombol
                    </label>
                    <Input
                      value={hotspotLabel}
                      onChange={(e) => updateStyleSetting({ label: e.target.value })}
                      readOnly={isSceneLink}
                      placeholder={isSceneLink ? 'Pilih scene tujuan di bawah' : 'Tulis label tombol'}
                    />
                    <p className="text-[10px] text-zinc-500">{isSceneLink ? 'Nama tombol mengikuti scene tujuan secara otomatis.' : 'Teks yang akan muncul di badan tombol.'}</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Subteks / Keterangan (Opsional)
                    </label>
                    <Input
                      value={buttonSubtitle}
                      onChange={(e) => updateStyleSetting({ subtitle: e.target.value })}
                      placeholder="cth: Lantai 2 / Area Dalam"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Tujuan Halaman / Scene Berikutnya
                    </label>
                    <select
                      value={targetSceneId}
                      onChange={(e) => handleTargetSceneChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      <option value="">-- Pilih Scene Tujuan --</option>
                      {scenes
                        .filter((s) => s.id !== activeSceneId)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            ➜ {s.name} ({s.sceneType})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-300">Tipe Link</label>
                    <select
                      value={hotspotType}
                      onChange={(e) => {
                        const nextType = e.target.value;
                        setHotspotType(nextType);
                        if (nextType === 'NAVIGATION' || nextType === 'FLOOR_NAVIGATION') {
                          updateStyleSetting({ label: labelForScene(targetSceneId) });
                        }
                      }}
                      className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="NAVIGATION">Navigasi Antar Scene / Halaman</option>
                      <option value="FLOOR_NAVIGATION">Pindah Lantai / Gedung</option>
                      <option value="INFORMATION">Kotak Informasi Teks</option>
                      <option value="EXTERNAL_LINK">Tautan URL Eksternal</option>
                    </select>
                  </div>

                  {hotspotType === 'NAVIGATION' && selectedHotspot.id.startsWith('temp-') && (
                    <label className="flex items-center gap-2.5 p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition">
                      <input
                        type="checkbox"
                        checked={createReturn}
                        onChange={(e) => setCreateReturn(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="text-left">
                        <p className="text-xs font-semibold text-white">Buat Tombol Kembali Otomatis</p>
                        <p className="text-[10px] text-zinc-400">
                          Membuat tautan 2-arah dari scene tujuan kembali ke scene ini.
                        </p>
                      </div>
                    </label>
                  )}
                </div>
              )}

              {/* TAB 2: DESAIN & GAYA TOMBOL */}
              {activeTab === 'style' && (
                <div className="space-y-3.5">
                  {/* Button Style Cards */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-300">Model / Gaya Tombol</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateStyleSetting({ buttonStyle: 'pill' })}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          buttonStyle === 'pill'
                            ? 'border-indigo-500 bg-indigo-950/40 text-white'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <p className="text-xs font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-400" />
                          Kapsul (Pill)
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Teks + Ikon, sangat mudah ditekan</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateStyleSetting({ buttonStyle: 'card' })}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          buttonStyle === 'card'
                            ? 'border-indigo-500 bg-indigo-950/40 text-white'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <p className="text-xs font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-sky-400" />
                          Kartu Mini
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Kotak preview interaktif</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateStyleSetting({ buttonStyle: 'chevron' })}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          buttonStyle === 'chevron'
                            ? 'border-indigo-500 bg-indigo-950/40 text-white'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <p className="text-xs font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          Panah Lantai
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Gaya 3D Street View</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateStyleSetting({ buttonStyle: 'beacon' })}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          buttonStyle === 'beacon'
                            ? 'border-indigo-500 bg-indigo-950/40 text-white'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <p className="text-xs font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          Radar (Beacon)
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Lingkaran berdenyut klasik</p>
                      </button>
                    </div>
                  </div>

                  {/* Button Size */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-300">Ukuran Tombol</label>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {[
                        { id: 'sm', label: 'Kecil', desc: '36px' },
                        { id: 'md', label: 'Standar', desc: '44px' },
                        { id: 'lg', label: 'Besar (HP)', desc: '56px' },
                      ].map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => updateStyleSetting({ buttonSize: s.id as any })}
                          className={`p-2 rounded-xl border text-center transition ${
                            buttonSize === s.id
                              ? 'border-indigo-500 bg-indigo-950/40 text-white font-bold'
                              : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <p>{s.label}</p>
                          <span className="text-[10px] text-zinc-500">{s.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Scheme */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-300">Warna Aksen Tombol</label>
                    <div className="flex items-center gap-2">
                      {[
                        { id: 'indigo', bg: 'bg-indigo-600', name: 'Indigo' },
                        { id: 'emerald', bg: 'bg-emerald-600', name: 'Emerald' },
                        { id: 'sky', bg: 'bg-sky-600', name: 'Sky' },
                        { id: 'amber', bg: 'bg-amber-600', name: 'Amber' },
                        { id: 'rose', bg: 'bg-rose-600', name: 'Rose' },
                        { id: 'glass', bg: 'bg-zinc-800 border border-white/40', name: 'Glass' },
                      ].map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => updateStyleSetting({ colorTheme: c.id as any })}
                          className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center transition-all ${
                            colorTheme === c.id ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-70 hover:opacity-100'
                          }`}
                          title={c.name}
                        >
                          {colorTheme === c.id && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Button Icon */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label className="block text-xs font-semibold text-zinc-300">Ikon Tombol</label>
                      <button
                        type="button"
                        onClick={() => updateStyleSetting({ icon: 'none' })}
                        className="text-[10px] text-red-300 hover:text-red-200 inline-flex items-center gap-1"
                        title="Hilangkan ikon dari tombol"
                      >
                        <X className="w-3 h-3" /> Hapus ikon
                      </button>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                      {[
                        { id: 'none', label: 'Tanpa ikon', icon: X },
                        { id: 'arrow-right', label: 'Panah', icon: ArrowRight },
                        { id: 'door', label: 'Pintu', icon: DoorOpen },
                        { id: 'stairs', label: 'Tangga', icon: Milestone },
                        { id: 'footprints', label: 'Jejak', icon: Footprints },
                        { id: 'compass', label: 'Kompas', icon: Compass },
                        { id: 'external-link', label: 'Link', icon: ExternalLink },
                      ].map((ic) => {
                        const IconComp = ic.icon;
                        const isSelected = buttonIcon === ic.id;
                        return (
                          <button
                            key={ic.id}
                            type="button"
                            onClick={() => updateStyleSetting({ icon: ic.id })}
                            className={`p-2 rounded-xl border flex flex-col items-center justify-center transition ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-950/50 text-white'
                                : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                            }`}
                            title={ic.label}
                          >
                            <IconComp className="w-4 h-4" />
                            <span className="text-[9px] mt-1 leading-none">{ic.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-2 pt-1 border-t border-zinc-800/80">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                      <input
                        type="checkbox"
                        checked={alwaysShowLabel}
                        onChange={(e) => updateStyleSetting({ alwaysShowLabel: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Tampilkan teks tombol selalu (sangat ramah HP)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                      <input
                        type="checkbox"
                        checked={pulseAnimation}
                        onChange={(e) => updateStyleSetting({ pulseAnimation: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Animasi radar berdenyut (Pulse Ring)</span>
                    </label>
                  </div>

                  {/* Live Button Preview Box */}
                  <div className="p-3.5 bg-zinc-950/80 rounded-2xl border border-zinc-800 space-y-2">
                    <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      Pratinjau Tampilan Tombol
                    </p>
                    <div className="p-4 bg-zinc-900/60 rounded-xl flex items-center justify-center overflow-hidden min-h-[70px] relative">
                      <div className="relative flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-xs text-white border-2 shadow-xl backdrop-blur-md"
                        style={{
                          backgroundColor:
                            colorTheme === 'emerald' ? 'rgba(5, 150, 105, 0.95)' :
                            colorTheme === 'amber' ? 'rgba(217, 119, 6, 0.95)' :
                            colorTheme === 'sky' ? 'rgba(2, 132, 199, 0.95)' :
                            colorTheme === 'rose' ? 'rgba(225, 29, 72, 0.95)' :
                            colorTheme === 'glass' ? 'rgba(18, 18, 22, 0.9)' : 'rgba(79, 70, 229, 0.95)',
                          borderColor: 'rgba(255, 255, 255, 0.8)',
                        }}
                      >
                        {pulseAnimation && (
                          <div className="absolute -inset-1 rounded-full border-2 border-indigo-400 animate-ping opacity-60 pointer-events-none" />
                        )}
                        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                          ➜
                        </span>
                        <span>{hotspotLabel || 'Masuk ke Halaman Berikutnya'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ATUR LETAK / POSISI */}
              {activeTab === 'position' && (
                <div className={`space-y-4 ${!selectedHotspot.id.startsWith('temp-') && !isPositionEditMode ? 'opacity-50 pointer-events-none' : ''}`}>
                  {/* Direct Click Guide */}
                  <div className="p-3 bg-emerald-950/30 border border-emerald-800/60 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                      <p className="text-xs font-bold text-white">Cara Termudah: Klik Langsung di Foto</p>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      {selectedHotspot.id.startsWith('temp-') || isPositionEditMode
                        ? <>Anda cukup <strong>klik langsung pada bangunan atau pintu di foto panorama</strong>, tombol akan langsung berpindah ke titik tersebut secara instan.</>
                        : <>Posisi ikon terkunci karena sudah tersimpan. Gunakan tombol <strong>Edit Posisi</strong> di atas untuk mengubahnya.</>}
                    </p>
                  </div>

                  {/* Snap to Current Camera Button */}
                  <div className="p-3 bg-indigo-950/30 border border-indigo-800/60 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2">
                      <Crosshair className="w-4 h-4 text-indigo-400 shrink-0" />
                      <p className="text-xs font-bold text-white">Letakkan Mengikuti Kamera</p>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Arahkan panorama ke tempat yang Anda inginkan, lalu tekan tombol di bawah ini:
                    </p>
                    <Button
                      size="sm"
                      onClick={handleSnapToCamera}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                    >
                      <Crosshair className="w-3.5 h-3.5 mr-1.5" />
                      <span>Pasang di Titik Kamera Sekarang</span>
                    </Button>
                  </div>

                  {/* Collapsible Manual Sliders */}
                  <details className="border border-zinc-800 rounded-2xl bg-zinc-950/60 p-3 group">
                    <summary className="text-xs font-semibold text-zinc-400 group-open:text-white cursor-pointer select-none flex items-center justify-between">
                      <span>🔧 Pengaturan Koordinat Sudut Manual (Opsional)</span>
                      <span className="text-[10px] text-zinc-500 group-open:hidden">Buka Sliders ▼</span>
                      <span className="text-[10px] text-zinc-500 hidden group-open:inline">Tutup ▲</span>
                    </summary>

                    <div className="pt-3 space-y-3.5">
                      {/* Horizontal Yaw Slider */}
                      <div className="space-y-1.5 p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-zinc-300">Posisi Horizontal (Yaw)</span>
                          <span className="font-mono text-indigo-400 font-bold">
                            {Math.round((hotspotYaw * 180) / Math.PI)}°
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-3.14159"
                          max="3.14159"
                          step="0.05"
                          value={Number.isFinite(hotspotYaw) ? hotspotYaw : 0}
                          onChange={(e) => updatePosition(parseFloat(e.target.value) || 0, hotspotPitch)}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                        <div className="flex items-center justify-between text-[10px] text-zinc-500">
                          <span>-180° (Kiri)</span>
                          <span>0° (Depan)</span>
                          <span>+180° (Kanan)</span>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => updatePosition(hotspotYaw - 0.26, hotspotPitch)}
                            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300 font-mono"
                          >
                            -15° Kiri
                          </button>
                          <button
                            type="button"
                            onClick={() => updatePosition(0, hotspotPitch)}
                            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300 flex-1 font-mono"
                          >
                            Tengah (0°)
                          </button>
                          <button
                            type="button"
                            onClick={() => updatePosition(hotspotYaw + 0.26, hotspotPitch)}
                            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300 font-mono"
                          >
                            +15° Kanan
                          </button>
                        </div>
                      </div>

                      {/* Vertical Pitch Slider */}
                      <div className="space-y-1.5 p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-zinc-300">Posisi Vertikal (Pitch)</span>
                          <span className="font-mono text-indigo-400 font-bold">
                            {Math.round((hotspotPitch * 180) / Math.PI)}°
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-1.55"
                          max="1.55"
                          step="0.05"
                          value={Number.isFinite(hotspotPitch) ? hotspotPitch : 0}
                          onChange={(e) => updatePosition(hotspotYaw, parseFloat(e.target.value) || 0)}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                        <div className="flex items-center justify-between text-[10px] text-zinc-500">
                          <span>-90° (Lantai)</span>
                          <span>0° (Mata)</span>
                          <span>+90° (Langit)</span>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => updatePosition(hotspotYaw, hotspotPitch - 0.17)}
                            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300 font-mono"
                          >
                            -10° Bawah
                          </button>
                          <button
                            type="button"
                            onClick={() => updatePosition(hotspotYaw, -0.6)}
                            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300 flex-1 font-mono"
                          >
                            Lantai (-35°)
                          </button>
                          <button
                            type="button"
                            onClick={() => updatePosition(hotspotYaw, hotspotPitch + 0.17)}
                            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300 font-mono"
                          >
                            +10° Atas
                          </button>
                        </div>
                      </div>

                      {/* Quick Direction Presets */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-zinc-300">Preset Arah Cepat</label>
                        <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                          <button
                            type="button"
                            onClick={() => updatePosition(0, -0.6)}
                            className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-center"
                          >
                            ⬇ Lantai
                          </button>
                          <button
                            type="button"
                            onClick={() => updatePosition(0, -0.05)}
                            className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-center"
                          >
                            ⬆ Lurus Depan
                          </button>
                          <button
                            type="button"
                            onClick={() => updatePosition(-1.57, -0.05)}
                            className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-center"
                          >
                            ⬅ Sisi Kiri
                          </button>
                          <button
                            type="button"
                            onClick={() => updatePosition(1.57, -0.05)}
                            className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-center"
                          >
                            ➡ Sisi Kanan
                          </button>
                          <button
                            type="button"
                            onClick={() => updatePosition(Math.PI, -0.05)}
                            className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-center"
                          >
                            ↩ Belakang
                          </button>
                          <button
                            type="button"
                            onClick={() => updatePosition(0, 0)}
                            className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-center"
                          >
                            🎯 Reset 0°
                          </button>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              )}

              {/* SAVE / DELETE ACTIONS */}
              <div className="pt-3 border-t border-zinc-800 flex items-center gap-2 mt-auto">
                <Button size="sm" onClick={handleSaveHotspot} disabled={isSavingHotspot || isDeletingHotspot} className="flex-1 bg-indigo-600 hover:bg-indigo-500 font-bold">
                  <Save className="w-3.5 h-3.5 mr-1" />
                  <span>{isSavingHotspot ? 'Menyimpan...' : 'Simpan Tombol'}</span>
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDeleteHotspot}
                  disabled={isSavingHotspot || isDeletingHotspot}
                  className="px-3 gap-1.5"
                  title="Hapus tombol dari panorama"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Hapus tombol</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-zinc-400 space-y-4 flex-1 flex flex-col justify-center">
              <div className="w-14 h-14 rounded-3xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mx-auto text-indigo-400 shadow-md">
                <MapPin className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white">Belum Ada Tombol Dipilih</h4>
                <p className="text-[11px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
                  Klik di mana saja pada panorama 360° untuk menaruh tombol navigasi, atau gunakan tombol di bawah ini:
                </p>
              </div>

              <div className="pt-2">
                <Button
                  size="sm"
                  onClick={handleCreateAtCamera}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold"
                >
                  <Crosshair className="w-3.5 h-3.5 mr-1.5" />
                  <span>Buat Tombol di Titik Kamera Sekarang</span>
                </Button>
              </div>
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

      {savedAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-emerald-400/40 bg-zinc-950/95 px-6 py-5 text-center shadow-2xl shadow-emerald-950/40 animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <CheckCircle className="h-7 w-7" />
            </div>
            <p className="text-sm font-bold text-white">Tombol berhasil disimpan</p>
            <p className="mt-1 text-xs text-zinc-400">Ikon otomatis terkunci. Klik area kosong untuk membuat tombol baru.</p>
          </div>
        </div>
      )}

      {/* BOTTOM TOOLBAR */}
      <footer className="border-t border-zinc-800 bg-zinc-900 p-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 z-30 shrink-0">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <button
            onClick={() => setIsEditorMode(!isEditorMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              isEditorMode
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>{isEditorMode ? 'Mode Editor Aktif' : 'Mode Preview'}</span>
          </button>

          {statusMessage && (
            <span className="text-xs text-emerald-400 font-medium truncate max-w-xs">{statusMessage}</span>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleValidate}
            isLoading={isValidating}
            className="text-xs flex-1 sm:flex-initial"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Validasi Graf</span>
          </Button>

          <Button
            size="sm"
            onClick={handlePublish}
            isLoading={isPublishing}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex-1 sm:flex-initial"
          >
            <Send className="w-3.5 h-3.5 mr-1" />
            <span>Publikasikan</span>
          </Button>
        </div>
      </footer>
    </div>
  );
}
