# LLM 舊版與新版內容對照

檢查日期：2026-11-01

## 怎麼檢查

以 `dist_public_web/index.html`、`lab.html`、`memory.html`、`security.html`、`metro.html` 和 `mobile.html` 為舊版基準，逐項對照新版圖鑑、實驗室、圖解、案例、手機入口、六個專題頁與其資料檔；再比對同資料夾內較早的 `00_LLM_Token與模型全景圖譜.html`。檢查包括主要章節、概念卡、實驗項目與預設、圖解、案例和手機分頁，也查看有沒有保留舊模型卡、價格資料與矩陣。

較早的圖鑑少了後來增加的前沿研究章節；比對文字時，先前「微調／Unsloth」區塊在新版基準中換了位置，內容仍收在[模型適應專題](../topics/model-adaptation.html#s2)。較早的實驗室與舊 `lab.html` 相同；舊記憶、API 安全及北捷案例頁也分別與同名原始圖解檔相同。

本表中的「補回」是補回重要概念或例子，並非宣稱逐字復原或已核實舊教材的每一句話。舊資料中的具體模型、價格、事件和研究結論仍應以原始來源及日期另行查證。

## 舊圖鑑的八個主要區塊

| 舊版內容 | 新版位置與處理 |
|---|---|
| [基礎概念與兩個直覺圖解](../dist_public_web/index.html#glossary) | [模型與資料](../encyclopedia.html#glossary)、[分詞](../encyclopedia.html#token-visualizer-card)、[取樣](../encyclopedia.html#sampling)、[即時資訊](../encyclopedia.html#time-awareness)、[上下文](../encyclopedia.html#context)；細項見下表。 |
| [API 試演、用量與價格](../dist_public_web/index.html#pricing) | [成本與 Usage](../encyclopedia.html#pricing)、[API 試演](../encyclopedia.html#api-trial)。保留 11 筆原教材費率資料及兩種費率切換；舊價格矩陣在展開區，數值待核對。 |
| [模型卡與規格比較](../dist_public_web/index.html#models) | [模型比較](../encyclopedia.html#models)保留 10 張原模型卡的內容及舊規格矩陣，模型細節可以展開；名稱及分類均標示待核對。MoE 另有[獨立解說](../encyclopedia.html#moe)與[舊版圖解](../topics/model-adaptation.html#s3)。 |
| [雲端與本機部署](../dist_public_web/index.html#cloud-vs-local) | [雲端與本機](../encyclopedia.html#cloud-vs-local)，舊部署圖與硬體矩陣在展開區。 |
| [Agent 演進、工作時間與產品比較](../dist_public_web/index.html#agent-evolution) | [Agent 與 Loop](../encyclopedia.html#agent-evolution)、[工具與協作名詞](../encyclopedia.html#agent-terms)、[工作時間與限制](../encyclopedia.html#agent-operation)，完整舊敘述與五個產品比較頁籤在 [Agent 生態專題](../topics/agent-ecosystem.html)。 |
| [AI 與總體經濟](../dist_public_web/index.html#macro-economy) | [AI 與經濟專題](../topics/ai-economy.html)，將舊觀測、推演與政策內容放在選讀並標示待核對。 |
| [模型蒸餾攻擊與防禦](../dist_public_web/index.html#distillation-security) | [模型蒸餾專題](../topics/model-distillation.html)；基本「知識蒸餾」另放回[模型與資料](../encyclopedia.html#knowledge-methods)，並區分合法訓練方法與資料使用邊界。 |
| [前沿研究、世界模型與算力](../dist_public_web/index.html#world-models-math-space) | [前沿研究專題](../topics/frontier-research.html)；Computer Use 基礎說明回到[圖形與介面](../encyclopedia.html#graphic-ui)。 |

原模型規格、其他價格資料及部署硬體矩陣均保留於對應展開區，並非已更新的市場指南。Agent 越界事件另外集中於[代理人事件專題](../topics/agent-incidents.html)，舊案例和主張待核對。

## 舊版基礎概念卡與兩個直覺圖解

舊版標題寫「9 大核心基石」，實際可識別的 `.concept-card` 為以下八張。新版名詞區現分為「模型與資料、提示詞與上下文、Agent 與工具、安全與查證、圖形與介面」五組，名詞可以點進詳細段落。

| 舊概念／圖解 | 比對結果與新版位置 |
|---|---|
| LLM、模型參數與逐步生成 | 原理已有；本次在 [LLM 如何回答](../encyclopedia.html#glossary)補明預訓練參數與一次請求上下文的差別。 |
| Token、Tokenizer、BPE、Strawberry | 新版有示意切分互動；本次補回 [Tokenizer／BPE 解釋](../encyclopedia.html#token-visualizer-card)及不同模型分詞不同的提醒，不使用固定中文字倍率。 |
| API／API Key、傳送路徑 | 本次補回 [API、金鑰與後端代理](../encyclopedia.html#key-permissions)的角色，並交代本網站的真實試演是瀏覽器直連；另有[安全架構圖解](../security.html)。 |
| Context Window、歷史訊息、用量 | 本次補回[容量與限制](../encyclopedia.html#context)，另在[記憶圖解](../memory.html#cost)以有前提的三輪例子說明用量，避免把所有產品的傳送方式說成相同。 |
| Temperature 與 Top-p | 新版原只簡述回答可能不同；本次在[回答與取樣](../encyclopedia.html#sampling)補回兩者差異、候選機率示例及模型支援限制。 |
| Embedding、向量相似度與檢索 | 本次在[向量與檢索](../encyclopedia.html#knowledge-methods)補回餘弦相似度、關鍵字／混合檢索的區別及查證限制。 |
| System Prompt、User Prompt、提示詞注入 | 本次補回[不同來源的訊息](../encyclopedia.html#prompt-context)及[分層檢查](../encyclopedia.html#instruction-boundaries)，舊系統指引詳例在 [Agent 生態專題](../topics/agent-ecosystem.html)。 |
| 預訓練、Fine-tuning、LoRA、Unsloth | 原專題仍在；本次在[模型與資料](../encyclopedia.html#knowledge-methods)補回預訓練及 Unsloth 說明，保留[舊版微調詳解](../topics/model-adaptation.html#s2)。 |
| 「存摺小抄」：前文與記憶 | [前文與上下文](../encyclopedia.html#context)、[記憶圖解](../memory.html)及[記憶實驗](../lab.html?experiment=memory)保留比較；本次補充不同應用可能使用摘要等方式。 |
| 「手錶與工具箱」：即時資訊 | 原實驗仍在；本次補回[即時資訊與知識截止](../encyclopedia.html#time-awareness)，包含資料來源、時間與工具的例子。 |
| 精確計算與程式工具 | 原算術實驗仍在；本次補回[從問題、工具執行到核對](../encyclopedia.html#tool-verification)，舊雙軌圖解可由該段開啟。 |

此外，補回或明確列出 **Knowledge Cutoff、Pre-training、Distillation、Compaction、Progressive Disclosure、Background Agent、Computer Use、Usage、Hallucination、Guardrail／Sandbox** 等名詞；**MoE、RAG、Agent、Tool Calling、Harness、Skill、MCP、Human-in-the-Loop、Multi-Agent** 保持可查閱。Prompt、Context Engineering、Agent Loop 和 Graphic／Generative UI 各有獨立解說，並非只有名詞清單。

## 八個舊實驗

八個實驗 ID 與共 27 個原有文字預設均保留在 `js/lab-legacy-data.js`，新版各實驗均能由「進階：自由測試與原有預設」進入。此次將原有結語重新接回「舊教材：原有實驗解析與來源」；原本有新聞資料的注入與金鑰實驗，也重新顯示原始摘要與來源連結。所有舊教材均有待核對提示。

| 舊實驗 ID | 新版入口 | 舊預設數 | 說明 |
|---|---|---:|---|
| tokens | [Token 切分](../lab.html?experiment=tokens) | 4 | 結語及原解析保留。 |
| time | [即時資訊](../lab.html?experiment=time) | 3 | 結語及原解析保留。 |
| memory | [上下文與記憶](../lab.html?experiment=memory) | 3 | 結語及原解析保留。 |
| probability | [回答與證據](../lab.html?experiment=probability) | 3 | 結語及原解析保留。 |
| injection | [提示詞注入](../lab.html?experiment=injection) | 5 | 結語、原解析與舊來源摘要保留；原教學系統指引可編輯。 |
| arithmetic | [計算與核對](../lab.html?experiment=arithmetic) | 3 | 結語及原解析保留。 |
| agent_breach | [行動與確認](../lab.html?experiment=agent_breach) | 3 | 結語與原教學系統指引保留；舊資料有單獨標題欄，原介面並未顯示獨立新聞物件。相關舊案例在[代理人事件專題](../topics/agent-incidents.html)，待核對。 |
| security | [金鑰與權限](../lab.html?experiment=security) | 3 | 結語、原解析與舊來源摘要保留。 |

自由測試仍可選擇教學模擬、Google Gemini 或 OpenRouter。圖鑑原 Gemini 2.0 Flash 選項已更新為 3.6 Flash，依據 [Google 的停用說明](https://ai.google.dev/gemini-api/docs/deprecations)；其他舊模型識別碼的可用性仍會隨供應商變動。本次以虛構金鑰與模擬回應驗證，不代表已測試真實付費 API 或所有帳號權限。

## 圖解、案例與手機版

| 舊資料 | 新版位置與處理 |
|---|---|
| 無狀態記憶時序圖 | [記憶圖解](../memory.html)：三幕、視窗限制、用量例子及可展開的完整時序；舊 SVG 留在 `dist_public_web/diagram_stateless_memory_sequence.html`。 |
| API 安全架構圖 | [金鑰安全圖解](../security.html#architecture)：原有架構圖及案例在展開區，加入資料流與權限說明；舊圖仍保留。 |
| 數學／程式雙軌圖 | 在[工具與核對](../encyclopedia.html#tool-verification)補回觀念並連結[舊圖](../dist_public_web/diagram_arithmetic_code_pipeline.html)；原圖絕對化的零誤差等宣稱未經驗證。 |
| 提示詞注入攻防圖 | 在[指令界線](../encyclopedia.html#instruction-boundaries)及[北捷案例](../metro.html#check)補回分層防禦並連結[舊圖](../dist_public_web/diagram_prompt_injection_defense.html)；舊圖防護成效數字待核對。 |
| 北捷原案例與其他情境 | [北捷案例](../metro.html)保留一個主要教學情境及四個其他情境；舊手機教材獨有的延伸敘述在來源區保留並標示未核對。 |
| 舊手機 foundations | `mobile.html#view-foundations` 轉至[基礎原理](../encyclopedia.html#glossary)。 |
| 舊手機 models | `mobile.html#view-models` 轉至[模型比較](../encyclopedia.html#models)。 |
| 舊手機 pricing | `mobile.html#view-pricing` 轉至[用量與成本](../encyclopedia.html#pricing)。 |
| 舊手機 lab | `mobile.html#view-lab` 轉至[互動實驗](../lab.html)。 |
| 舊手機 evolution | `mobile.html#view-evolution` 轉至 [Agent 與 Loop](../encyclopedia.html#agent-evolution)。 |

手機與電腦共用新版內容；原手機檔保留在 `dist_public_web/mobile.html`。舊網址對應的是新內容位置，並非保證每一句舊手機文字都出現在主線。

## 保留、限制與驗證

- 完整舊版仍在 `dist_public_web/`；本次調整前的新版另存於 `backups/llm-before-content-audit/`。備份是靜態網站檔案，沒有複製 API 金鑰或瀏覽器學習進度。
- 六站學習進度及既有儲存名稱未變；實驗室和圖鑑仍能讀取既有 API 設定。本機預覽僅額外開放兩張有明確連結的舊圖解。
- 對照舊資料有助於找出遺漏，並不等於證明其內容正確。特別是舊價格、模型規格、事件、成效比例及絕對化說法，仍應以官方或原始資料逐項核實。
- 內容補充參照 [Hugging Face 分詞器](https://huggingface.co/docs/tokenizers/python/latest/components.html)、[Google 生成參數](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/capabilities/content-generation-parameters)、[Anthropic 上下文視窗](https://platform.claude.com/docs/en/build-with-claude/context-windows)、[OWASP Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) 和各段落所附來源；並未全面查核整部舊教材。
