import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1302, height: 954 } });
const base = process.env.INKRA_URL || 'http://127.0.0.1:4180';
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const names = ['dropdown-menu', 'alert', 'avatar', 'card', 'table'];
try {
  for (const width of [1302, 390, 320]) {
    await page.setViewportSize({ width, height: 954 });
    for (const name of names) {
      await page.goto(`${base}/components/${name}`);
      const playground = page.locator('.component-playground');
      await playground.waitFor();
      const before = await playground.boundingBox();
      await playground.getByRole('tab', { name: '代码', exact: true }).click();
      assert(Math.abs((await playground.boundingBox()).height - before.height) < 1);
      const controls = playground.getByRole('group', { name: '属性', exact: true });
      const old = await playground.locator('code').textContent();
      if (name === 'avatar') await controls.getByRole('textbox', { name: '名称', exact: true }).fill('Ada');
      else await controls.getByRole('switch').first().click();
      assert.notEqual(await playground.locator('code').textContent(), old);
      await playground.getByRole('tab', { name: '预览', exact: true }).click();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name} overflow ${width}`);
      await page.waitForTimeout(350);
      await page.screenshot({ path: `/tmp/inkra-content-${name}-${width}.png`, fullPage: true });
      await page.locator('.page-tabs').getByRole('tab', { name: 'API', exact: true }).click();
      assert(await page.locator('.component-api table').isVisible());
      await page.locator('.page-tabs').getByRole('tab', { name: '无障碍', exact: true }).click();
      assert((await page.locator('.component-api p').textContent()).length > 20);
    }
    console.log(`PASS five docs at ${width}: live props/source, stable panels, navigation, no overflow`);
  }
  await page.setViewportSize({ width: 1302, height: 954 });
  await page.goto(`${base}/components/dropdown-menu`);
  const trigger = page.locator('.preview-display').getByRole('button', { name: '笔记操作' });
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  const menu = page.getByRole('menu');
  await menu.waitFor();
  await page.waitForTimeout(100);
  assert.equal(await menu.getByRole('menuitem', { name: '复制笔记' }).evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  await menu.waitFor({ state: 'hidden' });
  assert.equal(await page.getByRole('group', { name: '属性', exact: true }).getByRole('switch', { name: '接收更新' }).isChecked(), false);
  await trigger.click();
  await page.getByRole('menuitemradio', { name: '网格', exact: true }).click();
  await trigger.click();
  assert.equal(await page.getByRole('menuitemradio', { name: '网格', exact: true }).getAttribute('aria-checked'), 'true');
  await page.keyboard.press('Escape');
  await menu.waitFor({ state: 'hidden' });
  await page.waitForFunction(() => document.activeElement?.getAttribute('aria-haspopup') === 'menu', undefined, { timeout: 3000 });
  assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
  await page.getByRole('switch', { name: '禁用复制', exact: true }).click();
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  await menu.waitFor();
  await page.waitForTimeout(100);
  assert.equal(await menu.getByRole('menuitemcheckbox').evaluate(el => el === document.activeElement), true);
  await page.screenshot({ path: '/tmp/inkra-menu-open.png' });
  await page.keyboard.press('Escape');

  await page.goto(`${base}/components/avatar`);
  const control = page.getByRole('group', { name: '属性', exact: true });
  const preview = page.locator('.preview-display');
  assert(await preview.getByRole('img', { name: 'Inkra' }).isVisible());
  await page.route('**/avatar-test.png', async route => {
    const png = await page.evaluate(() => { const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32; const context = canvas.getContext('2d'); context.fillStyle = '#458981'; context.fillRect(0, 0, 32, 32); return canvas.toDataURL().split(',')[1]; });
    await route.fulfill({ contentType: 'image/png', body: Buffer.from(png, 'base64') });
  });
  await control.getByRole('textbox', { name: '图片地址' }).fill(`${base}/avatar-test.png`);
  await preview.locator('img').waitFor();
  assert.equal(await preview.locator('.inkra-avatar__fallback').count(), 0);
  await control.getByRole('textbox', { name: '图片地址' }).fill('data:image/png;base64,broken');
  await preview.locator('.inkra-avatar__fallback').waitFor();
  assert.equal(await preview.locator('img').count(), 0);

  await page.goto(`${base}/components/card`);
  await page.locator('.preview-display').getByRole('button', { name: '保存更改' }).click();
  assert.equal(await page.locator('.preview-display [role="status"]').textContent(), '已保存');
  await page.goto(`${base}/components/table`);
  await page.getByRole('switch', { name: '空状态' }).click();
  assert(await page.locator('.preview-display').getByRole('cell', { name: '暂无记录' }).isVisible());

  await page.evaluate(() => localStorage.setItem('inkra-docs-theme', 'dark'));
  for (const name of names) {
    await page.goto(`${base}/components/${name}`);
    await page.locator('.component-playground').waitFor();
    await page.waitForTimeout(400);
    assert(await page.locator('.preview-display canvas').evaluateAll(nodes => nodes.some(canvas => {
      const ctx = canvas.getContext('2d');
      return canvas.width && canvas.height && ctx && ctx.getImageData(0, 0, canvas.width, canvas.height).data.some((v, i) => i % 4 === 3 && v > 0);
    })), `${name} nonblank pencil rendering`);
    if (name === 'dropdown-menu') {
      await page.locator('.preview-display button').click();
      await page.getByRole('menu').waitFor();
      assert.equal(await page.locator('.inkra-menu').evaluate(el => getComputedStyle(el).getPropertyValue('--inkra-ink')), await page.locator('.preview-display button').evaluate(el => getComputedStyle(el).getPropertyValue('--inkra-ink')));
    }
    await page.screenshot({ path: `/tmp/inkra-content-${name}-dark.png`, fullPage: true });
  }
  assert.deepEqual(errors, []);
  console.log('PASS menu keyboard/checkbox/radio/disabled/focus/theme, Avatar image success/failure, Card actions, Table empty state and dark canvas pixels');
} finally { await browser.close(); }
