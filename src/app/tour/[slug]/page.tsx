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
} from 'lucide-react';
import { MarzipanoViewer, HotspotItem } from '@/components/viewer/MarzipanoViewer';
import { FloorPlanOverlay } from '@/components/viewer/FloorPlanOverlay';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

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

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none">
      {/* 360° Panorama Viewport */}
      {activeScene ? (
        <MarzipanoViewer
          panoramaUrl={activeScene.panoramaUrl}
          initialYaw={activeScene.initialYaw}
          initialPitch={activeScene.initialPitch}
          initialFov={activeScene.initialFov}
          hotspots={activeScene.hotspots || []}
          onHotspotClick={handleHotspotClick}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-zinc-500">
          Scene tidak ditemukan
        </div>
      )}

      {/* Floor Plan Minimap Overlay */}
      <FloorPlanOverlay
        buildings={tour.buildings}
        activeSceneId={activeSceneId}
        onSelectScene={(id) => setActiveSceneId(id)}
      />

      {/* Floating Header (Tour Title & Breadcrumb) */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
        <div className="bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-white shadow-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-bold text-xs">
            360°
          </div>
          <div>
            <h1 className="text-xs font-bold leading-tight">{tour.title}</h1>
            <p className="text-[10px] text-emerald-400 font-medium">
              {activeScene?.name} ({activeScene?.sceneType})
            </p>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons (Top Right) */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
        <button
          onClick={() => setIsShareModalOpen(true)}
          className="p-2.5 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 text-white hover:bg-black/80 transition shadow-xl"
          title="Bagikan Tur"
        >
          <Share2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setIsSceneDrawerOpen(!isSceneDrawerOpen)}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 text-white hover:bg-black/80 transition shadow-xl text-xs font-semibold"
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Daftar Scene</span>
        </button>
      </div>

      {/* Scene Drawer Sidebar */}
      {isSceneDrawerOpen && (
        <div className="absolute top-0 right-0 z-40 w-80 h-full bg-zinc-950/95 backdrop-blur-xl border-l border-white/10 p-5 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
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
    </div>
  );
}