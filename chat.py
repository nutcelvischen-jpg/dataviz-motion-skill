#!/usr/bin/env python3
"""
chat.py
即時互動問答：讓你隨便輸入問題，現場考考「雲端 GPU 裸模型」的極限！
支援一般裸模型模式 (Raw) 與 外掛感知模式 (/agent)。
"""

import sys
import subprocess
import json
from datetime import datetime, timezone, timedelta

SESSION_NAME = "class-demo"

def ensure_model_ready():
    """確保遠端 Colab 的 GPU 記憶體已常駐載入模型"""
    init_code = '''
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

if 'model' not in globals():
    print("⏳ 首次載入模型至遠端 GPU 記憶體中（約需 10 秒）...")
    model_id = "Qwen/Qwen2.5-7B-Instruct"
    bnb_config = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.bfloat16)
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    model = AutoModelForCausalLM.from_pretrained(model_id, quantization_config=bnb_config, device_map="auto")
    print("✅ 模型就緒！")

def query_llm(prompt, system_prompt=None):
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer([text], return_tensors="pt").to(model.device)
    with torch.no_grad():
        out = model.generate(
            **inputs, 
            max_new_tokens=256, 
            temperature=0.3, 
            do_sample=True, 
            pad_token_id=tokenizer.eos_token_id
        )
    return tokenizer.decode(out[0][inputs.input_ids.shape[1]:], skip_special_tokens=True).strip()
'''
    try:
        subprocess.run(
            ["colab", "exec", "-s", SESSION_NAME, "--timeout", "120"],
            input=init_code,
            text=True,
            check=True
        )
    except Exception:
        print(f"⚠️ 連線至 Colab session '{SESSION_NAME}' 失敗，請確認已執行 colab new -s {SESSION_NAME} --gpu L4")
        sys.exit(1)

def ask_remote(prompt: str, agent_mode: bool = False):
    """將問題送到遠端 Colab GPU 進行推論，即時串流輸出"""
    system_prompt = ""
    if agent_mode:
        tw_now = datetime.now(timezone(timedelta(hours=8))).strftime("%Y年%m月%d日 %H:%M:%S (星期%w)")
        system_prompt = f"你是一個掛載了外部感測器與 Python 計算機的 AI Agent。\n【系統即時時間工具回傳】：目前台灣標準時間是 {tw_now}。"

    prompt_json = json.dumps(prompt)
    sys_json = json.dumps(system_prompt) if agent_mode else "None"

    remote_code = f'''
prompt_text = {prompt_json}
sys_text = {sys_json}
print(query_llm(prompt_text, sys_text))
'''
    try:
        subprocess.run(
            ["colab", "exec", "-s", SESSION_NAME, "--timeout", "45"],
            input=remote_code,
            text=True,
            check=True
        )
    except subprocess.CalledProcessError as e:
        print(f"執行錯誤: {e}")

def main():
    print("=" * 65)
    print("🧠【雲端 GPU 裸模型 (缸中之腦) 即時互動終端】")
    print("=" * 65)
    print(f"連線目標：Colab Session [{SESSION_NAME}] (L4 GPU)")
    ensure_model_ready()

    print("\n💡【使用說明】：")
    print("  • 直接輸入任何問題，看「裸模型」的原始反應（如問它幾點、心算、歷史事件）。")
    print("  • 輸入 /agent 切換【裸模型】與【Agent 模式（掛載即時時鐘）】。")
    print("  • 輸入 q 或 exit 離開。\n")

    agent_mode = False

    while True:
        mode_tag = "🤖 [Agent 模式]" if agent_mode else "🧠 [裸模型模式]"
        try:
            user_input = input(f"\n{mode_tag} 請輸入您的問題 > ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\n👋 結束互動。")
            break

        if not user_input:
            continue
        if user_input.lower() in ["q", "exit", "quit"]:
            print("👋 掰掰！記得在下課前輸入 colab stop -s class-demo 關閉雲端顯卡省點數喔！")
            break
        if user_input.lower() == "/agent":
            agent_mode = not agent_mode
            status = "已開啟（掛載即時時鐘工具）" if agent_mode else "已關閉（回到無感官缸中之腦）"
            print(f"🔄 Agent 外掛模式{status}")
            continue

        print("👉 模型回答：")
        ask_remote(user_input, agent_mode)
        print("-" * 65)

if __name__ == "__main__":
    main()
