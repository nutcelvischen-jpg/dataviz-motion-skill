(function () {
  'use strict';
  var tabs = [].slice.call(document.querySelectorAll('[data-tab]'));
  function show(id, focus) {
    var found = false;
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-tab') === id; if (on) found = true;
      t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1;
      var pane = document.getElementById(t.getAttribute('aria-controls')); if (pane) pane.classList.toggle('active', on);
      if (on && focus) t.focus();
    });
    return found;
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { show(t.getAttribute('data-tab')); history.replaceState(null, '', '#' + t.getAttribute('data-tab')); });
    t.addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
      if (n === null) return; e.preventDefault();
      var tab = tabs[(n + tabs.length) % tabs.length]; show(tab.getAttribute('data-tab'), true);
    });
  });
  var hash = location.hash.replace('#', '');
  if (hash === 'module1-practice') show('mod1');
  else if (hash && !show(hash)) show('mod1');
  else if (!hash) show('mod1');

  /* 課前檢核：勾選狀態存在本機 */
  var KEY = 'workshop_checklist_v1', saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { saved = {}; }
  var boxes = [].slice.call(document.querySelectorAll('[data-check]'));
  var out = document.getElementById('check-progress');
  function update() { if (out) out.textContent = '已完成 ' + boxes.filter(function (b) { return b.checked; }).length + '／' + boxes.length + ' 項'; }
  boxes.forEach(function (b) {
    b.checked = !!saved[b.getAttribute('data-check')];
    b.addEventListener('change', function () { saved[b.getAttribute('data-check')] = b.checked; try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* ignore */ } update(); });
  });
  update();
})();
