import type { PencilIconPath } from '@inkra/react';
import type { LucideIconData } from './DocsIcon';

const cache = new WeakMap<LucideIconData, readonly PencilIconPath[] | undefined>();
const fill = (d: string): PencilIconPath => ({ d, mode: 'fill' });
const cut = (d: string): PencilIconPath => ({ d, mode: 'cutout' });
const stroke = (d: string): PencilIconPath => ({ d, mode: 'stroke' });
const circle = (x: number, y: number, radius: number) =>
  `M${x - radius} ${y}a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 -${radius * 2} 0Z`;
const ring = (x: number, y: number, outer: number, inner: number): PencilIconPath => ({
  d: circle(x, y, outer) + circle(x, y, inner), mode: 'fill', fillRule: 'evenodd',
});
const path = (data: LucideIconData, index: number) => String(data.node[index][1].d);
const lines = (data: LucideIconData, ...indices: number[]) => indices.map(index => stroke(path(data, index)));
const fold = 'M14 2v5a1 1 0 0 0 1 1h5';
const board = 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2v2h8Z';
const cloud = 'M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242V13H4Z';

// These Lucide outlines share edges or intentionally stop behind another object.
// Their filled silhouettes need authored boundaries, not implicit SVG closure.
const recipes: Record<string, (data: LucideIconData) => readonly PencilIconPath[]> = {
  search: () => [ring(11, 11, 9, 5.25), stroke('m21 21-4.3-4.3')],
  'zoom-in': () => [ring(11, 11, 9, 5.25), stroke('m21 21-4.3-4.3'), fill('M10.25 8h1.5v2.25H14v1.5h-2.25V14h-1.5v-2.25H8v-1.5h2.25Z')],
  'zoom-out': () => [ring(11, 11, 9, 5.25), stroke('m21 21-4.3-4.3'), fill('M8 10.25h6v1.5H8Z')],
  user: data => [fill(path(data, 0) + 'Z'), fill(circle(12, 7, 4))],
  users: data => [
    fill(path(data, 0) + 'Z'), fill(circle(9, 7, 4)),
    fill('M16 3.128a4 4 0 0 1 0 7.744V3.128Z'),
    fill('M19 15.13a4 4 0 0 1 3 3.87v2h-4v-2a6 6 0 0 0-1.4-3.87Z'),
  ],
  'user-plus': data => [fill(path(data, 0) + 'Z'), fill(circle(9, 7, 4)), stroke('M19 8v6M16 11h6')],
  'folder-open': () => [
    fill('M4 20a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5Z'),
    cut('m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20'),
  ],
  'folder-lock': () => [
    fill('M10 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v2H18a6 6 0 0 0-6 6v4Z'),
    fill('M15 17h6a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z'),
    stroke('M20 17v-2a2 2 0 1 0-4 0v2'),
  ],
  'folder-search': () => [
    fill('M10 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v2H17a7 7 0 0 0-7 7Z'),
    fill(circle(17, 17, 3)), cut(circle(17, 17, 1.4)), stroke('m21 21-1.9-1.9'),
  ],
  database: () => [
    fill('M3 5a9 3 0 0 1 18 0v14a9 3 0 0 1-18 0Z'),
    cut('M3 5a9 3 0 0 0 18 0M3 12a9 3 0 0 0 18 0'),
  ],
  copy: () => [
    fill('M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2H8a2 2 0 0 0-2 2v8Z'),
    fill('M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z'),
  ],
  files: () => [
    fill('M15 2h-4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8Z'),
    cut('M15 2v5a1 1 0 0 0 1 1h5'),
    fill('M5 7h2v10a2 2 0 0 0 2 2h6v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z'),
  ],
  'file-lock': () => [
    fill('M4 10V4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2h-5v-6a6 6 0 0 0-6-6Z'), cut(fold),
    fill('M4 17h6a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z'),
    stroke('M9 17v-2a2 2 0 0 0-4 0v2'),
  ],
  'file-clock': () => [
    fill('M4 7V4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2h-2v-6a8 8 0 0 0-8-8H4Z'), cut(fold),
    fill(circle(8, 16, 6)), cut('M8 14v2.2l1.6 1'),
  ],
  coffee: data => [
    fill('M4 8h12a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1Z'),
    stroke('M17 8h1a4 4 0 0 1 0 8h-1'), ...lines(data, 0, 1, 3),
  ],
  wallet: () => [
    fill('M3 5a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2H5a1 1 0 0 0 0 2h15a1 1 0 0 1 1 1v2h-3a3 3 0 0 0 0 6h3v3a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2Z'),
    fill('M18 13h4v2h-4a1 1 0 0 1 0-2Z'),
  ],
  car: data => [
    fill(path(data, 0) + 'H19Z'), fill(circle(7, 17, 2)), fill(circle(17, 17, 2)),
    cut('M4 11h12'), cut(circle(7, 17, .65)), cut(circle(17, 17, .65)),
  ],
  bus: data => [
    fill(path(data, 3) + 'H18Z'), fill(circle(7, 18, 2)), fill(circle(16, 18, 2)),
    cut('M2 12h19.6M8 6v6M15 6v6'), cut(circle(7, 18, .65)), cut(circle(16, 18, .65)),
  ],
  luggage: () => [
    fill('M6 6h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z'),
    fill(circle(8, 20, 2)), fill(circle(16, 20, 2)), stroke('M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'),
    cut('M8 9v7M16 9v7'),
  ],
  ship: data => [
    fill('M5 10V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4l-6.2-2.5a2 2 0 0 0-1.6 0Z'),
    fill('M3 13l8.188-3.639a2 2 0 0 1 1.624 0L21 13a11.6 11.6 0 0 1-1.62 6H19c-2.5 0-2.5 2-5 2-1.3 0-1.9-.5-2.5-1s-1.2-1-2.5-1c-1.5 0-2.2.7-3 1.2A11.6 11.6 0 0 1 3 13Z'),
    cut('M12 9.189V17'), ...lines(data, 0, 4),
  ],
  trash: () => [
    fill('M5 8h14v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z'),
    cut('M10 11v6M14 11v6'), stroke('M3 5h18M8 5V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1'),
  ],
  headphones: () => [
    stroke('M3 16v-4a9 9 0 0 1 18 0v4'),
    fill('M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2ZM21 14h-3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2Z'),
  ],
  clipboard: () => [fill(board), fill('M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1Z')],
  'clipboard-check': () => [fill(board), fill('M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1Z'), cut('m9 14 2 2 4-4')],
  archive: () => [
    fill('M3 3h18a1 1 0 0 1 1 1v3H2V4a1 1 0 0 1 1-1ZM4 9h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z'),
    cut('M10 12h4'),
  ],
  coins: data => [
    fill('M13.744 17.736a6 6 0 1 1-7.48-7.48A10 10 0 0 0 13.744 17.736Z'),
    fill(circle(16, 8, 6)), cut(path(data, 1)), cut(path(data, 2)),
  ],
  medal: () => [
    fill('M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15A7 7 0 0 0 7.21 15Z'),
    fill(circle(12, 17, 5)), cut('M11 12 5.12 2.2M13 12l5.88-9.8M8 7h8M12 18v-2h-.5'),
  ],
  dices: () => [
    fill('M4 10h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z'),
    fill('m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3l-5-4.92a2.24 2.24 0 0 0-3 0L10 6v2h4a2 2 0 0 1 2 2v4Z'),
    cut(circle(6, 18, .8)), cut(circle(10, 14, .8)), cut(circle(15, 6, .8)), cut(circle(18, 9, .8)),
  ],
  images: () => [
    fill('M10 2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z'),
    fill('M4 8h2v8a2 2 0 0 0 2 2h8v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z'),
    cut(circle(13, 7, 1)), cut('m22 11-1.296-1.296a2.4 2.4 0 0 0-3.408 0L11 16'),
  ],
  gift: () => [
    fill('M4 12h16v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2ZM4 7h16a1 1 0 0 1 1 1v2H3V8a1 1 0 0 1 1-1Z'),
    cut('M12 7v14'), stroke('M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5'),
  ],
  flag: () => [
    fill('M4 4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528Z'),
    stroke('M4 15v7'),
  ],
  scroll: () => [
    fill('M4 3h13a2 2 0 0 1 2 2v10h-8a3 3 0 0 0-3 3v1a2 2 0 0 1-2 2V5a2 2 0 0 0-2-2Z'),
    fill('M11 17h10a1 1 0 0 1 1 1v1a2 2 0 0 1-2 2H9a3 3 0 0 0 1-2v-1a1 1 0 0 1 1-1Z'),
    stroke('M4 3a2 2 0 0 0-2 2v2a1 1 0 0 0 1 1h3'),
  ],
  'scroll-text': data => [
    ...recipes.scroll(data), cut('M15 8h-5M15 12h-5'),
  ],
  hourglass: data => [...lines(data, 0, 1), fill(path(data, 2) + 'Z'), fill(path(data, 3) + 'Z')],
  tent: () => [fill('M3.5 21 12 6.43 20.5 21Z'), cut('M8.5 21 12 15l3.5 6Z'), stroke('M10 3l2 3.43L14 3M2 21h20')],
  'cloud-sun': data => [
    ...lines(data, 0, 1, 2, 3),
    fill('M15.947 12.65a4 4 0 0 0-5.925-4.128L11.5 10l2.3 3.2Z'), fill(path(data, 5)),
  ],
  'cloud-rain': data => [fill(cloud), ...lines(data, 1, 2, 3)],
  'cloud-snow': () => [fill(cloud), ...[[8, 15], [8, 19], [12, 17], [12, 21], [16, 15], [16, 19]].map(([x, y]) => fill(circle(x, y, .8)))],
  'cloud-lightning': data => [
    fill('M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973H16v-4h-2V11h-3l-3 5.326Z'),
    ...lines(data, 1),
  ],
  sunrise: data => [...lines(data, 0, 1, 2, 3, 4, 5, 6), fill(path(data, 7) + 'Z')],
  sunset: data => [...lines(data, 0, 1, 2, 3, 4, 5, 6), fill(path(data, 7) + 'Z')],
  'messages-square': data => [
    fill(path(data, 0)),
    fill('M20 9a2 2 0 0 1 2 2v10.286a.71.71 0 0 1-1.212.502l-2.202-2.202A2 2 0 0 0 17.172 19H10a2 2 0 0 1-2-2v-3h8a2 2 0 0 0 2-2V9Z'),
  ],
  'book-open-check': () => [
    fill('M12 5a5 5 0 0 0-4-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4a5 5 0 0 1 4 2 5 5 0 0 1 4-2h4a2 2 0 0 0 2-2v-1h-5l-3-3V8h8V5a2 2 0 0 0-2-2h-4a5 5 0 0 0-4 2Z'),
    cut('M12 5v16'), stroke('m16 12 2 2 4-4'),
  ],
  printer: () => [
    fill('M6 7V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4ZM4 9h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2v-6H4v6a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2ZM7 14h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Z'),
  ],
  'battery-charging': () => [
    fill('M4 6h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z'),
    cut('m11 7-3 5h4l-3 5'), stroke('M22 10v4'),
  ],
  'eye-off': () => [
    fill('M2.062 11.652a10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0 1 1 0 0 1 0-.696Z'),
    cut(circle(12, 12, 3)), cut('M3 5 19 21'), stroke('M2 2 22 22'),
  ],
  'mic-off': data => [
    fill('M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0Z'),
    cut('M7 7 16 16'), ...lines(data, 0, 2, 3, 4),
  ],
  sword: data => [...lines(data, 0, 1, 2), fill(path(data, 3) + 'Z')],
  swords: data => [
    ...lines(data, 0, 3, 4, 5, 6, 7), fill(path(data, 1) + 'Z'),
    fill(path(data, 2) + 'Z'),
  ],
  hammer: data => [fill(path(data, 0) + 'Z'), ...lines(data, 1), fill(path(data, 2) + 'Z')],
  highlighter: data => [fill(path(data, 0) + 'Z'), fill(path(data, 1) + 'Z')],
  eraser: () => [
    fill('M8 21a2 2 0 0 1-1.42-.587l-3.994-3.999a2 2 0 0 1 0-2.828l10-10a2 2 0 0 1 2.829 0l5.999 6a2 2 0 0 1 0 2.828L12.834 21Z'),
    cut('m5.082 11.09 8.828 8.828'), stroke('M13 21h8'),
  ],
  paintbrush: data => [fill(path(data, 1)), fill(path(data, 2) + 'Z'), cut(path(data, 0))],
  // A closed command path is a line symbol, not the silhouette of a solid tile.
  command: data => [stroke(path(data, 0))],
};

export function iconFilledPaths(data: LucideIconData): readonly PencilIconPath[] | undefined {
  if (cache.has(data)) return cache.get(data);
  const paths = recipes[data.name]?.(data);
  cache.set(data, paths);
  return paths;
}
