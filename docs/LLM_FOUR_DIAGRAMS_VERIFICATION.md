# 四張圖解與流程美化

2026-11-02。使用 Diagram Design 的圖型與節點語意，繪製四張原生 SVG：Agent 流程、MoE 路由、RAG Context 路徑、六分支心智圖。原始自含 HTML 在 docs/diagram-sources，使用技能 export_svg.py --system-fonts 匯出 assets/diagrams 下四個同名 SVG，無遠端字體或圖片依賴。

Agent 以操作框、判斷菱形與終點膠囊區分繼續、完成及暫停。原流程及名詞連結保存在「逐步閱讀」中；原心智圖互動仍為主入口。MoE、RAG 加入對應概念頁。手機 Agent 自然縮放，寬圖使用局部捲動與開啟完整圖連結。

修改前檔案在 backups/llm-before-diagram-polish-20261102。未改實驗、API Key、課程、進度或既有 JavaScript。catalog、content_v2、preview 三組回歸測試通過。設計檢測器執行一次，結果在 .impeccable/review/diagram-polish/detector.json，既有紙色色彩依 DESIGN.md 保留。

實際瀏覽器截圖：agent-desktop.jpg、agent-mobile.jpg、moe-mobile.jpg、rag-desktop.jpg；位於 .impeccable/review/diagram-polish/。已逐一目視。僅本機預覽，沒有部署或推送。

補充驗證：四份來源的 self_check.py 均通過；四張 SVG 的 XML 有效，實際主預覽回應 HTTP 200 與 SVG 媒體類型。三個變動概念頁的原有連結及錨點均保留。心智圖圖片展開與原流程展開／收合已實際操作。最終審查為 ship，無必修項目，見 LLM_FOUR_DIAGRAMS_FINISH_REVIEW.md。

既有設計系統核對完成：LLM_FOUR_DIAGRAMS_DESIGN_CHECK.md。保留原設計規範；本輪圖解與整合符合既有風格。
