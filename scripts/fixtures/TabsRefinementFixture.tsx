import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Tabs } from '@inkra/react';

type Events = {
  rejected: string[];
  accepted: string[];
  automatic: string[];
  manual: string[];
};

function Fixture({ events }: { events: Events }) {
  const [accepted, setAccepted] = useState('one');
  const [automatic, setAutomatic] = useState('one');
  const [manual, setManual] = useState('one');

  return <main style={{ display: 'grid', gap: 24, maxWidth: 760, padding: 24 }}>
    <section data-testid="rejected-controlled">
      <Tabs.Root value="one" onValueChange={next => events.rejected.push(next)}>
        <Tabs.List aria-label="Rejected tabs"><Tabs.Trigger value="one">One</Tabs.Trigger><Tabs.Trigger value="two">Two</Tabs.Trigger></Tabs.List>
        <Tabs.Content value="one">Rejected one panel</Tabs.Content><Tabs.Content value="two">Rejected two panel</Tabs.Content>
      </Tabs.Root>
    </section>

    <section data-testid="accepted-controlled">
      <Tabs.Root value={accepted} onValueChange={next => { events.accepted.push(next); setAccepted(next); }}>
        <Tabs.List aria-label="Accepted tabs"><Tabs.Trigger value="one">One</Tabs.Trigger><Tabs.Trigger value="two">Two</Tabs.Trigger></Tabs.List>
        <Tabs.Content value="one">Accepted one panel</Tabs.Content><Tabs.Content value="two">Accepted two panel</Tabs.Content>
      </Tabs.Root>
    </section>

    <section data-testid="automatic-case">
      <Tabs.Root value={automatic} onValueChange={next => { events.automatic.push(next); setAutomatic(next); }}>
        <Tabs.List aria-label="Automatic tabs"><Tabs.Trigger value="one">One</Tabs.Trigger><Tabs.Trigger value="two" disabled>Two</Tabs.Trigger><Tabs.Trigger value="three">Three</Tabs.Trigger></Tabs.List>
        <Tabs.Content value="one">Automatic one</Tabs.Content><Tabs.Content value="three">Automatic three</Tabs.Content>
      </Tabs.Root>
    </section>

    <section data-testid="manual-case">
      <Tabs.Root activationMode="manual" value={manual} onValueChange={next => { events.manual.push(next); setManual(next); }}>
        <Tabs.List aria-label="Manual tabs"><Tabs.Trigger value="one">One</Tabs.Trigger><Tabs.Trigger value="two">Two</Tabs.Trigger></Tabs.List>
        <Tabs.Content value="one">Manual one</Tabs.Content><Tabs.Content value="two">Manual two</Tabs.Content>
      </Tabs.Root>
    </section>

    <section data-testid="rtl-case" dir="rtl">
      <Tabs.Root defaultValue="one" dir="rtl"><Tabs.List aria-label="RTL tabs"><Tabs.Trigger value="one">One</Tabs.Trigger><Tabs.Trigger value="two">Two</Tabs.Trigger></Tabs.List>
        <Tabs.Content value="one">RTL one</Tabs.Content><Tabs.Content value="two">RTL two</Tabs.Content></Tabs.Root>
    </section>

    <section data-testid="force-mount-case">
      <Tabs.Root defaultValue="one"><Tabs.List aria-label="Force mount tabs"><Tabs.Trigger value="one">One</Tabs.Trigger><Tabs.Trigger value="two">Two</Tabs.Trigger></Tabs.List>
        <Tabs.Content value="one">Force one</Tabs.Content><Tabs.Content forceMount value="two"><Button>Hidden action</Button></Tabs.Content></Tabs.Root>
    </section>

    <section data-testid="overflow-case" style={{ inlineSize: 220, maxInlineSize: '100%' }}>
      <Tabs.Root defaultValue="one"><Tabs.List aria-label="Overflow tabs">
        {['one', 'two', 'three', 'four', 'five'].map(value => <Tabs.Trigger key={value} value={value}>Very long {value} tab</Tabs.Trigger>)}
      </Tabs.List>{['one', 'two', 'three', 'four', 'five'].map(value => <Tabs.Content key={value} value={value}>{value}</Tabs.Content>)}</Tabs.Root>
    </section>
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const events: Events = { rejected: [], accepted: [], automatic: [], manual: [] };
  root.render(<Fixture events={events} />);
  return { events, unmount: () => root.unmount() };
}
