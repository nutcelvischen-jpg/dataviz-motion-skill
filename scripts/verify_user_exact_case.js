const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/data_atoms.html';
  const filePath = path.join(__dirname, '..', reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/plain' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(8096, async () => {
  console.log('Testing User Exact Case at http://localhost:8096');

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
    await page.goto('http://localhost:8096/data_atoms.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // Setup exact user configuration from screenshot:
    // Dataset: jp_gender_cities
    // X: 地方分區
    // Y: 總人口(萬人)
    // Color: 性別
    // Facet: 城市
    // Secondary: 高齡化率(%)
    await page.evaluate(() => {
      const select = document.getElementById('datasetQuickSelect');
      select.value = 'jp_gender_cities';
      select.dispatchEvent(new Event('change'));

      window.PyGWalker.assignToShelf('x', '地方分區');
      window.PyGWalker.assignToShelf('y', '總人口(萬人)');
      window.PyGWalker.assignToShelf('color', '性別');
      window.PyGWalker.assignToShelf('secondary', '高齡化率(%)');
      window.PyGWalker.assignToShelf('facet', '城市');
    });
    await new Promise(r => setTimeout(r, 1200));

    // 1. Check Fixed Mode (Initial)
    const fixedInfo = await page.evaluate(() => {
      const chart = window.PyGWalker.getEChartsInstance();
      const opt = chart.getOption();
      return {
        mode: window.PyGWalker.getState().facetScaleMode,
        firstGridXCategories: opt.xAxis[0].data,
        secondGridXCategories: opt.xAxis[1].data,
        firstSeriesData: opt.series[0].data
      };
    });
    console.log('Fixed Mode Info:', fixedInfo);
    await page.screenshot({ path: '/Users/chenchunchih/.gemini/antigravity/brain/c94a8ac3-56eb-4e5b-bbf2-98acfad3ce44/user_case_fixed.png' });

    // 2. Toggle to Free Scale Mode (Pruned Empty Categories)
    await page.evaluate(() => {
      window.PyGWalker.toggleFacetScale();
    });
    await new Promise(r => setTimeout(r, 1200));

    const freeInfo = await page.evaluate(() => {
      const chart = window.PyGWalker.getEChartsInstance();
      const opt = chart.getOption();
      return {
        mode: window.PyGWalker.getState().facetScaleMode,
        firstGridTitle: opt.title[0].text,
        firstGridXCategories: opt.xAxis[0].data,
        secondGridTitle: opt.title[1].text,
        secondGridXCategories: opt.xAxis[1].data,
        firstSeriesData: opt.series[0].data
      };
    });
    console.log('Free Mode Info:', freeInfo);
    await page.screenshot({ path: '/Users/chenchunchih/.gemini/antigravity/brain/c94a8ac3-56eb-4e5b-bbf2-98acfad3ce44/user_case_free.png' });

    // 3. Recommended Layout 1: Facet = 性別 (2 panels), X = 城市
    await page.evaluate(() => {
      window.PyGWalker.assignToShelf('facet', '性別');
      window.PyGWalker.assignToShelf('x', '城市');
      window.PyGWalker.assignToShelf('color', '地方分區');
      window.PyGWalker.setFacetScaleMode('fixed');
    });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: '/Users/chenchunchih/.gemini/antigravity/brain/c94a8ac3-56eb-4e5b-bbf2-98acfad3ce44/recommended_layout_gender_facet.png' });
    console.log('Saved recommended_layout_gender_facet.png');

    // 4. Recommended Layout 2: Facet = 城市 (12 panels), X = 性別
    await page.evaluate(() => {
      window.PyGWalker.assignToShelf('facet', '城市');
      window.PyGWalker.assignToShelf('x', '性別');
      window.PyGWalker.assignToShelf('color', '地方分區');
    });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: '/Users/chenchunchih/.gemini/antigravity/brain/c94a8ac3-56eb-4e5b-bbf2-98acfad3ce44/recommended_layout_city_facet_gender_x.png' });
    console.log('Saved recommended_layout_city_facet_gender_x.png');

    if (consoleErrors.length > 0) {
      console.warn('Console errors:', consoleErrors);
    } else {
      console.log('Zero console errors!');
    }

  } catch (err) {
    console.error('Test error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
});
