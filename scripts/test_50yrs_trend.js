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

  // Generate 50-year census panel (1975 to 2024 step 5)
  console.log('Generating 50-year census panel...');
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `
      const rows = window.generatePanelDataset(
        ['A1101', 'A1301', 'H4101', 'H1103', 'C1201'],
        1975,
        2024,
        5
      );
      // Mount custom dataset
      window.PyGWalker.open17DomainModal();
    `
  }, id++);

  await new Promise(r => setTimeout(r, 500));

  // Click 1975-2024 step 5 preset
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `
      const preset50 = Array.from(document.querySelectorAll('.year-preset-btn')).find(b => b.dataset.range === '1975-2024-step5');
      if (preset50) preset50.click();
    `
  }, id++);

  await new Promise(r => setTimeout(r, 400));

  // Click apply
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `
      document.getElementById('btnApplyDomainDataset').click();
    `
  }, id++);

  await new Promise(r => setTimeout(r, 500));

  // Apply schema
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `
      document.getElementById('btnApplyAndNext').click();
    `
  }, id++);

  await new Promise(r => setTimeout(r, 500));

  // Assign X to 年份, Y to [H4101] 住宅地平均地價(円/m²), Color to 地方分區, and chart to line (時序趨勢)
  console.log('Plotting 50-year housing price trend by year and region...');
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `
      window.PyGWalker.assignToShelf('x', '年份');
      window.PyGWalker.assignToShelf('y', '[H4101] 住宅地平均地價(円/m²)');
      window.PyGWalker.assignToShelf('color', '地方分區');
      // Click chart type "時序趨勢"
      const lineBtn = document.querySelector('.chart-type-card[data-chart="line"]');
      if (lineBtn) lineBtn.click();
    `
  }, id++);

  await new Promise(r => setTimeout(r, 1000));

  const snap = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' }, id++);
  fs.writeFileSync('<LOCAL_PATH>/pygwalker_50yrs_housing_trend.png', Buffer.from(snap.data, 'base64'));
  console.log('Saved pygwalker_50yrs_housing_trend.png');

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
