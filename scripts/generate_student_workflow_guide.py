#!/usr/bin/env python3
"""
Generate the Student Data Analyst Workflow Guide HTML page
following the diagram-design skill rules.
"""

import os

BASE_DIR = "/Users/chenchunchih/Desktop/數據視覺化"
OUTPUT_HTML = os.path.join(BASE_DIR, "student_data_analyst_workflow.html")
ARTIFACT_HTML = "/Users/chenchunchih/.gemini/antigravity/brain/c94a8ac3-56eb-4e5b-bbf2-98acfad3ce44/student_workflow.html"

# 1. 構建符合 diagram-design 規範的高水準 SVG 流程圖 (Inline SVG)
# 畫布尺寸 1280 x 360，5 大連續處理階段，含 input/output chips, role badges, tool chips, arrows
svg_diagram = """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 340" width="100%" height="100%" style="background: transparent;">
  <defs>
    <!-- 箭頭標記 -->
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#4f5d75" />
    </marker>
    <marker id="arrow-focal" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#bf4520" />
    </marker>
  </defs>

  <!-- 頂部階段標題列 (Header Strip) -->
  <g transform="translate(10, 16)">
    <!-- Stage 1 -->
    <rect x="30" y="0" width="220" height="28" rx="6" fill="#ececec" stroke="#bfc0c0" stroke-width="1"/>
    <text x="44" y="19" font-family="'Geist Mono', monospace" font-size="11" font-weight="700" fill="#2d3142">PHASE 01</text>
    <text x="110" y="19" font-family="'Geist', sans-serif" font-size="12" font-weight="600" fill="#4f5d75">獲取權威數據</text>

    <!-- Stage 2 -->
    <rect x="280" y="0" width="220" height="28" rx="6" fill="#ececec" stroke="#bfc0c0" stroke-width="1"/>
    <text x="294" y="19" font-family="'Geist Mono', monospace" font-size="11" font-weight="700" fill="#2d3142">PHASE 02</text>
    <text x="360" y="19" font-family="'Geist', sans-serif" font-size="12" font-weight="600" fill="#4f5d75">清洗與特徵工程</text>

    <!-- Stage 3 -->
    <rect x="530" y="0" width="220" height="28" rx="6" fill="#ececec" stroke="#bfc0c0" stroke-width="1"/>
    <text x="544" y="19" font-family="'Geist Mono', monospace" font-size="11" font-weight="700" fill="#2d3142">PHASE 03</text>
    <text x="610" y="19" font-family="'Geist', sans-serif" font-size="12" font-weight="600" fill="#4f5d75">探索性驗證 (EDA)</text>

    <!-- Stage 4 (Focal - Accent) -->
    <rect x="780" y="0" width="220" height="28" rx="6" fill="rgba(191,69,32,0.08)" stroke="#bf4520" stroke-width="1.5"/>
    <rect x="788" y="6" width="60" height="16" rx="4" fill="#bf4520"/>
    <text x="794" y="18" font-family="'Geist Mono', monospace" font-size="10" font-weight="700" fill="#ffffff">PHASE 04</text>
    <text x="860" y="19" font-family="'Geist', sans-serif" font-size="12" font-weight="700" fill="#bf4520">建置互動儀表板 ★</text>

    <!-- Stage 5 -->
    <rect x="1030" y="0" width="220" height="28" rx="6" fill="#ececec" stroke="#bfc0c0" stroke-width="1"/>
    <text x="1044" y="19" font-family="'Geist Mono', monospace" font-size="11" font-weight="700" fill="#2d3142">PHASE 05</text>
    <text x="1110" y="19" font-family="'Geist', sans-serif" font-size="12" font-weight="600" fill="#4f5d75">洞察與決策報告</text>
  </g>

  <!-- 節點連接箭頭 (Connectors) -->
  <path d="M 260 150 L 280 150" stroke="#4f5d75" stroke-width="1.5" marker-end="url(#arrow)" fill="none"/>
  <path d="M 510 150 L 530 150" stroke="#4f5d75" stroke-width="1.5" marker-end="url(#arrow)" fill="none"/>
  <path d="M 760 150 L 780 150" stroke="#bf4520" stroke-width="1.5" marker-end="url(#arrow-focal)" fill="none"/>
  <path d="M 1010 150 L 1030 150" stroke="#bf4520" stroke-width="1.5" marker-end="url(#arrow-focal)" fill="none"/>

  <!-- 反饋迭代循環箭頭 (Feedback Loop from Phase 5 to Phase 2) -->
  <path d="M 1140 250 L 1140 290 L 400 290 L 400 250" stroke="#bfc0c0" stroke-width="1.2" stroke-dasharray="4,4" marker-end="url(#arrow)" fill="none"/>
  <rect x="670" y="280" width="200" height="20" rx="4" fill="#f5f5f5" stroke="#bfc0c0" stroke-width="1"/>
  <text x="680" y="294" font-family="'Geist Mono', monospace" font-size="10" font-weight="600" fill="#5a6580">↻ 驗證假設未達標時回流迭代</text>

  <!-- 階段 1 卡片節點 -->
  <g transform="translate(40, 64)">
    <rect x="0" y="0" width="220" height="170" rx="8" fill="#ffffff" stroke="#bfc0c0" stroke-width="1"/>
    <!-- Role Badge -->
    <rect x="12" y="12" width="34" height="16" rx="4" fill="#f5f5f5" stroke="#bfc0c0" stroke-width="0.8"/>
    <text x="17" y="24" font-family="'Geist Mono', monospace" font-size="9" font-weight="700" fill="#4f5d75">ING</text>
    <text x="54" y="25" font-family="'Geist', sans-serif" font-size="14" font-weight="700" fill="#2d3142">1. 拿到資料</text>
    <text x="12" y="48" font-family="'Geist', sans-serif" font-size="11" fill="#4f5d75">定界題型 · 調用 API · 拉回原表</text>

    <!-- IN/OUT Chips -->
    <g transform="translate(12, 60)">
      <rect x="0" y="0" width="90" height="20" rx="3" fill="#f5f5f5" stroke="#bfc0c0" stroke-width="0.8"/>
      <text x="6" y="14" font-family="'Geist Mono', monospace" font-size="9" fill="#5a6580">IN: 命題/appId</text>
      <rect x="98" y="0" width="98" height="20" rx="3" fill="#ececec" stroke="#bfc0c0" stroke-width="0.8"/>
      <text x="104" y="14" font-family="'Geist Mono', monospace" font-size="9" font-weight="600" fill="#2d3142">OUT: 原始JSON</text>
    </g>

    <!-- 任務細節 -->
    <text x="12" y="104" font-family="'Geist', sans-serif" font-size="11" fill="#2d3142">• 登入 e-Stat 填寫 test.localhost</text>
    <text x="12" y="122" font-family="'Geist', sans-serif" font-size="11" fill="#2d3142">• 鎖定 Table: 0000010101 (人口)</text>
    <text x="12" y="140" font-family="'Geist', sans-serif" font-size="11" fill="#2d3142">• 擷取全國半世紀與47都道府縣</text>

    <!-- 工具標籤 -->
    <rect x="12" y="148" width="196" height="16" rx="3" fill="#f5f5f5"/>
    <text x="18" y="160" font-family="'Geist Mono', monospace" font-size="9" fill="#5a6580">TOOL: e-Stat REST v3.0 · Python</text>
  </g>

  <!-- 階段 2 卡片節點 -->
  <g transform="translate(290, 64)">
    <rect x="0" y="0" width="220" height="170" rx="8" fill="#ffffff" stroke="#bfc0c0" stroke-width="1"/>
    <rect x="12" y="12" width="34" height="16" rx="4" fill="#f5f5f5" stroke="#bfc0c0" stroke-width="0.8"/>
    <text x="17" y="24" font-family="'Geist Mono', monospace" font-size="9" font-weight="700" fill="#4f5d75">WRA</text>
    <text x="54" y="25" font-family="'Geist', sans-serif" font-size="14" font-weight="700" fill="#2d3142">2. 處理資料</text>
    <text x="12" y="48" font-family="'Geist', sans-serif" font-size="11" fill="#4f5d75">結構解構 · 指標計算 · 窄表轉換</text>

    <g transform="translate(12, 60)">
      <rect x="0" y="0" width="90" height="20" rx="3" fill="#f5f5f5" stroke="#bfc0c0" stroke-width="0.8"/>
      <text x="6" y="14" font-family="'Geist Mono', monospace" font-size="9" fill="#5a6580">IN: 巢狀JSON</text>
      <rect x="98" y="0" width="98" height="20" rx="3" fill="#ececec" stroke="#bfc0c0" stroke-width="0.8"/>
      <text x="104" y="14" font-family="'Geist Mono', monospace" font-size="9" font-weight="600" fill="#2d3142">OUT: Tidy Data</text>
    </g>

    <text x="12" y="104" font-family="'Geist', sans-serif" font-size="11" fill="#2d3142">• 解析 CLASS_INF 代碼對照表</text>
    <text x="12" y="122" font-family="'Geist', sans-serif" font-size="11" fill="#2d3142">• 計算高齡化率 = 65歲+ / 總人口</text>
    <text x="12" y="140" font-family="'Geist', sans-serif" font-size="11" fill="#2d3142">• 輸出整齊的時序與縣市維度陣列</text>

    <rect x="12" y="148" width="196" height="16" rx="3" fill="#f5f5f5"/>
    <text x="18" y="160" font-family="'Geist Mono', monospace" font-size="9" fill="#5a6580">TOOL: Pandas · NumPy · JSON Parser</text>
  </g>

  <!-- 階段 3 卡片節點 -->
  <g transform="translate(540, 64)">
    <rect x="0" y="0" width="220" height="170" rx="8" fill="#ffffff" stroke="#bfc0c0" stroke-width="1"/>
    <rect x="12" y="12" width="34" height="16" rx="4" fill="#f5f5f5" stroke="#bfc0c0" stroke-width="0.8"/>
    <text x="17" y="24" font-family="'Geist Mono', monospace" font-size="9" font-weight="700" fill="#4f5d75">EDA</text>
    <text x="54" y="25" font-family="'Geist', sans-serif" font-size="14" font-weight="700" fill="#2d3142">3. 探索性驗證</text>
    <text x="12" y="48" font-family="'Geist', sans-serif" font-size="11" fill="#4f5d75">異常值探勘 · 統計分佈 · 剪刀差</text>

    <g transform="translate(12, 60)">
      <rect x="0" y="0" width="90" height="20" rx="3" fill="#f5f5f5" stroke="#bfc0c0" stroke-width="0.8"/>
      <text x="6" y="14" font-family="'Geist Mono', monospace" font-size="9" fill="#5a6580">IN: 乾淨數值</text>
      <rect x="98" y="0" width="98" height="20" rx="3" fill="#ececec" stroke="#bfc0c0" stroke-width="0.8"/>
      <text x="104" y="14" font-family="'Geist Mono', monospace" font-size="9" font-weight="600" fill="#2d3142">OUT: 統計洞見</text>
    </g>

    <text x="12" y="104" font-family="'Geist', sans-serif" font-size="11" fill="#2d3142">• 捕捉 2008 年歷史人口拐點</text>
    <text x="12" y="122" font-family="'Geist', sans-serif" font-size="11" fill="#2d3142">• 鎖定秋田 39.5% vs 東京 22.7%</text>
    <text x="12" y="140" font-family="'Geist', sans-serif" font-size="11" fill="#2d3142">• 驗證三大世代勞動力消長趨勢</text>

    <rect x="12" y="148" width="196" height="16" rx="3" fill="#f5f5f5"/>
    <text x="18" y="160" font-family="'Geist Mono', monospace" font-size="9" fill="#5a6580">TOOL: Jupyter · Statsmodels · Seaborn</text>
  </g>

  <!-- 階段 4 卡片節點 (Focal - 儀表板建置) -->
  <g transform="translate(790, 64)">
    <rect x="0" y="0" width="220" height="170" rx="8" fill="#ffffff" stroke="#bf4520" stroke-width="2"/>
    <rect x="12" y="12" width="34" height="16" rx="4" fill="rgba(191,69,32,0.12)" stroke="#bf4520" stroke-width="0.8"/>
    <text x="17" y="24" font-family="'Geist Mono', monospace" font-size="9" font-weight="700" fill="#bf4520">VIZ</text>
    <text x="54" y="25" font-family="'Geist', sans-serif" font-size="14" font-weight="700" fill="#bf4520">4. 建立儀表板 ★</text>
    <text x="12" y="48" font-family="'Geist', sans-serif" font-size="11" fill="#4f5d75">圖表編排 · 交互式篩選 · API測試</text>

    <g transform="translate(12, 60)">
      <rect x="0" y="0" width="90" height="20" rx="3" fill="#f5f5f5" stroke="#bfc0c0" stroke-width="0.8"/>
      <text x="6" y="14" font-family="'Geist Mono', monospace" font-size="9" fill="#5a6580">IN: 視覺模型</text>
      <rect x="98" y="0" width="98" height="20" rx="3" fill="rgba(191,69,32,0.15)" stroke="#bf4520" stroke-width="1"/>
      <text x="104" y="14" font-family="'Geist Mono', monospace" font-size="9" font-weight="700" fill="#bf4520">OUT: 互動Web</text>
    </g>

    <text x="12" y="104" font-family="'Geist', sans-serif" font-size="11" fill="#2d3142">• 頂部 KPI 焦點卡 (總量/高齡率)</text>
    <text x="12" y="122" font-family="'Geist', sans-serif" font-size="11" fill="#2d3142">• 半世紀總人口雙軸面積折線圖</text>
    <text x="12" y="140" font-family="'Geist', sans-serif" font-size="11" fill="#2d3142">• 47 都道府縣排行榜 + 實時測試台</text>

    <rect x="12" y="148" width="196" height="16" rx="3" fill="rgba(191,69,32,0.08)"/>
    <text x="18" y="160" font-family="'Geist Mono', monospace" font-size="9" font-weight="600" fill="#bf4520">TOOL: Apache ECharts · HTML/CSS</text>
  </g>

  <!-- 階段 5 卡片節點 -->
  <g transform="translate(1040, 64)">
    <rect x="0" y="0" width="220" height="170" rx="8" fill="#ffffff" stroke="#bfc0c0" stroke-width="1"/>
    <rect x="12" y="12" width="34" height="16" rx="4" fill="#f5f5f5" stroke="#bfc0c0" stroke-width="0.8"/>
    <text x="17" y="24" font-family="'Geist Mono', monospace" font-size="9" font-weight="700" fill="#4f5d75">BIZ</text>
    <text x="54" y="25" font-family="'Geist', sans-serif" font-size="14" font-weight="700" fill="#2d3142">5. 最後進行分析</text>
    <text x="12" y="48" font-family="'Geist', sans-serif" font-size="11" fill="#4f5d75">商業意涵 · 政策研析 · 行動建議</text>

    <g transform="translate(12, 60)">
      <rect x="0" y="0" width="90" height="20" rx="3" fill="#f5f5f5" stroke="#bfc0c0" stroke-width="0.8"/>
      <text x="6" y="14" font-family="'Geist Mono', monospace" font-size="9" fill="#5a6580">IN: 視覺對比</text>
      <rect x="98" y="0" width="98" height="20" rx="3" fill="#ececec" stroke="#bfc0c0" stroke-width="0.8"/>
      <text x="104" y="14" font-family="'Geist Mono', monospace" font-size="9" font-weight="600" fill="#2d3142">OUT: 決策報告</text>
    </g>

    <text x="12" y="104" font-family="'Geist', sans-serif" font-size="11" fill="#2d3142">• 揭露「勞動力失衡」與扶養比</text>
    <text x="12" y="122" font-family="'Geist', sans-serif" font-size="11" fill="#2d3142">• 評估地方自治體長照赤字風險</text>
    <text x="12" y="140" font-family="'Geist', sans-serif" font-size="11" fill="#2d3142">• 產出商業選址與不動產投資建言</text>

    <rect x="12" y="148" width="196" height="16" rx="3" fill="#f5f5f5"/>
    <text x="18" y="160" font-family="'Geist Mono', monospace" font-size="9" fill="#5a6580">TOOL: Markdown · Keynote · Report</text>
  </g>
</svg>
"""

html_content = f"""<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>資料分析師實戰工作流手冊 · 從官方數據到決策洞察</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&family=Noto+Sans+TC:wght@400;500;600;700&family=Noto+Serif+TC:wght@500;700&display=swap" rel="stylesheet">
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
      --clay-danger: #bf4520;
      --clay-tint: rgba(191, 69, 32, 0.08);
      --forest-green: #2c6e49;
      --forest-tint: rgba(44, 110, 73, 0.08);
      
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
      padding: 0 0 100px 0;
      -webkit-font-smoothing: antialiased;
    }}

    header {{
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-default);
      padding: 30px 48px 24px;
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
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
    }}
    .badge {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.05em;
      background: var(--metro-tint);
      color: var(--metro-blue);
      padding: 4px 12px;
      border-radius: 20px;
      margin-bottom: 8px;
    }}
    h1 {{
      font-family: 'Noto Serif TC', 'Instrument Serif', Georgia, serif;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }}
    .header-desc {{
      font-size: 14px;
      color: var(--ink-secondary);
      margin-top: 4px;
    }}
    .nav-actions {{
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }}
    .nav-btn {{
      background: var(--bg-subtle);
      border: 1px solid var(--border-default);
      color: var(--ink-primary);
      padding: 8px 14px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
    }}
    .nav-btn:hover {{
      background: var(--metro-blue);
      color: #fff;
      border-color: var(--metro-blue);
    }}

    main {{
      max-width: 1400px;
      margin: 32px auto 0;
      padding: 0 48px;
    }}
    @media (max-width: 1024px) {{
      header, main {{ padding-left: 20px; padding-right: 20px; }}
    }}

    /* 頂部全景流程架構圖 (SVG Diagram Card) */
    .diagram-panel {{
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      padding: 24px;
      margin-bottom: 36px;
      box-shadow: var(--shadow-sm);
    }}
    .panel-header-bar {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }}
    .panel-title {{
      font-size: 17px;
      font-weight: 700;
      color: var(--ink-primary);
      display: flex;
      align-items: center;
      gap: 8px;
    }}
    .panel-legend {{
      display: flex;
      gap: 14px;
      font-size: 12px;
      color: var(--ink-muted);
    }}
    .panel-legend-item {{
      display: flex;
      align-items: center;
      gap: 5px;
    }}
    .legend-chip {{
      width: 10px;
      height: 10px;
      border-radius: 2px;
    }}

    /* 流程步驟詳細指南 (Stage Playbooks) */
    .stages-container {{
      display: flex;
      flex-direction: column;
      gap: 28px;
      margin-bottom: 40px;
    }}

    .stage-card {{
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      transition: border-color 0.2s, box-shadow 0.2s;
    }}
    .stage-card:hover {{
      border-color: var(--metro-blue);
      box-shadow: var(--shadow-md);
    }}
    .stage-card.focal {{
      border-color: var(--clay-danger);
      box-shadow: 0 4px 16px rgba(191, 69, 32, 0.08);
    }}

    .stage-top {{
      background: var(--bg-subtle);
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-default);
      flex-wrap: wrap;
      gap: 12px;
    }}
    .stage-num-title {{
      display: flex;
      align-items: center;
      gap: 12px;
    }}
    .stage-badge {{
      background: var(--metro-blue);
      color: #fff;
      font-family: 'Geist Mono', monospace;
      font-size: 12px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
    }}
    .stage-badge.focal {{
      background: var(--clay-danger);
    }}
    .stage-title {{
      font-size: 18px;
      font-weight: 700;
      color: var(--ink-primary);
    }}
    .stage-role-tag {{
      font-size: 12px;
      color: var(--ink-secondary);
      background: #fff;
      border: 1px solid var(--border-default);
      padding: 4px 10px;
      border-radius: 20px;
      font-weight: 500;
    }}

    .stage-body {{
      padding: 24px;
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 28px;
    }}
    @media (max-width: 900px) {{
      .stage-body {{ grid-template-columns: 1fr; }}
    }}

    .guide-section-label {{
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--metro-blue);
      margin-bottom: 8px;
    }}
    .guide-text {{
      font-size: 14px;
      color: var(--ink-secondary);
      margin-bottom: 14px;
      line-height: 1.6;
    }}
    .key-points-list {{
      list-style: none;
      margin-bottom: 16px;
    }}
    .key-points-list li {{
      font-size: 13.5px;
      color: var(--ink-primary);
      margin-bottom: 8px;
      padding-left: 20px;
      position: relative;
    }}
    .key-points-list li::before {{
      content: "✔";
      position: absolute;
      left: 0;
      color: var(--forest-green);
      font-weight: 700;
    }}

    /* 程式碼與配置視窗 */
    .code-box {{
      background: #181b24;
      border: 1px solid #2d3345;
      border-radius: var(--radius-md);
      overflow: hidden;
      font-family: 'Geist Mono', monospace;
    }}
    .code-header {{
      background: #12141c;
      padding: 8px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #2d3345;
      font-size: 11px;
      color: #94a3b8;
    }}
    .copy-code-btn {{
      background: transparent;
      border: 1px solid #3e475e;
      color: #cbd5e1;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.15s;
    }}
    .copy-code-btn:hover {{
      background: #2b3348;
      color: #fff;
    }}
    pre.code-content {{
      padding: 14px;
      font-size: 12px;
      line-height: 1.5;
      color: #a5f3fc;
      overflow-x: auto;
      max-height: 240px;
    }}

    /* 學員互動實戰檢核清單 (Interactive Checklist) */
    .checklist-panel {{
      background: var(--bg-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-lg);
      padding: 28px;
      margin-top: 36px;
    }}
    .checklist-header {{
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border-default);
      flex-wrap: wrap;
      gap: 12px;
    }}
    .checklist-title {{
      font-size: 18px;
      font-weight: 700;
      color: var(--ink-primary);
    }}
    .progress-bar-wrap {{
      width: 240px;
      background: var(--bg-inset);
      height: 8px;
      border-radius: 4px;
      overflow: hidden;
    }}
    .progress-bar-fill {{
      height: 100%;
      width: 0%;
      background: var(--forest-green);
      transition: width 0.3s;
    }}
    .checklist-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }}
    .check-item {{
      background: var(--bg-subtle);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      padding: 14px 16px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      cursor: pointer;
      user-select: none;
      transition: all 0.15s;
    }}
    .check-item:hover {{
      background: var(--bg-inset);
    }}
    .check-item.done {{
      background: var(--forest-tint);
      border-color: rgba(44, 110, 73, 0.3);
    }}
    .check-item.done .check-title {{
      text-decoration: line-through;
      color: var(--ink-muted);
    }}
    .check-box {{
      width: 18px;
      height: 18px;
      border: 2px solid var(--border-default);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 2px;
      background: #fff;
    }}
    .check-item.done .check-box {{
      background: var(--forest-green);
      border-color: var(--forest-green);
      color: #fff;
    }}
    .check-item.done .check-box::after {{
      content: "✓";
      font-size: 12px;
      font-weight: 700;
    }}
    .check-info {{
      flex: 1;
    }}
    .check-title {{
      font-size: 14px;
      font-weight: 600;
      color: var(--ink-primary);
    }}
    .check-sub {{
      font-size: 12px;
      color: var(--ink-secondary);
      margin-top: 2px;
    }}

    footer {{
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
    }}
  </style>
</head>
<body>

<header>
  <div class="header-inner">
    <div>
      <div class="badge">📘 資料分析與視覺化實戰教學 · 學員手冊</div>
      <h1>資料分析師完整工作流：從官方數據到決策洞察</h1>
      <p class="header-desc">掌握「取得 ➔ 清洗 ➔ 探索 ➔ 儀表板 ➔ 洞察決策」五大實戰階段之專業 SOP</p>
    </div>
    <div class="nav-actions">
      <a href="japan_population_dashboard.html" class="nav-btn">📊 50年人口儀表板</a>
      <a href="estat_catalog_and_research_guide.html" class="nav-btn">🗺️ 17領域研究指南</a>
      <a href="estat_api_tutorial_simulator.html" class="nav-btn">🎥 API申請錄影教學</a>
    </div>
  </div>
</header>

<main>
  <!-- 頂部流程架構圖 (由 diagram-design 規範設計) -->
  <section class="diagram-panel">
    <div class="panel-header-bar">
      <div class="panel-title">
        <span>🗺️ 全景資料工程與分析流水線架構圖</span>
      </div>
      <div class="panel-legend">
        <div class="panel-legend-item">
          <span class="legend-chip" style="background: #2d3142;"></span> 基礎階段節點
        </div>
        <div class="panel-legend-item">
          <span class="legend-chip" style="background: #bf4520;"></span> 焦點視覺化樞紐 ★
        </div>
        <div class="panel-legend-item">
          <span class="legend-chip" style="background: #bfc0c0;"></span> 迭代回流路徑
        </div>
      </div>
    </div>

    <!-- 嵌入 SVG 流程架構圖 -->
    <div style="width: 100%; overflow-x: auto;">
      {svg_diagram}
    </div>
  </section>

  <!-- 五大階段詳細學員指導手冊 (Stage Playbooks) -->
  <section class="stages-container">
    
    <!-- 階段 1 -->
    <div class="stage-card">
      <div class="stage-top">
        <div class="stage-num-title">
          <span class="stage-badge">PHASE 01</span>
          <span class="stage-title">1. 拿到資料（資料獲取與 API 管線）</span>
        </div>
        <span class="stage-role-tag">角色擔當：資料工程師 / 研究員 · Data Ingestion</span>
      </div>
      <div class="stage-body">
        <div>
          <div class="guide-section-label">🎯 本階段核心任務與思維</div>
          <p class="guide-text">
            資料分析的第一步絕非盲目下載大檔，而是<strong>「帶著問題去找資料」</strong>。透過 API 動態檢索能確保資料源與官方同步，並可精確過濾所需年份與維度，大幅節省頻寬與清理成本。
          </p>
          <ul class="key-points-list">
            <li><strong>鎖定權威 ID</strong>：在 e-Stat 官方資料庫中確認主題，例如「社會・人口統計體系 (<code>0000010101</code>)」。</li>
            <li><strong>解析維度定義</strong>：先用 <code>getMetaInfo</code> 查看指標代碼（如 <code>A1101</code> 為總人口、<code>A1303</code> 為 65 歲以上長者）。</li>
            <li><strong>精準參數呼叫</strong>：在請求時直接帶入 <code>cdCat01=A1101,A1303</code>，單次取回精準數據。</li>
          </ul>
        </div>
        <div>
          <div class="code-box">
            <div class="code-header">
              <span>Python API 調用示範</span>
              <button class="copy-code-btn" onclick="copySnippet('code1')">複製</button>
            </div>
            <pre class="code-content" id="code1">from estat_api_client import EStatClient

client = EStatClient(app_id="YOUR_KEY")
# 指定人口表單與指標，一秒拉回半世紀全國時序
data = client.get_stats_data(
    stats_data_id="0000010101",
    cat01="A1101,A1301,A1302,A1303",
    area="00000",
    limit=500
)</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- 階段 2 -->
    <div class="stage-card">
      <div class="stage-top">
        <div class="stage-num-title">
          <span class="stage-badge">PHASE 02</span>
          <span class="stage-title">2. 處理資料（做專業資料分析師，針對想討論的問題）</span>
        </div>
        <span class="stage-role-tag">角色擔當：資料分析師 · Data Wrangling & Feature Engineering</span>
      </div>
      <div class="stage-body">
        <div>
          <div class="guide-section-label">🎯 本階段核心任務與思維</div>
          <p class="guide-text">
            原始資料通常充滿巢狀 JSON、奇怪的代碼（如 <code>@time: 2024100000</code>）與字串型別數字。分析師的工作是將其塑造成適合建模與視覺化的 <strong>Tidy Data（整齊資料）</strong>，並加工出關鍵商業指標。
          </p>
          <ul class="key-points-list">
            <li><strong>型別轉換與缺失處理</strong>：將字串數值 <code>"123802000"</code> 轉換為整數，過濾無效缺漏值。</li>
            <li><strong>特徵工程加工</strong>：計算具業務意義的衍生指標：
              <br/><code>高齡化率 (%) = (65歲以上人口 / 總人口) * 100%</code>
              <br/><code>扶養比 (%) = (幼年 + 老年人口 / 15-64歲勞動力) * 100%</code>
            </li>
            <li><strong>結構降維</strong>：將縱向的多指標數值轉換為橫向可比的寬表或標準時序陣列。</li>
          </ul>
        </div>
        <div>
          <div class="code-box">
            <div class="code-header">
              <span>Pandas 特徵工程範例</span>
              <button class="copy-code-btn" onclick="copySnippet('code2')">複製</button>
            </div>
            <pre class="code-content" id="code2"># 將 API 回傳的 VALUE 轉為結構化 DataFrame
df['total_pop'] = df['A1101'].astype(int)
df['elderly_pop'] = df['A1303'].astype(int)

# 計算核心分析特徵：高齡化率
df['aging_ratio'] = (
    df['elderly_pop'] / df['total_pop'] * 100
).round(2)

# 按年份排序輸出
df_sorted = df.sort_values(by='year')</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- 階段 3 -->
    <div class="stage-card">
      <div class="stage-top">
        <div class="stage-num-title">
          <span class="stage-badge">PHASE 03</span>
          <span class="stage-title">3. 探索性驗證（EDA - 尋找異常與極值）</span>
        </div>
        <span class="stage-role-tag">角色擔當：計量經濟分析師 · Exploratory Data Analysis</span>
      </div>
      <div class="stage-body">
        <div>
          <div class="guide-section-label">🎯 本階段核心任務與思維</div>
          <p class="guide-text">
            在動手畫大圖前，分析師需先用統計眼光探尋資料的<strong>「分佈形狀」</strong>與<strong>「異常極值」</strong>。好故事往往藏在最極端的對比之中。
          </p>
          <ul class="key-points-list">
            <li><strong>鎖定歷史拐點</strong>：在 50 年時序中，發現日本總人口於 <strong>2008 年達到 1.28 億峰值</strong>，隨後連續 15 年不可逆地下跌。</li>
            <li><strong>極值對比法</strong>：對比 47 都道府縣：
              <br/>最高齡縣市：<strong>秋田縣（39.46%）</strong>，每 10 人有近 4 位老人！
              <br/>最年輕都縣：<strong>東京都（22.68%）</strong>，受全日本青年人口持續流入支撐。
            </li>
            <li><strong>世代結構剪刀差</strong>：發現幼年人口佔比（11.4%）與老年人口佔比（29.3%）形成驚人的發散型剪刀差。</li>
          </ul>
        </div>
        <div>
          <div class="code-box">
            <div class="code-header">
              <span>極端值快速統計代碼</span>
              <button class="copy-code-btn" onclick="copySnippet('code3')">複製</button>
            </div>
            <pre class="code-content" id="code3"># 找出最高齡與最年輕行政區
highest = df_pref.loc[df_pref['aging_ratio'].idxmax()]
lowest = df_pref.loc[df_pref['aging_ratio'].idxmin()]

print(f"最高: {{highest['name']}} ({{highest['aging_ratio']}}%)")
print(f"最低: {{lowest['name']}} ({{lowest['aging_ratio']}}%)")
# 輸出: 秋田縣 (39.46%) vs 東京都 (22.68%)</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- 階段 4 (Focal) -->
    <div class="stage-card focal">
      <div class="stage-top">
        <div class="stage-num-title">
          <span class="stage-badge focal">PHASE 04</span>
          <span class="stage-title">4. 建立互動儀表板（視覺化樞紐 ★）</span>
        </div>
        <span class="stage-role-tag" style="border-color: var(--clay-danger); color: var(--clay-danger);">角色擔當：資訊架構師 / 視覺工程師 · Dashboard Engineering</span>
      </div>
      <div class="stage-body">
        <div>
          <div class="guide-section-label" style="color: var(--clay-danger);">🎯 本階段核心任務與思維</div>
          <p class="guide-text">
            視覺化是將複雜數據轉化為<strong>「1秒直覺認知」</strong>的魔法。遵循專業排版層級，避免資訊過載，讓決策者自上而下逐層深入。
          </p>
          <ul class="key-points-list">
            <li><strong>頂部 KPI 定心丸</strong>：第一屏放置 4 張卡片（全國總人口、高齡率、秋田 vs 東京），3 秒內掌握宏觀大局。</li>
            <li><strong>雙軸聯動趨勢圖</strong>：左軸總人口（面積圖）、右軸高齡化率（折線圖），直接具象化「剪刀差」。</li>
            <li><strong>排行榜與篩選器</strong>：以橫條圖直觀展示 Top 15 人口大縣，並提供 47 縣總表與 API 實時實驗台。</li>
          </ul>
        </div>
        <div>
          <div class="code-box">
            <div class="code-header">
              <span>ECharts 雙軸配置代碼骨架</span>
              <button class="copy-code-btn" onclick="copySnippet('code4')">複製</button>
            </div>
            <pre class="code-content" id="code4">option = {{
  tooltip: {{ trigger: 'axis' }},
  yAxis: [
    {{ type: 'value', name: '總人口(萬人)' }},
    {{ type: 'value', name: '高齡化率(%)', max: 35 }}
  ],
  series: [
    {{ name: '總人口', type: 'line', areaStyle: {{}} }},
    {{ name: '高齡率', type: 'line', yAxisIndex: 1 }}
  ]
}};</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- 階段 5 -->
    <div class="stage-card">
      <div class="stage-top">
        <div class="stage-num-title">
          <span class="stage-badge">PHASE 05</span>
          <span class="stage-title">5. 最後進行分析（洞察歸納與商業/政策決策）</span>
        </div>
        <span class="stage-role-tag">角色擔當：首席決策顧問 / 商業智囊 · Storytelling & Insights</span>
      </div>
      <div class="stage-body">
        <div>
          <div class="guide-section-label">🎯 本階段核心任務與思維</div>
          <p class="guide-text">
            資料分析師最終的價值不在寫了多少行代碼，而在於<strong>「從數字中推導出什麼行動建議」</strong>。使用專業的故事線框架（現象 ➔ 成因 ➔ 衝擊 ➔ 建議）產出結論。
          </p>
          <ul class="key-points-list">
            <li><strong>現象解構</strong>：日本人口並非均勻衰退，而是呈現「外圍縣市斷崖式萎縮、東京獨木支撐」的單極集中。</li>
            <li><strong>商業決策落地</strong>：
              <br/>• <strong>房地產投資</strong>：東京圈、福岡維持穩健租金需求；秋田、高知等地需嚴控空屋折價風險。
              <br/>• <strong>長照健康產業</strong>：東北與四國地區急需導入智慧遠距醫療與自動化長照輔具。
            </li>
            <li><strong>報告產出</strong>：將儀表板結合文字論述，輸出成高階管理層報告或研究論文。</li>
          </ul>
        </div>
        <div>
          <div style="background: var(--bg-subtle); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 18px;">
            <div style="font-size: 13px; font-weight: 700; color: var(--metro-blue); margin-bottom: 6px;">💡 專業分析師的黃金報告結構：</div>
            <p style="font-size: 12.5px; color: var(--ink-secondary); line-height: 1.6;">
              <strong>1. 執行摘要 (Executive Summary)</strong>：一句話講完核心結論與數據支持。<br/>
              <strong>2. 核心圖表佐證</strong>：插入儀表板趨勢圖與極值排行榜。<br/>
              <strong>3. 商業/政策風險矩陣</strong>：指出哪些業務正面臨衝擊。<br/>
              <strong>4. 具體可行的 3 項下一步行動方案</strong>。
            </p>
          </div>
        </div>
      </div>
    </div>

  </section>

  <!-- 學員實戰檢核清單 (Interactive Student Checklist) -->
  <section class="checklist-panel">
    <div class="checklist-header">
      <div>
        <div class="checklist-title">📋 學員實作進度檢核表 (Interactive Checklist)</div>
        <p style="font-size: 13px; color: var(--ink-secondary); margin-top: 4px;">完成一個實戰步驟即可點擊打勾，追蹤您的資料分析專案進度：</p>
      </div>
      <div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; margin-bottom: 4px;">
          <span>專案完成度</span>
          <span id="progressText">0% (0/6)</span>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" id="checklistProgress"></div>
        </div>
      </div>
    </div>

    <div class="checklist-grid">
      <div class="check-item" onclick="toggleCheck(this)">
        <div class="check-box"></div>
        <div class="check-info">
          <div class="check-title">1. 取得 API 金鑰 (appId)</div>
          <div class="check-sub">成功在 e-Stat 填入 http://test.localhost 並發行金鑰</div>
        </div>
      </div>

      <div class="check-item" onclick="toggleCheck(this)">
        <div class="check-box"></div>
        <div class="check-info">
          <div class="check-title">2. 鎖定並擷取官方數據</div>
          <div class="check-sub">使用 Python 客戶端成功拉回目標統計表 JSON</div>
        </div>
      </div>

      <div class="check-item" onclick="toggleCheck(this)">
        <div class="check-box"></div>
        <div class="check-info">
          <div class="check-title">3. 完成資料清洗與特徵計算</div>
          <div class="check-sub">加工出高齡化率、年複合增長率等核心指標</div>
        </div>
      </div>

      <div class="check-item" onclick="toggleCheck(this)">
        <div class="check-box"></div>
        <div class="check-info">
          <div class="check-title">4. 發現 2 個以上核心數據亮點</div>
          <div class="check-sub">例如 2008 峰值拐點或秋田 vs 東京極值差異</div>
        </div>
      </div>

      <div class="check-item" onclick="toggleCheck(this)">
        <div class="check-box"></div>
        <div class="check-info">
          <div class="check-title">5. 建置並運行互動式儀表板</div>
          <div class="check-sub">完成雙軸圖、排行榜與即時測試面板</div>
        </div>
      </div>

      <div class="check-item" onclick="toggleCheck(this)">
        <div class="check-box"></div>
        <div class="check-info">
          <div class="check-title">6. 撰寫最終洞察與行動報告</div>
          <div class="check-sub">提煉具備商業或政策價值的決策結論</div>
        </div>
      </div>
    </div>
  </section>
</main>

<footer>
  <div>
    <strong>設計規範:</strong> Diagram Design Skill v2.6 · Parametric Process & Editorial Style System
  </div>
  <div>
    <strong>教學模組:</strong> 數據視覺化與 AI Agent 實戰營 · 學員專屬全流程指引
  </div>
</footer>

<script>
  function toggleCheck(el) {{
    el.classList.toggle('done');
    updateChecklistProgress();
  }}

  function updateChecklistProgress() {{
    const total = document.querySelectorAll('.check-item').length;
    const done = document.querySelectorAll('.check-item.done').length;
    const pct = Math.round((done / total) * 100);

    document.getElementById('checklistProgress').style.width = pct + '%';
    document.getElementById('progressText').innerText = `${{pct}}% (${{done}}/${{total}})`;
  }}

  function copySnippet(id) {{
    const text = document.getElementById(id).innerText;
    navigator.clipboard.writeText(text).then(() => {{
      alert('已複製程式碼片段至剪貼簿！');
    }});
  }}
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
