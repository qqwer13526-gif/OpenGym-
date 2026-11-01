# Day 1 验证记录

日期：2026-10-30，北京时间。范围：环境、基础网站、API、卧推姿态最小测试。

## 已完成
- Next.js 16.4.3 + React 19.3.1 + Tailwind 4.3.3 深色工作台已完成，四个模块入口、视频本地预览入口、真实 API 状态。
- 前端生产构建及 TypeScript 检查通过；http://127.0.0.1:3000 实测 HTTP 200。
- 桌面浏览器截图目视检查通过；后端连接显示成功；规划说明弹窗打开/关闭检查通过。
- 移动端样式已实现但未做实际视口测试；未选择真实视频测试预览。
- 初始目录为空；已新建 AGENTS.md、SPEC.md、PROMPTS.md，均明确来源是用户要求的整理。
- 读取用户提供的《赛题说明.md》，选定赛道二；复制原文作为依据。
- FastAPI /health、/api/features 与 /docs 已实现；后端实际启动成功。
- 健康接口 HTTP 200，文档 HTTP 200，前端来源 CORS 检查通过。
- 4 项 pytest 测试通过：接口、角度几何、置信度及非有限值过滤、缺视频不生成报告。
- Python 脚本语法检查通过；缺视频命令以预期退出码 2 退出。
- YOLO-Pose 视频程序提供逐帧推理、单人帧筛选、肘角与置信度过滤、JSON 输出。
- 五天进度追踪已建立；只执行 Day 1。

## 环境
- Windows 11；Python 3.12.14（项目 .venv）。
- 系统物理内存 16,873,545,728 字节，约 15.7 GiB。
- NVIDIA GeForce RTX 5060 Laptop GPU，8151 MiB 显存；驱动 596.11。
- nvidia-smi 显示 CUDA 13.2 是驱动能力，不代表 PyTorch CUDA 已通过。
- 原环境未安装 torch。首次默认索引解析到非 CUDA 包，已中止并改为 CUDA 12.8 明确版本。
- PyTorch 2.10.0+cu128、torchvision 0.25.0+cu128、Ultralytics 8.4.193 已安装。官方 torch wheel SHA256 校验通过。GPU 与模型运行结果见末尾补充。

## 限制与问题
- 无真实卧推视频，因此未验证动作识别可靠性、评分、计数或训练效果。
- 单元测试使用数学坐标，明确不是推理结果；空白图模型测试也不代表真实卧推验证。
- 2D 姿态存在视角与遮挡限制，Day 1 不输出质量分数或医疗结论。
- 教学库、训练计划、热量估算为后续开发入口，尚未完成。
- 钉钉读取失败：两次窗口归属校验错误。当前赛题依据仅为用户提供的本地说明文件。
- 缺《提交材料说明.md》、官方截止时间与评分细则，尚不能核验四份材料要求。
- 用户坚持 Codex / ChatGPT 开发；与赛事 WorkBuddy 条款存在冲突，已告知，不伪造工具来源。
- pytest 有 1 条 Starlette 关于 httpx TestClient 的弃用警告，不影响本轮测试。

## 下一阶段（尚未开始）
1. 提供获授权、脱敏、单人侧面的短卧推视频，运行真实测试并人工对照关键点。
2. 基于效果决定阈值、摄像要求及无法可靠判断时的反馈，再接视频上传与任务结果接口。
3. 补齐竞赛提交说明；用户明确授权后进入 Day 2，不自动扩展五天全部功能。

技术依据：https://docs.ultralytics.com/tasks/pose/ 与 https://pytorch.org/get-started/locally/。

## GPU 最终实测
- torch 2.10.0+cu128，运行时 CUDA 12.8。
- torch.cuda.is_available() = true。
- 设备能力 sm_120（12.0），设备名称 RTX 5060 Laptop GPU。
- 256×256 GPU 矩阵乘法并同步后逐值校验通过。
- 原始结果保存在 reports/environment.json。

## 模型最终实测与交付
- YOLO11n-Pose 官方权重已下载，使用 device=0 完成 640×640 合成空白图推理，检测到 0 人，运行通过。
- 此测试只验证模型通路，不是卧推识别效果评测；详见 model-smoke.json 和 model-smoke.log。
- pip check 通过，未发现依赖冲突；实际依赖已锁定到 backend/requirements-lock.txt。
- 前端：http://127.0.0.1:3000；后端文档：http://127.0.0.1:8000/docs。两个本地服务保留运行。
- 重启电脑或服务停止后，分别运行 frontend/start.ps1 和 scripts/start-backend.ps1。
- Day 1 基础验收完成；Day 2–5 尚未实施。接下来优先提供真实视频和提交材料说明。
