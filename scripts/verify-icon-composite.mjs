import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const errors = [];
try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:4180/components/icon#preview');
    const playground = page.locator('.component-playground');
    const icon = playground.locator('.icon-examples__stage > canvas').first();
    const pixels = () => icon.evaluate(canvas => Array.from(canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data));
    const select = async (label, option) => {
      await playground.getByRole('combobox', { name: label, exact: true }).click();
      await page.getByRole('option', { name: option, exact: true }).click();
      await page.waitForTimeout(80);
    };
    await icon.waitFor();
    await page.waitForFunction(() => {
      const canvas = document.querySelector('.icon-examples__stage > canvas');
      return canvas && [...canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data].some((value, index) => index % 4 === 3 && value > 0);
    });
    const plain = await pixels();
    assert(plain.some((value, index) => index % 4 === 3 && value > 0));
    const bounds = await icon.boundingBox();
    await playground.locator('.property-tabs').getByRole('tab', { name: '组合', exact: true }).click();
    await playground.getByRole('switch', { name: '组合图标', exact: true }).click();
    await page.waitForTimeout(100);
    assert.equal(await icon.getAttribute('data-composite'), 'true');
    const composed = await pixels();
    assert(composed.some((value, index) => index % 4 === 3 && value > plain[index]), 'badge adds pencil ink');
    assert(composed.some((value, index) => index % 4 === 3 && value < plain[index]), 'underlying ink is erased, not covered by an opaque paper disk');
    const changed = (data, top, left) => {
      let count = 0;
      for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) {
        const offset = (y * 40 + x) * 4 + 3;
        if (data[offset] !== plain[offset]) {
          count++;
          assert.equal(y < 20, top, 'changes stay in the requested vertical corner');
          assert.equal(x < 20, left, 'changes follow the logical horizontal corner');
        }
      }
      assert(count > 15);
    };
    changed(composed, false, false);
    for (const [label, top, start] of [['顶部起始侧', true, true], ['顶部结束侧', true, false], ['底部起始侧', false, true], ['底部结束侧', false, false]]) {
      await select('角标位置', label);
      changed(await pixels(), top, start);
    }
    await select('阅读方向', 'RTL');
    changed(await pixels(), false, true);
    const scale = playground.getByRole('slider', { name: '角标比例', exact: true });
    await scale.focus();
    await scale.press('End');
    assert.equal(await scale.getAttribute('aria-valuenow'), '65');
    await playground.locator('.property-tabs').getByRole('tab', { name: '状态', exact: true }).click();
    await playground.getByRole('switch', { name: '装饰性图标', exact: true }).click();
    assert.equal(await icon.getAttribute('aria-label'), '搜索 / 新建');
    const height = (await playground.boundingBox()).height;
    await playground.getByRole('tab', { name: '代码', exact: true }).click();
    assert.match(await playground.locator('code').textContent(), /scale: 0.65/);
    assert.match(await playground.locator('code').textContent(), /dir="rtl"/);
    assert.equal((await playground.boundingBox()).height, height);
    await playground.getByRole('tab', { name: '预览', exact: true }).click();
    assert.equal((await icon.boundingBox()).width, bounds.width);
    assert.equal((await icon.boundingBox()).height, bounds.height);
    await playground.locator('.property-tabs').getByRole('tab', { name: '组合', exact: true }).click();
    await playground.getByRole('switch', { name: '组合图标', exact: true }).click();
    await page.waitForTimeout(80);
    assert.deepEqual(await pixels(), plain, 'removing the badge restores identical original geometry');
    const gallery = page.locator('.component-example').filter({ has: page.locator('.icon-examples__composites') });
    assert.equal(await gallery.locator('canvas[data-composite]').count(), 6);
    await gallery.getByRole('button', { name: '日程已确认', exact: true }).click();
    await gallery.getByRole('button', { name: '查看源码', exact: true }).click();
    assert.match(await gallery.locator('code').textContent(), /aria-label="日程已确认"/);
    await gallery.getByRole('button', { name: '隐藏源码', exact: true }).click();
    await gallery.evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await gallery.screenshot({ path: `/tmp/inkra-icon-composite-${width}.png` });
    const light = await gallery.locator('canvas[data-composite]').first().evaluate(canvas => canvas.toDataURL());
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.waitForFunction(previous => document.querySelector('.icon-examples__composites canvas').toDataURL() !== previous, light);
    await gallery.screenshot({ path: `/tmp/inkra-icon-composite-dark-${width}.png` });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    console.log(`PASS composite icon pixels, transparency, corners, RTL, scale, semantics, live code and gallery at ${width}px`);
    await page.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
