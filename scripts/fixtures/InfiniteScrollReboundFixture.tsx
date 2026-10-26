import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { InfiniteScroll, type InfiniteScrollDirection } from '@inkra/react';

function Fixture({ direction, events }: { direction: InfiniteScrollDirection; events: string[] }) {
  const [items, setItems] = useState(Array.from({ length: 12 }, (_, index) => index));
  const horizontal = direction === 'left' || direction === 'right';
  return <InfiniteScroll data-testid="rebound" directions={direction} gesture automatic={false}
    gestureThreshold={72} triggerDistance={0}
    style={{ width: 320, height: 300, margin: 32 }}
    renderIndicator={({ status }) => <span style={{ display: 'block', height: 24 }}>{status}</span>}
    onLoad={async ({ direction: edge }) => {
      events.push(edge);
      await new Promise(resolve => setTimeout(resolve, 80));
      setItems(current => edge === 'top' || edge === 'left'
        ? [current[0] - 2, current[0] - 1, ...current]
        : [...current, current[current.length - 1] + 1, current[current.length - 1] + 2]);
    }}>
    <div style={{ display: 'flex', flexDirection: horizontal ? 'row' : 'column', width: horizontal ? 'max-content' : '100%' }}>
      {items.map(item => <div key={item} data-infinite-scroll-anchor={item}
        style={{ flex: 'none', width: horizontal ? 120 : '100%', height: horizontal ? 248 : 60, padding: 12 }}>
        Item {item}
      </div>)}
    </div>
  </InfiniteScroll>;
}

export function mount(container: HTMLElement, direction: InfiniteScrollDirection) {
  const root = createRoot(container);
  const events: string[] = [];
  root.render(<Fixture direction={direction} events={events} />);
  return { events, unmount: () => root.unmount() };
}
