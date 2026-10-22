import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';

// Execute the real catalog and path converter without a dev server or browser.
function loadSource(path, dependencies = {}) {
  const url = new URL(path, import.meta.url);
  const require = createRequire(url);
  const { outputText } = ts.transpileModule(readFileSync(url, 'utf8'), {
    fileName: url.pathname,
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputText)(
    name => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name),
    module,
    module.exports,
  );
  return module.exports;
}

const docsIcon = loadSource('../../src/components/DocsIcon.tsx');
const { docsIconCatalog, navigationIcon } = loadSource('../../src/components/iconCatalog.ts', {
  './DocsIcon': docsIcon,
});
const { foundationComponents, foundationNames, componentNavigationGroups } = loadSource('../../src/componentRoutes.ts');

test('every registered component and navigation group has an explicit pencil icon', () => {
  const labels = [
    'Button',
    ...foundationComponents.map(route => foundationNames[route]),
    ...componentNavigationGroups.map(group => group.label),
    '开始', '组件', '设计资源', '快速开始', '使用指南', '设计规范',
  ];
  const fallback = navigationIcon('__unknown_component__');
  for (const label of labels) {
    const data = navigationIcon(label);
    assert.notEqual(data, fallback, `${label} must not fall back to the search icon`);
    const paths = docsIcon.iconPaths(data);
    assert.ok(paths.length > 0, `${label} needs drawable pencil paths`);
    assert.ok(paths.every(path => path.d && !/NaN|undefined/.test(path.d)), `${label} has invalid geometry`);
  }
});

test('icon catalog keys stay unique and all catalog geometry can be rendered', () => {
  assert.equal(new Set(docsIconCatalog.map(icon => icon.key)).size, docsIconCatalog.length);
  for (const icon of docsIconCatalog) {
    assert.ok(icon.paths.length > 0, `${icon.label} needs drawable paths`);
  }
});
