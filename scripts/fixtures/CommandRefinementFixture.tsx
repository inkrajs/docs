import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Command } from '@inkra/react';

type Events = {
  active: string[];
  controlledSearch: string[];
  selected: string[];
};

function Items({ onSelect }: { onSelect: (value: string) => void }) {
  return <Command.List label="Command results">
    <Command.Empty>No matching commands</Command.Empty>
    <Command.Item value="alpha" keywords={['first']} onSelect={onSelect}>Alpha action</Command.Item>
    <Command.Item value="beta" keywords={['second']} onSelect={onSelect}>Beta action</Command.Item>
    <Command.Item value="disabled" disabled onSelect={onSelect}>Disabled action</Command.Item>
    <Command.Item value="omega" onSelect={onSelect}>Omega action</Command.Item>
  </Command.List>;
}

function Fixture({ events }: { events: Events }) {
  const [active, setActive] = useState('alpha');
  const [search, setSearch] = useState('');
  const controlledRef = useRef<HTMLInputElement>(null);
  const select = (value: string) => { events.selected.push(value); };

  return <main style={{ display: 'grid', gap: 24, maxWidth: 720, padding: 24 }}>
    <section data-testid="controlled-case">
      <button type="button" data-testid="focus-controlled" onClick={() => controlledRef.current?.focus()}>Focus command search</button>
      <Command.Root label="Controlled commands" loop value={active} onValueChange={next => {
        events.active.push(next);
        setActive(next);
      }}>
        <Command.Input ref={controlledRef} value={search} onValueChange={next => {
          events.controlledSearch.push(next);
          setSearch(next);
        }} placeholder="Search controlled commands" />
        <Items onSelect={select} />
      </Command.Root>
      <output data-testid="controlled-values">{search}:{active}</output>
    </section>

    <section data-testid="uncontrolled-case">
      <Command.Root label="Uncontrolled commands" loop>
        <Command.Input placeholder="Search uncontrolled commands" />
        <Items onSelect={select} />
      </Command.Root>
    </section>

    <section data-testid="narrow-case" style={{ inlineSize: 224, maxInlineSize: '100%', minInlineSize: 0 }}>
      <div data-testid="host-surface" style={{ border: '1px solid currentColor', minInlineSize: 0 }}>
        <Command.Root label="Embedded narrow commands" surface={false}>
          <Command.Input placeholder="Search narrow commands" />
          <Command.List label="Narrow results">
            <Command.Item value="long-no-icon" shortcut="Command Shift Option VeryLongShortcut">
              A very long command label without an icon that must wrap inside the available row width
            </Command.Item>
            <Command.Item value="long-with-icon" icon={<span aria-hidden="true">#</span>} shortcut="Control Alt P">
              Another long command label with an optional icon
            </Command.Item>
          </Command.List>
        </Command.Root>
      </div>
    </section>
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const events: Events = { active: [], controlledSearch: [], selected: [] };
  root.render(<Fixture events={events} />);
  return { events, unmount: () => root.unmount() };
}
