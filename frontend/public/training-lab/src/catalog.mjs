const source = { type: 'editorial-day1', reviewed: false };
export const catalog = [
  ['bench-barbell', '杠铃卧推', ['胸部', '手臂']],
  ['bench-dumbbell', '双哑铃卧推', ['胸部']],
  ['row-barbell', '杠铃划船', ['背部']],
  ['row-cable', '坐姿绳索划船', ['背部']],
  ['press-barbell', '杠铃推举', ['肩部']],
  ['pushdown-cable', '绳索下压', ['手臂']],
  ['squat-barbell', '杠铃深蹲', ['腿部']],
  ['deadlift-barbell', '杠铃硬拉', ['腿部', '背部']]
].map(([id, name, muscleIds]) => ({ id, name, muscleIds, unit: 'kg', loadConvention: 'external-total', knowledgeSource: { ...source } }));
export const muscles = {
  '胸部': { x: 260, y: 210, color: '#b59aff', english: 'Chest', letter: 'C' },
  '背部': { x: 744, y: 316, color: '#83cddd', english: 'Back', letter: 'B' },
  '肩部': { x: 550, y: 133, color: '#d8bd8e', english: 'Shoulders', letter: 'S' },
  '手臂': { x: 231, y: 454, color: '#d99bc2', english: 'Arms', letter: 'A' },
  '腿部': { x: 595, y: 520, color: '#85cbb4', english: 'Legs', letter: 'L' }
};
export const exercisePositions = {
  'bench-barbell': [135, 137], 'bench-dumbbell': [365, 135],
  'row-barbell': [843, 227], 'row-cable': [860, 407],
  'press-barbell': [654, 86], 'pushdown-cable': [118, 511],
  'squat-barbell': [459, 583], 'deadlift-barbell': [737, 557]
};
export const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export function blankData() {
  return { schemaVersion: 1, isDemo: false, profile: { id: 'local-profile', goal: '待设置', onboarded: false }, exercises: structuredClone(catalog), sessions: [], sets: [] };
}
