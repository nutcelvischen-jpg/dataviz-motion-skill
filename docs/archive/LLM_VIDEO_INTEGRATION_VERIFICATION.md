# 七支影片整合驗收

2026-11-02。EP0模型、EP1 Prompt、EP2 Context、EP3 Agent Loop、EP4 Harness 分別整合至 model、prompt、context-engineering、agent、agent-tools 概念頁。數位乩童總覽放在 overview 的任務流程分頁，AI漏斗放首頁選讀。videos.html 提供七集有序目錄；六站課程增加對應影片入口，完成條件和進度儲存未變。

播放器為原生 video，controls、playsinline、preload none，沒有 autoplay。預設以 details 收合，支援錨點自動展開。每片有原片擷取封面、片長、摘要、觀看問題及圖解連結。封面來源已嵌入 JPEG，七支原始 MP4 沿用本機檔案。

確認內容的方法：七片各抽取涵蓋全片的12個畫面檢視字幕與機制，未逐字聽寫或完整查核片中時點統計。影片比喻搭配原有正式概念說明。

測試通過：test_llm_learning.js、test_llm_catalog.js、test_llm_content_v2.js、test_llm_preview.py，以及新 test_llm_videos.py。新測試對七片驗證起始、中段、suffix與open-ended byte range的精確內容、HEAD、非法range416及非清單影片404。實際預覽8765播放EP3達38秒、readyState4、duration138.93秒，原生鍵盤控制可暫停。媒體Range處理僅作用於七份明列影片。

畫面證據 .impeccable/review/videos/: library-desktop.jpg、library-mobile.jpg、harness-mobile.jpg、home-desktop.jpg，已目視確認。新增影片庫、手機EP4與首頁入口正常。設計檢測器僅執行一次，既有 cream-palette、cramped-padding 靜態提示依實際留白與既定配色保留。沒有真實模型請求，沒有重設既有進度。

備份：backups/llm-before-videos-20261102。七個整合頁原有連結及錨點集合均保留。js/learning.js只新增影片入口；lab與progress實作未更動。本機預覽維持8765，未部署或推送。

獨立完成審查：LLM_VIDEO_FINISH_REVIEW.md，ship；既有設計核對：LLM_VIDEO_DESIGN_CHECK.md，已完成。
