#!/usr/bin/env python3
"""
OpenRouter Gemini 3.8 Flash TTS Voiceover Generator for Antigravity Beginner Guide (60s)
Voice: Leda (Youthful, energetic, clear and approachable female voice)
"""

import os
import requests
import subprocess
import soundfile as sf

PROJECT_DIR = '.'
API_KEY_FILE = os.path.join(PROJECT_DIR, 'api_key.txt')
VOICE_DIR = os.path.join(PROJECT_DIR, 'voice_guide_60s')
FFMPEG_PATH = os.path.join(PROJECT_DIR, 'bin', 'ffmpeg')

os.makedirs(VOICE_DIR, exist_ok=True)

with open(API_KEY_FILE, 'r') as f:
    api_key = f.read().strip()

url = "https://openrouter.ai/api/v1/audio/speech"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
    "HTTP-Referer": "https://antigravity.google",
    "X-OpenRouter-Title": "Antigravity Beginner Guide"
}

VOICE_SCRIPTS = [
    (0, 0.4, "哈囉！還在把 AI 當成只會聊天的機器人嗎？今天帶大家認識 Google 最強的 AI 助手 Antigravity，教你一秒開啟全自動外掛！"),
    (1, 10.2, "首先是超神的 /browser！別再手動複製貼上了，AI 會自己開瀏覽器、查資料、下載報表，還能點擊測試網頁，就像請了位跑腿助理！"),
    (2, 20.2, "遇到看不懂的複雜公式或深奧統計？只要打出 /boost，AI 馬上開啟多步深思模式，反覆推理驗算，徹底告別瞎掰與胡說八道！"),
    (3, 30.2, "不想熬夜盯螢幕？下達 /goal 終極目標，AI 就會自己抓蟲、改代碼、跑批分析，甚至改到全部通過為止，睡一覺起來專案就做好了！"),
    (4, 40.2, "還有厲害的 MCP 萬用接頭！它能讓 AI 直接連進你的 Google Drive、自動改 Sheets 表格、還能幫你寄 Gmail，手腳直接全開！"),
    (5, 50.2, "最後，只要把流程打包成 Skill，加上 Artifacts，連程式碼都不用寫，就能秒產互動儀表板與短片！快一起來解鎖你的 AI 工作流吧！")
]

def main():
    print("🎙 開始使用 OpenRouter Gemini 3.8 Flash TTS 生成活潑女性解說 (Leda)...")
    
    for idx, start_s, text in VOICE_SCRIPTS:
        raw_pcm_path = os.path.join(VOICE_DIR, f"raw_{idx}.pcm")
        wav_final_path = os.path.join(VOICE_DIR, f"vo_{idx}.wav")

        print(f"\n[段落 {idx}] 請求: '{text}' ...")
        resp = requests.post(url, headers=headers, json={
            "model": "google/gemini-3.8-flash-tts",
            "input": text,
            "voice": "Leda"
        }, timeout=35)

        if resp.status_code != 200:
            raise RuntimeError(f"OpenRouter TTS 錯誤: {resp.status_code} - {resp.text}")

        with open(raw_pcm_path, "wb") as f:
            f.write(resp.content)

        # Tempo adjustment: atempo=1.20 for lively, upbeat pacing
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
        print(f"  ✅ 段落 {idx} 生成成功！時長: {dur:.2f}s (排定於 {start_s}s 播至 {start_s + dur:.2f}s)")

    print("\n🎉 全部 6 段活潑女聲旁白製作完成！")

if __name__ == '__main__':
    main()
