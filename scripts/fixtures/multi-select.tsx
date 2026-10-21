import { useState } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Field, Select } from 'inkra';
import type { SelectContentProps, SelectMultipleRootProps } from 'inkra';

const options = [
  { value: 'akl', label: 'Auckland' },
  { value: 'wlg', label: 'Wellington' },
  { value: 'chc', label: 'Christchurch' },
  { value: 'zqn', label: 'Queenstown' },
  { value: 'dud', label: 'Dunedin' },
];
const initial = ['akl'];

function Choices({ label, contentProps, footer, ...props }: Omit<SelectMultipleRootProps, 'multiple'> & { label: string; contentProps?: SelectContentProps; footer?: ReactNode }) {
  return <Select.Root multiple items={options} {...props}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Select.Trigger aria-label={label}><Select.Value placeholder="Choose cities" /></Select.Trigger>
      <Select.Clear aria-label={`Clear ${label}`}>Clear</Select.Clear>
    </div>
    <Select.Portal>
      <Select.Content position="popper" sideOffset={6} {...contentProps}>
        <Select.ScrollUpButton />
        <Select.Viewport>
          <Select.Group>
            <Select.Label>Cities</Select.Label>
            {options.map(option => <Select.Item key={option.value} value={option.value} disabled={option.value === 'chc'}>
              <Select.ItemText>{option.label}</Select.ItemText><Select.ItemIndicator />
            </Select.Item>)}
          </Select.Group>
        </Select.Viewport>
        <Select.ScrollDownButton />
        <Select.Clear aria-label={`Clear popup ${label}`}>Clear</Select.Clear>
        {footer}
      </Select.Content>
    </Select.Portal>
  </Select.Root>;
}

function Fixture() {
  const [values, setValues] = useState(['wlg']);
  const [events, setEvents] = useState<string[][]>([]);
  const [preventReset, setPreventReset] = useState(false);
  const [formStatus, setFormStatus] = useState('');
  const [protectedOpen, setProtectedOpen] = useState(false);
  return <div style={{ width: 'min(100%, 440px)', display: 'grid', gap: 24, padding: 24 }}>
    <form id="multi-form" onReset={event => { if (preventReset) event.preventDefault(); setFormStatus(''); }}>
      <Field label="Uncontrolled" description="Choose several cities">
        <Choices label="Uncontrolled" name="cities" defaultValue={['akl']} />
      </Field>
      <Button type="reset">Reset cities</Button>
      <Button onClick={() => setFormStatus('read')}>Read cities</Button>
      <Button onClick={() => setPreventReset(previous => !previous)} aria-pressed={preventReset}>Prevent reset</Button>
      <output>{formStatus}</output>
    </form>
    <Field label="Controlled">
      <Choices label="Controlled" value={values} onValueChange={next => { setValues(next); setEvents(previous => [...previous, next]); }} />
    </Field>
    <Field label="Held controlled"><Choices label="Held controlled" value={initial} onValueChange={next => setEvents(previous => [...previous, next])} /></Field>
    <Field label="Readonly" readOnly><Choices label="Readonly" defaultValue={initial} name="readonly" form="multi-form" /></Field>
    <Field label="Disabled" disabled><Choices label="Disabled" defaultValue={initial} name="disabled" form="multi-form" /></Field>
    <Field label="Required" required invalid error="Choose a city"><Choices label="Required" name="required" form="multi-form" /></Field>
    <div dir="rtl"><Field label="RTL"><Choices label="RTL" defaultValue={initial} /></Field></div>
    <Field label="Single compatibility">
      <Select.Root defaultValue="akl">
        <Select.Trigger aria-label="Single compatibility"><Select.Value /></Select.Trigger>
        <Select.Portal><Select.Content position="popper"><Select.Viewport>
          {options.map(option => <Select.Item key={option.value} value={option.value}><Select.ItemText>{option.label}</Select.ItemText><Select.ItemIndicator /></Select.Item>)}
        </Select.Viewport></Select.Content></Select.Portal>
      </Select.Root>
    </Field>
    <Field label="Single readonly" readOnly>
      <Select.Root defaultValue="akl" name="singleReadonly" form="multi-form">
        <Select.Trigger aria-label="Single readonly"><Select.Value /></Select.Trigger>
        <Select.Portal><Select.Content position="popper"><Select.Viewport>
          {options.map(option => <Select.Item key={option.value} value={option.value}><Select.ItemText>{option.label}</Select.ItemText></Select.Item>)}
        </Select.Viewport></Select.Content></Select.Portal>
      </Select.Root>
    </Field>
    <Field label="Protected">
      <Choices label="Protected" open={protectedOpen} onOpenChange={setProtectedOpen}
        contentProps={{ onEscapeKeyDown: event => event.preventDefault(), onPointerDownOutside: event => event.preventDefault() }}
        footer={<Button onClick={() => setProtectedOpen(false)}>Close protected</Button>} />
    </Field>
    <output data-testid="multi-values">{JSON.stringify(values)}</output>
    <output data-testid="multi-events">{JSON.stringify(events)}</output>
  </div>;
}

export function mountMultiSelectFixture() {
  document.getElementById('root')!.hidden = true;
  const host = document.createElement('div');
  host.id = 'multi-select-fixture';
  document.body.append(host);
  createRoot(host).render(<Fixture />);
}
