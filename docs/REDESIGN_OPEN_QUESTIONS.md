# 重整過程待決事項

## 1. 個資
- 依你的指示，**尚未移除任何含個資的檔案**，掃描清單見 `docs/PII_SCAN_REPORT.md`。
- 待你決定：是否從工作樹與 git 歷史移除（歷史清除需 force push，由擁有者執行）。

## 2. 重複頁（P5，已處理）
- `data_analysis.html` → 轉址到 `student_data_analyst_workflow.html`（兩檔原本內容完全相同）。
- `llm_lab.html` → 轉址到 `00_LLM本質探秘實驗室.html`。兩檔只差一個「互動實驗」連結與底部浮動列位置，保留內容較完整者。

## 3. 壞連結（P5，已處理）
- `00_LLM本質探秘實驗室.html` 的 5 個目標（`00_LLM_Token與模型全景圖譜.html`、`diagram_api_security_architecture.html`、`diagram_arithmetic_code_pipeline.html`、`diagram_prompt_injection_defense.html`、`prompt_injection_metro_case.html`）在 `dist_public_web/` 找到同名檔，已改連到該處。

## 4. 製作素材（建議由你決定）
以下目錄與網站無關，但佔 repo 體積；未刪除，建議移到另一個 repo 或 GitHub Release：
`videos/`（176 MB）、`motion_cursor_demo/`（28 MB）、`preview_frames/`（25 MB）、`voice_*/`（合計約 50 MB，含 `.pcm`）、`earshot_sfx/`。
根目錄原有 31 個 mp4／wav：15 個實體檔已搬到 `media/`；另 16 個是指向 `videos/` 的符號連結（GitHub Pages 不會跟隨），已移除並把引用直接改指 `videos/`。引用已同步更新（`videos.html`、`concepts/*`、`scripts/*`、docs）。

## 5. 與規格不同之處
- `data_atoms.html` 仍保留約 49 處 `#2563eb`（維度欄位的藍色語意，Tableau 慣例）。依規格「會影響圖表配色就不要換」，QA 對此頁不檢查藍色。
- 尚有 Google Fonts 的頁面：`00_LLM本質探秘實驗室.html`、`01_Module1_AI_Frontier_...html`、`strawberry_token_60s.html`、`memory_context_60s.html`（影片播放頁與舊實驗室），以及 `dist_public_web/`、`src/`、`motion_*` 內的舊版或渲染來源檔。不在規格列出的頁面範圍，未動。
- 規格 §6.2「預估時間」未填：原教材沒有各步驟的分鐘數，不亂編。
- `dist_public_web/` 是舊版站台副本，內容與新版不同步，建議確認是否仍在使用。

---

# V2（第二輪，2026-11-10）

規格：`docs/specs/SITE_REDESIGN_SPEC_V2.md`。以下是照預設值做的決定，以及沒有照規格做完的地方。

## 照預設值做的決定（要改請告知）
1. **時程（Module 1–4）與資料分析實作路線的關係**：沒有替內容下結論。兩者並列在 `workshop.html`；要對應的話在 `js/site-config.js` 的 `steps[n].module` 填 1–4，時程列會自動出現「本時段實作」連結。
2. **網站名稱**維持「大語言模型學習地圖」，已抽成 `SITE_CONFIG.site`，改一處即可。
3. **數位乩童頭像**只留在 `videos.html`，首頁已移除。
4. **未引用的素材**沒有移動或刪除，清單見 `docs/UNREFERENCED_MEDIA.md`（約 325 MB）。

## 與規格不同之處
- **步驟由 5 改 4**：`curriculum_1105_workflow.html` 改為參考資料「全日課程架構圖」；Skill／MCP 目錄拆到新頁 `skills.html`（舊錨點 `#skills-catalog`、`#mcp-catalog` 會自動轉過去）。
- **AI 盲點 #07–#12**：原本只在實驗頁出現，這次一併放進 `videos.html`（影片檔本來就在 `videos/ai_blindspots/`）。
- **圖表配色未換**：`japan_population_dashboard.html` 的 ECharts 系列色（藍／磚紅／琥珀）是資料語意色，維持原樣；只換了版面上的藍色橫幅、橘色按鈕與標籤。
- **兩支動畫播放頁**（`strawberry_token_60s.html`、`memory_context_60s.html`）沒有動：它們同時是影片的渲染來源（`scripts/render_*`），改字體或加導覽列會影響重新輸出的影片。仍載入 Google Fonts。
- **`js/lab.js` 的實驗互動區**還有約 58 處 inline style（各實驗的操作面板），只把紫色換成網站主色，沒有逐一改成 class。
- **`topics/*.html` 的 inline style**（約 547 處）沒有清：屬於不影響畫面的整理，留待之後。
- **`data_atoms.html`** 只改了頂部按鈕主次與小螢幕提示；工具內的 emoji 圖示與維度／度量配色沒動。
- **操作手冊**：直接對現有 `data_atoms_manual.html` 抽圖（2.4 MB → 約 190 KB），並新增 `scripts/extract_manual_images.py`；重新產生手冊後要再跑一次（見 `docs/MANUAL_BUILD.md`）。該頁有嚴格 CSP，所以沒有加共用頁首。
- **舊頁**：`00_LLM本質探秘實驗室.html`、`01_Module1_AI_Frontier_…html` 改為轉址（分別到 `lab.html`、`encyclopedia.html`），原檔在 `docs/legacy/`。舊實驗室的 8 個分頁沒有逐一比對新實驗頁是否完全涵蓋。
- **根目錄的 `.py` 與 PNG** 沒有搬動（未確認是否有外部教材引用）。
- **「點擊」** 沒有全站改成「點／按」（臺灣也通用，不值得冒改壞互動文字的風險）。
