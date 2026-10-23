import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
  : undefined);
const errors = [];
const closeEnough = (left, right) => Math.abs(left - right) < 2;
async function settle(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForFunction(() => !document.querySelector('[data-playground-moving]'));
}
try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('inkra-docs-locale', 'zh-CN'));
    await page.goto(`${base}/docs/components/transfer#preview`);
    const playground = page.locator('.component-playground').first();
    const toggle = playground.locator('.playground-config-toggle');
    const controls = playground.locator('.preview-controls');
    const display = playground.locator('.preview-display');
    const divider = playground.locator('.preview-controls-divider');
    await playground.waitFor();
    await page.waitForFunction(expected => document.querySelector('.component-playground')?.dataset.controlsLayout === expected,
      width > 1000 ? 'wide' : 'full');
    await settle(page);
    assert.equal(await toggle.getAttribute('aria-controls'), await controls.getAttribute('id'));
    assert.equal(await toggle.getAttribute('aria-expanded'), width > 1000 ? 'true' : 'false');

    if (width > 1000) {
      const displayBox = await display.boundingBox();
      const controlsBox = await controls.boundingBox();
      assert(closeEnough(displayBox.width, controlsBox.width * 2), 'wide columns use 2:1 widths');
      assert(closeEnough(displayBox.height, controlsBox.height), 'wide properties fill preview height');
      await toggle.click();
    }
    await controls.waitFor({ state: 'hidden' });
    await settle(page);
    assert.equal(await controls.isVisible(), false);
    assert.equal(await controls.getAttribute('inert'), '');
    const fullWidth = (await display.boundingBox()).width;
    await toggle.click();
    await settle(page);
    const searchSwitch = controls.getByRole('switch').first();
    const initialValue = await searchSwitch.isChecked();
    await searchSwitch.click();
    const changedValue = await searchSwitch.isChecked();
    assert.notEqual(changedValue, initialValue);
    await page.keyboard.press('Escape');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(await toggle.evaluate(node => node === document.activeElement), true);
    await controls.waitFor({ state: 'hidden' });
    await settle(page);
    await toggle.click();
    await settle(page);
    assert.equal(await searchSwitch.isChecked(), changedValue, 'collapsing preserves control state');

    if (width > 1000) {
      // Keep the browser wide: the card's width, not a viewport media query, controls this mode.
      await playground.evaluate(node => node.style.width = '720px');
      await page.waitForFunction(() => document.querySelector('.component-playground')?.dataset.controlsLayout === 'overlay');
      await settle(page);
      assert.equal(await toggle.getAttribute('aria-expanded'), 'true', 'user choice survives resize');
      const overlayWidth = (await display.boundingBox()).width;
      assert(closeEnough(overlayWidth, (await playground.boundingBox()).width), 'overlay does not compress preview');
      const panel = await controls.boundingBox();
      const preview = await display.boundingBox();
      assert(closeEnough(panel.width, 360), 'intermediate panel has readable width');
      assert(closeEnough(panel.x + panel.width, preview.x + preview.width));
      assert.equal(await divider.isVisible(), true);
      assert.equal(await divider.getAttribute('data-orientation'), 'vertical');
      await playground.screenshot({ path: '/tmp/inkra-playground-config-overlay.png' });
      await toggle.click();
      await controls.waitFor({ state: 'hidden' });
      await settle(page);
      assert(closeEnough((await display.boundingBox()).width, overlayWidth), 'overlay open/close keeps preview width');
      await toggle.click();
      await settle(page);
      await playground.evaluate(node => node.style.width = '420px');
      await page.waitForFunction(() => document.querySelector('.component-playground')?.dataset.controlsLayout === 'full');
      await settle(page);
    } else {
      assert(closeEnough((await display.boundingBox()).width, fullWidth), 'mobile overlay does not compress preview');
    }

    const previewBox = await display.boundingBox();
    const propertiesBox = await controls.boundingBox();
    assert(closeEnough(propertiesBox.width, previewBox.width), 'small card fully overlays preview');
    assert(closeEnough(propertiesBox.x, previewBox.x), 'full overlay has no unused left gutter');
    assert.equal(await divider.isVisible(), false, 'full overlay has no left divider');
    assert.equal(await display.getAttribute('inert'), '');
    assert.equal(await display.getAttribute('aria-hidden'), 'true');
    await display.locator('.preview-stage').evaluate(node => node.focus());
    assert.equal(await display.evaluate(node => node.contains(document.activeElement)), false, 'obscured preview cannot receive focus');
    assert.notEqual(await controls.evaluate(node => getComputedStyle(node).backgroundColor), 'rgba(0, 0, 0, 0)', 'overlay has opaque paper');

    await playground.getByRole('tab', { name: '代码', exact: true }).click();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(await playground.getByRole('button', { name: '复制代码', exact: true }).isVisible(), true);
    await toggle.click();
    await controls.waitFor({ state: 'hidden' });
    await settle(page);
    assert.equal(await display.getAttribute('inert'), null);
    assert.equal(await playground.locator('.code-panel').isVisible(), true);
    assert.equal(await playground.locator('.preview-stage').getAttribute('inert'), '');
    await toggle.click();
    await settle(page);
    assert.equal(await searchSwitch.isChecked(), changedValue, 'code switch preserves properties');
    await page.screenshot({ path: `/tmp/inkra-playground-config-${width}.png` });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no document overflow');
    await page.close();
    console.log(`PASS collapsible properties, container layout and focus at ${width}px`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
