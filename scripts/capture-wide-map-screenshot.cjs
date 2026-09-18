const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    locale: 'vi-VN'
  });
  const page = await context.newPage();

  console.log('Navigating to dispatcher...');
  await page.goto('http://127.0.0.1:3000/dispatcher.html', { waitUntil: 'networkidle' });

  // Authenticate as Admin / Can Tho Police Dispatcher
  await page.evaluate(() => {
    document.body.classList.add('officer-authenticated');
    document.body.classList.add('tac-three-zone');
    ['cyberIntroVideoOverlay', 'cyberGatekeeperModal', 'authGateModal', 'cosmicPortalView', 'modalDutyShift']
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });

    const adminProfile = {
      username: 'admin',
      fullName: 'Điền Trần Vĩnh An',
      role: 'admin',
      agency: 'police',
      agencyName: 'Công An TP Cần Thơ',
      province: 'Cần Thơ',
      level: 'city',
      token: 'test-admin-token'
    };
    sessionStorage.setItem('sos_token', 'test-token');
    sessionStorage.setItem('sos_user', JSON.stringify(adminProfile));
    sessionStorage.setItem('SOS_GATEKEEPER_TOKEN', 'gk-ok');

    if (window.dispatcher) {
      window.dispatcher.currentOfficer = adminProfile;
      try { window.dispatcher.loadIncidents(); } catch (_) {}
    }
  });

  await page.waitForTimeout(1500);

  // Trigger map resize so map tiles fill the wide container
  await page.evaluate(() => {
    if (window.dispatcher?.mapController?.map) {
      window.dispatcher.mapController.map.resize();
    }
  });

  await page.waitForTimeout(2000);

  const outPath = path.join(__dirname, '../Reports/qa/playwright/evidence-c4isr-3zone-complete.png');
  await page.screenshot({ path: outPath });
  console.log('Saved wide map screenshot to:', outPath);

  // Also capture citizen PWA home with Master SOS Orb
  const citizenContext = await browser.newContext({
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
    isMobile: true,
    hasTouch: true
  });
  const citizenPage = await citizenContext.newPage();
  await citizenPage.goto('http://127.0.0.1:3000/index.html', { waitUntil: 'networkidle' });
  await citizenPage.waitForTimeout(2000);
  const citizenOutPath = path.join(__dirname, '../Reports/qa/playwright/citizen_home_orb.png');
  await citizenPage.screenshot({ path: citizenOutPath });
  console.log('Saved citizen home screenshot to:', citizenOutPath);

  await browser.close();
  console.log('All screenshots captured successfully!');
})();
