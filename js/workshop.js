(function () {
  'use strict';
  var cfg = window.SITE_CONFIG || {};
  var w = cfg.workshop || {};
  var tag = document.querySelector('[data-workshop-date-tag]');
  if (tag) tag.textContent = w.dateLabel || '';

  var purposes = [
    '先看今天用哪些工具、Skill 與 API，再往下走。',
    '從官方數據到 Tableau-like 儀表板的完整工作流。',
    '一步步申請 e-Stat 金鑰，並避開常見的設定陷阱。',
    '17 個領域、10 種圖表選型，從問題找到資料。',
    '拖曳欄位組圖、分面、篩選，做出自己的儀表板。'
  ];
  var cards = document.getElementById('step-cards');
  if (cards && cfg.steps) {
    cards.innerHTML = cfg.steps.map(function (s, i) {
      return '<li><a class="card" href="' + s.file + '"><span class="num">' + (i + 1) + '</span><strong>' + s.title + '</strong><p>' + purposes[i] + '</p><span class="go">開始 →</span></a></li>';
    }).join('');
  }
  var refs = document.getElementById('ref-list');
  var extra = [
    { href: 'student_data_analyst_workflow.html#skills-catalog', title: 'Skill 清單（27 Skill 與 3 MCP）' }
  ];
  if (refs && cfg.references) {
    refs.innerHTML = cfg.references.concat(extra).map(function (r) {
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
