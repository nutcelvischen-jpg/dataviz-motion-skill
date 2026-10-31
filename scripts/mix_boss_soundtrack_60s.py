#!/usr/bin/env python3
"""
Rich 120 BPM Modern Tech Executive Soundtrack with Gemini 3.8 Charon Voiceover (60.0s)
Features:
- Confident Rhodes & Marimba Chord Progressions (60.0s)
- Earshot Physical Sound Effects on Transitions
- Intelligent Auto-Ducking (-5.5dB under Charon's voice)
- Output: master_soundtrack_boss_60s.wav
"""

import os
import math
import numpy as np
import soundfile as sf

SR = 44100
DURATION = 60.0
TOTAL_SAMPLES = int(SR * DURATION)
BPM = 120.0
SPB = 60.0 / BPM  # 0.5s per beat

PROJECT_DIR = '.'
VOICE_DIR = os.path.join(PROJECT_DIR, 'voice_boss_60s')
SFX_DIR = os.path.join(PROJECT_DIR, 'earshot_sfx')
OUT_WAV = os.path.join(PROJECT_DIR, 'master_soundtrack_boss_60s.wav')

print("=== Generating Rich 120 BPM 60-Second Executive Soundtrack ===")

# ----------------------------------------------------
# 1. 和弦聲部 (Chords Progression)
# ----------------------------------------------------
chord_progression = [
    (0.0, 10.0, [174.61, 261.63, 311.13, 349.23]),   # Fm9 (01. Workflow Upgrade)
    (10.0, 20.0, [138.59, 207.65, 261.63, 329.63]),  # Dbmaj7 (02. Data Refinement)
    (20.0, 30.0, [116.54, 174.61, 233.08, 277.18]),  # Bbm7 (03. Skill Packaging)
    (30.0, 40.0, [155.56, 233.08, 311.13, 392.00]),  # Eb7 (04. Agentic Dashboard)
    (40.0, 50.0, [207.65, 261.63, 311.13, 392.00]),  # Abmaj7 (05. MCP Ecosystem)
    (50.0, 57.0, [138.59, 207.65, 261.63, 349.23]),  # Dbadd9 (06. Decision Closure)
    (57.0, 60.0, [174.61, 261.63, 349.23, 440.00])   # Fadd9 (Grand Outro Resolve)
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
        tone = (
            0.50 * np.sin(2 * np.pi * f * t) +
            0.24 * np.sin(2 * np.pi * (f * 2.002) * t) +
            0.12 * np.sin(2 * np.pi * (f * 3.001) * t) +
            0.06 * np.sin(2 * np.pi * (f * 4.0) * t)
        )
        chord_val += tone

    chord_val = (chord_val / len(freqs)) * env * 0.26
    music_left[s_idx:e_idx] += chord_val * 0.95
    music_right[s_idx:e_idx] += chord_val * 1.05

# ----------------------------------------------------
# 2. 靈動琶音 (Marimba Arpeggio)
# ----------------------------------------------------
total_beats = int(DURATION / SPB)
for b in range(total_beats):
    t_beat = b * SPB
    s_idx = int(t_beat * SR)
    if s_idx >= TOTAL_SAMPLES:
        break

    current_chord = [261.63, 329.63, 392.0]
    for cs, ce, cf in chord_progression:
        if cs <= t_beat < ce:
            current_chord = cf
            break

    for sub in range(4):
        t_sub = t_beat + sub * (SPB / 4.0)
        sub_idx = int(t_sub * SR)
        if sub_idx >= TOTAL_SAMPLES:
            break
        note_freq = current_chord[(b + sub) % len(current_chord)] * 2.0

        dur_note = int(0.11 * SR)
        t_n = np.linspace(0, 0.11, dur_note, endpoint=False)
        bell_env = np.exp(-t_n * 22.0)
        bell_sample = (np.sin(2 * np.pi * note_freq * t_n) + 0.25 * np.sin(2 * np.pi * note_freq * 2.75 * t_n)) * bell_env * 0.085

        e_sub = min(TOTAL_SAMPLES, sub_idx + dur_note)
        act_dur = e_sub - sub_idx
        pan = 0.5 + 0.35 * np.sin(b * 0.8 + sub)
        music_left[sub_idx:e_sub] += bell_sample[:act_dur] * (1.0 - pan)
        music_right[sub_idx:e_sub] += bell_sample[:act_dur] * pan

# ----------------------------------------------------
# 3. 節奏鼓組 (120 BPM Punchy Tech Drums)
# ----------------------------------------------------
for b in range(total_beats):
    t_beat = b * SPB
    b_idx = int(t_beat * SR)
    beat_in_bar = b % 4

    # Kick on beat 0 and 2
    if beat_in_bar in [0, 2] and b_idx < TOTAL_SAMPLES - int(0.25 * SR):
        dur_k = int(0.22 * SR)
        t_k = np.linspace(0, 0.22, dur_k, endpoint=False)
        f_k = 135.0 * np.exp(-t_k * 28.0) + 40.0
        phase = 2 * np.pi * np.cumsum(f_k) / SR
        kick = np.sin(phase) * np.exp(-t_k * 14.0) * 0.32
        music_left[b_idx:b_idx+dur_k] += kick
        music_right[b_idx:b_idx+dur_k] += kick

    # Snare / Clap on beat 1 and 3
    if beat_in_bar in [1, 3] and b_idx < TOTAL_SAMPLES - int(0.20 * SR):
        dur_s = int(0.18 * SR)
        t_s = np.linspace(0, 0.18, dur_s, endpoint=False)
        noise = (np.random.rand(dur_s).astype(np.float32) * 2.0 - 1.0) * np.exp(-t_s * 25.0)
        snare_body = np.sin(2 * np.pi * 180.0 * t_s) * np.exp(-t_s * 32.0)
        snare = (noise * 0.7 + snare_body * 0.3) * 0.22
        music_left[b_idx:b_idx+dur_s] += snare * 0.95
        music_right[b_idx:b_idx+dur_s] += snare * 1.05

    # Crisp Hi-hats on 8th notes
    for eighth in [0, 1]:
        h_idx = int((t_beat + eighth * (SPB / 2.0)) * SR)
        if h_idx < TOTAL_SAMPLES - int(0.06 * SR):
            dur_h = int(0.045 * SR)
            t_h = np.linspace(0, 0.045, dur_h, endpoint=False)
            hihat = (np.random.rand(dur_h).astype(np.float32) * 2.0 - 1.0) * np.exp(-t_h * 75.0) * (0.09 if eighth == 0 else 0.06)
            music_left[h_idx:h_idx+dur_h] += hihat * 0.8
            music_right[h_idx:h_idx+dur_h] += hihat * 1.2

# ----------------------------------------------------
# 4. 載入人聲並計算 Auto-Ducking 曲線
# ----------------------------------------------------
voice_track = np.zeros((TOTAL_SAMPLES, 2), dtype=np.float32)
ducking_mask = np.ones(TOTAL_SAMPLES, dtype=np.float32)

voice_schedule = [
    (0, 0.5),
    (1, 10.2),
    (2, 20.2),
    (3, 30.2),
    (4, 40.2),
    (5, 50.2)
]

for idx, start_s in voice_schedule:
    wav_path = os.path.join(VOICE_DIR, f"vo_{idx}.wav")
    if not os.path.exists(wav_path):
        continue
    data, v_sr = sf.read(wav_path)
    if data.ndim == 1:
        data = np.column_stack([data, data])
    elif data.shape[1] > 2:
        data = data[:, :2]

    v_samp = len(data)
    s_idx = int(start_s * SR)
    e_idx = min(TOTAL_SAMPLES, s_idx + v_samp)
    act_len = e_idx - s_idx

    voice_track[s_idx:e_idx] += data[:act_len] * 1.05

    # Ducking under voice
    d_start = max(0, s_idx - int(0.08 * SR))
    d_end = min(TOTAL_SAMPLES, e_idx + int(0.18 * SR))
    ducking_mask[d_start:d_end] = 0.38  # -8.4dB ducking

# Smooth ducking mask
kernel_size = int(0.15 * SR)
kernel = np.hanning(kernel_size)
kernel /= np.sum(kernel)
smoothed_duck = np.convolve(ducking_mask, kernel, mode='same')

# Apply Ducking to music
music_left *= smoothed_duck
music_right *= smoothed_duck

# ----------------------------------------------------
# 5. 疊加 Earshot 物理操作音效
# ----------------------------------------------------
def mix_sfx(sfx_filename, start_sec, vol=0.6, pan=0.5):
    path = os.path.join(SFX_DIR, sfx_filename)
    if not os.path.exists(path):
        return
    data, s_sr = sf.read(path)
    if data.ndim == 2:
        data = np.mean(data, axis=1)
    dur = len(data)
    s_idx = int(start_sec * SR)
    e_idx = min(TOTAL_SAMPLES, s_idx + dur)
    act = e_idx - s_idx
    if act <= 0:
        return
    music_left[s_idx:e_idx] += data[:act] * vol * (1.0 - pan)
    music_right[s_idx:e_idx] += data[:act] * vol * pan

# SFX Events matching transitions
mix_sfx("cut_hit_sub.wav", 0.3, vol=0.55, pan=0.5)
mix_sfx("click_thock.wav", 0.45, vol=0.6, pan=0.45)

mix_sfx("click_thock.wav", 9.9, vol=0.65, pan=0.5)
mix_sfx("click_snap.wav", 10.15, vol=0.6, pan=0.55)

mix_sfx("click_thock.wav", 19.9, vol=0.65, pan=0.45)
mix_sfx("drip_plink.wav", 20.15, vol=0.55, pan=0.6)

mix_sfx("click_snap.wav", 29.9, vol=0.65, pan=0.5)
mix_sfx("click_thock.wav", 30.15, vol=0.6, pan=0.45)

mix_sfx("drip_plink.wav", 39.9, vol=0.6, pan=0.55)
mix_sfx("click_snap.wav", 40.15, vol=0.6, pan=0.5)

mix_sfx("cut_hit_sub.wav", 49.8, vol=0.6, pan=0.5)
mix_sfx("click_thock.wav", 50.1, vol=0.65, pan=0.5)

mix_sfx("downlifter_sub_sink.wav", 57.5, vol=0.75, pan=0.5)

# ----------------------------------------------------
# 6. 最終立體聲混音與母帶限制 (Mastering Limiter)
# ----------------------------------------------------
master = np.column_stack([music_left, music_right]) + voice_track

# Soft limiter
peak = np.max(np.abs(master))
print(f"Master Raw Peak: {peak:.3f}")
if peak > 0.94:
    master = master * (0.94 / peak)
    print(f"Master Normalized Peak to: {np.max(np.abs(master)):.3f}")

sf.write(OUT_WAV, master, SR, subtype='PCM_16')
print(f"🎉 成功輸出 60 秒母帶級混音音軌: {OUT_WAV} (時長: {len(master)/SR:.2f}s)")
