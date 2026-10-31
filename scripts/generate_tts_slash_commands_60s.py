#!/usr/bin/env python3
"""
OpenRouter Gemini 3.8 Flash TTS Voiceover Generator for Antigravity 10 Slash Commands Showcase (60s)
Voice: Leda (Youthful, lively, friendly female voice)
"""

import os
import requests
import subprocess
import soundfile as sf

PROJECT_DIR = '/Users/chenchunchih/Desktop/數據視覺化'
API_KEY_FILE = os.path.join(PROJECT_DIR, 'api_key.txt')
VOICE_DIR = os.path.join(PROJECT_DIR, 'voice_slash_60s')
FFMPEG_PATH = os.path.join(PROJECT_DIR, 'bin', 'ffmpeg')

os.makedirs(VOICE_DIR, exist_ok=True)

with open(API_KEY_FILE, 'r') as f:
    api_key = f.read().strip()

url = "https://openrouter.ai/api/v1/audio/speech"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
    "HTTP-Referer": "https://antigravity.google",
    "X-OpenRouter-Title": "Antigravity Slash Commands Showcase"
}

# 10 snappy segments, timed for ~5.0 - 5.4s each (in 6.0s intervals)
VOICE_SCRIPTS = [
    (0, 0.2, "第一招斜線 plan！面對複雜大專案，它先當你的戰略架構師，分步拆解執行藍圖，謀定而後動！"),
    (1, 6.2, "第二招斜線 grill me！AI 瞬間化身魔鬼面試官，主動靈魂拷問需求盲點，把企劃推向極致！"),
    (2, 12.2, "第三招斜線 browser！像真人一樣打開瀏覽器，自動搜尋點擊、破解分頁抓報表、秒速填表！"),
    (3, 18.2, "第四招斜線 boost！啟動深度推理學霸大腦，多角度推演、代碼交叉驗算，徹底根除數字幻覺！"),
    (4, 24.2, "第五招斜線 schedule！貼心排程小鬧鐘，設定每小時抓資料、每早寄晨報，全自動定時循環！"),
    (5, 30.2, "第六招斜線 goal！下班放空去，AI 連夜自主除錯跑測試，直到目標百分之百達成，醒來收割！"),
    (6, 36.2, "第七招斜線 btw！做大專案時想隨口問個小問題？像傳小紙條一樣，完全不干擾主任務脈絡！"),
    (7, 42.2, "第八招斜線 teamwork！一鍵召喚多位智慧代理特遣隊，各司其職分工協作，戰力翻倍爆發！"),
    (8, 48.2, "第九招斜線 compact！對話太長記憶體快滿了？一鍵智慧瘦身壓縮上下文，對話依然輕盈如飛！"),
    (9, 54.2, "第十招斜線 learn！教過一次的默契永久記住，十招全掌握，讓 Antigravity 成為最強副手！")
]

def main():
    print("🎙 開始使用 OpenRouter Gemini 3.8 Flash TTS 生成 10 大斜線指令解說 (Leda)...")
    
    for idx, start_s, text in VOICE_SCRIPTS:
        raw_pcm_path = os.path.join(VOICE_DIR, f"raw_{idx}.pcm")
        wav_final_path = os.path.join(VOICE_DIR, f"vo_{idx}.wav")

        print(f"\n[{idx+1}/10] 請求: '{text[:22]}' ...")
        resp = requests.post(url, headers=headers, json={
            "model": "google/gemini-3.8-flash-tts",
            "input": text,
            "voice": "Leda"
        }, timeout=35)

        if resp.status_code != 200:
            raise RuntimeError(f"OpenRouter TTS 錯誤: {resp.status_code} - {resp.text}")

        with open(raw_pcm_path, "wb") as f:
            f.write(resp.content)

        # Tempo adjustment: atempo=1.24 to ensure snappy pace < 5.4s
        cmd = [
            FFMPEG_PATH, "-y",
            "-f", "s16le", "-ar", "24000", "-ac", "1",
            "-i", raw_pcm_path,
            "-filter:a", "atempo=1.24",
            "-ar", "44100", "-ac", "2",
            wav_final_path
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

        info = sf.info(wav_final_path)
        print(f"  -> 生成音檔: {wav_final_path} (時長: {info.duration:.2f}s, 目標: < 5.5s)")

    print("\n🎉 10 大斜線指令配音全數生成完畢！")

if __name__ == "__main__":
    main()
