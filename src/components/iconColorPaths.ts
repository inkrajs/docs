import type { PencilIconPath } from '@inkra/react';
import type { LucideIconData } from './DocsIcon';
import { iconFilledPaths } from './iconFilledPaths';

const primary = 'var(--inkra-icon-primary, var(--inkra-blue, #4d91a0))';
const secondary = 'var(--inkra-icon-secondary, var(--inkra-warning-pigment, #e6c17b))';
const accent = 'var(--inkra-icon-accent, var(--inkra-coral, #994f3f))';
const fill = (d: string, color: string): PencilIconPath => ({ d, mode: 'wash', color });
const cut = (d: string): PencilIconPath => ({ d, mode: 'cutout' });
const stroke = (d: string): PencilIconPath => ({ d, mode: 'stroke' });
const pigment = (shape: PencilIconPath, color: string): PencilIconPath => ({ ...shape, mode: shape.mode === 'fill' ? 'wash' : shape.mode, color });
const path = (data: LucideIconData, index: number) => String(data.node[index][1].d);
const circle = (x: number, y: number, radius: number) =>
  `M${x - radius} ${y}a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 -${radius * 2} 0Z`;
const fold = 'M14 2v5a1 1 0 0 0 1 1h5Z';
const folderTab = 'M2 8V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.67.9l.81 1.2a2 2 0 0 0 1.69.9H20a2 2 0 0 1 2 2Z';
const paper = (data: LucideIconData): PencilIconPath[] => [fill(path(data, 0), primary), fill(fold, secondary)];
const calendar = (): PencilIconPath[] => [
  fill('M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z', primary),
  fill('M5 3h14a2 2 0 0 1 2 2v4H3V5a2 2 0 0 1 2-2Z', secondary),
  stroke('M8 2v3M16 2v3'),
];

// The role of each region is authored: paper/fold, body/badge, cloud/sun, etc.
// Unsupported symbols deliberately have no multicolor preset.
const recipes: Record<string, (data: LucideIconData) => readonly PencilIconPath[]> = {
  'calendar-days': () => [...calendar(), cut(circle(8, 14, 0.9) + circle(12, 14, 0.9) + circle(16, 14, 0.9))],
  'calendar-check': () => [...calendar(), cut('m9 15 2 2 4-4')],
  clipboard: data => {
    const [board, clip] = iconFilledPaths(data)!;
    return [pigment(board, primary), pigment(clip, secondary)];
  },
  mail: () => [
    fill('M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z', primary),
    fill('M4 4h16a2 2 0 0 1 2 2v1l-8.991 5.727a2 2 0 0 1-2.009 0L2 7V6a2 2 0 0 1 2-2Z', secondary),
  ],
  'shopping-bag': data => [
    fill(path(data, 2), primary),
    fill('M7 2h10a2 2 0 0 1 1.6.8L21 6H3l2.4-3.2A2 2 0 0 1 7 2Z', secondary),
    cut(path(data, 0)),
  ],
  'credit-card': () => [
    fill('M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z', primary),
    fill('M2 8h20v4H2Z', secondary),
  ],
  package: data => [
    fill(path(data, 0), primary),
    fill('M3.29 7 11 2.27a2 2 0 0 1 2 0L20.71 7 12 12Z', secondary),
    cut('M12 12v9'),
  ],
  monitor: () => [
    fill('M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7v3h3v2H8v-2h3v-3H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z', primary),
    fill('M5 6h14v8H5Z', secondary),
  ],
  smartphone: () => [
    fill('M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z', primary),
    fill('M8 5h8v12H8Z', secondary),
  ],
  headphones: data => [
    fill('M3 15v-3a9 9 0 0 1 18 0v3h-2v-3a7 7 0 0 0-14 0v3Z', secondary),
    pigment(iconFilledPaths(data)![1], primary),
  ],
  car: data => {
    const [body, leftWheel, rightWheel] = iconFilledPaths(data)!;
    return [pigment(body, primary),
      fill('M5 8.5h7a1.5 1.5 0 0 1 1 .4l1.6 1.6H4Z', secondary),
      pigment(leftWheel, primary), pigment(rightWheel, primary)];
  },
  bus: data => {
    const [body, leftWheel, rightWheel] = iconFilledPaths(data)!;
    return [pigment(body, primary), fill('M4 8h14l1 4H4Z', secondary),
      pigment(leftWheel, primary), pigment(rightWheel, primary)];
  },
  'train-front': data => [
    fill(path(data, 3), primary),
    fill('M8 5h8v3a4 4 0 0 1-8 0Z', secondary),
    stroke('m8 19-2 3m10-3 2 3'),
  ],
  tent: () => [
    fill('M3.5 21 12 6.43 20.5 21Z', primary),
    fill('M8.5 21 12 15l3.5 6Z', secondary),
    stroke('M10 3l2 3.43L14 3'),
  ],
  'chart-pie': data => [
    fill('M9 2.46A10 10 0 1 0 21.54 15H10a1 1 0 0 1-1-1Z', primary),
    fill(path(data, 0), secondary),
  ],
  'shield-check': data => [
    fill(path(data, 0), primary),
    fill('m7.5 12 2-2 1.5 1.5 3.5-3.5 2 2-5.5 5.5Z', secondary),
  ],
  'bookmark-check': data => [
    fill(path(data, 0), primary),
    fill('m7.5 10 2-2 1.5 1.5 3.5-3.5 2 2-5.5 5.5Z', secondary),
  ],
  folder: data => [fill(path(data, 0), primary), fill(folderTab, secondary)],
  'folder-open': data => {
    const [body] = iconFilledPaths(data)!;
    return [
      pigment(body, secondary),
      fill('M9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4l3.5-8.9A2 2 0 0 1 9.24 10Z', primary),
    ];
  },
  'folder-lock': data => {
    const [folder, lock, shackle] = iconFilledPaths(data)!;
    return [pigment(folder, primary), pigment(lock, accent), shackle];
  },
  'folder-search': data => {
    const [folder, lens, hole, handle] = iconFilledPaths(data)!;
    return [pigment(folder, primary), pigment(lens, accent), hole, handle];
  },
  'file-text': data => [...paper(data), cut(path(data, 3)), cut(path(data, 4))],
  'file-code': data => [...paper(data), cut(path(data, 2)), cut(path(data, 3))],
  'file-image': data => [
    fill(path(data, 0), primary),
    fill('M20 17l-1.296-1.296a2.41 2.41 0 0 0-3.408 0L9 22h9a2 2 0 0 0 2-2Z', secondary),
    fill(circle(10, 12, 2), secondary),
  ],
  'file-lock': data => {
    const [paper, , lock, shackle] = iconFilledPaths(data)!;
    return [pigment(paper, primary), pigment(lock, accent), shackle];
  },
  'file-clock': data => {
    const [paper, , clock, hands] = iconFilledPaths(data)!;
    return [pigment(paper, primary), pigment(clock, accent), hands];
  },
  files: data => {
    const [front, , back] = iconFilledPaths(data)!;
    return [pigment(front, primary), pigment(back, secondary)];
  },
  copy: data => {
    const [back, front] = iconFilledPaths(data)!;
    return [pigment(back, secondary), pigment(front, primary)];
  },
  'cloud-sun': data => [
    fill('M15.947 12.65a4 4 0 0 0-5.925-4.128L11.5 10l2.3 3.2Z', secondary),
    fill(path(data, 5), primary),
  ],
  'cloud-rain': data => [
    pigment(iconFilledPaths(data)![0], primary),
    fill('M7.25 14h1.5v6h-1.5ZM15.25 14h1.5v6h-1.5ZM11.25 16h1.5v6h-1.5Z', secondary),
  ],
  'cloud-snow': data => {
    const [cloud, ...snow] = iconFilledPaths(data)!;
    return [pigment(cloud, primary), ...snow.map(flake => pigment(flake, secondary))];
  },
  'cloud-lightning': data => [
    pigment(iconFilledPaths(data)![0], primary),
    fill('M12.4 11.5h2l-3.1 4.7h4L11.6 22.5h-2l3.1-4.7h-4Z', secondary),
  ],
  sun: () => [
    fill(circle(12, 12, 4), secondary),
    fill('M11.25 2h1.5v2h-1.5ZM11.25 20h1.5v2h-1.5ZM2 11.25h2v1.5H2ZM20 11.25h2v1.5h-2ZM4.4 5.46l1.06-1.06 1.41 1.41-1.06 1.06ZM17.13 18.19l1.06-1.06 1.41 1.41-1.06 1.06ZM4.4 18.54l1.41-1.41 1.06 1.06-1.41 1.41ZM17.13 5.81l1.41-1.41 1.06 1.06-1.41 1.41Z', accent),
  ],
  gift: () => [
    fill('M4 12h16v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z', primary),
    fill('M4 7h16a1 1 0 0 1 1 1v2H3V8a1 1 0 0 1 1-1Z', primary),
    fill('M11 7h2v14h-2Z', secondary),
    fill('M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5Z', secondary),
  ],
  medal: data => {
    const [ribbon, medallion] = iconFilledPaths(data)!;
    return [pigment(ribbon, primary), pigment(medallion, secondary)];
  },
  palette: data => [
    fill(path(data, 0), secondary),
    fill(circle(9, 8, 1.6), primary),
    fill(circle(16, 9, 1.6), accent),
  ],
  map: data => [
    fill(path(data, 0), primary),
    fill('M9 3.236l5.106 2.317a2 2 0 0 0 .894.211v15a2 2 0 0 1-.894-.211l-4.212-2.106A2 2 0 0 0 9 18.236Z', secondary),
  ],
  camera: data => [
    fill(path(data, 0), primary), fill(circle(12, 13, 4), secondary), cut(circle(12, 13, 2)),
  ],
  coffee: data => [
    pigment(iconFilledPaths(data)![0], primary),
    fill('M17 8h1a4 4 0 0 1 0 8h-1v-1.5h1a2.5 2.5 0 0 0 0-5H17Z', secondary),
  ],
  luggage: data => {
    const [body, leftWheel, rightWheel, handle] = iconFilledPaths(data)!;
    return [
      pigment(body, primary), fill('M10.5 6h3v12h-3Z', secondary),
      pigment(leftWheel, primary), pigment(rightWheel, primary), handle,
    ];
  },
  backpack: data => [
    fill(path(data, 0), primary), fill(path(data, 3) + 'Z', secondary),
    stroke(path(data, 4)),
  ],
  trophy: data => [
    fill('M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2h10v-2a2 2 0 0 0-2-2 1 1 0 0 1-1-1v-2.34Z', primary),
    fill(path(data, 4), secondary),
    fill('M18 4h3a1 1 0 0 1 1 1v2.5a2.5 2.5 0 0 1-2.5 2.5H18V8.5h1.5a1 1 0 0 0 1-1v-2H18ZM6 4H3a1 1 0 0 0-1 1v2.5A2.5 2.5 0 0 0 4.5 10H6V8.5H4.5a1 1 0 0 1-1-1v-2H6Z', accent),
  ],
  'book-open': data => [
    fill(path(data, 1), primary),
    fill('M12 5a5 5 0 0 1 4-1.998L20.001 3A2 2 0 0 1 22 5v12a2 2 0 0 1-1.999 2H16a5 5 0 0 0-4 2Z', secondary),
  ],
  rocket: data => [
    fill(path(data, 0) + 'Z', accent), fill(path(data, 3) + 'Z', accent),
    fill(path(data, 2), primary), fill(path(data, 1) + 'Z', secondary),
  ],
  wallet: data => {
    const [body, clasp] = iconFilledPaths(data)!;
    return [pigment(body, primary), pigment(clasp, secondary)];
  },
  coins: data => {
    const [back, front] = iconFilledPaths(data)!;
    return [pigment(back, accent), pigment(front, secondary)];
  },
  'chart-column': data => [
    stroke(path(data, 0)),
    fill('M6.5 14h3v3h-3Z', primary), fill('M11.5 5h3v12h-3Z', secondary), fill('M16.5 9h3v8h-3Z', accent),
  ],
};

const cache = new WeakMap<LucideIconData, readonly PencilIconPath[] | undefined>();

export function iconColorPaths(data: LucideIconData): readonly PencilIconPath[] | undefined {
  if (cache.has(data)) return cache.get(data);
  const paths = recipes[data.name]?.(data);
  cache.set(data, paths);
  return paths;
}
