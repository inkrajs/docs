# Inkra 文档

[English](README.md)

浏览器测试分片依据 `scripts/browser-timings.mjs` 中本次发布实测耗时分配，
优先执行耗时较长的检查，每个分片仍最多两个 worker。耗时只影响调度，不影响覆盖：
新检查使用默认权重，最终仍校验所有选中的检查恰好执行一次。历史耗时回放只用于
估算调度收益，不等于新流水线已达到该耗时。

独立维护组件示例、交互属性、搜索与多语言。组件实现、类型和设计契约归
inkrajs/inkra 所有；文档验证真实安装包，不通过 Vite 或 TypeScript 引用源码。

首页使用半屏介绍区与可交互组件展示，包含面包屑、日历和地图，各示例不强制
使用卡片头尾。示例编辑仅留在当前页面，主题与语言沿用站点持久化偏好。
文档位于 `/docs`，博客与生态暂时保留空壳。在本地预览运行时，可执行
`node scripts/verify-homepage.mjs` 检查首页交互及中英文桌面、移动端布局。

当前检出安装已核验公开归档的 `@inkra/react@0.9.0` 正式版本，新增 Guide、Loading、
四向 InfiniteScroll、Masonry、数字滚动，以及支持自定义配色的填充与彩色图标。
library-candidate.json 固定已发布源码的精确提交和公开归档校验和，构建验证实际安装包，
不引用组件源码。文档改动不会自行发布 npm 包或部署网站。全新检出运行：

```sh
npm ci
npm run build
npm run dev -- --port 4180
```

正式版本不需要相邻组件源码或 vendor 归档。仅在验证未发布的组件修改时，
使用以下候选准备流程；准备脚本也会安装依赖。

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
重建并核对归档与锁文件无漂移。日常 PR 和 main push 只验证依赖身份、类型检查和
生产构建，不自动跑契约测试或浏览器测试。`npm run build` 不隐式执行测试；需要时
单独执行 `npm run test:contracts`。

需要交互回归时，手动运行 workflow 并开启 `run_browser`（默认关闭），才执行契约
测试和全量浏览器检查。组件感知的增量选测工具仍保留，但不参与日常 PR/main 门禁。
普通构建通过不代表浏览器交互已验收。

日常 `docs` 门禁只要求构建成功。手动开启浏览器检查时，build 上传的 JSON 计划是
唯一可信来源。每个分片报告都绑定计划摘要、实际测试提交、
完整 suite 摘要和选中 suite 摘要；最终 `docs` gate 会在自己的 checkout 上重新核对当前
suite，拒绝过期身份、漏测、重复、计划外结果、不完整或失败的检查。未选中的检查只会
列为 skipped，不会计为通过。未提供计划时，`npm run test:browser` 本地仍默认运行全量。

公开网站由 inkrajs/inkrajs.github.io 的 release.json 固定本仓精确提交后构建发布。
首页位于 /，文档位于 /docs；构建生成每条文档路径及旧地址的 HTML 入口，
支持 GitHub Pages 直达与刷新，不依赖 404 跳转。网站部署与 npm 发布是独立流程。
设置 BASE_URL 可对线上运行首页检查。
