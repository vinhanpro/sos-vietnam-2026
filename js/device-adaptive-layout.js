/**
 * 📱 Smart Device-Adaptive Layout Engine for SOS Emergency Vietnam
 * Auto-detects device type (Apple Watch, iPhone, Android, iPad/Tablet, Laptop, PC)
 * and dynamically applies optimal layout classes, touch ergonomics, and viewport optimizations.
 */

(function() {
  'use strict';

  function detectDeviceProfile() {
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const pixelRatio = window.devicePixelRatio || 1;

    let deviceType = 'desktop';
    let osType = 'other';

    // 1. Check OS
    if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      osType = 'ios';
    } else if (/Android/i.test(ua)) {
      osType = 'android';
    } else if (/Windows/i.test(ua)) {
      osType = 'windows';
    } else if (/Macintosh|Mac OS/i.test(ua)) {
      osType = 'mac';
    }

    // 2. Check Device Category
    if (width <= 320 || /Watch|AppleWatch/i.test(ua)) {
      deviceType = 'watch'; // Apple Watch / Smartwatch / Ultra-compact
    } else if (width <= 480 || (/Mobile|iPhone|Android/i.test(ua) && width < 768)) {
      deviceType = 'mobile'; // iPhone / Android Phone
    } else if (width <= 1024 || /iPad|Tablet/i.test(ua)) {
      deviceType = 'tablet'; // iPad / Android Tablet
    } else if (width <= 1440) {
      deviceType = 'laptop'; // Laptop
    } else {
      deviceType = 'pc'; // Desktop / Widescreen PC
    }

    return {
      deviceType,
      osType,
      width,
      height,
      isTouch,
      pixelRatio
    };
  }

  function applyDeviceAdaptiveClasses() {
    const profile = detectDeviceProfile();
    const html = document.documentElement;
    const body = document.body;

    // Clear previous device classes
    const classesToRemove = [
      'device-watch', 'device-mobile', 'device-tablet', 'device-laptop', 'device-pc',
      'os-ios', 'os-android', 'os-windows', 'os-mac',
      'touch-device', 'no-touch'
    ];
    classesToRemove.forEach(cls => {
      html.classList.remove(cls);
      if (body) body.classList.remove(cls);
    });

    // Add updated profile classes
    const classesToAdd = [
      `device-${profile.deviceType}`,
      `os-${profile.osType}`,
      profile.isTouch ? 'touch-device' : 'no-touch'
    ];

    classesToAdd.forEach(cls => {
      html.classList.add(cls);
      if (body) body.classList.add(cls);
    });

    // Set CSS Variables for adaptive UI scaling
    html.style.setProperty('--viewport-vw', `${profile.width}px`);
    html.style.setProperty('--viewport-vh', `${profile.height}px`);

    // Dispatch event for other components (Map, Stepper, Charts) to re-layout
    window.dispatchEvent(new CustomEvent('sos:device-change', { detail: profile }));
  }

  // Run on load and on resize/orientation change
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyDeviceAdaptiveClasses);
  } else {
    applyDeviceAdaptiveClasses();
  }

  let resizeTimer = null;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applyDeviceAdaptiveClasses, 150);
  });

  window.addEventListener('orientationchange', function() {
    setTimeout(applyDeviceAdaptiveClasses, 200);
  });

  window.getSOSDeviceProfile = detectDeviceProfile;
})();
