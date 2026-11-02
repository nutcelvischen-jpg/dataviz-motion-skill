#!/usr/bin/env python3
import shutil

portal_strip = """
<!-- 頂部官方入口指示橫條 -->
<div style="background: linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%); color: #ffffff; padding: 10px 48px; font-size: 13.5px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; z-index: 101; border-bottom: 1px solid rgba(255,255,255,0.15);">
  <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
    <span style="font-weight: 700;">🏛️ 日本政府官方統計入口網站：</span>
    <a href="https://www.e-stat.go.jp" target="_blank" style="background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.4); color: #fff; padding: 4px 12px; border-radius: 4px; text-decoration: none; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
      <span style="font-family: monospace;">https://www.e-stat.go.jp</span>
      <span>(點擊前往官網) ↗</span>
    </a>
  </div>
  <div style="display: flex; gap: 14px; align-items: center; font-size: 12px;">
    <span style="opacity: 0.9;">API 端點：<code style="background: rgba(0,0,0,0.25); padding: 2px 6px; border-radius: 3px; font-family: monospace;">api.e-stat.go.jp/rest/3.0/app</code></span>
    <button onclick="navigator.clipboard.writeText('https://www.e-stat.go.jp'); alert('已複製 e-Stat 官網網址！');" style="background: rgba(255,255,255,0.2); border: none; color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">複製官網網址</button>
  </div>
</div>
"""

# 1. Update estat_catalog_and_research_guide.html
catalog_path = "./estat_catalog_and_research_guide.html"
with open(catalog_path, "r", encoding="utf-8") as f:
    c_html = f.read()

if "<!-- 頂部官方入口指示橫條" not in c_html:
    c_html = c_html.replace("<body>", "<body>\n" + portal_strip, 1)
    # Add to nav
    if '<div class="nav-links">' in c_html:
        c_html = c_html.replace(
            '<div class="nav-links">',
            '<div class="nav-links">\n        <a href="https://www.e-stat.go.jp" target="_blank" class="nav-btn" style="background: #2563eb; color: #fff; border-color: #2563eb;">🌐 e-Stat 官網 ↗</a>\n        <a href="data_atoms.html" target="_blank" class="nav-btn" style="background: rgba(234, 88, 12, 0.08); border-color: #ea580c; color: #c2410c; font-weight: 700;">⚛️ Data Atoms</a>'
        )
    with open(catalog_path, "w", encoding="utf-8") as f:
        f.write(c_html)
    shutil.copyfile(catalog_path, "<LOCAL_PATH>/estat_catalog.html")
    print("Updated catalog guide!")

# 2. Update estat_api_tutorial_simulator.html
sim_path = "./estat_api_tutorial_simulator.html"
with open(sim_path, "r", encoding="utf-8") as f:
    s_html = f.read()

if "<!-- 頂部官方入口指示橫條" not in s_html:
    s_html = s_html.replace("<body>", "<body>\n" + portal_strip, 1)
    with open(sim_path, "w", encoding="utf-8") as f:
        f.write(s_html)
    shutil.copyfile(sim_path, "<LOCAL_PATH>/estat_tutorial.html")
    print("Updated simulator guide!")
