# FitPilot AI 前后端接口草案 v0.1

更新：2026-10-31。状态：**待后端队友确认**。此文件是提案，不代表接口已实现或双方已经确认。

## 已有服务
- 本地前端 http://127.0.0.1:3000；后端 http://127.0.0.1:8000。
- GET /health 返回 status=ok、service、day、analysis_mode=local_cli。
- GET /api/features 返回模块开发状态。
- 现有后端只允许 GET 跨域请求；真实上传接入时后端需允许约定来源的 POST 和 OPTIONS。

## 拟议分析接口
建议异步任务，避免长视频阻塞请求。

| 方法和路径 | 输入 | 输出 |
|---|---|---|
| POST /api/analyses | multipart/form-data，字段 video；exercise=bench_press | HTTP 202，job_id、status=queued |
| GET /api/analyses/{job_id} | 任务编号 | queued / processing / completed / failed；结果或错误 |

前端不应自行设置 multipart Content-Type，浏览器负责 boundary。仅在双方确认并完成后端后启用真实上传。

### 结果字段提案
```json
{
  "job_id": "opaque-id",
  "status": "completed",
  "result": {
    "overlay_video_url": "/media/job-id/overlay.mp4",
    "analyzed_frames": 300,
    "valid_frames": 210,
    "samples": [{"time_seconds": 0.0, "left_elbow_degrees": null, "right_elbow_degrees": null}],
    "warnings": ["部分帧关键点不可见"],
    "quality_score": null
  }
}
```
上面数字仅用于解释协议形状，禁止当作界面分析结果。实际返回必须来自真实视频。

- 时间单位秒；角度单位度。关键点不足用 null，不用 0 或插入随机值。
- 有效覆盖率按 valid_frames/analyzed_frames 计算；零帧不计算比例。
- 未校准的评分为 null。无有效关节时提供可解释原因，不输出优秀/危险等判断。
- 进度百分比可选，只有后端能真实计算时提供；否则前端只显示状态。
- 叠加视频应为浏览器支持的编码（需双方测试），支持播放及必要的 Range 请求；不可返回服务器本地磁盘路径。
- 相对视频地址基于后端地址解析；上传文件名不能用于任意文件路径。

### 错误格式提案
```json
{"error":{"code":"VIDEO_UNREADABLE","message":"无法解码视频，请转换后重试"}}
```
至少区分 413 过大、415 格式不支持、422 无法解码、404 任务不存在、503 服务繁忙以及网络不可达。关键点不足可以是已完成任务的不足提示，不能伪装成正常评分。

## 文件限制（暂定）
- 前端原型采用 100 MiB、最长 120 秒；建议测试片段 10–20 秒。
- 格式和浏览器播放能力要分别校验，扩展名正确并不代表能够解码。
- 后端必须独立校验真实文件内容、尺寸与时长，不能信任浏览器校验。
- 实际格式、大小、时长、并发、结果保存期限，由队友确认后同步调整。

## 其他模块
教学库、训练计划和热量的业务接口尚未约定。Day 2 前端只提供页面与表单草稿，不伪造后端生成内容。

## 联调确认清单
- [ ] 后端队友确认路径、字段和状态名称。
- [ ] 确认文件限制、编码及跨域配置。
- [ ] 两段真实视频分别完成分析，结果来源可追踪。
- [ ] 测试关键点不足、坏视频、服务离线和任务失败。
- [ ] Day 3 首次联调，Day 4 全流程演练，Day 5 重启复现验收。

## Day 3 前端接入说明（2026-11-01）
前端已实现此草案，后端实现仍需队友确认；未改动 backend/。

1. 在 frontend/.env.local 配置以下内容（参照 .env.example）：
   NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
   NEXT_PUBLIC_ANALYSIS_ENABLED=true
   NEXT_PUBLIC_ANALYSIS_PATH=/api/analyses
2. 重启开发服务；生产模式必须重新 build 再 start。NEXT_PUBLIC 变量会编入浏览器代码，不得填入密钥。
3. POST 上述路径接收 multipart 的 video 和 exercise=bench_press，返回 job_id/status；GET 路径/{job_id} 查询状态。状态和字段遵照本文原约定。
4. progress 为可选 0–100 的真实百分比，未知时省略；前端每 1.5 秒查询，上传超时 120 秒，查询超时 15 秒，等待任务上限 10 分钟。
5. completed 必须返回完整 result，缺失关键点用 null；samples 时间须非负且有序、角度 0–180°；有效帧不得超过总帧。quality_score 保留协议字段但本阶段不展示未经校准的分数。
6. 骨骼视频 URL 使用 HTTP(S) 绝对地址或相对 API_BASE 的路径，支持浏览器播放与 Range 请求。CORS 允许前端真实来源以及 GET/POST/OPTIONS。
7. “停止等待”只中止浏览器请求和轮询，不承诺取消服务端计算。重新提交会创建新任务；没有实现恢复查询或服务端取消接口。
8. 没有接口时保持 ANALYSIS_ENABLED=false。健康检查在线不等于分析接口可用。

联调验收（待双方使用真实视频执行）：成功上传并返回真实曲线/视频；低质量关键点返回警告或空数据；验证 413/415/422/404/503、跨域、网络中断和视频编码；确认更换视频后旧任务结果不覆盖新任务。合成契约测试不能代替这些验收。
