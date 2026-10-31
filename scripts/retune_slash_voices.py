import os
import subprocess
import soundfile as sf

VOICE_DIR = 'voice_slash_60s'
FFMPEG = 'bin/ffmpeg'

# Target ~7.0s - 7.2s each for 8.0s slots
for i in range(10):
    raw_pcm = os.path.join(VOICE_DIR, f"raw_{i}.pcm")
    wav_out = os.path.join(VOICE_DIR, f"vo_{i}.wav")
    
    # Check raw duration first:
    temp_wav = os.path.join(VOICE_DIR, f"temp_{i}.wav")
    subprocess.run([
        FFMPEG, "-y", "-f", "s16le", "-ar", "24000", "-ac", "1",
        "-i", raw_pcm, temp_wav
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    info = sf.info(temp_wav)
    raw_dur = info.duration
    target_dur = 7.10
    speed = raw_dur / target_dur
    
    # clamp speed to sensible range (1.20 to 1.45)
    speed = max(1.20, min(1.45, speed))
    
    subprocess.run([
        FFMPEG, "-y", "-i", temp_wav,
        "-filter:a", f"atempo={speed:.3f}",
        "-ar", "44100", "-ac", "2",
        wav_out
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    final_info = sf.info(wav_out)
    print(f"vo_{i}.wav: raw {raw_dur:.2f}s -> speed {speed:.3f}x -> final {final_info.duration:.2f}s")
    if os.path.exists(temp_wav):
        os.remove(temp_wav)
