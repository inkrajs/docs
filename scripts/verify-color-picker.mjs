import assert from 'node:assert/strict';
import { setPlaygroundControls } from './playground-test-helpers.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const baseUrl = process.env.INKRA_DOCS_URL || 'http://127.0.0.1:4180';
const errors = [];

async function toggle(scope, name) {
  const control = scope.getByRole('switch', { name, exact: true });
  await control.click();
}

try {
  for (const width of [1280, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(`${width}: ${error.message}`));
    await page.addInitScript(() => localStorage.setItem('inkra-docs-locale', 'zh-CN'));
    try {
      await page.goto(`${baseUrl}/components/color-picker#preview`);
      const playground = page.locator('.component-playground').first();
      const picker = playground.locator('.inkra-color-picker');
      await picker.waitFor();
      assert.equal(await picker.locator('.inkra-color-picker__presets').count(), 0, 'presets are opt-in');
      await setPlaygroundControls(playground, true);
      const controls = playground.getByRole('group', { name: '属性', exact: true });
      await controls.getByRole('tab', { name: '交互', exact: true }).click();
      await toggle(playground, '显示预设');
      await setPlaygroundControls(playground, false);
      const valueInput = picker.getByRole('textbox', { name: '颜色值' });
      const alpha = picker.getByRole('slider', { name: '透明度' });
      const nativeColor = picker.locator('input[type="color"]');
      await valueInput.fill('#1234');
      await page.keyboard.press('Enter');
      await page.waitForFunction(element => element.value === '#11223344', await valueInput.elementHandle());
      assert.equal(await nativeColor.inputValue(), '#112233');
      assert.equal(await alpha.getAttribute('aria-valuenow'), '27');
      await valueInput.fill('tomato');
      await valueInput.blur();
      assert.equal(await valueInput.getAttribute('aria-invalid'), 'true');
      assert.match(await picker.locator('.inkra-color-picker__error').textContent(), /#RGB/);
      assert.equal(await nativeColor.inputValue(), '#112233', 'invalid draft cannot replace the committed color');
      assert.equal(await alpha.getAttribute('aria-valuenow'), '27', 'invalid draft retains the committed alpha');
      await valueInput.focus();
      await page.keyboard.press('Escape');
      assert.equal(await valueInput.inputValue(), '#11223344');
      await alpha.focus();
      await page.keyboard.press('End');
      await page.waitForFunction(element => element.value === '#112233ff', await valueInput.elementHandle());
      await picker.getByRole('button', { name: '松绿', exact: true }).click();
      await page.waitForFunction(element => element.value === '#629568ff', await valueInput.elementHandle());
      assert.equal(await picker.getByRole('button', { name: '松绿', exact: true }).getAttribute('aria-pressed'), 'true');
      await setPlaygroundControls(playground, true);
      await controls.getByRole('tab', { name: '状态', exact: true }).click();
      await toggle(playground, '禁用');
      await setPlaygroundControls(playground, false);
      assert.equal(await picker.getByRole('button', { name: '松绿', exact: true }).isDisabled(), true);
      assert.equal(await alpha.getAttribute('tabindex'), null);

      const form = page.locator('#color-picker-form-and-custom-presets form');
      const formInput = form.getByRole('textbox', { name: '颜色值', exact: true });
      await formInput.fill('#abcdef80');
      await formInput.press('Enter');
      await form.getByRole('button', { name: '读取表单', exact: true }).click();
      assert.equal(await form.locator('.color-picker-demo__status').textContent(), '表单值: #abcdef80');
      await form.getByRole('button', { name: '重置', exact: true }).click();
      await page.waitForFunction(element => element.value === '#629568bf', await formInput.elementHandle());
      assert.equal(await form.locator('.color-picker-demo__status').textContent(), '尚未读取表单');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal overflow');
      await playground.scrollIntoViewIfNeeded();
      await page.screenshot({ path: `/tmp/inkra-color-picker-${width}.png`, animations: 'disabled' });
      console.log(`PASS ColorPicker input/alpha/preset/disabled/layout, ${width}px`);
    } finally {
      await page.close();
    }
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
