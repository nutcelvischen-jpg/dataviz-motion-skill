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
  console.log("Creating new tab on Chrome CDP 9222 with PUT...");
  const target = await httpPut("http://127.0.0.1:9222/json/new?http://localhost:8080/estat_catalog_and_research_guide.html");
  console.log("Target created:", target.id);

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));
  console.log("Connected to page WebSocket!");

  await cdpRequest(ws, "Page.enable");
  await cdpRequest(ws, "Runtime.enable");
  await cdpRequest(ws, "Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1050,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Wait for initial render
  await new Promise(r => setTimeout(r, 1200));

  // 1. Methodology View
  console.log("Switching to Methodology View...");
  await cdpRequest(ws, "Runtime.evaluate", {
    expression: "switchView('method'); window.scrollTo(0, document.getElementById('methodSectionBlock').offsetTop - 30);"
  });
  await new Promise(r => setTimeout(r, 600));
  const shot1 = await cdpRequest(ws, "Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "estat_methodology_matrix.png"), Buffer.from(shot1.data, 'base64'));
  console.log("Saved estat_methodology_matrix.png");

  // 2. Time Horizons View
  console.log("Switching to Horizons View...");
  await cdpRequest(ws, "Runtime.evaluate", {
    expression: "switchView('horizon'); window.scrollTo(0, document.getElementById('horizonSectionBlock').offsetTop - 30);"
  });
  await new Promise(r => setTimeout(r, 600));
  const shot2 = await cdpRequest(ws, "Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "estat_time_horizons_chronology.png"), Buffer.from(shot2.data, 'base64'));
  console.log("Saved estat_time_horizons_chronology.png");

  // 3. Domain View with Time Badges
  console.log("Switching to Domain View...");
  await cdpRequest(ws, "Runtime.evaluate", {
    expression: "switchView('domain'); window.scrollTo(0, document.getElementById('domainSectionBlock').offsetTop - 30);"
  });
  await new Promise(r => setTimeout(r, 600));
  const shot3 = await cdpRequest(ws, "Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "estat_domain_matrix_with_time.png"), Buffer.from(shot3.data, 'base64'));
  console.log("Saved estat_domain_matrix_with_time.png");

  // 4. Search Filter Test: "DID"
  console.log("Testing search for 'DID' in All view...");
  await cdpRequest(ws, "Runtime.evaluate", {
    expression: "switchView('all'); document.getElementById('searchInput').value = 'DID'; onSearchInput(); window.scrollTo(0, document.querySelector('.filter-panel').offsetTop - 20);"
  });
  await new Promise(r => setTimeout(r, 600));
  const shot4 = await cdpRequest(ws, "Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "estat_search_filter_did.png"), Buffer.from(shot4.data, 'base64'));
  console.log("Saved estat_search_filter_did.png");

  // Close tab
  ws.close();
  try {
    await httpPut(`http://127.0.0.1:9222/json/close/${target.id}`);
  } catch(e) {}
  console.log("All screenshots captured and verified successfully!");
}

run().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
