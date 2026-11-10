/* 首頁「求一籤」：從六站裡隨機抽一站。內容直接取自 LEARNING_LESSONS，不另寫文案。 */
(function () {
  'use strict';
  var lessons = window.LEARNING_LESSONS || [];
  var btn = document.getElementById('draw-btn'), tube = document.getElementById('draw-tube'), slip = document.getElementById('draw-slip');
  if (!btn || !tube || !slip || !lessons.length) return;
  var han = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  var last = -1, busy = false;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function show(i) {
    var l = lessons[i];
    document.getElementById('draw-no').textContent = '第' + (han[i] || (i + 1)) + '籤';
    document.getElementById('draw-q').textContent = l.title;
    document.getElementById('draw-a').textContent = l.summary;
    document.getElementById('draw-meta').textContent = l.shortTitle + '・約十五分鐘';
    document.getElementById('draw-go').href = 'learn.html?lesson=' + l.id;
    slip.hidden = false;
    slip.classList.remove('is-in'); void slip.offsetWidth; slip.classList.add('is-in');
    tube.classList.add('is-drawn');
    btn.textContent = '再求一支';
  }
  btn.addEventListener('click', function () {
    if (busy) return;
    var i = Math.floor(Math.random() * lessons.length);
    if (lessons.length > 1 && i === last) i = (i + 1) % lessons.length;
    last = i;
    if (reduce) { show(i); return; }
    busy = true; btn.textContent = '搖籤中…';
    tube.classList.remove('is-drawn'); tube.classList.add('is-shaking');
    setTimeout(function () { tube.classList.remove('is-shaking'); busy = false; show(i); }, 750);
  });
})();
