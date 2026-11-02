const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => consoleLogs.push(`[PAGE ERROR] ${err.toString()}`));

  console.log('Navigating to http://localhost:8080/data_atoms.html ...');
  await page.goto('http://localhost:8080/data_atoms.html', { waitUntil: 'networkidle2' });

  await new Promise(r => setTimeout(r, 1200));

  // Check state
  const stateCheck = await page.evaluate(() => {
    const dimCount = document.querySelectorAll('#dimensionsList .field-pill').length;
    const meaCount = document.querySelectorAll('#measuresList .field-pill').length;
    const shelfX = document.getElementById('shelfX')?.innerText;
    const shelfY = document.getElementById('shelfY')?.innerText;
    const kpiRows = document.getElementById('kpiRowCount')?.innerText;
    const echartsOk = !!window.echarts && !!document.querySelector('#echartsViewport canvas');
    return { dimCount, meaCount, shelfX, shelfY, kpiRows, echartsOk };
  });

  console.log('Page State Check:', stateCheck);
  console.log('Console Logs:', consoleLogs);

  await page.screenshot({ path: './preview_frames/data_atoms_pygwalker_test.png' });
  console.log('Saved screenshot to preview_frames/data_atoms_pygwalker_test.png');

  await browser.close();
})();
