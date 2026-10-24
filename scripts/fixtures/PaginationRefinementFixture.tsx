import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pagination, PencilText } from '@inkra/react';

type Events = {
  controlledRequests: number[];
  hugeRequests: number[];
  uncontrolledRequests: number[];
};

const longPage = (page: number) => <PencilText>{`Extremely long custom page label ${page} that must wrap inside the bounded button`}</PencilText>;

function Fixture({ events }: { events: Events }) {
  const [controlledTotal, setControlledTotal] = useState(12);
  const [disabled, setDisabled] = useState(false);
  const [summaryTotal, setSummaryTotal] = useState(999999999999);
  return <main style={{ display: 'grid', gap: 24, padding: 16 }}>
    <section data-testid="controlled" dir="rtl" style={{ inlineSize: 220 }}>
      <Pagination totalPages={controlledTotal} page={6} showFirstLast disabled={disabled}
        onPageChange={page => events.controlledRequests.push(page)}
        renderPage={longPage}
        renderSummary={(page, total) => <PencilText>{`A very long current page summary: ${page} of ${total}`}</PencilText>} />
      <button type="button" onClick={() => setControlledTotal(3)}>Shrink total</button>
      <button type="button" onClick={() => setDisabled(value => !value)}>Toggle disabled</button>
    </section>

    <section data-testid="summary" style={{ inlineSize: 220 }}>
      <Pagination totalPages={summaryTotal} page={summaryTotal - 1} simple showFirstLast
        onPageChange={page => events.hugeRequests.push(page)}
        renderSummary={(page, total) => <PencilText>{`A deliberately long summary for page ${page} of the huge total ${total}`}</PencilText>} />
      <button type="button" onClick={() => setSummaryTotal(0)}>Empty summary</button>
    </section>

    <section data-testid="uncontrolled" style={{ inlineSize: 220 }}>
      <Pagination totalPages={20} defaultPage={10} showFirstLast
        onPageChange={page => events.uncontrolledRequests.push(page)} />
    </section>

    <section data-testid="flex-natural" style={{ display: 'flex', inlineSize: 340, justifyContent: 'center' }}>
      <Pagination totalPages={5} defaultPage={1} />
    </section>

    <section data-testid="grid-natural" style={{ display: 'grid', inlineSize: 340, justifyItems: 'center' }}>
      <Pagination totalPages={5} defaultPage={1} />
    </section>
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const events: Events = { controlledRequests: [], hugeRequests: [], uncontrolledRequests: [] };
  root.render(<Fixture events={events} />);
  return { events, unmount: () => root.unmount() };
}
