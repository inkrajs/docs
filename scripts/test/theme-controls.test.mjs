import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('../../src/components/themeControls.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
new Function('exports', compiled)(exports);
const { themeRenderControls, defaultThemeRender, themeRenderTokens } = exports;

test('theme docs and customizer share complete, bounded rendering controls', () => {
  assert.equal(themeRenderControls.length, 11);
  assert.equal(new Set(themeRenderControls.map(control => control.token)).size, 11);
  for (const control of themeRenderControls) {
    assert(control.min <= control.value && control.value <= control.max);
    assert(control.step > 0 && control.zh && control.en);
    assert.equal(defaultThemeRender[control.key], control.value);
  }
  for (const name of ['ThemeCustomizer.tsx', 'ThemeExamples.tsx']) {
    assert.match(readFileSync(new URL('../../src/components/' + name, import.meta.url), 'utf8'), /from '\.\/themeControls'/);
  }
});

test('provider sample serializes lengths, angles and unitless material settings correctly', () => {
  const tokens = themeRenderTokens(defaultThemeRender);
  assert.equal(tokens['--inkra-stroke-width'], '2px');
  assert.equal(tokens['--inkra-stroke-amplitude'], '1.5px');
  assert.equal(tokens['--inkra-wash-spacing'], '2px');
  assert.equal(tokens['--inkra-wash-angle'], '-45deg');
  assert.equal(tokens['--inkra-letter-outline'], '0.9');
  assert.equal(themeRenderTokens({ ...defaultThemeRender, washStrength: 0 })['--inkra-wash-strength'], '0');
});

test('provider examples share the component playground without redundant section headings', () => {
  for (const name of ['InternationalizationExamples.tsx', 'ThemeExamples.tsx']) {
    const source = readFileSync(new URL('../../src/components/' + name, import.meta.url), 'utf8');
    assert.match(source, /<ComponentPlayground code=\{code\} controls=/);
    assert.doesNotMatch(source, /<PencilText as="h2">(?:ThemeProvider|语言与自定义字典)<\/PencilText>/);
  }
});
