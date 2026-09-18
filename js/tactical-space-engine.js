/**
 * SOS VIỆT NAM 2026 — Tactical Holographic Command Engine
 * Chuẩn Design DNA, Three.js 3D, GSAP Timeline & Motion Design.
 * 
 * Kiến trúc:
 * 1. Three.js: Trường hạt sao 3 chiều (3D Starfield Parallax), bụi vũ trụ phát quang,
 *    và vành cực quang khí quyển (Atmospheric Cyan Aurora Shader).
 * 2. GSAP: Điều phối dòng thời gian gia tốc máy quay viễn thám (Dolly Zoom),
 *    hiệu ứng thị sai không gian 3D tương tác theo chuột (Parallax Tilt với GSAP quickTo),
 *    và hiệu ứng tương tác đàn hồi cho 4 quả cầu lực lượng trực ban.
 * 3. Design DNA: Giao diện Trung tâm Chỉ huy Khẩn cấp Quốc gia 2026 đẳng cấp, sang trọng,
 *    sắc nét tuyệt đối, không vỡ hạt, tự động thích ứng tiết kiệm pin và tài nguyên GPU.
 */

import * as THREE from '../vendor/three/three.module.min.js';

export class TacticalSpaceEngine {
  constructor(options = {}) {
    this.container = options.container || document.getElementById('cosmicPortalView') || document.body;
    this.canvas = options.canvas || null;
    this.fov = options.fov || 50;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.starfield = null;
    this.auroraMesh = null;
    this.hudGroup = null;

    this.animId = null;
    this.isRunning = false;
    this.isDisposed = false;

    // Mouse Parallax
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.clock = new THREE.Clock();

    this.init();
  }

  init() {
    try {
      this.scene = new THREE.Scene();

      const width = window.innerWidth;
      const height = window.innerHeight;

      this.camera = new THREE.PerspectiveCamera(this.fov, width / height, 0.1, 1000);
      this.camera.position.set(0, 0, 50);

      const rendererParams = {
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      };
      if (this.canvas) {
        rendererParams.canvas = this.canvas;
      }
      this.renderer = new THREE.WebGLRenderer(rendererParams);
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      if (!this.canvas && this.renderer.domElement) {
        this.renderer.domElement.className = 'tactical-3d-space-canvas';
        this.renderer.domElement.style.cssText = 'position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1;';
        this.container.appendChild(this.renderer.domElement);
      }

      // Events
      this.bindEvents();

      // Start Loop
      this.start();

      // GSAP Orchestration
      this.initGsapInteractions();

    } catch (e) {
      console.warn('⚠️ [TacticalSpaceEngine] Fallback:', e);
    }
  }

  bindEvents() {
    this.onResize = () => {
      if (!this.renderer || !this.camera) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };
    window.addEventListener('resize', this.onResize, { passive: true });

    this.onMouseMove = (e) => {
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      this.mouse.targetX = (e.clientX - halfW) / halfW;
      this.mouse.targetY = (e.clientY - halfH) / halfH;
    };
    window.addEventListener('mousemove', this.onMouseMove, { passive: true });

    this.onVisibilityChange = () => {
      if (document.hidden) {
        this.stop();
      } else {
        this.start();
      }
    };
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  initGsapInteractions() {
    if (!window.gsap) return;
    const gsap = window.gsap;

    // 1. Cinematic Dolly Zoom Acceleration on the 4K Satellite View
    const zoomLayer = document.querySelector('.vietnam-zoom-layer');
    if (zoomLayer) {
      gsap.killTweensOf(zoomLayer);
      
      const tl = gsap.timeline({ repeat: -1, yoyo: true });
      tl.to(zoomLayer, {
        scale: 1.18,
        xPercent: -1.2,
        yPercent: -0.8,
        duration: 14,
        ease: 'power2.inOut'
      }).to(zoomLayer, {
        scale: 1.22,
        xPercent: -1.5,
        yPercent: -1.0,
        duration: 8,
        ease: 'sine.inOut'
      });
    }

    // 2. Parallax tilt on mouse move with GSAP
    window.addEventListener('mousemove', (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;

      // Subtle 3D tilt on the entire stage
      const stage = document.querySelector('.cosmic-stage');
      if (stage) {
        gsap.to(stage, {
          rotationY: nx * 3.5,
          rotationX: -ny * 3.5,
          duration: 1.2,
          ease: 'power1.out',
          transformPerspective: 1000
        });
      }
    });

    // 3. Fluid micro-interactions on the 4 unit bubbles
    const bubbles = document.querySelectorAll('.cosmic-bubble-item');
    bubbles.forEach((bubble) => {
      bubble.addEventListener('mouseenter', () => {
        gsap.to(bubble, { scale: 1.12, y: -8, duration: 0.4, ease: 'back.out(2)' });
        // Dim siblings
        bubbles.forEach(sibling => {
          if (sibling !== bubble) {
            gsap.to(sibling, { opacity: 0.65, scale: 0.96, duration: 0.3 });
          }
        });
      });

      bubble.addEventListener('mouseleave', () => {
        gsap.to(bubble, { scale: 1, y: 0, duration: 0.5, ease: 'power2.out' });
        // Restore siblings
        bubbles.forEach(sibling => {
          gsap.to(sibling, { opacity: 1, scale: 1, duration: 0.4 });
        });
      });
    });
  }

  render() {
    if (!this.isRunning || this.isDisposed) return;

    this.animId = requestAnimationFrame(() => this.render());

    const elapsedTime = this.clock.getElapsedTime();

    // Damped mouse parallax for Three.js camera
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.04;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.04;

    this.camera.position.x = this.mouse.x * 3.5;
    this.camera.position.y = -this.mouse.y * 2.5;
    this.camera.lookAt(0, 0, 0);

    // Subtle starfield twinkling and drift
    if (this.starfield) {
      this.starfield.rotation.y = elapsedTime * 0.003;
      this.starfield.rotation.x = this.mouse.y * 0.015;
    }

    this.renderer.render(this.scene, this.camera);
  }

  play3SecondDescentTransition(onComplete) {
    if (!window.gsap) {
      if (typeof onComplete === 'function') onComplete();
      this.stop();
      return;
    }
    const gsap = window.gsap;

    // 1. Instantly hide authGateModal and fade out UI controls on the portal
    const authModal = document.getElementById('authGateModal');
    if (authModal) {
      authModal.style.setProperty('display', 'none', 'important');
    }
    const elementsToFade = document.querySelectorAll(
      '.cosmic-portal-header, .cosmic-stage, .cosmic-portal-bottom-bar'
    );
    gsap.to(elementsToFade, {
      opacity: 0,
      scale: 0.95,
      duration: 0.45,
      ease: 'power2.out',
      pointerEvents: 'none'
    });

    // 2. High-speed cinematic plunge zoom into Vietnam map (Dolly Dive)
    const zoomLayer = document.querySelector('.vietnam-zoom-layer');
    if (zoomLayer) {
      gsap.killTweensOf(zoomLayer);
      gsap.to(zoomLayer, {
        scale: 7.8,
        xPercent: -8,
        yPercent: -4,
        transformOrigin: '50% 50%',
        duration: 2.85,
        ease: 'power3.in'
      });
    }

    // 3. Cloud dive & speed rays penetration overlay
    const cloudOverlay = document.getElementById('cinematicCloudDescent');
    if (cloudOverlay) {
      gsap.fromTo(cloudOverlay, 
        { opacity: 0, scale: 0.7 }, 
        { opacity: 1, scale: 1.6, duration: 1.8, delay: 0.6, ease: 'power2.in' }
      );
    }

    // 4. Optical Flash Bloom (Lóe sáng khí quyển) at t = 2.05s to 2.8s
    const flashOverlay = document.getElementById('cinematicFlashOverlay');
    if (flashOverlay) {
      gsap.timeline({ delay: 2.05 })
        .to(flashOverlay, {
          opacity: 1,
          duration: 0.45,
          ease: 'power2.in'
        })
        .to(flashOverlay, {
          opacity: 0,
          duration: 0.55,
          ease: 'power2.out',
          delay: 0.1
        });
    }

    // 5. At exactly 3.0s, hand over to operational interface and halt background
    setTimeout(() => {
      // Complete handover to operational map
      if (typeof onComplete === 'function') {
        onComplete();
      }

      // CRITICAL: Halt all background rendering loops to free 100% GPU/CPU
      this.stop();
      if (window.tacticalCosmic && typeof window.tacticalCosmic.stop === 'function') {
        window.tacticalCosmic.stop();
      }
      if (zoomLayer) {
        gsap.killTweensOf(zoomLayer);
        gsap.set(zoomLayer, { scale: 1, xPercent: 0, yPercent: 0, opacity: 1 });
      }
      gsap.set(elementsToFade, { opacity: 1, scale: 1, pointerEvents: 'auto' });
      if (cloudOverlay) gsap.set(cloudOverlay, { opacity: 0, scale: 1 });
      if (flashOverlay) gsap.set(flashOverlay, { opacity: 0 });
    }, 3000);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.render();
  }

  stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  dispose() {
    this.isDisposed = true;
    this.stop();

    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement?.remove();
    }
  }
}

// Global initialization helper
window.initTacticalSpaceEngine = function(containerId) {
  const container = document.getElementById(containerId) || document.body;
  return new TacticalSpaceEngine({ container });
};
