const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');

async function getWsUrl() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json/version', res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve(JSON.parse(data).webSocketDebuggerUrl);
      });
    }).on('error', reject);
  });
}

function sendCDP(ws, method, params = {}, id = 1) {
  return new Promise((resolve) => {
    const msg = JSON.stringify({ id, method, params });
    const handler = (data) => {
      const resp = JSON.parse(data.toString());
      if (resp.id === id) {
        ws.off('message', handler);
        resolve(resp.result);
      }
    };
    ws.on('message', handler);
    ws.send(msg);
  });
}

async function run() {
  const wsUrl = await getWsUrl();
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.on('open', r));

  let id = 1;
  const target = await sendCDP(ws, 'Target.createTarget', { url: 'http://localhost:8080/data_atoms.html' }, id++);
  const targetWsUrl = `ws://127.0.0.1:9222/devtools/page/${target.targetId}`;

  const pageWs = new WebSocket(targetWsUrl);
  await new Promise(r => pageWs.on('open', r));

  await sendCDP(pageWs, 'Page.enable', {}, id++);
  await sendCDP(pageWs, 'Runtime.enable', {}, id++);
  await sendCDP(pageWs, 'Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 960,
    deviceScaleFactor: 1.5,
    mobile: false
  }, id++);

  await new Promise(r => setTimeout(r, 1500));

  console.log('1. Testing Chart 1: Dual-Axis Combination (雙軸複合圖)...');
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `
      // Switch to jp_housing dataset
      document.getElementById('datasetQuickSelect').value = 'jp_housing';
      document.getElementById('datasetQuickSelect').dispatchEvent(new Event('change'));
      
      // Set secondary shelf to 空屋率(%)
      window.PyGWalker.assignToShelf('secondary', '空屋率(%)');
      
      // Click Dual-Axis chart button
      document.querySelector('.chart-type-card[data-chart="dual"]').click();
    `
  }, id++);
  await new Promise(r => setTimeout(r, 800));
  const snap1 = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' }, id++);
  fs.writeFileSync('/Users/chenchunchih/.gemini/antigravity/brain/c94a8ac3-56eb-4e5b-bbf2-98acfad3ce44/chart_01_dual_axis.png', Buffer.from(snap1.data, 'base64'));
  console.log('Saved chart_01_dual_axis.png');

  console.log('2. Testing Chart 2: Universal Geo Map (地理地圖 - 日本47都道府縣)...');
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `
      document.querySelector('.chart-type-card[data-chart="geo"]').click();
    `
  }, id++);
  await new Promise(r => setTimeout(r, 800));
  const snap2 = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' }, id++);
  fs.writeFileSync('/Users/chenchunchih/.gemini/antigravity/brain/c94a8ac3-56eb-4e5b-bbf2-98acfad3ce44/chart_02_geo_japan.png', Buffer.from(snap2.data, 'base64'));
  console.log('Saved chart_02_geo_japan.png');

  console.log('3. Testing Chart 3: Box Plot (盒鬚分佈圖 - 地方分區地價離散度)...');
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `
      // Set X to 地方分區, Y to 住宅地平均地價(円/m²)
      window.PyGWalker.assignToShelf('x', '地方分區');
      window.PyGWalker.assignToShelf('y', '住宅地平均地價(円/m²)');
      document.querySelector('.chart-type-card[data-chart="boxplot"]').click();
    `
  }, id++);
  await new Promise(r => setTimeout(r, 800));
  const snap3 = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' }, id++);
  fs.writeFileSync('/Users/chenchunchih/.gemini/antigravity/brain/c94a8ac3-56eb-4e5b-bbf2-98acfad3ce44/chart_03_boxplot.png', Buffer.from(snap3.data, 'base64'));
  console.log('Saved chart_03_boxplot.png');

  console.log('4. Testing Chart 4: Treemap (矩形樹圖 - 階層結構與體量)...');
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `
      window.PyGWalker.assignToShelf('x', '都道府縣');
      window.PyGWalker.assignToShelf('color', '地方分區');
      window.PyGWalker.assignToShelf('y', '住宅地平均地價(円/m²)');
      window.PyGWalker.assignToShelf('size', '總人口(萬人)');
      document.querySelector('.chart-type-card[data-chart="treemap"]').click();
    `
  }, id++);
  await new Promise(r => setTimeout(r, 800));
  const snap4 = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' }, id++);
  fs.writeFileSync('/Users/chenchunchih/.gemini/antigravity/brain/c94a8ac3-56eb-4e5b-bbf2-98acfad3ce44/chart_04_treemap.png', Buffer.from(snap4.data, 'base64'));
  console.log('Saved chart_04_treemap.png');

  console.log('5. Testing Universal Support for Other Countries (台灣 22 縣市資料)...');
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `
      const twData = [
        { '縣市': '台北市', '分區': '北部', '平均房價(萬/坪)': 78.5, '人口數(萬)': 250.2, '所得總額(萬元)': 112 },
        { '縣市': '新北市', '分區': '北部', '平均房價(萬/坪)': 43.2, '人口數(萬)': 404.1, '所得總額(萬元)': 89 },
        { '縣市': '桃園市', '分區': '北部', '平均房價(萬/坪)': 28.5, '人口數(萬)': 231.5, '所得總額(萬元)': 86 },
        { '縣市': '台中市', '分區': '中部', '平均房價(萬/坪)': 32.1, '人口數(萬)': 285.3, '所得總額(萬元)': 84 },
        { '縣市': '台南市', '分區': '南部', '平均房價(萬/坪)': 26.4, '人口數(萬)': 186.0, '所得總額(萬元)': 80 },
        { '縣市': '高雄市', '分區': '南部', '平均房價(萬/坪)': 27.8, '人口數(萬)': 273.8, '所得總額(萬元)': 82 },
        { '縣市': '新竹市', '分區': '北部', '平均房價(萬/坪)': 42.6, '人口數(萬)': 45.4, '所得總額(萬元)': 135 },
        { '縣市': '新竹縣', '分區': '北部', '平均房價(萬/坪)': 35.8, '人口數(萬)': 58.8, '所得總額(萬元)': 122 },
        { '縣市': '基隆市', '分區': '北部', '平均房價(萬/坪)': 21.0, '人口數(萬)': 36.1, '所得總額(萬元)': 75 },
        { '縣市': '宜蘭縣', '分區': '東部', '平均房價(萬/坪)': 23.5, '人口數(萬)': 44.8, '所得總額(萬元)': 72 },
        { '縣市': '花蓮縣', '分區': '東部', '平均房價(萬/坪)': 19.8, '人口數(萬)': 31.8, '所得總額(萬元)': 68 },
        { '縣市': '台東縣', '分區': '東部', '平均房價(萬/坪)': 17.5, '人口數(萬)': 21.1, '所得總額(萬元)': 65 },
        { '縣市': '屏東縣', '分區': '南部', '平均房價(萬/坪)': 16.2, '人口數(萬)': 79.5, '所得總額(萬元)': 69 },
        { '縣市': '彰化縣', '分區': '中部', '平均房價(萬/坪)': 20.4, '人口數(萬)': 123.8, '所得總額(萬元)': 73 },
        { '縣市': '南投縣', '分區': '中部', '平均房價(萬/坪)': 18.2, '人口數(萬)': 47.7, '所得總額(萬元)': 67 },
        { '縣市': '雲林縣', '分區': '中部', '平均房價(萬/坪)': 16.5, '人口數(萬)': 66.0, '所得總額(萬元)': 68 },
        { '縣市': '嘉義市', '分區': '南部', '平均房價(萬/坪)': 21.5, '人口數(萬)': 26.3, '所得總額(萬元)': 76 },
        { '縣市': '苗栗縣', '分區': '中部', '平均房價(萬/坪)': 19.5, '人口數(萬)': 53.4, '所得總額(萬元)': 74 },
        { '縣市': '澎湖縣', '分區': '離島', '平均房價(萬/坪)': 18.0, '人口數(萬)': 10.7, '所得總額(萬元)': 70 },
        { '縣市': '金門縣', '分區': '離島', '平均房價(萬/坪)': 21.0, '人口數(萬)': 14.1, '所得總額(萬元)': 72 }
      ];

      // Mount custom dataset
      const customObj = {
        id: 'tw_housing',
        name: '🇹🇼 台灣 22 縣市房價與所得測試表',
        data: twData,
        defaultX: '縣市',
        defaultY: '平均房價(萬/坪)',
        defaultColor: '分區',
        defaultSize: '人口數(萬)',
        defaultSecondary: '所得總額(萬元)',
        defaultChart: 'geo'
      };

      // Add to select
      const dsSelect = document.getElementById('datasetQuickSelect');
      const opt = document.createElement('option');
      opt.value = customObj.id;
      opt.textContent = customObj.name;
      opt.selected = true;
      dsSelect.insertBefore(opt, dsSelect.firstChild);

      // Force load
      window.ESTAT_JP_DATASETS['tw_housing'] = customObj;
      dsSelect.value = 'tw_housing';
      dsSelect.dispatchEvent(new Event('change'));

      // Switch to geo chart
      document.querySelector('.chart-type-card[data-chart="geo"]').click();
    `
  }, id++);
  await new Promise(r => setTimeout(r, 1000));
  const snap5 = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' }, id++);
  fs.writeFileSync('/Users/chenchunchih/.gemini/antigravity/brain/c94a8ac3-56eb-4e5b-bbf2-98acfad3ce44/chart_05_geo_taiwan.png', Buffer.from(snap5.data, 'base64'));
  console.log('Saved chart_05_geo_taiwan.png');

  console.log('All 5 tests completed successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
