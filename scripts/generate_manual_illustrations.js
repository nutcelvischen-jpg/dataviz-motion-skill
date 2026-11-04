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

const OUT_DIR = '/Users/chenchunchih/Desktop/數據視覺化/docs/manual_images';

server.listen(8099, async () => {
  console.log('Generating illustrations on http://localhost:8099');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    await page.goto('http://localhost:8099/data_atoms.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    // 1. Step 1: X + Y Basic Bar Chart (Columns: 城市, Rows: 總人口)
    console.log('Generating Step 1: X + Y Basic Bar Chart...');
    await page.evaluate(() => {
      const select = document.getElementById('datasetQuickSelect');
      select.value = 'jp_gender_cities';
      select.dispatchEvent(new Event('change'));

      window.PyGWalker.clearShelf('facet');
      window.PyGWalker.clearShelf('color');
      window.PyGWalker.clearShelf('secondary');
      window.PyGWalker.assignToShelf('x', '城市');
      window.PyGWalker.assignToShelf('y', '總人口(萬人)');
    });
    await new Promise(r => setTimeout(r, 1000));
    const mainStageEl = await page.$('.main-stage');
    if (mainStageEl) {
      await mainStageEl.screenshot({ path: path.join(OUT_DIR, 'step1_xy_axes.png') });
    }

    // 2. Step 2: + Color (Grouped Bars)
    console.log('Generating Step 2: Color (Grouped Bars)...');
    await page.evaluate(() => {
      window.PyGWalker.assignToShelf('color', '性別');
      window.PyGWalker.setBarStackMode(false);
    });
    await new Promise(r => setTimeout(r, 1000));
    if (mainStageEl) {
      await mainStageEl.screenshot({ path: path.join(OUT_DIR, 'step2_color_grouped.png') });
    }

    // 3. Step 2b: + Color (Stacked Bars)
    console.log('Generating Step 2b: Color (Stacked Bars)...');
    await page.evaluate(() => {
      window.PyGWalker.setBarStackMode(true);
    });
    await new Promise(r => setTimeout(r, 1000));
    if (mainStageEl) {
      await mainStageEl.screenshot({ path: path.join(OUT_DIR, 'step2_color_stacked.png') });
    }

    // 4. Step 3: + Facet (Small Multiples: 性別 2 panels)
    console.log('Generating Step 3: Facet (Small Multiples)...');
    await page.evaluate(() => {
      window.PyGWalker.setBarStackMode(false);
      window.PyGWalker.assignToShelf('facet', '性別');
      window.PyGWalker.assignToShelf('color', '地方分區');
      window.PyGWalker.setFacetScaleMode('fixed');
    });
    await new Promise(r => setTimeout(r, 1200));
    if (mainStageEl) {
      await mainStageEl.screenshot({ path: path.join(OUT_DIR, 'step3_facet_small_multiples.png') });
    }

    // 5. Step 4: + Filters (Filter to Kanto & Kinki)
    console.log('Generating Step 4: Filters...');
    await page.evaluate(() => {
      window.PyGWalker.clearShelf('facet');
      window.PyGWalker.assignToShelf('color', '地方分區');
      window.PyGWalker.addFilter('地方分區');
      window.PyGWalker.setAllFilterValues('地方分區', false);
      window.PyGWalker.toggleFilterValue('地方分區', '關東地方');
      window.PyGWalker.toggleFilterValue('地方分區', '近畿地方');
    });
    await new Promise(r => setTimeout(r, 1200));
    if (mainStageEl) {
      await mainStageEl.screenshot({ path: path.join(OUT_DIR, 'step4_filter_focused.png') });
    }

    // 6. Step 5: Full Dashboard Combo (Scheme 1: Gender Facet + Dual Axis + Full Window)
    console.log('Generating Step 5: Full Dashboard View...');
    await page.evaluate(() => {
      const select = document.getElementById('datasetQuickSelect');
      select.value = 'jp_gender_facet';
      select.dispatchEvent(new Event('change'));
    });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUT_DIR, 'step5_combo_full_dashboard.png') });

    console.log('All manual illustration screenshots generated successfully!');
  } catch (err) {
    console.error('Error generating illustrations:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
});
