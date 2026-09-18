/**
 * 🍎 Apple iOS 26 Ambient Liquid Bubbles Engine
 * Generates floating, refractive translucent glass bubbles with micro-physics and interactive parallax.
 */
(function() {
  function initIOS26Bubbles() {
    if (document.getElementById('ios26BubblesBackdrop')) return;

    const backdrop = document.createElement('div');
    backdrop.id = 'ios26BubblesBackdrop';
    backdrop.className = 'ios26-ambient-bubbles-backdrop';

    const bubbleColors = [
      'radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.4) 0%, rgba(56, 189, 248, 0.12) 50%, rgba(14, 165, 233, 0.04) 80%, rgba(255, 255, 255, 0.01) 100%)',
      'radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.4) 0%, rgba(239, 68, 68, 0.12) 50%, rgba(220, 38, 38, 0.04) 80%, rgba(255, 255, 255, 0.01) 100%)',
      'radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.4) 0%, rgba(16, 185, 129, 0.12) 50%, rgba(5, 150, 105, 0.04) 80%, rgba(255, 255, 255, 0.01) 100%)',
      'radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.4) 0%, rgba(245, 158, 11, 0.12) 50%, rgba(217, 119, 6, 0.04) 80%, rgba(255, 255, 255, 0.01) 100%)'
    ];

    const count = window.innerWidth < 768 ? 5 : 8;
    for (let i = 0; i < count; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'ios26-translucent-bubble';
      
      const size = Math.floor(Math.random() * 80) + 40; // 40px - 120px
      const left = Math.floor(Math.random() * 92); // 0% - 92%
      const top = Math.floor(Math.random() * 92); // 0% - 92%
      const duration = Math.floor(Math.random() * 14) + 18; // 18s - 32s
      const delay = -(Math.floor(Math.random() * 15)); // Offset
      const color = bubbleColors[i % bubbleColors.length];

      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${left}vw`;
      bubble.style.top = `${top}vh`;
      bubble.style.background = color;
      bubble.style.animationDuration = `${duration}s`;
      bubble.style.animationDelay = `${delay}s`;
      bubble.style.opacity = (Math.random() * 0.14 + 0.14).toFixed(2);

      backdrop.appendChild(bubble);
    }

    document.body.prepend(backdrop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIOS26Bubbles);
  } else {
    initIOS26Bubbles();
  }
})();
