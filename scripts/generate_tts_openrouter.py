#!/usr/bin/env python3
"""
OpenRouter Gemini 3.8 Flash TTS Voiceover Generator
Voice: Leda (Youthful, Steady, Clear Female Voice)
Model: google/gemini-3.8-flash-tts
Target: 8 Data Analytics Atoms (45.0s)
"""

import os
import requests
import numpy as np
import soundfile as sf
import subprocess

PROJECT_DIR = '.'
API_KEY_FILE = os.path.join(PROJECT_DIR, 'api_key.txt')
VOICE_DIR = os.path.join(PROJECT_DIR, 'voice_gemini')
FFMPEG_PATH = os.path.join(PROJECT_DIR, 'bin', 'ffmpeg')

os.makedirs(VOICE_DIR, exist_ok=True)

with open(API_KEY_FILE, 'r') as f:
    api_key = f.read().strip()

VOICE_SCRIPTS = [
    (0, 0.3, "原始數據，只是一片混沌。"),
    (1, 4.3, "加入柱狀圖，橫向對比體量，一眼鎖定核心貢獻者。"),
    (2, 10.3, "疊加七日均線，消除雜訊，看清趨勢與成長拐點。"),
    (3, 16.3, "散點聚類與迴歸線，洞察相關性，警示異常離群值。"),
    (4, 22.3, "展開環形佔比圖，落實二八法則，拆解營收份額。"),
    (5, 28.3, "六維雷達圖全面體檢，打破盲區，精準診斷系統短板。"),
    (6, 34.3, "桑基圖梳理轉化，精準定位漏斗流失瓶頸與歸因。"),
    (7, 40.2, "好分析，是用圖表洞見趨勢，驅動確信的商業決策。")
]

def main():
    print("🎙 開始使用 OpenRouter Gemini 3.8 Flash TTS 生成繁體中文旁白 (Leda - 沈穩年輕女性)...")
    url = "https://openrouter.ai/api/v1/audio/speech"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://antigravity.google",
        "X-OpenRouter-Title": "DataViz Motion Studio"
    }

    for idx, start_s, text in VOICE_SCRIPTS:
        raw_pcm_path = os.path.join(VOICE_DIR, f"raw_{idx}.pcm")
        wav_raw_path = os.path.join(VOICE_DIR, f"raw_{idx}.wav")
        wav_final_path = os.path.join(VOICE_DIR, f"vo_{idx}.wav")

        print(f"\n[原子 {idx}] 發送 TTS 請求: '{text}' ...")
        resp = requests.post(url, headers=headers, json={
            "model": "google/gemini-3.8-flash-tts",
            "input": text,
            "voice": "Leda"
        }, timeout=35)

        if resp.status_code != 200:
            raise RuntimeError(f"OpenRouter TTS 錯誤: {resp.status_code} - {resp.text}")

        with open(raw_pcm_path, "wb") as f:
            f.write(resp.content)

        # Convert raw 24kHz s16le PCM to 44.1kHz WAV with atempo=1.2 for lively tech pacing
        # atempo filter keeps natural pitch while making the rhythm snappy
        cmd = [
            FFMPEG_PATH, "-y",
            "-f", "s16le", "-ar", "24000", "-ac", "1",
            "-i", raw_pcm_path,
            "-filter:a", "atempo=1.20",
            "-ar", "44100",
            wav_final_path
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

        data, sr = sf.read(wav_final_path)
        dur = len(data) / sr
        print(f"  ✅ 旁白 {idx} 生成成功！時長: {dur:.2f}s (預計於 {start_s}s 播放至 {start_s + dur:.2f}s)")

    print("\n🎉 所有 8 段語音旁白製作完成！")

if __name__ == '__main__':
    main()
