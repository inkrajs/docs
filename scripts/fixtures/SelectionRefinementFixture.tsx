import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Checkbox, RadioGroup, RadioGroupItem, Switch } from '@inkra/react';

type Events = {
  checkbox: boolean[];
  controlledCheckbox: boolean[];
  switch: boolean[];
  controlledSwitch: boolean[];
  radio: string[];
  controlledRadio: string[];
};

function Fixture({ events }: { events: Events }) {
  const [controlledCheckbox, setControlledCheckbox] = useState(true);
  const [controlledSwitch, setControlledSwitch] = useState(true);
  const [controlledRadio, setControlledRadio] = useState('two');
  const [indeterminate, setIndeterminate] = useState(true);
  const [externalForm, setExternalForm] = useState('external-selection-a');

  return <main style={{ display: 'grid', gap: 24, maxWidth: 720, padding: 24 }}>
    <form data-testid="checkbox-form">
      <Checkbox defaultChecked label="Uncontrolled checkbox" name="uncontrolledCheckbox" value="yes"
        onCheckedChange={next => events.checkbox.push(next)} />
      <Button type="reset">Reset checkbox</Button>
    </form>
    <form data-testid="checkbox-canceled-form" onReset={event => event.preventDefault()}>
      <Checkbox defaultChecked label="Canceled checkbox" name="canceledCheckbox" value="yes" />
      <Button type="reset">Cancel checkbox reset</Button>
    </form>
    <form data-testid="checkbox-controlled-form">
      <Checkbox checked={controlledCheckbox} label="Controlled checkbox" name="controlledCheckbox" value="yes"
        onCheckedChange={next => { setControlledCheckbox(next); events.controlledCheckbox.push(next); }} />
      <Button onClick={() => setControlledCheckbox(true)}>Set controlled checkbox</Button>
      <Button type="reset">Reset controlled checkbox</Button>
    </form>

    <form data-testid="switch-form">
      <Switch defaultChecked label="Uncontrolled switch" name="uncontrolledSwitch" value="yes"
        onCheckedChange={next => events.switch.push(next)} />
      <Button type="reset">Reset switch</Button>
    </form>
    <form data-testid="switch-canceled-form" onReset={event => event.preventDefault()}>
      <Switch defaultChecked label="Canceled switch" name="canceledSwitch" value="yes" />
      <Button type="reset">Cancel switch reset</Button>
    </form>
    <form data-testid="switch-controlled-form">
      <Switch checked={controlledSwitch} label="Controlled switch" name="controlledSwitch" value="yes"
        onCheckedChange={next => { setControlledSwitch(next); events.controlledSwitch.push(next); }} />
      <Button onClick={() => setControlledSwitch(true)}>Set controlled switch</Button>
      <Button type="reset">Reset controlled switch</Button>
    </form>

    <form data-testid="radio-form">
      <RadioGroup defaultValue="one" label="Uncontrolled radio" name="uncontrolledRadio"
        onValueChange={next => events.radio.push(next)}>
        <RadioGroupItem label="Radio one" value="one" />
        <RadioGroupItem label="Radio two" value="two" />
      </RadioGroup>
      <Button type="reset">Reset radio</Button>
    </form>
    <form data-testid="radio-canceled-form" onReset={event => event.preventDefault()}>
      <RadioGroup defaultValue="one" label="Canceled radio" name="canceledRadio">
        <RadioGroupItem label="Canceled one" value="one" />
        <RadioGroupItem label="Canceled two" value="two" />
      </RadioGroup>
      <Button type="reset">Cancel radio reset</Button>
    </form>
    <form data-testid="radio-controlled-form">
      <RadioGroup label="Controlled radio" name="controlledRadio" value={controlledRadio}
        onValueChange={next => { setControlledRadio(next); events.controlledRadio.push(next); }}>
        <RadioGroupItem label="Controlled one" value="one" />
        <RadioGroupItem label="Controlled two" value="two" />
      </RadioGroup>
      <Button onClick={() => setControlledRadio('two')}>Set controlled radio</Button>
      <Button type="reset">Reset controlled radio</Button>
    </form>

    <section data-testid="indeterminate-case">
      <Checkbox indeterminate={indeterminate} label="Indeterminate checkbox" />
      <Button onClick={() => setIndeterminate(value => !value)}>Toggle indeterminate</Button>
    </section>

    <form data-testid="external-form-a" id="external-selection-a"><Button type="reset">Reset external A</Button></form>
    <form data-testid="external-form-b" id="external-selection-b"><Button type="reset">Reset external B</Button></form>
    <section data-testid="external-case">
      <Checkbox defaultChecked form={externalForm} label="External checkbox" name="externalCheckbox" value="yes" />
      <Switch defaultChecked form={externalForm} label="External switch" name="externalSwitch" value="yes" />
      <RadioGroup defaultValue="one" form={externalForm} label="External radio" name="externalRadio">
        <RadioGroupItem label="External radio one" value="one" />
        <RadioGroupItem label="External radio two" value="two" />
      </RadioGroup>
      <Button onClick={() => setExternalForm(value => value === 'external-selection-a' ? 'external-selection-b' : 'external-selection-a')}>
        Reassociate external controls
      </Button>
    </section>

    <section data-testid="radio-form-override-case">
      <RadioGroup defaultValue="one" form="external-selection-a" label="Split owner radio" name="splitRadio">
        <RadioGroupItem label="Split owner one" value="one" />
        <RadioGroupItem form="external-selection-b" label="Split owner two" value="two" />
      </RadioGroup>
    </section>

    <section data-testid="rtl-case" dir="rtl">
      <Switch defaultChecked label="RTL switch" />
      <RadioGroup defaultValue="one" label="RTL segmented" name="rtlSegmented" orientation="horizontal" variant="segmented">
        <RadioGroupItem label="RTL one" value="one" />
        <RadioGroupItem label="RTL two" value="two" />
      </RadioGroup>
    </section>

    <section data-testid="disabled-case">
      <Checkbox disabled label="Disabled checkbox" />
      <Switch disabled label="Disabled switch" />
      <RadioGroup disabled label="Disabled radio" name="disabledRadio">
        <RadioGroupItem label="Disabled one" value="one" />
      </RadioGroup>
    </section>
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const events: Events = { checkbox: [], controlledCheckbox: [], switch: [], controlledSwitch: [], radio: [], controlledRadio: [] };
  root.render(<Fixture events={events} />);
  return { events, unmount: () => root.unmount() };
}
