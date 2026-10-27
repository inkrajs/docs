import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CircularSlider } from '@inkra/react';
import { __iconData as volumeIcon } from 'lucide-react/dist/esm/icons/volume-2.mjs';
import { DocsIcon } from '../../src/components/DocsIcon';

type Events = {
  changes: Record<string, number[]>;
  commits: Record<string, number[]>;
  captures: Array<{ type: string; pointerType: string }>;
};

function Fixture({ events }: { events: Events }) {
  const [controlled, setControlled] = useState(40);
  const record = (id: string) => ({
    onValueChange: (value: number) => (events.changes[id] ??= []).push(value),
    onValueCommit: (value: number) => (events.commits[id] ??= []).push(value),
  });
  return <main style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 240px)', gap: 32, padding: 32 }}
    onGotPointerCaptureCapture={event => events.captures.push({ type: 'got', pointerType: event.pointerType })}
    onLostPointerCaptureCapture={event => events.captures.push({ type: 'lost', pointerType: event.pointerType })}>
    {([96, 104, 112, 128].flatMap(diameter => ['sm', 'md', 'lg'].map(size => ({ diameter, size: size as 'sm' | 'md' | 'lg' })))).map(({ diameter, size }) => <CircularSlider key={`${diameter}-${size}`} data-testid={`center-${diameter}-${size}`} aria-label={`Compact ${diameter} ${size}`} diameter={diameter} size={size} defaultValue={.44} max={1} step={.01}
      centerIcon={<DocsIcon data={volumeIcon} size={18} />} getValueLabel={value => value.toFixed(2)} />)}
    <CircularSlider data-testid="center-icon" aria-label="Icon only" defaultValue={40} centerIcon={<DocsIcon data={volumeIcon} />} showValue={false} />
    <CircularSlider data-testid="center-function" aria-label="Custom center" defaultValue={40} centerContent={value => `${value}%`} showValue={false} getValueLabel={value => `${value} percent`} />
    <CircularSlider data-testid="center-node" aria-label="Decorative node" defaultValue={40} centerContent={<button data-testid="inert-center-button">Do not focus</button>} />
    <form data-testid="normal-form">
      <CircularSlider data-testid="normal" aria-label="Normal circular slider" defaultValue={25} step={5} name="volume" getValueLabel={value => `${value}%`} {...record('normal')} />
      <button type="reset">Reset normal</button>
    </form>
    <form data-testid="canceled-form" onReset={event => event.preventDefault()}>
      <CircularSlider data-testid="canceled" aria-label="Canceled reset slider" defaultValue={25} step={5} name="canceled" {...record('canceled')} />
      <button type="reset">Cancel reset</button>
    </form>
    <form data-testid="controlled-form">
      <CircularSlider data-testid="controlled" aria-label="Controlled circular slider" value={controlled} name="controlled" startAngle={0} sweepAngle={360}
        onValueChange={value => { setControlled(value); (events.changes.controlled ??= []).push(value); }}
        onValueCommit={value => (events.commits.controlled ??= []).push(value)} />
      <button type="button" onClick={() => setControlled(70)}>Set controlled</button>
      <button type="reset">Reset controlled</button>
    </form>
    <CircularSlider data-testid="frozen" aria-label="Frozen circular slider" value={40} step={5} startAngle={0} sweepAngle={360} {...record('frozen')} />
    <CircularSlider data-testid="full-high" aria-label="Full high" defaultValue={95} startAngle={0} sweepAngle={360} {...record('full-high')} />
    <CircularSlider data-testid="full-low" aria-label="Full low" defaultValue={5} startAngle={0} sweepAngle={360} {...record('full-low')} />
    <CircularSlider data-testid="gap-high" aria-label="Arc high" defaultValue={90} {...record('gap-high')} />
    <CircularSlider data-testid="gap-low" aria-label="Arc low" defaultValue={10} {...record('gap-low')} />
    <CircularSlider data-testid="touch" aria-label="Touch circular slider" defaultValue={25} startAngle={0} sweepAngle={360} {...record('touch')} />
    <form data-testid="disabled-form">
      <CircularSlider data-testid="disabled" aria-label="Disabled circular slider" defaultValue={40} disabled name="disabled" {...record('disabled')} />
    </form>
    <form data-testid="readonly-form">
      <CircularSlider data-testid="readonly" aria-label="Readonly circular slider" defaultValue={40} readOnly name="readonly" {...record('readonly')} />
    </form>
    <section dir="rtl">
      <CircularSlider data-testid="rtl" aria-label="RTL circular slider" defaultValue={40} step={5} dir="rtl" startAngle={0} sweepAngle={360} {...record('rtl')} />
    </section>
    <CircularSlider data-testid="counterclockwise" aria-label="Counterclockwise slider" defaultValue={25} startAngle={0} sweepAngle={360} clockwise={false} {...record('counterclockwise')} />
    <CircularSlider data-testid="external" aria-label="External circular slider" defaultValue={30} step={5} name="external" form="circular-external-form" {...record('external')} />
    <form data-testid="external-form" id="circular-external-form"><button type="reset">Reset external</button></form>
  </main>;
}

export function mount(container: HTMLElement) {
  const events: Events = { changes: {}, commits: {}, captures: [] };
  const root = createRoot(container);
  root.render(<Fixture events={events} />);
  return { events, unmount: () => root.unmount() };
}
