import assert from 'node:assert/strict';
import {blankData} from '../../../public/training-lab/src/catalog.mjs';
import {validate} from '../../../public/training-lab/src/domain.mjs';
import {recoverySummary,forecastSeries,extrapolate} from '../../../public/training-lab/src/recovery.mjs';
import {guidanceLevel} from '../../../public/training-lab/src/discomfort.mjs';
const d=blankData(),today='2026-11-02';
for(let i=0;i<5;i++){const date=new Date(Date.UTC(2026,9,5+i*7)).toISOString().slice(0,10);d.sessions.push({id:'s'+i,date,status:'completed'});d.sets.push({id:'a'+i,sessionId:'s'+i,exerciseId:'bench-barbell',weightKg:30+i,reps:12,rir:2});}
const o={metric:'strength',exercise:'bench-barbell',reps:12,rir:2,today,horizon:14};
const points=forecastSeries(d,o);assert.equal(points.length,5);let f=extrapolate(points,o);assert.equal(f.ready,true);assert.equal(f.predicted,36);assert.equal(f.date,'2026-11-16');assert.ok(f.high>f.predicted&&f.low<f.predicted);
assert.equal(extrapolate(points.slice(0,2),o).ready,false);assert.equal(extrapolate(points,{...o,today:'2026-12-02'}).ready,false);assert.equal(extrapolate(points,{...o,horizon:365}).ready,false);
assert.equal(forecastSeries(d,{...o,rir:1}).length,0);assert.equal(forecastSeries(d,{...o,reps:8}).length,0);
d.sessions.push({id:'draft',date:today,status:'draft'},{id:'future',date:'2027-01-01',status:'completed'});d.sets.push({id:'draftset',sessionId:'draft',exerciseId:o.exercise,weightKg:100,reps:12,rir:2},{id:'futureSet',sessionId:'future',exerciseId:o.exercise,weightKg:200,reps:12,rir:2});assert.equal(forecastSeries(d,o).length,5);
let g=recoverySummary(d,today).find(g=>g.name==='胸部');assert.equal(g.current,1);assert.equal(g.previous,1);assert.equal(g.hard,0);assert.equal(g.known,1);
d.sets.find(s=>s.id==='a4').rir=null;g=recoverySummary(d,today).find(g=>g.name==='胸部');assert.equal(g.known,0);assert.equal(g.hard,0);
d.monitoring=[{id:'m',date:today,weightKg:70,fatPercent:20,method:'A',fatigue:4,soreness:3,muscle:'胸部'}];validate(d);assert.equal(forecastSeries(d,{...o,metric:'fat',method:'B'}).length,0);assert.equal(forecastSeries(d,{...o,metric:'fat',method:'A'}).length,1);
const duplicate=structuredClone(d);duplicate.monitoring.push({...d.monitoring[0],id:'other'});assert.throws(()=>validate(duplicate));const bad=structuredClone(d);bad.monitoring[0].fatPercent=NaN;assert.throws(()=>validate(bad));const empty=structuredClone(d);Object.assign(empty.monitoring[0],{weightKg:null,fatPercent:null,fatigue:null,soreness:null});assert.throws(()=>validate(empty));
assert.equal(guidanceLevel('neuro','ache','after'),'emergency');assert.equal(guidanceLevel('emergency','ache','after'),'emergency');assert.equal(guidanceLevel('none','tingle','next'),'assess');assert.equal(guidanceLevel('none','ache','injury'),'assess');assert.equal(guidanceLevel('unknown','ache','next'),'unknown');
console.log('PASS recovery/extrapolation: known linear slope, interval, insufficient/stale/invalid horizon, comparable RIR/reps, future/draft exclusion, RIR missing, method separation, invalid/duplicate/empty records; discomfort priority branches');
