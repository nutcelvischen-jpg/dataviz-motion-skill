#!/usr/bin/env python3
"""
Upbeat 126 BPM Tech-Pop Soundtrack with Gemini 3.8 Leda Female Voiceover (60.0s)
Features:
- Vibrant Rhodes & Marimba Arpeggio in C Major / F Major (Happy, Approachable, Lively)
- Funky Bassline + 126 BPM Tech-Pop Drums (Kick, Snare, Groove Hi-Hats)
- Earshot Physical Sound Effects on Transitions (Click, Snap, Plink, Sub Hit, Downlifter)
- Intelligent Sidechain Auto-Ducking (-7.5dB under Leda's voice)
- Output: master_soundtrack_antigravity_guide_60s.wav
"""

import os
import math
import numpy as np
import soundfile as sf

SR = 44100
DURATION = 60.0
TOTAL_SAMPLES = int(SR * DURATION)
BPM = 126.0
SPB = 60.0 / BPM  # ~0.4762s per beat

PROJECT_DIR = '/Users/chenchunchih/Desktop/數據視覺化'
VOICE_DIR = os.path.join(PROJECT_DIR, 'voice_guide_60s')
SFX_DIR = os.path.join(PROJECT_DIR, 'earshot_sfx')
OUT_WAV = os.path.join(PROJECT_DIR, 'master_soundtrack_antigravity_guide_60s.wav')

print("=== Generating Upbeat 126 BPM 60-Second Antigravity Guide Soundtrack ===")

# ----------------------------------------------------
# 1. 溫暖明亮和弦聲部 (Bright & Friendly Chords)
# ----------------------------------------------------
chord_progression = [
    (0.0, 10.0, [261.63, 329.63, 392.00, 523.25]),  # Cmaj7 (01. Intro: Hello Antigravity!)
    (10.0, 20.0, [220.00, 261.63, 329.63, 440.00]), # Am7   (02. /browser)
    (20.0, 30.0, [174.61, 220.00, 261.63, 349.23]), # Fmaj7 (03. /boost)
    (30.0, 40.0, [196.00, 246.94, 293.66, 392.00]), # G7    (04. /goal)
    (40.0, 50.0, [261.63, 329.63, 392.00, 493.88]), # Cmaj7 (05. MCP Ecosystem)
    (50.0, 57.0, [174.61, 220.00, 261.63, 392.00]), # Fadd9 (06. Skills & Artifacts)
    (57.0, 60.0, [261.63, 329.63, 392.00, 523.25])  # C6/9  (Grand Happy Resolve)
]

music_left = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
music_right = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

for start_s, end_s, freqs in chord_progression:
    s_idx = int(start_s * SR)
    e_idx = min(TOTAL_SAMPLES, int(end_s * SR))
    dur_samp = e_idx - s_idx
    t = np.linspace(start_s, end_s, dur_samp, endpoint=False)

    fade_len = int(0.10 * SR)
    env = np.ones(dur_samp, dtype=np.float32)
    if dur_samp > 2 * fade_len:
        env[:fade_len] = np.linspace(0, 1, fade_len)
        env[-fade_len:] = np.linspace(1, 0, fade_len)

    chord_val = np.zeros(dur_samp, dtype=np.float32)
    for f in freqs:
        tone = (
            0.52 * np.sin(2 * np.pi * f * t) +
            0.26 * np.sin(2 * np.pi * (f * 2.001) * t) +
            0.14 * np.sin(2 * np.pi * (f * 3.0) * t) +
            0.08 * np.sin(2 * np.pi * (f * 4.0) * t)
        )
        chord_val += tone

    chord_val = (chord_val / len(freqs)) * env * 0.28
    music_left[s_idx:e_idx] += chord_val * 0.95
    music_right[s_idx:e_idx] += chord_val * 1.05

# ----------------------------------------------------
# 2. 靈動馬林巴琶音 (Lively 16th Marimba Arpeggio)
# ----------------------------------------------------
total_beats = int(DURATION / SPB)
for b in range(total_beats):
    t_beat = b * SPB
    s_idx = int(t_beat * SR)
    if s_idx >= TOTAL_SAMPLES:
        break

    current_chord = [261.63, 329.63, 392.00, 523.25]
    for cs, ce, cf in chord_progression:
        if cs <= t_beat < ce:
            current_chord = cf
            break

    for sub in range(4):
        t_sub = t_beat + sub * (SPB / 4.0)
        sub_idx = int(t_sub * SR)
        if sub_idx >= TOTAL_SAMPLES:
            break
        note_freq = current_chord[(b + sub) % len(current_chord)] * 1.5

        dur_note = int(0.10 * SR)
        t_n = np.linspace(0, 0.10, dur_note, endpoint=False)
        bell_env = np.exp(-t_n * 26.0)
        bell_sample = (np.sin(2 * np.pi * note_freq * t_n) + 0.3 * np.sin(2 * np.pi * note_freq * 2.0 * t_n)) * bell_env * 0.095

        e_sub = min(TOTAL_SAMPLES, sub_idx + dur_note)
        act_dur = e_sub - sub_idx
        pan = 0.5 + 0.35 * np.sin(b * 0.9 + sub)
        music_left[sub_idx:e_sub] += bell_sample[:act_dur] * (1.0 - pan)
        music_right[sub_idx:e_sub] += bell_sample[:act_dur] * pan

# ----------------------------------------------------
# 3. 節奏鼓組 (126 BPM Lively Pop-Tech Drums)
# ----------------------------------------------------
for b in range(total_beats):
    t_beat = b * SPB
    b_idx = int(t_beat * SR)
    beat_in_bar = b % 4

    # Kick on beat 0 and 2
    if beat_in_bar in [0, 2] and b_idx < TOTAL_SAMPLES - int(0.22 * SR):
        dur_k = int(0.20 * SR)
        t_k = np.linspace(0, 0.20, dur_k, endpoint=False)
        f_k = 145.0 * np.exp(-t_k * 30.0) + 42.0
        phase = 2 * np.pi * np.cumsum(f_k) / SR
        kick = np.sin(phase) * np.exp(-t_k * 15.0) * 0.34
        music_left[b_idx:b_idx+dur_k] += kick
        music_right[b_idx:b_idx+dur_k] += kick

    # Crisp Clap / Snare on beat 1 and 3
    if beat_in_bar in [1, 3] and b_idx < TOTAL_SAMPLES - int(0.18 * SR):
        dur_s = int(0.16 * SR)
        t_s = np.linspace(0, 0.16, dur_s, endpoint=False)
        noise = (np.random.rand(dur_s).astype(np.float32) * 2.0 - 1.0) * np.exp(-t_s * 28.0)
        snare_body = np.sin(2 * np.pi * 190.0 * t_s) * np.exp(-t_s * 35.0)
        snare = (noise * 0.75 + snare_body * 0.25) * 0.24
        music_left[b_idx:b_idx+dur_s] += snare * 0.95
        music_right[b_idx:b_idx+dur_s] += snare * 1.05

    # 16th note playful hi-hat groove
    for sub in [0, 1, 2, 3]:
        h_idx = int((t_beat + sub * (SPB / 4.0)) * SR)
        if h_idx < TOTAL_SAMPLES - int(0.05 * SR):
            dur_h = int(0.04 * SR)
            t_h = np.linspace(0, 0.04, dur_h, endpoint=False)
            vol_h = 0.08 if sub == 0 else (0.05 if sub == 2 else 0.035)
            hihat = (np.random.rand(dur_h).astype(np.float32) * 2.0 - 1.0) * np.exp(-t_h * 85.0) * vol_h
            music_left[h_idx:h_idx+dur_h] += hihat * 0.85
            music_right[h_idx:h_idx+dur_h] += hihat * 1.15

# ----------------------------------------------------
# 4. 載入人聲與 Auto-Ducking 智慧音量避讓
# ----------------------------------------------------
voice_track = np.zeros((TOTAL_SAMPLES, 2), dtype=np.float32)
ducking_mask = np.ones(TOTAL_SAMPLES, dtype=np.float32)

voice_schedule = [
    (0, 0.4),
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

    voice_track[s_idx:e_idx] += data[:act_len] * 1.08

    # Ducking under voice
    d_start = max(0, s_idx - int(0.07 * SR))
    d_end = min(TOTAL_SAMPLES, e_idx + int(0.15 * SR))
    ducking_mask[d_start:d_end] = 0.35  # -9.1dB ducking

# Smooth ducking mask
kernel_size = int(0.12 * SR)
kernel = np.hanning(kernel_size)
kernel /= np.sum(kernel)
smoothed_duck = np.convolve(ducking_mask, kernel, mode='same')

music_left *= smoothed_duck
music_right *= smoothed_duck

# ----------------------------------------------------
# 5. 疊加 Earshot 物理音效
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

# Transition audio cues
mix_sfx("cut_hit_sub.wav", 0.25, vol=0.5, pan=0.5)
mix_sfx("click_thock.wav", 0.4, vol=0.6, pan=0.45)

mix_sfx("click_thock.wav", 9.9, vol=0.6, pan=0.5)
mix_sfx("click_snap.wav", 10.15, vol=0.6, pan=0.55)

mix_sfx("click_thock.wav", 19.9, vol=0.6, pan=0.45)
mix_sfx("drip_plink.wav", 20.15, vol=0.55, pan=0.6)

mix_sfx("click_snap.wav", 29.9, vol=0.6, pan=0.5)
mix_sfx("click_thock.wav", 30.15, vol=0.6, pan=0.45)

mix_sfx("drip_plink.wav", 39.9, vol=0.6, pan=0.55)
mix_sfx("click_snap.wav", 40.15, vol=0.6, pan=0.5)

mix_sfx("cut_hit_sub.wav", 49.8, vol=0.55, pan=0.5)
mix_sfx("click_thock.wav", 50.1, vol=0.65, pan=0.5)

mix_sfx("downlifter_sub_sink.wav", 57.5, vol=0.75, pan=0.5)

# ----------------------------------------------------
# 6. 母帶限制與輸出 (Master Limiter)
# ----------------------------------------------------
master = np.column_stack([music_left, music_right]) + voice_track

peak = np.max(np.abs(master))
print(f"Master Raw Peak: {peak:.3f}")
if peak > 0.94:
    master = master * (0.94 / peak)
    print(f"Master Normalized Peak to: {np.max(np.abs(master)):.3f}")

sf.write(OUT_WAV, master, SR, subtype='PCM_16')
print(f"🎉 成功輸出 60 秒活潑版音軌: {OUT_WAV} (時長: {len(master)/SR:.2f}s)")
