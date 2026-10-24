import { createRoot } from 'react-dom/client';
import { StrictMode, useEffect, useLayoutEffect } from 'react';
import { Toast, Button, createToastManager, useToastManager } from '@inkra/react';
import type { ToastProviderProps } from '@inkra/react';

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const manager = createToastManager();
  let options: ToastProviderProps = { timeout: 5000, limit: 2, placement: 'top-center', closeLabel: 'Close notification', viewportLabel: placement => `Notifications ${placement}` };
  let toasts: ReturnType<typeof useToastManager>['toasts'] = [];
  function Reader() {
    const current = useToastManager();
    useLayoutEffect(() => { toasts = current.toasts; }, [current]);
    useLayoutEffect(() => { current.add({ id: 'mount-layout', title: 'Layout notification', placement: 'center-start', timeout: 0 }); }, []);
    useEffect(() => { current.add({ id: 'mount-effect', title: 'Effect notification', timeout: 0 }); }, []);
    return <Button onClick={() => current.add({ title: 'From hook', placement: 'top-center' })}>Add notification</Button>;
  }
  const update = (next: ToastProviderProps = {}) => {
    options = { ...options, ...next };
    root.render(<StrictMode><Toast.Provider {...options} toastManager={manager}><Reader /></Toast.Provider></StrictMode>);
  };
  update();
  return { manager, update, getToasts: () => toasts, unmount: () => root.unmount() };
}
