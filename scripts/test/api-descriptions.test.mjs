import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const root = new URL('../../', import.meta.url);
const source = readFileSync(new URL('src/components/apiDescriptions.ts', root), 'utf8');
const module = ts.transpile(source, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext });
const { describeApiProp } = await import('data:text/javascript;base64,' + Buffer.from(module).toString('base64'));

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
        for (const [locale, explicit] of [['zh-CN', zh], ['en', en]]) {
          const description = explicit ?? describeApiProp('', prop, locale);
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
