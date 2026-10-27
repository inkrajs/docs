import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const storageKey = 'inkra-docs-custom-theme-v2';
const tokenNames = ['--inkra-accent', '--inkra-accent-soft', '--inkra-accent-strong', '--inkra-on-accent', '--inkra-selection-pigment', '--inkra-selection-foreground'];
const browser = await chromium.launch();
const errors = [];

async function tokens(locator) {
  return locator.evaluate((node, names) => Object.fromEntries(names.map(name => [name, getComputedStyle(node).getPropertyValue(name).trim()])), tokenNames);
}
async function stored(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), storageKey);
}
async function open(page) {
  await page.locator('.header-customize').click();
  const drawer = page.locator('.theme-customizer');
  await drawer.waitFor();
  await drawer.getByRole('tab', { name: '主题', exact: true }).click();
  return drawer;
}
async function expectNoOverflow(page, locator, description) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${description}: page fits viewport`);
  assert(await locator.evaluate(node => {
    const rect = node.getBoundingClientRect();
    return rect.left >= -1 && rect.right <= innerWidth + 1 && node.scrollWidth <= node.clientWidth + 1;
  }), `${description}: local content fits viewport`);
}
async function chooseCustom(page, drawer, color) {
  const add = drawer.getByRole('button', { name: '添加自定义颜色', exact: true });
  await add.focus();
  await page.keyboard.press('Enter');
  const popover = page.locator('.theme-customizer__color-popover');
  await popover.waitFor();
  const input = popover.getByRole('textbox', { name: '颜色值', exact: true });
  await input.fill(color);
  await input.press('Enter');
  await drawer.getByRole('button', { name: `自定义颜色 ${color}`, exact: true }).waitFor();
  assert.equal(await drawer.getByRole('button', { name: `自定义颜色 ${color}`, exact: true }).getAttribute('aria-pressed'), 'true');
  return { add, popover, input };
}
async function dismissPicker(page, add) {
  // Leave the textbox first: Escape there intentionally discards its uncommitted draft.
  await page.keyboard.press('Tab');
  await page.keyboard.press('Escape');
  await page.locator('.theme-customizer__color-popover').waitFor({ state: 'hidden' });
  assert(await add.evaluate(node => node === document.activeElement), 'Escape returns keyboard focus to the plus button');
  assert(await page.locator('.theme-customizer').isVisible(), 'Escape closes only the picker, not the drawer');
}
async function save(page, drawer) {
  await drawer.getByRole('button', { name: '保存', exact: true }).click();
  await drawer.waitFor({ state: 'hidden' });
}

try {
  for (const width of [1305, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
    await context.addInitScript(() => {
      localStorage.setItem('inkra-docs-locale', 'zh-CN');
      if (!localStorage.getItem('inkra-docs-theme')) localStorage.setItem('inkra-docs-theme', 'light');
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(`${width}: ${error.message}`));
    try {
      await page.goto(`${base}/docs/design-standard`);
      let drawer = await open(page);
      const rootBefore = await tokens(page.locator('html'));
      let previous = await tokens(drawer.locator('.theme-customizer__preview-card'));
      for (const colorName of ['丁香', '赭橙', '藤黄']) {
        await drawer.getByRole('button', { name: colorName, exact: true }).click();
        const current = await tokens(drawer.locator('.theme-customizer__preview-card'));
        assert.notDeepEqual(current, previous, `${colorName} changes the real preview tokens`);
        assert.deepEqual(await tokens(page.locator('html')), rootBefore, 'built-in draft does not alter the global theme');
        previous = current;
      }
      await drawer.getByRole('radio', { name: '深色', exact: true }).check();
      const dark = await tokens(drawer.locator('.theme-customizer__preview-card'));
      assert.notDeepEqual(dark, previous, 'dark mode uses a distinct palette');
      assert(Object.values(dark).every(value => /^#[\da-f]{6}$/i.test(value)), 'all dark theme tokens resolve to safe colors');
      await drawer.getByRole('radio', { name: '浅色', exact: true }).check();
      assert.deepEqual(await tokens(drawer.locator('.theme-customizer__preview-card')), previous, 'light mode restores its palette');
      await expectNoOverflow(page, drawer.locator('.theme-customizer__swatches'), 'built-in palettes');

      const firstColor = '#856b89';
      const picker = await chooseCustom(page, drawer, firstColor);
      const customTokens = await tokens(drawer.locator('.theme-customizer__preview-card'));
      assert.notDeepEqual(customTokens, previous, 'custom color changes preview tokens');
      assert.deepEqual(await tokens(page.locator('html')), rootBefore, 'custom color remains a local draft');
      assert.equal(await stored(page), null, 'picking does not persist before Save');
      await picker.input.fill('tomato');
      await picker.input.press('Enter');
      assert.equal(await picker.input.getAttribute('aria-invalid'), 'true');
      assert.deepEqual(await tokens(drawer.locator('.theme-customizer__preview-card')), customTokens, 'invalid color cannot alter preview');
      await picker.input.fill(firstColor);
      await picker.input.press('Enter');
      await expectNoOverflow(page, picker.popover, 'color picker');
      await page.screenshot({ path: `/tmp/inkra-theme-colors-picker-${width}.png`, animations: 'disabled' });
      await dismissPicker(page, picker.add);
      await save(page, drawer);
      assert.equal((await stored(page)).palette, `custom:${firstColor}`);
      assert.deepEqual((await stored(page)).customColors, [firstColor]);
      await page.reload();
      drawer = await open(page);
      const firstSwatch = drawer.getByRole('button', { name: `自定义颜色 ${firstColor}`, exact: true });
      assert.equal(await firstSwatch.getAttribute('aria-pressed'), 'true', 'saved color restored after reload');
      await page.waitForFunction(expected => Object.entries(expected).every(([name, value]) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() === value), customTokens);
      assert.deepEqual(await tokens(page.locator('html')), customTokens, 'saved custom tokens apply globally after reload');

      const savedBeforeCancel = await stored(page);
      const secondColor = '#c18a55';
      const cancelled = await chooseCustom(page, drawer, secondColor);
      await dismissPicker(page, cancelled.add);
      await drawer.getByRole('button', { name: '取消', exact: true }).click();
      await drawer.waitFor({ state: 'hidden' });
      assert.deepEqual(await stored(page), savedBeforeCancel, 'Cancel preserves saved palette and history');
      assert.deepEqual(await tokens(page.locator('html')), customTokens, 'Cancel preserves the applied theme');
      drawer = await open(page);
      assert.equal(await drawer.getByRole('button', { name: `自定义颜色 ${secondColor}`, exact: true }).count(), 0, 'cancelled color is absent on reopen');
      const secondPicker = await chooseCustom(page, drawer, secondColor);
      await dismissPicker(page, secondPicker.add);
      await save(page, drawer);
      assert.deepEqual((await stored(page)).customColors, [secondColor, firstColor], 'saved colors retain reusable history');

      drawer = await open(page);
      await drawer.getByRole('button', { name: `自定义颜色 ${firstColor}`, exact: true }).click();
      await save(page, drawer);
      assert.deepEqual((await stored(page)).customColors, [firstColor, secondColor], 'reusing a color promotes it without duplication');
      await page.reload();
      drawer = await open(page);
      assert.equal(await drawer.getByRole('button', { name: `自定义颜色 ${firstColor}`, exact: true }).getAttribute('aria-pressed'), 'true');
      assert.equal(await drawer.getByRole('button', { name: `自定义颜色 ${secondColor}`, exact: true }).count(), 1);
      await expectNoOverflow(page, drawer.locator('.theme-customizer__swatches'), 'saved color history');
      await page.screenshot({ path: `/tmp/inkra-theme-colors-saved-${width}.png`, animations: 'disabled' });
      console.log(`PASS theme colors: built-ins, light/dark, draft/invalid/cancel, save/reload/history, keyboard and ${width}px layout`);
    } finally {
      await context.close();
    }
  }
  assert.deepEqual(errors, [], 'no browser runtime errors');
} finally {
  await browser.close();
}
