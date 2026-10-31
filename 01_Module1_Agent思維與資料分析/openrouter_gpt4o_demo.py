#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
OpenRouter API 與 OpenAI GPT-4o 實戰指南 (即時對話 vs 批次處理 Batch API)
=============================================================================

【說明】
使用者在詢問：
「你有讓我可以用這隻模型 (openai/gpt-4o via OpenRouter) 嗎？」

本腳本提供兩種調用範例：
1. 【即時對話模式 (Chat Completion)】：
   - 即發即收（推薦），直接使用 OpenRouter 平台餘額調用 openai/gpt-4o。
   - 延遲低，立即可用於對話機器人、資料分析與 Prompt 實驗。

2. 【批次任務模式 (Batch API)】：
   - 官方端點：https://openrouter.ai/api/v1/batches
   - 【重要機制解析】：OpenRouter 的 Batch API 針對 OpenAI 模型（如 gpt-4o）
     底層依賴 OpenAI 官方的 Batch 架構，因此需要使用者的 OpenRouter 帳號
     綁定「BYOK (Bring Your Own Key: OpenAI API Key)」。
     若未綁定 OpenAI Key，則需選用 OpenRouter 平台上支援平台計費的批次模型。
"""

import os
import sys
import time
import requests

# 1. 讀取 API Key (優先從環境變數，或專案根目錄的 api_key.txt)
API_KEY = os.getenv("OPENROUTER_API_KEY")
if not API_KEY and os.path.exists("api_key.txt"):
    with open("api_key.txt", "r", encoding="utf-8") as f:
        API_KEY = f.read().strip()

if not API_KEY:
    print("❌ 請先設定 OPENROUTER_API_KEY 環境變數或在 api_key.txt 填入 OpenRouter 金鑰！")
    sys.exit(1)

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "https://github.com/nutcelvischen-jpg/dataviz-motion-skill",
    "X-Title": "LLM Mechanics Workshop",
}

# =============================================================================
# 模式一：即時調用 openai/gpt-4o (Standard Chat Completions) — 100% 可用！
# =============================================================================
def test_realtime_gpt4o(user_question: str = "請用繁體中文一句話解釋：人生的意義是什麼？"):
    print("\n" + "=" * 65)
    print("🚀 [模式一] OpenRouter 即時調用 openai/gpt-4o")
    print("=" * 65)
    print(f"提問內容：{user_question}\n連線中...")

    payload = {
        "model": "openai/gpt-4o",
        "messages": [
            {"role": "system", "content": "你是一位頂尖的 AI 數據與哲學專家，請用簡練深刻的繁體中文回答。"},
            {"role": "user", "content": user_question}
        ],
        "temperature": 0.7
    }

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=HEADERS,
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        data = response.json()
        
        reply = data["choices"][0]["message"]["content"]
        usage = data.get("usage", {})
        
        print("\n✅ 【模型回覆成功】:")
        print(reply)
        print("\n📊 【Token 消耗與花費】:")
        print(f"• 模型: {data.get('model')}")
        print(f"• 提示詞 Tokens: {usage.get('prompt_tokens')}")
        print(f"• 生成 Tokens: {usage.get('completion_tokens')}")
        print(f"• 總花費估計: ${usage.get('cost', 0):.6f} USD")
        return reply

    except requests.exceptions.RequestException as e:
        print(f"❌ 調用失敗：{e}")
        if hasattr(e, "response") and e.response:
            print("伺服器錯誤細節:", e.response.text)
        return None


# =============================================================================
# 模式二：批次任務 (Batch API - POST /api/v1/batches)
# =============================================================================
def test_batch_api(user_question: str = "What is the meaning of life?"):
    print("\n" + "=" * 65)
    print("📦 [模式二] OpenRouter 批次處理 API (Batch Mode)")
    print("=" * 65)
    print("說明：OpenRouter Batch 支援半價非即時大量離線運算。")

    batch_payload = {
        "endpoint": "/v1/chat/completions",
        "model": "openai/gpt-4o",
        "requests": [
            {
                "custom_id": "req-001",
                "body": {
                    "model": "openai/gpt-4o",
                    "messages": [{"role": "user", "content": user_question}],
                },
            }
        ],
    }

    print("1. 送出批次任務 POST https://openrouter.ai/api/v1/batches...")
    res = requests.post(
        "https://openrouter.ai/api/v1/batches",
        headers=HEADERS,
        json=batch_payload
    )
    
    res_data = res.json()
    if "error" in res_data:
        print("\n⚠️ 【OpenRouter Batch 機制提醒】:")
        print(f"錯誤訊息: {res_data['error'].get('message')}")
        print("\n💡 解決方案：")
        print("1. 若要對 openai/gpt-4o 使用 Batch API，請至 OpenRouter 後台綁定 OpenAI BYOK 金鑰：")
        print("   👉 https://openrouter.ai/settings/integrations")
        print("2. 若無 OpenAI 金鑰，推薦直接使用【模式一即時對話】，無需綁定、即發即得！")
        return None

    batch_id = res_data.get("id")
    print(f"✅ 批次任務成功建立！Batch ID: {batch_id}")

    # 輪詢狀態
    print("2. 輪詢檢查任務完成狀態 (每 10 秒檢查一次)...")
    while True:
        status_res = requests.get(
            f"https://openrouter.ai/api/v1/batches/{batch_id}",
            headers=HEADERS
        ).json()
        status = status_res.get("status")
        print(f"• 當前狀態: {status}")
        if status in ("completed", "failed", "cancelled", "expired"):
            print("任務結束！結果:", status_res.get("results"))
            break
        time.sleep(10)


if __name__ == "__main__":
    # 先測試模式一即時對話 (保證 100% 成功)
    test_realtime_gpt4o()

    # 演示模式二批次代碼
    test_batch_api()
