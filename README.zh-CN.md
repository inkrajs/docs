# Inkra 文档

[English](README.md)

`0.12.0` 新增 DependencyGraph，用于技能树、科技树和合成配方图，支持自动分层布局、
依赖路径高亮、自定义节点内容与按比例设置连接点。示例包含纯图标、无框图片合成图，
以及整张卡片翻转的 Flip 组合。NodeGraph 和 DependencyGraph 的画布工具栏可以
分别关闭内置按钮，也能追加自定义操作。

浏览器测试分片依据 `scripts/browser-timings.mjs` 中本次发布实测耗时分配，
优先执行耗时较长的检查，每个分片仍最多两个 worker。耗时只影响调度，不影响覆盖：
新检查使用默认权重，最终仍校验所有选中的检查恰好执行一次。历史耗时回放只用于
估算调度收益，不等于新流水线已达到该耗时。

独立维护组件示例、交互属性、搜索与多语言。组件实现、类型和设计契约归
inkrajs/inkra 所有；文档验证真实安装包，不通过 Vite 或 TypeScript 引用源码。

首页使用半屏介绍区与可交互组件展示，包含面包屑、日历和地图，各示例不强制
使用卡片头尾。示例编辑仅留在当前页面，主题与语言沿用站点持久化偏好。
文档位于 `/docs`，`/blog` 为文章列表并提供独立文章页，生态页保留空状态。在本地预览运行时，可执行
`node scripts/verify-homepage.mjs` 检查首页交互及中英文桌面、移动端布局。

此前 `0.11.0` 新增 NumberTicker 可选的 `animation="morph"` 模式：精确小数位移
保留固定字宽、移动小数点，新增的零以滑动、淡入和右侧裁剪方式进入，默认 420ms；
普通数值变化使用按位纵向滚动，原有 count、roll 模式继续保留。Log 的回到底部操作
改为紧凑的悬浮图标按钮，移除整条底栏。

组件页面从基础用法开始，逐步展示常用配置、组合、自定义渲染和边界场景。
CI 支持指定维护者确认本地测试结果，按精确提交、候选包、测试组和环境免跑对应部分；
基础包/构建检查和最终覆盖门禁继续执行。使用方法见 [AI CI 操作指引](docs/ai-ci-guide.md)。

此前 `0.10.0` 新增 CircularSlider 和 Switch 可选的圆环外观。圆环滑块支持触屏、键盘、
圆弧范围，以及中心图标、文字或图文组合；圆环开关关闭时保留淡色底环，切换时
强调色圆弧平滑展开或收回，不放滑块圆球。直线 Slider 与 RangeSlider 默认可拖到
轨道两端，`thumbAlignment="contain"` 可保留端部留白。

默认字体改为小赖，更新彩铅参数，支持按作用域关闭文字彩铅效果；色彩主题继承
上层字体设置，组合字符按完整字素绘制。操作与选中态的铺色减淡，保留笔触质感。
文档新增可搜索的 29 款字体预览与选择，支持原生语言样例、按需加载及各字体独立参数；
主题面板加入圆环控件、自定义颜色记忆，以及丁香、赭橙、藤黄配色。设计规范拆分
字体与材质分类，展示图标描线、填充、彩色对照；草稿仍仅影响预览，保存后才全局应用。

此前 `0.9.0` 的 Guide、Loading、四向 InfiniteScroll、Masonry、数字滚动，以及支持
自定义配色的填充与彩色图标均继续提供。

## 本地开发

本仓固定安装公开 npm 正式版本 `@inkra/react@0.12.0`。
`library-candidate.json` 记录发布源码的完整提交、SHA-256 和 SHA-512；
CI 与网站部署直接安装该版本并核对归档、锁文件和真实安装包，不引用组件源码。
文档改动不会自行发布 npm 包或部署网站。全新检出直接运行：

```sh
npm ci
npm run build
npm run dev -- --port 4180
```

正常开发不需要相邻组件源码或 vendor 归档。

## 准备未发布候选包

仅在验证未发布的组件修改时，使用以下流程将 registry 依赖替换为验证过的本地归档；
准备脚本也会安装依赖。先在组件仓检出需要验证的源码提交，运行 npm ci、npm run build，
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

## 检查与发布

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
