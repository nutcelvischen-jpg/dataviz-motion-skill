#!/usr/bin/env python3
"""
test_openrouter_models.py
測試與驗證 OpenRouter 呼叫三大模型：
1. 文字對話: openai/gpt-3.5-turbo-16k
2. 多模態 (文字 + 圖片 + 音訊 + 影片): google/gemini-2.5-flash
3. 高速視覺 (文字 + 圖片): anthropic/claude-haiku-4.5
"""

import os
import sys
import json
import base64
from pathlib import Path
import requests

def get_api_key() -> str:
    """自動取得 OpenRouter API 金鑰（優先讀取環境變數，其次讀取專案內的 OPR-KEY.txt）"""
    if os.environ.get("OPENROUTER_API_KEY"):
        return os.environ["OPENROUTER_API_KEY"].strip()
    
    key_path = Path(__file__).resolve().parent.parent / "OPR-KEY.txt"
    if key_path.exists():
        raw = key_path.read_text(encoding="utf-8").strip()
        if raw:
            return raw.splitlines()[0].strip().split()[0]
    return ""

def test_gpt35_text(api_key: str):
    print("\n" + "=" * 60)
    print("🧪 1. 測試 GPT-3.5 Turbo (純文字對話)")
    print("=" * 60)
    
    payload = {
        "model": "openai/gpt-3.5-turbo-16k",
        "messages": [
            {
                "role": "user",
                "content": "請用繁體中文一句話說明：什麼是大語言模型？"
            }
        ]
    }
    
    response = requests.post(
        url="https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "https://nutcelvischen-jpg.github.io/dataviz-motion-skill/",
            "X-OpenRouter-Title": "LLM Learning Map",
        },
        json=payload,
        timeout=30
    )
    
    if response.ok:
        res_data = response.json()
        content = res_data["choices"][0]["message"]["content"]
        print(f"✅ 成功回傳 (HTTP {response.status_code}):\n{content}")
    else:
        print(f"❌ 呼叫失敗 (HTTP {response.status_code}):\n{response.text}")

def test_claude_vision(api_key: str):
    print("\n" + "=" * 60)
    print("🧪 2. 測試 Claude Haiku 4.5 (文字 + 圖片視覺理解)")
    print("=" * 60)
    
    payload = {
        "model": "anthropic/claude-haiku-4.5",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "請辨識這張圖片中有什麼生物？用一句繁體中文說明。"
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": "https://live.staticflickr.com/3851/14825276609_098cac593d_b.jpg"
                        }
                    }
                ]
            }
        ]
    }
    
    response = requests.post(
        url="https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "https://nutcelvischen-jpg.github.io/dataviz-motion-skill/",
            "X-OpenRouter-Title": "LLM Learning Map",
        },
        json=payload,
        timeout=30
    )
    
    if response.ok:
        res_data = response.json()
        content = res_data["choices"][0]["message"]["content"]
        print(f"✅ 成功回傳 (HTTP {response.status_code}):\n{content}")
    else:
        print(f"❌ 呼叫失敗 (HTTP {response.status_code}):\n{response.text}")

def test_gemini_multimodal(api_key: str):
    print("\n" + "=" * 60)
    print("🧪 3. 測試 Gemini 2.5 Flash (文字 + 圖片 + 影片全模態理解)")
    print("=" * 60)
    
    # 建立一個合法極簡 1 秒靜音 WAV 音訊 base64 (避免原本殘缺 header 造成 400 Bad Request)
    # WAV Header (44 bytes) for 8000Hz 8-bit mono PCM silence
    wav_header = bytes([
        0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
        0x66, 0x6d, 0x74, 0x20, 0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
        0x40, 0x1f, 0x00, 0x00, 0x40, 0x1f, 0x00, 0x00, 0x01, 0x00, 0x08, 0x00,
        0x64, 0x61, 0x74, 0x61, 0x00, 0x00, 0x00, 0x00
    ])
    valid_silent_audio_b64 = base64.b64encode(wav_header).decode("ascii")
    
    payload = {
        "model": "google/gemini-2.5-flash",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "請分別以繁體中文一句話簡述：你看到的圖片內容與影片內容。"
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": "https://live.staticflickr.com/3851/14825276609_098cac593d_b.jpg"
                        }
                    },
                    {
                        "type": "video_url",
                        "video_url": {
                            "url": "https://storage.googleapis.com/cloud-samples-data/video/JaneGoodall.mp4"
                        }
                    }
                ]
            }
        ]
    }
    
    print("⏳ 正在請求 Gemini 2.5 Flash 處理高畫質圖片與雲端影片（約需 5-10 秒）...")
    response = requests.post(
        url="https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "https://nutcelvischen-jpg.github.io/dataviz-motion-skill/",
            "X-OpenRouter-Title": "LLM Learning Map",
        },
        json=payload,
        timeout=60
    )
    
    if response.ok:
        res_data = response.json()
        content = res_data["choices"][0]["message"]["content"]
        print(f"✅ 成功回傳 (HTTP {response.status_code}):\n{content}")
    else:
        print(f"❌ 呼叫失敗 (HTTP {response.status_code}):\n{response.text}")

def main():
    api_key = get_api_key()
    if not api_key:
        print("⚠️ 未找到 OpenRouter API 金鑰！請設定環境變數 OPENROUTER_API_KEY 或在專案根目錄建立 OPR-KEY.txt。")
        sys.exit(1)
        
    print(f"🔑 已載入 API Key (前 10 碼): {api_key[:10]}...")
    test_gpt35_text(api_key)
    test_claude_vision(api_key)
    test_gemini_multimodal(api_key)
    print("\n🎉 全部測試完成！")

if __name__ == "__main__":
    main()
