# 七支影片設計約定核對

2026-11-02。範圍限此次影片延伸；依 `DESIGN.md`、`PRODUCT.md` 與 `.impeccable/surfaces/llm-learning.md` 最新「Approved seven-video course integration」核對。完成審查為 `LLM_VIDEO_FINISH_REVIEW.md` 的 **ship**；本文件補充設計符合性，不代表已上傳 Antigravity、部署或推送 GitHub。

## 符合既有約定

- 保留奶油紙色、深墨正文、中文襯線標題、赭色連結與細分隔線。`css/course-videos.css` 使用既有色彩變數及相同後備值，沒有建立另一套品牌、字體或動態效果。
- `videos.html` 是選讀資源；主導覽仍為跟著學／查概念／做實驗。EP0–EP4 是影片觀看順序，總覽與暖身接續其後，沒有取代六站學習路線或五類概念分類。
- 首頁保留主視覺，於六站路線前提供收合暖身片及影片庫入口；六個概念頁保留原標題與內容。課程入口導向對應影片，不把播放狀態當成完成條件。
- 原生 `details`／`summary` 按需展開，原生 `video` 具有 `controls`、`playsinline`、`preload="none"`，未設定自動播放。摘要至少 48px 高，焦點使用既有赭色外框。桌面播放器與觀看提示並排，600px 以下改單欄，影片保留完整比例。
- 每片附片長、摘要、觀看問題、正式概念連結與來源待核對說明，符合以生活比喻導入、再回到可查核概念的產品原則。七張封面沿用原片擷取；來源紀錄及 JPEG provenance 見完成審查。

## 證據與界限

本次直接閱讀新增樣式、影片庫及課程入口原始碼，並目視四張既有全頁截圖：`.impeccable/review/videos/library-desktop.jpg`、`library-mobile.jpg`、`harness-mobile.jpg`、`home-desktop.jpg`。可見桌面兩欄、手機單欄、標題換行、原生控制列與焦點；畫面未見新區塊裁字或整頁橫向溢出。

`LLM_VIDEO_INTEGRATION_VERIFICATION.md` 記錄七片 Range／HEAD／非法範圍／非清單驗證、課程／目錄／內容／預覽測試通過，及 EP3 實際播放至 38 秒、readyState 4。此處引用既有紀錄，未另開瀏覽器或重跑測試。尚未驗證正式主機的容量及 Range 支援，也未建立獨立字幕軌或逐字稿。

## 既有文件差異

`DESIGN.md` 的「本輪沒有新增裝飾圖片」與「截圖放在 docs/content-v2-screenshots」描述較早一輪；此次新增的是有來源的影片封面，驗收截圖位於上述 videos 目錄。最新 surface contract 已明確授權此延伸。其早期「六站地圖緊接主視覺」描述也由最新影片約定補充為主視覺、選讀影片入口、六站路線。這些是文件時間範圍差異，未改寫全站設計規則。

既有 detector 的 cream-palette 提示與已選定配色衝突；cramped-padding 靜態提示經上述截圖與完成審查判讀，未成為本次阻擋項。此次只新增本核對文件，未修改全域設計文件、共用設定或程式。
