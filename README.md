# 一天打造你的 AI 工作流：大語言模型學習地圖與工作坊教材

國立臺中科技大學 國際貿易與經營系 陳俊智 副教授。教育部「AI驅動金融商管科技與技職人才培育計畫」。線上網址見本 repo 的 About 欄位。

| 你是 | 從這裡開始 |
| :--- | :--- |
| 想自學 LLM 基礎 | [`index.html`](index.html)：六站學習路線，進度存在瀏覽器 |
| 工作坊學員或講師 | [`workshop.html`](workshop.html)：課表、4 步資料分析實作路線、[學員看板](00_課程手冊與即時看板/WORKSHOP_BOARD.html) |
| 只想查名詞 | [`encyclopedia.html`](encyclopedia.html)：可搜尋的概念目錄 |
| 想先看短片 | [`videos.html`](videos.html)：60 秒 AI 盲點、數位乩童法器篇 |

本機預覽：`python3 scripts/llm_preview.py`，再開啟 http://127.0.0.1:8765/index.html 。

設計約定見 [`DESIGN.md`](DESIGN.md)，重整規格見 [`docs/specs/`](docs/specs/)（最新為 `SITE_REDESIGN_SPEC_V2.md`），待決事項見 [`docs/REDESIGN_OPEN_QUESTIONS.md`](docs/REDESIGN_OPEN_QUESTIONS.md)。

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
├── index.html                  # 📖 大語言模型六站學習地圖（首頁）
├── workshop.html               # 🎓 工作坊總覽（課表、5 步驟、參考資料）
├── media/                      # 🎞️ 示範短片與母帶音軌（mp4／wav）
├── learn.html                  # 六站課程與免 Key 教學示範
├── encyclopedia.html           # 可搜尋、可分類的概念查閱目錄
├── concepts/                   # 21 個獨立概念／參考主題
├── lab.html                    # 互動實驗室
├── topics/                     # 模型、案例與研究選讀
├── css/ & js/                  # tokens.css、shell.css、site-shell.js 與各頁互動腳本
├── sample_data/                # 豐富的測試資料集 (.xlsx / .csv)
├── videos/                     # 🎬 專案生成之 1080p 示範短片與母帶音軌
├── scripts/                    # 自動化渲染與聲音合成管線腳本
└── SKILL.md                    # Antigravity DataViz Motion 技能定義文件
```

---

## 🚀 常用操作指令

### 啟動即時看板：
```bash
open 00_課程手冊與即時看板/WORKSHOP_BOARD.html
```

### 啟動 LLM 學習地圖：
```bash
python3 scripts/llm_preview.py
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
