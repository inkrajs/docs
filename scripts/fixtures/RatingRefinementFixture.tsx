import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Rating } from '@inkra/react';

type Events = {
  values: number[];
  previews: Array<number | null>;
  canceledValues: number[];
  externalValues: number[];
  controlledAccepted: number[];
  controlledRejected: number[];
};

function Fixture({ events }: { events: Events }) {
  const [acceptedValue, setAcceptedValue] = useState(1);

  return <main style={{ display: 'grid', gap: 24, maxWidth: 760, padding: 24 }}>
    <form data-testid="reset-form">
      <Rating aria-label="Reset rating" clearable defaultValue={2.5} name="resetRating" step={0.5}
        onPreviewChange={value => events.previews.push(value)} onValueChange={value => events.values.push(value)} />
      <Button type="reset">Reset rating value</Button>
    </form>

    <form data-testid="canceled-reset-form" onReset={event => event.preventDefault()}>
      <Rating aria-label="Canceled rating" clearable defaultValue={2} name="canceledRating"
        onValueChange={value => events.canceledValues.push(value)} />
      <Button type="reset">Cancel rating reset</Button>
    </form>

    <form data-testid="external-form" id="external-rating-form">
      <Button type="reset">Reset external rating</Button>
    </form>
    <section data-testid="external-case">
      <Rating aria-label="External rating" clearable defaultValue={3} form="external-rating-form" name="externalRating"
        onValueChange={value => events.externalValues.push(value)} />
    </section>

    <form data-testid="controlled-form">
      <div style={{ inlineSize: 132 }}>
        <Rating aria-label="Accepted controlled rating" count={8} name="acceptedRating" value={acceptedValue}
          onValueChange={value => { events.controlledAccepted.push(value); setAcceptedValue(value); }} />
      </div>
      <Button type="reset">Reset accepted controlled rating</Button>
    </form>

    <section data-testid="rejected-controlled-case" style={{ inlineSize: 132 }}>
      <Rating aria-label="Rejected controlled rating" count={8} value={1}
        onValueChange={value => events.controlledRejected.push(value)} />
    </section>

    <section data-testid="narrow-case" style={{ inlineSize: 132 }}>
      <Rating aria-label="Narrow rating" count={8} defaultValue={1} />
    </section>

    <section data-testid="endpoint-case">
      <Rating aria-label="Endpoint rating" count={5} defaultValue={3} step={1.5} />
    </section>

    <section data-testid="integer-endpoint-case">
      <Rating aria-label="Integer endpoint rating" count={5} defaultValue={3} step={1} />
    </section>

    <section data-testid="rtl-endpoint-case">
      <Rating aria-label="RTL endpoint rating" count={5} defaultValue={3} dir="rtl" step={1.5} />
    </section>

    <section data-testid="rtl-case" dir="rtl" style={{ inlineSize: 132 }}>
      <Rating aria-label="RTL rating" count={8} defaultValue={1} dir="rtl" />
    </section>

    <section data-testid="readonly-case">
      <Rating aria-label="Readonly rating" clearable defaultValue={2} readOnly />
    </section>

    <section data-testid="disabled-case">
      <Rating aria-label="Disabled rating" clearable defaultValue={2} disabled />
    </section>
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const events: Events = {
    values: [],
    previews: [],
    canceledValues: [],
    externalValues: [],
    controlledAccepted: [],
    controlledRejected: [],
  };
  root.render(<Fixture events={events} />);
  return { events, unmount: () => root.unmount() };
}
