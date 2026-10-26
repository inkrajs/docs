import { chooseDocsOption } from './playground-test-helpers.mjs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { setPlaygroundControls } from './playground-controls.mjs';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1305, height: 954 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const locale of ['zh-CN', 'en']) {
    for (const width of [1305, 390]) {
      await page.setViewportSize({ width, height: 954 });
      await page.goto(base);
      await page.evaluate(locale => localStorage.setItem('inkra-docs-locale', locale), locale);
      await page.goto(`${base}/docs/components/color-picker#preview`);
      const playground = page.locator('.component-playground').first();
      await setPlaygroundControls(playground, true);
      const picker = playground.locator('.inkra-color-picker');
      const names = locale === 'en' ? ['Full panel', 'Compact layout', 'Popover', 'Swatches only'] : ['完整面板', '紧凑布局', '弹出面板', '仅色样'];
      for (const [index, mode] of ['inline', 'compact', 'popover', 'swatches'].entries()) {
        await setPlaygroundControls(playground, true);
        await chooseDocsOption(playground, locale === 'en' ? 'Presentation' : '展示形式', names[index], { exact: true, optionExact: true });
        await setPlaygroundControls(playground, false);
        assert.equal(await picker.getAttribute('data-presentation'), mode);
        if (mode === 'popover') {
          await picker.locator('.inkra-color-picker__trigger').click();
          await page.locator('.inkra-color-picker__popover').waitFor();
        }
        const editor = mode === 'popover' ? page.locator('.inkra-color-picker__popover') : picker;
        await editor.getByRole('button', { name: locale === 'en' ? 'Pine' : '松绿', exact: true }).click();
        assert.equal(await editor.getByRole('button', { name: locale === 'en' ? 'Pine' : '松绿', exact: true }).getAttribute('aria-pressed'), 'true');
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${mode} ${width} overflow`);
        await page.screenshot({ path: `/tmp/inkra-colors-${locale}-${width}-${mode}.png` });
        if (mode === 'popover') {
          await page.keyboard.press('Escape');
          await page.waitForFunction(node => node === document.activeElement, await picker.locator('.inkra-color-picker__trigger').elementHandle());
        }
      }
    }
  }

  await page.evaluate(async () => {
    document.getElementById('root').hidden = true;
    const container = document.createElement('div');
    container.id = 'color-fixture';
    document.body.append(container);
    const { mount } = await import('/scripts/fixtures/color-presentations.tsx');
    window.colors = mount(container);
  });
  const configure = async props => {
    await page.evaluate(props => window.colors.configure(props), props);
    await page.waitForTimeout(120);
  };
  const submitted = () => page.getByTestId('form').evaluate(form => new FormData(form).get('color'));
  const changes = () => page.evaluate(() => [...window.colors.changes]);
  const field = page.locator('#color-fixture .inkra-color-picker');
  for (const presentation of ['inline', 'compact', 'swatches', 'popover']) {
    await configure({ presentation });
    if (presentation === 'popover') await field.locator('button').click();
    const editor = presentation === 'popover' ? page.locator('.inkra-color-picker__popover') : field;
    const pine = editor.getByRole('button', { name: 'Pine', exact: true });
    await pine.focus();
    await pine.press('Space');
    assert.equal(await submitted(), '#629568ff');
    assert.equal(await pine.getAttribute('aria-pressed'), 'true');
    if (presentation !== 'swatches') {
      const hex = editor.getByRole('textbox', { name: 'Hex', exact: true });
      await hex.fill('#1234');
      await hex.press('Enter');
      assert.equal(await submitted(), '#11223344');
      await editor.getByRole('slider', { name: 'Opacity', exact: true }).press('End');
      assert.equal(await submitted(), '#112233ff');
    }
    if (presentation === 'popover') await pine.press('Escape');
    const count = (await changes()).length;
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.waitForTimeout(60);
    assert.equal(await submitted(), '#33669980');
    assert.equal((await changes()).length, count, 'reset does not emit a change');
  }

  await configure({ presentation: 'swatches', value: '#994f3fff' });
  const pine = field.getByRole('button', { name: 'Pine', exact: true });
  await pine.click();
  await pine.click();
  assert.equal(await submitted(), '#994f3fff', 'controlled rejection retains value');
  assert.deepEqual((await changes()).slice(-2), ['preset:#629568ff', 'preset:#629568ff']);
  await configure({ presentation: 'popover', value: '#994f3fff' });
  await field.locator('button').click();
  await configure({ presentation: 'popover', value: '#994f3fff', disabled: true });
  assert.equal(await page.locator('.inkra-color-picker__popover').count(), 0);
  assert.equal(await submitted(), null);
  assert(await field.locator('button').isDisabled());
  await configure({ presentation: 'swatches', presets: ['invalid'] });
  assert.equal(await field.getByRole('textbox', { name: 'Hex', exact: true }).count(), 1);

  for (const theme of ['light', 'dark']) {
    await page.evaluate(theme => {
      document.documentElement.dataset.theme = theme;
      document.documentElement.dataset.inkraTheme = theme;
    }, theme);
    await configure({ presentation: 'compact' });
    await page.waitForTimeout(250);
    const samples = await page.getByTestId('swatches').locator('.inkra-color-swatch__wash canvas').evaluateAll(canvases => canvases.map(canvas => {
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      let r = 0, g = 0, b = 0, a = 0;
      const levels = new Set();
      for (let i = 0; i < pixels.length; i += 4) {
        r += pixels[i] * pixels[i + 3]; g += pixels[i + 1] * pixels[i + 3]; b += pixels[i + 2] * pixels[i + 3]; a += pixels[i + 3]; levels.add(pixels[i + 3]);
      }
      return { r, g, b, a, levels: levels.size };
    }));
    assert(samples[0].r > samples[0].b * 10 && samples[0].a > 0, 'red pigment uses resolved currentColor');
    assert(samples[1].b > samples[1].r * 10, 'blue pigment does not reuse red or black texture');
    assert(samples[2].a > 0, 'CSS theme variable supported');
    assert.equal(samples[3].a, 0, 'transparent swatch remains transparent');
    assert(samples[4].a > 0 && samples[4].a < samples[0].a, 'alpha is retained');
    assert(samples[0].levels > 10, 'real pencil texture rather than solid fill');
    await page.keyboard.press('Tab');
    await page.getByRole('button', { name: 'Red pigment', exact: true }).focus();
    assert.equal(await page.getByRole('button', { name: 'Red pigment', exact: true }).locator('.inkra-button__focus-ring').evaluate(node => getComputedStyle(node).opacity), '1');
    assert(await page.getByRole('button', { name: 'Disabled pigment', exact: true }).isDisabled());
    for (const width of [1305, 390, 320]) {
      await page.setViewportSize({ width, height: 760 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `/tmp/inkra-colors-${theme}-${width}.png` });
    }
  }
  await page.emulateMedia({ forcedColors: 'active' });
  assert.equal(await page.getByRole('button', { name: 'Red pigment', exact: true }).evaluate(node => getComputedStyle(node).outlineStyle), 'solid');
  assert.equal(await page.locator('button button').count(), 0);
  await page.emulateMedia({ forcedColors: 'none' });
  await page.setViewportSize({ width: 320, height: 400 });
  await configure({ presentation: 'popover', dir: 'rtl' });
  await field.locator('button').click();
  const popup = page.locator('.inkra-color-picker__popover');
  await popup.waitFor();
  const bounds = await popup.boundingBox();
  assert(bounds.x >= 0 && bounds.x + bounds.width <= 320, 'short RTL popover remains within the viewport');
  await popup.getByRole('button', { name: 'Transparent', exact: true }).click();
  assert.equal(await submitted(), '#00000000');
  await page.getByTestId('form').evaluate(form => form.reset());
  await page.waitForTimeout(60);
  assert.equal(await popup.getByRole('textbox', { name: 'Hex', exact: true }).inputValue(), '#33669980', 'external reset updates the open portal');
  await page.screenshot({ path: '/tmp/inkra-colors-short-rtl.png' });

  await page.setViewportSize({ width: 1305, height: 954 });
  await page.goto(`${base}/docs/components/color-swatch#preview`);
  const swatchDemo = page.locator('.component-playground').first();
  await swatchDemo.getByRole('button', { name: 'Pine', exact: true }).click();
  assert.equal(await swatchDemo.getByRole('button', { name: 'Pine', exact: true }).getAttribute('aria-pressed'), 'true');
  await page.screenshot({ path: '/tmp/inkra-color-swatch-docs.png' });
  await page.goto(`${base}/docs/components/icon#preview`);
  await setPlaygroundControls(page.locator('.component-playground').first(), true);
  assert.equal(await page.locator('.icon-examples__colors .inkra-color-swatch').count(), 4);
  await page.locator('.icon-examples__colors .inkra-color-swatch').nth(2).click();
  assert.equal(await page.locator('.icon-examples__colors .inkra-color-swatch').nth(2).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', { name: 'Customize theme', exact: true }).click();
  const themeSwatches = page.locator('.theme-customizer__swatches .inkra-color-swatch');
  assert.equal(await themeSwatches.count(), 5);
  await themeSwatches.nth(2).click();
  assert.equal(await themeSwatches.nth(2).getAttribute('aria-pressed'), 'true');
  await page.screenshot({ path: '/tmp/inkra-color-swatch-theme.png' });
  assert.deepEqual(errors, []);
  console.log('PASS four ColorPicker presentations, bilingual docs, form reset, controlled rejection, keyboard, focus return, disabled, pigment pixels and responsive themes');
} finally {
  await browser.close();
}
