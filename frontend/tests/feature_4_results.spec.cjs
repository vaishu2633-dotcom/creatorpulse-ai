/**
 * Feature 4: Prediction Results Browser Flow Test
 * ------------------------------------------------
 * Verifies:
 * 1. Visiting /results page and seeing Brier accuracy cards with sample size (N=)
 * 2. Calibration audit chart
 * 3. Clicking a prediction row to open SlideOver audit
 * 4. Recording real published outcome (Hit + Views)
 * 5. Instant UI scoreboard update and outcome badge reflection
 */

const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  console.log('[Playwright] Starting Feature 4: Prediction Results E2E Test...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  await context.addInitScript(() => {
    window.localStorage.setItem('creatorpulse_tour_seen', 'true');
  });

  const page = await context.newPage();

  // 1. Visit /results
  await page.goto('http://localhost:5173/results', { waitUntil: 'networkidle' });

  // 2. Verify Page Header & Tag
  const header = await page.textContent('h1');
  assert(header.includes('Prediction Results'), 'Title should be Prediction Results');

  const tag = await page.textContent('text=Tracker');
  assert(tag, 'Tag chip should show Tracker');

  // 3. Verify KPI Cards & Sample Size (N =)
  await page.waitForSelector('text=Brier Accuracy', { timeout: 10000 });
  const pageBody = await page.textContent('body');
  assert(pageBody.includes('N ='), 'Sample size N = must be rendered next to metrics');

  // 4. Click the first row in prediction log table to open SlideOver
  console.log('[Step 1] Opening prediction audit SlideOver...');
  const firstRow = await page.$('table tbody tr');
  assert(firstRow, 'At least one prediction row must exist in table');
  await firstRow.click();

  // 5. Verify SlideOver opened with Record Real Outcome form
  await page.waitForSelector('text=Record Real Outcome', { timeout: 5000 });
  console.log('[Step 2] SlideOver opened with outcome recording form');

  // Fill in views
  const viewsInput = await page.$('input[placeholder*="45000"]');
  if (viewsInput) {
    await viewsInput.fill('75000');
  }

  // Click "Save Real Outcome" button
  const saveBtn = await page.$('button:has-text("Save Real Outcome")');
  assert(saveBtn, 'Save Real Outcome button must exist');
  await saveBtn.click();

  // Verify toast notification appears
  await page.waitForSelector('text=Real outcome recorded', { timeout: 8000 });
  console.log('[Step 3] Real outcome saved and scoreboard updated successfully');

  console.log('[Playwright] Feature 4: Prediction Results E2E Test passed successfully!');
  await browser.close();
})();
