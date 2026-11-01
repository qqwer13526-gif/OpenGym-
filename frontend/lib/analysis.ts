import {API_BASE, ApiError, requestJson, type AnalysisJob, type AnalysisResult} from './api.ts';

export const ANALYSIS_ENABLED = process.env.NEXT_PUBLIC_ANALYSIS_ENABLED === 'true';
export const ANALYSIS_PATH = process.env.NEXT_PUBLIC_ANALYSIS_PATH || '/api/analyses';
const invalid = () => new ApiError('分析接口响应不符合约定，请联系后端成员核对 API_CONTRACT.md。', 'format');
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export function videoUrl(value: string): string {
  const url = new URL(value, API_BASE + '/');
  if (!['http:', 'https:'].includes(url.protocol)) throw invalid();
  return url.href;
}
export function parseResult(value: unknown): AnalysisResult {
  if (!value || typeof value !== 'object') throw invalid();
  const r = value as AnalysisResult;
  if (!Number.isInteger(r.analyzed_frames) || r.analyzed_frames < 0 || !Number.isInteger(r.valid_frames) || r.valid_frames < 0 || r.valid_frames > r.analyzed_frames) throw invalid();
  if (r.overlay_video_url !== null && (typeof r.overlay_video_url !== 'string' || !r.overlay_video_url.trim())) throw invalid();
  if (r.overlay_video_url) videoUrl(r.overlay_video_url);
  if (!Array.isArray(r.warnings) || !r.warnings.every(w => typeof w === 'string') || !Array.isArray(r.samples)) throw invalid();
  let previous = -1;
  for (const s of r.samples) {
    if (!s || !finite(s.time_seconds) || s.time_seconds < 0 || s.time_seconds < previous) throw invalid();
    for (const angle of [s.left_elbow_degrees, s.right_elbow_degrees]) if (angle !== null && (!finite(angle) || angle < 0 || angle > 180)) throw invalid();
    previous = s.time_seconds;
  }
  if (r.quality_score !== null && (!finite(r.quality_score) || r.quality_score < 0 || r.quality_score > 100)) throw invalid();
  return r;
}
export function parseJob(value: unknown, expectedId?: string): AnalysisJob {
  if (!value || typeof value !== 'object') throw invalid();
  const job = value as AnalysisJob;
  if (typeof job.job_id !== 'string' || !job.job_id.trim() || (expectedId && job.job_id !== expectedId) || !['queued','processing','completed','failed'].includes(job.status)) throw invalid();
  if (job.progress !== undefined && (!finite(job.progress) || job.progress < 0 || job.progress > 100)) throw invalid();
  if (job.status === 'completed') parseResult(job.result);
  if (job.status === 'failed' && (!job.error || typeof job.error.code !== 'string' || typeof job.error.message !== 'string')) throw invalid();
  return job;
}
export async function submitAnalysis(file: File, signal: AbortSignal) {
  const body = new FormData(); body.append('video', file); body.append('exercise', 'bench_press');
  return parseJob(await requestJson(ANALYSIS_PATH, {method:'POST', body, signal, timeoutMs:120000}));
}
export async function getAnalysis(id: string, signal: AbortSignal) {
  return parseJob(await requestJson(`${ANALYSIS_PATH}/${encodeURIComponent(id)}`, {signal, timeoutMs:15000}), id);
}
export function chartPaths(samples: AnalysisResult['samples'], key: 'left_elbow_degrees'|'right_elbow_degrees'): string {
  const end = Math.max(1, samples.at(-1)?.time_seconds ?? 1);
  let connected = false;
  return samples.map(s => {
    const angle = s[key];
    if (angle === null) { connected = false; return ''; }
    const command = connected ? 'L' : 'M'; connected = true;
    return `${command}${(40+s.time_seconds/end*600).toFixed(2)},${(200-angle).toFixed(2)}`;
  }).join(' ');
}
