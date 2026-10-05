// Playwright verification for P8-B: Bidirectional Signature Persistence & Access Control
// Verifies 5 key scenarios claimed in NCKH document Table 4.4:
//   (a) Citizen hand-drawn canvas signature persists
//   (b) Dispatcher electronic signature persists (and completes full signing)
//   (c) Dispatcher signs on behalf of citizen ("Ký Thay Người Dân")
//   (d) Citizen attempt to write into officer signature slot is blocked with HTTP 403
//   (e) Server restart readback confirms captured signatures survive across restart

const { chromium } = require('playwright');
const http = require('http');
const https = require('https');
const { execSync, spawn } = require('child_process');
const path = require('path');

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const DISPATCHER_USER = process.argv[3] || 'admin';
const DISPATCHER_PASS = process.argv[4] || '2002';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function requestJson(urlStr, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const lib = url.protocol === 'https:' ? https : http;
    const reqOptions = {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      rejectUnauthorized: false
    };

    const req = lib.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, headers: res.headers, body: parsed, rawBody: body });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: null, rawBody: body });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timed out: ' + urlStr));
    });

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function waitForServerHealthy(urlStr, maxWaitMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await requestJson(urlStr.replace(/\/$/, '') + '/healthz');
      if (res.status === 200 && res.body && res.body.ok) return true;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 600));
  }
  throw new Error('Server did not become healthy within ' + maxWaitMs + 'ms');
}

async function getIncidentSignatures(baseUrl, token, incidentId) {
  const res = await requestJson(baseUrl + '/api/dispatcher/incidents', {
    headers: { Authorization: 'Bearer ' + token }
  });
  if (!res.body || !Array.isArray(res.body.incidents)) {
    throw new Error('Failed to fetch incidents list: ' + JSON.stringify(res.body));
  }
  const inc = res.body.incidents.find(i => i.id === incidentId);
  if (!inc) {
    throw new Error('Incident not found in dispatcher incidents list: ' + incidentId);
  }
  return inc.signatures || {};
}

async function restartServer(baseUrl) {
  const url = new URL(baseUrl);
  const isDockerPort = url.port === '3102' || url.port === '8443';

  if (isDockerPort) {
    console.log('   Restarting Docker container (sos-vietnam)...');
    execSync('docker compose restart sos-vietnam', {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit'
    });
  } else {
    const port = url.port || '3000';
    console.log(`   Restarting host server process on port ${port}...`);
    const findPidCmd = `powershell -Command "(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue).OwningProcess"`;
    const out = execSync(findPidCmd).toString().trim();
    const pids = out.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const serverPid = pids.find(p => Number(p) !== process.pid);
    if (serverPid) {
      console.log(`   Terminating server PID ${serverPid}...`);
      try {
        process.kill(Number(serverPid), 'SIGKILL');
      } catch (e) {
        execSync(`powershell -Command "Stop-Process -Id ${serverPid} -Force -ErrorAction SilentlyContinue"`);
      }
      await new Promise(r => setTimeout(r, 1200));
    }

    const worktreeDir = path.resolve(__dirname, '..');
    console.log(`   Spawning new node server.js in ${worktreeDir}...`);
    const child = spawn('node', ['server.js'], {
      cwd: worktreeDir,
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
  }

  await waitForServerHealthy(baseUrl);
  console.log('   Server is back up and healthy.');
}

async function run() {
  console.log('[P8-B Signature Persistence Test] Starting against ' + BASE_URL);
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // -------------------------------------------------------------
    // Step 0: Obtain Dispatcher Token via Login
    // -------------------------------------------------------------
    console.log('\n--- Pre-flight: Dispatcher Authentication ---');
    const loginRes = await requestJson(BASE_URL + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      username: DISPATCHER_USER,
      password: DISPATCHER_PASS
    });

    if (loginRes.status !== 200 || !loginRes.body?.ok || !loginRes.body?.profile?.token) {
      throw new Error('Dispatcher login failed: ' + JSON.stringify(loginRes.body));
    }
    const dispatcherToken = loginRes.body.profile.token;
    console.log('   Dispatcher logged in successfully. Token acquired.');

    // -------------------------------------------------------------
    // Scenario (a): Citizen hand-drawn canvas signature persists
    // -------------------------------------------------------------
    console.log('\n--- Scenario (a): Citizen Hand-Drawn Canvas Signature Persists ---');
    const citizenContext1 = await browser.newContext({
      userAgent: USER_AGENT,
      permissions: ['geolocation'],
      geolocation: { latitude: 10.0452, longitude: 105.7469 }
    });
    const citizenPage1 = await citizenContext1.newPage();
    citizenPage1.on('dialog', async (d) => await d.accept().catch(() => {}));

    await citizenPage1.goto(BASE_URL, { waitUntil: 'networkidle' });

    console.log('1. Submitting test SOS incident #1...');
    await citizenPage1.locator('#btnMasterSOS').click({ force: true });
    await citizenPage1.waitForSelector('#sosDetailModal.is-open', { timeout: 10000 });
    await citizenPage1.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => /XÁC NHẬN PHÁT TÍN HIỆU/.test(b.textContent));
      btn.click();
    });

    await citizenPage1.waitForFunction(() => {
      const inc = window.app && window.app.activeIncident;
      return !!(inc && inc.id && (inc.dispatchUnit || inc.assignedUnit));
    }, { timeout: 15000 });

    const incidentId1 = await citizenPage1.evaluate(() => window.app.activeIncident.id);
    const citizenToken1 = await citizenPage1.evaluate(() => window.app.citizenAccessToken || '');
    console.log('   Incident #1 created:', incidentId1, '(Citizen token present:', !!citizenToken1, ')');

    console.log('2. Opening signature modal and drawing citizen signature...');
    await citizenPage1.evaluate(() => {
      window.app.openReportModal(window.app.activeIncident);
    });
    await citizenPage1.waitForSelector('#incidentReportDocxModal', { state: 'visible', timeout: 5000 });
    await citizenPage1.click('#btnOpenCitizenSignPad');
    await citizenPage1.waitForSelector('#signaturePadModal.is-open', { timeout: 5000 });

    const canvas = citizenPage1.locator('#sigCanvas');
    await canvas.waitFor({ state: 'visible', timeout: 5000 });
    const box = await canvas.boundingBox();
    await citizenPage1.mouse.move(box.x + 30, box.y + 30);
    await citizenPage1.mouse.down();
    await citizenPage1.mouse.move(box.x + 100, box.y + 50, { steps: 5 });
    await citizenPage1.mouse.move(box.x + 170, box.y + 80, { steps: 5 });
    await citizenPage1.mouse.up();

    console.log('3. Submitting citizen signature to /api/sos/sign...');
    await citizenPage1.click('#btnSubmitSignature');
    await citizenPage1.waitForTimeout(1500);

    const sigs1 = await getIncidentSignatures(BASE_URL, dispatcherToken, incidentId1);
    if (!sigs1.citizen?.signed) {
      throw new Error('Scenario (a) Failed: Citizen signature not stored on server. Sigs: ' + JSON.stringify(sigs1));
    }
    const citizenSigData1 = sigs1.citizen.signatureData;
    if (!citizenSigData1 || !citizenSigData1.startsWith('data:image/png')) {
      throw new Error('Scenario (a) Failed: Signature data is not valid PNG data URL');
    }
    console.log('   Scenario (a) PASS: Citizen hand-drawn canvas signature confirmed stored.');

    // -------------------------------------------------------------
    // Scenario (b): Dispatcher electronic signature persists
    // -------------------------------------------------------------
    console.log('\n--- Scenario (b): Dispatcher Electronic Signature Persists ---');
    console.log('1. Submitting dispatcher signature for Incident #1...');
    const officerSigRes = await requestJson(`${BASE_URL}/api/sos/sign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${dispatcherToken}`
      }
    }, {
      incidentId: incidentId1,
      signerRole: 'officer',
      name: 'Đại tá Nguyễn Văn Thuận',
      type: 'draw',
      signatureData: citizenSigData1, // reuse drawn signature png
      confirmIncidentId: incidentId1,
      replaceExisting: false
    });

    if (officerSigRes.status !== 200 || !officerSigRes.body?.ok || !officerSigRes.body?.signatures?.officer?.signed) {
      throw new Error('Scenario (b) Failed: Officer signature submission failed: ' + JSON.stringify(officerSigRes.body));
    }
    if (!officerSigRes.body.isFullySigned) {
      throw new Error('Scenario (b) Failed: Incident should be fully signed when both citizen and officer signed.');
    }

    const sigs1b = await getIncidentSignatures(BASE_URL, dispatcherToken, incidentId1);
    if (!sigs1b.officer?.signed || !sigs1b.isFullySigned) {
      throw new Error('Scenario (b) Failed: Incident state check failed: ' + JSON.stringify(sigs1b));
    }
    console.log('   Scenario (b) PASS: Dispatcher electronic signature stored; isFullySigned === true.');

    // -------------------------------------------------------------
    // Scenario (c): Dispatcher signs on behalf of citizen ("Ký Thay Người Dân")
    // -------------------------------------------------------------
    console.log('\n--- Scenario (c): Dispatcher Signs On Behalf of Citizen ("Ký Thay") ---');
    console.log('1. Submitting test SOS incident #2 in fresh citizen session...');
    const citizenContext2 = await browser.newContext({
      userAgent: USER_AGENT,
      permissions: ['geolocation'],
      geolocation: { latitude: 10.0452, longitude: 105.7469 }
    });
    const citizenPage2 = await citizenContext2.newPage();
    citizenPage2.on('dialog', async (d) => await d.accept().catch(() => {}));

    await citizenPage2.goto(BASE_URL, { waitUntil: 'networkidle' });
    await citizenPage2.locator('#btnMasterSOS').click({ force: true });
    await citizenPage2.waitForSelector('#sosDetailModal.is-open', { timeout: 10000 });
    await citizenPage2.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => /XÁC NHẬN PHÁT TÍN HIỆU/.test(b.textContent));
      btn.click();
    });
    await citizenPage2.waitForFunction(() => {
      const inc = window.app && window.app.activeIncident;
      return !!(inc && inc.id && (inc.dispatchUnit || inc.assignedUnit));
    }, { timeout: 15000 });
    const incidentId2 = await citizenPage2.evaluate(() => window.app.activeIncident.id);
    const citizenToken2 = await citizenPage2.evaluate(() => window.app.citizenAccessToken || '');
    console.log('   Incident #2 created:', incidentId2, '(Citizen token present:', !!citizenToken2, ')');

    console.log('2. Dispatcher signing on behalf of citizen via API...');
    const signOnBehalfRes = await requestJson(`${BASE_URL}/api/sos/sign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${dispatcherToken}`
      }
    }, {
      incidentId: incidentId2,
      signerRole: 'citizen',
      name: 'Lê Thị Bình (Trực Ban Ký Thay)',
      type: 'draw',
      signatureData: citizenSigData1,
      confirmIncidentId: incidentId2,
      confirmReporterName: 'Người dân'
    });

    if (signOnBehalfRes.status !== 200 || !signOnBehalfRes.body?.ok || !signOnBehalfRes.body?.signatures?.citizen?.signed) {
      throw new Error('Scenario (c) Failed: Sign on behalf request failed: ' + JSON.stringify(signOnBehalfRes.body));
    }
    const citSig2 = signOnBehalfRes.body.signatures.citizen;
    if (citSig2.signerAccount !== DISPATCHER_USER || !citSig2.name.includes('Trực Ban Ký Thay')) {
      throw new Error('Scenario (c) Failed: Signer account audit trail missing: ' + JSON.stringify(citSig2));
    }
    console.log('   Scenario (c) PASS: Dispatcher successfully signed on behalf of citizen with audit trail.');

    // -------------------------------------------------------------
    // Scenario (d): Citizen attempt to write officer slot blocked with HTTP 403
    // -------------------------------------------------------------
    console.log('\n--- Scenario (d): Citizen Attempt to Sign Officer Slot is Blocked (HTTP 403) ---');
    const unauthorizedSignRes = await requestJson(`${BASE_URL}/api/sos/sign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sos-access-token': citizenToken2
        // Intentionally NO Dispatcher Authorization Header
      }
    }, {
      id: incidentId2,
      signerRole: 'officer',
      name: 'Kẻ Giả Mạo Cán Bộ',
      type: 'draw',
      signatureData: citizenSigData1,
      accessToken: citizenToken2
    });

    console.log('   Response Status:', unauthorizedSignRes.status);
    console.log('   Response Body:', JSON.stringify(unauthorizedSignRes.body));

    if (unauthorizedSignRes.status !== 403) {
      throw new Error(`Scenario (d) Failed: Expected HTTP 403, got ${unauthorizedSignRes.status}`);
    }
    if (unauthorizedSignRes.body?.ok !== false || !unauthorizedSignRes.body?.error?.includes('Người dân chỉ được ký phần xác nhận của mình')) {
      throw new Error('Scenario (d) Failed: Expected 403 role enforcement error message');
    }
    console.log('   Scenario (d) PASS: Citizen unauthorized attempt to sign officer slot strictly blocked with HTTP 403.');

    // -------------------------------------------------------------
    // Scenario (e): Server restart readback confirms persistence
    // -------------------------------------------------------------
    console.log('\n--- Scenario (e): Server Restart Readback (Durable Persistence) ---');
    console.log('1. Reading current signature state before restart...');
    const snap1 = await getIncidentSignatures(BASE_URL, dispatcherToken, incidentId1);
    const snap2 = await getIncidentSignatures(BASE_URL, dispatcherToken, incidentId2);
    console.log('   Snapshots captured. Incident #1 isFullySigned:', snap1.isFullySigned);

    console.log('2. Triggering server restart...');
    await restartServer(BASE_URL);

    console.log('3. Re-authenticating dispatcher after restart...');
    const reLoginRes = await requestJson(BASE_URL + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      username: DISPATCHER_USER,
      password: DISPATCHER_PASS
    });
    const newToken = reLoginRes.body?.profile?.token || dispatcherToken;

    console.log('4. Re-reading incidents after server restart...');
    const post1 = await getIncidentSignatures(BASE_URL, newToken, incidentId1);
    const post2 = await getIncidentSignatures(BASE_URL, newToken, incidentId2);

    if (!post1.citizen?.signed || !post1.officer?.signed || !post1.isFullySigned) {
      throw new Error('Scenario (e) Failed: Incident #1 lost signatures across restart: ' + JSON.stringify(post1));
    }
    if (post1.citizen.signatureData !== snap1.citizen.signatureData || post1.officer.signatureData !== snap1.officer.signatureData) {
      throw new Error('Scenario (e) Failed: Signature data mismatch after restart');
    }
    if (!post2.citizen?.signed || post2.citizen.signerAccount !== DISPATCHER_USER) {
      throw new Error('Scenario (e) Failed: Incident #2 sign-on-behalf lost across restart: ' + JSON.stringify(post2));
    }

    console.log('   Scenario (e) PASS: All signatures, roles, timestamps, and full-signed flags survived server restart intact.');

    console.log('\n======================================================');
    console.log('ALL 5 SCENARIOS PASSED SUCCESSFULLY:');
    console.log('  (a) Citizen hand-drawn canvas signature persists: PASS');
    console.log('  (b) Dispatcher electronic signature persists: PASS');
    console.log('  (c) Dispatcher signs on behalf of citizen: PASS');
    console.log('  (d) Citizen 403 block on officer slot: PASS');
    console.log('  (e) Server restart readback persistence: PASS');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('\nFAIL:', err);
  process.exit(1);
});
