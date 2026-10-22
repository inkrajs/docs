import assert from 'node:assert/strict';

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
    page.on('pageerror', error => errors.push(`${width}: ${error.message}`));
    try {
      await page.goto(`${baseUrl}/components/color-picker#preview`);
      const playground = page.locator('.component-playground').first();
      const picker = playground.locator('.inkra-color-picker');
      await picker.waitFor();
      const valueInput = picker.getByRole('textbox', { name: '颜色值' });
      const alpha = picker.getByRole('slider', { name: '透明度' });
      await valueInput.fill('#1234');
      await page.keyboard.press('Enter');
      await page.waitForFunction(element => element.textContent.includes('#11223344'), await playground.locator('.color-picker-demo__status').elementHandle());
      assert.equal(await alpha.getAttribute('aria-valuenow'), '27');
      await valueInput.fill('tomato');
      await valueInput.blur();
      assert.equal(await valueInput.getAttribute('aria-invalid'), 'true');
      assert.match(await picker.locator('.inkra-color-picker__error').textContent(), /#RGB/);
      assert.match(await playground.locator('.color-picker-demo__status').textContent(), /#11223344/);
      await valueInput.focus();
      await page.keyboard.press('Escape');
      assert.equal(await valueInput.inputValue(), '#11223344');
      await alpha.focus();
      await page.keyboard.press('End');
      await page.waitForFunction(element => element.textContent.includes('#112233ff'), await playground.locator('.color-picker-demo__status').elementHandle());
      await picker.getByRole('button', { name: 'Pine', exact: true }).click();
      await page.waitForFunction(element => element.textContent.includes('#629568ff'), await playground.locator('.color-picker-demo__status').elementHandle());
      assert.equal(await picker.getByRole('button', { name: 'Pine', exact: true }).getAttribute('aria-pressed'), 'true');
      await playground.getByRole('group', { name: '属性', exact: true }).getByRole('tab', { name: '状态', exact: true }).click();
      await toggle(playground, '禁用');
      assert.equal(await picker.getByRole('button', { name: 'Pine', exact: true }).isDisabled(), true);
      assert.equal(await alpha.getAttribute('tabindex'), null);
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
