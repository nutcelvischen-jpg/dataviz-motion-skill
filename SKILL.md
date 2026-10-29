---
name: dataviz-motion
description: 數據分析動態視覺化影片生成技能。基於觀默（@guanmo_ai）「導演層動態系統」與 Earshot 聲音架構，以 Canvas/WebAudio 與 Headless Chrome 程式碼全自動生成 1080p 60FPS 幾何形變動效、繁體中文解說卡片、多維指標圖表與語音旁白混音影片。
---

# 數據分析動態視覺化影片生成技能 (DataViz Motion Skill)

本技能提供一套完整的「代碼生成動態影片」工作流，專為展示商業數據分析、指標可視化與產品宣傳片設計。融合了 **觀默（@guanmo_ai）的導演層動態美學** 與 **Leon Lin 的 Earshot 物理音效庫**，可一鍵生成具備極簡白底美學、繁體中文側邊解讀卡片、底部互動開關矩陣與自然語音配音的高畫質 MP4 影片。

---

## 🎯 適用場景 (When to Use)

* 使用者需要以動態短片（如 45 秒、60 秒）介紹數據分析概念、指標儀表板或商業洞察。
* 製作科技感、極簡現代主義風格的圖表展示影片（柱狀賽跑、7日均線時序、散點相關迴歸、環形佔比旭日、六維雷達、桑基流向）。
* 需要結合自然語音旁白（TTS）、BGM 智慧音量避讓（Auto-Ducking）與物理打點音效（UI Click / Thock / Sub Hit）。

---

## 🏗 核心設計法則 (Core Principles)

### 1. 導演層 Brief 與一形貫穿 (Continuous Momentum)
* **公式**：成片品質 = 設計判斷 × 運動語言 × 素材 × 節拍與聲音 × 渲染 × 自檢。
* **動量連續**：相鄰圖表間不使用粗糙的全屏淡出，而是透過幾何節點的物理形變（如柱頭鎖定為折線錨點、折線爆發為散點粒子雲）實現無縫轉折。

### 2. 運動力學 (Motion Physics)
* **預備與拉伸**：元素升起前產生 Squash 擠壓蓄力，上升時 Stretch 垂直拉伸。
* **阻尼過衝**：數值成長與定位使用 Damped Harmonic Oscillator（`stiffness: 120, damping: 12`），產生自然回彈。
* **層級錯相**：坐標軸先動、圖形交錯延遲、標籤微滯後，消除 PPT 式全體同步動態。

### 3. Earshot 聲音架構與智慧混音 (Audio Architecture)
* **程序化音效庫**：整合 Earshot 經測量的本地音效（`click/thock`, `cut_hit/sub`, `drip/plink`, `downlifter/sub_sink`）。
* **動態避讓 (Auto-Ducking)**：旁白語音播報時，BGM 自動平滑衰減 -10dB（降至 35% 音量）；旁白收尾與開關彈動時，BGM 與音效瞬間回升至 100%。

---

## 📊 數據分析六大原子 (The 6 Data Atoms)

| 序號 | 圖表類型 | 英文標識 | 核心公式 / 指標 | 繁體中文分析解讀指引 |
| :--- | :--- | :--- | :--- | :--- |
| **00.** | **原始數據** | `RAW DATA` | `entropy: high` | 未經清洗與維度切分的原始數據缺乏決策脈絡，容易產生資訊過載與解讀偏差。 |
| **01.** | **離散體量** | `DISCRETE COMPARISON` | `rank · variance · Δ = 420K` | 比較不同產品線或部門的絕對產出，快速鎖定高價值貢獻者與極值落差。 |
| **02.** | **時序趨勢** | `TEMPORAL TREND` | `trendline · MA7 · seasonality` | 消除短期隨機雜訊，觀察週期性波動、拐點與長期成長動能。 |
| **03.** | **相關分佈** | `CORRELATION MATRIX` | `pearson R = 0.942 · 3.4σ` | 驗證變量間因果假說，識別異常離群值（Outliers）以防策略誤判。 |
| **04.** | **結構佔比** | `COMPOSITION HIERARCHY`| `pareto 80/20 · normalization`| 檢視二八法則（Pareto Principle），評估各業務單元在總體營收中的份額權重。 |
| **05.** | **多維畫像** | `MULTIVARIATE PROFILE` | `6-axis std · benchmark 90+` | 跳脫單一維度盲區，綜合評估系統體質，發掘潛在短板與平衡點。 |
| **06.** | **轉化路徑** | `CONVERSION FUNNEL`    | `CR 14.8% · drop-off歸因`     | 追蹤全鏈路轉化效率，精準定位漏斗流失瓶頸與關鍵歸因來源。 |
| **07.** | **數據洞察** | `DECISION SYNTHESIS`   | `6 ATOMS • DECISION LOOP`    | **好分析，是用圖表洞見真實趨勢**，將數據轉化為確信的商業行動。 |

---

## 🚀 快速生成與運行指引 (Quick Start)

### 1. 本地互動播放器預覽
直接在瀏覽器開啟極簡畫布播放器，支援 30/60 FPS 即時預覽、逐幀審查（-1 幀 / +1 幀）與開關切換：
```bash
open src/index_45s.html
```

### 2. 重新壓製配音與音頻混音
使用 Python 生成 120BPM 節奏並呼叫 macOS 語音引擎與 Earshot SFX 進行多軌立體聲混音：
```bash
python3 scripts/mix_master_audio.py
```

### 3. 一鍵渲染輸出 1080p MP4 影片
使用 Headless Chrome 逐幀提取高畫質影像並透過 FFmpeg 快速封裝為 H.264 MP4：
```bash
node scripts/render_atoms_45s.js
```
輸出規格：`1920x1080 @ 30FPS`，檔案大小僅約 `3.8 MB`。
