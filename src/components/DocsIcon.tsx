import { PencilIcon } from '@inkra/react';
import type { PencilIconPath } from '@inkra/react';

export type LucideIconData = {
  name: string;
  size: number;
  node: Array<[string, Record<string, string | number>, ...unknown[]]>;
};

function number(value: string | number | undefined): number {
  return Number(value ?? 0);
}

function roundedRectPath(attributes: Record<string, string | number>): string {
  const x = number(attributes.x);
  const y = number(attributes.y);
  const width = number(attributes.width);
  const height = number(attributes.height);
  const radius = Math.min(number(attributes.rx || attributes.ry), width / 2, height / 2);
  if (!radius) return `M${x} ${y}h${width}v${height}h-${width}Z`;
  return `M${x + radius} ${y}H${x + width - radius}Q${x + width} ${y} ${x + width} ${y + radius}V${y + height - radius}Q${x + width} ${y + height} ${x + width - radius} ${y + height}H${x + radius}Q${x} ${y + height} ${x} ${y + height - radius}V${y + radius}Q${x} ${y} ${x + radius} ${y}Z`;
}

function nodePath([tag, attributes]: LucideIconData['node'][number]): PencilIconPath | null {
  if (tag === 'path' && typeof attributes.d === 'string') return { d: attributes.d };
  if (tag === 'line') return { d: `M${attributes.x1} ${attributes.y1}L${attributes.x2} ${attributes.y2}` };
  if (tag === 'polyline' || tag === 'polygon') {
    const coordinates = String(attributes.points ?? '').trim().split(/[\s,]+/).map(Number);
    if (coordinates.length < 4 || coordinates.length % 2 || !coordinates.every(Number.isFinite)) return null;
    const segments: string[] = [];
    for (let index = 0; index < coordinates.length; index += 2) {
      segments.push(`${index ? 'L' : 'M'}${coordinates[index]} ${coordinates[index + 1]}`);
    }
    return { d: segments.join('') + (tag === 'polygon' ? 'Z' : '') };
  }
  if (tag === 'circle') {
    const cx = number(attributes.cx);
    const cy = number(attributes.cy);
    const radius = number(attributes.r);
    return { d: `M${cx - radius} ${cy}a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 -${radius * 2} 0` };
  }
  if (tag === 'ellipse') {
    const cx = number(attributes.cx);
    const cy = number(attributes.cy);
    const rx = number(attributes.rx);
    const ry = number(attributes.ry);
    return { d: `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 -${rx * 2} 0` };
  }
  if (tag === 'rect') return { d: roundedRectPath(attributes) };
  return null;
}

const pathCache = new WeakMap<LucideIconData, PencilIconPath[]>();

export function iconPaths(data: LucideIconData): PencilIconPath[] {
  const cached = pathCache.get(data);
  if (cached) return cached;
  const paths = data.node.map(nodePath).filter((path): path is PencilIconPath => Boolean(path));
  pathCache.set(data, paths);
  return paths;
}

export function DocsIcon({
  data,
  seed,
  size = 22,
  active = false,
}: {
  data: LucideIconData;
  seed?: string | number;
  size?: number;
  active?: boolean;
}) {
  const paths = iconPaths(data);
  return (
    <PencilIcon
      active={active}
      className="docs-pencil-icon"
      paths={paths}
      seed={seed ?? data.name}
      size={size}
      sourceSize={data.size}
    />
  );
}
