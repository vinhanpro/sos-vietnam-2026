/**
 * CYBER DEFENSE & ANTI-TAMPER SECURITY SHIELD (VIETNAM NATIONAL DEFENSE SYSTEM)
 * Chống sao chép, chặn chuột phải, chặn DevTools (F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S)
 * Tự động khóa và bẫy vô hiệu hóa công cụ kiểm tra mã nguồn
 */

(function () {
  'use strict';

  // 1. Inject global CSS protection
  const style = document.createElement('style');
  style.id = 'cyber-shield-css';
  style.textContent = `
    *, *::before, *::after {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
      -webkit-touch-callout: none !important;
    }
    input, textarea {
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
      user-select: text !important;
    }
    img {
      -webkit-user-drag: none !important;
      user-drag: none !important;
      pointer-events: auto;
    }
  `;
  if (document.head) {
    document.head.appendChild(style);
  } else {
    document.addEventListener('DOMContentLoaded', () => document.head.appendChild(style));
  }

  // 2. Block Context Menu (Chuột Phải) on all layers with Capture Phase
  const blockContextMenu = function (e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return false;
  };

  window.addEventListener('contextmenu', blockContextMenu, true);
  document.addEventListener('contextmenu', blockContextMenu, true);
  document.documentElement.addEventListener('contextmenu', blockContextMenu, true);
  if (document.body) document.body.addEventListener('contextmenu', blockContextMenu, true);

  // 3. Block Drag & Copy / Cut / Selectstart
  ['copy', 'cut', 'dragstart', 'selectstart'].forEach(function (eventName) {
    window.addEventListener(eventName, function (e) {
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
      if (tag !== 'input' && tag !== 'textarea') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);
  });

  // 4. Block Developer Tools Shortcuts (F12, Ctrl+Shift+I/J/C/K, Ctrl+U, Ctrl+S, Ctrl+P)
  const blockKeys = function (e) {
    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    const isCtrlOrMeta = e.ctrlKey || e.metaKey;

    // Ctrl + Shift + I / J / C / K / M (Inspect / Console / Device Mode)
    if (isCtrlOrMeta && e.shiftKey) {
      const key = (e.key || '').toUpperCase();
      const code = e.keyCode;
      if (key === 'I' || key === 'J' || key === 'C' || key === 'K' || key === 'M' || code === 73 || code === 74 || code === 67 || code === 75 || code === 77) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }

    // Ctrl + U (View Source)
    if (isCtrlOrMeta && ((e.key || '').toUpperCase() === 'U' || e.keyCode === 85)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl + S (Save Page)
    if (isCtrlOrMeta && ((e.key || '').toUpperCase() === 'S' || e.keyCode === 83)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl + P (Print - block unless print modal is active)
    if (isCtrlOrMeta && ((e.key || '').toUpperCase() === 'P' || e.keyCode === 80)) {
      const modal = document.getElementById('incidentReportDocxModal');
      if (!modal || modal.style.display !== 'flex') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }

    // Ctrl + A (Select All - block outside input/textarea)
    if (isCtrlOrMeta && ((e.key || '').toUpperCase() === 'A' || e.keyCode === 65)) {
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
      if (tag !== 'input' && tag !== 'textarea') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }
  };

  window.addEventListener('keydown', blockKeys, true);
  document.addEventListener('keydown', blockKeys, true);

  // 5. Anti-Debugging & Security Guard
  const startDebuggerTrap = function () {
    let lastTime = performance.now();
    setInterval(function () {
      const currentTime = performance.now();
      if (currentTime - lastTime > 300) {
        try {
          console.clear();
        } catch (e) {}
      }
      lastTime = currentTime;
    }, 500);
  };

  startDebuggerTrap();

  // 6. Disable console inspection in production
  try {
    const noop = function () {};
    console.log = noop;
    console.debug = noop;
    console.info = noop;
    console.dir = noop;
  } catch (e) {}

})();
