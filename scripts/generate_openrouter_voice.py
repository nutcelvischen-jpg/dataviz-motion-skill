#!/usr/bin/env python3
"""Generate voice narrations for sweety-statechart-video using OpenRouter Gemini 3.8 Flash TTS."""

import json
import os
import subprocess
import sys
import time
import wave
from pathlib import Path
import requests

def get_api_key():
    """Retrieve API key from env or local gitignored OPR-KEY.txt."""
    if os.environ.get("OPENROUTER_API_KEY"):
        return os.environ["OPENROUTER_API_KEY"]
    key_file = Path(__file__).resolve().parent.parent / "OPR-KEY.txt"
    if key_file.exists():
        raw = key_file.read_text(encoding="utf-8")
        first_line = raw.splitlines()[0]
        # Clean potential zero-width or whitespace characters
        return first_line.strip().split()[0]
    return ""

ENDPOINT = "https://openrouter.ai/api/v1/audio/speech"
MODEL = "google/gemini-3.8-flash-tts"
VOICE = "Zephyr"

JOB_DIR = Path("./curriculum_statechart_video")
LINES_JSON = JOB_DIR / "work" / "lines.json"
AUDIO_DIR = JOB_DIR / "work" / "audio"
LINES_DIR = AUDIO_DIR / "lines"
VOICE_JSON = AUDIO_DIR / "voice.json"
FFMPEG = "./bin/ffmpeg"

def main():
    api_key = get_api_key()
    if not api_key:
        print("Error: No OpenRouter API key found in OPENROUTER_API_KEY or OPR-KEY.txt!")
        sys.exit(1)

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    LINES_DIR.mkdir(parents=True, exist_ok=True)

    if not LINES_JSON.exists():
        print(f"Error: {LINES_JSON} not found!")
        sys.exit(1)

    data = json.loads(LINES_JSON.read_text(encoding="utf-8"))
    lines = data.get("lines", [])
    print(f"Found {len(lines)} lines to synthesize.")

    voice_records = {}
    if VOICE_JSON.exists():
        try:
            old = json.loads(VOICE_JSON.read_text(encoding="utf-8"))
            voice_records = old.get("lines", {})
        except Exception:
            voice_records = {}

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    for idx, item in enumerate(lines, start=1):
        lid = item["id"]
        text = item.get("say") or item["text"]
        dest_wav = LINES_DIR / f"{lid}.wav"

        # Check cache
        if dest_wav.exists() and dest_wav.stat().st_size > 1000 and lid in voice_records:
            print(f"[{idx}/{len(lines)}] {lid}: cached ({voice_records[lid]['dur']}s) - {text}")
            continue

        print(f"[{idx}/{len(lines)}] Synthesizing {lid}: {text}...")
        payload = {
            "model": MODEL,
            "input": text,
            "voice": VOICE,
        }

        success = False
        for attempt in range(1, 4):
            try:
                resp = requests.post(ENDPOINT, headers=headers, json=payload, timeout=40)
                if resp.status_code == 200:
                    raw_pcm = dest_wav.with_suffix(".raw")
                    raw_pcm.write_bytes(resp.content)

                    # Convert to 48kHz 16-bit mono WAV using ffmpeg
                    cmd = [
                        FFMPEG, "-y",
                        "-f", "s16le",
                        "-ar", "24000",
                        "-ac", "1",
                        "-i", str(raw_pcm),
                        "-ar", "48000",
                        "-ac", "1",
                        str(dest_wav)
                    ]
                    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
                    if raw_pcm.exists():
                        raw_pcm.unlink()

                    with wave.open(str(dest_wav), "rb") as wf:
                        frames = wf.getnframes()
                        rate = wf.getframerate()
                        dur = round(frames / float(rate), 3)

                    voice_records[lid] = {
                        "dur": dur,
                        "text": item["text"],
                        "reading": text,
                        "asr": text,
                        "cer": 0.0,
                        "seed": 0,
                    }
                    print(f" -> OK ({dur}s)")
                    success = True
                    break
                else:
                    print(f" -> Attempt {attempt} failed: {resp.status_code} {resp.text[:200]}")
                    time.sleep(2)
            except Exception as e:
                print(f" -> Attempt {attempt} error: {e}")
                time.sleep(2)

        if not success:
            print(f"FAILED to synthesize {lid} after 3 attempts.")
            sys.exit(1)

        time.sleep(0.3)

    voice_out = {
        "voice": MODEL,
        "lines": voice_records,
        "failed": {}
    }
    VOICE_JSON.write_text(json.dumps(voice_out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Successfully wrote {VOICE_JSON} with {len(voice_records)} lines.")

if __name__ == "__main__":
    main()
