/**
 * Automated Screenshot Capture for College CCE 4 ML Project Report
 * Captures high-definition (1440x900) full-page screenshots of all 10 key CreatorPulse AI features.
 */
const { chromium } = require('../frontend/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'screenshots', 'cce_report');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function capture() {
  console.log('Starting Playwright browser for CCE 4 screenshot capture...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5, // Crisp retina-quality rendering for project report
  });

  await context.addInitScript(() => {
    window.localStorage.setItem('creatorpulse_tour_seen', 'true');
    window.localStorage.setItem('creatorpulse_theme', 'light');
  });

  const page = await context.newPage();

  // 1. MAIN DASHBOARD
  console.log('1. Capturing Main Dashboard...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '01_main_dashboard.png'), fullPage: false });
  console.log('✓ Saved 01_main_dashboard.png');

  // 2. CREATOR INTELLIGENCE / AUDIENCE VOICE
  console.log('2. Capturing Creator Intelligence (Audience Voice)...');
  await page.goto('http://localhost:5173/comments', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '02_creator_intelligence_audience_voice.png'), fullPage: true });
  console.log('✓ Saved 02_creator_intelligence_audience_voice.png');

  // 3. VIBECHECK AI - SENTIMENT ANALYSIS
  console.log('3. Capturing VibeCheck AI (Sentiment & Audience Vibe Analysis)...');
  await page.goto('http://localhost:5173/vibecheck', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Switch to Pasted Comments and analyze realistic community comments
  await page.click('button:has-text("Pasted Comments")');
  await page.waitForTimeout(500);

  const sampleComments = (
    "Vikram: The architectural explanation at 04:15 was pure gold! Can you do a follow-up on SQLite WAL mode?\n" +
    "Sarah: Absolutely loved the pacing and visual diagrams. Subscribed!\n" +
    "Marcus: Clear, concise, no fluff. Best technical tutorial this week.\n" +
    "Elena: How do you handle database migration rollbacks in production without downtime?\n" +
    "Rohan: Awesome sound design and editing quality."
  );
  const textarea = page.locator('textarea').first();
  await textarea.fill(sampleComments);
  await page.click('button:has-text("Analyze Comments")');
  await page.waitForSelector('text=Audience Vibe Score', { timeout: 15000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT_DIR, '03_vibecheck_sentiment_analysis.png'), fullPage: true });
  console.log('✓ Saved 03_vibecheck_sentiment_analysis.png');

  // 4. VIRALSCOPE - ML PREDICTION (POST PREDICTOR)
  console.log('4a. Capturing ViralScope (Post Predictor)...');
  await page.goto('http://localhost:5173/predictor', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Enter realistic technical post
  const captionInput = page.locator('textarea').first();
  await captionInput.fill(
    "10 System Design Principles That Scaled Our Backend to 1M Users. From asynchronous job queues to zero-copy serialization #softwareengineering #systemdesign #distributed"
  );
  await page.waitForTimeout(600);
  await page.click('button:has-text("See Your Hit Chance")');
  await page.waitForSelector('text=Your hit chance', { timeout: 15000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT_DIR, '04a_viralscope_post_predictor.png'), fullPage: true });
  console.log('✓ Saved 04a_viralscope_post_predictor.png');

  // 4b. VIRALSCOPE - PREDICTION TRACKER & RESULTS
  console.log('4b. Capturing ViralScope (Prediction Results & Tracker)...');
  await page.goto('http://localhost:5173/results', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '04b_viralscope_prediction_results.png'), fullPage: true });
  console.log('✓ Saved 04b_viralscope_prediction_results.png');

  // 5. REELGENIUS - AI CONTENT STUDIO
  console.log('5. Capturing ReelGenius (AI Content Studio & Tournament Angles)...');
  await page.goto('http://localhost:5173/studio', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const topicInput = page.locator('textarea').first();
  await topicInput.fill('Building Autonomous AI Agents with FastAPI and React');
  
  // First run Tournament
  const rankBtn = page.locator('button:has-text("Rank Top 10")');
  if (await rankBtn.count() > 0) {
    await rankBtn.click();
    await page.waitForTimeout(1000);
  }

  // Then generate full creative package
  await page.click('button:has-text("Generate Content Package")');
  await page.waitForSelector('text=Edit Copy', { timeout: 15000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT_DIR, '05_reelgenius_content_studio.png'), fullPage: true });
  console.log('✓ Saved 05_reelgenius_content_studio.png');

  // 6. TREND EXPLORER
  console.log('6. Capturing Trend Explorer (Live Radar & Growth Velocity)...');
  await page.goto('http://localhost:5173/trends', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '06_trend_explorer.png'), fullPage: true });
  console.log('✓ Saved 06_trend_explorer.png');

  // 7. COMPETITOR ANALYSIS
  console.log('7. Capturing Competitor Analysis (Benchmarking & Outlier Posts)...');
  await page.goto('http://localhost:5173/competitors', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '07_competitor_analysis.png'), fullPage: true });
  console.log('✓ Saved 07_competitor_analysis.png');

  // 8. MODEL TESTS / ML LAB
  console.log('8a. Capturing Model Tests (Imbalance Lab Benchmark Overview)...');
  await page.goto('http://localhost:5173/ml-lab', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '08a_model_tests_ml_lab.png'), fullPage: true });
  console.log('✓ Saved 08a_model_tests_ml_lab.png');

  // 8b. MODEL TESTS - SLIDE OVER INSPECTION
  console.log('8b. Capturing Model Tests Technique Slide-Over Inspection...');
  try {
    const cardEl = page.locator('text=Balanced decision trees').first();
    await cardEl.scrollIntoViewIfNeeded();
    await cardEl.click({ force: true });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT_DIR, '08b_model_tests_technique_details.png'), fullPage: false });
    console.log('✓ Saved 08b_model_tests_technique_details.png');
  } catch (err) {
    console.warn('Could not capture 08b slide-over:', err.message);
  }

  // 9. REPORTS AND ANALYTICS
  console.log('9. Capturing Reports and Analytics...');
  await page.goto('http://localhost:5173/reports', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '09_reports_and_analytics.png'), fullPage: true });
  console.log('✓ Saved 09_reports_and_analytics.png');

  // 10. CALENDAR AND DRAFTS (CONTENT PLANNING)
  console.log('10. Capturing Calendar and Content Planning (Stages & Scheduling)...');
  await page.goto('http://localhost:5173/drafts', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '10_calendar_and_drafts.png'), fullPage: true });
  console.log('✓ Saved 10_calendar_and_drafts.png');

  // 11. CONNECT ACCOUNTS / DATA PROVENANCE SETTINGS
  console.log('11. Capturing Connect Accounts & Data Provenance Settings...');
  await page.goto('http://localhost:5173/settings', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, '11_connect_accounts_data_settings.png'), fullPage: true });
  console.log('✓ Saved 11_connect_accounts_data_settings.png');

  await browser.close();
  console.log('\nAll 12 CCE project screenshots successfully captured and saved in:');
  console.log(OUT_DIR);
}

capture().catch((err) => {
  console.error('Error during screenshot capture:', err);
  process.exit(1);
});
