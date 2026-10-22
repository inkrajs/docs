import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const examples = await readFile(new URL('../src/components/KeypadExamples.tsx', import.meta.url), 'utf8');
const exampleStyles = await readFile(new URL('../src/components/KeypadExamples.css', import.meta.url), 'utf8');
const component = await readFile(new URL('../../../packages/inkra/src/keypad/index.tsx', import.meta.url), 'utf8');

assert.match(examples, /<ComponentPlayground/);
assert.match(examples, /PropertyTabs/);
assert.match(examples, /numericLayout/);
assert.match(examples, /passwordLayout/);
assert.match(examples, /operations/);
assert.match(examples, /Physical keyboard and keypad both work/);
assert.match(examples, /type="password"/);
assert.match(examples, /Long custom label \/ 自定义长标签/);
assert.match(examples, /disabled: true/);
assert.match(examples, /onKeyPress/);
assert.match(examples, /onConfirm/);
assert.match(component, /role="group"/);
assert.doesNotMatch(component, /addEventListener\(['"]keydown|window\.onkeydown|document\.onkeydown/);
assert.match(exampleStyles, /overflow-wrap:\s*anywhere/);
assert.match(exampleStyles, /@media \(max-width: 420px\)/);

console.log('PASS Keypad standard playground, numeric/password/operation examples, physical-keyboard path and responsive source checks');
