const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const ARTIFACT_DIR = "/Users/chenchunchih/.gemini/antigravity/brain/c94a8ac3-56eb-4e5b-bbf2-98acfad3ce44";

function cdpRequest(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.id === id) {
          ws.off('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      } catch (e) {}
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

function httpPut(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'PUT'
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve(data); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log("Opening estat_catalog_and_research_guide.html...");
  const target = await httpPut("http://127.0.0.1:9222/json/new?http://localhost:8080/estat_catalog_and_research_guide.html");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  await cdpRequest(ws, "Page.enable");
  await cdpRequest(ws, "Runtime.enable");
  await cdpRequest(ws, "Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false
  });

  await new Promise(r => setTimeout(r, 1200));

  // Check card counts
  const datavizCount = await cdpRequest(ws, "Runtime.evaluate", {
    expression: "document.querySelectorAll('.dataviz-card').length"
  });
  console.log("Dataviz cards count:", datavizCount.result.value);

  // Scroll to dataviz section and capture screenshot
  await cdpRequest(ws, "Runtime.evaluate", {
    expression: "switchView('dataviz'); window.scrollTo(0, document.getElementById('datavizSectionBlock').offsetTop - 30);"
  });
  await new Promise(r => setTimeout(r, 600));

  const shot = await cdpRequest(ws, "Page.captureScreenshot", { format: "png" });
  const outPath = path.join(ARTIFACT_DIR, "estat_dataviz_methods_accessible.png");
  fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
  console.log("Saved screenshot:", outPath);

  ws.close();
  try {
    await httpPut(`http://127.0.0.1:9222/json/close/${target.id}`);
  } catch(e) {}
}

run().catch(console.error);
