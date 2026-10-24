import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, ColorPicker } from '@inkra/react';
import type { ColorPaint, ColorPickerPresentation } from '@inkra/react';

const initial: ColorPaint = { type: 'linear', angle: 90, stops: [
  { id: 'a', color: '#4b96aaff', position: 0 }, { id: 'b', color: '#e6c17b99', position: 100 },
] };
export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const changes: unknown[] = [];
  let key = 0;
  function Fixture({ controlled = false, accept = true, disabled = false, presentation = 'inline', maxStops = 3 }: {
    controlled?: boolean; accept?: boolean; disabled?: boolean; presentation?: ColorPickerPresentation; maxStops?: number;
  }) {
    const [value, setValue] = useState<ColorPaint>(initial);
    return <div style={{ width: 400, maxWidth: '100%', padding: 12, boxSizing: 'border-box' }}>
      <ColorPicker allowGradient name="paint" form="gradient-form" label="Paint" presentation={presentation}
        {...(controlled ? { value } : { defaultValue: initial })} maxStops={maxStops} disabled={disabled}
        onValueChange={(value, details) => { changes.push({ value, details }); if (accept) setValue(value); }}
        presets={[{ label: 'Radial preset', value: { ...initial, type: 'radial' } }, { label: 'Solid preset', value: '#fff' }]} />
      <form id="gradient-form"><Button type="reset">Reset</Button></form>
    </div>;
  }
  const configure = (props = {}) => { changes.length = 0; root.render(<Fixture key={key++} {...props} />); };
  configure();
  return { configure, changes, unmount: () => root.unmount() };
}
