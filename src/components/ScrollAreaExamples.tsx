import { useState } from 'react';
import { Button, PencilText, ScrollArea } from '@inkra/react';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect } from './DocsSelect';
import { PropertyTabs } from './PropertyTabs';
import './ScrollAreaExamples.css';

const rows = Array.from({ length: 18 }, (_, index) => index + 1);

export function ScrollAreaExamples() {
  const { locale } = useLocale();
  const text = (zh: string, en: string) => locale === 'en' ? en : zh;
  const [type, setType] = useState<'auto' | 'always'>('auto');
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [axis, setAxis] = useState<'both' | 'vertical' | 'horizontal'>('both');
  const [expanded, setExpanded] = useState(false);
  const code = `<ScrollArea
  type="${type}"
  dir="${direction}"
  viewportLabel="${text('可滚动文档预览', 'Scrollable document preview')}"
>
  <article style={{ minWidth: '${axis === 'vertical' ? 'auto' : '46rem'}', minHeight: '${axis === 'horizontal' ? 'auto' : '28rem'}' }}>
    {rows.map(row => <p key={row}>...</p>)}
  </article>
</ScrollArea>`;

  return <div className="scroll-area-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: text('布局', 'Layout'), content: <>
        <DocsSelect label={text('滚动轴', 'Axes')} value={axis} onValueChange={value => setAxis(value as typeof axis)} options={[
          ['both', text('双轴', 'Both axes')],
          ['vertical', text('仅纵向', 'Vertical only')],
          ['horizontal', text('仅横向', 'Horizontal only')],
        ]} />
        <DocsSelect label={text('阅读方向', 'Direction')} value={direction} onValueChange={value => setDirection(value as typeof direction)} options={[['ltr', 'LTR'], ['rtl', 'RTL']]} />
      </> },
      { label: text('交互', 'Interaction'), content: <>
        <DocsSelect label={text('滚动条策略', 'Scrollbar visibility')} value={type} onValueChange={value => setType(value as typeof type)} options={[['auto', text('自动', 'Auto')], ['always', text('常显', 'Always')]]} />
        <Button size="sm" variant="outline" onClick={() => setExpanded(value => !value)}>{expanded ? text('收起内容', 'Reduce content') : text('增加内容', 'Add content')}</Button>
      </> },
    ]} />}>{
      <div className="scroll-area-examples__playground" dir={direction} data-axis={axis}>
        <ScrollArea aria-label={text('文档预览', 'Document preview')} type={type} viewportLabel={text('可滚动文档预览', 'Scrollable document preview')}>
          <article className="scroll-area-examples__content" data-expanded={expanded || undefined}>
            <PencilText as="h3">{text('滚动区域预览', 'Scroll area preview')}</PencilText>
            {rows.slice(0, expanded ? rows.length : 10).map(row => <p key={row}>{text(`第 ${row} 行内容可选择、可复制，并保留原生滚动语义。`, `Row ${row} remains selectable, copyable, and natively scrollable.`)}</p>)}
          </article>
        </ScrollArea>
      </div>
    }</ComponentPlayground>

    <ComponentExample title={text('组合原语', 'Composable parts')} code={`<ScrollArea.Root>
  <ScrollArea.Viewport aria-label="${text('结果列表', 'Results list')}">
    <ScrollArea.Content>{text('结果内容', 'Result content')}</ScrollArea.Content>
  </ScrollArea.Viewport>
  <ScrollArea.Scrollbar orientation="vertical"><ScrollArea.Thumb /></ScrollArea.Scrollbar>
</ScrollArea.Root>`}>
      <div className="scroll-area-examples__parts">
        <ScrollArea.Root className="scroll-area-examples__parts-root">
          <ScrollArea.Viewport aria-label={text('结果列表', 'Results list')}>
            <ScrollArea.Content><p>{text('组合式 ScrollArea 保留 viewport 的原生键盘与触摸滚动。', 'Composable ScrollArea keeps native keyboard and touch scrolling on the viewport.')}</p><p>{text('自定义条只作用于组件内部。', 'Custom bars stay scoped to the component.')}</p></ScrollArea.Content>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical"><ScrollArea.Thumb /></ScrollArea.Scrollbar>
        </ScrollArea.Root>
      </div>
    </ComponentExample>
  </div>;
}
