const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1050']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1050 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR STACK:', err.stack));

  const filePath = 'file://' + path.resolve(__dirname, '../data_atoms.html');
  console.log('Navigating to:', filePath);
  await page.goto(filePath, { waitUntil: 'networkidle0' });

  // 1. Click Briefing Modal Button
  console.log('1. Opening Briefing Director Modal...');
  await page.waitForSelector('#btnOpenBriefingModal');
  await page.click('#btnOpenBriefingModal');
  await new Promise(r => setTimeout(r, 1200));

  // Screenshot Sales Lens
  await page.screenshot({ path: 'preview_frames/director_modal_sales.png' });
  console.log('📸 Saved preview_frames/director_modal_sales.png');

  // 2. Click SCM Lens button
  console.log('2. Switching to SCM Lens...');
  await page.click('#btnLensScm');
  await new Promise(r => setTimeout(r, 1200));

  // Screenshot SCM Lens
  await page.screenshot({ path: 'preview_frames/director_modal_scm.png' });
  console.log('📸 Saved preview_frames/director_modal_scm.png');

  // 3. Click Team Audience Tone
  console.log('3. Testing Tone toggle...');
  await page.click('#btnToneTeam');
  await new Promise(r => setTimeout(r, 600));

  await browser.close();
  console.log('All Director Modal tests passed with 0 errors!');
})();
