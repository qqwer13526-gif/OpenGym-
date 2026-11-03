import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validate, compareLatest, dailyVolumes, projectGraph } from '../../../public/training-lab/src/domain.mjs';
const fixture = JSON.parse(await readFile(new URL('../../../public/training-lab/examples/demo.json', import.meta.url), 'utf8'));
const fresh = () => structuredClone(fixture);
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log(`PASS ${name}`); };

test('two dates: 660 -> 715, +8.3%, traceable sets', () => {
  const result = compareLatest(fixture, 'bench-barbell');
  assert.equal(result.previous.volume, 660);
  assert.equal(result.latest.volume, 715);
  assert.equal(result.percent, 8.3);
  assert.deepEqual(result.latest.setIds, ['demo-set-3', 'demo-set-4']);
});
test('RIR zero and null survive JSON round-trip', () => {
  const roundTrip = validate(JSON.parse(JSON.stringify(fixture)));
  assert.equal(roundTrip.sets[1].rir, 0);
  assert.equal(roundTrip.sets[2].rir, null);
});
test('draft and one completed date do not imply progress', () => {
  const data = fresh(); data.sessions[1].status = 'draft';
  assert.equal(compareLatest(data, 'bench-barbell').status, 'insufficient');
  assert.equal(projectGraph(data).nodes.filter(n => n.type === 'session').length, 1);
});
test('same date sessions merge into one date', () => {
  const data = fresh(); data.sessions[1].date = data.sessions[0].date;
  assert.equal(compareLatest(data, 'bench-barbell').status, 'insufficient');
  assert.equal(dailyVolumes(data, 'bench-barbell')[0].volume, 1375);
});
test('zero baseline has no percentage', () => {
  const data = fresh(); data.sets.slice(0, 2).forEach(s => s.weightKg = 0);
  assert.equal(compareLatest(data, 'bench-barbell').percent, null);
});
test('editing records rebuilds volume', () => {
  const data = fresh(); data.sets[2].weightKg = 35;
  assert.equal(compareLatest(data, 'bench-barbell').latest.volume, 745);
});
test('deleting session and children removes personal edges', () => {
  const data = fresh(); data.sessions.pop(); data.sets = data.sets.filter(s => s.sessionId !== 'demo-session-2');
  assert.equal(compareLatest(data, 'bench-barbell').status, 'insufficient');
  assert.ok(projectGraph(data).links.every(l => l.target !== 'session:demo-session-2'));
});
test('graph endpoints and record evidence resolve', () => {
  const graph = projectGraph(fixture); const ids = new Set(graph.nodes.map(n => n.id));
  for (const link of graph.links) {
    assert.ok(ids.has(link.source) && ids.has(link.target));
    if (link.sourceType === 'user-record') for (const id of link.evidence) assert.ok(fixture.sets.some(s => s.id === id));
  }
});
test('empty history does not invent sessions', () => {
  const data = fresh(); data.sessions = []; data.sets = [];
  assert.equal(compareLatest(data, 'bench-barbell').status, 'insufficient');
  assert.ok(projectGraph(data).nodes.every(n => n.type !== 'session'));
});
test('reject invalid input before import', () => {
  const mutations = [
    d => d.schemaVersion = 2,
    d => d.sets[0].sessionId = 'missing',
    d => d.sets[1].id = d.sets[0].id,
    d => d.sets[0].weightKg = -1,
    d => d.sets[0].weightKg = '30',
    d => d.sets[0].reps = 1.5,
    d => d.sets[0].rir = 6,
    d => d.sessions[0].date = '2026-02-30'
  ];
  for (const mutate of mutations) { const data = fresh(); mutate(data); assert.throws(() => validate(data)); }
});
console.log(`\n${passed} checks passed. Data proof only; UI, storage and real-user tests are pending.`);
