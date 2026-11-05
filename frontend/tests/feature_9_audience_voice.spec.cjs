/**
 * Playwright E2E Flow for Feature 9: Audience Voice
 * Run with: node frontend/tests/feature_9_audience_voice.spec.cjs
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

  console.log('1. Navigating to Audience Voice (/comments)...');
  await page.goto('http://localhost:5173/comments', { waitUntil: 'networkidle' });

  // Verify Page Header & Status
  const title = await page.textContent('h1');
  assert(title.includes('Audience Voice'), `Expected 'Audience Voice', got: ${title}`);
  console.log('✓ Page Header verified');

  // Check 3 Metric Cards
  console.log('2. Verifying metric cards and audience mood ring...');
  const bodyText = await page.textContent('body');
  assert(bodyText.includes('Comments Monitored'), 'Should display Comments Monitored card');
  assert(bodyText.includes('Positive Reception'), 'Should display Positive Reception card');
  assert(bodyText.includes('Audience Questions'), 'Should display Audience Questions card');
  assert(bodyText.includes('Audience Mood Ring'), 'Should display Audience Mood Ring chart');
  console.log('✓ Metric cards and mood ring verified');

  // Verify Discussion Themes
  assert(bodyText.includes('Top Discussion Themes'), 'Should display Top Discussion Themes section');
  const allButton = page.locator('button:has-text("All")').first();
  await allButton.waitFor({ state: 'visible' });
  console.log('✓ Discussion theme chips present');

  // Test "Turn into Studio Idea" action
  console.log('3. Testing "Turn into Studio Idea" click...');
  const turnIntoIdeaBtn = page.locator('button:has-text("Turn into Studio Idea")').first();
  if (await turnIntoIdeaBtn.count() > 0) {
    await turnIntoIdeaBtn.click();
    await page.waitForURL(/.*\/studio\?topic=.*/, { timeout: 10000 });
    console.log('✓ Turn into Studio Idea smoothly navigated to /studio with prefilled question topic');
  }

  // Test Empty State when comments are zero
  console.log('4. Testing clean empty state when no comments exist...');
  await page.route('**/api/comments/summary*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        metadata: { timestamp: new Date().toISOString() },
        total_comments: 0,
        is_sample_data: false,
        data_source: "No analyzed comments",
        sentiment_breakdown: { positive: 0, neutral: 0, negative: 0 },
        sentiment_counts: { positive: 0, neutral: 0, negative: 0 },
        top_themes: [],
        repeated_questions: []
      })
    });
  });

  await page.goto('http://localhost:5173/comments', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=No Audience Comments Analyzed Yet', { timeout: 10000 });
  const emptyStateBtn = page.locator('button:has-text("Analyze in VibeCheck AI")');
  assert(await emptyStateBtn.count() > 0, 'Empty state must offer Analyze in VibeCheck AI action button');
  console.log('✓ Clean empty state verified with VibeCheck call-to-action');

  await browser.close();
  console.log('Feature 9: Audience Voice automated tests passed successfully!');
})().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
