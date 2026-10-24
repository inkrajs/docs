import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Carousel } from '@inkra/react';

const cards = ['One', 'Two', 'Three', 'Four', 'Five'];

type Events = {
  accepted: number[];
  rejected: number[];
  uncontrolled: number[];
};

function renderSlides(count = cards.length) {
  return cards.slice(0, count).map((label, index) => <article key={label} data-slide-card={label}
    style={{ boxSizing: 'border-box', minBlockSize: 96, padding: 12 }}>
    <span>{label}</span>{index === 3 ? <button type="button">Focus Four</button> : null}
  </article>);
}

function Fixture({ events }: { events: Events }) {
  const [acceptedIndex, setAcceptedIndex] = useState(0);
  const [itemCount, setItemCount] = useState(5);

  return <main style={{ display: 'grid', gap: 24, maxWidth: 760, padding: 24 }}>
    <Button>Outside carousel focus</Button>

    <section data-testid="responsive-case" style={{ inlineSize: 608, maxInlineSize: '100%', minInlineSize: 0 }}>
      <Carousel aria-label="Responsive carousel" gap={16} visibleItems={{ base: 1, sm: 2, md: 3 }}>
        {renderSlides()}
      </Carousel>
    </section>

    <section data-testid="narrow-case" style={{ inlineSize: 360, maxInlineSize: '100%', minInlineSize: 0 }}>
      <Carousel aria-label="Narrow carousel" labels={{ pages: 'A deliberately long pagination group label' }}>
        {renderSlides()}
      </Carousel>
    </section>

    <section data-testid="accepted-case" style={{ inlineSize: 360, maxInlineSize: '100%', minInlineSize: 0 }}>
      <Carousel aria-label="Accepted controlled carousel" currentIndex={acceptedIndex}
        onCurrentIndexChange={index => { events.accepted.push(index); setAcceptedIndex(index); }}>
        {renderSlides()}
      </Carousel>
    </section>

    <section data-testid="rejected-case" style={{ inlineSize: 360, maxInlineSize: '100%', minInlineSize: 0 }}>
      <Carousel aria-label="Rejected controlled carousel" currentIndex={0}
        onCurrentIndexChange={index => events.rejected.push(index)}>
        {renderSlides()}
      </Carousel>
    </section>

    <section data-testid="items-case" style={{ inlineSize: 360, maxInlineSize: '100%', minInlineSize: 0 }}>
      <Carousel aria-label="Changing items carousel" defaultIndex={4}
        onCurrentIndexChange={index => events.uncontrolled.push(index)}>
        {renderSlides(itemCount)}
      </Carousel>
      <Button onClick={() => setItemCount(2)}>Keep two slides</Button>
      <Button onClick={() => setItemCount(5)}>Restore five slides</Button>
    </section>

    <section data-testid="autoplay-case" style={{ inlineSize: 360, maxInlineSize: '100%', minInlineSize: 0 }}>
      <Carousel aria-label="Autoplay carousel" autoplay={{ delay: 1000, pauseOnFocus: true, pauseOnHover: true, stopOnInteraction: false }} loop>
        {renderSlides()}
      </Carousel>
    </section>

    <section data-testid="reduced-case" style={{ inlineSize: 360, maxInlineSize: '100%', minInlineSize: 0 }}>
      <Carousel aria-label="Reduced motion carousel" autoplay={{ delay: 1000 }}>
        {renderSlides()}
      </Carousel>
    </section>
  </main>;
}

export function mount(container: HTMLElement) {
  const root = createRoot(container);
  const events: Events = { accepted: [], rejected: [], uncontrolled: [] };
  root.render(<Fixture events={events} />);
  return { events, unmount: () => root.unmount() };
}
