# 本地测试确认与 CI 免跑

指定维护者可以为当前 PR 的本地测试结果背书。CI 校验身份、提交和测试组后，
将对应检查记为“本地已测试、线上免跑”，不将它伪装成本次在线执行通过。

在 PR 描述中加入且仅加入一个下面格式的区块：

```ci-local-validation
{
  "schemaVersion": 1,
  "tested_commit": "替换为本地实际测试的完整40位提交SHA",
  "base_commit": "替换为PR当前目标分支的完整40位提交SHA",
  "candidate_sha256": "替换为本地实际测试的组件库归档的64位SHA-256",
  "local_passed": [
    {
      "group": "browser:log",
      "environments": ["chromium-playwright1.64.1-react19.3.1"],
      "evidence": "https://example.invalid/替换为可审查的本地测试报告",
      "reason": "本地已完成桌面、手机、键盘和焦点检查"
    }
  ]
}
```

AI 可以执行本地测试、整理报告并填写声明。维护者需要确认报告与提交一致。
证据链接只检查格式；CI 无法据此独立证明测试确实执行，信任来源是获授权维护者的背书。
浏览器声明还必须绑定 `library-candidate.json` 中的候选包 SHA-256；
即使文档提交相同，换了组件库归档也需要重新测试。

维护者名单按 GitHub 数字用户 ID 配置在
`.github/local-validation-policy.json`，用户名只用于说明。当前初始名单为
`NWYLZW`（ID `51358815`）。PR 描述最后编辑者必须获授权；把维护者名字写进描述
不能获得豁免。追加提交、目标分支变化或失去授权后需要重新测试并更新声明。

浏览器组按精确脚本列出，不接受通配符：

| 测试组 | 可免跑脚本 |
| --- | --- |
| `browser:log` | `verify-log-refinement` |
| `browser:number-ticker` | `verify-number-ticker-exact`、`verify-number-ticker-morph`、`verify-number-ticker-compact` |
| `browser:verify-脚本名` | 对应的单个已登记浏览器检查 |

Log 声明不会跳过同时覆盖 Slot、Hotkey 等组件的 `verify-utility-components`。
需要免跑多个检查时逐组声明。仅环境字段匹配的声明生效；其他环境保持线上测试。
上面的环境名是维护者声明覆盖的浏览器测试目标，报告仍应注明实际操作系统及执行命令。

普通文档 PR 默认只构建，不自动启动浏览器测试；声明不会扩大原有检查范围。
启用浏览器验证后，CI 将原本选中的检查分为线上执行和本地确认两部分。
发布流程引用 PR 声明时，还要核对候选源码与该 PR 的关系。构建、类型检查、
候选归档身份和依赖安装验证不属于浏览器免跑范围。

CI 摘要和测试计划会记录维护者、PR、完整提交、环境、证据链接、理由及免跑检查。
最终门禁校验本地确认和线上执行是否完整覆盖原计划；未知组、错误环境或无效声明
不会悄悄跳过其他检查。
