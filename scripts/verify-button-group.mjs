import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [1302, 390, 320]) {
    await page.setViewportSize({ width, height: 954 });
    await page.goto('http://127.0.0.1:4180/components/button#preview');
    for (const name of ['文本对齐', '步骤']) {
      const group = page.getByRole('group', { name, exact: true });
      await group.evaluate(node => { node.dir = 'ltr'; });
      await group.scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
      const vertical = await group.getAttribute('data-orientation') === 'vertical';
      const buttons = group.getByRole('button');
      const boxes = await buttons.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().toJSON()));
      for (let i = 1; i < boxes.length; i++) {
        assert(Math.abs(vertical ? boxes[i].top - boxes[i - 1].bottom : boxes[i].left - boxes[i - 1].right) < 1, JSON.stringify({ width, name, boxes }));
      }
      const dividers = group.locator('.inkra-button-group__divider:visible');
      assert.equal(await dividers.count(), boxes.length - 1);
      for (const canvas of await dividers.all()) {
        assert(await canvas.evaluate(node => node.getContext('2d').getImageData(0, 0, node.width, node.height).data.some((value, index) => index % 4 === 3 && value > 0)));
      }
      assert.equal(await group.locator('.inkra-pencil-surface__border:visible').count(), 0);
      await buttons.nth(1).click();
      assert.equal(await buttons.nth(1).getAttribute('aria-pressed'), 'true');
      await buttons.first().focus();
      await page.keyboard.press('Tab');
      assert(await buttons.nth(1).evaluate(node => node === document.activeElement));
      await buttons.nth(1).evaluate(node => node.blur());
      await group.screenshot({ path: `/tmp/inkra-button-group-${vertical ? 'vertical' : 'horizontal'}-${width}.png` });
      await group.evaluate(node => { node.dir = 'rtl'; });
      if (!vertical) {
        const rtl = await buttons.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().toJSON()));
        assert(Math.abs(rtl[0].left - rtl[1].right) < 1);
      }
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  assert.deepEqual(errors, []);
  console.log('PASS connected horizontal/vertical ButtonGroup, single painted dividers, click/keyboard, RTL and 1302/390/320 layout');
} finally {
  await browser.close();
}
