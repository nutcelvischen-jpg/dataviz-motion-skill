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
  await new Promise(r => setTimeout(r, 1500));

  // 1. Initial State Check
  const state1 = await page.evaluate(() => {
    const dimCount = document.querySelectorAll('#dimensionsList .field-pill').length;
    const meaCount = document.querySelectorAll('#measuresList .field-pill').length;
    const shelfX = document.getElementById('shelfX')?.innerText;
    const shelfY = document.getElementById('shelfY')?.innerText;
    const shelfFilters = document.getElementById('shelfFilters')?.innerText;
    const filterControls = document.querySelectorAll('#activeFiltersStrip .filter-tag').length;
    const echartsOk = !!window.echarts && !!document.querySelector('#echartsViewport canvas');
    const dataset = document.getElementById('datasetQuickSelect')?.value;
    return { dimCount, meaCount, shelfX, shelfY, shelfFilters, filterControls, echartsOk, dataset };
  });

  console.log('=== Test 1: Restored PyGWalker & Filters State ===');
  console.log(state1);

  await page.screenshot({ path: '<LOCAL_PATH>/restored_data_atoms_verified.png' });
  console.log('Saved restored_data_atoms_verified.png');

  // 2. Test Multi-Measure Comparison: Select 50-year history and compare 幼年 vs 勞動
  console.log('=== Test 2: Multi-Measure Comparison (幼年 vs 勞動人口占比) ===');
  await page.evaluate(() => {
    // Switch to 50-year history dataset
    document.getElementById('datasetQuickSelect').value = 'jp_history';
    document.getElementById('datasetQuickSelect').dispatchEvent(new Event('change'));
  });
  await new Promise(r => setTimeout(r, 1000));

  // Apply 2-measure preset (幼年 vs 勞動)
  await page.evaluate(() => {
    window.PyGWalker.applyMeasurePreset(['幼年人口占比(%)', '勞動人口占比(%)']);
  });
  await new Promise(r => setTimeout(r, 1000));

  const multiState2 = await page.evaluate(() => {
    const shelfY = document.getElementById('shelfY')?.innerText;
    const chartType = document.querySelector('.chart-type-dock-btn.active')?.dataset?.chart;
    const canvasExists = !!document.querySelector('#echartsViewport canvas');
    return { shelfY, chartType, canvasExists };
  });
  console.log('Multi-measure 2-indicator state:', multiState2);

  await page.screenshot({ path: '<LOCAL_PATH>/multimeasure_2lines_trend.png' });
  console.log('Saved multimeasure_2lines_trend.png');

  // 3. Test 3-Measure Comparison (幼年 vs 勞動 vs 老年)
  console.log('=== Test 3: Multi-Measure 3 Indicators (幼年 vs 勞動 vs 老年) ===');
  await page.evaluate(() => {
    window.PyGWalker.applyMeasurePreset(['幼年人口占比(%)', '勞動人口占比(%)', '老年人口占比(%)']);
  });
  await new Promise(r => setTimeout(r, 1000));

  const multiState3 = await page.evaluate(() => {
    const shelfY = document.getElementById('shelfY')?.innerText;
    return { shelfY };
  });
  console.log('Multi-measure 3-indicator state:', multiState3);

  await page.screenshot({ path: '<LOCAL_PATH>/multimeasure_3lines_trend.png' });
  console.log('Saved multimeasure_3lines_trend.png');

  // 4. Test Scatter Plot Comparison between 幼年 vs 勞動
  console.log('=== Test 4: Scatter Plot Correlation (幼年 vs 勞動) ===');
  await page.evaluate(() => {
    // Switch to prefectures dataset
    document.getElementById('datasetQuickSelect').value = 'jp_prefectures';
    document.getElementById('datasetQuickSelect').dispatchEvent(new Event('change'));
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    window.PyGWalker.applyMeasurePreset(['幼年人口占比(%)', '勞動人口占比(%)']);
    // Select scatter chart
    const scatterBtn = document.querySelector('[data-chart="scatter"]');
    if (scatterBtn) scatterBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: '<LOCAL_PATH>/multimeasure_scatter_correlation.png' });
  console.log('Saved multimeasure_scatter_correlation.png');

  console.log('Console Logs during test:', consoleLogs.filter(l => !l.includes('favicon')));

  await browser.close();
})();
