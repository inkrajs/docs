import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const libraryRoot = new URL('../../../packages/inkra/', import.meta.url);
const source = readFileSync(new URL('src/context-menu/index.tsx', libraryRoot), 'utf8');
const styles = readFileSync(new URL('src/context-menu/styles.css', libraryRoot), 'utf8');
const tests = readFileSync(new URL('test/context-menu.test.mjs', libraryRoot), 'utf8');
const example = readFileSync(new URL('../src/components/ContextMenuExamples.tsx', import.meta.url), 'utf8');
const exampleStyles = readFileSync(new URL('../src/components/ContextMenuExamples.css', import.meta.url), 'utf8');

assert.match(source, /DropdownMenu/);
assert.match(source, /Primitive\.Sub/);
assert.match(source, /open\?: boolean/);
assert.match(source, /defaultOpen\?: boolean/);
assert.match(source, /ContextMenuNativePolicy/);
assert.match(source, /data-context-menu-native/);
assert.match(source, /event\.key !== 'ContextMenu'/);
assert.match(source, /event\.shiftKey && event\.key === 'F10'/);
assert.match(source, /longPress\?: boolean \| ContextMenuLongPressOptions/);
assert.match(source, /Math\.hypot/);
assert.match(source, /selection\.isCollapsed/);
assert.match(source, /suppressContextMenuUntil/);
assert.match(source, /context\.restoreFocus\(\)/);
assert.match(source, /openFromKeyboard[\s\S]*?shouldUseNativeMenu/);
assert.doesNotMatch(source, /setPointerCapture|touch-action/);
assert.match(styles, /position: fixed/);
assert.match(styles, /max-block-size: var\(--radix-dropdown-menu-content-available-height\)/);
assert.match(styles, /forced-colors: active/);
assert.match(tests, /controlled state/);
assert.match(tests, /native browser menu/);

const playgroundPosition = example.indexOf('<ComponentPlayground');
const supplementalPosition = example.indexOf('<ComponentExample');
assert.ok(playgroundPosition >= 0 && supplementalPosition > playgroundPosition);
assert.match(example, /locale === 'zh-CN'/);
assert.match(example, /Controlled open state/);
assert.match(example, /Enable touch long press/);
assert.match(example, /Disable trigger area/);
assert.match(example, /ContextMenu\.SubTrigger/);
assert.match(example, /ContextMenu\.SubContent/);
assert.match(example, /context-menu-demo__surface/);
assert.match(example, /data-context-menu-native/);
assert.match(example, /ContextMenu \/ Shift\+F10/);
assert.match(exampleStyles, /@media \(max-width: 390px\)/);
assert.match(exampleStyles, /@media \(forced-colors: active\)/);

console.log('ContextMenu route-local source, semantics, long-press safeguards, tests, and bilingual examples verified.');
