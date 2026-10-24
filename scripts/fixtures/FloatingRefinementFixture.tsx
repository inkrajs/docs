import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Popover, Tooltip } from '@inkra/react';

const longTitle = 'A deliberately long floating panel title that must wrap inside a narrow viewport without forcing document overflow';
const longDescription = 'Long descriptions remain selectable and readable while the floating surface respects the actual collision boundary and the short available viewport height.';
const longTooltip = 'This long tooltip contains selectable guidance, multiple clauses, and enough text to require wrapping and internal scrolling when the viewport is short.';

type Events = {
  popover: boolean[];
  tooltip: boolean[];
};

function Fixture({ events }: { events: Events }) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  return <main style={{ display: 'grid', gap: 24, padding: 16 }}>
    <section data-testid="narrow-host" data-inkra-theme="dark" style={{ inlineSize: 220 }}>
      <Popover.Root open={popoverOpen} onOpenChange={open => {
        events.popover.push(open);
        setPopoverOpen(open);
      }}>
        <Popover.Trigger asChild><Button variant="outline">Open bounded popover</Button></Popover.Trigger>
        <Popover.Portal>
          <Popover.Content align="start" side="bottom" sideOffset={8}>
            <Popover.Title>{longTitle}</Popover.Title>
            <Popover.Description>{longDescription}</Popover.Description>
            {Array.from({ length: 12 }, (_, index) => <p key={index}>Scrollable popover row {index + 1}: selectable content remains inside the pencil surface.</p>)}
            <Popover.Close asChild><Button variant="outline">Close bounded popover</Button></Popover.Close>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </section>

    <section data-testid="tooltip-host" data-inkra-theme="dark" style={{ inlineSize: 220 }}>
      <Tooltip.Provider delayDuration={0}>
        <Tooltip.Root open={tooltipOpen} onOpenChange={open => {
          events.tooltip.push(open);
          setTooltipOpen(open);
        }}>
          <Tooltip.Trigger asChild><Button variant="outline">Open bounded tooltip</Button></Tooltip.Trigger>
          <Tooltip.Portal><Tooltip.Content side="bottom" align="start">{longTooltip}</Tooltip.Content></Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    </section>
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const events: Events = { popover: [], tooltip: [] };
  root.render(<Fixture events={events} />);
  return { events, unmount: () => root.unmount() };
}
