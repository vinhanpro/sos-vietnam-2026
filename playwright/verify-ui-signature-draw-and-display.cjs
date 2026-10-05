// Playwright verification for P8-A: Citizen UI Signature Draw & Display
// Verifies citizen can create an SOS, open the report sheet, open the signature pad,
// draw on the canvas, submit to /api/sos/sign, and the UI immediately renders the signature image.

const { chromium } = require('playwright');

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function run() {
  console.log('[P8-A Signature Test] Connecting to ' + BASE_URL + '...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const context = await browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1280, height: 800 },
      permissions: ['geolocation'],
      geolocation: { latitude: 10.0452, longitude: 105.7469 }
    });

    const page = await context.newPage();

    page.on('dialog', async (dialog) => {
      console.log('  [Browser Dialog]:', dialog.message());
      await dialog.accept().catch(() => {});
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    console.log('1. Submitting test SOS incident as citizen...');
    await page.locator('#btnMasterSOS').click({ force: true });
    await page.waitForSelector('#sosDetailModal.is-open', { timeout: 10000 });

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => /XÁC NHẬN PHÁT TÍN HIỆU/.test(b.textContent));
      if (!btn) throw new Error('Confirm SOS button not found');
      btn.click();
    });

    await page.waitForFunction(() => {
      const inc = window.app && window.app.activeIncident;
      return !!(inc && inc.id && (inc.dispatchUnit || inc.assignedUnit));
    }, { timeout: 15000 });

    const incidentId = await page.evaluate(() => window.app.activeIncident.id);
    console.log('   Incident created successfully:', incidentId);

    console.log('2. Opening incident report modal (#incidentReportDocxModal)...');
    await page.evaluate(() => {
      window.app.openReportModal(window.app.activeIncident);
    });
    await page.waitForSelector('#incidentReportDocxModal', { state: 'visible', timeout: 5000 });
    console.log('   Report modal displayed.');

    console.log('3. Opening citizen signature pad modal (#signaturePadModal)...');
    await page.click('#btnOpenCitizenSignPad');
    await page.waitForSelector('#signaturePadModal.is-open', { timeout: 5000 });
    console.log('   Signature pad modal is open.');

    console.log('4. Drawing on signature canvas (#sigCanvas)...');
    const canvas = page.locator('#sigCanvas');
    await canvas.waitFor({ state: 'visible', timeout: 5000 });
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Could not get #sigCanvas bounding box');

    await page.mouse.move(box.x + 30, box.y + 30);
    await page.mouse.down();
    await page.mouse.move(box.x + 80, box.y + 60, { steps: 5 });
    await page.mouse.move(box.x + 140, box.y + 40, { steps: 5 });
    await page.mouse.move(box.x + 190, box.y + 75, { steps: 5 });
    await page.mouse.up();

    const hasDrawn = await page.evaluate(() => {
      return Boolean(window.app && (window.app.sigHasDrawn || window.app.isSigCanvasDrawn));
    });
    console.log('   Canvas drawing detected:', hasDrawn);

    console.log('5. Submitting signature (#btnSubmitSignature)...');
    await page.click('#btnSubmitSignature');
    await page.waitForTimeout(1500);

    console.log('6. Asserting signature display on document view...');
    const result = await page.evaluate(() => {
      const img = document.getElementById('citizenSigImg');
      const placeholder = document.getElementById('citizenSigPlaceholder');
      const btnSign = document.getElementById('btnOpenCitizenSignPad');
      const timeEl = document.getElementById('docCitizenSignTime');
      const inc = window.app.activeIncident;

      return {
        imgSrc: img ? img.src : null,
        imgVisible: img ? window.getComputedStyle(img).display !== 'none' : false,
        placeholderHidden: placeholder ? window.getComputedStyle(placeholder).display === 'none' : false,
        btnText: btnSign ? btnSign.textContent.trim() : null,
        timeText: timeEl ? timeEl.textContent.trim() : '',
        incidentSigned: inc?.signatures?.citizen?.signed || false,
        signatureType: inc?.signatures?.citizen?.type || null,
        signatureDataLength: inc?.signatures?.citizen?.signatureData?.length || 0
      };
    });

    console.log('   Evaluation result:', JSON.stringify(result, null, 2));

    const isDataUrl = result.imgSrc && result.imgSrc.startsWith('data:image/png');
    const isSuccess = isDataUrl && result.imgVisible && result.placeholderHidden && result.incidentSigned && result.signatureType === 'draw';

    if (isSuccess) {
      console.log('\nPASS: Citizen signature successfully drawn, submitted, and rendered in UI!');
    } else {
      throw new Error('Signature UI assertion failed: ' + JSON.stringify(result));
    }
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('\nFAIL:', err);
  process.exit(1);
});
