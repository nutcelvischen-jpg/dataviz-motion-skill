# 🛡️ MCP 架構解析、工具生態與校園資安防護指南

## 一、 MCP 核心三要素

MCP（Model Context Protocol）規範了模型與外界溝通的三種主要資源型態：

1. **Prompts（提示範本）**：由 MCP Server 提供標準化的提示詞結構，方便使用者快速調用常用工作流。
2. **Resources（數據資源）**：類似檔案系統的唯讀資源（如本地日誌、檔案內容、API 狀態），提供模型作為上下文依據。
3. **Tools（可執行工具）**：具備副作用的執行函數（如建立 Google 日曆行程、發送郵件、執行 SQL 查詢、建立 GitHub PR）。

---

## 二、 常用 MCP 生態系精選推薦

| MCP Server 名稱 | 功能描述 | 典型應用場景 |
| :--- | :--- | :--- |
| **`filesystem`** | 本地檔案系統讀寫 | 自動遍歷資料夾、重命名、批量整理報表 |
| **`google-workspace`** | 串接 Gmail / Docs / Sheets / Calendar | 自動依會議紀錄建立行事曆、讀取試算表資料 |
| **`fetch / puppeteer`** | 網頁爬取與瀏覽器自動化 | 抓取政府公開標案、新聞動態或學術論文 |
| **`sqlite / postgres`** | 資料庫直連查詢 | 用自然語言直接向資料庫查詢統計數字 |
| **`github`** | 程式碼版本庫管理 | 自動建立 Issue、審查 Pull Request、追蹤代碼變更 |

---

## 三、 資安與合規性防護守則（以教育機關為例）

### 1. 機敏資料脫敏流程（Data Sanitization）
在呼叫任何外部雲端 LLM 之前，可採用以下標準規則進行預處理：
- **姓名**：`陳大明` $\rightarrow$ `陳○明` 或 `學員 A`
- **學號/員工編號**：`11045012` $\rightarrow$ `USR_001`
- **身分證號**：`B123456789` $\rightarrow$ `B12*****89`
- **聯絡電話**：`0912-345-678` $\rightarrow$ `0912-***-***`
- **機密經費數字**：若僅需分析比例，可進行歸一化（如除以總額）而非傳送真實財務數字。

### 2. 本地設定檔金鑰保護
- 絕不要將包含 API Key 的 `claude_desktop_config.json` 或 `.env` 檔案提交至公開的 GitHub 倉庫。
- 在 `.gitignore` 中明確加入：
  ```gitignore
  .env
  *_api_key.txt
  *config.json
  ```
