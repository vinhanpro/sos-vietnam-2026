/**
 * SOS VIỆT NAM 2026 — Tactical Cosmic Space Ambient Engine
 * Hiệu ứng động vũ trụ, sao lấp lánh, sóng cực quang khí quyển & radar quét quỹ đạo
 * Tối ưu hóa GPU 60fps, tự động tạm dừng khi ở màn hình bản đồ để tiết kiệm CPU/pin.
 */
(function() {
  'use strict';

  class TacticalCosmicAmbient {
    constructor() {
      this.canvases = [];
      this.animFrameId = null;
      this.isRunning = false;
      this.stars = [];
      this.photons = [];
      this.numStars = 75;
      this.numPhotons = 10;
      this.init();
    }

    init() {
      // Find all starfield canvases
      const els = document.querySelectorAll('.tactical-starfield-canvas');
      els.forEach(el => this.initCanvas(el));

      if (this.canvases.length === 0) return;

      this.createParticles();
      this.bindEvents();
      this.start();
    }

    initCanvas(canvas) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const obj = { canvas, ctx, width: 0, height: 0, dpr: window.devicePixelRatio || 1 };
      this.resizeCanvas(obj);
      this.canvases.push(obj);
    }

    resizeCanvas(obj) {
      const rect = obj.canvas.parentElement ? obj.canvas.parentElement.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
      const w = Math.max(rect.width || window.innerWidth, 320);
      const h = Math.max(rect.height || window.innerHeight, 480);
      
      obj.width = w;
      obj.height = h;
      obj.canvas.width = w * obj.dpr;
      obj.canvas.height = h * obj.dpr;
      obj.ctx.scale(obj.dpr, obj.dpr);
    }

    createParticles() {
      this.stars = [];
      for (let i = 0; i < this.numStars; i++) {
        this.stars.push({
          x: Math.random(),
          // Concentrated in the upper 55% of the screen where space is visible
          y: Math.random() * 0.52,
          radius: Math.random() * 1.6 + 0.4,
          baseAlpha: Math.random() * 0.5 + 0.25,
          twinkleSpeed: Math.random() * 0.04 + 0.015,
          phase: Math.random() * Math.PI * 2,
          hue: Math.random() > 0.8 ? 195 : (Math.random() > 0.5 ? 210 : 0) // Ice blue, navy, or pure white
        });
      }

      this.photons = [];
      for (let j = 0; j < this.numPhotons; j++) {
        this.photons.push({
          x: Math.random(),
          y: Math.random() * 0.45,
          vx: (Math.random() * 0.0004 + 0.0001) * (Math.random() > 0.5 ? 1 : -1),
          vy: (Math.random() * 0.0003 + 0.0001),
          length: Math.random() * 25 + 10,
          alpha: Math.random() * 0.4 + 0.2,
          speed: Math.random() * 0.0008 + 0.0003
        });
      }
    }

    bindEvents() {
      window.addEventListener('resize', () => {
        this.canvases.forEach(obj => this.resizeCanvas(obj));
      }, { passive: true });

      // Pause when document is hidden
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.stop();
        } else {
          this.start();
        }
      });
    }

    start() {
      if (this.isRunning) return;
      this.isRunning = true;
      this.loop();
    }

    stop() {
      this.isRunning = false;
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }
    }

    loop() {
      if (!this.isRunning) return;

      // Check if at least one canvas is visible
      let anyVisible = false;
      for (const obj of this.canvases) {
        if (obj.canvas.offsetParent !== null) {
          anyVisible = true;
          this.draw(obj);
        }
      }

      this.animFrameId = requestAnimationFrame(() => this.loop());
    }

    draw(obj) {
      const { ctx, width, height } = obj;
      ctx.clearRect(0, 0, width, height);

      const now = performance.now() * 0.001;

      // 1. Draw Twinkling Stars
      for (const s of this.stars) {
        const x = s.x * width;
        const y = s.y * height;
        const alpha = s.baseAlpha + Math.sin(now * s.twinkleSpeed * 10 + s.phase) * 0.35;
        const clampedAlpha = Math.max(0.1, Math.min(1, alpha));

        ctx.beginPath();
        ctx.arc(x, y, s.radius, 0, Math.PI * 2);
        if (s.hue === 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${clampedAlpha})`;
        } else {
          ctx.fillStyle = `hsla(${s.hue}, 90%, 75%, ${clampedAlpha})`;
        }
        ctx.fill();

        // Subtle glow halo for larger stars
        if (s.radius > 1.2 && clampedAlpha > 0.6) {
          ctx.beginPath();
          ctx.arc(x, y, s.radius * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(56, 189, 248, ${clampedAlpha * 0.18})`;
          ctx.fill();
        }
      }

      // 2. Draw Drifting Cosmic Micro-Photons
      for (const p of this.photons) {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around space boundaries
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y > 0.52) p.y = 0;
        if (p.y < 0) p.y = 0.52;

        const px = p.x * width;
        const py = p.y * height;

        const grad = ctx.createLinearGradient(px - p.vx * 1000, py - p.vy * 1000, px, py);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        grad.addColorStop(1, `rgba(186, 230, 253, ${p.alpha})`);

        ctx.beginPath();
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.moveTo(px - p.vx * 200, py - p.vy * 200);
        ctx.lineTo(px, py);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(px, py, 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 1.5})`;
        ctx.fill();
      }
    }
  }

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.tacticalCosmic = new TacticalCosmicAmbient();
    });
  } else {
    window.tacticalCosmic = new TacticalCosmicAmbient();
  }
})();
