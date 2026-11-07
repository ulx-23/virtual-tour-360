(function () {
  'use strict';

  // Verify tour data and Marzipano library
  if (!window.TOUR_DATA) {
    console.error('Data tur (TOUR_DATA) tidak ditemukan.');
    alert('Kesalahan: tour-data.js tidak dapat dimuat.');
    return;
  }
  if (!window.Marzipano) {
    console.error('Marzipano library tidak ditemukan.');
    alert('Kesalahan: marzipano.js tidak dapat dimuat.');
    return;
  }

  const data = window.TOUR_DATA;
  const panoElement = document.getElementById('pano');

  // DOM Elements
  const tourTitleEl = document.getElementById('tourTitle');
  const sceneTitleEl = document.getElementById('sceneTitle');
  const sceneTypeBadgeEl = document.getElementById('sceneTypeBadge');
  const sceneDrawerEl = document.getElementById('sceneDrawer');
  const btnToggleDrawer = document.getElementById('btnToggleDrawer');
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnReset = document.getElementById('btnReset');
  const btnAutorotate = document.getElementById('btnAutorotate');
  const btnGyro = document.getElementById('btnGyro');
  const btnFullscreen = document.getElementById('btnFullscreen');
  const infoModal = document.getElementById('infoModalBackdrop');
  const infoModalTitle = document.getElementById('infoModalTitle');
  const infoModalText = document.getElementById('infoModalText');
  const infoModalClose = document.getElementById('infoModalClose');
  const infoModalMedia = document.getElementById('infoModalMedia');
  function escapeText(value) {
    const span = document.createElement('span');
    span.textContent = String(value || '');
    return span.innerHTML;
  }

  // Minimap Elements
  const minimapOverlay = document.getElementById('minimapOverlay');
  const btnToggleMinimap = document.getElementById('btnToggleMinimap');
  const closeMinimapBtn = document.getElementById('closeMinimapBtn');
  const minimapImg = document.getElementById('minimapImg');
  const minimapFloorName = document.getElementById('minimapFloorName');
  const minimapMarkersContainer = document.getElementById('minimapMarkersContainer');

  // Set Tour Title
  if (tourTitleEl && data.title) {
    tourTitleEl.textContent = data.title;
    document.title = data.title + ' — Virtual Tour 360°';
  }

  // 1. Initialize Marzipano Viewer
  const viewerOpts = {
    controls: {
      mouseViewMode: 'drag',
    },
    stage: {
      progressive: true,
    },
  };
  const viewer = new Marzipano.Viewer(panoElement, viewerOpts);

  // Velocity controls for zoom and pan
  const controls = viewer.controls();
  let autorotate = null;
  let isAutorotating = false;

  try {
    const autorotateProvider = Marzipano.autorotate({
      yawSpeed: 0.03,
      targetPitch: 0,
      targetFov: 1.05,
    });
    autorotate = autorotateProvider;
  } catch (e) {
    console.warn('Autorotate module not available', e);
  }

  // Device Orientation (Gyroscope) Controls
  function rotateEuler(euler, result) {
    var heading, bank, attitude,
      ch = Math.cos(euler.yaw),
      sh = Math.sin(euler.yaw),
      ca = Math.cos(euler.pitch),
      sa = Math.sin(euler.pitch),
      cb = Math.cos(euler.roll),
      sb = Math.sin(euler.roll),
      matrix = [
        sh*sb - ch*sa*cb,   -ch*ca,    ch*sa*sb + sh*cb,
        ca*cb,              -sa,      -ca*sb,
        sh*sa*cb + ch*sb,    sh*ca,   -sh*sa*sb + ch*cb
      ];

    if (matrix[3] > 0.9999) {
      heading = Math.atan2(matrix[2], matrix[8]);
      attitude = Math.PI/2;
      bank = 0;
    } else if (matrix[3] < -0.9999) {
      heading = Math.atan2(matrix[2], matrix[8]);
      attitude = -Math.PI/2;
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

  function DeviceOrientationControlMethod() {
    this._dynamics = {
      yaw: new Marzipano.Dynamics(),
      pitch: new Marzipano.Dynamics()
    };
    this._deviceOrientationHandler = this._handleData.bind(this);
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', this._deviceOrientationHandler);
    }
    this._previous = {};
    this._current = {};
    this._tmp = {};
    this._getPitchCallbacks = [];
  }

  if (Marzipano.dependencies && Marzipano.dependencies.eventEmitter) {
    Marzipano.dependencies.eventEmitter(DeviceOrientationControlMethod);
  }

  DeviceOrientationControlMethod.prototype.destroy = function() {
    this._dynamics = null;
    if (window.DeviceOrientationEvent) {
      window.removeEventListener('deviceorientation', this._deviceOrientationHandler);
    }
    this._deviceOrientationHandler = null;
    this._previous = null;
    this._current = null;
    this._tmp = null;
    this._getPitchCallbacks = null;
  };

  DeviceOrientationControlMethod.prototype.reset = function() {
    this._previous = {};
    this._current = {};
    this._tmp = {};
  };

  DeviceOrientationControlMethod.prototype.getPitch = function(cb) {
    this._getPitchCallbacks.push(cb);
  };

  DeviceOrientationControlMethod.prototype._handleData = function(data) {
    if (data.alpha === null || data.beta === null || data.gamma === null) return;
    this.hasReceivedData = true;
    var previous = this._previous,
        current = this._current,
        tmp = this._tmp;

    tmp.yaw = Marzipano.util.degToRad(data.alpha);
    tmp.pitch = Marzipano.util.degToRad(data.beta);
    tmp.roll = Marzipano.util.degToRad(data.gamma);

    rotateEuler(tmp, current);

    this._getPitchCallbacks.forEach(function(callback) {
      callback(null, current.pitch);
    });
    this._getPitchCallbacks.length = 0;

    if (previous.yaw != null && previous.pitch != null && previous.roll != null) {
      var deltaYaw = current.yaw - previous.yaw;
      while (deltaYaw > Math.PI) deltaYaw -= 2 * Math.PI;
      while (deltaYaw < -Math.PI) deltaYaw += 2 * Math.PI;

      var deltaPitch = current.pitch - previous.pitch;
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

  var gyroMethod = null;
  var isGyroActive = false;

  try {
    gyroMethod = new DeviceOrientationControlMethod();
    controls.registerMethod('deviceOrientation', gyroMethod);
  } catch (e) {
    console.warn('Gyroscope control method not supported', e);
  }

  // Map to hold Marzipano Scene instances
  const scenesMap = {};
  let currentSceneData = null;

  // Icons SVG dictionary
  const ICONS = {
    navigation: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2l7 19-7-4-7 4 7-19z"></path></svg>`,
    arrow: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`,
    door: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 4h3a2 2 0 0 1 2 2v14H6V6a2 2 0 0 1 2-2h5"></path><line x1="14" y1="12" x2="14" y2="12.01"></line></svg>`,
    stairs: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 17 9 17 9 11 15 11 15 5 21 5"></polyline></svg>`,
    footprints: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><ellipse cx="8" cy="8" rx="2.5" ry="4"></ellipse><ellipse cx="16" cy="16" rx="2.5" ry="4"></ellipse></svg>`,
    compass: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>`,
    info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
    floor: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`,
    link: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
  };

  // 2. Create Marzipano Scenes
  data.scenes.forEach(function (sceneData) {
    const source = Marzipano.ImageUrlSource.fromString(sceneData.panoramaUrl);
    const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);

    const limiter = Marzipano.RectilinearView.limit.traditional(
      4096,
      100 * Math.PI / 180
    );

    const initialView = {
      yaw: sceneData.initialYaw || 0,
      pitch: sceneData.pitch || sceneData.initialPitch || 0,
      fov: sceneData.initialFov || 1.05,
    };

    const view = new Marzipano.RectilinearView(initialView, limiter);
    const marzipanoScene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true,
    });

    // Populate hotspots for this scene
    if (sceneData.hotspots && sceneData.hotspots.length > 0) {
      sceneData.hotspots.forEach(function (h) {
        const container = marzipanoScene.hotspotContainer();
        const element = createHotspotElement(h);
        container.createHotspot(element, { yaw: h.yaw, pitch: h.pitch });
      });
    }

    scenesMap[sceneData.id] = {
      marzipanoScene: marzipanoScene,
      data: sceneData,
      view: view,
    };
  });

  // Hotspot DOM Factory
  function createHotspotElement(hotspot) {
    const el = document.createElement('div');
    el.className = 'hotspot-element';

    // Parse button design config from contentJson if available
    let config = {};
    if (hotspot.contentJson) {
      if (typeof hotspot.contentJson === 'string') {
        try { config = JSON.parse(hotspot.contentJson); } catch (e) {}
      } else if (typeof hotspot.contentJson === 'object') {
        config = hotspot.contentJson;
      }
    }

    const type = (hotspot.type || 'NAVIGATION').toUpperCase();
    const isNav = type === 'NAVIGATION' || type === 'FLOOR_NAVIGATION';
    const buttonStyle = config.buttonStyle || (isNav ? 'pill' : 'beacon');
    const colorTheme = config.colorTheme || 'indigo';
    const buttonSize = config.buttonSize || 'md';
    const iconName = config.icon || hotspot.icon || (isNav ? 'arrow-right' : 'info');
    const alwaysShowLabel = config.alwaysShowLabel !== undefined ? config.alwaysShowLabel : true;
    const pulseAnimation = config.pulseAnimation !== undefined ? config.pulseAnimation : true;
    const targetScene = hotspot.targetSceneId ? scenesMap[hotspot.targetSceneId] : null;
    const label = escapeText(hotspot.targetSceneName || targetScene?.name || hotspot.label || (isNav ? 'Lanjut ke Lokasi' : ''));
    const subtitle = escapeText(config.subtitle || '');

    // Color theme map
    const themeColors = {
      indigo: { bg: 'rgba(79, 70, 229, 0.95)', border: '#818cf8', wave: 'rgba(129, 140, 248, 0.55)', text: '#ffffff' },
      emerald: { bg: 'rgba(5, 150, 105, 0.95)', border: '#34d399', wave: 'rgba(52, 211, 153, 0.55)', text: '#ffffff' },
      sky: { bg: 'rgba(2, 132, 199, 0.95)', border: '#38bdf8', wave: 'rgba(56, 189, 248, 0.55)', text: '#ffffff' },
      amber: { bg: 'rgba(217, 119, 6, 0.95)', border: '#fbbf24', wave: 'rgba(251, 191, 36, 0.55)', text: '#ffffff' },
      rose: { bg: 'rgba(225, 29, 72, 0.95)', border: '#fb7185', wave: 'rgba(251, 113, 133, 0.55)', text: '#ffffff' },
      glass: { bg: 'rgba(18, 18, 22, 0.88)', border: 'rgba(255, 255, 255, 0.7)', wave: 'rgba(255, 255, 255, 0.35)', text: '#ffffff' },
    };
    const currentTheme = themeColors[colorTheme] || themeColors.indigo;

    const sizeStyles = {
      sm: { padding: '6px 14px', fontSize: '11px', iconWrap: '20px' },
      md: { padding: '10px 18px', fontSize: '12.5px', iconWrap: '24px' },
      lg: { padding: '14px 24px', fontSize: '14px', iconWrap: '28px' },
    }[buttonSize] || { padding: '10px 18px', fontSize: '12.5px', iconWrap: '24px' };

    function resolveIcon(name) {
      if (name === 'door') return ICONS.door;
      if (name === 'stairs') return ICONS.stairs;
      if (name === 'footprints') return ICONS.footprints;
      if (name === 'compass') return ICONS.compass;
      if (name === 'external-link') return ICONS.link;
      return ICONS.arrow;
    }

    const inner = document.createElement('div');
    inner.className = 'hotspot-inner';

    if (buttonStyle === 'pill') {
      inner.innerHTML = `
        <div class="hotspot-btn-pill" style="position: relative; display: flex; align-items: center; gap: 8px; padding: ${sizeStyles.padding}; border-radius: 9999px; background: ${currentTheme.bg}; color: ${currentTheme.text}; border: 2px solid ${currentTheme.border}; box-shadow: 0 4px 20px rgba(0,0,0,0.5); backdrop-filter: blur(8px); white-space: nowrap;">
          ${pulseAnimation ? `<div style="position: absolute; inset: -4px; border-radius: 9999px; border: 2px solid ${currentTheme.wave}; animation: pulse-ring 2s infinite ease-out; pointer-events: none;"></div>` : ''}
          <div style="width: ${sizeStyles.iconWrap}; height: ${sizeStyles.iconWrap}; border-radius: 50%; background: rgba(255, 255, 255, 0.22); display: flex; align-items: center; justify-content: center; shrink: 0;">
            ${resolveIcon(iconName)}
          </div>
          <div style="display: flex; flex-direction: column; text-align: left; line-height: 1.2;">
            <span style="font-weight: 700; font-size: ${sizeStyles.fontSize}; letter-spacing: 0.02em;">${label}</span>
            ${subtitle ? `<span style="font-size: 10px; opacity: 0.85; font-weight: 400;">${subtitle}</span>` : ''}
          </div>
          <svg style="width: 14px; height: 14px; opacity: 0.8; margin-left: 2px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>
      `;
    } else if (buttonStyle === 'card') {
      inner.innerHTML = `
        <div class="hotspot-btn-card" style="position: relative; display: flex; flex-direction: column; gap: 4px; padding: 12px 16px; border-radius: 16px; background: ${currentTheme.bg}; color: ${currentTheme.text}; border: 2px solid ${currentTheme.border}; box-shadow: 0 4px 20px rgba(0,0,0,0.5); backdrop-filter: blur(8px); min-width: 140px;">
          ${pulseAnimation ? `<div style="position: absolute; inset: -4px; border-radius: 18px; border: 2px solid ${currentTheme.wave}; animation: pulse-ring 2s infinite ease-out; pointer-events: none;"></div>` : ''}
          <div style="display: flex; align-items: center; gap: 6px; font-size: 10px; text-transform: uppercase; font-weight: 700; opacity: 0.8;">
            <div style="width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;">${resolveIcon(iconName)}</div>
            <span>Tujuan Lokasi</span>
          </div>
          <span style="font-weight: 700; font-size: ${sizeStyles.fontSize}; line-height: 1.3;">${label}</span>
          ${subtitle ? `<span style="font-size: 10px; opacity: 0.8;">${subtitle}</span>` : ''}
        </div>
      `;
    } else if (buttonStyle === 'chevron') {
      inner.innerHTML = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          ${pulseAnimation ? `<div style="position: absolute; width: 56px; height: 56px; border-radius: 50%; border: 2px solid ${currentTheme.wave}; animation: pulse-ring 2s infinite ease-out; pointer-events: none;"></div>` : ''}
          <div style="width: 48px; height: 48px; border-radius: 50%; background: ${currentTheme.bg}; color: ${currentTheme.text}; border: 2px solid ${currentTheme.border}; box-shadow: 0 4px 20px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
            ${resolveIcon(iconName)}
          </div>
          ${label ? `<div style="margin-top: 6px; padding: 4px 10px; border-radius: 9999px; background: rgba(0,0,0,0.85); color: #fff; font-size: 11px; font-weight: 600; border: 1px solid rgba(255,255,255,0.2); white-space: nowrap;">${label}</div>` : ''}
        </div>
      `;
    } else {
      // Classic Beacon
      inner.innerHTML = `
        <div style="position: relative; width: 44px; height: 44px; border-radius: 50%; background: ${currentTheme.bg}; color: ${currentTheme.text}; border: 2px solid ${currentTheme.border}; box-shadow: 0 4px 20px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; backdrop-filter: blur(6px);">
          ${pulseAnimation ? `<div style="position: absolute; inset: -4px; border-radius: 50%; border: 2px solid ${currentTheme.wave}; animation: pulse-ring 2s infinite ease-out; pointer-events: none;"></div>` : ''}
          ${resolveIcon(iconName)}
        </div>
        ${label ? `
          <div class="hotspot-tooltip ${alwaysShowLabel ? 'always-visible' : ''}">
            ${label}
          </div>
        ` : ''}
      `;
    }

    // Click handler on inner button
    inner.setAttribute('role', 'button');
    inner.tabIndex = 0;
    inner.dataset.hotspotId = hotspot.id;
    inner.setAttribute('aria-label', hotspot.label || hotspot.targetSceneName || 'Hotspot');
    inner.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); handleHotspotClick(hotspot); }
    });
    inner.addEventListener('click', function (e) {
      e.stopPropagation();
      handleHotspotClick(hotspot);
    });

    el.appendChild(inner);
    return el;
  }

  // Handle Hotspot Click
  function handleHotspotClick(hotspot) {
    const type = (hotspot.type || 'NAVIGATION').toUpperCase();

    if (type === 'NAVIGATION' || type === 'FLOOR_NAVIGATION') {
      if (hotspot.targetSceneId && scenesMap[hotspot.targetSceneId]) {
        switchScene(hotspot.targetSceneId, {
          yaw: hotspot.targetYaw,
          pitch: hotspot.targetPitch,
        });
      } else {
        alert('Scene tujuan tidak ditemukan.');
      }
    } else if (type === 'INFORMATION') {
      const title = hotspot.label || 'Informasi';
      let content = '';
      if (hotspot.contentJson) {
        if (typeof hotspot.contentJson === 'string') {
          content = hotspot.contentJson;
        } else if (hotspot.contentJson.text) {
          content = hotspot.contentJson.text;
        } else {
          content = JSON.stringify(hotspot.contentJson, null, 2);
        }
      } else {
        content = 'Tidak ada deskripsi detail untuk hotspot ini.';
      }

      openInfoModal(title, content);
    } else if (type === 'IMAGE' || type === 'VIDEO') {
      const config = hotspot.contentJson || {};
      const url = config.url || config.imageUrl || config.videoUrl;
      if (!url || !/^(\.\/|data:(image|video)\/)/.test(url)) {
        openInfoModal('Media tidak tersedia', 'File media belum tersedia di paket offline.');
        return;
      }
      openInfoModal(hotspot.label || 'Media', config.text || '');
      const media = document.createElement(type === 'IMAGE' ? 'img' : 'video');
      if (type === 'VIDEO') { media.controls = true; media.preload = 'metadata'; }
      else media.alt = hotspot.label || 'Gambar hotspot';
      media.style.maxWidth = '100%';
      media.style.maxHeight = '60vh';
      media.addEventListener('error', function () { infoModalText.textContent = 'Media tidak dapat dimuat. Periksa file dan formatnya.'; });
      media.src = url;
      if (infoModalMedia) infoModalMedia.appendChild(media);
    } else if (type === 'EXTERNAL_LINK') {
      const url = hotspot.contentJson?.url || hotspot.label;
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        if (window.confirm('Tautan ini memerlukan internet. Buka situs eksternal?')) window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  }

  // Switch Scene
  function switchScene(sceneId, targetViewParams) {
    const target = scenesMap[sceneId];
    if (!target) return;

    // Transition view
    if (targetViewParams && (targetViewParams.yaw !== undefined && targetViewParams.yaw !== null)) {
      target.view.setParameters({
        yaw: targetViewParams.yaw,
        pitch: targetViewParams.pitch || 0,
        fov: target.data.initialFov || 1.05,
      });
    }

    target.marzipanoScene.switchTo({
      transitionDuration: 800,
    });

    currentSceneData = target.data;

    // Update HUD
    if (sceneTitleEl) sceneTitleEl.textContent = target.data.name;
    if (sceneTypeBadgeEl) {
      sceneTypeBadgeEl.textContent = target.data.sceneType || 'OUTDOOR';
      if (target.data.sceneType === 'INDOOR') {
        sceneTypeBadgeEl.style.background = 'rgba(16, 185, 129, 0.2)';
        sceneTypeBadgeEl.style.color = '#34d399';
        sceneTypeBadgeEl.style.borderColor = 'rgba(16, 185, 129, 0.3)';
      } else if (target.data.sceneType === 'TRANSITION') {
        sceneTypeBadgeEl.style.background = 'rgba(245, 158, 11, 0.2)';
        sceneTypeBadgeEl.style.color = '#fbbf24';
        sceneTypeBadgeEl.style.borderColor = 'rgba(245, 158, 11, 0.3)';
      } else {
        sceneTypeBadgeEl.style.background = 'rgba(99, 102, 241, 0.2)';
        sceneTypeBadgeEl.style.color = '#818cf8';
        sceneTypeBadgeEl.style.borderColor = 'rgba(99, 102, 241, 0.3)';
      }
    }

    // Highlight active card in drawer
    const cards = document.querySelectorAll('.scene-thumb-card');
    cards.forEach(function (c) {
      c.classList.toggle('active', c.getAttribute('data-id') === sceneId);
    });

    // Update minimap active dot
    updateMinimapForScene(target.data);
  }

  // Build Scene Drawer Cards
  function initSceneDrawer() {
    if (!sceneDrawerEl) return;
    sceneDrawerEl.innerHTML = '';

    data.scenes.forEach(function (s) {
      const card = document.createElement('div');
      card.className = 'scene-thumb-card';
      card.setAttribute('data-id', s.id);

      const img = document.createElement('img');
      img.className = 'scene-thumb-img';
      img.src = s.thumbnailUrl || s.panoramaUrl;
      img.alt = s.name;

      const title = document.createElement('div');
      title.className = 'scene-thumb-title';
      title.textContent = s.name;

      card.appendChild(img);
      card.appendChild(title);

      card.addEventListener('click', function () {
        switchScene(s.id);
      });

      sceneDrawerEl.appendChild(card);
    });
  }

  // Floor Plan Minimap Logic
  function findFloorPlanForScene(sceneData) {
    if (!data.buildings) return null;
    for (let b of data.buildings) {
      for (let f of b.floors) {
        if (f.floorPlan && f.floorPlan.markers) {
          const hasMarker = f.floorPlan.markers.some((m) => m.sceneId === sceneData.id);
          if (hasMarker || (sceneData.floorId && sceneData.floorId === f.id)) {
            return { floor: f, floorPlan: f.floorPlan };
          }
        }
      }
    }
    return null;
  }

  function updateMinimapForScene(sceneData) {
    const result = findFloorPlanForScene(sceneData);
    if (!result) {
      if (btnToggleMinimap) btnToggleMinimap.style.display = 'none';
      if (minimapOverlay) minimapOverlay.style.display = 'none';
      return;
    }

    if (btnToggleMinimap) btnToggleMinimap.style.display = 'flex';
    if (minimapFloorName) minimapFloorName.textContent = result.floor.name;
    if (minimapImg) minimapImg.src = result.floorPlan.imageUrl;

    if (minimapMarkersContainer) {
      minimapMarkersContainer.innerHTML = '';
      result.floorPlan.markers.forEach(function (marker) {
        const dot = document.createElement('div');
        dot.className = 'minimap-dot';
        if (marker.sceneId === sceneData.id) {
          dot.classList.add('active');
        }
        dot.style.left = (marker.x * 100) + '%';
        dot.style.top = (marker.y * 100) + '%';
        dot.title = marker.sceneName || 'Lokasi';

        dot.addEventListener('click', function (e) {
          e.stopPropagation();
          switchScene(marker.sceneId);
        });

        minimapMarkersContainer.appendChild(dot);
      });
    }
  }

  // Info Modal Handlers
  function openInfoModal(title, text) {
    if (!infoModal) return;
    if (infoModalMedia) infoModalMedia.replaceChildren();
    if (infoModalTitle) infoModalTitle.textContent = title;
    if (infoModalText) infoModalText.textContent = text;
    infoModal.classList.add('active');
  }

  function closeInfoModal() {
    if (infoModalMedia) infoModalMedia.replaceChildren();
    if (infoModal) infoModal.classList.remove('active');
  }

  if (infoModalClose) infoModalClose.addEventListener('click', closeInfoModal);
  if (infoModal) {
    infoModal.addEventListener('click', function (e) {
      if (e.target === infoModal) closeInfoModal();
    });
  }

  // Controls Event Listeners
  if (btnZoomIn) {
    btnZoomIn.addEventListener('click', function () {
      if (!currentSceneData) return;
      const view = scenesMap[currentSceneData.id].view;
      view.setFov(Math.max(view.fov() - 0.15, 0.4));
    });
  }

  if (btnZoomOut) {
    btnZoomOut.addEventListener('click', function () {
      if (!currentSceneData) return;
      const view = scenesMap[currentSceneData.id].view;
      view.setFov(Math.min(view.fov() + 0.15, 2.0));
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', function () {
      if (!currentSceneData) return;
      const view = scenesMap[currentSceneData.id].view;
      view.setParameters({
        yaw: currentSceneData.initialYaw || 0,
        pitch: currentSceneData.initialPitch || 0,
        fov: currentSceneData.initialFov || 1.05,
      });
    });
  }

  if (btnAutorotate && autorotate) {
    btnAutorotate.addEventListener('click', function () {
      isAutorotating = !isAutorotating;
      if (isAutorotating) {
        viewer.startMovement(autorotate);
        btnAutorotate.style.color = '#818cf8';
      } else {
        viewer.stopMovement();
        btnAutorotate.style.color = '#d4d4d8';
      }
    });
  }

  if (btnGyro) {
    btnGyro.addEventListener('click', function () {
      if (!gyroMethod) {
        try {
          gyroMethod = new DeviceOrientationControlMethod();
          controls.registerMethod('deviceOrientation', gyroMethod);
        } catch (e) {
          alert('Sensor giroskop tidak didukung pada browser atau perangkat ini.');
          return;
        }
      }

      if (isGyroActive) {
        controls.disableMethod('deviceOrientation');
        isGyroActive = false;
        btnGyro.classList.remove('active');
        btnGyro.style.color = '#d4d4d8';
        return;
      }

      function enableGyro() {
        if (!currentSceneData) return;
        var view = scenesMap[currentSceneData.id].view;
        gyroMethod.reset();
        gyroMethod.getPitch(function(err, pitch) {
          if (!err && typeof pitch === 'number') {
            view.setPitch(pitch);
          }
        });
        controls.enableMethod('deviceOrientation');
        isGyroActive = true;
        btnGyro.classList.add('active');
        btnGyro.style.color = '#ffffff';

        setTimeout(function() {
          if (isGyroActive && !gyroMethod.hasReceivedData) {
            console.info('Sensor fisik tidak mengirim data gerak (umum pada PC desktop). Gunakan smartphone atau Chrome DevTools Sensor.');
          }
        }, 1500);
      }

      if (window.isSecureContext === false && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        alert('Perhatian: Browser modern memerlukan HTTPS atau localhost untuk mengaktifkan sensor giroskop.');
      }

      if (window.DeviceOrientationEvent) {
        if (typeof window.DeviceOrientationEvent.requestPermission === 'function') {
          window.DeviceOrientationEvent.requestPermission()
            .then(function(response) {
              if (response === 'granted') {
                enableGyro();
              } else {
                alert('Izin sensor gerak / giroskop ditolak.');
              }
            })
            .catch(function(e) {
              alert('Gagal meminta izin sensor giroskop: ' + (e && e.message ? e.message : 'Ditolak sistem.'));
            });
        } else {
          enableGyro();
        }
      } else {
        alert('Perangkat Anda tidak mendukung sensor giroskop (DeviceOrientation).');
      }
    });
  }

  // Handle device orientation changes (Portrait <-> Landscape)
  window.addEventListener('orientationchange', function () {
    if (gyroMethod) gyroMethod.reset();
    setTimeout(function () {
      viewer.updateSize();
    }, 250);
  });

  if (btnToggleDrawer && sceneDrawerEl) {
    btnToggleDrawer.addEventListener('click', function () {
      sceneDrawerEl.classList.toggle('hidden');
    });
  }

  if (btnToggleMinimap && minimapOverlay) {
    btnToggleMinimap.addEventListener('click', function () {
      const isVisible = minimapOverlay.style.display !== 'none';
      minimapOverlay.style.display = isVisible ? 'none' : 'block';
    });
  }

  if (closeMinimapBtn && minimapOverlay) {
    closeMinimapBtn.addEventListener('click', function () {
      minimapOverlay.style.display = 'none';
    });
  }

  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', function () {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(function () {});
      } else {
        document.exitFullscreen().catch(function () {});
      }
    });
  }

  // Keyboard navigation
  window.addEventListener('keydown', function (e) {
    if (!currentSceneData) return;
    const view = scenesMap[currentSceneData.id].view;
    if (e.key === 'ArrowLeft') view.setYaw(view.yaw() - 0.08);
    if (e.key === 'ArrowRight') view.setYaw(view.yaw() + 0.08);
    if (e.key === 'ArrowUp') view.setPitch(view.pitch() + 0.08);
    if (e.key === 'ArrowDown') view.setPitch(view.pitch() - 0.08);
    if (e.key === '+' || e.key === '=') view.setFov(Math.max(view.fov() - 0.1, 0.4));
    if (e.key === '-' || e.key === '_') view.setFov(Math.min(view.fov() + 0.1, 2.0));
    if (e.key === 'Escape') closeInfoModal();
  });

  // Start Tour
  initSceneDrawer();
  const startSceneId = data.startSceneId || (data.scenes[0] && data.scenes[0].id);
  if (startSceneId) {
    switchScene(startSceneId);
  }
})();

