#!/usr/bin/env python3
"""為 data_atoms_manual.html 擷取「目前介面」的操作截圖，存到 docs/manual_images/。

執行：uv run --with playwright --with pillow python scripts/capture_manual_images.py
工作台改版後重跑即可更新手冊圖片，再重新產生手冊（見 docs/MANUAL_BUILD.md）。
"""
import http.server
import io
import socketserver
import sys
import threading
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "manual_images"
VW, VH = 1440, 900
failed = []


def serve():
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), lambda *a, **k: Q(*a, directory=str(ROOT), **k))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, srv.server_address[1]


def save(png_bytes, name, max_w=None, q=84):
    max_w = max_w or 1440  # 2 倍解析度擷取，輸出前縮到合理寬度（仍保有清晰度）
    im = Image.open(io.BytesIO(png_bytes)).convert("RGB")
    if max_w and im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    path = OUT / f"{name}.jpg"
    im.save(path, "JPEG", quality=q, optimize=True)
    print(f"  ✓ {name}.jpg  {im.width}x{im.height}  {path.stat().st_size // 1024}KB")


class Atoms:
    def __init__(self, browser, base):
        self.b, self.base = browser, base
        self.pg = None

    def fresh(self, dataset="jp_prefectures", clear=False):
        if self.pg:
            self.pg.context.close()
        ctx = self.b.new_context(viewport={"width": VW, "height": VH}, device_scale_factor=2)
        self.pg = ctx.new_page()
        self.pg.goto(f"{self.base}/data_atoms.html", wait_until="load")
        self.pg.wait_for_timeout(1800)
        self.pg.select_option("#datasetQuickSelect", dataset)
        self.pg.wait_for_timeout(1500)
        if clear:
            self.pg.click("#btnClearShelves")
            self.pg.wait_for_timeout(500)
        self.hide_toast()
        return self.pg

    def hide_toast(self):
        # 提示訊息與浮動頭像會擋畫面，截圖前先藏起來（只影響截圖，不改網站檔案）
        self.pg.add_style_tag(content="#toastNotice{display:none!important} .digital-jitong, [class*='jitong'], [id*='jitong']{display:none!important}")

    def field(self, name, kind=None):
        sel = "#dimensionsList .field-pill, #measuresList .field-pill"
        return self.pg.locator(sel).filter(has_text=name).first

    def assign(self, shelf, name):
        """用欄位的快捷鈕指派（與拖曳走同一個 setShelfField）。"""
        pill = self.field(name)
        f = pill.locator('[data-action="assign-shelf"]').first.get_attribute("data-field")
        self.pg.evaluate("""([s, f]) => document.querySelector(
            `[data-action="assign-shelf"][data-shelf="${s}"][data-field="${f}"]`).click()""", [shelf, f])
        self.pg.wait_for_timeout(500)

    def chart(self, kind):
        self.pg.click(f'.chart-type-card[data-chart="{kind}"]')
        self.pg.wait_for_timeout(1200)

    def shot(self, name, selector=None, clip=None, max_w=None, pad=0):
        self.pg.wait_for_timeout(700)
        try:
            if selector:
                data = self.pg.locator(selector).first.screenshot()
            elif clip:
                data = self.pg.screenshot(clip=clip)
            else:
                data = self.pg.screenshot()
            save(data, name, max_w)
        except Exception as e:
            failed.append(name)
            print(f"  ✗ {name}: {str(e)[:120]}")


def region(pg, sels, pad=8):
    """多個元素的聯集範圍，供 clip 使用。"""
    boxes = [pg.locator(s).first.bounding_box() for s in sels]
    x0 = min(b["x"] for b in boxes) - pad; y0 = min(b["y"] for b in boxes) - pad
    x1 = max(b["x"] + b["width"] for b in boxes) + pad; y1 = max(b["y"] + b["height"] for b in boxes) + pad
    return {"x": max(x0, 0), "y": max(y0, 0), "width": min(x1, VW) - max(x0, 0), "height": min(y1, VH) - max(y0, 0)}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    srv, port = serve()
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True)
        A = Atoms(b, f"http://127.0.0.1:{port}")

        print("[1] 工作台總覽（標註編號）")
        pg = A.fresh("jp_prefectures")
        pg.evaluate("""() => {
          const marks = [
            ['#datasetQuickSelect','1'], ['#dimensionsList','2'], ['#shelfX','3'], ['#chartTypeGrid','4'],
            ['#kpiRowCount','5'], ['#workbookTabsBar','6'], ['#echartsViewport','7'], ['#drawerToggleBar','8'],
            ['#btnOpenDashboardModal','9']
          ];
          for (const [sel, n] of marks) {
            const el = document.querySelector(sel); if (!el) continue;
            const r = el.getBoundingClientRect();
            const d = document.createElement('div'); d.textContent = n;
            d.style.cssText = `position:fixed;z-index:2147483647;left:${Math.max(r.left-4,2)}px;top:${Math.min(Math.max(r.top-4,2),862)}px;` +
              'width:24px;height:24px;border-radius:50%;background:#ff4400;color:#fff;font:700 14px/24px sans-serif;' +
              'text-align:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)';
            document.body.appendChild(d);
          }
        }""")
        A.shot("00_overview")

        print("[2] 欄位清單與型別")
        pg = A.fresh("jp_prefectures")
        A.shot("01_fields", selector="#sidebarDock", max_w=560)

        print("[3] 七個編碼槽位")
        pg = A.fresh("jp_prefectures")
        pg.wait_for_timeout(500)
        A.shot("02_shelves", clip={"x": 328, "y": 140, "width": 1104, "height": 152}, max_w=1100)

        print("[4] X/Y：直式長條、橫式長條、聚合")
        pg = A.fresh("jp_prefectures", clear=True)
        A.assign("x", "都道府縣"); A.assign("y", "總人口(人)")
        A.shot("03_xy_bar", selector="#echartsViewport", max_w=900)
        pg.click("#btnSwapXY"); pg.wait_for_timeout(1200)
        A.shot("04_x_measure_horizontal", selector="#echartsViewport", max_w=900)
        pg.click("#btnSwapXY"); pg.wait_for_timeout(800)
        pg.locator('[data-action="cycle-agg"]').first.click(); pg.wait_for_timeout(500)
        A.shot("05_agg_pill", clip=region(pg, ["#shelfY"], 6))

        print("[5] 色：併排／堆疊")
        pg = A.fresh("jp_gender_cities")
        print("   shelves:", pg.locator("#shelfColor").inner_text().replace("\n", " ")[:50])
        A.shot("06_color_grouped", selector="#echartsViewport", max_w=900)
        try:
            pg.locator('[data-action="set-bar-stack-mode"][data-stacked="true"]').first.click(); pg.wait_for_timeout(1000)
        except Exception as e:
            print("   ✗ 堆疊切換失敗", e)
        A.shot("07_color_stacked", selector="#echartsViewport", max_w=900)

        print("[6] 大小（散佈／氣泡）、次軸")
        pg = A.fresh("jp_prefectures", clear=True)
        A.assign("x", "高齡化率(%)"); A.assign("y", "外國人佔比(%)"); A.assign("color", "地方分區"); A.assign("size", "總人口(人)")
        A.shot("08_size_bubble", selector="#echartsViewport", max_w=900)
        pg = A.fresh("jp_prefectures")
        A.shot("09_secondary_axis", selector="#echartsViewport", max_w=900)

        print("[7] 面：統一／獨立量表（地方分區各區人口差距大，才看得出差別）")
        pg = A.fresh("jp_prefectures", clear=True)
        A.assign("x", "都道府縣"); A.assign("y", "總人口(人)"); A.assign("facet", "地方分區")
        # 只留 2 個地方分區（關東、近畿），一排兩個面板，不會被畫面高度切掉
        pg.locator("#activeFiltersStrip .filter-quick-action").filter(has_text="只留第一項").click(); pg.wait_for_timeout(400)
        for region_name in ["近畿地方"]:
            pg.locator("#activeFiltersStrip .filter-chip-btn").filter(has_text=region_name).first.click(); pg.wait_for_timeout(400)
        A.shot("10_facet_fixed", selector="#echartsViewport", max_w=1000)
        pg.locator('[data-action="toggle-facet-scale"]').first.click(); pg.wait_for_timeout(1500)
        A.shot("11_facet_free", selector="#echartsViewport", max_w=1000)
        pg = A.fresh("jp_gender_facet")
        A.shot("10b_facet_gender", selector="#echartsViewport", max_w=1000)

        print("[8] 濾：類別、範圍")
        pg = A.fresh("jp_prefectures")
        pg.locator("#activeFiltersStrip .filter-quick-action").filter(has_text="只留第一項").click(); pg.wait_for_timeout(500)
        pg.locator("#activeFiltersStrip .filter-chip-btn").filter(has_text="近畿地方").click(); pg.wait_for_timeout(1000)
        A.shot("12_filter_category", clip={"x": 320, "y": 140, "width": 1120, "height": 640}, max_w=1000)
        pg = A.fresh("jp_history")
        A.shot("13_filter_range", clip={"x": 328, "y": 288, "width": 1104, "height": 90}, max_w=1100)

        print("[9] 多指標比較")
        pg = A.fresh("jp_prefectures")
        try:
            pg.get_by_text("多指標比較").first.click(); pg.wait_for_timeout(900)
            A.shot("14_multi_measure_modal")
            pg.locator("button").filter(has_text="三世代全景").first.click(); pg.wait_for_timeout(800)
            if pg.locator("#btnConfirmMultiMeasure").is_visible():  # 熱門組合若未自動套用，再按確認
                pg.click("#btnConfirmMultiMeasure")
            pg.wait_for_timeout(1500)
            A.shot("15_multi_measure_result", selector="#echartsViewport", max_w=900)
        except Exception as e:
            failed.append("multi_measure"); print("  ✗ 多指標", str(e)[:120])

        print("[10] 十一種圖型")
        atoms = [
            ("bar",      "jp_prefectures", [("x", "都道府縣"), ("y", "總人口(人)")]),
            ("line",     "jp_history",     []),
            ("dual",     "jp_prefectures", [("x", "都道府縣"), ("y", "總人口(人)")]),  # 雙軸圖會自動挑第二個度量當次軸
            ("geo",      "jp_prefectures", [("x", "都道府縣"), ("y", "高齡化率(%)")]),
            ("boxplot",  "jp_prefectures", [("x", "地方分區"), ("y", "高齡化率(%)")]),
            ("treemap",  "jp_prefectures", [("x", "都道府縣"), ("y", "總人口(人)"), ("color", "地方分區")]),
            ("scatter",  "jp_prefectures", [("x", "高齡化率(%)"), ("y", "外國人佔比(%)"), ("color", "地方分區")]),
            ("donut",    "jp_prefectures", [("x", "都道府縣"), ("y", "總人口(人)"), ("color", "地方分區")]),
            ("radar",    "jp_prefectures", [("x", "都道府縣"), ("y", "總人口(人)")]),
            ("funnel",   "jp_prefectures", [("x", "都道府縣"), ("y", "總人口(人)")]),
            ("violin",   "jp_prefectures", [("x", "地方分區"), ("y", "高齡化率(%)")]),
        ]
        for i, (kind, ds, assigns) in enumerate(atoms, 1):
            pg = A.fresh(ds, clear=bool(assigns))
            try:
                for shelf, name in assigns:
                    A.assign(shelf, name)
                A.chart(kind)
                pg.wait_for_timeout(1200)
                A.shot(f"atom_{i:02d}_{kind}", selector="#echartsViewport", max_w=760)
            except Exception as e:
                failed.append(f"atom_{kind}"); print(f"  ✗ atom {kind}: {str(e)[:120]}")

        print("[11] 工作表分頁、縮放")
        pg = A.fresh("jp_prefectures")
        pg.click("#btnDuplicateSheet"); pg.wait_for_timeout(600)
        pg.click("#btnZoomIn"); pg.wait_for_timeout(500)
        A.shot("16_tabs_zoom", clip=region(pg, ["#workbookTabsBar"], 6), max_w=1100)

        print("[12] 資料抽屜")
        pg = A.fresh("jp_prefectures")
        pg.click("#btnToggleDrawer"); pg.wait_for_timeout(600)
        pg.evaluate("() => { const e = document.querySelector('.stage-body'); e.scrollTo({top: e.scrollHeight}); }")
        pg.wait_for_timeout(700)
        A.shot("17_data_drawer", clip={"x": 320, "y": 420, "width": 1120, "height": 480}, max_w=1000)

        print("[13] 釘選與儀表板")
        pg = A.fresh("jp_prefectures")
        pg.click("#btnPinCurrentSheet"); pg.wait_for_timeout(500)
        A.fresh("jp_history"); pg = A.pg
        pg.click("#btnPinCurrentSheet"); pg.wait_for_timeout(500)
        pg.click("#btnOpenDashboardFromTabs"); pg.wait_for_timeout(1500)
        A.shot("18_dashboard")

        print("[14] 對話框：欄位分類、17 領域、簡報")
        pg = A.fresh("jp_prefectures")
        pg.click("#btnOpenSchemaModalDock"); pg.wait_for_timeout(1000); A.shot("19_schema_modal")
        pg = A.fresh("jp_prefectures")
        pg.click("#btnOpen17DomainsModalDock"); pg.wait_for_timeout(1000); A.shot("20_domains_modal")
        pg = A.fresh("jp_prefectures")
        try:
            pg.click("#btnToolsToggle"); pg.wait_for_timeout(400)
            pg.click("#btnOpenBriefingModal"); pg.wait_for_timeout(1200); A.shot("21_briefing_modal")
        except Exception as e:
            failed.append("briefing"); print("  ✗ 簡報", str(e)[:120])
        b.close()
    srv.shutdown()
    print("\n失敗項目：", failed or "無")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
