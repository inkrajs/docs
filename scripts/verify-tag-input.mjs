import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const examples = await readFile(new URL('../src/components/TagInputExamples.tsx', import.meta.url), 'utf8');
const exampleStyles = await readFile(new URL('../src/components/TagInputExamples.css', import.meta.url), 'utf8');
const component = await readFile(new URL('../../../packages/inkra/src/tag-input/index.tsx', import.meta.url), 'utf8');
const model = await readFile(new URL('../../../packages/inkra/src/tag-input/model.ts', import.meta.url), 'utf8');
const componentStyles = await readFile(new URL('../../../packages/inkra/src/tag-input/styles.css', import.meta.url), 'utf8');

assert.match(examples, /<ComponentPlayground/);
assert.match(examples, /PropertyTabs/);
assert.match(examples, /value=\{tags\}/);
assert.match(examples, /defaultValue=/);
assert.match(examples, /createTag=/);
assert.match(examples, /validateTag=/);
assert.match(examples, /maxTags=/);
assert.match(examples, /readOnly/);
assert.match(examples, /disabled/);
assert.match(examples, /输入法组合期间不会提交|IME composition does not commit/);
assert.match(examples, /id 用于稳定身份|id is stable identity/);
assert.match(component, /inputValue\?: string/);
assert.match(component, /defaultInputValue\?: string/);
assert.match(component, /commitCandidates\(parsed\.parts, 'paste'\)/);
assert.match(component, /nativeEvent\.isComposing/);
assert.match(component, /event\.key === 'Backspace' && currentDraft\.length === 0/);
assert.match(component, /name=\{name\} type="hidden" value=\{tag\.value\}/);
assert.doesNotMatch(component, /Mention|suggestion|combobox|@trigger/i);
assert.match(model, /toLocaleLowerCase\(\)/);
assert.match(componentStyles, /min-block-size:\s*var\(--inkra-touch-target\)/);
assert.match(componentStyles, /@media \(forced-colors: active\)/);
assert.match(exampleStyles, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
assert.match(exampleStyles, /@media \(max-width: 42rem\)/);

console.log('PASS TagInput playground, controlled/uncontrolled state, validation, paste/IME, identity contract and responsive source checks');
