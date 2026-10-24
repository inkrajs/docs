import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { PencilIcon } from '@inkra/react';
import { __iconData as plus } from 'lucide-react/dist/esm/icons/plus.mjs';
import { __iconData as check } from 'lucide-react/dist/esm/icons/check.mjs';
import { iconPaths } from '../../src/components/DocsIcon';

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  flushSync(() => root.render(<section style={{ padding: 24, color: 'var(--inkra-ink)', width: 576, maxWidth: '100%' }}>
    {[40, 96].map(size => <div key={size}>
      <h2 style={{ font: '16px sans-serif' }}>Pressure: 0 / 50 / 100%, {size}px</h2>
      {[['plus', plus], ['check', check]].map(([name, data]) => <div key={String(name)} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', minHeight: size + 16, placeItems: 'center' }}>
        {[0, 0.5, 1].map(pressure => <PencilIcon key={pressure} data-pressure={pressure} data-symbol={name} data-size={size}
          paths={iconPaths(data as typeof plus)} size={size} sourceSize={24} strokeWidth={1.5} seed="inkra-icon" breaks={0} pressureVariation={pressure} />)}
      </div>)}
    </div>)}
    <h2 style={{ font: '16px sans-serif' }}>Maximum gaps: 0 / 1 / 3</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', placeItems: 'center' }}>
      {[0, 1, 3].map(count => <PencilIcon key={count} data-gaps={count} paths={iconPaths(plus)} size={96} sourceSize={24}
        strokeWidth={1.5} seed="inkra-icon" breaks={0.8} breakCount={count} pressureVariation={0.5} />)}
    </div>
    {[16, 40, 80, 128].map(size => [8, 16, 28].map(length => <div key={`${size}-${length}`}>
      <h2 style={{ font: '16px sans-serif' }}>{size}px, path length {length}; maximum gaps: 0 / 1 / 3 / 12</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', placeItems: 'center' }}>
        {[0, 1, 3, 12].map(count => <PencilIcon key={count} data-line-gaps={count} data-line-length={length} data-line-size={size}
          paths={[{ d: `M${12 - length / 2} 12H${12 + length / 2}` }]} size={size} sourceSize={24}
          strokeWidth={1.5} seed="inkra-icon" breaks={1} breakCount={count} pressureVariation={0} />)}
      </div>
    </div>))}
  </section>));
  return { unmount: () => root.unmount() };
}
