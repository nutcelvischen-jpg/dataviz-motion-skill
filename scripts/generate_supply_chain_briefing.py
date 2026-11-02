#!/usr/bin/env python3
"""
Data Atoms · Supply Chain Lens Voiceover & Soundtrack Generator
Synthesizes Gemini 3.8 Flash TTS for Supply Chain Briefing and mixes 120 BPM soundtrack.
"""

import os
import requests
import subprocess
import soundfile as sf
import numpy as np

API_KEY_PATH = "api_key.txt"
with open(API_KEY_PATH, "r") as f:
    api_key = f.read().strip()

OUT_DIR = "voice_supply_chain"
os.makedirs(OUT_DIR, exist_ok=True)

SCRIPTS = [
    {
        "id": "scene_01",
        "text": "供應鏈總庫存達一萬四千八百件，單品平均庫存一千八百件。",
        "desc": "Scene 1: Macro Inventory (0.5s - 8.0s)"
    },
    {
        "id": "scene_02",
        "text": "物聯網邊緣節點交期延遲率達百分之十四，構成關鍵供應鏈瓶頸。",
        "desc": "Scene 2: Bottleneck Risk (8.5s - 17.0s)"
    },
    {
        "id": "scene_03",
        "text": "庫存週轉天數極差達六十四天，智慧製造積壓八十二天亟需清理。",
        "desc": "Scene 3: Turnover Tiers & Idle Stock (17.2s - 25.0s)"
    },
    {
        "id": "scene_04",
        "text": "啟動動態配額與供應商平行分流，保證交付並壓降週轉成本。",
        "desc": "Scene 4: Action & SCM Resolution (25.5s - 34.0s)"
    }
]

print("=== Generating Supply Chain Voiceover via Gemini 3.8 Flash TTS ===")
for item in SCRIPTS:
    idx = item["id"]
    text = item["text"]
    raw_pcm = os.path.join(OUT_DIR, f"{idx}.pcm")
    out_wav = os.path.join(OUT_DIR, f"{idx}.wav")

    print(f"Generating {idx}: {text}")
    res = requests.post(
        url="https://openrouter.ai/api/v1/audio/speech",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        json={
            "model": "google/gemini-3.8-flash-tts",
            "input": text,
            "voice": "Charon"
        }
    )

    if res.status_code != 200:
        print(f"Error {res.status_code}: {res.text}")
        continue

    with open(raw_pcm, "wb") as f:
        f.write(res.content)

    cmd = [
        "bin/ffmpeg", "-y",
        "-f", "s16le",
        "-ar", "24000",
        "-ac", "1",
        "-i", raw_pcm,
        "-ar", "44100",
        out_wav
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    print(f"Saved: {out_wav}")

# 混入 120 BPM 襯樂
print("=== Mixing Supply Chain Master Soundtrack ===")
SR = 44100
DURATION = 34.0
TOTAL_SAMPLES = int(SR * DURATION)
BPM = 120.0
SPB = 60.0 / BPM

# Supply Chain Dm Minor Chord Progression (Rational, Alert & Industrial)
chord_progression = [
    (0.0, 8.5, [146.83, 220.00, 261.63, 349.23]),   # Dm7 (Inventory Overview)
    (8.5, 17.0, [116.54, 174.61, 233.08, 293.66]),  # Bbmaj7 (Bottleneck Alert)
    (17.0, 25.5, [130.81, 196.00, 261.63, 311.13]), # Cm7 (Turnover Spread)
    (25.5, 34.0, [146.83, 220.00, 293.66, 370.00])  # Dadd9 (Strategic Dispatch)
]

music_left = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
music_right = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

for start_s, end_s, freqs in chord_progression:
    s_idx = int(start_s * SR)
    e_idx = min(TOTAL_SAMPLES, int(end_s * SR))
    dur_samp = e_idx - s_idx
    t = np.linspace(start_s, end_s, dur_samp, endpoint=False)
    env = np.ones(dur_samp, dtype=np.float32)
    fade_len = int(0.12 * SR)
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

# Add Voiceover
voice_left = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
voice_right = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
speech_mask = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

VOICE_TIMELINE = [
    ("scene_01", 0.5),   # 0.5s - 6.74s -> 1.76s 轉場空隙
    ("scene_02", 8.5),   # 8.5s - 14.54s -> 2.66s 轉場空隙
    ("scene_03", 17.2),  # 17.2s - 24.00s -> 1.50s 轉場空隙
    ("scene_04", 25.5)   # 25.5s - 31.30s -> 2.70s 結尾
]

for scene_id, start_time in VOICE_TIMELINE:
    wav_path = os.path.join(OUT_DIR, f"{scene_id}.wav")
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
print(f"Master Supply Chain soundtrack ready: {out_wav}")
