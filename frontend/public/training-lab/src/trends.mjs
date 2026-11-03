import { validate, volumeFactor } from './domain.mjs';

export function buildSeries(data, {exerciseId, metric='weight', reps='all', period='all', today}={}) {
  validate(data);
  if(!['weight','volume'].includes(metric))throw new Error('Unknown metric');
  if(!['all','30','90'].includes(String(period)))throw new Error('Unknown period');
  if(reps!=='all'&&(!Number.isInteger(Number(reps))||Number(reps)<1))throw new Error('Invalid reps');
  const sessions=new Map(data.sessions.filter(s=>s.status==='completed').map(s=>[s.id,s]));
  const cutoff=period==='all'?null:new Date(Date.parse(today+'T00:00:00Z')-(Number(period)-1)*86400000).toISOString().slice(0,10);
  const days=new Map();
  for(const set of data.sets){
    const session=sessions.get(set.sessionId);
    if(!session||set.exerciseId!==exerciseId||(cutoff&&(session.date<cutoff||session.date>today)))continue;
    if(metric==='weight'&&reps!=='all'&&set.reps!==Number(reps))continue;
    const point=days.get(session.date)||{date:session.date,value:0,sets:[]};
    point.value=metric==='volume'?point.value+set.weightKg*set.reps*volumeFactor(data,set.exerciseId):Math.max(point.value,set.weightKg);
    if(!Number.isFinite(point.value))throw new Error('Metric overflow');
    point.sets.push(set);days.set(session.date,point);
  }
  return [...days.values()].sort((a,b)=>a.date.localeCompare(b.date));
}

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>new Intl.NumberFormat('zh-CN',{maximumFractionDigits:1}).format(v);
export function renderTrendView(data, options, rows) {
  const exercise=data.exercises.find(e=>e.id===options.exerciseId)||data.exercises[0];
  if(!exercise)return '<section class="surface"><p class="empty">没有可用动作，请先建立动作记录。</p></section>';
  const points=buildSeries(data,{...options,exerciseId:exercise.id});
  const selected=points.find(p=>p.date===options.date)||points.at(-1);
  const last=points.at(-1), first=points[0];
  const unit=options.metric==='volume'?'kg·次':'kg';
  const label=options.metric==='volume'?'每日训练量':options.reps==='all'?'每日最高重量':`每组 ${options.reps} 次的最高重量`;
  const delta=points.length>1?last.value-first.value:null;
  const peak=points.length?Math.max(...points.map(p=>p.value)):null;
  const repsOptions=[...new Set([5,8,10,12,...data.sets.filter(s=>s.exerciseId===exercise.id).map(s=>s.reps)])].sort((a,b)=>a-b);
  const controls=`<div class="trend-controls"><label>训练动作<select data-trend-option="exerciseId" aria-label="趋势动作">${data.exercises.map(e=>`<option value="${esc(e.id)}" ${e.id===exercise.id?'selected':''}>${esc(e.name)}</option>`).join('')}</select></label><label>查看指标<select data-trend-option="metric" aria-label="趋势指标"><option value="weight" ${options.metric==='weight'?'selected':''}>最高重量</option><option value="volume" ${options.metric==='volume'?'selected':''}>训练量</option></select></label><label>每组次数<select data-trend-option="reps" aria-label="比较次数" ${options.metric==='volume'?'disabled':''}><option value="all" ${options.reps==='all'?'selected':''}>不限次数</option>${repsOptions.map(n=>`<option value="${n}" ${String(n)===String(options.reps)?'selected':''}>${n} 次</option>`).join('')}</select></label><label>时间范围<select data-trend-option="period" aria-label="趋势时间范围">${[['all','全部记录'],['30','近 30 天'],['90','近 90 天']].map(([v,t])=>`<option value="${v}" ${options.period===v?'selected':''}>${t}</option>`).join('')}</select></label></div>`;
  return `<section class="surface trend-chart-surface"><div class="surface-heading"><div><p class="eyebrow">训练表现的时间线</p><h2>力量与训练趋势</h2></div><span class="badge ${data.isDemo?'demo':''}">${data.isDemo?'示例数据 · 非个人表现':'来自已完成训练'}</span></div>${controls}<div class="chart-stats"><div><span>最近记录</span><strong>${last?fmt(last.value):'—'} <small>${unit}</small></strong><p>${last?esc(last.date):'等待首次记录'}</p></div><div><span>较首个记录日</span><strong>${delta===null?'—':(delta>0?'+':'')+fmt(delta)} <small>${unit}</small></strong><p>${points.length>1?esc(first.date)+' 起':'至少需要两个记录日'}</p></div><div><span>所选范围最高</span><strong>${peak===null?'—':fmt(peak)} <small>${unit}</small></strong><p>${points.length} 个记录日</p></div></div><div class="chart-title"><h3>${esc(exercise.name)} · ${esc(label)}</h3><span>${unit}</span></div>${points.length?chart(points,selected.date,unit):`<div class="chart-empty"><span>尚无符合条件的记录</span><p>试试其他次数或时间范围，也可以先完成一次训练。</p><button class="soft-button" data-record="${esc(exercise.id)}">记录这个动作</button></div>`}<p class="chart-caption">${points.length===1?'目前只有一个记录日，仅显示数据点；第二个记录日出现后会连线。':'横轴按实际日期间隔排列；连线仅连接已有记录，未训练日不补值。'} ${options.metric==='volume'?'训练量 = 重量 × 次数之和；双哑铃动作按单只重量 × 2 计算；次数筛选不影响此指标。':'最高重量取当天符合次数条件的最重一组。可选固定次数，让比较更接近。'}</p><p class="chart-caution">哑铃重量为单只、杠铃为含杆总重。重量或训练量增加，不自动等于力量提升；次数、动作幅度、技术和主观余力也会影响比较。</p></section>${selected?`<section class="surface chart-evidence"><div class="surface-heading"><div><p class="eyebrow">点击曲线数据点，回到原始记录</p><h2>${esc(selected.date)} · ${esc(exercise.name)}</h2></div><span class="badge">${selected.sets.length} 组${options.metric==='weight'&&options.reps!=='all'?' · 次数筛选后':''}</span></div><label class="point-selector">查看记录日<select aria-label="选择趋势记录日" data-trend-date-select>${points.map(p=>`<option value="${p.date}" ${p.date===selected.date?'selected':''}>${p.date} · ${fmt(p.value)} ${unit}</option>`).join('')}</select></label>${rows(selected.sets)}<p class="chart-caption">${options.metric==='weight'?'本日最高重量：'+fmt(selected.value)+' kg。':'本日训练量：'+fmt(selected.value)+' kg·次。'} 编辑或删除原始记录后，曲线会重新计算。</p></section>`:''}`;
}

function chart(points, selected, unit) {
  const left=72,right=866,top=22,bottom=255;
  const start=Date.parse(points[0].date+'T00:00:00Z'),end=Date.parse(points.at(-1).date+'T00:00:00Z');
  const max=Math.max(...points.map(p=>p.value),1);
  const magnitude=10**Math.floor(Math.log10(max));
  const ceiling=Math.ceil(max/magnitude)*magnitude;
  const coords=points.map(p=>({...p,x:start===end?(left+right)/2:left+(Date.parse(p.date+'T00:00:00Z')-start)/(end-start)*(right-left),y:bottom-p.value/ceiling*(bottom-top)}));
  return `<div class="chart-scroll" tabindex="0" aria-label="训练趋势曲线，可横向滚动"><svg class="performance-chart" viewBox="0 0 900 305" role="group" aria-label="${esc(unit)}随训练日期变化，${points.length} 个数据点"><defs><linearGradient id="trend-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b59aff" stop-opacity=".17"/><stop offset="1" stop-color="#b59aff" stop-opacity="0"/></linearGradient></defs>${[0,1,2,3,4].map(i=>{const y=bottom-i/4*(bottom-top);return `<line class="chart-grid" x1="${left}" x2="${right}" y1="${y}" y2="${y}"/><text class="chart-tick" x="${left-13}" y="${y+4}" text-anchor="end">${fmt(ceiling*i/4)}</text>`;}).join('')}${coords.length>1?`<path fill="url(#trend-area)" d="M${coords[0].x},${bottom} ${coords.map(p=>`L${p.x},${p.y}`).join(' ')} L${coords.at(-1).x},${bottom} Z"/><polyline class="chart-line" points="${coords.map(p=>`${p.x},${p.y}`).join(' ')}"/>`:''}${coords.map(p=>`<g data-trend-date="${p.date}" role="button" tabindex="0" aria-label="${p.date}，${fmt(p.value)} ${unit}" aria-pressed="${p.date===selected}" class="chart-point ${p.date===selected?'chosen':''}" transform="translate(${p.x} ${p.y})"><circle class="chart-hit" r="15"/><circle class="chart-dot" r="${p.date===selected?6:4}"/><title>${p.date} · ${fmt(p.value)} ${unit} · 点击查看记录</title></g>`).join('')}<text class="chart-tick" x="${coords[0].x}" y="286" text-anchor="${coords.length===1?'middle':'start'}">${points[0].date}</text>${coords.length>1?`<text class="chart-tick" x="${right}" y="286" text-anchor="end">${points.at(-1).date}</text>`:''}</svg></div>`;
}
