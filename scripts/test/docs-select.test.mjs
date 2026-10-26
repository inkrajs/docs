import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import * as inkra from '@inkra/react';
import ts from 'typescript';
import { DocsControlContext } from '../../src/components/DocsControlContext.ts';
import { choiceVisuals, resolveChoiceVisuals } from '../../src/components/docsChoiceVisuals.ts';

const source = readFileSync(new URL('../../src/components/DocsSelect.tsx', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
});
const dependencies = {
  react: React,
  'react/jsx-runtime': jsxRuntime,
  '@inkra/react': inkra,
  './DocsControlContext': { DocsControlContext },
  './docsChoiceVisuals': { resolveChoiceVisuals },
  './DocsSelect.css': {},
  '../i18n': {
    PencilText: inkra.PencilText,
    useLocale: () => ({ locale: 'en', t: text => `translated:${text}` }),
    translateOptionLabel: (_locale, text) => `option:${text}`,
  },
};
const iconModule = {};
for (const name of ['iconFilledPaths', 'iconColorPaths']) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL(`../../src/components/${name}.ts`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'exports', code)(name => {
    assert(name in dependencies, `Unexpected icon dependency ${name}`);
    return dependencies[name];
  }, exports);
  dependencies[`./${name}`] = exports;
}
const iconSource = ts.transpileModule(readFileSync(new URL('../../src/components/DocsIcon.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText;
new Function('require', 'exports', iconSource)(name => dependencies[name], iconModule);
dependencies['./DocsIcon'] = iconModule;
const exports = {};
new Function('require', 'exports', outputText)(name => {
  assert(name in dependencies, `Unexpected dependency ${name}`);
  return dependencies[name];
}, exports);
const props = {
  label: 'Mode', value: 'a', onValueChange() {}, options: [['a', 'First'], ['b', 'Second']],
};
const render = (overrides = {}, isControl = true) => renderToStaticMarkup(
  React.createElement(DocsControlContext.Provider, { value: isControl },
    React.createElement(exports.DocsSelect, { ...props, ...overrides })),
);

test('small configuration choices use the library RadioGroup with translated labels', () => {
  for (const count of [2, 3, 4]) {
    const html = render({ options: Array.from({ length: count }, (_, i) => [String(i), `Choice ${i}`]) });
    assert.match(html, /data-presentation="radio"/);
    assert.match(html, /role="radiogroup"/);
    assert.match(html, /data-variant="segmented"/);
    assert.doesNotMatch(html, /inkra-radio-group__mark/);
    assert.match(html, /translated:Mode/);
    assert.match(html, /option:Choice 0/);
    assert.equal((html.match(/type="radio"/g) ?? []).length, count);
    assert.doesNotMatch(html, /role="combobox"/);
  }
});

test('semantic families render actual pencil icons rather than generic radio dots', () => {
  for (const family of Object.values(choiceVisuals)) {
    const options = Object.keys(family).map(key => [key, `Localized ${key}`]);
    const html = render({ options, visuals: family });
    assert.equal((html.match(/class="docs-choice-icon"/g) ?? []).length, options.length);
    assert.equal((html.match(/class="inkra-pencil-icon docs-pencil-icon"/g) ?? []).length, options.length);
    assert.doesNotMatch(html, /inkra-radio-group__mark/);
    for (const [key, visual] of Object.entries(family)) {
      assert.match(html, new RegExp(`data-choice-icon="${visual.icon.name}"`));
      assert(html.includes(`option:Localized ${key}`));
    }
  }
});

test('visual matching uses stable value families, with explicit axis overrides and honest text fallback', () => {
  const directions = [['bottom', '下'], ['vertical', '上下'], ['all', '全部']];
  assert.equal(resolveChoiceVisuals(directions), choiceVisuals.loadDirection);
  assert.equal(resolveChoiceVisuals(directions.map(([key]) => [key, 'other language'])), choiceVisuals.loadDirection);
  assert.equal(resolveChoiceVisuals([['automatic', 'A'], ['release', 'B'], ['both', 'C']]), choiceVisuals.loadInteraction);
  assert.equal(resolveChoiceVisuals([['1', '1'], ['2', '2']]), undefined);
  assert.equal(resolveChoiceVisuals([['all', 'Everything'], ['unrelated', 'Unrelated']]), undefined);
  const alignment = [['start', 'Start'], ['center', 'Center'], ['end', 'End']];
  assert.equal(resolveChoiceVisuals(alignment), choiceVisuals.textAlignment);
  const html = render({ options: alignment, visuals: choiceVisuals.verticalAlignment });
  assert(html.includes(choiceVisuals.verticalAlignment.start.icon.name));
  assert(!html.includes(choiceVisuals.textAlignment.start.icon.name));
  assert.doesNotMatch(render({ options: [['48', '48px'], ['72', '72px']] }), /docs-choice-icon/);
  // Partial metadata must not leave a mixture of blank and illustrated options.
  assert.doesNotMatch(render({ options: alignment, visuals: { start: choiceVisuals.textAlignment.start } }), /docs-choice-icon/);
  assert.deepEqual(Object.values(choiceVisuals.size).map(visual => visual.size), [10, 14, 20, 26]);
});

test('large lists, application fields and specialized triggers remain dropdowns', () => {
  for (const count of [0, 1, 5, 20]) {
    assert.match(render({ options: Array.from({ length: count }, (_, i) => [String(i), `Choice ${i}`]) }), /data-presentation="select"/);
  }
  assert.match(render({}, false), /data-presentation="select"/);
  assert.match(render({ hideLabel: true }), /data-presentation="select"/);
  assert.match(render({ startIcon: React.createElement('span', null, '+') }), /data-presentation="select"/);
  assert.match(render({ presentation: 'select' }), /data-presentation="select"/);
  assert.match(render({ presentation: 'radio' }, false), /data-presentation="radio"/);
});

test('only unambiguous symbol families omit labels by default, with explicit overrides', () => {
  const options = [['bottom', 'Bottom'], ['vertical', 'Vertical'], ['all', 'All directions']];
  const html = render({ options });
  assert.match(html, /data-option-labels="hidden"/);
  assert.match(html, /aria-label="option:All directions"/);
  assert.match(render({ options, optionLabels: 'visible' }), /data-option-labels="visible"/);
  assert.match(render({ options: [['automatic', 'Automatic'], ['release', 'Release'], ['both', 'Both']] }), /data-option-labels="visible"/);
  assert.match(render({ options: [['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large']] }), /data-option-labels="visible"/);
  assert.match(render({ options: [['loading', 'Loading'], ['error', 'Error']], optionLabels: 'hidden' }), /data-option-labels="hidden"/);
  assert.match(render({ options: [['1', '1'], ['2', '2']], optionLabels: 'hidden' }), /data-option-labels="visible"/);
  assert.match(html, /inkra-pencil-text--ellipsis/);
});

test('radio groups preserve disabled and controlled selection semantics with unique names', () => {
  const html = render({ disabled: true, value: 'b' });
  assert.match(html, /<fieldset[^>]*disabled/);
  assert.match(html, /checked=""[^>]*value="b"|value="b"[^>]*checked=""/);
  const pair = renderToStaticMarkup(React.createElement(DocsControlContext.Provider, { value: true },
    React.createElement(exports.DocsSelect, props), React.createElement(exports.DocsSelect, props)));
  const names = [...pair.matchAll(/<input[^>]*name="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(names).size, 2);
});

test('both shared and legacy property panels provide the shared control policy', () => {
  for (const file of ['ComponentPlayground.tsx', 'PropertyTabs.tsx']) {
    const source = readFileSync(new URL(`../../src/components/${file}`, import.meta.url), 'utf8');
    assert.match(source, /DocsControlContext\.Provider value=\{true\}/);
  }
});
