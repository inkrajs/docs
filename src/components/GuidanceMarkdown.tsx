import { Markdown } from '@inkra/react';
import { useLocale } from '../i18n';

export interface LocalizedMarkdown {
  zh: string;
  en: string;
}
export const buttonAccessibilityGuidance: LocalizedMarkdown = {
  zh: `- \`Button\` 渲染真实 \`button\`；\`ButtonLink\` 渲染真实 \`a\`，保留各自原生键盘语义。
- 纯图标尺寸必须提供 \`aria-label\`。Tooltip 只能补充说明，不能作为唯一名称来源。
- Loading 保留 DOM 标签和稳定几何，设置 \`aria-busy\` 并阻止重复激活；异步操作结束后应恢复可用状态。
- \`ButtonGroup\` 需要可访问名称；\`horizontal\` 与 \`vertical\` 只改变视觉排列，不发明方向键行为。
- \`startIcon\` / \`endIcon\` 使用逻辑方向，局部 \`dir="rtl"\` 时顺序随文字方向调整。
- 材质 canvas 不接收事件；强制颜色和绘制失败时保留 DOM 回退。参见 [Tooltip 无障碍说明](/docs/components/tooltip#accessibility)。`,
  en: `- \`Button\` renders a real \`button\`; \`ButtonLink\` renders a real \`a\`, preserving their native keyboard behavior.
- Icon-only sizes require an \`aria-label\`. A tooltip can add context, but it cannot be the only accessible name.
- Loading keeps the DOM label and stable geometry, sets \`aria-busy\`, and prevents duplicate activation. Restore the available state when async work finishes.
- \`ButtonGroup\` needs an accessible name. \`horizontal\` and \`vertical\` change layout without inventing arrow-key behavior.
- \`startIcon\` / \`endIcon\` use logical directions and follow a local \`dir="rtl"\` context.
- Material canvases do not receive events; forced colors and drawing failures retain the DOM fallback. See [Tooltip accessibility](/docs/components/tooltip#accessibility).`,
};

export function GuidanceMarkdown({ source, className = '' }: { source: string; className?: string }) {
  const { locale } = useLocale();
  const markdownLabels = locale === 'en' ? {
    code: 'Guidance code block',
    plainText: 'Plain text',
    copy: 'Copy code',
    copied: 'Code copied',
    copyFailed: 'Copy failed. Select the code to copy it manually.',
    table: 'Guidance table',
    taskChecked: 'Completed guidance item',
    taskUnchecked: 'Incomplete guidance item',
  } : {
    code: '说明代码块',
    plainText: '纯文本',
    copy: '复制代码',
    copied: '代码已复制',
    copyFailed: '复制失败，请手动选择代码',
    table: '说明表格',
    taskChecked: '已完成说明项',
    taskUnchecked: '未完成说明项',
  };
  return <Markdown
    className={['docs-guidance-markdown', className].filter(Boolean).join(' ')}
    headingLevelOffset={2}
    labels={markdownLabels}
  >
    {source}
  </Markdown>;
}
