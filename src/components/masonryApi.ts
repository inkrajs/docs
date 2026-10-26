import { resolveDocsLocale } from '../docsLocales';
import type { ApiGroup, ApiRow } from './apiGroupRows';
import type { MasonryCopyKey } from './masonryCopy';
import { masonryText } from './masonryCopy';

export interface MasonryApiRow {
  name: string;
  type: string;
  defaultValue: string;
  descriptionKey: MasonryCopyKey;
  required?: boolean;
}

export const masonryApi: readonly MasonryApiRow[] = [
  { name: 'items', type: 'readonly Item[]', defaultValue: '-', descriptionKey: 'apiItems', required: true },
  { name: 'getItemKey', type: '(item, index) => string | number | bigint', defaultValue: '-', descriptionKey: 'apiGetItemKey', required: true },
  { name: 'renderItem', type: '(state) => ReactNode', defaultValue: '-', descriptionKey: 'apiRenderItem', required: true },
  { name: 'getItemProps', type: '(state) => MasonryItemProps', defaultValue: '-', descriptionKey: 'apiGetItemProps' },
  { name: 'columns', type: "number | 'auto'", defaultValue: "'auto'", descriptionKey: 'apiColumns' },
  { name: 'minColumnWidth', type: 'number', defaultValue: '240', descriptionKey: 'apiMinColumnWidth' },
  { name: 'maxColumns', type: 'number', defaultValue: '-', descriptionKey: 'apiMaxColumns' },
  { name: 'columnGap', type: 'number', defaultValue: '16', descriptionKey: 'apiColumnGap' },
  { name: 'rowGap', type: 'number', defaultValue: '16', descriptionKey: 'apiRowGap' },
  { name: 'strategy', type: "'shortest' | 'sequential'", defaultValue: "'shortest'", descriptionKey: 'apiStrategy' },
  { name: 'dir', type: "'ltr' | 'rtl'", defaultValue: 'computed', descriptionKey: 'apiDirection' },
  { name: 'animated', type: 'boolean', defaultValue: 'true', descriptionKey: 'apiAnimated' },
] as const;

export function getMasonryApiGroups(locale: string): ApiGroup[] {
  const resolvedLocale = resolveDocsLocale(locale);
  const rows: ApiRow[] = masonryApi.map(entry => {
    const description = masonryText(resolvedLocale, entry.descriptionKey);
    return [
      entry.name,
      entry.type,
      entry.required ? '必填 / required' : entry.defaultValue,
      description,
      description,
    ];
  });
  return [{ id: 'masonry', title: masonryText(resolvedLocale, 'title'), rows }];
}
