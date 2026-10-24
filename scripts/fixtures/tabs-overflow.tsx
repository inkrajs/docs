import { useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { Tabs, type TabsOverflow } from '@inkra/react';

const labels = ['Alpha notes', 'Draft ideas', 'Shared workspace', 'Archive files', 'History notes', 'Preferences'];

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const api = {
    events: [] as string[],
    setWidth: (_value: number) => {},
    setValue: (_value: string) => {},
    setCount: (_value: number) => {},
    setLabel: (_value: string) => {},
    setDirection: (_value: 'ltr' | 'rtl') => {},
    setMode: (_value: TabsOverflow) => {},
    unmount: () => root.unmount(),
  };
  function Fixture() {
    const [width, setWidth] = useState(300);
    const [value, setValue] = useState('0');
    const [count, setCount] = useState(6);
    const [label, setLabel] = useState('Alpha notes');
    const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
    const [mode, setMode] = useState<TabsOverflow>('menu');
    Object.assign(api, { setWidth, setValue, setCount, setLabel, setDirection, setMode });
    const demo = (id: string, overflow: TabsOverflow, extra: { value?: string; onValueChange?: (value: string) => void; activationMode?: 'manual'; children?: ReactNode } = {}) =>
      <Tabs.Root data-testid={id} defaultValue="0" dir={direction} style={{ width, maxWidth: '100%', minWidth: 0 }} {...extra}>
        <Tabs.List overflow={overflow} aria-label={id} fullWidth={id === 'full-width'} divided={id === 'full-width'}>
          {labels.slice(0, count).map((name, index) => <Tabs.Trigger key={index} value={String(index)} disabled={index === 1} overflowLabel={index === 5 ? 'Settings and preferences' : undefined}>
            {index === 0 ? label : name}
          </Tabs.Trigger>)}
        </Tabs.List>
        {labels.slice(0, count).map((_, index) => <Tabs.Content key={index} value={String(index)} forceMount><input aria-label={`Draft ${id} ${index}`} defaultValue={`Panel ${index}`} /></Tabs.Content>)}
      </Tabs.Root>;
    return <main style={{ display: 'grid', gap: 28, padding: 16, minWidth: 0 }}>
      {demo('native', 'scroll')}
      {demo('buttons', 'buttons', { value, onValueChange: next => { api.events.push(`buttons:${next}`); setValue(next); } })}
      {demo('menu', mode, { value, onValueChange: next => { api.events.push(`menu:${next}`); setValue(next); } })}
      {demo('rejected', 'menu', { value: '0', onValueChange: next => api.events.push(`rejected:${next}`) })}
      {demo('full-width', 'menu')}
      {demo('manual', 'menu', { activationMode: 'manual' })}
    </main>;
  }
  root.render(<Fixture />);
  return api;
}
