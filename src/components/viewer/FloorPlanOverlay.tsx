'use client';
import React, { useState } from 'react';
import { Map, X, Layers } from 'lucide-react';

export interface Marker {
  id: string;
  sceneId: string;
  sceneName: string;
  x: number;
  y: number;
}

export interface FloorPlanData {
  id: string;
  imageUrl: string;
  width: number;
  height: number;
  markers: Marker[];
}

export interface FloorPlanOverlayProps {
  buildings?: Array<{
    id: string;
    name: string;
    floors: Array<{
      id: string;
      name: string;
      levelNumber: number;
      floorPlan: FloorPlanData | null;
    }>;
  }>;
  activeSceneId: string;
  onSelectScene: (sceneId: string) => void;
}

export function FloorPlanOverlay({ buildings = [], activeSceneId, onSelectScene }: FloorPlanOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBuildingIndex, setSelectedBuildingIndex] = useState(0);
  const [selectedFloorIndex, setSelectedFloorIndex] = useState(0);

  const activeBuilding = buildings[selectedBuildingIndex];
  const activeFloor = activeBuilding?.floors[selectedFloorIndex];
  const floorPlan = activeFloor?.floorPlan;

  if (buildings.length === 0 || !floorPlan) return null;

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-6 right-20 z-20 flex items-center gap-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 shadow-xl text-xs font-semibold text-zinc-900 dark:text-white hover:bg-white transition select-none"
      >
        <Map className="w-4 h-4 text-emerald-500" />
        <span>Denah Lokasi</span>
      </button>

      {/* Minimap Modal / Drawer */}
      {isOpen && (
        <div className="absolute top-20 right-6 z-30 w-80 sm:w-96 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 select-none">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-500" />
              <span className="text-xs font-bold text-zinc-900 dark:text-white">
                {activeBuilding?.name} — {activeFloor?.name}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Minimap Image Canvas */}
          <div className="relative w-full aspect-4/3 bg-zinc-900 overflow-hidden flex items-center justify-center">
            <img
              src={floorPlan.imageUrl}
              alt="Denah Lantai"
              className="w-full h-full object-contain pointer-events-none"
            />

            {/* Normalized Scene Markers */}
            {floorPlan.markers.map((marker) => {
              const isActive = marker.sceneId === activeSceneId;
              return (
                <button
                  key={marker.id}
                  onClick={() => onSelectScene(marker.sceneId)}
                  style={{
                    left: `${marker.x * 100}%`,
                    top: `${marker.y * 100}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/30 scale-125 z-10'
                      : 'bg-zinc-900 text-white border-2 border-white hover:scale-110 z-0'
                  }`}
                  title={marker.sceneName}
                >
                  <span className="w-2 h-2 rounded-full bg-white" />
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>Klik titik untuk berpindah ruangan</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {floorPlan.markers.length} Titik
            </span>
          </div>
        </div>
      )}
    </>
  );
}