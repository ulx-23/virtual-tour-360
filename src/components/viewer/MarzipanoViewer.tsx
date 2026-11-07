'use client';
import React, { useEffect, useRef, useState } from 'react';
import Marzipano from 'marzipano';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
  Compass,
  MapPin,
  Smartphone,
} from 'lucide-react';

export interface HotspotItem {
  id: string;
  yaw: number;
  pitch: number;
  label?: string | null;
  type?: string;
  icon?: string | null;
  targetSceneId?: string | null;
  targetSceneName?: string | null;
  targetScene?: { id: string; name: string } | null;
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
  onViewChange?: (coords: { yaw: number; pitch: number; fov: number }) => void;
  isEditorMode?: boolean;
}

/**
 * Euler rotation matrix transformation (krpano-compatible gyro math)
 */
function rotateEuler(euler: { yaw: number; pitch: number; roll: number }, result: any) {
  const ch = Math.cos(euler.yaw);
  const sh = Math.sin(euler.yaw);
  const ca = Math.cos(euler.pitch);
  const sa = Math.sin(euler.pitch);
  const cb = Math.cos(euler.roll);
  const sb = Math.sin(euler.roll);

  const matrix = [
    sh * sb - ch * sa * cb, -ch * ca, ch * sa * sb + sh * cb,
    ca * cb, -sa, -ca * sb,
    sh * sa * cb + ch * sb, sh * ca, -sh * sa * sb + ch * cb,
  ];

  let heading: number, attitude: number, bank: number;
  if (matrix[3] > 0.9999) {
    heading = Math.atan2(matrix[2], matrix[8]);
    attitude = Math.PI / 2;
    bank = 0;
  } else if (matrix[3] < -0.9999) {
    heading = Math.atan2(matrix[2], matrix[8]);
    attitude = -Math.PI / 2;
    bank = 0;
  } else {
    heading = Math.atan2(-matrix[6], matrix[0]);
    bank = Math.atan2(-matrix[5], matrix[4]);
    attitude = Math.asin(matrix[3]);
  }

  result.yaw = heading;
  result.pitch = attitude;
  result.roll = bank;
}

function createDeviceOrientationMethod(marzipano: any) {
  function Method(this: any) {
    this._dynamics = {
      yaw: new marzipano.Dynamics(),
      pitch: new marzipano.Dynamics(),
    };
    this._deviceOrientationHandler = this._handleData.bind(this);
    this._previous = {};
    this._current = {};
    this._tmp = {};
    this._getPitchCallbacks = [];
    this.hasReceivedData = false;

    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', this._deviceOrientationHandler);
    }
  }

  marzipano.dependencies.eventEmitter(Method);

  Method.prototype.destroy = function () {
    this._dynamics = null;
    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      window.removeEventListener('deviceorientation', this._deviceOrientationHandler);
    }
    this._deviceOrientationHandler = null;
    this._previous = null;
    this._current = null;
    this._tmp = null;
    this._getPitchCallbacks = null;
  };

  Method.prototype.reset = function () {
    this._previous = {};
    this._current = {};
    this._tmp = {};
  };

  Method.prototype.getPitch = function (cb: (err: any, pitch?: number) => void) {
    this._getPitchCallbacks.push(cb);
  };

  Method.prototype._handleData = function (data: DeviceOrientationEvent) {
    if (data.alpha === null || data.beta === null || data.gamma === null) return;
    this.hasReceivedData = true;
    const previous = this._previous;
    const current = this._current;
    const tmp = this._tmp;

    tmp.yaw = marzipano.util.degToRad(data.alpha);
    tmp.pitch = marzipano.util.degToRad(data.beta);
    tmp.roll = marzipano.util.degToRad(data.gamma);

    rotateEuler(tmp, current);

    this._getPitchCallbacks.forEach((cb: any) => cb(null, current.pitch));
    this._getPitchCallbacks.length = 0;

    if (previous.yaw != null && previous.pitch != null && previous.roll != null) {
      let deltaYaw = current.yaw - previous.yaw;
      while (deltaYaw > Math.PI) deltaYaw -= 2 * Math.PI;
      while (deltaYaw < -Math.PI) deltaYaw += 2 * Math.PI;

      let deltaPitch = current.pitch - previous.pitch;
      while (deltaPitch > Math.PI) deltaPitch -= 2 * Math.PI;
      while (deltaPitch < -Math.PI) deltaPitch += 2 * Math.PI;

      this._dynamics.yaw.offset = -deltaYaw;
      this._dynamics.pitch.offset = deltaPitch;

      this.emit('parameterDynamics', 'yaw', this._dynamics.yaw);
      this.emit('parameterDynamics', 'pitch', this._dynamics.pitch);
    }

    previous.yaw = current.yaw;
    previous.pitch = current.pitch;
    previous.roll = current.roll;
  };

  return new (Method as any)();
}

/**
 * Creates custom button elements for 360 hotspots
 */
function createHotspotDOM(h: HotspotItem, onHotspotClick?: (hotspot: HotspotItem) => void) {
  let config: any = {};
  if (h.contentJson) {
    try {
      config = typeof h.contentJson === 'string' ? JSON.parse(h.contentJson) : h.contentJson;
    } catch {}
  }

  const isNav = h.type === 'NAVIGATION' || h.type === 'FLOOR_NAVIGATION';
  const buttonStyle = config.buttonStyle || (isNav ? 'pill' : 'beacon');
  const buttonSize = config.buttonSize || 'md';
  const colorTheme = config.colorTheme || 'indigo';
  const iconName = config.icon || h.icon || (isNav ? 'arrow-right' : 'info');
  const alwaysShowLabel = config.alwaysShowLabel !== undefined ? config.alwaysShowLabel : (buttonStyle === 'pill' || buttonStyle === 'card');
  const pulseAnimation = config.pulseAnimation !== undefined ? config.pulseAnimation : true;
  const subtitle = config.subtitle || '';
  const linkedSceneName = h.targetSceneName || h.targetScene?.name;
  const label = linkedSceneName || h.label || (isNav ? 'Halaman Berikutnya' : 'Informasi');

  const getIconSvg = (name: string) => {
    if (name === 'none') return '';
    switch (name) {
      case 'door':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"></path><path d="M2 20h20"></path><circle cx="14" cy="12" r="1"></circle></svg>`;
      case 'stairs':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 4 18 8 14 8 14 12 10 12 10 16 6 16 6 20"></polyline></svg>`;
      case 'footprints':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.5-2 8.5V16"></path><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.5 2 8.5V20"></path></svg>`;
      case 'compass':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>`;
      case 'external-link':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
      case 'info':
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
      case 'arrow-right':
      default:
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
    }
  };

  const colorsMap: Record<string, { bg: string; border: string; glow: string; text: string; wave: string }> = {
    indigo: {
      bg: 'rgba(79, 70, 229, 0.92)',
      border: 'rgba(199, 210, 254, 0.95)',
      glow: '0 4px 20px rgba(99, 102, 241, 0.65)',
      text: '#ffffff',
      wave: 'rgba(99, 102, 241, 0.55)',
    },
    emerald: {
      bg: 'rgba(5, 150, 105, 0.92)',
      border: 'rgba(167, 243, 208, 0.95)',
      glow: '0 4px 20px rgba(16, 185, 129, 0.65)',
      text: '#ffffff',
      wave: 'rgba(16, 185, 129, 0.55)',
    },
    amber: {
      bg: 'rgba(217, 119, 6, 0.92)',
      border: 'rgba(254, 243, 199, 0.95)',
      glow: '0 4px 20px rgba(245, 158, 11, 0.65)',
      text: '#ffffff',
      wave: 'rgba(245, 158, 11, 0.55)',
    },
    sky: {
      bg: 'rgba(2, 132, 199, 0.92)',
      border: 'rgba(186, 230, 253, 0.95)',
      glow: '0 4px 20px rgba(14, 165, 233, 0.65)',
      text: '#ffffff',
      wave: 'rgba(14, 165, 233, 0.55)',
    },
    rose: {
      bg: 'rgba(225, 29, 72, 0.92)',
      border: 'rgba(254, 205, 211, 0.95)',
      glow: '0 4px 20px rgba(244, 63, 94, 0.65)',
      text: '#ffffff',
      wave: 'rgba(244, 63, 94, 0.55)',
    },
    glass: {
      bg: 'rgba(18, 18, 22, 0.88)',
      border: 'rgba(255, 255, 255, 0.7)',
      glow: '0 4px 20px rgba(0, 0, 0, 0.6)',
      text: '#ffffff',
      wave: 'rgba(255, 255, 255, 0.35)',
    },
  };

  const currentTheme = colorsMap[colorTheme] || colorsMap.indigo;

  const sizeStyles = {
    sm: { padding: '6px 14px', fontSize: '11px', iconWrap: '20px' },
    md: { padding: '10px 18px', fontSize: '12.5px', iconWrap: '24px' },
    lg: { padding: '14px 24px', fontSize: '14px', iconWrap: '28px' },
  }[buttonSize as 'sm' | 'md' | 'lg'] || { padding: '10px 18px', fontSize: '12.5px', iconWrap: '24px' };

  const el = document.createElement('div');
  el.className = 'marzipano-hotspot-anchor select-none';
  el.style.position = 'absolute';
  el.style.pointerEvents = 'auto';
  el.style.zIndex = '10';

  const wrapper = document.createElement('div');
  wrapper.className = 'hotspot-btn-wrapper select-none cursor-pointer';
  wrapper.style.display = 'inline-block';
  wrapper.style.transformOrigin = 'center center';
  wrapper.style.transition = 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)';

  wrapper.addEventListener('mouseenter', () => {
    wrapper.style.transform = 'scale(1.06)';
  });
  wrapper.addEventListener('mouseleave', () => {
    wrapper.style.transform = 'scale(1)';
  });
  wrapper.addEventListener('mousedown', () => {
    wrapper.style.transform = 'scale(0.95)';
  });
  wrapper.addEventListener('mouseup', () => {
    wrapper.style.transform = 'scale(1.06)';
  });

  if (buttonStyle === 'pill') {
    wrapper.innerHTML = `
      <div style="position: relative; display: flex; align-items: center; gap: 8px; padding: ${sizeStyles.padding}; border-radius: 9999px; background: ${currentTheme.bg}; color: ${currentTheme.text}; border: 2px solid ${currentTheme.border}; box-shadow: ${currentTheme.glow}; backdrop-filter: blur(8px); white-space: nowrap; font-family: inherit;">
        ${pulseAnimation ? `<div style="position: absolute; inset: -4px; border-radius: 9999px; border: 2px solid ${currentTheme.wave}; animation: pulse-ring 2s infinite ease-out; pointer-events: none;"></div>` : ''}
        <div style="width: ${sizeStyles.iconWrap}; height: ${sizeStyles.iconWrap}; border-radius: 50%; background: rgba(255, 255, 255, 0.22); display: flex; align-items: center; justify-content: center; shrink: 0;">
          ${getIconSvg(iconName)}
        </div>
        <div style="display: flex; flex-direction: column; text-align: left; line-height: 1.2;">
          <span style="font-weight: 700; font-size: ${sizeStyles.fontSize}; letter-spacing: 0.02em;">${label}</span>
          ${subtitle ? `<span style="font-size: 10px; opacity: 0.85; font-weight: 400;">${subtitle}</span>` : ''}
        </div>
        <svg style="width: 14px; height: 14px; opacity: 0.8; margin-left: 2px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </div>
    `;
  } else if (buttonStyle === 'card') {
    wrapper.innerHTML = `
      <div style="position: relative; display: flex; flex-direction: column; gap: 4px; padding: 12px 16px; border-radius: 16px; background: ${currentTheme.bg}; color: ${currentTheme.text}; border: 2px solid ${currentTheme.border}; box-shadow: ${currentTheme.glow}; backdrop-filter: blur(8px); min-width: 140px; font-family: inherit;">
        ${pulseAnimation ? `<div style="position: absolute; inset: -4px; border-radius: 18px; border: 2px solid ${currentTheme.wave}; animation: pulse-ring 2s infinite ease-out; pointer-events: none;"></div>` : ''}
        <div style="display: flex; align-items: center; gap: 6px; font-size: 10px; text-transform: uppercase; font-weight: 700; opacity: 0.8;">
          <div style="width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;">${getIconSvg(iconName)}</div>
          <span>Tujuan Lokasi</span>
        </div>
        <span style="font-weight: 700; font-size: ${sizeStyles.fontSize}; line-height: 1.3;">${label}</span>
        ${subtitle ? `<span style="font-size: 10px; opacity: 0.8;">${subtitle}</span>` : ''}
      </div>
    `;
  } else if (buttonStyle === 'chevron') {
    wrapper.innerHTML = `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; font-family: inherit;">
        ${pulseAnimation ? `<div style="position: absolute; width: 56px; height: 56px; border-radius: 50%; border: 2px solid ${currentTheme.wave}; animation: pulse-ring 2s infinite ease-out; pointer-events: none;"></div>` : ''}
        <div style="width: 48px; height: 48px; border-radius: 50%; background: ${currentTheme.bg}; color: ${currentTheme.text}; border: 2px solid ${currentTheme.border}; box-shadow: ${currentTheme.glow}; display: flex; align-items: center; justify-content: center;">
          ${getIconSvg(iconName)}
        </div>
        ${label ? `
          <div style="margin-top: 6px; padding: 4px 10px; border-radius: 9999px; background: rgba(0,0,0,0.85); color: #fff; font-size: 11px; font-weight: 600; border: 1px solid rgba(255,255,255,0.2); white-space: nowrap;">
            ${label}
          </div>
        ` : ''}
      </div>
    `;
  } else {
    wrapper.innerHTML = `
      <div style="position: relative; width: 44px; height: 44px; border-radius: 50%; background: ${currentTheme.bg}; color: ${currentTheme.text}; border: 2px solid ${currentTheme.border}; box-shadow: ${currentTheme.glow}; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(6px);">
        ${pulseAnimation ? `<div style="position: absolute; inset: -4px; border-radius: 50%; border: 2px solid ${currentTheme.wave}; animation: pulse-ring 2s infinite ease-out; pointer-events: none;"></div>` : ''}
        ${getIconSvg(iconName)}
      </div>
      ${label ? `
        <div class="${alwaysShowLabel ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity" style="position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); padding: 4px 10px; border-radius: 8px; background: rgba(15,23,42,0.92); color: #fff; font-size: 11px; font-weight: 600; border: 1px solid rgba(255,255,255,0.2); white-space: nowrap; pointer-events: none;">
          ${label}
        </div>
      ` : ''}
    `;
  }

  wrapper.addEventListener('click', (e) => {
    e.stopPropagation();
    if (onHotspotClick) onHotspotClick(h);
  });

  el.appendChild(wrapper);
  return el;
}

export function MarzipanoViewer({
  panoramaUrl,
  initialYaw = 0,
  initialPitch = 0,
  initialFov = 1.05,
  hotspots = [],
  onHotspotClick,
  onViewerClick,
  onViewChange,
  isEditorMode = false,
}: MarzipanoViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const viewRef = useRef<any>(null);
  const gyroMethodRef = useRef<any>(null);
  const isGyroActiveRef = useRef<boolean>(false);
  const hudCoordsRef = useRef<HTMLSpanElement>(null);
  const [isGyroActive, setIsGyroActive] = useState<boolean>(false);
  const [hasSensorMovement, setHasSensorMovement] = useState<boolean>(false);

  // Stable callback refs to prevent unnecessary re-renders & scene thrashes
  const onViewChangeRef = useRef(onViewChange);
  onViewChangeRef.current = onViewChange;

  const onViewerClickRef = useRef(onViewerClick);
  onViewerClickRef.current = onViewerClick;

  const onHotspotClickRef = useRef(onHotspotClick);
  onHotspotClickRef.current = onHotspotClick;

  const isEditorModeRef = useRef(isEditorMode);
  isEditorModeRef.current = isEditorMode;

  // 1. Initialize Marzipano Viewer once
  useEffect(() => {
    if (!containerRef.current) return;

    const viewer = new Marzipano.Viewer(containerRef.current, {
      controls: {
        mouseViewMode: 'drag',
      },
      stage: {
        progressive: true,
      },
    });
    viewerRef.current = viewer;

    // Setup Gyroscope Control Method
    try {
      const gyroMethod = createDeviceOrientationMethod(Marzipano);
      (viewer as any).controls().registerMethod('deviceOrientation', gyroMethod);
      gyroMethodRef.current = gyroMethod;
    } catch (e) {
      console.warn('Device orientation not supported in this runtime', e);
    }

    // Handle screen orientation & resize
    const handleOrientationChange = () => {
      if (gyroMethodRef.current) {
        gyroMethodRef.current.reset();
      }
      setTimeout(() => {
        (viewer as any).updateSize();
      }, 250);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
      if (gyroMethodRef.current) {
        gyroMethodRef.current.destroy();
        gyroMethodRef.current = null;
      }
      viewer.destroy();
      viewerRef.current = null;
      sceneRef.current = null;
      isGyroActiveRef.current = false;
      setIsGyroActive(false);
    };
  }, []);

  // 2. Switch scene ONLY when panoramaUrl changes!
  useEffect(() => {
    if (!viewerRef.current || !panoramaUrl) return;
    const viewer = viewerRef.current;

    const source = Marzipano.ImageUrlSource.fromString(panoramaUrl);
    const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);
    const limiter = Marzipano.RectilinearView.limit.traditional(2048, (120 * Math.PI) / 180);

    const view = new Marzipano.RectilinearView(
      { yaw: initialYaw, pitch: initialPitch, fov: initialFov },
      limiter
    );
    viewRef.current = view;

    const scene = viewer.createScene({ source, geometry, view });
    sceneRef.current = scene;

    scene.switchTo({ transitionDuration: 300 });

    // Track camera movement directly in DOM without triggering React re-renders!
    view.addEventListener('change', () => {
      const yaw = view.yaw();
      const pitch = view.pitch();
      if (hudCoordsRef.current) {
        hudCoordsRef.current.textContent = `Yaw: ${yaw.toFixed(2)} rad | Pitch: ${pitch.toFixed(2)} rad`;
      }
      if (onViewChangeRef.current) {
        onViewChangeRef.current({ yaw, pitch, fov: view.fov() });
      }
    });

    // If gyro is already active, sync pitch with device tilt
    if (isGyroActiveRef.current && gyroMethodRef.current) {
      gyroMethodRef.current.reset();
      gyroMethodRef.current.getPitch((err: any, pitch: number) => {
        if (!err && typeof pitch === 'number') {
          (view as any).setPitch(pitch);
        }
      });
    }

    // Handle Raycasting click for Editor (distinguishing click from pan/drag)
    const domElement = containerRef.current;
    if (!domElement) return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const handlePointerDown = (e: MouseEvent) => {
      startX = e.clientX;
      startY = e.clientY;
      startTime = Date.now();
    };

    const handleClick = (e: MouseEvent) => {
      if (!isEditorModeRef.current || !onViewerClickRef.current) return;
      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      const duration = Date.now() - startTime;
      // If user dragged more than 8px or held down longer than 400ms, it is a camera pan/drag, not a click!
      if (dist > 8 || duration > 400) return;

      const rect = domElement.getBoundingClientRect();
      const coords = view.screenToCoordinates({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      if (coords && onViewerClickRef.current) {
        onViewerClickRef.current(coords);
      }
    };

    domElement.addEventListener('mousedown', handlePointerDown);
    domElement.addEventListener('click', handleClick);
    return () => {
      domElement.removeEventListener('mousedown', handlePointerDown);
      domElement.removeEventListener('click', handleClick);
    };
  }, [panoramaUrl]);

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
      const el = createHotspotDOM(h, (clickedH) => {
        if (onHotspotClickRef.current) onHotspotClickRef.current(clickedH);
      });
      container.createHotspot(el, { yaw: h.yaw, pitch: h.pitch });
    }
  }, [hotspots]);

  // Camera Zoom Controls
  const handleZoom = (delta: number) => {
    if (!sceneRef.current) return;
    const view = sceneRef.current.view();
    view.setFov(Math.max(0.4, Math.min(2.0, view.fov() + delta)));
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

  const handleToggleGyro = () => {
    if (!viewerRef.current || !gyroMethodRef.current || !sceneRef.current) return;
    const controls = (viewerRef.current as any).controls();

    if (isGyroActive) {
      controls.disableMethod('deviceOrientation');
      isGyroActiveRef.current = false;
      setIsGyroActive(false);
      setHasSensorMovement(false);
      return;
    }

    const enable = () => {
      gyroMethodRef.current.reset();
      gyroMethodRef.current.getPitch((err: any, pitch: number) => {
        if (!err && typeof pitch === 'number') {
          sceneRef.current?.view()?.setPitch(pitch);
        }
      });
      controls.enableMethod('deviceOrientation');
      isGyroActiveRef.current = true;
      setIsGyroActive(true);

      // Verify if physical hardware sensor events are arriving
      setTimeout(() => {
        if (gyroMethodRef.current?.hasReceivedData) {
          setHasSensorMovement(true);
        } else {
          console.info('Sensor fisik tidak terdeteksi (umum pada PC desktop tanpa akselerometer/giroskop). Gunakan smartphone atau Chrome DevTools Sensor.');
        }
      }, 1200);
    };

    if (typeof window !== 'undefined') {
      // Check Secure Context on mobile Chrome
      if (window.isSecureContext === false && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        alert('Perhatian: Browser Android/Chrome memerlukan HTTPS atau localhost untuk mengizinkan sensor giroskop.');
      }

      if (window.DeviceOrientationEvent) {
        const anyEvent = window.DeviceOrientationEvent as any;
        if (typeof anyEvent.requestPermission === 'function') {
          anyEvent
            .requestPermission()
            .then((response: string) => {
              if (response === 'granted') {
                enable();
              } else {
                alert('Izin sensor gerak / giroskop tidak diizinkan oleh browser.');
              }
            })
            .catch((e: any) => {
              alert('Gagal meminta izin sensor giroskop: ' + (e && e.message ? e.message : 'Ditolak sistem.'));
            });
        } else {
          enable();
        }
      } else {
        alert('Perangkat atau browser ini tidak mendukung sensor giroskop (DeviceOrientation).');
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-black select-none overflow-hidden group">
      <div
        ref={containerRef}
        className={`w-full h-full ${isEditorMode ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
      />

      {/* Floating Panorama HUD Controls */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex items-center gap-1.5 sm:gap-2 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md p-1.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 shadow-xl z-20">
        {/* Gyroscope Sensor Button */}
        <button
          onClick={handleToggleGyro}
          className={`p-2 rounded-xl transition ${
            isGyroActive
              ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400 animate-pulse'
              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
          title={isGyroActive ? 'Matikan Sensor Giroskop' : 'Aktifkan Sensor Giroskop (Gerak HP)'}
        >
          <Smartphone className="w-4 h-4" />
        </button>

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

      {/* Camera Orientation HUD (Shown in Editor Mode) */}
      {isEditorMode && (
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white text-[11px] font-mono z-20 pointer-events-none">
          <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span ref={hudCoordsRef}>
            Yaw: {initialYaw.toFixed(2)} rad | Pitch: {initialPitch.toFixed(2)} rad
          </span>
          {isGyroActive && (
            <>
              <span className="text-white/30">|</span>
              <span className="text-indigo-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                {hasSensorMovement ? 'GYRO AKTIF (SENSOR HP)' : 'GYRO AKTIF'}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
