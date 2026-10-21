import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Field, Input } from 'inkra';

function InputFixture() {
  const [value, setValue] = useState('controlled');
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const record = (event: string) => setEvents(previous => [...previous, event]);
  return <div style={{ width: 'min(100%, 420px)', display: 'grid', gap: 20, padding: 20 }}>
    <Field label="Controlled">
      <Input value={value} clearable ref={inputRef} clearButtonLabel="Clear controlled"
        onChange={event => record(`native:${event.target.value}`)}
        onValueChange={(next, details) => { setValue(next); record(`${details.reason}:${next}`); }}
        onClear={() => record('onClear')} />
    </Field>
    <Field label="Held controlled">
      <Input value="unchanged" clearable clearButtonLabel="Clear held" onValueChange={(_, details) => record(`held:${details.reason}`)} />
    </Field>
    <form aria-label="Uncontrolled form">
      <Field label="Uncontrolled"><Input defaultValue="initial" name="note" clearable clearButtonLabel="Clear uncontrolled" /></Field>
      <Button type="reset">Reset uncontrolled</Button>
    </form>
    <Field label="Readonly" readOnly><Input defaultValue="readonly" clearable /></Field>
    <Field label="Disabled" disabled><Input defaultValue="disabled" clearable endAction={<Button onClick={() => record('disabled-action')}>Action</Button>} /></Field>
    <Field label="All slots">
      <Input defaultValue="inkra" clearable loading={loading} startIcon={<span>+</span>} endIcon={<span>✓</span>}
        prefix="https://" suffix=".com" endAction={<Button size="icon" aria-label="Run" onClick={() => record('action')}>Go</Button>} />
    </Field>
    <Field label="RTL"><Input dir="rtl" defaultValue="123" prefix="USD" suffix="kg" textAlign="end" clearable /></Field>
    <Field label="Ghost"><Input variant="ghost" defaultValue="ghost" clearable clearButtonLabel="Clear ghost" /></Field>
    <Input aria-label="Compact" fullWidth={false} defaultValue="compact" />
    <Button onClick={() => setLoading(previous => !previous)}>Toggle loading</Button>
    <Button onClick={() => inputRef.current?.focus()}>Focus controlled</Button>
    <output data-testid="events" style={{ overflowWrap: 'anywhere', minWidth: 0 }}>{JSON.stringify(events)}</output>
  </div>;
}

export function mountInputFixture() {
  document.getElementById('root')!.hidden = true;
  const host = document.createElement('div');
  host.id = 'input-fixture';
  document.body.append(host);
  createRoot(host).render(<InputFixture />);
}
