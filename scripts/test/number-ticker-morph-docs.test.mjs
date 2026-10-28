import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const root = new URL('../../', import.meta.url);
const read = name => readFileSync(new URL(`src/components/${name}`, root), 'utf8');
const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const copyUrl = moduleUrl(ts.transpile(read('numberTickerRollCopy.ts'), { module: ts.ModuleKind.ESNext }));
const { numberTickerRollCopy } = await import(copyUrl);

test('all five locales describe exact morph shifts and the rolling fallback', () => {
  for (const locale of ['zh-CN', 'en', 'ja', 'ko', 'fr']) {
    const labels = numberTickerRollCopy(locale);
    for (const key of ['morph', 'comparison', 'shift', 'increment', 'carry', 'explanation']) {
      assert(labels[key]?.length > 1, `${locale} needs ${key}`);
    }
    assert.match(labels.api, /10\^k/);
    assert.match(labels.api, /morph/);
    assert.match(labels.directionApi, /roll/);
    assert.match(labels.directionApi, /morph/);
  }
  assert.match(numberTickerRollCopy('en').api, /exact compatible/);
  assert.match(numberTickerRollCopy('en').api, /fall back to roll/);
  assert.match(read('FoundationPages.tsx'), /count \(default\) \| roll \| morph/);
});

// Render the documentation tree without library drawing, so these checks exercise
// example state and copied source rather than claiming animation acceptance.
async function exampleHarness() {
  const source = read('NumberTickerRollExamples.tsx').replace(/^import .*;\n/gm, '');
  const compiled = ts.transpile(source, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React, jsxFactory: 'node' });
  return import(moduleUrl(`
    import { numberTickerRollCopy } from ${JSON.stringify(copyUrl)};
    const Button = 'Button', NumberTicker = 'NumberTicker', PencilText = 'PencilText', ComponentExample = 'ComponentExample', DocsSelect = 'DocsSelect';
    let state = [], cursor = 0;
    const useLocale = () => ({ locale: 'en' });
    const node = (type, props, ...children) => ({ type, props: { ...props, children: children.flat(Infinity) } });
    const useState = initial => {
      const index = cursor++;
      if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
      return [state[index], next => { state[index] = typeof next === 'function' ? next(state[index]) : next; }];
    };
    ${compiled}
    export const render = () => { cursor = 0; return NumberTickerShiftExamples(); };
  `));
}

const descendants = tree => typeof tree !== 'object' || !tree ? [] : [tree, ...tree.props.children.flatMap(descendants)];

test('comparison controls reverse every required pair and keep source in sync with the selected mode', async () => {
  const { render } = await exampleHarness();
  let tree = render();
  let nodes = descendants(tree);
  assert.match(tree.props.code, /animation="morph"/);
  assert(nodes.filter(node => node.type === 'NumberTicker').every(node => node.props.duration === 420));
  const selector = nodes.find(node => node.type === 'DocsSelect');
  assert.deepEqual(selector.props.options.map(([mode]) => mode), ['count', 'roll', 'morph']);

  for (const [index, from, to, kind] of [[0, 10, 1000, 'shift'], [1, 12.34, 123.4, 'shift'], [2, 1.2, 120, 'shift'], [3, 12, 0.12, 'shift'], [4, 12, 13, 'increment'], [5, 99, 100, 'carry']]) {
    const row = () => descendants(render()).filter(node => node.props['data-comparison'])[index];
    assert.equal(row().props['data-comparison'], kind);
    const action = () => descendants(row()).find(node => node.type === 'Button');
    assert.deepEqual(action().props.children, [`${from} → ${to}`]);
    action().props.onClick();
    assert.equal(descendants(row()).find(node => node.type === 'NumberTicker').props.value, to);
    assert.match(render().props.code, new RegExp(`useState\\(${String(to).replace('.', '\\.')}\\)`));
    assert.deepEqual(action().props.children, [`${to} → ${from}`]);
    action().props.onClick();
    assert.equal(descendants(row()).find(node => node.type === 'NumberTicker').props.value, from);
  }
  for (const mode of ['roll', 'count', 'morph']) {
    selector.props.onValueChange(mode);
    tree = render();
    nodes = descendants(tree);
    assert(nodes.filter(node => node.type === 'NumberTicker').every(node => node.props.animation === mode));
    assert.match(tree.props.code, new RegExp(`animation="${mode}"`));
  }
});
