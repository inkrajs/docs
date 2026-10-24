import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Drawer } from '@inkra/react';

const longTitle = 'A very long drawer heading that must wrap beside a stable action and close control without hiding either operation';
const longDescription = 'The header, independently scrolling body, and footer actions all remain reachable in a very short viewport.';

type Events = { open: boolean[] };

function Fixture({ events }: { events: Events }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('Idle');
  return <main data-inkra-theme="dark" dir="rtl" style={{ padding: 16 }}>
    <Drawer.Root open={open} onOpenChange={next => {
      events.open.push(next);
      setOpen(next);
    }}>
      <Drawer.Trigger asChild><Button variant="outline">Open constrained drawer</Button></Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop />
        <Drawer.Content direction="left" size="sm">
          <Drawer.Header action={<Button size="sm" variant="secondary" onClick={() => setStatus('Header action clicked')}>Header action</Button>} closeLabel="Close constrained drawer">
            <Drawer.Title>{longTitle}</Drawer.Title>
            <Drawer.Description>{longDescription}</Drawer.Description>
          </Drawer.Header>
          <Drawer.Body>
            {Array.from({ length: 18 }, (_, index) => <p key={index}>Scrollable drawer detail {index + 1}: selectable body content remains available.</p>)}
            <button type="button" onClick={() => setStatus('Last body action clicked')}>Last body action</button>
          </Drawer.Body>
          <Drawer.Footer>
            <Drawer.Close asChild><Button variant="outline">Cancel drawer</Button></Drawer.Close>
            <Button onClick={() => setStatus('Save clicked')}>Save drawer</Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
    <output aria-live="polite">{status}</output>

    <Drawer.Root>
      <Drawer.Trigger asChild><Button variant="outline">Open no actions drawer</Button></Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop />
        <Drawer.Content direction="right" size="sm">
          <Drawer.Header showClose={false}><Drawer.Title>No actions heading fills the complete drawer header width</Drawer.Title></Drawer.Header>
          <Drawer.Body><p>Ordinary drawer body.</p></Drawer.Body>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>

    <Drawer.Root>
      <Drawer.Trigger asChild><Button variant="outline">Open close only drawer</Button></Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop />
        <Drawer.Content direction="right" size="sm">
          <Drawer.Header closeLabel="Close only drawer"><Drawer.Title>Close only heading remains beside its close action</Drawer.Title></Drawer.Header>
          <Drawer.Body><p>Ordinary close-only drawer body.</p></Drawer.Body>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const events: Events = { open: [] };
  root.render(<Fixture events={events} />);
  return { events, unmount: () => root.unmount() };
}
