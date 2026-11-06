#!/usr/bin/env python3
"""
ask.py
單行隨問隨答 CLI：快速向雲端 GPU 提問
用法：
  python ask.py "現在幾點？"
  python ask.py --agent "現在幾點？"
"""

import sys
import subprocess
import json
from datetime import datetime, timezone, timedelta

SESSION_NAME = "class-demo"

def main():
    if len(sys.argv) < 2:
        print("用法: python ask.py [--agent] \"你的問題\"")
        print("範例: python ask.py \"現在是西元幾年幾月幾號幾點？\"")
        print("      python ask.py --agent \"現在是西元幾年幾月幾號幾點？\"")
        sys.exit(0)

    agent_mode = "--agent" in sys.argv
    args = [a for a in sys.argv[1:] if a != "--agent"]
    prompt = " ".join(args)

    system_prompt = ""
    if agent_mode:
        tw_now = datetime.now(timezone(timedelta(hours=8))).strftime("%Y年%m月%d日 %H:%M:%S (星期%w)")
        system_prompt = f"你是一個掛載了外部感測器的 AI Agent。\n【系統即時時間工具回傳】：目前台灣標準時間是 {tw_now}。"

    prompt_json = json.dumps(prompt)
    sys_json = json.dumps(system_prompt) if agent_mode else "None"

    remote_code = f'''
prompt_text = {prompt_json}
sys_text = {sys_json}
print(query_llm(prompt_text, sys_text))
'''
    mode_label = "🤖 [Agent 模式]" if agent_mode else "🧠 [裸模型模式]"
    print(f"{mode_label} 提問: {prompt}")
    print("👉 回答:")

    try:
        subprocess.run(
            ["colab", "exec", "-s", SESSION_NAME, "--timeout", "45"],
            input=remote_code,
            text=True,
            check=True
        )
    except subprocess.CalledProcessError as e:
        print(f"錯誤: {e}")

if __name__ == "__main__":
    main()
