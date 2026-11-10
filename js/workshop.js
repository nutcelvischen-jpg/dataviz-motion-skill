(function () {
  'use strict';
  var cfg = window.SITE_CONFIG || {};
  var w = cfg.workshop || {};
  var steps = cfg.steps || [];
  var tag = document.querySelector('[data-workshop-date-tag]');
  if (tag) tag.textContent = w.dateLabel || '';

  var cards = document.getElementById('step-cards');
  if (cards) {
    cards.innerHTML = steps.map(function (s, i) {
      return '<li><a class="card" href="' + s.file + '"><span class="num">' + (i + 1) + '</span><strong>' + s.title + '</strong><p>' + (s.goal || '') + '</p><span class="go">開始 →</span></a></li>';
    }).join('');
  }
  var first = document.querySelector('[data-first-step]');
  if (first && steps[0]) first.setAttribute('href', steps[0].file);

  /* 步驟若標了 module，就在對應時段補上「本時段實作」連結 */
  document.querySelectorAll('#timeline [data-module]').forEach(function (li) {
    var m = parseInt(li.getAttribute('data-module'), 10);
    var mine = steps.filter(function (s) { return s.module === m; });
    var box = li.querySelector('.wk-links');
    if (!mine.length || !box) return;
    mine.forEach(function (s) {
      var a = document.createElement('a');
      a.className = 'link-arrow'; a.href = s.file; a.textContent = '本時段實作：' + s.title;
      box.insertBefore(a, box.querySelector('.wk-folder'));
    });
  });

  var refs = document.getElementById('ref-list');
  if (refs && cfg.references) {
    refs.innerHTML = cfg.references.map(function (r) {
      var href = r.href || r.file, ext = r.href && /^https?:/.test(r.href);
      return '<li><a href="' + href + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '><span>' + r.title.replace(' ↗', '') + '</span><small>' + (ext ? '外部連結 ↗' : '→') + '</small></a></li>';
    }).join('');
  }

  /* 當天依台北時間標示「進行中」 */
  try {
    var parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    var p = {}; parts.forEach(function (x) { p[x.type] = x.value; });
    if (p.year + '-' + p.month + '-' + p.day === w.nextDate) {
      var now = parseInt(p.hour, 10) * 60 + parseInt(p.minute, 10);
      document.querySelectorAll('#timeline .wk-slot:not(.wk-break)').forEach(function (li) {
        var f = li.dataset.from.split(':'), t = li.dataset.to.split(':');
        var a = +f[0] * 60 + +f[1], b = +t[0] * 60 + +t[1];
        if (now >= a && now < b) li.classList.add('is-now');
      });
    }
  } catch (e) { /* ignore */ }
})();
