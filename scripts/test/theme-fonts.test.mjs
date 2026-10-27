import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

function load(name, dependencies = {}) {
  const source = readFileSync(new URL('../../src/components/' + name + '.ts', import.meta.url), 'utf8')
    .replaceAll('import.meta.env.BASE_URL', '"/"');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  new Function('exports', 'require', output)(exports, id => dependencies[id]);
  return exports;
}
const controls = load('themeControls');
const colors = load('themeColors');
const { themeFonts, defaultThemeSettings, readThemeSettings, changeThemeFont, fontLanguages, fontSpecimen, orderedThemeFonts, fontMatchesQuery } = load('themeFonts', { './themeControls': controls, './themeColors': colors });

test('all fonts ship licensed assets and individually bounded material presets', () => {
  assert.equal(themeFonts.length, 29);
  assert.equal(new Set(themeFonts.map(font => JSON.stringify(font.preset))).size, 29);
  assert.deepEqual(themeFonts[0].preset, { variation: .1, breaks: .31, outline: .44, fill: .85, grain: .4 });
  assert.equal(defaultThemeSettings.font, 'xiaolai');
  assert.equal(defaultThemeSettings.textEffect, true);
  for (const [key, value] of Object.entries(themeFonts[0].preset)) assert.equal(defaultThemeSettings.render[key], value, 'global and per-font reset share the same Xiaolai defaults');
  for (const font of themeFonts) {
    for (const control of controls.themeRenderControls.filter(control => control.group === 'text')) {
      assert(font.preset[control.key] >= control.min && font.preset[control.key] <= control.max);
    }
    if (font.file) {
      assert(existsSync(new URL('../../public/fonts/theme/' + font.file + '.woff2', import.meta.url)));
      assert.match(readFileSync(new URL('../../public/fonts/theme/' + font.file + '-OFL.txt', import.meta.url), 'utf8'), /SIL OPEN FONT LICENSE/i);
    }
  }
});

test('switching preserves each font independently and leaves lines and colors unchanged', () => {
  const original = { ...defaultThemeSettings, palette: 'blue', render: { ...defaultThemeSettings.render, grain: .42, width: 2.6 } };
  let switched = changeThemeFont(original, 'marker');
  assert.equal(switched.render.grain, .3);
  switched = { ...switched, render: { ...switched.render, outline: .31 } };
  const restored = changeThemeFont(switched, 'xiaolai');
  assert.equal(restored.render.grain, .42);
  assert.equal(restored.render.width, 2.6);
  assert.equal(restored.palette, 'blue');
  const reloaded = readThemeSettings(JSON.parse(JSON.stringify(restored)));
  assert.equal(changeThemeFont(reloaded, 'marker').render.outline, .31);
  assert.deepEqual(defaultThemeSettings.fonts, {}, 'defaults must never be mutated');
});

test('legacy settings retain their font; malformed and out-of-range values recover safely', () => {
  assert.equal(readThemeSettings({ font: 'xiaolai' }).textEffect, true);
  assert.equal(readThemeSettings({ font: 'xiaolai', textEffect: 'false' }).textEffect, true);
  const plain = readThemeSettings({ font: 'xiaolai', textEffect: false, render: { outline: .31 } });
  assert.equal(changeThemeFont(plain, 'marker').textEffect, false);
  assert.equal(changeThemeFont(changeThemeFont(plain, 'marker'), 'xiaolai').render.outline, .31);
  assert.equal(readThemeSettings(null).font, 'xiaolai');
  const previousPreset = { variation: .2, breaks: .8, outline: .65, fill: .8, grain: .5 };
  const savedXiaolai = readThemeSettings({ font: 'xiaolai', render: previousPreset, fonts: { xiaolai: previousPreset } });
  const revisitedXiaolai = changeThemeFont(changeThemeFont(savedXiaolai, 'marker'), 'xiaolai');
  for (const [key, value] of Object.entries(previousPreset)) assert.equal(revisitedXiaolai.render[key], value, 'a new default must not overwrite a saved Xiaolai preset');
  const legacy = readThemeSettings({ palette: 'blue', render: { outline: .7, breaks: .4 } });
  assert.equal(legacy.font, 'yozai');
  assert.equal(legacy.render.outline, .7);
  assert.equal(legacy.render.grain, .2);
  const malformed = readThemeSettings({ font: 'unknown', render: { breaks: 10, grain: NaN, fill: 'no' }, fonts: { marker: { outline: -10 } } });
  assert.equal(malformed.font, 'xiaolai');
  assert.equal(malformed.render.breaks, 1);
  assert.equal(malformed.render.grain, .4);
  assert.equal(malformed.render.fill, .85);
  assert.equal(changeThemeFont(malformed, 'marker').render.outline, .2);
});


test('language ordering prioritizes suitable handwriting without mutating saved settings', () => {
  const ids = themeFonts.map(font => font.id);
  const saved = readThemeSettings({ font: 'marker', render: { outline: .31 } });
  const snapshot = JSON.stringify(saved);
  for (const [locale, first] of [['zh-CN', 'xiaolai'], ['en', 'caveat'], ['fr-CA', 'caveat'], ['ja-JP', 'yomogi'], ['ko', 'gaegu']]) {
    const ordered = orderedThemeFonts(locale);
    assert.equal(ordered[0].id, first);
    assert.equal(ordered.length, 29);
    assert.deepEqual(new Set(ordered.map(font => font.id)), new Set(ids));
  }
  for (const [locale, query, nativeIds] of [
    ['ja', '日语', ['yomogi', 'kleeone', 'yujisyuku', 'yujimai', 'hachimarupop']],
    ['ko', '韩语', ['gaegu', 'nanumpen', 'nanumbrush', 'himelody', 'singleday']],
  ]) {
    assert.deepEqual(new Set(orderedThemeFonts(locale).slice(0, 5).map(font => font.id)), new Set(nativeIds));
    assert.deepEqual(new Set(orderedThemeFonts('zh-CN', query).slice(0, 5).map(font => font.id)), new Set(nativeIds), 'native-script fonts precede supplemental glyph coverage');
    for (const id of nativeIds) {
      assert.equal(fontSpecimen(id, 'zh-CN').lang, locale, 'native specimens do not pretend to support Chinese');
      assert(fontMatchesQuery(id, query, 'zh-CN'));
    }
  }
  assert.equal(orderedThemeFonts('zh-CN', '法语')[0].id, 'caveat', 'language search recommends native handwriting before supplemental coverage');
  assert.deepEqual(themeFonts.map(font => font.id), ids, 'locale sorting does not reorder the source catalog');
  assert.equal(JSON.stringify(saved), snapshot, 'browsing another language never edits the selected font');
  assert(fontLanguages('xiaolai').includes('ko'));
  assert(!fontLanguages('marker').includes('ko'));
  assert(!fontLanguages('chenyu').includes('fr'), 'a few accents are not complete coverage of the French sample');
  assert(!fontLanguages('caveat').includes('zh'));
});

test('specimens retain their actual language and language search ignores accents', () => {
  for (const [id, locale, lang, text] of [
    ['caveat', 'en', 'en', 'A little inspiration'],
    ['caveat', 'fr-CA', 'fr', 'Écrire en liberté'],
    ['yomogi', 'ja-JP', 'ja', '小さなひらめき'],
    ['gaegu', 'ko', 'ko', '작은 영감'],
    ['xiaolai', 'ko', 'ko', '작은 영감'],
    ['caveat', 'zh-CN', 'en', 'A little inspiration'],
    ['chenyu', 'fr', 'zh-Hant', '山水之間，自在遠行。'],
  ]) {
    const specimen = fontSpecimen(id, locale);
    assert.equal(specimen.lang, lang);
    assert.equal(specimen.title, text);
    assert(specimen.card.includes('\n'), 'compact cards deliberately wrap at a phrase boundary');
    assert.equal(specimen.body.normalize('NFC'), specimen.body);
  }
  for (const query of ['français', 'FRANCAIS', 'français', '法语']) {
    assert(fontMatchesQuery('caveat', query, 'fr'));
    assert(!fontMatchesQuery('yozai', query, 'fr'));
  }
  assert(fontMatchesQuery('gaegu', 'coreen', 'en'));
  assert(fontMatchesQuery('yomogi', '日本語', 'zh-CN'));
  assert(fontMatchesQuery('patrickhand', '  PATRICK HAND ', 'en'));
});

test('cached Unicode-range fonts still wait for the actual new script sample', async () => {
  const previousDocument = globalThis.document;
  const requests = [];
  let releaseKorean;
  const korean = new Promise(resolve => { releaseKorean = resolve; });
  globalThis.document = { fonts: { load: async (family, sample) => {
    requests.push({ family, sample });
    if (sample === '작은 영감') await korean;
    return [{}];
  } } };
  try {
    const { loadThemeFont } = load('themeFonts', { './themeControls': controls, './themeColors': colors });
    await loadThemeFont('xiaolai', '山水之间');
    let ready = false;
    const pending = loadThemeFont('xiaolai', '작은 영감').then(() => { ready = true; });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(ready, false, 'a cached base font cannot bypass the extended-script request');
    assert.equal(requests.at(-1).sample, '작은 영감');
    releaseKorean();
    await pending;
    assert.equal(ready, true);
    assert.equal(requests.filter(request => request.sample === '一页灵感').length, 1);
  } finally {
    releaseKorean();
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});


test('theme settings preserve and sanitize saved colors without losing font settings', () => {
  const saved = readThemeSettings({ ...defaultThemeSettings, palette: 'custom:#aabbcc', customColors: ['#abc', '#aabbcc', 'invalid', '#112233ff'], font: 'yozai' });
  assert.equal(saved.palette, 'custom:#aabbcc');
  assert.deepEqual(saved.customColors, ['#aabbcc', '#112233']);
  assert.equal(saved.font, 'yozai');
  assert.deepEqual(readThemeSettings({ font: 'yozai' }).customColors, []);
});
