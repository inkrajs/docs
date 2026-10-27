import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const errors = [];
async function verifyLanguageSearchPosition() {
  const searchPage = await browser.newPage({ viewport: { width: 1305, height: 954 }, reducedMotion: 'reduce' });
  searchPage.on('pageerror', error => errors.push(error.message));
  try {
    await searchPage.goto(base + '/docs/design-standard');
    const saved = await searchPage.evaluate(() => localStorage.getItem('inkra-docs-custom-theme-v2'));
    await searchPage.getByRole('tab', { name: '字体', exact: true }).click();
    async function checkList(root, listSelector, itemSelector) {
      const list = root.locator(listSelector);
      const search = root.getByRole('searchbox', { name: '搜索字体', exact: true });
      const assertFirst = async id => {
        await searchPage.waitForFunction(({ listSelector, itemSelector, id }) => {
          const list = document.querySelector(listSelector);
          const first = list?.querySelector(itemSelector);
          if (!first || first.dataset.fontId !== id || first.dataset.fontState !== 'ready') return false;
          const box = list.getBoundingClientRect();
          const card = first.getBoundingClientRect();
          return Math.abs(list.scrollLeft) <= 1 && card.left >= box.left - 1 && card.right <= box.right + 1;
        }, { listSelector, itemSelector, id });
        assert.equal(await list.evaluate(node => Math.round(node.scrollLeft)), 0, 'language filtering resets horizontal scroll after DOM reordering');
      };
      await assertFirst('xiaolai');
      for (const [query, firstId, nativeIds] of [
        ['法语', 'caveat', null],
        ['日语', 'yomogi', ['yomogi', 'kleeone', 'yujisyuku', 'yujimai', 'hachimarupop']],
        ['韩语', 'gaegu', ['gaegu', 'nanumpen', 'nanumbrush', 'himelody', 'singleday']],
      ]) {
        for (const startFromEnd of [false, true]) {
          if (startFromEnd) await list.evaluate(node => { node.scrollLeft = node.scrollWidth; });
          await search.fill(query);
          await assertFirst(firstId);
          if (nativeIds) {
            const firstFive = await list.locator(itemSelector).evaluateAll(nodes => nodes.slice(0, 5).map(node => node.dataset.fontId));
            assert.deepEqual(new Set(firstFive), new Set(nativeIds), query + ' search puts five native handwriting options first');
          }
          await search.fill('');
          await assertFirst('xiaolai');
        }
      }
    }
    await checkList(searchPage.locator('.font-gallery'), '.font-gallery__list', '.font-gallery__item');
    await searchPage.locator('.header-customize').click();
    const searchDialog = searchPage.getByRole('dialog');
    await searchDialog.getByRole('tab', { name: '文字', exact: true }).click();
    await checkList(searchDialog, '.font-picker__list', '.font-picker__option');
    assert(await searchDialog.locator('input[value="xiaolai"]').isChecked(), 'reordered language search preserves the selected font');
    assert.equal(await searchPage.evaluate(() => localStorage.getItem('inkra-docs-custom-theme-v2')), saved, 'search positioning does not change saved settings');
  } finally {
    await searchPage.close();
  }
}
try {
  await verifyLanguageSearchPosition();
  if (process.argv.includes('--search-only')) {
    assert.deepEqual(errors, []);
    console.log('Chinese gallery and picker language search: French/Japanese/Korean search shows the loaded first native card at scrollLeft=0; Japanese and Korean each put five native fonts first; clearing restores the start; selection and saved settings preserved.');
  } else {
  const page = await browser.newPage({ viewport: { width: 1305, height: 954 }, reducedMotion: 'reduce' });
  page.on('pageerror', error => errors.push(error.message));
  const fonts = [];
  page.on('request', request => { if (request.url().endsWith('.woff2')) fonts.push(request.url()); });
  await page.goto(base + '/docs/design-standard');
  await page.evaluate(() => document.fonts.ready);
  assert.equal(fonts.filter(url => url.includes('/fonts/theme/')).length, 0, 'optional fonts are not loaded in another tab');
  assert.equal(fonts.filter(url => url.includes('yozai')).length, 0, 'original font is no longer eagerly preloaded');
  await page.getByRole('tab', { name: '字体', exact: true }).click();
  const gallery = page.locator('.font-gallery');
  const list = gallery.getByRole('list');
  const search = gallery.getByRole('searchbox', { name: '搜索字体' });
  await gallery.locator('[data-font-id="marker"][data-font-state="ready"]').waitFor();
  assert.equal(await gallery.getByRole('listitem').count(), 29);
  assert.equal(fonts.filter(url => url.includes('yozai')).length, 1, 'one shared original font face, without a second URL');
  const initial = await gallery.getByRole('listitem').evaluateAll(nodes => nodes.map(node => ({
    id: node.dataset.fontId, state: node.dataset.fontState,
    x: node.getBoundingClientRect().x, y: node.getBoundingClientRect().y,
  })));
  assert(initial[1].x > initial[0].x && initial[1].y === initial[0].y, 'fonts flow horizontally');
  assert(initial.filter(font => font.state === 'idle').length >= 10, 'offscreen fonts remain unloaded');
  assert(fonts.filter(url => url.includes('/fonts/theme/')).length <= 3);
  const beforeStyle = await page.locator('html').getAttribute('style');
  await search.fill('Noto Sans');
  await gallery.locator('[data-font-id="sans"][data-font-state="ready"]').waitFor();
  assert.equal(await gallery.getByRole('listitem').count(), 1);
  const specimen = gallery.locator('.font-gallery__title');
  await specimen.locator('canvas').waitFor({ state: 'visible' });
  assert.match(await specimen.evaluate(node => getComputedStyle(node).fontFamily), /^"Inkra NotoSans"/);
  assert.equal(await page.locator('html').getAttribute('style'), beforeStyle, 'browsing fonts does not change the site theme');
  const sansCount = fonts.filter(url => url.endsWith('/NotoSans.woff2')).length;
  await search.fill('没有这个字体');
  await gallery.getByRole('status').waitFor();
  assert.equal(await gallery.getByRole('listitem').count(), 0);
  await search.fill('noto sans');
  await gallery.locator('[data-font-id="sans"][data-font-state="ready"]').waitFor();
  assert.equal(fonts.filter(url => url.endsWith('/NotoSans.woff2')).length, sansCount, 'cached fonts are reused after filtering');
  await search.fill('');
  await list.evaluate(node => { node.scrollLeft = node.scrollWidth; });
  await page.waitForFunction(() => [...document.querySelectorAll('.font-gallery__item')].at(-1)?.dataset.fontState === 'ready');
  await search.fill('小赖');
  await gallery.locator('[data-font-id="xiaolai"][data-font-state="ready"]').waitFor();
  assert.equal(await list.evaluate(node => node.scrollLeft), 0, 'search from the row end resets scroll position');
  assert.equal(await gallery.getByRole('listitem').count(), 1);
  await search.fill('');
  await list.focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => document.querySelector('.font-gallery__list').scrollLeft > 0);
  await page.screenshot({ path: '/tmp/inkra-gallery-verified-desktop.png' });

  const retryPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  let fail = true;
  await retryPage.route('**/fonts/theme/NotoSerif.woff2', async route => {
    if (fail) { fail = false; await route.abort(); } else await route.continue();
  });
  await retryPage.goto(base + '/docs/design-standard');
  await retryPage.getByRole('tab', { name: '字体', exact: true }).click();
  await retryPage.getByRole('searchbox', { name: '搜索字体' }).fill('思源宋体');
  const errorItem = retryPage.locator('.font-gallery__item[data-font-id="serif"]');
  await errorItem.getByRole('alert').waitFor();
  assert.equal(await errorItem.locator('.font-gallery__sample').count(), 0, 'failed font must not masquerade as a fallback specimen');
  await errorItem.getByRole('button', { name: '重试', exact: true }).click();
  await retryPage.locator('[data-font-id="serif"][data-font-state="ready"]').waitFor();
  for (const width of [390, 320]) {
    await retryPage.setViewportSize({ width, height: 844 });
    await retryPage.getByRole('searchbox', { name: '搜索字体' }).fill('');
    assert(await retryPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no page overflow at ' + width);
  }
  await retryPage.screenshot({ path: '/tmp/inkra-gallery-verified-mobile.png' });

  const plainPage = await browser.newPage({ viewport: { width: 1305, height: 954 } });
  await plainPage.addInitScript(() => {
    localStorage.setItem('inkra-docs-custom-theme-v2', JSON.stringify({ font: 'xiaolai', textEffect: false }));
    localStorage.setItem('inkra-docs-locale', 'en');
  });
  await plainPage.goto(base + '/docs/design-standard');
  await plainPage.getByRole('tab', { name: 'Font family', exact: true }).click();
  await plainPage.getByRole('searchbox', { name: 'Search fonts' }).fill('xiaolai');
  await plainPage.locator('.font-gallery__item[data-font-state="ready"]').waitFor();
  await plainPage.waitForFunction(() => getComputedStyle(document.querySelector('.font-gallery__title')).getPropertyValue('--inkra-letter-effect').trim() === '0');
  assert.equal(await plainPage.locator('.font-gallery__sample [data-pencil-ready]').count(), 0, 'gallery respects plain-text mode');
  assert.notEqual(await plainPage.locator('.font-gallery__title .inkra-pencil-text__source').evaluate(node => getComputedStyle(node).color), 'rgba(0, 0, 0, 0)');

  // Language changes reorder recommendations and translate specimens, never the saved font.
  for (const [locale, fontTab, textTab, cancel, firstId, family, title, card, previewTitle] of [
    ['en', 'Font family', 'Text', 'Cancel', 'caveat', 'Inkra Caveat', 'A little inspiration', 'A little inspiration', 'Theme preview'],
    ['fr', 'Police', 'Texte', 'Annuler', 'caveat', 'Inkra Caveat', 'Écrire en liberté', 'Écrire en liberté Un cœur léger', 'Aperçu du thème'],
    ['ja', 'フォント', '文字', 'キャンセル', 'yomogi', 'Inkra Yomogi', '小さなひらめき', '小さな ひらめき', 'テーマプレビュー'],
    ['ko', '글꼴', '텍스트', '취소', 'gaegu', 'Inkra Gaegu', '작은 영감', '작은 영감 오늘의 기록', '테마 미리보기'],
  ]) {
    const localized = await browser.newPage({ viewport: { width: 1305, height: 954 }, reducedMotion: 'reduce' });
    localized.on('pageerror', error => errors.push(error.message));
    const stored = JSON.stringify({ font: 'marker', textEffect: true, render: { outline: .31 } });
    await localized.addInitScript(({ locale, stored }) => {
      localStorage.setItem('inkra-docs-locale', locale);
      localStorage.setItem('inkra-docs-custom-theme-v2', stored);
    }, { locale, stored });
    await localized.goto(base + '/docs/design-standard');
    await localized.getByRole('tab', { name: fontTab, exact: true }).click();
    const localizedGallery = localized.locator('.font-gallery');
    assert.equal(await localizedGallery.getByRole('listitem').first().getAttribute('data-font-id'), firstId, locale + ' handwriting is recommended first');
    const firstItem = localizedGallery.locator(`[data-font-id="${firstId}"][data-font-state="ready"]`);
    await firstItem.waitFor();
    assert.equal(await firstItem.locator('.font-gallery__sample').getAttribute('lang'), locale);
    assert.equal(await firstItem.locator('.font-gallery__title').textContent(), title);
    await firstItem.locator('.font-gallery__title canvas').waitFor();
    assert(await firstItem.locator('.font-gallery__title').evaluate((node, family) => {
      const canvas = node.querySelector('canvas');
      return getComputedStyle(node).fontFamily.startsWith('"' + family + '"')
        && [...document.fonts].some(font => font.family.replaceAll('"', '') === family && font.status === 'loaded')
        && canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0);
    }, family), locale + ' specimen paints using the requested loaded family');
    if (locale === 'fr') {
      const localizedSearch = localizedGallery.getByRole('searchbox');
      const ids = () => localizedGallery.getByRole('listitem').evaluateAll(nodes => nodes.map(node => node.dataset.fontId));
      await localizedSearch.fill('français');
      const accented = await ids();
      await localizedSearch.fill('francais');
      assert.deepEqual(await ids(), accented, 'French language search ignores accents');
      assert(accented.includes('caveat') && !accented.includes('yozai'));
    }
    assert.equal(await localized.evaluate(() => localStorage.getItem('inkra-docs-custom-theme-v2')), stored, 'gallery browsing preserves saved settings');
    await localized.locator('.header-customize').click();
    const localizedDialog = localized.getByRole('dialog');
    await localizedDialog.getByRole('tab', { name: textTab, exact: true }).click();
    assert.equal(await localizedDialog.locator('.font-picker__option').first().getAttribute('data-font-id'), firstId);
    assert(await localizedDialog.locator('input[value="marker"]').isChecked(), 'locale recommendations do not replace the saved choice');
    await localizedDialog.locator(`.font-picker__option[data-font-id="${firstId}"] input`).click();
    await localized.waitForFunction(id => document.querySelector(`.font-picker input[value="${id}"]`)?.checked, firstId);
    const localizedCard = localizedDialog.locator(`.font-picker__option[data-font-id="${firstId}"] .font-picker__specimen`);
    assert.equal(await localizedCard.getAttribute('lang'), locale);
    assert.equal(await localizedCard.textContent(), card);
    assert(await localizedCard.evaluate(node => {
      const style = getComputedStyle(node);
      return style.whiteSpace === 'nowrap'
        && node.getBoundingClientRect().height <= Number.parseFloat(style.lineHeight) + 1;
    }), locale + ' compact picker specimen stays on one line');
    const previewHeading = localizedDialog.locator('.theme-customizer__lettering');
    assert.equal(await previewHeading.textContent(), previewTitle);
    assert.equal(await previewHeading.getAttribute('lang'), locale);
    assert(await previewHeading.evaluate((node, family) => getComputedStyle(node).fontFamily.startsWith('"' + family + '"'), family), locale + ' preview uses the newly selected font');
    assert.equal(await localized.evaluate(() => localStorage.getItem('inkra-docs-custom-theme-v2')), stored, 'previewing a recommended font does not save it');
    await localizedDialog.getByRole('button', { name: cancel, exact: true }).click();
    assert.equal(await localized.evaluate(() => localStorage.getItem('inkra-docs-custom-theme-v2')), stored, 'cancel retains the original font and parameters');
    await localized.close();
  }

  // Do not call a cached base font ready while its actual Korean glyph shard is pending.
  const extended = await browser.newPage({ viewport: { width: 1305, height: 954 }, reducedMotion: 'reduce' });
  extended.on('pageerror', error => errors.push(error.message));
  await extended.addInitScript(() => localStorage.setItem('inkra-docs-locale', 'ko'));
  let releaseExtended;
  const extendedGate = new Promise(resolve => { releaseExtended = resolve; });
  let extendedRequested = false;
  await extended.route(/xiaolai-extended.*\.woff2/, async route => {
    extendedRequested = true;
    await extendedGate;
    await route.continue();
  });
  try {
    await extended.goto(base + '/docs/design-standard', { waitUntil: 'domcontentloaded' });
    await extended.getByRole('tab', { name: '글꼴', exact: true }).click();
    const koreanXiaolai = extended.locator('.font-gallery__item[data-font-id="xiaolai"]');
    await koreanXiaolai.scrollIntoViewIfNeeded();
    await koreanXiaolai.locator('.font-gallery__placeholder').waitFor();
    await extended.waitForFunction(() => document.querySelector('.font-gallery__item[data-font-id="xiaolai"]')?.dataset.fontState === 'loading');
    assert(extendedRequested, 'Korean sample requests the actual Xiaolai extended asset');
    assert.equal(await koreanXiaolai.locator('.font-gallery__sample').count(), 0, 'pending extended glyphs do not appear as a fallback sample');
    releaseExtended();
    await extended.locator('.font-gallery__item[data-font-id="xiaolai"][data-font-state="ready"]').waitFor();
    assert.equal(await koreanXiaolai.locator('.font-gallery__sample').getAttribute('lang'), 'ko');
    await koreanXiaolai.locator('.font-gallery__title canvas').waitFor();
  } finally {
    releaseExtended();
    await extended.close();
  }

  assert.deepEqual(errors, []);
  console.log('Font gallery: 29 fonts, en/fr/ja/ko samples and ordering, accent-insensitive search, saved-setting isolation, Korean extended font loading, lazy requests, one original font asset, horizontal layout, search, caching, retry, plain-text mode and 1305/390/320px passed.');
  }
} finally { await browser.close(); }
