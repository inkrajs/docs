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
    await icon.waitFor();
    await page.waitForTimeout(300);
    const catalogCount = await page.evaluate(async () => (await import('/src/components/iconCatalog.ts')).docsIconCatalog.length);
    assert(catalogCount > 0, 'the icon catalog is nonempty');
    assert.equal(await page.locator('.icon-examples__grid button').count(), catalogCount);
    assert.equal(await icon.getAttribute('aria-hidden'), 'true');
    const before = await icon.evaluate(canvas => { canvas.dataset.sameCanvas = 'yes'; return canvas.toDataURL(); });
    await playground.getByRole('button', { name: '危险', exact: true }).click();
    await page.waitForFunction(previous => document.querySelector('.icon-examples__stage > canvas').toDataURL() !== previous, before);
    assert.equal(await icon.getAttribute('data-same-canvas'), 'yes', 'color updates without remount');
    await playground.locator('.property-tabs').getByRole('tab', { name: '状态', exact: true }).click();
    await playground.getByRole('switch', { name: '装饰性图标', exact: true }).click();
    assert.equal(await icon.getAttribute('role'), 'img');
    assert.equal(await icon.getAttribute('aria-label'), '搜索');
    const height = (await playground.boundingBox()).height;
    await playground.getByRole('tab', { name: '代码', exact: true }).click();
    assert.match(await playground.locator('code').textContent(), /decorative=\{false\}/);
    assert.match(await playground.locator('code').textContent(), /danger-foreground/);
    assert.equal((await playground.boundingBox()).height, height);
    await playground.getByRole('tab', { name: '预览', exact: true }).click();
    await page.screenshot({ path: `/tmp/inkra-icon-demo-${width}.png` });
    const action = page.locator('.icon-examples__action').getByRole('button');
    await action.click();
    assert.equal(await action.getAttribute('aria-pressed'), 'true');
    assert.equal(await action.getAttribute('aria-label'), '取消收藏');
    await page.mouse.move(0, 0);
    await action.evaluate(node => node.blur());
    await action.hover();
    await page.getByRole('tooltip').waitFor();
    await page.keyboard.press('Escape');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    console.log(`PASS Icon color invalidation, semantics, code, catalog and Tooltip at ${width}px`);
    await page.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
