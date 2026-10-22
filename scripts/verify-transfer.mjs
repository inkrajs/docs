import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const examples = await readFile(new URL('../src/components/TransferExamples.tsx', import.meta.url), 'utf8');
const exampleStyles = await readFile(new URL('../src/components/TransferExamples.css', import.meta.url), 'utf8');
const component = await readFile(new URL('../../../packages/inkra/src/transfer/index.tsx', import.meta.url), 'utf8');
const componentStyles = await readFile(new URL('../../../packages/inkra/src/transfer/styles.css', import.meta.url), 'utf8');

assert.match(examples, /<ComponentPlayground/);
assert.match(examples, /PropertyTabs/);
assert.match(examples, /targetKeys=\{targetKeys\}/);
assert.match(examples, /defaultTargetKeys/);
assert.match(examples, /disabled: true/);
assert.match(examples, /Select filtered available people/);
assert.match(examples, /No people selected/);
assert.match(examples, /onTargetKeysChange/);
assert.match(component, /selectableVisible\('source'\)/);
assert.match(component, /selectableVisible\('target'\)/);
assert.match(component, /currentTargetKeys\.includes/);
assert.match(component, /pendingFocus/);
assert.doesNotMatch(component, /DndContext|useSortable|draggable|onDrag/);
assert.match(componentStyles, /grid-template-columns:\s*minmax\(0, 1fr\) auto minmax\(0, 1fr\)/);
assert.match(componentStyles, /@media \(max-width: 720px\)/);
assert.match(exampleStyles, /overflow-wrap:\s*anywhere/);

console.log('PASS Transfer standard playground, controlled/uncontrolled examples, filtered batch wording, disabled and responsive source checks');
