const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 8899;
const CDP_PORT = 9333;
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
    await new Promise(r => setTimeout(r, 1800));

    // =========================================================================
    // 測試 1: 統計輔助函式 (safeMin, safeMax, safeExtent)
    // =========================================================================
    console.log('\n--- 測試 1: 統計輔助函式安全防護 (safeMin, safeMax, safeExtent) ---');
    const statsResult = await evaluate(pageWs, `(() => {
      const dirty = ['1,250', '2,400', '890', 'N/A', null, '', undefined, '3,100.5%'];
      return {
        min: window.safeMin(dirty, 0),
        max: window.safeMax(dirty, 0),
        ext: window.safeExtent(dirty, 0, 0)
      };
    })()`, msgId++);

    assert(statsResult.min === 890, `safeMin 應正確解析千分位並排除髒資料，期望 890，得到 ${statsResult.min}`);
    assert(statsResult.max === 3100.5, `safeMax 應正確解析百分比與千分位，期望 3100.5，得到 ${statsResult.max}`);
    assert(statsResult.ext[0] === 890 && statsResult.ext[1] === 3100.5, `safeExtent 區間應為 [890, 3100.5]，得到 [${statsResult.ext.join(', ')}]`);

    // =========================================================================
    // 測試 2: Toast 彈出反饋樣式類別 (.toast-notice.show)
    // =========================================================================
    console.log('\n--- 測試 2: Toast 彈出反饋樣式類別 (.toast-notice.show) ---');
    const toastResult = await evaluate(pageWs, `(() => {
      window.PyGWalker.applyZoom(125, true);
      const toast = document.getElementById('toastNotice');
      return {
        hasShow: toast.classList.contains('show'),
        hasVisible: toast.classList.contains('visible'),
        text: toast.textContent.trim(),
        opacity: window.getComputedStyle(toast).opacity
      };
    })()`, msgId++);

    assert(toastResult.hasShow === true, `Toast 元素應包含 'show' 類別`);
    assert(toastResult.text.includes('125%'), `Toast 文字應包含縮放比例，得到 "${toastResult.text}"`);
    assert(parseFloat(toastResult.opacity) > 0, `Toast 不透明度應大於 0 (可見)，得到 ${toastResult.opacity}`);

    // 重設回 100% 確保後續測試乾淨狀態
    await evaluate(pageWs, `window.PyGWalker.resetZoom()`, msgId++);

    // =========================================================================
    // 測試 3: 方案 2 側邊欄一鍵收合/展開 (Collapsible Sidebar)
    // =========================================================================
    console.log('\n--- 測試 3: 方案 2 側邊欄一鍵收合/展開 (Collapsible Sidebar) ---');
    const sidebarInit = await evaluate(pageWs, `(() => {
      const btn = document.getElementById('btnToggleSidebar');
      const dock = document.getElementById('sidebarDock');
      const stage = document.querySelector('.main-stage');
      return {
        btnExists: !!btn,
        icon: btn ? btn.querySelector('.toggle-icon').textContent : '',
        dockWidth: dock.offsetWidth,
        stageWidth: stage.offsetWidth
      };
    })()`, msgId++);

    assert(sidebarInit.btnExists, '收合按鈕 #btnToggleSidebar 應存在於頁面');
    assert(sidebarInit.icon.includes('◀'), `展開時圖示應為 '◀'，得到 '${sidebarInit.icon}'`);
    assert(sidebarInit.dockWidth >= 300, `展開時側邊欄寬度應約 320px，得到 ${sidebarInit.dockWidth}px`);

    // 觸發收合
    await evaluate(pageWs, `(() => {
      window.PyGWalker.toggleSidebar();
    })()`, msgId++);
    await new Promise(r => setTimeout(r, 400)); // 等待 0.28s CSS transition

    const sidebarCollapsed = await evaluate(pageWs, `(() => {
      const btn = document.getElementById('btnToggleSidebar');
      const dock = document.getElementById('sidebarDock');
      const stage = document.querySelector('.main-stage');
      const body = document.querySelector('.workspace-body');
      return {
        isCollapsedClass: body.classList.contains('sidebar-collapsed'),
        icon: btn ? btn.querySelector('.toggle-icon').textContent : '',
        dockWidth: dock.offsetWidth,
        stageWidth: stage.offsetWidth,
        btnTitle: btn.title
      };
    })()`, msgId++);

    assert(sidebarCollapsed.isCollapsedClass, '主佈局應具有 .sidebar-collapsed 類別');
    assert(sidebarCollapsed.icon.includes('▶'), `收合後圖示應變更為 '▶'，得到 '${sidebarCollapsed.icon}'`);
    assert(sidebarCollapsed.dockWidth === 0, `收合後側邊欄寬度應為 0px，得到 ${sidebarCollapsed.dockWidth}px`);
    assert(sidebarCollapsed.stageWidth > sidebarInit.stageWidth + 250, `中央主舞台應全寬擴展 (前: ${sidebarInit.stageWidth}px -> 後: ${sidebarCollapsed.stageWidth}px)`);

    // 截圖收合側邊欄狀態
    const shotCollapsed = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' }, msgId++);
    fs.writeFileSync(path.join(ROOT_DIR, 'preview_frames', 'test_sidebar_collapsed.png'), Buffer.from(shotCollapsed.data, 'base64'));

    // 再次展開
    await evaluate(pageWs, `(() => {
      window.PyGWalker.toggleSidebar();
    })()`, msgId++);
    await new Promise(r => setTimeout(r, 400));

    const sidebarRestored = await evaluate(pageWs, `(() => {
      const btn = document.getElementById('btnToggleSidebar');
      const dock = document.getElementById('sidebarDock');
      const body = document.querySelector('.workspace-body');
      return {
        isCollapsedClass: body.classList.contains('sidebar-collapsed'),
        icon: btn ? btn.querySelector('.toggle-icon').textContent : '',
        dockWidth: dock.offsetWidth
      };
    })()`, msgId++);

    assert(!sidebarRestored.isCollapsedClass, '再次切換應移除 .sidebar-collapsed 類別');
    assert(sidebarRestored.icon.includes('◀'), `復原後圖示應為 '◀'，得到 '${sidebarRestored.icon}'`);
    assert(sidebarRestored.dockWidth >= 300, `復原後側邊欄應恢復寬度，得到 ${sidebarRestored.dockWidth}px`);

    // 鍵盤快捷鍵測試
    await evaluate(pageWs, `(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '[' }));
    })()`, msgId++);
    await new Promise(r => setTimeout(r, 400));
    const kbCollapsed = await evaluate(pageWs, `document.querySelector('.workspace-body').classList.contains('sidebar-collapsed')`, msgId++);
    assert(kbCollapsed === true, '按下鍵盤快捷鍵 [ 應觸發收合側邊欄');

    await evaluate(pageWs, `(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ']' }));
    })()`, msgId++);
    await new Promise(r => setTimeout(r, 400));
    const kbExpanded = await evaluate(pageWs, `!document.querySelector('.workspace-body').classList.contains('sidebar-collapsed')`, msgId++);
    assert(kbExpanded === true, '再次按下鍵盤快捷鍵 ] 應展開側邊欄');

    // =========================================================================
    // 測試 4: 方案 1 工作區縮放比例控制器 (Workspace Zoom Controller)
    // =========================================================================
    console.log('\n--- 測試 4: 方案 1 工作區縮放控制器 (Workspace Zoom Controller) ---');
    const zoomInit = await evaluate(pageWs, `(() => {
      const badge = document.getElementById('zoomLevelBadge');
      const btnOut = document.getElementById('btnZoomOut');
      const btnIn = document.getElementById('btnZoomIn');
      const btnReset = document.getElementById('btnZoomReset');
      return {
        badgeText: badge ? badge.textContent.trim() : '',
        btnOutOk: !!btnOut,
        btnInOk: !!btnIn,
        btnResetOk: !!btnReset
      };
    })()`, msgId++);

    assert(zoomInit.badgeText === '100%', `預設縮放徽章應為 100%，得到 ${zoomInit.badgeText}`);
    assert(zoomInit.btnOutOk && zoomInit.btnInOk && zoomInit.btnResetOk, '縮放控制組按鈕 [➖ 縮小] [➕ 放大] [↺ 重設] 均應存在');

    // 放大 (+125%)
    await evaluate(pageWs, `(() => { document.getElementById('btnZoomIn').click(); })()`, msgId++);
    await new Promise(r => setTimeout(r, 150));
    const zoom125 = await evaluate(pageWs, `(() => {
      const badge = document.getElementById('zoomLevelBadge');
      const vp = document.getElementById('echartsViewport');
      return {
        badge: badge ? badge.textContent.trim() : '',
        width: vp ? vp.style.width : ''
      };
    })()`, msgId++);
    assert(zoom125.badge === '125%', `點擊放大後徽章應為 125%，得到 ${zoom125.badge}`);
    assert(zoom125.width === '125%', `圖表視窗寬度應更新為 125%，得到 ${zoom125.width}`);

    // 截圖 125% 縮放狀態
    const shot125 = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' }, msgId++);
    fs.writeFileSync(path.join(ROOT_DIR, 'preview_frames', 'test_zoom_125_enlarged.png'), Buffer.from(shot125.data, 'base64'));

    // 再次放大 (+150%)
    await evaluate(pageWs, `(() => { document.getElementById('btnZoomIn').click(); })()`, msgId++);
    await new Promise(r => setTimeout(r, 150));
    const zoom150 = await evaluate(pageWs, `(() => {
      const badge = document.getElementById('zoomLevelBadge');
      const btnIn = document.getElementById('btnZoomIn');
      return {
        badge: badge ? badge.textContent.trim() : '',
        disabled: btnIn ? btnIn.disabled : false
      };
    })()`, msgId++);
    assert(zoom150.badge === '150%', `再次點擊放大徽章應為 150%，得到 ${zoom150.badge}`);
    assert(zoom150.disabled === true, '達到最大檔位 150% 時放大按鈕應自動 disabled');

    // 重設 (↺ 100%)
    await evaluate(pageWs, `(() => { document.getElementById('btnZoomReset').click(); })()`, msgId++);
    await new Promise(r => setTimeout(r, 150));
    const zoomReset = await evaluate(pageWs, `(() => {
      const badge = document.getElementById('zoomLevelBadge');
      const vp = document.getElementById('echartsViewport');
      return {
        badge: badge ? badge.textContent.trim() : '',
        width: vp ? vp.style.width : ''
      };
    })()`, msgId++);
    assert(zoomReset.badge === '100%', `點擊重設後徽章應為 100%，得到 ${zoomReset.badge}`);
    assert(zoomReset.width === '100%', `點擊重設後圖表視窗寬度應為 100%，得到 ${zoomReset.width}`);

    // 縮小兩次 (➖ 90% -> 75%)
    await evaluate(pageWs, `(() => { document.getElementById('btnZoomOut').click(); })()`, msgId++);
    await new Promise(r => setTimeout(r, 100));
    await evaluate(pageWs, `(() => { document.getElementById('btnZoomOut').click(); })()`, msgId++);
    await new Promise(r => setTimeout(r, 150));
    const zoom75 = await evaluate(pageWs, `(() => {
      const badge = document.getElementById('zoomLevelBadge');
      const btnOut = document.getElementById('btnZoomOut');
      const vp = document.getElementById('echartsViewport');
      return {
        badge: badge ? badge.textContent.trim() : '',
        disabled: btnOut ? btnOut.disabled : false,
        width: vp ? vp.style.width : ''
      };
    })()`, msgId++);
    assert(zoom75.badge === '75%', `連續縮小兩次後徽章應為 75%，得到 ${zoom75.badge}`);
    assert(zoom75.disabled === true, '達到最小檔位 75% 時縮小按鈕應自動 disabled');
    assert(zoom75.width === '75%', `圖表視窗寬度應更新為 75%，得到 ${zoom75.width}`);

    // 重設回 100% 拍攝截圖
    await evaluate(pageWs, `(() => { document.getElementById('btnZoomReset').click(); })()`, msgId++);
    await new Promise(r => setTimeout(r, 200));

    const shotData = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' }, msgId++);
    const screenshotPath = path.join(ROOT_DIR, 'preview_frames', 'test_zoom_sidebar_verified.png');
    fs.writeFileSync(screenshotPath, Buffer.from(shotData.data, 'base64'));
    console.log(`\n📸 截圖已儲存至：${screenshotPath}`);

    // 總結測試結果
    console.log('\n======================================================');
    console.log(`測試彙總: 共執行 ${totalTests} 項斷言，通過 ${passedTests} 項，失敗 ${totalTests - passedTests} 項。`);
    console.log('======================================================');

    if (passedTests === totalTests) {
      console.log('🎉 所有單元與端到端互動測試全部通過！');
    } else {
      process.exitCode = 1;
    }

  } catch (err) {
    console.error('測試執行發生例外錯誤:', err);
    process.exitCode = 1;
  } finally {
    if (pageWs) pageWs.close();
    if (browserWs) browserWs.close();
    if (chromeProc) chromeProc.kill();
    if (server) server.close();
  }
})();
