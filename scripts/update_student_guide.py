#!/usr/bin/env python3
"""
Update student_data_analyst_workflow.html with:
1. Prominent https://www.e-stat.go.jp portal banner and link in Phase 1
2. Data Atoms (7 Data Atoms framework from data_atoms.html) section
3. Cross-links and interactive styling
"""
import shutil

source_path = "/Users/chenchunchih/Desktop/數據視覺化/student_data_analyst_workflow.html"
artifact_path = "/Users/chenchunchih/.gemini/antigravity/brain/c94a8ac3-56eb-4e5b-bbf2-98acfad3ce44/student_workflow.html"

with open(source_path, "r", encoding="utf-8") as f:
    html = f.read()

# 1. Add official portal top strip right after <body>
portal_strip_html = """
<!-- 頂部官方入口指示橫條 (明確指示 e-Stat 官方門戶與直連管道) -->
<div style="background: linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%); color: #ffffff; padding: 10px 48px; font-size: 13.5px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; z-index: 101; border-bottom: 1px solid rgba(255,255,255,0.15);">
  <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
    <span style="font-weight: 700;">🏛️ 日本政府官方統計入口網站：</span>
    <a href="https://www.e-stat.go.jp" target="_blank" style="background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.4); color: #fff; padding: 4px 12px; border-radius: 4px; text-decoration: none; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; transition: background 0.2s;">
      <span style="font-family: 'Geist Mono', monospace;">https://www.e-stat.go.jp</span>
      <span>(點擊前往官網) ↗</span>
    </a>
  </div>
  <div style="display: flex; gap: 14px; align-items: center; font-size: 12px;">
    <span style="opacity: 0.9;">API 端點：<code style="background: rgba(0,0,0,0.25); padding: 2px 6px; border-radius: 3px; font-family: 'Geist Mono', monospace;">api.e-stat.go.jp/rest/3.0/app</code></span>
    <button onclick="navigator.clipboard.writeText('https://www.e-stat.go.jp'); alert('已複製 e-Stat 官網網址！');" style="background: rgba(255,255,255,0.2); border: none; color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">複製官網網址</button>
  </div>
</div>
"""

if "<!-- 頂部官方入口指示橫條" not in html:
    html = html.replace("<body>", "<body>\n" + portal_strip_html, 1)

# 2. Update navigation actions to include data_atoms.html and e-stat.go.jp
old_nav = """    <div class="nav-actions">
      <a href="japan_population_dashboard.html" class="nav-btn">📊 50年人口儀表板</a>
      <a href="estat_catalog_and_research_guide.html" class="nav-btn">🗺️ 17領域研究指南</a>
      <a href="estat_api_tutorial_simulator.html" class="nav-btn">🎥 API申請錄影教學</a>
    </div>"""

new_nav = """    <div class="nav-actions">
      <a href="japan_population_dashboard.html" class="nav-btn">📊 50年人口儀表板</a>
      <a href="estat_catalog_and_research_guide.html" class="nav-btn">🗺️ 17領域研究指南</a>
      <a href="estat_api_tutorial_simulator.html" class="nav-btn">🎥 API申請錄影教學</a>
      <a href="data_atoms.html" class="nav-btn" target="_blank" style="background: rgba(234, 88, 12, 0.08); border-color: #ea580c; color: #c2410c; font-weight: 700;">⚛️ Data Atoms 工作台</a>
      <a href="https://www.e-stat.go.jp" class="nav-btn" target="_blank" style="background: #2563eb; color: #fff; border-color: #2563eb;">🌐 e-Stat 官網 ↗</a>
    </div>"""

if old_nav in html:
    html = html.replace(old_nav, new_nav)

# 3. Enhance Phase 01 with prominent portal and registration links
old_phase1_task = """          <ul class="key-points-list">
            <li><strong>鎖定權威 ID</strong>：在 e-Stat 官方資料庫中確認主題，例如「社會・人口統計體系 (<code>0000010101</code>)」。</li>
            <li><strong>解析維度定義</strong>：先用 <code>getMetaInfo</code> 查看指標代碼（如 <code>A1101</code> 為總人口、<code>A1303</code> 為 65 歲以上長者）。</li>
            <li><strong>精準參數呼叫</strong>：在請求時直接帶入 <code>cdCat01=A1101,A1303</code>，單次取回精準數據。</li>
          </ul>"""

new_phase1_task = """          <ul class="key-points-list">
            <li><strong>鎖定權威 ID</strong>：在 e-Stat 官方資料庫中確認主題，例如「社會・人口統計體系 (<code>0000010101</code>)」。</li>
            <li><strong>解析維度定義</strong>：先用 <code>getMetaInfo</code> 查看指標代碼（如 <code>A1101</code> 為總人口、<code>A1303</code> 為 65 歲以上長者）。</li>
            <li><strong>精準參數呼叫</strong>：在請求時直接帶入 <code>cdCat01=A1101,A1303</code>，單次取回精準數據。</li>
          </ul>
          
          <div style="margin-top: 14px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: var(--radius-sm); padding: 12px 14px; font-size: 12.5px; color: #1e40af;">
            <div style="font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              <span>🔗 官方起點傳送門與避坑指南：</span>
            </div>
            <div>• 官方入口：<a href="https://www.e-stat.go.jp" target="_blank" style="color: #2563eb; font-weight: 700; text-decoration: underline;">https://www.e-stat.go.jp</a></div>
            <div>• API 申請頁：<a href="https://www.e-stat.go.jp/en/mypage/view/api" target="_blank" style="color: #2563eb; font-weight: 700; text-decoration: underline;">https://www.e-stat.go.jp/en/mypage/view/api</a></div>
            <div>• <strong>關鍵細節</strong>：登記 URL 限制嚴格，輸入 <code style="background: #dbeafe; padding: 1px 5px; border-radius: 3px; font-weight: 700;">http://test.localhost</code> 即可順利取得 <code>appId</code>！</div>
          </div>"""

if old_phase1_task in html:
    html = html.replace(old_phase1_task, new_phase1_task)

# 4. Insert the comprehensive "Data Atoms 數據原子理論與日本官方統計落地對照" Section
data_atoms_section = """
  <!-- ========================================== -->
  <!-- 核心教學模組：Data Atoms (數據原子) 實戰心法 -->
  <!-- 整合 data_atoms.html 概念與日本官方統計應用  -->
  <!-- ========================================== -->
  <section class="stage-card" style="margin-bottom: 40px; border-color: #ea580c; box-shadow: 0 4px 20px rgba(234, 88, 12, 0.08);">
    <div class="stage-top" style="background: #fff7ed; border-bottom: 1px solid #fed7aa;">
      <div class="stage-num-title">
        <span class="stage-badge" style="background: #ea580c;">FRAMEWORK</span>
        <span class="stage-title" style="color: #9a3412;">⚛️ Data Atoms（數據原子）化合分析法 · 7大視覺化原子</span>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <span class="stage-role-tag" style="border-color: #ea580c; color: #ea580c; font-weight: 700;">教學核心：模組化視覺積木</span>
        <a href="data_atoms.html" target="_blank" style="background: #ea580c; color: #fff; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 4px; text-decoration: none;">開啟 Data Atoms 工作台 ↗</a>
      </div>
    </div>
    
    <div style="padding: 26px 28px;">
      <div style="max-width: 960px; margin-bottom: 24px;">
        <h3 style="font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">
          為什麼需要「數據原子」？如何將 e-Stat 官方 API 拆解落地？
        </h3>
        <p style="font-size: 14px; color: var(--ink-secondary); line-height: 1.65;">
          在 <a href="data_atoms.html" target="_blank" style="color: #ea580c; font-weight: 700;">Data Atoms 系統架構</a> 中，任何龐大晦澀的官方統計或商業數據庫，本質上都是由 <strong>7 個基礎視覺原子</strong> 化合而成。如同化學元素表，分析師只要精確識別手上的問題型態，就能立刻選定對應的數據原子，迅速搭出高說服力的視覺化儀表板：
        </p>
      </div>

      <!-- 7 大數據原子對照卡片矩陣 -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 18px; margin-bottom: 24px;">
        
        <!-- Atom 01 -->
        <div style="background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 18px; border-left: 4px solid #3b82f6;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-family: 'Geist Mono', monospace; font-size: 12px; font-weight: 700; color: #3b82f6;">ATOM 01</span>
              <strong style="font-size: 15px; color: var(--ink-primary);">離散體量 (Bar Comparison)</strong>
            </div>
            <span style="font-size: 11px; background: #eff6ff; color: #2563eb; padding: 2px 6px; border-radius: 4px; font-weight: 600;">柱狀/條形</span>
          </div>
          <div style="font-size: 13px; color: var(--ink-secondary); margin-bottom: 10px;">
            <strong>回答問題：</strong>「哪一個行政區的人口規模最大？規模差距有多少？」
          </div>
          <div style="background: var(--bg-subtle); padding: 10px; border-radius: 4px; font-size: 12px; font-family: 'Geist Mono', monospace; color: var(--ink-primary);">
            <div><strong>e-Stat 映射:</strong> Table 0000010101 · cdCat01=A1101</div>
            <div><strong>儀表板落地:</strong> 47 都道府縣人口排行榜 (東京都 1,418 萬 vs 鳥取縣 53 萬)</div>
          </div>
        </div>

        <!-- Atom 02 -->
        <div style="background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 18px; border-left: 4px solid #10b981;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-family: 'Geist Mono', monospace; font-size: 12px; font-weight: 700; color: #10b981;">ATOM 02</span>
              <strong style="font-size: 15px; color: var(--ink-primary);">時序趨勢 (Temporal Trend)</strong>
            </div>
            <span style="font-size: 11px; background: #ecfdf5; color: #059669; padding: 2px 6px; border-radius: 4px; font-weight: 600;">折線/雙軸</span>
          </div>
          <div style="font-size: 13px; color: var(--ink-secondary); margin-bottom: 10px;">
            <strong>回答問題：</strong>「日本總人口哪一年迎來拐點？高齡化增速呈現什麼斜率？」
          </div>
          <div style="background: var(--bg-subtle); padding: 10px; border-radius: 4px; font-size: 12px; font-family: 'Geist Mono', monospace; color: var(--ink-primary);">
            <div><strong>e-Stat 映射:</strong> time=1975-2024 · A1101 (總人口) + A1303 (65歲+)</div>
            <div><strong>儀表板落地:</strong> 半世紀雙軸趨勢圖 (2008年達到 1.28 億頂峰後發散剪刀差)</div>
          </div>
        </div>

        <!-- Atom 03 -->
        <div style="background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 18px; border-left: 4px solid #ea580c;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-family: 'Geist Mono', monospace; font-size: 12px; font-weight: 700; color: #ea580c;">ATOM 03</span>
              <strong style="font-size: 15px; color: var(--ink-primary);">相關分佈 (Correlation Matrix)</strong>
            </div>
            <span style="font-size: 11px; background: #fff7ed; color: #ea580c; padding: 2px 6px; border-radius: 4px; font-weight: 600;">散佈矩陣</span>
          </div>
          <div style="font-size: 13px; color: var(--ink-secondary); margin-bottom: 10px;">
            <strong>回答問題：</strong>「人口越少的地方，高齡化率是否必然越高？大都市有保護罩嗎？」
          </div>
          <div style="background: var(--bg-subtle); padding: 10px; border-radius: 4px; font-size: 12px; font-family: 'Geist Mono', monospace; color: var(--ink-primary);">
            <div><strong>e-Stat 映射:</strong> X軸=總人口 (萬人), Y軸=高齡化率 (%), 點大小=65歲以上數</div>
            <div><strong>儀表板落地:</strong> 散佈矩陣 (驗證都市規模與老齡化率的強烈負相關趨勢)</div>
          </div>
        </div>

        <!-- Atom 04 -->
        <div style="background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 18px; border-left: 4px solid #8b5cf6;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-family: 'Geist Mono', monospace; font-size: 12px; font-weight: 700; color: #8b5cf6;">ATOM 04</span>
              <strong style="font-size: 15px; color: var(--ink-primary);">結構佔比 (Composition Donut)</strong>
            </div>
            <span style="font-size: 11px; background: #f5f3ff; color: #7c3aed; padding: 2px 6px; border-radius: 4px; font-weight: 600;">環形/堆疊</span>
          </div>
          <div style="font-size: 13px; color: var(--ink-secondary); margin-bottom: 10px;">
            <strong>回答問題：</strong>「現代日本社會的三大世代（幼年、勞動力、長者）各佔幾成？」
          </div>
          <div style="background: var(--bg-subtle); padding: 10px; border-radius: 4px; font-size: 12px; font-family: 'Geist Mono', monospace; color: var(--ink-primary);">
            <div><strong>e-Stat 映射:</strong> A1301 (0-14歲) / A1302 (15-64歲) / A1303 (65歲+)</div>
            <div><strong>儀表板落地:</strong> 年齡三世代環形圖 (幼年 11.4% vs 勞動 59.3% vs 長者 29.3%)</div>
          </div>
        </div>

        <!-- Atom 05 -->
        <div style="background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 18px; border-left: 4px solid #ec4899;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-family: 'Geist Mono', monospace; font-size: 12px; font-weight: 700; color: #ec4899;">ATOM 05</span>
              <strong style="font-size: 15px; color: var(--ink-primary);">多維畫像 (Radar Profile)</strong>
            </div>
            <span style="font-size: 11px; background: #fdf2f8; color: #db2777; padding: 2px 6px; border-radius: 4px; font-weight: 600;">多軸雷達</span>
          </div>
          <div style="font-size: 13px; color: var(--ink-secondary); margin-bottom: 10px;">
            <strong>回答問題：</strong>「東京（青年流入極）與秋田（超高齡極）在多項指標上的形貌差異？」
          </div>
          <div style="background: var(--bg-subtle); padding: 10px; border-radius: 4px; font-size: 12px; font-family: 'Geist Mono', monospace; color: var(--ink-primary);">
            <div><strong>e-Stat 映射:</strong> 高齡化率、扶養比、人口總量、少子化指數、勞動供給力</div>
            <div><strong>儀表板落地:</strong> 雙層雷達圖 (對比東京擴張型畫像 vs 秋田收縮型畫像)</div>
          </div>
        </div>

        <!-- Atom 06 & 07 Combined -->
        <div style="background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 18px; border-left: 4px solid #0284c7;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-family: 'Geist Mono', monospace; font-size: 12px; font-weight: 700; color: #0284c7;">ATOM 06 & 07</span>
              <strong style="font-size: 15px; color: var(--ink-primary);">轉化漏斗與矩陣總覽 (Funnel & Matrix)</strong>
            </div>
            <span style="font-size: 11px; background: #f0f9ff; color: #0284c7; padding: 2px 6px; border-radius: 4px; font-weight: 600;">漏斗/KPI卡</span>
          </div>
          <div style="font-size: 13px; color: var(--ink-secondary); margin-bottom: 10px;">
            <strong>回答問題：</strong>「決策層前 3 秒需要掌握什麼？實質勞動人口轉化階梯如何？」
          </div>
          <div style="background: var(--bg-subtle); padding: 10px; border-radius: 4px; font-size: 12px; font-family: 'Geist Mono', monospace; color: var(--ink-primary);">
            <div><strong>e-Stat 映射:</strong> 全國總人口 ➔ 勞動年齡 ➔ 就業勞動力 ➔ 高產值專業人才</div>
            <div><strong>儀表板落地:</strong> 4大頂部定心丸卡片 + 勞動轉化流失階梯分析</div>
          </div>
        </div>

      </div>

      <!-- 學員動手操練建議 -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: var(--radius-md); padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
        <div style="font-size: 13px; color: #334155;">
          <strong>💡 學員實戰錦囊：</strong> 在動手寫代碼前，請先拿出紙筆，畫下你要使用的 2~3 個數據原子組合（例如：<strong>時序趨勢 + 離散體量 + 相關分佈</strong>），這樣能確保做出的儀表板邏輯嚴密、直擊痛點！
        </div>
        <a href="japan_population_dashboard.html" class="nav-btn" style="background: #2563eb; color: #fff; border-color: #2563eb; font-weight: 700;">進入儀表板查看 7 原子實作 ➔</a>
      </div>
    </div>
  </section>
"""

# Insert before the checklist
if "<!-- 學員實戰檢核清單 (Interactive Student Checklist) -->" in html:
    html = html.replace(
        "<!-- 學員實戰檢核清單 (Interactive Student Checklist) -->",
        data_atoms_section + "\n  <!-- 學員實戰檢核清單 (Interactive Student Checklist) -->"
    )

with open(source_path, "w", encoding="utf-8") as f:
    f.write(html)

with open(artifact_path, "w", encoding="utf-8") as f:
    f.write(html)

print("Successfully updated student_data_analyst_workflow.html and student_workflow.html artifact!")
