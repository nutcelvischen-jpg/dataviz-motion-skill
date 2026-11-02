// Regression checks for finding a concept, returning to results and old bookmarks.
// Runs against shipped directory entries. No browser storage or network access.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const decode = s => s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#x27;/g,"'");
const attrs = s => Object.fromEntries([...s.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],decode(m[2])]));
const routeContext = {window:{}};
vm.runInNewContext(read('js/reference-routes.js'),routeContext);
const routes = routeContext.window.LLM_REFERENCE_ROUTES;
const html = read('encyclopedia.html');
function node(extra={}) {
  return {hidden:false,value:'',textContent:'',listeners:{},attributes:{},
    addEventListener(name,fn){this.listeners[name]=fn;},
    setAttribute(name,value){this.attributes[name]=value;},
    focus(){this.focused=true;},...extra};
}
function catalog(search='',hash='') {
  const items = [...html.matchAll(/<li\b([^>]*class="catalog-item"[^>]*)>([\s\S]*?)<\/li>/g)].map(m=>{
    const a=attrs(m[1]),linkAttrs=attrs(m[2].match(/<a\b([^>]*)>/)[1]);
    const link={href:linkAttrs.href,getAttribute(){return linkAttrs.href;}};
    return node({dataset:{category:a['data-category'],kind:a['data-kind'],search:a['data-search']},
      textContent:decode(m[2].replace(/<[^>]*>/g,' ')),querySelector(){return link;},link});
  });
  const groups=['model','instruction','agent','safety','graphics','resources'].map(group=>node({
    querySelectorAll(){return items.filter(el=>group==='resources'?el.dataset.kind!=='term':el.dataset.kind==='term'&&el.dataset.category===group);}
  }));
  const filters=['all','model','instruction','agent','safety','graphics'].map(category=>node({dataset:{category}}));
  const ids=Object.fromEntries(['catalog-search','catalog-search-form','catalog-status','catalog-clear','catalog-empty','catalog-reset','catalog-resources-link'].map(id=>[id,node()]));
  const location={href:'http://localhost/encyclopedia.html'+search+hash,search,hash,pathname:'/encyclopedia.html',replace(url){this.redirected=url;}};
  const events={};
  vm.runInNewContext(read('js/catalog.js'),{
    document:{getElementById:id=>ids[id],querySelectorAll:s=>s==='.catalog-item'?items:s==='.catalog-group'?groups:filters},
    location,history:{replaceState(_s,_t,value){const url=new URL(value,location.href);Object.assign(location,{href:url.href,search:url.search,hash:url.hash,pathname:url.pathname});}},
    window:{LLM_REFERENCE_ROUTES:routes},URL,URLSearchParams,addEventListener:(name,fn)=>events[name]=fn
  });
  return {items,groups,filters,ids,location,events,visible:()=>items.filter(el=>!el.hidden),
    search(text){ids['catalog-search'].value=text;ids['catalog-search'].listeners.input();}};
}
const page=catalog();
assert.equal(page.items.filter(x=>x.dataset.kind==='term').length,45);
assert.equal(page.items.filter(x=>x.dataset.kind==='resource').length,10);
assert.equal(page.visible().length,55);
for(const query of ['mOe','混合专家','混合專家']) {
  page.search(query);
  assert.ok(page.visible().some(el=>el.link.href.includes('/concepts/moe.html')),'MoE must be discoverable by alias');
  assert.equal(new URL(page.location.href).searchParams.get('q'),query);
}
page.search('ＭｏＥ');
assert.ok(page.visible().some(el=>el.link.href.includes('/concepts/moe.html')),'full-width text is searchable');
page.search('unknown-no-such-concept');
assert.equal(page.visible().length,0);assert.equal(page.ids['catalog-empty'].hidden,false);
page.ids['catalog-reset'].listeners.click();
assert.equal(page.visible().length,55);assert.equal(page.ids['catalog-search'].focused,true);
page.filters.find(x=>x.dataset.category==='agent').listeners.click();
assert.equal(page.visible().length,13);
assert.ok(page.visible().every(el=>el.dataset.category==='agent'));
page.search('Agent Loop');
assert.equal(page.visible().length,1);
const selected=new URL(page.visible()[0].link.href);
assert.equal(selected.searchParams.get('fromq'),'Agent Loop');
assert.equal(selected.searchParams.get('fromcat'),'agent');
const restored=catalog('?q=Agent+Loop&category=agent');
assert.equal(restored.visible().length,1);
assert.equal(restored.filters.find(x=>x.dataset.category==='agent').attributes['aria-pressed'],'true');
page.ids['catalog-resources-link'].listeners.click();assert.equal(page.visible().length,55);
assert.equal(catalog('', '#terms-agent').visible().length,13);
assert.equal(catalog('?category=invalid').visible().length,55);
assert.equal(catalog('', '#%E0%A4%A').location.redirected,undefined);
assert.equal(catalog('', '#https%3A%2F%2Fexample.com').location.redirected,undefined);
for(const [id,destination] of Object.entries(routes)) {
  assert.equal(catalog('', '#'+id).location.redirected,destination);
  const [file,anchor]=destination.split('#');
  const target=read(file);
  if(anchor)assert.ok(target.includes('id="'+anchor+'"'),`${id} has a real destination`);
}
const changing=catalog();changing.location.hash='#moe';changing.events.hashchange();assert.equal(changing.location.redirected,routes.moe);
const returns=[{},{}];
vm.runInNewContext(read('js/concept-reader.js'),{
  location:{search:selected.search,href:selected.href},URL,URLSearchParams,
  document:{querySelectorAll:()=>returns}
});
const back=new URL(returns[0].href);
assert.equal(back.pathname,'/encyclopedia.html');assert.equal(back.searchParams.get('q'),'Agent Loop');assert.equal(back.searchParams.get('category'),'agent');
for (const origin of ['model','context','knowledge','tools','control','quality','flow']) {
  const link={};
  vm.runInNewContext(read('js/concept-reader.js'),{
    location:{search:'?frommap='+origin,href:'http://localhost/concepts/agent.html?frommap='+origin},URL,URLSearchParams,
    document:{querySelectorAll:()=>[link]}
  });
  const target=new URL(link.href);
  assert.equal(target.pathname,'/concepts/overview.html');
  assert.equal(target.hash,origin==='flow'?'#task-flow':'#map-'+origin);
}
const invalidMapLink={};
vm.runInNewContext(read('js/concept-reader.js'),{
  location:{search:'?frommap=https://example.com',href:'http://localhost/concepts/agent.html'},URL,URLSearchParams,
  document:{querySelectorAll:()=>[invalidMapLink]}
});
assert.equal(invalidMapLink.href,undefined,'untrusted return destinations must not be used');

// Each extracted interactive chapter must initialize without sibling chapter elements.
const reference=read('js/reference.js');
for(const kind of ['tokens','cost','models','none']) {
  const nodes={};
  const add=(id,value='')=>nodes[id]=node({value,innerHTML:'',children:[],replaceChildren(){this.children=[];},append(v){this.children.push(v);}});
  if(kind==='tokens'){add('token-input','a cat');for(const id of ['token-pieces','token-characters','token-count'])add(id);}
  if(kind==='cost'){add('cost-input','2000');add('cost-output','500');add('cost-result');add('price-rows');}
  if(kind==='models')add('model-rows');
  vm.runInNewContext(reference,{
    document:{getElementById:id=>nodes[id]||null,querySelectorAll:()=>[],createElement:()=>node()},
    window:{REFERENCE_PRICES:[],REFERENCE_MODELS:[{name:'Fixture',types:['local'],detail:'test'}]}
  });
  if(kind==='tokens')assert.equal(nodes['token-count'].textContent,'2');
  if(kind==='cost')assert.equal(nodes['cost-result'].textContent,'USD 0.003');
  if(kind==='models')assert.match(nodes['model-rows'].innerHTML,/Fixture/);
}
console.log('PASS: 45 terms, 10 resources, aliases, filters, empty recovery, catalog/map return state, 45 old bookmarks and isolated interactive chapters');
