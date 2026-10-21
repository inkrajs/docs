import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch();
const errors = [];
try {
  for (const width of [1305, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 954 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:4180/components/select#preview');
    const playground = page.locator('.component-playground');
    await playground.getByRole('switch', { name: '多选', exact: true }).click();
    const trigger = playground.locator('.preview-stage').getByRole('combobox');
    await trigger.click();
    await page.getByRole('option', { name: '仅自己', exact: true }).click();
    await page.getByRole('option', { name: '团队', exact: true }).click();
    assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
    assert.equal(await page.getByRole('option', { name: '公开', exact: true }).getAttribute('aria-disabled'), 'true');
    await page.keyboard.press('Escape');
    assert.match(await trigger.textContent(), /仅自己.*团队/);
    await playground.getByRole('button', { name: '读取表单', exact: true }).click();
    assert.deepEqual(JSON.parse(await playground.locator('.component-demo-status').textContent()), { visibility: ['private', 'team'] });
    await trigger.click();
    await page.getByRole('button', { name: '清空选择', exact: true }).click();
    await page.keyboard.press('Escape');
    assert.match(await trigger.textContent(), /请选择/);
    await playground.getByRole('tab', { name: '代码', exact: true }).click();
    assert.match(await playground.locator('code').textContent(), /multiple items=/);
    assert.match(await playground.locator('code').textContent(), /getAll/);
    const example = page.locator('.component-example').filter({ has: page.getByRole('heading', { name: '多选', exact: true }) });
    const categories = example.getByRole('combobox');
    assert.match(await categories.textContent(), /笔记/);
    await categories.click();
    await page.getByRole('option', { name: '草稿', exact: true }).click();
    await page.keyboard.press('Escape');
    await example.getByRole('button', { name: '读取表单', exact: true }).click();
    assert.deepEqual(JSON.parse(await example.locator('output').textContent()), ['notes', 'drafts']);
    await example.getByRole('button', { name: '重置', exact: true }).click();
    await page.waitForFunction(() => {
      const field = document.querySelector('input[name="categories"]');
      return field && field.value === 'notes' && document.querySelectorAll('input[name="categories"]').length === 1;
    });
    assert.equal((await categories.textContent()).includes('草稿'), false);
    await categories.click();
    await page.waitForTimeout(250);
    await page.screenshot({ path: `/tmp/inkra-select-multiple-${width}.png` });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    console.log(`PASS Select multiple docs mode, values, clear, code, FormData and reset at ${width}px`);
    await page.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
