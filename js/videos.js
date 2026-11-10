/* 影片卡片：點了才建立 <video>，一次只播一支；網址 hash 對應卡片 id。沒有 JS 時連結直接開 mp4。 */
(function () {
  'use strict';
  var dlg = document.getElementById('video-dialog');
  if (!dlg || typeof dlg.showModal !== 'function') return;
  var stage = dlg.querySelector('.vd-stage'), title = dlg.querySelector('#vd-title'), ask = dlg.querySelector('.vd-ask');
  var opener = null;

  function open(link, autoplay) {
    opener = link;
    var v = document.createElement('video');
    v.controls = true; v.playsInline = true; v.setAttribute('playsinline', '');
    v.preload = autoplay ? 'auto' : 'none';
    v.poster = link.getAttribute('data-poster') || '';
    v.src = link.getAttribute('href');
    stage.innerHTML = ''; stage.appendChild(v);
    title.textContent = link.getAttribute('data-title') || '';
    var q = link.getAttribute('data-ask') || '';
    ask.textContent = q ? '看完想一想：' + q : '';
    dlg.classList.toggle('is-portrait', link.hasAttribute('data-portrait'));
    if (!dlg.open) dlg.showModal();
    var card = link.closest('.video-card');
    if (card && card.id) history.replaceState(null, '', '#' + card.id);
    if (autoplay) { var p = v.play(); if (p && p.catch) p.catch(function () { /* 瀏覽器擋自動播放時，留給使用者按播放 */ }); }
  }
  function close() {
    var v = stage.querySelector('video');
    if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
    stage.innerHTML = '';
    if (dlg.open) dlg.close();
    history.replaceState(null, '', location.pathname + location.search);
    if (opener) opener.focus();
  }
  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('[data-video]');
    if (link) { e.preventDefault(); open(link, true); return; }
    if (e.target.closest && e.target.closest('[data-close]')) { close(); return; }
    if (e.target === dlg) close();
  });
  dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });

  var id = location.hash.replace('#', '');
  if (id) {
    var card = document.getElementById(id);
    var link = card && card.querySelector && card.querySelector('[data-video]');
    if (link) { card.scrollIntoView({ block: 'center' }); open(link, false); }
  }
})();
