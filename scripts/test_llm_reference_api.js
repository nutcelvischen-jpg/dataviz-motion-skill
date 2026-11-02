// Exercise the encyclopedia API demo using synthetic credentials and fake responses.
// This script never accesses a provider or the user's browser storage.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

async function main() {
  const calls = [];
  const elements = new Map();
  const saved = {
    llm_lab_gemini_key: 'synthetic-gemini-key',
    llm_lab_openrouter_key: 'synthetic-openrouter-key',
  };
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      value: '', textContent: '', innerHTML: '', hidden: false,
      listeners: {}, children: [],
      addEventListener(type, handler) { this.listeners[type] = handler; },
      replaceChildren() { this.children = []; },
      append(child) { this.children.push(child); },
      setAttribute() {},
    });
    return elements.get(id);
  }
  element('cost-input').value = '0';
  element('cost-output').value = '0';
  element('token-input').value = 'test';
  element('live-prompt').value = '測試問題';
  element('live-model').value = 'simulation';
  const context = {
    document: { getElementById: element, querySelectorAll: () => [], createElement: () => ({ textContent: '' }) },
    window: { REFERENCE_PRICES: [], REFERENCE_MODELS: [] },
    localStorage: { getItem: key => saved[key] || null, setItem(key, value) { saved[key] = value; } },
    fetch: async (url, options) => {
      calls.push({ url, options });
      const response = url.includes('openrouter.ai')
        ? { choices: [{ message: { content: 'OpenRouter 回覆' } }], usage: { total_tokens: 7 } }
        : { candidates: [{ content: { parts: [{ thought: true, text: 'internal thought' }, { text: '第一段' }, { text: '第二段' }] } }], usageMetadata: { totalTokenCount: 7 } };
      return { ok: true, json: async () => response };
    },
  };
  vm.runInNewContext(fs.readFileSync('js/reference.js', 'utf8'), context);
  assert.equal(calls.length, 0, 'page initialization must not request an API');
  await element('live-send').listeners.click();
  assert.equal(calls.length, 0, 'simulation must not request an API');
  assert.match(element('live-output').textContent, /教學示範，非即時模型回覆/);

  for (const provider of ['gemini', 'openrouter']) {
    element('live-model').value = provider === 'gemini' ? 'gemini:gemini-3.6-flash' : 'openrouter:google/gemma-3-12b-it';
    element('live-model').listeners.change();
    const expectedKey = saved[provider === 'gemini' ? 'llm_lab_gemini_key' : 'llm_lab_openrouter_key'];
    assert.equal(element('live-key').value, expectedKey, 'existing local settings must remain compatible');
    assert.equal(element('live-key-group').hidden, false);
    await element('live-send').listeners.click();
    const { url, options } = calls[calls.length - 1];
    assert.equal(options.method, 'POST');
    assert.equal(url.includes('synthetic-'), false, 'credentials must not appear in the URL');
    const body = JSON.parse(options.body);
    if (provider === 'gemini') {
      assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent');
      assert.equal(options.headers['x-goog-api-key'], expectedKey);
      assert.equal(body.contents[0].parts[0].text, '測試問題');
      assert.match(element('live-output').textContent, /第一段第二段/);
      assert.doesNotMatch(element('live-output').textContent, /internal thought/);
      assert.match(element('live-output').textContent, /totalTokenCount/);
    } else {
      assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
      assert.equal(options.headers.Authorization, 'Bearer ' + expectedKey);
      assert.equal(body.model, 'google/gemma-3-12b-it');
      assert.equal(body.messages[0].content, '測試問題');
      assert.match(element('live-output').textContent, /OpenRouter 回覆/);
      assert.match(element('live-output').textContent, /total_tokens/);
    }
  }
  assert.equal(calls.length, 2);
  console.log('PASS: encyclopedia simulation, saved settings and both API paths with a fake transport');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
