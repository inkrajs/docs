import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import { lookupDocsMessage } from '../../src/docsLocales.ts';
import { gridDocsMessages } from '../../src/gridDocsMessages.ts';

test('grid and inventory playground copy uses complete five-language dictionaries', () => {
  const keys = new Set(Object.keys(gridDocsMessages));
  for (const file of ['GridExamples.tsx', 'InventoryGridExamples.tsx']) {
    const source = readFileSync(new URL(`../../src/components/expansion/${file}`, import.meta.url), 'utf8');
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = node => {
      if (ts.isCallExpression(node) && node.expression.getText(ast) === 't' && ts.isStringLiteral(node.arguments[0])) keys.add(node.arguments[0].text);
      ts.forEachChild(node, visit);
    };
    visit(ast);
    assert.doesNotMatch(source, /locale\s*===\s*['"]zh-CN['"]/, `${file} must not bypass the other three languages`);
  }
  for (const key of keys) {
    for (const locale of ['en', 'ja', 'ko', 'fr']) {
      assert(lookupDocsMessage(locale, key)?.trim(), `${locale}: ${key}`);
    }
  }
});

test('translated grid names retain stable item identities', () => {
  const board = readFileSync(new URL('../../src/components/expansion/GridExamples.tsx', import.meta.url), 'utf8');
  const inventory = readFileSync(new URL('../../src/components/expansion/InventoryGridExamples.tsx', import.meta.url), 'utf8');
  assert.match(board, /getItemLabel=\{id => labels\[id\]\}/);
  assert.match(inventory, /\.\.\.item, label: labels\[item\.id\]/);
  assert.match(inventory, /\.\.\.container, label: labels\[container\.id\]/);
  assert.doesNotMatch(board, /import\s*\{[^}]*PencilText[^}]*\}\s*from\s*['"]\.\.\/\.\.\/i18n['"]/, 'Already translated names must not be translated again (Japanese 操作 is also a Chinese source key)');
});

test('property categories truncate long translations without shrinking icons', () => {
  const tabs = readFileSync(new URL('../../src/components/PropertyTabs.tsx', import.meta.url), 'utf8');
  const styles = readFileSync(new URL('../../src/components/ComponentExample.css', import.meta.url), 'utf8');
  assert.match(tabs, /<PencilText ellipsis>\{t\(group\.label\)\}<\/PencilText>/);
  assert.match(styles, /\.property-tabs > \.inkra-tabs__list \.inkra-tabs__label\s*\{[^}]*min-width:\s*0;/);
  assert.match(styles, /\.property-tabs > \.inkra-tabs__list \.inkra-tabs__label\s*\{[^}]*flex:\s*1;/);
});
