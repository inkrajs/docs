import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, ChoiceGrid, ChoiceGridOption } from '@inkra/react';

const longLabel = 'A deliberately long layout choice label that must wrap without escaping its narrow card';

type Events = {
  single: string[];
  multiple: string[][];
  canceled: string[];
  external: string[];
  controlledSingle: string[];
  controlledMultiple: string[][];
};

function BasicOptions() {
  return <>
    <ChoiceGridOption label="Compact" value="compact" />
    <ChoiceGridOption label="Balanced" value="balanced" />
    <ChoiceGridOption label="Spacious" value="spacious" />
  </>;
}

function Fixture({ events }: { events: Events }) {
  const [controlledSingle, setControlledSingle] = useState('compact');
  const [controlledMultiple, setControlledMultiple] = useState<string[]>(['notes']);

  return <main style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 24, maxWidth: 780, padding: 24 }}>
    <section data-testid="label-case">
      <ChoiceGrid columns={2} label="Label rendering" minItemWidth="8rem" name="labelChoice">
        <ChoiceGridOption label="String label" value="string" />
        <ChoiceGridOption label={<strong data-testid="custom-label">Custom node label</strong>} value="node" />
      </ChoiceGrid>
    </section>

    <form data-testid="single-reset-form">
      <ChoiceGrid defaultValue="balanced" label="Single reset" name="singleChoice"
        onValueChange={value => events.single.push(value)}>
        <BasicOptions />
      </ChoiceGrid>
      <Button type="reset">Reset single choice</Button>
    </form>

    <form data-testid="multiple-reset-form">
      <ChoiceGrid defaultValues={['notes', 'history']} label="Multiple reset" name="multipleChoice" type="multiple"
        onValuesChange={values => events.multiple.push(values)}>
        <ChoiceGridOption label="Notes" value="notes" />
        <ChoiceGridOption label="Metadata" value="metadata" />
        <ChoiceGridOption label="History" value="history" />
      </ChoiceGrid>
      <Button type="reset">Reset multiple choice</Button>
    </form>

    <form data-testid="canceled-reset-form" onReset={event => event.preventDefault()}>
      <ChoiceGrid defaultValue="compact" label="Canceled reset" name="canceledChoice"
        onValueChange={value => events.canceled.push(value)}>
        <BasicOptions />
      </ChoiceGrid>
      <Button type="reset">Cancel choice reset</Button>
    </form>

    <form data-testid="external-form" id="choice-grid-external-form">
      <Button type="reset">Reset external choice</Button>
    </form>
    <section data-testid="external-case">
      <ChoiceGrid defaultValue="compact" form="choice-grid-external-form" label="External choice" name="externalChoice"
        onValueChange={value => events.external.push(value)}>
        <BasicOptions />
      </ChoiceGrid>
    </section>

    <form data-testid="controlled-single-form">
      <ChoiceGrid label="Controlled single" name="controlledSingle" value={controlledSingle}
        onValueChange={value => { events.controlledSingle.push(value); setControlledSingle(value); }}>
        <BasicOptions />
      </ChoiceGrid>
      <Button type="reset">Reset controlled single</Button>
    </form>

    <form data-testid="controlled-multiple-form">
      <ChoiceGrid label="Controlled multiple" name="controlledMultiple" type="multiple" values={controlledMultiple}
        onValuesChange={values => { events.controlledMultiple.push(values); setControlledMultiple(values); }}>
        <ChoiceGridOption label="Notes" value="notes" />
        <ChoiceGridOption label="Metadata" value="metadata" />
        <ChoiceGridOption label="History" value="history" />
      </ChoiceGrid>
      <Button type="reset">Reset controlled multiple</Button>
    </form>

    <section data-testid="narrow-case" style={{ inlineSize: 220, minInlineSize: 0 }}>
      <ChoiceGrid columns={3} error="Choose a supported layout." label="Narrow choices" minItemWidth="13rem" name="narrowChoice">
        <ChoiceGridOption description="Supporting copy remains readable in one column." label={longLabel} value="long" />
        <ChoiceGridOption disabled label="Disabled choice" value="disabled" />
        <ChoiceGridOption label="Short choice" value="short" />
      </ChoiceGrid>
    </section>

    <section data-testid="wide-columns-case" style={{ inlineSize: 720, maxInlineSize: '100%', minInlineSize: 0 }}>
      <ChoiceGrid columns={3} label="Wide explicit columns" name="wideChoice">
        <BasicOptions />
      </ChoiceGrid>
    </section>
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const events: Events = {
    single: [],
    multiple: [],
    canceled: [],
    external: [],
    controlledSingle: [],
    controlledMultiple: [],
  };
  root.render(<Fixture events={events} />);
  return { events, longLabel, unmount: () => root.unmount() };
}
