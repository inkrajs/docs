import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Field, InputNumber } from '@inkra/react';

function InputNumberFixture() {
  const [value, setValue] = useState<number | null>(2);
  const [empty, setEmpty] = useState<number | null>(null);
  const [events, setEvents] = useState<string[]>([]);
  const [repeatValue, setRepeatValue] = useState<number | null>(0);
  const [repeatDisabled, setRepeatDisabled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const record = (value: string) => setEvents(previous => [...previous, value]);
  return <div style={{ width: 'min(100%, 460px)', boxSizing: 'border-box', display: 'grid', gap: 20, padding: 20 }}>
    <Field label="Controlled">
      <InputNumber form="controlled-number-form" value={value} min={-10} max={10} step={0.25} ref={inputRef}
        incrementButtonLabel="Increment controlled" decrementButtonLabel="Decrement controlled"
        onChange={event => record(`native:${event.target.value}`)}
        onValueChange={(next, details) => { setValue(next); record(`${details.reason}:${next}`); }} />
    </Field>
    <form id="controlled-number-form" onReset={() => setValue(2)}><Button type="reset">Reset controlled</Button></form>
    <Field label="Held controlled"><InputNumber value={4} incrementButtonLabel="Increment held" decrementButtonLabel="Decrement held" onValueChange={(next, details) => record(`held:${details.reason}:${next}`)} /></Field>
    <Field label="Tenths"><InputNumber defaultValue={0} min={0} max={1} step={0.1} incrementButtonLabel="Increment tenths" decrementButtonLabel="Decrement tenths" /></Field>
    <Field label="Decimal base"><InputNumber defaultValue={0.05} min={0.05} max={1.05} step={0.1} incrementButtonLabel="Increment base" decrementButtonLabel="Decrement base" /></Field>
    <Field label="Empty"><InputNumber value={empty} min={0} max={10} step={0.5} onValueChange={setEmpty} incrementButtonLabel="Increment empty" decrementButtonLabel="Decrement empty" /></Field>
    <Field label="Any"><InputNumber defaultValue={1.234} step="any" incrementButtonLabel="Increment any" decrementButtonLabel="Decrement any" /></Field>
    <Field label="Readonly" readOnly><InputNumber defaultValue={2} incrementButtonLabel="Increment readonly" decrementButtonLabel="Decrement readonly" /></Field>
    <Field label="Disabled" disabled><InputNumber defaultValue={2} incrementButtonLabel="Increment disabled" decrementButtonLabel="Decrement disabled" /></Field>
    <fieldset disabled><legend>Native fieldset</legend><InputNumber aria-label="Fieldset disabled" defaultValue={2} incrementButtonLabel="Increment fieldset" decrementButtonLabel="Decrement fieldset" /></fieldset>
    <form aria-label="Normal reset"><Field label="Uncontrolled"><InputNumber name="quantity" defaultValue={3} min={0} step={0.5} controls={false} /></Field><Button type="reset">Reset uncontrolled</Button></form>
    <form aria-label="Canceled reset" onReset={event => event.preventDefault()}><Field label="Canceled"><InputNumber defaultValue={3} controls={false} /></Field><Button type="reset">Canceled reset</Button></form>
    <form id="external-number-form" aria-label="External reset"><Button type="reset">Reset external</Button></form>
    <Field label="External"><InputNumber form="external-number-form" defaultValue={6} controls={false} name="external" /></Field>
    <Field label="All slots"><InputNumber defaultValue={12.5} step={0.5} min={0} prefix="NZ$" suffix="kg" variant="outline" incrementButtonLabel="Increment slots" decrementButtonLabel="Decrement slots" /></Field>
    <Field label="RTL"><InputNumber defaultValue={2} dir="rtl" textAlign="end" incrementButtonLabel="Increment RTL" decrementButtonLabel="Decrement RTL" /></Field>
    <Field label="Default modifiers"><InputNumber defaultValue={3} min={-1000} max={1000} incrementButtonLabel="Increment default modifiers" decrementButtonLabel="Decrement default modifiers" /></Field>
    <Field label="Custom modifiers"><InputNumber defaultValue={0.3} min={-1000} max={1000} step={0.1} stepModifiers={[{ shiftKey: true, step: 7 }, { altKey: true, step: 0.25 }, { ctrlKey: true, shiftKey: true, step: 100 }, { metaKey: true, step: 50 }]} incrementButtonLabel="Increment custom" decrementButtonLabel="Decrement custom" /></Field>
    <Field label="No modifiers"><InputNumber defaultValue={0} stepModifiers={[]} pressAndHold={false} incrementButtonLabel="Increment no modifiers" decrementButtonLabel="Decrement no modifiers" /></Field>
    <Field label="Repeating"><InputNumber value={repeatValue} onValueChange={setRepeatValue} min={0} max={50} disabled={repeatDisabled} repeatDelay={150} repeatInterval={40} incrementButtonLabel="Increment repeating" decrementButtonLabel="Decrement repeating" /></Field>
    <Button onClick={() => setRepeatDisabled(disabled => !disabled)}>Toggle repeat disabled</Button>
    <Button onClick={() => inputRef.current?.focus()}>Focus controlled</Button>
    <Button onClick={() => setValue(5)}>Set controlled externally</Button>
    <Button onClick={() => setValue(null)}>Empty controlled externally</Button>
    <output data-testid="events" style={{ overflowWrap: 'anywhere', minWidth: 0 }}>{JSON.stringify(events)}</output>
    <output data-testid="controlled-value">{value === null ? 'null' : value}</output>
  </div>;
}

export function mountInputNumberFixture() {
  document.getElementById('root')!.hidden = true;
  const host = document.createElement('div');
  host.id = 'input-number-fixture';
  document.body.append(host);
  createRoot(host).render(<InputNumberFixture />);
}
