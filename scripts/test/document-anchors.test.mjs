import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../../src/documentAnchors.ts', import.meta.url), 'utf8');
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { readDocumentAnchor, scrollToDocumentAnchor } = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`);

test('document anchors preserve IDs and exclude page tabs and malformed fragments', () => {
  assert.equal(readDocumentAnchor('#reading-width'), 'reading-width');
  assert.equal(readDocumentAnchor('#%E9%98%85%E8%AF%BB'), '阅读');
  for (const hash of ['', '#', '#preview', '#api', '#accessibility', '#%invalid']) {
    assert.equal(readDocumentAnchor(hash), null);
  }
});

function environment(t) {
  const frames = new Map();
  const nodes = new Map();
  const observers = [];
  let nextFrame = 0;
  const location = { pathname: '/docs/components/container', search: '', hash: '#reading-width' };
  t.mock.method(globalThis, 'setTimeout', () => 1);
  t.mock.method(globalThis, 'clearTimeout', () => {});
  const previous = { window: globalThis.window, document: globalThis.document, MutationObserver: globalThis.MutationObserver };
  globalThis.window = {
    location,
    requestAnimationFrame(callback) { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame(frame) { frames.delete(frame); },
  };
  globalThis.document = { body: {}, getElementById(id) { return nodes.get(id); } };
  globalThis.MutationObserver = class {
    constructor(callback) { this.callback = callback; this.connected = false; observers.push(this); }
    observe() { this.connected = true; }
    disconnect() { this.connected = false; }
  };
  t.after(() => {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[name];
      else globalThis[name] = value;
    }
  });
  return {
    frames, nodes, observers, location,
    frame() {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach(callback => callback());
    },
  };
}

test('waits for lazy content and scrolls only after the navigation commit', t => {
  const env = environment(t);
  const calls = [];
  const stop = scrollToDocumentAnchor('#reading-width');
  assert.equal(env.frames.size, 1);
  env.frame();
  assert.equal(env.observers[0].connected, true);
  env.nodes.set('reading-width', { getClientRects: () => [{}], scrollIntoView: options => calls.push(options) });
  env.observers[0].callback();
  env.observers[0].callback();
  assert.equal(env.frames.size, 1, 'mutations coalesce into one frame');
  env.frame();
  assert.deepEqual(calls, [{ block: 'start', behavior: 'instant' }]);
  assert.equal(env.observers[0].connected, false);
  stop();
  assert.equal(env.frames.size, 0);
});

test('hidden tab targets wait until visible', t => {
  const env = environment(t);
  let visible = false;
  let calls = 0;
  env.nodes.set('reading-width', { getClientRects: () => visible ? [{}] : [], scrollIntoView: () => { calls += 1; } });
  scrollToDocumentAnchor('#reading-width');
  env.frame();
  assert.equal(calls, 0);
  visible = true;
  env.observers[0].callback();
  env.frame();
  assert.equal(calls, 1);
  assert.equal(env.observers[0].connected, false);
});

test('cancels pending anchor work when route, hash, or search changes', t => {
  const env = environment(t);
  let calls = 0;
  env.nodes.set('reading-width', { getClientRects: () => [{}], scrollIntoView: () => { calls += 1; } });
  for (const [field, next] of [['pathname', '/docs/components/grid'], ['hash', '#api'], ['search', '?language=en']]) {
    Object.assign(env.location, { pathname: '/docs/components/container', hash: '#reading-width', search: '' });
    scrollToDocumentAnchor('#reading-width');
    env.location[field] = next;
    env.frame();
    assert.equal(env.observers.at(-1).connected, false);
  }
  assert.equal(calls, 0);
});

test('cleanup prevents late lazy mounts from moving the next page', t => {
  const env = environment(t);
  const stop = scrollToDocumentAnchor('#reading-width');
  stop();
  env.observers[0].callback();
  assert.equal(env.frames.size, 0);
  assert.equal(env.observers[0].connected, false);
});

test('every shared example declares a stable, non-tab anchor', () => {
  const root = new URL('../../src/', import.meta.url);
  let count = 0;
  for (const file of readdirSync(root, { recursive: true }).filter(file => file.endsWith('.tsx'))) {
    const content = readFileSync(new URL(file, root), 'utf8');
    const syntax = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const ids = new Set();
    const visit = node => {
      if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(syntax) === 'ComponentExample') {
        count += 1;
        const id = node.attributes.properties.find(attribute => ts.isJsxAttribute(attribute) && attribute.name.getText(syntax) === 'id');
        assert(id?.initializer, `${file}: ComponentExample requires an explicit stable id`);
        if (ts.isStringLiteral(id.initializer)) {
          const value = id.initializer.text;
          assert.match(value, /^[a-z][a-z0-9-]*$/, `${file}: use a readable language-independent slug`);
          assert.equal(readDocumentAnchor(`#${value}`), value, `${file}: anchor collides with a page tab`);
          assert(!ids.has(value), `${file}: duplicate example anchor ${value}`);
          ids.add(value);
        } else {
          const expression = id.initializer.getText(syntax);
          assert.doesNotMatch(expression, /\b(?:title|locale|code|index|useId|random)\b/, `${file}: mapped anchors must use stable item identity`);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(syntax);
  }
  assert(count > 150, 'scan covers the shared examples rather than a single selected page');
});

test('Button comparison groups use the same example shell and retain published anchor identities', () => {
  const content = readFileSync(new URL('../../src/App.tsx', import.meta.url), 'utf8');
  const syntax = ts.createSourceFile('App.tsx', content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const group = syntax.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'ComparisonGroup');
  assert(group, 'ComparisonGroup remains the Button business-content wrapper');
  const wrappers = [];
  const independentShell = [];
  const kinds = [];
  const visit = node => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(syntax);
      if (tag === 'ComponentExample') wrappers.push(node);
      if (['header', 'footer', 'h2', 'CodeBlock', 'CopyButton'].includes(tag)) independentShell.push(tag);
    }
    ts.forEachChild(node, visit);
  };
  visit(group);
  assert.equal(wrappers.length, 1, 'Button uses one shared ComponentExample shell');
  assert.deepEqual(independentShell.filter(tag => tag !== 'CopyButton'), [], 'no duplicate heading, disclosure or code shell');
  const attribute = name => wrappers[0].attributes.properties.find(prop => ts.isJsxAttribute(prop) && prop.name.getText(syntax) === name);
  assert.equal(attribute('id')?.initializer?.getText(syntax), '{`comparison-${kind}`}');
  assert(attribute('title') && attribute('code'), 'title and code use the shared contract');
  assert.doesNotMatch(group.getText(syntax), /\bshowCode\b|\bsetShowCode\b/, 'code-disclosure state belongs to the shared shell');
  const findKinds = node => {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(syntax) === 'ComparisonGroup') {
      const kind = node.attributes.properties.find(prop => ts.isJsxAttribute(prop) && prop.name.getText(syntax) === 'kind');
      assert(kind?.initializer && ts.isStringLiteral(kind.initializer));
      kinds.push(kind.initializer.text);
    }
    ts.forEachChild(node, findKinds);
  };
  findKinds(syntax);
  assert.deepEqual(kinds, ['appearance', 'size', 'icon-size', 'icons', 'state', 'link', 'group', 'rtl']);
});
