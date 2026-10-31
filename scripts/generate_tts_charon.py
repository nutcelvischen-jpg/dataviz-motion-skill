import os
import requests
import subprocess

API_KEY_PATH = "api_key.txt"
with open(API_KEY_PATH, "r") as f:
    api_key = f.read().strip()

OUT_DIR = "voice_charon"
os.makedirs(OUT_DIR, exist_ok=True)

# 旁白腳本（繁體中文，專業沉穩商業風格）
SCRIPTS = [
    {
        "id": "line_01",
        "text": "數據分析，不該浪費在繁瑣的格式調整上。拖入任何 Excel 檔案，瞬間完成自動維度識別與清洗。",
        "desc": "Scene 1: Hook & Drop (0 - 7s)"
    },
    {
        "id": "line_02",
        "text": "點擊即換。從離散體量到皮爾森相關矩陣，線性回歸與置信區間即刻計算，離群異象無所遁形。",
        "desc": "Scene 2: Switch to Scatter (7 - 15s)"
    },
    {
        "id": "line_03",
        "text": "轉化漏斗、多維雷達、結構佔比。七大商業圖表引擎隨選隨生，純前端本機運算，資料安全不出境。",
        "desc": "Scene 3: Multi-Chart & Security (15 - 23s)"
    },
    {
        "id": "line_04",
        "text": "一鍵導出印刷級高畫質圖表。Data Atoms，讓數據真正為決策說話。",
        "desc": "Scene 4: 1080p Export & Outro (23 - 30s)"
    }
]

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

print("All voiceover lines generated successfully!")
