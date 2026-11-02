# -*- coding: utf-8 -*-
"""
Generate student_data_analyst_workflow.html and data_analysis.html
Redesigned with Hallmark 'dose' theme (modern-minimal / light 97.6 88 / committed).
Strictly compliant with Hallmark Floor and Dose theme tokens.
"""

html_content = """<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>資料分析實戰工作流：從官方數據到 Tableau-like 儀表板</title>
  <meta name="description" content="11/05 實戰工作坊資料分析專案手冊：使用 Antigravity 代理人環境，串接日本 e-Stat 官方 API，調用 data-analyst 技能清洗資料，並在 Data Atoms 打造類似 Tableau 的互動儀表板。">

  <!-- Hallmark dose theme Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@700&family=Instrument+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">

  <style>
/* hallmark: dose / modern-minimal / light 97.6 88 / committed */
:root {
  --color-paper: oklch(97.6% 0.011 88);
  --color-paper-2: oklch(96.5% 0.02 160);
  --color-paper-3: oklch(93% 0.036 160);
  --color-ink: oklch(21% 0.025 170);
  --color-ink-2: oklch(31% 0.02 170);
  --color-muted: oklch(49% 0.024 165);
  --color-rule: oklch(86.5% 0.022 140);
  --color-accent: oklch(50% 0.13 160);
  --color-accent-deep: oklch(42% 0.11 162);
  --color-accent-soft: oklch(88% 0.08 160);
  --color-accent-ink: oklch(99% 0.006 160);
  --color-focus: oklch(45% 0.14 160);

  /* Pill organiser plastic tints */
  --p-mon: oklch(85% 0.052 22);
  --p-tue: oklch(87.5% 0.058 64);
  --p-wed: oklch(91.5% 0.064 98);
  --p-thu: oklch(86.5% 0.075 160);
  --p-fri: oklch(87% 0.048 210);
  --p-sat: oklch(84% 0.045 270);
  --p-sun: oklch(84% 0.048 322);

  --light: oklch(99.4% 0.016 84);
  --glint: oklch(100% 0 0);

  --font-display: "Schibsted Grotesk", "Noto Sans TC", ui-sans-serif, sans-serif;
  --font-body: "Instrument Sans", "Noto Sans TC", ui-sans-serif, sans-serif;
  --font-outlier: "DM Mono", ui-monospace, monospace;

  --radius-card: 14px;
  --radius-input: 10px;
  --radius-pill: 999px;
  --rule-hair: 1px;

  --shadow-card: 0 1px 2px oklch(30% 0.03 165 / 0.08), 0 24px 48px -24px oklch(40% 0.08 165 / 0.35);
  --shadow-lift: 0 1px 1px oklch(30% 0.03 165 / 0.10), 8px 18px 28px -14px oklch(36% 0.06 165 / 0.32), 18px 40px 60px -30px oklch(40% 0.08 165 / 0.30);
  --tracking-display: -0.03em;
  --display-weight: 700;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  overflow-x: clip;
}

body {
  font-family: var(--font-body);
  background-color: var(--color-paper);
  color: var(--color-ink);
  line-height: 1.55;
  padding: 0 0 100px 0;
  -webkit-font-smoothing: antialiased;
}

/* Typography per Dose rules */
h1, h2, h3 {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: var(--tracking-display);
  line-height: 1.05;
  color: var(--color-ink);
}

.mono-label {
  font-family: var(--font-outlier);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: var(--color-muted);
}

/* Container */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Focus states */
a:focus-visible, button:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

/* Moulded plastic buttons */
.btn {
  height: 48px;
  padding: 0 20px;
  border: 0;
  border-radius: var(--radius-input);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: inset 0 1px 0 var(--glint), 0 0 0 1px var(--color-rule), 0 3px 0 var(--color-rule);
  transition: transform 0.1s ease, box-shadow 0.1s ease;
  user-select: none;
}
.btn:active {
  transform: translateY(3px);
  box-shadow: inset 0 1px 0 var(--glint), 0 0 0 1px var(--color-rule), 0 0 0 var(--color-rule);
}
.btn--primary {
  background: linear-gradient(var(--color-accent), var(--color-accent-deep));
  color: var(--color-accent-ink);
  box-shadow: 0 0 0 1px var(--color-accent-deep), 0 3px 0 var(--color-accent-deep);
}
.btn--primary:active {
  transform: translateY(3px);
  box-shadow: 0 0 0 1px var(--color-accent-deep), 0 0 0 var(--color-accent-deep);
}
.btn--clear {
  background: var(--color-paper-2);
  color: var(--color-ink);
}
.btn--sm {
  height: 36px;
  padding: 0 14px;
  font-size: 12.5px;
  border-radius: 8px;
}

/* Translucent Plastic Compartments */
.plastic-tray {
  position: relative;
  border-radius: var(--radius-card);
  background: linear-gradient(color-mix(in oklab, var(--glint) 32%, transparent), transparent 18%), color-mix(in oklab, var(--t, var(--p-thu)) 60%, transparent);
  box-shadow: inset 0 1.5px 0 var(--glint), inset 0 -24px 36px -28px color-mix(in oklab, var(--t, var(--p-thu)) 45%, var(--color-ink)), var(--shadow-card);
  border: 1px solid var(--color-rule);
  padding: 24px;
  margin-bottom: 24px;
}

/* Pharmacy Label Style (Paper on Plastic) */
.pharmacy-label {
  background: #ffffff;
  border: 1px solid var(--color-rule);
  border-radius: 10px;
  padding: 20px 24px;
  box-shadow: var(--shadow-card);
  position: relative;
}
.tear-stub {
  border-top: 1px dashed var(--color-rule);
  margin-top: 16px;
  padding-top: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

/* Double-ring Green Pharmacy Stamp */
.stamp-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 2px solid var(--color-accent);
  outline: 1px solid var(--color-accent);
  outline-offset: 2px;
  color: var(--color-accent-deep);
  font-family: var(--font-outlier);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 2px 10px;
  border-radius: 4px;
  transform: rotate(-1.5deg);
  background: var(--color-accent-soft);
}

/* Top Sequential Step Strip */
.step-nav-bar {
  background: var(--color-ink);
  color: var(--color-paper);
  padding: 12px 24px;
  border-bottom: 1px solid var(--color-rule);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
}
.step-nav-pills {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.step-pill {
  color: var(--color-paper);
  background: color-mix(in oklab, var(--color-paper) 12%, transparent);
  border: 1px solid color-mix(in oklab, var(--color-paper) 20%, transparent);
  padding: 4px 10px;
  border-radius: 6px;
  text-decoration: none;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: background 0.15s ease;
}
.step-pill:hover {
  background: color-mix(in oklab, var(--color-paper) 25%, transparent);
}
.step-pill.active {
  background: var(--color-accent);
  color: #ffffff;
  border-color: var(--color-accent);
  font-weight: 700;
}

/* Hero Section */
.hero-block {
  padding: 48px 0 36px;
}
.hero-kicker {
  font-family: var(--font-outlier);
  font-size: 12.5px;
  color: var(--color-muted);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.hero-headline {
  font-size: clamp(30px, 3.8vw, 44px);
  margin-bottom: 14px;
  max-width: 960px;
}
.hero-sentence {
  font-size: 16px;
  color: var(--color-muted);
  max-width: 820px;
  line-height: 1.6;
  margin-bottom: 24px;
}
.hero-cta-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

/* Sequence as Plastic Bands (Phase 01 to Phase 05) */
.phase-sequence {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 36px 0;
}
.phase-card {
  border-radius: var(--radius-card);
  background: #ffffff;
  border: 1px solid var(--color-rule);
  padding: 24px;
  box-shadow: var(--shadow-card);
}
.phase-card-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--color-paper-3);
  padding-bottom: 12px;
}
.phase-number {
  font-family: var(--font-outlier);
  font-size: 12px;
  font-weight: 700;
  background: var(--color-accent-soft);
  color: var(--color-accent-deep);
  padding: 3px 8px;
  border-radius: 4px;
}
.phase-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-ink);
}
.phase-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 24px;
}
@media (max-width: 860px) {
  .phase-grid {
    grid-template-columns: 1fr;
  }
}
.code-panel {
  background: oklch(18% 0.02 170);
  color: oklch(96% 0.01 160);
  border-radius: 8px;
  padding: 16px;
  font-family: var(--font-outlier);
  font-size: 12.5px;
  line-height: 1.5;
  overflow-x: auto;
}
.code-header {
  font-size: 11px;
  color: oklch(65% 0.02 165);
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
}

/* Feature Grid for Tools and Skills */
.section-tray {
  margin: 40px 0;
}
.section-headline {
  font-size: 24px;
  margin-bottom: 10px;
}
.section-subtext {
  font-size: 14.5px;
  color: var(--color-muted);
  margin-bottom: 20px;
  max-width: 780px;
}

/* Fallback for reduced motion */
@media (prefers-reduced-motion: reduce) {
  .btn, .step-pill {
    transition: none;
  }
}
  </style>
</head>
<body>

  <!-- 頂部循序步驟導航條 (Hallmark dose: clean, untracked, exact) -->
  <header class="step-nav-bar">
    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
      <span class="stamp-badge">11/05 WORKSHOP</span>
      <span style="font-weight: 600;">資料分析實戰步驟：</span>
    </div>
    <nav class="step-nav-pills" aria-label="資料分析流程步驟">
      <a href="curriculum_1105_workflow.html" class="step-pill">01. 全日課程架構</a>
      <span class="step-pill active" aria-current="page">02. 分析師工作流程 (當前)</span>
      <a href="estat_api_tutorial_simulator.html" class="step-pill">03. 日本資料與 API 申請</a>
      <a href="data_atoms.html" class="step-pill">04. Data Atoms 儀表板實作</a>
      <a href="estat_catalog_and_research_guide.html" class="step-pill">05. 17 領域研究指南</a>
      <a href="https://www.e-stat.go.jp" target="_blank" class="step-pill" style="background: var(--color-accent); border-color: var(--color-accent-deep);">e-Stat 官網 ↗</a>
    </nav>
  </header>

  <main class="container">

    <!-- Hero Section (Dose: morning light, exact, pharmacist's plainness) -->
    <section class="hero-block">
      <div class="hero-kicker">
        <span>track: data analytics</span>
        <span>•</span>
        <span>environment: antigravity</span>
        <span>•</span>
        <span>theme: dose</span>
      </div>
      <h1 class="hero-headline">資料分析師完整實戰工作流：從官方數據到 Tableau-like 儀表板</h1>
      <p class="hero-sentence">
        使用 Antigravity 代理人環境，串接日本總務省 e-Stat 官方 API 取得面板資料，調用 data-analyst 技能自動清洗，並在 Data Atoms 打造具備 10 大原子的互動探索工作台。
      </p>
      <div class="hero-cta-row">
        <a href="data_atoms.html" class="btn btn--primary">開啟 Data Atoms 儀表板 ↗</a>
        <a href="#workflow" class="btn btn--clear">檢視 5 階段完整 SOP ↓</a>
        <a href="https://github.com/nutcelvischen-jpg/data-analyst-skill" target="_blank" class="btn btn--clear">data-analyst Skill 倉庫 ↗</a>
      </div>
    </section>

    <!-- Stage 1: 全日課程架構 (Curriculum Preview) -->
    <section class="plastic-tray" style="--t: var(--p-fri);">
      <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 12px; margin-bottom: 12px;">
        <div>
          <span class="mono-label">step 01 · blueprint</span>
          <h2 style="font-size: 22px; margin-top: 4px;">全日課程架構：兩大區塊循序推進</h2>
        </div>
        <a href="curriculum_1105_workflow.html" class="btn btn--clear btn--sm">查看完整時序圖 ↗</a>
      </div>
      <p style="font-size: 14px; color: var(--color-muted); line-height: 1.6; max-width: 800px; margin-bottom: 14px;">
        今天課程嚴謹分為兩大部分：上午以《大語言模型學習地圖》掌握 Agent AI 概念與全球競爭格局；下午全面進入真實工程工具實作，從 Antigravity 代理人環境出發，串接日本 e-Stat 官方資料庫，打造 Tableau-like 儀表板。
      </p>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <div class="pharmacy-label" style="flex: 1; min-width: 280px; padding: 14px 18px;">
          <div class="mono-label">block 01 (15% time)</div>
          <div style="font-weight: 700; font-size: 15px; margin: 4px 0;">大模型學習地圖 (index.html)</div>
          <div style="font-size: 13px; color: var(--color-muted);">建立 Agent 認知、Token 機制與全球模型競爭。</div>
        </div>
        <div class="pharmacy-label" style="flex: 1.5; min-width: 320px; padding: 14px 18px; border-color: var(--color-accent);">
          <div class="mono-label" style="color: var(--color-accent-deep);">block 02 (85% time · 本單元)</div>
          <div style="font-weight: 700; font-size: 15px; margin: 4px 0;">真實工具實作：Antigravity 到 Data Atoms</div>
          <div style="font-size: 13px; color: var(--color-muted);">e-Stat 官方 API ➔ data-analyst 清洗 ➔ Tableau-like 儀表板 ➔ 影音簡報。</div>
        </div>
      </div>
    </section>

    <!-- Stage 2: 分析師 5 階段完整工作流 (SOP) -->
    <section id="workflow" class="section-tray">
      <div class="mono-label">step 02 · execution</div>
      <h2 class="section-headline">資料分析師完整工作流（帶學員用 Antigravity 走一次）</h2>
      <p class="section-subtext">
        遵循專業資訊工程流程，從拿到官方原始 JSON 到產出 C-Level 主管決策報告的標準五階段作業。
      </p>

      <div class="phase-sequence">

        <!-- Phase 01 -->
        <div class="phase-card">
          <div class="phase-card-top">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="phase-number">PHASE 01</span>
              <h3 class="phase-title">拿到資料：鎖定權威資料庫與 API 連線</h3>
            </div>
            <span class="mono-label">role: data ingestion</span>
          </div>
          <div class="phase-grid">
            <div>
              <p style="font-size: 14px; color: var(--color-muted); margin-bottom: 12px; line-height: 1.6;">
                分析的第一步不是下載 CSV，而是定義商業命題，並透過 API 連線取得官方權威數據。今天我們串接日本總務省統計局 e-Stat 官方 API，鎖定 1975–2024 半世紀 47 都道府縣面板數據。
              </p>
              <ul style="font-size: 13.5px; color: var(--color-ink-2); display: flex; flex-direction: column; gap: 6px; padding-left: 18px;">
                <li>在個人 My Page 申請金鑰（appId）。</li>
                <li>避坑重點：登錄 URL 務必填寫 <code>http://test.localhost</code>。</li>
                <li>調用端點：<code>/getStatsList</code> 取得目錄；<code>/getStatsData</code> 獲取數據。</li>
              </ul>
            </div>
            <div class="code-panel">
              <div class="code-header">
                <span>terminal: fetch_estat.py</span>
                <span>REST v3.0</span>
              </div>
              <code>$ python3 scripts/fetch_estat_showcase.py<br>
[e-Stat] Connecting to api.e-stat.go.jp...<br>
[e-Stat] Table: 0000010101 (SSDSE-A-2024)<br>
[e-Stat] Loaded 47 prefectures x 50 years.<br>
✓ Saved raw JSON: 14,800 records.</code>
            </div>
          </div>
        </div>

        <!-- Phase 02 (Featuring data-analyst skill) -->
        <div class="phase-card" style="border-color: var(--color-accent);">
          <div class="phase-card-top">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="phase-number" style="background: var(--color-accent); color: #fff;">PHASE 02</span>
              <h3 class="phase-title">處理資料：調用 data-analyst 技能自動清洗</h3>
            </div>
            <span class="mono-label" style="color: var(--color-accent-deep);">★ 專屬 Skill 封裝</span>
          </div>
          <div class="phase-grid">
            <div>
              <!-- Callout for data-analyst skill -->
              <div style="background: var(--color-paper-2); border: 1px solid var(--color-accent-soft); border-radius: 8px; padding: 14px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <span style="font-weight: 700; color: var(--color-accent-deep); font-size: 13.5px;">💡 調用 data-analyst 輕量技能包</span>
                  <a href="https://github.com/nutcelvischen-jpg/data-analyst-skill" target="_blank" style="font-size: 12px; color: var(--color-accent); text-decoration: underline; font-weight: 600;">GitHub 倉庫 ↗</a>
                </div>
                <p style="font-size: 12.5px; color: var(--color-muted); margin: 0;">
                  內建 4 大 Prompt 樣板與 <code>clean_data.py</code>，一鍵將千分位逗號數值（"14,178,000"）與百分比（23.4%）轉為乾淨數值。
                </p>
              </div>

              <p style="font-size: 14px; color: var(--color-muted); margin-bottom: 8px; line-height: 1.6;">
                特徵工程加工：計算關鍵業務指標，如 <code>高齡化率 = 65歲以上人口 / 總人口</code> 與 <code>扶養比</code>。
              </p>
            </div>
            <div class="code-panel">
              <div class="code-header">
                <span>clean_data.py execution</span>
                <span>python</span>
              </div>
              <code>$ python3 scripts/clean_data.py raw.csv clean.csv<br>
✓ 資料清洗完成: 47 列, 標準化 29 處數值<br>
• 千分位轉換: 14,178,000 ➔ 14178000<br>
• 百分比轉換: 23.4% ➔ 23.4<br>
• 空白缺失值補齊完成。</code>
            </div>
          </div>
        </div>

        <!-- Phase 03 -->
        <div class="phase-card">
          <div class="phase-card-top">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="phase-number">PHASE 03</span>
              <h3 class="phase-title">探索性驗證 (EDA)：尋找異常與極值</h3>
            </div>
            <span class="mono-label">role: exploratory analysis</span>
          </div>
          <div class="phase-grid">
            <div>
              <p style="font-size: 14px; color: var(--color-muted); margin-bottom: 12px; line-height: 1.6;">
                在動手畫大圖前，先以統計眼光探尋資料的分佈形狀。鎖定 2008 年日本總人口 1.28 億峰值拐點，並對比秋田縣 (39.5%) 與東京都 (22.7%) 的極值剪刀差。
              </p>
            </div>
            <div class="code-panel">
              <div class="code-header">
                <span>summary statistics</span>
                <span>eda</span>
              </div>
              <code>總列數: 47 列 | 全國總人口: 1.24 億<br>
平均高齡化率: 29.8% (中位數 30.2%)<br>
最高高齡化: 秋田縣 (39.46%)<br>
最低高齡化: 東京都 (22.68%)</code>
            </div>
          </div>
        </div>

        <!-- Phase 04 -->
        <div class="phase-card">
          <div class="phase-card-top">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="phase-number">PHASE 04</span>
              <h3 class="phase-title">建立互動儀表板：Data Atoms 實作（Tableau-like）</h3>
            </div>
            <span class="mono-label">role: dashboard engineer</span>
          </div>
          <div class="phase-grid">
            <div>
              <p style="font-size: 14px; color: var(--color-muted); margin-bottom: 12px; line-height: 1.6;">
                進入 <code>data_atoms.html</code> 工作台。隨意將欄位拖曳至 X 軸、Y 軸、顏色與大小編碼槽，切換 10 大數據原子圖表，並透過地區與年份雙層篩選器即時下鑽。
              </p>
              <a href="data_atoms.html" class="btn btn--primary btn--sm">前往 Data Atoms 儀表板 ↗</a>
            </div>
            <div class="code-panel">
              <div class="code-header">
                <span>data_atoms capabilities</span>
                <span>tableau style</span>
              </div>
              <code>✓ 10 大圖表原子 (柱狀/折線/雙軸/地理/盒鬚...)<br>
✓ 雙層篩選 (地方分區多選 + 年份滑桿)<br>
✓ Tableau Prep 智慧欄位分類<br>
✓ 自訂 CSV/Excel/JSON 本地拖曳解析</code>
            </div>
          </div>
        </div>

        <!-- Phase 05 -->
        <div class="phase-card">
          <div class="phase-card-top">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="phase-number">PHASE 05</span>
              <h3 class="phase-title">洞察決策報告：三段論結論與 1080p 影音</h3>
            </div>
            <span class="mono-label">role: executive briefing</span>
          </div>
          <div class="phase-grid">
            <div>
              <p style="font-size: 14px; color: var(--color-muted); margin-bottom: 12px; line-height: 1.6;">
                資料分析的終點是引導行動。遵循「現況 ➔ 原因 ➔ 建議」三段論向主管匯報，並透過 <code>dataviz-motion</code> 一鍵合成 34 秒包豪斯動態數據簡報影片。
              </p>
            </div>
            <div class="code-panel">
              <div class="code-header">
                <span>executive summary</span>
                <span>video briefing</span>
              </div>
              <code>1. 現況: 秋田每 10 人有 4 位老人，東京青年淨流入<br>
2. 原因: 產業集中首都圈造成地方長照財政壓力<br>
3. 建議: 醫療資源重組與地方遠距就業稅務補貼<br>
✓ 產出: data_briefing_bauhaus_34s.mp4</code>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- Stage 3 & 4: 資源指引與官方直連 (Tear-off stub) -->
    <section class="plastic-tray" style="--t: var(--p-wed);">
      <div class="mono-label">step 03 to 05 · resources</div>
      <h2 style="font-size: 22px; margin-top: 4px; margin-bottom: 12px;">資料分析延伸工具與官方資源</h2>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;">
        
        <!-- API 申請模擬器 -->
        <div class="pharmacy-label">
          <div class="mono-label">03. api tutorial</div>
          <div style="font-weight: 700; font-size: 16px; margin: 6px 0;">日本資料與 API 申請教學</div>
          <p style="font-size: 13px; color: var(--color-muted); margin-bottom: 12px;">
            內建 1080p 螢幕錄影實景教學，手把手帶您登入 e-Stat、申請 appId 金鑰並避開 test.localhost 坑點。
          </p>
          <a href="estat_api_tutorial_simulator.html" class="btn btn--clear btn--sm">開啟 API 申請教學 ↗</a>
        </div>

        <!-- 17 領域研究指南 -->
        <div class="pharmacy-label">
          <div class="mono-label">05. research guide</div>
          <div style="font-weight: 700; font-size: 16px; margin: 6px 0;">17 領域與圖像化研究指南</div>
          <p style="font-size: 13px; color: var(--color-muted); margin-bottom: 12px;">
            包含 10 大生活與商業視覺化實戰分析法，附帶一鍵在 Data Atoms 儀表板開啟範例按鈕。
          </p>
          <a href="estat_catalog_and_research_guide.html" class="btn btn--clear btn--sm">查閱 17 領域研究法 ↗</a>
        </div>

        <!-- 官方網站直連 -->
        <div class="pharmacy-label">
          <div class="mono-label">official portal</div>
          <div style="font-weight: 700; font-size: 16px; margin: 6px 0;">日本政府 e-Stat 官方首頁</div>
          <p style="font-size: 13px; color: var(--color-muted); margin-bottom: 12px;">
            日本總務省統計局官方入口，國家級統計發布總門戶，可線上檢索全量原始統計表。
          </p>
          <a href="https://www.e-stat.go.jp" target="_blank" class="btn btn--primary btn--sm">直達 e-Stat 官網 ↗</a>
        </div>

      </div>

      <!-- Tear off stub at bottom -->
      <div class="tear-stub">
        <div class="mono-label">
          status: all modules verified · repo: nutcelvischen-jpg/data-analyst-skill
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="data_atoms.html" style="font-size: 13px; color: var(--color-accent-deep); font-weight: 700; text-decoration: underline;">進入 Data Atoms 儀表板 ↗</a>
        </div>
      </div>
    </section>

  </main>

</body>
</html>
"""

# Write to student_data_analyst_workflow.html
with open('student_data_analyst_workflow.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

# Also write to data_analysis.html as the dedicated Data Analysis hub
with open('data_analysis.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print("Generated student_data_analyst_workflow.html and data_analysis.html with Hallmark 'dose' theme successfully!")
