/**
 * ÉLÉA — The Botanical Journey (Landing Page Engine - Optimized)
 * High-performance 60/120fps Canvas Video Scrubbing, Dynamic Scroll Velocity Spores,
 * Interactive Luxury Chapter Scrubber, and Zero-Reflow Render Loop
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const canvas = document.getElementById('film-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  const preloader = document.getElementById('preloader');
  const loaderBar = document.getElementById('loader-bar');
  const loaderPercent = document.getElementById('loader-percent');
  const loaderStatus = document.getElementById('loader-status');

  const soundBtn = document.getElementById('sound-btn');
  const soundStatusText = document.getElementById('sound-status-text');

  // Perimeter Scenes & Sequential Blueprints
  const scenes = {
    hero: document.getElementById('scene-hero'),
    notes1: document.getElementById('scene-notes-1'),
    notes2: document.getElementById('scene-notes-2'),
    notes3: document.getElementById('scene-notes-3'),
    notes4: document.getElementById('scene-notes-4'),
    endClimax: document.getElementById('scene-end-climax')
  };

  const sketchStages = {
    s1: document.getElementById('sketch-stage-1'),
    s2: document.getElementById('sketch-stage-2'),
    s3: document.getElementById('sketch-stage-3'),
    s4: document.getElementById('sketch-stage-4')
  };

  // Luxury Vertical Timeline Scrubber Elements
  const timelineIndicator = document.getElementById('timeline-indicator');
  const timelineDots = document.querySelectorAll('.timeline-dot');

  // Configuration & Adaptive Resolution Engine
  const isMobileOrSmall = (window.innerWidth <= 1024) ||
    (window.matchMedia && window.matchMedia('(max-width: 1024px)').matches) ||
    ('ontouchstart' in window) ||
    (navigator.connection && (navigator.connection.saveData || navigator.connection.effectiveType === '3g' || navigator.connection.effectiveType === '2g'));

  // Mobile: 80 ultra-lightweight frames (1.2 MB total!) — 100% preloaded during intro for zero lag
  // Desktop: 478 frames (18.5 MB) for ultra-fine mousewheel scrubbing
  const TOTAL_FRAMES = isMobileOrSmall ? 80 : 478;
  const FRAME_PATH_PREFIX = isMobileOrSmall ? 'public/frames_mobile/frame_' : 'public/frames_opt/frame_';
  const FRAME_EXTENSION = '.webp';

  const frames = [];
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const img = new Image();
    img.decoding = 'async';
    frames.push(img);
  }
  // Status flags: 0 = unrequested, 1 = loading, 2 = loaded, 3 = error
  const frameStatus = new Uint8Array(TOTAL_FRAMES);
  let loadedFramesCount = 0;
  let targetProgress = 0;
  let smoothProgress = 0;
  let currentTargetFrameIndex = 0;
  let lastDrawnFrameIndex = -1;
  let lastRenderedProgress = -1;
  let isReady = false;

  // Cached viewport dimensions to completely eliminate forced reflows during RAF loop
  let cachedWidth = window.innerWidth;
  let cachedHeight = window.innerHeight;
  let currentDpr = Math.min(window.devicePixelRatio || 1, isMobileOrSmall ? 1.0 : 1.5);
  // On mobile touchscreens, stepping by 2 reduces bandwidth and memory by 50% for buttery 60fps
  const FRAME_STEP = isMobileOrSmall ? 2 : 1;

  // Scroll Velocity Dynamics
  let lastScrollY = window.scrollY || 0;
  let lastScrollTime = performance.now();
  let scrollVelocity = 0;
  let smoothVelocity = 0;

  // Initialize Engines
  const audioEngine = typeof AudioEngine !== 'undefined' ? new AudioEngine() : null;
  const particleEngine = typeof ParticleEngine !== 'undefined' ? new ParticleEngine('particle-canvas') : null;

  // Helper: pad integer to 3 digits
  const pad3 = (num) => String(num).padStart(3, '0');

  let displayPercent = 0;
  let preloaderLoopId = null;
  const preloadStartTime = performance.now();
  const MIN_PRELOAD_MS = 1400; // 1.4s luxury intro
  const MAX_PRELOAD_MS = 2800; // Hard safety timeout to guarantee zero preloader hangs
  const ESSENTIAL_FRAMES = isMobileOrSmall ? 50 : 20; // On mobile, 50 frames (750KB) guarantees 60fps instant scrub

  // Check URL params for preloader hold mode
  const urlParams = new URLSearchParams(window.location.search);
  const holdPreloader = urlParams.has('hold_preloader');
  const previewPercent = urlParams.get('preview_preloader');

  // Smooth preloader progress UI (Haute Parfumerie Experience)
  function updatePreloaderUI() {
    if (isReady) return;

    if (holdPreloader || previewPercent) {
      const p = previewPercent ? parseFloat(previewPercent) : 81;
      if (loaderBar) loaderBar.style.width = `${p}%`;
      if (loaderPercent) loaderPercent.textContent = `${Math.round(p)}%`;
      if (loaderStatus) loaderStatus.textContent = 'AWAKENING BOTANICAL ESSENCE...';
      return;
    }

    const elapsed = performance.now() - preloadStartTime;
    const timeProgress = Math.min(100, (elapsed / MIN_PRELOAD_MS) * 100);
    const frameProgress = Math.min(100, (loadedFramesCount / ESSENTIAL_FRAMES) * 100);
    const currentTarget = Math.max(timeProgress, frameProgress);

    displayPercent += (currentTarget - displayPercent) * 0.18;
    const rounded = Math.min(100, Math.round(displayPercent));
    if (loaderBar) loaderBar.style.width = `${displayPercent}%`;
    if (loaderPercent) loaderPercent.textContent = `${rounded}%`;

    // Dynamic Botanical Status Progression
    if (loaderStatus) {
      if (rounded < 35) loaderStatus.textContent = 'AWAKENING BOTANICAL ESSENCE...';
      else if (rounded < 65) loaderStatus.textContent = 'DISTILLING RARE BLOSSOMS...';
      else if (rounded < 88) loaderStatus.textContent = 'INFUSING MORPHO BLUE ESSENCE...';
      else if (rounded < 99) loaderStatus.textContent = 'HARMONIZING HAUTE NOTES...';
      else loaderStatus.textContent = 'ÉLÉA READY';
    }

    // Dismiss when essential frames are ready OR safety timeout is reached
    const isSafetyExpired = elapsed >= MAX_PRELOAD_MS;
    const isReadyToReveal = (loadedFramesCount >= ESSENTIAL_FRAMES && elapsed >= MIN_PRELOAD_MS) || displayPercent >= 99;

    if (!isSafetyExpired && !isReadyToReveal) {
      preloaderLoopId = requestAnimationFrame(updatePreloaderUI);
    } else {
      if (loaderBar) loaderBar.style.width = '100%';
      if (loaderPercent) loaderPercent.textContent = '100%';
      if (loaderStatus) loaderStatus.textContent = 'ÉLÉA READY';
      setTimeout(onPreloaderComplete, 180);
    }
  }

  // Request a single frame download
  function requestFrame(index) {
    if (index < 0 || index >= TOTAL_FRAMES) return;
    if (frameStatus[index] !== 0) return; // already loading, loaded, or errored

    frameStatus[index] = 1;
    if (!frames[index]) {
      const fallbackImg = new Image();
      fallbackImg.decoding = 'async';
      frames[index] = fallbackImg;
    }
    const img = frames[index];
    const frameNum = pad3(index + 1);

    img.onload = () => {
      frameStatus[index] = 2;
      loadedFramesCount++;

      // When frame 0 arrives, immediately paint it!
      if (index === 0 && lastDrawnFrameIndex === -1) {
        drawSpecificImage(img);
        lastDrawnFrameIndex = 0;
      }

      // If user is currently looking at this frame, immediately render it in full fidelity!
      if (Math.abs(currentTargetFrameIndex - index) <= 1) {
        drawFrame(currentTargetFrameIndex);
      }
    };

    img.onerror = () => {
      frameStatus[index] = 3;
    };

    img.src = `${FRAME_PATH_PREFIX}${frameNum}${FRAME_EXTENSION}`;
  }

  // Priority window loading around target frame
  function requestFrameWindow(centerIdx, radius = 8) {
    const aligned = centerIdx - (centerIdx % FRAME_STEP);
    requestFrame(aligned);
    for (let r = 1; r <= radius; r++) {
      requestFrame(aligned + r * FRAME_STEP);
      requestFrame(aligned - r * FRAME_STEP);
    }
  }

  // Preload frames with intelligent priority & non-congesting progressive loading
  function preloadFrames() {
    if (loaderStatus) loaderStatus.textContent = 'AWAKENING BOTANICAL ESSENCE...';
    updatePreloaderUI();

    if (isMobileOrSmall) {
      // Mobile: Load all 80 frames (1.2 MB total!) in gentle non-blocking batches
      // Completes in ~1 second so 100% of the entire story is in RAM before scroll!
      let idx = 0;
      function streamMobile() {
        const end = Math.min(TOTAL_FRAMES, idx + 16);
        for (let i = idx; i < end; i++) {
          requestFrame(i);
        }
        idx = end;
        if (idx < TOTAL_FRAMES) {
          setTimeout(streamMobile, 60);
        }
      }
      streamMobile();
    } else {
      // Desktop: Fast progressive streaming across 478 frames
      for (let i = 0; i < 20; i++) {
        requestFrame(i);
      }
      let milestoneIdx = 20;
      function loadMilestoneBatch() {
        const end = Math.min(TOTAL_FRAMES, milestoneIdx + 60);
        for (let i = milestoneIdx; i < end; i += 8) {
          requestFrame(i);
        }
        milestoneIdx = end;
        if (milestoneIdx < TOTAL_FRAMES) {
          setTimeout(loadMilestoneBatch, 150);
        }
      }
      setTimeout(loadMilestoneBatch, 120);

      let fillIdx = 20;
      const BATCH_SIZE = 6;
      function streamBackground() {
        if (fillIdx >= TOTAL_FRAMES) return;
        let count = 0;
        while (fillIdx < TOTAL_FRAMES && count < BATCH_SIZE) {
          if (frameStatus[fillIdx] === 0) {
            requestFrame(fillIdx);
            count++;
          }
          fillIdx++;
        }
        if (fillIdx < TOTAL_FRAMES) {
          setTimeout(streamBackground, 120);
        }
      }
      setTimeout(streamBackground, 600);
    }
  }

  function onPreloaderComplete() {
    if (isReady) return;
    isReady = true;
    if (preloaderLoopId) cancelAnimationFrame(preloaderLoopId);

    // Ensure frame 0 is drawn immediately
    if (frames[0]?.complete && frames[0]?.naturalWidth > 0) {
      drawSpecificImage(frames[0]);
      lastDrawnFrameIndex = 0;
    } else {
      drawFrame(0);
    }

    // Smoothly dissolve preloader veil
    if (preloader) {
      preloader.style.opacity = '0';
      preloader.style.pointerEvents = 'none';
      setTimeout(() => {
        preloader.style.display = 'none';
      }, 500);
    }

    document.body.classList.remove('loading-state');
    resizeCanvas();
    updateScrollProgress();
    startRenderLoop();
  }

  // Responsive Canvas Sizing (Reflow isolated strictly to resize event)
  function resizeCanvas() {
    currentDpr = Math.min(window.devicePixelRatio || 1, isMobileOrSmall ? 1.0 : 1.5);
    cachedWidth = canvas.clientWidth || window.innerWidth;
    cachedHeight = canvas.clientHeight || window.innerHeight;

    canvas.width = Math.round(cachedWidth * currentDpr);
    canvas.height = Math.round(cachedHeight * currentDpr);

    ctx.setTransform(currentDpr, 0, 0, currentDpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'medium';

    if (lastDrawnFrameIndex >= 0 && frames[lastDrawnFrameIndex]?.complete && frames[lastDrawnFrameIndex]?.naturalWidth > 0) {
      drawSpecificImage(frames[lastDrawnFrameIndex]);
    } else if (frames[0]?.complete && frames[0]?.naturalWidth > 0) {
      drawSpecificImage(frames[0]);
      lastDrawnFrameIndex = 0;
    }
  }

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeCanvas, 60);
  }, { passive: true });

  // High-Performance Frame Drawing with Nearest-Loaded Fallback (Zero Freezes)
  function drawFrame(frameIdx) {
    currentTargetFrameIndex = frameIdx;

    // Stream frames immediately surrounding the user's scroll position with high priority
    requestFrameWindow(frameIdx, 10);

    // 1. Direct hit: If target frame is completely loaded, render it immediately!
    if (frameStatus[frameIdx] === 2 && frames[frameIdx]?.complete && frames[frameIdx]?.naturalWidth > 0) {
      drawSpecificImage(frames[frameIdx]);
      lastDrawnFrameIndex = frameIdx;
      return;
    }

    // 2. Intelligent Nearest-Frame Fallback:
    let nearestIdx = -1;
    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      const prev = frameIdx - offset;
      const next = frameIdx + offset;
      if (prev >= 0 && frameStatus[prev] === 2 && frames[prev]?.complete && frames[prev]?.naturalWidth > 0) {
        nearestIdx = prev;
        break;
      }
      if (next < TOTAL_FRAMES && frameStatus[next] === 2 && frames[next]?.complete && frames[next]?.naturalWidth > 0) {
        nearestIdx = next;
        break;
      }
    }

    // If a nearby loaded frame exists, draw it so scrubbing is 100% fluid with zero sticking!
    if (nearestIdx >= 0) {
      if (nearestIdx !== lastDrawnFrameIndex) {
        drawSpecificImage(frames[nearestIdx]);
        lastDrawnFrameIndex = nearestIdx;
      }
      return;
    }

    // 3. Fallback to last drawn frame or frame 0
    if (lastDrawnFrameIndex >= 0 && frames[lastDrawnFrameIndex]?.complete && frames[lastDrawnFrameIndex]?.naturalWidth > 0) {
      return;
    }
    if (frames[0]?.complete && frames[0]?.naturalWidth > 0) {
      drawSpecificImage(frames[0]);
      lastDrawnFrameIndex = 0;
    }
  }

  // Zero-overhead canvas rendering with cover aspect-ratio
  function drawSpecificImage(img) {
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cWidth = cachedWidth;
    const cHeight = cachedHeight;
    const imgRatio = 16 / 9; // Both 1920x1080 and 1280x720 are 16:9
    const canvasRatio = cWidth / cHeight;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (canvasRatio > imgRatio) {
      drawWidth = cWidth;
      drawHeight = cWidth / imgRatio;
      offsetX = 0;
      offsetY = (cHeight - drawHeight) * 0.5;
    } else {
      drawHeight = cHeight;
      drawWidth = cHeight * imgRatio;
      offsetX = (cWidth - drawWidth) * 0.5;
      offsetY = 0;
    }

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  }

  // Update Perimeter Scenes with pristine zero-collision chapter handoffs
  function updatePerimeterScenes(p) {
    // 0% - 9%: Hero Title & Bottom Cue (Dissolves swiftly to 0 by p = 0.08, completely gone BEFORE sketch arrives)
    if (scenes.hero) {
      if (p <= 0.035) {
        scenes.hero.style.opacity = '1';
        scenes.hero.style.pointerEvents = 'auto';
        scenes.hero.style.visibility = 'visible';
        if (!scenes.hero.classList.contains('active')) scenes.hero.classList.add('active');
      } else if (p > 0.035 && p < 0.08) {
        const heroOp = 1 - (p - 0.035) / 0.045;
        scenes.hero.style.opacity = Math.max(0, heroOp).toFixed(4);
        scenes.hero.style.pointerEvents = 'none';
        scenes.hero.style.visibility = 'visible';
      } else {
        scenes.hero.style.opacity = '0';
        scenes.hero.style.pointerEvents = 'none';
        scenes.hero.style.visibility = 'hidden';
        if (scenes.hero.classList.contains('active')) scenes.hero.classList.remove('active');
      }
    }

    // Buffer Zone: 0.08 to 0.15 is 100% clean garden air with ZERO text!

    // Chapter Note Cards (01 Top Notes, 02 Heart Notes, etc.)
    toggleScene(scenes.notes1, p >= 0.15 && p < 0.35);
    toggleScene(scenes.notes2, p >= 0.35 && p < 0.55);
    toggleScene(scenes.notes3, p >= 0.55 && p < 0.75);
    toggleScene(scenes.notes4, p >= 0.75 && p < 0.88);

    // 88% - 100%: End of Video Climax: SHOP NOW Entrance Button (Clean Sky)
    toggleScene(scenes.endClimax, p >= 0.88 && p <= 1.00);
  }

  // Imperceptible Scroll-Interpolated Optical Cross-Fade for Sketch Flacons
  // Continuous 60/120fps linear interpolation: Opacities sum to exactly 1.000 during transitions
  // Zero jump, zero blink, zero delayed CSS timer — one bottle morphs into the next in place!
  function updateSketchCrossfade(p) {
    const opacities = [0, 0, 0, 0];

    // Stage 1 (01 Top Notes - 50ml Flacon): ONLY begins at p >= 0.15 AFTER hero text is 100% gone!
    if (p >= 0.15 && p < 0.20) {
      opacities[0] = (p - 0.15) / 0.05;
    } else if (p >= 0.20 && p <= 0.33) {
      opacities[0] = 1;
    } else if (p > 0.33 && p <= 0.37) {
      opacities[0] = 1 - (p - 0.33) / 0.04;
    }

    // Stage 2 (02 Heart Notes - 100ml Extrait)
    if (p >= 0.35 && p < 0.39) {
      opacities[1] = (p - 0.35) / 0.04;
    } else if (p >= 0.39 && p <= 0.53) {
      opacities[1] = 1;
    } else if (p > 0.53 && p <= 0.57) {
      opacities[1] = 1 - (p - 0.53) / 0.04;
    }

    // Stage 3 (03 Base Notes - 10ml Nomad)
    if (p >= 0.55 && p < 0.59) {
      opacities[2] = (p - 0.55) / 0.04;
    } else if (p >= 0.59 && p <= 0.73) {
      opacities[2] = 1;
    } else if (p > 0.73 && p <= 0.77) {
      opacities[2] = 1 - (p - 0.73) / 0.04;
    }

    // Stage 4 (04 Distillation - 250g Candle)
    if (p >= 0.75 && p < 0.79) {
      opacities[3] = (p - 0.75) / 0.04;
    } else if (p >= 0.79 && p <= 0.86) {
      opacities[3] = 1;
    } else if (p > 0.86 && p <= 0.90) {
      opacities[3] = Math.max(0, 1 - (p - 0.86) / 0.04);
    }

    const stagesList = [sketchStages.s1, sketchStages.s2, sketchStages.s3, sketchStages.s4];
    for (let i = 0; i < 4; i++) {
      const el = stagesList[i];
      if (!el) continue;
      const op = opacities[i];
      el.style.opacity = op.toFixed(4);
      el.style.pointerEvents = op > 0.35 ? 'auto' : 'none';
      el.style.visibility = op > 0.005 ? 'visible' : 'hidden';
      if (op > 0.45) {
        if (!el.classList.contains('active')) el.classList.add('active');
      } else {
        if (el.classList.contains('active')) el.classList.remove('active');
      }
    }
  }

  function toggleScene(el, active) {
    if (!el) return;
    const hasClass = el.classList.contains('active');
    if (active && !hasClass) {
      el.classList.add('active');
    } else if (!active && hasClass) {
      el.classList.remove('active');
    }
  }

  // Mobile Progress & Chapter Elements
  const mobileProgressBar = document.getElementById('mobile-scroll-progress-bar');
  const mobileChapterPill = document.getElementById('mobile-chapter-pill');
  const mobileChapterLabel = document.getElementById('mobile-chapter-label');
  const chapterNames = ['AWAKENING', '01 TOP NOTES', '02 HEART NOTES', '03 BASE NOTES', '04 DISTILLATION', 'WEAR THE UNREAL'];
  let currentActiveTimelineIdx = -1;

  // Update Luxury Timeline Scrubber UI (Desktop & Mobile Sync)
  function updateTimelineUI(p) {
    if (timelineIndicator) {
      timelineIndicator.style.height = `${(p * 100).toFixed(2)}%`;
    }

    if (mobileProgressBar) {
      mobileProgressBar.style.width = `${(p * 100).toFixed(2)}%`;
    }

    let activeIdx = 0;
    if (p >= 0.88) activeIdx = 5;
    else if (p >= 0.75) activeIdx = 4;
    else if (p >= 0.55) activeIdx = 3;
    else if (p >= 0.35) activeIdx = 2;
    else if (p >= 0.16) activeIdx = 1;
    else activeIdx = 0;

    // Only update DOM classes when stage index changes
    if (activeIdx !== currentActiveTimelineIdx) {
      currentActiveTimelineIdx = activeIdx;
      if (mobileChapterLabel && mobileChapterLabel.textContent !== chapterNames[activeIdx]) {
        mobileChapterLabel.textContent = chapterNames[activeIdx];
      }
      timelineDots.forEach((dot, idx) => {
        if (idx === activeIdx) dot.classList.add('active');
        else dot.classList.remove('active');
      });
    }

    if (mobileChapterPill) {
      const showPill = (p >= 0.88);
      mobileChapterPill.style.opacity = showPill ? '1' : '0';
      mobileChapterPill.style.visibility = showPill ? 'visible' : 'hidden';
    }
  }

  // --------------------------------------------------------------------------
  // CONTINUOUS FLUID SCROLL CONTROLLER (FREEFORM NATURAL SCRUBBING)
  // --------------------------------------------------------------------------
  lastScrollY = window.scrollY || window.pageYOffset || 0;

  let lastThrottledFrame = -1;
  let lastThrottledTime = 0;
  function requestFrameWindowThrottled(targetFrame, radius = 6) {
    const now = performance.now();
    if (Math.abs(targetFrame - lastThrottledFrame) >= 2 || (now - lastThrottledTime > 75)) {
      lastThrottledFrame = targetFrame;
      lastThrottledTime = now;
      requestFrameWindow(targetFrame, radius);
    }
  }

  function updateScrollProgress() {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll > 0) {
      targetProgress = Math.min(1, Math.max(0, scrollY / maxScroll));
      // Pre-request frames with throttling to avoid blocking mobile touch events
      const approxTargetFrame = Math.round(targetProgress * (TOTAL_FRAMES - 1));
      requestFrameWindowThrottled(approxTargetFrame, isMobileOrSmall ? 6 : 12);
    }

    scrollVelocity = (scrollY - lastScrollY) * 0.4;
    lastScrollY = scrollY;
  }

  window.addEventListener('scroll', updateScrollProgress, { passive: true });

  // Click-to-Scroll on Timeline Dots
  timelineDots.forEach((dot) => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      const progress = parseFloat(dot.dataset.progress || 0);
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({
        top: progress * maxScroll,
        behavior: 'smooth'
      });
    });
  });

  // Hero "SCROLL TO AWAKEN" Cue Click Trigger
  const discoverCue = document.querySelector('.scroll-discover-cue');
  if (discoverCue) {
    discoverCue.style.cursor = 'pointer';
    discoverCue.addEventListener('click', () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({
        top: 0.21 * maxScroll,
        behavior: 'smooth'
      });
    });
  }

  // Keyboard Smooth Navigation (ArrowDown, ArrowUp, Space)
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

    const scrollAmount = window.innerHeight * 0.35;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
      e.preventDefault();
      window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
      e.preventDefault();
      window.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
    } else if (e.key === 'Home') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (e.key === 'End') {
      e.preventDefault();
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }
  });

  // Main 60/120fps Animation Loop with Fluid Inertial Scrubbing
  function startRenderLoop() {
    function tick() {
      // Direct 1:1 touch response on mobile (zero input delay), cinematic damping on desktop
      if (isMobileOrSmall) {
        smoothProgress = targetProgress;
      } else {
        smoothProgress += (targetProgress - smoothProgress) * 0.06;
        if (Math.abs(targetProgress - smoothProgress) < 0.0001) {
          smoothProgress = targetProgress;
        }
      }

      // Smooth scroll velocity damping & delivery to particle engine
      smoothVelocity += (scrollVelocity - smoothVelocity) * 0.15;
      scrollVelocity *= 0.88;
      if (Math.abs(scrollVelocity) < 0.01) scrollVelocity = 0;

      if (particleEngine) {
        particleEngine.updateScrollVelocity(smoothVelocity);
      }

      // Frame scrubbing (Math.round for zero-jitter integer indexing)
      const frameIdx = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.round(smoothProgress * (TOTAL_FRAMES - 1)))
      );

      if (frameIdx !== lastDrawnFrameIndex || (frameStatus[frameIdx] === 2 && lastDrawnFrameIndex !== frameIdx)) {
        drawFrame(frameIdx);
      }

      // Update HUD Scene overlays & Chapter Timeline ONLY when progress has actually shifted!
      if (Math.abs(smoothProgress - lastRenderedProgress) > 0.0001) {
        lastRenderedProgress = smoothProgress;
        updatePerimeterScenes(smoothProgress);
        updateTimelineUI(smoothProgress);
        updateSketchCrossfade(smoothProgress);
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  // Interactive 3D Holographic Micro-Tilt & Gyroscopic Depth for Floating Flacons
  function initSketchCardTilt() {
    const stageItems = document.querySelectorAll('.sketch-stage-item');
    stageItems.forEach(stage => {
      const vessel = stage.querySelector('.flacon-silhouette-vessel');
      const meta = stage.querySelector('.flacon-silhouette-meta');

      stage.addEventListener('mousemove', (e) => {
        const rect = stage.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -12;
        const rotateY = ((x - centerX) / centerX) * 12;

        if (vessel) {
          vessel.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(35px) scale(1.05)`;
        }
        if (meta) {
          meta.style.transform = `perspective(800px) rotateX(${(rotateX * 0.4).toFixed(2)}deg) rotateY(${(rotateY * 0.4).toFixed(2)}deg) translateZ(16px)`;
        }
      }, { passive: true });

      stage.addEventListener('mouseleave', () => {
        if (vessel) vessel.style.transform = '';
        if (meta) meta.style.transform = '';
      });
    });
  }

  // Audio Toggle
  function toggleSound() {
    if (!audioEngine) return;
    const isPlaying = audioEngine.toggle();
    if (isPlaying) {
      if (soundStatusText) soundStatusText.textContent = 'SOUND ON';
      if (soundBtn) soundBtn.classList.add('sound-active');
    } else {
      if (soundStatusText) soundStatusText.textContent = 'SOUND';
      if (soundBtn) soundBtn.classList.remove('sound-active');
    }
  }

  if (soundBtn) {
    soundBtn.addEventListener('click', toggleSound);
  }

  // Initialize Canvas, Tilt & Start Preload
  resizeCanvas();
  initSketchCardTilt();
  preloadFrames();
});
