import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildSeries} from '../../../public/training-lab/src/trends.mjs';
const fixture=JSON.parse(await readFile(new URL('../../../public/training-lab/examples/demo.json',import.meta.url),'utf8'));
const opts={exerciseId:'bench-barbell',today:'2026-11-02'};
let passed=0;
const test=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
test('weight and volume are different metrics',()=>{
 assert.deepEqual(buildSeries(fixture,opts).map(p=>p.value),[30,32.5]);
 assert.deepEqual(buildSeries(fixture,{...opts,metric:'volume'}).map(p=>p.value),[660,715]);
});
test('same repetitions excludes heavier low-rep sets',()=>{
 const d=structuredClone(fixture);d.sets.push({...d.sets[2],id:'heavy',weightKg:50,reps:3});
 assert.equal(buildSeries(d,opts)[1].value,50);
 const fixed=buildSeries(d,{...opts,reps:'12'});
 assert.equal(fixed[1].value,32.5);assert.deepEqual(fixed[1].sets.map(s=>s.id),['demo-set-3']);
 assert.equal(buildSeries(d,{...opts,metric:'volume',reps:'12'})[1].value,865);
});
test('same-day sessions merge and drafts stay out',()=>{
 const d=structuredClone(fixture);d.sessions[1].date=d.sessions[0].date;
 assert.equal(buildSeries(d,opts).length,1);assert.equal(buildSeries(d,{...opts,metric:'volume'})[0].value,1375);
 d.sessions[1].status='draft';assert.equal(buildSeries(d,{...opts,metric:'volume'})[0].value,660);
});
test('date window boundary and future dates',()=>{
 const d=structuredClone(fixture);d.sessions[0].date='2026-10-04';d.sessions[1].date='2026-10-03';
 assert.deepEqual(buildSeries(d,{...opts,period:'30'}).map(p=>p.date),['2026-10-04']);
 d.sessions[0].date='2026-11-03';assert.equal(buildSeries(d,{...opts,period:'30'}).length,0);
});
test('empty, single date and zero weight stay honest',()=>{
 assert.equal(buildSeries(fixture,{...opts,reps:'5'}).length,0);
 const d=structuredClone(fixture);d.sets=d.sets.slice(0,1);d.sets[0].weightKg=0;
 const series=buildSeries(d,opts);assert.equal(series.length,1);assert.equal(series[0].value,0);
});
test('edits and deletions rebuild series and evidence',()=>{
 const d=structuredClone(fixture);d.sets[2].weightKg=35;
 assert.equal(buildSeries(d,opts)[1].value,35);
 d.sets=d.sets.filter(s=>s.id!=='demo-set-3');assert.equal(buildSeries(d,opts)[1].value,32.5);
 assert.deepEqual(buildSeries(d,opts)[1].sets.map(s=>s.id),['demo-set-4']);
});
test('sorted dates, isolated exercise and invalid metric',()=>{
 const d=structuredClone(fixture);d.sessions.reverse();d.sets.reverse();
 assert.deepEqual(buildSeries(d,opts).map(p=>p.date),['2026-10-29','2026-11-02']);
 assert.equal(buildSeries(d,{...opts,exerciseId:'row-barbell'}).length,0);
 assert.throws(()=>buildSeries(d,{...opts,metric:'estimate'}));
});
console.log(`${passed} trend checks passed.`);
