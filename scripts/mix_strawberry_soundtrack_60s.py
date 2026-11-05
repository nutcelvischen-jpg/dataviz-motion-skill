#!/usr/bin/env python3
"""
mix_strawberry_soundtrack_60s.py
極簡高階清襯樂版母帶音軌製作：
1. 徹底移除刺耳合成鼓點與吵雜白噪音。
2. 使用 OpenRouter Gemini 3.8 Flash TTS（Leda 女性沉穩年輕音色）作為唯一主角。
3. 採用 Earshot 原生微觸感音效（cut_hit_air, click_thock, drip_plink）精準卡點。
4. 導入 84 BPM 極簡空氣感清襯樂（Focused Ambient Bed），人聲時避讓至 -34dB，極致溫潤不喧賓奪主。
5. 輸出 master_soundtrack_strawberry_60s.wav (44.1kHz, 16-bit 立體聲)。
"""

import os
import subprocess
import requests
import numpy as np
import soundfile as sf

SR = 44100
DURATION = 60.0
TOTAL_SAMPLES = int(SR * DURATION)

PROJECT_DIR = '/Users/chenchunchih/Desktop/數據視覺化'
OPR_KEY_FILE = os.path.join(PROJECT_DIR, 'OPR-KEY.txt')
FFMPEG = os.path.join(PROJECT_DIR, 'bin', 'ffmpeg')
OUT_WAV = os.path.join(PROJECT_DIR, 'master_soundtrack_strawberry_60s.wav')
VOICE_TEMP_DIR = os.path.join(PROJECT_DIR, 'voice_strawberry_leda')
SFX_DIR = os.path.join(PROJECT_DIR, 'earshot_sfx')
CLEAN_BED_WAV = os.path.join(PROJECT_DIR, 'music_focused_60s.wav')

os.makedirs(VOICE_TEMP_DIR, exist_ok=True)

with open(OPR_KEY_FILE, 'r', encoding='utf-8') as f:
    raw_key = f.read().strip()
    api_key = raw_key.split()[0].strip()

VOICE_SCRIPTS = [
    (0, 0.5, "問AI：strawberry裡面有幾個r？早期模型竟回答只有兩個！難道頂級AI，屬數連小學生都不如？"),
    (1, 15.2, "這不是智商問題，而是感官盲區！人類逐字看，大模型卻被分詞器切成兩個包裹，肚子裡幾個r，只能靠機率猜！"),
    (2, 30.2, "三招秒破盲區：第一，用空格拆開字母強迫重獲視力；第二，呼叫Python代碼精確計算；第三，切換思維模型自我驗算！"),
    (3, 45.2, "記住：AI是機率切塊，不是光學掃描！遇到字元計算務必善用工具。點擊下方連結，現在就親手測測看！")
]

def load_or_generate_voiceovers():
    print("🎙 載入或生成 OpenRouter Gemini 3.8 Flash TTS 旁白 (Leda - 沈穩年輕女性)...")
    url = "https://openrouter.ai/api/v1/audio/speech"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nutcelvischen-jpg.github.io/dataviz-motion-skill/",
        "X-OpenRouter-Title": "LLM Learning Map Video"
    }

    voice_track_left = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    voice_track_right = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    ducking_mask = np.ones(TOTAL_SAMPLES, dtype=np.float32)

    for idx, start_s, text in VOICE_SCRIPTS:
        pcm_path = os.path.join(VOICE_TEMP_DIR, f"raw_{idx}.pcm")
        wav_path = os.path.join(VOICE_TEMP_DIR, f"vo_{idx}.wav")

        if not os.path.exists(wav_path):
            print(f"  [幕 {idx + 1}] 呼叫 OpenRouter TTS: '{text[:18]}...'")
            resp = requests.post(url, headers=headers, json={
                "model": "google/gemini-3.8-flash-tts",
                "input": text,
                "voice": "Leda"
            }, timeout=35)

            if resp.status_code != 200:
                raise RuntimeError(f"OpenRouter TTS 錯誤: {resp.status_code} - {resp.text}")

            with open(pcm_path, "wb") as f:
                f.write(resp.content)

            cmd = [
                FFMPEG, "-y",
                "-f", "s16le", "-ar", "24000", "-ac", "1",
                "-i", pcm_path,
                "-filter:a", "atempo=1.12",
                "-ar", "44100", "-ac", "2",
                wav_path
            ]
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

        data, sr = sf.read(wav_path)
        dur = len(data) / sr
        print(f"  ✅ 幕 {idx + 1} 旁白載入成功 (時長: {dur:.2f}s)")

        s_idx = int(start_s * SR)
        e_idx = min(TOTAL_SAMPLES, s_idx + len(data))
        seg_len = e_idx - s_idx

        # 人聲飽滿清晰 (+2.2 dB)
        voice_track_left[s_idx:e_idx] += data[:seg_len, 0] * 1.50
        voice_track_right[s_idx:e_idx] += data[:seg_len, 1] * 1.50

        # 人聲時背景清襯樂極度微弱 (-34dB，係數 0.02)
        pad = int(0.3 * SR)
        d_start = max(0, s_idx - pad)
        d_end = min(TOTAL_SAMPLES, e_idx + pad)
        ducking_mask[d_start:d_end] = 0.02

    return voice_track_left, voice_track_right, ducking_mask

def load_resampled_sfx(name, target_sr=44100):
    raw_path = os.path.join(SFX_DIR, name)
    out_path = os.path.join(VOICE_TEMP_DIR, f"resamp_{name}")
    if not os.path.exists(out_path):
        cmd = [FFMPEG, "-y", "-i", raw_path, "-ar", str(target_sr), "-ac", "2", out_path]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    d, _ = sf.read(out_path)
    return d

def apply_earshot_sfx():
    print("🎧 加入 Earshot 輕觸感微音效點綴...")
    sfx_l = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    sfx_r = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

    hit_air = load_resampled_sfx("cut_hit_air.wav")      # 輕柔氣流轉場
    thock = load_resampled_sfx("click_thock.wav")        # 清脆機械微點擊
    snap = load_resampled_sfx("click_snap.wav")          # 俐落切塊吸附音
    plink = load_resampled_sfx("drip_plink.wav")         # 空靈水滴頓悟音

    # SFX 關鍵時間戳 (低音量點綴，乾淨不干擾)
    sfx_events = [
        (0.1, hit_air, 0.18),    # 開場氣流登場
        (6.5, thock, 0.22),      # 早期模型答錯蓋章
        (15.0, hit_air, 0.20),   # 幕 2 轉場
        (18.2, snap, 0.25),      # BPE 切塊包裹出現
        (30.0, hit_air, 0.20),   # 幕 3 轉場
        (32.5, plink, 0.22),     # 招式 1
        (36.8, plink, 0.22),     # 招式 2
        (41.0, plink, 0.22),     # 招式 3
        (45.0, hit_air, 0.20),   # 幕 4 轉場
        (52.5, thock, 0.25)      # CTA 按鈕呼吸點擊
    ]

    for t_sec, audio_data, gain in sfx_events:
        idx = int(t_sec * SR)
        e_idx = min(TOTAL_SAMPLES, idx + len(audio_data))
        length = e_idx - idx
        sfx_l[idx:e_idx] += audio_data[:length, 0] * gain
        sfx_r[idx:e_idx] += audio_data[:length, 1] * gain

    return sfx_l, sfx_r

def load_clean_bed(ducking_mask):
    print("🎵 載入 84 BPM 空氣感極簡清襯樂 (Focused Ambient Bed)...")
    if not os.path.exists(CLEAN_BED_WAV):
        cmd = [FFMPEG, "-y", "-i", os.path.join(PROJECT_DIR, "curriculum_statechart_video/work/audio/music.wav"),
               "-ar", "44100", "-ac", "2", "-t", "60.0", CLEAN_BED_WAV]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

    bed, _ = sf.read(CLEAN_BED_WAV)
    bed_l = bed[:TOTAL_SAMPLES, 0]
    bed_r = bed[:TOTAL_SAMPLES, 1]

    # 平滑避讓：說話時幾乎無聲 (-34dB)，無語音空檔才升至極低環境底色 (-24dB，係數 0.065)
    kernel_size = int(0.12 * SR)
    smooth_ducking = np.convolve(ducking_mask, np.ones(kernel_size)/kernel_size, mode='same')
    
    # 整體襯樂音量大幅降到 0.065，徹底消除吵雜感
    base_gain = 0.065
    bed_l = bed_l * smooth_ducking * base_gain
    bed_r = bed_r * smooth_ducking * base_gain

    return bed_l, bed_r

def main():
    print("=== 開始製作《草莓計數與 Token 盲區》清透高質感母帶音軌 ===")
    vo_l, vo_r, ducking = load_or_generate_voiceovers()
    sfx_l, sfx_r = apply_earshot_sfx()
    bed_l, bed_r = load_clean_bed(ducking)

    # 混音總成：清晰人聲 (主角) + Earshot 微觸感音效 + 極致低音量空氣清襯樂
    master_l = vo_l + sfx_l + bed_l
    master_r = vo_r + sfx_r + bed_r

    # Peak Normalization (-0.5 dB)
    peak = max(np.max(np.abs(master_l)), np.max(np.abs(master_r)))
    if peak > 0.95:
        master_l = (master_l / peak) * 0.94
        master_r = (master_r / peak) * 0.94

    master = np.column_stack([master_l, master_r])
    sf.write(OUT_WAV, master, SR, subtype='PCM_16')
    print(f"\n🎉 吵雜聲已完全移除！清透版母帶音軌生成完成: {OUT_WAV}")

if __name__ == '__main__':
    main()
