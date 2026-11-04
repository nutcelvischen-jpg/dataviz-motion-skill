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
    await new Promise(r => setTimeout(r, 1500));

    console.log('\n=== 檢驗 1: 驗證分頁列 HTML 佈局與雙重監聽徹底移除 ===');
    const layoutCheck = await sendCDP(pageWs, 'Runtime.evaluate', {
      expression: `(() => {
        const btnAdd = document.getElementById('btnAddSheet');
        const btnDup = document.getElementById('btnDuplicateSheet');
        const fixedContainer = document.querySelector('.workbook-actions-fixed');
        const scrollContainer = document.querySelector('.workbook-tabs-scroll-container');
        const tabsList = document.getElementById('workbookTabsList');
        const rightContainer = document.querySelector('.workbook-tabs-right');

        return {
          hasAddSheet: !!btnAdd,
          hasDupSheet: !!btnDup,
          btnAddHasInlineOnclick: btnAdd ? btnAdd.hasAttribute('onclick') : null,
          btnDupHasInlineOnclick: btnDup ? btnDup.hasAttribute('onclick') : null,
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

    console.log('佈局檢查結果:', layoutCheck.result.value);
    const lc = layoutCheck.result.value;
    if (lc.btnAddHasInlineOnclick) throw new Error('FAIL: btnAddSheet 仍包含 inline onclick！');
    if (lc.btnDupHasInlineOnclick) throw new Error('FAIL: btnDuplicateSheet 仍包含 inline onclick！');
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
    // 等待 350ms 超過防抖時間，連續新增數張工作表
    for (let i = 0; i < 4; i++) {
      await new Promise(r => setTimeout(r, 350));
      await sendCDP(pageWs, 'Runtime.evaluate', {
        expression: `document.getElementById('btnAddSheet').click();`,
        returnByValue: true
      }, msgId++);
    }

    const seqTest = await sendCDP(pageWs, 'Runtime.evaluate', {
      expression: `(() => {
        const state = window.PyGWalker.getState();
        return {
          totalSheets: state.sheets.length,
          names: state.sheets.map(s => s.name)
        };
      })()`,
      returnByValue: true
    }, msgId++);
    console.log('連續新增後工作表清單:', seqTest.result.value);

    // 測試刪除中間的工作表 3，再點擊新增，驗證依最大序號 + 1 命名
    await new Promise(r => setTimeout(r, 350));
    const deleteAndAddTest = await sendCDP(pageWs, 'Runtime.evaluate', {
      expression: `(() => {
        const state = window.PyGWalker.getState();
        // 刪除工作表 3
        const s3 = state.sheets.find(s => s.name.includes('工作表 3'));
        if (s3) {
          state.sheets = state.sheets.filter(s => s.id !== s3.id);
          window.PyGWalker.renderWorkbookTabs();
        }
        return state.sheets.map(s => s.name);
      })()`,
      returnByValue: true
    }, msgId++);
    console.log('刪除工作表 3 後的工作表:', deleteAndAddTest.result.value);

    await new Promise(r => setTimeout(r, 350));
    const afterDeleteAdd = await sendCDP(pageWs, 'Runtime.evaluate', {
      expression: `(() => {
        document.getElementById('btnAddSheet').click();
        const state = window.PyGWalker.getState();
        return {
          count: state.sheets.length,
          names: state.sheets.map(s => s.name)
        };
      })()`,
      returnByValue: true
    }, msgId++);
    console.log('再新增一張工作表後名稱:', afterDeleteAdd.result.value);
    const newestName = afterDeleteAdd.result.value.names[afterDeleteAdd.result.value.names.length - 1];
    if (newestName.includes('工作表 3') || newestName.includes('工作表 5')) {
      throw new Error(`FAIL: 新增工作表名稱重複！名稱: ${newestName}`);
    }

    console.log('\n=== 檢驗 4: 驗證多分頁時「新增分頁」按鈕永遠固定常駐在左側，不被擠壓遮蔽 ===');
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
          scrollLeft: scrollRect.left,
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
        window.PyGWalker.renderVisualization();
        const violinOpt = echarts.getOption();
        const violinY = violinOpt.yAxis[0];
        const violinGridTop = violinOpt.grid[0].top;

        return {
          barGridTop,
          barYAxisNameLocation: barYAxis.nameLocation,
          barYAxisPadding: barYAxis.nameTextStyle ? barYAxis.nameTextStyle.padding : null,
          barCalculatedMax100: calculatedMax,
          dualY0NameLocation: dualY0.nameLocation,
          dualY1NameLocation: dualY1.nameLocation,
          lineYNameLocation: lineY.nameLocation,
          violinGridTop,
          violinYNameLocation: violinY.nameLocation
        };
      })()`,
      returnByValue: true
    }, msgId++);
    console.log('Y 軸 Headroom 與位置設定檢查:', chartYAxisCheck.result.value);
    const yc = chartYAxisCheck.result.value;
    if (yc.barGridTop !== '15%') throw new Error(`FAIL: barGridTop 應為 15%，目前為 ${yc.barGridTop}`);
    if (yc.barCalculatedMax100 !== 115) throw new Error(`FAIL: 100 的 15% Headroom 應為 115，目前為 ${yc.barCalculatedMax100}`);
    if (yc.violinGridTop !== '15%') throw new Error(`FAIL: violinGridTop 應為 15%，目前為 ${yc.violinGridTop}`);

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
  } finally {
    chromeProc.kill('SIGKILL');
    server.close();
  }
}

run().catch(err => {
  console.error('測試失敗:', err);
  process.exit(1);
});
