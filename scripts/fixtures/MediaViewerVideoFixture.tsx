import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, MediaViewer } from '@inkra/react';
import artwork from '../../src/assets/inkra.png';

const items = [
  { id: 'video', type: 'video' as const, src: '/media/inkra-artwork.webm', poster: artwork, alt: 'Animated Inkra artwork' },
  { id: 'image', type: 'image' as const, src: artwork, alt: 'Static Inkra artwork' },
];

type Events = { active: Array<string | null>; open: boolean[] };

function Fixture({ events }: { events: Events }) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>('video');
  return <main style={{ padding: 24 }}>
    <MediaViewer.Root items={items} activeId={activeId} open={open}
      onActiveIdChange={next => { events.active.push(next); setActiveId(next); }}
      onOpenChange={next => { events.open.push(next); setOpen(next); }}>
      <MediaViewer.Trigger asChild><Button>Open mixed media viewer</Button></MediaViewer.Trigger>
      <MediaViewer.Content labels={{
        title: 'Mixed media viewer', description: 'Browse video and image resources.', close: 'Close mixed media viewer',
        previous: 'Previous resource', next: 'Next resource', thumbnails: 'Resource thumbnails',
        imagePosition: (current, total) => `${current} of ${total}`,
        thumbnail: (item, current, total) => `Show ${item.alt}, ${current} of ${total}`,
        panZoom: item => `Pan and zoom ${item.alt}`,
      }} videoLabels={{
        controls: 'Artwork video controls', play: 'Play artwork video', pause: 'Pause artwork video', seek: 'Seek artwork video',
        mute: 'Mute artwork video', unmute: 'Unmute artwork video', volume: 'Artwork video volume', rate: 'Artwork video speed',
        playbackError: 'Artwork video could not start.', time: (current, duration) => `${current.toFixed(1)} / ${duration.toFixed(1)} seconds`,
      }} />
    </MediaViewer.Root>
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const events: Events = { active: [], open: [] };
  root.render(<Fixture events={events} />);
  return { events, unmount: () => root.unmount() };
}
