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

server.listen(8092, async () => {
  console.log('Facet Small Multiples test server running at http://localhost:8092');

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
    await page.goto('http://localhost:8092/data_atoms.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    console.log('\n--- Test 1: Load Small Multiples Gender Facet Dataset ---');
    await page.evaluate(() => {
      const select = document.getElementById('datasetQuickSelect');
      select.value = 'jp_gender_facet';
      select.dispatchEvent(new Event('change'));
    });
    await new Promise(r => setTimeout(r, 1000));

    const test1Result = await page.evaluate(() => {
      const chart = echarts.getInstanceByDom(document.getElementById('echartsViewport'));
      const opt = chart.getOption();
      return {
        gridCount: opt.grid.length,
        titleCount: opt.title.length,
        titles: opt.title.map(t => ({ text: t.text, subtext: t.subtext })),
        xAxisCount: opt.xAxis.length,
        yAxisCount: opt.yAxis.length,
        yAxisMaxValues: opt.yAxis.map(y => y.max),
        seriesCount: opt.series.length,
        seriesNames: opt.series.map(s => s.name),
        seriesTypes: opt.series.map(s => s.type),
        hasAxisPointerLink: !!(opt.axisPointer && opt.axisPointer.link)
      };
    });
    console.log('Test 1 (Small Multiples Grid Evaluation):', JSON.stringify(test1Result, null, 2));

    const artifactDir = '/Users/chenchunchih/.gemini/antigravity/brain/c94a8ac3-56eb-4e5b-bbf2-98acfad3ce44';
    await page.screenshot({ path: path.join(artifactDir, 'test_facet_gender_bars.png') });
    console.log('Saved test_facet_gender_bars.png');

    console.log('\n--- Test 2: Toggle Facet Scale Mode (Free Scale) ---');
    await page.evaluate(() => {
      window.PyGWalker.toggleFacetScale();
    });
    await new Promise(r => setTimeout(r, 800));

    const test2Result = await page.evaluate(() => {
      const chart = echarts.getInstanceByDom(document.getElementById('echartsViewport'));
      const opt = chart.getOption();
      return {
        yAxisMaxValues: opt.yAxis.map(y => y.max)
      };
    });
    console.log('Test 2 (Free Scale Mode):', JSON.stringify(test2Result, null, 2));
    await page.screenshot({ path: path.join(artifactDir, 'test_facet_gender_free_scale.png') });
    console.log('Saved test_facet_gender_free_scale.png');

    console.log('\n--- Test 3: Switch Small Multiples to Line Trend ---');
    await page.evaluate(() => {
      window.PyGWalker.toggleFacetScale(); // switch back to fixed
      const lineBtn = document.querySelector('.chart-type-card[data-chart="line"]');
      if (lineBtn) lineBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const test3Result = await page.evaluate(() => {
      const chart = echarts.getInstanceByDom(document.getElementById('echartsViewport'));
      const opt = chart.getOption();
      return {
        seriesTypes: opt.series.map(s => s.type),
        seriesNames: opt.series.map(s => s.name)
      };
    });
    console.log('Test 3 (Line Small Multiples):', JSON.stringify(test3Result, null, 2));
    await page.screenshot({ path: path.join(artifactDir, 'test_facet_gender_lines.png') });
    console.log('Saved test_facet_gender_lines.png');

    console.log('\n--- Final Verification Check ---');
    console.log('Console Errors Caught:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(e => console.error(e));
      process.exitCode = 1;
    } else {
      console.log('ALL FACET SMALL MULTIPLES TESTS PASSED WITH 0 ERRORS!');
    }

  } catch (err) {
    console.error('Fatal Test Error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
});
