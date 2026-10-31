import os
import math
import numpy as np
import soundfile as sf

SR = 44100
DURATION = 38.0
TOTAL_SAMPLES = int(SR * DURATION)

# 1. 載入 4 段 Charon 配音
voice_cues = [
    {"file": "voice_charon/line_01.wav", "start": 0.5},
    {"file": "voice_charon/line_02.wav", "start": 9.3},
    {"file": "voice_charon/line_03.wav", "start": 19.3},
    {"file": "voice_charon/line_04.wav", "start": 30.0}
]

voice_track = np.zeros(TOTAL_SAMPLES, dtype=np.float32)
ducking_envelope = np.ones(TOTAL_SAMPLES, dtype=np.float32)

for item in voice_cues:
    fpath = item["file"]
    start_s = item["start"]
    if not os.path.exists(fpath):
        print(f"Warning: {fpath} not found")
        continue
    data, sr = sf.read(fpath)
    if data.ndim > 1:
        data = data.mean(axis=1)
    if sr != SR:
        # Simple resample or padding
        pass
    
    start_idx = int(start_s * SR)
    end_idx = min(start_idx + len(data), TOTAL_SAMPLES)
    length = end_idx - start_idx
    voice_track[start_idx:end_idx] += data[:length]
    
    # Ducking envelope (-7dB = 0.45 amplitude)
    pad = int(0.2 * SR)
    d_start = max(0, start_idx - pad)
    d_end = min(TOTAL_SAMPLES, end_idx + pad)
    ducking_envelope[d_start:d_end] = 0.40

# 2. 生成 118 BPM 科技脈衝背景音樂 (Pulse Synth)
BPM = 118.0
SPB = 60.0 / BPM # seconds per beat (approx 0.508s)
bgm_track = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

# 合成 118 BPM 的電子合成音階 (A minor: A1, E2, C2, D2, F2)
freqs = [55.0, 82.4, 65.4, 73.4, 87.3]
for beat in range(int(DURATION / SPB)):
    t_start = beat * SPB
    s_idx = int(t_start * SR)
    if s_idx >= TOTAL_SAMPLES:
        break
    
    # 每一拍的 Kick 鼓點 (80Hz -> 40Hz 衝擊)
    kick_len = int(0.25 * SR)
    t_k = np.linspace(0, 0.25, kick_len, endpoint=False)
    freq_sweep = 120 * np.exp(-t_k * 18) + 45
    phase = 2 * np.pi * np.cumsum(freq_sweep) / SR
    kick = np.sin(phase) * np.exp(-t_k * 12) * 0.45
    
    k_end = min(s_idx + kick_len, TOTAL_SAMPLES)
    bgm_track[s_idx:k_end] += kick[:k_end - s_idx]
    
    # 偶數拍加 Hi-hat / Shaker (高頻白噪音)
    if beat % 2 == 1:
        hh_len = int(0.08 * SR)
        hh = (np.random.rand(hh_len) * 2 - 1) * np.exp(-np.linspace(0, 1, hh_len) * 25) * 0.12
        hh_end = min(s_idx + hh_len, TOTAL_SAMPLES)
        bgm_track[s_idx:hh_end] += hh[:hh_end - s_idx]
        
    # Bass Synth Note 每小節變奏
    bar = beat // 4
    base_freq = freqs[bar % len(freqs)]
    synth_len = int(SPB * 0.85 * SR)
    t_s = np.linspace(0, SPB * 0.85, synth_len, endpoint=False)
    synth_note = (
        0.5 * np.sin(2 * np.pi * base_freq * t_s) +
        0.3 * np.sin(2 * np.pi * base_freq * 2 * t_s) +
        0.15 * np.sin(2 * np.pi * base_freq * 3 * t_s)
    ) * np.exp(-t_s * 2.5) * 0.25
    
    s_end = min(s_idx + synth_len, TOTAL_SAMPLES)
    bgm_track[s_idx:s_end] += synth_note[:s_end - s_idx]

# 平滑 ducking 包絡線
window_size = int(0.15 * SR)
ducking_envelope = np.convolve(ducking_envelope, np.ones(window_size) / window_size, mode='same')
bgm_track = bgm_track * ducking_envelope

# 3. 疊加 Earshot 物理操作音效庫
sfx_track = np.zeros(TOTAL_SAMPLES, dtype=np.float32)

def add_sfx(filename, at_sec, gain=1.0):
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
        sfx_track[s_idx:e_idx] += data[:length] * gain

# 音效時間軸對位 (配合 Treatment)
add_sfx("cut_hit_air.wav", 0.3, gain=0.6)        # 開場破空微氣流
add_sfx("cut_hit_sub.wav", 2.8, gain=0.85)       # 檔案拖曳吸附重擊
add_sfx("click_thock.wav", 3.0, gain=0.9)        # 檔案釋放鬆手開關按壓
add_sfx("click_snap.wav", 5.5, gain=0.7)         # KPI 數值爆發彈出
add_sfx("click_thock.wav", 9.2, gain=0.85)       # 游標點擊「03. 相關分佈」
add_sfx("drip_plink.wav", 11.0, gain=0.8)        # 回歸線與 Pearson R 晶片吸附
add_sfx("drip_plink.wav", 15.2, gain=0.75)       # 懸停離群值高亮水滴音
add_sfx("cut_hit_sub.wav", 19.3, gain=0.8)       # 轉化漏斗快速切換
add_sfx("click_snap.wav", 21.5, gain=0.85)       # 多維雷達切換
add_sfx("click_thock.wav", 30.2, gain=0.95)      # 點擊「匯出 1080p 圖片」
add_sfx("cut_hit_air.wav", 30.5, gain=0.7)       # 相機快門與完成提示
add_sfx("downlifter_sub_sink.wav", 34.0, gain=0.7) # 終章品牌定幀低頻下潛

# 4. 總混音 (Mastering)
master = bgm_track * 0.7 + voice_track * 1.0 + sfx_track * 0.85

# 防破音 Limiter (Soft clip)
max_val = np.max(np.abs(master))
if max_val > 0.98:
    master = master / max_val * 0.95

# 匯出至 motion_cursor_demo/assets/sound.wav
out_sound = "motion_cursor_demo/assets/sound.wav"
sf.write(out_sound, master, SR)
print(f"Master soundtrack written to: {out_sound} ({DURATION}s, {SR}Hz)")
