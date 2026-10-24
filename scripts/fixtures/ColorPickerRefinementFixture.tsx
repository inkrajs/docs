import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, ColorPicker } from '@inkra/react';

type Events = {
  changes: string[];
  controlledChanges: string[];
  equivalentChanges: string[];
  imeChanges: string[];
  disabledChanges: string[];
  invalid: string[];
};

const labels = {
  palette: 'Open test palette',
  value: 'Test color value',
  alpha: 'Test opacity',
  presets: 'Test presets',
  invalid: 'Invalid test color',
};

function Fixture({ events }: { events: Events }) {
  const [controlledValue, setControlledValue] = useState('#33669980');

  return <main style={{ display: 'grid', gap: 24, maxWidth: 720, padding: 24 }}>
    <form data-testid="reset-form">
      <ColorPicker defaultValue="#abc" labels={labels} name="resetColor" presets={[{ value: '#123', label: 'Reset preset' }]}
        onInvalidInput={input => events.invalid.push(input)}
        onValueChange={(value, details) => events.changes.push(`${details.source}:${value}`)} />
      <Button type="reset">Reset color</Button>
    </form>

    <form data-testid="canceled-reset-form" onReset={event => event.preventDefault()}>
      <ColorPicker defaultValue="#456" labels={labels} name="canceledColor"
        onValueChange={(value, details) => events.changes.push(`canceled-${details.source}:${value}`)} />
      <Button type="reset">Cancel color reset</Button>
    </form>

    <form data-testid="external-form" id="external-color-form">
      <Button type="reset">Reset external color</Button>
    </form>
    <section data-testid="external-case">
      <ColorPicker defaultValue="#789" form="external-color-form" labels={labels} name="externalColor"
        onValueChange={(value, details) => events.changes.push(`external-${details.source}:${value}`)} />
    </section>

    <form data-testid="controlled-form">
      <ColorPicker labels={labels} name="controlledColor" value={controlledValue}
        onValueChange={(value, details) => events.controlledChanges.push(`${details.source}:${value}`)} />
      <Button onClick={() => setControlledValue('#abcdef40')}>Set controlled color</Button>
      <Button type="reset">Reset controlled color</Button>
    </form>

    <section data-testid="equivalent-case">
      <ColorPicker defaultValue="#abc" labels={labels} name="equivalentColor"
        onValueChange={(value, details) => events.equivalentChanges.push(`${details.source}:${value}`)} />
    </section>

    <section data-testid="ime-case">
      <ColorPicker defaultValue="#246" labels={labels} name="imeColor"
        onValueChange={(value, details) => events.imeChanges.push(`${details.source}:${value}`)} />
    </section>

    <section data-testid="disabled-case">
      <ColorPicker defaultValue="#135" disabled labels={labels} name="disabledColor"
        presets={[{ value: '#fff', label: 'Disabled preset' }]}
        onValueChange={(value, details) => events.disabledChanges.push(`${details.source}:${value}`)} />
    </section>

    <section data-testid="focus-case">
      <ColorPicker defaultValue="#369" labels={labels} presets={[{ value: '#fff', label: 'Focus preset' }]} />
    </section>
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const events: Events = {
    changes: [],
    controlledChanges: [],
    equivalentChanges: [],
    imeChanges: [],
    disabledChanges: [],
    invalid: [],
  };
  root.render(<Fixture events={events} />);
  return { events, unmount: () => root.unmount() };
}
