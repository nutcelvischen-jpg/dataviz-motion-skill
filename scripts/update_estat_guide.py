import re

html_template = r"""<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>e-Stat 日本政府官方統計 · 17大領域分類全覽、時序長度與方法論研究矩陣</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600;700&family=Noto+Sans+TC:wght@400;500;600;700&family=Noto+Serif+TC:wght@500;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    
    :root {
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
      --forest-tint: rgba(44, 110, 73, 0.08);
      --amber-accent: #c07d2b;
      --amber-tint: rgba(192, 125, 43, 0.08);
      --purple-accent: #6b46c1;
      --purple-tint: rgba(107, 70, 193, 0.08);
      --teal-accent: #0f766e;
      --teal-tint: rgba(15, 118, 110, 0.08);
      
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 16px;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.04);
      --shadow-md: 0 4px 14px rgba(0,0,0,0.06);
    }

    body {
      font-family: 'Geist', 'Noto Sans TC', system-ui, -apple-system, sans-serif;
      background-color: var(--bg-page);
      color: var(--ink-primary);
      line-height: 1.6;
      padding: 0 0 100px 0;
      -webkit-font-smoothing: antialiased;
    }

    /* 頂部官方指示條 */
    .official-top-banner {
      background: linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%);
      color: #ffffff;
      padding: 10px 48px;
      font-size: 13.5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      z-index: 101;
      border-bottom: 1px solid rgba(255,255,255,0.15);
    }
    .official-portal-link {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.4);
      color: #fff;
      padding: 4px 12px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
    }
    .official-portal-link:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    header {
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-default);
      padding: 30px 48px 22px;
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(10px);
      background-color: rgba(255, 255, 255, 0.94);
    }
    .header-inner {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.05em;
      background: var(--metro-tint);
      color: var(--metro-blue);
      padding: 4px 10px;
      border-radius: 20px;
      margin-bottom: 8px;
    }
    h1 {
      font-family: 'Noto Serif TC', 'Instrument Serif', Georgia, serif;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .header-desc {
      font-size: 14px;
      color: var(--ink-secondary);
      margin-top: 4px;
    }
    .nav-actions {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .nav-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--bg-subtle);
      border: 1px solid var(--border-default);
      color: var(--ink-primary);
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
    }
    .nav-btn:hover {
      background: var(--metro-blue);
      color: #fff;
      border-color: var(--metro-blue);
    }

    main {
      max-width: 1400px;
      margin: 32px auto 0;
      padding: 0 48px;
    }
    @media (max-width: 1024px) {
      .official-top-banner, header, main { padding-left: 20px; padding-right: 20px; }
    }

    /* 頂部數據看板 */
    .hero-stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }
    .hero-stat-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      padding: 18px 20px;
      box-shadow: var(--shadow-sm);
    }
    .hero-stat-num {
      font-size: 32px;
      font-weight: 700;
      color: var(--metro-blue);
      letter-spacing: -0.03em;
      display: flex;
      align-items: baseline;
      gap: 4px;
    }
    .hero-stat-unit {
      font-size: 16px;
      font-weight: 600;
      color: var(--ink-secondary);
    }
    .hero-stat-label {
      font-size: 13.5px;
      font-weight: 600;
      color: var(--ink-primary);
      margin-top: 2px;
    }
    .hero-stat-sub {
      font-size: 12px;
      color: var(--ink-muted);
      margin-top: 4px;
      line-height: 1.4;
    }

    /* 視角切換器 (View Switcher) */
    .view-switcher-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      padding: 8px 12px;
      margin-bottom: 24px;
      box-shadow: var(--shadow-sm);
      flex-wrap: wrap;
      gap: 12px;
    }
    .view-tab-group {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .view-tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      font-size: 13.5px;
      font-weight: 600;
      border: 1px solid transparent;
      background: transparent;
      color: var(--ink-secondary);
      cursor: pointer;
      transition: all 0.18s ease;
    }
    .view-tab-btn:hover {
      background: var(--bg-subtle);
      color: var(--ink-primary);
    }
    .view-tab-btn.active {
      background: var(--metro-blue);
      color: #ffffff;
      border-color: var(--metro-blue);
      box-shadow: 0 2px 6px rgba(44, 84, 138, 0.25);
    }
    .view-tab-count {
      display: inline-block;
      font-size: 11px;
      padding: 1px 6px;
      border-radius: 10px;
      background: rgba(0,0,0,0.08);
    }
    .view-tab-btn.active .view-tab-count {
      background: rgba(255,255,255,0.25);
      color: #fff;
    }

    /* 搜尋與篩選列 */
    .filter-panel {
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      padding: 22px 24px;
      margin-bottom: 32px;
      box-shadow: var(--shadow-sm);
    }
    .search-row {
      display: flex;
      gap: 14px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .search-input {
      flex: 1;
      min-width: 280px;
      background: var(--bg-page);
      border: 1px solid var(--border-default);
      color: var(--ink-primary);
      padding: 12px 18px;
      border-radius: var(--radius-sm);
      font-size: 14px;
      outline: none;
      transition: border 0.2s;
    }
    .search-input:focus {
      border-color: var(--metro-blue);
      background: #fff;
      box-shadow: 0 0 0 3px rgba(44, 84, 138, 0.1);
    }

    .tags-group {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }
    .filter-tag {
      background: var(--bg-subtle);
      border: 1px solid var(--border-default);
      color: var(--ink-secondary);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.15s;
      user-select: none;
    }
    .filter-tag:hover {
      background: var(--bg-inset);
      color: var(--ink-primary);
    }
    .filter-tag.active {
      background: var(--metro-blue);
      color: #fff;
      border-color: var(--metro-blue);
      font-weight: 600;
    }

    /* 區塊標題 */
    .section-title-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin: 36px 0 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid var(--border-default);
    }
    .section-title-bar.first-section {
      margin-top: 10px;
    }
    .section-title-main {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-title {
      font-family: 'Noto Serif TC', Georgia, serif;
      font-size: 22px;
      font-weight: 700;
      color: var(--ink-primary);
    }
    .section-tag-pill {
      font-size: 12px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 12px;
      background: var(--metro-tint);
      color: var(--metro-blue);
      border: 1px solid rgba(44, 84, 138, 0.15);
    }
    .section-count {
      font-size: 13px;
      color: var(--ink-muted);
    }
    .section-desc-sub {
      font-size: 13.5px;
      color: var(--ink-secondary);
      margin-top: 6px;
    }

    /* ==========================================================
       區塊 1: 官方數據時間跨度與歷史長度縱深 (Horizons)
       ========================================================== */
    .horizon-panel {
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      padding: 28px;
      margin-bottom: 36px;
      box-shadow: var(--shadow-sm);
    }
    .horizon-summary-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
      margin-bottom: 26px;
    }
    .horizon-summary-box {
      border: 1px solid var(--border-default);
      background: var(--bg-subtle);
      border-radius: var(--radius-md);
      padding: 16px 18px;
      border-left: 4px solid var(--metro-blue);
    }
    .horizon-summary-box.amber { border-left-color: var(--amber-accent); }
    .horizon-summary-box.green { border-left-color: var(--forest-green); }
    .horizon-summary-box.purple { border-left-color: var(--purple-accent); }
    
    .horizon-summary-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--ink-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: flex;
      justify-content: space-between;
    }
    .horizon-summary-val {
      font-size: 20px;
      font-weight: 700;
      color: var(--ink-primary);
      margin: 6px 0 2px;
      letter-spacing: -0.02em;
    }
    .horizon-summary-desc {
      font-size: 12px;
      color: var(--ink-muted);
      line-height: 1.45;
    }

    /* 視覺化時間軸長條比較 */
    .timeline-chart-wrap {
      background: var(--bg-page);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      padding: 22px 20px;
      margin-bottom: 24px;
    }
    .timeline-chart-header {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 600;
      color: var(--ink-muted);
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border-default);
      margin-bottom: 14px;
    }
    .timeline-row {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      gap: 14px;
      font-size: 13px;
    }
    .timeline-label {
      width: 220px;
      flex-shrink: 0;
      font-weight: 600;
      color: var(--ink-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .timeline-bar-bg {
      flex: 1;
      height: 22px;
      background: #e9e4d8;
      border-radius: 4px;
      position: relative;
      overflow: hidden;
    }
    .timeline-bar-fill {
      height: 100%;
      border-radius: 4px;
      position: absolute;
      top: 0;
      display: flex;
      align-items: center;
      padding: 0 8px;
      font-size: 11px;
      font-weight: 700;
      color: #fff;
      transition: width 0.3s ease;
      white-space: nowrap;
    }
    .timeline-span-badge {
      width: 90px;
      flex-shrink: 0;
      text-align: right;
      font-weight: 700;
      font-family: monospace;
      color: var(--metro-blue);
      font-size: 12.5px;
    }

    /* 時間跨度詳細規格表 */
    .horizon-table-wrap {
      overflow-x: auto;
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
    }
    .horizon-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }
    .horizon-table th {
      background: var(--bg-subtle);
      padding: 12px 16px;
      font-weight: 600;
      color: var(--ink-secondary);
      border-bottom: 1px solid var(--border-default);
      white-space: nowrap;
    }
    .horizon-table td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-light);
      vertical-align: middle;
    }
    .horizon-table tr:hover td {
      background: rgba(44, 84, 138, 0.02);
    }
    .time-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 700;
      font-family: monospace;
      background: var(--metro-tint);
      color: var(--metro-blue);
    }
    .duration-chip {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 12px;
      font-size: 11.5px;
      font-weight: 700;
      background: var(--forest-tint);
      color: var(--forest-green);
      border: 1px solid rgba(44, 110, 73, 0.2);
    }

    /* ==========================================================
       區塊 2: 以研究方法論分類的矩陣 (Methodology Grid)
       ========================================================== */
    .method-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(440px, 1fr));
      gap: 24px;
    }
    @media (max-width: 768px) {
      .method-grid { grid-template-columns: 1fr; }
    }
    .method-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      padding: 24px;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
    }
    .method-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-md);
      border-color: var(--purple-accent);
    }
    .method-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .method-family-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--ink-primary);
      display: flex;
      align-items: center;
      gap: 8px;
      line-height: 1.35;
    }
    .method-cat-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      background: var(--purple-tint);
      color: var(--purple-accent);
      border: 1px solid rgba(107, 70, 193, 0.2);
      white-space: nowrap;
    }

    /* 時間跨度徽章（方法卡片中專屬） */
    .method-time-horizon-banner {
      background: linear-gradient(90deg, #f0f7ff 0%, #faf5ff 100%);
      border: 1px solid #dbeafe;
      border-radius: var(--radius-sm);
      padding: 8px 12px;
      font-size: 12.5px;
      color: #1e40af;
      margin: 12px 0 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }
    .method-time-badge-bold {
      font-weight: 700;
      background: #2563eb;
      color: #ffffff;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 11px;
    }

    /* 核心算法標籤組 */
    .core-algo-group {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 14px;
    }
    .core-algo-pill {
      font-size: 11.5px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--bg-subtle);
      color: var(--ink-secondary);
      border: 1px solid var(--border-default);
    }

    /* 題目區塊 */
    .method-topics-box {
      border-top: 1px dashed var(--border-default);
      padding-top: 14px;
      margin-top: 8px;
    }
    .method-topic-item {
      background: var(--bg-page);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-sm);
      padding: 12px 14px;
      margin-bottom: 10px;
      transition: background 0.15s;
    }
    .method-topic-item:hover {
      background: #fff;
      border-color: var(--purple-accent);
    }
    .topic-item-title {
      font-size: 13.5px;
      font-weight: 700;
      color: var(--ink-primary);
      margin-bottom: 4px;
      line-height: 1.4;
    }
    .topic-item-meta {
      font-size: 12px;
      color: var(--ink-secondary);
      line-height: 1.5;
    }
    .topic-item-meta strong {
      color: var(--ink-primary);
    }
    .topic-tag-model {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      background: var(--purple-tint);
      color: var(--purple-accent);
      padding: 1px 6px;
      border-radius: 3px;
      margin-top: 4px;
    }

    /* 分析流程流水步階 */
    .pipeline-steps-box {
      background: var(--bg-subtle);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      margin-top: 12px;
      font-size: 12px;
      color: var(--ink-secondary);
    }
    .pipeline-title {
      font-weight: 700;
      color: var(--ink-primary);
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .pipeline-list {
      list-style: none;
      padding-left: 0;
    }
    .pipeline-list li {
      margin-bottom: 3px;
      line-height: 1.4;
    }

    /* 方法卡片底部 */
    .method-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 18px;
      padding-top: 12px;
      border-top: 1px solid var(--border-light);
      flex-wrap: wrap;
      gap: 10px;
    }
    .pkg-recommend {
      font-size: 11.5px;
      font-family: monospace;
      color: var(--ink-muted);
    }

    /* ==========================================================
       區塊 3: 17 大領域分類卡片 (Category Grid)
       ========================================================== */
    .category-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
      gap: 24px;
    }
    @media (max-width: 768px) {
      .category-grid { grid-template-columns: 1fr; }
    }
    .cat-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      padding: 24px;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
    }
    .cat-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-md);
      border-color: var(--metro-blue);
    }
    .cat-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .cat-code-badge {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      padding: 3px 8px;
      border-radius: 4px;
      background: var(--bg-subtle);
      color: var(--ink-secondary);
      border: 1px solid var(--border-default);
    }
    .cat-name {
      font-size: 19px;
      font-weight: 700;
      color: var(--ink-primary);
      margin-top: 4px;
    }
    .cat-ministry {
      font-size: 12px;
      color: var(--metro-blue);
      font-weight: 600;
      margin-top: 2px;
    }
    .cat-time-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11.5px;
      font-weight: 600;
      color: var(--forest-green);
      background: var(--forest-tint);
      border: 1px solid rgba(44, 110, 73, 0.2);
      padding: 2px 7px;
      border-radius: 4px;
      margin-top: 6px;
    }
    .cat-data-scope {
      background: var(--bg-subtle);
      border-radius: var(--radius-sm);
      padding: 10px 14px;
      font-size: 13px;
      color: var(--ink-secondary);
      margin: 14px 0;
      line-height: 1.5;
    }
    .cat-data-scope strong {
      color: var(--ink-primary);
    }

    .research-block {
      border-top: 1px dashed var(--border-default);
      padding-top: 14px;
      margin-top: 10px;
    }
    .research-title-label {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--clay-danger);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .research-idea-list {
      list-style: none;
    }
    .research-idea-item {
      font-size: 13px;
      color: var(--ink-primary);
      margin-bottom: 8px;
      padding-left: 18px;
      position: relative;
      line-height: 1.45;
    }
    .research-idea-item::before {
      content: "✦";
      position: absolute;
      left: 0;
      color: var(--amber-accent);
      font-size: 11px;
      top: 1px;
    }
    .research-method-tag {
      display: inline-block;
      font-size: 11px;
      background: var(--bg-subtle);
      color: var(--ink-muted);
      padding: 1px 6px;
      border-radius: 4px;
      margin-left: 4px;
      font-family: monospace;
    }

    .cat-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 18px;
      padding-top: 12px;
      border-top: 1px solid var(--border-light);
    }
    .api-hint {
      font-size: 12px;
      font-family: monospace;
      color: var(--ink-muted);
    }
    .quick-api-btn {
      background: transparent;
      border: 1px solid var(--border-default);
      color: var(--metro-blue);
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.15s;
    }
    .quick-api-btn:hover {
      background: var(--metro-tint);
      border-color: var(--metro-blue);
    }

    footer {
      max-width: 1400px;
      margin: 60px auto 0;
      padding: 30px 48px;
      border-top: 1px solid var(--border-default);
      display: flex;
      justify-content: space-between;
      color: var(--ink-muted);
      font-size: 13px;
      flex-wrap: wrap;
      gap: 16px;
    }
  </style>
</head>
<body>

<!-- 頂部官方入口指示橫條 -->
<div class="official-top-banner">
  <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
    <span style="font-weight: 700;">🏛️ 日本政府官方統計入口網站：</span>
    <a href="https://www.e-stat.go.jp" target="_blank" class="official-portal-link">
      <span style="font-family: monospace;">https://www.e-stat.go.jp</span>
      <span>(前往官網) ↗</span>
    </a>
  </div>
  <div style="display: flex; gap: 14px; align-items: center; font-size: 12px;">
    <span style="opacity: 0.9;">API 端點：<code style="background: rgba(0,0,0,0.25); padding: 2px 6px; border-radius: 3px; font-family: monospace;">api.e-stat.go.jp/rest/3.0/app</code></span>
    <button onclick="navigator.clipboard.writeText('https://www.e-stat.go.jp'); alert('已複製 e-Stat 官網網址！');" style="background: rgba(255,255,255,0.2); border: none; color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">複製官網網址</button>
  </div>
</div>

<header>
  <div class="header-inner">
    <div>
      <div class="badge">📚 e-Stat 官方資料庫全集 · 時序長度、領域分類與研究方法論導航</div>
      <h1>日本官方統計分類、時序長度與研究方法矩陣</h1>
      <p class="header-desc">橫跨 17 大官方領域、百年數據時間縱深（1920–2024）、6 大實證計量方法論與 50+ 個可執行研究切角</p>
    </div>
    <div class="nav-actions">
      <a href="data_atoms.html" class="nav-btn" style="background: var(--metro-blue); color: #fff; border-color: var(--metro-blue);">📊 數據原子儀表板 (Data Atoms)</a>
      <a href="student_data_analyst_workflow.html" class="nav-btn">🎓 學員實戰手冊</a>
      <a href="japan_population_dashboard.html" class="nav-btn">🗾 人口動態總覽</a>
    </div>
  </div>
</header>

<main>
  <!-- 宏觀數字看板 -->
  <section class="hero-stat-grid">
    <div class="hero-stat-card">
      <div class="hero-stat-num">17 <span class="hero-stat-unit">大領域</span></div>
      <div class="hero-stat-label">官方統計領域分野</div>
      <div class="hero-stat-sub">涵蓋人口、經濟、司法至文化</div>
    </div>
    <div class="hero-stat-card">
      <div class="hero-stat-num">100+ <span class="hero-stat-unit">年</span></div>
      <div class="hero-stat-label">歷史數據時間跨度</div>
      <div class="hero-stat-sub">國勢調查 (1920–2020) 百年長河</div>
    </div>
    <div class="hero-stat-card">
      <div class="hero-stat-num">50 <span class="hero-stat-unit">年連續</span></div>
      <div class="hero-stat-label">SSDSE 都道府縣面板</div>
      <div class="hero-stat-sub">1975–2024 半世紀跨縣追蹤體系</div>
    </div>
    <div class="hero-stat-card">
      <div class="hero-stat-num">6 <span class="hero-stat-unit">大體系</span></div>
      <div class="hero-stat-label">實證研究方法論分類</div>
      <div class="hero-stat-sub">因果推論、時序預測、空間計量等</div>
    </div>
    <div class="hero-stat-card">
      <div class="hero-stat-num">50+ <span class="hero-stat-unit">個</span></div>
      <div class="hero-stat-label">高價值深度研究切角</div>
      <div class="hero-stat-sub">含變數對照、假說設定與流程</div>
    </div>
  </section>

  <!-- 視角切換器 -->
  <div class="view-switcher-bar">
    <div style="font-size: 13.5px; font-weight: 700; color: var(--ink-secondary); display: flex; align-items: center; gap: 6px;">
      <span>🧭 檢視視角導航：</span>
    </div>
    <div class="view-tab-group">
      <button class="view-tab-btn active" id="tabDomain" onclick="switchView('domain')">
        <span>🏛️ 依 17 大統計領域分類</span>
        <span class="view-tab-count">17</span>
      </button>
      <button class="view-tab-btn" id="tabMethod" onclick="switchView('method')">
        <span>🔬 依研究方法論分類</span>
        <span class="view-tab-count">6 大方法</span>
      </button>
      <button class="view-tab-btn" id="tabHorizon" onclick="switchView('horizon')">
        <span>⏳ 官方數據歷史長度地圖</span>
        <span class="view-tab-count">10 大調查</span>
      </button>
      <button class="view-tab-btn" id="tabAll" onclick="switchView('all')">
        <span>📑 展開全部區塊</span>
      </button>
    </div>
  </div>

  <!-- 篩選器與搜尋列 -->
  <section class="filter-panel">
    <div class="search-row">
      <input type="text" id="searchInput" class="search-input" placeholder="🔍 搜尋領域、數據關鍵字、研究方法（例如：DID、空間計量、空屋、人口、通膨、VAR、PCA、特徵定價、1975...）" oninput="onSearchInput()">
    </div>
    <div class="tags-group" id="tagsContainer">
      <span style="font-size: 13px; font-weight: 600; color: var(--ink-secondary); margin-right: 6px;">快速分類標籤：</span>
      <span class="filter-tag active" onclick="setFilter(event, 'all')">全部檢視</span>
      <span class="filter-tag" onclick="setFilter(event, 'demographics')">👥 人口與勞動</span>
      <span class="filter-tag" onclick="setFilter(event, 'economy')">💹 經濟、商業與物價</span>
      <span class="filter-tag" onclick="setFilter(event, 'housing')">🏠 土地、居住與觀光</span>
      <span class="filter-tag" onclick="setFilter(event, 'welfare')">🏥 醫療、福祉與生活</span>
      <span class="filter-tag" onclick="setFilter(event, 'tech')">⚡ 科技、能源與環境</span>
    </div>
  </section>

  <!-- =========================================================
       區塊 1: 官方數據時間跨度與歷史縱深一覽 (Horizons Section)
       ========================================================= -->
  <section id="horizonSectionBlock">
    <div class="section-title-bar first-section">
      <div class="section-title-main">
        <div class="section-title">⏳ 官方統計資料時間跨度與歷史縱深地圖</div>
        <span class="section-tag-pill">時序長度與頻率全覽</span>
      </div>
      <div class="section-count">涵蓋日本中央省廳 10 大權威統計</div>
    </div>
    <div class="section-desc-sub">明確標註各主要國家級調查的起訖年份、時間跨度長度、調查頻率與最適計量研究方法。</div>

    <div class="horizon-panel" style="margin-top: 16px;">
      <!-- 統計縱深特色卡片 -->
      <div class="horizon-summary-row">
        <div class="horizon-summary-box">
          <div class="horizon-summary-title">
            <span>最長普查時間跨度</span>
            <span>1920–2020</span>
          </div>
          <div class="horizon-summary-val">100 年歷史長河</div>
          <div class="horizon-summary-desc">國勢調查百年歷史，每 5 年一次，適合分析大正至令和跨世紀之家庭結構、少子高齡化大趨勢。</div>
        </div>
        <div class="horizon-summary-box amber">
          <div class="horizon-summary-title">
            <span>最長月/年連續時序</span>
            <span>1950–2024</span>
          </div>
          <div class="horizon-summary-val">74 年連續時間序列</div>
          <div class="horizon-summary-desc">人口推計與住民基本台帳人口移動 (1954~)，連續 70+ 年無間斷，為長期 VAR / SVAR 預測的黃金基準。</div>
        </div>
        <div class="horizon-summary-box green">
          <div class="horizon-summary-title">
            <span>宏觀跨縣面板數據</span>
            <span>1975–2024</span>
          </div>
          <div class="horizon-summary-val">連續 50 年面板 (N=47, T=50)</div>
          <div class="horizon-summary-desc">SSDSE 社會人口統計體系提供 47 都道府縣半世紀面板 (NT=2,350)，為雙重差分法 (DID) 與雙向固定效應必備。</div>
        </div>
        <div class="horizon-summary-box purple">
          <div class="horizon-summary-title">
            <span>宏觀經濟物價與土地</span>
            <span>1970–2024 / 1974–2024</span>
          </div>
          <div class="horizon-summary-val">54 年物價 / 50 年地價</div>
          <div class="horizon-summary-desc">消費者物價指數細項 (CPI) 54 年，地價公示 50 年，完整覆蓋泡沫景氣、失落三十年與近期通膨重估。</div>
        </div>
      </div>

      <!-- 視覺化長條時間軸 -->
      <div class="timeline-chart-wrap">
        <div class="timeline-chart-header">
          <span>調查項目名稱</span>
          <span style="flex: 1; text-align: center;">時間覆蓋區間 (1920 年 ~ 2024 年)</span>
          <span style="width: 90px; text-align: right;">時間跨度</span>
        </div>
        <div id="timelineBarsContainer">
          <!-- JS 自動繪製 10 大調查的橫向時間軸長條 -->
        </div>
      </div>

      <!-- 詳細規格表 -->
      <div class="horizon-table-wrap">
        <table class="horizon-table">
          <thead>
            <tr>
              <th>調查名稱與主責機關</th>
              <th>起訖年份 (時間區間)</th>
              <th>連續長度</th>
              <th>統計頻率</th>
              <th>地理顆粒度</th>
              <th>推薦計量與實證研究方法</th>
              <th>e-Stat 表單代碼</th>
            </tr>
          </thead>
          <tbody id="horizonTableBody">
            <!-- JS 自動注入資料表內容 -->
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- =========================================================
       區塊 2: 以研究方法論分類的矩陣 (Methodology Section)
       ========================================================= -->
  <section id="methodSectionBlock">
    <div class="section-title-bar">
      <div class="section-title-main">
        <div class="section-title">🔬 依實證研究方法論分類的深度研究矩陣</div>
        <span class="section-tag-pill" style="background: var(--purple-tint); color: var(--purple-accent); border-color: rgba(107, 70, 193, 0.2);">Methodology-Oriented</span>
      </div>
      <div class="section-count" id="methodResultsCount">顯示全部 6 大方法論體系</div>
    </div>
    <div class="section-desc-sub">從計量因果推論、時序人口預測、空間計量至機器學習，直接對應所需之 e-Stat 官方數據、理論假說、模型設定與分析流程。</div>

    <div class="method-grid" id="methodContainer" style="margin-top: 18px;">
      <!-- JS 會自動注入 6 大實證研究方法論卡片 -->
    </div>
  </section>

  <!-- =========================================================
       區塊 3: 官方 17 大統計領域分類矩陣 (Domains Section)
       ========================================================= -->
  <section id="domainSectionBlock">
    <div class="section-title-bar">
      <div class="section-title-main">
        <div class="section-title">🏛️ 官方 17 大統計領域與可執行的深度研究矩陣</div>
        <span class="section-tag-pill">Domain-Oriented</span>
      </div>
      <div class="section-count" id="domainResultsCount">顯示全部 17 個領域</div>
    </div>
    <div class="section-desc-sub">以日本政府法定規格分野 (statsField 01–17) 檢索，包含 13 組 SSDSE 指標、包含範疇與代表性研究主題。</div>

    <div class="category-grid" id="categoryContainer" style="margin-top: 18px;">
      <!-- JS 會自動注入 17 大領域與研究卡片 -->
    </div>
  </section>
</main>

<footer>
  <div>
    <strong>資料庫來源:</strong> 日本總務省統計局 e-Stat API v3.0 (官方規格標準分類代碼 statsField 01–17)
  </div>
  <div>
    <strong>推薦實證工具:</strong> Python (linearmodels, statsmodels, pysal, mgwr, scikit-learn), R (fixest, spatialreg), Apache ECharts
  </div>
</footer>

<script>
// =========================================================================
// 1. 官方 10 大調查之時間跨度與規格資料庫 (Horizons Data)
// =========================================================================
const horizonsData = [
  {
    name: "國勢調查 (Population Census)",
    ministry: "總務省統計局",
    startYear: 1920,
    endYear: 2020,
    years: 100,
    frequency: "每 5 年一次 (全數普查)",
    granularity: "都道府縣 / 市町村 / 500m 統計網格",
    models: "世代人口轉型、人口重心移動 (Centroid Shift)、長期世帶構成萎縮",
    color: "#2563eb",
    tableId: "0003412000"
  },
  {
    name: "人口推計 (Population Estimates)",
    ministry: "總務省統計局",
    startYear: 1950,
    endYear: 2024,
    years: 74,
    frequency: "月度 (全國各年齡) / 年度 (47 都道府縣)",
    granularity: "都道府縣、男女各歲階層",
    models: "世代存活法 (Cohort-Component)、超長期 VAR / SVAR、年齡金字塔模擬",
    color: "#0284c7",
    tableId: "0003448228"
  },
  {
    name: "住民基本台帳人口移動報告",
    ministry: "總務省統計局",
    startYear: 1954,
    endYear: 2024,
    years: 70,
    frequency: "月度 / 年度",
    granularity: "47 都道府縣間、市町村遷徙流向",
    models: "空間引力模型 (Gravity Model)、東京單極集中動態、青年人口遷徙網絡",
    color: "#0d9488",
    tableId: "0003411440"
  },
  {
    name: "家計調查 (Family Income & Expenditure)",
    ministry: "總務省統計局",
    startYear: 1963,
    endYear: 2024,
    years: 61,
    frequency: "月度 / 年度",
    granularity: "全國、都道府縣廳所在地、各所得分位",
    models: "生命週期假說 (Life-Cycle)、微觀需求體系 (AIDS)、通膨生活成本差異",
    color: "#ca8a04",
    tableId: "0003427000"
  },
  {
    name: "消費者物價指數 (CPI)",
    ministry: "總務省統計局",
    startYear: 1970,
    endYear: 2024,
    years: 54,
    frequency: "月度 / 年度",
    granularity: "全國、都道府縣廳所在地 (近600品項)",
    models: "SVAR 結構向量自我迴歸、菲利浦曲線、輸入型通膨脈衝響應分析 (IRF)",
    color: "#ea580c",
    tableId: "0003427113"
  },
  {
    name: "地價公示・都道府縣地價調查",
    ministry: "國土交通省",
    startYear: 1974,
    endYear: 2024,
    years: 50,
    frequency: "年度 (地價公示1月 / 地價調查7月)",
    granularity: "標準評定地點、各市町村 (住宅/商業/工業)",
    models: "空間計量 (Spatial Lag / SAR)、特徵價格模型 (Hedonic)、資產泡沫重估",
    color: "#b91c1c",
    tableId: "0000010108"
  },
  {
    name: "社會・人口統計體系 (SSDSE 跨縣面板)",
    ministry: "總務省統計局 / 統計情報中心",
    startYear: 1975,
    endYear: 2024,
    years: 50,
    frequency: "年度連續跨縣面板",
    granularity: "47 都道府縣 (N=47, T=50, NT=2,350)",
    models: "雙重差分法 (DID)、雙向固定效應 (Two-Way FE)、合成控制法 (SCM)、PCA",
    color: "#7c3aed",
    tableId: "0000010101~13"
  },
  {
    name: "住宅・土地統計調查",
    ministry: "總務省統計局",
    startYear: 1948,
    endYear: 2023,
    years: 75,
    frequency: "每 5 年一次",
    granularity: "都道府縣 / 市町村",
    models: "空屋空間自相關 (Moran's I)、折價溢出效應、斷點回歸 (RDD)",
    color: "#4f46e5",
    tableId: "0000010108"
  },
  {
    name: "事業所・企業統計 / 經濟普查",
    ministry: "總務省 / 經濟產業省",
    startYear: 1951,
    endYear: 2021,
    years: 70,
    frequency: "每 3~5 年一次",
    granularity: "都道府縣 / 市町村",
    models: "產業集聚度 (Agglomeration)、電商創造性破壞、勞力資本替代 S 曲線",
    color: "#059669",
    tableId: "0000010103"
  },
  {
    name: "勞動力調查 (失業率與就業結構)",
    ministry: "厚生勞動省 / 總務省",
    startYear: 1953,
    endYear: 2024,
    years: 71,
    frequency: "月度 / 年度",
    granularity: "全國、主要經濟地區",
    models: "貝佛里奇曲線 (Beveridge Curve)、奧肯定律 (Okun's Law)、非正規雇用分解",
    color: "#db2777",
    tableId: "0003428800"
  }
];

// =========================================================================
// 2. 6 大實證研究方法論分類資料庫 (Methods Data)
// =========================================================================
const methodsData = [
  {
    id: "causal",
    icon: "⚖️",
    name: "因果推論與政策評估 (Causal Inference & Policy Evaluation)",
    category: "準實驗計量",
    timeSpan: "1975–2024 (50年跨縣面板)",
    timeBadge: "50 年連續面板 · 政策前後 10~20 年",
    coreMethods: ["雙重差分法 (DID)", "多期事件研究法 (Event Study)", "合成控制法 (SCM)", "斷點回歸 (RDD)"],
    summary: "排除遺漏變數與宏觀時間混淆因素，精準估計日本國家級重大政策或外生衝擊的「平均處置效果 (ATE/ATT)」。",
    topics: [
      {
        title: "「平成大合併」行政簡併政策對地方財政自給率與公共建設支出的長期因果衝擊",
        hypothesis: "市町村合併初期雖減緩公債負擔，但偏鄉公共服務可及性因行政中心外移而加速衰退。",
        model: "多期雙重差分法 (Multi-period DID / Two-Way Fixed Effects)",
        vars: "Y: 實質赤字比率、公債費負擔比率；X: 政策處置虛擬變數、人口規模、老齡化比率",
        dataset: "SSDSE-D 財政指標 (1975–2024) + SSDSE-A 人口指標"
      },
      {
        title: "75 歲「後期高齡者」自願繳回駕照獎勵政策對偏鄉高齡交通事故之斷點回歸評估",
        hypothesis: "達到 75 歲法定特定換照認知機能檢查與自主繳回乘車津貼門檻，顯著降低高齡駕駛肇事致死率。",
        model: "清晰斷點回歸 (Sharp RDD) 與局部多項式估計",
        vars: "Y: 每萬名高齡者交通事故死傷數；Running Var: 駕駛人年齡 (以 75 歲為斷點切線)",
        dataset: "SSDSE-K 司法安全指標 (1975–2024) + 警察廳交通統計"
      },
      {
        title: "地方私鐵與 JR 地方路線廢線對沿線小鎮人口流失與商業空洞化之反事實重構",
        hypothesis: "鐵道廢線加速沿線市町村青年外流，傳統引力模型無法捕捉鐵道外部性帶來的非線性人口跌落。",
        model: "合成控制法 (Synthetic Control Method, SCM)",
        vars: "處置組: 廢線自治體；對照池: 地理相鄰但保有鐵道營運之自治體加權合成虛擬對照組",
        dataset: "住民基本台帳人口移動報告 (1954–2024) + SSDSE-H 住宅"
      }
    ],
    pipeline: [
      "1. 處置前平行趨勢檢驗 (Pre-treatment Parallel Trends Test)",
      "2. 雙向固定效應估計 (Two-Way Fixed Effects Panel OLS)",
      "3. 異質性處置效果與動態滯後事件研究 (Event Study Graph)",
      "4. 安慰劑檢驗與隨機虛擬斷點測試 (Placebo & Permutation Tests)"
    ],
    packages: "Python: linearmodels.panel | R: fixest::feols | Stata: reghdfe"
  },
  {
    id: "timeseries",
    icon: "📈",
    name: "時序計量與人口世代預測 (Time-Series Econometrics & Demography)",
    category: "動態時序與人口學",
    timeSpan: "1950–2024 (74年連續時序) / 1920–2020 (百年普查)",
    timeBadge: "74 年連續時間序列 · 長期預測",
    coreMethods: ["世代存活法 (Cohort-Component)", "向量自我迴歸 (VAR/SVAR)", "共整合與誤差修正 (VECM)", "Prophet / ARIMA"],
    summary: "利用日本半世紀以上連續未中斷的時間序列，模擬長期人口金字塔推估、物價通膨傳導動態與脈衝響應分析。",
    topics: [
      {
        title: "2025–2050 日本 47 都道府縣人口年齡結構崩縮與「地方消滅」臨界點模擬預測",
        hypothesis: "地方 20-39 歲育齡女性在未來 20 年減半，導致人口自然萎縮形成不可逆的自我強化螺旋。",
        model: "世代存活法 (Cohort-Component Projection)",
        vars: "Y: 5歲階級年齡別人口推估；參數: 都道府縣別生命表生殘率、特殊出生率、跨縣純移動率",
        dataset: "人口推計 (0003448228, 1950–2024) + 國勢調查"
      },
      {
        title: "「春鬥」名目工資調升、進口能源物價衝擊與核心通膨之動態傳導時滯與脈衝響應分析",
        hypothesis: "名目薪資調升對核心 CPI 的傳導時滯約 6~9 個月，短期波動主要由進口原物料價格推動。",
        model: "結構向量自我迴歸 (SVAR & Impulse Response Functions)",
        vars: "變數群: 每月勤勞統計現金給與總額、進口物價指數、核心通膨率 (CPI)、有效求人倍率",
        dataset: "消費者物價指數 CPI (0003427113, 1970–2024) + 勞動統計"
      },
      {
        title: "少子化拐點下地方私立大學招生生源與生源缺額 (定員割れ) 之 15 年外推預測",
        hypothesis: "18 歲人口規模將於 2028 年突破下行臨界點，地方私大退場風險呈現加速非線性擴大。",
        model: "季節性自回歸整合移動平均模型 (SARIMAX with Exogenous Demographic Cohort)",
        vars: "Y: 地方私立大學實際註冊人數；外生變數: 18年前出生登記人口、高校在學率",
        dataset: "學校基本調查 (SSDSE-E, 1975–2024)"
      }
    ],
    pipeline: [
      "1. 定常性與單根檢驗 (ADF & KPSS Unit Root Tests)",
      "2. 協整檢驗與最優滯後階數 (Johansen Cointegration & AIC/BIC Lag)",
      "3. 脈衝響應分析 (IRF) 與預測方差分解 (FEVD)",
      "4. 外推區間蒙地卡羅情境模擬 (Monte Carlo Confidence Intervals)"
    ],
    packages: "Python: statsmodels.tsa.api.VAR | prophet | R: demography"
  },
  {
    id: "spatial",
    icon: "🗺️",
    name: "空間計量與區域經濟學 (Spatial Econometrics & Regional Economics)",
    category: "地理空間統計",
    timeSpan: "1954–2024 (70年人口移動) / 1974–2024 (50年地價)",
    timeBadge: "70 年跨縣移動 · 空間自相關與溢出",
    coreMethods: ["莫蘭指數 (Moran's I)", "空間落後模型 (Spatial Lag / SAR)", "空間誤差模型 (SEM)", "地理加權迴歸 (GWR)", "空間引力模型 (Gravity Model)"],
    summary: "突破傳統計量「個體獨立同分佈」假設，量化地理鄰近性、跨區域空間溢出效應 (Spatial Spillover) 與城鄉磁吸力。",
    topics: [
      {
        title: "日本 900 萬戶空屋危機 (Akiya Crisis) 的跨鄰里空間溢出與周邊房價折價效應",
        hypothesis: "高空屋率具有顯著的正向空間自相關，並對相鄰市町村住宅地價產生負向空間溢出傳染。",
        model: "空間落後模型 (Spatial Autoregressive Model, SAR)",
        vars: "Y: 都道府縣住宅公示地價；X: 本地空屋率、空間落後項 W·Y (Spatial Lag)、建築著工戶數",
        dataset: "地價公示 (1974–2024) + 住宅・土地統計調查 (SSDSE-H)"
      },
      {
        title: "「東京單極集中」空間引力模型：距離摩擦係數衰減與青年遷徙向首都圈之結構性定量",
        hypothesis: "高教資源與實質薪資溢價對青年移居的拉力，隨與東京的新幹線行車時間呈顯著冪律衰減。",
        model: "擴展型空間引力模型 (Gravity Model with Distance Friction & Border Effects)",
        vars: "Y: i 縣遷入東京淨人數；X: 兩地平均工資比、人口規模乘積、行車時間距離",
        dataset: "住民基本台帳人口移動報告 (1954–2024)"
      },
      {
        title: "九州熊本台積電 (JASM) 設廠對菊陽町及鄰近市町村商業地價飆升的地理空間衰減梯度",
        hypothesis: "地價資本化效應隨距離新工廠直線半徑遞減，半徑 15 公里以內呈現顯著局部空間非平穩性。",
        model: "地理加權迴歸 (Geographically Weighted Regression, GWR)",
        vars: "Y: 地價漲幅率；X: 距晶圓廠直線距離、交流道距離、產業用地規劃比例",
        dataset: "地價公示・都道府縣地價調查 (1974–2024)"
      }
    ],
    pipeline: [
      "1. 構建空間權重矩陣 W (Queen / Rook / KNN / 距離倒數)",
      "2. 全域與局部空間自相關檢驗 (Global Moran's I & LISA Cluster Map)",
      "3. 拉格朗日乘數檢驗 (LM Lag vs LM Error Test 決定 SAR 或 SEM)",
      "4. 空間直接效應與間接溢出效應分解 (Direct & Spillover Effects)"
    ],
    packages: "Python: pysal, esda, mgwr, geopandas | R: spatialreg"
  },
  {
    id: "micro",
    icon: "🏠",
    name: "微觀計量與特徵定價模型 (Microeconometrics & Valuation)",
    category: "個體微觀計量",
    timeSpan: "1963–2024 (61年家計) / 1953–2024 (71年薪資)",
    timeBadge: "61 年家計財務 · 特徵評價分解",
    coreMethods: ["特徵價格模型 (Hedonic Pricing)", "Oaxaca-Blinder 薪資差異分解", "離散選擇模型 (Multinomial Logit / Probit)"],
    summary: "解構複合性產品（住宅、汽車）各項屬性的隱含邊際價格，或將性別/地域薪資差距分解為稟賦差距與未解釋偏誤。",
    topics: [
      {
        title: "都會區住宅每坪租金與交易價格之特徵隱含定價：屋齡、耐震工法與徒步時間邊際評價",
        hypothesis: "1981 年新耐震基準改制與車站徒步 5 分鐘以內屬性，在中古屋市場具備顯著且持久的隱含溢價。",
        model: "半對數特徵價格模型 (Semi-Log Hedonic Price Model)",
        vars: "Y: log(每坪住宅租金/地價)；X: 建築屋齡、新耐震虛擬變數、站點步行時間、專有面積",
        dataset: "住宅・土地統計調查 (1948–2023) + 地價公示"
      },
      {
        title: "日本性別薪資差距 (Gender Wage Gap)：個人稟賦生產力差距 vs 結構性歧視之數值解構",
        hypothesis: "男女薪資差距中，超過 50% 無法由教育水平、連續年資與職稱職務所解釋，存在結構性偏誤。",
        model: "Oaxaca-Blinder 薪資結構分解模型 (Oaxaca-Blinder Decomposition)",
        vars: "Y: log(實質月薪)；X: 年齡、學歷、持續勤續年數、役職等級、產業類別",
        dataset: "賃金構造基本統計調查 (1953–2024)"
      },
      {
        title: "實質通膨下日本家庭對高價國產食材 vs 平價進口食材的消費替代與品牌選擇彈性",
        hypothesis: "中低所得分位數家庭對進口牛肉與加工食品之價格需求交叉彈性顯著高於高所得家庭。",
        model: "多項式 Logit 離散選擇需求模型 (Multinomial Logit Demand System)",
        vars: "Y: 食品品項購買選擇；X: 相對物價比、每戶實質所得、主婦就業狀態",
        dataset: "家計調查 (1963–2024)"
      }
    ],
    pipeline: [
      "1. 建立非線性與對數規格化回歸方程 (Log-Linear Specification)",
      "2. 稟賦效應 (Endowment Effect) 與係數效應 (Coefficient Effect) 雙邊分解",
      "3. 邊際支付意願 (Marginal Willingness to Pay, MWTP) 換算",
      "4. 異質性穩健標準誤檢驗 (Huber-White Robust SEs)"
    ],
    packages: "Python: statsmodels.formula.api | pyblp | Stata: oaxaca"
  },
  {
    id: "multivariate",
    icon: "🧩",
    name: "多變量統計與區域綜合指數 (Multivariate Analysis & Regional Resilience)",
    category: "降維與綜合評價",
    timeSpan: "1975–2024 (50年 SSDSE 綜合面板)",
    timeBadge: "50 年綜合面板 · 1,500+ 面板指標",
    coreMethods: ["主成分分析 (PCA)", "探索性因子分析 (EFA)", "K-Means / 階層分群 (Clustering)", "TOPSIS 綜合優劣解排序"],
    summary: "從 SSDSE 體系跨 17 大領域、1,500+ 個高維指標中提取潛在驅動因子，建構無主觀偏見的都道府縣綜合評價指數與集群畫像。",
    topics: [
      {
        title: "日本 47 都道府縣「高齡社會韌性與脆弱度綜合指數 (Aging Vulnerability Index)」建構與動態排名",
        hypothesis: "單純依賴老齡化比例無法真實反映地方醫療與財政負荷，需結合多維指標降維建構綜合韌性指數。",
        model: "主成分分析與 TOPSIS 綜合評價模型 (PCA-TOPSIS)",
        vars: "指標群: 65歲以上人口率、百人病床數、財政力指數、一人戶比例、後期高齡者每人長照費用",
        dataset: "SSDSE-A/D/I/J 全領域指標 (1975–2024)"
      },
      {
        title: "地方自治體產業經濟結構特徵集群分類：製造核心型、文教公部門型與偏鄉高危險型",
        hypothesis: "47 都道府縣依製造出貨額、商業零售額、地方交付稅依存度可無監督劃分為 4 大鮮明集群。",
        model: "K-Means 聚類與 t-SNE 高維投影 (K-Means Clustering)",
        vars: "特徵矩陣: 製造業事業所比率、第3次產業指數、可住地面積人口密度、市町村合併率",
        dataset: "SSDSE-C/F/H 經濟指標 (1975–2024)"
      },
      {
        title: "國民幸福度與地方生活品質潛在因子提取：醫療可及性、居住寬敞度與育兒友善度維度解構",
        hypothesis: "居民主觀生活滿意度主要由「居住空間寬敞度」與「托育醫療可及性」兩大隱在公共因子決定。",
        model: "探索性因子分析 (Exploratory Factor Analysis, EFA)",
        vars: "指標群: 每戶居住室數、保育所待機兒童數、千人小兒科醫師數、公園人均面積",
        dataset: "SSDSE-E/H/I 社會體系 (1975–2024)"
      }
    ],
    pipeline: [
      "1. 數據特徵標準化 (Z-Score / MinMax Normalization)",
      "2. 碎石圖檢驗與方差解釋率分析 (Scree Plot & Kaiser Criterion Eigenvalue > 1)",
      "3. 最大變異法旋轉 (Varimax Rotation) 與因子載荷矩陣解碼",
      "4. 集群輪廓係數 (Silhouette Score) 檢驗最優分群數 K"
    ],
    packages: "Python: scikit-learn.decomposition.PCA | sklearn.cluster | factor_analyzer"
  },
  {
    id: "causal_ml",
    icon: "🤖",
    name: "因果機器學習與異質性處置 (Causal Machine Learning & Heterogeneous Treatment)",
    category: "AI 與現代因果推論",
    timeSpan: "1975–2024 (50年全領域高維面板)",
    timeBadge: "50 年高維面板 · 非線性特徵歸因",
    coreMethods: ["雙重機器學習 (Double ML / DML)", "因果森林 (Causal Forest)", "XGBoost / LightGBM + SHAP", "廣義隨機森林 (GRF)"],
    summary: "結合現代機器學習高維預測優勢與計量因果推斷，估計個體條件平均處置效果 (CATE)，識別對政策最敏感的地域特徵群。",
    topics: [
      {
        title: "「地方創生交付金」政策效益的條件平均處置效果 (CATE)：哪些人口結構特徵的縣市補助成效最高？",
        hypothesis: "傳統回歸容易掩蓋政策效果的個體異質性；因果森林能精準識別政策回報率最高的縣市特徵組合。",
        model: "因果森林雙重殘差化模型 (Causal Forest DML)",
        vars: "處置變數 T: 地方創生補助金額；產出 Y: 青年淨流入率；高維混雜特徵 X: 100+ 經濟社會面板指標",
        dataset: "SSDSE 高維都道府縣指標集 (1975–2024)"
      },
      {
        title: "地方自治體財政破產危機非線性早期預警模型與關鍵驅動特徵 SHAP 貢獻度分析",
        hypothesis: "非線性樹模型預測財政危機之受試者工作特徵曲線 (AUC) 顯著優於傳統 Logistic 模型，SHAP 揭露非線性臨界門檻。",
        model: "XGBoost 早期預警與 SHAP 特徵重要度解構",
        vars: "標籤 Y: 實質赤字比率超標預警；特徵 X: 地方交付稅比率、公債費負擔比率、人口流失速度、稅收彈性",
        dataset: "地方財政統計 (SSDSE-D, 1975–2024)"
      },
      {
        title: "數位轉型 (DX) 與綠色能源投資對地方製造業附加價值率提升的異質性效應估計",
        hypothesis: "在控制高維混雜變數下，數位通訊普及率對高附加價值產出具有顯著正向因果淨效應。",
        model: "雙重機器學習 (Double Machine Learning, Chernozhukov et al.)",
        vars: "處置 T: 5G/光纖覆蓋率；產出 Y: 製造業附加價值率；控制 X: 高維產業特徵",
        dataset: "SSDSE-C/F 商業工業指標 (1975–2024)"
      }
    ],
    pipeline: [
      "1. 高維特徵工程與交叉擬合 (K-Fold Cross-Fitting)",
      "2. 處置與產出雙重殘差化 (Neyman Orthogonal Score Residualization)",
      "3. 條件平均處置效果 (CATE) 決策樹分群與異質性檢驗",
      "4. SHAP 蜂窩圖與偏依賴圖 (Partial Dependence Plots) 解釋"
    ],
    packages: "Python: econml.dml.CausalForestDML | shap | xgboost | lightgbm"
  }
];

// =========================================================================
// 3. 官方 17 大統計領域分類資料庫 (Categories Data)
// =========================================================================
const categoriesData = [
  {
    code: "02",
    tagGroup: "demographics",
    name: "人口・世帶 (Population & Households)",
    ministry: "總務省統計局",
    statsField: "02",
    tableId: "0000010101 (社會・人口體系 A)",
    timeSpan: "1920–2020 (百年普查) / 1950–2024 (74年推計)",
    scope: "國勢調查（全日本普查）、人口推計（月度/年度）、住民基本台帳人口移動報告、單身與核心家庭世帶構成、在留外國人人口。",
    researchTopics: [
      {
        title: "「地方消滅」危機指數模型：各都道府縣 2040 年人口自然萎縮率預測",
        method: "世代存活法 (Cohort-Component)"
      },
      {
        title: "東京單極集中（Tokyo Centralization）的磁吸力與青年移住淨流入分析",
        method: "引力模型 (Gravity Model)"
      },
      {
        title: "高齡單身世帶急增對地方公共服務與社區安照的衝擊量化",
        method: "多元線性迴歸 (MLR)"
      },
      {
        title: "外籍勞工與留學生地域分佈對製造業與農業缺工的補償效應",
        method: "差分法 (DID)"
      }
    ]
  },
  {
    code: "03",
    tagGroup: "demographics",
    name: "勞動・賃金 (Labor & Wages)",
    ministry: "厚生勞動省 / 總務省",
    statsField: "03",
    tableId: "0000010106 (社會・人口體系 F)",
    timeSpan: "1953–2024 (71年連續時序)",
    scope: "每月勤勞統計調查、賃金構造基本統計調查、勞動力調查（失業率）、職業安定業務統計（有效求人倍率）、每週工時、非正規雇用比例。",
    researchTopics: [
      {
        title: "「春鬥」加薪潮下，中小企業實質薪資與通膨率之滯後效應分析",
        method: "向量自我迴歸 (VAR)"
      },
      {
        title: "性別薪資差距（Gender Wage Gap）的行業別與年資別解構研究",
        method: "Oaxaca-Blinder 分解"
      },
      {
        title: "有效求人倍率與失業率的 Beveridge 曲線移位：日本勞動市場結構性缺工",
        method: "貝佛里奇曲線分析"
      },
      {
        title: "高齡就業（65-74歲再雇用）政策對養老金負擔的紓解效益評估",
        method: "準實驗設計"
      }
    ]
  },
  {
    code: "13",
    tagGroup: "economy",
    name: "物價・地價 (Prices & Land Value)",
    ministry: "總務省統計局 / 國土交通省",
    statsField: "13",
    tableId: "0003427113 (消費者物價指數 CPI)",
    timeSpan: "1970–2024 (54年 CPI) / 1974–2024 (50年地價)",
    scope: "消費者物價指數 (CPI 各品項細項)、地價公示、都道府縣地價調查、企業物價指數、市街地價格指數。",
    researchTopics: [
      {
        title: "進口能源與食品通膨對不同收入分位數家庭之「生活成本差異」研究",
        method: "微觀計量經濟模型"
      },
      {
        title: "日圓歷史性貶值對日本國內各都市住宅與商業地價的資本重估效應",
        method: "空間計量經濟學 (Spatial Lag)"
      },
      {
        title: "東京 23 區新成屋每坪破億日幣背後的資金結構與海外投資客驅動分析",
        method: "特徵價格法 (Hedonic Pricing)"
      }
    ]
  },
  {
    code: "07",
    tagGroup: "economy",
    name: "企業・家計・經濟 (Business & Economy)",
    ministry: "內閣府 / 總務省 / 財務省",
    statsField: "07",
    tableId: "0000010103 (社會・人口體系 C)",
    timeSpan: "1963–2024 (61年家計調查) / 1975–2024 (50年SSDSE)",
    scope: "國民經濟計算 (SNA/GDP)、家計調查（每戶月均收支與儲蓄）、法人企業統計調查、景氣動向指數、民營企業設備投資調查。",
    researchTopics: [
      {
        title: "日本企業內部現金保留金（留保金）累積與薪資分紅脫節的成因研究",
        method: "面板數據分析 (Panel Data)"
      },
      {
        title: "高儲蓄率神話破滅？日本老齡化如何推動家計儲蓄率下探臨界點",
        method: "生命週期假說實證"
      },
      {
        title: "各都道府縣實質「縣民所得」與生活滿意度關聯度分析",
        method: "主成分分析 (PCA)"
      }
    ]
  },
  {
    code: "06",
    tagGroup: "economy",
    name: "商業・服務業 (Commerce & Services)",
    ministry: "經濟產業省",
    statsField: "06",
    tableId: "0000010103 (商業統計指標)",
    timeSpan: "1951–2021 (70年商業普查)",
    scope: "商業統計調查（批發與零售業）、第3次產業活動指數、超商/百貨/連鎖超市月度銷售額、電子商務規模 (EC)。",
    researchTopics: [
      {
        title: "Amazon 與樂天電商崛起對地方實體百貨與商店街的「創造性破壞」研究",
        method: "差分事件研究法"
      },
      {
        title: "便利商店每平方公尺營收密度與都會區人口夜間/日間流動率關係",
        method: "地理加權迴歸 (GWR)"
      },
      {
        title: "無人自助結帳技術在連鎖零售門市普及率與勞力成本替代曲線",
        method: "技術擴散 S 曲線"
      }
    ]
  },
  {
    code: "08",
    tagGroup: "housing",
    name: "住宅・土地・建設 (Housing & Construction)",
    ministry: "總務省 / 國土交通省",
    statsField: "08",
    tableId: "0000010108 (社會・人口體系 H)",
    timeSpan: "1948–2023 (75年住宅調查)",
    scope: "住宅・土地統計調查（5年一次）、全日本空屋率（空き家）、建築著工統計（新屋開工戶數）、住宅每坪租金與持有率。",
    researchTopics: [
      {
        title: "日本 900 萬戶「空屋危機 (Akiya Crisis)」的地理擴散路徑與房價折價率",
        method: "空間自相關 (Moran's I)"
      },
      {
        title: "租金報酬率 (Cap Rate) 與都道府縣空屋風險溢酬定價模型",
        method: "資本資產定價 (CAPM)"
      },
      {
        title: "繼承稅法規改制對日本高齡者生前贈與住宅與拆除老舊木造屋之誘因評估",
        method: "斷點回歸設計 (RDD)"
      }
    ]
  },
  {
    code: "10",
    tagGroup: "housing",
    name: "運輸・觀光 (Transport & Tourism)",
    ministry: "國土交通省觀光廳 / 鐵道局",
    statsField: "10",
    tableId: "0002160001 (訪日外國人旅行消費動向)",
    timeSpan: "2010–2024 (訪日觀光數據)",
    scope: "訪日外國人消費動向調查、宿泊旅行統計調查（各縣客房稼動率）、幹線鐵道客運量、高速公路交通量、航空班機載客率。",
    researchTopics: [
      {
        title: "後疫情時代各國旅客（台灣、歐美、陸客）在日消費偏好與免稅貢獻對比",
        method: "聚類分析 (K-Means)"
      },
      {
        title: "京都、富士山周邊「過度觀光 (Overtourism)」對當地居民生活品質的負面外部性量化",
        method: "特徵分析與問卷比對"
      },
      {
        title: "地方私鐵與 JR 地方路線廢線對沿線小鎮人口流失的加速效應",
        method: "綜合控制法 (Synthetic Control)"
      }
    ]
  },
  {
    code: "15",
    tagGroup: "welfare",
    name: "社會保障・衛生 (Social Security & Health)",
    ministry: "厚生勞動省",
    statsField: "15",
    tableId: "0000010110 (社會・人口體系 J / I)",
    timeSpan: "1975–2024 (50年社會保障體系)",
    scope: "國民醫療費、介護保險（長照）給付狀況、生活保護受給世帶、平均壽命與健康壽命、死因分析（癌症、心血管、衰老）。",
    researchTopics: [
      {
        title: "各都道府縣「健康壽命 vs 平均壽命」差距分析：長照失能時間之區域不平等",
        method: "存活分析 (Survival Analysis)"
      },
      {
        title: "高齡長照保險費各市町村費率差距與地方財政破產風險關聯",
        method: "分位數迴歸 (Quantile Reg)"
      },
      {
        title: "醫師與病床地理分佈不均度（Gini係數）對偏鄉急性病致死率之影響",
        method: "吉尼係數與空間分析"
      }
    ]
  },
  {
    code: "16",
    tagGroup: "welfare",
    name: "教育・文化・體育 (Education & Culture)",
    ministry: "文部科學省",
    statsField: "16",
    tableId: "0000010105 (社會・人口體系 E)",
    timeSpan: "1975–2024 (50年學校基本調查)",
    scope: "學校基本調查（幼兒園至大學各級學生數與升學率）、公私立教育費用支出、圖書館藏書數、文化遺產保存數。",
    researchTopics: [
      {
        title: "少子化下「地方私立大學招募不足（定員割れ）」與倒閉退場風險預測",
        method: "Logistic 預測模型"
      },
      {
        title: "家庭年所得對兒童課外補習（塾）支出與名校錄取率的代際傳遞研究",
        method: "結構方程模型 (SEM)"
      },
      {
        title: "公共圖書館與文化設施密度對地方市民終身學習參與率之提升效果",
        method: "多元變異數分析"
      }
    ]
  },
  {
    code: "01",
    tagGroup: "tech",
    name: "國土・氣象 (Land & Climate)",
    ministry: "國土交通省氣象廳 / 國土地理院",
    statsField: "01",
    tableId: "0000010102 (社會・人口體系 B)",
    timeSpan: "1975–2024 (50年連續氣象與國土)",
    scope: "都道府縣土地面積、可住地面積比率、氣溫（最高/最低/年均）、降水量、日照時數、積雪深度、自然公園面積。",
    researchTopics: [
      {
        title: "日本半世紀暖化軌跡：各地區夏日「猛暑日（35℃以上）」日數增長與中暑急救關聯",
        method: "時間序列趨勢檢驗"
      },
      {
        title: "降雪量變遷對日本豪雪地帶（新潟、北海道）觀光雪場經濟與除雪預算的雙向衝擊",
        method: "計量迴歸分析"
      }
    ]
  },
  {
    code: "09",
    tagGroup: "tech",
    name: "能源・水 (Energy & Water)",
    ministry: "資源能源廳 / 經產省",
    statsField: "09",
    tableId: "0003428901 (能源消費統計)",
    timeSpan: "1975–2024 (50年能源消費數據)",
    scope: "電力銷售量（家庭用/工業用）、太陽光及風力發電併網裝機容量、原油與液化天然氣消耗、水庫蓄水量與水道普及率。",
    researchTopics: [
      {
        title: "311 福島核電停運後，日本各電力公司電價飆升對高耗能製造業外移之衝擊",
        method: "斷點迴歸分析"
      },
      {
        title: "太陽光發電在九州等日照豐沛縣市的發電過剩與「出力制御（棄光）」經濟損失評估",
        method: "最佳化邊界分析"
      }
    ]
  },
  {
    code: "11",
    tagGroup: "tech",
    name: "資訊通信・科技 (IT & Science)",
    ministry: "總務省情報通信局",
    statsField: "11",
    tableId: "0003428800 (情報通信白書數據)",
    timeSpan: "1990–2024 (資通訊發展時序)",
    scope: "企業與民間研究開發費 (R&D)、專利件數、光纖與 5G 基地台覆蓋率、家庭網路利用率、企業遠距辦公 (Telework) 比例。",
    researchTopics: [
      {
        title: "日本製造業 R&D 投資強度與專利國際競爭力在 2000-2024 年之相對衰退實證",
        method: "DEA 資料包絡分析"
      },
      {
        title: "後疫情時代企業維持「遠距混合辦公」的決定因子：產業別與數位基礎建設的門檻",
        method: "Probit 回歸模型"
      }
    ]
  },
  {
    code: "12",
    tagGroup: "economy",
    name: "財政・金融 (Public Finance & Banking)",
    ministry: "財務省 / 總務省自治財政局",
    statsField: "12",
    tableId: "0000010104 (社會・人口體系 D)",
    timeSpan: "1975–2024 (50年地方財政面板)",
    scope: "地方財政健全化判斷比率（實質赤字比率、公債費負擔率）、地方稅收、地方交付稅依存度、銀行存款與放款餘額。",
    researchTopics: [
      {
        title: "地方自治體「財政破產預警模型」：夕張市之後，哪些市町村正逼近赤字紅線？",
        method: "Altman Z-Score 變形"
      },
      {
        title: "日本央行結束負利率政策後，地方銀行利差修復與不良債權之敏感度分析",
        method: "壓力測試 (Stress Test)"
      }
    ]
  },
  {
    code: "14",
    tagGroup: "welfare",
    name: "司法・安全・環境 (Justice & Safety)",
    ministry: "警察廳 / 消防廳 / 環境省",
    statsField: "14",
    tableId: "0000010111 (社會・人口體系 K)",
    timeSpan: "1975–2024 (50年治安與安全面板)",
    scope: "刑法犯認知件數與破案率、交通事故發生件數與傷亡數、火災件數、工業廢棄物排出量、溫室氣體排放量。",
    researchTopics: [
      {
        title: "「世界最安全國家」真相：日本刑法犯持續下降與高齡特殊詐欺（電信詐騙）飆升的犯罪型態轉移",
        method: "空間時間點過程分析"
      },
      {
        title: "75歲以上「後期高齡者」自主繳回駕照（運転免許返納）政策對交通事故降低之成效評估",
        method: "雙重差分法 (DID)"
      }
    ]
  },
  {
    code: "04",
    tagGroup: "economy",
    name: "農林水產業 (Agriculture & Forestry)",
    ministry: "農林水產省",
    statsField: "04",
    tableId: "0000010103 (農林業 Census)",
    timeSpan: "1950–2020 (農林業普查)",
    scope: "農家戶數與農業就業人口、耕地面積與廢耕地面積、各農產品收穫量、漁業水產捕獲量、糧食自給率。",
    researchTopics: [
      {
        title: "日本農業就業人口平均年齡突破 68 歲：耕地放棄率（休耕廢耕）擴散與糧食安全韌性",
        method: "空間滯後模型"
      },
      {
        title: "智慧農業（無人機、IoT灌溉）補助政策對單位耕地產值提升之因果推斷",
        method: "傾向評分匹配 (PSM)"
      }
    ]
  },
  {
    code: "05",
    tagGroup: "economy",
    name: "礦工業 (Mining & Manufacturing)",
    ministry: "經濟產業省",
    statsField: "05",
    tableId: "0000010103 (工業統計調查)",
    timeSpan: "1951–2021 (70年工業普查)",
    scope: "工業統計調查、製造業事業者數與從業者數、製造品出貨額、附加價值額、庫存率指數。",
    researchTopics: [
      {
        title: "九州熊本台積電 (JASM) 效應：半導體上下游供應鏈在九州的設備投資與出貨倍增",
        method: "投入產出分析 (I-O Model)"
      },
      {
        title: "日本汽車產業電動化 (EV) 轉型對傳統內燃機零件代工聚落之衝擊量化",
        method: "產業鏈暴露度評估"
      }
    ]
  },
  {
    code: "17",
    tagGroup: "demographics",
    name: "行政・其他 (Administration & Governance)",
    ministry: "總務省行政管理局",
    statsField: "17",
    tableId: "0000010104 (行政基盤指標)",
    timeSpan: "1975–2024 (50年行政公務體系)",
    scope: "地方公務員員額、行政數位化（DX）線上申請普及率、國政與地方公職選舉投票率、議會費支出。",
    researchTopics: [
      {
        title: "「銀髮民主 (Silver Democracy)」成因：高齡選民投票率遠高於青年對地方預算編列之扭曲度",
        method: "公共選擇政治經濟模型"
      },
      {
        title: "地方公務員精簡與市町村合併（平成大合併）對公共服務可及性之後續評估",
        method: "長期追蹤研究"
      }
    ]
  }
];

// =========================================================================
// 4. 視角切換器與互動渲染邏輯 (UI Logic)
// =========================================================================
let currentView = 'domain'; // 'domain', 'method', 'horizon', 'all'
let activeTag = 'all';

function switchView(view) {
  currentView = view;
  document.querySelectorAll('.view-tab-btn').forEach(btn => btn.classList.remove('active'));
  
  if (view === 'domain') document.getElementById('tabDomain').classList.add('active');
  if (view === 'method') document.getElementById('tabMethod').classList.add('active');
  if (view === 'horizon') document.getElementById('tabHorizon').classList.add('active');
  if (view === 'all') document.getElementById('tabAll').classList.add('active');

  const domainBlock = document.getElementById('domainSectionBlock');
  const methodBlock = document.getElementById('methodSectionBlock');
  const horizonBlock = document.getElementById('horizonSectionBlock');

  if (view === 'domain') {
    domainBlock.style.display = 'block';
    methodBlock.style.display = 'none';
    horizonBlock.style.display = 'none';
  } else if (view === 'method') {
    domainBlock.style.display = 'none';
    methodBlock.style.display = 'block';
    horizonBlock.style.display = 'none';
  } else if (view === 'horizon') {
    domainBlock.style.display = 'none';
    methodBlock.style.display = 'none';
    horizonBlock.style.display = 'block';
  } else {
    // all
    domainBlock.style.display = 'block';
    methodBlock.style.display = 'block';
    horizonBlock.style.display = 'block';
  }

  onSearchInput();
}

function setFilter(evt, tag) {
  document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
  evt.currentTarget.classList.add('active');
  activeTag = tag;
  onSearchInput();
}

function onSearchInput() {
  const keyword = document.getElementById('searchInput').value.trim().toLowerCase();

  // 1. 篩選 Domain 卡片
  const filteredDomains = categoriesData.filter(item => {
    const matchTag = (activeTag === 'all') || (item.tagGroup === activeTag);
    if (!matchTag) return false;
    if (!keyword) return true;

    const inName = item.name.toLowerCase().includes(keyword);
    const inMinistry = item.ministry.toLowerCase().includes(keyword);
    const inScope = item.scope.toLowerCase().includes(keyword);
    const inTime = item.timeSpan.toLowerCase().includes(keyword);
    const inTopics = item.researchTopics.some(t => t.title.toLowerCase().includes(keyword) || t.method.toLowerCase().includes(keyword));
    return inName || inMinistry || inScope || inTime || inTopics;
  });
  renderDomainCards(filteredDomains);

  // 2. 篩選 Method 卡片
  const filteredMethods = methodsData.filter(m => {
    if (!keyword) return true;
    const inName = m.name.toLowerCase().includes(keyword);
    const inCat = m.category.toLowerCase().includes(keyword);
    const inSummary = m.summary.toLowerCase().includes(keyword);
    const inCore = m.coreMethods.some(c => c.toLowerCase().includes(keyword));
    const inTime = m.timeSpan.toLowerCase().includes(keyword);
    const inTopics = m.topics.some(t => 
      t.title.toLowerCase().includes(keyword) || 
      t.hypothesis.toLowerCase().includes(keyword) || 
      t.model.toLowerCase().includes(keyword) || 
      t.vars.toLowerCase().includes(keyword)
    );
    return inName || inCat || inSummary || inCore || inTime || inTopics;
  });
  renderMethodCards(filteredMethods);

  // 3. 篩選 Horizons 表格
  const filteredHorizons = horizonsData.filter(h => {
    if (!keyword) return true;
    const inName = h.name.toLowerCase().includes(keyword);
    const inMinistry = h.ministry.toLowerCase().includes(keyword);
    const inModels = h.models.toLowerCase().includes(keyword);
    const inFreq = h.frequency.toLowerCase().includes(keyword);
    const inYears = String(h.years).includes(keyword) || String(h.startYear).includes(keyword) || String(h.endYear).includes(keyword);
    return inName || inMinistry || inModels || inFreq || inYears;
  });
  renderHorizonTableAndTimeline(filteredHorizons);
}

// 渲染時間軸與規格表
function renderHorizonTableAndTimeline(data) {
  const barsContainer = document.getElementById('timelineBarsContainer');
  const tableBody = document.getElementById('horizonTableBody');
  barsContainer.innerHTML = '';
  tableBody.innerHTML = '';

  const minYear = 1920;
  const maxYear = 2024;
  const totalRange = maxYear - minYear; // 104 年

  data.forEach(item => {
    // 1. 繪製時間長條
    const leftPct = ((item.startYear - minYear) / totalRange) * 100;
    const widthPct = Math.max(((item.endYear - item.startYear) / totalRange) * 100, 3);

    const barRow = document.createElement('div');
    barRow.className = 'timeline-row';
    barRow.innerHTML = `
      <div class="timeline-label" title="${item.name}">${item.name}</div>
      <div class="timeline-bar-bg">
        <div class="timeline-bar-fill" style="left: ${leftPct.toFixed(1)}%; width: ${widthPct.toFixed(1)}%; background: ${item.color};">
          <span>${item.startYear} ~ ${item.endYear} (${item.years}年)</span>
        </div>
      </div>
      <div class="timeline-span-badge">${item.years} 年跨度</div>
    `;
    barsContainer.appendChild(barRow);

    // 2. 注入表格行
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <strong>${item.name}</strong><br/>
        <span style="font-size: 11px; color: var(--ink-muted);">${item.ministry}</span>
      </td>
      <td>
        <span class="time-chip">${item.startYear} ～ ${item.endYear}</span>
      </td>
      <td>
        <span class="duration-chip">${item.years} 年連續</span>
      </td>
      <td style="color: var(--ink-secondary); font-size: 12.5px;">${item.frequency}</td>
      <td style="color: var(--ink-secondary); font-size: 12.5px;">${item.granularity}</td>
      <td style="max-width: 320px; line-height: 1.45; font-size: 12.5px;">
        <span style="color: var(--purple-accent); font-weight: 600;">✦ ${item.models}</span>
      </td>
      <td>
        <code style="background: var(--bg-subtle); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 11.5px;">${item.tableId}</code>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

// 渲染研究方法論卡片
function renderMethodCards(data) {
  const container = document.getElementById('methodContainer');
  container.innerHTML = '';
  document.getElementById('methodResultsCount').innerText = `共篩選出 ${data.length} 大研究方法論體系`;

  data.forEach(m => {
    const card = document.createElement('div');
    card.className = 'method-card';

    const corePills = m.coreMethods.map(c => `<span class="core-algo-pill">${c}</span>`).join('');
    
    const topicsHtml = m.topics.map((t, idx) => `
      <div class="method-topic-item">
        <div class="topic-item-title">${idx + 1}. ${t.title}</div>
        <div class="topic-item-meta">
          <div>🎯 <strong>理論假說：</strong>${t.hypothesis}</div>
          <div>📊 <strong>模型與變數：</strong>${t.vars}</div>
          <div>🏛️ <strong>推薦數據庫：</strong><span style="color: var(--metro-blue); font-weight: 600;">${t.dataset}</span></div>
          <span class="topic-tag-model">推薦模型: ${t.model}</span>
        </div>
      </div>
    `).join('');

    const pipelineHtml = m.pipeline.map(step => `<li>✦ ${step}</li>`).join('');

    card.innerHTML = `
      <div>
        <div class="method-card-header">
          <div class="method-family-title">
            <span>${m.icon}</span>
            <span>${m.name}</span>
          </div>
          <span class="method-cat-badge">${m.category}</span>
        </div>

        <div class="method-time-horizon-banner">
          <span class="method-time-badge-bold">⏳ 推薦時間跨度</span>
          <span><strong>${m.timeSpan}</strong>（${m.timeBadge}）</span>
        </div>

        <div style="font-size: 13px; color: var(--ink-secondary); margin-bottom: 12px; line-height: 1.5;">
          ${m.summary}
        </div>

        <div class="core-algo-group">
          ${corePills}
        </div>

        <div class="method-topics-box">
          <div style="font-size: 12.5px; font-weight: 700; color: var(--purple-accent); margin-bottom: 8px; text-transform: uppercase;">
            💡 代表性學術題目與變數設定：
          </div>
          ${topicsHtml}
        </div>

        <div class="pipeline-steps-box">
          <div class="pipeline-title">⚡ 推薦實作分析管線 (Pipeline)：</div>
          <ul class="pipeline-list">
            ${pipelineHtml}
          </ul>
        </div>
      </div>

      <div class="method-card-footer">
        <span class="pkg-recommend">📦 ${m.packages}</span>
        <button class="quick-api-btn" onclick="copyMethodPlan('${m.id}')" style="border-color: var(--purple-accent); color: var(--purple-accent);">複製研究設定與變數</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// 渲染領域卡片
function renderDomainCards(data) {
  const container = document.getElementById('categoryContainer');
  container.innerHTML = '';
  document.getElementById('domainResultsCount').innerText = `共篩選出 ${data.length} 個領域分類`;

  data.forEach(item => {
    const card = document.createElement('div');
    card.className = 'cat-card';
    
    let topicsHtml = item.researchTopics.map(t => `
      <li class="research-idea-item">
        <strong>${t.title}</strong>
        <span class="research-method-tag">${t.method}</span>
      </li>
    `).join('');

    card.innerHTML = `
      <div>
        <div class="cat-header">
          <div>
            <div class="cat-name">${item.name}</div>
            <div class="cat-ministry">主管機關：${item.ministry}</div>
            <div class="cat-time-badge">⏳ 時間跨度：${item.timeSpan}</div>
          </div>
          <span class="cat-code-badge">分野代碼 ${item.code}</span>
        </div>

        <div class="cat-data-scope">
          <strong>📊 包含數據範疇：</strong><br/>
          ${item.scope}
        </div>

        <div class="research-block">
          <div class="research-title-label">💡 可執行的代表性研究與商業分析切角：</div>
          <ul class="research-idea-list">
            ${topicsHtml}
          </ul>
        </div>
      </div>

      <div class="cat-footer">
        <span class="api-hint">推薦表單: <code>${item.tableId.split(' ')[0]}</code></span>
        <button class="quick-api-btn" onclick="copyApiQuery('${item.code}', '${item.tableId.split(' ')[0]}')">複製 API 呼叫參數</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function copyApiQuery(code, tableId) {
  const query = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList?appId=d96194b7b3219075b1041948fddc842cfead7477&statsField=${code}&limit=10`;
  navigator.clipboard.writeText(query).then(() => {
    alert(`已複製該領域的 e-Stat API 查詢網址：\n${query}`);
  });
}

function copyMethodPlan(methodId) {
  const m = methodsData.find(item => item.id === methodId);
  if (!m) return;
  const text = `【研究方法】${m.name}\n【資料時間跨度】${m.timeSpan}\n【核心演算法】${m.coreMethods.join(', ')}\n【分析管線】\n${m.pipeline.join('\n')}\n【推薦套件】${m.packages}`;
  navigator.clipboard.writeText(text).then(() => {
    alert(`已複製 ${m.name} 的研究設定與實作管線！`);
  });
}

// 頁面初始化
window.addEventListener('DOMContentLoaded', () => {
  renderHorizonTableAndTimeline(horizonsData);
  renderMethodCards(methodsData);
  renderDomainCards(categoriesData);
  switchView('domain'); // 預設依 17 領域，同時支援無縫切換
});
</script>
</body>
</html>"""

with open('estat_catalog_and_research_guide.html', 'w', encoding='utf-8') as f:
    f.write(html_template)

print("Successfully wrote updated estat_catalog_and_research_guide.html")
