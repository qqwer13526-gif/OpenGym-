# FitPilot AI

温医大黑客松赛道二「健康管理与身心关怀」的本地原型。当前已完成前端 Day 3 的分析接口准备；真实后端与视频联调待验收。完整协作基线见 TEAM_HANDOFF.md，Day 1 的后端与 GPU 验证记录保留。

## 运行
在项目根目录打开 PowerShell。

后端（窗口保持打开）：
```powershell
./scripts/start-backend.ps1
```
打开 http://127.0.0.1:8000/docs 查看接口。

前端：按 frontend/README.md 的说明安装并启动，打开 http://127.0.0.1:3000。

## 环境重建
需要 Python 3.12、Node.js 20.9+。首次创建环境：
```powershell
python -m venv .venv
./.venv/Scripts/python.exe -m pip install torch==2.10.0 torchvision==0.25.0 --index-url https://download.pytorch.org/whl/cu128
./.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
```
本次机器 Python 由 Codex runtime 提供；脚本运行使用项目内 .venv，不依赖 Windows 商店 python 占位入口。
最终实际依赖版本见 backend/requirements-lock.txt（安装结束后生成）。

## 验证
```powershell
./scripts/test.ps1
```
测试中的坐标是几何单元测试输入，不是模型识别结果。

## 真实卧推视频测试
把获授权、脱敏的单人侧面视频放在 data/bench.mp4。不要包含患者或未脱敏师生敏感信息。
```powershell
./.venv/Scripts/python.exe scripts/analyze_bench.py data/bench.mp4 --device 0
```
无可用 GPU 时用 `--device cpu`。首次使用会下载官方 yolo11n-pose.pt 权重（也可 `--model` 指定本地权重）。默认最多处理 300 帧，逐帧处理以控制内存。结果写入 reports/bench-analysis.json。

Day 1 仅验证人体姿态关键点及二维肘部角度；无动作评分、无临床判断、无自动次数统计。多人帧与低置信度关节不输出角度；摄像角度、遮挡会影响结果。不提供真实视频就不会生成视频报告。

## 文件
- frontend：Next.js + Tailwind 工作台，默认本地预览；分析接口实现并开启配置后可提交上传。
- backend：FastAPI 基础服务、几何计算与测试。
- scripts：环境检查、视频测试、启动脚本。
- PROGRESS.md：五天规划及推进状态。
- reports/DAY1.md：当日完成项、实测结果、问题和下一步。
- reports/赛题说明-用户提供.md：用户提供的赛题原文副本。

## 当前范围
Day 2 完善五个页面、视频预览与校验、表单草稿和统一健康检查。实际 AI 视频分析仍走命令行，网页上传待后端成员实现并确认接口后接入。教学内容、计划生成和热量计算属于后续阶段；站点目前仅在本机运行，没有公开部署。

接口提案见 API_CONTRACT.md，状态为待队友确认；协作规则见 CONTRIBUTING.md。前端通过 NEXT_PUBLIC_API_BASE_URL 配置后端地址，修改后需重新构建/启动。

两位成员按前后端分工：用户负责前端，另一位成员负责后端。Day 3 开始真实接口联调，Day 4 完整演练，Day 5 做最终验收与修复。已检测到 Git origin 配置，但尚无本地提交，未确认远端同步；当前进度保存于本地 PROGRESS.md。

用户选择 Codex/ChatGPT 开发；此选择与赛事文件的 WorkBuddy 主体开发条款不一致，未声称符合该条。正式提交仍需补齐《提交材料说明.md》并确认模型/代码许可证适合最终分发方式（Ultralytics 提供 AGPL 与商业许可选项）。

## 开源许可证

本项目原创代码以 GNU Affero General Public License v3.0（SPDX: AGPL-3.0-only）发布，完整条款见 LICENSE。Copyright (C) 2026 FitPilot AI contributors。

允许依照许可证使用、修改与分发；分发和通过网络提供修改版本时，应履行相应的源码提供义务。项目不提供任何保证。完整适用条款以 LICENSE 为准。

第三方依赖、模型和非原创参考资料保留各自许可证或权利归属，不由本项目重新授权，详见 THIRD_PARTY_NOTICES.md。视频和模型权重未随仓库分发。公开代码不代表已经验证所有功能或取得赛事资格，实际完成情况见 PROGRESS.md。
