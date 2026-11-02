(function () {
  'use strict';
  const input = document.getElementById('catalog-search');
  if (!input) return;
  const categories = ['all','model','instruction','agent','safety','graphics'];
  const hashCategories = {'terms-model':'model','terms-instruction':'instruction','terms-agent':'agent','terms-safety':'safety','terms-graphics':'graphics'};
  const items = [...document.querySelectorAll('.catalog-item')];
  const groups = [...document.querySelectorAll('.catalog-group')];
  const filters = [...document.querySelectorAll('.catalog-filter')];
  const status = document.getElementById('catalog-status');
  const clear = document.getElementById('catalog-clear');
  const empty = document.getElementById('catalog-empty');
  const params = new URLSearchParams(location.search);
  let category = categories.includes(params.get('category')) ? params.get('category') : 'all';
  input.value = (params.get('q') || '').slice(0,120);
  const normalize = text => text.normalize('NFKC').toLowerCase().replace(/[\s\-_/／]/g,'');
  const index = items.map(el => ({el, text:normalize(el.textContent+' '+(el.dataset.search || ''))}));
  const links = items.map(el => {const a=el.querySelector('a');return {a,href:a.getAttribute('href')};});
  function hashId() { try { return decodeURIComponent(location.hash.slice(1)); } catch (_) { return ''; } }
  function oldBookmark() {
    const id = hashId(), routes = window.LLM_REFERENCE_ROUTES || {};
    if (Object.prototype.hasOwnProperty.call(routes,id)) {location.replace(routes[id]);return true;}
    return false;
  }
  if (oldBookmark()) return;
  if (hashCategories[hashId()] && !params.has('category')) category=hashCategories[hashId()];
  function render(save) {
    const query=input.value.trim(), words=query.split(/\s+/).filter(Boolean).map(normalize);
    let terms=0,resources=0;
    index.forEach(({el,text}) => {
      const visible=(category==='all'||el.dataset.category===category)&&words.every(word=>text.includes(word));
      el.hidden=!visible;
      if(visible){if(el.dataset.kind==='term')terms++;else resources++;}
    });
    groups.forEach(group => {group.hidden=![...group.querySelectorAll('.catalog-item')].some(el=>!el.hidden);});
    filters.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.category===category)));
    status.textContent=terms+' 個名詞'+(resources?'・'+resources+' 項延伸資料':'')+(query?'符合搜尋':'');
    empty.hidden=terms+resources>0;
    clear.hidden=!query;
    links.forEach(({a,href})=>{
      const url=new URL(href,location.href);
      if(query)url.searchParams.set('fromq',query);
      if(category!=='all')url.searchParams.set('fromcat',category);
      a.href=url.href;
    });
    if(save){
      const url=new URL(location.href);
      if(query)url.searchParams.set('q',query);else url.searchParams.delete('q');
      if(category!=='all')url.searchParams.set('category',category);else url.searchParams.delete('category');
      history.replaceState(null,'',url);
    }
  }
  input.addEventListener('input',()=>render(true));
  document.getElementById('catalog-search-form').addEventListener('submit',event=>{event.preventDefault();render(true);});
  filters.forEach(button=>button.addEventListener('click',()=>{
    category=button.dataset.category;
    if(hashCategories[hashId()])history.replaceState(null,'',location.pathname+location.search+'#term-map');
    render(true);
  }));
  clear.addEventListener('click',()=>{input.value='';render(true);input.focus();});
  document.getElementById('catalog-reset').addEventListener('click',()=>{input.value='';category='all';render(true);input.focus();});
  document.getElementById('catalog-resources-link').addEventListener('click',()=>{input.value='';category='all';render(true);});
  addEventListener('hashchange',()=>{if(oldBookmark())return;const next=hashCategories[hashId()];if(next){category=next;input.value='';render(true);}});
  addEventListener('pageshow',()=>render(false));
  render(false);
}());
