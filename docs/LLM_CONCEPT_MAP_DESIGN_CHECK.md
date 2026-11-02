# 概念地圖整合：既有設計系統核對

日期：2026-11-02。範圍：概念全圖、任務流程、首頁預覽、查閱目錄入口、課程入口、概念頁返回狀態與補充解說。

## 結論

**符合既有設計系統的一般延伸；文件核對完成。** 本次實作遵守 `PRODUCT.md`、`DESIGN.md` 與 `.impeccable/surfaces/llm-learning.md` 的 2026-11-02 約定。它延伸既有奶油紙色、深墨字、中文襯線標題、鏽紅連結與橄欖綠圖解，沒有建立新的視覺識別，也沒有把概念分類改成另一套必修進度。

獨立完成審查的最終 disposition 為 **ship**，見 [LLM_CONCEPT_MAP_FINISH_REVIEW.md](LLM_CONCEPT_MAP_FINISH_REVIEW.md)。唯一的 P2 問題已補上有名稱的群組及可見回圈說明；本次來源核對與手機截圖均支持該項修正。

本報告採用 impeccable `reference/document.md` 的現況擷取與對照方法。這次是已核准、明確指定的既有介面延伸，且寫入範圍只有本報告；不重新命名設計方向、不產生新的全域規範，也不重寫 `DESIGN.md`、`PRODUCT.md`、樣式變數或 sidecar。

## 設計與行為對照

| 既有約定 | 本次實作與核對結果 |
| --- | --- |
| 奶油紙色、深墨字、細線，保留鏽紅與橄欖綠 | `concepts/overview.html` 載入既有 `css/content-layout.css`。`css/concept-map.css` 沿用 `--paper`、`--surface`、`--ink`、`--muted`、`--rule`、`--accent`、`--olive`、`--pale`；主要紙色、正文、分隔線與連結仍由既有檔案決定。地圖局部使用柔和灰綠邊線與底色，沒有重定義全域色彩。 |
| 襯線標題、系統字體正文與控制項 | 地圖標題與根節點引用 `--serif`，問題按鈕、流程小標與正文引用或繼承 `--sans`。未新增 `@font-face`、字體匯入或遠端字體依賴。 |
| 以字級、留白與線條建立層級 | 概念全圖採 1060px 上限，符合既有目錄尺度；一般概念閱讀區維持 800px。流程上限為 800px；節點使用細框與 5px 圓角，對應既有控制項語彙。新樣式沒有陰影；區塊的用途是表達分支、步驟及比較，未將每段正文包成卡片。 |
| 主導覽只有「跟著學／查概念／做實驗」 | 首頁、目錄與概念全圖均維持三項主要導覽。完整地圖屬於「查概念」，首頁只提供縮圖與連結，六站仍為課程與進度的唯一順序。 |
| 查閱入口簡短，完整說明按需要閱讀 | 目錄加入一個概念全圖入口，保留原搜尋、分類與詞條列。新增 10 個詞條仍採名稱加一句解釋的既有形式。地圖以六個白話問題起頭，名詞為原生連結，展開按鈕與前往介紹的用途分開。 |
| 窄螢幕可讀，鍵盤焦點可見 | 地圖在 600px 以下改為直向樹，記憶四層改為單欄；分支按鈕至少 48px，核心名詞連結至少 44px。沿用基礎樣式的可見焦點，並為圖示旋轉提供減少動態效果規則。完成審查已涵蓋 320px 展開狀態。 |
| 返回位置與深入閱讀可恢復 | `js/concept-map.js` 一次只展開一個分支，以網址 hash 保存分支或流程視圖，並處理返回／前進與分頁切換鍵盤操作。`js/concept-reader.js` 接受六個分支與 `flow` 的白名單，依 `frommap` 返回原位置；原 `fromq`／`fromcat` 仍保留。既有 `js/content-navigation.js` 繼續負責打開深連結所在的 disclosure。 |
| 圖解區分模型、程式、工具及核對 | 任務流程分開呈現準備資料、LLM 提出請求、程式檢查格式與權限、工具執行、結果回到 Context、核對後交付。群組具有可讀名稱，流程下另有普通文字說明未完成時回到模型；停止條件直接可見。 |
| 保留進階內容、免金鑰示範與原進度 | 補充說明使用既有段落、詞條、流程、比較與原生 `details`，舊教材連結仍在。`js/learning.js` 對照基線的差異只加入站別對應與地圖連結，未改動測驗、完成門檻或進度儲存。API 與進度相關檔案逐位元相同。 |

新增內容涵蓋 Transformer／Attention／推論、四層記憶、Workflow 與 Agent、工具參數及權限、檢索、Evals／Trace；模型內部機制與系統協作保持分開。這些解說支援產品「理解目前位置、目的與下一步」的原則，不取代原有長文或實驗。

## 已核對證據

- 已閱讀 `PRODUCT.md`、`DESIGN.md`、`.impeccable/surfaces/llm-learning.md`、完成審查、整合驗收與靜態檢查 JSON，並檢查 `concepts/overview.html`、`css/concept-map.css`、`js/concept-map.js`、`js/concept-reader.js`、首頁、目錄、課程差異及七個補充解說頁。
- 已直接目視 `.impeccable/review/concept-map/desktop.png`、`flow-mobile.png`、`home-desktop.png`：六個問題清楚可辨，首頁延續原有編輯式留白，手機流程保留回箭頭、可見回圈說明與停止條件。沒有重新操作瀏覽器。
- 已確認八張截圖附件存在並讀取影像尺寸。更新後的流程圖為 1440 × 1734 與 390 × 2125，與最終複審所列版本一致。其餘畫面的目視驗收採用完成審查的八張截圖紀錄。
- 已直接以 `backups/llm-before-concept-map-20261102/` 為基線比較：`lab.html`、`js/learning-progress.js`、`js/learning-data.js`、`js/lab.js`、`js/lab-legacy-data.js`、`js/reference.js`、`js/reference-routes.js`、`js/content-navigation.js`、`css/content-layout.css`、`css/learning.css` 全部逐位元相同。
- [LLM_CONCEPT_MAP_STATIC_CHECKS.json](LLM_CONCEPT_MAP_STATIC_CHECKS.json) 目前記錄 35 頁、717 個本機引用、246 個原有概念教學文字單位與 45 個原目錄項目，缺檔、缺錨點及遺失內容清單均為空。此處的原目錄 45 項包含 35 個詞條與 10 項延伸資料；整合後為 45 個詞條及 10 項延伸資料。
- [LLM_CONCEPT_MAP_VERIFICATION.md](LLM_CONCEPT_MAP_VERIFICATION.md) 記錄六套回歸檢查全部通過，涵蓋目錄、課程進度、舊內容、實驗 API、圖鑑 API 與預覽；也記錄實際鍵盤往返、深連結、窄螢幕及實驗操作。本次文件檢查未重跑測試，未呼叫真實模型 API，也未宣稱完成螢幕閱讀器實機或學生學習成效測試。
- 新圖使用 HTML、CSS 與程式產生的 SVG 連線。首頁、目錄及全圖未新增點陣圖；保存的驗收截圖是證據附件，不是網站展示素材。

## 既有文件差異與紀錄落差

以下是本次文件核對時已存在的狀態，不影響一般延伸的判定，也未在本報告範圍內修整：

1. **全域設計文件仍是既有的簡要約定。** `DESIGN.md` 沒有 `document.md` 現行格式的 YAML frontmatter／八節結構，專案也沒有 `.impeccable/design.json`。這是先前文件格式與現行文件技能的差異；原文件已清楚指定視覺權威，本次沒有理由藉延伸功能替換它。
2. **兩份既有樣式的細節未完全寫入全域摘要。** `css/learning.css` 原有鏽紅、橄欖綠值與 `css/content-layout.css` 不同，襯線字體組另以 `Iowan Old Style` 起頭；`DESIGN.md` 只說課程延續相同風格。兩份檔案都與本次基線相同，因此不把既有差異記為這次地圖造成的漂移，也不將局部地圖用色提升為新全域 token。
3. **全域圖像來源段落記錄的是 2026-11-01 的上一輪。** 其中的 `docs/content-v2-screenshots/` 不是本次驗收附件位置；2026-11-02 的新證據由 surface 約定、本報告與整合驗收指向 `.impeccable/review/concept-map/`，舊紀錄保留。
4. **統計值已統一，截圖格式據實記錄。** 文件核對當下，`LLM_CONCEPT_MAP_FINISH_REVIEW.md` 的引用統計仍為 716；交付整理時已更新為最終 JSON 與整合驗收一致的 717，包含新增的回圈說明連結。沒有遺失引用的證據。八張截圖的副檔名雖為 `.png`，影像格式實際為 JPEG；它們可正常解碼，本次只據實註記，未重新命名或轉檔。

本次交付只新增本文件。既有設計、產品、surface 約定與網站來源均未由本文件核對程序修改。
