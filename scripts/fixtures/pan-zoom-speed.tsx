import { createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { PanZoom, type PanZoomProps, type PanZoomRef } from '@inkra/react';

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const ref = createRef<PanZoomRef>();
  function configure(props: Partial<PanZoomProps> = {}) {
    flushSync(() => root.render(
      <PanZoom ref={ref} wheel="always" limitToBounds={false} centerZoomedOut={false}
        style={{ width: 600, maxWidth: '100%', height: 360 }} {...props}>
        <div style={{ width: 1000, height: 800 }}>
          <button type="button">Content action</button>
        </div>
      </PanZoom>,
    ));
  }
  configure();
  return {
    configure,
    reset: () => ref.current!.setTransform({ x: 0, y: 0, scale: 1 }, { duration: 0 }),
    transform: () => ref.current!.getTransform(),
    unmount: () => root.unmount(),
  };
}
