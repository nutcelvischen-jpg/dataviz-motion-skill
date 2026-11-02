#!/usr/bin/env python3
"""
Generate the e-Stat Data Catalog & Research Blueprint Guide HTML page.
"""

import os

BASE_DIR = "."
OUTPUT_HTML = os.path.join(BASE_DIR, "estat_catalog_and_research_guide.html")
ARTIFACT_HTML = "<LOCAL_PATH>/estat_catalog.html"

html_content = """<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>e-Stat 日本政府官方統計 · 17大領域分類全覽與高價值研究矩陣</title>
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
      header, main { padding-left: 20px; padding-right: 20px; }
    }

    /* 頂部數據看板 */
    .hero-stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .hero-stat-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      padding: 18px 22px;
      box-shadow: var(--shadow-sm);
    }
    .hero-stat-num {
      font-size: 32px;
      font-weight: 700;
      color: var(--metro-blue);
      letter-spacing: -0.03em;
    }
    .hero-stat-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--ink-primary);
      margin-top: 2px;
    }
    .hero-stat-sub {
      font-size: 12px;
      color: var(--ink-muted);
      margin-top: 4px;
    }

    /* 搜尋與篩選列 */
    .filter-panel {
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      padding: 24px;
      margin-bottom: 32px;
      box-shadow: var(--shadow-sm);
    }
    .search-row {
      display: flex;
      gap: 14px;
      margin-bottom: 20px;
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
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid var(--border-default);
    }
    .section-title {
      font-family: 'Noto Serif TC', Georgia, serif;
      font-size: 22px;
      font-weight: 700;
      color: var(--ink-primary);
    }
    .section-count {
      font-size: 13px;
      color: var(--ink-muted);
    }

    /* 類別與研究卡片網格 */
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

    /* 研究主題標籤 */
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

    /* 底部 API 捷徑按鈕 */
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

<header>
  <div class="header-inner">
    <div>
      <div class="badge">📚 e-Stat 官方資料庫全集 · 統計分類與研究指南</div>
      <h1>日本政府統計資料分類與研究主題地圖</h1>
      <p class="header-desc">橫跨 17 大領域、50+ 項國家級指標、SSDSE 都道府縣社會體系與 35 個高價值研究切角</p>
    </div>
    <div class="nav-actions">
      <a href="student_data_analyst_workflow.html" class="nav-btn" style="background: var(--metro-blue); color: #fff; border-color: var(--metro-blue);">🎓 學員實戰手冊</a>
      <a href="japan_population_dashboard.html" class="nav-btn">📊 回到人口儀表板</a>
      <a href="docs/e_stat_api_handbook.md" class="nav-btn" target="_blank">📖 查看 API 開發手冊</a>
    </div>
  </div>
</header>

<main>
  <!-- 宏觀數字看板 -->
  <section class="hero-stat-grid">
    <div class="hero-stat-card">
      <div class="hero-stat-num">17</div>
      <div class="hero-stat-label">官方統計領域分野</div>
      <div class="hero-stat-sub">涵蓋人口、經濟、司法至文化</div>
    </div>
    <div class="hero-stat-card">
      <div class="hero-stat-num">13</div>
      <div class="hero-stat-label">SSDSE 都道府縣指標群</div>
      <div class="hero-stat-sub">A～M 組 1,500+ 個半世紀追蹤指標</div>
    </div>
    <div class="hero-stat-card">
      <div class="hero-stat-num">8</div>
      <div class="hero-stat-label">中央省廳權威數據源</div>
      <div class="hero-stat-sub">總務省、財務省、經產省、厚勞省等</div>
    </div>
    <div class="hero-stat-card">
      <div class="hero-stat-num">35+</div>
      <div class="hero-stat-label">高價值研究分析切角</div>
      <div class="hero-stat-sub">商業投資、少子高齡化、總經政策</div>
    </div>
  </section>

  <!-- 篩選器與搜尋列 -->
  <section class="filter-panel">
    <div class="search-row">
      <input type="text" id="searchInput" class="search-input" placeholder="🔍 搜尋領域、數據關鍵字或研究主題（例如：房地產、外國人、通膨、薪資、觀光、長照）..." oninput="filterCategories()">
    </div>
    <div class="tags-group">
      <span style="font-size: 13px; font-weight: 600; color: var(--ink-secondary); margin-right: 6px;">快速分類篩選：</span>
      <span class="filter-tag active" onclick="setFilter(event, 'all')">全部領域 (17)</span>
      <span class="filter-tag" onclick="setFilter(event, 'demographics')">👥 人口與勞動</span>
      <span class="filter-tag" onclick="setFilter(event, 'economy')">💹 經濟、商業與物價</span>
      <span class="filter-tag" onclick="setFilter(event, 'housing')">🏠 土地、居住與觀光</span>
      <span class="filter-tag" onclick="setFilter(event, 'welfare')">🏥 醫療、福祉與生活</span>
      <span class="filter-tag" onclick="setFilter(event, 'tech')">⚡ 科技、能源與環境</span>
    </div>
  </section>

  <!-- 主列表區塊 -->
  <div class="section-title-bar">
    <div class="section-title">官方 17 大統計領域與可執行的深度研究矩陣</div>
    <div class="section-count" id="resultsCount">顯示全部 17 個領域</div>
  </div>

  <div class="category-grid" id="categoryContainer">
    <!-- JS 會自動注入以下 17 大領域與研究卡片 -->
  </div>
</main>

<footer>
  <div>
    <strong>資料庫來源:</strong> 日本總務省統計局 e-Stat API v3.0 (官方規格標準分類代碼 statsField 01–17)
  </div>
  <div>
    <strong>推薦研究工具:</strong> Python (Pandas / Statsmodels / Scikit-learn), Apache ECharts, GIS 地理資訊
  </div>
</footer>

<script>
const categoriesData = [
  {
    code: "02",
    tagGroup: "demographics",
    name: "人口・世帶 (Population & Households)",
    ministry: "總務省統計局",
    statsField: "02",
    tableId: "0000010101 (社會・人口體系 A)",
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

function renderCards(data) {
  const container = document.getElementById('categoryContainer');
  container.innerHTML = '';
  document.getElementById('resultsCount').innerText = `共篩選出 ${data.length} 個領域分類`;

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

let activeTag = 'all';

function setFilter(evt, tag) {
  document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
  evt.currentTarget.classList.add('active');
  activeTag = tag;
  filterCategories();
}

function filterCategories() {
  const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
  
  const filtered = categoriesData.filter(item => {
    const matchTag = (activeTag === 'all') || (item.tagGroup === activeTag);
    if (!matchTag) return false;

    if (!keyword) return true;

    const inName = item.name.toLowerCase().includes(keyword);
    const inMinistry = item.ministry.toLowerCase().includes(keyword);
    const inScope = item.scope.toLowerCase().includes(keyword);
    const inTopics = item.researchTopics.some(t => t.title.toLowerCase().includes(keyword) || t.method.toLowerCase().includes(keyword));

    return inName || inMinistry || inScope || inTopics;
  });

  renderCards(filtered);
}

function copyApiQuery(code, tableId) {
  const query = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList?appId=d96194b7b3219075b1041948fddc842cfead7477&statsField=${code}&limit=10`;
  navigator.clipboard.writeText(query).then(() => {
    alert(`已複製該領域的 e-Stat API 查詢網址：\\n${query}`);
  });
}

// 初始渲染
window.addEventListener('DOMContentLoaded', () => {
  renderCards(categoriesData);
});
</script>
</body>
</html>
"""

# 寫入專案工作區
with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
    f.write(html_content)

# 寫入 Artifact 專用目錄
with open(ARTIFACT_HTML, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"Generated {OUTPUT_HTML} and {ARTIFACT_HTML} successfully!")
