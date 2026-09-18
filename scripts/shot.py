#!/usr/bin/env python3
"""Multi-viewport screenshot harness (dev only). Usage: python3 scripts/shot.py <outdir> [dispatcher|index|all]"""
import sys, os, asyncio
from playwright.async_api import async_playwright

BASE = 'http://localhost:3000'
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/shots'
WHICH = sys.argv[2] if len(sys.argv) > 2 else 'all'
ONLY = [x for x in (sys.argv[3].split(',') if len(sys.argv) > 3 else []) if x]
os.makedirs(OUT, exist_ok=True)

UA_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
UA_AND = 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36'
UA_PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
UA_IPAD = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

VIEWPORTS = [
  ('pc-1080p', 1920, 1080, 1, UA_PC, False),
  ('pc-2k', 2560, 1440, 1, UA_PC, False),
  ('pc-ultrawide', 3440, 1440, 1, UA_PC, False),
  ('laptop-1366', 1366, 768, 1, UA_PC, False),
  ('ipad-landscape', 1180, 820, 2, UA_IPAD, True),
  ('ipad-portrait', 820, 1180, 2, UA_IPAD, True),
  ('iphone15promax', 430, 932, 3, UA_IOS, True),
  ('iphone-se', 375, 667, 2, UA_IOS, True),
  ('galaxy-s24', 384, 854, 3, UA_AND, True),
  ('zfold-open', 673, 841, 2, UA_AND, True),
]

async def gate(page):
  # pass level-0 gatekeeper if present (PASS 2002 per source comment)
  try:
    await page.wait_for_selector('#cyberGatekeeperModal', timeout=3000)
    inp = await page.query_selector('#gatekeeperPasswordInput')
    if inp:
      await inp.fill('2002')
      btn = await page.query_selector('#btnSubmitGatekeeper')
      if btn: await btn.click()
      await page.wait_for_timeout(900)
  except Exception:
    pass

async def main():
  async with async_playwright() as p:
    browser = await p.chromium.launch()
    for name, w, h, dpr, ua, mobile in VIEWPORTS:
      if ONLY and name not in ONLY: continue
      ctx = await browser.new_context(viewport={'width': w, 'height': h}, device_scale_factor=dpr, user_agent=ua, is_mobile=mobile, has_touch=mobile)
      page = await ctx.new_page()
      errors = []
      page.on('pageerror', lambda e: errors.append(str(e)))
      if WHICH in ('all', 'index'):
        await page.goto(BASE + '/', wait_until='domcontentloaded')
        await page.wait_for_timeout(2500)
        await page.screenshot(path=f'{OUT}/{name}-index.png')
      if WHICH in ('all', 'dispatcher', 'portal'):
        await page.goto(BASE + '/dispatcher.html', wait_until='domcontentloaded')
        await page.wait_for_timeout(2000)
        await gate(page)
        await page.wait_for_timeout(1200)
        await page.screenshot(path=f'{OUT}/{name}-portal.png')
        if WHICH != 'portal':
          # bypass login visually: reveal console by hiding portal (visual layout test only)
          await page.evaluate("""() => {
            const p = document.getElementById('cosmicPortalView'); if (p) p.style.setProperty('display','none','important');
            document.querySelectorAll('.auth-gate-backdrop').forEach(m => m.style.setProperty('display','none','important'));
          }""")
          await page.wait_for_timeout(1500)
          await page.screenshot(path=f'{OUT}/{name}-console.png')
          # simulate selected incident (visual only) -> drawer visible
          await page.evaluate("""() => {
            const d = document.getElementById('activeIncidentDrawer'); if (d) d.style.display = 'block';
            const s = document.getElementById('drawerSosId'); if (s) s.textContent = '#SOS-2026-0042';
          }""")
          await page.wait_for_timeout(700)
          await page.screenshot(path=f'{OUT}/{name}-console-detail.png')
          if mobile and w <= 992:
            await page.evaluate("() => window.TacticalLayout && window.TacticalLayout.setView('queue')")
            await page.wait_for_timeout(500)
            await page.screenshot(path=f'{OUT}/{name}-console-queue.png')
            await page.evaluate("() => window.TacticalLayout && window.TacticalLayout.setView('map')")
            await page.wait_for_timeout(500)
            # open geofence dock + province popover
            await page.evaluate("""() => {
              const orb = document.getElementById('tacticalGeofenceBubbleTrigger'); if (orb) orb.click();
            }""")
            await page.wait_for_timeout(600)
            await page.evaluate("""() => {
              const b = document.querySelector('#dockProvincePillWrap button, #dockProvincePillWrap .dock-pill-button, #dockProvincePillWrap'); if (b) b.click();
            }""")
            await page.wait_for_timeout(700)
            await page.screenshot(path=f'{OUT}/{name}-console-dock.png')
      print(name, 'errors:', errors[:3])
      await ctx.close()
    await browser.close()

asyncio.run(main())
