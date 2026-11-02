const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const ARTIFACT_DIR = "<LOCAL_PATH>";

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
  const target = await httpPut("http://127.0.0.1:9222/json/new?http://localhost:8080/index.html%23learning-map");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  await cdpRequest(ws, "Page.enable");
  await cdpRequest(ws, "Runtime.enable");
  await cdpRequest(ws, "Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1050,
    deviceScaleFactor: 1,
    mobile: false
  });

  await new Promise(r => setTimeout(r, 1200));

  // 1. Screenshot of #learning-map
  console.log("Capturing #learning-map view...");
  await cdpRequest(ws, "Runtime.evaluate", {
    expression: "window.scrollTo(0, document.getElementById('learning-map').offsetTop - 20);"
  });
  await new Promise(r => setTimeout(r, 600));
  const shot1 = await cdpRequest(ws, "Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "index_learning_map_route.png"), Buffer.from(shot1.data, 'base64'));
  console.log("Saved index_learning_map_route.png");

  // 2. Screenshot of #skill-links
  console.log("Capturing #skill-links view...");
  await cdpRequest(ws, "Runtime.evaluate", {
    expression: "window.scrollTo(0, document.getElementById('skill-links').offsetTop - 20);"
  });
  await new Promise(r => setTimeout(r, 600));
  const shot2 = await cdpRequest(ws, "Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "index_skills_directory_cards.png"), Buffer.from(shot2.data, 'base64'));
  console.log("Saved index_skills_directory_cards.png");

  ws.close();
  try {
    await httpPut(`http://127.0.0.1:9222/json/close/${target.id}`);
  } catch(e) {}
  console.log("Done capturing index screenshots!");
}

run().catch(console.error);
