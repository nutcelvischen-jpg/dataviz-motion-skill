#!/usr/bin/env python3
"""
test_openrouter_models.py
測試與驗證 OpenRouter 呼叫精選多模型生態：
1. 文字對話: openai/gpt-3.5-turbo-16k
2. 高速視覺: anthropic/claude-haiku-4.5
3. 全模態旗艦: google/gemini-2.5-flash
4. 免費深度推理: nvidia/nemotron-3.5-super-vl:free (支援多輪推理延續 reasoning_details)
5. 極速多模態推理: qwen/qwen3.8-omni-flash (支援多輪推理延續 reasoning_details)
6. 歐洲旗艦視覺: mistralai/mistral-large-4-0 (文字 + 圖片辨識)
7. 開源深度思考: google/gemma-4-26b-a4b-it (支援多輪推理延續 reasoning_details)
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

def test_reasoning_multiturn(api_key: str, model_id: str, title: str):
    print("\n" + "=" * 60)
    print(f"🧪 測試 {title} ({model_id})")
    print("   👉 驗證：多輪對話深度推理延續 (reasoning_details)")
    print("=" * 60)
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nutcelvischen-jpg.github.io/dataviz-motion-skill/",
        "X-OpenRouter-Title": "LLM Learning Map",
    }
    
    # 第一輪對話：開啟 reasoning: {"enabled": True}
    print("🔹 第一輪發問: How many r's are in the word 'strawberry'?")
    payload1 = {
        "model": model_id,
        "messages": [
            {
                "role": "user",
                "content": "How many r's are in the word 'strawberry'?"
            }
        ],
        "reasoning": {"enabled": True}
    }
    
    resp1 = requests.post(
        url="https://openrouter.ai/api/v1/chat/completions",
        headers=headers,
        json=payload1,
        timeout=60
    )
    
    if not resp1.ok:
        print(f"❌ 第一輪呼叫失敗 (HTTP {resp1.status_code}): {resp1.text}")
        return
        
    data1 = resp1.json()
    msg1 = data1["choices"][0]["message"]
    print(f"  💭 思考推導 (Reasoning snippet): {str(msg1.get('reasoning', ''))[:100]}...")
    print(f"  💬 第一輪回答: {msg1.get('content')}")
    
    # 提取 reasoning_details 並無損回傳
    messages2 = [
        {"role": "user", "content": "How many r's are in the word 'strawberry'?"},
        {
            "role": "assistant",
            "content": msg1.get("content"),
            "reasoning_details": msg1.get("reasoning_details")
        },
        {"role": "user", "content": "Are you sure? Think carefully and verify."}
    ]
    
    print("🔹 第二輪追問: Are you sure? Think carefully and verify. (帶入 reasoning_details 與完整 headers)")
    payload2 = {
        "model": model_id,
        "messages": messages2,
        "reasoning": {"enabled": True}
    }
    
    resp2 = requests.post(
        url="https://openrouter.ai/api/v1/chat/completions",
        headers=headers,  # ⚠️ 注意：第二輪必須帶上 headers，否則會發生 HTTP 401 Unauthorized
        json=payload2,
        timeout=60
    )
    
    if resp2.ok:
        data2 = resp2.json()
        msg2 = data2["choices"][0]["message"]
        print(f"✅ 第二輪成功回傳 (HTTP {resp2.status_code}):")
        print(f"  💬 回答: {msg2.get('content')}")
    else:
        print(f"❌ 第二輪呼叫失敗 (HTTP {resp2.status_code}): {resp2.text}")

def test_mistral_large_vision(api_key: str):
    print("\n" + "=" * 60)
    print("🧪 測試 Mistral Large 4.0 (mistralai/mistral-large-4-0 · 視覺理解)")
    print("=" * 60)
    
    payload = {
        "model": "mistralai/mistral-large-4-0",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "What is in this image? Please answer in traditional Chinese."
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
    
    # 核心基礎三大模型
    test_gpt35_text(api_key)
    test_claude_vision(api_key)
    test_gemini_multimodal(api_key)
    
    # 新加入模型：深度推理與進階視覺
    test_reasoning_multiturn(api_key, "nvidia/nemotron-3.5-super-vl:free", "NVIDIA Nemotron 3.5 Super VL")
    test_reasoning_multiturn(api_key, "qwen/qwen3.8-omni-flash", "Qwen 3.8 Omni Flash")
    test_mistral_large_vision(api_key)
    test_reasoning_multiturn(api_key, "google/gemma-4-26b-a4b-it", "Google Gemma 4 26B A4B IT")
    
    print("\n🎉 全部測試完成！")

if __name__ == "__main__":
    main()
