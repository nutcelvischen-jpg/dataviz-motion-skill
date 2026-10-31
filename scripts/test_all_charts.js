const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1100, deviceScaleFactor: 2 });
  await page.goto('file://' + path.resolve(__dirname, '../index.html'), { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  // Test Donut
  await page.select('#sampleDataSelector', 'donut');
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.resolve(__dirname, '../preview_frames/web_app_06_donut.png') });

  // Test Radar
  await page.select('#sampleDataSelector', 'radar');
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.resolve(__dirname, '../preview_frames/web_app_07_radar.png') });

  // Test Funnel
  await page.select('#sampleDataSelector', 'funnel');
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.resolve(__dirname, '../preview_frames/web_app_08_funnel.png') });

  // Test Overview
  await page.click('.chart-type-card[data-chart="overview"]');
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.resolve(__dirname, '../preview_frames/web_app_09_overview.png') });

  await browser.close();
  console.log('Saved all chart screenshots!');
})();
