#!/usr/bin/env python3
"""
OpenRouter Gemini 3.8 Flash TTS Voiceover Generator for 60s Boss Report
Target: 60.0s Executive Workflow Presentation
Voice: Charon (Confident, Professional, Clear Male Executive Tone)
"""

import os
import requests
import subprocess
import soundfile as sf

PROJECT_DIR = '/Users/chenchunchih/Desktop/數據視覺化'
API_KEY_FILE = os.path.join(PROJECT_DIR, 'api_key.txt')
VOICE_DIR = os.path.join(PROJECT_DIR, 'voice_boss_60s')
FFMPEG_PATH = os.path.join(PROJECT_DIR, 'bin', 'ffmpeg')

os.makedirs(VOICE_DIR, exist_ok=True)

with open(API_KEY_FILE, 'r') as f:
    api_key = f.read().strip()

url = "https://openrouter.ai/api/v1/audio/speech"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
    "HTTP-Referer": "https://antigravity.google",
    "X-OpenRouter-Title": "DataViz Motion Boss Report"
}

# 6 Segments for 60 Seconds:
# 00-10s, 10-20s, 20-30s, 30-40s, 40-50s, 50-60s
VOICE_SCRIPTS = [
    (0, 0.5, "老闆、各位主管，今天我不只是學會問 AI，而是為我們業務打造了全套自動化 AI 工作流！"),
    (1, 10.2, "第一步，面對雜亂的業務報表，AI 秒速清洗缺失值，並啟動交叉驗算，細項加總精準勾稽，告別數字幻覺。"),
    (2, 20.2, "第二步，我把繁瑣的公文審核、專案回饋與會議待辦，結構化封裝成三套專屬 Skill，讓重複性流程一鍵運行。"),
    (3, 30.2, "第三步，透過 Antigravity，不用寫一行程式碼，就搭建出離線互動式數據儀表板，機敏資料完全不出本機。"),
    (4, 40.2, "第四步，透過 MCP 協議直連 Google 雲端生態系，自動同步 Drive、Sheets 與 Gmail，徹底打破資料孤島。"),
    (5, 50.2, "最後，所有分析洞察全自動渲染成專業動態短片！從資料到成果交付，為團隊建立全新的生產力閉環！")
]

def main():
    print("🎙 開始使用 OpenRouter Gemini 3.8 Flash TTS 生成 60 秒向主管報告旁白 (Charon)...")
    
    for idx, start_s, text in VOICE_SCRIPTS:
        raw_pcm_path = os.path.join(VOICE_DIR, f"raw_{idx}.pcm")
        wav_final_path = os.path.join(VOICE_DIR, f"vo_{idx}.wav")

        print(f"\n[段落 {idx}] 請求: '{text}' ...")
        resp = requests.post(url, headers=headers, json={
            "model": "google/gemini-3.8-flash-tts",
            "input": text,
            "voice": "Charon"
        }, timeout=35)

        if resp.status_code != 200:
            raise RuntimeError(f"OpenRouter TTS 錯誤: {resp.status_code} - {resp.text}")

        with open(raw_pcm_path, "wb") as f:
            f.write(resp.content)

        # Tempo adjustment: atempo=1.18 to keep crisp, confident delivery within ~8-9s per section
        cmd = [
            FFMPEG_PATH, "-y",
            "-f", "s16le", "-ar", "24000", "-ac", "1",
            "-i", raw_pcm_path,
            "-filter:a", "atempo=1.18",
            "-ar", "44100",
            wav_final_path
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

        data, sr = sf.read(wav_final_path)
        dur = len(data) / sr
        print(f"  ✅ 段落 {idx} 生成成功！時長: {dur:.2f}s (排定於 {start_s}s 播至 {start_s + dur:.2f}s)")

    print("\n🎉 全部 6 段語音旁白製作完成！")

if __name__ == '__main__':
    main()
