#!/usr/bin/env python3
"""
72-Second 126 BPM Upbeat Tech-Pop Soundtrack Mixer for Antigravity Skill Tutorial
Integrates 5-track Voiceover, synthesized Rhodes, Marimba, Drums, Earshot SFX, and Sidechain Auto-Ducking.
Total duration: exactly 72.00 seconds (2160 frames @ 30 FPS).
"""

import os
import numpy as np
import soundfile as sf

SR = 44100
DURATION_SEC = 72.0
TOTAL_SAMPLES = int(SR * DURATION_SEC)
BPM = 126.0
BEAT_DUR = 60.0 / BPM
BAR_DUR = BEAT_DUR * 4.0

VOICE_DIR = 'voice_skill_70s'
OUTPUT_WAV = 'media/master_soundtrack_skill_tutorial_72s.wav'

CHORDS = [
    [261.63, 329.63, 392.00, 493.88],  # Cmaj7
    [220.00, 261.63, 329.63, 392.00],  # Am7
    [174.61, 220.00, 261.63, 329.63],  # Fmaj7
    [196.00, 246.94, 293.66, 349.23]   # G7
]

BASS_NOTES = [130.81, 110.00, 87.31, 98.00]

# Scene start times (in seconds):
SCENE_STARTS = [0.0, 13.0, 26.0, 43.0, 59.0]
VOICE_OFFSETS = [0.4, 13.4, 26.4, 43.4, 59.4]

def synthesize_rhodes(freqs, dur, velocity=0.6):
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    wave = np.zeros_like(t)
    for i, f in enumerate(freqs):
        env = np.exp(-t * (1.8 + i * 0.3))
        harmonic1 = np.sin(2 * np.pi * f * t)
        harmonic2 = 0.35 * np.sin(4 * np.pi * f * t) * np.exp(-t * 3.5)
        wave += (harmonic1 + harmonic2) * env
    wave = wave / (len(freqs) * 0.8) * velocity
    return wave

def synthesize_marimba_arp(freqs, dur, velocity=0.35):
    samples = int(SR * dur)
    wave = np.zeros(samples)
    step = int(SR * (BEAT_DUR / 4.0))
    for idx, sample_idx in enumerate(range(0, samples, step)):
        note_freq = freqs[idx % len(freqs)] * 2.0
        note_dur = min(0.3, dur - sample_idx / SR)
        if note_dur <= 0: break
        t_note = np.linspace(0, note_dur, int(SR * note_dur), endpoint=False)
        env = np.exp(-t_note * 16.0)
        hit = np.sin(2 * np.pi * note_freq * t_note) * env * velocity
        end_idx = min(samples, sample_idx + len(hit))
        wave[sample_idx:end_idx] += hit[:end_idx - sample_idx]
    return wave

def synthesize_bass(freq, dur, velocity=0.65):
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    env = np.exp(-t * 1.5)
    wave = np.sin(2 * np.pi * freq * t) * env
    wave += 0.25 * np.sin(4 * np.pi * freq * t) * np.exp(-t * 3.0)
    return wave * velocity

def synthesize_drums(dur):
    samples = int(SR * dur)
    drum_track = np.zeros(samples)
    beat_samples = int(SR * BEAT_DUR)
    
    # 1. Kick on every beat
    for b in range(0, samples, beat_samples):
        k_dur = 0.18
        t = np.linspace(0, k_dur, int(SR * k_dur), endpoint=False)
        pitch = 140 * np.exp(-t * 28.0) + 45
        kick = np.sin(2 * np.pi * pitch * t) * np.exp(-t * 18.0) * 0.95
        end = min(samples, b + len(kick))
        drum_track[b:end] += kick[:end - b]

    # 2. Snare / Clap on beats 2 & 4
    for b in range(beat_samples, samples, beat_samples * 2):
        s_dur = 0.15
        t = np.linspace(0, s_dur, int(SR * s_dur), endpoint=False)
        noise = (np.random.rand(len(t)) * 2 - 1) * np.exp(-t * 22.0)
        tone = np.sin(2 * np.pi * 180 * t) * np.exp(-t * 16.0) * 0.4
        snare = (noise * 0.7 + tone) * 0.75
        end = min(samples, b + len(snare))
        drum_track[b:end] += snare[:end - b]

    # 3. Crisp Hi-hats
    half_beat = int(beat_samples / 2)
    for b in range(half_beat, samples, beat_samples):
        h_dur = 0.05
        t = np.linspace(0, h_dur, int(SR * h_dur), endpoint=False)
        hat = (np.random.rand(len(t)) * 2 - 1) * np.exp(-t * 70.0) * 0.45
        end = min(samples, b + len(hat))
        drum_track[b:end] += hat[:end - b]

    return drum_track

def generate_sfx_whoosh(dur=0.6):
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    noise = (np.random.rand(len(t)) * 2 - 1)
    env = np.sin(np.pi * t / dur) ** 2
    return noise * env * 0.35

def generate_sfx_click(dur=0.08):
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    tone = np.sin(2 * np.pi * 2200 * t) * np.exp(-t * 75.0)
    return tone * 0.4

def main():
    print("=== Generating Upbeat 126 BPM 72-Second Skill Tutorial Soundtrack ===")
    
    bgm = np.zeros(TOTAL_SAMPLES)
    num_bars = int(np.ceil(DURATION_SEC / BAR_DUR))
    for bar_i in range(num_bars):
        chord_idx = bar_i % len(CHORDS)
        freqs = CHORDS[chord_idx]
        bass_f = BASS_NOTES[chord_idx]
        
        start_sample = int(bar_i * BAR_DUR * SR)
        dur = min(BAR_DUR, DURATION_SEC - bar_i * BAR_DUR)
        if dur <= 0: break
        
        rhodes_bar = synthesize_rhodes(freqs, dur, velocity=0.55)
        marimba_bar = synthesize_marimba_arp(freqs, dur, velocity=0.35)
        bass_bar = synthesize_bass(bass_f, dur, velocity=0.65)
        
        end_sample = min(TOTAL_SAMPLES, start_sample + len(rhodes_bar))
        seg_len = end_sample - start_sample
        bgm[start_sample:end_sample] += (rhodes_bar[:seg_len] + marimba_bar[:seg_len] + bass_bar[:seg_len])
        
    drums = synthesize_drums(DURATION_SEC)
    bgm += drums[:TOTAL_SAMPLES] * 0.60
    
    sfx_track = np.zeros(TOTAL_SAMPLES)
    for boundary in SCENE_STARTS:
        b_sample = int(boundary * SR)
        clk = generate_sfx_click()
        end_clk = min(TOTAL_SAMPLES, b_sample + len(clk))
        sfx_track[b_sample:end_clk] += clk[:end_clk - b_sample]
        
        if boundary > 0:
            whoosh = generate_sfx_whoosh()
            w_start = max(0, b_sample - int(0.35 * SR))
            end_w = min(TOTAL_SAMPLES, w_start + len(whoosh))
            sfx_track[w_start:end_w] += whoosh[:end_w - w_start]
            
    voice_track = np.zeros(TOTAL_SAMPLES)
    ducking_envelope = np.ones(TOTAL_SAMPLES)
    
    for idx, start_time in enumerate(VOICE_OFFSETS):
        vo_path = os.path.join(VOICE_DIR, f"vo_{idx}.wav")
        if not os.path.exists(vo_path):
            print(f"Warning: {vo_path} not found!")
            continue
            
        data, sr = sf.read(vo_path)
        if len(data.shape) > 1:
            data = data.mean(axis=1)
            
        start_sample = int(start_time * SR)
        end_sample = min(TOTAL_SAMPLES, start_sample + len(data))
        v_len = end_sample - start_sample
        
        voice_track[start_sample:end_sample] += data[:v_len] * 1.08
        
        duck_start = max(0, start_sample - int(0.12 * SR))
        duck_end = min(TOTAL_SAMPLES, end_sample + int(0.18 * SR))
        ducking_envelope[duck_start:duck_end] = 0.40 # Duck BGM by -8 dB
        
    kernel_size = int(0.12 * SR)
    kernel = np.ones(kernel_size) / kernel_size
    smoothed_ducking = np.convolve(ducking_envelope, kernel, mode='same')
    
    ducked_bgm = bgm * smoothed_ducking
    master = (ducked_bgm * 0.65) + (sfx_track * 0.70) + (voice_track * 1.12)
    
    left_channel = master * 0.98 + (ducked_bgm * 0.08)
    right_channel = master * 0.98 - (ducked_bgm * 0.08)
    stereo_master = np.stack([left_channel, right_channel], axis=-1)
    
    peak = np.max(np.abs(stereo_master))
    print(f"Master Raw Peak: {peak:.3f}")
    if peak > 0:
        target_peak = 0.94
        stereo_master = stereo_master * (target_peak / peak)
        print(f"Master Normalized Peak to: {target_peak:.3f}")
        
    sf.write(OUTPUT_WAV, stereo_master, SR)
    print(f"🎉 成功輸出 72 秒 Skill 教學音軌: {OUTPUT_WAV} (時長: {DURATION_SEC:.2f}s)")

if __name__ == "__main__":
    main()
