import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

function moduleUrl(path, imports = {}) {
  let code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  for (const [specifier, replacement] of Object.entries(imports)) code = code.replaceAll(specifier, replacement);
  return `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
}
const { localizeApiRows } = await import(moduleUrl('../../src/components/apiGroupRows.ts', {
  './apiDescriptions.ts': moduleUrl('../../src/components/apiDescriptions.ts'),
}));
const { layoutApiGroups } = await import(moduleUrl('../../src/components/expansion/layoutApi.ts'));
const { readComponentPageTab } = await import(moduleUrl('../../src/documentAnchors.ts'));

test('API rows preserve bilingual descriptions and normalize optional default columns', () => {
  const rows = [
    ['children', 'ReactNode'],
    ['value', 'string', '当前值', 'Current value'],
    ['disabled', 'boolean', 'false', '禁用交互', 'Disables interaction'],
  ];
  const original = JSON.stringify(rows);
  const chinese = localizeApiRows(rows, 'zh-CN');
  assert(chinese.every(row => row.length === 4));
  assert.equal(chinese[0][2], '-');
  assert(chinese[0][3].length > 0, 'short rows use the existing property descriptions');
  assert.deepEqual(chinese[1], ['value', 'string', '-', '当前值']);
  assert.deepEqual(chinese[2], ['disabled', 'boolean', 'false', '禁用交互']);
  for (const locale of ['en-US', 'ja-JP', 'ko-KR', 'fr-FR']) {
    const result = localizeApiRows(rows, locale);
    assert.deepEqual(result[1], ['value', 'string', '-', 'Current value']);
    assert.deepEqual(result[2], ['disabled', 'boolean', 'false', 'Disables interaction']);
  }
  assert.equal(JSON.stringify(rows), original, 'source dictionaries are not mutated');
  assert.deepEqual(localizeApiRows(rows.slice(0, 2), 'en-US')[1], ['value', 'string', 'Current value']);
});

test('Layout API has six distinct subcomponent sections with actual defaults', () => {
  assert.deepEqual(layoutApiGroups.map(group => group.id), ['root', 'header', 'body', 'sidebar', 'content', 'footer']);
  const row = (id, prop) => layoutApiGroups.find(group => group.id === id).rows.find(item => item[0] === prop);
  for (const group of layoutApiGroups) {
    assert.equal(new Set(group.rows.map(item => item[0])).size, group.rows.length);
    assert.equal(readComponentPageTab(`#layout-api-${group.id}`), 'api');
    assert.equal(row(group.id, 'children')[1], 'ReactNode');
    for (const prop of ['mode', 'resizable', 'collapsed', 'mobilePresentation']) assert.equal(row(group.id, prop), undefined);
  }
  assert.equal(row('root', 'collapseAt')[2], "'sm'");
  assert.equal(row('root', 'gap')[2], '0');
  assert.equal(row('root', 'swipeNavigation.threshold')[2], '48');
  assert.equal(row('root', 'sidebarWidth')[2], '240');
  assert.equal(row('sidebar', 'width')[2], 'Root.sidebarWidth / 240');
  assert.equal(row('header', 'sidebar')[1], 'ReactNode');
  assert.equal(row('header', 'sidebarDivided')[2], 'false');
  for (const id of ['header', 'sidebar', 'content', 'footer']) assert.equal(row(id, 'padding')[2], '5');
  assert.equal(row('content', 'as')[2], "'div'");
  assert.equal(row('content', 'divided'), undefined);
  for (const id of ['header', 'footer']) assert.equal(row(id, 'as')[2], `'${id}'`);
});

test('API group anchors select the API tab while example anchors stay in preview', () => {
  for (const hash of ['#api', '#layout-api-root', '#navigation-menu-api-trigger', '#grid-api-root', '#%6Cayout-api-content']) {
    assert.equal(readComponentPageTab(hash), 'api');
  }
  assert.equal(readComponentPageTab('#accessibility'), 'accessibility');
  for (const hash of ['', '#', '#preview', '#reading-width', '#layout-api-', '#%invalid']) {
    assert.equal(readComponentPageTab(hash), 'preview');
  }
});

test('grouped API rendering exposes named section anchors without demo framing', () => {
  const source = readFileSync(new URL('../../src/components/ApiGroups.tsx', import.meta.url), 'utf8');
  assert.match(source, /id=\{id\}.*aria-labelledby=\{`\$\{id\}-title`\}/);
  assert.match(source, /href=\{`#\$\{encodeURIComponent\(id\)\}`\}/);
  assert.match(source, /localizeApiRows\(group.rows, locale, component\)/);
  assert.doesNotMatch(source, /PencilSurface|ComponentExample\s/);
  const app = readFileSync(new URL('../../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /return readComponentPageTab\(window.location.hash\)/);
});
