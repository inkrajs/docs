import { useState } from 'react';
import { Badge, Button, PencilText, Sortable, Switch, type SortableContainerData, type SortableLabels } from '@inkra/react';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect } from './DocsSelect';
import { PropertyTabs } from './PropertyTabs';
import './SortableExamples.css';

interface SortableNote {
  id: string;
  title: string;
  detail: string;
  locked?: boolean;
}

const initialNotes: SortableNote[] = [
  { id: 'outline', title: 'Outline the story', detail: 'Find the opening and the ending.' },
  { id: 'sketch', title: 'Sketch the scenes', detail: 'Keep each frame loose and readable.' },
  { id: 'review', title: 'Review the rhythm', detail: 'Locked while feedback is collected.', locked: true },
  { id: 'polish', title: 'Polish the details', detail: 'Add texture after the structure works.' },
];

const boardSeed: SortableContainerData<SortableNote>[] = [
  { id: 'draft', label: 'Draft', items: initialNotes.slice(0, 2) },
  { id: 'ready', label: 'Ready', items: initialNotes.slice(2) },
  { id: 'archive', label: 'Archive', items: [] },
  { id: 'paused', label: 'Paused', disabled: true, items: [{ id: 'signed', title: 'Signed copy', detail: 'This container is read only.' }] },
];

function NoteContent({ item, lockedLabel, compact = false }: { item: SortableNote; lockedLabel: string; compact?: boolean }) {
  return <div className="sortable-example__note-copy">
    <span className="sortable-example__note-title"><PencilText>{item.title}</PencilText>{item.locked && <Badge size="sm">{lockedLabel}</Badge>}</span>
    {!compact && <PencilText className="sortable-example__note-detail">{item.detail}</PencilText>}
  </div>;
}

export function SortableExamples() {
  const { locale } = useLocale();
  const copy = locale === 'en' ? {
    layout: 'Layout', arrangement: 'Arrangement', list: 'List', grid: 'Grid', interaction: 'Interaction',
    handle: 'Drag handle', disableLocked: 'Disable locked item', drag: 'Drag item', locked: 'Locked',
    across: 'Move across containers', open: 'Open',
    containers: { notes: 'Creative steps', draft: 'Draft', ready: 'Ready', archive: 'Archive', paused: 'Paused' },
    notes: {
      outline: ['Outline the story', 'Find the opening and the ending.'],
      sketch: ['Sketch the scenes', 'Keep each frame loose and readable.'],
      review: ['Review the rhythm', 'Locked while feedback is collected.'],
      polish: ['Polish the details', 'Add texture after the structure works.'],
      signed: ['Signed copy', 'This container is read only.'],
    },
  } : {
    layout: '布局', arrangement: '排列', list: '列表', grid: '网格', interaction: '交互',
    handle: '拖动手柄', disableLocked: '禁用锁定项', drag: '拖动项目', locked: '已锁定',
    across: '跨容器移动', open: '打开',
    containers: { notes: '创作步骤', draft: '草稿', ready: '就绪', archive: '归档', paused: '暂停' },
    notes: {
      outline: ['梳理故事大纲', '先确定开头和结尾。'],
      sketch: ['勾画场景', '让每一帧都清楚易读。'],
      review: ['检查叙事节奏', '收集反馈期间暂时锁定。'],
      polish: ['打磨细节', '结构确定后再补充质感。'],
      signed: ['签字定稿', '此分组为只读。'],
    },
  };
  const labels: SortableLabels = locale === 'en' ? { handle: copy.drag } : {
    handle: copy.drag,
    screenReaderInstructions: '按空格或回车拾取项目，使用方向键移动，再按空格或回车放下，按 Escape 取消。',
    pickedUp: (item, container, position, count) => `已拾取${item}，位于${container}，第 ${position} 项，共 ${count} 项。`,
    movedOver: (item, container, position, count) => `${item}移动至${container}，第 ${position} 项，共 ${count} 项。`,
    dropped: (item, container, position, count) => `已将${item}放到${container}，第 ${position} 项，共 ${count} 项。`,
    cancelled: item => `已取消排序，${item}回到原位。`,
  };
  const [layout, setLayout] = useState<'list' | 'grid'>('list');
  const [handle, setHandle] = useState(false);
  const [disableLocked, setDisableLocked] = useState(true);
  const [notes, setNotes] = useState<SortableContainerData<SortableNote>[]>([
    { id: 'notes', layout: 'list', items: initialNotes },
  ]);
  const [board, setBoard] = useState<SortableContainerData<SortableNote>[]>(boardSeed);
  function localizeContainers(containers: SortableContainerData<SortableNote>[]) {
    return containers.map(container => ({
      ...container,
      label: copy.containers[container.id as keyof typeof copy.containers],
      items: container.items.map(item => {
        const [title, detail] = copy.notes[item.id as keyof typeof copy.notes];
        return { ...item, title, detail };
      }),
    }));
  }
  const code = `<Sortable
  containers={[{ id: 'notes', layout: '${layout}', items }]}
  getItemId={item => item.id}
  handle={${handle}}
  isItemDisabled={item => ${disableLocked} && item.locked}
  renderItem={({ item }) => <NoteCard note={item} />}
  onChange={next => setContainers(next)}
  onReorder={({ from, to }) => console.log(from, to)}
/>`;

  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: copy.layout, content: <DocsSelect
        label={copy.arrangement}
        value={layout}
        onValueChange={value => {
          const next = value as 'list' | 'grid';
          setLayout(next);
          setNotes(current => current.map(container => ({ ...container, layout: next })));
        }}
        options={[['list', copy.list], ['grid', copy.grid]]}
      /> },
      { label: copy.interaction, content: <>
        <Switch label={copy.handle} checked={handle} onCheckedChange={setHandle} />
        <Switch label={copy.disableLocked} checked={disableLocked} onCheckedChange={setDisableLocked} />
      </> },
    ]} />}>
      <div className="sortable-example__playground" data-testid="sortable-playground">
        <Sortable
          containers={localizeContainers(notes)}
          getItemId={item => item.id}
          getItemLabel={item => item.title}
          handle={handle}
          isItemDisabled={item => disableLocked && item.locked === true}
          labels={labels}
          onChange={setNotes}
          renderItem={({ item }) => <NoteContent item={item} lockedLabel={copy.locked} />}
        />
      </div>
    </ComponentPlayground>

    <ComponentExample title={copy.across} code={`<Sortable
  containers={columns}
  getItemId={item => item.id}
  handle
  onChange={(next, details) => setColumns(next)}
  onMove={({ from, to, item }) => saveMove(item.id, from, to)}
  renderContainerHeader={({ container, itemCount }) => (
    <Header>{container.label} · {itemCount}</Header>
  )}
  renderItem={({ item }) => <NoteCard note={item} />}
/>`}>
      <div className="sortable-example__board" data-testid="sortable-board">
        <Sortable
          containers={localizeContainers(board)}
          getItemId={item => item.id}
          getItemLabel={item => item.title}
          handle
          labels={labels}
          onChange={setBoard}
          renderContainerHeader={({ container, itemCount }) => <div className="sortable-example__column-title">
            <PencilText>{container.label ?? String(container.id)}</PencilText>
            <Badge size="sm">{itemCount}</Badge>
          </div>}
          renderItem={({ item }) => <div className="sortable-example__item-with-action">
            <NoteContent item={item} lockedLabel={copy.locked} compact />
            <Button size="sm" variant="ghost" data-sortable-no-drag onClick={() => undefined}>{copy.open}</Button>
          </div>}
        />
      </div>
    </ComponentExample>
  </>;
}
