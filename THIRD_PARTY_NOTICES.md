# Third-party notices / 第三方许可说明

FitPilot AI 原创代码采用 AGPL-3.0-only，完整文本见 LICENSE。本声明不改变第三方材料的权利归属，也不是全部间接依赖许可证的完整清单。

## 软件依赖

本仓库通过包管理器引用依赖，不将 node_modules、Python 虚拟环境或模型权重随源码提交。精确依赖见 frontend/pnpm-lock.yaml 和 backend/requirements-lock.txt；再分发依赖时应保留其原有许可证、版权和所要求的声明。

- Ultralytics / YOLO-Pose：其开源许可为 AGPL-3.0，另有商业授权方案。使用和分发具体代码及模型应遵循对应版本的实际条款。官方说明：https://www.ultralytics.com/license 。本项目选择 AGPL-3.0 开源路线，未购买或声称持有商业授权。
- Next.js、React、Tailwind CSS、FastAPI 等依赖保留各自上游许可证；OpenCV、PyTorch、图标及其间接依赖亦同。此文件不将这些依赖重新授权为项目原创代码。

## 非原创资料与媒体

- reports/赛题说明-用户提供.md 是用户提供的比赛参考文本，不是 FitPilot AI 原创代码，不纳入本项目原创代码的 AGPL 授权声明；权利归原作者或组织方。
- 外部文档链接、未来教学资料、第三方图片、视频和数据集等均保留各自的权利归属。引入新资产时记录来源及许可，不因仓库公开就假定第三方资产可自由再分发。
- 仓库不附带私人健身视频、模型权重、密钥或运行环境。运行时取得模型和测试素材须遵守其来源许可及授权。

## 许可证文本来源

LICENSE 使用 SPDX license-list-data 的 AGPL-3.0-only 标准全文：
https://github.com/spdx/license-list-data/blob/main/text/AGPL-3.0-only.txt
GNU 官方条款：https://www.gnu.org/licenses/agpl-3.0.html
