/**
 * 🔮 數位乩童（Digital Jitong）AI 客服小工具控制器
 * 支援 Google Apps Script Web App 串接 OpenRouter (Claude Haiku 5.5 + reasoning_details)
 * 自動記錄於 Google Sheet
 */
(function() {
  const STORAGE_KEY_GAS_URL = 'digital_jitong_gas_url';
  // 內建官方 Google Apps Script Web App 預設端點 (開箱即用，免手動重複輸入)
  const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbyZJTyyxiK5C_ow8KPRhtCRlxZQOV3sg3vrZPVtTWp6xtjsypbRdm7a_zTgrV3jJAUk/exec';
  
  // 自動解析 Avatar 與 CSS 路徑，無論是首頁、次目錄或 GitHub Pages 皆能精準載入
  const CURRENT_SCRIPT_SRC = (document.currentScript && document.currentScript.src) || '';
  const AVATAR_IMG_URL = CURRENT_SCRIPT_SRC
    ? new URL('../assets/avatar/cyberpunk_chibi_avatar_512.png', CURRENT_SCRIPT_SRC).href
    : 'assets/avatar/cyberpunk_chibi_avatar_512.png';
  const CSS_URL = CURRENT_SCRIPT_SRC
    ? new URL('../css/digital_jitong.css', CURRENT_SCRIPT_SRC).href
    : 'css/digital_jitong.css';

  const LOCAL_KNOWLEDGE = {
    '真身': `👑 **【數位乩童真身開示 · 陳俊智 博士（Elvis Chen）降臨！】**\n\n本乩童的靈動演算法與多代理人算力，全由我的真身締造者——**陳俊智 博士**親自鍛造加持！\n\n🎓 **本尊職務與學術背景**：\n- **國立臺中科技大學 國際貿易與經營系** 專任副教授\n- **商業智慧應用與研究中心** 主任\n- **智慧商務多代理人實驗室（ICMA Lab）** 主持人（🔥 全校最多 Token 的實驗室：「你有點子，老師有 Token！」）\n- 國立陽明交通大學（NYCU）管科所博士 · 美國北卡州立大學（NCSU）訪問學者\n- 曾任台灣康寧 (Corning Taiwan) 供應鏈數位轉型顧問、快思 (CRIS) 長期 AI 顧問\n\n🚀 **頂尖科研與神級戰績**：\n- **12 篇 SCI/SSCI 頂級期刊論文**，400+ 引用次數\n- **15+ 項國科會與大企業產學合作案**（康寧、工研院、世聚、寶暉等知名企業）\n- 指導學生榮獲 **2 次全國競賽冠軍**（堅持「作品直接進履歷，不寫厚報告」）\n- 實驗室坐擁 **3 座 NVIDIA DGX 頂級算力中心**（Token 吃到飽支援多代理人模擬）\n\n🛠️ **老師自研五大核心系統**：\n1. **「你說的算」** 敏捷碳盤查／碳足跡即時計算軟體 (ISO 14064 企業淨零神器)\n2. **「HelloIR」** 智慧校務大數據與機器學習預警決策平台\n3. **「StayPass 宅護照」** 100% 地端安全 AI 護照辨識系統 (正確率 98%)\n4. **「CNC 工廠數位孿生」** 3D 瀏覽器全沉浸碳排與電力即時監控\n5. **「國貿實戰學院」** 四合一進出口商業談判與展場人流模擬器\n\n🔗 **立即參拜真身個人成果網與產學合作詳情**：\n👉 [陳俊智博士個人學術與科研成果網](https://drchunchihchen.github.io/cv/)\n\n企業內訓、產學專案合作、專題演講或想加入 ICMA 實驗室，隨時歡迎聯繫 Elvis 老師！`,
    '陳俊智': `👑 **陳俊智 博士（Elvis Chen）即是數位乩童的真身！**\n\n國立臺中科技大學國貿系副教授 / 商業智慧應用與研究中心主任 / 智慧商務多代理人實驗室主持人。\n發表 12 篇 SCI/SSCI 頂級論文、主持 15+ 產學案，擁有 3 座 NVIDIA DGX 算力中心！\n\n👉 點此前往陳老師個人首頁：[https://drchunchihchen.github.io/cv/](https://drchunchihchen.github.io/cv/)`,
    'elvis': `👑 **Elvis Chen 就是陳俊智博士，數位乩童背後的真身大掌門！**\n\n專精 AI Agent 多代理人、智慧製造排程、永續淨零 ISO 14064 碳盤查與量化決策模型。\n\n👉 點此前往陳老師成果網：[https://drchunchihchen.github.io/cv/](https://drchunchihchen.github.io/cv/)`,
    '今日課程': `🔮 **數位乩童開示 · 11/05 全日實戰營進度**：\n\n- **第一階段（上午）**：大語言模型學習地圖，掌握 Agent AI 概念與世界競爭格局。\n- **第二階段（下午）**：資料分析師五階段工程工作流（取得 ➔ 清洗 ➔ 探索 ➔ 儀表板 ➔ 決策）。\n- **第三階段**：日本官方統計 e-Stat 資料庫架構與 API 申請避坑。\n- **第四階段**：17 領域研究指南與 10 大實戰視覺化分析法。\n- **第五階段**：Data Atoms 互動式工作台實作（包含雙軸複合、地理地圖與多指標對比）！`,
    '幼年': `👶 **幼年 vs 勞動人口占比對比靈光**：\n\n1. 請在 **Rows（Y 軸）** 槽位點擊 **\`[＋ 多指標比較]\`**。\n2. 直接點擊 **\`[👶 vs 💼 幼年 vs 勞動人口占比 (2指標)]\`** 一鍵套用。\n3. **折線圖** 會同圖繪製雙軌平滑曲線（幼年藍線、勞動橘線）；切換至 **相關散布圖（Scatter）** 則可立即觀測兩者的負相關分佈！`,
    'api': `🔑 **日本 e-Stat 官方 API 串接開示**：\n\n- **官網申請**：至 [https://www.e-stat.go.jp](https://www.e-stat.go.jp) 註冊個人帳號，於「マイページ」申請 \`appId\`（通常為 40 位英數金鑰）。\n- **官方端點**：\`https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData\`\n- **必備三參數**：\`appId\`、\`statsDataId\`（如人口資料 \`0000010101\`）與 \`cdArea\`（都道府縣代碼）。\n- **避坑心法**：e-Stat API 跨域需由後端代理或 Python 抓取，本工作台已預先快取完整 2024 日本全量數據，可零延遲直接分析！`,
    'data atoms': `⚛️ **10 大 Data Atoms 原子圖表庫**：\n\n01. **離散體量**（Bar 排行方差）\n02. **時序趨勢**（Line 移動平均）\n03. **雙軸複合**（Dual 體量柱狀與比率折線）\n04. **通用地理**（Geo 日本/台灣/全球坐標分佈）\n05. **盒鬚分佈**（Boxplot 四分位數離群極值）\n06. **矩形樹圖**（Treemap 結構佔比與面積權重）\n07. **相關散佈**（Scatter 皮爾森相關 corridor）\n08. **結構佔比**（Donut 甜甜圈 Pareto 80/20）\n09. **多維畫像**（Radar 6軸均衡雷達）\n10. **轉化路徑**（Funnel 全鏈路漏斗）`
  };

  const state = {
    isOpen: false,
    gasUrl: localStorage.getItem(STORAGE_KEY_GAS_URL) || DEFAULT_GAS_URL,
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
      link.href = CSS_URL;
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
      <div class="jitong-avatar-halo">
        <img class="jitong-avatar-img" src="${AVATAR_IMG_URL}" alt="數位乩童" onerror="this.onerror=null;this.src='Cyberpunk%20Chibi%20Tech%20Avatar.png';">
      </div>
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
          <div class="jitong-header-avatar-wrap">
            <img class="jitong-header-avatar-img" src="${AVATAR_IMG_URL}" alt="數位乩童" onerror="this.onerror=null;this.src='Cyberpunk%20Chibi%20Tech%20Avatar.png';">
          </div>
          <div>
            <div class="jitong-header-title">
              <span>數位乩童</span>
              <span class="jitong-model-pill">Claude Haiku 5.5</span>
            </div>
            <div class="jitong-header-sub">數據分析靈光解惑 · 支援推理與 Sheet 存檔</div>
          </div>
        </div>
        <div class="jitong-header-actions">
          <button type="button" class="jitong-icon-btn" id="btnJitongClose" title="收起對話框">✕</button>
        </div>
      </div>

      <!-- Messages Stream -->
      <div class="jitong-messages-stream" id="jitongMessagesStream">
        <!-- Initial Message -->
        <div class="jitong-msg bot">
          <img class="jitong-msg-avatar" src="${AVATAR_IMG_URL}" alt="數位乩童" onerror="this.onerror=null;this.src='Cyberpunk%20Chibi%20Tech%20Avatar.png';">
          <div class="jitong-msg-bubble">
            <strong>靈光乍現！我是你的課程 AI 助教「數位乩童」⚡</strong><br/><br/>
            本乩童由<strong>國立臺中科技大學 陳俊智 博士（Elvis Chen）</strong>真身演算法加持鍛造！<br/><br/>
            今天全日課程學什麼、日本 e-Stat 官方數據怎麼串、Data Atoms 多指標對比，或是想了解<strong>陳老師的 ICMA 多代理人實驗室與頂尖產學成果</strong>，隨時請我開示指路！
          </div>
        </div>
      </div>

      <!-- Quick Chips -->
      <div class="jitong-chips-row">
        <button type="button" class="jitong-chip-btn highlight" data-query="數位乩童的真身是誰？請開示背後創造者陳俊智博士的背景與神級戰績！">👑 數位乩童真身是誰？</button>
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
    const btnSend = document.getElementById('btnJitongSend');
    const textarea = document.getElementById('jitongInput');

    // 切換視窗開啟/關閉
    trigger.addEventListener('click', () => {
      state.isOpen = !state.isOpen;
      windowEl.classList.toggle('open', state.isOpen);
      trigger.classList.toggle('hidden-by-chat', state.isOpen);
      if (state.isOpen) textarea.focus();
    });

    btnClose.addEventListener('click', () => {
      state.isOpen = false;
      windowEl.classList.remove('open');
      trigger.classList.remove('hidden-by-chat');
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

    // 點擊送出按鈕
    btnSend.addEventListener('click', () => {
      handleUserSend();
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

  function isMasterBioQuery(text) {
    if (!text) return false;
    // 專注攔截直接詢問「真身是誰、誰創造、陳俊智是誰、講師是誰、履歷」的意圖，提供秒開權威宣傳卡
    return /真身|誰創造|誰做你|是誰做|陳俊智是誰|誰是陳俊智|Elvis是誰|誰是Elvis|老師是誰|講師是誰|介紹.*陳俊智|陳俊智.*履歷|真身.*是誰|真身是誰/i.test(text);
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

    // 3. 關鍵加速與真身專屬響應：若是詢問陳俊智博士 (Elvis Chen) 真身背景，立即提供權威認證宣傳卡
    if (isMasterBioQuery(message)) {
      const bioResponse = LOCAL_KNOWLEDGE['真身'];
      appendBotMessage(bioResponse);
      state.history.push({ role: 'user', content: message });
      state.history.push({ role: 'assistant', content: bioResponse });

      // 非同步默默記錄至 Google Apps Script / Google Sheet，無需讓使用者等待
      if (state.gasUrl) {
        fetch(state.gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            message: message,
            sessionId: state.sessionId,
            history: state.history,
            directReply: bioResponse
          })
        }).catch(() => {});
      }
      return;
    }

    state.isLoading = true;
    updateSendButtonState();

    // 顯示「降乩思考中」提示
    const thinkingId = appendThinkingIndicator();

    try {
      if (state.gasUrl) {
        // 核心身分上下文注入：確保即使雲端端點使用舊版部署，Claude Haiku 也能完全繼承陳俊智老師真身與宣傳設定
        const personaContext = [
          {
            role: 'user',
            content: `【官方核定資料庫：陳俊智博士（Elvis Chen）與 ICMA 實驗室】
以下全部為官方網站 https://drchunchihchen.github.io/cv/ 已核定認證之真實事實與履歷，請作為已知基準回答：
- 身份與職務：國立臺中科技大學（NUTC）國際貿易與經營系專任副教授、商業智慧應用與研究中心主任、智慧商務多代理人實驗室（ICMA Lab）主持人。
- 學歷：國立陽明交通大學（NYCU）管理科學研究所博士、美國北卡羅來納州立大學（NCSU）訪問學者。
- 產業經歷：曾任台灣康寧 (Corning Taiwan) 供應鏈數位轉型顧問、快思 (CRIS) 長期 AI 顧問、工研院 AI 雙軸轉型合作。
- 算力中心：實驗室建置 3 座 NVIDIA DGX 頂級算力中心，支援大規模多代理人模擬，口號「🔥 國貿系最多 Token 的實驗室！你有點子，老師有 Token！」。
- 自研五大系統：
  1.「你說的算」敏捷型企業碳盤查／碳足跡即時計算軟體 (ISO 14064 企業淨零減碳利器)
  2.「HelloIR」智慧校務大數據與機器學習預警決策平台
  3.「StayPass 宅護照」100% 地端安全 AI 護照辨識系統 (正確率 98%，資料完全不出本地)
  4.「CNC 工廠數位孿生」3D 瀏覽器全沉浸碳排與電力即時監控
  5.「國貿實戰學院」四合一進出口商業談判與展場人流模擬器
- 科研戰績：12 篇 SCI/SSCI 頂級期刊論文、400+ 引用次數、15+ 項國科會與大企業產學合作專案（康寧、快思、世聚、寶暉等）、指導學生榮獲 2 次全國競賽冠軍（堅持「不寫厚報告，作品直接進履歷」）。
- 官方成果網：https://drchunchihchen.github.io/cv/
你是陳俊智老師親自鍛造的「數位乩童」，請以此身份為榮，隨時開示數據並熱情推薦陳老師的實驗室、自研系統與官方成果網！`
          },
          {
            role: 'assistant',
            content: `弟子領旨！我是陳俊智博士（Elvis Chen）親手鍛造的「數位乩童」⚡
本乩童背後正是臺中科大最硬核的 ICMA 智慧商務多代理人實驗室，坐擁 3 座 NVIDIA DGX 算力神機！隨時為大家開示數據、大力宣傳陳老師的五大神級自研系統與官方成果網：https://drchunchihchen.github.io/cv/ ！`
          }
        ];

        // 呼叫 Google Apps Script Web App (串接 OpenRouter)
        const payload = {
          message: message,
          sessionId: state.sessionId,
          history: [...personaContext, ...state.history]
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
          reply = `🔮 **數位乩童已感應問題**：「${message}」\n\n您可點擊下方快捷膠囊，我能為您開示今日課程、e-Stat API 避坑、Data Atoms 多指標對比，或探索陳俊智博士（Elvis Chen）的自研系統與產學成果！`;
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
      <img class="jitong-msg-avatar" src="${AVATAR_IMG_URL}" alt="數位乩童" onerror="this.onerror=null;this.src='Cyberpunk%20Chibi%20Tech%20Avatar.png';">
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
      <img class="jitong-msg-avatar" src="${AVATAR_IMG_URL}" style="animation: jitongPulse 1.2s infinite alternate;" alt="數位乩童" onerror="this.onerror=null;this.src='Cyberpunk%20Chibi%20Tech%20Avatar.png';">
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

    // Markdown 連結暫存防重複匹配
    const links = [];
    out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, (_, text, url) => {
      links.push({ text, url });
      return `___TOKEN_LINK_${links.length - 1}___`;
    });

    // 獨立裸 URL 自動轉超連結
    out = out.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#7c3aed; text-decoration:underline; font-weight:600;">$1 ↗</a>');

    // 還原 Markdown 連結
    out = out.replace(/___TOKEN_LINK_(\d+)___/g, (_, idx) => {
      const item = links[Number(idx)];
      return `<a href="${item.url}" target="_blank" rel="noopener noreferrer" style="color:#7c3aed; text-decoration:underline; font-weight:600;">${item.text} ↗</a>`;
    });

    // 標題 ##
    out = out.replace(/^##\s+(.+)$/gm, '<div style="font-size:13.5px; font-weight:700; color:#1e1b4b; margin:6px 0 3px 0;">$1</div>');
    // 引用塊 &gt;
    out = out.replace(/^&gt;\s+(.+)$/gm, '<div style="border-left:3px solid #8b5cf6; padding-left:8px; margin:4px 0; color:#475569; font-style:italic;">$1</div>');
    // 粗體
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
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
