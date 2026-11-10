# SITE_REDESIGN_SPEC_V2.md — 教學網站第二輪重整規格（流程、頁面內層、影片與舊頁）

> 對象：負責實作的 coding agent（Claude Sonnet 5.5）
> Repo：`nutcelvischen-jpg/dataviz-motion-skill`（GitHub Pages，從根目錄發佈，有 `.nojekyll`）
> 基準 commit：`4d2a545`（2026-11-10）
> 前一份規格：`SITE_REDESIGN_SPEC.md`（第一輪，已完成並上線）。本檔**只寫第一輪沒解決的事**，兩者衝突時以本檔為準。
> 介面文字一律繁體中文、臺灣用語（不用「視頻、信息、質量、用戶、默認、鏈接、點擊」等詞；「點擊」改「點」或「按」）。

---

## 0. 給實作者的工作規則（先讀）

1. 依 Phase A → G 順序做，**一個 Phase 一個 commit**，訊息格式 `redesign-v2(P{A..G}): {摘要}`。每個 Phase 結束都跑 `python3 scripts/qa_site.py`（§9 會擴充它），全綠才進下一個。
2. **不改壞既有網址。** 被合併、搬移的頁面，原路徑留 redirect stub（沿用 `data_analysis.html` 現有寫法：`<meta http-equiv="refresh">` + `location.replace`，並保留 hash 對應）。
3. **不動這些 localStorage key**：`llm_learning_progress_v1`、`data_atoms_studio_state_v1`、`llm_lab_provider`、`llm_lab_gemini_key`、`llm_lab_openrouter_key`、`llm_lab_openrouter_model`、`workshop_checklist_v1`、`jitong_dismissed`。
4. **不重寫** `data_atoms.html` 的圖表／拖放邏輯、`js/lab.js` 的實驗邏輯、`estat_api_tutorial_simulator.html` 的模擬播放邏輯。只動外觀、文案與版面結構。
5. **不改內容的意思。** 可以縮短標題、刪掉重複段落與開發者用語（§4.3 有清單），不能改數字、步驟、提示詞內文。
6. **不刪擁有者的素材檔**（mp4、wav、png、csv）。要清理的只列清單（Phase G）。
7. 規格沒寫到、又會改變內容意義的決定：寫進 `docs/REDESIGN_OPEN_QUESTIONS.md` 的新段落「V2」，用預設值繼續做，不要停下來等。
8. 每個 Phase 結束，截圖存 `docs/redesign-screenshots/V2-P{x}/`（desktop 1440×900、mobile 390×844，各頁第一屏 + 整頁）。

---

## 1. 現況診斷：第一輪做完之後還剩什麼

第一輪成果（保留，不要回頭改）：全站共用頁首／頁尾（`js/site-shell.js`）、`css/tokens.css`、`css/components.css`、`workshop.html`、工作坊步驟列、內部連結 0 壞連結。

**還沒好的根本原因：只換了外殼，頁面「裡面」沒動；而且影片、舊頁、工作坊三條線的動線各自為政。**

| # | 問題 | 證據（在 `4d2a545` 上量到的） |
|---|---|---|
| R1 | **工作坊頁面內層還是舊的「dose／藥局」主題**：青綠、鵝黃、薰衣草紫三種漸層大色塊、深綠硬陰影按鈕、英文等寬小字標籤。套了新頁首後反而更像兩個網站疊在一起。 | 6 頁仍載入 `css/dose_mobile.css`；class `pharmacy-label`、`mono-label`、`plastic-tray`、`tear-stub`；`student_data_analyst_workflow.html` 有 **272** 個 inline `style=` |
| R2 | **畫面上有開發者用語**，學生看不懂也不需要。 | `step 01 / blueprint`、`role: data ingestion`、`block 01 (15% time)`、`status: all modules verified / repo: …`、`ecosystem: 27 skills across 4 domains / agentic pair programming` |
| R3 | **步驟 1 與步驟 2 內容重複，步驟 2 過長。** 步驟 2 一開頭又講一次「全日課程架構：兩大區塊」（就是步驟 1），後面接 27 個 Skill 與 MCP 目錄（參考資料，不是步驟）。 | `student_data_analyst_workflow.html` 桌機高 6,552px、手機 13,945px；其中 `#skills-catalog`（第 619 行起）與 `#mcp-catalog`（第 1038 行起）約佔六成 |
| R4 | **「步驟 1：全日課程架構」不是要做的事**，它是總覽；而 `workshop.html` 也是總覽。兩個總覽、一個假步驟。 | `js/site-config.js` 的 `steps[0]` |
| R5 | **工作坊頁有兩套互不對應的結構**：「今日時程」是 Module 1–4，「資料分析實作 5 步驟」是另一套；看板的分頁又是 Module 1–4。時程裡的「開啟教材」會離站跳到 GitHub 資料夾。 | `workshop.html` 第 23–33 行、`WORKSHOP_BOARD.html` 的 `#mod1…#mod4` |
| R6 | **標題下方按鈕成群**，沒有主次。 | 步驟 2 標題下 4 顆、步驟 3 有 3 顆、`japan_population_dashboard.html` 有 4 顆 `nav-btn` |
| R7 | **h1 太長、斷行難看。** | 「資料分析師完整實戰工作流：從官方數據到 Tableau-like 儀表板」「手把手動態錄影：取得日本政府 e-Stat 統計 API 金鑰」「日本官方統計視覺化實戰導航與數據矩陣」 |
| R8 | **影片沒有自己的家。** `videos.html` 掛在「做實驗」底下、標題叫「數位乩童影片課堂」；6 支直式影片單欄直排，整頁 5,383px，其餘影片藏在 `<details>` 裡。`lab.html` 開頭又放一大塊「60 秒看懂 AI 盲點·影音實戰實驗室」卡片牆，第一季琥珀色、第二季紫色，兩種卡片樣式。 | `videos.html`（27 個 inline style、標題含 emoji 6 處）；`js/lab.js` 第 250–300 行（全檔 74 個 inline style、`#7c3aed`／`#6d28d9`） |
| R9 | **首頁同一組選擇出現兩次**：hero 的「開始第一站／參加工作坊」，往下又一區「你今天是哪一種？」三張卡（自學／工作坊／查名詞）。hero 上方另有約 150px 空白。 | `index.html` 第 44 行 `entry-section`；`css/learning.css` `.home-hero` |
| R10 | **課程頁的「動手試／看解說／確認理解」長得像分頁，其實是錨點**；頁尾主按鈕「完成本站並前往下一站」預設是 disabled，使用者不知道為什麼不能按。 | `css/learning.css` `.lesson-sticky-nav`；`js/learning.js` 第 66 行 `#complete-lesson` |
| R11 | **還有舊頁完全沒進新系統**，而且手機會橫向捲動。 | `00_LLM本質探秘實驗室.html`（142 inline style、手機 scrollWidth 553 > 390）；`01_Module1_AI_Frontier_Full_Spectrum_Landscape_2026.html`（桌機高 **35,094px**、手機 76,531px、739 inline style、92 處藍紫色、手機 scrollWidth 649）；兩頁都沒有站內連結指向（孤兒頁） |
| R12 | **參考頁內層仍是藍／橘＋emoji**。 | `japan_population_dashboard.html` 頁首下有整條藍色橫幅、橘色 CTA、emoji 分頁；`system_architecture.html` 麵包屑還寫「11/5 實戰課程流程」；`openrouter_architecture.html` 同款 |
| R13 | **Data Atoms 在手機不能用**（欄位架全部直排在圖表上方，整頁 2,138px），卻沒有任何提示。頂部同時有紫色「自訂看板」與黑色「匯出圖表」兩顆實心按鈕。 | `data_atoms.html` 390px 截圖；`.btn-primary` 3 顆 |
| R14 | **操作手冊 2.4 MB**（圖片 base64 內嵌），教室 Wi-Fi 下很慢。 | `data_atoms_manual.html` 2,446,833 bytes |
| R15 | **看板手機分頁被切掉**（第三個分頁只露出「M」），沒有可捲動的提示。 | `WORKSHOP_BOARD.html` 390px |
| R16 | `topics/*.html` 六頁共 **547** 個 inline style。 | grep |
| R17 | **Repo 雜物**：`media/` + `videos/` 共 443 MB，其中 29 個檔、約 224 MB 沒有任何頁面引用；根目錄有 3 份舊規格、4 支 `.py`、3 張檔名含空白的 PNG。 | `du`、引用掃描 |

---

## 2. 需要擁有者決定的事（都有預設值，實作者照預設做）

| # | 決定 | 預設（實作者照做） |
|---|---|---|
| Q1 | **時程（Module 1–4）與「e-Stat → Data Atoms 實作路線」的關係。** 現在網站同時呈現兩種說法：`workshop.html`／README 是 Module 1–4；`curriculum_1105_workflow.html` 是「15% 認知 + 85% e-Stat／Data Atoms 實作」。 | 不替內容下結論。時程照舊；實作路線改名「資料分析實作路線」，放在時程下方，副標寫「課堂上由講師帶著走，也可以課後自己做一次。」**不**標示它屬於哪個 Module。擁有者若要對應，只需在 `SITE_CONFIG.steps[n].module` 填 `1`–`4`（§3.3），時程列會自動出現「本時段實作 →」連結。 |
| Q2 | 網站名稱「大語言模型學習地圖」沒涵蓋工作坊與影片。要不要改名？ | 不改名。但把名稱抽成 `SITE_CONFIG.site.name`／`tagline`，日後改一處即可。 |
| Q3 | 數位乩童浮動頭像放哪些頁？ | 只留 `videos.html`；從 `index.html` 移除（它會蓋到首頁右側概念圖）。 |
| Q4 | 224 MB 未引用的影音檔要不要移出 repo？ | 不動，只產出清單（Phase G）。 |

---

## 3. 資訊架構調整

### 3.1 頂層導覽改為 5 項

`js/site-shell.js` 的 `items`：

| key | 文字 | 連到 |
|---|---|---|
| `learn` | 跟著學 | `index.html#learning-map` |
| `concepts` | 查概念 | `encyclopedia.html` |
| `lab` | 做實驗 | `lab.html` |
| `videos` | 看影片 | `videos.html` |
| `workshop` | 工作坊 | `workshop.html` |

- `videos.html` 的 `<body data-nav>` 由 `lab` 改 `videos`。
- `css/shell.css` 第 72 行手機導覽 `repeat(4, …)` 改 `repeat(5, minmax(0, 1fr))`，字級維持 13px，`gap: 0`。驗收：390px 下五項同一列、每項不換行、不橫向捲動。
- 頁尾「快速連結」順序同上。

### 3.2 工作坊實作路線：5 步改 4 步

`js/site-config.js`：

```js
window.SITE_CONFIG = {
  site: { name: '大語言模型學習地圖', mark: '學', tagline: '理解，然後動手做。' },
  workshop: { /* 原樣保留 */ },
  assetVersion: '20261111',            // 本輪統一改成這個值，全站 ?v= 跟著換
  steps: [
    { file: 'student_data_analyst_workflow.html', title: '看懂工作流',     goal: '先看完五個階段：拿資料、清資料、驗證、分析、做儀表板。', module: null },
    { file: 'estat_api_tutorial_simulator.html',  title: '申請 e-Stat API', goal: '跟著模擬畫面申請金鑰，避開最常見的設定錯誤。',       module: null },
    { file: 'estat_catalog_and_research_guide.html', title: '選題',         goal: '從 17 個領域、10 種圖表裡挑一個想回答的問題。',       module: null },
    { file: 'data_atoms.html',                    title: '做儀表板',        goal: '在 Data Atoms 拖拉欄位，做出自己的互動圖表。',         module: null }
  ],
  references: [
    { file: 'curriculum_1105_workflow.html', title: '全日課程架構圖' },
    { file: 'skills.html',                   title: 'Skill 與 MCP 清單' },
    { file: 'system_architecture.html',      title: 'GitHub + GAS 系統架構' },
    { file: 'openrouter_architecture.html',  title: 'OpenRouter 三階資料流' },
    { file: 'japan_population_dashboard.html', title: '日本人口儀表板範例' },
    { file: 'data_atoms_demo.html',          title: 'Data Atoms 操作示範影片' },
    { href: 'https://www.e-stat.go.jp', title: 'e-Stat 官網 ↗' },
    { href: 'https://github.com/nutcelvischen-jpg/data-analyst-skill', title: 'data-analyst 技能倉庫 ↗' }
  ]
};
```

配套修改：

- 各頁 `data-step`：`student_data_analyst_workflow.html`=1、`estat_api_tutorial_simulator.html`=2、`estat_catalog_and_research_guide.html`=3、`data_atoms.html`=4。
- `curriculum_1105_workflow.html`：移除 `data-step`，改 `data-workshop`（不顯示步驟列，仍有投影模式），頁首下加麵包屑「首頁 ／ 工作坊 ／ 全日課程架構圖」。
- `site-shell.js`：`sessionStorage` key `workshop_steps_seen` 改 `workshop_steps_seen_v2`（步驟編號變了，舊值會標錯勾）。
- `site-shell.js` 的品牌文字、頁尾品牌與標語改讀 `SITE_CONFIG.site`。
- `js/workshop.js` 產生步驟卡時多輸出 `goal`；全站「步驟 n／5」字樣改由 `cfg.steps.length` 計算，不得寫死 5 或 4。
- 全站搜尋「5 步驟」「五步驟」「步驟 n／5」字樣並修正（含 `index.html` 第 44 行附近的卡片說明「5 步驟資料分析實作」→「4 步驟資料分析實作」）。

### 3.3 `module` 欄位（Q1 的機制）

`js/workshop.js`：時程每個 `.wk-slot` 加 `data-module="1"`…`"4"`。若有任何 `steps[n].module === m`，該時段列在「看板提示詞」連結後面加「本時段實作：{title} →」。全部為 `null` 時不輸出任何東西。

---

## 4. 設計系統補充（加在第一輪的 tokens／components 之上）

### 4.1 `css/tokens.css` 新增

```css
:root {
  /* 圖表色（給 ECharts 與 SVG 用；語意色之外只用這 6 個，依序取用） */
  --chart-1: #873b29; --chart-2: #415c49; --chart-3: #9a6a00;
  --chart-4: #4a5a6a; --chart-5: #b98a7c; --chart-6: #8fa696;
  --code-bg: #1f2320; --code-ink: #f1efe6;
}
```

### 4.2 `css/components.css` 新增元件

| 元件 | class | 規格 |
|---|---|---|
| 頁面標題區 | `.page-hero` | 結構固定：`.eyebrow`（選用）→ `h1` → `.lead` → `.page-hero-actions`（選用）。上 padding `--sp-7`、下 `--sp-6`，下方 1px `--rule`。`h1`：`--font-serif`、`clamp(1.75rem, 3.2vw, 2.5rem)`、行高 1.25、`max-width: 20em`、`text-wrap: balance`。`.lead`：`--fs-md`、`--ink-2`、`max-width: 40em`。**`.page-hero-actions` 最多 1 顆 `.btn-primary` + 1 個 `.link-arrow`。** |
| 小標 | `.eyebrow` | `--fs-xs`、700、`--accent`、`letter-spacing: .04em`。只放中文（例：「步驟 2／4」「參考資料」）。不用等寬字、不用全大寫英文。 |
| 區塊 | `.section` | 上下 `--sp-7`；`.section > h2`：`--font-serif`、`--fs-xl`、下距 `--sp-5`。交替底色用 `.section-alt`（`--surface-2`，全寬）。**禁止漸層底、禁止彩色大色塊。** |
| 階段卡 | `.phase` | `.card` 的變體：左上 `.phase-num`（圓形 32px、`--olive` 底白字、mono）＋ `h3`；內文兩欄（文字 1fr｜`.prompt-block` 1fr），≤ 820px 改單欄。 |
| 統計格 | `.stat` | 數字 `--font-serif` `--fs-2xl` `--ink`；標籤 `--fs-sm` `--ink-2`；1px `--rule` 框、`--radius-lg`。數字**不上色**。 |
| 頁內目錄 | `.toc-chips` | 橫向錨點列：`.tag-muted` 外觀、高 36px、可換行；放在 `.page-hero` 內 `.lead` 之後。 |
| 分頁列 | `.tabs` | 底線式（同看板現行樣式）。≤ 640px：`overflow-x: auto; scroll-snap-type: x proximity; scrollbar-width: none;`，容器右緣加 24px 漸層遮罩（`mask-image: linear-gradient(to right, #000 calc(100% - 24px), transparent)`），選中的分頁切換時 `scrollIntoView({inline:'center'})`。 |
| 影片卡 | `.video-card` | 見 §6.4。 |
| 小螢幕提示 | `.app-gate` | 見 §6.7。 |

`.btn` 補兩條規則：`.btn` 不得有 `box-shadow`；`.btn-sm`（高 36px、padding 0 14px、`--fs-sm`）。

### 4.3 全站禁用清單（QA 會檢查）

- 這些 class 不得再出現在 HTML：`pharmacy-label`、`mono-label`、`plastic-tray`、`tear-stub`、`btn--clear`、`btn--sm`、`btn--primary`。
- 這些字串不得出現在畫面文字：`blueprint`、`role:`、`block 01`、`block 02`、`status:`、`ecosystem:`、`protocol:`、`step 0`（小寫開頭的英文標籤）、`11/5 實戰課程流程`。
- `linear-gradient` 只允許出現在 `css/pygwalker.css`、`css/digital_jitong.css`、`.tabs` 的 mask，以及深色架構圖（`system_architecture.html`、`openrouter_architecture.html` 的 `<svg>` 內）。
- h1–h3、`<button>`、`.btn`、分頁標籤內不得有 emoji（第一輪規則，這輪補齊漏網的頁面：`videos.html`、`japan_population_dashboard.html`、`system_architecture.html`、`openrouter_architecture.html`、`data_atoms.html`、`js/lab.js` 產生的卡片）。

### 4.4 舊 class 對照（Phase B 用）

| 舊 | 新 |
|---|---|
| `.pharmacy-label` | 有資訊量的改 `.tag`（例「Phase 01」→ `.phase-num` 內的 `1`）；純裝飾的刪除 |
| `.mono-label` | 是 §4.3 的開發者用語 → 刪除；是中文說明 → `.eyebrow` |
| `.plastic-tray` | `.card` |
| `.tear-stub` | 刪除（含其內的 status／ecosystem 文字列） |
| `.code-panel` + `.code-header` | `.prompt-block`（保留內容；右上角標籤如 `REST v3.0`、`python` 刪除） |
| `.phase-card`、`.phase-card-top`、`.phase-number`、`.phase-title`、`.phase-grid` | `.phase`、`.phase-num`、`h3`、（grid 併入 `.phase`） |
| `.btn--primary` | `.btn.btn-primary` |
| `.btn--clear`、`.btn--sm` | 頁內跳轉 → `.toc-chips` 的錨點；外部連結 → `.link-arrow` |

---

## 5. Phase 總表

| Phase | 內容 | 主要檔案 |
|---|---|---|
| A | IA：5 項導覽、4 步路線、`skills.html` 拆頁、`workshop.html` 重排 | `js/site-config.js`、`js/site-shell.js`、`js/workshop.js`、`css/shell.css`、`workshop.html`、`skills.html`（新） |
| B | 工作坊內層換皮：4 個步驟頁 + 架構圖頁 | `student_data_analyst_workflow.html`、`estat_api_tutorial_simulator.html`、`estat_catalog_and_research_guide.html`、`curriculum_1105_workflow.html`、`css/workshop-pages.css`、刪 `css/dose_mobile.css` |
| C | 影片頁重做、實驗頁瘦身 | `videos.html`、`css/course-videos.css`、`js/videos.js`（新）、`js/lab.js`、`lab.html` |
| D | 首頁與課程頁 | `index.html`、`css/learning.css`、`js/learning.js` |
| E | 舊頁收編與參考頁換皮 | `00_LLM本質探秘實驗室.html`、`01_Module1_AI_Frontier_…html`、`llm_lab.html`、`japan_population_dashboard.html`、`system_architecture.html`、`openrouter_architecture.html`、`data_atoms_demo.html`、`strawberry_token_60s.html`、`memory_context_60s.html` |
| F | Data Atoms 外殼、操作手冊瘦身、看板分頁、topics inline style | `data_atoms.html`、`data_atoms_manual.html` 及其產生腳本、`WORKSHOP_BOARD.html`、`css/board.css`、`topics/*.html` |
| G | Repo 整理（不刪素材） | 根目錄、`docs/` |

---

## 6. 各 Phase 細部規格

### 6.1 Phase A — 資訊架構

**A1.** 依 §3.1–3.3 改 `site-config.js`、`site-shell.js`、`shell.css`、`workshop.js`。

**A2. 新頁 `skills.html`（Skill 與 MCP 清單）**
- 把 `student_data_analyst_workflow.html` 的 `<section id="skills-catalog">` 與 `<section id="mcp-catalog">` **整段搬過來**（內容一字不改），原頁刪除這兩段。
- `<body data-nav="workshop" data-workshop>`；麵包屑「首頁 ／ 工作坊 ／ Skill 與 MCP 清單」。
- `.page-hero`：eyebrow「參考資料」；h1「Skill 與 MCP 清單」；lead「工作坊用到的 27 個 Antigravity Skill（4 個領域）與 3 個 MCP 伺服器，每一項都附 GitHub 連結。」
- hero 內 `.toc-chips`：四個領域 + 「MCP 工具」，錨點 id 用 `#domain-1`…`#domain-4`、`#mcp`。
- 每個領域一個 `.section`；Skill 卡用 `.card`，三欄 grid（`repeat(auto-fill, minmax(280px, 1fr))`）。卡內結構：`.tag-muted`（類別）→ `h3`（skill 名，mono）→ 說明 → `.link-arrow`「GitHub」（`target="_blank"`）。刪掉領域標題前的 emoji 與薰衣草紫、鵝黃底色。
- 舊錨點相容：`student_data_analyst_workflow.html` 載入時若 `location.hash` 是 `#skills-catalog` 或 `#mcp-catalog`，`location.replace('skills.html' + 對應錨點)`（`#skills-catalog`→`skills.html`、`#mcp-catalog`→`skills.html#mcp`）。`data_analysis.html` 的 redirect stub 原樣保留。

**A3. `workshop.html` 重排**（由上到下）

1. 麵包屑、`.page-hero`（現有內容不變：h1、副標、三個 tag、主按鈕「開啟學員看板（一鍵複製提示詞）」、連結「課前檢核表」）。
2. **今日時程**（現有 `#timeline`）——每個 Module 列的連結改成兩個：
   - 「看板提示詞 →」→ `00_課程手冊與即時看板/WORKSHOP_BOARD.html#mod{n}`（看板已支援 `#mod1`…`#mod4`）。這是該列的主要連結（`.link-arrow`）。
   - 「教材資料夾 ↗」→ 現有的 GitHub 連結，降為 `--ink-2` 小字連結。
   - 依 §3.3 加 `data-module`。
3. **資料分析實作路線**（原「資料分析實作 5 步驟」）：h2 改「資料分析實作路線」；h2 下一行說明「課堂上由講師帶著走，也可以課後自己做一次。」；四張卡，每張顯示編號、`title`、`goal`、「開始 →」。桌機四欄等寬，≤ 820px 兩欄，≤ 520px 單欄。區塊結尾一顆 `.btn-secondary`「從第 1 步開始 →」。
4. **參考資料**：由 `cfg.references` 產生（現行清單樣式不變）。

**驗收（A）**
- 390px：頁首 5 個導覽項目同一列。
- 任何頁面都沒有「／5」字樣；步驟列顯示 4 步；`curriculum_1105_workflow.html` 沒有步驟列。
- `student_data_analyst_workflow.html#skills-catalog` 會落在 `skills.html`。
- `workshop.html` 每個 Module 列的第一個連結是站內連結。

---

### 6.2 Phase B — 工作坊步驟頁內層換皮

共同作法（4 頁 + `curriculum_1105_workflow.html`）：

- `<head>` 移除 `css/dose_mobile.css`；頁內 `<style>` 區塊中與 dose 主題有關的規則（`--color-*` 變數、`.pharmacy-label`、`.plastic-tray`、`.tear-stub`、漸層背景、`box-shadow: … 0 #…` 硬陰影）全部刪除，改用 §4.2 元件。頁面專屬樣式移到 `css/workshop-pages.css`，頁內 `<style>` 清空（模擬器與目錄頁的互動專用樣式可留在頁內，但顏色、字體、圓角一律改用 tokens）。
- 依 §4.4 換 class；刪除 §4.3 的開發者用語。
- 標題區一律用 `.page-hero`，文案照下表。原本標題下的按鈕列**整列刪除**，只留表中列出的。
- 頁底 prev／next 由 shell 產生，不要自己再放「返回上一步」「前往下一步」按鈕。
- 完成後全 repo 沒有任何檔案引用 `dose_mobile.css` 時，刪除該檔。

| 頁 | eyebrow | h1 | lead | hero 內其他 |
|---|---|---|---|---|
| `student_data_analyst_workflow.html` | （shell 的步驟列已顯示，這裡不放） | 看懂工作流：從官方資料到互動儀表板 | 用 Antigravity 串接日本 e-Stat 官方 API，交給 data-analyst 技能清洗，最後在 Data Atoms 做成儀表板。這一頁先帶你看完五個階段。 | `.toc-chips`：1 拿到資料／2 處理資料／3 探索性驗證／4 洞察與分析／5 建立儀表板（連到五個 `.phase`，id 用 `#phase-1`…`#phase-5`） |
| `estat_api_tutorial_simulator.html` | — | 申請 e-Stat API 金鑰 | 跟著下面的模擬畫面走一次：登入個人頁、申請 appId。URL 欄請填 `http://test.localhost`。 | 主按鈕「重新播放示範」（沿用現有按鈕的功能）；連結「前往 e-Stat 官網」（外部） |
| `estat_catalog_and_research_guide.html` | — | 選題：17 個領域、10 種圖表 | 從生活或商業問題出發，挑一種圖表，再到 Data Atoms 一鍵開啟對應的官方資料。 | 無按鈕。四個數字改 `.stat`（四欄；≤ 640px 兩欄） |
| `curriculum_1105_workflow.html` | 參考資料 | 全日課程架構圖 | 現有說明文字的第一句（「清楚交代今天『使用哪一套工具、用了哪些 Skill、串接哪一些 API』。」），其餘刪除。 | 無按鈕（現有「下一步：分析師工作流」刪除） |

各頁額外事項：

**`student_data_analyst_workflow.html`**
- 刪除整個「全日課程架構：兩大區塊循序推進」區塊（`step 01 / blueprint` 那塊青綠色）。在 lead 下方不用補任何東西——架構圖已在參考資料。
- 刪除「資料分析延伸工具與官方資源」區塊（`step 03 to 05 / resources` 那塊鵝黃色，四張卡都只是連到後面步驟，prev／next 已涵蓋）。
- 五個階段改 `.phase`，h2 改「五個階段」。每張卡右上角的 `role: …` 刪除。卡內既有按鈕（「查閱 17 領域研究指南」「前往 Data Atoms 儀表板」）改 `.link-arrow`。
- Skill／MCP 兩段已在 Phase A 搬走。
- 目標：inline `style=` ≤ 10；桌機整頁高度 ≤ 3,000px。

**`estat_api_tutorial_simulator.html`**
- 模擬器外框保留（它是在模仿 e-Stat 官網，藍色屬於「被模仿的網站」，不算違規），但外框加 1px `--rule` 與 `--radius-lg`，上方加一行 `.eyebrow`「模擬畫面（不是真的 e-Stat 網站）」。
- 模擬器下方的「API 申請實體步驟速查與避坑說明」：改有序清單 + `.callout-warn`（放避坑提醒）。
- ≤ 640px：模擬器容器 `overflow-x: auto`，內部最小寬 640px，上方加一行小字「可左右滑動」。

**`estat_catalog_and_research_guide.html`**
- 步驟列與 h1 之間那條「日本總務省統計局官方入口／API 端點／複製官網網址」橫幅：**移除**，改成 hero 的 lead 後一行小字：「官方入口：e-Stat ↗　API 端點：`api.e-stat.go.jp/rest/3.0/app`」（「複製」按鈕保留為 `.btn-sm.btn-secondary`，沿用 `js/copy.js`）。
- 「檢視視角導航」五顆 → `.tabs`；「快速分類標籤」→ `.tag` 樣式的切換鈕（選中：`--ink` 底白字）；搜尋框高 44px、1px `--rule`、focus 用 `--focus`。
- 區段標題旁的英文／斜線小標（「一般人與學員首選 / 免除證數學」這類膠囊）改 `.tag-olive`，文字保留中文部分。

**`curriculum_1105_workflow.html`**
- 架構圖卡片保留（圖內橘／綠已是 `--accent`／`--olive` 系，維持）。圖外的框改 `.card`；≤ 820px 時圖區 `overflow-x: auto` 並加「可左右滑動」。
- 圖下三個 h3 區塊改成一般 `.section` 內文，不用卡片。

**驗收（B）**
- 4 個步驟頁 + 架構圖頁：`pharmacy-label|mono-label|plastic-tray|tear-stub|btn--` grep 為 0；§4.3 禁用字串為 0；`.page-hero-actions` 內 `.btn-primary` ≤ 1。
- inline `style=`：student ≤ 10、estat_api ≤ 15、estat_catalog ≤ 10、curriculum ≤ 15（SVG 內的屬性不算）。
- 390px 下四頁 `document.documentElement.scrollWidth === clientWidth`。
- 截圖上不得看到漸層色塊；每頁可見的按鈕底色只有 `--ink`（主要）或透明（次要）。

---

### 6.3 Phase C — 影片頁重做、實驗頁瘦身

**C1. `videos.html`**

- `data-nav="videos"`；移除 `class="concept-page"` 殘留的舊 `content-header`／`content-footer` 標記（shell 已經會刪，但原始碼也清掉）。
- `.page-hero`：h1「看影片」；lead「每支一到三分鐘。先看比喻，再回到對應的課程或實驗動手試。」不放按鈕。
- hero 內 `.toc-chips`：「60 秒看懂 AI 盲點」「數位乩童・法器篇」「總覽與暖身」。
- 三個 `.section`，各自一個卡片 grid：

| 區段 id | h2 | 影片（沿用現有 10 個 `<details class="course-video">` 的內容與 id） | grid |
|---|---|---|---|
| `#series-blindspot` | 60 秒看懂 AI 盲點 | `#video-blindspots` 內的 6 支直式（#01–#06）+ `#video-memory` + `#video-strawberry` | 直式卡：`repeat(auto-fill, minmax(168px, 1fr))`，海報 `aspect-ratio: 9/16` |
| `#series-faqi` | 數位乩童・法器篇 | `#video-ep0`…`#video-ep4` | 橫式卡：`repeat(auto-fill, minmax(280px, 1fr))`，海報 `aspect-ratio: 16/9` |
| `#series-intro` | 總覽與暖身 | `#video-overview`、`#video-funnel` | 同上 |

- 橫式或直式以影片實際比例為準（用 `ffprobe` 或讀 `<video>` metadata 確認，不要猜）。沒有海報圖的影片（`#video-memory`、`#video-strawberry`）用 `ffmpeg -ss 1 -frames:v 1` 擷取一張存到 `assets/video-posters/`，檔名 `memory.jpg`、`strawberry.jpg`。
- **既有 id 全部保留**（`#video-ep0` 等被 `js/learning.js` 第 60 行與首頁連結使用）。每張卡的 id 就是原 `<details>` 的 id；`#video-blindspots` 保留為 `#series-blindspot` 區段上的第二個錨點（空的 `<span id="video-blindspots">`）。

**`.video-card` 結構**

```html
<article class="video-card" id="video-ep0">
  <a class="video-card-media" href="media/法器篇EP0_神明的後台.mp4"
     data-video data-title="EP0 神明的後台" data-poster="assets/video-posters/ep0.jpg">
    <img src="assets/video-posters/ep0.jpg" alt="" loading="lazy" width="640" height="360">
    <span class="video-card-play" aria-hidden="true"></span>
    <span class="video-card-time">2:13</span>
  </a>
  <h3>EP0 神明的後台</h3>
  <p>LLM 基礎：Token、機率與生成</p>
  <a class="link-arrow" href="learn.html?lesson=01">動手試</a>
</article>
```

- 標題、說明、片長、「動手試」連結都取自現有 `<summary>` 與 `.course-video-notes` 的內容，不要自己寫新文案。標題去掉 emoji 與「｜」後的長副標（副標放 `<p>`）。
- `.video-card-play`：44px 圓形、`--surface` 底、置中三角形（CSS 畫，不用 emoji）。`.video-card-time`：右下角、mono、`--fs-xs`、半透明 `--ink` 底白字。
- 整頁原始碼不得再有 `<video>` 標籤（播放器由 JS 動態建立），也就不會預載任何影片。

**播放（新檔 `js/videos.js`）**
- 點 `[data-video]`：`preventDefault`，開啟頁面上唯一的 `<dialog class="video-dialog">`，內含 `<video controls playsinline autoplay>`（`src` 設為該連結的 `href`、`poster` 用 `data-poster`）、標題、說明、「動手試」連結、右上角關閉鈕（文字「關閉」）。直式影片 dialog 內 `max-height: 86vh; aspect-ratio: 9/16`；橫式 `width: min(960px, 92vw)`。
- 關閉（按鈕、Esc、點背景）：`video.pause()`、移除 `src`、`history.replaceState` 清掉 hash、焦點回到原卡片。
- 載入時若 `location.hash` 對應某張卡：捲到該卡並自動開啟 dialog（但**不 autoplay**，瀏覽器會擋；顯示海報與播放鍵即可）。
- 沒有 JS 時連結直接開 mp4（這就是 fallback）。
- 每次開啟把 hash 設為該卡 id，方便分享。

**C2. `lab.html`／`js/lab.js`**

- h1 改「做實驗」；lead 合併成一行：「改變條件，觀察模型的回答怎麼變。不需要 API Key 也能做；想接真實模型可用 OpenRouter 或 Gemini。」
- **刪除**開頭「🎬 60 秒看懂 AI 盲點 · 影音實戰實驗室」整塊（`js/lab.js` 約第 250–300 行輸出的 `.season-block-s1`、`.season-block-s2` 與其外框）。
- 下方的實驗清單改為**四組都用同一種列樣式**：現在 `groups.filter(g => g !== '第二季：核心機制與進階實戰')` 把第二季排除在清單外，改成不排除，並把該組在畫面上的名稱顯示為「進階機制」（資料裡的 `group` 字串不改，只改顯示）。
- 有對應影片的實驗列，在標題右側加一個 `.tag-muted`：「影片 0:41」，連到 `videos.html#對應id`（對應關係取自被刪掉的卡片資料；第二季 #07–#12 目前在 `videos.html` 沒有獨立卡片，若找不到對應 id 就不加這個 tag，並記到 OPEN_QUESTIONS）。
- 清單上方加一行：「想先看比喻？到『看影片』→」（`.link-arrow`，連 `videos.html#series-blindspot`）。
- `js/lab.js` 內所有樣板字串的 inline `style=`（74 處）改成 class，樣式寫進 `css/content-layout.css` 的 lab 區段；`#7c3aed`、`#6d28d9`、`#eef2ff`、`#3730a3`、`#c7d2fe`、`#f4f0ff`、`#4c2889`、`#b69cff` 一律換成 tokens（進度條、強調數字用 `--accent`；淡底用 `--accent-soft`）。

**驗收（C）**
- `videos.html` 桌機整頁高度 ≤ 2,400px；原始碼 `<video` 出現 0 次；inline `style=` 為 0。
- `videos.html#video-ep0` 直接開啟會看到 EP0 的 dialog。
- `lab.html` 沒有 `.season-block`；`js/lab.js` 中 `style=` ≤ 5（只允許動態寬度這類數值）。
- `grep -c '#7c3aed\|#6d28d9' js/lab.js` 為 0。

---

### 6.4 Phase D — 首頁與課程頁

**D1. `index.html`**
- `.home-hero` 上方留白：h1 頂端距離頁首底部 ≤ 96px（桌機）、≤ 40px（手機）。左右兩欄改 `align-items: start`（現在是垂直置中，造成上方空白）。
- hero 行動區改為：主按鈕「開始第一站」＋ 兩個 `.link-arrow`：「參加工作坊」（→ `workshop.html`）、「直接查名詞」（→ `encyclopedia.html`）。原本的「參加工作坊？進入工作坊」改成上述寫法。
- **刪除**「你今天是哪一種？」整個 `<section class="wrap entry-section">`（三張卡與 hero 重複）。
- 「先看 3 分鐘影片暖身」區因此上移；三張卡改用 §6.3 的 `.video-card` 結構（連結 `videos.html#video-funnel`、`#video-ep0`、`#video-strawberry`，直接換頁，不在首頁開 dialog）。第三張「草莓與 Token」現在是一片黃底加半截字，改用 C1 新擷取的 `assets/video-posters/strawberry.jpg`，三張卡統一 `aspect-ratio: 16/9; object-fit: cover`。
- 移除 `<script src="js/digital_jitong.js">`（Q3）。
- 其餘區塊（六站、學完後、想再深入）不動。

**D2. 課程頁（`js/learning.js`、`css/learning.css`）**
- `.lesson-sticky-nav` 改成「進度列」外觀，不要像分頁：透明底、無外框；三項文字前加編號「1 動手試　2 看解說　3 確認理解」，項目間用 1px `--rule` 短線連接；目前所在區段：文字 `--accent` + 底部 2px 線；其餘 `--ink-2`。維持 sticky 與現有 `aria-current` 邏輯。
- 完成按鈕 `#complete-lesson`：**移除 `disabled` 屬性**，改用 `aria-disabled="true"` + 樣式（`--surface-2` 底、`--ink-2` 字）。未通過時按下去：捲到 `#lesson-check`、把焦點放到第一個 radio、`#quiz-feedback` 顯示「先回答這一題，答對就能完成本站。」通過後行為與現在相同。
- `.completion-hint` 未通過時的文字改「先回答上面的問題（答對才會記錄進度）」。
- 「先看下一站」連結保留。

**驗收（D）**
- 1440×900 首頁第一屏：h1 的 `getBoundingClientRect().top` ≤ 64 + 96；頁面上「工作坊」入口在 hero 內恰好 1 個；`.entry-section` 不存在；右下角沒有浮動頭像。
- 課程頁未答題時按「完成本站」：頁面捲到測驗、出現提示文字、`llm_learning_progress_v1` 沒有變化。

---

### 6.5 Phase E — 舊頁收編、參考頁換皮

**E1. `00_LLM本質探秘實驗室.html` → redirect stub 到 `lab.html`**
- 先核對：該頁 8 個分頁（Token 分詞與全球模型生態、無時鐘感知與凍結、無記憶與對話重送、機率預測與認知陷阱、提示詞注入〈北捷案例〉、純口算盲區與代碼、自主代理人越界滲透、API 外洩與前後端）在 `js/lab.js` 的實驗清單中是否都有對應。把對照表寫進 `docs/LLM_OLD_NEW_CONTENT_AUDIT.md` 的新段落。
- 全部有對應 → 改成 redirect stub（hash 對應到 `lab.html` 的實驗 id）。
- 有缺 → 仍改 stub，缺的項目記入 OPEN_QUESTIONS，並把原檔另存 `docs/legacy/00_LLM本質探秘實驗室.html`（加 `<meta name="robots" content="noindex">`，不從任何頁面連過去）。
- `llm_lab.html` 的 redirect 目標改 `lab.html`。

**E2. `01_Module1_AI_Frontier_Full_Spectrum_Landscape_2026.html` → redirect stub 到 `encyclopedia.html`**
- 依 `docs/LLM_CONTENT_MIGRATION.md` 的新舊對照設定 hash 轉址（做法同 `mobile.html` 現有的 `routes` 物件）。
- 原檔同樣另存到 `docs/legacy/`（noindex）。這頁有 35,000px、92 處藍紫色，不值得換皮。

**E3. `japan_population_dashboard.html`**
- 移除頁首下整條藍色「日本總務省統計局官方資料門戶」橫幅 → 併入 `.page-hero` 的 lead 後一行小字（同 §6.2 目錄頁作法）。
- `.page-hero`：eyebrow「參考資料・範例」；h1「日本人口儀表板範例」；lead 沿用現有副標（「半世紀（1975–2024）人口結構演變與 Data Atoms 數據原子矩陣」）；主按鈕「開啟 Data Atoms 工作台」；刪掉 4 顆 `nav-btn`（學員工作流指南／17 領域研究指南／API 申請錄影教學／Data Atoms Studio）與綠色「API 連線正常」狀態膠囊。
- KPI 四格改 `.stat`（數字不上色；右上角的「連續 15 年遞減」等註記改 `.tag-muted`，移除 ▼▲ 以外的色彩）。
- 分頁列改 `.tabs`，去掉 emoji。橘色「Data Atoms（數據原子）化合分析法」橫幅改 `.callout-info`。
- ECharts 配色：把各 `option.color` 與 series 的 `itemStyle.color` 換成 `--chart-1`…`--chart-6`（用 `getComputedStyle(document.documentElement).getPropertyValue('--chart-1')` 讀值）；軸線與格線 `--rule`、軸文字 `--ink-2`。**每張圖換色後都要截圖比對**，若有圖表因此難以分辨系列，改回原色並記入 OPEN_QUESTIONS。
- 字體：移除 Geist，改 tokens。

**E4. `system_architecture.html`、`openrouter_architecture.html`**
- 改 `data-workshop`；麵包屑改「首頁 ／ 工作坊 ／ {頁名}」（刪掉「11/5 實戰課程流程」）。
- `.page-hero`：eyebrow「參考資料」；h1 分別為「系統架構：GitHub Pages + Google Apps Script」「OpenRouter 三階資料流」；lead 用現有第一句。全大寫英文小標（`SYSTEM ARCHITECTURE · ZERO SERVERLESS`）刪除。
- 彩色 emoji 膠囊（`badge-item`，如「零主機費用（$0／月）」）改 `.tag-muted`，去 emoji。
- 深色終端機風格的架構圖**保留不動**（它是圖，不是版面），但外框圓角改 `--radius-lg`，字體把 `Inter`、`DM Mono` 換成 tokens。

**E5. 其他**
- `data_atoms_demo.html`：加 shell（`data-nav="workshop" data-workshop`）、麵包屑、`.page-hero`（h1「Data Atoms 操作示範影片」）；頁內 `<style>` 改用 tokens。
- `strawberry_token_60s.html`、`memory_context_60s.html`（動畫播放頁）：不套完整 shell，只在最上方加一條 44px 細列：「← 回到看影片」（連 `videos.html#video-strawberry`／`#video-memory`）；移除 Google Fonts `<link>`，字體改 tokens 的 sans／mono。動畫內容本身不動。

**驗收（E）**
- `fonts.googleapis` 在根目錄、`concepts/`、`topics/`、`00_課程手冊與即時看板/` 的 HTML 中出現 0 次。
- 上述每一頁 390px 下不橫向捲動。
- `japan_population_dashboard.html`：`#2c548a|#ea580c|#c07d2b|#fff7ed`（現有的藍色橫幅、橘色 CTA 與橘色淡底）grep 為 0（圖表若依規則改回原色者除外，需列在 OPEN_QUESTIONS）。

---

### 6.6 Phase F — Data Atoms、手冊、看板、topics

**F1. `data_atoms.html`（只動外殼）**
- 頂部工具列：只有「匯出圖表」是 `.btn-primary`（`--ink` 底）；「自訂看板」「組合看板」「釘選當前」改 `.btn-secondary`（移除紫色、藍色實心底）。維度欄位的藍色、度量的綠色（Tableau 慣例）不動。
- 按鈕與分頁文字內的 emoji 移除（19 處）；圖示改用頁面已有的 SVG，或直接不要圖示。
- 底部黑色提示條（「已載入…」）：改為 4 秒後自動淡出，且不遮住圖表 x 軸標籤（位置改到圖表區上方的狀態列）。
- **`.app-gate`（小螢幕提示）**：`window.matchMedia('(max-width: 900px)')` 成立且 `sessionStorage.app_gate_dismissed !== '1'` 時，在工具上方顯示一張 `.card`：
  - 標題「Data Atoms 需要大一點的畫面」
  - 內文「請用電腦，或把平板轉成橫向。手機上可以先看示範。」
  - 主按鈕「看操作示範影片」→ `data_atoms_demo.html`；連結「看操作手冊」→ `data_atoms_manual.html`；小字按鈕「仍要在這裡開啟」→ 設 `sessionStorage.app_gate_dismissed = '1'` 並隱藏卡片。
  - 顯示提示卡時，下方工具區 `display: none`；按「仍要開啟」才顯示。

**F2. `data_atoms_manual.html` 瘦身**
- 這頁是產生出來的（見 `docs/MANUAL_BUILD.md`、`scripts/capture_manual_images.py`）。**改產生流程，不要手改 HTML**：圖片輸出為獨立檔 `assets/manual/step-{nn}.webp`（寬 1440、品質 80），HTML 用 `<img loading="lazy" width height>` 引用。
- 加 shell：`data-nav="workshop" data-workshop`；現有自帶頁首移除；麵包屑「首頁 ／ 工作坊 ／ Data Atoms 操作手冊」。
- 目標：HTML ≤ 200 KB；單張圖 ≤ 250 KB。

**F3. 看板 `WORKSHOP_BOARD.html`／`css/board.css`**
- 分頁列套 §4.2 `.tabs` 的手機行為（可橫向捲動 + 右緣漸層 + 選中項自動置中）。
- 手機分頁文字縮短（用 `<span class="tab-long">`／`<span class="tab-short">` 兩份文字，≤ 640px 顯示短的）：「M1 清洗」「M2 Skill」「M3 建站」「M4 短片」「課前檢核」。
- 第一張卡「開場破冰實作」裡三個連到 `01_Module1_…/*.md` 與 `diagram_*.html` 的連結：`.md` 連結改指 GitHub 上的檔案頁（`https://github.com/nutcelvischen-jpg/dataviz-motion-skill/blob/main/…`，Pages 上開 `.md` 只會看到原始文字或下載），並加外部連結箭頭。
- 每個 `.prompt-block` 上方的 `PROMPT 1-1：…` 小標：改 `.eyebrow` 樣式、文字改「提示詞 1-1：…」。

**F4. `topics/*.html`（6 頁，547 個 inline style）**
- 把重複的 inline style 抽成 class 寫進 `css/content-layout.css`（`.macro-metric-*`、`.specs-table`、`.timeline-badge`、`.table-container` 已有 class 名，補上樣式即可）。表格欄寬 `style="width: 20%"` 改 `<colgroup>`。
- 目標：每頁 inline `style=` ≤ 5。視覺結果與現在相同（這一項是清理，不是改版）。

**驗收（F）**
- 390px 開 `data_atoms.html` 第一屏是提示卡；按「仍要在這裡開啟」後工具出現，重新整理後不再出現提示卡（同一個分頁工作階段內）。
- `data_atoms_manual.html` ≤ 200 KB。
- 390px 看板：五個分頁文字完整可見或可滑動到，沒有被切一半的字。

---

### 6.7 Phase G — Repo 整理（不刪素材）

1. 產生 `docs/UNREFERENCED_MEDIA.md`：列出 `media/`、`videos/`、`voice_*/`、`preview_frames/`、`motion_*/`、`earshot_sfx/` 中**沒有被任何上線頁面（根目錄、`concepts/`、`topics/`、`00_課程手冊與即時看板/` 的 HTML 與 `js/*.js`）引用**的檔案，含大小與小計。只列清單，**不移動、不刪除**。
2. 根目錄的 `SITE_REDESIGN_SPEC.md`、`LLM_LEARNING_REDESIGN_SPEC.md`、`LLM_CONTENT_ARCHITECTURE_V2_SPEC.md`、`GITHUB_HANDOFF.md` 與本檔搬到 `docs/specs/`；`PRODUCT.md`、`DESIGN.md`、`README.md`、`SKILL.md` 留在根目錄。更新彼此之間的相對連結。
3. `DESIGN.md` 補上本輪新增的元件（§4.2）與禁用清單（§4.3），讓它成為唯一的設計說明。
4. 根目錄 4 支 `.py`（`ask.py`、`chat.py`、`finetune_run.py`、`llm_limits_demo.py`）：先 grep 是否被 README、教材 `.md` 或其他腳本引用。沒有 → 搬到 `scripts/`；有 → 不動並記入 OPEN_QUESTIONS。
5. 根目錄 3 張檔名含空白的 PNG（`Confident Chibi Man with Glasses.png` 等）與 `avatar_host_clean.png`、`curriculum_1105_workflow.png`：同樣先查引用；沒被引用的搬到 `assets/avatar/`（已有同系列檔案）或 `assets/`，有引用的同步改路徑。
6. `README.md`：更新「課程時程」下方的網站導覽說明（5 項導覽、4 步路線、`skills.html`）。

---

## 7. 不要動的東西（總表）

- `js/learning-data.js`、`js/learning-progress.js` 的資料與進度邏輯。
- `data_atoms.html` 的圖表、拖放、資料集、匯出邏輯；`css/pygwalker.css` 的版面（只改 §6.6 F1 列出的按鈕顏色）。
- `js/digital_jitong.js` 的對話功能與 `google_apps_script/`。
- `index.html` 開頭 `oldAnchors` 轉址對應表；`mobile.html`、`data_analysis.html` 的 redirect。
- 任何提示詞內文、CSV、教材 `.md` 的內容。
- `dist_public_web/`、`src/`、`motion_*/`、`scripts/render_*`（舊版副本與影片製作來源，不在本輪範圍）。

---

## 8. 文案對照（集中一處，方便檢查）

| 位置 | 現在 | 改成 |
|---|---|---|
| 頂層導覽 | 跟著學／查概念／做實驗／工作坊 | 跟著學／查概念／做實驗／看影片／工作坊 |
| `videos.html` h1 | 數位乩童影片課堂 | 看影片 |
| `lab.html` h1 | 大語言模型本質探秘實驗室 | 做實驗 |
| `workshop.html` h2 | 資料分析實作 5 步驟 | 資料分析實作路線 |
| 步驟名稱 | 全日課程架構／分析師工作流／申請 e-Stat API／17 領域研究指南／Data Atoms 儀表板 | 看懂工作流／申請 e-Stat API／選題／做儀表板（架構圖移到參考資料） |
| 步驟頁 h1 | 見 R7 | 見 §6.2 表 |
| 首頁 hero 次要連結 | 參加工作坊？進入工作坊 → | 參加工作坊 →　直接查名詞 → |
| 課程頁完成提示 | 答對上方問題後，即可完成本站。 | 先回答上面的問題（答對才會記錄進度） |
| 看板提示詞小標 | PROMPT 1-1：… | 提示詞 1-1：… |
| 全站 | 點擊／點擊執行 | 點／按 |

各頁 `<title>` 同步改為「{h1}｜{SITE_CONFIG.site.name}」。

---

## 9. 驗收：擴充 `scripts/qa_site.py`

在現有檢查之外新增（每項失敗要印出頁名與數值）：

**靜態檢查**
1. §4.3 禁用 class 與禁用字串：掃描根目錄、`concepts/`、`topics/`、`00_課程手冊與即時看板/` 的 HTML → 0。
2. 沒有檔案引用 `css/dose_mobile.css`，且該檔不存在。
3. `fonts.googleapis`：同範圍 → 0。
4. inline `style=` 上限：依 §6.2、§6.3、§6.6 各頁數字；未列出的頁面不得比基準 commit 增加。
5. h1–h3、`<button>`、`.btn`、`[role=tab]` 文字內 emoji → 0（`data_atoms.html` 也要過）。
6. `videos.html` 原始碼 `<video` → 0。
7. `SITE_CONFIG.steps.length === 4`；HTML 與 JS 中不得有寫死的「／5」。
8. 內部連結與錨點全部有效（現有檢查，補上 hash 目標存在性：`videos.html#video-*`、`WORKSHOP_BOARD.html#mod*`、`skills.html#domain-*`／`#mcp`）。
9. 檔案大小：`data_atoms_manual.html` ≤ 200 KB。

**瀏覽器檢查（Playwright，1440×900 與 390×844）**
10. 所有上線頁面 `scrollWidth === clientWidth`（`data_atoms.html` 在 390px 以提示卡狀態檢查）。
11. 每頁 `main` 內可見的 `.btn-primary` ≤ 1（`data_atoms.html` 工具區 ≤ 1）。
12. 每頁恰好 1 個可見 `h1`，且 h1 文字 ≤ 24 個全形字。
13. 390px：`.sh-nav a` 五個元素的 `getBoundingClientRect().top` 相同。
14. 首頁 1440×900：`h1.top ≤ 160`；`.entry-section` 不存在；沒有 `.jitong-*` 浮動元素。
15. `videos.html#video-ep0`：載入後 `dialog[open]` 存在且標題含「EP0」。
16. 課程頁：未答題點 `#complete-lesson` 後 `localStorage.llm_learning_progress_v1` 不變、`#quiz-feedback` 有文字。
17. 四個步驟頁第一屏截圖的像素取樣：背景色只允許 `--paper`、`--surface`、`--surface-2`、`--code-bg` 及模擬器外框內的顏色（用來抓漏掉的漸層色塊；取 20 個固定取樣點即可）。

**完成定義**：以上全綠 + `docs/redesign-screenshots/V2-P{A..G}/` 截圖齊全 + `docs/REDESIGN_OPEN_QUESTIONS.md` 的「V2」段落列出所有偏離規格之處。
