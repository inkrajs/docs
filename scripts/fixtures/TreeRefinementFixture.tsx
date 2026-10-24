import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PencilIcon, Tree, type TreeKey, type TreeSelection } from '@inkra/react';

const folderPaths = [{ d: 'M3 6h7l2 2h9v11H3Z' }] as const;
const longTitle = 'A deeply nested destination with a deliberately long title that must remain readable in a narrow tree';

type Events = {
  expanded: string[][];
  selected: string[][];
};

function keys(selection: TreeSelection): string[] {
  return selection === 'all' ? ['*'] : [...selection].map(String);
}

function node(title: string, description?: string, icon = false) {
  return <Tree.ItemContent icon={icon ? <PencilIcon paths={folderPaths} size={22} sourceSize={24} /> : undefined}>
    <Tree.ItemTitle>{title}</Tree.ItemTitle>
    {description ? <Tree.ItemDescription>{description}</Tree.ItemDescription> : null}
  </Tree.ItemContent>;
}

function Fixture({ events }: { events: Events }) {
  const [expandedKeys, setExpandedKeys] = useState<Set<TreeKey>>(new Set(['root']));
  const [selectedKeys, setSelectedKeys] = useState<TreeSelection>(new Set(['child-a']));

  return <main style={{ display: 'grid', gap: 24, maxWidth: 760, padding: 24 }}>
    <section data-testid="controlled-case">
      <Tree.Root aria-label="Controlled project tree" disabledKeys={['disabled']} expandedKeys={expandedKeys}
        onExpandedChange={next => { setExpandedKeys(new Set(next)); events.expanded.push([...next].map(String)); }}
        onSelectionChange={next => { setSelectedKeys(next); events.selected.push(keys(next)); }}
        selectedKeys={selectedKeys} selectionMode="multiple">
        <Tree.Item id="root" textValue="Root folder">
          {node('Root folder', 'Top level folder', true)}
          <Tree.Item id="child-a" textValue="Child A">{node('Child A')}</Tree.Item>
          <Tree.Item id="branch" textValue="Branch folder">
            {node('Branch folder', undefined, true)}
            <Tree.Item id="grandchild" textValue="Grandchild">{node('Grandchild')}</Tree.Item>
          </Tree.Item>
          <Tree.Item id="disabled" textValue="Disabled item">{node('Disabled item')}</Tree.Item>
        </Tree.Item>
        <Tree.Item id="last" textValue="Last item">{node('Last item')}</Tree.Item>
      </Tree.Root>
    </section>

    <section data-testid="narrow-case" style={{ inlineSize: 220, minInlineSize: 0, overflow: 'hidden' }}>
      <Tree.Root aria-label="Narrow deep tree" defaultExpandedKeys={['level-1', 'level-2', 'level-3', 'level-4', 'level-5']}
        indent={40} selectionMode="single">
        <Tree.Item id="level-1" textValue="Level one">
          {node('Level one', undefined, true)}
          <Tree.Item id="level-2" textValue="Level two">
            {node('Level two', undefined, true)}
            <Tree.Item id="level-3" textValue="Level three">
              {node('Level three', undefined, true)}
              <Tree.Item id="level-4" textValue="Level four">
                {node('Level four', undefined, true)}
                <Tree.Item id="level-5" textValue="Level five">
                  {node('Level five', undefined, true)}
                  <Tree.Item id="deep-long" textValue={longTitle}>
                    {node(longTitle, 'Long supporting text also stays within the row.', true)}
                  </Tree.Item>
                </Tree.Item>
              </Tree.Item>
            </Tree.Item>
          </Tree.Item>
        </Tree.Item>
      </Tree.Root>
    </section>

    <section data-testid="rtl-case" dir="rtl" style={{ inlineSize: 260, minInlineSize: 0 }}>
      <Tree.Root aria-label="RTL project tree" defaultExpandedKeys={['rtl-root']} dir="rtl" indent={32}>
        <Tree.Item id="rtl-root" textValue="RTL root">
          {node('RTL root', undefined, true)}
          <Tree.Item id="rtl-child" textValue="RTL child">{node('RTL child')}</Tree.Item>
        </Tree.Item>
      </Tree.Root>
    </section>
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const events: Events = { expanded: [], selected: [] };
  root.render(<Fixture events={events} />);
  return { events, longTitle, unmount: () => root.unmount() };
}
