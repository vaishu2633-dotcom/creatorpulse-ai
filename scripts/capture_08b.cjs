const { chromium } = require('../frontend/node_modules/playwright');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'screenshots', 'cce_report');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });

  await context.addInitScript(() => {
    window.localStorage.setItem('creatorpulse_tour_seen', 'true');
    window.localStorage.setItem('creatorpulse_theme', 'light');
  });

  const page = await context.newPage();
  console.log('Navigating to ML Lab for slide-over capture...');
  await page.goto('http://localhost:5173/ml-lab', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Click on "Give hits more weight" card
  await page.click('text=Give hits more weight');
  await page.waitForSelector('text=Technical identifier:', { timeout: 10000 });
  await page.waitForTimeout(800);

  await page.screenshot({ path: path.join(OUT_DIR, '08b_model_tests_technique_details.png'), fullPage: false });
  console.log('✓ Successfully saved 08b_model_tests_technique_details.png');

  await browser.close();
})().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
