/**
 * Playwright browser flow test for Feature 1: Data In (Foundation)
 * ---------------------------------------------------------------
 * Verifies end-to-end:
 * 1. Loading Settings page and seeing Data Source Switcher
 * 2. Pasting CSV and clicking Validate & Preview
 * 3. Importing posts and verifying top-bar chip reflects 'Uploaded CSV'
 * 4. Navigating to Dashboard and confirming metrics match imported dataset
 * 5. Switching back to Sample data and confirming restoration
 */

const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  console.log('[Playwright] Starting Feature 1: Data In E2E Test...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  // Suppress first-time guided tour modal
  await context.addInitScript(() => {
    window.localStorage.setItem('creatorpulse_tour_seen', 'true');
  });

  const page = await context.newPage();
  const BASE_URL = 'http://localhost:5173';

  try {
    // 1. Navigate to Settings page
    console.log('[Step 1] Navigating to /settings');
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Assert Settings loaded
    const pageHeader = await page.textContent('h1');
    console.log('Page Title:', pageHeader);
    assert(pageHeader.includes('Connect Accounts'), 'Settings header not found');

    // 2. Check Data Source Switcher presence
    const switcherText = await page.textContent('body');
    assert(switcherText.includes('Active Data Source Control'), 'Active Data Source Control card missing');
    assert(switcherText.includes('Sample Data'), 'Sample Data card missing');
    assert(switcherText.includes('Uploaded CSV'), 'Uploaded CSV card missing');

    // 3. Paste test CSV into textarea
    console.log('[Step 2] Pasting CSV data into upload textarea');
    const testCsv = [
      'platform,post_type,caption,published_at,views,likes,comments,shares',
      'youtube,long_video,Playwright Automated Test Post,2026-03-01T10:00:00Z,35000,2800,320,110',
      'instagram,reel,Playwright Fast Reel,2026-03-02T12:00:00Z,72000,5600,420,1200'
    ].join('\n');

    const textarea = page.locator('textarea');
    await textarea.fill(testCsv);

    // 4. Click Validate & Preview
    console.log('[Step 3] Clicking Validate & Preview');
    const validateBtn = page.getByRole('button', { name: /Validate & Preview/i });
    await validateBtn.click();

    // Wait for preview results
    await page.waitForSelector('text=2 Valid Posts', { timeout: 8000 });
    console.log('Detected validation result: 2 Valid Posts');

    // 5. Click Import Posts & Activate
    console.log('[Step 4] Clicking Import Posts & Activate');
    const importBtn = page.getByRole('button', { name: /Import Posts & Activate/i });
    await importBtn.click();

    // Wait for toast or success message
    await page.waitForSelector('text=Active dataset updated (2 posts)', { timeout: 8000 });
    console.log('Detected import success message');

    // 6. Check top-bar badge
    console.log('[Step 5] Checking top-bar active source badge');
    await page.waitForSelector('text=Uploaded CSV', { timeout: 5000 });
    console.log('Top-bar badge reflects Uploaded CSV');

    // 7. Navigate to Dashboard and confirm numbers match
    console.log('[Step 6] Navigating to Dashboard to verify dynamic metrics');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const bodyContent = await page.textContent('body');
    assert(bodyContent.includes('107.0K') || bodyContent.includes('107,000'), 'Dashboard did not show imported total views');
    console.log('Dashboard reflects dynamic CSV metrics (107.0K Total Views)');

    // Also verify post title in /reports
    await page.goto(`${BASE_URL}/reports`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Playwright Automated Test Post', { timeout: 10000 });
    const reportsBody = await page.textContent('body');
    assert(reportsBody.includes('Playwright Automated Test Post'), 'Reports did not show imported post title');
    assert(reportsBody.includes('35.0K') || reportsBody.includes('72.0K') || reportsBody.includes('35,000'), 'Reports did not show imported post views');
    console.log('Reports page reflects dynamic CSV post: Playwright Automated Test Post with views');

    // 8. Switch back to Sample data via Settings
    console.log('[Step 7] Switching back to Sample data');
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const switchSampleBtn = page.getByRole('button', { name: /Switch to Sample/i });
    if (await switchSampleBtn.isVisible()) {
      await switchSampleBtn.click();
      await page.waitForTimeout(500);
    }

    // Confirm top bar badge reverted to Sample data
    await page.waitForSelector('text=Sample data', { timeout: 5000 });
    console.log('Top bar successfully restored to Sample data');

    console.log('\n✅ ALL PLAYWRIGHT CHECKS PASSED FOR FEATURE 1!');
  } catch (err) {
    console.error('\n❌ Playwright test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
