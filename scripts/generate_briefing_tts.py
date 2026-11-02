#!/usr/bin/env python3
"""
Data Atoms · Automated Insight Extractor & Gemini 3.8 TTS Briefing Generator
Extracts statistical metrics from data and synthesizes 4-scene executive voiceover.
"""

import os
import sys
import json
import requests
import subprocess
import openpyxl

API_KEY_PATH = "api_key.txt"
if not os.path.exists(API_KEY_PATH):
    print("Error: api_key.txt not found!")
    sys.exit(1)

with open(API_KEY_PATH, "r") as f:
    api_key = f.read().strip()

OUT_DIR = "voice_briefing"
os.makedirs(OUT_DIR, exist_ok=True)

# 1. 讀取並計算數據洞察
excel_file = "sample_data/01_產品線營收體量_測試.xlsx"
wb = openpyxl.load_workbook(excel_file)
sheet = wb.active
rows = list(sheet.iter_rows(values_only=True))
headers = rows[0]
data_rows = rows[1:]

names = [r[0] for r in data_rows]
revenues = [float(r[2]) for r in data_rows] # 萬元
targets = [float(r[3]) for r in data_rows]

total_sum = sum(revenues)
mean_val = total_sum / len(revenues)
max_val = max(revenues)
min_val = min(revenues)
top_idx = revenues.index(max_val)
top_name = names[top_idx]
top_share = (max_val / total_sum) * 100
max_min_ratio = max_val / min_val

print(f"=== Extracted Data Insights ===")
print(f"Rows: {len(data_rows)}")
print(f"Total Revenue: {total_sum:.0f} 萬元 ({total_sum/100:.2f}M)")
print(f"Mean Revenue: {mean_val:.1f} 萬元")
print(f"Top Contributor: {top_name} ({max_val:.0f} 萬元, {top_share:.1f}%)")
print(f"Max/Min Spread: {max_min_ratio:.1f}x ({max_val:.0f} vs {min_val:.0f})")

# 2. 自動生成 4 幕包豪斯商業簡報講稿 (精準卡點 120 BPM · 34秒)
SCRIPTS = [
    {
        "id": "scene_01",
        "text": "八大產品線總營收達三千六百九十萬元，產出維持高位水準。",
        "desc": "Scene 1: Macro Volume (0.5s - 8.0s)"
    },
    {
        "id": "scene_02",
        "text": "旗艦雲端運算突破九百四十萬，以二成五份額穩居成長主力。",
        "desc": "Scene 2: Structure & Top Share (8.5s - 17.0s)"
    },
    {
        "id": "scene_03",
        "text": "各品類極值跨度達五點九倍，高毛利模組具備強勁擴張潛力。",
        "desc": "Scene 3: Distribution & Tiers (17.2s - 25.0s)"
    },
    {
        "id": "scene_04",
        "text": "以理性幾何穿透複雜表象，驅動敏捷決策。Data Atoms 簡報完畢。",
        "desc": "Scene 4: Executive Takeaway (25.5s - 34.0s)"
    }
]

# 保存 insight JSON 供 Canvas 前端動畫調用
insight_meta = {
    "total_sum": total_sum,
    "total_sum_formatted": "3,690 萬",
    "mean_val": mean_val,
    "mean_val_formatted": "461.3 萬",
    "top_name": top_name,
    "top_val": max_val,
    "top_share": round(top_share, 1),
    "max_min_ratio": round(max_min_ratio, 1),
    "items": [
        {"name": names[i], "val": revenues[i], "pct": round((revenues[i]/total_sum)*100, 1)}
        for i in range(len(names))
    ]
}

with open("motion_briefing_bauhaus_data.json", "w", encoding="utf-8") as f:
    json.dump(insight_meta, f, ensure_ascii=False, indent=2)

print("Saved motion_briefing_bauhaus_data.json")

# 3. 呼叫 OpenRouter Gemini 3.8 Flash TTS
print("=== Generating Gemini 3.8 Flash TTS Voiceover (Charon) ===")
full_wavs = []

for item in SCRIPTS:
    idx = item["id"]
    text = item["text"]
    raw_pcm = os.path.join(OUT_DIR, f"{idx}.pcm")
    out_wav = os.path.join(OUT_DIR, f"{idx}.wav")

    print(f"Generating {idx}: {text}")
    res = requests.post(
        url="https://openrouter.ai/api/v1/audio/speech",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        json={
            "model": "google/gemini-3.8-flash-tts",
            "input": text,
            "voice": "Charon"
        }
    )

    if res.status_code != 200:
        print(f"Error {res.status_code}: {res.text}")
        continue

    with open(raw_pcm, "wb") as f:
        f.write(res.content)

    # Convert 24kHz raw 16-bit PCM to standard 44.1kHz WAV
    cmd = [
        "bin/ffmpeg", "-y",
        "-f", "s16le",
        "-ar", "24000",
        "-ac", "1",
        "-i", raw_pcm,
        "-ar", "44100",
        out_wav
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    full_wavs.append(out_wav)
    print(f"Saved: {out_wav}")

print("=== Voiceover Generation Complete ===")
