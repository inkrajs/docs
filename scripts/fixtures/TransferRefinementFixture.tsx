import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Transfer, type TransferItem } from '@inkra/react';

const items: TransferItem[] = [
  { id: 'alpha', label: 'Alpha', description: 'First item' },
  { id: 'beta', label: 'Beta', description: 'Second item' },
  { id: 'gamma', label: 'Gamma', description: 'Third item' },
];

const labels = {
  sourceTitle: 'Available',
  targetTitle: 'Selected',
  moveToTarget: 'Move to selected',
  moveToSource: 'Move to available',
  moveSelectedToTarget: 'Move checked to selected',
  moveSelectedToSource: 'Move checked to available',
};

type Events = {
  delayedProposals: string[][];
  rejectedProposals: string[][];
  movedFocusProposals: string[][];
  batchProposals: string[][];
};

function Fixture({ events }: { events: Events }) {
  const [delayedKeys, setDelayedKeys] = useState<string[]>([]);
  const [rejectedKeys, setRejectedKeys] = useState<string[]>([]);
  const [movedFocusKeys, setMovedFocusKeys] = useState<string[]>([]);
  const [batchKeys, setBatchKeys] = useState<string[]>([]);

  return <main style={{ display: 'grid', gap: 28, padding: 24 }}>
    <section data-testid="wide-layout" style={{ inlineSize: 920, maxInlineSize: '100%' }}>
      <Transfer items={items} defaultTargetKeys={['gamma']} labels={labels} searchable={false} />
    </section>

    <section data-testid="narrow-layout" style={{ inlineSize: 560, maxInlineSize: '100%' }}>
      <Transfer items={items} defaultTargetKeys={['gamma']} labels={labels} searchable={false} />
    </section>

    <section data-testid="rtl-wide-layout" dir="rtl" style={{ inlineSize: 920, maxInlineSize: '100%' }}>
      <Transfer items={items} defaultTargetKeys={['gamma']} labels={labels} searchable={false} />
    </section>

    <section data-testid="rtl-narrow-layout" dir="rtl" style={{ inlineSize: 560, maxInlineSize: '100%' }}>
      <Transfer items={items} defaultTargetKeys={['gamma']} labels={labels} searchable={false} />
    </section>

    <section data-testid="delayed-controlled">
      <Transfer items={items} labels={labels} searchable={false} targetKeys={delayedKeys}
        onTargetKeysChange={next => {
          events.delayedProposals.push(next);
          setTimeout(() => setDelayedKeys(next), 80);
        }} />
    </section>

    <section data-testid="rejected-controlled">
      <Transfer items={items} labels={labels} searchable={false} targetKeys={rejectedKeys}
        onTargetKeysChange={next => {
          events.rejectedProposals.push(next);
          setTimeout(() => setRejectedKeys(['beta']), 80);
        }} />
    </section>

    <section data-testid="moved-focus-controlled">
      <Transfer items={items} labels={labels} searchable={false} targetKeys={movedFocusKeys}
        onTargetKeysChange={next => {
          events.movedFocusProposals.push(next);
          setTimeout(() => setMovedFocusKeys(next), 80);
        }} />
      <Button data-testid="outside-focus">Outside focus</Button>
    </section>

    <section data-testid="batch-controlled">
      <Transfer items={items} labels={labels} searchable={false} targetKeys={batchKeys}
        onTargetKeysChange={next => {
          events.batchProposals.push(next);
          setTimeout(() => setBatchKeys(next), 80);
        }} />
    </section>
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const events: Events = { delayedProposals: [], rejectedProposals: [], movedFocusProposals: [], batchProposals: [] };
  root.render(<Fixture events={events} />);
  return { events, unmount: () => root.unmount() };
}
