import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Log, type LogEntry, type LogLevelDefinition } from '@inkra/react';

const levels: readonly LogLevelDefinition[] = [
  { value: 'info', label: 'Extremely long informational records label for a narrow toolbar', tone: 'info' },
  { value: 'warning', label: 'Warning records with a deliberately long filter name', tone: 'warning' },
];

const initialItems: readonly LogEntry[] = Array.from({ length: 8 }, (_, index) => ({
  id: `record-${index + 1}`,
  level: index % 2 ? 'warning' : 'info',
  time: `10:${String(index).padStart(2, '0')}`,
  content: `Record ${index + 1} has enough text to remain readable and wrap inside a narrow log viewport.`,
}));

type Events = {
  controlledFilters: string[][];
  controlledPaused: boolean[];
  filters: string[][];
  paused: boolean[];
};

function Fixture({ events }: { events: Events }) {
  const [items, setItems] = useState<readonly LogEntry[]>(initialItems);
  const [paused, setPaused] = useState(false);
  const [filteredLevels, setFilteredLevels] = useState<readonly string[] | undefined>(undefined);
  const append = () => setItems(current => [...current, {
    id: `record-${current.length + 1}`,
    level: current.length % 2 ? 'warning' : 'info',
    time: `10:${String(current.length).padStart(2, '0')}`,
    content: `Record ${current.length + 1} appended in supplied order.`,
  }]);

  const labels = {
    filters: 'Long log filter controls', allLevels: 'All records with a long label',
    pause: 'Pause automatic following with a long action label', resume: 'Resume automatic following with a long action label',
    latest: 'Go to the latest record with a long action label', empty: 'No records yet', noMatches: 'No matching records', list: 'Refinement records',
  };

  return <main style={{ display: 'grid', gap: 24, maxWidth: 760, padding: 24 }}>
    <section data-testid="flex-auto-case" style={{ alignItems: 'center', display: 'flex', inlineSize: 320, justifyContent: 'center', minInlineSize: 0 }}>
      <Log items={items.slice(0, 2)} labels={labels} levels={levels} showFollowControl={false} />
    </section>

    <section data-testid="short-label-case" style={{ inlineSize: 320, minInlineSize: 0 }}>
      <Log defaultPaused items={items.slice(0, 2)} levels={levels}
        labels={{ ...labels, pause: 'Pause', resume: 'Resume', latest: 'Latest' }} />
    </section>

    <section data-testid="auto-case" style={{ inlineSize: 320, minInlineSize: 0 }}>
      <Log defaultPaused items={items.slice(0, 3)} labels={labels} levels={levels} />
    </section>

    <section data-testid="bounded-case" style={{ blockSize: 180, inlineSize: 320, minInlineSize: 0 }}>
      <Log items={items} labels={labels} levels={levels} paused={paused} style={{ blockSize: '100%', minBlockSize: 0 }}
        filteredLevels={filteredLevels}
        onFilteredLevelsChange={next => { events.filters.push([...next]); setFilteredLevels(next); }}
        onPausedChange={next => { events.paused.push(next); setPaused(next); }} />
    </section>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <Button onClick={append}>Append record</Button>
      <Button onClick={() => setItems(current => [...current].reverse())}>Reverse records</Button>
    </div>

    <section data-testid="controlled-rejected-case" style={{ blockSize: 180, inlineSize: 320, minInlineSize: 0 }}>
      <Log items={items} labels={labels} levels={levels} paused={false} filteredLevels={['info', 'warning']} style={{ blockSize: '100%', minBlockSize: 0 }}
        onFilteredLevelsChange={next => events.controlledFilters.push([...next])}
        onPausedChange={next => events.controlledPaused.push(next)} />
    </section>

    <section data-testid="empty-case" style={{ blockSize: 180, inlineSize: 320, minInlineSize: 0 }}>
      <Log items={[]} labels={labels} levels={levels} defaultPaused style={{ blockSize: '100%', minBlockSize: 0 }} />
    </section>

    <section data-testid="no-match-case" style={{ blockSize: 180, inlineSize: 320, minInlineSize: 0 }}>
      <Log items={items} labels={labels} levels={levels} filteredLevels={[]} style={{ blockSize: '100%', minBlockSize: 0 }} />
    </section>
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const events: Events = { controlledFilters: [], controlledPaused: [], filters: [], paused: [] };
  root.render(<Fixture events={events} />);
  return { events, unmount: () => root.unmount() };
}
