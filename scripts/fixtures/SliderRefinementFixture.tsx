import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, RangeSlider, Slider, type RangeSliderValue } from '@inkra/react';

type Events = {
  normalChanges: number[][];
  normalCommits: number[][];
  canceledChanges: number[][];
  canceledCommits: number[][];
  externalChanges: number[][];
  externalCommits: number[][];
  controlledChanges: number[][];
  controlledCommits: number[][];
  rangeChanges: RangeSliderValue[];
  rangeCommits: RangeSliderValue[];
  rangeDefaultChanges: RangeSliderValue[];
  rangeDefaultCommits: RangeSliderValue[];
  rangeCanceledChanges: RangeSliderValue[];
  rangeCanceledCommits: RangeSliderValue[];
  inputNames: string[];
};

function Fixture({ events }: { events: Events }) {
  const [controlledValue, setControlledValue] = useState([45]);
  const [rangeValue, setRangeValue] = useState<RangeSliderValue>([20, 80]);

  return <main style={{ display: 'grid', gap: 24, maxWidth: 760, padding: 24 }}>
    <form data-testid="normal-form" onInput={event => events.inputNames.push((event.target as HTMLInputElement).name)}>
      <Slider aria-label="Normal slider" defaultValue={[25]} name="normalLevel"
        onValueChange={next => events.normalChanges.push(next)}
        onValueCommit={next => events.normalCommits.push(next)} />
      <Button type="reset">Reset normal slider</Button>
    </form>

    <form data-testid="canceled-form" onReset={event => event.preventDefault()}>
      <Slider aria-label="Canceled slider" defaultValue={[25]} name="canceledLevel"
        onValueChange={next => events.canceledChanges.push(next)}
        onValueCommit={next => events.canceledCommits.push(next)} />
      <Button type="reset">Cancel slider reset</Button>
    </form>

    <form data-testid="external-form" id="external-slider-form">
      <Button type="reset">Reset external slider</Button>
    </form>
    <section data-testid="external-case">
      <Slider aria-label="External slider" defaultValue={[30]} form="external-slider-form" name="externalLevel"
        onValueChange={next => events.externalChanges.push(next)}
        onValueCommit={next => events.externalCommits.push(next)} />
    </section>

    <form data-testid="controlled-form">
      <Slider aria-label="Controlled slider" name="controlledLevel" value={controlledValue}
        onValueChange={next => { setControlledValue(next); events.controlledChanges.push(next); }}
        onValueCommit={next => events.controlledCommits.push(next)} />
      <Button onClick={() => setControlledValue([70])}>Set controlled slider</Button>
      <Button type="reset">Reset controlled slider</Button>
    </form>

    <form data-testid="range-form" onInput={event => events.inputNames.push((event.target as HTMLInputElement).name)}>
      <RangeSlider name="budget" value={rangeValue} onValueChange={next => {
        setRangeValue(next);
        events.rangeChanges.push(next);
      }} onValueCommit={next => events.rangeCommits.push(next)} minDistance={20}
      thumbLabels={['Budget minimum', 'Budget maximum']} />
      <Button type="reset">Reset controlled range</Button>
    </form>

    <form data-testid="range-default-form">
      <RangeSlider defaultValue={[20, 80]} name="defaultBudget"
        onValueChange={next => events.rangeDefaultChanges.push(next)}
        onValueCommit={next => events.rangeDefaultCommits.push(next)}
        thumbLabels={['Default budget minimum', 'Default budget maximum']} />
      <Button type="reset">Reset default range</Button>
    </form>

    <form data-testid="range-canceled-form" onReset={event => event.preventDefault()}>
      <RangeSlider defaultValue={[20, 80]} name="canceledBudget"
        onValueChange={next => events.rangeCanceledChanges.push(next)}
        onValueCommit={next => events.rangeCanceledCommits.push(next)}
        thumbLabels={['Canceled budget minimum', 'Canceled budget maximum']} />
      <Button type="reset">Cancel range reset</Button>
    </form>

    <section data-testid="crossing-case">
      <RangeSlider allowCross defaultValue={[20, 80]} thumbLabels={['Cross lower', 'Cross upper']} />
    </section>

    <section data-testid="rtl-case" dir="rtl">
      <Slider aria-label="RTL slider" defaultValue={[25]} dir="rtl" />
    </section>

    <section data-testid="vertical-case">
      <Slider aria-label="Vertical inverted slider" defaultValue={[25]} inverted orientation="vertical" />
    </section>

    <form data-testid="disabled-case">
      <Slider aria-label="Disabled slider" defaultValue={[40]} disabled name="disabledLevel" />
    </form>
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const events: Events = {
    normalChanges: [], normalCommits: [], canceledChanges: [], canceledCommits: [],
    externalChanges: [], externalCommits: [], controlledChanges: [], controlledCommits: [],
    rangeChanges: [], rangeCommits: [], rangeDefaultChanges: [], rangeDefaultCommits: [],
    rangeCanceledChanges: [], rangeCanceledCommits: [],
    inputNames: [],
  };
  root.render(<Fixture events={events} />);
  return { events, unmount: () => root.unmount() };
}
