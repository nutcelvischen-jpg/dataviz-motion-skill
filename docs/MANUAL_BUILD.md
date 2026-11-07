# 操作手冊（data_atoms_manual.html）產生方式

手冊由 Markdown 源稿產生，**不要直接改 HTML**。工作台改版後，依下列順序更新。

## 檔案

| 檔案 | 用途 |
|---|---|
| `docs/manual_source.md` | 手冊內容（改文字改這個） |
| `docs/manual_images/*.jpg` | 手冊截圖（由腳本自動擷取） |
| `scripts/capture_manual_images.py` | 用目前的工作台擷取全部截圖 |
| `data_atoms_manual.html` | 產出的手冊（單一檔案，圖片內嵌；工作台頂部連結指向它） |

## 更新步驟

```bash
# 1. 重新擷取截圖（約 1 分鐘；需要 uv，會自動安裝 playwright 與 pillow）
uv run --with playwright --with pillow python scripts/capture_manual_images.py

# 2. 修改 docs/manual_source.md 中與改版有關的文字

# 3. 產生手冊（使用 answer-me-with-html 技能內附的 am 指令）
node ~/.claude/skills/answer-me-with-html/scripts/am.mjs render docs/manual_source.md \
  -o data_atoms_manual.html --no-open
```

## 注意

- 截圖腳本會暫時隱藏提示訊息與浮動頭像，只影響截圖，不改網站檔案。
- 「堆疊」與「統一／獨立量表」兩顆按鈕曾因呼叫 `setBarStackMode`、`toggleFacetScale` 缺少 `window.PyGWalker.` 前綴而失效，已於 2026-11-08 修正；擷圖腳本直接點按鈕，若這兩張圖看起來沒變化，先檢查是否又壞了。
- 手冊內的數字（資料集數量、縮放比例、取前幾筆等）取自程式碼；改版後請對照 `js/pygwalker_data_atoms.js` 重新確認。
