# Inkra 文档

[English](README.md)

独立维护组件示例、交互属性、搜索与多语言。组件实现、类型和设计契约归
inkrajs/inkra 所有；文档验证真实安装包，不通过 Vite 或 TypeScript 引用源码。

首页使用半屏介绍区与可交互组件展示，包含面包屑、日历和地图，各示例不强制
使用卡片头尾。示例编辑仅留在当前页面，主题与语言沿用站点持久化偏好。
文档位于 `/docs`，博客与生态暂时保留空壳。在本地预览运行时，可执行
`node scripts/verify-homepage.mjs` 检查首页交互及中英文桌面、移动端布局。

当前工作区使用 `vendor/inkra.tgz` 预览尚未发布的 0.4.2 候选版本。
此归档尚未发布至 npm。
library-candidate.json 固定组件仓精确提交及本地归档校验和。
先按下文准备本地候选包，再安装和构建：

```sh
npm ci
npm run build
npm run dev -- --port 4180
```

当前版本安装前需要按以下步骤准备本地候选包。

先在组件仓检出 library-candidate.json 中的精确提交，运行 npm ci、npm run build，
再用 `GITHUB_SHA=$(git rev-parse HEAD) npm run check:package` 打包。在本仓运行：

```sh
npm run prepare:library -- /path/to/inkra
npm run build
npm run dev -- --port 4180
```

准备脚本核对 SHA-256 后安装；同步审查 library-candidate.json 与 lockfile。
vendor 中的 tarball 不提交。组件仓使用
`GITHUB_SHA=$(git rev-parse HEAD) npm run check:package` 记录精确源码版本，
再同步本仓候选信息。组件修改后需要重新构建并准备候选包。

`node scripts/verify-property-extensions.mjs` 使用一个浏览器和真实安装包，检查
树的缩进与状态渲染、分页展示、评分悬停与表单重置、通知关闭、骨架减少动态效果，
并保存中英文桌面和窄屏截图。

在 4180 端口运行本地文档后，执行 `npx playwright install chromium` 和
`npm run test:browser`，检查选定的侧栏、Select、Input 和 InputNumber 桌面与
移动端交互，不代表全部组件或 SSR 水合验收。可用 INKRA_DOCS_URL 指定其他本地端口。
Push、PR 和手动 CI 对正式版本直接安装 npm 包；本地候选模式才按精确组件提交号
重建并核对归档与锁文件无漂移，两种模式都执行浏览器检查。

公开网站由 inkrajs/inkrajs.github.io 的 release.json 固定本仓精确提交后构建发布。
首页位于 /，文档位于 /docs；构建生成每条文档路径及旧地址的 HTML 入口，
支持 GitHub Pages 直达与刷新，不依赖 404 跳转。网站部署与 npm 发布是独立流程。
设置 BASE_URL 可对线上运行首页检查。
