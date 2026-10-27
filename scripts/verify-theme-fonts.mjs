import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const errors = [];
const context = await browser.newContext({ viewport: { width: 1305, height: 954 }, reducedMotion: 'reduce' });
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
const requestedFonts = [];
page.on('request', request => { if (request.url().includes('/fonts/theme/')) requestedFonts.push(request.url()); });
const dialog = page.getByRole('dialog');
const preview = dialog.locator('.theme-customizer__preview-card');
async function open() {
  await page.locator('.header-customize').click();
  await dialog.getByRole('tab', { name: '文字', exact: true }).click();
}
async function choose(name) {
  await dialog.getByRole('searchbox', { name: '搜索字体', exact: true }).fill(name);
  await dialog.getByRole('radio', { name, exact: true }).click();
  await page.waitForFunction(name => [...document.querySelectorAll('.font-picker input[type="radio"]')].some(input => input.getAttribute('aria-label') === name && input.checked), name);
  await page.waitForFunction(() => document.querySelector('.theme-customizer__lettering')?.hasAttribute('data-pencil-ready'));
}
const controlsOnly = process.argv.includes('--controls-only');
const readOutline = () => dialog.getByRole('slider', { name: '轮廓浓度', exact: true }).getAttribute('aria-valuenow');
const newFontCases = [
  ['kleeone', 'Klee One', 'KleeOne', 'ja'],
  ['yujisyuku', 'Yuji Syuku', 'YujiSyuku', 'ja'],
  ['yujimai', 'Yuji Mai', 'YujiMai', 'ja'],
  ['hachimarupop', 'Hachi Maru Pop', 'HachiMaruPop', 'ja'],
  ['nanumpen', 'Nanum Pen Script', 'NanumPen', 'ko'],
  ['nanumbrush', 'Nanum Brush Script', 'NanumBrush', 'ko'],
  ['himelody', 'Hi Melody', 'HiMelody', 'ko'],
  ['singleday', 'Single Day', 'SingleDay', 'ko'],
];
async function verifyNewFonts() {
  await page.goto(base + '/docs/design-standard');
  await open();
  assert.equal(await dialog.getByRole('radio').count(), 29);
  const saved = await page.evaluate(() => localStorage.getItem('inkra-docs-custom-theme-v2'));
  const globalStyle = await page.locator('html').getAttribute('style');
  assert(!requestedFonts.some(url => newFontCases.some(([, , file]) => url.endsWith('/' + file + '.woff2'))), 'new offscreen fonts are not eagerly downloaded');
  for (const [id, , file, lang] of newFontCases) {
    assert(!requestedFonts.some(url => url.endsWith('/' + file + '.woff2')), id + ' waits until it is requested');
    await dialog.getByRole('searchbox', { name: '搜索字体', exact: true }).fill(id);
    const option = dialog.locator(`.font-picker__option[data-font-id="${id}"]`);
    await option.locator('input').click();
    await page.waitForFunction(id => document.querySelector(`.font-picker input[type="radio"][value="${id}"]`)?.checked, id);
    await page.waitForFunction(id => document.querySelector(`.font-picker__option[data-font-id="${id}"]`)?.dataset.fontState === 'ready', id);
    const sample = option.locator('.font-picker__specimen');
    assert.equal(await sample.getAttribute('lang'), lang, id + ' uses its native-script sample even in Chinese UI');
    const lettering = preview.locator('.theme-customizer__lettering');
    assert.equal(await lettering.getAttribute('lang'), lang);
    assert.equal(await lettering.textContent(), lang === 'ja' ? 'テーマプレビュー' : '테마 미리보기');
    await lettering.locator('canvas').waitFor();
    const family = 'Inkra ' + file;
    assert(await lettering.evaluate((node, family) => {
      const canvas = node.querySelector('canvas');
      return getComputedStyle(node).fontFamily.startsWith('"' + family + '"')
        && [...document.fonts].some(font => font.family.replaceAll('"', '') === family && font.status === 'loaded')
        && canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0);
    }, family), id + ' paints the loaded font');
    assert.equal(requestedFonts.filter(url => url.endsWith('/' + file + '.woff2')).length, 1, 'font requests are deduplicated');
    assert.equal(await page.locator('html').getAttribute('style'), globalStyle, 'font selection remains a local draft');
    assert.equal(await page.evaluate(() => localStorage.getItem('inkra-docs-custom-theme-v2')), saved);
    await preview.screenshot({ path: '/tmp/inkra-new-font-' + id + '.png' });
  }
  const galleryPage = await context.newPage();
  galleryPage.on('pageerror', error => errors.push(error.message));
  try {
    await galleryPage.goto(base + '/docs/design-standard');
    await galleryPage.getByRole('tab', { name: '字体', exact: true }).click();
    const gallery = galleryPage.locator('.font-gallery');
    for (const [id, , , lang] of newFontCases) {
      await gallery.getByRole('searchbox').fill(id);
      const item = gallery.locator(`[data-font-id="${id}"][data-font-state="ready"]`);
      await item.waitFor();
      assert.equal(await item.locator('.font-gallery__sample').getAttribute('lang'), lang);
      await item.locator('.font-gallery__title canvas').waitFor();
      await item.locator('.font-gallery__body canvas').waitFor();
      await item.screenshot({ path: '/tmp/inkra-new-gallery-' + id + '.png' });
    }
  } finally {
    await galleryPage.close();
  }
  assert.deepEqual(errors, []);
}
try {
  if (process.argv.includes('--new-fonts-only')) {
    await verifyNewFonts();
    console.log('Eight added Japanese/Korean fonts: native samples, actual font loading and canvas paint, lazy deduplicated requests, unchanged global theme and saved settings passed.');
  } else {
  await page.goto(base + '/docs/design-standard');
  await page.evaluate(() => document.fonts.ready);
  await open();
  assert(requestedFonts.length < 4, 'only visible font rows may load initially');
  assert.equal(await dialog.getByRole('combobox').count(), 0, 'font choices are always visible, without a dropdown');
  const fontSearch = dialog.getByRole('searchbox', { name: '搜索字体', exact: true });
  const initialPreviewFont = await preview.evaluate(node => node.style.getPropertyValue('--inkra-font-hand'));
  const fontRegionGeometry = () => dialog.evaluate(node => {
    const list = node.querySelector('.font-picker__list').getBoundingClientRect();
    const controls = node.querySelector('.theme-customizer__controls').getBoundingClientRect();
    return { height: list.height, controlsOffset: controls.top - list.top };
  });
  const populatedGeometry = await fontRegionGeometry();
  await fontSearch.fill('没有这样的字体');
  assert.equal(await dialog.getByRole('radio').count(), 0);
  assert(await dialog.getByText('没有匹配的字体', { exact: true }).isVisible());
  assert.deepEqual(await fontRegionGeometry(), populatedGeometry, 'empty font results preserve list height and parameter position');
  assert.equal(await preview.evaluate(node => node.style.getPropertyValue('--inkra-font-hand')), initialPreviewFont, 'search does not change the selected preview font');
  await fontSearch.fill('');
  assert(await dialog.getByRole('radio', { name: '小赖字体', exact: true }).isChecked(), 'clearing search preserves selection');
  assert.deepEqual(await fontRegionGeometry(), populatedGeometry, 'restoring font results does not shift parameters');
  await dialog.getByRole('radio', { name: '小赖字体', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => document.querySelector('.font-picker input[aria-label="悠哉"]')?.checked);
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => document.querySelector('.font-picker input[aria-label="霞鹜漫黑"]')?.checked);
  assert(await dialog.getByRole('radio', { name: '霞鹜漫黑', exact: true }).evaluate(node => node === document.activeElement), 'native radio navigation retains keyboard focus');
  await choose('小赖字体');
  await fontSearch.fill('');
  const divider = dialog.locator('.theme-customizer__tabs-divider');
  assert(await divider.isVisible(), 'tabs have a fixed lower divider outside the scrolling content');
  const dividerBox = await divider.boundingBox();
  assert(dividerBox.width > 100 && dividerBox.height > 0, 'tab divider has visible dimensions');
  assert.equal(await readOutline(), '0.44');
  assert.equal(await dialog.getByRole('slider', { name: '断笔程度' }).getAttribute('aria-valuenow'), '0.31');
  const lettering = preview.locator('.theme-customizer__lettering');
  await lettering.locator('canvas').waitFor({ state: 'visible' });
  const fontBefore = await lettering.evaluate(node => ({ family: getComputedStyle(node).fontFamily, width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height }));
  await dialog.getByRole('switch', { name: '彩铅效果', exact: true }).click();
  await lettering.locator('canvas').waitFor({ state: 'hidden' });
  const plain = await lettering.evaluate(node => ({
    family: getComputedStyle(node).fontFamily, width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height,
    color: getComputedStyle(node.querySelector('.inkra-pencil-text__source')).color,
    text: node.textContent,
  }));
  assert.equal(plain.family, fontBefore.family);
  assert.equal(plain.width, fontBefore.width);
  assert.equal(plain.height, fontBefore.height);
  assert.notEqual(plain.color, 'rgba(0, 0, 0, 0)');
  assert.equal(plain.text, '主题预览');
  assert.equal(await dialog.getByRole('slider').count(), 5, 'text controls keep their positions when effects are disabled');
  assert(await dialog.getByRole('slider').evaluateAll(nodes => nodes.every(node => node.getAttribute('aria-disabled') === 'true')), 'text controls are disabled without losing parameters');
  assert(await page.locator('.page-heading h1').getAttribute('data-pencil-ready'), 'draft plain mode stays local');
  assert(await preview.locator('.theme-customizer__line').isVisible(), 'line decorations remain');
  await dialog.getByRole('button', { name: '保存', exact: true }).click();
  await page.waitForFunction(() => document.documentElement.style.getPropertyValue('--inkra-letter-effect') === '0');
  await page.reload();
  await open();
  assert.equal(await dialog.getByRole('switch', { name: '彩铅效果', exact: true }).isChecked(), false);
  await page.waitForFunction(() => !document.querySelector('.page-heading h1').hasAttribute('data-pencil-ready'));
  await dialog.getByRole('switch', { name: '彩铅效果', exact: true }).click();
  await lettering.locator('canvas').waitFor({ state: 'visible' });
  assert.equal(await readOutline(), '0.44', 're-enabling restores the previous parameters');
  await dialog.getByRole('button', { name: '保存', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.page-heading h1').hasAttribute('data-pencil-ready'));
  await open();
  const globalBefore = await page.locator('html').getAttribute('style');
  const slider = dialog.getByRole('slider', { name: '轮廓浓度' });
  await slider.scrollIntoViewIfNeeded();
  const sliderBox = await slider.boundingBox();
  const thumbBox = await slider.locator('.inkra-circular-slider__thumb').boundingBox();
  const center = { x: sliderBox.x + sliderBox.width / 2, y: sliderBox.y + sliderBox.height / 2 };
  const thumb = { x: thumbBox.x + thumbBox.width / 2, y: thumbBox.y + thumbBox.height / 2 };
  const radius = Math.hypot(thumb.x - center.x, thumb.y - center.y);
  const startAngle = Math.atan2(thumb.y - center.y, thumb.x - center.x);
  await page.mouse.move(thumb.x, thumb.y);
  await page.mouse.down();
  for (let step = 1; step <= 30; step++) {
    const angle = startAngle + Math.PI / 3 * step / 30;
    await page.mouse.move(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius);
  }
  assert.notEqual(await readOutline(), '0.44', 'circular dragging updates the draft value');
  assert.equal(await preview.evaluate(node => node.style.getPropertyValue('--inkra-letter-outline')), '0.44', 'drag does not repaint the font preview');
  await page.mouse.up();
  await page.waitForFunction(() => document.querySelector('.theme-customizer__preview-card').style.getPropertyValue('--inkra-letter-outline') !== '0.44');
  const customOutline = await readOutline();
  await choose('霞鹜漫黑');
  assert.equal(await readOutline(), '0.45');
  await slider.press('Home');
  await choose('小赖字体');
  assert.equal(await readOutline(), customOutline, 'switching restores edited Xiaolai settings');
  await choose('霞鹜漫黑');
  assert.equal(await readOutline(), '0.2', 'other font keeps its independent edit');
  assert.equal(await page.locator('html').getAttribute('style'), globalBefore, 'drafts do not change the site');
  await dialog.getByRole('button', { name: '保存', exact: true }).click();
  await page.reload();
  await open();
  assert.equal(await readOutline(), '0.2', 'save survives reload');
  await choose('小赖字体');
  assert.equal(await readOutline(), customOutline, 'other font edit also survives reload');
  await dialog.getByRole('button', { name: '恢复此字体参数', exact: true }).click();
  assert.equal(await readOutline(), '0.44');
  await choose('霞鹜漫黑');
  assert.equal(await readOutline(), '0.2', 'per-font reset does not reset another font');

  const fonts = [
    ['小赖字体', 'Inkra Xiaolai'], ['悠哉', 'Trip Map Hand'],
    ['霞鹜漫黑', 'Inkra Marker'], ['辰宇落雁（繁体）', 'Inkra Chenyu'],
    ['马善政楷书', 'Inkra Brush'], ['龙藏体', 'Inkra LongCang'],
    ['志莽行书', 'Inkra ZhiMangXing'], ['刘建毛草', 'Inkra LiuJianMaoCao'],
    ['霞鹜文楷 TC', 'Inkra WenKai'], ['芫荽（繁体）', 'Inkra Iansui'],
    ['粉圆（繁体）', 'Inkra Huninn'], ['站酷快乐体', 'Inkra KuaiLe'],
    ['站酷庆科黄油体', 'Inkra HuangYou'], ['思源宋体', 'Inkra NotoSerif'], ['思源黑体', 'Inkra NotoSans'],
    ['Caveat', 'Inkra Caveat'], ['Patrick Hand', 'Inkra PatrickHand'], ['Kalam', 'Inkra Kalam'],
    ['Handlee', 'Inkra Handlee'], ['Yomogi', 'Inkra Yomogi'], ['Gaegu', 'Inkra Gaegu'],
    ...newFontCases.map(([, name, file]) => [name, 'Inkra ' + file]),
  ];
  for (const [index, [name, family]] of (controlsOnly ? [] : fonts).entries()) {
    await choose(name);
    await page.waitForTimeout(120);
    const state = await preview.evaluate((node, family) => {
      const label = node.querySelector('.theme-customizer__lettering');
      const canvas = label.querySelector('canvas');
      return {
        family: getComputedStyle(label).fontFamily,
        source: getComputedStyle(label.querySelector('.inkra-pencil-text__source')).fontFamily,
        ready: label.hasAttribute('data-pencil-ready'),
        loaded: [...document.fonts].some(font => font.family.replaceAll('"', '') === family && font.status === 'loaded'),
        ink: canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some((value, offset) => offset % 4 === 3 && value > 0),
      };
    }, family);
    assert(state.family.startsWith('"' + family + '"'));
    assert.equal(state.source, state.family, 'source measurement and paint use identical fonts');
    assert(state.ready && state.loaded && state.ink, name + ' renders actual loaded glyphs');
    await preview.screenshot({ path: '/tmp/inkra-theme-font-' + index + '.png' });
  }
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  await open();
  assert.equal(await readOutline(), '0.2', 'cancel discards all unsaved font switches');
  for (const [width, height] of [[1305, 954], [390, 700], [320, 640], [800, 500]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(150);
    const panel = dialog.getByRole('tabpanel');
    await panel.evaluate(node => { node.scrollTop = 0; });
    const position = () => dialog.evaluate(node => {
      const y = selector => node.querySelector(selector).getBoundingClientRect().y;
      return { upperDivider: y('.theme-customizer__separator'), lowerDivider: y('.theme-customizer__tabs-divider'), preview: y('.theme-customizer__sample'), tabs: y('.inkra-tabs__list'), footer: y('.inkra-drawer__footer'), body: node.querySelector('.inkra-drawer__body').scrollTop };
    });
    const before = await position();
    await panel.evaluate(node => { node.scrollTop = node.scrollHeight; });
    await page.waitForTimeout(300);
    assert.deepEqual(await position(), before, 'only parameter panel scrolls at ' + width + 'x' + height);
    const dimensions = await panel.evaluate(node => ({ top: node.scrollTop, height: node.clientHeight, scroll: node.scrollHeight }));
    assert(dimensions.height >= 70, 'parameters remain usable in short viewports');
    assert(dimensions.top > 0 || dimensions.scroll <= dimensions.height);
    assert(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth + 1), 'dialog has no horizontal overflow');
    assert(await panel.evaluate(node => node.scrollWidth <= node.clientWidth + 1), 'parameter panel has no horizontal overflow at ' + width + 'x' + height);
    await panel.evaluate(node => { node.scrollTop = 0; });
    const list = dialog.locator('.font-picker__list');
    await list.scrollIntoViewIfNeeded();
    const panelScroll = await panel.evaluate(node => node.scrollTop);
    assert(await list.evaluate(node => node.scrollWidth > node.clientWidth), 'font cards form a horizontal scrolling list');
    assert(await list.evaluate(node => node.scrollHeight <= node.clientHeight + 1), 'font cards have no vertical overflow');
    await list.evaluate(node => { node.scrollLeft = node.scrollWidth; node.scrollTop = node.scrollHeight; });
    assert(await list.evaluate(node => node.scrollLeft > 0), 'font cards can scroll horizontally');
    assert.equal(await list.evaluate(node => node.scrollTop), 0, 'font cards do not scroll vertically');
    assert.equal(await panel.evaluate(node => node.scrollTop), panelScroll, 'font scrolling does not move the parameter panel');
    assert.deepEqual(await position(), before, 'fixed preview remains still while fonts scroll');
    await page.screenshot({ path: '/tmp/inkra-theme-layout-' + width + '.png' });
  }
  assert.deepEqual(errors, []);
  const failureContext = await browser.newContext({ viewport: { width: 1305, height: 954 }, reducedMotion: 'reduce' });
  const failurePage = await failureContext.newPage();
  let failBrush = true;
  await failurePage.route('**/fonts/theme/Brush.woff2', async route => {
    if (failBrush) { failBrush = false; await route.abort(); }
    else await route.continue();
  });
  await failurePage.route('**/fonts/theme/Marker.woff2', async route => {
    await new Promise(resolve => setTimeout(resolve, 1800));
    await route.continue();
  });
  await failurePage.goto(base + '/docs/design-standard');
  await failurePage.locator('.header-customize').click();
  const failureDialog = failurePage.getByRole('dialog');
  await failureDialog.getByRole('tab', { name: '文字', exact: true }).click();
  const search = failureDialog.getByRole('searchbox', { name: '搜索字体', exact: true });
  await search.fill('马善政楷书');
  await failureDialog.locator('[data-font-id="brush"][data-font-state="error"]').waitFor();
  assert.match(await failureDialog.locator('.theme-customizer__lettering').evaluate(node => getComputedStyle(node).fontFamily), /Inkra Xiaolai/, 'failed load must keep previous font');
  await failureDialog.getByRole('radio', { name: '马善政楷书', exact: true }).click();
  await failureDialog.locator('[data-font-id="brush"][data-font-state="ready"]').waitFor();
  await failurePage.waitForFunction(() => document.querySelector('.font-picker input[aria-label="马善政楷书"]').checked);
  await search.fill('霞鹜漫黑');
  await failureDialog.getByRole('radio', { name: '霞鹜漫黑', exact: true }).click();
  await search.fill('小赖字体');
  await failureDialog.getByRole('radio', { name: '小赖字体', exact: true }).click();
  await failurePage.waitForFunction(() => document.querySelector('.font-picker input[aria-label="小赖字体"]')?.checked);
  await failurePage.waitForTimeout(2000);
  assert(await failureDialog.getByRole('radio', { name: '小赖字体', exact: true }).isChecked(), 'a late font request cannot replace the latest choice');
  await failureContext.close();
  console.log((controlsOnly ? 'Focused font controls' : '29 fonts') + ', horizontal font cards, inline search/keyboard selection and retry, no panel overflow, real glyph rendering, independent persisted presets, release-only repaint, cancel/reset and fixed preview with scrolling parameters passed.');
  }
} finally {
  await browser.close();
}
