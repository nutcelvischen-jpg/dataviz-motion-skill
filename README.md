# 🤖 一天打造你的 AI 工作流程：從 Agent、Skill、MCP 到數據影片
### Claude × ChatGPT × Antigravity 進階實戰工作坊官方教材庫

> **教育部「AI驅動金融商管科技與技職人才培育計畫」推薦教材**  
> **授課教師**：國立臺中科技大學 國際貿易與經營系 陳俊智 副教授  
> **專案核心**：以實踐導向（>60% 實作），帶領大專院校師生、行政同仁從「單純對話」進階到「依照個人業務 SOP 驅動 AI 代理人」的高階生產力閉環。

![Resolution](https://img.shields.io/badge/Resolution-1080p_Full_HD-orange)
![Format](https://img.shields.io/badge/Workflow-Agent_%7C_Skill_%7C_MCP_%7C_Video-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📌 課前快速通道：學員即時共筆看板

因應一般教室投影幕畫面可能較不清晰，本專案提供**「學員免瞇眼即時看板」**。  
學員可直接在個人筆電開啟，所有教學 Prompt、分鏡腳本與代碼皆可**「一鍵複製（Copy）」**：

```bash
# 在終端機執行或在 Finder 雙擊檔案開啟
open 00_課程手冊與即時看板/WORKSHOP_BOARD.html
```

---

## 📅 課程時程總覽（Course Rundown）

| 時間區段 | 單元名稱 | 核心主題與概念 | 核心產出與教材指引 |
| :--- | :--- | :--- | :--- |
| **08:40 - 09:00** | 報到與環境準備 | 設備連線、帳號檢核、教材包開啟 | [00_課前準備檢核表](./00_課程手冊與即時看板/00_課前準備檢核表.md) |
| **09:00 - 10:20**<br>(80 mins) | **Module 1：Agent 思維與資料分析** | • Prompt 疲勞 vs. Agent 自動化<br>• 髒資料清洗（缺失值、千分位、日期格式）<br>• 算術交叉勾稽防幻覺機制（Cross-Verification） | [01_Module1 講義與提示詞](./01_Module1_Agent思維與資料分析/README.md)<br>• `sample_dirty_data.csv`<br>• `prompts_資料分析與核對.md` |
| *10:20 - 10:30* | *中場休息 (10 mins)* | *助教現場環境排除* | |
| **10:30 - 12:00**<br>(90 mins) | **Module 2：打造專屬 Skill 流程封裝** | • 行政/教學重複性流程 SOP 拆解<br>• System Prompt、邊界約束與 Few-shot 示範<br>• Claude Projects / Custom GPTs 封裝佈署 | [02_Module2 講義與 Skill 庫](./02_Module2_打造專屬Skill流程封裝/README.md)<br>• 公文企劃審核器 Skill<br>• 學生專案回饋器 Skill<br>• 會議紀錄萃取器 Skill |
| *12:00 - 13:00* | *午餐休息 🍱 (60 mins)* | *午餐、交流與成果工作台體驗* | |
| **13:00 - 14:20**<br>(80 mins) | **Module 3：Antigravity 建站與 MCP 串接** | • 現代 Agentic Coding 概念<br>• MCP 模型上下文協議與外部工具串接<br>• 資安守則：機敏資料脫敏、Token 防護 | [03_Module3 講義與建站指南](./03_Module3_Antigravity建站與MCP工具串接/README.md)<br>• [index.html 數據工作台](./index.html)<br>• MCP 設定檔範例 |
| *14:20 - 14:30* | *中場休息 (10 mins)* | *伸展筋骨、短片分鏡構思* | |
| **14:30 - 15:40**<br>(70 mins) | **Module 4：60 秒動態數據短片製作** | • 短影音黃金數據敘事五段式（Hook $\rightarrow$ 行動）<br>• Data Atoms 視覺美學（幾何形變、阻尼過衝）<br>• Earshot 物理音效與 Auto-Ducking 智慧避讓 | [04_Module4 講義與分鏡腳本](./04_Module4_60秒動態數據短片製作/README.md)<br>• 60秒短片分鏡腳本範本<br>• 自動化渲染管線操作指南 |
| **15:40 - 16:00**<br>(20 mins) | 結業成果發表與學習地圖 | 學員作品觀摩快閃、講師總結、研習證明發放 | 回饋問卷與電子研習證明說明 |

---

## 📁 倉庫目錄結構

```text
├── 00_課程手冊與即時看板/
│   ├── README.md               # 課程理念、詳細時程表與教學手冊
│   ├── WORKSHOP_BOARD.html     # 🌟 學員即時複製看板 (雙擊即開，一鍵複製)
│   └── 00_課前準備檢核表.md     # 設備、付費帳號與網路檢核清單
│
├── 01_Module1_Agent思維與資料分析/
│   ├── README.md               # 模組一講義：從 Chatbot 到 Agent、防幻覺架構
│   ├── prompts_資料分析與核對.md # 清洗、EDA、交叉算術驗算 Prompt 庫
│   ├── sample_dirty_data.csv   # 實作用髒數據集 (含缺失值、千分位、異常格式)
│   └── 分析報告範例_成果對照.md   # 標準分析報告產出對照範本
│
├── 02_Module2_打造專屬Skill流程封裝/
│   ├── README.md               # 模組二講義：流程標準化 SOP 與 Skill 設計架構
│   ├── skill_engineering_guide.md # 提示詞工程心法 (YAML、負向約束、Few-shot)
│   ├── skills_library/         # 3 套高頻業務自訂 Skill 範本
│   │   ├── 01_公文與行政企劃書智慧審核潤飾器/SKILL.md
│   │   ├── 02_學生專案作業與商業報告回饋器/SKILL.md
│   │   └── 03_會議紀錄與待辦任務萃取器/SKILL.md
│   └── 實作任務_打造你的第一個Skill.md
│
├── 03_Module3_Antigravity建站與MCP工具串接/
│   ├── README.md               # 模組三講義：Agentic Coding、MCP 協定與資安
│   ├── mcp_architecture_and_security.md # MCP 架構深探與資料脫敏規範
│   ├── web_dashboard_guide.md  # 互動式數據儀表板建置指南
│   └── config_examples/        # MCP 設定檔範例 (Claude & Antigravity)
│
├── 04_Module4_60秒動態數據短片製作/
│   ├── README.md               # 模組四講義：60 秒數據短片敘事結構與動態美學
│   ├── script_storyboard_template.md # 60 秒短影音黃金腳本與分鏡範本卡
│   ├── video_production_guide.md # DataViz Motion 全自動渲染管線操作指南
│   └── sample_scripts/         # 示範分鏡腳本 (校務行政篇、商管行銷篇)
│
├── index.html                  # 📊 Excel 數據視覺化互動工作台 (Data Atoms Studio)
├── css/ & js/                  # 互動工作台樣式與 SheetJS 離線解析引擎
├── sample_data/                # 豐富的測試資料集 (.xlsx / .csv)
├── videos/                     # 🎬 專案生成之 1080p 示範短片與母帶音軌
├── scripts/                    # 自動化渲染與聲音合成管線腳本
└── SKILL.md                    # Antigravity DataViz Motion 技能定義文件
```

---

## 📊 亮點工具：Excel 數據視覺化工作台 (Data Atoms Studio)

在根目錄中，我們提供了一個純前端、開箱即用的互動工具 `index.html`：
- **100% 離線運作**：內建 SheetJS，直接在瀏覽器記憶體中解析 Excel/CSV，資料不出本機，兼顧資安與隱私。
- **7 大商業數據圖形**：離散體量（柱狀）、時序趨勢（平滑均線）、相關分佈（散點回歸）、結構佔比（環形）、多維畫像（雷達）、轉化路徑（漏斗）、統計矩陣。
- **一鍵匯出**：支援匯出 1080p 超高解析度 PNG 圖片與 CSV 乾淨檔案。

在終端機執行或雙擊開啟：
```bash
open index.html
```

---

## 🎬 專案示範影片

本專案管線已生成高品質 1080p 示範影片（位於 `videos/` 目錄）：
1. **`data_atoms_launch_charon_38s.mp4`**：38 秒工作流演繹發表片（Charon 男性沉穩語音旁白 + 拖入 Excel 吸附動效）。
2. **`dataviz_analytics_45s.mp4`**：45 秒白底極簡動態圖表（Leda 女性沉穩配音 + 側邊繁體中文解讀卡片）。
3. **`dataviz_motion_60s.mp4`**：60 秒深色奢華科技交響版（極致幾何形變與連續動量）。

---

## 🚀 常用操作指令

### 啟動即時看板：
```bash
open 00_課程手冊與即時看板/WORKSHOP_BOARD.html
```

### 啟動數據工作台：
```bash
open index.html
```

### 執行 60 秒短片自動化渲染（需 Node.js 與 FFmpeg）：
```bash
# 1. 畫面逐幀無損渲染
node scripts/render_atoms_45s.js

# 2. 母帶音軌混音與影片壓制
python3 scripts/mix_master_audio.py
```

---

## 📜 授權與致敬
- **主辦與指導**：教育部「AI驅動金融商管科技與技職人才培育計畫」
- **授課師資**：國立臺中科技大學 國際貿易與經營系 陳俊智 副教授
- **Visual Architecture**：Inspired by [@guanmo_ai](https://x.com/guanmo_ai) (觀默)
- **Sound Architecture**：Powered by [Leonxlnx/earshot](https://github.com/Leonxlnx/earshot) (Leon Lin)
