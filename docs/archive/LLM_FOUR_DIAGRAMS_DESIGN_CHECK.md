# 四張圖解設計約定核對

2026-11-02。範圍：四份 `assets/diagrams/*.svg`、對應 `docs/diagram-sources/*.html`、`css/teaching-diagrams.css` 與 overview／moe／knowledge 三個概念頁。依既有 `DESIGN.md`、`PRODUCT.md` 及 `.impeccable/surfaces/llm-learning.md` 最新四圖約定核對；本次只補充紀錄，不修改全站設計規範或程式。

## 符合情形

- 延續紙色、深墨、橄欖綠與鐵鏽紅，採細線、系統中文字體及可縮放的幾何與文字。沒有新增外部圖片或字體依賴，亦沒有建立另一套全站視覺方向。
- Agent 的 480 × 1024 直式圖分開模型請求、程式檢查、工具執行與回饋；操作框、判斷菱形、終點及文字共同表達繼續、交付、暫停。原有含名詞連結的流程保留於原生展開區。
- MoE 的選中路徑同時使用線型與文字；RAG 分開來源、檢索片段、Context 與回答，既有核對限制仍保留。六分支靜態圖位於互動心智圖下方的選讀展開區，沒有另建學習順序或主導覽。
- Agent 圖自然縮放；三張 800px 寬圖使用至少 640px 的圖面及局部水平捲動，另有完整圖片入口。整合頁提供替代文字、圖片尺寸及原生連結；圖解沒有新增互動、API 或進度狀態。

## 證據與判定

完成審查見 [LLM_FOUR_DIAGRAMS_FINISH_REVIEW.md](LLM_FOUR_DIAGRAMS_FINISH_REVIEW.md)：**ship，無必修項目**。回歸、來源 self-check、SVG／HTTP 檢查與操作紀錄見 [LLM_FOUR_DIAGRAMS_VERIFICATION.md](LLM_FOUR_DIAGRAMS_VERIFICATION.md)。本核對另確認四份 SVG 可解析、來源與整合標記，以及五份 JPEG 的存在與尺寸。

畫面證據位於 `.impeccable/review/diagram-polish/`：`agent-desktop.jpg`（1280 × 2185）、`agent-mobile.jpg`（390 × 2210）、`moe-mobile.jpg`（390 × 2493）、`rag-desktop.jpg`（1280 × 3003）、`mindmap-desktop.jpg`（1280 × 2346）。逐張目視結果沿用上述完成審查；本次未開瀏覽器，未重做互動或全尺寸驗收。圖面為原生 SVG，無新增需記錄生成來源的展示用點陣圖；JPEG 僅為驗收截圖。

## 已知既有文件落差

`DESIGN.md` 為既有精簡約定，尚未採 document 參考規格的 YAML token 前置資料與八節格式；其「本輪沒有新增……教材圖解」描述的是先前工作，不能作為本次四圖的現況說明。本輪事實以最新 surface 約定及上述驗收文件補充，不因此覆寫全站文件或建立第二份 token 規範。

設計檢測器只回報既有 cream-palette 提示。紙色是明確批准的視覺約定，屬保留決策，不列為本次缺陷。
