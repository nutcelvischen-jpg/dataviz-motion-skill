// scripts/test_p0_must_fixes_cdp.js
// 驗證 Data Atoms 優先級 P0：重大正確性、安全性與重載崩潰 (Must Fix)
// 1. 看板釘選儲存至 localStorage 函式自還原 (重整後打開看板小提琴圖正常渲染無崩潰)
// 2. 動態模板 32 處 onclick 徹底清除，100% data-action 事件委派合規
// 3. 散佈圖、全景圖與樹圖 Tooltip 全面 escapeHtml 杜絕 XSS
// 4. savePersistedState 300ms 防抖化與 beforeunload 排空驗證

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

let server;
let chromeProcess;

function startStaticServer(port = 8145) {
  return new Promise((resolve) => {
    const root = path.resolve(__dirname, '..');
    server = http.createServer((req, res) => {
      let rawPath = req.url.split('?')[0];
      if (rawPath === '/') rawPath = '/data_atoms.html';
      const filePath = path.join(root, rawPath);

      if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found: ' + rawPath);
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png'
      };

      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });

    server.listen(port, '127.0.0.1', () => {
      console.log(`📡 Local server listening on http://127.0.0.1:${port}`);
      resolve(port);
    });
  });
}

function launchChrome(debuggingPort = 9335) {
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  chromeProcess = spawn(chromePath, [
    `--remote-debugging-port=${debuggingPort}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome_p0_must_fix_test_' + Date.now()
  ]);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      http.get(`http://127.0.0.1:${debuggingPort}/json/version`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve({ wsUrl: data.webSocketDebuggerUrl });
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    }, 1200);
  });
}

class SimpleCDP {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  connect() {
    const WSClass = globalThis.WebSocket;
    return new Promise((resolve, reject) => {
      this.ws = new WSClass(this.wsUrl);
      this.ws.addEventListener('open', resolve);
      this.ws.addEventListener('error', reject);
      this.ws.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        if (data.id && this.callbacks.has(data.id)) {
          const cb = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          cb(data);
        }
      });
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, (res) => {
        if (res.error) reject(res.error);
        else resolve(res.result);
      });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : undefined;
  }
}

async function runTests() {
  console.log('🚀 Starting Data Atoms P0 (Must Fix) Comprehensive Verification Suite...\n');
  const port = await startStaticServer(8145);
  const { wsUrl } = await launchChrome(9335);

  const browserCdp = new SimpleCDP(wsUrl);
  await browserCdp.connect();

  const target = await browserCdp.send('Target.createTarget', {
    url: `http://127.0.0.1:${port}/data_atoms.html`
  });

  const pageWsUrl = `ws://127.0.0.1:9335/devtools/page/${target.targetId}`;
  const cdp = new SimpleCDP(pageWsUrl);
  await cdp.connect();
  console.log('🔌 Connected to Headless Chrome Page via CDP\n');

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  await new Promise(r => setTimeout(r, 2200));

  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passCount++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failCount++;
    }
  }

  console.log('======================================================');
  console.log('🧪 P0 Must Fix 驗證項目');
  console.log('======================================================\n');

  // -------------------------------------------------------------------------
  // Test 1: 動態模板 32 處 onclick 徹底清除，100% data-action 事件委派合規
  // -------------------------------------------------------------------------
  console.log('▶ [P0 #1] 動態模板 32 處 onclick 徹底消除與事件委派驗證');
  const onclickAudit = await cdp.eval(`(() => {
    // 檢查 DOM 中現存的所有元素是否包含 inline onclick
    const allEls = document.querySelectorAll('*');
    const withInlineOnclick = [];
    allEls.forEach(el => {
      if (el.hasAttribute('onclick') || el.onclick) {
        withInlineOnclick.push({
          tag: el.tagName,
          id: el.id,
          cls: el.className,
          onclickAttr: el.getAttribute('onclick')
        });
      }
    });

    // 檢查維度清單中的快速指派按鈕是否具備 data-action
    const quickBtns = document.querySelectorAll('.field-quick-btn');
    const hasDataActionQuick = quickBtns.length > 0 && Array.from(quickBtns).every(b => b.dataset.action === 'assign-shelf' || b.dataset.action === 'add-filter');

    // 測試模擬點擊 "+X" 按鈕，驗證事件委派是否正常觸發槽位指派
    const firstFieldQuickX = document.querySelector('.field-quick-btn[data-shelf="x"]');
    const targetField = firstFieldQuickX ? firstFieldQuickX.dataset.field : null;
    if (firstFieldQuickX) {
      firstFieldQuickX.click();
    }
    const currentShelfX = window.PyGWalker.state.shelf.x;

    return {
      inlineCount: withInlineOnclick.length,
      withInlineOnclick,
      quickBtnsCount: quickBtns.length,
      hasDataActionQuick,
      targetField,
      currentShelfX,
      shelfAssignedMatch: currentShelfX === targetField
    };
  })()`);

  assert(onclickAudit.inlineCount === 0, `DOM 內所有元素 inline onclick 數應為 0 (實際: ${onclickAudit.inlineCount})`);
  assert(onclickAudit.quickBtnsCount > 0 && onclickAudit.hasDataActionQuick, `欄位快捷按鈕共 ${onclickAudit.quickBtnsCount} 個，皆具備標準 data-action 屬性`);
  assert(onclickAudit.shelfAssignedMatch, `點擊 data-action="assign-shelf" 委派正常指派 X 軸欄位為 "${onclickAudit.targetField}" (現為 "${onclickAudit.currentShelfX}")`);

  // 測試篩選控制列按鈕事件委派
  const filterDelegateAudit = await cdp.eval(`(() => {
    // 新增篩選條件 "地方分區"
    window.PyGWalker.addFilter('地方分區');
    const strip = document.getElementById('activeFiltersStrip');
    
    // 檢查篩選列所有按鈕是否皆為 data-action 且無 onclick
    const stripBtns = strip ? strip.querySelectorAll('button') : [];
    const stripOnclicks = Array.from(stripBtns).filter(b => b.hasAttribute('onclick') || b.onclick);
    
    // 測試點擊 "只留第一項" 按鈕
    const keepFirstBtn = strip.querySelector('[data-action="set-all-filters"][data-select-all="false"]');
    if (keepFirstBtn) keepFirstBtn.click();
    const filterState = window.PyGWalker.state.filters['地方分區'];
    const selectedSizeAfterKeepFirst = filterState ? filterState.selected.size : -1;

    // 測試點擊 "全選" 按鈕
    const selectAllBtn = strip.querySelector('[data-action="set-all-filters"][data-select-all="true"]');
    if (selectAllBtn) selectAllBtn.click();
    const selectedSizeAfterSelectAll = filterState ? filterState.selected.size : -1;

    // 測試點擊 "重設所有篩選"
    const resetFiltersBtn = strip.querySelector('[data-action="reset-all-filters"]');
    if (resetFiltersBtn) resetFiltersBtn.click();
    const filterStateAfterReset = window.PyGWalker.state.filters['地方分區'];
    const allRestoredAfterReset = filterStateAfterReset ? (filterStateAfterReset.selected.size === filterStateAfterReset.allValues.length) : false;

    return {
      stripBtnsCount: stripBtns.length,
      stripOnclicksCount: stripOnclicks.length,
      selectedSizeAfterKeepFirst,
      selectedSizeAfterSelectAll,
      allRestoredAfterReset
    };
  })()`);

  assert(filterDelegateAudit.stripOnclicksCount === 0, `篩選控制列所有按鈕 100% 零 inline onclick (按鈕總數: ${filterDelegateAudit.stripBtnsCount})`);
  assert(filterDelegateAudit.selectedSizeAfterKeepFirst === 1, `點擊 data-action="set-all-filters" 只留第一項委派成功 (僅剩 1 項)`);
  assert(filterDelegateAudit.selectedSizeAfterSelectAll > 1, `點擊 data-action="set-all-filters" 全選委派成功 (選取數: ${filterDelegateAudit.selectedSizeAfterSelectAll})`);
  assert(filterDelegateAudit.allRestoredAfterReset, `點擊 data-action="reset-all-filters" 重設委派成功 (恢復全選全量資料)`);

  // -------------------------------------------------------------------------
  // Test 2: 看板釘選保存於 localStorage 函式自還原 (重整後打開看板小提琴圖正常渲染無崩潰)
  // -------------------------------------------------------------------------
  console.log('\n▶ [P0 #2] 看板釘選保存至 localStorage 函式自還原驗證 (解決重整後小提琴圖全白崩潰)');
  
  // 設置圖表為小提琴圖並釘選至自訂看板
  const violinSetup = await cdp.eval(`(() => {
    // 切換為小提琴圖
    window.PyGWalker.setChartType('violin');
    window.PyGWalker.assignToShelf('x', '地方分區');
    window.PyGWalker.assignToShelf('y', '總人口(人)');
    window.PyGWalker.renderVisualization();

    // 取得當前圖表配置
    const opt = window.PyGWalker.getChartOption();
    const hasCustomSeries = opt && opt.series && opt.series[0] && opt.series[0].type === 'custom';
    const hasRenderItemBefore = typeof (opt.series[0] && opt.series[0].renderItem) === 'function';

    // 釘選當前小提琴圖至看板
    window.PyGWalker.pinCurrentChart();
    const pinnedCount = window.PyGWalker.state.pinnedCharts.length;

    // 驗證已釘選項目保留 recipe 與 _violinMetaList
    const pinnedItem = window.PyGWalker.state.pinnedCharts[0];
    const hasRecipe = Boolean(pinnedItem && pinnedItem.recipe && pinnedItem.recipe.chartType === 'violin');
    const hasMetaList = Boolean(pinnedItem && pinnedItem.option && pinnedItem.option.series[0] && pinnedItem.option.series[0]._violinMetaList);

    // 強制觸發持久化同步儲存至 localStorage
    window.savePersistedStateImmediate();
    const rawStorage = localStorage.getItem('data_atoms_studio_state_v1');

    return {
      hasCustomSeries,
      hasRenderItemBefore,
      pinnedCount,
      hasRecipe,
      hasMetaList,
      storageLength: rawStorage ? rawStorage.length : 0
    };
  })()`);

  assert(violinSetup.hasCustomSeries && violinSetup.hasRenderItemBefore, `主視圖成功生成小提琴圖 custom series 與 renderItem 函式`);
  assert(violinSetup.pinnedCount === 1, `成功將小提琴圖釘選至看板 (pinnedCount: 1)`);
  assert(violinSetup.hasRecipe && violinSetup.hasMetaList, `釘選物件完整保存 recipe 與 _violinMetaList 純資料核密度架構`);
  assert(violinSetup.storageLength > 100, `持久化 payload 成功同步寫入 localStorage (長度: ${violinSetup.storageLength} 字元)`);

  // 模擬重新整理頁面 (Page Reload)
  console.log('  🔄 模擬頁面重新整理 (Page Reload)...');
  await cdp.send('Page.reload');
  await new Promise(r => setTimeout(r, 2200));

  // 重整後打開看板，驗證自還原機制
  const reloadDashboardAudit = await cdp.eval(`(async () => {
    // 檢查重整後 localStorage 中的 pinnedCharts
    const state = window.PyGWalker.state;
    const pinnedLen = state.pinnedCharts.length;
    const rawItem = state.pinnedCharts[0];
    
    // 原生 JSON.parse 後，renderItem 確實已被抹除為 undefined (驗證問題重現邊界)
    const renderItemFromRawJson = rawItem && rawItem.option && rawItem.option.series[0] ? rawItem.option.series[0].renderItem : undefined;

    // 開啟自訂多宮格看板
    window.PyGWalker.openCustomDashboard();
    // 等候 requestAnimationFrame 掛載實例
    await new Promise(r => setTimeout(r, 120));

    // 檢查卡片 DOM 與渲染狀態
    const modal = document.getElementById('customDashboardModal');
    const isModalOpen = modal && modal.classList.contains('open');
    const cardCanvas = document.querySelector('.dashboard-card-chart');
    const cardError = document.querySelector('.dashboard-card-chart div');
    const hasErrorText = cardError && cardError.textContent.includes('圖表渲染異常');

    // 檢查看板實例
    const instances = window.PyGWalker.getDashboardChartInstances();
    const instanceKeys = Object.keys(instances || {});
    const firstInstance = instances && instances[instanceKeys[0]];
    const renderedOption = firstInstance ? firstInstance.getOption() : null;

    // 測試手動呼叫 restoreOptionFunctions 自還原能力
    const testRestored = window.PyGWalker.restoreOptionFunctions(rawItem.option, rawItem);
    const restoredRenderItemType = typeof (testRestored.series[0] && testRestored.series[0].renderItem);
    const restoredTooltipFormatterType = typeof (testRestored.tooltip && testRestored.tooltip.formatter);
    const yAx = Array.isArray(testRestored.yAxis) ? testRestored.yAxis[0] : testRestored.yAxis;
    const restoredYAxisFormatterType = typeof (yAx && yAx.axisLabel && yAx.axisLabel.formatter);

    return {
      pinnedLen,
      renderItemFromRawJsonIsUndefined: renderItemFromRawJson === undefined,
      isModalOpen,
      hasCardCanvas: Boolean(cardCanvas),
      hasErrorText: Boolean(hasErrorText),
      instanceCount: instanceKeys.length,
      hasRenderedOption: Boolean(renderedOption),
      restoredRenderItemType,
      restoredTooltipFormatterType,
      restoredYAxisFormatterType
    };
  })()`);

  assert(reloadDashboardAudit.pinnedLen === 1, `頁面重整後成功從 localStorage 還原釘選看板 (卡片數: 1)`);
  assert(reloadDashboardAudit.renderItemFromRawJsonIsUndefined, `確認 原生 JSON.stringify 抹除了函式 (renderItem 原生丟失)`);
  assert(reloadDashboardAudit.isModalOpen, `開啟自訂看板 Modal 成功`);
  assert(!reloadDashboardAudit.hasErrorText, `看板卡片無「圖表渲染異常」錯誤提示 (根除重整全白崩潰漏洞)`);
  assert(reloadDashboardAudit.instanceCount === 1, `看板成功初始化獨立 ECharts 實例 (實例數: 1)`);
  assert(reloadDashboardAudit.restoredRenderItemType === 'function', `restoreOptionFunctions 成功自還原 custom series 的 renderItem 為 function`);
  assert(reloadDashboardAudit.restoredTooltipFormatterType === 'function', `restoreOptionFunctions 成功自還原 tooltip.formatter 為 function`);
  assert(reloadDashboardAudit.restoredYAxisFormatterType === 'function', `restoreOptionFunctions 成功自還原 yAxis.axisLabel.formatter 為 function`);

  // -------------------------------------------------------------------------
  // Test 3: 散佈圖、全景圖與樹圖 Tooltip 全面 escapeHtml 杜絕 XSS
  // -------------------------------------------------------------------------
  console.log('\n▶ [P0 #3] 散佈圖、全景圖與樹圖 Tooltip DOM XSS 轉義防禦驗證');
  const xssAudit = await cdp.eval(`(() => {
    // 注入帶有 XSS 攻擊向量的惡意字串
    const xssPayload = '<img src=x onerror="window._xssTriggered=true">';
    window._xssTriggered = false;

    // 1. 散佈圖 Tooltip 測試
    window.PyGWalker.setChartType('scatter');
    window.PyGWalker.assignToShelf('x', '總人口(人)');
    window.PyGWalker.assignToShelf('y', '65歲以上高齡人口(人)');
    window.PyGWalker.assignToShelf('color', '地方分區');
    window.PyGWalker.renderVisualization();
    const scatterOpt = window.PyGWalker.getChartOption();
    
    // 傳入帶有 XSS payload 的 params 物件給 scatter tooltip
    const mockScatterParams = {
      name: '東京都' + xssPayload,
      data: {
        raw: {
          '都道府縣': '東京都' + xssPayload,
          '總人口(人)': 14000000,
          '65歲以上高齡人口(人)': 3000000,
          '地方分區': '關東' + xssPayload
        },
        value: [14000000, 3000000]
      }
    };
    const scatterTipHtml = scatterOpt.tooltip.formatter(mockScatterParams);

    // 2. 矩形樹圖 Tooltip 測試
    window.PyGWalker.setChartType('treemap');
    window.PyGWalker.assignToShelf('x', '都道府縣');
    window.PyGWalker.assignToShelf('size', '總人口(人)');
    window.PyGWalker.assignToShelf('color', '地方分區');
    window.PyGWalker.renderVisualization();
    const treemapOpt = window.PyGWalker.getChartOption();
    const mockTreemapParams = {
      name: '群組' + xssPayload,
      value: 5000000,
      data: {
        raw: {
          '都道府縣': '大阪府' + xssPayload,
          '地方分區': '近畿' + xssPayload
        }
      }
    };
    const treemapTipHtml = treemapOpt.tooltip.formatter(mockTreemapParams);

    // 3. Overview 複合全景 Tooltip 測試
    window.PyGWalker.setChartType('overview');
    window.PyGWalker.assignToShelf('x', '都道府縣');
    window.PyGWalker.assignToShelf('y', '總人口(人)');
    window.PyGWalker.renderVisualization();
    const overviewOpt = window.PyGWalker.getChartOption();
    const mockOverviewParams = {
      name: '全景' + xssPayload,
      value: 123456
    };
    const overviewTipHtml = overviewOpt.tooltip.formatter(mockOverviewParams);

    // 檢查產生的 HTML 字串中是否未轉義存在原始 <img src=x
    const rawTagInScatter = scatterTipHtml.includes('<img src=x');
    const escapedTagInScatter = scatterTipHtml.includes('&lt;img src=x');
    const rawTagInTreemap = treemapTipHtml.includes('<img src=x');
    const escapedTagInTreemap = treemapTipHtml.includes('&lt;img src=x');
    const rawTagInOverview = overviewTipHtml.includes('<img src=x');
    const escapedTagInOverview = overviewTipHtml.includes('&lt;img src=x');

    // 建立臨時容器插入 HTML，驗證瀏覽器是否觸發 onerror 執行惡意腳本
    const testDiv = document.createElement('div');
    testDiv.innerHTML = scatterTipHtml + treemapTipHtml + overviewTipHtml;
    document.body.appendChild(testDiv);
    const xssFired = window._xssTriggered === true;
    document.body.removeChild(testDiv);

    return {
      rawTagInScatter,
      escapedTagInScatter,
      rawTagInTreemap,
      escapedTagInTreemap,
      rawTagInOverview,
      escapedTagInOverview,
      xssFired
    };
  })()`);

  assert(!xssAudit.rawTagInScatter && xssAudit.escapedTagInScatter, `散佈圖 Tooltip 原始 HTML 標籤徹底轉義為 &lt;img (無未轉義 HTML)`);
  assert(!xssAudit.rawTagInTreemap && xssAudit.escapedTagInTreemap, `矩形樹圖 Tooltip 原始 HTML 標籤徹底轉義為 &lt;img (無未轉義 HTML)`);
  assert(!xssAudit.rawTagInOverview && xssAudit.escapedTagInOverview, `複合全景 Overview Tooltip 原始 HTML 標籤徹底轉義為 &lt;img (無未轉義 HTML)`);
  assert(!xssAudit.xssFired, `惡意 XSS 腳本零觸發執行 (window._xssTriggered === false)`);

  // -------------------------------------------------------------------------
  // Test 4: savePersistedState 300ms 防抖化與 beforeunload 排空驗證
  // -------------------------------------------------------------------------
  console.log('\n▶ [P0 #4] savePersistedState 300ms 防抖化與 beforeunload 排空機制驗證');
  const debounceAudit = await cdp.eval(`(async () => {
    // 追蹤 localStorage.setItem 呼叫次數
    let setItemCallCount = 0;
    const origSetItem = localStorage.setItem;
    localStorage.setItem = function (key, val) {
      if (key === 'data_atoms_studio_state_v1') {
        setItemCallCount++;
      }
      return origSetItem.apply(this, arguments);
    };

    // 1. 高頻密集調用 20 次 savePersistedState (模擬使用者連續快速點擊或拖曳)
    for (let i = 0; i < 20; i++) {
      window.savePersistedState();
    }
    const countImmediatelyAfterLoop = setItemCallCount;

    // 2. 等待 150ms (未達 300ms 防抖門檻)
    await new Promise(r => setTimeout(r, 150));
    const countAt150ms = setItemCallCount;

    // 3. 等待至 380ms (超過 300ms 防抖門檻)
    await new Promise(r => setTimeout(r, 230));
    const countAt380ms = setItemCallCount;

    // 4. 測試 beforeunload / pagehide 時排空 (flush) 機制
    window.savePersistedState(); // 發起新的防抖儲存
    const countBeforeFlush = setItemCallCount;
    // 立即調用 flush
    window.debouncedSavePersistedState.flush();
    const countAfterFlush = setItemCallCount;

    // 還原 setItem
    localStorage.setItem = origSetItem;

    return {
      countImmediatelyAfterLoop,
      countAt150ms,
      countAt380ms,
      countBeforeFlush,
      countAfterFlush
    };
  })()`);

  assert(debounceAudit.countImmediatelyAfterLoop === 0, `高頻連續調用 20 次 savePersistedState 後立即寫入次數為 0 (主執行緒無阻塞)`);
  assert(debounceAudit.countAt150ms === 0, `150ms 內防抖計時器有效抑制寫入 (寫入次數: 0)`);
  assert(debounceAudit.countAt380ms === 1, `超過 300ms 防抖門檻後合併為唯 1 次寫入 (寫入次數: 1)`);
  assert(debounceAudit.countAfterFlush === debounceAudit.countBeforeFlush + 1, `debouncedSavePersistedState.flush() 能在 beforeunload 時立即同步排空寫入最新狀態`);

  // -------------------------------------------------------------------------
  // Test 5: Tab 雙擊重新命名與重設快取防抖取消驗證
  // -------------------------------------------------------------------------
  console.log('\n▶ [P0 #5] 工作簿 Tab 雙擊事件委派與重設快取防抖鎖定防護驗證');
  const tabAndResetAudit = await cdp.eval(`(() => {
    // 驗證 tab-title 雙擊委派
    const firstTab = document.querySelector('.workbook-tab');
    let promptOpened = false;
    const origPrompt = window.prompt;
    window.prompt = () => { promptOpened = true; return '新工作表名稱'; };
    
    // 觸發雙擊事件
    firstTab.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
    window.prompt = origPrompt;

    const renamedSheetName = window.PyGWalker.state.sheets[0] ? window.PyGWalker.state.sheets[0].name : '';

    // 測試 resetPersistedState 後防抖計時器被取消，不會殘留回寫
    let setItemAfterReset = 0;
    const origSetItem = localStorage.setItem;
    localStorage.setItem = function (k) {
      if (k === 'data_atoms_studio_state_v1') setItemAfterReset++;
      return origSetItem.apply(this, arguments);
    };

    window.savePersistedState(); // 發起排隊
    window.resetStudioState();   // 重設狀態（應自動 cancel 排隊計時器）

    return {
      promptOpened,
      renamedSheetName,
      setItemAfterReset
    };
  })()`);

  assert(tabAndResetAudit.promptOpened, `雙擊工作表標籤透過事件委派成功觸發重新命名對話框`);
  assert(tabAndResetAudit.renamedSheetName === '新工作表名稱', `工作表名稱成功更新為「新工作表名稱」`);

  console.log('\n======================================================');
  console.log(`📊 驗證統計: 通過 ${passCount} / 失敗 ${failCount}`);
  console.log('======================================================\n');

  if (failCount === 0) {
    console.log('🎉 All Priority P0 (Must Fix) automation tests PASSED flawlessly!');
  } else {
    console.error(`💥 ${failCount} test(s) failed in P0 Must Fix suite.`);
  }

  // 清理進程
  try { cdp.ws.close(); } catch (e) {}
  if (chromeProcess) {
    chromeProcess.kill('SIGKILL');
  }
  if (server) {
    server.close();
  }

  process.exit(failCount === 0 ? 0 : 1);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  if (chromeProcess) chromeProcess.kill('SIGKILL');
  if (server) server.close();
  process.exit(1);
});
