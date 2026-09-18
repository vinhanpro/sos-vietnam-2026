import { LocationService } from './location.js';
import { MapController } from './map-controller.js';

// Incident Suggestion Dictionary (6 Official Services)
const INCIDENT_SUGGESTIONS = {
  police: [
    { id: 'p1', label: '🚨 Bị cướp giật / Móc túi' },
    { id: 'p2', label: '⚔️ Bạo lực / Gây rối trật tự' },
    { id: 'p3', label: '🏠 Trộm cắp đột nhập' },
    { id: 'p4', label: '👁️ Bị theo dõi / Đe dọa' },
    { id: 'p5', label: '👶 Người già / Trẻ em đi lạc' },
    { id: 'p6', label: '⚠️ Sự cố an ninh địa bàn khác' }
  ],
  csgt: [
    { id: 'c1', label: '🚗 Tai nạn giao thông va chạm nghiêm trọng' },
    { id: 'c2', label: '💥 Xe lật / Chắn ngang đường quốc lộ/cao tốc' },
    { id: 'c3', label: '🚦 Sự cố giao thông gây ùn tắc kéo dài' },
    { id: 'c4', label: '🚧 Chướng ngại vật / Dầu tràn trơn trượt trên đường' },
    { id: 'c5', label: '🚨 Báo cáo vi phạm giao thông / Xe gây tai nạn bỏ chạy' }
  ],
  fire: [
    { id: 'f1', label: '🔥 Cháy nhà dân / Chung cư / Nhà xưởng' },
    { id: 'f2', label: '🆘 Có người mắc kẹt trong đám cháy' },
    { id: 'f3', label: '🏚️ Sập đổ công trình xây dựng' },
    { id: 'f4', label: '🌊 Đuối nước / Cứu nạn sông suối' },
    { id: 'f5', label: '🛗 Mắc kẹt thang máy / Hầm sâu / Vực cao' }
  ],
  'traffic-rescue': [
    { id: 'r1', label: '⚙️ Ô tô / Xe máy chết máy giữa đường' },
    { id: 'r2', label: '🛞 Nổ lốp / Bể bánh xe cần thay thế' },
    { id: 'r3', label: '🔋 Hết bình ắc quy / Cần kích nổ bình' },
    { id: 'r4', label: '⛽ Hết xăng / Dầu khẩn cấp' },
    { id: 'r5', label: '🌊 Xe ngập nước / Sa lầy lún cát' },
    { id: 'r6', label: '🏗️ Cần xe cẩu kéo cứu hộ giao thông' }
  ],
  hospital: [
    { id: 'h1', label: '🩸 Chấn thương nặng / Chảy máu cấp' },
    { id: 'h2', label: '❤️ Đau tim / Nghi đột quỵ hôn mê' },
    { id: 'h3', label: '😵 Bất tỉnh / Ngất xỉu đột ngột' },
    { id: 'h4', label: '🫁 Khó thở / Co giật cấp cứu' },
    { id: 'h5', label: '🤢 Ngộ độc thực phẩm / Hóa chất' },
    { id: 'h6', label: '🤰 Cấp cứu sản phụ chuyển dạ sinh nở' }
  ],
  joint: [
    { id: 'j1', label: '🌪️ Sự cố thiên tai bão lũ / Sạt lở đất' },
    { id: 'j2', label: '🚢 Tìm kiếm cứu nạn trên sông / biển' },
    { id: 'j3', label: '⚡ Sự cố lưới điện cao thế nguy hiểm' },
    { id: 'j4', label: '☣️ Sự cố tràn hóa chất độc hại' }
  ]
};

class SOSApp {
  
  initDynamicYear() {
    const y = new Date().getFullYear();
    document.querySelectorAll('.national-badge-title, h1, span, b').forEach(el => {
      if (el && el.textContent && el.children.length === 0 && /202[0-9]/.test(el.textContent)) {
        el.textContent = el.textContent.replace(/202[0-9]/g, y);
      }
    });
  }

  constructor() {
    setTimeout(() => this.initDynamicYear(), 100);
    this.locationService = new LocationService();
    this.mapController = null;
    this.homeMapController = null;
    this.currentWardBoundary = null;
    this.currentWardPolice = null;
    this.selectedAgency = 'police';
    this.selectedTags = new Set();
    this.activeIncident = null;
    this.eventSource = null;
    this.citizenAccessToken = '';

    this.initElements();
    this.bindEvents();
    this.initLocation();

    // Check active incident in session
    const saved = sessionStorage.getItem('active_sos_incident');
    if (saved) {
      try {
        const inc = JSON.parse(saved);
        if (inc && inc.id) {
          this.citizenAccessToken = sessionStorage.getItem(this.getCitizenTokenKey(inc.id)) || '';
          if (this.citizenAccessToken) {
            this.startTracking(inc);
          } else {
            // Sessions created before token-based access was introduced cannot
            // safely be resumed. Return to the SOS entry screen instead of
            // leaving the citizen on a permanently disconnected tracker.
            sessionStorage.removeItem('active_sos_incident');
          }
        }
      } catch (e) {}
    }
  }

  getCitizenTokenKey(incidentId) {
    return `sos_citizen_access_token_${incidentId}`;
  }

  citizenAccessHeaders() {
    return this.citizenAccessToken ? { 'X-SOS-Access-Token': this.citizenAccessToken } : {};
  }

  clearCitizenAccessToken() {
    if (this.activeIncident?.id) sessionStorage.removeItem(this.getCitizenTokenKey(this.activeIncident.id));
    this.citizenAccessToken = '';
  }

  initElements() {
    this.locAddressEl = document.getElementById('locAddress');
    this.locCoordsEl = document.getElementById('locCoords');
    this.btnRefreshLoc = document.getElementById('btnRefreshLoc');

    this.sosTriggerView = document.getElementById('sosTriggerView');
    this.sosTrackingView = document.getElementById('sosTrackingView');

    this.btnMasterSOS = document.getElementById('btnMasterSOS');
    this.sosDetailModal = document.getElementById('sosDetailModal');
    this.btnCloseModal = document.getElementById('btnCloseModal');
    this.agencyCards = document.querySelectorAll('.agency-card');
    this.incidentChipsBox = document.getElementById('incidentChipsBox');

    this.inputCustomNotes = document.getElementById('inputCustomNotes');
    this.inputReporterName = document.getElementById('inputReporterName');
    this.inputReporterPhone = document.getElementById('inputReporterPhone');
    this.btnConfirmSOS = document.getElementById('btnConfirmSOS');

    // Incident Media Elements
    this.btnCaptureCamera = document.getElementById('btnCaptureCamera');
    this.btnPickGallery = document.getElementById('btnPickGallery');
    this.inputCameraMedia = document.getElementById('inputCameraMedia');
    this.inputGalleryMedia = document.getElementById('inputGalleryMedia');
    this.mediaPreviewGrid = document.getElementById('mediaPreviewGrid');
    this.attachedMedia = [];

    // Tracking Elements
    this.trackSosId = document.getElementById('trackSosId');
    this.trackStatusBadge = document.getElementById('trackStatusBadge');
    this.stepperFill = document.getElementById('stepperFill');
    this.unitAvatar = document.getElementById('unitAvatar');
    this.unitName = document.getElementById('unitName');
    this.unitSub = document.getElementById('unitSub');
    this.btnCallUnit = document.getElementById('btnCallUnit');

    this.chatMessages = document.getElementById('chatMessages');
    this.inputChatText = document.getElementById('inputChatText');
    this.btnSendChat = document.getElementById('btnSendChat');

    this.sfxSiren = document.getElementById('sfxSiren');

    // Initialize 3D Crystal Water Sphere & Fluid Engine
    this.initCrystalWaterSphere();

    // Initialize Add to Home Screen & PWA Shortcut Controller
    this.initInstallShortcutController();
  }

  initInstallShortcutController() {
    let deferredPrompt = null;
    const modal = document.getElementById('installShortcutModal');
    const btnHero = document.getElementById('btnHeroInstallShortcut');
    const btnNav = document.getElementById('btnNavInstallApp');
    const btnClose = document.getElementById('btnCloseInstallModal');
    const btnDismiss = document.getElementById('btnDismissInstallModal');
    const btnNative = document.getElementById('btnTriggerNativeInstall');
    const nativeBox = document.getElementById('androidNativeActionBox');

    // New 1-Click Elements for iOS and Desktop
    const btnIosShare = document.getElementById('btnTriggerIosShare');
    const iosBeacon = document.getElementById('iosSafariShareBeacon');
    const btnCloseIosBeacon = document.getElementById('btnCloseIosBeacon');
    const btnDesktopInstall = document.getElementById('btnTriggerDesktopInstall');
    const desktopInstallTip = document.getElementById('desktopInstallTipText');

    const tabBtns = document.querySelectorAll('.install-tab-btn');
    const tabContents = document.querySelectorAll('.install-tab-content');

    const switchTab = (tabId) => {
      tabBtns.forEach(b => b.classList.toggle('is-active', b.dataset.tab === tabId));
      tabContents.forEach(c => {
        const targetId = `tabContent${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`;
        c.classList.toggle('is-active', c.id === targetId);
      });
    };

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        switchTab(btn.dataset.tab);
      });
    });

    const detectDeviceTab = () => {
      const ua = navigator.userAgent || '';
      const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isAndroid = /Android/.test(ua);
      if (isIOS) return 'ios';
      if (isAndroid) return 'android';
      return 'desktop';
    };

    const openModal = () => {
      if (!modal) return;
      const devTab = detectDeviceTab();
      switchTab(devTab);
      modal.classList.add('is-open');
    };

    const closeModal = () => {
      if (modal) modal.classList.remove('is-open');
    };

    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnDismiss) btnDismiss.addEventListener('click', closeModal);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    // Direct 1-Click Desktop Shortcut .URL File Generator & Downloader
    const downloadDesktopShortcut = () => {
      try {
        const currentUrl = window.location.origin + window.location.pathname;
        const shortcutContent = `[InternetShortcut]\r\nURL=${currentUrl}\r\nIconIndex=0\r\nIconFile=${window.location.origin}/assets/icons/icon-192x192.png\r\nHotKey=0\r\n`;
        const blob = new Blob([shortcutContent], { type: 'application/octet-stream' });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'SOS_Viet_Nam_2026.url';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

        if (desktopInstallTip) {
          desktopInstallTip.innerHTML = '✅ <strong style="color:#34d399">Đã tải tệp lối tắt (.url) về máy!</strong> Hãy kéo tệp này ra Màn hình chính (Desktop) để mở 1 click bất kỳ lúc nào.';
        }
      } catch (err) {
        console.warn('Error downloading desktop shortcut file:', err);
      }
    };

    // Beacon guidance for iOS Safari
    let beaconTimer = null;
    const showIosBeacon = () => {
      if (!iosBeacon) return;
      iosBeacon.style.display = 'flex';
      iosBeacon.setAttribute('aria-hidden', 'false');
      if (beaconTimer) clearTimeout(beaconTimer);
      beaconTimer = setTimeout(() => {
        hideIosBeacon();
      }, 9000);
    };

    const hideIosBeacon = () => {
      if (!iosBeacon) return;
      iosBeacon.style.display = 'none';
      iosBeacon.setAttribute('aria-hidden', 'true');
      if (beaconTimer) clearTimeout(beaconTimer);
    };

    if (btnCloseIosBeacon) {
      btnCloseIosBeacon.addEventListener('click', hideIosBeacon);
    }

    // 1-Click Trigger for iOS Safari Share Menu + Guidance Beacon
    if (btnIosShare) {
      btnIosShare.addEventListener('click', async () => {
        closeModal();
        showIosBeacon();
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'SOS Việt Nam 2026 - Cứu Trợ & Khẩn Cấp',
              text: 'Cài đặt lối tắt SOS Việt Nam 2026 ra Màn hình chính (Home Screen) để sẵn sàng sử dụng 1 chạm khẩn cấp.',
              url: window.location.href
            });
          } catch (err) {
            console.log('iOS Safari Share dismissed:', err);
          }
        }
      });
    }

    // 1-Click Trigger for Desktop (PWA Prompt if ready, otherwise instant .url download)
    if (btnDesktopInstall) {
      btnDesktopInstall.addEventListener('click', () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((res) => {
            if (res && res.outcome === 'accepted') {
              console.log('User accepted Desktop PWA installation');
            }
            deferredPrompt = null;
            closeModal();
          }).catch(() => {
            downloadDesktopShortcut();
          });
        } else {
          // Instant 1-click desktop shortcut download
          downloadDesktopShortcut();
        }
      });
    }

    // Capture beforeinstallprompt for Android & Desktop Chrome/Edge
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (nativeBox) nativeBox.style.display = 'block';

      // Visual affordance: 1-Click badge on navigation install button
      if (btnNav) {
        btnNav.classList.add('btn-nav-install-ready');
        btnNav.setAttribute('title', 'Cài đặt lối tắt ứng dụng ngay lập tức (1 Click)');
        // Update text node if present
        const childNodes = Array.from(btnNav.childNodes);
        const textNode = childNodes.find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0);
        if (textNode) {
          textNode.textContent = ' ⚡ Cài Lối Tắt (1 Click)';
        }
      }

      if (desktopInstallTip) {
        desktopInstallTip.innerHTML = '⚡ <strong style="color:#34d399">Trình duyệt đã sẵn sàng:</strong> Bấm nút trên để cài đặt ứng dụng Desktop 1 Click ngay!';
      }
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      if (btnHero) btnHero.style.display = 'none';
      if (btnNav) btnNav.style.display = 'none';
      closeModal();
      console.log('✅ SOS Việt Nam PWA đã được cài đặt thành công.');
    });

    // Keep nav install button accessible so user can always view shortcut guide or install
    if (btnNav) btnNav.style.display = '';

    const handleInstallClick = () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((res) => {
          if (res && res.outcome === 'accepted') {
            console.log('User accepted PWA installation');
          }
          deferredPrompt = null;
          closeModal();
        }).catch(() => {
          openModal();
        });
      } else {
        openModal();
      }
    };

    if (btnHero) btnHero.addEventListener('click', handleInstallClick);

    // 1-Click on Nav Install App: If deferredPrompt ready, prompt immediately! Otherwise open modal
    if (btnNav) {
      btnNav.addEventListener('click', () => {
        if (deferredPrompt) {
          handleInstallClick();
        } else {
          openModal();
        }
      });
    }

    if (btnNative) {
      btnNative.addEventListener('click', () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((res) => {
            if (res && res.outcome === 'accepted') {
              console.log('User accepted Android PWA installation');
            }
            deferredPrompt = null;
            closeModal();
          });
        } else {
          alert('👉 Vui lòng nhấn vào biểu tượng Menu 3 chấm ⋮ ở góc trên trình duyệt và chọn "Cài đặt ứng dụng" hoặc "Thêm vào Màn hình chính".');
        }
      });
    }
  }

  bindEvents() {
    this.btnRefreshLoc.addEventListener('click', () => this.initLocation());

    // Open Modal on Master SOS click with 3D Crystal Shockwave Explosion & Voice AI Prompt
    this.btnMasterSOS.addEventListener('click', (e) => {
      this.triggerOrbShockwave(e);
      this.speakSosPrompt();
      if (navigator.vibrate) navigator.vibrate([250, 100, 250]);
      setTimeout(() => {
        this.openModal();
      }, 320);
    });

    this.btnCloseModal.addEventListener('click', () => this.closeModal());

    // Media upload buttons
    if (this.btnCaptureCamera && this.inputCameraMedia) {
      this.btnCaptureCamera.addEventListener('click', () => this.inputCameraMedia.click());
      this.inputCameraMedia.addEventListener('change', (e) => this.handleFilesSelected(e.target.files));
    }

    if (this.btnPickGallery && this.inputGalleryMedia) {
      this.btnPickGallery.addEventListener('click', () => this.inputGalleryMedia.click());
      this.inputGalleryMedia.addEventListener('change', (e) => this.handleFilesSelected(e.target.files));
    }

    // Agency selector (Fix: Reset selected tags on switch)
    this.agencyCards.forEach(card => {
      card.addEventListener('click', () => {
        this.agencyCards.forEach(c => c.classList.remove('is-selected'));
        card.classList.add('is-selected');
        this.selectedAgency = card.dataset.agency;
        this.selectedTags.clear(); // Ensure previous agency's tags are removed!
        this.renderIncidentChips(this.selectedAgency);
      });
    });

    // Emergency Call selection modal buttons on Citizen Tracking Screen
    const btnVoiceCallDispatcher = document.getElementById('btnCitizenVoiceCallDispatcher');
    const callSelectionModal = document.getElementById('citizenCallSelectionModal');
    const btnChooseVoice = document.getElementById('btnChooseCitizenVoiceCall');
    const btnChooseVideo = document.getElementById('btnChooseCitizenVideoCall');
    const btnCloseSelection = document.getElementById('btnCloseCitizenCallSelection');
    const btnCancelSelection = document.getElementById('btnCancelCitizenCallSelection');

    if (btnVoiceCallDispatcher && callSelectionModal) {
      btnVoiceCallDispatcher.addEventListener('click', () => {
        if (!this.activeIncident) {
          this.showToast('Vui lòng tạo hoặc mở ca cứu hộ để gọi trực ban', 'warning');
          return;
        }
        callSelectionModal.classList.add('is-open');
        callSelectionModal.style.display = 'flex';
      });
    }

    const closeCallSelection = () => {
      if (callSelectionModal) {
        callSelectionModal.classList.remove('is-open');
        callSelectionModal.style.display = 'none';
      }
    };

    if (btnChooseVoice) {
      btnChooseVoice.addEventListener('click', () => {
        closeCallSelection();
        this.startCitizenVoiceCall(true);
      });
    }

    if (btnChooseVideo) {
      btnChooseVideo.addEventListener('click', () => {
        closeCallSelection();
        this.initiateCitizenVideoCallToDispatcher();
      });
    }

    if (btnCloseSelection) btnCloseSelection.addEventListener('click', closeCallSelection);
    if (btnCancelSelection) btnCancelSelection.addEventListener('click', closeCallSelection);

    // Family SOS Modal (Help 114 & Family Alert Feature)
    const btnOpenFamily = document.getElementById('btnOpenFamilySOS');
    const familyModal = document.getElementById('familySosModal');
    const btnCloseFamily = document.getElementById('btnCloseFamilyModal');
    const btnSaveFamily = document.getElementById('btnSaveFamilyPhones');
    const btnSendFamilySms = document.getElementById('btnSendFamilySms');
    const inputFamilyPhone1 = document.getElementById('inputFamilyPhone1');
    const inputFamilyPhone2 = document.getElementById('inputFamilyPhone2');
    const familySosFeedbackBox = document.getElementById('familySosFeedbackBox');
    const familyMsgPreviewText = document.getElementById('familyMsgPreviewText');
    const btnCopyFamilyMsg = document.getElementById('btnCopyFamilyMsg');
    const btnFamilyOpenSmsLink = document.getElementById('btnFamilyOpenSmsLink');
    const btnFamilyOpenMapLink = document.getElementById('btnFamilyOpenMapLink');

    // Load saved family phones
    if (inputFamilyPhone1) {
      inputFamilyPhone1.value = localStorage.getItem('sos_family_phone_1') || '0912345678';
    }
    if (inputFamilyPhone2) {
      inputFamilyPhone2.value = localStorage.getItem('sos_family_phone_2') || '';
    }

    if (btnOpenFamily && familyModal) {
      btnOpenFamily.addEventListener('click', () => {
        familyModal.classList.add('is-open');
        this.updateFamilySmsLink();
      });
    }
    if (btnCloseFamily && familyModal) {
      btnCloseFamily.addEventListener('click', () => familyModal.classList.remove('is-open'));
    }

    if (btnSaveFamily) {
      btnSaveFamily.addEventListener('click', () => {
        const p1 = inputFamilyPhone1 ? inputFamilyPhone1.value.trim() : '';
        const p2 = inputFamilyPhone2 ? inputFamilyPhone2.value.trim() : '';
        if (p1) localStorage.setItem('sos_family_phone_1', p1);
        if (p2) localStorage.setItem('sos_family_phone_2', p2);
        this.updateFamilySmsLink();
        alert('✅ Đã lưu danh bạ khẩn cấp người thân thành công!');
      });
    }

    if (btnSendFamilySms) {
      btnSendFamilySms.addEventListener('click', (e) => {
        e.preventDefault();
        this.sendFamilySosAlert();
      });
    }

    if (btnCopyFamilyMsg) {
      btnCopyFamilyMsg.addEventListener('click', () => {
        const text = familyMsgPreviewText ? familyMsgPreviewText.textContent : '';
        if (text) {
          navigator.clipboard.writeText(text).then(() => {
            btnCopyFamilyMsg.textContent = '✅ Đã chép!';
            setTimeout(() => { btnCopyFamilyMsg.textContent = '📋 Sao chép'; }, 2000);
          }).catch(() => {
            alert('Đã chọn nội dung, hãy nhấn Ctrl+C để sao chép.');
          });
        }
      });
    }


    // Survival Guide Modal (cuuhodanang & Help 114 Feature)
    const btnOpenSurvival = document.getElementById('btnOpenSurvivalGuide');
    const survivalModal = document.getElementById('survivalGuideModal');
    const btnCloseSurvival = document.getElementById('btnCloseSurvivalModal');

    if (btnOpenSurvival && survivalModal) {
      btnOpenSurvival.addEventListener('click', () => survivalModal.classList.add('is-open'));
    }
    if (btnCloseSurvival && survivalModal) {
      btnCloseSurvival.addEventListener('click', () => survivalModal.classList.remove('is-open'));
    }

    // Confirm SOS submit
    if (this.btnConfirmSOS) {
      this.btnConfirmSOS.addEventListener('click', () => this.submitSOS());
    }

    // MotionSites Liquid Glass Nav Pill & Hero Quick Actions
    const navBtnServices = document.getElementById('navBtnServices');
    const navBtnHospitals = document.getElementById('navBtnHospitals');
    const navBtnRescue = document.getElementById('navBtnRescue');
    const btnHeroQuickSOS = document.getElementById('btnHeroQuickSOS');
    const btnHeroQuickHospital = document.getElementById('btnHeroQuickHospital');
    const btnHeroQuickRescue = document.getElementById('btnHeroQuickRescue');

    const selectAndOpenAgency = (agency) => {
      this.selectedAgency = agency;
      this.agencyCards.forEach(c => c.classList.toggle('is-selected', c.dataset.agency === agency));
      this.selectedTags.clear();
      this.openModal();
    };

    if (navBtnServices) navBtnServices.addEventListener('click', () => this.openModal());
    if (navBtnHospitals) navBtnHospitals.addEventListener('click', () => selectAndOpenAgency('hospital'));
    if (navBtnRescue) navBtnRescue.addEventListener('click', () => selectAndOpenAgency('traffic-rescue'));

    if (btnHeroQuickSOS) btnHeroQuickSOS.addEventListener('click', () => this.btnMasterSOS.click());
    if (btnHeroQuickHospital) btnHeroQuickHospital.addEventListener('click', () => selectAndOpenAgency('hospital'));
    if (btnHeroQuickRescue) btnHeroQuickRescue.addEventListener('click', () => selectAndOpenAgency('traffic-rescue'));

    // Mobile Menu Drawer Toggle & Action Handlers
    const btnToggleMobile = document.getElementById('btnToggleMobileMenu');
    const mobileMenuDrawer = document.getElementById('mobileMenuDrawer');
    const iconMenuOpen = document.getElementById('iconMenuOpen');
    const iconMenuClose = document.getElementById('iconMenuClose');

    if (btnToggleMobile && mobileMenuDrawer) {
      btnToggleMobile.addEventListener('click', () => {
        const isOpen = mobileMenuDrawer.classList.toggle('is-open');
        if (iconMenuOpen) iconMenuOpen.style.display = isOpen ? 'none' : 'block';
        if (iconMenuClose) iconMenuClose.style.display = isOpen ? 'block' : 'none';
      });
    }

    const mobileNavBtnServices = document.getElementById('mobileNavBtnServices');
    const mobileNavBtnHospitals = document.getElementById('mobileNavBtnHospitals');
    const mobileNavBtnRescue = document.getElementById('mobileNavBtnRescue');
    const mobileBtnFamily = document.getElementById('mobileBtnFamily');
    const mobileBtnGuide = document.getElementById('mobileBtnGuide');

    if (mobileNavBtnServices) mobileNavBtnServices.addEventListener('click', () => {
      if (mobileMenuDrawer) mobileMenuDrawer.classList.remove('is-open');
      this.openModal();
    });
    if (mobileNavBtnHospitals) mobileNavBtnHospitals.addEventListener('click', () => {
      if (mobileMenuDrawer) mobileMenuDrawer.classList.remove('is-open');
      selectAndOpenAgency('hospital');
    });
    if (mobileNavBtnRescue) mobileNavBtnRescue.addEventListener('click', () => {
      if (mobileMenuDrawer) mobileMenuDrawer.classList.remove('is-open');
      selectAndOpenAgency('traffic-rescue');
    });
    if (mobileBtnFamily && familyModal) mobileBtnFamily.addEventListener('click', () => {
      if (mobileMenuDrawer) mobileMenuDrawer.classList.remove('is-open');
      familyModal.classList.add('is-open');
    });
    if (mobileBtnGuide && survivalModal) mobileBtnGuide.addEventListener('click', () => {
      if (mobileMenuDrawer) mobileMenuDrawer.classList.remove('is-open');
      survivalModal.classList.add('is-open');
    });

    // Chat submit
    if (this.btnSendChat && this.inputChatText) {
      this.btnSendChat.addEventListener('click', () => this.sendChatMessage());
      this.inputChatText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.sendChatMessage();
      });
    }
  }

  /* ==================== SOS NGƯỜI THÂN & ĐỊNH VỊ KHẨN CẤP (FAMILY ALERT) ==================== */
  buildFamilyEmergencyMessage() {
    const coords = this.locationService?.currentCoords || { lat: 10.0452, lng: 105.7469 };
    const address = this.locationService?.currentAddress || document.getElementById('locAddress')?.textContent || 'TP. Cần Thơ, Việt Nam';
    const lat = coords.lat ? Number(coords.lat).toFixed(5) : '10.0452';
    const lng = coords.lng ? Number(coords.lng).toFixed(5) : '105.7469';
    const mapUrl = `https://maps.google.com/?q=${lat},${lng}`;
    const timeVN = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return {
      coords,
      lat,
      lng,
      address,
      mapUrl,
      body: `[🚨 SOS KHẨN CẤP VIỆT NAM - ${timeVN}]\nTôi đang gặp sự cố nguy hiểm cần trợ giúp gấp!\n📍 Vị trí: ${address}\n🌐 Tọa độ GPS: ${lat}, ${lng}\n🗺️ Xem bản đồ trực tiếp: ${mapUrl}`
    };
  }

  updateFamilySmsLink() {
    const p1Input = document.getElementById('inputFamilyPhone1');
    const p2Input = document.getElementById('inputFamilyPhone2');
    const previewEl = document.getElementById('familyMsgPreviewText');
    const smsLinkEl = document.getElementById('btnFamilyOpenSmsLink');
    const mapLinkEl = document.getElementById('btnFamilyOpenMapLink');

    const phone1 = p1Input ? p1Input.value.trim() : (localStorage.getItem('sos_family_phone_1') || '');
    const phone2 = p2Input ? p2Input.value.trim() : (localStorage.getItem('sos_family_phone_2') || '');
    const targetPhone = phone1 || phone2 || '';

    const { mapUrl, body } = this.buildFamilyEmergencyMessage();

    if (previewEl) previewEl.textContent = body;
    if (mapLinkEl) mapLinkEl.href = mapUrl;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const smsUri = isIOS
      ? `sms:${targetPhone}&body=${encodeURIComponent(body)}`
      : `sms:${targetPhone}?body=${encodeURIComponent(body)}`;

    if (smsLinkEl) smsLinkEl.href = smsUri;
  }

  async sendFamilySosAlert() {
    const p1Input = document.getElementById('inputFamilyPhone1');
    const p2Input = document.getElementById('inputFamilyPhone2');
    const feedbackBox = document.getElementById('familySosFeedbackBox');

    const phone1 = p1Input ? p1Input.value.trim() : (localStorage.getItem('sos_family_phone_1') || '');
    const phone2 = p2Input ? p2Input.value.trim() : (localStorage.getItem('sos_family_phone_2') || '');

    if (!phone1 && !phone2) {
      alert('⚠️ Vui lòng nhập ít nhất 1 số điện thoại người thân để gửi tin nhắn khẩn cấp!');
      if (p1Input) p1Input.focus();
      return;
    }

    if (phone1) localStorage.setItem('sos_family_phone_1', phone1);
    if (phone2) localStorage.setItem('sos_family_phone_2', phone2);

    const { mapUrl, body } = this.buildFamilyEmergencyMessage();
    this.updateFamilySmsLink();

    if (feedbackBox) {
      feedbackBox.style.display = 'block';
    }

    const targetPhone = phone1 || phone2;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const smsUri = isIOS
      ? `sms:${targetPhone}&body=${encodeURIComponent(body)}`
      : `sms:${targetPhone}?body=${encodeURIComponent(body)}`;

    // Try Web Share API if on Mobile
    if (navigator.share && /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: '🚨 SOS KHẨN CẤP - ĐỊNH VỊ NGƯỜI THÂN',
          text: body,
          url: mapUrl
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.log('Share fallback to SMS:', err);
        }
      }
    }

    // Auto copy to clipboard for user convenience
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(body);
      } catch (e) {}
    }

    // Trigger SMS Application
    window.location.href = smsUri;
  }


  /* ==================== 3D CRYSTAL WATER SPHERE & FLUID PHYSICS ENGINE ==================== */
  initCrystalWaterSphere() {
    const liquidCanvas = document.getElementById('orbLiquidCanvas');
    const particlesCanvas = document.getElementById('orbParticlesCanvas');
    const orbButton = document.getElementById('btnMasterSOS');
    const highlightTop = document.querySelector('.orb-glass-highlight-top');

    if (!liquidCanvas || !orbButton) return;

    const ctx = liquidCanvas.getContext('2d');
    const pCtx = particlesCanvas ? particlesCanvas.getContext('2d') : null;

    // 1. Internal Swirling Golden Glitter & Ruby Embers Simulation
    const w = liquidCanvas.width = 165;
    const h = liquidCanvas.height = 165;
    const cx = w / 2;
    const cy = h / 2;
    const radius = 76;

    const flakes = [];
    const FLAKE_COUNT = 52;
    const colors = [
      'rgba(255, 223, 0, ',    // Gold
      'rgba(251, 191, 36, ',   // Amber
      'rgba(255, 255, 255, ',  // Diamond Sparkle
      'rgba(255, 77, 109, ',   // Ruby Pink
      'rgba(255, 42, 75, '     // Crimson Glow
    ];

    for (let i = 0; i < FLAKE_COUNT; i++) {
      const dist = Math.random() * (radius - 12);
      const angle = Math.random() * Math.PI * 2;
      flakes.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        dist: dist,
        angle: angle,
        speed: (0.012 + Math.random() * 0.022) * (Math.random() > 0.3 ? 1 : -0.6),
        size: 1.0 + Math.random() * 2.6,
        alpha: 0.3 + Math.random() * 0.7,
        alphaSpeed: 0.02 + Math.random() * 0.04,
        colorPrefix: colors[Math.floor(Math.random() * colors.length)],
        bobFreq: 1.5 + Math.random() * 3,
        bobPhase: Math.random() * Math.PI * 2
      });
    }

    let isHovered = false;
    let hoverSpeedMult = 1.0;
    orbButton.addEventListener('mouseenter', () => { isHovered = true; });
    orbButton.addEventListener('mouseleave', () => { 
      isHovered = false; 
      if (highlightTop) highlightTop.style.transform = 'rotate(-22deg)';
    });

    // 3D Parallax Specular Highlight Tracking
    orbButton.addEventListener('mousemove', (e) => {
      const rect = orbButton.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      if (highlightTop) {
        highlightTop.style.transform = `translate(${nx * 14}px, ${ny * 10}px) rotate(-22deg)`;
      }
    });

    let time = 0;
    const renderLiquid = () => {
      ctx.clearRect(0, 0, w, h);

      // Smooth hover speed transition
      hoverSpeedMult += ((isHovered ? 2.8 : 1.0) - hoverSpeedMult) * 0.08;
      time += 0.03 * hoverSpeedMult;

      // Draw fluid vortex background shimmer
      const radialGrad = ctx.createRadialGradient(cx, cy + 10, 5, cx, cy, radius);
      radialGrad.addColorStop(0, 'rgba(255, 77, 109, 0.45)');
      radialGrad.addColorStop(0.7, 'rgba(220, 38, 38, 0.15)');
      radialGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radialGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Render swirling golden glitter flakes
      flakes.forEach(f => {
        f.angle += f.speed * hoverSpeedMult;
        f.bobPhase += 0.04 * f.bobFreq;
        
        // Fluid wave disturbance
        const curDist = f.dist + Math.sin(f.bobPhase) * 4;
        const px = cx + Math.cos(f.angle) * curDist;
        const py = cy + Math.sin(f.angle) * (curDist * 0.88) + Math.sin(time + curDist * 0.05) * 5;

        // Opacity twinkle
        const alpha = Math.abs(Math.sin(f.bobPhase)) * f.alpha + 0.2;

        ctx.fillStyle = `${f.colorPrefix}${Math.min(1, alpha)})`;
        ctx.beginPath();
        ctx.arc(px, py, f.size, 0, Math.PI * 2);
        ctx.fill();

        // Extra diamond gleam for larger glitter flakes
        if (f.size > 2.0) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(px - f.size * 1.6, py);
          ctx.lineTo(px + f.size * 1.6, py);
          ctx.moveTo(px, py - f.size * 1.6);
          ctx.lineTo(px, py + f.size * 1.6);
          ctx.stroke();
        }
      });

      requestAnimationFrame(renderLiquid);
    };

    renderLiquid();

    // 2. Particle Splash & Shockwave Array
    this.splashParticles = [];
    if (particlesCanvas && pCtx) {
      particlesCanvas.width = 340;
      particlesCanvas.height = 340;

      const renderSplash = () => {
        pCtx.clearRect(0, 0, 340, 340);
        if (this.splashParticles.length > 0) {
          for (let i = this.splashParticles.length - 1; i >= 0; i--) {
            const p = this.splashParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.life -= p.decay;
            p.size *= 0.97;

            if (p.life <= 0 || p.size <= 0.2) {
              this.splashParticles.splice(i, 1);
              continue;
            }

            pCtx.fillStyle = `${p.colorPrefix}${p.life})`;
            pCtx.beginPath();
            pCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            pCtx.fill();

            if (p.isGlow) {
              pCtx.shadowBlur = 12;
              pCtx.shadowColor = '#ff2a4b';
            }
          }
        }
        requestAnimationFrame(renderSplash);
      };

      renderSplash();
    }
  }

  /* Trigger explosive shockwave and water splash on button click */
  triggerOrbShockwave(e) {
    const orbButton = document.getElementById('btnMasterSOS');
    const blastRing = document.getElementById('shockwaveBlast');
    const clickRipple = document.getElementById('orbClickRipple');

    if (orbButton) {
      orbButton.classList.add('is-clicking');
      setTimeout(() => orbButton.classList.remove('is-clicking'), 450);
    }

    if (blastRing) {
      blastRing.classList.remove('active');
      void blastRing.offsetWidth; // Force reflow
      blastRing.classList.add('active');
    }

    if (clickRipple) {
      clickRipple.classList.remove('active');
      void clickRipple.offsetWidth; // Force reflow
      clickRipple.classList.add('active');
    }

    // Spawn 40 radial explosion particles (ruby droplets + gold sparks)
    if (this.splashParticles) {
      const pcx = 170;
      const pcy = 170;
      const colors = ['rgba(255, 42, 75, ', 'rgba(255, 215, 0, ', 'rgba(255, 107, 129, ', 'rgba(255, 255, 255, '];

      for (let i = 0; i < 42; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3.5 + Math.random() * 7.5;
        this.splashParticles.push({
          x: pcx + Math.cos(angle) * 75,
          y: pcy + Math.sin(angle) * 75,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          gravity: 0.12,
          size: 2.0 + Math.random() * 4.0,
          life: 1.0,
          decay: 0.018 + Math.random() * 0.025,
          colorPrefix: colors[Math.floor(Math.random() * colors.length)],
          isGlow: Math.random() > 0.4
        });
      }
    }
  }

  /* High-Tech Tactical Rescue Chime (Synthesized Crystal Glass Harmonic Ping) */
  playTacticalPing() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const now = this.audioCtx.currentTime;
      
      // Tone 1: 880Hz (Crystal Harmonic)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.45);

      // Tone 2: Sub-bass Punch (180Hz)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(220, now);
      osc2.frequency.exponentialRampToValueAtTime(80, now + 0.25);
      gain2.gain.setValueAtTime(0.4, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now);
      osc2.stop(now + 0.35);
    } catch (e) {
      console.warn('AudioContext ping error:', e);
    }
  }

  async initLocation() {
    this.locAddressEl.textContent = 'Đang định vị GPS vệ tinh...';
    const coords = await this.locationService.acquireLocation();
    this.locAddressEl.textContent = this.locationService.currentAddress;
    this.locCoordsEl.textContent = `Tọa độ: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)} (±${this.locationService.accuracy}m)`;

    try {
      const res = await fetch(`/api/geo/locate-ward?lat=${coords.lat}&lng=${coords.lng}&address=${encodeURIComponent(this.locationService.currentAddress)}`);
      const data = await res.json();
      if (data.ok) {
        if (data.boundary) {
          this.currentWardBoundary = data.boundary;
        }
        if (data.policeStation) {
          this.currentWardPolice = data.policeStation;
        }

        // The jurisdiction polygon is the truth for "where am I". The police
        // directory row may be a nearby fallback unit, so never show it as the
        // citizen's administrative area.
        const ward = data.jurisdiction?.ward || '';
        const province = data.jurisdiction?.province || '';
        const areaLabel = [ward, province].filter(Boolean).join(', ');

        // Replace the generic reverse-geocode placeholder with the real
        // administrative area when the geocoder returns nothing useful.
        const addr = this.locationService.currentAddress || '';
        const isPlaceholder = !addr || /^Tọa độ:/i.test(addr) || /đã định vị trên bản đồ/i.test(addr) || /Đang lấy vị trí/i.test(addr);
        if (isPlaceholder && areaLabel) {
          this.locationService.currentAddress = areaLabel;
        }

        if (areaLabel) {
          this.locAddressEl.innerHTML = `<span>📍</span> ${this.locationService.currentAddress} <span style="font-size: 10px; font-weight: 700; color: #fbbf24; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); padding: 1px 6px; border-radius: 4px; margin-left: 4px; display: inline-flex; align-items: center; gap: 4px;">🛡️ Thuộc địa bàn: ${areaLabel}</span>`;
        }
      }
    } catch (e) {
      console.warn('Could not locate ward boundary:', e);
    }
  }

  openModal() {
    this.selectedTags.clear();
    this.renderIncidentChips(this.selectedAgency);
    this.sosDetailModal.classList.add('is-open');
  }

  closeModal() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.sosDetailModal.classList.remove('is-open');
  }

  renderIncidentChips(agency) {
    const list = INCIDENT_SUGGESTIONS[agency] || [];
    this.incidentChipsBox.innerHTML = '';

    const rescueSec = document.getElementById('rescueEnterpriseSection');
    const hospitalSec = document.getElementById('hospitalStationsSection');
    // Sections to hide when showing enterprise directory only
    const incidentSec = document.querySelector('.incident-section');
    const customNoteBox = document.querySelector('.custom-incident-box');
    const mediaBox = document.querySelector('.custom-incident-box + .custom-incident-box');
    const contactRow = document.querySelector('.contact-row');
    const btnSOS = document.getElementById('btnConfirmSOS');

    // Query all form step sections
    const allStepBoxes = document.querySelectorAll('.incident-section, .custom-incident-box, .contact-row');

    if (agency === 'traffic-rescue') {
      if (rescueSec) rescueSec.style.display = 'block';
      if (hospitalSec) hospitalSec.style.display = 'none';
      // Hide suggestions, description, media, contact, submit button
      allStepBoxes.forEach(el => el.style.display = 'none');
      if (btnSOS) btnSOS.style.display = 'none';
      this.loadRescueEnterprises();
    } else if (agency === 'hospital' || agency === 'ambulance') {
      if (rescueSec) rescueSec.style.display = 'none';
      if (hospitalSec) hospitalSec.style.display = 'block';
      // Hide suggestions, description, media, contact, submit button
      allStepBoxes.forEach(el => el.style.display = 'none');
      if (btnSOS) btnSOS.style.display = 'none';
      this.loadHospitalStations();
    } else {
      if (rescueSec) rescueSec.style.display = 'none';
      if (hospitalSec) hospitalSec.style.display = 'none';
      // Restore all form steps
      allStepBoxes.forEach(el => el.style.display = '');
      if (btnSOS) btnSOS.style.display = '';
    }

    list.forEach((item) => {
      const chip = document.createElement('div');
      chip.className = 'incident-chip' + (this.selectedTags.has(item.label) ? ' is-active' : '');
      chip.textContent = item.label;

      chip.addEventListener('click', () => {
        if (chip.classList.contains('is-active')) {
          chip.classList.remove('is-active');
          this.selectedTags.delete(item.label);
        } else {
          chip.classList.add('is-active');
          this.selectedTags.add(item.label);
        }
      });

      this.incidentChipsBox.appendChild(chip);
    });
  }

  async loadHospitalStations() {
    const container = document.getElementById('hospitalStationsGrid');
    if (!container) return;

    container.innerHTML = '<div style="color: #94a3b8; font-size: 11px; text-align: center; padding: 14px;">⏳ Đang tìm bệnh viện & trạm cấp cứu 115 gần bạn nhất...</div>';

    const lat = this.locationService?.currentCoords?.lat || 10.0289;
    const lng = this.locationService?.currentCoords?.lng || 105.7725;
    const address = this.locationService?.currentAddress || 'Cần Thơ';

    try {
      const res = await fetch(`/api/hospitals?lat=${lat}&lng=${lng}&province=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.hospitals) && data.hospitals.length > 0) {
        this.renderHospitalStations(data.hospitals);
      } else {
        container.innerHTML = '<div style="color: #94a3b8; font-size: 11px; text-align: center; padding: 14px;">Chưa có dữ liệu bệnh viện tại khu vực này.</div>';
      }
    } catch (e) {
      container.innerHTML = '<div style="color: #f87171; font-size: 11px; text-align: center; padding: 14px;">Không thể tải danh sách bệnh viện. Vui lòng gọi trực tiếp 115.</div>';
    }
  }

  renderHospitalStations(list) {
    const container = document.getElementById('hospitalStationsGrid');
    if (!container) return;

    if (!list || list.length === 0) {
      container.innerHTML = '<div style="color: #94a3b8; font-size: 11px; text-align: center; padding: 14px;">Không tìm thấy bệnh viện nào.</div>';
      return;
    }

    container.innerHTML = '';
    list.forEach(h => {
      const card = document.createElement('div');
      card.style = 'background: rgba(0, 0, 0, 0.45); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 10px; cursor: pointer; transition: all 0.2s;';

      const emergency = h.emergency || h.hotline || h.phone || '115';
      const starsHtml = `<span style="color: #fbbf24; font-weight: 800;">⭐ ${h.rating}/5</span>`;
      const distText = h.distanceKm !== undefined ? `<svg class="svg-ico ico-xs ico-blue" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> Cách ~${h.distanceKm} km` : '';
      const featuredBadge = h.featured ? `<span style="font-size: 9px; background: rgba(251,191,36,0.2); color: #fbbf24; padding: 1px 5px; border-radius: 4px; border: 1px solid rgba(251,191,36,0.4); margin-left: 4px;">NỔI BẬT</span>` : '';

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
          <div style="flex: 1;">
            <div style="font-size: 13px; font-weight: 800; color: #a7f3d0; display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">
              <svg class="svg-ico ico-sm ico-emerald" viewBox="0 0 24 24"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h6M9 13h6M9 17h6"></path></svg> ${h.name}${featuredBadge}
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 1px;">${h.type || ''}</div>
            <div style="font-size: 11px; color: #34d399; font-weight: 700; margin-top: 3px; display: flex; align-items: center; flex-wrap: wrap; gap: 6px;">
              ${starsHtml} <span style="color: #64748b; font-weight: normal;">(${h.reviewCount || 0} đánh giá)</span>
              ${distText ? `<span style="color: #38bdf8; display: inline-flex; align-items: center; gap: 3px;">${distText}</span>` : ''}
            </div>
          </div>
          <span style="font-size: 9px; background: rgba(16,185,129,0.2); color: #34d399; padding: 2px 5px; border-radius: 4px; font-weight: 700; border: 1px solid rgba(16,185,129,0.3); white-space: nowrap; margin-left: 6px;">ĐÃ DUYỆT</span>
        </div>

        <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px; line-height: 1.4; display: flex; align-items: flex-start; gap: 4px;">
          <svg class="svg-ico ico-xs" style="margin-top: 2px;" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> <span>${h.address}</span>
        </div>

        <div style="font-size: 10px; color: #64748b; margin-bottom: 8px;">
          <svg class="svg-ico ico-xs" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ${h.openingHours || '24/7'}
          ${h.specialties && h.specialties.length ? `<br><svg class="svg-ico ico-xs ico-emerald" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> ${h.specialties.slice(0, 3).join(' · ')}${h.specialties.length > 3 ? '...' : ''}` : ''}
        </div>

        <div style="display: flex; gap: 6px;">
          <a href="tel:${emergency}" class="btn-refresh-loc btn-hosp-call-action" style="flex: 1; justify-content: center; background: rgba(16,185,129,0.25); border-color: #10b981; color: #34d399; font-weight: 800; font-size: 11px; text-decoration: none; padding: 6px 8px; display: inline-flex; align-items: center; gap: 4px;">
            <svg class="svg-ico ico-xs" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> Gọi Cấp Cứu: ${h.phoneFormatted || emergency}
          </a>
          <button type="button" class="btn-refresh-loc btn-hosp-review" style="justify-content: center; font-size: 10px; padding: 6px 8px; border-color: #fbbf24; color: #fbbf24; display: inline-flex; align-items: center; gap: 3px;">
            <svg class="svg-ico ico-xs" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Đánh Giá
          </button>
          <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name + ', ' + h.address)}" target="_blank" rel="noopener" class="btn-refresh-loc" style="justify-content: center; font-size: 11px; padding: 6px 10px; border-color: rgba(66, 133, 244, 0.5); color: #60a5fa; background: rgba(66, 133, 244, 0.15); text-decoration: none; display: inline-flex; align-items: center; gap: 3px;" title="Xem vị trí chính xác trên Google Maps">
            <svg class="svg-ico ico-xs" viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg> Bản đồ
          </a>
        </div>
      `;

      // Bind call logging
      const callLink = card.querySelector('.btn-hosp-call-action');
      if (callLink) {
        callLink.addEventListener('click', () => {
          this.logServiceCall('hospital', {
            id: h.id,
            name: h.name,
            phone: h.phoneFormatted || emergency,
            address: h.address
          });
        });
      }

      // Bind review button
      card.querySelector('.btn-hosp-review').addEventListener('click', (e) => {
        e.stopPropagation();
        this.openHospitalReviewModal(h);
      });

      container.appendChild(card);
    });
  }

  async loadRescueEnterprises() {
    const container = document.getElementById('rescueEnterprisesGrid');
    if (!container) return;

    container.innerHTML = '<div style="color: #94a3b8; font-size: 11px; text-align: center; padding: 10px;">Đang tìm kiếm các đơn vị cứu hộ gần bạn...</div>';

    const lat = this.locationService?.currentCoords?.lat || 10.0289;
    const lng = this.locationService?.currentCoords?.lng || 105.7725;
    const address = this.locationService?.currentAddress || 'Cần Thơ';

    try {
      const res = await fetch(`/api/enterprises/rescue?lat=${lat}&lng=${lng}&province=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.enterprises)) {
        this.renderRescueEnterprises(data.enterprises);
      } else {
        container.innerHTML = '<div style="color: #94a3b8; font-size: 11px; text-align: center; padding: 10px;">Chưa có dữ liệu cứu hộ tại khu vực này.</div>';
      }
    } catch (e) {
      container.innerHTML = '<div style="color: #f87171; font-size: 11px; text-align: center; padding: 10px;">Không thể tải danh bạ doanh nghiệp cứu hộ.</div>';
    }
  }

  renderRescueEnterprises(list) {
    const container = document.getElementById('rescueEnterprisesGrid');
    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = '<div style="color: #94a3b8; font-size: 11px; text-align: center; padding: 10px;">Không có doanh nghiệp nào.</div>';
      return;
    }

    container.innerHTML = '';
    list.forEach(ent => {
      const card = document.createElement('div');
      card.style = 'background: rgba(0, 0, 0, 0.45); border: 1px solid rgba(249, 115, 22, 0.3); border-radius: 10px; padding: 10px; transition: all 0.2s;';
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
          <div>
            <div style="font-size: 13px; font-weight: 800; color: #fed7aa; display: flex; align-items: center; gap: 4px;">
              <svg class="svg-ico ico-sm ico-amber" viewBox="0 0 24 24"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg> <span>${ent.name}</span>
            </div>
            <div style="font-size: 11px; color: #fbbf24; font-weight: 700; margin-top: 2px; display: flex; align-items: center; gap: 6px;">
              ⭐ ${ent.rating}/5 <span style="color: #94a3b8; font-weight: normal;">(${ent.reviewCount || 0} đánh giá)</span>
              ${ent.distanceKm !== undefined ? `<span style="color: #38bdf8; display: inline-flex; align-items: center; gap: 2px;"><svg class="svg-ico ico-xs ico-blue" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> Cách ~${ent.distanceKm} km</span>` : ''}
            </div>
          </div>
          <span style="font-size: 9px; background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 2px 4px; border-radius: 4px; font-weight: 700; border: 1px solid rgba(16, 185, 129, 0.4);">ĐÃ DUYỆT</span>
        </div>

        <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 6px; line-height: 1.3;">
          ${ent.address}
        </div>

        <div style="display: flex; gap: 6px; margin-top: 6px;">
          <a href="tel:${ent.phone || ent.hotline}" class="btn-refresh-loc btn-rescue-call-action" style="flex: 1; justify-content: center; background: rgba(249, 115, 22, 0.25); border-color: #f97316; color: #fb923c; font-weight: 800; font-size: 11px; text-decoration: none; padding: 5px 8px; display: inline-flex; align-items: center; gap: 4px;">
            <svg class="svg-ico ico-xs" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> Gọi: ${ent.phoneFormatted || ent.phone}
          </a>
          <button type="button" class="btn-refresh-loc btn-open-ent-modal" style="justify-content: center; font-size: 10px; padding: 5px 12px; border-color: #fbbf24; color: #fbbf24; font-weight: 700; display: inline-flex; align-items: center; gap: 3px;">
            <svg class="svg-ico ico-xs" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Đánh Giá & Chi Tiết
          </button>
        </div>
      `;

      // Bind call logging
      const rescueCallLink = card.querySelector('.btn-rescue-call-action');
      if (rescueCallLink) {
        rescueCallLink.addEventListener('click', () => {
          this.logServiceCall('traffic-rescue', {
            id: ent.id,
            name: ent.name,
            phone: ent.phoneFormatted || ent.phone || ent.hotline,
            address: ent.address
          });
        });
      }

      card.querySelector('.btn-open-ent-modal').addEventListener('click', (e) => {
        e.stopPropagation();
        this.openEnterpriseModal(ent);
        // Auto-expand the review form
        const form = document.getElementById('entAddReviewForm');
        if (form) form.style.display = 'block';
      });

      card.addEventListener('click', () => {
        this.openEnterpriseModal(ent);
      });

      container.appendChild(card);
    });
  }

  async logServiceCall(type, target) {
    try {
      const repName = document.getElementById('inputReporterName')?.value || 'Người dân cần hỗ trợ';
      const repPhone = document.getElementById('inputReporterPhone')?.value || '0988113115';
      const coords = this.locationService?.currentCoords || { lat: 10.0289, lng: 105.7725 };
      const address = this.locationService?.currentAddress || 'TP. Cần Thơ';
      const ward = this.currentWardBoundary?.wardName || 'Phường Tân An';
      const province = this.currentWardBoundary?.provinceName || 'Cần Thơ';

      await fetch('/api/service-calls/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          targetId: target.id,
          targetName: target.name,
          targetPhone: target.phone,
          targetAddress: target.address,
          reporterName: repName,
          reporterPhone: repPhone,
          lat: coords.lat,
          lng: coords.lng,
          address,
          ward,
          province
        })
      });
    } catch (e) {
      console.warn('Could not log service call:', e);
    }
  }

  openEnterpriseModal(ent) {
    this.currentSelectedEnterprise = ent;
    const modal = document.getElementById('enterpriseDetailModal');
    if (!modal) return;

    document.getElementById('entModalName').textContent = ent.name;
    document.getElementById('entModalStars').textContent = `⭐ ${ent.rating}/5`;
    document.getElementById('entModalReviewCount').textContent = `(${ent.reviewCount || (ent.reviews?.length || 0)} đánh giá)`;
    document.getElementById('entModalAddress').textContent = ent.address;
    document.getElementById('entModalPrice').textContent = ent.priceRange || 'Theo bảng giá niêm yết';

    const callBtn = document.getElementById('entModalCallBtn');
    if (callBtn) {
      callBtn.href = `tel:${ent.phone || ent.hotline}`;
      callBtn.innerHTML = `<span>📞</span> GỌI TRỰC TIẾP (${ent.phoneFormatted || ent.phone})`;
      // Gắn sự kiện ghi nhận lượt gọi từ modal danh thiếp
      callBtn.onclick = () => {
        this.logServiceCall('traffic-rescue', {
          id: ent.id,
          name: ent.name,
          phone: ent.phoneFormatted || ent.phone || ent.hotline,
          address: ent.address
        });
      };
    }

    const gmapsBtn = document.getElementById('entModalGmapsBtn');
    if (gmapsBtn) {
      gmapsBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ent.name + ' ' + ent.address)}`;
    }

    // Services list
    const servList = document.getElementById('entModalServicesList');
    if (servList) {
      servList.innerHTML = '';
      (ent.services || []).forEach(s => {
        const tag = document.createElement('span');
        tag.style = 'font-size: 11px; background: rgba(249, 115, 22, 0.15); border: 1px solid rgba(249, 115, 22, 0.35); color: #fed7aa; padding: 3px 8px; border-radius: 6px;';
        tag.textContent = `✓ ${s}`;
        servList.appendChild(tag);
      });
    }

    // Reviews list
    this.renderEnterpriseReviews(ent.reviews || []);

    // Wire review toggle & submit
    const btnToggle = document.getElementById('btnToggleReviewForm');
    const formBox = document.getElementById('entAddReviewForm');
    if (btnToggle && formBox) {
      formBox.style.display = 'none';
      btnToggle.onclick = () => {
        formBox.style.display = formBox.style.display === 'none' ? 'block' : 'none';
      };
    }

    const btnSubmit = document.getElementById('btnSubmitReview');
    if (btnSubmit) {
      btnSubmit.onclick = () => this.submitEnterpriseReview(ent.id);
    }

    const closeBtn = document.getElementById('btnCloseEnterpriseModal');
    const closeBtnBtm = document.getElementById('btnCloseEnterpriseModalBottom');
    const closeFn = () => {
      modal.classList.remove('is-open');
      modal.style.display = 'none';
    };
    if (closeBtn) closeBtn.onclick = closeFn;
    if (closeBtnBtm) closeBtnBtm.onclick = closeFn;

    modal.classList.add('is-open');
    modal.style.display = 'flex';
  }

  renderEnterpriseReviews(reviews) {
    const container = document.getElementById('entModalReviewsContainer');
    if (!container) return;

    if (!reviews || reviews.length === 0) {
      container.innerHTML = '<div style="color: #94a3b8; font-size: 11px; font-style: italic; text-align: center; padding: 10px;">Chưa có nhận xét nào. Hãy là người đầu tiên đánh giá!</div>';
      return;
    }

    container.innerHTML = '';
    reviews.forEach(r => {
      const box = document.createElement('div');
      box.style = 'background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 8px 10px; font-size: 11px;';
      box.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <b style="color: #f8fafc;">${r.name || 'Khách hàng'}</b>
          <span style="color: #fbbf24; font-weight: 700;">${'⭐'.repeat(r.rating || 5)} (${r.rating || 5}/5)</span>
        </div>
        <div style="color: #cbd5e1; line-height: 1.3; margin-bottom: 2px;">"${r.comment || ''}"</div>
        <div style="font-size: 10px; color: #64748b; text-align: right;">${r.date || ''}</div>
      `;
      container.appendChild(box);
    });
  }

  async submitEnterpriseReview(enterpriseId) {
    const stars = document.getElementById('inputReviewStars')?.value || 5;
    const author = document.getElementById('inputReviewAuthor')?.value.trim() || 'Người dùng';
    const comment = document.getElementById('inputReviewComment')?.value.trim();

    if (!comment) {
      alert('Vui lòng nhập nội dung đánh giá của bạn!');
      return;
    }

    try {
      const res = await fetch('/api/enterprises/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enterpriseId,
          name: author,
          rating: parseInt(stars),
          comment
        })
      });

      const data = await res.json();
      if (data.ok && data.enterprise) {
        alert('🎉 Cảm ơn bạn đã gửi đánh giá chất lượng dịch vụ!');
        document.getElementById('inputReviewComment').value = '';
        const formBox = document.getElementById('entAddReviewForm');
        if (formBox) formBox.style.display = 'none';

        document.getElementById('entModalStars').textContent = `⭐ ${data.enterprise.rating}/5`;
        document.getElementById('entModalReviewCount').textContent = `(${data.enterprise.reviewCount} đánh giá)`;
        this.renderEnterpriseReviews(data.enterprise.reviews || []);
        this.loadRescueEnterprises();
      }
    } catch (e) {
      alert('Không thể gửi đánh giá.');
    }
  }

  // ==================== HOSPITAL REVIEW MODAL ====================

  openHospitalReviewModal(hospital) {
    this.currentSelectedHospital = hospital;
    const modal = document.getElementById('hospitalReviewModal');
    if (!modal) return;

    document.getElementById('hospReviewName').textContent = hospital.name;
    document.getElementById('hospReviewStarsDisplay').textContent = `⭐ ${hospital.rating}/5`;
    document.getElementById('hospReviewCount').textContent = `(${hospital.reviewCount || (hospital.reviews?.length || 0)} đánh giá)`;

    // Render existing reviews
    const container = document.getElementById('hospReviewsContainer');
    if (container) {
      const reviews = hospital.reviews || [];
      if (reviews.length === 0) {
        container.innerHTML = '<div style="color: #94a3b8; font-size: 11px; font-style: italic; text-align: center; padding: 10px;">Chưa có nhận xét nào. Hãy là người đầu tiên đánh giá!</div>';
      } else {
        container.innerHTML = '';
        reviews.forEach(r => {
          const box = document.createElement('div');
          box.style = 'background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 8px 10px; font-size: 11px;';
          box.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <b style="color: #f8fafc;">${r.name || 'Người dân'}</b>
              <span style="color: #fbbf24; font-weight: 700;">${'⭐'.repeat(r.rating || 5)} (${r.rating || 5}/5)</span>
            </div>
            <div style="color: #cbd5e1; line-height: 1.3; margin-bottom: 2px;">"${r.comment || ''}"</div>
            <div style="font-size: 10px; color: #64748b; text-align: right;">${r.date || ''}</div>
          `;
          container.appendChild(box);
        });
      }
    }

    // Bind submit review
    const btnSubmit = document.getElementById('btnSubmitHospReview');
    if (btnSubmit) {
      btnSubmit.onclick = () => this.submitHospitalReview(hospital.id);
    }

    // Close modal
    const closeBtn = document.getElementById('btnCloseHospReviewModal');
    if (closeBtn) {
      closeBtn.onclick = () => {
        modal.classList.remove('is-open');
        modal.style.display = 'none';
      };
    }

    modal.classList.add('is-open');
    modal.style.display = 'flex';
  }

  async submitHospitalReview(hospitalId) {
    const stars = document.getElementById('hospInputStars')?.value || 5;
    const author = document.getElementById('hospInputAuthor')?.value.trim() || 'Người dân';
    const comment = document.getElementById('hospInputComment')?.value.trim();

    if (!comment) {
      alert('Vui lòng nhập nội dung đánh giá!');
      return;
    }

    try {
      const res = await fetch('/api/hospitals/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId,
          name: author,
          rating: parseInt(stars),
          comment
        })
      });

      const data = await res.json();
      if (data.ok && data.hospital) {
        alert('🎉 Cảm ơn bạn đã đánh giá bệnh viện!');
        document.getElementById('hospInputComment').value = '';
        document.getElementById('hospReviewStarsDisplay').textContent = `⭐ ${data.hospital.rating}/5`;
        document.getElementById('hospReviewCount').textContent = `(${data.hospital.reviewCount} đánh giá)`;

        // Re-render reviews in modal
        this.currentSelectedHospital = data.hospital;
        this.openHospitalReviewModal(data.hospital);

        // Reload hospital list
        this.loadHospitalStations();
      }
    } catch (e) {
      alert('Không thể gửi đánh giá.');
    }
  }

  compressImage(file, maxDimension = 1280, quality = 0.75) {
    return new Promise((resolve) => {
      if (!file.type || !file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
        return;
      }
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async handleFilesSelected(fileList) {
    if (!fileList || fileList.length === 0) return;

    for (const file of Array.from(fileList)) {
      const isVideo = file.type && file.type.startsWith('video');
      if (isVideo) {
        if (file.size > 15 * 1024 * 1024) {
          alert('Video quá lớn (> 15MB). Vui lòng chọn video ngắn hơn dưới 30 giây để cứu hộ tiếp nhận kịp thời.');
          continue;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          this.attachedMedia.push({
            type: 'video',
            name: file.name,
            dataUrl: e.target.result
          });
          this.renderMediaPreviews();
        };
        reader.readAsDataURL(file);
      } else {
        try {
          const compressed = await this.compressImage(file, 1280, 0.75);
          this.attachedMedia.push({
            type: 'image',
            name: file.name.replace(/\.[^/.]+$/, '') + '.jpg',
            dataUrl: compressed
          });
          this.renderMediaPreviews();
        } catch (err) {
          console.warn('Lỗi nén ảnh:', err);
        }
      }
    }
  }

  renderMediaPreviews() {
    if (!this.mediaPreviewGrid) return;
    this.mediaPreviewGrid.innerHTML = '';

    this.attachedMedia.forEach((item, idx) => {
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.display = 'inline-block';

      if (item.type === 'video') {
        wrapper.innerHTML = `
          <video src="${item.dataUrl}" style="width: 85px; height: 85px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(0, 210, 255, 0.4);" controls playsinline></video>
          <button type="button" style="position: absolute; top: -6px; right: -6px; background: #ff2a4b; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10;">✕</button>
        `;
      } else {
        wrapper.innerHTML = `
          <img src="${item.dataUrl}" style="width: 85px; height: 85px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(0, 210, 255, 0.4);" alt="Hiện trường">
          <button type="button" style="position: absolute; top: -6px; right: -6px; background: #ff2a4b; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10;">✕</button>
        `;
      }

      wrapper.querySelector('button').addEventListener('click', () => {
        this.attachedMedia.splice(idx, 1);
        this.renderMediaPreviews();
      });

      this.mediaPreviewGrid.appendChild(wrapper);
    });
  }

  async submitSOS() {
    const payload = {
      agency: this.selectedAgency,
      incidentTags: Array.from(this.selectedTags),
      customNotes: this.inputCustomNotes.value.trim(),
      media: this.attachedMedia,
      reporterName: this.inputReporterName.value.trim() || 'Người dân cần cứu hộ',
      reporterPhone: this.inputReporterPhone.value.trim() || '0988113115',
      lat: this.locationService.currentCoords.lat,
      lng: this.locationService.currentCoords.lng,
      address: this.locationService.currentAddress,
      accuracy: this.locationService.accuracy,
      telemetry: {
        userAgent: navigator.userAgent,
        platform: navigator.platform || '',
        screenResolution: `${window.screen?.width || 0}x${window.screen?.height || 0} (DPR: ${window.devicePixelRatio || 1})`,
        language: navigator.language || '',
        hardwareConcurrency: navigator.hardwareConcurrency || 0,
        networkType: navigator.connection?.effectiveType || navigator.connection?.type || 'unknown',
        deviceMemory: navigator.deviceMemory || undefined,
        clientTimestamp: new Date().toISOString()
      }
    };

    this.btnConfirmSOS.disabled = true;
    this.btnConfirmSOS.innerHTML = `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
      ĐANG PHÁT TÍN HIỆU CẤP CỨU...
    `;

        try {
      const res = await fetch('/api/sos/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let errorMsg = 'Mã trạng thái: ' + res.status;
        try {
          const errJson = await res.json();
          if (errJson.error) errorMsg = errJson.error;
        } catch (e) {
          try {
            const txt = await res.text();
            if (txt && txt.length < 150) errorMsg = txt;
          } catch(t) {}
        }
        alert('Máy chủ phản hồi: ' + errorMsg + '\nVui lòng gọi trực tiếp hotline 113 / 115 / 114');
        return;
      }

      const data = await res.json();

      if (data.ok && data.incident) {
        if (data.citizenAccessToken) {
          this.citizenAccessToken = data.citizenAccessToken;
          sessionStorage.setItem(this.getCitizenTokenKey(data.incident.id), data.citizenAccessToken);
        }
        this.closeModal();
        this.startTracking(data.incident);
      } else {
        alert('Có lỗi khi phát tín hiệu: ' + (data.error || 'Vui lòng thử lại'));
      }
    } catch (err) {
      console.error('Lỗi kết nối SOS:', err);
      alert('Không thể kết nối đến máy chủ cứu hộ. Vui lòng kiểm tra kết nối mạng hoặc gọi trực tiếp 113 / 115 / 114');
    } finally {
      this.btnConfirmSOS.disabled = false;
      this.btnConfirmSOS.innerHTML = `
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        XÁC NHẬN PHÁT TÍN HIỆU CỨU HỘ
      `;
    }
  }

  startTracking(incident) {
    this.activeIncident = incident;
    sessionStorage.setItem('active_sos_incident', JSON.stringify(incident));
    this.sosTriggerView.style.display = 'none';
    this.sosTrackingView.classList.add('is-active');

    // Ẩn thanh menu 3 nút khi người dân đang trong phiên SOS khẩn cấp
    document.body.classList.add('in-sos-tracking');
    const headerNav = document.getElementById('mainHeaderNav') || document.querySelector('.header-nav-center');
    if (headerNav) {
      headerNav.classList.add('is-hidden-sos');
      headerNav.style.setProperty('display', 'none', 'important');
    }

    this.trackSosId.textContent = `#${incident.id}`;
    const gmapsBtn = document.getElementById('btnOpenGoogleMaps');
    if (gmapsBtn) {
      const unit = incident.dispatchUnit || incident.assignedUnit;
      const originParam = (unit && unit.lat && unit.lng) ? `&origin=${unit.lat},${unit.lng}` : '';
      gmapsBtn.href = `https://www.google.com/maps/dir/?api=1${originParam}&destination=${incident.lat},${incident.lng}`;
    }
    this.updateIncidentUI(incident);

    // Initialize MapLibre with Carto Dark / Google Satellite
    setTimeout(() => {
      this.mapController = new MapController('trackingMap');
      this.mapController.init([incident.lng, incident.lat], 15);
      this.mapController.setCitizenMarker(incident.lat, incident.lng, 'Vị trí của bạn');

      const assigned = incident.dispatchUnit || incident.assignedUnit;
      if (assigned && assigned.lat && assigned.lng) {
        this.mapController.setStationMarker(
          assigned.lat,
          assigned.lng,
          assigned.unitName || assigned.name,
          incident.agency
        );
        this.mapController.drawRoute([assigned.lng, assigned.lat], [incident.lng, incident.lat]);
      }

      if (this.mapController.map) {
        const setupTrackingLayers = () => {
          this.mapController.initAllWardsLayer();
          if (incident.wardBoundary) {
            this.mapController.highlightWardBoundary(incident.wardBoundary, { color: '#eab308' });
          }
        };
        if (this.mapController.map.loaded()) {
          setupTrackingLayers();
        } else {
          this.mapController.map.once('load', setupTrackingLayers);
        }
      }
    }, 200);

    // Connect SSE for real-time updates
    this.connectLiveStream(incident.id);
  }

  connectLiveStream(incidentId = (this.activeIncident && this.activeIncident.id)) {
    const targetId = incidentId || this.activeIncident?.id;
    if (!targetId) return;
    if (this.eventSource) this.eventSource.close();
    const accessToken = this.citizenAccessToken ? `?access_token=${encodeURIComponent(this.citizenAccessToken)}` : '';
    this.eventSource = new EventSource(`/api/sos/stream/${targetId}${accessToken}`);

    this.eventSource.addEventListener('sos_update', (e) => {
      const updated = JSON.parse(e.data);
      console.log('📡 [LIVE UPDATE]', updated);
      this.activeIncident = updated;
      sessionStorage.setItem('active_sos_incident', JSON.stringify(updated));
      this.updateIncidentUI(updated);

      // Nếu phiếu đang mở, đồng bộ ngay chữ ký từ phía cán bộ thay vì
      // chờ vòng lặp đồng bộ tài liệu hai giây một lần.
      const dossier = document.getElementById('incidentReportDocxModal');
      if (dossier && dossier.classList.contains('is-open')) this.updateSignatureUI(updated);
    });

    this.eventSource.addEventListener('vehicle_pos', (e) => {
      const data = JSON.parse(e.data);
      if (this.mapController && data.vehicleLocation) {
        this.mapController.setVehicleMarker(
          data.vehicleLocation.lat,
          data.vehicleLocation.lng,
          this.activeIncident.agency,
          this.activeIncident.dispatchUnit?.unitName
        );
      }
    });

    this.eventSource.addEventListener('new_message', (e) => {
      try {
        const { message } = JSON.parse(e.data);
        if (message && message.sender === 'dispatcher') {
          this.playMessageTing();
        }
        this.appendChatMessage(message);
      } catch (err) {
        console.warn('Error parsing new_message SSE on citizen app:', err);
      }
    });

    this.eventSource.addEventListener('videocall_signal', (e) => {
      const signal = JSON.parse(e.data);
      console.log('📹 [CITIZEN GOT CALL SIGNAL]', signal);
      this.handleVideoCallSignal(signal);
    });

    this.eventSource.addEventListener('voicecall_signal', (e) => {
      const signal = JSON.parse(e.data);
      console.log('📞 [CITIZEN GOT VOICE CALL SIGNAL]', signal);
      this.handleVideoCallSignal(signal);
    });
  }

  handleVideoCallSignal(signal) {
    if (!signal) return;
    if (signal.sender === 'citizen') return; // Do not process citizen's own outgoing call requests
    if (!this.activeIncident || signal.incidentId !== this.activeIncident.id) return;

    const requestModal = document.getElementById('videoCallCitizenRequestModal');
    const callModalSosId = document.getElementById('callModalSosId');
    const callModalOfficerName = document.getElementById('callModalOfficerName');
    const callModalHeadingText = document.getElementById('callModalHeadingText');
    const callModalIcon = document.getElementById('callModalIcon');
    const callModalDescText = document.getElementById('callModalDescText');
    const callModalAcceptBtnText = document.getElementById('callModalAcceptBtnText');
    const callModalAcceptIcon = document.getElementById('callModalAcceptIcon');
    const btnAccept = document.getElementById('btnAcceptCitizenCall');
    const btnReject = document.getElementById('btnRejectCitizenCall');

    const isVoiceCall = (signal.callType === 'voice');

    if (signal.action === 'request') {
      // If citizen is ALREADY in an active voice call, do not show incoming request modal again
      if (isVoiceCall && this.isCitizenVoiceCallActive) {
        return;
      }

      if (callModalSosId) callModalSosId.textContent = `#${signal.incidentId}`;
      if (callModalOfficerName) callModalOfficerName.textContent = `${signal.officerName || 'Cán bộ'} (${signal.unitName || 'Trực ban'})`;

      if (isVoiceCall) {
        if (callModalHeadingText) callModalHeadingText.textContent = 'CUỘC GỌI THOẠI KHẨN CẤP TỪ TRỰC BAN';
        if (callModalIcon) callModalIcon.innerHTML = '<svg class="svg-ico ico-xl ico-emerald" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';
        if (callModalDescText) callModalDescText.textContent = 'Cán bộ trực ban tác chiến đang gọi thoại trực tiếp để nắm bắt tình hình và hướng dẫn chỉ đạo cứu nạn khẩn cấp.';
        if (callModalAcceptBtnText) callModalAcceptBtnText.textContent = 'NHẬN CUỘC GỌI THOẠI';
        if (callModalAcceptIcon) callModalAcceptIcon.innerHTML = '<svg class="svg-ico ico-md ico-white" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';
      } else {
        if (callModalHeadingText) callModalHeadingText.textContent = 'YÊU CẦU MỞ LIVE STREAM CAMERA';
        if (callModalIcon) callModalIcon.innerHTML = '<svg class="svg-ico ico-xl ico-red" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>';
        if (callModalDescText) callModalDescText.textContent = 'Đơn vị trực ban yêu cầu mở Camera trực tiếp để quan sát hiện trường thực tế và hướng dẫn chỉ đạo cứu nạn khẩn cấp từ xa.';
        if (callModalAcceptBtnText) callModalAcceptBtnText.textContent = 'BẬT CAMERA & KẾT NỐI';
        if (callModalAcceptIcon) callModalAcceptIcon.innerHTML = '<svg class="svg-ico ico-md ico-white" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>';
      }

      if (requestModal) {
        requestModal.classList.add('is-open');
        requestModal.style.display = 'flex';
        requestModal.style.visibility = 'visible';
        requestModal.style.opacity = '1';
      }

      // Kích hoạt đổ chuông cuộc gọi khẩn cấp từ cán bộ trực ban
      this.startIncomingCallRingtone();

      if (btnAccept) {
        btnAccept.onclick = () => {
          this.stopIncomingCallRingtone();
          if (requestModal) {
            requestModal.classList.remove('is-open');
            requestModal.style.display = 'none';
          }
          if (isVoiceCall) {
            fetch('/api/sos/videocall/signal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...this.citizenAccessHeaders() },
              body: JSON.stringify({ id: this.activeIncident.id, action: 'accept', sender: 'citizen', callType: 'voice', accessToken: this.citizenAccessToken })
            }).catch(() => {});
            this.startCitizenVoiceCall(false);
          } else {
            this.startCitizenLiveStream();
          }
        };
      }

      if (btnReject) {
        btnReject.onclick = () => {
          this.stopIncomingCallRingtone();
          if (requestModal) {
            requestModal.classList.remove('is-open');
            requestModal.style.display = 'none';
          }
          fetch('/api/sos/videocall/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...this.citizenAccessHeaders() },
            body: JSON.stringify({ id: this.activeIncident.id, action: 'reject', sender: 'citizen', callType: isVoiceCall ? 'voice' : 'video', accessToken: this.citizenAccessToken })
          }).catch(() => {});
        };
      }
    } else if (signal.action === 'accept') {
      this.stopIncomingCallRingtone();
      if (requestModal) {
        requestModal.classList.remove('is-open');
        requestModal.style.display = 'none';
        requestModal.style.visibility = 'hidden';
      }
      if (isVoiceCall) {
        const statusTextEl = document.getElementById('citizenVoiceCallStatusText');
        if (statusTextEl) {
          statusTextEl.innerHTML = '<span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #34d399; animation: pulse 1s infinite;"></span> Đang đàm thoại 2 bên & truyền âm thanh chất lượng cao';
        }
      } else {
        const hintEl = document.getElementById('citizenLiveStreamStatusHint');
        if (hintEl) {
          hintEl.textContent = '🟢 Cán bộ trực ban đã nhấc máy & đang quan sát hiện trường';
          hintEl.style.color = '#34d399';
        }
      }
    } else if (signal.action === 'reject') {
      this.stopIncomingCallRingtone();
      if (requestModal) {
        requestModal.classList.remove('is-open');
        requestModal.style.display = 'none';
      }
      this.showToast?.('Cán bộ trực ban đang bận xử lý ca khác hoặc đã từ chối cuộc gọi.', 'warning');
      if (isVoiceCall) {
        this.endCitizenVoiceCall(false);
      } else {
        this.endCitizenLiveStream(false);
      }
    } else if (signal.action === 'end') {
      this.stopIncomingCallRingtone();
      if (requestModal) {
        requestModal.classList.remove('is-open');
        requestModal.style.display = 'none';
      }
      if (isVoiceCall) {
        this.endCitizenVoiceCall(false);
      } else {
        this.endCitizenLiveStream(false);
      }
    }
  }

  startIncomingCallRingtone() {
    try {
      if (this.callRingtonePlaying) return;
      this.callRingtonePlaying = true;

      // 1. Audio Element fallback if present
      const audioEl = document.getElementById('sfxIncomingCall');
      if (audioEl) {
        audioEl.currentTime = 0;
        audioEl.play().catch(() => {});
      }

      // 2. Web Audio API Telephone Ringer (100% reliable, zero network latency/dependencies)
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
        // Dual-tone burst (Ring 1: 450ms, Pause: 200ms, Ring 2: 450ms)
        this.playRingTonePair(now, 0.45);
        this.playRingTonePair(now + 0.65, 0.45);

        // Standard 3s telephone ringing cadence
        this.ringtoneTimer = setTimeout(() => {
          if (this.callRingtonePlaying) {
            playCadence();
          }
        }, 3000);
      };

      playCadence();
    } catch (e) {
      console.warn('Cannot start incoming call ringtone:', e);
    }
  }

  playRingTonePair(startTime, duration) {
    if (!this.ringtoneAudioCtx) return;
    try {
      const osc1 = this.ringtoneAudioCtx.createOscillator();
      const osc2 = this.ringtoneAudioCtx.createOscillator();
      const gain = this.ringtoneAudioCtx.createGain();

      // Authentic telephone dual-frequencies: 440 Hz + 480 Hz
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, startTime);
      osc2.frequency.setValueAtTime(480, startTime);

      // Smooth envelope with subtle rise and decay to prevent click pops
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.25, startTime + 0.04);
      gain.gain.setValueAtTime(0.25, startTime + duration - 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ringtoneAudioCtx.destination);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + duration);
      osc2.stop(startTime + duration);
    } catch(err) {
      console.warn('playRingTonePair error:', err);
    }
  }

  stopIncomingCallRingtone() {
    this.callRingtonePlaying = false;
    if (this.ringtoneTimer) {
      clearTimeout(this.ringtoneTimer);
      this.ringtoneTimer = null;
    }
    const audioEl = document.getElementById('sfxIncomingCall');
    if (audioEl) {
      try {
        audioEl.pause();
        audioEl.currentTime = 0;
      } catch(e) {}
    }
    if (this.ringtoneAudioCtx && this.ringtoneAudioCtx.state === 'running') {
      try {
        this.ringtoneAudioCtx.suspend().catch(() => {});
      } catch(e) {}
    }
  }

  initiateCitizenVideoCallToDispatcher() {
    if (!this.activeIncident) {
      this.showToast?.('Chưa có ca cứu hộ hoạt động', 'warning');
      return;
    }
    this.startCitizenLiveStream(true);
  }

  async startCitizenLiveStream(isOutgoing = false) {
    const overlay = document.getElementById('videoCallCitizenOverlay');
    const videoEl = document.getElementById('citizenLiveVideoElement');
    const sosIdLabel = document.getElementById('citizenOverlaySosId');
    const timerLabel = document.getElementById('citizenCallTimer');
    const btnEnd = document.getElementById('btnEndCitizenCall');
    const btnMic = document.getElementById('btnToggleCitizenMic');
    const btnFlip = document.getElementById('btnFlipCitizenCamera');
    const hintEl = document.getElementById('citizenLiveStreamStatusHint');

    if (sosIdLabel && this.activeIncident) {
      sosIdLabel.textContent = `#${this.activeIncident.id}`;
    }

    if (overlay) overlay.style.display = 'flex';

    try {
      this.citizenMediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: this.currentFacingMode || 'environment' },
        audio: true
      });
      if (videoEl) videoEl.srcObject = this.citizenMediaStream;
    } catch (err) {
      console.warn('Camera access fallback:', err);
    }

    // Start Call Timer
    let seconds = 0;
    if (this.callTimerInterval) clearInterval(this.callTimerInterval);
    if (timerLabel) timerLabel.textContent = '00:00';
    this.callTimerInterval = setInterval(() => {
      seconds++;
      const m = String(Math.floor(seconds / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      if (timerLabel) timerLabel.textContent = `${m}:${s}`;
    }, 1000);

    if (isOutgoing) {
      if (hintEl) {
        hintEl.textContent = 'Đang đổ chuông gọi Trực ban... Chờ cán bộ nhấc máy';
        hintEl.style.color = '#fbbf24';
      }
      // Citizen initiated video call: request signal
      fetch('/api/sos/videocall/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.citizenAccessHeaders() },
        body: JSON.stringify({
          id: this.activeIncident.id,
          action: 'request',
          sender: 'citizen',
          callType: 'video',
          accessToken: this.citizenAccessToken
        })
      }).catch(() => {});
    } else {
      if (hintEl) {
        hintEl.textContent = 'Trực ban đang quan sát trực tiếp hiện trường';
        hintEl.style.color = '#cbd5e1';
      }
      // Dispatcher initiated video call: accept signal
      fetch('/api/sos/videocall/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.citizenAccessHeaders() },
        body: JSON.stringify({ id: this.activeIncident.id, action: 'accept', sender: 'citizen', callType: 'video', accessToken: this.citizenAccessToken })
      }).catch(() => {});
    }

    if (btnEnd && !btnEnd._hasListener) {
      btnEnd._hasListener = true;
      btnEnd.onclick = () => {
        this.endCitizenLiveStream(true);
      };
    }

    if (btnMic && !btnMic._hasListener) {
      btnMic._hasListener = true;
      btnMic.onclick = () => {
        if (this.citizenMediaStream) {
          const audioTrack = this.citizenMediaStream.getAudioTracks()[0];
          if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            btnMic.textContent = audioTrack.enabled ? '🎤 Bật/Tắt Mic' : '🔇 Mic Đã Tắt';
          }
        }
      };
    }

    const btnRec = document.getElementById('btnRecordCitizenCall');
    const recDot = document.getElementById('recDotCitizen');
    const recText = document.getElementById('recTextCitizen');

    if (btnRec && !btnRec._hasListener) {
      btnRec._hasListener = true;
      btnRec.onclick = async () => {
        if (!this.citizenCallRecorder) {
          this.citizenCallRecorder = new CallAudioRecorder({
            onTick: (formatted) => {
              if (recText) recText.textContent = `⏹️ Dừng & Tải MP3 (${formatted})`;
            }
          });
        }

        if (!this.citizenCallRecorder.isRecording) {
          try {
            await this.citizenCallRecorder.startRecording(this.citizenMediaStream);
            if (recDot) recDot.style.animation = 'pulse 1s infinite';
            if (recText) recText.textContent = '⏹️ Dừng & Tải MP3 (00:00)';
            btnRec.style.background = 'rgba(239, 68, 68, 0.45)';
          } catch (err) {
            alert('Không thể ghi âm: ' + err.message);
          }
        } else {
          const res = await this.citizenCallRecorder.stopAndDownload(this.activeIncident ? this.activeIncident.id : 'CITIZEN');
          if (recDot) recDot.style.animation = 'none';
          if (recText) recText.textContent = 'Ghi Âm 2 Bên';
          btnRec.style.background = 'rgba(239, 68, 68, 0.2)';
          if (res && res.success) {
            alert(`✓ Đã tải file ghi âm "${res.filename}" về máy. Dữ liệu âm thanh tự hủy khỏi bộ nhớ, không lưu trên máy chủ (Tuân thủ NĐ 13/2023/NĐ-CP).`);
          }
        }
      };
    }
  }


  endCitizenLiveStream(notify = true) {
    const overlay = document.getElementById('videoCallCitizenOverlay');
    if (overlay) overlay.style.display = 'none';

    const videoEl = document.getElementById('citizenLiveVideoElement');
    if (videoEl) videoEl.srcObject = null;

    if (this.citizenMediaStream) {
      this.citizenMediaStream.getTracks().forEach(track => track.stop());
      this.citizenMediaStream = null;
    }

    if (this.callTimerInterval) {
      clearInterval(this.callTimerInterval);
      this.callTimerInterval = null;
    }

    if (this.citizenCallRecorder && this.citizenCallRecorder.isRecording) {
      this.citizenCallRecorder.stopAndDownload(this.activeIncident ? this.activeIncident.id : 'CITIZEN');
    } else if (this.citizenCallRecorder) {
      this.citizenCallRecorder.destroyAudioPipeline();
    }
    const recText = document.getElementById('recTextCitizen');
    if (recText) recText.textContent = 'Ghi Âm 2 Bên';
    const recDot = document.getElementById('recDotCitizen');
    if (recDot) recDot.style.animation = 'none';


    if (notify && this.activeIncident) {
      fetch('/api/sos/videocall/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.citizenAccessHeaders() },
        body: JSON.stringify({ id: this.activeIncident.id, action: 'end', sender: 'citizen', callType: 'video', accessToken: this.citizenAccessToken })
      }).catch(() => {});
    }
  }

  async startCitizenVoiceCall(notifyDispatcher = true) {
    const modal = document.getElementById('citizenVoiceCallModal');
    const sosIdEl = document.getElementById('citizenVoiceSosId');
    const officerNameEl = document.getElementById('citizenVoiceOfficerName');
    const unitNameEl = document.getElementById('citizenVoiceUnitName');
    const timerEl = document.getElementById('citizenVoiceCallTimer');
    const statusTextEl = document.getElementById('citizenVoiceCallStatusText');
    const btnEnd = document.getElementById('btnEndCitizenVoiceCall');
    const btnMic = document.getElementById('btnToggleCitizenVoiceMic');
    const btnRec = document.getElementById('btnRecordCitizenVoiceCall');
    const recDot = document.getElementById('recDotCitizenVoice');
    const recText = document.getElementById('recTextCitizenVoice');
    const canvas = document.getElementById('citizenVoiceVisualizerCanvas');

    const inc = this.activeIncident || {};
    const incId = inc.id || 'SOS-CALL';
    if (sosIdEl) sosIdEl.textContent = `#${incId}`;

    const assigned = inc.dispatchUnit || inc.assignedUnit || {};
    const officerTitle = assigned.officerFullTitle || (assigned.officerRank ? `${assigned.officerRank} ${assigned.officerName}` : assigned.officerName) || 'Cán bộ trực ban tác chiến';
    const unitTitle = assigned.unitName || inc.ward || 'Trực ban Công an / Cứu hộ cứu nạn';

    if (officerNameEl) officerNameEl.textContent = officerTitle;
    if (unitNameEl) unitNameEl.textContent = unitTitle;
    if (timerEl) timerEl.textContent = '⏱️ 00:00';
    if (statusTextEl) {
      if (notifyDispatcher) {
        // Citizen initiated: waiting for dispatcher to pick up
        statusTextEl.innerHTML = '<span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #fbbf24; animation: pulse 1s infinite;"></span> Đang đổ chuông… Chờ trực ban nhấc máy';
      } else {
        // Dispatcher initiated & citizen accepted: already connected
        statusTextEl.innerHTML = '<span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #34d399; animation: pulse 1s infinite;"></span> Đang đàm thoại 2 bên & truyền âm thanh chất lượng cao';
      }
    }

    if (modal) {
      modal.classList.add('is-open');
      modal.style.display = 'flex';
      modal.style.visibility = 'visible';
      modal.style.opacity = '1';
    }

    // Acquire Citizen Microphone Stream
    try {
      this.citizenVoiceStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.citizenVoiceCallStream = this.citizenVoiceStream;
    } catch (err) {
      console.warn('Microphone access fallback on voice call:', err);
    }
    this.isCitizenVoiceCallActive = true;

    // Setup Call Timer
    let seconds = 0;
    if (this.citizenVoiceTimerInterval) clearInterval(this.citizenVoiceTimerInterval);
    this.citizenVoiceTimerInterval = setInterval(() => {
      seconds++;
      const m = String(Math.floor(seconds / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      if (timerEl) timerEl.textContent = `⏱️ ${m}:${s}`;
    }, 1000);

    // Setup Visualizer Canvas
    this.setupCitizenVoiceVisualizer(canvas);

    // Notify Dispatcher if initiated by citizen
    if (notifyDispatcher && this.activeIncident) {
      fetch('/api/sos/videocall/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.citizenAccessHeaders() },
        body: JSON.stringify({
          id: this.activeIncident.id,
          action: 'request',
          sender: 'citizen',
          callType: 'voice',
          accessToken: this.citizenAccessToken
        })
      }).catch(e => console.warn('Voice call signal error:', e));
    }

    // End call button
    if (btnEnd) {
      btnEnd.onclick = () => {
        this.endCitizenVoiceCall(true);
      };
    }

    // Mic toggle button
    if (btnMic) {
      btnMic.onclick = () => {
        if (this.citizenVoiceStream) {
          const audioTrack = this.citizenVoiceStream.getAudioTracks()[0];
          if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            btnMic.innerHTML = audioTrack.enabled
              ? '<svg class="svg-ico ico-sm" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg> <span>Bật/Tắt Mic</span>'
              : '<span>🔇 Mic Đã Tắt</span>';
          }
        }
      };
    }

    // 2-way call audio recording button
    if (btnRec) {
      btnRec.onclick = async () => {
        if (!this.citizenVoiceRecorder) {
          this.citizenVoiceRecorder = new CallAudioRecorder({
            onTick: (formatted) => {
              if (recText) recText.textContent = `⏹️ Dừng (${formatted})`;
            }
          });
        }

        if (!this.citizenVoiceRecorder.isRecording) {
          try {
            await this.citizenVoiceRecorder.startRecording(this.citizenVoiceStream);
            if (recDot) recDot.style.animation = 'pulse 1s infinite';
            if (recText) recText.textContent = '⏹️ Dừng (00:00)';
            btnRec.style.background = 'rgba(239, 68, 68, 0.45)';
          } catch (err) {
            alert('Không thể ghi âm cuộc gọi: ' + err.message);
          }
        } else {
          const res = await this.citizenVoiceRecorder.stopAndDownload(this.activeIncident ? this.activeIncident.id : 'CITIZEN_VOICE');
          if (recDot) recDot.style.animation = 'none';
          if (recText) recText.textContent = 'Ghi Âm 2 Bên';
          btnRec.style.background = 'rgba(239, 68, 68, 0.2)';
          if (res && res.success) {
            alert(`✓ Đã tải file ghi âm cuộc gọi "${res.filename}" về máy an toàn (Tuân thủ Nghị định 13/2023/NĐ-CP).`);
          }
        }
      };
    }
  }

  setupCitizenVoiceVisualizer(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.citizenVoiceVisualizerAnimId) {
      cancelAnimationFrame(this.citizenVoiceVisualizerAnimId);
      this.citizenVoiceVisualizerAnimId = null;
    }

    let analyser = null;
    let dataArray = null;

    if (this.citizenVoiceStream) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          if (!this.citizenVoiceAudioCtx || this.citizenVoiceAudioCtx.state === 'closed') {
            this.citizenVoiceAudioCtx = new AudioContextClass();
          }
          if (this.citizenVoiceAudioCtx.state === 'suspended') {
            this.citizenVoiceAudioCtx.resume().catch(() => {});
          }
          const source = this.citizenVoiceAudioCtx.createMediaStreamSource(this.citizenVoiceStream);
          analyser = this.citizenVoiceAudioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          dataArray = new Uint8Array(analyser.frequencyBinCount);
        }
      } catch (e) {
        console.warn('Citizen voice visualizer audio context warning:', e);
      }
    }

    let phase = 0;
    const draw = () => {
      this.citizenVoiceVisualizerAnimId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const numBars = 32;
      const barWidth = width / numBars - 2;

      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
      }

      phase += 0.08;
      for (let i = 0; i < numBars; i++) {
        let val = (dataArray && dataArray[i]) ? (dataArray[i] / 255) : 0;
        if (val < 0.1) {
          val = 0.15 + 0.25 * Math.sin(phase + i * 0.3);
        }
        const barHeight = Math.max(4, val * (height - 6));
        const x = i * (barWidth + 2);
        const y = height / 2 - barHeight / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, '#34d399');
        grad.addColorStop(1, '#059669');

        ctx.fillStyle = grad;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, 2);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }
    };
    draw();
  }

  endCitizenVoiceCall(notifyDispatcher = true) {
    this.isCitizenVoiceCallActive = false;
    this.citizenVoiceCallStream = null;
    const modal = document.getElementById('citizenVoiceCallModal');
    if (modal) {
      modal.classList.remove('is-open');
      modal.style.display = 'none';
      modal.style.visibility = 'hidden';
      modal.style.opacity = '0';
    }

    if (this.citizenVoiceTimerInterval) {
      clearInterval(this.citizenVoiceTimerInterval);
      this.citizenVoiceTimerInterval = null;
    }

    if (this.citizenVoiceVisualizerAnimId) {
      cancelAnimationFrame(this.citizenVoiceVisualizerAnimId);
      this.citizenVoiceVisualizerAnimId = null;
    }

    if (this.citizenVoiceStream) {
      this.citizenVoiceStream.getTracks().forEach(t => t.stop());
      this.citizenVoiceStream = null;
    }

    if (this.citizenVoiceAudioCtx && this.citizenVoiceAudioCtx.state !== 'closed') {
      try { this.citizenVoiceAudioCtx.close().catch(() => {}); } catch(e) {}
      this.citizenVoiceAudioCtx = null;
    }

    if (this.citizenVoiceRecorder && this.citizenVoiceRecorder.isRecording) {
      this.citizenVoiceRecorder.stopAndDownload(this.activeIncident ? this.activeIncident.id : 'CITIZEN_VOICE');
    }

    const recDot = document.getElementById('recDotCitizenVoice');
    if (recDot) recDot.style.animation = 'none';
    const recText = document.getElementById('recTextCitizenVoice');
    if (recText) recText.textContent = 'Ghi Âm 2 Bên';

    if (notifyDispatcher && this.activeIncident) {
      fetch('/api/sos/videocall/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.citizenAccessHeaders() },
        body: JSON.stringify({ id: this.activeIncident.id, action: 'end', sender: 'citizen', callType: 'voice', accessToken: this.citizenAccessToken })
      }).catch(() => {});
    }
  }

  updateIncidentUI(incident) {
    // Stepper
    const step = incident.stepIndex || 1;
    const progressPercents = [15, 35, 60, 85, 100];
    this.stepperFill.style.width = `${progressPercents[step - 1]}%`;

    for (let i = 1; i <= 5; i++) {
      const el = document.getElementById(`stepNode${i}`);
      if (!el) continue;
      el.classList.remove('active', 'completed');
      if (i < step) el.classList.add('completed');
      else if (i === step) el.classList.add('active');
    }

    // Status Badge & Level
    this.trackStatusBadge.className = `tracking-badge-status ${incident.status}`;
    const levelBadge = document.getElementById('unitLevelBadge');
    if (levelBadge) {
      levelBadge.textContent = incident.currentLevel === 'province' ? 'CẤP TỈNH / TP (ĐÃ LEO THANG)' : 'CẤP XÃ / PHƯỜNG';
      levelBadge.className = `queue-agency-tag ${incident.currentLevel === 'province' ? 'hospital' : 'police'}`;
    }

    if (incident.status === 'pending') {
      this.trackStatusBadge.innerHTML = '<svg class="svg-ico ico-sm ico-amber" viewBox="0 0 24 24"><path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"></path></svg> Đang gửi trực ban xã/phường';
    } else if (incident.status === 'escalated') {
      this.trackStatusBadge.innerHTML = '<svg class="svg-ico ico-sm ico-amber" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> Đã chuyển tiếp cấp Tỉnh/TP';
    } else if (incident.status === 'dispatching') {
      this.trackStatusBadge.innerHTML = '<svg class="svg-ico ico-sm ico-blue" viewBox="0 0 24 24"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg> Lực lượng đang di chuyển';
    } else if (incident.status === 'approaching' || incident.status === 'arrived') {
      this.trackStatusBadge.innerHTML = '<svg class="svg-ico ico-sm ico-red" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> Đã tiếp cận hiện trường';
    } else if (incident.status === 'resolved') {
      this.trackStatusBadge.innerHTML = '<svg class="svg-ico ico-sm ico-emerald" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Hoàn tất xử lý';
    }

    // Unit info
    const assigned = incident.dispatchUnit || incident.assignedUnit;
    if (assigned) {
      this.unitAvatar.innerHTML = '<svg class="svg-ico ico-2xl ico-blue" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
      this.unitName.textContent = assigned.unitName || assigned.name;
      const officerTitle = assigned.officerFullTitle || (assigned.officerRank ? `${assigned.officerRank} ${assigned.officerName}` : assigned.officerName) || 'Kíp trực ban phản ứng nhanh';
      const subInfo = incident.dispatchUnit
        ? `Chỉ huy: ${officerTitle} · SĐT: ${incident.dispatchUnit.officerPhone} (${incident.etaMinutes || 5}p)`
        : `Cán bộ tiếp nhận: ${officerTitle}`;
      this.unitSub.textContent = subInfo;

      // Populate Detailed Station Box
      const addrEl = document.getElementById('unitStationAddress');
      const phoneEl = document.getElementById('unitStationPhone');
      const smsEl = document.getElementById('unitStationSms');
      const emailEl = document.getElementById('unitStationEmail');
      if (addrEl) addrEl.textContent = assigned.address || assigned.stationAddress || 'Trụ sở đơn vị tiếp nhận';
      if (phoneEl) phoneEl.textContent = assigned.phone || incident.assignedUnit?.phone || '113';
      if (smsEl) smsEl.textContent = assigned.sms || incident.assignedUnit?.sms || '0988 113 113';
      if (emailEl) emailEl.textContent = assigned.email || incident.assignedUnit?.email || 'trucban@sos.gov.vn';

      // Update Google Maps Links to Station / Incident for Car & Motorbike
      const btnGmapsCar = document.getElementById('btnOpenGoogleMapsCar');
      const btnGmapsMoto = document.getElementById('btnOpenGoogleMapsMoto');
      const btnGmaps = document.getElementById('btnOpenGoogleMaps');

      const destCoords = (assigned.lat && assigned.lng) ? `${assigned.lat},${assigned.lng}` : encodeURIComponent(`${assigned.unitName || assigned.name}, ${assigned.address || ''}`);
      const originParam = (incident.lat && incident.lng) ? `&origin=${incident.lat},${incident.lng}` : '';

      if (btnGmapsCar) {
        btnGmapsCar.href = `https://www.google.com/maps/dir/?api=1${originParam}&destination=${destCoords}&travelmode=driving`;
      }
      if (btnGmapsMoto) {
        btnGmapsMoto.href = `https://www.google.com/maps/dir/?api=1${originParam}&destination=${destCoords}&travelmode=two_wheeler`;
      }
      if (btnGmaps) {
        btnGmaps.href = `https://www.google.com/maps/dir/?api=1${originParam}&destination=${destCoords}&travelmode=driving`;
      }

      if (assigned.officerPhone || assigned.phone) {
        this.btnCallUnit.href = `tel:${assigned.officerPhone || assigned.phone}`;
        this.btnCallUnit.style.display = 'flex';
      }

      if (this.mapController && assigned.lat && assigned.lng) {
        this.mapController.setStationMarker(assigned.lat, assigned.lng, assigned.unitName || assigned.name, incident.agency);
        this.mapController.drawRoute([assigned.lng, assigned.lat], [incident.lng, incident.lat]);
      }
    }

    // Multi-channel badges update
    if (incident.dispatchChannels) {
      const smsBadge = document.getElementById('statusSmsBadge');
      const voiceBadge = document.getElementById('statusVoiceBadge');
      const emailBadge = document.getElementById('statusEmailBadge');
      if (smsBadge) smsBadge.textContent = `Đã gửi ${assigned?.sms || assigned?.phone || 'Trực ban'}`;
      if (voiceBadge) voiceBadge.textContent = `Đã gọi AI (3 lần) ✓`;
      if (emailBadge) emailBadge.textContent = `Đã gửi ${assigned?.email || 'Email'}`;
    }

    // Messages render
    if (incident.messages) {
      this.chatMessages.innerHTML = '';
      incident.messages.forEach(msg => this.appendChatMessage(msg));
    }

    // Lock or unlock chat input based on resolved status
    if (this.inputChatText && this.btnSendChat) {
      if (incident.status === 'resolved') {
        this.inputChatText.disabled = true;
        this.inputChatText.placeholder = '🔒 Phiếu cứu hộ đã hoàn tất. Cuộc trò chuyện đã kết thúc và được lưu vào Lịch sử.';
        this.btnSendChat.disabled = true;
      } else {
        this.inputChatText.disabled = false;
        this.inputChatText.placeholder = 'Nhắn tin cho trực ban...';
        this.btnSendChat.disabled = false;
      }
    }

    // Auto open Phiếu tiếp nhận & Ký tên điện tử when resolved
    if (incident.status === 'resolved' && !this._hasShownResolvedPrompt) {
      this._hasShownResolvedPrompt = true;
      setTimeout(() => {
        this.openReportModal(incident);
      }, 300);
    }
  }

  getAgencyHeaderInfo(inc) {
    const agency = inc?.agency || 'police';
    const isEscalated = inc?.currentLevel === 'province' || inc?.status === 'escalated';
    const assigned = inc?.dispatchUnit || inc?.assignedUnit || {};
    const jurisdiction = inc?.jurisdiction || {};
    const unitName = assigned.name || assigned.unitName || '';
    const ward = jurisdiction.ward || '';
    let province = jurisdiction.province || inc?.province || '';

    if (!province) {
      const searchStr = `${inc?.address || ''} ${assigned.address || ''} ${unitName}`.toLowerCase();
      const PROVINCES = ['Cần Thơ', 'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Bình Dương', 'Đồng Nai', 'An Giang', 'Vĩnh Long'];
      for (const p of PROVINCES) {
        if (searchStr.includes(p.toLowerCase())) {
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
    } else if (agency === 'hospital' || agency === '115' || agency === 'medical' || agency === 'ambulance') {
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

  openReportModal(inc) {
    if (!inc) return;
    const modal = document.getElementById('incidentReportDocxModal');
    if (!modal) return;

    this.activeIncident = inc;
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

    if (docSosId) docSosId.textContent = `#${inc.id}`;
    if (docIncidentTime) docIncidentTime.textContent = formattedTime;
    if (docOfficerName) docOfficerName.value = assigned.officerFullTitle || assigned.officerName || 'Đại úy Lê Văn Hòa (Trưởng Công An Xã)';
    if (docUnitAddress) docUnitAddress.value = assigned.address || assigned.stationAddress || `Trụ sở Công An ${jurisdiction.ward || 'Cơ sở'}, ${jurisdiction.province || 'Cần Thơ'}`;
    if (docUnitNameLabel) docUnitNameLabel.textContent = assigned.name || assigned.unitName || 'Công An Xã Thuận Hòa';
    if (docUnitPhone) docUnitPhone.value = assigned.phone || '0292 3899 113';
    if (docUnitSms) docUnitSms.value = assigned.sms || '0988 113 113';
    if (docReporterName) docReporterName.value = inc.reporterName || 'Người dân cần hỗ trợ';
    if (docIncidentCallTime) docIncidentCallTime.value = formattedTime;
    
    // Vị trí xảy ra sự cố: Tuyệt đối KHÔNG nhầm với địa chỉ trụ sở công an.
    // Nếu người dân không gõ địa chỉ cụ thể, để khu vực địa bàn hoặc tọa độ GPS hoặc để trống để tự điền.
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
      docIncidentDescription.value = `${inc.incidentTags?.join(', ') || 'Sự cố khẩn cấp'}. ${inc.customNotes || ''} ${isEscalated ? '[ĐÃ LEO THANG XỬ LÝ LÊN TUYẾN TỈNH/THÀNH PHỐ SAU 15 PHÚT CẤP CƠ SỞ CHƯA TIẾP NHẬN]' : 'Đã định vị GPS và kết nối trực tiếp với trực ban cứu hộ.'}`;
    }
    if (docSignReporter) docSignReporter.textContent = inc.reporterName || 'Người dân';
    if (docSignOfficer) docSignOfficer.textContent = assigned.officerName || assigned.officerFullTitle || 'Cán bộ tiếp nhận';

    // Set dynamic agency checkbox labels
    const docUnitPoliceLabel = document.getElementById('docUnitPoliceLabel');
    const docUnitCsgtLabel = document.getElementById('docUnitCsgtLabel');
    const docUnitFireLabel = document.getElementById('docUnitFireLabel');
    const docUnitHospitalLabel = document.getElementById('docUnitHospitalLabel');
    const docUnitRescueLabel = document.getElementById('docUnitRescueLabel');

    const policeAreaStr = jurisdiction.ward ? `${jurisdiction.ward}, ${jurisdiction.province || ''}` : (assigned.name || 'Công An Xã/Phường');
    if (docUnitPoliceLabel) docUnitPoliceLabel.textContent = policeAreaStr;
    if (docUnitCsgtLabel) docUnitCsgtLabel.textContent = (agency === 'csgt' && assigned.name) ? assigned.name : 'Đội CSGT - Trật Tự Địa Bàn';
    if (docUnitFireLabel) docUnitFireLabel.textContent = (agency === 'fire' && assigned.name) ? assigned.name : 'Đội Cảnh Sát PCCC & CNCH';
    if (docUnitHospitalLabel) docUnitHospitalLabel.textContent = ((agency === 'hospital' || agency === 'ambulance') && assigned.name) ? assigned.name : 'Bệnh Viện Đa Khoa';
    if (docUnitRescueLabel) docUnitRescueLabel.textContent = (agency === 'traffic-rescue' && assigned.name) ? assigned.name : 'Đội Cứu Hộ Giao Thông & Kéo Xe';

    const check113 = document.getElementById('docCheck113');
    const checkCsgt = document.getElementById('docCheckCsgt');
    const check114 = document.getElementById('docCheck114');
    const checkRescue = document.getElementById('docCheckRescue');
    const check115 = document.getElementById('docCheck115');

    if (check113) check113.checked = (agency === 'police');
    if (checkCsgt) checkCsgt.checked = (agency === 'csgt');
    if (check114) check114.checked = (agency === 'fire');
    if (checkRescue) checkRescue.checked = (agency === 'traffic-rescue');
    if (check115) check115.checked = (agency === 'hospital' || agency === 'ambulance');

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

    // Populate interactive signature input fields and synchronize bidirectional
    const inputRep = document.getElementById('docSignReporterInput');
    const inputOff = document.getElementById('docSignOfficerInput');
    const docRepName = document.getElementById('docReporterName');
    const docOffName = document.getElementById('docOfficerName');

    const citizenInitialName = inc.signatures?.citizen?.name || inc.reporterName || '';
    if (inputRep) inputRep.value = citizenInitialName;
    if (docRepName) docRepName.value = citizenInitialName;

    const officerInitialName = inc.signatures?.officer?.name || assigned.officerName || assigned.officerFullTitle || '';
    if (inputOff) inputOff.value = officerInitialName;
    if (docOffName) docOffName.value = officerInitialName;

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
          headers: { 'Content-Type': 'application/json', ...this.citizenAccessHeaders() },
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
      if (!m || m.style.display === 'none' || !this.activeIncident) {
        clearInterval(this.docSyncInterval);
        return;
      }

      const payload = {
        id: this.activeIncident.id,
        role: 'citizen',
        docFields: {
          reporterName: (document.getElementById('docSignReporterInput')?.value || document.getElementById('docReporterName')?.value || '').trim(),
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
          headers: { 'Content-Type': 'application/json', ...this.citizenAccessHeaders() },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.ok && data.incident) {
          this.activeIncident = data.incident;
          this.updateSignatureUI(data.incident);
        }
      } catch (e) {}
    }, 2000);
  }

  stripEmojis(str) {
    if (!str) return '';
    return str.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FA70}✍️🚨🚒🚑🚓🛠️🟢✅⚠️☑☐]/gu, '').trim();
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
    const btnGoHome = document.getElementById('btnReportModalGoHome');
    const btnBottomGoHome = document.getElementById('btnBottomConfirmResolvedGoHome');
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
        btnCitizenSign.innerHTML = '🟢 Đã Ký Điện Tử';
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
        btnCitizenSign.innerHTML = '✍️ Ký Điện Tử (Người Dân)';
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
        btnOfficerSign.style.cursor = 'default';
      }
      if (officerTime) officerTime.textContent = `Đã ký lúc: ${this.formatSignatureTime(officerSig)}`;
    } else {
      if (officerPlaceholder) officerPlaceholder.style.display = 'block';
      if (officerImg) officerImg.style.display = 'none';
      if (officerText) officerText.style.display = 'none';
      if (btnOfficerSign) {
        btnOfficerSign.innerHTML = '<svg class="svg-ico ico-xs" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> 🔒 Chờ Cán Bộ Ký Xác Thực';
        btnOfficerSign.style.background = 'rgba(148, 163, 184, 0.15)';
        btnOfficerSign.style.borderColor = '#94a3b8';
        btnOfficerSign.style.color = '#64748b';
        btnOfficerSign.style.cursor = 'not-allowed';
      }
      if (officerTime) officerTime.textContent = '';
    }

    // Legal Enforcement Check: BOTH sides must sign AND have non-empty typed name matching document!
    const citizenNameVal = (inputRep?.value || citizenSig.name || docRepName?.value || '').trim();
    const officerNameVal = (inputOff?.value || officerSig.name || docOffName?.value || '').trim();

    const isCitizenComplete = Boolean(citizenSig.signed && citizenNameVal && citizenNameVal.length > 1);
    const isOfficerComplete = Boolean(officerSig.signed && officerNameVal && officerNameVal.length > 1);
    const isFullySigned = Boolean(isCitizenComplete && isOfficerComplete);

    const isResolved = (this.activeIncident?.status === 'resolved');

    // Nút đóng và tải file luôn luôn bật
    if (btnBottomClose) btnBottomClose.style.display = 'inline-flex';
    if (btnGoHome) btnGoHome.style.display = 'inline-flex';
    if (btnBottomGoHome) btnBottomGoHome.style.display = 'inline-flex';

    if (btnDocx) {
      btnDocx.disabled = false;
      btnDocx.style.opacity = '1';
      btnDocx.style.cursor = 'pointer';
      btnDocx.title = 'Tải file Word (.docx)';
    }
    if (btnImg) {
      btnImg.disabled = false;
      btnImg.style.opacity = '1';
      btnImg.style.cursor = 'pointer';
      btnImg.title = 'Lưu dưới dạng ảnh PNG';
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
        lockHint.innerHTML = 'ℹ️ Phiếu tiếp nhận đang trong tiến trình xử lý. Quý dân có thể xem hình ảnh, văn bản và đóng cửa sổ bất cứ lúc nào!';
        lockHint.style.color = '#38bdf8';
      }
    } else if (isFullySigned) {
      if (banner) {
        banner.style.background = 'rgba(16, 185, 129, 0.1)';
        banner.style.borderColor = '#10b981';
        banner.style.color = '#047857';
      }
      if (bannerText) {
        bannerText.innerHTML = '<b>✅ VĂN BẢN ĐÃ CÓ ĐẦY ĐỦ HIỆU LỰC PHÁP LÝ:</b> Cả Người dân và Cán bộ trực ban đã hoàn tất ký và điền họ tên.';
      }
      if (legalBadge) {
        legalBadge.textContent = 'ĐÃ CÓ HIỆU LỰC';
        legalBadge.style.background = '#d1fae5';
        legalBadge.style.color = '#059669';
      }
      if (lockHint) {
        lockHint.innerHTML = '🔓 Văn bản đã có hiệu lực. Bạn có thể tải file Word (.docx), file Ảnh (PNG) hoặc Xác nhận hoàn tất để về trang chủ / Đóng cửa sổ!';
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
      if (!citizenSig.signed) missingParts.push('Người dân');
      if (!officerSig.signed) missingParts.push('Cán bộ trực ban');
      const missingStr = missingParts.join(' & ');
      const signedCount = (citizenSig.signed ? 1 : 0) + (officerSig.signed ? 1 : 0);

      if (bannerText) {
        bannerText.innerHTML = `<b>⚠️ VĂN BẢN CHƯA ĐỦ CHỮ KÝ 2 BÊN (${signedCount}/2):</b> Ca sự cố đã hoàn tất. Quý dân và Cán bộ trực ban vui lòng ký tên điện tử bên dưới để hoàn tất hồ sơ pháp lý trước khi đóng!`;
      }
      if (legalBadge) {
        legalBadge.textContent = `CHƯA ĐỦ CHỮ KÝ (${signedCount}/2)`;
        legalBadge.style.background = '#fee2e2';
        legalBadge.style.color = '#dc2626';
      }
      if (lockHint) {
        lockHint.innerHTML = `⚠️ Còn thiếu chữ ký của <b>${missingStr}</b>. Quý dân vui lòng bấm vào <b>✍️ Người Dân Ký Tên</b> và đợi Cán bộ trực ban ký xác nhận để hoàn tất hồ sơ!`;
        lockHint.style.color = '#f87171';
      }
    }
  }


  openSignaturePad(signerRole = 'citizen') {
    if (signerRole !== 'citizen') {
      alert('🔒 THẨM QUYỀN KÝ TÊN:\nPhần chữ ký này dành riêng cho Cán bộ trực ban tiếp nhận xử lý trên hệ thống điều phối tác chiến.\n\nNgười dân không được phép ký thay cho cán bộ. Sau khi Cán bộ ký từ trung tâm chỉ huy, chữ ký sẽ tự động hiển thị và đồng bộ tại đây.');
      return;
    }
    this.currentSignerRole = 'citizen';
    const modal = document.getElementById('signaturePadModal');
    const title = document.getElementById('sigModalTitle');
    const inputName = document.getElementById('inputSigTypedName');
    const typePreview = document.getElementById('sigTypePreview');

    if (title) {
      title.textContent = 'KÝ TÊN ĐIỆN TỬ (NGƯỜI DÂN)';
    }

    const currentName = (signerRole === 'citizen'
      ? (document.getElementById('docSignReporterInput')?.value || document.getElementById('docReporterName')?.value || this.activeIncident?.signatures?.citizen?.name || this.activeIncident?.reporterName)
      : (document.getElementById('docSignOfficerInput')?.value || document.getElementById('docOfficerName')?.value || this.activeIncident?.signatures?.officer?.name || this.activeIncident?.dispatchUnit?.officerName || this.activeIncident?.assignedUnit?.officerName)) || '';

    if (inputName) {
      inputName.value = currentName;
      if (typePreview) typePreview.textContent = currentName || 'Chữ ký mẫu';
    }

    if (modal) {
      modal.classList.add('is-open');
      modal.style.display = 'flex';
      this.initSignatureCanvas();
    }
  }

  isCanvasBlank(canvas) {
    if (!canvas || !canvas.width || !canvas.height) return true;
    try {
      const ctx = canvas.getContext('2d');
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 10) return false; // Alpha channel check
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  applyLocalSignatureToUI(role, signerName, type, signatureData) {
    if (role === 'citizen') {
      const repInput = document.getElementById('docSignReporterInput');
      const repName = document.getElementById('docReporterName');
      if (repInput) repInput.value = signerName;
      if (repName) repName.value = signerName;

      const citizenPlaceholder = document.getElementById('citizenSigPlaceholder');
      const citizenImg = document.getElementById('citizenSigImg');
      const citizenText = document.getElementById('citizenSigText');
      const btnCitizenSign = document.getElementById('btnOpenCitizenSignPad');
      const citizenTime = document.getElementById('docCitizenSignTime');

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
        btnCitizenSign.innerHTML = '🟢 Đã Ký Điện Tử';
        btnCitizenSign.style.background = 'rgba(16, 185, 129, 0.15)';
        btnCitizenSign.style.borderColor = '#10b981';
        btnCitizenSign.style.color = '#059669';
      }
      if (citizenTime) {
        const now = new Date();
        citizenTime.textContent = `Đã ký lúc: ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${now.toLocaleDateString('vi-VN')}`;
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
      const officerTime = document.getElementById('docOfficerSignTime');

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
      if (officerTime) {
        const now = new Date();
        officerTime.textContent = `Đã ký lúc: ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${now.toLocaleDateString('vi-VN')}`;
      }
    }
  }

  initSignatureCanvas() {
    const canvas = document.getElementById('sigCanvas');
    if (!canvas) return;

    // Resize canvas based on client rect with safe fallback
    const rect = canvas.parentElement ? canvas.parentElement.getBoundingClientRect() : null;
    const targetWidth = (rect && rect.width > 50) ? rect.width : (canvas.clientWidth || 440);
    const targetHeight = (rect && rect.height > 50) ? rect.height : (canvas.clientHeight || 160);
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    this.sigIsDrawing = false;
    this.sigHasDrawn = false;
    this.isSigCanvasDrawn = false;

    const getPos = (e) => {
      const r = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - r.left) * (canvas.width / r.width),
        y: (clientY - r.top) * (canvas.height / r.height)
      };
    };

    const startDraw = (e) => {
      e.preventDefault();
      this.sigIsDrawing = true;
      this.sigHasDrawn = true;
      this.isSigCanvasDrawn = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
      if (!this.sigIsDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      this.sigHasDrawn = true;
      this.isSigCanvasDrawn = true;
    };

    const stopDraw = () => {
      this.sigIsDrawing = false;
    };

    canvas.onmousedown = startDraw;
    canvas.onmousemove = draw;
    canvas.onmouseup = stopDraw;
    canvas.onmouseleave = stopDraw;

    canvas.ontouchstart = startDraw;
    canvas.ontouchmove = draw;
    canvas.ontouchend = stopDraw;
  }

  clearSignatureCanvas() {
    const canvas = document.getElementById('sigCanvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      this.sigHasDrawn = false;
      this.isSigCanvasDrawn = false;
    }
  }

  async submitSignature() {
    // Try restoring active incident from session if not in memory
    if (!this.activeIncident) {
      try {
        const saved = sessionStorage.getItem('active_sos_incident');
        if (saved) this.activeIncident = JSON.parse(saved);
      } catch (e) {}
    }

    const role = this.currentSignerRole || 'citizen';
    if (role !== 'citizen') {
      alert('🔒 Người dân chỉ được ký phần xác nhận của mình. Chữ ký cán bộ chỉ do Cán bộ trực ban thực hiện.');
      return;
    }
    const isDrawTab = document.getElementById('tabSigDraw')?.classList.contains('is-active');

    const nameFromPad = (document.getElementById('inputSigTypedName')?.value || '').trim();
    const nameFromDoc = (role === 'citizen'
      ? (document.getElementById('docSignReporterInput')?.value || document.getElementById('docReporterName')?.value || this.activeIncident?.signatures?.citizen?.name || this.activeIncident?.reporterName)
      : (document.getElementById('docSignOfficerInput')?.value || document.getElementById('docOfficerName')?.value || this.activeIncident?.signatures?.officer?.name || this.activeIncident?.dispatchUnit?.officerName || this.activeIncident?.assignedUnit?.officerName)) || '';

    const signerName = nameFromPad || nameFromDoc || (role === 'citizen' ? 'Người dân' : 'Cán bộ trực ban');

    let signatureData = '';
    let type = 'draw';

    if (isDrawTab) {
      const canvas = document.getElementById('sigCanvas');
      const hasDrawn = Boolean(this.sigHasDrawn || this.isSigCanvasDrawn || (canvas && !this.isCanvasBlank(canvas)));
      if (!canvas || !hasDrawn) {
        alert('Vui lòng vẽ nét chữ ký vào khung trắng trước khi xác nhận!');
        return;
      }
      signatureData = canvas.toDataURL('image/png');
      type = 'draw';
    } else {
      if (!nameFromPad) {
        alert('Vui lòng nhập họ và tên chữ ký!');
        return;
      }
      signatureData = nameFromPad;
      type = 'type';
    }

    // 1. Áp dụng ngay lập tức chữ ký lên giao diện văn bản (DOM)
    this.applyLocalSignatureToUI(role, signerName, type, signatureData);

    if (this.activeIncident) {
      if (!this.activeIncident.signatures) this.activeIncident.signatures = {};
      this.activeIncident.signatures[role] = {
        signed: true,
        name: signerName,
        type: type,
        signatureData: signatureData,
        signedAt: new Date().toISOString()
      };
      sessionStorage.setItem('active_sos_incident', JSON.stringify(this.activeIncident));
    }

    // Đóng modal ký tên ngay lập tức
    const sigModal = document.getElementById('signaturePadModal');
    if (sigModal) {
      sigModal.classList.remove('is-open');
      sigModal.style.display = 'none';
    }

    // 2. Đồng bộ chữ ký lên máy chủ
    if (this.activeIncident && this.activeIncident.id) {
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
            ...(role === 'citizen' ? this.citizenAccessHeaders() : {})
          },
          body: JSON.stringify({
            incidentId: this.activeIncident.id,
            signerRole: role,
            name: signerName,
            type: type,
            signatureData: signatureData,
            accessToken: this.citizenAccessToken || ''
          })
        });

        const data = await res.json();
        if (data && data.ok) {
          this.activeIncident.signatures = data.signatures;
          sessionStorage.setItem('active_sos_incident', JSON.stringify(this.activeIncident));
          this.updateSignatureUI(this.activeIncident);

          if (data.isFullySigned) {
            alert('🎉 Chúc mừng! Cả 2 bên đã hoàn tất ký tên. Văn bản đã có hiệu lực pháp lý và được phép tải về máy!');
          } else {
            alert(`✅ Đã lưu và đồng bộ chữ ký của ${role === 'citizen' ? 'Người dân' : 'Cán bộ'} thành công!`);
          }
        } else {
          console.warn('Server sign response not ok:', data);
          alert('✅ Đã lưu chữ ký vào văn bản! (Máy chủ: ' + (data?.error || 'Đã lưu cục bộ') + ')');
        }
      } catch (e) {
        console.error('Sign sync error:', e);
        alert('✅ Đã lưu chữ ký vào văn bản xem trước.');
      } finally {
        const btn = document.getElementById('btnSubmitSignature');
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<svg class="svg-ico ico-md ico-white" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> XÁC NHẬN KÝ TÊN VÀ ĐỒNG BỘ LÊN VĂN BẢN';
        }
      }
    } else {
      alert('✅ Đã lưu chữ ký vào văn bản xem trước thành công!');
    }
  }

  async downloadReportDocx() {
    if (!this.activeIncident) return;
    if (!this.activeIncident.signatures?.isFullySigned) {
      alert('⚠️ Văn bản chưa đủ chữ ký 2 bên (Người dân & Cán bộ). Vui lòng hoàn tất ký tên để văn bản có hiệu lực trước khi tải!');
      return;
    }

    const btn = document.getElementById('btnDownloadReportDocx');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Đang tạo file Word...';
    }

    const agency = this.activeIncident.agency || 'police';
    const unitNameVal = agency === 'police'
      ? document.getElementById('docUnitPoliceLabel')?.textContent
      : (agency === 'csgt'
        ? document.getElementById('docUnitCsgtLabel')?.textContent
        : (agency === 'fire'
          ? document.getElementById('docUnitFireLabel')?.textContent
          : (agency === 'hospital' || agency === 'ambulance'
            ? document.getElementById('docUnitHospitalLabel')?.textContent
            : document.getElementById('docUnitRescueLabel')?.textContent)));

    const payload = {
      incidentId: this.stripEmojis(this.activeIncident.id),
      incidentTime: this.stripEmojis(document.getElementById('docIncidentTime')?.textContent || ''),
      officerName: this.stripEmojis(document.getElementById('docOfficerName')?.value || ''),
      officerTitle: this.activeIncident.assignedUnit?.officerRank || 'Cán bộ trực ban',
      unitName: this.stripEmojis(unitNameVal || ''),
      unitAddress: this.stripEmojis(document.getElementById('docUnitAddress')?.value || ''),
      unitPhone: this.stripEmojis(document.getElementById('docUnitPhone')?.value || ''),
      unitSms: this.stripEmojis(document.getElementById('docUnitSms')?.value || ''),
      agency: agency,
      ward: this.activeIncident.jurisdiction?.ward || '',
      province: this.activeIncident.jurisdiction?.province || '',
      reporterName: this.stripEmojis(document.getElementById('docReporterName')?.value || ''),
      reporterPhone: this.stripEmojis(document.getElementById('docReporterPhone')?.value || ''),
      targetType: document.querySelector('input[name="docTargetType"]:checked')?.value || 'Người dân',
      incidentAddress: this.stripEmojis(document.getElementById('docIncidentAddress')?.value || ''),
      lat: (this.activeIncident.lat || 0).toFixed(5),
      lng: (this.activeIncident.lng || 0).toFixed(5),
      gmapsUrl: `https://www.google.com/maps/search/?api=1&query=${this.activeIncident.lat},${this.activeIncident.lng}`,
      incidentTags: this.stripEmojis(this.activeIncident.incidentTags?.join(', ') || ''),
      incidentDescription: this.stripEmojis(document.getElementById('docIncidentDescription')?.value || ''),
      helpRequest: this.stripEmojis(document.getElementById('docHelpRequest')?.value || ''),
      adviceGiven: this.stripEmojis(document.getElementById('docAdviceGiven')?.value || ''),
      resolutionResult: this.stripEmojis(document.getElementById('docResolutionResult')?.value || ''),
      citizenSignature: {
        ...(this.activeIncident.signatures?.citizen || {}),
        name: this.stripEmojis(document.getElementById('docSignReporterInput')?.value || this.activeIncident.signatures?.citizen?.name || '')
      },
      officerSignature: {
        ...(this.activeIncident.signatures?.officer || {}),
        name: this.stripEmojis(document.getElementById('docSignOfficerInput')?.value || this.activeIncident.signatures?.officer?.name || '')
      },
      media: Array.isArray(this.activeIncident.media) ? this.activeIncident.media : []
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
        a.download = `Phieu_TiepNhan_UPSC_${this.activeIncident.id}.docx`;
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
    if (!this.activeIncident) return;
    if (!this.activeIncident.signatures?.isFullySigned) {
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
    const citizenSig = this.activeIncident.signatures?.citizen || {};
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
    const officerSig = this.activeIncident.signatures?.officer || {};
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
    const btnCitizenView = document.getElementById('btnCitizenViewReportDocx');
    const btnDocx = document.getElementById('btnDownloadReportDocx');
    const btnImg = document.getElementById('btnDownloadReportImage');
    const btnPrint = document.getElementById('btnPrintReportPdf');
    const btnClose = document.getElementById('btnCloseReportDocxModal');
    const btnBottomClose = document.getElementById('btnBottomCloseReportDocx');

    // Signature Triggers
    const btnCitizenSign = document.getElementById('btnOpenCitizenSignPad');
    const btnOfficerSign = document.getElementById('btnOpenOfficerSignPad');
    const btnCloseSig = document.getElementById('btnCloseSigPadModal');
    const btnSubmitSig = document.getElementById('btnSubmitSignature');
    const btnClearCanvas = document.getElementById('btnClearSigCanvas');

    // Return to Home Prompt Triggers
    const btnConfirmGoHome = document.getElementById('btnConfirmResolvedGoHome');
    const btnStayReview = document.getElementById('btnStayAndReviewReport');
    const btnGoHome = document.getElementById('btnReportModalGoHome');
    const btnBottomGoHome = document.getElementById('btnBottomConfirmResolvedGoHome');

    const handleReturnHome = () => {
      if (!this.activeIncident?.signatures?.isFullySigned) {
        alert('⚠️ Quý dân vui lòng hoàn tất ký tên vào biên bản để xác nhận ca sự cố đã được xử lý xong trước khi về trang chủ!');
        return;
      }
      sessionStorage.removeItem('active_sos_incident');
      this.clearCitizenAccessToken();
      window.location.href = '/';
    };

    if (btnGoHome) btnGoHome.addEventListener('click', handleReturnHome);
    if (btnBottomGoHome) btnBottomGoHome.addEventListener('click', handleReturnHome);

    if (btnConfirmGoHome) {
      btnConfirmGoHome.addEventListener('click', () => {
        if (!this.activeIncident?.signatures?.isFullySigned) {
          alert('⚠️ Quý dân vui lòng ký xác nhận phiếu tiếp nhận trước khi quay về trang chủ!');
          const promptModal = document.getElementById('incidentResolvedPromptModal');
          if (promptModal) {
            promptModal.classList.remove('is-open');
            promptModal.style.display = 'none';
          }
          if (this.activeIncident) this.openReportModal(this.activeIncident);
          return;
        }
        sessionStorage.removeItem('active_sos_incident');
        this.clearCitizenAccessToken();
        window.location.href = '/';
      });
    }

    if (btnStayReview) {
      btnStayReview.addEventListener('click', () => {
        const promptModal = document.getElementById('incidentResolvedPromptModal');
        if (promptModal) {
          promptModal.classList.remove('is-open');
          promptModal.style.display = 'none';
        }
        if (this.activeIncident) this.openReportModal(this.activeIncident);
      });
    }

    if (btnCitizenView) {
      btnCitizenView.addEventListener('click', () => {
        if (this.activeIncident) {
          this.openReportModal(this.activeIncident);
        } else {
          alert('Chưa có thông tin sự cố để hiển thị phiếu.');
        }
      });
    }

    if (btnCitizenSign) btnCitizenSign.addEventListener('click', () => this.openSignaturePad('citizen'));
    if (btnOfficerSign) {
      btnOfficerSign.addEventListener('click', () => {
        const inc = this.activeIncident;
        if (inc?.signatures?.officer?.signed) {
          alert(`✅ Cán bộ trực ban (${inc.signatures.officer.name || 'Trực ban'}) đã ký xác thực điện tử cho hồ sơ này.`);
        } else {
          alert('🔒 THẨM QUYỀN KÝ TÊN:\nPhần chữ ký này dành riêng cho Cán bộ trực ban tiếp nhận xử lý trên hệ thống điều phối tác chiến.\n\nNgười dân không được phép ký thay cho cán bộ. Sau khi Cán bộ ký từ trung tâm chỉ huy, chữ ký sẽ tự động hiển thị tại đây.');
        }
      });
    }
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

    const closeFn = () => {
      const modal = document.getElementById('incidentReportDocxModal');
      if (!modal) return;

      const inc = this.activeIncident;
      if (inc && inc.status === 'resolved') {
        const citizenSigned = Boolean(inc.signatures?.citizen?.signed);
        const officerSigned = Boolean(inc.signatures?.officer?.signed);
        const isFullySigned = citizenSigned && officerSigned;

        if (!isFullySigned) {
          alert(`⚠️ CHƯA ĐỦ CHỮ KÝ 2 BÊN THEO QUY ĐỊNH!\n\nCa sự cố #${inc.id} đã được xử lý xong. Theo quy định pháp lý, biên bản tiếp nhận phải có đầy đủ chữ ký của cả Quý dân và Cán bộ trực ban trước khi đóng hồ sơ:\n\n- Chữ ký Quý dân: ${citizenSigned ? '✅ ĐÃ KÝ' : '❌ CHƯA KÝ'}\n- Chữ ký Cán bộ: ${officerSigned ? '✅ ĐÃ KÝ' : '❌ CHƯA KÝ'}\n\nQuý dân vui lòng bấm '✍️ Người Dân Ký Tên' và đợi Cán bộ trực ban ký xác nhận để hoàn tất hồ sơ!`);
          return;
        }
      }

      modal.classList.remove('is-open');
      modal.style.display = 'none';
      modal.style.setProperty('display', 'none', 'important');
    };
    if (btnClose) btnClose.addEventListener('click', closeFn);
    if (btnBottomClose) btnBottomClose.addEventListener('click', closeFn);
  }


  playMessageTing() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      // Elegant crystal dual-tone chime (E6 -> A6)
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1318.5, now); // E6
      osc1.frequency.exponentialRampToValueAtTime(1760.0, now + 0.12); // A6

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(2637.0, now); // E7 harmonic
      osc2.frequency.exponentialRampToValueAtTime(3520.0, now + 0.12);

      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.35, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } catch (e) {
      console.warn('Cannot play message ting audio on citizen app:', e);
    }
  }

  appendChatMessage(msg) {
    if (!this.chatMessages || !msg) return;
    const bubble = document.createElement('div');
    const isCitizen = msg.sender === 'citizen';
    const isDispatcher = msg.sender === 'dispatcher';
    
    bubble.className = `chat-bubble ${msg.sender || 'system'}`;
    const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
    const icon = isCitizen ? '👤' : (isDispatcher ? '🛡️' : 'ℹ️');
    const senderTitle = msg.senderName || (isCitizen ? 'Người dân cần hỗ trợ' : 'Trực ban điều phối');

    if (msg.sender === 'system') {
      const content = document.createElement('div');
      content.textContent = String(msg.text || '');
      bubble.appendChild(content);
    } else {
      const header = document.createElement('div');
      header.className = 'chat-bubble-header';
      const sender = document.createElement('span');
      sender.textContent = `${icon} ${senderTitle}`;
      const time = document.createElement('span');
      time.className = 'chat-bubble-time';
      time.textContent = timeStr;
      header.append(sender, time);
      const content = document.createElement('div');
      content.style.cssText = 'font-size: 13px; line-height: 1.45;';
      content.textContent = String(msg.text || '');
      bubble.append(header, content);
    }
    this.chatMessages.appendChild(bubble);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  async sendChatMessage() {
    if (this.activeIncident && this.activeIncident.status === 'resolved') {
      alert('Phiếu cứu hộ đã hoàn tất. Cuộc trò chuyện đã kết thúc và được lưu trữ.');
      return;
    }
    const text = this.inputChatText.value.trim();
    if (!text || !this.activeIncident) return;

    this.inputChatText.value = '';
    try {
      await fetch('/api/sos/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.citizenAccessHeaders() },
        body: JSON.stringify({
          incidentId: this.activeIncident.id,
          sender: 'citizen',
          senderName: this.activeIncident.reporterName,
          text: text
        })
      });
    } catch (e) {
      console.error('Error sending message:', e);
    }
  }

  speakSosPrompt() {
    try {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel(); // Hủy các lời đọc trước đó nếu có

      let voiceConfig = { voiceType: 'female-south', rate: 1.0, pitch: 1.25 };
      try {
        const saved = localStorage.getItem('sos_voice_config');
        if (saved) voiceConfig = { ...voiceConfig, ...JSON.parse(saved) };
      } catch (e) {}

      const promptText = "Hãy cho tôi biết sự cố bạn đang gặp phải? Bằng cách chọn các đơn vị mà bạn muốn báo!";
      const utterance = new SpeechSynthesisUtterance(promptText);
      utterance.lang = 'vi-VN';
      utterance.rate = voiceConfig.rate || 1.0;
      utterance.pitch = voiceConfig.pitch || (voiceConfig.voiceType?.startsWith('female') ? 1.25 : 0.95);
      utterance.volume = 1.0;

      const setVoiceAndSpeak = () => {
        const voices = window.speechSynthesis.getVoices() || [];
        if (voices && voices.length > 0) {
          const viVoices = voices.filter(v => 
            v.lang.startsWith('vi') || v.lang.includes('VIE') || v.lang.includes('vi_VN') || v.lang.includes('vi-VN')
          );

          let matched = null;
          const vType = voiceConfig.voiceType || 'female-south';
          if (vType === 'female-south') {
            matched = viVoices.find(v => {
              const n = v.name.toLowerCase();
              return n.includes('south') || n.includes('miền nam') || n.includes('nam') || n.includes('hoaimy') || n.includes('linh') || n.includes('an') || n.includes('female') || n.includes('nữ');
            }) || viVoices.find(v => v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('vietnam')) || viVoices[0];
          } else if (vType === 'male-south') {
            matched = viVoices.find(v => {
              const n = v.name.toLowerCase();
              return n.includes('male') || n.includes('nam') || n.includes('namminh') || n.includes('minh') || n.includes('trai');
            }) || viVoices[0];
          } else if (vType === 'female-north') {
            matched = viVoices.find(v => {
              const n = v.name.toLowerCase();
              return n.includes('north') || n.includes('bắc') || n.includes('hanoi') || n.includes('hoaimy') || n.includes('female');
            }) || viVoices[0];
          } else if (vType === 'male-north') {
            matched = viVoices.find(v => {
              const n = v.name.toLowerCase();
              return n.includes('namminh') || n.includes('north') || n.includes('bắc') || n.includes('hanoi') || n.includes('male');
            }) || viVoices[0];
          }

          if (matched) utterance.voice = matched;
        }
        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          setVoiceAndSpeak();
          window.speechSynthesis.onvoiceschanged = null;
        };
      } else {
        setVoiceAndSpeak();
      }
    } catch (err) {
      console.warn('Voice AI synthesis error:', err);
    }
  }

  bindLegalWarningToggle() {
    const card = document.getElementById('legalWarningHero');
    if (!card) return;
    const toggle = () => {
      const isExpanded = card.classList.toggle('expanded');
      card.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    };
    card.addEventListener('click', (e) => {
      // Toggle when clicking header or toggle button or when collapsed
      if (e.target.closest('#legalCardHeader') || e.target.closest('#btnToggleLegal') || !card.classList.contains('expanded')) {
        toggle();
      }
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  }

  playSiren() {
    this.speakSosPrompt();
  }
}

// Bootstrap
function bootstrapApp() {
  if (window.app || window.sosApp) return;
  const app = new SOSApp();
  window.app = window.sosApp = app;
  app.bindReportDocxEvents();
  app.bindLegalWarningToggle();
  bindCitizenSafeButton(app);
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
  bootstrapApp();
}

// -----------------------------------------------------------------
// Người dân xác nhận đã an toàn -> kết thúc ca cứu hộ đang theo dõi
// -----------------------------------------------------------------
function bindCitizenSafeButton(app) {
  const btn = document.getElementById('btnCitizenSafe');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const incident = app.activeIncident;
    if (!incident || !incident.id) {
      alert('Chưa có ca cứu hộ nào đang theo dõi.');
      return;
    }
    if (!confirm('Bạn xác nhận đã AN TOÀN và muốn kết thúc ca cứu hộ này?\n\nTrực ban sẽ được thông báo ngay lập tức.')) return;
    btn.disabled = true;
    const label = btn.innerHTML;
    btn.innerHTML = 'Đang gửi xác nhận an toàn...';
    try {
      const res = await fetch('/api/sos/citizen-safe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sos-access-token': app.citizenAccessToken || ''
        },
        body: JSON.stringify({
          incidentId: incident.id,
          accessToken: app.citizenAccessToken,
          sender: 'citizen'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Không gửi được xác nhận an toàn');
      btn.innerHTML = '✅ Đã ghi nhận bạn an toàn';
      alert('✅ Đã ghi nhận bạn an toàn. Ca cứu hộ đã được kết thúc và lưu vào lịch sử.');
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = label;
      alert('Lỗi: ' + (err && err.message ? err.message : err));
    }
  });
}
