import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Input, Popover, ThemeProvider as RootThemeProvider } from '@inkra/react';
import { ThemeProvider } from '@inkra/react/theme';
import type { InkraTheme } from '@inkra/react/theme';

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  let update: (theme: InkraTheme) => void = () => {};
  function Fixture() {
    const [theme, setTheme] = useState<InkraTheme>('dark');
    const [custom, setCustom] = useState(true);
    update = setTheme;
    return <RootThemeProvider theme={theme} data-testid="outer">
      <ThemeProvider data-testid="inherited" tokens={custom ? { '--inkra-accent': '#b87362', '--inkra-icon-stroke-width': '2px' } : undefined}>
        <Input aria-label="Draft" defaultValue="Initial" />
        <Popover.Root>
          <Popover.Trigger asChild><Button>Open scoped popover</Button></Popover.Trigger>
          <Popover.Portal><Popover.Content data-testid="scoped-popover" style={{ width: 280, maxWidth: 'calc(100vw - 32px)' }}><Input aria-label="Portal draft" defaultValue="Keep" /></Popover.Content></Popover.Portal>
        </Popover.Root>
        <Button onClick={() => setCustom(value => !value)}>Toggle tokens</Button>
      </ThemeProvider>
      <ThemeProvider theme="light" data-testid="light"><Input aria-label="Light" /></ThemeProvider>
      <ThemeProvider theme="auto" data-testid="auto"><Input aria-label="System" /></ThemeProvider>
    </RootThemeProvider>;
  }
  root.render(<Fixture />);
  return { update: (theme: InkraTheme) => update(theme), unmount: () => root.unmount() };
}
