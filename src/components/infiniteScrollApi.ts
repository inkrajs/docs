import type { ApiGroup, ApiRow } from './apiGroupRows';
import { infiniteScrollCopy, type InfiniteScrollCopy } from './infiniteScrollCopy';

interface Definition {
  name: string;
  type: string;
  defaultValue: string;
  description: keyof InfiniteScrollCopy;
}

const definitions: readonly Definition[] = [
  { name: 'onLoad', type: '(context: InfiniteScrollLoadContext) => void | Promise<void>', defaultValue: '-', description: 'apiOnLoad' },
  { name: 'directions', type: "Direction | readonly Direction[]", defaultValue: "'bottom'", description: 'directions' },
  { name: 'automatic', type: 'boolean | Partial<Record<Direction, boolean>>', defaultValue: 'true', description: 'apiAutomatic' },
  { name: 'gesture', type: 'boolean | Partial<Record<Direction, boolean>>', defaultValue: 'true except implicit page scrolling', description: 'apiGesture' },
  { name: 'hasMore', type: 'boolean | Partial<Record<Direction, boolean>>', defaultValue: 'true', description: 'apiHasMore' },
  { name: 'disabled', type: 'boolean | Partial<Record<Direction, boolean>>', defaultValue: 'false', description: 'disabled' },
  { name: 'state / defaultState / onStateChange', type: 'directional controlled or uncontrolled state', defaultValue: 'idle', description: 'apiState' },
  { name: 'scrollContainer', type: 'HTMLElement | null | (() => HTMLElement | null)', defaultValue: 'component root', description: 'apiContainer' },
  { name: 'triggerDistance', type: 'number | Partial<Record<Direction, number>>', defaultValue: '160', description: 'apiDistances' },
  { name: 'gestureThreshold', type: 'number | Partial<Record<Direction, number>>', defaultValue: '72', description: 'apiDistances' },
  { name: 'systemGestureInset', type: 'number', defaultValue: '24', description: 'apiGesture' },
  { name: 'getAnchor', type: '(context: InfiniteScrollAnchorContext) => HTMLElement | null', defaultValue: 'first visible stable item', description: 'apiAnchor' },
  { name: 'renderIndicator', type: '(props: InfiniteScrollIndicatorRenderProps) => ReactNode', defaultValue: 'compact spinner + text; idle Button only without automatic/gesture', description: 'apiRender' },
  { name: 'labels', type: 'Partial<Record<InfiniteScrollLabelKey, string>>', defaultValue: 'localized', description: 'apiLabels' },
];

export function getInfiniteScrollApiGroups(locale: string): ApiGroup[] {
  const copy = infiniteScrollCopy(locale);
  const rows: ApiRow[] = definitions.map(definition => {
    const description = copy[definition.description];
    return [definition.name, definition.type, definition.defaultValue, description, description];
  });
  return [{ id: 'infinite-scroll', title: 'InfiniteScroll', rows }];
}
