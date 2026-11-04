const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const PORT = 8899;
const ROOT_DIR = path.resolve(__dirname, '..');

function startStaticServer() {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.mp4': 'video/mp4'
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/data_atoms.html';
    const filePath = path.join(ROOT_DIR, reqPath);

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found: ' + reqPath);
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      if (ext === '.mp4') {
        const range = req.headers.range;
        const total = stats.size;
        if (range) {
          const parts = range.replace(/bytes=/, "").split("-");
          const partialstart = parts[0];
          const partialend = parts[1];
          const start = parseInt(partialstart, 10);
          const end = partialend ? parseInt(partialend, 10) : total - 1;
          const chunksize = (end - start) + 1;
          const file = fs.createReadStream(filePath, { start, end });
          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${total}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': contentType
          });
          file.pipe(res);
          return;
        } else {
          res.writeHead(200, {
            'Content-Length': total,
            'Accept-Ranges': 'bytes',
            'Content-Type': contentType
          });
          fs.createReadStream(filePath).pipe(res);
          return;
        }
      }

      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    });
  });

  return new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`[Static Server] Running on http://127.0.0.1:${PORT}`);
      resolve(server);
    });
  });
}

(async () => {
  const server = await startStaticServer();
  const pageErrors = [];
  const consoleErrors = [];

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on('pageerror', err => {
      console.error('>>> [PAGE ERROR]:', err.message);
      pageErrors.push(err.message);
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('>>> [CONSOLE ERROR]:', msg.text());
        consoleErrors.push(msg.text());
      }
    });

    console.log('\n--- 1. 載入 data_atoms.html ---');
    await page.goto(`http://127.0.0.1:${PORT}/data_atoms.html`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // ==========================================
    // 測試 [#5] Briefing Modal 導演層彈窗完整互動
    // ==========================================
    console.log('\n--- 2. 測試 [#5] Briefing Modal 導演層互動事件 ---');
    
    // 開啟彈窗
    await page.click('#btnOpenBriefingModal');
    await new Promise(r => setTimeout(r, 500));

    const isOpen = await page.$eval('#briefingModal', el => el.classList.contains('open'));
    console.log('彈窗開啟狀態:', isOpen);
    if (!isOpen) throw new Error('#briefingModal 未能成功開啟！');

    // 預設為 Sales Lens
    const defaultSalesCheck = await page.evaluate(() => {
      const video = document.getElementById('briefingVideoPlayer');
      const videoSrc = document.getElementById('briefingVideoSrc');
      const btnDownload = document.getElementById('btnDownloadBriefingVideo');
      const s1 = document.getElementById('s1_script');
      return {
        salesActive: document.getElementById('btnLensSales').classList.contains('active'),
        scmActive: document.getElementById('btnLensScm').classList.contains('active'),
        poster: video.poster,
        src: videoSrc.getAttribute('src'),
        downloadHref: btnDownload.getAttribute('href'),
        s1Script: s1.value
      };
    });
    console.log('預設 Sales 檢查:', defaultSalesCheck);
    if (!defaultSalesCheck.salesActive || !defaultSalesCheck.src.includes('data_briefing_bauhaus_34s.mp4')) {
      throw new Error('預設 Sales Lens 狀態不符合預期！');
    }

    // 切換至 SCM Lens
    console.log('切換至 SCM 鏡頭...');
    await page.click('#btnLensScm');
    await new Promise(r => setTimeout(r, 400));

    const scmCheck = await page.evaluate(() => {
      const video = document.getElementById('briefingVideoPlayer');
      const videoSrc = document.getElementById('briefingVideoSrc');
      const btnDownload = document.getElementById('btnDownloadBriefingVideo');
      const s1 = document.getElementById('s1_script');
      const chip = document.getElementById('lensKpiChip');
      return {
        salesActive: document.getElementById('btnLensSales').classList.contains('active'),
        scmActive: document.getElementById('btnLensScm').classList.contains('active'),
        poster: video.poster,
        src: videoSrc.getAttribute('src'),
        downloadHref: btnDownload.getAttribute('href'),
        s1Script: s1.value,
        chipText: chip.innerText
      };
    });
    console.log('SCM 切換檢查結果:', scmCheck);
    if (!scmCheck.scmActive || !scmCheck.src.includes('briefing_supply_chain_34s.mp4')) {
      throw new Error('SCM Lens 切換影片失敗！');
    }
    if (!scmCheck.s1Script.includes('供應鏈總庫存')) {
      throw new Error('SCM Lens 分鏡文字未能正確更新！');
    }

    // 測試 Tone 切換 (Team)
    console.log('切換旁白風格至業務拆解 (Team)...');
    await page.click('#btnToneTeam');
    await new Promise(r => setTimeout(r, 400));

    const teamToneCheck = await page.evaluate(() => {
      const s1 = document.getElementById('s1_script');
      return {
        teamActive: document.getElementById('btnToneTeam').classList.contains('active'),
        execActive: document.getElementById('btnToneExec').classList.contains('active'),
        s1Script: s1.value
      };
    });
    console.log('Team 旁白檢查結果:', teamToneCheck);
    if (!teamToneCheck.teamActive || !teamToneCheck.s1Script.includes('倉儲物流組')) {
      throw new Error('Team 旁白文字未能正確套用！');
    }

    // 測試分鏡卡片點擊時間跳轉
    console.log('測試點擊第 3 幕卡片 (17s)...');
    await page.click('.story-item[data-scene="3"]');
    await new Promise(r => setTimeout(r, 400));

    const seekCheck = await page.evaluate(() => {
      const video = document.getElementById('briefingVideoPlayer');
      const scene3Card = document.querySelector('.story-item[data-scene="3"]');
      const scene1Card = document.querySelector('.story-item[data-scene="1"]');
      return {
        currentTime: video.currentTime,
        scene3Active: scene3Card.classList.contains('active') || scene3Card.classList.contains('active-scene'),
        scene1Active: scene1Card.classList.contains('active') || scene1Card.classList.contains('active-scene')
      };
    });
    console.log('時間軸跳轉檢查:', seekCheck);
    if (seekCheck.currentTime < 16.5 || !seekCheck.scene3Active || seekCheck.scene1Active) {
      throw new Error(`時間軸跳轉失敗！currentTime=${seekCheck.currentTime}, scene3Active=${seekCheck.scene3Active}`);
    }

    // 測試套用劇本更新按鈕反饋
    console.log('測試套用劇本更新按鈕...');
    await page.click('#btnApplyScriptChanges');
    const applyFeedback = await page.$eval('#btnApplyScriptChanges', el => el.innerHTML);
    console.log('按鈕反饋文字:', applyFeedback);
    if (!applyFeedback.includes('已套用腳本並重新合成預覽')) {
      throw new Error(`按鈕反饋文字未正確顯示！Got: ${applyFeedback}`);
    }

    // 關閉彈窗
    await page.click('#btnCloseBriefingModal');
    await new Promise(r => setTimeout(r, 400));
    const isClosed = await page.$eval('#briefingModal', el => !el.classList.contains('open'));
    console.log('彈窗關閉狀態:', isClosed);
    if (!isClosed) throw new Error('彈窗未能正確關閉！');

    // ==========================================
    // 測試 [#6] 數位乩童 getPageContextSummary 與純文字傳遞
    // ==========================================
    console.log('\n--- 3. 測試 [#6] 數位乩童 Context 萃取與純文字情境 ---');
    const jitongContextCheck = await page.evaluate(() => {
      // 呼叫匯出的 getPageContextSummary
      const summary = window.DigitalJiTong.getPageContextSummary();

      // 檢查當前 shelf 與 KPI 在 context 中的包含情況
      const state = window.PyGWalker.getState();
      const kpiRow = document.getElementById('kpiRowCount')?.innerText?.trim();
      const kpiSum = document.getElementById('kpiTotalSum')?.innerText?.trim();

      return {
        summary,
        hasChartType: summary.includes(state.chartType.toUpperCase()) || summary.includes('BAR'),
        hasDataset: summary.includes(state.datasetName) || summary.includes('日本'),
        hasColumns: summary.includes(state.shelf.x) || summary.includes('Columns'),
        hasRows: summary.includes(state.shelf.y) || summary.includes('Rows'),
        hasAgg: summary.includes('RAW') || summary.includes('聚合'),
        hasKpi: summary.includes('即時 KPI 監控') || summary.includes('Rows=')
      };
    });
    console.log('數位乩童 Context 檢查結果:\n', jitongContextCheck.summary);
    if (!jitongContextCheck.hasColumns || !jitongContextCheck.hasRows || !jitongContextCheck.hasDataset || !jitongContextCheck.hasKpi) {
      throw new Error('數位乩童未能正確讀取 PyGWalker 狀態、DOM 欄位或 KPI 數值！');
    }

    // ==========================================
    // 測試 [#10 & #12b/c] 窄視窗與響應式切換
    // ==========================================
    console.log('\n--- 4. 測試 [#10 & #12b/c] 窄視窗 (< 1100px) 與手機響應式佈局 ---');
    
    // 設定平板窄視窗 1024px
    await page.setViewport({ width: 1024, height: 768 });
    await new Promise(r => setTimeout(r, 400));

    const narrowCheck = await page.evaluate(() => {
      const sidebar = document.getElementById('sidebarDock');
      const scrollContainer = document.querySelector('.sidebar-scroll-container');
      const chartGrid = document.getElementById('chartTypeGrid');
      const cards = document.querySelectorAll('.chart-type-card');

      const sideWidth = sidebar ? window.getComputedStyle(sidebar).width : '0px';
      const sideOverflow = scrollContainer ? window.getComputedStyle(scrollContainer).overflowY : '';
      
      // 點擊其中一個圖表原子 (例如 line)
      const lineBtn = document.querySelector('.chart-type-card[data-chart="line"]');
      if (lineBtn) lineBtn.click();
      const currentChart = window.PyGWalker.getState().chartType;

      return {
        sideWidth,
        sideOverflow,
        cardCount: cards.length,
        currentChart,
        canClick: currentChart === 'line'
      };
    });
    console.log('窄視窗 1024px 檢查結果:', narrowCheck);
    if (narrowCheck.sideWidth !== '280px' || narrowCheck.sideOverflow !== 'auto') {
      throw new Error(`窄視窗 CSS 未能正確套用！width=${narrowCheck.sideWidth}, overflowY=${narrowCheck.sideOverflow}`);
    }
    if (!narrowCheck.canClick) {
      throw new Error('窄視窗下圖表原子按鈕無法點擊或切換失敗！');
    }

    // 設定手機視窗 390px (iPhone 14)
    await page.setViewport({ width: 390, height: 844 });
    await new Promise(r => setTimeout(r, 400));

    const mobileCheck = await page.evaluate(() => {
      const chartGrid = document.getElementById('chartTypeGrid');
      const gridCols = chartGrid ? window.getComputedStyle(chartGrid).gridTemplateColumns.split(' ').length : 0;
      
      // 點擊散布圖原子
      const scatterBtn = document.querySelector('.chart-type-card[data-chart="scatter"]');
      if (scatterBtn) scatterBtn.click();
      const currentChart = window.PyGWalker.getState().chartType;

      return {
        gridCols,
        currentChart,
        canClick: currentChart === 'scatter'
      };
    });
    console.log('手機 390px 檢查結果:', mobileCheck);
    if (mobileCheck.gridCols !== 2 || !mobileCheck.canClick) {
      throw new Error('手機視窗下圖表原子 2 欄排版或切換失敗！');
    }

    // 總錯誤檢查
    console.log('\n--- 5. 錯誤統計 ---');
    console.log(`Page Errors: ${pageErrors.length}`);
    console.log(`Console Errors: ${consoleErrors.length}`);

    if (pageErrors.length > 0 || consoleErrors.length > 0) {
      throw new Error(`測試發現錯誤！Page Errors: ${pageErrors.join('; ')} | Console Errors: ${consoleErrors.join('; ')}`);
    }

    console.log('\n======================================================');
    console.log('🎉 導演層互動、數位乩童 Context 與窄視窗響應式全部驗證通過！');
    console.log('======================================================');

  } finally {
    await browser.close();
    server.close();
  }
})();
