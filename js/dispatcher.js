import { MapController } from './map-controller.js?v=20260921_admin_geodata_progress2';

const AGENCY_PREVIEWS = {
  congan: {
    title: 'CỔNG TRỰC BAN CÔNG AN NHÂN DÂN',
    icon: 'CA',
    logo: '/assets/icons/logo-bocongan.png',
    officer: 'Thượng tá Trần Văn Hùng',
    phone: '024 38 234 567 / 0988 999 115',
    email: 'trucban@congan.gov.vn',
    color: '#0088ff'
  },
  csgt: {
    title: 'CỔNG TRỰC BAN CẢNH SÁT GIAO THÔNG',
    icon: 'CS',
    logo: '/assets/icons/logo-csgt.png',
    officer: 'Trung tá Phạm Quốc Dũng',
    phone: '024 38 247 247 / 0988 247 247',
    email: 'csgt@congan.gov.vn',
    color: '#f59e0b'
  },
  cuuho: {
    title: 'CỔNG TRỰC BAN PCCC & CNCH',
    icon: 'PC',
    logo: '/assets/icons/logo-pccc.png',
    officer: 'Đại úy Nguyễn Văn Toàn',
    phone: '024 38 114 114 / 0988 114 114',
    email: 'pccc@cuunan.gov.vn',
    color: '#ef4444'
  },
  admin: {
    title: 'TRUNG TÂM CHỈ HUY QUỐC GIA (TỔNG HỢP)',
    icon: 'CH',
    logo: '/assets/icons/logo-admin-login.png',
    officer: 'Đại tá Hoàng Quốc Việt',
    phone: '024 38 999 999 / 0988 999 999',
    email: 'chihuytonghop@bca.gov.vn',
    color: '#3b82f6'
  }
};

class DispatcherApp {
  constructor() {
    this.mapController = null;
    this.incidents = new Map();
    this.selectedIncidentId = null;
    this.currentOfficer = null;
    this.currentDutyShift = null;
    this.shiftExpiredNotified = false;
    this.filterAgency = 'all';
    this.eventSource = null;
    this.isSpeakingVoiceAi = false;
    this.stationsList = [];
    this.enterprisesList = [];
    this.hospitalsList = [];
    this.selectedStationRegion = 'all';
    this.searchStationKeyword = '';
    this.searchEnterpriseKeyword = '';
    this.openChatWindows = new Map();
    this.callRingtonePlaying = false;
    this.ringtoneAudioCtx = null;
    this.ringtoneTimer = null;
    window.dispatcher = this;

    try { this.initElements(); } catch (e) { console.error('initElements error:', e); }
    try { this.initVietnamClock(); } catch (e) { console.error('initVietnamClock error:', e); }
    try { this.initWeatherWidget(); } catch (e) { console.error('initWeatherWidget error:', e); }
    try { this.initCosmicPortal(); } catch (e) { console.error('initCosmicPortal error:', e); }
    try { this.initDutyShiftAndSubstitute(); } catch (e) { console.error('initDutyShift error:', e); }
    try { this.bindEvents(); } catch (e) { console.error('bindEvents error:', e); }
    try { this.initFloatingChatSystem(); } catch (e) { console.error('initFloatingChatSystem error:', e); }
    try { this.initAdminModal(); } catch (e) { console.error('initAdminModal error:', e); }
    try { this.initAdminSecuritySystem(); } catch (e) { console.error('initAdminSecuritySystem error:', e); }
    try { this.initStationDirectory(); } catch (e) { console.error('initStationDirectory error:', e); }
    try { this.initEnterprisesDirectory(); } catch (e) { console.error('initEnterprisesDirectory error:', e); }
    try { this.initHospitalsDirectory(); } catch (e) { console.error('initHospitalsDirectory error:', e); }
    try { this.initLocationPickerModal(); } catch (e) { console.error('initLocationPickerModal error:', e); }
    try { this.checkAuth(); } catch (e) { console.error('checkAuth error:', e); }
    try { this.initMap(); } catch (e) { console.error('initMap error:', e); }
    try { this.updateDynamicYearUI(); } catch (e) { console.error('updateDynamicYearUI error:', e); }
    this.initAudioUnlock();
  }

  initAudioUnlock() {
    const unlock = () => {
      try {
        if (this.audioChimeCtx?.state === 'suspended') this.audioChimeCtx.resume();
        if (this.audioAlarmCtx?.state === 'suspended') this.audioAlarmCtx.resume();
        if ('speechSynthesis' in window) {
          if (window.speechSynthesis.paused) window.speechSynthesis.resume();
          window.speechSynthesis.getVoices();
        }
      } catch(e) {}
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('click', unlock, { passive: true });
  }

  initElements() {
    // Gatekeeper & Cyber Defense Elements
    this.cyberGatekeeperModal = document.getElementById('cyberGatekeeperModal');
    this.formCyberGatekeeper = document.getElementById('formCyberGatekeeper');
    this.gatekeeperPasswordInput = document.getElementById('gatekeeperPasswordInput');
    this.gatekeeperErrorMsg = document.getElementById('gatekeeperErrorMsg');
    this.btnSubmitGatekeeper = document.getElementById('btnSubmitGatekeeper');

    this.authGateModal = document.getElementById('authGateModal');
    this.agencyTabs = document.querySelectorAll('.agency-login-tab');
    this.formDispatcherLogin = document.getElementById('formDispatcherLogin');
    this.loginUsername = document.getElementById('loginUsername');
    this.loginPassword = document.getElementById('loginPassword');
    this.loginErrorMsg = document.getElementById('loginErrorMsg');
    this.authHeaderTitle = document.getElementById('authHeaderTitle');
    this.btnSubmitLogin = document.getElementById('btnSubmitLogin');
    this.btnLogoutDispatcher = document.getElementById('btnLogoutDispatcher');

    this.headerBrandIcon = document.getElementById('headerBrandIcon');
    this.headerBrandAgencyCode = document.getElementById('headerBrandAgencyCode');
    this.headerBrandTitle = document.getElementById('headerBrandTitle');
    this.dutyAvatar = document.getElementById('dutyAvatar');
    this.officerRankTitle = document.getElementById('officerRankTitle');
    this.officerName = document.getElementById('officerName');
    this.officerPhone = document.getElementById('officerPhone');

    this.tabBtnIncidents = document.getElementById('tabBtnIncidents');
    this.tabBtnHistory = document.getElementById('tabBtnHistory');
    this.tabBtnStations = document.getElementById('tabBtnStations');
    this.tabBtnEnterprises = document.getElementById('tabBtnEnterprises');
    this.tabBtnHospitals = document.getElementById('tabBtnHospitals');
    this.panelIncidentsView = document.getElementById('panelIncidentsView');
    this.panelHistoryView = document.getElementById('panelHistoryView');
    this.panelStationsView = document.getElementById('panelStationsView');
    this.panelEnterprisesView = document.getElementById('panelEnterprisesView');
    this.panelHospitalsView = document.getElementById('panelHospitalsView');
    this.incidentHistoryList = document.getElementById('incidentHistoryList');
    this.historyCountBadge = document.getElementById('historyCountBadge');
    this.btnExportHistoryExcel = document.getElementById('btnExportHistoryExcel');
    this.btnClearHistoryArchive = document.getElementById('btnClearHistoryArchive');
    this.inputSearchHistory = document.getElementById('inputSearchHistory');
    this.historyFilterAgency = 'all';
    this.historySearchTerm = '';
    this.stationRegionBtns = document.querySelectorAll('.station-region-btn');
    this.inputSearchStations = document.getElementById('inputSearchStations');
    this.stationsListContainer = document.getElementById('stationsListContainer');

    this.editStationModal = document.getElementById('editStationModal');
    this.btnCloseEditStationModal = document.getElementById('btnCloseEditStationModal');
    this.formEditStation = document.getElementById('formEditStation');
    this.editStationId = document.getElementById('editStationId');
    this.editStationName = document.getElementById('editStationName');
    this.editStationAddress = document.getElementById('editStationAddress');
    this.editStationPhone = document.getElementById('editStationPhone');
    this.editStationSms = document.getElementById('editStationSms');
    this.editStationOfficer = document.getElementById('editStationOfficer');
    this.editStationLat = document.getElementById('editStationLat');
    this.editStationLng = document.getElementById('editStationLng');

    this.activeCountBadge = document.getElementById('activeCountBadge');
    this.incidentQueueList = document.getElementById('incidentQueueList');
    this.queueEmptyCosmicState = document.getElementById('queueEmptyCosmicState');
    this.activeIncidentDrawer = document.getElementById('activeIncidentDrawer');
    this.drawerSosId = document.getElementById('drawerSosId');
    this.drawerStatusBadge = document.getElementById('drawerStatusBadge');
    this.drawerReporter = document.getElementById('drawerReporter');
    this.drawerAddress = document.getElementById('drawerAddress');
    this.drawerTags = document.getElementById('drawerTags');
    this.btnDispatcherGmaps = document.getElementById('btnDispatcherGmaps');

    this.drawerActionGroup = document.getElementById('drawerActionGroup');
    this.btnPlayVoiceAi = document.getElementById('btnPlayVoiceAi');
    this.btnStartVideoCall = document.getElementById('btnStartVideoCall');
    this.btnAcceptSOS = document.getElementById('btnAcceptSOS');
    this.btnDeEscalateSOS = document.getElementById('btnDeEscalateSOS');
    this.drawerEscalatedWardNotice = document.getElementById('drawerEscalatedWardNotice');
    this.btnMarkArrived = document.getElementById('btnMarkArrived');
    this.btnMarkResolved = document.getElementById('btnMarkResolved');
    this.btnFlagFakeAlarm = document.getElementById('btnFlagFakeAlarm');
    this.btnOpenFakeArchivePill = document.getElementById('btnOpenFakeArchivePill');
    this.statFakeAlarmCount = document.getElementById('statFakeAlarmCount');
    this.btnOpenReportDocxModal = document.getElementById('btnOpenReportDocxModal');

    // 2-Way Direct Chat with Citizen Elements
    this.dispatcherChatSection = document.getElementById('dispatcherChatSection');
    this.dispatcherChatMessages = document.getElementById('dispatcherChatMessages');
    this.dispatcherChatCitizenName = document.getElementById('dispatcherChatCitizenName');
    this.inputDispatcherChatText = document.getElementById('inputDispatcherChatText');
    this.btnSendDispatcherChat = document.getElementById('btnSendDispatcherChat');

    this.agencyFilterButtons = document.querySelectorAll('#agencyFilterGroup button[data-filter]');
    this.btnClearAllIncidents = document.getElementById('btnClearAllIncidents');
    this.mapPickModeBanner = document.getElementById('mapPickModeBanner');
  }

  async checkAuth() {
    // Purge any persistent localStorage gatekeeper pass to ensure it never auto-bypasses
    try {
      localStorage.removeItem('sos_gatekeeper_pass');
    } catch(e) {}

    // 1. Check Cyber Defense Gatekeeper Status (Pass: 2002)
    const isGatePassed = sessionStorage.getItem('sos_gatekeeper_pass') === 'true';
    if (!isGatePassed) {
      document.body.classList.remove('officer-authenticated');
      if (this.cyberGatekeeperModal) {
        this.cyberGatekeeperModal.style.display = 'flex';
      }
      if (this.cosmicPortalView) {
        this.cosmicPortalView.style.display = 'none';
        this.cosmicPortalView.style.setProperty('display', 'none', 'important');
      }
      if (this.authGateModal) {
        this.authGateModal.style.display = 'none';
        this.authGateModal.style.setProperty('display', 'none', 'important');
      }
      if (this.gatekeeperPasswordInput) {
        setTimeout(() => {
          try { this.gatekeeperPasswordInput.focus(); } catch(e) {}
        }, 150);
      }
      return; // STOP HERE! Do not proceed to officer login or dashboard!
    }

    try {
      const secRes = await fetch('/api/security/config');
      const secData = await secRes.json();
      if (secData && secData.ok) {
        this.securityConfig = secData;
        this.initClientCyberDefense(secData);
      }
    } catch (e) {
      console.warn('Security config check failed:', e);
    }

    if (this.cyberGatekeeperModal) {
      this.cyberGatekeeperModal.style.display = 'none';
    }

    // 2. Check Officer Session
    const raw = sessionStorage.getItem('sos_dispatcher_officer');
    if (raw) {
      try {
        const profile = JSON.parse(raw);
        this.currentOfficer = profile;
        this.applyOfficerProfile(profile);
        document.body.classList.add('officer-authenticated');

        // Hide Cosmic Portal & Login Modal
        if (this.cosmicPortalView) {
          this.cosmicPortalView.style.display = 'none';
          this.cosmicPortalView.style.setProperty('display', 'none', 'important');
        }
        setTimeout(() => {
          if (this.mapController?.map) {
            this.mapController.map.resize();
          }
        }, 200);
        if (this.authGateModal) {
          this.authGateModal.style.display = 'none';
          this.authGateModal.style.setProperty('display', 'none', 'important');
        }

        const savedShift = sessionStorage.getItem('sos_duty_shift_' + profile.username);
        if (savedShift) {
          try {
            this.currentDutyShift = JSON.parse(savedShift);
            this.applyDutyShift(this.currentDutyShift);
          } catch(e) {}
        } else {
          const now = new Date();
          const curH = String(now.getHours()).padStart(2, '0');
          const endH = String((now.getHours() + 8) % 24).padStart(2, '0');
          this.currentDutyShift = {
            officerName: profile.officerName || profile.username,
            officerRank: profile.officerRank || 'Cán bộ',
            officerPhone: profile.officerPhone || '113',
            officerSms: profile.officerSms || '',
            startTime: `${curH}:00`,
            endTime: `${endH}:00`,
            date: now.toISOString().split('T')[0]
          };
          this.applyDutyShift(this.currentDutyShift);
        }

        // Khởi tạo danh sách ca và stream SSE chính xác theo địa bàn cán bộ
        this.clearActiveSelectionAndMap();
        this.loadIncidents();
        this.connectLiveStream();
      } catch (err) {
        document.body.classList.remove('officer-authenticated');
        // Fallback to Cosmic Portal
        if (this.cosmicPortalView) {
          this.cosmicPortalView.style.display = 'block';
          this.cosmicPortalView.style.setProperty('display', 'block', 'important');
        }
        if (this.authGateModal) {
          this.authGateModal.style.display = 'none';
          this.authGateModal.style.setProperty('display', 'none', 'important');
        }
      }
    } else {
      // Gatekeeper is verified, SHOW THE COSMIC PORTAL WITH 4 BUBBLES!
      document.body.classList.remove('officer-authenticated');
      if (this.cosmicPortalView) {
        this.cosmicPortalView.style.display = 'block';
        this.cosmicPortalView.style.setProperty('display', 'block', 'important');
      }
      if (this.authGateModal) {
        this.authGateModal.style.display = 'none';
        this.authGateModal.style.setProperty('display', 'none', 'important');
      }
    }
  }

  initVietnamClock() {
    const updateClock = () => {
      const now = new Date();
      const vnTimeStr = now.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
      const clockEl = document.getElementById('clockTimeVal');
      if (clockEl) {
        clockEl.innerHTML = `<span class="clock-time-digits">${vnTimeStr}</span> <span class="clock-time-zone">(VN)</span>`;
      }

      const dateEl = document.getElementById('clockDateVal');
      if (dateEl) {
        const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
        const dayName = days[now.getDay()];
        const dayStr = String(now.getDate()).padStart(2, '0');
        const monthStr = String(now.getMonth() + 1).padStart(2, '0');
        const yearStr = now.getFullYear();
        dateEl.textContent = `${dayName}, ${dayStr}/${monthStr}/${yearStr}`;
      }

      // Calculate shift remaining
      if (this.currentDutyShift && this.currentDutyShift.endTime) {
        const [endH, endM] = this.currentDutyShift.endTime.split(':').map(Number);
        const [startH, startM] = (this.currentDutyShift.startTime || '07:00').split(':').map(Number);
        
        const nowH = now.getHours();
        const nowM = now.getMinutes();

        let endTotalMin = endH * 60 + endM;
        let startTotalMin = startH * 60 + startM;
        let nowTotalMin = nowH * 60 + nowM;

        if (endTotalMin <= startTotalMin) {
          endTotalMin += 24 * 60;
          if (nowTotalMin < startTotalMin) {
            nowTotalMin += 24 * 60;
          }
        }

        const diffMin = endTotalMin - nowTotalMin;
        const shiftDisplay = document.getElementById('dutyShiftDisplay');

        if (diffMin <= 0) {
          if (shiftDisplay) shiftDisplay.innerHTML = `<span style="color: #ef4444; font-weight: 800;">⚠️ HẾT CA (${this.currentDutyShift.startTime}-${this.currentDutyShift.endTime})</span>`;
          if (!this.shiftExpiredNotified) {
            this.shiftExpiredNotified = true;
            setTimeout(() => {
              alert(`⏰ THÔNG BÁO HẾT GIỜ KÍP TRỰC BAN (${this.currentDutyShift.startTime} - ${this.currentDutyShift.endTime})!\nVui lòng bàn giao ca và nhập thông tin cán bộ kíp trực tiếp theo.`);
              this.openDutyShiftModal();
            }, 200);
          }
        } else {
          this.shiftExpiredNotified = false;
          const remH = Math.floor(diffMin / 60);
          const remM = diffMin % 60;
          if (shiftDisplay) {
            shiftDisplay.innerHTML = `<span>Ca: ${this.currentDutyShift.startTime}-${this.currentDutyShift.endTime}</span><span class="shift-remaining-time"> (Còn: ${remH}h ${remM}p)</span>`;
          }
        }
      }
    };

    updateClock();
    setInterval(updateClock, 1000);
  }

  initWeatherWidget() {
    this.weatherWidget = document.getElementById('weatherWidget');
    this.weatherTempVal = document.getElementById('weatherTempVal');
    this.weatherDescVal = document.getElementById('weatherDescVal');
    this.weatherWidgetIcon = document.getElementById('weatherWidgetIcon');

    if (this.weatherWidget) {
      this.weatherWidget.addEventListener('click', () => {
        this.refreshWeather(true);
      });
    }

    // Trigger initial fetch
    this.refreshWeather(false);

    // Auto-refresh weather every 10 minutes
    setInterval(() => {
      this.refreshWeather(false);
    }, 10 * 60 * 1000);

    // Initial location check
    this.autoLocateCurrentPosition(false);
  }

  async refreshWeather(isManualClick = false) {
    let lat = 10.0452;
    let lng = 105.7469;

    // Use current officer's location if available
    if (this.currentOfficer && this.currentOfficer.stationLat && this.currentOfficer.stationLng) {
      lat = this.currentOfficer.stationLat;
      lng = this.currentOfficer.stationLng;
    } else if (this.currentLocation && this.currentLocation.lat && this.currentLocation.lng) {
      lat = this.currentLocation.lat;
      lng = this.currentLocation.lng;
    }

    if (isManualClick && this.weatherDescVal) {
      this.weatherDescVal.textContent = 'Đang cập nhật...';
    }

    try {
      const res = await fetch(`/api/weather/current?lat=${lat}&lng=${lng}&_t=${Date.now()}`);
      const data = await res.json();
      if (data && data.ok) {
        if (this.weatherTempVal) {
          this.weatherTempVal.textContent = `${data.temperature}°C`;
        }
        if (this.weatherDescVal) {
          this.weatherDescVal.textContent = data.desc || 'Thời tiết ổn định';
        }
        if (this.weatherWidgetIcon) {
          const isNight = !data.is_day;
          this.weatherWidgetIcon.innerHTML = isNight
            ? '<svg class="svg-ico ico-xs ico-purple" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
            : '<svg class="svg-ico ico-xs ico-amber" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
        }
        if (this.weatherWidget) {
          const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
          this.weatherWidget.title = `Thời tiết thực tế: ${data.temperature}°C — ${data.desc}\nTốc độ gió: ${data.windspeed || 0} km/h\nTọa độ: ${lat.toFixed(4)}, ${lng.toFixed(4)}\n(Cập nhật: ${nowStr} — Bấm để làm mới)`;
        }
      }
    } catch (e) {
      console.warn('Weather fetch error:', e);
      // Local calculation fallback
      const now = new Date();
      const hour = now.getHours();
      const isNight = hour < 6 || hour >= 18;
      if (this.weatherTempVal) this.weatherTempVal.textContent = isNight ? '26°C' : '32°C';
      if (this.weatherDescVal) this.weatherDescVal.textContent = isNight ? 'Đêm mát mẻ' : 'Trời quang';
      if (this.weatherWidgetIcon) {
        this.weatherWidgetIcon.innerHTML = isNight
          ? '<svg class="svg-ico ico-xs ico-purple" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
          : '<svg class="svg-ico ico-xs ico-amber" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
      }
    }
  }

  autoLocateCurrentPosition(panToMap = false) {
    const locPrimary = document.getElementById('locationPrimaryVal');
    const locSecondary = document.getElementById('locationSecondaryVal');

    if (this.currentOfficer && this.currentOfficer.stationName) {
      if (locPrimary) locPrimary.textContent = this.currentOfficer.stationName;
      if (locSecondary) locSecondary.textContent = this.currentOfficer.stationAddress || 'Khu vực trực ban';
      if (panToMap && this.currentOfficer.stationLat && this.currentOfficer.stationLng && this.map) {
        this.map.flyTo([this.currentOfficer.stationLat, this.currentOfficer.stationLng], 15);
      }
      return;
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          this.currentLocation = { lat, lng };
          if (locPrimary) locPrimary.textContent = 'Vị trí hiện tại';
          if (locSecondary) locSecondary.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          if (panToMap && this.map) {
            this.map.flyTo([lat, lng], 15);
          }
          this.refreshWeather(false);
        },
        err => {
          if (locPrimary) locPrimary.textContent = 'Trung tâm Chỉ huy';
          if (locSecondary) locSecondary.textContent = 'Cần Thơ (Mặc định)';
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      if (locPrimary) locPrimary.textContent = 'Trung tâm Chỉ huy';
      if (locSecondary) locSecondary.textContent = 'Cần Thơ (Mặc định)';
    }
  }

  initCosmicPortal() {
    this.cosmicPortalView = document.getElementById('cosmicPortalView');
    this.btnCloseAuthModal = document.getElementById('btnCloseAuthModal');
    this.btnLockPortalToGate = document.getElementById('btnLockPortalToGate');

    // 1. Lock screen back to Level-0 Gatekeeper (code 2002)
    const btnBackGate = document.getElementById('btnBackToGatekeeper') || this.btnLockPortalToGate;
    if (btnBackGate) {
      btnBackGate.addEventListener('click', () => {
        sessionStorage.removeItem('sos_gatekeeper_pass');
        localStorage.removeItem('sos_gatekeeper_pass');
        sessionStorage.removeItem('sos_dispatcher_officer');
        localStorage.removeItem('sos_dispatcher_officer');
        this.currentOfficer = null;
        if (this.cosmicPortalView) this.cosmicPortalView.style.display = 'none';
        if (this.cyberGatekeeperModal) {
          this.cyberGatekeeperModal.style.display = 'flex';
        }
      });
    }

    // 2. Close login modal and return to floating bubbles
    if (this.btnCloseAuthModal) {
      this.btnCloseAuthModal.addEventListener('click', () => {
        if (this.authGateModal) {
          this.authGateModal.style.display = 'none';
          this.authGateModal.style.setProperty('display', 'none', 'important');
        }
        if (this.cosmicPortalView) {
          this.cosmicPortalView.style.display = 'block';
          this.cosmicPortalView.style.setProperty('display', 'block', 'important');
        }
      });
    }

    // 3. Attach click handlers to the 4 floating bubbles (matching user image)
    const bubbleItems = document.querySelectorAll('.cosmic-bubble-item');
    bubbleItems.forEach(bubble => {
      bubble.addEventListener('click', () => {
        const agency = bubble.dataset.agency || 'congan';
        const name = bubble.dataset.name || '';
        const title = bubble.dataset.title || name;
        const logo = bubble.dataset.logo || '/assets/icons/logo-bocongan.png';
        const color = bubble.dataset.color || '#0088ff';

        // Select agency in login modal
        this.selectedAgency = agency;
        
        // Hide agency tabs container so user does NOT have to re-select
        const tabsWrap = document.querySelector('.agency-login-tabs');
        if (tabsWrap) tabsWrap.style.display = 'none';

        // Update modal branding & dedicated emblem
        const logoImg = document.getElementById('authHeaderLogoImg');
        if (logoImg) logoImg.src = logo;
        if (this.authHeaderTitle) this.authHeaderTitle.textContent = `ĐĂNG NHẬP TRỰC BAN`;
        
        const subTitle = document.getElementById('authHeaderSubtitle');
        if (subTitle) subTitle.textContent = `Phiên trực ban: ${title}`;

        const agencyPill = document.getElementById('loginSelectedAgencyBadge');
        if (agencyPill) {
          agencyPill.style.display = 'inline-flex';
          agencyPill.textContent = name;
          agencyPill.style.borderColor = color;
          agencyPill.style.color = color;
          agencyPill.style.background = `${color}25`;
          agencyPill.style.boxShadow = `0 0 16px ${color}40`;
        }

        const submitBtn = document.getElementById('btnSubmitLogin');
        if (submitBtn) {
          submitBtn.innerHTML = `<span>🔐</span> ĐĂNG NHẬP ${name.toUpperCase()}`;
          submitBtn.style.background = `linear-gradient(135deg, ${color}, #0b1120)`;
          submitBtn.style.boxShadow = `0 8px 24px ${color}50`;
        }

        if (this.loginErrorMsg) this.loginErrorMsg.style.display = 'none';

        // Clear password & prepare default username suggestion
        if (this.loginPassword) this.loginPassword.value = '';
        if (this.loginUsername) {
          this.loginUsername.value = agency === 'admin' ? 'admin' : (agency === 'congan' ? 'congan' : (agency === 'csgt' ? 'csgt' : 'cuuho'));
        }

        // Open login modal smoothly over the cosmic view
        if (this.authGateModal) {
          this.authGateModal.style.display = 'flex';
          this.authGateModal.style.setProperty('display', 'flex', 'important');
        }

        // Focus password
        if (this.loginPassword) {
          setTimeout(() => {
            try { this.loginPassword.focus(); } catch(e) {}
          }, 120);
        }
      });
    });

    // 4. Bind Image 1 Header buttons
    // 4. Header Circular Buttons & Gear Dropdown Menu
    const btnHeaderOfficer = document.getElementById('btnHeaderOfficerProfile');
    if (btnHeaderOfficer) {
      btnHeaderOfficer.addEventListener('click', () => this.openDutyShiftModal());
    }

    const btnHeaderSettings = document.getElementById('btnHeaderSettings');
    const gearMenu = document.getElementById('gearDropdownMenu');
    const gearWrap = document.getElementById('gearSettingsWrap');

    // Move gear dropdown to document body so it's not trapped in any stacking context
    if (gearMenu && gearMenu.parentElement !== document.body) {
      document.body.appendChild(gearMenu);
      gearMenu.style.position = 'fixed';
      gearMenu.style.zIndex = '99999';
    }

    const positionGearMenu = () => {
      if (!btnHeaderSettings || !gearMenu) return;
      const rect = btnHeaderSettings.getBoundingClientRect();
      gearMenu.style.top = (rect.bottom + 10) + 'px';
      gearMenu.style.right = (window.innerWidth - rect.right) + 'px';
      gearMenu.style.left = 'auto';
    };

    if (btnHeaderSettings && gearMenu) {
      btnHeaderSettings.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = gearMenu.style.display !== 'none';
        if (!isOpen) {
          positionGearMenu();
          const officer = this.currentOfficer || this.currentAccount || {};
          const isNationalAdmin = Boolean(officer && (officer.username === 'admin' || officer.level === 'national' || (officer.agencyName && officer.agencyName.includes('Trung Tâm Chỉ Huy Tác Chiến Quốc Gia'))));
          const itemAdmin = document.getElementById('gearMenuItemAdmin');
          if (itemAdmin) {
            itemAdmin.style.display = isNationalAdmin ? 'flex' : 'none';
          }
          gearMenu.style.display = 'flex';
        } else {
          gearMenu.style.display = 'none';
        }
      });

      document.addEventListener('click', (e) => {
        const clickedOnGearBtn = btnHeaderSettings?.contains(e.target);
        const clickedInsideMenu = gearMenu?.contains(e.target);
        if (!clickedOnGearBtn && !clickedInsideMenu) {
          gearMenu.style.display = 'none';
        }
      });

      // Item 1: Phân Quyền & Quản Trị Hệ Thống (CHỈ DÀNH CHO ADMIN TRUNG TÂM CHỈ HUY QUỐC GIA)
      const itemAdmin = document.getElementById('gearMenuItemAdmin');
      if (itemAdmin) {
        itemAdmin.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (gearMenu) gearMenu.style.display = 'none';
          this.openAdminModal();
        });
      }


      // Item 2: Thông Tin Cán Bộ & Phân Công Kíp Trực
      const itemOfficer = document.getElementById('gearMenuItemOfficer');
      if (itemOfficer) {
        itemOfficer.addEventListener('click', (e) => {
          e.stopPropagation();
          gearMenu.style.display = 'none';
          this.openDutyShiftModal();
        });
      }

      // Item 3: Đăng Xuất Khỏi Hệ Thống -> Trở về trang Cổng Trực Ban (Cosmic Portal)
      const itemLogout = document.getElementById('gearMenuItemLogout');
      if (itemLogout) {
        itemLogout.addEventListener('click', (e) => {
          e.stopPropagation();
          this.performLogout();
        });
      }
    }

    const btnLogoutFallback = document.getElementById('btnLogoutDispatcher');
    if (btnLogoutFallback) {
      btnLogoutFallback.addEventListener('click', (e) => {
        e.stopPropagation();
        this.performLogout();
      });
    }

    const btnHeaderNotif = document.getElementById('btnHeaderNotifications');
    if (btnHeaderNotif) {
      btnHeaderNotif.addEventListener('click', () => {
        const dot = document.getElementById('headerNotifDot');
        if (dot) dot.style.display = 'none';
        alert('🔔 Thông báo hệ thống: Kênh trực ban tác chiến Quốc Gia 2026 đang hoạt động liên tục.');
      });
    }

    const btnViewAll = document.getElementById('btnViewAllIncidents');
    if (btnViewAll) {
      btnViewAll.addEventListener('click', () => {
        const tabsNav = document.getElementById('sidebarTabsNav');
        if (tabsNav) {
          tabsNav.style.display = tabsNav.style.display === 'none' ? 'flex' : 'none';
        }
      });
    }

    // 5. Interactive Map Controls: Style Selector Popup
    const stylePill = document.getElementById('mapStyleSelectorPill');
    const styleDropdown = document.getElementById('mapStyleCustomDropdown');
    if (stylePill && styleDropdown) {
      stylePill.addEventListener('click', (e) => {
        if (e.target.closest('#mapStyleCustomDropdown')) return;
        e.stopPropagation();
        const isHidden = styleDropdown.style.display === 'none' || styleDropdown.style.display === '';
        styleDropdown.style.display = isHidden ? 'flex' : 'none';
        if (isHidden) {
          this.adjustMapStyleDropdownHeight();
          const chkWards = document.getElementById('chkToggleAllWards');
          if (chkWards) chkWards.checked = Boolean(this.allWardsVisible);
          const chkProvinces = document.getElementById('chkToggleProvinces');
          if (chkProvinces && this.mapController) {
            chkProvinces.checked = this.mapController.provinceBoundariesVisible !== false;
          }
          this.loadNationalBandoSyncStatus();
        }
      });

      window.addEventListener('resize', () => {
        if (styleDropdown && styleDropdown.style.display !== 'none') {
          this.adjustMapStyleDropdownHeight();
        }
      });

      document.addEventListener('click', (e) => {
        if (!stylePill.contains(e.target)) {
          styleDropdown.style.display = 'none';
        }
      });

      styleDropdown.querySelectorAll('.map-style-opt').forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.stopPropagation();
          const source = opt.dataset.source;
          const name = opt.dataset.name;
          const icon = opt.dataset.icon;
          if (this.mapController) {
            this.mapController.switchTileLayer(source);
          }
          const curName = document.getElementById('currentMapStyleName');
          const curIcon = document.getElementById('currentMapStyleIcon');
          if (curName) curName.textContent = name + ' ⌵';
          if (curIcon) curIcon.textContent = icon;
          styleDropdown.querySelectorAll('.map-style-opt').forEach(o => o.classList.remove('is-active'));
          opt.classList.add('is-active');
          styleDropdown.style.display = 'none';
        });
      });
    }

    // 6. Interactive Map Controls: Zoom and Compass
    const btnZoomIn = document.getElementById('btnMapZoomIn');
    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', () => {
        if (this.mapController?.map) this.mapController.map.zoomIn();
      });
    }

    const btnZoomOut = document.getElementById('btnMapZoomOut');
    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', () => {
        if (this.mapController?.map) this.mapController.map.zoomOut();
      });
    }

    const compassWidget = document.getElementById('mapCompassWidget');
    if (compassWidget) {
      compassWidget.addEventListener('click', () => {
        if (this.mapController?.map) {
          this.mapController.map.resetNorthPitch({ duration: 600 });
        }
      });
    }

    // 7. Interactive Map Controls: Vertical Toolbar
    const btnToggleMapLayers = document.getElementById('btnToggleMapLayers');
    if (btnToggleMapLayers) {
      btnToggleMapLayers.addEventListener('click', (e) => {
        e.stopPropagation();
        if (styleDropdown) {
          styleDropdown.style.display = styleDropdown.style.display === 'none' ? 'flex' : 'none';
        }
      });
    }

    const btnMapCenterGps = document.getElementById('btnMapCenterGps');
    if (btnMapCenterGps) {
      btnMapCenterGps.addEventListener('click', () => {
        this.autoLocateCurrentPosition(true);
      });
    }

    const btnToggleWardsGrid = document.getElementById('btnToggleWardsGrid');
    if (btnToggleWardsGrid) {
      btnToggleWardsGrid.addEventListener('click', () => {
        const toggleAll = document.getElementById('btnToggleAllWardsNetwork');
        if (toggleAll) toggleAll.click();
      });
    }

    // 8. Map Top Stats Bar Filters
    const statPills = document.querySelectorAll('.stat-card-btn');
    statPills.forEach(pill => {
      pill.addEventListener('click', () => {
        statPills.forEach(p => p.classList.remove('is-active'));
        pill.classList.add('is-active');
        const agency = pill.dataset.statAgency || 'all';
        this.filterAgency = agency;
        this.renderQueue();
      });
    });

    // 9. Tactical Bottom Dock Emergency Filter
    const dockEmerg = document.getElementById('dockEmergencyPill');
    if (dockEmerg) {
      dockEmerg.addEventListener('click', () => {
        const urgentPill = document.getElementById('statUrgentPill');
        if (urgentPill) urgentPill.click();
      });
    }
  }

  performLogout() {
    try {
      fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
    } catch (e) {}
    this.playLogoutOutroVideo();
  }

  // =========================================================================
  // LOGOUT OUTRO CINEMATIC (Video 1 - Transition on logout back to Gatekeeper)
  // =========================================================================
  playLogoutOutroVideo() {
    // 1. Clear officer & gatekeeper pass session data
    sessionStorage.removeItem('sos_dispatcher_officer');
    localStorage.removeItem('sos_dispatcher_officer');
    sessionStorage.removeItem('sos_gatekeeper_pass');
    sessionStorage.removeItem('sos_cyber_gatekeeper_passed');
    this.currentOfficer = null;
    if (this.eventSource) {
      try { this.eventSource.close(); } catch(e) {}
      this.eventSource = null;
    }
    this.clearActiveSelectionAndMap();

    // 2. Hide operational UI immediately
    document.body.classList.remove('officer-authenticated');

    // 3. Close gear dropdown & any open modals
    const gearMenu = document.getElementById('gearDropdownMenu');
    if (gearMenu) gearMenu.style.display = 'none';

    const adminModal = document.getElementById('adminOfficerModal') || this.adminOfficerModal;
    if (adminModal) adminModal.style.display = 'none';
    const dutyModal = document.getElementById('dutyShiftModal') || this.dutyShiftModal;
    if (dutyModal) dutyModal.style.display = 'none';
    const subModal = document.getElementById('substituteOfficerModal') || this.substituteOfficerModal;
    if (subModal) subModal.style.display = 'none';
    const authModal = document.getElementById('authGateModal') || this.authGateModal;
    if (authModal) {
      authModal.style.display = 'none';
      authModal.style.setProperty('display', 'none', 'important');
    }
    const portal = document.getElementById('cosmicPortalView') || this.cosmicPortalView;
    if (portal) {
      portal.style.display = 'none';
      portal.style.setProperty('display', 'none', 'important');
    }

    // Reset login inputs
    if (this.loginUsername) this.loginUsername.value = '';
    if (this.loginPassword) this.loginPassword.value = '';
    if (this.loginErrorMsg) this.loginErrorMsg.style.display = 'none';
    if (this.gatekeeperPasswordInput) this.gatekeeperPasswordInput.value = '';

    const overlay = document.getElementById('cyberLogoutVideoOverlay');
    const video = document.getElementById('cyberLogoutVideo');
    const mobileCard = document.getElementById('cyberLogoutMobileCard');
    const progressBar = document.getElementById('cyberLogoutProgressBar');

    const finishLogout = () => {
      if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.style.display = 'none';
          try { if (video) video.pause(); } catch(e) {}
        }, 650);
      }
      // Return to Level-0 Cyber Gatekeeper Modal
      this.checkAuth();
    };

    if (!overlay) {
      finishLogout();
      return;
    }

    overlay.style.display = 'flex';
    overlay.style.setProperty('display', 'flex', 'important');
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
    });

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     window.innerWidth <= 820 || 
                     ('ontouchstart' in window && window.innerWidth <= 1024);

    if (isMobile) {
      if (video) {
        try { video.pause(); } catch(e) {}
        video.style.display = 'none';
      }
      if (mobileCard) {
        mobileCard.style.display = 'flex';
      }
      if (progressBar) {
        progressBar.style.width = '0%';
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (progressBar) progressBar.style.width = '100%';
          }, 50);
        });
      }
      setTimeout(finishLogout, 1250);
      return;
    }

    if (mobileCard) mobileCard.style.display = 'none';
    if (video) {
      video.style.display = 'block';
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.currentTime = 0;
      let finished = false;
      const onEnd = () => {
        if (finished) return;
        finished = true;
        finishLogout();
      };

      video.onended = onEnd;
      video.onerror = onEnd;
      overlay.onclick = onEnd;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Logout video playback blocked, falling back:', err);
          video.muted = true;
          video.play().catch(() => onEnd());
        });
      }
    } else {
      finishLogout();
    }
  }

  initDutyShiftAndSubstitute() {
    this.dutyShiftModal = document.getElementById('dutyShiftModal');
    this.substituteOfficerModal = document.getElementById('substituteOfficerModal');
    this.formDutyShift = document.getElementById('formDutyShift');
    this.formSubstituteOfficer = document.getElementById('formSubstituteOfficer');

    const btnOpenShift = document.getElementById('btnOpenDutyShiftModal');
    if (btnOpenShift) {
      btnOpenShift.addEventListener('click', () => this.openDutyShiftModal());
    }

    const headerPill = document.getElementById('headerDutyShiftPill');
    if (headerPill) {
      headerPill.addEventListener('click', () => this.openDutyShiftModal());
    }

    const btnCloseShift = document.getElementById('btnCloseDutyShiftModal');
    if (btnCloseShift) {
      btnCloseShift.addEventListener('click', () => {
        if (this.dutyShiftModal) this.dutyShiftModal.style.display = 'none';
      });
    }

    const btnSwitchSub = document.getElementById('btnSwitchToSubstitute');
    if (btnSwitchSub) {
      btnSwitchSub.addEventListener('click', () => {
        if (this.dutyShiftModal) this.dutyShiftModal.style.display = 'none';
        this.openSubstituteModal();
      });
    }

    const btnBackMain = document.getElementById('btnBackToMainDutyShift');
    if (btnBackMain) {
      btnBackMain.addEventListener('click', () => {
        if (this.substituteOfficerModal) this.substituteOfficerModal.style.display = 'none';
        this.openDutyShiftModal();
      });
    }

    const btnOpenSub = document.getElementById('btnOpenSubstituteModal');
    if (btnOpenSub) {
      btnOpenSub.addEventListener('click', () => this.openSubstituteModal());
    }

    const btnCloseSub = document.getElementById('btnCloseSubstituteModal');
    if (btnCloseSub) {
      btnCloseSub.addEventListener('click', () => {
        if (this.substituteOfficerModal) this.substituteOfficerModal.style.display = 'none';
      });
    }

    // Duty Shift form duration calculation & helper button
    const startInput = document.getElementById('shiftStartTime');
    const endInput = document.getElementById('shiftEndTime');
    const durationText = document.getElementById('shiftDurationCalcText');
    const btnSetCurrentVnTime = document.getElementById('btnSetCurrentVnTime');

    const updateShiftDuration = () => {
      if (!startInput || !endInput || !durationText) return;
      const sVal = startInput.value || '07:00';
      const eVal = endInput.value || '15:00';
      const [sH, sM] = sVal.split(':').map(Number);
      const [eH, eM] = eVal.split(':').map(Number);
      let sMin = (sH || 0) * 60 + (sM || 0);
      let eMin = (eH || 0) * 60 + (eM || 0);
      if (eMin <= sMin) eMin += 24 * 60; // Ca qua đêm
      const diff = eMin - sMin;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      durationText.textContent = `⏳ Thời lượng: ${hours} tiếng ${mins > 0 ? `${mins} phút` : ''} (Giờ VN)`;
    };

    if (startInput) startInput.addEventListener('input', updateShiftDuration);
    if (endInput) endInput.addEventListener('input', updateShiftDuration);

    if (btnSetCurrentVnTime) {
      btnSetCurrentVnTime.addEventListener('click', () => {
        const now = new Date();
        const curH = String(now.getHours()).padStart(2, '0');
        const curM = String(now.getMinutes()).padStart(2, '0');
        const endH = String((now.getHours() + 8) % 24).padStart(2, '0');
        if (startInput) startInput.value = `${curH}:${curM}`;
        if (endInput) endInput.value = `${endH}:${curM}`;
        updateShiftDuration();
      });
    }

    if (this.formDutyShift) {
      this.formDutyShift.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = (document.getElementById('shiftOfficerName')?.value || '').trim();
        const rank = (document.getElementById('shiftOfficerRank')?.value || '').trim();
        const phone = (document.getElementById('shiftOfficerPhone')?.value || '').trim();
        const sms = (document.getElementById('shiftOfficerSms')?.value || '').trim() || phone;
        const startTime = document.getElementById('shiftStartTime')?.value || '07:00';
        const endTime = document.getElementById('shiftEndTime')?.value || '15:00';

        this.currentDutyShift = {
          officerName: name,
          officerRank: rank,
          officerPhone: phone,
          officerSms: sms,
          startTime,
          endTime,
          isSubstitute: false,
          updatedAt: new Date().toISOString()
        };

        this.shiftExpiredNotified = false;

        if (!this.currentOfficer) {
          this.currentOfficer = {
            username: 'duty_officer',
            officerName: name,
            officerRank: rank,
            officerPhone: phone,
            officerSms: sms
          };
        } else {
          this.currentOfficer.officerName = name;
          this.currentOfficer.officerRank = rank;
          this.currentOfficer.officerPhone = phone;
          this.currentOfficer.officerSms = sms;
        }

        // Persist to storage
        sessionStorage.setItem('sos_duty_shift', JSON.stringify(this.currentDutyShift));
        localStorage.setItem('sos_duty_shift', JSON.stringify(this.currentDutyShift));
        sessionStorage.setItem('SOS_ACTIVE_DUTY_SHIFT', JSON.stringify(this.currentDutyShift));
        localStorage.setItem('SOS_ACTIVE_DUTY_SHIFT', JSON.stringify(this.currentDutyShift));
        sessionStorage.setItem('sos_dispatcher_officer', JSON.stringify(this.currentOfficer));
        localStorage.setItem('sos_dispatcher_officer', JSON.stringify(this.currentOfficer));
        if (this.currentOfficer.username) {
          sessionStorage.setItem('sos_duty_shift_' + this.currentOfficer.username, JSON.stringify(this.currentDutyShift));
          localStorage.setItem('sos_duty_shift_' + this.currentOfficer.username, JSON.stringify(this.currentDutyShift));
        }

        // Sync to server
        fetch('/api/dispatcher/duty-shift', {
          method: 'POST',
          headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(this.currentDutyShift)
        }).catch(err => console.warn('Could not sync duty shift to server:', err));

        this.applyDutyShift(this.currentDutyShift);
        if (this.dutyShiftModal) this.dutyShiftModal.style.display = 'none';
        const msg = `✅ Đã phân công Kíp Trực Ban: ${rank} ${name} (${startTime} - ${endTime})`;
        console.log(msg);
        try {
          const toast = document.createElement('div');
          toast.className = 'tactical-toast-notice';
          toast.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 100050; background: rgba(15,23,42,0.95); border: 1px solid #38bdf8; color: #38bdf8; padding: 12px 20px; border-radius: 12px; font-weight: 700; font-size: 13px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); transition: all 0.3s ease;';
          toast.textContent = msg;
          document.body.appendChild(toast);
          setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3500);
        } catch (_) {}
      });
    }

    if (this.formSubstituteOfficer) {
      this.formSubstituteOfficer.addEventListener('submit', (e) => {
        e.preventDefault();
        const subName = (document.getElementById('subOfficerName')?.value || '').trim();
        const subRank = (document.getElementById('subOfficerRank')?.value || '').trim();
        const subPhone = (document.getElementById('subOfficerPhone')?.value || '').trim();
        const reason = (document.getElementById('subOfficerReason')?.value || '').trim();

        this.currentDutyShift = this.currentDutyShift || {};
        this.currentDutyShift.substitute = {
          officerName: subName,
          officerRank: subRank,
          officerPhone: subPhone,
          reason
        };
        this.currentDutyShift.isSubstitute = true;
        this.currentDutyShift.updatedAt = new Date().toISOString();

        sessionStorage.setItem('sos_duty_shift', JSON.stringify(this.currentDutyShift));
        localStorage.setItem('sos_duty_shift', JSON.stringify(this.currentDutyShift));
        sessionStorage.setItem('SOS_ACTIVE_DUTY_SHIFT', JSON.stringify(this.currentDutyShift));
        localStorage.setItem('SOS_ACTIVE_DUTY_SHIFT', JSON.stringify(this.currentDutyShift));
        if (this.currentOfficer?.username) {
          sessionStorage.setItem('sos_duty_shift_' + this.currentOfficer.username, JSON.stringify(this.currentDutyShift));
          localStorage.setItem('sos_duty_shift_' + this.currentOfficer.username, JSON.stringify(this.currentDutyShift));
        }

        fetch('/api/dispatcher/duty-shift', {
          method: 'POST',
          headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(this.currentDutyShift)
        }).catch(err => console.warn('Could not sync substitute shift to server:', err));

        this.applyDutyShift(this.currentDutyShift);
        if (this.substituteOfficerModal) this.substituteOfficerModal.style.display = 'none';
        const subMsg = `🔄 Đã kích hoạt trực thay: ${subRank} ${subName} (Lý do: ${reason})`;
        console.log(subMsg);
        try {
          const toast = document.createElement('div');
          toast.className = 'tactical-toast-notice';
          toast.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 100050; background: rgba(15,23,42,0.95); border: 1px solid #f59e0b; color: #fbbf24; padding: 12px 20px; border-radius: 12px; font-weight: 700; font-size: 13px; box-shadow: 0 10px 30px rgba(0,0,0,0.8); transition: all 0.3s ease;';
          toast.textContent = subMsg;
          document.body.appendChild(toast);
          setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3500);
        } catch (_) {}
      });
    }

    this.restoreDutyShift();
  }

  openSubstituteModal() {
    if (!this.substituteOfficerModal) return;
    if (this.currentDutyShift && this.currentDutyShift.substitute) {
      if (document.getElementById('subOfficerName')) document.getElementById('subOfficerName').value = this.currentDutyShift.substitute.officerName || '';
      if (document.getElementById('subOfficerRank')) document.getElementById('subOfficerRank').value = this.currentDutyShift.substitute.officerRank || '';
      if (document.getElementById('subOfficerPhone')) document.getElementById('subOfficerPhone').value = this.currentDutyShift.substitute.officerPhone || '';
      if (document.getElementById('subOfficerReason')) document.getElementById('subOfficerReason').value = this.currentDutyShift.substitute.reason || '';
    }
    this.substituteOfficerModal.style.display = 'flex';
  }

  openDutyShiftModal() {
    if (!this.dutyShiftModal) return;
    const activeName = this.currentDutyShift?.officerName || this.currentOfficer?.officerName || '';
    const activeRank = this.currentDutyShift?.officerRank || this.currentOfficer?.officerRank || '';
    const activePhone = this.currentDutyShift?.officerPhone || this.currentOfficer?.officerPhone || '';
    const activeSms = this.currentDutyShift?.officerSms || this.currentOfficer?.officerSms || '';

    if (document.getElementById('shiftOfficerName')) document.getElementById('shiftOfficerName').value = activeName;
    if (document.getElementById('shiftOfficerRank')) document.getElementById('shiftOfficerRank').value = activeRank;
    if (document.getElementById('shiftOfficerPhone')) document.getElementById('shiftOfficerPhone').value = activePhone;
    if (document.getElementById('shiftOfficerSms')) document.getElementById('shiftOfficerSms').value = activeSms;

    // Live Vietnam Clock in modal
    const liveClockEl = document.getElementById('shiftVnLiveClock');
    if (liveClockEl) {
      const now = new Date();
      liveClockEl.textContent = `🇻🇳 ${now.toLocaleTimeString('vi-VN', { hour12: false })} (ICT UTC+7)`;
    }

    const inputStart = document.getElementById('shiftStartTime');
    const inputEnd = document.getElementById('shiftEndTime');
    const durationText = document.getElementById('shiftDurationCalcText');

    if (this.currentDutyShift && this.currentDutyShift.startTime) {
      if (inputStart) inputStart.value = this.currentDutyShift.startTime;
      if (inputEnd) inputEnd.value = this.currentDutyShift.endTime;
    } else {
      const now = new Date();
      const curH = String(now.getHours()).padStart(2, '0');
      const endH = String((now.getHours() + 8) % 24).padStart(2, '0');
      if (inputStart) inputStart.value = `${curH}:00`;
      if (inputEnd) inputEnd.value = `${endH}:00`;
    }

    if (inputStart && inputEnd && durationText) {
      const sVal = inputStart.value || '07:00';
      const eVal = inputEnd.value || '15:00';
      const [sH, sM] = sVal.split(':').map(Number);
      const [eH, eM] = eVal.split(':').map(Number);
      let sMin = (sH || 0) * 60 + (sM || 0);
      let eMin = (eH || 0) * 60 + (eM || 0);
      if (eMin <= sMin) eMin += 24 * 60;
      const diff = eMin - sMin;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      durationText.textContent = `⏳ Thời lượng: ${hours} tiếng ${mins > 0 ? `${mins} phút` : ''} (Giờ VN)`;
    }

    this.dutyShiftModal.style.display = 'flex';
  }

  applyDutyShift(shift) {
    if (!shift) return;
    const dutyTag = document.getElementById('dutyStatusTag');
    const headerName = document.getElementById('headerOfficerName');
    const headerBadge = document.getElementById('headerDutyBadge');
    const headerShiftTime = document.getElementById('headerDutyShiftTime');

    if (shift.isSubstitute && shift.substitute) {
      const sub = shift.substitute;
      if (this.officerRankTitle) this.officerRankTitle.textContent = sub.officerRank;
      if (this.officerName) this.officerName.textContent = `${sub.officerName} (Trực Thay)`;
      if (this.officerPhone) this.officerPhone.textContent = sub.officerPhone;
      if (dutyTag) {
        dutyTag.textContent = 'TRỰC THAY';
        dutyTag.style.background = '#f59e0b';
      }
      if (headerName) headerName.textContent = `${sub.officerRank || ''} ${sub.officerName || ''}`.trim() || 'Trực Thay';
      if (headerBadge) {
        headerBadge.textContent = 'TRỰC THAY';
        headerBadge.style.background = '#f59e0b';
      }
    } else {
      const rank = shift.officerRank || this.currentOfficer?.officerRank || 'Cán bộ';
      const name = shift.officerName || this.currentOfficer?.officerName || 'Trực Ban Tác Chiến';
      const phone = shift.officerPhone || this.currentOfficer?.officerPhone || '113';

      if (this.officerRankTitle) this.officerRankTitle.textContent = rank;
      if (this.officerName) this.officerName.textContent = name;
      if (this.officerPhone) this.officerPhone.textContent = phone;
      if (dutyTag) {
        dutyTag.textContent = 'TRỰC BAN';
        dutyTag.style.background = '#10b981';
      }
      if (headerName) headerName.textContent = rank ? `${rank} ${name}` : name;
      if (headerBadge) {
        headerBadge.textContent = 'TRỰC BAN';
        headerBadge.style.background = '#10b981';
      }
    }

    const shiftDisplay = document.getElementById('dutyShiftDisplay');
    const timeStr = `Ca: ${shift.startTime || '07:00'} - ${shift.endTime || '15:00'}`;
    if (shiftDisplay) shiftDisplay.textContent = timeStr;
    if (headerShiftTime) headerShiftTime.textContent = timeStr;
  }

  async restoreDutyShift() {
    try {
      let saved = sessionStorage.getItem('SOS_ACTIVE_DUTY_SHIFT') ||
                  localStorage.getItem('SOS_ACTIVE_DUTY_SHIFT') ||
                  sessionStorage.getItem('sos_duty_shift') ||
                  localStorage.getItem('sos_duty_shift');
      if (!saved && this.currentOfficer?.username) {
        saved = sessionStorage.getItem('sos_duty_shift_' + this.currentOfficer.username) ||
                localStorage.getItem('sos_duty_shift_' + this.currentOfficer.username);
      }
      if (saved) {
        try {
          this.currentDutyShift = JSON.parse(saved);
          this.applyDutyShift(this.currentDutyShift);
        } catch (e) {}
      }

      const res = await fetch('/api/dispatcher/duty-shift', {
        headers: this.getAuthHeaders()
      });
      const data = await res.json();
      if (data.ok && data.dutyShift) {
        this.currentDutyShift = data.dutyShift;
        sessionStorage.setItem('sos_duty_shift', JSON.stringify(this.currentDutyShift));
        localStorage.setItem('sos_duty_shift', JSON.stringify(this.currentDutyShift));
        sessionStorage.setItem('SOS_ACTIVE_DUTY_SHIFT', JSON.stringify(this.currentDutyShift));
        localStorage.setItem('SOS_ACTIVE_DUTY_SHIFT', JSON.stringify(this.currentDutyShift));
        if (this.currentOfficer) {
          this.currentOfficer.officerName = this.currentDutyShift.officerName || this.currentOfficer.officerName;
          this.currentOfficer.officerRank = this.currentDutyShift.officerRank || this.currentOfficer.officerRank;
          this.currentOfficer.officerPhone = this.currentDutyShift.officerPhone || this.currentOfficer.officerPhone;
          this.currentOfficer.officerSms = this.currentDutyShift.officerSms || this.currentOfficer.officerSms;
        }
        this.applyDutyShift(this.currentDutyShift);
      }
    } catch (e) {
      console.warn('restoreDutyShift error:', e);
    }
  }

  getAuthHeaders(extra = {}) {
    const headers = { 'Content-Type': 'application/json', ...extra };
    if (this.currentOfficer?.token) {
      headers['Authorization'] = `Bearer ${this.currentOfficer.token}`;
    }
    return headers;
  }

  applyOfficerProfile(officer) {
    const theme = officer.theme || 'theme-police';
    const isAuth = document.body.classList.contains('officer-authenticated');
    const tacClasses = Array.from(document.body.classList).filter(c => c.startsWith('tac-')).join(' ');
    document.body.className = theme + (isAuth ? ' officer-authenticated' : '') + (tacClasses ? ' ' + tacClasses : '');
    if (window.TacticalLayout) window.TacticalLayout.refresh();

    if (this.headerBrandIcon) {
      if (officer.username === 'admin') {
        // Admin: show personal logo
        const isVinhAn = (officer.officerName || '').includes('Điền Trần Vĩnh An');
        const adminLogo = isVinhAn ? '/assets/icons/logo-police-round-an.png' : '/assets/icons/logo-admin-login.png';
        this.headerBrandIcon.innerHTML = `<img src="${adminLogo}" style="width: 34px; height: 34px; object-fit: contain; border-radius: 50%; box-shadow: 0 0 12px rgba(59,130,246,0.5);" alt="Logo Chỉ Huy">`;
        if (this.headerBrandAgencyCode) this.headerBrandAgencyCode.style.display = 'none';
      } else {
        // Other agencies: show their official logo
        const agencyLogoMap = {
          police: '/assets/icons/logo-bocongan.png',
          csgt: '/assets/icons/logo-csgt.png',
          fire: '/assets/icons/logo-pccc.png',
          hospital: '/assets/icons/logo-medical.png',
          'traffic-rescue': '/assets/icons/logo-traffic-rescue.png'
        };
        const agencyLogo = agencyLogoMap[officer.agency] || null;
        if (agencyLogo) {
          this.headerBrandIcon.innerHTML = `<img src="${agencyLogo}" style="width: 34px; height: 34px; object-fit: contain; border-radius: 50%;" alt="Logo">`;
          if (this.headerBrandAgencyCode) this.headerBrandAgencyCode.style.display = 'none';
        } else {
          this.headerBrandIcon.textContent = officer.badgeIcon || 'CA';
          if (this.headerBrandAgencyCode) this.headerBrandAgencyCode.style.display = '';
        }
      }
    }
    if (this.headerBrandTitle) this.headerBrandTitle.textContent = officer.agencyName || 'TRUNG TÂM TIẾP NHẬN & ĐIỀU PHỐI SOS';

    if (this.dutyAvatar) {
      if (officer.agency === 'all' || officer.username === 'admin') {
        const isVinhAnAvatar = (officer.officerName || '').includes('Điền Trần Vĩnh An');
        const avatarLogo = isVinhAnAvatar ? '/assets/icons/logo-police-round-an.png' : '/assets/icons/logo-admin-login.png';
        this.dutyAvatar.innerHTML = `<img src="${avatarLogo}" style="width: 34px; height: 34px; object-fit: contain; border-radius: 50%; box-shadow: 0 0 10px rgba(59,130,246,0.7);" alt="Avatar">`;
      } else {
        this.dutyAvatar.textContent = officer.badgeIcon || 'CA';
      }
    }
    if (this.officerRankTitle) this.officerRankTitle.textContent = officer.officerRank || 'Cán bộ';
    if (this.officerName) this.officerName.textContent = officer.officerName || officer.username;
    if (this.officerPhone) this.officerPhone.textContent = officer.officerPhone || '113';

    // Update Header Location / Agency Widget to accurately match officer's unit identity
    const locPrimary = document.getElementById('locationPrimaryVal');
    const locSecondary = document.getElementById('locationSecondaryVal');
    const gpsDot = document.getElementById('locationGpsLiveDot');
    if (locPrimary && locSecondary) {
      if (officer.level === 'national' || officer.username === 'admin') {
        locPrimary.textContent = officer.unitName || officer.agencyName || 'TT. Chỉ Huy Tác Chiến Quốc Gia';
        locSecondary.textContent = 'Bộ Công An · Cấp Quốc Gia';
      } else if (officer.level === 'province') {
        locPrimary.textContent = officer.unitName || officer.agencyName || ('Công An ' + officer.province);
        locSecondary.textContent = (officer.province || '') + ' (Trụ Sở Bộ Chỉ Huy)';
      } else if (officer.level === 'ward') {
        locPrimary.textContent = officer.unitName || officer.agencyName || ('Công An ' + (officer.ward || 'Cấp Xã/Phường'));
        locSecondary.textContent = (officer.province ? (officer.province + ' · Trụ sở địa bàn') : (officer.address || 'Trụ sở đơn vị'));
      } else {
        locPrimary.textContent = officer.unitName || officer.agencyName || 'Trung tâm Chỉ huy';
        locSecondary.textContent = officer.address || officer.province || 'Hệ thống SOS';
      }
      if (gpsDot) gpsDot.style.display = 'inline-block';
    }

    // Update Station Tab Title based on agency (Compact labels to fit perfectly)
    const tabStationsTitle = document.getElementById('tabStationsTitle');
    if (tabStationsTitle) {
      if (officer.agency === 'police') tabStationsTitle.textContent = 'Công An';
      else if (officer.agency === 'csgt') tabStationsTitle.textContent = 'CSGT';
      else if (officer.agency === 'fire') tabStationsTitle.textContent = 'PCCC';
      else if (officer.agency === 'hospital') tabStationsTitle.textContent = 'Trạm 115';
      else if (officer.agency === 'traffic-rescue') tabStationsTitle.textContent = 'Cứu Hộ';
      else tabStationsTitle.textContent = 'Danh Bạ';
    }

    // Auto set agency filter & STRICT ISOLATION
    if (officer.agency && officer.agency !== 'all') {
      this.filterAgency = officer.agency;
      this.agencyFilterButtons.forEach(b => {
        if (b.dataset.filter === officer.agency) {
          b.style.display = 'inline-block';
          b.classList.add('is-active');
        } else {
          b.style.display = 'none'; // Strictly hide other agencies and 'Tất cả' for regular officers
          b.classList.remove('is-active');
        }
      });
    } else {
      this.agencyFilterButtons.forEach(b => b.style.display = 'inline-block');
    }

    // Admin Command Center Stats Banner & Enterprise/Hospital Management Tabs
    const statsBanner = document.getElementById('adminStatsBanner');
    const tabEnterprises = document.getElementById('tabBtnEnterprises');
    const tabHospitals = document.getElementById('tabBtnHospitals');
    const btnAdmin = document.getElementById('btnOpenAdminModal');
    const btnAddNewStationPick = document.getElementById('btnAddNewStationPick');
    const btnAdminAddStationOnMap = document.getElementById('btnAdminAddStationOnMap');
    // STRICT: Only National Command Center Admin ('admin') has Permission & Management authority
    const isNationalAdmin = Boolean(officer && (officer.username === 'admin' || officer.level === 'national' || (officer.agencyName && officer.agencyName.includes('Trung Tâm Chỉ Huy Tác Chiến Quốc Gia'))));
    const gearMenuItemAdmin = document.getElementById('gearMenuItemAdmin');
    if (gearMenuItemAdmin) {
      gearMenuItemAdmin.style.display = isNationalAdmin ? 'flex' : 'none';
    }

    if (btnAddNewStationPick) {
      btnAddNewStationPick.style.display = isNationalAdmin ? 'block' : 'none';
    }
    if (btnAdminAddStationOnMap) {
      btnAdminAddStationOnMap.style.display = isNationalAdmin ? 'inline-block' : 'none';
    }

    if (isNationalAdmin) {
      if (statsBanner) statsBanner.style.display = 'block';
      if (tabEnterprises) tabEnterprises.style.display = 'inline-flex';
      if (tabHospitals) tabHospitals.style.display = 'inline-flex';
      if (btnAdmin) btnAdmin.style.display = 'inline-flex';
      this.loadAdminStats();
    } else {
      if (statsBanner) statsBanner.style.display = 'none';
      if (tabEnterprises) tabEnterprises.style.display = 'none';
      if (tabHospitals) tabHospitals.style.display = 'none';
      if (btnAdmin) btnAdmin.style.display = 'none';
    }


    // Auto-focus officer jurisdiction region and load stations
    if (officer.province && officer.province !== 'Toàn Quốc' && officer.province !== 'Cấp Quốc Gia' && officer.username !== 'admin') {
      this.selectedStationRegion = officer.province;
      if (this.mapController) {
        // Cách 1 & 2: Local units load local stations filtered by agency & province from in-memory cache
        this.mapController.loadAllStationsMarkers(this.selectedStationRegion, officer.agency, false);
        const oLng = officer.stationLng || officer.lng;
        const oLat = officer.stationLat || officer.lat;
        if (oLng && oLat) {
          this.mapController.map?.flyTo({ center: [oLng, oLat], zoom: 14, duration: 1200 });
        } else if (officer.province.toLowerCase().includes('hà nội')) {
          this.mapController.map?.flyTo({ center: [105.850, 21.028], zoom: 13.5, duration: 1200 });
        } else if (officer.province.toLowerCase().includes('hồ chí minh')) {
          this.mapController.map?.flyTo({ center: [106.695, 10.772], zoom: 13.5, duration: 1200 });
        } else if (officer.province.toLowerCase().includes('cần thơ')) {
          this.mapController.map?.flyTo({ center: [105.775, 10.035], zoom: 13.5, duration: 1200 });
        }
      }
    } else {
      this.selectedStationRegion = 'all';
      if (this.mapController) {
        // Clean all overlays, boundaries, pins, routes, and incident markers
        this.mapController.clearWardBoundary();
        this.mapController.clearActiveWardPin();
        this.mapController.clearIncidentMarkers();
        // Admin loads clustered national stations with 0ms DOM overhead
        this.mapController.loadAllStationsMarkers('all', 'all', true);

        // Position camera to clean national Vietnam overview (no auto-click/zoom)
        const isMobile = window.innerWidth <= 768;
        this.mapController.map?.jumpTo({
          center: [107.0, 16.2],
          zoom: isMobile ? 4.85 : 5.2,
          pitch: 0,
          bearing: 0
        });
      }

      // Deselect any incident, prevent auto-selection, and close drawer
      this.selectedIncidentId = null;
      this.hasInitialSelected = true;
      this.isUserClosedDrawer = true;
      const drawer = this.activeIncidentDrawer || document.getElementById('activeIncidentDrawer');
      if (drawer) {
        drawer.classList.add('is-hidden');
        drawer.style.display = 'none';
        drawer.style.setProperty('display', 'none', 'important');
      }
      this.hideWardHud?.();

      // Remove GPS radar pulse marker from map if present
      if (this.userGpsMarker) {
        try { this.userGpsMarker.remove(); } catch (e) {}
        this.userGpsMarker = null;
      }
    }

    this.renderQueue();
    this.renderStationsDirectory();
  }

  initAdminModal() {
    this.adminOfficerModal = document.getElementById('adminOfficerModal');
    this.btnOpenAdminModal = document.getElementById('btnOpenAdminModal');
    this.btnCloseAdminModal = document.getElementById('btnCloseAdminModal');
    this.btnExportAccountsExcel = document.getElementById('btnExportAccountsExcel');
    this.btnImportAccountsExcel = document.getElementById('btnImportAccountsExcel');
    this.inputImportAccountsExcelFile = document.getElementById('inputImportAccountsExcelFile');
    this.adminAccountsListContainer = document.getElementById('adminAccountsListContainer');
    this.inputSearchAdminAccounts = document.getElementById('inputSearchAdminAccounts');
    this.selectFilterAdminAgency = document.getElementById('selectFilterAdminAgency');
    
    // Create / Edit modal elements
    this.btnAdminOpenCreateAccountModal = document.getElementById('btnAdminOpenCreateAccountModal');
    this.adminAccountEditModal = document.getElementById('adminAccountEditModal');
    this.btnCloseAdminAccountEditModal = document.getElementById('btnCloseAdminAccountEditModal');
    this.btnCancelAdminAccountEdit = document.getElementById('btnCancelAdminAccountEdit');
    this.formAdminSaveAccount = document.getElementById('formAdminSaveAccount');
    this.adminAccountEditTitle = document.getElementById('adminAccountEditTitle');
    this.editingAccountUsername = null;
    this.accountsList = [];

    if (this.btnOpenAdminModal) {
      this.btnOpenAdminModal.addEventListener('click', async (e) => {
        if (e) e.stopPropagation();
        const modal = document.getElementById('adminOfficerModal') || this.adminOfficerModal;
        if (modal) {
          modal.style.display = 'flex';
          modal.style.setProperty('display', 'flex', 'important');
        }
        await this.loadAdminAccounts();
      });
    }

    if (this.btnImportAccountsExcel && this.inputImportAccountsExcelFile) {
      this.btnImportAccountsExcel.addEventListener('click', () => {
        this.inputImportAccountsExcelFile.value = '';
        this.inputImportAccountsExcelFile.click();
      });

      this.inputImportAccountsExcelFile.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await this.importAccountsExcel(file);
      });
    }

    if (this.inputSearchAdminAccounts) {
      this.inputSearchAdminAccounts.addEventListener('input', () => {
        this.renderAdminAccountsList();
      });
    }

    if (this.selectFilterAdminAgency) {
      this.selectFilterAdminAgency.addEventListener('change', () => {
        this.renderAdminAccountsList();
      });
    }

    if (this.btnCloseAdminModal) {
      this.btnCloseAdminModal.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeAdminModal();
      });
    }

    if (this.adminOfficerModal) {
      this.adminOfficerModal.addEventListener('click', (e) => {
        if (e.target === this.adminOfficerModal) {
          this.closeAdminModal();
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAdminModal();
      }
    });

    const selectAgency = document.getElementById('editAccAgency');
    if (selectAgency) {
      selectAgency.addEventListener('change', () => {
        const isEdit = document.getElementById('editAccIsEdit')?.value === 'true';
        this.updateAdminAccountFormDynamicFields(selectAgency.value, isEdit);
      });
    }

    const uInput = document.getElementById('editAccUsername');
    const uStatus = document.getElementById('accUsernameStatusMsg');
    if (uInput) {
      uInput.addEventListener('input', () => {
        const isEdit = document.getElementById('editAccIsEdit')?.value === 'true';
        if (isEdit) {
          if (uStatus) uStatus.style.display = 'none';
          uInput.style.borderColor = '';
          return;
        }
        const val = uInput.value.trim().toLowerCase();
        if (!val) {
          if (uStatus) uStatus.style.display = 'none';
          uInput.style.borderColor = '';
          return;
        }
        const isDupe = this.accountsList && this.accountsList.some(a => (a.username || '').toLowerCase() === val);
        if (isDupe) {
          if (uStatus) {
            uStatus.style.display = 'block';
            uStatus.style.color = '#f87171';
            uStatus.textContent = `❌ Tên đăng nhập "${val}" đã tồn tại! Vui lòng chọn tên khác.`;
          }
          uInput.style.borderColor = '#ef4444';
        } else {
          if (uStatus) {
            uStatus.style.display = 'block';
            uStatus.style.color = '#34d399';
            uStatus.textContent = `✅ Tên đăng nhập hợp lệ (chưa sử dụng)`;
          }
          uInput.style.borderColor = '#10b981';
        }
      });
    }

    if (this.btnAdminOpenCreateAccountModal) {
      this.btnAdminOpenCreateAccountModal.addEventListener('click', () => {
        this.editingAccountUsername = null;
        const editTitle = document.getElementById('adminAccountEditTitle') || this.adminAccountEditTitle;
        if (editTitle) editTitle.textContent = '➕ TẠO TÀI KHOẢN ĐƠN VỊ TIẾP NHẬN MỚI';
        if (this.formAdminSaveAccount) this.formAdminSaveAccount.reset();
        
        const uInput = document.getElementById('editAccUsername');
        if (uInput) {
          uInput.readOnly = false;
          uInput.value = '';
          uInput.style.borderColor = '';
        }
        const uStatus = document.getElementById('accUsernameStatusMsg');
        if (uStatus) uStatus.style.display = 'none';

        const setVal = (id, val) => {
          const el = document.getElementById(id);
          if (el) el.value = val;
        };

        setVal('editAccIsEdit', 'false');
        setVal('editAccAgency', 'police');
        setVal('editAccLevel', 'ward');
        setVal('editAccProvince', 'Cần Thơ');
        try { this.updateAdminAccountFormDynamicFields('police', false); } catch(e) {}

        const editModal = document.getElementById('adminAccountEditModal') || this.adminAccountEditModal;
        if (editModal) {
          editModal.style.zIndex = '1000020';
          editModal.style.display = 'flex';
          editModal.style.setProperty('display', 'flex', 'important');
        }
      });
    }

    if (this.btnCloseAdminAccountEditModal) this.btnCloseAdminAccountEditModal.addEventListener('click', () => this.closeEditAccountModal());
    if (this.btnCancelAdminAccountEdit) this.btnCancelAdminAccountEdit.addEventListener('click', () => this.closeEditAccountModal());

    if (this.inputSearchAdminAccounts) {
      this.inputSearchAdminAccounts.addEventListener('input', () => this.renderAdminAccountsList());
    }
    if (this.selectFilterAdminAgency) {
      this.selectFilterAdminAgency.addEventListener('change', () => this.renderAdminAccountsList());
    }

    // Auto geocode and map picker for account modal
    const btnGeocodeAcc = document.getElementById('btnGeocodeAccAddress');
    if (btnGeocodeAcc) {
      btnGeocodeAcc.addEventListener('click', async () => {
        const addr = document.getElementById('editAccAddress')?.value.trim() || '';
        const ward = document.getElementById('editAccWard')?.value.trim() || '';
        const prov = document.getElementById('editAccProvince')?.value.trim() || 'Cần Thơ';
        const query = [addr, ward, prov].filter(Boolean).join(', ');
        if (!query) {
          alert('Vui lòng nhập địa chỉ trụ sở hoặc tên xã/phường để nhận dạng!');
          return;
        }

        const PROV_COORDS = {
          'cần thơ': { lat: 10.0355, lng: 105.7788 },
          'hà nội': { lat: 21.0285, lng: 105.8542 },
          'tp. hồ chí minh': { lat: 10.8231, lng: 106.6297 },
          'hồ chí minh': { lat: 10.8231, lng: 106.6297 },
          'đà nẵng': { lat: 16.0544, lng: 108.2022 },
          'hải phòng': { lat: 20.8449, lng: 106.6881 },
          'huế': { lat: 16.4637, lng: 107.5909 },
          'an giang': { lat: 10.5216, lng: 105.1259 },
          'đồng tháp': { lat: 10.4578, lng: 105.6322 },
          'vĩnh long': { lat: 10.2537, lng: 105.9722 },
          'hậu giang': { lat: 9.7844, lng: 105.4701 },
          'sóc trăng': { lat: 9.6033, lng: 105.9800 },
          'kiên giang': { lat: 9.9576, lng: 105.1324 },
          'cà mau': { lat: 9.1769, lng: 105.1524 },
          'bạc liêu': { lat: 9.2941, lng: 105.7278 }
        };

        const cleanKey = prov.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
        const fallback = PROV_COORDS[prov.toLowerCase()] || PROV_COORDS[cleanKey] || PROV_COORDS['cần thơ'];

        try {
          btnGeocodeAcc.disabled = true;
          btnGeocodeAcc.textContent = '⏳ Đang tìm...';
          const params = new URLSearchParams({
            q: query,
            address: addr,
            ward: ward,
            province: prov
          });
          const res = await fetch(`/api/geocode/search?${params.toString()}`);
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const d = await res.json();
          if (d && d.ok && d.lat && d.lng) {
            const lat = parseFloat(d.lat).toFixed(6);
            const lng = parseFloat(d.lng).toFixed(6);
            const inputLat = document.getElementById('editAccLat');
            const inputLng = document.getElementById('editAccLng');
            if (inputLat) inputLat.value = lat;
            if (inputLng) inputLng.value = lng;
            const wardFound = d.ward || ward || '';
            const provFound = d.province || prov || '';
            alert(`✅ Đã tìm thấy tọa độ GPS:\n• Vĩ độ (Lat): ${lat}\n• Kinh độ (Lng): ${lng}\n• Khu vực: ${wardFound ? wardFound + ', ' : ''}${provFound}`);
          } else {
            // Apply province-level safe fallback
            const lat = parseFloat(fallback.lat).toFixed(6);
            const lng = parseFloat(fallback.lng).toFixed(6);
            const inputLat = document.getElementById('editAccLat');
            const inputLng = document.getElementById('editAccLng');
            if (inputLat) inputLat.value = lat;
            if (inputLng) inputLng.value = lng;
            alert(`✅ Đã định vị theo khu vực ${prov}:\n• Vĩ độ (Lat): ${lat}\n• Kinh độ (Lng): ${lng}\n(Bạn có thể bấm "Chọn Trên Map" để tinh chỉnh vị trí)`);
          }
        } catch (e) {
          console.warn('Geocode API offline/fallback:', e);
          const lat = parseFloat(fallback.lat).toFixed(6);
          const lng = parseFloat(fallback.lng).toFixed(6);
          const inputLat = document.getElementById('editAccLat');
          const inputLng = document.getElementById('editAccLng');
          if (inputLat) inputLat.value = lat;
          if (inputLng) inputLng.value = lng;
          alert(`✅ Đã định vị theo khu vực ${prov}:\n• Vĩ độ (Lat): ${lat}\n• Kinh độ (Lng): ${lng}\n(Bạn có thể bấm "Chọn Trên Map" để tinh chỉnh vị trí)`);
        } finally {
          btnGeocodeAcc.disabled = false;
          btnGeocodeAcc.textContent = '📍 Tìm GPS Từ Địa Chỉ';
        }
      });
    }

    const btnPickAccOnMap = document.getElementById('btnPickAccLocationOnMap');
    if (btnPickAccOnMap) {
      btnPickAccOnMap.addEventListener('click', (e) => {
        e.preventDefault();
        this.openLocationPicker('account');
      });
    }

    if (this.formAdminSaveAccount) {
      this.formAdminSaveAccount.addEventListener('submit', async (e) => {
        e.preventDefault();
        const isEdit = document.getElementById('editAccIsEdit').value === 'true';
        const username = document.getElementById('editAccUsername').value.trim().toLowerCase();
        const password = document.getElementById('editAccPassword').value.trim();
        const agency = document.getElementById('editAccAgency').value;
        const level = document.getElementById('editAccLevel').value;
        const agencyName = document.getElementById('editAccAgencyName').value.trim();
        const province = document.getElementById('editAccProvince').value.trim();
        const ward = document.getElementById('editAccWard').value.trim();
        const address = document.getElementById('editAccAddress').value.trim();
        const lat = parseFloat(document.getElementById('editAccLat').value) || null;
        const lng = parseFloat(document.getElementById('editAccLng').value) || null;
        const officerRank = document.getElementById('editAccRank').value.trim();
        const officerName = document.getElementById('editAccOfficerName').value.trim();
        const officerPhone = document.getElementById('editAccPhone').value.trim();
        const officerSms = document.getElementById('editAccSms').value.trim();
        const officerEmail = document.getElementById('editAccEmail').value.trim();
        const verifiedCheckbox = document.getElementById('editAccVerified');
        const existingAccount = this.accountsList?.find(a => (a.username || '').toLowerCase() === username);
        const contactVerification = verifiedCheckbox?.checked
          ? (existingAccount?.contactVerification === 'official' ? 'official' : 'manual')
          : 'unverified';

        if (!username || (!isEdit && !password) || !agencyName) {
          alert('Vui lòng điền đầy đủ Tên đăng nhập, Mật khẩu (cho tài khoản mới) và Tên cơ quan!');
          return;
        }

        const uInput = document.getElementById('editAccUsername');
        // Duplicate username prevention on create
        if (!isEdit && this.accountsList && this.accountsList.some(a => (a.username || '').toLowerCase() === username)) {
          alert(`⚠️ Lỗi trùng lặp: Tên đăng nhập [${username.toUpperCase()}] đã tồn tại trong hệ thống!\nVui lòng chọn một tên đăng nhập khác.`);
          if (uInput) {
            uInput.focus();
            uInput.style.borderColor = '#ef4444';
          }
          return;
        }

        const payload = {
          isEdit,
          username,
          password,
          agency,
          level,
          agencyName,
          unitName: agencyName,
          province,
          ward,
          address,
          lat,
          lng,
          officerRank,
          officerName,
          officerTitle: `${officerRank} ${officerName} (Trực ban ${agencyName})`.trim(),
          officerPhone,
          officerSms,
          officerEmail,
          contactVerification,
          badgeIcon: agency === 'police' ? 'CA' : (agency === 'csgt' ? 'CS' : (agency === 'fire' ? 'PC' : (agency === 'hospital' ? 'YT' : 'CH'))),
          theme: agency === 'police' ? 'theme-police' : (agency === 'csgt' ? 'theme-csgt' : (agency === 'fire' ? 'theme-rescue' : (agency === 'hospital' ? 'theme-hospital' : 'theme-rescue')))
        };

        try {
          const res = await fetch('/api/admin/accounts/save', {
            method: 'POST',
            headers: this.getAuthHeaders(),
            credentials: 'same-origin',
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.ok) {
            alert(`✅ Đã ${isEdit ? 'cập nhật' : 'tạo mới'} thành công tài khoản [${username.toUpperCase()}]!`);
            if (data.account && this.accountsList) {
              const idx = this.accountsList.findIndex(a => (a.username || '').toLowerCase() === username);
              if (idx !== -1) {
                this.accountsList[idx] = { ...this.accountsList[idx], ...data.account };
              } else {
                this.accountsList.push(data.account);
              }
            }
            this.closeEditAccountModal();
            await this.loadAdminAccounts();
          } else {
            alert('Lỗi: ' + data.error);
          }
        } catch (err) {
          alert('Không thể lưu tài khoản: Lỗi kết nối máy chủ');
        }
      });
    }
  }

  openEditAccountModal(acc) {
    if (!acc) return;
    this.editingAccountUsername = acc.username;
    
    const editModal = document.getElementById('adminAccountEditModal') || this.adminAccountEditModal;
    const editTitle = document.getElementById('adminAccountEditTitle') || this.adminAccountEditTitle;
    if (editTitle) {
      editTitle.textContent = `✏️ CHỈNH SỬA TÀI KHOẢN [${(acc.username || '').toUpperCase()}]`;
    }

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined && val !== null ? val : '';
    };

    setVal('editAccIsEdit', 'true');
    const uInput = document.getElementById('editAccUsername');
    if (uInput) {
      uInput.value = acc.username || '';
      uInput.readOnly = true;
      uInput.style.borderColor = '';
    }
    const uStatus = document.getElementById('accUsernameStatusMsg');
    if (uStatus) uStatus.style.display = 'none';

    setVal('editAccPassword', acc.password || acc.initialPassword || '');
    setVal('editAccAgency', acc.agency || 'police');
    setVal('editAccLevel', acc.level || (acc.agency === 'traffic-rescue' ? 'enterprise' : 'ward'));
    setVal('editAccAgencyName', acc.agencyName || acc.unitName || '');
    setVal('editAccProvince', acc.province || 'Cần Thơ');
    setVal('editAccWard', acc.ward || '');
    setVal('editAccAddress', acc.address || acc.stationAddress || '');
    setVal('editAccLat', acc.lat !== undefined && acc.lat !== null ? (typeof acc.lat === 'number' ? acc.lat.toFixed(6) : acc.lat) : '');
    setVal('editAccLng', acc.lng !== undefined && acc.lng !== null ? (typeof acc.lng === 'number' ? acc.lng.toFixed(6) : acc.lng) : '');
    setVal('editAccRank', acc.officerRank || '');
    setVal('editAccOfficerName', acc.officerName || '');
    setVal('editAccPhone', (acc.officerPhone || '').replace(/\s*\(Số ảo test\)/gi, '').trim());
    setVal('editAccSms', acc.officerSms || '');
    setVal('editAccEmail', acc.officerEmail || '');
    const verifiedCheckbox = document.getElementById('editAccVerified');
    if (verifiedCheckbox) {
      verifiedCheckbox.checked = acc.contactVerification === 'official' || acc.contactVerification === 'manual';
    }

    try {
      this.updateAdminAccountFormDynamicFields(acc.agency || 'police', true);
    } catch (e) {
      console.warn('updateAdminAccountFormDynamicFields error:', e);
    }

    if (editModal) {
      editModal.style.zIndex = '1000020';
      editModal.style.display = 'flex';
      editModal.style.setProperty('display', 'flex', 'important');
    }
  }

  closeEditAccountModal() {
    const editModal = document.getElementById('adminAccountEditModal') || this.adminAccountEditModal;
    if (editModal) {
      editModal.style.display = 'none';
      editModal.style.setProperty('display', 'none', 'important');
    }
    const uStatus = document.getElementById('accUsernameStatusMsg');
    if (uStatus) uStatus.style.display = 'none';
    const uInput = document.getElementById('editAccUsername');
    if (uInput) uInput.style.borderColor = '';
  }

  updateAdminAccountFormDynamicFields(agency, isEdit = false) {
    const lblAgencyName = document.getElementById('lblEditAccAgencyName');
    const inputAgencyName = document.getElementById('editAccAgencyName');
    const inputUsername = document.getElementById('editAccUsername');
    const inputPassword = document.getElementById('editAccPassword');
    const wrapWard = document.getElementById('wrapEditAccWard');
    const inputWard = document.getElementById('editAccWard');
    const lblAddress = document.getElementById('lblEditAccAddress');
    const inputAddress = document.getElementById('editAccAddress');
    const lblRank = document.getElementById('lblEditAccRank');
    const inputRank = document.getElementById('editAccRank');
    const lblOfficerName = document.getElementById('lblEditAccOfficerName');
    const inputOfficerName = document.getElementById('editAccOfficerName');
    const lblPhone = document.getElementById('lblEditAccPhone');
    const inputPhone = document.getElementById('editAccPhone');
    const lblSms = document.getElementById('lblEditAccSms');
    const inputSms = document.getElementById('editAccSms');
    const selectLevel = document.getElementById('editAccLevel');

    if (agency === 'traffic-rescue') {
      if (!isEdit) {
        if (selectLevel) selectLevel.value = 'enterprise';
        if (inputPassword) inputPassword.value = 'Cuuhoxe@113';
        if (inputSms) inputSms.value = '0939 114 911';
      }
      if (inputUsername) inputUsername.placeholder = 'ví dụ: cuuhodanang, garage_911...';
      if (inputPassword) inputPassword.placeholder = 'ví dụ: Cuuhoxe@113';
      if (lblAgencyName) lblAgencyName.textContent = 'Tên Doanh Nghiệp / Garage Cứu Hộ *';
      if (inputAgencyName) inputAgencyName.placeholder = 'ví dụ: Tổng Công Ty Cứu Hộ Giao Thông & Kéo Xe Đà Nẵng';
      if (wrapWard) {
        wrapWard.style.opacity = '0.5';
        if (inputWard) {
          inputWard.placeholder = '(Toàn Tỉnh/TP - Doanh nghiệp không chia xã/phường)';
          if (!isEdit) inputWard.value = '';
        }
      }
      if (lblAddress) lblAddress.textContent = 'Địa chỉ xưởng / Trụ sở doanh nghiệp cứu hộ *';
      if (inputAddress) inputAddress.placeholder = 'ví dụ: Số 128 Đường 3/2, Quận Hải Châu, TP. Đà Nẵng';
      if (lblRank) lblRank.textContent = 'Chức danh / Vị trí quản lý';
      if (inputRank) inputRank.placeholder = 'Kỹ sư trưởng / Đội trưởng cứu hộ / Giám đốc...';
      if (lblOfficerName) lblOfficerName.textContent = 'Họ và tên Người phụ trách / Điều hành xe *';
      if (inputOfficerName) inputOfficerName.placeholder = 'Trần Văn Cứu';
      if (lblPhone) lblPhone.textContent = 'Hotline cứu hộ 24/7 *';
      if (inputPhone) inputPhone.placeholder = '0939 114 911 / 0236 3899 911';
      if (lblSms) lblSms.textContent = 'Số di động điều phối xe';
      if (inputSms) inputSms.placeholder = '0939 114 911';
    } else if (agency === 'hospital') {
      if (!isEdit) {
        if (selectLevel) selectLevel.value = 'city';
        if (inputPassword) inputPassword.value = 'Capcuu@115';
        if (inputSms) inputSms.value = '0988 115 115';
      }
      if (inputUsername) inputUsername.placeholder = 'ví dụ: capcuudanang, capcuu115hcm...';
      if (inputPassword) inputPassword.placeholder = 'ví dụ: Capcuu@115';
      if (lblAgencyName) lblAgencyName.textContent = 'Tên Trung Tâm Cấp Cứu / Bệnh Viện *';
      if (inputAgencyName) inputAgencyName.placeholder = 'ví dụ: Trung Tâm Cấp Cứu Y Tế 115 Đà Nẵng';
      if (wrapWard) {
        wrapWard.style.opacity = '1';
        if (inputWard) inputWard.placeholder = 'Toàn Thành Phố hoặc Phường Thạch Thang';
      }
      if (lblAddress) lblAddress.textContent = 'Địa chỉ cơ sở y tế / Bệnh viện *';
      if (inputAddress) inputAddress.placeholder = 'ví dụ: Số 124 Hải Phòng, Phường Thạch Thang, TP. Đà Nẵng';
      if (lblRank) lblRank.textContent = 'Học hàm / Chức danh y khoa';
      if (inputRank) inputRank.placeholder = 'BS.CKII / ThS. Bác sĩ / Điều dưỡng trưởng...';
      if (lblOfficerName) lblOfficerName.textContent = 'Họ và tên Bác sĩ / Cán bộ trực ban cấp cứu *';
      if (inputOfficerName) inputOfficerName.placeholder = 'BS. Nguyễn Văn Y';
      if (lblPhone) lblPhone.textContent = 'Tổng đài cấp cứu 115 / SĐT Bàn *';
      if (inputPhone) inputPhone.placeholder = '0236 383 2115';
      if (lblSms) lblSms.textContent = 'Hotline di động khẩn cấp';
      if (inputSms) inputSms.placeholder = '0988 115 115';
    } else if (agency === 'csgt') {
      if (!isEdit) {
        if (selectLevel) selectLevel.value = 'city';
        if (inputPassword) inputPassword.value = 'Csgt@113';
        if (inputSms) inputSms.value = '0988 113 113';
      }
      if (inputUsername) inputUsername.placeholder = 'ví dụ: csgtdanang, csgthanoi...';
      if (inputPassword) inputPassword.placeholder = 'ví dụ: Csgt@113';
      if (lblAgencyName) lblAgencyName.textContent = 'Tên Đơn Vị Cảnh Sát Giao Thông *';
      if (inputAgencyName) inputAgencyName.placeholder = 'ví dụ: Phòng Cảnh Sát Giao Thông (PC08) - Công An Đà Nẵng';
      if (wrapWard) {
        wrapWard.style.opacity = '1';
        if (inputWard) inputWard.placeholder = 'Toàn Thành Phố hoặc Địa bàn phụ trách';
      }
      if (lblAddress) lblAddress.textContent = 'Địa chỉ trụ sở CSGT *';
      if (inputAddress) inputAddress.placeholder = 'ví dụ: Số 32 Đường 2/9, Hải Châu, TP. Đà Nẵng';
      if (lblRank) lblRank.textContent = 'Cấp bậc / Quân hàm';
      if (inputRank) inputRank.placeholder = 'Thượng tá / Trung tá / Đại úy...';
      if (lblOfficerName) lblOfficerName.textContent = 'Họ và tên Cán bộ trực ban CSGT *';
      if (inputOfficerName) inputOfficerName.placeholder = 'Thượng tá Lê Văn Giao';
      if (lblPhone) lblPhone.textContent = 'SĐT Bàn Trực ban CSGT *';
      if (inputPhone) inputPhone.placeholder = '0236 382 0113';
      if (lblSms) lblSms.textContent = 'Hotline / SMS Tiếp Nhận';
      if (inputSms) inputSms.placeholder = '0988 113 113';
    } else if (agency === 'fire') {
      if (!isEdit) {
        if (selectLevel) selectLevel.value = 'city';
        if (inputPassword) inputPassword.value = 'Pccc@114';
        if (inputSms) inputSms.value = '0988 114 114';
      }
      if (inputUsername) inputUsername.placeholder = 'ví dụ: pcccdanang, pccchanoi...';
      if (inputPassword) inputPassword.placeholder = 'ví dụ: Pccc@114';
      if (lblAgencyName) lblAgencyName.textContent = 'Tên Đơn Vị PCCC & CNCH *';
      if (inputAgencyName) inputAgencyName.placeholder = 'ví dụ: Phòng Cảnh Sát PCCC & CNCH (PC07) - Công An Đà Nẵng';
      if (wrapWard) {
        wrapWard.style.opacity = '1';
        if (inputWard) inputWard.placeholder = 'Toàn Thành Phố hoặc Địa bàn phụ trách';
      }
      if (lblAddress) lblAddress.textContent = 'Địa chỉ trụ sở PCCC & CNCH *';
      if (inputAddress) inputAddress.placeholder = 'ví dụ: Số 48 Nguyễn Tri Phương, Hải Châu, TP. Đà Nẵng';
      if (lblRank) lblRank.textContent = 'Cấp bậc / Quân hàm';
      if (inputRank) inputRank.placeholder = 'Thượng tá / Trung tá / Đại úy...';
      if (lblOfficerName) lblOfficerName.textContent = 'Họ và tên Cán bộ trực ban PCCC *';
      if (inputOfficerName) inputOfficerName.placeholder = 'Thượng tá Trần Cứu Hỏa';
      if (lblPhone) lblPhone.textContent = 'Tổng đài 114 / SĐT Trực ban PCCC *';
      if (inputPhone) inputPhone.placeholder = '0236 383 1114';
      if (lblSms) lblSms.textContent = 'Hotline / SMS Tiếp Nhận';
      if (inputSms) inputSms.placeholder = '0988 114 114';
    } else {
      // police or national
      if (!isEdit) {
        if (selectLevel && selectLevel.value === 'enterprise') selectLevel.value = 'ward';
        if (inputPassword) inputPassword.value = 'Congan@113';
        if (inputSms) inputSms.value = '0988 113 113';
      }
      if (inputUsername) inputUsername.placeholder = 'ví dụ: caplebinhct, catpdanang...';
      if (inputPassword) inputPassword.placeholder = 'ví dụ: Congan@113';
      if (lblAgencyName) lblAgencyName.textContent = 'Tên đơn vị Công An tiếp nhận (Tên đầy đủ) *';
      if (inputAgencyName) inputAgencyName.placeholder = 'ví dụ: Công An Phường Lê Bình / Công An Xã Phú Tâm';
      if (wrapWard) {
        wrapWard.style.opacity = '1';
        if (inputWard) inputWard.placeholder = 'Phường Lê Bình / Xã Phú Tâm';
      }
      if (lblAddress) lblAddress.textContent = 'Địa chỉ trụ sở công tác *';
      if (inputAddress) inputAddress.placeholder = 'ví dụ: Số 26 Đường Lê Hồng Phong, Phường Trà Nóc, TP. Cần Thơ';
      if (lblRank) lblRank.textContent = 'Cấp bậc / Quân hàm';
      if (inputRank) inputRank.placeholder = 'Đại úy / Thiếu tá / Thượng tá...';
      if (lblOfficerName) lblOfficerName.textContent = 'Họ và tên Cán bộ trực ban *';
      if (inputOfficerName) inputOfficerName.placeholder = 'Lê Văn Hòa';
      if (lblPhone) lblPhone.textContent = 'SĐT Bàn Trực ban Công An *';
      if (inputPhone) inputPhone.placeholder = '0292 3899 113';
      if (lblSms) lblSms.textContent = 'Hotline / SMS Tiếp Nhận';
      if (inputSms) inputSms.placeholder = '0988 113 113';
    }
  }

  async exportAccountsExcel() {
    const btn = document.getElementById('btnExportAccountsExcel');
    const originalHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳ Đang kết nối tải Excel...';
    }

    try {
      const token = this.currentOfficer?.token || localStorage.getItem('dispatcher_token') || '';
      const headers = {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, */*'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const downloadUrl = `/api/admin/export-accounts-excel?t=${Date.now()}&token=${encodeURIComponent(token)}`;
      const res = await fetch(downloadUrl, {
        method: 'GET',
        headers
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Lỗi máy chủ (${res.status})`);
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = `DanhSach_TaiKhoan_PhanQuyen_DonVi_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      if (a.parentNode) a.parentNode.removeChild(a);

      if (typeof window.showToast === 'function') {
        window.showToast('✅ Đã tải xuống danh sách tài khoản thành công!');
      }
    } catch (err) {
      console.error('Export accounts error:', err);
      alert('⚠️ Không thể tải danh sách tài khoản: ' + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalHtml || '<span>📊</span> Xuất Excel (.xlsx)';
      }
    }
  }

  async importAccountsExcel(file) {
    if (!file) return;

    if (!confirm(`Bạn có chắc chắn muốn tải lên và cập nhật danh sách tài khoản & mật khẩu từ file:\n📄 "${file.name}"?`)) {
      return;
    }

    const btn = document.getElementById('btnImportAccountsExcel');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳ Đang nhập Excel...';
    }

    try {
      // Read file as Base64 to safely transmit JSON payload
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          const chunkSize = 0x8000;
          for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
          }
          const base64Data = window.btoa(binary);

          const res = await fetch('/api/admin/import-accounts-excel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileBase64: base64Data, filename: file.name })
          });

          const data = await res.json();
          if (data.ok) {
            let msg = `✅ ${data.message || 'Nhập danh sách tài khoản thành công!'}\n• Tổng số dòng hợp lệ: ${data.total || 0}\n• Đã tạo mới: ${data.created || 0}\n• Đã cập nhật: ${data.updated || 0}`;
            if (Array.isArray(data.newUnits) && data.newUnits.length > 0) {
              msg += `\n\n📌 Các đơn vị mới đã được nạp và đồng bộ vào hệ thống:\n` + data.newUnits.map(u => `  + ${u}`).join('\n');
            }
            alert(msg);
            await this.loadAdminAccounts();
            if (typeof this.renderMapStations === 'function') {
              try { this.renderMapStations(); } catch(e) {}
            }
          } else {
            alert('Lỗi nhập Excel: ' + (data.error || 'Không thể xử lý file'));
          }
        } catch (err) {
          console.error(err);
          alert('Lỗi gửi dữ liệu lên máy chủ: ' + err.message);
        } finally {
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span>📥</span> Nhập Excel (.xlsx)';
          }
        }
      };

      reader.onerror = () => {
        alert('Không thể đọc file đã chọn.');
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<span>📥</span> Nhập Excel (.xlsx)';
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (e) {
      console.error(e);
      alert('Không thể khởi tạo đọc file: ' + e.message);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>📥</span> Nhập Excel (.xlsx)';
      }
    }
  }

  async openAdminModal() {
    const officer = this.currentOfficer || this.currentAccount || {};
    const isNationalAdmin = Boolean(officer && (officer.username === 'admin' || officer.level === 'national' || (officer.agencyName && officer.agencyName.includes('Trung Tâm Chỉ Huy Tác Chiến Quốc Gia'))));
    if (!isNationalAdmin) {
      alert('🚫 TRUY CẬP BỊ TỪ CHỐI!\nChỉ có tài khoản [TRUNG TÂM CHỈ HUY TÁC CHIẾN QUỐC GIA] (Tài khoản Admin) mới có quyền truy cập chức năng Phân Quyền & Quản Trị Hệ Thống.');
      return;
    }

    const modal = document.getElementById('adminOfficerModal') || this.adminOfficerModal;
    if (modal) {
      modal.style.display = 'flex';
      modal.style.setProperty('display', 'flex', 'important');
      modal.style.zIndex = '1000005';
    }

    // Default to Tab 1 (Accounts & Permissions)
    await this.switchAdminTab('accounts');
  }


  closeAdminModal() {
    const modal = document.getElementById('adminOfficerModal') || this.adminOfficerModal;
    if (modal) {
      modal.style.display = 'none';
      modal.style.setProperty('display', 'none', 'important');
    }
    const editModal = document.getElementById('adminAccountEditModal') || this.adminAccountEditModal;
    if (editModal) {
      editModal.style.display = 'none';
      editModal.style.setProperty('display', 'none', 'important');
    }
  }

  async switchAdminTab(tabName) {
    const tabAcc = document.getElementById('tabAdminAccounts');
    const tabSec = document.getElementById('tabAdminSecurityLogs');
    const viewAcc = document.getElementById('viewAdminAccountsTab');
    const viewSec = document.getElementById('viewAdminSecurityLogsTab');

    if (tabName === 'security') {
      if (tabSec) {
        tabSec.classList.add('is-active');
        tabSec.style.borderColor = '#c084fc';
        tabSec.style.background = 'rgba(192, 132, 252, 0.2)';
        tabSec.style.color = '#fff';
      }
      if (tabAcc) {
        tabAcc.classList.remove('is-active');
        tabAcc.style.borderColor = '';
        tabAcc.style.background = '';
        tabAcc.style.color = '';
      }
      if (viewSec) {
        viewSec.style.display = 'flex';
        viewSec.style.setProperty('display', 'flex', 'important');
      }
      if (viewAcc) {
        viewAcc.style.display = 'none';
        viewAcc.style.setProperty('display', 'none', 'important');
      }
      await this.loadSecurityAuditLogs();
    } else {
      if (tabAcc) {
        tabAcc.classList.add('is-active');
        tabAcc.style.borderColor = '#38bdf8';
        tabAcc.style.background = 'rgba(56, 189, 248, 0.2)';
        tabAcc.style.color = '#fff';
      }
      if (tabSec) {
        tabSec.classList.remove('is-active');
        tabSec.style.borderColor = '';
        tabSec.style.background = '';
        tabSec.style.color = '';
      }
      if (viewAcc) {
        viewAcc.style.display = 'flex';
        viewAcc.style.setProperty('display', 'flex', 'important');
      }
      if (viewSec) {
        viewSec.style.display = 'none';
        viewSec.style.setProperty('display', 'none', 'important');
      }
      await this.loadAdminAccounts();
    }
  }

  adjustMapStyleDropdownHeight() {
    const stylePill = document.getElementById('mapStyleSelectorPill');
    const styleDropdown = document.getElementById('mapStyleCustomDropdown');
    if (!stylePill || !styleDropdown) return;
    const pillRect = stylePill.getBoundingClientRect();
    const wrap = stylePill.closest('.dispatcher-map-canvas-wrap');
    const wrapBottom = wrap ? wrap.getBoundingClientRect().bottom : window.innerHeight;
    const safeBottom = Math.min(window.innerHeight, wrapBottom) - 14;
    const availableHeight = Math.max(safeBottom - pillRect.bottom, 220);
    const targetMaxHeight = Math.min(availableHeight, 480);
    styleDropdown.style.setProperty('max-height', `${targetMaxHeight}px`, 'important');
  }

  toggleMapStyleDropdown(e) {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('mapStyleCustomDropdown');
    if (dropdown) {
      const isHidden = dropdown.style.display === 'none' || dropdown.style.display === '';
      dropdown.style.display = isHidden ? 'flex' : 'none';
      if (isHidden) {
        this.adjustMapStyleDropdownHeight();
        // Sync checkboxes with current map state
        const chkWards = document.getElementById('chkToggleAllWards');
        if (chkWards) chkWards.checked = Boolean(this.allWardsVisible);
      }
    }
  }

  selectMapStyle(source, name, icon, e) {
    if (e) e.stopPropagation();
    if (this.mapController) {
      this.mapController.switchTileLayer(source);
    }
    const curName = document.getElementById('currentMapStyleName');
    const curIcon = document.getElementById('currentMapStyleIcon');
    if (curName) curName.textContent = name + ' ⌵';
    if (curIcon) curIcon.textContent = icon;

    const dropdown = document.getElementById('mapStyleCustomDropdown');
    if (dropdown) {
      dropdown.querySelectorAll('.map-style-opt').forEach(o => {
        o.classList.toggle('is-active', o.dataset.source === source);
      });
      dropdown.style.display = 'none';
    }
  }

  async loadNationalBandoSyncStatus() {
    try {
      const res = await fetch('/api/geo/sync-status');
      const data = await res.json();
      if (data && data.ok && data.sync) {
        const badge = document.getElementById('bandoSyncStatusBadge');
        const timeEl = document.getElementById('bandoSyncLastTime');
        if (badge) {
          if (data.sync.isSyncing) {
            badge.innerHTML = '🟡 Đang đồng bộ...';
            badge.style.color = '#fde047';
          } else if (data.sync.lastStatus === 'SUCCESS') {
            badge.innerHTML = `🟢 Khớp 100% (${data.sync.totalProvinces} Tỉnh · ${data.sync.totalWards.toLocaleString()} Xã)`;
            badge.style.color = '#4ade80';
          } else {
            badge.innerHTML = '⚠️ Sẵn sàng kiểm tra';
            badge.style.color = '#38bdf8';
          }
        }
        if (timeEl && data.sync.lastSyncTime) {
          const d = new Date(data.sync.lastSyncTime);
          timeEl.textContent = d.toLocaleTimeString('vi-VN') + ' ' + d.toLocaleDateString('vi-VN');
        }
      }
    } catch (e) {
      console.warn('Could not load sync status:', e);
    }
  }

  async triggerNationalBandoSync(e) {
    if (e) e.stopPropagation();
    const btn = document.getElementById('btnTriggerBandoSync');
    const icon = document.getElementById('bandoSyncIcon');
    const badge = document.getElementById('bandoSyncStatusBadge');

    if (btn) btn.disabled = true;
    if (icon) icon.textContent = '⏳';
    if (badge) {
      badge.innerHTML = '🟡 Đang quét CSDL sapnhap.bando.com.vn...';
      badge.style.color = '#fde047';
    }

    try {
      const res = await fetch('/api/geo/sync-now', { method: 'POST' });
      const data = await res.json();

      if (data && data.ok) {
        if (badge) {
          badge.innerHTML = `🟢 Khớp 100% (${data.totalProvinces} Tỉnh · ${data.totalWards.toLocaleString()} Xã)`;
          badge.style.color = '#4ade80';
        }
        const timeEl = document.getElementById('bandoSyncLastTime');
        if (timeEl && data.lastSyncTime) {
          const d = new Date(data.lastSyncTime);
          timeEl.textContent = d.toLocaleTimeString('vi-VN') + ' ' + d.toLocaleDateString('vi-VN');
        }
        alert('✅ ĐỒNG BỘ CSDL QUỐC GIA THÀNH CÔNG!\n\n' + data.message + '\n\n• Nguồn: https://sapnhap.bando.com.vn/\n• Tổng số tỉnh thành: ' + data.totalProvinces + '\n• Tổng số xã/phường: ' + data.totalWards.toLocaleString() + '\n• Bản đồ đã cập nhật các quyết định sáp nhập mới nhất.');
      } else {
        alert('⚠️ THÔNG BÁO ĐỒNG BỘ:\n\n' + (data.message || 'Không thể kết nối bando.com.vn'));
      }
    } catch (err) {
      alert('❌ Lỗi kết nối máy chủ đồng bộ: ' + err.message);
    } finally {
      if (btn) btn.disabled = false;
      if (icon) icon.textContent = '🔄';
    }
  }

  expandGeofenceBar(e) {
    if (e) e.stopPropagation();
    const bubble = document.getElementById('tacticalGeofenceBubbleTrigger');
    const bar = document.getElementById('tacticalGeofenceControlBar');
    if (!bar) return;

    if (bubble) {
      bubble.style.setProperty('display', 'none', 'important');
    }

    bar.style.setProperty('display', 'inline-flex', 'important');
    bar.scrollLeft = 0;
    bar.classList.remove('is-shrinking');
    bar.classList.add('is-expanding');

    setTimeout(() => {
      bar.classList.remove('is-expanding');
    }, 400);
  }

  minimizeGeofenceBar(e) {
    if (e) e.stopPropagation();
    const bubble = document.getElementById('tacticalGeofenceBubbleTrigger');
    const bar = document.getElementById('tacticalGeofenceControlBar');
    if (!bar) return;

    // Close any open popovers inside the dock first
    const provPop = document.getElementById('provinceBubblePopover');
    const wardPop = document.getElementById('wardBubblePopover');
    if (provPop) provPop.style.display = 'none';
    if (wardPop) wardPop.style.display = 'none';

    bar.classList.remove('is-expanding');
    bar.classList.add('is-shrinking');

    setTimeout(() => {
      bar.style.setProperty('display', 'none', 'important');
      bar.classList.remove('is-shrinking');
      if (bubble) {
        bubble.style.setProperty('display', 'flex', 'important');
      }
    }, 240);
  }

  toggleSelectedAreaBoundary(e) {
    if (e) {
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
      if (typeof e.preventDefault === 'function') e.preventDefault();
    }
    if (!this.mapController) return;

    const iconEl = document.getElementById('iconToggleAreaGrid');
    const labelEl = document.getElementById('labelToggleAreaGrid');
    const btn = document.getElementById('btnToggleSelectedAreaGrid');

    // Check if a specific ward is currently highlighted on map
    const hasWardLayer = this.mapController.map && this.mapController.map.getLayer('ward-boundary-line');
    const hasWardBoundary = Boolean(this.currentSelectedWard || this.mapController.currentWardBoundary || hasWardLayer);

    if (hasWardBoundary) {
      const isVisible = this.mapController.toggleWardBoundaryVisibility();
      if (iconEl) iconEl.textContent = isVisible ? '👁️' : '🙈';
      if (labelEl) labelEl.textContent = isVisible ? 'Đang Hiện Lưới Địa Bàn' : 'Đang Tắt Lưới Địa Bàn';
      if (btn) {
        btn.style.background = isVisible ? 'rgba(234, 179, 8, 0.25)' : 'rgba(255, 255, 255, 0.08)';
        btn.style.borderColor = isVisible ? '#facc15' : 'rgba(255, 255, 255, 0.2)';
        btn.style.color = isVisible ? '#facc15' : '#94a3b8';
      }
    } else {
      // Toggle 34 province boundaries
      this.provincesGridVisible = this.provincesGridVisible === undefined ? true : !this.provincesGridVisible;
      this.mapController.toggleProvinceBoundaries(this.provincesGridVisible);
      if (iconEl) iconEl.textContent = this.provincesGridVisible ? '👁️' : '🙈';
      if (labelEl) labelEl.textContent = this.provincesGridVisible ? 'Đang Hiện Lưới 34 Tỉnh' : 'Đang Tắt Lưới 34 Tỉnh';
      if (btn) {
        btn.style.background = this.provincesGridVisible ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.08)';
        btn.style.borderColor = this.provincesGridVisible ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)';
        btn.style.color = this.provincesGridVisible ? '#38bdf8' : '#94a3b8';
      }
    }
  }

  toggleAllWardsGrid(e) {
    if (e) e.stopPropagation();
    const chk = document.getElementById('chkToggleAllWards');
    if (chk && e && e.target !== chk) {
      chk.checked = !chk.checked;
    }
    this.allWardsVisible = chk ? chk.checked : !this.allWardsVisible;
    if (this.mapController) {
      this.mapController.toggleAllWardsLayer(this.allWardsVisible);
    }
  }

  toggleProvinceLayer(e) {
    if (e) e.stopPropagation();
    const chk = document.getElementById('chkToggleProvinces');
    if (chk && e && e.target !== chk) {
      chk.checked = !chk.checked;
    }
    const isChecked = chk ? chk.checked : true;
    if (this.mapController) {
      this.mapController.toggleProvinceBoundaries(isChecked);
    }
  }

  toggleStationsLayer(e) {
    if (e) e.stopPropagation();
    const chk = document.getElementById('chkToggleStations');
    if (chk && e && e.target !== chk) {
      chk.checked = !chk.checked;
    }
    const isChecked = chk ? chk.checked : true;
    if (this.mapController) {
      this.mapController.toggleStationsLayer(isChecked);
    }
  }

  centerMapGps(e) {
    if (e) e.stopPropagation();
    this.autoLocateCurrentPosition(true);
  }

  async autoLocateCurrentPosition(userTriggered = false) {
    const locPrimary = document.getElementById('locationPrimaryVal');
    const locSecondary = document.getElementById('locationSecondaryVal');
    const locIcon = document.getElementById('locationWidgetIcon');
    const gpsDot = document.getElementById('locationGpsLiveDot');

    // 1. If cached GPS exists, apply immediately for instant UI render
    try {
      const cached = localStorage.getItem('sos_dispatcher_current_gps');
      if (cached && !userTriggered) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.lat && parsed.lng) {
          this.applyCurrentLocation(parsed.lat, parsed.lng, parsed.data, false);
        }
      }
    } catch (e) {}

    if (locSecondary && userTriggered) {
      locSecondary.textContent = 'Đang quét sóng vệ tinh GPS...';
    }
    if (locIcon && userTriggered) {
      locIcon.textContent = '📡';
    }

    const resolveGps = () => {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          return reject(new Error('Geolocation not supported'));
        }
        navigator.geolocation.getCurrentPosition(
          pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          err => reject(err),
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
        );
      });
    };

    try {
      // 2. Browser High-Accuracy GPS
      const coords = await resolveGps();
      await this.applyCurrentLocation(coords.lat, coords.lng, null, userTriggered);
    } catch (gpsErr) {
      console.warn('Browser GPS unavailable, falling back to network IP geolocation:', gpsErr.message);
      // 3. Fallback: Network IP Geolocation
      try {
        const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
        const ipGeo = await res.json();
        const ipLat = parseFloat(ipGeo.latitude) || 10.822;
        const ipLng = parseFloat(ipGeo.longitude) || 106.6257;
        await this.applyCurrentLocation(ipLat, ipLng, null, userTriggered);
      } catch (ipErr) {
        console.warn('IP Geolocation fallback failed:', ipErr.message);
        // Default to Ho Chi Minh City coordinates
        await this.applyCurrentLocation(10.8231, 106.6297, null, userTriggered);
      }
    } finally {
      if (locIcon) locIcon.textContent = '📍';
    }
  }

  async applyCurrentLocation(lat, lng, cachedData = null, shouldFly = true) {
    this.currentGps = { lat, lng };
    let d = cachedData;

    if (!d) {
      try {
        const res = await fetch(`/api/geo/locate-ward?lat=${lat}&lng=${lng}`);
        d = await res.json();
        if (d && d.ok) {
          localStorage.setItem('sos_dispatcher_current_gps', JSON.stringify({ lat, lng, data: d }));
        }
      } catch (e) {
        console.warn('Could not reverse-geocode position:', e);
      }
    }

    const locPrimary = document.getElementById('locationPrimaryVal');
    const locSecondary = document.getElementById('locationSecondaryVal');
    const locWidget = document.getElementById('locationWidget');
    const gpsDot = document.getElementById('locationGpsLiveDot');

    const wardName = d?.jurisdiction?.ward || '';
    const provName = d?.jurisdiction?.province || 'Toàn Quốc';

    // If an officer is authenticated, always preserve their official unit identity
    if (this.currentOfficer) {
      if (this.currentOfficer.level === 'national' || this.currentOfficer.username === 'admin') {
        if (locPrimary) locPrimary.textContent = this.currentOfficer.unitName || this.currentOfficer.agencyName || 'TT. Chỉ Huy Tác Chiến Quốc Gia';
        if (locSecondary) locSecondary.textContent = 'Bộ Công An · Cấp Quốc Gia';
      } else if (this.currentOfficer.level === 'province') {
        if (locPrimary) locPrimary.textContent = this.currentOfficer.unitName || this.currentOfficer.agencyName || ('Công An ' + this.currentOfficer.province);
        if (locSecondary) locSecondary.textContent = (this.currentOfficer.province || '') + ' (Trụ Sở Bộ Chỉ Huy)';
      } else if (this.currentOfficer.level === 'ward') {
        if (locPrimary) locPrimary.textContent = this.currentOfficer.unitName || this.currentOfficer.agencyName || ('Công An ' + (this.currentOfficer.ward || 'Cấp Xã/Phường'));
        if (locSecondary) locSecondary.textContent = (this.currentOfficer.province ? (this.currentOfficer.province + ' · Trụ sở địa bàn') : (this.currentOfficer.address || 'Trụ sở đơn vị'));
      }
    } else {
      // Unauthenticated / guest GPS detection
      const localStation = d?.policeStation?.name;
      const provinceStation = d?.provinceStation?.name;
      if (locPrimary) {
        locPrimary.textContent = localStation || (wardName ? `Công An ${wardName}` : 'Trung tâm Chỉ huy');
      }
      if (locSecondary) {
        locSecondary.textContent = wardName ? `${wardName}, ${provName}` : (provinceStation || ('Công An ' + provName));
      }
    }

    if (gpsDot) {
      gpsDot.style.display = 'inline-block';
    }
    if (locWidget) {
      const displayStation = this.currentOfficer ? (this.currentOfficer.unitName || this.currentOfficer.agencyName) : (d?.policeStation?.name || d?.provinceStation?.name || 'Đơn vị trực ban');
      locWidget.title = `📍 Vị trí trực ban: ${wardName ? wardName + ', ' : ''}${provName}\n• Đơn vị: ${displayStation}\n• Tọa độ GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}\n(Bấm để xem trên bản đồ)`;
    }

    const isAdmin = Boolean(this.currentOfficer && (this.currentOfficer.username === 'admin' || this.currentOfficer.level === 'national'));

    if (!isAdmin) {
      // Update or add GPS pulse marker on map for regular officers / unauthenticated
      if (this.mapController && this.mapController.map && window.maplibregl) {
        if (!this.userGpsMarker) {
          const el = document.createElement('div');
          el.className = 'dispatcher-gps-marker';
          el.innerHTML = `
            <div class="gps-beacon-radar"></div>
            <div class="gps-beacon-center">📍</div>
            <div class="gps-beacon-badge">${wardName || 'VỊ TRÍ CỦA BẠN'}</div>
          `;
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            this.mapController.map.flyTo({ center: [lng, lat], zoom: 16, duration: 800 });
          });
          this.userGpsMarker = new window.maplibregl.Marker({ element: el })
            .setLngLat([lng, lat])
            .addTo(this.mapController.map);
        } else {
          this.userGpsMarker.setLngLat([lng, lat]);
          const badge = this.userGpsMarker.getElement()?.querySelector('.gps-beacon-badge');
          if (badge) badge.textContent = wardName || 'VỊ TRÍ CỦA BẠN';
        }

        if (shouldFly) {
          this.mapController.map.flyTo({
            center: [lng, lat],
            zoom: 15.5,
            pitch: 25,
            duration: 1200
          });
        }
      }

      // Highlight ward boundary if available (only if user hasn't manually selected another ward)
      if (d?.boundary && this.mapController && !this.currentSelectedWard) {
        this.mapController.highlightWardBoundary(d.boundary, { color: '#eab308' });
      }
    } else {
      // Admin: ensure clean national map without GPS radar pulse or ward boundary
      if (this.userGpsMarker) {
        try { this.userGpsMarker.remove(); } catch(e) {}
        this.userGpsMarker = null;
      }
    }

    // Sync bottom dock geofence labels if present (only if user hasn't manually selected another ward)
    if (!this.currentSelectedWard) {
      const dockProvLabel = document.getElementById('dockProvinceLabel');
      if (dockProvLabel && provName) {
        dockProvLabel.textContent = provName;
      }
      const dockWardLabel = document.getElementById('dockWardLabel');
      if (dockWardLabel && wardName) {
        dockWardLabel.textContent = wardName;
      }
    }
  }

  mapResetNorth() {
    if (this.mapController && this.mapController.map) {
      this.mapController.map.resetNorthPitch({ duration: 800 });
    }
  }

  mapZoomIn() {
    if (this.mapController && this.mapController.map) {
      this.mapController.map.zoomIn({ duration: 300 });
    }
  }

  mapZoomOut() {
    if (this.mapController && this.mapController.map) {
      this.mapController.map.zoomOut({ duration: 300 });
    }
  }

  toggleProvinceBubblePopover(e) {
    if (e) {
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
      if (typeof e.preventDefault === 'function') e.preventDefault();
    }
    const wardPop = document.getElementById('wardBubblePopover');
    if (wardPop) wardPop.style.display = 'none';
    const pop = document.getElementById('provinceBubblePopover');
    if (pop) {
      const isShown = pop.style.display === 'flex';
      pop.style.display = isShown ? 'none' : 'flex';
      if (!isShown) {
        const inp = document.getElementById('inputFilterProvinces');
        if (inp) {
          inp.value = '';
          try { inp.focus({ preventScroll: true }); } catch(e) { inp.focus(); }
        }
        const wrap = document.querySelector('.dispatcher-map-canvas-wrap');
        if (wrap) wrap.scrollLeft = 0;
        if (this.renderProvinceBubbles) this.renderProvinceBubbles('');
      }
    }
  }

  closeProvinceBubblePopover(e) {
    if (e) {
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
      if (typeof e.preventDefault === 'function') e.preventDefault();
    }
    const pop = document.getElementById('provinceBubblePopover');
    if (pop) pop.style.display = 'none';
  }

  clearGeofenceHighlight(e) {
    if (e) {
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
      if (typeof e.preventDefault === 'function') e.preventDefault();
    }
    this.currentSelectedWard = null;
    if (this.mapController) {
      this.mapController.clearWardBoundary();
      this.mapController.highlightProvinceBoundary(null);
    }
    this.hideWardHud();

    const inputSearchGeofence = document.getElementById('inputSearchGeofence');
    if (inputSearchGeofence) inputSearchGeofence.value = '';

    const btnClearGeofenceHighlight = document.getElementById('btnClearGeofenceHighlight');
    if (btnClearGeofenceHighlight) btnClearGeofenceHighlight.style.display = 'none';

    // Xóa tên tỉnh & xã trên pill
    const dockProvinceLabel = document.getElementById('dockProvinceLabel');
    if (dockProvinceLabel) dockProvinceLabel.textContent = '-- Chọn Tỉnh / TP --';
    const dockWardLabel = document.getElementById('dockWardLabel');
    if (dockWardLabel) dockWardLabel.textContent = '-- Chọn Xã / Phường --';
    
    // Đặt lại state province
    if (this.renderProvinceBubbles) this.renderProvinceBubbles('');
  }

  openWardBubblePopover(e) {
    if (e) {
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
      if (typeof e.preventDefault === 'function') e.preventDefault();
    }
    const provPop = document.getElementById('provinceBubblePopover');
    if (provPop) provPop.style.display = 'none';
    const wardPop = document.getElementById('wardBubblePopover');
    if (wardPop) {
      wardPop.style.display = 'flex';
      const inputSearchGeofence = document.getElementById('inputSearchGeofence');
      if (this.renderWardResults) this.renderWardResults(inputSearchGeofence?.value || '', this.selectedProvinceName);
    }
  }

  closeWardBubblePopover(e) {
    if (e) {
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
      if (typeof e.preventDefault === 'function') e.preventDefault();
    }
    const wardPop = document.getElementById('wardBubblePopover');
    if (wardPop) wardPop.style.display = 'none';
  }

  toggleWardBubblePopover(e) {
    if (e) {
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
      if (typeof e.preventDefault === 'function') e.preventDefault();
    }
    const provPop = document.getElementById('provinceBubblePopover');
    if (provPop) provPop.style.display = 'none';
    const wardPop = document.getElementById('wardBubblePopover');
    if (wardPop) {
      const isShown = wardPop.style.display === 'flex';
      wardPop.style.display = isShown ? 'none' : 'flex';
      if (!isShown) {
        const titleEl = document.getElementById('wardPopoverTitle');
        if (titleEl) {
          titleEl.textContent = this.selectedProvinceName
            ? `📍 XÃ / PHƯỜNG TRỰC THUỘC ${this.selectedProvinceName.toUpperCase()}`
            : '📍 TÌM KIẾM XÃ / PHƯỜNG TOÀN QUỐC (3.321 ĐV)';
        }
        const inp = document.getElementById('inputSearchGeofence');
        if (inp) {
          inp.value = '';
          inp.placeholder = this.selectedProvinceName
            ? `🔍 Tìm xã/phường tại ${this.selectedProvinceName}...`
            : '🔍 Tìm tên xã/phường, thị trấn hoặc tên sáp nhập...';
          try { inp.focus({ preventScroll: true }); } catch(e) { inp.focus(); }
        }
        const wrap = document.querySelector('.dispatcher-map-canvas-wrap');
        if (wrap) wrap.scrollLeft = 0;
        if (this.renderWardResults) {
          this.renderWardResults('', this.selectedProvinceName);
        }
      }
    }
  }

  onSearchWardInput(val) {
    const wardPop = document.getElementById('wardBubblePopover');
    if (wardPop) wardPop.style.display = 'flex';
    if (this.renderWardResults) this.renderWardResults(val, this.selectedProvinceName);
  }


  async loadAdminAccounts() {
    const container = document.getElementById('adminAccountsListContainer') || this.adminAccountsListContainer;
    if (container && (!this.accountsList || this.accountsList.length === 0)) {
      container.innerHTML = `
        <div style="text-align: center; color: #38bdf8; padding: 40px;">
          <div style="font-size: 28px; margin-bottom: 8px;">⏳</div>
          <div style="font-weight: 700;">Đang nạp danh sách tài khoản theo địa giới hiện hành...</div>
        </div>
      `;
    }

    try {
      const headers = this.getAuthHeaders();
      let token = this.currentOfficer?.token;
      if (!token) {
        try {
          const raw = sessionStorage.getItem('sos_dispatcher_officer') || localStorage.getItem('sos_dispatcher_officer');
          if (raw) token = JSON.parse(raw)?.token;
        } catch(e) {}
      }
      const qs = token ? `?token=${encodeURIComponent(token)}` : '';
      const res = await fetch('/api/admin/accounts' + qs, {
        headers,
        credentials: 'same-origin'
      });
      const d = await res.json();
      if (d.ok && Array.isArray(d.accounts) && d.accounts.length > 0) {
        this.accountsList = d.accounts;
        this.renderAdminAccountsList();
        return;
      }
      if (container) {
        container.innerHTML = `
          <div style="text-align: center; color: #fbbf24; padding: 40px;">
            <div style="font-size: 28px; margin-bottom: 8px;">⚠️</div>
            <div style="font-weight: 700;">${d.error || 'Cần đăng nhập bằng tài khoản quản trị để xem danh sách tài khoản.'}</div>
          </div>`;
      }
    } catch (e) {
      console.warn('API /api/admin/accounts fetch failed.', e);
      if (container) {
        container.innerHTML = `
          <div style="text-align: center; color: #fbbf24; padding: 40px;">
            <div style="font-size: 28px; margin-bottom: 8px;">⚠️</div>
            <div style="font-weight: 700;">Cần đăng nhập bằng tài khoản quản trị để xem danh sách tài khoản.</div>
          </div>`;
      }
    }
  }

  renderAdminAccountsList() {
    this.adminAccountsListContainer = document.getElementById('adminAccountsListContainer') || this.adminAccountsListContainer;
    if (!this.adminAccountsListContainer) return;
    this.adminAccountsListContainer.innerHTML = '';

    const kw = (this.inputSearchAdminAccounts?.value || '').toLowerCase().trim();
    const filterAgency = this.selectFilterAdminAgency?.value || 'all';

    let filtered = this.accountsList || [];
    if (filterAgency !== 'all') {
      filtered = filtered.filter(a => a.agency === filterAgency);
    }
    if (kw) {
      filtered = filtered.filter(a =>
        (a.username || '').toLowerCase().includes(kw) ||
        (a.agencyName || '').toLowerCase().includes(kw) ||
        (a.unitName || '').toLowerCase().includes(kw) ||
        (a.officerName || '').toLowerCase().includes(kw) ||
        (a.officerRank || '').toLowerCase().includes(kw) ||
        (a.ward || '').toLowerCase().includes(kw) ||
        (a.province || '').toLowerCase().includes(kw) ||
        (a.officerPhone || '').toLowerCase().includes(kw) ||
        (a.password || '').toLowerCase().includes(kw)
      );
    }

    if (filtered.length === 0) {
      this.adminAccountsListContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-dim); padding: 30px;">
          <div style="font-size: 24px; margin-bottom: 6px;">🔍</div>
          <div>Không tìm thấy tài khoản nào khớp với bộ lọc & từ khóa tìm kiếm.</div>
        </div>
      `;
      return;
    }

    // -------------------------------------------------------------
    // Categorize into Hierarchical Structure:
    // 1. National Group (admin)
    // 2. Province Groups (Cần Thơ, TP.HCM, Hà Nội, ...)
    //    -> Police Province
    //    -> Police Communes/Wards (Nested Accordion)
    //    -> CSGT (Cấp Phòng PC08)
    //    -> Fire PCCC (Cấp Phòng PC07)
    //    -> Hospital (115)
    //    -> Enterprise Rescue (No ward)
    // -------------------------------------------------------------
    const nationalAccs = [];
    const provinceMap = {};

    filtered.forEach(acc => {
      if (acc.level === 'national' || acc.username === 'admin') {
        nationalAccs.push(acc);
        return;
      }
      const prov = acc.province || 'Cần Thơ';
      if (!provinceMap[prov]) {
        provinceMap[prov] = {
          policeProv: [],
          policeWards: [],
          csgt: [],
          fire: [],
          hospital: [],
          trafficRescue: []
        };
      }
      const p = provinceMap[prov];
      if (acc.agency === 'police') {
        if (acc.level === 'province' || acc.username === 'congan') {
          p.policeProv.push(acc);
        } else {
          p.policeWards.push(acc);
        }
      } else if (acc.agency === 'csgt') {
        p.csgt.push(acc);
      } else if (acc.agency === 'fire') {
        p.fire.push(acc);
      } else if (acc.agency === 'hospital') {
        p.hospital.push(acc);
      } else if (acc.agency === 'traffic-rescue') {
        p.trafficRescue.push(acc);
      } else {
        p.policeWards.push(acc);
      }
    });

    const isSearching = Boolean(kw) || filterAgency !== 'all';

    // Helper: Create single account card element
    const createAccountCard = (acc, customLevelBadge = null, hideWard = false) => {
      const card = document.createElement('div');
      card.style = 'background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; gap: 10px; transition: all 0.2s;';

      const agencyColor = acc.agency === 'police' ? '#60a5fa' : (acc.agency === 'csgt' ? '#fbbf24' : (acc.agency === 'fire' ? '#f87171' : (acc.agency === 'hospital' ? '#34d399' : (acc.agency === 'traffic-rescue' ? '#fb923c' : '#c084fc'))));
      const agencyIconSvg = acc.agency === 'police'
        ? '<svg class="svg-ico ico-xs ico-blue" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>'
        : (acc.agency === 'csgt'
          ? '<svg class="svg-ico ico-xs ico-amber" viewBox="0 0 24 24"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><circle cx="17" cy="17" r="2"></circle></svg>'
          : (acc.agency === 'fire'
            ? '<svg class="svg-ico ico-xs ico-red" viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>'
            : (acc.agency === 'hospital'
              ? '<svg class="svg-ico ico-xs ico-emerald" viewBox="0 0 24 24"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>'
              : (acc.agency === 'traffic-rescue'
                ? '<svg class="svg-ico ico-xs ico-amber" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>'
                : '<svg class="svg-ico ico-xs ico-purple" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>'))));
      
      let levelLabel = customLevelBadge;
      if (!levelLabel) {
        levelLabel = acc.level === 'ward' ? 'CẤP XÃ/PHƯỜNG' : (acc.level === 'national' ? 'TRUNG ƯƠNG' : (acc.level === 'enterprise' ? 'DOANH NGHIỆP' : 'CẤP PHÒNG / TỈNH'));
      }

      const isCore = ['admin', 'congan'].includes(acc.username);
      const wardInfo = hideWard || acc.agency === 'traffic-rescue' ? '' : `· Địa bàn: <b>${acc.ward || 'Toàn thành phố'}</b>`;
      const pwdDisplay = acc.password || (acc.passwordHash ? '•••••••• (Đã bảo mật)' : '2026');
      const isContactVerified = acc.contactVerification === 'official' || acc.contactVerification === 'manual';
      const contactBadge = isContactVerified
        ? '<span style="font-size: 9px; font-weight: 800; color: #6ee7b7; background: rgba(16,185,129,0.14); padding: 1px 5px; border-radius: 4px;">✓ ĐÃ XÁC THỰC</span>'
        : '<span style="font-size: 9px; font-weight: 800; color: #fbbf24; background: rgba(245,158,11,0.14); padding: 1px 5px; border-radius: 4px;">ĐANG CẬP NHẬT</span>';
            const contactLabel = acc.contactVerification === 'official'
                ? 'SĐT công khai:'
                : (acc.contactVerification === 'manual' ? 'Liên hệ đã xác thực:' : 'Liên hệ:');

      card.innerHTML = `
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px; flex-wrap: wrap;">
            <span style="font-size: 12px; font-weight: 800; color: #fff; background: rgba(0,0,0,0.5); padding: 1px 6px; border-radius: 4px; border: 1px solid ${agencyColor}; letter-spacing: 0.5px;">
              ${acc.username.toUpperCase()}
            </span>
            <span style="font-size: 9.5px; font-weight: 800; color: ${agencyColor}; background: rgba(255,255,255,0.06); padding: 1px 5px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
              ${agencyIconSvg} ${levelLabel}
            </span>
            ${contactBadge}
            <span style="font-size: 10.5px; color: #94a3b8;">${wardInfo}</span>
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #cbd5e1; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 5px;">
            <svg class="svg-ico ico-xs ico-blue" viewBox="0 0 24 24"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h6M9 13h6M9 17h6"></path></svg> ${acc.agencyName || acc.unitName}
          </div>
          <div style="font-size: 10.5px; color: #94a3b8; display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
            <span style="display: inline-flex; align-items: center; gap: 4px;"><svg class="svg-ico ico-xs ico-purple" viewBox="0 0 24 24"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Cán bộ: <b style="color: #f8fafc;">${acc.officerRank || ''} ${acc.officerName || ''}</b></span>
            <span style="display: inline-flex; align-items: center; gap: 4px;"><svg class="svg-ico ico-xs ico-blue" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> ${contactLabel} <b style="color: #38bdf8;">${(acc.officerPhone || '').replace('(Số ảo test)', '').trim() || 'Đang cập nhật'}</b>${(acc.officerPhone || '').includes('(Số ảo test)') ? '<span style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 4px; padding: 1px 5px; font-size: 10px; font-weight: 700; margin-left: 4px;">Số ảo test</span>' : ''}</span>
            <span style="display: inline-flex; align-items: center; gap: 4px;"><svg class="svg-ico ico-xs ico-amber" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> Mật khẩu: <b style="color: #a78bfa; font-family: monospace; letter-spacing: 0.5px;">${pwdDisplay}</b></span>
          </div>
        </div>
        <div style="display: flex; gap: 4px; flex-shrink: 0;">
          <button type="button" class="btn-refresh-loc btn-edit-acc" style="font-size: 10px; padding: 3px 8px; border-color: rgba(56, 189, 248, 0.4); color: #38bdf8; display: inline-flex; align-items: center; gap: 3px;">
            <svg class="svg-ico ico-xs ico-blue" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Sửa
          </button>
          ${!isCore ? `
            <button type="button" class="btn-refresh-loc btn-del-acc" style="font-size: 10px; padding: 3px 6px; background: rgba(239,68,68,0.15); border-color: #ef4444; color: #f87171; display: inline-flex; align-items: center; gap: 3px;">
              <svg class="svg-ico ico-xs ico-red" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Xóa
            </button>
          ` : ''}
        </div>
      `;

      card.querySelector('.btn-edit-acc')?.addEventListener('click', (e) => {
        if (e) e.stopPropagation();
        this.openEditAccountModal(acc);
      });

      card.querySelector('.btn-del-acc')?.addEventListener('click', async (e) => {
        if (e) e.stopPropagation();
        if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản [${acc.username.toUpperCase()}] (${acc.agencyName || acc.unitName || ''})?`)) return;
        try {
          const res = await fetch('/api/admin/accounts/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: acc.username })
          });
          const d = await res.json();
          if (d.ok) {
            alert(`✅ Đã xóa tài khoản [${acc.username.toUpperCase()}] thành công!`);
            if (this.accountsList) {
              this.accountsList = this.accountsList.filter(a => (a.username || '').toLowerCase() !== acc.username.toLowerCase());
            }
            this.renderAdminAccountsList();
            await this.loadAdminAccounts();
          } else {
            alert('Lỗi: ' + (d.error || d.message || 'Không thể xóa'));
          }
        } catch (e) {
          alert('Lỗi kết nối máy chủ');
        }
      });

      return card;
    };

    // -------------------------------------------------------------
    // 1. Render National Command Section (Quốc Gia)
    // -------------------------------------------------------------
    if (nationalAccs.length > 0) {
      const natSection = document.createElement('div');
      natSection.style = 'background: rgba(139, 92, 246, 0.08); border: 1.5px solid rgba(139, 92, 246, 0.35); border-radius: 12px; padding: 10px 14px; flex-shrink: 0;';
      
      natSection.innerHTML = `
        <div style="font-size: 13px; font-weight: 800; color: #c084fc; display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
          <svg class="svg-ico ico-sm ico-purple" viewBox="0 0 24 24"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h6M9 13h6M9 17h6"></path></svg> I. CẤP TRUNG ƯƠNG / QUỐC GIA (TỔNG HỢP)
          <span style="font-size: 10px; background: rgba(139, 92, 246, 0.25); color: #e9d5ff; padding: 1px 6px; border-radius: 10px; margin-left: auto;">${nationalAccs.length} Tài Khoản</span>
        </div>
        <div class="national-cards-container" style="display: flex; flex-direction: column; gap: 6px;"></div>
      `;

      const container = natSection.querySelector('.national-cards-container');
      nationalAccs.forEach(acc => container.appendChild(createAccountCard(acc, 'TRUNG ƯƠNG')));
      this.adminAccountsListContainer.appendChild(natSection);
    }

    // -------------------------------------------------------------
    // 2. Render Province Tree Sections (Cần Thơ, TP.HCM, ...)
    // -------------------------------------------------------------
    Object.entries(provinceMap).forEach(([provName, groups], pIdx) => {
      const totalInProv = groups.policeProv.length + groups.policeWards.length + groups.csgt.length + groups.fire.length + groups.hospital.length + groups.trafficRescue.length;
      if (totalInProv === 0) return;

      const provSection = document.createElement('div');
      provSection.style = 'background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px; overflow: hidden; flex-shrink: 0;';

      const isOpenByDefault = isSearching || pIdx === 0 || provName === 'Cần Thơ';

      const cityNames = ['Cần Thơ', 'Đà Nẵng', 'Hải Phòng', 'TP. Hồ Chí Minh', 'Hà Nội', 'Huế'];
      const provLabel = (cityNames.includes(provName) || provName.includes('Hồ Chí Minh')) 
        ? (provName === 'TP. Hồ Chí Minh' ? 'TP. HỒ CHÍ MINH' : `TP. ${provName.toUpperCase()}`)
        : `TỈNH ${provName.toUpperCase()}`;

      provSection.innerHTML = `
        <div class="prov-accordion-header" style="background: linear-gradient(135deg, rgba(30, 58, 138, 0.4), rgba(15, 23, 42, 0.6)); padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none; border-bottom: ${isOpenByDefault ? '1px solid rgba(255,255,255,0.08)' : 'none'};">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg class="svg-ico ico-sm ico-blue" viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
            <span style="font-size: 13.5px; font-weight: 800; color: #38bdf8;">KHU VỰC: ${provLabel}</span>
            <span style="font-size: 10.5px; background: rgba(56, 189, 248, 0.2); color: #7dd3fc; padding: 2px 8px; border-radius: 12px; font-weight: 700;">${totalInProv} tài khoản</span>
          </div>
          <span class="prov-arrow" style="font-size: 12px; color: #94a3b8; transition: transform 0.2s;">${isOpenByDefault ? '▲' : '▼'}</span>
        </div>
        <div class="prov-accordion-body" style="display: ${isOpenByDefault ? 'flex' : 'none'}; flex-direction: column; gap: 10px; padding: 12px 14px;">
        </div>
      `;

      const headerEl = provSection.querySelector('.prov-accordion-header');
      const bodyEl = provSection.querySelector('.prov-accordion-body');
      const arrowEl = provSection.querySelector('.prov-arrow');

      headerEl.addEventListener('click', () => {
        const isHidden = bodyEl.style.display === 'none';
        bodyEl.style.display = isHidden ? 'flex' : 'none';
        arrowEl.textContent = isHidden ? '▲' : '▼';
        headerEl.style.borderBottom = isHidden ? '1px solid rgba(255,255,255,0.08)' : 'none';
      });

      // -------------------------------------------------------------
      // Sub-Group A: Lực Lượng Công An Nhân Dân (113)
      // -------------------------------------------------------------
      if (groups.policeProv.length > 0 || groups.policeWards.length > 0) {
        const policeGroup = document.createElement('div');
        policeGroup.style = 'background: rgba(0, 136, 255, 0.05); border: 1px solid rgba(0, 136, 255, 0.2); border-radius: 10px; padding: 10px; display: flex; flex-direction: column; gap: 8px;';
        
        policeGroup.innerHTML = `
          <div style="font-size: 12px; font-weight: 800; color: #60a5fa; display: flex; align-items: center; gap: 6px;">
            <svg class="svg-ico ico-xs ico-blue" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> 1. Lực lượng Công an Tỉnh/Tp
          </div>
          <div class="police-prov-container" style="display: flex; flex-direction: column; gap: 6px;"></div>
        `;

        const provContainer = policeGroup.querySelector('.police-prov-container');
        groups.policeProv.forEach(acc => provContainer.appendChild(createAccountCard(acc, 'CẤP TỈNH/TP')));

        // Nested Communes / Wards Accordion
        if (groups.policeWards.length > 0) {
          const wardAccordion = document.createElement('div');
          wardAccordion.style = 'background: rgba(0, 0, 0, 0.25); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; margin-top: 4px; overflow: hidden;';
          
          const wardOpenDefault = isSearching;

          wardAccordion.innerHTML = `
            <div class="ward-accordion-header" style="padding: 7px 10px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none; background: rgba(255,255,255,0.03);">
              <span style="font-size: 11.5px; font-weight: 700; color: #93c5fd; display: flex; align-items: center; gap: 6px;">
                <svg class="svg-ico ico-xs ico-blue" viewBox="0 0 24 24"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h6M9 13h6M9 17h6"></path></svg> Danh Sách Công An Xã / Phường (${groups.policeWards.length} đơn vị)
              </span>
              <span class="ward-arrow" style="font-size: 11px; color: #94a3b8;">${wardOpenDefault ? '▲' : '▼'}</span>
            </div>
            <div class="ward-accordion-body" style="display: ${wardOpenDefault ? 'grid' : 'none'}; grid-template-columns: 1fr; gap: 6px; padding: 8px;"></div>
          `;

          const wHeader = wardAccordion.querySelector('.ward-accordion-header');
          const wBody = wardAccordion.querySelector('.ward-accordion-body');
          const wArrow = wardAccordion.querySelector('.ward-arrow');

          wHeader.addEventListener('click', () => {
            const isHidden = wBody.style.display === 'none';
            wBody.style.display = isHidden ? 'grid' : 'none';
            wArrow.textContent = isHidden ? '▲' : '▼';
          });

          groups.policeWards.forEach(acc => wBody.appendChild(createAccountCard(acc, 'CẤP XÃ/PHƯỜNG')));
          policeGroup.appendChild(wardAccordion);
        }

        bodyEl.appendChild(policeGroup);
      }

      // -------------------------------------------------------------
      // Sub-Group B: Lực Lượng CSGT (Đơn vị Cấp Phòng PC08)
      // -------------------------------------------------------------
      if (groups.csgt.length > 0) {
        const csgtGroup = document.createElement('div');
        csgtGroup.style = 'background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 10px; padding: 10px; display: flex; flex-direction: column; gap: 8px;';
        csgtGroup.innerHTML = `
          <div style="font-size: 12px; font-weight: 800; color: #fbbf24; display: flex; align-items: center; gap: 6px;">
            <svg class="svg-ico ico-xs ico-amber" viewBox="0 0 24 24"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><circle cx="17" cy="17" r="2"></circle></svg> 2. LỰC LƯỢNG CẢNH SÁT GIAO THÔNG (ĐƠN VỊ CẤP PHÒNG — PC08)
          </div>
          <div class="csgt-cards-container" style="display: flex; flex-direction: column; gap: 6px;"></div>
        `;
        const csgtContainer = csgtGroup.querySelector('.csgt-cards-container');
        groups.csgt.forEach(acc => csgtContainer.appendChild(createAccountCard(acc, 'PHÒNG CSGT (PC08)')));
        bodyEl.appendChild(csgtGroup);
      }

      // -------------------------------------------------------------
      // Sub-Group C: Lực Lượng PCCC & CNCH (Đơn vị Cấp Phòng PC07)
      // -------------------------------------------------------------
      if (groups.fire.length > 0) {
        const fireGroup = document.createElement('div');
        fireGroup.style = 'background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 10px; padding: 10px; display: flex; flex-direction: column; gap: 8px;';
        fireGroup.innerHTML = `
          <div style="font-size: 12px; font-weight: 800; color: #f87171; display: flex; align-items: center; gap: 6px;">
            <svg class="svg-ico ico-xs ico-red" viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg> 3. LỰC LƯỢNG CẢNH SÁT PCCC & CNCH (ĐƠN VỊ CẤP PHÒNG — PC07)
          </div>
          <div class="fire-cards-container" style="display: flex; flex-direction: column; gap: 6px;"></div>
        `;
        const fireContainer = fireGroup.querySelector('.fire-cards-container');
        groups.fire.forEach(acc => fireContainer.appendChild(createAccountCard(acc, acc.level === 'province' ? 'PHÒNG PCCC (PC07)' : 'ĐỘI PCCC CƠ SỞ')));
        bodyEl.appendChild(fireGroup);
      }

      // -------------------------------------------------------------
      // Sub-Group D: Lực Lượng Cấp Cứu Y Tế 115
      // -------------------------------------------------------------
      if (groups.hospital.length > 0) {
        const hospGroup = document.createElement('div');
        hospGroup.style = 'background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 10px; padding: 10px; display: flex; flex-direction: column; gap: 8px;';
        hospGroup.innerHTML = `
          <div style="font-size: 12px; font-weight: 800; color: #34d399; display: flex; align-items: center; gap: 6px;">
            <svg class="svg-ico ico-xs ico-emerald" viewBox="0 0 24 24"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg> 4. LỰC LƯỢNG CẤP CỨU Y TẾ (115)
          </div>
          <div class="hosp-cards-container" style="display: flex; flex-direction: column; gap: 6px;"></div>
        `;
        const hospContainer = hospGroup.querySelector('.hosp-cards-container');
        groups.hospital.forEach(acc => hospContainer.appendChild(createAccountCard(acc, 'CẤP TỈNH/TP')));
        bodyEl.appendChild(hospGroup);
      }

      // -------------------------------------------------------------
      // Sub-Group E: Cứu Hộ Doanh Nghiệp (Không để xã/phường)
      // -------------------------------------------------------------
      if (groups.trafficRescue.length > 0) {
        const rescueGroup = document.createElement('div');
        rescueGroup.style = 'background: rgba(249, 115, 22, 0.05); border: 1px solid rgba(249, 115, 22, 0.2); border-radius: 10px; padding: 10px; display: flex; flex-direction: column; gap: 8px;';
        rescueGroup.innerHTML = `
          <div style="font-size: 12px; font-weight: 800; color: #fb923c; display: flex; align-items: center; gap: 6px;">
            <svg class="svg-ico ico-xs ico-amber" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg> 5. DOANH NGHIỆP CỨU HỘ XE & ĐƯỜNG BỘ (KHU VỰC TP. ${provName.toUpperCase()})
          </div>
          <div class="rescue-cards-container" style="display: flex; flex-direction: column; gap: 6px;"></div>
        `;
        const rescueContainer = rescueGroup.querySelector('.rescue-cards-container');
        groups.trafficRescue.forEach(acc => rescueContainer.appendChild(createAccountCard(acc, 'DOANH NGHIỆP CỨU HỘ', true)));
        bodyEl.appendChild(rescueGroup);
      }

      this.adminAccountsListContainer.appendChild(provSection);
    });
  }

  initAdminSecuritySystem() {
    this.tabAdminAccounts = document.getElementById('tabAdminAccounts');
    this.tabAdminSecurityLogs = document.getElementById('tabAdminSecurityLogs');
    this.viewAdminAccountsTab = document.getElementById('viewAdminAccountsTab');
    this.viewAdminSecurityLogsTab = document.getElementById('viewAdminSecurityLogsTab');

    this.toggleGatekeeperSecurity = document.getElementById('toggleGatekeeperSecurity');
    this.toggleAntiCopySecurity = document.getElementById('toggleAntiCopySecurity');
    this.toggleAntiDevToolsSecurity = document.getElementById('toggleAntiDevToolsSecurity');

    this.lockedIpsCountBadge = document.getElementById('lockedIpsCountBadge');
    this.lockedIpsListContainer = document.getElementById('lockedIpsListContainer');
    this.securityAlertsCountBadge = document.getElementById('securityAlertsCountBadge');
    this.securityAlertsListContainer = document.getElementById('securityAlertsListContainer');

    this.btnRefreshSecurityAuditLogs = document.getElementById('btnRefreshSecurityAuditLogs');
    this.btnClearSecurityAuditLogs = document.getElementById('btnClearSecurityAuditLogs');
    this.inputFilterAuditSearch = document.getElementById('inputFilterAuditSearch');
    this.selectFilterAuditProvince = document.getElementById('selectFilterAuditProvince');
    this.selectFilterAuditAgency = document.getElementById('selectFilterAuditAgency');
    this.selectFilterAuditStatus = document.getElementById('selectFilterAuditStatus');
    this.tableBodySecurityAuditLogs = document.getElementById('tableBodySecurityAuditLogs');

    this.securityAuditData = { loginHistory: [], securityAlerts: [], lockedIps: [] };

    // Tab Switching
    if (this.tabAdminAccounts && this.tabAdminSecurityLogs) {
      this.tabAdminAccounts.addEventListener('click', () => {
        this.tabAdminAccounts.classList.add('is-active');
        this.tabAdminSecurityLogs.classList.remove('is-active');
        if (this.viewAdminAccountsTab) this.viewAdminAccountsTab.style.display = 'flex';
        if (this.viewAdminSecurityLogsTab) this.viewAdminSecurityLogsTab.style.display = 'none';
      });

      this.tabAdminSecurityLogs.addEventListener('click', async () => {
        this.tabAdminSecurityLogs.classList.add('is-active');
        this.tabAdminAccounts.classList.remove('is-active');
        if (this.viewAdminSecurityLogsTab) this.viewAdminSecurityLogsTab.style.display = 'flex';
        if (this.viewAdminAccountsTab) this.viewAdminAccountsTab.style.display = 'none';
        await this.loadSecurityAuditLogs();
      });
    }

    // Toggle Handlers
    const updateSecuritySetting = async (key, val) => {
      try {
        const payload = { [key]: val };
        const res = await fetch('/api/security/config/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.ok) {
          this.securityConfig = data.config;
          this.initClientCyberDefense(data.config);
        }
      } catch (err) {
        console.error('Failed to update security config:', err);
      }
    };

    if (this.toggleGatekeeperSecurity) {
      this.toggleGatekeeperSecurity.addEventListener('change', (e) => {
        updateSecuritySetting('gatekeeperEnabled', e.target.checked);
      });
    }
    if (this.toggleAntiCopySecurity) {
      this.toggleAntiCopySecurity.addEventListener('change', (e) => {
        updateSecuritySetting('antiCopyEnabled', e.target.checked);
      });
    }
    if (this.toggleAntiDevToolsSecurity) {
      this.toggleAntiDevToolsSecurity.addEventListener('change', (e) => {
        updateSecuritySetting('antiDevToolsEnabled', e.target.checked);
      });
    }

    // Voice AI SOS Controls
    this.selectVoiceAiRate = document.getElementById('selectVoiceAiRate');
    this.selectVoiceAiPitch = document.getElementById('selectVoiceAiPitch');
    this.selectVoiceAiRepeats = document.getElementById('selectVoiceAiRepeats');
    this.toggleVoiceAiChime = document.getElementById('toggleVoiceAiChime');
    this.btnTestVoiceAiConfig = document.getElementById('btnTestVoiceAiConfig');
    this.btnSaveVoiceAiConfig = document.getElementById('btnSaveVoiceAiConfig');
    this.voiceAiStatusNotice = document.getElementById('voiceAiStatusNotice');

    // Load saved local voice config if exists
    try {
      const localVoice = localStorage.getItem('sos_voice_config');
      if (localVoice) {
        this.voiceConfig = { ...(this.voiceConfig || {}), ...JSON.parse(localVoice) };
      }
    } catch (e) {}

    // Test Voice AI button
    if (this.btnTestVoiceAiConfig) {
      this.btnTestVoiceAiConfig.addEventListener('click', () => {
        const testConfig = {
          rate: this.selectVoiceAiRate ? parseFloat(this.selectVoiceAiRate.value) : 1.0,
          pitch: this.selectVoiceAiPitch ? parseFloat(this.selectVoiceAiPitch.value) : 1.0,
          repeats: 1,
          playChime: this.toggleVoiceAiChime ? this.toggleVoiceAiChime.checked : true
        };
        this.testVoicePrompt(testConfig);
      });
    }

    // Save Voice AI button
    if (this.btnSaveVoiceAiConfig) {
      this.btnSaveVoiceAiConfig.addEventListener('click', async () => {
        const newVoiceConfig = {
          rate: this.selectVoiceAiRate ? parseFloat(this.selectVoiceAiRate.value) : 1.0,
          pitch: this.selectVoiceAiPitch ? parseFloat(this.selectVoiceAiPitch.value) : 1.0,
          repeats: this.selectVoiceAiRepeats ? parseInt(this.selectVoiceAiRepeats.value, 10) : 3,
          playChime: this.toggleVoiceAiChime ? this.toggleVoiceAiChime.checked : true
        };

        this.voiceConfig = newVoiceConfig;
        localStorage.setItem('sos_voice_config', JSON.stringify(newVoiceConfig));

        try {
          this.btnSaveVoiceAiConfig.disabled = true;
          this.btnSaveVoiceAiConfig.textContent = 'Đang lưu...';

          const res = await fetch('/api/security/config/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ voiceConfig: newVoiceConfig })
          });
          const data = await res.json();
          if (data.ok) {
            if (this.voiceAiStatusNotice) {
              this.voiceAiStatusNotice.style.display = 'block';
              setTimeout(() => {
                if (this.voiceAiStatusNotice) this.voiceAiStatusNotice.style.display = 'none';
              }, 3500);
            }
          }
        } catch (err) {
          console.error('Failed to save voice config to server:', err);
        } finally {
          this.btnSaveVoiceAiConfig.disabled = false;
          this.btnSaveVoiceAiConfig.innerHTML = '<svg class="svg-ico ico-xs ico-white" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Lưu Cấu Hình Giọng Đọc';
        }
      });
    }

    // Refresh & Clear Logs
    if (this.btnRefreshSecurityAuditLogs) {
      this.btnRefreshSecurityAuditLogs.addEventListener('click', () => this.loadSecurityAuditLogs());
    }
    if (this.btnClearSecurityAuditLogs) {
      this.btnClearSecurityAuditLogs.addEventListener('click', async () => {
        if (!confirm('Bạn có chắc chắn muốn dọn dẹp toàn bộ nhật ký lịch sử đăng nhập?')) return;
        try {
          const res = await fetch('/api/security/clear-logs', { method: 'POST' });
          const data = await res.json();
          if (data.ok) {
            alert('Đã xóa nhật ký đăng nhập.');
            await this.loadSecurityAuditLogs();
          }
        } catch (e) {}
      });
    }

    // Audit Filters
    [this.inputFilterAuditSearch, this.selectFilterAuditProvince, this.selectFilterAuditAgency, this.selectFilterAuditStatus].forEach(el => {
      if (el) el.addEventListener('input', () => this.renderSecurityAuditTable());
    });
  }

  async loadSecurityAuditLogs() {
    try {
      const res = await fetch('/api/security/audit-logs');
      const data = await res.json();
      if (data.ok) {
        this.securityAuditData = data;
        
        // Sync toggle states
        if (this.toggleGatekeeperSecurity && data.config) {
          this.toggleGatekeeperSecurity.checked = data.config.gatekeeperEnabled !== false;
        }
        if (this.toggleAntiCopySecurity && data.config) {
          this.toggleAntiCopySecurity.checked = data.config.antiCopyEnabled !== false;
        }
        if (this.toggleAntiDevToolsSecurity && data.config) {
          this.toggleAntiDevToolsSecurity.checked = data.config.antiDevToolsEnabled !== false;
        }

        // Sync Voice AI config
        const vCfg = data.config?.voiceConfig || this.voiceConfig || {};
        if (vCfg) {
          this.voiceConfig = { ...(this.voiceConfig || {}), ...vCfg };
          if (this.selectVoiceAiRegion && vCfg.voiceType) this.selectVoiceAiRegion.value = vCfg.voiceType;
          if (this.selectVoiceAiRate && vCfg.rate !== undefined) this.selectVoiceAiRate.value = (parseFloat(vCfg.rate) || 1.0).toFixed(1);
          if (this.selectVoiceAiPitch && vCfg.pitch !== undefined) this.selectVoiceAiPitch.value = (parseFloat(vCfg.pitch) || 1.0).toFixed(1);
          if (this.selectVoiceAiRepeats && vCfg.repeats !== undefined) this.selectVoiceAiRepeats.value = String(vCfg.repeats);
          if (this.toggleVoiceAiChime && vCfg.playChime !== undefined) this.toggleVoiceAiChime.checked = vCfg.playChime !== false;
        }

        // Populate 34 Provinces in filter dropdown if not yet populated
        if (this.selectFilterAuditProvince && this.selectFilterAuditProvince.children.length <= 1) {
          const provinces = [
            'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Huế',
            'An Giang', 'Bắc Ninh', 'Bến Tre', 'Bình Dương', 'Bình Định', 'Bình Phước', 'Bình Thuận',
            'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông', 'Điện Biên', 'Đồng Nai', 'Đồng Tháp',
            'Gia Lai', 'Hà Giang', 'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình',
            'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu', 'Lạng Sơn', 'Lào Cai'
          ];
          provinces.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p;
            opt.textContent = p;
            this.selectFilterAuditProvince.appendChild(opt);
          });
        }

        this.renderLockedIpsList(data.lockedIps || []);
        this.renderSecurityAlertsList(data.securityAlerts || []);
        this.renderSecurityAuditTable();
      }
    } catch (err) {
      console.warn('Failed to load audit logs:', err);
    }
  }

  renderLockedIpsList(lockedIps) {
    if (!this.lockedIpsListContainer) return;
    if (this.lockedIpsCountBadge) this.lockedIpsCountBadge.textContent = `${lockedIps.length} IP`;

    if (lockedIps.length === 0) {
      this.lockedIpsListContainer.innerHTML = '<div style="font-size: 11px; color: #94a3b8; font-style: italic;">Hiện không có địa chỉ IP nào bị khóa 2 tiếng.</div>';
      return;
    }

    this.lockedIpsListContainer.innerHTML = '';
    lockedIps.forEach(item => {
      const row = document.createElement('div');
      row.style = 'display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.3); border: 1px solid rgba(239, 68, 68, 0.3); padding: 6px 10px; border-radius: 6px; font-size: 11px;';
      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px;">
          <svg class="svg-ico ico-xs ico-red" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
          <span style="color: #f87171; font-weight: 800;">IP: ${item.ip}</span>
          <span style="color: #cbd5e1; margin-left: 8px;">(Đã sai ${item.count} lần · Còn lại ${item.remainingMinutes} phút)</span>
        </div>
        <button type="button" class="btn-refresh-loc btn-unban-ip" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; font-size: 10px; color: #34d399; border-color: #10b981; background: rgba(16,185,129,0.15);">
          <svg class="svg-ico ico-xs ico-emerald" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg> Mở Khóa Ngay
        </button>
      `;
      row.querySelector('.btn-unban-ip')?.addEventListener('click', async () => {
        try {
          const res = await fetch('/api/security/unban-ip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip: item.ip })
          });
          const d = await res.json();
          if (d.ok) {
            alert(`Đã mở khóa cho địa chỉ IP ${item.ip}!`);
            await this.loadSecurityAuditLogs();
          }
        } catch (e) {
          alert('Lỗi khi mở khóa IP');
        }
      });
      this.lockedIpsListContainer.appendChild(row);
    });
  }

  renderSecurityAlertsList(alerts) {
    if (!this.securityAlertsListContainer) return;
    if (this.securityAlertsCountBadge) this.securityAlertsCountBadge.textContent = `${alerts.length} cảnh báo`;

    if (alerts.length === 0) {
      this.securityAlertsListContainer.innerHTML = '<div style="font-size: 11px; color: #94a3b8; font-style: italic;">Chưa phát hiện hành vi xâm nhập trái phép nào.</div>';
      return;
    }

    this.securityAlertsListContainer.innerHTML = '';
    alerts.slice(0, 20).forEach(al => {
      const card = document.createElement('div');
      card.style = 'background: rgba(0,0,0,0.3); border: 1px solid rgba(245, 158, 11, 0.3); padding: 6px 10px; border-radius: 6px; font-size: 11px;';
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
          <span style="color: #fbbf24; font-weight: 800; display: inline-flex; align-items: center; gap: 5px;">
            <svg class="svg-ico ico-xs ico-amber" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            [${al.type}] IP: ${al.ip}
          </span>
          <span style="color: #94a3b8; font-size: 10px;">${al.timeVN || al.timestamp}</span>
        </div>
        <div style="color: #f1f5f9; font-size: 10.5px; margin-left: 20px;">${al.message}</div>
        <div style="color: #94a3b8; font-size: 10px; margin-top: 4px; display: flex; align-items: center; gap: 12px; margin-left: 20px;">
          <span style="display: inline-flex; align-items: center; gap: 4px;">
            <svg class="svg-ico ico-xs ico-blue" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
            <b>Thiết bị:</b> ${al.deviceInfo || al.userAgent}
          </span>
          <span style="display: inline-flex; align-items: center; gap: 4px;">
            <svg class="svg-ico ico-xs ico-amber" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <b>Vị trí:</b> ${al.location || 'IP Định Vị'}
          </span>
        </div>
      `;
      this.securityAlertsListContainer.appendChild(card);
    });
  }

  renderSecurityAuditTable() {
    if (!this.tableBodySecurityAuditLogs) return;
    const history = this.securityAuditData?.loginHistory || [];

    const searchKw = (this.inputFilterAuditSearch?.value || '').trim().toLowerCase();
    const filterProv = this.selectFilterAuditProvince?.value || 'all';
    const filterAgency = this.selectFilterAuditAgency?.value || 'all';
    const filterStatus = this.selectFilterAuditStatus?.value || 'all';

    let filtered = history.filter(item => {
      if (filterProv !== 'all' && !(item.province || '').toLowerCase().includes(filterProv.toLowerCase())) return false;
      if (filterAgency !== 'all' && item.agency !== filterAgency) return false;
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      if (searchKw) {
        const u = (item.username || '').toLowerCase();
        const o = (item.officerName || '').toLowerCase();
        const ip = (item.ip || '').toLowerCase();
        const a = (item.agencyName || '').toLowerCase();
        const n = (item.note || '').toLowerCase();
        return u.includes(searchKw) || o.includes(searchKw) || ip.includes(searchKw) || a.includes(searchKw) || n.includes(searchKw);
      }
      return true;
    });

    if (filtered.length === 0) {
      this.tableBodySecurityAuditLogs.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 20px; color: #94a3b8; font-style: italic;">
            Không có bản ghi nhật ký nào phù hợp với bộ lọc.
          </td>
        </tr>
      `;
      return;
    }

    this.tableBodySecurityAuditLogs.innerHTML = '';
    filtered.forEach(item => {
      const tr = document.createElement('tr');
      tr.style = 'border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.15s;';
      tr.addEventListener('mouseenter', () => tr.style.background = 'rgba(255,255,255,0.03)');
      tr.addEventListener('mouseleave', () => tr.style.background = 'transparent');

      const isSuccess = item.status === 'SUCCESS';
      const isLocked = item.status === 'LOCKED_OUT';
      const statusBadge = isSuccess
        ? `<span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(16, 185, 129, 0.2); color: #34d399; font-weight: 800; padding: 2px 6px; border-radius: 4px; font-size: 10px; border: 1px solid rgba(16, 185, 129, 0.4);"><svg class="svg-ico ico-xs ico-emerald" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg> THÀNH CÔNG</span>`
        : (isLocked
          ? `<span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(239, 68, 68, 0.25); color: #f87171; font-weight: 800; padding: 2px 6px; border-radius: 4px; font-size: 10px; border: 1px solid #ef4444;"><svg class="svg-ico ico-xs ico-red" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg> KHÓA IP 2H</span>`
          : `<span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(245, 158, 11, 0.2); color: #fbbf24; font-weight: 800; padding: 2px 6px; border-radius: 4px; font-size: 10px; border: 1px solid rgba(245, 158, 11, 0.4);"><svg class="svg-ico ico-xs ico-amber" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> SAI PASS</span>`);

      tr.innerHTML = `
        <td style="padding: 6px 8px; color: #94a3b8; font-size: 10px;">${item.timeVN || item.timestamp}</td>
        <td style="padding: 6px 8px; font-weight: 800; color: #f8fafc;">${item.username}</td>
        <td style="padding: 6px 8px;">
          <div style="color: #cbd5e1; font-weight: 700;">${item.officerName || 'Không xác định'}</div>
          <div style="font-size: 10px; color: #94a3b8;">${item.agencyName || ''}</div>
        </td>
        <td style="padding: 6px 8px; color: #38bdf8; font-weight: 700;">${item.province || 'Toàn Quốc'}</td>
        <td style="padding: 6px 8px;">
          <div style="font-family: monospace; color: #fbbf24; font-weight: 700;">${item.ip}</div>
          <div style="font-size: 9.5px; color: #94a3b8;">${item.deviceInfo || item.userAgent || ''}</div>
        </td>
        <td style="padding: 6px 8px; text-align: center;">
          ${statusBadge}
          <div style="font-size: 9.5px; color: #94a3b8; margin-top: 2px;">${item.note || ''}</div>
        </td>
      `;
      this.tableBodySecurityAuditLogs.appendChild(tr);
    });
  }

  initClientCyberDefense(config) {
    if (!config) return;

    // 1. Anti-Copy & Select Protection
    if (config.antiCopyEnabled !== false) {
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';

      document.addEventListener('contextmenu', (e) => {
        // Prevent right-click context menu
        e.preventDefault();
      }, { passive: false });

      ['copy', 'cut', 'dragstart'].forEach(ev => {
        document.addEventListener(ev, (e) => {
          const tag = e.target.tagName.toLowerCase();
          if (tag !== 'input' && tag !== 'textarea') {
            e.preventDefault();
          }
        }, { passive: false });
      });
    }

    // 2. Anti-DevTools & Keyboard Shortcuts Guard
    if (config.antiDevToolsEnabled !== false) {
      window.addEventListener('keydown', (e) => {
        // Block F12
        if (e.key === 'F12' || e.keyCode === 123) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        // Block Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Inspect elements)
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        // Block Ctrl+U (View source)
        if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        // Block Ctrl+S (Save page)
        if (e.ctrlKey && (e.key === 'S' || e.key === 's')) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        // Block Ctrl+P (Print page directly except document print button)
        if (e.ctrlKey && (e.key === 'P' || e.key === 'p')) {
          const docModal = document.getElementById('incidentReportDocxModal');
          if (!docModal || docModal.style.display !== 'flex') {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        }
      }, true);

      // Anti-debugging timing trap loop
      if (!this._antiDebugTimer) {
        this._antiDebugTimer = setInterval(() => {
          const start = performance.now();
          debugger;
          const end = performance.now();
          if (end - start > 100) {
            console.warn('🛡️ [CYBER DEFENSE] Developer Tools inspection detected!');
          }
        }, 1500);
      }
    }
  }

  initStationDirectory() {
    // Tab switching for 5 Panels (Incidents, History, Stations, Enterprises, Hospitals)
    const switchTab = (activeTab) => {
      if (this.tabBtnIncidents) this.tabBtnIncidents.classList.toggle('is-active', activeTab === 'incidents');
      if (this.tabBtnHistory) this.tabBtnHistory.classList.toggle('is-active', activeTab === 'history');
      if (this.tabBtnStations) this.tabBtnStations.classList.toggle('is-active', activeTab === 'stations');
      if (this.tabBtnEnterprises) this.tabBtnEnterprises.classList.toggle('is-active', activeTab === 'enterprises');
      if (this.tabBtnHospitals) this.tabBtnHospitals.classList.toggle('is-active', activeTab === 'hospitals');

      if (this.panelIncidentsView) this.panelIncidentsView.style.display = activeTab === 'incidents' ? 'flex' : 'none';
      if (this.panelHistoryView) {
        this.panelHistoryView.style.display = activeTab === 'history' ? 'flex' : 'none';
        if (activeTab !== 'history') {
          this.panelHistoryView.classList.remove('is-expanded-history');
          document.body.classList.remove('has-expanded-history');
          const pullStatus = document.getElementById('historyPullStatus');
          const pullChevron = document.getElementById('historyPullChevron');
          if (pullStatus) pullStatus.textContent = 'Kéo lên để xem rộng';
          if (pullChevron) pullChevron.innerHTML = '<polyline points="18 15 12 9 6 15"></polyline>';
        }
      }
      if (this.panelStationsView) this.panelStationsView.style.display = activeTab === 'stations' ? 'flex' : 'none';
      if (this.panelEnterprisesView) this.panelEnterprisesView.style.display = activeTab === 'enterprises' ? 'flex' : 'none';
      if (this.panelHospitalsView) this.panelHospitalsView.style.display = activeTab === 'hospitals' ? 'flex' : 'none';
    };

    // Pull-up Expandable Handle for Processed Incidents History
    const historyPullHandle = document.getElementById('historyPullHandle');
    if (historyPullHandle) {
      const setExpanded = (expanded) => {
        if (!this.panelHistoryView) return;
        const isExp = !!expanded;
        this.panelHistoryView.classList.toggle('is-expanded-history', isExp);
        document.body.classList.toggle('has-expanded-history', isExp);
        historyPullHandle.setAttribute('aria-expanded', String(isExp));
        const pullStatus = document.getElementById('historyPullStatus');
        const pullChevron = document.getElementById('historyPullChevron');
        if (pullStatus) pullStatus.textContent = isExp ? 'Thu gọn danh sách' : 'Kéo lên để xem rộng';
        if (pullChevron) pullChevron.innerHTML = isExp 
          ? '<polyline points="6 9 12 15 18 9"></polyline>' 
          : '<polyline points="18 15 12 9 6 15"></polyline>';
      };
      let drag = null;
      let suppressClick = false;
      historyPullHandle.addEventListener('click', (event) => {
        if (suppressClick && event.detail !== 0) { suppressClick = false; return; }
        setExpanded(!this.panelHistoryView?.classList.contains('is-expanded-history'));
      });
      historyPullHandle.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setExpanded(!this.panelHistoryView?.classList.contains('is-expanded-history'));
        } else if (event.key === 'Escape') setExpanded(false);
      });
      historyPullHandle.addEventListener('pointerdown', (event) => {
        if (!event.isPrimary || event.button !== 0) return;
        suppressClick = false;
        drag = { id: event.pointerId, y: event.clientY, delta: 0 };
        historyPullHandle.setPointerCapture(event.pointerId);
      });
      historyPullHandle.addEventListener('pointermove', (event) => {
        if (!drag || drag.id !== event.pointerId) return;
        drag.delta = event.clientY - drag.y;
        historyPullHandle.style.transform = `translateY(${Math.max(-12, Math.min(12, drag.delta / 4))}px)`;
      });
      const finishDrag = (event) => {
        if (!drag || drag.id !== event.pointerId) return;
        const delta = drag.delta;
        drag = null;
        historyPullHandle.style.transform = '';
        if (historyPullHandle.hasPointerCapture(event.pointerId)) historyPullHandle.releasePointerCapture(event.pointerId);
        if (event.type === 'pointerup' && Math.abs(delta) >= 24) {
          suppressClick = true;
          setExpanded(delta < 0);
        }
      };
      historyPullHandle.addEventListener('pointerup', finishDrag);
      historyPullHandle.addEventListener('pointercancel', finishDrag);
      historyPullHandle.addEventListener('lostpointercapture', finishDrag);
      window.addEventListener('sos:tactical-view', (event) => {
        if (event.detail?.view !== 'queue') setExpanded(false);
      });
      new MutationObserver(() => {
        if (this.panelHistoryView.style.display === 'none') setExpanded(false);
      }).observe(this.panelHistoryView, { attributes: true, attributeFilter: ['style'] });
    }

    if (this.tabBtnIncidents) {
      this.tabBtnIncidents.addEventListener('click', () => switchTab('incidents'));
    }

    if (this.tabBtnHistory) {
      this.tabBtnHistory.addEventListener('click', () => {
        switchTab('history');
        this.renderHistoryList();
      });
    }

    if (this.tabBtnStations) {
      this.tabBtnStations.addEventListener('click', async () => {
        switchTab('stations');
        if (this.stationsList.length === 0) {
          await this.loadStationsDirectory();
        }
        this.renderStationsDirectory();
      });
    }

    if (this.tabBtnEnterprises) {
      this.tabBtnEnterprises.addEventListener('click', async () => {
        switchTab('enterprises');
        if (this.enterprisesList.length === 0) {
          await this.loadEnterprisesDirectory();
        }
        this.renderEnterprisesDirectory();
      });
    }

    if (this.tabBtnHospitals) {
      this.tabBtnHospitals.addEventListener('click', async () => {
        switchTab('hospitals');
        if (this.hospitalsList.length === 0) {
          await this.loadHospitalsDirectory();
        }
        this.renderHospitalsDirectory();
      });
    }

    // History Toolbar listeners — registered once here; second copy in rebindAfterLogin() at line ~4927 is authoritative
    // (Duplicate binding removed to prevent double-fire)

    // Region buttons with Map sync
    const REGION_CENTERS = {
      'Cần Thơ': { center: [105.775, 10.035], zoom: 13.5 },
      'TP. Hồ Chí Minh': { center: [106.695, 10.772], zoom: 13.5 },
      'Hà Nội': { center: [105.850, 21.028], zoom: 13.5 },
      'Đà Nẵng': { center: [108.220, 16.068], zoom: 13.5 },
      'all': { center: [106.0, 16.0], zoom: 5.8 }
    };

    this.stationRegionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.stationRegionBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        this.selectedStationRegion = btn.dataset.region;
        this.renderStationsDirectory();

        if (this.mapController && this.mapController.map) {
          const cfg = REGION_CENTERS[this.selectedStationRegion] || REGION_CENTERS['all'];
          const isAdm = Boolean(this.currentOfficer && (this.currentOfficer.username === 'admin' || this.currentOfficer.agency === 'all'));
          const isAll = this.selectedStationRegion === 'all';
          this.mapController.loadAllStationsMarkers(this.selectedStationRegion, (isAdm || isAll) ? 'all' : this.currentOfficer?.agency, isAdm || isAll);
          this.mapController.map.flyTo({
            center: cfg.center,
            zoom: cfg.zoom,
            duration: 1200
          });
        }
      });
    });

    // Search filter
    if (this.inputSearchStations) {
      this.inputSearchStations.addEventListener('input', (e) => {
        this.searchStationKeyword = e.target.value.toLowerCase().trim();
        this.renderStationsDirectory();
      });
    }

    // Map Picker triggers
    this.btnTriggerPickOnMap = document.getElementById('btnTriggerPickOnMap');
    this.btnAddNewStationPick = document.getElementById('btnAddNewStationPick');
    this.mapPickModeBanner = document.getElementById('mapPickModeBanner');
    this.btnCancelMapPick = document.getElementById('btnCancelMapPick');

    if (this.btnTriggerPickOnMap) {
      this.btnTriggerPickOnMap.addEventListener('click', () => {
        this.startMapPickMode('edit');
      });
    }

    if (this.btnAddNewStationPick) {
      this.btnAddNewStationPick.addEventListener('click', () => {
        this.startMapPickMode('add');
      });
    }

    if (this.btnCancelMapPick) {
      this.btnCancelMapPick.addEventListener('click', () => {
        this.stopMapPickMode();
      });
    }

    // Edit modal events
    if (this.btnCloseEditStationModal) {
      this.btnCloseEditStationModal.addEventListener('click', () => {
        this.editStationModal.style.display = 'none';
      });
    }

    // Delete button in edit modal
    const btnDeleteFromModal = document.getElementById('btnDeleteStationFromModal');
    if (btnDeleteFromModal) {
      btnDeleteFromModal.addEventListener('click', () => {
        const id = this.editStationId.value;
        const name = this.editStationName.value;
        if (id) this.handleDeleteStation(id, name);
      });
    }

    if (this.formEditStation) {
      this.formEditStation.addEventListener('submit', async (e) => {
        e.preventDefault();
        const idVal = this.editStationId.value;
        const updateData = {
          id: idVal || undefined,
          province: this.selectedStationRegion === 'all' ? 'Cần Thơ' : this.selectedStationRegion,
          agency: 'police',
          name: this.editStationName.value.trim(),
          address: this.editStationAddress.value.trim(),
          phone: this.editStationPhone.value.trim(),
          sms: this.editStationSms.value.trim(),
          officer: this.editStationOfficer.value.trim(),
          lat: parseFloat(this.editStationLat.value),
          lng: parseFloat(this.editStationLng.value)
        };

        const endpoint = idVal ? '/api/stations/update' : '/api/stations/create';

        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
          });
          const data = await res.json();
          if (data.ok) {
            alert('✅ Đã lưu cập nhật trụ sở thành công!');
            this.editStationModal.style.display = 'none';
            await this.loadStationsDirectory();
            this.renderStationsDirectory();
            if (this.mapController) {
              this.mapController.loadAllStationsMarkers(this.selectedStationRegion);
            }
          } else {
            alert('Lỗi: ' + (data.error || 'Không thể lưu'));
          }
        } catch (err) {
          alert('Lỗi kết nối máy chủ');
        }
      });
    }

    // Preload
    this.loadStationsDirectory();
  }

  initLocationPickerModal() {
    this.modalLocationPicker = document.getElementById('modalLocationPicker');
    this.btnCloseLocationPickerModal = document.getElementById('btnCloseLocationPickerModal');
    this.btnConfirmLocationPicker = document.getElementById('btnConfirmLocationPicker');
    this.inputLocationPickerSearch = document.getElementById('inputLocationPickerSearch');
    this.btnLocationPickerSearch = document.getElementById('btnLocationPickerSearch');
    this.btnLocationPickerGps = document.getElementById('btnLocationPickerGps');
    this.locationPickerAddressDisplay = document.getElementById('locationPickerAddressDisplay');
    this.locationPickerCoordsDisplay = document.getElementById('locationPickerCoordsDisplay');

    if (this.btnCloseLocationPickerModal) {
      this.btnCloseLocationPickerModal.addEventListener('click', () => {
        if (this.modalLocationPicker) this.modalLocationPicker.style.display = 'none';
      });
    }

    if (this.btnLocationPickerGps) {
      this.btnLocationPickerGps.addEventListener('click', () => {
        if (!navigator.geolocation) {
          alert('Thiết bị không hỗ trợ GPS');
          return;
        }
        this.btnLocationPickerGps.textContent = '⏳ Đang định vị...';
        navigator.geolocation.getCurrentPosition(async (pos) => {
          this.btnLocationPickerGps.textContent = '📡 Vị trí GPS hiện tại';
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          this.setLocationPickerPoint(lat, lng, true);
        }, (err) => {
          this.btnLocationPickerGps.textContent = '📡 Vị trí GPS hiện tại';
          alert('Lỗi GPS: ' + err.message);
        }, { enableHighAccuracy: true });
      });
    }

    const doSearch = async () => {
      const q = this.inputLocationPickerSearch?.value.trim();
      if (!q) return;
      this.btnLocationPickerSearch.textContent = '⏳';
      try {
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (data.ok && data.lat && data.lng) {
          this.setLocationPickerPoint(data.lat, data.lng, true, data.address, data.ward, data.province);
        } else {
          alert('Không tìm thấy địa chỉ này trên bản đồ');
        }
      } catch (e) {
        alert('Lỗi tìm kiếm: ' + e.message);
      } finally {
        this.btnLocationPickerSearch.textContent = '🔍 Tìm';
      }
    };

    if (this.btnLocationPickerSearch) {
      this.btnLocationPickerSearch.addEventListener('click', doSearch);
    }
    if (this.inputLocationPickerSearch) {
      this.inputLocationPickerSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          doSearch();
        }
      });
    }

    if (this.btnConfirmLocationPicker) {
      this.btnConfirmLocationPicker.addEventListener('click', () => {
        if (!this.pickedLocation || typeof this.pickedLocation.lat !== 'number' || typeof this.pickedLocation.lng !== 'number') {
          alert('Vui lòng nhấp vào bản đồ để chọn một vị trí trước khi xác nhận!');
          return;
        }
        if (this.locationPickerTarget === 'account') {
          const latInput = document.getElementById('editAccLat');
          const lngInput = document.getElementById('editAccLng');
          const addrInput = document.getElementById('editAccAddress');
          const wardInput = document.getElementById('editAccWard');
          const provInput = document.getElementById('editAccProvince');

          if (latInput) {
            latInput.value = this.pickedLocation.lat.toFixed(6);
            latInput.style.borderColor = '#10b981';
          }
          if (lngInput) {
            lngInput.value = this.pickedLocation.lng.toFixed(6);
            lngInput.style.borderColor = '#10b981';
          }
          if (addrInput && this.pickedLocation.address) {
            addrInput.value = this.pickedLocation.address;
            addrInput.style.borderColor = '#10b981';
          }
          if (wardInput && this.pickedLocation.ward) wardInput.value = this.pickedLocation.ward;
          if (provInput && this.pickedLocation.province) provInput.value = this.pickedLocation.province;

          const btnPickAcc = document.getElementById('btnPickAccLocationOnMap');
          if (btnPickAcc) {
            btnPickAcc.innerHTML = `✓ Đã Ghim (${this.pickedLocation.lat.toFixed(4)}, ${this.pickedLocation.lng.toFixed(4)})`;
            btnPickAcc.style.borderColor = '#10b981';
            btnPickAcc.style.color = '#34d399';
          }
        } else if (this.locationPickerTarget === 'station') {
          if (this.editStationLat) this.editStationLat.value = this.pickedLocation.lat.toFixed(6);
          if (this.editStationLng) this.editStationLng.value = this.pickedLocation.lng.toFixed(6);
          if (this.editStationAddress && this.pickedLocation.address) this.editStationAddress.value = this.pickedLocation.address;
        }
        if (this.modalLocationPicker) this.modalLocationPicker.style.display = 'none';
      });
    }
  }

  openLocationPicker(target = 'account') {
    this.locationPickerTarget = target;
    const modal = this.modalLocationPicker || document.getElementById('modalLocationPicker');
    if (modal) {
      modal.style.zIndex = '1000050';
      modal.style.display = 'flex';
      modal.style.setProperty('display', 'flex', 'important');
    }

    let initialLat = 10.0355;
    let initialLng = 105.7788;

    if (target === 'account') {
      const curLat = parseFloat(document.getElementById('editAccLat')?.value);
      const curLng = parseFloat(document.getElementById('editAccLng')?.value);
      if (!isNaN(curLat) && !isNaN(curLng) && curLat !== 0) {
        initialLat = curLat;
        initialLng = curLng;
      }
      const curAddr = document.getElementById('editAccAddress')?.value;
      if (this.inputLocationPickerSearch && curAddr) this.inputLocationPickerSearch.value = curAddr;
    }

    const initMap = () => {
      if (!this.pickerMapController) {
        this.pickerMapController = new MapController('locationPickerMap', { disableStations: true });
        this.pickerMapController.init([initialLng, initialLat], 15);
        this.pickerMapInstance = this.pickerMapController.map;

        if (this.pickerMapInstance) {
          this.pickerMapInstance.on('load', () => {
            this.pickerMapInstance.resize();
          });
          this.pickerMapInstance.on('click', (e) => {
            const { lng, lat } = e.lngLat;
            this.setLocationPickerPoint(lat, lng, false);
          });
          const canvas = this.pickerMapInstance.getCanvas();
          if (canvas) canvas.style.cursor = 'crosshair';
        }
      } else {
        if (this.pickerMapInstance) {
          this.pickerMapInstance.resize();
          this.pickerMapInstance.flyTo({ center: [initialLng, initialLat], zoom: 15 });
        }
      }

      this.setLocationPickerPoint(initialLat, initialLng, false);

      // Multiple resize cycles to guarantee full interactive viewport
      setTimeout(() => this.pickerMapInstance?.resize(), 60);
      setTimeout(() => this.pickerMapInstance?.resize(), 180);
      setTimeout(() => this.pickerMapInstance?.resize(), 400);
    };

    setTimeout(initMap, 80);
  }

  async setLocationPickerPoint(lat, lng, fly = true, knownAddress = null, knownWard = null, knownProv = null) {
    this.pickedLocation = {
      lat,
      lng,
      address: knownAddress || '',
      ward: knownWard || '',
      province: knownProv || 'Cần Thơ'
    };

    if (fly && this.pickerMapInstance) {
      this.pickerMapInstance.flyTo({ center: [lng, lat], zoom: 16 });
    }

    // Move or create marker with pointer-events: none to avoid blocking clicks
    if (!this.pickerMarkerOverlay) {
      const el = document.createElement('div');
      el.className = 'custom-map-pin';
      el.style.pointerEvents = 'none';
      el.innerHTML = `
        <div class="pin-core picker" style="background: linear-gradient(135deg, #0284c7, #38bdf8); box-shadow: 0 0 20px #38bdf8; width: 36px; height: 36px; font-size: 20px; pointer-events: none;">
          <span>📍</span>
        </div>
      `;
      this.pickerMarkerOverlay = new window.maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(this.pickerMapInstance);
    } else {
      this.pickerMarkerOverlay.setLngLat([lng, lat]);
    }

    if (this.locationPickerCoordsDisplay) {
      this.locationPickerCoordsDisplay.textContent = `Tọa độ GPS: Vĩ độ (Lat): ${lat.toFixed(6)} | Kinh độ (Lng): ${lng.toFixed(6)}`;
    }
    if (this.locationPickerAddressDisplay) {
      this.locationPickerAddressDisplay.textContent = knownAddress || '⏳ Đang tra cứu số nhà & tên đường...';
    }

    if (!knownAddress) {
      try {
        const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
        const data = await res.json();
        if (data.ok && data.address) {
          this.pickedLocation.address = data.address;
          if (data.ward) this.pickedLocation.ward = data.ward;
          if (data.province) this.pickedLocation.province = data.province;
          if (this.locationPickerAddressDisplay) {
            const locDetails = [data.ward, data.district, data.province].filter(Boolean).join(' · ');
            this.locationPickerAddressDisplay.innerHTML = `<div style="font-weight: 700; color: #38bdf8;">📍 ${this.escapeHtml(data.address)}</div>${locDetails ? `<div style="font-size: 11px; color: #a78bfa; margin-top: 2px;">🏛️ ${this.escapeHtml(locDetails)}</div>` : ''}`;
          }
        } else {
          if (this.locationPickerAddressDisplay) {
            this.locationPickerAddressDisplay.textContent = `Tọa độ: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          }
        }
      } catch (err) {
        if (this.locationPickerAddressDisplay) {
          this.locationPickerAddressDisplay.textContent = `Tọa độ: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
      }
    } else {
      if (this.locationPickerAddressDisplay) {
        this.locationPickerAddressDisplay.textContent = `🏢 ${knownAddress}`;
      }
    }
  }

  startMapPickMode(mode = 'edit') {
    if (!this.mapController || !this.mapController.map) return;
    this.mapPickMode = mode;
    if (this.editStationModal) this.editStationModal.style.display = 'none';
    if (this.adminEnterpriseModal) this.adminEnterpriseModal.style.display = 'none';
    if (this.adminHospitalModal) this.adminHospitalModal.style.display = 'none';
    if (this.adminAccountEditModal) this.adminAccountEditModal.style.display = 'none';
    if (this.adminOfficerModal) this.adminOfficerModal.style.display = 'none';

    if (this.mapPickModeBanner) {
      this.mapPickModeBanner.style.display = 'flex';
      if (mode === 'enterprise') {
        this.mapPickModeBanner.innerHTML = `
          <span>📍</span> CLICK VÀO BẢN ĐỒ ĐỂ CHỌN VỊ TRÍ XƯỞNG / ĐỊA BÀN CỨU HỘ XE!
          <button id="btnCancelMapPick" style="background: rgba(0,0,0,0.4); border: 1px solid white; color: white; border-radius: 20px; padding: 2px 8px; font-size: 10px; cursor: pointer; margin-left: 6px;">✕ Hủy</button>
        `;
      } else if (mode === 'hospital') {
        this.mapPickModeBanner.innerHTML = `
          <span>📍</span> CLICK VÀO BẢN ĐỒ ĐỂ CHỌN VỊ TRÍ BỆNH VIỆN / TRẠM CẤP CỨU 115!
          <button id="btnCancelMapPick" style="background: rgba(0,0,0,0.4); border: 1px solid white; color: white; border-radius: 20px; padding: 2px 8px; font-size: 10px; cursor: pointer; margin-left: 6px;">✕ Hủy</button>
        `;
      } else if (mode === 'account') {
        this.mapPickModeBanner.innerHTML = `
          <span>📍</span> BẤM VÀO ĐIỂM BẤT KỲ TRÊN MAP ĐỂ GHIM VỊ TRÍ CHÍNH XÁC CỦA ĐƠN VỊ CÔNG AN / TRỤ SỞ!
          <button id="btnCancelMapPick" style="background: rgba(0,0,0,0.4); border: 1px solid white; color: white; border-radius: 20px; padding: 2px 8px; font-size: 10px; cursor: pointer; margin-left: 6px;">✕ Hủy</button>
        `;
      } else {
        this.mapPickModeBanner.innerHTML = `
          <span>📍</span> BẤM VÀO ĐIỂM BẤT KỲ TRÊN BẢN ĐỒ ĐỂ LẤY TỌA ĐỘ & ĐỊA CHỈ TỰ ĐỘNG!
          <button id="btnCancelMapPick" style="background: rgba(0,0,0,0.4); border: 1px solid white; color: white; border-radius: 20px; padding: 2px 8px; font-size: 10px; cursor: pointer; margin-left: 6px;">✕ Hủy</button>
        `;
      }
      document.getElementById('btnCancelMapPick').onclick = () => this.stopMapPickMode();
    }
    this.mapController.map.getCanvas().style.cursor = 'crosshair';

    // Remove existing temporary listener if any
    if (this._onMapPickClick) {
      this.mapController.map.off('click', this._onMapPickClick);
    }

    this._onMapPickClick = async (e) => {
      const { lng, lat } = e.lngLat;

      // Create or move animated picker marker
      if (!this.pickerMarker) {
        const el = document.createElement('div');
        el.className = 'custom-map-pin';
        el.innerHTML = `
          <div class="pin-core picker">
            <span>📍</span>
          </div>
          <div class="pin-tooltip" style="opacity: 1; transform: translateX(-50%) translateY(0); background: ${mode === 'hospital' ? '#10b981' : (mode === 'enterprise' ? '#f97316' : (mode === 'account' ? '#0284c7' : '#7c3aed'))};">Vị trí vừa chấm</div>
        `;
        this.pickerMarker = new window.maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(this.mapController.map);
      } else {
        this.pickerMarker.setLngLat([lng, lat]);
      }

      if (mode === 'account') {
        const inputLat = document.getElementById('editAccLat');
        const inputLng = document.getElementById('editAccLng');
        const inputAddress = document.getElementById('editAccAddress');
        const inputWard = document.getElementById('editAccWard');
        const inputProvince = document.getElementById('editAccProvince');

        if (inputLat) inputLat.value = lat.toFixed(6);
        if (inputLng) inputLng.value = lng.toFixed(6);

        try {
          const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
          const geo = await res.json();
          if (geo.ok) {
            if (inputAddress) inputAddress.value = geo.address || `Tọa độ: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            if (inputWard && geo.ward && !inputWard.value) inputWard.value = geo.ward;
            if (inputProvince && geo.province) inputProvince.value = geo.province;
          }
        } catch (err) {
          console.warn('Reverse geocode error:', err);
        }

        this.stopMapPickMode();
        if (this.adminOfficerModal) this.adminOfficerModal.style.display = 'flex';
        if (this.adminAccountEditModal) this.adminAccountEditModal.style.display = 'flex';
        return;
      }

      if (mode === 'hospital') {
        const inputHospLat = document.getElementById('inputHospLat');
        const inputHospLng = document.getElementById('inputHospLng');
        const inputHospAddress = document.getElementById('inputHospAddress');
        const inputHospProvince = document.getElementById('inputHospProvince');
        const inputHospName = document.getElementById('inputHospName');

        if (inputHospLat) inputHospLat.value = lat.toFixed(6);
        if (inputHospLng) inputHospLng.value = lng.toFixed(6);

        try {
          const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
          const geo = await res.json();
          if (geo.ok) {
            if (inputHospAddress && geo.address) inputHospAddress.value = geo.address;
            if (inputHospProvince && geo.province) inputHospProvince.value = geo.province;
            if (inputHospName && (!inputHospName.value || inputHospName.value.includes('Công An'))) {
              const placeStr = geo.district || geo.ward || 'Khu Vực';
              inputHospName.value = `Bệnh Viện Đa Khoa ${placeStr}`;
            }
          }
        } catch (err) {
          console.warn('Reverse geocode error:', err);
        }

        this.stopMapPickMode();
        if (this.adminHospitalModal) this.adminHospitalModal.style.display = 'flex';
        return;
      }

      if (mode === 'enterprise') {
        const inputEntLat = document.getElementById('inputEntLat');
        const inputEntLng = document.getElementById('inputEntLng');
        const inputEntAddress = document.getElementById('inputEntAddress');
        const inputEntProvince = document.getElementById('inputEntProvince');
        const inputEntName = document.getElementById('inputEntName');

        if (inputEntLat) inputEntLat.value = lat.toFixed(6);
        if (inputEntLng) inputEntLng.value = lng.toFixed(6);

        try {
          const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
          const geo = await res.json();
          if (geo.ok) {
            if (inputEntAddress && geo.address) inputEntAddress.value = geo.address;
            if (inputEntProvince && geo.province) inputEntProvince.value = geo.province;
            if (inputEntName && (!inputEntName.value || inputEntName.value.includes('Công An'))) {
              const placeStr = geo.district || geo.ward || 'Khu Vực';
              inputEntName.value = `Gara Cứu Hộ & Kéo Xe ${placeStr}`;
            }
          }
        } catch (err) {
          console.warn('Reverse geocode error:', err);
        }

        this.stopMapPickMode();
        if (this.adminEnterpriseModal) this.adminEnterpriseModal.style.display = 'flex';
        return;
      }

      this.editStationLat.value = lat.toFixed(6);
      this.editStationLng.value = lng.toFixed(6);

      // Reverse geocode to get street name and ward
      try {
        const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
        const geo = await res.json();
        if (geo.ok && geo.address) {
          this.editStationAddress.value = geo.address;
          if (mode === 'add') {
            const wardStr = geo.ward || 'Sở Tại';
            const distStr = geo.district || '';
            const ag = this.currentOfficer ? this.currentOfficer.agency : 'police';
            if (ag === 'csgt') {
              this.editStationName.value = `Đội CSGT - Trật Tự ${distStr || wardStr}`;
            } else if (ag === 'fire') {
              this.editStationName.value = `Đội Cảnh Sát PCCC & CNCH ${distStr || wardStr}`;
            } else if (ag === 'hospital') {
              this.editStationName.value = `Trạm Cấp Cứu Y Tế 115 ${distStr || wardStr}`;
            } else if (ag === 'traffic-rescue') {
              this.editStationName.value = `Đội Cứu Hộ Giao Thông ${distStr || wardStr}`;
            } else {
              this.editStationName.value = `Công An ${wardStr} (${distStr})`;
            }
          }
        }
      } catch (err) {
        console.warn('Reverse geocode error:', err);
      }

      this.stopMapPickMode();
      this.editStationModal.style.display = 'flex';
    };

    this.mapController.map.once('click', this._onMapPickClick);
  }

  stopMapPickMode() {
    if (this.mapPickModeBanner) this.mapPickModeBanner.style.display = 'none';
    if (this.mapController && this.mapController.map) {
      this.mapController.map.getCanvas().style.cursor = '';
    }
    if (this.mapPickMode === 'account') {
      if (this.adminOfficerModal) this.adminOfficerModal.style.display = 'flex';
      if (this.adminAccountEditModal) this.adminAccountEditModal.style.display = 'flex';
    } else if (this.mapPickMode === 'hospital') {
      if (this.adminHospitalModal) this.adminHospitalModal.style.display = 'flex';
    } else if (this.mapPickMode === 'enterprise') {
      if (this.adminEnterpriseModal) this.adminEnterpriseModal.style.display = 'flex';
    } else if (this.mapPickMode === 'edit' || this.mapPickMode === 'add') {
      if (this.editStationModal) this.editStationModal.style.display = 'flex';
    }
  }

  async loadStationsDirectory() {
    try {
      const res = await fetch('/api/stations/all');
      const data = await res.json();
      if (data.ok && Array.isArray(data.stations)) {
        this.stationsList = data.stations;
      }
    } catch (e) {
      console.warn('Error loading stations directory:', e);
    }
  }

  renderStationsDirectory() {
    if (!this.stationsListContainer) return;
    this.stationsListContainer.innerHTML = '';

    let filtered = this.stationsList;

    // Strict Agency Isolation: Only show stations belonging to current officer's agency
    if (this.currentOfficer && this.currentOfficer.agency && this.currentOfficer.agency !== 'all') {
      const curAg = this.currentOfficer.agency;
      filtered = filtered.filter(s => {
        if (curAg === 'fire') return s.agency === 'fire' || s.agency === 'rescue';
        return s.agency === curAg;
      });
    }

    if (this.selectedStationRegion && this.selectedStationRegion !== 'all') {
      filtered = filtered.filter(s => (s.province || '').toLowerCase().includes(this.selectedStationRegion.toLowerCase()));
    }

    if (this.searchStationKeyword) {
      filtered = filtered.filter(s =>
        (s.name || '').toLowerCase().includes(this.searchStationKeyword) ||
        (s.address || '').toLowerCase().includes(this.searchStationKeyword) ||
        (s.phone || '').toLowerCase().includes(this.searchStationKeyword) ||
        (s.ward || '').toLowerCase().includes(this.searchStationKeyword)
      );
    }

    if (filtered.length === 0) {
      this.stationsListContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-dim); padding: 30px 10px;">
          <div style="font-size: 24px; margin-bottom: 6px;">🏢</div>
          <div>Không tìm thấy trụ sở nào phù hợp với đơn vị của bạn</div>
        </div>
      `;
      return;
    }

    const isAdmin = Boolean(this.currentOfficer && (this.currentOfficer.username === 'admin' || this.currentOfficer.agency === 'all' || this.currentOfficer.level === 'national'));

    filtered.forEach(st => {
      const icon = st.agency === 'police' ? '👮‍♂️' : (st.agency === 'csgt' ? '🚗' : (st.agency === 'fire' ? '🚒' : (st.agency === 'hospital' ? '🚑' : '🛠️')));
      const agencyColor = st.agency === 'police' ? '#60a5fa' : (st.agency === 'csgt' ? '#fbbf24' : (st.agency === 'fire' ? '#f87171' : (st.agency === 'hospital' ? '#34d399' : '#fb923c')));

      const card = document.createElement('div');
      card.className = 'station-card';
      
      const adminActionsHtml = isAdmin ? `
        <div style="display: flex; gap: 4px; flex-shrink: 0; align-items: center;">
          <button class="btn-refresh-loc btn-edit-station" style="padding: 2px 7px; font-size: 10px; border-color: rgba(255,255,255,0.2); white-space: nowrap;">
            ✏️ Sửa
          </button>
          <button class="btn-refresh-loc btn-delete-station" style="padding: 2px 7px; font-size: 10px; background: rgba(255, 42, 75, 0.15); border-color: #ff2a4b; color: #ff6b81; white-space: nowrap;">
            🗑️ Xóa
          </button>
        </div>
      ` : '';

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 6px; width: 100%;">
          <div style="font-size: 13px; font-weight: 800; color: ${agencyColor}; display: flex; align-items: flex-start; gap: 6px; flex: 1 1 auto; min-width: 0; word-break: break-word; line-height: 1.35;">
            <span style="flex-shrink: 0; margin-top: 1px;">${icon}</span> <span style="word-break: break-word;">${st.name}</span>
          </div>
          ${adminActionsHtml}
        </div>
        <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 4px; line-height: 1.4; word-break: break-word;">
          📍 <b>Địa chỉ:</b> ${st.address}
        </div>
        <div style="font-size: 11px; color: #94a3b8; display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 6px;">
          <span>☎️ <b>SĐT bàn:</b> <a href="tel:${st.phone}" style="color: #38bdf8; font-weight: 700; text-decoration: none;">${st.phone}</a></span>
          <span>📱 <b>SMS:</b> ${st.sms || '0988 113 113'}</span>
        </div>
        ${st.officer ? `<div style="font-size: 11px; color: #a78bfa; margin-bottom: 6px; word-break: break-word;">👤 <b>Phụ trách:</b> ${st.officer}</div>` : ''}
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 6px;">
          <button class="btn-refresh-loc btn-fly-station" style="justify-content: center; font-size: 10px; background: rgba(0, 136, 255, 0.15); border-color: #0088ff; color: #60a5fa;">
            🗺️ Xem Trên Map
          </button>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${st.lat},${st.lng}" target="_blank" rel="noopener" class="btn-refresh-loc" style="justify-content: center; font-size: 10px; background: rgba(66, 133, 244, 0.15); border-color: #4285f4; color: #93c5fd; text-decoration: none;">
            🚗 Google Maps
          </a>
        </div>
      `;

      const btnEdit = card.querySelector('.btn-edit-station');
      if (btnEdit) {
        btnEdit.addEventListener('click', () => {
          this.openEditStationModal(st);
        });
      }

      const btnDel = card.querySelector('.btn-delete-station');
      if (btnDel) {
        btnDel.addEventListener('click', () => {
          this.handleDeleteStation(st.id, st.name);
        });
      }

      card.querySelector('.btn-fly-station').addEventListener('click', async () => {
        if (this.mapController && this.mapController.map) {
          this.mapController.map.flyTo({
            center: [st.lng, st.lat],
            zoom: 15.5,
            duration: 1200
          });

          // Fetch and highlight ward boundary for this station
          try {
            const res = await fetch(`/api/geo/locate-ward?lat=${st.lat}&lng=${st.lng}&address=${encodeURIComponent(st.address || st.name)}`);
            const data = await res.json();
            if (data.ok && data.boundary) {
              this.mapController.highlightWardBoundary(data.boundary, { color: '#eab308' });
              this.showWardHud(data.boundary);
            }
          } catch (e) {
            console.warn('Could not highlight station ward boundary:', e);
          }
        }
      });

      this.stationsListContainer.appendChild(card);
    });
  }

  openEditStationModal(st) {
    if (!this.editStationModal) return;
    const titleEl = document.getElementById('editStationModalTitle');
    if (titleEl) titleEl.textContent = '✏️ CHỈNH SỬA THÔNG TIN TRỤ SỞ';

    if (this.editStationId) this.editStationId.value = st.id || '';
    if (this.editStationName) this.editStationName.value = st.name || '';
    if (this.editStationAddress) this.editStationAddress.value = st.address || '';
    if (this.editStationPhone) this.editStationPhone.value = st.phone || '';
    if (this.editStationSms) this.editStationSms.value = st.sms || '0988 113 113';
    if (this.editStationOfficer) this.editStationOfficer.value = st.officer || '';
    if (this.editStationLat) this.editStationLat.value = st.lat || 10.035;
    if (this.editStationLng) this.editStationLng.value = st.lng || 105.775;

    const delBtn = document.getElementById('btnDeleteStationFromModal');
    if (delBtn) delBtn.style.display = 'block';

    this.editStationModal.style.display = 'flex';
  }

  async handleDeleteStation(id, name) {
    if (!confirm(`Bạn có chắc chắn muốn xóa trụ sở "${name || id}" khỏi danh bạ hệ thống?`)) return;
    try {
      const res = await fetch('/api/stations/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.ok) {
        alert('✅ Đã xóa trụ sở thành công!');
        if (this.editStationModal) this.editStationModal.style.display = 'none';
        await this.loadStationsDirectory();
        this.renderStationsDirectory();
        if (this.mapController) {
          const isAdm = Boolean(this.currentOfficer && (this.currentOfficer.username === 'admin' || this.currentOfficer.agency === 'all'));
        const reg = this.selectedStationRegion || (isAdm ? 'all' : (this.currentOfficer?.province || 'all'));
        this.mapController.loadAllStationsMarkers(reg, this.currentOfficer?.agency, isAdm);
        }
      } else {
        alert('Lỗi: ' + (data.error || 'Không thể xóa'));
      }
    } catch (e) {
      alert('Lỗi kết nối máy chủ');
    }
  }

  initEnterprisesDirectory() {
    this.enterprisesListContainer = document.getElementById('enterprisesListContainer');
    this.inputSearchEnterprises = document.getElementById('inputSearchEnterprises');
    this.btnAddNewEnterpriseModal = document.getElementById('btnAddNewEnterpriseModal');
    this.adminEnterpriseModal = document.getElementById('adminEnterpriseModal');
    this.btnCloseAdminEntModal = document.getElementById('btnCloseAdminEntModal');
    this.formAdminEnterprise = document.getElementById('formAdminEnterprise');

    if (this.inputSearchEnterprises) {
      this.inputSearchEnterprises.addEventListener('input', (e) => {
        this.searchEnterpriseKeyword = e.target.value.toLowerCase().trim();
        this.renderEnterprisesDirectory();
      });
    }

    if (this.btnAddNewEnterpriseModal) {
      this.btnAddNewEnterpriseModal.addEventListener('click', () => {
        this.openAddEnterpriseModal();
      });
    }

    // Map Pick for Enterprise
    const btnEntMapPick = document.getElementById('btnTriggerEntPickOnMap');
    if (btnEntMapPick) {
      btnEntMapPick.addEventListener('click', () => {
        this.startMapPickMode('enterprise');
      });
    }

    // Device GPS for Enterprise
    const btnGetGps = document.getElementById('btnGetEntCurrentGps');
    if (btnGetGps) {
      btnGetGps.addEventListener('click', () => {
        if (navigator.geolocation) {
          btnGetGps.textContent = '⏳ Đang định vị GPS...';
          navigator.geolocation.getCurrentPosition(async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            document.getElementById('inputEntLat').value = lat.toFixed(6);
            document.getElementById('inputEntLng').value = lng.toFixed(6);
            try {
              const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
              const geo = await res.json();
              if (geo.ok) {
                if (geo.address) document.getElementById('inputEntAddress').value = geo.address;
                if (geo.province) document.getElementById('inputEntProvince').value = geo.province;
              }
            } catch (err) {}
            btnGetGps.innerHTML = '<span>📡</span> LẤY GPS HIỆN TẠI THIẾT BỊ';
            alert(`📍 Đã lấy tọa độ GPS thực tế: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          }, (err) => {
            btnGetGps.innerHTML = '<span>📡</span> LẤY GPS HIỆN TẠI THIẾT BỊ';
            alert('Không thể lấy GPS: ' + err.message);
          }, { enableHighAccuracy: true });
        }
      });
    }

    if (this.btnCloseAdminEntModal) {
      this.btnCloseAdminEntModal.addEventListener('click', () => {
        this.adminEnterpriseModal.style.display = 'none';
      });
    }

    if (this.formAdminEnterprise) {
      this.formAdminEnterprise.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
          name: document.getElementById('inputEntName').value.trim(),
          phone: document.getElementById('inputEntPhone').value.trim(),
          phoneFormatted: document.getElementById('inputEntPhone').value.trim(),
          hotline: document.getElementById('inputEntHotline').value.trim(),
          address: document.getElementById('inputEntAddress').value.trim(),
          province: document.getElementById('inputEntProvince').value.trim(),
          lat: parseFloat(document.getElementById('inputEntLat').value) || 10.0289,
          lng: parseFloat(document.getElementById('inputEntLng').value) || 105.7725,
          isMobile: Boolean(document.getElementById('inputEntIsMobile')?.checked),
          priceRange: document.getElementById('inputEntPrice').value.trim() || '300.000đ - 1.500.000đ',
          services: document.getElementById('inputEntServices').value.split(',').map(s => s.trim()).filter(Boolean)
        };

        try {
          const res = await fetch('/api/enterprises/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.ok) {
            alert('🎉 Đã cấp phép và lưu doanh nghiệp cứu hộ thành công!');
            this.adminEnterpriseModal.style.display = 'none';
            await this.loadEnterprisesDirectory();
            this.renderEnterprisesDirectory();
          }
        } catch (err) {
          alert('Không thể lưu doanh nghiệp: ' + err.message);
        }
      });
    }
  }

  async loadEnterprisesDirectory() {
    try {
      const res = await fetch('/api/enterprises/rescue');
      const data = await res.json();
      if (data.ok && Array.isArray(data.enterprises)) {
        this.enterprisesList = data.enterprises;
      }
    } catch (e) {
      console.warn('Error loading enterprises:', e);
    }
  }

  renderEnterprisesDirectory() {
    if (!this.enterprisesListContainer) return;
    this.enterprisesListContainer.innerHTML = '';

    const isAdmin = this.currentOfficer && (this.currentOfficer.username === 'admin' || this.currentOfficer.agency === 'all');

    // Only Admin has permission to add new enterprises
    if (this.btnAddNewEnterpriseModal) {
      this.btnAddNewEnterpriseModal.style.display = isAdmin ? 'flex' : 'none';
    }

    let list = this.enterprisesList;
    if (this.searchEnterpriseKeyword) {
      list = list.filter(e =>
        (e.name || '').toLowerCase().includes(this.searchEnterpriseKeyword) ||
        (e.phone || '').toLowerCase().includes(this.searchEnterpriseKeyword) ||
        (e.address || '').toLowerCase().includes(this.searchEnterpriseKeyword) ||
        (e.province || '').toLowerCase().includes(this.searchEnterpriseKeyword)
      );
    }

    if (list.length === 0) {
      this.enterprisesListContainer.innerHTML = '<div style="color: #94a3b8; font-size: 11px; text-align: center; padding: 20px;">Chưa có doanh nghiệp cứu hộ nào.</div>';
      return;
    }

    list.forEach(ent => {
      const isPendingDirectoryEntry = ent.informationStatus === 'pending';
      const hasCallablePhone = !isPendingDirectoryEntry && Boolean((ent.phone || '').trim());
      const directoryStatus = isPendingDirectoryEntry
        ? '<span style="font-size: 9px; background: rgba(245,158,11,0.15); color: #fbbf24; padding: 2px 5px; border-radius: 4px; border: 1px solid rgba(245,158,11,0.35); white-space: nowrap;">ĐANG CẬP NHẬT</span>'
        : '<span style="font-size: 9px; background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 2px 5px; border-radius: 4px; border: 1px solid rgba(16, 185, 129, 0.3); white-space: nowrap;">✓ ĐÃ CẤP PHÉP</span>';
      const ratingLine = isPendingDirectoryEntry
        ? '<span>Thông tin dịch vụ đang cập nhật</span>'
        : `<span>⭐ ${ent.rating}/5 (${ent.reviewCount || 0} đánh giá)</span>`;
      const contactLine = hasCallablePhone
        ? `📞 <b>SĐT:</b> <a href="tel:${ent.phone}" style="color: #fb923c; font-weight: 700;">${ent.phone}</a>`
        : '📞 <b>Liên hệ:</b> Đang cập nhật xác thực';
      const card = document.createElement('div');
      card.style = 'background: rgba(14, 22, 42, 0.45); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(249, 115, 22, 0.3); border-radius: 8px; padding: 10px; margin-bottom: 8px; font-size: 11px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);';
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 6px; width: 100%;">
          <div style="flex: 1 1 auto; min-width: 0; word-break: break-word;">
            <div style="font-size: 13px; font-weight: 800; color: #fed7aa; display: flex; align-items: flex-start; gap: 4px; line-height: 1.35;">
              <span style="flex-shrink: 0;">🚗</span> <span style="word-break: break-word;">${ent.name}</span>
            </div>
            <div style="color: #fbbf24; font-weight: 700; margin-top: 2px; display: flex; flex-wrap: wrap; align-items: center; gap: 6px;">
              ${ratingLine} ·
              <span style="color: #38bdf8;">${ent.province || ''}</span>
              ${ent.isMobile ? `<span style="background: rgba(16, 185, 129, 0.2); color: #34d399; font-weight: 800; padding: 1px 5px; border-radius: 4px; font-size: 9px; border: 1px solid rgba(16, 185, 129, 0.4);">📡 LƯU ĐỘNG (LIVE GPS)</span>` : ''}
            </div>
          </div>
          <div style="flex-shrink: 0; display: flex; gap: 4px; align-items: center;">
            ${isAdmin ? `
              <button class="btn-refresh-loc btn-del-ent" style="padding: 2px 7px; font-size: 10px; background: rgba(255, 42, 75, 0.15); border-color: #ff2a4b; color: #ff6b81; white-space: nowrap;" title="Chỉ Chỉ Huy Tổng Hợp mới có quyền thu hồi">
                🗑️ Xóa
              </button>
            ` : directoryStatus}
          </div>
        </div>
        <div style="color: #cbd5e1; margin-bottom: 4px; line-height: 1.4; word-break: break-word;">📍 ${ent.address || 'Đang cập nhật'}</div>
        <div style="color: #94a3b8; margin-bottom: 6px;">${contactLine}</div>
        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
          ${(ent.services || []).map(s => `<span style="background: rgba(249, 115, 22, 0.15); color: #fed7aa; padding: 1px 5px; border-radius: 4px; font-size: 9px;">${s}</span>`).join('')}
        </div>
      `;

      if (isAdmin) {
        const delBtn = card.querySelector('.btn-del-ent');
        if (delBtn) {
          delBtn.addEventListener('click', () => {
            this.handleDeleteEnterprise(ent.id, ent.name);
          });
        }
      }

      this.enterprisesListContainer.appendChild(card);
    });
  }

  openAddEnterpriseModal() {
    if (!this.adminEnterpriseModal) return;
    document.getElementById('inputEntName').value = '';
    document.getElementById('inputEntPhone').value = '';
    document.getElementById('inputEntHotline').value = '';
    document.getElementById('inputEntAddress').value = '';
    document.getElementById('inputEntProvince').value = 'Cần Thơ';
    document.getElementById('inputEntLat').value = '10.0289';
    document.getElementById('inputEntLng').value = '105.7725';
    document.getElementById('inputEntPrice').value = '300.000đ - 1.500.000đ';
    document.getElementById('inputEntServices').value = 'Cẩu kéo ô tô, Kích bình ắc quy, Vá vỏ lưu động';
    this.adminEnterpriseModal.style.display = 'flex';
  }

  async handleDeleteEnterprise(id, name) {
    if (!confirm(`❓ Bạn có chắc chắn muốn xóa doanh nghiệp cứu hộ "${name}"?`)) return;
    try {
      const res = await fetch('/api/enterprises/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.ok) {
        alert('🗑️ Đã xóa doanh nghiệp.');
        await this.loadEnterprisesDirectory();
        this.renderEnterprisesDirectory();
      }
    } catch (e) {
      alert('Lỗi xóa doanh nghiệp.');
    }
  }

  // ==================== HOSPITALS DIRECTORY & MANAGEMENT ====================

  initHospitalsDirectory() {
    this.hospitalsListContainer = document.getElementById('hospitalsListContainer');
    this.inputSearchHospitals = document.getElementById('inputSearchHospitals');
    this.btnAddNewHospitalModal = document.getElementById('btnAddNewHospitalModal');
    this.adminHospitalModal = document.getElementById('adminHospitalModal');
    this.btnCloseAdminHospModal = document.getElementById('btnCloseAdminHospModal');
    this.formAdminHospital = document.getElementById('formAdminHospital');

    if (this.inputSearchHospitals) {
      this.inputSearchHospitals.addEventListener('input', (e) => {
        this.searchHospitalKeyword = e.target.value.toLowerCase().trim();
        this.renderHospitalsDirectory();
      });
    }

    if (this.btnAddNewHospitalModal) {
      this.btnAddNewHospitalModal.addEventListener('click', () => {
        this.openAddHospitalModal();
      });
    }

    // Map Pick for Hospital
    const btnHospMapPick = document.getElementById('btnTriggerHospPickOnMap');
    if (btnHospMapPick) {
      btnHospMapPick.addEventListener('click', () => {
        this.startMapPickMode('hospital');
      });
    }

    // Device GPS for Hospital
    const btnGetGps = document.getElementById('btnGetHospCurrentGps');
    if (btnGetGps) {
      btnGetGps.addEventListener('click', () => {
        if (navigator.geolocation) {
          btnGetGps.textContent = '⏳ Đang định vị GPS...';
          navigator.geolocation.getCurrentPosition(async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            document.getElementById('inputHospLat').value = lat.toFixed(6);
            document.getElementById('inputHospLng').value = lng.toFixed(6);
            try {
              const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
              const geo = await res.json();
              if (geo.ok) {
                if (geo.address) document.getElementById('inputHospAddress').value = geo.address;
                if (geo.province) document.getElementById('inputHospProvince').value = geo.province;
              }
            } catch (err) {}
            btnGetGps.innerHTML = '<span>📡</span> LẤY GPS HIỆN TẠI THIẾT BỊ';
            alert(`📍 Đã lấy tọa độ GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          }, (err) => {
            btnGetGps.innerHTML = '<span>📡</span> LẤY GPS HIỆN TẠI THIẾT BỊ';
            alert('Không thể lấy GPS: ' + err.message);
          }, { enableHighAccuracy: true });
        }
      });
    }

    if (this.btnCloseAdminHospModal) {
      this.btnCloseAdminHospModal.addEventListener('click', () => {
        if (this.adminHospitalModal) this.adminHospitalModal.style.display = 'none';
      });
    }

    if (this.formAdminHospital) {
      this.formAdminHospital.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('editHospitalId')?.value;
        const payload = {
          id: editId || undefined,
          name: document.getElementById('inputHospName').value.trim(),
          type: document.getElementById('inputHospType').value.trim(),
          phone: document.getElementById('inputHospPhone').value.trim(),
          phoneFormatted: document.getElementById('inputHospPhone').value.trim(),
          address: document.getElementById('inputHospAddress').value.trim(),
          province: document.getElementById('inputHospProvince').value.trim(),
          lat: parseFloat(document.getElementById('inputHospLat').value) || 10.0335,
          lng: parseFloat(document.getElementById('inputHospLng').value) || 105.7533,
          openingHours: document.getElementById('inputHospHours').value.trim() || '24/7 Cấp cứu',
          specialties: document.getElementById('inputHospSpecialties').value.split(',').map(s => s.trim()).filter(Boolean),
          featured: Boolean(document.getElementById('inputHospFeatured')?.checked)
        };

        try {
          const res = await fetch('/api/hospitals/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.ok) {
            alert('🎉 Đã lưu và xác thực bệnh viện thành công!');
            if (this.adminHospitalModal) this.adminHospitalModal.style.display = 'none';
            await this.loadHospitalsDirectory();
            this.renderHospitalsDirectory();
          }
        } catch (err) {
          alert('Không thể lưu bệnh viện: ' + err.message);
        }
      });
    }
  }

  async loadHospitalsDirectory() {
    try {
      const res = await fetch('/api/hospitals');
      const data = await res.json();
      if (data.ok && Array.isArray(data.hospitals)) {
        this.hospitalsList = data.hospitals;
      }
    } catch (e) {
      console.warn('Error loading hospitals:', e);
    }
  }

  renderHospitalsDirectory() {
    if (!this.hospitalsListContainer) return;
    this.hospitalsListContainer.innerHTML = '';

    const isAdmin = this.currentOfficer && (this.currentOfficer.username === 'admin' || this.currentOfficer.agency === 'all');

    if (this.btnAddNewHospitalModal) {
      this.btnAddNewHospitalModal.style.display = isAdmin ? 'flex' : 'none';
    }

    let list = this.hospitalsList;
    if (this.searchHospitalKeyword) {
      list = list.filter(h =>
        (h.name || '').toLowerCase().includes(this.searchHospitalKeyword) ||
        (h.phone || '').toLowerCase().includes(this.searchHospitalKeyword) ||
        (h.address || '').toLowerCase().includes(this.searchHospitalKeyword) ||
        (h.type || '').toLowerCase().includes(this.searchHospitalKeyword)
      );
    }

    if (list.length === 0) {
      this.hospitalsListContainer.innerHTML = '<div style="color: #94a3b8; font-size: 11px; text-align: center; padding: 20px;">Chưa có dữ liệu bệnh viện nào.</div>';
      return;
    }

    list.forEach(h => {
      const isPendingDirectoryEntry = h.informationStatus === 'pending';
      const hasCallablePhone = !isPendingDirectoryEntry && Boolean((h.phone || '').trim());
      const directoryStatus = isPendingDirectoryEntry
        ? '<span style="font-size: 9px; background: rgba(245,158,11,0.15); color: #fbbf24; padding: 2px 5px; border-radius: 4px; border: 1px solid rgba(245,158,11,0.35); white-space: nowrap;">ĐANG CẬP NHẬT</span>'
        : '<span style="font-size: 9px; background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 2px 5px; border-radius: 4px; border: 1px solid rgba(16, 185, 129, 0.3); white-space: nowrap;">✓ ĐÃ DUYỆT</span>';
      const ratingLine = isPendingDirectoryEntry
        ? `${h.type || 'Bệnh viện'} · Thông tin chi tiết đang cập nhật`
        : `${h.type || ''} · ⭐ ${h.rating}/5 (${h.reviewCount || 0} đánh giá)`;
      const contactLine = hasCallablePhone
        ? `📞 <b>Cấp cứu:</b> <a href="tel:${h.phone}" style="color: #34d399; font-weight: 700;">${h.phoneFormatted || h.phone}</a> | 🕐 ${h.openingHours || '24/7'}`
        : '📞 <b>Liên hệ:</b> Đang cập nhật xác thực';
      const card = document.createElement('div');
      card.style = 'background: rgba(14, 22, 42, 0.45); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 10px; margin-bottom: 8px; font-size: 11px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);';
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 6px; width: 100%;">
          <div style="flex: 1 1 auto; min-width: 0; word-break: break-word;">
            <div style="font-size: 13px; font-weight: 800; color: #a7f3d0; display: flex; align-items: flex-start; gap: 4px; line-height: 1.35;">
              <span style="flex-shrink: 0;">🏥</span> <span style="word-break: break-word;">${h.name}</span>
              ${h.featured ? '<span style="background: rgba(251,191,36,0.2); color: #fbbf24; font-size: 9px; padding: 1px 4px; border-radius: 3px; flex-shrink: 0;">⭐ NỔI BẬT</span>' : ''}
            </div>
            <div style="color: #94a3b8; font-size: 10px; margin-top: 1px;">${ratingLine}</div>
          </div>
          <div style="flex-shrink: 0; display: flex; gap: 4px; align-items: center;">
            ${isAdmin ? `
              <div style="display: flex; gap: 4px;">
                <button class="btn-refresh-loc btn-edit-hosp" style="padding: 2px 7px; font-size: 10px; border-color: #10b981; color: #34d399; white-space: nowrap;">✏️ Sửa</button>
                <button class="btn-refresh-loc btn-del-hosp" style="padding: 2px 7px; font-size: 10px; background: rgba(255, 42, 75, 0.15); border-color: #ff2a4b; color: #ff6b81; white-space: nowrap;">🗑️ Xóa</button>
              </div>
            ` : directoryStatus}
          </div>
        </div>
        <div style="color: #cbd5e1; margin-bottom: 4px; line-height: 1.4; word-break: break-word;">📍 ${h.address || 'Đang cập nhật'}</div>
        <div style="color: #94a3b8; margin-bottom: 6px;">${contactLine}</div>
        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
          ${(h.specialties || []).map(s => `<span style="background: rgba(16, 185, 129, 0.15); color: #a7f3d0; padding: 1px 5px; border-radius: 4px; font-size: 9px;">${s}</span>`).join('')}
        </div>
      `;

      if (isAdmin) {
        const editBtn = card.querySelector('.btn-edit-hosp');
        if (editBtn) {
          editBtn.addEventListener('click', () => {
            this.openEditHospitalModal(h);
          });
        }
        const delBtn = card.querySelector('.btn-del-hosp');
        if (delBtn) {
          delBtn.addEventListener('click', () => {
            this.handleDeleteHospital(h.id, h.name);
          });
        }
      }

      this.hospitalsListContainer.appendChild(card);
    });
  }

  openAddHospitalModal() {
    if (!this.adminHospitalModal) return;
    document.getElementById('admHospModalTitle').textContent = 'ĐĂNG KÝ BỆNH VIỆN / TRẠM CẤP CỨU 115';
    document.getElementById('editHospitalId').value = '';
    document.getElementById('inputHospName').value = '';
    document.getElementById('inputHospType').value = 'Bệnh viện Đa khoa Hạng 1';
    document.getElementById('inputHospPhone').value = '';
    document.getElementById('inputHospAddress').value = '';
    document.getElementById('inputHospProvince').value = 'Cần Thơ';
    document.getElementById('inputHospLat').value = '10.033500';
    document.getElementById('inputHospLng').value = '105.753300';
    document.getElementById('inputHospHours').value = '24/7 Cấp cứu';
    document.getElementById('inputHospSpecialties').value = 'Cấp cứu, Hồi sức, Ngoại khoa, Tim mạch';
    const feat = document.getElementById('inputHospFeatured');
    if (feat) feat.checked = false;
    this.adminHospitalModal.style.display = 'flex';
  }

  openEditHospitalModal(h) {
    if (!this.adminHospitalModal) return;
    document.getElementById('admHospModalTitle').textContent = 'CHỈNH SỬA THÔNG TIN BỆNH VIỆN';
    document.getElementById('editHospitalId').value = h.id;
    document.getElementById('inputHospName').value = h.name || '';
    document.getElementById('inputHospType').value = h.type || '';
    document.getElementById('inputHospPhone').value = h.phone || '';
    document.getElementById('inputHospAddress').value = h.address || '';
    document.getElementById('inputHospProvince').value = h.province || 'Cần Thơ';
    document.getElementById('inputHospLat').value = (h.lat !== undefined ? h.lat : 10.0335).toString();
    document.getElementById('inputHospLng').value = (h.lng !== undefined ? h.lng : 105.7533).toString();
    document.getElementById('inputHospHours').value = h.openingHours || '24/7';
    document.getElementById('inputHospSpecialties').value = (h.specialties || []).join(', ');
    const feat = document.getElementById('inputHospFeatured');
    if (feat) feat.checked = Boolean(h.featured);
    this.adminHospitalModal.style.display = 'flex';
  }

  async handleDeleteHospital(id, name) {
    if (!confirm(`❓ Bạn có chắc chắn muốn xóa bệnh viện "${name}" khỏi hệ thống?`)) return;
    try {
      const res = await fetch('/api/hospitals/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.ok) {
        alert('🗑️ Đã xóa bệnh viện.');
        await this.loadHospitalsDirectory();
        this.renderHospitalsDirectory();
      }
    } catch (e) {
      alert('Lỗi xóa bệnh viện.');
    }
  }

  refreshTerritoryStatsBadges() {
    const allInc = Array.from(this.incidents.values());
    const total = allInc.length;
    const police = allInc.filter(i => i.agency === 'police').length;
    const csgt = allInc.filter(i => i.agency === 'csgt').length;
    const fire = allInc.filter(i => i.agency === 'fire').length;
    const hospital = allInc.filter(i => i.agency === 'hospital' || i.agency === 'ambulance').length;
    const rescue = allInc.filter(i => i.agency === 'traffic-rescue').length;
    const resolved = allInc.filter(i => i.status === 'resolved').length;

    if (document.getElementById('statTotalCases')) document.getElementById('statTotalCases').textContent = total;
    if (document.getElementById('statPoliceCases')) document.getElementById('statPoliceCases').textContent = police;
    if (document.getElementById('statCsgtCases')) document.getElementById('statCsgtCases').textContent = csgt;
    if (document.getElementById('statFireCases')) document.getElementById('statFireCases').textContent = fire;
    if (document.getElementById('statHospitalCases')) document.getElementById('statHospitalCases').textContent = hospital;
    if (document.getElementById('statRescueCases')) document.getElementById('statRescueCases').textContent = rescue;

    if (document.getElementById('statSummaryRate')) {
      const rate = total > 0 ? Math.round((resolved / total) * 100) : 100;
      document.getElementById('statSummaryRate').textContent = `${rate}% (${resolved}/${total})`;
    }
  }

  updateDynamicYearUI() {
    const currentYear = new Date().getFullYear();
    const natBadge = document.querySelector('.national-badge-title');
    if (natBadge && natBadge.textContent.includes('QUỐC GIA')) {
      natBadge.textContent = `QUỐC GIA ${currentYear}`;
    }
    const natPill = document.getElementById('statNationalMapPill');
    if (natPill && natPill.getAttribute('title')) {
      natPill.setAttribute('title', natPill.getAttribute('title').replace(/2026/g, currentYear));
    }
    const syncBadge = document.getElementById('bandoSyncStatusBadge');
    if (syncBadge && syncBadge.textContent.includes('2026')) {
      syncBadge.innerHTML = syncBadge.innerHTML.replace(/2026/g, currentYear);
    }
    const titles = document.querySelectorAll('.header-brand h1, .brand-text, .system-title, .admin-modal-title, .national-banner-pill');
    titles.forEach(el => {
      if (el.textContent && el.textContent.includes('2026')) {
        el.innerHTML = el.innerHTML.replace(/2026/g, currentYear);
      }
    });
  }

  async loadAdminStats() {
    try {
      const agencyParam = (this.currentOfficer && this.currentOfficer.agency) ? `?agency=${this.currentOfficer.agency}` : '';
      const res = await fetch(`/api/stats/summary${agencyParam}`);
      const data = await res.json();
      if (data.ok && data.stats) {
        const s = data.stats;
        if (document.getElementById('statTotalCases')) document.getElementById('statTotalCases').textContent = s.total || 0;
        if (document.getElementById('statPoliceCases')) document.getElementById('statPoliceCases').textContent = s.byAgency.police || 0;
        if (document.getElementById('statCsgtCases')) document.getElementById('statCsgtCases').textContent = s.byAgency.csgt || 0;
        if (document.getElementById('statFireCases')) document.getElementById('statFireCases').textContent = s.byAgency.fire || 0;
        if (document.getElementById('statHospitalCases')) document.getElementById('statHospitalCases').textContent = s.byAgency.hospital || 0;
        if (document.getElementById('statRescueCases')) document.getElementById('statRescueCases').textContent = s.byAgency['traffic-rescue'] || 0;
        if (typeof s.fakeArchiveCount === 'number') {
          this.updateFakeAlarmCount(s.fakeArchiveCount);
        }

        const resolvedCount = s.byStatus.resolved || 0;
        const total = s.total || 1;
        const rate = Math.round((resolvedCount / total) * 100);
        if (document.getElementById('statSummaryRate')) {
          document.getElementById('statSummaryRate').textContent = `${rate}% (${resolvedCount}/${s.total})`;
        }
      }
    } catch (e) {}
  }

  async handleDeleteStation(id, name) {
    if (!id) return;
    const ok = confirm(`❓ Bạn có chắc chắn muốn xóa vĩnh viễn trụ sở: "${name || id}" khỏi hệ thống?`);
    if (!ok) return;

    try {
      const res = await fetch('/api/stations/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.ok) {
        alert('🗑️ Đã xóa trụ sở thành công!');
        if (this.editStationModal) this.editStationModal.style.display = 'none';
        await this.loadStationsDirectory();
        this.renderStationsDirectory();
        if (this.mapController) {
          this.mapController.loadAllStationsMarkers(this.selectedStationRegion);
        }
      } else {
        alert('Lỗi khi xóa: ' + (data.error || 'Không thể xóa'));
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ khi xóa');
    }
  }

  openEditStationModal(st) {
    this.editStationId.value = st.id;
    this.editStationName.value = st.name;
    this.editStationAddress.value = st.address;
    this.editStationPhone.value = st.phone;
    this.editStationSms.value = st.sms || '0988 113 113';
    this.editStationOfficer.value = st.officer || '';
    this.editStationLat.value = st.lat;
    this.editStationLng.value = st.lng;
    this.editStationModal.style.display = 'flex';
  }

  bindEvents() {
    // Cyber Defense Gatekeeper Form (Pass: 2002)
    const submitGatekeeperAuth = async () => {
      const password = (this.gatekeeperPasswordInput?.value || '').trim();
      if (!password) {
        if (this.gatekeeperErrorMsg) {
          this.gatekeeperErrorMsg.textContent = 'Vui lòng nhập mã xác thực bảo vệ nội bộ!';
          this.gatekeeperErrorMsg.style.display = 'block';
        }
        if (this.gatekeeperPasswordInput) this.gatekeeperPasswordInput.focus();
        return;
      }

      if (this.btnSubmitGatekeeper) {
        this.btnSubmitGatekeeper.disabled = true;
        this.btnSubmitGatekeeper.innerHTML = '<span>⏳</span> Đang xác thực an ninh...';
      }

      try {
        const res = await fetch('/api/security/gatekeeper/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        const data = await res.json();
        if (data.ok && data.verified) {
          sessionStorage.setItem('sos_gatekeeper_pass', 'true');
          if (this.cyberGatekeeperModal) {
            this.cyberGatekeeperModal.style.display = 'none';
          }
          if (this.gatekeeperErrorMsg) this.gatekeeperErrorMsg.style.display = 'none';

          // Video 3 Intro Cinematic Transition (No skip button, auto-fades into dispatcher)
          this.playGatekeeperIntroVideo();
        } else {
          if (this.gatekeeperErrorMsg) {
            this.gatekeeperErrorMsg.textContent = data.error || 'Mã bảo vệ nội bộ không chính xác!';
            this.gatekeeperErrorMsg.style.display = 'block';
          }
          if (data.isLocked) {
            alert(data.error);
          }
        }
      } catch (err) {
        if (this.gatekeeperErrorMsg) {
          this.gatekeeperErrorMsg.textContent = 'Lỗi kết nối máy chủ xác thực!';
          this.gatekeeperErrorMsg.style.display = 'block';
        }
      } finally {
        if (this.btnSubmitGatekeeper) {
          this.btnSubmitGatekeeper.disabled = false;
          this.btnSubmitGatekeeper.innerHTML = '<img src="/assets/icons/khien.png" style="width: 20px; height: 20px; object-fit: contain; vertical-align: middle; margin-right: 6px;" alt="Khiên"> XÁC THỰC TRUY CẬP AN NINH';
        }
      }
    };

    if (this.formCyberGatekeeper) {
      this.formCyberGatekeeper.addEventListener('submit', (e) => {
        e.preventDefault();
        submitGatekeeperAuth();
      });
    }

    if (this.btnSubmitGatekeeper) {
      this.btnSubmitGatekeeper.addEventListener('click', (e) => {
        e.preventDefault();
        submitGatekeeperAuth();
      });
    }

    if (this.gatekeeperPasswordInput) {
      this.gatekeeperPasswordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitGatekeeperAuth();
        }
      });
    }

    // Agency tabs in login modal
    this.agencyTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.agencyTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const agency = tab.dataset.agency;
        // Always keep username and password empty so officers type them manually
        this.loginUsername.value = '';
        this.loginPassword.value = '';
        this.loginErrorMsg.style.display = 'none';

        const p = AGENCY_PREVIEWS[agency];
        if (p) {
          const logoImg = document.getElementById('authHeaderLogoImg');
          if (logoImg && p.logo) {
            logoImg.src = p.logo;
          }
          if (this.authHeaderTitle) this.authHeaderTitle.textContent = p.title;
          if (this.btnSubmitLogin) this.btnSubmitLogin.style.background = `linear-gradient(135deg, ${p.color}, #003366)`;
          if (this.loginUsername) this.loginUsername.placeholder = `Nhập tài khoản ${p.name || 'đơn vị'}...`;
        }
      });
    });

    // Form Login Submit (Multi-Event Handler: Click, Submit, Enter)
    const submitDispatcherLogin = async () => {
      const username = (this.loginUsername?.value || '').trim();
      const password = (this.loginPassword?.value || '').trim();

      if (!username) {
        if (this.loginErrorMsg) {
          this.loginErrorMsg.textContent = 'Vui lòng nhập tài khoản trực ban!';
          this.loginErrorMsg.style.display = 'block';
        }
        if (this.loginUsername) this.loginUsername.focus();
        return;
      }
      if (!password) {
        if (this.loginErrorMsg) {
          this.loginErrorMsg.textContent = 'Vui lòng nhập mật khẩu đơn vị!';
          this.loginErrorMsg.style.display = 'block';
        }
        if (this.loginPassword) this.loginPassword.focus();
        return;
      }

      // Helper to update the Login Progress UI
      const updateLoginProgress = (percent, label, subDetail) => {
        const box = document.getElementById('adminLoginProgressBox');
        const bar = document.getElementById('adminLoginProgressBar');
        const pct = document.getElementById('adminLoginProgressPercent');
        const lbl = document.getElementById('adminLoginProgressLabel');
        const sub = document.getElementById('adminLoginSubDetail');

        if (box) box.style.display = 'block';
        if (bar) bar.style.width = `${percent}%`;
        if (pct) pct.textContent = `${percent}%`;
        if (lbl && label) {
          lbl.innerHTML = `
            <span class="loading-spin-radar"></span>
            ${label}
          `;
        }
        if (sub && subDetail) {
          sub.innerHTML = `<span style="font-size: 11px;">🌐</span> <span>${subDetail}</span>`;
        }
      };

      if (this.btnSubmitLogin) {
        this.btnSubmitLogin.disabled = true;
        this.btnSubmitLogin.innerHTML = '<span>⏳</span> Đang xác thực & tải dữ liệu...';
      }
      if (this.loginUsername) this.loginUsername.disabled = true;
      if (this.loginPassword) this.loginPassword.disabled = true;
      if (this.loginErrorMsg) this.loginErrorMsg.style.display = 'none';

      // Step 1: Connecting & validating security
      updateLoginProgress(24, 'Đang kết nối trung tâm bảo mật Chỉ huy...', 'Mã hóa phiên trực ban an ninh quốc gia SSL/TLS 256-bit...');

      let data;
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        data = await res.json();
      } catch (err) {
        console.error('Fetch login error:', err);
        const box = document.getElementById('adminLoginProgressBox');
        if (box) box.style.display = 'none';
        if (this.loginUsername) this.loginUsername.disabled = false;
        if (this.loginPassword) this.loginPassword.disabled = false;
        if (this.btnSubmitLogin) {
          this.btnSubmitLogin.disabled = false;
          this.btnSubmitLogin.innerHTML = '<span>🔐</span> ĐĂNG NHẬP TRỰC BAN';
        }
        if (this.loginErrorMsg) {
          this.loginErrorMsg.textContent = 'Lỗi kết nối máy chủ xác thực. Vui lòng thử lại.';
          this.loginErrorMsg.style.display = 'block';
        }
        return;
      }

      if (!data || !data.ok || !data.profile) {
        const box = document.getElementById('adminLoginProgressBox');
        if (box) box.style.display = 'none';
        if (this.loginUsername) this.loginUsername.disabled = false;
        if (this.loginPassword) this.loginPassword.disabled = false;
        if (this.btnSubmitLogin) {
          this.btnSubmitLogin.disabled = false;
          this.btnSubmitLogin.innerHTML = '<span>🔐</span> ĐĂNG NHẬP TRỰC BAN';
        }
        if (this.loginErrorMsg) {
          this.loginErrorMsg.textContent = (data && data.error) || 'Mật khẩu đơn vị không chính xác!';
          this.loginErrorMsg.style.display = 'block';
        }
        if (data && data.isLocked) {
          alert(data.error);
        }
        return;
      }

      try {
        // Step 2: Administrative Geodata Sync (34 provinces & 3,321 wards)
        updateLoginProgress(58, 'Đang tải thông tin địa giới hành chính quốc gia...', 'Đồng bộ ranh giới 34 tỉnh thành & 3.321 xã/phường (bando.com.vn)...');
        
        // Trigger pre-warming of ward data in parallel
        try {
          if (this.mapController) {
            fetch('/api/geo/all-wards').catch(() => {});
          }
        } catch(e) {}
        await new Promise(r => setTimeout(r, 280));

        // Step 3: Operational Units & Stations
        updateLoginProgress(85, 'Đang nạp mạng lưới trụ sở & dữ liệu tác chiến...', 'Đồng bộ danh bạ Công An, CSGT, PCCC & hệ thống cứu hộ...');

        this.currentOfficer = data.profile;
        sessionStorage.setItem('sos_dispatcher_officer', JSON.stringify(data.profile));
        localStorage.setItem('sos_dispatcher_officer', JSON.stringify(data.profile));

        // 1. Immediately mark officer as authenticated to unhide all operational UI
        document.body.classList.add('officer-authenticated');
        this.applyOfficerProfile(data.profile);

        // 4. Handle duty shift
        const savedShift = sessionStorage.getItem('sos_duty_shift_' + data.profile.username);
        if (savedShift) {
          try {
            this.currentDutyShift = JSON.parse(savedShift);
            this.applyDutyShift(this.currentDutyShift);
          } catch(e) {}
        } else {
          const now = new Date();
          const curH = String(now.getHours()).padStart(2, '0');
          const endH = String((now.getHours() + 8) % 24).padStart(2, '0');
          this.currentDutyShift = {
            officerName: data.profile.officerName || data.profile.username,
            officerRank: data.profile.officerRank || 'Cán bộ',
            officerPhone: data.profile.officerPhone || '113',
            officerSms: data.profile.officerSms || '',
            startTime: `${curH}:00`,
            endTime: `${endH}:00`,
            date: now.toISOString().split('T')[0]
          };
          this.applyDutyShift(this.currentDutyShift);
        }

        // 5. Connect live stream and load active incidents
        this.loadIncidents();
        this.connectLiveStream();

        await new Promise(r => setTimeout(r, 260));

        // Step 4: 100% Ready
        updateLoginProgress(100, 'Khởi tạo thành công 100%! Đang vào trung tâm chỉ huy...', 'Sẵn sàng giám sát & điều phối an ninh toàn quốc.');
        await new Promise(r => setTimeout(r, 350));

        // 2. Immediately hide auth modal & Cosmic Portal
        if (this.authGateModal) {
          this.authGateModal.style.display = 'none';
          this.authGateModal.style.setProperty('display', 'none', 'important');
        }
        const box = document.getElementById('adminLoginProgressBox');
        if (box) box.style.display = 'none';
        if (this.loginUsername) this.loginUsername.disabled = false;
        if (this.loginPassword) this.loginPassword.disabled = false;
        if (this.btnSubmitLogin) {
          this.btnSubmitLogin.disabled = false;
          this.btnSubmitLogin.innerHTML = '<span>🔐</span> ĐĂNG NHẬP TRỰC BAN';
        }
        if (this.loginErrorMsg) this.loginErrorMsg.style.display = 'none';
        if (this.cosmicPortalView) {
          this.cosmicPortalView.style.display = 'none';
          this.cosmicPortalView.style.setProperty('display', 'none', 'important');
        }

        // 3. Immediately halt 3D/ambient loops to free GPU/CPU
        try {
          if (window.tacticalSpace && typeof window.tacticalSpace.stop === 'function') {
            window.tacticalSpace.stop();
          }
          if (window.tacticalCosmic && typeof window.tacticalCosmic.stop === 'function') {
            window.tacticalCosmic.stop();
          }
        } catch(e) {}
        // 6. Resize MapLibre canvas cleanly
        setTimeout(() => {
          if (this.mapController?.map) {
            this.mapController.map.resize();
          }
        }, 150);
      } catch (uiErr) {
        console.error('UI transition error after login:', uiErr);
        document.body.classList.add('officer-authenticated');
        if (this.authGateModal) {
          this.authGateModal.style.display = 'none';
          this.authGateModal.style.setProperty('display', 'none', 'important');
        }
        if (this.cosmicPortalView) {
          this.cosmicPortalView.style.display = 'none';
          this.cosmicPortalView.style.setProperty('display', 'none', 'important');
        }
      }
    };

    if (this.formDispatcherLogin) {
      this.formDispatcherLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        submitDispatcherLogin();
      });
    }

    if (this.btnSubmitLogin) {
      this.btnSubmitLogin.addEventListener('click', (e) => {
        e.preventDefault();
        submitDispatcherLogin();
      });
    }

    if (this.loginUsername) {
      this.loginUsername.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (this.loginPassword && !this.loginPassword.value) {
            this.loginPassword.focus();
          } else {
            submitDispatcherLogin();
          }
        }
      });
    }

    if (this.loginPassword) {
      this.loginPassword.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitDispatcherLogin();
        }
      });
    }

    // Logout
    if (this.btnLogoutDispatcher) {
      this.btnLogoutDispatcher.addEventListener('click', () => {
        this.performLogout();
      });
    }

    // Agency filter buttons
    this.agencyFilterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.agencyFilterButtons.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        this.filterAgency = btn.dataset.filter;
        this.renderQueue();
      });
    });

    // Clear All Incidents
    const btnClear = document.getElementById('btnClearAllIncidents');
    if (btnClear) {
      btnClear.addEventListener('click', async () => {
        const isHistoryTab = this.tabBtnHistory && this.tabBtnHistory.classList.contains('is-active');
        if (isHistoryTab) {
          this.clearHistoryArchive();
          return;
        }

        if (!confirm('Bạn có chắc muốn xóa toàn bộ danh sách sự cố cũ để bắt đầu ca trực mới?')) return;
        try {
          await fetch('/api/dispatcher/incidents/clear', { method: 'POST' });
          this.incidents.clear();
          this.selectedIncidentId = null;
          this.showQueueView();
          this.stopVoiceAlert();
          if (this.mapController && this.mapController.markers) {
            // Remove vehicle, citizen, station markers
            ['vehicle', 'citizen', 'station'].forEach(k => {
              if (this.mapController.markers.has(k)) {
                this.mapController.markers.get(k).remove();
                this.mapController.markers.delete(k);
              }
            });
            if (this.mapController.map && this.mapController.map.getSource('route-source')) {
              this.mapController.map.getSource('route-source').setData({ type: 'FeatureCollection', features: [] });
            }
          }
          this.renderQueue();
          this.renderHistoryList();
          alert('✅ Đã xóa toàn bộ ca sự cố cũ thành công!');
        } catch (e) {
          console.error(e);
        }
      });
    }

    // Bind Back / Close buttons on Active Incident Drawer
    const handleCloseDrawer = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      this.showQueueView();
    };

    const btnBackQueue = document.getElementById('btnBackToQueueList');
    if (btnBackQueue) {
      btnBackQueue.onclick = handleCloseDrawer;
      btnBackQueue.addEventListener('click', handleCloseDrawer);
    }
    const btnCloseDrawer = document.getElementById('btnCloseDrawer');
    if (btnCloseDrawer) {
      btnCloseDrawer.onclick = handleCloseDrawer;
      btnCloseDrawer.addEventListener('click', handleCloseDrawer);
    }

    // Global event delegation as bulletproof fallback for drawer close
    document.addEventListener('click', (e) => {
      const closeTarget = e.target.closest('#btnCloseDrawer') || e.target.closest('#btnBackToQueueList');
      if (closeTarget) {
        handleCloseDrawer(e);
      }
    });

    // Admin tactical stats cards clickable to filter incident list
    const statCards = document.querySelectorAll('.stat-card-btn');
    statCards.forEach(card => {
      card.addEventListener('click', () => {
        const agency = card.dataset.statAgency || 'all';
        statCards.forEach(c => c.classList.toggle('is-active', c === card));
        this.filterAgency = agency;
        this.renderQueue();
        this.openTerritoryStatsModal(agency);
      });
    });

    if (this.btnPlayVoiceAi) {
      this.btnPlayVoiceAi.addEventListener('click', () => {
        if (this.isSpeakingVoiceAi) {
          this.stopVoiceAlert();
        } else if (this.selectedIncidentId) {
          const inc = this.incidents.get(this.selectedIncidentId);
          if (inc) this.speakVoiceAlert(inc, 3);
        }
      });
    }

    const btnVideo = document.getElementById('btnStartVideoCall');
    if (btnVideo) {
      btnVideo.addEventListener('click', () => this.startDispatcherVideoCall());
    }

    // Modal controls for video call
    const btnCloseVideo = document.getElementById('btnCloseDispatcherVideoCall');
    const btnEndVideo = document.getElementById('btnEndDispatcherCall');
    const btnSnapshot = document.getElementById('btnSnapshotStream');
    const btnRecVideo = document.getElementById('btnRecordDispatcherVideoCall');

    if (btnCloseVideo) {
      btnCloseVideo.addEventListener('click', () => this.endDispatcherVideoCall());
    }
    if (btnEndVideo) {
      btnEndVideo.addEventListener('click', () => this.endDispatcherVideoCall());
    }
    if (btnSnapshot) {
      btnSnapshot.addEventListener('click', () => this.snapshotStream());
    }
    if (btnRecVideo) {
      btnRecVideo.addEventListener('click', () => this.toggleDispatcherVideoCallRecording());
    }

    // Modal controls for Voice Call & 2-Channel Audio Recording
    const btnCloseVoice = document.getElementById('btnCloseVoiceCallModal');
    const btnEndVoice = document.getElementById('btnEndVoiceCall');
    const btnRecVoice = document.getElementById('btnActionRecordVoiceCall');
    const btnToggleMic = document.getElementById('btnToggleVoiceMic');

    if (btnCloseVoice) {
      btnCloseVoice.addEventListener('click', () => this.endDispatcherVoiceCall());
    }
    if (btnEndVoice) {
      btnEndVoice.addEventListener('click', () => this.endDispatcherVoiceCall());
    }
    if (btnRecVoice) {
      btnRecVoice.addEventListener('click', () => this.toggleVoiceCallRecording());
    }
    if (btnToggleMic) {
      btnToggleMic.addEventListener('click', () => this.toggleVoiceCallMic());
    }


    if (this.btnAcceptSOS) {
      this.btnAcceptSOS.addEventListener('click', () => this.handleAcceptSOS());
    }
    if (this.btnDeEscalateSOS) {
      this.btnDeEscalateSOS.addEventListener('click', () => this.handleDeEscalateSOS());
    }
    if (this.btnMarkArrived) {
      this.btnMarkArrived.addEventListener('click', () => this.handleUpdateStatus('arrived', 'Đội cứu hộ đã có mặt tại hiện trường!'));
    }
    if (this.btnMarkResolved) {
      this.btnMarkResolved.addEventListener('click', () => this.handleUpdateStatus('resolved', 'Ca cứu hộ đã xử lý hoàn tất an toàn.'));
    }
    if (this.btnOpenReportDocxModal) {
      this.btnOpenReportDocxModal.addEventListener('click', () => {
        if (this.selectedIncidentId) {
          const inc = this.incidents.get(this.selectedIncidentId);
          if (inc) this.openReportModal(inc);
        }
      });
    }

    // Direct 2-Way Chat Listeners
    if (this.btnSendDispatcherChat) {
      this.btnSendDispatcherChat.addEventListener('click', () => this.sendDispatcherChatMessage());
    }
    if (this.inputDispatcherChatText) {
      this.inputDispatcherChatText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.sendDispatcherChatMessage();
      });
    }

    this.bindReportDocxEvents();
    this.initFloatingChatSystem();
    this.bindHistoryPanelEvents();

    // Fake Alarm & OSINT Forensics Triggers
    if (this.btnFlagFakeAlarm) {
      this.btnFlagFakeAlarm.addEventListener('click', () => {
        if (!this.selectedIncidentId) return;
        const inc = this.incidents.get(this.selectedIncidentId);
        if (!inc) return;
        if (inc.status === 'fake_alarm' && (inc.fakeAlarmTrace || inc.fakeTrace)) {
          this.openOsintForensicModal(inc.fakeAlarmTrace || inc.fakeTrace);
        } else {
          this.openFakeAlarmConfirmModal(inc);
        }
      });
    }

    if (this.btnOpenFakeArchivePill) {
      this.btnOpenFakeArchivePill.addEventListener('click', () => {
        this.openFakeArchiveModal();
      });
    }

    this.bindFakeAlarmAndOsintEvents();
    this.bindTerritoryStatsEvents();
  }

  bindHistoryPanelEvents() {
    // Tab switching for sidebar panels
    const switchTab = (activeTab) => {
      if (this.tabBtnIncidents) this.tabBtnIncidents.classList.toggle('is-active', activeTab === 'incidents');
      if (this.tabBtnHistory) this.tabBtnHistory.classList.toggle('is-active', activeTab === 'history');
      if (this.tabBtnStations) this.tabBtnStations.classList.toggle('is-active', activeTab === 'stations');
      if (this.tabBtnEnterprises) this.tabBtnEnterprises.classList.toggle('is-active', activeTab === 'enterprises');
      if (this.tabBtnHospitals) this.tabBtnHospitals.classList.toggle('is-active', activeTab === 'hospitals');
      if (this.panelIncidentsView) this.panelIncidentsView.style.display = activeTab === 'incidents' ? 'flex' : 'none';
      if (this.panelHistoryView) this.panelHistoryView.style.display = activeTab === 'history' ? 'flex' : 'none';
      if (this.panelStationsView) this.panelStationsView.style.display = activeTab === 'stations' ? 'flex' : 'none';
      if (this.panelEnterprisesView) this.panelEnterprisesView.style.display = activeTab === 'enterprises' ? 'flex' : 'none';
      if (this.panelHospitalsView) this.panelHospitalsView.style.display = activeTab === 'hospitals' ? 'flex' : 'none';

      // Update sidebar header title and action button based on active tab
      const sidebarTitle = document.querySelector('.sidebar-main-title');
      const btnClearHeader = document.getElementById('btnClearAllIncidents');
      if (sidebarTitle) {
        sidebarTitle.textContent = activeTab === 'history' ? 'Lịch Sử Sự Cố' : (activeTab === 'stations' ? 'Danh Bạ Trụ Sở' : (activeTab === 'enterprises' ? 'Doanh Nghiệp Cứu Hộ' : (activeTab === 'hospitals' ? 'Mạng Lưới Bệnh Viện' : 'Danh Sách Sự Cố')));
      }
      if (btnClearHeader) {
        if (activeTab === 'history') {
          btnClearHeader.style.display = 'flex';
          btnClearHeader.title = 'Dọn dẹp toàn bộ lịch sử (có thể hoàn tác trong 24 giờ)';
          btnClearHeader.innerHTML = '<svg class="svg-ico ico-xs ico-red" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Dọn dẹp';
        } else if (activeTab === 'incidents') {
          btnClearHeader.style.display = 'flex';
          btnClearHeader.title = 'Xóa toàn bộ danh sách sự cố cũ để bắt đầu ca trực mới';
          btnClearHeader.innerHTML = '<svg class="svg-ico ico-xs ico-red" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Xóa';
        } else {
          btnClearHeader.style.display = 'none';
        }
      }
    };

    // Re-bind tab buttons (replace old listeners via cloneNode)
    const rebind = (el, fn) => {
      if (!el) return;
      const clone = el.cloneNode(true);
      el.parentNode.replaceChild(clone, el);
      clone.addEventListener('click', fn);
      return clone;
    };

    this.tabBtnIncidents = rebind(document.getElementById('tabBtnIncidents'), () => switchTab('incidents'));
    this.tabBtnHistory = rebind(document.getElementById('tabBtnHistory'), () => {
      switchTab('history');
      this.renderHistoryList();
    });
    this.tabBtnStations = rebind(document.getElementById('tabBtnStations'), async () => {
      switchTab('stations');
      if (this.stationsList.length === 0) await this.loadStationsDirectory();
      this.renderStationsDirectory();
    });
    this.tabBtnEnterprises = rebind(document.getElementById('tabBtnEnterprises'), async () => {
      switchTab('enterprises');
      if (this.enterprisesList.length === 0) await this.loadEnterprisesDirectory();
      this.renderEnterprisesDirectory();
    });
    this.tabBtnHospitals = rebind(document.getElementById('tabBtnHospitals'), async () => {
      switchTab('hospitals');
      if (this.hospitalsList.length === 0) await this.loadHospitalsDirectory();
      this.renderHospitalsDirectory();
    });

    // Refresh badge references after tab rebind (cloning replaces inner nodes)
    this.activeCountBadge = document.getElementById('activeCountBadge');
    this.historyCountBadge = document.getElementById('historyCountBadge');

    // History Toolbar
    this.btnExportHistoryExcel = document.getElementById('btnExportHistoryExcel');
    this.btnClearHistoryArchive = document.getElementById('btnClearHistoryArchive');
    this.inputSearchHistory = document.getElementById('inputSearchHistory');

    if (this.btnExportHistoryExcel) {
      this.btnExportHistoryExcel.addEventListener('click', () => this.exportHistoryExcel());
    }
    if (this.btnClearHistoryArchive) {
      this.btnClearHistoryArchive.addEventListener('click', () => this.clearHistoryArchive());
    }
    if (this.inputSearchHistory) {
      this.inputSearchHistory.addEventListener('input', (e) => {
        this.historySearchTerm = (e.target.value || '').toLowerCase().trim();
        this.renderHistoryList();
      });
    }

    // History agency filter buttons
    const historyFilterBtns = document.querySelectorAll('.history-filter-btn');
    historyFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        historyFilterBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        this.historyFilterAgency = btn.dataset.filter || 'all';
        this.renderHistoryList();
      });
    });

    // Undo history delete button
    const btnUndoHistory = document.getElementById('btnUndoHistoryDelete');
    if (btnUndoHistory) {
      btnUndoHistory.addEventListener('click', () => this.undoHistoryDelete());
    }
  }

  initFloatingChatSystem() {
    this.openChatWindows = new Map(); // incidentId -> { isMinimized, element }
    this.chatHubPopover = document.getElementById('dispatcherChatHubPopover');
    this.btnMasterChatHub = document.getElementById('btnMasterChatHub');
    this.btnCloseChatHubPopover = document.getElementById('btnCloseChatHubPopover');
    this.badgeChatHubCount = document.getElementById('badgeChatHubCount');
    this.chatHubTicketTabs = document.getElementById('chatHubTicketTabs');
    this.chatHubDirectChatView = document.getElementById('chatHubDirectChatView');
    this.chatHubListView = document.getElementById('chatHubListView');
    this.chatHubTicketHeader = document.getElementById('chatHubTicketHeader');
    this.chatHubDirectMessagesBody = document.getElementById('chatHubDirectMessagesBody');
    this.inputChatHubDirectMessage = document.getElementById('inputChatHubDirectMessage');
    this.btnSendChatHubDirectMessage = document.getElementById('btnSendChatHubDirectMessage');
    this.btnToggleChatHubMode = document.getElementById('btnToggleChatHubMode');
    this.labelChatHubMode = document.getElementById('labelChatHubMode');
    this.chatHubConversationsList = document.getElementById('chatHubConversationsList');
    this.inputSearchChatHub = document.getElementById('inputSearchChatHub');
    this.chatHubActiveTicketSubtitle = document.getElementById('chatHubActiveTicketSubtitle');
    this.floatingChatWindowsWrapper = document.getElementById('floatingChatWindowsWrapper');
    this.btnOpenFloatingChatFromDrawer = document.getElementById('btnOpenFloatingChatFromDrawer');
    this.chatHubActiveIncidentId = null;

    if (this.btnMasterChatHub) {
      this.btnMasterChatHub.addEventListener('click', (e) => {
        this.toggleChatHubPopover(e);
      });
    }

    if (this.btnCloseChatHubPopover) {
      this.btnCloseChatHubPopover.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.chatHubPopover) this.chatHubPopover.style.display = 'none';
      });
    }

    if (this.btnToggleChatHubMode) {
      this.btnToggleChatHubMode.addEventListener('click', () => {
        const isShowingList = this.chatHubListView && this.chatHubListView.style.display !== 'none';
        if (isShowingList) {
          // Switch to Direct Chat View
          if (this.chatHubListView) this.chatHubListView.style.display = 'none';
          if (this.chatHubDirectChatView) this.chatHubDirectChatView.style.display = 'flex';
          if (this.labelChatHubMode) this.labelChatHubMode.textContent = '📑 Danh sách';
          if (this.chatHubActiveIncidentId) {
            this.selectChatHubTicket(this.chatHubActiveIncidentId);
          }
        } else {
          // Switch to Full List View
          if (this.chatHubDirectChatView) this.chatHubDirectChatView.style.display = 'none';
          if (this.chatHubListView) this.chatHubListView.style.display = 'flex';
          if (this.labelChatHubMode) this.labelChatHubMode.textContent = '💬 Hội thoại';
          this.renderChatHubList();
          if (this.inputSearchChatHub) this.inputSearchChatHub.focus();
        }
      });
    }

    if (this.btnSendChatHubDirectMessage) {
      this.btnSendChatHubDirectMessage.addEventListener('click', () => this.sendChatHubDirectMessage());
    }

    if (this.inputChatHubDirectMessage) {
      this.inputChatHubDirectMessage.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.sendChatHubDirectMessage();
      });
    }

    if (this.inputSearchChatHub) {
      this.inputSearchChatHub.addEventListener('input', (e) => {
        this.renderChatHubList(e.target.value.trim().toLowerCase());
      });
    }

    if (this.btnOpenFloatingChatFromDrawer) {
      this.btnOpenFloatingChatFromDrawer.addEventListener('click', () => {
        if (this.selectedIncidentId) {
          this.openSOSMailbox(this.selectedIncidentId);
        }
      });
    }

    this.updateChatHubBadge();
  }

  toggleChatHubPopover(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!this.chatHubPopover) return;
    const isVisible = this.chatHubPopover.style.display === 'flex' || this.chatHubPopover.style.display === 'block';
    if (isVisible) {
      this.chatHubPopover.style.display = 'none';
    } else {
      this.openSOSMailbox();
    }
  }

  playMessageTing() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioTingCtx) this.audioTingCtx = new AudioCtx();
      if (this.audioTingCtx.state === 'suspended') this.audioTingCtx.resume();

      const now = this.audioTingCtx.currentTime;
      // High-frequency crystal "ting" notification sound (Chime harmonic)
      const osc1 = this.audioTingCtx.createOscillator();
      const gain1 = this.audioTingCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1046.5, now); // C6
      osc1.frequency.exponentialRampToValueAtTime(1318.5, now + 0.08); // E6
      gain1.gain.setValueAtTime(0.38, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc1.connect(gain1);
      gain1.connect(this.audioTingCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.38);

      const osc2 = this.audioTingCtx.createOscillator();
      const gain2 = this.audioTingCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(2093, now + 0.04); // C7 sparkle
      gain2.gain.setValueAtTime(0.25, now + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
      osc2.connect(gain2);
      gain2.connect(this.audioTingCtx.destination);
      osc2.start(now + 0.04);
      osc2.stop(now + 0.48);
    } catch (e) {}
  }

  getUnreadCitizenCount(inc) {
    if (!inc || !Array.isArray(inc.messages)) return 0;
    const lastRead = inc._lastOfficerReadTime || 0;
    return inc.messages.filter(m => m && m.sender === 'citizen' && (new Date(m.timestamp).getTime()) > lastRead).length;
  }

  openSOSMailbox(preferredIncidentId) {
    if (!this.chatHubPopover) return;
    this.chatHubPopover.style.display = 'flex';

    // Show direct view by default
    if (this.chatHubDirectChatView) this.chatHubDirectChatView.style.display = 'flex';
    if (this.chatHubListView) this.chatHubListView.style.display = 'none';
    if (this.labelChatHubMode) this.labelChatHubMode.textContent = '📑 Danh sách';

    // Get active list (never hide uncompleted incidents)
    const activeList = Array.from(this.incidents.values()).filter(inc => inc && inc.status !== 'resolved');
    const unreadList = activeList.filter(inc => this.getUnreadCitizenCount(inc) > 0);

    if (preferredIncidentId && this.incidents.has(preferredIncidentId)) {
      this.chatHubActiveIncidentId = preferredIncidentId;
    } else if (unreadList.length > 0) {
      this.chatHubActiveIncidentId = unreadList[0].id;
    } else if (this.selectedIncidentId && this.incidents.has(this.selectedIncidentId)) {
      this.chatHubActiveIncidentId = this.selectedIncidentId;
    } else if (activeList.length > 0) {
      this.chatHubActiveIncidentId = activeList[0].id;
    } else if (this.incidents.size > 0) {
      this.chatHubActiveIncidentId = Array.from(this.incidents.keys())[0];
    } else {
      this.chatHubActiveIncidentId = null;
    }

    this.renderChatHubTabs();
    if (this.chatHubActiveIncidentId) {
      this.selectChatHubTicket(this.chatHubActiveIncidentId);
    } else {
      if (this.chatHubTicketHeader) {
        this.chatHubTicketHeader.innerHTML = `
          <div style="font-size: 11px; color: #94a3b8; padding: 4px 0;">
            📭 Hộp thư trực ban — Chưa có sự cố SOS nào đang diễn ra
          </div>
        `;
      }
      if (this.chatHubDirectMessagesBody) {
        this.chatHubDirectMessagesBody.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #94a3b8; padding: 24px; text-align: center;">
            <span style="font-size: 36px; margin-bottom: 8px;">📨</span>
            <div style="font-weight: 700; color: #e2e8f0; font-size: 13px;">HỘP THƯ CỨU HỘ TẬP TRUNG</div>
            <div style="font-size: 11px; margin-top: 6px; color: #64748b; line-height: 1.5;">
              Khi có phiếu cứu hộ từ người dân, cán bộ có thể chọn mã phiếu trên thanh tab để xem và trao đổi tin nhắn 2 chiều trực tiếp.
            </div>
          </div>
        `;
      }
    }
  }

  renderChatHubTabs() {
    if (!this.chatHubTicketTabs) return;
    const activeList = Array.from(this.incidents.values()).filter(inc => {
      if (!inc || inc.status === 'resolved') return false;
      if (this.currentOfficer && this.currentOfficer.agency && this.currentOfficer.agency !== 'all') {
        if (inc.agency !== this.currentOfficer.agency) return false;
      }
      return true;
    });

    if (activeList.length === 0) {
      this.chatHubTicketTabs.innerHTML = `
        <div style="font-size: 11px; color: #94a3b8; font-style: italic; padding: 3px 6px;">
          Chưa có phiếu cứu hộ nào đang xử lý
        </div>
      `;
      return;
    }

    // Sort: tickets with unread citizen messages first -> newest
    activeList.sort((a, b) => {
      const aUnread = this.getUnreadCitizenCount(a);
      const bUnread = this.getUnreadCitizenCount(b);
      if (bUnread !== aUnread) return bUnread - aUnread;
      const aMsgs = Array.isArray(a.messages) ? a.messages.length : 0;
      const bMsgs = Array.isArray(b.messages) ? b.messages.length : 0;
      if (bMsgs !== aMsgs) return bMsgs - aMsgs;
      return (new Date(b.createdAt || 0)) - (new Date(a.createdAt || 0));
    });

    this.chatHubTicketTabs.innerHTML = '';
    activeList.forEach(inc => {
      const pill = document.createElement('div');
      const isActive = this.chatHubActiveIncidentId === inc.id;
      const unreadCount = this.getUnreadCitizenCount(inc);
      const sosCode = inc.id ? `#${inc.id.replace('SOS-', '')}` : '#SOS';

      pill.className = `chat-hub-tab-pill ${isActive ? 'active' : ''} ${unreadCount > 0 ? 'has-unread' : ''}`;
      pill.dataset.incidentId = inc.id;

      pill.innerHTML = `
        <span class="pill-dot" style="${unreadCount > 0 ? 'background: #ff2a4b; box-shadow: 0 0 8px #ff2a4b;' : ''}"></span>
        <span style="font-weight: 800;">${sosCode}</span>
        <span style="font-size: 9.5px; opacity: 0.85; max-width: 65px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${inc.reporterName || 'Dân'}</span>
        ${unreadCount > 0 ? `<span class="pill-unread-badge" title="${unreadCount} tin nhắn mới chưa đọc">${unreadCount}</span>` : ''}
      `;

      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectChatHubTicket(inc.id);
      });

      this.chatHubTicketTabs.appendChild(pill);
    });
  }

  selectChatHubTicket(incidentId) {
    if (!incidentId) return;
    this.chatHubActiveIncidentId = incidentId;
    const inc = this.incidents.get(incidentId);
    if (!inc) return;

    // Mark as read for this ticket when officer opens it
    inc._lastOfficerReadTime = Date.now();

    // Update active class on tabs and clear badge for selected ticket
    if (this.chatHubTicketTabs) {
      const pills = this.chatHubTicketTabs.querySelectorAll('.chat-hub-tab-pill');
      pills.forEach(p => {
        if (p.dataset.incidentId === incidentId) {
          p.classList.add('active');
          p.classList.remove('has-unread');
          const badge = p.querySelector('.pill-unread-badge');
          if (badge) badge.remove();
          const dot = p.querySelector('.pill-dot');
          if (dot) {
            dot.style.background = '';
            dot.style.boxShadow = '';
          }
        } else {
          p.classList.remove('active');
        }
      });
    }

    const sosCode = inc.id ? `#${inc.id.replace('SOS-', '')}` : '#SOS';
    if (this.chatHubActiveTicketSubtitle) {
      this.chatHubActiveTicketSubtitle.textContent = `Phiếu ${sosCode} · ${inc.reporterName || 'Người dân'} (${inc.reporterPhone || ''})`;
    }

    // Render Ticket Quick Header
    if (this.chatHubTicketHeader) {
      const agencyLabel = inc.agency === 'police' ? '👮 Công An' : (inc.agency === 'csgt' ? '🚗 CSGT' : (inc.agency === 'fire' ? '🚒 PCCC' : '🛡️ SOS'));
      const statusLabel = inc.status === 'pending' ? '⏳ Chờ tiếp nhận' : (inc.status === 'dispatching' ? '🚓 Đang điều phối' : (inc.status === 'arrived' ? '🚨 Đã tới' : 'Hoàn tất'));

      this.chatHubTicketHeader.innerHTML = `
        <div style="min-width: 0; flex: 1;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="chat-hub-ticket-badge" style="font-size: 11px;">${sosCode}</span>
            <span style="font-size: 11px; font-weight: 800; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              👤 ${inc.reporterName || 'Người dân'}
            </span>
          </div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            📍 ${inc.address || inc.ward || 'Hiện trường'} · <span style="color: ${inc.status === 'pending' ? '#fbbf24' : '#34d399'}; font-weight: 700;">${statusLabel}</span>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
          <a href="tel:${inc.reporterPhone || ''}" class="btn-hub-action btn-hub-call" title="Gọi điện thoại trực tiếp (${inc.reporterPhone || ''})" style="padding: 4px 7px; font-size: 10px;">
            <span>📞</span> Gọi
          </a>
          <button type="button" class="btn-hub-action btn-hub-video btn-hub-direct-video" title="Kết nối Live Video Call Hiện Trường" style="padding: 4px 7px; font-size: 10px;">
            <span>📹</span> Video
          </button>
          <button type="button" class="btn-hub-action btn-hub-chat btn-hub-direct-locate" title="Định vị & Mở phiếu này trên bảng điều phối" style="padding: 4px 7px; font-size: 10px; background: rgba(56, 189, 248, 0.15); border-color: rgba(56, 189, 248, 0.4); color: #38bdf8;">
            <span>📍</span> Vị trí
          </button>
          <button type="button" class="btn-hub-action btn-hub-clear-messages" title="Xóa toàn bộ lịch sử tin nhắn của phiếu này" style="padding: 4px 7px; font-size: 10px; background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.4); color: #f87171;">
            <span>🗑️</span> Xóa tin
          </button>
        </div>
      `;

      const callBtn = this.chatHubTicketHeader.querySelector('.btn-hub-call');
      const videoBtn = this.chatHubTicketHeader.querySelector('.btn-hub-direct-video');
      const locateBtn = this.chatHubTicketHeader.querySelector('.btn-hub-direct-locate');
      const clearBtn = this.chatHubTicketHeader.querySelector('.btn-hub-clear-messages');

      if (callBtn) {
        callBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (this.chatHubPopover) this.chatHubPopover.style.display = 'none';
          this.openDispatcherVoiceCall(inc.id);
        });
      }


      if (videoBtn) {
        videoBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.chatHubPopover) this.chatHubPopover.style.display = 'none';
          this.startDispatcherVideoCall(inc.id);
        });
      }

      if (locateBtn) {
        locateBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectIncident(inc.id);
        });
      }

      if (clearBtn) {
        clearBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (confirm(`Bạn có chắc chắn muốn xóa sạch toàn bộ lịch sử tin nhắn của phiếu ${sosCode}?`)) {
            inc.messages = [];
            this.renderChatHubDirectMessages(inc.id);
            this.renderChatHubTabs();
            this.updateChatHubBadge();
            try {
              await fetch(`/api/sos/messages/${inc.id}`, { method: 'DELETE' });
            } catch (err) {
              console.warn('Delete messages error:', err);
            }
          }
        });
      }
    }

    this.renderChatHubDirectMessages(incidentId);
    this.updateChatHubBadge();

    if (inc.status === 'resolved') {
      if (this.inputChatHubDirectMessage) {
        this.inputChatHubDirectMessage.disabled = true;
        this.inputChatHubDirectMessage.placeholder = '🔒 Phiếu đã hoàn thành — Cuộc trò chuyện đã kết thúc và được lưu vào Lịch sử.';
      }
      if (this.btnChatHubDirectSend) {
        this.btnChatHubDirectSend.disabled = true;
      }
    } else {
      if (this.inputChatHubDirectMessage) {
        this.inputChatHubDirectMessage.disabled = false;
        this.inputChatHubDirectMessage.placeholder = 'Nhập tin nhắn phản hồi tới người dân...';
        this.inputChatHubDirectMessage.focus();
      }
      if (this.btnChatHubDirectSend) {
        this.btnChatHubDirectSend.disabled = false;
      }
    }
  }

  renderChatHubDirectMessages(incidentId) {
    if (!this.chatHubDirectMessagesBody) return;
    const incident = this.incidents.get(incidentId);
    if (!incident) return;

    const messages = Array.isArray(incident.messages) ? incident.messages : [];
    if (messages.length === 0) {
      this.chatHubDirectMessagesBody.innerHTML = `
        <div style="color: #94a3b8; font-style: italic; font-size: 11.5px; text-align: center; margin: auto; padding: 24px 12px; line-height: 1.6;">
          Chưa có trao đổi nào với phiếu này.<br>Nhập tin nhắn bên dưới để hướng dẫn và trao đổi trực tiếp với người dân.
        </div>
      `;
      return;
    }

    this.chatHubDirectMessagesBody.innerHTML = '';
    messages.forEach(msg => {
      const bubble = document.createElement('div');
      const isCitizen = msg.sender === 'citizen';
      const isDispatcher = msg.sender === 'dispatcher';

      bubble.className = `chat-bubble ${msg.sender || 'system'}`;
      const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
      const icon = isCitizen ? '👤' : (isDispatcher ? '🛡️' : 'ℹ️');
      const senderTitle = msg.senderName || (isCitizen ? (incident.reporterName || 'Người dân') : 'Trực ban');

      if (msg.sender === 'system') {
        bubble.innerHTML = `<div>${msg.text}</div>`;
      } else {
        bubble.innerHTML = `
          <div class="chat-bubble-header">
            <span>${icon} ${senderTitle}</span>
            <span class="chat-bubble-time">${timeStr}</span>
          </div>
          <div style="font-size: 12px; line-height: 1.4;">${msg.text}</div>
        `;
      }
      this.chatHubDirectMessagesBody.appendChild(bubble);
    });

    this.chatHubDirectMessagesBody.scrollTop = this.chatHubDirectMessagesBody.scrollHeight;
  }

  async sendChatHubDirectMessage() {
    if (!this.chatHubActiveIncidentId || !this.inputChatHubDirectMessage) return;
    const text = this.inputChatHubDirectMessage.value.trim();
    if (!text) return;

    const officer = this.currentOfficer || {};
    const inc = this.incidents.get(this.chatHubActiveIncidentId);
    const acceptedBy = inc && inc.acceptedBy ? inc.acceptedBy : null;
    let officerName;
    if (acceptedBy && acceptedBy.officerName) {
      const rank = acceptedBy.rank || 'Đ/c';
      const unit = acceptedBy.unit || acceptedBy.ward || '';
      officerName = unit ? `${rank} ${acceptedBy.officerName} — ${unit}` : `${rank} ${acceptedBy.officerName}`;
    } else if (officer.officerName) {
      const rank = officer.rank || 'Đ/c';
      const unit = officer.unit || officer.ward || '';
      officerName = unit ? `${rank} ${officer.officerName} — ${unit}` : `${rank} ${officer.officerName}`;
    } else {
      officerName = 'Công An Trực Ban — Đang xử lý phiếu #' + (this.chatHubActiveIncidentId || '');
    }

    this.inputChatHubDirectMessage.value = '';

    try {
      const res = await fetch('/api/sos/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: this.chatHubActiveIncidentId,
          sender: 'dispatcher',
          senderName: officerName,
          text: text
        })
      });
      const data = await res.json();
      if (data.ok && data.message) {
        if (inc) {
          if (!Array.isArray(inc.messages)) inc.messages = [];
          if (!inc.messages.some(m => m.id === data.message.id)) {
            inc.messages.push(data.message);
          }
          this.renderChatHubDirectMessages(this.chatHubActiveIncidentId);
          if (this.selectedIncidentId === this.chatHubActiveIncidentId) {
            this.renderDispatcherChat(inc);
          }
          if (this.openChatWindows.has(this.chatHubActiveIncidentId)) {
            this.renderFloatingChatMessages(this.chatHubActiveIncidentId);
          }
          this.updateChatHubBadge();
        }
      } else {
        alert('Lỗi: ' + (data.error || 'Không thể gửi tin nhắn'));
      }
    } catch (e) {
      console.error('Error sending direct chat message:', e);
      alert('Không thể kết nối máy chủ để gửi tin nhắn.');
    }
  }

  openFloatingChatWindow(incidentId) {
    if (!incidentId) return;
    this.openSOSMailbox(incidentId);
  }

  closeFloatingChatWindow(incidentId) {
    if (this.openChatWindows.has(incidentId)) {
      const chatWin = this.openChatWindows.get(incidentId);
      if (chatWin && chatWin.element && chatWin.element.parentNode) {
        chatWin.element.parentNode.removeChild(chatWin.element);
      }
      this.openChatWindows.delete(incidentId);
      this.updateChatHubBadge();
    }
  }

  renderFloatingChatMessages(incidentId) {
    if (this.chatHubActiveIncidentId === incidentId) {
      this.renderChatHubDirectMessages(incidentId);
    }
  }

  async sendFloatingChatMessage(incidentId, inputEl) {
    if (!incidentId || !inputEl) return;
    const text = inputEl.value.trim();
    if (!text) return;

    const officer = this.currentOfficer || {};
    const inc = this.incidents.get(incidentId);
    const acceptedBy = inc && inc.acceptedBy ? inc.acceptedBy : null;
    let officerName;
    if (acceptedBy && acceptedBy.officerName) {
      const rank = acceptedBy.rank || 'Đ/c';
      const unit = acceptedBy.unit || acceptedBy.ward || '';
      officerName = unit ? `${rank} ${acceptedBy.officerName} — ${unit}` : `${rank} ${acceptedBy.officerName}`;
    } else if (officer.officerName) {
      const rank = officer.rank || 'Đ/c';
      const unit = officer.unit || officer.ward || '';
      officerName = unit ? `${rank} ${officer.officerName} — ${unit}` : `${rank} ${officer.officerName}`;
    } else {
      officerName = 'Công An Trực Ban — Đang xử lý phiếu #' + (incidentId || '');
    }

    inputEl.value = '';

    try {
      const res = await fetch('/api/sos/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: incidentId,
          sender: 'dispatcher',
          senderName: officerName,
          text: text
        })
      });
      const data = await res.json();
      if (data.ok && data.message) {
        if (inc) {
          if (!Array.isArray(inc.messages)) inc.messages = [];
          if (!inc.messages.some(m => m.id === data.message.id)) {
            inc.messages.push(data.message);
          }
          if (this.chatHubActiveIncidentId === incidentId) {
            this.renderChatHubDirectMessages(incidentId);
          }
          if (this.selectedIncidentId === incidentId) {
            this.renderDispatcherChat(inc);
          }
          this.updateChatHubBadge();
        }
      } else {
        alert('Lỗi: ' + (data.error || 'Không thể gửi tin nhắn'));
      }
    } catch (e) {
      console.error('Error sending chat message:', e);
      alert('Không thể kết nối máy chủ để gửi tin nhắn.');
    }
  }

  renderChatHubList(searchTerm = '') {
    if (!this.chatHubConversationsList) return;
    let list = Array.from(this.incidents.values()).filter(inc => inc && inc.status !== 'resolved');
    
    if (searchTerm) {
      list = list.filter(inc => {
        const id = (inc.id || '').toLowerCase();
        const name = (inc.reporterName || '').toLowerCase();
        const phone = (inc.reporterPhone || '').toLowerCase();
        const addr = (inc.address || '').toLowerCase();
        const tags = (inc.incidentTags || []).join(' ').toLowerCase();
        return id.includes(searchTerm) || name.includes(searchTerm) || phone.includes(searchTerm) || addr.includes(searchTerm) || tags.includes(searchTerm);
      });
    }

    if (list.length === 0) {
      this.chatHubConversationsList.innerHTML = `
        <div style="color: #94a3b8; font-style: italic; font-size: 11.5px; text-align: center; padding: 24px 12px; line-height: 1.5;">
          ${searchTerm ? 'Không tìm thấy phiếu cứu hộ nào phù hợp.' : 'Hiện không có phiếu sự cố nào đang cần hỗ trợ.'}
        </div>
      `;
      return;
    }

    this.chatHubConversationsList.innerHTML = '';
    list.forEach(inc => {
      const item = document.createElement('div');
      const isActive = this.chatHubActiveIncidentId === inc.id;
      item.className = `chat-hub-item ${isActive ? 'active' : ''}`;
      
      const msgCount = Array.isArray(inc.messages) ? inc.messages.length : 0;
      const lastMsg = msgCount > 0 ? inc.messages[msgCount - 1] : null;
      const timeStr = lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : new Date(inc.createdAt || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const lastText = lastMsg ? lastMsg.text : 'Chưa có trao đổi...';
      const sosCode = inc.id ? `#${inc.id.replace('SOS-', '')}` : '#SOS';
      const agencyLabel = inc.agency === 'police' ? '👮 Công An' : (inc.agency === 'csgt' ? '🚗 CSGT' : (inc.agency === 'fire' ? '🚒 PCCC' : '🛡️ SOS'));
      const statusLabel = inc.status === 'pending' ? '⏳ Chờ tiếp nhận' : (inc.status === 'dispatching' ? '🚓 Đang điều phối' : (inc.status === 'arrived' ? '🚨 Đã tới' : 'Hoàn tất'));
      const tagsText = (inc.incidentTags || []).join(', ') || 'Cứu hộ khẩn cấp';

        const cardPhoneDisplay = `📞 ${inc.reporterPhone || 'Chưa cung cấp'}`;

        item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="chat-hub-ticket-badge">${sosCode}</span>
            <span style="font-size: 10px; font-weight: 800; color: #38bdf8;">${agencyLabel}</span>
          </div>
          <span style="font-size: 10px; color: #94a3b8;">${timeStr}</span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 6px; margin-top: 2px;">
          <div style="font-size: 12px; font-weight: 800; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            👤 ${inc.reporterName || 'Người dân'}
          </div>
          <div style="font-size: 11px; font-weight: 700; color: #38bdf8; flex-shrink: 0;" title="Bảo vệ dữ liệu cá nhân theo NĐ 13/2023/NĐ-CP">
            ${cardPhoneDisplay}
          </div>
        </div>

        <div style="font-size: 10.5px; color: #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          🚨 <b style="color: #f87171;">${tagsText}</b> · <span>${inc.address || inc.ward || 'Hiện trường'}</span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; margin-top: 2px; padding-top: 4px; border-top: 1px dashed rgba(255,255,255,0.08);">
          <div style="font-size: 11px; color: ${lastMsg ? '#e2e8f0' : '#64748b'}; font-style: ${lastMsg ? 'normal' : 'italic'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">
            💬 ${lastText}
          </div>
          <span style="font-size: 9.5px; font-weight: 800; color: ${inc.status === 'pending' ? '#fbbf24' : '#34d399'}; flex-shrink: 0;">
            ${statusLabel}
          </span>
        </div>

        <div class="chat-hub-ticket-actions" onclick="event.stopPropagation()">
          <a href="tel:${inc.reporterPhone || ''}" class="btn-hub-action btn-hub-call" title="Gọi điện thoại trực tiếp">
            <span>📞</span> Gọi
          </a>
          <button type="button" class="btn-hub-action btn-hub-video btn-trigger-hub-video" title="Kết nối Live Video Call Hiện Trường">
            <span>📹</span> Call Video
          </button>
          <button type="button" class="btn-hub-action btn-hub-chat btn-trigger-hub-chat" title="Xem tin nhắn phiếu này">
            <span>💬</span> Xem Tin Nhắn
          </button>
        </div>
      `;

      const btnCallVoice = item.querySelector('.btn-hub-call');
      const btnCallVideo = item.querySelector('.btn-trigger-hub-video');
      const btnChat = item.querySelector('.btn-trigger-hub-chat');

      if (btnCallVoice) {
        btnCallVoice.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (this.chatHubPopover) this.chatHubPopover.style.display = 'none';
          this.openDispatcherVoiceCall(inc.id);
        });
      }


      if (btnCallVideo) {
        btnCallVideo.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.chatHubPopover) this.chatHubPopover.style.display = 'none';
          this.startDispatcherVideoCall(inc.id);
        });
      }

      if (btnChat) {
        btnChat.addEventListener('click', (e) => {
          e.stopPropagation();
          // Switch to Direct Chat View for this incident
          if (this.chatHubListView) this.chatHubListView.style.display = 'none';
          if (this.chatHubDirectChatView) this.chatHubDirectChatView.style.display = 'flex';
          if (this.labelChatHubMode) this.labelChatHubMode.textContent = '📑 Danh sách';
          this.selectChatHubTicket(inc.id);
        });
      }

      item.addEventListener('click', () => {
        // Switch to Direct Chat View for this incident
        if (this.chatHubListView) this.chatHubListView.style.display = 'none';
        if (this.chatHubDirectChatView) this.chatHubDirectChatView.style.display = 'flex';
        if (this.labelChatHubMode) this.labelChatHubMode.textContent = '📑 Danh sách';
        this.selectChatHubTicket(inc.id);
      });

      this.chatHubConversationsList.appendChild(item);
    });
  }

  updateChatHubBadge() {
    if (!this.badgeChatHubCount) return;
    const activeList = Array.from(this.incidents.values()).filter(inc => inc && inc.status !== 'resolved');
    
    // Total unread messages across all active incidents
    let totalUnreadMessages = 0;
    activeList.forEach(inc => {
      totalUnreadMessages += this.getUnreadCitizenCount(inc);
    });

    if (totalUnreadMessages > 0) {
      this.badgeChatHubCount.textContent = totalUnreadMessages > 99 ? '99+' : totalUnreadMessages;
      this.badgeChatHubCount.style.display = 'flex';
      this.badgeChatHubCount.style.background = 'linear-gradient(135deg, #ff2a4b, #dc2626)';
      this.badgeChatHubCount.style.boxShadow = '0 0 10px rgba(255, 42, 75, 0.85)';
    } else if (activeList.length > 0) {
      this.badgeChatHubCount.textContent = activeList.length > 99 ? '99+' : activeList.length;
      this.badgeChatHubCount.style.display = 'flex';
      this.badgeChatHubCount.style.background = 'linear-gradient(135deg, #0284c7, #0369a1)';
      this.badgeChatHubCount.style.boxShadow = '';
    } else {
      this.badgeChatHubCount.style.display = 'none';
    }
  }

  renderDispatcherChat(incident) {
    if (!this.dispatcherChatMessages) return;
    if (!incident) {
      this.dispatcherChatMessages.innerHTML = '<div style="color: #94a3b8; font-style: italic; font-size: 11px; text-align: center;">Chưa có ca sự cố nào được chọn.</div>';
      return;
    }

    if (this.dispatcherChatCitizenName) {
      this.dispatcherChatCitizenName.textContent = `(${incident.reporterName || 'Người dân'} · ${incident.reporterPhone || ''})`;
    }

    const messages = Array.isArray(incident.messages) ? incident.messages : [];
    if (messages.length === 0) {
      this.dispatcherChatMessages.innerHTML = '<div style="color: #94a3b8; font-style: italic; font-size: 11px; text-align: center;">Chưa có trao đổi nào. Hãy nhập tin nhắn bên dưới để liên hệ người dân.</div>';
      return;
    }

    this.dispatcherChatMessages.innerHTML = '';
    messages.forEach(msg => {
      const bubble = document.createElement('div');
      const isCitizen = msg.sender === 'citizen';
      const isDispatcher = msg.sender === 'dispatcher';
      
      bubble.className = `chat-bubble ${msg.sender || 'system'}`;
      const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
      const icon = isCitizen ? '👤' : (isDispatcher ? '🛡️' : 'ℹ️');
      const senderTitle = msg.senderName || (isCitizen ? 'Người dân' : 'Trực ban');

      if (msg.sender === 'system') {
        bubble.innerHTML = `<div>${msg.text}</div>`;
      } else {
        bubble.innerHTML = `
          <div class="chat-bubble-header">
            <span>${icon} ${senderTitle}</span>
            <span class="chat-bubble-time">${timeStr}</span>
          </div>
          <div style="font-size: 12px; line-height: 1.4;">${msg.text}</div>
        `;
      }
      this.dispatcherChatMessages.appendChild(bubble);
    });

    this.dispatcherChatMessages.scrollTop = this.dispatcherChatMessages.scrollHeight;
  }

  async sendDispatcherChatMessage() {
    if (!this.selectedIncidentId || !this.inputDispatcherChatText) return;
    const text = this.inputDispatcherChatText.value.trim();
    if (!text) return;

    const officer = this.currentOfficer || {};
    const incObj = this.incidents.get(this.selectedIncidentId);
    const acceptedBy = incObj && incObj.acceptedBy ? incObj.acceptedBy : null;
    let officerName;
    if (acceptedBy && acceptedBy.officerName) {
      const rank = acceptedBy.rank || 'Đ/c';
      const unit = acceptedBy.unit || acceptedBy.ward || '';
      officerName = unit ? `${rank} ${acceptedBy.officerName} — ${unit}` : `${rank} ${acceptedBy.officerName}`;
    } else if (officer.officerName) {
      const rank = officer.rank || 'Đ/c';
      const unit = officer.unit || officer.ward || '';
      officerName = unit ? `${rank} ${officer.officerName} — ${unit}` : `${rank} ${officer.officerName}`;
    } else {
      officerName = 'Công An Trực Ban — Đang xử lý phiếu #' + (this.selectedIncidentId || '');
    }

    this.inputDispatcherChatText.value = '';

    try {
      const res = await fetch('/api/sos/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: this.selectedIncidentId,
          sender: 'dispatcher',
          senderName: officerName,
          text: text
        })
      });
      const data = await res.json();
      if (data.ok && data.message) {
        const inc = this.incidents.get(this.selectedIncidentId);
        if (inc) {
          if (!Array.isArray(inc.messages)) inc.messages = [];
          if (!inc.messages.some(m => m.id === data.message.id)) {
            inc.messages.push(data.message);
          }
          this.renderDispatcherChat(inc);
          if (this.openChatWindows.has(this.selectedIncidentId)) {
            this.renderFloatingChatMessages(this.selectedIncidentId);
          }
          this.updateChatHubBadge();
        }
      } else {
        alert('Lỗi: ' + (data.error || 'Không thể gửi tin nhắn'));
      }
    } catch (e) {
      console.error('Error sending chat message:', e);
      alert('Không thể kết nối máy chủ để gửi tin nhắn.');
    }
  }

  snapshotStream() {
    const videoEl = document.getElementById('dispatcherRemoteVideoElement');
    const canvas = document.createElement('canvas');
    const w = (videoEl && videoEl.videoWidth) ? videoEl.videoWidth : 1280;
    const h = (videoEl && videoEl.videoHeight) ? videoEl.videoHeight : 720;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    if (videoEl && videoEl.readyState >= 2) {
      ctx.drawImage(videoEl, 0, 0, w, h);
    } else {
      // Create tactical fallback snapshot
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(20, 20, w - 40, h - 40);
    }

    // Tactical Timestamp & Incident Watermark Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(20, h - 70, 560, 50);
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#00d2ff';
    ctx.fillText(`🚨 SOS VIỆT NAM — #${this.selectedIncidentId || 'LIVE'}`, 35, h - 42);
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`Thời gian chụp: ${new Date().toLocaleString('vi-VN')} | Đơn vị: Cán bộ trực ban`, 35, h - 22);

    const dataUrl = canvas.toDataURL('image/png');

    // 1. Download file directly to user device / disk
    const filename = `HienTruong_${this.selectedIncidentId || 'SOS'}_${Date.now()}.png`;
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 2. Add into incident's persistent media records
    if (this.selectedIncidentId) {
      const inc = this.incidents.get(this.selectedIncidentId);
      if (inc) {
        if (!Array.isArray(inc.media)) inc.media = [];
        inc.media.push({
          type: 'image',
          name: filename,
          dataUrl
        });
        this.updateDrawer(inc);
      }
    }

    alert(`📸 ĐÃ CHỤP ẢNH HIỆN TRƯỜNG THÀNH CÔNG!\n\n📁 Đã tải ảnh "${filename}" về máy tính.\n📂 Đã lưu trực tiếp vào hồ sơ hình ảnh của phiếu cứu hộ.`);
  }

  async startDispatcherVideoCall(targetIncidentId, isIncomingFromCitizen = false, targetUnit = null) {
    const incId = targetIncidentId || this.selectedIncidentId;
    if (!incId) return;
    this.selectedIncidentId = incId;
    const inc = this.incidents.get(incId) || { id: incId, reporterName: 'Người dân', reporterPhone: '' };

    const modal = document.getElementById('dispatcherVideoCallModal');
    const streamSosId = document.getElementById('dispatcherStreamSosId');
    const repName = document.getElementById('dispatcherStreamReporterName');
    const repPhone = document.getElementById('dispatcherStreamReporterPhone');
    const statusBadge = document.getElementById('dispatcherCallStatusBadge');
    const waitingOverlay = document.getElementById('dispatcherStreamWaitingOverlay');
    const videoEl = document.getElementById('dispatcherRemoteVideoElement');

    if (videoEl) videoEl.srcObject = null;
    if (streamSosId) streamSosId.textContent = `#${inc.id}`;

    if (targetUnit) {
      const uName = targetUnit.name || targetUnit.unitName || 'Công An Khu Vực';
      const oName = targetUnit.officerFullTitle || targetUnit.officerName || 'Trực ban tác chiến';
      const uPhone = targetUnit.phone || '0292 3899 113';

      if (repName) repName.textContent = `${uName} (${oName})`;
      if (repPhone) repPhone.textContent = uPhone;

      if (statusBadge) {
        statusBadge.textContent = '📡 ĐANG THIẾT LẬP CẦU TRUYỀN HÌNH CHỈ HUY QUỐC GIA ⟷ ĐƠN VỊ ĐỊA BÀN...';
        statusBadge.style.color = '#38bdf8';
        statusBadge.style.background = 'rgba(56, 189, 248, 0.2)';
      }
      if (waitingOverlay) {
        waitingOverlay.style.display = 'flex';
        waitingOverlay.innerHTML = `
          <div style="animation: bounce 1.5s infinite;"><svg class="svg-ico ico-2xl ico-blue" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg></div>
          <div style="font-size: 14px; font-weight: 700; color: #f8fafc;">Đang kết nối Cầu Truyền Hình Tác Chiến tới ${uName}...</div>
          <div style="font-size: 11px; color: #94a3b8; max-width: 440px;">Cán bộ trực ban: <b style="color: #67e8f9;">${oName}</b> · Đường dây nóng: <b style="color: #34d399;">${uPhone}</b></div>
          <div style="font-size: 10.5px; color: #64748b; margin-top: 4px;">Đường truyền bảo mật cấp Quốc Gia trực tiếp tới Công An / Đơn vị phụ trách địa bàn.</div>
        `;
      }
    } else {
      if (repName) repName.textContent = inc.reporterName || 'Người dân';
      if (repPhone) repPhone.textContent = inc.reporterPhone || 'Chưa có SĐT';

      if (isIncomingFromCitizen) {
        if (statusBadge) {
          statusBadge.textContent = '🟢 ĐÃ CHẤP NHẬN YÊU CẦU VIDEO TỪ NGƯỜI DÂN';
          statusBadge.style.color = '#34d399';
          statusBadge.style.background = 'rgba(16, 185, 129, 0.2)';
        }
        if (waitingOverlay) waitingOverlay.style.display = 'none';
      } else {
        if (statusBadge) {
          statusBadge.textContent = '⏳ Đang gửi yêu cầu mở camera tới người dân...';
          statusBadge.style.color = '#fbbf24';
          statusBadge.style.background = 'rgba(251, 191, 36, 0.15)';
        }
        if (waitingOverlay) waitingOverlay.style.display = 'flex';
      }
    }

    if (modal) {
      modal.classList.add('is-open');
      modal.style.display = 'flex';
      modal.style.visibility = 'visible';
      modal.style.opacity = '1';
    }

    // Send signal (accept if incoming from citizen, request if initiated by dispatcher)
    try {
      await fetch('/api/sos/videocall/signal', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          id: inc.id,
          action: isIncomingFromCitizen ? 'accept' : 'request',
          sender: 'dispatcher',
          callType: 'video',
          token: this.currentOfficer?.token
        })
      });
    } catch (e) {
      console.warn('Video call signal error:', e);
    }
  }

  endDispatcherVideoCall(notify = true) {
    const modal = document.getElementById('dispatcherVideoCallModal');
    if (modal) {
      modal.classList.remove('is-open');
      modal.style.display = 'none';
    }

    const videoEl = document.getElementById('dispatcherRemoteVideoElement');
    if (videoEl) videoEl.srcObject = null;

    if (this.dispatcherMediaStream) {
      this.dispatcherMediaStream.getTracks().forEach(t => t.stop());
      this.dispatcherMediaStream = null;
    }

    if (this.videoCallRecorder && this.videoCallRecorder.isRecording) {
      this.videoCallRecorder.stopAndDownload(this.selectedIncidentId || 'VIDEO');
    } else if (this.videoCallRecorder) {
      this.videoCallRecorder.destroyAudioPipeline();
    }
    const recText = document.getElementById('recTextVideo');
    if (recText) recText.textContent = '🔴 Ghi Âm 2 Bên';
    const recDot = document.getElementById('recDotVideo');
    if (recDot) recDot.style.animation = 'none';

    if (notify && this.selectedIncidentId) {
      fetch('/api/sos/videocall/signal', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ id: this.selectedIncidentId, action: 'end', sender: 'dispatcher', token: this.currentOfficer?.token })
      }).catch(() => {});
    }
  }

  // Handle 2-way call audio recording for Video Call
  async toggleDispatcherVideoCallRecording() {
    const btn = document.getElementById('btnRecordDispatcherVideoCall');
    const recDot = document.getElementById('recDotVideo');
    const recText = document.getElementById('recTextVideo');
    const videoEl = document.getElementById('dispatcherRemoteVideoElement');

    if (!this.videoCallRecorder) {
      this.videoCallRecorder = new CallAudioRecorder({
        onTick: (formatted) => {
          if (recText) recText.textContent = `⏹️ Dừng & Tải MP3 (${formatted})`;
        }
      });
    }

    if (!this.videoCallRecorder.isRecording) {
      try {
        await this.videoCallRecorder.startRecording(this.dispatcherMediaStream, videoEl);
        if (recDot) {
          recDot.style.background = '#ef4444';
          recDot.style.animation = 'pulse 1s infinite';
        }
        if (recText) recText.textContent = '⏹️ Dừng & Tải MP3 (00:00)';
        if (btn) {
          btn.style.background = 'rgba(239, 68, 68, 0.45)';
          btn.style.borderColor = '#ef4444';
        }
      } catch (err) {
        alert('Không thể bắt đầu ghi âm: ' + err.message);
      }
    } else {
      const res = await this.videoCallRecorder.stopAndDownload(this.selectedIncidentId || 'VIDEO');
      if (recDot) {
        recDot.style.animation = 'none';
        recDot.style.background = '#ef4444';
      }
      if (recText) recText.textContent = '🔴 Ghi Âm 2 Bên';
      if (btn) {
        btn.style.background = 'rgba(239, 68, 68, 0.2)';
        btn.style.borderColor = '#ef4444';
      }
      if (res && res.success) {
        this.showFloatingToast(`✓ Đã tải tệp MP3 "${res.filename}" (${Math.round(res.size / 1024)} KB). Dữ liệu ghi âm đã tự hủy khỏi bộ nhớ (Tuân thủ NĐ 13/2023/NĐ-CP).`);
      }
    }
  }

  // Backend-Gated PII Delivery: JIT Unmasking with Audit Trail
  async unmaskIncidentPii(incidentId, reason = 'Tiếp nhận đàm thoại điều phối hiện trường') {
    if (!incidentId) return null;
    try {
      const resp = await fetch('/api/dispatcher/incidents/unmask-pii', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId, reason })
      });
      const data = await resp.json();
      if (data && data.ok && data.reporterPhone) {
        if (this.incidents) {
          const inc = this.incidents.get(incidentId);
          if (inc) {
            inc.reporterPhone = data.reporterPhone;
            inc.isPiiMasked = false;
          }
        }
        return data.reporterPhone;
      }
    } catch (err) {
      console.warn('Could not unmask PII:', err);
    }
    return null;
  }

  // Web Audio API telephone ringer for Dispatcher incoming calls
  startIncomingCallRingtone() {
    try {
      if (this.callRingtonePlaying) return;
      this.callRingtonePlaying = true;

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.ringtoneAudioCtx || this.ringtoneAudioCtx.state === 'closed') {
        this.ringtoneAudioCtx = new AudioContextClass();
      }
      if (this.ringtoneAudioCtx.state === 'suspended') {
        this.ringtoneAudioCtx.resume().catch(() => {});
      }

      const playCadence = () => {
        if (!this.callRingtonePlaying || !this.ringtoneAudioCtx) return;
        const now = this.ringtoneAudioCtx.currentTime;
        this.playRingTonePair(now, 0.45);
        this.playRingTonePair(now + 0.65, 0.45);
        this.ringtoneTimer = setTimeout(() => {
          if (this.callRingtonePlaying) playCadence();
        }, 3000);
      };

      playCadence();
    } catch (e) {
      console.warn('Cannot start incoming call ringtone on dispatcher:', e);
    }
  }

  playRingTonePair(startTime, duration) {
    if (!this.ringtoneAudioCtx) return;
    try {
      const osc1 = this.ringtoneAudioCtx.createOscillator();
      const osc2 = this.ringtoneAudioCtx.createOscillator();
      const gain = this.ringtoneAudioCtx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, startTime);
      osc2.frequency.setValueAtTime(480, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.04);
      gain.gain.setValueAtTime(0.3, startTime + duration - 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ringtoneAudioCtx.destination);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + duration);
      osc2.stop(startTime + duration);
    } catch (e) {
      console.warn('playRingTonePair error:', e);
    }
  }

  stopIncomingCallRingtone() {
    this.callRingtonePlaying = false;
    if (this.ringtoneTimer) {
      clearTimeout(this.ringtoneTimer);
      this.ringtoneTimer = null;
    }
    if (this.ringtoneAudioCtx && this.ringtoneAudioCtx.state === 'running') {
      try {
        this.ringtoneAudioCtx.suspend().catch(() => {});
      } catch(e) {}
    }
  }

  // Display Tactical Incoming Call Modal on Dispatcher side (Matching photo design)
  showDispatcherIncomingCallModal(signal) {
    const modal = document.getElementById('dispatcherIncomingCallModal');
    if (!modal) return;

    const inc = this.incidents.get(signal.incidentId);
    const heading = document.getElementById('dispatcherIncomingCallHeading');
    const icon = document.getElementById('dispatcherIncomingCallIcon');
    const sosId = document.getElementById('dispatcherIncomingSosId');
    const nameEl = document.getElementById('dispatcherIncomingCallerName');
    const phoneEl = document.getElementById('dispatcherIncomingCallerPhone');
    const addrEl = document.getElementById('dispatcherIncomingAddress');
    const descEl = document.getElementById('dispatcherIncomingCallDesc');
    const acceptIcon = document.getElementById('dispatcherIncomingAcceptIcon');
    const acceptText = document.getElementById('dispatcherIncomingAcceptText');
    const btnAccept = document.getElementById('btnAcceptIncomingCallFromCitizen');
    const btnReject = document.getElementById('btnRejectIncomingCallFromCitizen');

    const isVideo = (signal.callType === 'video');
    const citizenName = (inc && inc.reporterName) || 'Người dân';
    const citizenPhone = (inc && inc.reporterPhone) || 'Chưa có SĐT';
    const incidentAddress = (inc && (inc.address || inc.ward)) || 'Địa bàn phụ trách';

    if (sosId) sosId.textContent = `#${signal.incidentId}`;
    if (nameEl) nameEl.textContent = citizenName;
    if (phoneEl) phoneEl.textContent = `(${citizenPhone})`;
    if (addrEl) addrEl.textContent = incidentAddress;

    if (isVideo) {
      if (heading) heading.textContent = 'YÊU CẦU CUỘC GỌI VIDEO TỪ NGƯỜI DÂN';
      if (icon) {
        icon.textContent = '📹';
        icon.style.background = 'rgba(239, 68, 68, 0.2)';
        icon.style.borderColor = '#ef4444';
      }
      if (descEl) descEl.textContent = 'Người dân đang kết nối Video Camera hiện trường để báo cáo tình hình thực tế và nhận chỉ đạo cứu nạn khẩn cấp.';
      if (acceptIcon) acceptIcon.textContent = '📹';
      if (acceptText) acceptText.textContent = 'BẬT MÀN HÌNH NHẬN VIDEO';
    } else {
      if (heading) heading.textContent = 'CUỘC GỌI THOẠI KHẨN CẤP TỪ NGƯỜI DÂN';
      if (icon) {
        icon.textContent = '📞';
        icon.style.background = 'rgba(16, 185, 129, 0.2)';
        icon.style.borderColor = '#10b981';
      }
      if (descEl) descEl.textContent = 'Người dân đang gọi thoại trực tiếp để báo cáo tình hình hiện trường khẩn cấp và nhận hướng dẫn chỉ đạo cứu hộ.';
      if (acceptIcon) acceptIcon.textContent = '📞';
      if (acceptText) acceptText.textContent = 'NHẬN CUỘC GỌI THOẠI';
    }

    modal.classList.add('is-open');
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';

    // Start authentic telephone ringtone for dispatcher
    this.startIncomingCallRingtone();

    if (btnAccept) {
      btnAccept.onclick = () => {
        this.stopIncomingCallRingtone();
        modal.classList.remove('is-open');
        modal.style.display = 'none';

        // Automatically select and focus incident in dispatcher UI
        this.selectedIncidentId = signal.incidentId;
        if (inc) {
          this.selectedIncident = inc;
          this.updateDrawer(inc);
        }

        if (isVideo) {
          this.startDispatcherVideoCall(signal.incidentId, true);
        } else {
          this.openDispatcherVoiceCall(signal.incidentId, true);
        }
      };
    }

    if (btnReject) {
      btnReject.onclick = () => {
        this.stopIncomingCallRingtone();
        modal.classList.remove('is-open');
        modal.style.display = 'none';

        fetch('/api/sos/videocall/signal', {
          method: 'POST',
          credentials: 'same-origin',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            id: signal.incidentId,
            action: 'reject',
            sender: 'dispatcher',
            callType: signal.callType || 'voice',
            token: this.currentOfficer?.token
          })
        }).catch(e => console.warn('Reject signal error:', e));

        this.showToast?.(`Đã từ chối cuộc gọi từ #${signal.incidentId}`, 'info');
      };
    }
  }

  // Open dedicated Voice Call & 2-Channel Recording Modal (Gọi thường)
  openDispatcherVoiceCall(targetIncidentId, isIncomingFromCitizen = false, targetUnit = null) {
    const incId = targetIncidentId || this.selectedIncidentId || 'SOS-CALL';
    this.selectedIncidentId = incId;
    const inc = (this.incidents && this.incidents.get(incId)) || {
      id: incId,
      reporterName: 'Người dân',
      reporterPhone: '',
      address: 'Hiện trường sự cố'
    };

    // JIT Unmask PII if masked (only when calling citizen)
    if (!targetUnit && (inc.isPiiMasked || (inc.reporterPhone && inc.reporterPhone.includes('•••')))) {
      this.unmaskIncidentPii(incId, 'Gọi đàm thoại cứu nạn khẩn cấp 2 bên').then(realPhone => {
        if (realPhone) {
          inc.reporterPhone = realPhone;
          const phoneEl = document.getElementById('voiceCallReporterPhone');
          if (phoneEl) phoneEl.textContent = realPhone;
        }
      }).catch(() => {});
    }

    const modal = document.getElementById('dispatcherVoiceCallModal');
    const sosId = document.getElementById('voiceCallSosId');
    const repName = document.getElementById('voiceCallReporterName');
    const repPhone = document.getElementById('voiceCallReporterPhone');
    const incAddr = document.getElementById('voiceCallIncidentAddress');
    const timer = document.getElementById('voiceCallTimer');
    const hint = document.getElementById('voiceCallVisualizerHint');

    if (sosId) sosId.textContent = `#${inc.id}`;

    if (targetUnit) {
      const uName = targetUnit.name || targetUnit.unitName || 'Công An Khu Vực';
      const oName = targetUnit.officerFullTitle || targetUnit.officerName || 'Trực ban tác chiến';
      const uPhone = targetUnit.phone || '0292 3899 113';

      if (repName) repName.textContent = uName;
      if (repPhone) repPhone.textContent = `☎️ ${uPhone} (${oName})`;
      if (incAddr) incAddr.textContent = `🏢 Kênh đàm thoại nội bộ TTCH Quốc Gia ⟷ ${uName}`;
      if (timer) timer.textContent = '⏱️ 00:00';
      if (hint) {
        hint.style.display = 'flex';
        hint.textContent = `📞 Đang thiết lập kênh thoại tác chiến trực tiếp tới ${uName}...`;
        hint.style.color = '#34d399';
      }
    } else {
      if (repName) repName.textContent = inc.reporterName || 'Người dân';
      if (repPhone) repPhone.textContent = inc.reporterPhone || 'Chưa có SĐT';
      if (incAddr) incAddr.textContent = `📍 ${inc.address || inc.ward || 'Hiện trường sự cố'}`;
      if (timer) timer.textContent = '⏱️ 00:00';
      if (hint) hint.style.display = 'flex';
    }

    if (modal) {
      modal.classList.add('is-open');
      modal.style.display = 'flex';
      modal.style.visibility = 'visible';
      modal.style.opacity = '1';
    }

    if (isIncomingFromCitizen) {
      // Citizen is calling Dispatcher -> Dispatcher answers by sending 'accept' signal
      if (hint) {
        hint.textContent = '🟢 ĐÃ KẾT NỐI ĐÀM THOẠI 2 CHIỀU VỚI NGƯỜI DÂN';
        hint.style.color = '#34d399';
      }
      fetch('/api/sos/videocall/signal', {
        method: 'POST',
        credentials: 'same-origin',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ id: inc.id, action: 'accept', sender: 'dispatcher', callType: 'voice', token: this.currentOfficer?.token })
      }).catch(e => console.warn('Voice call accept signal error:', e));
    } else {
      // Dispatcher calls Citizen -> Send voice call request signal to citizen specifically for this incident
      if (hint) {
        if (targetUnit) {
          hint.textContent = `📞 Đang kết nối kênh thoại tác chiến tới ${targetUnit.name || 'đơn vị địa bàn'}...`;
          hint.style.color = '#34d399';
        } else {
          hint.textContent = '📞 Đang đổ chuông gọi người dân... (Chờ người dân nhấc máy)';
          hint.style.color = '#fbbf24';
        }
      }
      fetch('/api/sos/videocall/signal', {
        method: 'POST',
        credentials: 'same-origin',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ id: inc.id, action: 'request', sender: 'dispatcher', callType: 'voice', token: this.currentOfficer?.token })
      }).catch(e => console.warn('Voice call request signal error:', e));
    }

    // Start Call Duration Timer
    let sec = 0;
    if (this._voiceCallTimerInterval) clearInterval(this._voiceCallTimerInterval);
    this._voiceCallTimerInterval = setInterval(() => {
      sec++;
      const m = String(Math.floor(sec / 60)).padStart(2, '0');
      const s = String(sec % 60).padStart(2, '0');
      if (timer) timer.textContent = `⏱️ ${m}:${s}`;
    }, 1000);
  }

  // Toggle 2-Channel Audio Recording during Voice Call
  async toggleVoiceCallRecording() {
    const btn = document.getElementById('btnActionRecordVoiceCall');
    const icon = document.getElementById('btnActionRecordVoiceIcon');
    const text = document.getElementById('btnActionRecordVoiceText');
    const badge = document.getElementById('voiceCallRecBadge');
    const canvas = document.getElementById('voiceCallVisualizerCanvas');
    const hint = document.getElementById('voiceCallVisualizerHint');

    if (!this.voiceCallRecorder) {
      this.voiceCallRecorder = new CallAudioRecorder({
        onTick: (formatted) => {
          if (text) text.textContent = `DỪNG GHI ÂM & TẢI MP3 (${formatted})`;
        }
      });
    }

    if (!this.voiceCallRecorder.isRecording) {
      try {
        if (hint) hint.style.display = 'none';
        await this.voiceCallRecorder.startRecording(null, null, canvas);
        if (badge) badge.style.display = 'inline-flex';
        if (icon) icon.textContent = '⏹️';
        if (text) text.textContent = 'DỪNG GHI ÂM & TẢI MP3 (00:00)';
        if (btn) btn.style.background = 'linear-gradient(135deg, #dc2626, #991b1b)';
      } catch (err) {
        alert('Không thể bắt đầu ghi âm cuộc gọi: ' + err.message);
      }
    } else {
      const res = await this.voiceCallRecorder.stopAndDownload(this.selectedIncidentId || 'VOICE');
      if (badge) badge.style.display = 'none';
      if (icon) icon.textContent = '🔴';
      if (text) text.textContent = 'BẮT ĐẦU GHI ÂM (2 BÊN)';
      if (btn) btn.style.background = 'linear-gradient(135deg, #ef4444, #b91c1c)';
      if (hint) hint.style.display = 'flex';

      if (res && res.success) {
        this.showFloatingToast(`✓ Đã tải tệp MP3 "${res.filename}" (${Math.round(res.size / 1024)} KB). Dữ liệu ghi âm đã tự hủy khỏi bộ nhớ (Tuân thủ NĐ 13/2023/NĐ-CP).`);
      }
    }
  }

  toggleVoiceCallMic() {
    if (this.voiceCallRecorder && this.voiceCallRecorder.localStream) {
      const audioTrack = this.voiceCallRecorder.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const btnMic = document.getElementById('btnToggleVoiceMic');
        if (btnMic) {
          btnMic.innerHTML = audioTrack.enabled ? '<span>🎤</span> Bật/Tắt Mic' : '<span>🔇</span> Mic Đã Tắt';
          btnMic.style.color = audioTrack.enabled ? '#34d399' : '#f87171';
        }
      }
    }
  }

  endDispatcherVoiceCall(notify = true) {
    const modal = document.getElementById('dispatcherVoiceCallModal');
    if (modal) {
      modal.classList.remove('is-open');
      modal.style.display = 'none';
    }

    if (this._voiceCallTimerInterval) {
      clearInterval(this._voiceCallTimerInterval);
      this._voiceCallTimerInterval = null;
    }

    if (this.voiceCallRecorder && this.voiceCallRecorder.isRecording) {
      this.voiceCallRecorder.stopAndDownload(this.selectedIncidentId || 'VOICE');
    } else if (this.voiceCallRecorder) {
      this.voiceCallRecorder.destroyAudioPipeline();
    }

    const badge = document.getElementById('voiceCallRecBadge');
    if (badge) badge.style.display = 'none';
    const text = document.getElementById('btnActionRecordVoiceText');
    if (text) text.textContent = 'BẮT ĐẦU GHI ÂM (2 BÊN)';
    const icon = document.getElementById('btnActionRecordVoiceIcon');
    if (icon) icon.textContent = '🔴';
    const btn = document.getElementById('btnActionRecordVoiceCall');
    if (btn) btn.style.background = 'linear-gradient(135deg, #ef4444, #b91c1c)';

    if (notify && this.selectedIncidentId) {
      fetch('/api/sos/videocall/signal', {
        method: 'POST',
        credentials: 'same-origin',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ id: this.selectedIncidentId, action: 'end', sender: 'dispatcher', callType: 'voice', token: this.currentOfficer?.token })
      }).catch(() => {});
    }
  }

  // Floating Toast Notification for download/privacy alerts
  showFloatingToast(message) {
    let toast = document.getElementById('callAudioPrivacyToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'callAudioPrivacyToast';
      toast.style.cssText = `
        position: fixed;
        bottom: 28px;
        right: 28px;
        z-index: 100020;
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(14px);
        color: #f8fafc;
        border: 1.5px solid #10b981;
        border-radius: 12px;
        padding: 12px 20px;
        box-shadow: 0 10px 35px rgba(0, 0, 0, 0.7);
        font-size: 12.5px;
        line-height: 1.45;
        max-width: 420px;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: all 0.3s ease;
      `;
      document.body.appendChild(toast);
    }

    toast.innerHTML = `
      <div style="font-size: 22px; flex-shrink: 0;">🛡️</div>
      <div style="flex: 1; color: #cbd5e1;">${message}</div>
    `;
    toast.style.display = 'flex';
    toast.style.opacity = '1';

    if (this._floatingToastTimer) clearTimeout(this._floatingToastTimer);
    this._floatingToastTimer = setTimeout(() => {
      if (toast) {
        toast.style.opacity = '0';
        setTimeout(() => { toast.style.display = 'none'; }, 300);
      }
    }, 5500);
  }


  initMap() {
    this.mapController = new MapController('dispatcherMap');
    const isMobile = window.innerWidth <= 768;
    const defaultCenter = [107.0, 16.2];
    const defaultZoom = isMobile ? 4.85 : 5.2;
    this.mapController.init(defaultCenter, defaultZoom);
    // Sync visibility state from localStorage (MapController already reads it in constructor)
    this.allWardsVisible = this.mapController.allWardsVisible;

    if (this.mapController.map) {
      this.mapController.map.on('load', () => {
        this.mapController.loadAllStationsMarkers(this.selectedStationRegion || 'all');
        
        // Auto-locate dispatcher's real position on startup & update header widget
        this.autoLocateCurrentPosition(false);

        // Initialize interactive all-wards layer with hover and click support
        this.mapController.initAllWardsLayer(
          (clickedFeature) => {
            if (clickedFeature && clickedFeature.properties) {
              selectAndHighlightWard(clickedFeature.properties);
            }
          },
          (hoveredFeature) => {
            // Preview in HUD if HUD not explicitly pinned
          }
        ).then(() => {
          // After layer is ready, sync the button UI state with localStorage
          const btnNet = document.getElementById('btnToggleAllWardsNetwork');
          if (btnNet) {
            btnNet.style.background = this.allWardsVisible ? 'rgba(234, 179, 8, 0.4)' : 'rgba(234, 179, 8, 0.15)';
            btnNet.innerHTML = this.allWardsVisible
              ? '<span>👁️</span> Đang Hiện Lưới Xã'
              : '<span>🌐</span> Lưới Toàn Xã/Phường';
          }
        });
      });
    }

    // Geofence 2-Tier Cascading Selector & Instant Search on Tactical Map
    const selectProvince = document.getElementById('selectMapProvince');
    const selectGeofence = document.getElementById('selectMapWardGeofence');
    const inputSearchGeofence = document.getElementById('inputSearchGeofence') || document.getElementById('inputSearchWardGeofence');
    const btnClearGeofence = document.getElementById('btnClearGeofenceHighlight');
    const btnToggleNetwork = document.getElementById('btnToggleAllWardsNetwork');
    const btnCloseHud = document.getElementById('btnCloseTacticalHud');
    const btnDispatchWard = document.getElementById('hudDispatchWardBtn');

    // Cache for ward list (lightweight, no geometry) - avoids re-fetching 157MB on every ward click
    let _wardListCache = null;
    const getWardList = async () => {
      if (_wardListCache && _wardListCache.length > 0) return _wardListCache;
      try {
        const res = await fetch('/api/geo/ward-list');
        if (res.ok) {
          const data = await res.json();
          if (data.ok && Array.isArray(data.list) && data.list.length > 0) {
            _wardListCache = data.list;
            return _wardListCache;
          }
        }
      } catch (e) {
        console.warn('Fast ward-list fetch failed, attempting fallback...', e);
      }

      // Fallback: extract list from /api/geo/all-wards
      try {
        const res = await fetch('/api/geo/all-wards');
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.boundaries?.features) {
            _wardListCache = data.boundaries.features.map(f => ({
              id: f.properties.id,
              ward: f.properties.ward,
              province: f.properties.province,
              unitType: f.properties.unitType,
              center: f.properties.center
            }));
            return _wardListCache;
          }
        }
      } catch (e) {
        console.error('All-wards fallback fetch failed:', e);
      }

      return _wardListCache || [];
    };

    // Populate Level-1 Selector (34 Tỉnh Thành) & Custom Bubble Popovers
    const dockProvincePillWrap = document.getElementById('dockProvincePillWrap');
    const dockProvinceLabel = document.getElementById('dockProvinceLabel');
    const provinceBubblePopover = document.getElementById('provinceBubblePopover');
    const inputFilterProvinces = document.getElementById('inputFilterProvinces');
    const btnCloseProvincePopover = document.getElementById('btnCloseProvincePopover');
    const provinceBubblesContainer = document.getElementById('provinceBubblesContainer');

    const dockWardPillWrap = document.getElementById('dockWardPillWrap');
    const wardBubblePopover = document.getElementById('wardBubblePopover');
    const wardPopoverTitle = document.getElementById('wardPopoverTitle');
    const btnCloseWardPopover = document.getElementById('btnCloseWardPopover');
    const wardResultsContainer = document.getElementById('wardResultsContainer');
    const btnToggleWardPopover = document.getElementById('btnToggleWardPopover');

    const STATIC_34_PROVINCES = [
      { name: 'Hà Nội', region: 'city', center: [105.7366, 21.0264], count: 126 },
      { name: 'TP. Hồ Chí Minh', region: 'city', center: [106.6378, 11.1636], count: 168 },
      { name: 'Cần Thơ', region: 'city', center: [105.7978, 9.6796], count: 103 },
      { name: 'Đà Nẵng', region: 'city', center: [108.0145, 15.6291], count: 93 },
      { name: 'Hải Phòng', region: 'city', center: [106.5697, 20.8289], count: 112 },
      { name: 'Huế', region: 'city', center: [107.4614, 16.3564], count: 88 },
      { name: 'An Giang', region: 'south', center: [105.1328, 10.4562], count: 102 },
      { name: 'Bắc Ninh', region: 'north', center: [106.6646, 21.3684], count: 96 },
      { name: 'Cà Mau', region: 'south', center: [105.1187, 9.1283], count: 90 },
      { name: 'Cao Bằng', region: 'north', center: [106.3879, 22.6389], count: 85 },
      { name: 'Đắk Lắk', region: 'south', center: [108.3423, 12.6785], count: 110 },
      { name: 'Điện Biên', region: 'north', center: [103.2649, 21.7210], count: 82 },
      { name: 'Đồng Nai', region: 'south', center: [106.9685, 11.7534], count: 115 },
      { name: 'Đồng Tháp', region: 'south', center: [105.7638, 10.4182], count: 98 },
      { name: 'Gia Lai', region: 'south', center: [108.3493, 13.8614], count: 95 },
      { name: 'Hà Tĩnh', region: 'central', center: [105.7279, 18.2950], count: 97 },
      { name: 'Hưng Yên', region: 'north', center: [106.3568, 20.5170], count: 89 },
      { name: 'Khánh Hòa', region: 'central', center: [108.9541, 12.0739], count: 94 },
      { name: 'Lai Châu', region: 'north', center: [103.3372, 22.3855], count: 80 },
      { name: 'Lâm Đồng', region: 'south', center: [108.0112, 11.6433], count: 92 },
      { name: 'Lạng Sơn', region: 'north', center: [106.4085, 21.9444], count: 87 },
      { name: 'Lào Cai', region: 'north', center: [104.6286, 21.8377], count: 86 },
      { name: 'Nghệ An', region: 'central', center: [104.8985, 19.2503], count: 120 },
      { name: 'Ninh Bình', region: 'central', center: [106.0323, 20.2938], count: 88 },
      { name: 'Phú Thọ', region: 'north', center: [105.2858, 20.7586], count: 91 },
      { name: 'Quảng Ngãi', region: 'central', center: [107.9101, 14.6491], count: 95 },
      { name: 'Quảng Ninh', region: 'north', center: [107.1728, 21.1741], count: 105 },
      { name: 'Quảng Trị', region: 'central', center: [106.8542, 16.8527], count: 84 },
      { name: 'Sơn La', region: 'north', center: [103.8388, 21.2905], count: 89 },
      { name: 'Tây Ninh', region: 'south', center: [106.1360, 11.4883], count: 90 },
      { name: 'Thái Nguyên', region: 'north', center: [105.8080, 22.1925], count: 94 },
      { name: 'Thanh Hóa', region: 'central', center: [105.5454, 19.8841], count: 125 },
      { name: 'Tuyên Quang', region: 'north', center: [105.1058, 22.4937], count: 83 },
      { name: 'Vĩnh Long', region: 'south', center: [106.2460, 10.0142], count: 89 }
    ];

    let _allProvincesData = STATIC_34_PROVINCES;
    let _activeProvinceFilterReg = 'all';
    let _selectedProvinceName = '';

    const applyProvinceCatalogCopy = (total) => {
      const countText = `${total} TỈNH`;
      document.querySelectorAll('.national-badge-sub').forEach(el => { el.textContent = countText; });
      const title = document.querySelector('#provinceBubblePopover .popover-title');
      if (title) title.innerHTML = title.innerHTML.replace(/\d+\s*TỈNH\s*&\s*THÀNH\s*PHỐ/iu, `${total} TỈNH & THÀNH PHỐ`);
      if (dockProvinceLabel && /^--\s*Chọn\s+\d+\s+Tỉnh/iu.test(dockProvinceLabel.textContent || '')) {
        dockProvinceLabel.textContent = `-- Chọn ${total} Tỉnh / TP --`;
      }
      const mapPill = document.getElementById('statNationalMapPill');
      if (mapPill) {
        const currentTitle = mapPill.getAttribute('title') || '';
        mapPill.setAttribute('title', currentTitle.replace(/\d+\s*Tỉnh\s*thành/iu, `${total} Tỉnh thành`));
      }
    };

    const renderProvinceBubbles = (searchTerm = '') => {
      if (!provinceBubblesContainer) return;
      provinceBubblesContainer.innerHTML = '';

      const cleanSearch = (searchTerm || '').toLowerCase().trim();
      const filtered = _allProvincesData.filter(item => {
        const matchesReg = _activeProvinceFilterReg === 'all' || 
          (_activeProvinceFilterReg === 'city' && item.region === 'city') ||
          item.region === _activeProvinceFilterReg;
        const matchesSearch = !cleanSearch || item.name.toLowerCase().includes(cleanSearch);
        return matchesReg && matchesSearch;
      });

      if (filtered.length === 0) {
        provinceBubblesContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #94a3b8; font-size: 11px; padding: 20px;">Không tìm thấy tỉnh thành phù hợp</div>';
        return;
      }

      filtered.forEach(item => {
        const pill = document.createElement('div');
        pill.className = `province-bubble-pill ${_selectedProvinceName === item.name ? 'is-selected' : ''}`;

        let icon = '📍';
        if (item.name === 'Hà Nội') icon = '🏛️';
        else if (item.name === 'TP. Hồ Chí Minh') icon = '🏙️';
        else if (item.name === 'Cần Thơ') icon = '🌊';
        else if (item.name === 'Đà Nẵng') icon = '🏖️';
        else if (item.name === 'Hải Phòng') icon = '⚓';
        else if (item.name === 'Huế') icon = '🌸';
        else if (['Khánh Hòa', 'Quảng Ninh'].includes(item.name)) icon = '🏝️';
        else if (['Lâm Đồng', 'Đắk Lắk', 'Gia Lai'].includes(item.name)) icon = '🌲';

        pill.innerHTML = `
          <div class="province-bubble-name">
            <span>${icon}</span>
            <span>${item.name}</span>
          </div>
          <span class="province-bubble-count">${item.count} ĐV</span>
        `;

        pill.addEventListener('click', (e) => {
          e.stopPropagation();
          _selectedProvinceName = item.name;
          this.selectedProvinceName = item.name;
          if (dockProvinceLabel) {
            dockProvinceLabel.textContent = item.name;
          }
          const dockWardLabel = document.getElementById('dockWardLabel');
          if (dockWardLabel) {
            dockWardLabel.textContent = `-- Chọn Xã/Phường (${item.name}) --`;
          }
          if (provinceBubblePopover) provinceBubblePopover.style.display = 'none';

          // Clear any previous ward boundary & HUD when selecting new province
          this.currentSelectedWard = null;
          if (this.mapController) {
            this.mapController.clearWardBoundary();
          }
          this.hideWardHud();

          // Update toggle grid label
          const labelToggleAreaGrid = document.getElementById('labelToggleAreaGrid');
          if (labelToggleAreaGrid) labelToggleAreaGrid.textContent = 'Đang Hiện Lưới Tỉnh';

          // Fly map smoothly to province center
          if (this.mapController && this.mapController.map && item.center) {
            this.mapController.map.flyTo({
              center: item.center,
              zoom: item.region === 'city' ? 12 : 11,
              duration: 1200
            });
          }

          // Highlight province boundary
          if (this.mapController) {
            this.mapController.highlightProvinceBoundary(item.name);
            this.mapController.loadAllStationsMarkers(item.name);
          }

          // Show clear button
          const btnClear = document.getElementById('btnClearGeofenceHighlight');
          if (btnClear) btnClear.style.display = 'inline-flex';

          // Prepare wards of this province in background
          if (this.renderWardResults) {
            this.renderWardResults('', item.name);
            const wardBubblePopover = document.getElementById('wardBubblePopover');
            const wardPopoverTitle = document.getElementById('wardPopoverTitle');
            if (wardBubblePopover) wardBubblePopover.style.display = 'none';
            if (wardPopoverTitle) wardPopoverTitle.textContent = `📍 XÃ / PHƯỜNG TRỰC THUỘC ${item.name.toUpperCase()}`;
            const inputSearchGeofence = document.getElementById('inputSearchGeofence');
            if (inputSearchGeofence) {
              inputSearchGeofence.value = '';
              inputSearchGeofence.placeholder = `🔍 Tìm xã/phường tại ${item.name}...`;
            }
          }
        });

        provinceBubblesContainer.appendChild(pill);
      });
    };

    const loadProvinceCatalogFromMap = async () => {
      try {
        const response = await fetch('/api/geo/provinces', { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok || !payload.ok || !Array.isArray(payload.provinces) || payload.provinces.length === 0) return;
        const fallbackByName = new Map(STATIC_34_PROVINCES.map(item => [item.name, item]));
        _allProvincesData = payload.provinces.map(item => {
          const fallback = fallbackByName.get(item.name) || {};
          return {
            name: item.name,
            center: Array.isArray(item.center) ? item.center : fallback.center,
            region: fallback.region || 'all',
            count: Number.isFinite(item.wardCount) ? item.wardCount : (fallback.count || 0)
          };
        });
        applyProvinceCatalogCopy(_allProvincesData.length);
        renderProvinceBubbles(inputFilterProvinces?.value || '');
        if (!payload.isConsistent) console.warn('Province index differs from boundary map:', payload.differences);
      } catch (error) {
        console.warn('Could not load province catalog from boundary map:', error);
      }
    };

    const renderWardResults = async (query = '', specificProvince = null) => {
      if (!wardResultsContainer) return;
      wardResultsContainer.innerHTML = '<div style="color: #94a3b8; font-size: 11px; text-align: center; padding: 15px;">⏳ Đang nạp danh sách xã/phường...</div>';

      const list = await getWardList();
      const cleanQ = (query || '').toLowerCase().trim();
      const provFilter = specificProvince || _selectedProvinceName;

      let filtered = list;
      if (provFilter) {
        filtered = filtered.filter(w => (w.province || '').toLowerCase() === provFilter.toLowerCase());
      }
      if (cleanQ) {
        filtered = filtered.filter(w => {
          const wName = (w.ward || '').toLowerCase();
          const pName = (w.province || '').toLowerCase();
          const merged = (w.sapNhapTu || '').toLowerCase();
          return wName.includes(cleanQ) || pName.includes(cleanQ) || merged.includes(cleanQ);
        });
      }

      wardResultsContainer.innerHTML = '';
      if (filtered.length === 0) {
        wardResultsContainer.innerHTML = '<div style="color: #94a3b8; font-size: 11px; text-align: center; padding: 20px;">Không tìm thấy xã/phường nào phù hợp</div>';
        return;
      }

      // Show first 80 results for high performance
      filtered.slice(0, 80).forEach(w => {
        const card = document.createElement('div');
        card.className = 'ward-result-card';
        card.innerHTML = `
          <div style="flex: 1; padding-right: 8px;">
            <div class="ward-result-name" style="font-weight: 800; font-size: 12px; color: #f8fafc; margin-bottom: 2px;">📍 ${w.ward} <span style="font-size: 10px; color: #38bdf8; font-weight: normal;">(${w.unitType || 'Xã/Phường'})</span></div>
            <div class="ward-result-sub" style="font-size: 10.5px; color: #94a3b8; line-height: 1.35;">🏛️ ${w.province} ${w.sapNhapTu ? '<br><span style="color: #cbd5e1; font-size: 9.5px;">🔄 ' + w.sapNhapTu + '</span>' : ''}</div>
          </div>
          <span style="font-size: 10px; color: #facc15; font-weight: 800; background: rgba(250,204,21,0.15); border: 1px solid rgba(250,204,21,0.3); padding: 4px 8px; border-radius: 8px; white-space: nowrap;">Khoanh Vùng ↗</span>
        `;

        card.addEventListener('click', (e) => {
          e.stopPropagation();
          if (wardBubblePopover) wardBubblePopover.style.display = 'none';
          if (inputSearchGeofence) inputSearchGeofence.value = `${w.ward} (${w.province})`;
          selectAndHighlightWard(w);
        });

        wardResultsContainer.appendChild(card);
      });
    };

    // Toggle Province Popover Click
    if (dockProvincePillWrap) {
      dockProvincePillWrap.addEventListener('click', (e) => {
        this.toggleProvinceBubblePopover(e);
      });
    }

    if (btnCloseProvincePopover) {
      btnCloseProvincePopover.addEventListener('click', (e) => {
        this.closeProvinceBubblePopover(e);
      });
    }

    if (inputFilterProvinces) {
      inputFilterProvinces.addEventListener('input', (e) => {
        e.stopPropagation();
        renderProvinceBubbles(inputFilterProvinces.value);
      });
    }

    // Filter Tabs
    const popoverTabBtns = document.querySelectorAll('.popover-tab-btn');
    popoverTabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        popoverTabBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        _activeProvinceFilterReg = btn.dataset.reg || 'all';
        renderProvinceBubbles(inputFilterProvinces?.value || '');
      });
    });

    // Level-2: Ward Popover Trigger
    if (dockWardPillWrap) {
      dockWardPillWrap.addEventListener('click', (e) => {
        this.toggleWardBubblePopover(e);
      });
    }

    // Ward Search Popover input
    if (inputSearchGeofence) {
      inputSearchGeofence.addEventListener('input', () => {
        if (wardBubblePopover) wardBubblePopover.style.display = 'flex';
        renderWardResults(inputSearchGeofence.value, this.selectedProvinceName || _selectedProvinceName);
      });
    }

    if (btnCloseWardPopover) {
      btnCloseWardPopover.addEventListener('click', (e) => {
        this.closeWardBubblePopover(e);
      });
    }

    // Button: Toggle Selected Area Boundary
    const btnToggleAreaGrid = document.getElementById('btnToggleSelectedAreaGrid');
    if (btnToggleAreaGrid) {
      btnToggleAreaGrid.addEventListener('click', (e) => {
        this.toggleSelectedAreaBoundary(e);
      });
    }

    // Button: Clear Geofence
    if (btnClearGeofence) {
      btnClearGeofence.addEventListener('click', (e) => {
        this.clearGeofenceHighlight(e);
      });
    }

    // Button: Minimize Geofence Bar
    const btnMinBar = document.getElementById('btnMinimizeGeofenceBar');
    if (btnMinBar) {
      btnMinBar.addEventListener('click', (e) => {
        this.minimizeGeofenceBar(e);
      });
    }

    // Floating Bubble Trigger to expand Geofence Bar
    const bubbleTrigger = document.getElementById('tacticalGeofenceBubbleTrigger');
    if (bubbleTrigger) {
      bubbleTrigger.addEventListener('click', (e) => {
        this.expandGeofenceBar(e);
      });
    }

    // Close popovers when clicking outside
    document.addEventListener('click', (e) => {
      if (provinceBubblePopover && !e.target.closest('#dockProvincePillWrap') && !e.target.closest('#provinceBubblePopover')) {
        provinceBubblePopover.style.display = 'none';
      }
      if (wardBubblePopover && !e.target.closest('#dockWardPillWrap') && !e.target.closest('#wardBubblePopover')) {
        wardBubblePopover.style.display = 'none';
      }
      const mapStyleDropdown = document.getElementById('mapStyleCustomDropdown');
      if (mapStyleDropdown && !e.target.closest('#mapStyleSelectorPill')) {
        mapStyleDropdown.style.display = 'none';
      }
    });

    this.renderProvinceBubbles = renderProvinceBubbles;
    this.renderWardResults = renderWardResults;
    renderProvinceBubbles('');
    loadProvinceCatalogFromMap();

    // Background preload of ward list
    getWardList().then(list => {
      if (list && list.length > 0) {
        console.log(`✅ Loaded ${list.length} wards metadata smoothly.`);
      }
    });

    // Core function to highlight ward on map and display HUD
    const selectAndHighlightWard = async (wardIdOrObj) => {
      if (!wardIdOrObj) {
        this.currentSelectedWard = null;
        if (this.mapController) this.mapController.clearWardBoundary();
        this.hideWardHud();
        return;
      }
      try {
        let matchItem = null;
        if (typeof wardIdOrObj === 'object' && wardIdOrObj.ward) {
          matchItem = wardIdOrObj;
        } else {
          const list = await getWardList();
          const targetStr = String(wardIdOrObj).trim();
          const lowerQ = targetStr.toLowerCase();
          matchItem = list.find(item => item.id === targetStr) ||
                      list.find(item => `${item.ward} (${item.province})`.toLowerCase() === lowerQ) ||
                      list.find(item => (item.ward || '').toLowerCase() === lowerQ) ||
                      list.find(item => (item.ward || '').toLowerCase().includes(lowerQ));
        }

        if (matchItem) {
          this.currentSelectedWard = matchItem;
          const dockWardLabel = document.getElementById('dockWardLabel');
          if (dockWardLabel) dockWardLabel.textContent = matchItem.ward;

          // Sync province state if known
          if (matchItem.province) {
            _selectedProvinceName = matchItem.province;
            this.selectedProvinceName = matchItem.province;
            const dockProvinceLabel = document.getElementById('dockProvinceLabel');
            if (dockProvinceLabel) {
              dockProvinceLabel.textContent = matchItem.province;
            }
          }

          const center = matchItem.center;
          if (center && center.length === 2 && this.mapController && this.mapController.map) {
            // 1. Clear province highlight so it doesn't obscure the ward
            this.mapController.highlightProvinceBoundary(null);

            // 2. Fly smoothly to ward centroid
            this.mapController.map.stop();
            this.mapController.map.flyTo({
              center: [center[0], center[1]],
              zoom: 14.5,
              pitch: 20,
              duration: 800
            });
          }

          // 3. Show clear button
          const btnClear = document.getElementById('btnClearGeofenceHighlight');
          if (btnClear) btnClear.style.display = 'inline-flex';

          // 4. Update area grid button label
          const labelToggleAreaGrid = document.getElementById('labelToggleAreaGrid');
          if (labelToggleAreaGrid) labelToggleAreaGrid.textContent = 'Đang Hiện Lưới Địa Bàn';

          // 5. Instantly show preliminary HUD with ward data (0ms delay)
          const fakeFeature = { type: 'Feature', properties: matchItem, geometry: null };
          this.showWardHud(fakeFeature);

          // 6. Fetch exact boundary polygon with id, ward, province parameters
          const qParams = new URLSearchParams();
          if (matchItem.id) qParams.set('id', matchItem.id);
          if (matchItem.ward) qParams.set('ward', matchItem.ward);
          if (matchItem.province) qParams.set('province', matchItem.province);
          if (center && center.length === 2) {
            qParams.set('lat', center[1]);
            qParams.set('lng', center[0]);
          }
          qParams.set('address', `${matchItem.ward}, ${matchItem.province || ''}`);

          try {
            const geoRes = await fetch(`/api/geo/locate-ward?${qParams.toString()}`);
            const geoData = await geoRes.json();
            if (geoData.ok && geoData.boundary) {
              if (this.mapController) {
                this.mapController.highlightWardBoundary(geoData.boundary, { color: '#facc15' });
              }
              this.showWardHud(geoData.boundary);
            }
          } catch (netErr) {
            console.warn('Could not load detailed boundary polygon:', netErr);
          }
        }
      } catch (e) {
        console.warn('Geofence selection error:', e);
      }
    };
    this.selectAndHighlightWard = selectAndHighlightWard;

    // Toggle All Wards Network Grid button
    if (btnToggleNetwork) {
      btnToggleNetwork.addEventListener('click', (e) => {
        this.toggleAllWardsGrid(e);
      });
    }

    // Clear Geofence Selection Button -> Resets everything and hides level-2 selector
    if (btnClearGeofence) {
      btnClearGeofence.addEventListener('click', () => {
        _selectedProvinceName = '';
        this.selectedProvinceName = '';
        this.currentSelectedWard = null;
        if (dockProvinceLabel) dockProvinceLabel.textContent = '-- Chọn Tỉnh / TP --';
        const dockWardLabel = document.getElementById('dockWardLabel');
        if (dockWardLabel) dockWardLabel.textContent = '-- Chọn Xã / Phường --';
        if (inputSearchGeofence) inputSearchGeofence.value = '';
        if (this.mapController) {
          this.mapController.clearWardBoundary();
          this.mapController.highlightProvinceBoundary(null);
        }
        this.hideWardHud();
        btnClearGeofence.style.display = 'none';
      });
    }

    if (btnCloseHud) {
      btnCloseHud.addEventListener('click', () => {
        this.hideWardHud();
      });
    }

    const btnMinHud = document.getElementById('btnMinimizeTacticalHud');
    if (btnMinHud) {
      btnMinHud.addEventListener('click', () => {
        const hud = document.getElementById('tacticalWardGeofenceHud');
        if (!hud) return;
        hud.classList.toggle('is-minimized');
        const icon = document.getElementById('hudMinimizeIcon');
        if (icon) icon.textContent = hud.classList.contains('is-minimized') ? '▸' : '▾';
      });
    }

    if (btnDispatchWard) {
      btnDispatchWard.addEventListener('click', () => {
        alert('🚀 [LỆNH ĐIỀU ĐỘNG] Đã phát tín hiệu yêu cầu kíp trực ban Công An địa bàn xuất quân tuần tra / ứng trực tác chiến!');
      });
    }

    // Admin Pin Station on Map Actions
    const btnAdminAddStationOnMap = document.getElementById('btnAdminAddStationOnMap');
    if (btnAdminAddStationOnMap) {
      btnAdminAddStationOnMap.addEventListener('click', () => {
        alert('📍 [CHẾ ĐỘ GHIM ĐỒN/CƠ QUAN] Hãy nhấp chuột vào vị trí bất kỳ trên bản đồ để đặt tọa độ trụ sở mới!');
        if (this.mapController) {
          this.mapController.enableAdminAddStationMode((pos) => {
            const latInput = document.getElementById('inputNewStationLat');
            const lngInput = document.getElementById('inputNewStationLng');
            const addrInput = document.getElementById('inputNewStationAddress');
            const wardInput = document.getElementById('inputNewStationWard');

            if (latInput) latInput.value = pos.lat;
            if (lngInput) lngInput.value = pos.lng;
            if (addrInput && pos.address) addrInput.value = pos.address;
            if (wardInput && pos.address) {
              const parts = pos.address.split(',');
              wardInput.value = parts[0]?.trim() || '';
            }

            if (modalAdminAddStation) modalAdminAddStation.style.display = 'block';
          });
        }
      });
    }

    const closeAdminStationModal = () => {
      if (modalAdminAddStation) modalAdminAddStation.style.display = 'none';
      if (this.mapController) this.mapController.disableAdminAddStationMode();
    };

    if (btnCloseAdminAddStationModal) btnCloseAdminAddStationModal.addEventListener('click', closeAdminStationModal);
    if (btnCancelNewStation) btnCancelNewStation.addEventListener('click', closeAdminStationModal);

    if (btnSaveNewStation) {
      btnSaveNewStation.addEventListener('click', async () => {
        const name = document.getElementById('inputNewStationName')?.value.trim();
        const agency = document.getElementById('selectNewStationAgency')?.value || 'police';
        const ward = document.getElementById('inputNewStationWard')?.value.trim() || 'Xã Thuận Hòa';
        const address = document.getElementById('inputNewStationAddress')?.value.trim() || `Trụ sở ${name}`;
        const phone = document.getElementById('inputNewStationPhone')?.value.trim() || '0292 3899 113';
        const officer = document.getElementById('inputNewStationOfficer')?.value.trim() || 'Trưởng Đơn Vị';
        const lat = parseFloat(document.getElementById('inputNewStationLat')?.value);
        const lng = parseFloat(document.getElementById('inputNewStationLng')?.value);

        if (!name || isNaN(lat) || isNaN(lng)) {
          alert('Vui lòng nhập đầy đủ tên trụ sở và chọn tọa độ GPS trên map!');
          return;
        }

        try {
          const res = await fetch('/api/stations/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              agency,
              ward,
              province: 'Cần Thơ',
              address,
              phone,
              sms: '0988 113 113',
              officer,
              lat,
              lng
            })
          });
          const data = await res.json();
          if (data.ok) {
            alert(`✅ Đã ghim và thêm thành công "${name}" lên bản đồ!\n${data.account ? `🔑 Tài khoản trực ban tự động: ${data.account.username} / ${data.account.password}` : ''}`);
            closeAdminStationModal();
            if (this.mapController) this.mapController.reloadStationsMarkers();
            await this.loadStationsDirectory();
            this.renderStationsDirectory();
            if (this.loadAccountsList) this.loadAccountsList();
          } else {
            alert('Lỗi: ' + (data.error || 'Không thể tạo trụ sở'));
          }
        } catch (e) {
          alert('Lỗi kết nối máy chủ khi tạo trụ sở');
        }
      });
    }
  }

  showWardHud(boundaryFeature, overrideStation = null) {
    const hud = document.getElementById('tacticalWardGeofenceHud');
    if (!hud || !boundaryFeature || !boundaryFeature.properties) return;
    const props = boundaryFeature.properties;

    const nameEl = document.getElementById('hudWardName');
    const provEl = document.getElementById('hudWardProvince');
    const sapNhapEl = document.getElementById('hudWardSapNhap');
    const adminCenterEl = document.getElementById('hudWardAdminCenter');
    const dienTichEl = document.getElementById('hudWardDienTich');
    const danSoEl = document.getElementById('hudWardDanSo');
    const maDVHCEl = document.getElementById('hudWardMaDVHC');
    const canCuEl = document.getElementById('hudWardCanCu');

    const polEl = document.getElementById('hudWardPolice');
    const phEl = document.getElementById('hudWardPhone');
    const phLink = document.getElementById('hudWardPhoneLink');
    const smsEl = document.getElementById('hudWardSms');
    const offEl = document.getElementById('hudWardOfficer');

    if (nameEl) nameEl.textContent = props.ward || 'XÃ / PHƯỜNG QUẢN LÝ';
    const provName = props.province || 'Cần Thơ';
    const provFormatted = provName.startsWith('TP.') || provName.startsWith('Thủ đô') || provName.startsWith('Tỉnh') || provName.startsWith('Thành phố')
      ? provName
      : (['Hà Nội'].includes(provName) ? `Thủ đô ${provName}`
        : ['Đà Nẵng', 'Hải Phòng', 'Huế', 'Cần Thơ', 'Đồng Nai'].includes(provName) ? `Thành phố ${provName}`
        : ['TP. Hồ Chí Minh'].includes(provName) ? provName : `Tỉnh ${provName}`);
    if (provEl) provEl.textContent = `(${provFormatted})`;
    if (this.mapController && typeof this.mapController.showWardStationPin === 'function') {
      this.mapController.showWardStationPin(boundaryFeature, overrideStation);
    }
    if (sapNhapEl) sapNhapEl.textContent = props.sapNhapTu || `${props.ward} (giữ nguyên)`;
    if (adminCenterEl) adminCenterEl.textContent = props.trungTamHanhChinh || props.address || `UBND ${props.ward}`;
    if (dienTichEl) dienTichEl.textContent = props.dienTich || '45,86 (km²)';
    if (danSoEl) danSoEl.textContent = props.danSo || '29.846 (người)';
    if (maDVHCEl) maDVHCEl.textContent = props.maDVHC || '31582';
    if (canCuEl) canCuEl.textContent = props.canCu || 'Nghị quyết số 1668/NQ-UBTVQH15';

    // Look up real police station from directory / current officer profile / override
    let matchedSt = overrideStation || null;
    const targetWard = (props.ward || '').toLowerCase().trim();
    const cleanTargetWard = targetWard.replace(/^(phuong|xa|thi tran|p\.|x\.|tt\.)\s*/i, '').trim();

    if (!matchedSt && this.currentOfficer && this.currentOfficer.ward && this.currentOfficer.ward.toLowerCase().trim() === targetWard) {
      matchedSt = {
        name: this.currentOfficer.agencyName || this.currentOfficer.unitName || ('Công An ' + props.ward),
        phone: this.currentOfficer.officerPhone || '0292 389 7113',
        sms: this.currentOfficer.officerSms || '0988 113 113',
        officer: this.currentOfficer.officerTitle || this.currentOfficer.officerName || 'Trực ban CAX/CAP',
        address: this.currentOfficer.address || ('Trụ sở Công An ' + props.ward)
      };
    } else if (!matchedSt && this.stationsDirectory?.stations?.length && targetWard) {
      matchedSt = this.stationsDirectory.stations.find(st => {
        const isPol = st.agency === 'police' || !st.agency;
        if (!isPol) return false;
        const stW = (st.ward || '').toLowerCase().trim();
        const cleanStW = stW.replace(/^(phuong|xa|thi tran|p\.|x\.|tt\.)\s*/i, '').trim();
        return (stW === targetWard || cleanStW === cleanTargetWard) || (st.name && st.name.toLowerCase().includes(cleanTargetWard));
      });
    }

    const isInvalidVal = (val) => !val || String(val).toLowerCase().includes('cập nhật');

    const resolvedPolice = (!isInvalidVal(props.police) && !props.police.includes('Khu Vực'))
      ? props.police 
      : (matchedSt?.name || `Công An ${props.ward || 'Phường/Xã'}`);

    const resolvedPhone = (!isInvalidVal(props.phone) && props.phone !== '0292 3899 113')
      ? props.phone 
      : (!isInvalidVal(matchedSt?.phone) ? matchedSt.phone : '0292 389 7113');

    const resolvedSms = !isInvalidVal(props.sms) 
      ? props.sms 
      : (!isInvalidVal(matchedSt?.sms) ? matchedSt.sms : '0988 113 113');

    const resolvedOfficer = (!isInvalidVal(props.officer) && !props.officer.includes('CAX/CAP'))
      ? props.officer 
      : (!isInvalidVal(matchedSt?.officer) ? matchedSt.officer : 'Trực ban CAX/CAP');

    if (polEl) polEl.textContent = resolvedPolice;
    if (phEl) phEl.textContent = resolvedPhone;
    if (phLink) phLink.href = `tel:${resolvedPhone.replace(/\s+/g, '')}`;
    if (smsEl) smsEl.textContent = resolvedSms;
    if (offEl) offEl.textContent = resolvedOfficer;

    const gmapsCarBtn = document.getElementById('hudGmapsBtn');
    const gmapsMotoBtn = document.getElementById('hudGmapsMotoBtn');
    const center = props.center || (boundaryFeature.geometry?.coordinates?.[0]?.[0]);

    if (center) {
      if (gmapsCarBtn) gmapsCarBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${center[1]},${center[0]}&travelmode=driving`;
      if (gmapsMotoBtn) gmapsMotoBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${center[1]},${center[0]}&travelmode=two_wheeler`;
    } else {
      const q = encodeURIComponent((matchedSt?.name || props.police || props.ward) + ' ' + (props.province || 'Cần Thơ'));
      if (gmapsCarBtn) gmapsCarBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=driving`;
      if (gmapsMotoBtn) gmapsMotoBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=two_wheeler`;
    }

    hud.style.display = 'block';
  }

  
  showProvinceHud(station) {
    const hud = document.getElementById('tacticalWardGeofenceHud');
    if (!hud || !station) return;

    const nameEl = document.getElementById('hudWardName');
    const provEl = document.getElementById('hudWardProvince');
    const sapNhapEl = document.getElementById('hudWardSapNhap');
    const adminCenterEl = document.getElementById('hudWardAdminCenter');
    const dienTichEl = document.getElementById('hudWardDienTich');
    const danSoEl = document.getElementById('hudWardDanSo');
    const maDVHCEl = document.getElementById('hudWardMaDVHC');
    const canCuEl = document.getElementById('hudWardCanCu');

    const polEl = document.getElementById('hudWardPolice');
    const phEl = document.getElementById('hudWardPhone');
    const phLink = document.getElementById('hudWardPhoneLink');
    const smsEl = document.getElementById('hudWardSms');
    const offEl = document.getElementById('hudWardOfficer');

    const provName = station.province || 'Cần Thơ';
    const isSpecialCity = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Huế'].some(c => provName.includes(c));
    const title = provName.startsWith('TP.') || provName.startsWith('Thành phố') || provName.startsWith('Tỉnh') || provName.startsWith('Thủ đô')
      ? provName
      : (isSpecialCity ? `Thành phố ${provName}` : `Tỉnh ${provName}`);

    if (nameEl) nameEl.textContent = title;
    if (provEl) provEl.textContent = `(Địa Bàn Toàn ${isSpecialCity ? 'Thành Phố' : 'Tỉnh'})`;
    if (sapNhapEl) sapNhapEl.textContent = `Toàn bộ các quận/huyện, xã/phường thuộc ${title}`;
    if (adminCenterEl) adminCenterEl.textContent = station.address || `Trụ sở Bộ Chỉ Huy Công An ${title}`;
    if (dienTichEl) dienTichEl.textContent = 'Toàn Tỉnh / TP';
    if (danSoEl) danSoEl.textContent = 'Toàn Địa Bàn';
    if (maDVHCEl) maDVHCEl.textContent = `CATP-${provName.replace(/\s+/g, '')}`;
    if (canCuEl) canCuEl.textContent = 'Bộ Công An — Công An Tỉnh / Thành Phố Trực Thuộc Trung Ương';

    const resolvedPolice = station.name || `Công An ${title}`;
    const resolvedPhone = (station.phone && !station.phone.includes('cập nhật')) ? station.phone : '0292 382 2113';
    const resolvedSms = (station.sms && !station.sms.includes('cập nhật')) ? station.sms : '0988 113 113';
    const resolvedOfficer = (station.officer && !station.officer.includes('cập nhật')) ? station.officer : 'Chỉ huy Trực ban CATP';

    if (polEl) polEl.textContent = resolvedPolice;
    if (phEl) phEl.textContent = resolvedPhone;
    if (phLink) phLink.href = `tel:${resolvedPhone.replace(/\s+/g, '')}`;
    if (smsEl) smsEl.textContent = resolvedSms;
    if (offEl) offEl.textContent = resolvedOfficer;

    const gmapsCarBtn = document.getElementById('hudGmapsBtn');
    const gmapsMotoBtn = document.getElementById('hudGmapsMotoBtn');
    const lat = station.lat || station.stationLat;
    const lng = station.lng || station.stationLng;

    if (lat && lng) {
      if (gmapsCarBtn) gmapsCarBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
      if (gmapsMotoBtn) gmapsMotoBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=two_wheeler`;
    } else {
      const q = encodeURIComponent(resolvedPolice + ' ' + title);
      if (gmapsCarBtn) gmapsCarBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=driving`;
      if (gmapsMotoBtn) gmapsMotoBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=two_wheeler`;
    }

    hud.style.display = 'block';
  }

  hideWardHud() {
    const hud = document.getElementById('tacticalWardGeofenceHud');
    if (hud) hud.style.display = 'none';
  }

  clearActiveSelectionAndMap() {
    this.selectedIncidentId = null;
    this.incidents.clear();
    if (this.drawer) {
      this.drawer.classList.remove('open');
      this.drawer.style.display = 'none';
    }
    this.hideWardHud();
    if (this.mapController && this.mapController.markers) {
      if (this.mapController.markers.has('citizen')) {
        try { this.mapController.markers.get('citizen').remove(); } catch(e) {}
        this.mapController.markers.delete('citizen');
      }
    }
    this.renderQueue();
  }

  isIncidentActive(inc) {
    if (!inc) return false;
    const s = String(inc.status || '').toLowerCase().trim();
    if (s === 'resolved' || s === 'completed' || s === 'done' || s === 'closed' || s === 'fake_alarm') {
      return false;
    }
    return ['pending', 'dispatching', 'approaching', 'arrived', 'escalated'].includes(s);
  }

  isIncidentInTerritory(inc) {
    if (!inc) return false;
    if (!this.currentOfficer) return true;
    if (this.currentOfficer.level === 'national' || this.currentOfficer.username === 'admin' || this.currentOfficer.agency === 'all') {
      return true;
    }

    const norm = (str) => {
      if (!str || typeof str !== 'string') return '';
      return str.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .toLowerCase().trim();
    };

    const incProv = norm(inc.jurisdiction?.province || inc.assignedUnit?.province || inc.province || '');
    const myProv = norm(this.currentOfficer.province || '');

    if (this.currentOfficer.level === 'province') {
      if (!myProv || !incProv) return false;
      return incProv.includes(myProv) || myProv.includes(incProv);
    }

    if (this.currentOfficer.level === 'ward') {
      const myWard = norm(this.currentOfficer.ward || '');
      const myUnitName = norm(this.currentOfficer.unitName || this.currentOfficer.agencyName || '');

      if (!myWard && !myUnitName) return false;

      // 1. Kiểm tra tỉnh/thành nếu cả hai bên cùng có dữ liệu
      if (myProv && incProv) {
        if (!incProv.includes(myProv) && !myProv.includes(incProv)) {
          return false;
        }
      }

      // 2. Kiểm tra assignedUnit (đơn vị trực tiếp được giao thụ lý ca)
      const assignedName = norm(inc.assignedUnit?.name || inc.dispatchUnit?.unitName || inc.policeStation?.name || '');
      const assignedWard = norm(inc.assignedUnit?.ward || inc.dispatchUnit?.ward || inc.assignedUnit?.jurisdiction?.ward || '');

      if (myUnitName && assignedName && (assignedName.includes(myUnitName) || myUnitName.includes(assignedName))) {
        return true;
      }
      if (myWard) {
        if (assignedWard && (assignedWard.includes(myWard) || myWard.includes(assignedWard))) {
          return true;
        }
        if (assignedName && assignedName.includes(myWard)) {
          return true;
        }
      }

      // 3. Kiểm tra địa bàn hành chính hiện trường (jurisdiction.ward hoặc inc.ward)
      const incWard = norm(inc.jurisdiction?.ward || inc.ward || '');
      if (myWard && incWard) {
        if (incWard.includes(myWard) || myWard.includes(incWard)) {
          return true;
        }
      }

      // 4. Nếu đơn vị phụ trách trạm sáp nhập (ví dụ Tân An phụ trách khu vực cũ An Khánh)
      if (myWard && assignedName) {
        const rawWardCore = myWard.replace(/^(phuong|xa|thi tran)\s*/, '');
        if (rawWardCore && assignedName.includes(rawWardCore)) {
          return true;
        }
      }

      return false;
    }
    return true;
  }

  async loadIncidents() {
    try {
      const params = new URLSearchParams();
      if (this.currentOfficer) {
        if (this.currentOfficer.agency && this.currentOfficer.agency !== 'all') {
          params.set('agency', this.currentOfficer.agency);
        }
        if (this.currentOfficer.province) {
          params.set('province', this.currentOfficer.province);
        }
        if (this.currentOfficer.ward) {
          params.set('ward', this.currentOfficer.ward);
        }
        if (this.currentOfficer.level) {
          params.set('level', this.currentOfficer.level);
        }
        if (this.currentOfficer.unitName) {
          params.set('unitName', this.currentOfficer.unitName);
        }
      }
      const qs = params.toString() ? `?${params.toString()}` : '';
      const headers = {};
      if (this.currentOfficer?.token) {
        headers['Authorization'] = `Bearer ${this.currentOfficer.token}`;
      }
      const res = await fetch(`/api/dispatcher/incidents${qs}`, { headers });
      const data = await res.json();
      if (data.ok && Array.isArray(data.incidents)) {
        this.incidents.clear();
        data.incidents.forEach(inc => {
          if (!this.isIncidentInTerritory(inc)) return;
          this.incidents.set(inc.id, inc);
        });

        // Chỉ hiển thị marker nếu cán bộ đã chủ động chọn 1 ca cụ thể (đối với Admin cấp Quốc gia: giữ bản đồ sạch 100%, không auto-click/pin ca nào)
        const isNationalAdmin = Boolean(this.currentOfficer && (this.currentOfficer.username === 'admin' || this.currentOfficer.level === 'national'));
        if (!isNationalAdmin) {
          const targetInc = (this.selectedIncidentId && this.incidents.get(this.selectedIncidentId))
            || Array.from(this.incidents.values()).find(i => this.isIncidentActive(i));
          if (targetInc && this.isIncidentActive(targetInc)) {
            this.addMapPinForIncident(targetInc, false);
          }
        } else if (this.selectedIncidentId && this.incidents.has(this.selectedIncidentId)) {
          const targetInc = this.incidents.get(this.selectedIncidentId);
          if (targetInc && this.isIncidentActive(targetInc)) {
            this.addMapPinForIncident(targetInc, false);
          }
        }
        this.renderQueue();
        this.refreshTerritoryStatsBadges();
        this.renderHistoryList(); // Cập nhật tab lịch sử ngay sau khi load
        this.fetchTrashStatus(); // Khôi phục badge nút hoàn tác nếu có
        this.fetchFakeAlarmCount(); // Khôi phục số lượng hồ sơ báo khống trên thanh công cụ
      }
    } catch (e) {
      console.error('Error loading incidents:', e);
    }
  }

  connectLiveStream() {
    if (this.eventSource) {
      try { this.eventSource.close(); } catch(e) {}
      this.eventSource = null;
    }
    const params = new URLSearchParams();
    if (this.currentOfficer) {
      if (this.currentOfficer.agency && this.currentOfficer.agency !== 'all') {
        params.set('agency', this.currentOfficer.agency);
      }
      if (this.currentOfficer.province) {
        params.set('province', this.currentOfficer.province);
      }
      if (this.currentOfficer.ward) {
        params.set('ward', this.currentOfficer.ward);
      }
      if (this.currentOfficer.level) {
        params.set('level', this.currentOfficer.level);
      }
      if (this.currentOfficer.token) {
        params.set('token', this.currentOfficer.token);
      }
      if (this.currentOfficer.unitName) {
        params.set('unitName', this.currentOfficer.unitName);
      }
    }
    if (this.safetyPollTimer) {
      clearInterval(this.safetyPollTimer);
      this.safetyPollTimer = null;
    }
    // Safety Fallback Polling: Tự động cập nhật danh sách mỗi 3.5s dự phòng trường hợp browser/proxy buffer stream
    this.safetyPollTimer = setInterval(() => {
      this.loadIncidents();
    }, 3500);

    const qs = params.toString() ? `?${params.toString()}` : '';
    this.eventSource = new EventSource(`/api/dispatcher/stream${qs}`);

    this.eventSource.addEventListener('fake_archive_update', (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload && typeof payload.count === 'number') {
          this.updateFakeAlarmCount(payload.count);
        } else {
          this.fetchFakeAlarmCount();
        }
      } catch (err) {}
    });

    this.eventSource.addEventListener('duty_shift_update', (e) => {
      try {
        const shift = JSON.parse(e.data);
        if (shift) {
          this.currentDutyShift = shift;
          sessionStorage.setItem('sos_duty_shift', JSON.stringify(shift));
          localStorage.setItem('sos_duty_shift', JSON.stringify(shift));
          if (this.currentOfficer) {
            this.currentOfficer.officerName = shift.officerName || this.currentOfficer.officerName;
            this.currentOfficer.officerRank = shift.officerRank || this.currentOfficer.officerRank;
            this.currentOfficer.officerPhone = shift.officerPhone || this.currentOfficer.officerPhone;
            this.currentOfficer.officerSms = shift.officerSms || this.currentOfficer.officerSms;
          }
          this.applyDutyShift(shift);
        }
      } catch (err) {}
    });

    this.eventSource.addEventListener('sos_new', (e) => {
      const inc = JSON.parse(e.data);
      console.log('🚨 [DISPATCHER LIVE SOS]', inc);

      // Defense-in-depth: Territorial check
      if (!this.isIncidentInTerritory(inc)) {
        console.log(`🛡️ [DISPATCHER SCOPE] Bỏ qua ca #${inc.id} ngoài phạm vi địa bàn.`);
        return;
      }

      this.incidents.set(inc.id, inc);
      this.addMapPinForIncident(inc);

      // Strict Agency Check: Only trigger alarm & Voice AI if incident belongs to this officer's agency!
      const isTargetAgency = !this.currentOfficer || this.currentOfficer.agency === 'all' || this.currentOfficer.agency === inc.agency;
      if (isTargetAgency && !inc.readOnlySameTerritory) {
        try { this.playAlarm(); } catch(err) { console.warn('Alarm audio error:', err); }
        this.renderQueue();
        this.selectIncident(inc.id);
        try { this.speakVoiceAlert(inc, 3); } catch(err) { console.warn('Voice AI speak error:', err); }
      } else {
        this.renderQueue();
      }
      this.refreshTerritoryStatsBadges();
      this.loadAdminStats();
    });

    this.eventSource.addEventListener('sos_escalate', (e) => {
      const inc = JSON.parse(e.data);
      console.warn('⚡ [DISPATCHER ESCALATION]', inc);

      // Defense-in-depth: Territorial check
      if (!this.isIncidentInTerritory(inc)) return;

      this.incidents.set(inc.id, inc);

      const isTargetAgency = !this.currentOfficer || this.currentOfficer.agency === 'all' || this.currentOfficer.agency === inc.agency;
      if (isTargetAgency && !inc.readOnlySameTerritory) {
        try { this.playAlarm(); } catch(err) { console.warn('Alarm audio error:', err); }
        this.renderQueue();
        if (this.selectedIncidentId === inc.id) {
          this.updateDrawer(inc);
        }
        try { this.speakVoiceAlert(inc, 3, 'Khẩn cấp! Ca cứu hộ đã tự động leo thang lên cấp Tỉnh chỉ đạo.'); } catch(err) { console.warn(err); }
      } else {
        this.renderQueue();
      }
      this.refreshTerritoryStatsBadges();
      this.loadAdminStats();
    });

    this.eventSource.addEventListener('sos_update', (e) => {
      const inc = JSON.parse(e.data);
      if (!this.isIncidentInTerritory(inc)) return;

      this.incidents.set(inc.id, inc);
      const dossier = document.getElementById('incidentReportDocxModal');
      const isVisibleDossier = Boolean(dossier && dossier.style.display !== 'none');
      // A signature can be made by the other party while this report stays
      // open.  Apply the streamed record immediately instead of waiting for
      // the collaborative-document polling interval.
      if (this.selectedIncidentId === inc.id && isVisibleDossier) {
        this.updateSignatureUI(inc);
      }
      // A resolved dossier remains the active owner of its incident until it
      // is closed.  Clearing this binding while the modal is visible would
      // stop both SSE rendering and the authoritative document readback
      // before the counterpart has signed.
      if (!this.isIncidentActive(inc) && this.selectedIncidentId === inc.id && !isVisibleDossier) {
        this.selectedIncidentId = null;
        if (this.activeIncidentDrawer) {
          this.activeIncidentDrawer.style.display = 'none';
          this.activeIncidentDrawer.style.setProperty('display', 'none', 'important');
        }
        if (this.mapController) {
          this.mapController.clearCitizenMarker?.();
          this.mapController.clearVehicleMarker?.();
        }
        const geofenceHud = document.getElementById('tacticalWardGeofenceHud');
        if (geofenceHud) geofenceHud.style.display = 'none';
      }
      this.renderQueue();
      if (this.selectedIncidentId === inc.id) {
        this.updateDrawer(inc);
      }
      this.refreshTerritoryStatsBadges();
      this.loadAdminStats();
    });

    const handleCallSignal = async (signal) => {
      if (!signal) return;
      if (signal.sender === 'dispatcher') return;

      // 1. Citizen is calling dispatcher (either Voice or Video)
      if (signal.action === 'request' && signal.sender === 'citizen') {
        const inc = this.incidents.get(signal.incidentId);
        const isEscalated = (inc && inc.status === 'escalated') || signal.isEscalated === true;
        const myLevel = this.currentOfficer?.level || 'ward';

        // NẾU CA ĐÃ VƯỢT CẤP LÊN TUYẾN TỈNH/TP:
        // Cấp Xã/Phường tuyệt đối KHÔNG MỞ MODAL nhận cuộc gọi nữa!
        if (isEscalated && myLevel === 'ward') {
          console.log(`⚡ Ca #${signal.incidentId} đã vượt cấp lên tuyến Tỉnh/TP chỉ đạo: Cấp Xã không nhận cuộc gọi.`);
          return;
        }

        const citizenName = (inc && inc.reporterName) || 'Người dân';
        this.showToast?.(`📞 Cuộc gọi khẩn cấp từ ${citizenName} (#${signal.incidentId})`, 'warning');
        this.showDispatcherIncomingCallModal(signal);
        return;
      }

      // 2. Voice Call signal
      if (signal.callType === 'voice') {
        if (signal.incidentId === this.selectedIncidentId) {
          if (signal.action === 'accept') {
            const hint = document.getElementById('voiceCallVisualizerHint');
            if (hint) {
              hint.textContent = '🟢 ĐÃ KẾT NỐI ĐÀM THOẠI 2 CHIỀU VỚI NGƯỜI DÂN';
              hint.style.color = '#34d399';
            }
            this.showToast?.('🟢 Người dân đã nhấc máy đàm thoại!', 'success');
          } else if (signal.action === 'reject') {
            const hint = document.getElementById('voiceCallVisualizerHint');
            if (hint) {
              hint.textContent = '🔴 Người dân đã từ chối hoặc bận';
              hint.style.color = '#f87171';
            }
            this.showToast?.('🔴 Người dân đã từ chối cuộc gọi đàm thoại.', 'danger');
          } else if (signal.action === 'end') {
            this.endDispatcherVoiceCall(false);
            this.showToast?.('Cuộc gọi thoại đã kết thúc.', 'info');
          }
        }
        return;
      }

      // 3. Video Call signal
      if (signal.incidentId === this.selectedIncidentId) {
        const statusBadge = document.getElementById('dispatcherCallStatusBadge');
        const waitingOverlay = document.getElementById('dispatcherStreamWaitingOverlay');
        const videoEl = document.getElementById('dispatcherRemoteVideoElement');

        if (signal.action === 'accept') {
          if (statusBadge) {
            statusBadge.textContent = '🟢 ĐANG TRUYỀN HÌNH TRỰC TIẾP (LIVE HD)';
            statusBadge.style.color = '#34d399';
            statusBadge.style.background = 'rgba(16, 185, 129, 0.2)';
          }
          if (waitingOverlay) waitingOverlay.style.display = 'none';

          try {
            this.dispatcherMediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (videoEl) videoEl.srcObject = this.dispatcherMediaStream;
          } catch (err) {
            console.warn('Dispatcher camera preview fallback:', err);
          }
        } else if (signal.action === 'reject') {
          if (statusBadge) {
            statusBadge.textContent = '🔴 Người dân từ chối mở Camera';
            statusBadge.style.color = '#f87171';
            statusBadge.style.background = 'rgba(239, 68, 68, 0.2)';
          }
        } else if (signal.action === 'end') {
          this.endDispatcherVideoCall(false);
        }
      }
    };

    this.eventSource.addEventListener('videocall_signal', async (e) => {
      try {
        const signal = JSON.parse(e.data);
        handleCallSignal(signal);
      } catch (err) {}
    });

    this.eventSource.addEventListener('voicecall_signal', async (e) => {
      try {
        const signal = JSON.parse(e.data);
        handleCallSignal(signal);
      } catch (err) {}
    });

    this.eventSource.addEventListener('new_message', (e) => {
      try {
        const { incidentId, message } = JSON.parse(e.data || '{}');
        const inc = this.incidents.get(incidentId);
        if (inc && message) {
          if (!Array.isArray(inc.messages)) inc.messages = [];
          if (!inc.messages.some(m => m.id === message.id)) {
            inc.messages.push(message);
          }

          // If message is from citizen: Play crisp crystal "ting" sound
          if (message.sender === 'citizen') {
            this.playMessageTing();

            // If officer is currently viewing this exact ticket in Mailbox Hub, mark as read
            const isChatHubViewing = this.chatHubPopover && this.chatHubPopover.style.display !== 'none' && 
                                     this.chatHubDirectChatView && this.chatHubDirectChatView.style.display !== 'none' &&
                                     this.chatHubActiveIncidentId === incidentId;
            if (isChatHubViewing) {
              inc._lastOfficerReadTime = Date.now();
            }
          }
          
          if (this.chatHubActiveIncidentId === incidentId) {
            this.renderChatHubDirectMessages(incidentId);
          }
          this.renderChatHubTabs();

          // Auto open or update floating chat window
          if (this.openChatWindows && this.openChatWindows.has(incidentId)) {
            this.renderFloatingChatMessages(incidentId);
          }

          if (this.selectedIncidentId === incidentId) {
            this.renderDispatcherChat(inc);
          }

          this.updateChatHubBadge();
        }
      } catch (err) {
        console.warn('Error handling new_message SSE:', err);
      }
    });

    this.eventSource.addEventListener('messages_cleared', (e) => {
      try {
        const { incidentId } = JSON.parse(e.data || '{}');
        const inc = this.incidents.get(incidentId);
        if (inc) {
          inc.messages = [];
          if (this.chatHubActiveIncidentId === incidentId) {
            this.renderChatHubDirectMessages(incidentId);
          }
          this.renderChatHubTabs();
          this.updateChatHubBadge();
        }
      } catch (err) {
        console.warn('Error handling messages_cleared SSE:', err);
      }
    });

    this.eventSource.addEventListener('security_alert', (e) => {
      const alertData = JSON.parse(e.data);
      console.warn('🚨 [SECURITY INTRUSION ALERT RECEIVED]', alertData);
      this.playAlarm();

      if (this.currentOfficer?.agency === 'all' || this.currentOfficer?.username === 'admin') {
        alert(`🚨 CẢNH BÁO AN NINH MẠNG QUỐC GIA!\n\n${alertData.message}\n\n📍 Địa chỉ IP: ${alertData.ip}\n💻 Thiết bị: ${alertData.deviceInfo}\n⏱️ Thời gian: ${alertData.timeVN}`);
        if (this.adminOfficerModal && this.adminOfficerModal.style.display === 'flex') {
          this.loadSecurityAuditLogs();
        }
      }
    });

    // API: Sync all incidents when server sends a bulk update (e.g. after history/clear or incidents/clear)
    this.eventSource.addEventListener('sos_update_all', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (Array.isArray(data.incidents)) {
          this.incidents.clear();
          data.incidents.forEach(inc => {
            if (inc && inc.id) this.incidents.set(inc.id, inc);
          });
          this.renderQueue();
          this.renderHistoryList(); // Cập nhật tab lịch sử — resolved incidents đã bị xóa khỏi server
          this.fetchTrashStatus(); // Cập nhật badge nút hoàn tác
          console.log(`🔄 [SSE] sos_update_all: synced ${data.incidents.length} incidents from server`);
        }
      } catch (err) {
        console.warn('Error handling sos_update_all SSE:', err);
      }
    });
  }

  renderQueue() {
    if (!this.incidentQueueList) return;

    this.refreshTerritoryStatsBadges();
    this.updateDynamicYearUI();

    const allList = Array.from(this.incidents.values())
      .filter(inc => {
        if (!inc) return false;
        if (this.filterAgency !== 'all' && inc.agency !== this.filterAgency) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Active incidents: Chỉ giữ lại các ca đang hoạt động thực sự (chưa hoàn tất)
    const activeList = allList.filter(i => this.isIncidentActive(i));

    // Total history incidents under current officer agency authority:
    const officerHistoryList = Array.from(this.incidents.values())
      .filter(inc => {
        if (!inc || this.isIncidentActive(inc) || inc.status === 'fake_alarm') return false;
        if (this.currentOfficer && this.currentOfficer.agency && this.currentOfficer.agency !== 'all') {
          if (inc.agency !== this.currentOfficer.agency) return false;
        }
        return true;
      });

    const activeBadge = document.getElementById('activeCountBadge') || this.activeCountBadge;
    if (activeBadge) {
      activeBadge.textContent = activeList.length;
    }
    const historyBadge = document.getElementById('historyCountBadge') || this.historyCountBadge;
    if (historyBadge) {
      historyBadge.textContent = officerHistoryList.length;
    }

    // Refresh history panel
    this.renderHistoryList();

    if (activeList.length === 0) {
      // Khi không còn ca nào đang hoạt động: đóng drawer và xóa marker trên map
      const dossier = document.getElementById('incidentReportDocxModal');
      const isVisibleDossier = Boolean(dossier && dossier.style.display !== 'none');
      if (this.selectedIncidentId) {
        const selInc = this.incidents.get(this.selectedIncidentId);
        if (!this.isIncidentActive(selInc) && !isVisibleDossier) {
          this.selectedIncidentId = null;
        }
      }
      if (!this.selectedIncidentId) {
        if (this.activeIncidentDrawer) {
          this.activeIncidentDrawer.style.display = 'none';
          this.activeIncidentDrawer.style.setProperty('display', 'none', 'important');
        }
        if (this.mapController) {
          this.mapController.clearCitizenMarker?.();
          this.mapController.clearVehicleMarker?.();
        }
        const geofenceHud = document.getElementById('tacticalWardGeofenceHud');
        if (geofenceHud) geofenceHud.style.display = 'none';
      }

      if (this.queueEmptyCosmicState) {
        if (!this.selectedIncidentId) {
          this.queueEmptyCosmicState.style.display = 'flex';
          this.queueEmptyCosmicState.style.setProperty('display', 'flex', 'important');
        } else {
          this.queueEmptyCosmicState.style.display = 'none';
          this.queueEmptyCosmicState.style.setProperty('display', 'none', 'important');
        }
      }
      if (this.incidentQueueList) {
        this.incidentQueueList.style.display = 'none';
        this.incidentQueueList.style.setProperty('display', 'none', 'important');
        this.incidentQueueList.innerHTML = '';
      }
      if (this.activeIncidentDrawer && !this.selectedIncidentId) {
        this.activeIncidentDrawer.style.display = 'none';
        this.activeIncidentDrawer.style.setProperty('display', 'none', 'important');
      }
      return;
    }

    if (this.queueEmptyCosmicState) {
      this.queueEmptyCosmicState.style.display = 'none';
      this.queueEmptyCosmicState.style.setProperty('display', 'none', 'important');
    }
    if (this.incidentQueueList) {
      this.incidentQueueList.style.display = 'flex';
      this.incidentQueueList.style.setProperty('display', 'flex', 'important');
      this.incidentQueueList.style.flexDirection = 'column';
      this.incidentQueueList.innerHTML = '';
    }

    activeList.forEach(inc => {
      const card = document.createElement('div');
      card.className = `queue-card ${this.selectedIncidentId === inc.id ? 'active' : ''}`;
      
      const isReadOnlySameTerritory = Boolean(inc.readOnlySameTerritory);
      const timeStr = new Date(inc.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const agencyClass = inc.agency || 'police';
      const agencyLabel = inc.agency === 'police' ? '👮‍♂️ Công An Khu Vực' : (inc.agency === 'csgt' ? '🚗 Cảnh Sát Giao Thông' : (inc.agency === 'fire' ? '🚒 PCCC & CNCH' : (inc.agency === 'hospital' || inc.agency === 'ambulance' ? '🚑 Cấp Cứu Y Tế' : '🛠️ Cứu Hộ Xe & Đường Bộ')));
      const levelBadge = isReadOnlySameTerritory
        ? `<span style="background: rgba(148, 163, 184, 0.2); color: #94a3b8; border: 1px solid #64748b; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 4px;">🛡️ THEO DÕI SỐ LIỆU ĐỊA BÀN (${inc.agencyName || inc.agency})</span>`
        : (inc.currentLevel === 'province'
          ? `<span style="background: rgba(255, 42, 75, 0.2); color: #ff6b81; border: 1px solid #ff2a4b; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 4px;">⚡ CẤP TỈNH ĐÃ LEO THANG</span>`
          : `<span style="background: rgba(0, 136, 255, 0.2); color: #60a5fa; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 4px;">📍 CẤP XÃ/PHƯỜNG (${inc.jurisdiction ? inc.jurisdiction.ward : 'Cơ sở'})</span>`);

      const unit = inc.dispatchUnit || inc.assignedUnit;
      const originParam = (unit && unit.lat && unit.lng) ? `&origin=${unit.lat},${unit.lng}` : '';
      const gmapsCarUrl = `https://www.google.com/maps/dir/?api=1${originParam}&destination=${inc.lat},${inc.lng}&travelmode=driving`;
      const gmapsMotoUrl = `https://www.google.com/maps/dir/?api=1${originParam}&destination=${inc.lat},${inc.lng}&travelmode=two_wheeler`;
      const locationText = inc.address || (inc.lat && inc.lng ? `Tọa độ GPS: ${inc.lat.toFixed(5)}, ${inc.lng.toFixed(5)}` : 'Vị trí đã định vị trên bản đồ');

      card.innerHTML = `
        <div class="queue-card-top">
          <span class="queue-agency-tag ${agencyClass}">${agencyLabel}</span>
          <span class="queue-time">${timeStr}</span>
        </div>
        <div style="margin-bottom: 4px;">${levelBadge}</div>
        <div class="queue-location" style="margin-bottom: 6px;">
          <div style="font-weight: 700; color: #f1f5f9; display: flex; align-items: flex-start; gap: 4px; line-height: 1.4;">
            <svg class="svg-ico ico-xs ico-amber" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span>${locationText}</span>
          </div>
        </div>
        <div class="queue-incident-text" style="margin-bottom: 8px;">Sự cố: <b>${(inc.incidentTags || []).join(', ')}</b> ${inc.customNotes ? '— ' + inc.customNotes : ''}</div>
        <div class="queue-card-actions" style="display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap;">
          ${isReadOnlySameTerritory ? `
            <span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(100, 116, 139, 0.2); border: 1px dashed #94a3b8; color: #cbd5e1; padding: 4px 8px; border-radius: 6px; font-size: 10.5px; font-weight: 700;">
              🔒 Chung địa bàn · Đơn vị bạn thụ lý
            </span>
          ` : (inc.status === 'pending' ? `
            <button type="button" class="btn-card-accept-sos" data-id="${inc.id}" style="display: inline-flex; align-items: center; gap: 4px; background: rgba(234, 179, 8, 0.22); border: 1.5px solid #eab308; color: #fef08a; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; cursor: pointer; transition: all 0.2s;" title="Bấm để TIẾP NHẬN ca cứu hộ ngay lập tức">
              <svg class="svg-ico ico-xs ico-amber" viewBox="0 0 24 24"><path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"></path></svg>
              TIẾP NHẬN NGAY
            </button>
          ` : `
            <div class="tracking-badge-status ${inc.status}" style="font-size: 11px; padding: 3px 8px; display: inline-flex; align-items: center; gap: 4px;">
              ${inc.status === 'escalated' ? (this.currentOfficer?.level === 'ward' ? '<svg class="svg-ico ico-xs ico-red" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> ĐÃ LEO THANG TỈNH' : '<svg class="svg-ico ico-xs ico-red" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> ĐÃ LEO THANG TỈNH/TP') : inc.status === 'dispatching' ? '<svg class="svg-ico ico-xs ico-blue" viewBox="0 0 24 24"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg> Đang điều phối' : inc.status === 'arrived' ? '<svg class="svg-ico ico-xs ico-red" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> Đã tới' : '<svg class="svg-ico ico-xs ico-emerald" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Hoàn tất'}
            </div>
          `)}
          ${!isReadOnlySameTerritory ? `
            <button type="button" class="btn-card-open-chat" style="display: inline-flex; align-items: center; gap: 3px; background: rgba(168, 85, 247, 0.18); border: 1px solid #c084fc; color: #e9d5ff; padding: 3px 7px; border-radius: 6px; font-size: 10px; font-weight: 800; cursor: pointer; transition: all 0.2s;" title="Mở ô chat góc màn hình trao đổi với người dân">
              <svg class="svg-ico ico-xs ico-purple" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> Chat
            </button>
          ` : ''}
            <a href="${gmapsCarUrl}" target="_blank" rel="noopener" onclick="event.stopPropagation()" class="btn-gmaps-direct" style="display: inline-flex; align-items: center; gap: 3px; background: rgba(56, 189, 248, 0.18); border: 1px solid #38bdf8; color: #38bdf8; padding: 3px 7px; border-radius: 6px; font-size: 10px; font-weight: 800; text-decoration: none; transition: all 0.2s;" title="Dẫn đường ô tô nhanh nhất từ trụ sở / vị trí hiện tại đến sự cố">
              <svg class="svg-ico ico-xs ico-blue" viewBox="0 0 24 24"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg> Ô tô ↗
            </a>
            <a href="${gmapsMotoUrl}" target="_blank" rel="noopener" onclick="event.stopPropagation()" class="btn-gmaps-direct" style="display: inline-flex; align-items: center; gap: 3px; background: rgba(52, 211, 153, 0.18); border: 1px solid #34d399; color: #34d399; padding: 3px 7px; border-radius: 6px; font-size: 10px; font-weight: 800; text-decoration: none; transition: all 0.2s;" title="Dẫn đường xe máy luồn lách nhanh nhất từ trụ sở / vị trí hiện tại đến sự cố">
              <svg class="svg-ico ico-xs ico-emerald" viewBox="0 0 24 24"><circle cx="18.5" cy="17.5" r="3.5"></circle><circle cx="5.5" cy="17.5" r="3.5"></circle><circle cx="15" cy="5" r="1"></circle><path d="M12 17.5V14l-3-3 4-3 2 3h2"></path></svg> Xe máy ↗
            </a>
          </div>
        </div>
      `;

      const btnChat = card.querySelector('.btn-card-open-chat');
      if (btnChat) {
        btnChat.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openFloatingChatWindow(inc.id);
        });
      }

      const btnCardAccept = card.querySelector('.btn-card-accept-sos');
      if (btnCardAccept) {
        btnCardAccept.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectIncident(inc.id);
          this.handleAcceptSOS();
        });
      }

      card.addEventListener('click', () => this.selectIncident(inc.id));
      if (this.incidentQueueList) {
        this.incidentQueueList.appendChild(card);
      }
    });

    // Auto-select first incident only ONCE on initial page load for DESKTOP (>= 993px)
    // On mobile (< 993px) or for Admin, keep the clean overview/map/queue view without auto-selecting
    const isDesktop = window.innerWidth > 992;
    const isNationalAdmin = Boolean(this.currentOfficer && (this.currentOfficer.username === 'admin' || this.currentOfficer.level === 'national'));
    if (isDesktop && !isNationalAdmin && !this.hasInitialSelected && !this.isUserClosedDrawer && !this.selectedIncidentId && activeList.length > 0) {
      this.hasInitialSelected = true;
      this.selectIncident(activeList[0].id);
    } else if (!this.selectedIncidentId) {
      // User closed drawer or no incident selected: ensure drawer is hidden and queue is visible
      const drawer = this.activeIncidentDrawer || document.getElementById('activeIncidentDrawer');
      if (drawer) {
        drawer.classList.add('is-hidden');
        drawer.style.display = 'none';
        drawer.style.setProperty('display', 'none', 'important');
      }
      if (this.incidentQueueList && activeList.length > 0) {
        this.incidentQueueList.classList.remove('is-hidden');
        this.incidentQueueList.style.display = 'flex';
        this.incidentQueueList.style.setProperty('display', 'flex', 'important');
      }
    } else if (activeList.length === 0 || (this.selectedIncidentId && !this.incidents.has(this.selectedIncidentId))) {
      this.selectedIncidentId = null;
      const drawer = this.activeIncidentDrawer || document.getElementById('activeIncidentDrawer');
      if (drawer) {
        drawer.classList.add('is-hidden');
        drawer.style.display = 'none';
        drawer.style.setProperty('display', 'none', 'important');
      }
      this.hideWardHud?.();
    }
  }

  renderHistoryList() {
    if (!this.incidentHistoryList) return;
    this.fetchTrashStatus();

    const officerHistoryList = Array.from(this.incidents.values())
      .filter(inc => {
        if (!inc || this.isIncidentActive(inc) || inc.status === 'fake_alarm') return false;
        if (this.currentOfficer && this.currentOfficer.agency && this.currentOfficer.agency !== 'all') {
          if (inc.agency !== this.currentOfficer.agency) return false;
        }
        return true;
      });
    const historyBadge = document.getElementById('historyCountBadge') || this.historyCountBadge;
    if (historyBadge) {
      historyBadge.textContent = officerHistoryList.length;
    }

    let historyList = Array.from(this.incidents.values())
      .filter(inc => inc && !this.isIncidentActive(inc) && inc.status !== 'fake_alarm')
      .sort((a, b) => new Date(b.resolvedAt || b.updatedAt || b.createdAt) - new Date(a.resolvedAt || a.updatedAt || a.createdAt));

    // Filter by agency
    if (this.historyFilterAgency && this.historyFilterAgency !== 'all') {
      historyList = historyList.filter(inc => inc.agency === this.historyFilterAgency);
    }

    // Filter by search keyword
    if (this.historySearchTerm) {
      const q = this.historySearchTerm;
      historyList = historyList.filter(inc => {
        const id = (inc.id || '').toLowerCase();
        const rep = (inc.reporterName || '').toLowerCase();
        const phone = (inc.reporterPhone || '').toLowerCase();
        const addr = (inc.address || '').toLowerCase();
        const ward = (inc.jurisdiction?.ward || inc.ward || '').toLowerCase();
        const prov = (inc.jurisdiction?.province || inc.province || '').toLowerCase();
        const tags = (inc.incidentTags || []).join(' ').toLowerCase();
        return id.includes(q) || rep.includes(q) || phone.includes(q) || addr.includes(q) || ward.includes(q) || prov.includes(q) || tags.includes(q);
      });
    }

    if (historyList.length === 0) {
      this.incidentHistoryList.innerHTML = `
        <div style="text-align: center; color: var(--text-dim); padding: 30px 15px;">
          <div style="font-size: 28px; margin-bottom: 6px;">📜</div>
          <div>Không tìm thấy ca sự cố nào trong lịch sử</div>
          <div style="font-size: 11px; margin-top: 4px;">Khi các ca cứu hộ được xử lý xong và bấm Hoàn Tất, hồ sơ sẽ tự động chuyển vào đây để lưu trữ & xuất file.</div>
        </div>
      `;
      return;
    }

    this.incidentHistoryList.innerHTML = '';
    historyList.forEach(inc => {
      const card = document.createElement('div');
      card.className = `queue-card history-card ${this.selectedIncidentId === inc.id ? 'active' : ''}`;
      card.style.borderColor = 'rgba(16, 185, 129, 0.4)';
      card.style.background = 'rgba(6, 78, 59, 0.12)';

      const timeCreated = new Date(inc.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const timeResolved = inc.resolvedAt ? new Date(inc.resolvedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : timeCreated;
      const dateResolved = inc.resolvedAt ? new Date(inc.resolvedAt).toLocaleDateString('vi-VN') : new Date(inc.createdAt).toLocaleDateString('vi-VN');
      
      const agencyClass = inc.agency || 'police';
      const agencyLabel = inc.agency === 'police' 
        ? 'Công An Khu Vực' 
        : (inc.agency === 'csgt' 
          ? 'CSGT' 
          : (inc.agency === 'fire' 
            ? 'PCCC & CNCH' 
            : (inc.agency === 'hospital' || inc.agency === 'ambulance' 
              ? 'Cấp Cứu Y Tế 115' 
              : 'Cứu Hộ Giao Thông')));
      const locationText = inc.address || (inc.lat && inc.lng ? `GPS: ${inc.lat.toFixed(5)}, ${inc.lng.toFixed(5)}` : 'Vị trí bản đồ');
      const wardProvText = `${inc.jurisdiction?.ward || 'Xã/Phường'}, ${inc.jurisdiction?.province || 'Tỉnh/TP'}`;
      const isSigned = inc.signatures?.isFullySigned;

      // Chi tiết dịch vụ cuộc gọi (115 hoặc Cứu hộ)
      let serviceCallNotice = '';
      if (inc.isServiceCall || inc.serviceUnit) {
        const u = inc.serviceUnit || {};
        const isHosp = inc.agency === 'hospital' || inc.agency === 'ambulance';
        serviceCallNotice = `
          <div style="margin: 4px 0 6px 0; padding: 6px 8px; border-radius: 6px; background: ${isHosp ? 'rgba(16,185,129,0.15)' : 'rgba(249,115,22,0.15)'}; border: 1px solid ${isHosp ? 'rgba(16,185,129,0.35)' : 'rgba(249,115,22,0.35)'}; font-size: 11px;">
            <div style="font-weight: 800; color: ${isHosp ? '#34d399' : '#fb923c'}; display: flex; align-items: center; gap: 4px;">
              ${isHosp ? '<svg class="svg-ico ico-xs ico-emerald" viewBox="0 0 24 24"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h6M9 13h6M9 17h6"></path></svg> 1 người dân đã liên hệ cần cấp cứu tại:' : '<svg class="svg-ico ico-xs ico-amber" viewBox="0 0 24 24"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg> 1 người dân đã sử dụng dịch vụ cứu hộ tại:'}
            </div>
            <div style="color: #f1f5f9; font-weight: 700; margin-top: 2px;">
              ${u.name || (isHosp ? 'Bệnh viện / Trạm 115' : 'Đơn vị cứu hộ xe')} ${u.phone ? `(${u.phone})` : ''}
            </div>
            ${u.address ? `<div style="font-size: 10px; color: #94a3b8; margin-top: 1px; display: flex; align-items: center; gap: 3px;"><svg class="svg-ico ico-xs" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> ${u.address}</div>` : ''}
          </div>
        `;
      }

      card.innerHTML = `
        <div class="queue-card-top" style="margin-bottom: 4px;">
          <span class="queue-agency-tag ${agencyClass}">${agencyLabel}</span>
          <span style="font-size: 11px; color: #34d399; font-weight: 700; display: inline-flex; align-items: center; gap: 3px;"><svg class="svg-ico ico-xs ico-emerald" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> HOÀN TẤT (${timeResolved} - ${dateResolved})</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span style="font-size: 12px; font-weight: 800; color: #38bdf8;">#${inc.id}</span>
          <span style="font-size: 10px; padding: 1px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px; ${isSigned ? 'background: rgba(16,185,129,0.2); color: #34d399; border: 1px solid #10b981;' : 'background: rgba(245,158,11,0.2); color: #fbbf24; border: 1px solid #f59e0b;'}">
            ${isSigned ? '<svg class="svg-ico ico-xs ico-emerald" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Đã Ký Đủ 2 Bên' : '<svg class="svg-ico ico-xs ico-amber" viewBox="0 0 24 24"><path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"></path></svg> Chưa Ký Biên Bản'}
          </span>
        </div>

        ${serviceCallNotice}

        <div class="queue-location" style="margin-bottom: 4px;">
          <div style="font-weight: 700; color: #f1f5f9; font-size: 12px; line-height: 1.3; display: flex; align-items: center; gap: 4px;">
            <svg class="svg-ico ico-xs ico-amber" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> <span>${locationText}</span>
          </div>
          <div style="font-size: 10px; color: #94a3b8; margin-left: 16px;">${wardProvText}</div>
        </div>

        <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 8px;">
          Sự cố: <b>${(inc.incidentTags || []).join(', ')}</b> · Người báo: <b>${inc.reporterName || 'Người dân'}</b> (${inc.reporterPhone || '—'})
        </div>

        <!-- Quick Export Buttons Grid -->
        <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 3px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.08);">
          <button type="button" class="btn-refresh-loc btn-export-docx" data-id="${inc.id}" style="font-size: 10px; font-weight: 700; padding: 4px 1px; justify-content: center; background: rgba(59, 130, 246, 0.15); border-color: #3b82f6; color: #60a5fa; display: inline-flex; align-items: center; gap: 2px;" title="Tải file Word (.docx) biên bản tiếp nhận & xử lý">
            <svg class="svg-ico ico-xs ico-blue" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg> Word
          </button>
          <button type="button" class="btn-refresh-loc btn-export-pdf" data-id="${inc.id}" style="font-size: 10px; font-weight: 700; padding: 4px 1px; justify-content: center; background: rgba(239, 68, 68, 0.15); border-color: #ef4444; color: #f87171; display: inline-flex; align-items: center; gap: 2px;" title="Xem & In phiếu / Xuất file PDF chuẩn">
            <svg class="svg-ico ico-xs ico-red" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg> In/PDF
          </button>
          <button type="button" class="btn-refresh-loc btn-export-png" data-id="${inc.id}" style="font-size: 10px; font-weight: 700; padding: 4px 1px; justify-content: center; background: rgba(168, 85, 247, 0.15); border-color: #a855f7; color: #c084fc; display: inline-flex; align-items: center; gap: 2px;" title="Tải ảnh biên bản nghiệp vụ (.png)">
            <svg class="svg-ico ico-xs ico-purple" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg> Ảnh
          </button>
          <button type="button" class="btn-refresh-loc btn-export-chat" data-id="${inc.id}" style="font-size: 10px; font-weight: 700; padding: 4px 1px; justify-content: center; background: rgba(245, 158, 11, 0.15); border-color: #f59e0b; color: #fbbf24; display: inline-flex; align-items: center; gap: 2px;" title="Tải toàn bộ nhật ký tin nhắn của phiếu này (.txt)">
            <svg class="svg-ico ico-xs ico-amber" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> Chat
          </button>
          <button type="button" class="btn-refresh-loc btn-view-detail" data-id="${inc.id}" style="font-size: 10px; font-weight: 700; padding: 4px 1px; justify-content: center; background: rgba(16, 185, 129, 0.15); border-color: #10b981; color: #34d399; display: inline-flex; align-items: center; gap: 2px;" title="Xem lại toàn bộ hồ sơ & vị trí bản đồ">
            <svg class="svg-ico ico-xs ico-emerald" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> Xem
          </button>
          <button type="button" class="btn-refresh-loc btn-delete-history-single" data-id="${inc.id}" style="font-size: 10px; font-weight: 700; padding: 4px 1px; justify-content: center; background: rgba(239, 68, 68, 0.12); border-color: rgba(239, 68, 68, 0.35); color: #fca5a5; display: inline-flex; align-items: center; gap: 2px;" title="Xóa ca sự cố này khỏi lịch sử (có thể hoàn tác trong vòng 24 giờ)">
            <svg class="svg-ico ico-xs ico-red" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Xóa
          </button>
        </div>
      `;

      card.addEventListener('click', () => this.selectIncident(inc.id));

      // Bind action buttons
      card.querySelector('.btn-export-docx')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.exportSingleIncidentDocx(inc.id);
      });
      card.querySelector('.btn-export-pdf')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.exportSingleIncidentPdf(inc.id);
      });
      card.querySelector('.btn-export-png')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.exportSingleIncidentImage(inc.id);
      });
      card.querySelector('.btn-export-chat')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.downloadIncidentMessagesLog(inc.id);
      });
      card.querySelector('.btn-view-detail')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectIncident(inc.id);
        this.openReportModal(inc);
      });
      card.querySelector('.btn-delete-history-single')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteSingleHistoryIncident(inc.id);
      });

      this.incidentHistoryList.appendChild(card);
    });
  }

  async exportHistoryExcel() {
    const historyList = Array.from(this.incidents.values()).filter(i => i && i.status === 'resolved');
    if (historyList.length === 0) {
      alert('⚠️ Chưa có ca sự cố nào trong lịch sử để xuất file Excel. Hãy hoàn tất một ca sự cố trước!');
      return;
    }

    const btn = document.getElementById('btnExportHistoryExcel');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳ Đang tạo Excel...';
    }

    try {
      const officerTitle = (this.currentDutyShift && this.currentDutyShift.officerName) 
        ? `${this.currentDutyShift.officerRank || ''} ${this.currentDutyShift.officerName}`.trim()
        : (this.currentOfficer?.officerName || this.currentOfficer?.name || 'Trực ban tác chiến');

      const payload = {
        incidents: historyList,
        generatedAt: new Date().toLocaleString('vi-VN'),
        officerName: officerTitle
      };

      const res = await fetch('/api/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BangKe_LichSu_SuCo_SOS_${new Date().toISOString().slice(0,10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Có lỗi khi tạo file Excel từ máy chủ.');
      }
    } catch (e) {
      console.error(e);
      alert('Không thể kết nối máy chủ để xuất file Excel.');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>📊</span> Xuất Excel (.xlsx)';
      }
    }
  }

  async exportSingleIncidentDocx(id) {
    const inc = this.incidents.get(id);
    if (!inc) return;
    this.selectedIncidentId = id;
    this.openReportModal(inc);
    await this.downloadReportDocx();
  }

  async exportSingleIncidentImage(id) {
    const inc = this.incidents.get(id);
    if (!inc) return;
    this.selectedIncidentId = id;
    this.openReportModal(inc);
    await this.downloadReportImage();
  }

  exportSingleIncidentPdf(id) {
    const inc = this.incidents.get(id);
    if (!inc) return;
    this.selectedIncidentId = id;
    this.openReportModal(inc);
    setTimeout(() => {
      window.print();
    }, 400);
  }

  downloadIncidentMessagesLog(id) {
    const inc = this.incidents.get(id);
    if (!inc) {
      alert('Không tìm thấy thông tin ca sự cố.');
      return;
    }

    const messages = Array.isArray(inc.messages) ? inc.messages : [];
    const createdAt = inc.createdAt ? new Date(inc.createdAt).toLocaleString('vi-VN') : '—';
    const resolvedAt = inc.resolvedAt ? new Date(inc.resolvedAt).toLocaleString('vi-VN') : (inc.updatedAt ? new Date(inc.updatedAt).toLocaleString('vi-VN') : '—');
    const unit = inc.dispatchUnit || inc.assignedUnit || {};
    const unitName = unit.unitName || unit.name || 'Đơn vị tiếp nhận SOS';
    const officerName = unit.officerFullTitle || (unit.officerRank ? `${unit.officerRank} ${unit.officerName}` : unit.officerName) || 'Cán bộ trực ban';
    const officerPhone = unit.officerPhone || unit.phone || '113 / 115 / 114';
    const ward = inc.jurisdiction?.ward || inc.ward || 'Sở tại';
    const prov = inc.jurisdiction?.province || inc.province || 'Việt Nam';

    let content = `================================================================================\n`;
    content += `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n`;
    content += `Độc lập - Tự do - Hạnh phúc\n`;
    content += `--------------------------------------------------------------------------------\n`;
    content += `HỆ THỐNG TRUNG TÂM ĐIỀU PHỐI CỨU HỘ KHẨN CẤP QUỐC GIA (SOS VIỆT NAM)\n`;
    content += `NHẬT KÝ LỊCH SỬ TIN NHẮN & HỘI THOẠI CỨU HỘ KHẨN CẤP\n`;
    content += `================================================================================\n\n`;
    content += `THÔNG TIN PHIẾU CỨU HỘ:\n`;
    content += `- Mã Phiếu SOS: #${inc.id}\n`;
    content += `- Loại Sự Cố: ${(inc.incidentTags || []).join(', ') || 'Cứu hộ khẩn cấp'}\n`;
    content += `- Thời gian phát tín hiệu: ${createdAt}\n`;
    content += `- Thời gian hoàn tất & lưu trữ: ${resolvedAt}\n`;
    content += `- Trạng thái: ĐÃ HOÀN TẤT — CUỘC TRÒ CHUYỆN ĐÃ ĐÓNG & LƯU LỊCH SỬ\n\n`;
    content += `THÔNG TIN NGƯỜI BÁO TIN:\n`;
    content += `- Họ và tên: ${inc.reporterName || 'Người dân cần cứu hộ'}\n`;
    content += `- Số điện thoại liên hệ: ${inc.reporterPhone || '—'}\n`;
    content += `- Vị trí hiện trường: ${inc.address || (inc.lat && inc.lng ? `GPS: ${inc.lat.toFixed(5)}, ${inc.lng.toFixed(5)}` : 'Chưa xác định')}\n`;
    content += `- Địa bàn hành chính: ${ward}, ${prov}\n\n`;
    content += `THÔNG TIN ĐƠN VỊ & CÁN BỘ PHỤ TRÁCH:\n`;
    content += `- Đơn vị tiếp nhận: ${unitName}\n`;
    content += `- Cán bộ chỉ huy/tiếp nhận: ${officerName}\n`;
    content += `- Điện thoại trực ban/cán bộ: ${officerPhone}\n`;
    content += `- Trụ sở đơn vị: ${unit.address || unit.stationAddress || 'Theo địa bàn sở tại'}\n\n`;
    content += `================================================================================\n`;
    content += `DIỄN BIẾN TOÀN BỘ TIN NHẮN & TRAO ĐỔI (${messages.length} tin nhắn):\n`;
    content += `================================================================================\n\n`;

    if (messages.length === 0) {
      content += `(Phiếu này không có tin nhắn văn bản trao đổi bổ sung qua hệ thống chat).\n\n`;
    } else {
      messages.forEach((msg, idx) => {
        const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('vi-VN') : '—';
        const date = msg.timestamp ? new Date(msg.timestamp).toLocaleDateString('vi-VN') : '';
        const role = msg.sender === 'citizen' ? '[NGƯỜI DÂN]' : (msg.sender === 'dispatcher' ? '[CÁN BỘ ĐIỀU PHỐI]' : '[HỆ THỐNG]');
        const name = msg.senderName || (msg.sender === 'citizen' ? inc.reporterName : 'Trực ban');
        content += `[${idx + 1}] [${time} ${date}] ${role} ${name}:\n`;
        content += `    "${msg.text}"\n\n`;
      });
    }

    content += `================================================================================\n`;
    content += `XÁC NHẬN BIÊN BẢN ĐIỆN TỬ:\n`;
    content += `- Ký tên Người dân: ${inc.signatures?.citizen?.signed ? `Đã ký (${inc.signatures.citizen.name || 'Người dân'})` : 'Chưa ký'}\n`;
    content += `- Ký tên Cán bộ: ${inc.signatures?.officer?.signed ? `Đã ký (${inc.signatures.officer.name || 'Cán bộ'})` : 'Chưa ký'}\n`;
    content += `- Tình trạng pháp lý: ${inc.signatures?.isFullySigned ? 'HỢP LỆ (ĐÃ KÝ ĐỦ 2 BÊN)' : 'CHỜ KÝ BỔ SUNG'}\n`;
    content += `- Thời điểm xuất nhật ký: ${new Date().toLocaleString('vi-VN')}\n`;
    content += `================================================================================\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NhatKy_TinNhan_SOS_${inc.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async fetchTrashStatus() {
    try {
      const res = await fetch('/api/dispatcher/history/trash-status');
      const data = await res.json();
      if (data && data.ok) {
        this.updateUndoButtonBadge(data.trashCount || 0);
      }
    } catch (e) {
      console.warn('Could not fetch trash status:', e);
    }
  }

  async deleteSingleHistoryIncident(id) {
    const inc = this.incidents.get(id);
    const sosCode = inc?.id || id;
    if (!confirm(`Bạn có chắc chắn muốn xóa ca sự cố #${sosCode} khỏi lịch sử?\n\n(Lưu ý: Bạn có thể hoàn tác trong vòng 24 giờ kể từ khi bấm xóa. Sau 24 giờ, hệ thống sẽ xóa vĩnh viễn)`)) return;

    try {
      const res = await fetch('/api/dispatcher/history/delete-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.ok) {
        this.incidents.delete(id);
        this.renderQueue();
        this.renderHistoryList();
        this.showUndoToast(`🗑️ Đã xóa ca sự cố #${sosCode} (Có thể hoàn tác trong 24h)`, data.trashCount);
      } else {
        alert('Lỗi: ' + (data.error || 'Không thể xóa'));
      }
    } catch (e) {
      console.error(e);
      alert('Không thể kết nối máy chủ.');
    }
  }

  async openHistoryTrashModal() {
    const modal = document.getElementById('historyTrashModal');
    if (!modal) return;
    modal.style.display = 'flex';
    modal.style.setProperty('display', 'flex', 'important');

    await this.renderTrashModalList();
    this.initTrashModalEvents();
  }

  closeHistoryTrashModal() {
    const modal = document.getElementById('historyTrashModal');
    if (modal) {
      modal.style.display = 'none';
      modal.style.setProperty('display', 'none', 'important');
    }
  }

  async renderTrashModalList() {
    const container = document.getElementById('historyTrashListContainer');
    const totalBadge = document.getElementById('trashTotalCountBadge');
    const selectedCountText = document.getElementById('trashSelectedCountText');
    const selectedBtnCount = document.getElementById('btnRestoreSelectedCount');
    const chkSelectAll = document.getElementById('chkTrashSelectAll');
    if (!container) return;

    container.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 20px; font-size: 13px;">⏳ Đang tải danh sách thùng rác 24h...</div>';

    try {
      const res = await fetch('/api/dispatcher/history/trash-status');
      const data = await res.json();
      const items = (data && data.ok && Array.isArray(data.items)) ? data.items : [];

      if (totalBadge) totalBadge.textContent = items.length;
      if (selectedCountText) selectedCountText.textContent = '0';
      if (selectedBtnCount) selectedBtnCount.textContent = '0';
      if (chkSelectAll) chkSelectAll.checked = false;

      this.updateUndoButtonBadge(items.length);

      if (items.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 40px 20px; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1);">
            <span style="font-size: 32px; display: block; margin-bottom: 8px;">✨</span>
            <div style="font-size: 14px; font-weight: 800; color: #cbd5e1; margin-bottom: 4px;">Thùng rác hiện đang trống</div>
            <div style="font-size: 11.5px; color: #64748b;">Không có ca sự cố nào bị xóa trong vòng 24 giờ qua.</div>
          </div>
        `;
        return;
      }

      container.innerHTML = items.map(item => {
        const inc = item.incident || {};
        const sosId = inc.id || item.id;
        const agencyName = inc.agencyName || inc.unitName || 'Công An Khu Vực';
        const address = inc.address || inc.ward || 'Chưa rõ địa chỉ';
        const reporter = inc.reporterName ? `${inc.reporterName} (${inc.reporterPhone || 'N/A'})` : (inc.reporterPhone || 'Chưa rõ người báo');
        const remainingHours = Math.floor(item.remainingMinutes / 60);
        const remainingMins = item.remainingMinutes % 60;
        const remainingStr = remainingHours > 0 ? `${remainingHours} giờ ${remainingMins} phút` : `${remainingMins} phút`;
        const notes = inc.customNotes || inc.notes || 'Cần hỗ trợ khẩn cấp';

        return `
          <div class="trash-item-card" data-id="${item.id}" style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px; transition: all 0.2s ease;">
            <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
              <input type="checkbox" class="trash-item-chk" data-id="${item.id}" style="width: 18px; height: 18px; accent-color: #f59e0b; cursor: pointer; flex-shrink: 0;">
              <div style="display: flex; flex-direction: column; gap: 3px; min-width: 0;">
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                  <span style="font-size: 10.5px; font-weight: 800; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 1px 6px; border-radius: 4px;">${agencyName}</span>
                  <span style="font-size: 12px; font-weight: 900; color: #fbbf24;">#${sosId}</span>
                  <span style="font-size: 10px; color: #f87171; background: rgba(239, 68, 68, 0.12); padding: 1px 6px; border-radius: 4px; font-weight: 700;">⏱️ Còn ${remainingStr} trước khi xóa vĩnh viễn</span>
                </div>
                <div style="font-size: 12px; font-weight: 700; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">📍 ${address}</div>
                <div style="font-size: 11px; color: #94a3b8;">👤 Người báo: <b style="color: #cbd5e1;">${reporter}</b> · Sự cố: <i>${notes}</i></div>
              </div>
            </div>
            <button type="button" class="btn-restore-single-trash" data-id="${item.id}" style="background: rgba(245, 158, 11, 0.2); border: 1px solid #f59e0b; color: #fbbf24; border-radius: 8px; font-size: 11.5px; font-weight: 800; padding: 6px 12px; cursor: pointer; white-space: nowrap; flex-shrink: 0; transition: all 0.2s ease;">
              ↩️ Khôi phục
            </button>
          </div>
        `;
      }).join('');

      this.bindTrashListEvents();
    } catch (e) {
      console.error(e);
      container.innerHTML = '<div style="color: #f87171; text-align: center; padding: 20px;">Lỗi khi tải dữ liệu thùng rác.</div>';
    }
  }

  bindTrashListEvents() {
    const chkSelectAll = document.getElementById('chkTrashSelectAll');
    const chkItems = document.querySelectorAll('.trash-item-chk');
    const selectedCountText = document.getElementById('trashSelectedCountText');
    const selectedBtnCount = document.getElementById('btnRestoreSelectedCount');

    const updateCounts = () => {
      const checkedBoxes = document.querySelectorAll('.trash-item-chk:checked');
      const count = checkedBoxes.length;
      if (selectedCountText) selectedCountText.textContent = count;
      if (selectedBtnCount) selectedBtnCount.textContent = count;
      if (chkSelectAll) chkSelectAll.checked = (count > 0 && count === chkItems.length);
    };

    if (chkSelectAll) {
      chkSelectAll.onclick = () => {
        chkItems.forEach(c => c.checked = chkSelectAll.checked);
        updateCounts();
      };
    }

    chkItems.forEach(c => {
      c.onchange = updateCounts;
    });

    document.querySelectorAll('.btn-restore-single-trash').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        await this.undoHistoryDelete(id);
        await this.renderTrashModalList();
      };
    });
  }

  initTrashModalEvents() {
    if (this._trashEventsInited) return;
    this._trashEventsInited = true;

    const btnClose = document.getElementById('btnCloseHistoryTrashModal');
    if (btnClose) {
      btnClose.onclick = () => this.closeHistoryTrashModal();
    }

    const modal = document.getElementById('historyTrashModal');
    if (modal) {
      modal.onclick = (e) => {
        if (e.target === modal) this.closeHistoryTrashModal();
      };
    }

    const btnRestoreSelected = document.getElementById('btnRestoreSelectedTrash');
    if (btnRestoreSelected) {
      btnRestoreSelected.onclick = async () => {
        const checkedBoxes = Array.from(document.querySelectorAll('.trash-item-chk:checked'));
        const ids = checkedBoxes.map(c => c.dataset.id).filter(Boolean);
        if (ids.length === 0) {
          alert('⚠️ Vui lòng tích chọn ít nhất 1 phiếu cần hoàn tác/khôi phục!');
          return;
        }

        try {
          const res = await fetch('/api/dispatcher/history/undo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
          });
          const data = await res.json();
          if (data.ok) {
            if (Array.isArray(data.restoredIncidents)) {
              data.restoredIncidents.forEach(inc => {
                if (inc && inc.id) this.incidents.set(inc.id, inc);
              });
            }
            this.renderQueue();
            this.renderHistoryList();
            this.updateUndoButtonBadge(data.trashCount || 0);
            alert(`🎉 ${data.message || `Đã khôi phục thành công ${ids.length} phiếu vào lịch sử!`}`);
            if (data.trashCount > 0) {
              await this.renderTrashModalList();
            } else {
              this.closeHistoryTrashModal();
            }
          } else {
            alert('Lỗi: ' + (data.error || 'Không thể khôi phục'));
          }
        } catch (e) {
          console.error(e);
          alert('Không thể kết nối máy chủ để khôi phục.');
        }
      };
    }

    const btnRestoreAll = document.getElementById('btnRestoreAllTrash');
    if (btnRestoreAll) {
      btnRestoreAll.onclick = async () => {
        if (!confirm('Bạn có chắc chắn muốn khôi phục TẤT CẢ các phiếu trong thùng rác về lại lịch sử sự cố?')) return;
        try {
          const res = await fetch('/api/dispatcher/history/undo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ all: true })
          });
          const data = await res.json();
          if (data.ok) {
            if (Array.isArray(data.restoredIncidents)) {
              data.restoredIncidents.forEach(inc => {
                if (inc && inc.id) this.incidents.set(inc.id, inc);
              });
            }
            this.renderQueue();
            this.renderHistoryList();
            this.updateUndoButtonBadge(0);
            alert(`🎉 ${data.message || 'Đã khôi phục toàn bộ thùng rác vào lịch sử!'}`);
            this.closeHistoryTrashModal();
          } else {
            alert('Lỗi: ' + (data.error || 'Không thể khôi phục'));
          }
        } catch (e) {
          console.error(e);
          alert('Không thể kết nối máy chủ.');
        }
      };
    }

    const btnEmptyTrash = document.getElementById('btnTrashEmptyAll');
    if (btnEmptyTrash) {
      btnEmptyTrash.onclick = async () => {
        if (!confirm('⚠️ CẢNH BÁO NGUY HIỂM:\nBạn có chắc chắn muốn DỌN SẠCH VĨNH VIỄN toàn bộ thùng rác?\nSau khi dọn sạch, các phiếu này sẽ KHÔNG THỂ khôi phục lại được nữa!')) return;
        try {
          const res = await fetch('/api/dispatcher/history/trash/empty', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          const data = await res.json();
          if (data.ok) {
            this.updateUndoButtonBadge(0);
            alert('🧹 Đã dọn sạch vĩnh viễn thùng rác!');
            this.closeHistoryTrashModal();
          } else {
            alert('Lỗi: ' + (data.error || 'Không thể dọn thùng rác'));
          }
        } catch (e) {
          console.error(e);
          alert('Không thể kết nối máy chủ.');
        }
      };
    }
  }

  async undoHistoryDelete(id = null) {
    if (!id) {
      // If no specific ID provided, open the selective undo trash modal!
      return this.openHistoryTrashModal();
    }

    try {
      const res = await fetch('/api/dispatcher/history/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.ok) {
        if (Array.isArray(data.restoredIncidents)) {
          data.restoredIncidents.forEach(inc => {
            if (inc && inc.id) this.incidents.set(inc.id, inc);
          });
        }
        this.renderQueue();
        this.renderHistoryList();
        this.hideUndoToast();
        this.updateUndoButtonBadge(data.trashCount || 0);
        alert(`🎉 ${data.message || 'Đã khôi phục thành công ca sự cố vào lịch sử!'}`);
      } else {
        alert('Lỗi hoàn tác: ' + (data.error || 'Không thể khôi phục'));
      }
    } catch (e) {
      console.error(e);
      alert('Không thể kết nối máy chủ để hoàn tác.');
    }
  }


  showUndoToast(message, trashCount = 1) {
    const toast = document.getElementById('historyUndoToast');
    const toastText = document.getElementById('historyUndoToastText');
    if (!toast) return;

    if (toastText) toastText.textContent = message;
    toast.style.display = 'flex';

    this.updateUndoButtonBadge(trashCount);

    if (this._undoToastTimer) clearTimeout(this._undoToastTimer);
    this._undoToastTimer = setTimeout(() => {
      this.hideUndoToast();
    }, 10000); // 10 seconds auto dismiss
  }

  hideUndoToast() {
    const toast = document.getElementById('historyUndoToast');
    if (toast) toast.style.display = 'none';
    if (this._undoToastTimer) clearTimeout(this._undoToastTimer);
  }

  updateUndoButtonBadge(count = 0) {
    const btnUndo = document.getElementById('btnUndoHistoryDelete');
    const countBadge = document.getElementById('undoDeleteCountBadge');
    if (btnUndo) {
      if (count > 0) {
        btnUndo.style.display = 'inline-flex';
        btnUndo.title = `Khôi phục ${count} ca sự cố đã xóa (Có hiệu lực hoàn tác trong vòng 24 giờ kể từ khi xóa)`;
        if (countBadge) countBadge.textContent = count;
      } else {
        btnUndo.style.display = 'none';
      }
    }
  }

  async clearHistoryArchive() {
    const historyCount = Array.from(this.incidents.values()).filter(i => i && i.status === 'resolved').length;
    if (historyCount === 0) {
      alert('Danh sách lịch sử hiện đang trống.');
      return;
    }
    if (!confirm(`Bạn có chắc chắn muốn dọn dẹp ${historyCount} ca sự cố đã hoàn tất khỏi lịch sử?\n\n(Lưu ý: Bạn có thể hoàn tác trong vòng 24 giờ kể từ khi xóa. Sau 24 giờ, toàn bộ dữ liệu sẽ bị xóa vĩnh viễn)`)) return;

    try {
      // Hiển thị trạng thái đang xử lý
      if (this.btnClearHistoryArchive) {
        this.btnClearHistoryArchive.disabled = true;
        this.btnClearHistoryArchive.textContent = '⏳ Đang dọn dẹp...';
      }
      const res = await fetch('/api/dispatcher/history/clear', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        // Optimistic update: xóa ngay resolved incidents khỏi Map client
        // để UI phản hồi tức thì, không đợi SSE (SSE vẫn sync sau để đảm bảo tính nhất quán)
        let localDeleted = 0;
        for (const [id, inc] of this.incidents.entries()) {
          if (inc && inc.status === 'resolved') {
            this.incidents.delete(id);
            localDeleted++;
          }
        }
        this.renderQueue();
        this.renderHistoryList();
        this.showUndoToast(`🧹 Đã dọn dẹp ${data.deletedCount || localDeleted} ca sự cố (Có thể hoàn tác trong 24h)`, data.trashCount || data.deletedCount || localDeleted);
      } else {
        alert('Lỗi: ' + (data.error || 'Không thể xóa lịch sử'));
      }
    } catch (e) {
      console.error('clearHistoryArchive error:', e);
      alert('Không thể kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      // Khôi phục trạng thái nút
      if (this.btnClearHistoryArchive) {
        this.btnClearHistoryArchive.disabled = false;
        this.btnClearHistoryArchive.innerHTML = '🧹 Dọn dẹp';
      }
    }
  }


  
  showIncidentDrawer(inc) {
    if (this.panelHistoryView) this.panelHistoryView.style.display = 'none';
    this.tabBtnHistory?.classList.remove('is-active');
    this.tabBtnIncidents?.classList.add('is-active');
    const incidentsPanel = document.getElementById('panelIncidentsView');
    if (incidentsPanel) incidentsPanel.style.display = 'flex';
    const queueList = this.incidentQueueList || document.getElementById('incidentQueueList');
    const emptyState = this.queueEmptyCosmicState || document.getElementById('queueEmptyCosmicState');
    const drawer = this.activeIncidentDrawer || document.getElementById('activeIncidentDrawer');
    const headerTitle = document.getElementById('drawerHeaderTitle');
    if (headerTitle && inc) {
      headerTitle.textContent = `Hồ Sơ #${inc.id}`;
    }
    if (queueList) queueList.style.display = 'none';
    if (emptyState) {
      emptyState.style.display = 'none';
      emptyState.style.setProperty('display', 'none', 'important');
    }
    if (drawer) {
      drawer.classList.remove('is-hidden');
      drawer.style.display = 'flex';
      drawer.style.removeProperty('display');
      drawer.scrollTop = 0;
      document.body.classList.add('tac-incident-selected');
      if (this.map && typeof this.map.resize === 'function') {
        setTimeout(() => this.map.resize(), 60);
      }
    }
  }

  showQueueView() {
    this.isUserClosedDrawer = true;
    const queueList = this.incidentQueueList || document.getElementById('incidentQueueList');
    const drawer = this.activeIncidentDrawer || document.getElementById('activeIncidentDrawer');
    const detailPanel = document.getElementById('tacticalDetailPanel');
    const geofenceHud = document.getElementById('tacticalWardGeofenceHud');

    // 1. Force hide incident drawer with !important and helper class
    if (drawer) {
      drawer.classList.add('is-hidden');
      drawer.style.display = 'none';
      drawer.style.setProperty('display', 'none', 'important');
    }

    // 2. Remove mobile/tablet detail view state from body
    document.body.removeAttribute('data-tac-view');
    document.body.classList.remove('tac-incident-selected');
    if (this.map && typeof this.map.resize === 'function') {
      setTimeout(() => this.map.resize(), 60);
    }
    if (detailPanel) {
      detailPanel.classList.remove('has-incident');
    }

    // 3. Clear selected incident
    this.selectedIncidentId = null;

    // 4. Force restore incident queue list display
    if (queueList) {
      queueList.classList.remove('is-hidden');
      queueList.style.display = 'flex';
      queueList.style.setProperty('display', 'flex', 'important');
    }

    // 5. Re-render queue with updated selection state
    this.renderQueue();

    // 6. Synchronize TacticalLayout view state
    if (window.TacticalLayout) {
      if (window.innerWidth <= 992) {
        window.TacticalLayout.setView('queue');
      } else {
        document.body.removeAttribute('data-tac-view');
      }
    }

    // 7. Clear citizen marker, route, and ward hud from map
    if (this.mapController) {
      if (typeof this.mapController.clearCitizenMarker === 'function') {
        this.mapController.clearCitizenMarker();
      }
      if (typeof this.mapController.clearVehicleMarker === 'function') {
        this.mapController.clearVehicleMarker();
      }
      if (this.mapController.map && this.mapController.map.getSource('route-source')) {
        this.mapController.map.getSource('route-source').setData({ type: 'FeatureCollection', features: [] });
      }
    }
    if (geofenceHud) {
      geofenceHud.style.display = 'none';
    }
  }

  selectIncident(id) {
    this.isUserClosedDrawer = false;
    this.selectedIncidentId = id;
    const inc = this.incidents.get(id);
    if (!inc) return;

    this.updateDrawer(inc);
    this.showIncidentDrawer(inc);
    this.renderQueue();

    // On mobile, tapping an incident smoothly transitions to the detail dossier
    if (window.innerWidth <= 992 && window.TacticalLayout) {
      window.TacticalLayout.setView('detail');
    }

    if (this.mapController && this.mapController.map) {
      this.mapController.map.flyTo({
        center: [inc.lng, inc.lat],
        zoom: 15,
        duration: 1200
      });
      this.mapController.setCitizenMarker(inc.lat, inc.lng, `${inc.reporterName} (${inc.reporterPhone})`);
      const unit = inc.dispatchUnit || inc.assignedUnit;
      if (unit && unit.lat && unit.lng) {
        this.mapController.setStationMarker(unit.lat, unit.lng, unit.unitName || unit.name, inc.agency);
        this.mapController.drawRoute([unit.lng, unit.lat], [inc.lng, inc.lat]);
      }

      // Highlight the commune/ward boundary of the incident (without snapping camera / auto-fitting bounds)
      if (inc.wardBoundary) {
        this.mapController.highlightWardBoundary(inc.wardBoundary, { color: '#eab308', fitBounds: false });
        this.showWardHud(inc.wardBoundary);
      } else if (inc.jurisdiction && inc.jurisdiction.boundary) {
        this.mapController.highlightWardBoundary(inc.jurisdiction.boundary, { color: '#eab308', fitBounds: false });
        this.showWardHud(inc.jurisdiction.boundary);
      } else {
        // Fetch boundary on the fly
        fetch(`/api/geo/locate-ward?lat=${inc.lat}&lng=${inc.lng}&address=${encodeURIComponent(inc.address || '')}`)
          .then(r => r.json())
          .then(d => {
            if (d.ok && d.boundary && this.mapController) {
              this.mapController.highlightWardBoundary(d.boundary, { color: '#eab308', fitBounds: false });
              this.showWardHud(d.boundary);
            }
          }).catch(() => {});
      }
    }
  }

  updateDrawer(inc) {
    const queueList = this.incidentQueueList || document.getElementById('incidentQueueList');
    const emptyState = this.queueEmptyCosmicState || document.getElementById('queueEmptyCosmicState');
    const drawer = this.activeIncidentDrawer || document.getElementById('activeIncidentDrawer');
    const headerTitle = document.getElementById('drawerHeaderTitle');
    if (headerTitle) {
      headerTitle.textContent = `Hồ Sơ #${inc.id}`;
    }

    if (queueList) queueList.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
    if (drawer) {
      drawer.classList.remove('is-hidden');
      drawer.style.display = 'flex';
      drawer.style.removeProperty('display');
    }

    // Auto-Routing to Nearest Unit Notice for Unmapped Wards
    const autoRoutedEl = document.getElementById('drawerAutoRoutedNotice');
    const autoRoutedText = document.getElementById('drawerAutoRoutedNoticeText');
    if (autoRoutedEl) {
      if (inc.assignedUnit && inc.assignedUnit.isAutoRoutedNearest) {
        autoRoutedEl.style.display = 'flex';
        if (autoRoutedText) {
          autoRoutedText.innerHTML = `<strong>ĐIỀU PHỐI LIÊN VÙNG TỰ ĐỘNG:</strong> Địa bàn sở tại (<b>${inc.assignedUnit.originalWard || inc.jurisdiction?.ward || 'hiện trường'}</b>) chưa hoàn thiện dữ liệu số trực ban. Hệ thống đã tự động gán cho đơn vị trực ban gần nhất: <b>${inc.assignedUnit.name}</b> (cách <b>${inc.assignedUnit.distanceKm || 'gần'} km</b>) thuộc lực lượng <b>${inc.agencyName || 'Cứu hộ'}</b>.`;
        }
      } else {
        autoRoutedEl.style.display = 'none';
      }
    }

    this.drawerSosId.textContent = `#${inc.id}`;
    this.drawerStatusBadge.className = `tracking-badge-status ${inc.status}`;
    this.drawerStatusBadge.textContent = inc.status === 'pending' ? 'Chờ tiếp nhận' : (inc.status === 'escalated' ? 'Đã leo thang cấp Tỉnh/TP' : inc.status === 'dispatching' ? 'Đang điều phối' : inc.status === 'arrived' ? 'Đã tới nơi' : 'Hoàn tất');

    const phoneDisplay = inc.reporterPhone || 'Chưa rõ';
    this.drawerReporter.innerHTML = `Người báo: <b>${inc.reporterName || 'Chưa rõ'}</b> · SĐT: <span style="color:#38bdf8; font-weight:700;">📞 ${phoneDisplay}</span> <button type="button" id="btnDrawerStartVoiceCall" style="background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; color: #34d399; font-size: 10.5px; font-weight: 700; border-radius: 6px; padding: 2px 8px; margin-left: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;"><span>📞</span> Gọi & Ghi âm 2 bên</button>`;
    const btnDrawerCall = document.getElementById('btnDrawerStartVoiceCall');
    if (btnDrawerCall) {
      btnDrawerCall.onclick = () => this.openDispatcherVoiceCall(inc.id);
    }

    this.drawerAddress.textContent = `📍 ${inc.address || 'Không xác định'} (${inc.jurisdiction ? inc.jurisdiction.ward : 'Cơ sở'}, ${inc.jurisdiction ? inc.jurisdiction.province : ''})`;
    this.drawerTags.textContent = `Sự cố: ${(inc.incidentTags || []).join(', ')} ${inc.customNotes ? '(' + inc.customNotes + ')' : ''}`;

    const unit = inc.dispatchUnit || inc.assignedUnit;
    const originParam = (unit && unit.lat && unit.lng) ? `&origin=${unit.lat},${unit.lng}` : '';
    const carUrl = `https://www.google.com/maps/dir/?api=1${originParam}&destination=${inc.lat},${inc.lng}&travelmode=driving`;
    const motoUrl = `https://www.google.com/maps/dir/?api=1${originParam}&destination=${inc.lat},${inc.lng}&travelmode=two_wheeler`;

    const btnCar = document.getElementById('btnDispatcherGmapsCar');
    const btnMoto = document.getElementById('btnDispatcherGmapsMoto');
    if (btnCar) btnCar.href = carUrl;
    if (btnMoto) btnMoto.href = motoUrl;
    if (this.btnDispatcherGmaps) this.btnDispatcherGmaps.href = carUrl;

    // Render incident photos/videos from citizen
    const mediaSection = document.getElementById('drawerMediaSection');
    const mediaGrid = document.getElementById('drawerMediaGrid');
    if (mediaSection && mediaGrid) {
      if (Array.isArray(inc.media) && inc.media.length > 0) {
        mediaSection.style.display = 'block';
        mediaGrid.innerHTML = '';
        inc.media.forEach(m => {
          if (m.type === 'video') {
            const vid = document.createElement('video');
            vid.src = m.dataUrl;
            vid.controls = true;
            vid.playsInline = true;
            vid.style = 'width: 110px; height: 110px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(0, 210, 255, 0.4);';
            mediaGrid.appendChild(vid);
          } else {
            const img = document.createElement('img');
            img.src = m.dataUrl;
            img.style = 'width: 110px; height: 110px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(0, 210, 255, 0.4); cursor: pointer;';
            img.title = 'Bấm để phóng to ảnh hiện trường';
            img.addEventListener('click', () => {
              const win = window.open('');
              win.document.write(`<body style="margin:0; background:#0b0f19; display:flex; align-items:center; justify-content:center; height:100vh;"><img src="${m.dataUrl}" style="max-width:95vw; max-height:95vh; border-radius:12px; box-shadow:0 10px 40px rgba(0,0,0,0.8);"></body>`);
            });
            mediaGrid.appendChild(img);
          }
        });
      } else {
        mediaSection.style.display = 'none';
      }
    }

    const assigned = inc.dispatchUnit || inc.assignedUnit;
    if (this.drawerChannelDetails && inc.dispatchChannels) {
      this.drawerChannelDetails.innerHTML = `
        <div style="display: flex; align-items: center; gap: 4px;"><svg class="svg-ico ico-xs ico-blue" viewBox="0 0 24 24"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h6M9 13h6M9 17h6"></path></svg> <b>Đơn vị:</b> <span style="color:#60a5fa; font-weight:700;">${assigned?.name || assigned?.unitName || 'Trực ban'}</span></div>
        <div style="display: flex; align-items: center; gap: 4px;"><svg class="svg-ico ico-xs ico-amber" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> <b>Trụ sở:</b> <span style="color:#cbd5e1;">${assigned?.address || assigned?.stationAddress || 'Trụ sở đơn vị'}</span></div>
        <div style="display: flex; align-items: center; gap: 4px;"><svg class="svg-ico ico-xs ico-emerald" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> <b>SĐT:</b> <span style="color:#34d399; font-weight:700;">${assigned?.phone || '113'}</span> · <b>SMS:</b> ${assigned?.sms || '0988 113 113'}</div>
        <div style="display: flex; align-items: center; gap: 4px;"><svg class="svg-ico ico-xs ico-purple" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> <b>Cán bộ:</b> ${assigned?.officerFullTitle || assigned?.officerName || 'Kíp trực ban'}</div>
        <div style="display: flex; align-items: center; gap: 4px;"><svg class="svg-ico ico-xs ico-blue" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> <b>Voice AI:</b> Tự động gọi đọc lặp lại 3 lần ✓</div>
        <div style="display: flex; align-items: center; gap: 4px;"><svg class="svg-ico ico-xs ico-white" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> <b>Email:</b> ${assigned?.email || 'email@sos.gov.vn'}</div>
      `;
    }

    const isWardOfficer = Boolean(this.currentOfficer && this.currentOfficer.level === 'ward');
    const isReadOnlySameTerritory = Boolean(inc.readOnlySameTerritory);

    let restrictedNotice = document.getElementById('drawerSameTerritoryNotice');
    if (!restrictedNotice) {
      restrictedNotice = document.createElement('div');
      restrictedNotice.id = 'drawerSameTerritoryNotice';
      restrictedNotice.style = 'background: rgba(148, 163, 184, 0.15); border: 1px solid rgba(148, 163, 184, 0.4); border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; color: #cbd5e1; font-size: 11.5px; line-height: 1.5; display: none;';
      const drawerBody = drawer ? (drawer.querySelector('.drawer-body') || drawer) : null;
      if (drawerBody) drawerBody.insertBefore(restrictedNotice, drawerBody.firstChild);
    }

    if (isReadOnlySameTerritory) {
      restrictedNotice.style.display = 'block';
      restrictedNotice.innerHTML = `🛡️ <b>CHẾ ĐỘ THEO DÕI SỐ LIỆU ĐỊA BÀN:</b> Ca sự cố này do <b>${inc.agencyName || 'Lực lượng chuyên trách'}</b> thụ lý chính trên cùng địa bàn. Đơn vị chỉ theo dõi số liệu phục vụ báo cáo chung, không có thẩm quyền thao tác xử lý hay tải tài liệu từ ca này.`;
      if (btnDrawerCall) btnDrawerCall.style.display = 'none';
      if (this.btnStartVideoCall) this.btnStartVideoCall.style.display = 'none';
      if (this.btnAcceptSOS) this.btnAcceptSOS.style.display = 'none';
      if (this.btnDeEscalateSOS) this.btnDeEscalateSOS.style.display = 'none';
      if (this.btnMarkArrived) this.btnMarkArrived.style.display = 'none';
      if (this.btnMarkResolved) this.btnMarkResolved.style.display = 'none';
      if (this.btnFlagFakeAlarm) this.btnFlagFakeAlarm.style.display = 'none';
      if (this.drawerEscalatedWardNotice) this.drawerEscalatedWardNotice.style.display = 'none';
      const docxBtn = document.getElementById('btnExportDossierDocx');
      const pdfBtn = document.getElementById('btnExportDossierPdf');
      if (docxBtn) docxBtn.style.display = 'none';
      if (pdfBtn) pdfBtn.style.display = 'none';
    } else {
      restrictedNotice.style.display = 'none';
      if (btnDrawerCall) btnDrawerCall.style.display = 'inline-flex';
      if (this.btnStartVideoCall) this.btnStartVideoCall.style.display = 'inline-flex';
      const docxBtn = document.getElementById('btnExportDossierDocx');
      const pdfBtn = document.getElementById('btnExportDossierPdf');
      if (docxBtn) docxBtn.style.display = 'inline-flex';
      if (pdfBtn) pdfBtn.style.display = 'inline-flex';

      if (this.btnFlagFakeAlarm) {
        if (inc.status === 'fake_alarm') {
          this.btnFlagFakeAlarm.style.display = 'inline-flex';
          this.btnFlagFakeAlarm.innerHTML = '<span style="font-size: 13px;">🕵️‍♂️</span> XEM DẤU VẾT OSINT (ĐÃ BÁO KHỐNG)';
        } else if (inc.status === 'resolved') {
          this.btnFlagFakeAlarm.style.display = 'none';
        } else {
          this.btnFlagFakeAlarm.style.display = 'inline-flex';
          this.btnFlagFakeAlarm.innerHTML = '<span style="font-size: 13px;">🚨</span> BÁO KHỐNG / HIỆN TRƯỜNG GIẢ (OSINT TRACE)';
        }
      }

      const isNationalCommand = Boolean(this.currentOfficer && (this.currentOfficer.level === 'national' || this.currentOfficer.username === 'admin' || this.currentOfficer.agency === 'chihuy'));
      const natCard = document.getElementById('drawerNationalOversightCard');

      if (isNationalCommand) {
        // Cấp quốc gia CHỈ COI / GIÁM SÁT, tuyệt đối KHÔNG tiếp nhận thay cơ sở
        if (this.btnAcceptSOS) this.btnAcceptSOS.style.display = 'none';
        if (this.btnDeEscalateSOS) this.btnDeEscalateSOS.style.display = 'none';
        if (this.drawerEscalatedWardNotice) this.drawerEscalatedWardNotice.style.display = 'none';
        if (this.btnMarkArrived) this.btnMarkArrived.style.display = 'none';
        if (this.btnMarkResolved) this.btnMarkResolved.style.display = 'none';
        if (this.btnFlagFakeAlarm) this.btnFlagFakeAlarm.style.display = 'none';

        if (natCard) {
          natCard.style.display = 'block';
          const elUnit = document.getElementById('natOversightUnitName');
          const elOff = document.getElementById('natOversightOfficer');
          const elPh = document.getElementById('natOversightPhone');
          const elPhLink = document.getElementById('natOversightPhoneLink');
          const elCallBtn = document.getElementById('natOversightCallBtn');
          const elVideoBtn = document.getElementById('natOversightVideoBtn') || document.getElementById('natOversightFlyBtn');
          const elLocBox = document.getElementById('natOversightLocationBox');
          const elLoc = document.getElementById('natOversightLocation');
          const elLat = document.getElementById('natOversightLat');
          const elLng = document.getElementById('natOversightLng');

          const assigned = inc.assignedUnit || inc.dispatchUnit || {};
          const assignedName = assigned.name || assigned.unitName || (inc.agency === 'police' ? 'Công An Cơ Sở' : 'Đơn Vị Tác Chiến Địa Bàn');
          const officerTitle = assigned.officerFullTitle || assigned.officerName || 'Trực ban tác chiến';
          const assignedPhone = assigned.phone || '0292 3899 113';
          const cleanPhone = assignedPhone.replace(/\s+/g, '');

          if (elUnit) elUnit.textContent = assignedName;
          if (elOff) elOff.textContent = officerTitle;
          if (elPh) elPh.textContent = assignedPhone;
          if (elPhLink) elPhLink.href = `tel:${cleanPhone}`;

          const targetUnitInfo = {
            name: assignedName,
            officerName: officerTitle,
            phone: assignedPhone
          };

          // 1. Khi nhấn vào số ĐT cán bộ / Hotline: chuyển sang quay cuộc gọi điện thoại (tel:)
          if (elPhLink) {
            elPhLink.href = `tel:${cleanPhone}`;
            elPhLink.title = `Nhấn vào số điện thoại để quay cuộc gọi trực tiếp: ${cleanPhone}`;
          }

          // 2. Nút Gọi Thường: Chỉ mở kênh đàm thoại VoIP trực tiếp của hệ thống (KHÔNG gọi tel: để tránh đè lên ứng dụng gọi số)
          if (elCallBtn) {
            elCallBtn.onclick = (e) => {
              e.preventDefault();
              this.openDispatcherVoiceCall(inc.id, false, targetUnitInfo);
            };
          }

          // 3. Nút Gọi Video: Kết nối trực tiếp cuộc gọi video tác chiến tới công an / đơn vị khu vực đó
          if (elVideoBtn) {
            elVideoBtn.onclick = (e) => {
              e.preventDefault();
              this.startDispatcherVideoCall(inc.id, false, targetUnitInfo);
            };
          }

          // 4. Khối tọa độ GPS hiện trường: Nhấn để định vị GPS trên bản đồ
          if (elLocBox) {
            elLocBox.onclick = () => {
              if (this.mapController && inc.lat && inc.lng) {
                this.mapController.panTo(inc.lat, inc.lng, 16);
              }
            };
          }

          if (elLoc) elLoc.textContent = inc.address || `${inc.ward || ''}, ${inc.province || ''}` || 'Hiện trường sự cố';
          if (elLat) elLat.textContent = inc.lat ? Number(inc.lat).toFixed(5) : '0';
          if (elLng) elLng.textContent = inc.lng ? Number(inc.lng).toFixed(5) : '0';
        }
      } else {
        if (natCard) natCard.style.display = 'none';
        if (inc.status === 'fake_alarm') {
          this.btnAcceptSOS.style.display = 'none';
          if (this.btnDeEscalateSOS) this.btnDeEscalateSOS.style.display = 'none';
          if (this.drawerEscalatedWardNotice) this.drawerEscalatedWardNotice.style.display = 'none';
          this.btnMarkArrived.style.display = 'none';
          this.btnMarkResolved.style.display = 'none';
        } else if (inc.status === 'dispatching' || inc.status === 'arrived') {
          this.btnAcceptSOS.style.display = 'none';
          if (this.btnDeEscalateSOS) this.btnDeEscalateSOS.style.display = 'none';
          if (this.drawerEscalatedWardNotice) this.drawerEscalatedWardNotice.style.display = 'none';
          this.btnMarkArrived.style.display = inc.status === 'arrived' ? 'none' : 'block';
          this.btnMarkResolved.style.display = 'block';
        } else if (inc.status === 'resolved') {
          this.btnAcceptSOS.style.display = 'none';
          if (this.btnDeEscalateSOS) this.btnDeEscalateSOS.style.display = 'none';
          if (this.drawerEscalatedWardNotice) this.drawerEscalatedWardNotice.style.display = 'none';
          this.btnMarkArrived.style.display = 'none';
          this.btnMarkResolved.style.display = 'none';
        } else if (inc.status === 'escalated') {
          if (isWardOfficer) {
            // Cấp xã/phường không còn quyền xử lý khi ca đã leo thang
            this.btnAcceptSOS.style.display = 'none';
            if (this.btnDeEscalateSOS) this.btnDeEscalateSOS.style.display = 'none';
            if (this.drawerEscalatedWardNotice) this.drawerEscalatedWardNotice.style.display = 'block';
          } else {
            // Tuyến Tỉnh/TP có 2 quyền: Tiếp nhận trực tiếp HOẶC Chuyển trả về cấp Xã/Phường
            this.btnAcceptSOS.style.display = 'flex';
            this.btnAcceptSOS.innerHTML = '<svg class="svg-ico ico-sm ico-white" viewBox="0 0 24 24"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg> TIẾP NHẬN ĐIỀU PHỐI (CẤP TỈNH XỬ LÝ)';
            if (this.btnDeEscalateSOS) this.btnDeEscalateSOS.style.display = 'flex';
            if (this.drawerEscalatedWardNotice) this.drawerEscalatedWardNotice.style.display = 'none';
          }
          this.btnMarkArrived.style.display = 'none';
          this.btnMarkResolved.style.display = 'none';
        } else {
          // Pending
          this.btnAcceptSOS.style.display = 'flex';
          this.btnAcceptSOS.innerHTML = '<svg class="svg-ico ico-sm ico-white" viewBox="0 0 24 24"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg> TIẾP NHẬN & ĐIỀU ĐỘNG';
          if (this.btnDeEscalateSOS) this.btnDeEscalateSOS.style.display = 'none';
          if (this.drawerEscalatedWardNotice) this.drawerEscalatedWardNotice.style.display = 'none';
          this.btnMarkArrived.style.display = 'none';
          this.btnMarkResolved.style.display = 'none';
        }
      }
    }

    // Render direct 2-way chat messages
    this.renderDispatcherChat(inc);
  }

  addMapPinForIncident(inc, shouldFly = false) {
    if (!this.mapController || !this.mapController.map || !inc) return;
    this.mapController.setCitizenMarker(inc.lat, inc.lng, `${inc.agencyName || 'SOS'} - #${inc.id}`, shouldFly);
  }

  playAlarm() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioAlarmCtx) this.audioAlarmCtx = new AudioCtx();
      if (this.audioAlarmCtx.state === 'suspended') {
        this.audioAlarmCtx.resume().catch(() => {});
      }

      const now = this.audioAlarmCtx.currentTime;
      // High-priority dual-sweep emergency police siren sweep
      const osc = this.audioAlarmCtx.createOscillator();
      const gain = this.audioAlarmCtx.createGain();
      osc.type = 'sawtooth';

      osc.frequency.setValueAtTime(700, now);
      osc.frequency.linearRampToValueAtTime(1250, now + 0.25);
      osc.frequency.linearRampToValueAtTime(700, now + 0.5);
      osc.frequency.linearRampToValueAtTime(1250, now + 0.75);
      osc.frequency.linearRampToValueAtTime(700, now + 1.0);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.15);

      osc.connect(gain);
      gain.connect(this.audioAlarmCtx.destination);
      osc.start(now);
      osc.stop(now + 1.15);
    } catch (e) {
      console.warn('Could not play siren alarm:', e);
    }
  }

  playVoiceChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioChimeCtx) this.audioChimeCtx = new AudioCtx();
      if (this.audioChimeCtx.state === 'suspended') this.audioChimeCtx.resume();

      const now = this.audioChimeCtx.currentTime;
      // Ding-Dong crystal harmonic
      const osc1 = this.audioChimeCtx.createOscillator();
      const gain1 = this.audioChimeCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(this.audioChimeCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = this.audioChimeCtx.createOscillator();
      const gain2 = this.audioChimeCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1760, now + 0.15);
      gain2.gain.setValueAtTime(0.2, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(this.audioChimeCtx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.55);
    } catch (e) {}
  }

  getMatchedVoice() {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if (voices.length === 0) return null;

    const viVoices = voices.filter(v => 
      (v.lang && (v.lang.startsWith('vi') || v.lang.includes('VIE') || v.lang.includes('vi_VN') || v.lang.includes('vi-VN'))) ||
      (v.name && (v.name.toLowerCase().includes('vietnam') || v.name.toLowerCase().includes('tiếng việt') || v.name.toLowerCase().includes('hoaimy') || v.name.toLowerCase().includes('namminh')))
    );

    return viVoices[0] || voices[0] || null;
  }

  testVoicePrompt(cfg = {}) {
    if (!('speechSynthesis' in window)) {
      alert('Trình duyệt không hỗ trợ Web Speech API.');
      return;
    }

    window.speechSynthesis.cancel();
    if (cfg.playChime) this.playVoiceChime();

    const sampleText = "Trung tâm chỉ huy Quốc gia SOS Việt Nam thông báo: Đây là giọng đọc thử nghiệm cảnh báo khẩn cấp hệ thống. Tín hiệu âm thanh và giọng đọc hoạt động hoàn hảo!";
    const defaultPitch = 1.0;
    const defaultRate = 1.0;

    const utterance = new SpeechSynthesisUtterance(sampleText);
    utterance.lang = 'vi-VN';
    utterance.rate = cfg.rate !== undefined ? cfg.rate : defaultRate;
    utterance.pitch = cfg.pitch !== undefined ? cfg.pitch : defaultPitch;
    utterance.volume = 1.0;

    const matchedVoice = this.getMatchedVoice();
    if (matchedVoice) utterance.voice = matchedVoice;

    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, cfg.playChime ? 350 : 50);
  }

  stopVoiceAlert() {
    this.isSpeakingVoiceAi = false;
    if (this.voiceAiTimeout) {
      clearTimeout(this.voiceAiTimeout);
      this.voiceAiTimeout = null;
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch(e) {}
    }
    this.activeVoiceUtterance = null;
    if (this.sfxAlert) {
      this.sfxAlert.pause();
      this.sfxAlert.currentTime = 0;
    }
    if (this.btnPlayVoiceAi) {
      this.btnPlayVoiceAi.textContent = `🔊 Nghe Lại Voice AI (${(this.voiceConfig?.repeats || 3)} Lần)`;
    }
  }

  speakVoiceAlert(incident, repeatCount = null, prefix = '') {
    if (!('speechSynthesis' in window)) return;
    this.stopVoiceAlert();
    this.isSpeakingVoiceAi = true;

    // Fix Chromium/Cốc Cốc speech synthesis paused state
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch(e) {}

    const cfg = this.voiceConfig || { rate: 1.0, pitch: 1.0, repeats: 3, playChime: true };
    const maxRepeats = repeatCount !== null ? repeatCount : (cfg.repeats || 3);

    if (cfg.playChime) {
      this.playVoiceChime();
    }

    const tagStr = (incident.incidentTags && incident.incidentTags.length > 0) ? incident.incidentTags.join(', ') : 'Khẩn cấp';
    const ward = incident.jurisdiction ? (incident.jurisdiction.ward || incident.ward || 'địa bàn') : 'địa bàn cơ sở';
    const province = incident.jurisdiction ? (incident.jurisdiction.province || incident.province || '') : '';
    
    const message = `${prefix} Khẩn cấp! Khẩn cấp! Hệ thống SOS Quốc gia thông báo có sự cố ${tagStr} tại địa chỉ: ${incident.address || 'Vị trí bản đồ'}, thuộc ${ward}, ${province}. Người báo là ${incident.reporterName || 'Người dân'}, số điện thoại: ${incident.reporterPhone || 'Không rõ'}. Kính đề nghị cán bộ trực ban tiếp nhận và điều động lực lượng xử lý ngay lập tức!`;
    const defaultPitch = 1.0;
    const defaultRate = 1.0;

    let currentRepeat = 0;

    const playNext = () => {
      if (!this.isSpeakingVoiceAi || currentRepeat >= maxRepeats) {
        this.stopVoiceAlert();
        return;
      }

      currentRepeat++;
      if (this.btnPlayVoiceAi) {
        this.btnPlayVoiceAi.textContent = `🔊 Đang phát Voice AI (Lần ${currentRepeat}/${maxRepeats})... (Bấm để dừng)`;
      }

      const utterText = currentRepeat === 1 ? message : `Thông báo lặp lại lần thứ ${currentRepeat}: ${message}`;
      const utterance = new SpeechSynthesisUtterance(utterText);
      utterance.lang = 'vi-VN';
      utterance.rate = cfg.rate !== undefined ? cfg.rate : defaultRate;
      utterance.pitch = cfg.pitch !== undefined ? cfg.pitch : defaultPitch;
      utterance.volume = 1.0;

      const matchedVoice = this.getMatchedVoice();
      if (matchedVoice) utterance.voice = matchedVoice;

      utterance.onend = () => {
        this.activeVoiceUtterance = null;
        if (this.isSpeakingVoiceAi) {
          this.voiceAiTimeout = setTimeout(playNext, 1000);
        }
      };
      utterance.onerror = (err) => {
        this.activeVoiceUtterance = null;
        if (!this.isSpeakingVoiceAi || err.error === 'canceled' || err.error === 'interrupted') {
          return;
        }
        this.voiceAiTimeout = setTimeout(playNext, 1000);
      };

      // Retain reference on instance to prevent Garbage Collection cancellation on Chromium
      this.activeVoiceUtterance = utterance;

      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Voice AI speak error:', err);
      }
    };

    setTimeout(playNext, cfg.playChime ? 350 : 50);
  }

  async handleAcceptSOS() {
    this.stopVoiceAlert(); // Immediately stop siren & speech voice AI!

    if (this.currentOfficer?.level === 'national' || this.currentOfficer?.username === 'admin' || this.currentOfficer?.agency === 'chihuy') {
      alert('Đặc quyền Giám Sát Quốc Gia: Tài khoản Trung Tâm Chỉ Huy Quốc Gia chỉ có thẩm quyền giám sát và điều phối vĩ mô, không tiếp nhận trực tiếp thay đơn vị tác chiến địa phương!');
      return;
    }

    if (!this.selectedIncidentId) return;
    const inc = this.incidents.get(this.selectedIncidentId);
    if (!inc) return;

    this.btnAcceptSOS.disabled = true;
    this.btnAcceptSOS.textContent = 'ĐANG ĐIỀU ĐỘNG...';

    const dutyShift = this.currentDutyShift || {};
    const officer = this.currentOfficer || {};
    const assigned = inc.assignedUnit || {};

    const effectiveName = (dutyShift.officerName && dutyShift.officerName !== 'Đang cập nhật')
      ? dutyShift.officerName
      : ((officer.officerName && officer.officerName !== 'Đang cập nhật')
        ? officer.officerName
        : (assigned.officerName && assigned.officerName !== 'Đang cập nhật' ? assigned.officerName : 'Nguyễn Văn A'));
    const effectiveRank = (dutyShift.officerRank && dutyShift.officerRank !== 'Đang cập nhật')
      ? dutyShift.officerRank
      : ((officer.officerRank && officer.officerRank !== 'Đang cập nhật')
        ? officer.officerRank
        : (assigned.officerRank && assigned.officerRank !== 'Đang cập nhật' ? assigned.officerRank : 'Cán bộ trực ban'));
    const effectivePhone = dutyShift.officerPhone || officer.officerPhone || (assigned.phone !== 'Đang cập nhật' ? assigned.phone : '0988 123 456');

    const payload = {
      id: inc.id,
      unitName: officer.unitName || assigned.name || (inc.agency === 'police' ? 'Đội Tuần Tra Kiểm Soát Công An' : (inc.agency === 'csgt' ? 'Đội Tuần Tra CSGT' : (inc.agency === 'fire' ? 'Đội Cảnh Sát PCCC & CNCH' : 'Đội Cấp Cứu Y Tế'))),
      officerRank: effectiveRank,
      officerName: effectiveName,
      officerPhone: effectivePhone,
      officerLevel: officer.level || 'ward',
      etaMinutes: 5
    };

    try {
      const res = await fetch('/api/dispatcher/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.ok) {
        this.stopVoiceAlert();
        const updatedInc = data.incident || inc;
        this.incidents.set(updatedInc.id, updatedInc);
        this.selectedIncidentId = updatedInc.id;
        this.startVehicleSimulation(updatedInc);
        this.updateDrawer(updatedInc);
        this.showIncidentDrawer(updatedInc);
        this.renderQueue();
      } else {
        alert(data.error || 'Không thể tiếp nhận ca cứu hộ');
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi kết nối máy chủ khi tiếp nhận.');
    } finally {
      this.btnAcceptSOS.disabled = false;
      this.btnAcceptSOS.innerHTML = '<span>🚓</span> TIẾP NHẬN & ĐIỀU ĐỘNG';
    }
  }

  async handleDeEscalateSOS() {
    if (!this.selectedIncidentId) return;
    const inc = this.incidents.get(this.selectedIncidentId);
    if (!inc) return;

    const reason = prompt('Nhập lý do chuyển trả ca sự cố về cho Công An Cấp Xã/Phường địa bàn:', 'Yêu cầu lực lượng công an địa bàn sở tại tiếp cận xử lý trực tiếp.');
    if (reason === null) return;

    const officer = this.currentOfficer || {};
    try {
      const res = await fetch('/api/dispatcher/de-escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: inc.id,
          officerName: officer.officerName || 'Chỉ huy trực ban Tỉnh',
          officerRank: officer.officerRank || 'Thượng tá',
          reason: reason.trim()
        })
      });
      const data = await res.json();
      if (data.ok && data.incident) {
        this.incidents.set(data.incident.id, data.incident);
        this.renderQueue();
        this.updateDrawer(data.incident);
        alert(`✅ ĐÃ CHUYỂN TRẢ CA CỨU HỘ VỀ CẤP XÃ/PHƯỜNG THÀNH CÔNG!\n\n🏢 Đơn vị phụ trách cơ sở: ${data.incident.assignedUnit?.name}`);
      } else {
        alert('Lỗi: ' + (data.error || 'Không thể chuyển trả ca'));
      }
    } catch (e) {
      alert('Không thể kết nối máy chủ điều phối.');
    }
  }

  async handleUpdateStatus(status, message) {
    if (this.currentOfficer?.level === 'national' || this.currentOfficer?.username === 'admin' || this.currentOfficer?.agency === 'chihuy') {
      alert('Đặc quyền Giám Sát Quốc Gia: Tài khoản Trung Tâm Chỉ Huy Quốc Gia chỉ có thẩm quyền giám sát và điều phối vĩ mô, không cập nhật tiến độ thay đơn vị tác chiến địa phương!');
      return;
    }
    if (!this.selectedIncidentId) return;
    const resolvedIncId = this.selectedIncidentId;
    try {
      const res = await fetch('/api/dispatcher/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: resolvedIncId,
          status,
          message
        })
      });
      const data = await res.json();
      if (data.ok && status === 'resolved') {
        const inc = this.incidents.get(resolvedIncId);
        if (inc) {
          inc.status = 'resolved';
          inc.resolvedAt = inc.resolvedAt || new Date().toISOString();

          // Auto-hide: clear selection, hide drawer, clean map markers, re-render queue immediately
          this.selectedIncidentId = null;
          if (this.activeIncidentDrawer) {
            this.activeIncidentDrawer.style.display = 'none';
            this.activeIncidentDrawer.style.setProperty('display', 'none', 'important');
          }
          if (this.mapController) {
            this.mapController.clearCitizenMarker?.();
            this.mapController.clearVehicleMarker?.();
          }
          const geofenceHud = document.getElementById('tacticalWardGeofenceHud');
          if (geofenceHud) geofenceHud.style.display = 'none';
          this.renderQueue();

          // Open receipt modal after brief delay
          setTimeout(() => this.openReportModal(inc), 350);
        }
      } else if (data.ok) {
        // For other status updates (arrived, dispatching), refresh drawer
        const inc = this.incidents.get(resolvedIncId);
        if (inc && data.incident) {
          this.incidents.set(data.incident.id, data.incident);
          this.updateDrawer(data.incident);
        }
        this.renderQueue();
      }
    } catch (e) {
      console.error(e);
    }
  }

  getAgencyHeaderInfo(inc) {
    if (!inc) return { upper: 'CÔNG AN TP. CẦN THƠ', lower: 'CÔNG AN KHU VỰC' };
    const agency = (inc.agency || 'police').toLowerCase();
    const jur = inc.jurisdiction || {};
    const assigned = inc.dispatchUnit || inc.assignedUnit || {};
    let province = (jur.province || '').trim();
    const ward = (jur.ward || '').trim();
    const unitName = (assigned.name || assigned.unitName || '').trim();
    const isEscalated = inc.currentLevel === 'province' || inc.status === 'escalated' || unitName.toLowerCase().includes('tuyến tỉnh') || unitName.toLowerCase().includes('trụ sở');

    if (!province) {
      const addr = inc.address || assigned.address || '';
      for (const p of ['Cần Thơ', 'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Bình Dương', 'Đồng Nai', 'An Giang', 'Vĩnh Long']) {
        if (addr.toLowerCase().includes(p.toLowerCase()) || unitName.toLowerCase().includes(p.toLowerCase())) {
          province = p;
          break;
        }
      }
    }
    if (!province) province = 'Cần Thơ';

    const pClean = province.toUpperCase().replace(/^TP\.?\s*/i, '').replace(/^THÀNH PHỐ\s*/i, '').replace(/^TỈNH\s*/i, '').trim();
    const isCity = ['CẦN THƠ', 'HÀ NỘI', 'HỒ CHÍ MINH', 'ĐÀ NẴNG', 'HẢI PHÒNG', 'CAN THO', 'HA NOI', 'HO CHI MINH', 'DA NANG', 'HAI PHONG'].some(c => pClean.includes(c));
    const provTitle = isCity ? `TP. ${pClean}` : `TỈNH ${pClean}`;

    let upper = `CÔNG AN ${provTitle}`;
    let lower = 'CÔNG AN KHU VỰC';

    if (agency === 'csgt') {
      upper = `CÔNG AN ${provTitle}`;
      lower = 'PHÒNG CẢNH SÁT GIAO THÔNG';
      if (unitName && (unitName.toLowerCase().includes('đội') || unitName.toLowerCase().includes('trật tự'))) {
        lower = unitName.toUpperCase();
      }
    } else if (agency === 'fire' || agency === '114') {
      upper = `CÔNG AN ${provTitle}`;
      lower = 'PHÒNG CẢNH SÁT PCCC & CNCH';
      if (unitName && unitName.toLowerCase().includes('đội')) {
        lower = unitName.toUpperCase();
      }
    } else if (agency === 'hospital' || agency === '115' || agency === 'medical') {
      upper = `SỞ Y TẾ ${provTitle}`;
      lower = 'TRUNG TÂM CẤP CỨU 115';
      if (unitName && (unitName.toLowerCase().includes('bệnh viện') || unitName.toLowerCase().includes('ttyt'))) {
        lower = unitName.toUpperCase();
      }
    } else if (agency === 'traffic-rescue' || agency === 'rescue') {
      upper = `BAN AN TOÀN GIAO THÔNG ${provTitle}`;
      lower = 'TRUNG TÂM CỨU HỘ GIAO THÔNG';
    } else {
      if (isEscalated) {
        upper = 'BỘ CÔNG AN';
        lower = `CÔNG AN ${provTitle}`;
      } else {
        upper = `CÔNG AN ${provTitle}`;
        if (ward) {
          let wClean = ward.toUpperCase();
          if (!wClean.startsWith('PHƯỜNG') && !wClean.startsWith('XÃ') && !wClean.startsWith('THỊ TRẤN')) {
            wClean = `PHƯỜNG ${wClean}`;
          }
          lower = `CÔNG AN ${wClean}`;
        } else if (unitName && unitName.toLowerCase().includes('công an')) {
          lower = unitName.toUpperCase().replace('(TRỤ SỞ CHÍNH)', '').trim();
        } else {
          lower = `CÔNG AN KHU VỰC ${provTitle}`;
        }
      }
    }

    return { upper, lower };
  }

  formatDocDateLocation(inc) {
    if (!inc) return 'Cần Thơ, ngày 07 tháng 09 năm 2026';
    const PROVINCES = [
      'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu', 'Bắc Ninh',
      'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước', 'Bình Thuận', 'Cà Mau',
      'Cần Thơ', 'Cao Bằng', 'Đà Nẵng', 'Đắk Lắk', 'Đắk Nông', 'Điện Biên',
      'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang', 'Hà Nam', 'Hà Nội',
      'Hà Tĩnh', 'Hải Dương', 'Hải Phòng', 'Hậu Giang', 'Hòa Bình', 'Hưng Yên',
      'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu', 'Lâm Đồng', 'Lạng Sơn',
      'Lào Cai', 'Long An', 'Nam Định', 'Nghệ An', 'Ninh Bình', 'Ninh Thuận',
      'Phú Thọ', 'Phú Yên', 'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh',
      'Quảng Trị', 'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
      'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'TP. Hồ Chí Minh', 'Hồ Chí Minh',
      'Trà Vinh', 'Tuyên Quang', 'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái'
    ];

    let prov = (inc.province || inc.jurisdiction?.province || '').trim();
    if (!prov) {
      const searchStr = `${inc.address || ''} ${inc.incidentAddress || ''} ${inc.dispatchUnit?.address || ''} ${inc.dispatchUnit?.name || ''}`.toLowerCase();
      for (const p of PROVINCES) {
        if (searchStr.includes(p.toLowerCase())) {
          prov = p;
          break;
        }
      }
    }
    if (!prov) prov = 'Cần Thơ';

    let provClean = prov.replace(/^(Tỉnh|tỉnh|TP\.?|Thành phố)\s+/i, '').trim();
    let provDisplay = provClean;
    if (['hồ chí minh', 'tp. hồ chí minh', 'tp hồ chí minh'].includes(provClean.toLowerCase())) {
      provDisplay = 'TP. Hồ Chí Minh';
    } else if (provClean.toLowerCase() === 'hà nội') {
      provDisplay = 'Hà Nội';
    } else if (provClean.toLowerCase() === 'cần thơ') {
      provDisplay = 'Cần Thơ';
    } else if (provClean.toLowerCase() === 'đà nẵng') {
      provDisplay = 'Đà Nẵng';
    } else if (provClean.toLowerCase() === 'hải phòng') {
      provDisplay = 'Hải Phòng';
    } else {
      const matched = PROVINCES.find(p => p.toLowerCase() === provClean.toLowerCase());
      provDisplay = matched || provClean;
    }

    const rawTime = inc.incidentTime || inc.createdAt || inc.reportedTime || inc.time;
    let dt = new Date(rawTime || Date.now());
    if (isNaN(dt.getTime())) dt = new Date();

    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();

    return `${provDisplay}, ngày ${dd} tháng ${mm} năm ${yyyy}`;
  }

  getEffectiveOfficerName(inc, assigned = {}) {
    const saved = (inc?.savedReport?.officerName || '').trim();
    if (saved && saved !== 'Đang cập nhật') return saved;

    const signed = (inc?.signatures?.officer?.name || '').trim();
    if (signed && signed !== 'Đang cập nhật') return signed;

    const shift = this.currentDutyShift;
    if (shift) {
      if (shift.isSubstitute && shift.substitute?.officerName && shift.substitute.officerName !== 'Đang cập nhật') {
        const subRank = shift.substitute.officerRank || '';
        return subRank ? `${subRank} ${shift.substitute.officerName} (Trực Thay)` : `${shift.substitute.officerName} (Trực Thay)`;
      }
      if (shift.officerName && shift.officerName !== 'Đang cập nhật') {
        const rank = shift.officerRank || '';
        return rank ? `${rank} ${shift.officerName}` : shift.officerName;
      }
    }

    if (this.currentOfficer?.officerName && this.currentOfficer.officerName !== 'Đang cập nhật') {
      const rank = this.currentOfficer.officerRank || '';
      return rank ? `${rank} ${this.currentOfficer.officerName}` : this.currentOfficer.officerName;
    }

    const assignedTitle = (assigned?.officerFullTitle || '').trim();
    if (assignedTitle && assignedTitle !== 'Đang cập nhật') return assignedTitle;

    const assignedName = (assigned?.officerName || '').trim();
    if (assignedName && assignedName !== 'Đang cập nhật') {
      const rank = assigned?.officerRank || '';
      return rank ? `${rank} ${assignedName}` : assignedName;
    }

    return 'Trung sĩ Nguyễn Văn A (Trực Ban Tác Chiến)';
  }

  openReportModal(inc) {
    if (!inc?.id) return;

    // A completed incident intentionally clears the queue/drawer selection
    // before opening this dossier.  The dossier is still an actionable owner
    // of the incident (including its nested signature modal), so restore the
    // matching selection here instead of allowing signature confirmation to
    // exit silently without an incident ID.
    this.selectedIncidentId = inc.id;
    this.selectedIncident = inc;
    this.incidents.set(inc.id, inc);

    const modal = document.getElementById('incidentReportDocxModal');
    if (!modal) return;

    const agency = inc.agency || 'police';
    const isEscalated = inc.currentLevel === 'province' || inc.status === 'escalated';
    let assigned = inc.dispatchUnit || inc.assignedUnit || {};
    const jurisdiction = inc.jurisdiction || {};

    if (isEscalated) {
      const provName = jurisdiction.province || 'Cần Thơ';
      assigned = {
        name: `Công An TP. ${provName} (Trụ Sở Chính)`,
        unitName: `Công An TP. ${provName} (Trụ Sở Chính)`,
        address: `Số 9B Đường Trần Phú, Phường Cái Khế, TP. ${provName}`,
        stationAddress: `Số 9B Đường Trần Phú, Phường Cái Khế, TP. ${provName}`,
        phone: '0292 382 2113',
        sms: '0988 113 113',
        officerName: 'Đại tá Nguyễn Văn Thuận',
        officerFullTitle: 'Đại tá Nguyễn Văn Thuận (Chỉ huy trực ban CATP)',
        officerRank: 'Đại tá'
      };
    }

    const docSosId = document.getElementById('docSosId');
    const docIncidentTime = document.getElementById('docIncidentTime');
    const docOfficerName = document.getElementById('docOfficerName');
    const docUnitAddress = document.getElementById('docUnitAddress');
    const docUnitNameLabel = document.getElementById('docUnitNameLabel');
    const docUnitPhone = document.getElementById('docUnitPhone');
    const docUnitSms = document.getElementById('docUnitSms');
    const docReporterName = document.getElementById('docReporterName');
    const docReporterPhone = document.getElementById('docReporterPhone');
    const docIncidentCallTime = document.getElementById('docIncidentCallTime');
    const docIncidentAddress = document.getElementById('docIncidentAddress');
    const docIncidentCoords = document.getElementById('docIncidentCoords');
    const docGmapsLink = document.getElementById('docGmapsLink');
    const docIncidentDescription = document.getElementById('docIncidentDescription');
    const docHelpRequest = document.getElementById('docHelpRequest');
    const docAdviceGiven = document.getElementById('docAdviceGiven');
    const docResolutionResult = document.getElementById('docResolutionResult');
    const docSignReporter = document.getElementById('docSignReporter');
    const docSignOfficer = document.getElementById('docSignOfficer');

    const formattedTime = new Date(inc.createdAt || Date.now()).toLocaleString('vi-VN');
    const effectiveOfficer = this.getEffectiveOfficerName(inc, assigned);

    if (docSosId) docSosId.textContent = `#${inc.id}`;
    if (docIncidentTime) docIncidentTime.textContent = formattedTime;
    if (docOfficerName) docOfficerName.value = effectiveOfficer;
    if (docUnitAddress) docUnitAddress.value = assigned.address || assigned.stationAddress || `Trụ sở Công An ${jurisdiction.ward || 'Cơ sở'}, ${jurisdiction.province || 'Cần Thơ'}`;
    if (docUnitNameLabel) docUnitNameLabel.textContent = assigned.name || assigned.unitName || 'Công An Khu Vực';
    if (docUnitPhone) docUnitPhone.value = assigned.phone || '0292 3899 113';
    if (docUnitSms) docUnitSms.value = assigned.sms || '0988 113 113';
    if (docReporterPhone) docReporterPhone.value = inc.reporterPhone || '0988113115';
    if (docIncidentCallTime) docIncidentCallTime.value = formattedTime;
    
    // Vị trí xảy ra sự cố: Tuyệt đối KHÔNG nhầm với địa chỉ trụ sở công an.
    const stationAddr = (assigned.address || assigned.stationAddress || '').trim().toLowerCase();
    let locVal = (inc.address || '').trim();
    if (stationAddr && locVal.toLowerCase() === stationAddr) {
      locVal = '';
    }
    if (!locVal && jurisdiction.ward) {
      locVal = `${jurisdiction.ward}, ${jurisdiction.province || ''}`.replace(/^,\s*/, '');
    }
    if (!locVal && inc.lat && inc.lng) {
      locVal = `Tọa độ: ${(inc.lat).toFixed(5)}, ${(inc.lng).toFixed(5)}`;
    }
    if (docIncidentAddress) {
      docIncidentAddress.value = locVal;
      docIncidentAddress.placeholder = "Nhấn vào đây để tự điền vị trí/khu vực xảy ra sự việc...";
    }

    if (docIncidentCoords) docIncidentCoords.value = `${(inc.lat || 0).toFixed(5)}, ${(inc.lng || 0).toFixed(5)}`;
    if (docGmapsLink) {
      docGmapsLink.href = `https://www.google.com/maps/search/?api=1&query=${inc.lat},${inc.lng}`;
    }
    if (docIncidentDescription) {
      docIncidentDescription.value = `${inc.incidentTags?.join(', ') || 'Sự cố khẩn cấp'}. ${inc.customNotes || ''} ${isEscalated ? '[ĐÃ LEO THANG XỬ LÝ LÊN TUYẾN TỈNH/THÀNH PHỐ SAU 15 PHÚT CẤP CƠ SỞ CHƯA TIẾP NHẬN]' : 'Đã tiếp nhận định vị GPS và xử lý trực tiếp.'}`;
    }
    if (docSignReporter) docSignReporter.textContent = inc.reporterName || 'Người dân';
    if (docSignOfficer) docSignOfficer.textContent = effectiveOfficer;

    // Set dynamic agency checkbox labels
    const docUnitPoliceLabel = document.getElementById('docUnitPoliceLabel');
    const docUnitCsgtLabel = document.getElementById('docUnitCsgtLabel');
    const docUnitFireLabel = document.getElementById('docUnitFireLabel');
    const docUnitHospitalLabel = document.getElementById('docUnitHospitalLabel');
    const docUnitRescueLabel = document.getElementById('docUnitRescueLabel');

    const policeAreaStr = isEscalated
      ? `Công An TP. ${jurisdiction.province || 'Cần Thơ'} (Tuyến Tỉnh/TP tiếp nhận xử lý sau 15p)`
      : (jurisdiction.ward ? `${jurisdiction.ward}, ${jurisdiction.province || ''}` : (assigned.name || 'Công An Xã/Phường'));
    if (docUnitPoliceLabel) docUnitPoliceLabel.textContent = policeAreaStr;
    if (docUnitCsgtLabel) docUnitCsgtLabel.textContent = (agency === 'csgt' && assigned.name) ? assigned.name : 'Đội CSGT - Trật Tự Địa Bàn';
    if (docUnitFireLabel) docUnitFireLabel.textContent = (agency === 'fire' && assigned.name) ? assigned.name : 'Đội Cảnh Sát PCCC & CNCH';

    const checkPolice = document.getElementById('docCheckPolice') || document.getElementById('docCheck113');
    const checkCsgt = document.getElementById('docCheckCsgt');
    const checkFire = document.getElementById('docCheckFire') || document.getElementById('docCheck114');

    if (checkPolice) checkPolice.checked = (agency === 'police');
    if (checkCsgt) checkCsgt.checked = (agency === 'csgt');
    if (checkFire) checkFire.checked = (agency === 'fire');

    // Update Top 2-Column Administrative Header in modal preview
    const elUpper = document.getElementById('docHeaderAgencyUpper');
    const elLower = document.getElementById('docHeaderAgencyLower');
    const elDocNum = document.getElementById('docHeaderDocNumber');
    const elDateLoc = document.getElementById('docHeaderDateLocation');
    const headerInfo = this.getAgencyHeaderInfo(inc);
    if (elUpper) elUpper.textContent = headerInfo.upper;
    if (elLower) elLower.textContent = headerInfo.lower;
    if (elDocNum) elDocNum.textContent = `Số: ${inc.id}/PTN-SC`;
    if (elDateLoc) elDateLoc.textContent = this.formatDocDateLocation(inc);

    const refreshHeaderDisplay = (selectedAgency) => {
      const clone = { ...inc, agency: selectedAgency };
      const info = this.getAgencyHeaderInfo(clone);
      if (elUpper) elUpper.textContent = info.upper;
      if (elLower) elLower.textContent = info.lower;
    };
    if (checkPolice) checkPolice.onchange = () => { if (checkPolice.checked) { if (checkCsgt) checkCsgt.checked = false; if (checkFire) checkFire.checked = false; refreshHeaderDisplay('police'); } };
    if (checkCsgt) checkCsgt.onchange = () => { if (checkCsgt.checked) { if (checkPolice) checkPolice.checked = false; if (checkFire) checkFire.checked = false; refreshHeaderDisplay('csgt'); } };
    if (checkFire) checkFire.onchange = () => { if (checkFire.checked) { if (checkPolice) checkPolice.checked = false; if (checkCsgt) checkCsgt.checked = false; refreshHeaderDisplay('fire'); } };

    // Populate interactive signature input fields and synchronize bidirectional
    const inputRep = document.getElementById('docSignReporterInput');
    const inputOff = document.getElementById('docSignOfficerInput');
    const docRepName = document.getElementById('docReporterName');
    const docOffName = document.getElementById('docOfficerName');

    const citizenInitialName = inc.signatures?.citizen?.name || inc.reporterName || '';
    if (inputRep) inputRep.value = citizenInitialName;
    if (docRepName) docRepName.value = citizenInitialName;

    const officerInitialName = effectiveOfficer;
    if (inputOff) inputOff.value = officerInitialName;
    if (docOffName) docOffName.value = officerInitialName;
    if (!inc.signatures) inc.signatures = {};
    if (!inc.signatures.officer) inc.signatures.officer = { signed: false, name: '' };
    if (!inc.signatures.officer.name || inc.signatures.officer.name === 'Đang cập nhật') {
      inc.signatures.officer.name = officerInitialName;
    }

    const syncCitizenName = (nameVal) => {
      const val = (nameVal || '').trim();
      if (docRepName && docRepName !== document.activeElement) docRepName.value = val;
      if (inputRep && inputRep !== document.activeElement) inputRep.value = val;
      if (!inc.signatures) inc.signatures = {};
      if (!inc.signatures.citizen) inc.signatures.citizen = { signed: false, name: '' };
      inc.signatures.citizen.name = val;
      inc.reporterName = val;
      this.updateSignatureUI(inc);

      if (this._syncCitizenTimeout) clearTimeout(this._syncCitizenTimeout);
      this._syncCitizenTimeout = setTimeout(() => {
        fetch('/api/sos/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ incidentId: inc.id, signerRole: 'citizen', name: val })
        }).catch(() => {});
      }, 400);
    };

    const syncOfficerName = (nameVal) => {
      const val = (nameVal || '').trim();
      if (docOffName && docOffName !== document.activeElement) docOffName.value = val;
      if (inputOff && inputOff !== document.activeElement) inputOff.value = val;
      if (!inc.signatures) inc.signatures = {};
      if (!inc.signatures.officer) inc.signatures.officer = { signed: false, name: '' };
      inc.signatures.officer.name = val;
      if (inc.dispatchUnit) inc.dispatchUnit.officerName = val;
      if (inc.assignedUnit) inc.assignedUnit.officerName = val;
      this.updateSignatureUI(inc);

      if (this._syncOfficerTimeout) clearTimeout(this._syncOfficerTimeout);
      this._syncOfficerTimeout = setTimeout(() => {
        fetch('/api/sos/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ incidentId: inc.id, signerRole: 'officer', name: val })
        }).catch(() => {});
      }, 400);
    };

    if (inputRep) {
      inputRep.oninput = () => syncCitizenName(inputRep.value);
      inputRep.onchange = () => syncCitizenName(inputRep.value);
    }
    if (docRepName) {
      docRepName.oninput = () => syncCitizenName(docRepName.value);
      docRepName.onchange = () => syncCitizenName(docRepName.value);
    }
    if (inputOff) {
      inputOff.oninput = () => syncOfficerName(inputOff.value);
      inputOff.onchange = () => syncOfficerName(inputOff.value);
    }
    if (docOffName) {
      docOffName.oninput = () => syncOfficerName(docOffName.value);
      docOffName.onchange = () => syncOfficerName(docOffName.value);
    }

    // Render Media preview in document
    const mediaSection = document.getElementById('docMediaSection');
    const mediaGrid = document.getElementById('docMediaGrid');
    if (mediaSection && mediaGrid) {
      if (Array.isArray(inc.media) && inc.media.length > 0) {
        mediaSection.style.display = 'block';
        mediaGrid.innerHTML = '';
        inc.media.forEach((m, idx) => {
          if (m.type !== 'video') {
            const img = document.createElement('img');
            img.src = m.dataUrl;
            img.style = 'width: 140px; height: 100px; object-fit: cover; border: 1px solid #999; border-radius: 4px;';
            mediaGrid.appendChild(img);
          }
        });
      } else {
        mediaSection.style.display = 'none';
      }
    }

    this.updateSignatureUI(inc);

    modal.classList.add('is-open');
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';

    // Real-Time 2-Second Collaborative Sync (Google Docs Style)
    if (this.docSyncInterval) clearInterval(this.docSyncInterval);
    this.docSyncInterval = setInterval(async () => {
      const m = document.getElementById('incidentReportDocxModal');
      if (!m || m.style.display === 'none' || !this.selectedIncidentId) {
        clearInterval(this.docSyncInterval);
        return;
      }

      const payload = {
        id: this.selectedIncidentId,
        role: 'officer',
        docFields: {
          officerName: (document.getElementById('docSignOfficerInput')?.value || document.getElementById('docOfficerName')?.value || '').trim(),
          incidentAddress: (document.getElementById('docIncidentAddress')?.value || '').trim(),
          adviceGiven: document.getElementById('docAdviceGiven')?.value || '',
          incidentDescription: document.getElementById('docIncidentDescription')?.value || '',
          helpRequest: document.getElementById('docHelpRequest')?.value || '',
          resolutionResult: document.getElementById('docResolutionResult')?.value || ''
        }
      };

      try {
        const res = await fetch('/api/sos/sync-doc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.ok && data.incident) {
          this.incidents.set(data.incident.id, data.incident);
          this.updateSignatureUI(data.incident);
        }
      } catch (e) {}
    }, 2000);
  }

  stripEmojis(str) {
    if (!str) return '';
    return str.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}✍️🚨🚒🚑🚓🛠️🟢✅⚠️☑☐]/gu, '').trim();
  }

  formatSignatureTime(signature) {
    if (!signature) return '';
    if (signature.signedAtDisplay) return signature.signedAtDisplay;
    if (!signature.signedAt) return '';
    const parsed = new Date(signature.signedAt);
    return Number.isNaN(parsed.getTime())
      ? signature.signedAt
      : parsed.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
  }

  mergeSignatureState(localSigs, remoteSigs) {
    const pickNewest = (localEntry, remoteEntry) => {
      if (!localEntry && !remoteEntry) return {};
      if (!localEntry) return { ...(remoteEntry || {}) };
      if (!remoteEntry) return { ...(localEntry || {}) };
      if (remoteEntry.signed && !localEntry.signed) return { ...remoteEntry };
      if (localEntry.signed && !remoteEntry.signed) return { ...localEntry };
      const localTime = Date.parse(localEntry.signedAt || 0) || 0;
      const remoteTime = Date.parse(remoteEntry.signedAt || 0) || 0;
      return remoteTime >= localTime ? { ...localEntry, ...remoteEntry } : { ...remoteEntry, ...localEntry };
    };

    const citizen = pickNewest(localSigs?.citizen, remoteSigs?.citizen);
    const officer = pickNewest(localSigs?.officer, remoteSigs?.officer);
    const valid = (s) => Boolean(s.signed && (s.name || '').trim().length > 1);
    return { ...(localSigs || {}), ...(remoteSigs || {}), citizen, officer, isFullySigned: valid(citizen) && valid(officer) };
  }

  applyIncidentSignatureUpdate(remoteInc) {
    if (!remoteInc || !remoteInc.id) return remoteInc;
    const local = this.incidents.get(remoteInc.id);
    if (local?.signatures) {
      remoteInc.signatures = this.mergeSignatureState(local.signatures, remoteInc.signatures);
    }
    // Keep the longer audit trail: an in-flight payload can predate a new entry.
    const localLog = Array.isArray(local?.signatureLog) ? local.signatureLog : [];
    const remoteLog = Array.isArray(remoteInc.signatureLog) ? remoteInc.signatureLog : [];
    remoteInc.signatureLog = remoteLog.length >= localLog.length ? remoteLog : localLog;
    this.incidents.set(remoteInc.id, remoteInc);
    if (this.selectedIncidentId === remoteInc.id) this.renderSignatureHistory(remoteInc);
    return remoteInc;
  }

  updateSignatureUI(inc) {
    const sigs = inc.signatures || {};
    const citizenSig = sigs.citizen || {};
    const officerSig = sigs.officer || {};

    const banner = document.getElementById('docLegalNoticeBanner');
    const bannerText = document.getElementById('docLegalNoticeText');
    const legalBadge = document.getElementById('docLegalBadge');
    const lockHint = document.getElementById('docLockHint');

    const btnDocx = document.getElementById('btnDownloadReportDocx');
    const btnImg = document.getElementById('btnDownloadReportImage');
    const btnPrint = document.getElementById('btnPrintReportPdf');
    const btnBottomClose = document.getElementById('btnBottomCloseReportDocx');

    const inputRep = document.getElementById('docSignReporterInput');
    const inputOff = document.getElementById('docSignOfficerInput');
    const docRepName = document.getElementById('docReporterName');
    const docOffName = document.getElementById('docOfficerName');

    if (citizenSig.name) {
      if (inputRep && inputRep !== document.activeElement) inputRep.value = citizenSig.name;
      if (docRepName && docRepName !== document.activeElement) docRepName.value = citizenSig.name;
    }
    if (officerSig.name) {
      if (inputOff && inputOff !== document.activeElement) inputOff.value = officerSig.name;
      if (docOffName && docOffName !== document.activeElement) docOffName.value = officerSig.name;
    }

    // Sync collaborative document fields if updated remotely
    if (inc.docFields) {
      ['docIncidentAddress', 'docAdviceGiven', 'docIncidentDescription', 'docHelpRequest', 'docResolutionResult'].forEach(fid => {
        const el = document.getElementById(fid);
        if (el && el !== document.activeElement && inc.docFields[fid] !== undefined && inc.docFields[fid] !== '') {
          el.value = inc.docFields[fid];
        }
      });
    }

    // Citizen Signature rendering
    const citizenPlaceholder = document.getElementById('citizenSigPlaceholder');
    const citizenImg = document.getElementById('citizenSigImg');
    const citizenText = document.getElementById('citizenSigText');
    const btnCitizenSign = document.getElementById('btnOpenCitizenSignPad');
    const citizenTime = document.getElementById('docCitizenSignTime');

    if (citizenSig.signed) {
      if (citizenPlaceholder) citizenPlaceholder.style.display = 'none';
      if (citizenSig.type === 'draw' && citizenSig.signatureData) {
        if (citizenImg) {
          citizenImg.src = citizenSig.signatureData;
          citizenImg.style.display = 'block';
        }
        if (citizenText) citizenText.style.display = 'none';
      } else if (citizenSig.type === 'type' && citizenSig.signatureData) {
        if (citizenText) {
          citizenText.textContent = citizenSig.signatureData;
          citizenText.style.display = 'block';
        }
        if (citizenImg) citizenImg.style.display = 'none';
      }
      if (btnCitizenSign) {
        btnCitizenSign.innerHTML = '🟢 Người Dân Đã Ký';
        btnCitizenSign.style.background = 'rgba(16, 185, 129, 0.15)';
        btnCitizenSign.style.borderColor = '#10b981';
        btnCitizenSign.style.color = '#059669';
      }
      if (citizenTime) citizenTime.textContent = `Đã ký lúc: ${this.formatSignatureTime(citizenSig)}`;
    } else {
      if (citizenPlaceholder) citizenPlaceholder.style.display = 'block';
      if (citizenImg) citizenImg.style.display = 'none';
      if (citizenText) citizenText.style.display = 'none';
      if (btnCitizenSign) {
        btnCitizenSign.innerHTML = '✍️ Ký Thay Người Dân (Nếu Cần)';
        btnCitizenSign.style.background = 'rgba(59, 130, 246, 0.15)';
        btnCitizenSign.style.borderColor = '#3b82f6';
        btnCitizenSign.style.color = '#2563eb';
      }
      if (citizenTime) citizenTime.textContent = '';
    }

    // Officer Signature rendering
    const officerPlaceholder = document.getElementById('officerSigPlaceholder');
    const officerImg = document.getElementById('officerSigImg');
    const officerText = document.getElementById('officerSigText');
    const btnOfficerSign = document.getElementById('btnOpenOfficerSignPad');
    const officerTime = document.getElementById('docOfficerSignTime');

    if (officerSig.signed) {
      if (officerPlaceholder) officerPlaceholder.style.display = 'none';
      if (officerSig.type === 'draw' && officerSig.signatureData) {
        if (officerImg) {
          officerImg.src = officerSig.signatureData;
          officerImg.style.display = 'block';
        }
        if (officerText) officerText.style.display = 'none';
      } else if (officerSig.type === 'type' && officerSig.signatureData) {
        if (officerText) {
          officerText.textContent = officerSig.signatureData;
          officerText.style.display = 'block';
        }
        if (officerImg) officerImg.style.display = 'none';
      }
      if (btnOfficerSign) {
        btnOfficerSign.innerHTML = '🟢 Cán Bộ Đã Xác Thực';
        btnOfficerSign.style.background = 'rgba(16, 185, 129, 0.15)';
        btnOfficerSign.style.borderColor = '#10b981';
        btnOfficerSign.style.color = '#059669';
      }
      if (officerTime) officerTime.textContent = `Đã ký lúc: ${this.formatSignatureTime(officerSig)}`;
    } else {
      if (officerPlaceholder) officerPlaceholder.style.display = 'block';
      if (officerImg) officerImg.style.display = 'none';
      if (officerText) officerText.style.display = 'none';
      if (btnOfficerSign) {
        btnOfficerSign.innerHTML = '✍️ Cán Bộ Ký Xác Nhận';
        btnOfficerSign.style.background = 'rgba(37, 99, 235, 0.15)';
        btnOfficerSign.style.borderColor = '#3b82f6';
        btnOfficerSign.style.color = '#2563eb';
      }
      if (officerTime) officerTime.textContent = '';
    }

    // Legal Enforcement Check:
    const citizenNameVal = (inputRep?.value || citizenSig.name || docRepName?.value || '').trim();
    const officerNameVal = (inputOff?.value || officerSig.name || docOffName?.value || '').trim();

    const isCitizenComplete = Boolean(citizenSig.signed && citizenNameVal && citizenNameVal.length > 1);
    const isOfficerComplete = Boolean(officerSig.signed && officerNameVal && officerNameVal.length > 1);
    const isFullySigned = Boolean(isCitizenComplete && isOfficerComplete);
    const isResolved = (inc.status === 'resolved');

    // Nút đóng luôn luôn hiển thị và cho phép đóng
    if (btnBottomClose) btnBottomClose.style.display = 'inline-flex';
    if (btnDocx) {
      btnDocx.disabled = false;
      btnDocx.style.opacity = '1';
      btnDocx.style.cursor = 'pointer';
    }
    if (btnImg) {
      btnImg.disabled = false;
      btnImg.style.opacity = '1';
      btnImg.style.cursor = 'pointer';
    }
    if (btnPrint) {
      btnPrint.disabled = false;
      btnPrint.style.opacity = '1';
      btnPrint.style.cursor = 'pointer';
    }

    if (!isResolved) {
      // Giai đoạn đang xử lý hiện trường (Bước 1 -> 4): Chưa cần bắt buộc ký
      if (banner) {
        banner.style.background = 'rgba(59, 130, 246, 0.08)';
        banner.style.borderColor = '#60a5fa';
        banner.style.color = '#1d4ed8';
      }
      if (bannerText) {
        bannerText.innerHTML = '<b>ℹ️ TIẾN TRÌNH XỬ LÝ SỰ CỐ:</b> Phiếu tiếp nhận đang tự động đồng bộ theo diễn biến hiện trường. Ký xác nhận hoàn tất hồ sơ sẽ thực hiện khi kết thúc ca (Giai đoạn 5).';
      }
      if (legalBadge) {
        legalBadge.textContent = 'ĐANG XỬ LÝ (TIẾN TRÌNH)';
        legalBadge.style.background = '#e0f2fe';
        legalBadge.style.color = '#0284c7';
      }
      if (lockHint) {
        lockHint.innerHTML = 'ℹ️ Phiếu tiếp nhận đang trong tiến trình xử lý. Bạn có thể xem hình ảnh, văn bản và đóng cửa sổ bất cứ lúc nào!';
        lockHint.style.color = '#38bdf8';
      }
    } else if (isFullySigned) {
      // Giai đoạn hoàn tất và đã đủ chữ ký 2 bên
      if (banner) {
        banner.style.background = 'rgba(16, 185, 129, 0.1)';
        banner.style.borderColor = '#10b981';
        banner.style.color = '#047857';
      }
      if (bannerText) {
        bannerText.innerHTML = '<b>✅ VĂN BẢN ĐÃ HOÀN TẤT & ĐẦY ĐỦ HIỆU LỰC PHÁP LÝ:</b> Cả Người dân và Cán bộ trực ban đã hoàn tất ký và điền họ tên.';
      }
      if (legalBadge) {
        legalBadge.textContent = 'ĐÃ CÓ HIỆU LỰC';
        legalBadge.style.background = '#d1fae5';
        legalBadge.style.color = '#059669';
      }
      if (lockHint) {
        lockHint.innerHTML = '🔓 Hồ sơ đã hoàn tất và lưu trữ. Bạn có thể tải file Word (.docx), file Ảnh (PNG) hoặc In / PDF và Đóng cửa sổ!';
        lockHint.style.color = '#34d399';
      }
    } else {
      // Giai đoạn hoàn tất nhưng chưa đủ chữ ký 2 bên -> BẮT BUỘC ĐỢI KÝ ĐỦ MỚI ĐƯỢC ĐÓNG
      if (banner) {
        banner.style.background = 'rgba(239, 68, 68, 0.12)';
        banner.style.borderColor = '#ef4444';
        banner.style.color = '#dc2626';
      }

      const missingParts = [];
      if (!officerSig.signed) missingParts.push('Cán bộ trực ban');
      if (!citizenSig.signed) missingParts.push('Người dân');
      const missingStr = missingParts.join(' & ');
      const signedCount = (citizenSig.signed ? 1 : 0) + (officerSig.signed ? 1 : 0);

      if (bannerText) {
        bannerText.innerHTML = `<b>⚠️ VĂN BẢN CHƯA ĐỦ CHỮ KÝ 2 BÊN (${signedCount}/2):</b> Ca sự cố đã hoàn tất hiện trường. Theo quy định pháp lý, phải đợi cả <b>Người dân</b> và <b>Cán bộ trực ban</b> ký xong hết mới được đóng hồ sơ!`;
      }
      if (legalBadge) {
        legalBadge.textContent = `CHƯA ĐỦ CHỮ KÝ (${signedCount}/2)`;
        legalBadge.style.background = '#fee2e2';
        legalBadge.style.color = '#dc2626';
      }
      if (lockHint) {
        lockHint.innerHTML = `⚠️ Đang chờ ký số: Còn thiếu chữ ký của <b>${missingStr}</b>. Vui lòng bấm vào <b>✍️ Cán Bộ Ký Xác Nhận</b> để ký và hoàn thiện hồ sơ!`;
        lockHint.style.color = '#f87171';
      }
    }

  }

  openSignaturePad(signerRole = 'officer') {
    this.currentSignerRole = signerRole;
    const modal = document.getElementById('signaturePadModal');
    const title = document.getElementById('sigModalTitle');
    const inputName = document.getElementById('inputSigTypedName');
    const typePreview = document.getElementById('sigTypePreview');

    if (title) {
      title.textContent = signerRole === 'citizen' ? 'KÝ TÊN ĐIỆN TỬ (NGƯỜI DÂN)' : 'KÝ TÊN ĐIỆN TỬ (CÁN BỘ TIẾP NHẬN)';
    }

    const inc = this.incidents.get(this.selectedIncidentId);
    const currentName = (signerRole === 'citizen'
      ? (document.getElementById('docSignReporterInput')?.value || document.getElementById('docReporterName')?.value || inc?.signatures?.citizen?.name || inc?.reporterName)
      : (document.getElementById('docSignOfficerInput')?.value || document.getElementById('docOfficerName')?.value || inc?.signatures?.officer?.name || this.currentOfficer?.officerName || inc?.dispatchUnit?.officerName || inc?.assignedUnit?.officerName)) || '';

    if (inputName) inputName.value = currentName;
    if (typePreview) typePreview.textContent = currentName || 'Chữ ký mẫu';

    this.renderSignatureConfirmBox(inc, signerRole);
    this.renderSignatureHistory(inc);

    this.clearSignatureCanvas();

    if (modal) {
      modal.classList.add('is-open');
      modal.style.display = 'flex';
    }
  }

  // The officer screen can hold several open cases, so the signing dialog makes
  // the target citizen explicit and requires a tick before storing a signature.
  renderSignatureConfirmBox(inc, signerRole) {
    const box = document.getElementById('sigConfirmBox');
    const select = document.getElementById('sigConfirmReporter');
    const meta = document.getElementById('sigConfirmMeta');
    const check = document.getElementById('sigConfirmCheck');
    if (!box) return;

    if (signerRole === 'citizen' || !inc) {
      box.style.display = 'none';
      if (check) check.checked = false;
      return;
    }

    box.style.display = 'block';
    if (check) check.checked = true;

    const reporter = (inc.signatures?.citizen?.name || inc.reporterName || '').trim() || 'Không rõ họ tên';
    if (select) {
      const others = Array.from(this.incidents?.values?.() || [])
        .filter(other => other && other.id !== inc.id)
        .slice(0, 20);
      select.innerHTML = [
        `<option value="${inc.id}" selected>${reporter} — ${inc.id}</option>`,
        ...others.map(other => `<option value="${other.id}">${(other.reporterName || 'Không rõ họ tên')} — ${other.id}</option>`)
      ].join('');
      select.onchange = () => {
        if (select.value !== inc.id) {
          alert('Muốn ký cho người dân khác, vui lòng mở đúng hồ sơ đó rồi bấm ký. Không được ký chéo hồ sơ.');
          select.value = inc.id;
        }
      };
    }
    if (meta) {
      meta.innerHTML = `👤 <b>${reporter}</b><br>📄 Mã hồ sơ: <b>${inc.id}</b><br>📞 ${inc.reporterPhone || 'Không có số điện thoại'}<br>📍 ${inc.address || inc.location?.address || 'Chưa có địa chỉ'}`;
    }
  }

  renderSignatureHistory(inc) {
    const box = document.getElementById('sigHistoryBox');
    const list = document.getElementById('sigHistoryList');
    if (!box || !list) return;
    const log = Array.isArray(inc?.signatureLog) ? inc.signatureLog.slice().reverse() : [];
    if (!log.length) {
      box.style.display = 'block';
      list.innerHTML = '<div style="color:#64748b;">Chưa có lượt ký nào cho hồ sơ này.</div>';
      return;
    }
    box.style.display = 'block';
    list.innerHTML = log.map(entry => {
      const who = entry.role === 'citizen' ? 'Người dân' : 'Cán bộ';
      const account = entry.account && entry.account !== 'citizen' ? ` (tài khoản ${entry.account})` : '';
      const action = entry.action === 're-sign' ? 'ký lại' : 'ký';
      return `<div>• <b style="color:#e2e8f0;">${who}</b> ${entry.name || ''}${account} ${action} lúc ${entry.atDisplay || entry.at || ''}</div>`;
    }).join('');
  }

  isCanvasBlank(canvas) {
    if (!canvas || !canvas.width || !canvas.height) return true;
    try {
      const ctx = canvas.getContext('2d');
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      // White-filled canvas: check for non-white pixels
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
        if (a > 10 && !(r > 240 && g > 240 && b > 240)) return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  clearSignatureCanvas() {
    const canvas = document.getElementById('sigCanvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#1e3a8a';
    }
    this.isSigCanvasDrawn = false;
  }

  async submitSignature() {
    if (!this.selectedIncidentId) {
      alert('Không xác định được hồ sơ SOS đang ký. Vui lòng đóng phiếu, mở lại hồ sơ và thử lại.');
      return;
    }
    const isDrawTab = document.getElementById('tabSigDraw')?.classList.contains('is-active');
    const role = this.currentSignerRole || 'officer';
    const inc = this.incidents.get(this.selectedIncidentId);

    const nameFromPad = (document.getElementById('inputSigTypedName')?.value || '').trim();
    const nameFromDoc = (role === 'citizen'
      ? (document.getElementById('docSignReporterInput')?.value || document.getElementById('docReporterName')?.value || inc?.signatures?.citizen?.name || inc?.reporterName)
      : (document.getElementById('docSignOfficerInput')?.value || document.getElementById('docOfficerName')?.value || inc?.signatures?.officer?.name || this.currentOfficer?.officerName || inc?.dispatchUnit?.officerName || inc?.assignedUnit?.officerName)) || '';

    const signerName = nameFromPad || nameFromDoc || (role === 'citizen' ? 'Người dân' : 'Cán bộ trực ban');

    const confirmReporterName = (inc?.reporterName || inc?.signatures?.citizen?.name || '').trim();
    if (role !== 'citizen') {
      const select = document.getElementById('sigConfirmReporter');
      const check = document.getElementById('sigConfirmCheck');
      if (select && select.value && select.value !== this.selectedIncidentId) {
        alert('Hồ sơ được chọn không khớp hồ sơ đang mở. Vui lòng mở đúng hồ sơ của người dân cần ký.');
        return;
      }
      if (check && !check.checked) {
        alert('Vui lòng tích xác nhận ký đúng hồ sơ của người dân trước khi ký.');
        return;
      }
      const already = inc?.signatures?.officer;
      if (already?.signed) {
        const proceed = confirm(`⚠️ Phần ký cán bộ đã có chữ ký của "${already.name || 'cán bộ khác'}" lúc ${already.signedAtDisplay || already.signedAt || 'trước đó'}.\n\nChỉ tiếp tục nếu bạn chính là người ký hoặc được phân công ký lại. Bạn có chắc chắn ký lại?`);
        if (!proceed) return;
        this._signatureReplaceExisting = true;
      } else {
        this._signatureReplaceExisting = false;
      }
    } else {
      const alreadyCit = inc?.signatures?.citizen;
      if (alreadyCit?.signed) {
        const proceed = confirm(`⚠️ Phần ký người dân đã có chữ ký của "${alreadyCit.name || 'người dân'}" lúc ${alreadyCit.signedAtDisplay || alreadyCit.signedAt || 'trước đó'}.\n\nBạn có chắc chắn muốn ký thay/cập nhật lại chữ ký cho người dân?`);
        if (!proceed) return;
        this._signatureReplaceExisting = true;
      } else {
        this._signatureReplaceExisting = false;
      }
    }

    let signatureData = '';
    let type = 'draw';

    if (isDrawTab) {
      const canvas = document.getElementById('sigCanvas');
      const hasDrawn = Boolean(this.isSigCanvasDrawn || (canvas && !this.isCanvasBlank(canvas)));
      if (canvas && hasDrawn) {
        signatureData = canvas.toDataURL('image/png');
        type = 'draw';
      } else {
        alert('Vui lòng vẽ chữ ký vào khung trắng trước khi xác nhận!');
        return;
      }
    } else {
      if (!nameFromPad) {
        alert('Vui lòng nhập họ và tên của bạn!');
        return;
      }
      signatureData = nameFromPad;
      type = 'type';
    }

    // Keep name in document inputs immediately
    if (role === 'citizen') {
      const repInput = document.getElementById('docSignReporterInput');
      const repName = document.getElementById('docReporterName');
      if (repInput) repInput.value = signerName;
      if (repName) repName.value = signerName;

      const citizenPlaceholder = document.getElementById('citizenSigPlaceholder');
      const citizenImg = document.getElementById('citizenSigImg');
      const citizenText = document.getElementById('citizenSigText');
      const btnCitizenSign = document.getElementById('btnOpenCitizenSignPad');
      if (citizenPlaceholder) citizenPlaceholder.style.display = 'none';
      if (type === 'draw' && citizenImg) {
        citizenImg.src = signatureData;
        citizenImg.style.display = 'block';
        if (citizenText) citizenText.style.display = 'none';
      } else if (type === 'type' && citizenText) {
        citizenText.textContent = signatureData;
        citizenText.style.display = 'block';
        if (citizenImg) citizenImg.style.display = 'none';
      }
      if (btnCitizenSign) {
        btnCitizenSign.innerHTML = '🟢 Người Dân Đã Ký';
        btnCitizenSign.style.background = 'rgba(16, 185, 129, 0.15)';
        btnCitizenSign.style.borderColor = '#10b981';
        btnCitizenSign.style.color = '#059669';
      }
    } else {
      const offInput = document.getElementById('docSignOfficerInput');
      const offName = document.getElementById('docOfficerName');
      if (offInput) offInput.value = signerName;
      if (offName) offName.value = signerName;

      const officerPlaceholder = document.getElementById('officerSigPlaceholder');
      const officerImg = document.getElementById('officerSigImg');
      const officerText = document.getElementById('officerSigText');
      const btnOfficerSign = document.getElementById('btnOpenOfficerSignPad');
      if (officerPlaceholder) officerPlaceholder.style.display = 'none';
      if (type === 'draw' && officerImg) {
        officerImg.src = signatureData;
        officerImg.style.display = 'block';
        if (officerText) officerText.style.display = 'none';
      } else if (type === 'type' && officerText) {
        officerText.textContent = signatureData;
        officerText.style.display = 'block';
        if (officerImg) officerImg.style.display = 'none';
      }
      if (btnOfficerSign) {
        btnOfficerSign.innerHTML = '🟢 Cán Bộ Đã Ký';
        btnOfficerSign.style.background = 'rgba(16, 185, 129, 0.15)';
        btnOfficerSign.style.borderColor = '#10b981';
        btnOfficerSign.style.color = '#059669';
      }
    }

    // A debounced name-only sync still queued for this role would land after
    // the signature request and re-send an outdated name, so drop it.
    if (role === 'citizen') {
      if (this._syncCitizenTimeout) { clearTimeout(this._syncCitizenTimeout); this._syncCitizenTimeout = null; }
    } else if (this._syncOfficerTimeout) {
      clearTimeout(this._syncOfficerTimeout);
      this._syncOfficerTimeout = null;
    }

    try {
      const btn = document.getElementById('btnSubmitSignature');
      if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ Đang đồng bộ chữ ký...';
      }

      const res = await fetch('/api/sos/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.currentOfficer?.token ? { Authorization: `Bearer ${this.currentOfficer.token}` } : {})
        },
        body: JSON.stringify({
          incidentId: this.selectedIncidentId,
          signerRole: role,
          name: signerName,
          type: type,
          signatureData: signatureData,
          confirmIncidentId: this.selectedIncidentId,
          confirmReporterName: confirmReporterName,
          replaceExisting: Boolean(this._signatureReplaceExisting)
        })
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        if (data?.signatures && inc) {
          inc.signatures = this.mergeSignatureState(inc.signatures, data.signatures);
          this.updateSignatureUI(inc);
        }
        if (Array.isArray(data?.signatureLog) && inc) {
          inc.signatureLog = data.signatureLog;
          this.renderSignatureHistory(inc);
        }
        throw new Error(data?.error || 'Máy chủ không thể xác nhận chữ ký. Vui lòng thử lại.');
      }

      if (inc) {
        // The server record is authoritative, but merging keeps a counterpart
        // signature that arrived locally while this request was in flight.
        inc.signatures = this.mergeSignatureState(inc.signatures, data.signatures);
        if (Array.isArray(data.signatureLog)) inc.signatureLog = data.signatureLog;
        this.updateSignatureUI(inc);
        this.renderSignatureHistory(inc);
      }
      this._signatureReplaceExisting = false;

      const sigModal = document.getElementById('signaturePadModal');
      if (sigModal) {
        sigModal.classList.remove('is-open');
        sigModal.style.display = 'none';
      }

      if (data.isFullySigned) {
        alert('🎉 Chúc mừng! Cả 2 bên đã hoàn tất ký tên. Văn bản đã có hiệu lực pháp lý và được phép tải về máy!');
      } else {
        alert(`✅ Đã lưu chữ ký của ${role === 'citizen' ? 'Người dân' : 'Cán bộ'} thành công! Đang chờ bên còn lại ký để văn bản có hiệu lực.`);
      }
    } catch (e) {
      console.error(e);
      alert(e?.message || 'Không thể lưu chữ ký lên hệ thống.');
    } finally {
      const btn = document.getElementById('btnSubmitSignature');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>✅</span> XÁC NHẬN KÝ TÊN VÀ ĐỒNG BỘ LÊN VĂN BẢN';
      }
    }
  }

  async downloadReportDocx() {
    if (!this.selectedIncidentId) return;
    const inc = this.incidents.get(this.selectedIncidentId);
    if (!inc) return;

    if (!inc.signatures?.isFullySigned) {
      const proceed = confirm('⚠️ Phiếu tiếp nhận chưa đủ chữ ký 2 bên (Người dân & Cán bộ). Bạn có muốn tiếp tục tải bản dự thảo tiếp nhận (.docx) để phục vụ công tác tại hiện trường không?');
      if (!proceed) return;
    }

    const btn = document.getElementById('btnDownloadReportDocx');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Đang tạo file Word...';
    }

    const agency = inc.agency || 'police';
    const unitNameVal = agency === 'csgt'
      ? document.getElementById('docUnitCsgtLabel')?.textContent
      : (agency === 'fire'
        ? document.getElementById('docUnitFireLabel')?.textContent
        : document.getElementById('docUnitPoliceLabel')?.textContent);

    const payload = {
      incidentId: inc.id,
      incidentTime: document.getElementById('docIncidentTime')?.textContent || '',
      officerName: document.getElementById('docOfficerName')?.value || '',
      officerTitle: inc.dispatchUnit?.officerRank || inc.assignedUnit?.officerRank || 'Cán bộ trực ban',
      unitName: this.stripEmojis(unitNameVal || ''),
      unitAddress: document.getElementById('docUnitAddress')?.value || '',
      unitPhone: document.getElementById('docUnitPhone')?.value || '',
      unitSms: document.getElementById('docUnitSms')?.value || '',
      agency: agency,
      ward: inc.jurisdiction?.ward || '',
      province: inc.jurisdiction?.province || '',
      reporterName: document.getElementById('docReporterName')?.value || '',
      reporterPhone: document.getElementById('docReporterPhone')?.value || '',
      targetType: document.querySelector('input[name="docTargetType"]:checked')?.value || 'Người dân',
      incidentAddress: document.getElementById('docIncidentAddress')?.value || '',
      lat: (inc.lat || 0).toFixed(5),
      lng: (inc.lng || 0).toFixed(5),
      gmapsUrl: `https://www.google.com/maps/search/?api=1&query=${inc.lat},${inc.lng}`,
      incidentTags: inc.incidentTags?.join(', ') || '',
      incidentDescription: document.getElementById('docIncidentDescription')?.value || '',
      helpRequest: document.getElementById('docHelpRequest')?.value || '',
      adviceGiven: document.getElementById('docAdviceGiven')?.value || '',
      resolutionResult: document.getElementById('docResolutionResult')?.value || '',
      citizenSignature: {
        ...(inc.signatures?.citizen || {}),
        name: this.stripEmojis(document.getElementById('docSignReporterInput')?.value || inc.signatures?.citizen?.name || '')
      },
      officerSignature: {
        ...(inc.signatures?.officer || {}),
        name: this.stripEmojis(document.getElementById('docSignOfficerInput')?.value || inc.signatures?.officer?.name || '')
      },
      media: Array.isArray(inc.media) ? inc.media : []
    };

    try {
      const res = await fetch('/api/export/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Phieu_TiepNhan_UPSC_${inc.id}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Có lỗi khi tạo file Word từ máy chủ.');
      }
    } catch (e) {
      console.error(e);
      alert('Không thể kết nối máy chủ tạo file Word.');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '📥 Tải File Word (.docx)';
      }
    }
  }

  async downloadReportImage() {
    if (!this.selectedIncidentId) return;
    const inc = this.incidents.get(this.selectedIncidentId);
    if (!inc) return;

    if (!inc.signatures?.isFullySigned) {
      alert('⚠️ Văn bản chưa đủ chữ ký 2 bên (Người dân & Cán bộ). Vui lòng hoàn tất ký tên để văn bản có hiệu lực trước khi lưu ảnh!');
      return;
    }

    const docSosId = document.getElementById('docSosId')?.textContent || '#SOS';
    const canvas = document.createElement('canvas');
    const w = 1200;
    const h = 1600;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // Draw Paper Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(35, 35, w - 70, h - 70);

    // Official National Header (Decree 30/2020/ND-CP Standard 2-Column Layout)
    const headerInfo = this.getAgencyHeaderInfo(inc);
    const dateLocStr = this.formatDocDateLocation(inc);

    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';

    // Left Column: Agency Hierarchy
    const colLeftX = w * 0.28;
    ctx.font = '15px "Times New Roman", Times, serif';
    ctx.fillText(this.stripEmojis(headerInfo.upper), colLeftX, 70);
    ctx.font = 'bold 15px "Times New Roman", Times, serif';
    ctx.fillText(this.stripEmojis(headerInfo.lower), colLeftX, 95);
    ctx.beginPath();
    ctx.lineWidth = 1.5;
    ctx.moveTo(colLeftX - 70, 105);
    ctx.lineTo(colLeftX + 70, 105);
    ctx.stroke();
    ctx.font = '14px "Times New Roman", Times, serif';
    ctx.fillText(`Số: ${this.stripEmojis(docSosId).replace('#', '')}/PTN-SC`, colLeftX, 125);

    // Right Column: National Motto & Date/Location
    const colRightX = w * 0.72;
    ctx.font = 'bold 16px "Times New Roman", Times, serif';
    ctx.fillText('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', colRightX, 70);
    ctx.font = 'bold 16px "Times New Roman", Times, serif';
    ctx.fillText('Độc lập - Tự do - Hạnh phúc', colRightX, 95);
    ctx.beginPath();
    ctx.lineWidth = 1.5;
    ctx.moveTo(colRightX - 110, 105);
    ctx.lineTo(colRightX + 110, 105);
    ctx.stroke();
    ctx.font = 'italic 14.5px "Times New Roman", Times, serif';
    ctx.fillText(dateLocStr, colRightX, 126);

    // Document Title
    ctx.font = 'bold 22px "Times New Roman", Times, serif';
    ctx.fillText('PHIẾU THÔNG BÁO VÀ TIẾP NHẬN THÔNG TIN', w / 2, 165);
    ctx.fillText('ỨNG PHÓ SỰ CỐ KHẨN CẤP', w / 2, 195);

    const incidentTimeStr = this.stripEmojis(document.getElementById('docIncidentTime')?.textContent || '');
    ctx.font = 'italic 15px "Times New Roman", Times, serif';
    ctx.fillText(`Mã số: ${this.stripEmojis(docSosId)} | Thời gian: ${incidentTimeStr}`, w / 2, 225);

    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.moveTo(w / 2 - 100, 238);
    ctx.lineTo(w / 2 + 100, 238);
    ctx.stroke();

    // Section A: General Info
    ctx.textAlign = 'left';
    ctx.font = 'bold 17px "Times New Roman", Times, serif';
    ctx.fillText('A. THÔNG TIN CHUNG (ĐƠN VỊ TIẾP NHẬN)', 60, 270);

    ctx.font = '15px "Times New Roman", Times, serif';
    ctx.fillText(`- Họ tên cán bộ tiếp nhận: ${this.stripEmojis(document.getElementById('docOfficerName')?.value || '')}`, 80, 300);
    ctx.fillText(`- Trụ sở / Đơn vị tiếp nhận: ${this.stripEmojis(document.getElementById('docUnitAddress')?.value || '')}`, 80, 330);
    ctx.fillText(`- Số điện thoại liên hệ trực ban: ${this.stripEmojis(document.getElementById('docUnitPhone')?.value || '')} | SMS: ${this.stripEmojis(document.getElementById('docUnitSms')?.value || '')}`, 80, 360);

    // Section B: Incident Info
    ctx.font = 'bold 17px "Times New Roman", Times, serif';
    ctx.fillText('B. THÔNG TIN ĐẾN (NGƯỜI BÁO & HIỆN TRƯỜNG SỰ CỐ)', 60, 410);

    ctx.font = '15px "Times New Roman", Times, serif';
    ctx.fillText(`- Tên người báo tin: ${this.stripEmojis(document.getElementById('docReporterName')?.value || '')} (SĐT: ${this.stripEmojis(document.getElementById('docReporterPhone')?.value || '')})`, 80, 440);
    ctx.fillText(`- Giờ tiếp nhận tin: ${this.stripEmojis(document.getElementById('docIncidentCallTime')?.value || '')}`, 80, 470);
    ctx.fillText(`- Vị trí xảy ra sự cố: ${this.stripEmojis(document.getElementById('docIncidentAddress')?.value || '')}`, 80, 500);
    ctx.fillText(`- Tọa độ định vị GPS: ${this.stripEmojis(document.getElementById('docIncidentCoords')?.value || '')}`, 80, 530);
    ctx.fillText(`- Đường dẫn Google Maps: https://maps.google.com/?q=${this.stripEmojis(document.getElementById('docIncidentCoords')?.value || '')}`, 80, 560);

    ctx.fillText(`- Loại sự cố & Mô tả: ${this.stripEmojis(document.getElementById('docIncidentDescription')?.value || '')}`, 80, 600);
    ctx.fillText(`- Yêu cầu trợ giúp: ${this.stripEmojis(document.getElementById('docHelpRequest')?.value || '')}`, 80, 645);
    ctx.fillText(`- Khuyến cáo đã hướng dẫn: ${this.stripEmojis(document.getElementById('docAdviceGiven')?.value || '')}`, 80, 690);
    ctx.fillText(`- Kết quả xử lý hiện trường: ${this.stripEmojis(document.getElementById('docResolutionResult')?.value || '')}`, 80, 735);

    // Signatures Section
    const sigY = 1260;
    ctx.textAlign = 'center';
    ctx.font = 'bold 17px "Times New Roman", Times, serif';
    ctx.fillText('NGƯỜI BÁO TIN / NGƯỜI DÂN', w / 4 + 30, sigY);
    ctx.fillText('CÁN BỘ / CHỈ HUY TIẾP NHẬN', (3 * w) / 4 - 30, sigY);

    ctx.font = 'italic 14px "Times New Roman", Times, serif';
    ctx.fillText('(Ký, ghi rõ họ tên)', w / 4 + 30, sigY + 24);
    ctx.fillText('(Ký, đóng dấu và xác thực điện tử)', (3 * w) / 4 - 30, sigY + 24);

    // Load and draw citizen signature
    const citizenSig = inc.signatures?.citizen || {};
    if (citizenSig.signed && citizenSig.signatureData) {
      if (citizenSig.type === 'draw' && citizenSig.signatureData.startsWith('data:image')) {
        await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, w / 4 + 30 - 90, sigY + 35, 180, 80);
            resolve();
          };
          img.onerror = resolve;
          img.src = citizenSig.signatureData;
        });
      } else {
        ctx.font = 'bold 26px "Brush Script MT", cursive, serif';
        ctx.fillStyle = '#1e3a8a';
        ctx.fillText(citizenSig.signatureData || citizenSig.name, w / 4 + 30, sigY + 80);
        ctx.fillStyle = '#000000';
      }
    }

    // Load and draw officer signature
    const officerSig = inc.signatures?.officer || {};
    if (officerSig.signed && officerSig.signatureData) {
      if (officerSig.type === 'draw' && officerSig.signatureData.startsWith('data:image')) {
        await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, (3 * w) / 4 - 30 - 90, sigY + 35, 180, 80);
            resolve();
          };
          img.onerror = resolve;
          img.src = officerSig.signatureData;
        });
      } else {
        ctx.font = 'bold 26px "Brush Script MT", cursive, serif';
        ctx.fillStyle = '#1e3a8a';
        ctx.fillText(officerSig.signatureData || officerSig.name, (3 * w) / 4 - 30, sigY + 80);
        ctx.fillStyle = '#000000';
      }
    }

    // Full names at bottom
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 17px "Times New Roman", Times, serif';
    ctx.fillText(this.stripEmojis(document.getElementById('docReporterName')?.value || 'Người dân'), w / 4 + 30, sigY + 150);
    ctx.fillText(this.stripEmojis(document.getElementById('docOfficerName')?.value || 'Cán bộ trực ban'), (3 * w) / 4 - 30, sigY + 150);

    if (citizenSig.signedAt) {
      ctx.font = 'italic 12px "Times New Roman", Times, serif';
      ctx.fillText(`Ký lúc: ${this.formatSignatureTime(citizenSig)}`, w / 4 + 30, sigY + 170);
    }
    if (officerSig.signedAt) {
      ctx.font = 'italic 12px "Times New Roman", Times, serif';
      ctx.fillText(`Ký lúc: ${this.formatSignatureTime(officerSig)}`, (3 * w) / 4 - 30, sigY + 170);
    }

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = `Phieu_TiepNhan_UPSC_${docSosId.replace(/[^a-zA-Z0-9_-]/g, '')}.png`;
    a.href = dataUrl;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    alert('🖼️ Đã lưu Phiếu tiếp nhận dạng ảnh PNG có đầy đủ chữ ký thành công!');
  }

  bindReportDocxEvents() {
    const btnOpen = document.getElementById('btnOpenReportDocxModal');
    const btnSaveDossier = document.getElementById('btnSaveOfficerReportDossier');
    const btnDocx = document.getElementById('btnDownloadReportDocx');
    const btnImg = document.getElementById('btnDownloadReportImage');
    const btnPrint = document.getElementById('btnPrintReportPdf');
    const btnClose = document.getElementById('btnCloseReportDocxModal');
    const btnBottomClose = document.getElementById('btnBottomCloseReportDocx');

    // Save Dossier / Archive
    if (btnSaveDossier) {
      btnSaveDossier.addEventListener('click', async () => {
        if (!this.selectedIncidentId) return;
        const inc = this.incidents.get(this.selectedIncidentId);
        if (!inc) return;

        const offNameVal = (document.getElementById('docSignOfficerInput')?.value || document.getElementById('docOfficerName')?.value || '').trim();
        const repNameVal = (document.getElementById('docSignReporterInput')?.value || document.getElementById('docReporterName')?.value || '').trim();
        const isSigned = Boolean(inc.signatures?.isFullySigned);

        const payload = {
          id: inc.id,
          agency: inc.agency,
          agencyName: inc.agencyName,
          address: document.getElementById('docIncidentAddress')?.value || inc.address,
          officerName: offNameVal || this.currentDutyShift?.officerName || this.currentOfficer?.officerName || '',
          reporterName: repNameVal || inc.reporterName || '',
          reporterPhone: document.getElementById('docReporterPhone')?.value || inc.reporterPhone || '',
          incidentTime: document.getElementById('docIncidentTime')?.textContent || '',
          coords: document.getElementById('docIncidentCoords')?.value || '',
          description: document.getElementById('docIncidentDescription')?.value || '',
          helpRequest: document.getElementById('docHelpRequest')?.value || '',
          adviceGiven: document.getElementById('docAdviceGiven')?.value || '',
          resolutionResult: document.getElementById('docResolutionResult')?.value || '',
          signatures: inc.signatures || {}
        };

        try {
          btnSaveDossier.disabled = true;
          btnSaveDossier.textContent = '⏳ Đang lưu...';
          const res = await fetch('/api/dispatcher/save-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.ok) {
            if (offNameVal) {
              if (inc.dispatchUnit) inc.dispatchUnit.officerName = offNameVal;
              if (inc.assignedUnit) inc.assignedUnit.officerName = offNameVal;
              if (inc.signatures?.officer) inc.signatures.officer.name = offNameVal;
            }
            if (repNameVal) {
              inc.reporterName = repNameVal;
              if (inc.signatures?.citizen) inc.signatures.citizen.name = repNameVal;
            }
            inc.savedReport = payload;
            this.incidents.set(inc.id, inc);
            if (isSigned) {
              alert('📁 Đã lưu và hoàn tất lưu trữ hồ sơ tiếp nhận vào kho tác chiến!');
            } else {
              alert('✅ Đã lưu hồ sơ tiếp nhận và cập nhật thông tin cán bộ thành công!');
            }
          } else {
            alert('Lỗi: ' + (data.error || 'Không thể lưu'));
          }
        } catch (e) {
          alert('Lỗi kết nối máy chủ khi lưu hồ sơ');
        } finally {
          btnSaveDossier.disabled = false;
          btnSaveDossier.textContent = '💾 Lưu Lại Hồ Sơ Tiếp Nhận';
        }
      });
    }

    // Signature Triggers
    const btnCitizenSign = document.getElementById('btnOpenCitizenSignPad');
    const btnOfficerSign = document.getElementById('btnOpenOfficerSignPad');
    const btnCloseSig = document.getElementById('btnCloseSigPadModal');
    const btnSubmitSig = document.getElementById('btnSubmitSignature');
    const btnClearCanvas = document.getElementById('btnClearSigCanvas');

    if (btnOpen) {
      btnOpen.addEventListener('click', () => {
        if (this.selectedIncidentId) {
          const inc = this.incidents.get(this.selectedIncidentId);
          if (inc) this.openReportModal(inc);
        } else {
          alert('Vui lòng chọn một ca sự cố để xem phiếu!');
        }
      });
    }

    if (btnCitizenSign) btnCitizenSign.addEventListener('click', () => this.openSignaturePad('citizen'));
    if (btnOfficerSign) btnOfficerSign.addEventListener('click', () => this.openSignaturePad('officer'));
    if (btnCloseSig) {
      btnCloseSig.addEventListener('click', () => {
        const m = document.getElementById('signaturePadModal');
        if (m) {
          m.classList.remove('is-open');
          m.style.display = 'none';
        }
      });
    }
    if (btnClearCanvas) btnClearCanvas.addEventListener('click', () => this.clearSignatureCanvas());
    if (btnSubmitSig) btnSubmitSig.addEventListener('click', () => this.submitSignature());

    // Setup Draw / Type Tabs & Canvas
    const tabDraw = document.getElementById('tabSigDraw');
    const tabType = document.getElementById('tabSigType');
    const drawView = document.getElementById('sigDrawView');
    const typeView = document.getElementById('sigTypeView');
    const inputType = document.getElementById('inputSigTypedName');
    const previewType = document.getElementById('sigTypePreview');

    if (tabDraw && tabType) {
      tabDraw.addEventListener('click', () => {
        tabDraw.classList.add('is-active');
        tabType.classList.remove('is-active');
        if (drawView) drawView.style.display = 'flex';
        if (typeView) typeView.style.display = 'none';
      });
      tabType.addEventListener('click', () => {
        tabType.classList.add('is-active');
        tabDraw.classList.remove('is-active');
        if (typeView) typeView.style.display = 'flex';
        if (drawView) drawView.style.display = 'none';
      });
    }

    if (inputType && previewType) {
      inputType.addEventListener('input', () => {
        previewType.textContent = inputType.value || 'Chữ ký mẫu';
      });
    }

    // Canvas drawing setup
    const canvas = document.getElementById('sigCanvas');
    if (canvas) {
      let isDrawing = false;
      const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: (clientX - rect.left) * (canvas.width / rect.width),
          y: (clientY - rect.top) * (canvas.height / rect.height)
        };
      };

      const startDraw = (e) => {
        e.preventDefault();
        isDrawing = true;
        this.isSigCanvasDrawn = true;
        const ctx = canvas.getContext('2d');
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      };

      const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const ctx = canvas.getContext('2d');
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      };

      const endDraw = () => {
        isDrawing = false;
      };

      canvas.addEventListener('mousedown', startDraw);
      canvas.addEventListener('mousemove', draw);
      window.addEventListener('mouseup', endDraw);

      canvas.addEventListener('touchstart', startDraw, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      window.addEventListener('touchend', endDraw);
    }

    if (btnDocx) btnDocx.addEventListener('click', () => this.downloadReportDocx());
    if (btnImg) btnImg.addEventListener('click', () => this.downloadReportImage());
    if (btnPrint) btnPrint.addEventListener('click', () => {
      window.print();
    });

    const btnChatLog = document.getElementById('btnDownloadIncidentChatLog');
    if (btnChatLog) {
      btnChatLog.addEventListener('click', () => {
        if (this.selectedIncidentId) {
          this.downloadIncidentMessagesLog(this.selectedIncidentId);
        }
      });
    }

    const btnUndoHistory = document.getElementById('btnUndoHistoryDelete');
    if (btnUndoHistory) {
      btnUndoHistory.addEventListener('click', () => this.undoHistoryDelete());
    }

    const btnToastUndo = document.getElementById('btnToastUndoAction');
    if (btnToastUndo) {
      btnToastUndo.addEventListener('click', () => this.undoHistoryDelete());
    }

    const btnToastDismiss = document.getElementById('btnToastUndoDismiss');
    if (btnToastDismiss) {
      btnToastDismiss.addEventListener('click', () => this.hideUndoToast());
    }

    const closeFn = () => {
      const modal = document.getElementById('incidentReportDocxModal');
      if (!modal) return;

      const inc = this.selectedIncidentId ? this.incidents.get(this.selectedIncidentId) : null;
      if (inc && inc.status === 'resolved') {
        const citizenSigned = Boolean(inc.signatures?.citizen?.signed);
        const officerSigned = Boolean(inc.signatures?.officer?.signed);
        const isFullySigned = citizenSigned && officerSigned;

        if (!isFullySigned) {
          const forceClose = confirm(`⚠️ Ca sự cố #${inc.id} đã hoàn tất hiện trường nhưng chưa đủ chữ ký 2 bên:\n- Cán bộ trực ban: ${officerSigned ? '✅ ĐÃ KÝ' : '❌ CHƯA KÝ'}\n- Người dân: ${citizenSigned ? '✅ ĐÃ KÝ' : '❌ CHƯA KÝ'}\n\nBạn có muốn tạm đóng phiếu để bổ sung chữ ký sau không?`);
          if (!forceClose) return;
        }
      }

      modal.classList.remove('is-open');
      modal.style.display = 'none';
      modal.style.setProperty('display', 'none', 'important');
      if (inc && (inc.signatures?.isFullySigned || (inc.signatures?.citizen?.signed && inc.signatures?.officer?.signed))) {
        this.selectedIncidentId = null;
      }
    };
    if (btnClose) btnClose.addEventListener('click', closeFn);
    if (btnBottomClose) btnBottomClose.addEventListener('click', closeFn);
  }


  startVehicleSimulation(incident) {
    const unit = incident.dispatchUnit || incident.assignedUnit;
    if (!unit || !unit.lat) return;

    const start = { lat: unit.lat, lng: unit.lng };
    const end = { lat: incident.lat, lng: incident.lng };

    let progress = 0;
    const totalSteps = 15;

    if (this.simulationTimers.has(incident.id)) {
      clearInterval(this.simulationTimers.get(incident.id));
    }

    const timer = setInterval(async () => {
      progress++;
      const currentLat = start.lat + (end.lat - start.lat) * (progress / totalSteps);
      const currentLng = start.lng + (end.lng - start.lng) * (progress / totalSteps);
      const eta = Math.max(1, Math.round((incident.etaMinutes || 5) * (1 - progress / totalSteps)));

      if (this.mapController) {
        this.mapController.setVehicleMarker(currentLat, currentLng, incident.agency, incident.dispatchUnit?.unitName);
      }

      try {
        await fetch('/api/dispatcher/update-vehicle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: incident.id,
            lat: currentLat,
            lng: currentLng,
            etaMinutes: eta
          })
        });
      } catch (e) {}

      if (progress >= totalSteps) {
        clearInterval(timer);
        this.handleUpdateStatus('arrived', 'Đội cứu hộ đã tiếp cận hiện trường và đang tiến hành hỗ trợ trực tiếp.');
      }
    }, 3000);

    this.simulationTimers.set(incident.id, timer);
  }

  // =========================================================================
  // GATEKEEPER INTRO CINEMATIC (Video 3 - Strictly NO skip button, auto-fades)
  // =========================================================================
  playGatekeeperIntroVideo() {
    const overlay = document.getElementById('cyberIntroVideoOverlay');
    const video = document.getElementById('cyberIntroVideo');
    const mobileCard = document.getElementById('cyberIntroMobileCard');
    const progressBar = document.getElementById('cyberIntroProgressBar');
    const statusText = document.getElementById('cyberIntroStatusText');

    if (!overlay) {
      this.checkAuth();
      return;
    }

    // Ensure operational layer is completely hidden and Cosmic Portal is mounted behind video
    document.body.classList.remove('officer-authenticated');
    if (this.cosmicPortalView) {
      this.cosmicPortalView.style.display = 'block';
      this.cosmicPortalView.style.setProperty('display', 'block', 'important');
    }
    if (this.cyberGatekeeperModal) {
      this.cyberGatekeeperModal.style.display = 'none';
    }
    if (this.authGateModal) {
      this.authGateModal.style.display = 'none';
      this.authGateModal.style.setProperty('display', 'none', 'important');
    }

    overlay.style.display = 'flex';
    overlay.style.opacity = '1';

    let transitioned = false;
    const finishIntro = async () => {
      if (transitioned) return;
      transitioned = true;
      overlay.style.opacity = '0';
      setTimeout(async () => {
        overlay.style.display = 'none';
        try { if (video) video.pause(); } catch (e) {}
        await this.checkAuth();
      }, 650);
    };

    // Mobile / Touch / Small Screen Detection:
    // Strictly NEVER play video on mobile/touch to prevent iOS QuickTime AVPlayer or Android media popup!
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     window.innerWidth <= 820 || 
                     ('ontouchstart' in window && window.innerWidth <= 1024);

    if (isMobile) {
      // 100% Mobile Safe: Hide video tag completely so mobile OS never detects media playback
      if (video) {
        try { video.pause(); } catch(e) {}
        video.style.display = 'none';
      }
      if (mobileCard) {
        mobileCard.style.display = 'flex';
      }
      if (progressBar) {
        progressBar.style.width = '0%';
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (progressBar) progressBar.style.width = '100%';
          }, 60);
        });
      }
      if (statusText) {
        setTimeout(() => {
          if (statusText) statusText.textContent = 'GIẢI MÃ TỌA ĐỘ VÀ KẾT NỐI MẠNG ĐIỀU PHỐI...';
        }, 750);
        setTimeout(() => {
          if (statusText) statusText.textContent = 'HOÀN TẤT • ĐANG VÀO GIAO DIỆN TÁC CHIẾN!';
        }, 1450);
      }

      // Smooth cinematic transition after 1.85 seconds
      setTimeout(finishIntro, 1850);
      return;
    }

    // Desktop / Large Screen: Play video inline with strictly muted & playsinline
    if (mobileCard) mobileCard.style.display = 'none';
    if (video) {
      video.style.display = 'block';
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.currentTime = 0;
      video.onended = finishIntro;
      video.onerror = finishIntro;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Desktop video playback blocked, falling back to instant intro:', err);
          finishIntro();
        });
      }
    } else {
      finishIntro();
    }
  }

  // =========================================================================
  // FAKE ALARM & LINUX OSINT TRACE DOSSIER SYSTEM
  // =========================================================================
  openFakeAlarmConfirmModal(inc) {
    if (!inc) return;
    this.pendingFakeAlarmIncident = inc;
    const modal = document.getElementById('fakeAlarmConfirmModal');
    if (!modal) return;

    const sosIdEl = document.getElementById('fakeConfirmSosId');
    const reporterEl = document.getElementById('fakeConfirmReporter');
    const phoneEl = document.getElementById('fakeConfirmPhone');
    const addressEl = document.getElementById('fakeConfirmAddress');
    const ipEl = document.getElementById('fakeConfirmIp');

    if (sosIdEl) sosIdEl.textContent = inc.id || '---';
    if (reporterEl) reporterEl.textContent = inc.reporterName || inc.name || 'Người dân';
    if (phoneEl) phoneEl.textContent = inc.reporterPhone || inc.phone || 'Chưa rõ';
    if (addressEl) addressEl.textContent = inc.address || `${inc.lat?.toFixed(5)}, ${inc.lng?.toFixed(5)}`;
    if (ipEl) ipEl.textContent = inc.clientIp || inc.ipAddress || (inc.deviceTelemetry?.clientIp) || '127.0.0.1';

    const reasonSelect = document.getElementById('fakeAlarmReasonSelect');
    const notesInput = document.getElementById('fakeAlarmOfficerNotes');
    if (reasonSelect) reasonSelect.selectedIndex = 0;
    if (notesInput) notesInput.value = '';

    modal.style.display = 'flex';
  }

  closeFakeAlarmConfirmModal() {
    const modal = document.getElementById('fakeAlarmConfirmModal');
    if (modal) modal.style.display = 'none';
    this.pendingFakeAlarmIncident = null;
  }

  openOsintForensicModal(trace) {
    if (!trace) return;
    const incId = trace.incidentId || trace.id || trace.dossierId || 'DOS-FAKE-01';
    this.activeOsintTrace = {
      ...trace,
      id: incId,
      incidentId: incId
    };
    const modal = document.getElementById('osintForensicModal');
    if (!modal) return;

    const setT = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val !== undefined && val !== null && val !== '' ? val : '---';
    };

    setT('osintDossierId', incId);
    setT('osintReporterName', trace.reporterName || 'Chưa rõ');
    setT('osintReporterPhone', trace.reporterPhone || 'Chưa rõ');
    setT('osintReportedTime', trace.reportedTime || trace.createdAt ? new Date(trace.reportedTime || trace.createdAt).toLocaleString('vi-VN') : '---');
    setT('osintFlaggedTime', trace.flaggedAt || trace.flaggedTime ? new Date(trace.flaggedAt || trace.flaggedTime).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN'));
    setT('osintOfficerName', trace.flaggedBy || trace.officerName || 'Cán bộ trực ban');

    const lat = trace.reportedGps?.lat ?? trace.lat;
    const lng = trace.reportedGps?.lng ?? trace.lng;
    setT('osintGpsCoords', lat && lng ? `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}` : 'Chưa có tọa độ');
    setT('osintGpsAccuracy', trace.reportedGps?.accuracy ? `± ${trace.reportedGps.accuracy}m` : '± 12m');
    setT('osintAddress', trace.address || 'Không xác định');
    setT('osintReason', trace.flaggedReason || trace.reason || 'Báo khống không có sự việc');
    setT('osintOfficerNotes', trace.officerNotes || trace.notes || 'Không có ghi chú thêm từ hiện trường.');

    // IP & Device Fingerprint
    const clientIp = trace.clientIp || '127.0.0.1';
    setT('osintClientIpDisplay', clientIp);

    const telem = trace.deviceTelemetry || trace.telemetry || {};
    setT('osintPlatformDisplay', telem.platform || 'Không được cung cấp');
    setT('osintScreenDisplay', telem.screenResolution || 'Không được cung cấp');
    setT('osintNetworkDisplay', telem.networkType || 'Không được cung cấp');
    setT('osintUserAgentDisplay', telem.userAgent || 'Không được cung cấp');

    // Whois Link
    const whoisLink = document.getElementById('btnLookupIpWhois');
    if (whoisLink) {
      whoisLink.href = `https://ipinfo.io/${encodeURIComponent(clientIp)}`;
    }

    // Linux OSINT Commands
    const cmds = trace.linuxOsintCommands || {
      whois: `whois ${clientIp}`,
      traceroute: `traceroute -m 20 ${clientIp}`,
      curlGeoIp: `curl -s "http://ip-api.com/json/${clientIp}?fields=status,message,country,regionName,city,district,zip,lat,lon,timezone,isp,org,as,query"`
    };

    const cmdWhoisEl = document.getElementById('cmdWhois');
    if (cmdWhoisEl) cmdWhoisEl.textContent = cmds.whois || `whois ${clientIp}`;

    const cmdTraceEl = document.getElementById('cmdTraceroute');
    if (cmdTraceEl) cmdTraceEl.textContent = cmds.traceroute || `traceroute -m 20 ${clientIp}`;

    const cmdCurlEl = document.getElementById('cmdCurlGeo');
    if (cmdCurlEl) cmdCurlEl.textContent = cmds.curlGeoIp || `curl -s "http://ip-api.com/json/${clientIp}"`;

    modal.style.display = 'flex';
  }

  closeOsintForensicModal() {
    const modal = document.getElementById('osintForensicModal');
    if (modal) modal.style.display = 'none';
  }

  async downloadAdministrativeRecord(trace) {
    if (!trace) {
      trace = this.activeOsintTrace || {};
    }
    const incidentId = trace.incidentId || trace.id || trace.dossierId || document.getElementById('osintDossierId')?.textContent?.replace(/^[#\s]+/, '') || 'SOS-FAKE';
    const button = document.getElementById('btnDraftAdministrativeRecord');
    if (button) {
      button.disabled = true;
      button.textContent = '⏳ Đang tạo Word...';
    }
    try {
      const telemetry = trace.deviceTelemetry || trace.telemetry || {};
      const reporterName = trace.reporterName || document.getElementById('osintReporterName')?.textContent || 'Chưa rõ';
      const reporterPhone = trace.reporterPhone || document.getElementById('osintReporterPhone')?.textContent || 'Chưa rõ';
      const address = trace.address || document.getElementById('osintAddress')?.textContent || 'Không xác định';
      const reportedTime = trace.reportedTime || trace.createdAt || new Date().toISOString();
      const reason = trace.flaggedReason || trace.reason || document.getElementById('osintReason')?.textContent || 'Báo khống không có sự việc';
      const officerNotes = trace.officerNotes || trace.notes || document.getElementById('osintOfficerNotes')?.textContent || '';
      const clientIp = trace.clientIp || document.getElementById('osintClientIpDisplay')?.textContent || '127.0.0.1';
      const officerName = trace.flaggedBy || trace.officerName || this.currentOfficer?.name || document.getElementById('osintOfficerName')?.textContent || 'Cán bộ trực ban tác chiến';

      const inc = (this.incidents && this.incidents.get(incidentId)) || {};
      const response = await fetch('/api/export/verification-record-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId,
          recordNumber: trace.recordNumber || '01/BB-XM',
          officerName,
          officerTitle: this.currentOfficer?.rank || 'Cán bộ xử lý',
          agency: inc.agency || trace.agency || 'police',
          unitName: inc.dispatchUnit?.name || inc.assignedUnit?.name || trace.unitName || '',
          province: inc.jurisdiction?.province || trace.province || '',
          ward: inc.jurisdiction?.ward || trace.ward || '',
          district: inc.jurisdiction?.district || trace.district || '',
          reporterName,
          reporterPhone,
          address,
          reportedTime,
          reason,
          officerNotes,
          clientIp,
          platform: telemetry.platform || navigator.platform || 'Thiết bị người dùng'
        })
      });

      if (!response.ok) {
        let errMsg = 'Không thể tạo biên bản Word từ máy chủ.';
        try {
          const errData = await response.json();
          if (errData && errData.error) errMsg = errData.error;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DuThao_BienBan_XacMinh_${incidentId}.docx`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error('Verification record export failed:', error);
      alert(error.message || 'Không thể tạo biên bản Word từ máy chủ.');
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = '📝 Lập biên bản Word';
      }
    }
  }

  async openFakeArchiveModal() {
    const modal = document.getElementById('fakeArchiveListModal');
    if (!modal) return;
    modal.style.display = 'flex';
    await this.fetchAndRenderFakeArchive();
  }

  closeFakeArchiveModal() {
    const modal = document.getElementById('fakeArchiveListModal');
    if (modal) modal.style.display = 'none';
  }

  async fetchAndRenderFakeArchive() {
    const tbody = document.getElementById('fakeArchiveTableBody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #94a3b8;">Đang tải dữ liệu hồ sơ báo khống...</td></tr>`;
    }

    try {
      const res = await fetch('/api/dispatcher/fake-archive');
      const data = await res.json();
      if (data && data.ok && Array.isArray(data.archive)) {
        this.fakeArchiveList = data.archive;
        this.renderFakeArchiveTable(data.archive);
        this.updateFakeAlarmCount(data.archive.length);
      } else {
        if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #ef4444;">Không thể tải danh sách.</td></tr>`;
      }
    } catch (e) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #ef4444;">Lỗi kết nối máy chủ.</td></tr>`;
    }
  }

  renderFakeArchiveTable(list) {
    const tbody = document.getElementById('fakeArchiveTableBody');
    if (!tbody) return;

    if (!list || list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px; color: #94a3b8;">Chưa ghi nhận ca sự cố báo khống nào.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(item => {
      const timeStr = item.flaggedAt ? new Date(item.flaggedAt).toLocaleString('vi-VN') : '---';
      const reason = item.osintTrace?.flaggedReason || 'Báo khống không có sự việc';
      const ip = item.clientIp || item.osintTrace?.clientIp || '---';

      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
          <td style="padding: 8px 10px; font-weight: 700; color: #38bdf8; font-family: monospace;">#${item.id}</td>
          <td style="padding: 8px 10px; color: #cbd5e1; white-space: nowrap;">${timeStr}</td>
          <td style="padding: 8px 10px; font-weight: 600; color: #ffffff;">${item.reporterName || '---'}</td>
          <td style="padding: 8px 10px; color: #34d399; font-family: monospace;">${item.reporterPhone || '---'}</td>
          <td style="padding: 8px 10px; color: #38bdf8; font-family: monospace;">${ip}</td>
          <td style="padding: 8px 10px; color: #fca5a5; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${reason}">${reason}</td>
          <td style="padding: 8px 10px; text-align: center;">
            <div style="display: flex; gap: 6px; justify-content: center; align-items: center;">
              <button type="button" class="btn-refresh-loc btn-view-osint-row" data-id="${item.id}" style="padding: 4px 8px; font-size: 11px; border-color: #ef4444; color: #fca5a5; display: inline-flex; align-items: center; gap: 3px;" title="Xem chi tiết dấu vết trinh sát OSINT">
                🕵️‍♂️ Xem OSINT
              </button>
              <button type="button" class="btn-refresh-loc btn-delete-fake-row" data-id="${item.id}" onclick="event.stopPropagation(); (window.dispatcher || window.dispatcherApp)?.deleteFakeArchiveItem?.('${item.id}')" style="padding: 4px 8px; font-size: 11px; border-color: rgba(239, 68, 68, 0.4); color: #f87171; background: rgba(239, 68, 68, 0.12); display: inline-flex; align-items: center; gap: 3px;" title="Xóa hồ sơ báo khống này">
                <svg class="svg-ico ico-xs ico-red" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Xóa
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Bind row clicks - View OSINT
    tbody.querySelectorAll('.btn-view-osint-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const match = this.fakeArchiveList?.find(x => x.id === id);
        if (match) {
          const traceData = {
            ...(match.osintTrace || {}),
            id: match.id,
            incidentId: match.id,
            reporterName: match.reporterName || match.osintTrace?.reporterName,
            reporterPhone: match.reporterPhone || match.osintTrace?.reporterPhone,
            address: match.address || match.osintTrace?.address,
            reportedTime: match.createdAt || match.osintTrace?.reportedTime,
            clientIp: match.clientIp || match.osintTrace?.clientIp,
            flaggedReason: match.osintTrace?.flaggedReason || match.reason,
            officerNotes: match.osintTrace?.officerNotes || match.notes,
            flaggedBy: match.osintTrace?.flaggedBy || match.flaggedBy
          };
          this.openOsintForensicModal(traceData);
        }
      });
    });

    // Bind row clicks - Delete single fake incident
    tbody.querySelectorAll('.btn-delete-fake-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = e.currentTarget.getAttribute('data-id');
        if (id) this.deleteFakeArchiveItem(id);
      });
    });
  }

  async deleteFakeArchiveItem(id) {
    if (!id) return;
    const cleanId = String(id).replace(/^[#\s]+/, '');
    const confirmDelete = confirm(`Bạn có chắc chắn muốn xóa hồ sơ báo khống #${cleanId} khỏi danh sách lưu trữ?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch('/api/dispatcher/fake-archive/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cleanId })
      });
      const data = await res.json();
      if (data && data.ok) {
        this.fakeArchiveList = (this.fakeArchiveList || []).filter(x => {
          const xid = String(x.id || x.incidentId || '').replace(/^[#\s]+/, '');
          return xid !== cleanId && !xid.includes(cleanId) && !cleanId.includes(xid);
        });
        this.renderFakeArchiveTable(this.fakeArchiveList);
        this.updateFakeAlarmCount(this.fakeArchiveList.length);
      } else {
        alert(data?.error || 'Không thể xóa hồ sơ báo khống.');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ khi xóa hồ sơ.');
    }
  }

  async clearAllFakeArchive() {
    if (!this.fakeArchiveList || this.fakeArchiveList.length === 0) {
      alert('Danh sách hồ sơ báo khống hiện đang trống.');
      return;
    }

    const confirmClear = confirm(`CẢNH BÁO QUẢN TRỊ:\nBạn có chắc chắn muốn DỌN DẸP TOÀN BỘ (${this.fakeArchiveList.length}) hồ sơ báo khống và dấu vết OSINT đã lưu trữ không?\n\nThao tác này sẽ làm sạch danh sách lưu trữ.`);
    if (!confirmClear) return;

    try {
      const res = await fetch('/api/dispatcher/fake-archive/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data && data.ok) {
        this.fakeArchiveList = [];
        this.renderFakeArchiveTable([]);
        this.updateFakeAlarmCount(0);
      } else {
        alert(data?.error || 'Không thể dọn dẹp danh sách.');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ khi dọn dẹp.');
    }
  }

  updateFakeAlarmCount(count) {
    const el = document.getElementById('statFakeAlarmCount');
    if (el) {
      if (typeof count === 'number') {
        el.textContent = count;
      } else if (this.fakeArchiveList && Array.isArray(this.fakeArchiveList)) {
        el.textContent = this.fakeArchiveList.length;
      } else {
        this.fetchFakeAlarmCount();
      }
    }
  }

  bindFakeAlarmAndOsintEvents() {
    // 1. Confirm Modal Buttons
    const btnCloseConfirm = document.getElementById('btnCloseFakeConfirmModal');
    const btnCancelConfirm = document.getElementById('btnCancelFakeConfirm');
    if (btnCloseConfirm) btnCloseConfirm.addEventListener('click', () => this.closeFakeAlarmConfirmModal());
    if (btnCancelConfirm) btnCancelConfirm.addEventListener('click', () => this.closeFakeAlarmConfirmModal());

    // 2. Submit Fake Alarm Form
    const formConfirm = document.getElementById('formConfirmFakeAlarm');
    if (formConfirm) {
      formConfirm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const inc = this.pendingFakeAlarmIncident;
        if (!inc) return;

        const reasonSelect = document.getElementById('fakeAlarmReasonSelect');
        const notesInput = document.getElementById('fakeAlarmOfficerNotes');
        const reason = reasonSelect ? reasonSelect.value : 'Đến hiện trường không có sự việc xảy ra';
        const notes = notesInput ? notesInput.value.trim() : '';

        try {
          const res = await fetch('/api/dispatcher/flag-fake', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: inc.id,
              reason: reason,
              notes: notes,
              officerName: this.currentOfficer?.name || this.currentOfficer?.fullTitle || 'Cán bộ tiếp cận hiện trường'
            })
          });

          const data = await res.json();
          if (data && data.ok) {
            this.closeFakeAlarmConfirmModal();

            // Update local memory incident
            inc.status = 'fake_alarm';
            inc.isFakeAlarm = true;
            inc.fakeAlarmTrace = data.osintTrace;
            this.incidents.set(inc.id, inc);

            // Re-render UI drawer & badges
            this.updateDrawer(inc);
            this.fetchFakeAlarmCount();
            if (this.renderIncidentsList) this.renderIncidentsList();

            // Open OSINT Forensic Modal directly for officer inspection
            this.openOsintForensicModal(data.osintTrace);

            // Show confirmation toast
            alert(`🚨 Đã lập hồ sơ báo khống thành công!\nThiết bị & IP (${data.osintTrace.clientIp}) đã được trích xuất dấu vết trinh sát OSINT.`);
          } else {
            alert(data.error || 'Có lỗi khi xác nhận báo khống.');
          }
        } catch (err) {
          console.error('Error submitting fake alarm:', err);
          alert('Không thể kết nối đến máy chủ.');
        }
      });
    }

    // 3. Close OSINT Modal
    const btnCloseOsint = document.getElementById('btnCloseOsintModal');
    if (btnCloseOsint) btnCloseOsint.addEventListener('click', () => this.closeOsintForensicModal());

    const btnDraftRecord = document.getElementById('btnDraftAdministrativeRecord');
    if (btnDraftRecord) btnDraftRecord.addEventListener('click', () => this.downloadAdministrativeRecord(this.activeOsintTrace));

    // 4. Copy IP
    const btnCopyIp = document.getElementById('btnCopyOsintIp');
    if (btnCopyIp) {
      btnCopyIp.addEventListener('click', () => {
        const ip = this.activeOsintTrace?.clientIp || document.getElementById('osintClientIpDisplay')?.textContent;
        if (ip && ip !== '---') {
          navigator.clipboard.writeText(ip);
          btnCopyIp.textContent = '✅ Đã chép IP';
          setTimeout(() => { btnCopyIp.textContent = '📋 Sao chép IP'; }, 2000);
        }
      });
    }

    // 5. Copy Single Linux Command
    document.querySelectorAll('.btn-copy-single-cmd').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetId = e.currentTarget.getAttribute('data-target');
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          navigator.clipboard.writeText(targetEl.textContent.trim());
          const originalText = e.currentTarget.textContent;
          e.currentTarget.textContent = '✅ Đã chép';
          setTimeout(() => { e.currentTarget.textContent = originalText; }, 2000);
        }
      });
    });

    // 6. Copy All Linux Commands
    const btnCopyAll = document.getElementById('btnCopyAllLinuxCommands');
    if (btnCopyAll) {
      btnCopyAll.addEventListener('click', () => {
        const trace = this.activeOsintTrace;
        const ip = trace?.clientIp || '127.0.0.1';
        const allCmds = [
          `# === OSINT INVESTIGATION DOSSIER FOR IP: ${ip} ===`,
          `whois ${ip}`,
          `traceroute -m 20 ${ip}`,
          `curl -s "http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,district,zip,lat,lon,timezone,isp,org,as,query"`,
          `nslookup ${ip}`,
          `ping -c 4 ${ip}`
        ].join('\n');

        navigator.clipboard.writeText(allCmds);
        btnCopyAll.textContent = '✅ Đã chép tất cả';
        setTimeout(() => { btnCopyAll.textContent = '📋 Sao chép tất cả lệnh'; }, 2000);
      });
    }

    // 7. Export OSINT Dossier Text Report
    const btnExport = document.getElementById('btnExportOsintDossier');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        const trace = this.activeOsintTrace;
        if (!trace) return;

        const reportText = [
          '========================================================================',
          'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
          'Độc lập - Tự do - Hạnh phúc',
          '------------------------------------------------------------------------',
          'BIÊN BẢN ĐIỀU TRA DẤU VẾT OSINT & THIẾT BỊ BÁO KHỐNG SỰ CỐ KHẨN CẤP',
          'Căn cứ rà soát: Điểm c khoản 2 Điều 7 Nghị định số 144/2021/NĐ-CP của Chính phủ',
          '========================================================================',
          '',
          `Mã Hồ Sơ Ca: #${trace.incidentId || trace.id || 'N/A'}`,
          `Thời Điểm Báo Tin: ${trace.reportedTime || trace.createdAt || 'N/A'}`,
          `Thời Điểm Lập Biên Bản: ${trace.flaggedAt || new Date().toISOString()}`,
          `Cán Bộ Lập Hồ Sơ: ${trace.flaggedBy || trace.officerName || 'Cán bộ trực ban'}`,
          '',
          '1. THÔNG TIN ĐỐI TƯỢNG KHAI BÁO:',
          `- Họ và tên: ${trace.reporterName || 'Chưa rõ'}`,
          `- Số điện thoại: ${trace.reporterPhone || 'Chưa rõ'}`,
          `- Địa chỉ khai báo: ${trace.address || 'Không xác định'}`,
          `- Tọa độ GPS: ${trace.reportedGps?.lat}, ${trace.reportedGps?.lng} (Sai số: ±${trace.reportedGps?.accuracy || 10}m)`,
          '',
          '2. KẾT LUẬN HIỆN TRƯỜNG:',
          `- Lý do xác định báo khống: ${trace.flaggedReason || 'Đến hiện trường không có sự việc xảy ra'}`,
          `- Ghi chú cán bộ hiện trường: ${trace.officerNotes || 'Không có'}`,
          '',
          '3. DẤU VẾT MẠNG VÀ THIẾT BỊ (CYBER FORENSICS / OSINT):',
          `- Địa chỉ IP nguồn: ${trace.clientIp}`,
          `- Hệ điều hành: ${trace.deviceTelemetry?.platform || 'Linux/Windows'}`,
          `- Độ phân giải: ${trace.deviceTelemetry?.screenResolution || 'N/A'}`,
          `- Kết nối mạng: ${trace.deviceTelemetry?.networkType || 'N/A'}`,
          `- User-Agent: ${trace.deviceTelemetry?.userAgent || 'N/A'}`,
          '',
          '4. BỘ LỆNH TRINH SÁT LINUX ĐÃ TẠO:',
          `  $ whois ${trace.clientIp}`,
          `  $ traceroute -m 20 ${trace.clientIp}`,
          `  $ curl -s "http://ip-api.com/json/${trace.clientIp}"`,
          '',
          '5. LƯU Ý PHÁP LÝ:',
          '  Dữ liệu kỹ thuật là manh mối, cần xác minh và xử lý theo thẩm quyền; không tự kết luận danh tính hoặc trách nhiệm pháp lý.',
          '========================================================================'
        ].join('\n');

        const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BienBan_OSINT_BaoKhong_${trace.incidentId || 'SOS'}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }

    // 8. Ban IP From OSINT
    const btnBan = document.getElementById('btnBanIpFromOsint');
    if (btnBan) {
      btnBan.addEventListener('click', async () => {
        const trace = this.activeOsintTrace;
        const ip = trace?.clientIp;
        if (!ip || ip === '---' || ip === '127.0.0.1') {
          alert('Không thể khóa địa chỉ IP loopback nội bộ.');
          return;
        }

        const confirmBan = confirm(`CẢNH BÁO TÁC CHIẾN:\nBạn có chắc chắn muốn KHÓA VĨNH VIỄN địa chỉ IP [${ip}] trên toàn bộ tường lửa phòng thủ không?`);
        if (!confirmBan) return;

        try {
          const res = await fetch('/api/security/ban-ip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ip: ip,
              reason: `Báo khống sự cố ca #${trace.incidentId || ''} (${trace.flaggedReason || ''})`
            })
          });
          const data = await res.json();
          if (data && data.ok) {
            alert(`✅ ${data.message}`);
          } else {
            alert(data.error || 'Lỗi khi khóa IP.');
          }
        } catch (e) {
          alert('Lỗi kết nối máy chủ.');
        }
      });
    }

    // 9. Fake Archive Modal Controls
    const btnCloseArchive = document.getElementById('btnCloseFakeArchiveModal');
    if (btnCloseArchive) btnCloseArchive.addEventListener('click', () => this.closeFakeArchiveModal());

    const btnClearAllArchive = document.getElementById('btnClearAllFakeArchive');
    if (btnClearAllArchive) {
      btnClearAllArchive.addEventListener('click', () => this.clearAllFakeArchive());
    }

    const btnOpenFakePill = document.getElementById('btnOpenFakeArchivePill');
    if (btnOpenFakePill) {
      btnOpenFakePill.addEventListener('click', () => this.openFakeArchiveModal());
    }

    const inputSearch = document.getElementById('inputSearchFakeArchive');
    if (inputSearch) {
      inputSearch.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        if (!this.fakeArchiveList) return;
        if (!q) {
          this.renderFakeArchiveTable(this.fakeArchiveList);
          return;
        }
        const filtered = this.fakeArchiveList.filter(item => {
          return (item.id && item.id.toLowerCase().includes(q)) ||
                 (item.reporterName && item.reporterName.toLowerCase().includes(q)) ||
                 (item.reporterPhone && item.reporterPhone.includes(q)) ||
                 (item.clientIp && item.clientIp.includes(q)) ||
                 (item.osintTrace?.flaggedReason && item.osintTrace.flaggedReason.toLowerCase().includes(q));
        });
        this.renderFakeArchiveTable(filtered);
      });
    }

    // Initial count fetch
    this.fetchFakeAlarmCount();
  }

  async fetchFakeAlarmCount() {
    try {
      const prov = this.currentOfficer?.province || '';
      const ward = this.currentOfficer?.ward || '';
      const level = this.currentOfficer?.level || '';
      const q = `?province=${encodeURIComponent(prov)}&ward=${encodeURIComponent(ward)}&level=${encodeURIComponent(level)}`;
      const res = await fetch(`/api/dispatcher/fake-archive${q}`);
      const data = await res.json();
      if (data && data.ok && Array.isArray(data.archive)) {
        this.fakeArchiveList = data.archive;
        const el = document.getElementById('statFakeAlarmCount');
        if (el) el.textContent = data.archive.length;
      }
    } catch (e) {}
  }

  // =========================================================================
  // TERRITORY STATS MODAL & PRINTING (HÌNH 2 TOP-BAR PILL CLICKS)
  // =========================================================================
  bindTerritoryStatsEvents() {
    // 1. Top bar pills click
    const pillMap = [
      { id: 'statTotalPill', filter: 'all' },
      { id: 'statWaitingPill', filter: 'police' },
      { id: 'statProcessingPill', filter: 'csgt' },
      { id: 'statUrgentPill', filter: 'fire' },
      { id: 'statHospitalPill', filter: 'hospital' },
      { id: 'statRescuePill', filter: 'traffic-rescue' }
    ];

    pillMap.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) {
        el.addEventListener('click', () => {
          this.openTerritoryStatsModal(item.filter);
        });
      }
    });

    // 2. Filter tabs inside modal
    const filterTabs = document.querySelectorAll('.territory-stat-filter-tab');
    filterTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        filterTabs.forEach(t => t.classList.remove('is-active'));
        e.currentTarget.classList.add('is-active');
        const filter = e.currentTarget.getAttribute('data-filter') || 'all';
        this.renderTerritoryStatsTable(filter);
      });
    });

    // 3. Search input
    const searchInput = document.getElementById('inputSearchTerritoryStats');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const activeTab = document.querySelector('.territory-stat-filter-tab.is-active');
        const filter = activeTab ? activeTab.getAttribute('data-filter') : 'all';
        this.renderTerritoryStatsTable(filter);
      });
    }

    // 4. Modal action buttons
    const btnClose = document.getElementById('btnCloseTerritoryStatsModal');
    if (btnClose) btnClose.addEventListener('click', () => this.closeTerritoryStatsModal());

    const btnBottomClose = document.getElementById('btnBottomCloseStatsModal');
    if (btnBottomClose) btnBottomClose.addEventListener('click', () => this.closeTerritoryStatsModal());

    const btnPrint = document.getElementById('btnPrintTerritoryStats');
    if (btnPrint) btnPrint.addEventListener('click', () => this.printTerritoryStats());

    const btnDownloadPdf = document.getElementById('btnDownloadTerritoryPdf');
    if (btnDownloadPdf) btnDownloadPdf.addEventListener('click', () => this.printTerritoryStats());

    const btnExportCsv = document.getElementById('btnExportTerritoryStatsCsv');
    if (btnExportCsv) btnExportCsv.addEventListener('click', () => this.exportTerritoryStatsCsv());

    const btnDownloadWord = document.getElementById('btnDownloadTerritoryWord');
    if (btnDownloadWord) btnDownloadWord.addEventListener('click', () => this.downloadTerritoryWord());
  }

  openTerritoryStatsModal(agencyFilter = 'all') {
    const modal = document.getElementById('territoryStatsModal');
    if (!modal) return;

    // Cập nhật tiêu đề đơn vị
    const upperTitle = document.getElementById('printUpperAgency');
    const lowerTitle = document.getElementById('printLowerAgency');
    const modalSubtitle = document.getElementById('territoryStatsModalSubtitle');
    const datePlace = document.getElementById('printDatePlace');
    const officerFooter = document.getElementById('printOfficerNameFooter');

    const officer = this.currentOfficer;
    const prov = officer?.province || 'Cần Thơ';
    const ward = officer?.ward || '';
    const officerName = officer?.name || officer?.fullTitle || officer?.officerName || 'Cán bộ trực ban';
    const agencyName = officer?.agencyName || 'CÔNG AN NHÂN DÂN';

    if (upperTitle) upperTitle.textContent = officer?.level === 'ward' ? `CÔNG AN TP. ${prov.toUpperCase()}` : 'BỘ CÔNG AN / TTCH QUỐC GIA';
    if (lowerTitle) lowerTitle.textContent = officer?.level === 'ward' ? `CÔNG AN ${ward.toUpperCase()}` : (officer?.level === 'province' ? `CÔNG AN TP. ${prov.toUpperCase()}` : agencyName.toUpperCase());
    if (modalSubtitle) modalSubtitle.textContent = `${officer?.level === 'ward' ? 'CÔNG AN ' + ward.toUpperCase() + ' - ' : ''}${prov.toUpperCase()}`;
    
    const now = new Date();
    if (datePlace) datePlace.textContent = `${prov}, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
    if (officerFooter) officerFooter.textContent = officerName;

    // Active đúng tab
    const tabs = document.querySelectorAll('.territory-stat-filter-tab');
    tabs.forEach(t => {
      t.classList.toggle('is-active', t.getAttribute('data-filter') === agencyFilter);
    });

    // Reset search
    const searchInput = document.getElementById('inputSearchTerritoryStats');
    if (searchInput) searchInput.value = '';

    modal.style.display = 'flex';
    this.renderTerritoryStatsTable(agencyFilter);
  }

  closeTerritoryStatsModal() {
    const modal = document.getElementById('territoryStatsModal');
    if (modal) modal.style.display = 'none';
  }

  getFilteredTerritoryIncidents(agencyFilter = 'all') {
    let list = Array.from(this.incidents.values());

    // 1. Phân loại lực lượng
    if (agencyFilter === 'fake_alarm') {
      list = list.filter(i => i.status === 'fake_alarm' || i.isFakeAlarm);
    } else if (agencyFilter === 'hospital') {
      list = list.filter(i => i.agency === 'hospital' || i.agency === 'ambulance');
    } else if (agencyFilter !== 'all') {
      list = list.filter(i => i.agency === agencyFilter);
    }

    // 2. Tìm kiếm từ khóa
    const searchInput = document.getElementById('inputSearchTerritoryStats');
    const q = (searchInput?.value || '').toLowerCase().trim();
    if (q) {
      list = list.filter(i => {
        const id = String(i.id || '').toLowerCase();
        const rep = String(i.reporterName || '').toLowerCase();
        const phone = String(i.reporterPhone || '').toLowerCase();
        const addr = String(i.address || '').toLowerCase();
        const ward = String(i.jurisdiction?.ward || '').toLowerCase();
        const tags = Array.isArray(i.incidentTags) ? i.incidentTags.join(' ').toLowerCase() : '';
        return id.includes(q) || rep.includes(q) || phone.includes(q) || addr.includes(q) || ward.includes(q) || tags.includes(q);
      });
    }

    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  renderTerritoryStatsTable(agencyFilter = 'all') {
    const tbody = document.getElementById('territoryStatsTableBody');
    const footerCount = document.getElementById('footerStatDisplayCount');
    const categoryTitle = document.getElementById('printFilterCategoryTitle');
    if (!tbody) return;

    // Cập nhật số liệu trên các tab
    const allInc = Array.from(this.incidents.values());
    const countAll = allInc.length;
    const countPolice = allInc.filter(i => i.agency === 'police').length;
    const countCsgt = allInc.filter(i => i.agency === 'csgt').length;
    const countFire = allInc.filter(i => i.agency === 'fire').length;
    const countHosp = allInc.filter(i => i.agency === 'hospital' || i.agency === 'ambulance').length;
    const countRescue = allInc.filter(i => i.agency === 'traffic-rescue').length;
    const countFake = allInc.filter(i => i.status === 'fake_alarm' || i.isFakeAlarm).length;

    const setBadge = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setBadge('tabCountAll', countAll);
    setBadge('tabCountPolice', countPolice);
    setBadge('tabCountCsgt', countCsgt);
    setBadge('tabCountFire', countFire);
    setBadge('tabCountHospital', countHosp);
    setBadge('tabCountRescue', countRescue);
    setBadge('tabCountFake', countFake);

    const filterLabels = {
      all: 'Toàn bộ sự cố trên địa bàn quản lý',
      police: 'Lực lượng Công An Khu Vực / Cảnh Sát Trật Tự',
      csgt: 'Lực lượng Cảnh Sát Giao Thông',
      fire: 'Lực lượng Cảnh sát PCCC & CNCH',
      hospital: 'Lực lượng Cấp Cứu Y Tế 115',
      'traffic-rescue': 'Lực lượng Cứu Hộ Giao Thông & Đường Bộ',
      fake_alarm: 'Hồ sơ sự cố Báo Khống & Dấu Vết OSINT'
    };
    if (categoryTitle) categoryTitle.textContent = `Phân loại: ${filterLabels[agencyFilter] || 'Toàn bộ sự cố'}`;

    const list = this.getFilteredTerritoryIncidents(agencyFilter);
    if (footerCount) footerCount.textContent = list.length;

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 36px; color: #94a3b8; font-style: italic;">
            Không có dữ liệu ca sự cố nào phù hợp với bộ lọc hiện tại.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map((inc, index) => {
      const timeStr = new Date(inc.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
      const agencyBadge = inc.agency === 'police' ? '👮 Công An' : (inc.agency === 'csgt' ? '🚗 CSGT' : (inc.agency === 'fire' ? '🚒 PCCC' : (inc.agency === 'hospital' || inc.agency === 'ambulance' ? '🚑 115' : '🛠️ Cứu Hộ')));
      const tags = (inc.incidentTags || []).join(', ') || 'Cần hỗ trợ khẩn cấp';
      const reporter = `${inc.reporterName || 'Người dân'} (${inc.reporterPhone || '—'})`;
      const location = `${inc.address || 'Hiện trường'} - ${inc.jurisdiction?.ward || ''}`;
      
      let statusLabel = 'Đang xử lý';
      let statusColor = '#38bdf8';
      if (inc.status === 'resolved' || !this.isIncidentActive(inc)) {
        statusLabel = 'Hoàn tất';
        statusColor = '#34d399';
      } else if (inc.status === 'fake_alarm') {
        statusLabel = 'Báo khống';
        statusColor = '#f87171';
      } else if (inc.status === 'escalated') {
        statusLabel = 'Leo thang Tỉnh';
        statusColor = '#fb923c';
      } else if (inc.status === 'pending') {
        statusLabel = 'Chờ tiếp nhận';
        statusColor = '#fbbf24';
      }

      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
          <td style="padding: 8px 6px; text-align: center; font-weight: 700;">${index + 1}</td>
          <td style="padding: 8px 6px; font-weight: 800; color: #38bdf8;">#${inc.id}</td>
          <td style="padding: 8px 6px; font-size: 11px;">${timeStr}</td>
          <td style="padding: 8px 6px; font-weight: 700;">${agencyBadge}</td>
          <td style="padding: 8px 6px;">${tags}</td>
          <td style="padding: 8px 6px;">${reporter}</td>
          <td style="padding: 8px 6px; font-size: 11.5px;">${location}</td>
          <td style="padding: 8px 6px; text-align: center;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10.5px; font-weight: 700; color: ${statusColor}; background: rgba(255,255,255,0.05); border: 1px solid ${statusColor};">
              ${statusLabel}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  }

  printTerritoryStats() {
    window.print();
  }

  exportTerritoryStatsCsv() {
    const activeTab = document.querySelector('.territory-stat-filter-tab.is-active');
    const filter = activeTab ? activeTab.getAttribute('data-filter') : 'all';
    const list = this.getFilteredTerritoryIncidents(filter);

    const headers = ['STT', 'Ma SOS', 'Thoi Gian', 'Luc Luong', 'Noi Dung', 'Nguoi Bao', 'SDT', 'Dia Chi', 'Phuong Xa', 'Tinh TP', 'Trang Thai'];
    let rows = [];
    if (list.length === 0) {
      const officer = this.currentOfficer || {};
      const prov = officer.province || 'Cần Thơ';
      const ward = officer.ward || '';
      rows = [[
        1,
        'SOS-0000',
        new Date().toLocaleString('vi-VN'),
        filter.toUpperCase(),
        'Trong ca trực không phát sinh sự cố khẩn cấp (Địa bàn an toàn tuyệt đối)',
        officer.name || 'Cán bộ trực ban',
        officer.phone || '---',
        'Địa bàn quản lý an toàn',
        ward,
        prov,
        'Bình thường'
      ]];
    } else {
      rows = list.map((inc, i) => [
      i + 1,
      inc.id,
      new Date(inc.createdAt).toLocaleString('vi-VN'),
      inc.agency,
      (inc.incidentTags || []).join('; '),
      inc.reporterName || '',
      inc.reporterPhone || '',
      (inc.address || '').replace(/,/g, ' - '),
      inc.jurisdiction?.ward || '',
      inc.jurisdiction?.province || '',
      inc.status
      ]);
    }

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ThongKe_SuCo_${filter}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  downloadTerritoryWord() {
    const activeTab = document.querySelector('.territory-stat-filter-tab.is-active');
    const filter = activeTab ? activeTab.getAttribute('data-filter') : 'all';
    const incidents = this.getFilteredTerritoryIncidents(filter);

    const officer = this.currentOfficer || {};
    const prov = (officer.province || 'Cần Thơ').toUpperCase();
    const ward = (officer.ward || '').toUpperCase();
    const agencyName = (officer.agencyName || 'CÔNG AN NHÂN DÂN').toUpperCase();
    const now = new Date();
    const dateStr = `ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;

    let rowsHtml = '';
    if (incidents.length === 0) {
      rowsHtml = `
        <tr>
          <td colspan="8" style="border: 1px solid #000; padding: 16px; text-align: center; font-style: italic; color: #334155;">
            Trong ca trực không phát sinh sự cố khẩn cấp trên địa bàn. Tình hình an ninh trật tự, an toàn xã hội được giữ vững và kiểm soát an toàn tuyệt đối.
          </td>
        </tr>`;
    } else {
      incidents.forEach((inc, idx) => {
      const timeStr = inc.createdAt ? new Date(inc.createdAt).toLocaleString('vi-VN') : '';
      const agencyLabel = inc.agency === 'police' ? 'Công An' : (inc.agency === 'csgt' ? 'CSGT' : (inc.agency === 'fire' ? 'PCCC & CNCH' : (inc.agency === 'hospital' ? 'Cấp Cứu' : 'Cứu Hộ')));
      const statusLabel = inc.status === 'resolved' ? 'Hoàn tất' : (inc.status === 'dispatching' ? 'Đang điều động' : (inc.status === 'arrived' ? 'Đã tiếp cận' : (inc.status === 'fake_alarm' ? 'Báo khống' : 'Chờ tiếp nhận')));
      rowsHtml += `
        <tr>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${idx + 1}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">#${inc.id}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${timeStr}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${agencyLabel}</td>
          <td style="border: 1px solid #000; padding: 6px;">${inc.incidentTags ? inc.incidentTags.join(', ') : (inc.incidentTag || inc.customNotes || 'Cần hỗ trợ')}</td>
          <td style="border: 1px solid #000; padding: 6px;">${inc.reporterName || 'Người dân'} (${inc.reporterPhone || '---'})</td>
          <td style="border: 1px solid #000; padding: 6px;">${inc.address || ''}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">${statusLabel}</td>
        </tr>`;
      });
    }

    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Báo Cáo Thống Kê Sự Cố</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.3; margin: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { border: 1px solid #000; padding: 8px; background-color: #f2f2f2; font-weight: bold; font-size: 11pt; text-align: center; }
          td { border: 1px solid #000; padding: 6px; font-size: 11pt; }
        </style>
      </head>
      <body>
        <table style="width: 100%; border: none; margin-bottom: 20px;">
          <tr>
            <td style="width: 45%; text-align: center; border: none; vertical-align: top;">
              <b>${officer.level === 'ward' ? 'CÔNG AN TP. ' + prov : 'BỘ CÔNG AN'}</b><br/>
              <b>${officer.level === 'ward' ? 'CÔNG AN ' + ward : agencyName}</b><br/>
              Số: ......./BC-CA
            </td>
            <td style="width: 55%; text-align: center; border: none; vertical-align: top;">
              <b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br/>
              <b><u>Độc lập - Tự do - Hạnh phúc</u></b><br/>
              <i>${prov}, ${dateStr}</i>
            </td>
          </tr>
        </table>
        <h2 style="text-align: center; font-size: 16pt; margin: 15px 0 5px 0;">BÁO CÁO THỐNG KÊ CHI TIẾT SỰ CỐ & ĐIỀU PHỐI TÁC CHIẾN</h2>
        <div style="text-align: center; font-style: italic; margin-bottom: 15px;">Địa bàn: ${officer.level === 'ward' ? 'Xã/Phường ' + ward + ' - ' : ''}${prov} (Tổng số: ${incidents.length} vụ việc)</div>
        <table>
          <thead>
            <tr>
              <th style="width: 35px;">STT</th>
              <th style="width: 110px;">Mã SOS</th>
              <th style="width: 110px;">Thời Gian</th>
              <th style="width: 80px;">Lực Lượng</th>
              <th>Nội Dung Sự Cố</th>
              <th style="width: 130px;">Người Báo</th>
              <th>Địa Bàn Hiện Trường</th>
              <th style="width: 90px;">Trạng Thái</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <table style="width: 100%; border: none; margin-top: 35px;">
          <tr>
            <td style="width: 50%; border: none;"></td>
            <td style="width: 50%; text-align: center; border: none;">
              <b>THỦ TRƯỞNG ĐƠN VỊ</b><br/>
              <i>(Ký, ghi rõ họ tên và đóng dấu)</i><br/><br/><br/><br/><br/>
              <b>${officer.name || officer.officerName || 'Cán bộ chỉ huy'}</b>
            </td>
          </tr>
        </table>
      </body>
      </html>`;

    const blob = new Blob(['\ufeff', docContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_Cao_Thong_Ke_Su_Co_${(officer.ward || officer.province || 'DiaPhuong').replace(/\s+/g, '_')}_${Date.now()}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.dispatcher = window.dispatcherApp = new DispatcherApp();
});
