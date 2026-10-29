#!/usr/bin/env python3
"""
Master Audio Mixer for Data Analytics Atoms (45.0s)
Combines:
1. Traditional Chinese Voiceover (Meijia Taiwanese Natural Voice)
2. Earshot Code-Synthesized Sound Bank Effects (click_thock, cut_hit_sub, drip_plink, etc.)
3. Procedural 120 BPM Background Music Bed with Auto-Ducking
Output: master_soundtrack_45s.wav (44100 Hz, 16-bit Stereo)
"""

import os
import subprocess
import wave
import struct
import math
import numpy as np
import soundfile as sf

BASE_DIR = '/Users/chenchunchih/.gemini/antigravity/scratch/dataviz-motion-atoms-45s'
VOICE_DIR = os.path.join(BASE_DIR, 'voice')
SFX_DIR = os.path.join(BASE_DIR, 'earshot_sfx')
OUT_WAV = os.path.join(BASE_DIR, 'master_soundtrack_45s.wav')

SAMPLE_RATE = 44100
DURATION = 45.0
TOTAL_SAMPLES = int(SAMPLE_RATE * DURATION)

os.makedirs(VOICE_DIR, exist_ok=True)

# 1. Voiceover Script & Start Timings (seconds)
VOICE_SCRIPTS = [
    (0, 0.2, "歡迎來到數據分析。原始數據，只是一片混沌。"),
    (1, 4.4, "加入柱狀圖，橫向對比體量，一眼鎖定核心貢獻者。"),
    (2, 10.4, "疊加七日均線，消除隨機雜訊，看清長期趨勢與拐點。"),
    (3, 16.4, "散點聚類與迴歸線，挖掘相關性，警示異常離群值。"),
    (4, 22.4, "展開環形佔比圖，落實二八法則，拆解營收份額貢獻。"),
    (5, 28.4, "六維雷達圖全面體檢，打破盲區，精確診斷系統短板。"),
    (6, 34.4, "桑基圖梳理轉化，精準定位漏斗流失瓶頸與歸因。"),
    (7, 40.0, "好分析，是用圖表洞見真實趨勢，驅動確信的決策。")
]

print("🎙 正在使用 macOS 繁體中文語音引擎 (Meijia) 錄製旁白...")
voice_events = []

for idx, start_s, text in VOICE_SCRIPTS:
    aiff_path = os.path.join(VOICE_DIR, f"vo_{idx}.aiff")
    wav_path = os.path.join(VOICE_DIR, f"vo_{idx}.wav")
    
    # Generate voice with say
    subprocess.run(["say", "-v", "Meijia", "-r", "210", "-o", aiff_path, text], check=True)
    
    # Convert to 44.1kHz WAV via ffmpeg
    subprocess.run([
        os.path.join(BASE_DIR, 'bin', 'ffmpeg'),
        "-y", "-i", aiff_path,
        "-ar", str(SAMPLE_RATE),
        "-ac", "1", # mono voice
        wav_path
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    
    data, sr = sf.read(wav_path)
    voice_events.append({
        'idx': idx,
        'start_s': start_s,
        'data': data,
        'dur_s': len(data) / sr
    })
    print(f"  [旁白 {idx}] {start_s}s - {start_s + len(data)/sr:.2f}s: {text}")

# 2. Build Ducking Envelope & Voice Audio Track
voice_track_l = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
voice_track_r = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
ducking_envelope = np.ones(TOTAL_SAMPLES, dtype=np.float32) # 1.0 = full BGM, 0.35 = ducked

for ev in voice_events:
    start_idx = int(ev['start_s'] * SAMPLE_RATE)
    v_data = ev['data']
    v_len = len(v_data)
    
    # Paste voice
    end_idx = min(TOTAL_SAMPLES, start_idx + v_len)
    actual_len = end_idx - start_idx
    voice_track_l[start_idx:end_idx] += v_data[:actual_len] * 0.95
    voice_track_r[start_idx:end_idx] += v_data[:actual_len] * 0.95
    
    # Apply Ducking around voice window (with 150ms smooth crossfade)
    duck_start = max(0, start_idx - int(SAMPLE_RATE * 0.15))
    duck_end = min(TOTAL_SAMPLES, end_idx + int(SAMPLE_RATE * 0.25))
    fade_len = int(SAMPLE_RATE * 0.15)
    
    for i in range(duck_start, duck_end):
        if i < start_idx:
            t = (i - duck_start) / (start_idx - duck_start)
            target = 1.0 - t * 0.65 # fade from 1.0 down to 0.35
        elif i > end_idx:
            t = (i - end_idx) / (duck_end - end_idx)
            target = 0.35 + t * 0.65 # fade from 0.35 up to 1.0
        else:
            target = 0.35 # ducked while speaking
        ducking_envelope[i] = min(ducking_envelope[i], target)

# 3. Read Base BGM Track
bgm_path = os.path.join(BASE_DIR, 'soundtrack_45s.wav')
bgm_data, bgm_sr = sf.read(bgm_path)
if len(bgm_data) > TOTAL_SAMPLES:
    bgm_data = bgm_data[:TOTAL_SAMPLES]
elif len(bgm_data) < TOTAL_SAMPLES:
    bgm_data = np.pad(bgm_data, ((0, TOTAL_SAMPLES - len(bgm_data)), (0, 0)))

bgm_l = bgm_data[:, 0] * ducking_envelope * 0.85
bgm_r = bgm_data[:, 1] * ducking_envelope * 0.85

# 4. Overlay Earshot SFX
print("🔊 正在套用 Earshot 程序化音效庫 (SFX)...")
sfx_track_l = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
sfx_track_r = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

def add_sfx(filename, at_sec, gain=1.0, pan=0.0):
    fpath = os.path.join(SFX_DIR, filename)
    if not os.path.exists(fpath): return
    s_data, s_sr = sf.read(fpath)
    if s_data.ndim > 1: s_data = s_data[:, 0]
    # Resample if needed
    if s_sr != SAMPLE_RATE:
        # Simple nearest/linear or ffmpeg resample
        pass
    start_i = int(at_sec * SAMPLE_RATE)
    end_i = min(TOTAL_SAMPLES, start_i + len(s_data))
    act_len = end_i - start_i
    left_gain = gain * (0.5 - pan * 0.3)
    right_gain = gain * (0.5 + pan * 0.3)
    sfx_track_l[start_i:end_i] += s_data[:act_len] * left_gain
    sfx_track_r[start_i:end_i] += s_data[:act_len] * right_gain

# Earshot Switch Clicks on every Atom transition
switch_cues = [4.0, 10.0, 16.0, 22.0, 28.0, 34.0, 40.0]
for idx, cue in enumerate(switch_cues):
    add_sfx('click_thock.wav', cue, gain=0.85, pan=-0.2 + idx * 0.08)
    add_sfx('click_snap.wav', cue + 0.015, gain=0.6, pan=0.1)

# Earshot Sub Hits on major movements
add_sfx('cut_hit_sub.wav', 4.0, gain=0.7)
add_sfx('cut_hit_sub.wav', 16.0, gain=0.7)
add_sfx('cut_hit_sub.wav', 28.0, gain=0.7)
add_sfx('cut_hit_sub.wav', 40.0, gain=0.9)

# Scatter Outlier Plink
add_sfx('drip_plink.wav', 18.2, gain=0.75, pan=0.3)
add_sfx('drip_plink.wav', 19.4, gain=0.65, pan=0.4)

# Finale Downlifter
add_sfx('downlifter_sub_sink.wav', 40.0, gain=0.7)
add_sfx('cut_hit_air.wav', 40.2, gain=0.5)

# 5. Master Mix & Limiter
print("🎚 進行多軌立體聲最終混音 (Mastering)...")
master_l = voice_track_l * 1.25 + bgm_l + sfx_track_l
master_r = voice_track_r * 1.25 + bgm_r + sfx_track_r

# Normalize to -1.0 dBFS
peak = max(np.max(np.abs(master_l)), np.max(np.abs(master_r)))
print(f"Mix peak amplitude: {peak:.3f}")
target = 0.89
norm_gain = target / (peak if peak > 0 else 1.0)

master_l = np.clip(master_l * norm_gain, -1.0, 1.0)
master_r = np.clip(master_r * norm_gain, -1.0, 1.0)

# Save WAV
master_stereo = np.column_stack((master_l, master_r))
sf.write(OUT_WAV, master_stereo, SAMPLE_RATE)
print(f"✅ 完成！高音質 Master 音軌已寫入: {OUT_WAV}")
