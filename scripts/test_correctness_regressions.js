/**
 * Data Atoms 正確性回歸測試
 *
 * 執行：node scripts/test_correctness_regressions.js
 * 需要：npm i puppeteer-core ；Chrome 路徑可用環境變數 CHROME_PATH 指定
 *
 * 涵蓋：
 *  1. 柱狀圖排序不得改動原始資料 (先看柱狀再切折線，時間軸不可倒序)
 *  2. 缺值保留為缺值 (折線斷開，不掉到 0)
 *  3. 小資料集的整數欄位仍判定為度量
 *  4. 代碼欄位保留前導零 ("01")
 *  5. Big5 / Shift_JIS CSV 自動偵測編碼
 *  6. 比率欄位 SUM 改用平均；整組缺值回傳 null
 *  7. 類別篩選器不會吃掉空白列；區間篩選不剔除缺值列
 *  8. 10 萬列資料不凍結頁面
 *  9. 惡意欄位名稱不會執行 (XSS)
 * 10. 首頁不預先下載 SheetJS 與簡報影片
 */
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT = path.join(__dirname, '..');
const PORT = 8131;
const CHROME = process.env.CHROME_PATH || (process.platform === 'darwin'
  ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  : '/usr/bin/google-chrome');

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  let p = decodeURI(req.url.split('?')[0]);
  if (p === '/') p = '/data_atoms.html';
  const f = path.join(ROOT, p);
  if (f.startsWith(ROOT) && fs.existsSync(f) && fs.statSync(f).isFile()) {
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  } else { res.writeHead(404); res.end(); }
});

// ---- 測試檔 ----
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'data-atoms-'));
const fx = (name, content) => { const p = path.join(tmp, name); fs.writeFileSync(p, content); return p; };
const edgeCsv = fx('edge.csv', [
  'code,region,city,pop,rate(%),year',
  '01,North,A,100,10.0,2020',
  '02,North,B,300,30.0,2021',
  '03,,C,500,50.0,2022',
  '04,South,D,,20.0,2023',
  '05,South,E,200,-,2024'
].join('\n') + '\n');
const xssName = '<img src=x onerror="window.__xss=1">';
const xssCsv = fx('xss.csv', `name,"${xssName.replace(/"/g, '""')}",val\n"${xssName.replace(/"/g, '""')}",5,7\nok,3,4\n`);
const bigLines = ['cat,sub,v1,v2'];
for (let i = 0; i < 100000; i++) bigLines.push(`C${i % 20},S${i % 300},${(i * 7919) % 1000},${(i * 104729) % 50}`);
const bigCsv = fx('big.csv', bigLines.join('\n'));

let failures = 0;
const check = (name, ok, detail) => {
  console.log(`${ok ? '✅' : '❌'} ${name}${detail !== undefined ? '  → ' + JSON.stringify(detail) : ''}`);
  if (!ok) failures++;
};
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

server.listen(PORT, async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    const pageErrors = [];
    const requested = [];
    page.on('pageerror', e => pageErrors.push(e.message));
    page.on('request', r => requested.push(r.url()));
    page.on('dialog', async d => { pageErrors.push('dialog: ' + d.message()); await d.dismiss(); });

    await page.goto(`http://localhost:${PORT}/data_atoms.html`, { waitUntil: 'networkidle0' });

    // 10. 首頁資源
    check('首頁不預先下載 SheetJS', !requested.some(u => u.includes('xlsx.full.min.js')));
    check('首頁不預先下載簡報影片', !requested.some(u => u.endsWith('.mp4')));

    // 用瀏覽器內建 TextEncoder 無法產生 Big5，因此在頁面內以 Blob 模擬上傳
    const uploadFile = async (filePath) => {
      const input = await page.$('#fileInput');
      await input.uploadFile(filePath);
      await sleep(1200);
      await page.keyboard.press('Escape');
      await sleep(200);
    };

    // 1. 排序不改動原始資料
    let r = await page.evaluate(async () => {
      const P = window.PyGWalker, S = P.state;
      window.loadDataset('biz_trend');
      document.querySelector('[data-chart="bar"]').click();
      await new Promise(res => setTimeout(res, 300));
      document.querySelector('[data-chart="line"]').click();
      await new Promise(res => setTimeout(res, 300));
      return { raw: S.rawRows.slice(0, 3).map(x => x['月份']), lineX: P.getEChartsInstance().getOption().xAxis[0].data.slice(0, 3) };
    });
    check('柱狀→折線後時間軸維持升冪', r.lineX[0] === '2024-01' && r.raw[0] === '2024-01', r);

    // 3/4. 上傳邊界檔
    await uploadFile(edgeCsv);
    r = await page.evaluate(() => {
      const S = window.PyGWalker.state;
      return { measures: S.measures, firstCodes: S.rawRows.slice(0, 2).map(x => x.code), rateBlank: S.rawRows[4]['rate(%)'] };
    });
    check('小資料集 pop 判定為度量', r.measures.includes('pop'), r.measures);
    check('代碼欄保留前導零', r.firstCodes[0] === '01' && r.firstCodes[1] === '02', r.firstCodes);
    check('"-" 讀為缺值 (null)', r.rateBlank === null, r.rateBlank);

    // 2. 缺值在折線圖斷開
    r = await page.evaluate(() => {
      const P = window.PyGWalker, S = P.state;
      S.shelf.agg = 'RAW'; S.shelf.color = ''; S.shelf.facet = ''; S.shelf.secondary = ''; S.shelf.size = '';
      P.assignToShelf('x', 'city'); P.assignToShelf('y', 'pop');
      S.chartType = 'line'; window.renderVisualization();
      const o = P.getEChartsInstance().getOption();
      const idx = o.xAxis[0].data.indexOf('D');
      const v = o.series[0].data[idx];
      return (v && typeof v === 'object') ? v.value : v;
    });
    check('折線圖缺值不畫成 0', r === '-' || r === null || r === undefined, r);

    // 6. 比率 SUM → 平均；整組缺值 → null
    r = await page.evaluate(() => {
      const rows = [
        { g: 'A', 'rate(%)': 10, n: 1 }, { g: 'A', 'rate(%)': 30, n: 2 },
        { g: 'B', 'rate(%)': null, n: null }
      ];
      const out = window.aggregateRows(rows, ['g'], ['rate(%)', 'n'], 'SUM');
      return out.map(x => [x.g, x['rate(%)'], x.n]);
    });
    check('比率欄位 SUM 改用平均 (10%,30% → 20)', r[0][1] === 20 && r[0][2] === 3, r);
    check('整組缺值回傳 null 而非 0', r[1][1] === null && r[1][2] === null, r);

    // 7. 篩選器保留空白列
    r = await page.evaluate(() => {
      const P = window.PyGWalker, S = P.state;
      const before = P.getActiveRows().length;
      P.addFilter('region');
      const withCat = P.getActiveRows().length;
      P.removeFilter('region');
      P.addFilter('pop');
      const withRange = P.getActiveRows().length;
      P.removeFilter('pop');
      return { before, withCat, withRange, hasFilterApi: typeof P.addFilter === 'function' };
    });
    check('類別篩選器不刪除空白列', r.withCat === r.before, r);
    check('區間篩選不刪除缺值列', r.withRange === r.before, r);

    // 5. 編碼偵測 (在頁面內建立 Big5 / Shift_JIS 位元組再丟進 parse 流程)
    const encResults = await page.evaluate(async () => {
      // 臺中市,人口 (Big5) / 東京都,人口 (Shift_JIS)
      const big5 = new Uint8Array([0xBB, 0x4F, 0xA4, 0xA4, 0xA5, 0xAB, 0x2C, 0xA4, 0x48, 0xA4, 0x66, 0x0A, 0x41, 0x2C, 0x31, 0x0A]);
      const sjis = new Uint8Array([0x93, 0x8C, 0x8B, 0x9E, 0x93, 0x73, 0x2C, 0x90, 0x6C, 0x8C, 0xFB, 0x0A, 0x41, 0x2C, 0x31, 0x0A]);
      const run = (bytes, name) => new Promise(resolve => {
        const dt = new DataTransfer();
        dt.items.add(new File([bytes], name, { type: 'text/csv' }));
        const input = document.getElementById('fileInput');
        input.files = dt.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        setTimeout(() => resolve(window.PyGWalker.state.columns.slice()), 1000);
      });
      return { big5: await run(big5, 'big5.csv'), sjis: await run(sjis, 'sjis.csv') };
    });
    await page.keyboard.press('Escape');
    check('Big5 CSV 表頭正確', encResults.big5[0] === '臺中市', encResults.big5);
    check('Shift_JIS CSV 表頭正確', encResults.sjis[0] === '東京都', encResults.sjis);

    // 9. XSS
    await uploadFile(xssCsv);
    await page.evaluate(async () => {
      for (const t of ['bar', 'scatter', 'treemap', 'donut']) {
        document.querySelector(`[data-chart="${t}"]`).click();
        await new Promise(res => setTimeout(res, 250));
      }
    });
    check('惡意欄位名稱不執行', !(await page.evaluate(() => window.__xss)));

    // 8. 大資料
    await uploadFile(bigCsv);
    r = await page.evaluate(() => {
      const S = window.PyGWalker.state, out = { rows: S.rawRows.length };
      S.shelf.agg = 'RAW';
      for (const t of ['bar', 'line']) {
        const s0 = performance.now(); S.chartType = t; window.renderVisualization();
        out[t] = Math.round(performance.now() - s0);
      }
      return out;
    });
    check('10 萬列柱狀/折線各 < 3 秒', r.rows === 100000 && r.bar < 3000 && r.line < 3000, r);

    check('全程無 JS 錯誤或 alert', pageErrors.length === 0, pageErrors.slice(0, 5));
  } finally {
    await browser.close();
    server.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(failures === 0 ? '\n全部通過' : `\n${failures} 項失敗`);
  process.exit(failures === 0 ? 0 : 1);
});
