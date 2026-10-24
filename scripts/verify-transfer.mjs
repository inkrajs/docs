import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const examples = await readFile(new URL('../src/components/TransferExamples.tsx', import.meta.url), 'utf8');
const exampleStyles = await readFile(new URL('../src/components/TransferExamples.css', import.meta.url), 'utf8');
const messages = await readFile(new URL('../src/i18n.tsx', import.meta.url), 'utf8');
const component = await readFile(new URL('../node_modules/@inkra/react/dist/transfer/index.js', import.meta.url), 'utf8');
const componentStyles = await readFile(new URL('../node_modules/@inkra/react/dist/styles.css', import.meta.url), 'utf8');

assert.match(examples, /<ComponentPlayground/);
assert.match(examples, /PropertyTabs/);
assert.match(examples, /targetKeys=\{targetKeys\}/);
assert.match(examples, /defaultTargetKeys/);
assert.match(examples, /disabled: true/);
assert.match(examples, /selectAllSource: '选择当前筛选的可选成员'/);
assert.match(examples, /targetEmpty: '尚未选择成员'/);
assert.match(messages, /Select filtered available people/);
assert.match(messages, /No people selected/);
assert.match(examples, /onTargetKeysChange/);
assert.match(component, /selectableVisible\('source'\)/);
assert.match(component, /selectableVisible\('target'\)/);
assert.match(component, /currentTargetKeys\.includes/);
assert.match(component, /pendingFocus/);
assert.doesNotMatch(component, /DndContext|useSortable|draggable|onDrag/);
assert.match(componentStyles, /grid-template-columns:\s*minmax\(0, 1fr\) auto minmax\(0, 1fr\)/);
assert.match(componentStyles, /container-name:\s*inkra-transfer/);
assert.match(componentStyles, /@container inkra-transfer \(max-width: 720px\)/);
assert.match(exampleStyles, /overflow-wrap:\s*anywhere/);

console.log('PASS Transfer standard playground, controlled/uncontrolled examples, filtered batch wording, disabled and responsive source checks');
