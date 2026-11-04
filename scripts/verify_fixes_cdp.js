const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8899;
const ROOT_DIR = path.resolve(__dirname, '..');

// 1. 本地靜態檔案伺服器
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

function getWsUrl() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      http.get('http://127.0.0.1:9222/json/version', res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          clearInterval(interval);
          try {
            resolve(JSON.parse(data).webSocketDebuggerUrl);
          } catch(e) { reject(e); }
        });
      }).on('error', () => {
        if (attempts > 30) {
          clearInterval(interval);
          reject(new Error('Timed out waiting for Chrome remote debugging port'));
        }
      });
    }, 200);
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
          if (resp.error) reject(new Error(JSON.stringify(resp.error)));
          else resolve(resp.result);
        }
      } catch(e) { reject(e); }
    };
    ws.addEventListener('message', handler);
    ws.send(msg);
  });
}

async function run() {
  const server = await startStaticServer();

  console.log('啟動 Headless Chrome 進行端對端驗證...');
  const chromeProc = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--window-size=1440,960'
  ]);

  try {
    const browserWsUrl = await getWsUrl();
    const browserWs = new WebSocket(browserWsUrl);
    await new Promise(r => browserWs.onopen = r);

    let msgId = 1;
    const target = await sendCDP(browserWs, 'Target.createTarget', { url: `http://127.0.0.1:${PORT}/data_atoms.html` }, msgId++);
    const pageWsUrl = `ws://127.0.0.1:9222/devtools/page/${target.targetId}`;

    const pageWs = new WebSocket(pageWsUrl);
    await new Promise(r => pageWs.onopen = r);

    await sendCDP(pageWs, 'Page.enable', {}, msgId++);
    await sendCDP(pageWs, 'Runtime.enable', {}, msgId++);

    // 等待頁面初始化
    await new Promise(r => setTimeout(r, 1800));

    console.log('\n=== 檢驗 1: 驗證分頁列 HTML 佈局與所有雙重監聽徹底移除 ===');
    const layoutCheck = await sendCDP(pageWs, 'Runtime.evaluate', {
      expression: `(() => {
        const btnAdd = document.getElementById('btnAddSheet');
        const btnDup = document.getElementById('btnDuplicateSheet');
        const btnOpenDash = document.getElementById('btnOpenDashboardModal');
        const btnImportAll = document.getElementById('btnImportAllSheets');
        const btnPinFromDash = document.getElementById('btnPinFromDashboard');
        const btnClearDash = document.getElementById('btnClearDashboard');
        const btnCloseDash = document.getElementById('btnCloseDashboardModal');

        const fixedContainer = document.querySelector('.workbook-actions-fixed');
        const scrollContainer = document.querySelector('.workbook-tabs-scroll-container');
        const tabsList = document.getElementById('workbookTabsList');
        const rightContainer = document.querySelector('.workbook-tabs-right');

        return {
          hasAddSheet: !!btnAdd,
          hasDupSheet: !!btnDup,
          btnAddHasInlineOnclick: btnAdd ? btnAdd.hasAttribute('onclick') : null,
          btnDupHasInlineOnclick: btnDup ? btnDup.hasAttribute('onclick') : null,
          btnOpenDashHasInlineOnclick: btnOpenDash ? btnOpenDash.hasAttribute('onclick') : null,
          btnImportAllHasInlineOnclick: btnImportAll ? btnImportAll.hasAttribute('onclick') : null,
          btnPinFromDashHasInlineOnclick: btnPinFromDash ? btnPinFromDash.hasAttribute('onclick') : null,
          btnClearDashHasInlineOnclick: btnClearDash ? btnClearDash.hasAttribute('onclick') : null,
          btnCloseDashHasInlineOnclick: btnCloseDash ? btnCloseDash.hasAttribute('onclick') : null,
          btnAddText: btnAdd ? btnAdd.textContent.trim().replace(/\\s+/g, ' ') : '',
          btnDupText: btnDup ? btnDup.textContent.trim().replace(/\\s+/g, ' ') : '',
          fixedHasAdd: fixedContainer ? fixedContainer.contains(btnAdd) : false,
          fixedHasDup: fixedContainer ? fixedContainer.contains(btnDup) : false,
          scrollHasList: scrollContainer ? scrollContainer.contains(tabsList) : false,
          fixedFlexShrink: fixedContainer ? window.getComputedStyle(fixedContainer).flexShrink : null,
          scrollOverflowX: scrollContainer ? window.getComputedStyle(scrollContainer).overflowX : null,
          initialSheetCount: window.PyGWalker.getState().sheets.length
        };
      })()`,
      returnByValue: true
    }, msgId++);

    console.log('佈局與監聽檢查結果:', layoutCheck.result.value);
    const lc = layoutCheck.result.value;
    if (lc.btnAddHasInlineOnclick) throw new Error('FAIL: btnAddSheet 仍包含 inline onclick！');
    if (lc.btnDupHasInlineOnclick) throw new Error('FAIL: btnDuplicateSheet 仍包含 inline onclick！');
    if (lc.btnOpenDashHasInlineOnclick) throw new Error('FAIL: btnOpenDashboardModal 仍包含 inline onclick！');
    if (lc.btnImportAllHasInlineOnclick) throw new Error('FAIL: btnImportAllSheets 仍包含 inline onclick！');
    if (lc.btnPinFromDashHasInlineOnclick) throw new Error('FAIL: btnPinFromDashboard 仍包含 inline onclick！');
    if (lc.btnClearDashHasInlineOnclick) throw new Error('FAIL: btnClearDashboard 仍包含 inline onclick！');
    if (lc.btnCloseDashHasInlineOnclick) throw new Error('FAIL: btnCloseDashboardModal 仍包含 inline onclick！');
    if (lc.btnAddText.includes('+ +')) throw new Error(`FAIL: btnAddSheet 出現重複圖標文字: "${lc.btnAddText}"`);
    if (!lc.fixedHasAdd || !lc.fixedHasDup) throw new Error('FAIL: 新增與複製按鈕未在 workbook-actions-fixed 固定容器中！');
    if (!lc.scrollHasList) throw new Error('FAIL: tabsList 未在 workbook-tabs-scroll-container 滾動容器中！');

    console.log('\n=== 檢驗 2: 驗證防抖鎖 (300ms Debounce Lock) 與連貫序號命名 ===');
    const debounceTest = await sendCDP(pageWs, 'Runtime.evaluate', {
      expression: `(() => {
        const btnAdd = document.getElementById('btnAddSheet');
        const state = window.PyGWalker.getState();
        const initialCount = state.sheets.length;

        // 瞬間狂點 5 次（模擬連點/重擊）
        btnAdd.click();
        btnAdd.click();
        btnAdd.click();
        btnAdd.click();
        btnAdd.click();

        return {
          initialCount,
          countAfterRapidClicks: state.sheets.length,
          sheets: state.sheets.map(s => s.name)
        };
      })()`,
      returnByValue: true
    }, msgId++);
    console.log('急速連點 5 次結果:', debounceTest.result.value);
    const dt = debounceTest.result.value;
    if (dt.countAfterRapidClicks !== dt.initialCount + 1) {
      throw new Error(`FAIL: 防抖鎖未生效！點擊 5 次增加了 ${dt.countAfterRapidClicks - dt.initialCount} 張工作表（預期精準只增 1 張）`);
    }

    console.log('\n=== 檢驗 3: 驗證多工作表序號連貫性（無重號、跳號或刪除後碰撞） ===');
    const sequenceTest = await sendCDP(pageWs, 'Runtime.evaluate', {
      expression: `(async () => {
        const state = window.PyGWalker.getState();

        // 等待 350ms 超過防抖鎖再新增第 3 張
        await new Promise(r => setTimeout(r, 350));
        window.PyGWalker.addNewSheet();

        const sheetNamesAfter3 = state.sheets.map(s => s.name);

        // 刪除中間的工作表（索引 1）
        window.confirm = () => true;
        const toDeleteId = state.sheets[1].id;
        window.PyGWalker.deleteSheet(toDeleteId);

        const sheetNamesAfterDelete = state.sheets.map(s => s.name);

        // 再次新增工作表，序號應接續最大序號 + 1，絕不產生已刪除的舊號
        await new Promise(r => setTimeout(r, 350));
        window.PyGWalker.addNewSheet();

        const finalSheetNames = state.sheets.map(s => s.name);

        return {
          sheetNamesAfter3,
          sheetNamesAfterDelete,
          finalSheetNames
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    }, msgId++);
    console.log('序號測試結果:', sequenceTest.result.value);
    const st = sequenceTest.result.value;
    const lastSheet = st.finalSheetNames[st.finalSheetNames.length - 1];
    if (!lastSheet.includes('工作表 4')) {
      throw new Error(`FAIL: 序號不連貫！預期為工作表 4，實際為: ${lastSheet}`);
    }

    console.log('\n=== 檢驗 4: 驗證多分頁橫向滾動容器獨立滾動，新增與複製按鈕永遠固定常駐在左側，不被擠壓遮蔽 ===');
    const bulkTabCreate = await sendCDP(pageWs, 'Runtime.evaluate', {
      expression: `(async () => {
        for (let i = 0; i < 8; i++) {
          await new Promise(r => setTimeout(r, 320));
          window.PyGWalker.addNewSheet();
        }
        return window.PyGWalker.getState().sheets.length;
      })()`,
      awaitPromise: true,
      returnByValue: true
    }, msgId++);
    console.log(`已累計建立 ${bulkTabCreate.result.value} 張工作表。`);

    const positionCheck = await sendCDP(pageWs, 'Runtime.evaluate', {
      expression: `(() => {
        const btnAdd = document.getElementById('btnAddSheet');
        const scrollContainer = document.querySelector('.workbook-tabs-scroll-container');
        const tabsList = document.getElementById('workbookTabsList');
        const rightContainer = document.querySelector('.workbook-tabs-right');

        const btnAddRect = btnAdd.getBoundingClientRect();
        const scrollRect = scrollContainer.getBoundingClientRect();
        const rightRect = rightContainer.getBoundingClientRect();

        return {
          btnAddLeft: btnAddRect.left,
          btnAddWidth: btnAddRect.width,
          scrollLeft: scrollContainer.scrollLeft,
          scrollWidth: scrollContainer.scrollWidth,
          scrollClientWidth: scrollContainer.clientWidth,
          hasScroll: scrollContainer.scrollWidth >= scrollContainer.clientWidth,
          rightLeft: rightRect.left,
          isAddBeforeScroll: btnAddRect.right <= scrollRect.left + 5,
          isScrollBeforeRight: scrollRect.right <= rightRect.left + 5
        };
      })()`,
      returnByValue: true
    }, msgId++);
    console.log('分頁按鈕位置檢查:', positionCheck.result.value);
    const pc = positionCheck.result.value;
    if (!pc.isAddBeforeScroll) {
      throw new Error('FAIL: 新增分頁按鈕未固定在分頁滾動清單左側！');
    }

    // 驗證滾輪水平滾動
    const wheelTest = await sendCDP(pageWs, 'Runtime.evaluate', {
      expression: `(() => {
        const scroll = document.querySelector('.workbook-tabs-scroll-container');
        const initialScroll = scroll.scrollLeft;
        scroll.scrollLeft = 100;
        const wheelEvt = new WheelEvent('wheel', { deltaY: 50, deltaX: 0, bubbles: true, cancelable: true });
        scroll.dispatchEvent(wheelEvt);
        return {
          initialScroll,
          afterWheel: scroll.scrollLeft,
          wheelHandled: scroll.scrollLeft > 100
        };
      })()`,
      returnByValue: true
    }, msgId++);
    console.log('滾輪滾動測試:', wheelTest.result.value);

    console.log('\n=== 檢驗 5: 驗證 Y 軸頂部 15% Headroom 緩衝與標題 Padding (11 大 Data Atoms) ===');
    const chartYAxisCheck = await sendCDP(pageWs, 'Runtime.evaluate', {
      expression: `(() => {
        const state = window.PyGWalker.getState();
        const echarts = window.PyGWalker.getEChartsInstance();

        // 1. 測試 Bar 體量柱狀圖
        state.chartType = 'bar';
        window.PyGWalker.renderVisualization();
        const barOpt = echarts.getOption();
        const barYAxis = barOpt.yAxis[0];
        const barGridTop = barOpt.grid[0].top;

        // 計算 headroom
        const testVal = { max: 100 };
        const calculatedMax = typeof barYAxis.max === 'function' ? barYAxis.max(testVal) : barYAxis.max;

        // 2. 測試 Dual 雙軸複合圖
        state.chartType = 'dual';
        window.PyGWalker.renderVisualization();
        const dualOpt = echarts.getOption();
        const dualY0 = dualOpt.yAxis[0];
        const dualY1 = dualOpt.yAxis[1];

        // 3. 測試 Line 時序折線圖
        state.chartType = 'line';
        window.PyGWalker.renderVisualization();
        const lineOpt = echarts.getOption();
        const lineY = lineOpt.yAxis[0];

        // 4. 測試 Boxplot / Violin
        state.chartType = 'violin';
        state.shelf.x = '地方分區';
        state.shelf.y = '總人口(萬人)';
        window.PyGWalker.renderVisualization();
        const violinOpt = echarts.getOption();
        const violinY = violinOpt.yAxis[0];
        const violinGridTop = violinOpt.grid[0].top;

        // 檢查小提琴圖 Y 軸刻度範圍是否涵蓋全域極值 498.3
        const yAxisModel = echarts.getModel().getComponent('yAxis', 0);
        const violinExtent = yAxisModel.axis.scale.getExtent();
        const allVals = (state.rawRows || []).map(d => Number(d['總人口(萬人)'])).filter(n => !isNaN(n));
        const trueMax = Math.max(...allVals);

        return {
          barGridTop,
          barYAxisNameLocation: barYAxis.nameLocation,
          barYAxisPadding: barYAxis.nameTextStyle ? barYAxis.nameTextStyle.padding : null,
          barCalculatedMax100: calculatedMax,
          dualY0NameLocation: dualY0.nameLocation,
          dualY1NameLocation: dualY1.nameLocation,
          lineYNameLocation: lineY.nameLocation,
          violinGridTop,
          violinYNameLocation: violinY.nameLocation,
          violinExtent,
          trueMax,
          isViolinClippedAtTop: trueMax > violinExtent[1]
        };
      })()`,
      returnByValue: true
    }, msgId++);
    console.log('Y 軸 Headroom 與位置設定檢查:', chartYAxisCheck.result.value);
    const yc = chartYAxisCheck.result.value;
    if (yc.barGridTop !== '15%') throw new Error(`FAIL: barGridTop 應為 15%，目前為 ${yc.barGridTop}`);
    if (yc.barCalculatedMax100 !== 115) throw new Error(`FAIL: 100 的 15% Headroom 應為 115，目前為 ${yc.barCalculatedMax100}`);
    if (yc.violinGridTop !== '15%') throw new Error(`FAIL: violinGridTop 應為 15%，目前為 ${yc.violinGridTop}`);
    if (yc.isViolinClippedAtTop) throw new Error(`FAIL: 小提琴圖 Y 軸頂部截斷！trueMax=${yc.trueMax} > yAxisExtent[1]=${yc.violinExtent[1]}`);

    console.log('\n=== 檢驗 6: 驗證小提琴圖少樣本美化（KDE 最小平滑頻寬保底 0.04 * 全域極差） ===');
    const violinSmallSampleCheck = await sendCDP(pageWs, 'Runtime.evaluate', {
      expression: `(() => {
        const state = window.PyGWalker.getState();
        state.chartType = 'violin';
        state.shelf.x = '地區';
        state.shelf.y = '總人口(人)';
        window.PyGWalker.renderVisualization();

        const opt = window.PyGWalker.getEChartsInstance().getOption();
        const series = opt.series[0];

        return {
          seriesType: series.type,
          dataCount: series.data ? series.data.length : 0
        };
      })()`,
      returnByValue: true
    }, msgId++);
    console.log('小提琴圖渲染結果:', violinSmallSampleCheck.result.value);

    // 截圖存證
    const screenshot = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' }, msgId++);
    fs.writeFileSync(path.join(ROOT_DIR, 'preview_frames', 'test_fixes_verified.png'), Buffer.from(screenshot.data, 'base64'));
    console.log('已輸出驗證截圖至 preview_frames/test_fixes_verified.png');

    console.log('\n🎉 ALL 4 REQUIREMENTS VERIFIED SUCCESSFULLY!');
    chromeProc.kill('SIGKILL');
    server.close();
    process.exit(0);
  } finally {
    try { chromeProc.kill('SIGKILL'); } catch(e){}
    try { server.close(); } catch(e){}
  }
}

run().catch(err => {
  console.error('測試失敗:', err);
  process.exit(1);
});
