import { createRoot } from 'react-dom/client';
import { PencilIcon } from '@inkra/react';
import type { CSSProperties } from 'react';
import type { PencilIconPath } from '@inkra/react';
import { docsIconCatalog } from '../../src/components/iconCatalog';
import { iconColorPaths } from '../../src/components/iconColorPaths';

type Configuration = { primary?: string; secondary?: string; accent?: string; dark?: boolean };
const icons = docsIconCatalog.filter(icon => iconColorPaths(icon.data));

function Fixture({ configuration }: { configuration: Configuration }) {
  return <main data-testid="icon-color-paths" style={{
    '--inkra-icon-primary': configuration.primary,
    '--inkra-icon-secondary': configuration.secondary,
    '--inkra-icon-accent': configuration.accent,
    padding: 16, color: 'var(--inkra-ink)',
    background: 'var(--inkra-paper)',
  } as CSSProperties}>
    <section data-testid="color-catalog" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
      {icons.map(icon => <div key={icon.key} data-color-icon={icon.key}
        data-color-roles={['primary', 'secondary', 'accent'].filter(role => iconColorPaths(icon.data)!.some(path => path.color?.includes(`--inkra-icon-${role}`))).join(' ')}>
        <div style={{ display: 'flex', alignItems: 'center', minHeight: 80 }}>
          {[24, 40, 80].map(size => <PencilIcon key={size} data-size={size}
            paths={icon.paths} filledPaths={iconColorPaths(icon.data)} variant="filled"
            sourceSize={24} size={size} seed={`color-${icon.key}`} />)}
        </div>
        <div style={{ fontSize: 12 }}>{icon.key}</div>
      </div>)}
    </section>
    <section data-testid="unchanged-variants" style={{ color: '#253c36', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8 }}>
      {icons.map(icon => <div key={icon.key} data-baseline-icon={icon.key}>
        {(['outline', 'filled'] as const).map(variant => <PencilIcon key={variant} data-variant={variant}
          paths={icon.paths} filledPaths={icon.filledPaths} variant={variant}
          sourceSize={24} size={40} seed={`baseline-${icon.key}`} />)}
      </div>)}
    </section>
    <section data-testid="wash-material" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      <PencilIcon data-wash-contour="overlap" sourceSize={40} size={120} seed="wash-overlap"
        variant="filled" breaks={0} style={{ color: '#101010' }} paths={[
          { d: 'M5 5H25V35H5Z', mode: 'wash', color: '#d96d46' },
          { d: 'M15 10H35V30H15Z', mode: 'wash', color: '#4285c4' },
        ]} />
      {(['fill', 'wash'] as const).flatMap(mode => [24, 40, 120].map(size => {
        const paths: PencilIconPath[] = [{ d: 'M5 5H35V35H5Z', mode, color: '#3979b8' }];
        return <div key={`${mode}-${size}`}><PencilIcon data-wash-case={`${mode}-${size}`} paths={paths}
          sourceSize={40} size={size} seed="wash-material" variant="filled" />
          <div style={{ fontSize: 12 }}>{mode} {size}</div></div>;
      }))}
    </section>
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  let configuration: Configuration = {};
  const render = () => root.render(<Fixture configuration={configuration} />);
  const theme = (dark: boolean) => {
    const value = dark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', value);
    document.documentElement.setAttribute('data-inkra-theme', value);
  };
  theme(false);
  render();
  return {
    update(next: Configuration) {
      configuration = next;
      theme(Boolean(next.dark));
      render();
    },
    unmount() { root.unmount(); },
  };
}
