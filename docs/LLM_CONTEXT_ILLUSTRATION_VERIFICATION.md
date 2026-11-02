# Context 與記憶：教學插圖樣板

日期：2026-11-02。使用者同意先完成「Context 與記憶」插圖樣板，再評估相同畫風如何延伸到其他主題。

## 交付

- `concepts/context.html` 在原有導讀之後加入資料櫃／工作桌插圖，接著保留四步流程、記憶實驗入口、上下文限制、四種記憶說明與進階內容。
- 圖下的名詞、選取箭頭、核心說明與深入閱讀連結使用 HTML／CSS，未把教材文字燒進圖片。
- 圖片有替代文字、原生 `figure`／`figcaption`、明確寬高與自然比例；手機保留完整圖幅並讓文字換行。
- 畫面明確標示外部資訊與本輪輸入的比喻，模型參數另連到既有說明。
- 本輪只做第一張樣板，未新增 RAG 或 Agent 插圖。

## 圖像來源

使用內建 Image Gen 生成一張新插圖，沒有使用 API／CLI 後備模式。

- 網站原圖：[context-memory-v1.png](../assets/illustrations/context-memory-v1.png)，1774 × 887，2,562,670 bytes。
- 完整原始提示詞：[context-memory-image-prompt.txt](context-memory-image-prompt.txt)。
- 原始生成檔：`<HOME>/.codex/generated_images/01a196d2-f399-7f12-820f-f152dcc076c4/exec-2332ca17-27ba-456e-b10a-33a58a29d4de.png`。
- 精確提示詞已嵌入 PNG 中；`embed-prompt --scan assets/illustrations` 回報 1 張圖、0 張缺少來源紀錄。
- 圖像是教學比喻，不是真實模型內部構造或操作截圖。圖片中桌面的右邊與底部是生成時的構圖邊界，網頁未額外裁切。

## 保留內容

修改前備份在 `backups/llm-before-context-illustration-20261102/`。靜態對照見 `LLM_CONTEXT_ILLUSTRATION_CHECKS.json`：原 34 個教學文字單位、全部舊連結及 ID 均保留。實驗、進度、課程資料、原圖鑑程式與概念全圖等九份受保護檔案的 SHA-256 均與修改前相同。

## 驗證

- `python3 scripts/test_llm_preview.py` 通過，新增圖片與 CSS 可用；無關檔案仍不對外提供。
- `node scripts/test_llm_catalog.js` 通過，詞條、搜尋、舊書籤與目錄／地圖返回狀態正常。
- `node scripts/test_llm_content_v2.js` 通過，深連結與八項原有實驗識別值正常。
- 實際瀏覽器檢查 1280、1440 與 390 px：圖片載入完成、顯示原比例，沒有整頁橫向溢出。新「四種『記得』的差別」連結可用 Enter 啟動並抵達 `#memory-layers`。
- 已開啟確認 `.impeccable/review/context-illustration/` 的 `user-1280.jpg`、`desktop.jpg`、`mobile.jpg`。交付預覽截圖位於 `docs/content-v2-screenshots/context-illustration/preview.jpg`。
- 設計檢測器執行一次，僅回報既有 `cream-palette` 提示；奶油底色是使用者已選定的網站設計，故保留。
- 沒有新增 JavaScript、讀寫 API Key 或學習進度，沒有執行真實模型請求。

獨立完成審查的結論為 **ship**，本次局部整合沒有待修正項目；詳見 `LLM_CONTEXT_ILLUSTRATION_FINISH_REVIEW.md`。

既有設計系統核對已完成，判定符合一般延伸；見 `LLM_CONTEXT_ILLUSTRATION_DESIGN_CHECK.md`。沒有改寫全域設計規範或修整與本輪無關的文件格式差異。

## 預覽

`http://127.0.0.1:8765/concepts/context.html#context-illustration`

本機預覽維持執行。沒有部署、推送或提交遠端。
