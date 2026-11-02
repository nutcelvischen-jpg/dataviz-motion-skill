(function () {
  'use strict';
  const params=new URLSearchParams(location.search);
  const mapOrigin=params.get('frommap');
  if(['model','context','knowledge','tools','control','quality','flow'].includes(mapOrigin)){
    const target=new URL('overview.html',location.href);
    target.hash=mapOrigin==='flow'?'task-flow':'map-'+mapOrigin;
    document.querySelectorAll('.catalog-return').forEach(link=>{
      link.href=target.href;
      link.textContent=mapOrigin==='flow'?'← 返回任務流程圖':'← 返回概念心智圖';
    });
    document.querySelectorAll('.concept-map-link').forEach(link=>{link.hidden=true;});
    return;
  }
  const query=(params.get('fromq')||'').slice(0,120),category=params.get('fromcat');
  if(!query&&!category)return;
  const target=new URL('../encyclopedia.html',location.href);
  if(query)target.searchParams.set('q',query);
  if(['model','instruction','agent','safety','graphics'].includes(category))target.searchParams.set('category',category);
  target.hash='term-map';
  document.querySelectorAll('.catalog-return').forEach(link=>{link.href=target.href;link.textContent='← 返回查閱結果';});
}());
