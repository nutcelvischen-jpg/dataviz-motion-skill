/* 一鍵複製：[data-copy] 按鈕複製同一個 .prompt-block 內 code 的文字 */
(function () {
  'use strict';
  var live = document.createElement('div');
  live.setAttribute('role', 'status');
  live.className = 'visually-hidden';
  document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(live); });

  function fallback(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
  function done(btn, ok) {
    var old = btn.getAttribute('data-label') || btn.textContent;
    btn.setAttribute('data-label', old);
    btn.textContent = ok ? '已複製 ✓' : '複製失敗，請手動選取';
    live.textContent = ok ? '已複製' : '複製失敗';
    setTimeout(function () { btn.textContent = old; }, 1500);
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-copy]');
    if (!btn) return;
    var block = btn.closest('.prompt-block');
    var code = block && block.querySelector('code');
    if (!code) return;
    var text = code.innerText;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(btn, true); }, function () { done(btn, fallback(text)); });
    } else { done(btn, fallback(text)); }
  });
})();
