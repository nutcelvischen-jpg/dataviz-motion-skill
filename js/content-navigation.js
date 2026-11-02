(function () {
  'use strict';
  const moved = {
    'agent-breach': 'topics/agent-incidents.html',
    'macro-economy': 'topics/ai-economy.html',
    'distillation-security': 'topics/model-distillation.html',
    'world-models-math-space': 'topics/frontier-research.html'
  };
  let updateNavigation = () => {};
  function revealHash() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return; }
    if (!id) return;
    if (document.body.dataset.reference === 'true' && Object.prototype.hasOwnProperty.call(moved, id)) {
      location.replace(moved[id]);
      return;
    }
    const target = document.getElementById(id);
    if (!target) return;
    let parent = target.parentElement;
    while (parent) { if (parent.tagName === 'DETAILS') parent.open = true; parent = parent.parentElement; }
    if (target.tagName === 'DETAILS') target.open = true;
    // A bookmark can point inside a chapter; reveal its corresponding navigation group.
    const desktopLinks = [...document.querySelectorAll('.desktop-toc a[href^="#"]')];
    let section = target;
    while (section) {
      const link = section.id && desktopLinks.find(a => a.getAttribute('href') === '#' + section.id);
      if (link) { const group = link.closest('details'); if (group) group.open = true; break; }
      section = section.parentElement;
    }
    requestAnimationFrame(() => {
      target.scrollIntoView({behavior: 'instant', block: 'start'});
      updateNavigation();
    });
  }
  addEventListener('hashchange', revealHash);
  if (location.hash) revealHash();
  const links = [...document.querySelectorAll('.desktop-toc a[href^="#"], .mobile-toc nav a[href^="#"]')];
  const sections = [...new Set(links.map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean))];
  if (sections.length) {
    let pending = false;
    const updateCurrent = () => {
      pending = false;
      const threshold = Math.min(window.innerHeight * 0.4, 300);
      let current = sections[0];
      sections.forEach(section => { if (section.getBoundingClientRect().top <= threshold) current = section; });
      // Near the document end a linked section may be visible but unable to reach the top.
      let hashTarget = null;
      try { hashTarget = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (_) {}
      if (hashTarget && sections.includes(hashTarget)) {
        const rect = hashTarget.getBoundingClientRect();
        if (rect.top >= 0 && rect.top < window.innerHeight / 2 && rect.bottom > 0) current = hashTarget;
      }
      links.forEach(link => {
        if (link.getAttribute('href') === '#' + current.id) link.setAttribute('aria-current','location');
        else link.removeAttribute('aria-current');
      });
      const summary = document.querySelector('.mobile-toc > summary');
      const mobileLink = links.find(link => link.closest('.mobile-toc') && link.getAttribute('href') === '#' + current.id);
      if (summary && mobileLink) summary.textContent = '本頁目錄 · ' + mobileLink.textContent.trim();
    };
    updateNavigation = updateCurrent;
    const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(updateCurrent); } };
    addEventListener('scroll', schedule, {passive:true});
    addEventListener('resize', schedule);
    schedule();
  }
}());
