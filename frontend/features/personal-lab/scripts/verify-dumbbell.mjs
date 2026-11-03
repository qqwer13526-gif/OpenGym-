import assert from 'node:assert/strict';
import {blankData} from '../../../public/training-lab/src/catalog.mjs';
import {migrateDumbbells,dailyVolumes} from '../../../public/training-lab/src/domain.mjs';
import {buildSeries} from '../../../public/training-lab/src/trends.mjs';
const d=blankData();d.exercises.find(e=>e.id==='bench-dumbbell').loadConvention='external-total';d.sessions=[{id:'s',date:'2026-11-03',status:'completed'}];d.sets=[{id:'a',sessionId:'s',exerciseId:'bench-dumbbell',weightKg:40,reps:10,rir:2}];
const m=migrateDumbbells(d,{exerciseId:'bench-dumbbell',weightKg:'40'});assert.equal(m.data.sets[0].weightKg,20);assert.equal(m.input.weightKg,'20');assert.equal(d.sets[0].weightKg,40);assert.equal(migrateDumbbells(m.data).changed,false);assert.equal(dailyVolumes(d,'bench-dumbbell')[0].volume,dailyVolumes(m.data,'bench-dumbbell')[0].volume);assert.equal(buildSeries(m.data,{exerciseId:'bench-dumbbell',metric:'volume'})[0].value,400);assert.equal(buildSeries(m.data,{exerciseId:'bench-dumbbell',metric:'weight'})[0].value,20);console.log('PASS migration, draft, no repeated halving, original retained, load series and volume preserved');
