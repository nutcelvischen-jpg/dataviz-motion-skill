# 🛠️ DataViz Motion 影片自動化渲染管線操作指南

## 一、 渲染管線運作機制

本專案採用的 `DataViz Motion` 技術是將「網頁前端代碼」直接轉換為「專業 1080p 廣播級 MP4 影片」的高效管線：

```text
  1. 數據與文案 (.xlsx / .csv / .json)
                 │
                 ▼
  2. Canvas 物理引擎 (src/index_45s.html / index_60s.html)
     - 阻尼震盪彈簧力學 (Spring Physics)
     - 幾何形變與連續動量
                 │
                 ▼
  3. 逐幀無損擷取 (Headless Chrome via Puppeteer)
     - 腳本：scripts/render_atoms_45s.js
     - 精確鎖定 30 / 60 FPS，絕不掉幀
                 │
                 ▼
  4. 音軌母帶合成 (Python + FFmpeg)
     - 語音旁白 (TTS)
     - Earshot 物理音效 (.wav)
     - Auto-Ducking 智慧音量避讓
                 │
                 ▼
  5. 匯出終端成片 (videos/xxx.mp4)
```

---

## 二、 學員極速出片實操（三步驟）

### 步驟 1：確認環境依賴
在終端機中確認已安裝 FFmpeg 與 Node.js：
```bash
node -v
ffmpeg -version
```

### 步驟 2：更換數據與文字
若想更換為自己的數據：
- 在 `sample_data/` 中替換您的 CSV 檔案，或修改 `src/index_45s.html` 中的資料陣列與旁白文案字串。

### 步驟 3：執行一鍵渲染腳本
在專案根目錄下執行：
```bash
# 1. 執行 Headless Chrome 畫面逐幀渲染
node scripts/render_atoms_45s.js

# 2. 執行母帶音軌混音與影像壓制
python3 scripts/mix_master_audio.py
```
渲染完成後，終端機會提示成片已保存在 `videos/` 目錄中，直接開啟即可播放！
