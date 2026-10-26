import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const root = new URL('../../', import.meta.url);
const source = readFileSync(new URL('src/components/apiDescriptions.ts', root), 'utf8');
const rollCopy = ts.transpile(readFileSync(new URL('src/components/numberTickerRollCopy.ts', root), 'utf8'), { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext });
const iconCopy = ts.transpile(readFileSync(new URL('src/components/iconFillCopy.ts', root), 'utf8'), { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext });
const module = ts.transpile(source, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext })
  .replace('./numberTickerRollCopy', 'data:text/javascript;base64,' + Buffer.from(rollCopy).toString('base64'))
  .replace('./iconFillCopy', 'data:text/javascript;base64,' + Buffer.from(iconCopy).toString('base64'));
const { describeApiProp } = await import('data:text/javascript;base64,' + Buffer.from(module).toString('base64'));

test('disclosure mounting descriptions keep visibility and focus ownership explicit', () => {
  for (const [component, prop] of [['tabs', 'Content.value / forceMount'], ['accordion', 'Content.forceMount']]) {
    assert.match(describeApiProp(component, prop, 'en'), /hidden|collapsed/);
    assert.match(describeApiProp(component, prop, 'en'), /focus/);
    assert.match(describeApiProp(component, prop, 'zh-CN'), /状态/);
    assert.doesNotMatch(describeApiProp(component, prop, 'en'), /external animation or visibility management/);
  }
});

test('context-menu API explains native exclusions, callback reasons and focus overrides', () => {
  assert.match(describeApiProp('context-menu', 'Trigger.nativeContextMenu', 'en'), /exclude takes precedence/);
  assert.match(describeApiProp('context-menu', 'Trigger.exclude', 'en'), /data-context-menu-native/);
  assert.match(describeApiProp('context-menu', 'Root.onOpenChange', 'en'), /pointer, keyboard, long-press or dismiss/);
  assert.match(describeApiProp('context-menu', 'Content.onCloseAutoFocus', 'en'), /preventDefault/);
});

test('every documented property has meaningful Chinese and English descriptions', () => {
  const docsRoot = new URL('src/components/', root);
  const files = ['FoundationPages.tsx', ...readdirSync(new URL('expansion/', docsRoot))
    .filter(name => name.endsWith('Examples.tsx')).map(name => 'expansion/' + name)];
  let checked = 0;
  for (const name of files) {
    const file = ts.createSourceFile(name, readFileSync(new URL(name, docsRoot), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const rows = node => {
      if (ts.isArrayLiteralExpression(node) && [2, 4].includes(node.elements.length)
        && node.elements.every(ts.isStringLiteral)) {
        const [prop, , zh, en] = node.elements.map(item => item.text);
        let owner = node.parent;
        while (owner && !ts.isPropertyAssignment(owner)) owner = owner.parent;
        const component = name === 'FoundationPages.tsx' && owner
          && (ts.isStringLiteral(owner.name) || ts.isIdentifier(owner.name)) ? owner.name.text : '';
        for (const [locale, explicit] of [['zh-CN', zh], ['en', en]]) {
          const description = explicit ?? describeApiProp(component, prop, locale);
          assert(description.length > 4, `${name}: ${prop} lacks ${locale} description`);
        }
        checked++;
      }
      ts.forEachChild(node, rows);
    };
    const visit = node => {
      if ((ts.isVariableDeclaration(node) && node.name.getText(file) === 'apiRows')
        || (ts.isPropertyAssignment(node) && node.name.getText(file) === 'api')) rows(node);
      else ts.forEachChild(node, visit);
    };
    visit(file);
  }
  assert(checked > 300, 'the check covers the full API catalog');
});
