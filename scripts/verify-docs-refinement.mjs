import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1302, height: 954 } });
const base = process.env.INKRA_URL || 'http://127.0.0.1:4180';
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  for (const name of ['button', 'popover', 'overlay', 'input', 'textarea', 'field', 'select', 'checkbox', 'radio-group', 'switch']) {
    await page.goto(`${base}/components/${name}#api`);
    const tabs = page.locator('.page-tabs');
    await tabs.waitFor();
    assert.equal(await tabs.getByRole('tab', { name: 'API', exact: true }).getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('main table').count() > 0, true);
    assert.equal(await page.locator('.component-playground').count(), 0);
    await tabs.getByRole('tab', { name: '无障碍', exact: true }).click();
    assert.equal(new URL(page.url()).pathname, `/components/${name}`);
    assert.equal(await page.locator('main table').count(), 0);
    await page.goBack();
    assert.equal(await tabs.getByRole('tab', { name: 'API', exact: true }).getAttribute('aria-selected'), 'true');
    await tabs.getByRole('tab', { name: 'API', exact: true }).focus();
    await page.keyboard.press('Home');
    assert.equal(await tabs.getByRole('tab', { name: '示例', exact: true }).getAttribute('aria-selected'), 'true');
  }
  console.log('PASS 10 page tab sets: deep links, exclusive panels, history and keyboard');
  await page.goto(`${base}/components/button`);
  const divider = page.locator('.desktop-sidebar .sidebar-divider');
  const top = (await divider.boundingBox()).y;
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(300);
  assert(Math.abs((await divider.boundingBox()).y - top) < 1, 'Sidebar divider moved with page');
  assert((await divider.boundingBox()).height <= 900, 'Divider tracks document height');
  const bottomGap = await page.evaluate(() => innerHeight - document.querySelector('.documentation').lastElementChild.getBoundingClientRect().bottom);
  assert(bottomGap <= 40, `Extra scroll tail: ${bottomGap}`);
  await page.goto(`${base}/getting-started`);
  assert(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1), 'Short page has extra scrolling');
  await page.goto(`${base}/components/textarea`);
  assert.equal(await page.locator('.component-example__frame > header h2').innerText(), '状态');
  console.log('PASS content-sized scrolling, stationary sidebar divider, card headers');

  await page.goto(`${base}/components/select`);
  const trigger = page.locator('.preview-stage').getByRole('combobox');
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  await page.getByRole('listbox').waitFor();
  await page.getByRole('option', { name: '仅自己', exact: true }).waitFor();
  await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'option');
  await page.keyboard.press('End');
  await page.waitForFunction(() => document.activeElement?.textContent?.includes('团队'));
  await page.keyboard.press('Enter');
  await page.getByRole('listbox').waitFor({ state: 'hidden' });
  assert.match(await trigger.innerText(), /团队/);
  await page.getByRole('button', { name: '读取表单', exact: true }).click();
  assert.match(await page.locator('.preview-stage output').innerText(), /team/);
  await trigger.click();
  await page.keyboard.press('Escape');
  await page.getByRole('listbox').waitFor({ state: 'hidden' });
  assert(await trigger.evaluate(node => node === document.activeElement));
  await page.locator('.preview-stage').getByRole('button', { name: '重置', exact: true }).click();
  assert.match(await trigger.innerText(), /请选择/);
  const uncontrolled = page.locator('.component-example').getByRole('combobox');
  await uncontrolled.click();
  await page.getByRole('option', { name: '仅自己', exact: true }).click();
  assert.match(await uncontrolled.innerText(), /仅自己/);
  await page.locator('.component-example').getByRole('button', { name: '重置', exact: true }).click();
  await page.waitForTimeout(100);
  assert.match(await uncontrolled.innerText(), /团队/);
  console.log('PASS Select keyboard, disabled skip, form data, focus restoration, controlled/uncontrolled reset');
  for (const theme of ['light', 'dark']) {
    await page.evaluate(theme => { document.documentElement.dataset.inkraTheme = theme; document.documentElement.dataset.theme = theme; }, theme);
    await trigger.click();
    await page.getByRole('listbox').waitFor();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `/tmp/inkra-select-${theme}.png` });
    await page.keyboard.press('Escape');
    await page.getByRole('listbox').waitFor({ state: 'hidden' });
  }
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`${base}/components/select`);
    await trigger.click();
    const list = page.getByRole('listbox');
    await list.waitFor();
    const box = await list.boundingBox();
    assert(box.x >= 0 && box.x + box.width <= width + 1, `Select overflows ${width}`);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `/tmp/inkra-select-${width}.png` });
    await page.keyboard.press('Escape');
  }
  assert.deepEqual(errors, []);
  console.log('PASS light/dark Select and mobile menu bounds, no page errors');
} finally { await browser.close(); }
