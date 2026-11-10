# 🔮 數位乩童（Digital Jitong）AI 客服後端設定指南

本指南引導您完成 **Google Apps Script (GAS)** 後端設定，使「數位乩童」能夠透過 **OpenRouter**（支援 `anthropic/claude-haiku-5.5` 與 `reasoning_details` 思維鏈）即時回答學員問題，並將**所有問答紀錄自動儲存至 Google Sheet**。

---

## 步驟 1：開啟專屬 Google Sheet

我們已經為您建立好專屬 Google Sheet：
👉 **（對話日誌庫試算表連結已移除，請向維護者索取）**

（您也可以在任何自己擁有的 Google Sheet 依此流程設定）

---

## 步驟 2：進入 Apps Script 編輯器

1. 在該 Google Sheet 頂部選單，點擊 **「擴充功能 (Extensions)」➔「Apps Script」**。
2. 將編輯器內原本的程式碼清空。
3. 將 [`Code.gs`](./Code.gs) 檔案內容**全選複製並貼上**。
4. 點擊上方的 **「儲存 (Save 💾)」** 圖示。

---

## 步驟 3：設定環境變數（填入 OpenRouter API Key）

> [!IMPORTANT]
> **金鑰安全保護**：API Key 存放在 Google 伺服器端環境變數，不會暴露給前端學員。

1. 在 Apps Script 編輯器左側導航欄，點擊 **⚙️「專案設定 (Project Settings)」**。
2. 往下滑動找到 **「指令碼屬性 (Script Properties)」** 區塊。
3. 點擊 **「新增指令碼屬性 (Add script property)」**：
   - **屬性 (Property)**：`OPENROUTER_API_KEY`
   - **值 (Value)**：貼上您的 OpenRouter 金鑰（例如 `sk-or-v1-xxxxxxxx...`）
4. （可選）再新增一組：
   - **屬性 (Property)**：`MODEL_NAME`
   - **值 (Value)**：`anthropic/claude-haiku-5.5`（或您指定的 OpenRouter 模型名稱）
5. 點擊 **「儲存指令碼屬性 (Save script properties)」**。

---

## 步驟 4：發布為網頁應用程式 (Web App)

1. 點擊編輯器右上角藍色的 **「部署 (Deploy)」➔「新增部署 (New deployment)」**。
2. 點擊左側齒輪 ⚙️ 圖示，選擇 **「網頁應用程式 (Web app)」**。
3. 設定如下：
   - **說明 (Description)**：`數位乩童 v1.0`
   - **執行身分 (Execute as)**：`我 (Me / 您的 Google 帳號)`
   - **誰可以存取 (Who has access)**：`所有人 (Anyone)` *(請務必選 Anyone，前端網頁小工具才能直接呼叫)*
4. 點擊 **「部署 (Deploy)」**。
5. （首次部署會彈出授權視窗，點擊「審查權限」➔ 選擇您的帳號 ➔ 點擊「Advanced (進階)」➔「前往專案 (Go to Project)」➔「Allow (允許)」）。
6. 複製彈出的 **網頁應用程式網址 (Web app URL)**（格式通常為 `https://script.google.com/macros/s/AKfycb.../exec`）。

---

## 步驟 5：連線至前端「數位乩童」小工具

1. 開啟課程網頁（如 `data_atoms.html` 或 `curriculum_1105_workflow.html`）。
2. 點擊右下角的 **🔮 數位乩童懸浮球** 開啟對話視窗。
3. 點擊對話視窗右上角的 **⚙️ 設定圖示**。
4. 將剛才複製的 **Web App URL** 貼入並點擊「儲存連線」。
5. 現在即可開始與數位乩童對話！所有對話內容、問答時間、思維推理（`reasoning_details`）皆會同步永久留存於 Google Sheet！
