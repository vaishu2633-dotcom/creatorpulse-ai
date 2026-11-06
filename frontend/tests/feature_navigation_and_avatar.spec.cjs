/**
 * Playwright E2E test for 6-Section Sidebar Navigation and Top-Right Avatar Menu
 */
const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  console.log('[Playwright] Starting 6-Section Navigation & Avatar Menu E2E Test...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  await context.addInitScript(() => {
    window.localStorage.setItem('creatorpulse_tour_seen', 'true');
  });

  const page = await context.newPage();
  const BASE_URL = 'http://localhost:5173';

  try {
    // 1. Check Sidebar on Dashboard
    console.log('[Step 1] Loading Dashboard and verifying 6 primary sidebar sections');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const sidebarText = await page.locator('aside').textContent();
    assert(sidebarText.includes('Dashboard'), 'Sidebar missing Dashboard');
    assert(sidebarText.includes('VibeCheck AI'), 'Sidebar missing VibeCheck AI');
    assert(sidebarText.includes('Predict a Post'), 'Sidebar missing Predict a Post');
    assert(sidebarText.includes('Content Studio'), 'Sidebar missing Content Studio');
    assert(sidebarText.includes('Reports'), 'Sidebar missing Reports');
    assert(sidebarText.includes('More Tools'), 'Sidebar missing More Tools');
    console.log('✓ Verified 6 primary sidebar navigation sections');

    // 2. Click each primary sidebar section
    console.log('[Step 2] Testing navigation across all 6 sections');
    await page.click('aside a:has-text("VibeCheck AI")');
    await page.waitForURL(/.*\/vibecheck/, { timeout: 5000 });
    console.log('✓ Navigated to VibeCheck AI');

    await page.click('aside a:has-text("Predict a Post")');
    await page.waitForURL(/.*\/predictor/, { timeout: 5000 });
    console.log('✓ Navigated to Predict a Post');

    await page.click('aside a:has-text("Content Studio")');
    await page.waitForURL(/.*\/studio/, { timeout: 5000 });
    console.log('✓ Navigated to Content Studio');

    await page.click('aside a:has-text("Reports")');
    await page.waitForURL(/.*\/reports/, { timeout: 5000 });
    console.log('✓ Navigated to Reports');

    await page.click('aside a:has-text("More Tools")');
    await page.waitForURL(/.*\/tools/, { timeout: 5000 });
    console.log('✓ Navigated to More Tools');

    await page.click('aside a:has-text("Dashboard")');
    await page.waitForURL(/.*\/$/, { timeout: 5000 });
    console.log('✓ Navigated back to Dashboard');

    // 3. Test Top-Right Profile / Avatar Menu
    console.log('[Step 3] Testing Top-Right Profile / Avatar dropdown menu');
    const avatarBtn = page.locator('header button:has-text("CP")').first();
    await avatarBtn.click();
    await page.waitForTimeout(600);

    const avatarMenuText = await page.locator('header').textContent();
    assert(avatarMenuText.includes('Connect Accounts'), 'Avatar menu missing Connect Accounts');
    assert(avatarMenuText.includes('Settings & API Keys'), 'Avatar menu missing Settings & API Keys');
    assert(avatarMenuText.includes('Data Source'), 'Avatar menu missing Data Source');
    assert(avatarMenuText.includes('Theme'), 'Avatar menu missing Theme');
    console.log('✓ Top-Right Profile / Avatar Menu contains all required options');

    await browser.close();
    console.log('ALL 6-SECTION NAVIGATION AND AVATAR MENU TESTS PASSED!');
  } catch (err) {
    await browser.close();
    console.error('Navigation and Avatar Menu test failed:', err);
    process.exit(1);
  }
})();
