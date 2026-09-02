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

  // Configuration (1080p Full HD Cinema Sequence)
  const TOTAL_FRAMES = 478;
  const FRAME_PATH_PREFIX = 'public/frames_hd/frame_';
  const FRAME_EXTENSION = '.webp';

  const frames = [];
  let loadedFramesCount = 0;
  let targetProgress = 0;
  let smoothProgress = 0;
  let currentFrameIndex = -1;
  let isReady = false;

  // Cached viewport dimensions to completely eliminate forced reflows during RAF loop
  let cachedWidth = window.innerWidth;
  let cachedHeight = window.innerHeight;
  let currentDpr = 1;

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
  let targetPercent = 0;
  let preloaderLoopId = null;
  const preloadStartTime = performance.now();
  const MIN_PRELOAD_MS = 1600; // 1.6s quick luxury reveal
  const MAX_PRELOAD_MS = 2500; // Hard safety timeout: guaranteed to never get stuck!
  const ESSENTIAL_FRAMES = 15; // Only 15 frames needed to reveal site immediately

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

    // Dismiss when essential frames are ready OR safety timeout of 2.5s is reached
    const isSafetyExpired = elapsed >= MAX_PRELOAD_MS;
    const isReadyToReveal = (loadedFramesCount >= ESSENTIAL_FRAMES && elapsed >= MIN_PRELOAD_MS) || displayPercent >= 99;

    if (!isSafetyExpired && !isReadyToReveal) {
      preloaderLoopId = requestAnimationFrame(updatePreloaderUI);
    } else {
      if (loaderBar) loaderBar.style.width = '100%';
      if (loaderPercent) loaderPercent.textContent = '100%';
      if (loaderStatus) loaderStatus.textContent = 'ÉLÉA READY';
      setTimeout(onPreloaderComplete, 200);
    }
  }

  // Preload frames asynchronously with progressive non-blocking decoding
  function preloadFrames() {
    if (loaderStatus) loaderStatus.textContent = 'AWAKENING BOTANICAL ESSENCE...';
    updatePreloaderUI();

    // Initialize all 478 image objects in array
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.decoding = 'async';
      frames.push(img);
    }

    // Load initial essential batch (1-35) immediately
    loadFrameBatch(1, 35);

    // Stream remaining frames in fast successive micro-batches
    let nextStart = 36;
    const BATCH_SIZE = 25;

    function loadNextBatches() {
      if (nextStart > TOTAL_FRAMES) return;
      const end = Math.min(TOTAL_FRAMES, nextStart + BATCH_SIZE - 1);
      loadFrameBatch(nextStart, end);
      nextStart = end + 1;
      setTimeout(loadNextBatches, 30);
    }

    setTimeout(loadNextBatches, 60);
  }

  function loadFrameBatch(start, end) {
    for (let i = start; i <= end; i++) {
      const img = frames[i - 1];
      const frameNum = pad3(i);

      img.onload = () => {
        loadedFramesCount++;
        if (loadedFramesCount === 1) {
          resizeCanvas();
          drawFrame(0);
        }
      };

      img.onerror = () => {
        img.onerror = () => { loadedFramesCount++; };
        img.src = `public/frames_opt/frame_${frameNum}.webp`;
        loadedFramesCount++;
      };

      img.src = `${FRAME_PATH_PREFIX}${frameNum}${FRAME_EXTENSION}`;
    }
  }

  function onPreloaderComplete() {
    if (isReady) return;
    isReady = true;
    if (preloaderLoopId) cancelAnimationFrame(preloaderLoopId);

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
    drawFrame(0);
    startRenderLoop();
    initAudioInteraction();
  }

  // Responsive Canvas Sizing (Reflow isolated strictly to resize event)
  function resizeCanvas() {
    currentDpr = Math.min(window.devicePixelRatio || 1, 2);
    cachedWidth = canvas.clientWidth || window.innerWidth;
    cachedHeight = canvas.clientHeight || window.innerHeight;

    canvas.width = Math.round(cachedWidth * currentDpr);
    canvas.height = Math.round(cachedHeight * currentDpr);

    ctx.setTransform(currentDpr, 0, 0, currentDpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (currentFrameIndex >= 0) {
      drawFrame(currentFrameIndex);
    }
  }

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeCanvas, 60);
  }, { passive: true });

  // High-Performance Frame Drawing (Zero forced reflow, cover aspect ratio)
  function drawFrame(frameIdx) {
    const img = frames[frameIdx];
    if (!img || !img.complete) return;

    const cWidth = cachedWidth;
    const cHeight = cachedHeight;
    const imgRatio = 1920 / 1080;
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

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
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

    const stages = [sketchStages.s1, sketchStages.s2, sketchStages.s3, sketchStages.s4];
    for (let i = 0; i < 4; i++) {
      const el = stages[i];
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

    // Never show floating chapter pill during Hero Awakening (p < 0.10) to prevent overlapping the ÉLÉA brand title
    if (mobileChapterPill) {
      const showPill = (p >= 0.88); // Only active at final climax; during chapters, sketch and notes cards provide the labels
      mobileChapterPill.style.opacity = showPill ? '1' : '0';
      mobileChapterPill.style.visibility = showPill ? 'visible' : 'hidden';
    }

    if (mobileChapterLabel && mobileChapterLabel.textContent !== chapterNames[activeIdx]) {
      mobileChapterLabel.textContent = chapterNames[activeIdx];
    }

    timelineDots.forEach((dot, idx) => {
      const isCurrent = idx === activeIdx;
      const hasClass = dot.classList.contains('active');
      if (isCurrent && !hasClass) {
        dot.classList.add('active');
      } else if (!isCurrent && hasClass) {
        dot.classList.remove('active');
      }
    });
  }

  // --------------------------------------------------------------------------
  // CONTINUOUS FLUID SCROLL CONTROLLER (FREEFORM NATURAL SCRUBBING)
  // --------------------------------------------------------------------------
  lastScrollY = window.scrollY || window.pageYOffset || 0;

  function updateScrollProgress() {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll > 0) {
      targetProgress = Math.min(1, Math.max(0, scrollY / maxScroll));
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
      // Luxury fluid lerp: silky smooth slow-motion interpolation
      smoothProgress += (targetProgress - smoothProgress) * 0.055;
      if (Math.abs(targetProgress - smoothProgress) < 0.0001) {
        smoothProgress = targetProgress;
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

      if (frameIdx !== currentFrameIndex) {
        currentFrameIndex = frameIdx;
        drawFrame(currentFrameIndex);
      }

      // Update HUD Scene overlays & Chapter Timeline
      updatePerimeterScenes(smoothProgress);
      updateTimelineUI(smoothProgress);
      updateSketchCrossfade(smoothProgress);

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
