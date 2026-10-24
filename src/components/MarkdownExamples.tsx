import { Markdown } from '@inkra/react';
import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import './MarkdownExamples.css';

const samples = {
  zh: {
    basic: `## 无障碍说明

请为纯图标按钮提供清晰名称，并保留清晰的键盘焦点。

- 使用真实按钮语义
- 让状态变化可被读屏读取`,
    typography: `### 行内排版

**粗体**、*斜体*、***粗斜体*** 与 ~~删除线~~ 都保留语义。

[查看 Button 文档](/docs/components/button#accessibility)，并为纯图标按钮设置 \`aria-label\`。

行末使用反斜杠\\
会创建显式换行。`,
    advanced: `## 发布检查

- [x] 键盘操作
- [ ] 窄屏表格

> 颜色不能成为唯一的状态信息。

| 检查项 | 结果 |
| --- | --- |
| 标题层级 | 通过 |
| 图片替代文字 | 待检查 |

---

1. 先检查语义
2. 再检查视觉`,
    media: `### 代码与图片

\`\`\`tsx
const count: number = 2;

function CreateButton() {
  return <Button aria-label="新建" disabled={count < 1}>
    <Plus />
  </Button>;
}
\`\`\`

![Inkra 彩铅图标](/favicon.png)`,
  },
  en: {
    basic: `## Accessibility guidance

Give icon-only buttons a clear accessible name and retain a visible keyboard focus indicator.

- Use native button semantics
- Make status changes available to screen readers`,
    typography: `### Inline typography

**Bold**, *italic*, ***bold italic***, and ~~deleted text~~ retain their semantics.

[Read the Button documentation](/docs/components/button#accessibility), and set \`aria-label\` on icon-only buttons.

Use a trailing backslash\\
to create an explicit line break.`,
    advanced: `## Release checks

- [x] Keyboard operation
- [ ] Narrow table layout

> Color must not be the only status signal.

| Check | Result |
| --- | --- |
| Heading order | Passed |
| Image alternative | Review |

---

1. Check semantics first
2. Check visuals second`,
    media: `### Code and image

\`\`\`tsx
const count: number = 2;

function CreateButton() {
  return <Button aria-label="Create" disabled={count < 1}>
    <Plus />
  </Button>;
}
\`\`\`

![Inkra pencil icon](/favicon.png)`,
  },
} as const;

export const markdownAccessibility = {
  zh: `- Markdown 输出真实标题、段落、列表、引用、表格、链接和图片元素，文字保持可选择和可复制。
- 标题应按页面结构连续使用；嵌入现有页面时可用 \`headingLevelOffset\` 调整层级。
- 链接保留原生 Tab 与 Enter 行为。代码块和表格滚动区域可聚焦，窄屏只在自身内部横向滚动。
- 图片必须提供有意义的替代文字；装饰图片使用空替代文字。危险链接和图片协议会被拒绝。
- 原始 HTML 默认忽略，不执行脚本或内联事件。若使用 \`transformUrl\`，返回值仍会经过安全协议过滤。
- 任务清单复用 Inkra \`Checkbox\` 的禁用展示，保留原生复选框语义但不提供切换交互。`,
  en: `- Markdown produces real headings, paragraphs, lists, quotes, tables, links, and images while keeping text selectable and copyable.
- Keep heading levels continuous with the surrounding page. Use \`headingLevelOffset\` when embedding content below an existing heading.
- Links retain native Tab and Enter behavior. Code blocks and table regions are focusable and scroll locally on narrow screens.
- Images need meaningful alternative text; decorative images use empty alt text. Dangerous link and image protocols are rejected.
- Raw HTML is ignored by default, so scripts and inline handlers do not execute. Values returned by \`transformUrl\` still pass through protocol filtering.
- Task lists reuse the disabled Inkra \`Checkbox\` presentation, preserving native checkbox semantics without offering toggle interaction.`,
} as const;

export function MarkdownExamples() {
  const { locale, t } = useLocale();
  const content = samples[locale === 'en' ? 'en' : 'zh'];
  const markdownLabels = locale === 'en' ? {
    code: 'Code example',
    plainText: 'Plain text',
    copy: 'Copy code',
    copied: 'Code copied',
    copyFailed: 'Copy failed. Select the code to copy it manually.',
    table: 'Release checks',
    taskChecked: 'Completed release check',
    taskUnchecked: 'Incomplete release check',
  } : {
    code: '代码示例',
    plainText: '纯文本',
    copy: '复制代码',
    copied: '代码已复制',
    copyFailed: '复制失败，请手动选择代码',
    table: '发布检查',
    taskChecked: '已完成发布检查',
    taskUnchecked: '未完成发布检查',
  };
  return <div className="markdown-examples">
    <ComponentExample title={t('基础排版')} code={`import { Markdown } from '@inkra/react';\n\n<Markdown headingLevelOffset={1}>\n{${JSON.stringify(content.basic)}}\n</Markdown>`}>
      <Markdown headingLevelOffset={1} labels={markdownLabels}>{content.basic}</Markdown>
    </ComponentExample>
    <ComponentExample title={t('行内排版')} code={`<Markdown headingLevelOffset={1}>\n{${JSON.stringify(content.typography)}}\n</Markdown>`}>
      <Markdown headingLevelOffset={1} labels={markdownLabels}>{content.typography}</Markdown>
    </ComponentExample>
    <ComponentExample title={t('任务与表格')} code={`<Markdown headingLevelOffset={1} labels={${JSON.stringify(markdownLabels)}}>\n{${JSON.stringify(content.advanced)}}\n</Markdown>`}>
      <Markdown headingLevelOffset={1} labels={markdownLabels}>{content.advanced}</Markdown>
    </ComponentExample>
    <ComponentExample title={t('代码与媒体')} code={`<Markdown headingLevelOffset={1}>\n{${JSON.stringify(content.media)}}\n</Markdown>`}>
      <Markdown headingLevelOffset={1} labels={markdownLabels}>{content.media}</Markdown>
    </ComponentExample>
  </div>;
}
