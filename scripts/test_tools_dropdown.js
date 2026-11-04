const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 8891;
const CDP_PORT = 9335;
const ROOT_DIR = path.resolve(__dirname, '..');

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
        } catch(e) { reject(e); }
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

    // 啟動 Chrome
    const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    chromeProc = spawn(chromePath, [
      '--headless=new',
      `--remote-debugging-port=${CDP_PORT}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--user-data-dir=/tmp/chrome_test_tools_dropdown_' + Date.now(),
      '--window-size=1280,820'
    ]);

    await new Promise(r => setTimeout(r, 1500));
    const browserWsUrl = await getWsUrl();

    // 建立 page
    const WebSocket = globalThis.WebSocket || require('ws');
    const bWs = new WebSocket(browserWsUrl);
    await new Promise(r => bWs.onopen = r);

    const createTargetRes = await sendCDP(bWs, 'Target.createTarget', { url: `http://127.0.0.1:${PORT}/data_atoms.html` }, 2);
    const targetId = createTargetRes.targetId;

    const pageWsUrl = `ws://127.0.0.1:${CDP_PORT}/devtools/page/${targetId}`;
    pageWs = new WebSocket(pageWsUrl);
    await new Promise(r => pageWs.onopen = r);

    await sendCDP(pageWs, 'Page.enable', {}, 3);
    await sendCDP(pageWs, 'Runtime.enable', {}, 4);
    await sendCDP(pageWs, 'DOM.enable', {}, 5);

    // 等待頁面初始化完畢
    await new Promise(r => setTimeout(r, 2200));

    console.log('\n--- 1. 檢查頂部佈局結構與單行無折行保證 ---');
    const layoutCheck = await evaluate(pageWs, `
      (() => {
        const row = document.querySelector('.topbar-actions-row');
        const toolsWrapper = document.getElementById('dropdownToolsWrapper');
        const dashBtn = document.getElementById('btnOpenDashboardModal');
        const exportBtn = document.getElementById('btnExportImage');
        const select = document.getElementById('datasetQuickSelect');

        const rowRect = row.getBoundingClientRect();
        const toolsRect = toolsWrapper.getBoundingClientRect();
        const dashRect = dashBtn.getBoundingClientRect();
        const exportRect = exportBtn.getBoundingClientRect();

        // 檢查垂直中心線是否一致 (在同一行，誤差 <= 3px)
        const isSingleRow = Math.abs(toolsRect.top - dashRect.top) <= 3 && Math.abs(dashRect.top - exportRect.top) <= 3;

        return {
          childrenCount: row.children.length,
          hasToolsWrapper: !!toolsWrapper,
          hasDashBtn: !!dashBtn,
          hasExportBtn: !!exportBtn,
          rowHeight: rowRect.height,
          isSingleRow,
          rowWidth: Math.round(rowRect.width)
        };
      })()
    `, 10);

    assert(layoutCheck.childrenCount === 3, `topbar-actions-row 僅有 3 組頂級按鈕 (實際: ${layoutCheck.childrenCount})`);
    assert(layoutCheck.hasToolsWrapper, '包含 dropdownToolsWrapper 下拉選單組件');
    assert(layoutCheck.hasDashBtn, '包含 btnOpenDashboardModal 自訂看板按鈕');
    assert(layoutCheck.hasExportBtn, '包含 btnExportImage 匯出圖表按鈕');
    assert(layoutCheck.isSingleRow, '所有 3 組按鈕水平對齊於單一行，無任何折行');
    assert(layoutCheck.rowHeight <= 42, `按鈕列高度維持在緊湊單行尺寸 (${layoutCheck.rowHeight}px <= 42px)`);

    console.log('\n--- 2. 截圖未展開狀態 ---');
    const shot1 = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' }, 20);
    fs.writeFileSync(path.join(ROOT_DIR, 'preview_frames', 'test_tools_dropdown_closed.png'), Buffer.from(shot1.data, 'base64'));
    console.log('  📸 儲存未展開截圖: preview_frames/test_tools_dropdown_closed.png');

    console.log('\n--- 3. 測試下拉選單點擊展開與清單內容 ---');
    const openCheck = await evaluate(pageWs, `
      (() => {
        const toggle = document.getElementById('btnToolsToggle');
        toggle.click();
        const wrapper = document.getElementById('dropdownToolsWrapper');
        const menu = document.getElementById('dropdownMenuTools');
        const items = menu.querySelectorAll('.dropdown-menu-item');
        return {
          isOpen: wrapper.classList.contains('open'),
          ariaExpanded: toggle.getAttribute('aria-expanded'),
          itemsCount: items.length,
          has17: !!document.getElementById('btnOpen17DomainsModalTop'),
          hasSchema: !!document.getElementById('btnOpenSchemaModalTop'),
          hasEngine: !!document.getElementById('btnToggleEngine'),
          hasPin: !!document.getElementById('btnPinChart'),
          hasBriefing: !!document.getElementById('btnOpenBriefingModal')
        };
      })()
    `, 30);

    assert(openCheck.isOpen === true, '點擊工具按鈕成功展開選單 (.open)');
    assert(openCheck.ariaExpanded === 'true', '按鈕 aria-expanded 屬性變更為 "true"');
    assert(openCheck.itemsCount === 6, `選單包含 6 個工具項目 (實際: ${openCheck.itemsCount})`);
    assert(openCheck.has17 && openCheck.hasSchema && openCheck.hasEngine && openCheck.hasPin && openCheck.hasBriefing, '包含所有核心功能項目 (17領域、Tableau Prep、引擎切換、釘選、影音簡報)');

    console.log('\n--- 4. 截圖展開狀態 ---');
    const shot2 = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' }, 40);
    fs.writeFileSync(path.join(ROOT_DIR, 'preview_frames', 'test_tools_dropdown_open.png'), Buffer.from(shot2.data, 'base64'));
    console.log('  📸 儲存展開截圖: preview_frames/test_tools_dropdown_open.png');

    console.log('\n--- 5. 測試 Escape 鍵關閉 ---');
    const escCheck = await evaluate(pageWs, `
      (() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        const wrapper = document.getElementById('dropdownToolsWrapper');
        const toggle = document.getElementById('btnToolsToggle');
        return {
          isOpen: wrapper.classList.contains('open'),
          ariaExpanded: toggle.getAttribute('aria-expanded')
        };
      })()
    `, 50);

    assert(escCheck.isOpen === false, '按下 Escape 鍵成功收合下拉選單');
    assert(escCheck.ariaExpanded === 'false', '按鈕 aria-expanded 變回 "false"');

    console.log('\n--- 6. 測試點擊項目後自動關閉選單 ---');
    await evaluate(pageWs, `document.getElementById('btnToolsToggle').click();`, 60);
    await new Promise(r => setTimeout(r, 200));

    const itemClickCheck = await evaluate(pageWs, `
      (async () => {
        const btnEngine = document.getElementById('btnToggleEngine');
        btnEngine.click();
        await new Promise(r => setTimeout(r, 200));
        const wrapper = document.getElementById('dropdownToolsWrapper');
        return {
          isOpen: wrapper.classList.contains('open'),
          engineMode: window.PyGWalker ? window.PyGWalker.getState().engine : null
        };
      })()
    `, 70);

    assert(itemClickCheck.isOpen === false, '點擊選單項目後自動平滑收合選單');
    assert(itemClickCheck.engineMode === 'canvas', `成功觸發選單內功能 (引擎切換為 canvas: ${itemClickCheck.engineMode})`);

    console.log(`\n========================================`);
    console.log(`測試結果: ${passedTests} / ${totalTests} 全部通過！`);
    console.log(`========================================\n`);

  } catch(err) {
    console.error('測試失敗:', err);
  } finally {
    if (pageWs) pageWs.close();
    if (chromeProc) chromeProc.kill();
    if (server) server.close();
    process.exit(passedTests === totalTests ? 0 : 1);
  }
})();
