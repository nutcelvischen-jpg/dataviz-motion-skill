#!/usr/bin/env python3
"""
Assemble upgraded data_atoms.html with:
- PyGWalker Drag-and-Drop Visual Shelves (Columns, Rows, Color, Size, Secondary)
- Japanese e-Stat 2024 demographic dataset connected by default
- Universal file upload (CSV, XLSX, XLS, JSON) with drag & drop
- Dual engine (ECharts interactive & Native 1080p Canvas)
- 7 Data Atoms chart selector
- Prominent e-Stat portal link banner
- Retained Bauhaus video briefing modal and scripts
"""
import re

html_template = """<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Data Atoms · PyGWalker 互動探索工作台 (e-Stat 日本人口大數據)</title>
  
  <!-- Typography: Plus Jakarta Sans, Noto Sans TC, JetBrains Mono -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;700;900&display=swap" rel="stylesheet">
  
  <!-- CSS Stylesheets -->
  <link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="css/pygwalker.css">
  <style>
    /* New Briefing Action Button */
    .btn-briefing {
      background: #111111;
      color: #ffffff;
      border: 1px solid #111111;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      font-size: 13px;
      font-weight: 700;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.15s ease;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
    .btn-briefing:hover {
      background: var(--accent-orange);
      border-color: var(--accent-orange);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 87, 34, 0.35);
    }

    /* Director Studio Modal Styles */
    .briefing-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.78);
      backdrop-filter: blur(8px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .briefing-modal-overlay.open {
      display: flex;
      opacity: 1;
    }
    .briefing-modal-card {
      width: 1160px;
      max-width: 96vw;
      background: #F3F2EE;
      border: 3px solid #111111;
      box-shadow: 16px 16px 0px #FF4400;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes modalSlideUp {
      from { transform: translateY(20px) scale(0.98); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }
    .modal-head {
      background: #111111;
      color: #fff;
      padding: 14px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #FF4400;
    }
    .modal-head-title {
      font-size: 16px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .modal-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      background: #FF4400;
      color: #fff;
      padding: 3px 8px;
    }
    .modal-close-btn {
      background: transparent;
      border: none;
      color: #fff;
      font-size: 24px;
      cursor: pointer;
      line-height: 1;
      opacity: 0.8;
      transition: opacity 0.15s;
    }
    .modal-close-btn:hover { opacity: 1; color: #FF4400; }

    /* Levers Control Bar */
    .director-controls-strip {
      background: #ffffff;
      border-bottom: 1px solid rgba(17,17,17,0.12);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }
    .control-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .control-group-label {
      font-size: 12px;
      font-weight: 700;
      color: #111;
      font-family: 'JetBrains Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .lens-pill-group, .tone-pill-group {
      display: flex;
      background: #F1F0EC;
      padding: 3px;
      border: 1px solid rgba(17,17,17,0.12);
      border-radius: var(--radius-sm);
      gap: 3px;
    }
    .lens-pill-btn, .tone-pill-btn {
      background: transparent;
      border: none;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .lens-pill-btn:hover, .tone-pill-btn:hover {
      color: #111;
    }
    .lens-pill-btn.active, .tone-pill-btn.active {
      background: #111111;
      color: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .lens-pill-btn.active.lens-scm {
      background: #1E4FA3;
    }

    .modal-body-grid {
      display: grid;
      grid-template-columns: 580px 1fr;
      padding: 20px 24px;
      gap: 24px;
      background: #F3F2EE;
    }
    .modal-video-wrap {
      background: #000;
      border: 2px solid #111;
      box-shadow: 6px 6px 0px #111;
      position: relative;
      aspect-ratio: 16 / 9;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .modal-video-player {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .modal-info-panel {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-width: 0;
    }
    .storyboard-timeline {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 10px 0;
    }
    .story-item {
      display: flex;
      gap: 12px;
      background: #fff;
      border: 1px solid rgba(17,17,17,0.15);
      padding: 10px 14px;
      border-left: 4px solid #111;
      transition: all 0.15s ease;
      cursor: pointer;
    }
    .story-item:hover {
      border-color: #FF4400;
      transform: translateX(2px);
    }
    .story-item.active-scene {
      border-left-color: #FF4400;
      background: #fffdfb;
      box-shadow: 0 2px 8px rgba(255,68,0,0.08);
    }
    .story-time-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 800;
      color: #FF4400;
      white-space: nowrap;
      margin-top: 2px;
    }
    .story-content-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    .story-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .story-title {
      font-size: 12px;
      font-weight: 800;
      color: #111;
    }
    .story-chip {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
    }
    .story-script-input {
      width: 100%;
      background: #F8F7F4;
      border: 1px solid #D6D3CC;
      color: #222;
      padding: 6px 8px;
      font-size: 11px;
      font-family: var(--font-sans);
      resize: vertical;
    }
    .engine-pills-row {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-top: 10px;
    }
    .engine-pill {
      font-size: 10px;
      background: #fff;
      border: 1px solid #111;
      padding: 3px 6px;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
    }
    .modal-actions-bar {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-top: 12px;
    }
    
    /* PyGWalker Custom Enhancements */
    .pyg-banner-badge {
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #bfdbfe;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
  </style>
</head>
<body>

  <!-- 頂部官方入口指示橫條 (明確指示 e-Stat 官方門戶與直連管道) -->
  <div class="portal-top-bar">
    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
      <span>🏛️ 日本官方統計入口網站：</span>
      <a href="https://www.e-stat.go.jp" target="_blank" style="background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.4); color: #fff; padding: 2px 10px; border-radius: 4px; text-decoration: none; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
        <span style="font-family: monospace;">https://www.e-stat.go.jp</span>
        <span>(點擊前往官網) ↗</span>
      </a>
      <span class="pyg-banner-badge">🔥 PyGWalker 互動探索模式 · 支援 X/Y 軸拖曳與自訂上傳</span>
    </div>
    <div style="display: flex; gap: 12px; align-items: center; font-size: 12px;">
      <a href="japan_population_dashboard.html" style="color: #fff; text-decoration: none;">📊 50年人口儀表板</a>
      <span>·</span>
      <a href="student_data_analyst_workflow.html" style="color: #fff; text-decoration: none;">🎓 學員工作流指南</a>
      <span>·</span>
      <button onclick="navigator.clipboard.writeText('https://www.e-stat.go.jp'); alert('已複製 e-Stat 官網網址！');" style="background: rgba(255,255,255,0.2); border: none; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">複製官網</button>
    </div>
  </div>

  <div class="app-shell">
    
    <!-- 1. Top Navigation Bar -->
    <header class="app-topbar">
      <!-- Left: Brand & Title -->
      <div class="topbar-left">
        <div class="brand-cluster">
          <div class="brand-logo-mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <circle cx="19" cy="5" r="2"></circle>
              <circle cx="5" cy="19" r="2"></circle>
              <path d="M10.4 13.6 6.4 17.6"></path>
              <path d="M17.6 6.4 13.6 10.4"></path>
            </svg>
          </div>
          <div class="brand-text-group">
            <div class="brand-title-row">
              <span class="brand-name">Data Atoms</span>
              <span class="brand-version-chip" style="background: #2563eb; color: #fff;">PyGWalker</span>
            </div>
            <div class="brand-subtitle">Tableau-like 互動拖曳視覺化 · 支援 e-Stat 官方數據與自訂檔案</div>
          </div>
        </div>
      </div>

      <!-- Right: Dataset Quick Selector, Engine Toggle, Briefing, Export -->
      <div class="topbar-right">
        <!-- Dataset Selector -->
        <select id="datasetQuickSelect" class="app-select-sm sample-select" style="min-width: 280px; font-weight: 600;">
          <optgroup label="🇯🇵 日本官方統計 e-Stat 大數據 (官方 Table: 0000010101)">
            <option value="jp_prefectures" selected>🇯🇵 日本 47 都道府縣人口與高齡化全量 (2024 e-Stat 官方)</option>
            <option value="jp_history">🇯🇵 日本半世紀人口結構演進時序 (1975–2024 e-Stat 官方)</option>
            <option value="jp_regions">🇯🇵 日本地方分區人口與結構彙總表 (2024 e-Stat 官方)</option>
          </optgroup>
          <optgroup label="📊 商業營運數據範例">
            <option value="biz_sales">📊 產品線營收與毛利體量 (商業範例)</option>
            <option value="biz_trend">📈 12個月月度營收時序趨勢 (商業範例)</option>
            <option value="biz_scatter">🎯 行銷廣告與獲客相關矩陣 (商業範例)</option>
          </optgroup>
        </select>

        <!-- Toggle Engine -->
        <button type="button" class="btn btn-sm btn-outline" id="btnToggleEngine" title="切換 ECharts 互動引擎 或 原生 1080p Bauhaus Canvas">
          <span>📊 ECharts 互動引擎</span>
        </button>

        <!-- Data-to-Video Briefing Button -->
        <button type="button" class="btn-briefing" id="btnOpenBriefingModal" title="查看 34秒 包豪斯動態影音簡報">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          <span>🎬 數據動態簡報</span>
        </button>

        <!-- Export Image -->
        <button type="button" class="btn btn-primary" id="btnExportImage" title="匯出 1080p 高清圖表">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>匯出圖表</span>
        </button>
      </div>
    </header>

    <!-- 2. Workspace Body -->
    <div class="workspace-body">
      
      <!-- Left Dock: PyGWalker Field List & Chart Types (300px fixed) -->
      <aside class="sidebar-dock" style="width: 300px;">
        <div class="sidebar-scroll-container">
          
          <!-- Section 1: Upload Dropzone -->
          <div class="dock-card">
            <div class="dock-card-header">
              <span class="dock-title">數據來源 & 上傳</span>
              <span class="status-chip" id="fileStatusBadge">47 列資料</span>
            </div>

            <div class="upload-dropzone-compact" id="dropzone" title="點擊或拖放檔案至此">
              <input type="file" id="fileInput" accept=".xlsx, .xls, .csv, .json">
              <div class="dropzone-inner">
                <svg class="dropzone-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <div class="dropzone-text">
                  <div class="dropzone-prompt">拖曳 CSV / Excel / JSON 上傳</div>
                  <div class="dropzone-hint">支援自訂上傳 · 本機 100% 離線運算</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: PyGWalker Field Dock (Dimensions & Measures) -->
          <div class="dock-card">
            <div class="dock-card-header">
              <span class="dock-title">欄位清單 (拖曳至右側軸線)</span>
              <span class="count-badge">PyGWalker</span>
            </div>

            <div class="fields-shelf-section">
              <!-- Dimensions [T] -->
              <div>
                <div class="fields-group-title">
                  <span>🔵 維度 (Dimensions / 類別)</span>
                  <span style="font-family: monospace; font-size: 10px;">[T]</span>
                </div>
                <div class="fields-pills-list" id="dimensionsList">
                  <!-- Dynamically populated -->
                </div>
              </div>

              <!-- Measures [#] -->
              <div style="margin-top: 10px;">
                <div class="fields-group-title">
                  <span>🟢 度量 (Measures / 數值)</span>
                  <span style="font-family: monospace; font-size: 10px;">[#]</span>
                </div>
                <div class="fields-pills-list" id="measuresList">
                  <!-- Dynamically populated -->
                </div>
              </div>
            </div>
          </div>

          <!-- Section 3: Chart Engine / 7 Data Atoms -->
          <div class="dock-card">
            <div class="dock-card-header">
              <span class="dock-title">圖表類型</span>
              <span class="count-badge">7 大原子</span>
            </div>

            <div class="chart-type-dock-grid" id="chartTypeGrid">
              <!-- 01. 柱狀體量 -->
              <button type="button" class="chart-type-card active" data-chart="bar">
                <div class="card-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 20V10M12 20V4M6 20v-6"></path>
                  </svg>
                </div>
                <div class="card-text-group">
                  <div class="card-header-row"><span class="card-num">01.</span><span class="card-name">離散體量</span></div>
                  <div class="card-en">Bar Comparison</div>
                </div>
              </button>

              <!-- 02. 時序趨勢 -->
              <button type="button" class="chart-type-card" data-chart="line">
                <div class="card-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m3 16 6-6 4 4 8-8"></path>
                    <path d="M17 6h4v4"></path>
                  </svg>
                </div>
                <div class="card-text-group">
                  <div class="card-header-row"><span class="card-num">02.</span><span class="card-name">時序趨勢</span></div>
                  <div class="card-en">Temporal Trend</div>
                </div>
              </button>

              <!-- 03. 相關分佈 -->
              <button type="button" class="chart-type-card" data-chart="scatter">
                <div class="card-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="7.5" cy="15.5" r="1.5" fill="currentColor"></circle>
                    <circle cx="12" cy="11" r="1.5" fill="currentColor"></circle>
                    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"></circle>
                    <circle cx="9" cy="8" r="1.5" fill="currentColor"></circle>
                    <circle cx="15" cy="16" r="1.5" fill="currentColor"></circle>
                    <line x1="4" y1="18" x2="20" y2="4" stroke-dasharray="2 2"></line>
                  </svg>
                </div>
                <div class="card-text-group">
                  <div class="card-header-row"><span class="card-num">03.</span><span class="card-name">相關分佈</span></div>
                  <div class="card-en">Correlation Matrix</div>
                </div>
              </button>

              <!-- 04. 結構佔比 -->
              <button type="button" class="chart-type-card" data-chart="donut">
                <div class="card-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                    <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                  </svg>
                </div>
                <div class="card-text-group">
                  <div class="card-header-row"><span class="card-num">04.</span><span class="card-name">結構佔比</span></div>
                  <div class="card-en">Composition Donut</div>
                </div>
              </button>

              <!-- 05. 多維畫像 -->
              <button type="button" class="chart-type-card" data-chart="radar">
                <div class="card-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5"></polygon>
                    <polygon points="12 6 18 10 18 14 12 18 6 14 6 10"></polygon>
                  </svg>
                </div>
                <div class="card-text-group">
                  <div class="card-header-row"><span class="card-num">05.</span><span class="card-name">多維畫像</span></div>
                  <div class="card-en">Radar Profile</div>
                </div>
              </button>

              <!-- 06. 轉化路徑 -->
              <button type="button" class="chart-type-card" data-chart="funnel">
                <div class="card-icon-box">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                  </svg>
                </div>
                <div class="card-text-group">
                  <div class="card-header-row"><span class="card-num">06.</span><span class="card-name">轉化路徑</span></div>
                  <div class="card-en">Funnel Conversion</div>
                </div>
              </button>
            </div>
          </div>

        </div>
      </aside>

      <!-- Main Center Arena (Flex 1) -->
      <main class="main-stage">
        
        <!-- Graphic Walker Encoding Shelves (視覺編碼槽) -->
        <section class="encoding-shelves-strip">
          <!-- Row 1: Columns (X) and Rows (Y) -->
          <div class="shelves-row">
            <!-- Columns (X) -->
            <div class="shelf-group" style="flex: 1.2;">
              <span class="shelf-label">Columns (X 軸):</span>
              <div class="shelf-drop-target" id="shelfX">
                <!-- Drop target -->
              </div>
            </div>

            <!-- Swap Button -->
            <button type="button" class="shelf-action-btn" id="btnSwapXY" title="快速對調 X 軸與 Y 軸">
              <span>⇄ 對調 X/Y</span>
            </button>

            <!-- Rows (Y) -->
            <div class="shelf-group" style="flex: 1.4;">
              <span class="shelf-label">Rows (Y 軸):</span>
              <div class="shelf-drop-target" id="shelfY">
                <!-- Drop target -->
              </div>
            </div>

            <!-- Reset Button -->
            <button type="button" class="shelf-action-btn" id="btnClearShelves" title="清除所有槽位">
              <span>✕ 清除</span>
            </button>
          </div>

          <!-- Row 2: Color, Size, Secondary -->
          <div class="shelves-row" style="font-size: 11px;">
            <!-- Color Shelf -->
            <div class="shelf-group" style="flex: 1;">
              <span class="shelf-label">Color (顏色):</span>
              <div class="shelf-drop-target" id="shelfColor"></div>
            </div>

            <!-- Size Shelf -->
            <div class="shelf-group" style="flex: 1;">
              <span class="shelf-label">Size (氣泡大小):</span>
              <div class="shelf-drop-target" id="shelfSize"></div>
            </div>

            <!-- Secondary Y Shelf -->
            <div class="shelf-group" style="flex: 1;">
              <span class="shelf-label">Secondary (次軸折線):</span>
              <div class="shelf-drop-target" id="shelfSecondary"></div>
            </div>
          </div>
        </section>

        <!-- Live KPI Ribbon -->
        <section class="kpi-ribbon">
          <div class="kpi-chip chip-1">
            <span class="kpi-micro-label" id="kpiRowCountSub">ROWS</span>
            <span class="kpi-micro-val" id="kpiRowCount">0</span>
          </div>
          <div class="kpi-chip-divider"></div>
          <div class="kpi-chip chip-2">
            <span class="kpi-micro-label" id="kpiTotalSumSub">SUM</span>
            <span class="kpi-micro-val" id="kpiTotalSum">0</span>
          </div>
          <div class="kpi-chip-divider"></div>
          <div class="kpi-chip chip-3">
            <span class="kpi-micro-label" id="kpiMeanValSub">MEAN</span>
            <span class="kpi-micro-val" id="kpiMeanVal">0</span>
          </div>
          <div class="kpi-chip-divider"></div>
          <div class="kpi-chip chip-4">
            <span class="kpi-micro-label" id="kpiMetric4Title">MAX / MIN</span>
            <span class="kpi-micro-val" id="kpiMetric4Val">0</span>
          </div>
        </section>

        <!-- Stage Body (Canvas / ECharts Viewport + Collapsible Drawer) -->
        <div class="stage-body" data-view-mode="canvas">
          
          <!-- ECharts Interactive Viewport -->
          <div id="echartsViewport" class="echarts-viewport-container" style="flex: 1; height: 100%;"></div>

          <!-- Native 1080p Canvas (Hidden unless toggled) -->
          <div class="canvas-viewport" id="canvasViewport" style="display: none; flex: 1;">
            <div class="canvas-wrapper">
              <canvas id="mainChartCanvas" width="1920" height="1080"></canvas>
            </div>
          </div>

          <!-- Data Table Drawer -->
          <section class="data-drawer" id="dataDrawer">
            <div class="drawer-header-bar" id="drawerToggleBar">
              <div class="drawer-left-action" id="btnToggleDrawer" title="展開 / 收合明細表格" style="cursor: pointer;">
                <span class="drawer-toggle-icon" id="drawerIcon">▲</span>
                <span class="drawer-heading">數據明細預覽</span>
                <span class="drawer-count-chip" id="drawerRowCount">47 列資料</span>
              </div>

              <div class="drawer-right-tools">
                <div class="drawer-search-box">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input type="text" id="tableSearchInput" class="drawer-search-input" placeholder="搜尋表格內容...">
                </div>

                <button type="button" class="btn btn-sm btn-outline" id="btnExportCSV">
                  <span>匯出 CSV</span>
                </button>
              </div>
            </div>

            <!-- Drawer Body -->
            <div class="drawer-body" id="drawerBody">
              <div class="table-scroll-wrap">
                <table class="preview-table" id="previewTable">
                  <thead id="previewTableHead"></thead>
                  <tbody id="previewTableBody"></tbody>
                </table>
              </div>

              <div class="drawer-footer-pagination">
                <span class="pagination-info" id="paginationInfo">第 1 頁 / 共 5 頁</span>
                <span class="pagination-rows-info" id="tableRowsInfo">顯示前 10 筆資料</span>
                <div class="pagination-actions">
                  <button type="button" class="btn btn-xs" id="btnPrevPage">上一頁</button>
                  <button type="button" class="btn btn-xs" id="btnNextPage">下一頁</button>
                </div>
              </div>
            </div>
          </section>

        </div>

      </main>

    </div>

  </div>

  <!-- Toast Notification element -->
  <div class="toast-notice" id="toastNotice">
    <span>通知內容</span>
  </div>

  <!-- Data-to-Video Briefing Modal -->
  <div class="briefing-modal-overlay" id="briefingModal">
    <div class="briefing-modal-card">
      <div class="modal-head">
        <div class="modal-head-title">
          <span class="modal-badge" id="modalLensBadge">120 BPM SALES BAUHAUS</span>
          <span>Data Atoms · 包豪斯動態影音簡報導演層</span>
        </div>
        <button type="button" class="modal-close-btn" id="btnCloseBriefingModal">×</button>
      </div>

      <div class="director-controls-strip">
        <div class="control-group">
          <span class="control-group-label">關注焦點：</span>
          <div class="lens-pill-group">
            <button type="button" class="lens-pill-btn active" id="btnLensSales">💰 銷售與營收</button>
            <button type="button" class="lens-pill-btn" id="btnLensScm">📦 供應鏈與庫存</button>
          </div>
        </div>
        <div class="control-group">
          <span class="control-group-label">旁白風格：</span>
          <div class="tone-pill-group">
            <button type="button" class="tone-pill-btn active" id="btnToneExec">C-Level 高管速報 (34s)</button>
            <button type="button" class="tone-pill-btn" id="btnToneTeam">業務拆解 (45s)</button>
          </div>
        </div>
      </div>

      <div class="modal-body-grid">
        <div class="modal-video-wrap">
          <video class="modal-video-player" id="briefingVideoPlayer" controls playsinline poster="preview_frames/bauhaus_scene_01.png">
            <source src="videos/data_briefing_bauhaus_34s.mp4" type="video/mp4" id="briefingVideoSrc">
          </video>
        </div>
        <div class="modal-info-panel">
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <h3 id="storyboardTitle" style="font-size: 15px; font-weight: 800; color: #111;">4 幕自動化劇本分鏡</h3>
              <span class="story-chip" id="lensKpiChip" style="background: #FFEBE5; color: #FF4400; border: 1px solid #FF4400;">營收主力：企業雲端 25.5%</span>
            </div>
            <div class="storyboard-timeline">
              <div class="story-item active-scene" data-scene="1" data-time="0">
                <span class="story-time-badge">00-08s</span>
                <div class="story-content-wrap">
                  <div class="story-header-row"><span class="story-title" id="s1_title">01. 全量體量 · MACRO VOLUME</span><span class="story-chip" id="s1_chip">3,690 萬元</span></div>
                  <textarea class="story-script-input" id="s1_script" rows="2">八大產品線總營收達 3,690 萬元，產出維持高位水準。</textarea>
                </div>
              </div>
              <div class="story-item" data-scene="2" data-time="8">
                <span class="story-time-badge">08-17s</span>
                <div class="story-content-wrap">
                  <div class="story-header-row"><span class="story-title" id="s2_title">02. 結構佔比 · PARETO DOMINANCE</span><span class="story-chip" id="s2_chip">TOP 25.5%</span></div>
                  <textarea class="story-script-input" id="s2_script" rows="2">旗艦雲端運算突破 940 萬，以二成五份額穩居成長主力。</textarea>
                </div>
              </div>
              <div class="story-item" data-scene="3" data-time="17">
                <span class="story-time-badge">17-25s</span>
                <div class="story-content-wrap">
                  <div class="story-header-row"><span class="story-title" id="s3_title">03. 梯隊分佈 · DISCRETE MATRIX</span><span class="story-chip" id="s3_chip">跨度 5.9x</span></div>
                  <textarea class="story-script-input" id="s3_script" rows="2">各品類極值跨度達 5.9 倍，高毛利模組具備強勁擴張潛力。</textarea>
                </div>
              </div>
              <div class="story-item" data-scene="4" data-time="25">
                <span class="story-time-badge">25-34s</span>
                <div class="story-content-wrap">
                  <div class="story-header-row"><span class="story-title" id="s4_title">04. 執行決策 · STRATEGIC LOCKUP</span><span class="story-chip" id="s4_chip">ACTION PLAN</span></div>
                  <textarea class="story-script-input" id="s4_script" rows="2">以理性幾何穿透複雜表象，驅動敏捷決策。Data Atoms 簡報完畢。</textarea>
                </div>
              </div>
            </div>
            <div class="engine-pills-row">
              <span class="engine-pill">🎙️ Gemini 3.8 Flash TTS · Charon</span>
              <span class="engine-pill" id="stylePill">📐 Bauhaus 幾何動態</span>
              <span class="engine-pill">⚡ 100% 程式本地渲染 (零幻覺)</span>
            </div>
          </div>
          <div class="modal-actions-bar">
            <a href="videos/data_briefing_bauhaus_34s.mp4" id="btnDownloadBriefingVideo" download="Data_Atoms_動態簡報.mp4" class="btn btn-primary" style="flex: 1; text-align: center; text-decoration: none;">📥 下載 1080p 影片</a>
            <button type="button" class="btn btn-outline" id="btnApplyScriptChanges">🔄 套用劇本更新</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Local Script Dependencies (100% Offline) -->
  <script src="js/xlsx.full.min.js"></script>
  <script src="js/echarts.min.js"></script>
  <script src="js/data_atoms_jp_dataset.js"></script>
  <script src="js/pygwalker_data_atoms.js"></script>
  <script>
    // Briefing Modal Controller
    (function() {
      const btnOpen = document.getElementById('btnOpenBriefingModal');
      const btnClose = document.getElementById('btnCloseBriefingModal');
      const modal = document.getElementById('briefingModal');
      const video = document.getElementById('briefingVideoPlayer');

      if (btnOpen && modal) {
        btnOpen.addEventListener('click', () => {
          modal.classList.add('open');
          if (video) { video.currentTime = 0; video.play().catch(()=>{}); }
        });
      }
      if (btnClose && modal) {
        btnClose.addEventListener('click', () => {
          modal.classList.remove('open');
          if (video) video.pause();
        });
      }
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.classList.remove('open');
            if (video) video.pause();
          }
        });
      }
    })();
  </script>
</body>
</html>
"""

with open('./data_atoms.html', 'w', encoding='utf-8') as f:
    f.write(html_template)

print("Generated upgraded ./data_atoms.html successfully!")
