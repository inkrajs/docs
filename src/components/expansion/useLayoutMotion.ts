import { useLayoutEffect, useRef } from 'react';

const selector = '.layout-notebook__sidebar, .layout-notebook__secondary, .layout-notebook__column, .layout-notebook__content, .layout-notebook__header, .layout-notebook > .inkra-layout__footer';

// Snapshot only disappearing sidebars; moving live regions keep their own canvas and focus.
export function useLayoutMotion() {
  const root = useRef<HTMLElement>(null);
  const pending = useRef<Array<{ node: HTMLElement; rect: DOMRect; copy?: HTMLElement }>>([]);
  const running = useRef<Array<() => void>>([]);
  const stop = () => { running.current.forEach(cleanup => cleanup()); running.current = []; };
  const prepare = () => {
    stop();
    const element = root.current;
    if (!element || element.ownerDocument.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    pending.current = [...element.querySelectorAll<HTMLElement>(selector)]
      .filter(node => !node.matches('.layout-notebook__content, .layout-notebook__header') || !node.closest('.layout-notebook__column'))
      .map(node => {
        const rect = node.getBoundingClientRect();
        let copy: HTMLElement | undefined;
        if (rect.width > 0 && node.matches('aside')) {
          copy = node.cloneNode(true) as HTMLElement;
          const sources = node.querySelectorAll('canvas');
          copy.querySelectorAll('canvas').forEach((canvas, index) => {
            const source = sources[index];
            if (source.width && source.height) canvas.getContext('2d')?.drawImage(source, 0, 0);
          });
          [copy, ...copy.querySelectorAll('[id]')].forEach(item => item.removeAttribute('id'));
          copy.inert = true;
          copy.setAttribute('aria-hidden', 'true');
        }
        return { node, rect, copy };
      });
  };
  useLayoutEffect(() => {
    const element = root.current;
    const snapshots = pending.current;
    pending.current = [];
    if (!element || !snapshots.length) return;
    const bounds = element.getBoundingClientRect();
    const duration = 180;
    const push = element.dataset.compact === 'true' && element.dataset.mobileNavigation?.startsWith('push');
    for (const { node, rect: before, copy } of snapshots) {
      if (!node.isConnected) continue;
      const after = node.getBoundingClientRect();
      const end = node.dataset.sidebarSide === 'end';
      const rtl = element.ownerDocument.defaultView?.getComputedStyle(element).direction === 'rtl';
      const direction = end !== rtl ? 1 : -1;
      let target = node;
      let frames: Keyframe[];
      if (before.width > 0 && !after.width && copy) {
        target = copy;
        copy.classList.add('layout-notebook__motion-copy');
        Object.assign(copy.style, { position: 'absolute', left: `${before.left - bounds.left}px`, top: `${before.top - bounds.top}px`,
          width: `${before.width}px`, height: `${before.height}px`, margin: '0', zIndex: push ? '0' : '3', pointerEvents: 'none' });
        element.append(copy);
        frames = push ? [{ opacity: 1 }, { opacity: 1 }]
          : [{ transform: 'translateX(0)', opacity: 1 }, { transform: `translateX(${direction * before.width}px)`, opacity: 0 }];
      } else if (!before.width && after.width > 0) {
        if (push && node.matches('aside')) continue;
        frames = [{ transform: `translateX(${direction * after.width}px)`, opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }];
      } else if (before.width > 0 && after.width > 0 && Math.abs(before.left - after.left) > 1) {
        frames = [{ transform: `translateX(${before.left - after.left}px)` }, { transform: 'translateX(0)' }];
      } else continue;
      const animation = target.animate(frames, { duration, easing: 'cubic-bezier(.2, 0, 0, 1)' });
      const cleanup = () => { animation.cancel(); if (target === copy) copy.remove(); };
      running.current.push(cleanup);
      void animation.finished.then(cleanup, () => {});
    }
  });
  useLayoutEffect(() => stop, []);
  return { root, prepare };
}
