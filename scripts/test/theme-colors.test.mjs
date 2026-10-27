import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const source = readFileSync(new URL('../../src/components/themeColors.ts', import.meta.url), 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const colors = {};
new Function('exports', output)(colors);
const { themeScales, darkScales, normalizeThemeColor, customPaletteId, sanitizeCustomColors, rememberCustomColor, paletteTokens } = colors;

const luminance = hex => [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255)
  .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
  .reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);

const composite = (foreground, background, opacity) => '#' + [1, 3, 5].map(index => Math.round(parseInt(foreground.slice(index, index + 2), 16) * opacity + parseInt(background.slice(index, index + 2), 16) * (1 - opacity)).toString(16).padStart(2, '0')).join('');

test('traditional purple, ochre orange, and yellow extend the existing palettes with light/dark scales', () => {
  assert.deepEqual(themeScales.map(scale => scale.id), ['ink', 'ocean', 'red', 'green', 'purple', 'orange', 'yellow']);
  for (const palette of themeScales) {
    assert.equal(palette.values.length, 11);
    assert.equal(darkScales[palette.id].length, 11);
    for (const theme of ['light', 'dark']) {
      const tokens = paletteTokens(palette.id, theme);
      for (const [background, foreground] of [['accent', 'on-accent'], ['selection-pigment', 'selection-foreground']]) {
        const paper = theme === 'light' ? '#f4f0e3' : '#191d1e';
        const surface = composite(tokens[`--inkra-${background}`], paper, theme === 'light' ? .15 : .09);
        assert.ok(contrast(surface, tokens[`--inkra-${foreground}`]) >= 4.5, `${palette.id}/${theme}/${background} wash contrast`);
      }
    }
  }
});

test('stored colors accept only opaque normalized hex values and reject CSS injection', () => {
  assert.equal(normalizeThemeColor(' #AbC '), '#aabbcc');
  assert.equal(normalizeThemeColor('#AABBCCff'), '#aabbcc');
  for (const value of ['red', '#aabbcc00', '#abcd', '#12', 'var(--inkra-ink)', '#ffffff; color:red', {}, null]) assert.equal(normalizeThemeColor(value), null);
  assert.equal(customPaletteId('#ABC'), 'custom:#aabbcc');
  assert.equal(customPaletteId('invalid'), 'default');
  assert.deepEqual(paletteTokens('custom:invalid', 'light'), {});
  assert.deepEqual(paletteTokens('default', 'dark'), {});
});

test('custom history is bounded, deduplicated and reordered only when explicitly remembered', () => {
  const history = ['#fff', '#ffffff', '#ABC', null, 'invalid', '#abcfff00'];
  assert.deepEqual(sanitizeCustomColors(history), ['#ffffff', '#aabbcc']);
  assert.deepEqual(rememberCustomColor(history, '#ABC'), ['#aabbcc', '#ffffff']);
  assert.equal(history.length, 6, 'read/save helpers do not mutate the draft or saved list');
  const many = Array.from({ length: 20 }, (_, index) => '#' + index.toString(16).padStart(6, '0'));
  assert.equal(rememberCustomColor(many, '#ffffff').length, 12);
  assert.equal(rememberCustomColor(many, '#ffffff')[0], '#ffffff');
});

test('custom black, white, primaries and arbitrary colors have readable paired foregrounds in both themes', () => {
  for (let r = 0; r <= 255; r += 51) for (let g = 0; g <= 255; g += 51) for (let b = 0; b <= 255; b += 51) {
    const hex = '#' + [r, g, b].map(channel => channel.toString(16).padStart(2, '0')).join('');
    for (const theme of ['light', 'dark']) {
      const tokens = paletteTokens(customPaletteId(hex), theme);
      for (const [background, foreground] of [['accent', 'on-accent'], ['selection-pigment', 'selection-foreground']]) {
        assert.ok(contrast(tokens[`--inkra-${background}`], tokens[`--inkra-${foreground}`]) >= 4.5, `${hex}/${theme}/${background}`);
      }
      assert.ok(contrast(tokens['--inkra-accent-strong'], theme === 'light' ? '#f4f0e3' : '#191d1e') >= 4.5, `${hex}/${theme}/accent-strong`);
    }
  }
});


test('custom lightness remains observable for neutral colors and darker shades of one hue', () => {
  for (const theme of ['light', 'dark']) {
    const neutralAccents = ['#000000', '#808080', '#ffffff'].map(hex => paletteTokens(customPaletteId(hex), theme)['--inkra-accent']);
    assert.equal(new Set(neutralAccents).size, 3, `${theme}: black, gray and white must not collapse`);
    assert.ok(luminance(neutralAccents[0]) < luminance(neutralAccents[1]));
    assert.ok(luminance(neutralAccents[1]) < luminance(neutralAccents[2]));
    const redAccents = ['#660000', '#ff0000', '#ff9999'].map(hex => paletteTokens(customPaletteId(hex), theme)['--inkra-accent']);
    assert.equal(new Set(redAccents).size, 3, `${theme}: same hue and saturation at different lightness`);
    assert.ok(luminance(redAccents[0]) < luminance(redAccents[1]));
    assert.ok(luminance(redAccents[1]) < luminance(redAccents[2]));
  }
});
