import { createRoot } from 'react-dom/client';
import { PencilIcon } from '@inkra/react';
import type { CSSProperties } from 'react';
import type { PencilIconPath, PencilIconProps } from '@inkra/react';
import { docsIconCatalog } from '../../src/components/iconCatalog';

type Configuration = {
  catalog: boolean;
  variant: 'outline' | 'filled';
  fillColor: string;
  variableColor: string;
  intensity: number;
  direction: 'ltr' | 'rtl';
};

const representatives = ['folder', 'settings', 'map-pin', 'plus', 'check', 'clock', 'file-text', 'folder-open', 'database', 'credit-card', 'target', 'sun', 'eye', 'heart', 'arrow-right', 'markdown'];
const square: PencilIconPath[] = [{ d: 'M4 4H36V36H4Z' }];
const regions: PencilIconPath[] = [
  { d: 'M4 4H20V36H4Z', mode: 'fill', color: '#cf3656' },
  { d: 'M20 4H36V36H20Z', mode: 'fill', color: '#2478d4' },
  { d: 'M16 16H24V24H16Z', mode: 'cutout' },
];
const circle = (x: number, y: number, radius: number): PencilIconPath => ({ d: `M${x - radius} ${y}a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0` });
const intersecting = [circle(14, 20, 10), circle(26, 20, 10)];
const nested = [circle(20, 20, 15), circle(20, 20, 9), circle(20, 20, 3)];
const tinyHole = [circle(20, 20, 10), circle(20, 20, 0.5)];
const compound = `${circle(20, 20, 15).d} ${circle(20, 20, 9).d}`;

function Fixture({ config }: { config: Configuration }) {
  const folder = docsIconCatalog.find(icon => icon.key === 'folder')!;
  const badge = docsIconCatalog.find(icon => icon.key === 'check')!;
  const common: Pick<PencilIconProps, 'variant' | 'fillColor' | 'intensity'> = {
    variant: config.variant, fillColor: config.fillColor, intensity: config.intensity,
  };
  return <main data-testid="icon-fill-fixture" dir={config.direction} style={{
    '--fixture-fill': config.variableColor,
    color: '#253c36', padding: 16, maxWidth: '100%', boxSizing: 'border-box',
  } as CSSProperties}>
    <section data-testid="representatives" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(128px, 1fr))', gap: 8 }}>
      {representatives.map(key => {
        const icon = docsIconCatalog.find(item => item.key === key);
        return icon ? <div key={key} data-icon={key} style={{ minWidth: 0 }}>
          <PencilIcon {...common} paths={icon.paths} filledPaths={icon.filledPaths} sourceSize={24} size={120} seed={`fill-test-${key}`} decorative={false} aria-label={key} />
          <div style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{key}</div>
        </div> : null;
      })}
    </section>
    <section style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <PencilIcon {...common} data-testid="custom-regions" paths={square} filledPaths={regions} sourceSize={40} size={120} seed="custom-regions" />
      <PencilIcon {...common} data-testid="composite" paths={folder.paths} sourceSize={24} size={120} seed="composite" badge={{ paths: badge.paths, sourceSize: 24, position: 'bottom-end', variant: 'filled', fillColor: '#1d9950' }} />
      <PencilIcon {...common} data-testid="variable" paths={folder.paths} sourceSize={24} size={120} seed="variable" fillColor="var(--fixture-fill)" />
      <PencilIcon {...common} data-testid="inherited-fill" paths={folder.paths} sourceSize={24} size={120} seed="inherited-fill" fillColor="currentColor" />
      <PencilIcon {...common} data-testid="named" paths={folder.paths} sourceSize={24} size={40} seed="named" decorative={false} aria-label="Colored folder" />
      <PencilIcon {...common} data-testid="intersecting" paths={intersecting} sourceSize={40} size={120} seed="intersecting" />
      <PencilIcon {...common} data-testid="nested" paths={nested} sourceSize={40} size={120} seed="nested" />
      <PencilIcon {...common} data-testid="rule-evenodd" paths={[{ d: compound, mode: 'fill', fillRule: 'evenodd' }]} sourceSize={40} size={120} seed="rule-evenodd" />
      <PencilIcon {...common} data-testid="rule-nonzero" paths={[{ d: compound, mode: 'fill', fillRule: 'nonzero' }]} sourceSize={40} size={120} seed="rule-nonzero" />
      {[24, 40, 120].map(size => <PencilIcon {...common} key={size} data-testid={`tiny-hole-${size}`} paths={tinyHole} sourceSize={40} size={size} seed="tiny-hole" />)}
      {['palette', 'circle-dot', 'search', 'command'].map(key => {
        const icon = docsIconCatalog.find(item => item.key === key)!;
        return <PencilIcon {...common} key={key} data-testid={`detail-${key}`} paths={icon.paths} filledPaths={icon.filledPaths} sourceSize={24} size={120} seed={`detail-${key}`} />;
      })}
    </section>
    {config.catalog && <section data-testid="catalog" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
      {docsIconCatalog.map(icon => <div key={icon.key} data-catalog-icon={icon.key} style={{ minWidth: 0 }}>
        {([undefined, 'outline', 'filled'] as const).map(variant => <PencilIcon key={variant ?? 'default'}
          data-variant={variant ?? 'default'} variant={variant} fillColor={config.fillColor} paths={icon.paths} filledPaths={icon.filledPaths}
          sourceSize={24} size={40} seed={`catalog-${icon.key}`} />)}
        <div style={{ fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{icon.key}</div>
      </div>)}
    </section>}
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  let config: Configuration = { catalog: false, variant: 'outline', fillColor: 'currentColor', variableColor: '#cf3656', intensity: 1, direction: 'ltr' };
  const render = () => root.render(<Fixture config={config} />);
  render();
  return {
    update(next: Partial<Configuration>) { config = { ...config, ...next }; render(); },
    unmount() { root.unmount(); },
  };
}
