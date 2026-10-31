const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1100, deviceScaleFactor: 2 });

  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => consoleLogs.push(`[PAGE ERROR] ${err.message}`));

  const filePath = 'file://' + path.resolve(__dirname, '../index.html');
  console.log('Navigating to:', filePath);
  await page.goto(filePath, { waitUntil: 'networkidle0' });

  // Wait 1s for fonts and canvas to settle
  await new Promise(r => setTimeout(r, 1000));

  console.log('Page loaded. Checking console logs:');
  consoleLogs.forEach(l => console.log(l));

  // Take screenshot of default Bar chart
  const screenshotPath1 = path.resolve(__dirname, '../preview_frames/web_app_01_bar.png');
  await page.screenshot({ path: screenshotPath1, fullPage: false });
  console.log('Saved screenshot 1 (Bar):', screenshotPath1);

  // Switch to Line chart
  await page.click('.chart-type-card[data-chart="line"]');
  await new Promise(r => setTimeout(r, 500));
  const screenshotPath2 = path.resolve(__dirname, '../preview_frames/web_app_02_line.png');
  await page.screenshot({ path: screenshotPath2, fullPage: false });
  console.log('Saved screenshot 2 (Line):', screenshotPath2);

  // Switch to Scatter chart using sample selector
  await page.select('#sampleDataSelector', 'scatter');
  await new Promise(r => setTimeout(r, 500));
  const screenshotPath3 = path.resolve(__dirname, '../preview_frames/web_app_03_scatter.png');
  await page.screenshot({ path: screenshotPath3, fullPage: false });
  console.log('Saved screenshot 3 (Scatter):', screenshotPath3);

  // Test uploading actual Excel file
  const excelFilePath = path.resolve(__dirname, '../sample_data/商業數據全分析範例.xlsx');
  const fileInput = await page.$('#fileInput');
  await fileInput.uploadFile(excelFilePath);
  await new Promise(r => setTimeout(r, 1000));

  const screenshotPath4 = path.resolve(__dirname, '../preview_frames/web_app_04_uploaded_excel.png');
  await page.screenshot({ path: screenshotPath4, fullPage: false });
  console.log('Saved screenshot 4 (Uploaded Excel):', screenshotPath4);

  // Check Sheet selector
  const sheetCount = await page.evaluate(() => {
    const sel = document.getElementById('sheetSelector');
    return sel ? sel.options.length : 0;
  });
  console.log('Uploaded workbook sheet count:', sheetCount);

  // Switch to sheet 2 (時序月度趨勢)
  await page.select('#sheetSelector', '時序月度趨勢');
  await new Promise(r => setTimeout(r, 500));
  const screenshotPath5 = path.resolve(__dirname, '../preview_frames/web_app_05_sheet2.png');
  await page.screenshot({ path: screenshotPath5, fullPage: false });
  console.log('Saved screenshot 5 (Sheet 2):', screenshotPath5);

  await browser.close();
  console.log('Verification finished successfully!');
})();
