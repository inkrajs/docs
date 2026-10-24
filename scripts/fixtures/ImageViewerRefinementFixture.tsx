import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, MediaViewer } from '@inkra/react';
import type { MediaViewerItem } from '@inkra/react';

const svg = (label: string, color: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="42">${label}</text></svg>`)}`;

const baseItems: readonly MediaViewerItem[] = [
  { id: 'one', src: svg('One', '#d9ecef'), alt: 'First inline image' },
  { id: 'two', src: svg('Two', '#f2ead7'), alt: 'Second inline image' },
  { id: 'broken', src: 'data:image/not-valid;base64,broken', alt: 'Broken inline image' },
];

type Events = { active: Array<{ id: string | null; reason: string }>; open: boolean[] };

function Fixture({ events }: { events: Events }) {
  const [activeId, setActiveId] = useState<string | null>('one');
  const [items, setItems] = useState(baseItems);
  const [open, setOpen] = useState(false);
  const [rejectChanges, setRejectChanges] = useState(false);
  const [version, setVersion] = useState(0);
  const [brokenRecovered, setBrokenRecovered] = useState(false);
  const mappedItems = useMemo(() => items.map(item => item.id === 'broken'
    ? { ...item, src: brokenRecovered ? svg('Recovered', '#d9ecef') : item.src, alt: `${item.alt} version ${version}` }
    : { ...item, alt: `${item.alt} version ${version}` }), [brokenRecovered, items, version]);
  return <main data-inkra-theme="dark" dir="rtl" style={{ padding: 16 }}>
    <MediaViewer.Root items={mappedItems} activeId={activeId} open={open} loop={false}
      onOpenChange={next => { events.open.push(next); setOpen(next); }}
      onActiveIdChange={(id, details) => { events.active.push({ id, reason: details.reason }); if (!rejectChanges) setActiveId(id); }}>
      <MediaViewer.Trigger asChild><Button variant="outline">Open refined image viewer</Button></MediaViewer.Trigger>
      <MediaViewer.Content rotatable labels={{
        title: 'An intentionally very long image viewer heading that must remain readable without hiding the stage or tools in a short viewport',
        description: 'Use keyboard and visible controls.',
        close: 'Close refined image viewer',
        previous: 'Previous refined image', next: 'Next refined image', thumbnails: 'Refined thumbnails',
        zoomIn: 'Zoom in refined image', zoomOut: 'Zoom out refined image', resetZoom: 'Reset refined zoom', rotate: 'Rotate refined image',
        retry: 'Retry refined image', failedTitle: 'Refined image failed', failedDescription: item => `${item.alt} failed`,
        imagePosition: (current, total) => `${current} / ${total}`, thumbnail: item => `Show ${item.id}`,
        panZoom: item => `Pan zoom ${item.id}`, emptyTitle: 'Refined empty', emptyDescription: 'No refined images',
      }} />
    </MediaViewer.Root>
    <button data-testid="refresh-same" type="button" onClick={() => setVersion(value => value + 1)}>Refresh same ids</button>
    <button data-testid="toggle-rejection" type="button" onClick={() => setRejectChanges(value => !value)}>Toggle controlled rejection</button>
    <button data-testid="select-second" type="button" onClick={() => setActiveId('two')}>Select second externally</button>
    <button data-testid="repair-source" type="button" onClick={() => setBrokenRecovered(true)}>Repair broken source</button>
    <button data-testid="reset-source" type="button" onClick={() => setBrokenRecovered(false)}>Reset broken source</button>
    <button data-testid="clear-images" type="button" onClick={() => setItems([])}>Clear images</button>
    <button data-testid="restore-images" type="button" onClick={() => { setItems(baseItems); setActiveId('one'); }}>Restore images</button>
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const events: Events = { active: [], open: [] };
  root.render(<Fixture events={events} />);
  return { events, unmount: () => root.unmount() };
}
