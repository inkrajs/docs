import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseUrl = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const errors = [];

async function newPage(component, width) {
  const page = await browser.newPage({ viewport: { width, height: 954 } });
  page.on('pageerror', error => errors.push(`${component}@${width}: ${error.message}`));
  await page.goto(`${baseUrl}/components/${component}#preview`);
  await page.locator('.component-playground').first().waitFor();
  return page;
}

async function toggle(scope, name, checked) {
  const input = scope.getByRole('switch', { name, exact: true });
  const element = await input.elementHandle();
  if (await input.isChecked() !== checked) await input.click();
  await input.page().waitForFunction(({ element, checked }) => element.checked === checked, { element, checked });
}

async function choose(page, trigger, option) {
  await trigger.click();
  await page.getByRole('option', { name: option, exact: true }).click();
  await page.waitForFunction(({ element, option }) => element.textContent.includes(option), { element: await trigger.elementHandle(), option });
}

async function assertFocused(page, locator) {
  await page.waitForFunction(element => document.activeElement === element, await locator.elementHandle());
}

async function assertInViewport(page, locator) {
  await locator.evaluate(async element => {
    await document.fonts.ready;
    await Promise.all(element.getAnimations({ subtree: true }).filter(animation => Number.isFinite(animation.effect?.getComputedTiming().endTime)).map(animation => animation.finished.catch(() => {})));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  const box = await locator.boundingBox();
  const viewport = page.viewportSize();
  assert(box.x >= -1 && box.y >= -1 && box.x + box.width <= viewport.width + 1 && box.y + box.height <= viewport.height + 1, 'floating content stays within viewport');
}

async function verifyFrame(page, component, width) {
  const playground = page.locator('.component-playground').first();
  const before = (await playground.boundingBox()).height;
  await playground.getByRole('tab', { name: '代码', exact: true }).click();
  assert(Math.abs((await playground.boundingBox()).height - before) < 1, `${component}@${width}: code height`);
  assert((await playground.locator('code').textContent()).length > 100, 'code is populated');
  await playground.getByRole('tab', { name: '预览', exact: true }).click();
  assert(Math.abs((await playground.boundingBox()).height - before) < 1, `${component}@${width}: preview height`);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${component}@${width}: page overflow`);
  await playground.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `/tmp/inkra-${component}-demos-${width}.png`, animations: 'disabled' });
}

async function verifySelect(width) {
  const page = await newPage('select', width);
  try {
    const playground = page.locator('.component-playground').first();
    const form = playground.locator('.preview-stage form');
    const trigger = form.getByRole('combobox');
    await toggle(playground, '必填', true);
    await form.locator('[data-required="true"]').waitFor();
    await form.getByRole('button', { name: '读取表单', exact: true }).click();
    await form.locator('[aria-invalid="true"]').waitFor();
    await assertFocused(page, trigger);
    await choose(page, trigger, '团队');
    await form.getByRole('button', { name: '读取表单', exact: true }).click();
    await page.waitForFunction(element => element.textContent === '{"visibility":"team"}', await form.locator('output').elementHandle());
    await form.getByRole('button', { name: '重置', exact: true }).click();
    await page.waitForFunction(element => element.hasAttribute('data-placeholder'), await trigger.elementHandle());
    assert.equal(await form.locator('output').textContent(), '');
    await toggle(playground, '展开', true);
    await page.getByRole('listbox').waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('listbox').waitFor({ state: 'hidden' });
    await assertFocused(page, trigger);
    await toggle(playground, '禁用', true);
    await page.waitForFunction(element => element.disabled, await trigger.elementHandle());
    await toggle(playground, '禁用', false);
    const defaults = page.locator('.component-example').filter({ has: page.getByRole('heading', { name: '默认值与表单重置' }) });
    const defaultTrigger = defaults.getByRole('combobox');
    await choose(page, defaultTrigger, '仅自己');
    await defaults.getByRole('button', { name: '重置', exact: true }).click();
    await page.waitForFunction(element => element.textContent.includes('团队'), await defaultTrigger.elementHandle());
    const grouped = page.locator('.component-example').filter({ has: page.getByRole('heading', { name: '分组与滚动选项' }) });
    await grouped.getByRole('combobox').click();
    await page.getByRole('listbox').waitFor();
    assert.equal(await page.getByRole('listbox').getByRole('group').count(), 2);
    assert.equal(await page.getByRole('option').count(), 6);
    assert.equal(await page.getByRole('option', { name: '公开', exact: true }).getAttribute('aria-disabled'), 'true');
    assert(await page.locator('.inkra-select__viewport').evaluate(element => element.scrollHeight > element.clientHeight), 'grouped options scroll locally');
    await assertInViewport(page, page.getByRole('listbox'));
    await page.screenshot({ path: `/tmp/inkra-select-open-${width}.png`, animations: 'disabled' });
    await page.keyboard.press('Escape');
    await page.getByRole('listbox').waitFor({ state: 'hidden' });
    await verifyFrame(page, 'select', width);
    console.log(`PASS Select required/value/reset/grouped options, ${width}px`);
  } finally { await page.close(); }
}

async function verifyPopover(width) {
  const page = await newPage('popover', width);
  try {
    const playground = page.locator('.component-playground').first();
    const trigger = playground.getByRole('button', { name: '筛选', exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: '筛选', exact: true });
    await dialog.waitFor();
    await dialog.getByRole('checkbox', { name: '仅看未完成', exact: true }).check();
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    await assertFocused(page, trigger);
    await trigger.click();
    assert(await dialog.getByRole('checkbox', { name: '仅看未完成', exact: true }).isChecked());
    await dialog.getByRole('button', { name: '完成', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    await assertFocused(page, trigger);
    const editTrigger = page.locator('.component-example').getByRole('button', { name: '编辑名称', exact: true });
    await editTrigger.click();
    const edit = page.getByRole('dialog', { name: '编辑名称', exact: true });
    await edit.waitFor();
    await assertFocused(page, edit.getByRole('textbox', { name: '名称', exact: true }));
    await assertInViewport(page, edit);
    await page.screenshot({ path: `/tmp/inkra-popover-open-${width}.png`, animations: 'disabled' });
    await page.keyboard.press('Escape');
    await edit.waitFor({ state: 'hidden' });
    await assertFocused(page, editTrigger);
    await verifyFrame(page, 'popover', width);
    console.log(`PASS Popover state/initial focus/Escape/return, ${width}px`);
  } finally { await page.close(); }
}

async function verifyOverlay(width) {
  const page = await newPage('overlay', width);
  try {
    const playground = page.locator('.component-playground').first();
    const trigger = playground.getByRole('button', { name: '编辑笔记', exact: true });
    await toggle(playground, 'Escape 关闭', false);
    await toggle(playground, '外部点击关闭', false);
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: '编辑笔记', exact: true });
    await dialog.waitFor();
    await page.keyboard.press('Escape');
    assert(await dialog.isVisible(), 'Escape disabled keeps dialog open');
    await page.mouse.click(2, 2);
    assert(await dialog.isVisible(), 'outside dismissal disabled keeps dialog open');
    await dialog.getByRole('textbox', { name: '名称', exact: false }).fill('Inkra demo');
    await assertInViewport(page, dialog);
    await page.screenshot({ path: `/tmp/inkra-overlay-open-${width}.png`, animations: 'disabled' });
    await dialog.getByRole('button', { name: '保存更改', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    await assertFocused(page, trigger);
    assert.equal(await playground.locator('output').textContent(), '{"name":"Inkra demo"}');
    await toggle(playground, 'Escape 关闭', true);
    await toggle(playground, '外部点击关闭', true);
    await trigger.click();
    await dialog.waitFor();
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    await assertFocused(page, trigger);
    const nestedTrigger = page.locator('.component-example').getByRole('button', { name: '更多设置', exact: true });
    await nestedTrigger.click();
    const outer = page.getByRole('dialog', { name: '更多设置', exact: true });
    await outer.waitFor();
    const innerTrigger = outer.getByRole('button', { name: '提醒设置', exact: true });
    await innerTrigger.click();
    const inner = page.getByRole('dialog', { name: '提醒设置', exact: true });
    await inner.waitFor();
    await page.keyboard.press('Escape');
    await inner.waitFor({ state: 'hidden' });
    assert(await outer.isVisible(), 'first Escape only closes inner popover');
    await assertFocused(page, innerTrigger);
    await page.keyboard.press('Escape');
    await outer.waitFor({ state: 'hidden' });
    await assertFocused(page, nestedTrigger);
    await verifyFrame(page, 'overlay', width);
    console.log(`PASS Overlay submit/dismiss controls/nested Escape/return, ${width}px`);
  } finally { await page.close(); }
}

try {
  for (const width of [1305, 390]) {
    await verifySelect(width);
    await verifyPopover(width);
    await verifyOverlay(width);
  }
  assert.deepEqual(errors, [], 'no browser page errors');
} finally { await browser.close(); }
