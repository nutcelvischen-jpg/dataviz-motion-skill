/* 共用頁首／頁尾／工作坊步驟列。放在 <body> 開頭、同步載入。 */
(function () {
  'use strict';
  var cfg = window.SITE_CONFIG || { workshop: {}, steps: [], references: [] };
  var script = document.currentScript;
  var src = script ? script.getAttribute('src') : 'js/site-shell.js';
  var base = src.replace(/js\/site-shell\.js.*$/, '');
  var body = document.body;
  var nav = body.getAttribute('data-nav') || 'none';
  var shell = body.getAttribute('data-shell') || 'full';
  var step = parseInt(body.getAttribute('data-step') || '0', 10);
  var isWorkshop = body.hasAttribute('data-workshop') || step > 0;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function el(html) { var t = document.createElement('div'); t.innerHTML = html.trim(); return t.firstChild; }
  function store(kind) { try { return window[kind]; } catch (e) { return null; } }
  function sget(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } }

  /* 投影模式 */
  var qs = new URLSearchParams(location.search);
  if (qs.get('present') === '1') sset('present_mode', '1');
  if (qs.get('present') === '0') sset('present_mode', '0');
  function applyPresent() { document.documentElement.classList.toggle('present', isWorkshop && sget('present_mode') === '1'); }
  applyPresent();

  var items = [
    ['learn', 'index.html#learning-map', '跟著學'],
    ['concepts', 'encyclopedia.html', '查概念'],
    ['lab', 'lab.html', '做實驗'],
    ['workshop', 'workshop.html', '工作坊']
  ];

  function buildHeader() {
    if (shell === 'app') {
      var next = cfg.steps[step] ? '' : '';
      return el('<header class="site-header is-app" data-shell-header><div class="sh-inner">' +
        '<div class="sh-sub"><a href="' + base + 'workshop.html">← 工作坊</a><span class="tag tag-olive">步驟 ' + step + '／' + cfg.steps.length + '</span></div>' +
        '<span class="sh-title">' + esc(document.body.getAttribute('data-title') || document.title) + '</span>' +
        '<div class="sh-sub">' + (document.body.getAttribute('data-manual') ? '<a class="sh-manual" href="' + esc(document.body.getAttribute('data-manual')) + '" target="_blank" rel="noopener">使用說明 ↗</a>' : '') +
        '<a href="' + base + 'workshop.html">回到工作坊總覽 →</a></div></div></header>');
    }
    var links = items.map(function (i) {
      return '<a href="' + base + i[1] + '"' + (i[0] === nav ? ' aria-current="page"' : '') + '>' + i[2] + '</a>';
    }).join('');
    var tools = isWorkshop ? '<div class="sh-tools"><button type="button" class="sh-present" aria-pressed="false">投影模式</button></div>' : '';
    return el('<header class="site-header" data-shell-header><div class="sh-inner">' +
      '<a class="sh-brand" href="' + base + 'index.html" aria-label="大語言模型學習地圖首頁"><span class="sh-mark" aria-hidden="true">學</span><span>大語言模型<br><strong>學習地圖</strong></span></a>' +
      '<nav class="sh-nav" aria-label="主要導覽">' + links + '</nav>' + tools + '</div></header>');
  }

  function buildStepper() {
    var steps = cfg.steps, cur = step - 1;
    var seen = [];
    try { seen = JSON.parse(sget('workshop_steps_seen') || '[]'); } catch (e) { seen = []; }
    if (seen.indexOf(step) < 0) { seen.push(step); sset('workshop_steps_seen', JSON.stringify(seen)); }
    var lis = steps.map(function (s, i) {
      var done = seen.indexOf(i + 1) >= 0 && i !== cur;
      return '<li><a href="' + base + s.file + '"' + (i === cur ? ' aria-current="step"' : '') + '><span class="ws-num">' + (done ? '✓' : (i + 1)) + '</span>' + esc(s.title) + '</a></li>';
    }).join('');
    var refs = cfg.references.map(function (r) {
      var ext = r.href ? ' target="_blank" rel="noopener"' : '';
      return '<a href="' + (r.href || base + r.file) + '"' + ext + '>' + esc(r.title) + '</a>';
    }).join('');
    var mlis = steps.map(function (s, i) {
      return '<li><a href="' + base + s.file + '"' + (i === cur ? ' aria-current="step"' : '') + '>' + (i + 1) + '. ' + esc(s.title) + '</a></li>';
    }).join('');
    return el('<div class="workshop-stepper" data-stepper><div class="ws-inner">' +
      '<ol class="ws-steps" aria-label="工作坊步驟">' + lis + '</ol>' +
      '<details class="ws-ref"><summary>參考 ▾</summary><div class="ws-ref-menu">' + refs + '</div></details>' +
      '<details class="ws-mobile"><summary><span>步驟 ' + step + '／' + steps.length + ' · ' + esc(steps[cur].title) + '</span><span aria-hidden="true">▾</span></summary><ol>' + mlis + '</ol></details>' +
      '</div></div>');
  }

  function buildPager() {
    var steps = cfg.steps, cur = step - 1, h = '';
    if (cur > 0) h += '<a class="prev" href="' + base + steps[cur - 1].file + '"><small>← 上一步</small><strong>' + esc(steps[cur - 1].title) + '</strong></a>';
    if (cur < steps.length - 1) h += '<a class="next" href="' + base + steps[cur + 1].file + '"><small>下一步 →</small><strong>' + esc(steps[cur + 1].title) + '</strong></a>';
    else h += '<a class="next" href="' + base + 'workshop.html"><small>完成 →</small><strong>回到工作坊總覽</strong></a>';
    return el('<nav class="step-pager" aria-label="上一步與下一步">' + h + '</nav>');
  }

  function buildFooter() {
    var w = cfg.workshop || {};
    return el('<footer class="site-footer" data-shell-footer><div class="sf-inner">' +
      '<div><p class="sf-brand">大語言模型學習地圖</p><p>理解，然後動手做。</p></div>' +
      '<div><h2>快速連結</h2><ul>' +
      '<li><a href="' + base + 'index.html#learning-map">六站學習路線</a></li>' +
      '<li><a href="' + base + 'encyclopedia.html">概念目錄</a></li>' +
      '<li><a href="' + base + 'lab.html">互動實驗</a></li>' +
      '<li><a href="' + base + 'videos.html">影片系列</a></li>' +
      '<li><a href="' + base + 'workshop.html">工作坊</a></li></ul></div>' +
      '<div><h2>授課資訊</h2><p>' + esc(w.affiliation || '') + '</p><p>' + esc(w.instructor || '') + '</p>' +
      '<p>教育部「AI驅動金融商管科技與技職人才培育計畫」推薦教材</p>' +
      '<p><a href="#" data-jitong-restore hidden>叫出數位乩童</a></p></div></div></footer>');
  }

  /* 立即插入頁首（避免版面跳動） */
  var header = buildHeader();
  var skip = el('<a class="skip-link" href="#main">跳到主要內容</a>');
  body.insertBefore(header, body.firstChild);
  body.insertBefore(skip, body.firstChild);
  if (step > 0 && shell !== 'app' && cfg.steps[step - 1]) header.parentNode.insertBefore(buildStepper(), header.nextSibling);

  function ready() {
    // 移除舊頁首、頁尾、舊 skip link
    Array.prototype.forEach.call(document.querySelectorAll('header.content-header, header.site-header:not([data-shell-header]), footer.content-footer, footer.site-footer:not([data-shell-footer]), a.skip-link'), function (n) {
      if (n === skip) return;
      n.parentNode.removeChild(n);
    });
    var main = document.querySelector('main');
    if (main && !main.id) main.id = 'main';
    if (main && !main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');

    if (step > 0 && shell !== 'app' && cfg.steps[step - 1]) (main || body).appendChild(buildPager());
    if (shell !== 'app') body.appendChild(buildFooter());

    var dateLabel = (cfg.workshop || {}).dateLabel || '';
    Array.prototype.forEach.call(document.querySelectorAll('[data-workshop-date]'), function (n) { n.textContent = dateLabel; });
    Array.prototype.forEach.call(document.querySelectorAll('[data-workshop-title]'), function (n) { n.textContent = cfg.workshop.title; });

    var btn = document.querySelector('.sh-present');
    if (btn) {
      var sync = function () { btn.setAttribute('aria-pressed', sget('present_mode') === '1' ? 'true' : 'false'); };
      sync();
      btn.addEventListener('click', function () { sset('present_mode', sget('present_mode') === '1' ? '0' : '1'); applyPresent(); sync(); });
    }
    try {
      if (localStorage.getItem('jitong_dismissed') === '1') {
        var r = document.querySelector('[data-jitong-restore]');
        if (r) { r.hidden = false; r.addEventListener('click', function (e) { e.preventDefault(); localStorage.removeItem('jitong_dismissed'); location.reload(); }); }
      }
    } catch (e) { /* ignore */ }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();
