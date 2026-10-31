#!/usr/bin/env python3
"""
OpenRouter Gemini 3.8 Flash TTS Voiceover Generator for Antigravity Skill Tutorial (70s)
Voice: Leda (Youthful, energetic, friendly female voice)
"""

import os
import requests
import subprocess
import soundfile as sf

PROJECT_DIR = '/Users/chenchunchih/Desktop/數據視覺化'
API_KEY_FILE = os.path.join(PROJECT_DIR, 'api_key.txt')
VOICE_DIR = os.path.join(PROJECT_DIR, 'voice_skill_70s')
FFMPEG_PATH = os.path.join(PROJECT_DIR, 'bin', 'ffmpeg')

os.makedirs(VOICE_DIR, exist_ok=True)

with open(API_KEY_FILE, 'r') as f:
    api_key = f.read().strip()

url = "https://openrouter.ai/api/v1/audio/speech"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
    "HTTP-Referer": "https://antigravity.google",
    "X-OpenRouter-Title": "Antigravity Skill Tutorial"
}

# 5 scenes, total 70.0s
VOICE_SCRIPTS = [
    # Scene 0 (00-10s): slot 0.3s -> 9.5s (dur ~ 8.5s)
    (0, 0.4, "嗨大家！每次讓 AI 幫你做事，都要重新打一大段指令和規則，是不是超心累？今天教你 Antigravity 的靈魂黑科技——Skill，把你的工作 SOP 直接封裝成一鍵外掛！"),
    # Scene 1 (10-22s): slot 10.3s -> 21.5s (dur ~ 10.5s)
    (1, 10.4, "Skill 到底是什麼？它其實就是一個放有 SKILL.md 的小資料夾！最神的地方是漸進式載入：平常它不佔你的記憶體空間，只有當你下達相關任務，AI 就會一秒讀懂全套手冊！"),
    # Scene 2 (22-42s): slot 22.3s -> 41.5s (dur ~ 18.0s)
    (2, 22.4, "怎麼做呢？你甚至不用手動開資料夾！直接對 Antigravity 說：『把剛剛驗算 Excel 的流程做成 Skill！』看！AI 會自動建立目錄、寫好規則邊界，連輔助的 Python 腳本都幫你自動放進去！"),
    # Scene 3 (42-58s): slot 42.3s -> 57.5s (dur ~ 14.5s)
    (3, 42.4, "做完之後怎麼用？超神奇！丟進一份雜亂報表，只要隨口說一句：『幫我對帳』，AI 就會自動喚醒剛做好的 Skill，完全照你的標準格式秒速清洗、自動驗算，成果直接交付！"),
    # Scene 4 (58-70s): slot 58.3s -> 69.5s (dur ~ 10.5s)
    (4, 58.4, "學會做 Skill，你就不用再當重複打字的打工族，而是升級成打造專屬 AI 團隊的架構師！今天就開啟 Antigravity，封裝你的第一個專屬技能吧！")
]

def main():
    print("🎙 開始使用 OpenRouter Gemini 3.8 Flash TTS 生成 Skill 手把手教學配音 (Leda)...")
    
    for idx, start_s, text in VOICE_SCRIPTS:
        raw_pcm_path = os.path.join(VOICE_DIR, f"raw_{idx}.pcm")
        wav_final_path = os.path.join(VOICE_DIR, f"vo_{idx}.wav")

        print(f"\n[段落 {idx+1}/5] 請求: '{text[:25]}' ...")
        resp = requests.post(url, headers=headers, json={
            "model": "google/gemini-3.8-flash-tts",
            "input": text,
            "voice": "Leda"
        }, timeout=35)

        if resp.status_code != 200:
            raise RuntimeError(f"OpenRouter TTS 錯誤: {resp.status_code} - {resp.text}")

        with open(raw_pcm_path, "wb") as f:
            f.write(resp.content)

        # Convert raw PCM to WAV first
        temp_wav = os.path.join(VOICE_DIR, f"temp_{idx}.wav")
        subprocess.run([
            FFMPEG_PATH, "-y",
            "-f", "s16le", "-ar", "24000", "-ac", "1",
            "-i", raw_pcm_path,
            temp_wav
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

        raw_info = sf.info(temp_wav)
        raw_dur = raw_info.duration

        # Determine target duration and speed
        # Scene 0: target ~8.5s
        # Scene 1: target ~10.5s
        # Scene 2: target ~18.0s
        # Scene 3: target ~14.5s
        # Scene 4: target ~10.5s
        targets = [8.5, 10.5, 18.0, 14.5, 10.5]
        target_dur = targets[idx]
        speed = max(1.15, min(1.35, raw_dur / target_dur))

        subprocess.run([
            FFMPEG_PATH, "-y",
            "-i", temp_wav,
            "-filter:a", f"atempo={speed:.3f}",
            "-ar", "44100", "-ac", "2",
            wav_final_path
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

        if os.path.exists(temp_wav):
            os.remove(temp_wav)

        final_info = sf.info(wav_final_path)
        print(f"  -> 生成音檔: {wav_final_path} (原始: {raw_dur:.2f}s, 變速: {speed:.3f}x, 最終: {final_info.duration:.2f}s)")

    print("\n🎉 Skill 手把手教學 5 段配音全數生成完畢！")

if __name__ == "__main__":
    main()
