import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import { AlertDialog, Command, Drawer, Empty, Toast, ToggleGroup, Tree } from '@inkra/react';

const records = new Map();

function property(object, name) {
  assert.ok(ts.isObjectLiteralExpression(object), 'API metadata must be an object literal');
  return object.properties.find(node => ts.isPropertyAssignment(node) && node.name.getText().replace(/^['"]|['"]$/g, '') === name)?.initializer;
}

function readDoc(file, record, route) {
  if (!records.has(record)) {
    const url = new URL(`../../src/components/expansion/${file}Examples.tsx`, import.meta.url);
    const source = ts.createSourceFile(url.pathname, readFileSync(url, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const declaration = source.statements.filter(ts.isVariableStatement)
      .flatMap(statement => [...statement.declarationList.declarations])
      .find(node => node.name.getText(source) === record);
    assert.ok(declaration?.initializer, `${record} exists`);
    records.set(record, declaration.initializer);
  }
  const doc = property(records.get(record), route);
  assert.ok(doc, `${route} exists`);
  return doc;
}

function literal(node) {
  assert.ok(node && ts.isStringLiteral(node), 'API labels and descriptions must be literal strings');
  return node.text;
}

function groups(doc) {
  const array = property(doc, 'apiGroups');
  assert.ok(array && ts.isArrayLiteralExpression(array), 'Compound components use apiGroups');
  assert.equal(property(doc, 'api'), undefined, 'Do not duplicate the same API in a flat table');
  return array.elements.map(group => {
    const rows = property(group, 'rows');
    assert.ok(rows && ts.isArrayLiteralExpression(rows) && rows.elements.length > 0, 'Every group has API rows');
    return {
      id: literal(property(group, 'id')),
      title: literal(property(group, 'title')),
      rows: rows.elements.map(row => {
        assert.ok(ts.isArrayLiteralExpression(row) && [4, 5].includes(row.elements.length), 'Every row has Chinese and English descriptions');
        return row.elements.map(literal);
      }),
    };
  });
}

const compounds = [
  ['Navigation', 'navigationDocs', 'command', 'Command', Command],
  ['Overlays', 'overlaysDocs', 'alert-dialog', 'AlertDialog', AlertDialog],
  ['Overlays', 'overlaysDocs', 'drawer', 'Drawer', Drawer],
  ['Feedback', 'feedbackDocs', 'empty', 'Empty', Empty],
  ['Feedback', 'feedbackDocs', 'toggle-group', 'ToggleGroup', ToggleGroup],
  ['Data', 'dataDocs', 'tree', 'Tree', Tree],
];

for (const [file, record, route, name, exported] of compounds) {
  test(`${name} documents each installed public subcomponent in its own API group`, () => {
    const documented = groups(readDoc(file, record, route));
    assert.deepEqual(documented.map(group => group.title).sort(), Object.keys(exported).map(part => `${name}.${part}`).sort());
    assert.equal(new Set(documented.map(group => group.id)).size, documented.length, 'Deep-link IDs are unique');
    for (const group of documented) {
      assert.match(group.id, /^[a-z][a-z0-9-]*$/);
      for (const row of group.rows) {
        assert.ok(row.every(value => value.trim().length > 0));
        assert.ok(!row[0].includes(`${name}.`), 'Group-local rows use prop names, not mixed component prefixes');
      }
    }
  });
}

test('Toast separates Provider props from hook and external-manager APIs', () => {
  const documented = groups(readDoc('Feedback', 'feedbackDocs', 'toast'));
  assert.deepEqual(documented.map(group => group.title), Object.keys(Toast).map(key => key === 'Provider' ? `Toast.${key}` : key));
  const provider = documented.find(group => group.id === 'provider');
  const manager = documented.find(group => group.id === 'use-toast-manager');
  assert.ok(provider.rows.some(row => row[0] === 'placement'));
  assert.ok(!provider.rows.some(row => row[0] === 'add'));
  assert.ok(manager.rows.some(row => row[0] === 'add'));
  assert.ok(!manager.rows.some(row => row[0] === 'placement'));
});

test('Single expansion components retain one API table instead of synthetic subcomponent groups', () => {
  for (const [file, record, routes] of [
    ['Navigation', 'navigationDocs', ['pagination']],
    ['Data', 'dataDocs', ['data-table']],
    ['Flows', 'flowsDocs', ['upload', 'steps', 'timeline']],
    ['Dates', 'datesDocs', ['date-picker', 'time-picker']],
  ]) {
    for (const route of routes) {
      const doc = readDoc(file, record, route);
      assert.equal(property(doc, 'apiGroups'), undefined, `${route} remains a single-component API`);
      assert.ok(ts.isArrayLiteralExpression(property(doc, 'api')), `${route} retains its API rows`);
    }
  }
});
