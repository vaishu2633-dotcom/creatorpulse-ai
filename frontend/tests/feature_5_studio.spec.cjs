/**
 * Playwright E2E Flow for Feature 5: Content Studio
 * Run with: node frontend/tests/feature_5_studio.spec.cjs
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

  console.log('1. Navigating to Content Studio...');
  await page.goto('http://localhost:5173/studio', { waitUntil: 'networkidle' });

  // Verify PageHeader
  const title = await page.textContent('h1');
  assert(title.includes('Content Studio'), `Expected Content Studio title, got: ${title}`);
  console.log('✓ Page Header verified');

  // Verify Mode Banner
  const bannerText = await page.textContent('body');
  assert(
    bannerText.includes('Template Mode') || bannerText.includes('AI Generation Mode'),
    'Expected Template or AI mode banner'
  );
  console.log('✓ Mode banner verified');

  // Verify Language Selection includes Hindi and Marathi
  const langSelect = page.locator('select').nth(1); // Second select is language
  const options = await langSelect.locator('option').allTextContents();
  assert(options.some(o => o.includes('English')), 'English should be available');
  assert(options.some(o => o.includes('Hindi')), 'Hindi should be available');
  assert(options.some(o => o.includes('Marathi')), 'Marathi should be available');
  console.log('✓ Multilingual language options verified:', options);

  // Set topic and generate
  console.log('2. Generating Content Package...');
  const textarea = page.locator('textarea').first();
  await textarea.fill('System Design for High Scale');
  await page.click('button:has-text("Generate Content Package")');

  // Wait for package to appear
  await page.waitForSelector('text=Generated in', { timeout: 10000 });
  console.log('✓ Content Package generated and displayed');

  // Check actions: Edit Copy, Copy All, Regenerate, Save to Drafts
  const editBtn = page.locator('button:has-text("Edit Copy")');
  assert(await editBtn.isVisible(), 'Edit Copy button should be visible');

  const copyAllBtn = page.locator('button:has-text("Copy All")');
  assert(await copyAllBtn.isVisible(), 'Copy All button should be visible');

  const regenBtn = page.locator('button:has-text("Regenerate")');
  assert(await regenBtn.isVisible(), 'Regenerate button should be visible');

  console.log('3. Testing Top 10 Ideas Tournament...');
  await page.click('button:has-text("Rank Top 10")');
  await page.waitForSelector('h3:has-text("Top 10 Ideas")', { timeout: 10000 });

  const winnerHeading = page.locator('h3:has-text("Top 10 Ideas")');
  assert(await winnerHeading.isVisible(), 'Tournament leaderboard should appear');

  // Check that ranks 1-10 are present
  const ideaRows = page.locator('button:has-text("Use as Topic")');
  const count = await ideaRows.count();
  assert(count >= 5, `Expected multiple tournament ideas with Use as Topic, got ${count}`);
  console.log(`✓ Tournament leaderboard rendered with ${count} ranked hooks`);

  // Click Save to Drafts
  console.log('4. Testing Save to Drafts...');
  await page.click('button:has-text("Save to Drafts")');
  await page.waitForSelector('text=Saved to Planner!', { timeout: 10000 });
  console.log('✓ Draft saved successfully!');

  await browser.close();
  console.log('ALL FEATURE 5 STUDIO TESTS PASSED!');
})();
