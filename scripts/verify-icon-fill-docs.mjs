import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { iconFillCopy } from '../src/components/iconFillCopy.ts';
import { docsLanguages } from '../src/docsLocales.ts';
import { setPlaygroundControls } from './playground-test-helpers.mjs';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const errors = [];

try {
  for (const width of [1305, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 954 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('inkra-docs-locale', 'zh-CN'));
    await page.goto(`${base}/docs/components/icon#preview`);
    const playground = page.locator('.playground').first();
    await setPlaygroundControls(playground, true);
    const controls = playground.locator('.preview-controls');
    const appearance = controls.getByRole('radiogroup', { name: '图标外观', exact: true });
    await appearance.getByRole('radio', { name: '填充', exact: true }).check();
    const stage = playground.locator('.icon-examples__stage');
    assert.equal(await stage.locator('canvas[data-icon-variant="filled"]').count(), 9);
    await controls.getByRole('switch', { name: '跟随轮廓颜色', exact: true }).click();
    const colorPicker = controls.locator('.inkra-color-picker');
    await colorPicker.getByRole('button').click();
    const colorInput = page.locator('.inkra-color-picker__input:visible');
    await colorInput.fill('#e05070');
    await colorInput.press('Enter');
    await colorInput.press('Escape');
    await setPlaygroundControls(playground, false);
    await playground.getByRole('tab', { name: '代码', exact: true }).click();
    const source = await playground.locator('code').textContent();
    assert.match(source, /variant="filled"/);
    assert.match(source, /fillColor="#e05070ff"/);
    assert.match(source, /filledPaths=\{icon.filledPaths\}/);
    await playground.getByRole('tab', { name: '预览', exact: true }).click();
    await stage.locator('canvas').first().evaluate(async canvas => {
      while (canvas.dataset.pencilIconReady !== 'true') await new Promise(resolve => requestAnimationFrame(resolve));
    });
    const outlineColor = await stage.locator('canvas').first().evaluate(canvas => getComputedStyle(canvas).color);
    assert.notEqual(outlineColor, 'rgb(224, 80, 112)', 'fill color is independent of the outline');
    await playground.screenshot({ path: `/tmp/inkra-icon-fill-playground-${width}.png` });
    await setPlaygroundControls(playground, true);
    await controls.getByRole('switch', { name: '跟随轮廓颜色', exact: true }).click();
    await setPlaygroundControls(playground, false);
    await playground.getByRole('tab', { name: '代码', exact: true }).click();
    assert.doesNotMatch(await playground.locator('code').textContent(), /fillColor=/);
    await playground.getByRole('tab', { name: '预览', exact: true }).click();

    const comparison = page.locator('#icon-outline-and-filled');
    assert.equal(await comparison.locator('.icon-examples__variant-pair canvas[data-icon-variant="outline"]').count(), 6);
    assert.equal(await comparison.locator('.icon-examples__variant-pair canvas[data-icon-variant="filled"]').count(), 6);
    await comparison.scrollIntoViewIfNeeded();
    await comparison.screenshot({ path: `/tmp/inkra-icon-fill-comparison-${width}.png` });
    const folders = page.locator('#icon-folder-colors');
    await folders.scrollIntoViewIfNeeded();
    await folders.screenshot({ path: `/tmp/inkra-icon-fill-folders-${width}.png` });

    const catalog = page.locator('#icon-icon-catalog');
    await catalog.scrollIntoViewIfNeeded();
    const tiles = catalog.locator('[data-icon-key]');
    const geometry = await tiles.evaluateAll(nodes => nodes.map(node => ({
      text: node.textContent.trim(),
      name: node.getAttribute('aria-label'),
      width: node.getBoundingClientRect().width,
      height: node.getBoundingClientRect().height,
      labels: node.querySelectorAll('.inkra-pencil-text, .icon-examples__fallback-label').length,
    })));
    assert(geometry.every(tile => tile.text === '' && tile.labels === 0 && tile.name), 'tiles have no name or ellipsis row but retain accessible names');
    assert(geometry.every(tile => tile.width === 56 && tile.height === 56), 'tiles use compact fixed square hit targets');
    const tile = catalog.locator('[data-icon-key="folder"]');
    await tile.scrollIntoViewIfNeeded();
    await tile.hover();
    await page.getByRole('tooltip', { name: '文件夹', exact: true }).waitFor();
    await page.keyboard.press('Escape');
    await page.mouse.move(0, 0);
    await tile.focus();
    await page.getByRole('tooltip', { name: '文件夹', exact: true }).waitFor();
    await page.keyboard.press('Escape');
    const originalTile = await tile.elementHandle();
    await catalog.getByRole('radio', { name: '填充', exact: true }).check();
    assert(await tile.evaluate((node, original) => node === original, originalTile), 'variant switches keep the native button');
    assert(await catalog.getByRole('radio', { name: '填充', exact: true }).evaluate(node => node === document.activeElement), 'variant switch retains input focus');
    await tile.focus();
    await tile.locator('canvas[data-icon-variant="filled"]').waitFor();
    assert(await tile.evaluate(node => node === document.activeElement), 'enhancement retains tile focus');
    await tile.press('Enter');
    assert.equal(await tile.getAttribute('aria-pressed'), 'true');
    await catalog.getByRole('button', { name: '查看源码', exact: true }).click();
    assert.match(await catalog.locator('code').textContent(), /variant="filled"/);
    assert.match(await catalog.locator('code').textContent(), /filledPaths=\{filledPaths\}/);
    await catalog.getByRole('button', { name: '隐藏源码', exact: true }).click();
    const mounted = await catalog.locator('[data-enhanced="true"]').count();
    assert(mounted < await catalog.locator('[data-icon-key]').count(), 'catalog retains lazy drawing');
    await catalog.getByRole('radio', { name: '线条', exact: true }).check();
    await tile.focus();
    await tile.locator('canvas[data-icon-variant="outline"]').waitFor();
    await tile.press('Enter');
    assert.equal(await tile.getAttribute('aria-pressed'), 'true');
    await catalog.getByRole('radio', { name: '填充', exact: true }).check();
    await catalog.getByRole('searchbox').fill('folder');
    assert(await tile.isVisible(), 'English icon keys remain searchable');
    await catalog.getByRole('searchbox').fill('文件夹');
    assert(await tile.isVisible(), 'Chinese source names remain searchable');
    await catalog.getByRole('searchbox').fill('');
    await catalog.screenshot({ path: `/tmp/inkra-icon-catalog-compact-${width}.png` });

    for (const [locale, label] of docsLanguages) {
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
      assert.equal(await comparison.locator('h2').innerText(), copy.comparison);
      assert.equal(await folders.locator('h2').innerText(), copy.folders);
      const group = catalog.getByRole('radiogroup', { name: copy.appearance, exact: true });
      assert(await group.getByRole('radio', { name: copy.filled, exact: true }).isChecked());
      assert(await group.getByRole('radio', { name: copy.outline, exact: true }).count());
      const localizedFolder = await tile.getAttribute('aria-label');
      await catalog.getByRole('searchbox').fill(localizedFolder);
      assert(await tile.isVisible(), 'localized icon names remain searchable without visible labels');
      await catalog.getByRole('searchbox').fill('');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${locale} ${width}px page overflow`);
      const lines = await group.locator('.inkra-selection-control__label .inkra-pencil-text').evaluateAll(nodes => nodes.map(node => {
        const canvas = node.querySelector('canvas');
        return canvas?.dataset.lines ?? '1';
      }));
      assert(lines.every(count => count === '1'), 'appearance labels remain single-line');
      console.log(`PASS icon fill docs ${locale} ${width}px`);
    }
    await context.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
