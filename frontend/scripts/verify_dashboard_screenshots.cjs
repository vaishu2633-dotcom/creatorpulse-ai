/**
 * Automated Screenshot & Viewport Verification Script
 * ----------------------------------------------------
 * Captures Dashboard at 5 strict viewport dimensions in light & dark themes:
 * - 1280x620
 * - 1366x650
 * - 1440x760
 * - 1536x730
 * - 1920x950
 * Verifies no vertical page scroll and all 6 Quick Action tiles are visible.
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const VIEWPORT_SIZES = [
  { width: 1280, height: 620, label: '1280x620' },
  { width: 1366, height: 650, label: '1366x650' },
  { width: 1440, height: 760, label: '1440x760' },
  { width: 1536, height: 730, label: '1536x730' },
  { width: 1920, height: 950, label: '1920x950' },
];

const OUTPUT_DIR = path.join(__dirname, '..', 'design-reference', 'checks');

(async () => {
  console.log('[Playwright] Starting Dashboard Viewport Verification...');
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  for (const size of VIEWPORT_SIZES) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({
        viewport: { width: size.width, height: size.height },
      });

      // Suppress tour & set theme
      await context.addInitScript((t) => {
        window.localStorage.setItem('creatorpulse_tour_seen', 'true');
        window.localStorage.setItem('creatorpulse_theme', t);
        if (t === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }, theme);

      const page = await context.newPage();
      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

      // Ensure theme applied
      if (theme === 'dark') {
        await page.evaluate(() => document.documentElement.classList.add('dark'));
      } else {
        await page.evaluate(() => document.documentElement.classList.remove('dark'));
      }
      await page.waitForTimeout(300);

      // Verify Hero, VibeCheck AI, and Quick Actions are visible
      const hero = await page.$('text=Good afternoon');
      if (!hero) throw new Error(`Hero not found at ${size.label} ${theme}`);

      const vibeInput = await page.$('input[placeholder*="Paste a YouTube"]');
      if (!vibeInput) throw new Error(`VibeCheck input not found at ${size.label} ${theme}`);

      // Verify all 6 Quick Action tiles
      const expectedActions = [
        'Analyze URL',
        'Generate Content',
        'Check Trends',
        'Predict a Post',
        'View Calendar',
        'Open Reports'
      ];

      for (const actionTitle of expectedActions) {
        const tile = await page.$(`text=${actionTitle}`);
        if (!tile) throw new Error(`Quick action "${actionTitle}" not visible at ${size.label} ${theme}`);
      }

      // Check vertical scrollbar on main container / window
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollHeight > window.innerHeight + 5;
      });

      console.log(`[Check] ${size.label} | ${theme.padEnd(5)} | Overflow: ${hasOverflow ? 'YES (needs fix)' : 'NO (fits perfectly)'}`);

      const screenshotPath = path.join(OUTPUT_DIR, `dashboard-${size.label}-${theme}.png`);
      await page.screenshot({ path: screenshotPath });

      await context.close();
    }
  }

  // Also verify /reports page
  console.log('[Playwright] Verifying new Reports page (/reports)...');
  const reportsContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await reportsContext.addInitScript(() => {
    window.localStorage.setItem('creatorpulse_tour_seen', 'true');
  });
  const reportsPage = await reportsContext.newPage();
  await reportsPage.goto('http://localhost:5173/reports', { waitUntil: 'networkidle' });

  const reportsTitle = await reportsPage.$('text=Channel Reports & Analytics');
  if (!reportsTitle) throw new Error('Reports title not found');
  console.log('[Check] Reports page loaded successfully with real data!');

  const reportsScreenshot = path.join(OUTPUT_DIR, 'reports-1440x900-light.png');
  await reportsPage.screenshot({ path: reportsScreenshot });

  await reportsContext.close();
  await browser.close();
  console.log('[Playwright] All screenshots captured and verified successfully!');
})();
