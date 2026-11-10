# 概念心智圖與任務流程圖：整合驗收

日期：2026-11-02。依據：`docs/LLM_AGENT_CONCEPT_MAP_PROPOSAL.md` 與使用者同意整合的指示。

## 完成內容

- `concepts/overview.html` 整合六個問題組成的心智圖，以及整理活動報名表的 Agent 工具流程圖。
- 心智圖先顯示核心名詞，一次展開一支；名詞使用一般連結，直接抵達既有或補充介紹的對應段落。
- 流程區分準備資訊、模型提出請求、程式檢查、工具執行、核對結果與交付；保留未完成時回到模型的箭頭及停止條件。每步細節可以另外展開。
- 首頁加入可點選的簡要概念圖；查閱目錄及六站課程提供全圖入口。主要導覽仍為跟著學、查概念、做實驗。
- 概念閱讀頁辨識 `frommap`，回到原分支或原流程；原有搜尋與分類返回狀態仍保留。
- 補充白話的記憶四層、Workflow／單次工具呼叫／Agent 比較、Transformer／Attention／推論、工具參數格式、檢索流程、Evals／Trace。進階解說使用可展開區塊，原有長文連結仍在。
- 查閱目錄由 35 個詞條增加為 45 個，10 項延伸資料維持。新增詞條為 Transformer、Attention、Inference、Memory、Context、Workflow、Tool、Schema、Evals、Trace。

## 保留與備份

修改前的 43 份相關檔案及 SHA-256 清單保存在 `backups/llm-before-concept-map-20261102/`。更早的備份與 `dist_public_web/` 原站未改動。

`docs/LLM_CONCEPT_MAP_STATIC_CHECKS.json` 記錄本次靜態驗收：

- 35 頁、717 個本機連結／資源引用：沒有缺檔、失效的靜態段落錨點或重複 ID。課程與實驗由程式產生的已知錨點另以執行與原有測試驗證。
- 21 個概念頁的 246 項原有教學文字單位均保留；這項比較排除麵包屑導覽文字。
- 原查閱目錄的 35 個名詞與 10 項延伸資料，名稱和目的地全部保留。
- `lab.html`、`js/lab.js`、`js/lab-legacy-data.js`、`js/learning-progress.js`、`js/learning-data.js`、`js/reference.js`、`js/reference-routes.js` 與修改前版本逐位元相同。
- `js/learning.js` 的修改只加入本站對應的概念圖連結，沒有改動完成條件、測驗或進度邏輯。

## 自動檢查

下列六組檢查全部通過：

1. `node scripts/test_llm_catalog.js`：45 個詞條、10 項資料、搜尋與別名、分類、空結果復原、目錄返回狀態、七種地圖返回位置、拒絕不合法返回位置、45 個舊書籤、獨立章節互動。
2. `node scripts/test_llm_learning.js`：六站、完成門檻、續讀、保存、重設隔離、損壞資料與無法儲存時的處理。
3. `node scripts/test_llm_content_v2.js`：舊書籤、巢狀段落、錯誤 hash、八項實驗識別值。
4. `node scripts/test_llm_lab_api.js`：原 API 設定與兩條請求路徑，使用測試傳輸。
5. `node scripts/test_llm_reference_api.js`：原圖鑑模擬、設定與兩條 API 路徑，使用測試傳輸。
6. `python3 scripts/test_llm_preview.py`：允許網站資源及原站預覽，拒絕無關檔案；新圖的 CSS／JS 已加入預覽清單。

另執行 `node --check js/concept-map.js`，語法檢查通過。

沒有送出真實模型 API 請求；以上不宣稱已驗證外部供應商的即時服務狀態。

## 實際畫面與操作

已在本機瀏覽器檢查 1440、1280、390 與 320 px 寬度。截圖位於 `.impeccable/review/concept-map/`，每張均開啟確認內容：

- `desktop.png`、`user-1280.png`：心智圖全貌，六個核心分支均可見。
- `flow-desktop.png`：任務流程與回箭頭。
- `home-desktop.png`、`home-mobile.png`：首頁入口、原六站與進階選讀。
- `mobile.png`、`flow-mobile.png`：手機直向心智圖和流程。
- `expanded-320.png`：窄螢幕展開「資料從哪裡來」分支，沒有橫向溢出。

實際操作確認：

- 展開模型分支 → 點 MoE → 完整介紹 → 返回原分支。
- 流程圖 → Tool Calling 段落 → 返回流程圖。
- 左右方向鍵切換圖、Enter 展開分支。
- 點「切片與索引」後，自動展開所在的深入說明並抵達段落。
- 課程頁的「在概念全圖中看這一站」能開啟正確分支。
- 查閱目錄能找到新 Evals 詞條。
- 記憶實驗的兩種輸入比較、API Key 設定入口、自由測試的教學模擬可用。
- 第二站勾選前文後，示範回答變成「你的貓叫皮皮。」
- 使用獨立測試預覽 `8767` 檢查實驗與課程，沒有重設主要預覽 `8765` 的學習紀錄。測試預覽中原有的兩站完成紀錄仍能正常顯示。

## 設計檢查與審查

設計檢測器已對修改目標執行一次，結果在 `.impeccable/review/concept-map/detector.json`：24 項既有奶油配色提示，2 項首頁區塊的靜態內距提示。配色遵循使用者既定的 `DESIGN.md`；首頁實際內距由 `.wrap` 提供，截圖顯示內容並未貼邊。未因這些提示另換配色或全站版型。

獨立完成審查記錄於 `docs/LLM_CONCEPT_MAP_FINISH_REVIEW.md`，最終判定為 **ship**，沒有待修正項目。初審發現的回圈文字等價說明已補上：流程使用明確的群組角色，並在圖後直接說明工具結果帶回 Context、未完成時回到模型判斷下一步。已重新檢查桌面與手機畫面；未宣稱進行過螢幕閱讀器實機測試。

既有設計系統核對已完成，見 `docs/LLM_CONCEPT_MAP_DESIGN_CHECK.md`。本次符合一般延伸範圍，沒有更換全域設計、改動原進度或 API 功能；既有文件格式差異已據實記錄。

## 本機預覽

主要預覽：`http://127.0.0.1:8765/index.html`。

完整概念圖：`http://127.0.0.1:8765/concepts/overview.html`。

流程圖：`http://127.0.0.1:8765/concepts/overview.html#task-flow`。

可用 `python3 scripts/llm_preview.py --port 8765` 重啟預覽。沒有部署或推送遠端。
