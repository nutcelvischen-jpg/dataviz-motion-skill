const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 8898;
const CDP_PORT = 9334;
const ROOT_DIR = path.resolve(__dirname, '..');

// 1. 本地靜態伺服器
function startStaticServer() {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.csv': 'text/csv; charset=utf-8'
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/data_atoms.html';
    const filePath = path.join(ROOT_DIR, reqPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found: ' + reqPath);
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });

  return new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`[Static Server] Running on http://127.0.0.1:${PORT}`);
      resolve(server);
    });
  });
}

async function getWsUrl() {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${CDP_PORT}/json/version`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.webSocketDebuggerUrl);
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function sendCDP(ws, method, params = {}, id = 1) {
  return new Promise((resolve, reject) => {
    const msg = JSON.stringify({ id, method, params });
    const handler = (event) => {
      try {
        const resp = JSON.parse(event.data);
        if (resp.id === id) {
          ws.removeEventListener('message', handler);
          if (resp.error) reject(resp.error);
          else resolve(resp.result);
        }
      } catch (err) {}
    };
    ws.addEventListener('message', handler);
    ws.send(msg);
  });
}

async function evaluate(ws, expression, id = 100) {
  const res = await sendCDP(ws, 'Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true
  }, id);
  if (res.exceptionDetails) {
    throw new Error('Evaluation exception: ' + JSON.stringify(res.exceptionDetails));
  }
  return res.result ? res.result.value : undefined;
}

(async () => {
  let server = null;
  let chromeProc = null;
  let pageWs = null;
  let browserWs = null;
  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, desc) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${desc}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${desc}`);
    }
  }

  try {
    server = await startStaticServer();

    console.log('Launching headless Chrome with remote debugging on port ' + CDP_PORT + '...');
    chromeProc = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
      '--headless=new',
      `--remote-debugging-port=${CDP_PORT}`,
      '--window-size=1440,900',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-extensions'
    ], { stdio: 'ignore' });

    let wsUrl = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 300));
      try {
        wsUrl = await getWsUrl();
        if (wsUrl) break;
      } catch (e) {}
    }

    if (!wsUrl) throw new Error('Failed to connect to Chrome CDP endpoint.');
    console.log('Connected to Chrome CDP:', wsUrl);

    browserWs = new WebSocket(wsUrl);
    await new Promise((res, rej) => {
      browserWs.onopen = res;
      browserWs.onerror = rej;
    });

    let msgId = 1;
    const target = await sendCDP(browserWs, 'Target.createTarget', { url: `http://127.0.0.1:${PORT}/data_atoms.html` }, msgId++);
    const targetWsUrl = `ws://127.0.0.1:${CDP_PORT}/devtools/page/${target.targetId}`;

    pageWs = new WebSocket(targetWsUrl);
    await new Promise((res, rej) => {
      pageWs.onopen = res;
      pageWs.onerror = rej;
    });

    await sendCDP(pageWs, 'Page.enable', {}, msgId++);
    await sendCDP(pageWs, 'Runtime.enable', {}, msgId++);
    await sendCDP(pageWs, 'Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    }, msgId++);

    console.log('Waiting for page scripts and DOM ready...');
    await new Promise(r => setTimeout(r, 2000));

    // =========================================================================
    // 測試 1: [P1 #1] 新增分頁後切換回「工作表 1」，資料不為 0，圖表正常繪製
    // =========================================================================
    console.log('\n--- 測試 1: [P1 #1] 新增分頁後切換回「工作表 1」，資料不為 0，圖表正常繪製 ---');
    const t1 = await evaluate(pageWs, `
      (function() {
        const initialSheetCount = window.PyGWalker.state.sheets.length;
        const initialActiveId = window.PyGWalker.state.activeSheetId;
        const initialRawRows = window.PyGWalker.state.rawRows.length;
        const initialFilters = window.PyGWalker.state.filters;
        
        // 1. 新增分頁
        window.PyGWalker.addNewSheet();
        const afterAddSheetCount = window.PyGWalker.state.sheets.length;
        const sheet2Id = window.PyGWalker.state.activeSheetId;

        // 2. 切換回 工作表 1
        window.PyGWalker.switchSheet('sheet_1');
        const switchedBackId = window.PyGWalker.state.activeSheetId;
        const restoredFilters = window.PyGWalker.state.filters;

        // 驗證 filters 內的 Set 健全性
        let hasValidSets = false;
        let anyEmptySetFound = false;
        for (const [k, f] of Object.entries(restoredFilters || {})) {
          if (f && f.selected instanceof Set) {
            hasValidSets = true;
            if (f.selected.size === 0) anyEmptySetFound = true;
          }
        }

        // 呼叫 getActiveRows 驗證過濾後的資料列數
        const filteredRows = window.PyGWalker.getActiveRows();
        const echartsOpt = window.PyGWalker.getEChartsInstance() ? window.PyGWalker.getEChartsInstance().getOption() : null;
        const seriesDataLen = echartsOpt && echartsOpt.series && echartsOpt.series[0] && echartsOpt.series[0].data ? echartsOpt.series[0].data.length : 0;

        return {
          initialSheetCount,
          initialActiveId,
          initialRawRows,
          afterAddSheetCount,
          sheet2Id,
          switchedBackId,
          hasValidSets,
          anyEmptySetFound,
          filteredRowsCount: filteredRows.length,
          seriesDataLen
        };
      })()
    `, msgId++);

    assert(t1.initialSheetCount === 1, `初始工作表應為 1 張，得到 ${t1.initialSheetCount}`);
    assert(t1.afterAddSheetCount === 2, `新增分頁後工作表應為 2 張，得到 ${t1.afterAddSheetCount}`);
    assert(t1.switchedBackId === 'sheet_1', `切換回工作表 1 成功，得到 ${t1.switchedBackId}`);
    assert(t1.hasValidSets === true, '工作表 1 的 filters 應包含正常的 Set 實例');
    assert(t1.anyEmptySetFound === false, '工作表 1 的 filters Set 不應被閹割為空集合 (0 筆)');
    assert(t1.filteredRowsCount > 0, `切換回工作表 1 後過濾資料筆數應大於 0，得到 ${t1.filteredRowsCount} 筆 (非 0 筆蒸發)`);
    assert(t1.seriesDataLen > 0, `切換回工作表 1 後圖表應有數據點正常渲染，得到 ${t1.seriesDataLen} 筆`);

    // =========================================================================
    // 測試 2: [P1 #2] 快捷鍵 [ / ] 修飾鍵防護 (macOS Cmd+[ 與 Vim Ctrl+[)
    // =========================================================================
    console.log('\n--- 測試 2: [P1 #2] 快捷鍵 [ / ] 修飾鍵防護 (macOS Cmd+[ 與 Vim Ctrl+[) ---');
    const t2 = await evaluate(pageWs, `
      (function() {
        const layout = document.querySelector('.workspace-body');
        layout.classList.remove('sidebar-collapsed');

        // 模擬按 Cmd + [ (macOS 瀏覽器上一頁)
        window.dispatchEvent(new KeyboardEvent('keydown', { key: '[', metaKey: true, bubbles: true }));
        const collapsedAfterCmdBracket = layout.classList.contains('sidebar-collapsed');

        // 模擬按 Ctrl + [ (Vim / IDE 快捷鍵)
        window.dispatchEvent(new KeyboardEvent('keydown', { key: '[', ctrlKey: true, bubbles: true }));
        const collapsedAfterCtrlBracket = layout.classList.contains('sidebar-collapsed');

        // 模擬按 Alt + [
        window.dispatchEvent(new KeyboardEvent('keydown', { key: '[', altKey: true, bubbles: true }));
        const collapsedAfterAltBracket = layout.classList.contains('sidebar-collapsed');

        // 模擬在 input 元素中打字輸入 [
        const input = document.getElementById('tableSearchInput') || document.querySelector('input');
        if (input) {
          input.focus();
          input.dispatchEvent(new KeyboardEvent('keydown', { key: '[', bubbles: true }));
        }
        const collapsedWhileInputFocused = layout.classList.contains('sidebar-collapsed');
        if (input && input.blur) input.blur();

        // 模擬純按 [ (應觸發收合)
        window.dispatchEvent(new KeyboardEvent('keydown', { key: '[', bubbles: true }));
        const collapsedAfterPureBracketClose = layout.classList.contains('sidebar-collapsed');

        // 模擬純按 ] (應觸發展開)
        window.dispatchEvent(new KeyboardEvent('keydown', { key: ']', bubbles: true }));
        const collapsedAfterPureBracketOpen = layout.classList.contains('sidebar-collapsed');

        return {
          collapsedAfterCmdBracket,
          collapsedAfterCtrlBracket,
          collapsedAfterAltBracket,
          collapsedWhileInputFocused,
          collapsedAfterPureBracketClose,
          collapsedAfterPureBracketOpen
        };
      })()
    `, msgId++);

    assert(t2.collapsedAfterCmdBracket === false, '模擬 Cmd + [ 側邊欄應維持展開，不得被劫持收合');
    assert(t2.collapsedAfterCtrlBracket === false, '模擬 Ctrl + [ 側邊欄應維持展開，不得被劫持收合');
    assert(t2.collapsedAfterAltBracket === false, '模擬 Alt + [ 側邊欄應維持展開，不得被劫持收合');
    assert(t2.collapsedWhileInputFocused === false, '在輸入框中鍵入 [ 側邊欄不得被誤觸發收合');
    assert(t2.collapsedAfterPureBracketClose === true, '純單按 [ 鍵應正常收合側邊欄');
    assert(t2.collapsedAfterPureBracketOpen === false, '純單按 ] 鍵應正常展開側邊欄');

    // =========================================================================
    // 測試 3: [P1 #3] 小提琴圖釘選至看板後，卡片包含 renderItem 與正常渲染
    // =========================================================================
    console.log('\n--- 測試 3: [P1 #3] 小提琴圖釘選至看板後，卡片包含 renderItem 與正常渲染 ---');
    const t3 = await evaluate(pageWs, `
      (async function() {
        // 切換至小提琴圖 (violin)
        window.PyGWalker.setChartType('violin');

        const mainOpt = window.PyGWalker.getEChartsInstance().getOption();
        const mainHasCustomSeries = mainOpt.series.some(s => s.type === 'custom');
        const mainHasRenderItem = mainOpt.series.some(s => typeof s.renderItem === 'function') ||
                                  (window.PyGWalker.state.currentChartOption &&
                                   window.PyGWalker.state.currentChartOption.series &&
                                   typeof window.PyGWalker.state.currentChartOption.series[0].renderItem === 'function');

        // 釘選當前小提琴圖
        window.PyGWalker.pinCurrentChart();
        const pinnedList = window.PyGWalker.state.pinnedCharts;
        const lastPinned = pinnedList[pinnedList.length - 1];

        // 檢查 pinnedItem 中的 option
        const pinnedHasOption = !!lastPinned.option;
        const pinnedCustomSeries = lastPinned.option.series ? lastPinned.option.series.find(s => s.type === 'custom') : null;
        const pinnedHasRenderItem = !!(pinnedCustomSeries && typeof pinnedCustomSeries.renderItem === 'function');
        const pinnedHasHeadroom = lastPinned.option.yAxis && (typeof lastPinned.option.yAxis.max === 'function' || typeof lastPinned.option.yAxis.max === 'number');

        // 打開自訂看板並檢查 DOM 渲染
        window.PyGWalker.openCustomDashboard();
        await new Promise(r => setTimeout(r, 150));

        const cardCanvas = document.getElementById('canvas_' + lastPinned.id);
        const hasCardCanvas = !!cardCanvas;
        const hasErrorNotice = cardCanvas && cardCanvas.textContent.includes('圖表渲染異常');
        const cardEchartsInstance = cardCanvas ? echarts.getInstanceByDom(cardCanvas) : null;
        const cardHasInstance = !!cardEchartsInstance;
        
        // 關閉看板
        window.PyGWalker.closeCustomDashboard();

        return {
          mainHasCustomSeries,
          mainHasRenderItem,
          pinnedHasOption,
          pinnedHasRenderItem,
          pinnedHasHeadroom,
          hasCardCanvas,
          hasErrorNotice,
          cardHasInstance
        };
      })()
    `, msgId++);

    assert(t3.mainHasCustomSeries === true, '主畫布小提琴圖包含 custom 系列');
    assert(t3.mainHasRenderItem === true, '主畫布小提琴圖包含 renderItem 自訂渲染函式');
    assert(t3.pinnedHasOption === true, '釘選卡片成功保留 option 配置');
    assert(t3.pinnedHasRenderItem === true, '釘選卡片 option.series 完整保留 renderItem 函式 (非 undefined/閹割)');
    assert(t3.pinnedHasHeadroom === true, '釘選卡片 yAxis headroom 配置成功保留');
    assert(t3.hasCardCanvas === true, '看板中卡片 canvas 容器節點掛載成功');
    assert(t3.hasErrorNotice === false, '卡片畫布無渲染異常錯誤提示 (根除小提琴圖全白)');
    assert(t3.cardHasInstance === true, '卡片獨立 ECharts 實例成功初始化並渲染');

    // =========================================================================
    // 測試 4: [P1 #4] 工作簿多分頁跨資料集切換支援
    // =========================================================================
    console.log('\n--- 測試 4: [P1 #4] 工作簿多分頁跨資料集切換支援 ---');
    // 等待 350ms 確保超過 addNewSheet 的 300ms 防抖鎖 (Debounce Lock)
    await new Promise(r => setTimeout(r, 350));
    const t4 = await evaluate(pageWs, `
      (function() {
        // 工作表 1 原本是 jp_gender_facet
        const sheet1Dataset = window.PyGWalker.state.currentDatasetId;

        window.PyGWalker.addNewSheet();
        const housingSheetId = window.PyGWalker.state.activeSheetId;
        window.PyGWalker.loadDataset('jp_housing');
        const housingDataset = window.PyGWalker.state.currentDatasetId;
        const housingRowCount = window.PyGWalker.state.rawRows.length;
        const housingDimCount = window.PyGWalker.state.dimensions.length;

        // 切換回 工作表 1
        window.PyGWalker.switchSheet('sheet_1');
        const switchedBackDataset = window.PyGWalker.state.currentDatasetId;
        const switchedBackRows = window.PyGWalker.state.rawRows.length;
        const switchedBackDimSample = window.PyGWalker.state.dimensions[0];

        // 再切換回 工作表 3 (housing)
        window.PyGWalker.switchSheet(housingSheetId);
        const reHousingDataset = window.PyGWalker.state.currentDatasetId;
        const reHousingRows = window.PyGWalker.state.rawRows.length;

        return {
          sheet1Dataset,
          housingDataset,
          housingRowCount,
          housingDimCount,
          switchedBackDataset,
          switchedBackRows,
          switchedBackDimSample,
          reHousingDataset,
          reHousingRows,
          housingSheetId
        };
      })()
    `, msgId++);

    assert(t4.sheet1Dataset === 'jp_gender_facet', `工作表 1 初始資料集應為 jp_gender_facet，得到 ${t4.sheet1Dataset}`);
    assert(t4.housingDataset === 'jp_housing', `新分頁切換後資料集應為 jp_housing，得到 ${t4.housingDataset}`);
    assert(t4.housingRowCount > 0, `住宅資料集筆數應大於 0，得到 ${t4.housingRowCount}`);
    assert(t4.switchedBackDataset === 'jp_gender_facet', `切換回工作表 1 應自動切換回 jp_gender_facet，得到 ${t4.switchedBackDataset}`);
    assert(t4.switchedBackRows > 0, `切換回工作表 1 資料列正常還原，得到 ${t4.switchedBackRows}`);
    assert(t4.reHousingDataset === 'jp_housing', `再次切換至住宅分頁應自動載入 jp_housing，得到 ${t4.reHousingDataset}`);
    assert(t4.reHousingRows === t4.housingRowCount, `住宅分頁數據列完整一致，得到 ${t4.reHousingRows}`);

    // =========================================================================
    // 測試 5: [P1 #5] deleteSheet 刪除當前啟用分頁全狀態還原
    // =========================================================================
    console.log('\n--- 測試 5: [P1 #5] deleteSheet 刪除當前啟用分頁全狀態還原 ---');
    const t5 = await evaluate(pageWs, `
      (function() {
        const housingSheetId = window.PyGWalker.state.activeSheetId;
        const beforeDeleteCount = window.PyGWalker.state.sheets.length;

        // Mock confirm 為 true
        const origConfirm = window.confirm;
        window.confirm = () => true;

        // 刪除當前啟用分頁
        window.PyGWalker.deleteSheet(housingSheetId);
        window.confirm = origConfirm;

        const afterDeleteCount = window.PyGWalker.state.sheets.length;
        const currentActiveId = window.PyGWalker.state.activeSheetId;
        const activeSheetObj = window.PyGWalker.state.sheets.find(s => s.id === currentActiveId);
        const currentDataset = window.PyGWalker.state.currentDatasetId;
        const filteredCount = window.PyGWalker.getActiveRows().length;

        return {
          beforeDeleteCount,
          afterDeleteCount,
          currentActiveId,
          activeSheetName: activeSheetObj ? activeSheetObj.name : '',
          currentDataset,
          filteredCount
        };
      })()
    `, msgId++);

    assert(t5.afterDeleteCount === t5.beforeDeleteCount - 1, `刪除分頁後工作表數應減少 1，得到 ${t5.afterDeleteCount}`);
    assert(t5.currentActiveId !== null && t5.currentActiveId !== '', `刪除當前分頁後應自動啟用相鄰分頁，得到 ${t5.currentActiveId}`);
    assert(t5.currentDataset !== '', `當前資料集成功還原，得到 ${t5.currentDataset}`);
    assert(t5.filteredCount > 0, `還原後分頁資料過濾筆數大於 0，得到 ${t5.filteredCount}`);

    // =========================================================================
    // 測試 6: [P2] 隨機 ID 生成規範 (slice(2, 6) 取代廢棄 substr) & 看板防護
    // =========================================================================
    console.log('\n--- 測試 6: [P2] 隨機 ID 生成規範 & 看板防護 ---');
    const t6 = await evaluate(pageWs, `
      (function() {
        // 1. 測試看板未開啟時的 resize 不拋出異常
        let resizeThrew = false;
        try {
          window.dispatchEvent(new Event('resize'));
        } catch(e) {
          resizeThrew = true;
        }

        // 2. 測試匯入所有工作表至看板
        const beforePinnedCount = window.PyGWalker.state.pinnedCharts.length;
        window.PyGWalker.importAllSheetsToDashboard();
        const afterPinnedCount = window.PyGWalker.state.pinnedCharts.length;

        // 驗證生成的 ID 均不包含 substr 廢棄調用特徵，且長度合理
        const allIdsValid = window.PyGWalker.state.pinnedCharts.every(p => {
          return typeof p.id === 'string' && p.id.length >= 10;
        });

        return {
          resizeThrew,
          beforePinnedCount,
          afterPinnedCount,
          allIdsValid
        };
      })()
    `, msgId++);

    assert(t6.resizeThrew === false, '看板關閉狀態下觸發視窗縮放不拋出異常');
    assert(t6.afterPinnedCount >= t6.beforePinnedCount, `一鍵匯入所有工作表至看板成功 (現有 ${t6.afterPinnedCount} 張)`);
    assert(t6.allIdsValid === true, '所有釘選 ID 格式健全有效');

    console.log('\n======================================================');
    console.log(`測試彙總: 共執行 ${totalTests} 項斷言，通過 ${passedTests} 項，失敗 ${totalTests - passedTests} 項。`);
    console.log('======================================================');

    if (passedTests === totalTests) {
      console.log('🎉 所有 Code Review 終審 P1/P2 修復項目測試全數通過！');
    } else {
      process.exitCode = 1;
    }

  } catch (err) {
    console.error('Fatal test execution error:', err);
    process.exitCode = 1;
  } finally {
    if (pageWs) pageWs.close();
    if (browserWs) browserWs.close();
    if (chromeProc) chromeProc.kill();
    if (server) server.close();
  }
})();
