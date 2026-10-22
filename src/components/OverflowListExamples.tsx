import { useMemo, useState } from 'react';
import { Badge, Button, OverflowList, PencilLine, type OverflowListItem, type OverflowListStrategy } from '@inkra/react';
import { __iconData as archiveIcon } from 'lucide-react/dist/esm/icons/archive.mjs';
import { __iconData as bellIcon } from 'lucide-react/dist/esm/icons/bell.mjs';
import { __iconData as bookmarkIcon } from 'lucide-react/dist/esm/icons/bookmark.mjs';
import { __iconData as downloadIcon } from 'lucide-react/dist/esm/icons/download.mjs';
import { __iconData as filterIcon } from 'lucide-react/dist/esm/icons/funnel.mjs';
import { __iconData as shareIcon } from 'lucide-react/dist/esm/icons/share-2.mjs';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsIcon } from './DocsIcon';
import { DocsSelect } from './DocsSelect';
import { PropertyTabs } from './PropertyTabs';
import { Switch } from '@inkra/react';
import './OverflowListExamples.css';

interface ToolbarItem extends OverflowListItem {
  icon: typeof archiveIcon;
  tone?: 'quiet' | 'accent';
}

const icons = [archiveIcon, bookmarkIcon, bellIcon, downloadIcon, filterIcon, shareIcon] as const;

export function OverflowListExamples() {
  const { locale } = useLocale();
  const text = (zh: string, en: string) => locale === 'en' ? en : zh;
  const [strategy, setStrategy] = useState<OverflowListStrategy>('end');
  const [density, setDensity] = useState<'compact' | 'roomy'>('compact');
  const [disabled, setDisabled] = useState(false);
  const [selected, setSelected] = useState('');
  const items = useMemo<ToolbarItem[]>(() => [
    { id: 'archive', label: text('归档', 'Archive'), icon: icons[0], priority: 4 },
    { id: 'bookmark', label: text('收藏', 'Bookmark'), icon: icons[1], priority: 5 },
    { id: 'notify', label: text('提醒', 'Notify'), icon: icons[2], priority: 2 },
    { id: 'download', label: text('下载', 'Download'), icon: icons[3], priority: 3 },
    { id: 'filter', label: text('筛选', 'Filter'), icon: icons[4], priority: 1 },
    { id: 'share', label: text('分享', 'Share'), icon: icons[5], priority: 6 },
  ], [locale]);
  const gap = density === 'compact' ? 4 : 12;
  const code = `<OverflowList
  items={items}
  strategy="${strategy}"
  gap={${gap}}
  overflowLabel=${JSON.stringify(text('更多操作', 'More actions'))}
  renderItem={(item) => <Button size="sm" variant="ghost" startIcon={<Icon data={item.icon} />}>{item.label}</Button>}
  renderOverflow={(context) => <MoreIcon aria-hidden="true" />}
  renderOverflowItem={(item) => item.label}
  onOverflowItemSelect={(item) => select(item.id)}
/>`;

  return <div className="overflow-list-examples">
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label={text('收纳策略', 'Retention strategy')} value={strategy} onValueChange={value => setStrategy(value as OverflowListStrategy)} options={[
          ['end', text('末尾收纳', 'Overflow from end')],
          ['start', text('开头收纳', 'Overflow from start')],
          ['priority', text('按优先级', 'Keep priority')],
        ]} />
        <DocsSelect label={text('间距', 'Item gap')} value={density} onValueChange={value => setDensity(value as typeof density)} options={[
          ['compact', text('紧凑', 'Compact')],
          ['roomy', text('宽松', 'Roomy')],
        ]} />
      </> },
      { label: '状态', content: <Switch label={text('禁用操作', 'Disable actions')} checked={disabled} onCheckedChange={setDisabled} /> },
    ]} />}>{
      <div className="overflow-list-examples__stage">
        <div className="overflow-list-examples__toolbar-frame">
        <OverflowList
          aria-label={text('文档工具栏', 'Document toolbar')}
          className="overflow-list-examples__toolbar"
          gap={gap}
          items={items}
          measurementKey={`${locale}-${density}`}
          onOverflowChange={change => setSelected(change.overflowItems.length ? `${change.overflowItems.length}` : '')}
          onOverflowItemSelect={item => setSelected(String(item.id))}
          overflowButtonProps={{ disabled, size: 'icon-sm' }}
          overflowLabel={text('更多操作', 'More actions')}
          renderItem={(item) => <Button disabled={disabled} size="sm" variant="ghost" startIcon={<DocsIcon data={item.icon} size={18} />}>{item.label}</Button>}
          renderOverflow={() => <DocsIcon data={shareIcon} size={18} />}
          renderOverflowItem={item => item.label}
          strategy={strategy}
        />
        <PencilLine />
        </div>
        <p className="overflow-list-examples__status" role="status">{selected ? text(`已收纳 ${selected} 项`, `${selected} item(s) in More`) : text('调整容器宽度查看收纳', 'Resize the container to see overflow')}</p>
      </div>
    }</ComponentPlayground>

    <ComponentExample title={text('标签与文本按钮', 'Tags and text buttons')} code={`<OverflowList
  items={tags}
  strategy="priority"
  renderItem={(item) => <Badge>{item.label}</Badge>}
  renderOverflowItem={(item) => <span>{item.label}</span>}
/>`}>
      <div className="overflow-list-examples__stack">
        <OverflowList
          aria-label={text('筛选标签', 'Filter tags')}
          items={[
            { id: 'design', label: text('设计', 'Design'), priority: 3 },
            { id: 'research', label: text('研究', 'Research'), priority: 2 },
            { id: 'planning', label: text('规划', 'Planning'), priority: 1 },
            { id: 'review', label: text('评审', 'Review'), priority: 4 },
          ]}
          renderItem={item => <Badge>{item.label}</Badge>}
          renderOverflowItem={item => item.label}
          strategy="priority"
        />
        <OverflowList
          aria-label={text('文本操作', 'Text actions')}
          items={[
            { id: 'rename', label: text('重命名', 'Rename') },
            { id: 'duplicate', label: text('复制', 'Duplicate') },
            { id: 'move', label: text('移动到', 'Move to') },
            { id: 'delete', label: text('删除', 'Delete'), disabled: true },
          ]}
          renderItem={item => <Button size="sm" variant="outline">{item.label}</Button>}
          renderOverflowItem={item => item.label}
        />
      </div>
    </ComponentExample>
  </div>;
}
