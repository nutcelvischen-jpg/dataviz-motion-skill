# 個資與敏感資訊掃描報告

掃描日期：2026-11-10。範圍：repo 目前追蹤的所有文字檔與 xlsx；git 歷史只掃到本次取得的範圍（本機是淺層 clone，僅有最新一個上游 commit，更早的歷史未檢查）。
**依你的指示，沒有移除任何東西。** 下列值都已遮罩。

## 高：含真實個人資料

| 檔案 | 內容 | 數量 |
| :--- | :--- | :--- |
| `workshop_registration_dashboard.html` | 報名學員姓名、Email、手機、市話、科系／單位、身分別、飲食習慣、是否需研習證明。公開在 GitHub Pages 上 | Email 107 組不重複（`5***@gmail.com` 等）、手機 75 組（`0900****07` 等）、市話 12 組、姓名約 127 筆 |

這個檔案也存在於 git 歷史中，即使刪除，舊版本仍可從歷史取得。

## 中：需要你確認

| 檔案 | 內容 | 為什麼要看 |
| :--- | :--- | :--- |
| `google_apps_script/README.md` 第 10 行 | 「數位乩童小客服_對話日誌庫」Google 試算表連結（ID `14hpJC…`） | 這份試算表記錄學生與小客服的對話；若分享設定是「知道連結者可檢視」，對話內容可能外洩 |
| `google_apps_script/Code.gs`、`js/digital_jitong.js`、`system_architecture.html`、`.agents/skills/*/templates/js/digital_jitong.js` | Google Apps Script 網頁應用程式網址（`AKfycb…`） | 前端必須知道這個網址，本身不算洩漏；請確認 GAS 端有限制寫入內容與頻率，避免被濫用或灌垃圾資料 |
| `.agents/skills/data-atoms-dashboard/templates/data_atoms_manual.html`、`.agents/skills/dataviz-analyst/templates/…`（各 12 處） | 本機路徑 `/Users/che…/Desktop/…` | 洩漏你的電腦使用者名稱與資料夾結構 |
| `scripts/*.py`、`scripts/*.js`（約 50 個檔案，合計約 90 處）、`motion_cursor_demo/.om/*`、`LLM_CONTENT_ARCHITECTURE_V2_SPEC.md` 等 | 同樣的本機路徑 | 同上，風險較低 |
| `dist_public_web/.netlify/state.json` | Netlify siteId | 不是機密，但顯示你的 Netlify 專案識別碼 |

## 低：示範用假資料（不是個資）

| 檔案 | 內容 |
| :--- | :--- |
| `00_LLM本質探秘實驗室.html`、`01_Module1_…/00_LLM本質探秘實驗室.html`、`dist_public_web/…`、`js/lab-legacy-data.js`、`API金鑰資安防護與前後端架構圖解.md` | `sk-a…EXPOSED_KEY`、`sk-ant-…TOP-SECRET` 之類的教學用假金鑰（已看過，字串本身寫明是示範） |
| `scripts/test_lab_3step_ui.js` | `sk-or-v1-my…` 測試字串，看起來是假值 |
| `03_Module3_…/mcp_architecture_and_security.md` | 示範手機 `0912-345-678`、示範身分證字號 `B123…89`（明顯的樣板值） |
| `estat_api_tutorial_simulator.html` | 示範信箱 `w***@antigravity.dev` |
| 授課資訊 | 陳俊智副教授姓名、任職單位出現在 README、`workshop.html`、`js/site-config.js`：公開授課資訊，不算個資問題 |

## 檢查過、沒有個資

`01_Module1_…/real_world_datasets/*.csv`（證交所上市公司營收、教育部校別統計：公司與學校層級彙總）、`sample_data/`、`sample_datasets/`（xlsx／csv：產品、營收、日本統計等彙總資料），沒有姓名、電話、Email、身分證字號、地址欄位。

## 建議處理順序（你決定後再動手）

1. 決定 `workshop_registration_dashboard.html` 要刪除、去識別化，還是改放在不公開的地方；並決定是否清除 git 歷史（指令見 `docs/REDESIGN_OPEN_QUESTIONS.md`）。
2. 檢查對話日誌試算表的分享權限。
3. 把 `.agents/…/data_atoms_manual.html` 的本機路徑改成相對路徑。

---

## 處理結果（2026-11-10）

- 已刪除 `workshop_registration_dashboard.html`（名冊頁）。
- 已移除 `google_apps_script/README.md` 的試算表連結。
- 已把全部 `/Users/<本機帳號>/…` 本機路徑改為 `.` 或 `<LOCAL_PATH>`／`<HOME>`（py/js/md 共 50 個檔案）。
- 已刪除 `dist_public_web/.netlify/state.json`，並在 `.gitignore` 加入 `.netlify/`。
- **Git 歷史尚未清除**：舊 commit 仍含上述內容，需另行用 git-filter-repo 清除並 force push（指令見 `docs/REDESIGN_OPEN_QUESTIONS.md`）。
