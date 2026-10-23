import { useMemo, useRef, useState } from 'react';
import {
  Button,
  PencilSurface,
  PencilText,
  Switch,
  VirtualList,
  type VirtualListHandle,
} from '@inkra/react';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect } from './DocsSelect';
import { PropertyTabs } from './PropertyTabs';
import './VirtualListExamples.css';

interface NoteItem {
  id: string;
  number: number;
  added?: boolean;
}

interface LocalizedNote extends NoteItem {
  title: string;
  meta: string;
  detail: string;
}

function createItems(count: number): NoteItem[] {
  return Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    return {
      id: `note-${number}`,
      number,
    };
  });
}

const initialItems = createItems(500);

function ExternalScrollExample({ items, label }: { items: readonly LocalizedNote[]; label: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  return <PencilSurface as="div" className="virtual-list-examples__external-frame" radius={8} variant="paper">
    <div
      aria-label={label}
      className="virtual-list-examples__external-viewport"
      ref={viewportRef}
      role="region"
      tabIndex={0}
    >
      <VirtualList
        estimateSize={72}
        measureItems
        getScrollElement={() => viewportRef.current}
        itemKey={item => item.id}
        items={items}
        listLabel={label}
        overscan={5}
        renderItem={({ item }) => <div className="virtual-list-examples__external-row">
          <PencilText>{item.title}</PencilText>
          <small><PencilText>{item.meta}</PencilText></small>
        </div>}
        role="none"
        ssrItemCount={6}
      />
    </div>
  </PencilSurface>;
}

export function VirtualListExamples() {
  const { locale } = useLocale();
  const copy = locale === 'en' ? {
    add: 'Prepend item',
    clear: 'Clear data',
    dynamic: 'Measure dynamic rows',
    empty: 'No notes yet',
    external: 'External native scroll element',
    first: 'First item',
    last: 'Last item',
    list: 'Virtualized notes',
    middle: 'Item 250',
    overscan: 'Overscan rows',
    remove: 'Remove selected',
    restore: 'Restore 500 items',
    selected: 'Selected',
    emptyTitle: 'Empty list',
    emptyList: 'Empty notes',
  } : {
    add: '在顶部添加',
    clear: '清空数据',
    dynamic: '测量动态高度',
    empty: '暂无笔记',
    external: '外部原生滚动元素',
    first: '第一项',
    last: '最后一项',
    list: '虚拟化笔记列表',
    middle: '第 250 项',
    overscan: '预渲染行数',
    remove: '删除选中项',
    restore: '恢复 500 项',
    selected: '已选择',
    emptyTitle: '空列表',
    emptyList: '空笔记列表',
  };
  const listRef = useRef<VirtualListHandle>(null);
  const nextItemRef = useRef(1);
  const [items, setItems] = useState<readonly NoteItem[]>(initialItems);
  const [selectedId, setSelectedId] = useState<string | null>('note-3');
  const [dynamic, setDynamic] = useState(false);
  const [overscan, setOverscan] = useState(6);
  const localizeItem = (item: NoteItem): LocalizedNote => ({
    ...item,
    title: locale === 'en'
      ? `${item.added ? 'New note' : 'Note'} ${String(item.number).padStart(3, '0')}`
      : `${item.added ? '新笔记' : '笔记'} ${String(item.number).padStart(3, '0')}`,
    meta: item.added ? (locale === 'en' ? 'Added now' : '刚刚添加')
      : locale === 'en' ? `${item.number % 7 + 1} tags` : `${item.number % 7 + 1} 个标签`,
    detail: item.added
      ? (locale === 'en' ? 'Stable keys keep identity after insertion.' : '稳定 key 会在插入后继续对应同一条记录。')
      : item.number % 5 === 0
        ? (locale === 'en' ? 'This record has a longer summary for dynamic height measurement.' : '这条记录包含更长的摘要，用来验证动态高度测量。')
        : (locale === 'en' ? 'Short summary' : '简短摘要'),
  });
  const localizedItems = useMemo(() => items.map(localizeItem), [items, locale]);
  const externalItems = useMemo(() => initialItems.slice(0, 160).map(localizeItem), [locale]);
  const selectedIndex = selectedId ? items.findIndex(item => item.id === selectedId) : -1;
  const code = `const listRef = useRef<VirtualListHandle>(null);
const [selectedId, setSelectedId] = useState('note-3');

<VirtualList
  ref={listRef}
  aria-label="${copy.list}"
  items={items}
  itemKey={item => item.id}
  estimateSize={${dynamic ? '120' : '80'}}
  measureItems={${dynamic}}
  overscan={${overscan}}
  emptyLabel="${copy.empty}"
  renderItem={({ item }) => (
    <Button
      aria-pressed={selectedId === item.id}
      variant={selectedId === item.id ? 'secondary' : 'ghost'}
      onClick={() => setSelectedId(item.id)}
    >
      {item.title}
    </Button>
  )}
/>

<Button onClick={() => listRef.current?.scrollToIndex(249, { align: 'center' })}>
  ${copy.middle}
</Button>`;

  function prependItem() {
    const id = `new-${nextItemRef.current++}`;
    setItems(current => [{
      id,
      number: Number(id.slice(4)),
      added: true,
    }, ...current]);
    setSelectedId(id);
    requestAnimationFrame(() => listRef.current?.scrollToIndex(0, { align: 'start' }));
  }

  function removeSelected() {
    if (!selectedId) return;
    setItems(current => current.filter(item => item.id !== selectedId));
    setSelectedId(null);
  }

  function restoreItems() {
    setItems(initialItems);
    setSelectedId('note-3');
    requestAnimationFrame(() => listRef.current?.scrollToIndex(0, { align: 'start' }));
  }

  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '布局', content: <>
        <Switch label={copy.dynamic} checked={dynamic} onCheckedChange={setDynamic} />
        <DocsSelect
          label={copy.overscan}
          value={String(overscan)}
          onValueChange={value => setOverscan(Number(value))}
          options={[["2", "2"], ["6", "6"], ["12", "12"]]}
        />
      </> },
      { label: '交互', content: <>
        <Button size="sm" variant="outline" onClick={() => listRef.current?.scrollToIndex(0, { align: 'start' })}>{copy.first}</Button>
        <Button size="sm" variant="outline" onClick={() => listRef.current?.scrollToIndex(Math.min(249, items.length - 1), { align: 'center' })} disabled={items.length === 0}>{copy.middle}</Button>
        <Button size="sm" variant="outline" onClick={() => listRef.current?.scrollToIndex(items.length - 1, { align: 'end' })} disabled={items.length === 0}>{copy.last}</Button>
      </> },
      { label: '内容', content: <>
        <Button data-testid="virtual-list-add" size="sm" variant="outline" onClick={prependItem}>{copy.add}</Button>
        <Button data-testid="virtual-list-remove" size="sm" variant="outline" onClick={removeSelected} disabled={selectedIndex < 0}>{copy.remove}</Button>
        <Button data-testid="virtual-list-clear" size="sm" variant="ghost" onClick={() => { setItems([]); setSelectedId(null); }}>{copy.clear}</Button>
        <Button data-testid="virtual-list-restore" size="sm" variant="ghost" onClick={restoreItems}>{copy.restore}</Button>
      </> },
    ]} />}>
      <div className="virtual-list-examples__playground">
        <VirtualList
          ref={listRef}
          aria-label={copy.list}
          data-testid="virtual-list-playground"
          emptyLabel={copy.empty}
          estimateSize={dynamic ? 120 : 80}
          data-dynamic={dynamic || undefined}
          getItemProps={({ item }) => ({ className: item.id === selectedId ? 'is-selected' : undefined })}
          height="22rem"
          itemKey={item => item.id}
          items={localizedItems}
          listLabel={copy.list}
          measureItems={dynamic}
          overscan={overscan}
          renderItem={({ item, index }) => <Button
            align="start"
            aria-pressed={selectedId === item.id}
            className="virtual-list-examples__item-button"
            fullWidth
            onClick={() => setSelectedId(item.id)}
            variant={selectedId === item.id ? 'secondary' : 'ghost'}
          >
            <span className="virtual-list-examples__item-copy">
              <PencilText ellipsis>{item.title}</PencilText>
              <small><PencilText ellipsis>{item.meta}</PencilText></small>
              {dynamic && <PencilText className="virtual-list-examples__detail">{item.detail}</PencilText>}
              <span className="visually-hidden">{index + 1} / {items.length}</span>
            </span>
          </Button>}
          ssrItemCount={6}
        />
        <output className="virtual-list-examples__selection" aria-live="polite">
          <PencilText>{`${copy.selected}: ${selectedId ?? '—'}`}</PencilText>
        </output>
      </div>
    </ComponentPlayground>

    <ComponentExample title={copy.external} code={`const viewportRef = useRef<HTMLDivElement>(null);\n\n<PencilSurface>\n  <div ref={viewportRef} className="scroll-viewport">\n    <VirtualList\n      items={items}\n      itemKey={item => item.id}\n      estimateSize={72}\n      measureItems\n      getScrollElement={() => viewportRef.current}\n      renderItem={({ item }) => <NoteRow item={item} />}\n    />\n  </div>\n</PencilSurface>`}>
      <ExternalScrollExample items={externalItems} label={copy.external} />
    </ComponentExample>

    <ComponentExample title={copy.emptyTitle} code={`<VirtualList\n  items={[]}\n  itemKey={item => item.id}\n  estimateSize={80}\n  emptyLabel="${copy.empty}"\n  renderItem={({ item }) => <NoteRow item={item} />}\n/>`}>
      <div className="virtual-list-examples__empty-frame">
        <VirtualList
          aria-label={copy.emptyList}
          emptyLabel={copy.empty}
          estimateSize={80}
          itemKey={item => item.id}
          items={[] as readonly LocalizedNote[]}
          renderItem={({ item }) => item.title}
        />
      </div>
    </ComponentExample>
  </>;
}
