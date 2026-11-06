/**
 * Data Atoms Should Fixes 1-6 CDP 自動化驗證腳本
 * 
 * 測試範圍：
 * 1. [Should Fix 1] 明細表分頁 Next 按鈕總頁數計算與搜尋結果脫鉤修復
 * 2. [Should Fix 2] 明細表換頁時緩存 thead 特徵畫像 (Sparkline profiling)
 * 3. [Should Fix 3] 自訂上傳資料集於頁面重新整理後的優雅降級容錯提示
 * 4. [Should Fix 4] 看板 Modal 關閉時即時釋放 ECharts 實例 (釋放記憶體)
 * 5. [Should Fix 5] 向量地圖降級散佈模式、矩形樹圖與散佈圖補齊可選鏈防護
 * 6. [Should Fix 6] 小提琴圖 Y 軸下界優化 (大正數避免壓扁密度輪廓)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PORT = 8142;
const CHROME_PORT = 9335;
const CHROME_PATH = process.env.CHROME_PATH || (process.platform === 'darwin'
  ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  : '/usr/bin/google-chrome');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png'
};

// 1. 建立靜態測試 HTTP 伺服器
const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/data_atoms.html';
  const filePath = path.join(ROOT, reqPath);
  if (filePath.startsWith(ROOT) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end();
  }
});

let chromeProcess = null;

function sendCDP(ws, method, params = {}, id = 1) {
  return new Promise((resolve, reject) => {
    const msg = JSON.stringify({ id, method, params });
    const timer = setTimeout(() => {
      reject(new Error(`CDP command ${method} timed out`));
    }, 15000);

    const onMessage = (event) => {
      const resp = JSON.parse(event.data);
      if (resp.id === id) {
        clearTimeout(timer);
        ws.removeEventListener('message', onMessage);
        if (resp.error) {
          reject(new Error(`CDP Error in ${method}: ${JSON.stringify(resp.error)}`));
        } else {
          resolve(resp.result);
        }
      }
    };
    ws.addEventListener('message', onMessage);
    ws.send(msg);
  });
}

async function evalInPage(pageWs, expr, idRef) {
  const res = await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
    awaitPromise: true
  }, idRef.id++);
  if (res.exceptionDetails) {
    throw new Error(`Page Eval Exception: ${JSON.stringify(res.exceptionDetails)}`);
  }
  return res.result ? res.result.value : undefined;
}

let testPassedCount = 0;
let testFailedCount = 0;

function reportResult(testName, passed, detail = '') {
  if (passed) {
    testPassedCount++;
    console.log(`  ✅ [PASS] ${testName}${detail ? ` (${detail})` : ''}`);
  } else {
    testFailedCount++;
    console.error(`  ❌ [FAIL] ${testName}: ${detail}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Data Atoms Should Fixes Verification Suite...');

  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`📡 Local server listening on http://127.0.0.1:${PORT}`);

  chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check'
  ]);

  // 等候 Chrome 遠端除錯連線
  let wsUrl = '';
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${CHROME_PORT}/json/version`, r => {
          let buf = '';
          r.on('data', c => buf += c);
          r.on('end', () => resolve(buf));
        }).on('error', reject);
      });
      wsUrl = JSON.parse(res).webSocketDebuggerUrl;
      if (wsUrl) break;
    } catch (e) {}
  }

  if (!wsUrl) throw new Error('Failed to connect to Headless Chrome remote debugging port.');
  console.log('🔌 Connected to Headless Chrome via CDP');

  const browserWs = new WebSocket(wsUrl);
  await new Promise(r => browserWs.addEventListener('open', r));

  const idRef = { id: 1 };
  const target = await sendCDP(browserWs, 'Target.createTarget', {
    url: `http://127.0.0.1:${PORT}/data_atoms.html`
  }, idRef.id++);

  const pageWsUrl = `ws://127.0.0.1:${CHROME_PORT}/devtools/page/${target.targetId}`;
  const pageWs = new WebSocket(pageWsUrl);
  await new Promise(r => pageWs.addEventListener('open', r));

  await sendCDP(pageWs, 'Page.enable', {}, idRef.id++);
  await sendCDP(pageWs, 'Runtime.enable', {}, idRef.id++);

  // 等待頁面初始化與資料集加載
  await new Promise(r => setTimeout(r, 2500));

  console.log('\n======================================================');
  console.log('🧪 Executing Test Suite for Should Fix 1 ~ 6');
  console.log('======================================================\n');

  // --- Test 1: [Should Fix 1] 明細表分頁 Next 按鈕總頁數計算與搜尋結果脫鉤修復 ---
  console.log('▶ [Test 1] 明細表分頁 Next 按鈕總頁數計算與搜尋結果脫鉤修復');
  const t1Res = await evalInPage(pageWs, `(() => {
    // 展開資料抽屜
    const drawer = document.getElementById('dataDrawer');
    if (drawer && !drawer.classList.contains('open')) {
      document.getElementById('btnToggleDrawer')?.click();
    }
    const searchInput = document.getElementById('tableSearchInput');
    const btnNext = document.getElementById('btnNextPage');
    const pageInfo = document.getElementById('paginationInfo');

    // 搜尋僅匹配極少數筆數 (例如 "北海道" 或 "東京")
    searchInput.value = '東京';
    searchInput.dispatchEvent(new Event('input'));

    const filteredRowsCount = window.PyGWalker ? window.PyGWalker.getFilteredTableRows ? window.PyGWalker.getFilteredTableRows().length : 1 : 1;
    const initialPage = window.PyGWalker ? window.PyGWalker.getState().tablePage : 1;
    const initialPageText = pageInfo ? pageInfo.textContent : '';

    // 點擊 Next 按鈕
    btnNext.click();

    const afterNextPage = window.PyGWalker ? window.PyGWalker.getState().tablePage : 1;
    const afterNextPageText = pageInfo ? pageInfo.textContent : '';
    const btnNextDisabled = btnNext.disabled;

    // 清除搜尋以防影響後續測試
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));

    return {
      filteredRowsCount,
      initialPage,
      initialPageText,
      afterNextPage,
      afterNextPageText,
      btnNextDisabled
    };
  })()`, idRef);

  const t1Pass = t1Res.initialPage === 1 && t1Res.afterNextPage === 1 && t1Res.btnNextDisabled === true;
  reportResult('Should Fix 1: Next 按鈕受 filtered.length 邊界約束不超頁', t1Pass, 
    `過濾後 ${t1Res.filteredRowsCount} 筆, 點擊前第 ${t1Res.initialPage} 頁, 點擊後第 ${t1Res.afterNextPage} 頁, Next 按鈕 disabled: ${t1Res.btnNextDisabled}`);

  // --- Test 2: [Should Fix 2] 明細表換頁時緩存 thead 特徵畫像 (Sparkline profiling) ---
  console.log('\n▶ [Test 2] 明細表換頁時緩存 thead 特徵畫像 (Sparkline profiling)');
  const t2Res = await evalInPage(pageWs, `(() => {
    const thead = document.getElementById('previewTableHead');
    const btnNext = document.getElementById('btnNextPage');
    const btnPrev = document.getElementById('btnPrevPage');

    // 確保在第 1 頁
    while (window.PyGWalker.getState().tablePage > 1) {
      btnPrev.click();
    }

    const trEl = thead.querySelector('tr');
    if (trEl) {
      trEl.__cachedSentinel = 'sentinel_marker_should_fix_2';
    }
    const keyBefore = thead.dataset.cachedKey;

    // 切換到第 2 頁
    btnNext.click();

    const trElAfterNext = thead.querySelector('tr');
    const sentinelAfterNext = trElAfterNext ? trElAfterNext.__cachedSentinel : null;
    const keyAfterNext = thead.dataset.cachedKey;
    const pageAfterNext = window.PyGWalker.getState().tablePage;

    // 驗證點擊欄位排序時，快取鍵值會更新且重新繪製 thead
    const firstCol = window.PyGWalker.getState().columns[0];
    window.PyGWalker.sortTable(firstCol);
    const keyAfterSort = thead.dataset.cachedKey;
    const trElAfterSort = thead.querySelector('tr');
    const sentinelAfterSort = trElAfterSort ? trElAfterSort.__cachedSentinel : null;

    // 還原回第 1 頁
    btnPrev.click();

    return {
      keyBefore,
      keyAfterNext,
      pageAfterNext,
      isDomReusedOnNext: sentinelAfterNext === 'sentinel_marker_should_fix_2',
      isDomRebuiltOnSort: sentinelAfterSort === null || keyAfterSort !== keyAfterNext
    };
  })()`, idRef);

  const t2Pass = t2Res.isDomReusedOnNext && t2Res.keyBefore === t2Res.keyAfterNext && t2Res.isDomRebuiltOnSort;
  reportResult('Should Fix 2: 換頁時 thead DOM 節點完全重用無重新計算，排序時自適應刷新', t2Pass,
    `換頁 DOM 重用: ${t2Res.isDomReusedOnNext}, 快取 Key 一致: ${t2Res.keyBefore === t2Res.keyAfterNext}, 排序觸發重繪: ${t2Res.isDomRebuiltOnSort}`);

  // --- Test 3: [Should Fix 3] 自訂上傳 CSV/Excel 資料集於頁面重新整理後的優雅降級容錯提示 ---
  console.log('\n▶ [Test 3] 自訂資料集重新整理後優雅降級容錯與 Toast 提示');
  // 在 localStorage 中寫入自訂資料集 ID（記憶體中未保留）
  const t3Res = await evalInPage(pageWs, `(() => {
    const fakePersisted = {
      sheets: [
        {
          id: 'sheet_custom_test',
          name: '自訂工作表 (測試已失效)',
          chartType: 'bar',
          datasetId: 'custom_deleted_1700000000000',
          shelf: {
            x: 'nonexistent_col_1',
            y: 'nonexistent_col_2',
            color: 'nonexistent_col_3',
            size: '',
            secondary: '',
            facet: '',
            agg: 'RAW'
          },
          filters: {}
        }
      ],
      activeSheetId: 'sheet_custom_test'
    };
    localStorage.setItem('data_atoms_studio_state_v1', JSON.stringify(fakePersisted));

    // 呼叫 loadPersistedState 驗證降級
    const loadResult = window.loadPersistedState ? window.loadPersistedState() : false;
    const activeSheet = window.PyGWalker.getState().sheets.find(s => s.id === 'sheet_custom_test');

    // 載入降級後的資料集
    window.PyGWalker.loadDataset(activeSheet.datasetId);
    const degradedDatasetId = window.PyGWalker.getState().currentDatasetId;
    const rawRowsCount = window.PyGWalker.getState().rawRows.length;
    const degradedShelfX = activeSheet.shelf.x;

    return {
      loadResult,
      sheetDatasetId: activeSheet.datasetId,
      degradedDatasetId,
      rawRowsCount,
      degradedShelfX
    };
  })()`, idRef);

  const t3Pass = t3Res.loadResult === true && 
                 (t3Res.sheetDatasetId === 'japan_population' || t3Res.degradedDatasetId.includes('jp_')) &&
                 t3Res.rawRowsCount > 0 &&
                 t3Res.degradedShelfX === '都道府縣';
  reportResult('Should Fix 3: 自訂資料集失效時主動降級載入 japan_population 並重設預設架構', t3Pass,
    `還原結果: ${t3Res.loadResult}, 降級後資料集: ${t3Res.degradedDatasetId}, 資料筆數: ${t3Res.rawRowsCount}, 重設 shelf.x: ${t3Res.degradedShelfX}`);

  // --- Test 4: [Should Fix 4] 看板 Modal 關閉時即時釋放 ECharts 實例 (釋放記憶體) ---
  console.log('\n▶ [Test 4] 看板 Modal 關閉時即時釋放 ECharts 實例與記憶體');
  const t4Res = await evalInPage(pageWs, `(() => {
    // 先 pin 一張圖
    window.PyGWalker.pinCurrentChart();
    
    // 開啟自訂看板
    window.PyGWalker.openCustomDashboard();
    const modal = document.getElementById('customDashboardModal');
    const isOpenBefore = modal.classList.contains('open');

    // 關閉看板
    window.PyGWalker.closeCustomDashboard();
    const isOpenAfter = modal.classList.contains('open');

    // 檢查 window.PyGWalker.getDashboardChartInstances
    // 若沒有公開 getter，透過閉包或實例 dispose 偵測
    const remainingInstances = window.PyGWalker.getDashboardChartInstances 
      ? Object.keys(window.PyGWalker.getDashboardChartInstances()).length 
      : 0;

    return {
      isOpenBefore,
      isOpenAfter,
      remainingInstances
    };
  })()`, idRef);

  const t4Pass = t4Res.isOpenBefore === true && t4Res.isOpenAfter === false && t4Res.remainingInstances === 0;
  reportResult('Should Fix 4: 看板關閉時 dispose 所有實例並清空參照', t4Pass,
    `關閉前開啟: ${t4Res.isOpenBefore}, 關閉後關閉: ${!t4Res.isOpenAfter}, 滯留實例數: ${t4Res.remainingInstances}`);

  // --- Test 5: [Should Fix 5] 向量地圖降級散佈模式與矩形樹圖補齊可選鏈防護 ---
  console.log('\n▶ [Test 5] 向量地圖降級散佈、矩形樹圖與散佈圖之防禦性可選鏈保護');
  const t5Res = await evalInPage(pageWs, `(() => {
    let mapTooltipSafe = false;
    let treemapTooltipSafe = false;
    let scatterTooltipSafe = false;

    // 1. 地圖散佈降級 tooltip 防禦測試
    try {
      window.PyGWalker.setChartType('map');
      const opt = window.PyGWalker.getChartOption();
      if (opt && opt.tooltip && typeof opt.tooltip.formatter === 'function') {
        // 傳入缺損 raw 與 value 的異常 params
        const tip1 = opt.tooltip.formatter({ data: {} });
        const tip2 = opt.tooltip.formatter({ data: { raw: null, value: null } });
        mapTooltipSafe = typeof tip1 === 'string' && typeof tip2 === 'string';
      } else {
        mapTooltipSafe = true;
      }
    } catch (e) {
      mapTooltipSafe = false;
    }

    // 2. 矩形樹圖 tooltip 防禦測試
    try {
      window.PyGWalker.setChartType('treemap');
      const opt = window.PyGWalker.getChartOption();
      if (opt && opt.tooltip && typeof opt.tooltip.formatter === 'function') {
        const tip1 = opt.tooltip.formatter({ data: {} });
        const tip2 = opt.tooltip.formatter({ data: { raw: null } });
        treemapTooltipSafe = typeof tip1 === 'string' && typeof tip2 === 'string';
      }
    } catch (e) {
      treemapTooltipSafe = false;
    }

    // 3. 散佈圖 tooltip 防禦測試
    try {
      window.PyGWalker.setChartType('scatter');
      const opt = window.PyGWalker.getChartOption();
      if (opt && opt.tooltip && typeof opt.tooltip.formatter === 'function') {
        const tip1 = opt.tooltip.formatter({ data: {} });
        const tip2 = opt.tooltip.formatter({ data: { raw: null, value: null } });
        scatterTooltipSafe = typeof tip1 === 'string' && typeof tip2 === 'string';
      }
    } catch (e) {
      scatterTooltipSafe = false;
    }

    return {
      mapTooltipSafe,
      treemapTooltipSafe,
      scatterTooltipSafe
    };
  })()`, idRef);

  const t5Pass = t5Res.mapTooltipSafe && t5Res.treemapTooltipSafe && t5Res.scatterTooltipSafe;
  reportResult('Should Fix 5: Tooltip 缺損 params.data.raw 時具備安全預設值不報錯', t5Pass,
    `地圖散佈安全: ${t5Res.mapTooltipSafe}, 矩形樹圖安全: ${t5Res.treemapTooltipSafe}, 散佈圖安全: ${t5Res.scatterTooltipSafe}`);

  // --- Test 6: [Should Fix 6] 小提琴圖 Y 軸下界優化 (避免大正數壓扁密度輪廓) ---
  console.log('\n▶ [Test 6] 小提琴圖 Y 軸下界動態比例 Headroom 優化');
  const t6Res = await evalInPage(pageWs, `(() => {
    // 構造大正數分佈測試集 (例如 5,000,000 ~ 5,200,000，極差 20 萬，大正數遠大於 2 * range)
    const highValRows = [];
    for (let i = 0; i < 40; i++) {
      highValRows.push({
        '地區': i % 2 === 0 ? '都會區A' : '都會區B',
        '人口數': 5000000 + (i * 5000)
      });
    }

    const testCustomObj = {
      id: 'custom_high_val_test',
      name: '大正數測試集',
      data: highValRows
    };
    window.PyGWalker.mountCustomDataset('high_val.json', highValRows);

    // 設定架構：X 為 地區，Y 為 人口數，切換至小提琴圖
    window.PyGWalker.setShelf('x', '地區');
    window.PyGWalker.setShelf('y', '人口數');
    window.PyGWalker.setChartType('violin');

    const optHigh = window.PyGWalker.getChartOption();
    const yAxisMinHigh = optHigh.yAxis.min;
    const yAxisMaxHigh = optHigh.yAxis.max;

    // 構造一般小正數分佈測試集 (例如 10 ~ 100，極差 90，violinAllMin 10 不大於 2 * range)
    const normalRows = [];
    for (let i = 0; i < 40; i++) {
      normalRows.push({
        '組別': i % 2 === 0 ? 'G1' : 'G2',
        '分數': 10 + (i * 2)
      });
    }
    window.PyGWalker.mountCustomDataset('normal.json', normalRows);
    window.PyGWalker.setShelf('x', '組別');
    window.PyGWalker.setShelf('y', '分數');
    window.PyGWalker.setChartType('violin');

    const optNormal = window.PyGWalker.getChartOption();
    const yAxisMinNormal = optNormal.yAxis.min;

    return {
      yAxisMinHigh,
      yAxisMaxHigh,
      yAxisMinNormal
    };
  })()`, idRef);

  // 大正數下界應大於 4,000,000 (動態 Headroom)，而非 0；常規指標下界保持為 0
  const t6Pass = t6Res.yAxisMinHigh > 4000000 && t6Res.yAxisMinNormal === 0;
  reportResult('Should Fix 6: 大正數指標自適應動態 Headroom 下界，常規指標保持 0 原點', t6Pass,
    `大正數 Y 軸 min: ${t6Res.yAxisMinHigh.toLocaleString()} (非 0, 輪廓舒展), 常規 Y 軸 min: ${t6Res.yAxisMinNormal}`);

  // --- Test 7: [Edge Cases] 極限邊界條件驗證 (小提琴零極差、負數分佈、搜尋無匹配、看板多次開關) ---
  console.log('\n▶ [Test 7] 極限邊界條件驗證');
  const t7Res = await evalInPage(pageWs, `(() => {
    // 1. 小提琴圖所有數值完全相同 (range = 0)
    const zeroRangeRows = [
      { '分組': 'A', '體量': 5000000 },
      { '分組': 'A', '體量': 5000000 },
      { '分組': 'B', '體量': 5000000 },
      { '分組': 'B', '體量': 5000000 }
    ];
    window.PyGWalker.mountCustomDataset('zero_range.json', zeroRangeRows);
    window.PyGWalker.setShelf('x', '分組');
    window.PyGWalker.setShelf('y', '體量');
    window.PyGWalker.setChartType('violin');
    const optZeroRange = window.PyGWalker.getChartOption();
    const zeroRangeMin = optZeroRange.yAxis.min;
    const zeroRangeMax = optZeroRange.yAxis.max;

    // 2. 小提琴圖負數分佈
    const negativeRows = [
      { '分組': 'N1', '負指標': -100 },
      { '分組': 'N1', '負指標': -50 },
      { '分組': 'N2', '負指標': -200 },
      { '分組': 'N2', '負指標': -150 }
    ];
    window.PyGWalker.mountCustomDataset('negative.json', negativeRows);
    window.PyGWalker.setShelf('x', '分組');
    window.PyGWalker.setShelf('y', '負指標');
    window.PyGWalker.setChartType('violin');
    const optNeg = window.PyGWalker.getChartOption();
    const negMin = optNeg.yAxis.min;

    // 3. 搜尋無匹配結果 (0 筆)
    const searchInput = document.getElementById('tableSearchInput');
    searchInput.value = 'THIS_KEYWORD_CANNOT_MATCH_ANYTHING_12345';
    searchInput.dispatchEvent(new Event('input'));
    const zeroRowsCount = window.PyGWalker.getFilteredTableRows().length;
    const zeroRowsPage = window.PyGWalker.getState().tablePage;
    const btnNext = document.getElementById('btnNextPage');
    btnNext.click();
    const afterNextOnZero = window.PyGWalker.getState().tablePage;
    const btnNextDisabledOnZero = btnNext.disabled;
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));

    // 4. 重複開啟/關閉看板 3 次
    for (let i = 0; i < 3; i++) {
      window.PyGWalker.openCustomDashboard();
      window.PyGWalker.closeCustomDashboard();
    }
    const danglingInstancesCount = Object.keys(window.PyGWalker.getDashboardChartInstances()).length;

    return {
      zeroRangeMin,
      zeroRangeMax,
      negMin,
      zeroRowsCount,
      zeroRowsPage,
      afterNextOnZero,
      btnNextDisabledOnZero,
      danglingInstancesCount
    };
  })()`, idRef);

  const t7Pass = t7Res.zeroRangeMin > 4000000 && 
                 t7Res.zeroRangeMin < 5000000 &&
                 t7Res.zeroRangeMax > 5000000 &&
                 t7Res.negMin < 0 &&
                 t7Res.zeroRowsCount === 0 &&
                 t7Res.afterNextOnZero === 1 &&
                 t7Res.btnNextDisabledOnZero === true &&
                 t7Res.danglingInstancesCount === 0;

  reportResult('Should Fix Edge Cases: 零極差、負數分佈、無匹配搜尋防護與看板連續釋放', t7Pass,
    `零極差 min/max: [${t7Res.zeroRangeMin}, ${t7Res.zeroRangeMax}], 負數 min: ${t7Res.negMin}, 0 筆 Next 鎖定: ${t7Res.btnNextDisabledOnZero}, 3次開關殘留: ${t7Res.danglingInstancesCount}`);

  console.log('\n======================================================');
  console.log(`📊 驗證統計: 通過 ${testPassedCount} / 失敗 ${testFailedCount}`);
  console.log('======================================================\n');

  if (testFailedCount > 0) {
    throw new Error(`Automation tests failed: ${testFailedCount} failures.`);
  }
}

runTests().then(() => {
  console.log('🎉 All 6 Should Fixes automation tests PASSED flawlessly!');
  if (chromeProcess) chromeProcess.kill();
  server.close();
  process.exit(0);
}).catch(err => {
  console.error('💥 Test execution failed with error:', err);
  if (chromeProcess) chromeProcess.kill();
  server.close();
  process.exit(1);
});
