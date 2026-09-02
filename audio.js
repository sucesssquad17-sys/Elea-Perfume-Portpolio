/**
 * ÉLÉA — Pure Luxury Soundscape Engine
 * Clean, Silent-by-Default Audio with ZERO Scroll Volume Modulation (Prevents DAC Jitter / Buzzing)
 */

class AudioEngine {
  constructor() {
    this.audioElement = document.getElementById('soundtrack-audio');
    this.isPlaying = false;
    this.fadeTimer = null;
    
    if (this.audioElement) {
      this.audioElement.volume = 0;
      this.audioElement.loop = true;
      this.audioElement.pause();
    }
  }

  toggle() {
    if (!this.audioElement) return false;

    this.isPlaying = !this.isPlaying;

    if (this.isPlaying) {
      this.audioElement.volume = 0;
      this.audioElement.play().then(() => {
        this.fadeVolume(0.30, 450);
      }).catch(e => console.log('Playback:', e));
    } else {
      this.fadeVolume(0, 350, () => {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      });
    }

    return this.isPlaying;
  }

  fadeVolume(targetVol, durationMs, onComplete) {
    if (this.fadeTimer) clearInterval(this.fadeTimer);
    const startVol = this.audioElement.volume;
    const startTime = performance.now();
    
    this.fadeTimer = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      this.audioElement.volume = Math.max(0, Math.min(1, startVol + (targetVol - startVol) * progress));
      if (progress >= 1) {
        clearInterval(this.fadeTimer);
        this.fadeTimer = null;
        if (onComplete) onComplete();
      }
    }, 25);
  }

  // Strictly empty no-op: NEVER touch audioElement.volume during scroll (prevents hardware DAC buzzing)
  updateScrollProgress(progress) {
    // No-op
  }
}

window.AudioEngine = AudioEngine;
