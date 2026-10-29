import { startTransition, Suspense, useEffect, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from 'react';
import { PencilText, useLocale } from '../i18n';
import { DocsIcon } from './DocsIcon';

type IdleWindow = Window & { requestIdleCallback?: (callback: () => void, options: { timeout: number }) => number };
const pending = new Map<Element, () => void>();
const artwork = new Map<Element, () => void>();
let scheduled = false;

// Prepare one nearby example at a time, leaving a frame between mounts.
function schedulePreparation() {
  if (scheduled || (!pending.size && !artwork.size)) return;
  scheduled = true;
  const run = () => {
    const queue = artwork.size ? artwork : pending;
    const next = queue.entries().next().value;
    if (next) {
      queue.delete(next[0]);
      startTransition(next[1]);
    }
    window.setTimeout(() => { scheduled = false; schedulePreparation(); }, 16);
  };
  const idle = (window as IdleWindow).requestIdleCallback;
  if (idle) idle.call(window, run, { timeout: 200 });
  else window.setTimeout(run, 32);
}

// Keep the native hand-written text in place, then add its decorative bitmap
// in a separate task. Layout, selection and accessible text never change.
export function DeferredPencilText(props: ComponentProps<typeof PencilText>) {
  const host = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    pending.set(node, () => setReady(true));
    schedulePreparation();
    return () => { pending.delete(node); };
  }, []);
  return <PencilText {...props} ref={host} className={[props.className, 'home-deferred-text'].filter(Boolean).join(' ')} style={{ ...props.style, ...(!ready ? { '--inkra-letter-effect': 0 } : {}) } as CSSProperties} />;
}

// Complex graph labels remain readable while their pencil decoration is prepared.
export function DeferredArtwork({ children, fallback, className, style }: { children: ReactNode; fallback?: ReactNode; className?: string; style?: CSSProperties }) {
  const host = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    artwork.set(node, () => setReady(true));
    schedulePreparation();
    return () => { artwork.delete(node); };
  }, []);
  useEffect(() => {
    if (!ready) return;
    // Let the newly mounted icon paint while transparent, then reveal it.
    let frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => setVisible(true)); });
    return () => cancelAnimationFrame(frame);
  }, [ready]);
  return <span ref={host} className={['home-deferred-artwork', className].filter(Boolean).join(' ')}
    data-artwork-visible={visible} style={style}>{ready ? children : fallback}</span>;
}

export function DeferredDocsIcon(props: ComponentProps<typeof DocsIcon>) {
  const size = props.size ?? 22;
  return <DeferredArtwork style={{ display: 'inline-flex', width: size, height: size, flexShrink: 0 }}><DocsIcon {...props} /></DeferredArtwork>;
}

function DemoContent({ children }: { children: ReactNode }) {
  const content = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const node = content.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealed(true);
      return;
    }
    let frame = 0;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      // Initial opacity comes from CSS, before any effect or observer runs.
      // Give canvas painters a frame to finish before starting the entrance.
      frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => setRevealed(true)); });
    });
    observer.observe(node);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);
  return <div ref={content} className="home-demo-content" data-revealed={revealed}>{children}</div>;
}

export function DeferredDemo({ children, wide = false, order = 0, id, estimatedHeight = wide ? 490 : 320, mobileHeight = estimatedHeight }: {
  children: ReactNode; wide?: boolean; order?: number; id?: string; estimatedHeight?: number; mobileHeight?: number;
}) {
  const { locale } = useLocale();
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const node = host.current;
    if (ready || !node) return;
    if (typeof IntersectionObserver === 'undefined') { setReady(true); return; }
    const prepare = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      prepare.disconnect();
      pending.set(node, () => setReady(true));
      schedulePreparation();
    }, { rootMargin: '900px 0px' });
    const urgent = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      pending.delete(node);
      prepare.disconnect();
      urgent.disconnect();
      setReady(true);
    }, { rootMargin: '160px 0px' });
    prepare.observe(node);
    urgent.observe(node);
    return () => { pending.delete(node); prepare.disconnect(); urgent.disconnect(); };
  }, [ready]);
  const placeholder = <div className="home-demo-loading" aria-busy="true" />;
  return <div ref={host} id={id} tabIndex={ready ? undefined : 0} onFocus={() => setReady(true)}
    aria-label={ready ? undefined : locale === 'en' ? 'Interactive example' : '交互示例'}
    style={{ order, '--home-demo-height': `${estimatedHeight}px`, '--home-demo-mobile-height': `${mobileHeight}px` } as CSSProperties}
    className={`home-deferred-demo${wide ? ' home-deferred-demo--wide' : ''}`}>
    {ready ? <Suspense fallback={placeholder}><DemoContent>{children}</DemoContent></Suspense> : placeholder}
  </div>;
}
