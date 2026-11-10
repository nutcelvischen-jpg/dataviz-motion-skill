# Context 教學插圖：既有設計系統核對

日期：2026-11-02。範圍：`concepts/context.html` 新增的插圖與 HTML 圖說、`css/concept-illustration.css`、`assets/illustrations/context-memory-v1.png`。

## 結論

**符合既有設計系統的一般延伸；文件核對完成。** 本次局部新增遵守 `PRODUCT.md`、`DESIGN.md` 與 `.impeccable/surfaces/llm-learning.md` 的「Approved Context illustration sample — 2026-11-02」。資料櫃／工作桌比喻支援初學者區分已保存資訊與本輪輸入，沒有建立新視覺系統。最終完成審查判定為 **ship**，無待修正事項，見 [LLM_CONTEXT_ILLUSTRATION_FINISH_REVIEW.md](LLM_CONTEXT_ILLUSTRATION_FINISH_REVIEW.md)。

本報告採用 impeccable `reference/document.md` 的現況擷取與對照方法。既有 `DESIGN.md` 繼續作為視覺依據；這次只新增本報告，不重寫全域設計、產品文件、surface 約定或 sidecar。

## 設計對照

| 已核准約定 | 本次核對結果 |
| --- | --- |
| 延續奶油紙色、深墨字、中文襯線標題、鏽紅與橄欖綠 | 新圖以細墨線、紙感與低彩度木色呈現；標籤繼承既有正文字體，引用 `--ink`、`--olive`、`--muted`，連結沿用原色。未重定義全域色票、字體或新增陰影。 |
| 在原標題與導讀後加入一張教材插圖 | 插圖沿用 800px 概念閱讀寬度；圖下依序說明資料櫃、選取與工作桌。原流程、實驗入口、上下文限制、四層記憶及進階內容維持原順序。 |
| 文字留在 HTML，明確說明比喻邊界 | 名詞、核心說明、選取箭頭與深入閱讀連結均為 HTML／CSS。圖說明示這是外部資訊與本輪輸入的比喻，並連到既有模型參數說明。使用原生 `figure`／`figcaption`、替代文字及明確圖片寬高。 |
| 手機保留完整圖幅與可讀文字 | 圖片使用 `width:100%`、`height:auto`，保持原始 2:1 比例；600px 以下縮小標籤間距與箭頭，文字自然換行。三種完整頁面證據均未見圖說重疊或頁面橫向溢出。桌面右緣與底部是素材構圖邊界，非網頁額外裁切。 |
| 不新增互動、進度或 API 行為 | 本次新增的是圖片、樣式與原生錨點連結；沒有新增 JavaScript。原實驗入口、三項主導覽及後續閱讀路徑保留。 |

## 證據與檢查界線

- 已閱讀產品、設計與指定 surface 約定，核對頁面、新樣式、既有 `css/content-layout.css`、[驗證紀錄](LLM_CONTEXT_ILLUSTRATION_VERIFICATION.md)、[保留檢查](LLM_CONTEXT_ILLUSTRATION_CHECKS.json) 與完成審查。
- 已直接目視 `.impeccable/review/context-illustration/desktop.jpg`（1440 × 2300）、`mobile.jpg`（390 × 3338）、`user-1280.jpg`（1280 × 2300），三張均包含頁頂到頁尾；另檢視 `docs/content-v2-screenshots/context-illustration/preview.jpg`（1280 × 720），該圖是交付預覽。
- 已直接確認 PNG 為 1774 × 887，SHA-256 為 `121dcd556e30e1efa6030194a38558b2622ec9323dcab6712f78405ff87a09c4`，且 [完整提示詞](context-memory-image-prompt.txt) 精確存在於 PNG 的 `tEXt` 區塊。素材目錄只有這一張點陣圖，與既有來源掃描「1 張、0 張缺來源」紀錄一致。
- 保留檢查記錄原 34 個教學文字單位、全部舊 ID／連結與九份受保護檔案均保留；驗證紀錄列出預覽、目錄、內容三套回歸檢查通過，以及實際瀏覽器圖片載入、溢出與鍵盤深連結檢查。本次文件核對採用這些執行紀錄，未重跑測試或操作瀏覽器。

## 既有文件差異

`DESIGN.md` 仍是原有簡要約定，未採現行 `document.md` 的 YAML frontmatter／八節格式，且 `.impeccable/design.json` 不存在。這些格式及 sidecar 差異在本次插圖前已存在，不影響其視覺權威，本次不修整。

`DESIGN.md` 的「本輪沒有新增裝飾圖片或替換教材圖解」記錄的是 2026-11-01 的上一輪。本次 2026-11-02 教學插圖的核准、來源與證據由 surface 約定、驗證紀錄及本報告補充，未把單張樣板提升為全站圖像規範。後續 diagram-design 技能評估屬另一項工作，不納入此插圖交付判定。
