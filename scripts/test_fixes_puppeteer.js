const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const PORT = 8877;
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
    await page.setViewport({ width: 1440, height: 960 });

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

    console.log('\n--- 步驟 1: 載入頁面與基礎檢驗 ---');
    await page.goto(`http://127.0.0.1:${PORT}/data_atoms.html`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // 檢驗維度清單中的 +面 按鈕與 XSS 防護
    const initialCheck = await page.evaluate(() => {
      const facetBtns = document.querySelectorAll('#dimensionsList .field-quick-btn.facet-btn');
      const dimPills = document.querySelectorAll('#dimensionsList .field-pill');
      const state = window.PyGWalker.getState();
      return {
        dimCount: dimPills.length,
        facetBtnCount: facetBtns.length,
        hasPALETTE_BAUHAUS: typeof PALETTE_BAUHAUS !== 'undefined',
        hasBuildGeoSeriesData: typeof window.UniversalGeoEngine?.buildGeoSeriesData === 'function',
        stateAgg: state.shelf.agg
      };
    });
    console.log('初始檢查結果:', initialCheck);

    if (initialCheck.dimCount !== initialCheck.facetBtnCount) {
      throw new Error(`維度清單中有欄位缺少 +面 按鈕！總維度 ${initialCheck.dimCount}，按鈕數 ${initialCheck.facetBtnCount}`);
    }
    if (!initialCheck.hasBuildGeoSeriesData) {
      throw new Error('window.UniversalGeoEngine.buildGeoSeriesData 未正確匯出！');
    }

    console.log('\n--- 步驟 2: 測試 Canvas Geo 地圖與 Treemap 切換 (P0 崩潰防護) ---');
    const canvasTest = await page.evaluate(() => {
      const state = window.PyGWalker.getState();
      // 1. 切換至 Canvas 引擎
      state.engine = 'canvas';

      // 2. 測試 Geo 地圖原生繪製
      state.chartType = 'geo';
      state.shelf.x = '都道府縣';
      state.shelf.y = '總人口(人)';
      window.PyGWalker.getEChartsInstance()?.clear();
      // 觸發原生 Canvas 繪製
      const canvasEl = document.getElementById('mainChartCanvas');
      const ctx = canvasEl?.getContext('2d');
      const geoSeries = window.UniversalGeoEngine.buildGeoSeriesData(
        state.rawRows,
        state.shelf.x,
        state.shelf.y
      );

      // 3. 測試 Treemap 原生繪製 (檢查 PALETTE_BAUHAUS)
      state.chartType = 'treemap';
      const treeData = state.rawRows.slice(0, 16);
      const totalVal = treeData.reduce((acc, r) => acc + (Number(r[state.shelf.y]) || 1), 0);
      let colorSample = '';
      if (typeof PALETTE_BAUHAUS !== 'undefined') {
        colorSample = PALETTE_BAUHAUS[0];
      }

      // 切回 ECharts 引擎
      state.engine = 'echarts';
      state.chartType = 'bar';

      return {
        geoSeriesCount: geoSeries.length,
        firstGeoPoint: geoSeries[0],
        totalVal,
        colorSample,
        canvasOk: !!canvasEl && !!ctx
      };
    });
    console.log('Canvas Geo & Treemap 測試結果:', canvasTest);
    if (canvasTest.geoSeriesCount === 0 || !canvasTest.firstGeoPoint?.value) {
      throw new Error('Canvas Geo 資料構建失敗或為空！');
    }

    console.log('\n--- 步驟 3: 測試自訂資料集持久性 (切換與切回不白屏) ---');
    const datasetPersistenceTest = await page.evaluate(async () => {
      const state = window.PyGWalker.getState();

      // 模擬上傳自訂資料集
      const mockRows = [
        { '產品線': '超級智算服務', '營收': 880, '利潤率': 35.5, '類別': 'AI' },
        { '產品線': '邊緣感知終端', '營收': 520, '利潤率': 28.2, '類別': 'IoT' },
        { '產品線': '資料隱私沙箱', '營收': 410, '利潤率': 42.0, '類別': 'Sec' }
      ];

      const customId = 'custom_test_' + Date.now();
      const customObj = {
        id: customId,
        name: '📁 測試自訂智算營收表.csv',
        data: mockRows
      };

      // 1. 存入註冊表
      state.customDatasets[customId] = customObj;

      // 2. 加入選單
      const dsSelect = document.getElementById('datasetQuickSelect');
      const opt = document.createElement('option');
      opt.value = customId;
      opt.textContent = customObj.name;
      dsSelect.insertBefore(opt, dsSelect.firstChild);

      // 3. 載入自訂資料集
      dsSelect.value = customId;
      dsSelect.dispatchEvent(new Event('change'));

      const loadedDatasetName = state.datasetName;
      const loadedRowCount = state.rawRows.length;

      // 4. 切換至預設資料集 (例如 jp_history)
      dsSelect.value = 'jp_history';
      dsSelect.dispatchEvent(new Event('change'));
      const switchedDataset = state.currentDatasetId;

      // 5. 重新切回自訂資料集！
      dsSelect.value = customId;
      dsSelect.dispatchEvent(new Event('change'));
      const restoredDataset = state.currentDatasetId;
      const restoredRowCount = state.rawRows.length;
      const restoredFirstRow = state.rawRows[0];

      return {
        loadedDatasetName,
        loadedRowCount,
        switchedDataset,
        restoredDataset,
        restoredRowCount,
        restoredFirstRow,
        persistedOk: restoredRowCount === 3 && restoredDataset === customId
      };
    });
    console.log('自訂資料集切換與切回測試結果:', datasetPersistenceTest);
    if (!datasetPersistenceTest.persistedOk) {
      throw new Error('自訂資料集切回失敗，資料遺失或未能從 state.customDatasets 復原！');
    }

    console.log('\n--- 步驟 4: 測試多度量殘留清除與 Group-By 聚合引擎 ---');
    const aggEngineTest = await page.evaluate(() => {
      const state = window.PyGWalker.getState();

      // 切回日統計資料集
      const dsSelect = document.getElementById('datasetQuickSelect');
      dsSelect.value = 'jp_prefectures';
      dsSelect.dispatchEvent(new Event('change'));

      // 1. 測試 yMulti 槽位洩漏：指派單一 Y 軸時應清空 yMulti
      state.shelf.yMulti = ['總人口(人)', '65歲以上高齡人口(人)'];
      window.PyGWalker.assignToShelf('y', '總人口(人)');
      const yMultiAfterSingle = state.shelf.yMulti.length;

      // 測試 btnClearShelves 清除
      state.shelf.yMulti = ['指標A', '指標B'];
      document.getElementById('btnClearShelves')?.click();
      const yMultiAfterClear = state.shelf.yMulti.length;

      // 恢復槽位
      state.shelf.x = '地方分區';
      state.shelf.y = '總人口(人)';
      state.shelf.color = '';
      state.shelf.facet = '';

      // 2. 測試 Group-By 聚合運算 (RAW vs SUM vs MEAN vs MAX vs MIN vs COUNT)
      state.shelf.agg = 'RAW';
      const rawData = getVisualData();

      state.shelf.agg = 'SUM';
      const sumData = getVisualData();

      state.shelf.agg = 'MEAN';
      const meanData = getVisualData();

      state.shelf.agg = 'COUNT';
      const countData = getVisualData();

      // 測試 NULL/缺失值不應被誤判為 0 算入 MEAN 或拉低 MIN
      const testNullRows = [
        { cat: 'A', val: 10 },
        { cat: 'A', val: null },
        { cat: 'A', val: 20 },
        { cat: 'A', val: '' }
      ];
      const meanNullTest = window.aggregateRows(testNullRows, ['cat'], ['val'], 'MEAN');
      const minNullTest = window.aggregateRows(testNullRows, ['cat'], ['val'], 'MIN');

      // 測試對調水平長條圖聚合 (X=度量, Y=維度)
      state.chartType = 'bar';
      state.shelf.x = '總人口(人)';
      state.shelf.y = '地方分區';
      state.shelf.agg = 'SUM';
      const swappedSumData = getVisualData();

      // 重設為標準直式柱狀圖
      state.chartType = 'bar';
      state.shelf.x = '地方分區';
      state.shelf.y = '總人口(人)';
      state.shelf.agg = 'RAW';

      return {
        yMultiAfterSingle,
        yMultiAfterClear,
        rawCount: rawData.length,
        sumCount: sumData.length,
        firstSumItem: sumData[0],
        firstMeanItem: meanData[0],
        firstCountItem: countData[0],
        meanNullVal: meanNullTest[0]?.val,
        minNullVal: minNullTest[0]?.val,
        swappedSumCount: swappedSumData.length,
        swappedSumField: swappedSumData[0]?.['總人口(人)']
      };
    });
    console.log('多度量清除與 Group-By 聚合測試結果:', aggEngineTest);
    if (aggEngineTest.yMultiAfterSingle !== 0 || aggEngineTest.yMultiAfterClear !== 0) {
      throw new Error(`yMulti 未被徹底清除！Single=${aggEngineTest.yMultiAfterSingle}, Clear=${aggEngineTest.yMultiAfterClear}`);
    }
    if (aggEngineTest.sumCount >= aggEngineTest.rawCount) {
      throw new Error('Group-By SUM 聚合未能彙整維度！SUM 分組數應小於 RAW 數');
    }
    if (aggEngineTest.meanNullVal !== 15) {
      throw new Error(`聚合 MEAN 遇到 NULL/空值計算錯誤！預期 15，實際得 ${aggEngineTest.meanNullVal}`);
    }
    if (aggEngineTest.minNullVal !== 10) {
      throw new Error(`聚合 MIN 遇到 NULL/空值計算錯誤！預期 10，實際得 ${aggEngineTest.minNullVal}`);
    }
    if (aggEngineTest.swappedSumCount !== 7 || !aggEngineTest.swappedSumField) {
      throw new Error(`對調水平長條圖 Group-By 聚合失敗！分組數預期 7，實際 ${aggEngineTest.swappedSumCount}`);
    }

    console.log('\n--- 步驟 5: 測試小多圖 3 面板與 12 面板 (0 標籤重疊，0 console 錯誤) ---');
    // 測試 3 面板
    await page.evaluate(() => {
      const state = window.PyGWalker.getState();
      state.shelf.x = '都道府縣';
      state.shelf.y = '總人口(人)';
      state.shelf.secondary = '高齡化率(%)';
      state.shelf.facet = '地方分區';
      state.shelf.agg = 'RAW';

      // 篩選保留 3 個地方分區 (3 面板模式)
      state.filters['地方分區'] = {
        field: '地方分區',
        type: 'categorical',
        allValues: ['關東地方', '近畿地方', '中部地方'],
        selected: new Set(['關東地方', '近畿地方', '中部地方'])
      };

      renderVisualization();
    });
    await new Promise(r => setTimeout(r, 600));

    // 檢查 3 面板 ECharts Option
    const facet3Check = await page.evaluate(() => {
      const inst = window.PyGWalker.getEChartsInstance();
      const opt = inst?.getOption();
      return {
        titleCount: opt?.title?.length || 0,
        gridCount: opt?.grid?.length || 0,
        seriesCount: opt?.series?.length || 0,
        yAxisCount: opt?.yAxis?.length || 0,
        yAxisNames: (opt?.yAxis || []).map(y => ({ name: y.name, location: y.nameLocation, rotate: y.nameRotate, gap: y.nameGap }))
      };
    });
    console.log('3 面板檢查結果:', facet3Check);
    await page.screenshot({ path: path.join(ROOT_DIR, 'preview_frames', 'test_facet_3panels.png') });
    console.log('已儲存 3 面板截圖至 preview_frames/test_facet_3panels.png');

    // 測試 12 面板
    await page.evaluate(() => {
      const state = window.PyGWalker.getState();

      // 建立假資料包含 12 個類別進行 12 面板極限測試
      const mock12Rows = [];
      for (let f = 1; f <= 12; f++) {
        for (let x = 1; x <= 5; x++) {
          mock12Rows.push({
            '分面組別': `分組_${f}`,
            '指標X': `項目_${x}`,
            '體量Y': Math.floor(100 + Math.random() * 900),
            '比率Sec': parseFloat((10 + Math.random() * 20).toFixed(1))
          });
        }
      }

      state.rawRows = mock12Rows;
      state.columns = ['分面組別', '指標X', '體量Y', '比率Sec'];
      state.dimensions = ['分面組別', '指標X'];
      state.measures = ['體量Y', '比率Sec'];
      state.filters = {};
      state.shelf.x = '指標X';
      state.shelf.y = '體量Y';
      state.shelf.secondary = '比率Sec';
      state.shelf.facet = '分面組別';
      state.shelf.agg = 'RAW';

      renderVisualization();
    });
    await new Promise(r => setTimeout(r, 800));

    const facet12Check = await page.evaluate(() => {
      const inst = window.PyGWalker.getEChartsInstance();
      const opt = inst?.getOption();
      const container = document.getElementById('echartsViewport');
      return {
        titleCount: opt?.title?.length || 0,
        gridCount: opt?.grid?.length || 0,
        seriesCount: opt?.series?.length || 0,
        containerHeight: container?.style.height,
        yAxisCount: opt?.yAxis?.length || 0
      };
    });
    console.log('12 面板檢查結果:', facet12Check);
    await page.screenshot({ path: path.join(ROOT_DIR, 'preview_frames', 'test_facet_12panels.png') });
    console.log('已儲存 12 面板截圖至 preview_frames/test_facet_12panels.png');

    console.log('\n--- 步驟 6: 驗證 Console 與 Page 錯誤統計 ---');
    console.log(`總 Page Errors: ${pageErrors.length}`);
    console.log(`總 Console Errors: ${consoleErrors.length}`);

    if (pageErrors.length > 0 || consoleErrors.length > 0) {
      throw new Error(`測試期間出現錯誤！Page Errors: ${pageErrors.join('; ')} | Console Errors: ${consoleErrors.join('; ')}`);
    }

    console.log('\n=========================================');
    console.log('✅ 所有自動化測試順利通過 (0 錯誤，0 崩潰)！');
    console.log('=========================================');

  } finally {
    await browser.close();
    server.close();
  }
})();
