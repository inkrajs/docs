import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { NumberTicker, type NumberTickerProps } from '@inkra/react';

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const update = (props: NumberTickerProps) => flushSync(() => root.render(
    <div style={{ padding: 20, fontSize: 32, maxWidth: '100%', boxSizing: 'border-box' }}>
      <div data-testid="morph-number-frame" style={{ display: 'flex', justifyContent: 'flex-end', width: 'min(100%, 18ch)', maxWidth: '100%' }}>
        <NumberTicker data-testid="morph-number" animation="morph" duration={420} locale="en-US"
          formatOptions={{ useGrouping: false, maximumFractionDigits: 4 }} {...props} />
      </div>
    </div>,
  ));
  update({ value: 10 });
  return { update, unmount: () => root.unmount() };
}
