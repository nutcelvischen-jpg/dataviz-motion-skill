const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');

async function getWsUrl() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json/version', res => {
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
  let wsUrl;
  try {
    wsUrl = await getWsUrl();
  } catch (e) {
    console.log('Launching headless Chrome...');
    spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
      '--headless=new',
      '--remote-debugging-port=9222',
      '--disable-gpu',
      '--no-sandbox'
    ], { detached: true, stdio: 'ignore' }).unref();

    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 400));
      try {
        wsUrl = await getWsUrl();
        if (wsUrl) break;
      } catch (err) {}
    }
  }

  const WebSocket = require('ws');
  const ws = new WebSocket(wsUrl);

  await new Promise(r => ws.on('open', r));
  console.log('Connected to CDP');

  let id = 1;
  await sendCDP(ws, 'Target.setDiscoverTargets', { discover: true }, id++);
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

  // Wait for page load
  await new Promise(r => setTimeout(r, 1800));

  console.log('1. Opening 17 Domains Modal...');
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `document.getElementById('btnOpen17DomainsModalTop').click();`
  }, id++);

  await new Promise(r => setTimeout(r, 600));

  // Select Domain H (Housing) and click "近 10 年 (2015–2024)"
  console.log('2. Navigating to Domain H and selecting 10-year preset...');
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `
      // Click Domain H
      const items = Array.from(document.querySelectorAll('.domain-nav-item'));
      const domainH = items.find(el => el.textContent.includes('居住・住宅'));
      if (domainH) domainH.click();

      // Click 10-year preset
      const preset10 = Array.from(document.querySelectorAll('.year-preset-btn')).find(b => b.dataset.range === '2015-2024');
      if (preset10) preset10.click();
    `
  }, id++);

  await new Promise(r => setTimeout(r, 600));

  // Screenshot 1: 17 Domains Modal
  console.log('3. Capturing 17 Domains modal screenshot...');
  const snap1 = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' }, id++);
  fs.writeFileSync('<LOCAL_PATH>/estat_17_domains_modal.png', Buffer.from(snap1.data, 'base64'));
  console.log('Saved estat_17_domains_modal.png');

  // Click "載入至視覺化工作台"
  console.log('4. Clicking Apply to load panel data into workspace and trigger Tableau Classifier...');
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `document.getElementById('btnApplyDomainDataset').click();`
  }, id++);

  await new Promise(r => setTimeout(r, 800));

  // Screenshot 2: Tableau Classifier Modal with multi-year panel fields
  console.log('5. Capturing Tableau Classifier modal screenshot...');
  const snap2 = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' }, id++);
  fs.writeFileSync('<LOCAL_PATH>/tableau_panel_data_classifier.png', Buffer.from(snap2.data, 'base64'));
  console.log('Saved tableau_panel_data_classifier.png');

  // Click "下一步：套用並進入圖表探索 ➔"
  console.log('6. Applying schema and entering chart exploration...');
  await sendCDP(pageWs, 'Runtime.evaluate', {
    expression: `document.getElementById('btnApplyAndNext').click();`
  }, id++);

  await new Promise(r => setTimeout(r, 800));

  // Screenshot 3: Final workspace with multi-year panel data plotted
  console.log('7. Capturing final workspace screenshot...');
  const snap3 = await sendCDP(pageWs, 'Page.captureScreenshot', { format: 'png' }, id++);
  fs.writeFileSync('<LOCAL_PATH>/pygwalker_17domains_plotted.png', Buffer.from(snap3.data, 'base64'));
  console.log('Saved pygwalker_17domains_plotted.png');

  console.log('Verification finished successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
