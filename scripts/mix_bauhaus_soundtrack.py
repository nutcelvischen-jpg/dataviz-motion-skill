#!/usr/bin/env python3
"""
Data Atoms · 120 BPM Bauhaus Mechanical Rhythmic Soundtrack & Mastering
Inspired by Vincentwei1021/mg-styles-15 Bauhaus Style + Earshot Physical SFX.
Synchronizes Gemini 3.8 Charon Voiceover with dynamic auto-ducking.
"""

import os
import math
import numpy as np
import soundfile as sf

SR = 44100
DURATION = 34.0
TOTAL_SAMPLES = int(SR * DURATION)
BPM = 120.0
SPB = 60.0 / BPM  # 0.500s per beat

print("=== Generating 120 BPM Bauhaus Mechanical Soundtrack ===")

# ----------------------------------------------------
# 1. 和弦與幾何調性 (Bauhaus Minimalist Chords)
# ----------------------------------------------------
# 120 BPM: 4 bars per scene = 16 beats = 8.0s + 0.5s breath
chord_progression = [
    (0.0, 8.5, [130.81, 196.00, 261.63, 329.63]),   # Cmaj7 (Clean Macro Overview)
    (8.5, 17.0, [146.83, 220.00, 261.63, 349.23]),  # Dm7 (Structure & Tiers)
    (17.0, 25.5, [174.61, 261.63, 329.63, 392.00]), # Fmaj7 (Distribution & Outlier Focus)
    (25.5, 34.0, [130.81, 196.00, 261.63, 392.00])  # Cadd9 (Iconic Brand Resolve)
]

music_left = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
music_right = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

for start_s, end_s, freqs in chord_progression:
    s_idx = int(start_s * SR)
    e_idx = min(TOTAL_SAMPLES, int(end_s * SR))
    dur_samp = e_idx - s_idx
    t = np.linspace(start_s, end_s, dur_samp, endpoint=False)

    fade_len = int(0.12 * SR)
    env = np.ones(dur_samp, dtype=np.float32)
    if dur_samp > 2 * fade_len:
        env[:fade_len] = np.linspace(0, 1, fade_len)
        env[-fade_len:] = np.linspace(1, 0, fade_len)

    chord_val = np.zeros(dur_samp, dtype=np.float32)
    for f in freqs:
        # Crisp Rhodes + Triangle Tone (Rational Bauhaus Aesthetic)
        tone = (
            0.55 * np.sin(2 * np.pi * f * t) +
            0.28 * np.sin(2 * np.pi * (f * 2.0) * t) +
            0.12 * np.sin(2 * np.pi * (f * 3.0) * t)
        )
        chord_val += tone

    chord_val = (chord_val / len(freqs)) * env * 0.26
    music_left[s_idx:e_idx] += chord_val * 0.95
    music_right[s_idx:e_idx] += chord_val * 1.05

# ----------------------------------------------------
# 2. 包豪斯機械脈衝打擊樂 (Mechanical Kick, Clap, Hi-hat Grid)
# ----------------------------------------------------
total_beats = int(DURATION / SPB)

def synth_kick():
    dur = int(0.18 * SR)
    t = np.linspace(0, 0.18, dur, endpoint=False)
    freq_sweep = 140.0 * np.exp(-t * 26.0) + 42.0
    phase = 2 * np.pi * np.cumsum(freq_sweep) / SR
    env = np.exp(-t * 18.0)
    return np.sin(phase) * env * 0.42

def synth_clap():
    dur = int(0.12 * SR)
    t = np.linspace(0, 0.12, dur, endpoint=False)
    noise = np.random.uniform(-1, 1, dur)
    env = np.exp(-t * 28.0)
    # Bandpass filter approximation
    return noise * env * 0.18

def synth_tick():
    dur = int(0.04 * SR)
    t = np.linspace(0, 0.04, dur, endpoint=False)
    noise = np.random.uniform(-1, 1, dur)
    env = np.exp(-t * 90.0)
    return noise * env * 0.10

kick_sample = synth_kick()
clap_sample = synth_clap()
tick_sample = synth_tick()

for b in range(total_beats):
    t_beat = b * SPB
    idx = int(t_beat * SR)

    # Kick on beat 1 and 3 of every bar (b % 4 == 0 or 2)
    if b % 2 == 0 and idx + len(kick_sample) < TOTAL_SAMPLES:
        music_left[idx:idx+len(kick_sample)] += kick_sample
        music_right[idx:idx+len(kick_sample)] += kick_sample

    # Snare/Clap on beat 2 and 4 (b % 2 == 1)
    if b % 2 == 1 and idx + len(clap_sample) < TOTAL_SAMPLES:
        music_left[idx:idx+len(clap_sample)] += clap_sample * 0.9
        music_right[idx:idx+len(clap_sample)] += clap_sample * 1.1

    # Mechanical 16th-note ticks
    for sub in range(4):
        sub_t = t_beat + sub * (SPB / 4.0)
        sub_idx = int(sub_t * SR)
        if sub_idx + len(tick_sample) < TOTAL_SAMPLES:
            music_left[sub_idx:sub_idx+len(tick_sample)] += tick_sample * 0.8
            music_right[sub_idx:sub_idx+len(tick_sample)] += tick_sample * 0.8

# ----------------------------------------------------
# 3. 載入並對齊 Gemini 3.8 TTS 語音
# ----------------------------------------------------
voice_left = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
voice_right = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

# 4 幕精準時間軸對位 (秒) - 嚴格保留 1.5s~3s 純音樂卡點空隙，杜絕任何重疊
VOICE_TIMELINE = [
    ("scene_01", 0.5),   # 0.5s - 6.42s (Macro Overview) -> 2.08s 轉場空隙
    ("scene_02", 8.5),   # 8.5s - 14.14s (Structure & Top Share) -> 3.06s 轉場空隙
    ("scene_03", 17.2),  # 17.2s - 23.36s (Outlier & Tiers) -> 2.14s 轉場空隙
    ("scene_04", 25.5)   # 25.5s - 32.62s (Executive Conclusion) -> 1.38s 結尾
]

speech_mask = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

for scene_id, start_time in VOICE_TIMELINE:
    wav_path = os.path.join("voice_briefing", f"{scene_id}.wav")
    if not os.path.exists(wav_path):
        print(f"Warning: {wav_path} not found!")
        continue

    v_data, v_sr = sf.read(wav_path)
    if len(v_data.shape) > 1:
        v_data = np.mean(v_data, axis=1)

    s_idx = int(start_time * SR)
    e_idx = min(TOTAL_SAMPLES, s_idx + len(v_data))
    copy_len = e_idx - s_idx

    voice_left[s_idx:e_idx] += v_data[:copy_len] * 1.05
    voice_right[s_idx:e_idx] += v_data[:copy_len] * 1.05

    # Speech activity mask for auto-ducking
    pad = int(0.2 * SR)
    m_s = max(0, s_idx - pad)
    m_e = min(TOTAL_SAMPLES, e_idx + pad)
    speech_mask[m_s:m_e] = 1.0

# ----------------------------------------------------
# 4. 智慧側鏈動態避讓 (Auto-Ducking: -5.2dB under voice)
# ----------------------------------------------------
# Smooth the speech mask with moving average (~0.25s)
kernel_size = int(0.25 * SR)
kernel = np.ones(kernel_size) / kernel_size
smooth_speech = np.convolve(speech_mask, kernel, mode='same')
smooth_speech = np.clip(smooth_speech, 0.0, 1.0)

# Gain envelope: 1.0 (0dB) when silent, 0.55 (-5.2dB) when speaking
ducking_gain = 1.0 - smooth_speech * 0.45

music_left *= ducking_gain
music_right *= ducking_gain

# ----------------------------------------------------
# 5. 最終母帶壓限與混合 (Mastering & Limit)
# ----------------------------------------------------
master_left = voice_left + music_left
master_right = voice_right + music_right

# Normalize and leave -1.5 dBFS headroom
peak = max(np.max(np.abs(master_left)), np.max(np.abs(master_right)))
if peak > 0:
    target_peak = 10 ** (-1.5 / 20.0) # ~0.841
    norm_factor = target_peak / peak
    master_left *= norm_factor
    master_right *= norm_factor

out_stereo = np.column_stack([master_left, master_right])
out_wav = "videos/master_soundtrack_bauhaus_34s.wav"
sf.write(out_wav, out_stereo, SR)

print(f"Master soundtrack written: {out_wav} (Duration: {DURATION}s)")
