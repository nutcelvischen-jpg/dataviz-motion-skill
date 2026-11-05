#!/usr/bin/env python3
"""
mix_strawberry_soundtrack_60s.py
為《草莓計數與 Token 盲區》60 秒短影音自動生成母帶音軌：
1. 使用 macOS 高品質臺灣繁體中文配音 (Meijia) 生成 4 幕旁白。
2. 以 NumPy 合成 120 BPM 科技律動襯樂 (Rhodes 和弦 + 靈動琶音)。
3. 實作智慧 Auto-Ducking 避讓 (-6dB)，在語音出現時自動壓低音樂。
4. 輸出 master_soundtrack_strawberry_60s.wav (44.1kHz, 16-bit 立體聲)。
"""

import os
import subprocess
import math
import numpy as np
import soundfile as sf

SR = 44100
DURATION = 60.0
TOTAL_SAMPLES = int(SR * DURATION)
BPM = 120.0
SPB = 60.0 / BPM  # 0.5s per beat

PROJECT_DIR = '/Users/chenchunchih/Desktop/數據視覺化'
FFMPEG = os.path.join(PROJECT_DIR, 'bin', 'ffmpeg')
OUT_WAV = os.path.join(PROJECT_DIR, 'master_soundtrack_strawberry_60s.wav')
VOICE_TEMP_DIR = os.path.join(PROJECT_DIR, 'voice_strawberry_temp')

os.makedirs(VOICE_TEMP_DIR, exist_ok=True)

VOICE_SCRIPTS = [
    (0, 0.5, "你有發現問AI：strawberry裡面有幾個r，它居然會數錯嗎？早期大語言模型脫口而出只有兩個！難道萬億參數的頂級AI，數數連小學生都不如？"),
    (1, 15.2, "這不是智商問題，而是感官盲區！人類眼睛是逐字掃描；但大模型根本看不到字母！分詞器查字典把它切成兩個大包裹，肚子裡有幾個r，它只能憑機率猜！"),
    (2, 30.2, "教你三招秒破盲區：第一，提示詞用空格拆開字母，強迫分詞器一字一切重獲視力；第二，讓AI寫Python代碼精確計算；第三，切換次世代思維模型自我逐字驗算！"),
    (3, 45.2, "記住：AI是機率切塊，不是光學掃描！遇到字元計算與繁體中文，善用工具才不會花冤枉錢。點擊連結，到我們的極簡實驗室，親自測測看！")
]

def generate_voiceovers():
    print("🎙 生成 4 幕繁體中文配音 (macOS Meijia)...")
    voice_track_left = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    voice_track_right = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    ducking_mask = np.ones(TOTAL_SAMPLES, dtype=np.float32)

    for idx, start_s, text in VOICE_SCRIPTS:
        aiff_file = os.path.join(VOICE_TEMP_DIR, f"vo_{idx}.aiff")
        wav_file = os.path.join(VOICE_TEMP_DIR, f"vo_{idx}.wav")

        # 生成語音 (速度 -r 210 字/分)
        subprocess.run(["say", "-v", "Meijia", "-r", "205", "-o", aiff_file, text], check=True)
        # 轉碼為 44.1kHz 立體聲 wav
        subprocess.run([FFMPEG, "-y", "-i", aiff_file, "-ar", "44100", "-ac", "2", wav_file],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

        data, _ = sf.read(wav_file)
        if len(data.shape) == 1:
            data = np.column_stack([data, data])

        s_idx = int(start_s * SR)
        e_idx = min(TOTAL_SAMPLES, s_idx + len(data))
        seg_len = e_idx - s_idx

        # 疊加人聲 (人聲音量 +1.5dB)
        voice_track_left[s_idx:e_idx] += data[:seg_len, 0] * 1.35
        voice_track_right[s_idx:e_idx] += data[:seg_len, 1] * 1.35

        # 標記 Ducking 區域 (人聲期間背景音壓低至 0.28，即 -11dB)
        pad = int(0.2 * SR)
        d_start = max(0, s_idx - pad)
        d_end = min(TOTAL_SAMPLES, e_idx + pad)
        ducking_mask[d_start:d_end] = 0.28

    return voice_track_left, voice_track_right, ducking_mask

def synthesize_music(ducking_mask):
    print("🎹 合成 120 BPM 輕快科技律動襯樂...")
    music_l = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    music_r = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

    # 4 幕和弦進程 (Fm9 -> Dbmaj7 -> Bbm7 -> Abadd9)
    chords = [
        (0.0, 15.0, [174.61, 261.63, 311.13, 349.23]),   # Fm9
        (15.0, 30.0, [138.59, 207.65, 261.63, 329.63]),  # Dbmaj7
        (30.0, 45.0, [116.54, 174.61, 233.08, 277.18]),  # Bbm7
        (45.0, 60.0, [207.65, 261.63, 311.13, 415.30])   # Abadd9
    ]

    for start_s, end_s, freqs in chords:
        s_idx = int(start_s * SR)
        e_idx = min(TOTAL_SAMPLES, int(end_s * SR))
        dur_samp = e_idx - s_idx
        t = np.linspace(start_s, end_s, dur_samp, endpoint=False)

        fade_len = int(0.15 * SR)
        env = np.ones(dur_samp, dtype=np.float32)
        if dur_samp > 2 * fade_len:
            env[:fade_len] = np.linspace(0, 1, fade_len)
            env[-fade_len:] = np.linspace(1, 0, fade_len)

        chord_val = np.zeros(dur_samp, dtype=np.float32)
        for f in freqs:
            tone = (
                0.55 * np.sin(2 * np.pi * f * t) +
                0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t % 1.0 * 2.0) +
                0.15 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t % 1.0 * 4.0)
            )
            chord_val += tone

        music_l[s_idx:e_idx] += chord_val * env * 0.16
        music_r[s_idx:e_idx] += chord_val * env * 0.16

    # 律動打擊鼓點 (Kick on 1 & 3, Hi-hat on 8th notes)
    for beat in range(int(DURATION * 2)):
        t_beat = beat * 0.5
        idx = int(t_beat * SR)
        # Kick
        if beat % 2 == 0:
            k_len = int(0.12 * SR)
            if idx + k_len < TOTAL_SAMPLES:
                kt = np.linspace(0, 0.12, k_len)
                kick = np.sin(2 * np.pi * (110 - 750 * kt) * kt) * np.exp(-kt * 32.0) * 0.22
                music_l[idx:idx+k_len] += kick
                music_r[idx:idx+k_len] += kick
        # Hi-hat
        hh_len = int(0.04 * SR)
        if idx + hh_len < TOTAL_SAMPLES:
            noise = (np.random.rand(hh_len).astype(np.float32) - 0.5) * 0.08
            music_l[idx:idx+hh_len] += noise
            music_r[idx:idx+hh_len] += noise

    # 平滑避讓濾波
    kernel_size = int(0.08 * SR)
    smooth_ducking = np.convolve(ducking_mask, np.ones(kernel_size)/kernel_size, mode='same')
    music_l *= smooth_ducking
    music_r *= smooth_ducking

    return music_l, music_r

def main():
    print("=== 開始製作《草莓計數與 Token 盲區》60 秒母帶音軌 ===")
    vo_l, vo_r, ducking = generate_voiceovers()
    mu_l, mu_r = synthesize_music(ducking)

    master_l = vo_l + mu_l
    master_r = vo_r + mu_r

    # Peak Normalization (-0.5 dB)
    peak = max(np.max(np.abs(master_l)), np.max(np.abs(master_r)))
    if peak > 0.95:
        master_l = (master_l / peak) * 0.94
        master_r = (master_r / peak) * 0.94

    master = np.column_stack([master_l, master_r])
    sf.write(OUT_WAV, master, SR, subtype='PCM_16')
    print(f"✅ 母帶音軌製作完成！輸出路徑: {OUT_WAV}")

if __name__ == '__main__':
    main()
