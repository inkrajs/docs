import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { DatePicker, Editable, Field, InkraProvider, Input, InputNumber, NumberTicker, Pagination, Select, TagInput, TimePicker } from '@inkra/react';
import { InkraProvider as ScopedProvider } from '@inkra/react/i18n';
import type { InkraDictionary } from '@inkra/react';

interface Settings { locale: string; messages?: InkraDictionary }
const items = [{ value: 'one', label: 'Business item' }];
function Fixture({ locale, messages, events }: Settings & { events: { mounts: number; unmounts: number } }) {
  useEffect(() => { events.mounts++; return () => { events.unmounts++; }; }, [events]);
  return <InkraProvider locale={locale} messages={messages}>
    <form data-testid="i18n-fixture" lang={locale} onSubmit={event => event.preventDefault()}
      style={{ padding: 20, display: 'grid', gap: 20, maxWidth: 760, margin: 'auto', minWidth: 0 }}>
      <Field label="Note"><Input name="note" defaultValue="Draft" clearable /></Field>
      <Field label="Quantity"><InputNumber name="quantity" defaultValue={2} /></Field>
      <Field label="Tags"><TagInput name="tags" defaultValue={[{ value: 'a', label: 'User {count} $& <img>' }]} /></Field>
      <Field label="Team"><Select.Searchable name="team" items={items} /></Field>
      <Field label="Date"><DatePicker name="date" defaultValue={new Date(2026, 9, 25)} /></Field>
      <Field label="Time"><TimePicker name="time" defaultValue="09:30" /></Field>
      <div data-testid="nested">
        <ScopedProvider messages={{ 'input.clear': 'Inner clear' }}>
          <Input aria-label="Nested note" defaultValue="Nested" clearable />
          <Editable defaultValue="Working title" defaultEditing validate={() => false} />
        </ScopedProvider>
      </div>
      <NumberTicker value={900719925474099312345n} animate={false} />
      <Pagination totalPages={5} />
    </form>
  </InkraProvider>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const events = { mounts: 0, unmounts: 0 };
  const update = (settings: Settings) => root.render(<Fixture {...settings} events={events} />);
  update({ locale: 'en' });
  return { update, events, unmount: () => root.unmount() };
}
