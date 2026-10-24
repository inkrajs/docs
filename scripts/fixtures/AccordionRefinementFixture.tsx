import { useCallback, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Accordion } from '@inkra/react';

type Events = {
  blurCapture: number;
  contentRefCleanup: number;
  contentRefNodes: string[];
  focusCapture: number;
  triggerClick: number;
  values: string[];
};

function Fixture({ events }: { events: Events }) {
  const [value, setValue] = useState('open');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const callbackRef = useCallback((node: HTMLDivElement | null) => {
    events.contentRefNodes.push(node?.tagName ?? 'null');
    return () => { events.contentRefCleanup += 1; };
  }, [events]);
  const combinedContentRef = useCallback((node: HTMLDivElement | null) => {
    contentRef.current = node;
    return callbackRef(node);
  }, [callbackRef]);

  return <main style={{ display: 'grid', gap: 24, maxWidth: 680, padding: 24 }}>
    <section data-testid="force-mounted-case">
      <Accordion.Root type="single" collapsible value={value} onValueChange={next => {
        events.values.push(next);
        setValue(next);
      }}>
        <Accordion.Item value="open">
          <Accordion.Header><Accordion.Trigger ref={triggerRef} onClick={() => { events.triggerClick += 1; }}>Force mounted open item</Accordion.Trigger></Accordion.Header>
          <Accordion.Content asChild forceMount ref={combinedContentRef}
            onBlurCapture={() => { events.blurCapture += 1; }}
            onFocusCapture={() => { events.focusCapture += 1; }}>
            <label>Preserved draft <input data-testid="preserved-draft" defaultValue="saved draft" /></label>
            <a href="#force-mounted-target">Focusable force mounted link</a>
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="closed">
          <Accordion.Header><Accordion.Trigger>Initially closed force mounted item</Accordion.Trigger></Accordion.Header>
          <Accordion.Content forceMount>
            <button type="button">Closed force mounted action</button>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
      <output data-testid="ref-state">{triggerRef.current?.tagName ?? '-'}:{contentRef.current?.tagName ?? '-'}</output>
      <button type="button" data-testid="external-toggle" onClick={() => setValue(current => current ? '' : 'open')}>Toggle externally</button>
    </section>

    <section data-testid="regular-case">
      <Accordion.Root type="single" collapsible defaultValue="regular">
        <Accordion.Item value="regular">
          <Accordion.Header><Accordion.Trigger>Regular animated item</Accordion.Trigger></Accordion.Header>
          <Accordion.Content><a href="#regular-target">Regular content link</a></Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </section>

    <section data-testid="horizontal-case" style={{ inlineSize: 220, overflow: 'hidden' }}>
      <Accordion.Root type="single" collapsible defaultValue="horizontal" orientation="horizontal">
        <Accordion.Item value="horizontal">
          <Accordion.Header><Accordion.Trigger>Horizontal item with a long trigger</Accordion.Trigger></Accordion.Header>
          <Accordion.Content forceMount><span>Horizontal details</span></Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </section>
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const events: Events = { blurCapture: 0, contentRefCleanup: 0, contentRefNodes: [], focusCapture: 0, triggerClick: 0, values: [] };
  root.render(<Fixture events={events} />);
  return { events, unmount: () => root.unmount() };
}
