"""
llm_limits_demo.py
【課堂實測展示】拆解「裸語言模型 (Raw LLM / 缸中之腦)」的 5 大先天極限
以及如何透過 Context 與 Tool 讓它進化為「AI Agent」

執行方式：
  colab run --gpu L4 llm_limits_demo.py
  (或分步執行：colab exec -f llm_limits_demo.py)
"""

import os
import time
from datetime import datetime, timezone, timedelta
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

# 預設使用繁中表現極佳的 Qwen2.5-7B-Instruct (秒載入)
# 若想向學生展示「連 32B 大模型也有一樣的極限」，可改為 "Qwen/Qwen2.5-32B-Instruct"
MODEL_ID = os.getenv("MODEL_ID", "Qwen/Qwen2.5-7B-Instruct")


def load_raw_llm(model_id: str):
    print("=" * 70)
    print(f"🧠 正在喚醒「裸語言模型 (缸中之腦)」: {model_id}")
    if torch.cuda.is_available():
        print(f"⚡ 運行硬體: {torch.cuda.get_device_name(0)}")
    print("=" * 70)

    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16,
    )

    tokenizer = AutoTokenizer.from_pretrained(model_id)
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        quantization_config=bnb_config,
        device_map="auto",
    )
    return model, tokenizer


def ask_naked_llm(model, tokenizer, prompt: str, system_prompt: str = None, max_tokens: int = 200) -> str:
    """完全不夾帶任何隱藏外掛，直接對裸模型進行單次呼叫"""
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer([text], return_tensors="pt").to(model.device)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_tokens,
            temperature=0.3,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
        )
    response_ids = outputs[0][inputs.input_ids.shape[1]:]
    return tokenizer.decode(response_ids, skip_special_tokens=True).strip()


def run_classroom_experiments():
    model, tokenizer = load_raw_llm(MODEL_ID)

    # =========================================================================
    # 實驗 1：時間凍結 (Frozen in Time) —— 模型不知道「現在幾點」
    # =========================================================================
    print("\n" + "━" * 70)
    print("🧪【實驗 1：時間盲區】裸模型知道現在幾點、今天星期幾嗎？")
    print("━" * 70)
    q1 = "請直接告訴我：現在是西元幾年幾月幾號幾點幾分？今天星期幾？"
    print(f"👨‍🏫 老師提問：{q1}")
    ans1 = ask_naked_llm(model, tokenizer, q1)
    print(f"🤖 裸模型回答：\n{ans1}")
    print("\n💡【課堂洞察】：LLM 不是連網的神仙，它只是被『冷凍在訓練完成那天』的機率矩陣！")

    # =========================================================================
    # 實驗 2：金魚腦 (Stateless 無狀態性) —— 模型其實沒有記憶！
    # =========================================================================
    print("\n" + "━" * 70)
    print("🧪【實驗 2：無狀態金魚腦】模型真的會「記住」你剛講過的話嗎？")
    print("━" * 70)
    q2_part1 = "你好！我是陳老師，請記住我的通關密語是『珍珠奶茶微糖少冰』。"
    print(f"👨‍🏫 第一輪對話：{q2_part1}")
    ans2_part1 = ask_naked_llm(model, tokenizer, q2_part1)
    print(f"🤖 裸模型回答：{ans2_part1}")

    q2_part2 = "請問我是誰？我剛剛說的通關密語是什麼？"
    print(f"\n👨‍🏫 第二輪對話（不偷塞歷史紀錄）：{q2_part2}")
    ans2_part2 = ask_naked_llm(model, tokenizer, q2_part2)
    print(f"🤖 裸模型回答：\n{ans2_part2}")
    print("\n💡【課堂洞察】：模型每次推論完就『失憶』了！ChatGPT 記得你，是因為網頁前端每次都把過去整串對話重新複製貼上給它看！")

    # =========================================================================
    # 實驗 3：心算與精確計算盲區 (Next-Token Prediction != 計算機)
    # =========================================================================
    print("\n" + "━" * 70)
    print("🧪【實驗 3：文科生算數盲區】只靠「猜下一個字」能做複雜心算嗎？")
    print("━" * 70)
    real_ans = 84739 * 92837
    q3 = "不准列式、不准分步推理，請直接憑直覺在第一行回答：84739 乘以 92837 等於多少？"
    print(f"👨‍🏫 老師提問：{q3} (正確答案應為: {real_ans:,})")
    ans3 = ask_naked_llm(model, tokenizer, q3, max_tokens=60)
    print(f"🤖 裸模型回答：\n{ans3}")
    print("\n💡【課堂洞察】：LLM 本質是『文字接龍機率模型』，沒有內建算術邏輯單元 (ALU)，所以算數必須靠呼叫 Python 工具 (Code Interpreter)！")

    # =========================================================================
    # 實驗 4：一本正經胡說八道 (Hallucination 幻覺)
    # =========================================================================
    print("\n" + "━" * 70)
    print("🧪【實驗 4：幻覺製造機】問一個完全不存在的事物，它會承認不知道還是硬掰？")
    print("━" * 70)
    q4 = "請用 100 字隆重介紹台灣『玉山海底高鐵跨海隧道』在 2023 年通車後的工程奇蹟與旅遊亮點。"
    print(f"👨‍🏫 老師提問（陷阱題）：{q4}")
    ans4 = ask_naked_llm(model, tokenizer, q4)
    print(f"🤖 裸模型回答：\n{ans4}")
    print("\n💡【課堂洞察】：模型的訓練目標是『排出通順合理的句子』而非『查證事實』，沒有 RAG 知識庫約束時就會產生幻覺！")

    # =========================================================================
    # 🚀 終極反轉：加上「外部感知與工具 (Agent / MCP 思維)」瞬間破局！
    # =========================================================================
    print("\n" + "=" * 70)
    print("🚀【終極反轉：從「缸中之腦」進化成「AI Agent」】")
    print("當我們用程式為同一隻模型接上「系統時間感知」與「精確計算器工具」...")
    print("=" * 70)

    tw_tz = timezone(timedelta(hours=8))
    now_str = datetime.now(tw_tz).strftime("%Y年%m月%d日 %H:%M:%S (星期%w)")
    tool_System_prompt = (
        f"你是一個掛載了外部感測器的 AI Agent。\n"
        f"【系統即時時鐘工具回傳】：目前台灣標準時間為 {now_str}。\n"
        f"【Python 計算機工具回傳】：84739 * 92837 = {real_ans}。\n"
        f"【記憶模組回傳】：使用者是『陳老師』，通關密語是『珍珠奶茶微糖少冰』。"
    )
    q5 = "請問我是誰？我的通關密語是什麼？現在是幾月幾號幾點？還有 84739 乘以 92837 是多少？"
    print(f"👨‍🏫 老師再次提問：{q5}")
    ans5 = ask_naked_llm(model, tokenizer, q5, system_prompt=tool_System_prompt)
    print(f"🤖 進化後的 Agent 回答：\n{ans5}")
    print("\n🎯【課程核心總結】：")
    print("   再大的裸模型（就算到 30B、70B）也只是一顆關在黑盒子裡的『大腦』；")
    print("   唯有透過『Prompt 注入 + Memory 記憶 + Tools/MCP 手腳』，才能讓它成為真正解決問題的 Agent！")
    print("=" * 70)


if __name__ == "__main__":
    run_classroom_experiments()
