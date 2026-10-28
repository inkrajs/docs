import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { assertPlaygroundLayout, readCode, setControls, showPreview } from './playground-helpers.mjs';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const errors = [];
const read = locator => locator.evaluate(node => {
  const css = getComputedStyle(node);
  return { paper: css.getPropertyValue('--inkra-paper').trim(), accent: css.getPropertyValue('--inkra-accent').trim(),
    stroke: css.getPropertyValue('--inkra-icon-stroke-width').trim(), scheme: css.colorScheme };
});
const paintSignature = locator => locator.evaluate(node => (node instanceof HTMLCanvasElement ? [node] : [...node.querySelectorAll('canvas')]).map(canvas => {
  if (!canvas.width || !canvas.height) return '';
  const context = canvas.getContext('2d');
  if (!context) return '';
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let hash = 2166136261;
  for (const value of pixels) hash = Math.imul(hash ^ value, 16777619);
  return `${canvas.width}:${canvas.height}:${hash >>> 0}`;
}).join('|'));
try {
  for (const [width, locale] of [[1543, 'zh-CN'], [1305, 'zh-CN'], [390, 'en'], [320, 'zh-CN']]) {
    console.log('Checking theme playground', width, locale);
    const page = await browser.newPage({ viewport: { width, height: 954 }, reducedMotion: 'reduce', colorScheme: 'light' });
    page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
    await page.addInitScript(locale => {
      localStorage.setItem('inkra-docs-locale', locale);
      localStorage.setItem('inkra-docs-theme', 'dark');
    }, locale);
    await page.goto(base + '/docs/theming');
    const preview = page.getByTestId('theme-preview');
    await preview.waitFor();
    await page.evaluate(() => document.fonts.ready);
    const playground = page.locator('#theme-provider .component-playground');
    await assertPlaygroundLayout(playground);
    assert.equal(await page.title(), `${locale === 'en' ? 'Theme customization' : '主题定制'} · Inkra`);
    assert.equal((await read(preview)).scheme, 'light');
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await preview.locator('input').fill('Retained draft');
    const node = await preview.locator('input').elementHandle();
    const settings = page.locator('.theme-examples__settings');
    await setControls(playground, true);
    await settings.getByRole('tab', { name: locale === 'en' ? 'Text' : '文字', exact: true }).click();
    await settings.getByRole('switch', { name: locale === 'en' ? 'Pencil effect' : '彩铅效果', exact: true }).click();
    await showPreview(playground);
    await preview.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => !document.querySelector('[data-testid="theme-preview"] h3').hasAttribute('data-pencil-ready'));
    await page.waitForFunction(() => !document.querySelector('[data-testid="theme-preview"] input').closest('.inkra-field-control-hit').hasAttribute('data-pencil-editable-ready'));
    assert.notEqual(await preview.locator('input').evaluate(node => getComputedStyle(node).color), 'rgba(0, 0, 0, 0)');
    assert.equal(await preview.locator('input').inputValue(), 'Retained draft', 'plain mode preserves editable values');
    assert.notEqual(await preview.locator('h3 .inkra-pencil-text__source').evaluate(node => getComputedStyle(node).color), 'rgba(0, 0, 0, 0)');
    await preview.getByRole('combobox').click();
    const plainList = page.getByRole('listbox');
    await plainList.waitFor();
    assert.equal(await plainList.evaluate(node => getComputedStyle(node).getPropertyValue('--inkra-letter-effect').trim()), '0', 'portals inherit plain lettering');
    assert.equal(await plainList.locator('.inkra-pencil-text[data-pencil-ready="true"]').count(), 0);
    await page.keyboard.press('Escape');
    await setControls(playground, true);
    await settings.getByRole('switch', { name: locale === 'en' ? 'Pencil effect' : '彩铅效果', exact: true }).click();
    await settings.getByRole('tab', { name: locale === 'en' ? 'Theme' : '主题', exact: true }).click();
    await settings.getByRole('radio', { name: locale === 'en' ? 'Dark' : '深色', exact: true }).click();
    assert.equal((await read(preview)).scheme, 'dark');
    await settings.getByRole('radio', { name: locale === 'en' ? 'Light' : '浅色', exact: true }).click();
    await settings.getByRole('button', { name: locale === 'en' ? 'Canglang' : '沧浪', exact: true }).click();
    const before = await read(preview);
    await showPreview(playground);
    await preview.getByRole('combobox').click();
    const list = page.getByRole('listbox');
    await list.waitFor();
    const popup = await read(list);
    assert.equal(popup.scheme, before.scheme);
    assert.equal(popup.accent, before.accent);
    assert.equal(popup.paper, before.paper);
    await page.getByRole('option', { name: locale === 'en' ? 'Ready' : '就绪', exact: true }).click();
    assert.equal(await preview.locator('input').inputValue(), 'Retained draft');
    assert(await preview.locator('input').evaluate((current, prior) => current === prior, node));
    await preview.getByRole('button', { name: locale === 'en' ? 'Save' : '保存', exact: true }).click();
    assert.equal(await preview.locator('[aria-pressed="true"]').count(), 1);
    for (const [tab, label, token, expected, selector] of [
      ['Text', 'Outline intensity', '--inkra-letter-outline', '0.2', 'h3'],
      ['Lines', 'Stroke weight', '--inkra-stroke-width', '0.3px', '.theme-examples__line'],
      ['Fill', 'Fill strength', '--inkra-wash-strength', '0', '.inkra-button[aria-pressed]'],
    ]) {
      const zh = { Text: '文字', Lines: '线条', Fill: '涂色', 'Outline intensity': '轮廓浓度', 'Stroke weight': '线条粗细', 'Fill strength': '涂色浓度' };
      await preview.scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
      const sample = preview.locator(selector).first();
      const beforePaint = await paintSignature(sample);
      await setControls(playground, true);
      await settings.getByRole('tab', { name: locale === 'en' ? tab : zh[tab], exact: true }).click();
      const slider = settings.getByRole('slider', { name: locale === 'en' ? label : zh[label], exact: true });
      await slider.focus();
      await slider.press('Home');
      await page.waitForFunction(({ token, expected }) => getComputedStyle(document.querySelector('[data-testid="theme-preview"]')).getPropertyValue(token).trim() === expected, { token, expected });
      await showPreview(playground);
      await preview.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      assert.notEqual(await paintSignature(sample), beforePaint, `${tab} changes actual pencil pixels`);
      assert.ok((await readCode(playground)).includes(token));
    }
    await setControls(playground, true);
    await settings.getByRole('button', { name: locale === 'en' ? 'Reset' : '恢复默认', exact: true }).click();
    await showPreview(playground);
    assert.equal(await preview.locator('input').inputValue(), 'Retained draft');
    await preview.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    const pixels = await preview.locator('canvas').evaluateAll(nodes => nodes.some(canvas => {
      if (!canvas.width || !canvas.height) return false;
      const context = canvas.getContext('2d');
      return context && context.getImageData(0, 0, canvas.width, canvas.height).data.some((value, i) => i % 4 === 3 && value > 16);
    }));
    assert(pixels, 'actual pencil pixels, not only canvas elements');
    await page.screenshot({ path: `/tmp/inkra-theme-${width}.png`, animations: 'disabled' });
    await page.goto(base + '/docs/internationalization');
    await page.locator('#internationalization').waitFor();
    assert.equal(await page.locator('.inkra-search-select__clear').locator('..').boundingBox(), null,
      'empty internationalization example has no clear slot');
    assert.equal(await page.title(), `${locale === 'en' ? 'Internationalization' : '国际化'} · Inkra`);
    if (width === 1305) {
      const sidebar = page.locator('.desktop-sidebar');
      await sidebar.getByRole('link', { name: '主题定制', exact: true }).click();
      await preview.waitFor();
      await page.goBack();
      await page.locator('#internationalization').waitFor();
    }
    await page.goto(base + '/docs/getting-started');
    assert.equal(await page.locator('#internationalization').count(), 0);
    assert.equal(await page.locator('main a[href="/docs/internationalization"]').count(), 1);
    const footer = page.locator('.docs-page-navigation');
    assert.equal(await footer.locator('a[rel="prev"]').count(), 0, 'first document has no previous page');
    await footer.locator('a[rel="next"]').click();
    await page.waitForURL('**/docs/internationalization');
    assert.equal(await footer.locator('a[rel="next"]').getAttribute('href'), '/docs/theming', 'theme guide follows internationalization in the shared footer');
    await page.goto(base + '/docs/getting-started#internationalization');
    await page.waitForURL('**/docs/internationalization');
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 900, height: 800 }, colorScheme: 'light', reducedMotion: 'reduce' });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '/docs/theming');
  await page.getByTestId('theme-preview').waitFor();
  const mount = () => page.evaluate(async () => {
    document.getElementById('root').hidden = true;
    const container = document.createElement('div');
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/ThemeProviderFixture.tsx');
    window.themeFixture = mount(container);
  });
  try { await mount(); } catch (error) {
    if (!String(error).includes('Execution context was destroyed')) throw error;
    await page.goto(base + '/docs/theming');
    await page.getByTestId('theme-preview').waitFor();
    await mount();
  }
  const outer = page.getByTestId('outer');
  const inherited = page.getByTestId('inherited');
  await outer.waitFor();
  const documentTheme = await page.locator('html').getAttribute('data-theme');
  assert.equal((await read(outer)).scheme, 'dark');
  assert.equal((await read(inherited)).scheme, 'dark');
  assert.equal((await read(inherited)).accent, '#b87362');
  assert.equal((await read(page.getByTestId('light'))).scheme, 'light');
  assert.equal((await read(page.getByTestId('auto'))).scheme, 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  assert.equal((await read(page.getByTestId('auto'))).scheme, 'dark');
  assert.equal((await read(page.getByTestId('light'))).scheme, 'light');
  await page.getByRole('textbox', { name: 'Draft', exact: true }).fill('Preserved');
  await page.getByRole('button', { name: 'Open scoped popover' }).click();
  const popup = page.getByTestId('scoped-popover');
  await popup.waitFor();
  const input = page.getByRole('textbox', { name: 'Portal draft' });
  await input.fill('Portal state');
  await input.focus();
  await input.evaluate(node => node.setSelectionRange(1, 4));
  const handle = await input.elementHandle();
  await page.evaluate(() => window.themeFixture.update('light'));
  await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-testid="scoped-popover"]')).colorScheme === 'light');
  assert.equal((await read(popup)).accent, '#b87362');
  assert(await input.evaluate((node, previous) => node === previous && document.activeElement === node, handle));
  assert.deepEqual(await input.evaluate(node => [node.selectionStart, node.selectionEnd]), [1, 4]);
  assert.equal(await input.inputValue(), 'Portal state');
  assert.equal(await page.getByRole('textbox', { name: 'Draft', exact: true }).inputValue(), 'Preserved');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Toggle tokens' }).click();
  assert.equal((await read(inherited)).accent, (await read(outer)).accent);
  await page.getByRole('button', { name: 'Toggle tokens' }).click();
  await page.emulateMedia({ forcedColors: 'active' });
  await page.waitForFunction(() => !document.querySelector('[data-testid="inherited"]').style.getPropertyValue('--inkra-accent'));
  assert.equal((await read(inherited)).accent, 'Highlight');
  await page.emulateMedia({ forcedColors: 'none' });
  await page.waitForFunction(() => document.querySelector('[data-testid="inherited"]').style.getPropertyValue('--inkra-accent') === '#b87362');
  assert.equal(await page.locator('html').getAttribute('data-theme'), documentTheme);
  await page.evaluate(() => window.themeFixture.unmount());
  assert.equal(await page.getByTestId('outer').count(), 0);
  await page.close();
  const retina = await browser.newPage({ viewport: { width: 1543, height: 954 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  retina.on('pageerror', error => errors.push(error.message));
  await retina.goto(base + '/docs/internationalization');
  const paragraphs = retina.locator('#internationalization > p');
  for (let index = 0; index < await paragraphs.count(); index++) {
    const paragraph = paragraphs.nth(index);
    await paragraph.scrollIntoViewIfNeeded();
    await retina.waitForFunction(node => node.dataset.pencilReady === 'true', await paragraph.elementHandle());
    assert.notEqual(await paintSignature(paragraph), '');
  }
  await paragraphs.nth(1).scrollIntoViewIfNeeded();
  await retina.screenshot({ path: '/tmp/inkra-i18n-text-retina-fixed.png', animations: 'disabled' });
  await retina.close();
  assert.deepEqual(errors, []);
  console.log('Theme provider: routes, bilingual docs, scoped tokens, portals, identity, system/forced colors and 1305/390/320px checks passed.');
} finally { await browser.close(); }
