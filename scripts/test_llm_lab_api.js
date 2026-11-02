// Exercise the live-request path with synthetic credentials and a fake transport.
// This test never contacts a model provider or reads the user's browser storage.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const script = fs.readFileSync('js/lab.js', 'utf8');

async function checkProvider(provider) {
  const calls = [];
  const events = {};
  const elements = new Map();
  function element(name) {
    if (!elements.has(name)) {
      elements.set(name, {
        value: '', textContent: '', innerHTML: '', hidden: false, open: false,
        options: name === '#api-model' ? [{ value: 'google/gemma-3-12b-it' }] : [],
        addEventListener() {}, setAttribute() {}, append() {},
      });
    }
    return elements.get(name);
  }
  const root = element('lab-root');
  root.querySelector = selector => selector === '#system-prompt' ? null : element(selector);
  const saved = {
    llm_lab_provider: provider,
    llm_lab_gemini_key: 'synthetic-gemini-key',
    llm_lab_openrouter_key: 'synthetic-openrouter-key',
    llm_lab_openrouter_model: 'google/gemma-3-12b-it',
  };
  const document = {
    getElementById: element,
    querySelector: element,
    addEventListener(type, handler) { events[type] = handler; },
    createElement: () => element('created-option'),
  };
  const fakeResponse = provider === 'gemini'
    ? { candidates: [{ content: { parts: [{ thought: true, text: 'internal thought' }, { text: '第一段' }, { text: '第二段' }] } }] }
    : { choices: [{ message: { content: 'OpenRouter 回覆' } }] };
  const context = {
    document, window: { LEGACY_EXPERIMENTS: [] },
    location: { search: '?experiment=memory', href: 'http://localhost/lab.html?experiment=memory' },
    history: { pushState() {} }, URL, URLSearchParams, AbortController,
    localStorage: { getItem: key => saved[key] || null, setItem(key, value) { saved[key] = value; } },
    addEventListener() {},
    fetch: async (url, options) => { calls.push({ url, options }); return { ok: true, json: async () => fakeResponse }; },
  };
  vm.runInNewContext(script, context);
  assert.equal(calls.length, 0, 'loading the page must not send an API request');
  assert.equal(element('#api-key').value, saved[provider === 'gemini' ? 'llm_lab_gemini_key' : 'llm_lab_openrouter_key']);
  element('#free-prompt').value = '測試問題';
  events.click({ target: { closest: selector => selector === '[data-action]' ? { dataset: { action: 'send' } } : null } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls.length, 1);
  const { url, options } = calls[0];
  assert.equal(options.method, 'POST');
  assert.equal(url.includes('synthetic-'), false, 'credentials must not be placed in a URL');
  const body = JSON.parse(options.body);
  if (provider === 'gemini') {
    assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent');
    assert.equal(options.headers['x-goog-api-key'], saved.llm_lab_gemini_key);
    assert.equal(body.contents[0].parts[0].text, '測試問題');
    assert.match(element('#free-response').textContent, /第一段第二段/);
    assert.doesNotMatch(element('#free-response').textContent, /internal thought/);
  } else {
    assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
    assert.equal(options.headers.Authorization, 'Bearer ' + saved.llm_lab_openrouter_key);
    assert.equal(body.model, saved.llm_lab_openrouter_model);
    assert.equal(body.messages[0].content, '測試問題');
    assert.match(element('#free-response').textContent, /OpenRouter 回覆/);
  }
}

(async () => {
  await checkProvider('gemini');
  await checkProvider('openrouter');
  console.log('PASS: saved API settings and both request paths with a fake transport');
})().catch(error => { console.error(error); process.exitCode = 1; });
