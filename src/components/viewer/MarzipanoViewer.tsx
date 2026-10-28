'use client';
import React, { useEffect, useRef, useState } from 'react';
import Marzipano from 'marzipano';
import { ZoomIn, ZoomOut, Maximize, RotateCcw, Compass, MapPin } from 'lucide-react';

export interface HotspotItem {
  id: string;
  yaw: number;
  pitch: number;
  label?: string | null;
  type?: string;
  icon?: string | null;
  targetSceneId?: string | null;
  contentJson?: any;
}

export interface MarzipanoViewerProps {
  panoramaUrl: string;
  initialYaw?: number;
  initialPitch?: number;
  initialFov?: number;
  hotspots?: HotspotItem[];
  onHotspotClick?: (hotspot: HotspotItem) => void;
  onViewerClick?: (coords: { yaw: number; pitch: number }) => void;
  isEditorMode?: boolean;
}

export function MarzipanoViewer({
  panoramaUrl,
  initialYaw = 0,
  initialPitch = 0,
  initialFov = 1.05,
  hotspots = [],
  onHotspotClick,
  onViewerClick,
  isEditorMode = false,
}: MarzipanoViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const [currentYaw, setCurrentYaw] = useState<number>(initialYaw);
  const [currentPitch, setCurrentPitch] = useState<number>(initialPitch);

  useEffect(() => {
    if (!containerRef.current || !panoramaUrl) return;

    // 1. Initialize Marzipano Viewer
    const viewer = new Marzipano.Viewer(containerRef.current, {
      controls: {
        mouseViewMode: 'drag',
      },
      stage: {
        progressive: true,
      },
    });
    viewerRef.current = viewer;

    // 2. Setup Geometry & Source
    const source = Marzipano.ImageUrlSource.fromString(panoramaUrl);
    const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);
    const limiter = Marzipano.RectilinearView.limit.traditional(2048, (120 * Math.PI) / 180);

    const view = new Marzipano.RectilinearView(
      { yaw: initialYaw, pitch: initialPitch, fov: initialFov },
      limiter
    );

    const scene = viewer.createScene({ source, geometry, view });
    sceneRef.current = scene;

    scene.switchTo({ transitionDuration: 1000 });

    // Track camera movement
    view.addEventListener('change', () => {
      setCurrentYaw(view.yaw());
      setCurrentPitch(view.pitch());
    });

    // Handle Raycasting click for Editor
    const domElement = containerRef.current;
    const handleClick = (e: MouseEvent) => {
      if (!isEditorMode || !onViewerClick) return;
      const rect = domElement.getBoundingClientRect();
      const coords = view.screenToCoordinates({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      if (coords) {
        onViewerClick(coords);
      }
    };

    domElement.addEventListener('click', handleClick);

    return () => {
      domElement.removeEventListener('click', handleClick);
      viewer.destroy();
      viewerRef.current = null;
      sceneRef.current = null;
    };
  }, [panoramaUrl, isEditorMode]);

  // Sync Hotspots
  useEffect(() => {
    if (!sceneRef.current) return;
    const container = sceneRef.current.hotspotContainer();

    // Destroy existing hotspots
    const existing = container.listHotspots();
    for (const h of existing) {
      container.destroyHotspot(h);
    }

    // Create new hotspots
    for (const h of hotspots) {
      const el = document.createElement('div');
      el.className =
        'group cursor-pointer select-none transition-transform hover:scale-110 active:scale-95';

      const iconWrapper = document.createElement('div');
      iconWrapper.className =
        'w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border-2 border-zinc-900 text-zinc-900 flex items-center justify-center shadow-lg transition-colors group-hover:bg-zinc-900 group-hover:text-white';
      iconWrapper.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      `;

      const tooltip = document.createElement('div');
      tooltip.className =
        'mt-1 px-2.5 py-1 rounded-lg bg-zinc-900/90 text-white text-[11px] font-semibold tracking-wide whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center';
      tooltip.innerText = h.label || (h.type === 'NAVIGATION' ? 'Ke Scene Selanjutnya' : 'Informasi');

      el.appendChild(iconWrapper);
      el.appendChild(tooltip);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onHotspotClick?.(h);
      });

      container.createHotspot(el, { yaw: h.yaw, pitch: h.pitch });
    }
  }, [hotspots, onHotspotClick]);

  const handleZoom = (delta: number) => {
    if (!sceneRef.current) return;
    const view = sceneRef.current.view();
    view.setParameters({ fov: Math.max(0.4, Math.min(1.8, view.fov() + delta)) });
  };

  const handleReset = () => {
    if (!viewerRef.current) return;
    viewerRef.current.lookTo({ yaw: initialYaw, pitch: initialPitch, fov: initialFov });
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="relative w-full h-full bg-black select-none overflow-hidden group">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Panorama HUD Controls */}
      <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 shadow-xl z-20">
        <button
          onClick={() => handleZoom(-0.15)}
          className="p-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          title="Perbesar"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(0.15)}
          className="p-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          title="Perkecil"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          className="p-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          title="Reset Orientasi"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={handleFullscreen}
          className="p-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          title="Layar Penuh"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* Camera Orientation HUD */}
      <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white text-[11px] font-mono z-20 pointer-events-none">
        <Compass className="w-3.5 h-3.5 text-emerald-400" />
        <span>Yaw: {currentYaw.toFixed(2)} rad</span>
        <span className="text-white/30">|</span>
        <span>Pitch: {currentPitch.toFixed(2)} rad</span>
      </div>

      {isEditorMode && (
        <div className="absolute top-6 right-6 bg-amber-500/90 text-white text-xs font-semibold px-3 py-1.5 rounded-xl backdrop-blur-md shadow-md z-20 pointer-events-none">
          Mode Studio: Klik panorama untuk menambah Hotspot
        </div>
      )}
    </div>
  );
}