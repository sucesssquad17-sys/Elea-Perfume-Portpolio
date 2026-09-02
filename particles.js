/**
 * ÉLÉA — Botanical Pollen & Golden Light Dust Engine
 * Dreamy atmospheric floating spores reacting to 0.60x scroll velocity and mouse drift
 */

class ParticleEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.particles = [];
    const isMobile = (window.innerWidth <= 1024) || ('ontouchstart' in window);
    this.particleCount = isMobile ? 12 : 50;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    
    this.mouse = { x: this.width / 2, y: this.height / 2, targetX: this.width / 2, targetY: this.height / 2 };
    this.scrollVelocity = 0;
    
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = e.clientX;
      this.mouse.targetY = e.clientY;
    });

    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push(this.createParticle(true));
    }

    this.animate();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  createParticle(randomY = false) {
    const depth = Math.random(); // 0 to 1
    // Luxury botanical color palette: Soft Warm Gold, Rose Quartz, Botanical Sage
    const colors = [
      '194, 159, 104', // Champagne Gold
      '220, 180, 190', // Rose Quartz
      '140, 175, 150', // Dewy Sage
      '245, 230, 210'  // Warm Ivory Sunlight
    ];
    const pickedColor = colors[Math.floor(Math.random() * colors.length)];

    return {
      x: Math.random() * this.width,
      y: randomY ? Math.random() * this.height : this.height + 20,
      size: (1 - depth * 0.6) * 3.2 + 0.8,
      depth: depth,
      speedX: (Math.random() - 0.5) * 0.3 * (1 - depth * 0.5),
      speedY: -(Math.random() * 0.4 + 0.15) * (1 - depth * 0.4),
      opacity: (1 - depth * 0.5) * 0.45 + 0.1,
      baseOpacity: (1 - depth * 0.5) * 0.45 + 0.1,
      color: pickedColor,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.008
    };
  }

  updateScrollVelocity(velocity) {
    // Clamp velocity to prevent extreme bursts
    this.scrollVelocity = Math.max(-18, Math.min(18, velocity));
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Gentle mouse interpolation
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.04;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.04;

    const mouseOffsetX = (this.mouse.x - this.width / 2) * 0.00018;

    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.pulse += p.pulseSpeed;

      // Vertical movement influenced by natural buoyancy + dynamic scroll velocity
      const velocityInfluence = this.scrollVelocity * (1 - p.depth * 0.45) * 0.12;
      p.y += p.speedY - velocityInfluence;
      p.x += p.speedX + (mouseOffsetX * (1 - p.depth) * 45);

      // Pulse opacity
      p.opacity = p.baseOpacity * (0.75 + 0.25 * Math.sin(p.pulse));

      // Reset when particle drifts off screen
      if (p.y < -30) {
        this.particles[i] = this.createParticle(false);
        this.particles[i].y = this.height + 20;
      } else if (p.y > this.height + 30) {
        this.particles[i] = this.createParticle(false);
        this.particles[i].y = -20;
      } else if (p.x < -30) {
        p.x = this.width + 20;
      } else if (p.x > this.width + 30) {
        p.x = -20;
      }

      // Draw soft glowing botanical pollen spore
      this.ctx.beginPath();
      const radius = p.size * 2.8;
      const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
      grad.addColorStop(0, `rgba(${p.color}, ${p.opacity})`);
      grad.addColorStop(0.5, `rgba(${p.color}, ${p.opacity * 0.45})`);
      grad.addColorStop(1, `rgba(${p.color}, 0)`);
      
      this.ctx.fillStyle = grad;
      this.ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
}

window.ParticleEngine = ParticleEngine;
