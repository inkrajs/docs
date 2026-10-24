import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, TreeSelect, type TreeSelectChangeDetails, type TreeSelectNode } from '@inkra/react';

const longLabel = 'A deliberately long destination label that should remain on one line and truncate inside the shared control';
const items: TreeSelectNode[] = [
  { id: 'short', label: 'Short destination' },
  { id: 'long', label: longLabel },
  { id: 'archive', label: 'Archive', children: [
    { id: 'reports', label: 'Reports' },
    { id: 'locked', label: 'Locked', disabled: true },
  ] },
];

type TreeSelectRefinementEvents = {
  clear: string[];
  controlled: Array<{ value: string | null; reason: TreeSelectChangeDetails['reason'] }>;
  externalReset: number;
  internalReset: number;
  preventedReset: number;
};

type TreeSelectRefinementControls = {
  setControlledValue?: (value: string | null) => void;
};

function Fixture({ controls, events }: { controls: TreeSelectRefinementControls; events: TreeSelectRefinementEvents }) {
  const [controlledValue, setControlledValue] = useState<string | null>('short');
  controls.setControlledValue = setControlledValue;

  return <main style={{ display: 'grid', gap: 24, maxWidth: 760, padding: 24 }}>
    <section data-testid="sizes" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'minmax(0, 240px)', inlineSize: 240, minInlineSize: 0 }}>
      {(['sm', 'md', 'lg'] as const).map(size => <div
        data-testid={`size-${size}`}
        key={size}
        style={{ inlineSize: 240, maxInlineSize: 240, minInlineSize: 0 }}
      >
        <TreeSelect
          aria-label={`Destination ${size}`}
          clearLabel={`Clear ${size}`}
          defaultValue="long"
          items={items}
          size={size}
        />
      </div>)}
    </section>

    <section data-testid="states" dir="rtl" style={{ display: 'grid', gap: 12, width: 360 }}>
      <TreeSelect aria-label="Readonly destination" clearLabel="Clear readonly" defaultValue="long" invalid items={items} readOnly size="sm" />
      <TreeSelect aria-label="Disabled destination" clearLabel="Clear disabled" defaultValue="short" disabled items={items} size="lg" />
    </section>

    <form aria-label="Internal reset form" data-testid="internal-form" onReset={() => { events.internalReset += 1; }}>
      <TreeSelect
        aria-label="Internal destination"
        clearLabel="Clear internal"
        defaultValue="short"
        items={items}
        name="internal-destination"
        onValueChange={(_, details) => { if (details.reason === 'clear') events.clear.push('internal'); }}
        searchPlaceholder="Search internal"
      />
      <Button type="reset">Reset internal</Button>
    </form>

    <form aria-label="Prevented reset form" data-testid="prevented-form" onReset={event => {
      events.preventedReset += 1;
      event.preventDefault();
    }}>
      <TreeSelect
        aria-label="Prevented destination"
        clearLabel="Clear prevented"
        defaultValue="short"
        items={items}
        name="prevented-destination"
      />
      <Button type="reset">Reset prevented</Button>
    </form>

    <form aria-label="External reset form" data-testid="external-form" id="tree-select-external-form" onReset={() => { events.externalReset += 1; }}>
      <Button type="reset">Reset external</Button>
    </form>
    <section data-testid="external-control" style={{ width: 360 }}>
      <TreeSelect
        aria-label="External destination"
        clearLabel="Clear external"
        defaultValue="short"
        form="tree-select-external-form"
        items={items}
        name="external-destination"
      />
    </section>

    <form aria-label="Controlled reset form" data-testid="controlled-form">
      <TreeSelect
        aria-label="Controlled destination"
        clearLabel="Clear controlled"
        items={items}
        name="controlled-destination"
        onValueChange={(value, details) => {
          setControlledValue(value);
          events.controlled.push({ value, reason: details.reason });
        }}
        value={controlledValue}
      />
      <Button type="reset">Reset controlled</Button>
    </form>
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const controls: TreeSelectRefinementControls = {};
  const events: TreeSelectRefinementEvents = {
    clear: [],
    controlled: [],
    externalReset: 0,
    internalReset: 0,
    preventedReset: 0,
  };
  root.render(<Fixture controls={controls} events={events} />);
  return {
    events,
    longLabel,
    setControlledValue: (value: string | null) => controls.setControlledValue?.(value),
    unmount: () => root.unmount(),
  };
}
