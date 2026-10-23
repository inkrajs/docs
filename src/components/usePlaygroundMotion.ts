import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from 'react';

const duration = 180;
const easing = 'cubic-bezier(0.2, 0, 0, 1)';
type Motion = { animation: Animation; complete: () => void };
type ElementRef = RefObject<HTMLDivElement | null>;

function usePlaygroundAnimation() {
  const motions = useRef(new Map<HTMLElement, Motion>());
  const reduced = useRef(true);
  useLayoutEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      reduced.current = preference.matches;
      if (reduced.current) for (const motion of [...motions.current.values()]) motion.complete();
    };
    update();
    preference.addEventListener('change', update);
    return () => {
      preference.removeEventListener('change', update);
      for (const [element, motion] of motions.current) {
        motion.animation.onfinish = null;
        motion.animation.cancel();
        delete element.dataset.playgroundMoving;
      }
      motions.current.clear();
    };
  }, []);
  return useCallback((element: HTMLElement, frames: Keyframe[], onFinish?: () => void) => {
    const previous = motions.current.get(element);
    if (previous) {
      const style = getComputedStyle(element);
      frames = [{ ...frames[0], ...(frames[0].transform !== undefined ? { transform: style.transform } : {}), ...(frames[0].opacity !== undefined ? { opacity: style.opacity } : {}) }, ...frames.slice(1)];
      previous.animation.onfinish = null;
      previous.animation.cancel();
      motions.current.delete(element);
      delete element.dataset.playgroundMoving;
    }
    if (reduced.current || !element.animate || !element.isConnected) {
      onFinish?.();
      return () => {};
    }
    const animation = element.animate(frames, { duration, easing });
    element.dataset.playgroundMoving = '';
    const release = () => {
      if (motions.current.get(element)?.animation !== animation) return false;
      motions.current.delete(element);
      delete element.dataset.playgroundMoving;
      animation.onfinish = null;
      animation.cancel();
      return true;
    };
    const complete = () => { if (release()) onFinish?.(); };
    motions.current.set(element, { animation, complete });
    animation.onfinish = complete;
    return () => { release(); };
  }, []);
}

export function usePlaygroundMotion({ rootRef, displayRef, controlsRef, controlsOpen, explicitChoice, layout, view }: {
  rootRef: ElementRef;
  displayRef: ElementRef;
  controlsRef: ElementRef;
  controlsOpen: boolean;
  explicitChoice: boolean;
  layout: 'wide' | 'overlay' | 'full';
  view: 'preview' | 'code';
}) {
  const animate = usePlaygroundAnimation();
  const [controlsPresent, setControlsPresent] = useState(controlsOpen);
  const previousOpen = useRef(controlsOpen);
  const entering = useRef(false);
  useLayoutEffect(() => {
    const changed = previousOpen.current !== controlsOpen;
    previousOpen.current = controlsOpen;
    const panel = controlsRef.current;
    if (!panel || !explicitChoice) {
      setControlsPresent(controlsOpen);
      return;
    }
    if (controlsOpen && !controlsPresent) {
      entering.current = true;
      setControlsPresent(true);
      return;
    }
    const direction = getComputedStyle(panel).direction === 'rtl' ? -1 : 1;
    const distance = direction * (layout === 'wide' ? 10 : 24);
    if (controlsOpen && (changed || entering.current)) {
      entering.current = false;
      return animate(panel, [{ opacity: 0, transform: `translateX(${distance}px)` }, { opacity: 1, transform: 'none' }]);
    }
    if (!controlsOpen && controlsPresent) {
      entering.current = false;
      return animate(panel, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${distance}px)` }], () => setControlsPresent(false));
    }
  }, [animate, controlsOpen, controlsPresent, controlsRef, explicitChoice, layout]);

  const previousView = useRef(view);
  useLayoutEffect(() => {
    if (previousView.current === view) return;
    previousView.current = view;
    const panel = displayRef.current?.querySelector<HTMLElement>(view === 'preview' ? '.preview-stage' : '.code-panel');
    if (panel) return animate(panel, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }]);
  }, [animate, displayRef, view]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const display = displayRef.current;
    if (!root || !display) return;
    let previous: { width: number; height: number; rootWidth: number; siblings: Map<HTMLElement, number> } | undefined;
    const observer = new ResizeObserver(() => {
      const siblings = new Map<HTMLElement, number>();
      let sibling = root.nextElementSibling;
      for (let count = 0; sibling && count < 8; count += 1, sibling = sibling.nextElementSibling) {
        if (sibling instanceof HTMLElement) siblings.set(sibling, sibling.offsetTop);
      }
      // Local layout dimensions ignore the temporary visual transform and do not resize canvases.
      const next = { width: display.offsetWidth, height: display.offsetHeight, rootWidth: root.clientWidth, siblings };
      const old = previous;
      previous = next;
      if (!old || old.rootWidth !== next.rootWidth || !next.width || !next.height) return;
      if (Math.abs(old.width - next.width) < 2 && Math.abs(old.height - next.height) < 2) return;
      const scaleX = old.width / next.width;
      const scaleY = old.height / next.height;
      if (scaleX >= 0.5 && scaleX <= 2 && scaleY >= 0.5 && scaleY <= 2) {
        animate(display, [{ transform: `scale(${scaleX}, ${scaleY})` }, { transform: 'none' }]);
      }
      for (const [element, top] of siblings) {
        const previousTop = old.siblings.get(element);
        if (previousTop !== undefined && Math.abs(previousTop - top) >= 2) {
          animate(element, [{ transform: `translateY(${previousTop - top}px)` }, { transform: 'none' }]);
        }
      }
    });
    observer.observe(display);
    return () => observer.disconnect();
  }, [animate, displayRef, rootRef]);

  return controlsPresent;
}
