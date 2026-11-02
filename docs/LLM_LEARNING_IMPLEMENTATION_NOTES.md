# 六站學習路線維護說明

## 入口與課程

- `index.html`：學習首頁；舊圖鑑的 12 個指定章節／錨點 hash 轉送至 `encyclopedia.html`；其他內部元件 ID 不自動轉送。
- `learn.html?lesson=01` 至 `06`：共用六站課程頁。
- `js/learning-data.js`：課程文字、圖解節點、理解題與延伸連結；題目答案存在前端，適用自學而非防作弊測驗。
- `js/learning.js`：頁面渲染、互動示範及導覽；`css/learning.css`：新版課程樣式。
- `lab.html?experiment=memory&lesson=02`：指定實驗，課程入口預設模擬，並提供返回對應課程。獨立開啟時沿用原設定。
- `00_課程手冊與即時看板/WORKSHOP_BOARD.html#module1-practice`：資料分析實作。

## 進度與示範

`js/learning-progress.js` 將進度存在 `llm_learning_progress_v1`；開始、答對及主動完成分別記錄。重設只清除此 key。瀏覽器限制儲存時改以當頁記憶體運作。`file:` 網址在不同瀏覽器可能無法跨檔案共享 localStorage，建議使用本機靜態伺服器。

所有六站必要互動都在本機執行，無需金鑰。Token 為簡化示意，第四站使用瀏覽器本地 JavaScript 計算，第五站價格是教學假設；模型回答屬示範，非即時結果。

## 保留事項

根目錄及模組內的 `00_LLM本質探秘實驗室.html`、`llm_lab.html` 符號連結、其他圖鑑副本及 `dist_public_web` 均保留原狀；新版入口以根目錄的 `index.html`、`learn.html`、`encyclopedia.html`、`lab.html` 為準。修改課程不會自動同步歷史副本。舊圖鑑與實驗室內容的模型、價格與新聞資料未進行全面事實查核。

## 第二輪：內頁結構與內容位置

- 圖鑑先呈現工作案例與專有名詞區，再依模型與資料、提示詞與上下文、Agent 與圖形、可靠使用、模型與成本及專題選讀排列；六篇長篇選讀仍位於 topics 資料夾。
- 第 02 站、圖鑑上下文、記憶實驗與 memory.html 共用大華與皮皮的例子。
- js/lab.js 提供八個穩定實驗 ID、各自的教學操作及課程返回；舊預設與解析由 js/lab-legacy-data.js 保存於進階區。
- 實驗標題下的「使用 API Key／模型設定」可開啟進階區並跳至模型選擇；選擇 OpenRouter 或 Google Gemini 後才顯示各自的金鑰欄位。引導示範仍使用本機模擬，真實 API 僅供自由測試。Gemini 指向 gemini-3.6-flash，原有 2.0 Flash 已由 Google 停用；未使用真實金鑰驗證連線。
- js/model-reference-data.js 提供模型卡與兩組費率切換資料；js/reference.js 驅動圖鑑操作。舊規格、價格和硬體矩陣另外保留於 encyclopedia.html 展開區，不會自動隨 JS 資料更新。所有舊資料尚未逐項查核。
- js/content-navigation.js 處理目錄、收合區深連結，以及移往專題的四個舊錨點。無 JavaScript 時，圖鑑保留四個手動連結。
- mobile.html 是相容入口：無 hash 回學習地圖；五個 view hash 轉往對應響應式頁面。
- scripts/llm_preview.py 僅綁定 127.0.0.1，白名單提供學習網站和明確連結的課程素材；瀏覽器進度依本機網址及埠號區分。
- 詳細搬移對照與未核對資料分別見 docs/LLM_CONTENT_MIGRATION.md、docs/LLM_CONTENT_REVIEW_NOTES.md。
- Impeccable 使用時應明確讀取 .impeccable/surfaces/llm-learning.md；現有簡述尚未綁定自動選取目標。
- 六站與內頁沿用相同奶油底、墨色與細線；兩套樣式的磚紅、橄欖色及襯線字體堆疊略有不同。
- 舊首頁 12 個錨點與 mobile.html 的自動導向需要 JavaScript；關閉時 mobile 頁提供手動入口，圖鑑另有四篇搬移專題的手動連結。未知手機 hash 回到首頁。

## 名詞與閱讀順序調整

- encyclopedia.html#concept-map 與 #term-map：以活動資料案例串起任務、上下文、工具及呈現，並按角色分組查閱名詞。
- encyclopedia.html#prompt-context、#context-engineering、#agent-evolution 及 #graphic-ui：分別說明 Prompt、上下文準備、Agent Loop 與圖形／介面。原有 ID、舊教材內容與互動保留。
- 調整前的預覽檔案備份位於 backups/llm-before-glossary-structure；最初改版前的舊版仍在 dist_public_web。瀏覽器中的進度與 API 設定不包含在備份中。
