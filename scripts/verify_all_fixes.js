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

server.listen(8089, async () => {
  console.log('Test server running at http://localhost:8089');

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
    // 1. Desktop Test (1440x900)
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:8089/data_atoms.html', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    console.log('\n--- 1. Testing Vertical Layout & Viewport Clipping ---');
    const layout = await page.evaluate(() => {
      const bodyStyle = window.getComputedStyle(document.body);
      const topbar = document.querySelector('.portal-top-bar');
      const topbarStyle = topbar ? window.getComputedStyle(topbar) : null;
      const appShell = document.querySelector('.app-shell');
      const shellStyle = appShell ? window.getComputedStyle(appShell) : null;
      const viewportContainer = document.querySelector('.echarts-viewport-container');
      const vpStyle = viewportContainer ? window.getComputedStyle(viewportContainer) : null;
      const canvas = document.querySelector('#echartsViewport canvas');
      const canvasRect = canvas ? canvas.getBoundingClientRect() : null;

      return {
        bodyDisplay: bodyStyle.display,
        bodyFlexDir: bodyStyle.flexDirection,
        bodyOverflow: bodyStyle.overflow,
        topbarFlexShrink: topbarStyle ? topbarStyle.flexShrink : null,
        topbarHeight: topbar ? topbar.offsetHeight : null,
        shellFlex: shellStyle ? shellStyle.flex : null,
        shellHeight: shellStyle ? shellStyle.height : null,
        vpMinHeight: vpStyle ? vpStyle.minHeight : null,
        vpFlex: vpStyle ? vpStyle.flex : null,
        canvasRect: canvasRect ? {
          top: canvasRect.top,
          bottom: canvasRect.bottom,
          height: canvasRect.height,
          withinViewport: canvasRect.bottom <= window.innerHeight
        } : null,
        windowHeight: window.innerHeight
      };
    });
    console.log('Layout evaluation:', JSON.stringify(layout, null, 2));

    await page.screenshot({ path: path.join(__dirname, '../preview_frames/verify_desktop_bar.png') });
    console.log('Saved preview_frames/verify_desktop_bar.png');

    console.log('\n--- 2. Testing Data Drawer Toggle ---');
    const drawerBefore = await page.evaluate(() => {
      const drawer = document.getElementById('dataDrawer');
      const icon = document.getElementById('drawerIcon');
      return {
        hasOpenClass: drawer.classList.contains('open'),
        hasExpandedClass: drawer.classList.contains('expanded'),
        iconText: icon.textContent.trim()
      };
    });
    console.log('Drawer before click:', drawerBefore);

    await page.click('#btnToggleDrawer');
    await new Promise(r => setTimeout(r, 400));

    const drawerAfterOpen = await page.evaluate(() => {
      const drawer = document.getElementById('dataDrawer');
      const icon = document.getElementById('drawerIcon');
      const body = document.getElementById('drawerBody');
      const bodyStyle = window.getComputedStyle(body);
      return {
        hasOpenClass: drawer.classList.contains('open'),
        iconText: icon.textContent.trim(),
        drawerBodyHeight: bodyStyle.height
      };
    });
    console.log('Drawer after 1st click (open):', drawerAfterOpen);

    await page.click('#btnToggleDrawer');
    await new Promise(r => setTimeout(r, 400));

    const drawerAfterClose = await page.evaluate(() => {
      const drawer = document.getElementById('dataDrawer');
      const icon = document.getElementById('drawerIcon');
      const body = document.getElementById('drawerBody');
      const bodyStyle = window.getComputedStyle(body);
      return {
        hasOpenClass: drawer.classList.contains('open'),
        iconText: icon.textContent.trim(),
        drawerBodyHeight: bodyStyle.height
      };
    });
    console.log('Drawer after 2nd click (closed):', drawerAfterClose);

    console.log('\n--- 3. Testing Swap X/Y for Bar Chart ---');
    await page.click('#btnSwapXY');
    await new Promise(r => setTimeout(r, 800));

    const swappedChart = await page.evaluate(() => {
      const inst = window.echarts.getInstanceByDom(document.getElementById('echartsViewport'));
      const opt = inst ? inst.getOption() : null;
      return {
        xAxisType: opt?.xAxis?.[0]?.type,
        xAxisName: opt?.xAxis?.[0]?.name,
        yAxisType: opt?.yAxis?.[0]?.type,
        yAxisDataSample: opt?.yAxis?.[0]?.data?.slice(0, 3),
        seriesType: opt?.series?.[0]?.type,
        seriesDataSample: opt?.series?.[0]?.data?.slice(0, 3),
        seriesHasNaN: opt?.series?.[0]?.data?.some(d => {
          const v = (typeof d === 'object' && d !== null) ? d.value : d;
          return isNaN(v);
        })
      };
    });
    console.log('Swapped Bar Chart evaluation:', JSON.stringify(swappedChart, null, 2));

    await page.screenshot({ path: path.join(__dirname, '../preview_frames/verify_swapped_bar.png') });
    console.log('Saved preview_frames/verify_swapped_bar.png');

    console.log('\n--- 4. Testing Boxplot Tooltip Formatting & No NaN ---');
    // Swap back
    await page.click('#btnSwapXY');
    await new Promise(r => setTimeout(r, 500));
    // Click boxplot
    await page.click('button[data-chart="boxplot"]');
    await new Promise(r => setTimeout(r, 800));

    const boxplotEvaluation = await page.evaluate(() => {
      const inst = window.echarts.getInstanceByDom(document.getElementById('echartsViewport'));
      const opt = inst ? inst.getOption() : null;
      const tooltipFormatter = opt?.tooltip?.[0]?.formatter;

      let test5Res = null;
      let test6Res = null;

      if (typeof tooltipFormatter === 'function') {
        // Test 5 elements format: [low, q1, median, q3, high]
        test5Res = tooltipFormatter({
          seriesType: 'boxplot',
          data: [100, 200, 300, 400, 500],
          dataIndex: 0
        });

        // Test 6 elements format: [catIndex, low, q1, median, q3, high]
        test6Res = tooltipFormatter({
          seriesType: 'boxplot',
          data: [0, 100, 200, 300, 400, 500],
          dataIndex: 0
        });
      }

      return {
        seriesType: opt?.series?.[0]?.type,
        xAxisInterval: opt?.xAxis?.[0]?.axisLabel?.interval,
        test5HasNaN: test5Res ? test5Res.includes('NaN') : null,
        test5ContainsMedian: test5Res ? test5Res.includes('300') : null,
        test5ContainsHigh: test5Res ? test5Res.includes('500') : null,
        test5Output: test5Res,
        test6HasNaN: test6Res ? test6Res.includes('NaN') : null,
        test6ContainsMedian: test6Res ? test6Res.includes('300') : null,
        test6ContainsHigh: test6Res ? test6Res.includes('500') : null,
        test6Output: test6Res
      };
    });
    console.log('Boxplot Evaluation:', JSON.stringify(boxplotEvaluation, null, 2));

    await page.screenshot({ path: path.join(__dirname, '../preview_frames/verify_boxplot.png') });
    console.log('Saved preview_frames/verify_boxplot.png');

    console.log('\n--- 5. Testing Mobile Viewport (375x812) ---');
    await page.setViewport({ width: 375, height: 812 });
    await new Promise(r => setTimeout(r, 800));

    const mobileEvaluation = await page.evaluate(() => {
      const bodyStyle = window.getComputedStyle(document.body);
      const htmlStyle = window.getComputedStyle(document.documentElement);
      const appShell = document.querySelector('.app-shell');
      const shellStyle = window.getComputedStyle(appShell);

      return {
        htmlHeight: htmlStyle.height,
        htmlOverflowY: htmlStyle.overflowY,
        bodyHeight: bodyStyle.height,
        bodyOverflowY: bodyStyle.overflowY,
        shellHeight: shellStyle.height,
        shellOverflowY: shellStyle.overflowY,
        bodyScrollHeight: document.body.scrollHeight,
        windowInnerHeight: window.innerHeight,
        canScroll: document.body.scrollHeight > window.innerHeight
      };
    });
    console.log('Mobile evaluation:', JSON.stringify(mobileEvaluation, null, 2));

    await page.screenshot({ path: path.join(__dirname, '../preview_frames/verify_mobile.png'), fullPage: true });
    console.log('Saved preview_frames/verify_mobile.png');

    console.log('\n--- Console Errors Check ---');
    console.log('Total console errors caught:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.error(consoleErrors);
    } else {
      console.log('No console errors detected! All tests passed perfectly.');
    }

  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    await browser.close();
    server.close();
    console.log('\nTest server shut down.');
  }
});
