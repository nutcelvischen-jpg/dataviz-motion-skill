#!/usr/bin/env python3
"""
Rich, Musical 118 BPM Modern Tech Soundtrack with Gemini 3.8 Charon Voiceover
Features:
- Warm Electric Piano / Rhodes chord progression (Fm9 -> Dbmaj7 -> Bbm9 -> Eb7 -> Abmaj7)
- Rhythmic 16th-note marimba/bell arpeggios
- Punchy 118 BPM kick, snare, hi-hat groove
- Professional sidechain / auto-ducking (-4.5dB under speech, swells during pauses)
- Earshot physical sound effects on key interaction moments
"""

import os
import math
import numpy as np
import soundfile as sf

SR = 44100
DURATION = 38.0
TOTAL_SAMPLES = int(SR * DURATION)
BPM = 118.0
SPB = 60.0 / BPM  # ~0.5085s per beat

print("=== Generating Rich 118 BPM Commercial Soundtrack ===")

# ----------------------------------------------------
# 1. 旋律與和弦層 (Harmonic Rhodes & Bell Chords)
# ----------------------------------------------------
chord_progression = [
    (0.0, 4.0, [174.61, 261.63, 311.13, 349.23]),   # Fm9 (Intro Hook)
    (4.0, 9.2, [138.59, 207.65, 261.63, 329.63]),   # Dbmaj7 (Drop & Bar chart)
    (9.2, 14.5, [116.54, 174.61, 233.08, 277.18]),  # Bbm7 (Scatter switch)
    (14.5, 19.2, [155.56, 233.08, 311.13, 392.00]), # Eb7 (Pearson R & Outlier)
    (19.2, 24.5, [207.65, 261.63, 311.13, 392.00]), # Abmaj7 (Funnel burst)
    (24.5, 29.5, [138.59, 207.65, 261.63, 329.63]), # Dbmaj7 (Radar & Table)
    (29.5, 34.0, [155.56, 233.08, 311.13, 392.00]), # Eb7 (1080p Export flash)
    (34.0, 38.0, [174.61, 261.63, 349.23, 440.00])  # Fadd9 (Outro Brand Resolve)
]

music_left = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
music_right = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

for start_s, end_s, freqs in chord_progression:
    s_idx = int(start_s * SR)
    e_idx = min(TOTAL_SAMPLES, int(end_s * SR))
    dur_samp = e_idx - s_idx
    t = np.linspace(start_s, end_s, dur_samp, endpoint=False)

    # Smooth attack and release envelope
    fade_len = int(0.15 * SR)
    env = np.ones(dur_samp, dtype=np.float32)
    if dur_samp > 2 * fade_len:
        env[:fade_len] = np.linspace(0, 1, fade_len)
        env[-fade_len:] = np.linspace(1, 0, fade_len)

    chord_val = np.zeros(dur_samp, dtype=np.float32)
    for f in freqs:
        # Rhodes electric piano warm tone with bell harmonics
        tone = (
            0.50 * np.sin(2 * np.pi * f * t) +
            0.25 * np.sin(2 * np.pi * (f * 2.002) * t) +
            0.12 * np.sin(2 * np.pi * (f * 3.001) * t) +
            0.08 * np.sin(2 * np.pi * (f * 4.0) * t)
        )
        chord_val += tone

    chord_val = (chord_val / len(freqs)) * env * 0.28
    music_left[s_idx:e_idx] += chord_val * 0.95
    music_right[s_idx:e_idx] += chord_val * 1.05

# ----------------------------------------------------
# 2. 靈動琶音 (Marimba / Pluck Arpeggio)
# ----------------------------------------------------
total_beats = int(DURATION / SPB)
for b in range(total_beats):
    t_beat = b * SPB
    s_idx = int(t_beat * SR)
    if s_idx >= TOTAL_SAMPLES:
        break

    # Find active chord
    current_chord = [261.63, 329.63, 392.0]
    for cs, ce, cf in chord_progression:
        if cs <= t_beat < ce:
            current_chord = cf
            break

    # Play 4 sixteenth notes per beat
    for sub in range(4):
        t_sub = t_beat + sub * (SPB / 4.0)
        sub_idx = int(t_sub * SR)
        if sub_idx >= TOTAL_SAMPLES:
            break
        note_freq = current_chord[(b + sub) % len(current_chord)] * 2.0  # One octave up

        dur_note = int(0.12 * SR)
        t_n = np.linspace(0, 0.12, dur_note, endpoint=False)
        # Fast bell decay
        bell_env = np.exp(-t_n * 24.0)
        bell_sample = (np.sin(2 * np.pi * note_freq * t_n) + 0.3 * np.sin(2 * np.pi * note_freq * 2.75 * t_n)) * bell_env * 0.09

        end_n = min(sub_idx + dur_note, TOTAL_SAMPLES)
        length = end_n - sub_idx
        pan = 0.5 + 0.3 * math.sin(b * 0.8 + sub)
        music_left[sub_idx:end_n] += bell_sample[:length] * (1.0 - pan)
        music_right[sub_idx:end_n] += bell_sample[:length] * pan

# ----------------------------------------------------
# 3. 節奏鼓組 (Punchy Kick, Snappy Clap, Crisp Hats)
# ----------------------------------------------------
for b in range(total_beats):
    t_beat = b * SPB
    s_idx = int(t_beat * SR)
    if s_idx >= TOTAL_SAMPLES:
        break

    # Kick on beats 0, 2 (or 4-on-the-floor from beat 8 onwards)
    if b >= 4:
        kick_len = int(0.22 * SR)
        t_k = np.linspace(0, 0.22, kick_len, endpoint=False)
        pitch_drop = 110 * np.exp(-t_k * 22) + 42
        phase = 2 * np.pi * np.cumsum(pitch_drop) / SR
        kick = np.sin(phase) * np.exp(-t_k * 14) * 0.35
        k_end = min(s_idx + kick_len, TOTAL_SAMPLES)
        music_left[s_idx:k_end] += kick[:k_end - s_idx]
        music_right[s_idx:k_end] += kick[:k_end - s_idx]

    # Snare / Clap on beats 1, 3 (every 2nd and 4th beat)
    if b >= 6 and (b % 2 == 1):
        snare_len = int(0.18 * SR)
        t_sn = np.linspace(0, 0.18, snare_len, endpoint=False)
        sn_noise = (np.random.rand(snare_len) * 2 - 1) * np.exp(-t_sn * 20) * 0.16
        sn_tone = np.sin(2 * np.pi * 185 * t_sn) * np.exp(-t_sn * 25) * 0.14
        snare = sn_noise + sn_tone
        sn_end = min(s_idx + snare_len, TOTAL_SAMPLES)
        music_left[s_idx:sn_end] += snare[:sn_end - s_idx]
        music_right[s_idx:sn_end] += snare[:sn_end - s_idx]

    # 16th-note Hi-hats
    for h in range(2):
        h_idx = s_idx + int(h * (SPB / 2.0) * SR)
        if h_idx < TOTAL_SAMPLES and b >= 4:
            hh_len = int(0.05 * SR)
            hh = (np.random.rand(hh_len) * 2 - 1) * np.exp(-np.linspace(0, 1, hh_len) * 32) * 0.08
            hh_end = min(h_idx + hh_len, TOTAL_SAMPLES)
            music_left[h_idx:hh_end] += hh[:hh_end - h_idx] * 0.8
            music_right[h_idx:hh_end] += hh[:hh_end - h_idx] * 1.2

# ----------------------------------------------------
# 4. 載入 Charon 男聲配音與智慧避讓 (Smart Ducking)
# ----------------------------------------------------
voice_cues = [
    {"file": "voice_charon/line_01.wav", "start": 0.5},
    {"file": "voice_charon/line_02.wav", "start": 9.3},
    {"file": "voice_charon/line_03.wav", "start": 19.3},
    {"file": "voice_charon/line_04.wav", "start": 30.0}
]

voice_stereo = np.zeros((TOTAL_SAMPLES, 2), dtype=np.float32)
duck_envelope = np.ones(TOTAL_SAMPLES, dtype=np.float32)

for item in voice_cues:
    fpath = item["file"]
    start_s = item["start"]
    data, sr = sf.read(fpath)
    if data.ndim > 1:
        data = data.mean(axis=1)

    start_idx = int(start_s * SR)
    end_idx = min(start_idx + len(data), TOTAL_SAMPLES)
    length = end_idx - start_idx

    # Voice centered with slight warmth
    voice_stereo[start_idx:end_idx, 0] += data[:length]
    voice_stereo[start_idx:end_idx, 1] += data[:length]

    # Professional Ducking: reduce BGM to 0.55 (-5.2 dB), clearly audible yet voice cuts through
    pad_in = int(0.12 * SR)
    pad_out = int(0.25 * SR)
    d_start = max(0, start_idx - pad_in)
    d_end = min(TOTAL_SAMPLES, end_idx + pad_out)
    duck_envelope[d_start:d_end] = 0.55

# Smooth ducking transitions
smooth_win = int(0.12 * SR)
duck_envelope = np.convolve(duck_envelope, np.ones(smooth_win) / smooth_win, mode='same')

# Apply ducking to music
music_left = music_left * duck_envelope
music_right = music_right * duck_envelope

# ----------------------------------------------------
# 5. 疊加 Earshot 物理音效庫
# ----------------------------------------------------
sfx_stereo = np.zeros((TOTAL_SAMPLES, 2), dtype=np.float32)

def add_sfx_stereo(filename, at_sec, gain=1.0, pan=0.5):
    path = os.path.join("earshot_sfx", filename)
    if not os.path.exists(path):
        return
    data, sr = sf.read(path)
    if data.ndim > 1:
        data = data.mean(axis=1)
    s_idx = int(at_sec * SR)
    e_idx = min(s_idx + len(data), TOTAL_SAMPLES)
    length = e_idx - s_idx
    if length > 0:
        sfx_stereo[s_idx:e_idx, 0] += data[:length] * gain * (1.0 - pan * 0.4)
        sfx_stereo[s_idx:e_idx, 1] += data[:length] * gain * (0.6 + pan * 0.4)

# SFX Timing
add_sfx_stereo("cut_hit_air.wav", 0.3, gain=0.65, pan=0.3)
add_sfx_stereo("cut_hit_sub.wav", 2.8, gain=0.90, pan=0.4)
add_sfx_stereo("click_thock.wav", 3.0, gain=0.95, pan=0.45)
add_sfx_stereo("click_snap.wav", 5.5, gain=0.75, pan=0.6)
add_sfx_stereo("click_thock.wav", 9.2, gain=0.85, pan=0.3)
add_sfx_stereo("drip_plink.wav", 11.0, gain=0.80, pan=0.7)
add_sfx_stereo("drip_plink.wav", 15.2, gain=0.75, pan=0.65)
add_sfx_stereo("cut_hit_sub.wav", 19.3, gain=0.85, pan=0.4)
add_sfx_stereo("click_snap.wav", 21.5, gain=0.85, pan=0.35)
add_sfx_stereo("click_thock.wav", 30.2, gain=0.95, pan=0.8)
add_sfx_stereo("cut_hit_air.wav", 30.5, gain=0.75, pan=0.8)
add_sfx_stereo("downlifter_sub_sink.wav", 34.0, gain=0.70, pan=0.5)

# ----------------------------------------------------
# 6. 總混音與母帶壓縮 (Mastering & Normalization)
# ----------------------------------------------------
final_left = music_left * 1.1 + voice_stereo[:, 0] * 1.0 + sfx_stereo[:, 0] * 0.85
final_right = music_right * 1.1 + voice_stereo[:, 1] * 1.0 + sfx_stereo[:, 1] * 0.85

master_stereo = np.column_stack([final_left, final_right])

# Soft limiter normalization (-1.0 dBFS true peak)
max_amp = np.max(np.abs(master_stereo))
print(f"Pre-master max amplitude: {max_amp:.3f}")
if max_amp > 0.0:
    master_stereo = master_stereo * (0.89 / max_amp)

out_master_wav = "videos/master_soundtrack_charon_38s.wav"
sf.write(out_master_wav, master_stereo, SR)
print(f"Rich master soundtrack written to: {out_master_wav}")

# Also update motion_cursor_demo/assets/sound.wav
sf.write("motion_cursor_demo/assets/sound.wav", master_stereo, SR)
print("Updated motion_cursor_demo/assets/sound.wav")
