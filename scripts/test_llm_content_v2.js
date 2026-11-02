// Compatibility checks for old bookmarks, deep links and experiment identities.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const nav = read('js/content-navigation.js');

function runNavigation(hash, options = {}) {
  const events = {};
  const chapter = {tagName:'SECTION',id:'pricing',parentElement:null};
  const outer = {tagName:'DETAILS',open:false,parentElement:options.withSidebar ? chapter : null};
  const target = {tagName:'DETAILS',id:'api-trial',open:false,parentElement:outer,scrollIntoView(){this.scrolled=true;}};
  const navGroup = {open:false};
  const navLink = {getAttribute(){return '#pricing';},closest(){return navGroup;}};
  let redirected = null;
  const document = {
    body:{dataset:{reference:options.reference ? 'true' : 'false'}},
    getElementById(id){return id==='api-trial' ? target : null;},
    querySelectorAll(selector){return options.withSidebar && selector === '.desktop-toc a[href^="#"]' ? [navLink] : [];}
  };
  const location = {hash,replace(url){redirected=url;}};
  const context = {document,location,window:{},addEventListener(name,fn){events[name]=fn;},requestAnimationFrame(fn){fn();},decodeURIComponent,Object};
  vm.runInNewContext(nav,context);
  return {events,location,target,outer,navGroup,get redirected(){return redirected;}};
}
const moved = {
  'agent-breach':'topics/agent-incidents.html',
  'macro-economy':'topics/ai-economy.html',
  'distillation-security':'topics/model-distillation.html',
  'world-models-math-space':'topics/frontier-research.html'
};
for (const [hash,destination] of Object.entries(moved)) {
  const actual=runNavigation('#'+hash,{reference:true});
  assert.equal(actual.redirected,destination);
  assert.ok(fs.existsSync(path.join(root,destination)));
}
const trial=runNavigation('#api-trial',{reference:true});
assert.equal(trial.target.open,true);
assert.equal(trial.outer.open,true);
assert.equal(trial.target.scrolled,true);
assert.equal(runNavigation('#api-trial',{reference:true,withSidebar:true}).navGroup.open,true);
assert.equal(runNavigation('#https%3A%2F%2Fexample.com',{reference:true}).redirected,null);
assert.doesNotThrow(()=>runNavigation('#%E0%A4%A',{reference:true}));
const hashChange=runNavigation('',{reference:true});
hashChange.location.hash='#macro-economy';
hashChange.events.hashchange();
assert.equal(hashChange.redirected,'topics/ai-economy.html');

const context={window:{}};
vm.runInNewContext(read('js/lab-legacy-data.js'),context);
const legacy=Array.from(context.window.LEGACY_EXPERIMENTS,x=>x.id).sort();
const live=Array.from(read('js/lab.js').matchAll(/\{id:'([a-z_]+)', title:/g),m=>m[1]).sort();
const expected=['tokens','time','memory','probability','injection','arithmetic','agent_breach','security'].sort();
assert.deepEqual(legacy,expected);
assert.deepEqual(live,expected);
console.log('PASS: moved bookmarks, nested deep links, malformed hashes and all eight experiment IDs');
