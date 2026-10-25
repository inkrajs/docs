import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import { Grid, GridBoard, GridResizable } from '@inkra/react';

const source = readFileSync(new URL('../../src/components/expansion/gridApi.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const { gridApiGroups } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const row = (id, prop) => gridApiGroups.find(group => group.id === id)?.rows.find(item => item[0] === prop);
const declaredProps = (file, name) => {
  const url = new URL(`../../node_modules/@inkra/react/dist/layout/${file}.d.ts`, import.meta.url);
  const ast = ts.createSourceFile(url.pathname, readFileSync(url, 'utf8'), ts.ScriptTarget.Latest, true);
  const declaration = ast.statements.find(node => ts.isInterfaceDeclaration(node) && node.name.text === name);
  assert.ok(declaration, `${name} is an installed public interface`);
  return declaration.members.filter(ts.isPropertySignature).map(member => member.name.getText(ast));
};

test('Grid API groups match the real Grid, Grid.Resizable and Grid.Board public components', () => {
  assert.deepEqual(gridApiGroups.map(group => [group.id, group.title]), [
    ['grid', 'Grid'], ['resizable', 'Grid.Resizable'], ['board', 'Grid.Board'],
  ]);
  assert.equal(Grid.Root, undefined);
  assert.equal(Grid.Resizable, GridResizable);
  assert.equal(Grid.Board, GridBoard);
  for (const group of gridApiGroups) {
    assert.equal(new Set(group.rows.map(item => item[0])).size, group.rows.length);
    for (const item of group.rows) {
      assert.equal(item.length, 5, 'Every row has a default and Chinese/English descriptions');
      assert.ok(item.every(value => typeof value === 'string' && value.length > 0));
    }
  }
});

test('All declared Grid props have rows in the owning API group', () => {
  for (const [id, file, type] of [
    ['grid', 'index', 'GridProps'],
    ['resizable', 'GridResizable', 'GridResizableProps'],
    ['board', 'GridBoard', 'GridBoardProps'],
  ]) {
    const documented = new Set(gridApiGroups.find(group => group.id === id).rows.flatMap(item => item[0].split(' / ')));
    for (const prop of declaredProps(file, type)) assert.ok(documented.has(prop), `${type}.${prop} must be documented in ${id}`);
  }
});

test('Grid APIs keep distinct spacing units, defaults, children contracts and ref support', () => {
  assert.equal(row('grid', 'gap')[1], 'LayoutSpace');
  assert.equal(row('grid', 'gap')[2], '3');
  assert.equal(row('board', 'gap')[1], 'number');
  assert.equal(row('board', 'gap')[2], '12');
  assert.equal(row('board', 'columns')[2], '12');
  assert.equal(row('board', 'rowHeight')[2], '48');
  assert.equal(row('board', 'stackAt')[2], '480');
  assert.equal(row('board', 'compact')[2], "'vertical'");
  assert.equal(row('grid', 'children')[1], 'ReactNode');
  assert.match(row('resizable', 'children')[1], /rowIndex: number; columnIndex: number/);
  assert.equal(row('board', 'children')[1], '(item: GridBoardLayoutItem) => ReactNode');
  assert.ok(row('grid', 'as'));
  assert.ok(row('grid', 'ref'));
  assert.ok(row('resizable', 'ref'));
  assert.equal(row('resizable', 'as'), undefined);
  assert.equal(row('board', 'as'), undefined);
  assert.equal(row('board', 'ref'), undefined);
});
