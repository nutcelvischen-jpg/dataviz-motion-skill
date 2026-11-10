#!/usr/bin/env python3
"""
Lively Earshot Master Audio Synthesizer & Voice Mixer (45.0s)
- Pacing: 126 BPM Upbeat Future-Tech Groove
- Voiceover: Gemini 3.8 Flash TTS (Leda - Youthful & Steady Female Voice)
- SFX: Earshot Sound Architecture (click_snap, click_thock, cut_hit_sub, cut_hit_air, drip_plink, downlifter)
- Auto-Ducking: Intelligent sidechain compression with smooth 120ms attack/release
Output: media/master_soundtrack_45s.wav (44100 Hz, 16-bit Stereo)
"""

import os
import math
import random
import numpy as np
import soundfile as sf

PROJECT_DIR = '.'
VOICE_DIR = os.path.join(PROJECT_DIR, 'voice_gemini')
SFX_DIR = os.path.join(PROJECT_DIR, 'earshot_sfx')
OUT_WAV = os.path.join(PROJECT_DIR, 'media/master_soundtrack_45s.wav')

SAMPLE_RATE = 44100
DURATION = 45.0 # Exactly 45.0s
TOTAL_SAMPLES = int(SAMPLE_RATE * DURATION)
BPM = 126.0
BEAT_LEN = 60.0 / BPM # ~0.4762s

VOICE_EVENTS = [
    (0, 0.3, "vo_0.wav"),
    (1, 4.3, "vo_1.wav"),
    (2, 10.3, "vo_2.wav"),
    (3, 16.3, "vo_3.wav"),
    (4, 22.3, "vo_4.wav"),
    (5, 28.3, "vo_5.wav"),
    (6, 34.3, "vo_6.wav"),
    (7, 40.2, "vo_7.wav")
]

def generate_lively_bgm():
    print(f"🎵 正在合成 126 BPM 活潑科技感立體聲配樂 (總時長: {DURATION}s)...")
    left = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    right = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    
    total_beats = int(DURATION / BEAT_LEN)
    
    # 1. Lively Modern Chord Progression (Dbmaj9 -> Eb7 -> Fm7 -> Abmaj7)
    chord_map = [
        (0.0, 4.0, [174.61, 261.63, 311.13, 349.23]), # Fm7
        (4.0, 10.0, [138.59, 207.65, 261.63, 329.63, 415.30]), # Dbmaj9
        (10.0, 16.0, [155.56, 233.08, 311.13, 369.99, 466.16]), # Eb9
        (16.0, 22.0, [207.65, 261.63, 311.13, 392.00, 523.25]), # Abmaj7
        (22.0, 28.0, [138.59, 207.65, 261.63, 329.63, 415.30]), # Dbmaj9
        (28.0, 34.0, [116.54, 174.61, 233.08, 277.18, 349.23]), # Bbm7
        (34.0, 40.0, [155.56, 233.08, 311.13, 392.00, 466.16]), # Eb9
        (40.0, 45.0, [174.61, 261.63, 349.23, 440.00, 523.25])  # Fadd9 resolve
    ]
    
    # Pad & Electric Piano Arp
    for start_s, end_s, freqs in chord_map:
        start_samp = int(start_s * SAMPLE_RATE)
        end_samp = min(TOTAL_SAMPLES, int(end_s * SAMPLE_RATE))
        dur_samp = end_samp - start_samp
        
        # Warm pad foundation
        for i in range(dur_samp):
            t = (start_samp + i) / SAMPLE_RATE
            env = 1.0
            if i < SAMPLE_RATE * 0.15:
                env = i / (SAMPLE_RATE * 0.15)
            elif i > dur_samp - SAMPLE_RATE * 0.15:
                env = (dur_samp - i) / (SAMPLE_RATE * 0.15)
                
            val = 0.0
            for f in freqs[:3]:
                val += math.sin(2 * math.pi * f * t) * 0.35
                val += math.sin(2 * math.pi * (f * 2.002) * t) * 0.12
            val = (val / 3.0) * 0.18 * env
            left[start_samp + i] += val * 0.95
            right[start_samp + i] += val * 1.05

    # 2. Upbeat Marimba / Pluck Arpeggio (16th notes syncopation)
    for b in range(total_beats * 4): # 16th notes
        note_t = b * (BEAT_LEN / 4.0)
        if note_t < 2.0 or note_t >= 42.0:
            continue
        note_samp = int(note_t * SAMPLE_RATE)
        if note_samp >= TOTAL_SAMPLES:
            break
            
        # Select active chord
        cur_chord = chord_map[0][2]
        for s_s, e_s, f_list in chord_map:
            if s_s <= note_t < e_s:
                cur_chord = f_list
                break
                
        # Upbeat rhythmic pattern: 16th syncopation
        arp_pattern = [0, 2, 1, 3, 2, 4, 1, 3]
        f_idx = arp_pattern[b % len(arp_pattern)] % len(cur_chord)
        note_freq = cur_chord[f_idx] * (1.0 if b % 2 == 0 else 2.0)
        
        # Velocity bounce
        velocity = 0.08 if (b % 4 == 0) else (0.13 if (b % 4 == 2) else 0.05)
        
        dur_samp = int(0.18 * SAMPLE_RATE)
        for i in range(dur_samp):
            if note_samp + i >= TOTAL_SAMPLES: break
            p = i / dur_samp
            env = math.exp(-p * 14.0)
            tone = math.sin(2 * math.pi * note_freq * (i / SAMPLE_RATE))
            tone += math.sin(2 * math.pi * (note_freq * 2.01) * (i / SAMPLE_RATE)) * 0.25
            val = tone * env * velocity
            # Stereo bounce
            pan = math.sin(b * 0.4) * 0.35
            left[note_samp + i] += val * (0.5 - pan)
            right[note_samp + i] += val * (0.5 + pan)

    # 3. Punchy Percussion & Bass (126 BPM)
    for b in range(total_beats):
        beat_t = b * BEAT_LEN
        beat_samp = int(beat_t * SAMPLE_RATE)
        if beat_samp >= TOTAL_SAMPLES:
            break
            
        # Kick Drum: Punchy, tight pitch drop
        has_kick = False
        if 4.0 <= beat_t < 40.0:
            if 16.0 <= beat_t < 34.0:
                has_kick = True # Four on the floor for high energy sections!
            else:
                has_kick = (b % 2 == 0) # Upbeat half-time
                
        if has_kick:
            k_dur = int(0.22 * SAMPLE_RATE)
            for i in range(k_dur):
                if beat_samp + i >= TOTAL_SAMPLES: break
                p = i / k_dur
                pitch = 42.0 + 120.0 * math.exp(-p * 16.0)
                phase = 2 * math.pi * pitch * (i / SAMPLE_RATE)
                env = math.exp(-p * 9.0)
                val = math.sin(phase) * env * 0.55
                if i < 80:
                    val += (random.random() * 2 - 1) * 0.12 * (1 - i / 80)
                left[beat_samp + i] += val
                right[beat_samp + i] += val
                
        # Snappy Claps / Rimshot on Beats 2 and 4
        if 4.0 <= beat_t < 40.0 and (b % 2 == 1):
            c_dur = int(0.14 * SAMPLE_RATE)
            for i in range(c_dur):
                if beat_samp + i >= TOTAL_SAMPLES: break
                p = i / c_dur
                noise = (random.random() * 2 - 1) * math.exp(-p * 22.0) * 0.22
                body = math.sin(2 * math.pi * 240 * (i / SAMPLE_RATE)) * math.exp(-p * 26.0) * 0.18
                val = noise + body
                left[beat_samp + i] += val * 0.92
                right[beat_samp + i] += val * 1.08

        # Lively 16th Hi-Hats & Shakers
        if 3.5 <= beat_t < 41.0:
            for sub in [0, 0.25, 0.5, 0.75]:
                h_samp = int((beat_t + sub * BEAT_LEN) * SAMPLE_RATE)
                if h_samp >= TOTAL_SAMPLES: break
                h_dur = int(0.04 * SAMPLE_RATE)
                h_vel = 0.08 if sub in [0.25, 0.75] else 0.04
                for i in range(h_dur):
                    if h_samp + i >= TOTAL_SAMPLES: break
                    env = (1 - i / h_dur) ** 2
                    noise = (random.random() * 2 - 1) * env * h_vel
                    left[h_samp + i] += noise * 0.85
                    right[h_samp + i] += noise * 1.15
                    
    return left, right

def main():
    print("========================================================")
    print("🎚 Earshot + OpenRouter Gemini 3.8 Flash TTS 音訊主混音管線")
    print(f"規格: 44.1kHz Stereo 16-bit | 總長: {DURATION}s | 節奏: {BPM} BPM")
    print("========================================================\n")
    
    # 1. Load Voiceovers and build ducking envelope
    print("🎙 正在載入 Gemini 3.8 Flash TTS 語音並計算智慧音量避讓 (Auto-Ducking)...")
    voice_track_l = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    voice_track_r = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    ducking_envelope = np.ones(TOTAL_SAMPLES, dtype=np.float32) # 1.0 = full BGM, 0.32 = ducked
    
    for idx, start_s, fname in VOICE_EVENTS:
        fpath = os.path.join(VOICE_DIR, fname)
        if not os.path.exists(fpath):
            raise FileNotFoundError(f"找不到語音檔案: {fpath}")
        v_data, v_sr = sf.read(fpath)
        if v_data.ndim > 1: v_data = v_data[:, 0]
        
        start_idx = int(start_s * SAMPLE_RATE)
        v_len = len(v_data)
        end_idx = min(TOTAL_SAMPLES, start_idx + v_len)
        act_len = end_idx - start_idx
        
        # Paste voice into center stereo
        voice_track_l[start_idx:end_idx] += v_data[:act_len] * 1.05
        voice_track_r[start_idx:end_idx] += v_data[:act_len] * 1.05
        
        # Smooth ducking window with 120ms attack / release
        fade_len = int(SAMPLE_RATE * 0.12)
        duck_start = max(0, start_idx - fade_len)
        duck_end = min(TOTAL_SAMPLES, end_idx + int(SAMPLE_RATE * 0.20))
        
        for i in range(duck_start, duck_end):
            if i < start_idx:
                t = (i - duck_start) / fade_len
                target = 1.0 - t * 0.68 # Duck from 1.0 down to 0.32
            elif i > end_idx:
                t = (i - end_idx) / (duck_end - end_idx)
                target = 0.32 + t * 0.68 # Recover from 0.32 up to 1.0
            else:
                target = 0.32 # Full duck while speaking
            ducking_envelope[i] = min(ducking_envelope[i], target)
            
        print(f"  [旁白 {idx}] {start_s}s - {start_s + v_len/v_sr:.2f}s (時長: {v_len/v_sr:.2f}s)")

    # 2. Synthesize BGM and apply ducking
    bgm_raw_l, bgm_raw_r = generate_lively_bgm()
    bgm_l = bgm_raw_l * ducking_envelope * 0.90
    bgm_r = bgm_raw_r * ducking_envelope * 0.90

    # 3. Overlay Earshot SFX
    print("\n🔊 正在精密套用 Earshot 物理音效庫 (SFX)...")
    sfx_track_l = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    sfx_track_r = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    
    def add_sfx(filename, at_sec, gain=1.0, pan=0.0):
        fpath = os.path.join(SFX_DIR, filename)
        if not os.path.exists(fpath): return
        s_data, s_sr = sf.read(fpath)
        if s_data.ndim > 1: s_data = s_data[:, 0]
        # Resample from 48kHz to 44.1kHz if needed
        if s_sr != SAMPLE_RATE:
            num_target = int(len(s_data) * (SAMPLE_RATE / s_sr))
            s_data = np.interp(
                np.linspace(0, len(s_data), num_target, endpoint=False),
                np.arange(len(s_data)),
                s_data
            )
        start_i = int(at_sec * SAMPLE_RATE)
        end_i = min(TOTAL_SAMPLES, start_i + len(s_data))
        act_len = end_i - start_i
        left_gain = gain * (0.5 - pan * 0.35)
        right_gain = gain * (0.5 + pan * 0.35)
        sfx_track_l[start_i:end_i] += s_data[:act_len] * left_gain
        sfx_track_r[start_i:end_i] += s_data[:act_len] * right_gain

    # Earshot Switch Clicks on every Atom transition (4.0s, 10.0s, 16.0s, 22.0s, 28.0s, 34.0s, 40.0s)
    switch_cues = [4.0, 10.0, 16.0, 22.0, 28.0, 34.0, 40.0]
    for idx, cue in enumerate(switch_cues):
        # Air whoosh leading in
        add_sfx('cut_hit_air.wav', cue - 0.28, gain=0.45)
        # Thick mechanical thock
        add_sfx('click_thock.wav', cue, gain=0.95, pan=-0.25 + idx * 0.08)
        # Snappy spring click
        add_sfx('click_snap.wav', cue + 0.012, gain=0.85, pan=0.15)
        # Sub punch on drop
        add_sfx('cut_hit_sub.wav', cue + 0.02, gain=0.75)

    # Playful drip_plink on Scatter Outliers & Radar Spikes
    add_sfx('drip_plink.wav', 17.8, gain=0.85, pan=0.3)
    add_sfx('drip_plink.wav', 19.2, gain=0.75, pan=-0.35)
    add_sfx('drip_plink.wav', 20.6, gain=0.80, pan=0.4)
    add_sfx('drip_plink.wav', 29.5, gain=0.70, pan=0.2)
    add_sfx('drip_plink.wav', 35.8, gain=0.70, pan=-0.25)

    # Grand Finale Downlifter
    add_sfx('downlifter_sub_sink.wav', 40.0, gain=0.85)
    add_sfx('cut_hit_air.wav', 40.2, gain=0.6)

    # 4. Final Mastering & Normalization
    print("🎚 進行多軌立體聲最終母帶混音 (Mastering)...")
    master_l = voice_track_l * 1.30 + bgm_l + sfx_track_l
    master_r = voice_track_r * 1.30 + bgm_r + sfx_track_r
    
    # Smooth fade out at the very end (44.0s - 45.0s)
    fade_start = int(43.8 * SAMPLE_RATE)
    for i in range(fade_start, TOTAL_SAMPLES):
        fade_factor = (TOTAL_SAMPLES - i) / (TOTAL_SAMPLES - fade_start)
        master_l[i] *= fade_factor
        master_r[i] *= fade_factor

    peak = max(np.max(np.abs(master_l)), np.max(np.abs(master_r)))
    print(f"混音前峰值振幅: {peak:.3f}")
    target_peak = 0.92
    norm_gain = target_peak / (peak if peak > 0 else 1.0)
    
    master_l = np.clip(master_l * norm_gain, -1.0, 1.0)
    master_r = np.clip(master_r * norm_gain, -1.0, 1.0)
    
    master_stereo = np.column_stack((master_l, master_r))
    sf.write(OUT_WAV, master_stereo, SAMPLE_RATE)
    print(f"\n✅ 混音完成！高音質 Master 音軌已寫入: {OUT_WAV}")

if __name__ == '__main__':
    main()
