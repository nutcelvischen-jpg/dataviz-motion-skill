const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/data_atoms.html';
  const filePath = path.join(__dirname, '..', reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const MIME_TYPES = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png'
    };
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/plain' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(8098, async () => {
  console.log('Edge-case test server running at http://localhost:8098');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(`[CONSOLE ERROR] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    consoleErrors.push(`[PAGE ERROR] ${err.toString()}`);
  });

  try {
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:8098/data_atoms.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // 1. Test Swapped Boxplot
    console.log('--- Testing Swapped Boxplot ---');
    await page.click('#btnSwapXY');
    await new Promise(r => setTimeout(r, 500));
    await page.click('button[data-chart="boxplot"]');
    await new Promise(r => setTimeout(r, 600));

    const swappedBoxplot = await page.evaluate(() => {
      const inst = window.echarts.getInstanceByDom(document.getElementById('echartsViewport'));
      const opt = inst ? inst.getOption() : null;
      const boxData = opt?.series?.[0]?.data;
      const hasNaN = boxData?.some(row => row.some(v => isNaN(v)));
      return {
        seriesType: opt?.series?.[0]?.type,
        groupCount: opt?.xAxis?.[0]?.data?.length,
        hasNaN,
        kpiSum: document.getElementById('kpiTotalSum')?.textContent
      };
    });
    console.log('Swapped Boxplot evaluation:', swappedBoxplot);

    if (swappedBoxplot.hasNaN) throw new Error('Swapped boxplot produced NaN values');

    // 2. Test Dirty CSV with commas and N/A
    console.log('--- Testing Dirty CSV with commas and N/A ---');
    const dirtyCSV = `地區,人口數,比例
台北市,"2,500,000",15.5%
新北市,"4,000,000",24.8%
台中市,N/A,18.2%
高雄市,"2,700,000",None`;

    const parsedTest = await page.evaluate((csv) => {
      const rows = [];
      const lines = csv.trim().split(/\r\n|\n|\r/);
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        // simple csv parse simulation
        const parts = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
        const obj = {};
        headers.forEach((h, idx) => {
          const val = (parts[idx] || '').trim().replace(/^"|"$/g, '');
          const cleaned = typeof val === 'string' ? val.replace(/[,%]/g, '').trim() : val;
          const num = Number(cleaned);
          obj[h] = !isNaN(num) && cleaned !== '' ? num : val;
        });
        rows.push(obj);
      }
      return rows;
    }, dirtyCSV);
    console.log('Parsed Dirty CSV rows:', parsedTest);

    if (typeof parsedTest[0]['人口數'] !== 'number' || parsedTest[0]['人口數'] !== 2500000) {
      throw new Error('Failed to parse comma-separated number');
    }

    console.log('All edge-case tests passed!');
  } catch (err) {
    console.error('Edge case test failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
});
