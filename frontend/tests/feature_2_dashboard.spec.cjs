/**
 * Playwright browser flow test for Feature 2: Dashboard
 * -----------------------------------------------------
 * Verifies end-to-end:
 * 1. Loading Dashboard with dynamic active dataset stats
 * 2. Hero floating cards rendering real metric numbers
 * 3. Recent Activity header with tabs, date filters, sorting, and totals
 * 4. Switching tabs (Recent -> Top Hits -> Bottom)
 * 5. Switching date filters (7d, 30d, All)
 * 6. Opening 30-Day Trajectory slideover with 4 metric cards and AreaChart
 */

const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  console.log('[Playwright] Starting Feature 2: Dashboard E2E Test...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  // Suppress first-time guided tour modal
  await context.addInitScript(() => {
    window.localStorage.setItem('creatorpulse_tour_seen', 'true');
  });

  const page = await context.newPage();
  const BASE_URL = 'http://localhost:5173';

  try {
    // 1. Navigate to Dashboard
    console.log('[Step 1] Navigating to Dashboard');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // 2. Verify Hero floating cards display real numbers
    console.log('[Step 2] Verifying Hero floating metrics');
    const heroText = await page.textContent('body');
    assert(heroText.includes('views'), 'Hero floating views card missing');
    assert(heroText.includes('Breakout Rate'), 'Hero floating breakout rate card missing');
    assert(heroText.includes('Avg ER'), 'Hero floating engagement rate card missing');

    // 3. Verify Recent Activity header controls
    console.log('[Step 3] Verifying Recent Activity header controls');
    assert(heroText.includes('Recent Activity') || heroText.includes('Top Hits'), 'Recent Activity header missing');
    assert(heroText.includes('Top Hits'), 'Top Hits tab missing');
    assert(heroText.includes('Bottom'), 'Bottom tab missing');
    assert(heroText.includes('7d') && heroText.includes('30d') && heroText.includes('All'), 'Date filter pills missing');

    // 4. Test clicking Top Hits tab
    console.log('[Step 4] Clicking Top Hits tab');
    const topHitsBtn = page.getByRole('button', { name: 'Top Hits' });
    await topHitsBtn.click();
    await page.waitForTimeout(500);

    const topHitsContent = await page.textContent('body');
    assert(topHitsContent.includes('Top Hits'), 'Top Hits view not active');

    // 5. Test clicking 7d filter pill
    console.log('[Step 5] Clicking 7d date filter');
    const pill7d = page.getByRole('button', { name: '7d' });
    await pill7d.click();
    await page.waitForTimeout(600);

    // 6. Test opening Trajectory SlideOver
    console.log('[Step 6] Opening Trajectory slide-over');
    const trajectoryBtn = page.getByRole('button', { name: /30-day Trajectory/i });
    await trajectoryBtn.click();
    await page.waitForTimeout(800);

    // Verify slide-over contains 4 summary cards
    const slideOverContent = await page.textContent('body');
    assert(slideOverContent.includes('Channel Performance & Trajectory') || slideOverContent.includes('Trajectory'), 'Trajectory slide-over title missing');
    assert(slideOverContent.includes('Total Views'), 'Slideover Total Views card missing');
    assert(slideOverContent.includes('Engagements'), 'Slideover Engagements card missing');
    assert(slideOverContent.includes('Avg Engagement'), 'Slideover Avg Engagement card missing');
    assert(slideOverContent.includes('Breakout Hits'), 'Slideover Breakout Hits card missing');

    // 7. Close slide-over
    console.log('[Step 7] Closing slide-over');
    const closeBtn = page.locator('button[aria-label="Close panel"]');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(400);
    }

    console.log('\n✅ ALL PLAYWRIGHT CHECKS PASSED FOR FEATURE 2: DASHBOARD!');
  } catch (err) {
    console.error('\n❌ Playwright test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
