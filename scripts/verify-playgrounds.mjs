import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1302, height: 954 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const base = process.env.INKRA_URL || 'http://127.0.0.1:4180';
try {
  for (const width of [1302, 390, 320]) {
    await page.setViewportSize({ width, height: 954 });
    for (const name of ['popover', 'overlay', 'field', 'input', 'textarea', 'select', 'checkbox', 'radio-group', 'switch']) {
      await page.goto(`${base}/components/${name}`);
      const playground = page.locator('.component-playground');
      await playground.waitFor();
      const before = await playground.boundingBox();
      const preview = playground.getByRole('tab', { name: '预览', exact: true });
      const code = playground.getByRole('tab', { name: '代码', exact: true });
      await code.click();
      const after = await playground.boundingBox();
      assert(Math.abs(before.height - after.height) < 1, `${name} height changed at ${width}`);
      const controls = playground.getByRole('group', { name: '属性', exact: true });
      assert(await controls.isVisible());
      const oldCode = await playground.locator('.code-panel code').textContent();
      const toggle = controls.getByRole('switch').first();
      await toggle.click();
      assert.notEqual(await playground.locator('.code-panel code').textContent(), oldCode, `${name} code unchanged`);
      if (width === 1302) {
        const controlBox = await controls.boundingBox();
        const displayBox = await playground.locator('.preview-display').boundingBox();
        assert(controlBox.x >= displayBox.x + displayBox.width, `${name} controls not right`);
      }
      await code.focus();
      await page.keyboard.press('ArrowLeft');
      assert.equal(await preview.getAttribute('aria-selected'), 'true');
      await code.click();
      assert(await playground.locator('.code-panel').isVisible());
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name} overflow ${width}`);
      if (name === 'input' || name === 'popover') {
        await page.waitForTimeout(500);
        await page.screenshot({ path: `/tmp/inkra-playground-${name}-${width}.png` });
      }
    }
    console.log(`PASS 9 playgrounds at ${width}: stable height, live code, persistent controls, keyboard, no overflow`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
