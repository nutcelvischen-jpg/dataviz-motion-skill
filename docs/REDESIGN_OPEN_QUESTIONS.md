# 重整過程待決事項

## 1. 個資（P0）

- 已從工作樹刪除 `workshop_registration_dashboard.html`（內含約 106 個 email、75 支手機號碼）。**git 歷史仍保留舊版本**，網站公開期間的內容也可能已被快取或爬取。
- 建議由 repo 擁有者決定是否清除歷史（會改寫歷史、需 force push，且所有 clone 與 fork 都要重做）：
  ```bash
  pip install git-filter-repo
  git filter-repo --path workshop_registration_dashboard.html --invert-paths
  git push --force --all
  ```
  之後在 GitHub 的 Settings 要求清除快取視圖，並到 Google 的移除過期內容工具申請移除搜尋快取。
- 若仍需報名統計儀表板：請做去識別化版本（只留梯次、人數、系所統計），資料不要放進公開 repo。`.gitignore` 已加入 `workshop_registration_dashboard.html` 防止誤加回去。
- 掃描結果：其餘 email／手機格式命中皆為示範值（`workshop-student@antigravity.dev`、`0912-345-678`）、第三方壓縮檔（`xlsx.full.min.js`、`gsap.min.js`）或 CSV 內的 10 位數營收數字，無其他報名者資料。

## 2. 重複頁（P5）
- `llm_lab.html` 與 `00_LLM本質探秘實驗室.html`：差異見 P5 commit 說明。

## 3. 找不到的連結目標（P5）
- 見 P5 commit 說明。

## 4. 製作素材（P5）
- 見 P5 commit 說明。
