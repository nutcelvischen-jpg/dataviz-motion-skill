// Meaningful checks for saved progress and the six-lesson contract; no external dependencies.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const progressScript = fs.readFileSync(path.join(root, 'js/learning-progress.js'), 'utf8');
const dataScript = fs.readFileSync(path.join(root, 'js/learning-data.js'), 'utf8');
const KEY = 'llm_learning_progress_v1';
function setup(initial = {}, disabled = false) {
  const values = {...initial};
  const localStorage = {
    getItem(k) { if (disabled) throw new Error('storage denied'); return values[k] ?? null; },
    setItem(k, v) { if (disabled) throw new Error('storage denied'); values[k] = v; },
    removeItem(k) { if (disabled) throw new Error('storage denied'); delete values[k]; }
  };
  const listeners = {};
  const window = {dispatchEvent() {}, addEventListener(name, fn) { listeners[name] = fn; }};
  const context = vm.createContext({window, localStorage, Event: function(name) {this.type=name;}, console, Date, Set});
  vm.runInContext(dataScript, context);
  vm.runInContext(progressScript, context);
  return {progress:window.LearningProgress, lessons:window.LEARNING_LESSONS, values};
}
let t = setup({llm_lab_provider:'openrouter'});
assert.equal(t.lessons.length, 12);
assert.deepEqual(Array.from(t.lessons, x => x.id), ['01','02','03','04','05','06','07','08','09','10','11','12']);
for (const lesson of t.lessons) {
  assert.equal(lesson.objectives.length, 2);
  assert.ok(lesson.explanation.length >= 2 && lesson.flow.length >= 3 && lesson.observation);
  assert.equal(lesson.quiz.options.length, 3);
  assert.ok(lesson.quiz.options.some(x => x[0] === lesson.quiz.correct));
  assert.ok(lesson.links.length <= 3);
}
assert.equal(t.progress.next(), '01');
t.progress.visit('02');
assert.equal(t.progress.status('02'), '學習中');
assert.equal(t.progress.next(), '02');
assert.equal(t.progress.complete('02'), false);
t.progress.pass('02');
assert.equal(t.progress.complete('02'), true);
assert.equal(t.progress.status('02'), '已完成');
assert.equal(t.progress.next(), '01');
let reload = setup(t.values);
assert.equal(reload.progress.status('02'), '已完成');
reload.progress.reset();
assert.equal(reload.values.llm_lab_provider, 'openrouter');
assert.equal(reload.values[KEY], undefined);
assert.equal(setup({[KEY]:'{not json'}).progress.next(), '01');
assert.equal(setup({[KEY]:JSON.stringify({version:99,startedLessonIds:[],completedLessonIds:[],quizPassedLessonIds:[]})}).progress.next(), '01');
const corrupt = setup({[KEY]:JSON.stringify({version:1,lastVisitedLessonId:'99',startedLessonIds:['01','01','99'],completedLessonIds:['02','02'],quizPassedLessonIds:['02']})});
assert.equal(corrupt.progress.get().startedLessonIds.length, 1);
assert.equal(corrupt.progress.get().completedLessonIds.length, 1);
assert.equal(corrupt.progress.get().lastVisitedLessonId, null);
let denied = setup({}, true);
denied.progress.visit('01');
denied.progress.pass('01');
assert.equal(denied.progress.complete('01'), true);
assert.equal(denied.progress.available(), false);
assert.equal(denied.progress.status('01'), '已完成');
console.log('PASS: 6 lessons, completion gating, resume, persistence, reset isolation, malformed data and unavailable storage');
