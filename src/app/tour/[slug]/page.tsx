'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';
import {
  Compass,
  Share2,
  QrCode as QrIcon,
  Layers,
  ChevronRight,
  Info,
  X,
  MapPin,
  Maximize2,
  Settings2,
  PlusCircle,
  Check,
  DoorOpen,
  Footprints,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import type { HotspotItem } from '@/components/viewer/MarzipanoViewer';
import { FloorPlanOverlay } from '@/components/viewer/FloorPlanOverlay';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const MarzipanoViewer = dynamic(
  () => import('@/components/viewer/MarzipanoViewer').then((mod) => mod.MarzipanoViewer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-black flex items-center justify-center text-zinc-500 font-mono text-xs">
        Memuat WebGL Panorama 360°...
      </div>
    ),
  }
);

export default function PublicTourViewerPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [tour, setTour] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSceneId, setActiveSceneId] = useState<string>('');
  const [isSceneDrawerOpen, setIsSceneDrawerOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [infoModalContent, setInfoModalContent] = useState<any>(null);

  // Direct On-Photo Button Placement States
  const [isDirectAddMode, setIsDirectAddMode] = useState<boolean>(false);
  const [pendingCoords, setPendingCoords] = useState<{ yaw: number; pitch: number } | null>(null);
  const [btnLabel, setBtnLabel] = useState<string>('');
  const [btnSubtitle, setBtnSubtitle] = useState<string>('');
  const [btnTargetSceneId, setBtnTargetSceneId] = useState<string>('');
  const [btnType, setBtnType] = useState<string>('NAVIGATION');
  const [btnStyle, setBtnStyle] = useState<'pill' | 'card' | 'chevron' | 'beacon'>('pill');
  const [btnColor, setBtnColor] = useState<'emerald' | 'indigo' | 'amber' | 'sky' | 'rose' | 'glass'>('emerald');
  const [btnIcon, setBtnIcon] = useState<string>('door');
  const [isSubmittingDirect, setIsSubmittingDirect] = useState<boolean>(false);
  const [directSuccessMessage, setDirectSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/public/tours/${slug}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setTour(json.data);
          setActiveSceneId(json.data.startSceneId || json.data.scenes?.[0]?.id || '');
          // Record visitor view
          fetch(`/api/public/tours/${slug}/view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: `sess-${Date.now()}` }),
          }).catch(() => {});
        } else {
          setError(json.error || 'Virtual tour tidak ditemukan');
        }
      })
      .catch(() => setError('Gagal memuat virtual tour'))
      .finally(() => setLoading(false));
  }, [slug]);

  // Generate QR code when share modal opens
  useEffect(() => {
    if (isShareModalOpen && typeof window !== 'undefined') {
      QRCode.toDataURL(window.location.href, { width: 250, margin: 2 })
        .then((url) => setQrDataUrl(url))
        .catch(() => {});
    }
  }, [isShareModalOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white select-none">
        <Compass className="w-12 h-12 animate-spin text-emerald-400 mb-4" />
        <p className="text-sm font-semibold tracking-wider">MEMUAT VIRTUAL TOUR 360°...</p>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4">
          <Compass className="w-10 h-10 text-red-400 mx-auto opacity-70" />
          <h1 className="text-lg font-bold text-white">Tur Tidak Tersedia</h1>
          <p className="text-xs text-zinc-400">{error || 'Virtual tour belum dipublikasikan.'}</p>
          <a href="/">
            <Button size="sm" variant="secondary" className="mt-2">
              Kembali ke Beranda
            </Button>
          </a>
        </div>
      </div>
    );
  }

  const activeScene = tour.scenes?.find((s: any) => s.id === activeSceneId);
  const activeHotspots = activeScene?.hotspots?.map((hotspot: HotspotItem) => ({
    ...hotspot,
    targetSceneName:
      hotspot.targetSceneName ||
      tour.scenes?.find((scene: any) => scene.id === hotspot.targetSceneId)?.name ||
      null,
  })) || [];

  const handleHotspotClick = (h: HotspotItem) => {
    if (h.type === 'NAVIGATION' || h.type === 'FLOOR_NAVIGATION') {
      if (h.targetSceneId) {
        setActiveSceneId(h.targetSceneId);
      }
    } else if (h.type === 'INFORMATION') {
      setInfoModalContent({
        title: h.label || 'Informasi Lokasi',
        content: h.contentJson?.text || 'Tidak ada keterangan detail.',
      });
    }
  };

  const handlePhotoClick = (coords: { yaw: number; pitch: number }) => {
    if (!isDirectAddMode) return;
    setPendingCoords(coords);
    setBtnLabel('');
    setBtnSubtitle('');
    const otherScene = tour.scenes?.find((s: any) => s.id !== activeSceneId);
    setBtnTargetSceneId(otherScene?.id || '');
    setBtnType('NAVIGATION');
    setBtnStyle('pill');
    setBtnColor('emerald');
    setBtnIcon('door');
  };

  const handleDirectSave = async () => {
    if (!btnLabel.trim()) {
      alert('Silakan masukkan nama tombol atau nama gedung terlebih dahulu.');
      return;
    }
    if (!pendingCoords) return;
    setIsSubmittingDirect(true);

    try {
      const contentJson = JSON.stringify({
        buttonStyle: btnStyle,
        buttonSize: 'md',
        colorTheme: btnColor,
        icon: btnIcon,
        alwaysShowLabel: true,
        pulseAnimation: true,
        subtitle: btnSubtitle,
      });

      const res = await fetch(`/api/scenes/${activeSceneId}/hotspots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tourId: tour.id,
          targetSceneId: btnType === 'NAVIGATION' ? (btnTargetSceneId || null) : null,
          type: btnType,
          yaw: pendingCoords.yaw,
          pitch: pendingCoords.pitch,
          label: btnLabel.trim(),
          icon: btnIcon,
          contentJson,
        }),
      });

      const json = await res.json();
      if (json.success) {
        // Auto-republish tour snapshot so the new button is immediately active
        await fetch(`/api/tours/${tour.id}/publish`, { method: 'POST' });

        // Reload tour data from server
        const tourRes = await fetch(`/api/public/tours/${slug}`);
        const tourJson = await tourRes.json();
        if (tourJson.success) {
          setTour(tourJson.data);
        }

        setPendingCoords(null);
        setIsDirectAddMode(false);
        setDirectSuccessMessage(`✓ Tombol "${btnLabel}" berhasil dipasang tepat di titik foto!`);
        setTimeout(() => setDirectSuccessMessage(null), 4000);
      } else {
        alert(json.error || 'Gagal memasang tombol.');
      }
    } catch {
      alert('Gagal menghubungi server untuk memasang tombol.');
    } finally {
      setIsSubmittingDirect(false);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none">
      {/* 360° Panorama Viewport */}
      {activeScene ? (
        <MarzipanoViewer
          panoramaUrl={activeScene.panoramaUrl}
          initialYaw={activeScene.initialYaw}
          initialPitch={activeScene.initialPitch}
          initialFov={activeScene.initialFov}
          hotspots={activeHotspots}
          onHotspotClick={handleHotspotClick}
          onViewerClick={handlePhotoClick}
          isEditorMode={isDirectAddMode}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-zinc-500">
          Scene tidak ditemukan
        </div>
      )}

      {/* Direct Add Mode Instruction Pill */}
      {isDirectAddMode && !pendingCoords && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 px-5 py-2.5 bg-zinc-950/95 border-2 border-emerald-500 rounded-full text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <p className="text-xs font-medium">
            <span className="font-bold text-emerald-400">Mode Pasang Aktif:</span> Klik langsung pada bangunan, pintu, atau jalan di foto
          </p>
          <button
            onClick={() => setIsDirectAddMode(false)}
            className="ml-3 text-[11px] text-zinc-400 hover:text-white underline font-semibold"
          >
            Selesai / Tutup
          </button>
        </div>
      )}

      {/* Success Notification Toast */}
      {directSuccessMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-5 py-2.5 bg-emerald-600 border border-emerald-400 rounded-full text-white shadow-2xl backdrop-blur-md text-xs font-bold animate-in fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{directSuccessMessage}</span>
        </div>
      )}

      {/* Floor Plan Minimap Overlay */}
      <FloorPlanOverlay
        buildings={tour.buildings}
        activeSceneId={activeSceneId}
        onSelectScene={(id) => setActiveSceneId(id)}
      />

      {/* Floating Header (Tour Title & Breadcrumb) */}
      <div className="absolute top-3 left-3 sm:top-6 sm:left-6 z-20 flex items-center gap-2 sm:gap-3 max-w-[50vw] sm:max-w-md">
        <div className="bg-black/70 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-white/10 text-white shadow-xl flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/10 flex items-center justify-center font-bold text-xs shrink-0">
            360°
          </div>
          <div className="min-w-0">
            <h1 className="text-xs font-bold leading-tight truncate">{tour.title}</h1>
            <p className="text-[10px] text-emerald-400 font-medium truncate">
              {activeScene?.name} ({activeScene?.sceneType})
            </p>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons (Top Right) */}
      <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-20 flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => {
            setIsDirectAddMode(!isDirectAddMode);
            if (!isDirectAddMode) {
              setDirectSuccessMessage('Mode Pasang Aktif: Silakan klik langsung pada bangunan/pintu di foto.');
              setTimeout(() => setDirectSuccessMessage(null), 3000);
            }
          }}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-2xl border transition shadow-xl text-xs font-semibold backdrop-blur-md ${
            isDirectAddMode
              ? 'bg-emerald-600 border-emerald-400 text-white ring-2 ring-emerald-400/50'
              : 'bg-emerald-700/80 hover:bg-emerald-600 border-emerald-500/40 text-white'
          }`}
          title="Klik pada foto untuk memasang tombol langsung"
        >
          <PlusCircle className="w-4 h-4 text-emerald-200 shrink-0" />
          <span className="hidden xs:inline">{isDirectAddMode ? '✕ Batal' : '➕ Pasang Tombol'}</span>
          <span className="xs:hidden">{isDirectAddMode ? '✕' : '➕'}</span>
        </button>

        {tour?.id && (
          <a
            href={`/admin/tours/${tour.id}/editor?scene=${activeSceneId}`}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 bg-indigo-600/90 hover:bg-indigo-500 backdrop-blur-md rounded-2xl border border-indigo-400/30 text-white transition shadow-xl text-xs font-semibold"
            title="Buka Hotspot Studio untuk Mengatur Letak & Desain Tombol"
          >
            <Settings2 className="w-4 h-4 text-indigo-200 shrink-0" />
            <span className="hidden md:inline">Studio Editor</span>
          </a>
        )}
        <button
          onClick={() => setIsShareModalOpen(true)}
          className="p-2 sm:p-2.5 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 text-white hover:bg-black/80 transition shadow-xl"
          title="Bagikan Tur"
        >
          <Share2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setIsSceneDrawerOpen(!isSceneDrawerOpen)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 text-white hover:bg-black/80 transition shadow-xl text-xs font-semibold"
        >
          <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="hidden sm:inline">Daftar Scene</span>
        </button>
      </div>

      {/* Helper Pill when scene has no navigation button yet */}
      {(!activeScene?.hotspots || activeScene.hotspots.length === 0) && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <a
            href={`/admin/tours/${tour?.id}/editor?scene=${activeSceneId}`}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-zinc-950/85 backdrop-blur-md border border-indigo-500/60 rounded-full text-white shadow-2xl hover:bg-zinc-900 hover:border-indigo-400 transition"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
            <span className="text-xs font-medium text-zinc-300">Belum ada tombol di titik ini</span>
            <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
              + Pasang Tombol Sekarang ➜
            </span>
          </a>
        </div>
      )}

      {/* Scene Drawer Sidebar */}
      {isSceneDrawerOpen && (
        <div className="absolute top-0 right-0 z-40 w-full sm:w-80 h-full bg-zinc-950/95 backdrop-blur-xl border-l border-white/10 p-5 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h2 className="text-sm font-bold text-white">Daftar Scene Lokasi</h2>
              <p className="text-[11px] text-zinc-400">{tour.scenes?.length || 0} titik panorama</p>
            </div>
            <button
              onClick={() => setIsSceneDrawerOpen(false)}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 space-y-2 flex-1 overflow-y-auto">
            {tour.scenes?.map((s: any) => {
              const isSelected = s.id === activeSceneId;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setActiveSceneId(s.id);
                    setIsSceneDrawerOpen(false);
                  }}
                  className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-950/30 text-white'
                      : 'border-white/5 hover:border-white/20 bg-white/5 text-zinc-300'
                  }`}
                >
                  <img
                    src={s.thumbnailUrl || s.panoramaUrl}
                    alt={s.name}
                    className="w-12 h-8 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{s.name}</p>
                    <p className="text-[10px] text-zinc-400 uppercase">{s.sceneType}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Share & QR Code Modal */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Bagikan Virtual Tour"
        description="Pindai QR code dengan smartphone atau salin tautan langsung"
      >
        <div className="text-center space-y-4">
          {qrDataUrl && (
            <div className="p-4 bg-white rounded-2xl inline-block shadow-md">
              <img src={qrDataUrl} alt="QR Code Tour" className="w-48 h-48 mx-auto" />
            </div>
          )}
          <p className="text-xs text-zinc-500">
            Arahkan kamera smartphone untuk langsung menjelajahi virtual tour ini.
          </p>
          <div className="pt-2">
            <Button
              className="w-full text-xs"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Tautan virtual tour berhasil disalin ke clipboard!');
              }}
            >
              Salin Tautan Tur
            </Button>
          </div>
        </div>
      </Modal>

      {/* Information Modal */}
      {infoModalContent && (
        <Modal
          isOpen={!!infoModalContent}
          onClose={() => setInfoModalContent(null)}
          title={infoModalContent.title}
        >
          <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {infoModalContent.content}
          </div>
        </Modal>
      )}

      {/* Direct On-Photo Button Placement Modal */}
      {pendingCoords && (
        <Modal
          isOpen={!!pendingCoords}
          onClose={() => setPendingCoords(null)}
          title="📍 Pasang Tombol di Titik Foto"
          description="Beri nama gedung atau arah tujuan untuk tombol di titik foto ini."
        >
          <div className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Nama Tombol / Gedung <span className="text-red-500">*</span>
              </label>
              <Input
                autoFocus
                value={btnLabel}
                onChange={(e) => setBtnLabel(e.target.value)}
                placeholder="cth: Gedung Rektorat / Masuk ke Plaza"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Aksi Jika Tombol Diklik
              </label>
              <select
                value={btnType}
                onChange={(e) => setBtnType(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="NAVIGATION">Pindah ke Scene / Ruangan Berikutnya</option>
                <option value="INFORMATION">Tampilkan Informasi / Keterangan Teks</option>
              </select>
            </div>

            {btnType === 'NAVIGATION' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Tujuan Scene / Lokasi
                </label>
                <select
                  value={btnTargetSceneId}
                  onChange={(e) => setBtnTargetSceneId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="">-- Pilih Scene Tujuan --</option>
                  {tour.scenes
                    ?.filter((s: any) => s.id !== activeSceneId)
                    .map((s: any) => (
                      <option key={s.id} value={s.id}>
                        ➜ {s.name} ({s.sceneType})
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Keterangan Tambahan / Subteks (Opsional)
              </label>
              <Input
                value={btnSubtitle}
                onChange={(e) => setBtnSubtitle(e.target.value)}
                placeholder="cth: Lantai 1 / Area Utama"
              />
            </div>

            {/* Model & Warna */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Model Tombol
                </label>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  {[
                    { id: 'pill', label: 'Kapsul' },
                    { id: 'card', label: 'Kartu' },
                    { id: 'chevron', label: 'Panah' },
                    { id: 'beacon', label: 'Radar' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setBtnStyle(st.id as any)}
                      className={`p-1.5 rounded-lg border text-center transition ${
                        btnStyle === st.id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Warna Tombol
                </label>
                <div className="flex items-center gap-1.5 pt-1">
                  {[
                    { id: 'emerald', bg: 'bg-emerald-600' },
                    { id: 'indigo', bg: 'bg-indigo-600' },
                    { id: 'amber', bg: 'bg-amber-600' },
                    { id: 'sky', bg: 'bg-sky-600' },
                    { id: 'rose', bg: 'bg-rose-600' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setBtnColor(c.id as any)}
                      className={`w-6 h-6 rounded-full ${c.bg} flex items-center justify-center transition-all ${
                        btnColor === c.id ? 'ring-2 ring-emerald-500 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {btnColor === c.id && <Check className="w-3 h-3 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPendingCoords(null)}
                disabled={isSubmittingDirect}
              >
                Batal
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
                onClick={handleDirectSave}
                disabled={isSubmittingDirect || !btnLabel.trim()}
              >
                {isSubmittingDirect ? 'Memasang Tombol...' : '✓ Pasang Tombol di Sini'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
