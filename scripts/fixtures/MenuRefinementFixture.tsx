import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, ContextMenu, DropdownMenu } from '@inkra/react';

const longLabel = 'A very long menu action label that must wrap readably without displacing its indicator';

function Fixture() {
  const [checked, setChecked] = useState(true);
  const [view, setView] = useState('list');
  return <main style={{ display: 'grid', gap: 28, padding: 24 }}>
    <section data-testid="dropdown-case" style={{ inlineSize: 230, maxInlineSize: '100%' }}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild><Button>Open dropdown refinement</Button></DropdownMenu.Trigger>
        <DropdownMenu.Portal><DropdownMenu.Content aria-label="Refinement actions" collisionPadding={8}>
          <DropdownMenu.Label>Refinement actions</DropdownMenu.Label>
          <DropdownMenu.Item>{longLabel}</DropdownMenu.Item>
          <DropdownMenu.Item><span data-custom-menu-label>A custom ReactNode label with an exceptionally long uninterrupted-token-abcdefghijklmnopqrstuvwxyz</span></DropdownMenu.Item>
          <DropdownMenu.Item disabled>Disabled action</DropdownMenu.Item>
          <DropdownMenu.CheckboxItem checked={checked} onCheckedChange={setChecked}>Receive updates</DropdownMenu.CheckboxItem>
          <DropdownMenu.RadioGroup value={view} onValueChange={setView}>
            <DropdownMenu.RadioItem value="list">List view</DropdownMenu.RadioItem>
            <DropdownMenu.RadioItem value="grid">Grid view</DropdownMenu.RadioItem>
          </DropdownMenu.RadioGroup>
          {Array.from({ length: 12 }, (_, index) => <DropdownMenu.Item key={index}>Extra action {index + 1}</DropdownMenu.Item>)}
        </DropdownMenu.Content></DropdownMenu.Portal>
      </DropdownMenu.Root>
    </section>

    <section data-testid="context-ltr-case" style={{ inlineSize: 240, maxInlineSize: '100%' }}>
      <ContextMenu.Root>
        <ContextMenu.Trigger aria-label="LTR context target">Open LTR context menu</ContextMenu.Trigger>
        <ContextMenu.Portal><ContextMenu.Content aria-label="LTR context actions">
          <ContextMenu.Item>{longLabel}</ContextMenu.Item>
          <ContextMenu.Item disabled>Disabled context action</ContextMenu.Item>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger>Move to a very long nested destination label</ContextMenu.SubTrigger>
            <ContextMenu.SubContent aria-label="LTR submenu">
              <ContextMenu.Item>Nested one</ContextMenu.Item><ContextMenu.Item>Nested two</ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        </ContextMenu.Content></ContextMenu.Portal>
      </ContextMenu.Root>
    </section>

    <section data-testid="context-rtl-case" dir="rtl" style={{ inlineSize: 240, maxInlineSize: '100%' }}>
      <ContextMenu.Root dir="rtl">
        <ContextMenu.Trigger aria-label="RTL context target">Open RTL context menu</ContextMenu.Trigger>
        <ContextMenu.Portal><ContextMenu.Content aria-label="RTL context actions">
          <ContextMenu.Item>RTL first</ContextMenu.Item>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger>RTL nested destination</ContextMenu.SubTrigger>
            <ContextMenu.SubContent aria-label="RTL submenu">
              <ContextMenu.Item>RTL nested one</ContextMenu.Item><ContextMenu.Item>RTL nested two</ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        </ContextMenu.Content></ContextMenu.Portal>
      </ContextMenu.Root>
    </section>
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  root.render(<Fixture />);
  return { unmount: () => root.unmount() };
}
