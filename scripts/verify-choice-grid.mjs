import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const libraryRoot = new URL('../../../packages/inkra/', import.meta.url);
const source = readFileSync(new URL('src/choice-grid/index.tsx', libraryRoot), 'utf8');
const styles = readFileSync(new URL('src/choice-grid/styles.css', libraryRoot), 'utf8');
const tests = readFileSync(new URL('test/choice-grid.test.mjs', libraryRoot), 'utf8');
const example = readFileSync(new URL('../src/components/ChoiceGridExamples.tsx', import.meta.url), 'utf8');
const exampleStyles = readFileSync(new URL('../src/components/ChoiceGridExamples.css', import.meta.url), 'utf8');

assert.match(source, /RadioGroup, RadioGroupItem/);
assert.match(source, /Checkbox/);
assert.doesNotMatch(source, /useState|useReducer/);
assert.match(source, /type\?: 'single'/);
assert.match(source, /type: 'multiple'/);
assert.match(source, /values\?: readonly string\[\]/);
assert.match(source, /defaultValues\?: readonly string\[\]/);
assert.match(source, /aria-describedby=\{describedBy\}/);
assert.match(source, /aria-errormessage=\{errorMessage\}/);
assert.match(source, /aria-invalid=\{invalid \|\| undefined\}/);
assert.match(source, /<img \{\.\.\.image\} alt="" \/>/);
assert.match(source, /querySelectorAll<HTMLInputElement>/);
assert.match(styles, /repeat\(auto-fit/);
assert.match(styles, /var\(--inkra-choice-grid-min-item/);
assert.match(styles, /@media \(max-width: 640px\)/);
assert.match(styles, /@media \(forced-colors: active\)/);
assert.match(styles, /:focus-visible/);
assert.match(styles, /min-block-size: 144px/);
assert.match(tests, /native RadioGroup semantics/);
assert.match(tests, /native checkboxes/);

const playgroundPosition = example.indexOf('<ComponentPlayground');
const supplementalPosition = example.indexOf('<ComponentExample');
assert.ok(playgroundPosition >= 0 && supplementalPosition > playgroundPosition);
assert.match(example, /locale === 'zh-CN'/);
assert.match(example, /Selection mode/);
assert.match(example, /Desktop columns/);
assert.match(example, /Disable group/);
assert.match(example, /Show error/);
assert.match(example, /type="multiple"/);
assert.match(example, /defaultValues=\{\['notes', 'history'\]\}/);
assert.match(example, /src: '\/favicon\.png'/);
assert.match(exampleStyles, /@media \(max-width: 390px\)/);

console.log('ChoiceGrid route-local source, semantics, responsive styles, tests, and bilingual examples verified.');
