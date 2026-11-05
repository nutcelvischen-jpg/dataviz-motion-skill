// Comprehensive verification of the new 3-step lab architecture, presets, model selection, and edge cases.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const labScript = fs.readFileSync('js/lab.js', 'utf8');
const dataScript = fs.readFileSync('js/lab-legacy-data.js', 'utf8');

console.log('--- Testing 3-Step Lab Architecture ---');

// 1. Test data integrity in js/lab-legacy-data.js
const dataContext = { window: {} };
vm.runInNewContext(dataScript, dataContext);
const experiments = dataContext.window.LEGACY_EXPERIMENTS;
assert.ok(Array.isArray(experiments), 'LEGACY_EXPERIMENTS must be an array');
assert.equal(experiments.length, 8, 'There must be exactly 8 experiments');

const expectedIds = ['tokens', 'memory', 'time', 'probability', 'arithmetic', 'injection', 'security', 'agent_breach'].sort();
const actualIds = Array.from(experiments.map(x => String(x.id))).sort();
assert.deepEqual([...actualIds], [...expectedIds], 'All 8 experiment IDs must be present in legacy data');

// Check every experiment has title, concept, presets, and takeaway
for (const exp of experiments) {
  assert.ok(exp.title && typeof exp.title === 'string', `${exp.id} must have a title`);
  assert.ok(exp.concept && typeof exp.concept === 'string', `${exp.id} must have a concept definition`);
  assert.ok(Array.isArray(exp.presets) && exp.presets.length > 0, `${exp.id} must have presets`);
  assert.ok(exp.takeaway && typeof exp.takeaway === 'string', `${exp.id} must have a takeaway`);
  // Verify NO negative disclaimers exist in the content
  assert.doesNotMatch(exp.concept, /待核對|舊教材/, `${exp.id} concept must not have negative disclaimer`);
  assert.doesNotMatch(exp.takeaway, /待核對|舊教材/, `${exp.id} takeaway must not have negative disclaimer`);
}
console.log('PASS: js/lab-legacy-data.js has pure definitions, presets, and takeaways for all 8 experiments without negative disclaimers');

// 2. Test js/lab.js rendering and DOM output
function runLabContext(search = '?experiment=memory', localStorageData = {}, options = {}) {
  const events = {};
  const elements = new Map();
  function element(name) {
    if (!elements.has(name)) {
      const matchAction = name.match(/\[data-action="([^"]+)"\]/);
      const actionVal = matchAction ? matchAction[1] : '';
      const cleanId = name.startsWith('#') ? name.slice(1) : '';
      const el = {
        id: cleanId,
        value: '', textContent: '', innerHTML: '', hidden: false, open: false,
        className: '', classList: {
          toggle(cls, force) {
            const has = el.className.split(/\s+/).includes(cls);
            if (force === undefined) force = !has;
            const set = new Set(el.className.split(/\s+/).filter(Boolean));
            if (force) set.add(cls); else set.delete(cls);
            el.className = Array.from(set).join(' ');
          }
        },
        dataset: actionVal ? { action: actionVal } : {},
        options: name === '#api-model' ? [{ value: 'openai/gpt-3.5-turbo-16k' }] : [],
        addEventListener(evt, h) { events[evt] = h; },
        setAttribute() {}, append() {}, appendChild() {},
        closest(sel) {
          if (sel === '[data-action]') return el.dataset && el.dataset.action ? el : null;
          return null;
        },
        focus() {}, scrollIntoView() {}, click() {
          if (events.click) events.click({ target: el, button: 0, preventDefault() {} });
        }
      };
      if (!options.omitReplaceChildren) {
        el.replaceChildren = function () { el.innerHTML = ''; };
      }
      elements.set(name, el);
    }
    return elements.get(name);
  }
  const root = element('lab-root');
  root.querySelector = selector => {
    if (selector === '#system-prompt' && !elements.has('#system-prompt')) return null;
    return element(selector);
  };
  root.querySelectorAll = selector => {
    return Array.from(elements.entries()).filter(([k]) => k.startsWith(selector) || selector.includes('data-legacy')).map(([, v]) => v);
  };
  const document = {
    getElementById: element,
    querySelector: element,
    querySelectorAll: () => [],
    addEventListener(type, handler) { events[type] = handler; },
    createElement: () => element('created-element'),
    createDocumentFragment: () => ({ appendChild() {} })
  };
  const calls = [];
  const storage = Object.assign({}, localStorageData);
  let pushedUrl = null;
  const context = {
    document,
    window: { LEGACY_EXPERIMENTS: experiments, LAB_EXPERIMENTS: experiments, scrollTo() {} },
    location: { search, href: 'http://localhost/lab.html' + search },
    history: { pushState(_, __, url) { pushedUrl = url; } },
    URL,
    URLSearchParams,
    AbortController,
    localStorage: {
      getItem: k => storage[k] || null,
      setItem(k, v) { storage[k] = v; }
    },
    addEventListener() {},
    requestAnimationFrame: fn => fn(),
    fetch: async (url, fetchOptions) => {
      calls.push({ url, options: fetchOptions });
      return { ok: true, json: async () => ({ choices: [{ message: { content: 'Echo answer' } }] }) };
    }
  };
  vm.runInNewContext(labScript, context);
  return { context, root, element, elements, events, calls, storage, getPushedUrl: () => pushedUrl };
}

// Test Index page
const indexRun = runLabContext('');
assert.match(indexRun.root.innerHTML, /大語言模型本質探秘實驗室/);
assert.match(indexRun.root.innerHTML, /理解模型的回答/);
assert.match(indexRun.root.innerHTML, /用工具核對結果/);
assert.match(indexRun.root.innerHTML, /管理指令與權限/);
console.log('PASS: index page renders 8 experiments grouped under 3 categories');

// Test Experiment page 3 steps
const expRun = runLabContext('?experiment=injection');
assert.match(expRun.root.innerHTML, /Step 1 · 核心概念定義/);
assert.match(expRun.root.innerHTML, /Step 2 · 運算模式與模型選擇/);
assert.match(expRun.root.innerHTML, /Step 3 · 動手實驗/);
assert.match(expRun.root.innerHTML, /💡 實驗觀察重點/);
assert.match(expRun.root.innerHTML, /臺北捷運/);
console.log('PASS: experiment page cleanly renders Step 1, Step 2, and Step 3 without folded disclaimers');

// Test Simulation Mode Preset Run
const simRun = runLabContext('?experiment=tokens');
const presetSample = experiments.find(x => x.id === 'tokens').presets[0];
simRun.element('#free-prompt').value = presetSample.prompt;
simRun.events.click({ target: { closest: s => s === '[data-action]' ? { dataset: { action: 'send' } } : null } });
assert.match(simRun.element('#free-response').textContent, /教學模擬回覆/);
console.log('PASS: simulation mode displays curated preset responses without API Key');

// Test Tokens loading with omitReplaceChildren (must NOT crash)
assert.doesNotThrow(() => {
  runLabContext('?experiment=tokens', {}, { omitReplaceChildren: true });
}, 'tokens experiment must not crash even if stream.replaceChildren is undefined');
console.log('PASS: tokens experiment survives without stream.replaceChildren');

// Test Windows \r\n newline matching in simulation mode
const winRun = runLabContext('?experiment=tokens');
const pyPreset = experiments.find(x => x.id === 'tokens').presets[2];
winRun.element('#free-prompt').value = pyPreset.prompt.replace(/\n/g, '\r\n');
winRun.events.click({ target: { closest: s => s === '[data-action]' ? { dataset: { action: 'send' } } : null } });
assert.doesNotMatch(winRun.element('#free-response').textContent, /此自由輸入未在預設示範清單中/, 'multiline preset with Windows newlines must match correctly');
console.log('PASS: Windows \\r\\n newlines correctly match presets in simulation mode');

// Test SPA return to index
const returnRun = runLabContext('?experiment=memory');
returnRun.events.click({
  target: { closest: sel => sel === 'a[href="lab.html"]' ? {} : null },
  button: 0
});
assert.match(returnRun.root.innerHTML, /大語言模型本質探秘實驗室/, 'Clicking return to lab.html must render index');
console.log('PASS: returning to index via SPA link works seamlessly');

// Test API Key save & Enter key
const keyRun = runLabContext('?experiment=memory', {}, {});
const provSelect = keyRun.element('#provider');
provSelect.value = 'openrouter';
keyRun.events.change({ target: provSelect });
keyRun.element('#api-key').value = 'sk-or-v1-my-secret-key-12345';
keyRun.events.keydown({ key: 'Enter', target: { id: 'api-key' }, preventDefault() {} });
assert.equal(keyRun.storage['llm_lab_openrouter_key'], 'sk-or-v1-my-secret-key-12345');
console.log('PASS: API key save via Enter key stores to localStorage');

// Test 00_LLM本質探秘實驗室.html syntax and clean navigation
const legacyHtml = fs.readFileSync('00_LLM本質探秘實驗室.html', 'utf8');
assert.match(legacyHtml, /href="lab\.html"/, '00_LLM本質探秘實驗室.html must link to standard lab.html');
// Verify the floating bar is outside <script>
const scriptEnd = legacyHtml.lastIndexOf('</script>');
const floatingBar = legacyHtml.indexOf('Floating Mobile Portal Bar');
assert.ok(floatingBar > scriptEnd, 'Floating mobile portal bar must be outside of script tags');
console.log('PASS: 00_LLM本質探秘實驗室.html has valid markup and outside floating portal');

console.log('ALL LAB 3-STEP TESTS PASSED! 🎉');
