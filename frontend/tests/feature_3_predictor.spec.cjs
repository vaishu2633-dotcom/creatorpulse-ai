/**
 * Feature 3: Post Predictor E2E Browser Test
 * --------------------------------------------
 * Verifies:
 * 1. Post Predictor page identity and "Working now" chip
 * 2. Model provenance card & Retrain on My Data button
 * 3. Live What-If Simulator sliders
 * 4. Prediction submission and calibrated results display
 * 5. Predicted ER range and model factor reasons
 */

const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  console.log('[Playwright] Starting Feature 3: Post Predictor E2E Test...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  await context.addInitScript(() => {
    window.localStorage.setItem('creatorpulse_tour_seen', 'true');
  });

  const page = await context.newPage();

  // 1. Visit /predictor
  await page.goto('http://localhost:5173/predictor', { waitUntil: 'networkidle' });

  // 2. Verify Page Identity
  const title = await page.textContent('h1');
  assert(title.includes('Post Predictor'), 'Page title should be Post Predictor');

  const tag = await page.textContent('text=Prediction Tool');
  assert(tag, 'Tag chip should show Prediction Tool');

  // 3. Verify Model Provenance & Retrain button
  const retrainBtn = await page.$('button:has-text("Retrain on My Data")');
  assert(retrainBtn, 'Retrain button must be visible');

  console.log('[Step 1] Triggering Retrain on My Data...');
  await retrainBtn.click();
  // Wait for notification banner
  await page.waitForSelector('text=personal model', { timeout: 15000 });
  console.log('[Step 1] Retraining completed with model confirmation banner');

  // 4. Verify Live What-If Simulator
  const whatIfHeader = await page.$('text=Live What-If Simulator');
  assert(whatIfHeader, 'Live What-If Simulator must be visible');

  // 5. Submit a post prediction
  console.log('[Step 2] Submitting a post prediction...');
  const titleArea = await page.$('textarea[placeholder*="Why 90%"]');
  await titleArea.fill('Will Agentic AI Replace Junior Software Engineers in 2026?');

  const predictBtn = await page.$('form button[type="submit"]');
  assert(predictBtn, 'Submit button in form must exist');
  await predictBtn.click();

  // 6. Verify Results
  await page.waitForSelector('text=Estimated Hit Chance', { timeout: 10000 });
  const bodyText = await page.textContent('body');

  assert(bodyText.includes('Predicted ER:'), 'Predicted ER range must be displayed');
  assert(bodyText.includes('Realistic range:'), 'Realistic range must be displayed');
  assert(bodyText.includes('Top Factors Influencing This Score'), 'Top factors section must be displayed');
  assert(bodyText.includes('Saved to Prediction Results automatically.'), 'Automatic save note must be displayed');

  console.log('[Playwright] Feature 3: Post Predictor E2E Test passed successfully!');
  await browser.close();
})();
