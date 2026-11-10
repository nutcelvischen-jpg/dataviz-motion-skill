# LLM 學習網站：現有設計約定

2026-11-01 依已實作介面記錄。適用範圍是 LLM 學習網站；不約束同一資料夾內的 Data Atoms、工作坊看板或影片專案。

## 閱讀與操作

- 主導覽固定三個任務：跟著學、查概念、做實驗。三者依序對應課程地圖、參考目錄、實驗目錄。
- 六站是學習順序；五類是名詞分類。課程站數用於進度，不將名詞分類編成另一套學習步驟。
- 查閱目錄以搜尋、篩選與詞條列呈現。每列包含名稱及一句解釋，整列可點；避免把完整解說或另一套章節目錄堆在搜尋前。
- 概念頁一次閱讀一個主題，包含返回目錄、說明與適當的下一步。查詢文字與分類放在網址，返回時可恢復。
- 六站頁依動手試、看解說、確認理解排列。預測、長說明、名詞定義、延伸資料可展開。只有通過測驗並按下完成才更新完成進度。
- 實驗頁把操作與結果放在一起。免金鑰示範先可用，API Key／自由測試入口須明確可見。

## 視覺

延續既有奶油紙色、深墨字、中文襯線標題及細分隔線。這是已選定的視覺方向，不因通用偵測器的 cream-palette 提示換色。

主要變數由 `css/content-layout.css` 定義：紙色 `#f7f5ee`、內容底 `#fffefa`、正文 `#20231f`、次要文字 `#535950`、線條 `#d7d6c9`、重點／連結 `#873b29`、橄欖綠 `#415c49`。課程的 `css/learning.css` 延續相同風格。

標題使用既有中文襯線字體組；正文及控制項使用既有系統中文字體組。目錄最大寬度 1060px；概念閱讀區最大寬度 800px。以字級、留白、線條建立層級，避免為每段正文加卡片。比較、資料流與實驗操作區可使用有意義的區塊。

## 小螢幕與狀態

- 手機主導覽維持三欄；分類可換行，詞條名稱與解釋改為上下排列。
- 長表格在自身容器橫向捲動，不讓整頁超寬。
- 搜尋保留無結果提示、一鍵清除及回到全部；篩選有 `aria-pressed`。
- 鍵盤焦點可見；輸入有標籤；動態結果與錯誤訊息有狀態區；展開內容採原生 details。
- 示意切分、假設價格、固定模擬回覆繼續標示。原教材資料沿用原有的待核對提示。
- 不在讀取頁面或選擇預設時自動呼叫模型。既有金鑰與進度儲存名稱保持相容。

## 圖像來源

本輪沒有新增裝飾圖片或替換教材圖解。驗收截圖是本機網站的實際畫面，放在 `docs/content-v2-screenshots/`，不屬於網站展示素材。

## 2026-11-10 整併後新增的約定

整個 repo（學習地圖、概念、實驗、工作坊）共用同一套設計，細節見 `docs/specs/SITE_REDESIGN_SPEC.md`。

- **tokens**：`css/tokens.css` 在各頁 CSS 之後載入，統一覆蓋舊變數（含 `--muted`、`--serif` 等別名）。新增顏色一律用 tokens，不再寫死色碼；不使用藍色與紫色漸層。
- **版型**：頁首、頁尾由 `js/site-shell.js` 注入，頁面只需在 `<body>` 設 `data-nav`（learn／concepts／lab／workshop）。主導覽四項：跟著學、查概念、做實驗、工作坊。工具頁用 `data-shell="app"`（44px 精簡列，不放頁尾）。
- **工作坊步驟列**：`data-step="1..5"` 啟用步驟列與頁底上一步／下一步；步驟定義只在 `js/site-config.js`，日期與授課資訊也只改那裡。
- **元件**：`css/components.css`（`.btn-primary` 每頁最多一顆、`.tag`、`.card`、`.callout`、`.prompt-block` 搭配 `[data-copy]`）。按鈕與導覽不放 emoji。
- **數位乩童**：只在首頁與影片頁出現，預設為 48px 圓形並可關閉（`localStorage['jitong_dismissed']`）。
- **投影模式**：工作坊頁右上角切換，或加 `?present=1`。
- **媒體**：根目錄不放 mp4／wav，放 `media/`；已存在於 `videos/` 的檔案直接引用 `videos/`。
- **驗收**：`python3 scripts/qa_site.py` 必須全部通過。

## 2026-11-10 第二輪（V2）新增的約定

規格見 `docs/specs/SITE_REDESIGN_SPEC_V2.md`。與上一節衝突時以這一節為準。

- **主導覽五項**：跟著學、查概念、做實驗、看影片、工作坊（`data-nav` 多一個 `videos`）。
- **資料分析實作路線是 4 步**（`data-step="1..4"`）：看懂工作流 → 申請 e-Stat API → 選題 → 做儀表板。全日課程架構圖、Skill 與 MCP 清單（`skills.html`）屬於參考資料，不算步驟。步驟若要對應時程的 Module，在 `js/site-config.js` 的 `steps[n].module` 填 1–4。
- **頁面標題區**一律用 `.page-hero`（`.eyebrow` → `h1` → `.lead` → 最多一顆 `.btn-primary` 加一個 `.link-arrow`）。h1 要短，細節放 `.lead`。
- **新元件**（`css/components.css`）：`.page-hero`、`.eyebrow`、`.section`、`.toc-chips`、`.phase`／`.phase-num`、`.stat`、`.tabs`、`.scroll-hint`、`.btn-sm`。工作坊內頁版面在 `css/workshop-pages.css`（`.wp-wrap`、`.skill-grid`）。
- **影片**：`videos.html` 是卡片牆，原始碼不放 `<video>`；點卡片才由 `js/videos.js` 在 `<dialog>` 建立播放器。卡片 id（`#video-ep0` 等）就是分享用的網址錨點。
- **不要再用**：`pharmacy-label`、`mono-label`、`plastic-tray`、`tear-stub`、`btn--*` 這些舊 class；漸層色塊；英文等寬小標（`step 01 / blueprint` 這類）；`css/dose_mobile.css`（已刪除）。
- **數位乩童**：只在影片頁出現。
- **工具頁**（Data Atoms）在 900px 以下先顯示提示卡，使用者按「仍要在這裡開啟」才顯示工具。
- **圖表色**：`--chart-1`…`--chart-6`（`css/tokens.css`）供新圖表使用；既有圖表的資料配色未更動。
