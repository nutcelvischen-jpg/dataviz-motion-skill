#!/usr/bin/env python3
"""
Generate the standalone interactive HTML Dashboard for e-Stat population data,
incorporating the Data Atoms concept and prominent e-Stat portal link.
"""

import json
import os

BASE_DIR = "."
JSON_PATH = os.path.join(BASE_DIR, "sample_data", "estat_japan_population_demo.json")
OUTPUT_HTML = os.path.join(BASE_DIR, "japan_population_dashboard.html")
ARTIFACT_HTML = "<LOCAL_PATH>/dashboard.html"

with open(JSON_PATH, "r", encoding="utf-8") as f:
    json_str = f.read()

html_content = f"""<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>日本政府統計 e-Stat API 實戰數據儀表板 · 50年人口變遷與 Data Atoms 數據原子分析</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;600;700&family=Noto+Serif+TC:wght@500;700&display=swap" rel="stylesheet">
  <script src="./js/echarts.min.js"></script>
  <script>if (typeof echarts === 'undefined') {{ document.write('<script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"><\\/script>'); }}</script>
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    
    :root {{
      --bg-page: #fbfaf6;
      --bg-surface: #ffffff;
      --bg-subtle: #f5f2ea;
      --bg-inset: #ede8dc;
      --border-light: rgba(45, 40, 36, 0.08);
      --border-default: #e5dfd3;
      --ink-primary: #23201d;
      --ink-secondary: #5d564e;
      --ink-muted: #8a8277;
      
      --metro-blue: #2c548a;
      --metro-tint: rgba(44, 84, 138, 0.08);
      --clay-danger: #b84a2d;
      --clay-tint: rgba(184, 74, 45, 0.08);
      --forest-green: #2c6e49;
      --amber-accent: #c07d2b;
      --purple-accent: #6b46c1;
      --purple-tint: rgba(107, 70, 193, 0.08);
      
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 16px;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.04);
      --shadow-md: 0 4px 14px rgba(0,0,0,0.06);
    }}

    body {{
      font-family: 'Geist', 'Noto Sans TC', system-ui, -apple-system, sans-serif;
      background-color: var(--bg-page);
      color: var(--ink-primary);
      line-height: 1.6;
      padding: 0 0 80px 0;
      -webkit-font-smoothing: antialiased;
    }}

    /* 頂部官方入口橫幅 */
    .official-portal-strip {{
      background: #0d47a1;
      color: #ffffff;
      padding: 8px 48px;
      font-size: 13px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }}
    .portal-link-badge {{
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #e0f2fe;
      text-decoration: none;
      font-weight: 600;
    }}
    .portal-link-badge:hover {{ text-decoration: underline; color: #fff; }}
    .portal-url-tag {{
      background: rgba(255, 255, 255, 0.18);
      padding: 2px 8px;
      border-radius: 4px;
      font-family: monospace;
      color: #fff;
    }}

    header {{
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-default);
      padding: 24px 48px 20px;
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(10px);
      background-color: rgba(255, 255, 255, 0.94);
    }}
    .header-inner {{
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 20px;
    }}
    .header-badge {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      background: var(--metro-tint);
      color: var(--metro-blue);
      padding: 4px 10px;
      border-radius: 20px;
      margin-bottom: 8px;
    }}
    .header-badge span.dot {{
      width: 7px;
      height: 7px;
      background: #10b981;
      border-radius: 50%;
      display: inline-block;
      box-shadow: 0 0 8px #10b981;
    }}
    h1 {{
      font-family: 'Noto Serif TC', 'Instrument Serif', Georgia, serif;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--ink-primary);
    }}
    .header-desc {{
      font-size: 13.5px;
      color: var(--ink-secondary);
      margin-top: 3px;
    }}
    .nav-actions {{
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }}
    .nav-btn {{
      background: var(--bg-subtle);
      border: 1px solid var(--border-default);
      color: var(--ink-primary);
      padding: 7px 12px;
      border-radius: var(--radius-sm);
      font-size: 12.5px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
    }}
    .nav-btn:hover {{
      background: var(--metro-blue);
      color: #fff;
      border-color: var(--metro-blue);
    }}
    .nav-btn.primary {{
      background: var(--metro-blue);
      color: #fff;
      border-color: var(--metro-blue);
    }}

    main {{
      max-width: 1400px;
      margin: 28px auto 0;
      padding: 0 48px;
    }}
    @media (max-width: 1024px) {{
      .official-portal-strip, header, main {{ padding-left: 20px; padding-right: 20px; }}
    }}

    /* KPI 卡片 */
    .kpi-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }}
    .kpi-card {{
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      padding: 18px 22px;
      box-shadow: var(--shadow-sm);
      transition: transform 0.2s, box-shadow 0.2s;
    }}
    .kpi-card:hover {{
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }}
    .kpi-label {{
      font-size: 13px;
      font-weight: 500;
      color: var(--ink-secondary);
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }}
    .kpi-value {{
      font-size: 30px;
      font-weight: 700;
      font-feature-settings: "tnum";
      color: var(--ink-primary);
      letter-spacing: -0.03em;
    }}
    .kpi-sub {{
      font-size: 12px;
      color: var(--ink-muted);
      margin-top: 4px;
    }}
    .kpi-sub strong {{ color: var(--clay-danger); }}

    /* Tab 切換按鈕 */
    .tabs-nav {{
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--border-default);
      margin-bottom: 24px;
      padding-bottom: 12px;
      overflow-x: auto;
    }}
    .tab-btn {{
      background: transparent;
      border: 1px solid transparent;
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      font-size: 13.5px;
      font-weight: 600;
      color: var(--ink-secondary);
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 6px;
    }}
    .tab-btn:hover {{
      background: var(--bg-subtle);
      color: var(--ink-primary);
    }}
    .tab-btn.active {{
      background: var(--metro-blue);
      color: #ffffff;
    }}
    .tab-btn.active.atom-tab {{
      background: #ea580c;
    }}

    /* 圖表網格 */
    .charts-grid {{
      display: grid;
      grid-template-columns: 2fr 1.1fr;
      gap: 24px;
      margin-bottom: 32px;
    }}
    @media (max-width: 1024px) {{
      .charts-grid {{ grid-template-columns: 1fr; }}
    }}

    .chart-panel {{
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      padding: 22px;
      box-shadow: var(--shadow-sm);
    }}
    .panel-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }}
    .panel-title {{
      font-size: 16.5px;
      font-weight: 600;
      color: var(--ink-primary);
      display: flex;
      align-items: center;
      gap: 8px;
    }}
    .panel-desc {{
      font-size: 12.5px;
      color: var(--ink-secondary);
      margin-top: 3px;
    }}
    .chart-container {{
      width: 100%;
      height: 420px;
    }}

    /* Data Atoms 專屬區域樣式 */
    .atom-banner {{
      background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
      border: 1px solid #fed7aa;
      border-radius: var(--radius-lg);
      padding: 20px 24px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }}
    .atom-banner-title {{
      font-size: 16px;
      font-weight: 700;
      color: #9a3412;
      display: flex;
      align-items: center;
      gap: 8px;
    }}
    .atom-banner-desc {{
      font-size: 13px;
      color: #7c2d12;
      margin-top: 4px;
      max-width: 800px;
    }}

    /* 排行榜表格 */
    .table-container {{
      max-height: 420px;
      overflow-y: auto;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-sm);
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }}
    th {{
      position: sticky;
      top: 0;
      background: var(--bg-subtle);
      color: var(--ink-secondary);
      font-weight: 600;
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid var(--border-default);
    }}
    td {{
      padding: 9px 12px;
      border-bottom: 1px solid var(--border-light);
      font-feature-settings: "tnum";
    }}
    tr:hover td {{
      background: var(--bg-subtle);
    }}
    .badge-aging {{
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }}
    .aging-high {{ background: var(--clay-tint); color: var(--clay-danger); }}
    .aging-mid {{ background: rgba(192, 125, 43, 0.1); color: var(--amber-accent); }}
    .aging-low {{ background: var(--metro-tint); color: var(--metro-blue); }}

    /* API 測試實驗台 */
    .playground-box {{
      background: #18181c;
      color: #f3f3f5;
      border-radius: var(--radius-lg);
      padding: 26px;
      margin-top: 12px;
    }}
    .api-input-row {{
      display: flex;
      gap: 12px;
      margin-bottom: 14px;
      flex-wrap: wrap;
    }}
    .api-input {{
      flex: 1;
      min-width: 260px;
      background: #272730;
      border: 1px solid #3e3e4d;
      color: #fff;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      font-family: monospace;
      font-size: 13px;
    }}
    .api-select {{
      background: #272730;
      border: 1px solid #3e3e4d;
      color: #fff;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      font-size: 13px;
    }}
    .api-btn {{
      background: #3b82f6;
      color: #fff;
      border: none;
      padding: 10px 20px;
      border-radius: var(--radius-sm);
      font-weight: 600;
      cursor: pointer;
    }}
    .api-btn:hover {{ background: #2563eb; }}
    .api-response-pre {{
      background: #0f0f13;
      border: 1px solid #2d2d38;
      border-radius: var(--radius-sm);
      padding: 16px;
      max-height: 300px;
      overflow-y: auto;
      font-family: monospace;
      font-size: 12px;
      color: #a5f3fc;
      line-height: 1.5;
    }}

    footer {{
      max-width: 1400px;
      margin: 40px auto 0;
      padding: 24px 48px;
      border-top: 1px solid var(--border-default);
      display: flex;
      justify-content: space-between;
      color: var(--ink-muted);
      font-size: 13px;
      flex-wrap: wrap;
      gap: 12px;
    }}
  </style>
</head>
<body>

<!-- 頂部官方入口指示橫條 (明確指示 e-Stat 網址與直連管道) -->
<div class="official-portal-strip">
  <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
    <span>🏛️ 日本總務省統計局官方資料門戶：</span>
    <a href="https://www.e-stat.go.jp" target="_blank" class="portal-link-badge">
      <span class="portal-url-tag">https://www.e-stat.go.jp</span>
      <span>(點擊在新分頁開啟官網) ↗</span>
    </a>
  </div>
  <div style="display: flex; gap: 12px; align-items: center;">
    <span style="opacity: 0.85;">API Base: api.e-stat.go.jp/rest/3.0/app</span>
    <button onclick="copyPortalUrl()" style="background: rgba(255,255,255,0.2); border: none; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">複製官網網址</button>
  </div>
</div>

<header>
  <div class="header-inner">
    <div>
      <div class="header-badge"><span class="dot"></span> API 連線正常 · e-Stat v3.0 官方直連</div>
      <h1>日本政府統計 e-Stat 實戰儀表板</h1>
      <p class="header-desc">半世紀（1975–2024）人口結構演變與 Data Atoms 數據原子矩陣</p>
    </div>
    <div class="nav-actions">
      <a href="student_data_analyst_workflow.html" class="nav-btn primary">🎓 學員工作流指南</a>
      <a href="estat_catalog_and_research_guide.html" class="nav-btn">🗺️ 17領域研究指南</a>
      <a href="estat_api_tutorial_simulator.html" class="nav-btn">🎥 API申請錄影教學</a>
      <a href="data_atoms.html" class="nav-btn" target="_blank">⚛️ Data Atoms Studio</a>
    </div>
  </div>
</header>

<main>
  <!-- KPI 摘要卡片 -->
  <section class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">
        <span>2024 全國總人口</span>
        <span style="color: var(--clay-danger)">▼ 連續15年遞減</span>
      </div>
      <div class="kpi-value" id="kpiTotalPop">123,802,000</div>
      <div class="kpi-sub">較歷史峰值（2008年 1.28億）減少約 428 萬人</div>
    </div>

    <div class="kpi-card">
      <div class="kpi-label">
        <span>65歲以上高齡化率</span>
        <span style="color: var(--clay-danger)">▲ 創歷史新高</span>
      </div>
      <div class="kpi-value" id="kpiElderlyRatio">29.27%</div>
      <div class="kpi-sub">高齡人口達 <strong>3,624 萬人</strong>（每 3.4 人即有 1 位長者）</div>
    </div>

    <div class="kpi-card">
      <div class="kpi-label">
        <span>全日本最高齡縣市</span>
        <span>秋田縣</span>
      </div>
      <div class="kpi-value" style="color: var(--clay-danger);">39.46%</div>
      <div class="kpi-sub">秋田總人口 90.3 萬人，每 10 人就有近 4 位長者</div>
    </div>

    <div class="kpi-card">
      <div class="kpi-label">
        <span>全日本最年輕都縣</span>
        <span>東京都</span>
      </div>
      <div class="kpi-value" style="color: var(--metro-blue);">22.68%</div>
      <div class="kpi-sub">東京總人口 1,418 萬人，持續受青年人口流入支撐</div>
    </div>
  </section>

  <!-- 導航切換 (整合 Data Atoms 數據原子) -->
  <div class="tabs-nav">
    <button class="tab-btn active atom-tab" onclick="switchTab(event, 'atoms')">⚛️ Data Atoms 數據原子矩陣 (整合視圖)</button>
    <button class="tab-btn" onclick="switchTab(event, 'trends')">📈 50年人口趨勢分析</button>
    <button class="tab-btn" onclick="switchTab(event, 'prefectures')">🗺️ 47都道府縣深度對比</button>
    <button class="tab-btn" onclick="switchTab(event, 'structure')">👥 年齡結構與少子化</button>
    <button class="tab-btn" onclick="switchTab(event, 'playground')">⚡ e-Stat API 實時測試台</button>
  </div>

  <!-- 【全新核心】：整合 Data Atoms 概念的日本資料應用 -->
  <section id="tab-atoms" class="tab-content">
    <div class="atom-banner">
      <div>
        <div class="atom-banner-title">
          <span>⚛️ Data Atoms（數據原子）化合分析法</span>
        </div>
        <div class="atom-banner-desc">
          正如化學分子由基礎原子構成，任何複雜的國家統計也能拆解為基礎的<strong>「數據原子 (Data Atoms)」</strong>。透過離散體量、時序趨勢、結構佔比、相關分佈與多維畫像，我們能立體解讀日本少子高齡化的全貌！
        </div>
      </div>
      <div>
        <a href="data_atoms.html" target="_blank" style="background: #ea580c; color: #fff; font-size: 13px; font-weight: 700; padding: 8px 16px; border-radius: 6px; text-decoration: none; display: inline-block;">開啟 Data Atoms 工作台 ↗</a>
      </div>
    </div>

    <!-- 5大原子視覺化切換 -->
    <div class="charts-grid">
      <!-- 左側：原子圖表 04 相關矩陣 (Scatter: 人口規模 vs 高齡化率) -->
      <div class="chart-panel">
        <div class="panel-header">
          <div>
            <div class="panel-title">
              <span style="background: #ea580c; color: #fff; font-size: 11px; padding: 2px 6px; border-radius: 4px;">原子 04 · 相關矩陣</span>
              都道府縣「總人口規模 vs 高齡化率」散點分佈
            </div>
            <div class="panel-desc">觀察極端負相關：人口越少、偏遠之縣市，高齡化率越逼近 40%</div>
          </div>
        </div>
        <div id="chartAtomScatter" class="chart-container"></div>
      </div>

      <!-- 右側：原子圖表 05 多維畫像 (Radar: 東京 vs 秋田 vs 全國) -->
      <div class="chart-panel">
        <div class="panel-header">
          <div>
            <div class="panel-title">
              <span style="background: #ea580c; color: #fff; font-size: 11px; padding: 2px 6px; border-radius: 4px;">原子 05 · 多維畫像</span>
              極值地區多維特徵對比 (Radar)
            </div>
            <div class="panel-desc">東京都（都市青年吸力）vs 秋田縣（極限老齡化）vs 全國基準</div>
          </div>
        </div>
        <div id="chartAtomRadar" class="chart-container"></div>
      </div>
    </div>
  </section>

  <!-- 內容區塊 1: 50年趨勢 -->
  <section id="tab-trends" class="tab-content" style="display: none;">
    <div class="charts-grid">
      <div class="chart-panel">
        <div class="panel-header">
          <div>
            <div class="panel-title">
              <span style="background: #2c548a; color: #fff; font-size: 11px; padding: 2px 6px; border-radius: 4px;">原子 02 · 時序趨勢</span>
              日本總人口 vs 65歲以上高齡化率（1975–2024）
            </div>
            <div class="panel-desc">雙軸聯動分析：人口總量下行與高齡佔比飆升之「剪刀差」</div>
          </div>
        </div>
        <div id="chartHistory" class="chart-container"></div>
      </div>

      <div class="chart-panel">
        <div class="panel-header">
          <div>
            <div class="panel-title">都道府縣高齡化分佈極值對比</div>
            <div class="panel-desc">Top 5 最高 vs Top 5 最低行政區</div>
          </div>
        </div>
        <div id="chartAgingCompare" class="chart-container"></div>
      </div>
    </div>
  </section>

  <!-- 內容區塊 2: 都道府縣 -->
  <section id="tab-prefectures" class="tab-content" style="display: none;">
    <div class="charts-grid">
      <div class="chart-panel">
        <div class="panel-header">
          <div>
            <div class="panel-title">
              <span style="background: #2c548a; color: #fff; font-size: 11px; padding: 2px 6px; border-radius: 4px;">原子 01 · 離散體量</span>
              2024 年日本各都道府縣人口規模 Top 15
            </div>
            <div class="panel-desc">首都圈與關西圈集中效應極其顯著</div>
          </div>
        </div>
        <div id="chartPrefPop" class="chart-container"></div>
      </div>

      <div class="chart-panel">
        <div class="panel-header">
          <div>
            <div class="panel-title">47 都道府縣完整數據總表</div>
            <div class="panel-desc">即時檢視總人口與高齡化率</div>
          </div>
        </div>
        <div class="table-container">
          <table id="prefTable">
            <thead>
              <tr>
                <th>都道府縣</th>
                <th>總人口</th>
                <th>65歲以上比率</th>
                <th>外國人住民</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </div>
  </section>

  <!-- 內容區塊 3: 結構變遷 -->
  <section id="tab-structure" class="tab-content" style="display: none;">
    <div class="chart-panel" style="margin-bottom: 24px;">
      <div class="panel-header">
        <div>
          <div class="panel-title">
            <span style="background: #2c548a; color: #fff; font-size: 11px; padding: 2px 6px; border-radius: 4px;">原子 03 · 結構佔比</span>
            日本三大年齡組百分比結構變遷（1975–2024）
          </div>
          <div class="panel-desc">幼年人口（0-14）、生產工作年齡人口（15-64）與老年人口（65+）之消長</div>
        </div>
      </div>
      <div id="chartStructure" style="width: 100%; height: 460px;"></div>
    </div>
  </section>

  <!-- 內容區塊 4: API 測試台 -->
  <section id="tab-playground" class="tab-content" style="display: none;">
    <div class="playground-box">
      <div class="playground-header">
        <div>
          <h2 style="font-size: 18px; margin-bottom: 4px;">⚡ e-Stat API 實時端點測試實驗台</h2>
          <p style="font-size: 13px; color: #9ca3af;">直連日本統計局官方資料庫 (https://api.e-stat.go.jp)，即時查看原始 JSON 回應</p>
        </div>
        <span style="background: #065f46; color: #34d399; font-size: 11px; padding: 4px 10px; border-radius: 12px; font-weight: 600;">CORS / JSONP 直連模式</span>
      </div>

      <div class="api-input-row">
        <select id="apiEndpoint" class="api-select">
          <option value="getStatsList">getStatsList (統計表搜尋)</option>
          <option value="getMetaInfo">getMetaInfo (元資料與欄位定義)</option>
          <option value="getStatsData">getStatsData (統計數值)</option>
        </select>
        <input type="text" id="apiParam" class="api-input" value="searchWord=人口&limit=3" placeholder="輸入參數，例如 searchWord=物價&limit=3">
        <button class="api-btn" onclick="executeApiCall()">發送請求 (Send Request)</button>
      </div>

      <div style="font-size: 12px; color: #9ca3af; margin-bottom: 8px;">請求 URL (Request URL):</div>
      <div id="requestUrlDisplay" style="background: #111115; padding: 8px 12px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #f59e0b; margin-bottom: 14px; word-break: break-all;">
        https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList?...
      </div>

      <div style="font-size: 12px; color: #9ca3af; margin-bottom: 8px;">API 即時回應 (Response Body):</div>
      <pre id="apiOutput" class="api-response-pre">點擊上方「發送請求」按鈕，立即透過您的 API Key 連線 e-Stat 官方資料庫...</pre>
    </div>
  </section>
</main>

<footer>
  <div>
    <strong>資料來源:</strong> 日本總務省統計局 e-Stat 政府統計ポータルサイト (<a href="https://www.e-stat.go.jp" target="_blank" style="color: #2c548a;">https://www.e-stat.go.jp</a>)
  </div>
  <div>
    <strong>核心架構:</strong> e-Stat API v3.0 · Data Atoms 數據原子體系 · Apache ECharts
  </div>
</footer>

<script>
  const estatData = {json_str};

  function copyPortalUrl() {{
    navigator.clipboard.writeText('https://www.e-stat.go.jp').then(() => {{
      alert('已複製 e-Stat 官網網址 (https://www.e-stat.go.jp)！');
    }});
  }}

  function switchTab(evt, tabId) {{
    document.querySelectorAll('.tab-btn').forEach(btn => {{
      btn.classList.remove('active');
      btn.classList.remove('atom-tab');
    }});
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    
    evt.currentTarget.classList.add('active');
    if (tabId === 'atoms') {{
      evt.currentTarget.classList.add('atom-tab');
    }}
    
    const target = document.getElementById('tab-' + tabId);
    if (target) {{
      target.style.display = 'block';
    }}

    setTimeout(() => {{
      window.dispatchEvent(new Event('resize'));
    }}, 50);
  }}

  // 1. Data Atom 04: 散點相關矩陣 (Scatter: 人口規模 vs 高齡化率)
  function renderAtomScatterChart() {{
    const chartDom = document.getElementById('chartAtomScatter');
    const myChart = echarts.init(chartDom);
    
    const scatterData = estatData.prefectures_2024.map(p => ([
      (p.total_population / 10000).toFixed(0), // X: 萬人
      p.elderly_ratio,                         // Y: 高齡化率%
      p.name,                                  // Name
      p.foreigners                             // Bubble size
    ]));

    const option = {{
      tooltip: {{
        trigger: 'item',
        formatter: (params) => {{
          const d = params.value;
          return `<strong>${{d[2]}}</strong><br/>總人口: ${{Number(d[0]).toLocaleString()}} 萬人<br/>高齡化率: ${{d[1]}}%<br/>外國住民: ${{d[3].toLocaleString()}} 人`;
        }}
      }},
      grid: {{ left: '4%', right: '6%', bottom: '12%', top: '10%', containLabel: true }},
      xAxis: {{
        type: 'value',
        name: '人口規模 (萬人)',
        nameLocation: 'middle',
        nameGap: 30,
        axisLabel: {{ formatter: '{{value}}萬' }}
      }},
      yAxis: {{
        type: 'value',
        name: '高齡化率 (%)',
        min: 20,
        max: 42,
        axisLabel: {{ formatter: '{{value}}%' }}
      }},
      series: [
        {{
          name: '47都道府縣',
          type: 'scatter',
          data: scatterData,
          symbolSize: (data) => {{
            return Math.max(12, Math.min(36, Math.sqrt(data[3] / 200)));
          }},
          itemStyle: {{
            color: (params) => {{
              const ratio = params.value[1];
              if (ratio >= 35) return '#b84a2d'; // 高齡極端紅
              if (ratio <= 25) return '#2c548a'; // 年輕都會藍
              return '#ea580c';
            }},
            opacity: 0.82,
            borderColor: '#fff',
            borderWidth: 1.5
          }},
          label: {{
            show: true,
            formatter: (p) => {{
              const d = p.value;
              if (d[1] >= 36 || d[0] >= 700 || d[2] === '東京都' || d[2] === '秋田県') {{
                return d[2];
              }}
              return '';
            }},
            position: 'top',
            fontSize: 11,
            color: '#23201d'
          }}
        }}
      ]
    }};
    myChart.setOption(option);
    window.addEventListener('resize', () => myChart.resize());
  }}

  // 2. Data Atom 05: 多維畫像 (Radar: 東京 vs 秋田 vs 全國)
  function renderAtomRadarChart() {{
    const chartDom = document.getElementById('chartAtomRadar');
    const myChart = echarts.init(chartDom);

    const option = {{
      tooltip: {{ trigger: 'item' }},
      legend: {{
        data: ['東京都 (都會青年樞紐)', '秋田縣 (高齡化極限)', '全國平均基準'],
        bottom: 0
      }},
      radar: {{
        indicator: [
          {{ name: '幼年比率(0-14)', max: 15 }},
          {{ name: '勞力比率(15-64)', max: 70 }},
          {{ name: '外籍居民佔比', max: 5 }},
          {{ name: '年輕活力指數', max: 100 }},
          {{ name: '人口規模權重', max: 100 }}
        ],
        radius: '62%'
      }},
      series: [
        {{
          name: '區域特徵多維畫像',
          type: 'radar',
          data: [
            {{
              value: [11.2, 66.1, 4.2, 77.3, 100],
              name: '東京都 (都會青年樞紐)',
              itemStyle: {{ color: '#2c548a' }},
              areaStyle: {{ color: 'rgba(44, 84, 138, 0.25)' }}
            }},
            {{
              value: [9.3, 51.2, 0.5, 20.5, 10],
              name: '秋田縣 (高齡化極限)',
              itemStyle: {{ color: '#b84a2d' }},
              areaStyle: {{ color: 'rgba(184, 74, 45, 0.25)' }}
            }},
            {{
              value: [11.4, 59.3, 2.2, 50.0, 50],
              name: '全國平均基準',
              itemStyle: {{ color: '#c07d2b' }},
              lineStyle: {{ type: 'dashed' }}
            }}
          ]
        }}
      ]
    }};
    myChart.setOption(option);
    window.addEventListener('resize', () => myChart.resize());
  }}

  function renderHistoryChart() {{
    const chartDom = document.getElementById('chartHistory');
    const myChart = echarts.init(chartDom);
    const history = estatData.national_history;

    const years = history.map(d => d.year + '年');
    const totals = history.map(d => (d.total_population / 10000).toFixed(1));
    const elderlyRatios = history.map(d => d.elderly_ratio);

    const option = {{
      tooltip: {{
        trigger: 'axis',
        axisPointer: {{ type: 'cross' }}
      }},
      legend: {{
        data: ['總人口 (萬人)', '65歲以上佔比 (%)'],
        bottom: 0
      }},
      grid: {{ left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true }},
      xAxis: {{
        type: 'category',
        data: years,
        axisLine: {{ lineStyle: {{ color: '#8a8277' }} }}
      }},
      yAxis: [
        {{
          type: 'value',
          name: '總人口 (萬人)',
          min: 11000,
          max: 13000,
          axisLabel: {{ formatter: '{{value}}' }}
        }},
        {{
          type: 'value',
          name: '高齡化率 (%)',
          min: 5,
          max: 35,
          axisLabel: {{ formatter: '{{value}}%' }},
          splitLine: {{ show: false }}
        }}
      ],
      series: [
        {{
          name: '總人口 (萬人)',
          type: 'line',
          smooth: true,
          data: totals,
          itemStyle: {{ color: '#2c548a' }},
          areaStyle: {{
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {{ offset: 0, color: 'rgba(44, 84, 138, 0.28)' }},
              {{ offset: 1, color: 'rgba(44, 84, 138, 0.02)' }}
            ])
          }}
        }},
        {{
          name: '65歲以上佔比 (%)',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: elderlyRatios,
          itemStyle: {{ color: '#b84a2d' }},
          lineStyle: {{ width: 3 }}
        }}
      ]
    }};
    myChart.setOption(option);
    window.addEventListener('resize', () => myChart.resize());
  }}

  function renderAgingCompareChart() {{
    const chartDom = document.getElementById('chartAgingCompare');
    const myChart = echarts.init(chartDom);
    const prefs = [...estatData.prefectures_2024].sort((a,b) => b.elderly_ratio - a.elderly_ratio);

    const top5 = prefs.slice(0, 5);
    const bot5 = prefs.slice(-5).reverse();
    const compareData = [...top5, ...bot5];

    const option = {{
      tooltip: {{
        trigger: 'axis',
        axisPointer: {{ type: 'shadow' }},
        formatter: '{{b}}: {{c}}%'
      }},
      grid: {{ left: '3%', right: '8%', bottom: '5%', top: '5%', containLabel: true }},
      xAxis: {{
        type: 'value',
        axisLabel: {{ formatter: '{{value}}%' }}
      }},
      yAxis: {{
        type: 'category',
        data: compareData.map(d => d.name),
        inverse: true
      }},
      series: [
        {{
          type: 'bar',
          data: compareData.map(d => ({{
            value: d.elderly_ratio,
            itemStyle: {{
              color: d.elderly_ratio >= 35 ? '#b84a2d' : (d.elderly_ratio <= 26 ? '#2c548a' : '#c07d2b')
            }}
          }})),
          label: {{
            show: true,
            position: 'right',
            formatter: '{{c}}%'
          }}
        }}
      ]
    }};
    myChart.setOption(option);
    window.addEventListener('resize', () => myChart.resize());
  }}

  function renderPrefPopChart() {{
    const chartDom = document.getElementById('chartPrefPop');
    const myChart = echarts.init(chartDom);
    const top15 = estatData.prefectures_2024.slice(0, 15);

    const option = {{
      tooltip: {{
        trigger: 'axis',
        axisPointer: {{ type: 'shadow' }},
        formatter: (params) => {{
          const item = top15.find(d => d.name === params[0].name);
          return `${{item.name}}<br/>總人口: ${{item.total_population.toLocaleString()}} 人<br/>高齡化率: ${{item.elderly_ratio}}%<br/>外國人: ${{item.foreigners.toLocaleString()}} 人`;
        }}
      }},
      grid: {{ left: '3%', right: '8%', bottom: '5%', top: '5%', containLabel: true }},
      xAxis: {{
        type: 'value',
        name: '人口 (萬人)',
        axisLabel: {{ formatter: v => (v / 10000) }}
      }},
      yAxis: {{
        type: 'category',
        data: top15.map(d => d.name),
        inverse: true
      }},
      series: [
        {{
          name: '總人口',
          type: 'bar',
          data: top15.map(d => d.total_population),
          itemStyle: {{
            color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
              {{ offset: 0, color: '#2c548a' }},
              {{ offset: 1, color: '#4b77b2' }}
            ])
          }},
          label: {{
            show: true,
            position: 'right',
            formatter: p => (p.value / 10000).toFixed(0) + '萬'
          }}
        }}
      ]
    }};
    myChart.setOption(option);
    window.addEventListener('resize', () => myChart.resize());
  }}

  function renderStructureChart() {{
    const chartDom = document.getElementById('chartStructure');
    const myChart = echarts.init(chartDom);
    const history = estatData.national_history;

    const years = history.map(d => d.year);
    const youth = history.map(d => d.youth_ratio);
    const working = history.map(d => d.working_ratio);
    const elderly = history.map(d => d.elderly_ratio);

    const option = {{
      tooltip: {{
        trigger: 'axis',
        axisPointer: {{ type: 'cross' }}
      }},
      legend: {{
        data: ['0-14歲 幼年人口', '15-64歲 生產主力人口', '65歲以上 高齡人口'],
        bottom: 0
      }},
      grid: {{ left: '3%', right: '4%', bottom: '10%', top: '6%', containLabel: true }},
      xAxis: {{ type: 'category', boundaryGap: false, data: years }},
      yAxis: {{ type: 'value', max: 100, axisLabel: {{ formatter: '{{value}}%' }} }},
      series: [
        {{
          name: '0-14歲 幼年人口',
          type: 'line',
          stack: 'Total',
          areaStyle: {{}},
          emphasis: {{ focus: 'series' }},
          data: youth,
          itemStyle: {{ color: '#38bdf8' }}
        }},
        {{
          name: '15-64歲 生產主力人口',
          type: 'line',
          stack: 'Total',
          areaStyle: {{}},
          emphasis: {{ focus: 'series' }},
          data: working,
          itemStyle: {{ color: '#64748b' }}
        }},
        {{
          name: '65歲以上 高齡人口',
          type: 'line',
          stack: 'Total',
          areaStyle: {{}},
          emphasis: {{ focus: 'series' }},
          data: elderly,
          itemStyle: {{ color: '#f87171' }}
        }}
      ]
    }};
    myChart.setOption(option);
    window.addEventListener('resize', () => myChart.resize());
  }}

  function populateTable() {{
    const tbody = document.querySelector('#prefTable tbody');
    tbody.innerHTML = '';
    estatData.prefectures_2024.forEach(p => {{
      const tr = document.createElement('tr');
      const badgeClass = p.elderly_ratio >= 35 ? 'aging-high' : (p.elderly_ratio <= 26 ? 'aging-low' : 'aging-mid');
      tr.innerHTML = `
        <td style="font-weight: 600;">${{p.name}}</td>
        <td>${{p.total_population.toLocaleString()}} 人</td>
        <td><span class="badge-aging ${{badgeClass}}">${{p.elderly_ratio}}%</span></td>
        <td>${{(p.foreigners || 0).toLocaleString()}} 人</td>
      `;
      tbody.appendChild(tr);
    }});
  }}

  const USER_APP_ID = 'd96194b7b3219075b1041948fddc842cfead7477';

  function updateRequestUrl() {{
    const ep = document.getElementById('apiEndpoint').value;
    const param = document.getElementById('apiParam').value;
    const url = `https://api.e-stat.go.jp/rest/3.0/app/json/${{ep}}?appId=${{USER_APP_ID}}&${{param}}`;
    document.getElementById('requestUrlDisplay').innerText = url;
    return url;
  }}

  document.getElementById('apiEndpoint').addEventListener('change', updateRequestUrl);
  document.getElementById('apiParam').addEventListener('input', updateRequestUrl);

  function executeApiCall() {{
    const url = updateRequestUrl();
    const outputEl = document.getElementById('apiOutput');
    outputEl.innerText = '正在發送請求至 e-Stat 伺服器...';

    const callbackName = 'estat_cb_' + Math.floor(Math.random() * 1000000);
    const jsonpUrl = `${{url}}&callback=${{callbackName}}`;

    const script = document.createElement('script');
    script.src = jsonpUrl;
    window[callbackName] = function(data) {{
      outputEl.innerText = JSON.stringify(data, null, 2);
      delete window[callbackName];
      document.body.removeChild(script);
    }};

    script.onerror = function() {{
      outputEl.innerText = 'JSONP 請求發送失敗或逾時。請確認網路連線與參數格式。\\n直接請求 URL: ' + url;
      delete window[callbackName];
    }};
    document.body.appendChild(script);
  }}

  window.addEventListener('DOMContentLoaded', () => {{
    updateRequestUrl();
    renderAtomScatterChart();
    renderAtomRadarChart();
    renderHistoryChart();
    renderAgingCompareChart();
    renderPrefPopChart();
    renderStructureChart();
    populateTable();
  }});
</script>
</body>
</html>
"""

with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
    f.write(html_content)

with open(ARTIFACT_HTML, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"Updated {OUTPUT_HTML} and {ARTIFACT_HTML} with Data Atoms and prominent portal link!")
