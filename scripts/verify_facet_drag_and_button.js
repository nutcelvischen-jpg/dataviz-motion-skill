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

server.listen(8095, async () => {
  console.log('Facet button & drag verification running at http://localhost:8095');

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
    await page.goto('http://localhost:8095/data_atoms.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));

    console.log('\n--- Test 1: Check jp_age_structure (User Screenshot Dataset) ---');
    await page.evaluate(() => {
      const select = document.getElementById('datasetQuickSelect');
      select.value = 'jp_age_structure';
      select.dispatchEvent(new Event('change'));
    });
    await new Promise(r => setTimeout(r, 1000));

    // Verify +面 button exists on dimension pills
    const dimButtons = await page.evaluate(() => {
      const dimItems = Array.from(document.querySelectorAll('#dimensionsList .field-pill'));
      return dimItems.map(item => {
        const name = item.querySelector('.field-name-text')?.textContent?.trim();
        const btns = Array.from(item.querySelectorAll('.field-quick-btn')).map(b => b.textContent.trim());
        const hasFacetBtn = !!item.querySelector('.field-quick-btn.facet-btn');
        return { name, btns, hasFacetBtn };
      });
    });
    console.log('Dimension pills button inspection in jp_age_structure:', JSON.stringify(dimButtons, null, 2));

    dimButtons.forEach(dim => {
      if (!dim.btns.includes('+面') || !dim.hasFacetBtn) {
        throw new Error(`FAIL: Dimension "${dim.name}" missing +面 button! Buttons found: ${dim.btns.join(', ')}`);
      }
    });
    console.log('SUCCESS: All dimensions in jp_age_structure have the [+面] button!');

    // Capture screenshot of the sidebar dock matching user's view
    const sidebar = await page.$('#sidebarDock');
    if (sidebar) {
      await sidebar.screenshot({ path: '<LOCAL_PATH>/test_sidebar_facet_btn.png' });
      console.log('Saved sidebar screenshot: test_sidebar_facet_btn.png');
    }

    console.log('\n--- Test 2: Switch to jp_gender_cities and click [+面] on 性別 ---');
    await page.evaluate(() => {
      const select = document.getElementById('datasetQuickSelect');
      select.value = 'jp_gender_cities';
      select.dispatchEvent(new Event('change'));
    });
    await new Promise(r => setTimeout(r, 1000));

    // Find the 性別 field and click its +面 button
    const clickSuccess = await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('#dimensionsList .field-pill'));
      const genderPill = pills.find(p => p.querySelector('.field-name-text')?.textContent?.includes('性別'));
      if (!genderPill) return false;
      const facetBtn = genderPill.querySelector('.facet-btn');
      if (!facetBtn) return false;
      facetBtn.click();
      return true;
    });
    console.log('Clicked [+面] on 性別:', clickSuccess);
    if (!clickSuccess) throw new Error('FAIL: Could not find or click [+面] on 性別');
    await new Promise(r => setTimeout(r, 1200));

    // Check shelfFacet state
    const facetState = await page.evaluate(() => {
      const shelf = document.getElementById('shelfFacet');
      const pill = shelf?.querySelector('.shelf-pill-name')?.textContent?.trim();
      const chartInstance = window.PyGWalker?.getEChartsInstance ? window.PyGWalker.getEChartsInstance() : null;
      const opt = chartInstance ? chartInstance.getOption() : null;
      return {
        shelfPill: pill,
        hasGrid: Array.isArray(opt?.grid),
        gridCount: opt?.grid?.length || 0,
        titleCount: opt?.title?.length || 0
      };
    });
    console.log('Facet state after clicking [+面]:', facetState);
    if (facetState.shelfPill !== '性別') {
      throw new Error(`FAIL: Expected shelfFacet to have "性別", but got "${facetState.shelfPill}"`);
    }
    if (facetState.gridCount !== 2) {
      throw new Error(`FAIL: Expected 2 grids in ECharts, but got ${facetState.gridCount}`);
    }
    console.log('SUCCESS: Gender Facet small multiples rendered with 2 grids!');

    // Capture screenshot of the resulting 2-panel chart
    await page.screenshot({ path: '<LOCAL_PATH>/test_facet_gender_clicked.png' });
    console.log('Saved screenshot: test_facet_gender_clicked.png');

    console.log('\n--- Test 3: Drag shelf pill from Color to Facet ---');
    // First reset facet and put 性別 in Color
    await page.evaluate(() => {
      window.PyGWalker.clearShelf('facet');
      window.PyGWalker.assignToShelf('color', '性別');
    });
    await new Promise(r => setTimeout(r, 800));

    // Simulate drag and drop from shelfColor to shelfFacet
    const dragResult = await page.evaluate(() => {
      const colorPill = document.querySelector('#shelfColor .shelf-pill');
      const facetTarget = document.getElementById('shelfFacet');
      const facetGroup = facetTarget?.closest('.shelf-group');
      if (!colorPill || !facetGroup) return { success: false, reason: 'elements not found' };

      // Dispatch dragstart
      const dt = new DataTransfer();
      const dragStartEvt = new DragEvent('dragstart', { dataTransfer: dt, bubbles: true });
      colorPill.dispatchEvent(dragStartEvt);

      // Dispatch dragover & drop on facetGroup
      const dropEvt = new DragEvent('drop', { dataTransfer: dt, bubbles: true });
      facetGroup.dispatchEvent(dropEvt);

      return {
        success: true,
        facetPill: document.querySelector('#shelfFacet .shelf-pill-name')?.textContent?.trim(),
        colorPill: document.querySelector('#shelfColor .shelf-pill-name')?.textContent?.trim()
      };
    });
    console.log('Shelf pill drag result:', dragResult);
    if (dragResult.facetPill !== '性別') {
      throw new Error(`FAIL: Drag from Color to Facet failed, facetPill is "${dragResult.facetPill}"`);
    }
    console.log('SUCCESS: Dragging shelf pill between shelves works perfectly!');

    console.log('\nAll tests passed successfully!');
    if (consoleErrors.length > 0) {
      console.warn('Console warnings/errors:', consoleErrors);
    } else {
      console.log('ZERO console errors!');
    }

  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
});
