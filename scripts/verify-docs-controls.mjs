import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1302, height: 954 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4180/components/radio-group#preview');
  const sidebar = page.locator('.desktop-sidebar');
  const prefs = sidebar.locator('.sidebar-preferences');
  await prefs.waitFor();
  const layout = await page.locator('.docs-layout').boundingBox();
  assert.equal(layout.x, 0);
  assert.equal(layout.width, 1302);
  const checkFullWidth = async container => {
    const footer = container.locator('.sidebar-preferences');
    const box = await footer.boundingBox();
    const frame = await footer.locator('.inkra-radio-group__frame').boundingBox();
    assert(Math.abs(frame.x - box.x - 20) < 1);
    assert(Math.abs(frame.width - (box.width - 40)) < 1);
    const widths = await footer.locator('.inkra-radio-group__item').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().width));
    assert(Math.max(...widths) - Math.min(...widths) < 1);
    const padding = await footer.evaluate(node => {
      const style = getComputedStyle(node);
      return [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft];
    });
    assert.deepEqual(padding, Array(4).fill('20px'));
  };
  await checkFullWidth(sidebar);
  for (const width of [1302, 1600]) {
    await page.setViewportSize({ width, height: 954 });
    const header = await page.locator('.header-inner').boundingBox();
    const brand = await page.locator('.brand').boundingBox();
    const navLabel = await sidebar.locator('.nav-group-label').first().boundingBox();
    assert.equal(header.x, 0);
    assert.equal(header.width, width);
    assert.equal(brand.x, navLabel.x);
    assert.equal(brand.x, 20);
  }
  await page.setViewportSize({ width: 1302, height: 954 });
  assert.equal(await page.locator('.app-header .theme-control, .app-header .language-control').count(), 0);
  assert.equal(await sidebar.getByRole('radio').count(), 3);
  await sidebar.getByRole('radio', { name: '深色主题', exact: true }).check();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await sidebar.getByRole('radio', { name: '浅色主题', exact: true }).check();
  const spacing = await page.evaluate(() => ['.desktop-sidebar .side-navigation', '.documentation'].map(selector => {
    const s = getComputedStyle(document.querySelector(selector));
    return [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft];
  }));
  assert.deepEqual(spacing, Array.from({ length: 2 }, () => Array(4).fill('20px')));
  const before = await prefs.boundingBox();
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  const after = await prefs.boundingBox();
  assert(Math.abs(before.y - after.y) < 1);
  const active = sidebar.locator('[aria-current="page"]');
  assert((await active.locator('.selection-backdrop').boundingBox()).width < (await active.boundingBox()).width);
  await sidebar.getByRole('combobox', { name: '语言' }).click();
  await page.getByRole('option', { name: 'English', exact: true }).click();
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  await sidebar.getByRole('combobox', { name: 'Language' }).click();
  await page.getByRole('option', { name: /中文|Chinese/ }).click();
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: '/tmp/inkra-sidebar-controls-1302.png' });
  for (const route of ['button', 'popover', 'input', 'textarea', 'field', 'radio-group', 'select']) {
    await page.goto(`http://127.0.0.1:4180/components/${route}#preview`);
    const controls = page.locator('.preview-controls .docs-select .inkra-select__trigger');
    assert(await controls.count() > 0, route);
    for (let index = 0; index < await controls.count(); index++) {
      const trigger = controls.nth(index);
      const original = await trigger.innerText();
      await trigger.click();
      const choices = page.getByRole('option');
      const target = (await choices.allTextContents()).findIndex(text => text.trim() !== original.trim());
      await choices.nth(target).click();
      assert.notEqual(await trigger.innerText(), original, route);
    }
  }
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 954 });
    await page.goto('http://127.0.0.1:4180/components/select#preview');
    await page.getByRole('button', { name: '打开文档目录', exact: true }).click();
    const drawer = page.locator('.mobile-drawer');
    await checkFullWidth(drawer);
    const language = drawer.getByRole('combobox', { name: '语言' });
    await language.click();
    await page.keyboard.press('Escape');
    assert(await drawer.isVisible());
    assert(await language.evaluate(node => node === document.activeElement));
    await language.click();
    await page.getByRole('option', { name: 'English', exact: true }).click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    await drawer.getByRole('combobox', { name: 'Language' }).click();
    await page.getByRole('option', { name: /中文|Chinese/ }).click();
    await drawer.getByRole('radio', { name: '深色主题', exact: true }).check();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await drawer.getByRole('radio', { name: '浅色主题', exact: true }).check();
    const bounds = await drawer.locator('.sidebar-preferences').boundingBox();
    assert(bounds.y + bounds.height <= 954);
    await page.screenshot({ path: `/tmp/inkra-sidebar-controls-${width}.png` });
    await drawer.getByRole('button', { name: '关闭文档目录', exact: true }).click();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  assert.deepEqual(errors, []);
  console.log('PASS docs Select controls, language, theme radio, sidebar alignment/fixed footer, mobile drawer focus and menus');
} finally {
  await browser.close();
}
