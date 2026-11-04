/**
 * Playwright E2E Flow for Feature 8: VibeCheck AI
 * Run with: node frontend/tests/feature_8_vibecheck.spec.cjs
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

  console.log('1. Navigating to VibeCheck AI (/vibecheck)...');
  await page.goto('http://localhost:5173/vibecheck', { waitUntil: 'networkidle' });

  // Verify PageHeader
  const title = await page.textContent('h1');
  assert(title.includes('VibeCheck AI'), `Expected VibeCheck AI, got: ${title}`);
  console.log('✓ Page Header verified');

  // Switch to Pasted Comments fallback tab
  console.log('2. Switching to Pasted Comments tab...');
  await page.click('button:has-text("Pasted Comments")');
  await page.waitForTimeout(500);

  // Fill in sample comments
  const sampleComments = (
    "Elena: The pacing in this video was masterful! The hook kept me watching.\n" +
    "Marcus: What software did you use for the 3D graphics? Can you share?\n" +
    "SpamUser: Check out my telegram link for guaranteed crypto signals!"
  );
  const textarea = page.locator('textarea').first();
  await textarea.fill(sampleComments);

  // Run Analysis
  console.log('3. Running VibeCheck analysis...');
  await page.click('button:has-text("Analyze Comments")');

  // Wait for results
  await page.waitForSelector('text=Audience Vibe Score', { timeout: 15000 });
  console.log('✓ Analysis results rendered');

  // Verify Sentiment Model Notice
  const bodyText = await page.textContent('body');
  assert(bodyText.includes('Sentiment Model:'), 'Should display sentiment model used');
  assert(
    bodyText.includes('Sentiment works best for English comments') || bodyText.includes('Multilingual sentiment active'),
    'Should display truthful model notice'
  );
  console.log('✓ Verified sentiment model and English notice');

  // Verify Data Coverage banner
  assert(bodyText.includes('Data Coverage:'), 'Should display Data Coverage banner');
  console.log('✓ Verified Data Coverage panel');

  // 4. Test "Turn into Studio idea"
  console.log('4. Testing "Turn into Studio idea" button...');
  const studioBtn = page.locator('button:has-text("Turn into Studio idea")').first();
  assert(await studioBtn.isVisible(), 'Turn into Studio idea button should be visible');
  await studioBtn.click();

  // Verify navigation to Content Studio
  await page.waitForURL(/.*\/studio\?topic=.*/, { timeout: 10000 });
  console.log('✓ Successfully navigated to Content Studio from VibeCheck idea');

  // Navigate back to VibeCheck to test History
  console.log('5. Testing Reports History and Deletion...');
  await page.goto('http://localhost:5173/vibecheck', { waitUntil: 'networkidle' });
  const histBtn = page.locator('button:has-text("Reports")').first();
  await histBtn.click();
  await page.waitForSelector('text=Previous VibeCheck Reports', { timeout: 5000 });
  console.log('✓ History slideover opened');

  // Delete first history item if available
  const deleteBtn = page.locator('button[title="Delete report"]').first();
  if (await deleteBtn.isVisible()) {
    page.on('dialog', async (d) => await d.accept());
    await deleteBtn.click();
    await page.waitForTimeout(500);
    console.log('✓ History report deleted');
  }

  await browser.close();
  console.log('ALL FEATURE 8 VIBECHECK TESTS PASSED!');
})();
