import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { CircularSlider, Switch } from '@inkra/react';
import { __iconData as sparklesIcon } from 'lucide-react/dist/esm/icons/sparkles.mjs';
import { DocsIcon } from '../../src/components/DocsIcon';

type Events = { changes: Record<string, boolean[]>; checked: Record<string, boolean[]> };
function Fixture({ events, refs }: { events: Events; refs: Record<string, HTMLInputElement | null> }) {
  const [controlled, setControlled] = useState(false);
  const record = (id: string) => ({
    ref: (input: HTMLInputElement | null) => { refs[id] = input; },
    onChange: (event: ChangeEvent<HTMLInputElement>) => { (events.changes[id] ??= []).push(event.currentTarget.checked); },
    onCheckedChange: (checked: boolean) => { (events.checked[id] ??= []).push(checked); },
  });
  const center = { centerIcon: <DocsIcon data={sparklesIcon} size={20} />, centerContent: (checked: boolean) => checked ? 'On' : 'Off' };
  return <main style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(128px, 1fr))', gap: 16, padding: 16, boxSizing: 'border-box', maxWidth: 760 }}>
    <form data-testid="normal-form"><div data-testid="normal"><Switch label="Normal circular switch" variant="circular" diameter={120} name="effect" value="enabled" {...center} {...record('normal')} /></div><button type="reset">Reset normal</button></form>
    <div data-testid="reference"><CircularSlider aria-label="Reference dial" diameter={120} size="sm" defaultValue={.44} max={1} step={.01} centerIcon={center.centerIcon} /></div>
    <div data-testid="touch"><Switch label="Touch switch" variant="circular" diameter={120} {...center} {...record('touch')} /></div>
    <form data-testid="controlled-form"><div data-testid="controlled"><Switch label="Controlled switch" variant="circular" diameter={120} checked={controlled} name="controlled" {...center} {...record('controlled')} onCheckedChange={checked => { setControlled(checked); (events.checked.controlled ??= []).push(checked); }} /></div><button type="reset">Reset controlled</button></form>
    <div data-testid="frozen"><Switch label="Frozen switch" variant="circular" diameter={120} checked={false} {...center} {...record('frozen')} /></div>
    <form data-testid="canceled-form" onReset={event => event.preventDefault()}><div data-testid="canceled"><Switch label="Canceled reset" variant="circular" diameter={120} defaultChecked {...center} {...record('canceled')} /></div><button type="reset">Cancel reset</button></form>
    <form data-testid="required-form"><div data-testid="required"><Switch label="Required switch" variant="circular" diameter={120} required name="required" {...center} {...record('required')} /></div></form>
    <form data-testid="disabled-form"><div data-testid="disabled"><Switch label="Disabled switch" variant="circular" diameter={120} defaultChecked disabled name="disabled" {...center} {...record('disabled')} /></div></form>
    <form data-testid="readonly-form"><div data-testid="readonly"><Switch label="Readonly switch" variant="circular" diameter={120} defaultChecked readOnly name="readonly" {...center} {...record('readonly')} /></div></form>
    <div data-testid="external"><Switch label="External switch" variant="circular" diameter={120} name="external" form="circular-switch-external" {...center} {...record('external')} /></div>
    <form data-testid="external-form" id="circular-switch-external"><button type="reset">Reset external</button></form>
    <div data-testid="center-node"><Switch label="Decorative center" variant="circular" diameter={120} centerContent={<button data-testid="inert-center-button">Decorative</button>} {...record('center-node')} /></div>
    <div data-testid="plain"><Switch label="Standard switch" {...record('plain')} /></div>
  </main>;
}
export function mount(container: HTMLElement) {
  const events: Events = { changes: {}, checked: {} };
  const refs: Record<string, HTMLInputElement | null> = {};
  const root = createRoot(container);
  root.render(<Fixture events={events} refs={refs} />);
  return { events, refs, unmount: () => root.unmount() };
}
