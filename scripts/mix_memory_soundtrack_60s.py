#!/usr/bin/env python3
"""
mix_memory_soundtrack_60s.py
第二集短影音母帶音軌製作（美漫波普炸裂風 · 上下文記憶與無狀態金魚腦）
1. 使用 OpenRouter Gemini 3.8 Flash TTS（Leda 音色）生成生動自然、充滿節奏感的解說旁白。
2. 導入純淨輕快動感 BGM，人聲時自動側鏈壓低（Auto-Ducking -30dB）。
3. 接入 Earshot 觸感級微動態音效（漫畫彈出、切卡、剪刀剪裁、驚嘆點擊）。
4. 輸出 master_soundtrack_memory_60s.wav (44.1kHz, 16-bit 立體聲)。
"""

import os
import subprocess
import requests
import numpy as np
import soundfile as sf

SR = 44100
DURATION = 56.0  # 56秒俐落短影音 (1680幀)
TOTAL_SAMPLES = int(SR * DURATION)

PROJECT_DIR = '/Users/chenchunchih/Desktop/數據視覺化'
OPR_KEY_FILE = os.path.join(PROJECT_DIR, 'OPR-KEY.txt')
FFMPEG = os.path.join(PROJECT_DIR, 'bin', 'ffmpeg')
OUT_WAV = os.path.join(PROJECT_DIR, 'master_soundtrack_memory_60s.wav')
VOICE_TEMP_DIR = os.path.join(PROJECT_DIR, 'voice_memory_leda')
SFX_DIR = os.path.join(PROJECT_DIR, 'earshot_sfx')
CLEAN_BED_WAV = os.path.join(PROJECT_DIR, 'music_focused_60s.wav')

os.makedirs(VOICE_TEMP_DIR, exist_ok=True)

with open(OPR_KEY_FILE, 'r', encoding='utf-8') as f:
    raw_key = f.read().strip()
    api_key = raw_key.split()[0].strip()

# 4 幕解說文案
VOICE_SCRIPTS = [
    (0, 0.5, "你有沒有想過：跟AI說『我有養一隻貓叫咪咪』，隔了幾句話問它，它居然能秒答咪咪！難道大模型真的有記憶力？"),
    (1, 13.5, "殘酷真相揭密：它根本是個零秒失憶的金魚腦！大模型本質是完全無狀態的靜態矩陣，回答完畢，記憶立刻秒清空！"),
    (2, 27.5, "那它為什麼答得出來？秘密全靠對話小抄！每次你發送新訊息，前端偷偷把過去每一輪的聊天記錄，整本重新複製貼上塞給模型！"),
    (3, 41.5, "但小抄是有極限的！對話越長，Token帳單越貴；一旦超出上下文窗口，頂部小抄被剪掉，貓咪立刻蒸發！點擊連結親自測測看！")
]

def load_or_generate_voiceovers():
    print("🎙 呼叫 OpenRouter Gemini 3.8 Flash TTS (Leda 音色) 生成第 2 集旁白...")
    url = "https://openrouter.ai/api/v1/audio/speech"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nutcelvischen-jpg.github.io/dataviz-motion-skill/",
        "X-OpenRouter-Title": "LLM Memory Context Video"
    }

    voice_track_left = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    voice_track_right = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    ducking_mask = np.ones(TOTAL_SAMPLES, dtype=np.float32)

    for idx, start_s, text in VOICE_SCRIPTS:
        pcm_path = os.path.join(VOICE_TEMP_DIR, f"raw_{idx}.pcm")
        wav_path = os.path.join(VOICE_TEMP_DIR, f"vo_{idx}.wav")

        if not os.path.exists(wav_path):
            print(f"  [幕 {idx + 1}] 請求語音生成: '{text[:18]}...'")
            resp = requests.post(url, headers=headers, json={
                "model": "google/gemini-3.8-flash-tts",
                "input": text,
                "voice": "Leda"
            }, timeout=35)

            if resp.status_code != 200:
                raise RuntimeError(f"OpenRouter TTS 錯誤: {resp.status_code} - {resp.text}")

            with open(pcm_path, "wb") as f:
                f.write(resp.content)

            cmd = [
                FFMPEG, "-y",
                "-f", "s16le", "-ar", "24000", "-ac", "1",
                "-i", pcm_path,
                "-filter:a", "atempo=1.12",
                "-ar", "44100", "-ac", "2",
                wav_path
            ]
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

        data, sr = sf.read(wav_path)
        dur = len(data) / sr
        print(f"  ✅ 幕 {idx + 1} 旁白載入成功 (時長: {dur:.2f}s)")

        s_idx = int(start_s * SR)
        e_idx = min(TOTAL_SAMPLES, s_idx + len(data))
        seg_len = e_idx - s_idx

        # 人聲飽滿清晰 (+2.5 dB)
        voice_track_left[s_idx:e_idx] += data[:seg_len, 0] * 1.55
        voice_track_right[s_idx:e_idx] += data[:seg_len, 1] * 1.55

        # 人聲時背景清襯樂極度微弱 (-32dB)
        pad = int(0.25 * SR)
        d_start = max(0, s_idx - pad)
        d_end = min(TOTAL_SAMPLES, e_idx + pad)
        fade_len = int(0.15 * SR)

        for i in range(d_start, d_end):
            if i < d_start + fade_len:
                p = (i - d_start) / fade_len
                ducking_mask[i] = min(ducking_mask[i], 1.0 - p * 0.96)
            elif i > d_end - fade_len:
                p = (d_end - i) / fade_len
                ducking_mask[i] = min(ducking_mask[i], 1.0 - p * 0.96)
            else:
                ducking_mask[i] = min(ducking_mask[i], 0.04)

    return voice_track_left, voice_track_right, ducking_mask

def load_sfx_sample(name):
    path = os.path.join(SFX_DIR, f"{name}.wav")
    if os.path.exists(path):
        data, sr = sf.read(path)
        if sr != SR:
            return None
        if len(data.shape) == 1:
            data = np.stack([data, data], axis=-1)
        return data
    return None

def main():
    print("=== 開始製作《第 2 集 · 上下文記憶與無狀態金魚腦》母帶音軌 ===")
    vo_left, vo_right, ducking_mask = load_or_generate_voiceovers()

    # 1. 載入輕快背景樂
    bg_left = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
    bg_right = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

    if os.path.exists(CLEAN_BED_WAV):
        bed_data, b_sr = sf.read(CLEAN_BED_WAV)
        if len(bed_data.shape) == 1:
            bed_data = np.stack([bed_data, bed_data], axis=-1)
        bed_len = min(TOTAL_SAMPLES, len(bed_data))
        base_gain = 0.08
        bg_left[:bed_len] = bed_data[:bed_len, 0] * base_gain * ducking_mask[:bed_len]
        bg_right[:bed_len] = bed_data[:bed_len, 1] * base_gain * ducking_mask[:bed_len]

    # 2. 混入 Earshot 漫畫微動效音
    sfx_cut = load_sfx_sample("cut_hit_air")
    sfx_click = load_sfx_sample("click_thock")
    sfx_snap = load_sfx_sample("click_snap")
    sfx_plink = load_sfx_sample("drip_plink")

    sfx_hits = [
        (0.4, sfx_cut, 0.40),
        (3.5, sfx_click, 0.35),
        (8.5, sfx_snap, 0.35),
        (13.4, sfx_cut, 0.45),
        (17.5, sfx_click, 0.35),
        (22.0, sfx_snap, 0.35),
        (27.4, sfx_cut, 0.45),
        (32.0, sfx_click, 0.35),
        (37.0, sfx_snap, 0.35),
        (41.4, sfx_cut, 0.45),
        (46.0, sfx_click, 0.35),
        (51.0, sfx_plink, 0.50)
    ]

    for hit_time, sfx_data, gain in sfx_hits:
        if sfx_data is not None:
            s_idx = int(hit_time * SR)
            e_idx = min(TOTAL_SAMPLES, s_idx + len(sfx_data))
            l = e_idx - s_idx
            bg_left[s_idx:e_idx] += sfx_data[:l, 0] * gain
            bg_right[s_idx:e_idx] += sfx_data[:l, 1] * gain

    # 3. 混音總輸出
    master_left = vo_left + bg_left
    master_right = vo_right + bg_right

    peak = max(np.max(np.abs(master_left)), np.max(np.abs(master_right)))
    if peak > 0.95:
        norm = 0.95 / peak
        master_left *= norm
        master_right *= norm

    out_stereo = np.stack([master_left, master_right], axis=-1)
    sf.write(OUT_WAV, out_stereo, SR, subtype='PCM_16')
    print(f"\n🎉 第 2 集母帶音軌生成完成: {OUT_WAV}")

if __name__ == '__main__':
    main()
