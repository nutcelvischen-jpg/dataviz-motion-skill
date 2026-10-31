# 💻 實作指南：用 Antigravity 打造離線商業數據儀表板

## 一、 傳統建站 vs. 現代 Agentic Coding

| 比較維度 | 傳統網頁開發模式 | Antigravity 現代模式 |
| :--- | :--- | :--- |
| **技術門檻** | 需熟悉 HTML、CSS、JS、Webpack、Vue/React | 純自然語言描述需求，AI 全自動組裝代碼 |
| **環境依賴** | 需安裝 Node.js、npm 套件、後端伺服器 | 單一 HTML 內嵌輕量庫，雙擊離線即跑 |
| **除錯流程** | 自己看瀏覽器 Console 一行一行 Debug | AI 自行讀取報錯，自動修復並重整頁面 |

---

## 二、 核心架構解析：Data Atoms Studio (`index.html`)

在本專案的根目錄中，`index.html` 整合了三大關鍵前端技術：

1. **SheetJS (`xlsx.full.min.js`)**：
   - 位於 `js/xlsx.full.min.js`，這是一個純 JavaScript 實現的 Excel 解析引擎。
   - 它的優點是**「百分之百純前端離線運作」**，使用者拖入的檔案完全不會上傳到任何外部伺服器，對校內隱私與機敏資料最為安全。
2. **HTML5 Canvas 2D 渲染引擎 (`js/app.js`)**：
   - 不依賴肥大的第三方套件，直接在 `<canvas>` 上繪製 60 FPS 平滑動態圖表。
   - 支援 7 大商業數據圖形（柱狀、趨勢、散點、環形、雷達、漏斗、統計矩陣）。
3. **極簡現代卡片流樣式 (`css/style.css`)**：
   - 採用極簡淺色背景（`#f5f5f3`）搭配經典橙黑點綴（`#ff5722`）。
   - 左側保留「導演層導讀卡」，右側為高畫質圖形展示區。

---

## 三、 在 Antigravity 中擴充 AI 問答小助手

想要為網頁加上與 AI 對話的能力，只需在 Antigravity 中下達以下指令：

> 「請在當前 `index.html` 頁面右下角加入一個浮動按鈕（Floating Action Button）。點擊後展開一個極簡風格的對話面板，包含歷史訊息列表、文字輸入框與發送按鈕。當使用者輸入問題時，將當前解析的表格數據摘要連同問題，送給後端 API 進行解答。」

Antigravity 會自動修改 HTML、CSS 與 JS，並即時在右側預覽視窗中呈現！
