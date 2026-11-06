(function () {
  'use strict';
  const KEY = 'llm_learning_progress_v1';
  const valid = new Set(['01','02','03','04','05','06']);
  let available = true;
  const empty = () => ({version:1,lastVisitedLessonId:null,startedLessonIds:[],completedLessonIds:[],quizPassedLessonIds:[],updatedAt:null});
  let state = empty();
  function cleanArray(value) { return Array.isArray(value) ? [...new Set(value.filter(x => valid.has(x)))] : []; }
  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return empty();
      const data = JSON.parse(raw);
      if (!data || data.version !== 1 || typeof data !== 'object' || !Array.isArray(data.startedLessonIds) || !Array.isArray(data.completedLessonIds) || !Array.isArray(data.quizPassedLessonIds)) return empty();
      return {version:1,lastVisitedLessonId:valid.has(data.lastVisitedLessonId)?data.lastVisitedLessonId:null,startedLessonIds:cleanArray(data.startedLessonIds),completedLessonIds:cleanArray(data.completedLessonIds),quizPassedLessonIds:cleanArray(data.quizPassedLessonIds),updatedAt:typeof data.updatedAt==='string'?data.updatedAt:null};
    } catch (e) { if (e instanceof SyntaxError) return empty(); available=false; return empty(); }
  }
  state=read();
  function save() {
    state.updatedAt = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { available=false; }
    window.dispatchEvent(new Event('learning-progress-change'));
  }
  function add(key,id){if(valid.has(id)&&!state[key].includes(id))state[key].push(id);}
  window.LearningProgress={
    get:()=>state,
    available:()=>available,
    visit(id){if(!valid.has(id))return;add('startedLessonIds',id);state.lastVisitedLessonId=id;save();},
    pass(id){add('quizPassedLessonIds',id);save();},
    complete(id){if(!valid.has(id)||!state.quizPassedLessonIds.includes(id))return false;add('completedLessonIds',id);save();return true;},
    reset(){state=empty();try{localStorage.removeItem(KEY);}catch(e){available=false;}window.dispatchEvent(new Event('learning-progress-change'));},
    status(id){return state.completedLessonIds.includes(id)?'已完成':state.startedLessonIds.includes(id)?'學習中':'尚未開始';},
    next(){const last=state.lastVisitedLessonId;if(last&&!state.completedLessonIds.includes(last))return last;return ['01','02','03','04','05','06'].find(id=>!state.completedLessonIds.includes(id))||null;}
  };
  window.addEventListener('storage',e=>{if(e.key===KEY||e.key===null){state=read();window.dispatchEvent(new Event('learning-progress-change'));}});
}());
