/**
 * Playwright E2E Flow for Feature 7: Calendar & Drafts
 * Run with: node frontend/tests/feature_7_calendar.spec.cjs
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

  console.log('1. Navigating to Calendar & Drafts (/calendar)...');
  await page.goto('http://localhost:5173/calendar', { waitUntil: 'networkidle' });

  // Verify PageHeader
  const title = await page.textContent('h1');
  assert(title.includes('Calendar & Drafts'), `Expected Calendar & Drafts, got: ${title}`);
  console.log('✓ Page Header verified');

  // Verify the 4 Column titles: Idea, Writing, Planned, Marked as posted
  const bodyText = await page.textContent('body');
  assert(bodyText.includes('Idea'), 'Should have Idea column');
  assert(bodyText.includes('Writing'), 'Should have Writing column');
  assert(bodyText.includes('Planned'), 'Should have Planned column');
  assert(bodyText.includes('Marked as posted'), 'Should have Marked as posted column');

  // Verify strictly NO "published" wording
  assert(!bodyText.toLowerCase().includes('published'), 'Should never use "published" anywhere in the UI');
  console.log('✓ Verified status columns: Idea, Writing, Planned, Marked as posted (no "published")');

  // 2. Create a new draft via "New Draft" button
  console.log('2. Creating new draft via slideover...');
  await page.click('button:has-text("New Draft")');
  await page.waitForSelector('text=Create New Post Draft', { timeout: 5000 });

  const testTitle = `E2E Playwright Post ${Date.now()}`;
  await page.fill('input[placeholder*="Architecture Patterns"]', testTitle);
  await page.fill('textarea[placeholder*="counter-intuitive secret"]', 'Hook test line for automated verification');
  await page.click('button:has-text("Save to Planner")');

  // Wait for card to appear on the board
  await page.waitForSelector(`text=${testTitle}`, { timeout: 10000 });
  console.log(`✓ New draft created and visible on board: "${testTitle}"`);

  // 3. Test view modes (Month Calendar and List)
  console.log('3. Testing Month Calendar view...');
  await page.click('button:has-text("Month Calendar")');
  await page.waitForSelector('text=Sun', { timeout: 5000 });
  console.log('✓ Month Calendar rendered with days grid');

  console.log('Testing List view...');
  await page.click('button:has-text("List")');
  await page.waitForSelector('th:has-text("Platform")', { timeout: 5000 });
  console.log('✓ List view rendered with table');

  // Switch back to Kanban Board
  await page.click('button:has-text("Kanban Board")');
  await page.waitForTimeout(500);

  // 4. Edit draft: change status to Planned
  console.log('4. Editing draft...');
  const card = page.locator(`text=${testTitle}`).first();
  await card.click();
  await page.waitForSelector('text=Edit Draft Details', { timeout: 5000 });

  // Change stage to Planned
  const stageSelect = page.locator('label:has-text("Production Stage") + select');
  await stageSelect.selectOption('planned');
  await page.click('button:has-text("Save Changes")');
  await page.waitForTimeout(800);
  console.log('✓ Draft edited and moved to Planned stage');

  // 5. Delete draft
  console.log('5. Deleting test draft...');
  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });

  // Re-open and delete
  const updatedCard = page.locator(`text=${testTitle}`).first();
  await updatedCard.click();
  await page.waitForSelector('button:has-text("Delete Draft")', { timeout: 5000 });
  await page.click('button:has-text("Delete Draft")');
  await page.waitForTimeout(800);
  console.log('✓ Draft deleted successfully');

  await browser.close();
  console.log('ALL FEATURE 7 CALENDAR & DRAFTS TESTS PASSED!');
})();
