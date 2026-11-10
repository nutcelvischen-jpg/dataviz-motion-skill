/* 首頁的一炷香：Canvas 2D 繪製，香頭一點火光，煙往上先直後散。
   不是 3D；煙是許多半透明的柔邊小圓，沿著隨高度變大的正弦擾動上升。
   尊重 prefers-reduced-motion（只畫一張靜止畫面），離開畫面或分頁隱藏時暫停。 */
(function () {
  'use strict';
  var canvas = document.getElementById('incense');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0, dpr = 1, tipX = 0, tipY = 0, baseY = 0;
  var parts = [], t = 0, running = false, visible = true, raf = 0;
  var ink = '28,27,25', seal = '#a8322a', night = false, sprite = null;

  function readTheme() {
    night = document.documentElement.getAttribute('data-theme') === 'night';
    ink = night ? '239,233,220' : '28,27,25';
    var cs = getComputedStyle(document.documentElement);
    seal = (cs.getPropertyValue('--seal') || '#a8322a').trim();
    sprite = makeSprite();
  }
  function makeSprite() {
    var s = document.createElement('canvas'); s.width = s.height = 64;
    var g = s.getContext('2d'), grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(' + ink + ',1)');
    grd.addColorStop(.45, 'rgba(' + ink + ',.45)');
    grd.addColorStop(1, 'rgba(' + ink + ',0)');
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    return s;
  }
  function resize() {
    var r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    baseY = H - 6; tipX = W * .5 + 4; tipY = H * .62;
  }
  function emit() {
    parts.push({ x: tipX, y: tipY, vy: -(0.55 + Math.random() * 0.35), ph: Math.random() * 6.28, drift: (Math.random() - .5) * .12, age: 0, life: 300 + Math.random() * 220, r: 1.6 + Math.random() * 1.2 });
  }
  function step() {
    t += 1;
    if (t % 2 === 0) emit();
    if (Math.random() < .35) emit();
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.age++;
      var h = tipY - p.y;                       // 離香頭多高
      var loose = Math.min(1, Math.max(0, (h - 40) / 150)); // 0 = 筆直，1 = 完全散開
      p.y += p.vy * (1 - loose * .35);
      var sway = Math.sin(h * .028 + t * .012 + p.ph * .25) * (4 + loose * 26)
               + Math.sin(h * .061 - t * .019 + p.ph) * loose * 12;
      p.dx = sway * (h / 60 > 1 ? 1 : h / 60) + p.drift * p.age * loose;
      if (p.age > p.life || p.y < -30) parts.splice(i, 1);
    }
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    // 煙
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i], k = p.age / p.life;
      var h = tipY - p.y, loose = Math.min(1, Math.max(0, (h - 40) / 150));
      var r = p.r + loose * 13 + k * 10;
      var a = (night ? .13 : .1) * (1 - k) * (1 - loose * .55) * Math.min(1, p.age / 12);
      if (a <= 0.002) continue;
      ctx.globalAlpha = a;
      ctx.drawImage(sprite, p.x + (p.dx || 0) - r, p.y - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
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
    var flick = reduce ? .8 : .72 + Math.sin(t * .09) * .12 + Math.random() * .1;
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
  for (var i = 0; i < 420; i++) step();   // 先跑一段，載入時煙就已經在
  draw();
  window.addEventListener('resize', function () { resize(); draw(); });
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; sync(); }).observe(canvas);
  if ('MutationObserver' in window) new MutationObserver(function () { readTheme(); draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  sync();
})();
