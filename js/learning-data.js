/* 課程內容的單一來源。示範數字與回覆均為教學用途。 */
window.LEARNING_LESSONS = [
  {
    id:'01', season:1, shortTitle:'認識模型', title:'它如何把提問變成回答？', summary:'認識文字、Token 與逐步生成的關係。',
    lead:'先從一次最熟悉的提問開始，看看文字如何走進模型，又如何成為回答。',
    objectives:['分辨字元與 Token','理解回答會逐步生成'],
    explanation:['當你輸入一句話，應用程式會把文字交給分詞器，切成模型處理的單位。這些單位稱為 Token，可能是一個字、詞的一部分，或其他文字片段。不同模型使用的切分方式可能不同。','模型根據本次可用的上下文，對接下來可能出現的 Token 形成機率分布，再依設定選出一個。這個過程重複進行，逐步形成回覆；它本身不表示已經查過網路或核對事實。'],
    flow:['輸入文字','切分 Token','結合上下文','產生候選分布','選取下一個'], flowNote:'選出的 Token 會加入上下文，接著再產生下一個；模型如此重複，直到結束回答。',observation:'示意切分讓你看到文字可以被分成不同片段；不同模型的分詞器可能切出不同結果，因此這裡的數字不能作為正式計費依據。',
    prediction:'一個中文字一定等於一個 Token 嗎？', experiment:'tokens', takeaway:'模型依據收到的上下文逐步產生回答；Token 是它處理文字的單位之一。',
    quiz:{question:'下列哪個說法最適合描述本課的文字生成流程？', options:[['a','先從固定答案庫找出整段回答。','模型不是只從固定答案庫挑出一整段回答。'],['b','根據可用上下文，逐步產生後續 Token。','答對了。模型使用上下文，逐步生成後續 Token。'],['c','每次都先搜尋網路，才開始回答。','是否搜尋網路取決於應用與工具設定。']],correct:'b'},
    links:[['查看完整分詞圖解','concepts/tokens.html#token-visualizer-card'],['開啟分詞實驗室','lab.html?experiment=tokens&lesson=01']]
  },
  {
    id:'02', season:1, shortTitle:'理解上下文',title:'它為什麼記得前文，又為什麼會忘記？',summary:'理解應用程式如何將相關對話交給模型。',
    lead:'聊天看起來像一場連續對話；實際上，每次送出的內容才是模型此刻可用的資訊。',
    objectives:['區分應用程式保存與本次模型輸入','理解上下文容量有限'],
    explanation:['聊天應用程式可以保存過去的對話，並在新一輪提問時選取部分內容，一起送給模型。也有應用會透過摘要或其他記憶功能提供相關資訊；呈現方式取決於產品設計。','上下文視窗是一次可處理內容的容量。對話太長時，應用可能選擇摘要、截取或提示超出限制；被省略的內容，不一定能用來回答當前問題。'],
    flow:['保存歷史','選取相關內容','加入新問題','送入模型','產生回答'],flowNote:'應用程式保存資料，與模型本次實際收到什麼，是兩件需要分開看的事。',observation:'開啟前文後，名字出現在組裝的輸入裡；關閉後，這次輸入就缺少名字。固定示範呈現的是輸入資訊改變所造成的差別。',
    prediction:'如果本次沒有附上名字，模型還有足夠資訊回答嗎？',experiment:'memory',takeaway:'對話的連貫性，取決於應用程式在這次提供了哪些資訊。',
    quiz:{question:'本示範中，第二次提問能回答貓的名字，主要原因是什麼？',options:[['a','模型已永久修改權重記住名字。','這個例子沒有修改模型權重。'],['b','應用程式把先前資訊加入這次輸入。','答對了。先前對話被加入本次輸入，提供回答所需的資訊。'],['c','聊天視窗只要沒關閉，模型就不需收到前文。','畫面是否開啟，不能取代本次輸入中所需的資訊。']],correct:'b'},
    links:[['查看對話重送時序圖','memory.html'],['使用自己的提示詞測試','lab.html?experiment=memory&lesson=02&mode=free#advanced']]
  },
  {
    id:'03', season:1, shortTitle:'看見限制',title:'為什麼說得流暢，仍可能答錯？',summary:'分辨有說服力的語氣與可核對的證據。',
    lead:'一段話讀起來很自然，不代表背後一定有足夠資料。',
    objectives:['區分流暢度與正確性','知道資訊不足時需要查證'],
    explanation:['語言模型能產生連貫的文字，但它可能根據不完整或錯誤的資訊產生看似合理的答案。回答語氣確定，也不能證明內容已經核對過。','判斷時先看結論需要哪些資料，再檢查實際提供了什麼。如果沒有足夠依據，就應取得原始資料或可靠來源，而不是只請模型換個口吻回答。'],
    flow:['收到問題','依據可用資訊生成','形成流暢回答','檢查證據'],flowNote:'回答順暢是一種表現；有沒有可查證的依據，是另一個問題。',observation:'只有肯定的語氣時，無法核對數字。即使有報名名冊，也只能支持名冊人數；實際到場人數還需要簽到資料。',
    prediction:'看起來肯定的回答，就表示它查過資料嗎？',experiment:'evidence',takeaway:'回答的流暢與自信，不是正確性的證明。',
    quiz:{question:'回答語氣肯定，但沒有提供可核對的資料時，下一步最合理的是？',options:[['a','因為語氣肯定，所以直接採用。','語氣無法證明人數正確。'],['b','取得資料或可靠來源，再核對結論。','答對了。先取得資料，再核對回答的依據。'],['c','請模型換成更專業的語氣即可。','語氣改變不會補足缺少的資料。']],correct:'b'},
    links:[['開啟機率與認知實驗','lab.html?experiment=probability&lesson=03'],['查看 Strawberry 案例','concepts/tokens.html#strawberry']]
  },
  {
    id:'04', season:1, shortTitle:'學會查證',title:'怎樣讓答案有依據，並能核對？',summary:'用資料、工具與驗算建立可靠的分析流程。',
    lead:'工具能幫忙計算，但輸入資料是否完整，仍然需要我們檢查。',
    objectives:['理解工具執行與結果整理的分工','核對資料、公式、筆數與總和'],
    explanation:['處理資料時，可以讓計算工具執行明確的公式，再由模型協助解釋結果。但如果資料漏了一筆、欄位選錯或公式不適用，計算本身正確仍可能得到錯誤的結論。','因此要保留原始資料、確認欄位和公式，並將筆數與總和互相核對。可重做、可檢查的過程，比一個看起來漂亮的數字更重要。'],
    flow:['取得資料','確認欄位與公式','工具計算','核對筆數與總和','整理結論'],flowNote:'工具計算之後仍須檢查輸入、公式與結果，再整理成可交付的結論。',observation:'漏掉一筆時，200 是現有兩筆的正確加總，但筆數與原始資料不符。檢查輸入完整性和公式，才能判斷結果是否可用。',
    prediction:'如果計算工具只收到兩筆資料，計算沒出錯就代表報告正確嗎？',experiment:'arithmetic',takeaway:'可靠分析需要正確資料、適當工具，以及可重做的核對。',
    quiz:{question:'工具回傳總和後，還應檢查什麼？',options:[['a','只要是工具算的，就不需要檢查。','工具可能收到不完整的資料或錯誤公式。'],['b','輸入資料、公式、筆數與結果是否對得上。','答對了。計算與資料完整性都需要核對。'],['c','只需確認文字看起來專業。','排版與語氣不能證明數值正確。']],correct:'b'},
    links:[['開啟算術與工具實驗','lab.html?experiment=arithmetic&lesson=04'],['查看資料清洗與核對教材','01_Module1_Agent思維與資料分析/README.md']]
  },
  {
    id:'05', season:1, shortTitle:'掌握使用條件',title:'如何掌握成本、資料與權限？',summary:'了解用量估算，並保護金鑰與工具權限。',
    lead:'使用 AI 服務時，除了答案品質，也要留意資料如何流動與工具能做什麼。',
    objectives:['理解輸入與輸出用量可能分別計費','辨認憑證與外部內容的權限邊界'],
    explanation:['API 是應用程式與服務交換資訊的介面；不同服務的計價方式不同，可能分別計算輸入與輸出用量。先確認供應商的實際費率與計費規則，才能估計正式成本。','應用程式需要妥善管理金鑰及工具權限。外部文件可能包含「忽略原任務」之類的文字，應把它視為待處理內容，不應直接讓它取得更高的指令或工具權限。'],
    flow:['使用者操作','應用服務管理憑證與權限','模型或工具','結果與用量'],flowNote:'應用服務管理憑證與可執行動作；外部內容本身不應直接取得更高權限。',observation:'教學單價固定時，輸入與輸出數量都會影響估算。實際計費需確認供應商規則；外部資料也不應直接取得工具控制權。',
    prediction:'同樣長度的提問，如果回答長很多，費用可能不同嗎？',experiment:'cost',takeaway:'使用 AI 服務時，要一起管理用量、資料與可以執行的動作。',
    quiz:{question:'哪個使用方式比較合理？',options:[['a','把私人金鑰直接寫進公開教材網頁。','公開網頁中的金鑰可能被他人取得。'],['b','管理憑證與工具權限，並檢查實際用量。','答對了。憑證、權限與用量都需要管理。'],['c','讓外部文件中的所有指令直接控制工具。','外部文件是待處理的資料，不應自動取得工具控制權。']],correct:'b'},
    links:[['查看金鑰與前後端架構','security.html'],['查閱圖鑑成本章節','concepts/cost.html#pricing'],['開啟提示詞注入實驗','lab.html?experiment=injection&lesson=05']]
  },
  {
    id:'06', season:1, shortTitle:'完成工作',title:'怎樣從一次問答走到完成工作？',summary:'認識任務、工具、回傳與檢查的循環。',
    lead:'當任務需要多個步驟，我們可以把目標拆開，讓每個結果都有機會被檢查。',
    objectives:['理解工作流程的執行與檢查','區分 Agent、Skill 與 MCP 的角色'],
    explanation:['處理一項工作時，系統可以依目標決定下一步、使用適合的工具、觀察結果，再檢查是否達標。需要時應停下來請人確認，而不是無限制地執行。','Agent 是圍繞目標選擇行動並檢查結果的系統；Skill 是可重用的方法與指引；MCP 是連接工具與資源的協定。它們扮演不同角色，並非每個產品都必須經過的固定階梯。'],
    flow:['設定任務','決定下一步','使用工具','觀察並檢查','達標後交付'],flowNote:'未達標時可以調整後再試；涉及需要人確認的動作，應先停下等待確認。',observation:'範例把同一個任務拆成清理、計算、核對與說明；其中核對筆數讓我們在交付圖表前確認結果是否可信。',
    prediction:'產生圖表後，任務是否就一定完成了？',experiment:'workflow',takeaway:'完成工作需要執行與檢查的循環，也需要清楚的停止條件與權限。',
    quiz:{question:'下列哪個動作最能代表工作流程中的檢查步驟？',options:[['a','只確認圖表配色好看。','圖表好看仍不足以證明數值正確。'],['b','核對圖表數值是否與整理後的資料一致。','答對了。核對資料與圖表，才能確認結果是否一致。'],['c','一旦工具有回覆就停止。','工具回覆後仍要檢查是否符合目標。']],correct:'b'},
    links:[['查閱 Agent 工作流程','concepts/agent.html#agent-evolution'],['前往資料分析實作','00_課程手冊與即時看板/WORKSHOP_BOARD.html#module1-practice']]
  },

  /* 第二季：核心機制與進階實戰（#07～#12） */
  {
    id:'07', season:2, themeColor:'#B69CFF', shortTitle:'Attention 機制', title:'「它」到底是指誰？注意力機制如何幫字找關聯', summary:'理解 Attention 注意力分數，看模型如何動態連結代名詞與上下文。',
    lead:'「蛋糕放進冰箱，因為它太熱了」，你一秒知道它是蛋糕；換成「因為它太滿了」，它立刻變成冰箱。AI 是怎麼辨別的？',
    objectives:['理解 Attention 動態關聯評分','看懂代名詞指向取決於全句上下文'],
    explanation:['模型不是一個字一個字孤立地讀，而是整句一起看關係。注意力機制（Attention）讓每個字在生成時回頭掃描其他字，算出誰跟誰最有關係。','當句子出現代名詞「它」時，Attention 會對「蛋糕」、「冰箱」、「熱」各自打出注意力分數。「熱」通常用來形容蛋糕而非冰箱，因此「蛋糕」的分數最高；如果改為「太滿」，關聯最高的分數就瞬間轉移到「冰箱」。'],
    flow:['輸入完整句子','每個字相互比對','計算注意力關聯分數','高分權重指引含意','選定下一步生成'],
    flowNote:'Attention 讓模型具備「看前後文抓重點」的能力，解決代名詞與歧義問題。',
    observation:'切換形容詞時，「它」與名詞之間的關聯分數瞬間逆轉；證明 AI 不是死背字典，而是看全句關係。',
    prediction:'更換句子中的一個形容詞，AI 對「它」所指對象的判斷會改變嗎？',
    experiment:'attention',
    takeaway:'Attention 就是幫每個字在上下文中找到最重要的關聯。',
    quiz:{question:'「蛋糕放進冰箱，因為它太熱了」一句中，AI 如何知道「它」是蛋糕？', options:[['a','資料庫裡寫死「它」只能等於蛋糕。','代名詞的含意並非寫死在字典中。'],['b','Attention 機制算出「它」與「熱」及「蛋糕」的關聯分數最高。','答對了！Attention 透過全句權重計算，動態找出最相關的單字。'],['c','模型隨機猜測其中一個名詞。','注意力機制有嚴謹的權重計算，並非隨機猜測。']], correct:'b'},
    video:{src:'videos/ai_blindspots/AI盲點07_Attention注意力.mp4', poster:'assets/video-posters/ep7.jpg', duration:'41秒', color:'#B69CFF'},
    links:[['查看模型生成機制','concepts/model.html'],['在實驗室測試 Attention','lab.html?experiment=attention&lesson=07']]
  },
  {
    id:'08', season:2, themeColor:'#FF9F43', shortTitle:'Embedding 與 RAG', title:'AI 也能開書考？向量嵌入與先翻書再回答', summary:'把文字轉為語意座標，問答時先檢索最接近段落注入上下文。',
    lead:'公司規章三百頁，AI 怎麼一秒找到「請假怎麼辦」？它不需要把整本書死背進權重，而是先翻書再作答。',
    objectives:['理解 Embedding 語意座標距離','掌握 RAG 開書考流程與來源引用'],
    explanation:['第一步是 Embedding：將每段文字轉為一組數字座標（向量）。語意相近的句子，在多維座標空間中的距離就越近；「請假」和「休假」靠很近，跟「差旅報帳」離很遠。','第二步是 RAG（檢索增強生成）：當你提問時，系統先將問題化為座標，在知識庫中找出距離最近的段落，把這段內容直接塞入 Prompt 上下文，讓模型「照著這頁寫答案」，還能附上查證來源。'],
    flow:['提問轉為向量','計算語意距離','檢索最近規章段落','段落注入 Context','模型開書生成回答'],
    flowNote:'RAG 讓模型可以在不重新訓練的情況下獲取最新知識，並大幅減少幻覺。',
    observation:'計算語意距離能精準翻出最相關規章；回答帶有來源依據，隨時可點回去核對。',
    prediction:'如果規章更新了，RAG 需要重新訓練整個大語言模型嗎？',
    experiment:'rag',
    takeaway:'RAG 就是先翻書、再回答；要知識，翻書最快。',
    quiz:{question:'RAG（檢索增強生成）的核心優勢是什麼？', options:[['a','徹底修改模型的神經網路權重。','RAG 不改變模型權重，而是改變輸入的 Context。'],['b','先檢索最新相符資料放入上下文，讓模型依據資料回答並附來源。','答對了！就像開書考，翻出對的那頁直接回答，來源可核對。'],['c','讓模型學會寫出更多優美的詩句。','語意檢索主要用於準確回答與事實檢驗。']], correct:'b'},
    video:{src:'videos/ai_blindspots/AI盲點08_Embedding與RAG.mp4', poster:'assets/video-posters/ep8.jpg', duration:'42秒', color:'#FF9F43'},
    links:[['查閱 RAG 完整概念','concepts/knowledge.html#term-rag'],['在實驗室測試 RAG 檢索','lab.html?experiment=rag&lesson=08']]
  },
  {
    id:'09', season:2, themeColor:'#C6F432', shortTitle:'Context 塞太滿', title:'資料給越多越好？Lost in the Middle 與上下文工程', summary:'長文本中間最容易被忽略；學會精選、壓縮與分批的 Context Engineering。',
    lead:'一次丟一百頁資料給 AI，結果它漏掉最重要那一段？Context 不是垃圾桶，塞越多，重點越難找。',
    objectives:['理解長文本「迷失在中間」現象','學會精選、壓縮、分批三招 Context Engineering'],
    explanation:['研究發現，當輸入文本過長時，大語言模型對「開頭」與「結尾」的注意力最強，放在中間（30%~70% 處）的關鍵資訊往往會被忽略，這就是著名的 Lost in the Middle（迷失在中間）。','解決方法叫做 Context Engineering（上下文工程）：① 精選（只放這次回答必要的內容）；② 壓縮（太長就先萃取重點摘要）；③ 分批（依任務步驟需要時再給下一份）。'],
    flow:['分析任務所需資訊','精選關鍵段落','壓縮冗長背景','依序分批提供','精準命中無漏失'],
    flowNote:'給對的資料，比給多的資料更重要；讓關鍵資訊落在注意力聚焦區。',
    observation:'把關鍵密碼放在 50% 處，模型容易忽略；透過精選壓縮後，召回率立即恢復 100%。',
    prediction:'把整本 10 萬字書全部丟給 AI，是不是任何細節都能 100% 正確被回答？',
    experiment:'context_limit',
    takeaway:'給對的資料，比給多的資料重要；Context 越乾淨，答案越精準。',
    quiz:{question:'當需要讓 AI 分析大量資料時，哪種做法最不容易遺漏中間的關鍵重點？', options:[['a','不管長度全部塞進同一次提問中。','塞太滿容易發生 Lost in the middle 漏掉關鍵。'],['b','先精選並摘要核心段落，將重要資訊分批提供給模型。','答對了！Context Engineering 的精選與分批能保持模型專注。'],['c','把同一段話在中間重複貼十次。','重複文字浪費上下文空間且不能保證注意力聚焦。']], correct:'b'},
    video:{src:'videos/ai_blindspots/AI盲點09_Context塞太滿.mp4', poster:'assets/video-posters/ep9.jpg', duration:'43秒', color:'#C6F432'},
    links:[['查看 Context Engineering 專題','concepts/context-engineering.html'],['在實驗室測試中間迷失現象','lab.html?experiment=context_limit&lesson=09']]
  },
  {
    id:'10', season:2, themeColor:'#8EC5FF', shortTitle:'Token 與費用', title:'AI 是怎麼算錢的？Input/Output 計價與歷史滾雪球', summary:'Input 與 Output 分開計價，聊天越久歷史重送越多，掌握省錢三招。',
    lead:'用 AI API，帳單上寫的不是呼叫次數，而是 Token！而且送進去的跟吐出來的價格差很大。',
    objectives:['理解 Input 與 Output 差異計費','看懂多輪對話歷史重送的等差級數滾雪球現象'],
    explanation:['AI API 是以 Token 計量付費。你送進去的提示詞與歷史記錄叫 Input Token，模型產生的回覆叫 Output Token。因為生成文字運算更耗時，Output 通常比 Input 貴 2 到 4 倍！','多輪對話時，App 每次都必須重傳「整包先前對話」。聊到第 10 輪時，第 1 輪的文字已經被重送了 10 次！省錢三招：聊完一個主題就開新對話；別貼用不到的背景資料；要求回覆精簡。'],
    flow:['輸入問題與歷史','計算 Input Token 費用','模型逐字生成','計算 Output Token 費用','多輪累計等差級數'],
    flowNote:'重傳歷史是維持記憶的代價；善用新主題與摘要，避免費用無謂暴增。',
    observation:'連聊 5 輪後，如果不重開對話，第 5 輪的輸入成本比第 1 輪暴增 5 倍以上。',
    prediction:'如果我只問了一句「你好」，但對話視窗已經聊了一整天，費用只算「你好」這兩個字嗎？',
    experiment:'token_snowball',
    takeaway:'Token 就是 AI 世界的錢；聊完開新局，省錢又聰明。',
    quiz:{question:'為什麼聊了很久的對話視窗，越到後面費用消耗得越快？', options:[['a','模型運算時間久了會自動漲價。','API 費率是固定的，不會因時間延長而漲價。'],['b','為了維持記憶，應用程式每次都必須將先前全部對話當成 Input 重新傳送。','答對了！歷史對話每輪重複發送，導致 Input Token 像滾雪球般等差暴增。'],['c','模型回答的字數會自動隨時間倍增。','輸出字數取決於問題與指示，非時間倍增。']], correct:'b'},
    video:{src:'videos/ai_blindspots/AI盲點10_Token與費用_1.mp4', poster:'assets/video-posters/ep10.jpg', duration:'49秒', color:'#8EC5FF'},
    links:[['查看模型計價矩陣','concepts/cost.html#pricing'],['在實驗室計算 Token 滾雪球','lab.html?experiment=token_snowball&lesson=10']]
  },
  {
    id:'11', season:2, themeColor:'#FF7A7A', shortTitle:'Tool Calling', title:'AI 自己不會算數？工具呼叫與 Schema 說明書', summary:'AI 負責動腦，工具負責動手；三步呼叫流程與安全確認。',
    lead:'大語言模型數學常常算錯，那它怎麼查即時天氣、計算精密匯率？答案：它不自己做，而是叫工具來做！',
    objectives:['理解 Tool Calling 三步執行循環','掌握 Schema 參數規格與權限確認'],
    explanation:['AI 是機率預測下一個字，不具備精準算術引擎。當它需要計算或聯網時，會使用 Tool Calling（工具呼叫）。工具要有說明書（Schema），清楚定義工具名稱、參數格式與資料型態。','執行三步驟：① AI 動腦：「我想用計算機，參數是 amount=100000, rate=0.21」；② 應用程式真的去執行這個工具並拿到結果 21000；③ 將結果送回給 AI，AI 整理成自然流暢的語言回答。'],
    flow:['AI 判斷需要工具','產生 JSON 參數請求','外部程式執行工具','工具結果送回 Context','AI 整合產出自然語言'],
    flowNote:'AI 負責動腦下決策，外部工具負責動手精確執行；重要動作（如匯款、發信）須經人工確認。',
    observation:'單步拆解可以看到 AI 吐出的是純 JSON 結構；真正算數的是程式，AI 只負責把答案說得漂亮。',
    prediction:'Tool Calling 是模型自己連上網路去打字嗎？',
    experiment:'tool_calling',
    takeaway:'AI 負責動腦，工具負責動手；明確的 Schema 才能讓分工不出錯。',
    quiz:{question:'在 Tool Calling（工具呼叫）流程中，模型本身到底做了什麼？', options:[['a','模型自己打開瀏覽器去爬取即時網頁。','模型無法直接操作網路連線，必須透過應用端。'],['b','模型決定要呼叫什麼工具，並輸出符合 Schema 的結構化參數（如 JSON）。','答對了！AI 負責動腦給出參數，再由外圍程式執行並回傳。'],['c','模型自己執行 Python 代碼算出精準數值。','模型只是文字預測器，代碼執行由外圍環境沙盒處理。']], correct:'b'},
    video:{src:'videos/ai_blindspots/AI盲點11_ToolCalling工具呼叫_1.mp4', poster:'assets/video-posters/ep11.jpg', duration:'50秒', color:'#FF7A7A'},
    links:[['查看 Tool Calling 與 MCP 概念','concepts/agent-tools.html#term-tool-calling'],['在實驗室單步測試工具呼叫','lab.html?experiment=tool_calling&lesson=11']]
  },
  {
    id:'12', season:2, themeColor:'#7EE0B5', shortTitle:'微調 vs RAG vs LoRA', title:'讓 AI 變專家的三條路：改大腦、開書考、加外掛', summary:'要知識就翻書（RAG），要習慣就補習（Fine-tuning / LoRA）。',
    lead:'想讓 AI 懂你們公司的業務，要怎麼教它？有三條路：送去補習、讓它開書考、或者給它插個小外掛。',
    objectives:['辨別 Fine-tuning、RAG 與 LoRA 的根本差異','掌握不同業務情境的技術選型決策'],
    explanation:['第一條路：Fine-tuning（全量微調）— 送它去補習，用你的資料繼續訓練神經網路，修改的是「整個腦袋的權重」，成本高、時間長，適合讓它學會特定說話風格或專業習慣。','第二條路：RAG（檢索增強生成）— 讓它開書考，完全不改腦袋，問問題時翻出最新文件放進輸入，適合常常變動的公司規章與最新知識。','第三條路：LoRA（低秩適應）— 凍結原本大腦，只訓練一小塊外掛轉接板，便宜、輕量、快速，就像在大腦旁邊加一個小外掛。'],
    flow:['評估需求本質','資料變動頻繁？→ 選 RAG','需要特殊語氣風格？→ 選 LoRA','深度改變思考邏輯？→ 選 微調','架構落地交付'],
    flowNote:'要知識，就翻書（RAG）；要習慣，就補習（LoRA / 微調）。',
    observation:'不同需求點擊決策樹，會看見成本、訓練時間與知識更新頻率的巨大落差。',
    prediction:'如果公司每週都有新的產品報價單，應該每週都把模型重新微調（Fine-tuning）一次嗎？',
    experiment:'adaptation',
    takeaway:'要知識，就翻書；要習慣，就補習。',
    quiz:{question:'公司內部的產品售價與庫存每天都在變動，最適合採用哪種方式讓 AI 掌握？', options:[['a','每天把模型重新微調（Fine-tuning）一遍。','微調成本高、耗時長，且容易遺忘舊知識，不適合動態即時資料。'],['b','採用 RAG（檢索增強生成），問答時即時檢索最新資料庫。','答對了！知識常變動就用 RAG「開書考」，即時、低成本又精準。'],['c','將整個資料庫塞進 System Prompt 裡。','資料庫過大會超出上下文限制並浪費大量 Token 費用。']], correct:'b'},
    video:{src:'videos/ai_blindspots/AI盲點12_微調RAG與LoRA_1.mp4', poster:'assets/video-posters/ep12.jpg', duration:'54秒', color:'#7EE0B5'},
    links:[['查看模型適應與部署專題','concepts/deployment.html'],['在實驗室互動比對三條路','lab.html?experiment=adaptation&lesson=12']]
  }
];

// 當站的具體閱讀標題，與課程資料維持在同一處。
window.LEARNING_LESSON_HEADINGS = {
 '01':['回答如何逐步生成','從文字到下一個 Token','看看同一句話怎麼切分','文字被切成哪些片段'],
 '02':['前文如何成為這次輸入','保存、選取與重新組裝','比較有無先前對話','差別在這次提供了哪些資訊'],
 '03':['流暢與有依據是兩件事','從回答走向證據檢查','分辨資料能支持的結論','區分名冊與實際到場'],
 '04':['計算結果仍需要核對','資料、公式與檢查','找出漏掉的一筆資料','確認筆數與加總'],
 '05':['用量、資料與權限一起管理','一次請求經過哪些角色','調整用量，觀察估算','輸入與輸出都會影響用量'],
 '06':['完成工作需要執行與檢查','任務、工具、觀察與交付','跟著資料任務走一遍','交付之前先核對'],
 '07':['「它」到底是指誰？','每個字互相看關係','切換形容詞，觀察關聯逆轉','Attention 分數如何決定指向'],
 '08':['AI 也能開書考？','文字座標與檢索注入','點選問題，檢索相關規章','先翻書再回答，答案有來源'],
 '09':['資料給越多越好？','迷失在中間與注意力聚焦','調整資訊位置，測試召回率','Context Engineering 三招保證命中'],
 '10':['AI 是怎麼算錢的？','Input 與 Output 分開計價','多輪對話歷史等差暴增','開新主題與摘要，費用省 80%'],
 '11':['AI 自己不會算數？','Schema 說明書與三步執行','單步拆解：動腦參數到工具執行','工具動手，關鍵動作由人確認'],
 '12':['讓 AI 變專家的三條路','改大腦、開書考、加外掛','點擊業務情境，推薦最佳路徑','要知識就翻書，要習慣就補習']
};

// Short, in-place definitions let learners keep their place in the lesson.
window.LEARNING_INLINE_TERMS = {
 '01':[['LLM','大型語言模型，依本次上下文逐步產生回答。','concepts/model.html'],['Token','模型處理文字時使用的片段單位，切分方式依模型而異。','concepts/tokens.html']],
 '02':[['Context Window','上下文視窗是一次可處理內容的容量；歷史訊息、指示和工具結果都可能占用空間。','concepts/context.html'],['Compaction','以摘要等方式整理過長的上下文；重要細節仍需保留或回到來源核對。','concepts/context-engineering.html']],
 '03':[['Hallucination','模型可能產生缺乏依據、與資料不一致或錯誤的內容，即使語句流暢也一樣。','concepts/evidence.html'],['Knowledge Cutoff','模型訓練資料的時間範圍線索；即時資訊仍要看應用是否提供查詢或工具結果。','concepts/time.html']],
 '04':[['Tool Calling','模型提出工具請求，由應用程式執行並回傳結果；結果仍需核對。','concepts/agent-tools.html'],['RAG','先檢索相關資料，再交給模型回答；來源仍需核對。','concepts/knowledge.html#term-rag']],
 '05':[['API Key','服務用來識別與授權請求的憑證之一，可能關聯額度與費用。','concepts/api.html'],['Prompt Injection','外部內容試圖影響或改變原本的指示，需配合權限與檢查措施。','concepts/injection.html']],
 '06':[['Agent','圍繞目標選擇行動、觀察結果並決定下一步的系統。','concepts/agent.html'],['Skill 與 MCP','Skill 提供可重用的工作指引；MCP 是連接 AI 應用、工具與資料的協定。','concepts/agent-tools.html']],
 '07':[['Attention','注意力機制，讓模型在生成時計算當前字與上下文所有文字的關聯權重。','concepts/model.html'],['Winograd Schema','包含模糊代名詞的句型，需依賴世界常識與注意力機制才能正確消解。','concepts/tokens.html']],
 '08':[['Embedding','向量嵌入，將文字轉換為多維空間座標，語意越相近距離越近。','concepts/knowledge.html#term-rag'],['RAG','檢索增強生成，回答前先檢索相近文件注入 Context，如同開書考。','concepts/knowledge.html#term-rag']],
 '09':[['Lost in the Middle','迷失在中間，長文本中間段落最容易被模型注意力機制所忽略。','concepts/context-engineering.html'],['Context Engineering','上下文工程，透過精選、壓縮、分批等手法保持 Context 高效。','concepts/context-engineering.html']],
 '10':[['Input / Output Tokens','輸入提示詞與輸出生成文字分別計價，輸出通常為輸入的 2～4 倍價格。','concepts/cost.html#pricing'],['雪球效應 (Snowballing)','多輪對話時每次都必須重新發送全部前文，導致費用呈等差級數爆發。','concepts/cost.html']],
 '11':[['Tool Calling','模型透過結構化 Schema 輸出工具參數，由應用執行後回傳結果。','concepts/agent-tools.html#term-tool-calling'],['Schema','工具說明書，用 JSON 格式定義工具名稱、用途與必要參數。','concepts/agent-tools.html']],
 '12':[['Fine-tuning','全量微調，使用專業資料重新訓練調整神經網路全部權重，成本最高。','concepts/deployment.html'],['LoRA','低秩適應，凍結原本權重，只訓練極輕量外掛模組，兼具彈性與低成本。','concepts/deployment.html']]
};
