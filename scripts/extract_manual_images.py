"""把 data_atoms_manual.html 內嵌的 base64 圖片抽成 assets/manual/step-NN.webp，讓 HTML 維持在 200 KB 以下。
重新產生手冊（見 docs/MANUAL_BUILD.md）之後執行：python3 scripts/extract_manual_images.py
"""
import base64, io, os, re
from PIL import Image

PAGE = 'data_atoms_manual.html'
OUT = 'assets/manual'

def main():
    html = open(PAGE, encoding='utf-8').read()
    os.makedirs(OUT, exist_ok=True)
    count = 0
    def repl(m):
        nonlocal count
        count += 1
        im = Image.open(io.BytesIO(base64.b64decode(m.group(2))))
        if im.mode in ('RGBA', 'P'):
            im = im.convert('RGB')
        if im.width > 1440:
            im = im.resize((1440, int(im.height * 1440 / im.width)))
        path = f'{OUT}/step-{count:02d}.webp'
        im.save(path, 'WEBP', quality=80)
        return path
    html = re.sub(r'data:image/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)', repl, html)
    html = re.sub(r'<img (?!loading=)', '<img loading="lazy" ', html)
    html = html.replace("img-src data:;", "img-src 'self' data:;")  # CSP 要允許同站圖片
    open(PAGE, 'w', encoding='utf-8').write(html)
    print(f'{count} 張圖片已抽出；HTML {len(html.encode()) // 1024} KB')

if __name__ == '__main__':
    main()
