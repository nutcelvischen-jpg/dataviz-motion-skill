(function () {
  'use strict';
  const root = document.getElementById('concept-explorer');
  if (!root) return;
  const tabs = [...root.querySelectorAll('[data-map-view]')];
  const panels = [...root.querySelectorAll('[data-map-panel]')];
  const branches = [...root.querySelectorAll('[data-map-branch]')];
  const allowedBranches = new Set(branches.map(node => node.id));
  let view = 'concepts', selectedBranch = null, frame = 0;
  const svgNS = 'http://www.w3.org/2000/svg';
  function svgElement(tag, attributes) {
    const node = document.createElementNS(svgNS, tag);
    Object.entries(attributes).forEach(([key,value]) => node.setAttribute(key, String(value)));
    return node;
  }
  function line(svg, d, arrow) {
    const path = svgElement('path', {d, fill:'none', stroke:'currentColor', 'stroke-width':1.25});
    if (arrow) path.setAttribute('marker-end','url(#map-flow-arrow)');
    svg.append(path);
  }
  function bounds(node, parent) {
    const a=node.getBoundingClientRect(), b=parent.getBoundingClientRect();
    return {x:a.left-b.left,y:a.top-b.top,w:a.width,h:a.height,cy:a.top-b.top+a.height/2};
  }
  function drawMindmap() {
    const board=root.querySelector('.mindmap-board'), svg=board.querySelector('svg');
    const rect=board.getBoundingClientRect();
    if (!rect.width) return;
    svg.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);
    svg.replaceChildren();
    const origin=bounds(board.querySelector('.map-root'),board);
    const targets=branches.map(node=>bounds(node.querySelector('.map-branch-toggle'),board));
    const stacked=getComputedStyle(board).getPropertyValue('--map-stacked').trim()==='1';
    if (stacked) {
      const x=10, y=origin.y+origin.h+12;
      line(svg,`M ${origin.x+8} ${origin.y+origin.h+3} V ${y} H ${x} V ${targets.at(-1).cy}`);
      targets.forEach(t=>line(svg,`M ${x} ${t.cy} H ${t.x-7}`));
    } else {
      const x=origin.x+origin.w+22;
      line(svg,`M ${origin.x+origin.w+4} ${origin.cy} H ${x}`);
      line(svg,`M ${x} ${Math.min(origin.cy,targets[0].cy)} V ${Math.max(origin.cy,targets.at(-1).cy)}`);
      targets.forEach(t=>line(svg,`M ${x} ${t.cy} H ${t.x-8}`));
    }
  }
  function drawFlow() {
    const board=root.querySelector('.agent-flow'), svg=board.querySelector('svg');
    const rect=board.getBoundingClientRect();
    if (!rect.width) return;
    svg.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);
    svg.replaceChildren();
    const defs=svgElement('defs',{}), marker=svgElement('marker',{id:'map-flow-arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto'});
    marker.append(svgElement('path',{d:'M 1 1 L 9 5 L 1 9',fill:'none',stroke:'currentColor','stroke-width':1.5}));
    defs.append(marker); svg.append(defs);
    const nodes=[...root.querySelectorAll('[data-flow-step]')].map(node=>bounds(node,board));
    nodes.slice(0,-1).forEach((node,i)=>line(svg,`M ${node.x+node.w/2} ${node.y+node.h+3} V ${nodes[i+1].y-5}`,true));
    const from=nodes[4], to=nodes[1], x=22;
    line(svg,`M ${from.x-2} ${from.cy} H ${x} V ${to.cy} H ${to.x-5}`,true);
    const label=root.querySelector('.flow-loop-label');
    label.style.top=`${(from.cy+to.cy)/2-label.offsetHeight/2}px`;
  }
  function redraw() {
    cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{drawMindmap();drawFlow();});
  }
  function render() {
    panels.forEach(panel=>panel.hidden=panel.dataset.mapPanel!==view);
    tabs.forEach(tab=>{
      const active=tab.dataset.mapView===view;
      tab.setAttribute('aria-selected',String(active));
      tab.tabIndex=active?0:-1;
    });
    branches.forEach(branch=>{
      const open=branch.id===selectedBranch;
      branch.querySelector('button').setAttribute('aria-expanded',String(open));
      branch.querySelector('.map-leaves').hidden=!open;
    });
    redraw();
  }
  function setHash(hash, replace) {
    const url=new URL(location.href);url.hash=hash;
    if (url.href!==location.href) history[replace?'replaceState':'pushState'](null,'',url);
  }
  function restore() {
    let hash='';
    try { hash=decodeURIComponent(location.hash.slice(1)); } catch (_) {}
    if (hash==='task-flow') view='flow';
    else if (allowedBranches.has(hash)) {view='concepts';selectedBranch=hash;}
    else if (hash==='concept-map'||!hash) {view='concepts';selectedBranch=null;}
    else {
      const target=document.getElementById(hash), panel=target&&target.closest('[data-map-panel]');
      if (panel) view=panel.dataset.mapPanel;
    }
    render();
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>{
      view=tab.dataset.mapView;render();
      setHash(view==='flow'?'task-flow':selectedBranch||'concept-map');
    });
    tab.addEventListener('keydown',event=>{
      const next=event.key==='ArrowRight'?(index+1)%tabs.length:event.key==='ArrowLeft'?(index+tabs.length-1)%tabs.length:event.key==='Home'?0:event.key==='End'?tabs.length-1:null;
      if(next===null)return;
      event.preventDefault();tabs[next].focus();tabs[next].click();
    });
  });
  branches.forEach(branch=>branch.querySelector('button').addEventListener('click',()=>{
    selectedBranch=selectedBranch===branch.id?null:branch.id;
    render();setHash(selectedBranch||'concept-map',true);
  }));
  root.querySelector('.map-view-tabs').hidden=false;
  addEventListener('hashchange',restore);
  addEventListener('popstate',restore);
  addEventListener('pageshow',restore);
  const observer=new ResizeObserver(redraw);
  observer.observe(root.querySelector('.mindmap-board'));
  observer.observe(root.querySelector('.agent-flow'));
  restore();
}());
