/**
 * 🔮 數位乩童（Digital Jitong）AI 客服小工具控制器
 * 支援 Google Apps Script Web App 串接 OpenRouter (Claude Haiku 5.5 + reasoning_details)
 * 自動記錄於 Google Sheet
 */
(function() {
  const STORAGE_KEY_GAS_URL = 'digital_jitong_gas_url';
  
  // 內建知識庫預設回應（未填寫 Apps Script URL 或離線時使用）
  const LOCAL_KNOWLEDGE = {
    '今日課程': `🔮 **數位乩童開示 · 11/05 全日實戰營進度**：\n\n- **第一階段（上午）**：大語言模型學習地圖，掌握 Agent AI 概念與世界競爭格局。\n- **第二階段（下午）**：資料分析師五階段工程工作流（取得 ➔ 清洗 ➔ 探索 ➔ 儀表板 ➔ 決策）。\n- **第三階段**：日本官方統計 e-Stat 資料庫架構與 API 申請避坑。\n- **第四階段**：17 領域研究指南與 10 大實戰視覺化分析法。\n- **第五階段**：Data Atoms 互動式工作台實作（包含雙軸複合、地理地圖與多指標對比）！`,
    '幼年': `👶 **幼年 vs 勞動人口占比對比靈光**：\n\n1. 請在 **Rows（Y 軸）** 槽位點擊 **\`[＋ 多指標比較]\`**。\n2. 直接點擊 **\`[👶 vs 💼 幼年 vs 勞動人口占比 (2指標)]\`** 一鍵套用。\n3. **折線圖** 會同圖繪製雙軌平滑曲線（幼年藍線、勞動橘線）；切換至 **相關散布圖（Scatter）** 則可立即觀測兩者的負相關分佈！`,
    'api': `🔑 **日本 e-Stat 官方 API 串接開示**：\n\n- **官網申請**：至 [https://www.e-stat.go.jp](https://www.e-stat.go.jp) 註冊個人帳號，於「マイページ」申請 \`appId\`（通常為 40 位英數金鑰）。\n- **官方端點**：\`https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData\`\n- **必備三參數**：\`appId\`、\`statsDataId\`（如人口資料 \`0000010101\`）與 \`cdArea\`（都道府縣代碼）。\n- **避坑心法**：e-Stat API 跨域需由後端代理或 Python 抓取，本工作台已預先快取完整 2024 日本全量數據，可零延遲直接分析！`,
    'data atoms': `⚛️ **10 大 Data Atoms 原子圖表庫**：\n\n01. **離散體量**（Bar 排行方差）\n02. **時序趨勢**（Line 移動平均）\n03. **雙軸複合**（Dual 體量柱狀與比率折線）\n04. **通用地理**（Geo 日本/台灣/全球坐標分佈）\n05. **盒鬚分佈**（Boxplot 四分位數離群極值）\n06. **矩形樹圖**（Treemap 結構佔比與面積權重）\n07. **相關散佈**（Scatter 皮爾森相關 corridor）\n08. **結構佔比**（Donut 甜甜圈 Pareto 80/20）\n09. **多維畫像**（Radar 6軸均衡雷達）\n10. **轉化路徑**（Funnel 全鏈路漏斗）`
  };

  const state = {
    isOpen: false,
    gasUrl: localStorage.getItem(STORAGE_KEY_GAS_URL) || '',
    sessionId: 'jitong_' + Math.random().toString(36).substring(2, 9),
    history: [], // [{role: 'user', content: '...'}, {role: 'assistant', content: '...', reasoning_details: '...'}]
    isLoading: false
  };

  function init() {
    ensureStylesheet();
    createDOM();
    bindEvents();
  }

  function ensureStylesheet() {
    if (!document.getElementById('digital-jitong-style')) {
      const link = document.createElement('link');
      link.id = 'digital-jitong-style';
      link.rel = 'stylesheet';
      link.href = 'css/digital_jitong.css';
      document.head.appendChild(link);
    }
  }

  function createDOM() {
    if (document.getElementById('jitongFloatingTrigger')) return;

    // 1. 懸浮按鈕
    const trigger = document.createElement('div');
    trigger.id = 'jitongFloatingTrigger';
    trigger.className = 'jitong-floating-trigger';
    trigger.setAttribute('title', '點擊召喚「數位乩童」AI 小客服');
    trigger.innerHTML = `
      <div class="jitong-avatar-halo">🔮</div>
      <div class="jitong-trigger-text">
        <div class="jitong-trigger-name">
          <span>數位乩童</span>
          <span class="jitong-online-dot"></span>
        </div>
        <div class="jitong-trigger-sub">AI 助教在線解惑</div>
      </div>
    `;
    document.body.appendChild(trigger);

    // 2. 聊天對話視窗
    const windowEl = document.createElement('div');
    windowEl.id = 'jitongChatWindow';
    windowEl.className = 'jitong-chat-window';
    windowEl.innerHTML = `
      <!-- Header -->
      <div class="jitong-header">
        <div class="jitong-header-brand">
          <span class="jitong-header-avatar">🔮</span>
          <div>
            <div class="jitong-header-title">
              <span>數位乩童</span>
              <span class="jitong-model-pill">Claude Haiku 5.5</span>
            </div>
            <div class="jitong-header-sub">數據分析靈光解惑 · 支援推理與 Sheet 存檔</div>
          </div>
        </div>
        <div class="jitong-header-actions">
          <button type="button" class="jitong-icon-btn" id="btnJitongSettings" title="設定 Google Apps Script 後端連線網址">⚙️</button>
          <button type="button" class="jitong-icon-btn" id="btnJitongClose" title="收起對話框">✕</button>
        </div>
      </div>

      <!-- Settings Panel -->
      <div class="jitong-settings-panel" id="jitongSettingsPanel">
        <div style="font-weight: 700; color: #1e293b; margin-bottom: 2px;">🔗 Google Apps Script 連線設定</div>
        <div style="color: #64748b; font-size: 11px; line-height: 1.4;">
          請將已部署為 Web App 的 Apps Script 網址填入，連線 OpenRouter 並同步存檔 Google Sheet：
        </div>
        <input type="text" class="jitong-input-field" id="inputGasUrl" placeholder="https://script.google.com/macros/s/AKfycb.../exec" value="${escapeAttr(state.gasUrl)}">
        <div class="jitong-settings-actions">
          <a href="https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit" target="_blank" style="color: #7c3aed; text-decoration: underline; font-size: 11px;">開啟 Google Sheet 日誌庫 ↗</a>
          <button type="button" class="jitong-btn-save" id="btnSaveGasUrl">儲存設定</button>
        </div>
      </div>

      <!-- Messages Stream -->
      <div class="jitong-messages-stream" id="jitongMessagesStream">
        <!-- Initial Message -->
        <div class="jitong-msg bot">
          <div class="jitong-msg-bubble">
            <strong>靈光乍現！我是你的課程 AI 助教「數位乩童」🔮</strong><br/><br/>
            今天全日課程學什麼、日本 e-Stat 官方數據怎麼串、或是 Data Atoms 儀表板如何比較幼年與勞動人口，隨時請我為您開示指路！
          </div>
        </div>
      </div>

      <!-- Quick Chips -->
      <div class="jitong-chips-row">
        <button type="button" class="jitong-chip-btn" data-query="今天全日課程進度與時序是怎麼安排的？">🧭 今日課程進度</button>
        <button type="button" class="jitong-chip-btn" data-query="如何在圖表上同時比較幼年人口占比與勞動人口占比？">👶 幼年 vs 勞動人口比較</button>
        <button type="button" class="jitong-chip-btn" data-query="日本官方統計 e-Stat API 該如何申請？有哪些避坑要點？">🔑 e-Stat API 申請教學</button>
        <button type="button" class="jitong-chip-btn" data-query="Data Atoms 視覺化儀表板包含哪 10 大原子圖表？">📊 什麼是 10 大 Data Atoms？</button>
      </div>

      <!-- Input Footer -->
      <div class="jitong-footer">
        <textarea class="jitong-textarea" id="jitongInput" placeholder="向數位乩童請示問題... (Enter 發送，Shift+Enter 換行)" rows="1"></textarea>
        <button type="button" class="jitong-send-btn" id="btnJitongSend" title="發送請教訊息">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    `;
    document.body.appendChild(windowEl);
  }

  function bindEvents() {
    const trigger = document.getElementById('jitongFloatingTrigger');
    const windowEl = document.getElementById('jitongChatWindow');
    const btnClose = document.getElementById('btnJitongClose');
    const btnSettings = document.getElementById('btnJitongSettings');
    const settingsPanel = document.getElementById('jitongSettingsPanel');
    const btnSaveGas = document.getElementById('btnSaveGasUrl');
    const inputGas = document.getElementById('inputGasUrl');
    const btnSend = document.getElementById('btnJitongSend');
    const textarea = document.getElementById('jitongInput');

    // 切換視窗開啟/關閉
    trigger.addEventListener('click', () => {
      state.isOpen = !state.isOpen;
      windowEl.classList.toggle('open', state.isOpen);
      if (state.isOpen) textarea.focus();
    });

    btnClose.addEventListener('click', () => {
      state.isOpen = false;
      windowEl.classList.remove('open');
    });

    // 展開設定面板
    btnSettings.addEventListener('click', () => {
      settingsPanel.classList.toggle('open');
    });

    // 儲存 Google Apps Script 網址
    btnSaveGas.addEventListener('click', () => {
      const url = inputGas.value.trim();
      state.gasUrl = url;
      localStorage.setItem(STORAGE_KEY_GAS_URL, url);
      settingsPanel.classList.remove('open');
      appendBotMessage(`✅ 已儲存 Google Apps Script 連線！後續對話將透過 OpenRouter 模型回答並存檔於 Google Sheet。`);
    });

    // 發送訊息與輸入法 (IME) 選字保護
    let isComposing = false;

    textarea.addEventListener('compositionstart', () => {
      isComposing = true;
    });

    textarea.addEventListener('compositionend', () => {
      isComposing = false;
    });

    textarea.addEventListener('keydown', (e) => {
      // 關鍵保護：如果使用者正在進行中文選字 (注音/拼音/倉頡)，按下 Enter 僅確認字詞，絕不觸發送出！
      if (e.isComposing || isComposing || e.keyCode === 229) {
        return;
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        handleUserSend();
      }
    });

    textarea.addEventListener('input', () => {
      textarea.style.height = '38px';
      textarea.style.height = Math.min(textarea.scrollHeight, 90) + 'px';
    });

    // 快捷膠囊點擊
    document.querySelectorAll('.jitong-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const query = btn.dataset.query;
        if (query) {
          textarea.value = query;
          handleUserSend();
        }
      });
    });
  }

  async function handleUserSend() {
    const textarea = document.getElementById('jitongInput');
    if (!textarea) return;
    const message = textarea.value.trim();
    if (!message || state.isLoading) return;

    // 1. 同步立即清空輸入框並還原預設高度
    textarea.value = '';
    textarea.style.height = '38px';

    // 2. 非同步再次確保清空 (防禦 IME 瀏覽器微任務將剛選取的字符二次塞回框中)
    setTimeout(() => {
      textarea.value = '';
      textarea.style.height = '38px';
    }, 0);

    appendUserMessage(message);

    state.isLoading = true;
    updateSendButtonState();

    // 顯示「降乩思考中」提示
    const thinkingId = appendThinkingIndicator();

    try {
      if (state.gasUrl) {
        // 呼叫 Google Apps Script Web App (串接 OpenRouter)
        const payload = {
          message: message,
          sessionId: state.sessionId,
          history: state.history
        };

        const res = await fetch(state.gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        removeThinkingIndicator(thinkingId);

        if (data.success) {
          appendBotMessage(data.reply, data.reasoning_details);
          // 儲存多輪上下文 (保留 reasoning_details)
          state.history.push({ role: 'user', content: message });
          const assistItem = { role: 'assistant', content: data.reply };
          if (data.reasoning_details) assistItem.reasoning_details = data.reasoning_details;
          state.history.push(assistItem);
        } else {
          appendBotMessage(data.reply || '⚠️ 乩童感應微弱，請檢查金鑰設定。');
        }
      } else {
        // 本地預設智能回應 (未設定 Apps Script 時提供無縫離線體驗)
        await new Promise(r => setTimeout(r, 600));
        removeThinkingIndicator(thinkingId);

        const lower = message.toLowerCase();
        let reply = '';
        let matched = false;

        for (const [key, ans] of Object.entries(LOCAL_KNOWLEDGE)) {
          if (lower.includes(key)) {
            reply = ans;
            matched = true;
            break;
          }
        }

        if (!matched) {
          reply = `🔮 **數位乩童已感應問題**：「${message}」\n\n您可點擊右上角 ⚙️ 齒輪填入 **Google Apps Script 網址**，即可連線至您的 OpenRouter 金鑰（使用 Claude Haiku 5.5 深度回答並保存日誌至 Google Sheet）！\n\n您也可以點擊下方快捷膠囊，我能為您開示今日課程、e-Stat API 避坑或 Data Atoms 多指標對比！`;
        }

        appendBotMessage(reply);
      }
    } catch (err) {
      removeThinkingIndicator(thinkingId);
      appendBotMessage(`⚠️ 數位乩童連線異常：${err.message}\n\n若您剛建立 Apps Script，請確認部署時「誰可以存取」是否選取為「所有人 (Anyone)」。`);
    } finally {
      state.isLoading = false;
      updateSendButtonState();
    }
  }

  function appendUserMessage(text) {
    const stream = document.getElementById('jitongMessagesStream');
    const msg = document.createElement('div');
    msg.className = 'jitong-msg user';
    msg.innerHTML = `<div class="jitong-msg-bubble">${escapeHtml(text)}</div>`;
    stream.appendChild(msg);
    stream.scrollTop = stream.scrollHeight;
  }

  function appendBotMessage(markdownText, reasoningDetails = null) {
    const stream = document.getElementById('jitongMessagesStream');
    const msg = document.createElement('div');
    msg.className = 'jitong-msg bot';

    let reasoningHtml = '';
    if (reasoningDetails) {
      const reasonStr = typeof reasoningDetails === 'string' ? reasoningDetails : JSON.stringify(reasoningDetails, null, 2);
      reasoningHtml = `
        <details class="jitong-reasoning-card">
          <summary class="jitong-reasoning-summary">
            <span>🧠 乩童感應靈光（思考推導過程）</span>
          </summary>
          <div class="jitong-reasoning-body">${escapeHtml(reasonStr)}</div>
        </details>
      `;
    }

    const htmlContent = parseSimpleMarkdown(markdownText);
    msg.innerHTML = `
      <div class="jitong-msg-bubble">
        ${reasoningHtml}
        <div>${htmlContent}</div>
      </div>
    `;
    stream.appendChild(msg);
    stream.scrollTop = stream.scrollHeight;
  }

  function appendThinkingIndicator() {
    const stream = document.getElementById('jitongMessagesStream');
    const id = 'thinking_' + Date.now();
    const msg = document.createElement('div');
    msg.id = id;
    msg.className = 'jitong-msg bot';
    msg.innerHTML = `
      <div class="jitong-msg-bubble" style="color: #7c3aed; font-style: italic; display: flex; align-items: center; gap: 8px;">
        <span style="animation: jitongPulse 1s infinite alternate;">🔮</span>
        <span>數位乩童沉思通靈中...</span>
      </div>
    `;
    stream.appendChild(msg);
    stream.scrollTop = stream.scrollHeight;
    return id;
  }

  function removeThinkingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function updateSendButtonState() {
    const btn = document.getElementById('btnJitongSend');
    if (btn) btn.disabled = state.isLoading;
  }

  function parseSimpleMarkdown(md) {
    if (!md) return '';
    let out = escapeHtml(md);
    // 代碼塊
    out = out.replace(/```([a-z]*)\n([\s\S]*?)```/g, '<pre style="background:#1e293b; color:#f8fafc; padding:8px 10px; border-radius:6px; overflow-x:auto; font-family:monospace; font-size:11.5px;"><code>$2</code></pre>');
    // 行內代碼
    out = out.replace(/`([^`]+)`/g, '<code style="background:#f1f5f9; color:#0f172a; padding:1px 5px; border-radius:4px; font-family:monospace; font-size:12px;">$1</code>');
    // 粗體
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // 連結
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:#7c3aed; text-decoration:underline; font-weight:600;">$1 ↗</a>');
    // 換行
    out = out.replace(/\n/g, '<br/>');
    return out;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeAttr(str) {
    return String(str || '')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // 自動掛載
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
