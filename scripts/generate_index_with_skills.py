import re

html_content = """<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1" name="viewport"/>
<title>大語言模型學習地圖｜從提問到完成工作 · 核心工具與 Skill 對應總覽</title>
<meta content="用六個問題與互動示範，循序理解大語言模型、查證與工作流程，並完整對應 9 大實戰工具、Skill 封裝與開源 GitHub 資源庫。" name="description"/>
<script>
    (function () {
      const oldAnchors = new Set(['glossary','token-visualizer-card','strawberry','pricing','api-trial','models','cloud-vs-local','agent-evolution','agent-breach','macro-economy','distillation-security','world-models-math-space']);
      function redirectOldAnchor() {
        const hash = location.hash.slice(1);
        if (oldAnchors.has(hash)) location.replace('encyclopedia.html#' + hash);
      }
      redirectOldAnchor();
      addEventListener('hashchange', redirectOldAnchor);
    }());
  </script>
<link href="css/learning.css?v=10" rel="stylesheet"/>
<script defer="" src="js/learning-data.js?v=9"></script>
<script defer="" src="js/learning-progress.js?v=6"></script>
<script defer="" src="js/learning.js?v=11"></script>
<link href="css/concept-map.css?v=1" rel="stylesheet"/>
<link href="css/course-videos.css?v=1" rel="stylesheet"/>
<style>
  /* 頂部快捷導航條 */
  .portal-shortcut-strip {
    background: linear-gradient(90deg, #1e293b 0%, #334155 100%);
    color: #ffffff;
    padding: 8px 32px;
    font-size: 13px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.12);
  }
  .portal-shortcut-strip a {
    color: #e2e8f0;
    text-decoration: none;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: color 0.15s;
  }
  .portal-shortcut-strip a:hover {
    color: #38bdf8;
    text-decoration: underline;
  }
  .portal-shortcut-links {
    display: flex;
    gap: 16px;
    align-items: center;
    flex-wrap: wrap;
  }

  /* Skill Link 專屬區塊樣式 */
  .skills-directory-section {
    background: #f0eee6;
    border-top: 2px solid #d7d6c9;
    border-bottom: 2px solid #d7d6c9;
    padding: 88px 0;
  }
  .skills-header-row {
    margin-bottom: 36px;
  }
  .skills-header-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    font-weight: 700;
    letter-spacing: 0.05em;
    background: #e1dfd4;
    color: var(--accent-dark);
    padding: 4px 12px;
    border-radius: 20px;
    margin-bottom: 12px;
  }
  .skills-header-row h2 {
    font: 500 clamp(30px, 3.2vw, 42px)/1.25 var(--serif);
    letter-spacing: -0.02em;
    margin-bottom: 12px;
    color: var(--ink);
  }
  .skills-header-desc {
    font-size: 16px;
    line-height: 1.7;
    color: var(--muted);
    max-width: 840px;
  }

  /* 分類篩選標籤列 */
  .skills-filter-tabs {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 32px;
    align-items: center;
  }
  .skill-filter-btn {
    background: #fffefa;
    border: 1px solid #d7d6c9;
    color: var(--muted);
    padding: 7px 16px;
    border-radius: 24px;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    user-select: none;
  }
  .skill-filter-btn:hover {
    background: #e9e7dd;
    color: var(--ink);
  }
  .skill-filter-btn.active {
    background: var(--ink);
    color: #ffffff;
    border-color: var(--ink);
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  }

  /* 卡片網格 */
  .skills-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 24px;
  }
  @media (max-width: 768px) {
    .skills-card-grid { grid-template-columns: 1fr; }
  }

  .skill-tool-card {
    background: #fffefa;
    border: 1px solid #d7d6c9;
    border-radius: 12px;
    padding: 26px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.03);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  }
  .skill-tool-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.08);
    border-color: var(--accent);
  }

  .tool-card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
  }
  .tool-icon-and-title {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }
  .tool-icon {
    font-size: 24px;
    line-height: 1;
  }
  .tool-name {
    font-size: 18px;
    font-weight: 700;
    color: var(--ink);
    font-family: var(--sans);
    line-height: 1.35;
  }
  .tool-category-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 4px;
    background: var(--pale);
    color: #344f3c;
    border: 1px solid #b8beb0;
    white-space: nowrap;
  }

  /* Skill 對應橫條 */
  .skill-mapping-banner {
    background: #f7f5ee;
    border: 1px solid #dcd9cb;
    border-radius: 6px;
    padding: 8px 12px;
    margin: 12px 0 14px;
    font-size: 12.5px;
  }
  .skill-mapping-tag {
    font-weight: 700;
    background: var(--accent);
    color: #fff;
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 11px;
    display: inline-block;
    margin-right: 6px;
  }
  .skill-name-code {
    font-family: monospace;
    font-weight: 700;
    color: var(--ink);
    font-size: 13px;
  }

  .tool-desc-body {
    font-size: 13.5px;
    line-height: 1.6;
    color: var(--muted);
    margin-bottom: 16px;
  }
  .tool-desc-body strong {
    color: var(--ink);
  }

  /* 核心任務清單 */
  .tool-task-list {
    list-style: none;
    padding-left: 0;
    margin-bottom: 16px;
    font-size: 13px;
    color: var(--ink);
  }
  .tool-task-list li {
    padding-left: 18px;
    position: relative;
    margin-bottom: 6px;
    line-height: 1.45;
  }
  .tool-task-list li::before {
    content: "✓";
    position: absolute;
    left: 0;
    color: var(--accent);
    font-weight: bold;
    font-size: 11px;
    top: 2px;
  }

  /* GitHub 開源連結區塊 */
  .github-links-box {
    border-top: 1px dashed #d7d6c9;
    padding-top: 14px;
    margin-top: 14px;
  }
  .github-label {
    font-size: 11.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted);
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .github-links-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .github-link-item {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 12.5px;
    color: #1e3a8a;
    text-decoration: none;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 4px;
    background: #f1f5f9;
    transition: all 0.15s;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .github-link-item:hover {
    background: #e2e8f0;
    color: #0284c7;
    text-decoration: underline;
  }
  .github-icon-mini {
    flex-shrink: 0;
    font-size: 14px;
  }
  .skill-local-path {
    font-size: 11.5px;
    color: var(--muted);
    font-family: monospace;
    margin-top: 8px;
    display: block;
  }
</style>
</head>
<body data-page="home">
<a class="skip-link" href="#main">跳到主要內容</a>

<!-- 頂部一站式全域捷徑條 -->
<div class="portal-shortcut-strip">
  <div style="display: flex; align-items: center; gap: 8px;">
    <span>⚡ 數據視覺化與 AI Agent 實戰營導航總部：</span>
  </div>
  <div class="portal-shortcut-links">
    <a href="#learning-map">🧭 六站學習路線</a>
    <a href="#skill-links">🛠️ 工具與 Skill 對應矩陣</a>
    <a href="data_atoms.html">📊 數據原子儀表板 (Data Atoms)</a>
    <a href="estat_catalog_and_research_guide.html">📚 官方統計 17 領域與方法論</a>
    <a href="student_data_analyst_workflow.html">🎓 學員實戰手冊</a>
    <a href="curriculum_1105_workflow.html" target="_blank">🗺️ 11/05 課程流程圖</a>
  </div>
</div>

<header class="site-header">
<div class="header-inner wrap">
<a aria-label="大語言模型學習地圖首頁" class="brand" href="index.html"><span aria-hidden="true" class="brand-mark">學</span><span>大語言模型<br/><strong>學習地圖</strong></span></a>
<nav aria-label="主要導覽" class="main-nav">
  <a aria-current="page" href="index.html#learning-map">跟著學</a>
  <a href="#skill-links" style="color: var(--accent); font-weight: 700;">🛠️ 工具與 Skill</a>
  <a href="encyclopedia.html">查概念</a>
  <a href="lab.html">做實驗</a>
</nav>
</div>
</header>

<main id="main">
<section class="home-hero wrap">
<div class="hero-copy">
<h1>從一句提問，<br/>理解 AI 如何<span>完成工作</span></h1>
<p class="hero-intro">用六個問題、六個小實驗，建立大語言模型的基本觀念，再把它用在資料分析、Skill 封裝與自動化工作流程。</p>
<div class="hero-actions">
  <a class="button button-primary" href="learn.html?lesson=01" id="start-learning">開始第一站 <span aria-hidden="true">→</span></a>
  <a class="button button-secondary" href="#skill-links">查看工具與 Skill 對應 ↗</a>
  <a class="text-link" href="concepts/overview.html">先看 AI 架構圖 →</a>
</div>
<p class="hero-note">不需要程式背景，也不需要 API Key；完成基礎學習後即可銜接實戰儀表板與影片生成。</p>
</div>
<aside aria-labelledby="home-concept-title" class="map-preview"><h2 id="home-concept-title">先認識 AI 助手的組成</h2><div class="map-preview-tree"><div class="map-preview-root">以 LLM<br/>為核心的<br/>AI 助手</div><ol>
<li><span class="map-preview-branch">理解與生成</span><a href="concepts/model.html?frommap=model">LLM</a><a href="concepts/tokens.html?frommap=model">Token</a></li>
<li><span class="map-preview-branch">交代任務與資訊</span><a href="concepts/prompt.html?frommap=context">Prompt</a><a href="concepts/context.html?frommap=context">Context</a></li>
<li><span class="map-preview-branch">查資料與留記錄</span><a href="concepts/knowledge.html?frommap=knowledge#term-rag">RAG</a><a href="concepts/context.html?frommap=knowledge#memory-layers">Memory</a></li>
<li><span class="map-preview-branch">實際執行操作</span><a href="concepts/agent-tools.html?frommap=tools#term-tool-calling">Tool</a><a href="concepts/api.html?frommap=tools">API</a></li>
<li><span class="map-preview-branch">安排下一步</span><a href="concepts/agent.html?frommap=control#workflow">Workflow</a><a href="concepts/agent.html?frommap=control#agent-loop">Agent Loop</a></li>
<li><span class="map-preview-branch">核對結果與界線</span><a href="concepts/verification.html?frommap=quality#evals">Evals</a><a href="concepts/agent-tools.html?frommap=quality#permissions">權限</a></li>
</ol></div><div class="map-preview-footer"><a href="concepts/overview.html#concept-map">展開完整心智圖 →</a><a href="concepts/overview.html#task-flow">看任務流程圖 →</a></div></aside>
</section>

<details class="course-video" id="video-funnel"><summary><span>數位乩童開示：AI 漏斗｜課前暖身：你如何使用 AI？</span><small>2:29 · 點開觀看</small></summary><div class="course-video-body"><p>從不同使用方式出發，思考能核對結果的小任務。</p><video aria-label="數位乩童開示：AI 漏斗：課前暖身：你如何使用 AI？" controls="" playsinline="" poster="assets/video-posters/funnel.jpg" preload="none"><source src="%E6%95%B8%E4%BD%8D%E4%B9%A9%E7%AB%A5%E9%96%8B%E7%A4%BA_AI%E6%BC%8F%E6%96%97.mp4" type="video/mp4"/>瀏覽器無法播放時，請<a href="%E6%95%B8%E4%BD%8D%E4%B9%A9%E7%AB%A5%E9%96%8B%E7%A4%BA_AI%E6%BC%8F%E6%96%97.mp4">開啟影片</a>。</video><div class="course-video-notes"><p><strong>看完想一想：</strong>你想從哪個能核對結果的小任務開始？</p><p class="quiet">影片使用生活比喻，正式概念請搭配網頁圖解；片中的數字、引言與產品例子應依原始來源及日期核對。</p><p><a href="index.html">閱讀對應概念與圖解 →</a> · <a href="videos.html#video-funnel">查看完整系列</a></p></div></div></details><p class="video-library-entry"><a href="videos.html">看數位乩童影片系列：EP0–EP4 與兩支導讀 →</a></p>

<!-- ===================================================================
     六站學習路線 (Learning Map Anchor: #learning-map)
     =================================================================== -->
<section class="route-section" id="learning-map">
<div class="wrap route-layout"><div class="section-intro"><h2>六站，走出<br/>自己的學習路線。</h2><p>從最基本的回答機制開始，一步一步找到 AI 在工作中能做什麼、需要怎麼檢查。</p><div class="progress-summary"><span id="home-progress-count">已完成 0／6 站</span><div aria-hidden="true" class="progress-track"><span id="home-progress-bar"></span></div></div><p class="storage-message" data-storage-message="" role="status"></p></div>
<div><ol class="route-list" id="route-list"></ol><div class="route-controls"><a hidden="" href="00_課程手冊與即時看板/WORKSHOP_BOARD.html#module1-practice" id="home-practice">前往資料分析實作 →</a><button class="quiet-button" data-reset-progress="" type="button">重設學習進度</button></div></div></div>
</section>

<!-- ===================================================================
     全新專屬區塊: 課程核心工具與 Skill 對應矩陣與開源 GitHub (Anchor: #skill-links)
     =================================================================== -->
<section class="skills-directory-section" id="skill-links">
  <div class="wrap">
    <div class="skills-header-row">
      <div class="skills-header-badge">🛠️ 實戰工具 · 專屬 Skill 封裝 · 開源 GitHub 資源庫</div>
      <h2>哪些工具用到哪些 Skill？完整對照清單</h2>
      <p class="skills-header-desc">
        在 Antigravity 代理人自動化工作流與 11/05 實戰營中，我們將各種工程工具封裝為模組化 Skill（技能包），讓 AI 能自主調用。下方清楚梳理每項工具所驅動的 Skill、在工作流中的任務角色，並附上權威開源 GitHub 倉庫與本地配置路徑。
      </p>
    </div>

    <!-- 分類過濾按鈕 -->
    <div class="skills-filter-tabs">
      <span style="font-size: 13.5px; font-weight: 700; color: var(--muted); margin-right: 6px;">快速分類：</span>
      <button class="skill-filter-btn active" onclick="filterSkillCards(event, 'all')">全部工具 (9)</button>
      <button class="skill-filter-btn" onclick="filterSkillCards(event, 'viz')">📊 資料視覺化與儀表板</button>
      <button class="skill-filter-btn" onclick="filterSkillCards(event, 'tutor')">🤖 AI 導師與自主學習</button>
      <button class="skill-filter-btn" onclick="filterSkillCards(event, 'video')">🎬 動態影音與聲音生成</button>
      <button class="skill-filter-btn" onclick="filterSkillCards(event, 'diagram')">📐 架構與流程圖表</button>
      <button class="skill-filter-btn" onclick="filterSkillCards(event, 'design')">🎨 前端去 AI 味審查</button>
      <button class="skill-filter-btn" onclick="filterSkillCards(event, 'api')">🔌 API、MCP 與自動化</button>
    </div>

    <!-- 工具與 Skill 卡片網格 -->
    <div class="skills-card-grid" id="skillCardContainer">

      <!-- 1. Data Atoms Dashboard -->
      <div class="skill-tool-card" data-category="viz">
        <div>
          <div class="tool-card-top">
            <div class="tool-icon-and-title">
              <span class="tool-icon">📊</span>
              <div>
                <div class="tool-name">Tableau-like 互動式資料儀表板</div>
                <div style="font-size: 12px; color: var(--muted); margin-top: 2px;">資料分類、多維度分析與自適應圖表引擎</div>
              </div>
            </div>
            <span class="tool-category-badge">視覺化分析</span>
          </div>

          <div class="skill-mapping-banner">
            <span class="skill-mapping-tag">調用 Skill</span>
            <span class="skill-name-code">data-atoms-dashboard</span>
            <span style="font-size: 11.5px; color: var(--muted); margin-left: 4px;">+ dataviz</span>
          </div>

          <div class="tool-desc-body">
            <strong>使用任務：</strong>將 CSV / JSON 或 e-Stat API 資料拉入後，自動進行 Tableau Prep 智慧欄位分類（維度、度量、時序、地理、連續 vs 離散），人機微調後一鍵渲染 10 大數據原子圖表。
          </div>

          <ul class="tool-task-list">
            <li>自動判定連續/間斷變數，提供自適應色盤與度量統計。</li>
            <li>支援日本 47 都道府縣、台灣 22 縣市、全球 195 國地理座標投影。</li>
            <li>具備活躍區域與年份跨度（1975–2024）雙層聯動篩選器。</li>
          </ul>
        </div>

        <div class="github-links-box">
          <div class="github-label">
            <span>🐙 核心開源 GitHub 資源庫：</span>
          </div>
          <div class="github-links-list">
            <a href="https://github.com/apache/echarts" target="_blank" class="github-link-item">
              <span class="github-icon-mini">↗</span>
              <span>apache/echarts (底層圖表與地圖渲染引擎)</span>
            </a>
            <a href="https://github.com/Kanaries/pygwalker" target="_blank" class="github-link-item">
              <span class="github-icon-mini">↗</span>
              <span>Kanaries/pygwalker (Python Tableau-like 視覺化)</span>
            </a>
            <a href="https://github.com/Kanaries/graphic-walker" target="_blank" class="github-link-item">
              <span class="github-icon-mini">↗</span>
              <span>Kanaries/graphic-walker (前端拖曳圖表核心庫)</span>
            </a>
          </div>
          <span class="skill-local-path">📁 本地封裝: .agents/skills/data-atoms-dashboard/SKILL.md</span>
        </div>
      </div>

      <!-- 2. DeepTutor Mentor -->
      <div class="skill-tool-card" data-category="tutor">
        <div>
          <div class="tool-card-top">
            <div class="tool-icon-and-title">
              <span class="tool-icon">🎓</span>
              <div>
                <div class="tool-name">自主學習 AI 導師系統</div>
                <div style="font-size: 12px; color: var(--muted); margin-top: 2px;">蘇格拉底啟發式提問與漸進式引導教學</div>
              </div>
            </div>
            <span class="tool-category-badge">自主學習</span>
          </div>

          <div class="skill-mapping-banner">
            <span class="skill-mapping-tag">調用 Skill</span>
            <span class="skill-name-code">deeptutor-mentor</span>
            <span style="font-size: 11.5px; color: var(--muted); margin-left: 4px;">(基於港大 HKUDS)</span>
          </div>

          <div class="tool-desc-body">
            <strong>使用任務：</strong>專為無老師指導情境設計，引導學員自主突破盲點。不直接給代碼，透過三階漸進提示（概念引導 ➔ 架構拆解 ➔ 最小代碼範例）培養學員獨立解決問題的能力。
          </div>

          <ul class="tool-task-list">
            <li>自適應學習里程碑（Milestones 01~05）自學引導。</li>
            <li>錯誤醫生（Error Doctor）：解析常見報錯（NaN、CORS、403、TypeError）。</li>
            <li>心智模型驗證：以反思提問確認學員真正理解，而非死記硬背。</li>
          </ul>
        </div>

        <div class="github-links-box">
          <div class="github-label">
            <span>🐙 核心開源 GitHub 資源庫：</span>
          </div>
          <div class="github-links-list">
            <a href="https://github.com/HKUDS/DeepTutor" target="_blank" class="github-link-item">
              <span class="github-icon-mini">↗</span>
              <span>HKUDS/DeepTutor (香港大學自主學習 AI 導師系統)</span>
            </a>
            <a href="https://github.com/stanfordnlp/dspy" target="_blank" class="github-link-item">
              <span class="github-icon-mini">↗</span>
              <span>stanfordnlp/dspy (可編程 Prompt 優化與自動評估)</span>
            </a>
          </div>
          <span class="skill-local-path">📁 本地封裝: .agents/skills/deeptutor-mentor/SKILL.md</span>
        </div>
      </div>

      <!-- 3. Dataviz Motion & Earshot -->
      <div class="skill-tool-card" data-category="video">
        <div>
          <div class="tool-card-top">
            <div class="tool-icon-and-title">
              <span class="tool-icon">🎬</span>
              <div>
                <div class="tool-name">動態視覺化影片與音效混音生成</div>
                <div style="font-size: 12px; color: var(--muted); margin-top: 2px;">1080p 60FPS 幾何動效與 WebAudio 混音</div>
              </div>
            </div>
            <span class="tool-category-badge">影音生成</span>
          </div>

          <div class="skill-mapping-banner">
            <span class="skill-mapping-tag">調用 Skill</span>
            <span class="skill-name-code">dataviz-motion</span>
            <span style="font-size: 11.5px; color: var(--muted); margin-left: 4px;">+ huashu-motion</span>
          </div>

          <div class="tool-desc-body">
            <strong>使用任務：</strong>數據分析完成後，以程式碼全自動將圖表轉化為 60 秒 1080p 60FPS 高質感動態短片，支援繁體中文動態卡片、幾何形變動態與 Earshot 聲音混音架構。
          </div>

          <ul class="tool-task-list">
            <li>導演層動態系統：以程式碼精確控制每一影格 (Frame-by-Frame)。</li>
            <li>WebAudio 與 Earshot 音效設計：轉場 Whoosh、點擊 Beep 與低音背景樂。</li>
            <li>Google TTS 語音旁白自動配時與音軌智能壓制。</li>
          </ul>
        </div>

        <div class="github-links-box">
          <div class="github-label">
            <span>🐙 核心開源 GitHub 資源庫：</span>
          </div>
          <div class="github-links-list">
            <a href="https://github.com/remotion-dev/remotion" target="_blank" class="github-link-item">
              <span class="github-icon-mini">↗</span>
              <span>remotion-dev/remotion (React 程式化影片合成框架)</span>
            </a>
            <a href="https://github.com/FFmpeg/FFmpeg" target="_blank" class="github-link-item">
              <span class="github-icon-mini">↗</span>
              <span>FFmpeg/FFmpeg (跨平台多媒體影音轉碼標準工具)</span>
            </a>
          </div>
          <span class="skill-local-path">📁 本地封裝: ~/.gemini/config/skills/dataviz-motion/SKILL.md</span>
        </div>
      </div>

      <!-- 4. Diagram Design Engine -->
      <div class="skill-tool-card" data-category="diagram">
        <div>
          <div class="tool-card-top">
            <div class="tool-icon-and-title">
              <span class="tool-icon">📐</span>
              <div>
                <div class="tool-name">架構圖、流程圖與時序圖表設計</div>
                <div style="font-size: 12px; color: var(--muted); margin-top: 2px;">無 AI 味品牌感流程圖與系統時序圖</div>
              </div>
            </div>
            <span class="tool-category-badge">工程圖表</span>
          </div>

          <div class="skill-mapping-banner">
            <span class="skill-mapping-tag">調用 Skill</span>
            <span class="skill-name-code">diagram-design</span>
            <span style="font-size: 11.5px; color: var(--muted); margin-left: 4px;">+ anatomy</span>
          </div>

          <div class="tool-desc-body">
            <strong>使用任務：</strong>用於繪製清晰易懂的系統架構圖、時序圖（Sequence）、資料流向圖（Data Flow）與 11/05 課程時序流程圖，嚴格遵循幾何格網與色彩平衡。
          </div>

          <ul class="tool-task-list">
            <li>內建 `self_check.py` 規範檢驗器，確保文字標籤與框線無衝突。</li>
            <li>支援 Mermaid.js、SVG 與 HTML 雙模態無損縮放渲染。</li>
            <li>無 AI 味設計：精準的層級色塊、細緻邊框與等角透視 (Isometric)。</li>
          </ul>
        </div>

        <div class="github-links-box">
          <div class="github-label">
            <span>🐙 核心開源 GitHub 資源庫：</span>
          </div>
          <div class="github-links-list">
            <a href="https://github.com/mermaid-js/mermaid" target="_blank" class="github-link-item">
              <span class="github-icon-mini">↗</span>
              <span>mermaid-js/mermaid (Markdown 驅動圖表渲染引擎)</span>
            </a>
            <a href="https://github.com/excalidraw/excalidraw" target="_blank" class="github-link-item">
              <span class="github-icon-mini">↗</span>
              <span>excalidraw/excalidraw (虛擬手繪工程白板向量圖工具)</span>
            </a>
          </div>
          <span class="skill-local-path">📁 本地封裝: .agents/skills/diagram-design/SKILL.md</span>
        </div>
      </div>

      <!-- 5. Hallmark & Impeccable Design -->
      <div class="skill-tool-card" data-category="design">
        <div>
          <div class="tool-card-top">
            <div class="tool-icon-and-title">
              <span class="tool-icon">🎨</span>
              <div>
                <div class="tool-name">前端設計去 AI 味審查與極致美學打磨</div>
                <div style="font-size: 12px; color: var(--muted); margin-top: 2px;">消除公式化模板感，注入成熟設計師手筆</div>
              </div>
            </div>
            <span class="tool-category-badge">美學審查</span>
          </div>

          <div class="skill-mapping-banner">
            <span class="skill-mapping-tag">調用 Skill</span>
            <span class="skill-name-code">hallmark</span>
            <span style="font-size: 11.5px; color: var(--muted); margin-left: 4px;">+ impeccable</span>
          </div>

          <div class="tool-desc-body">
            <strong>使用任務：</strong>檢視網頁與儀表板是否具備「AI 生成味」（無腦圓角、廉價漸層、低對比灰字），嚴格重構版面節奏、襯線/無襯線字型配搭與微質感層次。
          </div>

          <ul class="tool-task-list">
            <li>Nutlope 原創設計系統：確保頁面看起來經過真正設計而非隨機產生。</li>
            <li>字體排印學 (Typography)：嚴選 Instrument Serif 與 Geist / Noto Sans。</li>
            <li>反過度裝飾：保持內容高資訊密度與功能可讀性。</li>
          </ul>
        </div>

        <div class="github-links-box">
          <div class="github-label">
            <span>🐙 核心開源 GitHub 資源庫：</span>
          </div>
          <div class="github-links-list">
            <a href="https://github.com/Nutlope/hallmark" target="_blank" class="github-link-item">
              <span class="github-icon-mini">↗</span>
              <span>Nutlope/hallmark (網站設計去 AI 味審查官方 Skill)</span>
            </a>
            <a href="https://github.com/tailwindlabs/tailwindcss" target="_blank" class="github-link-item">
              <span class="github-icon-mini">↗</span>
              <span>tailwindlabs/tailwindcss (實用優先現代 CSS 樣式系統)</span>
            </a>
          </div>
          <span class="skill-local-path">📁 本地封裝: .agents/skills/hallmark/SKILL.md</span>
        </div>
      </div>

      <!-- 6. Gemini API Dev -->
      <div class="skill-tool-card" data-category="api">
        <div>
          <div class="tool-card-top">
            <div class="tool-icon-and-title">
              <span class="tool-icon">⚡</span>
              <div>
                <div class="tool-name">Google Gemini 官方 API 與多模態代理</div>
                <div style="font-size: 12px; color: var(--muted); margin-top: 2px;">結構化 JSON 輸出、Function Calling 與串流推論</div>
              </div>
            </div>
            <span class="tool-category-badge">LLM 引擎</span>
          </div>

          <div class="skill-mapping-banner">
            <span class="skill-mapping-tag">調用 Skill</span>
            <span class="skill-name-code">gemini-api-dev</span>
            <span style="font-size: 11.5px; color: var(--muted); margin-left: 4px;">+ gemini-live-api-dev</span>
          </div>

          <div class="tool-desc-body">
            <strong>使用任務：</strong>以 Google 官方最新 SDK 調用 Gemini 2.5 Flash / 3.8 / Pro，處理高維面板資料摘要、自動特徵命名、SQL/代碼生成與即時多模態推論。
          </div>

          <ul class="tool-task-list">
            <li>Structured Outputs：百分之百保證符合 Pydantic / JSON Schema 格式。</li>
            <li>Function Calling (Tool Use)：模型自主判斷並呼叫本地計算工具。</li>
            <li>Google Search Grounding：自動聯網檢索真實官方數據，抑制模型幻覺。</li>
          </ul>
        </div>

        <div class="github-links-box">
          <div class="github-label">
            <span>🐙 核心開源 GitHub 資源庫：</span>
          </div>
          <div class="github-links-list">
            <a href="https://github.com/googleapis/python-genai" target="_blank" class="github-link-item">
              <span class="github-icon-mini">↗</span>
              <span>googleapis/python-genai (Google 官方最新一代 Gemini SDK)</span>
            </a>
            <a href="https://github.com/google-gemini/cookbook" target="_blank" class="github-link-item">
              <span class="github-icon-mini">↗</span>
              <span>google-gemini/cookbook (Gemini 官方實戰進階範例庫)</span>
            </a>
          </div>
          <span class="skill-local-path">📁 本地封裝: ~/.gemini/config/plugins/gemini-api/skills/gemini-api-dev/SKILL.md</span>
        </div>
      </div>

      <!-- 7. Chrome DevTools Protocol -->
      <div class="skill-tool-card" data-category="api">
        <div>
          <div class="tool-card-top">
            <div class="tool-icon-and-title">
              <span class="tool-icon">🔍</span>
              <div>
                <div class="tool-name">無頭瀏覽器自動化與 CDP 協議除錯</div>
                <div style="font-size: 12px; color: var(--muted); margin-top: 2px;">自動截圖檢驗、DOM 結構驗證與控制台監聽</div>
              </div>
            </div>
            <span class="tool-category-badge">自動化測試</span>
          </div>

          <div class="skill-mapping-banner">
            <span class="skill-mapping-tag">調用 Skill</span>
            <span class="skill-name-code">chrome-devtools</span>
            <span style="font-size: 11.5px; color: var(--muted); margin-left: 4px;">+ troubleshooting</span>
          </div>

          <div class="tool-desc-body">
            <strong>使用任務：</strong>在幕後啟動 Headless Chrome，透過 Chrome DevTools Protocol (CDP) 自動執行端對端功能驗證、動態篩選點擊、畫面截圖與控制台報錯攔截。
          </div>

          <ul class="tool-task-list">
            <li>自動巡檢 JavaScript 運行期錯誤與未捕獲例外 (Unhandled Exceptions)。</li>
            <li>端對端截圖：捕獲儀表板與時間軸的高解析度驗證圖片存檔。</li>
            <li>無障礙 (a11y) 與效能 Core Web Vitals (LCP) 診斷。</li>
          </ul>
        </div>

        <div class="github-links-box">
          <div class="github-label">
            <span>🐙 核心開源 GitHub 資源庫：</span>
          </div>
          <div class="github-links-list">
            <a href="https://github.com/ChromeDevTools/devtools-protocol" target="_blank" class="github-link-item">
              <span class="github-icon-mini">↗</span>
              <span>ChromeDevTools/devtools-protocol (官方遠端偵錯協定規範)</span>
            </a>
            <a href="https://github.com/puppeteer/puppeteer" target="_blank" class="github-link-item">
              <span class="github-icon-mini">↗</span>
              <span>puppeteer/puppeteer (Google 官方 Headless Chrome 控制庫)</span>
            </a>
          </div>
          <span class="skill-local-path">📁 本地封裝: ~/.gemini/config/plugins/chrome-devtools-plugin/skills/chrome-devtools/SKILL.md</span>
        </div>
      </div>

      <!-- 8. Google Workspace MCP -->
      <div class="skill-tool-card" data-category="api">
        <div>
          <div class="tool-card-top">
            <div class="tool-icon-and-title">
              <span class="tool-icon">📂</span>
              <div>
                <div class="tool-name">Google Workspace 整合與 MCP 工具協定</div>
                <div style="font-size: 12px; color: var(--muted); margin-top: 2px;">OAuth 免密授權、雲端試算表與 Docs 自動化</div>
              </div>
            </div>
            <span class="tool-category-badge">MCP 協定</span>
          </div>

          <div class="skill-mapping-banner">
            <span class="skill-mapping-tag">調用 Skill</span>
            <span class="skill-name-code">google-easy-auth</span>
            <span style="font-size: 11.5px; color: var(--muted); margin-left: 4px;">+ gsheets / gdrive</span>
          </div>

          <div class="tool-desc-body">
            <strong>使用任務：</strong>學員一步完成 Google Drive、Sheets、Docs、Gmail 的 OAuth 2.0 授權，讓 AI Agent 透過 Model Context Protocol (MCP) 直接讀寫雲端試算表。
          </div>

          <ul class="tool-task-list">
            <li>自動產出授權檢查清單，無痛完成 `~/.clasprc.json` 設定。</li>
            <li>將整理完的 e-Stat 統計面板直接匯出為 Google 試算表。</li>
            <li>標準化 MCP 架構，支援本機 AI 與雲端工具的無縫安全對接。</li>
          </ul>
        </div>

        <div class="github-links-box">
          <div class="github-label">
            <span>🐙 核心開源 GitHub 資源庫：</span>
          </div>
          <div class="github-links-list">
            <a href="https://github.com/modelcontextprotocol" target="_blank" class="github-link-item">
              <span class="github-icon-mini">↗</span>
              <span>modelcontextprotocol (Anthropic 開源 MCP 規範核心庫)</span>
            </a>
            <a href="https://github.com/google/clasp" target="_blank" class="github-link-item">
              <span class="github-icon-mini">↗</span>
              <span>google/clasp (Google Apps Script 命令列開發工具)</span>
            </a>
          </div>
          <span class="skill-local-path">📁 本地封裝: ~/.gemini/config/skills/google-easy-auth/SKILL.md</span>
        </div>
      </div>

      <!-- 9. Answer Me With HTML -->
      <div class="skill-tool-card" data-category="design">
        <div>
          <div class="tool-card-top">
            <div class="tool-icon-and-title">
              <span class="tool-icon">💡</span>
              <div>
                <div class="tool-name">單頁視覺化 HTML 解說卡片生成器</div>
                <div style="font-size: 12px; color: var(--muted); margin-top: 2px;">複雜技術概念、架構與決策的動態視覺呈現</div>
              </div>
            </div>
            <span class="tool-category-badge">視覺交付</span>
          </div>

          <div class="skill-mapping-banner">
            <span class="skill-mapping-tag">調用 Skill</span>
            <span class="skill-name-code">answer-me-with-html</span>
            <span style="font-size: 11.5px; color: var(--muted); margin-left: 4px;">+ generative_ui</span>
          </div>

          <div class="tool-desc-body">
            <strong>使用任務：</strong>當使用者詢問「講講原理」、「畫個圖」或遇到多方案權衡比較時，自動將 Markdown 轉換為自包含、美觀大方的單頁 HTML 圖解。
          </div>

          <ul class="tool-task-list">
            <li>一鍵將抽象流程、生命週期、權衡取捨編譯為視覺網頁。</li>
            <li>內嵌 KaTeX 數學公式、SVG 向量線條與結構化表格。</li>
            <li>免依賴伺服器，單一檔案隨點即看，適合課堂學員即時回顧。</li>
          </ul>
        </div>

        <div class="github-links-box">
          <div class="github-label">
            <span>🐙 核心開源 GitHub 資源庫：</span>
          </div>
          <div class="github-links-list">
            <a href="https://github.com/vitejs/vite" target="_blank" class="github-link-item">
              <span class="github-icon-mini">↗</span>
              <span>vitejs/vite (極速現代前端模組建構工具)</span>
            </a>
            <a href="https://github.com/KaTeX/KaTeX" target="_blank" class="github-link-item">
              <span class="github-icon-mini">↗</span>
              <span>KaTeX/KaTeX (高速網頁數學公式渲染引擎)</span>
            </a>
          </div>
          <span class="skill-local-path">📁 本地封裝: ~/.gemini/config/skills/answer-me-with-html/SKILL.md</span>
        </div>
      </div>

    </div>
  </div>
</section>

<!-- 學完後，你能做什麼？ -->
<section class="outcomes wrap">
<div><h2>學完後，你能做什麼？</h2><p>把抽象名詞，轉成每次使用 AI 都能帶走的具體判斷與實戰能力。</p></div>
<ol>
  <li><span>01</span>解釋回答與上下文的關係，掌握 Prompt 與 Context 邊界。</li>
  <li><span>02</span>區分生成的流暢回答與可查證的真實依據（RAG / 官方 API）。</li>
  <li><span>03</span>安排有工具（MCP）、有 Skill 封裝、有檢核與影音交付的完整 Agent 工作流。</li>
</ol>
</section>

<!-- 想再深入一點？ -->
<section class="reading-section" id="further-reading">
<div class="wrap">
  <div class="reading-heading">
    <div><h2>想再深入一點？</h2><p>選讀進階實戰指南，不影響六站學習進度。</p></div>
    <a class="text-link" href="encyclopedia.html">查看完整圖鑑 ↗</a>
  </div>
  <div class="reading-grid">
    <div>
      <h3>實戰儀表板與 API</h3>
      <a href="data_atoms.html">數據原子視覺化儀表板 →</a>
      <a href="estat_catalog_and_research_guide.html">e-Stat 官方統計與方法矩陣 →</a>
      <a href="student_data_analyst_workflow.html">學員實戰操作手冊 →</a>
      <a href="curriculum_1105_workflow.html" target="_blank">11/05 完整課程流程圖 →</a>
    </div>
    <div>
      <h3>模型與部署架構</h3>
      <a href="concepts/models.html">全球模型全景圖 →</a>
      <a href="concepts/knowledge.html">向量、RAG 與知識庫 →</a>
      <a href="concepts/moe.html">MoE 混合專家架構 →</a>
      <a href="concepts/deployment.html">雲端與地端部署 →</a>
    </div>
    <div>
      <h3>Agent 產業與安全</h3>
      <a href="concepts/agent.html">Agent 代理人演進史 →</a>
      <a href="concepts/agent-tools.html">Tool Calling 與 MCP 協定 →</a>
      <a href="security.html">API Key 安全與提示詞防禦 →</a>
      <a href="topics/ai-economy.html">總體經濟與生產力變遷 →</a>
    </div>
  </div>
</div>
</section>
</main>

<footer class="site-footer">
<div class="wrap">
  <span>大語言模型學習地圖 · 數據視覺化與 AI Agent 實戰營</span>
  <span>理解原理，然後動手做出真正的產品。</span>
</div>
</footer>

<noscript><p class="wrap">請啟用 JavaScript 以使用學習路線與互動示範。您仍可<a href="encyclopedia.html">查閱完整圖鑑</a>。</p></noscript>

<script>
// 分類過濾邏輯
function filterSkillCards(evt, category) {
  document.querySelectorAll('.skill-filter-btn').forEach(btn => btn.classList.remove('active'));
  evt.currentTarget.classList.add('active');

  const cards = document.querySelectorAll('.skill-tool-card');
  cards.forEach(card => {
    if (category === 'all' || card.dataset.category === category) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}
</script>
</body>
</html>
"""

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print("Successfully wrote complete index.html with #learning-map and #skill-links!")
