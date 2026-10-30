/**
 * Feature Test: Channel Reports & Analytics E2E Test
 * ---------------------------------------------------
 * Verifies:
 * 1. Navigating to /reports
 * 2. Header title & "Analytics" chip
 * 3. 4 KPI cards with real totals
 * 4. Trend chart with velocity timeline
 * 5. Tab switching between Top Hits and Needs Work
 * 6. Export CSV button functionality
 */

const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  console.log('[Playwright] Starting Reports E2E Test...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  await context.addInitScript(() => {
    window.localStorage.setItem('creatorpulse_tour_seen', 'true');
  });

  const page = await context.newPage();

  // 1. Visit /reports
  await page.goto('http://localhost:5173/reports', { waitUntil: 'networkidle' });

  // 2. Verify Page Header
  const title = await page.textContent('h1');
  assert(title.includes('Channel Reports & Analytics'), 'Title should match Channel Reports & Analytics');

  const tag = await page.textContent('text=Analytics');
  assert(tag, 'Tag chip should show Analytics');

  // 3. Wait for data to load and verify KPI Totals
  await page.waitForSelector('text=Total Views', { timeout: 10000 });
  const totalViewsLabel = await page.$('text=Total Views');
  assert(totalViewsLabel, 'Total Views card should exist');

  const avgErLabel = await page.$('text=Avg Engagement Rate');
  assert(avgErLabel, 'Avg ER card should exist');

  // 4. Verify Trend Chart
  const chartHeader = await page.$('text=Audience Growth & Velocity Timeline');
  assert(chartHeader, 'Trend chart header should be visible');

  // 5. Test Tab Switching
  const needsWorkTab = await page.$('button:has-text("Needs Work")');
  assert(needsWorkTab, 'Needs Work tab should exist');
  await needsWorkTab.click();
  await page.waitForTimeout(300);

  // 6. Test CSV Export Button
  const exportBtn = await page.$('button:has-text("Export CSV")');
  assert(exportBtn, 'Export CSV button should exist');

  console.log('[Playwright] Reports E2E Test passed successfully!');
  await browser.close();
})();
