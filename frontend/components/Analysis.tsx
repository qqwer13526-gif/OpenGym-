'use client';
import {useEffect,useRef,useState} from 'react';
import {Upload,Focus,Check} from 'lucide-react';
import {validateVideo,validateDuration} from '../lib/validation';
import {ANALYSIS_ENABLED,submitAnalysis,getAnalysis,chartPaths,videoUrl} from '../lib/analysis';
import type {AnalysisJob,AnalysisResult} from '../lib/api';

export default function Analysis(){
 const [file,setFile]=useState<File|null>(null),[url,setUrl]=useState(''),[error,setError]=useState(''),[ready,setReady]=useState(false),[drag,setDrag]=useState(false);
 const [phase,setPhase]=useState('idle'),[job,setJob]=useState<AnalysisJob|null>(null),[overlayError,setOverlayError]=useState(false);
 const input=useRef<HTMLInputElement>(null), run=useRef<AbortController|null>(null), generation=useRef(0);
 const busy=['uploading','queued','processing'].includes(phase);
 useEffect(()=>{if(!file){setUrl('');return}const u=URL.createObjectURL(file);setUrl(u);return()=>URL.revokeObjectURL(u)},[file]);
 useEffect(()=>()=>{generation.current++;run.current?.abort()},[]);
 function stop(){generation.current++;run.current?.abort();setPhase('stopped')}
 function choose(f?:File){generation.current++;run.current?.abort();setJob(null);setPhase('idle');setReady(false);setOverlayError(false);const problem=f?validateVideo(f):null;setError(problem||'');setFile(problem?null:f??null);if(input.current)input.current.value=''}
 async function start(){
  if(!file||!ready||!ANALYSIS_ENABLED||busy)return;
  const id=++generation.current;run.current?.abort();const controller=new AbortController();run.current=controller;
  setError('');setJob(null);setOverlayError(false);setPhase('uploading');
  try{
   let current=await submitAnalysis(file,controller.signal);const deadline=Date.now()+10*60*1000;
   while(id===generation.current&&!controller.signal.aborted){
    setJob(current);setPhase(current.status);
    if(current.status==='completed')return;
    if(current.status==='failed')throw new Error(current.error!.message);
    if(Date.now()>deadline)throw new Error('等待分析超过 10 分钟，请联系后端成员查看任务。服务端任务可能仍在运行。');
    await new Promise<void>(resolve=>{const finish=()=>{clearTimeout(timer);controller.signal.removeEventListener('abort',finish);resolve()};const timer=setTimeout(finish,1500);controller.signal.addEventListener('abort',finish,{once:true})});
    if(controller.signal.aborted||id!==generation.current)return;
    current=await getAnalysis(current.job_id,controller.signal);
   }
  }catch(e){if(id===generation.current&&!controller.signal.aborted){setError(e instanceof Error?e.message:'分析失败');setPhase('failed')}}
 }
 const labels:Record<string,string>={idle:'等待视频',uploading:'正在上传视频',queued:'任务已排队',processing:'模型正在分析',completed:'分析完成',failed:'分析未完成',stopped:'已停止等待'};
 const result=phase==='completed'?job?.result:null;
 return <><div className="analysis-banner"><span className="tiny-label">DAY 03 / ANALYSIS WORKSPACE</span><p>{ANALYSIS_ENABLED?'真实接口模式 · 点击开始后，视频将发送至配置的后端。':'接口待接入 · 可先预览视频，接入后即可完成上传与结果展示。'}</p></div><div className="analysis-grid"><section className="panel"><div className="panel-head"><div><span className="tiny-label">01 / INPUT</span><h3>准备卧推视频</h3></div><span className="badge">{ready?'已就绪':'本地预览'}</span></div>
 <input ref={input} type="file" hidden accept="video/*,.mkv" aria-label="选择卧推视频" onChange={e=>choose(e.target.files?.[0])}/>
 {!file?<button className={'dropzone '+(drag?'drag-active':'')} onClick={()=>input.current?.click()} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);choose(e.dataTransfer.files[0])}}><Upload size={32}/><strong>拖入视频，或点击选择</strong><p>单人侧面拍摄，完整露出肩、肘、腕</p><small>MP4 / MOV / AVI / WebM / MKV</small></button>:<div className="video-box">{url&&<video key={url} src={url} controls preload="metadata" onLoadedMetadata={e=>{const problem=validateDuration(e.currentTarget.duration);setError(problem||'');setReady(!problem)}} onError={()=>{setError('浏览器无法解码视频，请改用 H.264 MP4。');setReady(false)}}/>}<p className="video-name">{file.name} · {(file.size/1024/1024).toFixed(1)} MiB</p><div className="button-row"><button className="outline-button" onClick={()=>input.current?.click()}>更换视频</button><button className="outline-button" onClick={()=>choose()}>移除视频</button></div></div>}
 {ready&&<p className="success-note"><Check size={15}/>输入检查通过</p>}<p className="muted limit-note">最大 100 MiB，最长 120 秒。建议先使用 10–20 秒视频验证识别效果。</p>
 <button className="primary-button full-width" disabled={!ready||busy||!ANALYSIS_ENABLED} onClick={start}>{busy?'正在分析…':!ANALYSIS_ENABLED?'等待后端接口接入':phase==='failed'?'重新提交分析':'开始真实分析'}</button>
 <div className="job-status" role="status" aria-live="polite"><strong>{labels[phase]}</strong>{job&&<small>任务 {job.job_id}</small>}{busy&&job?.progress!==undefined&&<><progress max={100} value={job.progress}/><small>后端报告进度 {job.progress}%</small></>}{busy&&job?.progress===undefined&&<small>等待服务返回，不估算进度百分比。</small>}{phase==='stopped'&&<small>只停止浏览器等待；服务端任务可能仍在运行。</small>}</div>
 {busy&&<button className="outline-button" onClick={stop}>停止等待</button>}{error&&<p className="field-error" role="alert">{error}</p>}
 </section><section className="panel"><div className="panel-head"><div><span className="tiny-label">02 / REAL RESULTS</span><h3>动作分析报告</h3></div><span className="badge">{result?'真实接口返回':'等待真实数据'}</span></div>
 {!result?<div className="result-empty"><Focus size={40}/><h4>{busy?'正在等待分析报告':'还没有分析结果'}</h4><p>骨骼视频、有效帧与角度曲线将由后端真实分析结果填充。</p><div className="result-skeleton"><div>骨骼叠加视频<span>—</span></div><div>肘关节角度趋势<span>—</span></div><div>可解释分析提示<span>—</span></div></div></div>:<>
 <div className="result-metrics"><div><span>分析帧数</span><strong>{result.analyzed_frames}</strong></div><div><span>有效姿态帧</span><strong>{result.valid_frames}</strong></div><div><span>有效帧覆盖率</span><strong>{result.analyzed_frames?`${(result.valid_frames/result.analyzed_frames*100).toFixed(1)}%`:'—'}</strong></div></div>
 {result.valid_frames===0&&<p className="field-error">没有有效姿态帧，无法可靠评估。请检查拍摄角度、遮挡及人物完整性。</p>}
 {result.overlay_video_url?<><video className="overlay-video" controls src={videoUrl(result.overlay_video_url)} onError={()=>setOverlayError(true)}/>{overlayError&&<p role="alert" className="field-error">骨骼视频无法播放，请后端检查视频地址、编码与访问权限。</p>}</>:<p className="muted">后端未返回骨骼叠加视频。</p>}
 <AngleChart result={result}/><h4>分析提示</h4>{result.warnings.length?<ul className="analysis-warnings">{result.warnings.map((w,i)=><li key={i}>{w}</li>)}</ul>:<p className="muted">后端未提供提示；不代表动作没有问题。</p>}
 <p className="muted limit-note">当前仅展示可观测指标，不展示尚未校准的质量分数，也不根据缺失关键点推断动作安全性。</p></>}
 </section></div></>;
}
function AngleChart({result}:{result:AnalysisResult}){
 const available=result.samples.some(s=>s.left_elbow_degrees!==null||s.right_elbow_degrees!==null);
 return <section className="angle-chart"><h4>肘关节角度趋势 <small>单位 ° / 秒</small></h4>{available?<><svg viewBox="0 0 660 230" role="img" aria-label="左、右肘关节角度随时间变化曲线，缺失数据处断开">{[0,90,180].map(v=><g key={v}><line x1="40" x2="640" y1={200-v} y2={200-v} stroke="#334039"/><text x="0" y={204-v}>{v}°</text></g>)}<path d={chartPaths(result.samples,'left_elbow_degrees')} stroke="#b7f65d" strokeWidth="2" fill="none"/><path d={chartPaths(result.samples,'right_elbow_degrees')} stroke="#62c6ef" strokeWidth="2" fill="none"/><text x="40" y="224">0 s</text><text x="580" y="224">{result.samples.at(-1)?.time_seconds.toFixed(1)} s</text></svg><p className="muted">浅绿：左肘 · 蓝色：右肘 · 缺失关键点处不连线</p><details><summary>查看原始角度数据（{result.samples.length} 条）</summary><div className="sample-table"><table><thead><tr><th>时间（秒）</th><th>左肘（°）</th><th>右肘（°）</th></tr></thead><tbody>{result.samples.map((s,i)=><tr key={i}><td>{s.time_seconds.toFixed(2)}</td><td>{s.left_elbow_degrees?.toFixed(1)??'缺失'}</td><td>{s.right_elbow_degrees?.toFixed(1)??'缺失'}</td></tr>)}</tbody></table></div></details></>:<p className="muted">没有可用角度数据，不生成曲线。</p>}</section>;
}
