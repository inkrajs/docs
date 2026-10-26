import { createRoot } from 'react-dom/client';
import { PencilIcon } from '@inkra/react';
import type { PencilIconPath } from '@inkra/react';
import { docsIconCatalog } from '../../src/components/iconCatalog';

const keys = ['user', 'database', 'folder-open', 'search', 'folder', 'settings', 'map-pin'];
const custom: readonly PencilIconPath[] = [
  { d: 'M4 4H20V36H4Z', mode: 'fill', color: '#cf3656' },
  { d: 'M20 4H36V36H20Z', mode: 'fill', color: '#2478d4' },
  { d: 'M16 16H24V24H16Z', mode: 'cutout' },
];

function Fixture({ color, seed }: { color: string; seed: number }) {
  return <main data-testid="icon-edges" style={{ color: '#253c36', padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
    {[...keys, 'custom'].flatMap(key => [24, 40, 120].map(size => {
      const icon = docsIconCatalog.find(item => item.key === key);
      return <div key={`${key}-${size}`} style={{ minHeight: 140 }}>
        <PencilIcon data-edge-key={`${key}-${size}`} paths={icon?.paths ?? custom}
          filledPaths={icon?.filledPaths} sourceSize={icon ? 24 : 40} size={size}
          variant="filled" fillColor={color} seed={seed} />
        <div style={{ fontSize: 12 }}>{key} {size}</div>
      </div>;
    }))}
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  let color = '#cf3656';
  let seed = 17;
  const render = () => root.render(<Fixture color={color} seed={seed} />);
  render();
  return {
    update(next: { color?: string; seed?: number }) {
      color = next.color ?? color;
      seed = next.seed ?? seed;
      render();
    },
    unmount() { root.unmount(); },
  };
}
