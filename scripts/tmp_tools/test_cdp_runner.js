const { spawn } = require('child_process');
const http = require('http');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('=== Starting CDP Test Runner ===');

  // 1. Start Python HTTP server on port 8089
  const server = spawn('python3', ['-m', 'http.server', '8089'], { stdio: 'inherit' });
  await wait(1000);

  // 2. Launch headless Chrome with remote debugging on port 9222 and open data_atoms.html
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1440,900',
    'http://127.0.0.1:8089/data_atoms.html'
  ]);

  let targetWsUrl = null;
  for (let i = 0; i < 25; i++) {
    await wait(300);
    try {
      const list = await fetchJson('http://127.0.0.1:9222/json/list');
      const pageTarget = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl);
      if (pageTarget) {
        targetWsUrl = pageTarget.webSocketDebuggerUrl;
        console.log('Connected to Chrome page target:', pageTarget.title, targetWsUrl);
        break;
      }
    } catch (e) {}
  }

  if (!targetWsUrl) {
    console.error('Failed to get page WebSocket URL from /json/list');
    server.kill();
    chrome.kill();
    process.exit(1);
  }

  const ws = new WebSocket(targetWsUrl);

  let idCounter = 1;
  const pendingRequests = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pendingRequests.has(msg.id)) {
      const { resolve, reject } = pendingRequests.get(msg.id);
      pendingRequests.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise(r => ws.onopen = r);

  function sendCdp(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pendingRequests.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await sendCdp('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      console.log('Exception details:', JSON.stringify(res.exceptionDetails));
      throw new Error(res.exceptionDetails.text || 'Evaluate exception');
    }
    return res.result ? res.result.value : undefined;
  }

  await sendCdp('Page.enable');
  await sendCdp('Runtime.enable');

  // Wait for document ready
  for (let i = 0; i < 30; i++) {
    await wait(300);
    try {
      const url = await evaluate(`window.location.href`);
      const readyState = await evaluate(`document.readyState`);
      const hasPyG = await evaluate(`!!window.PyGWalker`);
      if (url.includes('data_atoms.html') && readyState === 'complete' && hasPyG) {
        console.log('Page loaded completely:', url, readyState, 'PyGWalker ready');
        break;
      }
    } catch (e) {}
  }
  await wait(500);

  console.log('\n--- Test 1: Zero inline onclick in data_atoms.html & UI targets ---');
  const fs = require('fs');
  const htmlContent = fs.readFileSync('data_atoms.html', 'utf8');
  const staticInlineOnclicks = (htmlContent.match(/\bonclick\s*=/gi) || []).length;
  console.log('Static inline onclick occurrences in data_atoms.html:', staticInlineOnclicks);

  const targetElementsOnclick = await evaluate(`
    (() => {
      const ids = [
        'btnOpenSkillsModalTop',
        'btnCloseSkillsModal',
        'btnCopyEstatUrlTop',
        'btnCloseMultiMeasureModal',
        'btnCancelMultiMeasure',
        'btnConfirmMultiMeasure',
        'btnResetMultiMeasure',
        'btnResetStudioState'
      ];
      const found = ids.map(id => {
        const el = document.getElementById(id);
        return { id, exists: !!el, hasOnclick: el ? el.hasAttribute('onclick') : false };
      });
      const presets = Array.from(document.querySelectorAll('[data-action="apply-measure-preset"]'));
      const presetHasOnclick = presets.some(el => el.hasAttribute('onclick'));
      return { found, presetHasOnclick, totalPresets: presets.length };
    })()
  `);
  console.log('Target elements onclick check:', targetElementsOnclick);
  const targetAllZeroOnclick = targetElementsOnclick.found.every(f => !f.hasOnclick) && !targetElementsOnclick.presetHasOnclick;

  console.log('\n--- Test 2: Clean Event Delegation for Skills Modal ---');
  const skillsModalStateBefore = await evaluate(`document.getElementById('skillsModal').classList.contains('open')`);
  console.log('Skills modal before click:', skillsModalStateBefore);
  await evaluate(`document.getElementById('btnOpenSkillsModalTop').click()`);
  await wait(200);
  const skillsModalStateOpen = await evaluate(`document.getElementById('skillsModal').classList.contains('open')`);
  console.log('Skills modal after clicking open button:', skillsModalStateOpen);
  await evaluate(`document.getElementById('btnCloseSkillsModal').click()`);
  await wait(200);
  const skillsModalStateClosed = await evaluate(`document.getElementById('skillsModal').classList.contains('open')`);
  console.log('Skills modal after clicking close button:', skillsModalStateClosed);

  console.log('\n--- Test 3: Clean Event Delegation for Multi-Measure Modal ---');
  await evaluate(`window.PyGWalker.openMultiMeasureModal()`);
  await wait(200);
  const multiModalOpen = await evaluate(`document.getElementById('multiMeasureModal').classList.contains('open')`);
  console.log('Multi-measure modal opened:', multiModalOpen);

  // Test apply preset via delegation button
  const presetResult = await evaluate(`
    (() => {
      const btn = document.querySelector('[data-action="apply-measure-preset"]');
      if (btn) btn.click();
      return {
        shelfY: document.getElementById('shelfY')?.innerText,
        yMultiCount: window.PyGWalker.getState().shelf.yMulti.length
      };
    })()
  `);
  console.log('Preset applied via event delegation:', presetResult);

  // Test cancel/close via delegation button
  await evaluate(`document.getElementById('btnCancelMultiMeasure').click()`);
  await wait(200);
  const multiModalClosed = await evaluate(`document.getElementById('multiMeasureModal').classList.contains('open')`);
  console.log('Multi-measure modal closed via cancel button:', multiModalClosed);

  console.log('\n--- Test 4: Real ECharts Geo Map for Japan (47 Prefectures) ---');
  const geoResultJp = await evaluate(`
    (() => {
      window.PyGWalker.loadDataset('jp_prefectures');
      window.PyGWalker.setChartType('geo');
      const inst = window.PyGWalker.getEChartsInstance();
      const opt = inst ? inst.getOption() : null;
      const hasGeo = Boolean(opt && opt.geo && opt.geo.length > 0 && opt.geo[0].map === 'japan');
      const hasMapSeries = Boolean(opt && opt.series && opt.series.some(s => s.type === 'map' && s.map === 'japan'));
      const hasScatterSeries = Boolean(opt && opt.series && opt.series.some(s => s.type === 'scatter' && s.coordinateSystem === 'geo'));
      const isJapanRegistered = Boolean(window.echarts && window.echarts.getMap && window.echarts.getMap('japan'));
      return { hasGeo, hasMapSeries, hasScatterSeries, isJapanRegistered, seriesCount: opt ? opt.series.length : 0 };
    })()
  `);
  console.log('Japan Real Map Check:', geoResultJp);

  console.log('\n--- Test 5: Real ECharts Geo Map for Taiwan (22 Counties) ---');
  const geoResultTw = await evaluate(`
    (() => {
      window.PyGWalker.loadDataset('tw_housing');
      window.PyGWalker.setChartType('geo');
      const inst = window.PyGWalker.getEChartsInstance();
      const opt = inst ? inst.getOption() : null;
      const hasGeo = Boolean(opt && opt.geo && opt.geo.length > 0 && opt.geo[0].map === 'taiwan');
      const hasMapSeries = Boolean(opt && opt.series && opt.series.some(s => s.type === 'map' && s.map === 'taiwan'));
      const isTaiwanRegistered = Boolean(window.echarts && window.echarts.getMap && window.echarts.getMap('taiwan'));
      return { hasGeo, hasMapSeries, isTaiwanRegistered };
    })()
  `);
  console.log('Taiwan Real Map Check:', geoResultTw);

  console.log('\n--- Test 6: Fallback to Adaptive Scatter for Non-Map / World Dataset ---');
  const geoResultFallback = await evaluate(`
    (() => {
      window.PyGWalker.loadDataset('world_gdp');
      window.PyGWalker.setChartType('geo');
      const inst = window.PyGWalker.getEChartsInstance();
      const opt = inst ? inst.getOption() : null;
      const hasXAxis = Boolean(opt && opt.xAxis && opt.xAxis.length > 0);
      const hasYAxis = Boolean(opt && opt.yAxis && opt.yAxis.length > 0);
      const hasGeoCoord = Boolean(opt && opt.geo && opt.geo.length > 0);
      return { hasXAxis, hasYAxis, hasGeoCoord, chartType: window.PyGWalker.getState().chartType };
    })()
  `);
  console.log('World Geo Fallback Check:', geoResultFallback);

  console.log('\n--- Test 7: State Persistence Across Reload ---');
  // Set up custom state: add a new sheet, pin a chart, change zoom
  const stateSetup = await evaluate(`
    (() => {
      // Add sheet
      window.PyGWalker.addNewSheet();
      window.PyGWalker.setChartType('donut');
      // Pin chart
      window.PyGWalker.pinCurrentChart();
      // Apply zoom
      window.PyGWalker.applyZoom(120, false);
      const preState = {
        sheetCount: window.PyGWalker.getState().sheets.length,
        activeSheetId: window.PyGWalker.getState().activeSheetId,
        pinnedCount: window.PyGWalker.getState().pinnedCharts.length,
        zoomLevel: window.PyGWalker.getState().zoomLevel,
        storageItem: localStorage.getItem('data_atoms_studio_state_v1') ? true : false
      };
      return preState;
    })()
  `);
  console.log('State configured before reload:', stateSetup);

  // Reload the page
  console.log('Reloading page...');
  await evaluate(`location.reload()`);
  await wait(2500);

  // Check restored state
  const restoredState = await evaluate(`
    (() => {
      const state = window.PyGWalker.getState();
      return {
        sheetCount: state.sheets.length,
        activeSheetId: state.activeSheetId,
        activeChartType: state.chartType,
        pinnedCount: state.pinnedCharts.length,
        zoomLevel: state.zoomLevel,
        hasStorage: !!localStorage.getItem('data_atoms_studio_state_v1')
      };
    })()
  `);
  console.log('State restored after reload:', restoredState);

  console.log('\n--- Test 8: Reset Studio State (Clear Cache & Restore Defaults) ---');
  await evaluate(`
    (() => {
      // Trigger reset button via delegation or direct call
      document.getElementById('btnResetStudioState').click();
    })()
  `);
  await wait(500);

  const resetState = await evaluate(`
    (() => {
      const state = window.PyGWalker.getState();
      return {
        sheetCount: state.sheets.length,
        activeSheetId: state.activeSheetId,
        pinnedCount: state.pinnedCharts.length,
        zoomLevel: state.zoomLevel,
        toastText: document.getElementById('pygToast')?.innerText,
        storageKeyPresent: localStorage.getItem('data_atoms_studio_state_v1') !== null
      };
    })()
  `);
  console.log('State after Reset Studio State:', resetState);

  console.log('\n--- Test 9: Verify All 11 Data Atoms Functionality ---');
  const atoms = ['bar', 'line', 'dual', 'geo', 'boxplot', 'violin', 'treemap', 'scatter', 'donut', 'radar', 'funnel'];
  const atomResults = {};
  for (const atom of atoms) {
    const res = await evaluate(`
      (() => {
        window.PyGWalker.setChartType('${atom}');
        const inst = window.PyGWalker.getEChartsInstance();
        const canvas = document.querySelector('#echartsViewport canvas');
        return {
          ok: !!inst && !!canvas,
          chartType: window.PyGWalker.getState().chartType
        };
      })()
    `);
    atomResults[atom] = res.ok;
  }
  console.log('11 Data Atoms render status:', atomResults);

  // Clean shutdown
  console.log('\nShutting down Chrome and test server...');
  ws.close();
  chrome.kill();
  server.kill();

  const allPassed = (
    staticInlineOnclicks === 0 &&
    targetAllZeroOnclick === true &&
    skillsModalStateOpen === true && skillsModalStateClosed === false &&
    multiModalOpen === true && multiModalClosed === false &&
    geoResultJp.hasGeo === true && geoResultJp.hasMapSeries === true &&
    geoResultTw.hasGeo === true && geoResultTw.hasMapSeries === true &&
    geoResultFallback.hasXAxis === true && geoResultFallback.hasGeoCoord === false &&
    restoredState.sheetCount === stateSetup.sheetCount &&
    restoredState.pinnedCount === stateSetup.pinnedCount &&
    restoredState.zoomLevel === stateSetup.zoomLevel &&
    resetState.sheetCount === 1 && resetState.zoomLevel === 100 &&
    Object.values(atomResults).every(v => v === true)
  );

  console.log('\n=======================================');
  console.log(allPassed ? '>>> ALL CDP TESTS PASSED PERFECTLY! <<<' : '>>> SOME CDP TESTS FAILED! <<<');
  console.log('=======================================\n');

  process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal CDP error:', err);
  process.exit(1);
});
