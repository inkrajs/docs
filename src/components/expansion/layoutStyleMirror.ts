export type PreviewStyleSource = HTMLStyleElement | HTMLLinkElement;

export function isPreviewStyleSource(node: Element): node is PreviewStyleSource {
  return node.tagName === 'STYLE' || (node.tagName === 'LINK' && (node as HTMLLinkElement).rel === 'stylesheet');
}

export function collectPreviewStyleSources(node: Node): PreviewStyleSource[] {
  if (node.nodeType !== 1) return [];
  const element = node as Element;
  const sources = isPreviewStyleSource(element) ? [element] : [];
  sources.push(...element.querySelectorAll<PreviewStyleSource>('style, link[rel="stylesheet"]'));
  return sources;
}

export function reconcilePreviewStyleOrder(
  sources: readonly PreviewStyleSource[],
  mirrors: ReadonlyMap<Element, HTMLElement>,
  targetHead: HTMLHeadElement,
  anchor: HTMLElement,
): boolean {
  let reference: Node = anchor;
  let changed = false;
  for (let index = sources.length - 1; index >= 0; index -= 1) {
    const copy = mirrors.get(sources[index]);
    if (!copy) continue;
    if (copy.nextSibling !== reference) {
      targetHead.insertBefore(copy, reference);
      changed = true;
    }
    reference = copy;
  }
  return changed;
}
