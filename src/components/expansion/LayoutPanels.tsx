import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Resizable, useResizablePanelRef } from '@inkra/react';

interface SidebarPanelProps {
  id: string;
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWidthChange?: (width: number) => void;
  width: number;
  collapsible: boolean;
}

export function LayoutSidebarPanel({ id, children, open, onOpenChange, onWidthChange, width, collapsible }: SidebarPanelProps) {
  const panel = useResizablePanelRef();
  const element = useRef<HTMLDivElement>(null);
  const initialWidth = useRef(open ? width : 0);
  const lastWidth = useRef(width);
  const configuredWidth = useRef(width);
  const request = useRef(open);
  const syncing = useRef(false);
  if (request.current !== open) {
    request.current = open;
    syncing.current = true;
  }
  useEffect(() => {
    const api = panel.current;
    if (!api) return;
    syncing.current = true;
    if (configuredWidth.current !== width) {
      configuredWidth.current = width;
      lastWidth.current = width;
      if (open) api.resize(width);
    }
    let frame = 0;
    const view = element.current?.ownerDocument.defaultView;
    const restoredWidth = lastWidth.current;
    const expanding = open && api.isCollapsed();
    if (expanding) {
      api.resize(restoredWidth);
    }
    else if (!open && !api.isCollapsed()) {
      api.collapse();
    }
    // Ignore intermediate size notifications while separators rejoin the group.
    if (view) frame = view.requestAnimationFrame(() => {
      frame = view.requestAnimationFrame(() => {
        if (expanding) api.resize(restoredWidth);
        syncing.current = false;
      });
    });
    else syncing.current = false;
    return () => { if (frame) view?.cancelAnimationFrame(frame); };
  }, [open, width, collapsible, panel]);
  return <Resizable.Panel id={id} panelRef={panel} elementRef={element} defaultSize={initialWidth.current}
    minSize={120} maxSize="40%" collapsible={collapsible} collapsedSize={0}
    groupResizeBehavior="preserve-pixel-size" className="layout-notebook__panel"
    onResize={(size, _id, previous) => {
      onWidthChange?.(size.inPixels);
      if (!previous || !open || syncing.current) return;
      if (size.inPixels > 0) lastWidth.current = element.current?.getBoundingClientRect().width || size.inPixels;
      onOpenChange(size.asPercentage > 0);
    }}>
    {children}
  </Resizable.Panel>;
}
