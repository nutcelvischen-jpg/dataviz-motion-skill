# 給 Antigravity：數據視覺化課程網站 GitHub 交接

交接日期：2026-11-02。使用者已要求將課程專案的內容推上 GitHub。本包是整理好的檔案快照，**目前尚未替使用者建立 commit、推送 GitHub 或部署網站**。

## 先認清包內結構

- `project/`：要納入 GitHub 的實際專案根目錄。內有首頁、概念頁、圖鑑、實驗室、六站課程、全部七支數位乩童影片、其他既有影片／音訊／教材／資料檔、原始程式及 `dist_public_web/` 舊站。
- `FILES_SHA256.json`：`project/` 所有檔案的大小及 SHA-256。先執行包內校驗工具確認完整。
- `EXCLUDED_FILES.json`：個別排除項目的檔名與原因，不含憑證內容。
- `PACKAGE_REPORT.json`：檔案數、總量、大檔清單、七集影片及允許清單完整度。
- `verify_package.py`：在交接包外層執行 `python3 verify_package.py`，驗證所有檔案雜湊；不更動專案。

**上傳的是 `project/` 裡面的內容。不要把交接 ZIP、handoff/、本機 .git、API Key 或整個 Desktop 一起提交。** 原本的檔案捷徑已展開成實體檔案，因此換電腦不需要原機路徑。

這是一份不含 Git 歷史的來源快照；不要將它當成可直接執行 push 的既有 checkout。

## GitHub 操作順序

1. 讀取使用者指定的 repository、分支和是否有既有網站。這份交接沒有猜測 repository URL。若目的地尚不明，先向使用者取得；不要推到自己隨意選的 repo。
2. 如果已有 repo：先檢查遠端及工作區狀態，保留既有工作；建立 `codex/llm-learning-videos-20261102` 或依使用者指定的工作分支。把 `project/` 的內容同步到正確網站根目錄，先比較差異，不要刪除遠端獨有檔案、覆寫 .git 或重寫歷史。
3. 如果是全新 repo：經使用者確定目的地後，以 `project/` 為專案根建立 Git 工作區並設定該遠端。依使用者指定分支推送。
4. 先驗證下方測試與本機預覽，確認全部七支影片及相對連結可用，再檢查 staged diff、提交及推送。不要 force push。
5. 預覽、API 設定和學習進度必須保留；不要把瀏覽器 localStorage 或本機憑證加入 repo。
6. 最後回報 repository URL、分支、commit SHA、推送結果、七支影片是否納入。若使用 PR，附 PR URL。

使用者這次要求的是 GitHub 推送；部署、域名、公開權限或另開服務需要依使用者後續指示安排。若目標 repo 原本就有推送觸發的部署流程，先辨識並明確告知其影響。

## 本機啟動與驗收

在 `project/` 根目錄：

```sh
python3 scripts/llm_preview.py --port 8765
```

這個伺服器僅綁定本機，提供經明列的課程網站與影片，支援 MP4 byte range／拖曳播放。它不是整個資料夾的任意檔案伺服器。其他原有數據視覺化專案的來源檔已收進包內，但不因此擴張這個 LLM 預覽的允許清單。

驗收入口：

- `http://127.0.0.1:8765/index.html`：首頁、影片暖身與影片系列入口。
- `http://127.0.0.1:8765/videos.html`：七集完整影片目錄。
- `http://127.0.0.1:8765/videos.html#video-ep3`：自動展開起乩循環。
- `http://127.0.0.1:8765/videos.html#video-ep4`：自動展開宮廟／Harness。
- `http://127.0.0.1:8765/concepts/overview.html#task-flow`：Agent 圖與導讀片。
- `http://127.0.0.1:8765/lab.html`：八項實驗與 API 設定。
- `http://127.0.0.1:8765/dist_public_web/index.html`：保留的舊版。

檢查影片：可以播放、暫停、跳到中段；手機直式畫面及原生控制項可用；未點播放時不自動播放。觀看影片不會完成或重設六站進度。

執行回歸檢查（Python 3 與 Node.js）：

```sh
node scripts/test_llm_learning.js
node scripts/test_llm_catalog.js
node scripts/test_llm_content_v2.js
node scripts/test_llm_lab_api.js
node scripts/test_llm_reference_api.js
python3 scripts/test_llm_preview.py
python3 scripts/test_llm_videos.py
```

API 測試使用測試傳輸，不需要真實金鑰。可直接閱讀靜態網站，不必安裝前端套件。舊影片再製作腳本可能需要額外 ffmpeg／其他依賴；本包沒有附本機工具二進位檔，觀看既有影片無須重新製作。

## 七片的實際安排

| 影片 | 主要放置頁 |
| --- | --- |
| EP0 神明的後台 | `concepts/model.html` |
| EP1 咒語 | `concepts/prompt.html` |
| EP2 布壇 | `concepts/context-engineering.html` |
| EP3 起乩循環 | `concepts/agent.html` |
| EP4 宮廟 | `concepts/agent-tools.html` |
| 數位乩童總覽 | `concepts/overview.html#task-flow` |
| 數位乩童開示 AI 漏斗 | `index.html` 課前暖身 |

`videos.html` 依 EP0→EP4 排列，再列兩支導讀；六站也有對應影片入口。片名和實際檔名不要隨意改動，來源使用相對路徑與 UTF-8 URL 編碼，避免中文連結失效。

## 大檔與靜態託管

- 請用 Git 客戶端推送影片，不用 GitHub 網頁拖曳方式逐檔上傳。
- 本次掃描的單檔限制結果見 PACKAGE_REPORT.json。交接 ZIP 本身體積較大，它只供本機轉交，不能整包當成 GitHub 單檔提交。
- GitHub 一般 Git 儲存庫會阻擋超過 100 MiB 的單檔；官方說明：https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github 。若後續新增更大的影片，先規劃媒體存放與 LFS；不要只留下播放器讀不到的 LFS pointer。
- 真正上線時需再驗證主機的影片 MIME、byte-range、中文檔名與 repository 子路徑。本機 Range 測試通過不代表已驗證未指定的正式主機。
- 保留 `.nojekyll`。不要為這次上傳任意導入新框架、CDN 或改寫檔名。

## 已完成與交接界線

七片本機 Range／HEAD／拒絕不合法請求測試，以及課程、目錄、舊內容、實驗 API 測試均有可重跑腳本；驗收文字在 `project/docs/LLM_VIDEO_INTEGRATION_VERIFICATION.md` 等文件。完成審查判定 ship，保留使用者原有版型、學習進度格式、API 設定入口及舊站。影片內容定位以分布抽取的畫面與字幕為依據，未逐字聽寫或完整查核片中所有時點統計。

未納入：本機 API Key、Git 歷史、node_modules／虛擬環境、工具執行檔、暫存與備份資料夾、原始 PCM 及 macOS 剪貼簿檔。這些不是觀看網站所需檔案；個別排除項目另列。沒有移動或刪除原始檔案。
