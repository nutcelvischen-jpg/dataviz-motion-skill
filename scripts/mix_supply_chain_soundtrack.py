#!/usr/bin/env python3
"""
Dedicated Supply Chain 120 BPM Master Audio Mixer (Zero Overlap Guaranteed)
"""
import os
import numpy as np
import soundfile as sf

SR = 44100
DURATION = 34.0
TOTAL_SAMPLES = int(SR * DURATION)
BPM = 120.0
SPB = 60.0 / BPM # 0.5s per beat

music_left = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
music_right = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

# Industrial Dark Blue/Amber Chords (Dm -> Bb -> Gm -> A7)
chords = [
    (0.0, 8.5, [146.83, 220.00, 261.63, 349.23]), # Dm7
    (8.5, 17.0, [116.54, 174.61, 233.08, 293.66]), # Bbmaj7
    (17.0, 25.5, [98.00, 146.83, 196.00, 246.94]), # Gm7
    (25.5, 34.0, [110.00, 164.81, 220.00, 277.18]) # A7
]

for s_t, e_t, freqs in chords:
    s_idx = int(s_t * SR)
    e_idx = min(TOTAL_SAMPLES, int(e_t * SR))
    dur_samp = e_idx - s_idx
    t = np.linspace(s_t, e_t, dur_samp, endpoint=False)
    fade_len = int(0.12 * SR)
    env = np.ones(dur_samp, dtype=np.float32)
    if dur_samp > 2 * fade_len:
        env[:fade_len] = np.linspace(0, 1, fade_len)
        env[-fade_len:] = np.linspace(1, 0, fade_len)
    chord_val = np.zeros(dur_samp, dtype=np.float32)
    for f in freqs:
        chord_val += (0.50 * np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * (f * 2.0) * t))
    chord_val = (chord_val / len(freqs)) * env * 0.25
    music_left[s_idx:e_idx] += chord_val
    music_right[s_idx:e_idx] += chord_val

# Mechanical Beats
total_beats = int(DURATION / SPB)
def synth_kick():
    dur = int(0.18 * SR)
    t = np.linspace(0, 0.18, dur, endpoint=False)
    freq = 130.0 * np.exp(-t * 24.0) + 40.0
    phase = 2 * np.pi * np.cumsum(freq) / SR
    return np.sin(phase) * np.exp(-t * 18.0) * 0.40

def synth_clap():
    dur = int(0.12 * SR)
    t = np.linspace(0, 0.12, dur, endpoint=False)
    return np.random.uniform(-1, 1, dur) * np.exp(-t * 26.0) * 0.16

kick = synth_kick()
clap = synth_clap()

for b in range(total_beats):
    t_beat = b * SPB
    idx = int(t_beat * SR)
    if b % 2 == 0 and idx + len(kick) < TOTAL_SAMPLES:
        music_left[idx:idx+len(kick)] += kick
        music_right[idx:idx+len(kick)] += kick
    if b % 2 == 1 and idx + len(clap) < TOTAL_SAMPLES:
        music_left[idx:idx+len(clap)] += clap
        music_right[idx:idx+len(clap)] += clap

# Add Clean Voiceover
voice_left = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
voice_right = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
speech_mask = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

VOICE_TIMELINE = [
    ("scene_01", 0.5),   # 0.5s - 6.74s -> 1.76s gap
    ("scene_02", 8.5),   # 8.5s - 14.54s -> 2.66s gap
    ("scene_03", 17.2),  # 17.2s - 24.00s -> 1.50s gap
    ("scene_04", 25.5)   # 25.5s - 31.30s -> 2.70s gap
]

for scene_id, start_time in VOICE_TIMELINE:
    wav_path = os.path.join("voice_supply_chain", f"{scene_id}.wav")
    v_data, _ = sf.read(wav_path)
    if len(v_data.shape) > 1: v_data = np.mean(v_data, axis=1)
    s_idx = int(start_time * SR)
    e_idx = min(TOTAL_SAMPLES, s_idx + len(v_data))
    c_len = e_idx - s_idx
    voice_left[s_idx:e_idx] += v_data[:c_len] * 1.05
    voice_right[s_idx:e_idx] += v_data[:c_len] * 1.05
    speech_mask[max(0, s_idx - int(0.2*SR)):min(TOTAL_SAMPLES, e_idx + int(0.2*SR))] = 1.0

# Auto Ducking
kernel = np.ones(int(0.25 * SR)) / int(0.25 * SR)
smooth = np.clip(np.convolve(speech_mask, kernel, mode='same'), 0.0, 1.0)
music_left *= (1.0 - smooth * 0.45)
music_right *= (1.0 - smooth * 0.45)

master_left = voice_left + music_left
master_right = voice_right + music_right
peak = max(np.max(np.abs(master_left)), np.max(np.abs(master_right)))
if peak > 0:
    factor = (10 ** (-1.5 / 20.0)) / peak
    master_left *= factor
    master_right *= factor

out_wav = "videos/master_soundtrack_supply_chain_34s.wav"
sf.write(out_wav, np.column_stack([master_left, master_right]), SR)
print(f"✅ Master Supply Chain soundtrack generated: {out_wav} (Duration: {DURATION}s)")
