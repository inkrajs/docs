import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../../src/components/expansion/layoutStyleMirror.ts', import.meta.url), 'utf8');
const viewportSource = readFileSync(new URL('../../src/components/expansion/LayoutViewport.tsx', import.meta.url), 'utf8');
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const module = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`);
const { collectPreviewStyleSources, isPreviewStyleSource, reconcilePreviewStyleOrder } = module;

function sourceNode(tagName, rel = '') {
  return { tagName, rel };
}

function element(tagName, descendants = []) {
  return {
    nodeType: 1,
    tagName,
    rel: '',
    querySelectorAll() { return descendants.filter(isPreviewStyleSource); },
  };
}

function fakeHead(initial) {
  const children = [...initial];
  let moves = 0;
  const refresh = () => children.forEach((node, index) => { node.nextSibling = children[index + 1] ?? null; });
  refresh();
  return {
    children,
    get moves() { return moves; },
    insertBefore(node, reference) {
      const from = children.indexOf(node);
      if (from >= 0) children.splice(from, 1);
      const to = children.indexOf(reference);
      children.splice(to < 0 ? children.length : to, 0, node);
      moves += 1;
      refresh();
    },
  };
}

test('style source recognition follows current tag and rel state', () => {
  const style = sourceNode('STYLE');
  const link = sourceNode('LINK', 'stylesheet');
  assert(isPreviewStyleSource(style));
  assert(isPreviewStyleSource(link));
  link.rel = 'preload';
  assert.equal(isPreviewStyleSource(link), false);
  link.rel = 'stylesheet';
  assert(isPreviewStyleSource(link));
  assert.equal(isPreviewStyleSource(sourceNode('SCRIPT')), false);
});

test('collecting an added or removed subtree includes nested style sources only', () => {
  const style = sourceNode('STYLE');
  const sheet = sourceNode('LINK', 'stylesheet');
  const preload = sourceNode('LINK', 'preload');
  assert.deepEqual(collectPreviewStyleSources(element('DIV', [style, sheet])), [style, sheet]);
  assert.deepEqual(collectPreviewStyleSources(element('DIV', [preload])), []);
  assert.deepEqual(collectPreviewStyleSources({ nodeType: 3 }), []);
});

test('reconcile preserves source cascade order with only required clone moves', () => {
  const a = sourceNode('STYLE');
  const b = sourceNode('STYLE');
  const c = sourceNode('LINK', 'stylesheet');
  const copies = new Map([[a, { id: 'a' }], [b, { id: 'b' }], [c, { id: 'c' }]]);
  const anchor = { id: 'anchor' };
  const head = fakeHead([copies.get(a), copies.get(b), copies.get(c), anchor]);
  assert.equal(reconcilePreviewStyleOrder([a, b, c], copies, head, anchor), false);
  assert.equal(head.moves, 0, 'stable order performs no DOM writes');
  assert.equal(reconcilePreviewStyleOrder([b, a, c], copies, head, anchor), true);
  assert.deepEqual(head.children.map(node => node.id), ['b', 'a', 'c', 'anchor']);
  assert.equal(head.moves, 1, 'one source reorder needs one clone move');
  assert.equal(reconcilePreviewStyleOrder([b, a, c], copies, head, anchor), false);
  assert.equal(head.moves, 1, 'settled order remains write-free');
});

test('LayoutViewport queues rel changes, subtree additions/removals and reconciles once per frame', () => {
  assert.match(viewportSource, /mirroredStyles\.has\(targetElement\) \|\| isPreviewStyleSource\(targetElement\)/);
  assert.match(viewportSource, /collectPreviewStyleSources\(node\)/);
  assert.match(viewportSource, /reconcilePreviewStyleOrder\(/);
  assert.match(viewportSource, /if \(!styleFrame\) styleFrame = requestAnimationFrame\(flushStyles\)/);
  assert.match(viewportSource, /!isPreviewStyleSource\(source\)/);
});
