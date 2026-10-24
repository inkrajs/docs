import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('Log examples default to natural height and opt into a bounded scroll viewport', () => {
  const source = read('src/components/LogExamples.tsx');
  const css = read('src/components/LogExamples.css');
  assert.match(source, /bounded = false/);
  assert.match(source, /<ExampleFrame bounded=\{bounded\}>/);
  assert.match(css, /\.log-examples__frame \{\s*min-block-size: 12rem;/);
  assert.match(css, /\[data-bounded="true"\] \{ block-size: 22rem;/);
  assert.match(source, /const index = \+\+sequence.current/);
  assert.match(source, /Date.UTC\(2026, 9, 23, 9, 42, index \+ 4\)/);
});

test('DataTable examples expose stable selection and localized sorting status', () => {
  const source = read('src/components/expansion/DataExamples.tsx');
  assert.match(source, /rowSelection=\{selection\}/);
  assert.match(source, /onRowSelectionChange=\{setSelection\}/);
  assert.match(source, /data-testid="data-table-selection"/);
  assert.match(source, /name: text.name, status: text.status, items: text.items/);
  assert.match(source, /sortStatusLabel=\{sortStatusLabel\}/);
});

test('Pagination changing-total example has a real control and uncontrolled page state', () => {
  const source = read('src/components/expansion/NavigationExamples.tsx');
  assert.match(source, /value=\{String\(changingTotal\)\}/);
  assert.match(source, /setChangingTotal\(Number\(value\)\)/);
  assert.match(source, /totalPages=\{changingTotal\} defaultPage=\{9\}/);
});
