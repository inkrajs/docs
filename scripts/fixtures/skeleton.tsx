import { createRoot } from 'react-dom/client';
import { Skeleton } from '@inkra/react';

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  root.render(<div style={{ display: 'grid', gap: 24, padding: 24 }}>
    {[0, 6, 8].map(radius => <Skeleton key={radius} seed="skeleton-fixture" radius={radius} width={240} height={64} data-radius={radius} />)}
    <Skeleton width={180} height={16} animation="pulse" />
  </div>);
  return () => root.unmount();
}
