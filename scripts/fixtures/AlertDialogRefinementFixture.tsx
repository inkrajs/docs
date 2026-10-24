import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertDialog, Button } from '@inkra/react';

type Events = {
  disabledOpen: boolean[];
  headerOnlyOpen: boolean[];
  hiddenOpen: boolean[];
  normalOpen: boolean[];
  pendingOpen: boolean[];
};

const longParagraph = 'This is deliberately long confirmation content used to verify that the dialog body scrolls while the title and actions remain visible in a short viewport. ';

function DialogCase({ events, kind }: { events: Events; kind: 'normal' | 'disabled' | 'hidden' | 'pending' | 'header-only' }) {
  const [open, setOpen] = useState(false);
  const pending = kind === 'pending';
  const disabledCancel = kind === 'disabled';
  const label = kind === 'normal' ? 'Open normal alert'
    : kind === 'disabled' ? 'Open disabled-cancel alert'
      : kind === 'hidden' ? 'Open hidden-cancel alert'
        : kind === 'header-only' ? 'Open header-only alert'
          : 'Open pending alert';
  const eventLog = kind === 'normal' ? events.normalOpen
    : kind === 'disabled' ? events.disabledOpen
      : kind === 'hidden' ? events.hiddenOpen
        : kind === 'header-only' ? events.headerOnlyOpen
          : events.pendingOpen;
  const title = kind === 'normal' ? 'Archive project?'
    : kind === 'disabled' ? 'Disabled cancel dialog'
      : kind === 'hidden' ? 'Hidden cancel dialog'
        : kind === 'header-only' ? 'A deliberately long header-only confirmation dialog with enough title content to wrap across several lines in a short viewport'
          : 'Pending confirmation';
  return <AlertDialog.Root open={open} pending={pending} onOpenChange={next => { eventLog.push(next); setOpen(next); }}>
    <AlertDialog.Trigger asChild><Button>{label}</Button></AlertDialog.Trigger>
    <AlertDialog.Portal>
      <AlertDialog.Backdrop />
      <AlertDialog.Content data-testid={`${kind}-content`}>
        <AlertDialog.Header>
          <AlertDialog.Title>{title}</AlertDialog.Title>
          <AlertDialog.Description>{kind === 'header-only' ? longParagraph.repeat(3) : 'Review this decision before continuing.'}</AlertDialog.Description>
        </AlertDialog.Header>
        {kind === 'header-only' ? null : <AlertDialog.Body>
          {kind === 'normal' ? Array.from({ length: 12 }, (_, index) => <p key={index}>{longParagraph}{index + 1}</p>) : <p>{longParagraph}</p>}
        </AlertDialog.Body>}
        <AlertDialog.Footer>
          {kind === 'hidden' ? <span hidden><AlertDialog.Cancel>Hidden cancel</AlertDialog.Cancel></span>
            : <AlertDialog.Cancel disabled={disabledCancel}>{kind === 'disabled' ? 'Disabled cancel' : 'Cancel'}</AlertDialog.Cancel>}
          <AlertDialog.Action closeOnAction={!pending}>{pending ? 'Pending action' : 'Confirm'}</AlertDialog.Action>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog.Portal>
  </AlertDialog.Root>;
}

function Fixture({ events }: { events: Events }) {
  return <main dir="rtl" style={{ display: 'grid', gap: 16, padding: 20 }}>
    <DialogCase events={events} kind="normal" />
    <DialogCase events={events} kind="disabled" />
    <DialogCase events={events} kind="hidden" />
    <DialogCase events={events} kind="header-only" />
    <DialogCase events={events} kind="pending" />
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const events: Events = { disabledOpen: [], headerOnlyOpen: [], hiddenOpen: [], normalOpen: [], pendingOpen: [] };
  root.render(<Fixture events={events} />);
  return { events, unmount: () => root.unmount() };
}
