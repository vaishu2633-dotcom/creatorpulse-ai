const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const VIEWPORTS = [
  { width: 1280, height: 620, name: '1280x620' },
  { width: 1366, height: 650, name: '1366x650' },
  { width: 1440, height: 760, name: '1440x760' },
  { width: 1536, height: 730, name: '1536x730' },
  { width: 1920, height: 950, name: '1920x950' },
];

const CHECKS_DIR = path.join(__dirname, 'checks');
if (!fs.existsSync(CHECKS_DIR)) {
  fs.mkdirSync(CHECKS_DIR, { recursive: true });
}

// Find Chrome or Edge
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

async function run() {
  console.log('Launching browser with executable:', executablePath);
  const browser = await chromium.launch({
    executablePath,
    headless: true,
  });

  const results = [];

  for (const vp of VIEWPORTS) {
    for (const theme of ['light', 'dark']) {
      for (const dsf of [1, 1.25]) {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: dsf,
        });

        const page = await context.newPage();
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

        // Set theme
        if (theme === 'dark') {
          await page.evaluate(() => {
            document.documentElement.classList.add('dark');
            localStorage.setItem('creatorpulse_theme', 'dark');
          });
        } else {
          await page.evaluate(() => {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('creatorpulse_theme', 'light');
          });
        }
        await page.waitForTimeout(300);

        // Verification checks
        const check = await page.evaluate(() => {
          const docEl = document.documentElement;
          const windowHeight = window.innerHeight;
          const windowWidth = window.innerWidth;

          const hero = document.querySelector('section:nth-of-type(1)');
          const vibe = document.querySelector('section:nth-of-type(2)');
          const bottomRow = document.querySelector('section:nth-of-type(3)');
          const quickActions = bottomRow ? bottomRow.children[1] : null;
          const recentActivity = bottomRow ? bottomRow.children[0] : null;
          const firstRow = recentActivity ? recentActivity.querySelector('.divide-y > div') : null;

          function isElementVisible(el) {
            if (!el) return false;
            const r = el.getBoundingClientRect();
            return r.top >= 0 && r.bottom <= windowHeight + 4;
          }

          function isPartVisible(el) {
            if (!el) return false;
            const r = el.getBoundingClientRect();
            return r.top >= 0 && r.top < windowHeight - 30;
          }

          const pageScrolled = docEl.scrollHeight > windowHeight + 4;
          const heroVis = isElementVisible(hero);
          const vibeVis = isElementVisible(vibe);
          const quickActionsVis = isElementVisible(quickActions);
          const recentTitleVis = isPartVisible(recentActivity);
          const firstRowVis = isPartVisible(firstRow);

          return {
            windowHeight,
            windowWidth,
            docScrollHeight: docEl.scrollHeight,
            pageScrolled,
            heroVis,
            vibeVis,
            quickActionsVis,
            recentTitleVis,
            firstRowVis,
            allPass: !pageScrolled && heroVis && vibeVis && quickActionsVis && recentTitleVis && firstRowVis,
          };
        });

        const filename = `check-${vp.name}-${theme}${dsf === 1.25 ? '-scale125' : ''}.png`;
        const filePath = path.join(CHECKS_DIR, filename);
        await page.screenshot({ path: filePath });

        results.push({
          viewport: vp.name,
          theme,
          scale: `${dsf * 100}%`,
          ...check,
          filename,
        });

        console.log(`[${vp.name} | ${theme} | ${dsf * 100}%] Pass: ${check.allPass} | PageScroll: ${check.pageScrolled} | Hero: ${check.heroVis} | Vibe: ${check.vibeVis} | QuickActions: ${check.quickActionsVis} | FirstRow: ${check.firstRowVis}`);

        await context.close();
      }
    }
  }

  await browser.close();
  console.log('\n--- ALL CHECKS FINISHED ---');
}

run().catch((err) => {
  console.error('Run checks failed:', err);
  process.exit(1);
});
