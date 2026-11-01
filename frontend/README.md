# FitPilot AI 前端 · Day 1

Next.js 16.4.3、React 19.3.1、Tailwind CSS 4.3.3。精确版本见 pnpm-lock.yaml。

## 启动

在本目录运行 `./start.ps1`。默认地址 http://127.0.0.1:3000 。后端健康检查地址 http://127.0.0.1:8000/health 。

如果已安装 pnpm，也可运行 `pnpm install --frozen-lockfile`、`pnpm build`、`pnpm start`。开发模式为 `pnpm dev`。

本机使用 Codex 随附 Node.js 和 pnpm。重装依赖若遇 IPv6 超时，在 PowerShell 设置 `$env:NODE_OPTIONS='--dns-result-order=ipv4first'` 后重试。

## 已实现

- 响应式深色健身工作台、功能导航、四个功能方向和 Day 1 进度区。
- 文件选择 / 拖入 / 本地视频预览 / 移除视频。视频不上传。
- FastAPI 健康检查，显示真实在线、离线状态，支持手动重试。
- 后续功能说明弹窗。教学、计划、热量功能明确为待开发。
- 插图明确标注“非分析结果”；没有伪造模型预测、分数或训练记录。

## 验证（2026-10-30）

- pnpm install：成功（初次 IPv6 网络超时，改用 IPv4 优先后成功）。
- next build：成功，静态页面生成成功。
- tsc --noEmit：成功。
- HTTP GET /：200，包含项目标题和卧推视频测试区。
- 内置浏览器：主界面布局已目视检查，后端显示“已连接本地后端”。
- “动作教学库”弹窗打开 / 关闭：通过。
- 无真实视频，未验证实际视频预览和模型结果。移动端已实现断点样式，尚未实际设备验证。

Day 1 仅通过后端 CLI 执行姿态分析，网页不会提交分析任务。
