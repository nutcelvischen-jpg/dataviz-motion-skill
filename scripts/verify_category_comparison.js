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

server.listen(8091, async () => {
  console.log('Category comparison test server running at http://localhost:8091');

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
    await page.goto('http://localhost:8091/data_atoms.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    console.log('\n--- Test 1: Load 2-group Gender Dataset (jp_gender_cities) ---');
    await page.evaluate(() => {
      const select = document.getElementById('datasetQuickSelect');
      select.value = 'jp_gender_cities';
      select.dispatchEvent(new Event('change'));
    });
    await new Promise(r => setTimeout(r, 1000));

    const test1Result = await page.evaluate(() => {
      const chart = echarts.getInstanceByDom(document.getElementById('echartsViewport'));
      const opt = chart.getOption();
      return {
        seriesCount: opt.series.length,
        seriesNames: opt.series.map(s => s.name),
        seriesTypes: opt.series.map(s => s.type),
        stackValues: opt.series.map(s => s.stack),
        xAxisDataLength: opt.xAxis[0].data.length,
        sampleXAxis: opt.xAxis[0].data.slice(0, 5),
        legendData: opt.legend[0].data
      };
    });
    console.log('Test 1 (Gender 2-group Bar):', JSON.stringify(test1Result, null, 2));

    const artifactDir = '<LOCAL_PATH>';
    await page.screenshot({ path: path.join(artifactDir, 'test_gender_grouped_bar.png') });
    console.log('Saved test_gender_grouped_bar.png');

    console.log('\n--- Test 2: Toggle Stacked Bar Mode (堆疊累計) ---');
    await page.evaluate(() => {
      window.PyGWalker.setBarStackMode(true);
    });
    await new Promise(r => setTimeout(r, 800));

    const test2Result = await page.evaluate(() => {
      const chart = echarts.getInstanceByDom(document.getElementById('echartsViewport'));
      const opt = chart.getOption();
      return {
        stackValues: opt.series.map(s => s.stack),
        isAllTotal: opt.series.every(s => s.stack === 'total')
      };
    });
    console.log('Test 2 (Stacked Bar):', JSON.stringify(test2Result, null, 2));
    await page.screenshot({ path: path.join(artifactDir, 'test_gender_stacked_bar.png') });
    console.log('Saved test_gender_stacked_bar.png');

    console.log('\n--- Test 3: Line Chart Multi-line Gender Comparison ---');
    await page.evaluate(() => {
      const lineBtn = document.querySelector('.chart-type-card[data-chart="line"]');
      if (lineBtn) lineBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const test3Result = await page.evaluate(() => {
      const chart = echarts.getInstanceByDom(document.getElementById('echartsViewport'));
      const opt = chart.getOption();
      return {
        chartType: opt.series[0].type,
        seriesCount: opt.series.length,
        seriesNames: opt.series.map(s => s.name),
        xAxisLength: opt.xAxis[0].data.length
      };
    });
    console.log('Test 3 (Multi-line Comparison):', JSON.stringify(test3Result, null, 2));
    await page.screenshot({ path: path.join(artifactDir, 'test_gender_line_comparison.png') });
    console.log('Saved test_gender_line_comparison.png');

    console.log('\n--- Test 4: Scatter Chart Multi-group Gender Comparison ---');
    await page.evaluate(() => {
      const scatterBtn = document.querySelector('.chart-type-card[data-chart="scatter"]');
      if (scatterBtn) scatterBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const test4Result = await page.evaluate(() => {
      const chart = echarts.getInstanceByDom(document.getElementById('echartsViewport'));
      const opt = chart.getOption();
      return {
        chartType: opt.series[0].type,
        seriesCount: opt.series.length,
        seriesNames: opt.series.map(s => s.name)
      };
    });
    console.log('Test 4 (Scatter Multi-group):', JSON.stringify(test4Result, null, 2));
    await page.screenshot({ path: path.join(artifactDir, 'test_gender_scatter.png') });
    console.log('Saved test_gender_scatter.png');

    console.log('\n--- Test 5: Donut Chart Aggregation by Gender ---');
    await page.evaluate(() => {
      const donutBtn = document.querySelector('.chart-type-card[data-chart="donut"]');
      if (donutBtn) donutBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    const test5Result = await page.evaluate(() => {
      const chart = echarts.getInstanceByDom(document.getElementById('echartsViewport'));
      const opt = chart.getOption();
      return {
        chartType: opt.series[0].type,
        sliceData: opt.series[0].data
      };
    });
    console.log('Test 5 (Donut Category Aggregation):', JSON.stringify(test5Result, null, 2));
    await page.screenshot({ path: path.join(artifactDir, 'test_gender_donut.png') });
    console.log('Saved test_gender_donut.png');

    console.log('\n--- Test 6: 3-group Age Structure Dataset (jp_age_structure) ---');
    await page.evaluate(() => {
      const select = document.getElementById('datasetQuickSelect');
      select.value = 'jp_age_structure';
      select.dispatchEvent(new Event('change'));
      const barBtn = document.querySelector('.chart-type-card[data-chart="bar"]');
      if (barBtn) barBtn.click();
      window.PyGWalker.setBarStackMode(false);
    });
    await new Promise(r => setTimeout(r, 1000));

    const test6Result = await page.evaluate(() => {
      const chart = echarts.getInstanceByDom(document.getElementById('echartsViewport'));
      const opt = chart.getOption();
      return {
        seriesCount: opt.series.length,
        seriesNames: opt.series.map(s => s.name),
        seriesTypes: opt.series.map(s => s.type),
        xAxisDataLength: opt.xAxis[0].data.length
      };
    });
    console.log('Test 6 (Age 3-group Bar):', JSON.stringify(test6Result, null, 2));
    await page.screenshot({ path: path.join(artifactDir, 'test_age_3groups_bar.png') });
    console.log('Saved test_age_3groups_bar.png');

    console.log('\n--- Final Verification Check ---');
    console.log('Console Errors Caught:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(e => console.error(e));
      process.exitCode = 1;
    } else {
      console.log('ALL CATEGORY COMPARISON TESTS PASSED WITH 0 ERRORS!');
    }

  } catch (err) {
    console.error('Fatal Test Error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
});
