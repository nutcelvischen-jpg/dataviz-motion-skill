(function () {
  'use strict';
  const byId=id=>document.getElementById(id);
  const esc=value=>String(value == null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pieces=text=>text.match(/[A-Za-z]+|[0-9]+|[^\s]/gu)||[];
  const token=byId('token-input');
  if(token){
  function updateToken(){
    const parts=pieces(token.value), out=byId('token-pieces');byId('token-characters').textContent=String(Array.from(token.value).length);byId('token-count').textContent=String(parts.length);out.replaceChildren();
    parts.slice(0,300).forEach(p=>{const span=document.createElement('span');span.textContent=p;out.append(span);});
    if(!parts.length)out.textContent='輸入文字後顯示片段。';if(parts.length>300)out.append('（僅顯示前 300 個片段）');
  }
  token.addEventListener('input',updateToken);
  document.querySelectorAll('[data-token-preset]').forEach(button=>button.addEventListener('click',()=>{
    const samples={"zh": "大語言模型本質上是一組凍結的浮點數權重矩陣，每一次對話都在根據機率預測下一個 Token！", "en": "Language models are next-token probability samplers trained on massive text corpora using Byte-Pair Encoding.", "strawberry": "How many letters 'r' are there in the word strawberry?", "code": "import pandas as pd\nimport numpy as np\n\ndf = pd.read_csv('sales.csv')\nprint(df.groupby('region')['revenue'].sum())"};
    token.value=samples[button.dataset.tokenPreset];updateToken();
  }));
    updateToken();
  }
  if(byId('cost-input') && byId('cost-output')){
  let mode='official';
  const input=byId('cost-input'), output=byId('cost-output');
  function valid(el){return el.value.trim()!=='' && Number.isSafeInteger(Number(el.value)) && Number(el.value)>=0;}
  function updateCost(){
    const good=valid(input)&&valid(output); const count=valid(input)?Number(input.value):null;
    byId('cost-result').textContent=good?'USD '+((Number(input.value)+2*Number(output.value))/1000000).toFixed(6).replace(/0+$/,'').replace(/\.$/,''):'請輸入零或正整數的 Token 數。';
    byId('price-rows').innerHTML=window.REFERENCE_PRICES.map(function(m){
      const rate=mode==='official'?m.officialRate:m.openrouterRate;
      return '<tr><th scope="row">'+esc(m.name)+'</th><td>$'+Number(rate).toFixed(3)+'</td><td>'+(count===null?'—':'$'+(count*rate/1000000).toFixed(6))+'</td><td>原教材，待核對</td></tr>';
    }).join('');
  }
  [input,output].forEach(el=>el.addEventListener('input',updateCost));
  document.querySelectorAll('[data-quick]').forEach(button=>button.addEventListener('click',()=>{input.value=button.dataset.quick;updateCost();}));
  document.querySelectorAll('.rate-mode').forEach(button=>button.addEventListener('click',()=>{mode=button.dataset.mode;document.querySelectorAll('.rate-mode').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));updateCost();}));
    updateCost();
  }
  if(byId('model-rows')){
  const typeNames={cloud:'雲端服務',open:'開放權重',local:'本機部署'};
  function renderModels(filter){
    byId('model-rows').innerHTML=window.REFERENCE_MODELS.filter(m=>filter==='all'||m.types.includes(filter)).map(function(m){
      const type=m.types.map(t=>typeNames[t]).join('、')||'待核對';
      return '<tr><th scope="row">'+esc(m.name)+'<details class="deep-dive"><summary>查看原教材細節</summary><p class="notice">原教材中的敘述與數據待核對。</p><div class="legacy-material">'+m.detail+'</div></details></th><td>'+esc(type)+'</td><td>原教材用途，待核對</td><td>待核對</td><td>既有教材，待核對</td></tr>';
    }).join('');
  }
  document.querySelectorAll('.model-filter').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.model-filter').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));renderModels(button.dataset.filter);}));
    renderModels('all');
  }
  if(byId('live-model')){
  const model=byId('live-model'),key=byId('live-key'),keyGroup=byId('live-key-group'),live=byId('live-output');
  function stored(name){try{return localStorage.getItem(name)||'';}catch(_){return '';}}
  model.addEventListener('change',()=>{keyGroup.hidden=model.value==='simulation';key.value=model.value.startsWith('openrouter:')?stored('llm_lab_openrouter_key'):model.value.startsWith('gemini:')?stored('llm_lab_gemini_key'):'';});
  byId('live-send').addEventListener('click',async()=>{
    const prompt=byId('live-prompt').value.trim(),selected=model.value;
    if(!prompt){live.textContent='請先輸入示範問題。';return;}
    if(selected==='simulation'){live.textContent='教學示範，非即時模型回覆。\n示意輸入 Token 數：'+pieces(prompt).length+'；示意輸出數：28。此數字不能用於正式計費。';return;}
    if(!key.value.trim()){live.textContent='尚未設定 API Key。請輸入金鑰，或切換回本地教學模擬。';return;}
    const open=selected.startsWith('openrouter:'),apiKey=key.value.trim(),modelName=selected.split(':').slice(1).join(':');
    try {localStorage.setItem(open?'llm_lab_openrouter_key':'llm_lab_gemini_key',apiKey);}catch(_){}
    live.textContent='正在請求模型回覆與用量……';
    try{
      const url=open?'https://openrouter.ai/api/v1/chat/completions':'https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(modelName)+':generateContent';
      const headers=open?{'Authorization':'Bearer '+apiKey,'Content-Type':'application/json'}:{'x-goog-api-key':apiKey,'Content-Type':'application/json'};
      const body=open?{model:modelName,messages:[{role:'user',content:prompt}]}:{contents:[{role:'user',parts:[{text:prompt}]}]};
      const response=await fetch(url,{method:'POST',headers:headers,body:JSON.stringify(body)});if(!response.ok)throw new Error('HTTP '+response.status);
      const data=await response.json();
      const parts=data.candidates?.[0]?.content?.parts;
      const answer=open?data.choices?.[0]?.message?.content:(Array.isArray(parts)?parts.filter(part=>!part.thought&&typeof part.text==='string').map(part=>part.text).join(''):'');
      const usage=open?data.usage:data.usageMetadata;
      live.textContent='真實 API 回覆：\n'+(answer||'模型未回傳文字。')+'\n\n服務回傳的用量：\n'+(usage?JSON.stringify(usage,null,2):'服務未提供用量。');
    }catch(e){live.textContent='請求失敗（'+e.message+'）。請檢查設定，或改用教學模擬。';}
  });
  }
}());
