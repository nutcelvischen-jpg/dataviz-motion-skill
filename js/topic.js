function switchAgentMatrixTab(tabKey) {
  const names=['matrix','muse','dots','grok','claude'];
  names.forEach(function (name) {
    const suffix=name.charAt(0).toUpperCase()+name.slice(1);
    const button=document.getElementById('btnTab'+suffix);
    const panel=document.getElementById('viewAgent'+suffix);
    if(button){button.classList.toggle('active',name===tabKey);button.setAttribute('aria-pressed',String(name===tabKey));}
    if(panel)panel.style.display=name===tabKey?'block':'none';
  });
}
