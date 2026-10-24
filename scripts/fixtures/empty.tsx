import { createRoot } from 'react-dom/client';
import { Empty } from '@inkra/react';

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  root.render(<div style={{ padding: 16, display: 'grid', gap: 16 }}>
    {(['sm', 'md', 'lg'] as const).map(size => <Empty.Root key={size} size={size} data-test-size={size}>
      <Empty.Icon /><Empty.Title>{size}</Empty.Title>
    </Empty.Root>)}
    <Empty.Root data-test-custom-size><Empty.Icon size={144} decorative={false} aria-label="No results" illustration="search" /></Empty.Root>
    <div style={{ width: 100 }} data-test-narrow><Empty.Root size="lg"><Empty.Icon size={240} /></Empty.Root></div>
    <Empty.Icon data-test-custom><svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" /></svg></Empty.Icon>
    <Empty.Icon data-test-null>{null}</Empty.Icon>
  </div>);
  return () => root.unmount();
}
