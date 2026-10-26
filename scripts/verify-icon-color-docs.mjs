import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { iconFillCopy } from '../src/components/iconFillCopy.ts';
import { docsLanguages } from '../src/docsLocales.ts';
import { setPlaygroundControls } from './playground-test-helpers.mjs';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const widths = process.env.INKRA_ICON_WIDTHS?.split(',').map(Number) ?? [1305, 390, 320];
const languages = process.env.INKRA_ICON_LOCALES?.split(',');
assert(widths.length > 0 && widths.every(width => Number.isInteger(width) && width >= 320));
assert(!languages || languages.length > 0 && languages.every(locale => docsLanguages.some(([key]) => key === locale)));
const browser = await chromium.launch();
const errors = [];
const roles = { primary: '--inkra-blue', secondary: '--inkra-warning-pigment', accent: '--inkra-coral' };
const roleLabels = { primary: '主色', secondary: '辅助色', accent: '点缀色' };

async function resolvedPalette(gallery) {
  return gallery.evaluate((element, roles) => {
    const style = getComputedStyle(element);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d');
    return Object.fromEntries(Object.entries(roles).map(([role, token]) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = style.getPropertyValue(token).trim();
      context.fillRect(0, 0, 1, 1);
      return [role, [...context.getImageData(0, 0, 1, 1).data]];
    }));
  }, roles);
}

async function assertThemePickers(page, gallery, palette) {
  for (const [role, rgba] of Object.entries(palette)) {
    await gallery.getByRole('group', { name: roleLabels[role], exact: true }).getByRole('button').click();
    const input = page.locator('.inkra-color-picker__input:visible');
    const hex = '#' + rgba.map(value => value.toString(16).padStart(2, '0')).join('');
    await page.waitForFunction(hex => document.querySelector('.inkra-color-picker__input')?.value.toLowerCase() === hex, hex);
    assert.equal((await input.inputValue()).toLowerCase(), hex, 'picker follows the resolved theme pigment');
    await input.press('Escape');
  }
}
try {
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem('inkra-docs-locale', 'zh-CN');
      localStorage.setItem('inkra-docs-theme', 'light');
    });
    await page.goto(`${base}/docs/components/icon#preview`);
    const metadata = await page.evaluate(async () => {
      const { docsIconCatalog } = await import('/src/components/iconCatalog.ts');
      return { total: docsIconCatalog.length, supported: docsIconCatalog.filter(icon => icon.colorPaths).map(icon => icon.key) };
    });
    const supported = metadata.supported;
    assert(supported.length > 0 && supported.length < metadata.total, 'only suitable icons have authored multicolor geometry');
    const playground = page.locator('.playground').first();
    await setPlaygroundControls(playground, true);
    await playground.getByRole('radio', { name: '彩色', exact: true }).check();
    await setPlaygroundControls(playground, false);
    await playground.getByRole('tab', { name: '代码', exact: true }).click();
    const source = await playground.locator('code').textContent();
    assert.match(source, /variant="filled"/);
    assert.match(source, /--inkra-icon-primary/);
    assert.doesNotMatch(source, /variant="colorful"/, 'copyable code uses the real component API');
    await playground.getByRole('tab', { name: '预览', exact: true }).click();

    const gallery = page.locator('#icon-colorful-icons');
    await gallery.scrollIntoViewIfNeeded();
    assert.deepEqual(await gallery.locator('[data-color-icon]').evaluateAll(nodes => nodes.map(node => node.dataset.colorIcon)), supported);
    const sample = gallery.locator('[data-color-icon="chart-column"] canvas');
    await sample.evaluate(async canvas => {
      while (canvas.dataset.pencilIconReady !== 'true') await new Promise(resolve => requestAnimationFrame(resolve));
    });
    const original = await sample.elementHandle();
    const defaultPixels = await sample.evaluate(canvas => canvas.toDataURL());
    const defaultPalette = await resolvedPalette(gallery);
    const coloredPixels = await sample.evaluate((canvas, palette) => {
      const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      const counts = Object.fromEntries(Object.keys(palette).map(role => [role, 0]));
      for (let index = 0; index < data.length; index += 4) {
        const [red, green, blue, alpha] = data.slice(index, index + 4);
        if (alpha < 20) continue;
        for (const [role, rgb] of Object.entries(palette)) {
          if ([red, green, blue].every((value, channel) => Math.abs(value - rgb[channel]) < 24)) counts[role]++;
        }
      }
      return counts;
    }, defaultPalette);
    for (const [role, count] of Object.entries(coloredPixels)) assert(count > 5, `chart-column has a painted ${role} region in the resolved theme pigment`);
    const grid = gallery.locator('.icon-examples__colorful-grid');
    assert.equal(await grid.evaluate(node => node.style.cssText), '', 'default gallery inherits its palette without inline overrides');
    await assertThemePickers(page, gallery, defaultPalette);
    await page.evaluate(() => { document.documentElement.dataset.inkraTheme = 'dark'; document.documentElement.dataset.theme = 'dark'; });
    await page.waitForFunction(previous => document.querySelector('[data-color-icon="chart-column"] canvas').toDataURL() !== previous, defaultPixels);
    const darkPalette = await resolvedPalette(gallery);
    assert.notDeepEqual(darkPalette, defaultPalette, 'the dark theme supplies its own pigments');
    await assertThemePickers(page, gallery, darkPalette);
    await gallery.screenshot({ path: `/tmp/inkra-icon-colorful-dark-${width}.png`, style: '.app-header { visibility: hidden !important; }' });
    await page.evaluate(() => { document.documentElement.dataset.inkraTheme = 'light'; document.documentElement.dataset.theme = 'light'; });
    await page.waitForFunction(previous => document.querySelector('[data-color-icon="chart-column"] canvas').toDataURL() === previous, defaultPixels);
    for (const [label, role, value] of [['主色', 'primary', '#2d9b65'], ['辅助色', 'secondary', '#8f56b3'], ['点缀色', 'accent', '#e17b26']]) {
      const previous = await sample.evaluate(canvas => canvas.toDataURL());
      await gallery.getByRole('group', { name: label, exact: true }).getByRole('button').click();
      const input = page.locator('.inkra-color-picker__input:visible');
      await input.fill(value);
      await input.press('Enter');
      await input.press('Escape');
      await page.waitForFunction(({ previous }) => document.querySelector('[data-color-icon="chart-column"] canvas').toDataURL() !== previous, { previous });
      assert.equal(await gallery.locator('.icon-examples__colorful-grid').evaluate((node, role) => node.style.getPropertyValue(`--inkra-icon-${role}`), role), `${value}ff`);
      assert(await sample.evaluate((node, original) => node === original, original), 'palette edits retain the icon node');
    }
    await gallery.getByRole('button', { name: '查看源码', exact: true }).click();
    const paletteSource = await gallery.locator('code').textContent();
    for (const color of ['#2d9b65ff', '#8f56b3ff', '#e17b26ff']) assert(paletteSource.includes(color));
    assert.match(paletteSource, /filledPaths=\{icon.colorPaths\}/);
    assert.match(paletteSource, /"mode": "wash"/, 'copyable paths use the pencil-wash rendering mode');
    await gallery.getByRole('button', { name: '隐藏源码', exact: true }).click();
    await gallery.getByRole('button', { name: '恢复默认配色', exact: true }).click();
    await page.waitForFunction(previous => document.querySelector('[data-color-icon="chart-column"] canvas').toDataURL() === previous, defaultPixels);
    assert.equal(await grid.evaluate(node => node.style.cssText), '', 'reset removes all palette overrides');
    await assertThemePickers(page, gallery, defaultPalette);
    await gallery.screenshot({ path: `/tmp/inkra-icon-colorful-${width}.png`, style: '.app-header { visibility: hidden !important; }' });

    const catalog = page.locator('#icon-icon-catalog');
    await catalog.scrollIntoViewIfNeeded();
    const plus = catalog.locator('[data-icon-key="plus"]');
    await catalog.getByRole('radio', { name: '填充', exact: true }).check();
    await plus.focus();
    const monochrome = await plus.locator('.icon-examples__choice-content > canvas').evaluate(canvas => canvas.toDataURL());
    await catalog.getByRole('radio', { name: '彩色', exact: true }).check();
    await plus.focus();
    assert.equal(await plus.locator('.icon-examples__choice-content > canvas').evaluate(canvas => canvas.toDataURL()), monochrome, 'unsupported icons retain the filled variant unchanged');

    for (const [locale, label] of docsLanguages.filter(([locale]) => !languages || languages.includes(locale))) {
      if (await page.evaluate(() => document.documentElement.lang) !== locale) {
        if (width < 800) await page.locator('.menu-button').click();
        const sidebar = page.locator(width < 800 ? '.mobile-drawer' : '.desktop-sidebar');
        await sidebar.locator('.language-control [role="combobox"]').click();
        await page.getByRole('option', { name: label, exact: true }).click();
        await page.waitForFunction(value => document.documentElement.lang === value, locale);
        if (width < 800) {
          await page.locator('.mobile-drawer .drawer-header > button').click();
          await page.locator('.mobile-drawer').waitFor({ state: 'hidden' });
        }
      }
      const copy = iconFillCopy(locale);
      assert.equal(await gallery.locator('h2').innerText(), copy.colorfulIcons);
      for (const label of [copy.primaryColor, copy.secondaryColor, copy.accentColor]) assert.equal(await gallery.getByRole('group', { name: label, exact: true }).count(), 1);
      assert(await catalog.getByRole('radio', { name: copy.colorful, exact: true }).isChecked());
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${locale} ${width}px has no page overflow`);
      console.log(`PASS multicolor docs ${locale} ${width}px`);
    }
    await context.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
