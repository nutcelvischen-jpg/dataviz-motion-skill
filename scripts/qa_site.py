#!/usr/bin/env python3
"""站台驗收（SITE_REDESIGN_SPEC §9；V2 調整：5 項導覽、4 步路線、數位乩童只在影片頁）。用法：python3 scripts/qa_site.py [--shots DIR]

需要 playwright（pip install playwright）與 Chrome／Chromium。
"""
import asyncio, glob, os, re, shutil, subprocess, sys, time, urllib.parse
from playwright.async_api import async_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PORT = 8897
PAGES = [
    'index.html', 'learn.html?lesson=01', 'learn.html?lesson=06', 'encyclopedia.html', 'lab.html',
    'concepts/overview.html', 'videos.html', 'workshop.html', 'skills.html',
    'curriculum_1105_workflow.html', 'student_data_analyst_workflow.html',
    'estat_api_tutorial_simulator.html', 'estat_catalog_and_research_guide.html', 'data_atoms.html',
    '00_課程手冊與即時看板/WORKSHOP_BOARD.html',
]
STEPS = ['student_data_analyst_workflow.html',
         'estat_api_tutorial_simulator.html', 'estat_catalog_and_research_guide.html', 'data_atoms.html']
APP_PAGES = {'data_atoms.html'}
BLUE = re.compile(r'#2563eb|#1e40af|#0284c7', re.I)
failures, passes = [], 0


def check(ok, msg):
    global passes
    if ok:
        passes += 1
    else:
        failures.append(msg)
        print('FAIL', msg)


def static_checks():
    # 3. 本地連結（網站主要頁面）
    scope = [f for f in glob.glob(os.path.join(ROOT, '*.html'))] + \
            glob.glob(os.path.join(ROOT, 'concepts', '*.html')) + glob.glob(os.path.join(ROOT, 'topics', '*.html')) + \
            glob.glob(os.path.join(ROOT, '00_課程手冊與即時看板', '*.html'))
    bad = []
    for f in scope:
        s = open(f, encoding='utf-8', errors='ignore').read()
        for h in re.findall(r'(?:href|src)="([^"]+)"', s):
            if re.match(r'(https?:|mailto:|javascript:|data:|#|//)', h):
                continue
            path = urllib.parse.unquote(h.split('#')[0].split('?')[0])
            if not path:
                continue
            if not os.path.exists(os.path.normpath(os.path.join(os.path.dirname(f), path))):
                bad.append((os.path.relpath(f, ROOT), h))
    check(not bad, f'壞連結 {len(bad)} 個：{bad[:6]}')

    for p in PAGES:
        f = os.path.join(ROOT, p.split('?')[0])
        s = open(f, encoding='utf-8').read()
        name = p.split('?')[0]
        # 6. 禁用字串
        if name not in APP_PAGES:
            check(not BLUE.search(s), f'{name} 仍有藍色色碼')
        check('fonts.googleapis.com' not in s, f'{name} 仍載入 Google Fonts')
        check('11/05' not in s, f'{name} 靜態寫死日期 11/05')
        # 8. 數位乩童：由 site-shell.js 在每一頁載入（瀏覽器檢查見 page_checks）
    # 7.
    idx = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    check(idx.count('style=') == 0, 'index.html 仍有 inline style')
    # 8b. 重複頁
    for stub in ('data_analysis.html', 'llm_lab.html'):
        check('http-equiv="refresh"' in open(os.path.join(ROOT, stub), encoding='utf-8').read(), f'{stub} 應為轉址頁')
    # 本地媒體沒留在根目錄
    check(not [x for x in os.listdir(ROOT) if x.endswith(('.mp4', '.wav'))], '根目錄仍有 mp4／wav')


async def page_checks(browser, shots):
    for vw, vh, tag in ((1440, 900, 'd'), (390, 844, 'm')):
        ctx = await browser.new_context(viewport={'width': vw, 'height': vh})
        for p in PAGES:
            page = await ctx.new_page()
            errs = []
            page.on('pageerror', lambda e: errs.append(str(e)[:120]))
            page.on('console', lambda m: errs.append(m.text[:120]) if m.type == 'error' else None)
            await page.goto(f'http://127.0.0.1:{PORT}/{p}', wait_until='networkidle')
            await page.wait_for_timeout(400)
            name = p.split('?')[0]
            # 1. 無水平捲動
            sw = await page.evaluate('document.documentElement.scrollWidth')
            check(sw <= vw, f'[{tag}] {p} 水平溢出 {sw}>{vw}')
            # 2. 無錯誤
            ignorable = [e for e in errs if 'favicon' in e or 'ERR_' in e]
            check(len(errs) == len(ignorable), f'[{tag}] {p} console 錯誤：{errs[:2]}')
            # 4. 頁首
            n_hdr = await page.locator('.site-header').count()
            check(n_hdr == 1, f'[{tag}] {p} .site-header 數量 {n_hdr}')
            if name not in APP_PAGES:
                n_cur = await page.locator('.site-header .sh-nav a[aria-current="page"]').count()
                check(n_cur == 1, f'[{tag}] {p} 導覽 aria-current 數量 {n_cur}')
            # 5. 主要按鈕
            n_btn = await page.locator('.btn-primary:visible, .button-primary:visible').count()
            check(n_btn <= 1, f'[{tag}] {p} 可見主要按鈕 {n_btn} 顆')
            # 9. stepper 與 prev/next
            if name in STEPS and name not in APP_PAGES:
                check(await page.locator('[data-stepper]').count() == 1, f'[{tag}] {p} 缺少步驟列')
                i = STEPS.index(name)
                hrefs = await page.locator('.step-pager a').evaluate_all('els=>els.map(e=>e.getAttribute("href"))')
                want = ([STEPS[i - 1]] if i > 0 else []) + [STEPS[i + 1]]
                check(hrefs == want, f'[{tag}] {p} prev/next {hrefs} != {want}')
            if shots and name in ('index.html', 'workshop.html', 'data_atoms.html') and p.endswith('.html'):
                await page.screenshot(path=os.path.join(shots, f'{tag}_{name.replace("/", "_")}.png'))
            await page.close()
        await ctx.close()

    # 11. 鍵盤：從頁首 Tab 能依序走到四個導覽項目，焦點有外框
    ctx = await browser.new_context(viewport={'width': 1440, 'height': 900})
    page = await ctx.new_page()
    await page.goto(f'http://127.0.0.1:{PORT}/index.html', wait_until='networkidle')
    seen = []
    for _ in range(8):
        await page.keyboard.press('Tab')
        info = await page.evaluate('''()=>{const e=document.activeElement;const cs=getComputedStyle(e);return {t:e.textContent.trim().slice(0,10),nav:!!e.closest('.sh-nav'),o:cs.outlineStyle}}''')
        if info['nav']:
            seen.append(info['t'])
            check(info['o'] != 'none', f'焦點無外框：{info}')
    check(seen == ['跟著學', '查概念', '做實驗', '看影片', '工作坊'], f'Tab 順序不符：{seen}')
    await ctx.close()

    # 12. 進度 → 「繼續第 0N 站」
    ctx = await browser.new_context(viewport={'width': 1440, 'height': 900})
    page = await ctx.new_page()
    await page.goto(f'http://127.0.0.1:{PORT}/index.html', wait_until='networkidle')
    key = await page.evaluate('()=>Object.keys(localStorage).find(k=>k==="llm_learning_progress_v1")||"llm_learning_progress_v1"')
    await page.evaluate('''k=>localStorage.setItem(k, JSON.stringify({version:1,lastVisitedLessonId:"02",startedLessonIds:["01","02"],completedLessonIds:["01","02"],quizPassedLessonIds:["01","02"],updatedAt:null}))''', key)
    await page.reload(wait_until='networkidle')
    txt = (await page.locator('#start-learning').inner_text()).strip()
    check('繼續第 03 站' in txt, f'進度按鈕文字：{txt!r}')
    await ctx.close()

    # 一鍵複製
    ctx = await browser.new_context(viewport={'width': 1440, 'height': 900}, permissions=['clipboard-read', 'clipboard-write'])
    page = await ctx.new_page()
    await page.goto(f'http://127.0.0.1:{PORT}/00_課程手冊與即時看板/WORKSHOP_BOARD.html', wait_until='networkidle')
    await page.locator('[data-copy]').first.click()
    await page.wait_for_timeout(200)
    label = await page.locator('[data-copy]').first.inner_text()
    check('已複製' in label, f'複製按鈕回饋：{label!r}')
    clip = await page.evaluate('navigator.clipboard.readText()')
    check(len(clip) > 50, '剪貼簿內容太短')
    await ctx.close()


async def main():
    shots = None
    if '--shots' in sys.argv:
        shots = sys.argv[sys.argv.index('--shots') + 1]
        os.makedirs(shots, exist_ok=True)
    static_checks()
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT)], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    try:
        async with async_playwright() as p:
            exe = next((x for x in (shutil.which('google-chrome'), shutil.which('chromium'), shutil.which('chromium-browser')) if x), None)
            browser = await p.chromium.launch(executable_path=exe, args=['--no-sandbox']) if exe else await p.chromium.launch()
            await page_checks(browser, shots)
            await browser.close()
    finally:
        srv.terminate()
    print(f'\n通過 {passes} 項，失敗 {len(failures)} 項')
    sys.exit(1 if failures else 0)


asyncio.run(main())
