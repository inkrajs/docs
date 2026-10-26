import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  InfiniteScroll,
  Loading,
  Masonry,
  PencilSurface,
  PencilText,
  Switch,
} from '@inkra/react';

import { useLocale } from '../i18n';
import { ComponentExample } from './ComponentExample';
import { ComponentPlayground } from './ComponentPlayground';
import { DocsSelect } from './DocsSelect';
import { choiceVisuals } from './docsChoiceVisuals';
import { infiniteScrollCopy } from './infiniteScrollCopy';
import { PropertyTabs } from './PropertyTabs';
import './InfiniteScrollExamples.css';

const wait = (milliseconds: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
  const timer = window.setTimeout(resolve, milliseconds);
  signal.addEventListener('abort', () => {
    window.clearTimeout(timer);
    reject(new DOMException('Aborted', 'AbortError'));
  }, { once: true });
});

type Range = { minX: number; maxX: number; minY: number; maxY: number };
type Direction = 'top' | 'bottom' | 'left' | 'right';
type LoadContext = { direction: Direction; signal: AbortSignal };
type GalleryItem = { id: number; height: number };
type IndicatorContext = { status: 'idle' | 'pulling' | 'ready' | 'loading' | 'error' | 'end'; label: string; retry: () => void; load: () => void };
const initialRange: Range = { minX: -3, maxX: 3, minY: -3, maxY: 3 };

function FourWayBoard() {
  const { locale } = useLocale();
  const text = infiniteScrollCopy(locale);
  const rootRef = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState(initialRange);
  const [counts, setCounts] = useState<Record<Direction, number>>({ top: 0, bottom: 0, left: 0, right: 0 });
  const [directionMode, setDirectionMode] = useState<'bottom' | 'vertical' | 'all'>('all');
  const [mode, setMode] = useState<'automatic' | 'release' | 'both'>('release');
  const [disabled, setDisabled] = useState(false);
  const [triggerDistance, setTriggerDistance] = useState(48);
  const [gestureThreshold, setGestureThreshold] = useState(72);
  const directions = directionMode === 'bottom' ? ['bottom'] as const
    : directionMode === 'vertical' ? ['top', 'bottom'] as const
      : ['top', 'bottom', 'left', 'right'] as const;
  const columns = range.maxX - range.minX + 1;
  const cells = useMemo(() => {
    const next = [];
    for (let y = range.minY; y <= range.maxY; y += 1) {
      for (let x = range.minX; x <= range.maxX; x += 1) next.push({ x, y, id: `${x}:${y}` });
    }
    return next;
  }, [range]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.scrollLeft = Math.max(0, (root.scrollWidth - root.clientWidth) / 2);
    root.scrollTop = Math.max(0, (root.scrollHeight - root.clientHeight) / 2);
  }, []);

  async function load({ direction, signal }: LoadContext) {
    await wait(360, signal);
    setCounts(current => ({ ...current, [direction]: current[direction] + 1 }));
    setRange(current => direction === 'top' ? { ...current, minY: current.minY - 3 }
      : direction === 'bottom' ? { ...current, maxY: current.maxY + 3 }
        : direction === 'left' ? { ...current, minX: current.minX - 3 }
          : { ...current, maxX: current.maxX + 3 });
  }

  const code = `<InfiniteScroll
  directions={${JSON.stringify(directions)}}
  automatic={${mode !== 'release'}}
  gesture={${mode !== 'automatic'}}
  triggerDistance={${triggerDistance}}
  gestureThreshold={${gestureThreshold}}
  disabled={${disabled}}
  hasMore={hasMore}
  onLoad={load}
>
  <ResearchBoard />
</InfiniteScroll>`;

  return <>
    <ComponentPlayground code={code} controls={<PropertyTabs groups={[
      { label: '基础', content: <>
        <DocsSelect label={text.directions} visuals={choiceVisuals.loadDirection} value={directionMode} onValueChange={value => setDirectionMode(value as typeof directionMode)} options={[
          ['bottom', text.bottom], ['vertical', text.vertical], ['all', text.all],
        ]} />
        <DocsSelect label={text.interaction} visuals={choiceVisuals.loadInteraction} value={mode} onValueChange={value => setMode(value as typeof mode)} options={[
          ['automatic', text.automatic], ['release', text.release], ['both', text.both],
        ]} />
      </> },
      { label: '交互', content: <>
        <DocsSelect label={text.trigger} value={String(triggerDistance)} onValueChange={value => setTriggerDistance(Number(value))} options={[['0', '0px'], ['48', '48px'], ['120', '120px']]} />
        <DocsSelect label={text.threshold} value={String(gestureThreshold)} onValueChange={value => setGestureThreshold(Number(value))} options={[['48', '48px'], ['72', '72px'], ['96', '96px']]} />
      </> },
      { label: '状态', content: <Switch label={text.disabled} checked={disabled} onCheckedChange={setDisabled} /> },
    ]} />}>
      <PencilSurface className="infinite-scroll-examples__board-frame" radius={8} variant="outline">
        <InfiniteScroll
          aria-label={text.board}
          automatic={mode !== 'release'}
          className="infinite-scroll-examples__board"
          data-testid="infinite-scroll-board"
          directions={directions}
          disabled={disabled}
          gesture={mode !== 'automatic'}
          gestureThreshold={gestureThreshold}
          hasMore={{ top: counts.top < 3, bottom: counts.bottom < 3, left: counts.left < 3, right: counts.right < 3 }}
          onLoad={load}
          ref={rootRef}
          triggerDistance={triggerDistance}
        >
          <div className="infinite-scroll-examples__grid" style={{ gridTemplateColumns: `repeat(${columns}, 104px)` }}>
            {cells.map(cell => <PencilSurface
              className="infinite-scroll-examples__cell"
              data-infinite-scroll-anchor={cell.id}
              key={cell.id}
              radius={6}
              variant="quiet"
            ><PencilText>{`${text.column} ${cell.x}`}</PencilText><small><PencilText>{`${text.row} ${cell.y}`}</PencilText></small></PencilSurface>)}
          </div>
        </InfiniteScroll>
      </PencilSurface>
    </ComponentPlayground>

    <HistoryExample />
    <PullExample />
    <LoadingMasonryExample />
    <LifecycleExample />
    <FailureExample />
  </>;
}

function HistoryExample() {
  const { locale } = useLocale();
  const text = infiniteScrollCopy(locale);
  const rootRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState(() => Array.from({ length: 16 }, (_, index) => index + 20));
  const [topLoads, setTopLoads] = useState(0);
  useLayoutEffect(() => { if (rootRef.current) rootRef.current.scrollTop = 180; }, []);
  return <ComponentExample id="infinite-scroll-history" title={text.history} code={`<InfiniteScroll directions={['top', 'bottom']} automatic triggerDistance={0} hasMore={hasMore} onLoad={loadHistory}>
  {items.map(item => <HistoryRow data-infinite-scroll-anchor={item.id} />)}
</InfiniteScroll>`}>
    <div className="infinite-scroll-examples__example-stack">
      <InfiniteScroll
        aria-label={text.history}
        automatic
        className="infinite-scroll-examples__history"
        data-testid="infinite-scroll-history"
        directions={['top', 'bottom']}
        gesture={false}
        hasMore={{ top: topLoads < 2, bottom: true }}
        onLoad={async ({ direction, signal }: LoadContext) => {
          await wait(240, signal);
          if (direction === 'top') {
            setItems(current => Array.from({ length: 8 }, (_, index) => current[0] - 8 + index).concat(current));
            setTopLoads(value => value + 1);
          } else setItems(current => current.concat(Array.from({ length: 8 }, (_, index) => current.at(-1)! + index + 1)));
        }}
        ref={rootRef}
        triggerDistance={0}
      >
        <div className="infinite-scroll-examples__history-list">
          {items.map(item => <div className="infinite-scroll-examples__history-row" data-infinite-scroll-anchor={`history-${item}`} key={item}>
            <PencilText>{`${text.note} ${item}`}</PencilText>{item < 20 && <small><PencilText>{text.added}</PencilText></small>}
          </div>)}
        </div>
      </InfiniteScroll>
    </div>
  </ComponentExample>;
}

function PullExample() {
  const { locale } = useLocale();
  const text = infiniteScrollCopy(locale);
  const [items, setItems] = useState([3, 4, 5, 6, 7, 8]);
  return <ComponentExample id="infinite-scroll-pull" title={text.pull} code={`<InfiniteScroll directions="top" automatic={false} gesture gestureThreshold={64} onLoad={loadEarlier}>
  <MessageList />
</InfiniteScroll>`}>
    <InfiniteScroll
      aria-label={text.pull}
      automatic={false}
      className="infinite-scroll-examples__pull"
      data-testid="infinite-scroll-pull"
      directions="top"
      gesture
      gestureThreshold={64}
      hasMore={items[0] > 1}
      onLoad={async ({ signal }: LoadContext) => {
        await wait(240, signal);
        setItems(current => [current[0] - 2, current[0] - 1, ...current]);
      }}
    >
      <div className="infinite-scroll-examples__history-list">
        {items.map(item => <div className="infinite-scroll-examples__history-row" data-infinite-scroll-anchor={`pull-${item}`} key={item}><PencilText>{`${text.note} ${item}`}</PencilText></div>)}
      </div>
    </InfiniteScroll>
  </ComponentExample>;
}

function FailureExample() {
  const { locale } = useLocale();
  const text = infiniteScrollCopy(locale);
  const attempts = useRef(0);
  const [items, setItems] = useState([1, 2, 3]);
  const [hasMore, setHasMore] = useState(true);
  return <ComponentExample id="infinite-scroll-retry" title={text.failure} code={`<InfiniteScroll automatic={false} hasMore={hasMore} onLoad={loadWithRetry}>
  <ResultRows />
</InfiniteScroll>`}>
    <div className="infinite-scroll-examples__example-stack">
      <PencilText>{attempts.current === 0 ? text.firstFailure : hasMore ? text.retryHint : text.endHint}</PencilText>
      <InfiniteScroll
        aria-label={text.failure}
        automatic={false}
        className="infinite-scroll-examples__failure"
        data-testid="infinite-scroll-failure"
        directions="bottom"
        gesture={false}
        hasMore={hasMore}
        onLoad={async ({ signal }: LoadContext) => {
          await wait(180, signal);
          attempts.current += 1;
          if (attempts.current === 1) throw new Error('Demo request failed');
          setItems(current => [...current, 4, 5, 6]);
          setHasMore(false);
        }}
      >
        <div className="infinite-scroll-examples__history-list">
          {items.map(item => <div className="infinite-scroll-examples__history-row" key={item}><PencilText>{`${text.note} ${item}`}</PencilText></div>)}
        </div>
      </InfiniteScroll>
    </div>
  </ComponentExample>;
}

function LoadingMasonryExample() {
  const { locale } = useLocale();
  const text = infiniteScrollCopy(locale);
  const [items, setItems] = useState<GalleryItem[]>(() => Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    height: 72 + index % 4 * 24,
  })));
  const hasMore = items.length < 20;
  return <ComponentExample id="infinite-scroll-loading-masonry" title={text.masonry} code={`<InfiniteScroll
  hasMore={items.length < 20}
  onLoad={loadNextPage}
  renderIndicator={({ status, label, retry }) =>
    status === 'loading'
      ? <Loading mode="inline" title={label} progress={null} />
      : status === 'error'
        ? <Loading mode="inline" status="error" title={label} onRetry={retry} />
        : status === 'idle' ? null : <PencilText>{label}</PencilText>}
>
  <Masonry items={items} getItemKey={item => item.id} renderItem={({ item }) => <GalleryCard item={item} />} />
</InfiniteScroll>`}>
    <InfiniteScroll
      aria-label={text.masonry}
      className="infinite-scroll-examples__masonry-scroll"
      data-testid="infinite-scroll-masonry"
      directions="bottom"
      hasMore={hasMore}
      onLoad={async ({ signal }: LoadContext) => {
        await wait(420, signal);
        setItems(current => current.concat(Array.from({ length: Math.min(4, 20 - current.length) }, (_, index) => {
          const id = current.length + index + 1;
          return { id, height: 72 + id % 5 * 20 };
        })));
      }}
      renderIndicator={({ status, label, retry }: IndicatorContext) => status === 'loading'
        ? <Loading mode="inline" title={label} progress={null} />
        : status === 'error'
          ? <Loading mode="inline" status="error" title={label} onRetry={retry} />
          : status === 'end'
            ? <PencilText>{text.complete}</PencilText>
            : status === 'idle' ? null : <PencilText>{label}</PencilText>}
      triggerDistance={64}
    >
      <Masonry
        aria-label={text.masonryNotes}
        className="infinite-scroll-examples__masonry"
        columnGap={12}
        getItemKey={(item: GalleryItem) => item.id}
        items={items}
        maxColumns={3}
        minColumnWidth={132}
        renderItem={({ item }: { item: GalleryItem }) => <PencilSurface
          className="infinite-scroll-examples__masonry-card"
          radius={8}
          style={{ minHeight: item.height }}
          variant="quiet"
        ><PencilText>{`${text.note} ${item.id}`}</PencilText></PencilSurface>}
        rowGap={12}
      />
    </InfiniteScroll>
  </ComponentExample>;
}

function LifecycleExample() {
  const { locale } = useLocale();
  const text = infiniteScrollCopy(locale);
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [useOuter, setUseOuter] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [directionEnabled, setDirectionEnabled] = useState(true);
  const [events, setEvents] = useState({ started: 0, aborted: 0, completed: 0, unexpected: 0 });
  const controlledState = useMemo(() => ({ top: { status: 'loading' as const } }), []);
  const load = ({ signal }: LoadContext) => new Promise<void>((resolve, reject) => {
    setEvents(current => ({ ...current, started: current.started + 1 }));
    const timer = window.setTimeout(() => {
      setEvents(current => ({ ...current, completed: current.completed + 1 }));
      resolve();
    }, 1400);
    signal.addEventListener('abort', () => {
      window.clearTimeout(timer);
      setEvents(current => ({ ...current, aborted: current.aborted + 1 }));
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
  return <ComponentExample id="infinite-scroll-lifecycle" title={text.lifecycle} code={`<InfiniteScroll
  scrollContainer={() => useOuter ? outerRef.current : innerRef.current}
  disabled={disabled}
  directions={directionEnabled ? 'bottom' : []}
  automatic={false}
  onLoad={load}
/>`}>
    <div className="infinite-scroll-examples__lifecycle-stack">
      <div className="infinite-scroll-examples__actions">
        <Button data-testid="infinite-scroll-container-toggle" size="sm" variant="outline" onClick={() => setUseOuter(value => !value)}>{text.lifecycleContainer}</Button>
        <Button data-testid="infinite-scroll-disabled-toggle" size="sm" variant="outline" onClick={() => setDisabled(value => !value)}>{text.lifecycleDisabled}</Button>
        <Button data-testid="infinite-scroll-direction-toggle" size="sm" variant="outline" onClick={() => setDirectionEnabled(value => !value)}>{text.lifecycleDirection}</Button>
      </div>
      <output
        data-aborted={events.aborted}
        data-completed={events.completed}
        data-started={events.started}
        data-testid="infinite-scroll-lifecycle-events"
      ><PencilText>{`${text.started} ${events.started}; ${text.aborted} ${events.aborted}; ${text.completed} ${events.completed}`}</PencilText></output>
      <div className="infinite-scroll-examples__lifecycle-outer" ref={outerRef}>
        <div className="infinite-scroll-examples__lifecycle-inner" ref={innerRef}>
          <InfiniteScroll
            aria-label={text.lifecycle}
            automatic={false}
            className="infinite-scroll-examples__lifecycle-scroll"
            data-testid="infinite-scroll-lifecycle"
            directions={directionEnabled ? 'bottom' : []}
            disabled={disabled}
            gesture={false}
            onLoad={load}
            scrollContainer={() => useOuter ? outerRef.current : innerRef.current}
          >
            <div className="infinite-scroll-examples__history-list">
              {Array.from({ length: 8 }, (_, index) => <div className="infinite-scroll-examples__history-row" key={index}><PencilText>{`${text.lifecycleItem} ${index + 1}`}</PencilText></div>)}
            </div>
          </InfiniteScroll>
        </div>
      </div>
      <output aria-label={text.unexpected} data-testid="infinite-scroll-controlled-count">{events.unexpected}</output>
      <InfiniteScroll
        aria-label={text.controlled}
        automatic={false}
        className="infinite-scroll-examples__controlled"
        data-testid="infinite-scroll-controlled"
        directions="top"
        gesture
        onLoad={() => setEvents(current => ({ ...current, unexpected: current.unexpected + 1 }))}
        state={controlledState}
      >
        <div className="infinite-scroll-examples__history-list">
          {Array.from({ length: 8 }, (_, index) => <div className="infinite-scroll-examples__history-row" key={index}><PencilText>{`${text.controlledItem} ${index + 1}`}</PencilText></div>)}
        </div>
      </InfiniteScroll>
    </div>
  </ComponentExample>;
}

export function InfiniteScrollExamples() {
  return <FourWayBoard />;
}
