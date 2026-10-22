import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const examples = await readFile(new URL('../src/components/TreeSelectExamples.tsx', import.meta.url), 'utf8');
const exampleStyles = await readFile(new URL('../src/components/TreeSelectExamples.css', import.meta.url), 'utf8');
const component = await readFile(new URL('../../../packages/inkra/src/tree-select/index.tsx', import.meta.url), 'utf8');
const model = await readFile(new URL('../../../packages/inkra/src/tree-select/model.ts', import.meta.url), 'utf8');
const componentStyles = await readFile(new URL('../../../packages/inkra/src/tree-select/styles.css', import.meta.url), 'utf8');

assert.match(examples, /<ComponentPlayground/);
assert.match(examples, /PropertyTabs/);
assert.match(examples, /locale === 'zh-CN'/);
assert.match(examples, /multiple/);
assert.match(examples, /branchSelection/);
assert.match(examples, /selectionPropagation/);
assert.match(examples, /renderLabel/);
assert.match(examples, /renderValue/);
assert.match(examples, /disabled/);
assert.match(examples, /clearable/);
assert.match(examples, /type="reset"/);
assert.match(component, /<Popover\.Root/);
assert.match(component, /<Tree\.Root/);
assert.match(component, /onOpenAutoFocus/);
assert.match(component, /treeRef\.current\?\.focus/);
assert.match(component, /selectedIds/);
assert.match(model, /filterTreeSelectNodes/);
assert.match(model, /selectionPropagation === 'both'/);
assert.match(componentStyles, /--radix-popover-trigger-width/);
assert.match(componentStyles, /@media \(forced-colors: active\)/);
assert.match(exampleStyles, /overflow-wrap:\s*anywhere/);

console.log('PASS TreeSelect standard playground, bilingual labels, controlled modes, propagation, filtering, custom labels and responsive source checks');
