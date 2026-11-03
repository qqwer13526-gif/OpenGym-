# Muscle Atlas and Training Planner

FitPilot肌群图谱与计划模块，来源于2026-11-02已验收的性能优化预览。24动作、周计划与实际记录、规则建议、冷灰图谱、分组联动、局部避让以及性能缓存均已包含。

## 入口与构建

- `/muscle-atlas` → `/fitpilot-atlas/index.html`
- `/training-planner` → `/fitpilot-atlas/index.html?view=plan`

两个新增App Router入口重定向到同源静态模块，保持独立样式。既有首页和`/analysis`、`/library`、`/plan`、`/calories`继续保留；主导航可增加上述新入口。

```text
cd frontend
node scripts/build-muscle-atlas.mjs
node scripts/build-muscle-atlas.mjs --check
pnpm exec next typegen
pnpm typecheck
pnpm build
```

可编辑源码：`frontend/features/muscle-atlas/source/`。
生成文件：`frontend/public/fitpilot-atlas/index.html`。
构建使用项目已有Node.js，不需要新增第三方依赖。修改源码后应重新生成并同时提交生成文件。

## 数据

继续使用`fitpilot.personal-actions.v1`与`fitpilot.training-plan.v1`。首次为个人空计划，演示数据与性能测试记录不写入用户数据。旧预览与主项目若端口不同，应从旧入口导出备份、在新入口导入；当前没有云同步。

## 检查与限制

`verification/`为历史独立预览的31组检查结果与同条件性能原始记录，已去掉本机浏览器配置目录等环境字段。根接入包中的验证结果记录本次与现有Next.js项目的集成检查。

性能数字是本机Chrome无头合成测试的计算回调耗时，不能直接换成用户设备帧率。肌群角色是学习用映射，未构成动作质量评分、激活比例或风险诊断。动作来源与规则说明在同目录。
