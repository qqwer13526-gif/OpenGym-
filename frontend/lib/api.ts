// Analysis contract: enable only after the backend team implements API_CONTRACT.md.
export type AnalysisJob = {job_id:string;status:'queued'|'processing'|'completed'|'failed';progress?:number;error?:{code:string;message:string};result?:AnalysisResult};
export type AnalysisResult = {overlay_video_url:string|null;analyzed_frames:number;valid_frames:number;samples:{time_seconds:number;left_elbow_degrees:number|null;right_elbow_degrees:number|null}[];warnings:string[];quality_score:number|null};
export type Health = {status:'ok';service?:string;day?:number;analysis_mode?:string};
export class ApiError extends Error { constructor(message:string,public kind:'timeout'|'network'|'http'|'format'){super(message);this.name='ApiError'} }
export const API_BASE=(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/,'');
export function parseHealth(value:unknown):Health {
 if (!value || typeof value!=='object' || !('status' in value) || value.status!=='ok') throw new ApiError('后端响应格式不符合健康检查约定。','format');
 return value as Health;
}
export async function requestJson(path:string,options:{timeoutMs?:number;signal?:AbortSignal;method?:'GET'|'POST';body?:FormData}={}):Promise<unknown>{
 const controller=new AbortController(); let timedOut=false;
 const abort=()=>controller.abort(); options.signal?.addEventListener('abort',abort,{once:true});
 if(options.signal?.aborted)controller.abort();
 const timer=setTimeout(()=>{timedOut=true;controller.abort()},options.timeoutMs??5000);
 try{
  const res=await fetch(API_BASE+path,{signal:controller.signal,cache:'no-store',method:options.method??'GET',body:options.body});
  if(!res.ok)throw new ApiError(`服务返回 HTTP ${res.status}，请稍后重试。`,'http');
  try{return await res.json()}catch{if(controller.signal.aborted)throw new ApiError(timedOut?'连接超时，请确认后端已启动后重试。':'请求已取消。',timedOut?'timeout':'network');throw new ApiError('服务未返回有效 JSON。','format')}
 }catch(error){
  if(error instanceof ApiError)throw error;
  if(timedOut)throw new ApiError('连接超时，请确认后端已启动后重试。','timeout');
  throw new ApiError('无法连接后端，请检查服务地址与网络。','network');
 }finally{clearTimeout(timer);options.signal?.removeEventListener('abort',abort)}
}
export async function getHealth(signal?:AbortSignal){return parseHealth(await requestJson('/health',{signal}))}
