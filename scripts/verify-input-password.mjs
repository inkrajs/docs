import { chooseDocsOption } from './playground-test-helpers.mjs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
  : undefined);
const errors = [];
async function settle(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForFunction(() => !document.querySelector('[data-playground-moving]'));
}
async function configure(page, playground, open) {
  const toggle = playground.locator('.playground-config-toggle');
  if ((await toggle.getAttribute('aria-expanded') === 'true') !== open) await toggle.click();
  if (!open) await playground.locator('.preview-controls').waitFor({ state: 'hidden' });
  await settle(page);
}
try {
  for (const width of [1305, 390]) for (const locale of ['zh-CN', 'en']) {
    const zh = locale === 'zh-CN';
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(value => localStorage.setItem('inkra-docs-locale', value), locale);
    await page.goto(`${base}/docs/components/input#preview`);
    const playground = page.locator('.component-playground').first();
    await playground.waitFor();
    await configure(page, playground, true);
    await chooseDocsOption(playground, zh ? '输入类型' : 'Input type', zh ? '密码' : 'Password', { exact: true, optionExact: true });
    await configure(page, playground, false);
    const primary = playground.locator('input[name="title"]');
    const secret = 'fixture-only-4820!';
    assert.equal(await primary.getAttribute('type'), 'password');
    await primary.fill(secret);
    assert.equal(await primary.locator('..').locator('.inkra-editable-text').count(), 0);
    assert(!(await playground.locator('.preview-display').innerText()).includes(secret), 'preview never echoes the password as visible text');
    await playground.getByRole('tab', { name: zh ? '代码' : 'Code', exact: true }).click();
    await settle(page);
    assert(!(await playground.locator('.code-panel').innerText()).includes(secret), 'live source does not contain passwords');
    await configure(page, playground, true);
    await playground.locator('.preview-controls').getByRole('tab', { name: zh ? '内容' : 'Content', exact: true }).click();
    const mirror = playground.locator('.preview-controls input[type="password"]');
    assert.equal(await mirror.inputValue(), secret, 'content editor uses native password masking');
    await configure(page, playground, false);

    const example = page.locator('[data-password-example]');
    const password = example.locator('input[name="demo-password"]');
    const action = example.locator('button[aria-controls]');
    assert.equal(await password.getAttribute('type'), 'password');
    assert.equal(await password.getAttribute('autocomplete'), 'new-password');
    assert.equal(await action.getAttribute('aria-controls'), await password.getAttribute('id'));
    assert.equal(await action.getAttribute('aria-label'), zh ? '显示密码' : 'Show password');
    assert.equal(await example.locator('.inkra-editable-text').count(), 0);
    await password.fill(secret);
    await action.focus();
    await page.keyboard.press('Enter');
    assert.equal(await password.getAttribute('type'), 'text');
    assert.equal(await password.inputValue(), secret);
    assert.equal(await action.getAttribute('aria-label'), zh ? '隐藏密码' : 'Hide password');
    await example.locator('.inkra-editable-text').waitFor();
    const revealedCanvas = await example.locator('.inkra-editable-text').elementHandle();
    await page.keyboard.press('Space');
    assert.equal(await password.getAttribute('type'), 'password');
    assert.equal(await password.inputValue(), secret);
    assert.equal(await example.locator('.inkra-editable-text').count(), 0, 'hiding removes exposed lettering canvas');
    assert.equal(await example.locator('[data-pencil-editable-ready]').count(), 0);
    assert.deepEqual(await revealedCanvas.evaluate(canvas => [canvas.width, canvas.height]), [0, 0], 'discarded revealed pixels are cleared');

    await example.getByRole('switch', { name: zh ? '只读' : 'Read only', exact: true }).click();
    assert.equal(await password.isEditable(), false);
    assert.equal(await action.isEnabled(), true, 'read-only values may still be revealed');
    await action.click();
    assert.equal(await password.getAttribute('type'), 'text');
    await example.getByRole('switch', { name: zh ? '禁用' : 'Disabled', exact: true }).click();
    assert.equal(await password.isDisabled(), true);
    assert.equal(await action.isDisabled(), true);
    assert.equal(await password.getAttribute('type'), 'password', 'disabling restores masking');
    await example.getByRole('switch', { name: zh ? '禁用' : 'Disabled', exact: true }).click();
    assert.equal(await password.getAttribute('type'), 'password', 'enabling does not silently reveal a password');
    assert.equal(await password.inputValue(), secret);
    const section = example.locator('xpath=ancestor::section[contains(@class,"component-example")][1]');
    await section.getByRole('button', { name: zh ? '查看源码' : 'View source', exact: true }).click();
    assert(!(await section.locator('.component-example__code').innerText()).includes(secret), 'composed example source never copies user input');
    assert.equal(await example.locator('button button').count(), 0);
    await example.screenshot({ path: `/tmp/inkra-input-password-${width}-${locale}.png` });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.close();
    console.log(`PASS Input password option, composed toggle, masking, state and localized labels: ${width}px ${locale}`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
