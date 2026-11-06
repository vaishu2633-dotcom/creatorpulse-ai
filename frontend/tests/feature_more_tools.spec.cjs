/**
 * Playwright E2E test for More Tools (/tools)
 */
const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  console.log('[Playwright] Starting More Tools E2E Test...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  await context.addInitScript(() => {
    window.localStorage.setItem('creatorpulse_tour_seen', 'true');
  });

  const page = await context.newPage();
  const BASE_URL = 'http://localhost:5173';

  try {
    // 1. Navigate to /tools
    console.log('[Step 1] Navigating to /tools');
    await page.goto(`${BASE_URL}/tools`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');
    assert(bodyText.includes('More Tools'), 'More Tools header missing');
    assert(bodyText.includes('Model Tests / Imbalance Lab'), 'Lab tab missing');
    assert(bodyText.includes('Model Performance'), 'Model Performance tab missing');
    assert(bodyText.includes('Dataset Information'), 'Dataset Information tab missing');
    console.log('✓ Section 6: /tools loaded with all 3 tabs');

    // 2. Click Model Performance tab
    console.log('[Step 2] Clicking Model Performance & Features tab');
    await page.click('button:has-text("Model Performance")');
    await page.waitForTimeout(800);
    const perfText = await page.textContent('body');
    assert(perfText.includes('Feature Importances in Breakout Prediction'), 'Feature Importances missing');
    assert(perfText.includes('Production Classifier'), 'Production Classifier card missing');
    console.log('✓ Model Performance tab verified');

    // 3. Click Dataset Information tab
    console.log('[Step 3] Clicking Dataset Information tab');
    await page.click('button:has-text("Dataset Information")');
    await page.waitForTimeout(800);
    const dataText = await page.textContent('body');
    assert(dataText.includes('Active Dataset Provenance'), 'Dataset Provenance missing');
    assert(dataText.includes('Training Posts (70%)'), '70% train split metric missing');
    assert(dataText.includes('Calibration Posts (15%)'), '15% calibration split metric missing');
    console.log('✓ Dataset Information tab verified');

    await browser.close();
    console.log('ALL MORE TOOLS TESTS PASSED!');
  } catch (err) {
    await browser.close();
    console.error('More tools test failed:', err);
    process.exit(1);
  }
})();
