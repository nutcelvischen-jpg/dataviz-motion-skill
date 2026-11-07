#!/usr/bin/env python3
"""Data Atoms 操作示範影片：自動操作 + 台灣女聲旁白 + 字幕，一支腳本完成。

流程：旁白逐句 TTS（Gemini，OpenRouter）→ Playwright 連續錄製（每句旁白開始時才執行對應操作，
操作與講解自然對齊）→ 依實際開始時間把旁白放進音軌 → ffmpeg 加字幕條並混音。

輸出：videos/data_atoms_demo.mp4、videos/data_atoms_demo.srt
前置：ffmpeg、uv；金鑰只在執行時讀取（--key-file 或環境變數 OPENROUTER_API_KEY），不寫進程式碼。
執行：
  uv run --with playwright --with pillow --with httpx python scripts/make_data_atoms_demo.py \
      --key-file /path/to/OPR-KEY.txt
"""
import argparse
import hashlib
import http.server
import os
import re
import shutil
import socketserver
import subprocess
import sys
import threading
import time
import wave
from pathlib import Path

import httpx
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / "scratch" / "data_atoms_demo"  # scratch/ 已在 .gitignore
OUT_MP4 = ROOT / "videos" / "data_atoms_demo.mp4"
OUT_SRT = ROOT / "videos" / "data_atoms_demo.srt"
PAGE = "data_atoms.html"
VW, VH, BAR_H = 1440, 816, 84  # 畫面 1440x816，下方另加 84px 字幕條（不遮住介面提示）
SR = 24000
LEAD, GAP, TAIL = 0.4, 0.3, 0.8
TTS_URL = "https://openrouter.ai/api/v1/audio/speech"
TTS_MODEL = "google/gemini-3.8-flash-tts"

CURSOR_JS = """
(() => {
  const c = document.createElement('div');
  c.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;width:28px;height:28px;' +
    'border:3px solid #ff4400;border-radius:50%;background:rgba(255,68,0,.18);' +
    'transform:translate(-50%,-50%);left:-60px;top:-60px;transition:transform .08s';
  const mount = () => document.documentElement.appendChild(c);
  const mv = e => { if (e.clientX || e.clientY) { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; } };
  addEventListener('mousemove', mv, true); addEventListener('dragover', mv, true); addEventListener('drag', mv, true);
  addEventListener('mousedown', () => c.style.transform = 'translate(-50%,-50%) scale(.7)', true);
  addEventListener('mouseup', () => c.style.transform = 'translate(-50%,-50%) scale(1)', true);
  document.documentElement ? mount() : addEventListener('DOMContentLoaded', mount);
})();
"""

# ---------------------------------------------------------------- 操作輔助
class Driver:
    def __init__(self, pg):
        self.pg, self.x, self.y = pg, 720.0, 400.0

    def glide(self, x, y, ms=700):
        n = max(int(ms / 22), 4)
        x0, y0 = self.x, self.y
        for i in range(1, n + 1):
            k = i / n
            k = k * k * (3 - 2 * k)  # ease in-out
            self.pg.mouse.move(x0 + (x - x0) * k, y0 + (y - y0) * k)
            self.pg.wait_for_timeout(22)
        self.x, self.y = x, y

    def center(self, loc):
        loc.scroll_into_view_if_needed()
        b = loc.bounding_box()
        return b["x"] + b["width"] / 2, b["y"] + b["height"] / 2

    def hover(self, loc, ms=700):
        self.glide(*self.center(loc), ms)

    def click(self, loc, ms=500):
        self.hover(loc, ms)
        self.pg.wait_for_timeout(120)
        self.pg.mouse.down(); self.pg.wait_for_timeout(80); self.pg.mouse.up()
        self.pg.wait_for_timeout(350)

    def drag(self, src, dst_sel):
        self.hover(src, 500)
        self.pg.mouse.down(); self.pg.wait_for_timeout(100)
        self.glide(self.x + 8, self.y + 6, 140)
        self.glide(*self.center(self.pg.locator(dst_sel)), 650)
        self.pg.wait_for_timeout(150)
        self.pg.mouse.up(); self.pg.wait_for_timeout(600)

    def dataset(self, value):
        self.pg.select_option("#datasetQuickSelect", value)
        self.pg.wait_for_timeout(1300)

    def dim(self, name):
        return self.pg.locator("#dimensionsList .field-pill").filter(has_text=name).first

    def meas(self, name):
        return self.pg.locator("#measuresList .field-pill").filter(has_text=name).first


# ---------------------------------------------------------------- 場景（每句旁白綁一個操作）
def build_scenes(d: Driver):
    pg = d.pg

    def scroll_stage(top, wait=1100):
        """平滑捲動主舞台：top=0 回到最上，否則捲到最底（露出資料抽屜）。"""
        pg.evaluate("""(top) => { const e = document.querySelector('.stage-body');
                       e.scrollTo({top: top === 0 ? 0 : e.scrollHeight, behavior: 'smooth'}); }""", top)
        pg.wait_for_timeout(wait)

    def s1_select(): d.hover(pg.locator("#datasetQuickSelect"), 900)
    def s1_kpi():
        d.hover(pg.locator("#kpiRowCount"), 700); pg.wait_for_timeout(500)
        d.hover(pg.locator("#kpiTotalSum"), 600); pg.wait_for_timeout(400)
        d.hover(pg.locator("#kpiMeanVal"), 600)

    def s2_clear(): d.click(pg.locator("#btnClearShelves"))
    def s2_x(): d.drag(d.dim("都道府縣"), "#shelfX")
    def s2_y(): d.drag(d.meas("總人口(人)"), "#shelfY")

    def s3_color(): d.drag(d.dim("地方分區"), "#shelfColor")
    def s3_secondary(): d.drag(d.meas("高齡化率(%)"), "#shelfSecondary")

    def s4_switch():
        d.dataset("jp_gender_facet"); d.click(pg.locator("#btnClearShelves"))
    def s4_drag():
        d.drag(d.dim("城市"), "#shelfX")
        d.drag(d.meas("總人口(萬人)"), "#shelfY")
        d.drag(d.dim("性別"), "#shelfFacet")

    def s5_first():
        d.dataset("jp_prefectures")
        d.click(pg.locator("#activeFiltersStrip .filter-quick-action").filter(has_text="只留第一項"))
    def s5_add():
        d.click(pg.locator("#activeFiltersStrip .filter-chip-btn").filter(has_text="近畿地方"))
        d.hover(pg.locator("#kpiRowCount"), 800)

    def s6_hist(): d.dataset("jp_history")
    def s6_types():
        d.click(pg.locator('.chart-type-card[data-chart="bar"]')); pg.wait_for_timeout(1200)
        d.click(pg.locator('.chart-type-card[data-chart="line"]'))

    def s7_open():
        d.dataset("jp_prefectures"); d.click(pg.locator("#btnToggleDrawer"))
        # 此介面抽屜展開後會往下長出畫面，需捲動主舞台才看得到資料表（與真實操作相同）
        scroll_stage(1000)
    def s7_search():
        d.click(pg.locator("#tableSearchInput"))
        pg.type("#tableSearchInput", "東京", delay=260); pg.wait_for_timeout(1000)
        d.click(pg.locator("#btnExportCSV")); pg.wait_for_timeout(700)
        scroll_stage(0, 700)
        d.click(pg.locator("#btnToggleDrawer"))

    def s8_pin():
        d.click(pg.locator("#btnPinCurrentSheet"))
        d.dataset("jp_history"); d.click(pg.locator("#btnPinCurrentSheet"))
    def s8_dash(): d.click(pg.locator("#btnOpenDashboardFromTabs")); pg.wait_for_timeout(1500)

    def s9_close(): d.click(pg.locator("#btnCloseDashboardModal"))

    return [
        ("01_open", [
            ("歡迎使用 Data Atoms，一個在瀏覽器裡就能完成的互動式資料探索工作台。", None),
            ("先從資料集選單，選擇日本四十七都道府縣的人口與高齡化資料。", s1_select),
            ("上方的指標卡，會立刻算出筆數、總和與平均值。", s1_kpi)]),
        ("02_xy", [
            ("接著，用拖曳的方式組圖。", s2_clear),
            ("把都道府縣拖到 X 軸。", s2_x),
            ("再把總人口拖到 Y 軸，長條圖就即時畫出來了。", s2_y)]),
        ("03_color", [
            ("想看更多維度，就把地方分區拖進顏色，每個地區會自動換上不同的顏色。", s3_color),
            ("再把高齡化率放進次軸，折線疊在長條上，人口與高齡化的關係一目了然。", s3_secondary)]),
        ("04_facet", [
            ("遇到要並排比較的情境，就用分面。我們換到日本十二大城市的性別資料。", s4_switch),
            ("把城市拖到 X 軸，總人口拖到 Y 軸，再把性別拖進面。", s4_drag),
            ("男性與女性就自動拆成兩張小圖並列，用同一個刻度比較。", None)]),
        ("05_filter", [
            ("篩選器可以讓你即時聚焦。我們換回四十七都道府縣的資料，先只留下關東地方。", s5_first),
            ("再加入近畿地方，指標卡也會同步顯示篩選後的筆數。", s5_add)]),
        ("06_types", [
            ("換成日本半世紀的人口演進資料，系統會自動選用折線圖，呈現時序趨勢。", s6_hist),
            ("圖表類型也能隨時切換，同一份資料，換個角度看。", s6_types)]),
        ("07_table", [
            ("底部的資料抽屜，可以展開原始資料表。", s7_open),
            ("可以直接搜尋，例如輸入東京，並且一鍵匯出成 CSV。", s7_search)]),
        ("08_dashboard", [
            ("喜歡的圖表，可以釘選到自訂看板。", s8_pin),
            ("最後組合成儀表板，用雙欄排版一次呈現。", s8_dash)]),
        ("09_outro", [
            ("從選資料、拖曳組圖，到篩選、分面與儀表板，全部都在瀏覽器本機完成。", s9_close),
            ("謝謝觀看。", None)]),
    ]


# ---------------------------------------------------------------- TTS
def load_key(key_file):
    if os.environ.get("OPENROUTER_API_KEY"):
        return os.environ["OPENROUTER_API_KEY"]
    if key_file:
        m = re.search(r"sk-or-[A-Za-z0-9_-]+", Path(key_file).read_text(encoding="utf-8", errors="ignore"))
        if m:
            return m.group(0)
    sys.exit("找不到 OpenRouter 金鑰：請用 --key-file 或設定 OPENROUTER_API_KEY")


def tts(key, voice, text):
    WORK.mkdir(parents=True, exist_ok=True)
    cache = WORK / f"tts_{hashlib.sha1((voice + '|' + text).encode()).hexdigest()[:16]}.pcm"
    if cache.exists():
        return cache.read_bytes()
    err = ""
    for attempt in range(3):
        try:
            r = httpx.post(TTS_URL, headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                           json={"model": TTS_MODEL, "voice": voice, "input": text}, timeout=120)
            if r.status_code == 200 and r.headers.get("content-type", "").startswith("audio/pcm"):
                cache.write_bytes(r.content)
                return r.content
            err = r.text[:200]
        except httpx.HTTPError as e:
            err = str(e)[:200]
        print(f"  TTS 失敗（第 {attempt + 1} 次）：{err}")
        time.sleep(3)
    sys.exit(f"TTS 連續失敗：{text[:20]}…")


def speedup(pcm, factor):
    """用 ffmpeg atempo 加速（保持音高）；Gemini TTS 的 speed 參數無效。"""
    if abs(factor - 1.0) < 0.01:
        return pcm
    r = subprocess.run(["ffmpeg", "-loglevel", "error", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "pipe:0",
                        "-af", f"atempo={factor}", "-f", "s16le", "pipe:1"], input=pcm, capture_output=True)
    if r.returncode:
        sys.exit(f"加速失敗：{r.stderr.decode()[-300:]}")
    return r.stdout


# ---------------------------------------------------------------- 字幕
def chunks_for(sentence, t0, dur):
    parts = [p for p in re.split(r"[。，、：；！？]", sentence) if p.strip()]
    chunks = []
    for p in parts:
        p = re.sub(r"[。！？]", "", p).strip()
        if not p:
            continue
        n = -(-len(p) // 26)
        size = -(-len(p) // n)
        chunks += [p[i:i + size] for i in range(0, len(p), size)]
    total = sum(len(c) for c in chunks) or 1
    out, t = [], t0
    for c in chunks:
        dd = dur * len(c) / total
        out.append((t, t + dd, c))
        t += dd
    return out


def pick_font(size):
    cands = list(Path("/System/Library/AssetsV2").glob("**/PingFang.ttc"))
    if not cands:
        sys.exit("找不到 PingFang 字型（macOS）")
    for i in range(30):
        try:
            f = ImageFont.truetype(str(cands[0]), size, index=i)
        except OSError:
            break
        if "PingFang TC" in " ".join(f.getname()) and "Medium" in " ".join(f.getname()):
            return f
    return ImageFont.truetype(str(cands[0]), size)


def text_png(text, font, path):
    probe = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    l, t, r, b = probe.textbbox((0, 0), text, font=font)
    im = Image.new("RGBA", (r - l + 8, b - t + 8), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((4 - l, 4 - t), text, font=font, fill=(255, 255, 255, 255))
    im.save(path)
    return im.size


def srt_time(t):
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def run(cmd):
    r = subprocess.run([str(c) for c in cmd], capture_output=True, text=True)
    if r.returncode:
        sys.exit(f"ffmpeg 失敗：{r.stderr[-800:]}")


# ---------------------------------------------------------------- 主流程
def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), lambda *a, **k: Quiet(*a, directory=str(ROOT), **k))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, srv.server_address[1]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--key-file")
    ap.add_argument("--voice", default="Kore")
    ap.add_argument("--speed", type=float, default=1.15, help="語速倍率（atempo）")
    ap.add_argument("--keep-work", action="store_true")
    a = ap.parse_args()
    key = load_key(a.key_file)
    shutil.rmtree(WORK / "rec", ignore_errors=True)
    (WORK / "rec").mkdir(parents=True, exist_ok=True)
    OUT_MP4.parent.mkdir(exist_ok=True)

    srv, port = serve()
    placed = []  # (start_sec, pcm, sentence)
    scene_marks = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": VW, "height": VH}, accept_downloads=True,
                                  record_video_dir=str(WORK / "rec"), record_video_size={"width": VW, "height": VH})
        ctx.add_init_script(CURSOR_JS)
        t0 = time.monotonic()
        now = lambda: time.monotonic() - t0
        pg = ctx.new_page()
        d = Driver(pg)
        pg.goto(f"http://127.0.0.1:{port}/{PAGE}", wait_until="load")
        pg.wait_for_timeout(2500)
        pg.select_option("#datasetQuickSelect", "jp_prefectures")
        pg.wait_for_timeout(2500)
        setup_end = now()
        print(f"準備完成，從 {setup_end:.1f}s 開始計時")

        for sid, sents in build_scenes(d):
            scene_start = now()
            prev_end = scene_start + LEAD - GAP
            for i, (text, act) in enumerate(sents):
                pcm = speedup(tts(key, a.voice, text), a.speed)
                dur = len(pcm) / 2 / SR
                wait = prev_end + GAP - now()
                if wait > 0:
                    pg.wait_for_timeout(int(wait * 1000))
                s_start = now()
                placed.append((s_start, pcm, text))
                if act:
                    try:
                        act()
                    except Exception as e:
                        pg.screenshot(path=str(WORK / f"FAIL_{sid}_{i}.png"))
                        sys.exit(f"[{sid} 第 {i + 1} 句] 操作失敗：{str(e)[:300]}")
                prev_end = max(s_start + dur, now())
                rest = s_start + dur - now()
                if rest > 0:
                    pg.wait_for_timeout(int(rest * 1000))
            pg.wait_for_timeout(int(TAIL * 1000))
            scene_marks.append((sid, scene_start, now()))
            print(f"  {sid}: {scene_start - setup_end:6.1f}s → {now() - setup_end:6.1f}s")
        total = now()
        video = pg.video
        pg.close(); ctx.close(); browser.close()
        vpath = Path(video.path())
    srv.shutdown()

    # 音軌：以「準備完成」為 0 秒
    length = total - setup_end
    audio = bytearray(b"\x00\x00" * int(SR * length))
    cues = []
    for s_start, pcm, text in placed:
        off = int((s_start - setup_end) * SR) * 2
        audio[off:off + len(pcm)] = pcm[: len(audio) - off]
        cues += chunks_for(text, s_start - setup_end, len(pcm) / 2 / SR)
    wav = WORK / "narration.wav"
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(bytes(audio))
    OUT_SRT.write_text("".join(f"{i}\n{srt_time(s)} --> {srt_time(e)}\n{c}\n\n" for i, (s, e, c) in enumerate(cues, 1)),
                       encoding="utf-8")

    # 合成：裁掉準備段、下方加字幕條、疊字幕、混音
    font = pick_font(32)
    inputs, graph, last = ["-ss", f"{setup_end:.2f}", "-i", vpath, "-i", wav], [], None
    graph.append(f"[0:v]fps=30,pad={VW}:{VH + BAR_H}:0:0:color=0x081020[b]")
    last = "[b]"
    for i, (s, e, c) in enumerate(cues, 1):
        png = WORK / f"sub_{i:03d}.png"
        w_, h_ = text_png(c, font, png)
        inputs += ["-i", png]
        out = f"[v{i}]"
        graph.append(f"{last}[{i + 1}:v]overlay=x=(W-w)/2:y={VH}+({BAR_H}-h)/2:enable='between(t,{s:.3f},{e:.3f})'{out}")
        last = out
    gs = WORK / "filter.txt"
    gs.write_text(";".join(graph), encoding="utf-8")
    run(["ffmpeg", "-loglevel", "error", "-y", *inputs, "-/filter_complex", gs, "-map", last, "-map", "1:a",
         "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-t", f"{length:.2f}",
         "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k",
         "-movflags", "+faststart", OUT_MP4])
    print(f"\n完成：{OUT_MP4}（{length:.0f} 秒）\n字幕：{OUT_SRT}")


if __name__ == "__main__":
    main()
