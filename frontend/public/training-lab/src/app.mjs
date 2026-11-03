import { renderBodyArchive, hasBody } from './body-archive.mjs';
import { renderRecovery } from './recovery.mjs';
import { renderDiscomfort, renderCareResult, renderCareLibrary, topicForGroup } from './discomfort.mjs';
import { renderTrendView } from './trends.mjs';
import { anatomy } from './anatomy.mjs';
import { muscleGuides, postureNote } from './muscle-guide.mjs';
import { validate, projectGraph } from './domain.mjs';
import { blankData, catalog, muscles, exercisePositions, localDate } from './catalog.mjs';

const trendOptions={exerciseId:'bench-barbell',metric:'weight',reps:'all',period:'all',date:null};
const KEY = 'thinmuscle:v1';
const app = document.querySelector('#app');
const modal = document.querySelector('#modal');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => crypto.randomUUID();
const fmt = n => new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 }).format(n);
const icons = {
  star: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>',
  graph: '<circle cx="12" cy="12" r="3"/><circle cx="4" cy="5" r="2"/><circle cx="20" cy="5" r="2"/><circle cx="5" cy="20" r="2"/><path d="m6 7 4 3m4 0 4-3M7 18l3-4m5 0 5 6"/>',
  training: '<path d="m5 7 12 12M3 9l6-6m6 18 6-6M2 5l3-3m14 20 3-3"/>',
  trend: '<path d="M4 4v16h16M7 14l4-4 4 2 6-7"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>', check: '<path d="m5 12 4 4L19 6"/>',
  reset: '<path d="M4 9a8 8 0 1 1 1 9M4 3v6h6"/>', close: '<path d="m6 6 12 12M18 6 6 18"/>',
  down: '<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>', list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.star}</svg>`;
let data = blankData(), input = { exerciseId: 'bench-barbell', weightKg: '', reps: '', rir: '' };
let loadError = '', damaged = false;
try {
  const stored = localStorage.getItem(KEY);
  if (stored) {
    const parsed = JSON.parse(stored); data = validate(parsed.data || parsed);
    if (parsed.input && typeof parsed.input === 'object') input = { ...input, ...parsed.input };
  }
} catch { loadError = '本机数据未能读取，原数据未覆盖。可到“我的”导出原始内容或清除后重新开始。'; damaged = true; }
let personal = null, personalInput = null, route = ['graph','training','trends','care','recovery','profile'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'graph', selected = 'muscle:胸部', search = '', listMode = false;
let scale = 1, pan = { x: 0, y: 0 }, filter = 'all', selectedLink = null;
let toastTimer, suppressNodeClick = false;
const forecastOptions={metric:'strength',exercise:'bench-barbell',reps:12,rir:2,horizon:14,method:''};
let monitorDraft=null, bodyMethod='';
let careState={exercise:'',region:'',timing:'',feel:'',signal:'',submitted:false};
let detailOpen=false, graphIntroduced=false;
const LAYOUT_KEY='thinmuscle:layout:v1';
let positions={};
try { const saved=JSON.parse(localStorage.getItem(LAYOUT_KEY)||'{}'); for(const [id,p] of Object.entries(saved)) if(Number.isFinite(p.x)&&Number.isFinite(p.y)) positions[id]=p; } catch {}

const completed = () => data.sessions.filter(s => s.status === 'completed');
const completedSets = () => { const ids = new Set(completed().map(s => s.id)); return data.sets.filter(s => ids.has(s.sessionId)); };
const draft = () => data.sessions.find(s => s.status === 'draft');
function notify(message) {
  const el = document.querySelector('#toast'); el.textContent = message; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}
function save(next = data, nextInput = input) {
  try {
    validate(next);
    if (!next.isDemo) {
      if (damaged) throw new Error('damaged');
      localStorage.setItem(KEY, JSON.stringify({ data: next, input: nextInput }));
    }
    data = next; input = nextInput; return true;
  } catch { notify('未保存：请检查浏览器存储权限，或先导出已有数据。输入已保留。'); return false; }
}
const badge = (text, cls = '') => `<span class="badge ${cls}">${esc(text)}</span>`;
function nav() {
  return `<aside class="sidebar"><a href="/" class="shared-home" style="font-size:11px;color:#a99bb6;margin:0 10px 18px">返回 FitPilot 工作台</a><a href="#" class="brand" aria-label="超薄肌 Lab 首页">${icon('star')}<span>超薄肌<small>Lab / 训练星图</small></span></a><div class="nav-caption">个人空间</div><nav aria-label="主导航">${[['graph','星图','graph'],['training','训练','training'],['trends','趋势','trend'],['recovery','恢复与预测','trend'],['care','训练不适','list'],['profile','我的','user']].map(([id,label,i]) => `<button class="nav-item ${route === id ? 'active' : ''}" data-route="${id}" ${route === id ? 'aria-current="page"' : ''}>${icon(i)}<span>${label}</span>${route === id ? '<i></i>' : ''}</button>`).join('')}<a class="nav-item" href="/fitpilot-atlas/index.html">${icon('graph')}<span>肌群图谱 · 24 动作</span></a><a class="nav-item" href="/fitpilot-atlas/index.html?view=plan">${icon('training')}<span>每周训练计划</span></a></nav><div class="sidebar-bottom"><div class="small-orbit">${icon('star')}</div><p>每一组努力<br>都有自己的轨迹。</p><span class="local-dot">保存在当前浏览器</span><button class="profile-shortcut" data-route="profile"><span class="avatar">${esc(data.profile.nickname?.slice(0,1) || '你')}</span><span>${esc(data.profile.nickname || '我的训练空间')}<small>${data.profile.onboarded ? esc(data.profile.goal) : '等待第一颗训练星'}</small></span></button></div></aside>`;
}
function render() {
  history.replaceState(null, '', '#' + route);
  app.innerHTML = `${nav()}<main><header class="topbar"><div class="breadcrumb">我的空间 <span>/</span> ${{graph:'个人训练星图', training:'训练记录', trends:'训练趋势', recovery:'恢复与预测',care:'训练不适知识库',profile:'个人档案'}[route]}</div><div class="top-actions">${data.isDemo ? badge('示例模式 · 非个人记录','demo') : '<span class="save-status"><i></i>仅本机保存</span>'}<button class="ghost" data-action="demo">${data.isDemo ? '返回我的星图' : '探索示例'}</button><button class="primary" data-action="start">${icon('plus')}记录训练</button></div></header>${loadError ? `<div class="storage-warning">${esc(loadError)}</div>` : ''}<section class="page-heading"><div><p class="eyebrow">${route === 'graph' ? '你的训练，正在连接' : '超薄肌 Lab'}</p><h1>${{graph:'训练，由此连接。',training:'专注眼前这一组。',trends:'用真实记录，看见变化。',recovery:'了解当下，看向下一步。',care:'听见身体的反馈。',profile:'按照你的节奏，开始。'}[route]}</h1><p class="subtitle">${{graph:'探索肌群与动作，让每一组记录都有迹可循。', training:'保留上一次的成绩，记录今天的自己。', trends:'每个数字都有出处，每次比较都能回到原始记录。', recovery:'用真实记录观察恢复线索，以条件化趋势探索未来。',care:'从动作与部位出发，查找有来源的处理知识。',profile:'只收集开始训练所需的信息，你的数据由你掌握。'}[route]}</p></div>${route === 'graph' ? `<div class="heading-summary"><div><strong>${completed().length.toString().padStart(2,'0')}</strong><span>完成训练</span></div><b></b><div><strong>${completedSets().length.toString().padStart(2,'0')}</strong><span>已记录组数</span></div></div>` : ''}</section>${route === 'graph' ? graphPage() : route === 'training' ? trainingPage() : route === 'trends' ? trendsPage() : route === 'care' ? renderDiscomfort(data,careState) : route === 'recovery' ? renderRecovery(data,forecastOptions,localDate()) : profilePage()}<footer>超薄肌 Lab <span>把努力连成自己的宇宙</span><span>Day 1 · 本地试用版</span></footer></main>`;
  if (route === 'graph') bindGraph();
  if (route === 'care') bindCare();
  if (route === 'recovery') bindMonitor();
  if (route === 'training') bindTraining();
  if (route === 'profile') document.querySelector('#import-file')?.addEventListener('change', importFile);
}
function graphPage() {
  return `<div class="workspace ${detailOpen ? '' : 'detail-closed'}"><section class="graph-panel"><div class="graph-header"><div><h2>${icon('graph')}个人训练星图</h2><span>拖动星点调整布局 · 点击查看关联</span></div><button class="ghost detail-toggle" data-action="toggle-detail" aria-pressed="${detailOpen}">详情</button><button class="icon-button ${listMode ? 'selected' : ''}" data-action="list" aria-label="${listMode ? '切换星图' : '切换列表'}" title="切换星图 / 列表">${icon(listMode ? 'graph' : 'list')}</button></div><div class="graph-toolbar"><div class="filter-tabs" aria-label="星图筛选">${[['all','全部'],['muscle','肌群'],['exercise','动作'],['anatomy','解剖'],['session','记录']].map(([id,label])=>`<button data-filter="${id}" class="${filter === id ? 'active' : ''}" aria-pressed="${filter === id}">${label}</button>`).join('')}</div><label class="search">${icon('search')}<input id="graph-search" type="search" placeholder="寻找一颗星…" value="${esc(search)}" aria-label="搜索星图节点" /></label></div><div id="graph-content">${graphContent()}</div><div class="graph-bottom"><div class="legend">${[['#c2c1c5','肌群'],['#a6a5ac','动作'],['#85848c','解剖'],['#c6b6da','记录']].map(([c,n])=>`<span><i style="--dot:${c}"></i>${n}</span>`).join('')}</div><span class="graph-note">${data.isDemo ? '演示数据，可自由探索' : '动作关系为编辑标注 · 待复核'}</span></div></section><aside id="detail-panel" class="detail-panel" aria-label="节点详情" ${detailOpen?'':'hidden'}>${detail()}</aside></div>${!data.profile.onboarded && !data.isDemo ? `<section class="onboard-banner"><span class="banner-mark">${icon('star')}</span><div><h3>你的星图，从第一组开始。</h3><p>花一分钟设置目标，留下属于你的第一条训练轨迹。</p></div><button class="soft-button" data-action="onboard">建立我的档案 ${icon('arrow')}</button></section>` : `<section class="onboard-banner"><span class="banner-mark">${icon('training')}</span><div><h3>${draft() ? '你的训练还在继续。' : '下一颗训练星，等你点亮。'}</h3><p>${draft() ? '已完成的组保存在草稿中，随时回来继续。' : '记录一组，动作与训练便有了真实的连接。'}</p></div><button class="soft-button" data-action="start">${draft() ? '继续训练' : '记录一组'} ${icon('arrow')}</button></section>`}`;
}
function graphData() {
  const graph = projectGraph(data);
  const sessionNodes = graph.nodes.filter(n=>n.type === 'session').slice(-10);
  const sessionIds = new Set(sessionNodes.map(n=>n.id));
  graph.nodes = graph.nodes.filter(n=>n.type !== 'session' || sessionIds.has(n.id));
  const ids = new Set(graph.nodes.map(n=>n.id)); graph.links = graph.links.filter(l=>ids.has(l.source)&&ids.has(l.target));
  graph.nodes.forEach(n=>{
    if (n.type === 'muscle') Object.assign(n, muscles[n.label] || {x:500,y:400,color:'#b59aff'});
    if (n.type === 'exercise') { const eid=n.id.slice(9); const e=data.exercises.find(e=>e.id===eid); [n.x,n.y]=exercisePositions[eid] || [450,300]; n.color=muscles[e.muscleIds[0]]?.color || '#b59aff'; }
    if (n.type === 'goal') Object.assign(n,{x:475,y:335,color:'#b59aff'});
    if (n.type === 'session') { const i=sessionNodes.findIndex(s=>s.id===n.id); Object.assign(n,{x:440+(i%5)*63,y:410+Math.floor(i/5)*47,color:'#b2a6d5'}); }
  });
  for(const a of anatomy){
    graph.nodes.push({id:a.id,type:'anatomy',label:a.name,x:a.x,y:a.y,color:muscles[a.parent].color});
    graph.links.push({source:'muscle:'+a.parent,target:a.id,relation:'部位分组',sourceType:'editorial',evidence:[a.name+' · '+a.parent+'（界面分组）']});
    for(const eid of a.exercises) if(data.exercises.some(e=>e.id===eid)) graph.links.push({source:a.id,target:'exercise:'+eid,relation:'动作涉及（简化标注）',sourceType:'editorial',evidence:[a.name,eid]});
  }
  for(const n of graph.nodes) if(positions[n.id]) Object.assign(n,positions[n.id]);
  return graph;
}
function visible(n) { return (filter === 'all' || n.type === filter) && (!search || n.label.toLowerCase().includes(search.toLowerCase())); }
function graphContent() {
  const graph=graphData();
  if (listMode) return `<div class="node-list">${graph.nodes.filter(visible).map(n=>`<button class="node-list-item ${selected === n.id ? 'chosen':''}" data-node="${esc(n.id)}"><span class="list-dot" style="--dot:${n.color}"></span><span>${esc(n.label)}<small>${{anatomy:'具体肌肉 / 肌群',goal:'训练目标',anatomy:'解剖',muscle:'肌群',exercise:'训练动作',session:'已完成训练'}[n.type]}</small></span>${icon('arrow')}</button>`).join('') || '<p class="empty">没有匹配的节点，试试其他关键词。</p>'}</div>`;
  const nodes = new Map(graph.nodes.map(n=>[n.id,n]));
  const adjacent = new Set([selected]); graph.links.filter(l=>l.source===selected||l.target===selected).forEach(l=>{adjacent.add(l.source);adjacent.add(l.target);});
  const entering=!graphIntroduced;graphIntroduced=true;
  return `<div class="constellation minimal-map ${entering?'graph-enter':''}"><svg id="star-map" viewBox="0 0 1000 650" role="group" aria-label="肌群、动作与训练记录的关系星图"><g id="viewport" transform="translate(${pan.x} ${pan.y}) translate(500 325) scale(${scale}) translate(-500 -325)"><g class="edges">${graph.links.map((l,i)=>{
    const a=nodes.get(l.source),b=nodes.get(l.target); if(!a||!b)return '';
    const on=detailOpen&&(l.source===selected||l.target===selected);
    const muted=!visible(a)||!visible(b);
    return `<g class="edge ${on?'lit':''} ${muted?'filtered':''}" data-edge="${i}" role="button" tabindex="${muted?-1:0}" aria-label="${esc(a.label+'与'+b.label+'：'+l.relation)}"><line class="edge-hit" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/><line class="connection-line" vector-effect="non-scaling-stroke" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/></g>`;
  }).join('')}</g>${graph.nodes.map((n,i)=>{
    const dim=!visible(n),active=detailOpen&&selected===n.id,r=n.type==='muscle'?7.5:n.type==='goal'?8:n.type==='session'?5:5.5;
    const label=n.type==='session'?n.label.slice(5):n.type==='goal'&&!data.profile.onboarded&&!data.isDemo?'我的目标':n.label;
    return `<g class="star-node ${n.type} ${active?'chosen':''} ${dim?'dim':''}" style="--entry-delay:${Math.min(i*13,260)}ms" transform="translate(${n.x} ${n.y})" data-node="${esc(n.id)}" role="button" tabindex="${dim?-1:0}" aria-label="${esc(n.label)}，${{anatomy:'解剖',muscle:'肌群',exercise:'动作',goal:'目标',session:'训练记录'}[n.type]}" aria-pressed="${active}"><rect class="node-hit" x="-60" y="-17" width="120" height="54" fill="transparent"/><circle class="selection-ring" r="15"/><circle class="node-core" r="${r}"/><text class="node-label" y="26">${esc(label)}</text></g>`;
  }).join('')}</g></svg><div class="map-coordinate"><span>${graph.nodes.length} 个节点 / ${graph.links.length} 条关系</span><span>拖动节点 · 空白处平移</span></div><div class="map-controls"><button data-action="zoom-out" aria-label="缩小星图">−</button><span id="zoom-label">${Math.round(scale*100)}%</span><button data-action="zoom-in" aria-label="放大星图">＋</button><i></i><button data-action="reset-map" aria-label="复位星图">${icon('reset')}</button></div></div>`;
}

function guideHTML(id) {
  const guide=muscleGuides[id]; if(!guide)return '';
  const showPosture=['muscle:背部','anatomy:trapezius','anatomy:latissimus','anatomy:erectors'].includes(id);
  return `<section class="muscle-guide" aria-label="肌群功能科普"><span class="eyebrow">认识这组肌肉</span><h3>${esc(guide[0])}</h3><p>${esc(guide[1])}</p><div class="daily-use"><strong>生活里怎么用</strong><p>${esc(guide[2])}</p></div><a href="${esc(guide[3])}" target="_blank" rel="noopener noreferrer">解剖学来源 · OpenStax ↗</a>${showPosture?`<details class="posture-note"><summary>${esc(postureNote.title)}</summary><p>${esc(postureNote.text)}</p><p>${esc(postureNote.care)}</p><a href="${esc(postureNote.source)}" target="_blank" rel="noopener noreferrer">颈部活动与姿势建议 · NHS ↗</a></details>`:''}</section>`;
}
function detail() {
  if (selectedLink) return `<div class="detail-top"><span class="eyebrow">连接的依据</span>${badge('关系')}</div><h2>${esc(selectedLink.relation)}</h2><p class="detail-intro">${selectedLink.sourceType==='user-record'?'来自已完成训练中的真实组记录。':selectedLink.sourceType==='editorial'?'动作与肌群的编辑标注，目前待复核。':'这个动作被纳入个人训练视图，不代表一定达成目标。'}</p><div class="evidence">${selectedLink.evidence.map(id=>{const set=data.sets.find(s=>s.id===id);return set?`<p>${esc(data.exercises.find(e=>e.id===set.exerciseId)?.name)}<strong>${set.weightKg} kg × ${set.reps} 次</strong><small>${esc(id.slice(0,8))}</small></p>`:`<p>${esc(id)}</p>`;}).join('')}</div><button class="soft-button full" data-action="back-detail">返回节点详情</button>`;
  const node=graphData().nodes.find(n=>n.id===selected) || graphData().nodes[0];
  const related=node.type==='anatomy'?data.exercises.filter(e=>anatomy.find(a=>a.id===node.id)?.exercises.includes(e.id)):node.type==='muscle'?data.exercises.filter(e=>e.muscleIds.includes(node.label)):node.type==='exercise'?data.exercises.filter(e=>'exercise:'+e.id===node.id):node.type==='session'?data.exercises.filter(e=>data.sets.some(s=>'session:'+s.sessionId===node.id&&s.exerciseId===e.id)):data.exercises;
  const exerciseIds = new Set(related.map(e=>e.id));
  const sets=completedSets().filter(s=>exerciseIds.has(s.exerciseId)&&(node.type!=='session'||'session:'+s.sessionId===node.id));
  const title=node.type==='muscle'?`${node.label}星系`:node.label;
  return `<div class="detail-top"><span class="eyebrow">正在探索</span>${badge({anatomy:'解剖',muscle:'肌群',exercise:'动作',goal:'目标',session:'训练'}[node.type])}</div><div class="detail-symbol" style="--node:${node.color}">${node.type==='muscle'?esc(node.letter):icon(node.type==='exercise'?'training':'star')}</div><h2>${esc(title)}</h2>${['muscle','anatomy','exercise'].includes(node.type)?`<button class="text-button care-entry" data-care-node="${esc(node.id)}">这里不适？查找处理知识</button>`:''}<p class="detail-intro">${node.type==='anatomy'?'查看具体肌肉的部位分组与动作关联。':node.type==='muscle'?'从这里，看见相关动作与留下的每一组训练。':node.type==='exercise'?'每一次完成，都为这个动作留下新的坐标。':node.type==='session'?'这一天的已完成组记录，组成了你的训练轨迹。':'目标提供方向，真实记录描绘过程。'}</p>${guideHTML(node.id)}<div class="detail-metrics"><div><strong>${sets.length.toString().padStart(2,'0')}</strong><span>关联完成组数</span></div><div><strong>${new Set(sets.map(s=>s.sessionId)).size.toString().padStart(2,'0')}</strong><span>关联训练</span></div></div>${node.type==='anatomy'?'<p class="detail-footnote">所属界面分组：'+esc(anatomy.find(a=>a.id===node.id)?.parent)+'。关联动作是简化编辑标注，不表示激活强度。</p><a class="text-button" target="_blank" rel="noopener noreferrer" href="https://openstax.org/books/anatomy-and-physiology-2e/pages/11-chapter-review">查看解剖学参考 · OpenStax</a>':''}<div class="section-label"><h3>关联动作</h3><span>${related.length} 个</span></div><div class="related-actions">${related.map(e=>`<button data-node="exercise:${esc(e.id)}"><span class="exercise-mark">${icon('training')}</span><span>${esc(e.name)}<small>${data.sets.some(s=>s.exerciseId===e.id)?'已有训练轨迹':'等待首次记录'}</small></span>${icon('arrow')}</button>`).join('')}</div><button class="primary full detail-record" ${related.length ? '' : 'disabled'} data-record="${esc(related[0]?.id||'bench-barbell')}">${icon('plus')}记录一组</button>${node.type==='exercise'?`<button class="text-button full" data-trend-exercise="${esc(node.id.slice(9))}">查看这个动作的曲线 ${icon('trend')}</button>`:''}<div class="detail-footnote">${node.type==='muscle'?'肌群关系为编辑标注，待复核。':data.isDemo?'这里展示的是示例数据，不代表你的个人表现。':'训练记录仅保存在当前浏览器。'}</div>`;
}
function bindGraph() {
  document.querySelector('#graph-search').addEventListener('input', e=>{search=e.target.value;refreshGraph();});
  bindPan();
}
function refreshGraph() { document.querySelector('.workspace')?.classList.toggle('detail-closed',!detailOpen); document.querySelector('#detail-panel').hidden=!detailOpen; document.querySelector('.detail-toggle')?.setAttribute('aria-pressed',String(detailOpen)); document.querySelector('#graph-content').innerHTML=graphContent(); document.querySelector('#detail-panel').innerHTML=detail(); bindPan(); }
function bindPan() {
  const svg=document.querySelector('#star-map'); if(!svg)return;
  let drag=null;
  const hover=id=>{
    const graph=graphData();const connected=new Set([id]);
    for(const l of graph.links)if(l.source===id||l.target===id){connected.add(l.source);connected.add(l.target);}
    svg.classList.toggle('has-hover',!!id);
    for(const n of svg.querySelectorAll('[data-node]'))n.classList.toggle('hover-related',!!id&&connected.has(n.dataset.node));
    for(const el of svg.querySelectorAll('[data-edge]')){const l=graph.links[Number(el.dataset.edge)];el.classList.toggle('hover-route',!!id&&(l.source===id||l.target===id));}
  };
  svg.addEventListener('pointerover',e=>{if(!drag){const n=e.target.closest('[data-node]');hover(n?.dataset.node);}});
  svg.addEventListener('pointerleave',()=>{if(!drag)hover(null);});
  svg.addEventListener('focusin',e=>hover(e.target.closest('[data-node]')?.dataset.node));
  svg.addEventListener('focusout',()=>hover(null));
  const point=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse());};
  svg.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    const node=e.target.closest('[data-node]');
    if(!node&&e.target.closest('[data-edge]'))return;
    const p=point(e);const id=node?.dataset.node;const n=id?graphData().nodes.find(n=>n.id===id):null;
    drag={id,start:p,x:n?.x??pan.x,y:n?.y??pan.y,moved:false};

  });
  svg.addEventListener('pointermove',e=>{
    if(!drag)return;const p=point(e);const dx=p.x-drag.start.x,dy=p.y-drag.start.y;
    if(Math.hypot(dx,dy)<4&&!drag.moved)return;drag.moved=true;svg.classList.add('is-dragging');svg.setPointerCapture(e.pointerId);
    if(!drag.id){pan={x:drag.x+dx,y:drag.y+dy};updateTransform();return;}
    positions[drag.id]={x:Math.max(65,Math.min(935,drag.x+dx/scale)),y:Math.max(50,Math.min(615,drag.y+dy/scale))};
    const graph=graphData(),nodes=new Map(graph.nodes.map(n=>[n.id,n]));
    for(const el of svg.querySelectorAll('[data-node]')){const n=nodes.get(el.dataset.node);el.setAttribute('transform',`translate(${n.x} ${n.y})`);}
    for(const el of svg.querySelectorAll('[data-edge]')){const l=graph.links[Number(el.dataset.edge)],a=nodes.get(l.source),b=nodes.get(l.target);for(const line of el.querySelectorAll('line')){line.setAttribute('x1',a.x);line.setAttribute('y1',a.y);line.setAttribute('x2',b.x);line.setAttribute('y2',b.y);}}
  });
  const finish=()=>{svg.classList.remove('is-dragging');hover(null);if(!drag)return;if(drag.moved){suppressNodeClick=true;setTimeout(()=>suppressNodeClick=false,80);if(drag.id)try{localStorage.setItem(LAYOUT_KEY,JSON.stringify(positions));}catch{notify('布局已调整，但浏览器未能保存位置');}}drag=null;};
  svg.addEventListener('pointerup',finish);svg.addEventListener('pointercancel',finish);
}
function updateTransform() { document.querySelector('#viewport')?.setAttribute('transform',`translate(${pan.x} ${pan.y}) translate(500 325) scale(${scale}) translate(-500 -325)`); const label=document.querySelector('#zoom-label');if(label)label.textContent=`${Math.round(scale*100)}%`; }
function trainingPage() {
  const active=draft(); const activeSets=data.sets.filter(s=>s.sessionId===active?.id);
  const prev=[...completedSets()].reverse().find(s=>s.exerciseId===input.exerciseId);
  return `<div class="training-layout"><section class="surface record-surface"><div class="surface-heading"><h2>${icon('training')}${active?'训练进行中':'记录今天的训练'}</h2>${badge(data.isDemo?'示例练习':'自动保留草稿')}</div><p class="muted">${localDate()} · 外部总负重（含杆重 / 双侧哑铃合计）</p><form id="record-form"><label class="field">训练动作<select name="exerciseId" id="exercise-select">${data.exercises.map(e=>`<option value="${esc(e.id)}" ${input.exerciseId===e.id?'selected':''}>${esc(e.name)}</option>`).join('')}</select></label><button type="button" class="text-button care-entry" data-care-exercise="${esc(input.exerciseId)}">这个动作不适？查找处理知识</button><div class="previous">上次完成 <strong>${prev?`${prev.weightKg} kg × ${prev.reps} 次`:'还没有记录，从今天开始'}</strong></div><div class="record-fields"><label class="field">重量 <span>kg</span><input name="weightKg" type="number" min="0" step="0.1" required inputmode="decimal" value="${esc(input.weightKg)}" placeholder="30" /></label><label class="field">次数 <span>次</span><input name="reps" type="number" min="1" step="1" required inputmode="numeric" value="${esc(input.reps)}" placeholder="12" /></label></div><label class="field">感觉还能做几次？<select name="rir"><option value="" ${input.rir===''?'selected':''}>不确定 / 跳过</option>${[0,1,2,3,4,5].map(n=>`<option value="${n}" ${String(input.rir)===String(n)?'selected':''}>${n===5?'5 次及以上':n+' 次'}${n===0?'（已到极限）':''}</option>`).join('')}</select></label><div class="record-buttons"><button type="button" class="soft-button" data-action="copy-set">复制上组</button><button class="primary" type="submit">${icon('check')}完成本组</button></div></form><div class="session-footer"><span>本次已记录 <strong>${activeSets.length}</strong> 组</span><button class="ghost" data-action="finish" ${activeSets.length?'':'disabled'}>结束并保存训练 ${icon('arrow')}</button></div></section><section class="surface"><div class="surface-heading"><h2>本次轨迹</h2>${badge(activeSets.length+' 组')}</div>${setRows(activeSets)}${activeSets.length?'':'<div class="empty-state">'+icon('star')+'<h3>第一组，点亮今天。</h3><p>完成的组会出现在这里。结束训练后，它们将连入你的星图。</p></div>'}</section></div><section class="surface history"><div class="surface-heading"><h2>已完成训练</h2><span class="muted">修改后，关联数据同步更新</span></div>${completed().length?[...completed()].reverse().map(s=>`<div class="history-session"><div class="history-heading"><h3>${esc(s.date)}</h3><button class="text-button danger" data-delete-session="${esc(s.id)}">删除本次训练</button></div>${setRows(data.sets.filter(set=>set.sessionId===s.id))}</div>`).join(''):'<p class="empty">尚无完成训练。记录组数后，点击“结束并保存训练”。</p>'}</section>`;
}
function setRows(sets) { return sets.map((s,i)=>`<div class="set-row"><span class="set-order">${String(i+1).padStart(2,'0')}</span><span class="set-info">${esc(data.exercises.find(e=>e.id===s.exerciseId)?.name)}<small>RIR ${s.rir===null?'未记录':s.rir===5?'5+':s.rir}</small></span><strong>${fmt(s.weightKg)} <small>kg</small> × ${s.reps}</strong><button class="text-button" data-edit-set="${esc(s.id)}">编辑</button><button class="icon-button" data-delete-set="${esc(s.id)}" aria-label="删除第 ${i+1} 组">${icon('close')}</button></div>`).join(''); }
function bindTraining() {
  const form=document.querySelector('#record-form');
  form.addEventListener('input',()=>{const nextInput=Object.fromEntries(new FormData(form)); input=nextInput; save(data,nextInput);});
  form.querySelector('#exercise-select').addEventListener('change',()=>render());
  form.addEventListener('submit',e=>{
    e.preventDefault(); if(!data.profile.onboarded&&!data.isDemo)return openOnboard();
    const values=Object.fromEntries(new FormData(form));const next=structuredClone(data);
    let session=next.sessions.find(s=>s.status==='draft');
    if(!session){session={id:uid(),date:localDate(),status:'draft'};next.sessions.push(session);}
    const set={id:uid(),sessionId:session.id,exerciseId:values.exerciseId,weightKg:Number(values.weightKg),reps:Number(values.reps),rir:values.rir===''?null:Number(values.rir)};
    next.sets.push(set);
    if(save(next,values)){render();notify(data.isDemo?'示例组已记录，不影响个人数据':'本组已保存至训练草稿');}
  });
}
function trendsPage() { return renderTrendView(data,{...trendOptions,today:localDate()},setRows); }
function profilePage() {
  return `${renderBodyArchive(data,localDate(),bodyMethod)}<div class="profile-layout"><section class="surface"><div class="surface-heading"><h2>我的训练档案</h2><button class="text-button" data-action="onboard">${data.profile.onboarded?'修改档案':'建立档案'}</button></div><div class="profile-hero"><span class="avatar large">${esc(data.profile.nickname?.slice(0,1)||'你')}</span><h2>${esc(data.profile.nickname||'我的训练空间')}</h2>${badge(data.profile.onboarded?data.profile.goal:'尚未建档')}</div><dl class="profile-values"><div><dt>训练经验</dt><dd>${esc(data.profile.experience||'未填写')}</dd></div><div><dt>每周训练</dt><dd>${data.profile.daysPerWeek?esc(data.profile.daysPerWeek)+' 天':'未填写'}</dd></div><div><dt>器械条件</dt><dd>${esc(data.profile.equipment||'未填写')}</dd></div></dl></section><section class="surface"><div class="surface-heading"><h2>数据由你掌握</h2>${badge('当前浏览器')}</div><p class="muted">不需要实名或手机号。训练数据保存在本机，不会自动同步到其他设备。清除浏览器数据前请先导出备份。</p><div class="data-actions"><button class="soft-button" data-action="export">${icon('down')}导出训练数据</button><label class="soft-button upload-button">导入 JSON 备份<input type="file" id="import-file" accept=".json,application/json" hidden /></label>${damaged?'<button class="soft-button" data-action="export-raw">导出未读取的原始内容</button>':''}</div><div class="privacy-line"><h3>重新开始</h3><p>仅删除本应用在当前浏览器中的个人数据。</p><button class="text-button danger" data-action="clear">删除个人数据</button></div></section></div>`;
}
function openOnboard() {
  modal.innerHTML=`<div class="modal-heading"><div><p class="eyebrow">花一分钟，认识你的训练</p><h2 id="modal-title">建立你的训练坐标。</h2></div><button class="icon-button" data-close aria-label="关闭">${icon('close')}</button></div><form id="profile-form"><label class="field">昵称 <span>可选</span><input name="nickname" maxlength="20" value="${esc(data.profile.nickname||'')}" placeholder="我们怎么称呼你？" /></label><fieldset class="goal-choices"><legend>当前最想实现的目标</legend>${['增肌','提高力量','养成习惯'].map((goal,i)=>`<label><input type="radio" name="goal" value="${goal}" ${data.profile.goal===goal||(!data.profile.onboarded&&i===0)?'checked':''} required /><span>${goal}</span></label>`).join('')}</fieldset><div class="record-fields"><label class="field">训练经验 <span>可跳过</span><select name="experience">${['','刚刚开始','不到一年','一年及以上'].map(v=>`<option ${data.profile.experience===v?'selected':''} value="${v}">${v||'稍后填写'}</option>`).join('')}</select></label><label class="field">每周训练 <span>可跳过</span><select name="daysPerWeek"><option value="">稍后填写</option>${[1,2,3,4,5,6,7].map(n=>`<option value="${n}" ${Number(data.profile.daysPerWeek)===n?'selected':''}>${n} 天</option>`).join('')}</select></label></div><label class="field">器械条件 <span>可跳过</span><select name="equipment">${['','健身房','家用自由重量','其他'].map(v=>`<option value="${v}" ${data.profile.equipment===v?'selected':''}>${v||'稍后填写'}</option>`).join('')}</select></label><p class="muted small">只在当前浏览器保存。不收集实名、手机号或精确生日。</p><button type="submit" class="primary full">${data.profile.onboarded?'保存我的档案':'点亮我的训练星图'} ${icon('arrow')}</button></form>`;
  modal.showModal();
  modal.querySelector('#profile-form').addEventListener('submit',e=>{e.preventDefault();const p=Object.fromEntries(new FormData(e.target));const next=structuredClone(data);next.profile={...next.profile,...p,daysPerWeek:p.daysPerWeek?Number(p.daysPerWeek):null,onboarded:true};if(save(next)){modal.close();render();notify('档案已保存，可以开始记录训练了');}});
}
function confirmDialog(title, description, action, label='确认删除') {
  modal.innerHTML=`<div class="modal-heading"><h2 id="modal-title">${esc(title)}</h2><button class="icon-button" data-close aria-label="关闭">${icon('close')}</button></div><p class="muted">${esc(description)}</p><div class="confirm-buttons"><button class="ghost" data-close>取消</button><button class="primary" id="confirm-action">${esc(label)}</button></div>`;modal.showModal();modal.querySelector('#confirm-action').onclick=()=>{if(action()!==false)modal.close();};
}
function editSet(id) {
  const s=data.sets.find(s=>s.id===id);if(!s)return;
  modal.innerHTML=`<div class="modal-heading"><h2 id="modal-title">编辑这组训练</h2><button class="icon-button" data-close aria-label="关闭">${icon('close')}</button></div><form id="edit-form"><div class="record-fields"><label class="field">重量（kg）<input name="weightKg" type="number" min="0" step="0.1" required value="${s.weightKg}" /></label><label class="field">次数<input name="reps" type="number" min="1" step="1" required value="${s.reps}" /></label></div><label class="field">RIR<select name="rir"><option value="" ${s.rir===null?'selected':''}>未记录</option>${[0,1,2,3,4,5].map(n=>`<option value="${n}" ${s.rir===n?'selected':''}>${n===5?'5+':n}</option>`).join('')}</select></label><button type="submit" class="primary full">保存修改</button></form>`;modal.showModal();modal.querySelector('form').onsubmit=e=>{e.preventDefault();const p=Object.fromEntries(new FormData(e.target));const next=structuredClone(data);Object.assign(next.sets.find(s=>s.id===id),{weightKg:Number(p.weightKg),reps:Number(p.reps),rir:p.rir===''?null:Number(p.rir)});if(save(next)){modal.close();render();notify('记录已更新');}};
}
function download(content, name) { const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
async function importFile(e) {
  const file=e.target.files[0];if(!file)return;
  try { if(file.size>2_000_000)throw new Error();const parsed=validate(JSON.parse(await file.text()));if(parsed.isDemo)throw new Error();
    confirmDialog('替换本机训练数据？',`文件中有 ${parsed.sessions.length} 次训练、${parsed.sets.length} 组记录。此操作替换现有个人数据，建议先导出备份。`,()=>{if(save(parsed,{exerciseId:parsed.exercises[0]?.id||'bench-barbell',weightKg:'',reps:'',rir:''})){monitorDraft=null;selected='goal:'+parsed.profile.id;render();notify('备份已导入');return true;}return false;},'替换本机数据');
  }catch {notify('导入失败：文件格式、版本或记录引用不正确；不接受示例数据。原数据未改变。');} e.target.value='';
}
app.addEventListener('click',async e=>{
  const button=e.target.closest('button,a.brand');if(!button||button.disabled)return;
  if(button.matches('a.brand')){e.preventDefault();route='graph';render();return;}
  if(button.dataset.route){route=button.dataset.route;render();return;}
  if(button.dataset.node){detailOpen=true;selected=button.dataset.node;selectedLink=null;if(route==='graph')refreshGraph();return;}
  if(button.dataset.filter){filter=button.dataset.filter;render();return;}
  if(button.dataset.record){input={...input,exerciseId:button.dataset.record};route='training';render();if(!data.profile.onboarded&&!data.isDemo)openOnboard();return;}
  if(button.dataset.recordsFor){route='training';render();return;}
  if(button.dataset.editSet){editSet(button.dataset.editSet);return;}
  if(button.dataset.deleteSet){confirmDialog('删除这组记录？','删除后，关联组数与训练量将重新计算。',()=>{const next=structuredClone(data);next.sets=next.sets.filter(s=>s.id!==button.dataset.deleteSet);if(save(next)){render();return true;}return false;});return;}
  if(button.dataset.deleteSession){confirmDialog('删除本次训练？','本次训练及其所有组记录将被删除。',()=>{const next=structuredClone(data);next.sessions=next.sessions.filter(s=>s.id!==button.dataset.deleteSession);next.sets=next.sets.filter(s=>s.sessionId!==button.dataset.deleteSession);if(save(next)){render();return true;}return false;});return;}
  switch(button.dataset.action){
    case 'start':route='training';render();if(!data.profile.onboarded&&!data.isDemo)openOnboard();break;
    case 'onboard':openOnboard();break;
    case 'toggle-detail':detailOpen=!detailOpen;render();break;
    case 'list':listMode=!listMode;render();break;
    case 'zoom-in':scale=Math.min(2,scale+.15);updateTransform();break;
    case 'zoom-out':scale=Math.max(.55,scale-.15);updateTransform();break;
    case 'reset-map':scale=1;pan={x:0,y:0};positions={};try{localStorage.removeItem(LAYOUT_KEY);}catch{}refreshGraph();notify('已恢复默认星图布局');break;
    case 'back-detail':selectedLink=null;refreshGraph();break;
    case 'copy-set':{const s=[...data.sets].reverse().find(s=>s.exerciseId===input.exerciseId);if(!s)return notify('这个动作还没有上一组记录');const nextInput={exerciseId:s.exerciseId,weightKg:String(s.weightKg),reps:String(s.reps),rir:s.rir===null?'':String(s.rir)};if(save(data,nextInput)){render();notify('已复制输入，点击完成本组后才计入记录');}break;}
    case 'finish':{const next=structuredClone(data);const s=next.sessions.find(s=>s.status==='draft');if(!s||!next.sets.some(set=>set.sessionId===s.id))return; s.status='completed';if(save(next)){detailOpen=true;route='graph';selected='session:'+s.id;selectedLink=null;render();notify('训练已完成，新的轨迹已连入星图');}break;}
    case 'demo':monitorDraft=null;if(data.isDemo){data=personal;input=personalInput;personal=null;selected='muscle:胸部';selectedLink=null;render();}else{try{const sample=await(await fetch(new URL('../examples/demo.json',import.meta.url))).json();personal=data;personalInput=input;data=validate({...sample,profile:{...sample.profile,nickname:'探索者',onboarded:true},exercises:structuredClone(catalog)});selected='muscle:胸部';selectedLink=null;route='graph';render();}catch{notify('示例载入失败，请稍后重试');}}break;
    case 'export':download(JSON.stringify(data,null,2),`超薄肌-${data.isDemo?'示例':'备份'}-${localDate()}.json`);break;
    case 'export-raw':try{download(localStorage.getItem(KEY)||'null','超薄肌-原始内容.json');}catch{notify('浏览器拒绝读取本机数据');}break;
    case 'clear':if(data.isDemo)return notify('请先退出示例模式');confirmDialog('删除个人数据并重新开始？','建议先导出备份。此操作只清除超薄肌 Lab 的本机数据。',()=>{try{localStorage.removeItem(KEY);monitorDraft=null;data=blankData();input={exerciseId:'bench-barbell',weightKg:'',reps:'',rir:''};damaged=false;loadError='';selected='muscle:胸部';selectedLink=null;render();notify('个人数据已删除');return true;}catch{notify('删除失败，请检查浏览器权限');return false;}});break;
  }
});
app.addEventListener('click',e=>{if(suppressNodeClick)return;const node=e.target.closest('g[data-node]');const edge=e.target.closest('g[data-edge]');if(node){detailOpen=true;selected=node.dataset.node;selectedLink=null;refreshGraph();}else if(edge){detailOpen=true;selectedLink=graphData().links[Number(edge.dataset.edge)];refreshGraph();}});
app.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('g[data-node],g[data-edge]')){e.preventDefault();const id=e.target.dataset.node;e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));if(id)for(const n of document.querySelectorAll('g[data-node]'))if(n.dataset.node===id)n.focus({preventScroll:true});}});

app.addEventListener('change',e=>{
  const key=e.target.dataset.trendOption;
  if(['exerciseId','metric','reps','period'].includes(key)){
    trendOptions[key]=e.target.value;trendOptions.date=null;
    if(key==='exerciseId')trendOptions.reps='all';
    render();document.querySelector(`[data-trend-option="${key}"]`)?.focus({preventScroll:true});
  }
  if(e.target.matches('[data-trend-date-select]')){trendOptions.date=e.target.value;render();document.querySelector('[data-trend-date-select]')?.focus({preventScroll:true});}
});
app.addEventListener('click',e=>{
  const point=e.target.closest('[data-trend-date]');
  if(point){trendOptions.date=point.dataset.trendDate;render();document.querySelector(`[data-trend-date="${trendOptions.date}"]`)?.focus({preventScroll:true});}
  const entry=e.target.closest('[data-trend-exercise]');
  if(entry){trendOptions.exerciseId=entry.dataset.trendExercise;trendOptions.reps='all';trendOptions.date=null;route='trends';render();}
});
app.addEventListener('keydown',e=>{
  if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-trend-date]')){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}
});

modal.addEventListener('click',e=>{if(e.target.closest('[data-close]'))modal.close();});
window.addEventListener('storage',e=>{if(e.key===KEY)notify('数据已在另一个窗口更改，请刷新后继续，避免覆盖。');});
render();





function bindCare(){
 const form=document.querySelector('#care-form');
 const capture=()=>{careState={...Object.fromEntries(new FormData(form)),submitted:false};};
 const update=()=>{document.querySelector('#care-result').innerHTML=renderCareResult(careState);};
 form.addEventListener('change',()=>{capture(); if(['emergency','neuro','urgent'].includes(careState.signal))careState.submitted=true;update();});
 form.addEventListener('submit',e=>{e.preventDefault();capture();careState.submitted=true;update();document.querySelector('#care-result').focus({preventScroll:true});});
 form.addEventListener('reset',e=>{e.preventDefault();careState={exercise:'',region:'',timing:'',feel:'',signal:'',submitted:false};render();document.querySelector('#care-form select').focus();});
 document.querySelector('#care-search').addEventListener('input',e=>{document.querySelector('#care-library-items').innerHTML=renderCareLibrary(e.target.value);});
}
app.addEventListener('click',e=>{
 const entry=e.target.closest('[data-care-node],[data-care-exercise]');if(!entry)return;
 let exercise=entry.dataset.careExercise||'',group='';
 const id=entry.dataset.careNode;
 if(id?.startsWith('exercise:'))exercise=id.slice(9);
 if(id?.startsWith('muscle:'))group=id.slice(7);
 if(id?.startsWith('anatomy:'))group=anatomy.find(a=>a.id===id)?.parent||'';
 // An exercise is context only: user must select their actual symptom location.
 careState={exercise,region:topicForGroup(group),timing:'',feel:'',signal:'',submitted:false};
 route='care';render();document.querySelector('#care-form select[name=region]').focus({preventScroll:true});
});

function bindMonitor(){
 const form=document.querySelector('#monitor-form');
 const loadDate=date=>{const m=(data.monitoring||[]).find(m=>m.date===date);for(const key of ['date','weightKg','fatPercent','method','fatigue','muscle','soreness'])form.elements[key].value=key==='date'?date:m?.[key]??'';monitorDraft=Object.fromEntries(new FormData(form));};
 if(monitorDraft){for(const [key,value] of Object.entries(monitorDraft))if(form.elements[key])form.elements[key].value=value;}else loadDate(localDate());
 // Restore today's existing record when no draft exists.
 if(!monitorDraft)loadDate(localDate());
 form.addEventListener('input',()=>{monitorDraft=Object.fromEntries(new FormData(form));});
 form.elements.date.addEventListener('change',()=>loadDate(form.elements.date.value));
 form.addEventListener('submit',e=>{
   e.preventDefault();const v=Object.fromEntries(new FormData(form)),error=document.querySelector('#monitor-error');
   const num=key=>v[key]===''?null:Number(v[key]);
   if(v.date>localDate()){error.textContent='不能保存未来日期的实测记录。';return;}
   if(v.fatPercent!==''&&!v.method.trim()){error.textContent='填写体脂率时，请注明测量方法和设备。';return;}
   if(v.soreness!==''&&!v.muscle){error.textContent='填写局部酸痛时，请选择对应肌群。';return;}
   if(['weightKg','fatPercent','fatigue','soreness'].every(k=>v[k]==='')){error.textContent='请至少填写一项实测值或主观感受。';return;}
   const next=structuredClone(data),old=(next.monitoring||[]).find(m=>m.date===v.date);
   const m={...old,id:old?.id||uid(),date:v.date,weightKg:num('weightKg'),fatPercent:num('fatPercent'),method:v.method.trim(),fatigue:num('fatigue'),muscle:v.muscle,soreness:num('soreness')};
   next.monitoring=[...(next.monitoring||[]).filter(r=>r.date!==v.date),m];
   if(hasBody(m)&&!next.profile.bodyCycleStart)next.profile.bodyCycleStart=next.monitoring.filter(hasBody).map(r=>r.date).sort()[0];
   if(save(next)){monitorDraft=null;render();notify(data.isDemo?'示例记录已更新，不影响个人数据':'当天记录已保存，趋势已重新计算');}
 });
}
app.addEventListener('change',e=>{const key=e.target.dataset.forecast;if(!['metric','horizon','exercise','reps','rir','method'].includes(key))return;const value=e.target.value;if(['reps','horizon','rir'].includes(key)&&(!Number.isInteger(Number(value))||Number(value)<(key==='rir'?0:1)))return;forecastOptions[key]=value;render();document.querySelector(`[data-forecast="${key}"]`)?.focus({preventScroll:true});});
app.addEventListener('click',e=>{
 const edit=e.target.closest('[data-monitor-edit]');if(edit){const m=data.monitoring.find(m=>m.date===edit.dataset.monitorEdit);monitorDraft=Object.fromEntries(['date','weightKg','fatPercent','method','fatigue','muscle','soreness'].map(k=>[k,m[k]??'']));render();document.querySelector('#monitor-form').scrollIntoView({block:'center'});return;}
 const del=e.target.closest('[data-monitor-delete]');if(del)confirmDialog('删除这条身体与恢复记录？','对应实测曲线和趋势外推会重新计算，训练组记录保留。',()=>{const next=structuredClone(data);next.monitoring=(next.monitoring||[]).filter(m=>m.id!==del.dataset.monitorDelete);if(save(next)){monitorDraft=null;render();return true;}return false;});
});

function openBody(date=localDate()){
 const existing=(data.monitoring||[]).find(m=>m.date===date);
 modal.innerHTML=`<div class="modal-heading"><div><p class="eyebrow">个人身体档案 · 两周更新</p><h2 id="modal-title">记录本次实测。</h2></div><button class="icon-button" data-close aria-label="关闭">${icon('close')}</button></div><form id="body-form"><label class="field">实际测量日期<input name="date" type="date" max="${localDate()}" value="${date}" required></label><div class="record-fields"><label class="field">体重（kg）<input name="weightKg" type="number" min="1" max="500" step=".1" value="${existing?.weightKg??''}"></label><label class="field">体脂率（%）<input name="fatPercent" type="number" min="1" max="75" step=".1" value="${existing?.fatPercent??''}"></label></div><label class="field">体脂测量方法 / 设备<input name="method" maxlength="60" value="${esc(existing?.method||'')}" placeholder="例如：家中 A 体脂秤"></label><label class="field">腰围（cm，可选）<input name="waistCm" type="number" min="10" max="300" step=".1" value="${existing?.waistCm??''}"></label><p class="muted small">至少填写一项身体实测值。尽量使用同一设备和相似测量条件；日期已有数据时会载入，保存更新该日期，其他日期保留。</p><p id="body-error" role="alert" class="danger"></p><button class="primary full" type="submit">保存到个人档案</button></form>`;
 modal.showModal();const form=modal.querySelector('#body-form');
 form.elements.date.addEventListener('change',()=>{const row=(data.monitoring||[]).find(m=>m.date===form.elements.date.value);for(const k of ['weightKg','fatPercent','method','waistCm'])form.elements[k].value=row?.[k]??'';});
 form.addEventListener('submit',e=>{e.preventDefault();const v=Object.fromEntries(new FormData(form)),err=modal.querySelector('#body-error');
 if(v.date>localDate()){err.textContent='请选择今天或更早的实测日期。';return;}
 if(['weightKg','fatPercent','waistCm'].every(k=>v[k]==='')){err.textContent='至少填写体重、体脂率或腰围中的一项。';return;}
 if(v.fatPercent!==''&&!v.method.trim()){err.textContent='请填写体脂测量方法 / 设备。';return;}
 const next=structuredClone(data),old=(next.monitoring||[]).find(m=>m.date===v.date),num=k=>v[k]===''?null:Number(v[k]);
 const row={id:old?.id||uid(),date:v.date,fatigue:old?.fatigue??null,soreness:old?.soreness??null,muscle:old?.muscle||'',weightKg:num('weightKg'),fatPercent:num('fatPercent'),waistCm:num('waistCm'),method:v.method.trim()};
 next.monitoring=[...(next.monitoring||[]).filter(m=>m.date!==v.date),row];
 if(!next.profile.bodyCycleStart)next.profile.bodyCycleStart=next.monitoring.filter(hasBody).map(m=>m.date).sort()[0];
 if(save(next)){monitorDraft=null;modal.close();render();notify(data.isDemo?'示例档案已更新，不影响个人数据':'已存入个人档案，周期曲线已更新');}
 });
}
app.addEventListener('change',e=>{if(e.target.id==='body-method'){bodyMethod=e.target.value;render();document.querySelector('#body-method')?.focus({preventScroll:true});}});
app.addEventListener('click',e=>{
 if(e.target.closest('[data-body-open]')){openBody();return;}
 const edit=e.target.closest('[data-body-edit]');if(edit){openBody(edit.dataset.bodyEdit);return;}
 const del=e.target.closest('[data-body-delete]');if(del)confirmDialog('删除这次身体实测？','体重、体脂、腰围会从档案和曲线中移除；同日疲劳与训练记录保留，周期起点不变。',()=>{const next=structuredClone(data),m=next.monitoring.find(m=>m.id===del.dataset.bodyDelete);Object.assign(m,{weightKg:null,fatPercent:null,waistCm:null,method:''});if(m.fatigue===null&&m.soreness===null)next.monitoring=next.monitoring.filter(row=>row.id!==m.id);if(save(next)){monitorDraft=null;render();return true;}return false;});
});
