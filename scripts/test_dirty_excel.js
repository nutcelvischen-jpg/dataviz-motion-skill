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

  // Upload 07_真實企業數據_含格式與千分位_測試.xlsx
  const dirtyExcelPath = path.resolve(__dirname, '../sample_data/07_真實企業數據_含格式與千分位_測試.xlsx');
  const fileInput = await page.$('#fileInput');
  await fileInput.uploadFile(dirtyExcelPath);
  await new Promise(r => setTimeout(r, 1000));

  // Inspect detected column types
  const colTypes = await page.evaluate(() => {
    return {
      headers: window.headers || [],
      selectedX: document.getElementById('selectXAxis').value,
      selectedY: document.getElementById('selectYAxis').value,
      kpiTotal: document.getElementById('kpiTotalSum').textContent,
      kpiMean: document.getElementById('kpiMeanVal').textContent
    };
  });
  console.log('Parsed test dirty Excel results:', colTypes);

  const screenshotPath = path.resolve(__dirname, '../preview_frames/web_app_test_dirty_excel.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Saved screenshot of formatted excel test:', screenshotPath);

  await browser.close();
})();
