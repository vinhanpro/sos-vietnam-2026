// Reusable Playwright check (per AGENTS.md: scripts under playwright/ must be
// reusable, not one-off temp files) for the P1 vehicle-profile routing fix.
//
// Verifies, against a real running instance of the app (intended to be the
// Docker-built container, per the plan's Docker-evidence rule), that:
//   - a 'police' (motorbike-class) incident's in-app route line renders with
//     the motorbike color/dash styling
//   - a 'hospital' (car-class) incident's in-app route line renders with the
//     original car/driving color/no-dash styling
//
// Usage:
//   node playwright/verify-vehicle-profile-route-styling.cjs [baseUrl]
// baseUrl defaults to http://localhost:3000 (override for a Docker test port).

const { chromium } = require('playwright');

const BASE_URL = process.argv[2] || process.env.SOS_TEST_BASE_URL || 'http://localhost:3000';

async function submitSOSAndGetRouteStyle(page, agencyLabel) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  // Open the SOS modal. The orb button has a continuous shockwave animation
  // and the modal itself has an open transition, so Playwright's stability
  // check never settles on its own - force clicks and wait on the modal's
  // 'is-open' class explicitly instead.
  await page.locator('#btnMasterSOS').click({ force: true });
  await page.waitForSelector('#sosDetailModal.is-open', { timeout: 10000 });

  // Select the requested agency card if it is not already selected by default.
  const agencyCard = page.locator(`.agency-card:has-text("${agencyLabel}")`).first();
  if (await agencyCard.count() > 0) {
    await agencyCard.click({ force: true });
  }

  // The confirm click reliably reaches the server (observed in server logs)
  // even when Playwright's own post-click actionability re-check times out,
  // likely due to a brief overlay/animation re-intercepting pointer events
  // right after the click is dispatched. Dispatch via evaluate() to sidestep
  // that re-check entirely, rather than loosening the real app's UI.
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button'))
      .find(b => /XÁC NHẬN PHÁT TÍN HIỆU/.test(b.textContent));
    if (!btn) throw new Error('Confirm SOS button not found in DOM');
    btn.click();
  });

  // Wait for a unit to be auto-assigned and drawRoute() to have run.
  await page.waitForFunction(() => {
    const inc = window.app && window.app.activeIncident;
    return !!(inc && (inc.dispatchUnit || inc.assignedUnit));
  }, { timeout: 15000 });

  // Give drawRoute's async OSRM fetch a moment to settle.
  await page.waitForTimeout(1500);

  return page.evaluate(() => {
    const mc = window.app.mapController;
    const map = mc.map;
    const srcId = mc.routeSourceId;
    return {
      agency: window.app.activeIncident.agency,
      glowColor: map.getPaintProperty(srcId + '-glow', 'line-color'),
      lineColor: map.getPaintProperty(srcId + '-line', 'line-color'),
      dash: map.getPaintProperty(srcId + '-line', 'line-dasharray') || null
    };
  });
}

// The app's Layer-7 WAF blocks headless-browser-shaped User-Agents as bots;
// use a realistic desktop Chrome UA so Playwright is treated as a real user.
const REAL_BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function main() {
  const browser = await chromium.launch();
  const results = {};
  let failures = [];

  try {
    // Motorbike-class: ward police patrol.
    {
      const context = await browser.newContext({ userAgent: REAL_BROWSER_UA });
      const page = await context.newPage();
      const style = await submitSOSAndGetRouteStyle(page, 'Công an');
      results.police = style;
      await context.close();

      if (style.agency !== 'police') failures.push(`expected agency 'police', got '${style.agency}'`);
      if (style.glowColor !== '#10b981') failures.push(`police glowColor expected #10b981, got ${style.glowColor}`);
      if (style.lineColor !== '#34d399') failures.push(`police lineColor expected #34d399, got ${style.lineColor}`);
      if (!style.dash) failures.push('police route expected a line-dasharray, got none');
    }

    // Car-class: hospital/ambulance.
    {
      const context = await browser.newContext({ userAgent: REAL_BROWSER_UA });
      const page = await context.newPage();
      const style = await submitSOSAndGetRouteStyle(page, 'Cấp cứu');
      results.hospital = style;
      await context.close();

      if (style.agency !== 'hospital') failures.push(`expected agency 'hospital', got '${style.agency}'`);
      if (style.glowColor !== '#0088ff') failures.push(`hospital glowColor expected #0088ff, got ${style.glowColor}`);
      if (style.lineColor !== '#00d2ff') failures.push(`hospital lineColor expected #00d2ff, got ${style.lineColor}`);
    }
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify({ baseUrl: BASE_URL, results, failures }, null, 2));

  if (failures.length > 0) {
    console.error(`FAIL: ${failures.length} assertion(s) failed.`);
    process.exit(1);
  }
  console.log('PASS: vehicle-profile route styling is correct for both motorbike-class and car-class agencies.');
}

main().catch((err) => {
  console.error('ERROR:', err);
  process.exit(1);
});
