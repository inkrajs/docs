const pageTabs = new Set(['preview', 'api', 'accessibility']);

export function readComponentPageTab(hash: string): 'preview' | 'api' | 'accessibility' {
  try {
    const id = decodeURIComponent(hash.replace(/^#/, ''));
    if (id === 'api' || /^[a-z][a-z0-9-]*-api-[a-z][a-z0-9-]*$/.test(id)) return 'api';
    return id === 'accessibility' ? 'accessibility' : 'preview';
  } catch {
    return 'preview';
  }
}

export function readDocumentAnchor(hash: string): string | null {
  try {
    const id = decodeURIComponent(hash.replace(/^#/, ''));
    return id && !pageTabs.has(id) ? id : null;
  } catch {
    return null;
  }
}

/** Wait for lazy page content without retaining an observer after navigation. */
export function scrollToDocumentAnchor(hash: string): () => void {
  const id = readDocumentAnchor(hash);
  if (!id) return () => {};
  const expectedLocation = window.location.pathname + window.location.search + hash;
  let frame = 0;
  let observer: MutationObserver | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  const stop = () => {
    stopped = true;
    window.cancelAnimationFrame(frame);
    observer?.disconnect();
    clearTimeout(timeout);
  };
  const scroll = () => {
    frame = 0;
    if (stopped) return;
    if (window.location.pathname + window.location.search + window.location.hash !== expectedLocation) {
      stop();
      return;
    }
    const target = document.getElementById(id);
    if (!target || !target.getClientRects().length) return;
    target.scrollIntoView({ block: 'start', behavior: 'instant' });
    stop();
  };
  const schedule = () => {
    if (!frame && !stopped) frame = window.requestAnimationFrame(scroll);
  };
  observer = new MutationObserver(schedule);
  observer.observe(document.getElementById('main-content') ?? document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['hidden'],
  });
  timeout = setTimeout(stop, 8000);
  // React commits route/tab updates before the next frame, including cached lazy pages.
  schedule();
  return stop;
}
