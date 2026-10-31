# 🎯 Module 2 實作任務：打造你的第一個業務自動化 Skill

## 一、 任務目標（限時 50 分鐘）
利用本單元所學的 SOP 拆解法則與五大結構骨架，在你的常用 AI 平台（ChatGPT Plus、Claude Pro 或 Antigravity）中封裝一套屬於你個人業務場景的「自定義 Skill」。

---

## 二、 推薦自選主題（三選一，亦可自行擬定）

### 題目 A：【行政同仁】各類經費報銷與單據合規預審員
- **場景**：同仁送件經常發票統編漏填、缺少活動簽到簿、活動經費超支。
- **目標**：上傳單據清單與說明，AI 自動比對校內報銷規章，秒速列出「缺漏清單」與「退件補件提醒信」。

### 題目 B：【授課教師】教學大綱與素養導向評量設計器
- **場景**：每學期需產出符合教育部技職人才培育規範的課程大綱與週次進度。
- **目標**：輸入課程名稱與每週主題，自動對應核心素養、Bloom 認知層次與評量工具。

### 題目 C：【研究助理 / 學生】文獻摘要與實證模型假說提煉器
- **場景**：閱讀英文長篇論文效率低，需快速提煉研究動機、變數設定與實證假說。
- **目標**：輸入 PDF 摘要或長篇段落，自動輸出變數矩陣與理論貢獻表格。

---

## 三、 實作五步驟檢核表

- [ ] **Step 1：確定受眾與角色 (Role)**：我的 Skill 要站在什麼專業立場發言？
- [ ] **Step 2：寫出負向約束 (Negative Constraints)**：列出至少 3 條「絕對不可以做的事」。
- [ ] **Step 3：規範輸出格式 (Output Schema)**：強制要求模型必須輸出特定章節或 Markdown 表格。
- [ ] **Step 4：加入 1 組少樣本示範 (Few-Shot)**：提供一組好的範例供模型對齊風格。
- [ ] **Step 5：壓力測試**：丟入一份故意有缺漏的材料，測試模型是否能準確挑出毛病而非含混過關！

---

## 四、 平台部署路徑指南

### 1. Claude Projects 部署：
1. 登入 Claude $\rightarrow$ 點擊左側「Projects」$\rightarrow$「Create Project」。
2. 將 Skill 內容貼入「Set Project Instructions」。
3. 在「Project Knowledge」上傳單位規章或參考文件。

### 2. ChatGPT Custom GPTs 部署：
1. 登入 ChatGPT $\rightarrow$ 點擊「Explore GPTs」$\rightarrow$「Create」。
2. 切換至「Configure」分頁 $\rightarrow$ 將 Skill 貼入「Instructions」。
3. 關閉不需要的功能（如 Web Search 或 DALL-E，只保留 Code Interpreter）。
