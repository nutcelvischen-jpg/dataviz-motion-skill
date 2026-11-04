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

server.listen(8097, async () => {
  console.log('Testing Scheme 1 Default at http://localhost:8097');

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
    // Go directly to page without touching dropdown or query parameters
    await page.goto('http://localhost:8097/data_atoms.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    // Verify Scheme 1 initial configuration
    const checkState = await page.evaluate(() => {
      const state = window.PyGWalker.getState();
      const chart = window.PyGWalker.getEChartsInstance();
      const opt = chart ? chart.getOption() : null;

      return {
        dataset: state.currentDatasetId,
        x: state.shelf.x,
        y: state.shelf.y,
        color: state.shelf.color,
        facet: state.shelf.facet,
        facetScaleMode: state.facetScaleMode,
        gridCount: opt?.grid?.length || 0,
        titleCount: opt?.title?.length || 0,
        titles: opt?.title?.map(t => t.text) || [],
        xCategoriesPanel0: opt?.xAxis?.[0]?.data || [],
        series0Count: opt?.series?.[0]?.data?.length || 0,
        series1Count: opt?.series?.[1]?.data?.length || 0
      };
    });

    console.log('Scheme 1 Initial State Inspection:', JSON.stringify(checkState, null, 2));

    if (checkState.dataset !== 'jp_gender_facet') {
      throw new Error(`FAIL: Expected jp_gender_facet, got ${checkState.dataset}`);
    }
    if (checkState.facet !== '性別' || checkState.x !== '城市') {
      throw new Error(`FAIL: Expected facet="性別" and x="城市", got facet="${checkState.facet}", x="${checkState.x}"`);
    }
    if (checkState.gridCount !== 2) {
      throw new Error(`FAIL: Expected 2 grids (男性 vs 女性), got ${checkState.gridCount}`);
    }

    console.log('SUCCESS: Scheme 1 is active by default with 2 panels!');

    // Screenshot full viewport
    await page.screenshot({ path: '<LOCAL_PATH>/verify_scheme_1_final.png' });
    console.log('Saved screenshot: verify_scheme_1_final.png');

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
