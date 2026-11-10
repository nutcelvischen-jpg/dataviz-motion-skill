# SITE_REDESIGN_SPEC.md — 教學網站整併與 UX/UI 重整規格

> 對象：負責實作的 coding agent（Claude Sonnet 5.5）
> Repo：`nutcelvischen-jpg/dataviz-motion-skill`（GitHub Pages，從 repo 根目錄發佈，有 `.nojekyll`）
> 撰寫日期：2026-11-10
> 語言：所有介面文字使用**繁體中文、臺灣用語**（不要用「視頻、信息、質量、用戶、默認、鏈接」等詞）。

---

## 0. 給實作者的工作規則（先讀）

1. **依 Phase 順序做，一個 Phase 一個 commit**，commit message 格式：`redesign(P{n}): {摘要}`。每個 Phase 做完都要跑 §9 的驗收腳本，全部通過才進下一個 Phase。
2. **不要改壞既有網址。** 任何被移動、改名、合併的頁面，原路徑都要留一個 redirect stub（見 §8.3 範本）。
3. **不要改這些 localStorage key**（會讓學生的進度／金鑰消失）：
   `llm_learning_progress_v1`、`data_atoms_studio_state_v1`、`llm_lab_provider`、`llm_lab_gemini_key`、`llm_lab_openrouter_key`、`llm_lab_openrouter_model`。
4. **不要重寫 Data Atoms（`data_atoms.html`）的圖表邏輯**，只動外殼（頂部列、浮動元件、字體與色彩變數）。
5. **不要動** `index.html` 開頭那段 `oldAnchors` 轉址 script 的行為（可以搬到共用 js，但對應表不變）。
6. 遇到規格沒寫到、又會影響內容意義的決定，**停下來列在 `docs/REDESIGN_OPEN_QUESTIONS.md`**，不要自己猜。
7. 每個 Phase 結束時，截圖放到 `docs/redesign-screenshots/P{n}/`（desktop 1440×900、mobile 390×844），檔名用頁面名稱。

---

## 1. 現況診斷（為什麼要改）

| # | 問題 | 證據 |
|---|---|---|
| D1 | **一個 repo 塞了三個產品、三套視覺**：①LLM 學習地圖（奶油紙色編輯風）②11/05 工作坊路線（深綠 dose 風 + 藍色按鈕）③工作坊看板（藍色漸層 + 深紫卡片 + emoji）。使用者每點一次就換一個網站。 | `index.html` vs `curriculum_1105_workflow.html` vs `00_課程手冊與即時看板/WORKSHOP_BOARD.html` |
| D2 | **首頁焦點分散**：hero 有 4 個 CTA；「11/05 實戰課程藍圖」在同一頁出現 **4 次**（導覽列、hero 連結、藍色橫幅、延伸閱讀），全部用 inline 藍色 `#2563eb`，與奶油色系衝突。 | `index.html` 有 11 處 `style=` |
| D3 | **工作坊流程沒有被網站本身表達**：課表只寫在 README；學生要「在 Finder 雙擊」開看板；5 個工作坊步驟頁各自用不同導覽列。 | README「課程時程總覽」、各頁頂部列 |
| D4 | **「11/05」日期寫死**在檔名、標題、按鈕上，下一梯次就過期。 | `curriculum_1105_workflow.html` |
| D5 | **數位乩童浮動元件**出現在 8 頁，蓋住內容（Data Atoms 右下角的圖表、首頁右側概念圖）。 | `js/digital_jitong.js` |
| D6 | **手機版導覽列斷行**：第 4 個項目「11/05 實戰課程藍圖 🚀」掉到第二行，孤立且被截斷。 | 390px 截圖 |
| D7 | **單站課程頁開頭太囉嗦**：標題下連續 3 列連結（動手試/看解說/確認理解、概念全圖、影片）才進入內容。 | `learn.html?lesson=01` |
| D8 | **字體過多**：全站載入 8 種 Google Fonts（Instrument Serif、Geist Mono、Plus Jakarta Sans、DM Mono、Noto Sans TC、Schibsted Grotesk、JetBrains Mono、Geist）。 | grep fonts.googleapis |
| D9 | **重複頁與壞連結**：`data_analysis.html` 與 `student_data_analyst_workflow.html` 內容完全相同；`llm_lab.html` 與 `00_LLM本質探秘實驗室.html` 幾乎相同；兩者都連到 5 個不存在的檔案（`00_LLM_Token與模型全景圖譜.html`、`diagram_*.html`、`prompt_injection_metro_case.html`）。 | link check |
| D10 | **Repo 太重**：根目錄 315 MB 的 mp4/wav；`voice_*`、`preview_frames/`、`motion_cursor_demo/` 等製作素材與網站混在一起；根目錄 26 個 HTML。 | `du` |
| D11 | **⚠️ 個資外洩**：`workshop_registration_dashboard.html` 內含約 106 個 email、75 支手機號碼，公開在 GitHub Pages 上。 | grep |
| D12 | cache-busting 版本號不一致（`index.html` 用 `learning.js?v=12`，`learn.html` 用 `v=11`）。 | head 標籤 |

---

## 2. 目標與原則

**一句話目標**：讓任何人打開首頁 5 秒內知道「我是哪一種使用者、下一步點哪裡」，而且整站看起來是**同一個網站**。

原則（延續 `PRODUCT.md`、`DESIGN.md`，不推翻）：
- 奶油紙色編輯風是**唯一**視覺系統（`DESIGN.md` 已選定，不換色）。
- 每頁只有**一個**主要行動（primary button），其他都是次要連結。
- 學生永遠知道：我在哪裡（麵包屑／步驟列）、這頁要做什麼（一句話）、下一步（頁尾 prev/next）。
- 投影可讀：工作坊相關頁要有「投影模式」。

---

## 3. 新資訊架構（IA）

### 3.1 頂層導覽（全站一致，4 項）

| 導覽文字 | 連到 | 說明 |
|---|---|---|
| 跟著學 | `index.html#learning-map` | 六站課程 |
| 查概念 | `encyclopedia.html` | 概念目錄 |
| 做實驗 | `lab.html` | 互動實驗＋60 秒 AI 盲點影片 |
| 工作坊 | `workshop.html`（**新頁**） | 一日工作坊的所有東西 |

- 品牌區（左）：沿用「學」字方塊 + 「大語言模型 / 學習地圖」。
- 導覽列**禁止**放 emoji、日期、彩色字。
- 影片系列（`videos.html`）從首頁、`lab.html`、頁尾連入，不進頂層導覽。

### 3.2 工作坊路線（新的線性步驟）

工作坊頁群統一套用「步驟列」元件（§5.4），順序固定：

| 步驟 | 標題（新） | 檔案（不改檔名） |
|---|---|---|
| 0 | 工作坊總覽 | `workshop.html`（新） |
| 1 | 全日課程架構 | `curriculum_1105_workflow.html` |
| 2 | 分析師工作流 | `student_data_analyst_workflow.html` |
| 3 | 申請 e-Stat API | `estat_api_tutorial_simulator.html` |
| 4 | 17 領域研究指南 | `estat_catalog_and_research_guide.html` |
| 5 | Data Atoms 儀表板 | `data_atoms.html` |

「參考資料」（不算步驟，放在 `workshop.html` 的「參考」區與步驟列右側的「參考 ▾」選單）：
`system_architecture.html`（GitHub + GAS 系統架構）、`openrouter_architecture.html`（OpenRouter 三階資料流）、`japan_population_dashboard.html`、e-Stat 官網、data-analyst 技能倉庫。

### 3.3 日期改為設定值

新增 `js/site-config.js`：

```js
window.SITE_CONFIG = {
  workshop: {
    title: '一天打造你的 AI 工作流',
    nextDate: '2026-11-05',      // 只改這裡
    dateLabel: '11/05',          // 顯示用
    instructor: '陳俊智 副教授'
  },
  assetVersion: '20261110'       // 全站 cache-busting 統一版本
};
```

所有畫面上的「11/05」改為從 `SITE_CONFIG.workshop.dateLabel` 讀取；**檔名 `curriculum_1105_workflow.html` 保留**（避免舊連結失效），但頁面標題改為「全日課程架構」。

---

## 4. 設計系統（單一來源）

### 4.1 新增 `css/tokens.css`（所有頁面第一個載入）

從 `css/content-layout.css` 抽出既有值，不發明新色：

```css
:root {
  /* 色彩：沿用 DESIGN.md */
  --paper: #f7f5ee;        /* 頁面底 */
  --surface: #fffefa;      /* 內容底、卡片底 */
  --surface-2: #efede4;    /* 區塊交替底（首頁六站區那種灰米色） */
  --ink: #20231f;          /* 正文 */
  --ink-2: #535950;        /* 次要文字 */
  --rule: #d7d6c9;         /* 線條 */
  --accent: #873b29;       /* 重點、連結、目前位置 */
  --accent-soft: #f3e6df;  /* accent 淡底（標籤、hover） */
  --olive: #415c49;        /* 第二重點：完成、成功、工作坊步驟 */
  --olive-soft: #e3ebe4;
  --warn: #9a6a00;  --warn-soft: #fbf1d6;
  --danger: #a3281f; --danger-soft: #f8e1de;
  --focus: #873b29;

  /* 字體：只留 3 組，不用 Google Fonts 載中文 */
  --font-serif: "Noto Serif TC", "Source Han Serif TC", "Songti TC", "PMingLiU", serif;
  --font-sans: -apple-system, BlinkMacSystemFont, "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif;
  --font-mono: ui-monospace, "SF Mono", "Cascadia Mono", Menlo, monospace;

  /* 字級（1.25 比例） */
  --fs-xs: .8125rem; --fs-sm: .875rem; --fs-base: 1rem; --fs-md: 1.125rem;
  --fs-lg: 1.375rem; --fs-xl: 1.75rem; --fs-2xl: 2.25rem; --fs-3xl: 3rem;

  /* 間距（4px 基準） */
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px; --sp-5: 24px;
  --sp-6: 32px; --sp-7: 48px; --sp-8: 64px; --sp-9: 96px;

  --radius-sm: 4px; --radius: 8px; --radius-lg: 12px;
  --shadow: 0 1px 2px rgb(32 35 31 / .06), 0 8px 24px -12px rgb(32 35 31 / .18);
  --wrap: 1180px; --wrap-read: 800px; --wrap-catalog: 1060px;
  --header-h: 64px;
}
```

**規則**
- 標題（h1–h3）用 `--font-serif`；正文、按鈕、表單用 `--font-sans`；程式碼、數字用 `--font-mono`。
- 全站**刪除** Google Fonts 的 `<link>`，`data_atoms.html` 例外可保留 1 個等寬字型（若刪了會破版）。
- **禁止**新增 `#2563eb`、`#1e40af`、`#0284c7` 等藍色；也禁止紫色漸層。現有藍色一律替換為 `--accent` 或 `--olive`。
- 按鈕與導覽禁止 emoji。內文中的 emoji 每頁最多保留在「標籤」用途，不放在標題與按鈕。

### 4.2 元件（放在 `css/components.css`）

| 元件 | class | 規格 |
|---|---|---|
| 主要按鈕 | `.btn.btn-primary` | 底 `--ink`、字 `--surface`、高 44px、左右 padding 20px、圓角 `--radius`；hover 底改 `--accent`。**一頁只能一顆。** |
| 次要按鈕 | `.btn.btn-secondary` | 透明底、1px `--ink` 框、其他同上 |
| 文字連結 | `.link-arrow` | `--accent`、底線 offset 3px、尾端「→」；外部連結尾端「↗」 |
| 標籤 | `.tag` | `--fs-xs`、padding 2px 8px、底 `--accent-soft`、字 `--accent`；變體 `.tag-olive` |
| 卡片 | `.card` | 底 `--surface`、1px `--rule`、`--radius-lg`、padding `--sp-5`；可點的整張卡片 hover 時框變 `--ink` 且 `translateY(-1px)` |
| 提示框 | `.callout` + `.callout-info/.callout-warn/.callout-danger` | 左側 3px 色條 + 淡底，不要整圈粗框 |
| 程式碼／Prompt 區 | `.prompt-block` | 底 `#1f2320`、字 `#f1efe6`、`--font-mono`、右上角「複製」按鈕（§5.6） |

---

## 5. 共用版型元件（Shell）

### 5.1 共用頁首 `site-header`
- 新增 `js/site-shell.js`：在 `<body>` 開頭注入頁首、在結尾注入頁尾。各頁只需放：
  ```html
  <body data-nav="learn|concepts|lab|workshop|none" data-shell="full|app">
  <script src="js/site-config.js"></script>
  <script src="js/site-shell.js" defer></script>
  ```
- 頁面若已有自己的頁首（`curriculum_1105_workflow.html` 深色頂列、`data_atoms.html` 兩列頂部、`WORKSHOP_BOARD.html` 藍色 hero），**移除**並改用 shell。
- `data-nav` 決定哪個導覽項目加 `aria-current="page"`（目前位置：文字 `--accent` + 2px 底線）。
- 高度 64px、`position: sticky; top: 0`、底 `--paper` 加 `backdrop-filter: blur(8px)` 與底部 1px `--rule`。
- **手機（≤640px）**：品牌只顯示「學」方塊 + 「學習地圖」，四個導覽項目在第二列 **4 等分**（`grid-template-columns: repeat(4,1fr)`），每格文字不換行。不使用漢堡選單。
- 子目錄頁面（`concepts/`、`topics/`、`00_課程手冊與即時看板/`）路徑前綴由 shell 依 `<script src>` 的相對路徑自動計算，不要手寫兩份。

### 5.2 `data-shell="app"`（給 Data Atoms 這類工具頁）
- 頁首縮成 **44px 單列**：左「← 工作坊 · 步驟 5/5」、中間頁名「Data Atoms 儀表板」、右側「使用說明」（開 `data_atoms_manual.html` 新分頁）與「下一步：回到工作坊總覽」。
- 不顯示 4 項主導覽、不顯示頁尾。

### 5.3 共用頁尾
- 三欄：①網站名 + 一句話「理解，然後動手做。」②快速連結（六站課程、概念目錄、實驗、影片系列、工作坊）③授課資訊（從 `SITE_CONFIG.workshop.instructor` 讀取）+ 教育部計畫字樣。
- 手機改單欄。

### 5.4 工作坊步驟列 `workshop-stepper`
- 出現在 §3.2 表中步驟 1–5 的每一頁，緊貼頁首下方。
- 桌機：橫向 5 個步驟，格式「① 全日課程架構」，目前步驟：底 `--olive`、白字；已瀏覽過（存 `sessionStorage`，key `workshop_steps_seen`）：數字前加 ✓；其餘：`--ink-2` 字、透明底。右側「參考 ▾」下拉選單（原生 `<details>`）。
- 手機：只顯示「步驟 3／5 · 申請 e-Stat API」+ 左右箭頭按鈕 + 點文字展開完整清單（`<details>`）。
- 頁面底部一律有 **prev / next 大型連結列**：「← 上一步：分析師工作流」「下一步：17 領域研究指南 →」。
- 現有頁面內各自手刻的步驟按鈕列（例如 `curriculum_1105_workflow.html` 頂部 9 顆按鈕、`data_atoms.html` 頂部 5 顆 + Skills/e-Stat 按鈕）**全部移除**，由 stepper 取代。

### 5.5 數位乩童浮動元件（`js/digital_jitong.js`）
- **只在** `index.html`、`videos.html` 啟用；其他頁移除 `<script>`。
- 尺寸縮為 48px 圓形頭像（展開才顯示「數位乩童 請解簽」文字）。
- 位置 `right: 16px; bottom: 16px`，必須**不遮擋**主要內容：在 `index.html` 給 `main` 加 `padding-bottom: 80px`。
- 加關閉按鈕（×），關閉後寫入 `localStorage['jitong_dismissed']='1'`，之後不再顯示；頁尾加一個「叫出數位乩童」連結可恢復。
- `prefers-reduced-motion: reduce` 時停用所有動畫。

### 5.6 一鍵複製（工作坊看板用，抽成共用）
- `js/copy.js`：任何 `[data-copy]` 按鈕複製其相鄰 `.prompt-block code` 的文字；成功後按鈕文字變「已複製 ✓」1.5 秒，並在 `role="status"` 區朗讀「已複製」。失敗時退回 `document.execCommand('copy')`。

### 5.7 投影模式
- 工作坊相關頁（`workshop.html`、`WORKSHOP_BOARD.html`、步驟 1–4）支援 `?present=1` 或頁首右側「投影模式」切換鈕：
  - `html { font-size: 125%; }`、內容最大寬度改 1280px、隱藏頁尾、隱藏數位乩童。
  - 狀態存 `sessionStorage['present_mode']`。

---

## 6. 逐頁規格

### 6.1 首頁 `index.html`（最重要）

**由上到下的新結構**

1. **Hero（左 7 欄 / 右 5 欄）**
   - h1 不變：「從一句提問，理解 AI 如何完成工作」（「完成工作」用 `--accent`）。
   - 說明文字不變。
   - 行動：**只留 2 個**
     - 主要：`開始第一站 →`（`learn.html?lesson=01`）；若進度 >0 則文字改為「繼續第 0N 站 →」並連到下一個未完成站。
     - 次要：`參加工作坊？進入工作坊 →`（`workshop.html`）
   - 「不需要程式背景，也不需要 API Key。」保留為小字。
   - **刪除**：hero 內的「先看 AI 架構圖」「OpenRouter 三階資料流」「前往 11/05 實戰課程流程藍圖」三個連結（架構圖已在右側概念圖下方有入口；OpenRouter 移到工作坊參考區）。
   - 右側概念圖預覽（`.map-preview`）保留不動。

2. **「你今天是哪一種？」三張入口卡**（新，取代藍色橫幅）
   | 卡片 | 一句話 | 連結 |
   |---|---|---|
   | 自學 LLM 基礎 | 6 站、每站約 15 分鐘，進度會自動保存。 | `learn.html?lesson=01` |
   | 參加一日工作坊 | 課表、提示詞看板、5 步驟資料分析實作。 | `workshop.html` |
   | 直接查名詞 | 21 個概念，可搜尋中英文。 | `encyclopedia.html` |
   - 三欄 `.card`，整張可點；手機改單欄。卡片頂部用 `.tag` 標示「約 90 分鐘」「全天」「隨時查」。

3. **六站學習路線**：現有 `#learning-map` 區塊保留，只改：
   - 每列右側狀態「尚未開始 →」改成 `.tag`（尚未開始：灰；進行中：`--accent-soft`；已完成：`--olive-soft` + ✓）。
   - 「重設學習進度」移到區塊最底、改為小字並加確認（`confirm()` 改用頁內二次確認按鈕：第一次點變「確定重設？再點一次」，3 秒後還原）。

4. **影片區**（取代現在單一 `<details>` 影片 + 文字連結）
   - 標題「先看 3 分鐘影片暖身」；橫向 3 張影片海報卡（用 `assets/video-posters/` 既有圖）：AI 漏斗、法器篇 EP0、草莓與 Token。點擊開 `videos.html#對應id`。
   - 「看完整系列 →」連 `videos.html`。

5. **學完後你能做什麼？**：保留。

6. **想再深入一點？**：保留三欄，但**刪除**「★ 11/05 實戰課程流程藍圖」那一項及所有 inline style。

7. 頁尾：共用頁尾。

**刪除清單**：所有 `style="..."`（11 處）、藍色 `11/05` 橫幅 `<section>`、導覽列第 4 項。

### 6.2 新頁 `workshop.html`（工作坊總覽）

合併 README 的課表 + `curriculum_1105_workflow.html` 的兩大區塊說明 + `WORKSHOP_BOARD.html` 的入口。

結構：
1. 頁首 + 麵包屑「首頁 ／ 工作坊」。
2. 標題區：h1「一天打造你的 AI 工作流」；副標「Claude × ChatGPT × Antigravity 進階實戰工作坊」；資訊列（`.tag`）：日期（`SITE_CONFIG`）、授課教師、「實作 >60%」。
   - 主要按鈕：「開啟學員看板（一鍵複製提示詞）→」→ `00_課程手冊與即時看板/WORKSHOP_BOARD.html`
   - 次要按鈕：「課前檢核表」→ GitHub 上 `00_課前準備檢核表.md` 的網址（或轉成 html，見 §6.6）。
   - 右上「投影模式」切換。
3. **今日時程（時間軸）**：直接用 README「課程時程總覽」表的內容，做成垂直時間軸；每個 Module 一列：時間（mono 字體）、模組名、3 個重點、「開啟教材 →」連結（連到該 Module 的 README 在 GitHub 上的頁面，或對應網站頁）。休息時段用淡色細列。
   - 若現在時間落在某時段內（以 `Asia/Taipei` 判斷且日期 = `nextDate`），該列加 `--olive` 左條與「進行中」標籤。
4. **資料分析實作 5 步驟**：5 張橫向編號卡（桌機一列 5 張；手機直排），對應 §3.2；每張：步驟號、標題、一句話目的、預估時間、「開始 →」。
5. **參考資料**：清單式（不用卡片）：系統架構圖解、OpenRouter 三階資料流、日本人口儀表板範例、e-Stat 官網 ↗、data-analyst 技能倉庫 ↗、Skill 清單（`data_analysis.html#skills-catalog` 改為 `student_data_analyst_workflow.html#skills-catalog`）。
6. 共用頁尾。

### 6.3 `curriculum_1105_workflow.html`（步驟 1）
- 移除深色頂列與 9 顆按鈕，套用 shell + stepper。
- `<title>` 與 h1 改為「全日課程架構：從大模型認知到 Tableau-like 儀表板」，日期改由 `SITE_CONFIG` 顯示在 h1 上方小字。
- 移除 `track: curriculum architecture / environment: antigravity / theme: dose` 那行（開發者用語）。
- hero 下 5 顆按鈕：只留主要「下一步：分析師工作流 →」；其餘移到「參考 ▾」。
- 刪除 `dose` 主題 CSS 變數區塊與 Google Fonts，改用 tokens。綠色 accent 一律對應到 `--olive`，橘色對應 `--accent`。
- 兩大區塊（第一塊認知篇 15% / 第二塊實戰篇 85%）的內容**保留**，只換樣式。

### 6.4 步驟 2–4 頁
（`student_data_analyst_workflow.html`、`estat_api_tutorial_simulator.html`、`estat_catalog_and_research_guide.html`）
- 同 §6.3：換 shell + stepper + tokens、移除各自頂列、移除 Google Fonts、頁底 prev/next。
- 內容不改。表格加外層 `.table-scroll { overflow-x: auto; }`，避免手機整頁超寬。

### 6.5 `data_atoms.html`（步驟 5，工具頁）
- `data-shell="app"`；移除原本兩列深色頂部（DATA ANALYTICS TRACK 列 + Skills/e-Stat/複製網址列）。
- 修正左上標題「Data Atoms **PyGWalker**」中 PyGWalker 的藍底高亮（看起來像被選取），改為 `.tag`。
- 浮動數位乩童移除（它擋住右下角圖表與 toast）。
- 底部 toast 位置：`bottom: 16px; left: 50%; transform: translateX(-50%)`，3 秒自動消失，可按 Esc 關閉。
- 其他（欄位面板、圖表、工作表分頁）**不動**。只把硬寫的顏色替換為 tokens 中最接近的值時，若會影響圖表配色則**不要換**。

### 6.6 `00_課程手冊與即時看板/WORKSHOP_BOARD.html`
- 移除藍色漸層 hero 與深紫卡片，改用 tokens：Module 分頁籤用底線式 tabs（目前分頁：`--accent` 2px 底線）。
- 頁首 shell（`data-nav="workshop"`）+ 麵包屑「工作坊 ／ 學員看板」。
- 預設啟用「投影模式」切換鈕。
- 所有 prompt 改用 `.prompt-block` + `[data-copy]`（§5.6）。
- 「開場破冰實作」區的 4 顆按鈕：只保留 1 個主要（開啟 LLM 本質探秘實驗室），其餘 3 個改為文字連結列。連結目標改為 canonical 頁（§8.1）。
- 新增：把 `00_課前準備檢核表.md` 轉成本頁的一個分頁「課前檢核」，每項有 checkbox，勾選狀態存 `localStorage['workshop_checklist_v1']`。

### 6.7 `learn.html`（六站單站頁）
- 標題區改為：小標「第 01／06 站 · 認識模型」→ h1 → 一句說明 → **一列**「相關：概念全圖 · 60 秒影片」（兩個 `.link-arrow`，同一行）。
- 「動手試 / 看解說 / 確認理解」從文字連結改為 **sticky 段落切換列**（segmented control，sticky 在頁首下方），捲動時以 IntersectionObserver 標示目前段落。
- 頁底固定有「← 上一站」「下一站 →」；最後一站的下一站是「進入工作坊」或「回到學習地圖」。
- 完成判定邏輯不動（測驗通過 + 按完成才算）。

### 6.8 `lab.html`、`encyclopedia.html`、`concepts/*.html`、`topics/*.html`、`videos.html`
- 換用 shell（頁首、頁尾）與 tokens；版面不大改。
- `lab.html` 影片卡片的 💡 提示列保留；卡片 hover 規則統一為 §4.2 `.card`。
- `videos.html`：移除數位乩童以外的浮動元件；影片 `<video>` 一律 `preload="none"` + poster。

### 6.9 `metro.html`、`memory.html`、`security.html`、`mobile.html`、`lab.html` 舊轉址頁
- 確認是否為舊頁轉址或獨立教材；若為獨立教材，套 shell；若只是轉址，維持轉址但用 §8.3 範本。

---

## 7. 隱私與安全（**P0，最先做**）

1. **立即**從 repo 刪除 `workshop_registration_dashboard.html`（含報名者 email 與手機）。
   - 若講師仍需此儀表板：另建 `workshop_registration_dashboard.html` 的**去識別化版本**——只保留梯次、人數、系所統計，不含任何姓名、email、電話；資料改由 Google Apps Script 在登入後讀取，或只在本機使用並加入 `.gitignore`。
   - 掃描全 repo（含 `sample_data/`、`sample_datasets/`、`*.json`、`*.csv`、`*.xlsx`）是否還有真實 email / 手機格式資料，結果列在 `docs/REDESIGN_OPEN_QUESTIONS.md`。
2. **Git 歷史清除不要自己做**（`git filter-repo` / BFG 會改寫歷史、需要 force push）。在 `docs/REDESIGN_OPEN_QUESTIONS.md` 寫下建議指令，交給 repo 擁有者決定。
3. 教學用假金鑰字串（`AIzaSyD8942...EXPOSED_KEY`、`sk-ant-api03-...TOP-SECRET`）保留，但確認旁邊有「示範用假金鑰」標示。

---

## 8. Repo 整理

### 8.1 重複頁 → 指定 canonical
| 保留（canonical） | 改為 redirect stub |
|---|---|
| `student_data_analyst_workflow.html` | `data_analysis.html` |
| `00_LLM本質探秘實驗室.html`（先 diff 兩檔，保留內容較新者，差異寫入 open questions） | `llm_lab.html` |

並把全站指向被淘汰檔名的連結改成 canonical。

### 8.2 修壞連結
`00_LLM本質探秘實驗室.html` 中 5 個不存在的目標：若 `dist_public_web/` 內有同名檔（例如 `dist_public_web/00_LLM_Token與模型全景圖譜.html`、`dist_public_web/diagram_*.html`）→ 改連到該路徑；找不到的 → 移除連結並列入 open questions。

### 8.3 Redirect stub 範本
```html
<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=TARGET.html">
<link rel="canonical" href="TARGET.html">
<script>location.replace('TARGET.html'+location.search+location.hash)</script>
<title>頁面已移動</title></head>
<body><p>此頁已移到 <a href="TARGET.html">新位置</a>。</p></body></html>
```

### 8.4 媒體與製作素材（P5，最後做）
- 根目錄的 `*.mp4`、`*.wav` 搬到 `media/`，更新所有引用（含 `videos.html`、`index.html`、`js/*.js`、`docs/LLM_VIDEO_CATALOG.json`）。
- 網站不使用的製作素材（`voice_*/`、`preview_frames/`、`earshot_sfx/`、`motion_cursor_demo/out/`、`*.pcm`）：**不要刪**，列清單到 open questions，建議擁有者移到另一個 repo 或 Release。
- 新增 `.gitignore` 規則避免之後再 commit `*.pcm`、`preview_frames/`。

### 8.5 根目錄說明
- `README.md` 開頭改為 15 行內：網站是什麼、線上網址、三個入口（自學／工作坊／查概念）、本機預覽指令 `python3 scripts/llm_preview.py`。工作坊課表移到 `workshop.html`，README 只留連結。
- `docs/` 內大量 `*_VERIFICATION.md / *_FINISH_REVIEW.md` 搬到 `docs/archive/`。

### 8.6 cache-busting
所有 `?v=數字` 統一為 `?v=20261110`（與 `SITE_CONFIG.assetVersion` 一致）。

---

## 9. 驗收（每個 Phase 都要跑）

新增 `scripts/qa_site.py`（Playwright，Python），以 `python3 -m http.server` 啟動後檢查下列頁面：
`index.html`、`learn.html?lesson=01`、`learn.html?lesson=06`、`encyclopedia.html`、`lab.html`、`concepts/overview.html`、`videos.html`、`workshop.html`、步驟 1–5 頁、`WORKSHOP_BOARD.html`。

自動檢查（全部要 PASS）：
1. 桌機 1440 與手機 390 寬度下 `document.documentElement.scrollWidth <= innerWidth`（無水平捲動）。
2. 無 `pageerror`、無 console error。
3. 全站本地連結 0 個壞連結（解析所有 `href`/`src`，含 URL decode 中文檔名）。
4. 每頁恰好一個 `.site-header`（app 頁為 `.app-bar`），且導覽有一個 `aria-current="page"`（app 頁除外）。
5. 每頁 `.btn-primary` 數量 ≤ 1。
6. HTML 中不得出現：`#2563eb`、`#1e40af`、`#0284c7`、`fonts.googleapis.com`（`data_atoms.html` 等寬字型例外）、文字「11/05」（只能由 JS 從 config 注入）。
7. `index.html` 的 `style=` 屬性數量 = 0。
8. 數位乩童元件只存在於 `index.html`、`videos.html`。
9. 工作坊步驟 1–5 頁都有 stepper，且 prev/next 指向正確的相鄰步驟。
10. repo 中不存在符合 `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}` 且屬於真實報名者的資料（白名單：作者公開信箱、示範用 example.com）。
11. 鍵盤：從頁首 Tab 依序可到達所有導覽項目與主要按鈕，焦點外框可見（`outline` 非 none）。
12. localStorage：預先寫入 `llm_learning_progress_v1` 假進度 → 重新整理首頁 → 主要按鈕顯示「繼續第 0N 站」。

人工檢查（截圖附在 PR 說明）：
- 首頁桌機首屏：只有 1 個深色主要按鈕，且看得到「你今天是哪一種？」三張卡片的上緣。
- 從首頁 → 工作坊 → 步驟 1 → … → 步驟 5 → 回工作坊，全程只用 prev/next 走完，不迷路。
- 手機版頁首 4 個導覽項目在同一列、不截斷。

---

## 10. Phase 規劃

| Phase | 內容 | 對應章節 |
|---|---|---|
| **P0** | 移除報名個資頁、掃描其他個資、寫 open questions | §7 |
| **P1** | `tokens.css`、`components.css`、`site-config.js`、`site-shell.js`、`copy.js`；套到 `index.html`、`learn.html`、`encyclopedia.html`、`lab.html`、`concepts/`、`topics/`、`videos.html` | §4、§5.1、§5.3、§5.5、§6.7、§6.8 |
| **P2** | 首頁重做 | §6.1 |
| **P3** | `workshop.html` + stepper + 步驟 1–4 頁 + 投影模式 | §3.2、§5.4、§5.7、§6.2–6.4 |
| **P4** | `WORKSHOP_BOARD.html`、`data_atoms.html` 外殼 | §5.2、§6.5、§6.6 |
| **P5** | 重複頁、壞連結、媒體搬移、README、docs 歸檔、cache-busting | §8 |
| **P6** | 跑完整 QA、補截圖、更新 `DESIGN.md`（加入 tokens、shell、stepper 的約定） | §9 |

## 11. 不做的事（Out of scope）
- 不重寫六站課程內容、測驗題、概念文章。
- 不改 Data Atoms 的資料處理與圖表演算法。
- 不導入框架（React/Vue/Tailwind）或 build step；維持靜態 HTML + 原生 JS。
- 不改寫 git 歷史、不 force push。
- 不新增裝飾性圖片或 AI 生成插圖。
