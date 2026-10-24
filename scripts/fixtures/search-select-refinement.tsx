import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Field, Select } from '@inkra/react';

const items = [
  { value: 'private', label: 'Private workspace' },
  { value: 'team', label: 'Team workspace', keywords: 'shared' },
  { value: 'public', label: 'Public workspace', disabled: true },
  { value: 'archive', label: 'A very long archived workspace label that must not move either action' },
];
const sizes = ['sm', 'md', 'lg'] as const;

type Events = {
  triggerOpen: boolean[];
  popupOpen: boolean[];
  triggerValues: Array<string | null>;
  popupValues: Array<string | null>;
  multipleValues: string[][];
  resetValues: Array<string | null>;
  canceledResetValues: Array<string | null>;
  externalResetValues: Array<string | null>;
  controlledResetValues: Array<string | null>;
  requiredSubmissions: Array<Record<string, FormDataEntryValue>>;
};

function Fixture({ events }: { events: Events }) {
  const [triggerValue, setTriggerValue] = useState<string | null>('archive');
  const [popupValue, setPopupValue] = useState<string | null>('archive');
  const [multipleValue, setMultipleValue] = useState<string[]>(['private', 'team']);
  const [controlledResetValue, setControlledResetValue] = useState<string | null>('private');

  return <main style={{ display: 'grid', gap: 24, maxWidth: 820, padding: 24 }}>
    <section data-testid="trigger-case">
      <Field label="Trigger search">
        <Select.Searchable
          clearLabel="Clear trigger selection"
          items={items}
          name="triggerVisibility"
          onOpenChange={next => events.triggerOpen.push(next)}
          onValueChange={next => { setTriggerValue(next); events.triggerValues.push(next); }}
          openLabel="Open trigger options"
          placeholder="Choose trigger visibility"
          searchPlacement="trigger"
          value={triggerValue}
        />
      </Field>
    </section>

    <section data-testid="popup-case">
      <Field label="Popup search">
        <Select.Searchable
          clearLabel="Clear popup selection"
          items={items}
          name="popupVisibility"
          onOpenChange={next => events.popupOpen.push(next)}
          onValueChange={next => { setPopupValue(next); events.popupValues.push(next); }}
          placeholder="Choose popup visibility"
          searchPlacement="popup"
          searchPlaceholder="Filter popup options"
          value={popupValue}
        />
      </Field>
    </section>

    <section data-testid="multiple-case">
      <Field label="Multiple search">
        <Select.Searchable
          clearLabel="Clear multiple selection"
          items={items}
          multiple
          name="multipleVisibility"
          onValueChange={next => { setMultipleValue(next); events.multipleValues.push(next); }}
          openLabel="Open multiple options"
          searchPlacement="trigger"
          value={multipleValue}
        />
      </Field>
    </section>

    <form data-testid="reset-form">
      <Field label="Reset search">
        <Select.Searchable clearLabel="Clear reset selection" defaultValue="team" items={items}
          name="resetVisibility" onValueChange={next => events.resetValues.push(next)} searchPlacement="popup" />
      </Field>
      <Button type="reset">Reset searchable selection</Button>
    </form>

    <form data-testid="canceled-reset-form" onReset={event => event.preventDefault()}>
      <Field label="Canceled reset search">
        <Select.Searchable clearLabel="Clear canceled reset selection" defaultValue="team" items={items}
          name="canceledResetVisibility" onValueChange={next => events.canceledResetValues.push(next)} searchPlacement="popup" />
      </Field>
      <Button type="reset">Cancel searchable reset</Button>
    </form>

    <form data-testid="external-reset-form" id="external-search-reset-form">
      <Button type="reset">Reset external searchable selection</Button>
    </form>
    <section data-testid="external-reset-case">
      <Field label="External reset search">
        <Select.Searchable clearLabel="Clear external reset selection" defaultValue="team"
          form="external-search-reset-form" items={items} name="externalResetVisibility"
          onValueChange={next => events.externalResetValues.push(next)} searchPlacement="popup" />
      </Field>
    </section>

    <form data-testid="controlled-reset-form">
      <Field label="Controlled reset search">
        <Select.Searchable clearLabel="Clear controlled reset selection" items={items}
          name="controlledResetVisibility" onValueChange={next => events.controlledResetValues.push(next)}
          searchPlacement="popup" value={controlledResetValue} />
      </Field>
      <Button onClick={() => setControlledResetValue('team')}>Set controlled search to team</Button>
      <Button type="reset">Reset controlled searchable selection</Button>
    </form>

    <form data-testid="required-form" onSubmit={event => {
      event.preventDefault();
      events.requiredSubmissions.push(Object.fromEntries(new FormData(event.currentTarget)));
    }}>
      <Field label="Required search" required>
        <Select.Searchable clearLabel="Clear required selection" items={items}
          name="requiredVisibility" required searchPlacement="popup" />
      </Field>
      <Button type="submit">Submit required search</Button>
    </form>

    <section data-testid="disabled-case">
      <Field disabled label="Disabled search"><Select.Searchable clearLabel="Clear disabled selection"
        defaultValue="team" items={items} openLabel="Open disabled options" searchPlacement="trigger" /></Field>
    </section>

    <section data-testid="readonly-case">
      <Field label="Readonly search" readOnly><Select.Searchable clearLabel="Clear readonly selection"
        defaultValue="team" items={items} openLabel="Open readonly options" searchPlacement="trigger" /></Field>
    </section>

    <section data-testid="rtl-case" dir="rtl">
      <Field label="RTL search"><Select.Searchable clearLabel="Clear RTL selection" defaultValue="archive"
        dir="rtl" items={items} openLabel="Open RTL options" searchPlacement="trigger" /></Field>
    </section>

    <section data-testid="size-cases" style={{ display: 'grid', gap: 16 }}>
      {sizes.flatMap(size => (['trigger', 'popup'] as const).map(placement => <div
        data-search-placement={placement} data-search-size={size} key={`${size}-${placement}`}>
        <Field label={`${size} ${placement} search`}><Select.Searchable
          clearLabel={`Clear ${size} ${placement} selection`} defaultValue="team" items={items}
          openLabel={`Open ${size} ${placement} options`} searchPlacement={placement} size={size} /></Field>
      </div>))}
    </section>
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const events: Events = {
    triggerOpen: [],
    popupOpen: [],
    triggerValues: [],
    popupValues: [],
    multipleValues: [],
    resetValues: [],
    canceledResetValues: [],
    externalResetValues: [],
    controlledResetValues: [],
    requiredSubmissions: [],
  };
  root.render(<Fixture events={events} />);
  return { events, unmount: () => root.unmount() };
}
