import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  for (const width of [1302, 390, 320]) {
    await page.setViewportSize({ width, height: 954 });
    await page.goto('http://127.0.0.1:4180/design-standard');
    await page.getByRole('tab', { name: '排版与材质', exact: true }).click();
    const section = page.locator('.icon-design');
    await section.scrollIntoViewIfNeeded();
    assert.equal(await section.locator('.icon-design__choice').count(), 12);
    await section.getByRole('button', { name: '下载', exact: true }).click();
    assert.equal(await section.getByRole('button', { name: '下载', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.match(await section.locator('.icon-design__detail').textContent(), /保存文件到设备/);
    await section.getByRole('combobox', { name: '图标尺寸' }).click();
    await page.getByRole('option', { name: '14px', exact: true }).click();
    assert.equal(await section.locator('.icon-design__sample canvas').first().evaluate(el => el.getBoundingClientRect().width), 14);
    await section.getByRole('button', { name: '查看源码' }).click();
    assert.match(await section.locator('pre').textContent(), /sourceSize=\{24\}/);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    assert(await section.locator('canvas').evaluateAll(nodes => nodes.some(c => c.width && c.height && c.getContext('2d')?.getImageData(0, 0, c.width, c.height).data.some((v, i) => i % 4 === 3 && v > 0))));
    await section.screenshot({ path: `/tmp/inkra-icon-design-${width}.png` });
    console.log(`PASS icons at ${width}: selection, sizing, source, nonblank canvas, no overflow`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
