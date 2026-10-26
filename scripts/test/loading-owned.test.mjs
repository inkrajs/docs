import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const examplesUrl = new URL('../../src/components/LoadingExamples.tsx', import.meta.url);
const stylesUrl = new URL('../../src/components/LoadingExamples.css', import.meta.url);
const copyUrl = new URL('../../src/components/loadingCopy.ts', import.meta.url);
const apiUrl = new URL('../../src/components/loadingApi.ts', import.meta.url);
const browserUrl = new URL('../verify-loading.mjs', import.meta.url);
const apiModule = await import(apiUrl.href);

test('Loading documentation demonstrates all carriers and shared presets', async () => {
  const [examples, styles] = await Promise.all([readFile(examplesUrl, 'utf8'), readFile(stylesUrl, 'utf8')]);
  for (const mode of ['inline', 'region', 'fullscreen']) assert.match(examples, new RegExp(`['\"]${mode}['\"]`));
  for (const preset of ['brand-center', 'scene-bottom', 'intel', 'staged', 'edge', 'skeleton']) assert.match(examples, new RegExp(preset));
  assert.match(examples, /ComponentPlayground/);
  assert.match(examples, /data-loading-preset/);
  assert.match(examples, /presets\.map\(item => <Loading/);
  assert.match(examples, /mode="region"/);
  assert.match(examples, /data-open-loading-preset/);
  assert.match(examples, /maximizeIcon/);
  assert.doesNotMatch(examples, /\['inline', 'Inline'\]/);
  assert.equal((examples.match(/\{ preset: '[^']+', label: copy\.preset/g) ?? []).length, 6);
  for (const animation of ['progress', 'orbit', 'dots', 'pulse', 'trail']) {
    assert.match(examples, new RegExp(`animation: '${animation}'`));
  }
  assert.doesNotMatch(examples, /skeleton=\{/);
  assert.doesNotMatch(examples, /loading-demo-skeleton-note/);
  assert.doesNotMatch(styles, /loading-preset-preview[^}]*box-shadow/s);
});

test('the simulated async example is explicitly honest in source and visible copy', async () => {
  const [examples, copy] = await Promise.all([readFile(examplesUrl, 'utf8'), readFile(copyUrl, 'utf8')]);
  assert.match(examples, /Demo only: this timer does not represent a network or map resource/);
  assert.match(copy, /does not load a real map, network request, or game asset/);
  assert.match(copy, /不加载真实地图、网络请求或游戏资源/);
});

test('Loading starts with an indeterminate indicator and optional content disabled', async () => {
  const examples = await readFile(examplesUrl, 'utf8');
  for (const name of ['showLogo', 'showBackground', 'showTips', 'showTipControls']) {
    assert.match(examples, new RegExp(`const \\[${name}, [^\\]]+\\] = useState\\(false\\)`));
  }
  assert.match(examples, /useState<'determinate' \| 'indeterminate' \| 'none'>\('indeterminate'\)/);
  assert.match(examples, /tips=\{showTips \?/);
  assert.match(examples, /showTipControls=\{showTips && showTipControls\}/);
  assert.match(examples, /useState<LoadingAnimation>\('progress'\)/);
  assert.doesNotMatch(examples, /loading-scene__traveler/);
  assert.match(examples, /'bottom-start': <Button[^\n]+data-character/);
});

test('documentation copy and API data cover every explicit Loading prop', async () => {
  const [copy, api] = await Promise.all([readFile(copyUrl, 'utf8'), readFile(apiUrl, 'utf8')]);
  for (const locale of ['en:', "'zh-CN':", 'ja:', 'ko:', 'fr:']) assert.match(copy, new RegExp(locale.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  for (const key of [
    'modeInline', 'modeRegion', 'modeFullscreen',
    'presetBrandCenter', 'presetSceneBottom', 'presetIntel', 'presetStaged', 'presetEdge', 'presetSkeleton',
    'animation', 'animationProgress', 'animationOrbit', 'animationDots', 'animationPulse', 'animationTrail',
    'fullscreenPreview',
  ]) assert.equal((copy.match(new RegExp(`${key}:`, 'g')) ?? []).length, 6, `${key} has five localized values`);
  assert.match(api, /getLoadingApiGroups\(locale: string\): ApiGroup\[\]/);
  assert.deepEqual(apiModule.loadingApi.map(row => row.name), [
    'active', 'mode', 'preset', 'animation', 'status', 'blocking', 'lockScroll', 'delay', 'minDuration',
    'logo', 'title', 'description', 'background', 'skeleton', 'children', 'slots',
    'progress', 'max', 'progressLabel', 'stages', 'activeStage', 'tips', 'tipOrder',
    'tipInterval', 'tipAutoPlay', 'tipPaused', 'defaultTipPaused', 'onTipPausedChange',
    'tipIndex', 'defaultTipIndex', 'onTipIndexChange', 'tipTransition', 'showTipControls',
    'labels', 'onCancel', 'onRetry', 'onContinue', 'native div props / ref',
  ]);
  assert.equal(apiModule.loadingApi.length, 38);
  const animation = apiModule.loadingApi.find(row => row.name === 'animation');
  assert.deepEqual(animation, {
    name: 'animation',
    type: "'progress' | 'orbit' | 'dots' | 'pulse' | 'trail'",
    defaultValue: "'progress'",
    descriptionKey: 'animation',
  });
});

test('Loading API groups emit complete five-language localized ApiRows', () => {
  const englishKeys = Object.keys(apiModule.loadingApiCopy.en).sort();
  assert(englishKeys.length >= 40);
  for (const locale of ['en', 'zh-CN', 'ja', 'ko', 'fr']) {
    assert.deepEqual(Object.keys(apiModule.loadingApiCopy[locale]).sort(), englishKeys, `${locale} copy keys`);
    const groups = apiModule.getLoadingApiGroups(locale);
    assert.deepEqual(groups.map(group => group.title), ['Loading', 'LoadingStage', 'LoadingLabels']);
    assert.equal(groups[0].rows.length, apiModule.loadingApi.length);
    for (const group of groups) for (const row of group.rows) {
      assert.equal(row.length, 5, `${locale}:${group.title}:${row[0]}`);
      assert.equal(row[3], row[4], `${locale}:${group.title}:${row[0]} prelocalized descriptions`);
      assert.ok(row[3].trim(), `${locale}:${group.title}:${row[0]} description`);
    }
  }
  assert.notEqual(apiModule.getLoadingApiGroups('ja')[0].rows[0][3], apiModule.getLoadingApiGroups('en')[0].rows[0][3]);
  assert.equal(apiModule.resolveLoadingApiLocale('fr-CA'), 'fr');
  assert.equal(apiModule.resolveLoadingApiLocale('zh-Hant'), 'zh-CN');
});

test('browser check covers focus isolation, non-blocking edge, tip controls and responsive widths', async () => {
  const browser = await readFile(browserUrl, 'utf8');
  assert.match(browser, /1305/);
  assert.match(browser, /390/);
  assert.match(browser, /aria-modal/);
  assert.match(browser, /pointerEvents/);
  assert.match(browser, /Next tip/);
  assert.match(browser, /reducedMotion: 'reduce'/);
  assert.match(browser, /inkra-loading__animation/);
  assert.match(browser, /getImageData/);
  assert.match(browser, /did not animate transform or opacity/);
  assert.match(browser, /品牌居中/);
  assert.match(browser, /window\.scrollTo\(\{/);
  assert.doesNotMatch(browser, /sceneExample\.locator\('\[data-loading-preset=/);
});
