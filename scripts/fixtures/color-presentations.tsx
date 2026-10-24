import { createRoot } from 'react-dom/client';
import { Button, ColorPicker, ColorSwatch } from '@inkra/react';
import type { ColorPickerProps } from '@inkra/react';

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const changes: string[] = [];
  let props: ColorPickerProps = {};
  function configure(next: ColorPickerProps = {}) {
    props = next;
    root.render(<main style={{ padding: 16, maxWidth: 480, margin: 'auto' }}>
      <form id="color-presentation-form" data-testid="form">
        <Button type="reset">Reset</Button>
      </form>
      <ColorPicker {...props} name="color" form="color-presentation-form" label="Accent" defaultValue="#33669980"
        labels={{ value: 'Hex', alpha: 'Opacity', palette: 'Choose', presets: 'Presets' }}
        presets={props.presets ?? [{ value: '#629568', label: 'Pine' }, { value: '#994f3f', label: 'Red' }, { value: '#0000', label: 'Transparent' }]}
        onValueChange={(value, details) => changes.push(`${details.source}:${value}`)} />
      <div data-testid="swatches" style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
        <ColorSwatch color="#ff0000" label="Red pigment" selected seed="same" />
        <ColorSwatch color="#0000ff" label="Blue pigment" seed="same" />
        <ColorSwatch color="var(--inkra-accent)" label="Theme pigment" seed="same" />
        <ColorSwatch color="transparent" label="Transparent pigment" seed="same" />
        <ColorSwatch color="#ff000080" label="Half pigment" seed="same" />
        <ColorSwatch color="#000" label="Disabled pigment" disabled />
      </div>
    </main>);
  }
  configure();
  return { configure, changes, unmount: () => root.unmount() };
}
