import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1302, height: 954 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const base = process.env.INKRA_URL || 'http://127.0.0.1:4180';
const visit = async name => {
  await page.goto(`${base}/components/${name}`);
  await page.locator('main h1').waitFor();
};
try {
  await visit('input');
  await page.getByRole('button', { name: '保存更改', exact: true }).click();
  assert.equal(await page.getByRole('textbox', { name: '名称' }).getAttribute('aria-invalid'), 'true');
  await page.getByRole('textbox', { name: '名称' }).fill('My note');
  await page.getByRole('button', { name: '保存更改', exact: true }).click();
  assert.match(await page.locator('.preview-stage [role=status]').innerText(), /已保存/);
  await page.getByRole('tab', { name: '代码', exact: true }).click();
  assert.match(await page.locator('.code-panel code').innerText(), /My note/);
  await page.screenshot({ path: '/tmp/inkra-phase1-input.png' });
  console.log('PASS input label, validation, editing, source');

  await visit('radio-group');
  await page.getByRole('radio', { name: '团队', exact: true }).check();
  await page.getByRole('button', { name: '读取表单' }).click();
  assert.match(await page.locator('output').innerText(), /team/);
  await page.getByRole('button', { name: '重置', exact: true }).click();
  assert(await page.getByRole('radio', { name: '仅自己', exact: true }).isChecked());
  await page.getByRole('radio', { name: '仅自己', exact: true }).focus();
  await page.keyboard.press('ArrowDown');
  assert(await page.getByRole('radio', { name: '团队', exact: true }).isChecked());
  console.log('PASS radio native values, reset, keyboard');

  for (const name of ['checkbox', 'switch']) {
    await visit(name);
    const role = name === 'switch' ? 'switch' : 'checkbox';
    const toggle = page.getByRole(role, { name: '接收更新', exact: true });
    assert(await toggle.isChecked());
    await toggle.uncheck();
    await page.getByRole('button', { name: '重置', exact: true }).click();
    assert(await toggle.isChecked());
    if (name === 'checkbox') assert(await page.getByRole('checkbox', { name: '半选', exact: true }).evaluate(node => node.indeterminate));
    await page.screenshot({ path: `/tmp/inkra-phase1-${name}.png` });
  }
  console.log('PASS checkbox/switch reset, mixed checkbox');

  await visit('popover');
  const trigger = page.getByRole('button', { name: '筛选', exact: true });
  await trigger.click();
  await page.getByRole('dialog', { name: '筛选', exact: true }).waitFor();
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/tmp/inkra-phase1-popover.png' });
  await page.keyboard.press('Escape');
  await page.getByRole('dialog', { name: '筛选', exact: true }).waitFor({ state: 'hidden' });
  assert(await trigger.evaluate(node => node === document.activeElement));
  console.log('PASS popover open, Escape, focus restoration');

  await visit('overlay');
  await page.getByRole('button', { name: '编辑笔记', exact: true }).click();
  const overlay = page.locator('.inkra-overlay__content');
  await overlay.waitFor();
  assert(await page.evaluate(() => document.body.hasAttribute('data-scroll-locked')));
  await page.getByRole('button', { name: '更多设置', exact: true }).click();
  const popover = page.locator('.inkra-popover__content');
  await popover.waitFor();
  const z = await page.evaluate(() => ['.inkra-overlay__content', '.inkra-popover__content'].map(selector => Number(getComputedStyle(document.querySelector(selector)).zIndex)));
  assert(z[1] > z[0], `Nested popover z-order: ${z}`);
  await page.getByRole('dialog', { name: '更多设置', exact: true }).getByRole('switch').click();
  await page.keyboard.press('Escape');
  await popover.waitFor({ state: 'hidden' });
  assert(await overlay.isVisible());
  assert(await page.getByRole('button', { name: '更多设置', exact: true }).evaluate(node => node === document.activeElement));
  await page.screenshot({ path: '/tmp/inkra-phase1-overlay.png' });
  await page.keyboard.press('Escape');
  await overlay.waitFor({ state: 'hidden' });
  assert(await page.getByRole('button', { name: '编辑笔记', exact: true }).evaluate(node => node === document.activeElement));
  assert(!await page.evaluate(() => document.body.hasAttribute('data-scroll-locked')));
  console.log('PASS nested popover, top-layer Escape, focus, scroll restoration');

  await visit('popover');
  await page.locator('.preview-stage').evaluate(node => {
    node.dataset.inkraTheme = 'dark';
    node.style.setProperty('--inkra-accent', '#bada55');
  });
  await page.getByRole('button', { name: '筛选', exact: true }).click();
  await popover.waitFor();
  const inherited = await popover.evaluate(node => {
    const css = getComputedStyle(node);
    return [css.getPropertyValue('--inkra-paper').trim(), css.getPropertyValue('--inkra-accent').trim()];
  });
  assert.deepEqual(inherited, ['#191d1e', '#bada55']);
  await page.emulateMedia({ forcedColors: 'active' });
  await page.waitForTimeout(100);
  assert.equal(await popover.evaluate(node => getComputedStyle(node).getPropertyValue('--inkra-accent').trim()), 'Highlight');
  await page.emulateMedia({ forcedColors: 'none' });
  await page.keyboard.press('Escape');
  console.log('PASS scoped dark/token inheritance and forced colors in portal');

  await page.evaluate(() => localStorage.setItem('inkra-docs-locale', 'en'));
  for (const name of ['input', 'textarea', 'field', 'checkbox', 'radio-group', 'switch', 'popover', 'overlay']) {
    await visit(name);
    assert(!/[\u3400-\u9fff]/u.test(await page.locator('main').innerText()), `${name} untranslated English content`);
  }
  await page.evaluate(() => localStorage.setItem('inkra-docs-locale', 'zh-CN'));
  console.log('PASS English docs for all new components');

  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const name of ['input', 'textarea', 'field', 'checkbox', 'radio-group', 'switch', 'popover', 'overlay']) {
      await visit(name);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name} overflow at ${width}`);
    }
    await page.getByRole('button', { name: '编辑笔记', exact: true }).click();
    await overlay.waitFor();
    await page.waitForTimeout(600);
    const box = await overlay.boundingBox();
    assert(box.x >= 0 && box.x + box.width <= width + 1, `Overlay bounds ${width}`);
    await page.screenshot({ path: `/tmp/inkra-phase1-mobile-${width}.png` });
    await page.keyboard.press('Escape');
  }
  assert.deepEqual(errors, []);
  console.log('PASS all 8 routes at mobile widths; no page errors');
} finally {
  await browser.close();
}
