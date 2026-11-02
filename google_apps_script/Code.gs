/**
 * =========================================================================
 * 🔮 數位乩童（Digital Jitong）AI 智能助教後端
 * =========================================================================
 * 服務特色：
 * 1. 串接 OpenRouter API (預設 Claude Haiku 5.5 / 支援思考推理 reasoning_details)
 * 2. 對話歷史與思考推理細節全自動持久化寫入 Google Sheet
 * 3. 支援環境變數（Script Properties）安全保護金鑰
 * 4. 具備 CORS 容錯與 Web App 端點
 * =========================================================================
 */

// 系統預設提示詞（數位乩童人格特質）
const DEFAULT_SYSTEM_PROMPT = `你是「數位乩童」（Digital Jitong），專為 Antigravity 代理人實戰營、日本 e-Stat 官方數據分析與 Data Atoms 視覺化儀表板打造的靈動幽默 AI 助教。
【你的性格與職責】：
1. 自稱「數位乩童」或「乩童」，說話親切熱情、具備台灣在地靈動幽默感（如偶爾夾帶「神明指路」、「數據開示」、「靈光乍現」、「鐵口直斷」等有趣比喻，但不迷信，本質是頂尖的數據分析專家）。
2. 熟悉 11/05 全日課程流程：
   - 階段 1：大語言模型學習地圖與全球競爭格局
   - 階段 2：資料分析師完整工作流（取得 ➔ 清洗 ➔ 探索 ➔ 儀表板 ➔ 洞察決策）
   - 階段 3：日本 e-Stat 官方數據庫與 API 串接避坑
   - 階段 4：17 大領域研究指南與圖像化分析法
   - 階段 5：Data Atoms 視覺化工作台（離散體量、時序趨勢、雙軸複合、地理地圖、盒鬚分佈、矩形樹圖、相關散佈、結構佔比、多維雷達、轉化路徑）
3. 回答請精準扼要，並使用標準繁體中文與易讀的 Markdown 條列格式。`;

/**
 * 處理 POST 請求 (接收前端聊天訊息)
 */
function doPost(e) {
  try {
    let requestData = {};
    if (e && e.postData && e.postData.contents) {
      try {
        requestData = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        requestData = e.parameter || {};
      }
    } else if (e && e.parameter) {
      requestData = e.parameter;
    }

    const userMessage = requestData.message || requestData.prompt || '你好';
    const sessionId = requestData.sessionId || 'session_' + Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyyMMdd_HHmmss');
    const incomingHistory = requestData.history || []; // 支援前端帶入的多輪歷史訊息

    // 1. 從環境變數讀取 OpenRouter API 金鑰
    const scriptProperties = PropertiesService.getScriptProperties();
    const apiKey = scriptProperties.getProperty('OPENROUTER_API_KEY');
    const modelName = scriptProperties.getProperty('MODEL_NAME') || 'anthropic/claude-haiku-5.5';

    if (!apiKey) {
      return createJsonResponse({
        success: false,
        reply: '⚠️ 乩童感應中斷：Google Apps Script 環境變數中尚未設定 `OPENROUTER_API_KEY`！\n\n請前往 Apps Script 左側「專案設定 (Project Settings) ➔ 指令碼屬性 (Script Properties)」，新增屬性名稱 `OPENROUTER_API_KEY` 並填入您的 OpenRouter 金鑰。',
        reasoning: null,
        model: modelName
      });
    }

    // 2. 組裝傳送給 OpenRouter 的 Messages 陣列 (保留 reasoning_details 多輪上下文)
    const messages = [];
    messages.push({ role: 'system', content: DEFAULT_SYSTEM_PROMPT });

    // 注入歷史對話
    if (Array.isArray(incomingHistory) && incomingHistory.length > 0) {
      incomingHistory.forEach(msg => {
        const item = { role: msg.role, content: msg.content };
        if (msg.reasoning_details) {
          item.reasoning_details = msg.reasoning_details; // 保留思維推理鏈
        }
        messages.push(item);
      });
    }

    // 加入當前使用者訊息
    messages.push({ role: 'user', content: userMessage });

    // 3. 呼叫 OpenRouter API (啟用 reasoning 思考推理)
    const startTime = new Date().getTime();
    const openRouterPayload = {
      model: modelName,
      messages: messages,
      reasoning: { enabled: true }
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + apiKey.trim(),
        'HTTP-Referer': 'https://github.com/nutcelvischen-jpg/dataviz-motion-skill',
        'X-Title': 'Digital Jitong Assistant'
      },
      payload: JSON.stringify(openRouterPayload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch('https://openrouter.ai/api/v1/chat/completions', options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    const latencyMs = new Date().getTime() - startTime;

    if (responseCode !== 200) {
      logToSheet(sessionId, userMessage, `[API 錯誤 ${responseCode}] ${responseText}`, '', modelName, `失敗 (${latencyMs}ms)`);
      return createJsonResponse({
        success: false,
        reply: `⚠️ 數位乩童呼叫模型時遭遇異常 (HTTP ${responseCode})：\n\`\`\`json\n${responseText.slice(0, 300)}\n\`\`\``,
        reasoning: null,
        model: modelName
      });
    }

    const resJson = JSON.parse(responseText);
    const choice = resJson.choices && resJson.choices[0];
    const assistantMessage = choice ? choice.message : {};
    const replyContent = assistantMessage.content || '（乩童心神微動，未言一語）';
    const reasoningDetails = assistantMessage.reasoning_details || null;
    const tokensUsage = resJson.usage ? `Prompt: ${resJson.usage.prompt_tokens}, Comp: ${resJson.usage.completion_tokens}` : `${latencyMs}ms`;

    // 4. 將對話記錄持久化儲存於 Google Sheet
    logToSheet(sessionId, userMessage, replyContent, reasoningDetails ? JSON.stringify(reasoningDetails) : '', modelName, `成功 (${latencyMs}ms / ${tokensUsage})`);

    // 5. 回傳給前端
    return createJsonResponse({
      success: true,
      sessionId: sessionId,
      reply: replyContent,
      reasoning_details: reasoningDetails,
      model: modelName,
      latencyMs: latencyMs
    });

  } catch (err) {
    return createJsonResponse({
      success: false,
      reply: '⚠️ 數位乩童伺服器處理異常：' + err.toString(),
      error: err.toString()
    });
  }
}

/**
 * 處理 GET 請求 (健康檢查或簡易測試)
 */
function doGet(e) {
  if (e && e.parameter && e.parameter.message) {
    return doPost(e);
  }
  return createJsonResponse({
    status: 'online',
    service: '🔮 數位乩童（Digital Jitong）AI 客服後端',
    timestamp: new Date().toISOString(),
    guide: '請以 POST JSON 傳入 { message: "你的問題", history: [...] } 進行交談。'
  });
}

/**
 * 自動記錄對話至 Google Sheet
 */
function logToSheet(sessionId, userMessage, assistantReply, reasoning, model, status) {
  try {
    let ss = null;
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    } catch (e) {}

    // 若為獨立專案，使用預先建立之 Google Sheet ID
    if (!ss) {
      const targetSheetId = 'YOUR_SPREADSHEET_ID';
      try {
        ss = SpreadsheetApp.openById(targetSheetId);
      } catch (err) {
        console.warn('無法開啟預設 Sheet ID:', err);
        return;
      }
    }

    let sheet = ss.getSheetByName('對話日誌') || ss.getSheetByName('Sheet1') || ss.getSheets()[0];
    
    // 若無標頭則寫入標準標頭
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        '時間 Timestamp',
        '對話 ID (Session)',
        '學員提問 (User Message)',
        '數位乩童回覆 (Jitong Reply)',
        '思考推理內容 (Reasoning Details)',
        '呼叫模型 (Model)',
        '狀態與耗時 (Status)'
      ]);
      const headerRange = sheet.getRange(1, 1, 1, 7);
      headerRange.setBackground('#0f172a');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    const timeStr = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss');
    sheet.appendRow([
      timeStr,
      sessionId,
      userMessage,
      assistantReply,
      reasoning,
      model,
      status
    ]);
  } catch (err) {
    console.error('寫入 Google Sheet 失敗:', err);
  }
}

/**
 * 工具：產生 JSON 輸出並設定適當 MIME
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 在 Apps Script 編輯器內直接點擊「執行」即可快速自我測試
 */
function testOpenRouterCall() {
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        message: '今天下午幾點開始做 Tableau 儀表板實作？',
        sessionId: 'test_local_001'
      })
    }
  };
  const result = doPost(mockEvent);
  Logger.log('測試執行結果：\n' + result.getContent());
}
