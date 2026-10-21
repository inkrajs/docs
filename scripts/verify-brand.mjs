import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1302, height: 954 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4180/components/radio-group#preview');
  await page.locator('.brand-mark').waitFor();
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator('.brand').innerText(), 'Inkra');
  assert.equal(await page.locator('.brand-label').count(), 0);
  const pixels = () => page.locator('.app-header .brand-mark').evaluate(canvas => {
    const bytes = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    return Array.from(bytes).filter((_, index) => index % 4 === 3 && bytes[index] > 0).length;
  });
  for (const theme of ['light', 'dark']) {
    await page.locator('.desktop-sidebar').getByRole('radio', { name: theme === 'light' ? '浅色主题' : '深色主题', exact: true }).check();
    await page.waitForTimeout(300);
    assert(await pixels() > 60, `${theme}: blank brand`);
    const mark = await page.locator('.app-header .brand-mark').boundingBox();
    const word = await page.locator('.app-header .brand-word').boundingBox();
    assert.equal(mark.width, 32);
    assert(mark.x + mark.width <= word.x);
    await page.locator('.app-header').screenshot({ path: `/tmp/inkra-brand-${theme}.png` });
  }
  for (const route of ['radio-group', 'button']) {
    await page.goto(`http://127.0.0.1:4180/components/${route}#preview`);
    await page.evaluate(() => document.fonts.ready);
    const spacing = await page.locator('.component-example__header, .comparison-heading').first().evaluate(header => {
      const box = header.getBoundingClientRect();
      const title = header.querySelector('h2').getBoundingClientRect();
      return { top: title.top - box.top, bottom: box.bottom - title.bottom };
    });
    assert(Math.abs(spacing.top - spacing.bottom) < 1, JSON.stringify(spacing));
  }
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const brand = await page.locator('.brand').boundingBox();
    assert(brand.height >= 44);
    await page.getByRole('button', { name: '打开文档目录', exact: true }).click();
    await page.locator('.drawer-brand .brand-mark').waitFor();
    await page.screenshot({ path: `/tmp/inkra-brand-drawer-${width}.png` });
    await page.getByRole('button', { name: '关闭文档目录', exact: true }).last().click();
  }
  assert.deepEqual(errors, []);
  console.log('Brand light/dark, mobile drawer, no overflow, and card header centering passed.');
} finally {
  await browser.close();
}
