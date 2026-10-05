// Reusable Playwright check (per AGENTS.md: scripts under playwright/ must be
// reusable, not one-off temp files) for the P2 real WebRTC voice call fix.
//
// Drives a real citizen SOS submission and a real dispatcher login (two
// separate browser contexts, matching two real people), has the dispatcher
// call the citizen, has the citizen accept, and measures - via Web Audio
// AnalyserNode on each side's remote <audio> element - that real,
// non-silent audio is actually received in both directions. Each context's
// microphone is a synthetic Chromium fake-audio-capture device producing an
// audible tone (via --use-fake-device-for-media-stream), standing in for a
// real human voice.
//
// Usage:
//   node playwright/verify-webrtc-voice-call-two-way-audio.cjs [baseUrl] [dispatcherUsername] [dispatcherPassword]

const { chromium } = require('playwright');

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const DISPATCHER_USER = process.argv[3] || 'admin';
const DISPATCHER_PASS = process.argv[4] || '2002';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function measureRemoteAudioLevel(page, audioElId, waitMs = 2500) {
  return page.evaluate(async ({ audioElId, waitMs }) => {
    const el = document.getElementById(audioElId);
    if (!el || !el.srcObject) return { hasStream: false, level: 0 };
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = ctx.createMediaStreamSource(el.srcObject);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    src.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let maxLevel = 0;
    const end = Date.now() + waitMs;
    while (Date.now() < end) {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      if (avg > maxLevel) maxLevel = avg;
      await new Promise(r => setTimeout(r, 100));
    }
    await ctx.close();
    return { hasStream: true, level: maxLevel };
  }, { audioElId, waitMs });
}

(async () => {
  const browser = await chromium.launch({
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']
  });

  const citizenCtx = await browser.newContext({ userAgent: UA, permissions: ['microphone'] });
  const citizenPage = await citizenCtx.newPage();
  const dispatcherCtx = await browser.newContext({ userAgent: UA, permissions: ['microphone'] });
  const dispatcherPage = await dispatcherCtx.newPage();
  citizenPage.on('pageerror', e => console.log('[citizen pageerror]', e));
  dispatcherPage.on('pageerror', e => console.log('[dispatcher pageerror]', e));
  if (process.env.DEBUG_WEBRTC_TEST) {
    const filter = t => !t.includes('console.clear') && !t.includes('GL Driver Message');
    citizenPage.on('console', m => { if (filter(m.text())) console.log('[citizen]', m.text()); });
    dispatcherPage.on('console', m => { if (filter(m.text())) console.log('[dispatcher]', m.text()); });
  }

  try {
    // --- Citizen: submit a real SOS ---
    await citizenPage.goto(BASE_URL, { waitUntil: 'networkidle' });
    await citizenPage.locator('#btnMasterSOS').click({ force: true });
    await citizenPage.waitForSelector('#sosDetailModal.is-open', { timeout: 10000 });
    await citizenPage.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => /XÁC NHẬN PHÁT TÍN HIỆU/.test(b.textContent));
      btn.click();
    });
    await citizenPage.waitForFunction(() => {
      const inc = window.app && window.app.activeIncident;
      return !!(inc && (inc.dispatchUnit || inc.assignedUnit));
    }, { timeout: 15000 });
    const incidentId = await citizenPage.evaluate(() => window.app.activeIncident.id);

    // --- Dispatcher: bypass the pre-login Cyber Defense Gatekeeper screen,
    // pick the "CÔNG AN" force-selection orb to reveal the login form, then
    // log in ---
    await dispatcherPage.addInitScript(() => {
      sessionStorage.setItem('sos_gatekeeper_pass', 'true');
    });
    await dispatcherPage.goto(BASE_URL + '/dispatcher.html', { waitUntil: 'networkidle' });
    await dispatcherPage.getByText('CÔNG AN', { exact: true }).click({ force: true }).catch(() => {});
    await dispatcherPage.waitForSelector('#loginUsername', { state: 'visible', timeout: 10000 });
    await dispatcherPage.fill('#loginUsername', DISPATCHER_USER).catch(() => {});
    await dispatcherPage.fill('#loginPassword', DISPATCHER_PASS).catch(() => {});
    const loginBtn = dispatcherPage.locator('button:has-text("ĐĂNG NHẬP")').first();
    if (await loginBtn.count() > 0) await loginBtn.click({ force: true }).catch(() => {});
    await dispatcherPage.waitForTimeout(2000);

    // Directly call the dispatcher-side function for this incident (avoids
    // depending on exact incident-list DOM structure/selectors, which is not
    // the thing P2-C is proving - the WebRTC wiring is).
    await dispatcherPage.waitForFunction(() => !!(window.dispatcherApp || window.app), { timeout: 10000 });
    await dispatcherPage.evaluate((incId) => {
      const d = window.dispatcherApp || window.app;
      d.selectedIncidentId = incId;
      d.openDispatcherVoiceCall(incId, false);
    }, incidentId);

    await dispatcherPage.waitForFunction(() => {
      const d = window.dispatcherApp || window.app;
      return !!(d.dispatcherVoicePeerConnection && d.dispatcherVoicePeerConnection.localDescription);
    }, { timeout: 10000 });

    // --- Citizen: receive the incoming call, accept it ---
    await citizenPage.waitForFunction(() => {
      const modal = document.getElementById('videoCallCitizenRequestModal');
      return modal && modal.classList.contains('is-open');
    }, { timeout: 10000 });
    await citizenPage.evaluate(() => {
      document.getElementById('btnAcceptCitizenCall').click();
    });

    // Let both sides exchange SDP/ICE and connect.
    await citizenPage.waitForTimeout(3000);
    await dispatcherPage.waitForTimeout(1000);

    const citizenPcState = await citizenPage.evaluate(() => window.app.citizenVoicePeerConnection
      ? window.app.citizenVoicePeerConnection.iceConnectionState : 'none');
    const dispatcherPcState = await dispatcherPage.evaluate(() => {
      const d = window.dispatcherApp || window.app;
      return d.dispatcherVoicePeerConnection ? d.dispatcherVoicePeerConnection.iceConnectionState : 'none';
    });

    console.log('citizen ICE state:', citizenPcState, '| dispatcher ICE state:', dispatcherPcState);

    const citizenHearsAudio = await measureRemoteAudioLevel(citizenPage, 'citizenRemoteVoiceAudio');
    const dispatcherHearsAudio = await measureRemoteAudioLevel(dispatcherPage, 'dispatcherRemoteVoiceAudio');

    console.log('citizen remote-audio measurement:', JSON.stringify(citizenHearsAudio));
    console.log('dispatcher remote-audio measurement:', JSON.stringify(dispatcherHearsAudio));

    const failures = [];
    if (!['connected', 'completed'].includes(citizenPcState)) failures.push(`citizen ICE state not connected: ${citizenPcState}`);
    if (!['connected', 'completed'].includes(dispatcherPcState)) failures.push(`dispatcher ICE state not connected: ${dispatcherPcState}`);
    if (!citizenHearsAudio.hasStream) failures.push('citizen remote-audio element has no stream bound');
    if (!dispatcherHearsAudio.hasStream) failures.push('dispatcher remote-audio element has no stream bound');
    if (citizenHearsAudio.level <= 0) failures.push('citizen measured zero audio level from dispatcher');
    if (dispatcherHearsAudio.level <= 0) failures.push('dispatcher measured zero audio level from citizen');

    if (failures.length > 0) {
      console.error('FAIL:', failures.join('; '));
      process.exit(1);
    }
    console.log('PASS: real two-way WebRTC audio confirmed - both sides connected and received non-silent remote audio.');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error('ERROR:', e); process.exit(1); });
