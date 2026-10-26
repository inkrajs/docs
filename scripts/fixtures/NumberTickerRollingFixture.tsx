import { createRoot } from 'react-dom/client';
import { NumberTicker, type NumberTickerProps } from '@inkra/react';

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const update = (props: NumberTickerProps) => root.render(<div style={{ padding: 20, fontSize: 32 }}>
    <NumberTicker data-testid="ticker-fixture" animation="roll" duration={600} locale="en-US" {...props} />
  </div>);
  update({ value: 12 });
  return { update, unmount: () => root.unmount() };
}
