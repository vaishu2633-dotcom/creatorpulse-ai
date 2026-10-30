/**
 * Playwright E2E Flow for Feature 6: Trend Explorer
 * Run with: node frontend/tests/feature_6_trends.spec.cjs
 */
const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    window.localStorage.setItem('creatorpulse_tour_seen', 'true');
  });

  const page = await context.newPage();

  console.log('1. Navigating to Trend Explorer (/trends)...');
  await page.goto('http://localhost:5173/trends', { waitUntil: 'networkidle' });

  // Verify PageHeader
  const title = await page.textContent('h1');
  assert(title.includes('Trend Explorer'), `Expected Trend Explorer title, got: ${title}`);
  console.log('✓ Page Header verified');

  // Verify Provenance Banner shows Source and Last update
  const banner = page.locator('text=Source:');
  assert(await banner.isVisible(), 'Provenance source banner should be visible');
  const bannerContent = await page.textContent('body');
  assert(
    bannerContent.includes('Last update:') || bannerContent.includes('Last updated'),
    'Last update timestamp should be visible'
  );
  console.log('✓ Provenance & source banner verified');

  // Test Velocity Window Filter tabs
  console.log('2. Testing velocity window tabs...');
  const tab7d = page.locator('button:has-text("7 Days")');
  await tab7d.click();
  await page.waitForTimeout(500);
  console.log('✓ 7 Days tab clicked');

  // Test Region Selector
  console.log('3. Testing Region Selector...');
  const regionSelect = page.locator('select').first();
  await regionSelect.selectOption('IN');
  await page.waitForTimeout(500);
  console.log('✓ Region changed to India (IN)');

  // Test "Rising in Your Content" filter tab
  console.log('4. Testing Rising in Your Content filter...');
  const creatorTab = page.locator('button:has-text("Rising in Your Content")');
  await creatorTab.click();
  await page.waitForTimeout(500);
  console.log('✓ Rising in Your Content filter selected');

  // Switch back to All Signals
  await page.click('button:has-text("All Signals")');
  await page.waitForTimeout(500);

  // Inspect first trend card
  console.log('5. Inspecting trend card and slide-over...');
  const firstUseBtn = page.locator('button:has-text("Use this topic")').first();
  assert(await firstUseBtn.isVisible(), 'Use this topic button should be visible on cards');

  // Click card to open slideover
  const firstCard = page.locator('div.grid h3').first();
  const cardTopic = (await firstCard.textContent()).trim();
  console.log(`Selected topic: "${cardTopic}"`);
  await firstCard.click();

  // Wait for slideover
  await page.waitForSelector('text=Trend Intelligence', { timeout: 5000 });
  const slideoverTitle = await page.textContent('h3');
  console.log('✓ SlideOver opened with Trend Intelligence');

  // Click "Use this topic in Studio"
  console.log('6. Clicking "Use this topic in Studio"...');
  const slideoverUseBtn = page.locator('button:has-text("Use this topic in Studio")');
  await slideoverUseBtn.click();

  // Verify navigation to Content Studio (/studio)
  await page.waitForURL(/.*\/studio\?topic=.*/, { timeout: 10000 });
  console.log('✓ Navigated to Content Studio with query param');

  // Verify textarea in studio has the topic prefilled
  const studioTextarea = page.locator('textarea').first();
  const textareaVal = await studioTextarea.inputValue();
  assert(textareaVal.length > 0, 'Studio topic should be prefilled');
  console.log(`✓ Content Studio topic input prefilled with: "${textareaVal}"`);

  await browser.close();
  console.log('ALL FEATURE 6 TRENDS TESTS PASSED!');
})();
