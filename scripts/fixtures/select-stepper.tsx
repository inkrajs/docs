import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Field, Select } from '@inkra/react';

const items = [
  { value: 'private', label: 'Private' },
  { value: 'team', label: 'Team', disabled: true },
  { value: 'public', label: 'Public' },
];

const allDisabledItems = items.map(item => ({ ...item, disabled: true }));
const pristineResetItems = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
];
const sizes = ['sm', 'md', 'lg'] as const;

type FixtureEvents = {
  controlled: string[];
  normalResets: number;
  canceledResets: number;
  requiredSubmissions: Array<Record<string, FormDataEntryValue>>;
  readonlySubmissions: Array<Record<string, FormDataEntryValue>>;
};

type FixtureControls = {
  setMissingAvailable?: (available: boolean) => void;
};

function SelectStepperFixture({ controls, events }: { controls: FixtureControls; events: FixtureEvents }) {
  const [controlled, setControlled] = useState('private');
  const [missingAvailable, setMissingAvailable] = useState(false);
  controls.setMissingAvailable = setMissingAvailable;

  return <main style={{ display: 'grid', gap: 24, maxWidth: 760, padding: 24 }}>
    <section data-testid="controlled-case">
      <Field label="Controlled selection">
        <Select.Stepper
          items={items}
          nextLabel="Next controlled option"
          onValueChange={next => {
            setControlled(next);
            events.controlled.push(next);
          }}
          previousLabel="Previous controlled option"
          value={controlled}
        />
      </Field>
    </section>

    <section data-testid="loop-case">
      <Field label="Looping selection">
        <Select.Stepper
          defaultValue="private"
          items={items}
          loop
          nextLabel="Next loop option"
          previousLabel="Previous loop option"
        />
      </Field>
    </section>

    <section data-testid="keyboard-case">
      <Field label="Keyboard selection">
        <Select.Stepper
          defaultValue="private"
          items={items}
          nextLabel="Next keyboard option"
          previousLabel="Previous keyboard option"
        />
      </Field>
    </section>

    <section data-testid="rtl-case" dir="rtl">
      <Field label="RTL selection">
        <Select.Stepper
          defaultValue="public"
          dir="rtl"
          items={items}
          nextLabel="Next RTL option"
          previousLabel="Previous RTL option"
        />
      </Field>
    </section>

    <form aria-label="Normal reset form" data-testid="normal-reset-form" onReset={() => { events.normalResets += 1; }}>
      <Field label="Normal reset selection">
        <Select.Stepper
          defaultValue="public"
          items={items}
          name="normalVisibility"
          nextLabel="Next normal reset option"
          previousLabel="Previous normal reset option"
        />
      </Field>
      <Button type="reset">Reset normal selection</Button>
    </form>

    <form aria-label="Pristine reset form" data-testid="pristine-reset-form">
      <Field label="Pristine reset selection">
        <Select.Stepper
          defaultValue="b"
          items={pristineResetItems}
          name="pristineVisibility"
          nextLabel="Next pristine reset option"
          previousLabel="Previous pristine reset option"
        />
      </Field>
      <Button type="reset">Reset pristine selection</Button>
    </form>

    <form
      aria-label="Canceled reset form"
      data-testid="canceled-reset-form"
      onReset={event => {
        events.canceledResets += 1;
        event.preventDefault();
      }}
    >
      <Field label="Canceled reset selection">
        <Select.Stepper
          defaultValue="public"
          items={items}
          name="canceledVisibility"
          nextLabel="Next canceled reset option"
          previousLabel="Previous canceled reset option"
        />
      </Field>
      <Button type="reset">Reset canceled selection</Button>
    </form>

    <form
      aria-label="Required form"
      data-testid="required-form"
      onSubmit={event => {
        event.preventDefault();
        events.requiredSubmissions.push(Object.fromEntries(new FormData(event.currentTarget)));
      }}
    >
      <Field label="Required selection" required>
        <Select.Stepper
          items={items}
          name="requiredVisibility"
          nextLabel="Next required option"
          placeholder="Choose required visibility"
          previousLabel="Previous required option"
          required
        />
      </Field>
      <Button type="submit">Submit required selection</Button>
    </form>

    <form
      aria-label="Readonly required form"
      data-testid="readonly-required-form"
      onSubmit={event => {
        event.preventDefault();
        events.readonlySubmissions.push(Object.fromEntries(new FormData(event.currentTarget)));
      }}
    >
      <Field label="Readonly required selection" readOnly required>
        <Select.Stepper
          items={items}
          name="readonlyVisibility"
          nextLabel="Next readonly option"
          placeholder="Readonly empty visibility"
          previousLabel="Previous readonly option"
          readOnly
          required
        />
      </Field>
      <Button type="submit">Submit readonly selection</Button>
    </form>

    <section data-testid="empty-case">
      <Field label="Empty items selection">
        <Select.Stepper
          items={[]}
          nextLabel="Next empty option"
          placeholder="No options"
          previousLabel="Previous empty option"
        />
      </Field>
    </section>

    <section data-testid="disabled-items-case">
      <Field label="Disabled items selection">
        <Select.Stepper
          items={allDisabledItems}
          nextLabel="Next disabled option"
          placeholder="No enabled options"
          previousLabel="Previous disabled option"
        />
      </Field>
    </section>

    <section data-testid="missing-case">
      <Field label="Missing value selection">
        <Select.Stepper
          defaultValue="removed"
          items={missingAvailable ? [...items, { value: 'removed', label: 'Restored' }] : items}
          name="missingVisibility"
          nextLabel="Next missing option"
          placeholder="Missing option"
          previousLabel="Previous missing option"
        />
      </Field>
    </section>

    <section data-testid="size-cases" style={{ display: 'grid', gap: 16 }}>
      {sizes.map(size => <div data-stepper-size={size} key={size}>
        <Field label={`${size} selection`}>
          <Select.Stepper
            defaultValue="private"
            items={items}
            nextLabel={`Next ${size} option`}
            previousLabel={`Previous ${size} option`}
            size={size}
          />
        </Field>
      </div>)}
    </section>
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const events: FixtureEvents = {
    controlled: [],
    normalResets: 0,
    canceledResets: 0,
    requiredSubmissions: [],
    readonlySubmissions: [],
  };
  const controls: FixtureControls = {};
  root.render(<SelectStepperFixture controls={controls} events={events} />);
  return {
    events,
    setMissingAvailable: (available: boolean) => controls.setMissingAvailable?.(available),
    unmount: () => root.unmount(),
  };
}
