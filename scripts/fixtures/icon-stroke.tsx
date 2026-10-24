import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { PencilIcon, type PencilIconProps } from '@inkra/react';
import type { CSSProperties } from 'react';

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const paths = [{ d: 'M4 4H20V20H4Z M4 4L20 20 M20 4L4 20' }];
  const badge = { paths: [{ d: 'M12 3V21 M3 12H21' }] };
  function configure(props: Partial<PencilIconProps> = {}, tokens: Record<string, string> = {}) {
    flushSync(() => root.render(
      <section style={{ '--inkra-stroke-width': '1.2', color: '#244b37', ...tokens } as CSSProperties}>
        <PencilIcon data-testid="base" paths={paths} badge={badge} active size={64} sourceSize={24} seed="stroke-test" decorative={false} aria-label="Sample icon" {...props} />
        <PencilIcon data-testid="wash" paths={[{ d: 'M3 3H21V21H3Z', mode: 'wash' }]} size={64} sourceSize={24} seed="wash-test" {...props} />
        <PencilIcon data-testid="scuff" paths={[{ d: 'M3 12H21', mode: 'scuff' }]} size={64} sourceSize={24} seed="scuff-test" {...props} />
      </section>,
    ));
  }
  configure();
  return { configure, unmount: () => root.unmount() };
}
