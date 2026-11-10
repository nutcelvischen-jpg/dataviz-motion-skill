/* 首頁的一炷香：Canvas 2D 繪製，香頭一點火光，白煙一圈一圈往上。
   不是 3D；煙是傾斜投影的螺旋線，白天與夜晚都是白色。
   尊重 prefers-reduced-motion（只畫一張靜止畫面），離開畫面或分頁隱藏時暫停。 */
(function () {
  'use strict';
  var canvas = document.getElementById('incense');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0, dpr = 1, tipX = 0, tipY = 0, baseY = 0;
  var t = Math.random() * 1000, running = false, visible = true, raf = 0;
  var SPEED = .016;   // 每格前進的相位；約等於每秒上升 7–8 像素
  var ink = '28,27,25', seal = '#a8322a', night = false;

  function readTheme() {
    night = document.documentElement.getAttribute('data-theme') === 'night';
    ink = night ? '239,233,220' : '28,27,25';
    var cs = getComputedStyle(document.documentElement);
    seal = (cs.getPropertyValue('--seal') || '#a8322a').trim();
  }
  function resize() {
    var r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    baseY = H - 6; tipX = W * .5 + 4; tipY = H * .62;
  }
  /* 煙：一條白色的煙絲繞成螺旋，一圈一圈往上。
     做法是把一條螺旋線（半徑隨高度變大）略微傾斜後投影到平面，線就會自己繞出圈；
     每一圈靠後的半邊畫得淡一點，看起來才有前後。 */
  function strand(phase, k, tilt, strength) {
    var top = tipY - 8, steps = Math.floor(top / 2.5), px = 0, py = 0, pa = 0, pw = 0;
    for (var i = 0; i <= steps; i++) {
      var h = i * 2.5;                                   // 離香頭多高
      var grow = Math.min(1, Math.max(0, (h - 22) / 120)); // 香頭上方先直，再慢慢繞開
      var R = grow * (10 + h * .11);
      var th = h * k - t * SPEED + phase;                // 相位隨時間後退 → 圈往上走（SPEED 越小越慢）
      var sway = Math.sin(h * .012 + t * .003 + phase) * h * .05;
      var x = tipX + Math.cos(th) * R + sway;
      var y = tipY - h + Math.sin(th) * R * tilt;
      var fade = Math.min(1, h / 14) * Math.pow(1 - h / top, 1.25);
      var depth = .62 + .38 * Math.sin(th);              // 靠前的半圈較亮
      var a = strength * fade * depth, w = 1.1 + grow * 3.4 + h * .012;
      if (i > 0) seg(px, py, x, y, (a + pa) / 2, (w + pw) / 2);
      px = x; py = y; pa = a; pw = w;
    }
  }
  function seg(x0, y0, x1, y1, a, w) {
    if (a <= .004) return;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
    ctx.strokeStyle = 'rgba(255,255,255,' + (a * .16) + ')'; ctx.lineWidth = w * 4.2; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,' + (a * .34) + ')'; ctx.lineWidth = w * 2; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,' + (a * .9) + ')'; ctx.lineWidth = w * .7; ctx.stroke();
  }
  function step() { t += 1; }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    // 白天在紙色上白煙看不見，先在後面暈一層極淡的墨，夜裡不需要
    if (!night) {
      var cx = tipX, cy = tipY * .5, rx = W * .5, ry = tipY * .62;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(1, ry / rx);
      var wash = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      wash.addColorStop(0, 'rgba(28,27,25,.24)'); wash.addColorStop(.5, 'rgba(28,27,25,.13)'); wash.addColorStop(1, 'rgba(28,27,25,0)');
      ctx.fillStyle = wash; ctx.beginPath(); ctx.arc(0, 0, rx, 0, 6.2832); ctx.fill(); ctx.restore();
    }
    ctx.lineCap = 'round';
    strand(0, .135, .62, night ? .8 : 1);
    strand(2.4, .112, .5, night ? .4 : .5);
    // 香腳（紅）與香身
    var lean = 4, mid = baseY - (baseY - tipY) * .32;
    ctx.lineCap = 'round';
    ctx.strokeStyle = seal; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(tipX - lean, baseY); ctx.lineTo(tipX - lean * .68, mid); ctx.stroke();
    ctx.strokeStyle = 'rgba(' + ink + ',.78)'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(tipX - lean * .68, mid); ctx.lineTo(tipX, tipY + 5); ctx.stroke();
    // 香灰
    ctx.strokeStyle = 'rgba(' + ink + ',.32)'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(tipX, tipY + 5); ctx.lineTo(tipX + .4, tipY + 1.5); ctx.stroke();
    // 火光
    var flick = reduce ? .8 : .72 + Math.sin(t * .035) * .12 + Math.sin(t * .011) * .06;
    var g = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, 13);
    g.addColorStop(0, 'rgba(255,170,90,' + (.6 * flick) + ')');
    g.addColorStop(.35, 'rgba(214,74,48,' + (.34 * flick) + ')');
    g.addColorStop(1, 'rgba(214,74,48,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(tipX, tipY, 13, 0, 6.2832); ctx.fill();
    ctx.fillStyle = 'rgba(255,214,150,' + flick + ')'; ctx.beginPath(); ctx.arc(tipX, tipY + 1, 1.7, 0, 6.2832); ctx.fill();
    // 地面一線
    ctx.strokeStyle = 'rgba(' + ink + ',.28)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(tipX - 46, baseY + .5); ctx.lineTo(tipX + 38, baseY + .5); ctx.stroke();
  }
  function frame() {
    if (!running) return;
    step(); draw();
    raf = requestAnimationFrame(frame);
  }
  function sync() {
    var want = visible && !document.hidden && !reduce;
    if (want && !running) { running = true; raf = requestAnimationFrame(frame); }
    else if (!want && running) { running = false; cancelAnimationFrame(raf); }
  }

  readTheme(); resize();
  draw();
  window.addEventListener('resize', function () { resize(); draw(); });
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; sync(); }).observe(canvas);
  if ('MutationObserver' in window) new MutationObserver(function () { readTheme(); draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  sync();
})();
