# 重整過程待決事項

## 1. 個資
- 依你的指示，**尚未移除任何含個資的檔案**，掃描清單見對話回覆與 `docs/PII_SCAN_REPORT.md`。
- 待你決定：是否從工作樹與 git 歷史移除（歷史清除需 force push，由擁有者執行）。

## 2. 重複頁（P5，已處理）
- `data_analysis.html` → 轉址到 `student_data_analyst_workflow.html`（兩檔原本內容完全相同）。
- `llm_lab.html` → 轉址到 `00_LLM本質探秘實驗室.html`。兩檔只差一個「互動實驗」連結與底部浮動列位置，保留內容較完整者。

## 3. 壞連結（P5，已處理）
- `00_LLM本質探秘實驗室.html` 的 5 個目標（`00_LLM_Token與模型全景圖譜.html`、`diagram_api_security_architecture.html`、`diagram_arithmetic_code_pipeline.html`、`diagram_prompt_injection_defense.html`、`prompt_injection_metro_case.html`）在 `dist_public_web/` 找到同名檔，已改連到該處。

## 4. 製作素材（建議由你決定）
以下目錄與網站無關，但佔 repo 體積；未刪除，建議移到另一個 repo 或 GitHub Release：
`videos/`（176 MB）、`motion_cursor_demo/`（28 MB）、`preview_frames/`（25 MB）、`voice_*/`（合計約 50 MB，含 `.pcm`）、`earshot_sfx/`。
根目錄的 31 個 mp4／wav 已搬到 `media/`，並更新所有引用（`videos.html`、`scripts/*`、docs）。

## 5. 與規格不同之處
- `data_atoms.html` 仍保留約 49 處 `#2563eb`（維度欄位的藍色語意，Tableau 慣例）。依規格「會影響圖表配色就不要換」，QA 對此頁不檢查藍色。
- 尚有 Google Fonts 的頁面：`00_LLM本質探秘實驗室.html`、`01_Module1_AI_Frontier_...html`、`strawberry_token_60s.html`、`memory_context_60s.html`（影片播放頁與舊實驗室），以及 `dist_public_web/`、`src/`、`motion_*` 內的舊版或渲染來源檔。不在規格列出的頁面範圍，未動。
- 規格 §6.2「預估時間」未填：原教材沒有各步驟的分鐘數，不亂編。
- `dist_public_web/` 是舊版站台副本，內容與新版不同步，建議確認是否仍在使用。
