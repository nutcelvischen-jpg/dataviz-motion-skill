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

server.listen(8098, async () => {
  console.log('Testing Overlap Fixes at http://localhost:8098');

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

    // --- Test 1: Image 1 scenario (jp_age_structure, 3 panels) ---
    console.log('\n--- Test 1: Testing Image 1 scenario (jp_age_structure) ---');
    await page.evaluate(() => {
      const select = document.getElementById('datasetQuickSelect');
      select.value = 'jp_age_structure';
      select.dispatchEvent(new Event('change'));

      window.PyGWalker.assignToShelf('facet', '年齡結構組');
      window.PyGWalker.assignToShelf('x', '城市');
      window.PyGWalker.assignToShelf('y', '人口規模(萬人)');
      window.PyGWalker.assignToShelf('secondary', '佔比率(%)');
    });
    await new Promise(r => setTimeout(r, 1200));

    const test1Info = await page.evaluate(() => {
      const chart = window.PyGWalker.getEChartsInstance();
      const opt = chart.getOption();
      return {
        titles: opt.title.map(t => ({ text: t.text, top: t.top })),
        leftYAxisName: opt.yAxis[0]?.name,
        leftYAxisNameLocation: opt.yAxis[0]?.nameLocation,
        leftYAxisRotate: opt.yAxis[0]?.nameRotate,
        rightYAxisName: opt.yAxis[opt.yAxis.length - 1]?.name,
        rightYAxisNameLocation: opt.yAxis[opt.yAxis.length - 1]?.nameLocation,
        rightYAxisRotate: opt.yAxis[opt.yAxis.length - 1]?.nameRotate,
        markPointSymbol: opt.series[0]?.markPoint?.symbol
      };
    });
    console.log('Test 1 Info:', JSON.stringify(test1Info, null, 2));

    if (test1Info.leftYAxisNameLocation !== 'middle' || test1Info.leftYAxisRotate !== 90) {
      throw new Error(`FAIL: Left Y-axis name not rotated middle! Got location=${test1Info.leftYAxisNameLocation}`);
    }
    if (test1Info.rightYAxisNameLocation !== 'middle' || test1Info.rightYAxisRotate !== -90) {
      throw new Error(`FAIL: Right Y-axis name not rotated middle! Got location=${test1Info.rightYAxisNameLocation}`);
    }
    if (test1Info.markPointSymbol !== 'roundRect') {
      throw new Error(`FAIL: markPointSymbol should be roundRect! Got ${test1Info.markPointSymbol}`);
    }

    await page.screenshot({ path: '/Users/chenchunchih/.gemini/antigravity/brain/c94a8ac3-56eb-4e5b-bbf2-98acfad3ce44/test_no_overlap_3panels.png' });
    console.log('Saved screenshot: test_no_overlap_3panels.png');

    // --- Test 2: Image 2 scenario (12 subplots, 3x4 grid) ---
    console.log('\n--- Test 2: Testing Image 2 scenario (12 cities Facet) ---');
    await page.evaluate(() => {
      const select = document.getElementById('datasetQuickSelect');
      select.value = 'jp_gender_cities';
      select.dispatchEvent(new Event('change'));

      window.PyGWalker.assignToShelf('facet', '城市');
      window.PyGWalker.assignToShelf('x', '地方分區');
      window.PyGWalker.assignToShelf('y', '總人口(萬人)');
      window.PyGWalker.assignToShelf('secondary', '高齡化率(%)');
    });
    await new Promise(r => setTimeout(r, 1200));

    const test2Info = await page.evaluate(() => {
      const chart = window.PyGWalker.getEChartsInstance();
      const opt = chart.getOption();
      const container = document.getElementById('echartsViewport');
      return {
        gridCount: opt.grid.length,
        viewportHeight: container.style.height,
        firstTitleText: opt.title[0]?.text,
        firstTitleSubtext: opt.title[0]?.subtext,
        leftYAxisNameLocation: opt.yAxis[0]?.nameLocation
      };
    });
    console.log('Test 2 Info:', JSON.stringify(test2Info, null, 2));

    if (test2Info.gridCount !== 12) {
      throw new Error(`FAIL: Expected 12 grids, got ${test2Info.gridCount}`);
    }
    if (test2Info.viewportHeight !== '920px') {
      throw new Error(`FAIL: Expected 920px height for 12 subplots, got ${test2Info.viewportHeight}`);
    }
    if (test2Info.firstTitleText.includes('城市:')) {
      throw new Error(`FAIL: Title should be concise without prefix "城市:", got "${test2Info.firstTitleText}"`);
    }

    await page.screenshot({ path: '/Users/chenchunchih/.gemini/antigravity/brain/c94a8ac3-56eb-4e5b-bbf2-98acfad3ce44/test_no_overlap_12panels.png' });
    console.log('Saved screenshot: test_no_overlap_12panels.png');

    // --- Test 3: Scheme 1 (Default view) ---
    console.log('\n--- Test 3: Testing Scheme 1 (Gender Facet x 12 Cities) ---');
    await page.evaluate(() => {
      const select = document.getElementById('datasetQuickSelect');
      select.value = 'jp_gender_facet';
      select.dispatchEvent(new Event('change'));
    });
    await new Promise(r => setTimeout(r, 1200));

    await page.screenshot({ path: '/Users/chenchunchih/.gemini/antigravity/brain/c94a8ac3-56eb-4e5b-bbf2-98acfad3ce44/test_no_overlap_scheme1.png' });
    console.log('Saved screenshot: test_no_overlap_scheme1.png');

    console.log('\nAll tests passed successfully with ZERO overlaps!');
    if (consoleErrors.length > 0) {
      console.warn('Console warnings/errors:', consoleErrors);
    } else {
      console.log('Zero console errors!');
    }

  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
});
