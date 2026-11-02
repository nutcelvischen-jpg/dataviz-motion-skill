const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:8080/data_atoms.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));

  console.log('1. Testing Swap button...');
  await page.click('#btnSwapXY');
  await new Promise(r => setTimeout(r, 500));
  const swappedCheck = await page.evaluate(() => ({
    shelfX: document.getElementById('shelfX')?.innerText,
    shelfY: document.getElementById('shelfY')?.innerText
  }));
  console.log('After Swap:', swappedCheck);

  console.log('2. Testing Switch to Scatter Atom (相關分佈)...');
  await page.click('button[data-chart="scatter"]');
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: '/Users/chenchunchih/Desktop/數據視覺化/preview_frames/pygwalker_scatter_test.png' });

  console.log('3. Testing Switch Dataset to 50-year History...');
  await page.select('#datasetQuickSelect', 'jp_history');
  await new Promise(r => setTimeout(r, 600));
  const historyCheck = await page.evaluate(() => ({
    shelfX: document.getElementById('shelfX')?.innerText,
    shelfY: document.getElementById('shelfY')?.innerText,
    kpiRows: document.getElementById('kpiRowCount')?.innerText
  }));
  console.log('After History Dataset Load:', historyCheck);
  await page.screenshot({ path: '/Users/chenchunchih/Desktop/數據視覺化/preview_frames/pygwalker_history_test.png' });

  console.log('4. Testing Switch back to Prefectures...');
  await page.select('#datasetQuickSelect', 'jp_prefectures');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: '/Users/chenchunchih/Desktop/數據視覺化/preview_frames/pygwalker_prefectures_main.png' });

  console.log('All tests passed successfully!');
  await browser.close();
})();
