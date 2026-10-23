import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const root = new URL('../../', import.meta.url);
const read = name => readFileSync(new URL(`src/components/${name}`, root), 'utf8');

test('utility component documentation starts with playgrounds and stays general purpose', () => {
  const slot = read('SlotExamples.tsx');
  const log = read('LogExamples.tsx');
  const hotkey = read('HotkeyExamples.tsx');
  const ticker = read('NumberTickerExamples.tsx');

  for (const source of [slot, log, hotkey, ticker]) {
    const file = ts.createSourceFile('examples.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const main = file.statements.find(node => ts.isFunctionDeclaration(node)
      && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword));
    assert(main, 'the exported example renders a playground');
    const tags = [];
    function visit(node) {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) tags.push(node.tagName.getText(file));
      ts.forEachChild(node, visit);
    }
    visit(main);
    const playground = tags.findIndex(tag => tag.endsWith('Playground'));
    assert(playground >= 0 && playground < tags.indexOf('ComponentExample'));
    assert(source.includes('<ComponentPlayground'), 'local playground wrappers use the shared component');
    assert.match(source, /<PropertyTabs/);
  }
  assert.match(slot, /快捷工具/);
  assert.match(slot, /资源槽位/);
  assert.match(log, /t\('运行记录'\)/);
  assert.match(hotkey, /Editor shortcuts/);
  assert.match(ticker, /Points and resources/);
  assert.match(ticker, /Statistics and edge values/);
  assert.match(ticker, /Custom display/);
  assert.doesNotMatch(slot + ticker, /battle|combat|rarity|equipment/i);
  assert.doesNotMatch(slot, /sortable|drag(?:gable)?|drop/i);
});
