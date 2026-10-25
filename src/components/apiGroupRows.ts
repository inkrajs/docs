import { describeApiProp } from './apiDescriptions.ts';

export type ApiRow =
  | readonly [string, string]
  | readonly [string, string, string, string]
  | readonly [string, string, string, string, string];

export interface ApiGroup {
  id: string;
  title: string;
  rows: readonly ApiRow[];
}

export function localizeApiRows(rows: readonly ApiRow[], locale: string, component = ''): string[][] {
  const extended = rows.some(row => row.length === 5);
  return rows.map(row => {
    const description = row.length === 5 ? row[locale === 'zh-CN' ? 3 : 4]
      : row.length === 4 ? row[locale === 'zh-CN' ? 2 : 3]
        : describeApiProp(component, row[0], locale);
    return extended ? [row[0], row[1], row.length === 5 ? row[2] : '-', description]
      : [row[0], row[1], description];
  });
}
