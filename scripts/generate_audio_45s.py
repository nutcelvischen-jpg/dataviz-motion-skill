#!/usr/bin/env python3
"""
Procedural 45-second Soundtrack Generator for Data Analytics Atoms
Tempo: 120 BPM (1 beat = 0.5s)
Sample Rate: 44100 Hz, 16-bit Stereo WAV
"""

import wave
import struct
import math
import random

SAMPLE_RATE = 44100
DURATION = 45.0 # Exactly 45.0 seconds
TOTAL_SAMPLES = int(SAMPLE_RATE * DURATION)
BPM = 120.0
BEAT_LEN = 60.0 / BPM # 0.5s

def generate_track(output_path):
    print("Generating 45-second procedural soundtrack (120 BPM stereo)...")
    
    left = [0.0] * TOTAL_SAMPLES
    right = [0.0] * TOTAL_SAMPLES
    
    total_beats = int(DURATION / BEAT_LEN) # 90 beats
    
    # Chord Map across 45 seconds:
    # 0.0 - 4.0s:  Fm (Raw Intro)
    # 4.0 - 10.0s: Fm -> Dbmaj7 (Bar Comparison)
    # 10.0 - 16.0s: Bbm7 -> Eb7 (Line Trend)
    # 16.0 - 22.0s: Abmaj7 -> C7 (Scatter Correlation)
    # 22.0 - 28.0s: Dbmaj7 -> Bbm9 (Donut Composition)
    # 28.0 - 34.0s: Eb7 -> Fm9 (Radar Profile)
    # 34.0 - 40.0s: Dbmaj7 -> Eb -> Fm (Sankey Flow)
    # 40.0 - 45.0s: F(add9) / C resolve (Grand Finale)
    
    chord_map = [
        (0.0, 4.0, [174.61, 261.63, 311.13, 349.23]),
        (4.0, 7.0, [174.61, 220.00, 261.63, 349.23]),
        (7.0, 10.0, [138.59, 207.65, 261.63, 329.63]),
        (10.0, 13.0, [116.54, 174.61, 233.08, 277.18]),
        (13.0, 16.0, [155.56, 233.08, 311.13, 369.99]),
        (16.0, 19.0, [207.65, 261.63, 311.13, 392.00]),
        (19.0, 22.0, [130.81, 196.00, 261.63, 329.63]),
        (22.0, 25.0, [138.59, 207.65, 261.63, 329.63]),
        (25.0, 28.0, [116.54, 174.61, 233.08, 311.13]),
        (28.0, 31.0, [155.56, 233.08, 311.13, 392.00]),
        (31.0, 34.0, [174.61, 220.00, 261.63, 349.23]),
        (34.0, 37.0, [138.59, 207.65, 261.63, 349.23]),
        (37.0, 40.0, [155.56, 233.08, 311.13, 392.00]),
        (40.0, 45.0, [174.61, 261.63, 349.23, 440.00])
    ]
    
    # 1. Warm Minimalist Electric Piano / Pad
    for start_s, end_s, freqs in chord_map:
        start_samp = int(start_s * SAMPLE_RATE)
        end_samp = min(TOTAL_SAMPLES, int(end_s * SAMPLE_RATE))
        dur_samp = end_samp - start_samp
        
        for i in range(dur_samp):
            t = (start_samp + i) / SAMPLE_RATE
            env = 1.0
            if i < SAMPLE_RATE * 0.2:
                env = i / (SAMPLE_RATE * 0.2)
            elif i > dur_samp - SAMPLE_RATE * 0.2:
                env = (dur_samp - i) / (SAMPLE_RATE * 0.2)
                
            sample_val = 0.0
            for f in freqs:
                # Gentle warm bell/piano tone
                sample_val += math.sin(2 * math.pi * f * t) * 0.45
                sample_val += math.sin(2 * math.pi * (f * 2.001) * t) * 0.15
                sample_val += math.sin(2 * math.pi * (f * 0.5) * t) * 0.35 # Sub
                
            sample_val = (sample_val / (len(freqs) * 1.1)) * 0.24 * env
            left[start_samp + i] += sample_val * 0.95
            right[start_samp + i] += sample_val * 1.05

    # 2. Percussion Grid (120 BPM)
    for b in range(total_beats):
        beat_t = b * BEAT_LEN
        beat_samp = int(beat_t * SAMPLE_RATE)
        if beat_samp >= TOTAL_SAMPLES:
            break
            
        # Clean minimalist kick drum: every 1.0s (or 4-on-floor in middle sections)
        has_kick = False
        if beat_t >= 4.0 and beat_t < 40.0:
            if beat_t >= 16.0 and beat_t < 34.0:
                has_kick = True # Four on the floor
            else:
                has_kick = (b % 2 == 0) # Half-time
                
        if has_kick:
            kick_dur = int(0.25 * SAMPLE_RATE)
            for i in range(kick_dur):
                if beat_samp + i >= TOTAL_SAMPLES: break
                progress = i / kick_dur
                pitch = 36.0 + 110.0 * math.exp(-progress * 15.0)
                phase = 2 * math.pi * pitch * (i / SAMPLE_RATE)
                env = math.exp(-progress * 10.0)
                val = math.sin(phase) * env * 0.52
                if i < 100:
                    val += (random.random() * 2 - 1) * 0.15 * (1 - i / 100)
                left[beat_samp + i] += val
                right[beat_samp + i] += val
                
        # Snappy rimshot / snare on beats 1 and 3
        if beat_t >= 10.0 and beat_t < 40.0 and (b % 2 == 1):
            snare_dur = int(0.12 * SAMPLE_RATE)
            for i in range(snare_dur):
                if beat_samp + i >= TOTAL_SAMPLES: break
                progress = i / snare_dur
                noise = (random.random() * 2 - 1) * math.exp(-progress * 24.0) * 0.18
                body = math.sin(2 * math.pi * 210 * (i / SAMPLE_RATE)) * math.exp(-progress * 28.0) * 0.22
                val = noise + body
                left[beat_samp + i] += val * 0.9
                right[beat_samp + i] += val * 1.1
                
        # Subtle crisp Shaker (16th notes feel)
        if beat_t >= 4.0 and beat_t < 41.0:
            for sub in [0, 0.25]:
                h_samp = int((beat_t + sub) * SAMPLE_RATE)
                if h_samp >= TOTAL_SAMPLES: break
                h_dur = int(0.035 * SAMPLE_RATE)
                for i in range(h_dur):
                    if h_samp + i >= TOTAL_SAMPLES: break
                    env = (1 - i / h_dur) ** 2
                    noise = (random.random() * 2 - 1) * env * 0.075
                    left[h_samp + i] += noise * 0.8
                    right[h_samp + i] += noise * 1.2

    # 3. Dedicated Switch Mechanical Click & Tonal Pop on Atom Transitions
    # Exact atom toggle seconds: 4.0s, 10.0s, 16.0s, 22.0s, 28.0s, 34.0s, 40.0s
    switch_times = [4.0, 10.0, 16.0, 22.0, 28.0, 34.0, 40.0]
    for st in switch_times:
        s_samp = int(st * SAMPLE_RATE)
        
        # Whoosh riser leading into the switch (0.3s before)
        r_dur = int(0.28 * SAMPLE_RATE)
        r_start = max(0, s_samp - r_dur)
        for i in range(s_samp - r_start):
            p = i / r_dur
            pitch = 180 + p * 550
            phase = 2 * math.pi * pitch * (i / SAMPLE_RATE)
            noise = (random.random() * 2 - 1) * 0.4
            val = (math.sin(phase) * 0.4 + noise) * (p ** 2.2) * 0.16
            left[r_start + i] += val
            right[r_start + i] += val
            
        # Crisp Mechanical UI Switch Click (Click + Spring Thump)
        click_dur = int(0.08 * SAMPLE_RATE)
        for i in range(click_dur):
            if s_samp + i >= TOTAL_SAMPLES: break
            p = i / click_dur
            # High click
            click = (random.random() * 2 - 1) * math.exp(-p * 45.0) * 0.45
            # Resonant snap tone (880Hz or 1046Hz)
            snap = math.sin(2 * math.pi * 920 * (i / SAMPLE_RATE)) * math.exp(-p * 30.0) * 0.35
            val = click + snap
            left[s_samp + i] += val * 1.05
            right[s_samp + i] += val * 0.95
            
        # Resonant Harmonic Chime
        chime_dur = int(0.6 * SAMPLE_RATE)
        for i in range(chime_dur):
            if s_samp + i >= TOTAL_SAMPLES: break
            p = i / chime_dur
            env = math.exp(-p * 7.5)
            chime = math.sin(2 * math.pi * 1046.50 * (i / SAMPLE_RATE)) * env * 0.14
            chime += math.sin(2 * math.pi * 1318.51 * (i / SAMPLE_RATE)) * env * 0.09
            left[s_samp + i] += chime * 1.1
            right[s_samp + i] += chime * 0.9

    # Master Normalization
    max_amp = 0.001
    for i in range(TOTAL_SAMPLES):
        max_amp = max(max_amp, abs(left[i]), abs(right[i]))
        
    print(f"Peak amplitude before normalization: {max_amp:.3f}")
    target_peak = 0.88
    gain = target_peak / max_amp
    
    with wave.open(output_path, 'wb') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        
        frames = bytearray()
        for i in range(TOTAL_SAMPLES):
            if i > TOTAL_SAMPLES - int(SAMPLE_RATE * 1.2):
                fade = (TOTAL_SAMPLES - i) / (SAMPLE_RATE * 1.2)
            else:
                fade = 1.0
                
            l_val = int(clamp(left[i] * gain * fade, -1.0, 1.0) * 32767)
            r_val = int(clamp(right[i] * gain * fade, -1.0, 1.0) * 32767)
            frames.extend(struct.pack('<hh', l_val, r_val))
            
        wav.writeframes(frames)
        
    print(f"Successfully generated 45s soundtrack: {output_path}")

def clamp(v, min_v, max_v):
    return max(min_v, min(max_v, v))

if __name__ == "__main__":
    generate_track("<HOME>/.gemini/antigravity/scratch/dataviz-motion-atoms-45s/soundtrack_45s.wav")
