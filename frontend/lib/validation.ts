export const VIDEO_LIMITS = {bytes: 100 * 1024 * 1024, seconds: 120} as const;
export const VIDEO_EXTENSIONS = ['mp4','mov','avi','webm','mkv'];
export function validateVideo(file: {name:string;size:number}): string | null {
 if (file.size <= 0) return '视频文件为空，请重新选择。';
 if (!VIDEO_EXTENSIONS.includes(file.name.split('.').pop()?.toLowerCase() || '')) return '暂不支持此格式，请选择 MP4、MOV、AVI、WebM 或 MKV。';
 if (file.size > VIDEO_LIMITS.bytes) return '视频超过 100 MiB，请裁剪或压缩后再试。';
 return null;
}
export function validateDuration(seconds:number):string|null {
 if (!Number.isFinite(seconds) || seconds <= 0) return '无法读取有效的视频时长，请更换视频或转为 MP4。';
 return seconds > VIDEO_LIMITS.seconds ? '视频超过 120 秒，请先裁剪到两分钟以内。' : null;
}
export type PlanInput={goal:string;level:string;days:string;minutes:string;equipment:string};
export function validatePlan(v:PlanInput):Record<string,string> {
 const e:Record<string,string>={};
 if (!['建立习惯','提升力量','改善体能'].includes(v.goal)) e.goal='请选择训练目标。';
 if (!['刚开始训练','已有训练经验'].includes(v.level)) e.level='请选择训练经验。';
 const days=Number(v.days), minutes=Number(v.minutes);
 if (!v.days || !Number.isInteger(days) || days<1 || days>7) e.days='每周训练天数须为 1–7 的整数。';
 if (!v.minutes || !Number.isInteger(minutes) || minutes<10 || minutes>120) e.minutes='每次时长须为 10–120 分钟的整数。';
 if (!['徒手','哑铃','健身房'].includes(v.equipment)) e.equipment='请选择可用器械。';
 return e;
}
export type CalorieInput={activity:string;weight:string;minutes:string};
export function validateCalories(v:CalorieInput):Record<string,string>{
 const e:Record<string,string>={};
 if (!['步行','跑步','力量训练'].includes(v.activity)) e.activity='请选择活动类型。';
 const weight=Number(v.weight), minutes=Number(v.minutes);
 if (!v.weight || !Number.isFinite(weight) || weight<20 || weight>300) e.weight='体重须为 20–300 千克。';
 if (!v.minutes || !Number.isFinite(minutes) || minutes<1 || minutes>300) e.minutes='运动时长须为 1–300 分钟。';
 return e;
}
