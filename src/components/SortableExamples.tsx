import { useState } from 'react';
import { Badge, Button, PencilText, Sortable, Switch, type SortableContainerData } from '@inkra/react';

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

function NoteContent({ item, compact = false }: { item: SortableNote; compact?: boolean }) {
  return <div className="sortable-example__note-copy">
    <span className="sortable-example__note-title"><PencilText>{item.title}</PencilText>{item.locked && <Badge size="sm">Locked</Badge>}</span>
    {!compact && <span className="sortable-example__note-detail">{item.detail}</span>}
  </div>;
}

export function SortableExamples() {
  const { t } = useLocale();
  const [layout, setLayout] = useState<'list' | 'grid'>('list');
  const [handle, setHandle] = useState(true);
  const [disableLocked, setDisableLocked] = useState(true);
  const [notes, setNotes] = useState<SortableContainerData<SortableNote>[]>([
    { id: 'notes', label: t('创作步骤 / Creative steps'), layout: 'list', items: initialNotes },
  ]);
  const [board, setBoard] = useState<SortableContainerData<SortableNote>[]>(boardSeed);
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
      { label: t('布局 / Layout'), content: <DocsSelect
        label={t('排列 / Arrangement')}
        value={layout}
        onValueChange={value => {
          const next = value as 'list' | 'grid';
          setLayout(next);
          setNotes(current => current.map(container => ({ ...container, layout: next })));
        }}
        options={[['list', t('列表 / List')], ['grid', t('网格 / Grid')]]}
      /> },
      { label: t('交互 / Interaction'), content: <>
        <Switch label={t('拖动手柄 / Drag handle')} checked={handle} onCheckedChange={setHandle} />
        <Switch label={t('禁用锁定项 / Disable locked item')} checked={disableLocked} onCheckedChange={setDisableLocked} />
      </> },
    ]} />}>
      <div className="sortable-example__playground" data-testid="sortable-playground">
        <Sortable
          containers={notes}
          getItemId={item => item.id}
          getItemLabel={item => item.title}
          handle={handle}
          isItemDisabled={item => disableLocked && item.locked === true}
          labels={{ handle: t('拖动项目 / Drag item') }}
          onChange={setNotes}
          renderItem={({ item }) => <NoteContent item={item} />}
        />
      </div>
    </ComponentPlayground>

    <ComponentExample title={t('跨容器移动 / Move across containers')} code={`<Sortable
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
          containers={board}
          getItemId={item => item.id}
          getItemLabel={item => item.title}
          handle
          labels={{ handle: t('拖动项目 / Drag item') }}
          onChange={setBoard}
          renderContainerHeader={({ container, itemCount }) => <div className="sortable-example__column-title">
            <PencilText>{container.label ?? String(container.id)}</PencilText>
            <Badge size="sm">{itemCount}</Badge>
          </div>}
          renderItem={({ item }) => <div className="sortable-example__item-with-action">
            <NoteContent item={item} compact />
            <Button size="sm" variant="ghost" data-sortable-no-drag onClick={() => undefined}>{t('打开 / Open')}</Button>
          </div>}
        />
      </div>
    </ComponentExample>
  </>;
}
