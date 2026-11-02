# -*- coding: utf-8 -*-
import json, re

# 1. Load base from /tmp/reconstructed_data_atoms.html
with open('/tmp/reconstructed_data_atoms.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 2. Update Topbar to 5 steps (with 4 and 5 in correct order: 4 is 17 domains, 5 is data atoms)
topbar_html = """  <!-- 頂部官方入口與五階段分析步驟指示橫條 -->
  <div class="portal-top-bar">
    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
      <span style="background: #2563eb; color: #fff; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.05em;">DATA ANALYTICS TRACK</span>
      <span style="font-weight: 700; color: #f1f5f9; font-size: 13px;">資料分析實戰步驟：</span>
      
      <!-- 步驟 1: 全日架構圖 -->
      <a href="curriculum_1105_workflow.html" target="_blank" style="color: #93c5fd; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 4px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);" title="今天整天學什麼">
        <span>① 全日課程架構</span>
        <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17L17 7M7 7h10v10"/></svg>
      </a>

      <!-- 步驟 2: 資料分析師工作流程 -->
      <a href="student_data_analyst_workflow.html" target="_blank" style="color: #93c5fd; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 4px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);" title="Antigravity 完整實戰流程">
        <span>② 分析師完整工作流</span>
        <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17L17 7M7 7h10v10"/></svg>
      </a>

      <!-- 步驟 3: 日本資料與 API 申請教學 -->
      <a href="estat_api_tutorial_simulator.html" target="_blank" style="color: #fde047; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 4px; background: rgba(255,255,255,0.08); border: 1px solid rgba(253,224,71,0.35);" title="介紹日本資料與 API 申請避坑">
        <span>③ 日本資料與 API 申請</span>
        <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17L17 7M7 7h10v10"/></svg>
      </a>

      <!-- 步驟 4: 17 領域研究指南與圖像化分析法 -->
      <a href="estat_catalog_and_research_guide.html" target="_blank" style="color: #86efac; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 4px; background: rgba(255,255,255,0.08); border: 1px solid rgba(134,239,172,0.35);" title="資料分析完後的研究指南與 10 大實戰視覺化分析法">
        <span>④ 17 領域與圖像化研究指南</span>
        <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17L17 7M7 7h10v10"/></svg>
      </a>

      <!-- 步驟 5: Data Atoms 儀表板實作 (當前頁面) -->
      <span style="background: #0284c7; color: #fff; font-size: 12px; font-weight: 700; padding: 3px 9px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 0 0 1px rgba(255,255,255,0.2);">
        <span>⑤ Data Atoms 儀表板實作 (當前)</span>
      </span>
    </div>

    <!-- 右側：官方網站直連與技能彈窗 -->
    <div style="display: flex; gap: 10px; align-items: center; font-size: 12px;">
      <button type="button" class="btn btn-sm" id="btnOpenSkillsModalTop" onclick="document.getElementById('skillsModal').classList.add('open')" style="background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25); color: #fff; padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
        <span>💡 Skills 技能庫</span>
      </button>

      <span style="color: #94a3b8;">官方直連：</span>
      <a href="https://www.e-stat.go.jp" target="_blank" style="background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.25); color: #fff; padding: 3px 10px; border-radius: 4px; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 5px;">
        <span style="font-family: monospace;">e-Stat 官網</span>
        <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17L17 7M7 7h10v10"/></svg>
      </a>
      <button onclick="navigator.clipboard.writeText('https://www.e-stat.go.jp'); alert('已複製 e-Stat 官方網址！');" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #cbd5e1; padding: 3px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">複製網址</button>
    </div>
  </div>"""

# Replace existing portal-top-bar
old_bar_start = html.find('<div class="portal-top-bar">')
if old_bar_start != -1:
    old_bar_end = html.find('</div>\n  </div>', old_bar_start)
    if old_bar_end != -1:
        old_bar_end += len('</div>\n  </div>')
        html = html[:old_bar_start] + topbar_html + html[old_bar_end:]
    else:
        # try find closing tag
        old_bar_end2 = html.find('</div>\n  </div>', old_bar_start)
        pass

# 3. Add Skills Modal
skills_modal_html = """
  <!-- 5. Skills Overview Modal (Data Atoms 視覺化所封裝之 Antigravity Skill 全集與開源倉庫) -->
  <div class="briefing-modal-overlay" id="skillsModal">
    <div class="briefing-modal-card" style="max-width: 920px; max-height: 88vh; overflow-y: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 20px 45px rgba(0,0,0,0.25);">
      <div class="modal-head" style="background: #0f172a; color: #ffffff; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; border-radius: 12px 12px 0 0;">
        <div class="modal-head-title" style="display: flex; align-items: center; gap: 10px;">
          <span style="background: #2563eb; color: #ffffff; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 4px; letter-spacing: 0.05em;">ANTIGRAVITY SKILLS</span>
          <span style="font-size: 17px; font-weight: 700;">Data Atoms 視覺化所封裝之核心 Skill 與開源架構</span>
        </div>
        <button type="button" class="modal-close-btn" id="btnCloseSkillsModal" onclick="document.getElementById('skillsModal').classList.remove('open')" style="background: transparent; border: none; color: #ffffff; font-size: 24px; cursor: pointer; line-height: 1;">×</button>
      </div>

      <div style="padding: 24px 28px; color: #1e293b; font-size: 14px; line-height: 1.6;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
          <p style="margin: 0; color: #334155; font-size: 13.5px; line-height: 1.6;">
            <strong>🎯 獨立檔案定位說明：</strong>本檔案（<code>data_atoms.html</code>）是數據視覺化與實戰分析的<strong>單一獨立檔案</strong>，與大語言模型學習地圖嚴格分開。<br>
            在 Antigravity 代理人架構中，本工作台是由以下 <strong>6 大模組化 Skill</strong> 共同驅動，所有 Skill 皆已附上開源倉庫連結供學員參考與延伸學習：
          </p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr; gap: 16px;">
          
          <!-- Skill: data-analyst (輕量級資料分析師技能包) -->
          <div style="background: #ffffff; border: 1.5px solid #059669; border-radius: 8px; padding: 16px 20px; box-shadow: 0 2px 6px rgba(5,150,105,0.08);">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 18px;">💡</span>
                <span style="font-weight: 800; font-size: 16px; color: #047857;">data-analyst</span>
                <span style="background: #d1fae5; color: #065f46; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 4px;">分析師 Prompt + 清洗腳本</span>
              </div>
              <span style="font-size: 12px; color: #64748b; font-family: monospace;">.agents/skills/data-analyst</span>
            </div>
            <p style="margin: 0 0 10px 0; color: #334155; font-size: 13px;">
              <strong>放了什麼進去：</strong>專為學員與 Agent 設計的輕量標準技能。內建 4 大標準 Prompt 樣板（需求界定、資料體檢、EDA 探索、三段論報告）、<code>clean_data.py</code> 自動化資料清洗腳本（處理千分位逗號、百分比、空白修剪與缺失值）與速查表。
            </p>
            <div style="font-size: 12px; color: #475569; display: flex; align-items: center; gap: 6px;">
              <strong>開源獨立倉庫：</strong>
              <a href="https://github.com/nutcelvischen-jpg/data-analyst-skill" target="_blank" style="color: #059669; font-weight: 700; text-decoration: underline;">https://github.com/nutcelvischen-jpg/data-analyst-skill ↗</a>
            </div>
          </div>
          
          <!-- Skill 1: data-atoms-dashboard -->
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px 20px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 18px;">⚛️</span>
                <span style="font-weight: 800; font-size: 16px; color: #1e293b;">data-atoms-dashboard</span>
                <span style="background: #eff6ff; color: #1d4ed8; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 4px;">本工作台核心</span>
              </div>
              <span style="font-size: 12px; color: #64748b; font-family: monospace;">.agents/skills/data-atoms-dashboard</span>
            </div>
            <p style="margin: 0 0 10px 0; color: #334155; font-size: 13px;">
              <strong>放了什麼進去：</strong>Tableau-like 視覺編碼槽（Columns、Rows、Color、Size、Secondary、Filters）、Tableau Prep 智慧資料分類判定引擎、跨國地理座標自適應引擎，與 10 大 Data Atoms 渲染。
            </p>
            <div style="font-size: 12px; color: #475569; display: flex; align-items: center; gap: 6px;">
              <strong>開源獨立倉庫：</strong>
              <a href="https://github.com/nutcelvischen-jpg/data-atoms-dashboard" target="_blank" style="color: #2563eb; font-weight: 700; text-decoration: underline;">https://github.com/nutcelvischen-jpg/data-atoms-dashboard ↗</a>
            </div>
          </div>

          <!-- Skill 2: dataviz -->
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px 20px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 18px;">🎨</span>
                <span style="font-weight: 800; font-size: 16px; color: #1e293b;">dataviz</span>
                <span style="background: #f1f5f9; color: #475569; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 4px;">工業級設計法規</span>
              </div>
              <span style="font-size: 12px; color: #64748b; font-family: monospace;">.gemini/config/skills/dataviz</span>
            </div>
            <p style="margin: 0 0 10px 0; color: #334155; font-size: 13px;">
              <strong>放了什麼進去：</strong>去除 AI 生硬味的工業級圖表設計法規。規範 0 基準線、雙軸刻度對齊、WCAG AA 色彩對比度、冷灰/藏青/暖琥珀色盤。
            </p>
            <div style="font-size: 12px; color: #475569; display: flex; align-items: center; gap: 6px;">
              <strong>開源規範倉庫：</strong>
              <a href="https://github.com/nutcelvischen-jpg/dataviz-rules" target="_blank" style="color: #2563eb; font-weight: 700; text-decoration: underline;">https://github.com/nutcelvischen-jpg/dataviz-rules ↗</a>
            </div>
          </div>

          <!-- Skill 3: dataviz-motion -->
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px 20px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 18px;">🎬</span>
                <span style="font-weight: 800; font-size: 16px; color: #1e293b;">dataviz-motion</span>
                <span style="background: #fdf2f8; color: #be185d; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 4px;">動態影音生成</span>
              </div>
              <span style="font-size: 12px; color: #64748b; font-family: monospace;">.gemini/config/skills/dataviz-motion</span>
            </div>
            <p style="margin: 0 0 10px 0; color: #334155; font-size: 13px;">
              <strong>放了什麼進去：</strong>全自動程式碼控制影格，將數據分析圖表輸出為 1080p 60FPS Bauhaus 風格動態簡報，合成 120BPM 卡點音效與 Google TTS 語音旁白。
            </p>
            <div style="font-size: 12px; color: #475569; display: flex; align-items: center; gap: 6px;">
              <strong>開源底層引擎：</strong>
              <a href="https://github.com/remotion-dev/remotion" target="_blank" style="color: #2563eb; font-weight: 700; text-decoration: underline;">https://github.com/remotion-dev/remotion ↗</a>
            </div>
          </div>

          <!-- Skill 4: diagram-design -->
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px 20px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 18px;">📐</span>
                <span style="font-weight: 800; font-size: 16px; color: #1e293b;">diagram-design</span>
                <span style="background: #fefce8; color: #854d0e; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 4px;">架構流程圖</span>
              </div>
              <span style="font-size: 12px; color: #64748b; font-family: monospace;">.agents/skills/diagram-design</span>
            </div>
            <p style="margin: 0 0 10px 0; color: #334155; font-size: 13px;">
              <strong>放了什麼進去：</strong>產出資料分析師 5 階段工程流程圖（取得 ➔ 清洗 ➔ 探索 ➔ 儀表板 ➔ 洞察決策）與 11/05 實戰營流程時序圖。
            </p>
            <div style="font-size: 12px; color: #475569; display: flex; align-items: center; gap: 6px;">
              <strong>開源依據：</strong>
              <a href="https://github.com/mermaid-js/mermaid" target="_blank" style="color: #2563eb; font-weight: 700; text-decoration: underline;">https://github.com/mermaid-js/mermaid ↗</a>
            </div>
          </div>

          <!-- Skill 5: deeptutor-mentor -->
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px 20px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 18px;">🎓</span>
                <span style="font-weight: 800; font-size: 16px; color: #1e293b;">deeptutor-mentor</span>
                <span style="background: #f0fdf4; color: #15803d; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 4px;">自主學習 AI 導師</span>
              </div>
              <span style="font-size: 12px; color: #64748b; font-family: monospace;">.agents/skills/deeptutor-mentor</span>
            </div>
            <p style="margin: 0 0 10px 0; color: #334155; font-size: 13px;">
              <strong>放了什麼進去：</strong>蘇格拉底式引導教學系統。學員即使身邊沒有老師，也能透過 3 階漸進提示（不直接給代碼，先拆解思維與欄位架構）和 Error Doctor 自學搞定 Data Atoms。
            </p>
            <div style="font-size: 12px; color: #475569; display: flex; align-items: center; gap: 6px;">
              <strong>開源依據：</strong>
              <a href="https://github.com/HKUDS/DeepTutor" target="_blank" style="color: #2563eb; font-weight: 700; text-decoration: underline;">HKUDS/DeepTutor (香港大學) ↗</a>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
"""

# 4. Add Multi-Measure Modal
multi_measure_modal_html = """
  <!-- Multi-Measure Comparison Modal (多指標並列比較選取器) -->
  <div class="briefing-modal-overlay" id="multiMeasureModal">
    <div class="briefing-modal-card" style="max-width: 680px; max-height: 85vh; overflow-y: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 20px 45px rgba(0,0,0,0.25);">
      <div class="modal-head" style="background: #1e293b; color: #ffffff; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-radius: 12px 12px 0 0;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="background: #ea580c; color: #fff; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 4px;">MULTI-MEASURE</span>
          <span style="font-size: 16px; font-weight: 700;">多數值指標並列比較 (支援 2~4+ 指標同圖繪製)</span>
        </div>
        <button type="button" onclick="document.getElementById('multiMeasureModal').classList.remove('open')" style="background: transparent; border: none; color: #fff; font-size: 22px; cursor: pointer;">✕</button>
      </div>

      <div style="padding: 20px 24px;">
        <p style="font-size: 13px; color: #475569; margin: 0 0 16px 0; line-height: 1.5;">
          選取 2 個或多個連續數值指標以在折線圖（多線走勢）、柱狀圖（分組並列）或散布圖（X vs Y 相關性）進行深度比對。
        </p>

        <!-- 一鍵快速對比預設 -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 18px;">
          <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">⚡ 常用熱門對比組合 (一鍵套用)：</div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <button type="button" class="btn btn-sm btn-outline" onclick="window.PyGWalker.applyMeasurePreset(['幼年人口占比(%)', '勞動人口占比(%)'])" style="font-size: 12px; font-weight: 600; border-color: #2563eb; color: #1d4ed8;">
              👶 vs 💼 幼年 vs 勞動人口占比 (2指標)
            </button>
            <button type="button" class="btn btn-sm btn-outline" onclick="window.PyGWalker.applyMeasurePreset(['幼年人口占比(%)', '勞動人口占比(%)', '老年人口占比(%)'])" style="font-size: 12px; font-weight: 600; border-color: #ea580c; color: #c2410c;">
              📊 三世代全景：幼年 vs 勞動 vs 老年 (3指標)
            </button>
            <button type="button" class="btn btn-sm btn-outline" onclick="window.PyGWalker.applyMeasurePreset(['總人口(人)', '15-64歲勞動力人口(人)', '65歲以上高齡人口(人)'])" style="font-size: 12px; font-weight: 600;">
              👥 總體量 vs 勞動力 vs 高齡體量 (3指標)
            </button>
          </div>
        </div>

        <!-- 指標勾選清單 -->
        <div style="margin-bottom: 18px;">
          <div style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 8px;">自選指標清單 (可多選)：</div>
          <div id="multiMeasureCheckboxList" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-height: 220px; overflow-y: auto; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; background: #fff;">
            <!-- 動態注入 -->
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 14px;">
          <button type="button" class="btn btn-sm btn-ghost" onclick="window.PyGWalker.resetMultiMeasure()" style="color: #64748b;">重設為單一指標</button>
          <div style="display: flex; gap: 10px;">
            <button type="button" class="btn btn-sm btn-outline" onclick="document.getElementById('multiMeasureModal').classList.remove('open')">取消</button>
            <button type="button" class="btn btn-sm btn-primary" onclick="window.PyGWalker.confirmMultiMeasure()" style="background: #2563eb; color: #fff;">套用指標比較 ➔</button>
          </div>
        </div>
      </div>
    </div>
  </div>
"""

# Inject modals before closing body
if 'id="skillsModal"' not in html:
    html = html.replace('</body>', skills_modal_html + '\n' + multi_measure_modal_html + '\n</body>', 1)
elif 'id="multiMeasureModal"' not in html:
    html = html.replace('</body>', multi_measure_modal_html + '\n</body>', 1)

# Write to data_atoms.html
with open('data_atoms.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Generated restored and enhanced data_atoms.html successfully! Size:", len(html), "lines:", len(html.splitlines()))
