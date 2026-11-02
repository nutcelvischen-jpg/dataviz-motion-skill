# 第二輪內容遷移清單

本次依第二輪規格重整根目錄的正式入口。原教材研究、數據、產品和案例未在本次全面查核；舊內容進入選讀或展開區時均有狀態提示。

| 原位置 | 新位置／處理 |
|---|---|
| 圖鑑：LLM 與 Token | encyclopedia.html#glossary、#token-visualizer-card；保留分詞輸入與四種原預設；首次載入改為較短的示例 |
| 圖鑑：Strawberry | encyclopedia.html#strawberry；簡化主說明，原長篇在展開區 |
| 圖鑑：上下文／無記憶 | encyclopedia.html#context、lab.html?experiment=memory、memory.html；完整時序改為可讀表格，模組內舊 SVG 副本未改 |
| 圖鑑：採樣、回答與查證 | encyclopedia.html#sampling、#evidence-check、#tool-verification |
| 圖鑑：API Key、System Prompt | encyclopedia.html#key-permissions、#instruction-boundaries、security.html；原 System Prompt 詳例到 topics/agent-ecosystem.html |
| 圖鑑：Embeddings、微調、LoRA、Unsloth、MoE | encyclopedia.html#knowledge-methods 與 #moe 有可見說明；topics/model-adaptation.html 保留原教材的深入內容 |
| 圖鑑：成本與 API 試演 | encyclopedia.html#pricing、#api-trial；保留快速用量、兩組舊費率、模擬與原供應商選擇 |
| 圖鑑：模型卡與三張矩陣 | encyclopedia.html#models、#pricing、#cloud-vs-local 的詳細區 |
| 圖鑑：雲端／地端 | encyclopedia.html#cloud-vs-local；原圖和硬體矩陣在展開區 |
| 圖鑑：Agent 演進、時長、商業生態 | encyclopedia.html#agent-evolution、#agent-terms 與 topics/agent-ecosystem.html；十個核心名詞與五個原比較頁籤保留 |
| 圖鑑：代理人事件 | topics/agent-incidents.html；舊 #agent-breach 轉送 |
| 圖鑑：總體經濟 | topics/ai-economy.html；舊 #macro-economy 轉送 |
| 圖鑑：蒸餾與防禦 | topics/model-distillation.html；舊 #distillation-security 轉送 |
| 圖鑑：世界模型與算力 | topics/frontier-research.html；舊 #world-models-math-space 轉送 |
| 舊實驗室八組預設與原解說 | js/lab-legacy-data.js；各實驗的進階區可選預設或展開原解說 |
| 舊手機分頁 | mobile.html 相容入口；對應的新圖鑑、實驗及工作流程為同一內容來源 |
| 舊手機案例特有敘述 | metro.html「來源與下一步」展開區，標示原文與未核對狀態 |
| 工作坊看板入口 | 本輪將舊實驗室入口改指向 lab.html；原標示為 Data Atoms Studio、實際連到 index.html 的入口，在第一輪已改名為六站學習地圖 |

八個實驗的 ID 未改，顯示順序以學習問題分組。每個實驗現在有專屬預測、操作、結果與延伸入口。既有六站進度資料格式及完成規則未改。

## 專有名詞與閱讀路徑補充

圖鑑先顯示一個任務的整體流程，再以模型與資料、提示詞與上下文、Agent 與工具、安全與查證、圖形與介面五組查閱名詞。Prompt、Context Engineering、Agent Loop 和 Graphic／Generative UI 有各自的詳細區，舊有段落與書籤仍可使用。

## 舊版逐項內容對照

本次另對照舊圖鑑、八個實驗、圖解、案例及手機分頁，補回取樣、BPE、即時資訊、Agent 時長、上下文管理及舊實驗結語／來源，並保留兩張可連結的舊圖解。完整項目、位置與限制請見 [LLM_OLD_NEW_CONTENT_AUDIT.md](LLM_OLD_NEW_CONTENT_AUDIT.md)。


## 2026-11-01：搜尋目錄與獨立主題頁

上表記錄前一輪遷移位置。這一輪將 `encyclopedia.html` 改為查閱目錄，保留 35 個名詞、五類分類、10 個延伸入口；完整解說拆入 `concepts/` 的 21 頁。上表的 `encyclopedia.html#…` 舊書籤仍有效，明確對照位於 `js/reference-routes.js`。

| 查閱範圍 | 新的詳細頁 |
|---|---|
| 整體任務與模型 | `concepts/overview.html`、`concepts/model.html` |
| Token、BPE、採樣與即時資訊 | `concepts/tokens.html`、`concepts/sampling.html`、`concepts/time.html` |
| Embedding、RAG、微調、LoRA、蒸餾、MoE | `concepts/knowledge.html`、`concepts/moe.html` |
| Prompt、上下文及資訊管理 | `concepts/prompt.html`、`concepts/context.html`、`concepts/context-engineering.html` |
| Agent、Loop、工具與運作限制 | `concepts/agent.html`、`concepts/agent-tools.html`、`concepts/agent-operation.html` |
| Graphic、Generative UI、Computer Use | `concepts/graphics.html` |
| 證據、工具核對、指令與憑證 | `concepts/evidence.html`、`concepts/verification.html`、`concepts/injection.html`、`concepts/api.html` |
| 用量、模型與部署比較 | `concepts/cost.html`、`concepts/models.html`、`concepts/deployment.html` |

六站課程沿用原 ID、測驗與進度資料；把預測及較長解說設為可展開，不刪除教材。`lab.html` 新增實驗選擇目錄，原 `?experiment=` 八種網址保留。記憶課的自由測試可用 `lab.html?experiment=memory&lesson=02&mode=free#advanced` 直接展開。

本輪修改前的網站快照在 `backups/llm-before-simple-navigation/`；原版 `dist_public_web/` 未修改。
