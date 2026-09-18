/**
 * SOS EMERGENCY VIETNAM 2026 — TACTICAL LAYOUT ENGINE
 * ------------------------------------------------------------------
 * Bộ điều phối bố cục cho Dispatcher Console (dispatcher.html):
 *   • ≥1280px  : 3 vùng chỉ huy  [Sự cố] | [Bản đồ] | [Chi tiết]
 *   • 993–1279 : 2 cột (bản đồ | sidebar) — drawer nằm trong sidebar (như cũ)
 *   • ≤992px   : 1 vùng/lần + Tab bar Liquid Glass (Bản đồ · Sự cố · Chi tiết)
 *
 * Nguyên tắc: KHÔNG đổi id/class mà dispatcher.js tham chiếu. Chỉ di chuyển
 * node #activeIncidentDrawer giữa hai vị trí (sidebar ↔ panel chi tiết) và theo dõi
 * thuộc tính style.display của nó bằng MutationObserver để phản ứng.
 *
 * Tệp này là script cổ điển (không module) → chạy trước dispatcher.js (module
 * được defer), nên panel chi tiết đã tồn tại khi DispatcherApp khởi tạo.
 */
(function () {
  'use strict';

  var BP_THREE = 1280;
  var BP_MOBILE = 992;
  var MODE = { THREE: 'three', TWO: 'two', MOBILE: 'mobile' };

  var state = {
    mode: null,
    view: 'map',            // mobile: map | queue | detail
    drawerVisible: false,
    userPinnedView: false
  };

  var els = {};

  /* ---------------------------------------------------------------
     Helpers
     --------------------------------------------------------------- */
  function $(id) { return document.getElementById(id); }

  function currentMode() {
    var w = window.innerWidth || document.documentElement.clientWidth;
    if (w <= BP_MOBILE) return MODE.MOBILE;
    if (w >= BP_THREE) return MODE.THREE;
    return MODE.TWO;
  }

  function isDrawerVisible() {
    var d = els.drawer;
    if (!d) return false;
    var disp = d.style.display;
    if (disp === 'none') return false;
    if (disp === 'block' || disp === 'flex') return true;
    return getComputedStyle(d).display !== 'none';
  }

  function resizeMapSoon() {
    var attempts = [60, 260, 600, 1200];
    attempts.forEach(function (t) {
      setTimeout(function () {
        try {
          var m = window.dispatcher && window.dispatcher.mapController && window.dispatcher.mapController.map;
          if (m && typeof m.resize === 'function') m.resize();
        } catch (e) { /* noop */ }
      }, t);
    });
  }

  /* Bản đồ được khởi tạo khi khung còn chưa có kích thước thật (màn hình đăng
     nhập che phía trước) nên vùng bản đồ có thể hiện tối đen. Theo dõi kích
     thước khung để vẽ lại ngay khi khung có kích thước. */
  function watchMapCanvasSize() {
    if (!window.ResizeObserver) return;
    var wrap = document.querySelector('.dispatcher-map-canvas-wrap') || document.getElementById('dispatcherMap');
    if (!wrap) return;
    var lastW = 0;
    var lastH = 0;
    new ResizeObserver(function (entries) {
      var box = entries[0] && entries[0].contentRect;
      if (!box) return;
      var w = Math.round(box.width);
      var h = Math.round(box.height);
      if (w === lastW && h === lastH) return;
      lastW = w;
      lastH = h;
      if (w > 0 && h > 0) resizeMapSoon();
    }).observe(wrap);
  }

  function svg(path) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + path + '</svg>';
  }

  /* ---------------------------------------------------------------
     1. Dựng cột phải "Chi tiết sự cố" + placeholder vị trí gốc drawer
     --------------------------------------------------------------- */
  function buildDetailPanel() {
    els.drawer = $('activeIncidentDrawer');
    els.sidebar = $('dispatcherSidebar');
    els.layout = document.querySelector('.dispatcher-layout');
    if (!els.drawer || !els.layout) return;

    els.drawerHome = document.createComment('activeIncidentDrawer home');
    els.drawer.parentNode.insertBefore(els.drawerHome, els.drawer);

    els.detailPanel = $('tacticalDetailPanel');
    if (!els.detailPanel) {
      els.detailPanel = document.createElement('section');
      els.detailPanel.id = 'tacticalDetailPanel';
      els.detailPanel.className = 'tactical-detail-panel';
      els.detailPanel.setAttribute('aria-label', 'Chi tiết hồ sơ sự cố');
      
      els.detailPanel.innerHTML = 
        '<div class="tactical-detail-header">' +
          '<h2 class="tactical-detail-title"><span class="tac-dot"></span> CHI TIẾT SỰ CỐ TÁC CHIẾN</h2>' +
        '</div>' +
        '<div class="tactical-detail-body" id="tacticalDetailBody">' +
          '<div class="tactical-detail-empty" id="tacticalDetailEmpty">' +
            '<div class="tac-empty-ring">' + svg('<circle cx="12" cy="12" r="9" stroke="currentColor" fill="none" stroke-width="2"/><path d="M12 7v5l3 3" stroke="currentColor" fill="none" stroke-width="2"/>') + '</div>' +
            '<strong>Chưa chọn sự cố</strong>' +
            '<span>Nhấp vào sự cố trong danh sách hoặc trên bản đồ để chỉ huy điều phối.</span>' +
          '</div>' +
        '</div>';
      
      els.layout.appendChild(els.detailPanel);
    }
  }

  function moveDrawer(toPanel) {
    var drawer = els.drawer || $('activeIncidentDrawer');
    var body = $('tacticalDetailBody') || els.detailPanel;
    var empty = $('tacticalDetailEmpty');
    if (!drawer || !els.detailPanel || !els.drawerHome) return;
    if (toPanel) {
      if (drawer.parentNode !== body) body.appendChild(drawer);
      if (empty) empty.style.display = isDrawerVisible() ? 'none' : 'flex';
      return;
    }
    if (drawer.parentNode !== els.drawerHome.parentNode) {
      els.drawerHome.parentNode.insertBefore(drawer, els.drawerHome.nextSibling);
    }
    if (empty) empty.style.display = 'flex';
  }

  /* ---------------------------------------------------------------
     2. Tab bar mobile (Bản đồ · Sự cố · Chi tiết)
     --------------------------------------------------------------- */
  function buildTabbar() {
    if (els.tabbar) return;
    var bar = document.createElement('nav');
    bar.id = 'tacticalTabbar';
    bar.className = 'tactical-tabbar';
    bar.setAttribute('aria-label', 'Điều hướng bảng điều hành');
    bar.innerHTML =
      '<button type="button" data-view="map" class="is-active">' +
        svg('<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>') +
        '<span>Bản đồ</span></button>' +
      '<button type="button" data-view="queue">' +
        svg('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>') +
        '<span>Sự cố</span><em class="tac-tab-badge" id="tacticalQueueBadge">0</em></button>' +
      '<button type="button" data-view="detail">' +
        svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>') +
        '<span>Chi tiết</span></button>';
    document.body.appendChild(bar);
    els.tabbar = bar;
    els.queueBadge = $('tacticalQueueBadge');

    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-view]');
      if (!btn) return;
      var targetView = btn.getAttribute('data-view');
      if (targetView === 'detail') {
        if (window.dispatcher && !window.dispatcher.selectedIncidentId) {
          var firstIncId = window.dispatcher.incidents && window.dispatcher.incidents.keys && window.dispatcher.incidents.keys().next().value;
          if (firstIncId) {
            window.dispatcher.selectIncident(firstIncId);
          }
        }
      }
      setMobileView(targetView, true);
    });
  }

  function setMobileView(view, byUser) {
    state.view = view;
    if (byUser) state.userPinnedView = true;
    document.body.setAttribute('data-tac-view', view);
    if (els.tabbar) {
      Array.prototype.forEach.call(els.tabbar.querySelectorAll('button[data-view]'), function (b) {
        b.classList.toggle('is-active', b.getAttribute('data-view') === view);
      });
    }

    var drawer = els.drawer || $('activeIncidentDrawer');
    var queueList = $('incidentQueueList');
    var historyList = $('incidentHistoryList');

    if (view === 'detail') {
      moveDrawer(true);
      if (drawer) drawer.style.display = 'flex';
      if (window.dispatcher && !window.dispatcher.selectedIncidentId) {
        var firstIncId = window.dispatcher.incidents && window.dispatcher.incidents.keys && window.dispatcher.incidents.keys().next().value;
        if (firstIncId) {
          window.dispatcher.selectIncident(firstIncId);
        }
      }
    } else if (view === 'queue') {
      moveDrawer(false);
      if (drawer) drawer.style.display = 'none';
      var activeTab = document.querySelector('.sidebar-tab-nav button.is-active');
      if (activeTab && activeTab.dataset.tab === 'history' && historyList) {
        historyList.style.display = 'block';
      } else if (queueList) {
        queueList.style.display = 'block';
      }
    }

    // When switching away from map on mobile, close ward HUD popup to avoid visual overlap
    if (view !== 'map') {
      var hud = document.getElementById('tacticalWardGeofenceHud');
      if (hud) hud.style.display = 'none';
    }
    if (view === 'map') {
      moveDrawer(false);
      resizeMapSoon();
    }
    window.dispatchEvent(new CustomEvent('sos:tactical-view', { detail: { view: view } }));
  }

  function updateQueueBadge() {
    if (!els.queueBadge) return;
    var list = $('incidentQueueList');
    var n = list ? list.querySelectorAll('.incident-card, .incident-item, [data-incident-id], [data-sos-id]').length : 0;
    if (!n && list) n = list.children.length;
    els.queueBadge.textContent = n > 99 ? '99+' : String(n);
    els.queueBadge.classList.toggle('is-visible', n > 0);
  }

  /* ---------------------------------------------------------------
     3. Áp dụng chế độ bố cục
     --------------------------------------------------------------- */
  function applyMode(force) {
    var mode = currentMode();
    if (!force && mode === state.mode) return;
    var prev = state.mode;
    state.mode = mode;

    var body = document.body;
    body.classList.toggle('tac-three-zone', mode === MODE.THREE);
    body.classList.toggle('tac-mobile-console', mode === MODE.MOBILE);
    body.classList.toggle('tac-two-col', mode === MODE.TWO);
    body.setAttribute('data-tac-mode', mode);

    if (mode === MODE.MOBILE) {
      var v = state.drawerVisible ? 'detail' : (state.view || 'map');
      if (prev !== MODE.MOBILE) state.userPinnedView = false;
      setMobileView(v, false);
    } else if (mode === MODE.THREE) {
      moveDrawer(true);
      body.removeAttribute('data-tac-view');
      var drawer = els.drawer || $('activeIncidentDrawer');
      if (drawer && !state.drawerVisible) drawer.style.display = 'none';
      if (els.detailPanel) els.detailPanel.classList.toggle('has-incident', state.drawerVisible);
    } else {
      moveDrawer(false);
      body.removeAttribute('data-tac-view');
      var drawer = els.drawer || $('activeIncidentDrawer');
      if (drawer && !state.drawerVisible) drawer.style.display = 'none';
    }

    syncDrawerState();
    resizeMapSoon();
    window.dispatchEvent(new CustomEvent('sos:tactical-mode', { detail: { mode: mode } }));
  }

  function syncDrawerState() {
    var visible = isDrawerVisible();
    var changed = visible !== state.drawerVisible;
    state.drawerVisible = visible;
    document.body.classList.toggle('tac-incident-selected', visible);
    if (state.mode === MODE.MOBILE && changed && visible && state.view === 'detail') {
      var d = els.drawer || $('activeIncidentDrawer');
      if (d) d.style.display = 'flex';
    } else if (state.mode === MODE.THREE) {
      moveDrawer(true);
      if (els.detailPanel) els.detailPanel.classList.toggle('has-incident', visible);
      var d = els.drawer || $('activeIncidentDrawer');
      if (d && visible) d.style.display = 'flex';
    }
    if (changed) resizeMapSoon();
  }

  /* ---------------------------------------------------------------
     4. Theo dõi thay đổi từ dispatcher.js (style.display, danh sách)
     --------------------------------------------------------------- */
  function observe() {
    if (els.drawer && window.MutationObserver) {
      new MutationObserver(function () { syncDrawerState(); })
        .observe(els.drawer, { attributes: true, attributeFilter: ['style', 'class'] });
      var sid = $('drawerSosId');
      if (sid) new MutationObserver(function () { syncDrawerState(); })
        .observe(sid, { childList: true, characterData: true, subtree: true });
    }
    var list = $('incidentQueueList');
    if (list && window.MutationObserver) {
      new MutationObserver(function () { updateQueueBadge(); })
        .observe(list, { childList: true });
      updateQueueBadge();
    }
    // Cổng Portal đăng nhập hiện/ẩn -> body.tac-portal-open (ẩn tab bar mobile)
    var portal = $('cosmicPortalView');
    if (portal && window.MutationObserver) {
      var syncPortal = function () {
        var open = getComputedStyle(portal).display !== 'none';
        document.body.classList.toggle('tac-portal-open', open);
      };
      new MutationObserver(syncPortal).observe(portal, { attributes: true, attributeFilter: ['style', 'class'] });
      syncPortal();
    }
    // Dock địa bàn mở/đóng -> body.tac-dock-open (Hộp thư nâng lên trên dock ở mobile)
    var dock = $('tacticalGeofenceControlBar');
    if (dock && window.MutationObserver) {
      var syncDock = function () {
        var open = dock.style.display !== 'none' && getComputedStyle(dock).display !== 'none';
        document.body.classList.toggle('tac-dock-open', open);
        if (open) document.documentElement.style.setProperty('--tac-dock-h', Math.round(dock.getBoundingClientRect().height) + 'px');
      };
      new MutationObserver(syncDock).observe(dock, { attributes: true, attributeFilter: ['style', 'class'] });
      syncDock();
    }
  }

  /* ---------------------------------------------------------------
     5. Viewport thật (iOS Safari, bàn phím ảo Android/iOS)
     --------------------------------------------------------------- */
  function setupViewport() {
    var root = document.documentElement;
    var supportsDvh = window.CSS && CSS.supports && CSS.supports('height', '100dvh');
    var vv = window.visualViewport;
    var baseH = window.innerHeight;

    function update() {
      var h = vv ? vv.height : window.innerHeight;
      if (!supportsDvh) root.style.setProperty('--tac-vh', Math.round(h) + 'px');
      // Bàn phím ảo: viewport co > 150px so với chiều cao gốc
      var full = Math.max(baseH, window.innerHeight);
      var kb = full - h;
      var open = kb > 150 && document.activeElement &&
        /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
      root.style.setProperty('--tac-kb-offset', open ? Math.round(kb) + 'px' : '0px');
      document.body.classList.toggle('tac-keyboard-open', !!open);
    }

    if (vv) {
      vv.addEventListener('resize', update);
      vv.addEventListener('scroll', update);
    }
    window.addEventListener('orientationchange', function () {
      setTimeout(function () { baseH = window.innerHeight; update(); applyMode(true); }, 250);
    });
    document.addEventListener('focusout', function () { setTimeout(update, 80); });
    update();
  }

  /* ---------------------------------------------------------------
     6. Khởi động
     --------------------------------------------------------------- */
  function init() {
    if (!document.querySelector('.dispatcher-layout')) {
      // index.html: chỉ cần viewport engine
      setupViewport();
      return;
    }
    buildDetailPanel();
    buildTabbar();
    observe();
    watchMapCanvasSize();
    setupViewport();
    applyMode(true);

    function updateDynamicYearGlobally() {
      var curYear = new Date().getFullYear();
      var natBadge = document.querySelector('.national-badge-title');
      if (natBadge && natBadge.textContent.indexOf('QUỐC GIA') !== -1) {
        natBadge.textContent = 'QUỐC GIA ' + curYear;
      }
      var natPill = document.getElementById('statNationalMapPill');
      if (natPill && natPill.getAttribute('title')) {
        natPill.setAttribute('title', natPill.getAttribute('title').replace(/2026/g, curYear));
      }
      var titles = document.querySelectorAll('.modal-title, .header-brand h1, .brand-text, .system-title, .admin-modal-title, .national-banner-pill, #bandoSyncStatusBadge');
      titles.forEach(function(el) {
        if (el.textContent && el.textContent.indexOf('2026') !== -1) {
          el.innerHTML = el.innerHTML.replace(/2026/g, curYear);
        }
      });
    }
    updateDynamicYearGlobally();

    var raf = 0;
    window.addEventListener('resize', function () {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; applyMode(false); });
    });
    window.addEventListener('sos:device-change', function () { applyMode(true); });

    // API công khai (không bắt buộc với dispatcher.js)
    window.TacticalLayout = {
      getMode: function () { return state.mode; },
      getView: function () { return state.view; },
      setView: function (v) { if (state.mode === MODE.MOBILE) setMobileView(v, true); },
      refresh: function () { applyMode(true); }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
