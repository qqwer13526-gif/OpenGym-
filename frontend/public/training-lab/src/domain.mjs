// Pure data proof: no browser storage, medical inference, or automatic training advice.
export function validate(data) {
  const fail = message => { throw new Error(message); };
  const text = value => typeof value === 'string' && value.trim().length > 0;
  if (!data || data.schemaVersion !== 1 || typeof data.isDemo !== 'boolean') fail('Invalid schema');
  if (!text(data.profile?.id) || !text(data.profile?.goal)) fail('Invalid profile');
  for (const key of ['exercises', 'sessions', 'sets']) {
    if (!Array.isArray(data[key])) fail(`Invalid ${key}`);
    const ids = data[key].map(item => item?.id);
    if (ids.some(id => !text(id)) || new Set(ids).size !== ids.length) fail(`Invalid IDs: ${key}`);
  }
  const exerciseIds = new Set(data.exercises.map(e => e.id));
  const sessionIds = new Set(data.sessions.map(s => s.id));
  for (const e of data.exercises) {
    if (!text(e.name) || e.unit !== 'kg' || !['external-total','per-dumbbell'].includes(e.loadConvention) ||
        !Array.isArray(e.muscleIds) || e.muscleIds.some(m => !text(m)) ||
        !text(e.knowledgeSource?.type) || typeof e.knowledgeSource?.reviewed !== 'boolean') fail('Invalid exercise');
  }
  for (const s of data.sessions) {
    const parsed = typeof s.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.date)
      ? new Date(`${s.date}T12:00:00Z`) : new Date(NaN);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== s.date ||
        !['draft', 'completed'].includes(s.status)) fail('Invalid session');
  }
  for (const s of data.sets) {
    if (!exerciseIds.has(s.exerciseId) || !sessionIds.has(s.sessionId)) fail('Orphan set');
    if (!Number.isFinite(s.weightKg) || s.weightKg < 0 || !Number.isSafeInteger(s.reps) || s.reps < 1 ||
        !Number.isFinite(s.weightKg * s.reps)) fail('Invalid load or reps');
    if (s.rir !== null && (!Number.isFinite(s.rir) || s.rir < 0 || s.rir > 5)) fail('Invalid RIR');
  }
  if(data.profile.bodyCycleStart!==undefined){const v=data.profile.bodyCycleStart;const d=typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)?new Date(v+'T00:00:00Z'):new Date(NaN);if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==v)fail('Invalid body cycle anchor');}
  if(data.monitoring!==undefined){
    if(!Array.isArray(data.monitoring)||data.monitoring.length>10000)fail('Invalid monitoring');
    const dates=new Set(), ids=new Set();
    for(const m of data.monitoring){
      const date=typeof m?.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(m.date)?new Date(m.date+'T00:00:00Z'):new Date(NaN);
      if(!text(m?.id)||ids.has(m.id)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==m.date||dates.has(m.date))fail('Invalid monitoring date');
      dates.add(m.date);ids.add(m.id);
      for(const [key,min,max] of [['weightKg',1,500],['fatPercent',1,75],['fatigue',1,5],['soreness',1,5]]){
        if(m[key]!==null&&(!Number.isFinite(m[key])||m[key]<min||m[key]>max))fail('Invalid monitoring value');
      }
      if(m.waistCm!==undefined&&m.waistCm!==null&&(!Number.isFinite(m.waistCm)||m.waistCm<10||m.waistCm>300))fail('Invalid waist');
      if([m.weightKg,m.fatPercent,m.fatigue,m.soreness,m.waistCm??null].every(v=>v===null))fail('Empty monitoring');
      if(typeof m.method!=='string'||m.method.length>60||(m.fatPercent!==null&&!text(m.method)))fail('Invalid measurement method');
      if(typeof m.muscle!=='string'||m.muscle.length>30||(m.soreness!==null&&!text(m.muscle)))fail('Invalid soreness group');
      if([m.fatigue,m.soreness].some(v=>v!==null&&!Number.isInteger(v)))fail('Invalid subjective score');
    }
  }
  return data;
}

export function dailyVolumes(data, exerciseId) {
  validate(data);
  const sessions = new Map(data.sessions.filter(s => s.status === 'completed').map(s => [s.id, s]));
  const days = new Map();
  for (const set of data.sets) {
    const session = sessions.get(set.sessionId);
    if (!session || set.exerciseId !== exerciseId) continue;
    const day = days.get(session.date) ?? { date: session.date, volume: 0, setIds: [] };
    day.volume += set.weightKg * set.reps * volumeFactor(data,set.exerciseId);
    if (!Number.isFinite(day.volume)) throw new Error('Volume overflow');
    day.setIds.push(set.id);
    days.set(session.date, day);
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function compareLatest(data, exerciseId) {
  const days = dailyVolumes(data, exerciseId);
  if (days.length < 2) return { status: 'insufficient', days: days.length };
  const [previous, latest] = days.slice(-2);
  return {
    status: 'ready', previous, latest, difference: latest.volume - previous.volume,
    percent: previous.volume === 0 ? null : Math.round((latest.volume - previous.volume) / previous.volume * 1000) / 10
  };
}

export function projectGraph(data) {
  validate(data);
  const nodes = new Map();
  const links = [];
  const add = node => nodes.set(node.id, node);
  const goalId = `goal:${data.profile.id}`;
  add({ id: goalId, type: 'goal', label: data.profile.goal });
  for (const e of data.exercises) {
    const id = `exercise:${e.id}`;
    add({ id, type: 'exercise', label: e.name });
    links.push({ source: goalId, target: id, relation: '纳入训练视图', sourceType: 'profile', evidence: [data.profile.id] });
    for (const muscle of new Set(e.muscleIds)) {
      const mid = `muscle:${muscle}`;
      add({ id: mid, type: 'muscle', label: muscle });
      links.push({ source: id, target: mid, relation: '人工标注', sourceType: 'editorial', evidence: [e.id], knowledgeSource: e.knowledgeSource });
    }
  }
  for (const s of data.sessions.filter(s => s.status === 'completed')) {
    const sets = data.sets.filter(set => set.sessionId === s.id);
    if (!sets.length) continue;
    const sid = `session:${s.id}`;
    add({ id: sid, type: 'session', label: s.date });
    for (const eid of new Set(sets.map(set => set.exerciseId))) {
      links.push({ source: `exercise:${eid}`, target: sid, relation: '记录于', sourceType: 'user-record', evidence: sets.filter(set => set.exerciseId === eid).map(set => set.id) });
    }
  }
  return { nodes: [...nodes.values()], links };
}

// Convert only the explicitly identified legacy bilateral dumbbell action, once.
export function migrateDumbbells(raw, draft=null){
 validate(raw);const data=structuredClone(raw),input=draft?structuredClone(draft):null;
 const ids=new Set(data.exercises.filter(e=>e.id==='bench-dumbbell'&&e.loadConvention==='external-total').map(e=>e.id));
 for(const e of data.exercises)if(ids.has(e.id))e.loadConvention='per-dumbbell';
 for(const s of data.sets)if(ids.has(s.exerciseId))s.weightKg/=2;
 if(input&&ids.has(input.exerciseId)&&input.weightKg!==''&&input.weightKg!=null&&Number.isFinite(Number(input.weightKg)))input.weightKg=String(Number(input.weightKg)/2);
 return {data,input,changed:ids.size>0};
}
export const volumeFactor=(data,id)=>data.exercises.find(e=>e.id===id)?.loadConvention==='per-dumbbell'?2:1;
