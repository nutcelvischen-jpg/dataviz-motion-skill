# 📊 數據分析動態視覺化 Skill (DataViz Motion Skill)

> 深度融合 **觀默（[@guanmo_ai](https://x.com/guanmo_ai)）導演層動態系統** 與 **Leon Lin 的 [Leonxlnx/earshot](https://github.com/Leonxlnx/earshot) 程序化聲音架構**，為數據分析打造的 45 秒繁體中文配音版與 60 秒深色交響版動態影片專案。

![DataViz Motion](https://img.shields.io/badge/Resolution-1080p_Full_HD-orange)
![Frame Rate](https://img.shields.io/badge/FPS-30_/_60-blue)
![Audio](https://img.shields.io/badge/Audio-Earshot_SFX_+_TTS-green)

---

## 🎬 專案影片展示

本專案已生成兩支高品質 1080p 商業級動態影片：

1. **[`dataviz_analytics_45s.mp4`](./dataviz_analytics_45s.mp4)**（45 秒繁體中文配音版）
   - **視覺風格**：極簡白底美學（`#f5f5f3`）、側邊繁體中文解讀指引卡片、底部 6 組互動開關聯動。
   - **聲音系統**：Earshot 機械撥動音效（`click/thock`、`cut_hit/sub` 等）、台灣繁體中文語音旁白、BGM 自動音量避讓（Auto-Ducking）。
   - **六大原子**：離散體量（柱狀） $\rightarrow$ 時序趨勢（均線） $\rightarrow$ 相關分佈（散點） $\rightarrow$ 結構佔比（環形） $\rightarrow$ 多維畫像（雷達） $\rightarrow$ 轉化路徑（桑基）。
2. **[`dataviz_motion_60s.mp4`](./dataviz_motion_60s.mp4)**（60 秒深色科技交響版）
   - **視覺風格**：深色奢華科技風（`#080b11`），完整體現一形貫穿與連續動量幾何形變。

---

## 📁 目錄結構

```text
├── SKILL.md                  # Antigravity Skill 規範主定義文件
├── README.md                 # 專案完整說明文件
├── dataviz_analytics_45s.mp4 # 45秒 繁體中文配音版 1080p MP4
├── dataviz_motion_60s.mp4    # 60秒 數據視覺化全景 1080p MP4
├── src/
│   ├── index_45s.html        # 45秒 白底互動播放器與 Canvas 渲染引擎
│   └── index_60s.html        # 60秒 深色交響版播放器
├── scripts/
│   ├── render_atoms_45s.js   # Headless Chrome + FFmpeg 高速渲染管線
│   ├── mix_master_audio.py   # Earshot SFX + 語音旁白 + Ducking 混音器
│   └── generate_audio_45s.py # 120 BPM 科技節奏程序化音樂生成腳本
└── earshot_sfx/              # Earshot 原生程序化音效庫 (.wav)
    ├── click_thock.wav       # 機械開關厚實按壓音
    ├── click_snap.wav        # 開關彈片清脆音
    ├── cut_hit_sub.wav       # 次低音重擊
    ├── cut_hit_air.wav       # 氣流過渡音
    ├── drip_plink.wav        # 異常值晶亮水滴音
    └── downlifter_sub_sink.wav # 終章低頻下潛音
```

---

## 🚀 快速上手

### 1. 播放已生成的 MP4 影片
在 Mac 終端機執行：
```bash
open dataviz_analytics_45s.mp4
```

### 2. 本地畫布互動與逐幀檢查
```bash
open src/index_45s.html
```

### 3. 重新混音與渲染影片
```bash
# 生成音訊與語音旁白
python3 scripts/mix_master_audio.py

# 渲染 1080p 影片
node scripts/render_atoms_45s.js
```

---

## 📜 授權與致敬
- Visual Architecture inspired by **[@guanmo_ai](https://x.com/guanmo_ai)** (觀默)
- Sound Architecture powered by **[Leonxlnx/earshot](https://github.com/Leonxlnx/earshot)** (Leon Lin)
